/**
 * Supervisor Team Screen
 * Employee approvals and TrustScore overview.
 */

import { Image } from "expo-image";
import { Card } from "@/components/Card";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supervisorService } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import DecorativeShapes from "@/components/DecorativeShapes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "employee" | "supervisor" | "admin";
  status: "pending" | "active" | "suspended";
  trust_score: number;
  avatar_url?: string | null;
  created_at: string;
};

type TeamAttendanceLog = {
  id: string;
  check_in_time: string;
  check_out_time?: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  check_out_lat?: number | null;
  check_out_lng?: number | null;
  check_in_wifi_bssid?: string | null;
  check_out_wifi_bssid?: string | null;
  profiles?: {
    name?: string;
    email?: string;
    avatar_url?: string | null;
  } | null;
};

export default function SupervisorTeamScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const user = useAuthStore((state) => state.user);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<TeamAttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!user?.organization_id) return;

    try {
      const [memberData, attendanceData] = await Promise.all([
        supervisorService.getTeamMembers(user.organization_id),
        supervisorService.getTeamAttendanceToday(user.organization_id),
      ]);

      setMembers(memberData as TeamMember[]);
      setAttendanceLogs(attendanceData as TeamAttendanceLog[]);
    } catch (error) {
      console.error("Load team data error:", error);
      Alert.alert("Error", "Failed to load team data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.organization_id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const pendingMembers = useMemo(
    () => members.filter((member) => member.status === "pending"),
    [members],
  );

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "active"),
    [members],
  );

  const averageTrustScore = useMemo(() => {
    if (activeMembers.length === 0) return 0;
    const total = activeMembers.reduce(
      (sum, member) => sum + (member.trust_score || 0),
      0,
    );
    return Math.round(total / activeMembers.length);
  }, [activeMembers]);

  const handleStatusUpdate = async (
    memberId: string,
    status: "active" | "suspended",
  ) => {
    setUpdatingId(memberId);
    try {
      const updated = await supervisorService.updateRegistrationStatus(
        memberId,
        status,
      );
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId ? { ...member, ...updated } : member,
        ),
      );
      Alert.alert(
        "Success",
        status === "active" ? "Registration approved" : "Registration rejected",
      );
    } catch (error) {
      console.error("Update registration error:", error);
      Alert.alert("Error", "Failed to update registration");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading employees...</Text>
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
        <Text style={styles.headerEyebrow}>Employee Management</Text>
        <Text style={styles.headerTitle}>Team Overview</Text>
        <Text style={styles.headerSubtitle}>
          Monitor attendance, approve registrations, and review team health.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{pendingMembers.length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{activeMembers.length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{averageTrustScore}</Text>
          <Text style={styles.summaryLabel}>Avg TrustScore</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Today Attendance</Text>
      <View style={styles.list}>
        {attendanceLogs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <IconSymbol
              name="clock.fill"
              size={30}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>No check-ins yet</Text>
            <Text style={styles.emptyText}>
              Team check-in and checkout logs for today will appear here.
            </Text>
          </Card>
        ) : (
          attendanceLogs.map((log) => (
            <AttendanceLogCard key={log.id} log={log} />
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>New Registrations</Text>
      <View style={styles.list}>
        {pendingMembers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={30}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>No pending registrations</Text>
            <Text style={styles.emptyText}>
              New employees who join your organization will appear here.
            </Text>
          </Card>
        ) : (
          pendingMembers.map((member) => (
            <MemberApprovalCard
              key={member.id}
              member={member}
              updating={updatingId === member.id}
              onApprove={() => handleStatusUpdate(member.id, "active")}
              onReject={() => handleStatusUpdate(member.id, "suspended")}
            />
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>TrustScore Overview</Text>
      <View style={styles.list}>
        {activeMembers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active employees yet</Text>
          </Card>
        ) : (
          activeMembers.map((member) => (
            <TrustScoreRow key={member.id} member={member} />
          ))
        )}
      </View>
    </ScrollView>
    </View>
  );
}

function AttendanceLogCard({ log }: { log: TeamAttendanceLog }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Card style={styles.attendanceCard}>
      <View style={styles.attendanceTop}>
        <Avatar name={log.profiles?.name || "Employee"} avatarUrl={log.profiles?.avatar_url} small />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {log.profiles?.name || "Employee"}
          </Text>
          <Text style={styles.memberEmail}>
            {log.profiles?.email || "No email"}
          </Text>
        </View>
        <View
          style={[
            styles.attendanceBadge,
            log.check_out_time && styles.completedBadge,
          ]}
        >
          <Text
            style={[
              styles.attendanceBadgeText,
              log.check_out_time && styles.completedBadgeText,
            ]}
          >
            {log.check_out_time ? "Done" : "Checked in"}
          </Text>
        </View>
      </View>

      <View style={styles.attendanceGrid}>
        <AttendanceField
          label="Check-in"
          value={formatTime(log.check_in_time)}
        />
        <AttendanceField
          label="Checkout"
          value={
            log.check_out_time ? formatTime(log.check_out_time) : "Not yet"
          }
        />
        <AttendanceField
          label="Check-in Location"
          value={formatLocation(log.check_in_lat, log.check_in_lng)}
        />
        <AttendanceField
          label="Checkout Location"
          value={formatLocation(log.check_out_lat, log.check_out_lng)}
        />
        <AttendanceField
          label="Check-in BSSID"
          value={log.check_in_wifi_bssid || "Not recorded"}
        />
        <AttendanceField
          label="Checkout BSSID"
          value={log.check_out_wifi_bssid || "Not recorded"}
        />
      </View>
    </Card>
  );
}

function AttendanceField({ label, value }: { label: string; value: string }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.attendanceField}>
      <Text style={styles.attendanceLabel}>{label}</Text>
      <Text style={styles.attendanceValue}>{value}</Text>
    </View>
  );
}

function MemberApprovalCard({
  member,
  updating,
  onApprove,
  onReject,
}: {
  member: TeamMember;
  updating: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Card style={styles.memberCard}>
      <View style={styles.memberTop}>
        <Avatar name={member.name} avatarUrl={member.avatar_url} />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberEmail}>{member.email}</Text>
          <Text style={styles.memberMeta}>
            Joined {formatDate(member.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          disabled={updating}
          onPress={onReject}
        >
          <Text style={[styles.actionText, { color: colors.error }]}>
            Reject
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          disabled={updating}
          onPress={onApprove}
        >
          {updating ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.actionText, { color: colors.background }]}>
              Approve
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function TrustScoreRow({ member }: { member: TeamMember }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Card style={styles.trustRow}>
      <View style={styles.trustLeft}>
        <Avatar name={member.name} avatarUrl={member.avatar_url} small />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberEmail}>
            {member.role === "supervisor" ? "Supervisor" : "Employee"}
          </Text>
        </View>
      </View>
      <TrustScoreBadge
        score={member.trust_score || 50}
        size="medium"
        showLabel
      />
    </Card>
  );
}

function Avatar({ name, avatarUrl, small = false }: { name: string; avatarUrl?: string | null; small?: boolean }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.avatar, small && styles.avatarSmall]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatarImage, small && styles.avatarImageSmall]}
          contentFit="cover"
          cachePolicy="none"
          recyclingKey={avatarUrl}
          transition={200}
        />
      ) : (
        <Text style={[styles.avatarText, small && styles.avatarTextSmall]}>
          {initials || "U"}
        </Text>
      )}
    </View>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLocation(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return "Not recorded";
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
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
    summaryRow: {
      flexDirection: "row",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    summaryCard: {
      flex: 1,
      alignItems: "center",
      minHeight: 96,
      justifyContent: "center",
    },
    summaryValue: {
      color: colors.primary,
      fontSize: Typography["2xl"],
      fontWeight: "800",
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: Typography.xs,
      textAlign: "center",
      marginTop: Spacing.xs,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "700",
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      marginTop: Spacing.sm,
    },
    list: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      gap: Spacing.md,
    },
    memberCard: {
      gap: Spacing.md,
    },
    attendanceCard: {
      gap: Spacing.md,
    },
    attendanceTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    attendanceBadge: {
      backgroundColor: `${colors.primary}22`,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    completedBadge: {
      backgroundColor: colors.backgroundLighter,
    },
    attendanceBadgeText: {
      color: colors.primary,
      fontSize: Typography.xs,
      fontWeight: "800",
    },
    completedBadgeText: {
      color: colors.textSecondary,
    },
    attendanceGrid: {
      gap: Spacing.sm,
    },
    attendanceField: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: Spacing.sm,
    },
    attendanceLabel: {
      color: colors.textMuted,
      fontSize: Typography.xs,
      fontWeight: "700",
      marginBottom: 2,
    },
    attendanceValue: {
      color: colors.text,
      fontSize: Typography.sm,
      fontWeight: "600",
    },
    memberTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    avatarSmall: {
      width: 42,
      height: 42,
    },
    avatarImage: {
      width: 54,
      height: 54,
      borderRadius: BorderRadius.full,
    },
    avatarImageSmall: {
      width: 42,
      height: 42,
    },
    avatarText: {
      color: colors.background,
      fontSize: Typography.lg,
      fontWeight: "800",
    },
    avatarTextSmall: {
      fontSize: Typography.sm,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: "700",
    },
    memberEmail: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: 2,
    },
    memberMeta: {
      color: colors.textMuted,
      fontSize: Typography.xs,
      marginTop: Spacing.xs,
    },
    actions: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
      height: 42,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
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
    trustRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    trustLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: Spacing.md,
    },
    emptyCard: {
      alignItems: "center",
      paddingVertical: Spacing.xl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "700",
      marginTop: Spacing.sm,
      textAlign: "center",
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      textAlign: "center",
      marginTop: Spacing.xs,
    },
  });
