from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parents[2]
SRC_HASH = '0cc4b8a9564e26faef1314ff216fb8dcb16d732b'
ONLINE_CONFIG = '''<script>
window.NEON_RIFT_ONLINE = {
  enabled: true,
  url: 'https://pjkdwekdtyzoqtrnhwaa.supabase.co',
  publishableKey: 'sb_publishable_ew8oU5Zyzg8Wwq8aRCKbnw_EBb4ASGp',
  table: 'runs',
  function: 'game-session'
};
</script>'''

def blob(data: bytes) -> str:
    return hashlib.sha1((f'blob {len(data)}\0').encode() + data).hexdigest()

def once(text: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'Expected exactly one match, found {count}: {old[:90]!r}')
    return text.replace(old, new)

source = (ROOT / 'index.html').read_bytes()
if blob(source) != SRC_HASH:
    raise RuntimeError('Career layer expects the tested Neon Rift 1.1.1 music-default build. Refusing to patch an unknown release.')
text = source.decode()
css = (ROOT / 'tools/engagement/engagement.css').read_text()
v13_css = (ROOT / 'tools/engagement/v13.css').read_text()
js = (ROOT / 'tools/engagement/engagement.js').read_text()
v13_js = (ROOT / 'tools/engagement/v13.js').read_text()
# The 1.3 module is injected before the legacy career initializer reaches its final statements.
# Defer its first UI/theme read until this synchronous script has finished initializing career.
v13_js = once(
    v13_js,
    'ensureV13UI(); applyCareerTheme(); syncCheckpointButton();',
    'queueMicrotask(() => { ensureV13UI(); applyCareerTheme(); syncCheckpointButton(); });'
)

text = once(text, '<meta name="application-version" content="1.1.0-mobile">', '<meta name="application-version" content="1.3.0">')
text = once(text, '</head>', ONLINE_CONFIG + '\n</head>')
text = once(text, '</style>', css + '\n' + v13_css + '\n</style>')
text = once(text,
    '<div class="home-stats"><div class="home-stat"><strong id="bestHome">0</strong><span>PERSONAL BEST</span></div><div class="home-stat"><strong id="runsHome">0</strong><span>RUNS STARTED</span></div><div class="home-stat"><strong id="winsHome">0</strong><span>RIFTS CLEARED</span></div></div>',
    '<div class="home-stats"><div class="home-stat"><strong id="bestHome">0</strong><span>PERSONAL BEST</span></div><div class="home-stat"><strong id="runsHome">0</strong><span>RUNS STARTED</span></div><div class="home-stat"><strong id="winsHome">0</strong><span>RIFTS CLEARED</span></div></div><div class="career-strip"><button id="profileBtn">PILOT PROFILE</button><span class="career-chip"><span>PILOT</span><b id="pilotHome">PILOT</b></span><span class="career-chip"><b id="levelHome">LV 1</b></span><span class="career-chip"><b id="achievementHome">0/8 BADGES</b></span></div>')

career_screen = '''
<section class="screen" id="careerScreen" hidden aria-label="Pilot career and run history"><div class="panel career-panel">
 <div class="career-head"><div><span class="tag">PILOT CAREER / LOCAL PROFILE</span><h2>Your signal persists.</h2><p>Career progress stays in this browser. A private anonymous player signal links only verified community run summaries. No login required.</p></div><span class="career-status" id="careerStorage">LOCAL SAVE ACTIVE</span></div>
 <div class="career-grid">
  <div class="career-card"><h3>PILOT IDENTITY</h3><input id="careerPilotInput" class="pilot-input" maxlength="16" autocomplete="off" spellcheck="false" aria-label="Pilot name"><div class="career-level-row"><div><span>CAREER LEVEL</span><strong id="careerLevel">01</strong></div><span id="careerXPText">0 / 900 XP</span></div><div class="xp-track"><div id="careerXPFill"></div></div><div class="career-stat-grid"><div class="career-stat"><strong id="careerRuns">0</strong><span>RECORDED RUNS</span></div><div class="career-stat"><strong id="careerWins">0</strong><span>RIFTS CLEARED</span></div><div class="career-stat"><strong id="careerKills">0</strong><span>TOTAL KILLS</span></div><div class="career-stat"><strong id="careerTime">0:00</strong><span>FLIGHT TIME</span></div></div><div class="career-actions"><button class="secondary" id="shareRunBtn">Share latest run</button><button class="secondary" id="copyPlaytestBtn">Copy playtest data</button></div></div>
  <div class="career-card"><div class="career-section-title"><h3>LOCAL LEADERBOARD</h3><span>THIS BROWSER</span></div><div class="career-list" id="careerLeaderboard"></div><div class="cloud-board"><div class="career-section-title"><h3>COMMUNITY LEADERBOARD</h3><span id="cloudStatus" class="cloud-offline">CONNECTING</span></div><div class="career-list" id="cloudLeaderboard"></div></div></div>
  <div class="career-card"><div class="career-section-title"><h3>ACHIEVEMENTS</h3><span>8 SIGNAL BADGES</span></div><div class="achievement-grid" id="achievementGrid"></div></div>
  <div class="career-card"><div class="career-section-title"><h3>RECENT FLIGHT LOG</h3><span>LAST 5</span></div><div class="career-list" id="careerHistory"></div></div>
 </div>
 <div class="career-foot"><span class="career-note">Personal bests, settings, career XP, cosmetics, and checkpoints stay local. Community boards receive only validated run summaries; telemetry records anonymous gameplay events used for balancing.</span><button class="primary" id="careerBackBtn">BACK <span class="arrow" aria-hidden="true">&#x2192;</span></button></div>
</div></section>
'''
text = once(text, '<section class="screen" id="resultScreen"', career_screen + '<section class="screen" id="resultScreen"')
text = once(text,
    '<div class="result-build" id="resultBuild"></div><button class="primary" id="retryBtn">',
    '<div class="result-build" id="resultBuild"></div><div class="run-bonus" id="resultCareerBonus">CAREER XP WILL BE RECORDED</div><div class="result-career-actions"><button class="secondary" id="resultCareerBtn">Pilot profile</button><button class="secondary" id="resultShareBtn">Share this run</button></div><button class="primary" id="retryBtn">')

# Career screen integration and mobile HUD correctness.
text = once(text,
    "for (const id of ['homeScreen', 'pauseScreen', 'upgradeScreen', 'resultScreen'])",
    "for (const id of ['homeScreen', 'pauseScreen', 'upgradeScreen', 'careerScreen', 'resultScreen'])")
text = once(text,
    "const inRun = !['home', 'manual'].includes(state);",
    "const inRun = !['home', 'manual', 'career'].includes(state);")

# Deterministic managed-run entry point. The original no-argument behavior remains valid for QA/offline fallback.
text = once(text,
    "function startRun() {\n  unlockAudio();\n  const seed = (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;\n  rng = seededRandom(seed);",
    "function startRun(forcedSeed = null, restoring = false) {\n  unlockAudio();\n  const seed = forcedSeed == null ? (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0 : (Number(forcedSeed) >>> 0);\n  rng = typeof trackedSeededRandom === 'function' ? trackedSeededRandom(seed) : seededRandom(seed);")
text = once(text,
    "endless: false, won: false, recordStart: save.best, tutorial: false, testInvulnerable: false };",
    "endless: false, won: false, recordStart: save.best, tutorial: false, testInvulnerable: false, damageTaken: 0, dashes: 0, overdrives: 0, rngCalls: 0, mode: 'standard', challengeDate: null, modifier: null, careerFinalized: false };")
text = once(text,
    "  recalc();\n  save.runs++; save.rig = selectedRig; persist();\n  state = 'playing'; showScreen(null); $('toast').classList.remove('visible'); toastTime = 0;\n  nextSector(); refreshHUD();",
    "  recalc();\n  state = 'playing'; showScreen(null); $('toast').classList.remove('visible'); toastTime = 0;\n  if (!restoring) { save.runs++; save.rig = selectedRig; persist(); nextSector(); }\n  refreshHUD();")
text = once(text,
    "$('startBtn').addEventListener('click', startRun);\n$('retryBtn').addEventListener('click', startRun);",
    "$('startBtn').addEventListener('click', () => { if (typeof startManagedRun === 'function') void startManagedRun('standard'); else startRun(); });\n$('retryBtn').addEventListener('click', () => { if (typeof startManagedRun === 'function') void startManagedRun(typeof lastMode === 'string' ? lastMode : 'standard'); else startRun(); });")
# Dispatch through the current returnHome binding so the 1.3 wrapper can clear checkpoints and emit abandonment telemetry.
text = once(text,
    "$('hangarBtn').addEventListener('click', returnHome);\n$('quitBtn').addEventListener('click', returnHome);",
    "$('hangarBtn').addEventListener('click', () => returnHome());\n$('quitBtn').addEventListener('click', () => returnHome());")

# Existing career instrumentation.
text = once(text,
    "player.hp = Math.max(0, player.hp - amount); player.invul = 0.9;",
    "const beforeHp = player.hp; player.hp = Math.max(0, player.hp - amount); G.damageTaken += beforeHp - player.hp; player.invul = 0.9;")
text = once(text,
    "player.dashTime = 0.18; player.dashCooldown = player.dashMax; player.invul = Math.max(player.invul, 0.28);",
    "player.dashTime = 0.18; player.dashCooldown = player.dashMax; player.invul = Math.max(player.invul, 0.28); G.dashes++;")
text = once(text,
    "player.energy = 0; player.readyAnnounced = false; player.overdrive = 4 + rank('reactor');",
    "player.energy = 0; player.readyAnnounced = false; player.overdrive = 4 + rank('reactor'); G.overdrives++;")
text = once(text,
    "state = won ? 'won' : 'dead'; saveRecord();",
    "state = won ? 'won' : 'dead'; saveRecord(); recordCompletedRun(won, cause);")

# Sector modifiers affect the actual simulation, not merely the label on the HUD.
text = once(text,
    "G.duration = Math.min(38, 22 + G.wave * 1.5); G.waveTime = G.duration; G.spawnClock = 0.45;",
    "G.duration = Math.min(38, 22 + G.wave * 1.5); G.waveTime = G.duration; G.spawnClock = 0.45;\n  if (typeof applySectorModifier === 'function') applySectorModifier();")
text = once(text,
    "speed: 45 + Math.min(stage, 7) * 5, color:",
    "speed: (45 + Math.min(stage, 7) * 5) * (typeof sectorEnemySpeed === 'function' ? sectorEnemySpeed() : 1), color:")
text = once(text,
    "speed: spec.speed * (1 + Math.min(G.wave - 1, 18) * 0.025), color:",
    "speed: spec.speed * (1 + Math.min(G.wave - 1, 18) * 0.025) * (typeof sectorEnemySpeed === 'function' ? sectorEnemySpeed() : 1), color:")
text = once(text,
    "vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: radius, color, damage, life: 7.5",
    "vx: Math.cos(angle) * speed * (typeof sectorBulletSpeed === 'function' ? sectorBulletSpeed() : 1), vy: Math.sin(angle) * speed * (typeof sectorBulletSpeed === 'function' ? sectorBulletSpeed() : 1), r: radius, color, damage, life: 7.5")
text = once(text,
    "G.spawnClock = Math.max(0.30, 0.92 / (1 + (G.wave - 1) * 0.12));",
    "G.spawnClock = Math.max(0.30, 0.92 / ((1 + (G.wave - 1) * 0.12) * (typeof sectorSpawnPressure === 'function' ? sectorSpawnPressure() : 1)));" )
text = once(text,
    "const repaired = Math.min(18, player.maxHp - player.hp); player.hp += repaired;",
    "const repaired = Math.min(typeof sectorRepairAmount === 'function' ? sectorRepairAmount() : 18, player.maxHp - player.hp); player.hp += repaired;")
text = once(text,
    "$('endlessBtn').hidden = !won;",
    "$('endlessBtn').hidden = !won || (typeof activeMode !== 'undefined' && activeMode === 'daily');")

# Modern publishable-key compatible fallback adapter. v1.3 replaces score writes with the managed Edge Function.
old_adapter = """function onlineConfig() {
  const cfg = window.NEON_RIFT_ONLINE;
  return cfg && cfg.enabled === true && typeof cfg.url === 'string' && cfg.url && typeof cfg.anonKey === 'string' && cfg.anonKey ? { ...cfg, table: cfg.table || 'runs' } : null;
}
function onlineHeaders(cfg) { return { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' }; }"""
new_adapter = """function onlineConfig() {
  const cfg = window.NEON_RIFT_ONLINE;
  const key = cfg && (cfg.publishableKey || cfg.anonKey);
  return cfg && cfg.enabled === true && typeof cfg.url === 'string' && cfg.url && typeof key === 'string' && key ? { ...cfg, key, table: cfg.table || 'runs' } : null;
}
function onlineHeaders(cfg) {
  const headers = { apikey: cfg.key, 'Content-Type': 'application/json' };
  if (cfg.key.startsWith('eyJ')) headers.Authorization = `Bearer ${cfg.key}`;
  return headers;
}"""

# Inject the career + 1.3 runtime before the opt-in QA hook, then modernize the embedded fallback adapter.
text = once(text,
    '// Explicitly opt-in deterministic inspection hooks for browser QA. Absent in normal play.',
    js + '\n' + v13_js + '\n// Explicitly opt-in deterministic inspection hooks for browser QA. Absent in normal play.')
text = once(text, old_adapter, new_adapter)
text = once(text,
    'save: { ...save }, storageAvailable,',
    "save: { ...save }, storageAvailable, career: careerSnapshot(), mode: G?.mode || 'standard', challengeDate: G?.challengeDate || null, modifier: G?.modifier?.id || null,")
text = once(text,
    "syncSettings(); syncHome(); showScreen('homeScreen');",
    "syncSettings(); syncHome(); showScreen('homeScreen'); queueMicrotask(() => syncCareerHome());")

output = text.encode()
for name in ['index.html', 'neon-rift.html']:
    (ROOT / name).write_bytes(output)
print('Neon Rift 1.3 release blob:', blob(output))
print('Neon Rift 1.3 release bytes:', len(output))
