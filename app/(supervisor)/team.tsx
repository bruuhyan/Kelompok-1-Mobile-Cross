/**
 * Supervisor Team Screen Placeholder
 * Will be implemented in Phase 14
 */

import { BrandColors } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function SupervisorTeamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team</Text>
      <Text style={styles.subtitle}>Coming in Phase 14</Text>
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
