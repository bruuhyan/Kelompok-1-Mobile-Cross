/**
 * Employee Settings Screen
 * Display and navigation preferences
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { SettingsAppearance } from '@/components/SettingsAppearance';
import DecorativeShapes from '@/components/DecorativeShapes';

export default function EmployeeSettingsScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <DecorativeShapes variant="employee" />
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Display and navigation preferences.</Text>

      <SettingsAppearance />
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
      fontSize: Typography['3xl'],
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
    },
  });
