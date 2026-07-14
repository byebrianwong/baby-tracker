import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabaseClient';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'apple' | 'google';

/**
 * Sign in with Apple or Google via Supabase OAuth. Web uses the redirect flow;
 * native opens an auth session and sets the session from the returned tokens.
 *
 * NOTE: each provider must be enabled in the Supabase dashboard (Auth →
 * Providers) with the app's redirect URL for this to complete end to end.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<{ error: string | null }> {
  try {
    const redirectTo = makeRedirectUri({ scheme: 'babybean', path: 'auth-callback' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (error) return { error: error.message };

    if (Platform.OS !== 'web' && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        const fragment = result.url.includes('#') ? result.url.split('#')[1] : '';
        const params = new URLSearchParams(fragment);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
    }
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Sign-in failed. Please try again.' };
  }
}
