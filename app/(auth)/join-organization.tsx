/**
 * Join Organization Screen
 * Join an existing organization with code
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
import { isValidEmail, isValidPassword } from '@/utils/helpers';

export default function JoinOrganizationScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
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
    } catch (error) {
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

      // Create user profile as employee (pending approval)
      await profileService.createProfile({
        id: authData.user.id,
        name: name.trim(),
        email: email.toLowerCase(),
        organization_id: organization.id,
        role: 'employee',
        status: 'pending',
      });

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'undefined'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
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
            leftIcon={<IconSymbol name="building.2" size={20} color={BrandColors.textMuted} />}
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
              <IconSymbol name="checkmark.circle.fill" size={24} color={BrandColors.primary} />
              <View style={styles.orgInfoText}>
                <Text style={styles.orgName}>{organization.name}</Text>
                <Text style={styles.orgAddress}>{organization.address}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Register Form */}
        {organization && (
          <Card style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
              leftIcon={<IconSymbol name="person" size={20} color={BrandColors.textMuted} />}
            />

            <Input
              label="Email"
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
  },
  codeInput: {
    marginBottom: Spacing.md,
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: BrandColors.backgroundLighter,
    borderRadius: 12,
  },
  orgInfoText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  orgName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: BrandColors.text,
    marginBottom: 2,
  },
  orgAddress: {
    fontSize: Typography.sm,
    color: BrandColors.textSecondary,
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
    color: BrandColors.textSecondary,
  },
});
