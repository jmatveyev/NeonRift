from pathlib import Path
import hashlib
root=Path(__file__).resolve().parent
site=root.parents[1]
s=(root/'base.html').read_text()
assert hashlib.sha1(('blob '+str(len(s.encode()))+'\0').encode()+s.encode()).hexdigest()=='26f50199b84cc6ed8123c70d596e623ebe7d054f'
def rep(old,new):
 global s
 assert s.count(old)==1,(old[:100],s.count(old))
 s=s.replace(old,new)
rep('<title>NEON RIFT - Arcade Survival</title>','<title>NEON RIFT - Arcade Survival</title>\n<meta name="application-version" content="1.1.0-mobile">')
rep('</style>',(root/'mobile.css').read_text()+'\n</style>')
# Runtime detection also covers tablets with an attached mouse.
s = '\n'.join(line for line in s.split('\n') if not line.startswith('@media(pointer:coarse)'))
rep('<div class="touch-hint" id="touchHint">DRAG ANYWHERE<br>TO STEER YOUR SHIP</div>', '<div id="movePad" hidden role="group" aria-label="Movement thumbstick. Drag in the direction you want to move."><div id="moveKnob"></div><span id="moveCaption">MOVE</span></div>\n <div class="touch-hint" id="touchHint">THUMBSTICK TO MOVE<br>WEAPONS FIRE AUTOMATICALLY</div>')
rep('Touch controls included. &nbsp;','Phone controls: thumbstick + abilities. &nbsp;')
rep('On touchscreens, drag anywhere in the arena to steer. Use the DASH and OVERDRIVE buttons on the right.','On phones, drag the thumbstick to move. You can also drag the arena. Tap DASH with your other thumb without releasing movement; tap OVERDRIVE when charged. Aiming and firing stay automatic. Portrait and landscape both work. Rotate before resuming for the widest view.')
rep('<div class="setting"><span>Reduced motion</span>', '<div class="setting"><span>Touch controls</span><button id="controlsBtn" aria-label="Change touch control mode">AUTO</button></div><div class="setting phone-setting"><span>Left-handed layout</span><button id="handednessBtn" aria-pressed="false">OFF</button></div><div class="setting phone-setting" id="fullscreenSetting"><span>Fullscreen (optional)</span><button id="pauseFullBtn">ENTER</button></div><div class="setting"><span>Reduced motion</span>')
rep('const coarse = matchMedia(\'(pointer:coarse)\').matches;', "const touchMedia = matchMedia('(any-pointer:coarse)');\nlet touchDetected = touchMedia.matches || navigator.maxTouchPoints > 0;\nlet coarse = touchDetected;")
rep("rig: 'striker' };","rig: 'striker', controls: 'auto', leftHanded: false };")
rep("for (const key of ['sound', 'music', 'motion'])", "for (const key of ['sound', 'music', 'motion', 'leftHanded'])")
rep("if (['striker', 'ghost', 'bastion'].includes(data.rig)) save.rig = data.rig;", "if (['striker', 'ghost', 'bastion'].includes(data.rig)) save.rig = data.rig;\n    if (['auto', 'on', 'off'].includes(data.controls)) save.controls = data.controls;")
rep('const touch = { id: null, originX: 0, originY: 0, x: 0, y: 0, amount: 0 };', 'const touch = { id: null, target: null, fixed: false, radius: 44, originX: 0, originY: 0, x: 0, y: 0, amount: 0 };\nconst actionPointers = new Map();')
start=s.index('function resize() {');end=s.index('// All sounds are synthesized',start)
s=s[:start]+'''function syncControlMode() {
  coarse = save.controls === 'on' || (save.controls === 'auto' && touchDetected);
  document.body.classList.toggle('mobile-controls', coarse);
  document.body.classList.toggle('left-handed', coarse && save.leftHanded);
  $('movePad').hidden = !coarse || state !== 'playing';
  $('pauseBtn').textContent = coarse ? (state === 'paused' ? 'RESUME' : 'PAUSE') : 'II';
  $('pauseBtn').setAttribute('aria-label', state === 'paused' ? 'Resume game' : 'Pause game');
  $('fullscreenSetting').hidden = !document.documentElement.requestFullscreen;
}
function resize() {
  const oldW = W, oldLandscape = W > H;
  W = Math.max(240, Math.round(innerWidth));
  H = Math.max(200, Math.round(window.visualViewport ? window.visualViewport.height : innerHeight));
  document.documentElement.style.setProperty('--view-height', `${H}px`);
  const ratio = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
  dpr = Math.min(ratio, Math.sqrt((coarse ? 1200000 : 6000000) / (W * H)));
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  zoom = clamp(Math.min(W / 1200, H / 780), coarse ? 0.55 : 0.66, 1.16);
  // Address-bar height changes do not interrupt an active steering pointer.
  if (Math.abs(oldW - W) > 2 || oldLandscape !== (W > H)) clearInput();
}
let resizeScheduled = false;
function scheduleResize() {
  if (resizeScheduled) return;
  resizeScheduled = true;
  requestAnimationFrame(() => { resizeScheduled = false; resize(); });
}
addEventListener('resize', scheduleResize, { passive: true });
if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleResize, { passive: true });
if (touchMedia.addEventListener) touchMedia.addEventListener('change', () => {
  touchDetected = touchMedia.matches || navigator.maxTouchPoints > 0;
  clearInput(); syncControlMode(); resize();
});
syncControlMode(); resize();

''' + s[end:]
old='''function clearPointer() {
  touch.id = null; touch.x = 0; touch.y = 0; touch.amount = 0;
  $('joystick').hidden = true;
  $('joystickKnob').style.transform = '';
}
function clearInput() { keys.clear(); clearPointer(); }'''
new='''function clearPointer() {
  const id = touch.id, target = touch.target;
  touch.id = null; touch.target = null; touch.x = 0; touch.y = 0; touch.amount = 0;
  $('joystick').hidden = true; $('joystickKnob').style.transform = '';
  $('moveKnob').style.transform = ''; $('movePad').classList.remove('active');
  try { if (target && target.hasPointerCapture(id)) target.releasePointerCapture(id); } catch (_) { /* The browser may already have released this pointer. */ }
}
function clearInput() {
  keys.clear(); clearPointer();
  for (const [id, element] of actionPointers) {
    element.classList.remove('pressed');
    try { if (element.hasPointerCapture(id)) element.releasePointerCapture(id); } catch (_) { /* Pointer already released. */ }
  }
  actionPointers.clear();
}'''
rep(old,new)
rep("document.body.classList.toggle('in-game', inRun);\n  clearInput();", "document.body.classList.toggle('in-game', inRun);\n  document.body.classList.toggle('playing', state === 'playing');\n  clearInput(); syncControlMode();")
rep('function syncSettings() {',"function syncSettings() {\n  $('controlsBtn').textContent = save.controls.toUpperCase();\n  $('handednessBtn').textContent = save.leftHanded ? 'ON' : 'OFF';\n  $('handednessBtn').setAttribute('aria-pressed', String(save.leftHanded));")
rep("'Drag to move. Your cannons handle the shooting.'", "'Drag the thumbstick to move. Tap DASH with your other thumb.'")
rep("if (state !== 'paused') return;\n  state = 'playing'; showScreen(null); accumulator = 0; unlockAudio();", "if (state !== 'paused') return;\n  state = 'playing'; showScreen(null); accumulator = 0; lastFrame = performance.now(); unlockAudio();")
# A non-primary touch may not synthesize click. Pause must work during steering.
rep("$('pauseBtn').addEventListener('click', () => state === 'paused' ? resumeGame() : pauseGame());", """let pausePointerUntil = 0;
function activatePause() { state === 'paused' ? resumeGame() : pauseGame(); }
$('pauseBtn').addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
  event.preventDefault(); event.stopPropagation(); pausePointerUntil = performance.now() + 700;
  activatePause();
});
$('pauseBtn').addEventListener('click', () => { if (performance.now() >= pausePointerUntil) activatePause(); });""")
# Guard optional audio resume in browsers which expose an interrupted state.
rep("if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});", "if (audioCtx.state !== 'running' && audioCtx.state !== 'closed') {\n      const resumed = audioCtx.resume(); if (resumed && resumed.catch) resumed.catch(() => {});\n    }")
start=s.index("for (const [id, action] of [['dashBtn', tryDash], ['overdriveBtn', tryOverdrive]]) {")
end=s.index("addEventListener('keydown'",start)
s=s[:start]+s[end:]
start=s.index("canvas.addEventListener('pointerdown', (event) => {");end=s.index("addEventListener('blur'",start)
s=s[:start]+(root/'mobile-input.js').read_text()+'\n'+s[end:]
rep("document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pauseGame(); });", "document.addEventListener('visibilitychange', () => {\n  if (document.hidden) { clearInput(); if (state === 'playing') pauseGame(); }\n  else { lastFrame = 0; accumulator = 0; }\n});")
rep("$('touchHint').style.opacity = G.elapsed < 14", "$('dashBtn').setAttribute('aria-disabled', String(state !== 'playing' || !dashReady));\n  $('overdriveBtn').setAttribute('aria-disabled', String(state !== 'playing' || player.energy < 100 || player.overdrive > 0));\n  $('touchHint').style.opacity = G.elapsed < 14")
# Extend only the existing explicitly opt-in test harness, never production exports.
rep('save: { ...save }, storageAvailable', 'save: { ...save }, storageAvailable,\n    controls: { mobile: coarse, leftHanded: save.leftHanded, pointerId: touch.id, x: touch.x, y: touch.y, amount: touch.amount, actionPointers: actionPointers.size, viewport: [W, H], pixelRatio: dpr }')
def blob(data):
 return hashlib.sha1(('blob '+str(len(data))+'\0').encode()+data).hexdigest()
output=s.encode()
expected='d5e36dcb8c095b43339ac6a58c27d6706584c196'
assert blob(output)==expected, 'Generated game differs from the tested release.'
for name in ['index.html','neon-rift.html']:
 path=site/name
 if path.exists() and blob(path.read_bytes()) not in ['26f50199b84cc6ed8123c70d596e623ebe7d054f',expected]:
  raise RuntimeError('Refusing to overwrite unexpected changes to '+name)
for name in ['index.html','neon-rift.html']:
 (site/name).write_bytes(output)
print('Verified release blob:',expected)
print('Built mobile HTML:',len(s.encode()),'bytes')
