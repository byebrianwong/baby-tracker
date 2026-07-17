/**
 * Daily and range summaries — pure aggregation over events for the Insights
 * surface. Plain, glanceable numbers; UI only renders.
 */
import { computeDurationSeconds, type DiaperContents, type EventLike } from './events';

export type DaySummary = {
  feeds: number;
  /** Total bottle/pump volume logged (ml). */
  volumeMl: number;
  diapers: number;
  diaperBreakdown: Record<DiaperContents, number>;
  /** Total sleep across the range, in seconds (completed sleeps only). */
  sleepSeconds: number;
  /** Longest single sleep stretch, in seconds. */
  longestSleepSeconds: number;
  naps: number;
};

function inRange(e: EventLike, fromISO: string, toISO: string): boolean {
  return e.started_at >= fromISO && e.started_at < toISO;
}

function sleepSeconds(e: EventLike): number {
  if (e.duration_seconds != null) return e.duration_seconds;
  if (e.ended_at) return computeDurationSeconds(e.started_at, e.ended_at);
  return 0;
}

/** Summarize the events whose start falls in [fromISO, toISO). */
export function summarizeRange(events: EventLike[], fromISO: string, toISO: string): DaySummary {
  const diaperBreakdown: Record<DiaperContents, number> = { wet: 0, dirty: 0, mixed: 0, dry: 0 };
  let feeds = 0;
  let volumeMl = 0;
  let diapers = 0;
  let sleepTotal = 0;
  let longest = 0;
  let naps = 0;

  for (const e of events) {
    if (!inRange(e, fromISO, toISO)) continue;
    switch (e.type) {
      case 'breast':
      case 'bottle':
        feeds += 1;
        if (typeof e.amount_ml === 'number') volumeMl += e.amount_ml;
        break;
      case 'pump':
        if (typeof e.amount_ml === 'number') volumeMl += e.amount_ml;
        break;
      case 'diaper': {
        diapers += 1;
        const c = e.diaper_contents as DiaperContents | null;
        if (c && c in diaperBreakdown) diaperBreakdown[c] += 1;
        break;
      }
      case 'sleep': {
        const s = sleepSeconds(e);
        if (s > 0) {
          sleepTotal += s;
          naps += 1;
          if (s > longest) longest = s;
        }
        break;
      }
    }
  }

  return {
    feeds,
    volumeMl,
    diapers,
    diaperBreakdown,
    sleepSeconds: sleepTotal,
    longestSleepSeconds: longest,
    naps,
  };
}

/** Start (inclusive) and end (exclusive) ISO bounds for the local day containing `d`. */
export function dayBounds(d: Date): { fromISO: string; toISO: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return { fromISO: start.toISOString(), toISO: end.toISOString() };
}
