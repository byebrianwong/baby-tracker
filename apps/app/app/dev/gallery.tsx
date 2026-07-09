import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Icon,
  type IconName,
  Pebble,
  Sheet,
  SheetOption,
  StatusStat,
  Stepper,
  TimelineRow,
  TimeStepper,
  UndoBar,
} from '@/components';
import { Text, type ThemePreference, useTheme, useThemeMode, View } from '@/theme';

const MODES: { key: ThemePreference; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'dark', label: 'Dark' },
  { key: 'night', label: 'Night' },
  { key: 'system', label: 'System' },
];

const ICONS: IconName[] = [
  'feed',
  'sleep',
  'diaper',
  'pump',
  'solids',
  'health',
  'growth',
  'clock',
  'plus',
  'close',
  'undo',
  'chevronRight',
  'note',
];

export default function Gallery() {
  const theme = useTheme();
  const { preference, setPreference } = useThemeMode();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const [ml, setMl] = useState(90);
  const [when, setWhen] = useState(new Date(2026, 6, 9, 14, 14));

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.xl }}>
          <Text variant="title">Component gallery</Text>

          {/* Mode switch */}
          <View style={[styles.row, { gap: theme.space.sm }]}>
            {MODES.map((m) => {
              const active = preference === m.key;
              return (
                <Pressable
                  key={m.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setPreference(m.key)}
                  style={{
                    minHeight: theme.size.tapMin,
                    paddingHorizontal: theme.space.lg,
                    justifyContent: 'center',
                    borderRadius: theme.radius.pill,
                    backgroundColor: active ? theme.color.primary : theme.color.surfaceSunk,
                  }}
                >
                  <Text variant="body" style={{ color: active ? theme.color.paper : theme.color.ink }}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Section title="Pebble — primary (category-colored)">
            <View style={[styles.row, { gap: theme.space.md }]}>
              <Pebble label="Feed" category="feed" iconLeft={<Icon name="feed" size={theme.space.xl} color={theme.color.ink} />} onPress={() => {}} />
              <Pebble label="Diaper" category="diaper" iconLeft={<Icon name="diaper" size={theme.space.xl} color={theme.color.ink} />} onPress={() => {}} />
              <Pebble label="Sleep" category="sleep" iconLeft={<Icon name="sleep" size={theme.space.xl} color={theme.color.paper} />} onPress={() => {}} />
              <Pebble label="Pump" category="pump" iconLeft={<Icon name="pump" size={theme.space.xl} color={theme.color.ink} />} onPress={() => {}} />
            </View>
          </Section>

          <Section title="Pebble — variants">
            <View style={[styles.row, { gap: theme.space.md }]}>
              <Pebble label="Primary" onPress={() => {}} />
              <Pebble label="Secondary" variant="secondary" onPress={() => {}} />
              <Pebble label="Ghost" variant="ghost" onPress={() => {}} />
              <Pebble label="Disabled" variant="secondary" disabled onPress={() => {}} />
            </View>
          </Section>

          <Section title="StatusStat">
            <View style={[styles.row, { gap: theme.space.xxl }]}>
              <StatusStat label="since last feed" value="2h 10m" accent="feed" />
              <StatusStat label="since last diaper" value="45m" accent="diaper" />
              <StatusStat label="asleep for" value="1h 05m" accent="sleep" sublabel="down at 1:10 pm" />
            </View>
          </Section>

          <Section title="TimelineRow (swipe the first row)">
            <View bg="surface" radius="lg" style={{ overflow: 'hidden', borderWidth: theme.size.hairline, borderColor: theme.color.line }}>
              <TimelineRow
                accent="feed"
                icon="feed"
                time="2:14 pm"
                title="Left breast · 18 min"
                right={<Icon name="chevronRight" size={theme.space.xl} color={theme.color.inkSoft} />}
                onPress={() => {}}
                renderRightActions={() => (
                  <RNView style={{ flexDirection: 'row' }}>
                    <SwipeAction label="Undo" bg={theme.color.primarySoft} fg={theme.color.primary} icon="undo" />
                    <SwipeAction label="Delete" bg={theme.color.accentSoft.health} fg={theme.color.accent.health} icon="close" />
                  </RNView>
                )}
              />
              <Divider />
              <TimelineRow accent="diaper" icon="diaper" time="1:32 pm" title="Wet diaper" onPress={() => {}} />
              <Divider />
              <TimelineRow accent="sleep" icon="sleep" time="11:20 am" title="Nap · 1h 40m" onPress={() => {}} />
            </View>
          </Section>

          <Section title="Sheet + Stepper + TimeStepper">
            <Pebble label="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
            <Text variant="caption" color="inkSoft">
              Bottle amount
            </Text>
            <Stepper value={ml} onChange={setMl} step={10} unit="ml" quickPicks={[{ label: '60', value: 60 }, { label: '90', value: 90 }, { label: '120', value: 120 }]} />
            <Text variant="caption" color="inkSoft">
              When
            </Text>
            <TimeStepper value={when} onChange={setWhen} />
          </Section>

          <Section title="Icons (2px rounded line)">
            <View style={[styles.row, { gap: theme.space.lg }]}>
              {ICONS.map((n) => (
                <View key={n} style={{ alignItems: 'center', gap: theme.space.xs, width: 56 }}>
                  <Icon name={n} />
                  <Text variant="caption" color="inkSoft">
                    {n}
                  </Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="UndoBar">
            <Pebble label="Log something (show undo)" variant="secondary" onPress={() => setUndoOpen(true)} />
          </Section>

          <RNView style={{ height: theme.size.pebblePrimary }} />
        </ScrollView>
      </SafeAreaView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Log diaper">
        <SheetOption label="Wet" category="diaper" iconLeft={<Icon name="diaper" color={theme.color.accent.diaper} />} onPress={() => setSheetOpen(false)} />
        <SheetOption label="Dirty" category="solids" iconLeft={<Icon name="diaper" color={theme.color.accent.solids} />} onPress={() => setSheetOpen(false)} />
        <SheetOption label="Mixed" category="feed" iconLeft={<Icon name="diaper" color={theme.color.accent.feed} />} onPress={() => setSheetOpen(false)} />
      </Sheet>

      <UndoBar
        visible={undoOpen}
        message="Logged wet diaper"
        onAction={() => setUndoOpen(false)}
        onDismiss={() => setUndoOpen(false)}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.md }}>
      <Text variant="subtitle">{title}</Text>
      {children}
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <RNView style={{ height: theme.size.hairline, backgroundColor: theme.color.line }} />;
}

function SwipeAction({ label, bg, fg, icon }: { label: string; bg: string; fg: string; icon: IconName }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: theme.size.pebblePrimary + theme.space.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space.xs,
        backgroundColor: bg,
      }}
    >
      <Icon name={icon} color={fg} />
      <Text variant="caption" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
