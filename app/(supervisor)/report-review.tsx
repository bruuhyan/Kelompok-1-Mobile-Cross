/**
 * Supervisor Report Review Screen Placeholder
 * Will be implemented in Phase 13
 */

import { View, StyleSheet, Text } from 'react-native';
import { BrandColors } from '@/constants/theme';

export default function SupervisorReportReviewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Review</Text>
      <Text style={styles.subtitle}>Coming in Phase 13</Text>
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
