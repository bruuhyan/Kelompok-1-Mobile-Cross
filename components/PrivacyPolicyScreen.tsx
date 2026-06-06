import DecorativeShapes, { ShapesVariant } from "@/components/DecorativeShapes";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PRIVACY_POLICY_SECTIONS } from "@/constants/legal";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  variant: ShapesVariant;
};

export function PrivacyPolicyScreen({ variant }: Props) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <DecorativeShapes variant={variant} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.subtitle}>How TrustEnd handles workplace data.</Text>
          </View>
        </View>

        <Text style={styles.updatedText}>Last updated: June 6, 2026</Text>

        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
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
    updatedText: {
      color: colors.textMuted,
      fontSize: Typography.sm,
      marginBottom: Spacing.lg,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: Typography.lg,
      fontWeight: "800",
      marginBottom: Spacing.xs,
    },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      lineHeight: 22,
    },
  });

