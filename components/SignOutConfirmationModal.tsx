import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SignOutConfirmationModalProps = {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SignOutConfirmationModal({
  visible,
  loading = false,
  onCancel,
  onConfirm,
}: SignOutConfirmationModalProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.card}>
          <View style={styles.iconWrapper}>
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={26}
              color={colors.error}
            />
          </View>
          <Text style={styles.title}>Sign Out</Text>
          <Text style={styles.message}>
            Are you sure you want to sign out?
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>Sign Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      padding: Spacing.lg,
    },
    card: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    iconWrapper: {
      width: 54,
      height: 54,
      borderRadius: BorderRadius.full,
      backgroundColor: `${colors.error}22`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: Typography.xl,
      fontWeight: "800",
      marginBottom: Spacing.sm,
    },
    message: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      lineHeight: Typography.lineHeightBase,
      marginBottom: Spacing.lg,
    },
    actions: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    button: {
      flex: 1,
      minHeight: 48,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
    },
    cancelButton: {
      backgroundColor: colors.cardLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmButton: {
      backgroundColor: colors.error,
      borderWidth: 1,
      borderColor: colors.error,
    },
    cancelText: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: "700",
    },
    confirmText: {
      color: "#FFFFFF",
      fontSize: Typography.base,
      fontWeight: "800",
    },
  });
