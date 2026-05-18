import React, { useMemo } from "react";
import { StyleSheet, View, Text, Switch, TouchableOpacity } from "react-native";
import { useThemePreference } from "@/hooks/use-theme-preference";
import {
  BorderRadius,
  Spacing,
  ThemeColors,
  Typography,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function SettingsScreen() {
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
  }, [themePreference, effectiveTheme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage display.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Appearance</Text>
        <View style={styles.controlRow}>
          <View>
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
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              themePreference === "system" && styles.radioButtonActive,
            ]}
            onPress={() => setThemePreference("system")}
          >
            <Text style={styles.radioLabel}>Follow system</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              themePreference === "light" && styles.radioButtonActive,
            ]}
            onPress={() => setThemePreference("light")}
          >
            <Text style={styles.radioLabel}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              themePreference === "dark" && styles.radioButtonActive,
            ]}
            onPress={() => setThemePreference("dark")}
          >
            <Text style={styles.radioLabel}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography["3xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: Typography.base,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
    backgroundColor: colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    color: colors.text,
    fontSize: Typography.lg,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
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
  radioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  radioButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLighter,
  },
  radioLabel: {
    color: colors.text,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});
