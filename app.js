/* dreamPlay - kids' tower-defense maker. Vanilla JS, one canvas, no libraries. */
'use strict';

// ====================================================================== constants
const COLS = 22, ROWS = 13, T = 48;
const W = COLS * T, H = ROWS * T;
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

const GROUND = {
  e: { name: 'Empty', color: '#0b1530', walk: false, build: false, hidden: true },
  g: { name: 'Grass', color: '#6aa843', walk: false, build: true },
  f: { name: 'Meadow', color: '#86c75c', walk: false, build: true },
  s: { name: 'Sand', color: '#e2bd78', walk: false, build: true },
  d: { name: 'Dirt', color: '#7a4a2c', walk: false, build: true },
  n: { name: 'Snow', color: '#eef5fb', walk: false, build: true },
  w: { name: 'River', color: '#3b8fd6', walk: false, build: false, liquid: true },
  l: { name: 'Lava', color: '#ff7a1a', walk: false, build: false, liquid: true },
  p: { name: 'Path', color: '#e3c48c', walk: true, build: false },
  b: { name: 'Bridge', color: '#9b6a35', walk: true, build: false },
};
const isLiquid = (g) => !!(GROUND[g] && GROUND[g].liquid);

const DECOR = {
  mountain: { name: 'Mountain', emoji: '⛰️', blocks: true },
  hill: { name: 'Hill', emoji: '🟢', blocks: true },
  tree: { name: 'Tree', emoji: '🌳', blocks: true },
  pine: { name: 'Pine tree', emoji: '🌲', blocks: true },
  bush: { name: 'Bush', emoji: '🌿', blocks: true },
  rock: { name: 'Rock', emoji: '🪨', blocks: true },
  cactus: { name: 'Cactus', emoji: '🌵', blocks: true },
  flower: { name: 'Flower', emoji: '🌸', blocks: false },
  sun: { name: 'Sunflower', emoji: '🌻', blocks: false },
  mush: { name: 'Mushroom', emoji: '🍄', blocks: false },
  barrel: { name: 'Barrel', emoji: '🛢️', blocks: true },
  crate: { name: 'Crate', emoji: '📦', blocks: true },
  torch: { name: 'Torch', emoji: '🔥', blocks: true },
  campfire: { name: 'Campfire', emoji: '🔥', blocks: true },
  banner: { name: 'Flag', emoji: '🚩', blocks: true },
  crystal: { name: 'Crystal', emoji: '💎', blocks: true },
  hut: { name: 'Hut', emoji: '🛖', blocks: true },
  tent: { name: 'Tent', emoji: '⛺', blocks: true },
  fence: { name: 'Fence', emoji: '🪵', blocks: true },
  skull: { name: 'Skull', emoji: '💀', blocks: false },
};
const OLD_DECOR = { palm: 'tree' };

// original cute elemental monsters (art in art.js)
const ENEMIES = {
  buzzi: { name: 'Buzi', type: 'Bug', emoji: '🐞', hp: 30, speed: 1.1, reward: 3, size: 0.95 },
  zappy: { name: 'Zapi', type: 'Lightning', emoji: '⚡', hp: 26, speed: 1.7, reward: 3, size: 0.9 },
  flamix: { name: 'Flamiks', type: 'Fire', emoji: '🔥', hp: 45, speed: 1.0, reward: 4, size: 1.0 },
  bubbo: { name: 'Bubo', type: 'Water', emoji: '💧', hp: 65, speed: 0.75, reward: 4, size: 1.0 },
  spooki: { name: 'Spuki', type: 'Ghost', emoji: '👻', hp: 40, speed: 1.35, reward: 5, size: 0.95 },
  toxa: { name: 'Toksa', type: 'Poison', emoji: '☠️', hp: 75, speed: 0.8, reward: 5, size: 1.0 },
  frosty: { name: 'Frosti', type: 'Ice', emoji: '❄️', hp: 110, speed: 0.7, reward: 7, size: 1.05 },
  rocko: { name: 'Roko', type: 'Rock', emoji: '🪨', hp: 170, speed: 0.5, reward: 9, size: 1.15 },
};
const OLD_ENEMY = { beetle: 'buzzi', snail: 'bubbo', bat: 'zappy', spider: 'toxa', slime: 'toxa', golem: 'rocko', ghost: 'spooki', robot: 'frosty' };

// the hero: an original plant creature with 8 forms (need = total XP to reach it)
const STAGES = [
  { name: 'Seedy', need: 0, dmg: 7, range: 2.3, rate: 1.0, targets: 1, about: 'A tiny seed full of courage.' },
  { name: 'Sprout', need: 60, dmg: 10, range: 2.5, rate: 1.2, targets: 1, about: 'First leaves! Shoots faster.' },
  { name: 'Leafy', need: 170, dmg: 13, range: 2.7, rate: 1.35, targets: 2, about: 'Throws two leaves at once.' },
  { name: 'Bloomy', need: 340, dmg: 16, range: 2.9, rate: 1.45, targets: 2, slow: 0.45, about: 'Flower dust slows enemies down.' },
  { name: 'Treeling', need: 580, dmg: 22, range: 3.1, rate: 1.5, targets: 1, splash: 1.3, about: 'Throws seed bombs that go boom.' },
  { name: 'Forest King', need: 900, dmg: 28, range: 3.4, rate: 1.7, targets: 3, slow: 0.35, about: 'Vines grab three enemies.' },
  { name: 'Green Titan', need: 1300, dmg: 40, range: 3.7, rate: 1.9, targets: 2, splash: 1.6, beam: true, about: 'A sun beam that burns everything.' },
  { name: 'SUPER ADMIN', need: 1850, dmg: 55, range: 4.2, rate: 2.2, targets: 4, splash: 1.6, slow: 0.4, beam: true, admin: true, about: 'Controls everything in the game! 👑' },
];

const MERCH = [
  { id: 'cap', slot: 'hat', name: 'Sports cap', emoji: '🧢', price: 25 },
  { id: 'tophat', slot: 'hat', name: 'Top hat', emoji: '🎩', price: 60 },
  { id: 'grad', slot: 'hat', name: 'Graduation cap', emoji: '🎓', price: 80 },
  { id: 'helmet', slot: 'hat', name: 'Helmet', emoji: '⛑️', price: 45 },
  { id: 'crown', slot: 'hat', name: 'Crown', emoji: '👑', price: 150 },
  { id: 'glasses', slot: 'outfit', name: 'Sunglasses', emoji: '🕶️', price: 30 },
  { id: 'scarf', slot: 'outfit', name: 'Scarf', emoji: '🧣', price: 35 },
  { id: 'bow', slot: 'outfit', name: 'Bow tie', emoji: '🎀', price: 40 },
  { id: 'cape', slot: 'outfit', name: 'Hero cape', emoji: '🦸', price: 120 },
  { id: 'medal', slot: 'outfit', name: 'Medal', emoji: '🏅', price: 90 },
];

const POWERS = {
  freeze: { cd: 20, label: '❄️ Freeze everyone' },
  strike: { cd: 25, label: '💥 Admin Strike' },
  coins: { cd: 30, label: '🪙 Coin rain' },
  heal: { cd: 30, label: '❤️ Heal the home' },
};

// ====================================================================== state
const $ = (id) => document.getElementById(id);
const stage = $('stage'), ctx = stage.getContext('2d');
stage.width = W; stage.height = H;

let custom = [];               // elements added with Claude
let profile = { coins: 30, xp: 0, stage: 0, owned: [], hat: '', outfit: '', sound: true };
let map = null;
let mode = 'create';
let tab = 'ground';
let brush = { cat: 'ground', id: 'p' };
let tool = 'brush';
let undoStack = [];
let currentWave = 0;
let route = null;             // tile path portal -> home
let hoverTile = null;
let painting = false;
let game = null;
let chatHistory = [];
let claudeStatus = { ready: false };
let lastTime = performance.now();

// ====================================================================== helpers
const idx = (x, y) => y * COLS + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
function enemyId(id) { return OLD_ENEMY[id] || id; }
function enemyDef(id) { id = enemyId(id); return ENEMIES[id] ? { ...ENEMIES[id], id } : custom.find(c => c.id === id) || { ...ENEMIES.buzzi, id: 'buzzi' }; }
function decorDef(id) { id = OLD_DECOR[id] || id; if (id === 'spot') return { id, name: 'Hero spot', blocks: false, spot: true }; return DECOR[id] ? { ...DECOR[id], id } : custom.find(c => c.id === id) || null; }
function allMerch() { return MERCH.concat(custom.filter(c => c.kind === 'merch')); }
function merchDef(id) { return allMerch().find(m => m.id === id); }

function toast(text, ms = 2200) {
  const t = $('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), ms);
}

async function api(path, body) {
  const r = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

// ====================================================================== sound (tiny synth)
let actx = null;
function beep(freq, dur = 0.08, type = 'sine', vol = 0.12, slide = 0) {
  if (!profile.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), actx.currentTime + dur);
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur + 0.02);
  } catch (e) { /* audio is optional */ }
}
const sfx = {
  click: () => beep(660, 0.05, 'triangle', 0.08),
  place: () => { beep(520, 0.08, 'triangle'); setTimeout(() => beep(780, 0.1, 'triangle'), 70); },
  shoot: () => beep(900, 0.04, 'square', 0.03, -400),
  hit: () => beep(220, 0.05, 'square', 0.04),
  kill: () => beep(700, 0.09, 'triangle', 0.08, 500),
  coin: () => { beep(988, 0.06, 'square', 0.05); setTimeout(() => beep(1319, 0.1, 'square', 0.05), 60); },
  leak: () => beep(180, 0.25, 'sawtooth', 0.08, -100),
  evolve: () => [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.1), i * 110)),
  win: () => [523, 659, 784, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'triangle', 0.1), i * 140)),
  lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sawtooth', 0.07), i * 200)),
};

// ====================================================================== splash
function runSplash() {
  const sp = $('splash'), cv = $('splashCanvas'), c = cv.getContext('2d');
  const word = 'dreamPlay';
  $('splashLogo').innerHTML = [...word].map((ch, i) =>
    `<span class="${i < 5 ? 'd' : 'p'}" style="animation-delay:${0.15 + i * 0.09}s">${ch}</span>`).join('');
  const stars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), z: rand(0.2, 1), tw: rand(0, 6) }));
  const orbs = Array.from({ length: 26 }, () => ({ x: Math.random(), y: rand(0.6, 1.2), r: rand(4, 14), v: rand(0.03, 0.09), h: rand(195, 215) }));
  const t0 = performance.now(), DUR = 3200;
  let done = false;
  function frame(now) {
    if (done) return;
    const w = cv.width = innerWidth, h = cv.height = innerHeight, t = (now - t0) / 1000;
    c.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + s.tw));
      c.fillStyle = `rgba(150,200,255,${a * s.z})`;
      c.fillRect(s.x * w, ((s.y + t * 0.01 * s.z) % 1) * h, s.z * 2.2, s.z * 2.2);
    }
    for (const o of orbs) {
      const y = ((o.y - t * o.v) % 1.3 + 1.3) % 1.3;
      const g = c.createRadialGradient(o.x * w, y * h, 0, o.x * w, y * h, o.r * 3);
      g.addColorStop(0, `hsla(${o.h},100%,65%,.55)`); g.addColorStop(1, 'transparent');
      c.fillStyle = g; c.beginPath(); c.arc(o.x * w, y * h, o.r * 3, 0, 7); c.fill();
    }
    // a seed that sprouts under the logo
    const k = clamp((t - 0.6) / 1.8, 0, 1);
    drawCreature(c, w / 2, h / 2 + 200, 70, Math.min(7, Math.floor(k * 8)), { t, glow: true });
    // light rings
    c.strokeStyle = `rgba(71,180,255,${0.35 * (1 - (t % 1.6) / 1.6)})`; c.lineWidth = 2;
    c.beginPath(); c.arc(w / 2, h / 2 - 20, 160 + (t % 1.6) * 260, 0, 7); c.stroke();
    $('splashFill').style.width = `${clamp((now - t0) / DUR, 0, 1) * 100}%`;
    if (now - t0 > DUR) return finish();
    requestAnimationFrame(frame);
  }
  function finish() {
    if (done) return;
    done = true;
    sp.classList.add('out');
    setTimeout(() => sp.remove(), 750);
  }
  sp.addEventListener('click', finish);
  requestAnimationFrame(frame);
}

// ====================================================================== the hero creature (original design)
function drawCreature(c, x, y, size, st, o = {}) {
  const t = o.t || 0, s = size * (0.78 + st * 0.04);
  const bob = Math.sin(t * 3) * s * 0.03;
  c.save();
  c.translate(x, y + bob);
  if (o.glow || st >= 6) {
    const g = c.createRadialGradient(0, -s * 0.2, 0, 0, -s * 0.2, s * 1.3);
    g.addColorStop(0, st >= 7 ? 'rgba(80,170,255,.55)' : 'rgba(120,255,170,.35)'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.beginPath(); c.arc(0, -s * 0.2, s * 1.3, 0, 7); c.fill();
  }
  // cape (merch) behind the body
  if (o.outfit === 'cape' || st >= 7) {
    c.fillStyle = st >= 7 && o.outfit !== 'cape' ? '#1e6fff' : '#e53950';
    c.beginPath(); c.moveTo(-s * 0.35, -s * 0.35); c.quadraticCurveTo(-s * 0.75, s * 0.3, -s * 0.5 + Math.sin(t * 4) * s * 0.06, s * 0.42);
    c.lineTo(s * 0.5, s * 0.42); c.quadraticCurveTo(s * 0.75, s * 0.3, s * 0.35, -s * 0.35); c.fill();
  }
  // ---- original hero "Seedy": an upright round sprout-sprite with leaf ears (high-quality painted look)
  const admin = st >= 7;
  const pal = admin
    ? { hi: '#c9f1ff', mid: '#5cb8ff', lo: '#1f5fb8', ink: '#0f2a52', belly: '#eaf8ff', iris1: '#fff1a8', iris2: '#ffb020' }
    : { hi: '#d9ff9c', mid: '#7fd65a', lo: '#3c8f2e', ink: '#1f3a1c', belly: '#f6f3c8', iris1: '#ffe9a0', iris2: '#e08a12' };
  const ink = Math.max(1.6, s * 0.032);
  // soft ground shadow
  c.fillStyle = 'rgba(20,30,10,.28)'; c.beginPath(); c.ellipse(0, s * 0.43, s * 0.44, s * 0.1, 0, 0, 7); c.fill();
  // feet: round nubs with toe creases
  for (const fx of [-0.22, 0.22]) {
    const fg = c.createLinearGradient(0, s * 0.3, 0, s * 0.45); fg.addColorStop(0, pal.mid); fg.addColorStop(1, pal.lo);
    c.fillStyle = fg; c.strokeStyle = pal.ink; c.lineWidth = ink;
    c.beginPath(); c.ellipse(fx * s, s * 0.37, s * 0.13, s * 0.08, 0, 0, 7); c.fill(); c.stroke();
    c.lineWidth = ink * 0.6;
    for (const k of [-0.04, 0.03]) { c.beginPath(); c.moveTo(fx * s + k * s, s * 0.4); c.lineTo(fx * s + k * s, s * 0.44); c.stroke(); }
  }
  // head plant grows behind the body
  drawPlant(c, s, st, t);
  // leaf ears
  const wig = Math.sin(t * 2.4) * 0.08;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * s * 0.42, -s * 0.12); c.rotate(sd * (1.05 + wig));
    const lg = c.createLinearGradient(0, 0, 0, -s * 0.28); lg.addColorStop(0, pal.lo); lg.addColorStop(1, pal.hi);
    c.fillStyle = lg; c.strokeStyle = pal.ink; c.lineWidth = ink;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.13, -s * 0.12, 0, -s * 0.3); c.quadraticCurveTo(-s * 0.13, -s * 0.12, 0, 0); c.fill(); c.stroke();
    c.lineWidth = ink * 0.55; c.beginPath(); c.moveTo(0, -s * 0.02); c.lineTo(0, -s * 0.24); c.stroke();
    c.restore();
  }
  // tiny arms
  for (const sd of [-1, 1]) {
    c.fillStyle = pal.mid; c.strokeStyle = pal.ink; c.lineWidth = ink;
    c.beginPath(); c.ellipse(sd * s * 0.44, s * 0.12, s * 0.08, s * 0.11, sd * 0.5 + Math.sin(t * 3) * 0.08 * sd, 0, 7); c.fill(); c.stroke();
  }
  // body: base gradient, shaded side, rim light, painted texture, ink outline
  const bodyPath = () => { c.beginPath(); c.ellipse(0, 0, s * 0.47, s * 0.41, 0, 0, 7); };
  const bg = c.createRadialGradient(-s * 0.16, -s * 0.2, s * 0.04, 0, s * 0.05, s * 0.55);
  bg.addColorStop(0, pal.hi); bg.addColorStop(0.55, pal.mid); bg.addColorStop(1, pal.lo);
  c.fillStyle = bg; bodyPath(); c.fill();
  c.save(); bodyPath(); c.clip();
  c.fillStyle = 'rgba(10,40,10,.18)'; c.beginPath(); c.ellipse(s * 0.2, s * 0.22, s * 0.42, s * 0.3, -0.4, 0, 7); c.fill();   // core shadow
  for (let k = 0; k < 9; k++) {   // soft watercolour blooms
    const a = k * 2.39, r = s * (0.08 + (k % 3) * 0.04);
    c.fillStyle = k % 2 ? 'rgba(255,255,220,.08)' : 'rgba(20,60,20,.07)';
    c.beginPath(); c.ellipse(Math.cos(a) * s * 0.28, Math.sin(a) * s * 0.22, r, r * 0.7, a, 0, 7); c.fill();
  }
  c.fillStyle = pal.belly; c.globalAlpha = 0.95;          // cream belly
  c.beginPath(); c.ellipse(0, s * 0.2, s * 0.25, s * 0.18, 0, 0, 7); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = s * 0.035;   // rim light
  c.beginPath(); c.ellipse(-s * 0.02, -s * 0.02, s * 0.42, s * 0.36, 0, Math.PI * 1.08, Math.PI * 1.55); c.stroke();
  c.restore();
  c.strokeStyle = pal.ink; c.lineWidth = ink; bodyPath(); c.stroke();
  // freckles
  c.fillStyle = 'rgba(255,255,210,.55)';
  for (const [a, b] of [[-0.31, 0.02], [-0.27, 0.07], [0.3, 0.03], [0.34, 0.08]]) { c.beginPath(); c.arc(a * s, b * s, s * 0.014, 0, 7); c.fill(); }
  // eyes: big glossy amber eyes with lids and two highlights
  const blink = (Math.sin(t * 1.3 + x) > 0.985) ? 0.12 : 1;
  for (const sd of [-1, 1]) {
    const ex = sd * s * 0.17, ey = -s * 0.07, rx = s * 0.105, ry = s * 0.125 * blink;
    c.fillStyle = '#ffffff'; c.strokeStyle = pal.ink; c.lineWidth = ink * 0.9;
    c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, 7); c.fill(); c.stroke();
    if (blink > 0.5) {
      const ig = c.createRadialGradient(ex, ey - ry * 0.3, 1, ex, ey + ry * 0.1, rx * 0.8);
      ig.addColorStop(0, pal.iris1); ig.addColorStop(1, pal.iris2);
      c.fillStyle = ig; c.beginPath(); c.ellipse(ex + sd * rx * 0.08, ey + ry * 0.12, rx * 0.7, ry * 0.74, 0, 0, 7); c.fill();
      c.fillStyle = '#1b1208'; c.beginPath(); c.ellipse(ex + sd * rx * 0.1, ey + ry * 0.16, rx * 0.36, ry * 0.42, 0, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex - rx * 0.25, ey - ry * 0.3, rx * 0.24, ry * 0.2, -0.4, 0, 7); c.fill();
      c.beginPath(); c.arc(ex + rx * 0.28, ey + ry * 0.35, rx * 0.1, 0, 7); c.fill();
    }
    c.strokeStyle = pal.ink; c.lineWidth = ink * 1.2; c.lineCap = 'round';   // upper lid
    c.beginPath(); c.ellipse(ex, ey, rx * 1.02, ry * 1.02, 0, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  }
  // happy open mouth with a little tongue
  c.fillStyle = '#7a2a3a'; c.strokeStyle = pal.ink; c.lineWidth = ink * 0.9; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-s * 0.11, s * 0.075); c.quadraticCurveTo(0, s * 0.235, s * 0.11, s * 0.075); c.quadraticCurveTo(0, s * 0.105, -s * 0.11, s * 0.075); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ff8fa6'; c.beginPath(); c.ellipse(0, s * 0.165, s * 0.05, s * 0.03, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-s * 0.075, s * 0.085); c.lineTo(-s * 0.055, s * 0.115); c.lineTo(-s * 0.04, s * 0.088); c.closePath(); c.fill();
  // blush
  c.fillStyle = 'rgba(255,120,140,.38)';
  for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * 0.3, s * 0.07, s * 0.06, s * 0.032, 0, 0, 7); c.fill(); }
  // outfit / hat (merch) as emoji
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
  const outfit = merchDef(o.outfit);
  if (outfit && o.outfit !== 'cape') {
    const pos = outfit.id === 'glasses' ? [0, -s * 0.06, 0.3] : [0, s * 0.27, 0.26];
    c.font = `${s * pos[2]}px ${EMOJI_FONT}`; drawAsset(outfit, pos[0], pos[1], s * pos[2] * 1.2, 1, c);
  }
  const hat = merchDef(o.hat);
  if (st >= 7 && !hat) { c.font = `${s * 0.42}px ${EMOJI_FONT}`; c.fillText('👑', 0, -s * 0.62); }
  if (hat) { c.font = `${s * 0.42}px ${EMOJI_FONT}`; drawAsset(hat, 0, -s * 0.6, s * 0.5, 1, c); }
  c.restore();
}

function drawPlant(c, s, st, t) {
  const sway = Math.sin(t * 2.2) * 0.08;
  c.save(); c.translate(0, -s * 0.3); c.rotate(sway);
  const ink = st >= 7 ? '#0f2a52' : '#1f3a1c', lw = Math.max(1.4, s * 0.026);
  // painted leaf: gradient, ink outline and a centre vein
  const leaf = (len, ang, light, dark) => {
    c.save(); c.rotate(ang);
    const g = c.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, dark); g.addColorStop(1, light);
    c.fillStyle = g; c.strokeStyle = ink; c.lineWidth = lw;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.48, -len * 0.42, 0, -len); c.quadraticCurveTo(-len * 0.48, -len * 0.42, 0, 0); c.fill(); c.stroke();
    c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -len * 0.08); c.quadraticCurveTo(len * 0.05, -len * 0.5, 0, -len * 0.88); c.stroke();
    c.restore();
  };
  const L1 = ['#9ef08a', '#3c9a3e'], L2 = ['#c4ff9a', '#5cb84a'];
  // later forms: a fanned crown of long leaves behind everything (an open spray of leaves, not a ball)
  if (st >= 4) {
    const n = st >= 5 ? 7 : 5, len = s * (st >= 5 ? 0.62 : 0.52);
    for (let i = 0; i < n; i++) { const a = -1.25 + i * (2.5 / (n - 1)); leaf(len, a, ...(i % 2 ? L1 : L2)); }
  }
  if (st === 0) { leaf(s * 0.25, -0.5, ...L2); leaf(s * 0.25, 0.5, ...L1); }
  if (st >= 1) { leaf(s * 0.35, -0.7, ...L1); leaf(s * 0.35, 0.7, ...L2); leaf(s * 0.32, 0, ...L2); }
  if (st >= 2 && st < 4) { leaf(s * 0.45, -1.1, ...L2); leaf(s * 0.45, 1.1, ...L1); }
  if (st === 2) { c.fillStyle = '#ff9fc4'; c.strokeStyle = ink; c.lineWidth = lw; c.beginPath(); c.ellipse(0, -s * 0.38, s * 0.07, s * 0.09, 0, 0, 7); c.fill(); c.stroke(); }
  if (st >= 3) {
    const petals = st >= 6 ? 10 : 6, pr = s * (st >= 6 ? 0.2 : 0.14), cy = -s * (st >= 4 ? 0.58 : 0.42);
    c.strokeStyle = ink; c.lineWidth = lw;
    for (let i = 0; i < petals; i++) {
      const a = i / petals * Math.PI * 2 + t * (st >= 6 ? 0.6 : 0);
      const pg = c.createRadialGradient(0, cy, 1, 0, cy, pr * 1.4);
      pg.addColorStop(0, st >= 6 ? '#fff3a0' : '#ffd1e6'); pg.addColorStop(1, st >= 6 ? '#ffb81f' : '#ff6fab');
      c.fillStyle = pg;
      c.beginPath(); c.ellipse(Math.cos(a) * pr, cy + Math.sin(a) * pr, pr * 0.7, pr * 0.38, a, 0, 7); c.fill(); c.stroke();
    }
    c.fillStyle = st >= 6 ? '#ff8c1a' : '#ffe066'; c.beginPath(); c.arc(0, cy, pr * 0.55, 0, 7); c.fill(); c.stroke();
    c.fillStyle = 'rgba(120,60,10,.45)';
    for (let i = 0; i < 6; i++) { const a = i * 1.05; c.beginPath(); c.arc(Math.cos(a) * pr * 0.28, cy + Math.sin(a) * pr * 0.28, pr * 0.06, 0, 7); c.fill(); }
  }
  if (st >= 5) {   // curling vines with little leaves
    for (const sd of [-1, 1]) {
      c.strokeStyle = ink; c.lineWidth = s * 0.06; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -s * 0.15); c.quadraticCurveTo(sd * s * 0.62, -s * 0.5, sd * s * 0.56, -s * 0.02); c.stroke();
      c.strokeStyle = '#4fae3e'; c.lineWidth = s * 0.035; c.stroke();
      c.save(); c.translate(sd * s * 0.56, -s * 0.02); leaf(s * 0.16, sd * 2.4, ...L2); c.restore();
    }
  }
  if (st >= 6) {
    c.strokeStyle = 'rgba(255,220,90,.55)'; c.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + t;
      c.beginPath(); c.moveTo(Math.cos(a) * s * 0.3, -s * 0.62 + Math.sin(a) * s * 0.3);
      c.lineTo(Math.cos(a) * s * 0.45, -s * 0.62 + Math.sin(a) * s * 0.45); c.stroke();
    }
  }
  c.restore();
}

// ====================================================================== map
function blankMap(name = 'My game', night = false) {
  return {
    name, night, ground: Array(COLS * ROWS).fill('e'), decor: Array(COLS * ROWS).fill(''),
    spawn: null, home: null,
    waves: [[{ t: 'buzzi', e: false, n: 5 }], [{ t: 'buzzi', e: false, n: 6 }, { t: 'zappy', e: false, n: 3 }]],
  };
}

function starterMap(theme = 'forest') {
  const names = { forest: 'First Island', desert: 'Sun Canyon', volcano: 'Fire Volcano' };
  const m = blankMap(names[theme] || 'My map', false);
  m.theme = theme;
  const base = { forest: 'g', desert: 's', volcano: 'd' }[theme] || 'g', liq = theme === 'volcano' ? 'l' : 'w';
  m.ground.fill(base);
  const set = (x, y, g) => { if (inMap(x, y)) m.ground[idx(x, y)] = g; };
  const R = (() => { let s = 7 + theme.length; return () => (s = s * 16807 % 2147483647) / 2147483647; })();
  // a river (lava on the volcano) running top to bottom with a little bend
  for (let y = 0; y < ROWS; y++) { const rx = y < 6 ? 15 : 16; set(rx, y, liq); set(rx + 1, y, liq); }
  const line = (x0, y0, x1, y1) => {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      set(x, y, isLiquid(m.ground[idx(x, y)]) ? 'b' : 'p');
  };
  line(0, 6, 4, 6); line(4, 2, 4, 6); line(4, 2, 10, 2); line(10, 2, 10, 9); line(10, 9, 19, 9); line(19, 5, 19, 9); line(19, 5, 21, 5);
  m.spawn = { x: 0, y: 6 }; m.home = { x: 21, y: 5 };
  for (let i = 0; i < 26; i++) { const x = Math.floor(R() * COLS), y = Math.floor(R() * ROWS); if (m.ground[idx(x, y)] === base) { set(x, y, theme === 'forest' ? (R() < .5 ? 'f' : 's') : theme === 'desert' ? 'd' : 's'); } }
  for (const [x, y] of [[1, 1], [20, 11], [7, 11]]) if (m.ground[idx(x, y)] === base) m.decor[idx(x, y)] = theme === 'forest' ? 'hill' : 'mountain';
  const spots = [[2, 4], [6, 4], [8, 1], [12, 3], [8, 7], [12, 7], [14, 11], [18, 7], [20, 3], [6, 8]];
  for (const [x, y] of spots) if (GROUND[m.ground[idx(x, y)]].build) m.decor[idx(x, y)] = 'spot';
  const sets = {
    forest: { tree: 9, pine: 6, bush: 6, rock: 4, flower: 6, mush: 3, sun: 2, barrel: 2, torch: 2, banner: 1, crate: 1 },
    desert: { cactus: 9, rock: 7, skull: 3, barrel: 3, crate: 3, tent: 1, torch: 2, banner: 2, campfire: 1 },
    volcano: { rock: 8, barrel: 7, crate: 3, torch: 5, campfire: 2, banner: 3, crystal: 2, skull: 3 },
  }[theme];
  for (const [id, n] of Object.entries(sets)) {
    for (let k = 0, tries = 0; k < n && tries < 400; tries++) {
      const x = Math.floor(R() * COLS), y = Math.floor(R() * ROWS), i = idx(x, y);
      if (!GROUND[m.ground[i]].build || m.decor[i] || isSpecialOf(m, x, y)) continue;
      const nearRoad = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inMap(x + dx, y + dy) && GROUND[m.ground[idx(x + dx, y + dy)]].walk);
      if (nearRoad && R() < .6) continue;    // keep room around the road for build spots
      m.decor[i] = id; k++;
    }
  }
  m.waves = [
    [{ t: 'buzzi', e: false, n: 6 }],
    [{ t: 'buzzi', e: false, n: 5 }, { t: 'zappy', e: false, n: 4 }],
    [{ t: 'flamix', e: false, n: 5 }, { t: 'bubbo', e: false, n: 4 }, { t: 'flamix', e: true, n: 1 }],
    [{ t: 'spooki', e: false, n: 6 }, { t: 'toxa', e: false, n: 4 }],
    [{ t: 'frosty', e: false, n: 3 }, { t: 'rocko', e: false, n: 3 }, { t: 'rocko', e: true, n: 1 }],
  ];
  return m;
}
function isSpecialOf(m, x, y) { return !!((m.spawn && m.spawn.x === x && m.spawn.y === y) || (m.home && m.home.x === x && m.home.y === y)); }

function findRoute(m) {
  const { spawn: s, home: h } = m;
  if (!s || !h) return null;
  const walk = (x, y) => inMap(x, y) && (GROUND[m.ground[idx(x, y)]].walk || (x === h.x && y === h.y) || (x === s.x && y === s.y));
  const prev = new Map(), q = [[s.x, s.y]], key = (x, y) => x + ',' + y;
  prev.set(key(s.x, s.y), null);
  while (q.length) {
    const [x, y] = q.shift();
    if (x === h.x && y === h.y) {
      const out = []; let k = key(x, y);
      while (k) { const [a, b] = k.split(',').map(Number); out.push({ x: a, y: b }); k = prev.get(k); }
      return out.reverse();
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = key(nx, ny);
      if (walk(nx, ny) && !prev.has(nk)) { prev.set(nk, key(x, y)); q.push([nx, ny]); }
    }
  }
  return null;
}

function refreshRoute() {
  route = findRoute(map);
  const w = $('pathWarn');
  w.textContent = !map.spawn || !map.home ? `⚠️ Place ${!map.spawn ? 'the 🌀 portal' : ''}${!map.spawn && !map.home ? ' and ' : ''}${!map.home ? 'the 🏰 castle' : ''} (in Special)`
    : '⚠️ Connect the 🌀 portal to the 🏰 castle with a path';
  w.classList.toggle('hidden', !!route);
}

// ====================================================================== drawing the world
function noise(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }

let terrain = null, terrainKey = '';
function drawGround(m, t) {
  const key = m.ground.join('');
  if (!terrain || key !== terrainKey) { terrain = bakeTerrain(m, COLS, ROWS, T); terrainKey = key; }
  ctx.drawImage(terrain, 0, 0);
  drawLiquidFx(ctx, m, COLS, ROWS, T, t);
}

function drawEmoji(e, x, y, size, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';   // colour emoji take their alpha from fillStyle: a translucent leftover made them look ghostly
  ctx.font = `${size}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e, x, y);
  ctx.globalAlpha = 1;
}

// ---- assets drawn by Claude (SVG) with emoji fallback
const imgCache = {};
function assetImg(def) {
  if (!def || !def.svg || !def.id) return null;
  let im = imgCache[def.id];
  if (!im) { im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(def.svg); imgCache[def.id] = im; }
  return im.complete && im.naturalWidth ? im : null;
}
function drawAsset(def, x, y, size, alpha = 1, c = ctx) {
  const im = assetImg(def);
  if (im) { c.globalAlpha = alpha; c.drawImage(im, x - size / 2, y - size / 2, size, size); c.globalAlpha = 1; return; }
  if (c === ctx) drawEmoji(def.emoji, x, y, size, alpha);
  else { c.fillStyle = '#000'; c.font = `${size}px ${EMOJI_FONT}`; c.fillText(def.emoji, x, y); }
}
const thumbCache = {};
function artThumb(kind, id) {
  const k = kind + id;
  if (thumbCache[k] !== undefined) return thumbCache[k];
  let url = null;
  if ((kind === 'decor' && PROPS[id]) || (kind === 'enemy' && ENEMY_ART[id]) || (kind === 'decor' && id === 'spot') || kind === 'hero') {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d');
    if (kind === 'decor' && id === 'spot') drawSpot(c, 48, 52, 90, 0, '');
    else if (kind === 'decor') PROPS[id](c, 48, 50, 92, 0.3, 0.5);
    else if (kind === 'hero') drawCreature(c, 48, 56, 70, +id, { t: 0 });
    else drawEnemyArt(c, id, 48, 48, 100, 0.2, {});
    url = cv.toDataURL();
  }
  return (thumbCache[k] = url);
}
function assetHtml(def, px = 30) {
  const art = def && def.id && artThumb(def.kind === 'enemy' || ENEMIES[def.id] ? 'enemy' : 'decor', def.id);
  if (art) return `<img class="asset" style="width:${px}px;height:${px}px" src="${art}">`;
  if (def && def.svg) return `<img class="asset" style="width:${px}px;height:${px}px" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(def.svg)}">`;
  return `<span class="em">${def ? def.emoji : '?'}</span>`;
}
function stageName(i) { return (profile.names && profile.names[i]) || STAGES[i].name; }

function drawDecor(m, t, onlySpots) {
  if (!onlySpots) drawFenceNetwork(ctx, m, COLS, ROWS, T);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const d = m.decor[idx(x, y)];
    if (!d) continue;
    const def = decorDef(d);
    if (!def) continue;
    const cx = x * T + T / 2, cy = y * T + T / 2;
    if (def.spot) {
      if (!onlySpots) continue;
      let state = '';
      if (mode === 'play' && game) {
        const taken = game.towers.some(tw => tw.x === x && tw.y === y);
        if (!taken && game.placing) state = hoverTile && hoverTile.x === x && hoverTile.y === y ? 'hover' : 'free';
      } else if (mode === 'create') state = 'free';
      drawSpot(ctx, cx, cy + 6, T * 1.05, t, state);
      continue;
    }
    if (onlySpots) continue;
    if (def.id === 'fence') continue;   // drawn as one network below
    if (PROPS[def.id]) { const big = { mountain: 2.1, hill: 1.6, tree: 1.55, pine: 1.5, hut: 1.5, tent: 1.4, crystal: 1.35, campfire: 1.25, banner: 1.35, cactus: 1.35 }[def.id] || 1.2; PROPS[def.id](ctx, cx, cy - (big - 1.2) * T * 0.25, T * big, t, hash2(x, y)); continue; }
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(cx, cy + 16, 15, 5, 0, 0, 7); ctx.fill();
    drawAsset(def, cx, cy - 2, def.blocks ? 36 : 28);
  }
}

function drawSpecials(m, t) {
  const s = m.spawn, h = m.home;
  if (s) drawPortal(ctx, s.x * T + T / 2, s.y * T + T / 2, T, t);
  if (h) drawCastle(ctx, h.x * T + T / 2, h.y * T + T / 2, T * 1.5, t);
  return;
  // portal
  const px = s.x * T + T / 2, py = s.y * T + T / 2;
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `hsla(${200 + k * 30},100%,65%,.8)`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(px, py, 18 - k * 5, 20 - k * 5, t * (1.5 + k), 0, 5); ctx.stroke();
  }
  drawPortal(ctx, px, py, T, t);
  // home
  const hx = h.x * T + T / 2, hy = h.y * T + T / 2;
  const glow = ctx.createRadialGradient(hx, hy, 4, hx, hy, 34);
  glow.addColorStop(0, 'rgba(120,200,255,.6)'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(hx, hy, 34, 0, 7); ctx.fill();
  drawCastle(ctx, hx, hy, T * 1.5, t);
}

function drawRoutePreview(t) {
  if (!route) return;
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  const total = route.length;
  for (let i = 0; i < total - 1; i++) {
    const a = route[i], b = route[i + 1];
    for (let k = 0; k < 2; k++) {
      const f = ((t * 1.2 + i + k * 0.5) % 1);
      if ((i + k) % 2) continue;
      const x = (a.x + (b.x - a.x) * f) * T + T / 2, y = (a.y + (b.y - a.y) * f) * T + T / 2;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
    }
  }
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * T + 0.5, 0); ctx.lineTo(x * T + 0.5, H); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * T + 0.5); ctx.lineTo(W, y * T + 0.5); ctx.stroke(); }
}

// ====================================================================== palette
const TABS = [
  { id: 'ground', label: '🟩 Ground' }, { id: 'decor', label: '🌳 Nature' },
  { id: 'special', label: '🏰 Special' }, { id: 'enemy', label: '👾 Enemies' },
];

function paletteItems() {
  if (tab === 'ground') return Object.entries(GROUND).filter(([, g]) => !g.hidden).map(([id, g]) => ({ cat: 'ground', id, name: g.name, color: g.color }));
  if (tab === 'decor') return Object.entries(DECOR).map(([id, d]) => ({ cat: 'decor', id, name: d.name, emoji: d.emoji }))
    .concat(custom.filter(c => c.kind === 'decor').map(c => ({ cat: 'decor', id: c.id, name: c.name, emoji: c.emoji, svg: c.svg, isNew: true })));
  if (tab === 'special') return [{ cat: 'decor', id: 'spot', name: 'Hero spot', emoji: '⭕' }, { cat: 'special', id: 'spawn', name: 'Portal', emoji: '🌀' }, { cat: 'special', id: 'home', name: 'Castle', emoji: '🏰' }];
  return Object.entries(ENEMIES).map(([id, e]) => ({ cat: 'enemy', id, kind: 'enemy', name: `${e.name} · ${e.type}`, emoji: e.emoji }))
    .concat(custom.filter(c => c.kind === 'enemy').map(c => ({ cat: 'enemy', id: c.id, name: c.name, emoji: c.emoji, svg: c.svg, isNew: true })));
}

function renderTabs() {
  $('tabs').innerHTML = TABS.map(t => `<button class="tab ${t.id === tab ? 'on' : ''}" data-tab="${t.id}">${t.label}</button>`).join('');
  $('tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.tab; sfx.click(); renderTabs(); renderPalette(); });
}

function renderPalette(filter = '') {
  const items = paletteItems().filter(i => !filter || i.name.toLowerCase().includes(filter));
  $('palette').innerHTML = items.map(i => `
    <div class="pitem ${brush.cat === i.cat && brush.id === i.id ? 'on' : ''}" data-cat="${i.cat}" data-id="${i.id}" title="${i.name}">
      ${i.isNew ? '<span class="new">NEW</span>' : ''}
      ${i.color ? `<div class="sw" style="background:${i.color}"></div>` : assetHtml(i, 34)}
      <small>${i.name}</small></div>`).join('');
  $('palette').querySelectorAll('.pitem').forEach(el => el.onclick = () => {
    sfx.click();
    if (el.dataset.cat === 'enemy') { addEnemyToWave(el.dataset.id); return; }
    brush = { cat: el.dataset.cat, id: el.dataset.id };
    setTool('brush');
    renderPalette();
  });
}

function setTool(t) {
  tool = t;
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
}

// ====================================================================== waves editor
function renderWaves() {
  const list = $('waveList');
  list.innerHTML = map.waves.map((w, i) => {
    const units = w.map((u, k) => `<span class="unit ${u.e ? 'elite' : ''}" data-w="${i}" data-k="${k}" title="Click to remove one">${assetHtml(enemyDef(u.t), 22)}<sub>×${u.n}</sub></span>`).join('');
    const doneCls = game && i < game.wave ? 'done' : '';
    return `<div class="wave ${i === currentWave ? 'on' : ''} ${doneCls}" data-w="${i}"><b>Wave ${i + 1}</b><span class="wx" data-x="${i}" title="Delete wave">✕</span><div class="units">${units || '<span class="muted">empty</span>'}</div></div>`;
  }).join('');
  list.querySelectorAll('.wave').forEach(el => el.onclick = (e) => {
    if (e.target.dataset.x !== undefined) {
      if (mode !== 'create') return;
      if (map.waves.length > 1) { pushUndo(); map.waves.splice(+e.target.dataset.x, 1); currentWave = clamp(currentWave, 0, map.waves.length - 1); changed(); }
      return renderWaves();
    }
    if (e.target.classList.contains('unit') && mode === 'create') {
      pushUndo();
      const w = map.waves[+e.target.dataset.w], u = w[+e.target.dataset.k];
      u.n--; if (u.n <= 0) w.splice(+e.target.dataset.k, 1);
      changed(); return renderWaves();
    }
    currentWave = +el.dataset.w; renderWaves();
  });
}

function addEnemyToWave(id) {
  if (mode !== 'create') return toast('Stop the game to change the waves');
  pushUndo();
  const elite = $('eliteToggle').checked;
  const w = map.waves[currentWave] || (map.waves[currentWave] = []);
  const u = w.find(x => x.t === id && x.e === elite);
  if (u) u.n = Math.min(30, u.n + 1); else w.push({ t: id, e: elite, n: 1 });
  changed(); renderWaves();
  toast(`${enemyDef(id).emoji} ${enemyDef(id).name}${elite ? ' ⭐ ELITE' : ''} added to Wave ${currentWave + 1}`, 1400);
}

// ====================================================================== editing
function pushUndo() {
  undoStack.push(JSON.stringify(map));
  if (undoStack.length > 50) undoStack.shift();
}
function undo() {
  if (!undoStack.length || mode !== 'create') return;
  map = JSON.parse(undoStack.pop());
  $('mapName').value = map.name;
  refreshRoute(); renderWaves(); sfx.click(); changed(false);
}

let saveTimer = null;
function changed(save = true) {
  refreshRoute();
  if (!save) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => api('/api/map', map).catch(() => { }), 1200);   // autosave
}

function tileFromEvent(e) {
  if (is3d()) return R3D.pickTile(e);
  const r = stage.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS);
  return inMap(x, y) ? { x, y } : null;
}

function paintAt(tl) {
  const i = idx(tl.x, tl.y);
  if (tool === 'erase') {
    if (map.decor[i]) map.decor[i] = '';
    else if (isSpecial(tl)) { if (map.spawn && map.spawn.x === tl.x && map.spawn.y === tl.y) map.spawn = null; else map.home = null; }
    else map.ground[i] = 'e';
    return;
  }
  if (tool === 'fill' && brush.cat === 'ground') return floodFill(tl, brush.id);
  if (brush.cat === 'ground') {
    let g = brush.id;
    if (g === 'b' && !isLiquid(map.ground[i]) && map.ground[i] !== 'b') g = 'p';  // a bridge on land is just path
    map.ground[i] = g;
    if (!GROUND[g].build) map.decor[i] = '';
  } else if (brush.cat === 'decor') {
    const g = map.ground[i];
    if (brush.id === 'spot' && map.decor[i] === 'spot') return;
    if (!GROUND[g].build) return toast(g === 'e' ? 'First put down ground (grass, sand, snow…) from 🟩 Ground' : 'This goes on ground, not on a path or river 🌱', 1600);
    if (isSpecial(tl)) return;
    map.decor[i] = brush.id;
  } else if (brush.cat === 'special') {
    const other = brush.id === 'spawn' ? map.home : map.spawn;
    if (other && other.x === tl.x && other.y === tl.y) return;
    map[brush.id] = { x: tl.x, y: tl.y };
    map.decor[i] = '';
  }
}

function isSpecial(tl) { return isSpecialOf(map, tl.x, tl.y); }

function floodFill(start, g) {
  const from = map.ground[idx(start.x, start.y)];
  if (from === g) return;
  const q = [start], seen = new Set();
  while (q.length) {
    const { x, y } = q.pop(), k = idx(x, y);
    if (!inMap(x, y) || seen.has(k) || map.ground[k] !== from) continue;
    seen.add(k); map.ground[k] = g;
    if (!GROUND[g].build) map.decor[k] = '';
    q.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
  }
}

$('stageWrap').addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;          // right/middle button rotates the 3D camera
  const tl = tileFromEvent(e);
  if (!tl) return;
  if (mode === 'play') return onPlayClick(tl);
  pushUndo();
  painting = true;
  paintAt(tl);
  sfx.click();
  changed();
});
$('stageWrap').addEventListener('mousemove', (e) => {
  hoverTile = tileFromEvent(e);
  if (painting && hoverTile && mode === 'create' && tool !== 'fill' && brush.cat !== 'special') { paintAt(hoverTile); changed(); }
});
addEventListener('mouseup', () => painting = false);
$('stageWrap').addEventListener('mouseleave', () => hoverTile = null);
stage.addEventListener('contextmenu', (e) => e.preventDefault());

// ====================================================================== PLAY mode
function startGame() {
  refreshRoute();
  if (!map.spawn || !map.home) { toast('⚠️ Place the 🌀 portal and the 🏰 castle (Special tab)', 2600); return false; }
  if (!route) { toast('⚠️ Make a path from the 🌀 portal to the 🏰 castle', 2600); return false; }
  const total = map.waves.filter(w => w.length).length;
  if (!total) { toast('Add at least one enemy to the waves 👾'); return false; }
  game = {
    lives: 20, energy: 150, score: 0, wave: 0, waveRunning: false, spawnQueue: [], spawnT: 0,
    towers: [], enemies: [], shots: [], fx: [], beams: [], speed: 1, placing: false, selected: null,
    earnedCoins: 0, earnedXp: 0, powerCd: { freeze: 0, strike: 0, coins: 0, heal: 0 }, freezeT: 0, over: false,
    waves: map.waves.filter(w => w.length).map(w => JSON.parse(JSON.stringify(w))),
    pts: route.map(p => ({ x: p.x * T + T / 2, y: p.y * T + T / 2 })),
  };
  const gt = guardianTile(map);
  if (gt) game.towers.push({ x: gt.x, y: gt.y, cd: 0, born: -9, guardian: true });
  game.segLen = []; game.total = 0;
  for (let i = 0; i < game.pts.length - 1; i++) {
    const d = Math.hypot(game.pts[i + 1].x - game.pts[i].x, game.pts[i + 1].y - game.pts[i].y);
    game.segLen.push(d); game.total += d;
  }
  return true;
}

function hasSpots() { return map.decor.includes('spot'); }
function canBuild(tl) {
  const i = idx(tl.x, tl.y), g = map.ground[i], d = decorDef(map.decor[i]);
  if (game && game.towers.some(tw => tw.x === tl.x && tw.y === tl.y)) return false;
  if (hasSpots()) return !!(d && d.spot);
  return GROUND[g].build && !(d && d.blocks) && !isSpecial(tl);
}
// the guardian: a free hero that always stands in front of the castle
function guardianTile(m) {
  const h = m.home, opts = [];
  if (!h) return null;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = h.x + dx, y = h.y + dy;
    if ((!dx && !dy) || !inMap(x, y)) continue;
    const g = m.ground[idx(x, y)];
    if (!GROUND[g].build) continue;
    opts.push({ x, y, d: Math.abs(dx) + Math.abs(dy) });
  }
  opts.sort((a, b) => a.d - b.d);
  return opts[0] || null;
}
function heroCost() { return 50 + game.towers.filter(tw => !tw.guardian).length * 20; }

function posOnPath(dist) {
  let d = dist;
  for (let i = 0; i < game.segLen.length; i++) {
    if (d <= game.segLen[i]) {
      const a = game.pts[i], b = game.pts[i + 1], f = d / game.segLen[i];
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    d -= game.segLen[i];
  }
  return game.pts[game.pts.length - 1];
}

function onPlayClick(tl) {
  if (!game || game.over) return;
  const tower = game.towers.find(t => t.x === tl.x && t.y === tl.y);
  if (tower) { game.selected = game.selected === tower ? null : tower; return; }
  if (!game.placing) { game.selected = null; return; }
  if (!canBuild(tl)) { toast(hasSpots() ? 'Put the hero on a ⭕ hero spot' : 'You can not put it here 🙈 (pick grass with no trees)', 1600); return; }
  if (game.energy < heroCost()) { toast('Not enough energy ⚡'); return; }
  game.energy -= heroCost();
  game.towers.push({ x: tl.x, y: tl.y, cd: 0, born: performance.now() / 1000 });
  game.placing = false;
  burst(tl.x * T + T / 2, tl.y * T + T / 2, '#7df0a8', 18);
  sfx.place();
  updatePlayUi();
}

function startWave() {
  if (!game || game.waveRunning || game.over || game.wave >= game.waves.length) return;
  const w = game.waves[game.wave];
  const q = [];
  for (const u of w) for (let n = 0; n < u.n; n++) q.push({ t: u.t, e: u.e });
  q.sort(() => Math.random() - 0.5);
  q.sort((a, b) => a.e - b.e);           // elites come last, like a boss
  game.spawnQueue = q; game.spawnT = 0.3; game.waveRunning = true;
  game.energy += 10;
  toast(`🌊 Wave ${game.wave + 1} is coming!`, 1400);
  beep(440, 0.15, 'triangle', 0.1); setTimeout(() => beep(660, 0.2, 'triangle', 0.1), 150);
  updatePlayUi(); renderWaves();
}

function spawnEnemy(u) {
  const def = enemyDef(u.t), elite = u.e;
  game.enemies.push({
    def, elite, hp: def.hp * (elite ? 3 : 1) * (1 + game.wave * 0.12), maxHp: def.hp * (elite ? 3 : 1) * (1 + game.wave * 0.12),
    dist: 0, speed: def.speed * T * (elite ? 0.85 : 1), slowT: 0, slowF: 1, x: game.pts[0].x, y: game.pts[0].y,
    size: (def.size || 1) * (elite ? 1.55 : 1), wob: Math.random() * 6,
  });
}

function stats() { return STAGES[profile.stage]; }

function updateGame(dt) {
  const g = game;
  if (!g || g.over) return;
  const st = stats();
  for (const k in g.powerCd) g.powerCd[k] = Math.max(0, g.powerCd[k] - dt);
  if (g.freezeT > 0) g.freezeT -= dt;

  // spawning
  if (g.waveRunning && g.spawnQueue.length) {
    g.spawnT -= dt;
    if (g.spawnT <= 0) { const u = g.spawnQueue.shift(); spawnEnemy(u); g.spawnT = u.e ? 1.4 : 0.85; }
  }

  // enemies walk
  for (const e of g.enemies) {
    if (e.slowT > 0) e.slowT -= dt; else e.slowF = 1;
    const v = g.freezeT > 0 ? 0 : e.speed * e.slowF;
    e.dist += v * dt;
    const p = posOnPath(e.dist);
    if (Math.abs(p.x - e.x) > 0.01) e.dir = p.x > e.x ? 1 : -1;
    e.x = p.x; e.y = p.y;
    if (e.dist >= g.total) {
      e.dead = true;
      g.lives -= e.elite ? 3 : 1;
      sfx.leak(); shake(6);
      floatText(e.x, e.y - 20, e.elite ? '-3 ❤️' : '-1 ❤️', '#ff5a6a');
    }
  }

  // towers shoot
  for (const tw of g.towers) {
    tw.cd -= dt;
    if (tw.cd > 0) continue;
    const cx = tw.x * T + T / 2, cy = tw.y * T + T / 2, r = st.range * T;
    const targets = g.enemies.filter(e => !e.dead && Math.hypot(e.x - cx, e.y - cy) <= r)
      .sort((a, b) => b.dist - a.dist).slice(0, st.targets);
    if (!targets.length) continue;
    tw.cd = 1 / st.rate;
    tw.kick = 0.15;
    for (const tg of targets) {
      if (st.beam) { hitEnemy(tg, st); g.beams.push({ x0: cx, y0: cy - 14, x1: tg.x, y1: tg.y, t: 0.18 }); }
      else g.shots.push({ x: cx, y: cy - 12, tg, spd: 420, st });
    }
    sfx.shoot();
  }

  // shots fly
  for (const s of g.shots) {
    if (s.tg.dead) { s.dead = true; continue; }
    const dx = s.tg.x - s.x, dy = s.tg.y - s.y, d = Math.hypot(dx, dy);
    if (d < 10) { s.dead = true; hitEnemy(s.tg, s.st); continue; }
    s.x += dx / d * s.spd * dt; s.y += dy / d * s.spd * dt; s.rot = Math.atan2(dy, dx);
  }
  for (const b of g.beams) b.t -= dt;

  // deaths
  for (const e of g.enemies) if (!e.dead && e.hp <= 0) killEnemy(e);
  g.enemies = g.enemies.filter(e => !e.dead);
  g.shots = g.shots.filter(s => !s.dead);
  g.beams = g.beams.filter(b => b.t > 0);

  // wave finished?
  if (g.waveRunning && !g.spawnQueue.length && !g.enemies.length) {
    g.waveRunning = false; g.wave++;
    renderWaves();
    if (g.wave >= g.waves.length) return endGame(true);
    toast(`✅ Wave ${g.wave} done! Ready for the next wave?`, 1800);
  }
  if (g.lives <= 0) return endGame(false);
}

function hitEnemy(e, st) {
  dmg(e, st.dmg);
  if (st.slow) { e.slowT = 1.5; e.slowF = 1 - st.slow; }
  if (st.splash) {
    const r = st.splash * T;
    for (const o of game.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < r) dmg(o, st.dmg * 0.5);
    ring(e.x, e.y, r, '#ffd34d');
  }
  burst(e.x, e.y, st.beam ? '#ffe066' : '#7df0a8', 4);
}

function dmg(e, amount) { e.hp -= amount; e.flash = 0.08; }

function killEnemy(e) {
  e.dead = true;
  const coins = Math.round(e.def.reward * (e.elite ? 2 : 1));
  const xp = Math.ceil(e.def.hp / 10) * (e.elite ? 2 : 1);
  game.earnedCoins += coins; game.earnedXp += xp;
  profile.coins += coins; profile.xp += xp;
  game.score += coins * 10 + (e.elite ? 100 : 0);
  game.energy += e.elite ? 12 : 4;
  floatText(e.x, e.y - 18, `+${coins} 🪙${e.elite ? '  2x!' : ''}`, e.elite ? '#ffd34d' : '#fff');
  burst(e.x, e.y, e.elite ? '#ffd34d' : '#ff9ad5', e.elite ? 30 : 12);
  sfx.kill(); if (e.elite) { sfx.coin(); shake(5); }
  updateTopStats();
}

function endGame(won) {
  game.over = true;
  saveProfile();
  const st = STAGES[profile.stage], next = STAGES[profile.stage + 1];
  (won ? sfx.win : sfx.lose)();
  if (won) confetti();
  showModal(`
    <h2>${won ? '🏆 You won!' : '💥 The castle fell!'}</h2>
    <p>${won ? 'Awesome! You protected the castle from every wave.' : 'Never give up! Try putting heroes closer to the path.'}</p>
    <div class="grid">
      <div class="shopitem"><span class="em">🏆</span><b>${game.score}</b>points</div>
      <div class="shopitem"><span class="em">🪙</span><b>+${game.earnedCoins}</b>coins</div>
      <div class="shopitem"><span class="em">⭐</span><b>+${game.earnedXp}</b>XP</div>
      <div class="shopitem"><span class="em">🌱</span><b>${stageName(profile.stage)}</b>${next ? (profile.xp >= next.need ? 'READY to evolve!' : `${next.need - profile.xp} XP to ${stageName(profile.stage + 1)}`) : 'The strongest form!'}</div>
    </div>
    <p style="margin-top:16px"><button class="btn big blue" onclick="closeModal(); stopPlay();">↩️ Back to Create</button>
    <button class="btn big green" onclick="closeModal(); stopPlay(); togglePlay();">🔁 Play again</button></p>`);
}

function usePower(p) {
  if (!game || game.over || profile.stage < 7 || game.powerCd[p] > 0) return;
  game.powerCd[p] = POWERS[p].cd;
  if (p === 'freeze') { game.freezeT = 5; ring(W / 2, H / 2, W, '#6fe3ff'); toast('❄️ All enemies are frozen!'); }
  if (p === 'strike') { for (const e of game.enemies) { dmg(e, 120); burst(e.x, e.y, '#ffd34d', 10); } shake(10); toast('💥 Goditje Admin!'); }
  if (p === 'coins') { profile.coins += 50; game.earnedCoins += 50; sfx.coin(); confetti(40); toast('🪙 +50 coins!'); }
  if (p === 'heal') { game.lives = Math.min(30, game.lives + 5); toast('❤️ +5 lives'); }
  beep(1046, 0.2, 'triangle', 0.1);
  updatePlayUi(); updateTopStats();
}

// ====================================================================== drawing PLAY
function drawGame(t) {
  const g = game, st = stats();
  // range of selected tower / placement preview
  const showRange = (x, y, ok) => {
    ctx.fillStyle = ok ? 'rgba(80,180,255,.12)' : 'rgba(255,80,100,.12)';
    ctx.strokeStyle = ok ? 'rgba(80,180,255,.6)' : 'rgba(255,80,100,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x * T + T / 2, y * T + T / 2, st.range * T, 0, 7); ctx.fill(); ctx.stroke();
  };
  if (g.selected) showRange(g.selected.x, g.selected.y, true);
  if (g.placing && hoverTile) {
    const ok = canBuild(hoverTile);
    showRange(hoverTile.x, hoverTile.y, ok);
    ctx.globalAlpha = 0.6; drawCreature(ctx, hoverTile.x * T + T / 2, hoverTile.y * T + T / 2 + 4, 44, profile.stage, { t, hat: profile.hat, outfit: profile.outfit }); ctx.globalAlpha = 1;
  }
  // enemies
  for (const e of [...g.enemies].sort((a, b) => a.y - b.y)) {
    const sz = 30 * e.size, bob = Math.sin(t * 8 + e.wob) * 2;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + sz * 0.45, sz * 0.4, sz * 0.12, 0, 0, 7); ctx.fill();
    if (e.elite) {
      const gl = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, sz);
      gl.addColorStop(0, 'rgba(255,211,77,.55)'); gl.addColorStop(1, 'transparent');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(e.x, e.y, sz, 0, 7); ctx.fill();
    }
    if (g.freezeT > 0) { ctx.fillStyle = 'rgba(150,220,255,.5)'; ctx.beginPath(); ctx.arc(e.x, e.y, sz * 0.55, 0, 7); ctx.fill(); }
    if (!drawEnemyArt(ctx, e.def.id, e.x, e.y + bob * 0.3, sz * 1.7, t + e.wob, { dir: e.dir, flash: e.flash > 0 })) drawAsset(e.def, e.x, e.y + bob, sz, e.flash > 0 ? 0.5 : 1);
    if (e.flash > 0) e.flash -= 1 / 60;
    if (e.elite) drawEmoji('👑', e.x, e.y - sz * 0.62 + bob, sz * 0.45);
    if (e.slowT > 0) drawEmoji('🌸', e.x + sz * 0.35, e.y - sz * 0.3, 12);
    // hp bar
    const bw = sz * 0.9, f = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - bw / 2, e.y - sz * 0.62 - 6, bw, 5);
    ctx.fillStyle = f > 0.5 ? '#3ddc84' : f > 0.25 ? '#ffd34d' : '#ff5a6a'; ctx.fillRect(e.x - bw / 2, e.y - sz * 0.62 - 6, bw * f, 5);
  }
  // towers (the hero)
  for (const tw of g.towers) {
    if (tw.kick > 0) tw.kick -= 1 / 60;
    const pop = clamp((t - tw.born) * 4, 0, 1);
    const hs = tw.guardian ? 76 : 64;
    drawCreature(ctx, tw.x * T + T / 2, tw.y * T + T / 2 - 4 - (tw.kick > 0 ? 3 : 0), hs * (0.4 + 0.6 * pop), profile.stage, { t, hat: profile.hat, outfit: profile.outfit });
    if (tw.guardian) drawShield(ctx, tw.x * T + T / 2 + 20, tw.y * T + T / 2 + 6, 30);
  }
  // shots
  for (const s of g.shots) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate((s.rot || 0) + t * 10);
    if (s.st.splash) { ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = '#7df0a8'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#2f9e66'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke(); }
    ctx.restore();
  }
  for (const b of g.beams) {
    ctx.strokeStyle = `rgba(255,230,120,${b.t / 0.18})`; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${b.t / 0.18})`; ctx.lineWidth = 2; ctx.stroke();
  }
  if (g.freezeT > 0) { ctx.fillStyle = `rgba(120,200,255,${0.12 * Math.min(1, g.freezeT)})`; ctx.fillRect(0, 0, W, H); }
}

// ====================================================================== effects
const particles = [], floats = [], rings = [];
let shakeT = 0;
function burst(x, y, color, n) { for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-140, 140), vy: rand(-180, 60), life: rand(0.35, 0.8), max: 0.8, color, r: rand(2, 4.5) }); }
function floatText(x, y, text, color) { floats.push({ x, y, text, color, life: 1.1 }); }
function ring(x, y, r, color) { rings.push({ x, y, r, color, life: 0.35 }); }
function shake(a) { shakeT = Math.max(shakeT, a); }

function drawEffects(dt) {
  for (const p of particles) { p.life -= dt; p.vy += 380 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  for (const r of rings) { r.life -= dt; ctx.strokeStyle = r.color; ctx.globalAlpha = clamp(r.life / 0.35, 0, 1); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (1.2 - r.life), 0, 7); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 16px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
  for (const f of floats) { f.life -= dt; f.y -= 34 * dt; ctx.globalAlpha = clamp(f.life, 0, 1); ctx.fillStyle = '#000'; ctx.fillText(f.text, f.x + 1, f.y + 1); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
  ctx.globalAlpha = 1;
  for (const arr of [particles, floats, rings]) for (let i = arr.length - 1; i >= 0; i--) if (arr[i].life <= 0) arr.splice(i, 1);
}

// full-screen confetti on the overlay canvas
const fx = $('fxCanvas'), fctx = fx.getContext('2d');
const confettiBits = [];
function confetti(n = 160) {
  for (let i = 0; i < n; i++) confettiBits.push({ x: rand(0, innerWidth), y: rand(-200, -10), vx: rand(-60, 60), vy: rand(120, 320), r: rand(4, 9), a: rand(0, 6), va: rand(-6, 6), h: rand(190, 230 + 120 * Math.random()), life: 4 });
}
function drawConfetti(dt) {
  fx.width = innerWidth; fx.height = innerHeight;
  for (const c of confettiBits) {
    c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt;
    fctx.save(); fctx.translate(c.x, c.y); fctx.rotate(c.a); fctx.fillStyle = `hsl(${c.h},95%,60%)`; fctx.fillRect(-c.r / 2, -c.r / 4, c.r, c.r / 2); fctx.restore();
  }
  for (let i = confettiBits.length - 1; i >= 0; i--) if (confettiBits[i].life <= 0 || confettiBits[i].y > innerHeight + 20) confettiBits.splice(i, 1);
}

// ====================================================================== main loop
function frame(now) {
  const rawDt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const t = now / 1000;
  const dt = rawDt * (game ? game.speed : 1);
  if (mode === 'play' && game) for (let k = 0; k < (game.speed > 1 ? 2 : 1); k++) updateGame(dt / (game.speed > 1 ? 2 : 1));

  if (is3d()) {
    drawEffects(rawDt);   // ages particles / floating texts (drawn on the hidden 2D canvas)
    R3D.render({ map, mode, game, t, hoverTile, profile, route, shake: shakeT, particles, floats,
      lights: map.night ? collectLights() : null, range: stats().range, canBuild, guardianTile: guardianTile(map) });
    shakeT = Math.max(0, shakeT - rawDt * 30);
    if (confettiBits.length) drawConfetti(rawDt); else if (fx.width) { fx.width = 0; }
    if (mode === 'play' && game && Math.floor(t * 4) !== frame._q) { frame._q = Math.floor(t * 4); updatePlayUi(); }
    requestAnimationFrame(frame);
    return;
  }
  ctx.save();
  if (shakeT > 0) { ctx.translate(rand(-shakeT, shakeT), rand(-shakeT, shakeT)); shakeT = Math.max(0, shakeT - rawDt * 30); }
  ctx.clearRect(-20, -20, W + 40, H + 40);
  drawGround(map, t);
  if (mode === 'create') { drawGrid(); drawRoutePreview(t); }
  drawDecor(map, t, true);
  drawSpecials(map, t);
  if (mode === 'create') { const gt = guardianTile(map); if (gt) { drawCreature(ctx, gt.x * T + T / 2, gt.y * T + T / 2 - 4, 76, profile.stage, { t, hat: profile.hat, outfit: profile.outfit }); drawShield(ctx, gt.x * T + T / 2 + 20, gt.y * T + T / 2 + 6, 30); } }
  drawDecor(map, t, false);
  if (mode === 'create' && hoverTile) {
    ctx.strokeStyle = 'rgba(111,227,255,.9)'; ctx.lineWidth = 3;
    ctx.strokeRect(hoverTile.x * T + 2, hoverTile.y * T + 2, T - 4, T - 4);
    if (tool === 'brush' && brush.cat !== 'ground') {
      const it = brush.cat === 'decor' ? decorDef(brush.id) : { emoji: brush.id === 'spawn' ? '🌀' : '🏰' };
      if (it) drawAsset(it, hoverTile.x * T + T / 2, hoverTile.y * T + T / 2, 30, 0.5);
    }
  }
  if (mode === 'play' && game) drawGame(t);
  drawEffects(rawDt);
  if (map.night) { drawNightOverlay(ctx, nightCanvas, collectLights(), t); drawNightSparkles(ctx, W, H, t); }
  ctx.restore();
  if (confettiBits.length) drawConfetti(rawDt); else if (fx.width) { fx.width = 0; }
  if (mode === 'play' && game && Math.floor(t * 4) !== frame._q) { frame._q = Math.floor(t * 4); updatePlayUi(); }
  requestAnimationFrame(frame);
}

const nightCanvas = document.createElement('canvas');
let use3d = (() => { try { return localStorage.getItem('dp3d') !== '0'; } catch (e) { return true; } })();
function is3d() { return use3d && window.R3D && R3D.ready; }
function start3d() {
  if (!window.R3D || R3D.ready) return;
  try {
    R3D.init($('stageWrap'), { COLS, ROWS, T, decorDef, merchDef });
  } catch (e) { console.warn('3D unavailable', e); use3d = false; }
  apply3d();
}
function apply3d() {
  const on = is3d();
  stage.style.display = on ? 'none' : '';
  const c3 = document.getElementById('stage3d'); if (c3) c3.style.display = on ? '' : 'none';
  $('viewBtn').textContent = on ? '🧊 3D' : '🖼️ 2D';
  document.querySelectorAll('.cam3d').forEach(b => b.classList.toggle('hidden', !on));
  fitStage();
}
window.addEventListener('r3d-ready', start3d);
function collectLights() {
  const L = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const px = x * T + T / 2, py = y * T + T / 2, d = map.decor[idx(x, y)], g = map.ground[idx(x, y)];
    if (d === 'torch') L.push({ x: px, y: py - 18, r: 120, flicker: .06, color: 'rgba(255,150,40,.35)' });
    else if (d === 'campfire') L.push({ x: px, y: py - 6, r: 160, flicker: .08, color: 'rgba(255,140,30,.4)' });
    else if (d === 'crystal') L.push({ x: px, y: py - 10, r: 100, color: 'rgba(80,220,255,.35)' });
    else if (d === 'hut' || d === 'tent') L.push({ x: px, y: py, r: 70, color: 'rgba(255,200,90,.2)' });
    if (g === 'l' && (x + y) % 2 === 0) L.push({ x: px, y: py, r: 95, color: 'rgba(255,90,20,.22)' });
  }
  if (map.spawn) L.push({ x: map.spawn.x * T + T / 2, y: map.spawn.y * T + T / 2, r: 110, color: 'rgba(170,80,255,.4)' });
  if (map.home) L.push({ x: map.home.x * T + T / 2, y: map.home.y * T + T / 2, r: 140, color: 'rgba(120,180,255,.3)' });
  if (game) {
    for (const tw of game.towers) L.push({ x: tw.x * T + T / 2, y: tw.y * T + T / 2, r: 85, color: 'rgba(120,255,170,.18)' });
    for (const b of game.beams) L.push({ x: b.x1, y: b.y1, r: 70, color: 'rgba(255,230,120,.4)' });
    for (const e of game.enemies) if (e.def.id === 'flamix' || e.def.id === 'zappy') L.push({ x: e.x, y: e.y, r: 45, color: 'rgba(255,160,40,.25)' });
  } else if (map.home) {
    const gt = guardianTile(map);
    if (gt) L.push({ x: gt.x * T + T / 2, y: gt.y * T + T / 2, r: 85, color: 'rgba(120,255,170,.18)' });
  }
  return L;
}

function fitStage() {
  if (window.R3D && R3D.ready) R3D.resize();
  const wrap = $('stageWrap'), r = wrap.getBoundingClientRect();
  const s = Math.min((r.width - 16) / W, (r.height - 16) / H);
  stage.style.width = `${Math.floor(W * s)}px`; stage.style.height = `${Math.floor(H * s)}px`;
}
addEventListener('resize', fitStage);

// ====================================================================== mode switch
function togglePlay() {
  if (mode === 'create') {
    if (!startGame()) return;
    mode = 'play';
    $('playBtn').classList.add('stop'); $('playLabel').textContent = 'Stop'; $('playBtn').querySelector('.play-tri').textContent = '■';
    $('createPanel').classList.add('hidden'); $('playPanel').classList.remove('hidden');
    $('modeBadge').textContent = 'PLAY'; $('modeBadge').classList.add('play');
    $('adminPowers').classList.toggle('hidden', profile.stage < 7);
    sfx.place();
    updatePlayUi();
  } else stopPlay();
}

function stopPlay() {
  if (game && !game.over) saveProfile();
  mode = 'create'; game = null;
  $('playBtn').classList.remove('stop'); $('playLabel').textContent = 'Play'; $('playBtn').querySelector('.play-tri').textContent = '▶';
  $('createPanel').classList.remove('hidden'); $('playPanel').classList.add('hidden');
  $('modeBadge').textContent = 'CREATE'; $('modeBadge').classList.remove('play');
  renderWaves();
}

function updatePlayUi() {
  if (!game) return;
  $('livesTxt').textContent = Math.max(0, game.lives);
  $('energyTxt').textContent = Math.floor(game.energy);
  $('waveTxt').textContent = `${Math.min(game.wave + (game.waveRunning ? 1 : 0), game.waves.length)}/${game.waves.length}`;
  $('scoreTxt').textContent = game.score;
  $('heroCost').textContent = `${heroCost()}⚡`;
  $('placeHeroBtn').disabled = game.energy < heroCost() || game.over;
  $('placeHeroBtn').classList.toggle('gold', game.placing);
  $('waveBtn').disabled = game.waveRunning || game.over || game.wave >= game.waves.length;
  $('waveBtn').textContent = game.waveRunning ? '🌊 Wave is coming…' : `🌊 Start wave ${game.wave + 1}`;
  const where = hasSpots() ? 'a ⭕ hero spot' : 'a green spot';
  $('playHint').textContent = !game.towers.length ? `Click “Place hero”, then click ${where} next to the path.`
    : game.placing ? `Click ${where} to place it.` : !game.waveRunning ? 'Ready? Click “Start wave”! You can also place more heroes.' : 'Click a hero to see how far it shoots.';
  document.querySelectorAll('.power').forEach(b => {
    const cd = game.powerCd[b.dataset.power];
    b.disabled = cd > 0;
    b.innerHTML = `${POWERS[b.dataset.power].label}${cd > 0 ? ` (${Math.ceil(cd)})` : ''}`;
  });
}

// ====================================================================== profile, XP, evolution, shop
function updateTopStats() {
  $('coinsTxt').textContent = profile.coins;
  const cur = STAGES[profile.stage], next = STAGES[profile.stage + 1];
  $('xpTxt').textContent = next ? `${profile.xp}/${next.need}` : `${profile.xp} MAX`;
  $('xpFill').style.width = next ? `${clamp((profile.xp - cur.need) / (next.need - cur.need), 0, 1) * 100}%` : '100%';
  const ready = next && profile.xp >= next.need;
  $('heroBtn').classList.toggle('gold', !!ready);
  $('heroBtn').textContent = ready ? '✨ Evolve!' : `🌱 ${stageName(profile.stage)}`;
}

function saveProfile() { updateTopStats(); api('/api/profile', profile).catch(() => { }); }

function openHero() {
  const cur = profile.stage, next = STAGES[cur + 1];
  showModal(`
    <h2>🌱 Your hero: ${stageName(cur)}</h2>
    <p class="muted">Beat enemies to get ⭐ XP. When the bar is full, your hero evolves into the next form. The last form is <b style="color:var(--gold)">SUPER ADMIN</b>, who controls everything!</p>
    <div class="stages">${STAGES.map((s, i) => `
      <div class="stagecard ${i === cur ? 'cur' : ''} ${i > cur ? 'locked' : ''}">
        <canvas width="192" height="192" data-st="${i}"></canvas>
        <b>${i + 1}. ${stageName(i)} <span class="rename" data-rn="${i}" title="Change the name">✏️</span></b>
        <small>${s.about}</small>
        <small>💥 ${s.dmg} · 🎯 ${s.range} · ⚡ ${s.rate}/s${s.targets > 1 ? ` · ${s.targets} enemies` : ''}</small>
        <small>${i > cur ? `🔒 ${s.need} XP` : '✅'}</small>
      </div>`).join('')}</div>
    <p style="margin-top:16px">${next ? (profile.xp >= next.need
      ? `<button class="btn big gold" id="evolveBtn">✨ EVOLVE into ${stageName(cur + 1)}!</button>`
      : `<span class="muted">You need <b>${next.need - profile.xp}</b> more XP for ${stageName(cur + 1)}.</span>`)
      : '<b style="color:var(--gold)">👑 You are SUPER ADMIN! You have special powers in the game.</b>'}</p>`);
  const cards = document.querySelectorAll('.stagecard canvas');
  let alive = true;
  const anim = (now) => {
    if (!alive || !document.body.contains(cards[0])) return;
    cards.forEach(cv => { const c = cv.getContext('2d'); c.clearRect(0, 0, 192, 192); drawCreature(c, 96, 112, 120, +cv.dataset.st, { t: now / 1000, hat: profile.hat, outfit: profile.outfit }); });
    requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);
  document.querySelectorAll('.rename').forEach(r => r.onclick = () => {
    const i = +r.dataset.rn;
    const v = prompt('What do you want to call this hero form?', stageName(i));
    if (v === null) return;
    profile.names = profile.names || [];
    profile.names[i] = v.trim().slice(0, 24);
    alive = false; saveProfile(); openHero();
  });
  const eb = $('evolveBtn');
  if (eb) eb.onclick = () => {
    alive = false;
    profile.stage++;
    sfx.evolve(); confetti(220);
    saveProfile();
    toast(`✨ Your hero became ${stageName(profile.stage)}!`, 3000);
    if (mode === 'play') $('adminPowers').classList.toggle('hidden', profile.stage < 7);
    openHero();
  };
}

function openShop() {
  const items = allMerch();
  const slotName = { hat: 'Hats', outfit: 'Outfits' };
  showModal(`
    <h2>🛍️ Shop</h2>
    <p class="muted">You have <b style="color:var(--gold)">${profile.coins} 🪙</b>. ⭐ Elite enemies give 2x coins!</p>
    ${['hat', 'outfit'].map(slot => `
      <div class="panel-title" style="margin-top:14px">${slotName[slot]}</div>
      <div class="grid">${items.filter(m => m.slot === slot).map(m => {
        const owned = profile.owned.includes(m.id), worn = profile[slot] === m.id;
        return `<div class="shopitem ${owned ? 'owned' : ''} ${worn ? 'worn' : ''}">
          ${assetHtml(m, 44)}<b>${m.name}</b>
          ${owned ? `<button class="btn small ${worn ? '' : 'blue'}" data-wear="${m.id}" data-slot="${slot}">${worn ? 'Take off' : 'Wear'}</button>`
            : `<button class="btn small gold" data-buy="${m.id}" ${profile.coins < m.price ? 'disabled' : ''}>${m.price} 🪙</button>`}
        </div>`; }).join('')}</div>`).join('')}`);
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    const m = merchDef(b.dataset.buy);
    if (!m || profile.coins < m.price) return;
    profile.coins -= m.price; profile.owned.push(m.id); profile[m.slot] = m.id;
    sfx.coin(); confetti(60); saveProfile(); openShop();
  });
  document.querySelectorAll('[data-wear]').forEach(b => b.onclick = () => {
    const slot = b.dataset.slot;
    profile[slot] = profile[slot] === b.dataset.wear ? '' : b.dataset.wear;
    sfx.click(); saveProfile(); openShop();
  });
}

// ====================================================================== modal
function showModal(html) { $('modalBody').innerHTML = html; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }
$('modalClose').onclick = closeModal;
$('modal').addEventListener('mousedown', (e) => { if (e.target === $('modal')) closeModal(); });

// ====================================================================== maps: save / open / new
async function openMaps() {
  let list = [];
  try { list = (await api('/api/maps')).maps; } catch (e) { }
  showModal(`<h2>📂 Your maps</h2>
    <div class="grid">${list.map(n => `<button class="btn" data-map="${n}">🗺️ ${n}</button>`).join('') || '<span class="muted">No saved maps yet.</span>'}</div>`);
  document.querySelectorAll('[data-map]').forEach(b => b.onclick = async () => {
    try {
      const m = await api('/api/map?name=' + encodeURIComponent(b.dataset.map));
      if (mode === 'play') stopPlay();
      pushUndo(); map = m; currentWave = 0; $('mapName').value = m.name; updateNightBtn(); hideHome(); refreshRoute(); renderWaves(); closeModal(); toast('🗺️ Map opened');
    } catch (e) { toast('Could not open it'); }
  });
}

function newMap() {
  showModal(`<h2>✨ New map</h2><div class="grid">
    <button class="btn big" id="nmBlank">⬜ Empty<br><small>Draw the path yourself</small></button>
    <button class="btn big blue" data-tpl="forest">🌲 First Island<br><small>Forest with a river and bridge</small></button>
    <button class="btn big gold" data-tpl="desert">🏜️ Sun Canyon<br><small>Sand, cactus, camps</small></button>
    <button class="btn big" style="background:linear-gradient(180deg,#d9471f,#8a2a08);border-color:#ff8a4a" data-tpl="volcano">🌋 Fire Volcano<br><small>A river of lava!</small></button></div>`);
  $('nmBlank').onclick = () => { pushUndo(); map = blankMap('My game ' + (Math.floor(Math.random() * 900) + 100), map.night); after(); };
  document.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { pushUndo(); map = starterMap(b.dataset.tpl); after(); });
  function after() { if (mode === 'play') stopPlay(); currentWave = 0; $('mapName').value = map.name; updateNightBtn(); refreshRoute(); renderWaves(); closeModal(); changed(); }
}

// ====================================================================== settings
async function openSettings() {
  try { claudeStatus = await api('/api/claude/status'); } catch (e) { }
  showModal(`
    <h2>⚙️ Settings</h2>
    <div class="panel-title">✨ Connect to Claude</div>
    <p>${claudeStatus.ready ? '🟢 Claude is connected and ready.' : '⚪ Claude is not connected yet. dreamPlay works without it too; search still finds game items.'}</p>
    <ol class="muted">
      <li>${claudeStatus.sdk ? '✅' : '⬜'} The official <b>anthropic</b> package for Python ${claudeStatus.sdk ? 'is installed' : 'is not installed (parent: <code>python -m pip install anthropic</code>)'}.</li>
      <li>${claudeStatus.key ? '✅' : '⬜'} API key from <b>console.anthropic.com</b> (a parent types this in).</li>
    </ol>
    <input type="password" id="keyInput" placeholder="${claudeStatus.key ? 'Key is saved ✔ (type a new one to change it)' : 'Paste the key here'}">
    <p><button class="btn blue" id="keySave">💾 Save key</button> ${claudeStatus.key ? '<button class="btn" id="keyDel">🗑️ Remove key</button>' : ''}</p>
    <p class="muted">The key is saved only on this computer (%LOCALAPPDATA%\\dreamPlay\\settings.json) and is never shown again.</p>
    <div class="panel-title">🔊 Sound</div>
    <p><button class="btn" id="sndBtn">${profile.sound ? '🔊 Sound: on' : '🔇 Sound: off'}</button></p>
    <div class="panel-title">♻️ Progress</div>
    <p><button class="btn" id="resetBtn">Start over (coins, XP, outfits)</button></p>`);
  $('keySave').onclick = async () => {
    const k = $('keyInput').value.trim();
    if (!k) return toast('Type the key');
    claudeStatus = await api('/api/claude/key', { key: k });
    $('keyInput').value = '';
    renderClaudeState(); openSettings(); toast('Key saved');
  };
  if ($('keyDel')) $('keyDel').onclick = async () => { claudeStatus = await api('/api/claude/key', { key: '' }); renderClaudeState(); openSettings(); };
  $('sndBtn').onclick = () => { profile.sound = !profile.sound; saveProfile(); openSettings(); };
  $('resetBtn').onclick = () => {
    if (!confirm('Are you sure? Your coins, XP and outfits will be erased.')) return;
    profile = { coins: 30, xp: 0, stage: 0, owned: [], hat: '', outfit: '', sound: profile.sound };
    saveProfile(); closeModal(); toast('Started over');
  };
}

// ====================================================================== Claude search
function renderClaudeState() {
  $('claudeState').innerHTML = claudeStatus.ready
    ? '🟢 Claude is ready. Type what you want up top!'
    : '⚪ Claude is not connected. Click ⚙️ to connect it. Search still finds game items.';
}

function addMsg(cls, text) {
  const d = document.createElement('div');
  d.className = 'msg ' + cls; d.textContent = text;
  $('chat').appendChild(d); $('chat').scrollTop = 1e9;
  return d;
}

function localSearch(q) {
  const s = q.toLowerCase();
  const pool = [
    ...Object.entries(DECOR).map(([id, d]) => ({ cat: 'decor', id, name: d.name, emoji: d.emoji, tab: 'decor' })),
    ...Object.entries(ENEMIES).map(([id, e]) => ({ cat: 'enemy', id, name: e.name, emoji: e.emoji, tab: 'enemy' })),
    ...Object.entries(GROUND).map(([id, g]) => ({ cat: 'ground', id, name: g.name, emoji: '🟩', tab: 'ground' })),
    ...allMerch().map(m => ({ cat: 'merch', id: m.id, name: m.name, emoji: m.emoji })),
    ...custom.filter(c => c.kind !== 'merch').map(c => ({ cat: c.kind, id: c.id, name: c.name, emoji: c.emoji, tab: c.kind })),
  ];
  return pool.filter(p => s.split(/\s+/).some(w => w.length > 2 && p.name.toLowerCase().includes(w))).slice(0, 6);
}

async function doSearch() {
  const q = $('search').value.trim();
  if (!q) return;
  $('search').value = '';
  addMsg('me', q);
  sfx.click();
  const hits = localSearch(q);
  if (hits.length) {
    const box = document.createElement('div');
    box.innerHTML = `<div class="muted" style="margin-bottom:4px">Found in dreamPlay:</div>` + hits.map(h =>
      `<div class="card local-hit" data-cat="${h.cat}" data-id="${h.id}" data-tab="${h.tab || ''}"><span class="em">${h.emoji}</span><div class="meta"><b>${h.name}</b>${h.cat === 'merch' ? 'in the Shop' : 'click to pick it'}</div></div>`).join('');
    $('chat').appendChild(box);
    box.querySelectorAll('.local-hit').forEach(c => c.onclick = () => {
      if (c.dataset.cat === 'merch') return openShop();
      if (c.dataset.cat === 'enemy') return addEnemyToWave(c.dataset.id);
      tab = c.dataset.tab; brush = { cat: c.dataset.cat, id: c.dataset.id }; setTool('brush'); renderTabs(); renderPalette();
    });
  }
  const bubble = addMsg('ai typing', '');
  let text = '';
  try {
    const r = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, history: chatHistory }) });
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = '';
    for (; ;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let k;
      while ((k = buf.indexOf('\n\n')) >= 0) {
        const line = buf.slice(0, k).trim(); buf = buf.slice(k + 2);
        if (!line.startsWith('data:')) continue;
        const ev = JSON.parse(line.slice(5));
        if (ev.type === 'text') { text += ev.text; bubble.textContent = text.replace(/```dreamplay[\s\S]*?(```|$)/g, '').trim(); $('chat').scrollTop = 1e9; }
        else if (ev.type === 'offline') { bubble.textContent = hits.length ? 'I found these in the game. 🙂 To make new things, connect Claude in ⚙️ Settings.' : 'Claude is not connected yet. Click ⚙️ Settings to connect it.'; }
        else if (ev.type === 'error') { bubble.textContent = '⚠️ ' + ev.message; }
        else if (ev.type === 'done') {
          chatHistory.push({ role: 'user', content: q }, { role: 'assistant', content: ev.answer });
          chatHistory = chatHistory.slice(-6);
          showNewElements(ev.elements || []);
        }
      }
    }
  } catch (e) { bubble.textContent = '⚠️ Could not talk to the server.'; }
  bubble.classList.remove('typing');
  if (!bubble.textContent) bubble.textContent = '🙂';
}

function showNewElements(els) {
  for (const el of els) {
    const d = document.createElement('div');
    d.className = 'card';
    const info = el.kind === 'enemy' ? `Enemy · ❤️ ${Math.round(el.hp)} · 💨 ${el.speed} · 🪙 ${Math.round(el.reward)}`
      : el.kind === 'decor' ? 'Nature' : `${el.slot === 'hat' ? 'Hat' : 'Outfit'} · ${el.price} 🪙`;
    d.innerHTML = `${assetHtml(el, 46)}<div class="meta"><b>${el.name}</b>${info}</div><button class="btn small blue">➕ Add</button>`;
    d.querySelector('button').onclick = (e) => {
      const id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 99);
      custom.push({ ...el, id, reward: Math.round(el.reward || 0) });
      api('/api/custom', { elements: custom }).catch(() => { });
      e.target.disabled = true; e.target.textContent = '✔ Added';
      sfx.coin(); confetti(40);
      if (el.kind !== 'merch') { tab = el.kind; renderTabs(); renderPalette(); }
      toast(el.kind === 'merch' ? `${el.emoji} ${el.name} is now in the Shop!` : `${el.emoji} ${el.name} was added to ${el.kind === 'enemy' ? 'Enemies' : 'Nature'}!`);
    };
    $('chat').appendChild(d);
  }
  $('chat').scrollTop = 1e9;
}

// ====================================================================== wiring
$('playBtn').onclick = togglePlay;
$('placeHeroBtn').onclick = () => { if (game) { game.placing = !game.placing; sfx.click(); updatePlayUi(); } };
$('waveBtn').onclick = startWave;
$('speedBtn').onclick = () => { if (!game) return; game.speed = game.speed === 1 ? 2 : game.speed === 2 ? 3 : 1; $('speedBtn').textContent = `⏩ Speed x${game.speed}`; sfx.click(); };
document.querySelectorAll('.power').forEach(b => b.onclick = () => usePower(b.dataset.power));
document.querySelectorAll('.tool[data-tool]').forEach(b => b.onclick = () => { setTool(b.dataset.tool); sfx.click(); });
$('undoBtn').onclick = undo;
$('addWaveBtn').onclick = () => { if (mode !== 'create') return; pushUndo(); map.waves.push([]); currentWave = map.waves.length - 1; renderWaves(); changed(); };
$('saveBtn').onclick = async () => { map.name = $('mapName').value.trim() || 'My map'; try { const r = await api('/api/map', map); map.name = r.name; toast('💾 Saved: ' + r.name); sfx.coin(); } catch (e) { toast('Could not save'); } };
$('loadBtn').onclick = openMaps;
$('newBtn').onclick = newMap;
$('nightBtn').onclick = () => { pushUndo(); map.night = !map.night; updateNightBtn(); changed(); sfx.click(); };
$('viewBtn').onclick = () => { use3d = !use3d; try { localStorage.setItem('dp3d', use3d ? '1' : '0'); } catch (e) { } if (use3d) start3d(); apply3d(); sfx.click(); };
$('rotL').onclick = () => window.R3D && R3D.rotate(-Math.PI / 4);
$('rotR').onclick = () => window.R3D && R3D.rotate(Math.PI / 4);
$('homeBtn').onclick = () => { if (mode === 'play') stopPlay(); showHome(); };
function updateNightBtn() { $('nightBtn').textContent = map.night ? '🌙 Night' : '☀️ Day'; $('nightBtn').classList.toggle('night', !!map.night); }
$('mapName').onchange = () => { map.name = $('mapName').value.trim() || 'My map'; changed(); };
$('shopBtn').onclick = openShop;
$('heroBtn').onclick = openHero;
$('settingsBtn').onclick = openSettings;
$('searchGo').onclick = doSearch;
$('search').addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
$('search').addEventListener('input', () => renderPalette($('search').value.trim().toLowerCase()));
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  if (e.key === 'Escape') { closeModal(); if (game) game.placing = false; }
  if (e.key.toLowerCase() === 'q' && window.R3D) R3D.rotate(-Math.PI / 8);
  if (e.key.toLowerCase() === 'e' && window.R3D) R3D.rotate(Math.PI / 8);
});
setInterval(() => fetch('/api/ping').catch(() => { }), 5000);

// ====================================================================== home screen (game cards)
function showHome() {
  $('home').classList.remove('hidden');
  drawCardArt();
}
function hideHome() { $('home').classList.add('hidden'); setTimeout(fitStage, 30); }
function drawCardArt() {
  const cv = $('cardArt'); if (!cv) return;
  const c = cv.getContext('2d'), w = cv.width, h = cv.height;
  const t0 = performance.now() / 1000;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6aa843'); g.addColorStop(1, '#4f8a31');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const road = [[-20, 150], [90, 150], [90, 70], [210, 70], [210, 160], [340, 160]];
  for (const [lw, col] of [[46, '#2b1d12'], [42, '#9c7442'], [34, '#e3c48c']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); road.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
  PROPS.tree(c, 40, 60, 56, t0, .2); PROPS.pine(c, 300, 70, 52, t0, .4); PROPS.mountain(c, 150, 190, 70, t0, 0); PROPS.torch(c, 260, 110, 40, t0, .3);
  drawSpot(c, 150, 120, 46, t0, ''); drawCreature(c, 150, 112, 40, 3, { t: t0 });
  drawEnemyArt(c, 'flamix', 90, 110, 56, t0, {}); drawEnemyArt(c, 'spooki', 210, 120, 52, t0 + 1, {});
  drawCastle(c, 318, 150, 56, t0);
}
function chooseDayNight() {
  showModal(`<h2>🏰 Tower Defense</h2>
    <p>The field is empty. You place everything: the ground, mountains, river, path, portal, castle and enemies.</p>
    <p><b>Day or night?</b></p>
    <div class="grid">
      <button class="btn big gold" id="pickDay">☀️ Day<br><small>sunny and colorful</small></button>
      <button class="btn big" id="pickNight" style="background:linear-gradient(180deg,#1b2a5a,#0a1230);border-color:#4a6ad8">🌙 Night<br><small>torches and lava glow</small></button>
    </div>`);
  const go = (night) => {
    pushUndo(); map = blankMap('My game', night); currentWave = 0; $('mapName').value = map.name;
    updateNightBtn(); refreshRoute(); renderWaves(); closeModal(); hideHome(); changed(false);
    tab = 'ground'; brush = { cat: 'ground', id: 'g' }; setTool('brush'); renderTabs(); renderPalette();
    toast('Start with 🟩 Ground: paint grass, sand, snow…', 3000);
  };
  $('pickDay').onclick = () => go(false);
  $('pickNight').onclick = () => go(true);
}
$('cardTD').onclick = () => { sfx.click(); chooseDayNight(); };
$('homeOpen').onclick = () => { sfx.click(); openMaps(); };

// ====================================================================== boot
(async function boot() {
  const qs = new URLSearchParams(location.search);   // test hooks: ?nosplash&tpl=volcano&demo&tab=enemy
  if (qs.has('nosplash')) $('splash').remove(); else runSplash();
  try { const p = await api('/api/profile'); if (p && typeof p.coins === 'number') profile = { ...profile, ...p }; } catch (e) { }
  try { custom = (await api('/api/custom')).elements || []; } catch (e) { }
  try { claudeStatus = await api('/api/claude/status'); } catch (e) { }
  map = blankMap('My game', false);
  $('mapName').value = map.name; updateNightBtn();
  renderTabs(); renderPalette(); setTool('brush'); renderWaves(); refreshRoute(); updateTopStats(); renderClaudeState();
  addMsg('ai', 'Hi there! 👋 I am your helper. Build the map with the items on the left, then press ▶ Play to play it!');
  fitStage(); setTimeout(fitStage, 100);
  if (qs.get('tab')) { tab = qs.get('tab'); renderTabs(); renderPalette(); }
  if (qs.get('tpl')) { map = starterMap(qs.get('tpl')); if (qs.has('night')) map.night = true; $('mapName').value = map.name; updateNightBtn(); refreshRoute(); renderWaves(); }
  if (qs.get('tpl') || qs.has('demo') || qs.has('editor')) hideHome(); else showHome();
  if (qs.has('herogallery')) {   // test hook: the 8 hero forms, large, on a full-screen canvas
    const cv = document.createElement('canvas'); cv.width = innerWidth; cv.height = innerHeight;
    cv.style.cssText = 'position:fixed;inset:0;z-index:999;background:#6aa843'; document.body.appendChild(cv);
    const c = cv.getContext('2d');
    for (let i = 0; i < 8; i++) drawCreature(c, 90 + (i % 4) * 330 + 80, 230 + Math.floor(i / 4) * 380, 210, i, { t: 0.5 });
  }
  if (qs.has('painttest')) {   // test hook: paint a small world through the same code path as the mouse
    const P = (cat, id, x, y, tl = 'brush') => { brush = { cat, id }; tool = tl; paintAt({ x, y }); };
    P('ground', 'g', 3, 3, 'fill');
    for (let y = 0; y < ROWS; y++) P('ground', 'w', 12, y);
    for (let x = 0; x < COLS; x++) P('ground', x === 12 ? 'b' : 'p', x, 6);
    for (let y = 0; y < ROWS; y++) for (let x = 14; x < COLS; x++) if (y > 8) P('ground', 'n', x, y);
    P('special', 'spawn', 0, 6); P('special', 'home', 21, 6);
    for (const [x, y] of [[2, 9], [3, 9], [4, 9], [5, 9], [5, 10], [5, 11], [2, 10], [2, 11], [8, 9], [9, 1], [9, 2], [10, 2]]) P('decor', 'fence', x, y);
    P('decor', 'mountain', 4, 2); P('decor', 'tree', 8, 3); P('decor', 'spot', 6, 5); P('decor', 'torch', 9, 8); P('decor', 'pine', 18, 10);
    changed(false);
  }
  if (qs.has('flat')) use3d = false;
  start3d();
  requestAnimationFrame(frame);
  if (qs.has('demo')) setTimeout(() => {
    togglePlay();
    const spots = []; map.decor.forEach((d, i) => { if (d === 'spot') spots.push({ x: i % COLS, y: Math.floor(i / COLS) }); });
    for (const s of spots.slice(0, 3)) { game.placing = true; onPlayClick(s); }
    game.waves[0] = [{ t: 'flamix', e: false, n: 2 }, { t: 'bubbo', e: false, n: 2 }, { t: 'zappy', e: false, n: 2 }, { t: 'spooki', e: false, n: 1 }, { t: 'toxa', e: false, n: 1 }, { t: 'frosty', e: false, n: 1 }, { t: 'rocko', e: true, n: 1 }, { t: 'buzzi', e: false, n: 2 }];
    startWave();
    if (qs.has('sim')) for (let i = 0; i < +qs.get('sim') * 50; i++) updateGame(0.02);   // fast-forward N seconds
    // test hook: expose the live state in the DOM (read with a headless --dump-dom)
    const dbg = document.createElement('pre'); dbg.id = 'dbg'; dbg.style.display = 'none'; document.body.appendChild(dbg);
    let errs = '';
    addEventListener('error', (e) => { errs += ' | ERROR ' + e.message + ' @' + e.lineno; });
    setInterval(() => { if (game) dbg.textContent = JSON.stringify({ wave: game.wave, running: game.waveRunning, queue: game.spawnQueue.length, enemies: game.enemies.map(e => [e.def.id, Math.round(e.x), Math.round(e.y), Math.round(e.hp)]), towers: game.towers.length, coins: game.earnedCoins, lives: game.lives }) + errs; }, 500);
  }, 300);
})();
