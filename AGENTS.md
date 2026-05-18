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
- **State**: Zustand stores in `store/*.ts`
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
