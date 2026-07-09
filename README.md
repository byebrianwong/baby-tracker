# Baby Bean

The fastest, calmest way for two tired parents to log and understand a newborn's
feeds, diapers, and sleep — usable at 3am with one thumb and one open eye.

Universal app (iOS + Android + Web) from one Expo Router codebase, Supabase
backend, local-first. See [`CLAUDE.md`](CLAUDE.md) for the working contract and
[`docs/baby-tracker-build-spec.md`](docs/baby-tracker-build-spec.md) for the full spec.

## Monorepo layout

```
baby-tracker/
├── apps/app/            # the universal Expo Router app (iOS, Android, Web)
│   ├── app/             # file-based routes
│   └── src/             # features / components / theme / state / lib
├── packages/
│   ├── db/              # Supabase client, generated types, schema SQL, RLS  (P0-2)
│   ├── core/            # pure, unit-tested logic: timers, predictions, formatting
│   └── config/          # tokens.json (P0-3), shared tsconfig / eslint / prettier
├── docs/                # build spec + per-task briefs (docs/tasks/)
└── supabase/            # migrations + edge functions  (P0-2)
```

**Rule:** all business logic lives in `packages/core` as pure, tested functions.
UI only renders. Design tokens (`packages/config`) are the single source of truth —
never hardcode a hex or spacing value.

## Prerequisites

- Node ≥ 20 (developed on 25), pnpm 10+
- Xcode (iOS simulator) / Android Studio (emulator) for native targets
- Docker Desktop for local Supabase (`supabase start`) — needed from P0-2 onward

## Getting started

```bash
pnpm install         # install the whole workspace
pnpm dev             # start the Expo dev server (press i / a / w for iOS / Android / Web)
```

Copy `.env.example` to `.env` and fill in Supabase values (set by P0-2).

## Scripts (run from the repo root, fanned out by Turbo)

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the app (Expo dev server) |
| `pnpm build` | Export the web bundle |
| `pnpm typecheck` | `tsc --noEmit` across every package |
| `pnpm lint` | ESLint across every package |
| `pnpm test` | Vitest (targets `packages/core`) |
| `pnpm format` | Prettier write |

## Build plan

Work is broken into waves of parallelizable tasks under
[`docs/tasks/`](docs/tasks/README.md). Phase 0 (Foundation) → Phase 1 (Fast-log
core), then Phases 2–6 per the spec. **P0-1 (this scaffold) is complete.**

## Tech

Expo SDK 57 · Expo Router · React 19 / React Native 0.86 · TypeScript (strict) ·
Supabase · Legend-State v3 (local-first sync) · Turborepo + pnpm workspaces · Vitest.
