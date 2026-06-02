import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { BorderRadius, Spacing, ThemeColors, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { supervisorService } from '@/services/supabase';
import { SettingsAppearance } from '@/components/SettingsAppearance';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES } from '@/utils/constants';
import { isValidBssid, isValidIpRange, isValidWorkTime } from '@/utils/helpers';

export default function SupervisorSettingsScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const user = useAuthStore((state) => state.user);

  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [gpsRadius, setGpsRadius] = useState('100');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiBssid, setWifiBssid] = useState('');
  const [ipRange, setIpRange] = useState('');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGettingNetwork, setIsGettingNetwork] = useState(false);

  const validateSettings = () => {
    const latitude = gpsLat.trim() ? Number(gpsLat) : null;
    const longitude = gpsLng.trim() ? Number(gpsLng) : null;
    const radius = gpsRadius.trim() ? Number(gpsRadius) : null;
    const normalizedBssid = wifiBssid.trim();
    const normalizedIpRange = ipRange.trim();
    const normalizedWorkStart = workStart.trim();
    const normalizedWorkEnd = workEnd.trim();

    if ((latitude == null) !== (longitude == null)) {
      return 'GPS latitude and longitude must be filled together';
    }

    if (latitude != null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
      return 'GPS latitude must be between -90 and 90';
    }

    if (longitude != null && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) {
      return 'GPS longitude must be between -180 and 180';
    }

    if (radius != null && (Number.isNaN(radius) || radius < 10 || radius > 1000)) {
      return 'GPS radius must be between 10 and 1000 meters';
    }

    if (normalizedBssid && !isValidBssid(normalizedBssid)) {
      return 'WiFi BSSID must use MAC format like 00:11:22:33:44:55';
    }

    if (normalizedIpRange && !isValidIpRange(normalizedIpRange)) {
      return 'IP range must be an exact IPv4, CIDR, or range like 192.168.1.0/24';
    }

    if (normalizedWorkStart && !isValidWorkTime(normalizedWorkStart)) {
      return 'Start time must use HH:mm format';
    }

    if (normalizedWorkEnd && !isValidWorkTime(normalizedWorkEnd)) {
      return 'End time must use HH:mm format';
    }

    return null;
  };

  const loadSettings = useCallback(async () => {
    if (!user?.organization_id) return;

    try {
      const data = await supervisorService.getOrganizationSettings(user.organization_id);
      if (data) {
        setGpsLat(data.gps_lat?.toString() || '');
        setGpsLng(data.gps_lng?.toString() || '');
        setGpsRadius(data.gps_radius_meters?.toString() || '100');
        setWifiSsid(data.wifi_ssid || '');
        setWifiBssid(data.wifi_bssid || '');
        setIpRange(data.ip_range || '');
        setWorkStart(data.work_start_time?.slice(0, 5) || '09:00');
        setWorkEnd(data.work_end_time?.slice(0, 5) || '17:00');
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  }, [user?.organization_id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission is required');
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location unavailable',
          'Turn on Location in the Android emulator, then set a mock GPS coordinate from the emulator controls.',
        );
        return;
      }

      const location =
        (await Location.getLastKnownPositionAsync({
          maxAge: 10 * 60 * 1000,
          requiredAccuracy: 1000,
        })) ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        }).catch(() => null)) ??
        (await new Promise<Location.LocationObject | null>((resolve) => {
          let subscription: Location.LocationSubscription | null = null;
          const timeout = setTimeout(() => {
            subscription?.remove();
            resolve(null);
          }, 10000);

          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Lowest,
              distanceInterval: 0,
              timeInterval: 500,
            },
            (position) => {
              clearTimeout(timeout);
              subscription?.remove();
              resolve(position);
            },
          )
            .then((watcher) => {
              subscription = watcher;
            })
            .catch(() => {
              clearTimeout(timeout);
              resolve(null);
            });
        }));

      if (!location) {
        Alert.alert(
          'Location unavailable',
          'Android could not provide a location yet. Keep this screen open, send the coordinate again from Extended Controls > Location, then tap this button once more.',
        );
        return;
      }

      setGpsLat(location.coords.latitude.toFixed(6));
      setGpsLng(location.coords.longitude.toFixed(6));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleUseCurrentNetwork = async () => {
    setIsGettingNetwork(true);

    try {
      const network = await NetInfo.fetch();
      const details = network.details as Record<string, string | null | undefined> | null;

      if (network.type !== 'wifi') {
        Alert.alert('Info', 'Not connected to WiFi. IP address will still be filled.');
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

  const handleSave = async () => {
    if (!user?.organization_id) {
      Alert.alert('Error', 'Organization ID is not available');
      return;
    }

    const validationError = validateSettings();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    const radius = gpsRadius.trim() ? Number(gpsRadius) : null;

    setIsSaving(true);
    try {
      await supervisorService.upsertOrganizationSettings(user.organization_id, {
        gps_lat: gpsLat.trim() ? Number(gpsLat) : null,
        gps_lng: gpsLng.trim() ? Number(gpsLng) : null,
        gps_radius_meters: radius,
        wifi_ssid: wifiSsid.trim() || null,
        wifi_bssid: wifiBssid.trim().toUpperCase() || null,
        ip_range: ipRange.trim() || null,
        work_start_time: workStart.trim() || null,
        work_end_time: workEnd.trim() || null,
      });

      Alert.alert('Success', 'Organization settings saved');
      await loadSettings();
    } catch (error: any) {
      console.error('Save settings error:', error);
      Alert.alert('Error', error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Display and navigation preferences.</Text>

      <SettingsAppearance />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organization Settings</Text>
        <Text style={styles.sectionSubtitle}>
          Configure attendance validation rules for your organization.
        </Text>

        <Card style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Location</Text>

          <View style={styles.locationRow}>
            <View style={styles.locationInput}>
              <Input
                label="GPS Latitude"
                placeholder="-6.200000"
                value={gpsLat}
                onChangeText={setGpsLat}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.locationInput}>
              <Input
                label="GPS Longitude"
                placeholder="106.816666"
                value={gpsLng}
                onChangeText={setGpsLng}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.useLocationBtn,
              isGettingLocation && styles.useLocationBtnDisabled,
            ]}
            disabled={isGettingLocation}
            onPress={handleUseCurrentLocation}>
            <Text style={styles.useLocationText}>
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>

          <Input
            label="GPS Radius (meters)"
            placeholder="100"
            value={gpsRadius}
            onChangeText={setGpsRadius}
            keyboardType="numeric"
          />

          <Text style={styles.formSectionTitle}>Network</Text>

          <Input
            label="WiFi SSID"
            placeholder="Office_WiFi"
            value={wifiSsid}
            onChangeText={setWifiSsid}
          />

          <Input
            label="WiFi BSSID"
            placeholder="00:11:22:33:44:55"
            value={wifiBssid}
            onChangeText={(value) => setWifiBssid(value.toUpperCase())}
          />

          <Input
            label="IP Range"
            placeholder="192.168.1.0/24"
            value={ipRange}
            onChangeText={setIpRange}
          />

          <TouchableOpacity
            style={[
              styles.useLocationBtn,
              isGettingNetwork && styles.useLocationBtnDisabled,
            ]}
            disabled={isGettingNetwork}
            onPress={handleUseCurrentNetwork}>
            <Text style={styles.useLocationText}>
              {isGettingNetwork ? 'Detecting Network...' : 'Use Current Network'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.formSectionTitle}>Work Hours</Text>

          <View style={styles.locationRow}>
            <View style={styles.locationInput}>
              <Input
                label="Start Time"
                placeholder="09:00"
                value={workStart}
                onChangeText={setWorkStart}
              />
            </View>
            <View style={styles.locationInput}>
              <Input
                label="End Time"
                placeholder="17:00"
                value={workEnd}
                onChangeText={setWorkEnd}
              />
            </View>
          </View>

          <Button
            title="Save Settings"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            size="large"
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing['3xl'],
    },
    title: {
      color: colors.text,
      fontSize: Typography['3xl'],
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.base,
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    section: {
      marginTop: Spacing.xl,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: Typography.xl,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.sm,
      marginBottom: Spacing.lg,
    },
    formCard: {
      gap: Spacing.md,
    },
    formSectionTitle: {
      color: colors.text,
      fontSize: Typography.base,
      fontWeight: '700',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    locationRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    locationInput: {
      flex: 1,
    },
    useLocationBtn: {
      backgroundColor: colors.backgroundLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
    },
    useLocationBtnDisabled: {
      opacity: 0.6,
    },
    useLocationText: {
      fontSize: Typography.sm,
      fontWeight: '600',
      color: colors.primary,
    },
  });
