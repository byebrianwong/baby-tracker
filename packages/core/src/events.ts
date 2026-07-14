/**
 * Pure event logic for the fast-log core. No React, Expo, or Supabase — just
 * deterministic functions over plain event shapes, so every rule here is
 * unit-tested and the UI only renders the result.
 */

export type EventType =
  | 'breast'
  | 'bottle'
  | 'solids'
  | 'pump'
  | 'diaper'
  | 'sleep'
  | 'medication'
  | 'temperature'
  | 'growth'
  | 'milestone'
  | 'tummy_time'
  | 'bath'
  | 'symptom'
  | 'photo'
  | 'note';

export type BreastSide = 'left' | 'right' | 'both';
export type DiaperContents = 'wet' | 'dirty' | 'mixed' | 'dry';

/** A structural view of an event — EventRow from the DB satisfies this. */
export type EventLike = {
  type: string;
  started_at: string;
  ended_at?: string | null;
  amount_ml?: number | null;
  duration_seconds?: number | null;
  breast_side?: string | null;
  diaper_contents?: string | null;
  data?: unknown;
  note?: string | null;
};

// --- time -------------------------------------------------------------------

/** Whole seconds between two ISO timestamps (clamped at 0). */
export function computeDurationSeconds(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}

/** Seconds a still-running event has been going, relative to `now`. */
export function elapsedSeconds(startedAt: string, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000));
}

/** True when `endedAt` is at or after `startedAt`. Used to validate edits. */
export function isEndAfterStart(startedAt: string, endedAt: string): boolean {
  return new Date(endedAt).getTime() >= new Date(startedAt).getTime();
}

/** An ISO timestamp `minutes` before `now` — powers "15 min ago" quick offsets. */
export function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

/** "1h 40m" / "18 min" / "45s" — compact, for summaries and timers. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m} min`;
  return `${s}s`;
}

/** "2:14 pm" — 12-hour clock for timeline rows. */
export function formatClockTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'am' : 'pm';
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// --- timed events -----------------------------------------------------------

export type StartTimedOpts = { breastSide?: BreastSide; data?: Record<string, unknown> };

/** Fields for starting a timed event (feed / sleep / pump): open-ended timer. */
export function startTimedEvent(type: EventType, now: Date, opts: StartTimedOpts = {}) {
  return {
    type,
    started_at: now.toISOString(),
    ended_at: null as string | null,
    ...(opts.breastSide ? { breast_side: opts.breastSide } : {}),
    ...(opts.data ? { data: opts.data } : {}),
  };
}

/** Fields for stopping a timed event: end time + derived duration. */
export function stopTimedEvent(event: Pick<EventLike, 'started_at'>, now: Date) {
  const ended_at = now.toISOString();
  return { ended_at, duration_seconds: computeDurationSeconds(event.started_at, ended_at) };
}

// --- smart defaults ---------------------------------------------------------

/**
 * The side to pre-select for the next breast feed: the opposite of the most
 * recent breast feed. Defaults to 'left' with no history or after a 'both'.
 */
export function nextBreastSide(recentFeeds: EventLike[]): 'left' | 'right' {
  const last = recentFeeds
    .filter((e) => e.type === 'breast' && (e.breast_side === 'left' || e.breast_side === 'right'))
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  if (last?.breast_side === 'left') return 'right';
  if (last?.breast_side === 'right') return 'left';
  return 'left';
}

/**
 * Rolling median of recent bottle volumes (up to the last `sample`), rounded to
 * 5ml. Null when there's no history to suggest from.
 */
export function defaultBottleMl(recentBottles: EventLike[], sample = 10): number | null {
  const amounts = recentBottles
    .filter((e) => e.type === 'bottle' && typeof e.amount_ml === 'number' && e.amount_ml! > 0)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .slice(0, sample)
    .map((e) => e.amount_ml as number)
    .sort((a, b) => a - b);
  if (amounts.length === 0) return null;
  const mid = Math.floor(amounts.length / 2);
  const median =
    amounts.length % 2 === 0 ? (amounts[mid - 1]! + amounts[mid]!) / 2 : amounts[mid]!;
  return Math.round(median / 5) * 5;
}

// --- summaries --------------------------------------------------------------

function readData(event: EventLike): Record<string, unknown> {
  return event.data && typeof event.data === 'object' ? (event.data as Record<string, unknown>) : {};
}

const DIAPER_LABEL: Record<DiaperContents, string> = {
  wet: 'Wet diaper',
  dirty: 'Dirty diaper',
  mixed: 'Mixed diaper',
  dry: 'Dry diaper',
};

const SIDE_LABEL: Record<BreastSide, string> = {
  left: 'Left breast',
  right: 'Right breast',
  both: 'Both breasts',
};

/** One-line timeline summary for any event type. */
export function summarizeEvent(event: EventLike): string {
  const running = event.ended_at == null && event.duration_seconds == null;
  const dur = event.duration_seconds != null ? formatDuration(event.duration_seconds) : null;

  switch (event.type) {
    case 'breast': {
      const side = (event.breast_side as BreastSide) ?? null;
      const label = side ? SIDE_LABEL[side] : 'Breast';
      if (running) return `${label} · in progress`;
      return dur ? `${label} · ${dur}` : label;
    }
    case 'bottle': {
      const contents = readData(event).contents;
      const ml = event.amount_ml != null ? `${event.amount_ml} ml` : 'Bottle';
      return contents ? `${ml} · ${String(contents).replace('_', ' ')}` : `Bottle · ${ml}`;
    }
    case 'pump': {
      if (running) return 'Pumping · in progress';
      return event.amount_ml != null ? `Pumped · ${event.amount_ml} ml` : 'Pumped';
    }
    case 'diaper':
      return event.diaper_contents
        ? DIAPER_LABEL[event.diaper_contents as DiaperContents]
        : 'Diaper';
    case 'sleep':
      if (running) return 'Sleeping · in progress';
      return dur ? `Slept ${dur}` : 'Sleep';
    case 'solids': {
      const foods = readData(event).foods;
      return Array.isArray(foods) && foods.length > 0 ? `Solids · ${foods.join(', ')}` : 'Solids';
    }
    case 'medication': {
      const name = readData(event).name;
      return name ? `Medication · ${String(name)}` : 'Medication';
    }
    case 'temperature': {
      const t = readData(event).temp_c;
      return t != null ? `Temp ${t}°C` : 'Temperature';
    }
    case 'growth': {
      const d = readData(event);
      if (typeof d.weight_g === 'number') return `Weight ${(d.weight_g / 1000).toFixed(2)} kg`;
      if (typeof d.height_cm === 'number') return `Height ${d.height_cm} cm`;
      return 'Growth';
    }
    case 'milestone': {
      const label = readData(event).label;
      return label ? `Milestone · ${String(label)}` : 'Milestone';
    }
    case 'tummy_time':
      return dur ? `Tummy time · ${dur}` : 'Tummy time';
    case 'bath':
      return 'Bath';
    case 'symptom':
      return event.note ? `Symptom · ${event.note}` : 'Symptom';
    case 'photo':
      return 'Photo';
    case 'note':
      return event.note ?? 'Note';
    default:
      return event.type;
  }
}
