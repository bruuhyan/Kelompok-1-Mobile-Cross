/**
 * Onboarding Screen
 * User chooses to create or join an organization after registration
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Card } from '@/components/Card';
import { SignOutConfirmationModal } from '@/components/SignOutConfirmationModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import DecorativeShapes from '@/components/DecorativeShapes';
import { useAuthStore } from '@/store/authStore';

export default function OnboardingScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleCreateOrganization = () => {
    router.push('/(auth)/create-organization');
  };

  const handleJoinOrganization = () => {
    router.push('/(auth)/join-organization');
  };

  const handleLogout = async () => {
    const { authService } = await import('@/services/supabase');
    setIsSigningOut(true);
    try {
      await authService.signOut();
      logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DecorativeShapes variant="auth" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/android-icon-foreground.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>Welcome to TrustEnd!</Text>
        <Text style={styles.subtitle}>
          Your account has been created. Now let&apos;s set up your organization.
        </Text>
      </View>

      {/* User Info Card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <IconSymbol name="envelope.fill" size={20} color={colors.textMuted} />
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
          <IconSymbol name="building.2.fill" size={32} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Create Organization</Text>
          <Text style={styles.optionDescription}>
            Start a new organization and become the administrator
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={handleJoinOrganization}
        activeOpacity={0.7}>
        <View style={styles.optionIconContainer}>
          <IconSymbol name="person.2.fill" size={32} color={colors.info} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Join Organization</Text>
          <Text style={styles.optionDescription}>
            Join an existing organization with a code
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity onPress={() => setShowSignOutModal(true)} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push('/(auth)/privacy-policy')}
        style={styles.privacyButton}>
        <Text style={styles.privacyText}>Privacy Policy</Text>
      </TouchableOpacity>
    </ScrollView>
      <SignOutConfirmationModal
        visible={showSignOutModal}
        loading={isSigningOut}
        onCancel={() => setShowSignOutModal(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing['3xl'],
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.base,
    color: colors.textSecondary,
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
    color: colors.text,
    marginLeft: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.backgroundLighter,
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
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  logoutText: {
    fontSize: Typography.base,
    color: colors.textMuted,
  },
  privacyButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  privacyText: {
    fontSize: Typography.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
