/**
 * Employee Profile Screen
 * User profile with editable information and avatar upload
 */

import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { InfoRow } from '@/components/InfoRow';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { OrganizationLifecycleActions } from '@/components/OrganizationLifecycleActions';
import { SignOutConfirmationModal } from '@/components/SignOutConfirmationModal';
import { storageService } from '@/services/storageService';
import { authService, organizationService, profileService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import DecorativeShapes from '@/components/DecorativeShapes';

type Organization = {
  name?: string;
  address?: string;
  code?: string;
};

export default function EmployeeProfileScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
        console.error('Load profile error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, user?.organization_id, setUser]);

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const handleSave = async () => {
    if (!user?.id) return;

    const nextName = name.trim();
    if (nextName === (user.name || '').trim()) {
      setName(user.name || '');
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await profileService.updateProfile(user.id, {
        name: nextName,
      });

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

  const handleAvatarUpload = async (source: 'camera' | 'gallery') => {
    if (!user?.id) return;

    try {
      setIsUploadingAvatar(true);
      const picked =
        source === 'camera'
          ? await storageService.pickImageFromCamera()
          : await storageService.pickImageFromGallery();

      if (!picked) return;

      const oldAvatarUrl = user.avatar_url;

      const publicUrl = await storageService.uploadAvatar(
        user.id,
        picked.base64,
      );

      await profileService.updateProfile(user.id, { avatar_url: publicUrl });

      const updatedProfile = await profileService.getProfile(user.id);
      setUser(updatedProfile);
      updateUser({ avatar_url: publicUrl });

      if (oldAvatarUrl) {
        storageService.deleteAvatar(user.id, oldAvatarUrl).catch((error) => {
          console.warn('Failed to delete old avatar:', error);
        });
      }

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !user.avatar_url) return;

    try {
      setIsUploadingAvatar(true);
      await storageService.deleteAvatar(user.id, user.avatar_url);
      await profileService.updateProfile(user.id, { avatar_url: null });

      const updatedProfile = await profileService.getProfile(user.id);
      setUser(updatedProfile);
      updateUser({ avatar_url: undefined });

      Alert.alert('Success', 'Profile picture removed');
    } catch (error: any) {
      console.error('Remove avatar error:', error);
      Alert.alert('Error', error.message || 'Failed to remove profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const showAvatarOptions = () => {
    if (!user) return;

    const options = [
      'Take Photo',
      'Choose from Gallery',
      user.avatar_url ? 'Remove Photo' : null,
      'Cancel',
    ].filter(Boolean) as string[];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: user.avatar_url
            ? options.length - 2
            : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleAvatarUpload('camera');
          } else if (buttonIndex === 1) {
            handleAvatarUpload('gallery');
          } else if (buttonIndex === 2 && user.avatar_url) {
            handleRemoveAvatar();
          }
        },
      );
    } else {
      Alert.alert('Change Profile Picture', 'Choose an option', [
        { text: 'Take Photo', onPress: () => handleAvatarUpload('camera') },
        {
          text: 'Choose from Gallery',
          onPress: () => handleAvatarUpload('gallery'),
        },
        ...(user.avatar_url
          ? [
              {
                text: 'Remove Photo',
                onPress: handleRemoveAvatar,
                style: 'destructive' as const,
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const handleLogout = async () => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = () => {
    return (
      user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <DecorativeShapes variant="employee" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerEyebrow}>Employee Profile</Text>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={isLoading}
        >
          <Text style={styles.editButtonText}>
            {isLoading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard} variant="elevated">
        <TouchableOpacity
          style={styles.avatarWrap}
          activeOpacity={0.8}
          disabled={isUploadingAvatar}
          onPress={showAvatarOptions}
        >
          <View style={styles.avatar}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="none"
                recyclingKey={user.avatar_url}
                transition={200}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials()}</Text>
            )}
            {isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>
          {!isUploadingAvatar && (
            <View style={styles.avatarEditButton}>
              <IconSymbol name="camera.fill" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {!isUploadingAvatar && (
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        )}

        <Text style={styles.name}>{user?.name || 'Loading...'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>

        <View style={styles.badges}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'employee' ? 'Employee' : user?.role || 'Loading...'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: user?.status === 'active' ? colors.success : colors.warning }]}>
            <Text style={styles.statusText}>
              {user?.status === 'active' ? 'Active' : user?.status || 'Loading...'}
            </Text>
          </View>
        </View>

        <View style={styles.scoreWrap}>
          <TrustScoreBadge score={user?.trust_score || 50} size="large" showLabel />
        </View>
      </Card>

      {/* Personal Information Card */}
      <Card style={styles.infoCard} variant="elevated">
        <Text style={styles.cardTitle}>Personal Information</Text>

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
            <Text style={styles.infoValue}>{user?.name || 'Not set'}</Text>
          )}
        </View>

        <InfoRow icon="envelope" label="Email" value={user?.email || 'Not set'} muted />
        <InfoRow icon="calendar" label="Member Since" value={user?.created_at ? formatDate(user.created_at) : 'Unknown'} />
      </Card>

      {/* Organization Card */}
      <Card style={styles.infoCard} variant="elevated">
        <Text style={styles.cardTitle}>Organization</Text>
        <InfoRow icon="building.2" label="Name" value={organization?.name || 'Unknown'} />
        <InfoRow icon="shield" label="Code" value={organization?.code || 'Unknown'} />
        <InfoRow icon="location.fill" label="Address" value={organization?.address || 'Not set'} />
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(employee)/settings')}>
          <IconSymbol name="gearshape.fill" size={20} color={colors.text} />
          <Text style={styles.settingsButtonText}>Settings</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(employee)/privacy-policy')}>
          <IconSymbol name="shield" size={20} color={colors.text} />
          <Text style={styles.settingsButtonText}>Privacy Policy</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(employee)/account-deletion')}>
          <IconSymbol name="person.crop.circle.badge.xmark" size={20} color={colors.error} />
          <Text style={[styles.settingsButtonText, styles.deleteButtonText]}>
            Request Account Deletion
          </Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <OrganizationLifecycleActions organization={organization} />
        <TouchableOpacity style={styles.logoutButton} onPress={() => setShowSignOutModal(true)}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
      <SignOutConfirmationModal
        visible={showSignOutModal}
        loading={isSigningOut}
        onCancel={() => setShowSignOutModal(false)}
        onConfirm={handleLogout}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: Spacing['2xl'],
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      gap: Spacing.md,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      paddingTop: Spacing['2xl'],
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    headerEyebrow: {
      color: colors.primary,
      fontSize: Typography.sm,
      fontWeight: '800',
    },
    headerTitle: {
      color: colors.text,
      fontSize: Typography['3xl'],
      fontWeight: '800',
    },
    editButton: {
      paddingHorizontal: Spacing.md,
      minHeight: 42,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
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
      borderColor: `${colors.primary}55`,
    },
    avatarWrap: {
      position: 'relative',
      marginBottom: Spacing.md,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: Typography['2xl'],
      fontWeight: '800',
    },
    avatarOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    avatarEditButton: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.card,
    },
    avatarHint: {
      fontSize: Typography.sm,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    name: {
      color: colors.text,
      fontSize: Typography['2xl'],
      fontWeight: '800',
    },
    email: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      marginTop: Spacing.xs,
    },
    badges: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    roleBadge: {
      backgroundColor: colors.cardLight,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    roleText: {
      color: colors.primary,
      fontSize: Typography.xs,
      fontWeight: '800',
    },
    statusBadge: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: Typography.xs,
      fontWeight: '800',
    },
    scoreWrap: {
      marginTop: Spacing.xl,
    },
    infoCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    cardTitle: {
      color: colors.text,
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
      color: colors.textSecondary,
      fontSize: Typography.base,
    },
    infoValue: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
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
    actions: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing['2xl'],
      gap: Spacing.md,
    },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
    },
    settingsButtonText: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '700',
    },
    deleteButtonText: {
      color: colors.error,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    logoutText: {
      color: colors.error,
      fontSize: Typography.base,
      fontWeight: '700',
    },
  });
