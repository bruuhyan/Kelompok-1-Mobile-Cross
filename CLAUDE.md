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

The root layout (`app/_layout.tsx`) is the central auth gate. It checks the Supabase session, fetches the linked profile, mirrors that profile into `store/authStore.ts`, and routes by profile `status` and `role`.

Routing rules:

- No Supabase session: route to `/(auth)/login`
- Session without a profile: route to `/(auth)/onboarding`
- Pending profile: route to `/(auth)/waiting-approval`
- Suspended profile: sign out, clear persisted auth store, route to login
- Active employee: route to `/(employee)/home`
- Active supervisor/admin: route to `/(supervisor)/home`

### Auth Flow (Register-First Pattern)

The app uses a register-first pattern for cleaner separation of concerns:

1. **Register** → Email/password only
2. **Onboarding** → Choose to create or join organization
3. **Create/Join** → Complete organization setup
4. **Waiting Approval** → For employees joining existing organizations

This pattern ensures users are authenticated before any organization operations, simplifying RLS policies.

Important implementation details:

- Supabase session persistence is configured in `services/supabase.ts` with React Native AsyncStorage. Do not create another Supabase client outside this service.
- Creating a new organization and first admin profile must use `organizationService.createOrganizationWithAdmin()`, backed by the `create_organization_with_admin` SQL RPC in `supabase/rls_policies.sql`.
- Normal self-created profiles are restricted by RLS to `role = 'employee'` and `status = 'pending'`.
- Logout flows must call both `authService.signOut()` and `useAuthStore().logout()` so persisted profile state cannot survive sign-out.

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

Trust score recalculation happens client-side via `attendanceService.recalculateTrustScore()` after every check-in and check-out. The new score is synced to the local UI by calling `useAuthStore.getState().updateUser({ trust_score: newScore })` after each attendance action.

Penalty weights: late check-in (1), GPS outside workplace (4), WiFi mismatch (3), IP anomaly (1), spoofing detected (6), duplicate same-day check-in (2), missing checkout (2). Penalties use stacking multipliers based on offense count (0.5x for first 2, 1x for 3-5, 1.5x for 6-8, 2x for 9+).

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

- `app/_layout.tsx` - Root layout with theme provider, font loading, and central auth/profile routing gate
- `app/splash.tsx` - Animated splash screen; root auth gate performs actual session/profile routing
- `app/(auth)/_layout.tsx` - Auth stack navigation
- `app/(employee)/_layout.tsx` - Employee bottom tab navigation
- `app/(supervisor)/_layout.tsx` - Supervisor bottom tab navigation

### Components

- `components/Card.tsx` - Card component with variants
- `components/Input.tsx` - Input component with label, error, and icon support
- `components/Button.tsx` - Button component with variants and sizes
- `components/TrustScoreBadge.tsx` - Color-coded trust score display
- `components/InfoRow.tsx` - Reusable labeled information row with icon (used in profile screens)

### Services

- `services/supabase.ts` - Singleton Supabase client with AsyncStorage session persistence and service functions (auth, profile, organization, supervisor)
- `services/storageService.ts` - Supabase Storage operations for profile picture upload (uses expo-image-picker with base64, NOT fetch().blob())

### State Management

- `store/authStore.ts` - User authentication state, role, organization, avatar_url (via `updateUser` partial updates) ✅
- `store/attendanceStore.ts` - Check-in/check-out state, today's status, validation progress, offline sync queue, location monitoring ✅

Stores to be created:

- `store/requestStore.ts` - Holiday/overtime requests
- `store/syncStore.ts` - Offline sync queue and status

## UI Patterns

- **NEVER use `BrandColors`** in component styles — it is hardcoded to dark theme values and breaks in light mode
- **ALWAYS use `useAppTheme()`** hook + `createStyles(colors)` pattern for dynamic light/dark switching
- `BrandColors` is only used as the source of truth in `constants/theme.ts` for defining `Colors.dark` and `Colors.light`
- All screens support both light and dark themes via `ThemeColors`
- Bottom tabs use `HapticTab` component for haptic feedback
- Icons use `IconSymbol` from `@expo/vector-icons`
- Profile screens share `InfoRow` component for labeled information rows
- Profile cards show: avatar (image or initials), name, email, role/status badges, large TrustScoreBadge
- `components/SettingsAppearance.tsx` - Shared dark mode toggle component used across employee and supervisor settings
- Sub-components that render styles must also call `useAppTheme()` and `createStyles(colors)` — they do not inherit styles from parent

## Validation Rules

- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Organization code: exactly 6 alphanumeric characters
- GPS radius: 10-1000 meters (default 100)
- Trust score: 0-100

## Attendance Check-Out

- Requires an UPDATE RLS policy on `attendance_logs` table. If check-out fails with a permission error, verify this policy exists in Supabase:
  ```sql
  CREATE POLICY "Users can update own attendance"
    ON attendance_logs FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  ```
- Check-out runs the full validation flow (GPS, WiFi, IP, spoofing) before submitting
- If `currentLog` is null, check-out fails with "No active check-in found"

## Dashboard Auto-Refresh

- Use `useFocusEffect` from `expo-router` instead of `useEffect` for screens that need to refresh data when the user navigates back to them
- Applied to: `app/(supervisor)/home.tsx`, `app/(supervisor)/request-review.tsx`, and `app/(employee)/attendance.tsx`
- Pattern:
  ```tsx
  import { useFocusEffect } from 'expo-router';
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );
  ```

## Profile Picture Upload

### Storage Configuration
- Bucket: `profile-pictures` (public)
- File path: `{userId}/avatar.jpg`
- Field in profiles table: `avatar_url` (TEXT)
- RLS policies ensure users can only access their own folder

### Upload Implementation
- `services/storageService.ts` handles all avatar operations
- Uses `expo-image-picker` with `base64: true` option
- Converts base64 → `Uint8Array` → Supabase Storage upload
- Image settings: 1:1 aspect ratio, quality 0.7
- Old avatars are deleted before uploading new ones

### Critical Gotchas
- **NEVER use `fetch(uri).blob()`** for uploads — it fails with "Network request failed" on React Native
- **NEVER use `expo-file-system`** for reading files — the `base64: true` option from expo-image-picker is simpler and more reliable
- Both employee and supervisor profiles use the same `avatar_url` field and `storageService`

## Hybrid Build Workflow (Claude Code + Qwen Local)

### Principle

Claude Code acts as architect, planner, and reviewer.
Qwen (running locally via Ollama) handles implementation as the builder.

### Additional Folder Structure

workflow/
├── TASK_QUEUE/ ← task files created by Claude for Qwen
├── BUILD_OUTPUT/ ← raw code output from Qwen (pending review)
├── REVIEWS/ ← Claude's review notes per task
└── scripts/
├── qwen_build.sh
├── qwen_build_all.sh
└── check_ollama.sh

### What to Delegate to Qwen

Delegate tasks with a clearly defined interface contract:

- Zustand store implementations
- Supabase service/query functions
- Utility and helper functions
- Screen boilerplate

Do NOT delegate to Qwen:

- New architecture decisions or system design
- RLS policies (requires security judgment)
- Complex cross-system integrations
- Anything touching auth flow or trust score logic

### Task File Format

Every file in TASK_QUEUE/ must include:

- **Context**: where this file fits in the TrustEnd architecture
- **Stack**: TypeScript strict mode, Supabase client from `services/supabase.ts`, Zustand pattern from `store/authStore.ts`
- **Interface contract**: types and functions that must be exported
- **Schema reference**: relevant Supabase tables (refer to Database Schema section above)
- **Constraints**: do not create new stores, hooks, or dependencies outside what is defined

### Running Qwen

```bash
# Check Ollama is ready
bash workflow/scripts/check_ollama.sh

# Build a single task
bash workflow/scripts/qwen_build.sh workflow/TASK_QUEUE/TASK_001_name.md

# Build all pending tasks
bash workflow/scripts/qwen_build_all.sh
```

### Review Checklist

After Qwen produces output, Claude reviews for:

- [ ] Supabase client imported from `services/supabase.ts` (never instantiated inline)
- [ ] Types consistent with `utils/types.ts`
- [ ] Colors and theme values from `constants/theme.ts` (no hardcoded hex)
- [ ] `organization_id` always included in database queries
- [ ] Error handling follows existing patterns in the codebase
- [ ] No `any` types without explicit justification

## Additional Implementation Notes

### Completed Features Since Initial Setup

#### Dark Mode & Theming System
- All supervisor screens converted from `BrandColors` to `useAppTheme()` + `createStyles(colors)`
- `components/SettingsAppearance.tsx` - Shared dark mode toggle component
- `app/(employee)/settings.tsx` - Employee settings screen with dark mode toggle
- Light theme fully supported via `Colors.light` in `constants/theme.ts`
- Every screen follows the pattern: `const colors = useAppTheme(); const styles = createStyles(colors);`

#### Attendance System (Phase 5)
- `store/attendanceStore.ts` - Full attendance state management with check-in/out, validation, offline sync
- `services/attendanceService.ts` - GPS/WiFi/IP validation, offline queue, trust score recalculation
- `app/(employee)/attendance.tsx` - Attendance history screen with auto-refresh via `useFocusEffect`
- `app/(employee)/home.tsx` - Dashboard with check-in/out buttons, validation status display, offline banner
- Offline sync with integrity hash validation and 24-hour age limit
- Location monitoring every 30 minutes while checked in
- Trust score sync to local UI after check-in/out via `useAuthStore.getState().updateUser()`

#### Requests System (Phase 6)
- `app/(employee)/requests.tsx` - Holiday/overtime request submission and history
- `app/(supervisor)/request-review.tsx` - Supervisor request review with `useFocusEffect` auto-refresh
- `app/(supervisor)/request-detail/[id].tsx` - Request detail view

#### Reports System (Phase 7)
- `app/(employee)/reports.tsx` - Report submission with photo attachment
- `app/(supervisor)/report-review.tsx` - Supervisor report review
- `app/(supervisor)/report-detail/[id].tsx` - Report detail view

#### Task Management (Phase 8)
- `app/(supervisor)/team.tsx` - Team management with attendance logs, registration approvals, TrustScore overview
- `app/(supervisor)/task.tsx` - Task assignment and review
- `supabase/tasks.sql` - Tasks table schema and RLS policies

#### Trust Score System Updates
- `TRUST_SCORE_MAX` changed from 50 to 100 to align with badge tiers (80-100 Trusted, 50-79 Moderate, 0-49 At Risk)
- Removed hardcoded trust score cap in employee home screen
- Trust score now syncs to local UI after check-in/out via `attendanceStore`

#### Merge: joshua_tes → staging
- Resolved 8 merge conflicts across attendance, auth, theme, and store files
- Kept staging's `useAppTheme()` theming pattern throughout
- Integrated joshua_tes's full attendance implementation with staging's trust score modal
- All files pass lint (0 errors) and TypeScript (0 errors)
