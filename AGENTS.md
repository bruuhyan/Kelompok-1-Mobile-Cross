# AGENTS.md

## Commands

```bash
npm start          # Dev server (default Metro)
npm run android    # Android emulator/device
npm run ios        # iOS simulator
npm run web        # Web browser
npm run lint       # ESLint check
npm run reset-project  # Clear app directory (use with caution)
```

## Architecture

- **Router**: Expo Router file-based routing with route groups `(auth)`, `(employee)`, `(supervisor)`
- **State**: Zustand stores in `store/*.ts` (`authStore.ts`, `attendanceStore.ts`)
- **Backend**: Supabase (RLS policies in `supabase/rls_policies.sql`)
- **Entry**: Root layout `app/_layout.tsx` is the auth gate. It checks the Supabase session, fetches the profile, mirrors it into `store/authStore.ts`, and routes by profile `status` and `role`.
- **Supabase client**: `services/supabase.ts` owns the singleton client and configures React Native session persistence with AsyncStorage. Do not instantiate Supabase clients elsewhere.

## Conventions

- Dark theme: background `#0D1B2A`, card `#1B263B`, primary `#00F5A0`
- Route group naming: parentheses syntax `(groupname)` creates isolated stacks
- Always scope queries by `organization_id` (multi-tenant)
- Profile role values: `'employee'`, `'supervisor'`, `'admin'`
- Normal user-created profiles must be `role = 'employee'` and `status = 'pending'`
- Creating the first organization admin must go through `organizationService.createOrganizationWithAdmin()`, backed by the `create_organization_with_admin` SQL RPC

## Gotchas

- No separate typecheck command - use lint for TS validation
- Route groups require `_layout.tsx` inside each group
- Test environment requires Supabase project (`.env`) - check `.env.example` for keys
- `expo-router/entry` is the main entry point in package.json
- After changing `supabase/rls_policies.sql`, apply it in Supabase before testing auth/organization flows
- Logout flows must call both `authService.signOut()` and `useAuthStore().logout()` to clear persisted profile state

## Theming Convention

- **NEVER use `BrandColors`** in component styles — it is hardcoded to dark theme values and breaks in light mode
- **ALWAYS use `useAppTheme()`** hook + `createStyles(colors)` pattern for dynamic light/dark switching
- `BrandColors` is only used as the source of truth in `constants/theme.ts` for defining `Colors.dark` and `Colors.light`
- Pattern:

  ```tsx
  import { Spacing, ThemeColors, Typography } from "@/constants/theme";
  import { useAppTheme } from "@/hooks/use-app-theme";

  export default function MyScreen() {
    const colors = useAppTheme();
    const styles = createStyles(colors);
    // ...
  }

  const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
      container: { backgroundColor: colors.background },
      // replace all BrandColors.* with colors.*
    });
  ```

- Sub-components that render styles must also call `useAppTheme()` and `createStyles(colors)` — they do not inherit styles from parent

## Profile Picture Upload

### Storage Setup

- Bucket: `profile-pictures` (public)
- File path: `{userId}/avatar.jpg`
- RLS policies: users can only upload/update/delete files in their own `{userId}/` folder
- Field name in profiles table: `avatar_url` (TEXT)

### Upload Service

- `services/storageService.ts` handles all avatar operations
- Uses `expo-image-picker` with `base64: true` option (avoids React Native's buggy `fetch().blob()`)
- Converts base64 → `Uint8Array` → Supabase Storage upload
- Image settings: 1:1 aspect ratio, quality 0.7
- Old avatars are deleted before uploading new ones

### Gotchas

- Do NOT use `fetch(uri).blob()` for uploads — it fails with "Network request failed" on React Native
- Do NOT use `expo-file-system` for reading files — the `base64: true` option from expo-image-picker is simpler and more reliable
- Both employee and supervisor profiles use the same `avatar_url` field and `storageService`

## Dashboard Auto-Refresh

- Use `useFocusEffect` from `expo-router` instead of `useEffect` for screens that need to refresh data when the user navigates back to them
- Applied to: `app/(supervisor)/home.tsx`, `app/(supervisor)/request-review.tsx`, and `app/(employee)/attendance.tsx`
- Pattern:
  ```tsx
  import { useFocusEffect } from "expo-router";
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );
  ```

## Trust Score System

- Scale: 0-50 (max defined by `TRUST_SCORE_MAX` in `constants/theme.ts`)
- Tiers: 36-50 = Trusted (green), 20-35 = Moderate (yellow), 0-19 = At Risk (red)
- Recalculated server-side after every check-in and check-out via `attendanceService.recalculateTrustScore()`
- Local UI sync: after check-in/out, `attendanceStore` fetches the updated score and calls `useAuthStore.getState().updateUser({ trust_score: newScore })`
- Penalties: late check-in (1), GPS outside (4), WiFi mismatch (3), IP anomaly (1), spoofing (6), duplicate same-day (2), missing checkout (2) — with stacking multipliers

## Attendance Check-Out

- Requires an UPDATE RLS policy on `attendance_logs` table. If check-out fails with a permission error, verify this policy exists in Supabase:
  ```sql
  CREATE POLICY "Users can update own attendance"
    ON attendance_logs FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  ```
- Check-out runs the full validation flow (GPS, WiFi, IP, spoofing) before submitting
- GPS/WiFi/IP/spoofing mismatches submit the attendance log but flag it for supervisor review and trust score penalties
- IP range validation uses the device's local LAN IP from NetInfo, not a public internet IP
- If WiFi SSID/BSSID is configured but unavailable from the device, the log is flagged as "WiFi info unavailable"
- If `currentLog` is null, check-out fails with "No active check-in found"

## Bottom Navigation

### Employee Tabs (5 tabs)

- **Home** — Dashboard with trust score, check-in/out, My Tasks preview, quick actions
- **Attendance** — History and status
- **Requests** — Holiday/overtime submission and history
- **Reports** — Report submission with photo attachment
- **Profile** — Account info, avatar upload, Settings link, logout
- Settings and Tasks are accessible from within Profile and Home respectively (not separate tabs)

### Supervisor Tabs (5 tabs)

- **Home** — Dashboard with org stats, My Attendance card (check-in/out with validation), and pending items
- **Team** — Team management, attendance logs, registration approvals
- **Request** — Review and approve employee requests
- **Task** — Create and review employee tasks
- **Profile** — Account info, avatar upload, Settings link, logout
- Organization Settings accessible from within Profile

## Employee Tasks Screen

- `app/(employee)/tasks.tsx` — View assigned tasks grouped by status (To Do, In Review, Needs Revision, Completed)
- Expandable cards with submission form for assigned/rejected tasks
- `useFocusEffect` for auto-refresh
- Service: `taskService.getMyTasks(userId)` and `taskService.submitTask(taskId, submissionNote)` in `services/supabase.ts`

## Organization Settings

- `app/(supervisor)/settings.tsx` — Configure attendance validation rules:
  - GPS coordinates (with "Use Current Location" via `expo-location`)
  - GPS radius (10-1000m)
  - WiFi SSID/BSSID
  - IP range
  - Work start/end time
- Service: `supervisorService.getOrganizationSettings()` and `supervisorService.upsertOrganizationSettings()` in `services/supabase.ts`
  - **NOTE**: These methods live on `supervisorService`, NOT `organizationService` — a common mistake
- Upserts into `organization_settings` table with `onConflict: 'organization_id'`
- Accessible from Supervisor Profile screen via Settings button
- `expo-location` plugin must be configured in `app.json` with location permissions
- Android emulator requires: Location enabled in Quick Settings + mock location set via Extended Controls (three dots → Location)

## Report Photo Upload

### Storage Setup

- Bucket: `report-photos` (public)
- File path: `{userId}/{reportId}.jpg`
- RLS policies: users can only upload/update/delete files in their own `{userId}/` folder

### Upload Service

- `services/storageService.ts` — `pickReportPhoto()`, `uploadReportPhoto()`, `deleteReportPhoto()`
- Uses `expo-image-picker` with `base64: true` (avoids React Native's buggy `fetch().blob()`)
- Converts base64 → `Uint8Array` → Supabase Storage upload
- Image settings: 4:3 aspect ratio, quality 0.7
- `app/(employee)/reports.tsx` — Photo picker with preview and remove button

### Gotchas

- `reports` table must have `photo_url` TEXT column (run `ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_url TEXT;`)
- Do NOT use `fetch(uri).blob()` for uploads — it fails with "Network request failed" on React Native

## Supervisor Check-In/Check-Out

- `app/(supervisor)/home.tsx` — "My Attendance" card with same check-in/out flow as employees
- Uses the shared `attendanceStore` and `attendanceService` — role-agnostic, no separate logic needed
- Validation flow: GPS, WiFi, IP, spoofing detection (same as employee)
- Trust score recalculated after supervisor check-in/out
- UI states: Not checked in (green button) → Checked in (blue button) → Completed (checkmark)
- Offline sync and location monitoring work identically for supervisors

## expo-location Plugin

- Configured in `app.json` with `locationAlwaysAndWhenInUsePermission`
- Android requires a native rebuild after adding the plugin: `npx expo run:android`
- Android emulator needs: Location enabled in Quick Settings + mock location set via Extended Controls (three dots → Location)
- Used by "Use Current Location" button in `app/(supervisor)/settings.tsx`

## Required Supabase Migrations

Run these in Supabase SQL Editor before testing new features:

```sql
-- Add photo_url column to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create report-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for report photos
CREATE POLICY "Users can upload own report photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own report photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'report-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own report photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'report-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view report photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');
```
