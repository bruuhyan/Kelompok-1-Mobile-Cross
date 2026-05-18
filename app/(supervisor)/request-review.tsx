/**
 * Supervisor Request Review Screen
 * Shows all holiday/overtime submissions in the supervisor organization.
 */

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  BorderRadius,
  Spacing,
  ThemeColors,
  Typography,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";

type RequestSubmission = {
  id: string;
  type: "holiday" | "overtime";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  } | null;
};

type RequestSubmissionRow = Omit<RequestSubmission, "profiles"> & {
  profiles?:
    | {
        name: string;
        email: string;
      }
    | {
        name: string;
        email: string;
      }[]
    | null;
};

export default function SupervisorRequestReviewScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const organizationId = useAuthStore((state) => state.user?.organization_id);
  const [requests, setRequests] = useState<RequestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const statusConfig = {
    pending: { label: "Pending", color: colors.warning },
    approved: { label: "Approved", color: colors.success },
    rejected: { label: "Disapproved", color: colors.error },
  };

  const fetchRequests = useCallback(
    async ({ showLoader = false }: { showLoader?: boolean } = {}) => {
      if (!organizationId) {
        setRequests([]);
        setError("No organization is linked to this account.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      setError("");
      const { data, error: fetchError } = await supabase
        .from("requests")
        .select(
          "id,type,start_date,end_date,reason,status,created_at,profiles:user_id(name,email)",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setRequests(
          ((data as RequestSubmissionRow[]) ?? []).map(normalizeRequest),
        );
      }

      setLoading(false);
      setRefreshing(false);
    },
    [organizationId],
  );

  useFocusEffect(
    useCallback(() => {
      fetchRequests({ showLoader: true });
    }, [fetchRequests]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const renderRequest = ({ item }: { item: RequestSubmission }) => {
    const status = statusConfig[item.status];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => router.push(`/(supervisor)/request-detail/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.cardTitle}>{formatRequestType(item.type)}</Text>
            <Text style={styles.employeeName}>
              {item.profiles?.name ?? "Unknown employee"}
            </Text>
          </View>
          <View style={[styles.badge, { borderColor: status.color }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>
          {formatDate(item.start_date)}
          {item.end_date !== item.start_date
            ? ` - ${formatDate(item.end_date)}`
            : ""}
        </Text>
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.subtitle}>
          Review holiday and overtime submissions.
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={
          requests.length ? styles.listContent : styles.emptyContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySubtitle}>
              New employee requests will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function normalizeRequest(row: RequestSubmissionRow): RequestSubmission {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    ...row,
    profiles: profile ?? null,
  };
}

function formatRequestType(type: RequestSubmission["type"]) {
  return type === "holiday" ? "Holiday Request" : "Overtime Request";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      gap: Spacing.sm,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: Typography["3xl"],
      fontWeight: "700",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      marginTop: Spacing.xs,
    },
    listContent: {
      padding: Spacing.lg,
      paddingTop: Spacing.sm,
      gap: Spacing.md,
    },
    emptyContent: {
      flexGrow: 1,
      padding: Spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      padding: Spacing.md,
    },
    cardHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.md,
      justifyContent: "space-between",
    },
    cardTitleGroup: {
      flex: 1,
    },
    cardTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "700",
    },
    employeeName: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: 2,
    },
    badge: {
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    badgeText: {
      fontSize: Typography.xs,
      fontWeight: "700",
    },
    dateText: {
      color: colors.primary,
      fontSize: Typography.sm,
      fontWeight: "600",
      marginTop: Spacing.md,
    },
    reasonText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      lineHeight: 20,
      marginTop: Spacing.xs,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    errorText: {
      color: colors.error,
      fontSize: Typography.sm,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    emptyState: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    emptyTitle: {
      color: colors.text,
      fontSize: Typography.xl,
      fontWeight: "700",
    },
    emptySubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: Spacing.xs,
      textAlign: "center",
    },
  });
