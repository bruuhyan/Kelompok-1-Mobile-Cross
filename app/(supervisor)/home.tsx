/**
 * Supervisor Home Screen Placeholder
 * Will be implemented in Phase 10
 */

import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function SupervisorHomeScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    const { authService } = await import('@/services/supabase');
    try {
      await authService.signOut();
      logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout (Testing)</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Supervisor Home</Text>
      <Text style={styles.subtitle}>Coming in Phase 10</Text>
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
  logoutButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: BrandColors.card,
    borderRadius: 8,
  },
  logoutText: {
    color: BrandColors.error,
    fontSize: 14,
    fontWeight: '600',
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
