import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type ReactNode, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/features/auth';
import { useHasChild } from '@/state';
import { Text, ThemeProvider, useLoadFonts, useTheme, View } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout. Loads fonts, then wraps the app in the theme system and the
 * session/auth guard. The tab shell itself is P0-7.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useLoadFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false }} />
            </AuthGate>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Route guard. Redirects based on auth + household state. `dev/*` preview routes
 * are exempt so the theme/component galleries stay reachable during the build.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { loading, session, activeHouseholdId, devLocal } = useSession();
  const hasChild = useHasChild();
  const segments = useSegments();
  const router = useRouter();
  const authed = session != null || devLocal;

  useEffect(() => {
    if (loading) return;
    const first = segments[0];
    const inAuthGroup = first === '(auth)';
    const inDev = first === 'dev';
    if (inDev) return;

    if (!authed && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (authed && !activeHouseholdId && segments[1] !== 'household') {
      router.replace('/(auth)/household');
    } else if (authed && activeHouseholdId && !hasChild && segments[1] !== 'child') {
      router.replace('/(auth)/child');
    } else if (authed && activeHouseholdId && hasChild && inAuthGroup) {
      router.replace('/');
    }
  }, [loading, authed, activeHouseholdId, hasChild, segments, router]);

  if (loading) return <LoadingScreen />;
  return <>{children}</>;
}

function LoadingScreen() {
  const theme = useTheme();
  return (
    <View bg="paper" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space.md }}>
      <ActivityIndicator color={theme.color.primary} />
      <Text variant="body" color="inkSoft">
        Loading…
      </Text>
    </View>
  );
}
