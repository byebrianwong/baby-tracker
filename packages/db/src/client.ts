import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';

import type { Database } from './types';

/** A Supabase client typed to Baby Bean's `baby_bean` schema. */
export type BabyBeanClient = SupabaseClient<Database, 'baby_bean'>;

export type CreateClientArgs = {
  url: string;
  anonKey: string;
  /** Platform auth options (e.g. AsyncStorage/SecureStore on native). Wired in P0-5. */
  auth?: SupabaseClientOptions<'baby_bean'>['auth'];
  global?: SupabaseClientOptions<'baby_bean'>['global'];
};

/**
 * Create a typed Supabase client scoped to the `baby_bean` schema. All queries
 * (`.from('events')` etc.) target that schema by default, keeping Baby Bean
 * fully isolated from the `public` tables the shared project also hosts.
 */
export function createBabyBeanClient({ url, anonKey, auth, global }: CreateClientArgs): BabyBeanClient {
  if (!url || !anonKey) {
    throw new Error(
      'createBabyBeanClient: missing Supabase url / anon key. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return createClient<Database, 'baby_bean'>(url, anonKey, {
    db: { schema: 'baby_bean' },
    auth,
    global,
  });
}

/**
 * Convenience factory that reads `EXPO_PUBLIC_SUPABASE_URL` /
 * `EXPO_PUBLIC_SUPABASE_ANON_KEY` from the environment. The app passes explicit
 * options in P0-5 to add platform-specific auth storage; this is for scripts
 * and simple cases.
 */
export function createBabyBeanClientFromEnv(
  extra?: Omit<CreateClientArgs, 'url' | 'anonKey'>,
): BabyBeanClient {
  return createBabyBeanClient({
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ...extra,
  });
}
