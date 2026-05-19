/**
 * Attendance Store
 * Current employee attendance state, validation progress, monitoring, and offline sync queue.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { attendanceService } from '@/services/attendanceService';
import {
  AttendanceLog,
  AttendanceLocation,
  AttendanceValidationFlowResult,
  AttendanceValidationState,
  OfflineAttendanceLog,
  UserProfile,
} from '@/utils/types';

type AttendanceStatus = 'not_checked_in' | 'checked_in' | 'checked_out';

const idleValidationState: AttendanceValidationState = {
  gps: { status: 'idle' },
  wifi: { status: 'idle' },
  ip: { status: 'idle' },
  spoofing: { status: 'idle' },
};

function createLocalAttendanceLog(
  user: UserProfile,
  action: 'check_in' | 'check_out',
  location: AttendanceLocation,
  currentLog?: AttendanceLog | null
): AttendanceLog {
  const timestamp = new Date().toISOString();

  if (action === 'check_out' && currentLog) {
    return {
      ...currentLog,
      check_out_time: timestamp,
      check_out_lat: location.latitude,
      check_out_lng: location.longitude,
    };
  }

  return {
    id: `offline-${Date.now()}`,
    user_id: user.id,
    organization_id: user.organization_id,
    check_in_time: timestamp,
    check_out_time: null,
    check_in_lat: location.latitude,
    check_in_lng: location.longitude,
    is_late: false,
    trust_score_impact: 0,
    notes: null,
    created_at: timestamp,
  };
}

interface AttendanceState {
  status: AttendanceStatus;
  currentLog: AttendanceLog | null;
  todayLog: AttendanceLog | null;
  history: AttendanceLog[];
  validationStatus: AttendanceValidationState;
  lastValidationResult: AttendanceValidationFlowResult | null;
  lastLocationCheck: string | null;
  lastLocation: AttendanceLocation | null;
  locationMonitoringActive: boolean;
  pendingSyncLogs: OfflineAttendanceLog[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  initializeToday: (user: UserProfile) => Promise<void>;
  loadHistory: (user: UserProfile) => Promise<void>;
  startCheckInValidation: (user: UserProfile) => Promise<AttendanceValidationFlowResult>;
  performCheckIn: (user: UserProfile) => Promise<void>;
  performCheckOut: (user: UserProfile, autoCheckout?: boolean) => Promise<void>;
  startLocationMonitoring: (user: UserProfile) => void;
  stopLocationMonitoring: () => void;
  loadOfflineQueue: () => Promise<void>;
  addToSyncQueue: (log: OfflineAttendanceLog) => void;
  processSyncQueue: () => Promise<void>;
  resetAttendance: () => void;
}

let locationCheckInterval: ReturnType<typeof setInterval> | null = null;

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      status: 'not_checked_in',
      currentLog: null,
      todayLog: null,
      history: [],
      validationStatus: idleValidationState,
      lastValidationResult: null,
      lastLocationCheck: null,
      lastLocation: null,
      locationMonitoringActive: false,
      pendingSyncLogs: [],
      isLoading: false,
      isSyncing: false,
      error: null,

      initializeToday: async (user) => {
        set({ isLoading: true, error: null });

        try {
          await get().loadOfflineQueue();
          const todayLog = await attendanceService.getTodayAttendance(user.id);
          const status: AttendanceStatus = !todayLog
            ? 'not_checked_in'
            : todayLog.check_out_time
              ? 'checked_out'
              : 'checked_in';

          set({
            todayLog,
            currentLog: todayLog,
            status,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load attendance status',
          });
        }
      },

      loadHistory: async (user) => {
        set({ isLoading: true, error: null });

        try {
          const { logs } = await attendanceService.fetchAttendanceHistory(user.id, { limit: 30 });
          set({ history: logs, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load attendance history',
          });
        }
      },

      startCheckInValidation: async (user) => {
        set({
          validationStatus: {
            gps: { status: 'pending', message: 'Checking workplace radius...' },
            wifi: { status: 'pending', message: 'Checking workplace network...' },
            ip: { status: 'pending', message: 'Checking network address...' },
            spoofing: { status: 'pending', message: 'Checking location integrity...' },
          },
          error: null,
        });

        const result = await attendanceService.runValidationFlow(user.organization_id, get().lastLocation);

        set({
          lastValidationResult: result,
          lastLocation: result.location,
          validationStatus: {
            gps: {
              status: result.validation.gps_valid ? 'valid' : 'invalid',
              message: result.validation.gps_valid ? 'Location verified' : result.validation.errors[0],
            },
            wifi: {
              status: result.validation.wifi_valid ? 'valid' : 'invalid',
              message: result.validation.wifi_valid ? 'WiFi verified' : result.validation.errors.find((item) => item.includes('WiFi')),
            },
            ip: {
              status: result.validation.ip_valid ? 'valid' : 'warning',
              message: result.validation.ip_valid ? 'IP verified' : result.validation.warnings?.find((item) => item.includes('IP')),
            },
            spoofing: {
              status: result.validation.spoofing_detected ? 'warning' : 'valid',
              message: result.validation.spoofing_detected ? 'Location anomaly detected' : 'Location integrity verified',
            },
          },
        });

        return result;
      },

      performCheckIn: async (user) => {
        set({ isLoading: true, error: null });

        try {
          const validation = await get().startCheckInValidation(user);
          if (!validation.canSubmit) {
            throw new Error(validation.validation.errors.join('\n'));
          }

          const network = await NetInfo.fetch();
          const isOnline = !!network.isConnected && !!network.isInternetReachable;

          if (!isOnline) {
            const offlineLog = await attendanceService.createOfflineLog('check_in', {
              user_id: user.id,
              organization_id: user.organization_id,
              timestamp: new Date().toISOString(),
              location: validation.location,
              network: validation.network,
              validation: validation.validation,
            });
            const localLog = createLocalAttendanceLog(user, 'check_in', validation.location);

            get().addToSyncQueue(offlineLog);
            set({
              status: 'checked_in',
              currentLog: localLog,
              todayLog: localLog,
              isLoading: false,
            });
            return;
          }

          const log = await attendanceService.performCheckIn({
            userId: user.id,
            organizationId: user.organization_id,
            location: validation.location,
            network: validation.network,
            validation: validation.validation,
          });

          set({
            status: 'checked_in',
            currentLog: log,
            todayLog: log,
            isLoading: false,
          });

          get().startLocationMonitoring(user);
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Check-in failed',
          });
          throw error;
        }
      },

      performCheckOut: async (user, autoCheckout = false) => {
        const currentLog = get().currentLog;

        if (!currentLog) {
          const error = new Error('No active check-in found');
          set({ error: error.message });
          throw error;
        }

        set({ isLoading: true, error: null });

        try {
          const validation = await attendanceService.runValidationFlow(user.organization_id, get().lastLocation);
          const network = await NetInfo.fetch();
          const isOnline = !!network.isConnected && !!network.isInternetReachable;

          if (!isOnline || currentLog.id.startsWith('offline-')) {
            const offlineLog = await attendanceService.createOfflineLog('check_out', {
              user_id: user.id,
              organization_id: user.organization_id,
              log_id: currentLog.id.startsWith('offline-') ? undefined : currentLog.id,
              timestamp: new Date().toISOString(),
              location: validation.location,
              network: validation.network,
              validation: validation.validation,
            });
            const localLog = createLocalAttendanceLog(user, 'check_out', validation.location, currentLog);

            get().addToSyncQueue(offlineLog);
            get().stopLocationMonitoring();
            set({
              status: 'checked_out',
              currentLog: localLog,
              todayLog: localLog,
              isLoading: false,
            });
            return;
          }

          const log = await attendanceService.performCheckOut({
            userId: user.id,
            organizationId: user.organization_id,
            logId: currentLog.id,
            location: validation.location,
            network: validation.network,
            validation: validation.validation,
            autoCheckout,
          });

          get().stopLocationMonitoring();
          set({
            status: 'checked_out',
            currentLog: log,
            todayLog: log,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Check-out failed',
          });
          throw error;
        }
      },

      startLocationMonitoring: (user) => {
        if (locationCheckInterval) return;

        locationCheckInterval = setInterval(async () => {
          const state = get();
          if (state.status !== 'checked_in') return;

          try {
            const validation = await attendanceService.runValidationFlow(user.organization_id, state.lastLocation);
            set({
              lastLocation: validation.location,
              lastLocationCheck: new Date().toISOString(),
            });

            if (!validation.validation.gps_valid || validation.validation.spoofing_detected) {
              set({
                error: validation.validation.errors[0] ?? validation.validation.warnings?.[0] ?? 'Attendance location needs review',
              });
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Location monitoring failed',
            });
          }
        }, 30 * 60 * 1000);

        set({ locationMonitoringActive: true });
      },

      stopLocationMonitoring: () => {
        if (locationCheckInterval) {
          clearInterval(locationCheckInterval);
          locationCheckInterval = null;
        }

        set({ locationMonitoringActive: false });
      },

      loadOfflineQueue: async () => {
        const queue = await attendanceService.getOfflineQueue();
        set({ pendingSyncLogs: queue });
      },

      addToSyncQueue: (log) => {
        set((state) => ({
          pendingSyncLogs: state.pendingSyncLogs.some((item) => item.id === log.id)
            ? state.pendingSyncLogs
            : [...state.pendingSyncLogs, log],
        }));
      },

      processSyncQueue: async () => {
        set({ isSyncing: true, error: null });

        try {
          const result = await attendanceService.syncOfflineQueue();
          set({
            pendingSyncLogs: result.pending,
            isSyncing: false,
            error: result.failed.length > 0 ? `${result.failed.length} attendance item(s) still pending sync` : null,
          });
        } catch (error) {
          set({
            isSyncing: false,
            error: error instanceof Error ? error.message : 'Offline sync failed',
          });
        }
      },

      resetAttendance: () => {
        get().stopLocationMonitoring();
        set({
          status: 'not_checked_in',
          currentLog: null,
          todayLog: null,
          history: [],
          validationStatus: idleValidationState,
          lastValidationResult: null,
          lastLocationCheck: null,
          lastLocation: null,
          pendingSyncLogs: [],
          isLoading: false,
          isSyncing: false,
          error: null,
        });
      },
    }),
    {
      name: 'trustend-attendance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        status: state.status,
        currentLog: state.currentLog,
        todayLog: state.todayLog,
        pendingSyncLogs: state.pendingSyncLogs,
        lastLocation: state.lastLocation,
        lastLocationCheck: state.lastLocationCheck,
      }),
    }
  )
);
