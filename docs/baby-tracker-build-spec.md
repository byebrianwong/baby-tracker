# Lull — Baby Tracker Build Spec

> **Working title:** "Lull" (evokes lullaby, and the lull between feeds). Placeholder. Replace globally when you pick a real name.
>
> **Audience for this doc:** Claude Code. This is a build spec, not marketing copy. It is written to be executed phase by phase. Each phase has acceptance criteria so you can verify before moving on.
>
> **One-line product thesis:** The fastest, calmest way for two tired parents to log and understand a newborn's feeds, diapers, and sleep, that stays usable at 3am with one thumb and one open eye.

---

## 1. Why this app exists (and why parents quit the others)

Parents abandon tracking apps for one reason: friction. If logging a feed takes twelve taps and a menu dive, they stop by week three. Every product decision here is subordinate to one rule:

**The core logging loop must be effortless, one-handed, and forgiving.** Two taps or fewer to log any of the four core events (feed, diaper, sleep, pump). Instant. Offline. Undoable. Editable after the fact, because parents log late constantly.

Everything else (insights, predictions, reports, milk stash, milestones) is valuable but secondary. If the fast-log loop is not perfect, none of the rest matters.

**What we borrow, and where we go further, is in the appendix (§14).** Short version: Nara's calm, free, low-friction logging plus Huckleberry's sleep intelligence and breadth, minus Huckleberry's paywall on the parts parents actually need, minus its interface density.

---

## 2. Non-negotiable principles

1. **Speed budget.** Opening the app to a logged feed: under 3 seconds, under 2 taps, no typing required. Treat this as a test, not an aspiration.
2. **One-thumb reachable.** All primary actions sit in the bottom third of the screen. Nothing critical lives in a top corner.
3. **Offline-first.** Every log writes locally and instantly. Sync happens in the background. The app never blocks on the network.
4. **Forgiving.** Undo on every action. Easy timestamp editing. Backdated entry is a first-class path, not a buried option.
5. **Calm, not cartoony.** Soft, warm, quiet. Confidence through restraint. See §9.
6. **Usable in the dark.** A genuine low-glare night mode is a core feature, not a theme toggle. This is the signature (§9.4).
7. **Two people, one truth.** Real-time caregiver sync with clean handoffs. No double-feeding because a partner logged on another phone.
8. **Not a doctor.** Predictions and insights are guidance drawn from the baby's own data. The app never diagnoses and says so plainly where relevant.

---

## 3. Platforms and architecture

### 3.1 Target
One universal codebase shipping **iOS, Android, and Web** from **Expo Router** (React Native + React Native Web). This is the most efficient path for a solo builder and gives true feature parity across surfaces. A separate marketing site (Next.js) is optional and out of scope for v1.

### 3.2 Stack

| Layer | Choice | Rationale |
|---|---|---|
| App framework | Expo (SDK latest stable) + Expo Router | iOS + Android + Web from one tree; file-based routing |
| Language | TypeScript, strict | Shared types end to end |
| Backend | Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) | Known quantity, Realtime powers caregiver sync |
| Local-first data + sync | Legend-State v3 with its Supabase sync plugin, persisted to disk | Observable state, offline persistence, and Supabase sync in one layer; very fast re-renders for a log-heavy UI |
| Local DB (if Legend-State persistence proves insufficient at scale) | op-sqlite or WatermelonDB | Fallback only; start with Legend-State persistence |
| Styling | Design tokens (§9) via a small theme provider; Unistyles or Tamagui for RN + Web parity | Avoid divergent styling code per platform |
| Notifications | expo-notifications | Reminders and running-timer surfacing |
| iOS widgets + Live Activities | Native targets via `@bacons/apple-targets` config plugin | Lock-screen timers and home widgets |
| Android widgets + ongoing notification | Expo config plugin + foreground service | Running-timer persistence |
| PDF / CSV export | Supabase Edge Function (server-side render) + client fallback | Doctor-ready reports |
| Voice / natural-language logging | On-device dictation to text, parsed client-side (rules) with a Claude API edge-function fallback | Fast path stays offline; LLM only for ambiguous input |

> Confirm current versions of Expo SDK, Legend-State, and the Apple-targets plugin before scaffolding; these move quickly. If Legend-State's Supabase sync plugin is not stable at build time, fall back to WatermelonDB + a Supabase sync adapter, or PowerSync.

### 3.3 Monorepo layout

```
lull/
├── apps/
│   └── app/                 # Expo Router universal app (iOS, Android, Web)
│       ├── app/             # routes
│       ├── src/
│       │   ├── features/    # feature modules (logging, sleep, growth, ...)
│       │   ├── components/  # shared UI (Pebble, Timeline, QuickLogBar, ...)
│       │   ├── theme/       # tokens, ThemeProvider, night mode
│       │   ├── state/       # Legend-State stores + sync
│       │   └── lib/         # formatters, timers, predictions
│       └── targets/         # native widget / live activity targets
├── packages/
│   ├── db/                  # Supabase client, generated types, schema SQL, RLS
│   ├── core/               # pure logic: timers, predictions, growth percentiles
│   └── config/             # tsconfig, eslint, tokens as JSON source of truth
├── supabase/
│   ├── migrations/
│   └── functions/          # edge functions: export-pdf, parse-log, predictions
└── turbo.json
```

Keep all business logic (timer math, wake-window predictions, growth percentiles, formatting) in `packages/core` as pure, tested functions. UI never computes; it renders.

---

## 4. Data model (Supabase / Postgres)

### 4.1 Design decision: one events table
Use a **single `events` table** for all logged activity. A newborn timeline is read constantly and written constantly across many types; one table keeps timeline queries and offline sync simple, and keeps the fast-log path uniform. Type-specific fields live in typed nullable columns for the hot ones (amount, side, duration, contents) plus a `data` jsonb for the long tail.

### 4.2 Tables

```sql
-- Households: the shared unit two+ caregivers belong to
households (
  id uuid pk,
  name text,
  created_at timestamptz,
  created_by uuid
)

household_members (
  household_id uuid fk,
  user_id uuid fk,
  role text check (role in ('parent','caregiver','viewer')),
  created_at timestamptz,
  primary key (household_id, user_id)
)

household_invites (
  id uuid pk,
  household_id uuid fk,
  code text unique,          -- short shareable code
  role text,
  expires_at timestamptz,
  accepted_by uuid null
)

children (
  id uuid pk,
  household_id uuid fk,
  name text,
  dob date,
  sex text null,             -- for growth percentile curves; optional
  photo_path text null,
  created_at timestamptz
)

-- The universal log
events (
  id uuid pk,
  child_id uuid fk,
  household_id uuid fk,       -- denormalized for RLS + fast filtering
  type text not null,         -- see enum below
  started_at timestamptz not null,
  ended_at timestamptz null,  -- null while a timer is running
  -- typed hot fields (nullable, used per type):
  amount_ml numeric null,     -- bottle, pump total, expressed feed
  duration_seconds int null,  -- derived or manual
  breast_side text null,      -- 'left' | 'right' | 'both'
  diaper_contents text null,  -- 'wet' | 'dirty' | 'mixed' | 'dry'
  data jsonb default '{}',    -- type-specific extras
  note text null,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz null -- soft delete for sync + undo
)
-- indexes: (child_id, started_at desc), (household_id, type, started_at desc),
-- partial index where ended_at is null (running timers)

-- Pumped milk freezer/fridge stash
milk_inventory (
  id uuid pk,
  household_id uuid fk,
  volume_ml numeric,
  pumped_at timestamptz,
  storage text,               -- 'fridge' | 'freezer'
  used_at timestamptz null,
  discarded boolean default false,
  note text null
)

reminders (
  id uuid pk,
  household_id uuid fk,
  child_id uuid fk,
  kind text,                  -- 'medication' | 'feed' | 'pump' | 'custom'
  schedule jsonb,             -- interval or times
  next_fire_at timestamptz,
  active boolean default true
)
```

### 4.3 Event types

`breast`, `bottle`, `solids`, `pump`, `diaper`, `sleep`, `medication`, `temperature`, `growth`, `milestone`, `tummy_time`, `bath`, `symptom`, `photo`, `note`.

Type-specific `data` examples: `growth` → `{ weight_g, height_cm, head_cm }`; `medication` → `{ name, dose, unit }`; `solids` → `{ foods: [], reaction }`; `pump` → `{ left_ml, right_ml }`; `milestone` → `{ label }`.

### 4.4 Row-level security
Every table is scoped by household membership. A user sees a row only if they are in `household_members` for that `household_id`. `viewer` role is read-only. Enforce with RLS policies on `household_id`; never trust the client. Generate TypeScript types from the schema into `packages/db`.

### 4.5 Sync and conflict rules
- Writes go to the local Legend-State store first and render immediately.
- Background sync pushes to Supabase and subscribes to Realtime for the household's events.
- Conflict resolution: last-write-wins on `updated_at` for edits. Soft deletes (`deleted_at`) so an undo or a late-arriving edit never resurrects a deleted row incorrectly.
- Running timers (`ended_at is null`) are the one special case: the caregiver who started the timer owns it; if two devices start the same activity within a short window, surface a gentle merge prompt rather than silently duplicating.

---

## 5. The fast-log core (the heart of the app)

This is Phase 1 and it must be excellent before anything else ships.

### 5.1 Home screen
A single scroll:
- **Status strip (top, glanceable):** time since last feed, last diaper, and whether baby is currently asleep or how long since waking. Large, calm numbers. This answers the 3am question ("when did we last feed?") before any tapping.
- **Timeline (middle):** reverse-chronological list of today's events, grouped by part of day. Each row: soft category color dot, icon, time, one-line summary. Tap to edit. Swipe to undo/delete.
- **Quick-log bar (bottom, thumb zone):** four large pebble buttons: Feed, Diaper, Sleep, Pump. This is the primary surface.

### 5.2 Logging interactions (the two-tap rule)
- **Sleep / feed / pump (timed events):** tap the pebble → timer starts, confirmed by a soft haptic and a running "live pebble." Tap again (or from the Live Activity / notification) to stop. One tap to start, one to stop. No screen change required to start.
- **Diaper (instant event):** tap Diaper → a compact three-option sheet (wet / dirty / mixed) → tap one. Two taps. Sheet remembers nothing it does not need to.
- **Breast side memory:** when starting a breast feed, pre-select the side opposite the last feed, shown but overridable. Parents alternate sides; guessing right saves a tap and cognitive load.
- **Smart defaults:** bottle amount defaults to the rolling median of recent bottles. Pre-filled, editable.

### 5.3 Running timers that survive everything
A started timer must persist across app close, phone lock, and reboot:
- iOS: **Live Activity** on the lock screen and Dynamic Island with start/stop.
- Android: **ongoing notification** (foreground service) with actions.
- Both show elapsed time and a stop control without opening the app.

### 5.4 Backdated and corrected entry (first-class)
Parents forget to start the timer, or log after the fact. So:
- Every event's start and end time is editable with a fast wheel/stepper, defaulting to sensible offsets ("15 min ago", "30 min ago").
- A dedicated "log something earlier" path from the quick-log bar: pick type, set time, done.
- Editing never requires leaving the timeline for a deep settings screen.

### 5.5 Undo
Every log shows a brief inline "Undo" affordance after creation, and swipe-to-undo on any timeline row. Undo restores exact prior state (soft delete makes this trivial).

### 5.6 Acceptance criteria (Phase 1)
- Start-to-logged-feed under 3s and 2 taps, verified on a mid-range Android device.
- Timer survives force-quit and reboot on iOS and Android.
- All four core events log, edit, backdate, and undo, fully offline.
- Timeline renders 200+ events without jank.

---

## 6. Full feature spec (comprehensive)

### 6.1 Feeding
- **Breast:** independent left/right timers, "both" sessions, last-side memory, total duration. Optional simple "double timer" for tandem.
- **Bottle:** volume (ml or oz, per user unit setting), contents label (breast milk / formula / mixed).
- **Pumping:** left/right volumes, total, session duration. On save, offer "add to milk stash" (§6.7).
- **Solids:** foods eaten, reaction note, first-food flag. Simple allergen-introduction log (which of the common allergens have been introduced and when).

### 6.2 Diapers
Wet / dirty / mixed / dry, with optional quick attributes (color, consistency) collapsed by default so they never slow the two-tap path.

### 6.3 Sleep
- Start/stop timer, plus retroactive nap logging.
- Naps vs night sleep classified automatically by time of day, overridable.
- Daily totals: total sleep, longest stretch, number of naps.

### 6.4 Sleep predictions (the Huckleberry-beating feature, and free)
A "next window" suggestion for when the baby is likely ready to sleep:
- **Baseline:** age-appropriate wake windows (a lookup table by age in weeks/months, grounded in general pediatric sleep guidance).
- **Personalization:** blend the baseline with the baby's own trailing average wake duration and nap length over the last several days.
- **Output:** a suggested next-sleep window (a range, not a hard time) and a light daily rhythm view.
- Computed **on-device** in `packages/core` so it works offline and instantly.
- Always labeled as guidance from the baby's patterns, with a plain note that it is not medical advice and every baby differs. Huckleberry charges for this; here it is core and free.

### 6.5 Growth and milestones
- Growth entries: weight, height, head circumference.
- **Percentile charts** against WHO growth standards (0 to 2 years) with the child's points plotted. Bundle the WHO reference tables in `packages/core`; compute percentiles locally.
- Milestones: a soft checklist with dates, plus free-form "firsts."

### 6.6 Health
- Medications: name, dose, schedule, with reminders and a clear dose history (avoids double-dosing across caregivers).
- Temperature log with a simple trend view.
- Symptoms: quick tags plus notes, for describing a pattern to a pediatrician.

### 6.7 Milk stash inventory
Freezer/fridge inventory of pumped milk: volume, pumped date, storage location, oldest-first "use by" surfacing, and use/discard actions. This is a feature dedicated pumping parents love and most general trackers lack.

### 6.8 Activities
Tummy time and bath, as fast timed or instant logs. Kept out of the primary quick-log bar to protect the two-tap path; reachable via a "more" affordance.

### 6.9 Insights and reports
- **Daily and weekly summaries:** feed count and volume, diaper counts, total sleep, longest stretch, trends over time. Plain-language, glanceable.
- **Doctor-ready PDF export** for a chosen date range: feeds, diapers, sleep, growth with percentile curves, meds. Rendered server-side via an edge function.
- **CSV export** of all events, so the user owns their data and can leave. Never lock data in.

### 6.10 Multi-caregiver and handoffs
- Household model with invite codes; parent / caregiver / viewer roles.
- Real-time sync via Supabase Realtime, so both phones always agree.
- **Handoff summary:** a one-tap "since you last checked" digest (for example: "2 feeds, 1 dirty diaper, napping for 40 min, last fed left side"). This is the shift-change view that makes two-person and nanny/grandparent care smooth.

### 6.11 Reminders and notifications
- Optional feed/pump intervals, medication times, and custom reminders.
- Reminders are opt-in and quiet by default; a newborn app should not nag.

### 6.12 Voice and natural-language logging
- Tap-and-hold a mic on the quick-log bar, speak ("left side twelve minutes", "four ounces at three am", "dirty diaper"), and the app parses it into a structured event with the timestamp resolved.
- Fast path: on-device dictation plus a rules parser in `packages/core` for the common phrasings, fully offline.
- Fallback: ambiguous input goes to a Claude API edge function that returns structured JSON. Always show the parsed result for a one-tap confirm before saving; never save an unconfirmed voice log.

### 6.13 Optional AI assistant (careful scope)
A "what happened today / this week" question box that answers from the baby's own logged data ("how many wet diapers yesterday?", "average nap length this week?"). It summarizes data and gives general, non-diagnostic information. It never gives medical advice or diagnoses, and it says so when a question strays into medical territory, pointing the user to their pediatrician. Runs via an edge function using the Claude API over the household's data.

---

## 7. Efficiency layer (surfaces beyond the app)

These are what make the difference between "I track sometimes" and "I track without thinking."

- **Home-screen widgets** (iOS + Android): time since last feed / diaper / sleep, and tap-to-log the four core events without opening the app.
- **Lock-screen widgets and Live Activity** (iOS): running timer and quick stats.
- **Apple Watch and Wear OS** (Phase 5+): start/stop timers and quick-log from the wrist, since parents often do not have a free hand. Note this needs native targets and adds real complexity; schedule accordingly.
- **Haptics:** a soft confirmation tap on every log, so the parent gets feedback without looking at the screen. Important in the dark.
- **Voice logging** (§6.12) as the hands-busy path.

---

## 8. Navigation map

- **Home** (timeline + status strip + quick-log bar): the default and most-used screen.
- **Insights** (summaries, trends, predictions, growth charts).
- **Baby** (profile, growth, milestones, milk stash, health).
- **More / Settings** (caregivers, reminders, units, export, theme and night mode).

Four items maximum in the tab bar. Home is always one tap away from anywhere.

---

## 9. Design system

**Direction:** soft, warm, and quiet. Confidence through restraint and generous space, not through illustration. Closer to Nara than Huckleberry. Rounded "pebble" forms, humanist type, muted natural category colors. Avoid childish mascots, bright primaries, and busy dashboards.

Design tokens are the single source of truth. Author them once in `packages/config` as JSON and consume everywhere.

### 9.1 Color — Day theme

```css
/* Neutrals: warm, soft, low-glare */
--paper:        #FBF7F1;  /* app background */
--surface:      #FFFDFB;  /* cards, sheets */
--surface-sunk: #F3EEE6;  /* wells, inputs */
--ink:          #2C2A28;  /* primary text */
--ink-soft:     #6E6A64;  /* secondary text */
--line:         #EAE3D9;  /* hairlines */

/* Primary: a calm dusk blue, used for primary actions and focus */
--primary:      #4F6D8F;
--primary-soft: #E7EDF3;

/* Category accents: soft, distinguishable, never neon */
--feed:    #E8A87C;  /* warm apricot  */
--sleep:   #8E93C9;  /* soft periwinkle */
--diaper:  #86B39A;  /* soft green */
--pump:    #D69AB0;  /* soft rose */
--solids:  #D9B26A;  /* warm ochre */
--health:  #E08A84;  /* soft coral */
--growth:  #6FB0B0;  /* soft teal */
```

Each category color also has a "-soft" tint (roughly 12 to 15 percent opacity over paper) for backgrounds and dots.

### 9.2 Color — Night theme (the signature, see §9.4)

```css
--paper:        #14110E;  /* deep warm brown-black */
--surface:      #1F1A16;
--surface-sunk: #0E0B09;
--ink:          #EDE4D8;  /* warm off-white */
--ink-soft:     #A69C8E;
--line:         #2A241E;
--primary:      #8FA9C4;  /* lifted for contrast on dark */
/* category accents: same hues, desaturated ~20% and dimmed for low glare */
```

Night theme is amber-leaning and low blue-light by design. Maximum brightness is capped lower than a normal dark theme.

### 9.3 Typography

```
Display  : Fraunces (soft optical settings, low "wonk"/"soft" axis)
           Used sparingly: large numbers on the status strip, greetings.
Body/UI  : Hanken Grotesk (humanist, friendly, highly legible small)
Timers   : Geist Mono or Martian Mono, tabular
           Monospaced so running timers do not jitter as digits change.
```

Type scale (pt, body-relative): 12 caption, 14 body, 16 body-large, 20 subtitle, 28 title, 40+ display numerals. Sentence case throughout. Tabular figures for all numeric data.

### 9.4 Signature: "Night feed" mode

The one memorable, subject-driven element. This app is used in a dark nursery while a partner and baby sleep. So:
- A dedicated **Night feed mode** beyond ordinary dark theme: ultra-dim, amber-tinted, minimal, with oversized touch targets and the timer front and center. Reduced motion. No bright whites anywhere.
- Auto-suggested during nighttime hours, one-tap to enter, and it dims further after a few seconds of inactivity.
- This is both the aesthetic signature and a real usability win. Spend the design boldness here; keep everything else quiet.

### 9.5 Shape, space, motion

```css
--r-sm: 12px;  --r-md: 18px;  --r-lg: 28px;  --r-pill: 999px;
/* generous, "pebble" feel */

--space base 4px scale: 4, 8, 12, 16, 24, 32, 48

/* Touch targets */
--tap-min: 48px;             /* everywhere */
--pebble-primary: 64px tall; /* quick-log buttons, larger for sleepy one-handed use */
```

- **Motion:** gentle, 200 to 300ms ease-out. A soft "settle" spring when a log is confirmed. Ambient motion is minimal; over-animation reads as generic and drains battery. Respect reduced-motion.
- **Elevation:** soft, diffuse shadows at low opacity. No hard drop shadows.
- **Icons:** rounded line icons, ~2px stroke, rounded caps. One consistent set. No filled cartoon blobs.

### 9.6 Copy voice
Plain, warm, sentence case. Buttons say what happens ("Start feed", "Stop", "Log diaper"). Empty states invite action ("No feeds yet today. Tap Feed to start."). Errors explain and recover, they do not apologize or use mood. Never cutesy.

### 9.7 Accessibility floor
Visible keyboard/focus states, screen-reader labels on every control, minimum contrast met in both themes (Night mode included), reduced-motion honored, dynamic type supported. Build this in from Phase 0, do not retrofit.

---

## 10. Build phases (parallelizable for Claude Code)

Each phase is shippable and testable. Phases 3 and 5 can run in parallel with others once the Phase 1 core and Phase 2 sync exist.

**Phase 0 — Foundation**
Monorepo + Turborepo, Expo Router app, Supabase project, auth (email + Apple/Google), schema + RLS + generated types, Legend-State store + Supabase sync, design tokens + ThemeProvider + light/dark/night, base component kit (Pebble, Sheet, TimelineRow, StatusStat), tab shell.
*Done when:* a signed-in user on any of the three platforms sees an empty themed Home with a working (non-persistent) quick-log bar, and theme switching works including Night mode.

**Phase 1 — Fast-log core** (the priority)
Status strip, timeline, quick-log bar, the four core events with timers, breast-side memory, smart bottle defaults, backdated entry, edit, undo, all offline. Live Activity / ongoing notification for running timers.
*Done when:* §5.6 acceptance criteria pass.

**Phase 2 — Caregivers and sync**
Households, invite codes, roles, Supabase Realtime sync, conflict rules, handoff summary, reminders + notifications.
*Done when:* two devices in one household stay consistent in real time, a timer started on one appears on the other, and the handoff summary is accurate.

**Phase 3 — Full event coverage**
Solids (+ allergen intro), meds (+ dose history), temperature, growth (+ WHO percentile charts), milestones, tummy time, bath, symptoms, photos, milk stash inventory.
*Done when:* every event type logs, edits, and displays, and growth percentiles match WHO reference values.

**Phase 4 — Intelligence and reports**
On-device sleep predictions and daily rhythm, insights/summaries, doctor-ready PDF export, CSV export.
*Done when:* predictions produce a sensible next-window from seeded data, PDF renders for a date range, CSV round-trips.

**Phase 5 — Efficiency surfaces**
Home/lock-screen widgets, voice + natural-language logging (rules path, then LLM fallback), then Apple Watch / Wear OS.
*Done when:* a core event can be logged from a widget and from voice without opening the app, with confirm-before-save on voice.

**Phase 6 — Polish**
Night feed mode refinement, haptics, motion pass, onboarding, accessibility audit, empty/error states, performance pass.
*Done when:* the app feels calm and fast end to end, and the §2 principles are demonstrably met.

---

## 11. Definition of done (applies to every phase)

- Works offline where the feature reasonably can.
- Works on iOS, Android, and Web (or is explicitly scoped to a platform, e.g. Live Activities are iOS-only).
- Meets the accessibility floor (§9.7).
- Business logic lives in `packages/core` with unit tests; UI only renders.
- No feature slows the two-tap core-log path.

---

## 12. Privacy and safety

- Infant data is sensitive. RLS scopes every read/write to household membership; nothing is public.
- Photos in Supabase Storage are private with signed URLs.
- The user can export everything (CSV) and delete their data. No lock-in.
- No third-party ad or analytics SDKs that resell data. If analytics are needed, use a privacy-respecting, self-hostable option and disclose it.
- The app is not a medical device. Predictions and the AI assistant give general, data-derived guidance, never diagnosis, and defer to a pediatrician on medical questions.

---

## 13. Positioning note (optional, for later)

The competitive wedge is that the sleep intelligence parents pay Huckleberry for is free and core here, and the interface is as calm and fast as Nara. If a paid tier is ever added, keep predictions and the fast-log core free; reserve paid for extras like extended history, extra children, or premium export. Do not paywall the parts that create the habit.

---

## 14. Appendix: what we take, and where we go further

| Capability | Nara | Huckleberry | Lull (this spec) |
|---|---|---|---|
| Fast, low-friction logging | Strong | Denser | Two-tap core, one-handed, voice, widgets |
| Price of core tracking | Free | Free tier | Free core |
| Sleep predictions | None | Paid (SweetSpot) | Free, on-device, personalized |
| Calm, soft design | Close | Farther | Soft system + Night feed mode signature |
| Multi-caregiver real-time sync | Limited, separate accounts | Via shared account | Households + roles + realtime + handoff digest |
| Offline-first | Partial | Limited | First-class, local-first |
| Running-timer persistence | Basic | Yes | Live Activity + ongoing notification + widget |
| Backdated / corrected entry | Yes | Yes | First-class path, fast time editing |
| Milk stash inventory | No | No | Yes |
| Growth percentiles | Basic | Yes | WHO curves, computed locally |
| Doctor-ready export | Limited | Yes | PDF + full CSV, user owns data |
| Data ownership / export | Yes | Partial | Full CSV export, no lock-in |

### Reference sources
- Huckleberry App Store listing (free vs paid features): https://apps.apple.com/us/app/huckleberry-baby-tracker/id1169136078
- Nara vs Huckleberry comparison: https://pebbi.co/blog/nara-vs-huckleberry-2026
- WHO Child Growth Standards (for percentile curves): https://www.who.int/tools/child-growth-standards/standards

---

*End of spec. Build Phase 0, then Phase 1 to the acceptance bar before expanding. The fast-log core is the product; protect it.*
