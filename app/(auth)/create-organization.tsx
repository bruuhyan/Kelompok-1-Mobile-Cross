/**
 * Create Organization Screen
 * Create a new organization and become admin
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
import { useRouter } from 'expo-router';
import { Spacing, Typography, ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authService, profileService, organizationService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES } from '@/utils/constants';
import { generateOrgCode } from '@/utils/helpers';

export default function CreateOrganizationScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [errors, setErrors] = useState<{
    orgName?: string;
    orgAddress?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Generate organization code on mount
  React.useEffect(() => {
    setGeneratedCode(generateOrgCode());
  }, []);

  const regenerateCode = () => {
    setGeneratedCode(generateOrgCode());
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!orgName.trim()) {
      newErrors.orgName = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!orgAddress.trim()) {
      newErrors.orgAddress = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrganization = async () => {
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

      // Create organization
      const organization = await organizationService.createOrganization({
        name: orgName.trim(),
        address: orgAddress.trim(),
        code: generatedCode,
      });

      // Create user profile as admin
      await profileService.createProfile({
        id: currentUser.id,
        name: orgName.trim(), // Use org name as admin name for now
        email: currentUser.email || user?.email || '',
        organization_id: organization.id,
        role: 'admin',
        status: 'active',
      });

      // Update user in store
      const profile = await profileService.getProfile(currentUser.id);
      setUser(profile);

      // Navigate to supervisor dashboard
      router.replace('/(supervisor)/home');
    } catch (error: any) {
      console.error('Create organization error:', error);
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
          <Text style={styles.title}>Create Organization</Text>
          <Text style={styles.subtitle}>Set up your organization and become an admin</Text>
        </View>

        {/* Organization Code Display */}
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Organization Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{generatedCode}</Text>
            <TouchableOpacity onPress={regenerateCode} style={styles.regenerateButton}>
              <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            Share this code with team members to let them join your organization
          </Text>
        </Card>

        {/* Create Form */}
        <Card style={styles.formCard}>
          <Input
            label="Organization Name"
            placeholder="Enter organization name"
            value={orgName}
            onChangeText={setOrgName}
            autoCapitalize="words"
            error={errors.orgName}
            leftIcon={<IconSymbol name="building.2" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Organization Address"
            placeholder="Enter organization address"
            value={orgAddress}
            onChangeText={setOrgAddress}
            autoCapitalize="sentences"
            error={errors.orgAddress}
            leftIcon={<IconSymbol name="location" size={20} color={colors.textMuted} />}
          />

          <Button
            title="Create Organization"
            onPress={handleCreateOrganization}
            loading={isLoading}
            size="large"
            style={styles.createButton}
          />
        </Card>

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
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  regenerateButton: {
    padding: Spacing.sm,
  },
  codeHint: {
    fontSize: Typography.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  createButton: {
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
