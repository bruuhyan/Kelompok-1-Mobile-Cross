/**
 * Reusable Card Component
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { BorderRadius, Shadows, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    ...Shadows.md,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.borderLight,
  },
});
