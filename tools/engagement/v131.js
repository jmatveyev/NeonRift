// NEON RIFT 1.3.1 - callsign onboarding, visible Endless mode and separated Endless leaderboard.
const PILOT_CONFIRM_KEY = 'neon-rift-pilot-confirmed-v1';
let pendingPilotMode = null;

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
  persistCareer(); confirmPilot(); syncCareerHome();
  if ($('careerPilotInput')) $('careerPilotInput').value = raw;
  const mode = pendingPilotMode || 'standard'; pendingPilotMode = null; $('pilotPrompt').hidden = true;
  void startManagedRunV131Base(mode);
}

const startManagedRunV131Base = startManagedRun;
startManagedRun = async function startManagedRunV131(mode = 'standard') {
  const normalized = validRunMode(mode);
  if (!pilotConfirmed()) { promptPilot(normalized); return; }
  return startManagedRunV131Base(normalized);
};

function ensureV131UI() {
  if ($('startBtn')) $('startBtn').innerHTML = 'STANDARD RUN <span class="arrow" aria-hidden="true">&#x2192;</span>';
  if ($('dailyRunBtn')) $('dailyRunBtn').innerHTML = 'DAILY SIGNAL <small>SAME SEED FOR EVERY PILOT</small>';
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

// Standard victories can still continue with the same build. That continuation is deliberately unranked;
// starting ENDLESS RUN from the hangar creates the verified endless leaderboard session.
$('endlessBtn').addEventListener('click', () => { if (state === 'upgrade' && G?.endless) { activeMode = 'endless'; lastMode = 'endless'; syncRunModeHud(); } });

queueMicrotask(() => { ensureV131UI(); if (career.pilot !== 'PILOT') confirmPilot(); });
