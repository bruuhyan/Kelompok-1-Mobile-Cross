# TrustEnd - Project Structure

## Overview

TrustEnd is a React Native mobile app for smart employee attendance tracking with trust scoring, GPS/WiFi validation, and multi-tenant organization support.

## Phase 1 Complete ✅

### What Was Built

#### 1. Theme & Design System

- **`constants/theme.ts`** - Complete color palette with TrustEnd branding:
  - Dark navy background (`#0D1B2A`)
  - Electric green accent (`#00F5A0`)
  - Trust score color tiers (green/yellow/red)
  - Typography scale and font weights
  - Spacing, border radius, and shadow utilities
  - Animation durations

- **`constants/fonts.ts`** - Font configuration:
  - Syne for headings
  - DM Sans for body text
  - Font loading hook with splash screen integration

#### 2. Navigation Structure

- **`app/_layout.tsx`** - Root layout with theme provider and font loading
- **`app/splash.tsx`** - Animated splash screen with logo
- **`app/(auth)/_layout.tsx`** - Auth stack navigation
- **`app/(employee)/_layout.tsx`** - Employee bottom tab navigation (5 tabs)
- **`app/(supervisor)/_layout.tsx`** - Supervisor bottom tab navigation (6 tabs)

#### 3. Screen Placeholders

All screens created with placeholder content indicating their implementation phase:

**Auth Screens (Phase 2-3):**

- `login.tsx` - Login screen
- `register.tsx` - Registration screen
- `create-organization.tsx` - Create organization modal
- `join-organization.tsx` - Join organization modal
- `waiting-approval.tsx` - Pending approval screen

**Employee Screens (Phase 4-8):**

- `home.tsx` - Employee dashboard
- `attendance.tsx` - Check-in/check-out
- `requests.tsx` - Holiday/overtime requests
- `reports.tsx` - Report submission
- `profile.tsx` - User profile

**Supervisor Screens (Phase 10-14):**

- `home.tsx` - Supervisor dashboard
- `attendance-logs.tsx` - View attendance logs
- `request-review.tsx` - Approve/disapprove requests
- `report-review.tsx` - Review reports
- `team.tsx` - Team management
- `profile.tsx` - User profile

#### 4. Utility Files

- **`src/utils/helpers.ts`** - Helper functions:
  - Date/time formatting
  - Organization code generation
  - GPS distance calculation
  - Email/password validation
  - Text truncation, initials, phone formatting
  - Debounce/throttle utilities

- **`src/utils/constants.ts`** - App constants:
  - API configuration
  - Storage keys
  - Validation rules
  - Error/success messages
  - Animation durations

- **`src/utils/types.ts`** - TypeScript interfaces:
  - User, Organization, Attendance types
  - Request, Report types
  - Trust Score types
  - Form data types
  - API response types

- **`src/navigation/types.ts`** - Navigation type definitions

#### 5. Folder Structure

```
/app
  /(auth)          - Authentication screens
  /(employee)      - Employee dashboard tabs
  /(supervisor)    - Supervisor dashboard tabs
  splash.tsx       - Splash screen
  _layout.tsx      - Root layout

/components       - Reusable UI components
/hooks            - Custom hooks
/services         - API services
/store            - State management (Zustand)
/navigation       - Navigation types
/utils            - Helpers, constants, types
/assets           - Fonts, images
/constants         - Theme and font configuration
```

## Phase 2 Complete ✅

### What Was Built

#### 1. Reusable Components

- **`src/components/Card.tsx`** - Card component with variants (default, elevated, outlined)
- **`src/components/Input.tsx`** - Input component with label, error, and icon support
- **`src/components/Button.tsx`** - Button component with variants (primary, secondary, outline, ghost) and sizes

#### 2. State Management

- **`src/store/authStore.ts`** - Zustand store for authentication state:
  - User data management
  - Authentication status
  - Loading states
  - Logout functionality

#### 3. Supabase Service

- **`src/services/supabase.ts`** - Supabase client and service functions:
  - Authentication service (sign in, sign up, sign out, reset password)
  - Profile service (get, create, update profiles)
  - Organization service (get by code, create organization)

#### 4. Auth Screens

- **`app/(auth)/login.tsx`** - Login screen with:
  - Email and password input
  - Form validation
  - Password visibility toggle
  - Forgot password link
  - Navigation to register, create organization, join organization

- **`app/(auth)/register.tsx`** - Register screen with:
  - Name, email, password, confirm password, organization code inputs
  - Form validation
  - Password visibility toggle
  - Organization code validation
  - Navigation to login, create organization, join organization

- **`app/(auth)/create-organization.tsx`** - Create organization screen with:
  - Auto-generated 6-character organization code
  - Organization name and address inputs
  - Admin email and password inputs
  - Form validation
  - Creates organization and admin account

- **`app/(auth)/join-organization.tsx`** - Join organization screen with:
  - Organization code verification
  - Displays organization info after verification
  - Name, email, password inputs
  - Form validation
  - Creates employee account with pending status

- **`app/(auth)/waiting-approval.tsx`** - Waiting approval screen with:
  - Pending status display
  - User information display
  - Auto-refresh every 10 seconds
  - Automatic redirect when approved
  - Logout functionality

## Next Steps

### Phase 3: Waiting Approval + Supabase Setup

- Set up Supabase project and configure environment variables
- Create database tables (organizations, profiles, attendance_logs, requests, reports, org_settings)
- Implement Row Level Security (RLS) policies
- Test authentication flow with real Supabase backend

### Phase 4: Employee Dashboard

- Implement Employee Home screen with today's status and trust score
- Implement Employee Profile screen
- Add Trust Score badge component

## Dependencies

Already installed:
```bash
npm install @supabase/supabase-js zustand expo-location @react-native-community/netinfo react-native-svg
```

## Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the App

```bash
npm start
# or
expo start
```

Then press `a` for Android or `i` for iOS.
