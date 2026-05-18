import { StyleSheet, View, Text } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function HomeScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: colors.backgroundLighter, dark: colors.background }}
      headerImage={
        <View style={styles.headerGradient}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TE</Text>
          </View>
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to TrustEnd</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Secure Your Digital Trust</ThemedText>
        <ThemedText>
          TrustEnd is your comprehensive solution for digital security and trust management.
          Build secure applications with confidence.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Features</ThemedText>
        <ThemedView style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
            <ThemedText>End-to-end encryption</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureDot, { backgroundColor: colors.secondary }]} />
            <ThemedText>Secure authentication</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureDot, { backgroundColor: colors.accent }]} />
            <ThemedText>Privacy-first design</ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  headerGradient: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 2,
  },
  featureList: {
    gap: 12,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
