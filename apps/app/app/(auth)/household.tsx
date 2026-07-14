import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pebble } from '@/components';
import { useSession } from '@/features/auth';
import { Field } from '@/features/auth/Field';
import { Text, useTheme, View } from '@/theme';

type Tab = 'create' | 'join';

export default function Household() {
  const theme = useTheme();
  const { createHousehold, joinHousehold, signOut } = useSession();
  const [tab, setTab] = useState<Tab>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: err } =
      tab === 'create' ? await createHousehold(name.trim()) : await joinHousehold(code);
    if (err) setError(err);
    setBusy(false);
    // On success the SessionProvider sets activeHouseholdId → the guard lands the app.
  };

  const valid = tab === 'create' ? name.trim().length > 0 : code.trim().length > 0;

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.space.xl, gap: theme.space.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: theme.space.xs, marginBottom: theme.space.md }}>
              <Text variant="title">One last thing</Text>
              <Text variant="body" color="inkSoft">
                A household is the shared space you and other caregivers log into together.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <TabButton label="Create" active={tab === 'create'} onPress={() => setTab('create')} />
              <TabButton label="Join" active={tab === 'join'} onPress={() => setTab('join')} />
            </View>

            {tab === 'create' ? (
              <Field label="Household name" value={name} onChangeText={setName} placeholder="The Bean House" onSubmitEditing={submit} />
            ) : (
              <Field
                label="Invite code"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                placeholder="ABC123"
                onSubmitEditing={submit}
              />
            )}

            {error ? (
              <Text variant="body" color="health" accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Pebble
              label={busy ? 'Please wait…' : tab === 'create' ? 'Create household' : 'Join household'}
              disabled={busy || !valid}
              onPress={submit}
            />

            <Pressable
              accessibilityRole="button"
              onPress={signOut}
              style={{ minHeight: theme.size.tapMin, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text variant="body" color="inkSoft">
                Sign out
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: theme.size.tapMin,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.pill,
        backgroundColor: active ? theme.color.primarySoft : theme.color.surfaceSunk,
        borderWidth: theme.size.hairline,
        borderColor: active ? theme.color.primary : theme.color.line,
      }}
    >
      <Text variant="body" style={{ color: active ? theme.color.primary : theme.color.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
