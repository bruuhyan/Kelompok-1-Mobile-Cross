/**
 * InfoRow Component
 * Displays a labeled information row with an icon
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Typography, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface InfoRowProps {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  label: string;
  value: string;
  muted?: boolean;
}

export function InfoRow({ icon, label, value, muted = false }: InfoRowProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <IconSymbol name={icon} size={16} color={colors.textMuted} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Text style={[styles.valueText, muted && styles.mutedText]}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      color: colors.textSecondary,
      fontSize: Typography.base,
    },
    valueText: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
    },
    mutedText: {
      color: colors.textMuted,
    },
  });
