/**
 * Font Configuration for TrustEnd
 * Uses system fonts as fallback for Syne and DM Sans
 */

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Try to load custom fonts, fall back to system fonts if not available
const fontAssets: Record<string, any> = {};

try {
  // Only try to require fonts if they exist
  fontAssets['Syne-Regular'] = require('../assets/fonts/Syne-Regular.ttf');
  fontAssets['Syne-Medium'] = require('../assets/fonts/Syne-Medium.ttf');
  fontAssets['Syne-SemiBold'] = require('../assets/fonts/Syne-SemiBold.ttf');
  fontAssets['Syne-Bold'] = require('../assets/fonts/Syne-Bold.ttf');
  fontAssets['Syne-ExtraBold'] = require('../assets/fonts/Syne-ExtraBold.ttf');
  fontAssets['DMSans-Regular'] = require('../assets/fonts/DMSans-Regular.ttf');
  fontAssets['DMSans-Medium'] = require('../assets/fonts/DMSans-Medium.ttf');
  fontAssets['DMSans-SemiBold'] = require('../assets/fonts/DMSans-SemiBold.ttf');
  fontAssets['DMSans-Bold'] = require('../assets/fonts/DMSans-Bold.ttf');
} catch (error) {
  // Fonts not available, will use system fonts
  console.log('Custom fonts not found, using system fonts');
}

export function useCustomFonts() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error, using system fonts:', fontError);
    }
  }, [fontError]);

  // Always return true so app doesn't wait for fonts
  return true;
}

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// System font fallbacks
const systemFonts = {
  syne: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: 'system-ui',
    default: 'System',
  }),
  dmSans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: 'system-ui',
    default: 'System',
  }),
};

export const FontFamilies = {
  syne: {
    regular: 'Syne-Regular' in fontAssets ? 'Syne-Regular' : systemFonts.syne,
    medium: 'Syne-Medium' in fontAssets ? 'Syne-Medium' : systemFonts.syne,
    semibold: 'Syne-SemiBold' in fontAssets ? 'Syne-SemiBold' : systemFonts.syne,
    bold: 'Syne-Bold' in fontAssets ? 'Syne-Bold' : systemFonts.syne,
    extrabold: 'Syne-ExtraBold' in fontAssets ? 'Syne-ExtraBold' : systemFonts.syne,
  },
  dmSans: {
    regular: 'DMSans-Regular' in fontAssets ? 'DMSans-Regular' : systemFonts.dmSans,
    medium: 'DMSans-Medium' in fontAssets ? 'DMSans-Medium' : systemFonts.dmSans,
    semibold: 'DMSans-SemiBold' in fontAssets ? 'DMSans-SemiBold' : systemFonts.dmSans,
    bold: 'DMSans-Bold' in fontAssets ? 'DMSans-Bold' : systemFonts.dmSans,
  },
} as const;
