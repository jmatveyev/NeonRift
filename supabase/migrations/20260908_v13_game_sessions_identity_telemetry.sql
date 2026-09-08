alter table public.runs
  add column if not exists player_id uuid,
  add column if not exists mode text not null default 'standard',
  add column if not exists challenge_date date,
  add column if not exists seed bigint,
  add column if not exists damage_taken integer not null default 0,
  add column if not exists dashes integer not null default 0,
  add column if not exists overdrives integer not null default 0,
  add column if not exists game_version text not null default '1.3.0',
  add column if not exists client_platform text;

alter table public.runs drop constraint if exists runs_sectors_range;
alter table public.runs add constraint runs_sectors_range check (sectors >= 0 and sectors <= 99);
alter table public.runs add constraint runs_mode_values check (mode in ('standard','daily'));
alter table public.runs add constraint runs_challenge_shape check ((mode = 'daily' and challenge_date is not null) or (mode = 'standard' and challenge_date is null));
alter table public.runs add constraint runs_seed_range check (seed is null or (seed >= 0 and seed <= 4294967295));
alter table public.runs add constraint runs_damage_range check (damage_taken >= 0 and damage_taken <= 100000);
alter table public.runs add constraint runs_dash_range check (dashes >= 0 and dashes <= 100000);
alter table public.runs add constraint runs_overdrive_range check (overdrives >= 0 and overdrives <= 100000);

create index if not exists runs_score_idx on public.runs (score desc, created_at asc);
create index if not exists runs_daily_score_idx on public.runs (challenge_date, score desc, created_at asc) where mode = 'daily';
create index if not exists runs_player_idx on public.runs (player_id, created_at desc);

drop policy if exists "community runs insertable" on public.runs;
revoke insert, update, delete on table public.runs from anon, authenticated;
grant select on table public.runs to anon, authenticated;
grant select, insert, update, delete on table public.runs to service_role;

create table if not exists public.players (
  player_id uuid primary key,
  pilot text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  total_runs integer not null default 0,
  best_score integer not null default 0,
  constraint players_pilot_format check (char_length(pilot) between 1 and 16 and pilot ~ '^[A-Z0-9 _-]+$'),
  constraint players_totals_range check (total_runs >= 0 and best_score >= 0)
);
alter table public.players enable row level security;
revoke all on table public.players from anon, authenticated;
grant select, insert, update, delete on table public.players to service_role;

create table if not exists public.run_sessions (
  run_id text primary key,
  player_id uuid not null,
  token_hash text not null,
  mode text not null,
  challenge_date date,
  seed bigint not null,
  pilot text not null,
  rig text not null,
  client_hash text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'active',
  constraint run_sessions_run_id_len check (char_length(run_id) between 8 and 48),
  constraint run_sessions_mode_values check (mode in ('standard','daily')),
  constraint run_sessions_challenge_shape check ((mode = 'daily' and challenge_date is not null) or (mode = 'standard' and challenge_date is null)),
  constraint run_sessions_seed_range check (seed between 0 and 4294967295),
  constraint run_sessions_pilot_format check (char_length(pilot) between 1 and 16 and pilot ~ '^[A-Z0-9 _-]+$'),
  constraint run_sessions_rig_values check (rig in ('striker','ghost','bastion')),
  constraint run_sessions_status_values check (status in ('active','completed','abandoned'))
);
alter table public.run_sessions enable row level security;
revoke all on table public.run_sessions from anon, authenticated;
grant select, insert, update, delete on table public.run_sessions to service_role;
create index if not exists run_sessions_player_started_idx on public.run_sessions (player_id, started_at desc);
create index if not exists run_sessions_client_started_idx on public.run_sessions (client_hash, started_at desc);

create table if not exists public.telemetry_events (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid(),
  run_id text,
  player_id uuid,
  event_name text not null,
  mode text,
  challenge_date date,
  wave integer,
  rig text,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint telemetry_event_name_len check (char_length(event_name) between 2 and 40),
  constraint telemetry_wave_range check (wave is null or (wave >= 0 and wave <= 99)),
  constraint telemetry_mode_values check (mode is null or mode in ('standard','daily')),
  constraint telemetry_rig_values check (rig is null or rig in ('striker','ghost','bastion'))
);
alter table public.telemetry_events enable row level security;
revoke all on table public.telemetry_events from anon, authenticated;
grant select, insert, update, delete on table public.telemetry_events to service_role;
create index if not exists telemetry_event_created_idx on public.telemetry_events (event_name, created_at desc);
create index if not exists telemetry_run_idx on public.telemetry_events (run_id, created_at);

create table if not exists public.submission_limits (
  id bigint generated always as identity primary key,
  client_hash text,
  player_id uuid,
  action text not null,
  created_at timestamptz not null default now(),
  constraint submission_action_values check (action in ('start','finish','event'))
);
alter table public.submission_limits enable row level security;
revoke all on table public.submission_limits from anon, authenticated;
grant select, insert, update, delete on table public.submission_limits to service_role;
create index if not exists submission_limits_client_idx on public.submission_limits (client_hash, created_at desc);
create index if not exists submission_limits_player_idx on public.submission_limits (player_id, created_at desc);
