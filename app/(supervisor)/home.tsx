/**
 * Supervisor Home Screen
 * Dashboard for pending requests, registrations, and team health.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Card } from '@/components/Card';
import { AttendanceWarningModal } from '@/components/AttendanceWarningModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { authService, supervisorService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { formatTime } from '@/utils/helpers';
import { AttendanceValidationFlowResult } from '@/utils/types';
import DecorativeShapes from "@/components/DecorativeShapes";

type DashboardSummary = {
  pendingRegistrations: number;
  activeEmployees: number;
  pendingRequests: number;
  pendingReports: number;
};

type PendingRequest = {
  id: string;
  type: 'holiday' | 'overtime';
  start_date: string;
  end_date: string;
  reason: string;
  profiles?: {
    name?: string;
    trust_score?: number;
  } | null;
};

const emptySummary: DashboardSummary = {
  pendingRegistrations: 0,
  activeEmployees: 0,
  pendingRequests: 0,
  pendingReports: 0,
};

export default function SupervisorHomeScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [recentRequests, setRecentRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTrustScoreModal, setShowTrustScoreModal] = useState(false);
  const [warningModal, setWarningModal] = useState<{
    visible: boolean;
    actionLabel: 'check-in' | 'check-out';
    result: AttendanceValidationFlowResult | null;
  }>({
    visible: false,
    actionLabel: 'check-in',
    result: null,
  });
  const [workHours, setWorkHours] = useState({ start: '', end: '' });

  const {
    status: todayStatus,
    currentLog,
    pendingSyncLogs,
    validationStatus,
    isLoading: attendanceLoading,
    error: attendanceError,
    initializeToday,
    performCheckIn,
    performCheckOut,
    processSyncQueue,
  } = useAttendanceStore();

  useEffect(() => {
    if (user) {
      initializeToday(user);
      processSyncQueue();
    }
  }, [initializeToday, processSyncQueue, user]);

  useEffect(() => {
    if (attendanceError) {
      Alert.alert('Attendance', attendanceError);
    }
  }, [attendanceError]);

  useEffect(() => {
    if (!user?.organization_id) return;
    supervisorService.getOrganizationSettings(user.organization_id).then((data) => {
      if (data) {
        setWorkHours({
          start: data.work_start_time?.slice(0, 5) || '09:00',
          end: data.work_end_time?.slice(0, 5) || '17:00',
        });
      }
    });
  }, [user?.organization_id]);

  const loadDashboard = useCallback(async () => {
    if (!user?.organization_id) return;

    try {
      const [summaryData, requestsData] = await Promise.all([
        supervisorService.getDashboardSummary(user.organization_id),
        supervisorService.getPendingRequests(user.organization_id),
      ]);

      setSummary(summaryData);
      setRecentRequests((requestsData as PendingRequest[]).slice(0, 3));
    } catch (error) {
      console.error('Load supervisor dashboard error:', error);
      Alert.alert('Error', 'Failed to load supervisor dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.organization_id]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      await performCheckIn(user);
      const latestAttendance = useAttendanceStore.getState();
      if (latestAttendance.lastValidationResult?.requiresReview) {
        setWarningModal({
          visible: true,
          actionLabel: 'check-in',
          result: latestAttendance.lastValidationResult,
        });
        return;
      }

      Alert.alert(
        'Success',
        latestAttendance.pendingSyncLogs.length > 0
            ? 'Check-in saved and will sync when online.'
            : 'Check-in successful.',
      );
    } catch {
      // Error state is already surfaced by the attendance store.
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    try {
      await performCheckOut(user);
      const latestAttendance = useAttendanceStore.getState();
      if (latestAttendance.lastValidationResult?.requiresReview) {
        setWarningModal({
          visible: true,
          actionLabel: 'check-out',
          result: latestAttendance.lastValidationResult,
        });
        return;
      }

      Alert.alert(
        'Success',
        latestAttendance.pendingSyncLogs.length > 0
            ? 'Check-out saved and will sync when online.'
            : 'Check-out successful.',
      );
    } catch {
      // Error state is already surfaced by the attendance store.
    }
  };

  const getStatusText = () => {
    switch (todayStatus) {
      case 'not_checked_in':
        return 'Not checked in yet';
      case 'checked_in':
        return currentLog?.check_in_time
          ? `Checked in at ${formatTime(new Date(currentLog.check_in_time))}`
          : 'Checked in';
      case 'checked_out':
        return currentLog?.check_out_time
          ? `Checked out at ${formatTime(new Date(currentLog.check_out_time))}`
          : 'Checked out';
    }
  };

  const getStatusColor = () => {
    switch (todayStatus) {
      case 'not_checked_in':
        return colors.textSecondary;
      case 'checked_in':
        return colors.success;
      case 'checked_out':
        return colors.info;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading supervisor dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DecorativeShapes variant="supervisor" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Supervisor Dashboard</Text>
          <Text style={styles.userName}>{user?.name || 'Supervisor'}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Pending Requests"
          value={summary.pendingRequests}
          icon="hourglass"
          color={colors.warning}
        />
        <MetricCard
          label="New Registrations"
          value={summary.pendingRegistrations}
          icon="person.badge.plus"
          color={colors.primary}
        />
        <MetricCard
          label="Active Employees"
          value={summary.activeEmployees}
          icon="person.2.fill"
          color={colors.info}
        />
        <MetricCard
          label="Pending Reports"
          value={summary.pendingReports}
          icon="doc.text.magnifyingglass"
          color={colors.error}
        />
      </View>

      {/* Trust Score Card */}
      <Card style={styles.trustScoreCard} variant="elevated">
        <View style={styles.trustScoreHeader}>
          <Text style={styles.trustScoreTitle}>Your Trust Score</Text>
          <TouchableOpacity onPress={() => setShowTrustScoreModal(true)}>
            <IconSymbol name="info.circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.trustScoreContent}>
          <TrustScoreBadge
            score={user?.trust_score || 50}
            size="large"
            showLabel
          />
        </View>
        <Text style={styles.trustScoreDescription}>
          Your score reflects your own attendance consistency
        </Text>
      </Card>

      {/* My Attendance Card */}
      <Card style={styles.attendanceCard} variant="elevated">
        <Text style={styles.attendanceTitle}>My Attendance</Text>
        <View style={styles.attendanceStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {workHours.start ? (
          <Text style={styles.workHoursText}>
            Work hours: {workHours.start} — {workHours.end}
          </Text>
        ) : null}

        {pendingSyncLogs.length > 0 ? (
          <View style={styles.offlineBanner}>
            <IconSymbol name="arrow.triangle.2.circlepath" size={16} color={colors.warning} />
            <Text style={styles.offlineText}>
              {pendingSyncLogs.length} offline attendance item{pendingSyncLogs.length > 1 ? 's' : ''} pending sync
            </Text>
          </View>
        ) : null}

        {validationStatus.gps.status !== 'idle' ? (
          <View style={styles.validationList}>
            {(['gps', 'wifi', 'ip', 'spoofing'] as const).map((key) => (
              <View key={key} style={styles.validationItem}>
                <View
                  style={[
                    styles.validationDot,
                    {
                      backgroundColor:
                        validationStatus[key].status === 'valid'
                          ? colors.success
                          : validationStatus[key].status === 'invalid'
                            ? colors.error
                            : validationStatus[key].status === 'warning'
                              ? colors.warning
                              : colors.textMuted,
                    },
                  ]}
                />
                <Text style={styles.validationText}>{validationStatus[key].message}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {todayStatus === 'not_checked_in' ? (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={handleCheckIn}
            disabled={attendanceLoading}>
            {attendanceLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <IconSymbol name="location.fill" size={20} color="#FFFFFF" />
                <Text style={styles.checkInButtonText}>Check In</Text>
              </>
            )}
          </TouchableOpacity>
        ) : todayStatus === 'checked_in' ? (
          <TouchableOpacity
            style={styles.checkOutButton}
            onPress={handleCheckOut}
            disabled={attendanceLoading}>
            {attendanceLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <IconSymbol name="location.slash" size={20} color="#FFFFFF" />
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.completedStatus}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
            <Text style={styles.completedText}>Completed for today</Text>
          </View>
        )}

      </Card>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <ActionCard
          title="Review Requests"
          subtitle={`${summary.pendingRequests} waiting`}
          icon="checkmark.seal.fill"
          color={colors.primary}
          onPress={() => router.push('/(supervisor)/request-review')}
        />
        <ActionCard
          title="Manage Employees"
          subtitle={`${summary.pendingRegistrations} new accounts`}
          icon="person.crop.circle.badge.checkmark"
          color={colors.primary}
          onPress={() => router.push('/(supervisor)/team')}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending Requests</Text>
        <TouchableOpacity onPress={() => router.push('/(supervisor)/request-review')}>
          <Text style={styles.linkText}>View all</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.listCard}>
        {recentRequests.length === 0 ? (
          <EmptyState text="No pending requests right now" color={colors.primary} />
        ) : (
          recentRequests.map((request) => (
            <View key={request.id} style={styles.requestRow}>
              <View style={styles.requestContent}>
                <Text style={styles.requestTitle}>
                  {(request.profiles?.name || 'Employee')} - {formatRequestType(request.type)}
                </Text>
                <Text style={styles.requestMeta}>
                  {formatDate(request.start_date)} to {formatDate(request.end_date)}
                </Text>
                <Text style={styles.requestReason} numberOfLines={2}>
                  {request.reason}
                </Text>
              </View>
              <TrustScoreBadge score={request.profiles?.trust_score || 50} size="small" />
            </View>
          ))
        )}
      </Card>

      {/* Trust Score Modal */}
      {showTrustScoreModal && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTrustScoreModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Understanding Your Trust Score
              </Text>
              <TouchableOpacity onPress={() => setShowTrustScoreModal(false)}>
                <IconSymbol name="xmark" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                How we calculate your trustworthiness
              </Text>
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>Three Key Factors:</Text>
                <View style={styles.factorRow}>
                  <View style={styles.factorIcon}>
                    <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.factorText}>
                    <Text style={styles.factorTitle}>Punctuality</Text>
                    <Text style={styles.factorDescription}>
                      On-time check-ins vs late check-ins
                    </Text>
                  </View>
                </View>
                <View style={styles.factorRow}>
                  <View style={styles.factorIcon}>
                    <IconSymbol name="location.fill" size={18} color={colors.info} />
                  </View>
                  <View style={styles.factorText}>
                    <Text style={styles.factorTitle}>Location Consistency</Text>
                    <Text style={styles.factorDescription}>
                      GPS matches your registered workplace location
                    </Text>
                  </View>
                </View>
                <View style={styles.factorRow}>
                  <View style={styles.factorIcon}>
                    <IconSymbol
                      name="exclamationmark.triangle.fill"
                      size={18}
                      color={colors.warning}
                    />
                  </View>
                  <View style={styles.factorText}>
                    <Text style={styles.factorTitle}>Activity Patterns</Text>
                    <Text style={styles.factorDescription}>
                      Monitoring for suspicious activity like duplicate check-ins
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.scoreTiers}>
                <Text style={styles.scoreTiersTitle}>Trust Score Tiers:</Text>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: colors.trustHigh }]} />
                  <Text style={styles.tierLabel}>36-50: Trusted (Green)</Text>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: colors.trustMedium }]} />
                  <Text style={styles.tierLabel}>20-35: Moderate (Yellow)</Text>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: colors.trustLow }]} />
                  <Text style={styles.tierLabel}>0-19: At Risk (Red)</Text>
                </View>
              </View>
              <Text style={styles.modalFooterText}>
                Your score is recalculated after each check-in/check-out to
                reflect your recent behavior patterns.
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTrustScoreModal(false)}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      )}

      <AttendanceWarningModal
        visible={warningModal.visible}
        actionLabel={warningModal.actionLabel}
        result={warningModal.result}
        onClose={() => setWarningModal((current) => ({ ...current, visible: false }))}
      />
    </ScrollView>
    </View>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  color: string;
}) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Card style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}22` }]}>
        <IconSymbol name={icon} size={22} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

function ActionCard({
  title,
  subtitle,
  icon,
  color,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  color: string;
  onPress: () => void;
}) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.actionIcon}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <IconSymbol name="chevron.right" size={22} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function EmptyState({ text, color }: { text: string; color: string }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.emptyState}>
      <IconSymbol name="checkmark.circle.fill" size={26} color={color} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function formatRequestType(type: string) {
  return type === 'holiday' ? 'Holiday' : 'Overtime';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: Spacing['2xl'],
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      gap: Spacing.md,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.md,
    },
    greeting: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    userName: {
      color: colors.text,
      fontSize: Typography['2xl'],
      fontWeight: '800',
      marginTop: Spacing.xs,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    metricCard: {
      width: '47%',
      flexGrow: 1,
      minHeight: 120,
    },
    metricIcon: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    metricValue: {
      color: colors.text,
      fontSize: Typography['3xl'],
      fontWeight: '800',
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: Spacing.xs,
    },
    trustScoreCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      alignItems: 'center',
      borderColor: `${colors.primary}55`,
    },
    trustScoreHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    trustScoreTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '800',
      marginRight: Spacing.xs,
    },
    trustScoreContent: {
      marginVertical: Spacing.lg,
    },
    trustScoreDescription: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      textAlign: 'center',
    },
    attendanceCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      borderColor: `${colors.secondary}55`,
    },
    attendanceTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '800',
      marginBottom: Spacing.md,
    },
    attendanceStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.sm,
    },
    statusText: {
      fontSize: Typography.base,
      fontWeight: '500',
    },
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundLighter,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    offlineText: {
      flex: 1,
      color: colors.warning,
      fontSize: Typography.sm,
    },
    validationList: {
      marginBottom: Spacing.md,
      gap: Spacing.xs,
    },
    validationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    validationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    validationText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    checkInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.sm,
      minHeight: 54,
    },
    checkInButtonText: {
      color: '#FFFFFF',
      fontSize: Typography.base,
      fontWeight: '600',
    },
    checkOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.info,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.sm,
      minHeight: 54,
    },
    checkOutButtonText: {
      color: '#FFFFFF',
      fontSize: Typography.base,
      fontWeight: '600',
    },
    completedStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    completedText: {
      color: colors.success,
      fontSize: Typography.base,
      fontWeight: '600',
    },
    workHoursText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginBottom: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '800',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    linkText: {
      color: colors.primary,
      fontSize: Typography.sm,
      fontWeight: '700',
    },
    quickActions: {
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.cardLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    actionText: {
      flex: 1,
    },
    actionTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '700',
    },
    actionSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: 2,
    },
    listCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing['2xl'],
    },
    requestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    requestContent: {
      flex: 1,
      marginRight: Spacing.md,
    },
    requestTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '700',
    },
    requestMeta: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: 2,
    },
    requestReason: {
      color: colors.textMuted,
      fontSize: Typography.sm,
      marginTop: Spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.sm,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 350,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    modalTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: '600',
    },
    modalContent: {
      gap: Spacing.md,
    },
    modalSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      fontWeight: '500',
    },
    explanationBox: {
      gap: Spacing.sm,
    },
    explanationTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    factorRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    factorIcon: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    factorText: {
      flex: 1,
    },
    factorTitle: {
      color: colors.text,
      fontSize: Typography.sm,
      fontWeight: '600',
    },
    factorDescription: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      lineHeight: 18,
    },
    scoreTiers: {
      marginTop: Spacing.md,
    },
    scoreTiersTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    tierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginVertical: 4,
    },
    tierDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    tierLabel: {
      color: colors.text,
      fontSize: Typography.sm,
    },
    modalFooterText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      textAlign: 'center',
      marginTop: Spacing.md,
      fontStyle: 'italic',
    },
    modalCloseButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    modalCloseButtonText: {
      color: colors.background,
      fontSize: Typography.base,
      fontWeight: '600',
    },
  });
