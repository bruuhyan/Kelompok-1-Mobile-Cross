/**
 * Supervisor Request Review Screen
 * Shows all holiday/overtime submissions in the supervisor organization.
 */

import { Card } from "@/components/Card";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supervisorService } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import DecorativeShapes from "@/components/DecorativeShapes";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ReviewRequest = {
  id: string;
  type: "holiday" | "overtime";
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
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const data = await supervisorService.getPendingRequests(
        user.organization_id,
      );
      setRequests(
        (data as ReviewRequest[]).filter(
          (request) => request.type === "holiday",
        ),
      );
    } catch (error) {
      console.error("Load requests error:", error);
      Alert.alert("Error", "Failed to load pending requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.organization_id]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const handleReview = async (
    requestId: string,
    status: "approved" | "rejected",
  ) => {
    if (!user?.id) return;

    setReviewingId(requestId);
    try {
      await supervisorService.reviewRequest(requestId, user.id, status);
      setRequests((current) =>
        current.filter((request) => request.id !== requestId),
      );
      setExpandedId((current) => (current === requestId ? null : current));
      Alert.alert("Success", `Request ${status}`);
    } catch (error) {
      console.error("Review request error:", error);
      Alert.alert("Error", "Failed to review request");
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
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading pending requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DecorativeShapes variant="supervisor" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Requests</Text>
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <Text style={styles.headerSubtitle}>
          {requests.length} employee leave requests waiting for approval
        </Text>
      </View>

      <View style={styles.list}>
        {requests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>
              New holiday and overtime requests will appear here.
            </Text>
          </Card>
        ) : (
          requests.map((request) => {
            const expanded = expandedId === request.id;

            return (
              <TouchableOpacity
                key={request.id}
                activeOpacity={0.82}
                onPress={() =>
                  setExpandedId((current) =>
                    current === request.id ? null : request.id,
                  )
                }
              >
                <Card style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <View style={styles.requestMain}>
                      <Text style={styles.employeeName}>
                        {request.profiles?.name || "Employee"}
                      </Text>
                      <Text style={styles.employeeEmail}>
                        {request.profiles?.email || "No email"}
                      </Text>
                    </View>
                    <TrustScoreBadge
                      score={request.profiles?.trust_score || 50}
                      size="small"
                    />
                  </View>

                  <View style={styles.dateRow}>
                    <IconSymbol
                      name="calendar"
                      size={16}
                      color={colors.textMuted}
                    />
                    <Text style={styles.dateText}>
                      {formatLongDate(request.start_date)} to{" "}
                      {formatLongDate(request.end_date)}
                    </Text>
                  </View>

                  <View style={styles.tapHintRow}>
                    <Text style={styles.tapHint}>
                      {expanded ? "Hide details" : "Tap for details"}
                    </Text>
                    <IconSymbol
                      name={expanded ? "chevron.down" : "chevron.right"}
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>

                  {expanded && (
                    <>
                      <View style={styles.detailBlock}>
                        <DetailRow label="Type" value="Leave" />
                        <DetailRow
                          label="Submitted"
                          value={formatLongDate(request.created_at)}
                        />
                        <DetailRow label="Reason" value={request.reason} />
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          disabled={reviewingId === request.id}
                          onPress={() => handleReview(request.id, "rejected")}
                        >
                          <IconSymbol
                            name="person.crop.circle.badge.xmark"
                            size={18}
                            color={colors.error}
                          />
                          <Text
                            style={[
                              styles.actionText,
                              { color: colors.error },
                            ]}
                          >
                            Reject
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          disabled={reviewingId === request.id}
                          onPress={() => handleReview(request.id, "approved")}
                        >
                          {reviewingId === request.id ? (
                            <ActivityIndicator color={colors.background} />
                          ) : (
                            <>
                              <IconSymbol
                                name="checkmark.seal.fill"
                                size={18}
                                color={colors.background}
                              />
                              <Text
                                style={[
                                  styles.actionText,
                                  { color: colors.background },
                                ]}
                              >
                                Approve
                              </Text>
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
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      gap: Spacing.md,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    header: {
      padding: Spacing.lg,
      paddingTop: Spacing["2xl"],
    },
    headerEyebrow: {
      color: colors.primary,
      fontSize: Typography.sm,
      fontWeight: "800",
      marginBottom: Spacing.xs,
    },
    headerTitle: {
      color: colors.text,
      fontSize: Typography["3xl"],
      fontWeight: "800",
    },
    headerSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      marginTop: Spacing.xs,
    },
    list: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing["2xl"],
      gap: Spacing.md,
    },
    requestCard: {
      gap: Spacing.md,
    },
    requestTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    requestMain: {
      flex: 1,
      marginRight: Spacing.md,
    },
    employeeName: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "700",
    },
    employeeEmail: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: 2,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    dateText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    tapHintRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: Spacing.sm,
    },
    tapHint: {
      color: colors.primary,
      fontSize: Typography.sm,
      fontWeight: "700",
    },
    detailBlock: {
      backgroundColor: colors.backgroundLight,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    detailRow: {
      gap: 2,
    },
    detailLabel: {
      color: colors.textMuted,
      fontSize: Typography.xs,
      fontWeight: "700",
    },
    detailValue: {
      color: colors.text,
      fontSize: Typography.sm,
      lineHeight: 20,
    },
    actions: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
      height: 44,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: Spacing.sm,
    },
    rejectButton: {
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    approveButton: {
      backgroundColor: colors.primary,
    },
    actionText: {
      fontSize: Typography.sm,
      fontWeight: "800",
    },
    emptyCard: {
      alignItems: "center",
      paddingVertical: Spacing["2xl"],
    },
    emptyTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "700",
      marginTop: Spacing.md,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      textAlign: "center",
      marginTop: Spacing.xs,
    },
  });
