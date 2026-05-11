/**
 * Reusable Input Component
 */

import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { BrandColors, BorderRadius, Spacing, Typography } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, props.multiline && styles.multilineContainer, error && styles.inputError]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, props.multiline && styles.multilineInput, style]}
          placeholderTextColor={BrandColors.textMuted}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.backgroundLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  multilineContainer: {
    minHeight: 112,
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  inputError: {
    borderColor: BrandColors.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: BrandColors.text,
    paddingVertical: 0,
  },
  multilineInput: {
    minHeight: 92,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    textAlignVertical: 'top',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.xs,
    color: BrandColors.error,
    marginTop: Spacing.xs,
  },
});
