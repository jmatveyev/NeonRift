create policy "backend only players" on public.players for all to anon, authenticated using (false) with check (false);
create policy "backend only run sessions" on public.run_sessions for all to anon, authenticated using (false) with check (false);
create policy "backend only telemetry" on public.telemetry_events for all to anon, authenticated using (false) with check (false);
create policy "backend only submission limits" on public.submission_limits for all to anon, authenticated using (false) with check (false);
