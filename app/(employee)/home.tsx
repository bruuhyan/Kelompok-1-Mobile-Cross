/**
 * Employee Home Screen Placeholder
 * Will be implemented in Phase 4
 */

import { View, StyleSheet, Text } from 'react-native';
import { BrandColors } from '@/constants/theme';

export default function EmployeeHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employee Home</Text>
      <Text style={styles.subtitle}>Coming in Phase 4</Text>
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
