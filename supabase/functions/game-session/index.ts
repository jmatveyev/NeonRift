import { createClient } from 'npm:@supabase/supabase-js@2.95.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}');
const SECRET_KEY = secretKeys.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_KEYS = new Set(Object.values(publishableKeys).filter((v): v is string => typeof v === 'string'));
const admin = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const PILOT_RE = /^[A-Z0-9 _-]{1,16}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLATFORM_RE = /^(touch|desktop)-(portrait|landscape)$/;
const RIGS = new Set(['striker', 'ghost', 'bastion']);
const MODES = new Set(['standard', 'endless', 'daily']);
const EVENT_NAMES = new Set(['sector_clear', 'upgrade_choice', 'run_resume', 'run_abandon', 'client_error']);

function allowedOrigin(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  if (origin === 'https://jmatveyev.github.io' || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
  return '';
}
function cors(req: Request) {
  const origin = allowedOrigin(req);
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };
}
function response(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: cors(req) });
}
function int(value: unknown, min: number, max: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : min;
}
function cleanPilot(value: unknown) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16) || 'PILOT';
}
function cleanPlatform(value: unknown) {
  const platform = String(value ?? '');
  return PLATFORM_RE.test(platform) ? platform : null;
}
function base64url(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function todayUTC() { return new Date().toISOString().slice(0, 10); }
function dailySeed(day: string) {
  let h = 2166136261 >>> 0;
  for (const c of `NEON-RIFT-DAILY-${day}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function randomSeed() { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] >>> 0; }
async function clientHash(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown').split(',')[0].trim();
  return sha256(`neon-rift:${todayUTC()}:${ip}`);
}
async function enforceLimit(playerId: string, action: 'start'|'finish'|'event', max: number, seconds: number, hash: string) {
  const since = new Date(Date.now() - seconds * 1000).toISOString();
  const [byPlayer, byClient] = await Promise.all([
    admin.from('submission_limits').select('id', { count: 'exact', head: true }).eq('action', action).eq('player_id', playerId).gte('created_at', since),
    admin.from('submission_limits').select('id', { count: 'exact', head: true }).eq('action', action).eq('client_hash', hash).gte('created_at', since)
  ]);
  if (byPlayer.error || byClient.error) throw new Error('rate_limit_query');
  if ((byPlayer.count ?? 0) >= max || (byClient.count ?? 0) >= max) return false;
  const inserted = await admin.from('submission_limits').insert({ player_id: playerId, client_hash: hash, action });
  if (inserted.error) throw new Error('rate_limit_insert');
  return true;
}
async function sessionFor(runId: string, token: string) {
  if (!UUID_RE.test(runId) || token.length < 20 || token.length > 160) return null;
  const { data, error } = await admin.from('run_sessions').select('*').eq('run_id', runId).maybeSingle();
  if (error || !data) return null;
  const hash = await sha256(token);
  if (hash !== data.token_hash) return null;
  return data;
}
function compactEventData(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw).slice(0, 20)) {
    if (!/^[a-zA-Z0-9_]{1,32}$/.test(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 96);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.round(v * 1000) / 1000;
    else if (typeof v === 'boolean' || v === null) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.slice(0, 24).map((x) => typeof x === 'string' ? x.slice(0, 48) : typeof x === 'number' && Number.isFinite(x) ? x : null);
  }
  return out;
}

async function handleStart(req: Request, body: Record<string, unknown>) {
  const playerId = String(body.player_id ?? '');
  if (!UUID_RE.test(playerId)) return response(req, 400, { error: 'invalid_player_id' });
  const pilot = cleanPilot(body.pilot);
  if (!PILOT_RE.test(pilot)) return response(req, 400, { error: 'invalid_pilot' });
  const rig = String(body.rig ?? '');
  const mode = String(body.mode ?? 'standard');
  if (!RIGS.has(rig) || !MODES.has(mode)) return response(req, 400, { error: 'invalid_run_configuration' });
  const hash = await clientHash(req);
  if (!await enforceLimit(playerId, 'start', 40, 3600, hash)) return response(req, 429, { error: 'start_rate_limit' });
  const challengeDate = mode === 'daily' ? todayUTC() : null;
  const seed = mode === 'daily' ? dailySeed(challengeDate!) : randomSeed();
  const runId = crypto.randomUUID();
  const tokenBytes = new Uint8Array(32); crypto.getRandomValues(tokenBytes);
  const token = base64url(tokenBytes);
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const playerWrite = await admin.from('players').upsert({ player_id: playerId, pilot, last_seen_at: now }, { onConflict: 'player_id' });
  if (playerWrite.error) return response(req, 500, { error: 'player_write_failed' });
  if (pilot !== 'PILOT') {
    const rename = await admin.from('runs').update({ pilot }).eq('player_id', playerId).eq('pilot', 'PILOT');
    if (rename.error) return response(req, 500, { error: 'pilot_history_rename_failed' });
  }
  const sessionWrite = await admin.from('run_sessions').insert({ run_id: runId, player_id: playerId, token_hash: tokenHash, mode, challenge_date: challengeDate, seed, pilot, rig, client_hash: hash });
  if (sessionWrite.error) return response(req, 500, { error: 'session_write_failed' });
  await admin.from('telemetry_events').insert({ run_id: runId, player_id: playerId, event_name: 'run_start', mode, challenge_date: challengeDate, wave: 0, rig, event_data: { game_version: String(body.game_version ?? '1.3.1').slice(0, 24), platform: cleanPlatform(body.platform) } });
  return response(req, 200, { run_id: runId, token, seed, mode, challenge_date: challengeDate });
}

async function handleFinish(req: Request, body: Record<string, unknown>) {
  const runId = String(body.run_id ?? '');
  const token = String(body.token ?? '');
  const session = await sessionFor(runId, token);
  if (!session || session.status !== 'active') return response(req, 403, { error: 'invalid_or_completed_session' });
  const playerId = String(session.player_id);
  const hash = await clientHash(req);
  if (!await enforceLimit(playerId, 'finish', 40, 3600, hash)) return response(req, 429, { error: 'finish_rate_limit' });
  const score = int(body.score, 0, 10000000);
  const kills = int(body.kills, 0, 10000);
  const sectors = int(body.sectors, 0, 99);
  const seconds = int(body.seconds, 0, 86400);
  const maxCombo = int(body.max_combo, 0, 10000);
  const damageTaken = int(body.damage_taken, 0, 100000);
  const dashes = int(body.dashes, 0, 100000);
  const overdrives = int(body.overdrives, 0, 100000);
  const won = Boolean(body.won);
  const wallSeconds = Math.max(0, (Date.now() - new Date(session.started_at).getTime()) / 1000);
  if (seconds > wallSeconds + 20) return response(req, 422, { error: 'elapsed_time_invalid' });
  if (kills < maxCombo) return response(req, 422, { error: 'combo_exceeds_kills' });
  if (session.mode === 'daily' && sectors > 9) return response(req, 422, { error: 'daily_sector_limit' });
  if (session.mode === 'standard' && sectors > 9) return response(req, 422, { error: 'standard_sector_limit' });
  if (session.mode === 'endless' && won) return response(req, 422, { error: 'endless_has_no_win_state' });
  if (session.mode !== 'endless' && won && sectors < 9) return response(req, 422, { error: 'win_without_clear' });
  const scoreEnvelope = 75000 + kills * 25000 + sectors * 150000;
  if (score > scoreEnvelope) return response(req, 422, { error: 'score_outside_envelope' });
  const playedAt = new Date().toISOString();
  const eventData = compactEventData(body.telemetry);
  const platform = cleanPlatform(eventData.platform);
  const run = {
    run_id: runId, player_id: playerId, pilot: session.pilot, score, kills, sectors, seconds, rig: session.rig,
    max_combo: maxCombo, won, played_at: playedAt, mode: session.mode, challenge_date: session.challenge_date,
    seed: session.seed, damage_taken: damageTaken, dashes, overdrives, game_version: String(body.game_version ?? '1.3.1').slice(0, 24), client_platform: platform
  };
  const runWrite = await admin.from('runs').insert(run);
  if (runWrite.error) return response(req, 409, { error: runWrite.error.code === '23505' ? 'duplicate_run' : 'run_write_failed' });
  const sessionWrite = await admin.from('run_sessions').update({ status: 'completed', completed_at: playedAt }).eq('run_id', runId).eq('status', 'active');
  if (sessionWrite.error) return response(req, 500, { error: 'session_finalize_failed' });
  const { data: player } = await admin.from('players').select('total_runs,best_score').eq('player_id', playerId).maybeSingle();
  await admin.from('players').update({ pilot: session.pilot, last_seen_at: playedAt, total_runs: (player?.total_runs ?? 0) + 1, best_score: Math.max(player?.best_score ?? 0, score) }).eq('player_id', playerId);
  eventData.score = score; eventData.kills = kills; eventData.sectors = sectors; eventData.seconds = seconds;
  eventData.damage_taken = damageTaken; eventData.dashes = dashes; eventData.overdrives = overdrives; eventData.won = won;
  await admin.from('telemetry_events').insert({ run_id: runId, player_id: playerId, event_name: 'run_finish', mode: session.mode, challenge_date: session.challenge_date, wave: sectors, rig: session.rig, event_data: eventData });
  return response(req, 200, { accepted: true, mode: session.mode, challenge_date: session.challenge_date });
}

async function handleEvent(req: Request, body: Record<string, unknown>) {
  const runId = String(body.run_id ?? '');
  const token = String(body.token ?? '');
  const name = String(body.event_name ?? '');
  if (!EVENT_NAMES.has(name)) return response(req, 400, { error: 'invalid_event' });
  const session = await sessionFor(runId, token);
  if (!session || session.status !== 'active') return response(req, 403, { error: 'invalid_session' });
  const hash = await clientHash(req);
  if (!await enforceLimit(String(session.player_id), 'event', 180, 3600, hash)) return response(req, 429, { error: 'event_rate_limit' });
  const wave = body.wave == null ? null : int(body.wave, 0, 99);
  const write = await admin.from('telemetry_events').insert({ run_id: runId, player_id: session.player_id, event_name: name, mode: session.mode, challenge_date: session.challenge_date, wave, rig: session.rig, event_data: compactEventData(body.event_data) });
  if (write.error) return response(req, 500, { error: 'event_write_failed' });
  if (name === 'run_abandon') await admin.from('run_sessions').update({ status: 'abandoned', completed_at: new Date().toISOString() }).eq('run_id', runId).eq('status', 'active');
  return response(req, 200, { accepted: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== 'POST') return response(req, 405, { error: 'method_not_allowed' });
  const key = req.headers.get('apikey') ?? '';
  if (!ALLOWED_KEYS.has(key)) return response(req, 401, { error: 'invalid_application_key' });
  if (!SECRET_KEY || !SUPABASE_URL) return response(req, 500, { error: 'server_not_configured' });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response(req, 400, { error: 'invalid_json' }); }
  const action = String(body.action ?? '');
  try {
    if (Math.random() < 0.01) void admin.from('submission_limits').delete().lt('created_at', new Date(Date.now() - 2 * 86400000).toISOString());
    if (action === 'start') return await handleStart(req, body);
    if (action === 'finish') return await handleFinish(req, body);
    if (action === 'event') return await handleEvent(req, body);
    return response(req, 400, { error: 'invalid_action' });
  } catch (error) {
    console.error('game-session failure', error instanceof Error ? error.message : error);
    return response(req, 500, { error: 'internal_error' });
  }
});
