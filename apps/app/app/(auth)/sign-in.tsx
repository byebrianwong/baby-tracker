import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pebble } from '@/components';
import { signInWithProvider, useSession } from '@/features/auth';
import { Field } from '@/features/auth/Field';
import { Text, useTheme, View } from '@/theme';

type Mode = 'signIn' | 'signUp';

export default function SignIn() {
  const theme = useTheme();
  const { signInWithPassword, signUpWithPassword } = useSession();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const fn = mode === 'signIn' ? signInWithPassword : signUpWithPassword;
    const { error: err } = await fn(email.trim(), password);
    if (err) setError(err);
    setBusy(false);
    // On success the SessionProvider updates and the route guard redirects.
  };

  const oauth = async (provider: 'apple' | 'google') => {
    setBusy(true);
    setError(null);
    const { error: err } = await signInWithProvider(provider);
    if (err) setError(err);
    setBusy(false);
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
              <Text variant="display">Baby Bean</Text>
              <Text variant="body" color="inkSoft">
                {mode === 'signIn' ? 'Welcome back.' : 'Create your account.'}
              </Text>
            </View>

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              onSubmitEditing={submit}
            />

            {error ? (
              <Text variant="body" color="health" accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Pebble
              label={busy ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Create account'}
              disabled={busy || !email || !password}
              onPress={submit}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
              <View style={{ flex: 1, height: theme.size.hairline, backgroundColor: theme.color.line }} />
              <Text variant="caption" color="inkSoft">
                or
              </Text>
              <View style={{ flex: 1, height: theme.size.hairline, backgroundColor: theme.color.line }} />
            </View>

            <View style={{ gap: theme.space.sm }}>
              <Pebble label="Continue with Apple" variant="secondary" disabled={busy} onPress={() => oauth('apple')} />
              <Pebble label="Continue with Google" variant="secondary" disabled={busy} onPress={() => oauth('google')} />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
                setError(null);
              }}
              style={{ minHeight: theme.size.tapMin, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text variant="body" color="primary">
                {mode === 'signIn' ? 'New here? Create an account' : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
