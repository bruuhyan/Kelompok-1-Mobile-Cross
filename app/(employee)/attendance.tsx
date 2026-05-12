import { StyleSheet, Text, View } from 'react-native';
import { BrandColors, Spacing, Typography } from '@/constants/theme';

export default function EmployeeAttendanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <Text style={styles.subtitle}>Check-in history will appear here.</Text>
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
    fontSize: Typography['3xl'],
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
    textAlign: 'center',
  },
});
