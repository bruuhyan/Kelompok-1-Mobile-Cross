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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Typography, ThemeColors, BorderRadius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import DecorativeShapes from '@/components/DecorativeShapes';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authService } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { ERROR_MESSAGES } from '@/utils/constants';
import { isValidEmail, isValidPassword } from '@/utils/helpers';

export default function RegisterScreen() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: any = {};

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

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      const authData = await authService.signUp(email, password);

      if (!authData || !authData.user) {
        throw new Error('Registration failed');
      }

      setUser({
        id: authData.user.id,
        email: authData.user.email || email,
        name: '',
        role: 'employee',
        organization_id: '',
        trust_score: 50,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      router.replace('/(auth)/onboarding');
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <DecorativeShapes variant="auth" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("@/assets/images/android-icon-foreground.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Get started with TrustEnd</Text>
        </View>

        {/* Register Form */}
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
            leftIcon={<IconSymbol name="envelope" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={errors.password}
            leftIcon={<IconSymbol name="lock" size={20} color={colors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol
                  name={showPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color={colors.textMuted}
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
            leftIcon={<IconSymbol name="lock" size={20} color={colors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <IconSymbol
                  name={showConfirmPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            size="large"
            style={styles.registerButton}
          />
        </Card>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.privacyLink}
          onPress={() => router.push('/(auth)/privacy-policy')}>
          <Text style={styles.privacyLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors, bottomInset: number) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing['3xl'],
    paddingBottom: Math.max(Spacing['2xl'], bottomInset + Spacing['2xl']),
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: Typography['4xl'],
    fontWeight: '800',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: colors.textSecondary,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  registerButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.base,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: Typography.base,
    color: colors.primary,
    fontWeight: '800',
  },
  privacyLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  privacyLinkText: {
    color: colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
