/**
 * Login Screen
 * User authentication with email and password
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
import { BrandColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authService, profileService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';
import { isValidEmail } from '@/utils/helpers';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!isValidEmail(email)) {
      newErrors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }

    if (!password) {
      newErrors.password = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      // Sign in with Supabase
      const { user } = await authService.signIn(email, password);

      if (!user) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Get user profile
      const profile = await profileService.getProfile(user.id);

      if (!profile) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Check account status
      if (profile.status === 'pending') {
        router.replace('/(auth)/waiting-approval');
        return;
      }

      if (profile.status === 'suspended') {
        throw new Error(ERROR_MESSAGES.ACCOUNT_SUSPENDED);
      }

      // Set user in store
      setUser(profile);

      // Route based on role
      if (profile.role === 'supervisor' || profile.role === 'admin') {
        router.replace('/(supervisor)/home');
      } else {
        router.replace('/(employee)/home');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Show error message (in real app, use toast/snackbar)
      alert(error.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    alert('Forgot password feature coming soon');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'undefined'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TE</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to TrustEnd</Text>
        </View>

        {/* Login Form */}
        <Card style={styles.formCard}>
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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
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

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            size="large"
            style={styles.loginButton}
          />
        </Card>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Organization Options */}
        <View style={styles.orgOptions}>
          <Text style={styles.orgOptionsText}>New to TrustEnd? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/create-organization')}>
            <Text style={styles.linkText}>Create Organization</Text>
          </TouchableOpacity>
          <Text style={styles.orgOptionsText}> or </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/join-organization')}>
            <Text style={styles.linkText}>Join with Code</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: BrandColors.background,
    letterSpacing: 1,
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
    textAlign: 'center',
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.sm,
    color: BrandColors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.base,
    color: BrandColors.textSecondary,
  },
  linkText: {
    fontSize: Typography.base,
    color: BrandColors.primary,
    fontWeight: '600',
  },
  orgOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  orgOptionsText: {
    fontSize: Typography.sm,
    color: BrandColors.textSecondary,
  },
});
