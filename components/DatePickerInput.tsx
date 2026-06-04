import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type DatePickerInputProps = {
  label?: string;
  value: string;
  onChange: (dateString: string) => void;
  error?: string;
  placeholder?: string;
};

export function DatePickerInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
}: DatePickerInputProps) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const [show, setShow] = useState(false);

  const currentDate = (() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T00:00:00');
    }
    return new Date();
  })();

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  const handleDone = () => {
    setShow(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={[styles.inputContainer, error && styles.inputError]}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleDone}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleDone}>
                  <Text style={styles.doneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
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
    inputError: {
      borderColor: colors.error,
    },
    inputText: {
      flex: 1,
      fontSize: Typography.base,
      color: colors.text,
      lineHeight: Typography.lineHeightBase,
    },
    placeholderText: {
      color: colors.textMuted,
    },
    errorText: {
      fontSize: Typography.xs,
      color: colors.error,
      marginTop: Spacing.sm,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
      paddingBottom: Spacing['3xl'],
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    doneButton: {
      fontSize: Typography.base,
      fontWeight: '700',
      color: colors.primary,
    },
  });
