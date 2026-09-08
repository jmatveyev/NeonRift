from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parents[2]
SRC_HASH = '0cc4b8a9564e26faef1314ff216fb8dcb16d732b'
ONLINE_CONFIG = '''<script>
window.NEON_RIFT_ONLINE = {
  enabled: true,
  url: 'https://pjkdwekdtyzoqtrnhwaa.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqa2R3ZWtkdHl6b3F0cm5od2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjE5OTEsImV4cCI6MjEwNDM5Nzk5MX0.bdxTvio835csAibaAAVYz0lQiaraBzEC_VNrP84A6Mg',
  table: 'runs'
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
js = (ROOT / 'tools/engagement/engagement.js').read_text()

text = once(text, '<meta name="application-version" content="1.1.0-mobile">', '<meta name="application-version" content="1.2.0-career">')
text = once(text, '</head>', ONLINE_CONFIG + '\n</head>')
text = once(text, '</style>', css + '\n</style>')
text = once(text,
    '<div class="home-stats"><div class="home-stat"><strong id="bestHome">0</strong><span>PERSONAL BEST</span></div><div class="home-stat"><strong id="runsHome">0</strong><span>RUNS STARTED</span></div><div class="home-stat"><strong id="winsHome">0</strong><span>RIFTS CLEARED</span></div></div>',
    '<div class="home-stats"><div class="home-stat"><strong id="bestHome">0</strong><span>PERSONAL BEST</span></div><div class="home-stat"><strong id="runsHome">0</strong><span>RUNS STARTED</span></div><div class="home-stat"><strong id="winsHome">0</strong><span>RIFTS CLEARED</span></div></div><div class="career-strip"><button id="profileBtn">PILOT PROFILE</button><span class="career-chip"><span>PILOT</span><b id="pilotHome">PILOT</b></span><span class="career-chip"><b id="levelHome">LV 1</b></span><span class="career-chip"><b id="achievementHome">0/8 BADGES</b></span></div>')

career_screen = '''
<section class="screen" id="careerScreen" hidden aria-label="Pilot career and run history"><div class="panel career-panel">
 <div class="career-head"><div><span class="tag">PILOT CAREER / LOCAL PROFILE</span><h2>Your signal persists.</h2><p>Scores, badges, and run history live in this browser. No account required.</p></div><span class="career-status" id="careerStorage">LOCAL SAVE ACTIVE</span></div>
 <div class="career-grid">
  <div class="career-card"><h3>PILOT IDENTITY</h3><input id="careerPilotInput" class="pilot-input" maxlength="16" autocomplete="off" spellcheck="false" aria-label="Pilot name"><div class="career-level-row"><div><span>CAREER LEVEL</span><strong id="careerLevel">01</strong></div><span id="careerXPText">0 / 900 XP</span></div><div class="xp-track"><div id="careerXPFill"></div></div><div class="career-stat-grid"><div class="career-stat"><strong id="careerRuns">0</strong><span>RECORDED RUNS</span></div><div class="career-stat"><strong id="careerWins">0</strong><span>RIFTS CLEARED</span></div><div class="career-stat"><strong id="careerKills">0</strong><span>TOTAL KILLS</span></div><div class="career-stat"><strong id="careerTime">0:00</strong><span>FLIGHT TIME</span></div></div><div class="career-actions"><button class="secondary" id="shareRunBtn">Share latest run</button><button class="secondary" id="copyPlaytestBtn">Copy playtest data</button></div></div>
  <div class="career-card"><div class="career-section-title"><h3>LOCAL LEADERBOARD</h3><span>THIS BROWSER</span></div><div class="career-list" id="careerLeaderboard"></div><div class="cloud-board"><div class="career-section-title"><h3>COMMUNITY LEADERBOARD</h3><span id="cloudStatus" class="cloud-offline">BACKEND NOT CONNECTED</span></div><div class="career-list" id="cloudLeaderboard"></div></div></div>
  <div class="career-card"><div class="career-section-title"><h3>ACHIEVEMENTS</h3><span>8 SIGNAL BADGES</span></div><div class="achievement-grid" id="achievementGrid"></div></div>
  <div class="career-card"><div class="career-section-title"><h3>RECENT FLIGHT LOG</h3><span>LAST 5</span></div><div class="career-list" id="careerHistory"></div></div>
 </div>
 <div class="career-foot"><span class="career-note">Career data is separate from the original Neon Rift save, so existing personal bests and settings remain intact. Community leaderboard submissions contain only the run summary shown here.</span><button class="primary" id="careerBackBtn">BACK <span class="arrow" aria-hidden="true">&#x2192;</span></button></div>
</div></section>
'''
text = once(text, '<section class="screen" id="resultScreen"', career_screen + '<section class="screen" id="resultScreen"')
text = once(text,
    '<div class="result-build" id="resultBuild"></div><button class="primary" id="retryBtn">',
    '<div class="result-build" id="resultBuild"></div><div class="run-bonus" id="resultCareerBonus">CAREER XP WILL BE RECORDED</div><div class="result-career-actions"><button class="secondary" id="resultCareerBtn">Pilot profile</button><button class="secondary" id="resultShareBtn">Share this run</button></div><button class="primary" id="retryBtn">')
text = once(text,
    "for (const id of ['homeScreen', 'pauseScreen', 'upgradeScreen', 'resultScreen'])",
    "for (const id of ['homeScreen', 'pauseScreen', 'upgradeScreen', 'careerScreen', 'resultScreen'])")
text = once(text,
    "endless: false, won: false, recordStart: save.best, tutorial: false, testInvulnerable: false };",
    "endless: false, won: false, recordStart: save.best, tutorial: false, testInvulnerable: false, damageTaken: 0, dashes: 0, overdrives: 0 };")
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
text = once(text,
    '// Explicitly opt-in deterministic inspection hooks for browser QA. Absent in normal play.',
    js + '\n// Explicitly opt-in deterministic inspection hooks for browser QA. Absent in normal play.')
text = once(text,
    'save: { ...save }, storageAvailable,',
    'save: { ...save }, storageAvailable, career: careerSnapshot(),')
text = once(text,
    "syncSettings(); syncHome(); showScreen('homeScreen');",
    "syncSettings(); syncHome(); syncCareerHome(); showScreen('homeScreen');")

output = text.encode()
for name in ['index.html', 'neon-rift.html']:
    (ROOT / name).write_bytes(output)
print('Career release blob:', blob(output))
print('Career release bytes:', len(output))
