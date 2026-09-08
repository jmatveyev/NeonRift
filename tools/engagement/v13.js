
// NEON RIFT 1.3 - managed runs, daily challenge, checkpoints, telemetry, modifiers and cosmetic progression.
const V13_VERSION = '1.3.0';
const PLAYER_KEY = 'neon-rift-player-v1';
const CHECKPOINT_KEY = 'neon-rift-checkpoint-v1';
const CHECKPOINT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const THEMES = {
  cyan: { name: 'SIGNAL CYAN', level: 1, color: '#78f8df' },
  violet: { name: 'VOID VIOLET', level: 3, color: '#a7a1ff' },
  gold: { name: 'RIFT GOLD', level: 5, color: '#ffd78b' },
  rose: { name: 'NOVA ROSE', level: 8, color: '#ff7ca6' }
};
const SECTOR_MODIFIERS = [
  { id: 'clear', name: 'CLEAR SIGNAL', detail: 'Stable combat conditions.', enemySpeed: 1, bulletSpeed: 1, spawnPressure: 1, duration: 1, repair: 18 },
  { id: 'ion', name: 'ION STORM', detail: 'Hostile projectiles travel faster.', enemySpeed: 1, bulletSpeed: 1.18, spawnPressure: 1, duration: 1, repair: 18 },
  { id: 'hunter', name: 'HUNTER GRID', detail: 'The swarm moves and arrives faster.', enemySpeed: 1.14, bulletSpeed: 1, spawnPressure: 1.08, duration: 1, repair: 18 },
  { id: 'night', name: 'LONG NIGHT', detail: 'Survival sectors last a little longer.', enemySpeed: 1, bulletSpeed: 1, spawnPressure: 1, duration: 1.18, repair: 18 },
  { id: 'repair', name: 'REPAIR WINDOW', detail: 'Sector clearance restores extra hull.', enemySpeed: 1, bulletSpeed: 1, spawnPressure: 1, duration: 1, repair: 30 }
];
const BOSS_NAMES = { 1: 'THE GATEKEEPER', 2: 'VOID WARDEN', 3: 'RIFT SOVEREIGN' };
let activeMode = 'standard';
let lastMode = 'standard';
let managedSession = null;
let startingManagedRun = false;
let playerIdentity = loadPlayerIdentity();

function randomUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((v) => v.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function loadPlayerIdentity() {
  try {
    const value = JSON.parse(localStorage.getItem(PLAYER_KEY) || '{}');
    if (UUID_RE.test(String(value.playerId || ''))) return { playerId: value.playerId, createdAt: value.createdAt || new Date().toISOString() };
  } catch (_) { /* A fresh anonymous signal is harmless. */ }
  const identity = { playerId: randomUUID(), createdAt: new Date().toISOString() };
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(identity)); } catch (_) { /* Session identity still works. */ }
  return identity;
}
function todayUTC() { return new Date().toISOString().slice(0, 10); }
function dailySeedClient(day = todayUTC()) {
  let h = 2166136261 >>> 0;
  for (const c of `NEON-RIFT-DAILY-${day}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function trackedSeededRandom(seed, skip = 0) {
  const inner = seededRandom(seed >>> 0);
  for (let i = 0; i < Math.max(0, Math.floor(skip)); i++) inner();
  return () => { if (G) G.rngCalls = (G.rngCalls || 0) + 1; return inner(); };
}
function sectorModifier(seed = G?.seed || 0, wave = G?.wave || 1) {
  let h = (seed ^ Math.imul(wave, 0x9E3779B1)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return SECTOR_MODIFIERS[(h >>> 0) % SECTOR_MODIFIERS.length];
}
function applySectorModifier() {
  if (!G) return;
  G.mode = activeMode;
  G.challengeDate = managedSession?.challengeDate || (activeMode === 'daily' ? todayUTC() : null);
  G.modifier = sectorModifier(G.seed, G.wave);
  if (G.wave % 3 !== 0 && G.modifier.duration !== 1) {
    G.duration *= G.modifier.duration; G.waveTime = G.duration;
  }
  syncRunModeHud();
}
function sectorEnemySpeed() { return G?.modifier?.enemySpeed || 1; }
function sectorBulletSpeed() { return G?.modifier?.bulletSpeed || 1; }
function sectorSpawnPressure() { return G?.modifier?.spawnPressure || 1; }
function sectorRepairAmount() { return G?.modifier?.repair || 18; }
function bossDisplayName(stage) { return BOSS_NAMES[Math.min(3, Math.max(1, stage || 1))] || 'RIFT ENTITY'; }

function onlineConfigV13() {
  const cfg = window.NEON_RIFT_ONLINE;
  if (!cfg || cfg.enabled !== true || typeof cfg.url !== 'string' || !cfg.url) return null;
  const key = cfg.publishableKey || cfg.anonKey;
  if (typeof key !== 'string' || !key) return null;
  return { ...cfg, key, table: cfg.table || 'runs', function: cfg.function || 'game-session' };
}
onlineConfig = onlineConfigV13;
onlineHeaders = (cfg) => ({ apikey: cfg.key, 'Content-Type': 'application/json' });

async function callGameSession(action, payload = {}, timeout = 4500) {
  const cfg = onlineConfigV13(); if (!cfg) throw new Error('backend_not_configured');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${cfg.url.replace(/\/$/, '')}/functions/v1/${encodeURIComponent(cfg.function)}`, {
      method: 'POST', headers: onlineHeaders(cfg), signal: controller.signal,
      body: JSON.stringify({ action, ...payload })
    });
    let data = {}; try { data = await response.json(); } catch (_) { /* Keep status-based error. */ }
    if (!response.ok) throw new Error(data.error || `HTTP_${response.status}`);
    return data;
  } finally { clearTimeout(timer); }
}
function platformLabel() {
  const orientation = innerWidth >= innerHeight ? 'landscape' : 'portrait';
  return `${coarse ? 'touch' : 'desktop'}-${orientation}`;
}
async function startManagedRun(mode = 'standard') {
  if (startingManagedRun) return;
  startingManagedRun = true; activeMode = mode === 'daily' ? 'daily' : 'standard'; lastMode = activeMode;
  clearCheckpoint();
  const button = activeMode === 'daily' ? $('dailyRunBtn') : $('startBtn');
  const oldText = button?.innerHTML; if (button) { button.disabled = true; button.textContent = 'LINKING SIGNAL...'; }
  let seed = activeMode === 'daily' ? dailySeedClient() : null;
  managedSession = null;
  try {
    const session = await callGameSession('start', {
      player_id: playerIdentity.playerId, pilot: career.pilot, rig: selectedRig, mode: activeMode,
      game_version: V13_VERSION, platform: platformLabel()
    });
    seed = Number(session.seed) >>> 0;
    managedSession = { runId: session.run_id, token: session.token, seed, mode: session.mode, challengeDate: session.challenge_date || null, finalizing: false, finalized: false };
  } catch (_) {
    toast(activeMode === 'daily' ? 'DAILY PRACTICE MODE - COMMUNITY SYNC UNAVAILABLE' : 'COMMUNITY SYNC UNAVAILABLE - LOCAL RUN STARTED', 3.4);
  }
  startRun(seed, false);
  if (G) { G.mode = activeMode; G.challengeDate = managedSession?.challengeDate || (activeMode === 'daily' ? todayUTC() : null); }
  syncRunModeHud();
  if (button) { button.disabled = false; if (oldText) button.innerHTML = oldText; }
  startingManagedRun = false;
}
async function sendRunEvent(eventName, eventData = {}, wave = G?.wave || 0) {
  if (!managedSession || managedSession.finalized || managedSession.finalizing) return;
  try {
    await callGameSession('event', { run_id: managedSession.runId, token: managedSession.token, event_name: eventName, wave, event_data: eventData }, 3500);
  } catch (_) { /* Telemetry can fail without touching gameplay. */ }
}

function cleanCheckpoint(raw) {
  if (!raw || raw.version !== 1 || Date.now() - Number(raw.savedAt || 0) > CHECKPOINT_MAX_AGE) return null;
  if (!raw.g || !raw.player || !Array.isArray(raw.choices)) return null;
  if (!['standard','daily'].includes(raw.mode) || !RIGS[raw.player.rig]) return null;
  return raw;
}
function loadCheckpoint() {
  try { return cleanCheckpoint(JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || 'null')); } catch (_) { return null; }
}
function clearCheckpoint() { try { localStorage.removeItem(CHECKPOINT_KEY); } catch (_) { /* Nothing to clear. */ } syncCheckpointButton(); }
function saveCheckpoint() {
  if (!G || !player || state !== 'upgrade' || G.endless || !choices.length || G.wave >= 9) return;
  const checkpoint = {
    version: 1, savedAt: Date.now(), mode: activeMode, session: managedSession ? { ...managedSession, finalizing: false } : null,
    seed: G.seed >>> 0, challengeDate: G.challengeDate || null,
    g: { elapsed: G.elapsed, wave: G.wave, completed: G.completed, kills: G.kills, score: G.score, combo: G.combo, comboTimer: G.comboTimer,
      maxCombo: G.maxCombo, rerolls: G.rerolls, recordStart: G.recordStart, damageTaken: G.damageTaken || 0, dashes: G.dashes || 0,
      overdrives: G.overdrives || 0, rngCalls: G.rngCalls || 0 },
    player: { rig: player.rig, hp: player.hp, energy: player.energy, shieldReady: player.shieldReady, shieldClock: player.shieldClock,
      repairKills: player.repairKills, readyAnnounced: player.readyAnnounced, upgrades: { ...player.upgrades } },
    choices: choices.map((item) => item.id)
  };
  try { localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint)); } catch (_) { /* Resume is optional. */ }
  syncCheckpointButton();
}
function restoreCheckpoint() {
  const checkpoint = loadCheckpoint(); if (!checkpoint) { clearCheckpoint(); toast('NO VALID CHECKPOINT FOUND', 2.2); return; }
  activeMode = checkpoint.mode; lastMode = checkpoint.mode; managedSession = checkpoint.session || null;
  selectedRig = checkpoint.player.rig;
  startRun(checkpoint.seed, true);
  if (!G || !player) return;
  Object.assign(G, checkpoint.g, { seed: checkpoint.seed >>> 0, mode: checkpoint.mode, challengeDate: checkpoint.challengeDate, clearing: true, boss: null, bossDefeated: false, finishTime: 0 });
  player.upgrades = { ...checkpoint.player.upgrades }; recalc();
  player.hp = clamp(Number(checkpoint.player.hp) || player.maxHp, 1, player.maxHp); player.energy = clamp(Number(checkpoint.player.energy) || 0, 0, 100);
  player.shieldReady = Boolean(checkpoint.player.shieldReady); player.shieldClock = Math.max(0, Number(checkpoint.player.shieldClock) || 0);
  player.repairKills = Math.max(0, Math.floor(Number(checkpoint.player.repairKills) || 0)); player.readyAnnounced = Boolean(checkpoint.player.readyAnnounced);
  rng = trackedSeededRandom(checkpoint.seed, checkpoint.g.rngCalls || 0); G.rngCalls = checkpoint.g.rngCalls || 0;
  choices = checkpoint.choices.map((id) => ALL_UPGRADES.find((item) => item.id === id)).filter(Boolean).slice(0, 3);
  state = 'upgrade'; showScreen('upgradeScreen');
  $('upgradeTag').textContent = `CHECKPOINT RESTORED / SECTOR ${String(G.wave).padStart(2, '0')} SECURED`;
  $('patchText').textContent = `RESUME / ${activeMode === 'daily' ? 'DAILY SIGNAL' : 'STANDARD RUN'}`;
  renderUpgradeCards(); refreshHUD(); syncRunModeHud();
  void sendRunEvent('run_resume', { saved_seconds: Math.round(G.elapsed), choices: choices.map((item) => item.id) }, G.wave);
}
function syncCheckpointButton() {
  if (!$('resumeRunBtn')) return;
  const checkpoint = loadCheckpoint();
  $('resumeRunBtn').hidden = !checkpoint;
  if (checkpoint) $('resumeRunBtn').textContent = `RESUME CHECKPOINT / SECTOR ${String(checkpoint.g.wave + 1).padStart(2, '0')}`;
}

function ensureV13UI() {
  if (!$('dailyRunBtn')) {
    const daily = document.createElement('button'); daily.id = 'dailyRunBtn'; daily.className = 'secondary v13-daily'; daily.type = 'button';
    daily.innerHTML = `DAILY SIGNAL <span class="v13-date">${todayUTC()}</span>`; daily.addEventListener('click', () => { void startManagedRun('daily'); });
    const resume = document.createElement('button'); resume.id = 'resumeRunBtn'; resume.className = 'secondary v13-resume'; resume.type = 'button'; resume.hidden = true;
    resume.addEventListener('click', restoreCheckpoint);
    const actions = document.createElement('div'); actions.className = 'v13-home-actions'; actions.append(daily, resume);
    $('startBtn').closest('.start-row')?.after(actions);
  }
  if (!$('runModeHud')) {
    const badge = document.createElement('div'); badge.id = 'runModeHud'; badge.className = 'v13-mode-hud';
    document.querySelector('.sector')?.appendChild(badge);
  }
  if (!$('dailyLeaderboard')) {
    const board = document.createElement('div'); board.className = 'cloud-board v13-daily-board';
    board.innerHTML = '<div class="career-section-title"><h3>DAILY SIGNAL</h3><span id="dailyStatus" class="cloud-offline">TODAY / UTC</span></div><div class="career-list" id="dailyLeaderboard"></div>';
    $('cloudLeaderboard')?.closest('.cloud-board')?.after(board);
  }
  if (!$('careerIdentity')) {
    const identity = document.createElement('div'); identity.id = 'careerIdentity'; identity.className = 'v13-identity';
    identity.textContent = `PLAYER SIGNAL ${playerIdentity.playerId.slice(0, 8).toUpperCase()} / BROWSER IDENTITY`;
    $('careerPilotInput')?.after(identity);
  }
  if (!$('careerTheme')) {
    const wrap = document.createElement('div'); wrap.className = 'v13-theme';
    const label = document.createElement('label'); label.htmlFor = 'careerTheme'; label.textContent = 'COSMETIC SIGNAL';
    const select = document.createElement('select'); select.id = 'careerTheme'; select.addEventListener('change', () => {
      const selected = select.value; const level = levelFromXP(career.xp);
      if (!THEMES[selected] || level < THEMES[selected].level) return;
      career.theme = selected; persistCareer(); applyCareerTheme(); renderThemeOptions();
    });
    wrap.append(label, select); $('careerXPFill')?.closest('.career-card')?.appendChild(wrap);
  }
  syncCheckpointButton(); renderThemeOptions(); applyCareerTheme();
}
function readSavedTheme() {
  if (THEMES[career.theme]) return career.theme;
  try { const raw = JSON.parse(localStorage.getItem(CAREER_KEY) || '{}'); if (THEMES[raw.theme]) return raw.theme; } catch (_) { /* Default below. */ }
  return 'cyan';
}
function applyCareerTheme() {
  career.theme = readSavedTheme();
  const level = levelFromXP(career.xp); if (level < THEMES[career.theme].level) career.theme = 'cyan';
  document.documentElement.style.setProperty('--cyan', THEMES[career.theme].color);
}
function renderThemeOptions() {
  if (!$('careerTheme')) return;
  const level = levelFromXP(career.xp); career.theme = readSavedTheme();
  $('careerTheme').replaceChildren(...Object.entries(THEMES).map(([id, theme]) => {
    const option = document.createElement('option'); option.value = id; option.disabled = level < theme.level;
    option.textContent = level >= theme.level ? theme.name : `${theme.name} / LV ${theme.level}`; return option;
  }));
  if (level < (THEMES[career.theme]?.level || 1)) career.theme = 'cyan'; $('careerTheme').value = career.theme;
}
function syncRunModeHud() {
  if (!$('runModeHud')) return;
  if (!G || !['playing','paused','upgrade'].includes(state)) { $('runModeHud').textContent = ''; return; }
  const modifier = G.modifier || sectorModifier(G.seed, Math.max(1, G.wave));
  $('runModeHud').textContent = `${activeMode === 'daily' ? 'DAILY' : 'STANDARD'} / ${modifier.name}`;
  $('runModeHud').title = modifier.detail;
}

const renderCareerV12 = renderCareer;
renderCareer = function renderCareerV13() {
  ensureV13UI(); applyCareerTheme(); renderCareerV12(); renderThemeOptions();
  if ($('careerIdentity')) $('careerIdentity').textContent = `PLAYER SIGNAL ${playerIdentity.playerId.slice(0, 8).toUpperCase()} / BROWSER IDENTITY`;
};

refreshOnlineLeaderboard = async function refreshOnlineLeaderboardV13() {
  if (!$('cloudStatus')) return;
  ensureV13UI();
  const cfg = onlineConfigV13();
  if (!cfg) {
    $('cloudStatus').textContent = 'COMMUNITY BOARD OFFLINE'; $('dailyStatus').textContent = 'DAILY BOARD OFFLINE';
    $('cloudLeaderboard').replaceChildren(emptyCareer('LOCAL CAREER REMAINS AVAILABLE.'));
    $('dailyLeaderboard').replaceChildren(emptyCareer('DAILY PRACTICE STILL WORKS OFFLINE.')); return;
  }
  $('cloudStatus').textContent = 'SYNCING ALL-TIME BOARD...'; $('dailyStatus').textContent = `SYNCING ${todayUTC()}...`;
  try {
    const fields = 'pilot,score,kills,sectors,seconds,rig,max_combo,won,played_at,mode,challenge_date';
    const base = `${cfg.url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(cfg.table)}`;
    const headers = { apikey: cfg.key };
    const [allTimeResponse, dailyResponse] = await Promise.all([
      fetch(`${base}?select=${fields}&mode=eq.standard&order=score.desc&limit=10`, { headers }),
      fetch(`${base}?select=${fields}&mode=eq.daily&challenge_date=eq.${todayUTC()}&order=score.desc&limit=10`, { headers })
    ]);
    if (!allTimeResponse.ok || !dailyResponse.ok) throw new Error('leaderboard_fetch_failed');
    const [allRows, dailyRows] = await Promise.all([allTimeResponse.json(), dailyResponse.json()]);
    const mapRows = (rows, prefix) => Array.isArray(rows) ? rows.map((r, i) => cleanHistoryEntry({ id: `${prefix}-${i}`, pilot: r.pilot, score: r.score, kills: r.kills, sectors: r.sectors, seconds: r.seconds, rig: r.rig, maxCombo: r.max_combo, won: r.won, playedAt: r.played_at })) : [];
    const allMapped = mapRows(allRows, 'all'); const dailyMapped = mapRows(dailyRows, 'daily');
    $('cloudLeaderboard').replaceChildren(...(allMapped.length ? allMapped.map((r, i) => makeRunRow(r, i, true)) : [emptyCareer('NO VERIFIED STANDARD RUNS YET')]));
    $('dailyLeaderboard').replaceChildren(...(dailyMapped.length ? dailyMapped.map((r, i) => makeRunRow(r, i, true)) : [emptyCareer('NO VERIFIED DAILY RUNS YET')]));
    $('cloudStatus').textContent = 'ALL-TIME / VERIFIED'; $('cloudStatus').className = 'cloud-online';
    $('dailyStatus').textContent = `${todayUTC()} / VERIFIED`; $('dailyStatus').className = 'cloud-online';
  } catch (_) {
    $('cloudStatus').textContent = 'ALL-TIME BOARD UNAVAILABLE'; $('dailyStatus').textContent = 'DAILY BOARD UNAVAILABLE';
    $('cloudLeaderboard').replaceChildren(emptyCareer('LOCAL SAVE UNAFFECTED.'));
    $('dailyLeaderboard').replaceChildren(emptyCareer('DAILY PRACTICE REMAINS AVAILABLE.'));
  }
};

submitOnlineRun = async function submitManagedRun(summary) {
  if (!managedSession || managedSession.finalized || managedSession.finalizing) return;
  managedSession.finalizing = true;
  try {
    await callGameSession('finish', {
      run_id: managedSession.runId, token: managedSession.token, score: summary.score, kills: summary.kills, sectors: summary.sectors,
      seconds: Math.round(summary.seconds), max_combo: summary.maxCombo, won: summary.won, damage_taken: summary.damageTaken,
      dashes: summary.dashes, overdrives: summary.overdrives, game_version: V13_VERSION,
      telemetry: { cause: summary.cause, upgrades: summary.upgrades.map((u) => `${u.name}:${u.rank}`), modifier: G?.modifier?.id || null, platform: platformLabel() }
    }, 6000);
    managedSession.finalized = true;
  } catch (_) { managedSession.finalizing = false; }
};

recordCompletedRun = function recordCompletedRunV13(won, cause = '') {
  if (!G || !player || G.careerFinalized) return;
  G.careerFinalized = true;
  const summary = {
    id: managedSession?.runId || `${Date.now().toString(36)}-${(G.seed >>> 0).toString(36)}`, playedAt: new Date().toISOString(), pilot: career.pilot,
    score: Math.floor(G.score), kills: G.kills, sectors: G.completed, seconds: G.elapsed, rig: player.rig,
    maxCombo: G.maxCombo, damageTaken: Math.max(0, Math.round(G.damageTaken || 0)), dashes: G.dashes || 0,
    overdrives: G.overdrives || 0, won: Boolean(won), cause: cause || '', mode: activeMode, challengeDate: G.challengeDate || null,
    upgrades: ALL_UPGRADES.filter((u) => rank(u.id)).map((u) => ({ name: u.name, rank: rank(u.id) }))
  };
  summary.xpGained = runXP(summary); career.xp += summary.xpGained; career.totalRuns++; career.totalWins += summary.won ? 1 : 0;
  career.totalKills += summary.kills; career.totalSeconds += summary.seconds; career.bestCombo = Math.max(career.bestCombo, summary.maxCombo);
  if (summary.won) career.winsByRig[summary.rig] = (career.winsByRig[summary.rig] || 0) + 1;
  career.history.unshift(summary); career.history = career.history.slice(0, CAREER_HISTORY_LIMIT);
  const unlocked = unlockCareerAchievements(summary); persistCareer(); lastRunSummary = summary; clearCheckpoint();
  void submitOnlineRun(summary);
  requestAnimationFrame(() => { updateResultCareer(summary, unlocked); syncCareerHome(); applyCareerTheme(); });
};

const offerUpgradeV12 = offerUpgrade;
offerUpgrade = function offerUpgradeV13() {
  offerUpgradeV12();
  if (!G?.endless) {
    saveCheckpoint();
    void sendRunEvent('sector_clear', { score: Math.floor(G.score), kills: G.kills, damage_taken: Math.round(G.damageTaken || 0), modifier: G.modifier?.id || 'clear' }, G.wave);
  }
};
const applyChoiceV12 = applyChoice;
applyChoice = function applyChoiceV13(index) {
  const chosen = choices[index];
  if (chosen && state === 'upgrade') void sendRunEvent('upgrade_choice', { upgrade: chosen.id, next_rank: rank(chosen.id) + 1, rerolls_left: G.rerolls }, G.wave);
  applyChoiceV12(index); syncRunModeHud();
};
const refreshHUDV12 = refreshHUD;
refreshHUD = function refreshHUDV13() {
  refreshHUDV12(); syncRunModeHud();
  if (G?.boss && !G.boss.dead && $('bossName')) $('bossName').textContent = `${bossDisplayName(G.boss.stage)}${G.boss.hp < G.boss.maxHp * 0.48 ? ' / ENRAGED' : ''}`;
};
const updateBossV12 = updateBoss;
updateBoss = function updateBossV13(e, dt) {
  updateBossV12(e, dt);
  if (e.dead || e.warmup > 0 || state !== 'playing') return;
  if (e.signatureTell > 0) {
    const before = e.signatureTell; e.signatureTell -= dt;
    if (before > 0 && e.signatureTell <= 0) {
      const aim = Math.atan2(player.y - e.y, player.x - e.x);
      if (e.stage === 1) for (let i = 0; i < 6; i++) enemyBullet(e.x, e.y, i * TAU / 6 + e.rotation, 145, 5, e.color, 8);
      else if (e.stage === 2) for (const spread of [-0.24, -0.12, 0, 0.12, 0.24]) enemyBullet(e.x, e.y, aim + spread, 175, 5, e.color, 10);
      else for (let i = 0; i < 10; i++) enemyBullet(e.x, e.y, i * TAU / 10 + e.rotation, 185, 5, e.color, 11);
    }
    return;
  }
  e.signatureClock = (e.signatureClock ?? (4.8 + e.stage * 0.25)) - dt;
  if (e.signatureClock <= 0) { e.signatureClock = e.stage === 3 ? 4.4 : 5.2; e.signatureTell = 0.65; addRing(e.x, e.y, e.color, 180, 0.65, 5); }
};

const returnHomeV12 = returnHome;
returnHome = function returnHomeV13() {
  if (G && managedSession && !managedSession.finalizing && !managedSession.finalized && !G.careerFinalized) void sendRunEvent('run_abandon', { wave: G.wave, score: Math.floor(G.score) }, G.wave);
  clearCheckpoint(); returnHomeV12(); managedSession = null; activeMode = 'standard'; syncRunModeHud();
};

addEventListener('error', (event) => { if (managedSession && !managedSession.finalized) void sendRunEvent('client_error', { message: String(event.message || 'script error').slice(0, 96) }, G?.wave || 0); });
addEventListener('unhandledrejection', (event) => { if (managedSession && !managedSession.finalized) void sendRunEvent('client_error', { message: String(event.reason?.message || event.reason || 'promise rejection').slice(0, 96) }, G?.wave || 0); });
addEventListener('keydown', (event) => { if (state === 'career' && event.code === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeCareer(); } }, true);

ensureV13UI(); applyCareerTheme(); syncCheckpointButton();
