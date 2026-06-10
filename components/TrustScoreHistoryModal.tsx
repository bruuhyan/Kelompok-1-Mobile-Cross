import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Spacing,
  ThemeColors,
  TRUST_SCORE_MAX,
  Typography,
  getTrustScoreTier,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { attendanceService } from "@/services/attendanceService";
import { TrustScoreHistoryEntry } from "@/utils/types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TrustScoreHistoryModalProps = {
  visible: boolean;
  userId?: string;
  organizationId?: string;
  title: string;
  score: number;
  onClose: () => void;
};

function formatPoints(value: number) {
  const absoluteValue = Math.abs(value);
  const points = Number.isInteger(absoluteValue)
    ? String(absoluteValue)
    : absoluteValue.toFixed(1);

  return `${value >= 0 ? "+" : "-"}${points}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrustScoreHistoryModal({
  visible,
  userId,
  organizationId,
  title,
  score,
  onClose,
}: TrustScoreHistoryModalProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tier = getTrustScoreTier(score);
  const tierColor = colors[tier.colorKey];
  const [entries, setEntries] = useState<TrustScoreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !userId) return;

    let isMounted = true;

    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const history = await attendanceService.getTrustScoreHistory(userId, {
          organizationId,
        });

        if (isMounted) {
          setEntries(history);
        }
      } catch (loadError: any) {
        if (isMounted) {
          setEntries([]);
          setError(loadError.message || "Failed to load score history.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [organizationId, userId, visible]);

  const sheetHeight = Math.round(height * 0.8);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close trust score history"
            >
              <IconSymbol
                name="chevron.left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.headerMeta}>
                TrustScore {score} / {TRUST_SCORE_MAX}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.scoreDisplay}>
              <TrustScoreBadge score={score} size="large" showLabel />
              <View style={styles.scoreCopy}>
                <Text style={styles.scoreValue}>
                  {score} / {TRUST_SCORE_MAX}
                </Text>
                <Text style={[styles.tierLabel, { color: tierColor }]}>
                  {tier.label}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Score History</Text>

            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.emptyText}>Loading score history...</Text>
              </View>
            ) : error ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Unable to load history</Text>
                <Text style={styles.emptyText}>{error}</Text>
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No score changes yet</Text>
                <Text style={styles.emptyText}>
                  Score-impacting attendance activity will appear here.
                </Text>
              </View>
            ) : (
              entries.map((entry) => (
                <HistoryEntryCard key={entry.id} entry={entry} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function HistoryEntryCard({ entry }: { entry: TrustScoreHistoryEntry }) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const entryColor =
    entry.category === "offense" ? colors.error : colors.success;

  return (
    <View style={styles.entryCard}>
      <View style={styles.entryTop}>
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: `${entryColor}1F`,
              borderColor: `${entryColor}66`,
            },
          ]}
        >
          <Text style={[styles.categoryText, { color: entryColor }]}>
            {entry.label}
          </Text>
        </View>
        <Text style={[styles.pointsChange, { color: entryColor }]}>
          {formatPoints(entry.pointsChange)}
        </Text>
      </View>
      <Text style={styles.reason}>{entry.reason}</Text>
      <Text style={styles.entryDate}>{formatDateTime(entry.occurredAt)}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.58)",
      justifyContent: "flex-end",
    },
    dismissArea: {
      flex: 1,
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "800",
    },
    headerMeta: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginTop: 2,
      fontWeight: "700",
    },
    scrollArea: {
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      paddingBottom: Spacing["2xl"],
    },
    scoreDisplay: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    scoreCopy: {
      flex: 1,
    },
    scoreValue: {
      color: colors.text,
      fontSize: Typography["2xl"],
      fontWeight: "800",
    },
    tierLabel: {
      fontSize: Typography.base,
      fontWeight: "800",
      marginTop: Spacing.xs,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "800",
      marginBottom: Spacing.md,
    },
    entryCard: {
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    entryTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    categoryBadge: {
      borderWidth: 1,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    categoryText: {
      fontSize: Typography.xs,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    pointsChange: {
      fontSize: Typography.xl,
      fontWeight: "800",
    },
    reason: {
      color: colors.text,
      fontSize: Typography.base,
      lineHeight: Typography.lineHeightBase,
      fontWeight: "600",
    },
    entryDate: {
      color: colors.textMuted,
      fontSize: Typography.xs,
      marginTop: Spacing.sm,
      textAlign: "right",
      fontWeight: "700",
    },
    emptyState: {
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: "center",
      gap: Spacing.sm,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: "800",
      textAlign: "center",
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      lineHeight: 20,
      textAlign: "center",
    },
  });
