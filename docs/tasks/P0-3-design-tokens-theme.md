# P0-3 · Design tokens + ThemeProvider + Night mode

**Phase:** 0 · **Wave:** 2 (parallel with P0-2) · **Depends on:** P0-1
**Owns:** `packages/config/tokens.json`, `apps/app/src/theme/`

## Objective
Author the design tokens once and provide a theme system with three modes: Day (light), Dark, and the signature Night feed mode. Every later UI task consumes this and never hardcodes values.

## Steps
1. Author `packages/config/tokens.json` as the single source of truth, using the values in spec §9:
   - Neutrals, `--primary` + soft, and category accents (`feed, sleep, diaper, pump, solids, health, growth`) each with a soft tint, for Day and Dark.
   - Night feed palette: deep warm brown-black paper, warm off-white ink, desaturated dimmed accents, amber-leaning, capped max brightness.
   - Radii (12 / 18 / 28 / pill), spacing scale (4 base), tap sizes (`tap-min` 48, `pebble-primary` 64), motion durations (200 to 300ms), elevation (soft diffuse shadows).
   - Type roles: display = Fraunces, body/UI = Hanken Grotesk, timer = Geist Mono or Martian Mono. Include a type scale.
2. Load the three fonts in the app (expo-font). Ensure tabular figures are used for numeric/timer styles.
3. Build `theme/ThemeProvider` (Unistyles or Tamagui) exposing tokens as a typed theme. Support `mode: 'day' | 'dark' | 'night'`.
4. Mode selection: follow system light/dark by default; Night feed mode is a separate, explicitly enterable state (auto-suggested at night in a later task, but the mechanism lives here). Provide a `setMode` and a `useTheme()` hook.
5. Night feed behavior hooks: expose an `isNight` flag and a dimming affordance the UI can escalate after inactivity (the actual timer UI is built later; provide the plumbing).
6. Provide primitives: `useTheme()`, themed `Text`, `View`, and a `tokens` export. No component library yet (that is P0-4), just the theme layer.

## Acceptance criteria
- [ ] A demo screen renders identical layout across Day, Dark, and Night by only switching mode.
- [ ] No hardcoded colors or spacing anywhere; all read from tokens.
- [ ] Night mode is visibly low-glare, amber-leaning, and lower max brightness than plain Dark.
- [ ] Fonts load on iOS, Android, and Web; timers use tabular mono.
- [ ] Contrast meets the accessibility floor in all three modes.

## Out of scope
Buttons, sheets, timeline rows (P0-4). Auto-switch scheduling and the timer UI (Phase 1 / Phase 6).

## Notes
This is where the product's calm identity is set. Keep it quiet and disciplined; the boldness budget is reserved for Night feed mode.
