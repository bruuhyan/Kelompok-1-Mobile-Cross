# CLAUDE.md

This file provides guidance to Claude Code when working with TrustEnd.

## Development Commands

```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
npm run reset-project
```

Use `npm run lint` for validation. There is no separate typecheck script.

## Architecture Overview

TrustEnd is an Expo React Native app with Expo Router route groups and Supabase as the backend.

Route groups:

- `app/(auth)`: login, register, onboarding, create/join organization, waiting approval, privacy policy.
- `app/(employee)`: employee home, attendance, requests, reports, tasks, profile, settings, legal screens.
- `app/(supervisor)`: supervisor/admin home, team, attendance logs, request/report review, tasks, profile, organization settings, legal screens.

The root layout, `app/_layout.tsx`, is the central auth gate. It checks the Supabase session, fetches the profile, mirrors it into `store/authStore.ts`, then routes by profile status and role.

Routing rules:

- No session: `/(auth)/login`
- Session without profile: `/(auth)/onboarding`
- Pending profile: `/(auth)/waiting-approval`
- Suspended profile: sign out, clear profile store, route to login
- Active employee: `/(employee)/home`
- Active supervisor/admin: `/(supervisor)/home`

## Supabase Rules

- `services/supabase.ts` is the only place that creates the Supabase client.
- All multi-tenant queries must be scoped by `organization_id`.
- RLS policies and security-definer RPCs live in `supabase/rls_policies.sql`.
- First organization admin creation must use `organizationService.createOrganizationWithAdmin()`.
- Normal joining users must be `role = 'employee'` and `status = 'pending'`.
- Join-by-code must only find `organizations.status = 'active'`.

Important RPCs:

- `create_organization_with_admin(...)`
- `leave_organization(p_reason text)`
- `disband_organization(p_reason text)`
- `update_org_member_role(p_member_id uuid, p_role text)`

## Current Feature Set

### Auth and Onboarding

- Email/password register and login.
- Registered users without a profile continue to onboarding.
- Users can create a new organization as first admin.
- Users can join an active organization by code and wait for approval.

### Employee

- Home dashboard with trust score, check-in/out, and task preview.
- Attendance history.
- Holiday/overtime requests.
- Report submission with optional photo upload.
- Assigned task submission.
- Profile edit, avatar upload, settings, privacy policy, account deletion request, leave organization.

### Supervisor and Admin

- Dashboard with organization stats, trust score, own attendance, pending work.
- Team management with approvals, attendance logs, trust score overview.
- Admin-only member role updates to employee/supervisor/admin.
- Request and report review with detail screens.
- Task assignment and submission review.
- Organization settings with map-based workplace picker and attendance validation rules.
- Leave organization and admin-only disband organization.

### Play Store Legal

- `docs/privacy/index.html`: public privacy policy.
- `docs/account-deletion/index.html`: public account deletion instructions.
- `constants/legal.ts`: support email and public URLs.
- Current support email: `support.trustend@gmail.com`.

## Trust Score

- Max score: `50`, defined by `TRUST_SCORE_MAX`.
- Tiers: `36-50` Trusted, `20-35` Moderate, `0-19` At Risk.
- Recalculation happens after check-in and check-out in `attendanceService.recalculateTrustScore()`.
- Attendance store updates local profile state with the new score.
- Penalties include late check-in, outside GPS radius, WiFi mismatch, IP anomaly, spoofing signal, duplicate same-day check-in, and missing checkout.

## Attendance Validation

Check-in and check-out use the same validation pipeline for employees and supervisors/admins:

- GPS radius.
- WiFi SSID/BSSID.
- Local LAN IP range from NetInfo.
- Spoofing signals.
- Duplicate same-day and missing checkout checks.

Violations still submit attendance when appropriate, but flag the log for supervisor review, affect trust score, and show `AttendanceWarningModal` with specific reasons.

## Organization Settings

`app/(supervisor)/settings.tsx` controls:

- Workplace location through `LocationPicker`.
- Search suggestions and clear search in the picker.
- Current location from `expo-location`.
- Address persistence on `organizations.address`.
- GPS radius, WiFi SSID/BSSID, IP range, work hours, and ignore check-in time in `org_settings`.

Service ownership:

- `supervisorService.getOrganizationSettings()`
- `supervisorService.upsertOrganizationSettings()`
- `organizationService.updateOrganization()` for organization address/name/code.

## Organization Lifecycle

- `OrganizationLifecycleActions` is used on profile screens.
- Leave organization deletes the current profile and routes the still-authenticated user to onboarding.
- Last active admin cannot leave.
- Disband organization is admin-only, soft-deletes the organization, deletes all org profiles, and routes affected users to onboarding.
- Soft-deleted organization codes cannot be joined.

## UI and Theming Rules

- Never use `BrandColors` in component styles.
- Use `useAppTheme()` and `createStyles(colors)`.
- Sub-components that own styles must call `useAppTheme()` too.
- Prefer existing components: `Button`, `Card`, `Input`, `InfoRow`, `TrustScoreBadge`, `SettingsAppearance`, `DecorativeShapes`.
- Icons go through `components/ui/icon-symbol.tsx` when possible.

## Storage Uploads

Profile pictures:

- Bucket: `profile-pictures`
- Path: `{userId}/avatar.jpg`
- Service: `storageService`

Report photos:

- Bucket: `report-photos`
- Path: `{userId}/{reportId}.jpg`
- Service: `storageService`

Critical implementation note: uploads use `expo-image-picker` with `base64: true` and convert to `Uint8Array`. Do not use `fetch(uri).blob()` for React Native uploads.

## Important Files

- `app/_layout.tsx`: auth and role gate.
- `services/supabase.ts`: Supabase services.
- `services/attendanceService.ts`: attendance validation and trust score.
- `services/storageService.ts`: Supabase Storage uploads.
- `store/authStore.ts`: persisted profile state.
- `store/attendanceStore.ts`: attendance state and offline sync.
- `supabase/rls_policies.sql`: RLS, RPCs, account deletion table.
- `constants/theme.ts`: theme and trust score constants.
- `constants/legal.ts`: support email and legal URLs.

## Review Checklist

Before finishing changes:

- Supabase client is imported from `services/supabase.ts`.
- Queries are scoped by `organization_id` where needed.
- RLS/RPC changes are reflected in `supabase/rls_policies.sql`.
- Theme uses `useAppTheme()` rather than direct `BrandColors`.
- Upload code does not use `fetch(uri).blob()`.
- Leave/disband flows preserve the intended Auth-session-without-profile behavior.
- `npm run lint` passes, or any inability to run it is clearly reported.
