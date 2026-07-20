import { describe, expect, it } from 'vitest';

import { csvEscape, eventsToCsv, type ExportEvent,exportFilename, localParts, toCsv } from './export';

const ev = (over: Partial<ExportEvent> & Pick<ExportEvent, 'type' | 'started_at'>): ExportEvent => ({
  id: 'e1',
  ...over,
});

describe('csvEscape', () => {
  it('quotes strings and doubles inner quotes', () => {
    expect(csvEscape('plain')).toBe('"plain"');
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('emits numbers unquoted and blanks nullish', () => {
    expect(csvEscape(120)).toBe('120');
    expect(csvEscape(-5)).toBe('-5');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('defuses spreadsheet formula injection in text cells', () => {
    expect(csvEscape('=SUM(A1)')).toBe(`"'=SUM(A1)"`);
    expect(csvEscape('+1 more')).toBe(`"'+1 more"`);
    expect(csvEscape('@here')).toBe(`"'@here"`);
    expect(csvEscape('-2 oz left')).toBe(`"'-2 oz left"`);
  });

  it('preserves newlines inside a quoted cell', () => {
    expect(csvEscape('two\nlines')).toBe('"two\nlines"');
  });
});

describe('toCsv', () => {
  it('writes a header and CRLF-terminated rows', () => {
    const csv = toCsv(['a', 'b'], [[1, 'x']]);
    expect(csv).toBe('a,b\r\n1,"x"\r\n');
  });
});

describe('localParts', () => {
  it('shifts an instant into local time', () => {
    expect(localParts('2026-07-20T09:14:00.000Z', -420)).toEqual({ date: '2026-07-20', time: '02:14' });
  });

  it('rolls the date backwards across midnight', () => {
    expect(localParts('2026-07-20T03:30:00.000Z', -420)).toEqual({ date: '2026-07-19', time: '20:30' });
  });

  it('returns null for an unparseable timestamp', () => {
    expect(localParts('not-a-date')).toBeNull();
  });
});

describe('eventsToCsv', () => {
  it('orders oldest first regardless of input order', () => {
    const csv = eventsToCsv([
      ev({ id: 'b', type: 'diaper', started_at: '2026-07-20T10:00:00.000Z' }),
      ev({ id: 'a', type: 'bottle', started_at: '2026-07-20T08:00:00.000Z' }),
    ]);
    const [, first, second] = csv.trim().split('\r\n');
    expect(first).toContain('"a"');
    expect(second).toContain('"b"');
  });

  it('omits soft-deleted rows', () => {
    const csv = eventsToCsv([
      ev({ id: 'gone', type: 'bottle', started_at: '2026-07-20T08:00:00.000Z', deleted_at: '2026-07-20T09:00:00.000Z' }),
    ]);
    expect(csv.trim().split('\r\n')).toHaveLength(1); // header only
  });

  it('derives duration from start/end when duration_seconds is absent', () => {
    const csv = eventsToCsv([
      ev({
        type: 'sleep',
        started_at: '2026-07-20T08:00:00.000Z',
        ended_at: '2026-07-20T09:40:00.000Z',
      }),
    ]);
    expect(csv).toContain(',6000,');
    expect(csv).toContain('"1h 40m"');
  });

  it('serializes the jsonb blob and skips it when empty', () => {
    const withData = eventsToCsv([ev({ type: 'growth', started_at: '2026-07-20T08:00:00.000Z', data: { weight_g: 4200 } })]);
    expect(withData).toContain('"{""weight_g"":4200}"');

    const withoutData = eventsToCsv([ev({ type: 'note', started_at: '2026-07-20T08:00:00.000Z', data: {} })]);
    expect(withoutData.trim().split('\r\n')[1]?.endsWith(',')).toBe(true);
  });

  it('always emits the header, even with no events', () => {
    expect(eventsToCsv([])).toBe(
      'id,type,local_date,local_start,local_end,started_at_utc,ended_at_utc,duration_seconds,duration,amount_ml,breast_side,diaper_contents,note,details\r\n',
    );
  });
});

describe('exportFilename', () => {
  it('slugs the baby name into a dated filename', () => {
    expect(exportFilename('Eve', new Date(2026, 6, 20))).toBe('baby-bean-eve-2026-07-20.csv');
    expect(exportFilename('Mary-Jane 2', new Date(2026, 6, 20))).toBe('baby-bean-mary-jane-2-2026-07-20.csv');
  });

  it('drops the name segment when there is no usable name', () => {
    expect(exportFilename(null, new Date(2026, 6, 20))).toBe('baby-bean-2026-07-20.csv');
    expect(exportFilename('🍼', new Date(2026, 6, 20))).toBe('baby-bean-2026-07-20.csv');
  });
});
