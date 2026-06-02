/**
 * Attendance Service
 * Handles check-in/out validation, Supabase persistence, offline sync, and TrustScore updates.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { TRUST_SCORE_MAX, getTrustScoreTier } from '@/constants/theme';
import { supabase, profileService } from '@/services/supabase';
import { STORAGE_KEYS, VALIDATION } from '@/utils/constants';
import { calculateDistance, isIpInRange } from '@/utils/helpers';
import {
  AttendanceHistoryResult,
  AttendanceLog,
  AttendanceLocation,
  AttendanceNetworkInfo,
  AttendanceValidation,
  AttendanceValidationFlowResult,
  AttendanceValidationResult,
  CheckInData,
  CheckOutData,
  OfflineAttendanceLog,
  OrganizationSettings,
  TrustScoreCalculation,
} from '@/utils/types';

const DEFAULT_WORK_START_TIME = '09:00';
const GRACE_PERIOD_MINUTES = 15;
const OFFLINE_MAX_AGE_HOURS = 24;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type AttendanceNotes = {
  validation_flags?: AttendanceValidation;
  check_in_validation_flags?: AttendanceValidation;
  check_out_validation_flags?: AttendanceValidation;
  review_status?: 'none' | 'needs_review' | 'urgent_review';
  review_reasons?: string[];
  offline?: {
    id?: string;
    timestamp?: string;
    integrity_hash?: string;
    sequence_number?: number;
  };
  auto_checkout?: boolean;
  client?: {
    platform: string;
    app_version?: string;
  };
};

function parseNotes(notes?: string | null): AttendanceNotes {
  if (!notes) return {};

  try {
    return JSON.parse(notes);
  } catch {
    return {};
  }
}

function createNonce() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(',')}}`;
}

function generateIntegrityHash(value: unknown): string {
  const input = stableStringify(value);
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function getOfflineHashPayload(log: Omit<OfflineAttendanceLog, 'id' | 'integrity_hash' | 'retry_count'>) {
  return {
    action: log.action,
    user_id: log.user_id,
    organization_id: log.organization_id,
    ...(log.log_id ? { log_id: log.log_id } : {}),
    timestamp: log.timestamp,
    location: log.location,
    network: log.network,
    validation: log.validation,
    nonce: log.nonce,
    sequence_number: log.sequence_number,
  };
}

function getSettingsRadius(settings: OrganizationSettings | null) {
  return (
    settings?.gps_radius_meters ??
    settings?.gps_radius ??
    VALIDATION.DEFAULT_GPS_RADIUS
  );
}

function getSettingsLatitude(settings: OrganizationSettings | null) {
  return settings?.gps_lat ?? settings?.workplace_lat ?? null;
}

function getSettingsLongitude(settings: OrganizationSettings | null) {
  return settings?.gps_lng ?? settings?.workplace_lng ?? null;
}

function getReviewStatus(score: number): AttendanceNotes['review_status'] {
  return getTrustScoreTier(score).reviewStatus;
}

function getTrustScoreLabel(score: number): TrustScoreCalculation['label'] {
  return getTrustScoreTier(score).label;
}

function getMinutesBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function isSameLocalDay(left: string, right: string) {
  const a = new Date(left);
  const b = new Date(right);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date.getTime() < today.getTime();
}

function isLate(checkInTime: string, workStartTime?: string | null) {
  const [hours, minutes] = (workStartTime || DEFAULT_WORK_START_TIME).split(':').map(Number);
  const checkInDate = new Date(checkInTime);
  const expected = new Date(checkInDate);
  expected.setHours(hours || 0, minutes || 0, 0, 0);
  expected.setMinutes(expected.getMinutes() + GRACE_PERIOD_MINUTES);

  return checkInDate.getTime() > expected.getTime();
}

function getValidationReviewReasons(validation: AttendanceValidation) {
  const reasons: string[] = [];

  if (validation.gps_valid === false) {
    reasons.push(validation.details?.gps?.message || 'GPS outside workplace radius');
  }
  if (validation.wifi_valid === false) {
    reasons.push(validation.details?.wifi?.message || 'WiFi network mismatch');
  }
  if (validation.ip_valid === false) {
    reasons.push(validation.details?.ip?.message || 'Unusual IP address');
  }
  if (validation.spoofing_detected) {
    reasons.push(validation.details?.spoofing?.message || 'Location anomaly detected');
  }

  return reasons;
}

function getNoteValidationFlags(notes: AttendanceNotes): AttendanceValidation[] {
  return [
    notes.check_in_validation_flags,
    notes.check_out_validation_flags,
    notes.validation_flags,
  ].filter((validation): validation is AttendanceValidation => !!validation);
}

function getNotesReviewReasons(notes: AttendanceNotes) {
  return Array.from(new Set(getNoteValidationFlags(notes).flatMap(getValidationReviewReasons)));
}

function buildNotes(
  validation: AttendanceValidation,
  phase: 'check_in' | 'check_out',
  existingNotes?: AttendanceNotes,
  extra?: Partial<AttendanceNotes>
): string {
  const nextNotes: AttendanceNotes = {
    ...existingNotes,
    ...(phase === 'check_in'
      ? { check_in_validation_flags: validation }
      : { check_out_validation_flags: validation }),
    client: {
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version,
    },
    ...extra,
  };
  const reasons = getNotesReviewReasons(nextNotes);

  return JSON.stringify({
    ...nextNotes,
    review_status: extra?.review_status ?? (reasons.length > 0 ? 'needs_review' : 'none'),
    review_reasons: reasons,
  });
}

async function getStoredQueue(): Promise<OfflineAttendanceLog[]> {
  const rawQueue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  if (!rawQueue) return [];

  try {
    return JSON.parse(rawQueue);
  } catch {
    return [];
  }
}

async function setStoredQueue(queue: OfflineAttendanceLog[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

export const attendanceService = {
  async getProfileTrustScore(userId: string): Promise<number> {
    const profile = await profileService.getProfile(userId);
    return profile?.trust_score ?? 50;
  },

  async getOrgSettings(organizationId: string): Promise<OrganizationSettings | null> {
    const { data, error } = await supabase
      .from('org_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getCurrentLocation(): Promise<AttendanceLocation> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      mocked: location.mocked,
      timestamp: location.timestamp,
    };
  },

  async getNetworkInfo(): Promise<AttendanceNetworkInfo> {
    const network = await NetInfo.fetch();
    const details = network.details as Record<string, string | null | undefined> | null;

    return {
      type: network.type,
      ssid: details?.ssid ?? null,
      bssid: details?.bssid ?? null,
      ipAddress: details?.ipAddress ?? null,
    };
  },

  async validateGPS(
    location: AttendanceLocation,
    settings: OrganizationSettings | null
  ): Promise<AttendanceValidationResult> {
    const settingsLat = getSettingsLatitude(settings);
    const settingsLng = getSettingsLongitude(settings);

    if (settingsLat == null || settingsLng == null) {
      return {
        isValid: true,
        message: 'Workplace GPS is not configured yet',
      };
    }

    const distanceMeters = calculateDistance(
      location.latitude,
      location.longitude,
      Number(settingsLat),
      Number(settingsLng)
    );
    const radius = getSettingsRadius(settings);
    const isValid = distanceMeters <= radius;

    return {
      isValid,
      distanceMeters,
      message: isValid
        ? `Location verified within ${Math.round(distanceMeters)}m`
        : `You are ${Math.round(distanceMeters)}m from workplace. Allowed radius is ${radius}m.`,
    };
  },

  async validateWiFi(
    network: AttendanceNetworkInfo,
    settings: OrganizationSettings | null
  ): Promise<AttendanceValidationResult> {
    if (!settings?.wifi_ssid && !settings?.wifi_bssid) {
      return {
        isValid: true,
        message: 'Workplace WiFi is not configured yet',
      };
    }

    const requiredSsid = settings.wifi_ssid?.trim();
    const requiredBssid = settings.wifi_bssid?.trim().toLowerCase();
    const currentSsid = network.ssid?.trim();
    const currentBssid = network.bssid?.trim().toLowerCase();
    const missingRequiredSsid = !!requiredSsid && !currentSsid;
    const missingRequiredBssid = !!requiredBssid && !currentBssid;

    if (missingRequiredSsid || missingRequiredBssid) {
      return {
        isValid: false,
        isSuspicious: true,
        message: 'WiFi info unavailable on this device. Attendance will be flagged for review.',
      };
    }

    const ssidValid = !requiredSsid || currentSsid === requiredSsid;
    const bssidValid = !requiredBssid || currentBssid === requiredBssid;
    const isValid = ssidValid && bssidValid;

    return {
      isValid,
      message: isValid
        ? 'WiFi network verified'
        : `Connected WiFi does not match the registered workplace network.`,
    };
  },

  async validateIP(
    network: AttendanceNetworkInfo,
    settings: OrganizationSettings | null
  ): Promise<AttendanceValidationResult> {
    const configuredRange = settings?.ip_range?.trim();
    if (configuredRange && !network.ipAddress) {
      return {
        isValid: false,
        isSuspicious: true,
        message: 'Local IP address unavailable for configured IP range',
      };
    }

    const isValid = isIpInRange(network.ipAddress, configuredRange);

    return {
      isValid,
      isSuspicious: !isValid,
      message: isValid ? 'Local IP address verified' : 'Local IP address is outside the configured range',
    };
  },

  detectLocationSpoofing(
    currentLocation: AttendanceLocation,
    previousLocation?: AttendanceLocation | null
  ): AttendanceValidationResult {
    if (currentLocation.mocked) {
      return {
        isValid: false,
        isSuspicious: true,
        message: 'Mock location detected',
      };
    }

    if (previousLocation?.timestamp && currentLocation.timestamp) {
      const seconds = Math.max(1, (currentLocation.timestamp - previousLocation.timestamp) / 1000);
      const distance = calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (distance / seconds > 50) {
        return {
          isValid: false,
          isSuspicious: true,
          message: 'Impossible travel speed detected',
        };
      }
    }

    return {
      isValid: true,
      isSuspicious: false,
      message: 'No location anomaly detected',
    };
  },

  async runValidationFlow(
    organizationId: string,
    previousLocation?: AttendanceLocation | null
  ): Promise<AttendanceValidationFlowResult> {
    const settings = await this.getOrgSettings(organizationId);
    const location = await this.getCurrentLocation();
    const gps = await this.validateGPS(location, settings);

    const network = await this.getNetworkInfo();
    const wifi = await this.validateWiFi(network, settings);
    const ip = await this.validateIP(network, settings);
    const spoofing = this.detectLocationSpoofing(location, previousLocation);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!gps.isValid) errors.push(gps.message);
    if (!wifi.isValid) errors.push(wifi.message);
    if (!ip.isValid) warnings.push(ip.message);
    if (spoofing.isSuspicious) warnings.push(spoofing.message);

    const validation: AttendanceValidation = {
      gps_valid: gps.isValid,
      wifi_valid: wifi.isValid,
      ip_valid: ip.isValid,
      spoofing_detected: !!spoofing.isSuspicious,
      requires_review: errors.length > 0 || warnings.length > 0 || !!spoofing.isSuspicious,
      details: {
        gps,
        wifi,
        ip,
        spoofing,
      },
      errors,
      warnings,
    };

    return {
      canSubmit: true,
      requiresReview: !!validation.requires_review,
      location,
      network,
      ipAddress: network.ipAddress,
      validation,
    };
  },

  async getTodayAttendance(userId: string): Promise<AttendanceLog | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in_time', today.toISOString())
      .lt('check_in_time', tomorrow.toISOString())
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteTodayAttendance(userId: string, organizationId: string): Promise<{ deletedCount: number; trustScore: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const from = today.toISOString();
    const to = tomorrow.toISOString();

    const { count, error: countError } = await supabase
      .from('attendance_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .gte('check_in_time', from)
      .lt('check_in_time', to);

    if (countError) throw countError;

    const { error: deleteError } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .gte('check_in_time', from)
      .lt('check_in_time', to);

    if (deleteError) throw deleteError;

    const queue = await getStoredQueue();
    const remainingQueue = queue.filter((item) => {
      if (item.user_id !== userId) return true;
      const timestamp = new Date(item.timestamp);
      return timestamp < today || timestamp >= tomorrow;
    });

    if (remainingQueue.length !== queue.length) {
      await setStoredQueue(remainingQueue);
    }

    const trustScore = await this.recalculateTrustScore(userId);

    return {
      deletedCount: count ?? 0,
      trustScore: trustScore.score,
    };
  },

  async performCheckIn(data: CheckInData): Promise<AttendanceLog> {
    const timestamp = data.clientTimestamp ?? new Date().toISOString();
    const settings = await this.getOrgSettings(data.organizationId);
    const late = isLate(timestamp, settings?.work_start_time);

    const { data: log, error } = await supabase
      .from('attendance_logs')
      .insert({
        user_id: data.userId,
        organization_id: data.organizationId,
        check_in_time: timestamp,
        check_in_lat: data.location.latitude,
        check_in_lng: data.location.longitude,
        check_in_wifi_ssid: data.network.ssid,
        check_in_wifi_bssid: data.network.bssid,
        check_in_ip: data.network.ipAddress,
        is_late: late,
        trust_score_impact: 0,
        notes: buildNotes(data.validation, 'check_in', undefined, {
          offline: data.offlineId
            ? {
                id: data.offlineId,
                timestamp,
              }
            : undefined,
        }),
      })
      .select()
      .single();

    if (error) throw error;

    await this.recalculateTrustScore(data.userId);
    return log;
  },

  async performCheckOut(data: CheckOutData): Promise<AttendanceLog> {
    const timestamp = data.clientTimestamp ?? new Date().toISOString();
    const { data: currentLog, error: currentLogError } = await supabase
      .from('attendance_logs')
      .select('notes')
      .eq('id', data.logId)
      .eq('user_id', data.userId)
      .maybeSingle();

    if (currentLogError) throw currentLogError;

    const { data: log, error } = await supabase
      .from('attendance_logs')
      .update({
        check_out_time: timestamp,
        check_out_lat: data.location.latitude,
        check_out_lng: data.location.longitude,
        check_out_wifi_ssid: data.network.ssid,
        check_out_wifi_bssid: data.network.bssid,
        check_out_ip: data.network.ipAddress,
        notes: buildNotes(data.validation, 'check_out', parseNotes(currentLog?.notes), {
          auto_checkout: data.autoCheckout,
          offline: data.offlineId
            ? {
                id: data.offlineId,
                timestamp,
              }
            : undefined,
        }),
      })
      .eq('id', data.logId)
      .eq('user_id', data.userId)
      .select()
      .single();

    if (error) throw error;

    await this.recalculateTrustScore(data.userId);
    return log;
  },

  async fetchAttendanceHistory(
    userId: string,
    filters?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<AttendanceHistoryResult> {
    let query = supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false });

    if (filters?.startDate) query = query.gte('check_in_time', filters.startDate.toISOString());
    if (filters?.endDate) query = query.lte('check_in_time', filters.endDate.toISOString());
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;

    const logs = data ?? [];
    const completedDurations = logs
      .map((log) => getMinutesBetween(log.check_in_time, log.check_out_time))
      .filter((duration) => duration > 0);
    const averageDurationMinutes =
      completedDurations.length > 0
        ? Math.round(completedDurations.reduce((sum, duration) => sum + duration, 0) / completedDurations.length)
        : 0;

    return {
      logs,
      stats: {
        totalLogs: logs.length,
        lateCheckIns: logs.filter((log) => !!log.is_late).length,
        averageDurationMinutes,
        reviewLogs: logs.filter((log) => parseNotes(log.notes).review_status !== 'none').length,
      },
    };
  },

  calculateTrustScore(logs: AttendanceLog[]): TrustScoreCalculation {
    const recentLogs = logs.filter((log) => {
      const ageMs = Date.now() - new Date(log.check_in_time).getTime();
      return ageMs <= THIRTY_DAYS_MS;
    });

    const sorted = [...recentLogs].sort(
      (a, b) => new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime()
    );
    let offenseCount = 0;
    let penalty = 0;

    sorted.forEach((log, index) => {
      const notes = parseNotes(log.notes);
      const flags = getNoteValidationFlags(notes);
      const duplicateSameDay = sorted
        .slice(0, index)
        .some((previous) => isSameLocalDay(previous.check_in_time, log.check_in_time));
      const missingCheckout = !log.check_out_time && isBeforeToday(log.check_in_time);
      const hasGpsViolation = flags.some((validation) => validation.gps_valid === false);
      const hasWifiViolation = flags.some((validation) => validation.wifi_valid === false);
      const hasIpViolation = flags.some((validation) => validation.ip_valid === false);
      const hasSpoofingViolation = flags.some((validation) => !!validation.spoofing_detected);

      const offenseWeights = [
        log.is_late ? 1 : 0,
        hasGpsViolation ? 4 : 0,
        hasWifiViolation ? 3 : 0,
        hasIpViolation ? 1 : 0,
        hasSpoofingViolation ? 6 : 0,
        duplicateSameDay ? 2 : 0,
        missingCheckout ? 2 : 0,
      ].filter((weight) => weight > 0);

      offenseWeights.forEach((weight) => {
        offenseCount += 1;

        const stackingMultiplier =
          offenseCount <= 2 ? 0.5 : offenseCount <= 5 ? 1 : offenseCount <= 8 ? 1.5 : 2;

        penalty += weight * stackingMultiplier;
      });
    });

    const roundedPenalty = Math.round(penalty);
    const score = Math.max(0, TRUST_SCORE_MAX - roundedPenalty);
    const reviewStatus = getReviewStatus(score);

    return {
      score,
      label: getTrustScoreLabel(score),
      offenseCount,
      penalty: roundedPenalty,
      reviewRequired: reviewStatus !== 'none',
      urgentReviewRequired: reviewStatus === 'urgent_review',
    };
  },

  async recalculateTrustScore(userId: string): Promise<TrustScoreCalculation> {
    const { logs } = await this.fetchAttendanceHistory(userId, { limit: 60 });
    const result = this.calculateTrustScore(logs);
    await profileService.updateProfile(userId, { trust_score: result.score });

    const newestLog = logs[0];
    if (newestLog) {
      const notes = parseNotes(newestLog.notes);
      const reviewStatus = getReviewStatus(result.score);

      await supabase
        .from('attendance_logs')
        .update({
          trust_score_impact: -result.penalty,
          notes: JSON.stringify({
            ...notes,
            review_status: reviewStatus,
            trust_score: result,
          }),
        })
        .eq('id', newestLog.id);
    }

    return result;
  },

  async createOfflineLog(
    action: OfflineAttendanceLog['action'],
    payload: Omit<OfflineAttendanceLog, 'id' | 'action' | 'integrity_hash' | 'nonce' | 'sequence_number' | 'retry_count'>
  ): Promise<OfflineAttendanceLog> {
    const queue = await getStoredQueue();
    const nonce = createNonce();
    const sequenceNumber = Math.max(0, ...queue.map((item) => item.sequence_number)) + 1;
    const offlineLog: OfflineAttendanceLog = {
      id: createNonce(),
      action,
      ...payload,
      nonce,
      sequence_number: sequenceNumber,
      retry_count: 0,
      integrity_hash: generateIntegrityHash(
        getOfflineHashPayload({
          action,
          ...payload,
          nonce,
          sequence_number: sequenceNumber,
        })
      ),
    };

    await setStoredQueue([...queue, offlineLog]);
    return offlineLog;
  },

  async getOfflineQueue() {
    return getStoredQueue();
  },

  async syncOfflineQueue() {
    const queue = await getStoredQueue();
    const synced: AttendanceLog[] = [];
    const rejected: Array<{ log: OfflineAttendanceLog; reason: string }> = [];
    const failed: Array<{ log: OfflineAttendanceLog; error: string }> = [];
    const remaining: OfflineAttendanceLog[] = [];
    const syncedOpenLogs = new Map<string, string>();

    for (const item of queue) {
      const expectedHash = generateIntegrityHash(getOfflineHashPayload(item));
      const ageHours = (Date.now() - new Date(item.timestamp).getTime()) / 3600000;

      if (expectedHash !== item.integrity_hash) {
        rejected.push({ log: item, reason: 'integrity_check_failed' });
        continue;
      }

      if (ageHours > OFFLINE_MAX_AGE_HOURS) {
        rejected.push({ log: item, reason: 'exceeded_24_hour_limit' });
        continue;
      }

      try {
        const openLogKey = `${item.user_id}:${item.organization_id}`;
        const checkoutLogId = item.log_id ?? syncedOpenLogs.get(openLogKey);

        if (item.action === 'check_out' && !checkoutLogId) {
          rejected.push({ log: item, reason: 'missing_matching_check_in' });
          continue;
        }

        const log =
          item.action === 'check_in'
            ? await this.performCheckIn({
                userId: item.user_id,
                organizationId: item.organization_id,
                location: item.location,
                network: item.network,
                validation: item.validation,
                offlineId: item.id,
                clientTimestamp: item.timestamp,
              })
            : await this.performCheckOut({
                userId: item.user_id,
                organizationId: item.organization_id,
                logId: checkoutLogId as string,
                location: item.location,
                network: item.network,
                validation: item.validation,
                offlineId: item.id,
                clientTimestamp: item.timestamp,
              });

        if (item.action === 'check_in') {
          syncedOpenLogs.set(openLogKey, log.id);
        } else {
          syncedOpenLogs.delete(openLogKey);
        }

        synced.push(log);
      } catch (error) {
        failed.push({
          log: item,
          error: error instanceof Error ? error.message : 'Sync failed',
        });
        remaining.push({ ...item, retry_count: item.retry_count + 1 });
      }
    }

    await setStoredQueue(remaining);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    return { synced, rejected, failed, pending: remaining };
  },
};
