# AGENTS.md

This file is the working guide for agents modifying TrustEnd.

## Commands

```bash
npm start              # Dev server, default Metro
npm run android        # Android emulator/device
npm run ios            # iOS simulator
npm run web            # Web browser
npm run lint           # ESLint and TypeScript validation through Expo
npm run reset-project  # Clear app directory, use with caution
```

There is no separate typecheck command. Use `npm run lint`.

## Architecture

- Router: Expo Router file-based routing with route groups `(auth)`, `(employee)`, and `(supervisor)`.
- Entry: `app/_layout.tsx` is the central auth/profile gate.
- State: Zustand stores in `store/authStore.ts` and `store/attendanceStore.ts`.
- Backend: Supabase Auth, Postgres, Storage, and RLS.
- Supabase client: `services/supabase.ts` owns the singleton client and React Native AsyncStorage session persistence. Do not instantiate Supabase clients elsewhere.
- Multi-tenancy: always scope organization data by `organization_id`.

## Auth and Routing Flow

`app/_layout.tsx` checks the Supabase session, fetches the linked profile, mirrors it into `authStore`, then routes by profile status and role:

- No Supabase session: `/(auth)/login`
- Session without profile: `/(auth)/onboarding`
- Pending profile: `/(auth)/waiting-approval`
- Suspended profile: sign out, clear local auth store, route to login
- Active employee: `/(employee)/home`
- Active supervisor/admin: `/(supervisor)/home`

Normal registration creates only a Supabase Auth user. Organization setup happens after registration:

- First organization admin must use `organizationService.createOrganizationWithAdmin()`, backed by the `create_organization_with_admin` SQL RPC.
- Joining an organization creates a profile with `role = 'employee'` and `status = 'pending'`.
- Join-by-code must only use active organizations.
- Users who leave or are removed from an organization keep their Auth account, lose their `profiles` row, and return to onboarding.

## Roles

Valid profile role values:

- `employee`
- `supervisor`
- `admin`

Admin is routed through the supervisor route group and has extra permissions. Admin-only flows include member role updates and disband organization.

## Theming Convention

- Never use `BrandColors` directly in component styles. It is a source of truth for `Colors.dark` and `Colors.light`, but direct usage breaks light mode.
- Always use `useAppTheme()` plus a `createStyles(colors)` pattern.
- Sub-components that render their own styles must also call `useAppTheme()`.

Pattern:

```tsx
import { Spacing, ThemeColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function MyScreen() {
  const colors = useAppTheme();
  const styles = createStyles(colors);
  return null;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { backgroundColor: colors.background },
  });
```

## Decorative Shapes

- `components/DecorativeShapes.tsx` provides background circles/ovals.
- Variants: `auth`, `employee`, `supervisor`, `splash`.
- Use it as the first child inside a screen root container when matching existing screens.
- It uses `pointerEvents="none"` and theme colors.

## Bottom Navigation

Employee tabs:

- Home: dashboard, trust score, check-in/out, task preview
- Attendance: history and status
- Requests: holiday/overtime submission and history
- Reports: report submission with photo attachment
- Profile: account info, avatar upload, settings/legal/lifecycle actions

Supervisor/admin tabs:

- Home: dashboard, trust score, own attendance, pending items
- Team: team management, attendance logs, registration approvals, role management
- Request: review employee requests
- Task: create and review employee tasks
- Profile: account info, avatar upload, organization settings/legal/lifecycle actions

Settings and legal screens are linked from Profile, not bottom tabs.

## Trust Score System

- Max score: `50`, defined by `TRUST_SCORE_MAX` in `constants/theme.ts`.
- Tiers: `36-50` Trusted, `20-35` Moderate, `0-19` At Risk.
- Recalculated after check-in and check-out via `attendanceService.recalculateTrustScore()`.
- Local UI sync happens through `useAuthStore.getState().updateUser({ trust_score: newScore })`.
- Penalties: late check-in (1), GPS outside (4), WiFi mismatch (3), IP anomaly (1), spoofing (6), duplicate same-day check-in (2), missing checkout (2), with stacking multipliers.

## Attendance

- Employee and supervisor/admin attendance use the shared `attendanceStore` and `attendanceService`.
- Check-in and check-out run GPS, WiFi, local LAN IP, and spoofing validation.
- Validation violations still submit the log, flag it for supervisor review, affect trust score, and show `AttendanceWarningModal`.
- IP range validation uses the device local LAN IP from NetInfo, not public internet IP.
- If WiFi SSID/BSSID is configured but unavailable from the device, the log is flagged as WiFi info unavailable.
- If `currentLog` is null during check-out, the user sees "No active check-in found".

Required RLS for check-out:

```sql
CREATE POLICY "Users can update own attendance"
  ON attendance_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Organization Settings

`app/(supervisor)/settings.tsx` configures attendance validation rules:

- Workplace location via `LocationPicker`.
- Location picker supports map selection, search suggestions, clear search, and current location.
- Workplace address is stored on `organizations.address`.
- GPS radius, WiFi SSID/BSSID, IP range, work start/end time, and ignore check-in time are stored in `org_settings`.
- Service methods for settings live on `supervisorService`, not `organizationService`.
- Organization name/address/code updates live on `organizationService`.
- `expo-location` is configured in `app.json`; native rebuild may be required after plugin changes.

## Organization Lifecycle

- `components/OrganizationLifecycleActions.tsx` provides Leave Organization and Disband Organization UI.
- Leave is available to all roles.
- Last active admin cannot leave; they must add another admin first or disband.
- Disband is admin-only and soft-deletes the organization.
- Successful leave/disband clears local auth/attendance profile state and routes to onboarding while keeping the Supabase Auth user signed in.
- SQL RPCs: `leave_organization(p_reason text)` and `disband_organization(p_reason text)`.

## Admin Role Management

- Admins can promote/demote active same-organization members from `app/(supervisor)/team.tsx`.
- Service: `supervisorService.updateMemberRole(userId, role)`.
- SQL RPC: `update_org_member_role(p_member_id uuid, p_role text)`.
- Admins cannot change their own role through this flow.
- At least one active admin must remain.

## Profile Picture Upload

- Bucket: `profile-pictures`, public.
- Path: `{userId}/avatar.jpg`.
- Field: `profiles.avatar_url`.
- Service: `services/storageService.ts`.
- Uses `expo-image-picker` with `base64: true`, then converts base64 to `Uint8Array`.
- Do not use `fetch(uri).blob()` for React Native uploads.
- Do not use `expo-file-system` for upload reads unless the existing service is intentionally redesigned.

## Report Photo Upload

- Bucket: `report-photos`, public.
- Path: `{userId}/{reportId}.jpg`.
- Field: `reports.photo_url`.
- Service: `storageService.pickReportPhoto()`, `uploadReportPhoto()`, `deleteReportPhoto()`.
- Uses `expo-image-picker` with `base64: true`.

## Account Deletion and Legal

- In-app privacy/account deletion routes exist under employee and supervisor route groups.
- Shared screens: `PrivacyPolicyScreen` and `AccountDeletionRequestScreen`.
- Support email and legal URLs live in `constants/legal.ts`.
- Current support email: `support.trustend@gmail.com`.
- Static public pages for Play Store are in `docs/`.
- GitHub Pages URLs:
  - `https://bruuhyan.github.io/Kelompok-1-Mobile-Cross/privacy/`
  - `https://bruuhyan.github.io/Kelompok-1-Mobile-Cross/account-deletion/`

## Dashboard Auto-Refresh

Use `useFocusEffect` from `expo-router` for screens that should refresh when revisited.

```tsx
import { useFocusEffect } from "expo-router";

useFocusEffect(
  useCallback(() => {
    loadData();
  }, [loadData]),
);
```

Applied patterns include supervisor home, request review, and employee attendance.

## Supabase Notes

- Apply `supabase/rls_policies.sql` in Supabase after changing RLS or RPCs.
- Keep RLS helper functions security-definer to avoid recursive profile lookups.
- `organizations.status` supports `active` and `disbanded`.
- `account_deletion_requests` stores user deletion requests.
- Storage buckets require their own RLS policies.

## Gotchas

- Route groups require `_layout.tsx` inside each group.
- `expo-router/entry` is the app entry point in `package.json`.
- Logout flows must call both `authService.signOut()` and `useAuthStore().logout()`.
- Organization leave/disband flows intentionally do not call Supabase Auth sign out.
- Android emulator location testing requires Location enabled and mock coordinates set from Extended Controls.
