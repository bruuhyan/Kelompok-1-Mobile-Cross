/**
 * Join Organization Screen
 * Join an existing organization with code
 * User must be authenticated to access this screen
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Spacing, Typography, BorderRadius, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authService, profileService, organizationService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES, VALIDATION } from '@/utils/constants';

export default function JoinOrganizationScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [name, setName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [organization, setOrganization] = useState<any>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    orgCode?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const verifyOrgCode = async () => {
    if (orgCode.length !== VALIDATION.ORG_CODE_LENGTH) {
      setErrors({ orgCode: `Code must be ${VALIDATION.ORG_CODE_LENGTH} characters` });
      setOrganization(null);
      return;
    }

    setIsVerifyingCode(true);
    setErrors({});

    try {
      const org = await organizationService.getOrganizationByCode(orgCode);
      setOrganization(org);
    } catch {
      setErrors({ orgCode: ERROR_MESSAGES.INVALID_ORG_CODE });
      setOrganization(null);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!name.trim()) {
      newErrors.name = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!organization) {
      newErrors.orgCode = ERROR_MESSAGES.INVALID_ORG_CODE;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoinOrganization = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      // Check if user is authenticated
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        router.replace('/(auth)/login');
        return;
      }

      // Create user profile as employee (pending approval)
      await profileService.createProfile({
        id: currentUser.id,
        name: name.trim(),
        email: currentUser.email || user?.email || '',
        organization_id: organization.id,
        role: 'employee',
        status: 'pending',
      });

      // Update user in store
      const profile = await profileService.getProfile(currentUser.id);
      setUser(profile);

      // Navigate to waiting approval screen
      router.replace('/(auth)/waiting-approval');
    } catch (error: any) {
      console.error('Join organization error:', error);
      alert(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/android-icon-foreground.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>Join Organization</Text>
          <Text style={styles.subtitle}>Enter your organization code to get started</Text>
        </View>

        {/* Organization Code Input */}
        <Card style={styles.codeCard}>
          <Input
            label="Organization Code"
            placeholder="Enter 6-character code"
            value={orgCode}
            onChangeText={(text) => {
              setOrgCode(text.toUpperCase());
              setOrganization(null);
              setErrors({});
            }}
            autoCapitalize="characters"
            maxLength={VALIDATION.ORG_CODE_LENGTH}
            error={errors.orgCode}
            leftIcon={<IconSymbol name="building.2" size={20} color={colors.textMuted} />}
            style={styles.codeInput}
          />

          <Button
            title="Verify Code"
            onPress={verifyOrgCode}
            loading={isVerifyingCode}
            disabled={orgCode.length !== VALIDATION.ORG_CODE_LENGTH}
            variant="outline"
            size="medium"
          />

          {organization && (
            <View style={styles.orgInfo}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              <View style={styles.orgInfoText}>
                <Text style={styles.orgName}>{organization.name}</Text>
                <Text style={styles.orgAddress}>{organization.address}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Join Form */}
        {organization && (
          <Card style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
              leftIcon={<IconSymbol name="person" size={20} color={colors.textMuted} />}
            />

            <Button
              title="Join Organization"
              onPress={handleJoinOrganization}
              loading={isLoading}
              size="large"
              style={styles.joinButton}
            />
          </Card>
        )}

        {/* Cancel Link */}
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing['3xl'],
  },
  header: {
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: colors.textSecondary,
  },
  codeCard: {
    marginBottom: Spacing.lg,
  },
  codeInput: {
    marginBottom: Spacing.md,
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: colors.backgroundLighter,
    borderRadius: 12,
  },
  orgInfoText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  orgName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  orgAddress: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  joinButton: {
    marginTop: Spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  cancelText: {
    fontSize: Typography.base,
    color: colors.textSecondary,
  },
});
