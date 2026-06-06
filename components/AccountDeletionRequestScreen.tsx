import DecorativeShapes, { ShapesVariant } from "@/components/DecorativeShapes";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SUPPORT_EMAIL } from "@/constants/legal";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { accountComplianceService } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  variant: ShapesVariant;
};

export function AccountDeletionRequestScreen({ variant }: Props) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id || !user.email) {
      Alert.alert("Error", "User account is not ready yet.");
      return;
    }

    Alert.alert(
      "Request Account Deletion",
      "Your account deletion request will be sent for review. You may lose access to attendance, reports, requests, tasks, profile photos, and organization data after processing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await accountComplianceService.requestAccountDeletion({
                user_id: user.id,
                organization_id: user.organization_id || null,
                email: user.email,
                name: user.name,
                reason: reason.trim() || null,
              });

              Alert.alert(
                "Request Submitted",
                `Your deletion request has been submitted. For urgent help, contact ${SUPPORT_EMAIL}.`,
                [{ text: "OK", onPress: () => router.back() }],
              );
            } catch (error: any) {
              console.error("Account deletion request error:", error);
              Alert.alert("Error", error.message || "Failed to submit deletion request.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <DecorativeShapes variant={variant} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Delete Account</Text>
            <Text style={styles.subtitle}>Request removal of your TrustEnd account and data.</Text>
          </View>
        </View>

        <Card style={styles.card} variant="elevated">
          <Text style={styles.cardTitle}>What Happens Next</Text>
          <Text style={styles.body}>
            Your request will be reviewed before deletion is completed. Some attendance or audit records may be retained if required for workplace, security, or legal purposes.
          </Text>
          <Text style={styles.body}>
            We may delete or anonymize your profile, profile photo, report photos, attendance records, requests, reports, tasks, and organization membership where permitted.
          </Text>
        </Card>

        <Card style={styles.card} variant="elevated">
          <Text style={styles.inputLabel}>Reason (optional)</Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="Tell us why you want to delete this account"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <Button
            title="Request Account Deletion"
            onPress={handleSubmit}
            loading={isSubmitting}
            size="large"
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
      paddingTop: Spacing["2xl"],
      paddingBottom: Spacing["3xl"],
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: Typography["3xl"],
      fontWeight: "800",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      marginTop: Spacing.xs,
    },
    card: {
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    cardTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "800",
    },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      lineHeight: 22,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      fontWeight: "700",
    },
    reasonInput: {
      minHeight: 130,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundLighter,
      color: colors.text,
      padding: Spacing.md,
      fontSize: Typography.base,
      lineHeight: 22,
      marginBottom: Spacing.sm,
    },
  });

