# TrustEnd

A React Native mobile app for smart employee attendance tracking with trust scoring, GPS/WiFi validation, and multi-tenant organization support.

## Features

### Core
- **Role-Based Access**: Employee and Supervisor dashboards with separate navigation flows
- **Trust Score System**: 0-50 scale with three tiers - Trusted (36-50), Moderate (20-35), At Risk (0-19)
- **Security Validation**: GPS radius, WiFi SSID/BSSID, and local LAN IP verification on check-in/check-out
- **Offline Mode**: Local storage with integrity-hash validation and automatic sync when online
- **Multi-Tenant**: Organization-based data isolation with Row Level Security (RLS) policies
- **Dark/Light Theme**: Dynamic theme switching with `useAppTheme()` hook

### Employee Features
- **Check-in / Check-out**: GPS + WiFi + local LAN IP + spoofing detection validation flow
- **Attendance History**: View past records with duration, status pills, and late flags
- **Holiday Requests**: Submit date-range leave requests with validation
- **Overtime Requests**: Submit overtime with hours and reason
- **Reports**: Submit work updates and incident reports with title and content
- **Profile Management**: Edit name, upload profile picture (camera/gallery), view organization details
- **Settings**: Toggle dark/light mode preference

### Supervisor Features
- **Dashboard**: Overview metrics (pending registrations, active employees, pending requests/reports)
- **Request Review**: Approve/reject holiday and overtime requests with detail view
- **Report Review**: Review submitted employee reports with detail view
- **Team Management**: Approve new registrations, view team attendance logs, TrustScore overview
- **Task Management**: Assign tasks to employees, review submissions
- **Attendance Logs**: View today's team check-in/check-out activity
- **Settings**: Toggle dark/light mode preference

### Auth & Security
- **Register-First Flow**: Email/password registration → onboarding → organization setup
- **Waiting Approval**: Auto-refreshing screen for pending employee approvals
- **Organization Creation**: Admin setup with secure SQL RPC (`create_organization_with_admin`)
- **Row Level Security**: All data scoped by `organization_id` with helper functions to avoid recursion

## Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Navigation**: Expo Router v6 (file-based routing with route groups)
- **State Management**: Zustand with AsyncStorage persistence
- **Backend/DB**: Supabase (auth, Postgres, Storage, RLS)
- **Location**: expo-location
- **Network**: @react-native-community/netinfo
- **Image Picker**: expo-image-picker (base64 mode)
- **UI**: Custom components with dynamic theming via `useAppTheme()`

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)
- Supabase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Fill in your Supabase credentials in `.env`

5. Set up the database:
   - Run `supabase/schema.sql` in Supabase SQL Editor
   - Run `supabase/rls_policies.sql` in Supabase SQL Editor
   - Run `supabase/tasks.sql` in Supabase SQL Editor
   - Run `supabase/add_request_hours.sql` in Supabase SQL Editor
   - Create a public storage bucket named `profile-pictures` with RLS policies

### Running the App

```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for web

## Project Structure

```
/app
  /(auth)          - Authentication screens (login, register, onboarding, etc.)
  /(employee)      - Employee dashboard tabs (home, attendance, requests, reports, profile, settings)
  /(supervisor)    - Supervisor dashboard tabs (home, attendance, requests, reports, team, task, profile, settings)
  splash.tsx       - Animated splash screen
  _layout.tsx      - Root layout with auth/profile routing gate

/components       - Reusable UI components (Card, Input, Button, TrustScoreBadge, InfoRow, SettingsAppearance)
/hooks            - Custom hooks (useAppTheme, useThemePreference, useThemeColor)
/services         - API services (supabase, attendanceService, storageService)
/store            - State management (authStore, attendanceStore)
/utils            - Helpers, constants, types
/assets           - Fonts (DM Sans, Syne)
/constants         - Theme configuration (BrandColors, Colors, Typography, Spacing, BorderRadius)
/supabase         - SQL migrations and RLS policies
```

## Build Phases

The app is built incrementally across 16 phases:

1. ✅ Project setup, folder structure, navigation skeleton, theme/fonts
2. ✅ Auth screens – Login, Register, Create Organization, Join Organization
3. ✅ Waiting Approval screen + Supabase auth & profiles DB setup
4. ✅ Employee Dashboard shell + Bottom Tab navigation
5. ✅ Check-in / Check-out flow with GPS + WiFi + IP validation
6. ✅ Offline mode – local storage, sync queue, online/offline banner
7. ✅ Holiday & Overtime request submission (Employee)
8. ✅ Report submission (Employee)
9. ✅ Trust Score calculation logic + Trust Score badge component
10. ✅ Supervisor Dashboard shell + Bottom Tab navigation
11. ✅ Supervisor – Attendance log viewer
12. ✅ Supervisor – Request approval / disapproval flow
13. ✅ Supervisor – Report review flow
14. ✅ Supervisor – Team management (approve users, view TrustScore)
15. ⏳ Multi-tenant org settings UI (GPS radius, WiFi registration)
16. ⏳ Polish – animations, loading states, error handling, empty states

## Database Schema

### Tables

- `organizations` - Organization details (id, name, address, code)
- `profiles` - User profiles linked to organizations (extends auth.users), includes `avatar_url`, `phone`, `trust_score`
- `attendance_logs` - Check-in/check-out records with GPS/WiFi/IP/spoofing data
- `requests` - Holiday and overtime requests (includes `hours` column for overtime)
- `reports` - Employee reports with title, content, and optional `photo_url`
- `org_settings` - Organization-specific settings (GPS radius, WiFi SSID/BSSID, IP range, work hours)
- `tasks` - Task assignments between supervisors and employees

### Storage Buckets

- `profile-pictures` - Public bucket for user avatars, path: `{userId}/avatar.jpg`

### RLS Policies

Row Level Security policies use helper functions to avoid recursion:
- `is_user_admin_or_supervisor()` - Check if user is admin or supervisor
- `is_user_admin()` - Check if user is admin
- `get_user_organization_id()` - Get user's organization ID
- `create_organization_with_admin()` - Authenticated RPC that atomically creates an organization and admin profile

## Trust Score System

Trust scores (0-50) are recalculated after every check-in and check-out based on:

| Offense | Penalty |
|---------|---------|
| Late check-in | 1 |
| GPS outside workplace | 4 |
| WiFi network mismatch | 3 |
| IP address anomaly | 1 |
| Location spoofing detected | 6 |
| Duplicate same-day check-in | 2 |
| Missing checkout | 2 |

Penalties use stacking multipliers based on cumulative offense count:
- First 2 offenses: 0.5x
- 3-5 offenses: 1x
- 6-8 offenses: 1.5x
- 9+ offenses: 2x

## License

MIT
