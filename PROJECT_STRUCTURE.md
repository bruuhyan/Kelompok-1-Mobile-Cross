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
/src
  /screens
    /auth        - Auth screens
    /employee    - Employee screens
    /supervisor  - Supervisor screens
  /components    - Reusable components (to be added)
  /store         - State management (to be added)
  /services      - API services (to be added)
  /hooks         - Custom hooks (to be added)
  /navigation    - Navigation types
  /utils         - Helpers, constants, types
  /assets        - Fonts, images
```

## Next Steps

### Phase 2: Auth Screens

- Implement Login screen with form validation
- Implement Register screen with org code input
- Implement Create Organization screen
- Implement Join Organization screen
- Add form components (Input, Button, Card)

### Phase 3: Waiting Approval + Supabase Setup

- Implement Waiting Approval screen with live status
- Set up Supabase auth
- Create database tables
- Implement profiles table

## Dependencies to Add

Before Phase 2, install:

```bash
npm install @supabase/supabase-js zustand expo-location @react-native-community/netinfo
npm install -D @types/react-native
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
