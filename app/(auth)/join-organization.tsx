/**
 * Join Organization Screen Placeholder
 * Will be implemented in Phase 2
 */

import { View, StyleSheet, Text } from 'react-native';
import { BrandColors } from '@/constants/theme';

export default function JoinOrganizationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Organization</Text>
      <Text style={styles.subtitle}>Coming in Phase 2</Text>
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
