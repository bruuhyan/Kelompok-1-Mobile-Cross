/**
 * Employee Profile Screen
 * User profile with editable information and avatar upload
 */

import { Card } from "@/components/Card";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  BrandColors,
  Spacing,
  Typography,
} from "@/constants/theme";
import { storageService } from "@/services/storageService";
import { authService, profileService } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmployeeProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await profileService.updateProfile(user.id, {
        name: name.trim(),
      });

      const updatedProfile = await profileService.getProfile(user.id);
      setUser(updatedProfile);

      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (source: "camera" | "gallery") => {
    if (!user?.id) return;

    try {
      setIsUploadingAvatar(true);
      const picked =
        source === "camera"
          ? await storageService.pickImageFromCamera()
          : await storageService.pickImageFromGallery();

      if (!picked) return;

      if (user.avatar_url) {
        await storageService.deleteAvatar(user.id);
      }

      const publicUrl = await storageService.uploadAvatar(
        user.id,
        picked.base64,
      );

      await profileService.updateProfile(user.id, { avatar_url: publicUrl });

      const updatedProfile = await profileService.getProfile(user.id);
      setUser(updatedProfile);
      updateUser({ avatar_url: publicUrl });

      Alert.alert("Success", "Profile picture updated successfully");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !user.avatar_url) return;

    try {
      setIsUploadingAvatar(true);
      await storageService.deleteAvatar(user.id);
      await profileService.updateProfile(user.id, { avatar_url: null });

      const updatedProfile = await profileService.getProfile(user.id);
      setUser(updatedProfile);
      updateUser({ avatar_url: undefined });

      Alert.alert("Success", "Profile picture removed");
    } catch (error: any) {
      console.error("Remove avatar error:", error);
      Alert.alert("Error", error.message || "Failed to remove profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const showAvatarOptions = () => {
    if (!user) return;

    const options = [
      "Take Photo",
      "Choose from Gallery",
      user.avatar_url ? "Remove Photo" : null,
      "Cancel",
    ].filter(Boolean) as string[];

    if (Platform.OS === "ios") {
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
            handleAvatarUpload("camera");
          } else if (buttonIndex === 1) {
            handleAvatarUpload("gallery");
          } else if (buttonIndex === 2 && user.avatar_url) {
            handleRemoveAvatar();
          }
        },
      );
    } else {
      Alert.alert("Change Profile Picture", "Choose an option", [
        { text: "Take Photo", onPress: () => handleAvatarUpload("camera") },
        {
          text: "Choose from Gallery",
          onPress: () => handleAvatarUpload("gallery"),
        },
        ...(user.avatar_url
          ? [
              {
                text: "Remove Photo",
                onPress: handleRemoveAvatar,
                style: "destructive" as const,
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" as const },
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = () => {
    return (
      user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  const orgIdDisplay = user?.organization_id
    ? user.organization_id.slice(0, 8) + "..."
    : "Loading...";

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={BrandColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={isLoading}
        >
          <Text style={styles.editButtonText}>
            {isLoading ? "Saving..." : isEditing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={showAvatarOptions}
            disabled={isUploadingAvatar}
          >
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            {isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <Text style={styles.avatarOverlayText}>...</Text>
              </View>
            )}
            {!isUploadingAvatar && (
              <View style={styles.cameraIcon}>
                <IconSymbol name="camera.fill" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.trustScoreBadge}>
            <TrustScoreBadge score={user?.trust_score || 50} size="small" />
          </View>
        </View>

        {!isUploadingAvatar && (
          <Text style={styles.avatarHint}>
            Tap profile picture to change photo
          </Text>
        )}

        <Text style={styles.userName}>{user?.name || "Loading..."}</Text>
        <Text style={styles.userEmail}>{user?.email || "Loading..."}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === "employee"
              ? "Employee"
              : user?.role || "Loading..."}
          </Text>
        </View>
      </Card>

      {/* Information Card */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Personal Information</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="person" size={16} color={BrandColors.textMuted} />
            <Text style={styles.infoLabelText}>Name</Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.editableField}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor={BrandColors.textMuted}
            />
          ) : (
            <Text style={styles.infoValue}>{user?.name || "Loading..."}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol
              name="envelope"
              size={16}
              color={BrandColors.textMuted}
            />
            <Text style={styles.infoLabelText}>Email</Text>
          </View>
          <Text style={[styles.infoValue, styles.disabled]}>
            {user?.email || "Loading..."}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol
              name="calendar"
              size={16}
              color={BrandColors.textMuted}
            />
            <Text style={styles.infoLabelText}>Member Since</Text>
          </View>
          <Text style={styles.infoValue}>
            {user?.created_at ? formatDate(user.created_at) : "Loading..."}
          </Text>
        </View>
      </Card>

      {/* Organization Card */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Organization</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol
              name="building.2"
              size={16}
              color={BrandColors.textMuted}
            />
            <Text style={styles.infoLabelText}>Organization ID</Text>
          </View>
          <Text style={styles.infoValue}>{orgIdDisplay}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <IconSymbol name="shield" size={16} color={BrandColors.textMuted} />
            <Text style={styles.infoLabelText}>Status</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  user?.status === "active"
                    ? BrandColors.success
                    : BrandColors.warning,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {user?.status === "active"
                ? "Active"
                : user?.status || "Loading..."}
            </Text>
          </View>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <IconSymbol
            name="rectangle.portrait.and.arrow.right"
            size={20}
            color={BrandColors.error}
          />
          <Text style={[styles.actionButtonText, { color: BrandColors.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    paddingTop: Spacing["2xl"],
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: "600",
    color: BrandColors.text,
  },
  editButton: {
    padding: Spacing.sm,
  },
  editButtonText: {
    fontSize: Typography.base,
    fontWeight: "600",
    color: BrandColors.primary,
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: BrandColors.background,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlayText: {
    color: "#FFFFFF",
    fontSize: Typography.lg,
    fontWeight: "600",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: BrandColors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: BrandColors.card,
  },
  trustScoreBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
  },
  avatarHint: {
    fontSize: Typography.sm,
    color: BrandColors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: Typography["2xl"],
    fontWeight: "700",
    color: BrandColors.text,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.base,
    color: BrandColors.textSecondary,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    backgroundColor: BrandColors.backgroundLighter,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: Typography.sm,
    fontWeight: "600",
    color: BrandColors.textSecondary,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: Typography.lg,
    fontWeight: "600",
    color: BrandColors.text,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoLabelText: {
    fontSize: Typography.base,
    color: BrandColors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.base,
    fontWeight: "500",
    color: BrandColors.text,
  },
  disabled: {
    color: BrandColors.textMuted,
  },
  editableField: {
    backgroundColor: BrandColors.backgroundLighter,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontSize: Typography.base,
    color: BrandColors.text,
    minWidth: 140,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: "600",
    color: BrandColors.background,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.card,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.border,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: Typography.base,
    fontWeight: "600",
  },
});
