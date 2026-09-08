// NEON RIFT 1.3.1 - louder mobile mix, callsign onboarding and visible ranked Endless mode.
const V131_VERSION = '1.3.1';
const PILOT_CONFIRM_KEY = 'neon-rift-pilot-confirmed-v1';
let pendingPilotMode = null;
let v131Limiter = null;

function validRunMode(mode) { return ['standard', 'endless', 'daily'].includes(mode) ? mode : 'standard'; }
function pilotConfirmed() {
  if (career.pilot !== 'PILOT') {
    try { localStorage.setItem(PILOT_CONFIRM_KEY, '1'); } catch (_) { /* Local career still works. */ }
    return true;
  }
  try { return localStorage.getItem(PILOT_CONFIRM_KEY) === '1'; } catch (_) { return false; }
}
function confirmPilot() { try { localStorage.setItem(PILOT_CONFIRM_KEY, '1'); } catch (_) { /* Session can continue. */ } }
function promptPilot(mode) {
  ensureV131UI();
  pendingPilotMode = validRunMode(mode);
  const prompt = $('pilotPrompt');
  const input = $('pilotPromptInput');
  $('pilotPromptError').textContent = '';
  input.value = career.pilot === 'PILOT' ? '' : career.pilot;
  prompt.hidden = false;
  requestAnimationFrame(() => input.focus({ preventScroll: true }));
}
function closePilotPrompt() { pendingPilotMode = null; if ($('pilotPrompt')) $('pilotPrompt').hidden = true; }
function submitPilotPrompt() {
  const raw = String($('pilotPromptInput').value || '').toUpperCase().replace(/[^A-Z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!raw) { $('pilotPromptError').textContent = 'ENTER A CALLSIGN TO CONTINUE.'; return; }
  career.pilot = raw;
  career.history = career.history.map((run) => run.pilot === 'PILOT' ? { ...run, pilot: raw } : run);
  if (lastRunSummary?.pilot === 'PILOT') lastRunSummary = { ...lastRunSummary, pilot: raw };
  persistCareer(); confirmPilot(); syncCareerHome();
  if ($('careerPilotInput')) $('careerPilotInput').value = raw;
  const mode = pendingPilotMode || 'standard'; pendingPilotMode = null; $('pilotPrompt').hidden = true;
  void startManagedRunV131Core(mode);
}

// The 1.3 entry point accepted only standard/daily. 1.3.1 makes Endless a first-class managed mode.
async function startManagedRunV131Core(mode = 'standard') {
  const normalized = validRunMode(mode);
  if (startingManagedRun) return;
  startingManagedRun = true; activeMode = normalized; lastMode = normalized;
  clearCheckpoint();
  const button = normalized === 'daily' ? $('dailyRunBtn') : normalized === 'endless' ? $('endlessRunBtn') : $('startBtn');
  const oldText = button?.innerHTML; if (button) { button.disabled = true; button.textContent = 'LINKING SIGNAL...'; }
  let seed = normalized === 'daily' ? dailySeedClient() : null;
  managedSession = null;
  try {
    const session = await callGameSession('start', {
      player_id: playerIdentity.playerId, pilot: career.pilot, rig: selectedRig, mode: normalized,
      game_version: V131_VERSION, platform: platformLabel()
    });
    seed = Number(session.seed) >>> 0;
    managedSession = { runId: session.run_id, token: session.token, seed, mode: session.mode, challengeDate: session.challenge_date || null, finalizing: false, finalized: false };
  } catch (_) {
    const label = normalized === 'daily' ? 'DAILY PRACTICE' : normalized === 'endless' ? 'ENDLESS LOCAL' : 'STANDARD LOCAL';
    toast(`${label} MODE - COMMUNITY SYNC UNAVAILABLE`, 3.4);
  }
  startRun(seed, false);
  if (G) {
    G.endless = normalized === 'endless'; G.mode = normalized;
    G.challengeDate = managedSession?.challengeDate || (normalized === 'daily' ? todayUTC() : null);
  }
  syncRunModeHud();
  if (button) { button.disabled = false; if (oldText) button.innerHTML = oldText; }
  startingManagedRun = false;
}
startManagedRun = async function startManagedRunV131(mode = 'standard') {
  const normalized = validRunMode(mode);
  if (!pilotConfirmed()) { promptPilot(normalized); return; }
  return startManagedRunV131Core(normalized);
};

// Mobile WebAudio mix: the old master was 0.32, then music was mixed at values as low as 0.036.
// Raise usable level on phone speakers and compress peaks instead of simply clipping the summed signal.
const unlockAudioV130 = unlockAudio;
unlockAudio = function unlockAudioV131() {
  unlockAudioV130();
  if (!audioCtx || !master) return;
  try {
    if (!v131Limiter) {
      master.disconnect();
      v131Limiter = audioCtx.createDynamicsCompressor();
      v131Limiter.threshold.value = -10;
      v131Limiter.knee.value = 10;
      v131Limiter.ratio.value = 8;
      v131Limiter.attack.value = 0.003;
      v131Limiter.release.value = 0.16;
      master.connect(v131Limiter); v131Limiter.connect(audioCtx.destination);
    }
    master.gain.setTargetAtTime(coarse ? 0.78 : 0.42, audioCtx.currentTime, 0.015);
  } catch (_) { master.gain.value = coarse ? 0.72 : 0.40; }
};
const toneV130 = tone;
tone = function toneV131(freq, duration = 0.1, type = 'sine', volume = 0.1, endFreq = null, delay = 0, musical = false) {
  let adjustedFreq = freq, adjustedVolume = volume;
  if (coarse) {
    if (musical && adjustedFreq < 75) adjustedFreq *= 2;
    adjustedVolume *= musical ? 1.35 : 1.18;
  }
  return toneV130(adjustedFreq, duration, type, Math.min(0.34, adjustedVolume), endFreq, delay, musical);
};

// Mark 1.3.1 submissions correctly even though the underlying career recorder is shared with 1.3.
submitOnlineRun = async function submitManagedRunV131(summary) {
  if (!managedSession || managedSession.finalized || managedSession.finalizing) return;
  managedSession.finalizing = true;
  try {
    await callGameSession('finish', {
      run_id: managedSession.runId, token: managedSession.token, score: summary.score, kills: summary.kills, sectors: summary.sectors,
      seconds: Math.round(summary.seconds), max_combo: summary.maxCombo, won: activeMode === 'endless' ? false : summary.won,
      damage_taken: summary.damageTaken, dashes: summary.dashes, overdrives: summary.overdrives, game_version: V131_VERSION,
      telemetry: { cause: summary.cause, upgrades: summary.upgrades.map((u) => `${u.name}:${u.rank}`), modifier: G?.modifier?.id || null, platform: platformLabel() }
    }, 6000);
    managedSession.finalized = true;
  } catch (_) { managedSession.finalizing = false; }
};

const syncRunModeHudV130 = syncRunModeHud;
syncRunModeHud = function syncRunModeHudV131() {
  if (!$('runModeHud')) return;
  if (!G || !['playing','paused','upgrade'].includes(state)) { $('runModeHud').textContent = ''; return; }
  const modifier = G.modifier || sectorModifier(G.seed, Math.max(1, G.wave));
  const label = activeMode === 'daily' ? 'DAILY' : activeMode === 'endless' ? 'ENDLESS' : 'STANDARD';
  $('runModeHud').textContent = `${label} / ${modifier.name}`;
  $('runModeHud').title = modifier.detail;
};

function ensureV131UI() {
  if ($('startBtn')) $('startBtn').innerHTML = 'STANDARD RUN <span class="arrow" aria-hidden="true">&#x2192;</span>';
  if ($('dailyRunBtn')) $('dailyRunBtn').innerHTML = `DAILY SIGNAL <small>${todayUTC()} UTC / SAME SEED FOR EVERY PILOT</small>`;
  if (!$('endlessRunBtn') && $('dailyRunBtn')) {
    const endless = document.createElement('button'); endless.id = 'endlessRunBtn'; endless.type = 'button'; endless.className = 'secondary v131-endless';
    endless.innerHTML = 'ENDLESS RUN <small>SECTOR 1 / SURVIVE UNTIL DEFEAT</small>';
    endless.addEventListener('click', () => { void startManagedRun('endless'); });
    const current = $('dailyRunBtn').parentElement;
    const grid = document.createElement('div'); grid.className = 'v131-mode-grid';
    current.parentElement.insertBefore(grid, current); grid.append(endless, $('dailyRunBtn'));
  }
  if (!$('pilotPrompt')) {
    const prompt = document.createElement('div'); prompt.id = 'pilotPrompt'; prompt.className = 'v131-pilot-prompt'; prompt.hidden = true;
    prompt.innerHTML = '<div class="v131-pilot-card" role="dialog" aria-modal="true" aria-labelledby="pilotPromptTitle"><span class="tag">PILOT IDENTIFICATION</span><h2 id="pilotPromptTitle">Choose your callsign.</h2><p>This is the name shown on community leaderboards. You can change it later in Pilot Profile.</p><input id="pilotPromptInput" class="v131-pilot-input" maxlength="16" autocomplete="off" spellcheck="false" inputmode="text" aria-label="Pilot callsign"><div id="pilotPromptError" class="v131-pilot-error" aria-live="polite"></div><div class="v131-pilot-actions"><button class="primary" id="pilotPromptConfirm">START RUN <span class="arrow" aria-hidden="true">&#x2192;</span></button><button class="secondary" id="pilotPromptCancel">CANCEL</button></div></div>';
    document.body.appendChild(prompt);
    $('pilotPromptConfirm').addEventListener('click', submitPilotPrompt);
    $('pilotPromptCancel').addEventListener('click', closePilotPrompt);
    $('pilotPromptInput').addEventListener('input', () => { $('pilotPromptInput').value = $('pilotPromptInput').value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 16); $('pilotPromptError').textContent = ''; });
    $('pilotPromptInput').addEventListener('keydown', (event) => { event.stopPropagation(); if (event.code === 'Enter') { event.preventDefault(); submitPilotPrompt(); } else if (event.code === 'Escape') { event.preventDefault(); closePilotPrompt(); } });
  }
  if (!$('endlessLeaderboard') && $('dailyLeaderboard')) {
    const board = document.createElement('div'); board.className = 'cloud-board v131-endless-board';
    board.innerHTML = '<div class="career-section-title"><h3>ENDLESS LEADERBOARD</h3><span id="endlessStatus" class="cloud-offline">ALL TIME</span></div><div class="career-list" id="endlessLeaderboard"></div>';
    $('dailyLeaderboard').closest('.cloud-board')?.before(board);
  }
  if ($('endlessBtn') && $('retryBtn')) {
    $('endlessBtn').textContent = 'CONTINUE INTO ENDLESS'; $('endlessBtn').classList.add('v131-postwin-endless');
    const panel = $('resultScreen').querySelector('.panel');
    if (!$('postWinEndlessNote')) { const note = document.createElement('div'); note.id = 'postWinEndlessNote'; note.className = 'v131-postwin-note'; note.textContent = 'KEEP YOUR BUILD / UNRANKED CONTINUATION'; panel.insertBefore(note, $('endlessBtn')); }
    panel.insertBefore($('endlessBtn'), $('retryBtn'));
    $('postWinEndlessNote').hidden = $('endlessBtn').hidden;
  }
}
function syncPostWinEndless() {
  ensureV131UI();
  const visible = state === 'won' && activeMode === 'standard';
  $('endlessBtn').hidden = !visible; $('postWinEndlessNote').hidden = !visible;
  if (visible) focusButton('endlessBtn');
}
const endRunV131Base = endRun;
endRun = function endRunV131(won, cause = '') { endRunV131Base(won, cause); syncPostWinEndless(); };

const refreshOnlineLeaderboardV131Base = refreshOnlineLeaderboard;
refreshOnlineLeaderboard = async function refreshOnlineLeaderboardV131() {
  ensureV131UI(); await refreshOnlineLeaderboardV131Base();
  const cfg = onlineConfigV13();
  if (!cfg || !$('endlessLeaderboard')) return;
  $('endlessStatus').textContent = 'SYNCING...';
  try {
    const fields = 'pilot,score,kills,sectors,seconds,rig,max_combo,won,played_at,mode,challenge_date';
    const base = `${cfg.url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(cfg.table)}`;
    const response = await fetch(`${base}?select=${fields}&mode=eq.endless&order=score.desc,sectors.desc&limit=10`, { headers: { apikey: cfg.key } });
    if (!response.ok) throw new Error('endless_board_failed');
    const rows = await response.json();
    const mapped = Array.isArray(rows) ? rows.map((r, i) => cleanHistoryEntry({ id: `endless-${i}`, pilot: r.pilot, score: r.score, kills: r.kills, sectors: r.sectors, seconds: r.seconds, rig: r.rig, maxCombo: r.max_combo, won: false, playedAt: r.played_at })) : [];
    $('endlessLeaderboard').replaceChildren(...(mapped.length ? mapped.map((r, i) => makeRunRow(r, i, true)) : [emptyCareer('NO VERIFIED ENDLESS RUNS YET')]));
    $('endlessStatus').textContent = 'ALL TIME / VERIFIED'; $('endlessStatus').className = 'cloud-online';
  } catch (_) {
    $('endlessStatus').textContent = 'ENDLESS BOARD UNAVAILABLE'; $('endlessStatus').className = 'cloud-offline';
    $('endlessLeaderboard').replaceChildren(emptyCareer('LOCAL PLAY REMAINS AVAILABLE.'));
  }
};

// Standard victories can still continue with the same build. This continuation is intentionally unranked.
// Starting ENDLESS RUN from the hangar creates the verified Endless leaderboard session.
$('endlessBtn').addEventListener('click', () => {
  if (state === 'upgrade' && G?.endless) { activeMode = 'endless'; lastMode = 'endless'; managedSession = null; syncRunModeHud(); }
});

queueMicrotask(() => { ensureV131UI(); if (career.pilot !== 'PILOT') confirmPilot(); });
