/**
 * InfoRow Component
 * Displays a labeled information row with an icon
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Spacing, Typography } from '@/constants/theme';

interface InfoRowProps {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  label: string;
  value: string;
  muted?: boolean;
}

export function InfoRow({ icon, label, value, muted = false }: InfoRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <IconSymbol name={icon} size={16} color={BrandColors.textMuted} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Text style={[styles.valueText, muted && styles.mutedText]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  labelText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
  },
  valueText: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  mutedText: {
    color: BrandColors.textMuted,
  },
});
