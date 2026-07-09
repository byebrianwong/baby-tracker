# P0-5 · Auth flow

**Phase:** 0 · **Wave:** 3 (parallel with P0-4, P0-6) · **Depends on:** P0-2
**Owns:** `apps/app/src/features/auth/`, auth route group, session context

## Objective
Sign-in, sign-up, session persistence, and a route guard, using Supabase Auth. First-run creates or joins a household so the app always has a household context.

## Steps
1. Implement email/password plus Apple and Google sign-in via Supabase Auth. Handle the Expo redirect flow for OAuth on all three platforms.
2. Persist the session securely (expo-secure-store on native; appropriate storage on web). Restore on launch.
3. Build a session context/hook `useSession()` and a route guard: unauthenticated users see the auth stack; authenticated users see the app.
4. First-run household step: after first sign-in, prompt to **create a household** (name) or **join** one via invite code. Create the `households` + `household_members` row (role `parent`). Store the active household id in app state.
5. Minimal profile: display name. Store to `profiles`/`household_members` as appropriate.
6. Sign-out clears session and secure storage.

## Acceptance criteria
- [ ] Sign-up, sign-in, and sign-out work on iOS, Android, and Web.
- [ ] Session survives app restart.
- [ ] A new user completes create-or-join household and lands in the app with an active household id available app-wide.
- [ ] Route guard prevents access to app routes when signed out.

## Out of scope
Full caregiver invite management and roles UI (Phase 2). Here, only enough to establish a household and active-household context. Do not build the tab shell (P0-7) or event data (Phase 1).

## Notes
Everything downstream is scoped by the active household id; make sure it is reliably available before app routes render.
