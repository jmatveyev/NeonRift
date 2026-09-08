alter table public.runs drop constraint if exists runs_mode_values;
alter table public.runs add constraint runs_mode_values check (mode in ('standard','endless','daily'));
alter table public.runs drop constraint if exists runs_challenge_shape;
alter table public.runs add constraint runs_challenge_shape check ((mode = 'daily' and challenge_date is not null) or (mode in ('standard','endless') and challenge_date is null));

alter table public.run_sessions drop constraint if exists run_sessions_mode_values;
alter table public.run_sessions add constraint run_sessions_mode_values check (mode in ('standard','endless','daily'));
alter table public.run_sessions drop constraint if exists run_sessions_challenge_shape;
alter table public.run_sessions add constraint run_sessions_challenge_shape check ((mode = 'daily' and challenge_date is not null) or (mode in ('standard','endless') and challenge_date is null));

alter table public.telemetry_events drop constraint if exists telemetry_mode_values;
alter table public.telemetry_events add constraint telemetry_mode_values check (mode is null or mode in ('standard','endless','daily'));

create index if not exists runs_endless_score_idx on public.runs (score desc, sectors desc, created_at asc) where mode = 'endless';
