import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pebble } from '@/components';
import { useSession } from '@/features/auth';
import { Text, type ThemePreference, useTheme, useThemeMode, View } from '@/theme';

const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'dark', label: 'Dark' },
  { key: 'night', label: 'Night feed' },
  { key: 'system', label: 'System' },
];

export default function More() {
  const theme = useTheme();
  const { preference, setPreference } = useThemeMode();
  const { households, activeHouseholdId, signOut } = useSession();
  const householdName = households.find((h) => h.id === activeHouseholdId)?.name ?? '—';

  return (
    <View bg="paper" style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.xl }}>
          <Text variant="title">More</Text>

          <View style={{ gap: theme.space.md }}>
            <Text variant="subtitle">Appearance</Text>
            <Text variant="body" color="inkSoft">
              Night feed mode is ultra-dim and amber for one-handed logging in a dark nursery.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
              {THEME_OPTIONS.map((o) => {
                const active = preference === o.key;
                return (
                  <Pressable
                    key={o.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPreference(o.key)}
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
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: theme.space.sm }}>
            <Text variant="subtitle">Household</Text>
            <Text variant="body" color="inkSoft">
              {householdName}
            </Text>
          </View>

          <Pebble label="Sign out" variant="secondary" onPress={signOut} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
