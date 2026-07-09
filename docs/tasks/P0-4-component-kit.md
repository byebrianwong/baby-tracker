# P0-4 · Base component kit

**Phase:** 0 · **Wave:** 3 (parallel with P0-5, P0-6) · **Depends on:** P0-3
**Owns:** `apps/app/src/components/`

## Objective
Build the small set of reusable, themed primitives every screen uses. Consumes theme tokens only; no data, no feature logic.

## Components
1. **Pebble** — the primary rounded button. Variants: `primary` (64px tall, category-colorable), `secondary`, `ghost`. Built-in soft press animation and haptic hook. Fully reachable and large.
2. **Sheet** — bottom sheet for quick choices (used by diaper log, edit, etc.). Opens fast, dismissible, one-handed. Options render as large tap targets.
3. **TimelineRow** — a single event row: category color dot, icon slot, time, one-line summary, right-side affordance. Swipe actions (undo/delete) supported via a render prop; the row does not implement the data action.
4. **StatusStat** — a large glanceable stat for the home status strip (label + big number, e.g. "2h 10m since last feed"). Uses display font.
5. **Stepper / TimeWheel** — fast time and number adjustment for backdating and volumes, with sensible quick offsets ("15 min ago").
6. **IconSet** — the rounded line icon set (2px stroke, rounded caps) for each event type. One consistent family.
7. **Toast/UndoBar** — brief inline confirmation with an Undo affordance.

## Steps
- Implement each as a controlled, presentational component reading tokens from `useTheme()`.
- Add haptics via a small `useHaptic()` hook (soft confirmation on primary actions), no-op on web.
- Provide a component gallery route (`/dev/gallery`) rendering every component in all three theme modes for visual review.
- Accessibility: roles, labels, focus states, min 48px targets, reduced-motion variants.

## Acceptance criteria
- [ ] Gallery route shows all components in Day, Dark, and Night without layout breakage.
- [ ] Pebble primary is 64px tall, category-colorable, animates and fires a haptic on press (native).
- [ ] Sheet opens and dismisses one-handed; options are large targets.
- [ ] No hardcoded style values; everything from tokens.
- [ ] Every interactive component has a screen-reader label and visible focus.

## Out of scope
Wiring components to data or the Home screen (P0-7 and Phase 1 do that). Do not import from `state/` or `features/`.
