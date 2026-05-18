/**
 * Employee Profile Screen
 * User profile with editable information
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { useAuthStore } from '@/store/authStore';
import { authService, profileService } from '@/services/supabase';

export default function EmployeeProfileScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await profileService.updateProfile(user.id, {
        name: name.trim(),
        phone: phone.trim(),
      });

      // Update local state
      const updatedProfile = await profileService.getProfile(user.id);
      setUser(updatedProfile);

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={isLoading}>
          <Text style={styles.editButtonText}>{isLoading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.trustScoreBadge}>
            <TrustScoreBadge score={user?.trust_score || 50} size="small" />
          </View>
        </View>

        <Text style={styles.userName}>{user?.name || 'Loading...'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Loading...'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'employee' ? 'Employee' : user?.role || 'Loading...'}
          </Text>
        </View>
      </Card>

      {/* Information Card */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Personal Information</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="person" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabelText}>Name</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.editableField}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={styles.infoValue}>{user?.name || 'Loading...'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="envelope" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabelText}>Email</Text>
          </View>
          <Text style={[styles.infoValue, styles.disabled]}>{user?.email || 'Loading...'}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="phone" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabelText}>Phone</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.editableField}
              value={phone}
              onChangeText={setPhone}
              placeholder="Add phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="calendar" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabelText}>Member Since</Text>
          </View>
          <Text style={styles.infoValue}>
            {user?.created_at ? formatDate(user.created_at) : 'Loading...'}
          </Text>
        </View>
      </Card>

      {/* Organization Card */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Organization</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="building.2" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabelText}>Organization ID</Text>
          </View>
          <Text style={styles.infoValue}>
            {user?.organization_id ? `${user.organization_id.slice(0, 8)}...` : 'Loading...'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="shield" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabelText}>Status</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: user?.status === 'active' ? colors.success : colors.warning }]}>
            <Text style={styles.statusText}>
              {user?.status === 'active' ? 'Active' : user?.status || 'Loading...'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    padding: Spacing.sm,
  },
  editButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: colors.primary,
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.background,
  },
  trustScoreBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  userName: {
    fontSize: Typography['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.base,
    color: colors.textSecondary,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    backgroundColor: colors.backgroundLighter,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabelText: {
    fontSize: Typography.base,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: colors.text,
  },
  disabled: {
    color: colors.textMuted,
  },
  editableField: {
    backgroundColor: colors.backgroundLighter,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontSize: Typography.base,
    color: colors.text,
    minWidth: 140,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: colors.background,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
