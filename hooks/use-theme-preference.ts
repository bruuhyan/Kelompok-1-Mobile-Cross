import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "trustend-theme-preference";

export type ThemePreference = "system" | "light" | "dark";

interface ThemePreferenceContextValue {
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  effectiveTheme: "light" | "dark";
}

const ThemePreferenceContext = createContext<
  ThemePreferenceContextValue | undefined
>(undefined);

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemTheme = useColorScheme() ?? "light";
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((storedValue) => {
      if (
        storedValue === "light" ||
        storedValue === "dark" ||
        storedValue === "system"
      ) {
        setThemePreferenceState(storedValue);
      }
    });
  }, []);

  const setThemePreference = async (value: ThemePreference) => {
    setThemePreferenceState(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  };

  const effectiveTheme =
    themePreference === "system" ? systemTheme : themePreference;
  const navigationTheme = effectiveTheme === "dark" ? DarkTheme : DefaultTheme;

  const value = useMemo(
    () => ({ themePreference, setThemePreference, effectiveTheme }),
    [themePreference, effectiveTheme],
  );

  return React.createElement(
    ThemePreferenceContext.Provider,
    { value },
    React.createElement(ThemeProvider, {
      value: navigationTheme,
      children,
    }),
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider",
    );
  }
  return context;
}
