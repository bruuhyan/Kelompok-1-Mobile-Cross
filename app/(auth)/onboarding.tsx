/**
 * Onboarding Screen
 * User chooses to create or join an organization after registration
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleCreateOrganization = () => {
    router.push('/(auth)/create-organization');
  };

  const handleJoinOrganization = () => {
    router.push('/(auth)/join-organization');
  };

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
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol name="checkmark.circle.fill" size={48} color={BrandColors.primary} />
        </View>
        <Text style={styles.title}>Welcome to TrustEnd!</Text>
        <Text style={styles.subtitle}>
          Your account has been created. Now let&apos;s set up your organization.
        </Text>
      </View>

      {/* User Info Card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <IconSymbol name="envelope.fill" size={20} color={BrandColors.textMuted} />
          <Text style={styles.infoText}>{user?.email || 'Loading...'}</Text>
        </View>
      </Card>

      {/* Options */}
      <Text style={styles.sectionTitle}>Choose an option:</Text>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={handleCreateOrganization}
        activeOpacity={0.7}>
        <View style={styles.optionIconContainer}>
          <IconSymbol name="building.2.fill" size={32} color={BrandColors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Create Organization</Text>
          <Text style={styles.optionDescription}>
            Start a new organization and become the administrator
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={BrandColors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={handleJoinOrganization}
        activeOpacity={0.7}>
        <View style={styles.optionIconContainer}>
          <IconSymbol name="person.2.fill" size={32} color={BrandColors.info} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Join Organization</Text>
          <Text style={styles.optionDescription}>
            Join an existing organization with a code
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={BrandColors.textMuted} />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing['3xl'],
    backgroundColor: BrandColors.background,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.backgroundLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: '700',
    color: BrandColors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.base,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    marginBottom: Spacing['2xl'],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: Typography.base,
    color: BrandColors.text,
    marginLeft: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: BrandColors.text,
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.backgroundLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: BrandColors.text,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.sm,
    color: BrandColors.textSecondary,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  logoutText: {
    fontSize: Typography.base,
    color: BrandColors.textMuted,
  },
});
