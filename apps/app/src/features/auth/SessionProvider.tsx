import { type HouseholdRow } from '@baby-bean/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Session, type User } from '@supabase/supabase-js';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from './supabaseClient';

const ACTIVE_HH_KEY = 'baby-bean.activeHouseholdId';

export type AuthResult = { error: string | null };

type SessionContextValue = {
  /** True until the initial session + households have loaded. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  households: HouseholdRow[];
  /** Null when signed out or before the user creates/joins a household. */
  activeHouseholdId: string | null;
  setActiveHousehold: (id: string) => void;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  createHousehold: (name: string) => Promise<AuthResult>;
  joinHousehold: (code: string) => Promise<AuthResult>;
  /** Re-fetch the user's households (after an external change). */
  refreshHouseholds: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [households, setHouseholds] = useState<HouseholdRow[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);

  const loadHouseholds = useCallback(async (): Promise<HouseholdRow[]> => {
    const { data, error } = await supabase.from('households').select('*').order('created_at');
    if (error) return [];
    setHouseholds(data);
    return data;
  }, []);

  const chooseActive = useCallback(async (list: HouseholdRow[]) => {
    if (list.length === 0) {
      setActiveHouseholdId(null);
      return;
    }
    const stored = await AsyncStorage.getItem(ACTIVE_HH_KEY);
    const match = stored && list.some((h) => h.id === stored) ? stored : list[0]!.id;
    setActiveHouseholdId(match);
  }, []);

  const refreshHouseholds = useCallback(async () => {
    const list = await loadHouseholds();
    await chooseActive(list);
  }, [loadHouseholds, chooseActive]);

  // Initial session + auth state subscription.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await refreshHouseholds();
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next) {
        await refreshHouseholds();
      } else {
        setHouseholds([]);
        setActiveHouseholdId(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshHouseholds]);

  const setActiveHousehold = useCallback((id: string) => {
    setActiveHouseholdId(id);
    void AsyncStorage.setItem(ACTIVE_HH_KEY, id);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session) {
      return { error: 'Check your email to confirm your account, then sign in.' };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(ACTIVE_HH_KEY);
  }, []);

  const createHousehold = useCallback(
    async (name: string): Promise<AuthResult> => {
      try {
        const { data, error } = await supabase.rpc('create_household', { name });
        if (error) return { error: error.message };
        const list = await loadHouseholds();
        if (data) {
          setActiveHousehold(data.id);
        } else {
          await chooseActive(list);
        }
        return { error: null };
      } catch (e) {
        return { error: messageOf(e) };
      }
    },
    [loadHouseholds, chooseActive, setActiveHousehold],
  );

  const joinHousehold = useCallback(
    async (code: string): Promise<AuthResult> => {
      try {
        const { data, error } = await supabase.rpc('accept_invite', { invite_code: code.trim() });
        if (error) return { error: error.message };
        const list = await loadHouseholds();
        if (data) {
          setActiveHousehold(data.id);
        } else {
          await chooseActive(list);
        }
        return { error: null };
      } catch (e) {
        return { error: messageOf(e) };
      }
    },
    [loadHouseholds, chooseActive, setActiveHousehold],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      households,
      activeHouseholdId,
      setActiveHousehold,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      createHousehold,
      joinHousehold,
      refreshHouseholds,
    }),
    [
      loading,
      session,
      households,
      activeHouseholdId,
      setActiveHousehold,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      createHousehold,
      joinHousehold,
      refreshHouseholds,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>.');
  return ctx;
}
