# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start

# Platform-specific starts
npm run android    # Android emulator/device
npm run ios        # iOS simulator
npm run web        # Web browser

# Linting
npm run lint

# Reset project (clears app directory)
npm run reset-project
```

## Architecture Overview

TrustEnd is a React Native app using Expo Router for file-based navigation with a role-based routing system. The app has three main navigation flows based on user authentication and role state.

### Navigation Structure

The app uses Expo Router's file-based routing with three route groups:

1. **`/(auth)`** - Authentication flow (login, register, onboarding, create/join organization, waiting approval)
2. **`/(employee)`** - Employee dashboard with 5 bottom tabs (Home, Attendance, Requests, Reports, Profile)
3. **`/(supervisor)`** - Supervisor dashboard with 6 bottom tabs (Home, Attendance, Requests, Reports, Team, Profile)

The root layout (`app/_layout.tsx`) handles the initial routing decision. After splash screen, users are routed to auth. After successful login, routing is determined by `user.role` in the auth store.

### Auth Flow (Register-First Pattern)

The app uses a register-first pattern for cleaner separation of concerns:

1. **Register** → Email/password only
2. **Onboarding** → Choose to create or join organization
3. **Create/Join** → Complete organization setup
4. **Waiting Approval** → For employees joining existing organizations

This pattern ensures users are authenticated before any organization operations, simplifying RLS policies.

### Multi-Tenant Architecture

All data is scoped by `organization_id`. The database schema enforces this through foreign keys. When implementing features:

- Always include `organization_id` in queries
- Use Row Level Security (RLS) policies in Supabase to ensure users can only access their org's data
- Organization settings (GPS radius, WiFi SSID/BSSID) are stored in `org_settings` table

### Trust Score System

Trust scores (0-100) are calculated from three factors:
- **Punctuality** - on-time check-ins vs late check-ins
- **Location Consistency** - GPS matches registered workplace location
- **Suspicious Activity** - anomalies like duplicate check-ins, VPN usage, spoofed location

Trust score tiers:
- 80-100: Trusted (green)
- 50-79: Moderate (yellow)
- 0-49: At Risk (red)

Trust score recalculation should happen server-side (Supabase Edge Function or trigger) after every attendance log insert.

### Check-in Validation Flow

Check-in requires sequential validation before allowing submission:
1. GPS Location - Must be within configured radius of registered workplace
2. WiFi Network - SSID/BSSID must match registered network
3. IP Address - Flag if different from usual IP range

If any check fails, show warning modal with reason. The validation should be a multi-step modal, not a new screen.

### Offline Sync Architecture

When offline:
- Save check-in/check-out events locally with timestamp
- Show "Offline – will sync when connected" banner
- Store in sync queue (`STORAGE_KEYS.SYNC_QUEUE`)

When back online:
- Automatically sync pending records to Supabase
- Show sync status indicator
- Use retry mechanism with exponential backoff

## Key Files

### Configuration
- `constants/theme.ts` - Brand colors, typography, spacing, shadows, trust score tiers
- `constants/fonts.ts` - Font loading with system font fallback
- `utils/constants.ts` - API config, storage keys, validation rules, error/success messages
- `utils/types.ts` - TypeScript interfaces for all data models
- `utils/helpers.ts` - Date formatting, GPS distance calculation, validation functions

### Navigation
- `app/_layout.tsx` - Root layout with theme provider and font loading
- `app/splash.tsx` - Animated splash screen, routes to auth after 2.5s
- `app/(auth)/_layout.tsx` - Auth stack navigation
- `app/(employee)/_layout.tsx` - Employee bottom tab navigation
- `app/(supervisor)/_layout.tsx` - Supervisor bottom tab navigation

### Components
- `components/Card.tsx` - Card component with variants
- `components/Input.tsx` - Input component with label, error, and icon support
- `components/Button.tsx` - Button component with variants and sizes
- `components/TrustScoreBadge.tsx` - Color-coded trust score display

### Services
- `services/supabase.ts` - Supabase client and service functions (auth, profile, organization)

### State Management
- `store/authStore.ts` - User authentication state, role, organization (Zustand)

### Database Schema (Supabase)

Tables created:
- `organizations` - Organization details (id, name, address, code)
- `profiles` - User profiles linked to organizations (extends Supabase auth.users)
- `attendance_logs` - Check-in/check-out records with GPS/WiFi/IP data
- `requests` - Holiday and overtime requests
- `reports` - Employee reports
- `org_settings` - Organization-specific settings (GPS radius, WiFi, IP range)

### RLS Policies

Row Level Security policies use helper functions to avoid recursion:
- `is_user_admin_or_supervisor()` - Check if user is admin or supervisor
- `is_user_admin()` - Check if user is admin
- `get_user_organization_id()` - Get user's organization ID

## Build Phases

The app is built incrementally across 16 phases. Current status:

### Phase 1 Complete ✅
- Theme & Design System
- Navigation Structure
- Screen Placeholders
- Utility Files

### Phase 2 Complete ✅
- Reusable Components (Card, Input, Button)
- State Management (authStore)
- Supabase Service
- Auth Screens (login, register, create-organization, join-organization, waiting-approval)

### Phase 3 Complete ✅
- Supabase Database Setup (schema.sql)
- Row Level Security Policies (rls_policies.sql)
- Environment Configuration

### Phase 4 Complete ✅
- Trust Score Badge Component
- Employee Home Screen (dashboard with status, trust score, quick actions)
- Employee Profile Screen (editable profile with organization details)

### Phase 5: Attendance Tracking (Next)
- GPS location tracking
- WiFi network detection
- IP address validation
- Check-in validation modal
- Offline sync for attendance logs

### Phase 6: Requests System
- Holiday request form
- Overtime request form
- Request history display
- Request status tracking

### Phase 7: Reports System
- Report submission form
- Photo attachment support
- Report history display
- Report status tracking

## Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## State Management

Zustand is used for state management. Stores created:
- `store/authStore.ts` - User authentication state, role, organization ✅

Stores to be created:
- `store/attendanceStore.ts` - Check-in/check-out state, today's status
- `store/requestStore.ts` - Holiday/overtime requests
- `store/syncStore.ts` - Offline sync queue and status

## UI Patterns

- Use `BrandColors.primary` (#00F5A0) for primary actions and accents
- Use `BrandColors.background` (#0D1B2A) for backgrounds
- Use `BrandColors.card` (#1B263B) for cards
- All screens use dark theme by default
- Bottom tabs use `HapticTab` component for haptic feedback
- Icons use `IconSymbol` from `@expo/vector-icons`

## Validation Rules

- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Organization code: exactly 6 alphanumeric characters
- GPS radius: 10-1000 meters (default 100)
- Trust score: 0-100
