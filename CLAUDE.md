# CLAUDE.md — Baby Bean (baby tracker)

This file is loaded into every session. Keep it in mind on every task. Full detail lives in `docs/baby-tracker-build-spec.md`; this is the working contract.

> **Product name:** "Baby Bean". (The spec was drafted under the placeholder "Lull"; treat any remaining "Lull" in the spec prose as "Baby Bean".)

## What we are building
A universal (iOS + Android + Web) newborn tracker. One Expo Router codebase, Supabase backend, local-first. Comprehensive feature set, but the product is the fast-log core. See the spec for the full picture.

## Prime directive
Parents quit trackers that are slow. Protect the core-log loop above all else:
- Logging any core event (feed, diaper, sleep, pump) is **two taps or fewer**, one-handed, offline, instant.
- Primary actions live in the **bottom third** of the screen (thumb zone).
- Every action is **undoable** and **backdatable**. Parents log late constantly.
- **No feature is allowed to slow the core-log path.** If your task would add a tap or a network wait to it, stop and flag it.

## The eight principles (condensed)
1. Speed budget: open-to-logged-feed under 3s, under 2 taps, no typing.
2. One-thumb reachable.
3. Offline-first: write locally and render immediately; sync in the background.
4. Forgiving: undo everywhere, easy timestamp editing, first-class backdated entry.
5. Calm, not cartoony (closer to Nara than Huckleberry).
6. Usable in the dark: the Night feed mode is a real feature, not a theme.
7. Two people, one truth: real-time caregiver sync, clean handoffs.
8. Not a doctor: guidance from the baby's own data, never diagnosis.

## Stack
- Expo (latest stable SDK) + Expo Router, TypeScript strict.
- Supabase: Postgres, Auth, Realtime, Storage, Edge Functions.
- Local-first state + sync: Legend-State v3 + its Supabase sync plugin, persisted to disk. If that plugin is not stable at build time, fall back to WatermelonDB or PowerSync and note the switch.
- Styling: design tokens (single source of truth) via Unistyles or Tamagui for RN + Web parity.
- Notifications: expo-notifications. iOS Live Activities and widgets via `@bacons/apple-targets`. Android running timers via foreground-service ongoing notification.

> Versions move fast. Confirm current Expo SDK, Legend-State, and plugin versions before scaffolding or upgrading. Do not pin from memory.

## Build decisions (verified at scaffold time — 2026-07-08)
- **Expo SDK 57** (`expo` / `expo-router` 57.x). Turbo 2.10.x, Vitest 4.x.
- **Legend-State v3 beta (`@legendapp/state@3.0.0-beta.47`) — RISK GATE PASSED.** The `syncedSupabase` plugin (`@legendapp/state/sync-plugins/supabase`) supports a `schema` param (targets `baby_bean`), `realtime`, soft-delete via `fieldDeleted: 'deleted_at'`, LWW via `fieldUpdatedAt`, and incremental `changesSince: 'last-sync'`. No fallback needed. Persist via `@react-native-async-storage/async-storage` (native + web).
- **Auth session storage = AsyncStorage, not expo-secure-store.** A full Supabase session can exceed SecureStore's 2KB/key limit; AsyncStorage is Supabase's documented RN approach. Apple/Google OAuth wired via `signInWithOAuth` (needs providers enabled in the Supabase dashboard to complete).
- **Supabase: SHARED hosted project `ssmiunjctsigikbwdfpc`** (also used by the `second-guess` app; consolidated to save cost). Baby Bean lives entirely in its own **`baby_bean` Postgres schema** so it never touches second-guess's `public` tables. Client targets the schema via `db: { schema: 'baby_bean' }`. Migration applied by hand via the dashboard SQL editor (the shared migration history has second-guess's `0001`–`0004`, so `supabase db push` is avoided; our migration uses a timestamp filename). The `baby_bean` schema must be added to Dashboard → API → Exposed schemas.
- **Theme (P0-3): lightweight React Context `ThemeProvider`**, not Unistyles/Tamagui. Tokens (`packages/config/tokens.json`) stay the single source of truth; a context provider gives RN+Web+Expo-Go parity with zero native deps and satisfies the day/dark/night switch. Swappable later behind the stable `useTheme()` API if perf ever needs it.
- **Typed routes:** `experiments.typedRoutes` is on; `.expo/types/router.d.ts` is regenerated on `expo start`. If `pnpm typecheck` errors on a new route's `Href`, boot the dev server once to refresh it.
- **React Compiler is OFF** (`experiments.reactCompiler: false`). It mis-optimizes Legend-State's reactivity and tripped rules-of-hooks. Re-enable only if Legend-State + React Compiler compatibility is verified.
- **Legend-State React pattern (P1-1/P0-6):** wrap reactive UI in `observer()` and read observables with `.get()`. Do NOT use `use$` on synced observables — its hook signature is unstable across sync-state changes and violates rules-of-hooks. In hot components like the route guard, subscribe manually (`useState` + `useEffect` + `observable.onChange`) for a fixed hook signature (see `useHasChild`). Sync uses `changesSince: 'all'` with NO `fieldDeleted` (soft delete = a synced `deleted_at` column) so undo works. **Normalize reads to plain objects** (`state/events.ts` `activeList` does a JSON round-trip): `.get()`/`.peek()` can hand back proxies for just-written rows whose nested fields (e.g. `started_at`) aren't primitives, which silently breaks sorts/`localeCompare` and the pure core helpers.
- **Dev harness:** set `EXPO_PUBLIC_DEV_LOCAL_HH=<uuid>` in `apps/app/.env` to drive the app fully offline (no auth/DB) against a local household — dev builds only (`__DEV__`-gated), inert in production. Remove it to use the real auth flow.
- **First-run needs a child:** onboarding is create/join household → **add baby** (`app/(auth)/child.tsx`); the fast-log core no-ops without a child.

## Monorepo layout and where things go
```
lull/
├── apps/app/                # the universal app
│   └── src/
│       ├── features/        # one folder per feature (logging, sleep, growth...)
│       ├── components/      # shared UI (Pebble, Sheet, TimelineRow, StatusStat)
│       ├── theme/           # ThemeProvider, night mode, token consumption
│       ├── state/           # Legend-State stores + sync
│       └── lib/             # thin app-level helpers
├── packages/
│   ├── db/                  # Supabase client, generated types, schema SQL, RLS
│   ├── core/                # PURE logic: timers, predictions, percentiles, parsing
│   └── config/             # tokens.json (source of truth), tsconfig, eslint
└── supabase/               # migrations + edge functions
```

## Conventions (enforced)
- **Logic lives in `packages/core` as pure, unit-tested functions. UI only renders.** No timer math, prediction, or formatting inside components.
- **Design tokens are the single source of truth.** Author once in `packages/config/tokens.json`; never hardcode a hex or spacing value in a component.
- **Data:** one `events` table for all logged activity (typed hot columns + `data` jsonb). Soft delete via `deleted_at` (powers undo and safe sync). RLS scopes everything by household membership; never trust the client.
- **Writes are local-first:** Legend-State store first, render, then sync. UI never blocks on the network.
- **TypeScript strict.** Types for the DB are generated from the Supabase schema into `packages/db`, not hand-written.
- **UI copy:** sentence case, plain verbs, say what happens ("Start feed", "Stop", "Log diaper"). Empty states invite action. Errors explain and recover. Never cutesy.

## Definition of done (every task)
- Works offline where it reasonably can.
- Works on iOS, Android, and Web, or is explicitly scoped to a platform (e.g. Live Activities are iOS-only) and says so.
- Meets the accessibility floor: screen-reader labels, visible focus, contrast in both themes, reduced-motion honored, dynamic type.
- Core logic in `packages/core` with unit tests. UI only renders.
- Does not slow the two-tap core-log path.

## How to work a task
1. Read your task file in `tasks/` fully before writing code.
2. Stay inside the files/dirs your task **owns** (listed at the top of the task). This is how parallel sessions avoid collisions.
3. If you need something another task owns, import its public interface; do not edit its files.
4. Run the task's acceptance checklist before declaring done.

## Gotchas
- Live Activities and lock-screen widgets are iOS-only. Android uses an ongoing notification. Web has neither; degrade gracefully.
- Do not add ad or data-reselling analytics SDKs. Infant data is sensitive.
- The app is not a medical device. Prediction and assistant surfaces carry a plain non-diagnostic note and defer to a pediatrician.
- Never lock in data: CSV export must always work.

## Design quick reference
- Tokens: `packages/config/tokens.json` (light "Day", dark, and "Night feed"). Consumed via `theme/`.
- Type: Fraunces (display, sparing), Hanken Grotesk (body/UI), Geist Mono or Martian Mono (timers, tabular).
- Shape: rounded "pebble" forms. Radii 12 / 18 / 28 / pill. Primary log buttons 64px tall. Min tap target 48px.
- Signature: Night feed mode (ultra-dim, amber, low blue-light, oversized targets). Spend design boldness here; keep everything else quiet.
