# TrustEnd Project Structure

## Overview

TrustEnd is an Expo React Native app for workforce attendance, trust scoring, task/review workflows, and multi-tenant organization management. The current app is feature-complete enough for internal testing and Play Store preparation, with Supabase Auth, Postgres, Storage, and RLS as the backend.

## Current Status

- Auth flow: register first, then create or join an organization through onboarding.
- Roles: `employee`, `supervisor`, and `admin`.
- Employee app: dashboard, attendance, requests, reports, tasks, profile, settings, privacy policy, account deletion request.
- Supervisor/admin app: dashboard, team management, attendance logs, request review, report review, task assignment/review, profile, organization settings, privacy policy, account deletion request.
- Admin capabilities: approve members, update member roles, add another admin/supervisor by promoting active members, leave organization, and disband organization.
- Play Store preparation: privacy policy and account deletion pages live under `docs/` for GitHub Pages.

## Main Structure

```text
app/
  _layout.tsx                    Root auth/profile routing gate
  index.tsx                      Entry redirect
  modal.tsx                      Default modal route
  (auth)/
    _layout.tsx                  Auth stack
    login.tsx                    Sign in
    register.tsx                 Email/password registration
    onboarding.tsx               Create or join organization choice
    create-organization.tsx      First organization admin setup
    join-organization.tsx        Join by active organization code
    waiting-approval.tsx         Pending profile approval
    privacy-policy.tsx           Public privacy route inside app
  (employee)/
    _layout.tsx                  Employee tab layout
    home.tsx                     Dashboard, trust score, check-in/out, task preview
    attendance.tsx               Attendance history
    requests.tsx                 Holiday/overtime requests
    reports.tsx                  Report submission with photo
    tasks.tsx                    Assigned task list and submission
    profile.tsx                  Profile, avatar, lifecycle/legal actions
    settings.tsx                 Appearance settings
    privacy-policy.tsx           In-app privacy policy
    account-deletion.tsx         Account deletion request
  (supervisor)/
    _layout.tsx                  Supervisor/admin tab layout
    home.tsx                     Dashboard, trust score, own attendance, pending work
    team.tsx                     Members, approvals, role management
    attendance-logs.tsx          Organization attendance view
    request-review.tsx           Request review queue
    request-detail/[id].tsx      Request detail
    report-review.tsx            Report review queue
    report-detail/[id].tsx       Report detail
    task.tsx                     Task creation and review
    profile.tsx                  Profile, avatar, lifecycle/legal actions
    settings.tsx                 Organization attendance rules and map picker
    privacy-policy.tsx           In-app privacy policy
    account-deletion.tsx         Account deletion request

components/
  AccountDeletionRequestScreen.tsx
  AttendanceWarningModal.tsx
  Button.tsx
  Card.tsx
  DatePickerInput.tsx
  DecorativeShapes.tsx
  InfoRow.tsx
  Input.tsx
  LocationPicker.tsx
  OrganizationLifecycleActions.tsx
  PrivacyPolicyScreen.tsx
  SettingsAppearance.tsx
  TrustScoreBadge.tsx
  ui/icon-symbol.tsx

constants/
  fonts.ts
  legal.ts                       Support email and public legal URLs
  theme.ts                       Colors, spacing, typography, trust score tiers

services/
  attendanceService.ts           Validation, offline queue, trust score recalculation
  storageService.ts              Profile and report photo upload
  supabase.ts                    Singleton Supabase client and service methods

store/
  authStore.ts                   Persisted profile/session UI state
  attendanceStore.ts             Attendance state, check-in/out, local sync

supabase/
  schema.sql                     Main schema
  rls_policies.sql               Current RLS policies and RPCs
  tasks.sql                      Task table support
  profile_pictures_storage.sql   Avatar bucket policies
  add_request_hours.sql          Request hours migration
  add_ignore_checkin_time.sql    Organization time-rule migration

docs/
  index.html                     Legal landing page
  privacy/index.html             Public privacy policy page
  account-deletion/index.html    Public account deletion page
  play-store/*.md                Play Store copy/reference docs
```

## Important Runtime Flow

`app/_layout.tsx` is the auth gate. It checks the Supabase session, fetches `profiles`, mirrors the profile into `store/authStore.ts`, and routes by profile status and role:

- No Supabase session: `/(auth)/login`
- Session without profile: `/(auth)/onboarding`
- Pending profile: `/(auth)/waiting-approval`
- Active employee: `/(employee)/home`
- Active supervisor/admin: `/(supervisor)/home`

Users who leave or are removed from an organization keep their Supabase Auth account, but their `profiles` row is deleted. On next app open they return to onboarding.

## Backend Features

- Multi-tenant isolation is based on `organization_id`.
- Organization creation uses the `create_organization_with_admin` RPC.
- Join by organization code only finds active organizations.
- Organization soft delete uses `organizations.status = 'disbanded'`.
- Leave organization uses `leave_organization(p_reason text)`.
- Disband organization uses `disband_organization(p_reason text)`.
- Admin role changes use `update_org_member_role(p_member_id uuid, p_role text)`.
- Account deletion requests are stored in `account_deletion_requests`.

## Attendance and Trust Score

- Trust score max is `50` (`TRUST_SCORE_MAX` in `constants/theme.ts`).
- Tiers: `36-50` Trusted, `20-35` Moderate, `0-19` At Risk.
- Check-in and check-out validate GPS radius, WiFi SSID/BSSID, local LAN IP, spoofing signals, duplicate same-day check-ins, and missing checkout.
- Validation violations still allow submission, but the attendance log is flagged for supervisor review and a warning modal explains the reason.
- Trust score recalculates after attendance actions and syncs into `authStore`.

## Organization Settings

`app/(supervisor)/settings.tsx` configures attendance validation rules:

- Workplace GPS via map picker, search suggestions, tap-to-select, current location, and clearable search.
- Workplace address is stored on `organizations.address`.
- GPS radius, WiFi SSID/BSSID, IP range, work start/end time, and ignore check-in time are stored in `org_settings`.
- Settings service methods live on `supervisorService`, while organization name/address/code updates live on `organizationService`.

## Play Store Legal Pages

Static public pages are in `docs/` and are intended for GitHub Pages from the `main` branch using the `/docs` source:

- `https://bruuhyan.github.io/Kelompok-1-Mobile-Cross/privacy/`
- `https://bruuhyan.github.io/Kelompok-1-Mobile-Cross/account-deletion/`

Support email: `support.trustend@gmail.com`.

## Commands

```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
```

Use `npm run lint` as the TypeScript/ESLint validation command.
