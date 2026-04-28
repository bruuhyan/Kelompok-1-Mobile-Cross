/**
 * TrustEnd Theme Configuration
 * Color Palette: Dark navy background, electric green accent
 */

import { Platform } from 'react-native';

// TrustEnd Brand Colors
export const BrandColors = {
  // Primary Colors
  primary: '#00F5A0', // Electric Green
  primaryDark: '#00C080',
  primaryLight: '#4DFFC8',

  // Background Colors
  background: '#0D1B2A', // Dark Navy
  backgroundLight: '#1B263B',
  backgroundLighter: '#2D3E50',

  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Card Colors
  card: '#1B263B',
  cardLight: '#2D3E50',

  // Border Colors
  border: '#2D3E50',
  borderLight: '#3D4E60',

  // Status Colors
  success: '#00F5A0',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Trust Score Colors
  trustHigh: '#00F5A0', // 80-100
  trustMedium: '#F59E0B', // 50-79
  trustLow: '#EF4444', // 0-49
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F8FAFC',
    tint: BrandColors.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: BrandColors.primary,
    primary: BrandColors.primary,
    secondary: BrandColors.primaryDark,
    accent: BrandColors.primaryLight,
    card: BrandColors.card,
    border: BrandColors.border,
  },
  dark: {
    text: BrandColors.text,
    background: BrandColors.background,
    tint: BrandColors.primary,
    icon: BrandColors.textSecondary,
    tabIconDefault: BrandColors.textMuted,
    tabIconSelected: BrandColors.primary,
    primary: BrandColors.primary,
    secondary: BrandColors.primaryDark,
    accent: BrandColors.primaryLight,
    card: BrandColors.card,
    border: BrandColors.border,
  },
};

// Typography
export const Typography = {
  // Font Families (using system fonts as fallback)
  heading: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: 'system-ui',
    default: 'System',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: 'system-ui',
    default: 'System',
  }),

  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,

  // Font Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
};

// Animation
export const Animation = {
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 800,
};

// Trust Score Tiers
export const TrustScoreTiers = {
  high: { min: 80, max: 100, color: BrandColors.trustHigh, label: 'Trusted' },
  medium: { min: 50, max: 79, color: BrandColors.trustMedium, label: 'Moderate' },
  low: { min: 0, max: 49, color: BrandColors.trustLow, label: 'At Risk' },
};

// User Roles
export const UserRoles = {
  EMPLOYEE: 'employee',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
} as const;

// User Status
export const UserStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

// Request Status
export const RequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DISAPPROVED: 'disapproved',
} as const;

// Request Types
export const RequestTypes = {
  HOLIDAY: 'holiday',
  OVERTIME: 'overtime',
} as const;

// Attendance Types
export const AttendanceTypes = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
} as const;
