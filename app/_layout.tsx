/**
 * Root Layout for TrustEnd
 * Handles app-wide theming and navigation structure
 */

import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useCustomFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ThemePreferenceProvider } from "@/hooks/use-theme-preference";
import { authService, profileService } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    let isMounted = true;

    const routeUser = async () => {
      try {
        const session = await authService.getSession();
        const group = segments[0];
        const route = segments[1];
        const isAuthRoute = group === "(auth)";
        const isOnboardingRoute =
          isAuthRoute &&
          ["onboarding", "create-organization", "join-organization"].includes(
            route ?? "",
          );

        if (!session?.user) {
          logout();

          if (!isMounted || isAuthRoute) return;
          router.replace("/(auth)/login");
          return;
        }

        const profile = await profileService.getProfile(session.user.id);

        if (!isMounted) return;

        if (!profile) {
          setUser(null);

          if (!isOnboardingRoute) {
            router.replace("/(auth)/onboarding");
          }
          return;
        }

        setUser(profile);

        if (profile.status === "pending") {
          if (pathname !== "/waiting-approval") {
            router.replace("/(auth)/waiting-approval");
          }
          return;
        }

        if (profile.status === "suspended") {
          await authService.signOut();
          logout();
          router.replace("/(auth)/login");
          return;
        }

        const targetRoute =
          profile.role === "supervisor" || profile.role === "admin"
            ? "/(supervisor)/home"
            : "/(employee)/home";
        const expectedGroup =
          profile.role === "supervisor" || profile.role === "admin"
            ? "(supervisor)"
            : "(employee)";

        if (isAuthRoute || group === "splash" || group !== expectedGroup) {
          router.replace(targetRoute);
        }
      } catch (error) {
        console.error("Auth gate error:", error);
      }
    };

    routeUser();

    return () => {
      isMounted = false;
    };
  }, [logout, pathname, router, segments, setUser]);

  return null;
}

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
      <AuthGate />
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
