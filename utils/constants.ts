/**
 * API Configuration and Constants
 */

export const API_CONFIG = {
  // Supabase Configuration (to be filled in)
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',

  // API Endpoints
  endpoints: {
    auth: {
      login: '/auth/v1/token?grant_type=password',
      register: '/auth/v1/signup',
      logout: '/auth/v1/logout',
      refresh: '/auth/v1/token?grant_type=refresh_token',
    },
    profiles: '/rest/v1/profiles',
    organizations: '/rest/v1/organizations',
    attendance: '/rest/v1/attendance_logs',
    requests: '/rest/v1/requests',
    reports: '/rest/v1/reports',
    orgSettings: '/rest/v1/org_settings',
  },
};

export const STORAGE_KEYS = {
  // Auth
  ACCESS_TOKEN: 'trustend_access_token',
  REFRESH_TOKEN: 'trustend_refresh_token',
  USER_ID: 'trustend_user_id',

  // User Data
  USER_PROFILE: 'trustend_user_profile',
  ORGANIZATION_ID: 'trustend_organization_id',
  ORGANIZATION_CODE: 'trustend_organization_code',

  // Offline Sync
  SYNC_QUEUE: 'trustend_sync_queue',
  LAST_SYNC: 'trustend_last_sync',

  // Settings
  THEME: 'trustend_theme',
  NOTIFICATIONS_ENABLED: 'trustend_notifications_enabled',
};

export const VALIDATION = {
  // Password
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,

  // Organization Code
  ORG_CODE_LENGTH: 6,

  // GPS
  DEFAULT_GPS_RADIUS: 100, // meters
  MIN_GPS_RADIUS: 10,
  MAX_GPS_RADIUS: 1000,

  // Trust Score
  TRUST_SCORE_MIN: 0,
  TRUST_SCORE_MAX: 100,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_ORG_CODE: 'Invalid organization code',
  ACCOUNT_PENDING: 'Your account is pending approval',
  ACCOUNT_SUSPENDED: 'Your account has been suspended',

  // Network
  NETWORK_ERROR: 'Network error. Please check your connection.',
  OFFLINE_MODE: 'You are offline. Changes will sync when connected.',
  SYNC_FAILED: 'Failed to sync data. Please try again.',

  // Validation
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  PASSWORDS_MISMATCH: 'Passwords do not match',
  REQUIRED_FIELD: 'This field is required',

  // Location
  LOCATION_PERMISSION_DENIED: 'Location permission denied',
  LOCATION_NOT_AVAILABLE: 'Unable to get current location',
  OUTSIDE_GPS_RADIUS: 'You are outside the allowed GPS radius',
  WIFI_NOT_MATCHED: 'WiFi network does not match registered network',

  // General
  UNKNOWN_ERROR: 'An unexpected error occurred',
  TRY_AGAIN: 'Please try again',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  CHECK_IN_SUCCESS: 'Check-in successful',
  CHECK_OUT_SUCCESS: 'Check-out successful',
  REQUEST_SUBMITTED: 'Request submitted successfully',
  REPORT_SUBMITTED: 'Report submitted successfully',
  SYNC_COMPLETE: 'Sync complete',
  PROFILE_UPDATED: 'Profile updated successfully',
};

export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  SLIDER: 800,
  SPLASH: 2500,
};

export const DEBOUNCE_TIME = {
  SEARCH: 300,
  INPUT: 500,
  API_CALL: 1000,
};
