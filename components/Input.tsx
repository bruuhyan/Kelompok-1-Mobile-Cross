/**
 * Reusable Input Component
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

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
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          props.multiline && styles.multilineContainer,
          error && styles.inputError,
        ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, props.multiline && styles.multilineInput, style]}
          placeholderTextColor={colors.textMuted}
          {...props}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  multilineContainer: {
    minHeight: 112,
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: colors.text,
    paddingVertical: 0,
    lineHeight: Typography.lineHeightBase,
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
    color: colors.error,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
});
