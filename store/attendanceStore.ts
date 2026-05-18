import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { attendanceService } from '@/services/attendanceService';
import { STORAGE_KEYS, VALIDATION } from '@/utils/constants';
import {
  AttendanceHistoryStats,
  AttendanceLog,
  CheckInData,
  CheckOutData,
  OfflineAttendanceLog,
  ValidationFlowResult,
} from '@/utils/types';

type ValidationStepStatus = 'idle' | 'pending' | 'valid' | 'invalid';

interface AttendanceState {
  isCheckedIn: boolean;
  currentLog: AttendanceLog | null;
  history: AttendanceLog[];
  stats: AttendanceHistoryStats | null;
  validationStatus: {
    gps: ValidationStepStatus;
    wifi: ValidationStepStatus;
    ip: ValidationStepStatus;
  };
  lastValidation: ValidationFlowResult | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  pendingSyncLogs: OfflineAttendanceLog[];
  locationMonitoringActive: boolean;
  locationCheckInterval: ReturnType<typeof setInterval> | null;
  lastLocationCheck: string | null;

  hydrateTodayStatus: (userId: string) => Promise<void>;
  fetchHistory: (userId: string) => Promise<void>;
  startCheckInValidation: (userId: string, organizationId: string) => Promise<ValidationFlowResult & {
    location?: CheckInData['location'];
    networkInfo?: CheckInData['wifi'];
    ipAddress?: string | null;
  }>;
  performCheckIn: (userId: string, organizationId: string) => Promise<AttendanceLog | OfflineAttendanceLog>;
  performCheckOut: (userId: string) => Promise<AttendanceLog | OfflineAttendanceLog>;
  addToSyncQueue: (log: OfflineAttendanceLog) => void;
  processSyncQueue: () => Promise<void>;
  startLocationMonitoring: (userId: string, organizationId: string) => void;
  stopLocationMonitoring: () => void;
  clearError: () => void;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function generateHash(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(index);
    hash >>>= 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function buildOfflineLog(
  type: 'check_in' | 'check_out',
  payload: Omit<OfflineAttendanceLog, 'id' | 'type' | 'timestamp' | 'sequence_number' | 'nonce' | 'integrity_hash' | 'retry_count'>,
  sequenceNumber: number,
): OfflineAttendanceLog {
  const base = {
    id: generateId(),
    type,
    timestamp: Date.now(),
    sequence_number: sequenceNumber,
    nonce: Math.random().toString(36).slice(2),
    retry_count: 0,
    ...payload,
  };

  return {
    ...base,
    integrity_hash: generateHash(base),
  };
}

function verifyOfflineLog(log: OfflineAttendanceLog) {
  const { integrity_hash: _hash, ...rest } = log;
  return generateHash(rest) === log.integrity_hash;
}

async function isOnline() {
  const netState = await NetInfo.fetch();
  return !!netState.isConnected && netState.isInternetReachable !== false;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      isCheckedIn: false,
      currentLog: null,
      history: [],
      stats: null,
      validationStatus: {
        gps: 'idle',
        wifi: 'idle',
        ip: 'idle',
      },
      lastValidation: null,
      isLoading: false,
      isSyncing: false,
      error: null,
      pendingSyncLogs: [],
      locationMonitoringActive: false,
      locationCheckInterval: null,
      lastLocationCheck: null,

      hydrateTodayStatus: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const log = await attendanceService.getTodayAttendance(userId);
          set({
            currentLog: log,
            isCheckedIn: !!log && !log.check_out_time,
            isLoading: false,
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
        }
      },

      fetchHistory: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const { logs, stats } = await attendanceService.fetchAttendanceHistory(userId, { limit: 30 });
          set({ history: logs, stats, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
        }
      },

      startCheckInValidation: async (userId, organizationId) => {
        set({
          validationStatus: { gps: 'pending', wifi: 'idle', ip: 'idle' },
          lastValidation: null,
          error: null,
        });

        const validation = await attendanceService.runValidationFlow(userId, organizationId);
        set({
          validationStatus: {
            gps: validation.gps?.isValid ? 'valid' : 'invalid',
            wifi: validation.wifi ? (validation.wifi.isValid ? 'valid' : 'invalid') : 'idle',
            ip: validation.ip ? (validation.ip.isValid ? 'valid' : 'invalid') : 'idle',
          },
          lastValidation: validation,
        });

        return validation;
      },

      performCheckIn: async (userId, organizationId) => {
        set({ isLoading: true, error: null });

        try {
          const validation = await get().startCheckInValidation(userId, organizationId);
          if (!validation.canSubmit || !validation.location || !validation.networkInfo) {
            throw new Error(validation.gps?.message || validation.wifi?.message || 'Attendance validation failed.');
          }

          const data: CheckInData = {
            userId,
            organizationId,
            location: validation.location,
            wifi: validation.networkInfo,
            ipAddress: validation.ipAddress,
            validation,
          };

          if (!(await isOnline())) {
            const offlineLog = buildOfflineLog('check_in', {
              user_id: userId,
              organization_id: organizationId,
              location: validation.location,
              wifi: validation.networkInfo,
              ip_address: validation.ipAddress,
              validation,
            }, get().pendingSyncLogs.length + 1);

            get().addToSyncQueue(offlineLog);
            set({
              isCheckedIn: true,
              currentLog: null,
              isLoading: false,
            });
            return offlineLog;
          }

          const log = await attendanceService.performCheckIn(data);
          set({
            currentLog: log,
            isCheckedIn: true,
            history: [log, ...get().history.filter((item) => item.id !== log.id)],
            isLoading: false,
          });
          return log;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
          throw error;
        }
      },

      performCheckOut: async (userId) => {
        set({ isLoading: true, error: null });
        const currentLog = get().currentLog;

        try {
          const location = await attendanceService.getCurrentLocation().catch(() => null);
          const wifi = await attendanceService.getCurrentWiFi().catch(() => null);
          const ipAddress = await attendanceService.getCurrentIPAddress();

          if (!currentLog) {
            if (!(await isOnline())) {
              const offlineLog = buildOfflineLog('check_out', {
                user_id: userId,
                organization_id: '',
                location,
                wifi,
                ip_address: ipAddress,
              }, get().pendingSyncLogs.length + 1);

              get().addToSyncQueue(offlineLog);
              set({ isCheckedIn: false, isLoading: false });
              return offlineLog;
            }

            throw new Error('No active check-in found.');
          }

          const data: CheckOutData = {
            logId: currentLog.id,
            userId,
            location,
            wifi,
            ipAddress,
          };

          if (!(await isOnline())) {
            const offlineLog = buildOfflineLog('check_out', {
              user_id: userId,
              organization_id: currentLog.organization_id,
              log_id: currentLog.id,
              location,
              wifi,
              ip_address: ipAddress,
            }, get().pendingSyncLogs.length + 1);

            get().addToSyncQueue(offlineLog);
            set({
              isCheckedIn: false,
              currentLog: { ...currentLog, check_out_time: new Date().toISOString() },
              isLoading: false,
            });
            return offlineLog;
          }

          const log = await attendanceService.performCheckOut(data);
          set({
            currentLog: log,
            isCheckedIn: false,
            history: get().history.map((item) => (item.id === log.id ? log : item)),
            isLoading: false,
          });
          return log;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : String(error), isLoading: false });
          throw error;
        }
      },

      addToSyncQueue: (log) => {
        set((state) => ({
          pendingSyncLogs: [...state.pendingSyncLogs.filter((item) => item.id !== log.id), log],
        }));
      },

      processSyncQueue: async () => {
        const queue = get().pendingSyncLogs;
        if (!queue.length || !(await isOnline())) return;

        set({ isSyncing: true, error: null });
        const remaining: OfflineAttendanceLog[] = [];

        for (const log of queue) {
          const ageHours = (Date.now() - log.timestamp) / (1000 * 60 * 60);
          if (!verifyOfflineLog(log) || ageHours > VALIDATION.OFFLINE_SYNC_MAX_AGE_HOURS) {
            remaining.push({
              ...log,
              retry_count: log.retry_count + 1,
              last_error: !verifyOfflineLog(log) ? 'integrity_check_failed' : 'exceeded_24h_limit',
            });
            continue;
          }

          try {
            await attendanceService.syncOfflineLog(log);
          } catch (error) {
            remaining.push({
              ...log,
              retry_count: log.retry_count + 1,
              last_error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        set({ pendingSyncLogs: remaining, isSyncing: false });
      },

      startLocationMonitoring: (userId, organizationId) => {
        get().stopLocationMonitoring();

        const interval = setInterval(async () => {
          try {
            const result = await attendanceService.checkLocationWhileCheckedIn(userId, organizationId);
            set({ lastLocationCheck: new Date().toISOString() });

            if (result.status === 'outside_geofence' && get().currentLog) {
              await attendanceService.performCheckOut({
                logId: get().currentLog!.id,
                userId,
                location: result.location,
                autoCheckout: true,
              });
              await get().hydrateTodayStatus(userId);
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : String(error) });
          }
        }, VALIDATION.LOCATION_MONITORING_INTERVAL_MS);

        set({
          locationMonitoringActive: true,
          locationCheckInterval: interval,
        });
      },

      stopLocationMonitoring: () => {
        const interval = get().locationCheckInterval;
        if (interval) clearInterval(interval);
        set({
          locationMonitoringActive: false,
          locationCheckInterval: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEYS.SYNC_QUEUE,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pendingSyncLogs: state.pendingSyncLogs,
        currentLog: state.currentLog,
        isCheckedIn: state.isCheckedIn,
      }),
    },
  ),
);
