/**
 * Supervisor Profile Screen
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BorderRadius, BrandColors, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { authService, organizationService, profileService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

type Organization = {
  name?: string;
  address?: string;
  code?: string;
};

export default function SupervisorProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        const [profile, org] = await Promise.all([
          profileService.getProfile(user.id),
          user.organization_id ? organizationService.getOrganizationById(user.organization_id) : null,
        ]);

        if (profile) setUser(profile);
        setOrganization(org);
      } catch (error) {
        console.error('Load supervisor profile error:', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [setUser, user?.id, user?.organization_id]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Supervisor Profile</Text>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name || 'Supervisor')}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Supervisor'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>
        <View style={styles.badges}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role === 'admin' ? 'Admin' : 'Supervisor'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{user?.status || 'active'}</Text>
          </View>
        </View>
        <View style={styles.scoreWrap}>
          <TrustScoreBadge score={user?.trust_score || 50} size="large" showLabel />
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <InfoRow icon="person" label="Name" value={user?.name || 'Not set'} />
        <InfoRow icon="envelope" label="Email" value={user?.email || 'Not set'} muted />
        <InfoRow icon="calendar" label="Member Since" value={user?.created_at ? formatDate(user.created_at) : 'Unknown'} />
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>Organization</Text>
        <InfoRow icon="building.2" label="Name" value={organization?.name || 'Unknown'} />
        <InfoRow icon="shield" label="Code" value={organization?.code || 'Unknown'} />
        <InfoRow icon="location.fill" label="Address" value={organization?.address || 'Not set'} />
      </Card>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={BrandColors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <IconSymbol name={icon} size={16} color={BrandColors.textMuted} />
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, muted && styles.mutedValue]}>{value}</Text>
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.background,
    gap: Spacing.md,
  },
  loadingText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.sm,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  headerEyebrow: {
    color: BrandColors.primary,
    fontSize: Typography.sm,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    color: BrandColors.text,
    fontSize: Typography['3xl'],
    fontWeight: '800',
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: BrandColors.background,
    fontSize: Typography['2xl'],
    fontWeight: '800',
  },
  name: {
    color: BrandColors.text,
    fontSize: Typography['2xl'],
    fontWeight: '800',
  },
  email: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
    marginTop: Spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  roleBadge: {
    backgroundColor: BrandColors.backgroundLighter,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  roleText: {
    color: BrandColors.primary,
    fontSize: Typography.xs,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusText: {
    color: BrandColors.background,
    fontSize: Typography.xs,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  scoreWrap: {
    marginTop: Spacing.xl,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    color: BrandColors.text,
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabelText: {
    color: BrandColors.textSecondary,
    fontSize: Typography.base,
  },
  infoValue: {
    color: BrandColors.text,
    fontSize: Typography.base,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  mutedValue: {
    color: BrandColors.textMuted,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.card,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  logoutText: {
    color: BrandColors.error,
    fontSize: Typography.base,
    fontWeight: '700',
  },
});
