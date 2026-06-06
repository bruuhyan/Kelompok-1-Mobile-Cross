/**
 * Employee Tabs Layout
 * Bottom tab navigation for employee role
 */

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function EmployeeTabsLayout() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 16) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 68 + bottomInset,
          paddingBottom: bottomInset + 8,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 12,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
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
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="clock.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="calendar.badge.plus" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="doc.text.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="account-deletion"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="privacy-policy"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
