import React, { useMemo, useState, useEffect } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View, Alert, ActivityIndicator, PermissionsAndroid, Platform, TextInput } from "react-native";
import * as Location from "expo-location";

import {
  BorderRadius,
  Spacing,
  ThemeColors,
  Typography,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { organizationService, authService, profileService } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";

type Organization = {
  id: string;
  name: string;
  address: string;
  code: string;
  latitude?: number;
  longitude?: number;
};

export default function SupervisorSettingsScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const { themePreference, setThemePreference, effectiveTheme } =
    useThemePreference();
  const isDark = effectiveTheme === "dark";
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const user = useAuthStore((state) => state.user);

  const themeLabel = useMemo(() => {
    if (themePreference === "system") {
      return `System (${effectiveTheme})`;
    }

    return themePreference.charAt(0).toUpperCase() + themePreference.slice(1);
  }, [effectiveTheme, themePreference]);

  // Fetch organization data when component mounts or user changes
  useEffect(() => {
    const loadOrganization = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profile = await authService.getCurrentUser();
        if (!profile) {
          setIsLoading(false);
          return;
        }

        const profileData = await profileService.getProfile(profile.id);
        if (profileData && profileData.organization_id) {
          const orgData = await organizationService.getOrganizationById(profileData.organization_id);
          setOrganization(orgData);
          setAddressInput(orgData?.address || '');
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
        Alert.alert('Error', 'Failed to load organization information');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [user?.id]);

  // Request location permission and get current location
  const getCurrentLocation = async () => {
    if (isGettingLocation) return;

    try {
      setIsGettingLocation(true);

      let locationStatus;
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need your location to get your current address',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        locationStatus = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        locationStatus = status === 'granted';
      }

      if (!locationStatus) {
        Alert.alert('Permission denied', 'Location permission is required to get current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Try to reverse geocode to get address
      try {
        const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocoded && geocoded.length > 0) {
          const address = geocoded[0];
          // Format address from available components
          let formattedAddress = '';
          if (address.street) formattedAddress += address.street + ', ';
          if (address.city) formattedAddress += address.city + ', ';
          if (address.region) formattedAddress += address.region + ', ';
          if (address.postalCode) formattedAddress += address.postalCode + ' ';
          if (address.country) formattedAddress += address.country;

          // Remove trailing comma and space
          formattedAddress = formattedAddress.replace(/,\s*$/, '');

          if (formattedAddress.trim()) {
            setAddressInput(formattedAddress.trim());
            Alert.alert('Success', 'Current location retrieved successfully');
            return;
          }
        }
      } catch (geoError) {
        console.warn('Reverse geocoding failed:', geoError);
        // If reverse geocoding fails, we can still show coordinates
        setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        Alert.alert('Location retrieved', `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        return;
      }

      // Fallback to just showing coordinates if geocoding fails
      setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      Alert.alert('Location retrieved', `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Update organization address
  const updateOrganizationAddress = async () => {
    if (!organization?.id || !user?.id) return;

    try {
      setIsUpdating(true);
      await organizationService.updateOrganization(organization.id, {
        address: addressInput.trim()
      });

      // Update local state
      setOrganization(prev => prev ? { ...prev, address: addressInput.trim() } : null);

      Alert.alert('Success', 'Organization address updated successfully');
    } catch (error) {
      console.error('Failed to update organization address:', error);
      Alert.alert('Error', 'Failed to update organization address');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Display and navigation preferences.</Text>

      {/* Organization Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Organization Information</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading organization...</Text>
          </View>
        ) : !organization ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to load organization information</Text>
          </View>
        ) : (
          <View style={styles.orgInfoContainer}>
            <View style={styles.orgInfoRow}>
              <Text style={styles.orgInfoLabel}>Organization Name:</Text>
              <Text style={styles.orgInfoValue}>{organization.name || 'Not set'}</Text>
            </View>

            <View style={styles.orgInfoRow}>
              <Text style={styles.orgInfoLabel}>Organization Code:</Text>
              <Text style={styles.orgInfoValue}>{organization.code || 'Not set'}</Text>
            </View>

            <View style={styles.orgInfoRow}>
              <Text style={styles.orgInfoLabel}>Address:</Text>
              <View style={styles.addressInputContainer}>
                {isUpdating ? (
                  <ActivityIndicator size={20} color={colors.primary} />
                ) : (
                  <TouchableOpacity
                    style={styles.getLocationButton}
                    onPress={getCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    <Text style={styles.getLocationButtonText}>
                      {isGettingLocation ? 'Getting...' : 'Use Current Location'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TextInput
                  style={styles.addressInput}
                  value={addressInput}
                  onChangeText={setAddressInput}
                  placeholder="Enter organization address"
                  editable={!isUpdating}
                />
              </View>
              {isUpdating && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateOrganizationAddress}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Appearance</Text>

        <View style={styles.controlRow}>
          <View style={styles.controlCopy}>
            <Text style={styles.controlLabel}>Dark mode</Text>
            <Text style={styles.controlDescription}>{themeLabel}</Text>
          </View>
          <Switch
            value={isDark}
            trackColor={{ false: colors.textMuted, true: colors.primary }}
            thumbColor={isDark ? colors.primary : "#FFFFFF"}
            onValueChange={(value) =>
              setThemePreference(value ? "dark" : "light")
            }
          />
        </View>

        <View style={styles.segmentedControl}>
          {(["system", "light", "dark"] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.segment,
                themePreference === value && styles.segmentActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setThemePreference(value)}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  themePreference === value && styles.segmentLabelActive,
                ]}
              >
                {value === "system"
                  ? "System"
                  : value.charAt(0).toUpperCase() + value.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: Typography["3xl"],
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: Typography.base,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeading: {
    color: colors.text,
    fontSize: Typography.lg,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  controlRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  controlCopy: {
    flex: 1,
  },
  controlLabel: {
    color: colors.text,
    fontSize: Typography.base,
    fontWeight: "700",
  },
  controlDescription: {
    color: colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 4,
  },
  segmentedControl: {
    backgroundColor: colors.backgroundLight,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentLabel: {
    color: colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  segmentLabelActive: {
    color: colors.background,
  },
  // Organization info styles
  orgInfoContainer: {
    // Additional styles for org info will go here
  },
  orgInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  orgInfoLabel: {
    color: colors.textSecondary,
    fontSize: Typography.base,
  },
  orgInfoValue: {
    color: colors.text,
    fontSize: Typography.base,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.xs,
    color: colors.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: Typography.base,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  addressInput: {
    flex: 1,
    backgroundColor: colors.backgroundLighter,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    color: colors.text,
  },
  getLocationButton: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  getLocationButtonText: {
    color: colors.background,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.success,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
