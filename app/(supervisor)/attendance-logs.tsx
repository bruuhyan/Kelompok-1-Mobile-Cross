/**
 * Supervisor Attendance Logs Screen Placeholder
 * Will be implemented in Phase 11
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import DecorativeShapes from "@/components/DecorativeShapes";
import { ThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function SupervisorAttendanceLogsScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <DecorativeShapes variant="supervisor" />
      <PlaceholderScreen title="Attendance Logs" subtitle="Coming in Phase 11" />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
