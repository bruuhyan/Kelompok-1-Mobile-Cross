import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Spacing, Typography, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type LocationData = {
  address: string;
  latitude: number;
  longitude: number;
};

type Props = {
  value?: LocationData | null;
  onChange: (location: LocationData) => void;
};

export function LocationPicker({ value, onChange }: Props) {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const webViewRef = useRef<WebView>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState(value?.address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    value ? { latitude: value.latitude, longitude: value.longitude } : null
  );

  const initialLat = value?.latitude || -6.2;
  const initialLng = value?.longitude || 106.816;

  // HTML for the Leaflet map inside WebView
  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${initialLat}, ${initialLng}], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    var marker = null;

    ${pin ? `
      marker = L.marker([${pin.latitude}, ${pin.longitude}]).addTo(map);
    ` : ''}

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        latitude: lat,
        longitude: lng,
      }));
    });

    // Listen for commands from React Native
    window.movePin = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 15);
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }
    };
  </script>
</body>
</html>
`;

  // Handle messages from WebView (map tap)
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapPress') {
        const { latitude, longitude } = data;
        setPin({ latitude, longitude });

        // Reverse geocode via Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'Accept-Language': 'id,en' } }
        );
        const json = await res.json();
        if (json.display_name) {
          setSearchText(json.display_name);
        } else {
          setSearchText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      }
    } catch {
      // ignore
    }
  };

  // Move map pin programmatically
  const movePinOnMap = (lat: number, lng: number, zoom = 15) => {
    webViewRef.current?.injectJavaScript(`
      window.movePin(${lat}, ${lng}, ${zoom});
      true;
    `);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText.trim())}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'id,en' } }
      );
      const results = await res.json();
      if (!results || results.length === 0) {
        Alert.alert('Not found', 'Address not found. Try a different search.');
        return;
      }
      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);
      setPin({ latitude: lat, longitude: lng });
      setSearchText(results[0].display_name);
      movePinOnMap(lat, lng);
    } catch {
      Alert.alert('Error', 'Failed to search address. Try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setPin({ latitude, longitude });
      movePinOnMap(latitude, longitude);

      // Reverse geocode via Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'Accept-Language': 'id,en' } }
      );
      const json = await res.json();
      if (json.display_name) {
        setSearchText(json.display_name);
      } else {
        setSearchText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to get current location.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (!pin) {
      Alert.alert('No location', 'Please select a location on the map first.');
      return;
    }
    onChange({ address: searchText.trim(), latitude: pin.latitude, longitude: pin.longitude });
    setModalVisible(false);
  };

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity style={styles.trigger} onPress={() => setModalVisible(true)}>
        <IconSymbol name="location.fill" size={18} color={colors.primary} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {value?.address ? value.address : 'Select location on map'}
        </Text>
        <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search address..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {isSearching
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <TouchableOpacity onPress={handleSearch}>
                    <IconSymbol name="magnifyingglass" size={20} color={colors.primary} />
                  </TouchableOpacity>
              }
            </View>

            {/* Current location button */}
            <TouchableOpacity
              style={styles.currentLocButton}
              onPress={handleCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <IconSymbol name="location.fill" size={16} color={colors.primary} />
              }
              <Text style={styles.currentLocText}>
                {isGettingLocation ? 'Getting location...' : 'Use current location'}
              </Text>
            </TouchableOpacity>

            {/* Leaflet Map via WebView */}
            <WebView
              ref={webViewRef}
              source={{ html: leafletHTML }}
              style={{ flex: 1 }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
            />

            {/* Hint */}
            <View style={styles.hint}>
              <Text style={styles.hintText}>Tap anywhere on the map to place a pin</Text>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.backgroundLighter,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  triggerText: {
    flex: 1,
    fontSize: Typography.base,
    color: colors.text,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: colors.text,
  },
  confirmText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.md,
    backgroundColor: colors.backgroundLighter,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: colors.text,
  },
  currentLocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  currentLocText: {
    fontSize: Typography.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  hint: {
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  hintText: {
    fontSize: Typography.sm,
    color: colors.textMuted,
  },
});