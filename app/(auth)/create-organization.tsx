/**
 * Create Organization Screen
 * Create a new organization and become admin
 * User must be authenticated to access this screen
 */

import React, { useState } from 'react';
import {
  Alert,
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LocationPicker, LocationData } from '@/components/LocationPicker';
import DecorativeShapes from '@/components/DecorativeShapes';
import { authService, profileService, organizationService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES } from '@/utils/constants';
import { generateOrgCode, isValidBssid, isValidIpRange } from '@/utils/helpers';

export default function CreateOrganizationScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [orgName, setOrgName] = useState('');
  const [orgLocation, setOrgLocation] = useState<LocationData | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiBssid, setWifiBssid] = useState('');
  const [ipRange, setIpRange] = useState('');
  const [errors, setErrors] = useState<{
    orgName?: string;
    orgAddress?: string;
    wifiBssid?: string;
    ipRange?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingNetwork, setIsGettingNetwork] = useState(false);

  React.useEffect(() => {
    setGeneratedCode(generateOrgCode());
  }, []);

  const regenerateCode = () => {
    setGeneratedCode(generateOrgCode());
  };

const validateForm = () => {
  const newErrors: {
    orgName?: string;
    orgAddress?: string;
    wifiBssid?: string;
    ipRange?: string;
  } = {};

  if (!orgName.trim()) {
    newErrors.orgName = ERROR_MESSAGES.REQUIRED_FIELD;
  }

  if (!orgLocation) {
    newErrors.orgAddress = 'Please select a location';
  }

  // Optional BSSID validation
  if (
    wifiBssid.trim() &&
    !isValidBssid(wifiBssid.trim())
  ) {
    newErrors.wifiBssid = 'WiFi BSSID must use MAC format like 00:11:22:33:44:55';
  }

  if (ipRange.trim() && !isValidIpRange(ipRange.trim())) {
    newErrors.ipRange = 'IP range must be an exact IPv4, CIDR, or range like 192.168.1.0/24';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleUseCurrentNetwork = async () => {
    setIsGettingNetwork(true);

    try {
      const network = await NetInfo.fetch();
      const details = network.details as Record<string, string | null | undefined> | null;

      if (network.type !== 'wifi') {
        Alert.alert('Info', 'Not connected to WiFi. IP address will still be filled if available.');
      }

      if (details?.ssid) {
        setWifiSsid(details.ssid);
      }

      if (details?.bssid) {
        setWifiBssid(details.bssid.toUpperCase());
      }

      if (details?.ipAddress) {
        setIpRange(details.ipAddress + '/24');
      }

      if (!details?.ssid && !details?.bssid && !details?.ipAddress) {
        Alert.alert('Error', 'Could not detect any network information from this device.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get network info');
    } finally {
      setIsGettingNetwork(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        router.replace('/(auth)/login');
        return;
      }

      await organizationService.createOrganizationWithAdmin({
        name: orgName.trim(),
        address: orgLocation!.address,
        latitude: orgLocation!.latitude,
        longitude: orgLocation!.longitude,
        wifi_ssid: wifiSsid.trim() || null,
        wifi_bssid: wifiBssid.trim() || null,
        ip_range: ipRange.trim() || null,
        code: generatedCode,
        adminName: orgName.trim(),
        adminEmail: currentUser.email || user?.email || '',
      });

      const profile = await profileService.getProfile(currentUser.id);
      setUser(profile);

      router.replace('/(supervisor)/home');
    } catch (error: any) {
      console.error('Create organization error:', error);
      alert(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DecorativeShapes variant="auth" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Image
            source={require("@/assets/images/android-icon-foreground.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>Create Organization</Text>
          <Text style={styles.subtitle}>Set up your organization and become an admin</Text>
        </View>

        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Organization Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{generatedCode}</Text>
            <TouchableOpacity onPress={regenerateCode} style={styles.regenerateButton}>
              <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            Share this code with team members to let them join your organization
          </Text>
        </Card>

        <Card style={styles.formCard}>
          <Input
            label="Organization Name"
            placeholder="Enter organization name"
            value={orgName}
            onChangeText={setOrgName}
            autoCapitalize="words"
            error={errors.orgName}
            leftIcon={<IconSymbol name="building.2" size={20} color={colors.textMuted} />}
          />

          <View style={styles.locationField}>
            <Text style={styles.locationLabel}>Organization Address</Text>
            <LocationPicker
              value={orgLocation}
              onChange={setOrgLocation}
            />   
            {errors.orgAddress && (
              <Text style={styles.errorText}>{errors.orgAddress}</Text>
            )}
          </View>

          <Text style={styles.formSectionTitle}>Network</Text>

          <Input
            label="WiFi SSID (Optional)"
            placeholder="Office_WiFi"
            value={wifiSsid}
            onChangeText={setWifiSsid}
            leftIcon={<IconSymbol name="wifi" size={20} color={colors.textMuted} />}
          />

          <Input
            label="WiFi BSSID (Optional)"
            placeholder="00:11:22:33:44:55"
            value={wifiBssid}
            onChangeText={(text) => setWifiBssid(text.toUpperCase())}
            autoCapitalize="characters"
            error={errors.wifiBssid}
            leftIcon={<IconSymbol name="wifi" size={20} color={colors.textMuted} />}
          />

          <Input
            label="IP Range (Optional)"
            placeholder="192.168.1.0/24"
            value={ipRange}
            onChangeText={setIpRange}
            error={errors.ipRange}
            leftIcon={<IconSymbol name="wifi" size={20} color={colors.textMuted} />}
          />

          <TouchableOpacity
            style={[
              styles.useNetworkButton,
              isGettingNetwork && styles.useNetworkButtonDisabled,
            ]}
            disabled={isGettingNetwork}
            onPress={handleUseCurrentNetwork}>
            <Text style={styles.useNetworkText}>
              {isGettingNetwork ? 'Detecting Network...' : 'Use Current Network'}
            </Text>
          </TouchableOpacity>

          <Button
            title="Create Organization"
            onPress={handleCreateOrganization}
            loading={isLoading}
            size="large"
            style={styles.createButton}
          />
        </Card>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingTop: Spacing['3xl'],
    },
    header: {
      marginBottom: Spacing.lg,
    },
    logo: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: Typography['3xl'],
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.base,
      color: colors.textSecondary,
    },
    codeCard: {
      marginBottom: Spacing.lg,
      alignItems: 'center',
    },
    codeLabel: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    codeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    codeText: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 4,
    },
    regenerateButton: {
      padding: Spacing.sm,
    },
    codeHint: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
    formCard: {
      marginBottom: Spacing.lg,
    },
    locationField: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    locationLabel: {
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    formSectionTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '700',
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    useNetworkButton: {
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    useNetworkButtonDisabled: {
      opacity: 0.6,
    },
    useNetworkText: {
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.primary,
    },
    errorText: {
      color: colors.error,
      fontSize: Typography.sm,
      marginTop: Spacing.xs,
    },
    createButton: {
      marginTop: Spacing.md,
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    cancelText: {
      fontSize: Typography.base,
      color: colors.textSecondary,
    },
  });
