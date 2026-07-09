-- Baby Bean — initial schema (spec §4).
-- Everything lives in the `baby_bean` schema so it coexists safely with the
-- `second-guess` app already using `public` in this shared Supabase project.
--
-- Design decisions carried from the spec:
--   * ONE `events` table for all logged activity (typed hot columns + `data` jsonb).
--   * Soft delete via `deleted_at` (load-bearing for undo + safe sync).
--   * RLS scopes every row by household membership; viewer role is read-only.

create schema if not exists baby_bean;

-- gen_random_uuid() lives in pgcrypto (bundled with Supabase).
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists baby_bean.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid()
);

create table if not exists baby_bean.household_members (
  household_id uuid not null references baby_bean.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'parent' check (role in ('parent', 'caregiver', 'viewer')),
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists baby_bean.household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references baby_bean.households (id) on delete cascade,
  code         text not null unique,
  role         text not null default 'caregiver' check (role in ('parent', 'caregiver', 'viewer')),
  expires_at   timestamptz,
  accepted_by  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists baby_bean.children (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references baby_bean.households (id) on delete cascade,
  name         text not null,
  dob          date,
  sex          text check (sex in ('male', 'female', 'other')),
  photo_path   text,
  created_at   timestamptz not null default now()
);

-- The universal log. `type` is one of the spec §4.3 event types.
create table if not exists baby_bean.events (
  id               uuid primary key default gen_random_uuid(),
  child_id         uuid not null references baby_bean.children (id) on delete cascade,
  household_id     uuid not null references baby_bean.households (id) on delete cascade,
  type             text not null check (type in (
                     'breast','bottle','solids','pump','diaper','sleep','medication',
                     'temperature','growth','milestone','tummy_time','bath','symptom','photo','note')),
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  amount_ml        numeric,
  duration_seconds integer,
  breast_side      text check (breast_side in ('left', 'right', 'both')),
  diaper_contents  text check (diaper_contents in ('wet', 'dirty', 'mixed', 'dry')),
  data             jsonb not null default '{}',
  note             text,
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint events_end_after_start check (ended_at is null or ended_at >= started_at)
);

create table if not exists baby_bean.milk_inventory (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references baby_bean.households (id) on delete cascade,
  volume_ml    numeric not null,
  pumped_at    timestamptz not null default now(),
  storage      text not null default 'fridge' check (storage in ('fridge', 'freezer')),
  used_at      timestamptz,
  discarded    boolean not null default false,
  note         text,
  created_at   timestamptz not null default now()
);

create table if not exists baby_bean.reminders (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references baby_bean.households (id) on delete cascade,
  child_id     uuid references baby_bean.children (id) on delete cascade,
  kind         text not null check (kind in ('medication', 'feed', 'pump', 'custom')),
  schedule     jsonb not null default '{}',
  next_fire_at timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (spec §4.2)
-- ---------------------------------------------------------------------------

create index if not exists events_child_started_idx
  on baby_bean.events (child_id, started_at desc);
create index if not exists events_household_type_started_idx
  on baby_bean.events (household_id, type, started_at desc);
create index if not exists events_running_idx
  on baby_bean.events (child_id) where ended_at is null;
create index if not exists events_deleted_idx
  on baby_bean.events (deleted_at);
create index if not exists household_members_user_idx
  on baby_bean.household_members (user_id);

-- ---------------------------------------------------------------------------
-- Membership helpers (SECURITY DEFINER so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------

create or replace function baby_bean.role_rank(role text)
returns int language sql immutable as $$
  select case role
    when 'parent' then 3
    when 'caregiver' then 2
    when 'viewer' then 1
    else 0
  end;
$$;

-- True if the current user belongs to `hh` with at least `role_min` privileges.
create or replace function baby_bean.is_household_member(hh uuid, role_min text default 'viewer')
returns boolean
language sql
stable
security definer
set search_path = baby_bean, public
as $$
  select exists (
    select 1
    from baby_bean.household_members m
    where m.household_id = hh
      and m.user_id = auth.uid()
      and baby_bean.role_rank(m.role) >= baby_bean.role_rank(role_min)
  );
$$;

-- Bootstrap: create a household and add the caller as its first parent, atomically.
-- Used by the first-run flow (P0-5). Avoids the chicken-and-egg where a user
-- must be a member to insert members.
create or replace function baby_bean.create_household(name text)
returns baby_bean.households
language plpgsql
security definer
set search_path = baby_bean, public
as $$
declare
  hh baby_bean.households;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into baby_bean.households (name, created_by)
    values (create_household.name, auth.uid())
    returning * into hh;
  insert into baby_bean.household_members (household_id, user_id, role)
    values (hh.id, auth.uid(), 'parent');
  return hh;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers: keep events.household_id consistent + bump updated_at
-- ---------------------------------------------------------------------------

create or replace function baby_bean.events_set_household()
returns trigger language plpgsql security definer set search_path = baby_bean, public as $$
begin
  -- Derive household_id from the child so a client can never spoof it.
  select c.household_id into new.household_id
  from baby_bean.children c
  where c.id = new.child_id;
  if new.household_id is null then
    raise exception 'child % has no household', new.child_id;
  end if;
  return new;
end;
$$;

create trigger events_set_household_trg
  before insert or update of child_id on baby_bean.events
  for each row execute function baby_bean.events_set_household();

create or replace function baby_bean.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger events_set_updated_at_trg
  before update on baby_bean.events
  for each row execute function baby_bean.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table baby_bean.households        enable row level security;
alter table baby_bean.household_members enable row level security;
alter table baby_bean.household_invites enable row level security;
alter table baby_bean.children          enable row level security;
alter table baby_bean.events            enable row level security;
alter table baby_bean.milk_inventory    enable row level security;
alter table baby_bean.reminders         enable row level security;

-- households: members read; any authed user can create; parents manage.
create policy households_select on baby_bean.households
  for select using (baby_bean.is_household_member(id));
create policy households_insert on baby_bean.households
  for insert with check (created_by = auth.uid());
create policy households_update on baby_bean.households
  for update using (baby_bean.is_household_member(id, 'parent'))
  with check (baby_bean.is_household_member(id, 'parent'));
create policy households_delete on baby_bean.households
  for delete using (baby_bean.is_household_member(id, 'parent'));

-- household_members: members see co-members; parents manage the roster.
create policy members_select on baby_bean.household_members
  for select using (baby_bean.is_household_member(household_id));
create policy members_insert on baby_bean.household_members
  for insert with check (baby_bean.is_household_member(household_id, 'parent'));
create policy members_update on baby_bean.household_members
  for update using (baby_bean.is_household_member(household_id, 'parent'))
  with check (baby_bean.is_household_member(household_id, 'parent'));
create policy members_delete on baby_bean.household_members
  for delete using (baby_bean.is_household_member(household_id, 'parent'));

-- invites: members read; parents create/revoke.
create policy invites_select on baby_bean.household_invites
  for select using (baby_bean.is_household_member(household_id));
create policy invites_write on baby_bean.household_invites
  for all using (baby_bean.is_household_member(household_id, 'parent'))
  with check (baby_bean.is_household_member(household_id, 'parent'));

-- Data tables: members read; caregiver+ writes; viewer is read-only.
create policy children_select on baby_bean.children
  for select using (baby_bean.is_household_member(household_id));
create policy children_write on baby_bean.children
  for all using (baby_bean.is_household_member(household_id, 'caregiver'))
  with check (baby_bean.is_household_member(household_id, 'caregiver'));

create policy events_select on baby_bean.events
  for select using (baby_bean.is_household_member(household_id));
create policy events_write on baby_bean.events
  for all using (baby_bean.is_household_member(household_id, 'caregiver'))
  with check (baby_bean.is_household_member(household_id, 'caregiver'));

create policy milk_select on baby_bean.milk_inventory
  for select using (baby_bean.is_household_member(household_id));
create policy milk_write on baby_bean.milk_inventory
  for all using (baby_bean.is_household_member(household_id, 'caregiver'))
  with check (baby_bean.is_household_member(household_id, 'caregiver'));

create policy reminders_select on baby_bean.reminders
  for select using (baby_bean.is_household_member(household_id));
create policy reminders_write on baby_bean.reminders
  for all using (baby_bean.is_household_member(household_id, 'caregiver'))
  with check (baby_bean.is_household_member(household_id, 'caregiver'));

-- ---------------------------------------------------------------------------
-- Grants + Realtime
-- ---------------------------------------------------------------------------

grant usage on schema baby_bean to anon, authenticated;
grant execute on all functions in schema baby_bean to anon, authenticated;
grant select, insert, update, delete on all tables in schema baby_bean to authenticated;
grant select on all tables in schema baby_bean to anon;

alter default privileges in schema baby_bean
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema baby_bean
  grant execute on functions to anon, authenticated;

-- Realtime: caregivers on a second device should see events/children live.
-- replica identity full carries old-row data for soft-delete/update payloads.
alter table baby_bean.events   replica identity full;
alter table baby_bean.children replica identity full;
alter publication supabase_realtime add table baby_bean.events;
alter publication supabase_realtime add table baby_bean.children;
