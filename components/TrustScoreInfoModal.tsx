import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TrustScoreInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function TrustScoreInfoModal({
  visible,
  onClose,
}: TrustScoreInfoModalProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Understanding Your Trust Score</Text>
            <TouchableOpacity onPress={onClose}>
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
                  <IconSymbol
                    name="clock.fill"
                    size={18}
                    color={colors.primary}
                  />
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
                  <IconSymbol
                    name="location.fill"
                    size={18}
                    color={colors.info}
                  />
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
                <View
                  style={[styles.tierDot, { backgroundColor: colors.trustHigh }]}
                />
                <Text style={styles.tierLabel}>36-50: Trusted (Green)</Text>
              </View>
              <View style={styles.tierRow}>
                <View
                  style={[styles.tierDot, { backgroundColor: colors.trustMedium }]}
                />
                <Text style={styles.tierLabel}>20-35: Moderate (Yellow)</Text>
              </View>
              <View style={styles.tierRow}>
                <View
                  style={[styles.tierDot, { backgroundColor: colors.trustLow }]}
                />
                <Text style={styles.tierLabel}>0-19: At Risk (Red)</Text>
              </View>
            </View>
            <Text style={styles.modalFooterText}>
              Your score is recalculated after each check-in/check-out to
              reflect your recent behavior patterns.
            </Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.lg,
    },
    modalContainer: {
      width: "100%",
      maxWidth: 350,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    modalTitle: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "600",
    },
    modalContent: {
      gap: Spacing.md,
    },
    modalSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      fontWeight: "500",
    },
    explanationBox: {
      gap: Spacing.sm,
    },
    explanationTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: "600",
      marginBottom: Spacing.xs,
    },
    factorRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    factorIcon: {
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    factorText: {
      flex: 1,
    },
    factorTitle: {
      color: colors.text,
      fontSize: Typography.sm,
      fontWeight: "600",
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
      fontWeight: "600",
      marginBottom: Spacing.xs,
    },
    tierRow: {
      flexDirection: "row",
      alignItems: "center",
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
      textAlign: "center",
      marginTop: Spacing.md,
      fontStyle: "italic",
    },
    modalCloseButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: "center",
      marginTop: Spacing.sm,
    },
    modalCloseButtonText: {
      color: colors.background,
      fontSize: Typography.base,
      fontWeight: "600",
    },
  });
