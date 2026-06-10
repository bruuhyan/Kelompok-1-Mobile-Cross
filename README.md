# TrustEnd

TrustEnd is an Expo React Native mobile app for workforce attendance, organization management, task review, and trust scoring. It uses Supabase Auth, Postgres, Storage, and Row Level Security for a multi-tenant backend.

## Features

### Auth and Organizations

- Register-first auth flow: sign up, then create or join an organization.
- Organization onboarding for first admin creation through a secure SQL RPC.
- Employee join flow with pending approval.
- Session users without a profile are routed back to onboarding.
- Leave organization and disband organization flows.
- Soft-deleted organizations cannot be joined by code.

### Roles

- `employee`: attendance, requests, reports, assigned tasks, profile, settings.
- `supervisor`: employee features plus team visibility, reviews, task management, organization settings.
- `admin`: supervisor features plus member role management, organization lifecycle controls, and disband organization.

### Attendance

- Check-in and check-out with GPS radius, WiFi SSID/BSSID, local LAN IP, and spoofing checks.
- Warning modal explains violations such as outside GPS range, WiFi mismatch, IP anomaly, or spoofing signal.
- Offline queue with local persistence and sync support.
- Supervisor/admin accounts use the same attendance flow as employees.

### Trust Score

- 0-50 score stored on profile and recalculated after attendance actions.
- Tiers: Trusted (36-50), Moderate (20-35), At Risk (0-19).
- Penalties include late check-in, GPS outside workplace, WiFi mismatch, IP anomaly, spoofing, duplicate same-day check-in, and missing checkout.

### Employee

- Dashboard with trust score, attendance action, quick actions, and task preview.
- Attendance history.
- Holiday and overtime request submission.
- Report submission with optional photo attachment.
- Assigned task list and submission flow.
- Profile editing, avatar upload, privacy policy, account deletion request, leave organization.

### Supervisor and Admin

- Dashboard with organization metrics, trust score, and own attendance action.
- Team management, pending approvals, attendance logs, and TrustScore overview.
- Request and report review queues with detail screens.
- Task creation and submission review.
- Organization settings with map-based workplace picker, location search suggestions, current location, WiFi/IP/work hour rules, and ignore check-in time.
- Admin-only member role updates to employee, supervisor, or admin.
- Admin-only disband organization.

### Play Store Readiness

- Public privacy policy page: `https://rafpoo.github.io/TrustEnd/privacy/`
- Public account deletion page: `https://rafpoo.github.io/TrustEnd/account-deletion/`
- In-app privacy policy and account deletion request screens.
- Support email: `support.trustend@gmail.com`.

## Tech Stack

- React Native 0.81 with Expo SDK 54
- Expo Router 6
- React 19
- Zustand
- Supabase JS
- Supabase Auth, Postgres, Storage, RLS
- expo-location
- @react-native-community/netinfo
- expo-image-picker
- react-native-maps

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI or `npx expo`
- Android Studio/emulator or a physical Android device
- Supabase project

### Install

```bash
npm install
```

Create `.env` from `.env.example` and fill Supabase values:

```bash
cp .env.example .env
```

Required environment variables:

```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Supabase Setup

Run the current SQL files in Supabase SQL Editor:

```text
supabase/schema.sql
supabase/rls_policies.sql
supabase/tasks.sql
supabase/profile_pictures_storage.sql
supabase/add_request_hours.sql
supabase/add_ignore_checkin_time.sql
```

Storage buckets used by the app:

- `profile-pictures`: public avatar bucket, path `{userId}/avatar.jpg`
- `report-photos`: public report photo bucket, path `{userId}/{reportId}.jpg`

### Run

```bash
npm start
```

Then press:

- `a` for Android
- `i` for iOS
- `w` for web

Other commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## Project Structure

```text
app/                Expo Router screens and route groups
components/         Shared UI and workflow components
constants/          Theme, fonts, legal URLs, support email
hooks/              Theme hooks
services/           Supabase, attendance, storage services
store/              Zustand stores
supabase/           SQL schema, RLS policies, migrations
utils/              Constants, helper functions, types
docs/               Static legal pages and Play Store docs
assets/             Images and fonts
```

## Key Files

- `app/_layout.tsx`: central auth/profile routing gate.
- `services/supabase.ts`: singleton Supabase client and all Supabase service methods.
- `services/attendanceService.ts`: validation and trust score logic.
- `store/authStore.ts`: persisted user profile state.
- `store/attendanceStore.ts`: attendance action state and sync queue.
- `supabase/rls_policies.sql`: active RLS policies and security-definer RPCs.
- `constants/legal.ts`: support email and public legal URLs.

## Legal Pages Deployment

The `docs/` folder is ready for GitHub Pages.

Recommended GitHub Pages settings:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/docs`

After deployment, use these URLs in Google Play Console:

- Privacy policy: `https://rafpoo.github.io/TrustEnd/privacy/`
- Account deletion: `https://rafpoo.github.io/TrustEnd/account-deletion/`

## Development Notes

- Do not instantiate Supabase clients outside `services/supabase.ts`.
- Always scope database queries by `organization_id`.
- Use `useAppTheme()` and `createStyles(colors)` for styles.
- Do not use `BrandColors` directly in component styles.
- Use `expo-image-picker` with `base64: true` for uploads; avoid `fetch(uri).blob()` in React Native.
- After editing `supabase/rls_policies.sql`, apply it in Supabase before testing auth or organization flows.

## License

MIT
