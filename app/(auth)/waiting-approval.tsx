/**
 * Waiting Approval Screen
 * Shows when user account is pending supervisor/admin approval
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authService, profileService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { UserStatus } from '@/utils/types';

export default function WaitingApprovalScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [isChecking, setIsChecking] = useState(false);

  // Periodically check if account has been approved
  useEffect(() => {
    const checkApproval = async () => {
      setIsChecking(true);
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.replace('/(auth)/login');
          return;
        }

        const profile = await profileService.getProfile(currentUser.id);

        if (profile.status === UserStatus.ACTIVE) {
          setUser(profile);

          // Route based on role
          if (profile.role === 'supervisor' || profile.role === 'admin') {
            router.replace('/(supervisor)/home');
          } else {
            router.replace('/(employee)/home');
          }
        } else if (profile.status === UserStatus.SUSPENDED) {
          alert('Your account has been suspended. Please contact your administrator.');
          await authService.signOut();
          logout();
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Error checking approval status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately on mount
    checkApproval();

    // Check every 10 seconds
    const interval = setInterval(checkApproval, 10000);

    return () => clearInterval(interval);
  }, [logout, router, setUser]);

  const handleLogout = async () => {
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
          <IconSymbol name="clock.fill" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.subtitle}>
          Your account is waiting for approval from your organization administrator
        </Text>
      </View>

      {/* Status Card */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Status: Pending Review</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{user?.name || 'Loading...'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || 'Loading...'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>
            {user?.role === 'employee' ? 'Employee' : user?.role || 'Loading...'}
          </Text>
        </View>
      </Card>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
          <Text style={styles.infoTitle}>What happens next?</Text>
        </View>
        <Text style={styles.infoText}>
          Your organization administrator will review your account request. Once approved, you&apos;ll
          be able to access the TrustEnd app and start tracking your attendance.
        </Text>
        <Text style={styles.infoText}>
          This page will automatically refresh and redirect you once your account is approved.
        </Text>
      </Card>

      {/* Auto-refresh indicator */}
      <View style={styles.refreshIndicator}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.refreshText}>
          {isChecking ? 'Checking for approval updates...' : 'Waiting for approval updates...'}
        </Text>
      </View>

      {/* Logout Button */}
      <View style={styles.footer}>
        <Text style={styles.logoutText} onPress={handleLogout}>
          Log out and try again later
        </Text>
      </View>
    </ScrollView>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundLighter,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.warning,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: colors.text,
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: colors.backgroundLighter,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  refreshText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
  },
  logoutText: {
    fontSize: Typography.sm,
    color: colors.textMuted,
  },
});
