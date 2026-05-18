/**
 * Supervisor Request Review Screen
 */

import React, { useCallback, useEffect, useState } from 'react';
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
import { BorderRadius, BrandColors, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { supervisorService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

type ReviewRequest = {
  id: string;
  type: 'holiday' | 'overtime';
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
  profiles?: {
    name?: string;
    email?: string;
    trust_score?: number;
  } | null;
};

export default function SupervisorRequestReviewScreen() {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user?.organization_id) return;

    try {
      const data = await supervisorService.getPendingRequests(user.organization_id);
      setRequests((data as ReviewRequest[]).filter((request) => request.type === 'holiday'));
    } catch (error) {
      console.error('Load requests error:', error);
      Alert.alert('Error', 'Failed to load pending requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.organization_id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!user?.id) return;

    setReviewingId(requestId);
    try {
      await supervisorService.reviewRequest(requestId, user.id, status);
      setRequests((current) => current.filter((request) => request.id !== requestId));
      setExpandedId((current) => (current === requestId ? null : current));
      Alert.alert('Success', `Request ${status}`);
    } catch (error) {
      console.error('Review request error:', error);
      Alert.alert('Error', 'Failed to review request');
    } finally {
      setReviewingId(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading pending requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BrandColors.primary} />
      }>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Requests</Text>
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <Text style={styles.headerSubtitle}>{requests.length} employee leave requests waiting for approval</Text>
      </View>

      <View style={styles.list}>
        {requests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <IconSymbol name="checkmark.circle.fill" size={32} color={BrandColors.primary} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>New holiday and overtime requests will appear here.</Text>
          </Card>
        ) : (
          requests.map((request) => {
            const expanded = expandedId === request.id;

            return (
            <TouchableOpacity
              key={request.id}
              activeOpacity={0.82}
              onPress={() => setExpandedId((current) => (current === request.id ? null : request.id))}>
            <Card style={styles.requestCard}>
              <View style={styles.requestTop}>
                <View style={styles.requestMain}>
                  <Text style={styles.employeeName}>{request.profiles?.name || 'Employee'}</Text>
                  <Text style={styles.employeeEmail}>{request.profiles?.email || 'No email'}</Text>
                </View>
                <TrustScoreBadge score={request.profiles?.trust_score || 50} size="small" />
              </View>

              <View style={styles.dateRow}>
                <IconSymbol name="calendar" size={16} color={BrandColors.textMuted} />
                <Text style={styles.dateText}>
                  {formatLongDate(request.start_date)} to {formatLongDate(request.end_date)}
                </Text>
              </View>

              <View style={styles.tapHintRow}>
                <Text style={styles.tapHint}>{expanded ? 'Hide details' : 'Tap for details'}</Text>
                <IconSymbol name={expanded ? 'chevron.down' : 'chevron.right'} size={20} color={BrandColors.textMuted} />
              </View>

              {expanded && (
                <>
                  <View style={styles.detailBlock}>
                    <DetailRow label="Type" value="Leave" />
                    <DetailRow label="Submitted" value={formatLongDate(request.created_at)} />
                    <DetailRow label="Reason" value={request.reason} />
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      disabled={reviewingId === request.id}
                      onPress={() => handleReview(request.id, 'rejected')}>
                      <IconSymbol name="person.crop.circle.badge.xmark" size={18} color={BrandColors.error} />
                      <Text style={[styles.actionText, { color: BrandColors.error }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      disabled={reviewingId === request.id}
                      onPress={() => handleReview(request.id, 'approved')}>
                      {reviewingId === request.id ? (
                        <ActivityIndicator color={BrandColors.background} />
                      ) : (
                        <>
                          <IconSymbol name="checkmark.seal.fill" size={18} color={BrandColors.background} />
                          <Text style={[styles.actionText, { color: BrandColors.background }]}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Card>
            </TouchableOpacity>
          );
          })
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  headerEyebrow: {
    color: BrandColors.primary,
    fontSize: Typography.sm,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    color: BrandColors.text,
    fontSize: Typography['3xl'],
    fontWeight: '800',
  },
  headerSubtitle: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
    marginTop: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  requestCard: {
    gap: Spacing.md,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  employeeName: {
    color: BrandColors.text,
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  employeeEmail: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
    paddingTop: Spacing.sm,
  },
  tapHint: {
    color: BrandColors.primary,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  detailBlock: {
    backgroundColor: BrandColors.backgroundLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  detailRow: {
    gap: 2,
  },
  detailLabel: {
    color: BrandColors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  detailValue: {
    color: BrandColors.text,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rejectButton: {
    backgroundColor: BrandColors.backgroundLight,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  approveButton: {
    backgroundColor: BrandColors.primary,
  },
  actionText: {
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyTitle: {
    color: BrandColors.text,
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptyText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
