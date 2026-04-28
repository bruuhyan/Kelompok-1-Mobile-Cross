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

1. **`/(auth)`** - Authentication flow (login, register, create/join organization, waiting approval)
2. **`/(employee)`** - Employee dashboard with 5 bottom tabs (Home, Attendance, Requests, Reports, Profile)
3. **`/(supervisor)`** - Supervisor dashboard with 6 bottom tabs (Home, Attendance, Requests, Reports, Team, Profile)

The root layout (`app/_layout.tsx`) handles the initial routing decision. After splash screen, users are routed to auth. After successful login, routing is determined by `user.role` in the auth store.

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
- `src/utils/constants.ts` - API config, storage keys, validation rules, error/success messages
- `src/utils/types.ts` - TypeScript interfaces for all data models
- `src/utils/helpers.ts` - Date formatting, GPS distance calculation, validation functions

### Navigation
- `app/_layout.tsx` - Root layout with theme provider and font loading
- `app/splash.tsx` - Animated splash screen, routes to auth after 2.5s
- `app/(auth)/_layout.tsx` - Auth stack navigation
- `app/(employee)/_layout.tsx` - Employee bottom tab navigation
- `app/(supervisor)/_layout.tsx` - Supervisor bottom tab navigation

### Database Schema (Supabase)

Tables to be created:
- `organizations` - Organization details (id, name, address, code)
- `profiles` - User profiles linked to organizations (extends Supabase auth.users)
- `attendance_logs` - Check-in/check-out records with GPS/WiFi/IP data
- `requests` - Holiday and overtime requests
- `reports` - Employee reports
- `org_settings` - Organization-specific settings (GPS radius, WiFi, IP range)

## Build Phases

The app is built incrementally across 16 phases. Check `PROJECT_STRUCTURE.md` for detailed phase breakdown. Current status is tracked in README.md.

## Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## State Management

Zustand is used for state management. Stores to be created:
- `authStore` - User authentication state, role, organization
- `attendanceStore` - Check-in/check-out state, today's status
- `requestStore` - Holiday/overtime requests
- `syncStore` - Offline sync queue and status

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
