/**
 * Supervisor Tabs Layout
 * Bottom tab navigation for supervisor role
 */

import { Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HapticTab } from "@/components/haptic-tab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function SupervisorTabsLayout() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || 34;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: bottomInset + 8, // ← pakai bottomInset
          paddingTop: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="request-review"
        options={{
          title: 'Request',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.seal.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: 'Task',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="doc.text.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance-logs"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="report-review"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
