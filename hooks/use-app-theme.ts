import { Colors } from "@/constants/theme";
import { useThemePreference } from "@/hooks/use-theme-preference";

export function useAppTheme() {
  const { effectiveTheme } = useThemePreference();

  return Colors[effectiveTheme];
}
