import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { organizationService } from "@/services/supabase";
import { useAttendanceStore } from "@/store/attendanceStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type OrganizationInfo = {
  name?: string;
  code?: string;
};

type Props = {
  organization: OrganizationInfo | null;
};

type ModalMode = "leave" | "disband" | null;

export function OrganizationLifecycleActions({ organization }: Props) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuthStore = useAuthStore((state) => state.logout);
  const resetAttendance = useAttendanceStore((state) => state.resetAttendance);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    if (isSubmitting) return;
    setModalMode(null);
    setReason("");
    setConfirmation("");
  };

  const routeToOnboarding = () => {
    resetAttendance();
    clearAuthStore();
    router.replace("/(auth)/onboarding");
  };

  const handleLeave = async () => {
    setIsSubmitting(true);
    try {
      await organizationService.leaveOrganization(reason);
      Alert.alert(
        "Left Organization",
        "You have left this organization. Choose create or join organization to continue.",
        [{ text: "OK", onPress: routeToOnboarding }],
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to Leave",
        error.message || "Failed to leave organization.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisband = async () => {
    setIsSubmitting(true);
    try {
      await organizationService.disbandOrganization(reason);
      Alert.alert(
        "Organization Disbanded",
        "This organization has been disbanded. All members will need to create or join an organization again.",
        [{ text: "OK", onPress: routeToOnboarding }],
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to Disband",
        error.message || "Failed to disband organization.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredConfirmation = organization?.name || organization?.code || "";
  const confirmationMatches =
    !!requiredConfirmation &&
    [organization?.name, organization?.code]
      .filter(Boolean)
      .some((value) => value?.trim().toLowerCase() === confirmation.trim().toLowerCase());
  const canDisband = reason.trim().length > 0 && confirmationMatches;

  return (
    <>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setModalMode("leave")}
      >
        <IconSymbol
          name="person.crop.circle.badge.xmark"
          size={20}
          color={colors.error}
        />
        <Text style={[styles.actionButtonText, styles.dangerText]}>
          Leave Organization
        </Text>
        <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {user?.role === "admin" ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setModalMode("disband")}
        >
          <IconSymbol name="building.2" size={20} color={colors.error} />
          <Text style={[styles.actionButtonText, styles.dangerText]}>
            Disband Organization
          </Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      <Modal
        transparent
        animationType="fade"
        visible={modalMode !== null}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.overlay} onPress={closeModal}>
            <Pressable style={styles.modalCard}>
              {modalMode === "leave" ? (
                <>
                  <Text style={styles.modalTitle}>Leave Organization</Text>
                  <Text style={styles.modalBody}>
                    Your organization profile will be deleted. Related
                    attendance, requests, reports, and assigned data may also be
                    removed according to organization data rules. Your login will
                    stay active so you can create or join another organization.
                  </Text>
                  <Text style={styles.inputLabel}>Reason (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Why are you leaving?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.modalActions}>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={closeModal}
                      disabled={isSubmitting}
                      style={styles.modalButton}
                    />
                    <Button
                      title="Leave"
                      onPress={handleLeave}
                      loading={isSubmitting}
                      style={styles.modalButton}
                    />
                  </View>
                </>
              ) : null}

              {modalMode === "disband" ? (
                <>
                  <Text style={styles.modalTitle}>Disband Organization</Text>
                  <Text style={styles.modalBody}>
                    This will mark the organization as disbanded and remove every
                    member profile from it. Members will need to create or join an
                    organization again. This action is only available to admins.
                  </Text>
                  <Text style={styles.inputLabel}>Reason (required)</Text>
                  <TextInput
                    style={styles.input}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Why is this organization being disbanded?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                  <Text style={styles.inputLabel}>
                    Type organization name or code to confirm
                  </Text>
                  <TextInput
                    style={styles.confirmInput}
                    value={confirmation}
                    onChangeText={setConfirmation}
                    placeholder={requiredConfirmation || "Organization name/code"}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                  <View style={styles.modalActions}>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={closeModal}
                      disabled={isSubmitting}
                      style={styles.modalButton}
                    />
                    <Button
                      title="Disband"
                      onPress={handleDisband}
                      loading={isSubmitting}
                      disabled={!canDisband}
                      style={styles.modalButton}
                    />
                  </View>
                </>
              ) : null}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
    },
    actionButtonText: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: "700",
    },
    dangerText: {
      color: colors.error,
    },
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      padding: Spacing.lg,
    },
    keyboardAvoider: {
      flex: 1,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    modalTitle: {
      color: colors.text,
      fontSize: Typography.xl,
      fontWeight: "800",
      marginBottom: Spacing.sm,
    },
    modalBody: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      lineHeight: 20,
      marginBottom: Spacing.lg,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      fontWeight: "700",
      marginBottom: Spacing.xs,
    },
    input: {
      minHeight: 110,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundLighter,
      color: colors.text,
      padding: Spacing.md,
      fontSize: Typography.base,
      lineHeight: 22,
      marginBottom: Spacing.md,
    },
    confirmInput: {
      minHeight: 48,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundLighter,
      color: colors.text,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.base,
      marginBottom: Spacing.md,
    },
    modalActions: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    modalButton: {
      flex: 1,
    },
  });
