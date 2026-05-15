/**
 * Employee Attendance History
 */

import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BrandColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { formatDate, formatTime } from '@/utils/helpers';

function parseReviewStatus(notes?: string | null) {
  if (!notes) return 'none';

  try {
    return JSON.parse(notes).review_status ?? 'none';
  } catch {
    return 'none';
  }
}

function getDuration(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return 'Open';

  const minutes = Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder}m`;
  return `${hours}h ${remainder}m`;
}

export default function EmployeeAttendanceScreen() {
  const user = useAuthStore((state) => state.user);
  const { history, pendingSyncLogs, isLoading, isSyncing, error, loadHistory, processSyncQueue } =
    useAttendanceStore();

  useEffect(() => {
    if (user) {
      loadHistory(user);
      processSyncQueue();
    }
  }, [loadHistory, processSyncQueue, user]);

  const refresh = async () => {
    if (!user) return;

    await processSyncQueue();
    await loadHistory(user);
  };

  const lateCount = history.filter((log) => !!log.is_late).length;
  const reviewCount = history.filter((log) => parseReviewStatus(log.notes) !== 'none').length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading || isSyncing} onRefresh={refresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>Your recent check-in and check-out records</Text>
      </View>

      {pendingSyncLogs.length > 0 ? (
        <Card style={styles.syncCard}>
          <View style={styles.syncRow}>
            <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={BrandColors.warning} />
            <View style={styles.syncText}>
              <Text style={styles.syncTitle}>Offline sync pending</Text>
              <Text style={styles.syncSubtitle}>
                {pendingSyncLogs.length} attendance item{pendingSyncLogs.length > 1 ? 's' : ''} will sync when the
                connection is available.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.syncButton} onPress={refresh} disabled={isSyncing}>
            {isSyncing ? (
              <ActivityIndicator color={BrandColors.background} />
            ) : (
              <Text style={styles.syncButtonText}>Sync now</Text>
            )}
          </TouchableOpacity>
        </Card>
      ) : null}

      <View style={styles.stats}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>Records</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{lateCount}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{reviewCount}</Text>
          <Text style={styles.statLabel}>Review</Text>
        </Card>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>History</Text>
      {isLoading && history.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={BrandColors.primary} />
      ) : history.length === 0 ? (
        <Card style={styles.emptyCard}>
          <IconSymbol name="clock" size={24} color={BrandColors.textMuted} />
          <Text style={styles.emptyTitle}>No attendance records yet</Text>
          <Text style={styles.emptySubtitle}>Your completed check-ins will appear here.</Text>
        </Card>
      ) : (
        <View style={styles.historyList}>
          {history.map((log) => {
            const reviewStatus = parseReviewStatus(log.notes);
            const checkInDate = new Date(log.check_in_time);
            const checkOutDate = log.check_out_time ? new Date(log.check_out_time) : null;

            return (
              <Card key={log.id} style={styles.historyCard}>
                <View style={styles.recordHeader}>
                  <View>
                    <Text style={styles.recordDate}>{formatDate(checkInDate)}</Text>
                    <Text style={styles.recordMeta}>{getDuration(log.check_in_time, log.check_out_time)}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        borderColor:
                          reviewStatus === 'urgent_review'
                            ? BrandColors.danger
                            : reviewStatus === 'needs_review'
                              ? BrandColors.warning
                              : BrandColors.success,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            reviewStatus === 'urgent_review'
                              ? BrandColors.danger
                              : reviewStatus === 'needs_review'
                                ? BrandColors.warning
                                : BrandColors.success,
                        },
                      ]}>
                      {reviewStatus === 'urgent_review'
                        ? 'Urgent'
                        : reviewStatus === 'needs_review'
                          ? 'Review'
                          : 'Okay'}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeGrid}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Check in</Text>
                    <Text style={styles.timeValue}>{formatTime(checkInDate)}</Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Check out</Text>
                    <Text style={styles.timeValue}>{checkOutDate ? formatTime(checkOutDate) : 'Open'}</Text>
                  </View>
                </View>

                {log.is_late ? (
                  <View style={styles.flagRow}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={14} color={BrandColors.warning} />
                    <Text style={styles.flagText}>Late check-in</Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  title: {
    color: BrandColors.text,
    fontSize: Typography['2xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
    marginTop: Spacing.xs,
  },
  syncCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  syncRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  syncText: {
    flex: 1,
  },
  syncTitle: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  syncSubtitle: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  syncButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  syncButtonText: {
    color: BrandColors.background,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: BrandColors.text,
    fontSize: Typography.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  errorText: {
    color: BrandColors.danger,
    fontSize: Typography.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: BrandColors.text,
    fontSize: Typography.lg,
    fontWeight: '700',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
  },
  historyList: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  historyCard: {
    gap: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  recordDate: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  recordMeta: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  timeGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeItem: {
    flex: 1,
    backgroundColor: BrandColors.backgroundLighter,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  timeLabel: {
    color: BrandColors.textMuted,
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
  },
  timeValue: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flagText: {
    color: BrandColors.warning,
    fontSize: Typography.sm,
  },
});
