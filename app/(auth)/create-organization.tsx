/**
 * Create Organization Screen
 * Create a new organization and become admin
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
import { BrandColors, Spacing, Typography } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authService, profileService, organizationService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES, VALIDATION } from '@/utils/constants';
import { isValidEmail, isValidPassword, generateOrgCode } from '@/utils/helpers';

export default function CreateOrganizationScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [errors, setErrors] = useState<{
    orgName?: string;
    orgAddress?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
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

    if (!email) {
      newErrors.email = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!isValidEmail(email)) {
      newErrors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }

    if (!password) {
      newErrors.password = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!isValidPassword(password)) {
      newErrors.password = ERROR_MESSAGES.INVALID_PASSWORD;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = ERROR_MESSAGES.PASSWORDS_MISMATCH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrganization = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      // Create organization
      const organization = await organizationService.createOrganization({
        name: orgName.trim(),
        address: orgAddress.trim(),
        code: generatedCode,
      });

      // Sign up with Supabase
      const { data: authData, error: signUpError } = await authService.signUp(email, password);

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Registration failed');
      }

      // Create user profile as admin
      await profileService.createProfile({
        id: authData.user.id,
        name: orgName.trim(), // Use org name as admin name for now
        email: email.toLowerCase(),
        organization_id: organization.id,
        role: 'admin',
        status: 'active',
      });

      // Set user in store
      const profile = await profileService.getProfile(authData.user.id);
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'undefined'}>
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
              <IconSymbol name="arrow.clockwise" size={20} color={BrandColors.primary} />
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
            leftIcon={<IconSymbol name="building.2" size={20} color={BrandColors.textMuted} />}
          />

          <Input
            label="Organization Address"
            placeholder="Enter organization address"
            value={orgAddress}
            onChangeText={setOrgAddress}
            autoCapitalize="sentences"
            error={errors.orgAddress}
            leftIcon={<IconSymbol name="location" size={20} color={BrandColors.textMuted} />}
          />

          <Input
            label="Admin Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            leftIcon={<IconSymbol name="envelope" size={20} color={BrandColors.textMuted} />}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={errors.password}
            leftIcon={<IconSymbol name="lock" size={20} color={BrandColors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol
                  name={showPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color={BrandColors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoComplete="new-password"
            error={errors.confirmPassword}
            leftIcon={<IconSymbol name="lock" size={20} color={BrandColors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <IconSymbol
                  name={showConfirmPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color={BrandColors.textMuted}
                />
              </TouchableOpacity>
            }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
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
    color: BrandColors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: BrandColors.textSecondary,
  },
  codeCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: Typography.sm,
    color: BrandColors.textSecondary,
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
    color: BrandColors.primary,
    letterSpacing: 4,
  },
  regenerateButton: {
    padding: Spacing.sm,
  },
  codeHint: {
    fontSize: Typography.xs,
    color: BrandColors.textMuted,
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
    color: BrandColors.textSecondary,
  },
});
