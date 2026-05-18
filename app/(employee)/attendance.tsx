import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BrandColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { formatDate, formatTime } from '@/utils/helpers';
import { ValidationResult } from '@/utils/types';

function ValidationRow({ result, label }: { result: ValidationResult | null; label: string }) {
  const color = !result
    ? BrandColors.textMuted
    : result.isValid
      ? BrandColors.success
      : result.isBlocking
        ? BrandColors.danger
        : BrandColors.warning;

  return (
    <View style={styles.validationRow}>
      <View style={[styles.validationIcon, { borderColor: color }]}>
        <IconSymbol
          name={result?.isValid ? 'checkmark' : 'exclamationmark'}
          size={14}
          color={color}
        />
      </View>
      <View style={styles.validationTextWrap}>
        <Text style={styles.validationLabel}>{label}</Text>
        <Text style={[styles.validationMessage, { color }]}>
          {result?.message ?? 'Waiting'}
        </Text>
      </View>
    </View>
  );
}

export default function EmployeeAttendanceScreen() {
  const user = useAuthStore((state) => state.user);
  const {
    currentLog,
    error,
    fetchHistory,
    history,
    hydrateTodayStatus,
    isCheckedIn,
    isLoading,
    isSyncing,
    lastValidation,
    pendingSyncLogs,
    performCheckIn,
    performCheckOut,
    processSyncQueue,
    stats,
  } = useAttendanceStore();

  const [validationVisible, setValidationVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    hydrateTodayStatus(user.id);
    fetchHistory(user.id);
    processSyncQueue();
  }, [fetchHistory, hydrateTodayStatus, processSyncQueue, user]);

  const statusText = useMemo(() => {
    if (pendingSyncLogs.length > 0) return `${pendingSyncLogs.length} offline item(s) waiting to sync`;
    if (isCheckedIn && currentLog) return `Checked in at ${formatTime(new Date(currentLog.check_in_time))}`;
    if (currentLog?.check_out_time) return `Checked out at ${formatTime(new Date(currentLog.check_out_time))}`;
    return 'Ready to check in';
  }, [currentLog, isCheckedIn, pendingSyncLogs.length]);

  const handleCheckIn = async () => {
    if (!user) return;
    setValidationVisible(true);
    try {
      await performCheckIn(user.id, user.organization_id);
      await fetchHistory(user.id);
    } catch (checkInError) {
      Alert.alert('Check-in failed', checkInError instanceof Error ? checkInError.message : String(checkInError));
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;
    try {
      await performCheckOut(user.id);
      await fetchHistory(user.id);
    } catch (checkOutError) {
      Alert.alert('Check-out failed', checkOutError instanceof Error ? checkOutError.message : String(checkOutError));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.subtitle}>{statusText}</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {pendingSyncLogs.length > 0 && (
          <TouchableOpacity style={styles.syncBanner} onPress={processSyncQueue} disabled={isSyncing}>
            <Text style={styles.syncText}>
              Offline - will sync when connected
            </Text>
            {isSyncing ? <ActivityIndicator size="small" color={BrandColors.primary} /> : null}
          </TouchableOpacity>
        )}

        <Card style={styles.actionCard}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: isCheckedIn ? BrandColors.success : BrandColors.textMuted }]} />
            <Text style={styles.statusPillText}>{isCheckedIn ? 'On shift' : 'Off shift'}</Text>
          </View>

          <Text style={styles.cardTitle}>Today</Text>
          <Text style={styles.cardBody}>
            {currentLog
              ? `${formatDate(new Date(currentLog.check_in_time))} - ${formatTime(new Date(currentLog.check_in_time))}`
              : 'No attendance log yet today.'}
          </Text>

          <Button
            title={isCheckedIn ? 'Check Out' : 'Check In'}
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            loading={isLoading}
            variant={isCheckedIn ? 'secondary' : 'primary'}
            style={styles.primaryButton}
          />
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.totalLogs ?? 0}</Text>
            <Text style={styles.statLabel}>Logs</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.lateCheckIns ?? 0}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.suspiciousLogs ?? 0}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        {history.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No attendance history yet.</Text>
          </Card>
        ) : (
          history.map((log) => (
            <Card key={log.id} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <Text style={styles.historyDate}>{formatDate(new Date(log.check_in_time))}</Text>
                <Text style={[
                  styles.reviewStatus,
                  log.review_status === 'urgent_review' && styles.urgent,
                  log.review_status === 'needs_review' && styles.review,
                ]}>
                  {log.review_status?.replace('_', ' ') ?? 'okay'}
                </Text>
              </View>
              <Text style={styles.historyTime}>
                {formatTime(new Date(log.check_in_time))}
                {' - '}
                {log.check_out_time ? formatTime(new Date(log.check_out_time)) : 'Active'}
              </Text>
              {log.trust_score_impact < 0 && (
                <Text style={styles.penaltyText}>Trust impact {log.trust_score_impact}</Text>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={validationVisible} transparent animationType="fade" onRequestClose={() => setValidationVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Validation</Text>
            <ValidationRow result={lastValidation?.gps ?? null} label="GPS location" />
            <ValidationRow result={lastValidation?.wifi ?? null} label="WiFi network" />
            <ValidationRow result={lastValidation?.ip ?? null} label="IP address" />
            <ValidationRow result={lastValidation?.spoofing ?? null} label="Location integrity" />

            {lastValidation?.warnings.length ? (
              <Text style={styles.warningText}>This attendance log will be flagged for review.</Text>
            ) : null}

            <Button title="Close" onPress={() => setValidationVisible(false)} variant="outline" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  title: {
    color: BrandColors.text,
    fontSize: Typography['3xl'],
    fontWeight: '800',
  },
  subtitle: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
    marginTop: Spacing.xs,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: BrandColors.danger,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: {
    color: BrandColors.danger,
  },
  syncBanner: {
    borderColor: BrandColors.warning,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  syncText: {
    color: BrandColors.warning,
    fontWeight: '600',
  },
  actionCard: {
    gap: Spacing.md,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: BrandColors.borderLight,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  cardTitle: {
    color: BrandColors.text,
    fontSize: Typography.xl,
    fontWeight: '700',
  },
  cardBody: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
  },
  primaryButton: {
    marginTop: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: BrandColors.primary,
    fontSize: Typography['2xl'],
    fontWeight: '800',
  },
  statLabel: {
    color: BrandColors.textSecondary,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    color: BrandColors.text,
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptyText: {
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  historyCard: {
    gap: Spacing.xs,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  historyDate: {
    color: BrandColors.text,
    fontWeight: '700',
  },
  historyTime: {
    color: BrandColors.textSecondary,
  },
  reviewStatus: {
    color: BrandColors.success,
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  review: {
    color: BrandColors.warning,
  },
  urgent: {
    color: BrandColors.danger,
  },
  penaltyText: {
    color: BrandColors.warning,
    fontSize: Typography.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: BrandColors.card,
    borderRadius: BorderRadius.lg,
    borderColor: BrandColors.border,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    color: BrandColors.text,
    fontSize: Typography.xl,
    fontWeight: '800',
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  validationIcon: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  validationTextWrap: {
    flex: 1,
  },
  validationLabel: {
    color: BrandColors.text,
    fontWeight: '700',
  },
  validationMessage: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  warningText: {
    color: BrandColors.warning,
    fontSize: Typography.sm,
  },
});
