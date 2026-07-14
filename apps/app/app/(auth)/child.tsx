import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pebble } from '@/components';
import { Field } from '@/features/auth/Field';
import { useChildActions } from '@/state';
import { Text, useTheme, View } from '@/theme';

export default function AddChild() {
  const theme = useTheme();
  const { addChild } = useChildActions();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    setBusy(true);
    addChild({ name: name.trim() });
    // The route guard lands the app on Home once a child exists.
  };

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.space.xl, gap: theme.space.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: theme.space.xs, marginBottom: theme.space.md }}>
              <Text variant="title">Add your baby</Text>
              <Text variant="body" color="inkSoft">
                Just a name to start — you can add birth date, photo, and growth later.
              </Text>
            </View>

            <Field
              label="Baby's name"
              value={name}
              onChangeText={setName}
              placeholder="Sprout"
              autoCapitalize="words"
              onSubmitEditing={submit}
            />

            <Pebble label={busy ? 'Please wait…' : 'Start tracking'} disabled={busy || !name.trim()} onPress={submit} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
