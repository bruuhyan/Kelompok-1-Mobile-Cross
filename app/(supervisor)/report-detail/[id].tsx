/**
 * Supervisor Report Detail Screen
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import DecorativeShapes from "@/components/DecorativeShapes";

type ReportDetail = {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'reviewed' | 'resolved';
  review_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    trust_score: number;
  } | null;
};

type ReportDetailRow = Omit<ReportDetail, 'profiles'> & {
  profiles?:
    | {
        name: string;
        email: string;
        trust_score: number;
      }
    | {
        name: string;
        email: string;
        trust_score: number;
      }[]
    | null;
};

export default function ReportDetailScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const statusConfig = {
    pending: { label: 'Pending', color: colors.warning },
    reviewed: { label: 'Disapproved', color: colors.error },
    resolved: { label: 'Approved', color: colors.success },
  };
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const reviewerId = user?.id;
  const organizationId = user?.organization_id;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'resolved' | 'reviewed' | null>(null);

  const fetchReport = useCallback(async () => {
    if (!id || !organizationId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('reports')
      .select(
        'id,title,content,status,review_notes,reviewed_at,created_at,profiles:user_id(name,email,trust_score)',
      )
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      Alert.alert('Report not found', error.message);
      router.back();
    } else {
      const detail = normalizeReportDetail(data as ReportDetailRow);
      setReport(detail);
      setNote(detail.review_notes ?? '');
    }

    setLoading(false);
  }, [id, organizationId, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleReview = async (status: 'resolved' | 'reviewed') => {
    if (!id || !reviewerId || !organizationId) return;

    setSavingStatus(status);
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: note.trim() || null,
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    setSavingStatus(null);

    if (error) {
      Alert.alert('Failed to update report', error.message);
      return;
    }

    Alert.alert('Report updated', `Report has been ${status === 'resolved' ? 'approved' : 'disapproved'}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (loading || !report) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  const status = statusConfig[report.status];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <DecorativeShapes variant="supervisor" />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Button title="Back" variant="ghost" size="small" onPress={() => router.back()} />
          <View style={[styles.badge, { borderColor: status.color }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.subtitle}>Submitted by {report.profiles?.name ?? 'Unknown employee'}</Text>

        <View style={styles.section}>
          <InfoRow label="Email" value={report.profiles?.email ?? '-'} />
          <InfoRow label="Trust Score" value={`${report.profiles?.trust_score ?? '-'} / 50`} />
          <InfoRow label="Submitted" value={formatDateTime(report.created_at)} />
          {report.reviewed_at ? <InfoRow label="Reviewed" value={formatDateTime(report.reviewed_at)} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Report Content</Text>
          <Text style={styles.bodyText}>{report.content}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Review Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note for this decision"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.noteInput}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Disapprove"
            variant="secondary"
            onPress={() => handleReview('reviewed')}
            loading={savingStatus === 'reviewed'}
            disabled={!!savingStatus}
            style={styles.actionButton}
          />
          <Button
            title="Approve"
            onPress={() => handleReview('resolved')}
            loading={savingStatus === 'resolved'}
            disabled={!!savingStatus}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function normalizeReportDetail(row: ReportDetailRow): ReportDetail {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    ...row,
    profiles: profile ?? null,
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  centerContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: Typography['3xl'],
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: Typography.base,
    marginTop: Spacing.xs,
  },
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  bodyText: {
    color: colors.text,
    fontSize: Typography.base,
    lineHeight: 24,
  },
  infoRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: Typography.sm,
  },
  infoValue: {
    color: colors.text,
    flex: 1.4,
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  noteInput: {
    backgroundColor: colors.backgroundLight,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 110,
    padding: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: Typography.sm,
  },
});
