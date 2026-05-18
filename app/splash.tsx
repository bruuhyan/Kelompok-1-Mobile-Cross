/**
 * Splash Screen for TrustEnd
 * Animated logo with app branding
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BrandColors } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
    scale.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 200 })
    );
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [logoOpacity, opacity, router, scale, textOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: withTiming(0, { duration: 500 }) }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TE</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.appName}>TrustEnd</Text>
          <Text style={styles.tagline}>Secure Your Digital Trust</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 32,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: BrandColors.background,
    letterSpacing: 2,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: BrandColors.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: BrandColors.textSecondary,
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.textMuted,
  },
  dotActive: {
    backgroundColor: BrandColors.primary,
  },
});
