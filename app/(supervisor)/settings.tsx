import React, { useMemo } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import {
  BorderRadius,
  Spacing,
  ThemeColors,
  Typography,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemePreference } from "@/hooks/use-theme-preference";

export default function SupervisorSettingsScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const { themePreference, setThemePreference, effectiveTheme } =
    useThemePreference();
  const isDark = effectiveTheme === "dark";

  const themeLabel = useMemo(() => {
    if (themePreference === "system") {
      return `System (${effectiveTheme})`;
    }

    return themePreference.charAt(0).toUpperCase() + themePreference.slice(1);
  }, [effectiveTheme, themePreference]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Display and navigation preferences.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Appearance</Text>

        <View style={styles.controlRow}>
          <View style={styles.controlCopy}>
            <Text style={styles.controlLabel}>Dark mode</Text>
            <Text style={styles.controlDescription}>{themeLabel}</Text>
          </View>
          <Switch
            value={isDark}
            trackColor={{ false: colors.textMuted, true: colors.primary }}
            thumbColor={isDark ? colors.primary : "#FFFFFF"}
            onValueChange={(value) =>
              setThemePreference(value ? "dark" : "light")
            }
          />
        </View>

        <View style={styles.segmentedControl}>
          {(["system", "light", "dark"] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.segment,
                themePreference === value && styles.segmentActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setThemePreference(value)}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  themePreference === value && styles.segmentLabelActive,
                ]}
              >
                {value === "system"
                  ? "System"
                  : value.charAt(0).toUpperCase() + value.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
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
    marginBottom: Spacing.lg,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  sectionHeading: {
    color: colors.text,
    fontSize: Typography.lg,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  controlRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  controlCopy: {
    flex: 1,
  },
  controlLabel: {
    color: colors.text,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  controlDescription: {
    color: colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 4,
  },
  segmentedControl: {
    backgroundColor: colors.backgroundLight,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentLabel: {
    color: colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  segmentLabelActive: {
    color: colors.background,
  },
});
