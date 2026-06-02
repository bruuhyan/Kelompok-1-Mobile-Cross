/**
 * TrustEnd Theme Configuration
 * Color Palette: professional cyan/green workforce SaaS system
 */

import { Platform } from 'react-native';

// TrustEnd Brand Colors
export const BrandColors = {
  // Primary Colors
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#6EE7B7',
  cyan: '#0891B2',
  cyanLight: '#22D3EE',

  // Background Colors
  background: '#07111F',
  backgroundLight: '#0F2033',
  backgroundLighter: '#18324A',

  // Text Colors
  text: '#F8FAFC',
  textSecondary: '#B6C6D8',
  textMuted: '#7F92A8',

  // Card Colors
  card: '#102235',
  cardLight: '#18324A',

  // Border Colors
  border: '#223A52',
  borderLight: '#34546E',

  // Status Colors
  success: '#00F5A0',
  warning: '#F59E0B',
  error: '#EF4444',
  danger: '#EF4444',
  info: '#0891B2',

  // Trust Score Colors
  trustHigh: '#00F5A0', // 80-100
  trustMedium: '#F59E0B', // 50-79
  trustLow: '#EF4444', // 0-49
};

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    background: '#F4FBFC',
    backgroundLight: '#FFFFFF',
    backgroundLighter: '#E6F3F6',
    tint: BrandColors.primary,
    icon: '#52677A',
    tabIconDefault: '#687076',
    tabIconSelected: BrandColors.primary,
    primary: BrandColors.primary,
    primaryDark: BrandColors.primaryDark,
    primaryLight: BrandColors.primaryLight,
    secondary: BrandColors.cyan,
    accent: BrandColors.cyanLight,
    card: '#FFFFFF',
    cardLight: '#F8FEFF',
    border: '#D6E7ED',
    borderLight: '#E6F0F4',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
    trustHigh: '#059669',
    trustMedium: '#D97706',
    trustLow: '#DC2626',
  },
  dark: {
    text: BrandColors.text,
    textSecondary: BrandColors.textSecondary,
    textMuted: BrandColors.textMuted,
    background: BrandColors.background,
    backgroundLight: BrandColors.backgroundLight,
    backgroundLighter: BrandColors.backgroundLighter,
    tint: BrandColors.primary,
    icon: BrandColors.textSecondary,
    tabIconDefault: BrandColors.textMuted,
    tabIconSelected: BrandColors.primary,
    primary: BrandColors.primary,
    primaryDark: BrandColors.primaryDark,
    primaryLight: BrandColors.primaryLight,
    secondary: BrandColors.cyan,
    accent: BrandColors.cyanLight,
    card: BrandColors.card,
    cardLight: BrandColors.cardLight,
    border: BrandColors.border,
    borderLight: BrandColors.borderLight,
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: BrandColors.error,
    info: BrandColors.info,
    trustHigh: BrandColors.trustHigh,
    trustMedium: BrandColors.trustMedium,
    trustLow: BrandColors.trustLow,
  },
};

export type ThemeColors = typeof Colors.dark;

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

  // Line Heights
  lineHeightTight: 20,
  lineHeightBase: 24,
  lineHeightRelaxed: 28,
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const BorderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 8,
  },
  glow: {
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
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
  high: { min: 36, max: 50, color: BrandColors.trustHigh, label: 'Trusted' },
  medium: { min: 20, max: 35, color: BrandColors.trustMedium, label: 'Moderate' },
  low: { min: 0, max: 19, color: BrandColors.trustLow, label: 'At Risk' },
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
