import { StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function TabTwoScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: colors.backgroundLighter, dark: colors.background }}
      headerImage={
        <View style={styles.headerGradient}>
          <IconSymbol
            size={120}
            color={colors.primary}
            name="shield.fill"
            style={styles.headerIcon}
          />
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore TrustEnd</ThemedText>
      </ThemedView>
      <ThemedText>Discover the security features and capabilities of TrustEnd.</ThemedText>
      <Collapsible title="Security Features">
        <ThemedText>
          TrustEnd provides enterprise-grade security features to protect your digital assets and
          ensure trust in your applications.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Cross-Platform Support">
        <ThemedText>
          Built with React Native, TrustEnd runs seamlessly on Android, iOS, and web platforms.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Privacy First">
        <ThemedText>
          Your data stays yours. TrustEnd is designed with privacy at its core, ensuring your
          information is never compromised.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Modern Architecture">
        <ThemedText>
          Built with the latest technologies including Expo Router, React Native Reanimated, and
          TypeScript for a robust and maintainable codebase.
        </ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
StyleSheet.create({
  headerGradient: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    opacity: 0.3,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
