import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout. A bare Stack for the Phase 0 scaffold — the real tab shell
 * (Home / Insights / Baby / More) and ThemeProvider are built in P0-3 and P0-7.
 */
export default function RootLayout() {
  useEffect(() => {
    // Nothing to load yet; hide the splash immediately. Fonts + theme land in P0-3.
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
