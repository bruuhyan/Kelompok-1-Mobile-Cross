/**
 * Supervisor Home Screen
 * Dashboard for pending requests, registrations, and team health.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BorderRadius, BrandColors, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { authService, supervisorService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [recentRequests, setRecentRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading supervisor dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={BrandColors.primary}
        />
      }>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Supervisor Dashboard</Text>
          <Text style={styles.userName}>{user?.name || 'Supervisor'}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={22} color={BrandColors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Pending Requests"
          value={summary.pendingRequests}
          icon="hourglass"
          color={BrandColors.warning}
        />
        <MetricCard
          label="New Registrations"
          value={summary.pendingRegistrations}
          icon="person.badge.plus"
          color={BrandColors.primary}
        />
        <MetricCard
          label="Active Employees"
          value={summary.activeEmployees}
          icon="person.2.fill"
          color={BrandColors.info}
        />
        <MetricCard
          label="Pending Reports"
          value={summary.pendingReports}
          icon="doc.text.magnifyingglass"
          color={BrandColors.error}
        />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <ActionCard
          title="Review Requests"
          subtitle={`${summary.pendingRequests} waiting`}
          icon="checkmark.seal.fill"
          onPress={() => router.push('/(supervisor)/request-review')}
        />
        <ActionCard
          title="Manage Employees"
          subtitle={`${summary.pendingRegistrations} new accounts`}
          icon="person.crop.circle.badge.checkmark"
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
          <EmptyState text="No pending requests right now" />
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
    </ScrollView>
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
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.actionIcon}>
        <IconSymbol name={icon} size={24} color={BrandColors.primary} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <IconSymbol name="chevron.right" size={22} color={BrandColors.textMuted} />
    </TouchableOpacity>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <IconSymbol name="checkmark.circle.fill" size={26} color={BrandColors.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.background,
    gap: Spacing.md,
  },
  loadingText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  greeting: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
  },
  userName: {
    color: BrandColors.text,
    fontSize: Typography['2xl'],
    fontWeight: '700',
  },
  iconButton: {
    padding: Spacing.sm,
  },
 metricsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: Spacing.md,
  paddingHorizontal: Spacing.lg,
  marginBottom: Spacing.lg,
},
metricCard: {
  width: 163,
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
    color: BrandColors.text,
    fontSize: Typography['3xl'],
    fontWeight: '800',
  },
  metricLabel: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  linkText: {
    color: BrandColors.primary,
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
    backgroundColor: BrandColors.card,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.backgroundLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: BrandColors.textSecondary,
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
    borderBottomColor: BrandColors.border,
  },
  requestContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  requestTitle: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  requestMeta: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  requestReason: {
    color: BrandColors.textMuted,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
  },
});
