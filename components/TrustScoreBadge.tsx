/**
 * Trust Score Badge Component
 * Displays trust score with color-coded tier
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Spacing, Typography, BorderRadius, ThemeColors, getTrustScoreTier } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface TrustScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function TrustScoreBadge({ score, size = 'medium', showLabel = false }: TrustScoreBadgeProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const tier = getTrustScoreTier(score);
  const tierColor = colors[tier.colorKey];

  const sizeStyles = {
    small: {
      container: { width: 40, height: 40 },
      score: { fontSize: Typography.sm },
    },
    medium: {
      container: { width: 56, height: 56 },
      score: { fontSize: Typography.lg },
    },
    large: {
      container: { width: 72, height: 72 },
      score: { fontSize: Typography['2xl'] },
    },
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          sizeStyles[size].container,
          { borderColor: tierColor, backgroundColor: `${tierColor}14` },
        ]}>
        <Text
          style={[
            styles.score,
            sizeStyles[size].score,
            { color: tierColor },
          ]}>
          {score}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: tierColor }]}>
          {tier.label}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontWeight: '800',
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
});
