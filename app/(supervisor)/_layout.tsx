/**
 * Supervisor Tabs Layout
 * Bottom tab navigation for supervisor role
 */

import { Tabs } from 'expo-router';
import { Colors, BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HapticTab } from '@/components/haptic-tab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupervisorTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: Colors.dark.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.dark.background,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8, // Use safe area inset or default 8px
          paddingTop: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance-logs"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.bullet.rectangle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="request-review"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.seal.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="report-review"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="doc.text.magnifyingglass" color={color} />,
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
