/**
 * Reusable Button Component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.background : colors.primary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.backgroundLighter,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  small: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  medium: {
    height: 50,
    paddingHorizontal: Spacing.lg,
  },
  large: {
    height: 56,
    paddingHorizontal: Spacing.xl,
  },
  // Disabled state
  disabled: {
    opacity: 0.5,
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  smallText: {
    fontSize: Typography.sm,
  },
  mediumText: {
    fontSize: Typography.base,
  },
  largeText: {
    fontSize: Typography.lg,
  },
});
