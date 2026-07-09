# P0-1 · Monorepo + Expo + tooling scaffold

**Phase:** 0 Foundation · **Wave:** 1 (solo blocker) · **Depends on:** none
**Owns:** repo root, `turbo.json`, `apps/app/` scaffold, `packages/{db,core,config}/` empty packages, root tooling config

## Objective
Stand up the monorepo and a running Expo Router app that launches on iOS, Android, and Web, with shared TypeScript config and lint. No product features yet.

## Steps
1. Init a Turborepo monorepo (pnpm workspaces). Create workspaces `apps/*` and `packages/*`.
2. Scaffold `apps/app` as an Expo app with Expo Router (verify current create command and SDK). Confirm it runs on all three targets: `ios`, `android`, `web`.
3. Create empty packages `packages/db`, `packages/core`, `packages/config`, each with its own `package.json`, `tsconfig.json`, and an `index.ts`. Wire them as workspace deps of `apps/app`.
4. Add shared tooling in `packages/config`: base `tsconfig` (strict), ESLint + Prettier. Extend from the app and packages. Enforce no em dashes is not needed; enforce strict TS and import ordering.
5. Add a unit test runner (Vitest) at the root, targeting `packages/core`. Add one trivial passing test to prove the pipeline.
6. Add root scripts: `dev`, `build`, `lint`, `typecheck`, `test` via Turbo.
7. Commit `.env.example` with placeholders for Supabase URL and anon key. Real values are set by later tasks.

## Acceptance criteria
- [ ] `pnpm dev` launches the app; it opens on iOS simulator, Android emulator, and web without errors.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass.
- [ ] `apps/app` imports a symbol from `packages/core` successfully (proves workspace wiring).
- [ ] Strict TypeScript is on across all packages.

## Out of scope
Auth, data, theme, components, navigation beyond the default. Those are later waves.

## Notes
Verify current versions rather than pinning from memory. Do not add feature dependencies yet; keep the scaffold clean.
