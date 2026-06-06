/**
 * Supervisor Tabs Layout
 * Bottom tab navigation for supervisor role
 */

import { useAppTheme } from "@/hooks/use-app-theme";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "../../components/haptic-tab";
import { IconSymbol } from "../../components/ui/icon-symbol";

export default function SupervisorTabsLayout() {
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
        name="team"
        options={{
          title: "Team",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="request-review"
        options={{
          title: "Request",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={24}
              name="checkmark.circle.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: "Task",
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
        name="attendance-logs"
        options={{
          href: null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="report-review"
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
      <Tabs.Screen
        name="report-detail/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="request-detail/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
