/**
 * Auth Stack Layout
 * Handles authentication flow: Login, Register, Create/Join Organization, Waiting Approval
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.dark.background,
        },
      }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen
        name="create-organization"
        options={{ title: 'Create Organization', presentation: 'modal' }}
      />
      <Stack.Screen
        name="join-organization"
        options={{ title: 'Join Organization', presentation: 'modal' }}
      />
      <Stack.Screen
        name="waiting-approval"
        options={{ title: 'Waiting Approval', gestureEnabled: false }}
      />
    </Stack>
  );
}
