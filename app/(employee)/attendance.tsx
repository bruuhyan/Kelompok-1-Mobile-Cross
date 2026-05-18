/**
 * Employee Attendance Screen Placeholder
 * Will be implemented in Phase 5
 */

import { BrandColors } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function EmployeeAttendanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <Text style={styles.subtitle}>Coming in Phase 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: BrandColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: BrandColors.textSecondary,
  },
});
