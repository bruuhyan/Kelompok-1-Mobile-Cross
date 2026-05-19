/**
 * Employee Home Screen
 * Dashboard showing today's status, trust score, and quick actions
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { authService } from '@/services/supabase';
import { formatTime } from '@/utils/helpers';

export default function EmployeeHomeScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [showTrustScoreModal, setShowTrustScoreModal] = useState(false);
  const {
    status: todayStatus,
    currentLog,
    pendingSyncLogs,
    validationStatus,
    isLoading,
    error,
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
    if (error) {
      Alert.alert('Attendance', error);
    }
  }, [error]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      await performCheckIn(user);
      if (user.trust_score > 50) updateUser({ trust_score: 50 });
      Alert.alert('Success', pendingSyncLogs.length > 0 ? 'Check-in saved and will sync when online.' : 'Check-in successful.');
    } catch {
      // Error state is already surfaced by the attendance store.
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    try {
      await performCheckOut(user);
      Alert.alert('Success', pendingSyncLogs.length > 0 ? 'Check-out saved and will sync when online.' : 'Check-out successful.');
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.name || 'Loading...'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Trust Score Card */}
      <Card style={styles.trustScoreCard}>
        <View style={styles.trustScoreHeader}>
          <Text style={styles.trustScoreTitle}>Your Trust Score</Text>
          <TouchableOpacity onPress={() => setShowTrustScoreModal(true)}>
            <IconSymbol name="info.circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.trustScoreContent}>
          <TrustScoreBadge score={user?.trust_score || 50} size="large" showLabel />
        </View>
        <Text style={styles.trustScoreDescription}>
          Keep your attendance consistent to improve your score
        </Text>
      </Card>

      {/* Today Status Card */}
      <Card style={styles.statusCard}>
        <Text style={styles.statusTitle}>Today Status</Text>
        <View style={styles.statusContent}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

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
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <IconSymbol name="location.fill" size={20} color={colors.background} />
                <Text style={styles.checkInButtonText}>Check In</Text>
              </>
            )}
          </TouchableOpacity>
        ) : todayStatus === 'checked_in' ? (
          <TouchableOpacity
            style={styles.checkOutButton}
            onPress={handleCheckOut}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <IconSymbol name="location.slash" size={20} color={colors.background} />
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

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(employee)/requests')}>
          <View style={styles.quickActionIcon}>
            <IconSymbol name="calendar" size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickActionText}>Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(employee)/reports')}>
          <View style={styles.quickActionIcon}>
            <IconSymbol name="doc.text" size={24} color={colors.info} />
          </View>
          <Text style={styles.quickActionText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(employee)/profile')}>
          <View style={styles.quickActionIcon}>
            <IconSymbol name="person.circle" size={24} color={colors.warning} />
          </View>
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <Card style={styles.activityCard}>
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <IconSymbol name="clock" size={16} color={colors.textMuted} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              {currentLog ? 'Today attendance updated' : 'No recent activity'}
            </Text>
            <Text style={styles.activitySubtitle}>
              {currentLog?.check_in_time
                ? `Last check-in ${formatTime(new Date(currentLog.check_in_time))}`
                : 'Check in to start tracking'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Trust Score Modal */}
      {showTrustScoreModal && (
        <Pressable style={styles.modalOverlay} onPress={() => setShowTrustScoreModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Understanding Your Trust Score</Text>
              <TouchableOpacity onPress={() => setShowTrustScoreModal(false)}>
                <IconSymbol name="xmark" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>How we calculate your trustworthiness</Text>
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
                    <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
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
                  <View style={[styles.tierDot, { backgroundColor: '#00F5A0' }]} />
                  <Text style={styles.tierLabel}>80-100: Trusted (Green)</Text>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#FFAA00' }]} />
                  <Text style={styles.tierLabel}>50-79: Moderate (Yellow)</Text>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#FF4757' }]} />
                  <Text style={styles.tierLabel}>0-49: At Risk (Red)</Text>
                </View>
              </View>
              <Text style={styles.modalFooterText}>
                Your score is recalculated after each check-in/check-out to reflect your recent behavior patterns.
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTrustScoreModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: Spacing.lg,
      paddingTop: Spacing['2xl'],
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    greeting: {
      fontSize: Typography.base,
      color: colors.textSecondary,
    },
    userName: {
      fontSize: Typography['2xl'],
      fontWeight: '700',
      color: colors.text,
    },
    logoutButton: {
      padding: Spacing.sm,
    },
    trustScoreCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      alignItems: 'center',
    },
    trustScoreHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    trustScoreTitle: {
      fontSize: Typography.lg,
      fontWeight: '600',
      color: colors.text,
      marginRight: Spacing.xs,
    },
    trustScoreContent: {
      marginVertical: Spacing.lg,
    },
    trustScoreDescription: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    statusCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    statusTitle: {
      fontSize: Typography.lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    statusContent: {
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
    checkInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.sm,
    },
    checkInButtonText: {
      color: colors.background,
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
    },
    checkOutButtonText: {
      color: colors.background,
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
    sectionTitle: {
      fontSize: Typography.lg,
      fontWeight: '600',
      color: colors.text,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    quickActions: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing['2xl'],
      gap: Spacing.md,
    },
    quickAction: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundLighter,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    quickActionText: {
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.text,
    },
    activityCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing['2xl'],
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundLighter,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: Typography.base,
      fontWeight: '600',
      color: colors.text,
    },
    activitySubtitle: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
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
      fontSize: Typography.lg,
      fontWeight: '600',
      color: colors.text,
    },
    modalContent: {
      gap: Spacing.md,
    },
    modalSubtitle: {
      fontSize: Typography.base,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    explanationBox: {
      gap: Spacing.sm,
    },
    explanationTitle: {
      fontSize: Typography.base,
      fontWeight: '600',
      color: colors.text,
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
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.text,
    },
    factorDescription: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    scoreTiers: {
      marginTop: Spacing.md,
    },
    scoreTiersTitle: {
      fontSize: Typography.base,
      fontWeight: '600',
      color: colors.text,
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
      fontSize: Typography.sm,
      color: colors.text,
    },
    modalFooterText: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
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
