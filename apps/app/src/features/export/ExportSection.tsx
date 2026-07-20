import { eventsToCsv, exportFilename } from '@baby-bean/core';
import { observer } from '@legendapp/state/react';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { Pebble } from '@/components';
import { useActiveChild, useTimeline } from '@/features/logging/data';
import { Text, useTheme, View } from '@/theme';

import { saveCsv } from './saveCsv';

type RangeKey = 'week' | 'month' | 'all';

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: 'week', label: 'Last 7 days', days: 7 },
  { key: 'month', label: 'Last 30 days', days: 30 },
  { key: 'all', label: 'Everything', days: null },
];

/**
 * CSV export. The spec's "never lock data in" rule made concrete: every logged
 * event, in an open format, generated on-device from the local store — so it
 * works offline and needs no server.
 */
export const ExportSection = observer(function ExportSection() {
  const theme = useTheme();
  const child = useActiveChild();
  const timeline = useTimeline();
  const [range, setRange] = useState<RangeKey>('all');
  const [status, setStatus] = useState<string | null>(null);

  const days = RANGES.find((r) => r.key === range)?.days ?? null;

  const selected = useMemo(() => {
    if (days == null) return timeline;
    const cutoff = Date.now() - days * 86_400_000;
    return timeline.filter((e) => new Date(e.started_at).getTime() >= cutoff);
  }, [timeline, days]);

  const onExport = async () => {
    setStatus(null);
    const csv = eventsToCsv(selected, { tzOffsetMinutes: -new Date().getTimezoneOffset() });
    const filename = exportFilename(child?.name, new Date());
    const result = await saveCsv(filename, csv);
    setStatus(result.ok ? `Exported ${selected.length} entries as ${filename}` : result.message);
  };

  return (
    <View style={{ gap: theme.space.md }}>
      <Text variant="subtitle">Export</Text>
      <Text variant="body" color="inkSoft">
        Your data is yours. Download every entry as a spreadsheet — no account lock-in, works offline.
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        {RANGES.map((r) => {
          const active = range === r.key;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Export range: ${r.label}`}
              onPress={() => {
                setRange(r.key);
                setStatus(null);
              }}
              style={{
                minHeight: theme.size.tapMin,
                paddingHorizontal: theme.space.lg,
                justifyContent: 'center',
                borderRadius: theme.radius.pill,
                backgroundColor: active ? theme.color.primarySoft : theme.color.surfaceSunk,
                borderWidth: theme.size.hairline,
                borderColor: active ? theme.color.primary : theme.color.line,
              }}
            >
              <Text variant="body" style={{ color: active ? theme.color.primary : theme.color.ink }}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pebble
        label={selected.length === 0 ? 'Nothing to export yet' : `Export ${selected.length} entries (CSV)`}
        variant="secondary"
        disabled={selected.length === 0}
        onPress={onExport}
      />

      {status ? (
        <Text variant="caption" color="inkSoft">
          {status}
        </Text>
      ) : null}
    </View>
  );
});
