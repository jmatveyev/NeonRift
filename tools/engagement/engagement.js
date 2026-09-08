
// Career, retention, and playtest layer. This remains local unless an online backend is explicitly configured.
const CAREER_KEY = 'neon-rift-career-v1';
const CAREER_HISTORY_LIMIT = 25;
const CAREER_DEFAULTS = {
  version: 1, pilot: 'PILOT', xp: 0, totalRuns: 0, totalWins: 0, totalKills: 0,
  totalSeconds: 0, bestCombo: 0, winsByRig: { striker: 0, ghost: 0, bastion: 0 },
  achievements: {}, history: []
};
const ACHIEVEMENTS = [
  { id: 'first_signal', icon: '✦', name: 'FIRST SIGNAL', description: 'Finish your first recorded run.', test: () => career.totalRuns >= 1 },
  { id: 'chain_24', icon: '⟲', name: 'CHAIN REACTION', description: 'Reach a 24-kill combo.', test: (r) => career.bestCombo >= 24 || (r && r.maxCombo >= 24) },
  { id: 'century', icon: '100', name: 'CENTURY', description: 'Defeat 100 enemies in one run.', test: (r) => Boolean(r && r.kills >= 100) },
  { id: 'riftbreaker', icon: '◇', name: 'RIFTBREAKER', description: 'Clear all nine sectors.', test: () => career.totalWins >= 1 },
  { id: 'untouched', icon: '◈', name: 'GHOST RUN', description: 'Win without taking hull damage.', test: (r) => Boolean(r && r.won && r.damageTaken <= 0) },
  { id: 'veteran', icon: 'V', name: 'VETERAN', description: 'Finish 10 runs.', test: () => career.totalRuns >= 10 },
  { id: 'ace', icon: 'A', name: 'RIFT ACE', description: 'Score 50,000 points in one run.', test: (r) => Boolean(r && r.score >= 50000) },
  { id: 'trinity', icon: '△', name: 'TRINITY', description: 'Win with all three ships.', test: () => Object.values(career.winsByRig).every((n) => n > 0) }
];
let careerStorageAvailable = storageAvailable;
let career = loadCareer();
let careerReturnState = 'home';
let lastRunSummary = career.history[0] || null;

function cleanPilot(value) {
  const cleaned = String(value || '').toUpperCase().replace(/[^A-Z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return cleaned || 'PILOT';
}
function cleanHistoryEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: String(raw.id || '').slice(0, 48), playedAt: String(raw.playedAt || ''), pilot: cleanPilot(raw.pilot),
    score: Math.max(0, Math.floor(Number(raw.score) || 0)), kills: Math.max(0, Math.floor(Number(raw.kills) || 0)),
    sectors: Math.max(0, Math.floor(Number(raw.sectors) || 0)), seconds: Math.max(0, Number(raw.seconds) || 0),
    rig: RIGS[raw.rig] ? raw.rig : 'striker', maxCombo: Math.max(0, Math.floor(Number(raw.maxCombo) || 0)),
    damageTaken: Math.max(0, Math.round(Number(raw.damageTaken) || 0)), dashes: Math.max(0, Math.floor(Number(raw.dashes) || 0)),
    overdrives: Math.max(0, Math.floor(Number(raw.overdrives) || 0)), won: Boolean(raw.won), cause: String(raw.cause || '').slice(0, 80),
    xpGained: Math.max(0, Math.floor(Number(raw.xpGained) || 0)), upgrades: Array.isArray(raw.upgrades) ? raw.upgrades.slice(0, 24).map((u) => ({ name: String(u.name || '').slice(0, 32), rank: Math.max(1, Math.floor(Number(u.rank) || 1)) })) : []
  };
}
function loadCareer() {
  const result = { ...CAREER_DEFAULTS, winsByRig: { ...CAREER_DEFAULTS.winsByRig }, achievements: {}, history: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(CAREER_KEY) || '{}');
    if (!raw || typeof raw !== 'object') return result;
    result.pilot = cleanPilot(raw.pilot);
    for (const key of ['xp', 'totalRuns', 'totalWins', 'totalKills', 'totalSeconds', 'bestCombo']) {
      if (Number.isFinite(raw[key]) && raw[key] >= 0) result[key] = raw[key];
    }
    if (raw.winsByRig && typeof raw.winsByRig === 'object') for (const rig of Object.keys(result.winsByRig)) result.winsByRig[rig] = Math.max(0, Math.floor(Number(raw.winsByRig[rig]) || 0));
    if (raw.achievements && typeof raw.achievements === 'object') for (const item of ACHIEVEMENTS) if (raw.achievements[item.id]) result.achievements[item.id] = String(raw.achievements[item.id]);
    if (Array.isArray(raw.history)) result.history = raw.history.map(cleanHistoryEntry).filter(Boolean).slice(0, CAREER_HISTORY_LIMIT);
  } catch (_) { careerStorageAvailable = false; }
  return result;
}
function persistCareer() {
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(career)); }
  catch (_) { careerStorageAvailable = false; }
}
function levelFromXP(xp) { return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 900)); }
function levelFloor(level) { return Math.max(0, (level - 1) ** 2 * 900); }
function levelCeiling(level) { return level ** 2 * 900; }
function careerSnapshot() {
  return JSON.parse(JSON.stringify({ ...career, level: levelFromXP(career.xp), storageAvailable: careerStorageAvailable }));
}
function runXP(r) {
  return Math.max(50, Math.floor(r.score / 250) + r.kills * 2 + r.sectors * 120 + r.maxCombo * 3 + (r.won ? 1200 : 0));
}
function unlockCareerAchievements(summary) {
  const unlocked = [];
  for (const item of ACHIEVEMENTS) {
    if (!career.achievements[item.id] && item.test(summary)) {
      career.achievements[item.id] = new Date().toISOString();
      unlocked.push(item.name);
    }
  }
  return unlocked;
}
function recordCompletedRun(won, cause = '') {
  if (!G || !player) return;
  const summary = {
    id: `${Date.now().toString(36)}-${(G.seed >>> 0).toString(36)}`, playedAt: new Date().toISOString(), pilot: career.pilot,
    score: Math.floor(G.score), kills: G.kills, sectors: G.completed, seconds: G.elapsed, rig: player.rig,
    maxCombo: G.maxCombo, damageTaken: Math.max(0, Math.round(G.damageTaken || 0)), dashes: G.dashes || 0,
    overdrives: G.overdrives || 0, won: Boolean(won), cause: cause || '', upgrades: ALL_UPGRADES.filter((u) => rank(u.id)).map((u) => ({ name: u.name, rank: rank(u.id) }))
  };
  summary.xpGained = runXP(summary);
  career.xp += summary.xpGained;
  career.totalRuns++;
  career.totalWins += summary.won ? 1 : 0;
  career.totalKills += summary.kills;
  career.totalSeconds += summary.seconds;
  career.bestCombo = Math.max(career.bestCombo, summary.maxCombo);
  if (summary.won) career.winsByRig[summary.rig] = (career.winsByRig[summary.rig] || 0) + 1;
  career.history.unshift(summary);
  career.history = career.history.slice(0, CAREER_HISTORY_LIMIT);
  const unlocked = unlockCareerAchievements(summary);
  persistCareer();
  lastRunSummary = summary;
  void submitOnlineRun(summary);
  requestAnimationFrame(() => {
    updateResultCareer(summary, unlocked);
    syncCareerHome();
  });
}
function syncCareerHome() {
  if (!$('pilotHome')) return;
  $('pilotHome').textContent = career.pilot;
  $('levelHome').textContent = `LV ${levelFromXP(career.xp)}`;
  $('achievementHome').textContent = `${Object.keys(career.achievements).length}/${ACHIEVEMENTS.length} BADGES`;
}
function updateResultCareer(summary, unlocked = []) {
  if (!summary || !$('resultCareerBonus')) return;
  const badgeText = unlocked.length ? ` • BADGE: ${unlocked[0]}` : '';
  $('resultCareerBonus').textContent = `+${number(summary.xpGained)} CAREER XP • LEVEL ${levelFromXP(career.xp)}${badgeText}`;
}
function makeRunRow(run, index, ranked = false) {
  const row = document.createElement('div'); row.className = 'career-run';
  const rankEl = document.createElement('div'); rankEl.className = 'career-rank'; rankEl.textContent = ranked ? String(index + 1).padStart(2, '0') : '•';
  const main = document.createElement('div'); main.className = 'career-run-main';
  const name = document.createElement('strong'); name.textContent = `${run.pilot} / ${RIGS[run.rig]?.name || 'SHIP'}`;
  const meta = document.createElement('span'); meta.textContent = `${run.sectors} sectors • ${run.kills} kills • ${clockText(run.seconds)}${run.maxCombo ? ` • ${run.maxCombo} chain` : ''}`;
  main.append(name, meta);
  const score = document.createElement('div'); score.className = 'career-run-score'; score.textContent = number(run.score);
  const result = document.createElement('span'); result.className = `career-run-result${run.won ? ' win' : ''}`; result.textContent = run.won ? 'CLEARED' : 'LOST';
  row.append(rankEl, main, score, result); return row;
}
function renderCareer() {
  const level = levelFromXP(career.xp), floor = levelFloor(level), ceiling = levelCeiling(level);
  $('careerPilotInput').value = career.pilot;
  $('careerLevel').textContent = String(level).padStart(2, '0');
  $('careerXPText').textContent = `${number(career.xp - floor)} / ${number(ceiling - floor)} XP`;
  $('careerXPFill').style.width = `${clamp((career.xp - floor) / Math.max(1, ceiling - floor), 0, 1) * 100}%`;
  $('careerRuns').textContent = number(career.totalRuns); $('careerWins').textContent = number(career.totalWins);
  $('careerKills').textContent = number(career.totalKills); $('careerTime').textContent = clockText(career.totalSeconds);
  $('careerStorage').textContent = careerStorageAvailable ? 'LOCAL SAVE ACTIVE' : 'SESSION ONLY';
  const leaders = [...career.history].sort((a, b) => b.score - a.score || b.sectors - a.sectors).slice(0, 6);
  $('careerLeaderboard').replaceChildren(...(leaders.length ? leaders.map((r, i) => makeRunRow(r, i, true)) : [emptyCareer('NO RECORDED RUNS YET')]));
  const recent = career.history.slice(0, 5);
  $('careerHistory').replaceChildren(...(recent.length ? recent.map((r, i) => makeRunRow(r, i, false)) : [emptyCareer('FINISH A RUN TO START YOUR FLIGHT LOG')]));
  $('achievementGrid').replaceChildren(...ACHIEVEMENTS.map((item) => {
    const card = document.createElement('div'); card.className = `achievement${career.achievements[item.id] ? ' unlocked' : ''}`;
    const icon = document.createElement('div'); icon.className = 'achievement-icon'; icon.textContent = item.icon;
    const name = document.createElement('strong'); name.textContent = item.name;
    const desc = document.createElement('span'); desc.textContent = career.achievements[item.id] ? 'UNLOCKED' : item.description;
    card.append(icon, name, desc); return card;
  }));
  void refreshOnlineLeaderboard();
}
function emptyCareer(text) { const el = document.createElement('div'); el.className = 'career-empty'; el.textContent = text; return el; }
function openCareer(fromState = state) {
  careerReturnState = fromState;
  state = 'career'; renderCareer(); showScreen('careerScreen');
  requestAnimationFrame(() => $('careerPilotInput').focus({ preventScroll: true }));
}
function closeCareer() {
  const target = careerReturnState;
  state = target;
  if (target === 'dead' || target === 'won') showScreen('resultScreen');
  else { state = 'home'; showScreen('homeScreen'); syncHome(); }
}
function savePilotName() {
  const next = cleanPilot($('careerPilotInput').value);
  career.pilot = next; $('careerPilotInput').value = next; persistCareer(); syncCareerHome(); renderCareer();
}
function formatRun(summary) {
  if (!summary) return 'NEON RIFT — no completed run recorded yet.';
  return `${summary.pilot} scored ${number(summary.score)} in NEON RIFT — ${summary.kills} kills, ${summary.sectors} sectors, ${summary.maxCombo} best chain, ${summary.won ? 'RIFT CLEARED' : 'signal lost'}.`;
}
async function copyText(text, success) {
  try {
    await navigator.clipboard.writeText(text); toast(success, 2.4); return true;
  } catch (_) {
    try {
      const area = document.createElement('textarea'); area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select();
      const ok = document.execCommand('copy'); area.remove(); if (ok) { toast(success, 2.4); return true; }
    } catch (_) { /* Browser can block clipboard access. */ }
  }
  toast('COPY BLOCKED BY BROWSER. Your career is still saved locally.', 3.2); return false;
}
async function shareLastRun() {
  const summary = lastRunSummary || career.history[0];
  if (!summary) { toast('FINISH A RUN FIRST.', 2.2); return; }
  const text = formatRun(summary); const url = location.href.split('?')[0].split('#')[0];
  if (navigator.share) {
    try { await navigator.share({ title: 'NEON RIFT run', text, url }); return; } catch (_) { /* Fall back to copy when dismissed/unsupported. */ }
  }
  await copyText(`${text} ${url}`, 'RUN SUMMARY COPIED');
}
async function copyPlaytestData() {
  const payload = { game: 'NEON RIFT', format: 1, exportedAt: new Date().toISOString(), career: careerSnapshot() };
  await copyText(JSON.stringify(payload, null, 2), 'PLAYTEST DATA COPIED');
}

// Optional online leaderboard adapter. It sends nothing unless the page owner explicitly defines:
// window.NEON_RIFT_ONLINE = { enabled:true, url:'https://PROJECT.supabase.co', anonKey:'...', table:'runs' }
function onlineConfig() {
  const cfg = window.NEON_RIFT_ONLINE;
  return cfg && cfg.enabled === true && typeof cfg.url === 'string' && cfg.url && typeof cfg.anonKey === 'string' && cfg.anonKey ? { ...cfg, table: cfg.table || 'runs' } : null;
}
function onlineHeaders(cfg) { return { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' }; }
async function submitOnlineRun(summary) {
  const cfg = onlineConfig(); if (!cfg) return;
  const body = {
    run_id: summary.id, pilot: summary.pilot, score: summary.score, kills: summary.kills, sectors: summary.sectors,
    seconds: Math.round(summary.seconds), rig: summary.rig, max_combo: summary.maxCombo, won: summary.won, played_at: summary.playedAt
  };
  try {
    const response = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(cfg.table)}`, { method: 'POST', headers: { ...onlineHeaders(cfg), Prefer: 'return=minimal' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (_) { /* Online failure never blocks local play or local saving. */ }
}
async function refreshOnlineLeaderboard() {
  if (!$('cloudStatus')) return;
  const cfg = onlineConfig();
  if (!cfg) {
    $('cloudStatus').textContent = 'ONLINE LEADERBOARD READY • BACKEND NOT CONNECTED'; $('cloudStatus').className = 'cloud-offline';
    $('cloudLeaderboard').replaceChildren(emptyCareer('LOCAL CAREER IS ACTIVE. CONNECT THE OPTIONAL BACKEND TO COMBINE SCORES ACROSS PLAYERS.')); return;
  }
  $('cloudStatus').textContent = 'SYNCING COMMUNITY BOARD…'; $('cloudStatus').className = 'cloud-online';
  try {
    const fields = 'pilot,score,kills,sectors,seconds,rig,max_combo,won,played_at';
    const response = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(cfg.table)}?select=${fields}&order=score.desc&limit=10`, { headers: onlineHeaders(cfg) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    const mapped = Array.isArray(rows) ? rows.map((r, i) => cleanHistoryEntry({ id: `cloud-${i}`, pilot: r.pilot, score: r.score, kills: r.kills, sectors: r.sectors, seconds: r.seconds, rig: r.rig, maxCombo: r.max_combo, won: r.won, playedAt: r.played_at })) : [];
    $('cloudLeaderboard').replaceChildren(...(mapped.length ? mapped.map((r, i) => makeRunRow(r, i, true)) : [emptyCareer('NO COMMUNITY RUNS YET')]));
    $('cloudStatus').textContent = 'COMMUNITY BOARD ONLINE'; $('cloudStatus').className = 'cloud-online';
  } catch (_) {
    $('cloudStatus').textContent = 'COMMUNITY BOARD UNAVAILABLE • LOCAL SAVE UNAFFECTED'; $('cloudStatus').className = 'cloud-offline';
    $('cloudLeaderboard').replaceChildren(emptyCareer('COULD NOT REACH THE OPTIONAL LEADERBOARD SERVICE.'));
  }
}

$('profileBtn').addEventListener('click', () => openCareer('home'));
$('resultCareerBtn').addEventListener('click', () => openCareer(state));
$('careerBackBtn').addEventListener('click', closeCareer);
$('careerPilotInput').addEventListener('change', savePilotName);
$('careerPilotInput').addEventListener('blur', savePilotName);
$('careerPilotInput').addEventListener('keydown', (event) => { event.stopPropagation(); if (event.code === 'Enter') { event.preventDefault(); savePilotName(); $('careerPilotInput').blur(); } });
$('shareRunBtn').addEventListener('click', () => { void shareLastRun(); });
$('resultShareBtn').addEventListener('click', () => { void shareLastRun(); });
$('copyPlaytestBtn').addEventListener('click', () => { void copyPlaytestData(); });

