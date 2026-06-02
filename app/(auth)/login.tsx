import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import DecorativeShapes from "@/components/DecorativeShapes";
import { Input } from "@/components/Input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";
import { BorderRadius, Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { authService, profileService } from "@/services/supabase";
import { useAuthStore } from "@/store/authStore";
import { ERROR_MESSAGES } from "@/utils/constants";
import { isValidEmail } from "@/utils/helpers";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MISSING_PROFILE_MESSAGE =
  "Your login exists, but no profile is linked to this account. Please register again or contact an admin.";

export default function LoginScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
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
      const { user } = await authService.signIn(email, password);

      if (!user) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const profile = await profileService.getProfile(user.id);

      if (!profile) {
        throw new Error(MISSING_PROFILE_MESSAGE);
      }

      if (profile.status === "pending") {
        setUser(profile);
        router.replace("/(auth)/waiting-approval");
        return;
      }

      if (profile.status === "suspended") {
        throw new Error(ERROR_MESSAGES.ACCOUNT_SUSPENDED);
      }

      setUser(profile);

      if (profile.role === "supervisor" || profile.role === "admin") {
        router.replace("/(supervisor)/home");
      } else {
        router.replace("/(employee)/home");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.code === "PGRST116") {
        alert(MISSING_PROFILE_MESSAGE);
      } else {
        alert(error.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <DecorativeShapes variant="auth" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("@/assets/images/android-icon-foreground.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.eyebrow}>TrustEnd Workforce</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to manage attendance, requests, and workplace trust signals.
          </Text>
        </View>

        {/* Login Form */}
        <Card style={styles.formCard} variant="elevated">
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            leftIcon={
              <IconSymbol name="envelope" size={20} color={colors.textMuted} />
            }
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            error={errors.password}
            leftIcon={
              <IconSymbol name="lock" size={20} color={colors.textMuted} />
            }
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol
                  name={showPassword ? "eye.slash" : "eye"}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          <Button
            title="Sign in"
            onPress={handleLogin}
            loading={isLoading}
            size="large"
            style={styles.loginButton}
          />
        </Card>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Do not have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
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
      paddingTop: Spacing["3xl"],
      paddingBottom: Spacing["2xl"],
      flexGrow: 1,
      justifyContent: "center",
    },
    header: {
      alignItems: "flex-start",
      marginBottom: Spacing.xl,
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
    eyebrow: {
      color: colors.primary,
      fontSize: Typography.sm,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: Spacing.sm,
    },
    title: {
      fontSize: Typography["4xl"],
      fontWeight: "800",
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.base,
      color: colors.textSecondary,
      lineHeight: Typography.lineHeightBase,
      maxWidth: 340,
    },
    formCard: {
      marginBottom: Spacing.lg,
      gap: Spacing.xs,
    },
    loginButton: {
      marginTop: Spacing.sm,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    footerText: {
      fontSize: Typography.base,
      color: colors.textSecondary,
    },
    linkText: {
      fontSize: Typography.base,
      color: colors.primary,
      fontWeight: "800",
    },
  });
