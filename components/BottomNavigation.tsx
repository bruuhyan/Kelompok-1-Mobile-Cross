import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import {
  Spacing,
  ThemeColors,
  Typography,
} from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";

export function BottomNavigation() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/")}
      >
        <IconSymbol name="house.fill" size={20} color={colors.primary} />
        <Text style={styles.navText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/explore")}
      >
        <IconSymbol name="paperplane.fill" size={20} color={colors.info} />
        <Text style={styles.navText}>Explore</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: Spacing.md,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  navText: {
    color: colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: "600",
  },
});
