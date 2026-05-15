/**
 * Employee Reports Screen Placeholder
 * Will be implemented in Phase 7.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandColors, Spacing, Typography } from '@/constants/theme';

export default function EmployeeReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>Coming in Phase 7</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.background,
    padding: Spacing.lg,
  },
  title: {
    color: BrandColors.text,
    fontSize: Typography['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
  },
});
