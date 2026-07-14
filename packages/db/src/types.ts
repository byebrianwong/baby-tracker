/**
 * Database types for the `baby_bean` schema.
 *
 * Hand-authored from `supabase/migrations/0001_init.sql` so the app is fully
 * typed before the schema is applied to the shared project. Once applied, run
 * `pnpm --filter @baby-bean/db gen:types` to regenerate from the live schema
 * (`src/types.gen.ts`) and switch `index.ts` to export that instead.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Role = 'parent' | 'caregiver' | 'viewer';
export type EventType =
  | 'breast'
  | 'bottle'
  | 'solids'
  | 'pump'
  | 'diaper'
  | 'sleep'
  | 'medication'
  | 'temperature'
  | 'growth'
  | 'milestone'
  | 'tummy_time'
  | 'bath'
  | 'symptom'
  | 'photo'
  | 'note';
export type BreastSide = 'left' | 'right' | 'both';
export type DiaperContents = 'wet' | 'dirty' | 'mixed' | 'dry';
export type StorageLocation = 'fridge' | 'freezer';
export type ReminderKind = 'medication' | 'feed' | 'pump' | 'custom';

export type Database = {
  baby_bean: {
    Tables: {
      households: {
        Row: { id: string; name: string; created_at: string; created_by: string | null };
        Insert: { id?: string; name: string; created_at?: string; created_by?: string | null };
        Update: { id?: string; name?: string; created_at?: string; created_by?: string | null };
        Relationships: [];
      };
      household_members: {
        Row: { household_id: string; user_id: string; role: Role; created_at: string };
        Insert: { household_id: string; user_id: string; role?: Role; created_at?: string };
        Update: { household_id?: string; user_id?: string; role?: Role; created_at?: string };
        Relationships: [];
      };
      household_invites: {
        Row: {
          id: string;
          household_id: string;
          code: string;
          role: Role;
          expires_at: string | null;
          accepted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          code: string;
          role?: Role;
          expires_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          code?: string;
          role?: Role;
          expires_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          dob: string | null;
          sex: string | null;
          photo_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          dob?: string | null;
          sex?: string | null;
          photo_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          dob?: string | null;
          sex?: string | null;
          photo_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          child_id: string;
          household_id: string;
          type: EventType;
          started_at: string;
          ended_at: string | null;
          amount_ml: number | null;
          duration_seconds: number | null;
          breast_side: BreastSide | null;
          diaper_contents: DiaperContents | null;
          data: Json;
          note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        // household_id is derived by the events_set_household trigger, so it is
        // optional on insert even though the column is NOT NULL.
        Insert: {
          id?: string;
          child_id: string;
          household_id?: string;
          type: EventType;
          started_at?: string;
          ended_at?: string | null;
          amount_ml?: number | null;
          duration_seconds?: number | null;
          breast_side?: BreastSide | null;
          diaper_contents?: DiaperContents | null;
          data?: Json;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          child_id?: string;
          household_id?: string;
          type?: EventType;
          started_at?: string;
          ended_at?: string | null;
          amount_ml?: number | null;
          duration_seconds?: number | null;
          breast_side?: BreastSide | null;
          diaper_contents?: DiaperContents | null;
          data?: Json;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      milk_inventory: {
        Row: {
          id: string;
          household_id: string;
          volume_ml: number;
          pumped_at: string;
          storage: StorageLocation;
          used_at: string | null;
          discarded: boolean;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          volume_ml: number;
          pumped_at?: string;
          storage?: StorageLocation;
          used_at?: string | null;
          discarded?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          volume_ml?: number;
          pumped_at?: string;
          storage?: StorageLocation;
          used_at?: string | null;
          discarded?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          household_id: string;
          child_id: string | null;
          kind: ReminderKind;
          schedule: Json;
          next_fire_at: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          child_id?: string | null;
          kind: ReminderKind;
          schedule?: Json;
          next_fire_at?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          child_id?: string | null;
          kind?: ReminderKind;
          schedule?: Json;
          next_fire_at?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_household: {
        Args: { name: string };
        Returns: Database['baby_bean']['Tables']['households']['Row'];
      };
      accept_invite: {
        Args: { invite_code: string };
        Returns: Database['baby_bean']['Tables']['households']['Row'];
      };
      is_household_member: {
        Args: { hh: string; role_min?: string };
        Returns: boolean;
      };
      role_rank: {
        Args: { role: string };
        Returns: number;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/** Row type for a table, e.g. `Tables<'events'>`. */
export type Tables<T extends keyof Database['baby_bean']['Tables']> =
  Database['baby_bean']['Tables'][T]['Row'];
/** Insert type for a table, e.g. `TablesInsert<'events'>`. */
export type TablesInsert<T extends keyof Database['baby_bean']['Tables']> =
  Database['baby_bean']['Tables'][T]['Insert'];
/** Update type for a table, e.g. `TablesUpdate<'events'>`. */
export type TablesUpdate<T extends keyof Database['baby_bean']['Tables']> =
  Database['baby_bean']['Tables'][T]['Update'];

export type EventRow = Tables<'events'>;
export type ChildRow = Tables<'children'>;
export type HouseholdRow = Tables<'households'>;
