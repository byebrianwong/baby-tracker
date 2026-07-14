import { createBabyBeanClient } from '@baby-bean/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

/**
 * The app's Supabase client, scoped to the `baby_bean` schema and configured to
 * persist the auth session.
 *
 * Session storage uses AsyncStorage (works on native + web) rather than
 * expo-secure-store: a full Supabase session can exceed SecureStore's 2KB
 * per-key limit, and AsyncStorage is Supabase's documented RN approach.
 */
export const supabase = createBabyBeanClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web, Supabase reads the OAuth redirect fragment from the URL.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Keep tokens fresh while the app is foregrounded (native only).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
