// NEON RIFT 1.4 - procedural premium-arcade rendering and cinematic presentation.
const V14_VERSION = '1.4.0';
window.NEON_RIFT_VERSION = V14_VERSION;

const v14Visual = {
  sectorPulse: 0, dashPulse: 0, overdrivePulse: 0, bossPulse: 0, chroma: 0,
  kickX: 0, kickY: 0, lastWave: 0, lastBossId: null, prevDash: 0, prevOverdrive: 0,
  prevHurt: 0, bursts: [], bossTimer: 0
};

function v14Hash(n, salt = 0) {
  const value = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}
function v14RGBA(hex, alpha) {
  const h = String(hex || '#ffffff').replace('#', '').slice(0, 6).padEnd(6, 'f');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
function v14VisualWave() {
  const wave = Math.max(1, G?.wave || 1);
  return wave > 9 ? ((wave - 1) % 9) + 1 : wave;
}
function v14Palette() {
  const wave = v14VisualWave();
  if (wave <= 3) return { name: 'SIGNAL FRONTIER', bg0: '#030914', bg1: '#0a1d29', nebula: '#0f6572', accent: '#78f8df', secondary: '#6eb8ff', danger: '#ff678e', floor: '#5bc8d1' };
  if (wave <= 6) return { name: 'ION WRECKAGE', bg0: '#080711', bg1: '#1b1825', nebula: '#68482e', accent: '#ffc77d', secondary: '#9f8cff', danger: '#ff716f', floor: '#9e8069' };
  if (wave <= 8) return { name: 'FRACTURED VEIL', bg0: '#070612', bg1: '#181027', nebula: '#572d74', accent: '#c59bff', secondary: '#ff79be', danger: '#ff618f', floor: '#8f72b3' };
  return { name: 'SOVEREIGN CORE', bg0: '#09050d', bg1: '#241020', nebula: '#7a243d', accent: '#ff7a9b', secondary: '#c59bff', danger: '#ffcf92', floor: '#a45a77' };
}
function v14Budget(desktop, mobile) { return coarse ? mobile : desktop; }
function v14SyncCSSPalette() {
  const palette = v14Palette();
  const root = document.documentElement;
  root.style.setProperty('--v14-sector', palette.accent);
  root.style.setProperty('--v14-sector-secondary', palette.secondary);
}

function v14DrawBackground(time) {
  const p = v14Palette();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = p.bg0; ctx.fillRect(0, 0, W, H);

  const baseGlow = ctx.createRadialGradient(W * .52, H * .47, 0, W * .52, H * .47, Math.max(W, H) * .78);
  baseGlow.addColorStop(0, p.bg1); baseGlow.addColorStop(.52, v14RGBA(p.nebula, .13)); baseGlow.addColorStop(1, p.bg0);
  ctx.fillStyle = baseGlow; ctx.fillRect(0, 0, W, H);

  const cx = typeof camera === 'object' ? camera.x : 0, cy = typeof camera === 'object' ? camera.y : 0;
  const cloudCount = v14Budget(5, 3);
  for (let i = 0; i < cloudCount; i++) {
    const radius = Math.max(W, H) * (.24 + v14Hash(i, 8) * .24);
    const x = ((v14Hash(i, 2) * (W + radius * .45) - cx * (.006 + i * .002) + radius * .2) % (W + radius * .4)) - radius * .2;
    const y = ((v14Hash(i, 5) * (H + radius * .3) - cy * (.005 + i * .0015) + radius * .15) % (H + radius * .25)) - radius * .12;
    const neb = ctx.createRadialGradient(x, y, 0, x, y, radius);
    neb.addColorStop(0, v14RGBA(i % 2 ? p.nebula : p.secondary, coarse ? .10 : .13));
    neb.addColorStop(.45, v14RGBA(p.nebula, .04)); neb.addColorStop(1, v14RGBA(p.nebula, 0));
    ctx.fillStyle = neb; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const stars = v14Budget(155, 82);
  for (let i = 0; i < stars; i++) {
    const layer = i % 3, depth = [.018, .034, .057][layer];
    const sx = v14Hash(i, 11), sy = v14Hash(i, 19);
    const x = ((sx * W - cx * depth) % W + W) % W;
    const y = ((sy * H - cy * depth) % H + H) % H;
    const bright = .19 + v14Hash(i, 23) * .42 + Math.sin(time * (.35 + layer * .09) + i) * .05;
    const size = layer === 2 && i % 7 === 0 ? 1.7 : layer === 1 ? 1.15 : .8;
    ctx.globalAlpha = Math.max(.08, bright); ctx.fillStyle = layer === 2 ? '#dffbff' : layer === 1 ? p.secondary : '#8fb0c0';
    ctx.fillRect(x, y, size, size);
    if (!coarse && layer === 2 && i % 17 === 0) {
      ctx.globalAlpha *= .45; ctx.strokeStyle = p.accent; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
    }
  }

  if (v14VisualWave() >= 7) {
    ctx.globalAlpha = coarse ? .09 : .13; ctx.strokeStyle = p.secondary; ctx.lineWidth = 1;
    for (let i = 0; i < v14Budget(5, 3); i++) {
      const startX = W * (.08 + v14Hash(i, 44) * .84), startY = H * (.05 + v14Hash(i, 47) * .9);
      ctx.beginPath(); ctx.moveTo(startX, startY);
      for (let j = 1; j <= 6; j++) {
        const xx = startX + Math.sin(i * 4.2 + j * 2.7) * 34 + j * (i % 2 ? 9 : -7);
        const yy = startY + j * 38;
        ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

drawBackground = v14DrawBackground;

function v14DrawFloor(time) {
  const p = v14Palette(), wave = v14VisualWave();
  const left = Math.max(15, camera.x - W / zoom / 2 - 45), right = Math.min(WORLD.w - 15, camera.x + W / zoom / 2 + 45);
  const top = Math.max(15, camera.y - H / zoom / 2 - 45), bottom = Math.min(WORLD.h - 15, camera.y + H / zoom / 2 + 45);

  const arena = ctx.createRadialGradient(WORLD.w / 2, WORLD.h / 2, 50, WORLD.w / 2, WORLD.h / 2, 850);
  arena.addColorStop(0, v14RGBA(p.nebula, .055)); arena.addColorStop(.55, v14RGBA(p.bg1, .03)); arena.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = arena; ctx.fillRect(left, top, right - left, bottom - top);

  const spacing = 96;
  ctx.lineWidth = 1 / zoom; ctx.globalAlpha = coarse ? .045 : .06; ctx.strokeStyle = p.floor;
  ctx.beginPath();
  for (let x = Math.ceil(left / spacing) * spacing; x < right; x += spacing) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
  for (let y = Math.ceil(top / spacing) * spacing; y < bottom; y += spacing) { ctx.moveTo(left, y); ctx.lineTo(right, y); }
  ctx.stroke();

  ctx.globalAlpha = .13; ctx.fillStyle = p.accent;
  for (let x = Math.ceil(left / 192) * 192; x < right; x += 192) for (let y = Math.ceil(top / 192) * 192; y < bottom; y += 192) {
    ctx.fillRect(x - 2.5, y - .55, 5, 1.1); ctx.fillRect(x - .55, y - 2.5, 1.1, 5);
  }

  ctx.globalAlpha = wave >= 9 ? .17 : .085; ctx.strokeStyle = wave >= 9 ? p.danger : p.secondary; ctx.lineWidth = wave >= 9 ? 2 : 1;
  for (const r of wave >= 9 ? [210, 330, 470, 620] : [310, 540]) {
    ctx.setLineDash(wave >= 7 ? [14, 22] : [5, 30]); ctx.beginPath(); ctx.arc(WORLD.w / 2, WORLD.h / 2, r, time * .035, time * .035 + TAU); ctx.stroke();
  }
  ctx.setLineDash([]);

  const debrisCount = v14Budget(18, 9);
  for (let i = 0; i < debrisCount; i++) {
    const x = 70 + v14Hash(i, wave * 7 + 2) * (WORLD.w - 140), y = 70 + v14Hash(i, wave * 11 + 3) * (WORLD.h - 140);
    if (x < left - 80 || x > right + 80 || y < top - 80 || y > bottom + 80) continue;
    const size = 12 + v14Hash(i, 71) * (wave >= 4 && wave <= 6 ? 44 : 26);
    ctx.save(); ctx.translate(x, y); ctx.rotate(v14Hash(i, 79) * TAU + time * .006 * (i % 2 ? 1 : -1));
    ctx.globalAlpha = wave >= 4 && wave <= 6 ? .12 : .065; ctx.fillStyle = wave >= 4 && wave <= 6 ? '#51433f' : '#23323e'; ctx.strokeStyle = p.floor; ctx.lineWidth = .8;
    polygon(0, 0, size, 5 + i % 3, v14Hash(i, 83)); ctx.fill(); ctx.globalAlpha *= 1.7; ctx.stroke();
    ctx.globalAlpha = .11; ctx.fillStyle = p.accent; ctx.fillRect(size * .15, -1, size * .45, 2); ctx.restore();
  }

  if (wave >= 7) {
    ctx.strokeStyle = p.secondary; ctx.lineWidth = 1.4; ctx.globalAlpha = .11;
    for (let i = 0; i < 6; i++) {
      const x = 160 + v14Hash(i, 91) * (WORLD.w - 320), y = 150 + v14Hash(i, 97) * (WORLD.h - 300);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 1; j < 6; j++) ctx.lineTo(x + Math.sin(i * 2.4 + j * 1.9) * (18 + j * 7), y + j * 32);
      ctx.stroke();
    }
  }

  if (wave >= 9) {
    ctx.globalAlpha = .15; ctx.strokeStyle = p.accent; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + time * .015;
      ctx.save(); ctx.translate(WORLD.w / 2, WORLD.h / 2); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(520, -28); ctx.lineTo(675, -12); ctx.lineTo(705, 0); ctx.lineTo(675, 12); ctx.lineTo(520, 28); ctx.stroke(); ctx.restore();
    }
  }

  ctx.globalAlpha = .31; ctx.strokeStyle = p.floor; ctx.lineWidth = 2.2;
  roundedRect(18, 18, WORLD.w - 36, WORLD.h - 36, 30); ctx.stroke();
  ctx.globalAlpha = .09; ctx.strokeStyle = p.accent; ctx.lineWidth = 1;
  roundedRect(29, 29, WORLD.w - 58, WORLD.h - 58, 23); ctx.stroke();
  ctx.globalAlpha = .24; ctx.fillStyle = p.accent; ctx.textAlign = 'center'; ctx.font = '800 9px system-ui, sans-serif';
  ctx.fillText(`${p.name}  //  NR-${String(G?.wave || 1).padStart(2, '0')}`, WORLD.w / 2, WORLD.h / 2 + 4);
  ctx.globalAlpha = 1;
}

drawFloor = v14DrawFloor;

function v14DrawShowcaseShip(x, y, time) {
  const rig = typeof selectedRig === 'string' ? selectedRig : 'striker';
  const color = RIGS?.[rig]?.color || '#78f8df';
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.42 + Math.sin(time * .22) * .025); ctx.scale(coarse ? 2.15 : 3.15, coarse ? 2.15 : 3.15);
  ctx.globalCompositeOperation = 'lighter';
  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 55); aura.addColorStop(0, v14RGBA(color, .13)); aura.addColorStop(1, v14RGBA(color, 0));
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 55, 0, TAU); ctx.fill();
  ctx.globalAlpha = .19; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-5, 13); ctx.lineTo(0, 42 + Math.sin(time * 9) * 3); ctx.lineTo(5, 13); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  shipPath(rig); ctx.fillStyle = '#102b35'; ctx.strokeStyle = color; ctx.lineWidth = 1.15; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#bdfcf0'; ctx.globalAlpha = .5; ctx.lineWidth = .45;
  ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 7); ctx.moveTo(-10, 10); ctx.lineTo(-3, -2); ctx.moveTo(10, 10); ctx.lineTo(3, -2); ctx.stroke();
  const glass = ctx.createLinearGradient(0, -14, 0, 3); glass.addColorStop(0, '#efffff'); glass.addColorStop(1, v14RGBA(color, .5));
  ctx.globalAlpha = .9; ctx.fillStyle = glass; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function v14DrawAttract(time) {
  const p = v14Palette();
  const x = W < 620 ? W * .69 : W * .74, y = H * .5, r = Math.min(W * .28, H * .42);
  ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < v14Budget(6, 4); i++) {
    const radius = r * (.48 + i * .13), a0 = time * (.025 + i * .004) * (i % 2 ? -1 : 1) + i;
    ctx.globalAlpha = .07 + i * .012; ctx.strokeStyle = i % 2 ? p.secondary : p.accent; ctx.lineWidth = i === 0 ? 2.2 : 1;
    ctx.setLineDash(i % 2 ? [10, 19] : [2, 25]); ctx.beginPath(); ctx.arc(0, 0, radius, a0, a0 + TAU * (.63 + i * .035)); ctx.stroke();
  }
  ctx.setLineDash([]);
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .72); core.addColorStop(0, v14RGBA(p.accent, .08)); core.addColorStop(.45, v14RGBA(p.nebula, .045)); core.addColorStop(1, v14RGBA(p.nebula, 0));
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, TAU); ctx.fill(); ctx.restore();

  for (let i = 0; i < v14Budget(28, 14); i++) {
    const a = v14Hash(i, 131) * TAU + time * (.01 + v14Hash(i, 137) * .018), dist = r * (.55 + v14Hash(i, 139) * .8);
    const px = x + Math.cos(a) * dist, py = y + Math.sin(a * 1.07) * dist * .72;
    ctx.globalAlpha = .12 + v14Hash(i, 149) * .25; ctx.fillStyle = i % 5 ? p.accent : p.secondary;
    ctx.fillRect(px, py, i % 5 ? 1 : 2, i % 5 ? 1 : 2);
  }
  ctx.globalAlpha = 1;
  v14DrawShowcaseShip(x - r * .08, y + Math.sin(time * .8) * 4, time);
}

drawAttract = v14DrawAttract;

const drawPlayerV14Base = drawPlayer;
drawPlayer = function drawPlayerV14(time) {
  if (!player || state === 'dead') return drawPlayerV14Base(time);
  const color = RIGS[player.rig].color, speed = Math.hypot(player.vx, player.vy);
  if (speed > 12) {
    const dx = player.vx / speed, dy = player.vy / speed, length = Math.min(92, 30 + speed * .15 + (player.dashTime > 0 ? 42 : 0));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.globalAlpha = player.dashTime > 0 ? .25 : .09; ctx.strokeStyle = player.overdrive > 0 ? '#ffd78b' : color; ctx.lineWidth = player.dashTime > 0 ? 9 : 4;
    ctx.beginPath(); ctx.moveTo(player.x - dx * 8, player.y - dy * 8); ctx.lineTo(player.x - dx * length, player.y - dy * length); ctx.stroke();
    ctx.globalAlpha *= 1.5; ctx.lineWidth = 1.2; ctx.strokeStyle = '#eaffff'; ctx.stroke(); ctx.restore();
  }
  drawPlayerV14Base(time);
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle + Math.PI / 2);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .32; ctx.strokeStyle = player.overdrive > 0 ? '#ffe1a0' : color; ctx.lineWidth = .8;
  if (player.rig === 'bastion') {
    ctx.beginPath(); ctx.moveTo(-15, 7); ctx.lineTo(-11, -3); ctx.lineTo(-3, -13); ctx.moveTo(15, 7); ctx.lineTo(11, -3); ctx.lineTo(3, -13); ctx.stroke();
    ctx.fillStyle = color; ctx.fillRect(-14, 8, 3, 4); ctx.fillRect(11, 8, 3, 4);
  } else if (player.rig === 'ghost') {
    ctx.beginPath(); ctx.moveTo(-16, 13); ctx.lineTo(-7, -3); ctx.lineTo(0, -18); ctx.lineTo(7, -3); ctx.lineTo(16, 13); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(-12, 11, 1.6, 0, TAU); ctx.arc(12, 11, 1.6, 0, TAU); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(-13, 13); ctx.lineTo(-6, 1); ctx.lineTo(0, -17); ctx.lineTo(6, 1); ctx.lineTo(13, 13); ctx.stroke();
    ctx.fillStyle = color; ctx.fillRect(-10, 10, 2.5, 3); ctx.fillRect(7.5, 10, 2.5, 3);
  }
  const canopy = ctx.createRadialGradient(0, -5, 0, 0, -5, 8); canopy.addColorStop(0, 'rgba(255,255,255,.68)'); canopy.addColorStop(1, v14RGBA(color, 0));
  ctx.fillStyle = canopy; ctx.beginPath(); ctx.arc(0, -5, 8, 0, TAU); ctx.fill();
  ctx.restore();
};

const drawEnemyV14Base = drawEnemy;
drawEnemy = function drawEnemyV14(e, time) {
  if (!e || e.dead) return;
  if (e.type !== 'boss') {
    const speed = Math.hypot(e.vx || 0, e.vy || 0);
    if (speed > 18 && e.warmup <= 0) {
      const dx = e.vx / speed, dy = e.vy / speed;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .055; ctx.strokeStyle = e.color; ctx.lineWidth = Math.max(2, e.r * .18); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x - dx * Math.min(36, speed * .09), e.y - dy * Math.min(36, speed * .09)); ctx.stroke(); ctx.restore();
    }
  }
  drawEnemyV14Base(e, time);
  if (e.type === 'boss' || e.dead || e.warmup > 0) return;
  const angle = e.windup > 0 || e.chargeTime > 0 ? e.chargeAngle : e.type === 'gunner' && e.aimLocked ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(angle + Math.PI / 2); ctx.globalCompositeOperation = 'lighter';
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(8, e.r * .72)); core.addColorStop(0, v14RGBA(e.color, e.hit > 0 ? .52 : .25)); core.addColorStop(1, v14RGBA(e.color, 0));
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, Math.max(8, e.r * .72), 0, TAU); ctx.fill();
  ctx.globalAlpha = .42; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .55;
  if (e.type === 'gunner') { ctx.strokeRect(-e.r * .42, -e.r * .42, e.r * .84, e.r * .84); }
  else if (e.type === 'brute') { polygon(0, 0, e.r * .68, 6, -Math.PI / 2); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0, -e.r * .72); ctx.lineTo(0, e.r * .38); ctx.stroke(); }
  ctx.fillStyle = e.color; ctx.globalAlpha = .65; ctx.beginPath(); ctx.arc(0, 1, Math.max(1.5, e.r * .09), 0, TAU); ctx.fill();
  ctx.restore();
};

const drawBossV14Base = drawBoss;
drawBoss = function drawBossV14(e, time) {
  const stage = Math.min(3, Math.max(1, e.stage || Math.floor((G?.wave || 3) / 3))), phase2 = e.hp < e.maxHp * .48;
  const color = phase2 ? '#ff9b88' : e.color;
  ctx.save(); ctx.translate(e.x, e.y); ctx.globalCompositeOperation = 'lighter';
  const aura = ctx.createRadialGradient(0, 0, e.r * .35, 0, 0, e.r * 2.45); aura.addColorStop(0, v14RGBA(color, .14)); aura.addColorStop(.45, v14RGBA(color, .045)); aura.addColorStop(1, v14RGBA(color, 0));
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, e.r * 2.45, 0, TAU); ctx.fill();
  ctx.globalAlpha = phase2 ? .24 : .15; ctx.strokeStyle = color; ctx.lineWidth = 1.2;
  const ringCount = stage === 1 ? 6 : stage === 2 ? 8 : 10;
  for (let i = 0; i < ringCount; i++) {
    const a = i * TAU / ringCount + time * (.12 + stage * .018) * (stage === 2 ? -1 : 1);
    const r0 = e.r * 1.26, r1 = e.r * (stage === 3 ? 1.74 : 1.58);
    ctx.beginPath(); ctx.arc(0, 0, r0, a, a + .16 + stage * .025); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a + .04) * r1, Math.sin(a + .04) * r1); ctx.stroke();
  }
  ctx.restore();

  drawBossV14Base(e, time);

  ctx.save(); ctx.translate(e.x, e.y); ctx.globalCompositeOperation = 'lighter';
  const count = stage === 1 ? 6 : stage === 2 ? 8 : 10;
  ctx.rotate(-time * (.09 + stage * .02));
  for (let i = 0; i < count; i++) {
    ctx.save(); ctx.rotate(i * TAU / count); ctx.translate(e.r * 1.1, 0);
    ctx.globalAlpha = phase2 ? .44 : .29; ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = .45;
    ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(12 + stage * 3, -1); ctx.lineTo(18 + stage * 2, 0); ctx.lineTo(12 + stage * 3, 1); ctx.lineTo(-4, 3); ctx.closePath(); ctx.fill(); ctx.globalAlpha *= .65; ctx.stroke(); ctx.restore();
  }
  if (stage === 3) {
    for (let i = 0; i < 3; i++) {
      const a = time * .48 + i * TAU / 3, rr = e.r * 1.72;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      const halo = ctx.createRadialGradient(x, y, 0, x, y, 14); halo.addColorStop(0, v14RGBA(color, .55)); halo.addColorStop(1, v14RGBA(color, 0)); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill();
      ctx.globalAlpha = .8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2.1, 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = phase2 ? .48 : .30; ctx.strokeStyle = phase2 ? '#fff0d8' : color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, e.r * (.43 + Math.sin(time * 5) * .025), 0, TAU); ctx.stroke();
  ctx.restore();
};

const drawProjectilesV14Base = drawProjectiles;
drawProjectiles = function drawProjectilesV14() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const b of shots) {
    const speed = Math.hypot(b.vx, b.vy) || 1, tail = b.critical ? 42 : 31;
    ctx.globalAlpha = b.critical ? .13 : .075; ctx.strokeStyle = b.color; ctx.lineWidth = Math.max(4, b.r * (b.critical ? 5.8 : 4.2));
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx / speed * tail, b.y - b.vy / speed * tail); ctx.stroke();
  }
  for (const b of hostileShots) {
    ctx.globalAlpha = .10; ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = coarse ? 5 : 10;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.1, 0, TAU); ctx.fill();
  }
  ctx.restore();
  drawProjectilesV14Base();
};

const drawEffectsV14Base = drawEffects;
drawEffects = function drawEffectsV14() {
  drawEffectsV14Base();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  const step = coarse && particles.length > 45 ? 2 : 1;
  for (let i = 0; i < particles.length; i += step) {
    const p = particles[i], speed = Math.hypot(p.vx, p.vy) || 1, alpha = Math.max(0, p.life / p.maxLife);
    const len = Math.min(12, 2 + speed * .022);
    ctx.globalAlpha = alpha * .34; ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(.65, p.size * .42);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / speed * len, p.y - p.vy / speed * len); ctx.stroke();
  }
  for (const r of rings) {
    const progress = 1 - r.life / r.maxLife, radius = lerp(r.start, r.radius, 1 - (1 - progress) ** 2);
    ctx.globalAlpha = (1 - progress) * .16; ctx.strokeStyle = r.color; ctx.lineWidth = 8 * (1 - progress) + 1;
    ctx.beginPath(); ctx.arc(r.x, r.y, Math.max(.1, radius), 0, TAU); ctx.stroke();
  }
  for (const burst of v14Visual.bursts) {
    const t = 1 - burst.life / burst.maxLife, radius = burst.radius * (1 - (1 - t) ** 2);
    const glow = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, Math.max(1, radius));
    glow.addColorStop(0, v14RGBA(burst.color, (1 - t) * (burst.boss ? .18 : .08))); glow.addColorStop(1, v14RGBA(burst.color, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(burst.x, burst.y, Math.max(1, radius), 0, TAU); ctx.fill();
    ctx.globalAlpha = (1 - t) * (burst.boss ? .62 : .26); ctx.strokeStyle = burst.color; ctx.lineWidth = burst.boss ? 3.2 : 1.3; ctx.beginPath(); ctx.arc(burst.x, burst.y, Math.max(1, radius * .75), 0, TAU); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha = 1;
};

const killEnemyV14Base = killEnemy;
killEnemy = function killEnemyV14(e) {
  const wasDead = e?.dead;
  killEnemyV14Base(e);
  if (!e || wasDead || !e.dead) return;
  const boss = e.type === 'boss';
  v14Visual.bursts.push({ x: e.x, y: e.y, color: e.color, life: boss ? .95 : .34, maxLife: boss ? .95 : .34, radius: boss ? 190 : e.type === 'brute' ? 52 : 34, boss });
  if (boss) { v14Visual.bossPulse = 1; v14Visual.chroma = coarse ? .18 : .65; v14Visual.sectorPulse = 1; }
};

const beginClearV14Base = beginClear;
beginClear = function beginClearV14() { const before = G?.clearing; beginClearV14Base(); if (!before && G?.clearing) v14Visual.sectorPulse = Math.max(v14Visual.sectorPulse, .52); };

function v14Tick(dt) {
  v14Visual.sectorPulse = Math.max(0, v14Visual.sectorPulse - dt * 1.8);
  v14Visual.dashPulse = Math.max(0, v14Visual.dashPulse - dt * 4.6);
  v14Visual.overdrivePulse = Math.max(0, v14Visual.overdrivePulse - dt * 1.25);
  v14Visual.bossPulse = Math.max(0, v14Visual.bossPulse - dt * 1.1);
  v14Visual.chroma = Math.max(0, v14Visual.chroma - dt * 2.2);
  v14Visual.kickX *= Math.exp(-dt * 9); v14Visual.kickY *= Math.exp(-dt * 9);
  for (const burst of v14Visual.bursts) burst.life -= dt;
  v14Visual.bursts = v14Visual.bursts.filter((burst) => burst.life > 0).slice(-45);

  if (player) {
    if (player.dashTime > 0 && v14Visual.prevDash <= 0) {
      v14Visual.dashPulse = 1; const a = player.angle || 0; v14Visual.kickX -= Math.cos(a) * 10; v14Visual.kickY -= Math.sin(a) * 10;
    }
    if (player.overdrive > 0 && v14Visual.prevOverdrive <= 0) { v14Visual.overdrivePulse = 1; v14Visual.chroma = coarse ? .06 : .18; }
    v14Visual.prevDash = player.dashTime; v14Visual.prevOverdrive = player.overdrive;
  } else { v14Visual.prevDash = 0; v14Visual.prevOverdrive = 0; }
  if (hurtFlash > v14Visual.prevHurt + .03) { v14Visual.chroma = Math.max(v14Visual.chroma, coarse ? .08 : .24); }
  v14Visual.prevHurt = hurtFlash;
  document.body.classList.toggle('v14-overdrive', Boolean(player && player.overdrive > 0));
}

const updateV14Base = update;
update = function updateV14(dt) { updateV14Base(dt); v14Tick(dt); };

function v14PostFX(time) {
  const p = v14Palette();
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'screen';
  if (player && (player.dashTime > 0 || player.overdrive > 0) && !save.motion) {
    const intensity = Math.min(1, v14Visual.dashPulse + (player.overdrive > 0 ? .28 : 0));
    const lines = v14Budget(18, 10);
    ctx.translate(W / 2, H / 2); ctx.strokeStyle = player.overdrive > 0 ? '#ffd78b' : p.accent; ctx.lineWidth = 1;
    for (let i = 0; i < lines; i++) {
      const a = i * TAU / lines + time * .03, inner = Math.min(W, H) * (.26 + v14Hash(i, 211) * .12), outer = inner + 25 + v14Hash(i, 223) * 80;
      ctx.globalAlpha = intensity * (.025 + v14Hash(i, 227) * .055);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner); ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer); ctx.stroke();
    }
    ctx.translate(-W / 2, -H / 2);
  }

  if (v14Visual.sectorPulse > 0) {
    const flash = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .75);
    flash.addColorStop(0, v14RGBA(p.accent, v14Visual.sectorPulse * .045)); flash.addColorStop(1, v14RGBA(p.accent, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = flash; ctx.fillRect(0, 0, W, H);
  }
  if (player && player.hp / player.maxHp < .3) {
    const danger = (.3 - player.hp / player.maxHp) / .3 * (.08 + Math.sin(time * 4) * .02);
    const edge = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .28, W / 2, H / 2, Math.max(W, H) * .68);
    edge.addColorStop(0, 'rgba(255,80,110,0)'); edge.addColorStop(1, `rgba(255,55,90,${danger})`); ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);
  }
  if (!coarse && v14Visual.chroma > .03) {
    ctx.globalAlpha = v14Visual.chroma * .045; ctx.fillStyle = '#ff365f'; ctx.fillRect(0, 0, 3 + v14Visual.chroma * 7, H);
    ctx.fillStyle = '#3ad9ff'; ctx.fillRect(W - 3 - v14Visual.chroma * 7, 0, 3 + v14Visual.chroma * 7, H);
  }
  ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

const renderV14Base = render;
render = function renderV14() {
  const originalZoom = zoom, originalX = camera.x, originalY = camera.y;
  if (player && !save.motion) {
    const speed = Math.hypot(player.vx, player.vy);
    camera.x += player.vx * .012 + v14Visual.kickX;
    camera.y += player.vy * .012 + v14Visual.kickY;
    const dashZoom = v14Visual.dashPulse * .012, overdriveZoom = player.overdrive > 0 ? .008 : 0, bossZoom = v14Visual.bossPulse * -.016;
    zoom = originalZoom * (1 + dashZoom + overdriveZoom + bossZoom + Math.min(.006, speed / 100000));
  }
  renderV14Base();
  zoom = originalZoom; camera.x = originalX; camera.y = originalY;
  v14PostFX(player && G ? G.elapsed : ambientTime);
};

function v14BossStageName() {
  const stage = Math.min(3, Math.max(1, Math.floor((G?.wave || 3) / 3)));
  return typeof bossDisplayName === 'function' ? bossDisplayName(stage) : ['THE GATEKEEPER','VOID WARDEN','RIFT SOVEREIGN'][stage - 1];
}
function v14BossIntro() {
  ensureV14UI();
  const sting = $('v14BossSting'); if (!sting) return;
  sting.querySelector('strong').textContent = v14BossStageName();
  sting.querySelector('.v14-sting-kicker').textContent = `SECTOR ${String(G?.wave || 0).padStart(2, '0')} / RIFT SIGNATURE`;
  sting.querySelector('.v14-sting-copy span:last-child').textContent = v14VisualWave() >= 9 ? 'SOVEREIGN-CLASS ENTITY / MAXIMUM THREAT' : 'HOSTILE COMMAND ENTITY / WEAPONS FREE';
  document.body.classList.add('v14-boss-intro');
  clearTimeout(v14Visual.bossTimer);
  v14Visual.bossTimer = setTimeout(() => document.body.classList.remove('v14-boss-intro'), save.motion ? 650 : 1550);
  v14Visual.bossPulse = .7; v14Visual.chroma = coarse ? .03 : .12;
}

const nextSectorV14Base = nextSector;
nextSector = function nextSectorV14() {
  nextSectorV14Base();
  v14SyncCSSPalette(); v14Visual.sectorPulse = .72; v14Visual.lastWave = G?.wave || 0;
  if (G?.wave % 3 === 0) v14BossIntro();
};

const refreshHUDV14Base = refreshHUD;
refreshHUD = function refreshHUDV14() {
  refreshHUDV14Base();
  v14SyncCSSPalette();
  const bossLive = Boolean(G?.boss && !G.boss.dead && !['dead','won'].includes(state));
  document.body.classList.toggle('v14-boss-live', bossLive);
  if ($('sectorName') && G) $('sectorName').dataset.zone = v14Palette().name;
};

const endRunV14Base = endRun;
endRun = function endRunV14(won, cause = '') {
  endRunV14Base(won, cause);
  v14Visual.sectorPulse = won ? 1 : .55; v14Visual.chroma = coarse ? .05 : won ? .26 : .15;
  document.body.classList.remove('v14-boss-live', 'v14-boss-intro');
};

function ensureV14UI() {
  document.body.classList.add('v14-visual');
  if (!$('v14BossSting')) {
    const sting = document.createElement('div'); sting.id = 'v14BossSting'; sting.setAttribute('aria-hidden', 'true');
    sting.innerHTML = '<div class="v14-sting-copy"><span class="v14-sting-kicker">RIFT SIGNATURE</span><strong>HOSTILE ENTITY</strong><span>HOSTILE COMMAND ENTITY / WEAPONS FREE</span></div>';
    document.body.appendChild(sting);
  }
  if ($('startBtn')) $('startBtn').title = 'Nine-sector campaign / permanent Standard leaderboard';
  if ($('endlessRunBtn')) $('endlessRunBtn').title = 'Start at Sector 1 and survive until defeat / separate Endless leaderboard';
  if ($('dailyRunBtn')) $('dailyRunBtn').title = 'Shared UTC seed / nine-sector Daily Signal leaderboard';
  v14SyncCSSPalette();
}

window.__NEON_RIFT_VISUAL__ = Object.freeze({ version: V14_VERSION, renderer: 'canvas2d-premium', mobileTier: coarse ? 'mobile' : 'desktop' });
queueMicrotask(ensureV14UI);
