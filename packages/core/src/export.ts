/**
 * CSV export — "never lock data in" (spec §12).
 *
 * Pure text generation over plain event shapes: no React, no file system, no
 * platform APIs. The app layer decides how to hand the string to the user
 * (browser download, share sheet, file write); this module decides what the
 * bytes say.
 *
 * Output targets both humans and machines: ISO timestamps for re-import, plus
 * local date/time and a readable duration so a parent can open it in Numbers or
 * Excel and understand a night at a glance.
 */

import { type EventLike,formatDuration } from './events';

/** An event as it appears in an export — `EventLike` plus its identity fields. */
export type ExportEvent = EventLike & {
  id?: string | null;
  created_at?: string | null;
  deleted_at?: string | null;
};

export type CsvExportOptions = {
  /**
   * Minutes to add to UTC to reach the reader's local time, i.e.
   * `-new Date().getTimezoneOffset()`. Defaults to 0 (UTC) so the function
   * stays deterministic in tests.
   */
  tzOffsetMinutes?: number;
};

export const CSV_COLUMNS = [
  'id',
  'type',
  'local_date',
  'local_start',
  'local_end',
  'started_at_utc',
  'ended_at_utc',
  'duration_seconds',
  'duration',
  'amount_ml',
  'breast_side',
  'diaper_contents',
  'note',
  'details',
] as const;

/**
 * Escape one value for RFC 4180.
 *
 * Also defuses spreadsheet formula injection: a text cell that starts with
 * `= + - @` (or a control character) is prefixed with a single quote, so a note
 * typed as `=cmd|...` lands in Excel as text rather than an executed formula.
 * Numbers are emitted unquoted and untouched, so negative amounts are safe.
 */
export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';

  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** Join a header + rows into CSV text. CRLF line endings, as Excel expects. */
export function toCsv(header: readonly string[], rows: readonly (string | number | null | undefined)[][]): string {
  const lines = [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))];
  return lines.join('\r\n') + '\r\n';
}

/** `{ date: '2026-07-20', time: '02:14' }` for an ISO instant at a UTC offset. */
export function localParts(iso: string, tzOffsetMinutes = 0): { date: string; time: string } | null {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  // Shift the instant, then read it with UTC getters — no Intl, no host tz.
  const d = new Date(ms + tzOffsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

/**
 * Every non-deleted event as CSV, oldest first (the order a parent reads a log
 * in). Deleted rows are dropped: undo means they never happened.
 */
export function eventsToCsv(events: readonly ExportEvent[], opts: CsvExportOptions = {}): string {
  const tz = opts.tzOffsetMinutes ?? 0;

  const rows = events
    .filter((e) => !e.deleted_at)
    .slice()
    .sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)))
    .map((e) => {
      const start = localParts(e.started_at, tz);
      const end = e.ended_at ? localParts(e.ended_at, tz) : null;
      const seconds =
        e.duration_seconds ??
        (e.ended_at
          ? Math.max(0, Math.round((new Date(e.ended_at).getTime() - new Date(e.started_at).getTime()) / 1000))
          : null);
      const details = e.data && Object.keys(e.data as object).length > 0 ? JSON.stringify(e.data) : null;

      return [
        e.id ?? null,
        e.type,
        start?.date ?? null,
        start?.time ?? null,
        end?.time ?? null,
        e.started_at,
        e.ended_at ?? null,
        seconds,
        seconds != null ? formatDuration(seconds) : null,
        e.amount_ml ?? null,
        e.breast_side ?? null,
        e.diaper_contents ?? null,
        e.note ?? null,
        details,
      ];
    });

  return toCsv(CSV_COLUMNS, rows);
}

/** `baby-bean-eve-2026-07-20.csv` — safe on every filesystem. */
export function exportFilename(babyName: string | null | undefined, now: Date): string {
  const slug = (babyName ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return ['baby-bean', slug, date].filter(Boolean).join('-') + '.csv';
}
