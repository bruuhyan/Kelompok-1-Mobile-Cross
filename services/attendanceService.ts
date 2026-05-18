import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import {
  AttendanceHistoryStats,
  AttendanceLog,
  AttendanceValidationFlags,
  CheckInData,
  CheckOutData,
  Coordinates,
  OfflineAttendanceLog,
  OrganizationSettings,
  ValidationFlowResult,
  ValidationResult,
  WiFiInfo,
} from '@/utils/types';
import { supabase } from '@/services/supabase';
import { ERROR_MESSAGES, VALIDATION } from '@/utils/constants';
import { calculateDistance } from '@/utils/helpers';

const DEFAULT_VALIDATION: ValidationFlowResult = {
  gps: null,
  wifi: null,
  ip: null,
  spoofing: null,
  canSubmit: false,
  requiresReview: false,
  warnings: [],
};

function getValidationFlags(validation: ValidationFlowResult): AttendanceValidationFlags {
  return {
    gps_valid: validation.gps?.isValid ?? false,
    wifi_valid: validation.wifi?.isValid ?? false,
    ip_valid: validation.ip?.isValid ?? true,
    ip_suspicious: validation.ip?.isSuspicious ?? false,
    spoofing_detected: validation.spoofing?.isSuspicious ?? false,
  };
}

function normalizeCoordinate(location: Location.LocationObject): Coordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    mocked: location.mocked,
    timestamp: location.timestamp,
  };
}

function isSameDay(value: string, date = new Date()) {
  const parsed = new Date(value);
  return parsed.getFullYear() === date.getFullYear()
    && parsed.getMonth() === date.getMonth()
    && parsed.getDate() === date.getDate();
}

export const attendanceService = {
  async getOrgSettings(organizationId: string): Promise<OrganizationSettings | null> {
    const { data, error } = await supabase
      .from('org_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getCurrentLocation(): Promise<Coordinates> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return normalizeCoordinate(location);
  },

  async getCurrentWiFi(): Promise<WiFiInfo> {
    const state = await NetInfo.fetch();
    const details = (state.details ?? {}) as Record<string, any>;

    return {
      ssid: details.ssid ?? null,
      bssid: details.bssid ?? null,
      isConnected: !!state.isConnected,
      type: state.type,
    };
  },

  async getCurrentIPAddress(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const json = await response.json();
      return typeof json.ip === 'string' ? json.ip : null;
    } catch {
      return null;
    }
  },

  async validateGPS(organizationId: string, location: Coordinates): Promise<ValidationResult> {
    const settings = await this.getOrgSettings(organizationId);
    const workplaceLat = Number(settings?.workplace_lat);
    const workplaceLng = Number(settings?.workplace_lng);
    const radius = settings?.gps_radius ?? VALIDATION.DEFAULT_GPS_RADIUS;

    if (!settings || Number.isNaN(workplaceLat) || Number.isNaN(workplaceLng)) {
      return {
        type: 'gps',
        isValid: false,
        isBlocking: true,
        message: 'Workplace GPS settings are not configured yet.',
      };
    }

    const distanceMeters = calculateDistance(
      location.latitude,
      location.longitude,
      workplaceLat,
      workplaceLng,
    );

    return {
      type: 'gps',
      isValid: distanceMeters <= radius,
      isBlocking: distanceMeters > radius,
      distanceMeters,
      message: distanceMeters <= radius
        ? 'GPS location verified.'
        : `You are ${Math.round(distanceMeters)}m from the workplace. Allowed radius is ${radius}m.`,
    };
  },

  async validateWiFi(organizationId: string, wifi: WiFiInfo): Promise<ValidationResult> {
    const settings = await this.getOrgSettings(organizationId);
    const requiredSsid = settings?.wifi_ssid?.trim();
    const requiredBssid = settings?.wifi_bssid?.trim();

    if (!requiredSsid && !requiredBssid) {
      return {
        type: 'wifi',
        isValid: true,
        isBlocking: false,
        message: 'No required workplace WiFi has been configured.',
      };
    }

    const ssidMatches = !requiredSsid || wifi.ssid === requiredSsid;
    const bssidMatches = !requiredBssid || wifi.bssid === requiredBssid;
    const isValid = wifi.isConnected && ssidMatches && bssidMatches;

    return {
      type: 'wifi',
      isValid,
      isBlocking: !isValid,
      message: isValid
        ? 'WiFi network verified.'
        : `Connect to the registered workplace WiFi${requiredSsid ? ` (${requiredSsid})` : ''}.`,
      metadata: { currentSsid: wifi.ssid, currentBssid: wifi.bssid },
    };
  },

  validateIP(ipAddress: string | null, settings: OrganizationSettings | null): ValidationResult {
    const ipRange = settings?.ip_range?.trim();

    if (!ipRange) {
      return {
        type: 'ip',
        isValid: true,
        isBlocking: false,
        isSuspicious: false,
        message: 'No workplace IP range has been configured.',
      };
    }

    if (!ipAddress) {
      return {
        type: 'ip',
        isValid: false,
        isBlocking: false,
        isSuspicious: true,
        message: 'Unable to verify IP address. This check-in will be marked for review.',
      };
    }

    const isValid = this.isIPInRange(ipAddress, ipRange);
    return {
      type: 'ip',
      isValid,
      isBlocking: false,
      isSuspicious: !isValid,
      message: isValid
        ? 'IP address verified.'
        : 'Unusual IP address detected. This check-in will be marked for review.',
      metadata: { ipAddress, ipRange },
    };
  },

  isIPInRange(ipAddress: string, ipRange: string): boolean {
    const ranges = ipRange.split(',').map((item) => item.trim()).filter(Boolean);

    return ranges.some((range) => {
      if (range === ipAddress) return true;
      if (!range.includes('/')) return ipAddress.startsWith(range);

      const [baseIp, maskText] = range.split('/');
      const mask = Number(maskText);
      if (!Number.isInteger(mask) || mask < 0 || mask > 32) return false;

      const toNumber = (ip: string) => ip
        .split('.')
        .map(Number)
        .reduce((acc, octet) => ((acc << 8) + octet) >>> 0, 0);

      const base = toNumber(baseIp);
      const current = toNumber(ipAddress);
      const maskBits = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0;

      return (base & maskBits) === (current & maskBits);
    });
  },

  async detectLocationSpoofing(location: Coordinates): Promise<ValidationResult> {
    const suspicious = !!location.mocked
      || (!!location.accuracy && location.accuracy < VALIDATION.SUSPICIOUS_ACCURACY_METERS);

    return {
      type: 'spoofing',
      isValid: !suspicious,
      isBlocking: false,
      isSuspicious: suspicious,
      message: suspicious
        ? 'Location anomaly detected. This check-in will be marked for review.'
        : 'No location anomaly detected.',
      metadata: { mocked: location.mocked, accuracy: location.accuracy },
    };
  },

  async runValidationFlow(userId: string, organizationId: string): Promise<ValidationFlowResult & {
    location?: Coordinates;
    networkInfo?: WiFiInfo;
    ipAddress?: string | null;
  }> {
    const result: ValidationFlowResult = { ...DEFAULT_VALIDATION, warnings: [] };
    const settings = await this.getOrgSettings(organizationId);
    const location = await this.getCurrentLocation();

    result.gps = await this.validateGPS(organizationId, location);
    if (!result.gps.isValid) {
      return {
        ...result,
        canSubmit: false,
        blockingReason: 'gps_out_of_range',
        location,
      };
    }

    const wifi = await this.getCurrentWiFi();
    result.wifi = await this.validateWiFi(organizationId, wifi);
    if (!result.wifi.isValid) {
      return {
        ...result,
        canSubmit: false,
        blockingReason: 'wifi_mismatch',
        location,
        networkInfo: wifi,
      };
    }

    const ipAddress = await this.getCurrentIPAddress();
    result.ip = this.validateIP(ipAddress, settings);
    if (result.ip.isSuspicious) result.warnings.push(result.ip);

    result.spoofing = await this.detectLocationSpoofing(location);
    if (result.spoofing.isSuspicious) result.warnings.push(result.spoofing);

    return {
      ...result,
      canSubmit: true,
      requiresReview: result.warnings.length > 0,
      location,
      networkInfo: wifi,
      ipAddress,
    };
  },

  async performCheckIn(data: CheckInData): Promise<AttendanceLog> {
    const validationFlags = getValidationFlags(data.validation);
    const { data: log, error } = await supabase
      .from('attendance_logs')
      .insert({
        user_id: data.userId,
        organization_id: data.organizationId,
        check_in_time: new Date().toISOString(),
        check_in_lat: data.location.latitude,
        check_in_lng: data.location.longitude,
        check_in_wifi_ssid: data.wifi.ssid,
        check_in_wifi_bssid: data.wifi.bssid,
        check_in_ip: data.ipAddress,
        validation_flags: validationFlags,
        offline_client_id: data.offlineClientId ?? null,
        offline_sequence: data.offlineSequence ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    await this.invokeTrustScoreRecalculation(data.userId, log.id);
    return log;
  },

  async performCheckOut(data: CheckOutData): Promise<AttendanceLog> {
    const { data: log, error } = await supabase
      .from('attendance_logs')
      .update({
        check_out_time: new Date().toISOString(),
        check_out_lat: data.location?.latitude ?? null,
        check_out_lng: data.location?.longitude ?? null,
        check_out_wifi_ssid: data.wifi?.ssid ?? null,
        check_out_wifi_bssid: data.wifi?.bssid ?? null,
        check_out_ip: data.ipAddress ?? null,
        notes: data.autoCheckout ? 'Auto checked out after leaving workplace geofence.' : undefined,
      })
      .eq('id', data.logId)
      .eq('user_id', data.userId)
      .select()
      .single();

    if (error) throw error;
    await this.invokeTrustScoreRecalculation(data.userId, log.id);
    return log;
  },

  async getTodayAttendance(userId: string): Promise<AttendanceLog | null> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in_time', start.toISOString())
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async fetchAttendanceHistory(
    userId: string,
    filters?: { startDate?: Date; endDate?: Date; limit?: number },
  ): Promise<{ logs: AttendanceLog[]; stats: AttendanceHistoryStats }> {
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
    const durations = logs
      .map((log) => log.duration_minutes)
      .filter((value): value is number => typeof value === 'number');

    return {
      logs,
      stats: {
        totalLogs: logs.length,
        lateCheckIns: logs.filter((log) => log.is_late).length,
        averageDurationMinutes: durations.length
          ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
          : 0,
        suspiciousLogs: logs.filter((log) => {
          const flags = log.validation_flags;
          return !!flags && (!flags.gps_valid || !flags.wifi_valid || flags.ip_suspicious || flags.spoofing_detected);
        }).length,
      },
    };
  },

  async checkLocationWhileCheckedIn(userId: string, organizationId: string) {
    const todayLog = await this.getTodayAttendance(userId);
    if (!todayLog || todayLog.check_out_time || !isSameDay(todayLog.check_in_time)) {
      return { status: 'inactive', action: 'none', message: 'No active attendance session.' };
    }

    const location = await this.getCurrentLocation();
    const gps = await this.validateGPS(organizationId, location);
    if (!gps.isValid) {
      return { status: 'outside_geofence', action: 'notify_checkout', message: gps.message, location };
    }

    const spoofing = await this.detectLocationSpoofing(location);
    if (spoofing.isSuspicious) {
      return { status: 'suspicious', action: 'flag_for_review', message: spoofing.message, location };
    }

    return { status: 'valid', action: 'continue', message: 'Location still valid.', location };
  },

  async syncOfflineLog(log: OfflineAttendanceLog): Promise<AttendanceLog> {
    const { data, error } = await supabase.rpc('sync_offline_attendance', {
      offline_log: log,
      client_hash: log.integrity_hash,
    });

    if (error) throw error;
    if (!data?.verified) throw new Error(data?.reason ?? 'Offline attendance verification failed.');
    return data.attendance_log;
  },

  async invokeTrustScoreRecalculation(userId: string, logId: string) {
    try {
      await supabase.functions.invoke('recalculate-trust-score', {
        body: { userId, logId },
      });
    } catch {
      // Database triggers are the authoritative fallback; the edge function can be added later.
    }
  },
};
