/**
 * Supervisor Profile Screen
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleChangePhoto = () => {
    Alert.alert('Change Profile Picture', 'Choose a photo source', [
      { text: 'Camera', onPress: () => pickProfileImage('camera') },
      { text: 'Gallery', onPress: () => pickProfileImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickProfileImage = async (source: 'camera' | 'library') => {
    if (!user?.id || uploadingImage) return;

    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          source === 'camera'
            ? 'Camera permission is required to take a profile picture.'
            : 'Photo library permission is required to select a profile picture.',
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (result.canceled || !result.assets[0]) return;

      await uploadProfileImage(result.assets[0]);
    } catch (error) {
      console.error('Pick supervisor profile image error:', error);
      Alert.alert('Error', 'Failed to choose profile picture');
    }
  };

  const uploadProfileImage = async (asset: ImagePicker.ImagePickerAsset) => {
  if (!user?.id) return;

  setUploadingImage(true);
  try {
    const contentType = asset.mimeType || 'image/jpeg';
    const fileExt = getFileExtension(asset.uri, contentType);
    const imageUrl = await profileService.uploadProfileImage(user.id, asset.uri, fileExt, contentType);
    const updatedProfile = await profileService.updateProfile(user.id, { image_url: imageUrl });

    setUser(updatedProfile);
    Alert.alert('Success', 'Profile picture updated successfully');
  } catch (error) {
    console.error('Upload supervisor profile image error:', error);
    Alert.alert('Error', 'Failed to upload profile picture');
  } finally {
    setUploadingImage(false);
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
        <TouchableOpacity
          style={styles.avatarWrap}
          activeOpacity={0.8}
          disabled={uploadingImage}
          onPress={handleChangePhoto}>
          <View style={styles.avatar}>
            {user?.image_url ? (
              <Image source={{ uri: user.image_url, cache: 'reload', }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(user?.name || 'Supervisor')}</Text>
            )}
            {uploadingImage && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={BrandColors.background} />
              </View>
            )}
          </View>
          <View style={styles.avatarEditButton}>
            <IconSymbol name="camera.fill" size={18} color={BrandColors.background} />
          </View>
        </TouchableOpacity>
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

function getFileExtension(uri: string, contentType: string) {
  const extensionFromUri = uri.split('.').pop()?.split('?')[0];

  if (extensionFromUri && extensionFromUri.length <= 5) {
    return extensionFromUri;
  }

  return contentType.split('/')[1] || 'jpg';
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
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
    backgroundColor: BrandColors.primary,
    borderWidth: 2,
    borderColor: BrandColors.card,
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
