-- Baby Bean — dev seed. Runs as a privileged role, so RLS is bypassed here.
-- Gives you a household + child + a realistic day of events.
--
-- To SEE this data in the app, add your signed-in user as a member (RLS gates
-- reads by membership). After signing up once, grab your id from
-- Dashboard → Authentication → Users and run the INSERT at the bottom.

insert into baby_bean.households (id, name)
values ('11111111-1111-1111-1111-111111111111', 'The Bean House')
on conflict (id) do nothing;

insert into baby_bean.children (id, household_id, name, dob, sex)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Sprout',
  current_date - interval '38 days',
  'other'
)
on conflict (id) do nothing;

-- A day of events. household_id is filled by the events_set_household trigger.
insert into baby_bean.events (child_id, type, started_at, ended_at, breast_side, duration_seconds)
values ('22222222-2222-2222-2222-222222222222', 'breast', now() - interval '5 hours', now() - interval '5 hours' + interval '18 minutes', 'left', 18 * 60);

insert into baby_bean.events (child_id, type, started_at, diaper_contents)
values ('22222222-2222-2222-2222-222222222222', 'diaper', now() - interval '4 hours 30 minutes', 'wet');

insert into baby_bean.events (child_id, type, started_at, ended_at, duration_seconds)
values ('22222222-2222-2222-2222-222222222222', 'sleep', now() - interval '4 hours', now() - interval '2 hours 20 minutes', 100 * 60);

insert into baby_bean.events (child_id, type, started_at, amount_ml, data)
values ('22222222-2222-2222-2222-222222222222', 'bottle', now() - interval '2 hours', 90, '{"contents":"breast_milk"}');

insert into baby_bean.events (child_id, type, started_at, diaper_contents)
values ('22222222-2222-2222-2222-222222222222', 'diaper', now() - interval '1 hour 40 minutes', 'dirty');

insert into baby_bean.events (child_id, type, started_at, amount_ml, data)
values ('22222222-2222-2222-2222-222222222222', 'pump', now() - interval '1 hour', 120, '{"left_ml":60,"right_ml":60}');

-- A currently-running feed (open timer: ended_at is null).
insert into baby_bean.events (child_id, type, started_at, breast_side)
values ('22222222-2222-2222-2222-222222222222', 'breast', now() - interval '6 minutes', 'right');

-- ---------------------------------------------------------------------------
-- Link YOUR user so the app (under RLS) can see the above. Replace the uuid.
-- ---------------------------------------------------------------------------
-- insert into baby_bean.household_members (household_id, user_id, role)
-- values ('11111111-1111-1111-1111-111111111111', '<your-auth-user-id>', 'parent')
-- on conflict do nothing;
