/**
 * Root Layout for TrustEnd
 * Handles app-wide theming and navigation structure
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useCustomFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ThemePreferenceProvider } from "@/hooks/use-theme-preference";
import * as SplashScreen from "expo-splash-screen";

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();

  // Hide splash screen once fonts are loaded
  if (fontsLoaded) {
    SplashScreen.hideAsync();
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemePreferenceProvider>
      <RootStack />
    </ThemePreferenceProvider>
  );
}

function RootStack() {
  const colors = useAppTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="splash"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(employee)" options={{ headerShown: false }} />
        <Stack.Screen name="(supervisor)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" backgroundColor={colors.background} />
    </>
  );
}
