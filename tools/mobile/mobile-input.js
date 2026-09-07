// Independent pointer ownership keeps movement active during ability taps.
function beginSteering(event, fixed = false) {
  if (state !== 'playing' || touch.id !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault();
  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    touchDetected = true;
    if (save.controls === 'auto' && !coarse) syncControlMode();
  }
  unlockAudio();
  const target = fixed ? $('movePad') : canvas;
  const rect = fixed ? target.getBoundingClientRect() : null;
  touch.id = event.pointerId; touch.target = target; touch.fixed = fixed;
  touch.originX = fixed ? rect.left + rect.width / 2 : event.clientX;
  touch.originY = fixed ? rect.top + rect.height / 2 : event.clientY;
  touch.radius = fixed ? Math.max(26, rect.width / 2 - 25) : 44;
  touch.x = 0; touch.y = 0; touch.amount = 0;
  if (fixed) { $('movePad').classList.add('active'); }
  else {
    $('joystick').hidden = false;
    $('joystick').style.left = `${touch.originX - 55}px`;
    $('joystick').style.top = `${touch.originY - 55}px`;
  }
  try { target.setPointerCapture(event.pointerId); } catch (_) { /* Window listeners also clean up un-captured pointers. */ }
  updateSteering(event);
}
function updateSteering(event) {
  if (event.pointerId !== touch.id || state !== 'playing') return;
  const dx = event.clientX - touch.originX, dy = event.clientY - touch.originY;
  const distance = Math.hypot(dx, dy);
  const amount = clamp((distance - 6) / touch.radius, 0, 1);
  touch.x = distance ? dx / distance * amount : 0;
  touch.y = distance ? dy / distance * amount : 0;
  touch.amount = amount;
  const travel = Math.min(touch.fixed ? touch.radius : 38, distance);
  const knob = touch.fixed ? $('moveKnob') : $('joystickKnob');
  knob.style.transform = `translate(${distance ? dx / distance * travel : 0}px, ${distance ? dy / distance * travel : 0}px)`;
}
function releasePointer(event) {
  if (event.pointerId === touch.id) clearPointer();
}
canvas.addEventListener('pointerdown', (event) => beginSteering(event));
$('movePad').addEventListener('pointerdown', (event) => beginSteering(event, true));
addEventListener('pointermove', updateSteering, { passive: true });
addEventListener('pointerup', releasePointer);
addEventListener('pointercancel', releasePointer);
for (const element of [canvas, $('movePad')]) {
  element.addEventListener('lostpointercapture', releasePointer);
  element.addEventListener('contextmenu', (event) => event.preventDefault());
}
for (const [id, action] of [['dashBtn', tryDash], ['overdriveBtn', tryOverdrive]]) {
  const element = $(id);
  let suppressClickUntil = 0;
  element.addEventListener('pointerdown', (event) => {
    if (state !== 'playing' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); event.stopPropagation();
    suppressClickUntil = performance.now() + 700;
    actionPointers.set(event.pointerId, element);
    element.classList.add('pressed');
    try { element.setPointerCapture(event.pointerId); } catch (_) { /* Global release listeners remain active. */ }
    unlockAudio(); action();
  });
  const releaseAction = (event) => {
    if (actionPointers.get(event.pointerId) !== element) return;
    actionPointers.delete(event.pointerId);
    if (![...actionPointers.values()].includes(element)) element.classList.remove('pressed');
  };
  element.addEventListener('lostpointercapture', releaseAction);
  addEventListener('pointerup', releaseAction);
  addEventListener('pointercancel', releaseAction);
  element.addEventListener('click', (event) => {
    if (event.detail === 0 && performance.now() >= suppressClickUntil) action();
  });
  element.addEventListener('contextmenu', (event) => event.preventDefault());
}
$('controlsBtn').addEventListener('click', () => {
  save.controls = ({ auto: 'on', on: 'off', off: 'auto' })[save.controls];
  clearInput(); syncControlMode(); syncSettings(); persist(); resize();
});
$('handednessBtn').addEventListener('click', () => {
  save.leftHanded = !save.leftHanded;
  clearInput(); syncControlMode(); syncSettings(); persist();
});
$('pauseFullBtn').addEventListener('click', toggleFullscreen);
// Rotation pauses rather than allowing the ship to drift while the phone moves.
function orientationChanged() {
  clearInput(); resize();
  if (coarse && state === 'playing') {
    pauseGame();
    $('pauseDescription').textContent = 'Screen rotated. Tap Back to the Rift when your phone is ready.';
  }
}
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', orientationChanged);
else addEventListener('orientationchange', orientationChanged);
addEventListener('pagehide', () => { clearInput(); if (state === 'playing') pauseGame(); });
addEventListener('pageshow', () => { clearInput(); lastFrame = 0; accumulator = 0; resize(); });
