import { withAlpha } from '@baby-bean/core';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AccentName, Text, type ThemePreference, useTheme, useThemeMode, View } from '@/theme';

const MODES: { key: ThemePreference; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'dark', label: 'Dark' },
  { key: 'night', label: 'Night' },
  { key: 'system', label: 'System' },
];

const ACCENTS: AccentName[] = ['feed', 'sleep', 'diaper', 'pump', 'solids', 'health', 'growth'];

export default function ThemePreview() {
  const theme = useTheme();
  const { mode, preference, isNight, setPreference, dimLevel, escalateDim, resetDim } =
    useThemeMode();

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.xl }}>
          <View style={{ gap: theme.space.xs }}>
            <Text variant="title">Theme preview</Text>
            <Text variant="body" color="inkSoft">
              Same layout, three modes. Active: {mode} (preference: {preference}).
            </Text>
          </View>

          {/* Mode switcher */}
          <View style={[styles.row, { gap: theme.space.md }]}>
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
                    borderWidth: theme.size.hairline,
                    borderColor: theme.color.line,
                  }}
                >
                  <Text variant="body" style={{ color: active ? theme.color.paper : theme.color.ink }}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Neutrals */}
          <Section title="Neutrals">
            <View style={[styles.row, { gap: theme.space.md }]}>
              <Swatch label="paper" color={theme.color.paper} />
              <Swatch label="surface" color={theme.color.surface} />
              <Swatch label="sunk" color={theme.color.surfaceSunk} />
              <Swatch label="line" color={theme.color.line} />
              <Swatch label="ink" color={theme.color.ink} />
              <Swatch label="inkSoft" color={theme.color.inkSoft} />
              <Swatch label="primary" color={theme.color.primary} />
              <Swatch label="prim.soft" color={theme.color.primarySoft} />
            </View>
          </Section>

          {/* Category accents + soft tints */}
          <Section title="Category accents">
            <View style={[styles.row, { gap: theme.space.md }]}>
              {ACCENTS.map((a) => (
                <View key={a} style={{ alignItems: 'center', gap: theme.space.xs, width: 72 }}>
                  <View
                    style={{
                      width: theme.size.tapMin,
                      height: theme.size.tapMin,
                      borderRadius: theme.radius.pill,
                      backgroundColor: theme.color.accentSoft[a],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: theme.space.lg,
                        height: theme.space.lg,
                        borderRadius: theme.radius.pill,
                        backgroundColor: theme.color.accent[a],
                      }}
                    />
                  </View>
                  <Text variant="caption" color="inkSoft">
                    {a}
                  </Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Type ramp */}
          <Section title="Type">
            <Text variant="display">Display 40</Text>
            <Text variant="title">Title 28</Text>
            <Text variant="subtitle">Subtitle 20</Text>
            <Text variant="bodyLarge">Body large 16 — Hanken Grotesk.</Text>
            <Text variant="body" color="inkSoft">
              Body 14 secondary — calm, warm, sentence case.
            </Text>
            <Text variant="caption" color="inkSoft">
              CAPTION 12
            </Text>
            <Text variant="mono">02:14:53 · 1234567890</Text>
          </Section>

          {/* Elevation */}
          <Section title="Elevation">
            <View
              bg="surface"
              radius="lg"
              padding="lg"
              elevated
              style={{ borderWidth: theme.size.hairline, borderColor: theme.color.line }}
            >
              <Text variant="body">Soft diffuse shadow on a surface card.</Text>
            </View>
          </Section>

          {/* Night dimming plumbing */}
          <Section title="Night feed dimming">
            <Text variant="body" color="inkSoft">
              Plumbing only (spec §9.4). Dim level: {dimLevel.toFixed(2)}
            </Text>
            <View style={[styles.row, { gap: theme.space.md }]}>
              <Pressable
                accessibilityRole="button"
                onPress={escalateDim}
                style={{
                  minHeight: theme.size.tapMin,
                  paddingHorizontal: theme.space.lg,
                  justifyContent: 'center',
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.accentSoft.sleep,
                }}
              >
                <Text variant="body">Escalate dim</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={resetDim}
                style={{
                  minHeight: theme.size.tapMin,
                  paddingHorizontal: theme.space.lg,
                  justifyContent: 'center',
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.surfaceSunk,
                }}
              >
                <Text variant="body">Reset</Text>
              </Pressable>
            </View>
            {!isNight && (
              <Text variant="caption" color="inkSoft">
                Tip: switch to Night to see this in context.
              </Text>
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>

      {/* Dim scrim — the affordance the night timer escalates after inactivity. */}
      {dimLevel > 0 && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha('#000000', dimLevel) }]}
        />
      )}
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

function Swatch({ label, color }: { label: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: theme.space.xs, width: 64 }}>
      <View
        style={{
          width: theme.size.tapMin,
          height: theme.size.tapMin,
          borderRadius: theme.radius.md,
          backgroundColor: color,
          borderWidth: theme.size.hairline,
          borderColor: theme.color.line,
        }}
      />
      <Text variant="caption" color="inkSoft">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
