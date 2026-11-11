/* MONSTERMON: WILDFOLD - first playable region (Songwood Forest, village of Rootlight).
   Create your adventurer -> Professor Green's lab -> choose a starter -> the folding root bridge ->
   free Skipclip and learn the FoldCube -> real-time battles -> Rootlock (2 phases) -> the bridge unfolds ->
   the Cut Mountain and its folded gate. Day/night, evolutions, side quests, minimap, pause menu, music.
   Keyboard + mouse and PS5 / standard gamepads. Every character here is an original design. */
import * as THREE from './lib/three.module.min.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OPTIONS, DEFAULT_AVATAR, randomAvatar, buildAvatar, animateAvatar } from './adv_avatar.js';
import { SPECIES, STARTERS, buildMon, foldShard, faceTex, bx, mat, ABILITIES, GEN_IDS } from './adv_mons.js';
import { W, HALF, WATER, SPOTS, terrainHeight, buildWorld, groundAt, buildPerson, ZONES, zoneOf, zoneLevel } from './adv_world.js';

const $ = (id) => document.getElementById(id);
const qs = new URLSearchParams(location.search);
const save = {
  name: '', avatar: { ...DEFAULT_AVATAR }, step: 'arrive', team: [], garden: [], active: 0, coins: 0,
  tips: {}, side: { songs: { state: 'none', heard: [] }, watch: { state: 'none' } }, bossState: null, time: 0.25,
  settings: { music: 0.6, sfx: 0.8, sens: 1, diff: 'easy', autoClothes: true, quality: 'high' },
  items: { potion: 2, strongCube: 0 }, stats: {}, medals: {}, fusions: {}, unlocked: [], dex: { seen: {}, caught: {} }, dexRewards: {}, weather: 'cloudy',
};
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, az, bx2, bz) => Math.hypot(ax - bx2, az - bz);
const RED = '#ff3b2f';
const PLACE = { village: 'Rootlight', forest: 'Songwood Forest', mountain: 'the Cut Mountain' };

// ====================================================================== renderer + world
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('view').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fd8ff'); scene.fog = new THREE.Fog('#c4e8ff', 60, 190);
const hemi = new THREE.HemisphereLight(0xe8f6ff, 0x4a6a2a, 1.05); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 2.5); sun.position.set(-20, 40, 15); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 140 });
sun.shadow.bias = -0.0005; scene.add(sun); scene.add(sun.target);
const lantern = new THREE.PointLight(0xffc27a, 0, 16, 1.5); scene.add(lantern);
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const WORLD = buildWorld(scene);
const height = (x, z) => groundAt(WORLD, x, z);

// ====================================================================== audio: effects, monster roars, music
let ac = null, sfxBus = null, musBus = null, noiseB = null;
function audio() {
  try {
    if (!ac) { ac = new AudioContext(); sfxBus = ac.createGain(); musBus = ac.createGain(); sfxBus.connect(ac.destination); musBus.connect(ac.destination); applyVolumes(); }
    if (ac.state === 'suspended') ac.resume();
  } catch (e) { }
  return ac;
}
function applyVolumes() { if (!ac) return; sfxBus.gain.value = save.settings.sfx; musBus.gain.value = save.settings.music * 0.5; }
addEventListener('pointerdown', audio); addEventListener('keydown', audio);
function tone(f, d = 0.12, type = 'sine', v = 0.08, slide = 0) {
  if (!ac) return;
  try { const t0 = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t0 + d); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(sfxBus); o.start(t0); o.stop(t0 + d + 0.02); } catch (e) { }
}
function noise() { if (!noiseB) { noiseB = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseB; }
function roar(pitch = 1, big = false) {
  if (!ac) return;
  try {
    const t0 = ac.currentTime, d = big ? 1.3 : 0.7;
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(150 * pitch, t0); o.frequency.exponentialRampToValueAtTime(55 * pitch, t0 + d);
    const l = ac.createOscillator(); l.frequency.value = big ? 22 : 31; const lg = ac.createGain(); lg.gain.value = 35 * pitch; l.connect(lg); lg.connect(o.frequency);
    const n = ac.createBufferSource(); n.buffer = noise(); const ng = ac.createGain(); ng.gain.value = 0.55;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(big ? 900 : 1500, t0); f.frequency.exponentialRampToValueAtTime(200, t0 + d);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(big ? 0.55 : 0.28, t0 + 0.07); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(f); n.connect(ng); ng.connect(f); f.connect(g); g.connect(sfxBus);
    o.start(t0); l.start(t0); n.start(t0); o.stop(t0 + d + 0.05); l.stop(t0 + d + 0.05); n.stop(t0 + d + 0.05);
  } catch (e) { }
}
const SFX = {
  hit: () => tone(180, 0.08, 'square', 0.06), big: () => { tone(120, 0.25, 'sawtooth', 0.08, -60); tone(300, 0.15, 'square', 0.05); },
  chime: (f) => { tone(f, 0.5, 'sine', 0.05); tone(f * 1.5, 0.4, 'sine', 0.03); }, tick: () => tone(1400, 0.03, 'square', 0.04),
  cube: () => { [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'triangle', 0.07), i * 90)); },
  fail: () => tone(220, 0.25, 'sawtooth', 0.06, -80), whoosh: () => tone(500, 0.18, 'sine', 0.05, 600),
  win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.08), i * 120)); },
  level: () => { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.05), i * 80)); },
  evo: () => { for (let i = 0; i < 16; i++) setTimeout(() => tone(300 + i * 60, 0.15, 'triangle', 0.05), i * 120); },
};
const MUS = { next: 0, step: 0, mode: 'forest' };
const PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
function mnote(f, t, d, type, v, cut) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.05, d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  if (cut) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; o.connect(fl); fl.connect(g); } else o.connect(g);
  g.connect(musBus); o.start(t); o.stop(t + d + 0.05);
}
function kick(t, v = 0.5) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(musBus); o.start(t); o.stop(t + 0.25); }
function musicStep(mode, s, t) {
  const night = isNight();
  if (mode === 'forest') {
    if (s % 16 === 0) { const root = night ? 110 : 220; [[0, 3, 7], [5, 8, 12], [3, 7, 10], [-2, 2, 5]][(s >> 4) % 4].forEach((i) => mnote(root * Math.pow(2, i / 12), t, 3.6, 'triangle', 0.05)); }
    if (Math.random() < (night ? 0.16 : 0.3)) mnote(PENTA[Math.floor(Math.random() * PENTA.length)] * (night ? 0.5 : 1), t, 0.6, 'sine', 0.045);
  } else if (mode === 'battle') {
    const pat = [55, 55, 65.41, 55, 73.42, 55, 65.41, 49]; mnote(pat[s % 8], t, 0.2, 'sawtooth', 0.09, 500);
    if (s % 4 === 0) kick(t, 0.45); if (s % 8 === 4) mnote(PENTA[(s >> 3) % 5] * 2, t, 0.15, 'square', 0.03, 2000);
  } else {
    const pat = [41.2, 41.2, 49, 41.2, 55, 41.2, 49, 36.7]; mnote(pat[s % 8], t, 0.18, 'sawtooth', 0.11, 420);
    if (s % 2 === 0) kick(t, 0.55); if (s % 16 === 0) [0, 3, 6].forEach((i) => mnote(164.8 * Math.pow(2, i / 12), t, 1.2, 'square', 0.025, 1200));
  }
}
function updateMusic() {
  if (!ac || save.settings.music <= 0.01 || state === 'creator') return;
  try {
    const now = ac.currentTime; if (MUS.next < now) MUS.next = now + 0.05;
    const bpm = MUS.mode === 'forest' ? 84 : MUS.mode === 'boss' ? 150 : 132;
    while (MUS.next < now + 0.25) { musicStep(MUS.mode, MUS.step, MUS.next); MUS.next += 60 / bpm / 2; MUS.step++; }
  } catch (e) { }
}
function pickMusic() {
  let m = 'forest';
  if (boss && boss.alive && boss.state !== 'wake' && dist2(P.x, P.z, boss.x, boss.z) < 35) m = 'boss';
  else if (enemies.some((e) => e.alive && e.kind === 'mon' && ['chase', 'windup', 'charging'].includes(e.state) && dist2(e.x, e.z, P.x, P.z) < 22)) m = 'battle';
  if (m !== MUS.mode) { MUS.mode = m; MUS.step = 0; }
}

// ====================================================================== input: keyboard + mouse + gamepad
const keys = {};
const press = new Set();        // edge-triggered actions this frame
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (paused) { pauseKey(e.code); e.preventDefault(); return; }
  if (!keys[e.code]) {
    const map = { KeyE: 'talk', Enter: 'talk', KeyJ: 'attack', Digit1: 'skill1', Digit2: 'skill2', Digit3: 'ult', KeyF: 'cube', KeyQ: 'dodge', Tab: 'team', KeyC: 'avatar', Escape: 'pause', KeyP: 'pause', KeyH: 'help', KeyR: 'potion', KeyX: 'dex', KeyB: 'ride', KeyG: 'dragon' };
    if (map[e.code]) press.add(map[e.code]);
    if (e.code === 'Space') press.add('jumpPress');
  }
  keys[e.code] = true;
  if (['Space', 'Tab'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => keys[e.code] = false);
let mouseDownAt = 0;
addEventListener('mousedown', (e) => { if (e.button === 0 && state === 'play' && e.target === renderer.domElement) mouseDownAt = performance.now(); });
addEventListener('mouseup', (e) => { if (e.button === 0 && state === 'play' && performance.now() - mouseDownAt < 180 && e.target === renderer.domElement && !(drag && drag.moved)) press.add('attack'); });

const pad = { on: false, lx: 0, ly: 0, rx: 0, ry: 0, jump: false, run: false, prev: [] };
const dz = (v) => Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82;
if (qs.has('fakepad')) { const b = (p) => ({ pressed: p, value: p ? 1 : 0 }); navigator.getGamepads = () => [{ connected: true, id: 'DualSense (test)', axes: [0, -1, 0.5, 0], buttons: Array.from({ length: 17 }, (_, i) => b(i === 7)) }]; }
function pollPad() {
  const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find((g) => g && g.connected);
  if (!gp) { if (pad.on) { pad.on = false; hintBar(); toast('🎮 Controller disconnected.'); } return; }
  if (!pad.on) { pad.on = true; hintBar(); toast('🎮 Controller connected! Tips now show its buttons.'); }
  pad.gp = gp;
  const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed), edge = (i) => b(i) && !pad.prev[i];
  pad.lx = dz(gp.axes[0] || 0); pad.ly = dz(gp.axes[1] || 0); pad.rx = dz(gp.axes[2] || 0); pad.ry = dz(gp.axes[3] || 0);
  if (!paused && padMenuNav(gp, edge)) { pad.lx = pad.ly = pad.rx = pad.ry = 0; pad.jump = pad.run = false; pad.prev = gp.buttons.map((x) => x.pressed); return; }
  if (paused) {
    if (edge(12)) pauseKey('ArrowUp'); if (edge(13)) pauseKey('ArrowDown'); if (edge(14)) pauseKey('ArrowLeft'); if (edge(15)) pauseKey('ArrowRight');
    if (edge(0)) pauseKey('Enter'); if (edge(1) || edge(8) || edge(9)) pauseKey('Escape');
    pad.prev = gp.buttons.map((x) => x.pressed); return;
  }
  if (b(12)) pad.ly = -1; if (b(13)) pad.ly = 1; if (b(14)) pad.lx = -1; if (b(15)) pad.lx = 1;
  pad.jump = b(0); pad.run = b(7);
  if (edge(10)) press.add('ride');
  if (edge(0)) press.add('jumpPress');
  if (edge(2)) press.add('talk');
  if (edge(1)) press.add('dodge');
  if (edge(3)) press.add('cube');
  if (b(4) && b(5) && (edge(4) || edge(5))) press.add('ult');
  else { if (edge(5)) press.add('attack'); if (edge(4)) press.add('skill1'); }
  if (edge(6)) press.add('skill2');
  if (edge(9)) press.add('team');
  if (edge(8)) press.add('pause');
  if (edge(11)) press.add('potion');
  if (edge(17)) press.add('help');
  pad.prev = gp.buttons.map((x) => x.pressed);
}
function rumble(s = 0.8, ms = 300) { try { pad.gp && pad.gp.vibrationActuator && pad.gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: s, weakMagnitude: s * 0.6 }); } catch (e) { } }
const BTN = {
  jump: () => pad.on ? '✕' : 'Space', run: () => pad.on ? 'R2' : 'Shift', talk: () => pad.on ? '⬜' : 'E', attack: () => pad.on ? 'R1' : 'J / click',
  skill1: () => pad.on ? 'L1' : '1', skill2: () => pad.on ? 'L2' : '2', ult: () => pad.on ? 'L1+R1' : '3', cube: () => pad.on ? '△' : 'F',
  dodge: () => pad.on ? '○' : 'Q', team: () => pad.on ? 'Options' : 'Tab', pause: () => pad.on ? 'Create' : 'Esc', move: () => pad.on ? 'left stick' : 'WASD',
  help: () => pad.on ? 'Touchpad' : 'H', potion: () => pad.on ? 'R3' : 'R', ride: () => pad.on ? 'L3' : 'B',
};
function hintBar() {
  const h = $('hint'); if (!h) return;
  h.innerHTML = pad.on
    ? '🎮 <b>L-stick</b> move · <b>R2</b> run · <b>✕</b> jump · <b>○</b> roll · <b>R1</b> attack · <b>L1/L2</b> skills · <b>L1+R1</b> ultimate · <b>△</b> FoldCube · <b>⬜</b> talk · <b>R3</b> potion · <b>L3</b> ride · <b>Options</b> team · <b>Create</b> pause · <b>Touchpad</b> help'
    : '<b>WASD</b> move · <b>Shift</b> run · <b>Space</b> jump · <b>Q</b> roll · <b>J</b>/click attack · <b>1 2</b> skills · <b>3</b> ultimate · <b>F</b> FoldCube · <b>E</b> talk · <b>R</b> potion · <b>B</b> ride · <b>Tab</b> team · <b>Esc</b> pause · <b>H</b> help';
}
addEventListener('gamepadconnected', pollPad);

// camera: drag / right stick
const cam = { yaw: 0, pitch: 0.38, dist: 8 };
let drag = null;
renderer.domElement.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: false }; });
addEventListener('pointerup', () => setTimeout(() => drag = null, 0));
addEventListener('pointermove', (e) => { if (!drag) return; if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) drag.moved = true; const s = save.settings.sens; cam.yaw = drag.yaw - (e.clientX - drag.x) * 0.006 * s; cam.pitch = Math.min(1.2, Math.max(-0.05, drag.pitch + (e.clientY - drag.y) * 0.004 * s)); });
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
renderer.domElement.addEventListener('wheel', (e) => { cam.dist = Math.min(16, Math.max(4, cam.dist * (e.deltaY > 0 ? 1.08 : 0.93))); }, { passive: true });

// ====================================================================== UI helpers: toast, guide, tips, save
function toast(t, ms = 3800) { const el = $('toast'); el.innerHTML = t; el.classList.remove('hidden', 'pop'); void el.offsetWidth; el.classList.add('pop'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.add('hidden'), ms); }
let guideText = '';
function guide(text, kind = 'info') { const el = $('guide'); if (text === guideText) return; guideText = text; if (!text) return el.classList.add('hidden'); el.className = 'guide ' + kind; el.innerHTML = text; void el.offsetWidth; el.classList.add('pop'); }
// one-time tips: each one appears once per save, queued so they never overlap
const tipQ = []; let tipShowing = null;
function tip(key, html, title = '💡 Tip', ms = 8000) { if (save.tips[key]) return; save.tips[key] = 1; tipQ.push({ html, title, ms }); if (!tipShowing) nextTip(); }
function nextTip() {
  const t = tipQ.shift();
  if (!t) { tipShowing = null; $('tip').classList.add('hidden'); return; }
  tipShowing = t; $('tip').classList.remove('hidden', 'pop'); void $('tip').offsetWidth; $('tip').classList.add('pop'); $('tipT').innerHTML = t.title; $('tipB').innerHTML = t.html;
  const bar = $('tipBar'); bar.style.transition = 'none'; bar.style.width = '100%';
  requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${t.ms}ms linear`; bar.style.width = '0%'; }));
  SFX.chime(990); clearTimeout(nextTip._t); nextTip._t = setTimeout(nextTip, t.ms);
}
async function persist() {
  if (qs.has('t')) return;   // test scenes never touch the real save
  if (boss && boss.alive) save.bossState = { hp: boss.hp, pylons: pylons.map((p) => p.alive), phase2: !!boss.phase2 };
  try { await fetch(advUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(save) }); } catch (e) { }
}
setInterval(() => fetch('/api/ping').catch(() => { }), 5000);
setInterval(() => { if (state === 'play' && !paused) persist(); }, 20000);   // autosave

// dialogue: a queue of lines; movement pauses while it is open
const dlg = { q: [], open: false, done: null };
function say(lines, done) { dlg.q = lines.slice(); dlg.done = done || null; dlg.open = true; showLine(); }
function showLine() {
  const l = dlg.q.shift();
  if (!l) { dlg.open = false; $('dialog').classList.add('hidden'); const d = dlg.done; dlg.done = null; d && d(); return; }
  $('dialog').classList.remove('hidden', 'pop'); void $('dialog').offsetWidth; $('dialog').classList.add('pop'); $('dWho').textContent = l[0]; $('dTxt').innerHTML = l[1];
  $('dNext').textContent = `▶ continue (${pad.on ? '✕ / ⬜' : 'E / Space'})`;
  if (l[2]) l[2]();
  SFX.tick();
}

// ====================================================================== day and night
const DAYLEN = 360;   // seconds for a full day
function dayLight() { const t = save.time; if (t < 0.6) return 1; if (t < 0.7) return 1 - (t - 0.6) / 0.1; if (t < 0.92) return 0; return Math.min(1, (t - 0.92) / 0.08); }
const isNight = () => dayLight() < 0.35;
const nightMul = () => isNight() ? 1.25 : 1;
const SKY_D = new THREE.Color('#9fd8ff'), SKY_N = new THREE.Color('#0a1230'), FOG_D = new THREE.Color('#c4e8ff'), FOG_N = new THREE.Color('#0d1636');
let wasNight; const TMP_C = new THREE.Color();
function updateDay(dt) {
  if (state === 'play') save.time = (save.time + dt / DAYLEN) % 1;
  const L = dayLight(), A = WX.amt;
  const grey = Math.min(1, A.rain * 0.8 + A.cloudy * 0.35 + A.fog * 0.75 + A.snow * 0.5 + A.wind * 0.15);
  const lm = Math.max(0.35, 1 + 0.18 * A.sun - 0.45 * A.rain - 0.2 * A.snow - 0.3 * A.fog - 0.08 * A.wind - 0.12 * A.cloudy);
  scene.fog.color.copy(FOG_N).lerp(FOG_D, L).lerp(TMP_C.set(L > 0.5 ? '#c3ccd6' : '#151c2c'), Math.min(1, grey));
  scene.fog.near = (30 + 30 * L) * (1 - A.fog * 0.85) * (1 - A.rain * 0.4) * (1 - A.snow * 0.35); scene.fog.far = (110 + 80 * L) * (1 - A.fog * 0.75) * (1 - A.rain * 0.3) * (1 - A.snow * 0.3);
  hemi.intensity = (0.3 + 0.75 * L) * lm + (WX.flash > 0 ? 2.5 : 0); sun.intensity = (0.4 + 2.1 * L) * lm * (1 - grey * 0.4); sun.color.setHSL(L > 0.5 ? 0.1 : 0.62, 0.5, 0.8);
  lantern.intensity = Math.max(1 - L, (A.rain + A.fog + A.snow) * 0.5) * 1.6; lantern.position.set(P.x, P.y + 2.4, P.z);
  const night = isNight();
  if (night !== wasNight) { if (wasNight !== undefined && state === 'play') night ? onNightfall() : onDawn(); wasNight = night; }
}
function onNightfall() {
  toast('🌙 Night has fallen! Monsters are <b>stronger</b> and more of them roam the forest.', 5000);
  tip('night', `🌙 At night monsters hit <b>harder</b> and their eyes glow in the dark. Your <b>lantern</b> lights the way. Night monsters (🌙) run away at sunrise. The best place to rest is the <b>camp</b> ⛺.`, '🌙 Night');
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * 6.28, r = rand(14, 22), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
    if (Math.abs(x) > HALF - 12 || Math.abs(z) > HALF - 12 || height(x, z) < WATER + 0.2 || z > 36) continue;
    const pool = ['emberlid', 'glimframe', 'mossroll', 'bellbud'];
    const e = makeEnemy(pool[i % pool.length], x, z, { mood: 'angry', atkMul: 1.0, corrupted: true }); e.night = true; e.name = '🌙 ' + e.name;
  }
}
function onDawn() {
  toast('☀️ The sun rises. Night monsters run back into the shadows.');
  for (const e of enemies) if (e.night && e.alive) { e.alive = false; e.state = 'flee'; setTimeout(() => removeEnemy(e), 1600); }
}

// ====================================================================== the player
let avatar = buildAvatar(save.avatar); scene.add(avatar);
const P = { x: SPOTS.start[0], z: SPOTS.start[1], y: 1, vy: 0, yaw: Math.PI, onGround: true, mode: 'idle', hp: 100, maxHp: 100, dodgeT: 0, iframes: 0, slowT: 0 };
P.y = height(P.x, P.z);
function updatePlayer(dt) {
  let ix = 0, iz = 0, analog = 1;
  if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (pad.on && (pad.lx || pad.ly)) { ix = pad.lx; iz = -pad.ly; analog = Math.min(1, Math.hypot(ix, iz)); }
  const tm = touchMove(); if (tm) { ix = tm[0]; iz = tm[1]; analog = tm[2]; }
  if (dlg.open || evolving || babaBusy() || FISH.on || CINE.t > 0 || MORPH.on) { ix = 0; iz = 0; }
  const ground = height(P.x, P.z), flying = RIDE.on && RIDE.kind === 'fly', swimming = ground < WATER - 0.9 && !flying;
  const run = (keys.ShiftLeft || keys.ShiftRight || pad.run || (tm && tm[3])) && !swimming;
  if (P.slowT > 0) P.slowT -= dt;
  let speed = (POWER.t > 0 ? 1.45 : 1) * (P.slowT > 0 ? 0.55 : 1) * (swimming ? (swimBoost > 0 ? 6.5 : 3.2) : run ? 8.8 : 4.8) * (analog < 1 ? Math.max(0.35, analog) : 1);
  if (RIDE.on) speed = (RIDE.kind === 'swim' && !swimming ? 5 : RIDE.r.speed) * (run ? 1.25 : 1) * (analog < 1 ? Math.max(0.35, analog) : 1);
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = -fz, rz = fx;
  let mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
  const len = Math.hypot(mx, mz);
  if (press.has('dodge') && P.dodgeT <= 0 && !swimming && !dlg.open && !RIDE.on) { P.dodgeT = 0.35; P.iframes = 0.4; P.dodgeDir = len > 0.01 ? [mx / len, mz / len] : [Math.sin(P.yaw), Math.cos(P.yaw)]; SFX.whoosh(); }
  let climbing = false;
  if (P.dodgeT > 0) { P.dodgeT -= dt; const nx = P.x + P.dodgeDir[0] * 13 * dt, nz = P.z + P.dodgeDir[1] * 13 * dt; if (height(nx, nz) - height(P.x, P.z) < 0.9) { P.x = nx; P.z = nz; } }
  else if (len > 0.01) {
    mx /= len; mz /= len;
    const nx = P.x + mx * speed * dt, nz = P.z + mz * speed * dt;
    const rise = height(nx, nz) - height(P.x, P.z);
    const steep = rise / (speed * dt) > 1.15 && P.onGround && !swimming && !flying;
    if (steep) climbing = true;
    const k = steep ? 0.35 : 1;
    P.x += (nx - P.x) * k; P.z += (nz - P.z) * k;
    let d = Math.atan2(mx, mz) - P.yaw; d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; P.yaw += d * Math.min(1, dt * 12);
  }
  P.x = Math.max(-HALF + 4, Math.min(HALF - 4, P.x)); P.z = Math.max(-HALF + 4, Math.min(HALF - 4, P.z));
  if (P.iframes > 0) P.iframes -= dt;
  const g2 = height(P.x, P.z), jumpHeld = (keys.Space || pad.jump) && !dlg.open;
  if (flying) { const up = jumpHeld ? 1 : (keys.KeyQ || (pad.gp && pad.gp.buttons[1] && pad.gp.buttons[1].pressed)) ? -1 : 0; P.flyH = Math.max(1.2, Math.min(RIDE.dragon ? 70 : 30, (P.flyH || 3) + up * 7 * dt)); P.y += (Math.max(g2, WATER) + P.flyH - P.y) * Math.min(1, dt * 5); P.vy = 0; P.onGround = false; }
  else if (swimming && RIDE.on && RIDE.kind === 'swim') { P.y += (WATER - 0.3 - P.y) * Math.min(1, dt * 6); P.vy = 0; P.onGround = false; }
  else if (swimming) { P.y += (WATER - 0.55 - P.y) * Math.min(1, dt * 6); P.vy = 0; P.onGround = false; if (jumpHeld) P.y = Math.min(P.y + dt * 2, WATER - 0.2); }
  else {
    if (press.has('jumpPress') && P.onGround && !dlg.open) { P.vy = POWER.t > 0 ? 10.5 : 7.8; P.onGround = false; }
    P.vy -= 22 * dt; P.y += P.vy * dt;
    if (P.y <= g2) { P.y = g2; P.vy = 0; P.onGround = true; } else if (P.y - g2 < 0.08 && P.vy <= 0) P.onGround = true; else P.onGround = false;
  }
  P.mode = RIDE.on ? 'idle' : swimming ? 'swim' : P.dodgeT > 0 ? 'run' : !P.onGround ? 'air' : climbing ? 'climb' : len > 0.01 ? (run ? 'run' : 'walk') : 'idle';
  avatar.position.set(P.x, P.y + (RIDE.on ? RIDE.r.seat : 0), P.z); avatar.rotation.y = P.yaw;
}
const BOSSHIT = { v: false };
function hurtPlayer(n) {
  if (P.iframes > 0 || state !== 'play') return;
  n *= DIFF().dmg;
  if (comp && comp.guardT > 0) { n *= 0.2; spark(P.x, P.y + 1, P.z, '#9fe8ff'); }
  if (boss && boss.alive && boss.state !== 'wake') BOSSHIT.v = true;
  P.hp = Math.max(1, P.hp - n); P.iframes = 0.5; rumble(0.6, 200); SFX.hit(); shake(0.15, 0.15);
  floatText(P.x, P.y + 2.2, P.z, `-${Math.round(n)}`, '#ff5a6a');
  tip('hurt', `❤️ You got hit! Your health is top-right. Roll away with <b>${BTN.dodge()}</b>, and if you get very low, someone strong may come running to help…`);
}
function updateCamera(dt) {
  if (MORPH.on || updateCine(dt)) return;
  const tx = P.x, ty = P.y + 1.4, tz = P.z, cdist = cam.dist * (RIDE.dragon ? 1.8 : 1);
  const cx = tx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cdist, cz = tz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cdist;
  let cy = ty + Math.sin(cam.pitch) * cdist; cy = Math.max(cy, terrainHeight(cx, cz) + 0.8);
  if (cam.snap) { camera.position.set(cx, cy, cz); cam.snap = false; } else camera.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 10));
  camera.lookAt(tx, ty, tz); applyShake(dt);
  sun.position.set(P.x - 20, 40, P.z + 15); sun.target.position.set(P.x, 0, P.z);
}

// ====================================================================== NPCs: Professor Green, Nira, villagers
const green = buildPerson('green'); scene.add(green);
green.position.set(SPOTS.green[0], height(...SPOTS.green), SPOTS.green[1]); green.rotation.y = Math.PI;
const VILLAGERS = [
  { at: [-6, 54, 0.5], lines: ['Have you seen the mountain in the north? Its top is flat, like someone cut it with a ruler!', 'At night the monsters’ eyes glow in the dark. Keep your lantern close.'] },
  { at: [18, 58, -2], lines: ['Baba? The big bald guy with the beard? He runs faster than a horse when someone needs help!', 'Some Monstermon are sad, not angry. Be gentle with those ones.'] },
  { at: [-24, 60, 1], lines: ['The Songwood mushrooms sing when you come close. Nira loves listening to them.', 'If your whole team gets tired, you wake up at the camp. Rest there to heal!'] },
];
const villagers = VILLAGERS.map((v) => { const m = buildPerson('villager'); m.position.set(v.at[0], height(v.at[0], v.at[1]), v.at[1]); m.rotation.y = v.at[2]; scene.add(m); v.model = v.model = m; v.i = 0; return m; });
const NIRA_AT = [SPOTS.camp[0] + 3, SPOTS.camp[1] - 3];
const nira = buildPerson('nira'); nira.position.set(NIRA_AT[0], height(...NIRA_AT), NIRA_AT[1]); nira.rotation.y = 0.6; nira.visible = false; scene.add(nira);

// objective beacon (a soft light pillar)
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
scene.add(beacon);
function setBeacon(x, z) { if (x === null) { beacon.visible = false; return; } beacon.visible = true; beacon.position.set(x, height(x, z) + 15, z); }

// starters showcased at the lab during the intro
const showcase = STARTERS.map((sp, i) => { const m = buildMon(sp, 'happy'); m.position.set(SPOTS.green[0] - 3 + i * 3, height(SPOTS.green[0] - 3 + i * 3, SPOTS.green[1] + 2.5), SPOTS.green[1] + 2.5); m.rotation.y = Math.PI; m.userData.st = {}; scene.add(m); return m; });
const dummy = new THREE.Group(); bx(dummy, 0.2, 1.4, 0.2, '#8a5a2b', 0, 0.7, 0); bx(dummy, 0.9, 0.9, 0.6, '#e2c27a', 0, 1.5, 0); bx(dummy, 1.2, 0.15, 0.15, '#8a5a2b', 0, 1.6, 0);
dummy.position.set(SPOTS.green[0] + 6, height(SPOTS.green[0] + 6, SPOTS.green[1] - 4), SPOTS.green[1] - 4); scene.add(dummy);

// the folded gate in the Cut Mountain (new zone)
const GATE = [0, -57];
const gate = new THREE.Group(); scene.add(gate);
{
  const gy = height(GATE[0], GATE[1]);
  gate.position.set(GATE[0], gy, GATE[1]);
  bx(gate, 8, 8, 2.4, '#1a1d26', 0, 4, -0.6);
  for (const [x, y, w, h] of [[0, 4, 0.12, 7.6], [0, 4, 7.6, 0.12], [-2, 6, 0.1, 3.5], [2.5, 2, 0.1, 3], [-2.6, 2.4, 3, 0.1], [2, 6.4, 3, 0.1]]) bx(gate, w, h, 0.05, mat('#6fe3ff', { e: '#3ad0ff', ei: 2.4 }), x, y, 0.62);
  for (const s of [-1, 1]) { bx(gate, 1.4, 9, 1.4, '#55504a', s * 5, 4.5, 0); bx(gate, 1.8, 0.6, 1.8, '#3a3630', s * 5, 9.2, 0); }
  gate.userData.shards = [];
  for (let i = 0; i < 6; i++) { const s = bx(gate, 0.5, 0.5, 0.5, mat('#a8f0ff', { e: '#3ad0ff', ei: 1.8, op: 0.85 }), rand(-4, 4), rand(5, 10), rand(1, 3)); gate.userData.shards.push(s); }
}

// ====================================================================== team, levels, evolution, companion
const LV_XP = 100, EVO_LV = 4;
const levelOf = (m) => 1 + Math.floor((m.xp || 0) / LV_XP);
const memberMax = (m) => Math.round(SPECIES[m.sp].hp * (1 + 0.1 * ((m.lv || 1) - 1)));
function newMember(sp) { const m = { sp, xp: 0, lv: 1, uid: Math.random().toString(36).slice(2) }; m.maxHp = memberMax(m); m.hp = m.maxHp; return m; }
let comp = null;            // live companion { m (member), model, x,z,y, cds[], target, auto, guardT, attackT }
const ULT = { v: 0 };
function spawnCompanion(member, trial = false) {
  if (comp) scene.remove(comp.model);
  if (RIDE.on) dismount();
  if (!member) { comp = null; renderComp(); return; }
  const model = buildMon(member.sp, 'happy'); scene.add(model);
  const a = P.yaw + 2.4;
  comp = { m: member, model, x: P.x + Math.sin(a) * 1.8, z: P.z + Math.cos(a) * 1.8, y: P.y, cds: [0, 0, 0, 0], target: null, auto: false, guardT: 0, attackT: 0, trial, yaw: 0 };
  spark(comp.x, comp.y + 0.8, comp.z, '#9fe8ff', 18);
  renderComp(); rideTip();
}
function activeMember() { return save.team[save.active]; }
function compStats() { return SPECIES[comp.m.sp]; }
function giveXP(n) {
  if (!save.team.length) return;
  save.team.forEach((m, i) => {
    const add = i === save.active ? n : Math.round(n * 0.3), before = m.lv || 1;
    m.xp = (m.xp || 0) + add; m.lv = levelOf(m);
    if (m.lv > before) {
      const ratio = m.hp / (m.maxHp || 1); m.maxHp = memberMax(m); m.hp = Math.max(m.hp, Math.round(m.maxHp * ratio));
      if (i === save.active && comp) { floatText(comp.x, comp.y + 2.4, comp.z, `LEVEL ${m.lv}!`, '#b48cff'); SFX.level(); spark(comp.x, comp.y + 1, comp.z, '#b48cff', 20); }
      tip('levelup', `⭐ <b>${SPECIES[m.sp].name}</b> reached <b>level ${m.lv}</b>! Every level gives more HP and stronger hits. The purple bar under its name shows XP. Starters <b>evolve at level ${EVO_LV}</b>!`, '⭐ Level up');
    }
  });
  if (comp) floatText(comp.x, comp.y + 1.9, comp.z, `+${n} XP`, '#d9c4ff');
  checkEvolution(); renderComp();
}
function checkEvolution() {
  const m = activeMember(); if (!m || !comp || comp.m !== m || evolving || comp.trial) return;
  const d = SPECIES[m.sp];
  if (d.evo && m.lv >= EVO_LV) startEvolution(m);
  else if (d.evo && m.lv === EVO_LV - 1) tip('evosoon', `✨ <b>${d.name}</b> is close to evolving! One more level: keep fighting and catching Monstermon.`, '✨ Almost there');
}
let evolving = null;
function startEvolution(m) {
  evolving = { m, t: 0, swapped: false, from: m.sp, to: SPECIES[m.sp].evo };
  SFX.evo(); rumble(0.5, 1500); toast(`✨ What?! <b>${SPECIES[m.sp].name}</b> is evolving!`, 3500);
}
function updateEvolution(dt) {
  if (!evolving || !comp) return;
  const ev = evolving; ev.t += dt; const k = ev.t;
  comp.model.rotation.y += dt * (4 + k * 8);
  comp.model.scale.setScalar(1 + Math.sin(k * 14) * 0.15 * Math.min(1, k / 2));
  $('evo').style.opacity = k > 1.7 && k < 2.6 ? 1 : 0;
  if (Math.random() < 0.3) spark(comp.x, comp.y + 1, comp.z, '#ffffff', 2);
  if (k > 2.1 && !ev.swapped) {
    ev.swapped = true; const keep = [comp.x, comp.z];
    ev.m.sp = ev.to; markCaught(ev.to); ev.m.maxHp = memberMax(ev.m); ev.m.hp = ev.m.maxHp; spawnCompanion(ev.m); comp.x = keep[0]; comp.z = keep[1]; comp.celebrateT = 2.5; evoBurst(comp.x, comp.y, comp.z);
  }
  if (k > 3.3) {
    comp.model.scale.setScalar(1); evolving = null; $('evo').style.opacity = 0; SFX.win(); roar(0.8, true);
    toast(`🎉 ${SPECIES[ev.from].name} evolved into <b>${SPECIES[ev.to].name}</b>!`, 5000); stat('evolves');
    tip('evolved', `Evolved Monstermon have <b>more HP</b>, <b>stronger attacks</b> and <b>new skills</b>. Look at the skill names in the panel bottom-left!`, '🎉 Evolution');
    persist();
  }
}
function updateCompanion(dt, t) {
  if (!comp) return;
  const d = compStats();
  for (let i = 0; i < 4; i++) if (comp.cds[i] > 0) comp.cds[i] -= dt;
  if (comp.guardT > 0) comp.guardT -= dt;
  if (comp.attackT > 0) comp.attackT -= dt;
  if (updateFetch(dt, t)) return;
  if (RIDE.on && !RIDE.dragon) {
    comp.x = P.x; comp.z = P.z; comp.y = P.y; comp.yaw = P.yaw; comp.model.position.set(P.x, P.y + (RIDE.kind === 'fly' ? -0.6 : 0), P.z); comp.model.rotation.y = P.yaw;
    const mv = P.mode !== 'idle' || keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || (pad.on && (pad.lx || pad.ly));
    comp.model.userData.anim(t, { moving: mv, fly: RIDE.kind === 'fly' });
    if (RIDE.kind === 'roll' && mv) { comp.model.children[0].rotation.x += dt * 9; for (const e of enemies) if (e.alive && e.kind === 'mon' && !e.boss && dist2(e.x, e.z, P.x, P.z) < 1.8 && !(e.bumpT > t)) { e.bumpT = t + 1; applyDamage(e, 12); const a = Math.atan2(e.x - P.x, e.z - P.z); e.x += Math.sin(a) * 3; e.z += Math.cos(a) * 3; floatText(e.x, e.y + 2, e.z, 'BUMP!', '#ffd34d'); } }
    return;
  }
  if (evolving) { comp.model.position.set(comp.x, comp.y + 0.3, comp.z); comp.model.userData.anim(t, { celebrate: true }); return; }
  const tgt = comp.target && comp.target.alive ? comp.target : null;
  if (!tgt) comp.auto = false;
  let gx, gz, speed = d.spd * 1.3;
  if (comp.auto && tgt) {
    const range = d.skills[0].range + (tgt.boss ? 2 : 0);
    const dd = dist2(comp.x, comp.z, tgt.x, tgt.z);
    if (dd > range * 0.9) { gx = tgt.x; gz = tgt.z; speed = d.spd * 1.6; }
    else { gx = comp.x; gz = comp.z; if (comp.cds[0] <= 0) { compHit(tgt, d.skills[0]); comp.cds[0] = d.skills[0].cd; } }
    comp.yaw = Math.atan2(tgt.x - comp.x, tgt.z - comp.z);
    if (dist2(P.x, P.z, comp.x, comp.z) > 22) comp.auto = false;
  } else {
    const a = P.yaw + 2.4; gx = P.x + Math.sin(a) * 1.9; gz = P.z + Math.cos(a) * 1.9;
  }
  const dx = gx - comp.x, dzz = gz - comp.z, dl = Math.hypot(dx, dzz);
  const moving = dl > 0.4;
  if (moving) { const st = Math.min(dl, speed * dt * (dl > 10 ? 2.5 : 1)); comp.x += dx / dl * st; comp.z += dzz / dl * st; if (!comp.auto) comp.yaw = Math.atan2(dx, dzz); }
  if (dl > 30) { comp.x = gx; comp.z = gz; }
  const g = height(comp.x, comp.z), water = g < WATER - 0.6;
  comp.y += ((water ? WATER - 0.2 : g) - comp.y) * Math.min(1, dt * 10);
  comp.model.position.set(comp.x, comp.y, comp.z);
  let dy = comp.yaw - comp.model.rotation.y; dy = ((dy + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; comp.model.rotation.y += dy * Math.min(1, dt * 10);
  const fly = (comp.m.sp === 'metasteal' && (dl > 6 || water || comp.flyT > 0)) || comp.m.sp === 'metawing';
  if (comp.flyT > 0) comp.flyT -= dt;
  const br = 1 + Math.sin(t * 2.2) * 0.03; comp.model.scale.set(1, br, 1);
  comp.model.userData.anim(t, { moving, attack: comp.attackT > 0, guard: comp.guardT > 0, fly, charging: comp.cds[3] > 0, celebrate: comp.celebrateT > 0 });
  if (comp.celebrateT > 0) comp.celebrateT -= dt;
}
function compHit(tgt, sk, mult = 1) {
  const d = compStats();
  const em = tgt.sp ? elemMulE(elemOf(comp.m.sp), defElem(tgt)) : 1;
  const dmg = d.atk * (1 + 0.08 * ((comp.m.lv || 1) - 1)) * sk.power * rand(0.9, 1.1) * mult * em * weatherMul(comp.m.sp) * happyMul(comp.m);
  comp.attackT = 0.35;
  if (em !== 1 && !(tgt.effT > performance.now())) { tgt.effT = performance.now() + 2500; effectText(em, tgt.x, tgt.y + (tgt.boss ? 5 : 1.6), tgt.z, 'Your companion'); }
  applyDamage(tgt, dmg, sk);
  { const ec = (ELEM[elemOf(comp.m.sp)] || {}).color || '#ffffff', yy = tgt.y + (tgt.boss ? 3 : 1); elemVfx(elemOf(comp.m.sp), tgt.x, yy, tgt.z, false); if (sk.kind !== 'aoe') slashArc(tgt.x, yy, tgt.z, ec); }
  if (sk.kind !== 'aoe') ULT.v = Math.min(100, ULT.v + dmg * 0.9);
  if (ULT.v >= 100) tip('ult', `⚡ Your <b>ultimate</b> is ready! Press <b>${BTN.ult()}</b> for a huge attack that hits everything around your companion.`, '⚡ Ultimate ready');
}
function useSkill(i) {
  if (!comp || dlg.open || evolving) return;
  const d = compStats(), sk = d.skills[i];
  if (i === 3) { if (ULT.v < 100) return toast(`⚡ The ultimate charges up while you fight (${Math.floor(ULT.v)}%).`); }
  else if (comp.cds[i] > 0) return;
  const tgt = currentTarget();
  if (sk.kind === 'guard') { comp.guardT = 2.2; comp.cds[i] = sk.cd; spark(comp.x, comp.y + 1, comp.z, '#9fe8ff', 20); floatText(comp.x, comp.y + 1.8, comp.z, sk.name, '#9fe8ff'); return; }
  if (sk.kind === 'aoe') {
    ULT.v = 0; comp.attackT = 0.8; SFX.big(); rumble(1, 500);
    ring(comp.x, comp.z, sk.range, '#ffd34d'); elemVfx(elemOf(comp.m.sp), comp.x, comp.y + 0.8, comp.z, true); shake(0.35, 0.45);
    floatText(comp.x, comp.y + 2.2, comp.z, sk.name + '!', '#ffd34d');
    for (const e of targets()) if (dist2(e.x, e.z, comp.x, comp.z) < sk.range + (e.boss ? 2.5 : 0)) { compHit(e, sk); const a = Math.atan2(e.x - comp.x, e.z - comp.z); if (!e.boss && e.kind === 'mon') { e.x += Math.sin(a) * 2.5; e.z += Math.cos(a) * 2.5; } }
    return;
  }
  if (!tgt) return toast('🎯 No target nearby. Get closer to a creature.');
  comp.cds[i] = sk.cd;
  if (sk.kind === 'dash') { comp.x = tgt.x - Math.sin(comp.yaw) * 1.2; comp.z = tgt.z - Math.cos(comp.yaw) * 1.2; comp.flyT = 1; SFX.whoosh(); }
  if (sk.kind === 'slow') { tgt.slowT = sk.slow; ring(tgt.x, tgt.z, 1.8, '#9fe8ff'); }
  if (sk.kind === 'melee' && dist2(comp.x, comp.z, tgt.x, tgt.z) > sk.range) { const a = Math.atan2(tgt.x - comp.x, tgt.z - comp.z); comp.x = tgt.x - Math.sin(a) * sk.range * 0.8; comp.z = tgt.z - Math.cos(a) * sk.range * 0.8; }
  compHit(tgt, sk);
  if (sk.stagger) tgt.staggerT = sk.stagger;
  floatText(comp.x, comp.y + 1.8, comp.z, sk.name, '#ffffff');
  comp.target = tgt; comp.auto = true;
}

// ====================================================================== wild Monstermon + objectives (cage, pylons, boss)
const enemies = [];          // all targetable things
let eid = 0;
const ROAR_PITCH = { inkling: 1.2, staplor: 0.75, lanternix: 1.1, aurorell: 0.9, foldragon: 0.4,  rootlock: 0.6, hingemaw: 0.7, mossroll: 0.8, emberlid: 0.9, rivolo: 1, paperfang: 1.1, skipclip: 1.4, bellbud: 1.3, glimframe: 1.5 };
function makeEnemy(sp, x, z, opts = {}) {
  const d = SPECIES[sp], mood = opts.mood || (Math.random() < 0.55 ? 'angry' : 'sad');
  const model = buildMon(sp, mood, { big: opts.big });
  const base = opts.scale || 1; model.scale.setScalar(base);
  scene.add(model);
  const hp = opts.hp || d.hp * 0.75 * (opts.hpMul || 1);
  const e = { id: ++eid, sp, kind: opts.kind || 'mon', name: opts.name || d.name, mood, model, base, x, z, y: height(x, z), homeX: x, homeZ: z, hp, max: hp, atk: d.atk * (opts.atkMul || 0.8), spd: d.spd * 0.85,
    state: 'idle', t: rand(0, 3), wind: 0, cool: 0, slowT: 0, staggerT: 0, hitT: 0, roarT: 0, ready: 0, alive: true, boss: !!opts.boss, catchable: opts.catchable !== false, shard: null, yaw: rand(0, 6), wander: [x, z], xp: opts.xp || 45 };
  e.abil = (d.abilities || []).slice();
  if (opts.corrupted) e.shard = foldShard(model, opts.boss ? 2.2 : 0.9);
  applyLevel(e);
  enemies.push(e);
  return e;
}
function removeEnemy(e) { scene.remove(e.model); const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }
function makeObject(kind, x, z, hp, name) {
  const model = new THREE.Group(); scene.add(model);
  if (kind === 'cage') {
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; const r = bx(model, 0.22, 2.2, 0.22, '#6a4424', Math.cos(a) * 1.1, 1.1, Math.sin(a) * 1.1); r.rotation.z = Math.cos(a) * 0.25; r.rotation.x = Math.sin(a) * 0.25; }
    bx(model, 1.6, 0.3, 1.6, '#5a3a1c', 0, 2.1, 0);
  } else {
    bx(model, 0.8, 0.4, 0.8, '#3a3f48', 0, 0.2, 0); bx(model, 0.3, 2.2, 0.3, '#4a4f58', 0, 1.3, 0);
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat('#a8f0ff', { e: '#3ad0ff', ei: 2 })); core.position.y = 2.6; model.add(core); model.userData.core = core;
  }
  const e = { id: ++eid, kind, name, model, x, z, y: height(x, z), hp, max: hp, alive: true, catchable: false, ready: 0, slowT: 0, staggerT: 0 };
  model.position.set(x, e.y, z);
  enemies.push(e);
  return e;
}
const targets = () => enemies.filter((e) => e.alive && e.kind !== 'hidden' && !e.autoCatch && !e.capturing && !e.burrow && e.model.visible !== false);
function currentTarget() {
  // the closest live target in front of the camera, within 16 m
  let best = null, bs = 1e9;
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
  for (const e of targets()) {
    const dx = e.x - P.x, dz2 = e.z - P.z, d = Math.hypot(dx, dz2);
    if (d > 16) continue;
    const facing = (dx * fx + dz2 * fz) / (d || 1);
    const score = d - facing * 4 + (e.kind === 'pylon' && boss && boss.shield ? -3 : 0);
    if (score < bs) { bs = score; best = e; }
  }
  return best;
}
function applyDamage(e, dmg) {
  if (!e.alive || e.autoCatch || e.capturing) return;
  if (e.puppet) { puppetHit(e, dmg); return; }
  if (e.boss) {
    if (e.shield) { dmg *= 0.12; floatText(e.x, e.y + 5, e.z, 'shield!', '#9fe8ff'); tip('shield', `🛡️ Rootlock is protected by a <b>shield</b>! Destroy the two glowing <b>fold pylons</b> next to the bridge first.`, '🛡️ Shield'); }
    else if (e.state === 'stuck') { dmg *= 2; floatText(e.x, e.y + 5.5, e.z, 'FRAGMENT!', '#ffd34d'); }
  }
  if (e.abil && e.abil.length) dmg = abilityOnHit(e, dmg);
  e.hp -= dmg; SFX.hit(); e.hitT = 0.25;
  spark(e.x, e.y + 1, e.z, '#fff2a8', 8); smoke(e.x, e.y + 1, e.z, 3); hitFlash(e);
  floatText(e.x, e.y + (e.boss ? 5 : 2), e.z, Math.round(dmg), e.boss ? '#ffd34d' : '#ffffff');
  if (e.kind === 'mon' && e.state === 'idle') aggro(e);
  if (e.catchable && !e.boss) e.ready = Math.max(e.ready, Math.min(1, (0.5 - e.hp / e.max) / 0.25));
  if (e.ready >= 1 && e.kind === 'mon') tip('ready', `✦ <b>${e.name}</b> is ready to be caught! Press <b>${BTN.cube()}</b> to throw the FoldCube.`, '🧊 Ready to catch');
  if (e.hp <= 0) killTarget(e);
}
function aggro(e) {
  e.state = 'chase';
  if (dist2(e.x, e.z, P.x, P.z) < 25) { roar(ROAR_PITCH[e.sp] || 1); e.roarT = 0.6; }
}
function killTarget(e) {
  e.hp = 0;
  if (e.kind === 'cage') { e.alive = false; scene.remove(e.model); giveXP(20); onCageBroken(); return; }
  if (e.kind === 'seal') { e.alive = false; e.model.userData.core.material = mat('#333', {}); spark(e.x, e.y + 2.6, e.z, '#3ad0ff', 24); SFX.big(); giveXP(25); onSeal(); return; }
  if (e.kind === 'pylon') { e.alive = false; e.model.userData.core.material = mat('#333', {}); spark(e.x, e.y + 2.6, e.z, '#3ad0ff', 24); SFX.big(); giveXP(15); onPylon(); return; }
  if (e.kind === 'dummy') { e.hp = e.max; return; }
  if (e.boss) { onBossDefeated(e); return; }
  if (e.kind === 'mon') abilityOnDefeat(e);
  // a wild one: you throw the FoldCube at it automatically and it is caught
  if (e.kind === 'mon' && e.catchable) {
    e.hp = 1; e.ready = 1; e.autoCatch = true; e.staggerT = 6; e.state = 'idle';
    if (e.shard) { spark(e.x, e.y + 1, e.z, '#3ad0ff', 22); e.model.remove(e.shard); e.shard = null; }
    floatText(e.x, e.y + 2.2, e.z, 'defeated!', '#9fe8ff'); slowmo(0.35, 0.5); shake(0.25, 0.3);
    toast(`🧊 You defeated <b>${e.name}</b>! You throw the FoldCube and catch it automatically!`, 4000);
    save.coins += 8 + (e.lvl || 0); renderStats(); giveXP(e.xp); if (isNight()) stat('nightWins');
    if (comp) comp.celebrateT = 1.5; if (comp && comp.target === e) comp.auto = false;
    tip('autocatch', `🧊 When you <b>defeat</b> a wild Monstermon, your <b>FoldCube flies by itself</b> and catches it. You can also catch sad ones without fighting (walk slowly and watch them).`, '🧊 Automatic catch');
    launchCube(e); return;
  }
  // (non-catchable wild ones still run away)
  e.alive = false; e.state = 'flee';
  if (e.shard) { spark(e.x, e.y + 1, e.z, '#3ad0ff', 22); toast('✨ The cube fragment broke! The creature is free and ran into the forest.'); }
  floatText(e.x, e.y + 2, e.z, 'tired out!', '#9fe8ff');
  setTimeout(() => removeEnemy(e), 1600);
  if (comp) comp.celebrateT = 1.5;
  save.coins += 8 + (e.lvl || 0); renderStats(); giveXP(e.xp); if (isNight()) stat('nightWins');
  tip('defeat', `This Monstermon can't be caught, so it ran away.`);
  setTimeout(respawnWild, 30000);
}

// ---- telegraphs (danger zones), hazards and attack effects
const telegraphs = [], hazards = [];
function telegraph(x, z, r, time, color, onHit, opts = {}) {
  time *= DIFF().tele;
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, terrainHeight(x, z) + 0.08, z); scene.add(m);
  const edge = new THREE.Mesh(new THREE.RingGeometry(r * 0.95, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); edge.rotation.x = -Math.PI / 2; edge.position.copy(m.position); scene.add(edge);
  telegraphs.push({ m, edge, x, z, r, t: time, max: time, onHit, hint: opts.hint, end: opts.end, color });
}
function lineTelegraph(x, z, ang, len, w, time, opts = {}) {
  time *= DIFF().tele;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = ang + Math.PI;
  const cx = x + Math.sin(ang) * len / 2, cz = z + Math.cos(ang) * len / 2;
  m.position.set(cx, Math.max(terrainHeight(x, z), terrainHeight(cx, cz)) + 0.1, cz); scene.add(m);
  telegraphs.push({ m, line: true, x, z, ang, len, w, t: time, max: time, hint: opts.hint });
}
function inTelegraph(tg, px, pz, pad2 = 0) {
  if (!tg.line) return dist2(px, pz, tg.x, tg.z) < tg.r + pad2;
  const dx = px - tg.x, dzz = pz - tg.z, along = dx * Math.sin(tg.ang) + dzz * Math.cos(tg.ang), side = Math.abs(dx * Math.cos(tg.ang) - dzz * Math.sin(tg.ang));
  return along > -0.5 && along < tg.len + 0.5 && side < tg.w / 2 + pad2;
}
function updateTelegraphs(dt) {
  for (let i = telegraphs.length - 1; i >= 0; i--) {
    const tg = telegraphs[i]; tg.t -= dt;
    const k = 1 - tg.t / tg.max;
    if (tg.line) { tg.m.material.opacity = 0.25 + k * 0.35; if (tg.t <= 0) { scene.remove(tg.m); telegraphs.splice(i, 1); } continue; }
    tg.m.scale.setScalar(Math.max(0.05, k)); tg.m.material.opacity = 0.2 + k * 0.3;
    if (tg.t <= 0) {
      scene.remove(tg.m); scene.remove(tg.edge); telegraphs.splice(i, 1);
      ring(tg.x, tg.z, tg.r, tg.color === RED ? '#ff7a3a' : tg.color);
      if (tg.end) tg.end(tg.x, tg.z);
      if (dist2(P.x, P.z, tg.x, tg.z) < tg.r) tg.onHit('player');
      if (comp && dist2(comp.x, comp.z, tg.x, tg.z) < tg.r) tg.onHit('comp');
    }
  }
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i]; h.t -= dt;
    h.m.material.opacity = 0.35 + Math.sin(h.t * 12) * 0.15;
    if (dist2(P.x, P.z, h.x, h.z) < h.r) { hurtPlayer(h.dmg); tip('embers', `🔥 You are standing in <b>burning embers</b>! Step out of the orange patches.`); }
    if (h.t <= 0) { scene.remove(h.m); hazards.splice(i, 1); }
  }
}
function hazard(x, z, r, time, color, dmg) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, terrainHeight(x, z) + 0.06, z); scene.add(m);
  hazards.push({ m, x, z, r, t: time, dmg });
  smoke(x, terrainHeight(x, z) + 0.3, z, 4);
}
function beamFx(from, x, z) {
  const a = new THREE.Vector3(from.x, from.y + 1.3, from.z), b = new THREE.Vector3(x, terrainHeight(x, z) + 0.3, z), len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, len, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.95 }));
  m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.rotateX(Math.PI / 2); scene.add(m);
  fx.push({ m, fade: true, t: 0.3, max: 0.3 }); SFX.whoosh();
}
function geyserFx(x, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 4, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#7fd0ff', transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  m.position.set(x, terrainHeight(x, z) + 2, z); scene.add(m); fx.push({ m, fade: true, grow: true, t: 0.6, max: 0.6 });
  for (let i = 0; i < 12; i++) spark(x, terrainHeight(x, z) + 1, z, '#bfe8ff', 1);
}

// ---- unique monster attacks
const ATK_TIPS = {
  melee: () => `🔴 A <b>red circle</b> on the ground shows where a monster is about to hit. Step out of it, or roll with <b>${BTN.dodge()}</b>!`,
  pounce: () => `🐺 This monster <b>pounces</b> onto the red circle. Roll away (<b>${BTN.dodge()}</b>) just before it lands!`,
  charge: () => `🟥 A <b>red stripe</b> means the monster will <b>charge</b> in a straight line. Step to the <b>side</b>!`,
  beam: () => `🟡 <b>Glimframe</b> shoots <b>beams</b> from far away at the yellow circle. Keep moving while your companion gets close to it.`,
  geyser: () => `🔵 A <b>blue circle</b> means a <b>geyser</b> is about to burst and throw you into the air. Get out!`,
  ring: () => `🟣 A <b>purple circle</b> around a Bellbud is a deafening <b>sound wave</b> that slows you down. Run out of it!`,
  embers: () => `🔥 Emberlid spits <b>burning embers</b> that stay on the ground for a while. Don't stand in the orange patches!`,
};
const ATK_RANGE = { melee: 2.3, pounce: 5.5, charge: 9, beam: 9, geyser: 8, ring: 3.2, embers: 2.6 };
function startAttack(e, style, tg) {
  const atk = e.atk * nightMul();
  const hit = (mul) => (who) => { if (who === 'player') hurtPlayer(atk * mul); else hurtComp(atk * mul * 1.15, e.sp); abilityOnAttack(e, who, atk * mul); };
  e.state = 'windup'; e.yaw = Math.atan2(tg.x - e.x, tg.z - e.z); e.after = null;
  if (dist2(e.x, e.z, P.x, P.z) < 18) tip('atk_' + style, ATK_TIPS[style](), '⚠️ Watch out');
  if (Math.random() < 0.35) { roar(ROAR_PITCH[e.sp] || 1); e.roarT = 0.5; }
  if (startAttack2(e, style, tg, hit)) { e.wind *= DIFF().tele; e.windMax = e.wind; return; }
  switch (style) {
    case 'pounce': e.wind = 1.1; e.pounce = { fx: e.x, fz: e.z, tx: tg.x, tz: tg.z }; telegraph(tg.x, tg.z, 1.8, 1.1, RED, hit(1.3), { hint: `🐺 <b>${e.name}</b> is about to POUNCE! Roll away with <b>${BTN.dodge()}</b>!` }); break;
    case 'charge': { e.wind = 0.9; e.chargeDir = e.yaw; e.after = 'charge'; e.chargeAtk = atk; lineTelegraph(e.x, e.z, e.yaw, 12, 1.7, 0.9, { hint: `🟥 <b>${e.name}</b> is about to CHARGE! Step to the side!` }); break; }
    case 'beam': e.wind = 1.2; telegraph(tg.x, tg.z, 1.5, 1.2, '#ffd34d', hit(1.2), { hint: `🟡 <b>${e.name}</b> is aiming a beam at you! Move!`, end: (x, z) => beamFx(e, x, z) }); break;
    case 'geyser': e.wind = 1.3; telegraph(tg.x, tg.z, 2.0, 1.3, '#3ab0ff', (who) => { hit(1.0)(who); if (who === 'player') { P.vy = 10; P.onGround = false; } }, { hint: '🔵 Water is bubbling under you! Get out of the blue circle!', end: geyserFx }); break;
    case 'ring': e.wind = 1.0; telegraph(e.x, e.z, 3.6, 1.0, '#b48cff', (who) => { hit(0.8)(who); if (who === 'player') P.slowT = 2.5; }, { hint: `🟣 <b>${e.name}</b> is about to ring! Run out of the purple circle!` }); break;
    case 'embers': e.wind = 0.9; telegraph(tg.x, tg.z, 1.7, 0.9, '#ff7a1a', hit(1.0), { hint: `🔥 <b>${e.name}</b> is spitting embers!`, end: (x, z) => hazard(x, z, 1.5, 5, '#ff5a1a', atk * 0.35) }); break;
    default: e.wind = 0.9; telegraph(tg.x, tg.z, 1.7, 0.9, RED, hit(1.1), { hint: `🔴 <b>${e.name}</b> is about to strike! Step out of the red circle!` });
  }
  e.wind *= DIFF().tele; e.windMax = e.wind;
}
function hurtComp(n, src) {
  if (!comp || evolving) return;
  n *= DIFF().dmg;
  if (src) { const m = elemMul(src, comp.m.sp); n *= m * weatherMul(src); if (m !== 1 && !(comp.effT > performance.now())) { comp.effT = performance.now() + 2500; effectText(m, comp.x, comp.y + 1.4, comp.z, 'The monster'); } }
  if (comp.guardT > 0) { n *= 0.15; floatText(comp.x, comp.y + 1.8, comp.z, 'blocked!', '#9fe8ff'); }
  comp.m.hp = Math.max(0, comp.m.hp - n); floatText(comp.x, comp.y + 1.6, comp.z, `-${Math.round(n)}`, '#ff9aa5');
  if (comp.m.hp <= 0) compFaint();
  else if (comp.m.hp < comp.m.maxHp * 0.3) tip('compLow', `💔 Your companion is getting tired! Open the team with <b>${BTN.team()}</b> to switch, or use a <b>guard skill</b>. Professor Green and the camp heal everyone.`);
  renderComp();
}
function compFaint() {
  toast(`💤 ${SPECIES[comp.m.sp].name} got tired and went back into the FoldCube.`);
  spark(comp.x, comp.y + 1, comp.z, '#9fe8ff', 20);
  const next = save.team.findIndex((m) => m.hp > 0);
  if (next >= 0) { save.active = next; spawnCompanion(save.team[next]); toast(`🔁 ${SPECIES[save.team[next].sp].name} came out of the cube to keep fighting!`); }
  else { spawnCompanion(null); blackout(); }
}
function blackout() {
  // the whole team is tired: back to camp, everyone healed (progress is kept)
  $('fade').style.opacity = 1;
  setTimeout(() => {
    P.x = SPOTS.camp[0] + 3; P.z = SPOTS.camp[1] + 3; P.y = height(P.x, P.z); P.hp = P.maxHp;
    save.team.forEach((m) => m.hp = m.maxHp); save.active = 0; spawnCompanion(save.team[0]);
    for (const e of enemies) if (e.kind === 'mon' && !e.boss) { e.state = 'idle'; e.x = e.homeX; e.z = e.homeZ; }
    cam.snap = true; $('fade').style.opacity = 0; toast('⛺ You woke up at the camp. Your team is healed. Try a different tactic!');
  }, 700);
}
function updateEnemies(dt, t) {
  for (const e of enemies) {
    if (e.kind === 'cage' || e.kind === 'dummy') continue;
    if (e.kind === 'pylon' || e.kind === 'seal') { e.model.userData.core && (e.model.userData.core.rotation.y = t * 2); continue; }
    if (!e.alive) { if (e.state === 'flee') { e.x += Math.sin(e.yaw) * dt * 9; e.z += Math.cos(e.yaw) * dt * 9; e.model.position.set(e.x, height(e.x, e.z), e.z); } continue; }
    if (e.puppet) { updatePuppet(e, dt); continue; }
    if (e.boss) { updateBoss(e, dt, t); continue; }
    if (e.capturing) continue;
    if (e.slowT > 0) e.slowT -= dt; if (e.staggerT > 0) e.staggerT -= dt; if (e.cool > 0) e.cool -= dt;
    const slow = e.slowT > 0 ? 0.35 : 1, dp = dist2(e.x, e.z, P.x, P.z);
    abilityTick(e, dt, t, dp);
    const aggroR = e.mood === 'angry' ? 13 : 6, style = SPECIES[e.sp].attack || 'melee';
    let moving = false, gx = e.x, gz = e.z, sp = e.spd * slow, jumpY = 0;
    if (e.staggerT > 0) { }
    else if (e.state === 'windup') {
      e.wind -= dt * slow;
      if (e.pounce) { const k = 1 - e.wind / (e.windMax || 1.1); if (k > 0.5) { const q = Math.min(1, (k - 0.5) / 0.5); e.x = e.pounce.fx + (e.pounce.tx - e.pounce.fx) * q; e.z = e.pounce.fz + (e.pounce.tz - e.pounce.fz) * q; jumpY = Math.sin(q * Math.PI) * 2.2; } }
      if (e.wind <= 0) { e.pounce = null; if (e.after === 'charge') { e.state = 'charging'; e.chargeT = 0.6; e.hitDone = false; } else { e.state = 'recover'; e.wind = 0.9; e.cool = rand(1, 2); } }
    }
    else if (e.state === 'charging') {
      e.chargeT -= dt; const s = 16 * slow;
      e.x += Math.sin(e.chargeDir) * s * dt; e.z += Math.cos(e.chargeDir) * s * dt; moving = true;
      if (Math.random() < 0.5) smoke(e.x, e.y + 0.2, e.z, 1);
      if (!e.hitDone && dist2(e.x, e.z, P.x, P.z) < 1.5) { e.hitDone = true; hurtPlayer(e.chargeAtk * 1.4); P.vy = 6; P.onGround = false; }
      if (comp && !e.hitDone && dist2(e.x, e.z, comp.x, comp.z) < 1.5) { e.hitDone = true; hurtComp(e.chargeAtk * 1.4, e.sp); }
      if (e.chargeT <= 0 || height(e.x, e.z) < WATER - 0.4) { e.state = 'recover'; e.wind = 1.0; e.cool = rand(1.5, 2.5); }
    }
    else if (e.state === 'recover') { e.wind -= dt; if (e.wind <= 0) e.state = 'chase'; }
    else if (dp < aggroR || e.state === 'chase') {
      if (e.state !== 'chase') aggro(e);
      const tg = comp && dist2(e.x, e.z, comp.x, comp.z) < dp ? comp : P;
      gx = tg.x; gz = tg.z;
      const dd = dist2(e.x, e.z, gx, gz);
      if ((style === 'beam' || style === 'geyser') && dd < 4.5) { gx = e.x - (tg.x - e.x); gz = e.z - (tg.z - e.z); }
      if (dd < ATK_RANGE[style] && e.cool <= 0 && !(style === 'charge' && dd < 3)) startAttack(e, style, tg);
      if (dp > aggroR * 2.2 && e.mood === 'sad') e.state = 'idle';
      if (dp > 30) e.state = 'idle';
    } else {
      // calm: wander near home; sad ones stay put and can be calmed by watching
      e.t -= dt;
      if (e.t <= 0) { e.t = rand(2, 5); e.wander = [e.homeX + rand(-5, 5), e.homeZ + rand(-5, 5)]; }
      if (e.mood === 'angry') { gx = e.wander[0]; gz = e.wander[1]; sp *= 0.4; }
      observe(e, dt, dp);
    }
    if (e.state !== 'windup' && e.state !== 'charging' && e.staggerT <= 0) {
      const dx = gx - e.x, dz2 = gz - e.z, dl = Math.hypot(dx, dz2);
      const stop = e.state === 'chase' ? (style === 'beam' || style === 'geyser' ? 5 : 1.9) : 0.3;
      if (dl > stop) { e.x += dx / dl * sp * dt; e.z += dz2 / dl * sp * dt; moving = true; e.yaw = Math.atan2(dx, dz2); }
    }
    const g = height(e.x, e.z); e.y = g < WATER - 0.6 ? WATER - 0.3 : g;
    e.model.position.set(e.x, e.y + jumpY + (e.state === 'windup' && !e.pounce ? Math.sin(t * 40) * 0.05 : 0), e.z);
    e.model.rotation.y = e.yaw; e.movingNow = moving;
    livingScale(e, dt, t);
    e.model.userData.anim(t, { moving, attack: e.state === 'windup' || e.state === 'charging', fly: e.sp === 'glimframe' });
    if (e.shard) e.shard.rotation.y = t * 3;
  }
}
// monsters breathe, flinch when hit and shake when they roar
function livingScale(e, dt, t) {
  let sx = e.base || 1, sy = sx * (1 + Math.sin(t * 2.4 + e.id) * 0.035);
  if (e.hitT > 0) { e.hitT -= dt; const k = e.hitT / 0.25; sy *= 1 - 0.25 * k; sx *= 1 + 0.15 * k; }
  if (e.roarT > 0) { e.roarT -= dt; sy *= 1 + 0.1 * Math.sin(t * 35); }
  e.model.scale.set(sx, sy, sx);
}
// watching a sad Monstermon slowly (without fighting) builds trust
function observe(e, dt, dp) {
  if (e.mood !== 'sad' || !e.catchable || e.kind !== 'mon') return;
  if (dp < 10) tip('observe', `😢 This Monstermon is <b>sad</b>, not angry. You don't have to fight it! <b>Walk slowly</b> close to it (don't run) and just watch it until the <b style="color:#6fe3ff">✦ bar</b> fills up.`, '👀 Gentle catching');
  if (dp > 7) { e.watching = false; return; }
  const fighting = comp && comp.auto && comp.target === e;
  if (P.mode === 'run' || fighting) { e.ready = Math.max(0, e.ready - dt * 0.25); e.watching = false; return; }
  if (P.mode !== 'idle' && P.mode !== 'walk') return;
  const before = e.ready; e.ready = Math.min(1, e.ready + dt * 0.14); e.watching = true;
  if (before < 1 && e.ready >= 1) {
    toast(`💙 ${e.name} trusts you now! Throw the FoldCube with <b>${BTN.cube()}</b>.`, 4500); SFX.chime(1200);
    if (save.side.watch.state === 'active') completeSide('watch');
  }
}

// ====================================================================== FoldCube: bond ring, throw, capture, team of 7
const cubes = [];
let bond = null;
function throwCube() {
  if (bond) return bondPress();
  if (!save.team.length && save.step !== 'capture') return toast('You don’t have a FoldCube yet. Professor Green will give you one.');
  const tgt = currentTarget();
  if (!tgt || tgt.kind !== 'mon' || tgt.boss) return toast('🧊 Throw the FoldCube at a wild Monstermon.');
  if (tgt.ready < 0.99 && tgt.ready >= 0.7 && save.items.strongCube > 0) { save.items.strongCube--; tgt.ready = 1; toast(`💠 You used a Strong FoldCube! (${save.items.strongCube} left)`); startBond(tgt); bond.strong = true; return; }
  if (tgt.ready >= 0.99) startBond(tgt); else launchCube(tgt);
}
function startBond(e) {
  bond = { e, t: 0, dur: 1.8 }; $('bond').classList.remove('hidden'); SFX.tick();
  tip('bond', `🎯 <b>Bond moment!</b> Press <b>${BTN.cube()}</b> again exactly when the <b style="color:#6fe3ff">blue ring</b> touches the <b style="color:#ffd34d">gold ring</b>.`, '🧊 How to catch');
}
const bondScale = () => 2.6 - 2.2 * (bond.t / bond.dur);
function updateBond(dt) {
  if (!bond) return;
  bond.t += dt;
  const e = bond.e, s = bondScale(), p = new THREE.Vector3(e.x, e.y + 1, e.z).project(camera);
  const el = $('bond'); el.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - p.y) / 2 * innerHeight) + 'px';
  $('bondOut').style.width = $('bondOut').style.height = (120 * s) + 'px';
  const close = Math.abs(s - 1) < 0.2 * DIFF().bond * (bond.strong ? 1.4 : 1);
  $('bondLab').innerHTML = close ? `<span style="color:#ffd34d">NOW! Press ${BTN.cube()}!</span>` : `Get ready… (${BTN.cube()})`;
  if (qs.has('auto') && Math.abs(s - 1) < 0.06) bondPress();
  if (bond && bond.t >= bond.dur) bondEnd(false, 'Too late!');
}
function bondPress() { const d = Math.abs(bondScale() - 1), wdw = DIFF().bond * (bond.strong ? 1.4 : 1); if (d < 0.14 * wdw) bondEnd(true, 'PERFECT!'); else if (d < 0.3 * wdw) bondEnd(true, 'Good!'); else bondEnd(false, bondScale() > 1 ? 'Too early!' : 'Too late!'); }
function bondEnd(ok, txt) {
  const e = bond.e; bond = null; $('bond').classList.add('hidden');
  floatText(e.x, e.y + 2.4, e.z, txt, ok ? '#ffd34d' : '#ff5a6a');
  if (ok) launchCube(e);
  else { SFX.fail(); e.ready = 0.7; if (e.kind === 'mon' && e.mood === 'angry') e.state = 'chase'; toast(`😖 ${txt} ${e.name} got scared. Fill the ✦ bar again and retry!`); }
}
function launchCube(tgt) {
  const cube = new THREE.Group();
  for (let i = 0; i < 6; i++) { const f = bx(cube, 0.34, 0.34, 0.04, mat('#bfefff', { e: '#3ad0ff', ei: 0.8, op: 0.9 }), 0, 0, 0); const n = [[0, 0, .17], [0, 0, -.17], [.17, 0, 0], [-.17, 0, 0], [0, .17, 0], [0, -.17, 0]][i]; f.position.set(...n); if (i >= 2 && i < 4) f.rotation.y = Math.PI / 2; if (i >= 4) f.rotation.x = Math.PI / 2; }
  bx(cube, 0.14, 0.14, 0.14, mat('#ffffff', { e: '#9fe8ff', ei: 2 }), 0, 0, 0);
  cube.position.set(P.x, P.y + 1.4, P.z); scene.add(cube);
  cubes.push({ m: cube, from: cube.position.clone(), tgt, t: 0, dur: Math.min(0.9, 0.3 + dist2(P.x, P.z, tgt.x, tgt.z) * 0.04), phase: 'fly' });
  SFX.whoosh();
}
function updateCubes(dt, t) {
  for (let i = cubes.length - 1; i >= 0; i--) {
    const c = cubes[i]; c.t += dt;
    const e = c.tgt;
    if (c.phase === 'fly') {
      const k = Math.min(1, c.t / c.dur), to = new THREE.Vector3(e.x, e.y + 0.8, e.z);
      c.m.position.lerpVectors(c.from, to, k); c.m.position.y += Math.sin(k * Math.PI) * 2.2; c.m.rotation.set(t * 8, t * 6, 0);
      if (k >= 1) {
        if (e.ready >= 0.99 && e.alive) {
          c.phase = 'fold'; c.t = 0; e.capturing = true; SFX.cube(); rumble(0.4, 300); c.panels = [];
          for (let p = 0; p < 6; p++) { const pan = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); scene.add(pan); c.panels.push(pan); }
        } else {
          c.phase = 'back'; c.t = 0; SFX.fail();
          toast(`🧊 ${e.name} isn't ready yet! ${e.mood === 'sad' ? 'Watch it slowly' : 'Weaken it'} until the <b style="color:#6fe3ff">✦</b> bar is full.`);
          if (e.kind === 'mon' && e.mood === 'angry') e.state = 'chase';
        }
      }
    } else if (c.phase === 'fold') {
      const k = Math.min(1, c.t / 1.3), cx = e.x, cy2 = e.y + 0.8, cz = e.z, r = 1.4 * (1 - k * 0.85);
      const dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
      c.panels.forEach((pan, p) => { const [a, b2, d] = dirs[p]; pan.position.set(cx + a * r, cy2 + b2 * r, cz + d * r); pan.lookAt(cx, cy2, cz); pan.scale.setScalar(1 - k * 0.7); });
      e.model.scale.setScalar(Math.max(0.01, 1 - k)); e.model.rotation.y += dt * 8;
      c.m.position.set(cx, cy2 + 1.2 * (1 - k), cz);
      if (k >= 1) { c.panels.forEach((p) => scene.remove(p)); e.alive = false; removeEnemy(e); c.phase = 'back'; c.t = 0; onCaught(e); }
    } else {
      const k = Math.min(1, c.t / 0.5); c.m.position.lerp(new THREE.Vector3(P.x, P.y + 1.2, P.z), k); if (k >= 1) { scene.remove(c.m); cubes.splice(i, 1); }
    }
  }
}
function onCaught(e) {
  coopCaught(e);
  const mem = newMember(e.sp); markCaught(e.sp); stat('catches'); if (WX.type === 'rain') stat('rainCatches'); if (WX.type === 'snow') stat('snowCatches');
  if (save.team.length < 7) { save.team.push(mem); toast(`🧊✨ CAUGHT! <b>${SPECIES[e.sp].name}</b> is in your team now (${save.team.length}/7).`, 5000); }
  else { save.garden.push(mem); rebuildGarden(); toast(`🧊✨ You caught <b>${SPECIES[e.sp].name}</b>! Your team is full (7), so it went to Professor Green's garden.`, 5000); }
  SFX.win(); spark(P.x, P.y + 1.5, P.z, '#9fe8ff', 30); lightPillar(e.x, e.y, e.z, '#6fe3ff');
  if (!comp) { save.active = 0; spawnCompanion(save.team[0]); }
  giveXP(35);
  if (save.team.length >= 2) tip('team', `👥 You have <b>${save.team.length}</b> Monstermon now! Press <b>${BTN.team()}</b> to choose who fights. Up to <b>7</b> travel with you; the rest live in Professor Green's garden.`, '👥 Your team');
  persist(); renderComp();
  if (e.sp === 'skipclip' && save.step === 'capture') story('afterCapture');
  if (!e.night) setTimeout(respawnWild, 45000);
}

// ====================================================================== effects: sparks, smoke, rings, floating text
const fx = [];
function spark(x, y, z, color, n = 10) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color })); m.position.set(x, y, z); scene.add(m); fx.push({ m, v: new THREE.Vector3(rand(-4, 4), rand(2, 6), rand(-4, 4)), t: rand(0.4, 0.8) }); }
}
function smoke(x, y, z, n = 3) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), new THREE.MeshBasicMaterial({ color: '#8a8a90', transparent: true, opacity: 0.6, depthWrite: false })); m.position.set(x + rand(-0.4, 0.4), y, z + rand(-0.4, 0.4)); m.rotation.set(rand(0, 3), rand(0, 3), 0); scene.add(m); fx.push({ m, smoke: true, v: new THREE.Vector3(rand(-0.5, 0.5), rand(1, 2), rand(-0.5, 0.5)), t: 0.9, max: 0.9 }); }
}
function ring(x, z, r, color) { const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.9, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, terrainHeight(x, z) + 0.15, z); scene.add(m); fx.push({ m, ring: true, t: 0.45, max: 0.45 }); }
const floats = [];
function floatText(x, y, z, text, color) { const el = document.createElement('div'); el.className = 'lbl'; el.style.color = color; el.style.fontSize = '16px'; el.textContent = text; $('labels').appendChild(el); floats.push({ el, p: new THREE.Vector3(x, y, z), t: 1.1 }); }
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.t -= dt;
    if (f.ring) { f.m.scale.setScalar(1 + (1 - f.t / f.max) * 0.6); f.m.material.opacity = f.t / f.max; }
    else if (f.fade) { f.m.material.opacity = f.t / f.max; if (f.grow) f.m.scale.y = 1 + (1 - f.t / f.max); }
    else if (f.smoke) { f.m.position.addScaledVector(f.v, dt); f.m.scale.setScalar(1 + (1 - f.t / f.max) * 1.5); f.m.material.opacity = 0.6 * f.t / f.max; }
    else { f.v.y -= 14 * dt; f.m.position.addScaledVector(f.v, dt); }
    if (f.t <= 0) { scene.remove(f.m); fx.splice(i, 1); }
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.t -= dt; f.p.y += dt * 1.2;
    const s = f.p.clone().project(camera);
    if (s.z > 1 || f.t <= 0) { if (f.t <= 0) { f.el.remove(); floats.splice(i, 1); } else f.el.style.display = 'none'; continue; }
    f.el.style.display = ''; f.el.style.left = ((s.x + 1) / 2 * innerWidth) + 'px'; f.el.style.top = ((1 - s.y) / 2 * innerHeight) + 'px'; f.el.style.opacity = Math.min(1, f.t * 2);
  }
}

// ====================================================================== the lake (Kraku and Valeza) and Baba
const LAKE = { x: SPOTS.lake[0], z: SPOTS.lake[1], r: 9.5 };
const kraku = new THREE.Group(); bx(kraku, 1.3, 1.1, 1.1, '#4a1a80', 0, 0.55, 0); bx(kraku, 1.0, 0.5, 0.9, '#6a2ab0', 0, 1.3, 0);
{ const fp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.95), new THREE.MeshBasicMaterial({ map: faceTex('angry', 'eyes', '#ff2a14'), transparent: true })); fp.position.set(0, 0.7, 0.56); kraku.add(fp); }
for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 5), mat('#1a0a2a')); h.position.set(s * 0.35, 1.75, 0); h.rotation.z = -s * 0.4; kraku.add(h); }
kraku.userData.t = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, p = new THREE.Group(); p.position.set(Math.cos(a) * 0.45, 0.05, Math.sin(a) * 0.45); kraku.add(p); bx(p, 0.18, 0.8, 0.18, '#3a0a6a', 0, -0.4, 0); kraku.userData.t.push(p); }
scene.add(kraku);
const valeza = new THREE.Group(); bx(valeza, 1, 0.8, 1.3, '#3fd6c8', 0, 0.4, 0); bx(valeza, 0.7, 0.3, 1, '#e8fffb', 0, 0.12, 0.05); valeza.userData.tail = bx(valeza, 0.8, 0.5, 0.12, '#2fb3a8', 0, 0.45, -0.75);
{ const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: faceTex('happy', 'water'), transparent: true })); fp.position.set(0, 0.45, 0.66); valeza.add(fp); }
scene.add(valeza);
const K = { a: 0, chase: 0 }; let swimBoost = 0; let valA = 2.5;
function updateLake(dt, t) {
  valA += dt * 0.35; valeza.position.set(LAKE.x + Math.cos(valA) * 6, WATER - 0.25 + Math.sin(t * 2) * 0.08, LAKE.z + Math.sin(valA) * 6); valeza.rotation.y = -valA; valeza.userData.tail.rotation.y = Math.sin(t * 6) * 0.5;
  const swimming = P.mode === 'swim', dk = dist2(kraku.position.x, kraku.position.z, P.x, P.z);
  K.chase = swimming && dk < 8 && POWER.t <= 0 ? 1 : 0;
  if (K.chase) {
    const dx = P.x - kraku.position.x, dz2 = P.z - kraku.position.z, d = Math.hypot(dx, dz2) || 1; kraku.position.x += dx / d * dt * 2.4; kraku.position.z += dz2 / d * dt * 2.4; kraku.rotation.y = Math.atan2(dx, dz2);
    if (d < 1.4) { hurtPlayer(25); const ax = P.x - LAKE.x, az = P.z - LAKE.z, al = Math.hypot(ax, az) || 1; P.x = LAKE.x + ax / al * (LAKE.r + 2.5); P.z = LAKE.z + az / al * (LAKE.r + 2.5); P.y = height(P.x, P.z) + 2; toast('😠 Kraku threw you out of the lake!'); rumble(1, 450); roar(0.7); }
  } else { K.a += dt * 0.5; kraku.position.x += (LAKE.x + Math.cos(K.a) * 3 - kraku.position.x) * dt; kraku.position.z += (LAKE.z + Math.sin(K.a) * 3 - kraku.position.z) * dt; kraku.rotation.y = -K.a; }
  kraku.position.y = WATER - 0.55 + Math.sin(t * 2.5) * 0.12; kraku.userData.t.forEach((p, i) => p.rotation.x = Math.sin(t * 5 + i) * 0.5);
  if (swimBoost > 0) swimBoost -= dt;
}
// Baba: comes running when you are losing, sometimes visits with rewards
function makeUncle() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const legs = [], arms = [];
  for (const s of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(s * 0.32, 1, 0); body.add(hip); bx(hip, 0.5, 0.9, 0.55, '#1f2128', 0, -0.45, 0); bx(hip, 0.56, 0.22, 0.75, '#0b0b0e', 0, -0.95, 0.1); legs.push(hip); }
  bx(body, 1.5, 1.2, 0.95, '#1f2128', 0, 1.6, 0); bx(body, 0.14, 0.9, 0.02, '#0b0b0e', 0, 1.6, 0.49);
  for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * 0.95, 2.05, 0); body.add(sh); bx(sh, 0.6, 1.1, 0.65, '#1f2128', 0, -0.5, 0); bx(sh, 0.45, 0.35, 0.5, '#8a5a3c', 0, -1.15, 0.05); arms.push(sh); }
  const head = new THREE.Group(); head.position.y = 2.55; body.add(head);
  bx(head, 0.75, 0.75, 0.7, '#8a5a3c', 0, 0.1, 0); bx(head, 0.78, 0.7, 0.3, '#2b1a10', 0, -0.38, 0.28); bx(head, 0.5, 0.3, 0.2, '#2b1a10', 0, -0.78, 0.3);
  for (const s of [-1, 1]) bx(head, 0.28, 0.2, 0.04, mat('#0b1a3a', { m: 0.6, r: 0.15 }), s * 0.18, 0.18, 0.37);
  g.userData = { legs, arms, body }; g.visible = false; return g;
}
const uncle = makeUncle(); scene.add(uncle);
const D = { state: 'away', timer: 100, x: 0, z: 0, tx: 0, tz: 0, reason: '', stay: 0 };
const POWER = { t: 0 };
function updateUncle(dt, t) {
  if (POWER.t > 0) POWER.t -= dt;
  if (state !== 'play') return;
  if (D.state === 'away') {
    D.timer -= dt;
    if (P.hp <= P.maxHp * DIFF().rescue || (comp && comp.m.hp < comp.m.maxHp * 0.15 && save.team.every((m) => m === comp.m || m.hp <= 0))) uncleSpawn('rescue');
    else if (D.timer <= 0 && save.team.length) uncleSpawn('visit');
    return;
  }
  if (D.reason === 'rescue' && D.state === 'coming') { D.tx = P.x; D.tz = P.z; }
  const dx = D.tx - D.x, dz2 = D.tz - D.z, dl = Math.hypot(dx, dz2); let moving = false;
  if (D.state === 'coming' || D.state === 'leaving') {
    const sp = D.state === 'leaving' ? 9 : D.reason === 'rescue' ? 11 : 5;
    if (dl > (D.reason === 'rescue' && D.state === 'coming' ? 1.8 : 0.3)) { D.x += dx / dl * sp * dt; D.z += dz2 / dl * sp * dt; moving = true; uncle.rotation.y = Math.atan2(dx, dz2); }
    else if (D.state === 'coming') { if (D.reason === 'rescue') babaStart(); else { D.state = 'waiting'; D.stay = 30; } }
    else { uncle.visible = false; D.state = 'away'; D.timer = 110 + Math.random() * 60; }
  }
  if (D.state === 'busy') return;
  if (D.state === 'waiting') { D.stay -= dt; uncle.rotation.y = Math.atan2(P.x - D.x, P.z - D.z); if (D.stay <= 0) uncleLeave(); }
  if (D.state === 'helping') { D.stay -= dt; if (D.stay <= 0) uncleLeave(); }
  uncle.position.set(D.x, Math.max(height(D.x, D.z), WATER - 0.3), D.z); uncle.scale.setScalar(0.9);
  const u = uncle.userData, ph = Math.sin(t * (moving ? 13 : 3));
  u.legs[0].rotation.x = moving ? ph * 0.8 : 0; u.legs[1].rotation.x = moving ? -ph * 0.8 : 0;
  if (D.state === 'helping') u.arms.forEach((a) => a.rotation.x = -2.8); else if (D.state === 'waiting') { u.arms[0].rotation.x = -2.6 + Math.sin(t * 6) * 0.4; u.arms[1].rotation.x = 0; } else { u.arms[0].rotation.x = -ph * 0.8; u.arms[1].rotation.x = ph * 0.8; }
  u.body.position.y = moving ? Math.abs(ph) * 0.12 : 0; u.body.rotation.x = moving ? 0.18 : 0;
}
function uncleSpawn(reason) {
  for (let k = 0; k < 20; k++) { const a = Math.random() * 6.28, x = P.x + Math.cos(a) * 18, z = P.z + Math.sin(a) * 18; if (Math.abs(x) < HALF - 10 && Math.abs(z) < HALF - 10 && height(x, z) > WATER + 0.3 && height(x, z) < 6) { D.x = x; D.z = z; break; } }
  D.reason = reason; D.state = 'coming'; uncle.visible = true;
  if (reason === 'rescue') { D.tx = P.x; D.tz = P.z; toast('💪 BABA is running to help you!'); rumble(0.5, 250); }
  else { const a = Math.random() * 6.28; D.tx = D.x + Math.cos(a) * 4; D.tz = D.z + Math.sin(a) * 4; toast(`💪 Baba appeared in the forest! Find him and press ${BTN.talk()} for a reward.`); }
  tip('uncle', `💪 <b>Baba</b> is a big, strong friend. He comes running when you are almost out of health, and sometimes visits with <b>rewards</b>. Look for the 💚 dot on the map!`, '💪 Baba');
}
function uncleHelp(reward) {
  P.hp = P.maxHp; POWER.t = 20; save.team.forEach((m) => m.hp = Math.max(m.hp, m.maxHp * 0.6)); ULT.v = 100;
  if (comp && comp.m.hp <= 0) spawnCompanion(comp.m);
  if (reward) { stat('hugs'); const c = 25 + Math.floor(Math.random() * 26); save.coins += c; toast(`💪 Baba: "Here are ${c} 🪙, your team is healed, your ultimate is full, and you get BABA POWER!"`, 5000); }
  else toast('💪 Baba: "Never give up! Full health, team healed and your ultimate is ready!"', 5000);
  tip('power', `💪 <b>Baba Power</b> lasts 20 seconds: you run faster, jump higher and Kraku is too scared to chase you.`);
  rumble(1, 600); D.state = 'helping'; D.stay = 1.6; renderComp(); renderStats(); persist();
}
function uncleLeave() { showBubble('I LOVE YOU BABA ❤️'); SFX.chime(880); D.state = 'leaving'; const a = Math.atan2(D.z - P.z, D.x - P.x); D.tx = Math.max(-HALF + 8, Math.min(HALF - 8, D.x + Math.cos(a) * 25)); D.tz = Math.max(-HALF + 8, Math.min(HALF - 8, D.z + Math.sin(a) * 25)); }

// ====================================================================== the story
let boss = null, cage = null, pylons = [], trapped = null;
const SPAWNS = [['bellbud', -10, 30], ['mossroll', 18, 26], ['emberlid', 26, 36], ['glimframe', -26, 30], ['rivolo', -30, 12], ['bellbud', 30, 12], ['mossroll', -18, 18], ['skipclip', 12, 32]];
const MOUNTAIN_SPAWNS = [['hingemaw', -8, -44], ['paperfang', 8, -46], ['paperfang', -14, -38], ['hingemaw', 14, -36], ['glimframe', 0, -30], ['emberlid', -22, -28], ['rootlock', 20, -48]];
const MAIN_STEPS = ['arrive', 'intro', 'choose', 'mission1', 'free', 'capture', 'boss', 'mountain', 'explore', 'city', 'seals', 'dragon', 'ch2done'];
const reached = (s) => MAIN_STEPS.indexOf(save.step) >= MAIN_STEPS.indexOf(s);
function respawnWild() {
  if (reached('boss') && Math.random() < 0.1) { const sp = STARTERS[Math.floor(Math.random() * 3)], a = rand(0, 6.28), x = Math.cos(a) * 40, z = -20 + Math.sin(a) * 25; if (height(x, z) > WATER + 0.3) { makeEnemy(sp, x, z, { mood: 'sad', xp: 60 }); return; } }
  const list = reached('mountain') && Math.random() < 0.4 ? MOUNTAIN_SPAWNS : SPAWNS;
  const [sp, x, z] = list[Math.floor(Math.random() * list.length)];
  if (enemies.filter((e) => e.kind === 'mon' && e.alive).length > 14) return;
  if (enemies.some((e) => dist2(e.x, e.z, x, z) < 4) || dist2(P.x, P.z, x, z) < 12) return;
  const mtn = list === MOUNTAIN_SPAWNS;
  makeEnemy(sp, x + rand(-3, 3), z + rand(-3, 3), { corrupted: Math.random() < 0.4, atkMul: mtn ? 1.0 : 0.8, xp: mtn ? 70 : 45 });
}
function spawnMountain() {
  if (spawnMountain.done) return; spawnMountain.done = true;
  for (const [sp, x, z] of MOUNTAIN_SPAWNS) makeEnemy(sp, x, z, { corrupted: true, atkMul: 1.0, mood: sp === 'paperfang' || sp === 'hingemaw' ? 'angry' : undefined, xp: 70 });
}
function story(ev) {
  if (STORY2[ev]) return STORY2[ev]();
  const N = save.name || 'adventurer';
  if (ev === 'start') {
    if (save.step === 'arrive') {
      setBeacon(SPOTS.green[0], SPOTS.green[1]);
      say([['📍 Rootlight', `Welcome to the village of <b>Rootlight</b>, ${N}! The forest of Virelia begins right here.`], ['📍 Rootlight', 'Professor Green is waiting for you at his lab, inside the roots of the giant tree. Follow the yellow light!']],
        () => tip('controls', `Move with <b>${BTN.move()}</b>, run with <b>${BTN.run()}</b>, jump with <b>${BTN.jump()}</b>. Drag the mouse (or use the right stick) to turn the camera.<br>🗺️ The <b>map</b> is bottom-right: the ⭐ shows where to go next. Press <b>${BTN.pause()}</b> to pause.`, '🎮 How to play', 11000));
    } else afterLoad();
    return;
  }
  if (ev === 'meetGreen') {
    save.step = 'intro'; setBeacon(null);
    const [d, m, p] = showcase;
    say([
      ['Professor Green', `Ah, ${N}! I'm glad you came. This forest is alive: when the <b>Pulse</b> touches objects full of memories, they wake up and become <b>Monstermon</b>.`],
      ['Professor Green', 'These three are ready to travel with someone… Look!', () => { d.userData.st = { attack: true }; roar(1.1); }],
      ['Dracometal', '<i>Its chain catches a falling jar in mid-air. Then Dracometal glares at the professor:</i> <b>TICK-TOCK!</b>', () => { SFX.tick(); setTimeout(SFX.tick, 200); }],
      ['Metasteal', '<i>It crosses its bladed legs into an X, flies after a map the wind blew away… and lands a bit crooked on the table.</i>', () => { d.userData.st = {}; m.userData.st = { fly: true }; }],
      ['Pinkypunch', '<i>It tries to help by pushing a cart… pushes it way too far… then celebrates like it just won a championship!</i> 🥊', () => { m.userData.st = {}; p.userData.st = { celebrate: true, attack: true }; }],
      ['Professor Green', '“Each of them will take you far. Just in their own way.” Try them out in the yard and choose your companion.', () => { p.userData.st = {}; }],
    ], () => { save.step = 'choose'; openChoose(); });
    return;
  }
  if (ev === 'chosen') {
    showcase.forEach((s) => s.visible = s.userData.sp !== activeMember().sp);
    nira.visible = true;
    say([
      ['Professor Green', `${SPECIES[activeMember().sp].name}! Great choice. And here is your <b>FoldCube</b>: six faces for your reserves and a center for your active companion.`],
      ['Professor Green', 'Your first mission sounds simple: a path near the village <b>vanished from the map</b>, close to the root bridge in the north. Go and see what is happening.'],
      ['Professor Green', `In battle, you give the orders: <b>${BTN.attack()}</b> attack, <b>${BTN.skill1()}</b>/<b>${BTN.skill2()}</b> skills, <b>${BTN.ult()}</b> ultimate. Roll away with <b>${BTN.dodge()}</b> when you see a red circle!`],
    ], () => {
      save.step = 'mission1'; setBeacon(0, 16); persist();
      tip('nira', `🟣 <b>Nira</b> is waiting at the <b>camp</b> ⛺ (west of the village) with side quests. Look for the purple dot on the map!`, '🟣 Side quests');
    });
    return;
  }
  if (ev === 'bridgeFold') {
    save.step = 'free'; setBeacon(null);
    foldBridge();
    rumble(1, 700); SFX.big(); roar(0.5, true);
    trapped = makeEnemy('skipclip', SPOTS.cage[0], SPOTS.cage[1], { mood: 'sad', catchable: true });
    trapped.state = 'trapped'; trapped.kind = 'hidden';
    cage = makeObject('cage', SPOTS.cage[0], SPOTS.cage[1], 45, 'Roots');
    setTimeout(() => say([
      ['❗', 'The root bridge <b>folded over itself like paper</b>! The way across the river is cut off.'],
      ['❗', 'A small creature is stuck between the roots: <b>Skipclip</b>! It looks scared.'],
      [SPECIES[activeMember().sp].name, `<i>${SPECIES[activeMember().sp].name} looks at you, ready for action.</i> Give the order: press <b>${BTN.attack()}</b> at the roots to free it!`],
    ]), 900);
    return;
  }
  if (ev === 'cageBroken') {
    save.step = 'capture';
    trapped.kind = 'mon'; trapped.ready = 1; trapped.state = 'idle'; trapped.mood = 'sad';
    say([['Skipclip', '<i>Skipclip jumps out, shaking a little… then comes closer, curious. Its trust bar</i> <b style="color:#6fe3ff">✦</b> <i>is full!</i>'],
      ['Professor Green (radio)', `This is the bond moment! Press <b>${BTN.cube()}</b>, then press it <b>again</b> when the blue ring touches the gold ring.`]]);
    return;
  }
  if (ev === 'afterCapture') {
    save.step = 'boss';
    say([['📍 The horizon', 'Look north: a piece of the mountain is perfectly flat… <b>as if someone cut it with a ruler</b>. Something is folding the forest.'],
      ['❗', 'The roots under the bridge are moving… A huge <b>Rootlock</b> is chained to the bridge root! A <b>cube fragment</b> forces it to squeeze whenever someone comes close.'],
      ['Professor Green (radio)', `Careful! Two <b>fold pylons</b> give it a shield. Destroy them with <b>${BTN.attack()}</b>, dodge the roots, and hit the fragment when Rootlock gets stuck!`]],
      () => startBoss());
    return;
  }
  if (ev === 'end') {
    save.step = 'mountain'; save.bossState = null; persist();
    SFX.win();
    say([['Rootlock', '<i>The fragment shatters. Rootlock takes a deep breath… and holds the bridge root all by itself.</i>'],
      ['❗', '<b>The bridge unfolds!</b> The road to the north is open again.', () => unfoldBridge()],
      ['Professor Green (radio)', `Amazing, ${N}! But this was only the beginning. Someone is using cube technology to fold the forest…`],
      ['Professor Green (radio)', `Cross the bridge and head to <b>${PLACE.mountain}</b> in the far north. Be careful: stronger monsters live there.`]],
      () => { setBeacon(GATE[0], GATE[1] + 4); spawnMountain(); tip('mountain', `⛰️ New area unlocked: <b>${PLACE.mountain}</b>! Follow the ⭐ on the map. Hingemaw and Paperfang live there: they are <b>strong</b>, so level up your team first if you need to.`, '⛰️ New area'); });
    return;
  }
  if (ev === 'gate') {
    save.step = 'explore'; setBeacon(null); persist();
    roar(0.45, true); rumble(1, 900);
    say([['❗', 'A giant <b>cube</b> is built into the mountain. Its seams glow blue, like the fragment inside Rootlock.'],
      ['❗', 'Strange folded symbols cover the stone… and from deep inside, a voice echoes:'],
      ['???', '<i>"Whoever opens this gate… will fold the whole forest…"</i>'],
      ['Professor Green (radio)', `${N}, come back to the lab soon, we need to study this. You did incredibly well today!`],
      ['🌲 Wildfold', '<b>End of Chapter 1!</b> The gate has a glowing <b>lift</b> in front of it. Step on it and press E to go up to the top of the mountain and start <b>Chapter 2</b>.']], () => { setBeacon(LIFT_LOW[0], LIFT_LOW[1]); tip('lift', `🔷 Stand on the glowing <b>lift</b> in front of the gate and press <b>${BTN.talk()}</b> to go up to the mountain top.`, '📜 Chapter 2'); });
  }
}
function afterLoad() {
  // continuing an existing save: place things according to the saved step
  if (['arrive', 'intro', 'choose'].includes(save.step)) { save.step = 'arrive'; setBeacon(SPOTS.green[0], SPOTS.green[1]); return; }
  nira.visible = true;
  showcase.forEach((s) => s.visible = !save.team.some((m) => m.sp === s.userData.sp));
  if (save.team.length) spawnCompanion(save.team[save.active] || save.team[0]);
  if (['free', 'capture'].includes(save.step)) save.step = 'mission1';
  if (save.step === 'mission1') setBeacon(0, 16);
  if (save.step === 'boss') {
    foldBridge(true); startBoss();
    const bs = save.bossState;
    if (bs) { boss.hp = bs.hp; pylons.forEach((p, i) => { if (bs.pylons && !bs.pylons[i]) { p.alive = false; p.hp = 0; p.model.userData.core.material = mat('#333', {}); } }); boss.shield = pylons.some((p) => p.alive); if (bs.phase2) enterPhase2(boss, true); toast('💾 Your boss fight was saved. Keep going!'); }
  }
  if (save.step === 'mountain') { setBeacon(GATE[0], GATE[1] + 4); spawnMountain(); }
  if (reached('explore')) spawnMountain();
  if (save.step === 'explore') setBeacon(LIFT_LOW[0], LIFT_LOW[1]);
  if (reached('city')) spawnCity();
  if (save.step === 'city') save.step = 'seals';
  if (save.step === 'seals') startSeals();
  if (save.step === 'dragon') startDragon();
}
function onCageBroken() { story('cageBroken'); }
function foldBridge(instant) { WORLD.bridgeState = 0; WORLD.bridgeFold = instant ? 1 : 0.0001; }
function unfoldBridge() { WORLD.bridgeState = 0.5; WORLD.bridgeUnfold = 1; }
function updateBridge(dt) {
  const planks = WORLD.bridgePlanks;
  if (WORLD.bridgeFold > 0 && WORLD.bridgeFold < 1) WORLD.bridgeFold = Math.min(1, WORLD.bridgeFold + dt * 0.8);
  if (WORLD.bridgeUnfold > 0) { WORLD.bridgeUnfold = Math.max(0, WORLD.bridgeUnfold - dt * 0.6); if (WORLD.bridgeUnfold === 0) { WORLD.bridgeState = 1; WORLD.bridgeFold = 0; } }
  const k = WORLD.bridgeUnfold > 0 ? WORLD.bridgeUnfold : (WORLD.bridgeFold || 0);
  planks.forEach((p, i) => { p.rotation.x = (i % 2 ? 1 : -1) * k * 1.4; p.position.y = 0.35 + k * (i % 2 ? 1.6 : 0.6); p.position.z = -8 + i * 2 * (1 - k * 0.55); });
}
function startBoss() {
  if (boss) return;
  boss = makeEnemy('rootlock', SPOTS.rootlock[0], SPOTS.rootlock[1], { boss: true, big: true, mood: 'angry', hp: 520, atkMul: 1.6, corrupted: true, catchable: false, name: 'Rootlock, the Bridge Guard' });
  boss.state = 'wake'; boss.shield = true; boss.atkT = 2.5;
  pylons = [makeObject('pylon', ...SPOTS.pylonA, 60, 'Fold pylon'), makeObject('pylon', ...SPOTS.pylonB, 60, 'Fold pylon')];
  setBeacon(SPOTS.rootlock[0], SPOTS.rootlock[1]);
}
function onPylon() {
  if (boss && pylons.every((p) => !p.alive)) { boss.shield = false; toast('⚡ Both pylons are down! Rootlock’s shield is gone. Hit the fragment when it gets stuck!', 4500); }
  else toast('⚡ One pylon is down! One more to go.');
}
function enterPhase2(e, silent) {
  e.phase2 = true;
  e.redLight = new THREE.PointLight(0xff2a1a, 4, 14); e.redLight.position.set(0, 3, 2.5); e.model.add(e.redLight);
  if (silent) return;
  roar(0.45, true); rumble(1, 900); e.roarT = 1.4; e.atkT = 1.8;
  toast(`😡 <b>${e.short || 'Rootlock'} is ENRAGED!</b> Phase 2: ${e.short ? 'paper blades' : 'roots'} will burst out of the ground!`, 5000);
  tip('phase2', `😡 <b>Phase 2!</b> Rootlock attacks faster and roots burst from the ground in many red circles at once. Keep moving and roll (<b>${BTN.dodge()}</b>). It still gets <b>stuck</b> after each attack: that's your chance!`, '😡 Boss phase 2');
}
function updateBoss(e, dt, t) {
  const dp = dist2(e.x, e.z, P.x, P.z);
  e.model.position.set(e.x, e.y, e.z);
  livingScale(e, dt, t);
  if (e.redLight) e.redLight.intensity = 3 + Math.sin(t * 8) * 1.5;
  if (e.state === 'wake') { if (dp < 18) { e.state = 'fight'; BOSSHIT.v = false; e.roarT = 1.2; cinematic(e, e.sp === 'foldragon' ? 'FOLDRAGON' : 'ROOTLOCK', e.sp === 'foldragon' ? 'THE PAPER DRAGON OF THE FOLDED CITY' : 'THE BRIDGE GUARD'); } e.model.userData.anim(t, {}); return; }
  if (!e.phase2 && !e.shield && e.hp < e.max * 0.5) enterPhase2(e);
  if (e.slowT > 0) e.slowT -= dt;
  e.atkT -= dt * (e.slowT > 0 ? 0.4 : 1);
  if (e.stuckIn > 0) { e.stuckIn -= dt; if (e.stuckIn <= 0 && e.alive) { e.state = 'stuck'; e.stuckT = e.phase2 ? 2.6 : 3.2; toast(e.shield ? '🌀 Rootlock is stuck, but the shield protects it. Destroy the pylons!' : `✨ ${e.short || 'Rootlock'} is STUCK! The FRAGMENT is exposed: hit it now!`); } }
  if (e.state === 'stuck') { e.stuckT -= dt; if (e.shard) e.shard.scale.setScalar(1.6 + Math.sin(t * 10) * 0.3); if (e.stuckT <= 0) { e.state = 'fight'; if (e.shard) e.shard.scale.setScalar(1); } }
  else if (e.atkT <= 0 && dp < 28 && !(e.stuckIn > 0)) {
    // root slam: three telegraphed circles toward the player, then it gets stuck and exposes the fragment
    e.atkT = e.shield ? 4.2 : e.phase2 ? 3.6 : 5;
    const nm = nightMul(), ang = Math.atan2(P.x - e.x, P.z - e.z);
    for (let k = 1; k <= 3; k++) { const x = e.x + Math.sin(ang) * k * 3.2, z = e.z + Math.cos(ang) * k * 3.2; telegraph(x, z, 2.2, 1.0 + k * 0.15, RED, (who) => who === 'player' ? hurtPlayer(22 * nm) : hurtComp(28 * nm), { hint: e.atkHint || '🌳 Roots are coming! Get out of the red circles!' }); }
    telegraph(P.x, P.z, 2.4, 1.35, RED, (who) => who === 'player' ? hurtPlayer(18 * nm) : hurtComp(22 * nm), { hint: '🌳 A root is about to burst under you! Move!' });
    if (e.phase2) for (let k = 0; k < 4; k++) { const a = rand(0, 6.28), r = rand(2.5, 6.5), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; telegraph(x, z, 1.8, rand(1.2, 1.9), RED, (who) => who === 'player' ? hurtPlayer(16 * nm) : hurtComp(18 * nm), { hint: '🌳 Roots are bursting everywhere! Keep moving!', end: (x2, z2) => smoke(x2, terrainHeight(x2, z2) + 0.5, z2, 3) }); }
    e.stuckIn = 1.5 * DIFF().tele;
  }
  e.yaw = Math.atan2(P.x - e.x, P.z - e.z); e.model.rotation.y += ((e.yaw - e.model.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * 0.05;
  e.model.userData.anim(t, { attack: e.atkT < 1.2 && e.state !== 'stuck', moving: false });
  if (e.shard) e.shard.rotation.y = t * 3;
}
function onBossDefeated(e) {
  e.alive = false; e.hp = 0;
  spark(e.x, e.y + 3, e.z, '#3ad0ff', 40); smoke(e.x, e.y + 2, e.z, 10); if (e.shard) { e.model.remove(e.shard); e.shard = null; }
  scene.remove(e.model);
  if (e.sp === 'rootlock') { const freed = buildMon('rootlock', 'happy', { big: true }); freed.position.set(e.x, e.y, e.z + 1.5); freed.rotation.y = Math.PI; scene.add(freed); save.stats.rootlock = 1; }
  if (!BOSSHIT.v) { save.stats.noHitBoss = 1; toast('🛡️ You beat the boss without getting hit once!'); }
  boss = null; rumble(1, 800); checkMedals(); slowmo(0.25, 1.2); shake(0.7, 1);
  save.coins += e.sp === 'foldragon' ? 250 : 100; renderStats(); giveXP(e.sp === 'foldragon' ? 300 : 160);
  if (e.sp === 'foldragon') { boss2 = null; story('dragonDown'); } else story('end');
}

// ====================================================================== side quests (Nira) and villagers
function completeSide(key) {
  const q = save.side[key]; if (q.state === 'done') return; q.state = 'done';
  const reward = key === 'songs' ? [60, 80] : [50, 60];
  save.coins += reward[0]; giveXP(reward[1]); SFX.win();
  toast(`🟣 Side quest complete! +${reward[0]} 🪙 and +${reward[1]} XP. Go tell Nira at the camp!`, 5000);
  persist();
}
function talkNira() {
  const s = save.side;
  if (s.songs.state === 'none') {
    say([['Nira', `Hi, ${save.name}! I'm Nira. I record the songs of the forest… but the singing mushrooms are going quiet.`],
      ['Nira', 'Could you find <b>5 different singing mushrooms</b> and listen to them? Just walk close to one and it will open and sing.']],
      () => { s.songs.state = 'active'; tip('songs', '🍄 Side quest: walk close to <b>5 different glowing mushrooms</b>. They open and sing when you are near. Your progress is in the quest list above the map.', '🟣 Nira’s quest'); persist(); });
  } else if (s.songs.state === 'active') say([['Nira', `You heard <b>${s.songs.heard.length}/5</b> songs so far. Keep listening!`]]);
  else if (s.watch.state === 'none') {
    say([['Nira', 'You found all the songs! They sound so beautiful. Thank you!'],
      ['Nira', 'Here is something I learned: some Monstermon are <b>sad</b>, not angry. If you <b>walk slowly</b> near one and just watch it, it may start to trust you.'],
      ['Nira', 'Try it: <b>calm a sad Monstermon without fighting</b>. Come back and tell me!']],
      () => { s.watch.state = 'active'; persist(); });
  } else if (s.watch.state === 'active') say([['Nira', 'Find a Monstermon with the 😢 face. Walk (don’t run!) close to it and wait until the ✦ bar is full.']]);
  else say([['Nira', ['The mountain gate scares me a little… but I want to hear what songs live up there.', 'You are a real forest friend now!', 'Did you know? Monstermon eyes glow brighter at night.'][Math.floor(Math.random() * 3)]]]);
}

// ====================================================================== starter choice (with a short try-out)
const choosePreviews = [];
function openChoose() {
  $('choose').classList.remove('hidden');
  $('cards').innerHTML = STARTERS.map((sp) => { const d = SPECIES[sp]; return `<div class="scard" data-sp="${sp}"><canvas width="300" height="170"></canvas><b>${d.name}</b><div class="role">${d.role}</div><p>${d.about}</p><ul>${d.skills.slice(1).map((s, i) => `<li><b>${s.name}</b>${i === 2 ? ' (ultimate)' : ''}: ${s.desc || ''}</li>`).join('')}</ul><div class="row" style="margin-top:6px"><button class="btn" data-try="${sp}">🎯 Try it</button><button class="btn blue" data-pick="${sp}">✔ Choose</button></div></div>`; }).join('');
  choosePreviews.length = 0;
  document.querySelectorAll('.scard').forEach((c) => {
    const sp = c.dataset.sp, sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xdff2ff, 0x334455, 1.3)); const l = new THREE.DirectionalLight(0xffffff, 2); l.position.set(3, 5, 4); sc.add(l);
    const m = buildMon(sp, 'happy'); sc.add(m); m.userData.anim(0, {});
    const box = new THREE.Box3().setFromObject(m), sz = box.getSize(new THREE.Vector3()), ct = box.getCenter(new THREE.Vector3());
    const cm = new THREE.PerspectiveCamera(35, 300 / 170, 0.1, 50); cm.position.set(0, ct.y + 0.2, Math.max(sz.x, sz.y) * 2.4 + 1); cm.lookAt(0, ct.y, 0);
    choosePreviews.push({ sc, cm, m, cv: c.querySelector('canvas') });
  });
  document.querySelectorAll('[data-try]').forEach((b) => b.onclick = () => tryStarter(b.dataset.try));
  document.querySelectorAll('[data-pick]').forEach((b) => b.onclick = () => pickStarter(b.dataset.pick));
}
const previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); previewRenderer.setSize(300, 170); previewRenderer.outputColorSpace = THREE.SRGBColorSpace;
function renderPreviews(t) {
  if ($('choose').classList.contains('hidden')) return;
  for (const p of choosePreviews) { p.m.rotation.y = Math.sin(t * 0.8) * 0.7; p.m.userData.anim(t, { moving: false }); previewRenderer.render(p.sc, p.cm); const c = p.cv.getContext('2d'); c.clearRect(0, 0, 300, 170); c.drawImage(previewRenderer.domElement, 0, 0); }
}
let trialDummy = null;
function tryStarter(sp) {
  $('choose').classList.add('hidden');
  spawnCompanion(newMember(sp), true);
  const tgt = makeObject('cage', dummy.position.x, dummy.position.z, 99999, 'Training dummy'); tgt.model.visible = false; tgt.kind = 'dummy'; trialDummy = tgt;
  $('trial').classList.remove('hidden');
  $('trial').innerHTML = `🎯 Trying <b>${SPECIES[sp].name}</b>: hit the training dummy with ${BTN.attack()}, ${BTN.skill1()}, ${BTN.skill2()}! <button class="btn blue" id="trPick">✔ Choose this one</button><button class="btn" id="trBack">↩ See the others</button>`;
  $('trPick').onclick = () => pickStarter(sp);
  $('trBack').onclick = () => { endTrial(); openChoose(); };
}
function endTrial() { $('trial').classList.add('hidden'); if (trialDummy) { trialDummy.alive = false; removeEnemy(trialDummy); trialDummy = null; } spawnCompanion(null); ULT.v = 0; }
function pickStarter(sp) {
  endTrial(); $('choose').classList.add('hidden');
  save.team = [newMember(sp)]; save.active = 0; spawnCompanion(save.team[0]); markCaught(sp);
  SFX.win(); persist();
  story('chosen');
}

// ====================================================================== team menu
function openTeam() {
  if (!save.team.length) return;
  $('teamMenu').classList.remove('hidden'); navEl = null;
  const card = (m, i, inGarden) => { const d = SPECIES[m.sp], f = m.hp / m.maxHp, h = happy(m);
    return `<div class="tmc rar-${rarity(m.sp)} ${!inGarden && i === save.active ? 'on' : ''} ${m.hp <= 0 ? 'ko' : ''}" ${inGarden ? 'data-g="' + i + '"' : 'data-i="' + i + '"'}>
      <img class="tport" data-sp="${m.sp}" alt="">
      <b>${eIcon(m.sp)} ${d.name}</b> <span style="color:#d9c4ff">Lv ${m.lv || 1}</span> ${h >= 70 ? '💖' : h < 25 ? '😞' : ''}${d.tier ? ` <span style="color:var(--gold)">${'★'.repeat(d.tier)}</span>` : ''}
      <div style="font-size:12px;color:var(--muted)">${ELEM[elemOf(m.sp)].name} · strong vs ${strongVs(m.sp)}</div>
      <div class="bar" style="width:100%;margin-top:6px"><div style="width:${f * 100}%;background:${f > .5 ? '#3ddc84' : f > .25 ? '#ffd34d' : '#ff5a6a'}"></div></div>
      <div style="font-size:12px">❤️ ${Math.ceil(m.hp)}/${m.maxHp}${!inGarden && i === save.active ? ' · <b style="color:var(--cyan)">FIGHTING</b>' : ''}${d.evo ? ` · evolves at Lv ${EVO_LV}` : ''}${(d.abilities || []).length ? ' · ' + d.abilities.map((a) => ABILITIES[a][0] + ' ' + ABILITIES[a][1]).join(', ') : ''}</div></div>`; };
  $('tmList').innerHTML = `<div style="grid-column:1/-1;color:var(--gold);font-weight:900">👥 Your team (${save.team.length}/7): click one to make it fight</div>` + save.team.map((m, i) => card(m, i, false)).join('')
    + `<div style="grid-column:1/-1;color:var(--gold);font-weight:900;margin-top:8px">🌱 Caught and living in Professor Green's garden (${save.garden.length})</div>`
    + (save.garden.length ? save.garden.map((m, i) => card(m, i, true)).join('') : `<div style="grid-column:1/-1;color:var(--muted)">Nobody yet. When your team is full (7), new catches go to the garden.</div>`)
    + `<div style="grid-column:1/-1;color:var(--muted)">📖 Caught so far: <b>${Object.keys(save.dex.caught).length}/${DEX_ORDER.length}</b> different Monstermon. To swap team and garden, visit the 🌱 garden east of the lab.</div>`;
  document.querySelectorAll('#tmList .tmc[data-i]').forEach((c) => c.onclick = () => { const i = +c.dataset.i; if (save.team[i].hp <= 0) return toast('This Monstermon is tired. Rest at the camp or visit Professor Green.'); save.active = i; spawnCompanion(save.team[i]); closeTeam(); toast(`🔁 ${SPECIES[save.team[i].sp].name} came out of the FoldCube!`); });
  document.querySelectorAll('#tmList .tmc[data-g]').forEach((c) => c.onclick = () => toast('🌱 This one lives in Professor Green\u2019s garden. Go to the garden (east of the lab) and press E to bring it into your team.'));
  document.querySelectorAll('#tmList .tmc[data-i]').forEach((c) => { c.insertAdjacentHTML('beforeend', `<button class="btn" data-elev="${c.dataset.i}" style="margin-top:6px">⬆️ Elevation Card (${save.items.elevate || 0})</button>`); c.querySelector('[data-elev]').onclick = (ev) => { ev.stopPropagation(); useElevate(+c.dataset.i); }; });
  // draw the 3D portraits a few at a time so the menu opens instantly
  const imgs = [...document.querySelectorAll('#tmList img.tport')]; let k = 0; const tok = openTeam.tok = (openTeam.tok || 0) + 1;
  const step = () => { if (tok !== openTeam.tok || $('teamMenu').classList.contains('hidden')) return; for (let n = 0; n < 4 && k < imgs.length; n++, k++) imgs[k].src = dexShot(imgs[k].dataset.sp); if (k < imgs.length) requestAnimationFrame(step); };
  step();
}
function closeTeam() { $('teamMenu').classList.add('hidden'); }
$('tmClose').onclick = closeTeam;

// ====================================================================== pause menu (mouse, keyboard and controller)
let paused = false, pFocus = 0;
const PROWS = [
  { type: 'btn', label: '▶ Resume', act: () => togglePause(false) },
  { type: 'range', key: 'music', label: '🎵 Music', min: 0, max: 1 },
  { type: 'range', key: 'sfx', label: '🔊 Sound effects', min: 0, max: 1 },
  { type: 'range', key: 'sens', label: '🎥 Camera speed', min: 0.4, max: 2 },
  { type: 'toggle', key: 'diff', label: '🎚️ Difficulty', opts: [['easy', 'Easy'], ['normal', 'Normal']] },
  { type: 'toggle', key: 'quality', label: '🖼️ Graphics', opts: [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] },
  { type: 'toggle', key: 'autoClothes', label: '🧥 Weather clothes', opts: [[true, 'On'], [false, 'Off']] },
  { type: 'btn', label: '❓ Help & legend', act: () => { togglePause(false); openHelp(); } },
  { type: 'btn', label: '📖 Dex', act: () => { togglePause(false); openDex(); } },
  { type: 'btn', label: '✏️ Edit touch controls', act: () => { togglePause(false); if (!TOUCH.mode) setTouchMode(true); startEdit(); } },
  { type: 'btn', label: '🏅 Medals', act: () => { togglePause(false); openMedals(); } },
  { type: 'btn', label: '👪 Parent settings', act: () => { togglePause(false); openParent(); } },
  { type: 'btn', label: '🔁 Switch player', act: () => { persist().then(() => location.href = '/adventure.html'); } },
  { type: 'btn', label: '💾 Save game', act: () => { persist(); toast('💾 Game saved!'); } },
  { type: 'btn', label: '👕 Change my look', act: () => { togglePause(false); openCreator(); } },
  { type: 'btn', label: '🏠 Back to dreamPlay', act: () => { persist().then(() => location.href = '/'); } },
];
function renderPause() {
  $('pauseHelp').innerHTML = pad.on ? 'D-pad ↑↓ choose · ←→ change · ✕ select · Create/○ resume' : 'Arrow keys or mouse · Enter select · Esc resume';
  $('pRows').innerHTML = PROWS.map((r, i) => r.type === 'btn'
    ? `<div class="prow ${i === pFocus ? 'focus' : ''}"><button class="btn" data-i="${i}">${r.label}</button></div>`
    : r.type === 'toggle' ? `<div class="prow ${i === pFocus ? 'focus' : ''}"><label>${r.label}</label>${r.opts.map(([v, l]) => `<button class="btn ${save.settings[r.key] === v ? 'blue' : ''}" data-tg="${i}" data-v="${v}">${l}</button>`).join('')}</div>`
    : `<div class="prow ${i === pFocus ? 'focus' : ''}"><label>${r.label}</label><input type="range" min="${r.min}" max="${r.max}" step="0.05" value="${save.settings[r.key]}" data-k="${r.key}"></div>`).join('');
  $('pRows').querySelectorAll('button[data-tg]').forEach((b) => b.onclick = () => { const r = PROWS[+b.dataset.tg], v = r.opts.find((o) => String(o[0]) === b.dataset.v)[0]; setToggle(r.key, v); renderPause(); });
  $('pRows').querySelectorAll('button[data-i]').forEach((b) => b.onclick = () => PROWS[+b.dataset.i].act());
  $('pRows').querySelectorAll('input[data-k]').forEach((inp) => inp.oninput = () => { save.settings[inp.dataset.k] = +inp.value; applyVolumes(); });
}
function setToggle(key, v) { save.settings[key] = v; if (key === 'autoClothes') rebuildAvatar(); if (key === 'quality') { save.settings.qualityChosen = true; applyQuality(); toast(`🖼️ Graphics: ${v}`); } if (key === 'diff') toast(v === 'easy' ? '🎚️ Easy: monsters hit softer and you get more time to dodge.' : '🎚️ Normal: monsters hit harder and attack faster.'); }
function togglePause(on) {
  paused = on === undefined ? !paused : on;
  $('pause').classList.toggle('hidden', !paused);
  if (paused) { pFocus = 0; renderPause(); } else persist();
}
function pauseKey(code) {
  const r = PROWS[pFocus];
  if (code === 'ArrowUp') pFocus = (pFocus + PROWS.length - 1) % PROWS.length;
  else if (code === 'ArrowDown') pFocus = (pFocus + 1) % PROWS.length;
  else if ((code === 'ArrowLeft' || code === 'ArrowRight') && r.type === 'toggle') { const i = r.opts.findIndex((o) => o[0] === save.settings[r.key]); setToggle(r.key, r.opts[(i + (code === 'ArrowRight' ? 1 : r.opts.length - 1)) % r.opts.length][0]); }
  else if ((code === 'ArrowLeft' || code === 'ArrowRight') && r.type === 'range') { const st = (r.max - r.min) / 10; save.settings[r.key] = Math.min(r.max, Math.max(r.min, save.settings[r.key] + (code === 'ArrowRight' ? st : -st))); applyVolumes(); }
  else if (code === 'Enter' || code === 'Space') { if (r.type === 'btn') return r.act(); }
  else if (code === 'Escape' || code === 'KeyP') return togglePause(false);
  else return;
  renderPause(); SFX.tick();
}

// ====================================================================== HUD: stats, companion, labels, minimap, quest list
function renderStats() {
  const f = P.hp / P.maxHp, night = isNight();
  $('stats').innerHTML = `<div class="pill">🧭 ${save.name}</div><div class="pill"><div class="bar"><div style="width:${f * 100}%;background:${f > .5 ? '#3ddc84' : f > .25 ? '#ffd34d' : '#ff5a6a'}"></div></div>❤️ ${Math.ceil(P.hp)}</div><div class="pill">🪙 ${save.coins} · 🧊 ${save.team.length}/7 · 🧪 ${save.items.potion} · ⬆️ ${save.items.elevate || 0}${save.items.strongCube ? ' · 💠 ' + save.items.strongCube : ''}</div><div class="pill">${night ? '🌙 Night' : '☀️ Day'} · ${WEATHERS[WX.type].icon} ${WEATHERS[WX.type].name}${lampOn ? ' · 🔦' : ''}</div>${POWER.t > 0 ? `<div class="pill" style="color:var(--gold)">💪 Baba Power ${Math.ceil(POWER.t)}s</div>` : ''}`;
}
function renderComp() {
  const el = $('comp');
  if (!comp) return el.classList.add('hidden');
  el.classList.remove('hidden');
  const d = compStats(), m = comp.m, f = m.hp / m.maxHp, keysL = [BTN.attack(), BTN.skill1(), BTN.skill2(), BTN.ult()];
  const xpIn = (m.xp || 0) % LV_XP;
  el.innerHTML = `<img class="cport" src="${dexShot(m.sp)}" alt=""><div class="name">${d.name} <span style="color:#d9c4ff;font-size:13px">Lv ${m.lv || 1}</span>${comp.trial ? ' <span style="color:var(--gold);font-size:12px">(trial)</span>' : ''}</div><div class="role">${eIcon(m.sp)} ${ELEM[elemOf(m.sp)].name} · strong vs ${strongVs(m.sp)}${d.evo ? ` · evolves at Lv ${EVO_LV}` : ''}</div>
    <div class="bar" style="width:100%;margin-top:6px"><div style="width:${f * 100}%;background:${f > .5 ? '#3ddc84' : f > .25 ? '#ffd34d' : '#ff5a6a'}"></div></div>
    <div class="xp" title="XP"><div style="width:${xpIn}%"></div></div>
    <div class="skills">${d.skills.map((s, i) => { const cd = i === 3 ? 1 - ULT.v / 100 : Math.max(0, comp.cds[i] / (s.cd || 1)); return `<div class="sk ${i === 3 ? 'ult' : ''} ${i === 3 && ULT.v >= 100 ? 'ready' : ''}"><span class="key">${keysL[i]}</span>${s.name}<div class="cd" style="height:${cd * 100}%"></div></div>`; }).join('')}</div>
    <div id="team">${save.team.map((mm, i) => `<span style="background:${i === save.active ? '#6fe3ff' : mm.hp > 0 ? '#3ddc84' : '#552'}"></span>`).join('')}</div>`;
}
function updateLabels() {
  const L = $('labels');
  const tgt = state === 'play' ? currentTarget() : null;
  let html = '';
  for (const e of enemies) {
    if (!e.alive || e.kind === 'hidden' || e.kind === 'dummy') continue;
    const p = new THREE.Vector3(e.x, e.y + (e.boss ? 6.2 : e.kind === 'pylon' ? 3.4 : e.kind === 'cage' ? 2.8 : 1.9), e.z).project(camera);
    if (p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1 || dist2(e.x, e.z, P.x, P.z) > 34) continue;
    const f = Math.max(0, e.hp / e.max);
    if (e.kind === 'mon' && e.sp) markSeen(e.sp);
    html += `<div class="lbl ${e === tgt ? 'target' : ''}" style="left:${(p.x + 1) / 2 * innerWidth}px;top:${(1 - p.y) / 2 * innerHeight}px">${e === tgt ? '🎯 ' : ''}${e.sp ? eIcon(e.sp) + ' ' : ''}${e.name}${e.lvl ? ` <span style="color:${lvColor(e.lvl)}">Lv ${e.lvl}</span>` : ''}${e.mood === 'angry' ? ' 😠' : e.mood === 'sad' ? ' 😢' : ''}${e.shard ? ' 🧩' : ''}${e.abil && e.abil.length ? ' ' + e.abil.map((a) => ABILITIES[a][0]).join('') : ''}${SPECIES[e.sp] && SPECIES[e.sp].tier ? ' <span style="color:#ffd34d">' + '★'.repeat(SPECIES[e.sp].tier) + '</span>' : ''}${e.shielded ? ' 🛡️' : ''}${e.enraged ? ' 😡' : ''}${e.elemOverride ? ' 🎭' + ELEM[e.elemOverride].icon : ''}${e.boss && e.phase2 ? ' 🔥' : ''}<div class="hb"><div style="width:${f * 100}%;background:${e.boss ? '#ffd34d' : f > .5 ? '#3ddc84' : '#ff5a6a'}"></div></div>${e.catchable && e.kind === 'mon' ? `<div class="rd"><div style="width:${e.ready * 100}%"></div></div>${e.ready >= 0.99 ? '<span class="ok">✦ READY for the FoldCube</span>' : e.watching ? '<span class="ok">👀 watching…</span>' : ''}` : ''}</div>`;
  }
  L.querySelectorAll('.lbl.e').forEach((x) => x.remove());
  const wrap = document.createElement('div'); wrap.innerHTML = html;
  [...wrap.children].forEach((c) => { c.classList.add('e'); L.appendChild(c); });
}
const mctx = $('minimap').getContext('2d'); let mmBase = null;
const MMV = 170, MMS = 200 / MMV;   // the round map shows 170 m around you
const toMM = (wx, wz) => [100 + (wx - P.x) * MMS, 100 + (wz - P.z) * MMS];
const clampMM = ([x, y], r = 86) => { const dx = x - 100, dy = y - 100, l = Math.hypot(dx, dy); return l > r ? [100 + dx / l * r, 100 + dy / l * r] : [x, y]; };
function buildMinimapBase() {
  const N = 320, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), img = x.createImageData(N, N), col = new THREE.Color();
  const ZC = { wastes: '#b8682f', swamp: '#3a5a2e', frost: '#dbe7f2', peaks: '#6a6680' };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wx = -HALF + (i + 0.5) * W / N, wz = -HALF + (j + 0.5) * W / N, h = terrainHeight(wx, wz), zn = zoneOf(wx, wz);
    if (h < WATER - 0.2) col.set(zn === 'swamp' ? '#24402e' : '#2a6ab0'); else if (zn !== 'core') { col.set(ZC[zn]); col.multiplyScalar(0.8 + Math.min(0.5, h / 60)); if (zn === 'peaks' && h > 28) col.set('#f4f6fa'); }
    else if (h > 12) col.set('#8a8f98'); else if (h > 5) col.set('#5a7a4a'); else if (wz > 38 && Math.abs(wx) < 40) col.set('#a8c070'); else col.setHSL((105 - h * 3) / 360, 0.45, (30 + h * 2) / 100);
    const k = (j * N + i) * 4; img.data[k] = col.r * 255; img.data[k + 1] = col.g * 255; img.data[k + 2] = col.b * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
}
function mmDot(wx, wz, col, r = 3) { const [x, y] = toMM(wx, wz); mctx.fillStyle = col; mctx.beginPath(); mctx.arc(x, y, r, 0, 7); mctx.fill(); mctx.strokeStyle = '#000'; mctx.lineWidth = 1; mctx.stroke(); }
function drawMinimap() {
  if (!mmBase) mmBase = buildMinimapBase();
  mctx.fillStyle = '#0a1222'; mctx.fillRect(0, 0, 200, 200);
  { const k = 320 / W; mctx.drawImage(mmBase, (P.x - MMV / 2 + HALF) * k, (P.z - MMV / 2 + HALF) * k, MMV * k, MMV * k, 0, 0, 200, 200); }
  for (const c of chests) if (chestReady(c)) { const [cx2, cy2] = toMM(c.x, c.z); if (Math.hypot(cx2 - 100, cy2 - 100) < 92) { mctx.fillStyle = '#ffd34d'; mctx.fillRect(cx2 - 3, cy2 - 3, 6, 6); mctx.strokeStyle = '#000'; mctx.strokeRect(cx2 - 3, cy2 - 3, 6, 6); } }
  if (isNight()) { mctx.fillStyle = 'rgba(5,10,40,.45)'; mctx.fillRect(0, 0, 200, 200); }
  const [bx1, bz1] = toMM(0, 0); mctx.fillStyle = WORLD.bridgeState === 1 ? '#c8a060' : '#5a2a10'; mctx.fillRect(bx1 - 3, bz1 - 9, 6, 18);
  const [gx1, gz1] = toMM(...GATE); mctx.fillStyle = '#3ad0ff'; mctx.fillRect(gx1 - 4, gz1 - 3, 8, 6);
  mmDot(...SPOTS.green, '#3ddc84', 3.5); mmDot(...SPOTS.camp, '#ffa040', 3.5);
  if (nira.visible) mmDot(NIRA_AT[0], NIRA_AT[1], '#b48cff', 3.5);
  mmDot(...SHOP_AT, '#e53950', 3.5); mmDot(...GARDEN_AT, '#9ad66a', 4); mmDot(...TROPHY_AT, '#ffcf3a', 3.5); mmDot(...CHAMBER, '#b48cff', 4.5); mmDot(...RACE_AT, '#ffffff', 3);
  for (const e of enemies) { if (!e.alive || e.kind === 'hidden' || e.kind === 'dummy' || e.kind === 'cage') continue; mmDot(e.x, e.z, e.boss ? '#ffd34d' : e.kind === 'pylon' ? '#6fe3ff' : e.mood === 'sad' ? '#5a8aff' : '#ff4a4a', e.boss ? 5 : 2.5); }
  if (D.state !== 'away') mmDot(D.x, D.z, '#3ddc84', 4.5);
  if (beacon.visible) { const [sx, sy] = clampMM(toMM(beacon.position.x, beacon.position.z)); mctx.fillStyle = '#ffd34d'; mctx.font = 'bold 16px Segoe UI Emoji, sans-serif'; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillText('⭐', sx, sy); }
  { const [gx, gy] = clampMM(toMM(...SPOTS.green)), pulse = 7 + (performance.now() / 400 % 1) * 9;
    mctx.strokeStyle = 'rgba(61,220,132,' + (1 - (pulse - 7) / 9) + ')'; mctx.lineWidth = 2.5; mctx.beginPath(); mctx.arc(gx, gy, pulse, 0, 7); mctx.stroke();
    mctx.fillStyle = '#3ddc84'; mctx.beginPath(); mctx.arc(gx, gy, 7, 0, 7); mctx.fill(); mctx.strokeStyle = '#fff'; mctx.lineWidth = 2; mctx.stroke();
    mctx.fillStyle = '#05220f'; mctx.font = 'bold 10px Segoe UI'; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillText('G', gx, gy + 0.5); }
  coopMinimap();
  const [px, py] = toMM(P.x, P.z), a = P.yaw;
  mctx.save(); mctx.translate(px, py); mctx.rotate(-a + Math.PI);
  mctx.fillStyle = '#ffffff'; mctx.strokeStyle = '#000'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.moveTo(0, -7); mctx.lineTo(5, 5); mctx.lineTo(0, 2); mctx.lineTo(-5, 5); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
  mctx.fillStyle = 'rgba(0,0,0,.6)'; mctx.beginPath(); mctx.arc(100, 12, 9, 0, 7); mctx.fill(); mctx.fillStyle = '#ffd34d'; mctx.font = 'bold 12px Segoe UI'; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillText('N', 100, 12.5);
}
function mainQuest() {
  switch (save.step) {
    case 'arrive': return 'Meet Professor Green at his lab';
    case 'intro': case 'choose': return 'Choose your first companion';
    case 'mission1': return 'Check the vanished path at the root bridge (north)';
    case 'free': return 'Free Skipclip from the roots';
    case 'capture': return 'Catch Skipclip with the FoldCube';
    case 'boss': return boss && boss.shield ? 'Destroy the 2 fold pylons' : 'Defeat Rootlock, the Bridge Guard';
    case 'mountain': return `Travel to ${PLACE.mountain} (far north)`;
    case 'explore': return 'Take the glowing lift at the mountain gate';
    case 'city': case 'seals': return `Break the fold seals (${seals.filter((x) => !x.alive).length}/3)`;
    case 'dragon': return 'Defeat Foldragon at the Folded Palace';
    default: return 'Explore, catch Monstermon and level up';
  }
}
function renderQuests() {
  const s = save.side; let h = `<div class="qh">📜 QUESTS</div><div class="q">⭐ ${mainQuest()}</div>`;
  if (s.songs.state === 'active') h += `<div class="q side">🟣 Listen to singing mushrooms (${s.songs.heard.length}/5)</div>`;
  if (s.songs.state === 'done') h += `<div class="q side done">🟣 Mushroom songs</div>`;
  if (s.watch.state === 'active') h += `<div class="q side">🟣 Calm a sad Monstermon without fighting</div>`;
  if (s.watch.state === 'done') h += `<div class="q side done">🟣 Gentle friend</div>`;
  if (nira.visible && (s.songs.state === 'none' || (s.songs.state === 'done' && s.watch.state === 'none'))) h += `<div class="q side">🟣 Talk to Nira at the camp</div>`;
  $('quests').innerHTML = h;
}

// ====================================================================== interactions + guide
function interact() {
  if (dlg.open) { showLine(); return; }
  if (FISH.on || babaBusy() || CINE.t > 0 || MORPH.on) return;
  { const ch = nearChest(); if (ch) { openChest(ch); return; } }
  if (dist2(P.x, P.z, ...CHAMBER) < 4.5 || dist2(P.x, P.z, ...labLocal(0, 4.8)) < 3) { if (!save.team.length) return toast('🧬 Catch some Monstermon first, then come back to morph them!'); openMorph(); return; }
  if (D.state === 'waiting' && dist2(D.x, D.z, P.x, P.z) < 3.2) { uncleHelp(true); return; }
  if (save.step === 'arrive' && dist2(P.x, P.z, ...SPOTS.green) < 4.5) { story('meetGreen'); return; }
  if (nira.visible && dist2(P.x, P.z, ...NIRA_AT) < 3.5) { talkNira(); return; }
  if (reached('explore') && (dist2(P.x, P.z, ...LIFT_LOW) < 2.5 || dist2(P.x, P.z, ...LIFT_HIGH) < 2.5)) { useLift(); return; }
  if (dist2(P.x, P.z, ...RACE_AT) < 3.5 && !RACE.on) { startRace(); return; }
  if (dist2(P.x, P.z, ...TROPHY_AT) < 4.5) { openMedals(); return; }
  if (dist2(P.x, P.z, ...SHOP_AT) < 4) { openShop(); return; }
  if (dist2(P.x, P.z, ...GARDEN_AT) < 7.5 && save.team.length) { openGarden(); return; }
  const v = VILLAGERS.find((vv) => dist2(P.x, P.z, vv.at[0], vv.at[1]) < 3.2);
  if (v) { say([['Villager', v.lines[v.i % v.lines.length]]]); v.i++; return; }
  if (dist2(P.x, P.z, ...SPOTS.green) < 4 && save.team.length) { save.team.forEach((m) => m.hp = m.maxHp); P.hp = P.maxHp; if (comp) spawnCompanion(save.team[save.active]); say([['Professor Green', 'Your team is fully healed. Be careful out there!']]); persist(); return; }
  if (dist2(P.x, P.z, SPOTS.camp[0], SPOTS.camp[1]) < 6) { save.team.forEach((m) => m.hp = m.maxHp); P.hp = P.maxHp; if (comp) spawnCompanion(save.team[save.active]); toast('⛺ You rested at the camp: your team is healed and the game is saved.'); persist(); if (save.team.length) openCare(); return; }
  if (nearShore() && dist2(valeza.position.x, valeza.position.z, P.x, P.z) >= 3.5) { startFishing(); return; }
  if (dist2(valeza.position.x, valeza.position.z, P.x, P.z) < 3.5) { swimBoost = 20; toast('😊 Valeza: "Swim with me and you will be 2x faster for 20 seconds!"'); return; }
  for (const p of [...pylons, ...seals]) if (p.alive && dist2(p.x, p.z, P.x, P.z) < 2.5) { applyDamage(p, 30); return; }
}
function updateGuide() {
  if (state !== 'play' || dlg.open) return guide('');
  const dc = (x, z) => dist2(P.x, P.z, x, z);
  if (MORPH.on) return guide(`🧬 <b>${SPECIES[MORPH.a.sp].name}</b> + <b>${SPECIES[MORPH.b.sp].name}</b> are fusing…`, 'friend');
  if (state === 'play' && (dc(...CHAMBER) < 4.5 || dc(...labLocal(0, 4.8)) < 3)) return guide(`🧬 Press <b>${BTN.talk()}</b> to open the <b>Morph Lab</b> and fuse two Monstermon into a new one!`, 'friend');
  if (BABA.phase === 'hug') return guide('❤️ <b>BABA</b> is hugging you!', 'friend');
  if (BABA.phase === 'slam') return guide('💪 <b>BABA SLAM!</b>', 'friend');
  if (FISH.on) return guide(FISH.phase === 'bite' ? `❗ Press <b>${BTN.jump()}</b> NOW!` : FISH.phase === 'reel' ? `🎣 Press <b>${BTN.jump()}</b> when the yellow needle is in the green zone!` : `🎣 Wait for the float to dip… (<b>${BTN.dodge()}</b> to stop)`, 'quest');
  if (RACE.on) return guide(RACE.count > 0 ? '🏁 Get ready…' : `🏁 Ring <b>${RACE.next + 1}/8</b>: run to the <b style="color:#ffd34d">gold ring</b>! Beat Skipclip!`, 'quest');
  if (evolving) return guide(`✨ <b>${SPECIES[evolving.from].name}</b> is evolving…`, 'friend');
  if (bond) return guide(`🎯 Press <b>${BTN.cube()}</b> when the <b style="color:#6fe3ff">blue ring</b> touches the <b style="color:#ffd34d">gold ring</b>!`, 'quest');
  if (D.state !== 'away') { if (D.reason === 'rescue' && D.state === 'coming') return guide('💪 <b>Baba</b> is running to rescue you!', 'friend'); if (D.state === 'waiting') return guide(dc(D.x, D.z) < 3.2 ? `💪 Press <b>${BTN.talk()}</b> so <b>Baba</b> gives you a reward!` : '💪 <b>Baba</b> is in the forest! Find him (💚 on the map) before he leaves.', 'friend'); }
  const tg = telegraphs.find((x) => inTelegraph(x, P.x, P.z, 0.6));
  if (tg) return guide(tg.hint || `⚠️ <b>Danger zone!</b> Get out or roll with <b>${BTN.dodge()}</b>!`, 'danger');
  if (hazards.some((h) => dc(h.x, h.z) < h.r + 0.5)) return guide('🔥 Burning embers! Step out of the orange patch!', 'danger');
  if (P.slowT > 0) return guide('🟣 You are slowed by the sound wave! It wears off in a moment.', 'danger');
  if (P.hp < 35) return guide('❤️ Your health is low! Get away and dodge attacks… help is coming.', 'danger');
  if (comp && comp.trial) return guide(`🎯 Try the skills: <b>${BTN.attack()}</b> attack, <b>${BTN.skill1()}</b> and <b>${BTN.skill2()}</b> skills, <b>${BTN.ult()}</b> ultimate (it charges while you hit).`, 'quest');
  if (save.step === 'arrive') return guide(dc(...SPOTS.green) < 4.5 ? `👨‍🔬 Press <b>${BTN.talk()}</b> to talk to <b>Professor Green</b>.` : '📍 Go to <b>Professor Green</b> at the lab in the roots of the giant tree (follow the yellow light / ⭐ on the map).', 'quest');
  if (nira.visible && dc(...NIRA_AT) < 3.5) return guide(`💬 Press <b>${BTN.talk()}</b> to talk to <b>Nira</b>.`, 'friend');
  if (reached('explore') && (dc(...LIFT_LOW) < 2.5 || dc(...LIFT_HIGH) < 2.5)) return guide(`🔷 Press <b>${BTN.talk()}</b> to ride the lift ${dc(...LIFT_LOW) < 2.5 ? 'UP to the Folded City' : 'DOWN to the forest'}.`, 'quest');
  if (dc(...RACE_AT) < 3.5) return guide(`🏁 Press <b>${BTN.talk()}</b> to race against Skipclip! Winner gets 60 🪙.`, 'friend');
  if (dc(...TROPHY_AT) < 4.5) return guide(`🏆 Press <b>${BTN.talk()}</b> to see your medals in the Trophy room.`, 'friend');
  if (dc(SPOTS.camp[0], SPOTS.camp[1]) < 6 && save.team.length) return guide(`⛺ Press <b>${BTN.talk()}</b> to rest, heal and take care of your Monstermon (feed, pet, play).`, 'friend');
  if (nearShore()) return guide(`🎣 Press <b>${BTN.talk()}</b> to go fishing in the lake!`, 'friend');
  if (RIDE.on) return guide(RIDE.kind === 'fly' ? `🐉 Flying! Hold <b>${BTN.jump()}</b> to go up, <b>${BTN.dodge()}</b> to go down, <b>${RIDE.dragon ? (TOUCH.mode ? '🐉' : 'G') : BTN.ride()}</b> to land.` : `🐉 Riding ${SPECIES[comp.m.sp].name}! Press <b>${BTN.ride()}</b> to hop off.`, 'friend');
  if (dc(...SHOP_AT) < 4) return guide(`🛒 Press <b>${BTN.talk()}</b> to open the <b>shop</b>. You have ${save.coins} 🪙.`, 'friend');
  if (dc(...GARDEN_AT) < 7.5 && save.team.length) return guide(`🌱 Professor Green's garden: press <b>${BTN.talk()}</b> to swap Monstermon between your team and the garden.`, 'friend');
  if (VILLAGERS.some((v) => dc(v.at[0], v.at[1]) < 3.2)) return guide(`💬 Press <b>${BTN.talk()}</b> to talk to the villager.`);
  if (save.step === 'mission1') return guide('📍 Mission: go north to the <b>root bridge</b> and find out why the path vanished from the map (⭐).', 'quest');
  if (save.step === 'free') return guide(`🌿 Free <b>Skipclip</b>! Press <b>${BTN.attack()}</b> so ${comp ? SPECIES[comp.m.sp].name : 'your companion'} hits the roots.`, 'quest');
  if (save.step === 'capture') return guide(`🧊 Press <b>${BTN.cube()}</b> to start the bond moment with Skipclip!`, 'quest');
  if (save.step === 'seals') { const n = seals.find((x) => x.alive); if (n && dc(n.x, n.z) < 4) return guide(`🔷 Break the <b>fold seal</b> with <b>${BTN.attack()}</b> (or <b>${BTN.talk()}</b> next to it)!`, 'quest'); }
  if ((save.step === 'boss' || save.step === 'dragon') && boss) {
    if (boss.state === 'wake') return guide(boss.short ? '⚠️ The palace doors are open… something huge is waiting inside.' : '⚠️ Get closer to the bridge… something huge is sleeping among the roots.', 'danger');
    if (boss.shield) return guide(`⚡ Rootlock's <b>shield</b> comes from the 2 <b>fold pylons</b>. Destroy them with <b>${BTN.attack()}</b> (or <b>${BTN.talk()}</b> right next to them).`, 'quest');
    if (boss.state === 'stuck') return guide(`✨ The <b>FRAGMENT</b> is exposed! Hit it with everything: <b>${BTN.skill1()}</b>, <b>${BTN.ult()}</b>!`, 'friend');
    return guide(`🌳 Dodge the roots (<b>${BTN.dodge()}</b>). After every attack, Rootlock gets stuck and the fragment is exposed.`, 'quest');
  }
  if (save.step === 'mountain' && dc(GATE[0], GATE[1]) > 9) {
    const tgt0 = currentTarget();
    if (!tgt0) return guide(`⛰️ Head north across the bridge to <b>${PLACE.mountain}</b> (⭐ on the map).`, 'quest');
  }
  const tgt = currentTarget();
  if (tgt && tgt.kind === 'mon') {
    if (tgt.ready >= 0.99) return guide(`🧊 <b>${tgt.name}</b> is ready! Press <b>${BTN.cube()}</b> to throw the FoldCube.`);
    if (comp && tgt.sp) {
      const em = elemMul(comp.m.sp, tgt.sp), vs = `${eIcon(comp.m.sp)} vs ${eIcon(tgt.sp)}`;
      const better = em < 2 ? save.team.find((m) => m !== comp.m && m.hp > 0 && elemMul(m.sp, tgt.sp) >= 2) : null;
      if (better) return guide(`${vs} 💡 Switch to <b>${eIcon(better.sp)} ${SPECIES[better.sp].name}</b> with <b>${BTN.team()}</b>: it is <b>super effective</b> against ${tgt.name}!`, 'quest');
      if (em >= 2 && tgt.mood !== 'sad') return guide(`${vs} 💥 <b>${SPECIES[comp.m.sp].name}</b> is <b>super effective</b> against ${tgt.name}! Attack with <b>${BTN.attack()}</b>.`, 'friend');
      if (em <= 0.5 && tgt.mood !== 'sad') return guide(`${vs} 😕 ${SPECIES[comp.m.sp].name} is <b>weak</b> against ${tgt.name} (half damage). Be careful or switch with <b>${BTN.team()}</b>.`, 'danger');
    }
    if (tgt.mood === 'sad') return guide(`😢 <b>${tgt.name}</b> is sad. <b>Walk slowly</b> close to it and watch (no running, no fighting) to fill the ✦ bar.`);
    return guide(`⚔️ <b>${tgt.name}</b> is angry and attacks! Fight with <b>${BTN.attack()}</b> until the ✦ bar is full, then throw the FoldCube.`);
  }
  if (dc(LAKE.x, LAKE.z) < LAKE.r + 4) return guide('💧 <b>The lake</b>: Valeza (friendly) helps you swim faster, Kraku (mean) chases swimmers!');
  if (P.mode === 'swim') return guide(`🏊 You are swimming! Hold <b>${BTN.jump()}</b> to stay up.`);
  if (P.mode === 'climb') return guide('🧗 You are climbing! Keep going to the top.');
  const mush = WORLD.mushrooms.find((m) => dc(m.x, m.z) < 3);
  if (mush) return guide(save.side.songs.state === 'active' ? `🍄 Listening… (${save.side.songs.heard.length}/5 songs for Nira)` : '🍄 Songwood mushrooms <b>open and sing</b> when you come close!');
  if (save.step === 'explore') return guide(`🌲 Explore, catch Monstermon (${save.team.length}/7) and rest at the camp. Team: <b>${BTN.team()}</b>.`);
  return guide('');
}

// ====================================================================== world ambience: singing mushrooms, bells, gears, the gate
function updateAmbience(dt, t) {
  WORLD.mushrooms.forEach((m, idx) => {
    const d = dist2(P.x, P.z, m.x, m.z);
    const want = d < 3.2 ? 1 : 0; m.open += (want - m.open) * Math.min(1, dt * 4);
    m.cap.scale.set(0.8 + m.open * 0.5, 0.28 + m.open * 0.1, 0.8 + m.open * 0.5); m.cap.position.y = 0.6 + m.open * 0.25;
    m.cap.material.emissiveIntensity = 0.25 + m.open * 1.2 + (isNight() ? 0.8 : 0);
    m.cool -= dt;
    if (want && m.cool <= 0) {
      SFX.chime(m.col === '#ff5ad6' ? 660 : 880); m.cool = 2.5;
      const q = save.side.songs;
      if (q.state === 'active' && !q.heard.includes(idx)) { q.heard.push(idx); toast(`🎵 You heard a mushroom song! (${q.heard.length}/5)`); if (q.heard.length >= 5) completeSide('songs'); }
    }
  });
  WORLD.bells.forEach((b, i) => b.rotation.z = Math.sin(t * 2 + i) * 0.2);
  WORLD.labGear.rotation.z = t; WORLD.fire.scale.y = 0.9 * (1 + Math.sin(t * 12) * 0.15);
  WORLD.water.position.y = WATER + Math.sin(t * 1.2) * 0.04;
  WORLD.nightPools.forEach((s, i) => s.scale.setScalar(0.7 + Math.sin(t * 3 + i) * 0.3));
  showcase.forEach((s) => s.visible && s.userData.anim(t, s.userData.st || {}));
  animateAvatar(green, t, 'idle', 0); if (save.step === 'arrive') green.userData.parts.arms[0].rotation.x = -2.4 + Math.sin(t * 5) * 0.4;
  villagers.forEach((v) => animateAvatar(v, t + v.position.x, 'idle', 0));
  if (nira.visible) { animateAvatar(nira, t + 3, 'idle', 0); if (dist2(P.x, P.z, ...NIRA_AT) < 10) nira.rotation.y = Math.atan2(P.x - NIRA_AT[0], P.z - NIRA_AT[1]); }
  gate.userData.shards.forEach((s, i) => { s.position.y += Math.sin(t * 1.5 + i) * 0.004; s.rotation.set(t * 0.7 + i, t * 0.5, 0); });
  if (save.step === 'mountain' && dist2(P.x, P.z, GATE[0], GATE[1]) < 8 && !dlg.open) story('gate');
}

// ====================================================================== difficulty
const DIFF = () => save.settings.diff === 'normal' ? { dmg: 1, tele: 1, bond: 1, rescue: 0.25 } : { dmg: 0.6, tele: 1.35, bond: 1.5, rescue: 0.35 };

// ====================================================================== elements: who beats whom
const ELEM = {
  fire: { icon: '🔥', name: 'Fire', color: '#ff7a1a' }, water: { icon: '💧', name: 'Water', color: '#3ab0ff' }, plant: { icon: '🌿', name: 'Plant', color: '#3ddc84' },
  metal: { icon: '⚙️', name: 'Metal', color: '#b8c2cc' }, wind: { icon: '🌪️', name: 'Wind', color: '#9fe8ff' }, stone: { icon: '🪨', name: 'Stone', color: '#c8b89a' }, light: { icon: '✨', name: 'Light', color: '#ffe08a' },
};
const STRONG = { fire: ['plant', 'metal'], water: ['fire', 'stone'], plant: ['water', 'stone'], metal: ['stone', 'light'], wind: ['plant', 'fire'], stone: ['fire', 'wind'], light: ['wind', 'water'] };
const SP_ELEM = { inkling: 'water', staplor: 'metal', lanternix: 'fire', aurorell: 'light', foldragon: 'wind', dracometal: 'metal', dracotime: 'metal', metasteal: 'wind', metawing: 'wind', pinkypunch: 'light', pinkyabsorve: 'light', skipclip: 'plant', rootlock: 'stone', rivolo: 'water', mossroll: 'plant', glimframe: 'light', bellbud: 'plant', emberlid: 'fire', hingemaw: 'metal', paperfang: 'wind' };
const elemOf = (sp) => SP_ELEM[sp] || (SPECIES[sp] && SPECIES[sp].elem);
const eIcon = (sp) => elemOf(sp) ? ELEM[elemOf(sp)].icon : '';
function elemMul(atkSp, defSp) {
  const a = elemOf(atkSp), d = elemOf(defSp); if (!a || !d) return 1;
  if (STRONG[a].includes(d)) return 2; if (STRONG[d].includes(a)) return 0.5; return 1;
}
const strongVs = (sp) => elemOf(sp) ? STRONG[elemOf(sp)].map((x) => ELEM[x].icon + ' ' + ELEM[x].name).join(', ') : '';
function effectText(m, x, y, z, who) {
  if (m >= 2) { floatText(x, y + 0.6, z, 'Super effective! ×2', '#ffd34d'); tip('super', `💥 <b>Super effective!</b> ${who} hit with an element that beats the other one, so it does <b>double damage</b>. Press <b>${BTN.help()}</b> → Elements to see who beats whom.`, '🔥💧🌿 Elements'); }
  else if (m <= 0.5) { floatText(x, y + 0.6, z, 'Not very effective… ×½', '#9aa4b8'); tip('weak', `😕 <b>Not very effective…</b> That element is weak against this one, so it only does <b>half damage</b>. Try switching your companion with <b>${BTN.team()}</b>!`, '🔥💧🌿 Elements'); }
}

// ====================================================================== weather: sun, clouds, rain, fog, wind, snow (+ clothes that match)
const WEATHERS = {
  sun: { icon: '☀️', name: 'Sunny', w: 24, msg: '☀️ It’s sunny! You put on a T-shirt, shorts and sunglasses. 🔥 Fire and ✨ Light Monstermon get stronger.' },
  cloudy: { icon: '⛅', name: 'Cloudy', w: 18, msg: '⛅ Clouds roll in. You wear your own clothes again. No element gets a bonus.' },
  rain: { icon: '🌧️', name: 'Rain', w: 20, msg: '🌧️ It’s raining! You put on your raincoat, hood and rain boots. 💧 Water gets stronger, 🔥 Fire gets weaker.' },
  fog: { icon: '🌫️', name: 'Fog', w: 12, msg: '🌫️ Thick fog! You put on a hoodie. You can’t see far, so watch the map. ✨ Light Monstermon shine stronger.' },
  wind: { icon: '🌬️', name: 'Windy', w: 14, msg: '🌬️ Strong wind! You put on a jacket and a scarf. The wind pushes you a little. 🌪️ Wind Monstermon get stronger.' },
  snow: { icon: '❄️', name: 'Snow', w: 12, msg: '❄️ It’s snowing! You put on a big blue puffer jacket, long blue pants, a warm hat and boots. 🪨 Stone gets stronger, 🌿 Plant gets weaker.' },
};
const WEATHER_BOOST = { sun: { fire: 1.3, light: 1.2 }, rain: { water: 1.3, fire: 0.7 }, fog: { light: 1.3 }, wind: { wind: 1.3 }, snow: { stone: 1.25, plant: 0.8 }, cloudy: {} };
const weatherMul = (sp) => (WEATHER_BOOST[WX.type] || {})[elemOf(sp)] || 1;
const WX = { type: 'cloudy', timer: 100, amt: { sun: 0, cloudy: 1, rain: 0, fog: 0, wind: 0, snow: 0 }, windDir: 0.7, flash: 0, dressT: 0, thunderT: 8 };
function setWeather(type, silent) {
  WX.type = type; WX.timer = rand(80, 140); WX.dressT = silent ? 0.01 : 1.8; WX.dressMsg = !silent; WX.windDir = rand(0, 6.28); save.weather = type;
  if (silent) for (const k in WX.amt) WX.amt[k] = k === type ? 1 : 0;
  if (!silent) {
    toast(WEATHERS[type].msg, 6500);
    tip('weather', `🌦️ The <b>weather</b> changes by itself: sun, clouds, rain, fog, wind and snow. Your clothes change to match it, and some <b>elements</b> get stronger. Press <b>${BTN.help()}</b> → Weather for the full list.`, '🌦️ Weather');
  }
}
function pickWeather() { const opts = Object.keys(WEATHERS).filter((k) => k !== WX.type); let r = Math.random() * opts.reduce((s, k) => s + WEATHERS[k].w, 0); for (const k of opts) { r -= WEATHERS[k].w; if (r <= 0) return k; } return 'sun'; }
const CLOTHES_MSG = { sun: '😎 Sunglasses on!', cloudy: '👕 Back to your own clothes.', rain: '🧥 Raincoat on!', fog: '🧶 Hoodie on!', wind: '🧣 Jacket and scarf on!', snow: '🧥 Puffer jacket on!' };
function weatherOutfit(a) {
  if (!save.settings.autoClothes) return a;
  const o = { ...a };
  switch (WX.type) {
    case 'rain': Object.assign(o, { top: 'raincoat', topColor: '#ffd21a', top2: '#ffd21a', hat: 'hood', hatColor: '#ffd21a', pants: 'long', shoes: 'boots', shoeColor: '#e53950', glasses: 'none' }); break;
    case 'snow': Object.assign(o, { top: 'puffer', topColor: '#1e6fff', top2: '#0f4fc0', pants: 'long', pantsColor: '#1e4fb0', hat: 'winter', hatColor: '#1e6fff', shoes: 'boots', shoeColor: '#5a3a1c', scarf: 'scarf', scarfColor: '#e53950', glasses: 'none' }); break;
    case 'wind': Object.assign(o, { top: 'jacket', pants: 'long', scarf: 'scarf', scarfColor: a.scarfColor || '#ff8c1a', glasses: 'none' }); if (['cap', 'capback', 'bucket', 'none'].includes(o.hat)) { o.hat = 'beanie'; } break;
    case 'fog': Object.assign(o, { top: 'hoodie', pants: 'long', glasses: 'none' }); break;
    case 'sun': Object.assign(o, { top: 'tee', pants: 'shorts', glasses: 'sun', scarf: 'none' }); if (['none', 'beanie', 'winter', 'hood'].includes(o.hat)) o.hat = 'cap'; break;
  }
  return o;
}
// particles: rain streaks, snow flakes, wind-blown leaves (they follow the player)
function mkPoints(n, size, colorFn) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = rand(-30, 30); pos[i * 3 + 1] = rand(0, 26); pos[i * 3 + 2] = rand(-30, 30); const c = new THREE.Color(colorFn()); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
  m.frustumCulled = false; scene.add(m); return m;
}
const RAIN_N = 1500;
const rainGeo = new THREE.BufferGeometry(), rainPos = new Float32Array(RAIN_N * 6);
for (let i = 0; i < RAIN_N; i++) { const x = rand(-30, 30), y = rand(0, 26), z = rand(-30, 30); rainPos.set([x, y, z, x, y - 0.7, z], i * 6); }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainFx = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#b8d4f4', transparent: true, opacity: 0 })); rainFx.frustumCulled = false; scene.add(rainFx);
const snowFx = mkPoints(2000, 0.2, () => '#ffffff');
const leafFx = mkPoints(320, 0.32, () => ['#5cb043', '#ff8c1a', '#ffd34d', '#c9a060'][Math.floor(Math.random() * 4)]);
const groundMesh = scene.children.find((o) => o.isMesh && o.material && o.material.vertexColors);
let rainG = null, windG = null;
function startAmbience() {
  if (rainG || !ac) return;
  try {
    const mk = (type, f, q) => { const n = ac.createBufferSource(); n.buffer = noise(); n.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.value = 0; n.connect(fl); fl.connect(g); g.connect(sfxBus); n.start(); return g; };
    rainG = mk('bandpass', 1800, 0.6); windG = mk('lowpass', 420, 1);
  } catch (e) { }
}
function thunder() {
  if (!ac) return;
  try { const t0 = ac.currentTime, n = ac.createBufferSource(); n.buffer = noise(); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.7, t0 + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4); n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t0); n.stop(t0 + 2.5); } catch (e) { }
}
function updateWeather(dt) {
  if (state === 'play') { WX.timer -= dt; if (WX.timer <= 0) setWeather(pickWeather()); }
  for (const k in WX.amt) WX.amt[k] += ((k === WX.type ? 1 : 0) - WX.amt[k]) * Math.min(1, dt / 5);
  if (WX.dressT > 0) { WX.dressT -= dt; if (WX.dressT <= 0) { rebuildAvatar(); spark(P.x, P.y + 1, P.z, '#ffffff', 14); if (state === 'play' && save.settings.autoClothes && WX.dressMsg) floatText(P.x, P.y + 2.6, P.z, CLOTHES_MSG[WX.type], '#ffffff'); } }
  const A = WX.amt, wx = Math.sin(WX.windDir), wz = Math.cos(WX.windDir);
  const cx = P.x, cz = P.z, by = P.y - 4;
  if (A.rain > 0.02) {
    const pos = rainGeo.attributes.position.array, fall = 30 * dt, drift = (2 + A.wind * 10) * dt;
    for (let i = 0; i < RAIN_N; i++) {
      const o = i * 6; pos[o + 1] -= fall; pos[o + 4] -= fall; pos[o] += wx * drift; pos[o + 3] = pos[o] - wx * 0.15; pos[o + 2] += wz * drift; pos[o + 5] = pos[o + 2] - wz * 0.15;
      if (pos[o + 1] < 0) { const x = rand(-30, 30), z = rand(-30, 30), y = 26; pos.set([x, y, z, x, y - 0.7, z], o); }
    }
    rainGeo.attributes.position.needsUpdate = true;
  }
  rainFx.material.opacity = A.rain * 0.6; rainFx.visible = A.rain > 0.02; rainFx.position.set(cx, by, cz);
  if (A.snow > 0.02) {
    const pos = snowFx.geometry.attributes.position.array, t = performance.now() / 1000;
    for (let i = 0; i < pos.length; i += 3) { pos[i + 1] -= (1.6 + (i % 7) * 0.1) * dt; pos[i] += (Math.sin(t + i) * 0.5 + wx * A.wind * 4) * dt; if (pos[i + 1] < 0) { pos[i] = rand(-30, 30); pos[i + 1] = 26; pos[i + 2] = rand(-30, 30); } }
    snowFx.geometry.attributes.position.needsUpdate = true;
  }
  snowFx.material.opacity = A.snow * 0.95; snowFx.visible = A.snow > 0.02; snowFx.position.set(cx, by, cz);
  if (A.wind > 0.02) {
    const pos = leafFx.geometry.attributes.position.array, t = performance.now() / 1000;
    for (let i = 0; i < pos.length; i += 3) { pos[i] += wx * 12 * dt; pos[i + 2] += wz * 12 * dt; pos[i + 1] += Math.sin(t * 4 + i) * 2 * dt - 0.4 * dt; if (Math.abs(pos[i]) > 30 || Math.abs(pos[i + 2]) > 30 || pos[i + 1] < 0) { pos[i] = -wx * 29 + rand(-12, 12) * wz; pos[i + 2] = -wz * 29 + rand(-12, 12) * wx; pos[i + 1] = rand(1, 10); } }
    leafFx.geometry.attributes.position.needsUpdate = true;
  }
  leafFx.material.opacity = A.wind; leafFx.visible = A.wind > 0.02; leafFx.position.set(cx, by + 2, cz);
  if (groundMesh) groundMesh.material.emissive.setRGB(A.snow * 0.42, A.snow * 0.45, A.snow * 0.5);
  // thunder and lightning in heavy rain
  if (A.rain > 0.8) { WX.thunderT -= dt; if (WX.thunderT <= 0) { WX.thunderT = rand(14, 30); WX.flash = 0.35; setTimeout(thunder, 600); } }
  if (WX.flash > 0) WX.flash -= dt;
  // the wind pushes you a little
  if (state === 'play' && A.wind > 0.3 && !dlg.open && P.mode !== 'swim') { P.x += wx * 0.7 * A.wind * dt; P.z += wz * 0.7 * A.wind * dt; }
  if (rainG) { rainG.gain.setTargetAtTime(A.rain * 0.2, ac.currentTime, 0.5); windG.gain.setTargetAtTime(A.wind * 0.3 + A.snow * 0.06 + A.rain * 0.04, ac.currentTime, 0.5); }
}

// ====================================================================== miner headlamp: switches on by itself at night (and in dark weather)
const headSpot = new THREE.SpotLight(0xfff0c8, 0, 34, 0.5, 0.45, 1.2); headSpot.castShadow = false; scene.add(headSpot); scene.add(headSpot.target);
let lampOn = false;
function attachHeadlamp() {
  const head = avatar.userData.parts && avatar.userData.parts.head; if (!head) return;
  const lamp = new THREE.Group(); lamp.position.set(0, 0.36, 0.2); head.add(lamp);
  bx(lamp, 0.5, 0.05, 0.05, '#222222', 0, -0.02, -0.02);
  bx(lamp, 0.16, 0.12, 0.08, '#3a3a3a', 0, 0, 0.04);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshBasicMaterial({ color: '#555555' })); lens.position.set(0, 0, 0.081); lamp.add(lens);
  avatar.userData.lamp = lamp; avatar.userData.lens = lens; lamp.visible = lampOn;
}
function updateHeadlamp() {
  const dark = (1 - dayLight()) * 1 + (WX.amt.rain + WX.amt.fog + WX.amt.snow) * 0.45;
  const want = dark > 0.55;
  if (want !== lampOn) {
    lampOn = want;
    if (state === 'play') { toast(want ? '🔦 It’s dark! You switch on the <b>headlamp</b> on your hat, like a miner.' : '🔦 It’s bright again. Headlamp off.'); if (want) tip('lamp', `🔦 Your <b>headlamp</b> turns on by itself when it gets dark and lights the way in front of you. It turns off again in the daylight.`, '🔦 Headlamp'); SFX.tick(); }
  }
  const lamp = avatar.userData.lamp;
  if (lamp) { lamp.visible = lampOn; avatar.userData.lens.material.color.set(lampOn ? '#fff6c8' : '#555555'); }
  headSpot.intensity += ((lampOn ? 60 : 0) - headSpot.intensity) * 0.15;
  const hx = P.x, hy = P.y + 2.05, hz = P.z, fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
  headSpot.position.set(hx + fx * 0.3, hy, hz + fz * 0.3); headSpot.target.position.set(hx + fx * 10, P.y - 0.5, hz + fz * 10);
}

// ====================================================================== items, shop, garden, Dex
const SHOP_AT = [8, 57], GARDEN_AT = [27, 45];
const SHOP_ITEMS = [
  { id: 'potion', icon: '🧪', name: 'Healing Potion', price: 35, desc: () => `Heals your active companion completely and you by half. Use it with <b>${BTN.potion()}</b>.` },
  { id: 'strongCube', icon: '💠', name: 'Strong FoldCube', price: 60, desc: () => 'The next catch works when the ✦ bar is only <b>70%</b> full, and the bond ring is <b>easier</b>.' },
  { id: 'treat', icon: '🍬', name: 'XP Treat', price: 50, desc: () => 'Gives <b>+100 XP</b> to your active companion right away. Great for evolving!' },
  { id: 'glasses:sun', icon: '😎', name: 'Sunglasses', price: 40, desc: () => 'Cool sunglasses for your adventurer.' },
  { id: 'scarf:scarf', icon: '🧣', name: 'Scarf', price: 40, desc: () => 'A cozy scarf. Pick its color in "Change my look".' },
  { id: 'hat:pirate', icon: '🏴‍☠️', name: 'Pirate Hat', price: 120, desc: () => 'Arrr! A real pirate hat.' },
  { id: 'hat:wizard', icon: '🧙', name: 'Wizard Hat', price: 150, desc: () => 'A tall purple hat with a star.' },
  { id: 'hat:crown', icon: '👑', name: 'Golden Crown', price: 250, desc: () => 'For the true champion of Virelia.' },
];
const LOCKED = { hat: ['crown', 'pirate', 'wizard', 'hood'], glasses: ['sun'], scarf: ['scarf'], back: ['cape', 'wings', 'jetpack', 'halo'] };
const isUnlocked = (key, id) => !LOCKED[key] || !LOCKED[key].includes(id) || save.unlocked.includes(key + ':' + id);
// shop stall + shopkeeper
const shopStall = new THREE.Group(); scene.add(shopStall);
{
  const y = height(...SHOP_AT); shopStall.position.set(SHOP_AT[0], y, SHOP_AT[1]); shopStall.rotation.y = -0.4;
  bx(shopStall, 3.4, 1.0, 1.2, '#8a5a2b', 0, 0.5, 0); bx(shopStall, 3.6, 0.12, 1.4, '#c9a060', 0, 1.05, 0);
  for (const x of [-1.6, 1.6]) bx(shopStall, 0.15, 2.6, 0.15, '#6e4524', x, 1.3, -0.5);
  for (let i = 0; i < 6; i++) bx(shopStall, 0.6, 0.12, 1.9, i % 2 ? '#ffffff' : '#e53950', -1.5 + i * 0.6, 2.7, -0.1).rotation.x = 0.25;
  for (const [x, c] of [[-1, '#ff5ad6'], [-0.3, '#3ab0ff'], [0.5, '#3ddc84']]) bx(shopStall, 0.25, 0.4, 0.25, mat(c, { e: c, ei: 0.4 }), x, 1.3, 0.2);
  bx(shopStall, 1.4, 0.5, 0.06, '#2a1a0c', 0, 3.25, 0.5);
}
const shopkeeper = buildPerson('villager'); shopkeeper.position.set(SHOP_AT[0] - 0.4, height(...SHOP_AT), SHOP_AT[1] - 1.4); shopkeeper.rotation.y = -0.4; scene.add(shopkeeper);
// Professor Green's garden: a fenced meadow where extra Monstermon live
const gardenGroup = new THREE.Group(); scene.add(gardenGroup);
{
  const y = height(...GARDEN_AT); gardenGroup.position.set(GARDEN_AT[0], y, GARDEN_AT[1]);
  for (let i = 0; i < 28; i++) { const a = i / 28 * 6.28; if (Math.abs(a - 3.6) < 0.25) continue; bx(gardenGroup, 0.15, 0.9, 0.15, '#8a5a2b', Math.cos(a) * 7, 0.45, Math.sin(a) * 7); const r = bx(gardenGroup, 1.6, 0.1, 0.08, '#a8753e', Math.cos(a + 0.11) * 7, 0.7, Math.sin(a + 0.11) * 7); r.rotation.y = -a - Math.PI / 2; }
  bx(gardenGroup, 0.15, 1.6, 0.15, '#6e4524', -6.8, 0.8, -3.6); bx(gardenGroup, 1.6, 0.7, 0.1, '#f0e2c4', -6.8, 1.6, -3.6);
  for (let i = 0; i < 14; i++) { const c = ['#ff5ad6', '#ffd34d', '#5ae0ff', '#ff8c1a'][i % 4]; bx(gardenGroup, 0.2, 0.2, 0.2, mat(c, { e: c, ei: 0.3 }), rand(-5, 5), 0.15, rand(-5, 5)); }
}
let gardenMons = [];
function rebuildGarden() {
  gardenMons.forEach((g) => scene.remove(g.model)); gardenMons = [];
  save.garden.forEach((m, i) => { const model = buildMon(m.sp, 'happy'); scene.add(model); const a = i * 1.7; gardenMons.push({ model, x: GARDEN_AT[0] + Math.cos(a) * 3, z: GARDEN_AT[1] + Math.sin(a) * 3, tx: GARDEN_AT[0], tz: GARDEN_AT[1], t: 0 }); });
}
function updateGarden(dt, t) {
  for (const g of gardenMons) {
    g.t -= dt; if (g.t <= 0) { g.t = rand(2, 5); const a = rand(0, 6.28), r = rand(0, 5); g.tx = GARDEN_AT[0] + Math.cos(a) * r; g.tz = GARDEN_AT[1] + Math.sin(a) * r; }
    const dx = g.tx - g.x, dzz = g.tz - g.z, dl = Math.hypot(dx, dzz), mv = dl > 0.3;
    if (mv) { g.x += dx / dl * 1.5 * dt; g.z += dzz / dl * 1.5 * dt; g.model.rotation.y = Math.atan2(dx, dzz); }
    g.model.position.set(g.x, height(g.x, g.z), g.z); g.model.userData.anim(t, { moving: mv });
  }
}
function markSeen(sp) { if (!save.dex.seen[sp]) { save.dex.seen[sp] = 1; if (state === 'play') toast(`📖 New Monstermon seen: <b>${SPECIES[sp].name}</b>! (${Object.keys(save.dex.seen).length}/${DEX_ORDER.length})`, 3000); } }
function markCaught(sp) {
  save.dex.seen[sp] = 1; if (save.dex.caught[sp]) return; save.dex.caught[sp] = 1;
  const n = Object.keys(save.dex.caught).length, total = DEX_ORDER.length;
  for (const [goal, coins, extra] of [[5, 50, null], [10, 150, null], [25, 250, null], [50, 400, null], [100, 700, null], [total, 2000, 'hat:crown']]) {
    if (n >= goal && !save.dexRewards[goal]) {
      save.dexRewards[goal] = 1; save.coins += coins; if (extra && !save.unlocked.includes(extra)) save.unlocked.push(extra);
      setTimeout(() => { toast(`📖🏆 Dex reward: you caught <b>${goal}</b> different Monstermon! +${coins} 🪙${extra ? ' and the 👑 Golden Crown!' : ''}`, 6000); SFX.win(); }, 1500);
    }
  }
}
function usePotion() {
  if (!comp) return toast('You need a companion first.');
  if (save.items.potion <= 0) return toast(`🧪 You have no Healing Potions. Buy them at the shop in ${PLACE.village} (🛒 on the map).`);
  save.items.potion--; comp.m.hp = comp.m.maxHp; P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.5);
  spark(comp.x, comp.y + 1, comp.z, '#3ddc84', 20); SFX.chime(880); toast(`🧪 ${SPECIES[comp.m.sp].name} is fully healed! (${save.items.potion} potions left)`); renderComp(); renderStats();
}

// ---- overlay helpers (shop, garden, dex, help)
function openOverlay(id) { $(id).classList.remove('hidden'); navEl = null; }
function closeOverlay(id) { $(id).classList.add('hidden'); navEl = null; }
function openShop() {
  openOverlay('shop');
  const owned = (it) => it.id.includes(':') && save.unlocked.includes(it.id);
  $('shopList').innerHTML = `<div class="coins">🪙 ${save.coins} coins · 🧪 ${save.items.potion} · 💠 ${save.items.strongCube}</div>` + SHOP_ITEMS.map((it, i) => `<div class="shopItem"><div class="si">${it.icon}</div><div style="flex:1"><b>${it.name}</b> <span style="color:var(--gold)">${it.price} 🪙</span><div class="sd">${it.desc()}</div></div><button class="btn ${owned(it) ? '' : 'blue'}" data-buy="${i}" ${owned(it) ? 'disabled' : ''}>${owned(it) ? '✔ Owned' : 'Buy'}</button></div>`).join('');
  $('shopList').querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => buy(SHOP_ITEMS[+b.dataset.buy]));
}
function buy(it) {
  if (save.coins < it.price) { SFX.fail(); return toast(`🪙 Not enough coins! You need ${it.price - save.coins} more. Defeat or catch Monstermon to earn coins.`); }
  save.coins -= it.price; SFX.win(); stat('buys');
  if (it.id === 'potion' || it.id === 'strongCube') save.items[it.id]++;
  else if (it.id === 'treat') { if (comp) giveXP(100); else { save.coins += it.price; return toast('You need a companion first.'); } }
  else { save.unlocked.push(it.id); const [k, v] = it.id.split(':'); save.avatar[k] = v; rebuildAvatar(); toast(`${it.icon} ${it.name} equipped! You can change it any time in "Change my look".`); }
  persist(); openShop(); renderStats();
}
function closeShop() { closeOverlay('shop'); }
let gardenSel = 0;
function openGarden() {
  openOverlay('garden');
  const card = (m, extra) => { const d = SPECIES[m.sp]; return `<img class="tport" src="${dexShot(m.sp)}" alt=""><b>${eIcon(m.sp)} ${d.name}</b> <span style="color:#d9c4ff">Lv ${m.lv || 1}</span><div style="font-size:12px;color:var(--muted)">❤️ ${Math.ceil(m.hp)}/${m.maxHp}</div>${extra}`; };
  gardenSel = Math.min(gardenSel, save.team.length - 1);
  $('gTeam').innerHTML = save.team.map((m, i) => `<div class="tmc ${i === gardenSel ? 'on' : ''}" data-sel="${i}">${card(m, `<button class="btn" data-send="${i}" ${save.team.length <= 1 ? 'disabled' : ''}>🌱 Send to garden</button>`)}</div>`).join('');
  $('gGarden').innerHTML = save.garden.length ? save.garden.map((m, i) => `<div class="tmc">${card(m, `<button class="btn blue" data-take="${i}">${save.team.length < 7 ? '⬅ Bring to team' : '🔁 Swap with selected'}</button>`)}</div>`).join('') : '<div style="color:var(--muted)">The garden is empty. When your team is full (7), new catches come here.</div>';
  $('gTeam').querySelectorAll('[data-sel]').forEach((c) => c.onclick = (ev) => { if (ev.target.tagName === 'BUTTON') return; gardenSel = +c.dataset.sel; openGarden(); });
  $('gTeam').querySelectorAll('[data-send]').forEach((b) => b.onclick = () => { const i = +b.dataset.send; const [m] = save.team.splice(i, 1); m.hp = m.maxHp; save.garden.push(m); fixActive(); afterGardenChange(); });
  $('gGarden').querySelectorAll('[data-take]').forEach((b) => b.onclick = () => {
    const i = +b.dataset.take, m = save.garden[i]; m.hp = m.maxHp;
    if (save.team.length < 7) { save.garden.splice(i, 1); save.team.push(m); }
    else { const out = save.team[gardenSel]; out.hp = out.maxHp; save.team[gardenSel] = m; save.garden[i] = out; }
    fixActive(); afterGardenChange();
  });
}
function fixActive() { if (save.active >= save.team.length) save.active = 0; spawnCompanion(save.team[save.active]); }
function afterGardenChange() { SFX.chime(990); rebuildGarden(); persist(); renderComp(); openGarden(); }
function closeGarden() { closeOverlay('garden'); }
const DEX_ORDER = ['dracometal', 'dracotime', 'metasteal', 'metawing', 'pinkypunch', 'pinkyabsorve', 'skipclip', 'rootlock', 'rivolo', 'mossroll', 'glimframe', 'bellbud', 'emberlid', 'hingemaw', 'paperfang', 'inkling', 'staplor', 'lanternix', 'aurorell', ...GEN_IDS];
let dexFilter = 'all'; const DEX_IMG = new Map();
function dexShot(sp) {
  if (DEX_IMG.has(sp)) return DEX_IMG.get(sp);
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xdff2ff, 0x334455, 1.3)); const l = new THREE.DirectionalLight(0xffffff, 2); l.position.set(3, 5, 4); sc.add(l);
  const m = buildMon(sp, 'happy'); sc.add(m); m.userData.anim(0.5, {}); m.rotation.y = 0.5;
  const box = new THREE.Box3().setFromObject(m), sz = box.getSize(new THREE.Vector3()), ct = box.getCenter(new THREE.Vector3());
  const cm = new THREE.PerspectiveCamera(35, 220 / 150, 0.1, 80); cm.position.set(ct.x, ct.y + sz.y * 0.12, ct.z + Math.max(sz.x * 0.85, sz.y) * 1.7 + 0.6); cm.lookAt(ct);
  previewRenderer.setSize(220, 150); previewRenderer.render(sc, cm); const url = previewRenderer.domElement.toDataURL(); previewRenderer.setSize(300, 170);
  DEX_IMG.set(sp, url); return url;
}
function openDex() {
  openOverlay('dex');
  const seen = Object.keys(save.dex.seen).length, caught = Object.keys(save.dex.caught).length, total = DEX_ORDER.length;
  $('dexHead').innerHTML = `👁 Seen <b>${seen}/${total}</b> · 🧊 Caught <b>${caught}/${total}</b> · Rewards at 5, 10, 25, 50, 100 and ${total} caught (the last one gives the 👑 Golden Crown)<div class="tabs">${['all', 'caught', 'seen', ...Object.keys(ELEM)].map((k) => `<button class="btn ${dexFilter === k ? 'blue' : ''}" data-df="${k}">${k === 'all' ? 'All' : k === 'caught' ? '🧊 Caught' : k === 'seen' ? '👁 Seen' : ELEM[k].icon + ' ' + ELEM[k].name}</button>`).join('')}</div>`;
  $('dexHead').querySelectorAll('[data-df]').forEach((b) => b.onclick = () => { dexFilter = b.dataset.df; openDex(); });
  const list = DEX_ORDER.filter((sp) => dexFilter === 'all' || (dexFilter === 'caught' ? save.dex.caught[sp] : dexFilter === 'seen' ? save.dex.seen[sp] : elemOf(sp) === dexFilter));
  $('dexGrid').innerHTML = list.map((sp) => { const d = SPECIES[sp], sn = save.dex.seen[sp], c = save.dex.caught[sp];
    return `<div class="dexc ${sn ? 'rar-' + rarity(sp) : ''} ${c ? 'caught' : sn ? 'seen' : ''}" data-nav="1"><img data-sp="${sp}" alt="" style="width:100%;height:130px;object-fit:contain;border-radius:10px;background:radial-gradient(ellipse at 50% 40%, #1d3a6a, #0a1222 75%)"><b>#${DEX_ORDER.indexOf(sp) + 1} ${sn ? eIcon(sp) + ' ' + d.name : '???'}</b>${sn && d.tier ? ` <span style="color:var(--gold)">${'★'.repeat(d.tier)}</span>` : ''}<div class="ds">${c ? '🧊 Caught' : sn ? '👁 Seen' : 'Not found yet'}</div>${sn ? `<div class="dd">${d.about}</div><div class="dd">Strong vs: ${strongVs(sp)}</div>` : ''}</div>`; }).join('') || '<div style="color:var(--muted)">Nothing here yet. Go explore!</div>';
  const imgs = [...$('dexGrid').querySelectorAll('img[data-sp]')].filter((im) => save.dex.seen[im.dataset.sp]); let i = 0; const tok = openDex.tok = (openDex.tok || 0) + 1;
  const step = () => { if (tok !== openDex.tok || $('dex').classList.contains('hidden')) return; for (let k = 0; k < 4 && i < imgs.length; k++, i++) imgs[i].src = dexShot(imgs[i].dataset.sp); if (i < imgs.length) requestAnimationFrame(step); };
  step();
}
function closeDex() { closeOverlay('dex'); }

// ---- help + legend (everything explained), with a live controller test
const HELP_TABS = [
  ['start', '⭐ Start'], ['controls', '🎮 Controls'], ['map', '🗺️ Map legend'], ['elements', '🔥 Elements'], ['weather', '🌦️ Weather'],
  ['catch', '🧊 Catching'], ['battle', '⚔️ Battle'], ['monsters', '👾 200 Monsters'], ['team', '👥 Team & Garden'], ['world', '🌲 World'], ['pad', '🎮 Controller test'],
];
let helpTab = 'start';
function sym(c, txt) { return `<span class="sym" style="background:${c}"></span>${txt}`; }
function helpHTML(tab) {
  const K = (a, b) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`;
  switch (tab) {
    case 'start': return `<h3>Welcome to Monstermon: Wildfold!</h3><p>You are an adventurer in the magical forest of <b>Virelia</b>. Objects full of memories wake up and become <b>Monstermon</b>. Some are angry, some are sad, and someone is using strange cubes to <b>fold the forest</b>.</p>
      <ul><li>⭐ Follow the <b>yellow light</b> and the <b>⭐ on the map</b>: that is always your next goal.</li><li>📜 Your <b>quests</b> are listed above the map.</li><li>💡 Purple <b>tips</b> appear the first time something new happens.</li><li>The box at the <b>top of the screen</b> always tells you what to do right now.</li><li>⏸ <b>${BTN.pause()}</b> pauses the game; the game also saves itself every 20 seconds.</li></ul>
      <p>Current: ${WEATHERS[WX.type].icon} <b>${WEATHERS[WX.type].name}</b> · ${isNight() ? '🌙 Night' : '☀️ Day'} · Difficulty <b>${save.settings.diff === 'normal' ? 'Normal' : 'Easy'}</b></p>`;
    case 'controls': return `<h3>Controls</h3><table class="ht"><tr><th>Action</th><th>Keyboard + mouse</th><th>PS5 controller</th></tr>
      ${[['Move', 'W A S D', 'Left stick'], ['Turn camera', 'Drag the mouse', 'Right stick'], ['Run', 'Shift', 'R2'], ['Jump / swim up', 'Space', '✕'], ['Roll (dodge)', 'Q', '○'], ['Attack (companion)', 'J or click', 'R1'], ['Skill 1', '1', 'L1'], ['Skill 2', '2', 'L2'], ['Ultimate', '3', 'L1 + R1'], ['Throw FoldCube', 'F', '△'], ['Talk / interact', 'E', '⬜'], ['Healing Potion', 'R', 'R3 (press right stick)'], ['Team', 'Tab', 'Options'], ['Pause menu', 'Esc or P', 'Create'], ['Ride a Monstermon', 'B', 'L3 (press left stick)'], ['Help (this page)', 'H', 'Touchpad or pause menu'], ['Dex', 'X', 'Pause menu'], ['Menus', 'Mouse / arrows', 'D-pad or left stick, ✕ select, ○ back']].map(([a, k, p]) => `<tr><td>${a}</td><td><b>${k}</b></td><td><b>${p}</b></td></tr>`).join('')}</table>`;
    case 'map': return `<h3>Map legend (bottom-right)</h3><table class="ht">
      ${K('➤ White arrow', 'You, pointing where you face')}${K('⭐ Star', 'Where to go next')}${K('N', 'North is always up')}
      ${K(sym('#ff4a4a', 'Red dot'), 'Angry Monstermon (it attacks)')}${K(sym('#5a8aff', 'Blue dot'), 'Sad Monstermon (calm it by watching)')}${K(sym('#ffd34d', 'Big gold dot'), 'Boss')}${K(sym('#6fe3ff', 'Cyan dot'), 'Fold pylon (gives the boss a shield)')}
      ${K(sym('#3ddc84', 'Green dot'), 'Professor Green’s lab (heals your team)')}${K(sym('#ffa040', 'Orange dot'), 'Camp ⛺ (rest, heal and save)')}${K(sym('#b48cff', 'Purple dot'), 'Nira (side quests)')}${K(sym('#e53950', 'Red/white dot'), 'Shop 🛒')}${K(sym('#9ad66a', 'Light green dot'), 'Green’s garden 🌱')}${K('💚 Big green dot', 'Baba')}
      ${K(sym('#c8a060', 'Tan bar'), 'Root bridge (dark brown = folded)')}${K(sym('#3ad0ff', 'Blue box'), 'The folded gate in the Cut Mountain')}${K(sym('#ffcf3a', 'Gold dot'), 'Trophy room')}${K(sym('#ffffff', 'White dot'), 'Race flag')}${K(sym('#2a6ab0', 'Blue'), 'Water (river and lake)')}${K(sym('#8a8f98', 'Grey'), 'Mountain')}</table>
      <h3>Labels above creatures</h3><table class="ht">${K('🔥💧🌿⚙️🌪️🪨✨', 'Its element')}${K('😠 / 😢', 'Angry or sad')}${K('🧩', 'A cube fragment is stuck inside it')}${K('🌙', 'Night monster (runs away at sunrise)')}${K('Green/red bar', 'Its health')}${K('Blue bar ✦', 'How ready it is to be caught')}${K('🎯', 'Your current target')}</table>`;
    case 'elements': return `<h3>Elements: who beats whom</h3><p>Every Monstermon has an element. If your attack's element <b>beats</b> the enemy's, it is <b style="color:var(--gold)">Super effective! ×2</b>. If the enemy's element beats yours, it is <b>Not very effective ×½</b>. The same rules work when monsters attack your companion!</p>
      <table class="ht"><tr><th>Element</th><th>Strong against (×2)</th><th>Weak against (×½)</th><th>Monstermon</th></tr>${Object.keys(ELEM).map((k) => `<tr><td><b>${ELEM[k].icon} ${ELEM[k].name}</b></td><td>${STRONG[k].map((x) => ELEM[x].icon + ' ' + ELEM[x].name).join(', ')}</td><td>${Object.keys(STRONG).filter((o) => STRONG[o].includes(k)).map((x) => ELEM[x].icon + ' ' + ELEM[x].name).join(', ')}</td><td>${Object.keys(SP_ELEM).filter((sp) => SP_ELEM[sp] === k).map((sp) => SPECIES[sp].name).join(', ')}</td></tr>`).join('')}</table>
      <p>💡 Easy way to remember: 🔥 burns 🌿 · 💧 puts out 🔥 · 🌿 drinks 💧 · 🌪️ blows away 🔥 · 🪨 blocks 🌪️ · ⚙️ breaks 🪨 · ✨ shines through 🌪️ and 💧.</p>`;
    case 'weather': return `<h3>Weather</h3><p>The weather changes by itself every minute or two. Your clothes change to match it (you can switch this off in the pause menu), and some elements get stronger or weaker.</p><table class="ht"><tr><th>Weather</th><th>Your clothes</th><th>What happens</th></tr>
      ${K('☀️ Sunny', 'T-shirt, shorts, sunglasses, cap')}<tr><td colspan="2" class="sub">🔥 Fire ×1.3 · ✨ Light ×1.2</td></tr>
      ${K('⛅ Cloudy', 'Your own clothes')}<tr><td colspan="2" class="sub">No bonus</td></tr>
      ${K('🌧️ Rain', 'Yellow raincoat, hood, rain boots')}<tr><td colspan="2" class="sub">💧 Water ×1.3 · 🔥 Fire ×0.7 · sometimes thunder and lightning</td></tr>
      ${K('🌫️ Fog', 'Hoodie, long pants')}<tr><td colspan="2" class="sub">You can't see far: use the map · ✨ Light ×1.3</td></tr>
      ${K('🌬️ Windy', 'Jacket, scarf, beanie')}<tr><td colspan="2" class="sub">Leaves fly and the wind pushes you a little · 🌪️ Wind ×1.3</td></tr>
      ${K('❄️ Snow', 'Big blue puffer jacket, long blue pants, warm hat, scarf, boots')}<tr><td colspan="2" class="sub">The ground turns white · 🪨 Stone ×1.25 · 🌿 Plant ×0.8</td></tr></table>
      <h3>Day and night</h3><p>A full day lasts 6 minutes. At night monsters hit <b>harder</b>, extra 🌙 night monsters appear and run away at sunrise, and their eyes glow. 🔦 When it gets dark (at night, or in rain, fog or snow) the <b>headlamp</b> on your hat switches on by itself, like a miner, and lights the way in front of you.</p>`;
    case 'catch': return `<h3>Catching Monstermon</h3><ol><li><b>Fill the ✦ bar</b> (blue bar under its name):<ul><li>😠 <b>Angry</b> ones: fight them until the bar is full.</li><li>😢 <b>Sad</b> ones: don't fight! <b>Walk slowly</b> close to them and just watch. Running or attacking scares them.</li></ul></li>
      <li>Press <b>${BTN.cube()}</b> to start the <b>bond moment</b>: time slows down and two rings appear.</li><li>Press <b>${BTN.cube()}</b> <b>again</b> when the <b style="color:#6fe3ff">blue ring</b> touches the <b style="color:#ffd34d">gold ring</b>. <b>PERFECT</b> or <b>Good</b> = the FoldCube flies and catches it!</li><li>Too early or too late? It gets scared: fill the bar a little again and retry.</li></ol>
      <p>⚡ <b>Easiest way:</b> just <b>defeat</b> a wild Monstermon: your FoldCube flies by itself and catches it automatically (you also get XP and coins).</p><p>💠 A <b>Strong FoldCube</b> from the shop works at 70% and makes the rings easier.</p>`;
    case 'monsters': return `<h3>200 wild Monstermon</h3><p>In Virelia, everyday objects full of memories wake up as creatures: kettles, spoons, brooms, kites, bricks, lamps… There are <b>200 different wild Monstermon</b> (plus the starters and their evolutions). Each one has an <b>element</b>, a <b>strength</b> from ★ to ★★★★★, an <b>attack style</b> and one or two <b>special abilities</b>.</p>
      <ul><li>They live in different <b>places</b>: the forest, around the lake, the hills, the Cut Mountain and the Folded City.</li><li>Some only appear <b>at night</b> or in certain <b>weather</b> (rain, snow, fog, wind, sun). You get a message when a rare one shows up.</li><li>Stronger ones (★★★★, ★★★★★ ALPHA) appear when you get further in the story.</li><li>The <b>Dex</b> (📖) shows every one you have seen and caught. Rewards at 5, 10, 25, 50, 100 and all caught!</li></ul>
      <h3>Special abilities</h3><table class="ht">${Object.keys(ABILITIES).map((a) => `<tr><td><b>${ABILITIES[a][0]} ${ABILITIES[a][1]}</b></td><td>${ABILITIES[a][2]}</td></tr>`).join('')}</table>
      <h3>Extra attack styles</h3><table class="ht"><tr><td><b>🔴🔴🔴 Volley</b></td><td>Three circles in a row towards you. Step to the side.</td></tr><tr><td><b>🌵 Spikes</b></td><td>Spikes all around the monster. Keep your distance.</td></tr><tr><td><b>🕳️ Burrow</b></td><td>It digs underground and pops up under you (brown circle).</td></tr></table>`;
    case 'battle': return `<h3>Battle</h3><p>You give orders and your companion fights: <b>${BTN.attack()}</b> attack, <b>${BTN.skill1()}</b>/<b>${BTN.skill2()}</b> skills, <b>${BTN.ult()}</b> ultimate (it charges while you hit). Roll with <b>${BTN.dodge()}</b>. The top box always warns you.</p><table class="ht"><tr><th>On the ground</th><th>Meaning</th></tr>
      ${K('🔴 Red circle', 'A bite or slam lands there. Step out or roll!')}${K('🟥 Red stripe', 'A charge in a straight line (Mossroll, Hingemaw). Step to the side!')}${K('🔴 Circle far away', 'A pounce (Skipclip, Paperfang). Roll just before it lands!')}${K('🟡 Yellow circle', 'Glimframe’s beam. Keep moving!')}${K('🔵 Blue circle', 'Rivolo’s geyser throws you up.')}${K('🟣 Purple circle', 'Bellbud’s sound wave slows you.')}${K('🟠 Orange patch', 'Burning embers from Emberlid. Don’t stand in them!')}</table>
      <p>🛡️ <b>Bosses</b> can have a shield from pylons: destroy the pylons first. After big attacks the boss gets <b>stuck</b> and its fragment takes ×2 damage. Below half health it gets angry (phase 2).</p><p>❤️ If you get very low, 💪 <b>Baba</b> comes running. If your whole team gets tired, you wake up at the camp.</p>`;
    case 'team': return `<h3>Team, levels and evolution</h3><ul><li>Up to <b>7</b> Monstermon travel with you. Switch with <b>${BTN.team()}</b>.</li><li>Fighting and catching gives <b>XP</b> (purple bar). Every level = more HP and stronger hits.</li><li>The three starters <b>evolve at level ${EVO_LV}</b>: Dracometal → Dracotime, Metasteal → Metawing, Pinkypunch → Pinkyabsorve.</li><li>Heal your team at <b>Professor Green</b>, at the <b>camp</b>, or with a 🧪 potion (<b>${BTN.potion()}</b>).</li></ul>
      <h3>🌱 Professor Green's garden</h3><p>East of the lab. When your team is full, new catches live here. Walk into the garden and press <b>${BTN.talk()}</b> to <b>bring them back</b> or <b>swap</b> them with team members.</p>
      <h3>🛒 Shop</h3><p>In the village. Spend 🪙 coins on 🧪 Healing Potions, 💠 Strong FoldCubes, 🍬 XP Treats, and cool clothes (sunglasses, scarf, pirate hat, wizard hat, golden crown).</p>
      <h3>📖 Dex</h3><p>Shows every Monstermon you have seen and caught. Rewards at 5, 10 and all 19 caught.</p>`;
    case 'world': return `<h3>People and places</h3><table class="ht">${K('👨‍🔬 Professor Green', 'Gives you your starter and heals your team')}${K('🟣 Nira', 'At the camp. Side quests with rewards')}${K('🛒 Shopkeeper', 'Sells items and clothes')}${K('❤️ Baba', 'When you are almost out of health he runs to you, gives you a big hug, and does a SLAM: the wave drops every evil creature nearby to 1% health. Then he heals everyone. He also visits with rewards.')}${K('😊 Valeza', 'Friendly lake creature: swim with her to be 2x faster')}${K('😠 Kraku', 'Mean lake creature: chases swimmers')}${K('🍄 Singing mushrooms', 'Open and sing when you are close (Nira loves them)')}${K('⛺ Camp', 'Rest, heal, save, and feed / pet / play with your Monstermon')}${K('🏁 Race flag', 'Race Skipclip through 8 rings (north of the village start)')}${K('🏆 Trophy room', 'Your medals (village, east of the start)')}${K('🧬 Morph Lab', 'West of the village start (purple dot). Fuse two caught Monstermon into a brand-new, stronger Morph that you can name. Costs 50 coins.')}${K('🎣 Lake shore', 'Press E to fish. Valeza makes it easier')}${K('🔷 Lift', 'In front of the mountain gate: goes up to the Folded City (Chapter 2)')}${K('🐉 Skyfang', 'Your dragon! Press G (or the 🐉 button) to fly anywhere. Space / ⬆️ up, Q / 🔄 down')}${K('🎁 Chests', 'Gold squares on the map. Solve math puzzles to open them: clothes, accessories, a gift Monstermon and ⬆️ Elevation Cards (+1 level, use them in Team)')}${K('🗺️ The five lands', 'Songwood Forest (Lv 1–8) in the middle, Ember Wastes east (10–25), Frostveil Tundra west (14–28), Gloomfen Swamp south (18–32), Shattered Peaks north (30–50)')}${K('🎩 Count Crease', 'The villain who folds the forest')}${K('🌌 Aurorell', 'Legendary: mountain top, only on snowy nights')}${K('⛰️ The Cut Mountain', 'Far north, with a mysterious folded gate. Stronger monsters!')}</table>`;
    case 'pad': return `<h3>Controller test</h3><p id="padStatus"></p><div id="padBtns" class="padgrid"></div><div class="sticks"><div class="stick"><div id="stickL"></div></div><div class="stick"><div id="stickR"></div></div></div><div class="row"><button class="btn blue" id="rumbleBtn">📳 Test vibration</button></div><p style="color:var(--muted)">Press every button: it lights up here. Move both sticks: the dots should follow. If something does not light up, tell me which one.</p>`;
  }
  return '';
}
const PAD_NAMES = ['✕', '○', '⬜', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3', 'D-pad ↑', 'D-pad ↓', 'D-pad ←', 'D-pad →', 'PS', 'Touchpad'];
function openHelp(tab) {
  if (tab) helpTab = tab;
  openOverlay('help');
  $('helpTabs').innerHTML = HELP_TABS.map(([k, l]) => `<button class="btn ${k === helpTab ? 'blue' : ''}" data-tab="${k}">${l}</button>`).join('');
  $('helpTabs').querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { openHelp(b.dataset.tab); const nb = $('helpTabs').querySelector(`[data-tab="${helpTab}"]`); if (pad.on && nb) setNav(nb); });
  $('helpBody').innerHTML = (helpTab === 'start' ? '<div class="row" style="margin:0 0 8px"><button class="btn blue" id="replayTut">🎓 Play the tutorial</button></div>' : '') + helpHTML(helpTab);
  if ($('replayTut')) $('replayTut').onclick = () => { closeHelp(); openTutorial(); };
  if (helpTab === 'pad') { $('padBtns').innerHTML = PAD_NAMES.map((n, i) => `<div class="pb" id="pb${i}">${n}</div>`).join(''); $('rumbleBtn').onclick = () => { rumble(1, 700); toast(pad.on ? '📳 Did the controller vibrate?' : '🎮 No controller connected yet.'); }; }
}
function closeHelp() { closeOverlay('help'); }
function updatePadTest() {
  if (helpTab !== 'pad' || $('help').classList.contains('hidden') || !$('padStatus')) return;
  const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find((g) => g && g.connected);
  $('padStatus').innerHTML = gp ? `✅ Connected: <b>${gp.id}</b> · mapping: ${gp.mapping || 'unknown'}${gp.mapping !== 'standard' ? ' ⚠️ (not standard: some buttons may be different)' : ''}` : '❌ No controller found. Connect your PS5 controller with a USB-C cable (or Bluetooth) and press any button.';
  if (!gp) return;
  PAD_NAMES.forEach((_, i) => { const el = $('pb' + i); if (el) el.classList.toggle('on', !!(gp.buttons[i] && gp.buttons[i].pressed)); });
  const st = (id, x, y) => { const el = $(id); if (el) { el.style.left = (50 + x * 40) + '%'; el.style.top = (50 + y * 40) + '%'; } };
  st('stickL', gp.axes[0] || 0, gp.axes[1] || 0); st('stickR', gp.axes[2] || 0, gp.axes[3] || 0);
}

// ---- controller / keyboard navigation for every menu (D-pad or stick to move, ✕ to select, ○ to go back)
let navEl = null;
const NAV_OVERLAYS = ['help', 'shop', 'garden', 'dex', 'teamMenu', 'choose'];
function topOverlay() { for (const id of NAV_OVERLAYS) if (!$(id).classList.contains('hidden')) return id; if (state === 'creator') return 'creator'; return null; }
function navFocusables(id) { return [...$(id).querySelectorAll('button, [data-nav], .tmc, .chip, .sw')].filter((el) => el.offsetParent !== null && !el.disabled); }
function setNav(el) { if (navEl) navEl.classList.remove('focus'); navEl = el; if (el) { el.classList.add('focus'); el.scrollIntoView({ block: 'nearest' }); } }
function navMove(dx, dy) {
  const id = topOverlay(); if (!id) return; const els = navFocusables(id); if (!els.length) return;
  if (!navEl || !els.includes(navEl)) { setNav(els[0]); SFX.tick(); return; }
  const r = navEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let best = null, bs = 1e9;
  for (const el of els) {
    if (el === navEl) continue;
    const q = el.getBoundingClientRect(), vx = q.left + q.width / 2 - cx, vy = q.top + q.height / 2 - cy, along = vx * dx + vy * dy;
    if (along <= 4) continue;
    const score = along + Math.abs(vx * dy - vy * dx) * 2.5; if (score < bs) { bs = score; best = el; }
  }
  if (best) { setNav(best); SFX.tick(); }
}
function navBack(id) { (EXTRA_BACK[id] || ({ help: closeHelp, shop: closeShop, garden: closeGarden, dex: closeDex, teamMenu: closeTeam })[id])?.(); }
const navStick = { dir: '', t: 0 };
function padMenuNav(gp, edge) {
  const id = topOverlay(); if (!id) return false;
  if (edge(12)) navMove(0, -1); if (edge(13)) navMove(0, 1); if (edge(14)) navMove(-1, 0); if (edge(15)) navMove(1, 0);
  const x = gp.axes[0] || 0, y = gp.axes[1] || 0, mag = Math.hypot(x, y), now = performance.now();
  const dir = mag > 0.6 ? (Math.abs(x) > Math.abs(y) ? (x > 0 ? 'r' : 'l') : (y > 0 ? 'd' : 'u')) : '';
  if (dir && (dir !== navStick.dir || now - navStick.t > 280)) { navStick.t = now; ({ r: () => navMove(1, 0), l: () => navMove(-1, 0), d: () => navMove(0, 1), u: () => navMove(0, -1) })[dir](); }
  navStick.dir = dir;
  if (edge(0)) { if (navEl && navFocusables(id).includes(navEl)) navEl.click(); else navMove(0, 1); }
  if (edge(1)) navBack(id);
  if (edge(9) && id === 'teamMenu') closeTeam();
  if (edge(17) && id === 'help') closeHelp();
  return true;
}

// ====================================================================== UI for the new systems (injected so the HTML stays small)
document.head.insertAdjacentHTML('beforeend', `<style>
  .rar-r1 { border-color: #b0743a !important; } .rar-r3 { border-color: #c8d2dc !important; box-shadow: 0 0 8px rgba(200,210,220,.35); }
  .rar-r4 { border-color: #ffd34d !important; box-shadow: 0 0 12px rgba(255,211,77,.45); } .rar-rs { border-color: #47b4ff !important; }
  .rar-r5, .rar-leg { border-color: transparent !important; background: linear-gradient(#0e1830, #0e1830) padding-box, linear-gradient(120deg, #ff5a8a, #ffd34d, #3ddc84, #3ab0ff, #b48cff, #ff5a8a) border-box !important; background-size: 100% 100%, 300% 300% !important; animation: holo 3s linear infinite; box-shadow: 0 0 18px rgba(180,140,255,.55); }
  @keyframes holo { to { background-position: 0 0, 300% 0; } }
  .tmc.on { outline: 3px solid var(--cyan); outline-offset: 2px; }
  img.tport { width: 100%; height: 130px; object-fit: contain; display: block; border-radius: 10px; margin-bottom: 6px; background: radial-gradient(ellipse at 50% 40%, #1d3a6a, #0a1222 75%); }
  img.cport { float: left; width: 64px; height: 64px; object-fit: contain; margin: -2px 10px 2px -2px; border-radius: 12px; background: radial-gradient(ellipse at 50% 40%, #1d3a6a, #0a1222 75%); border: 1px solid #16264a; }
  #comp .skills { clear: both; }
  #cineTop, #cineBot { position: fixed; left: 0; right: 0; height: 0; background: #000; z-index: 15; transition: height .5s; }
  #cineTop { top: 0; } #cineBot { bottom: 0; } body.cine #cineTop, body.cine #cineBot { height: 13vh; }
  #cineTitle { position: fixed; left: 0; right: 0; bottom: 16vh; text-align: center; z-index: 16; font-size: 54px; font-weight: 900; color: #fff; letter-spacing: 3px; text-shadow: 0 4px 20px #000, 0 0 30px rgba(255,60,40,.7); opacity: 0; transition: opacity .6s; pointer-events: none; }
  #cineTitle small { display: block; font-size: 20px; letter-spacing: 6px; color: var(--gold); }
  .bubble { position: fixed; z-index: 8; transform: translate(-50%, -100%); background: #fff; color: #e53950; font-weight: 900; font-size: 22px; padding: 10px 18px; border-radius: 20px; border: 3px solid #e53950; white-space: nowrap; pointer-events: none; }
  .bubble:after { content: ''; position: absolute; left: 50%; bottom: -14px; transform: translateX(-50%); border: 8px solid transparent; border-top-color: #e53950; }
  #fishUI { position: fixed; left: 50%; bottom: 140px; transform: translateX(-50%); z-index: 9; width: 420px; background: rgba(7,11,22,.92); border: 2px solid var(--cyan); border-radius: 16px; padding: 12px 16px; text-align: center; font-weight: 800; }
  #fishBar { position: relative; height: 26px; border-radius: 13px; background: #0a1a33; margin-top: 10px; overflow: hidden; }
  #fishZone { position: absolute; top: 0; bottom: 0; background: rgba(61,220,132,.55); border: 2px solid #3ddc84; border-radius: 10px; }
  #fishNeedle { position: absolute; top: -2px; bottom: -2px; width: 6px; background: #ffd34d; border-radius: 3px; box-shadow: 0 0 10px #ffd34d; }
  .medal { display: flex; gap: 12px; align-items: center; background: var(--panel2); border: 2px solid var(--line); border-radius: 14px; padding: 10px; } .medal .mi { font-size: 34px; filter: grayscale(1) opacity(.35); } .medal.got { border-color: var(--gold); } .medal.got .mi { filter: none; }
  .care { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; margin-top: 10px; }
  .hbar { height: 10px; border-radius: 6px; background: #2a1030; overflow: hidden; margin: 6px 0; } .hbar div { height: 100%; background: linear-gradient(90deg, #ff5ad6, #ffd34d); }
  .pcard { background: var(--panel2); border: 2px solid var(--line); border-radius: 16px; padding: 14px; cursor: pointer; text-align: center; font-size: 18px; font-weight: 900; } .pcard small { display: block; color: var(--muted); font-size: 13px; font-weight: 600; }
  #medalPop { position: fixed; left: 50%; top: 22%; transform: translateX(-50%) scale(.6); z-index: 14; background: linear-gradient(180deg, #3a2a00, #1a1200); border: 3px solid var(--gold); border-radius: 22px; padding: 16px 28px; text-align: center; opacity: 0; transition: all .4s; pointer-events: none; }
  #medalPop.show { opacity: 1; transform: translateX(-50%) scale(1); } #medalPop .mi { font-size: 54px; } #medalPop b { display: block; font-size: 22px; color: var(--gold); }
</style>`);
document.body.insertAdjacentHTML('beforeend', `
<div id="cineTop"></div><div id="cineBot"></div><div id="cineTitle"></div><div id="medalPop"></div>
<div id="fishUI" class="hidden"><div id="fishTxt"></div><div id="fishBar"><div id="fishZone"></div><div id="fishNeedle"></div></div></div>
<div id="care" class="overlay hidden"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h2>⛺ Camp: take care of your Monstermon</h2><button class="btn" id="careClose">✖ Close</button></div><div style="color:var(--muted)">Happy Monstermon (💖 70+) fight <b>15% stronger</b>. Sad ones (😞 below 25) fight weaker. Feeding costs 5 🪙, petting and playing are free.</div><div class="care" id="careList"></div></div></div>
<div id="medals" class="overlay hidden"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h2>🏅 Trophy room</h2><button class="btn" id="medalsClose">✖ Close</button></div><div id="medalHead" style="color:var(--muted)"></div><div class="tm" id="medalList"></div></div></div>
<div id="profiles" class="overlay hidden"><div class="panel"><h2>👋 Who is playing?</h2><div style="color:var(--muted)">Every player has their own adventure, team and medals.</div><div class="tm" id="profList"></div></div></div>
<div id="parent" class="overlay hidden"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h2>👪 Parent settings</h2><button class="btn" id="parentClose">✖ Close</button></div><div id="parentBody"></div></div></div>
<div id="rest" class="overlay hidden"><div class="panel" style="text-align:center"><h2>😴 Time to rest!</h2><p style="font-size:20px">Professor Green: <i>"You played really well today! Monstermon need rest too. See you tomorrow, adventurer!"</i></p><div id="restBody"></div></div></div>`);
NAV_OVERLAYS.push('profiles', 'care', 'medals', 'parent', 'rest');
const EXTRA_BACK = { care: () => closeOverlay('care'), medals: () => closeOverlay('medals'), parent: () => closeOverlay('parent') };
$('careClose').onclick = EXTRA_BACK.care; $('medalsClose').onclick = EXTRA_BACK.medals; $('parentClose').onclick = EXTRA_BACK.parent;

// ====================================================================== stats + medals
function stat(k, add = 1) { save.stats[k] = (save.stats[k] || 0) + add; checkMedals(); }
const MEDALS = [
  ['firstCatch', '🧊', 'First Catch', 'Catch your first wild Monstermon', () => (save.stats.catches || 0) >= 1],
  ['rainCatch', '🌧️', 'Rain Catcher', 'Catch 3 Monstermon in the rain', () => (save.stats.rainCatches || 0) >= 3],
  ['snowCatch', '❄️', 'Snow Explorer', 'Catch a Monstermon in the snow', () => (save.stats.snowCatches || 0) >= 1],
  ['nightOwl', '🦉', 'Night Owl', 'Defeat 5 monsters at night', () => (save.stats.nightWins || 0) >= 5],
  ['bridge', '🌉', 'Bridge Saver', 'Free Rootlock and unfold the bridge', () => !!save.stats.rootlock],
  ['untouchable', '🛡️', 'Untouchable', 'Defeat a boss without getting hit once', () => !!save.stats.noHitBoss],
  ['evolve', '✨', 'Evolution!', 'Evolve a Monstermon', () => (save.stats.evolves || 0) >= 1],
  ['rider', '🐉', 'Rider', 'Ride a Monstermon', () => (save.stats.rides || 0) >= 1],
  ['fisher', '🎣', 'Fisher', 'Catch 5 fish at the lake', () => (save.stats.fish || 0) >= 5],
  ['speedy', '🏁', 'Speedy', 'Win the race against Skipclip', () => (save.stats.raceWins || 0) >= 1],
  ['friends', '💖', 'Best Friends', 'Make a Monstermon 100% happy', () => !!save.stats.fullHappy],
  ['collector', '📖', 'Collector', 'Catch 10 different Monstermon', () => Object.keys(save.dex.caught).length >= 10],
  ['folded', '📜', 'Fold Breaker', 'Defeat Foldragon in the Folded City', () => !!save.stats.foldragon],
  ['legend', '🌌', 'Legend Seeker', 'Catch the legendary Aurorell', () => !!save.dex.caught.aurorell],
  ['baba', '❤️', 'Baba’s Hug', 'Get a hug from Baba', () => (save.stats.hugs || 0) >= 1],
  ['shopper', '🛒', 'Shopper', 'Buy something at the shop', () => (save.stats.buys || 0) >= 1],
];
function checkMedals() {
  for (const [id, icon, name, desc, ok] of MEDALS) if (!save.medals[id] && ok()) {
    save.medals[id] = Date.now();
    const pop = $('medalPop'); pop.innerHTML = `<div class="mi">${icon}</div><b>MEDAL: ${name}</b>${desc}`; pop.classList.add('show'); SFX.win(); rumble(0.6, 400);
    clearTimeout(checkMedals._t); checkMedals._t = setTimeout(() => pop.classList.remove('show'), 3500);
    tip('medals', `🏅 You earned a <b>medal</b>! See them all in the <b>Trophy room</b> 🏆 in the village (gold dot on the map).`, '🏅 Medals');
  }
}
function openMedals() {
  openOverlay('medals');
  const n = Object.keys(save.medals).length;
  $('medalHead').innerHTML = `You have <b>${n}/${MEDALS.length}</b> medals.`;
  $('medalList').innerHTML = MEDALS.map(([id, icon, name, desc]) => `<div class="medal ${save.medals[id] ? 'got' : ''}" data-nav="1"><div class="mi">${icon}</div><div><b>${name}</b><div style="font-size:12px;color:var(--muted)">${desc}</div>${save.medals[id] ? '<div style="font-size:12px;color:var(--gold)">✔ Earned</div>' : ''}</div></div>`).join('');
}
const TROPHY_AT = [14, 67];
const trophyHut = new THREE.Group(); scene.add(trophyHut);
{
  const y = height(...TROPHY_AT); trophyHut.position.set(TROPHY_AT[0], y, TROPHY_AT[1]); trophyHut.rotation.y = Math.PI;
  bx(trophyHut, 3.4, 2.6, 2.6, '#f0e2c4', 0, 1.3, 0); const r = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.6, 4), mat('#ffcf3a', { m: 0.4, r: 0.3 })); r.position.y = 3.4; r.rotation.y = Math.PI / 4; trophyHut.add(r);
  bx(trophyHut, 2.8, 0.12, 0.5, '#8a5a2b', 0, 1.0, 1.45); bx(trophyHut, 2.8, 0.12, 0.5, '#8a5a2b', 0, 1.8, 1.45);
  trophyHut.userData.cups = [];
  for (let i = 0; i < 16; i++) { const c = bx(trophyHut, 0.2, 0.3, 0.2, mat('#ffcf3a', { m: 0.7, r: 0.25, e: '#ff9a1a', ei: 0.3 }), -1.2 + (i % 8) * 0.34, i < 8 ? 1.22 : 2.02, 1.45); c.visible = false; trophyHut.userData.cups.push(c); }
}
function updateTrophies() { const n = Object.keys(save.medals).length; trophyHut.userData.cups.forEach((c, i) => c.visible = i < n); }

// ====================================================================== BABA: hug, slam wave (evil creatures drop to 1%), "I LOVE YOU BABA"
const BABA = { phase: '', t: 0, bubbleT: 0 };
const babaBusy = () => BABA.phase === 'hug' || BABA.phase === 'slam';
let bubbleEl = null;
function showBubble(text, ms = 3600) { if (!bubbleEl) { bubbleEl = document.createElement('div'); bubbleEl.className = 'bubble'; document.body.appendChild(bubbleEl); } bubbleEl.textContent = text; bubbleEl.style.display = ''; BABA.bubbleT = ms / 1000; }
function babaStart() {
  BABA.phase = 'hug'; BABA.t = 0; D.state = 'busy'; P.iframes = 6; stat('hugs');
  toast('❤️ <b>BABA</b> gives you a big hug!', 2500); SFX.chime(660); rumble(0.4, 600);
}
function updateBaba(dt, t) {
  if (BABA.bubbleT > 0) {
    BABA.bubbleT -= dt;
    const p = new THREE.Vector3(P.x, P.y + 2.9, P.z).project(camera);
    if (bubbleEl) { bubbleEl.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; bubbleEl.style.top = ((1 - p.y) / 2 * innerHeight) + 'px'; if (BABA.bubbleT <= 0) bubbleEl.style.display = 'none'; }
  }
  if (!BABA.phase) return;
  BABA.t += dt; const u = uncle.userData;
  if (BABA.phase === 'hug') {
    // Baba stands right in front of the boy and wraps his arms around him
    const hx = Math.sin(P.yaw), hz = Math.cos(P.yaw);
    D.x = P.x + hx * 0.75; D.z = P.z + hz * 0.75; uncle.position.set(D.x, height(D.x, D.z), D.z); uncle.rotation.y = Math.atan2(P.x - D.x, P.z - D.z);
    u.arms[0].rotation.set(-1.5, 0, 0.9); u.arms[1].rotation.set(-1.5, 0, -0.9); u.legs.forEach((l) => l.rotation.x = 0); u.body.rotation.x = 0.15;
    if (Math.random() < 0.25) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: '#ff4a7a' })); h.position.set(P.x + rand(-0.5, 0.5), P.y + 2 + rand(0, 0.5), P.z + rand(-0.5, 0.5)); scene.add(h); fx.push({ m: h, v: new THREE.Vector3(0, 1.4, 0), t: 1, smoke: true, max: 1 }); }
    if (BABA.t > 2.2) { BABA.phase = 'slam'; BABA.t = 0; u.arms.forEach((a) => a.rotation.set(0, 0, 0)); roar(0.55, true); toast('💪 BABA jumps up for a <b>SLAM</b>!', 2000); }
  } else if (BABA.phase === 'slam') {
    const k = Math.min(1, BABA.t / 1.1), y0 = height(D.x, D.z);
    uncle.position.set(D.x, y0 + Math.sin(k * Math.PI) * 7, D.z); uncle.rotation.y += dt * 4;
    u.arms.forEach((a) => a.rotation.x = -2.9); u.legs.forEach((l, i) => l.rotation.x = i ? 0.6 : -0.6);
    if (k >= 1) {
      BABA.phase = 'helpout'; BABA.t = 0; uncle.position.y = y0;
      // the shockwave: every evil creature nearby drops to 1% health
      rumble(1, 900); SFX.big(); smoke(D.x, y0 + 0.4, D.z, 14); shake(0.9, 0.9); elemVfx('stone', D.x, y0 + 0.5, D.z, true); spark(D.x, y0 + 0.5, D.z, '#ffd34d', 30);
      for (let r = 1; r <= 4; r++) setTimeout(() => ring(D.x, D.z, r * 7, r % 2 ? '#ffd34d' : '#ff7a1a'), r * 90);
      let n = 0;
      for (const e of enemies) {
        if (!e.alive || (e.kind !== 'mon') || dist2(e.x, e.z, D.x, D.z) > 34) continue;
        if (e.hp > e.max * 0.01) { e.hp = Math.max(1, e.max * 0.01); n++; e.hitT = 0.25; e.staggerT = 2.5; floatText(e.x, e.y + (e.boss ? 5 : 2), e.z, '1%!', '#ffd34d'); if (e.catchable && !e.boss) e.ready = 1; }
      }
      toast(n ? `🌊 <b>BABA SLAM!</b> The wave knocked ${n} evil creature${n > 1 ? 's' : ''} down to <b>1% health</b>!` : '🌊 <b>BABA SLAM!</b> The ground shakes!', 4000);
      tip('babaslam', `🌊 Baba's <b>slam wave</b> drops every evil creature nearby to <b>1% health</b>. It is the perfect moment to <b>catch</b> them (they are ✦ ready) or finish them off!`, '❤️ Baba');
      uncleHelp(false);
    }
  } else if (BABA.phase === 'helpout') { if (D.state !== 'helping') BABA.phase = ''; }
}

// ====================================================================== cinematic boss intros
const CINE = { t: 0, e: null, max: 3.8 };
function cinematic(e, title, sub) {
  CINE.t = CINE.max; CINE.e = e; document.body.classList.add('cine');
  $('cineTitle').innerHTML = `<small>${sub}</small>${title}`; setTimeout(() => $('cineTitle').style.opacity = 1, 700);
  if (e.atkT !== undefined) e.atkT += CINE.max; roar(0.45, true); rumble(1, 1200); SFX.big();
}
function updateCine(dt) {
  if (CINE.t <= 0) return false;
  CINE.t -= dt; const e = CINE.e, k = 1 - CINE.t / CINE.max, a = Math.atan2(P.x - e.x, P.z - e.z) + Math.sin(k * 2) * 0.6;
  const big = e.sp === 'foldragon', d = (big ? 20 : e.boss ? 13 : 7) - k * 4, h = big ? 8 + k * 2 : e.boss ? 4 + k * 1.5 : 2;
  camera.position.lerp(new THREE.Vector3(e.x + Math.sin(a) * d, e.y + h, e.z + Math.cos(a) * d), 0.08);
  camera.lookAt(e.x, e.y + (big ? 6.5 : e.boss ? 3.5 : 1.2), e.z);
  if (CINE.t <= 0) { document.body.classList.remove('cine'); $('cineTitle').style.opacity = 0; cam.snap = true; }
  return true;
}

// ====================================================================== riding
const RIDEABLE = { metawing: { kind: 'fly', seat: 1.55, speed: 11, label: 'fly' }, aurorell: { kind: 'fly', seat: 1.9, speed: 12, label: 'fly' }, mossroll: { kind: 'roll', seat: 1.0, speed: 13, label: 'roll' }, rivolo: { kind: 'swim', seat: 1.35, speed: 10, label: 'swim fast' } };
const RIDE = { on: false, kind: '', cool: 0 };
function toggleRide() {
  if (RIDE.on) return dismount('You hopped off.');
  if (!comp || comp.trial) return;
  const r = RIDEABLE[comp.m.sp];
  if (!r) return toast(`🐾 ${SPECIES[comp.m.sp].name} can't be ridden. Riders: Metawing (fly), Mossroll (roll), Rivolo (swim) and the legendary Aurorell.`, 4500);
  RIDE.on = true; RIDE.kind = r.kind; RIDE.r = r; comp.auto = false; stat('rides'); SFX.whoosh(); spark(P.x, P.y + 1, P.z, '#ffffff', 16);
  toast(`🐉 You are riding <b>${SPECIES[comp.m.sp].name}</b>! ${r.kind === 'fly' ? `Hold <b>${BTN.jump()}</b> to go up, <b>${BTN.dodge()}</b> to go down.` : r.kind === 'roll' ? 'Roll into monsters to bump them!' : 'Super fast in the water!'} Press <b>${BTN.ride()}</b> to hop off.`, 5000);
}
function dismount(msg) { if (!RIDE.on) return; RIDE.on = false; if (msg) toast('🐾 ' + msg); P.vy = 0; }
function rideTip() { if (comp && RIDEABLE[comp.m.sp] && !comp.trial) tip('ride', `🐉 <b>${SPECIES[comp.m.sp].name}</b> can be ridden! Press <b>${BTN.ride()}</b> to ${RIDEABLE[comp.m.sp].label} on it.`, '🐉 Riding'); }

// ====================================================================== companion care at the camp
function happy(m) { if (typeof m.happy !== 'number') m.happy = 60; return m.happy; }
function happyMul(m) { const h = happy(m); return h >= 70 ? 1.15 : h < 25 ? 0.9 : 1; }
function openCare() {
  openOverlay('care');
  $('careList').innerHTML = save.team.map((m, i) => { const h = happy(m); return `<div class="tmc"><b>${eIcon(m.sp)} ${SPECIES[m.sp].name}</b> ${h >= 70 ? '💖' : h < 25 ? '😞' : '🙂'}<div class="hbar"><div style="width:${h}%"></div></div><div style="font-size:12px;color:var(--muted)">Happiness ${Math.round(h)}/100</div><button class="btn" data-feed="${i}">🍎 Feed (5 🪙)</button> <button class="btn" data-pet="${i}">✋ Pet</button> <button class="btn blue" data-play="${i}">🎾 Play</button></div>`; }).join('');
  const bump = (m, n, txt) => { m.happy = Math.min(100, happy(m) + n); if (m.happy >= 100) { save.stats.fullHappy = 1; checkMedals(); } toast(txt); SFX.chime(1100); openCare(); renderComp(); };
  $('careList').querySelectorAll('[data-feed]').forEach((b) => b.onclick = () => { const m = save.team[+b.dataset.feed]; if (save.coins < 5) return toast('🪙 You need 5 coins to buy a snack.'); save.coins -= 5; bump(m, 25, `🍎 ${SPECIES[m.sp].name} munches happily!`); });
  $('careList').querySelectorAll('[data-pet]').forEach((b) => b.onclick = () => { const m = save.team[+b.dataset.pet]; if ((m.petT || 0) > Date.now()) return toast('✋ It just got petted. Try again in a little while!'); m.petT = Date.now() + 20000; bump(m, 10, `✋ ${SPECIES[m.sp].name} loves the pets! 💕`); });
  $('careList').querySelectorAll('[data-play]').forEach((b) => b.onclick = () => { const i = +b.dataset.play, m = save.team[i]; if ((m.playT || 0) > Date.now()) return toast('🎾 It is still tired from playing. Try again soon!'); m.playT = Date.now() + 60000; m.happy = Math.min(100, happy(m) + 20); if (m.happy >= 100) { save.stats.fullHappy = 1; checkMedals(); } closeOverlay('care'); if (save.active !== i) { save.active = i; spawnCompanion(m); } startFetch(); });
  tip('care', `💖 Happy Monstermon (70+) fight <b>15% stronger</b>! Happiness goes down slowly while you adventure, so come back to the camp to feed, pet and play.`, '💖 Care');
}
const FETCH = { on: false };
function startFetch() {
  if (!comp) return;
  const a = P.yaw, tx = P.x + Math.sin(a) * 9, tz = P.z + Math.cos(a) * 9;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat('#ffd34d', { e: '#ff9a1a', ei: 0.4 })); scene.add(ball);
  Object.assign(FETCH, { on: true, ball, t: 0, fx: P.x, fz: P.z, tx, tz, phase: 'throw' });
  toast(`🎾 You throw the ball! Go get it, ${SPECIES[comp.m.sp].name}!`); SFX.whoosh();
}
function updateFetch(dt, t) {
  if (!FETCH.on || !comp) return false;
  FETCH.t += dt; const b = FETCH.ball;
  if (FETCH.phase === 'throw') { const k = Math.min(1, FETCH.t / 0.8); b.position.set(FETCH.fx + (FETCH.tx - FETCH.fx) * k, height(FETCH.tx, FETCH.tz) + 0.2 + Math.sin(k * Math.PI) * 3, FETCH.fz + (FETCH.tz - FETCH.fz) * k); if (k >= 1) FETCH.phase = 'run'; }
  const goal = FETCH.phase === 'back' ? [P.x, P.z] : [FETCH.tx, FETCH.tz], dx = goal[0] - comp.x, dz2 = goal[1] - comp.z, dl = Math.hypot(dx, dz2);
  if (FETCH.phase !== 'throw' && dl > 0.8) { comp.x += dx / dl * 8 * dt; comp.z += dz2 / dl * 8 * dt; comp.yaw = Math.atan2(dx, dz2); }
  if (FETCH.phase === 'run' && dl <= 0.8) FETCH.phase = 'back';
  if (FETCH.phase === 'back') b.position.set(comp.x, comp.y + 1.2, comp.z);
  if (FETCH.phase === 'back' && dl <= 1.4) { scene.remove(b); FETCH.on = false; comp.celebrateT = 2; spark(comp.x, comp.y + 1.5, comp.z, '#ff7ad6', 16); toast(`💖 ${SPECIES[comp.m.sp].name} brought the ball back! It's so happy!`); SFX.win(); renderComp(); }
  comp.y = height(comp.x, comp.z); comp.model.position.set(comp.x, comp.y, comp.z); comp.model.rotation.y = comp.yaw;
  comp.model.userData.anim(t, { moving: dl > 0.8, celebrate: !FETCH.on });
  return true;
}

// ====================================================================== fishing at the lake (Valeza helps)
const FISH = { on: false };
const FISHES = [['🐟', 'Minnow', 5, 40], ['🐠', 'Rainbow Fish', 12, 25], ['🐡', 'Puffer Fish', 15, 14], ['👢', 'Old Boot', 1, 10], ['✨🐟', 'Golden Carp', 30, 8], ['🦪', 'Pearl Shell', 50, 3]];
function nearShore() { const d = dist2(P.x, P.z, LAKE.x, LAKE.z); return d > LAKE.r - 2 && d < LAKE.r + 5 && P.mode !== 'swim' && !RIDE.on; }
function startFishing() {
  const a = Math.atan2(LAKE.x - P.x, LAKE.z - P.z), bx2 = P.x + Math.sin(a) * 4, bz = P.z + Math.cos(a) * 4;
  const bob = new THREE.Group(); bx(bob, 0.18, 0.12, 0.18, '#ffffff', 0, 0.06, 0); bx(bob, 0.18, 0.12, 0.18, '#e53950', 0, 0.18, 0); bob.position.set(bx2, WATER, bz); scene.add(bob);
  P.yaw = a; Object.assign(FISH, { on: true, phase: 'wait', t: rand(2, 5), bob, hits: 0, miss: 0, pos: 0, dir: 1, help: dist2(valeza.position.x, valeza.position.z, bx2, bz) < 12 });
  $('fishUI').classList.remove('hidden'); $('fishBar').style.display = 'none';
  $('fishTxt').innerHTML = `🎣 Waiting for a bite… (<b>${BTN.dodge()}</b> to stop)`;
  tip('fishing', `🎣 <b>Fishing:</b> wait until the float dips and you see <b>!</b>, then press <b>${BTN.jump()}</b> fast. Then press <b>${BTN.jump()}</b> when the yellow needle is inside the green zone, 3 times. If <b>Valeza</b> swims close, the green zone gets bigger!`, '🎣 Fishing');
}
function endFishing(msg) { FISH.on = false; scene.remove(FISH.bob); $('fishUI').classList.add('hidden'); if (msg) toast(msg, 4000); }
function fishPress() {
  if (FISH.phase === 'wait') { endFishing('🎣 Too early! The fish swam away.'); return; }
  if (FISH.phase === 'bite') { FISH.phase = 'reel'; FISH.pos = 0; $('fishBar').style.display = ''; SFX.tick(); return; }
  if (FISH.phase === 'reel') {
    const z = FISH.zone; if (FISH.pos >= z[0] && FISH.pos <= z[1]) { FISH.hits++; SFX.chime(800 + FISH.hits * 200); rumble(0.3, 100); FISH.zone = null; } else { FISH.miss++; SFX.fail(); }
    if (FISH.hits >= 3) {
      let r = Math.random() * FISHES.reduce((s, f) => s + f[3], 0), f = FISHES[0]; for (const x of FISHES) { r -= x[3]; if (r <= 0) { f = x; break; } }
      save.coins += f[2]; stat('fish'); SFX.win(); renderStats(); endFishing(`🎣 You caught: ${f[0]} <b>${f[1]}</b>! +${f[2]} 🪙`); return;
    }
    if (FISH.miss >= 3) endFishing('🎣 Oh no, the fish got away! Try again.');
  }
}
function updateFishing(dt) {
  if (!FISH.on) return false;
  FISH.t -= dt; FISH.bob.position.y = WATER + Math.sin(performance.now() / 300) * 0.04 - (FISH.phase === 'bite' ? 0.15 : 0);
  if (FISH.phase === 'wait' && FISH.t <= 0) { FISH.phase = 'bite'; FISH.t = 1.1; $('fishTxt').innerHTML = `<span style="font-size:28px;color:#ffd34d">❗</span> A bite! Press <b>${BTN.jump()}</b> NOW!`; SFX.tick(); rumble(0.5, 150); }
  else if (FISH.phase === 'bite' && FISH.t <= 0) endFishing('🎣 Too slow! The fish took the bait and swam away.');
  else if (FISH.phase === 'reel') {
    const w = (FISH.help ? 0.3 : 0.18) * (save.settings.diff === 'easy' ? 1.25 : 1);
    if (!FISH.zone) { const s = rand(0.05, 0.95 - w); FISH.zone = [s, s + w]; }
    FISH.pos += FISH.dir * dt * (0.8 + FISH.hits * 0.25); if (FISH.pos > 1) { FISH.pos = 1; FISH.dir = -1; } if (FISH.pos < 0) { FISH.pos = 0; FISH.dir = 1; }
    $('fishZone').style.left = (FISH.zone[0] * 100) + '%'; $('fishZone').style.width = (w * 100) + '%'; $('fishNeedle').style.left = `calc(${FISH.pos * 100}% - 3px)`;
    $('fishTxt').innerHTML = `🎣 Reel it in! Press <b>${BTN.jump()}</b> in the green zone: ${'✅'.repeat(FISH.hits)}${'⬜'.repeat(3 - FISH.hits)} ${FISH.help ? '<br>😊 <b>Valeza</b> is helping: bigger green zone!' : ''}`;
  }
  if (P.mode === 'swim' || dist2(P.x, P.z, LAKE.x, LAKE.z) > LAKE.r + 7) endFishing();
  return true;
}

// ====================================================================== race against Skipclip
const RACE_PATH = [[-4, 56], [-10, 42], [-22, 32], [-14, 20], [6, 22], [22, 30], [16, 44], [2, 58]];
const RACE_AT = [-4, 61];
const raceFlag = new THREE.Group(); scene.add(raceFlag);
{ const y = height(...RACE_AT); raceFlag.position.set(RACE_AT[0], y, RACE_AT[1]); bx(raceFlag, 0.12, 3, 0.12, '#5a3a1c', 0, 1.5, 0); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) bx(raceFlag, 0.3, 0.3, 0.04, (i + j) % 2 ? '#111111' : '#ffffff', 0.3 + i * 0.3, 2.6 - j * 0.3, 0); }
const raceNpc = buildMon('skipclip', 'happy'); raceNpc.position.set(RACE_AT[0] + 1.5, height(...RACE_AT), RACE_AT[1]); raceNpc.rotation.y = Math.PI; scene.add(raceNpc);
const RACE = { on: false };
function startRace() {
  if (RIDE.on) dismount();
  const rings = RACE_PATH.map(([x, z], i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.18, 8, 28), new THREE.MeshBasicMaterial({ color: i === 0 ? '#ffd34d' : '#6fe3ff', transparent: true, opacity: 0.85 })); const nx = RACE_PATH[(i + 1) % RACE_PATH.length]; m.position.set(x, height(x, z) + 2.2, z); m.rotation.y = Math.atan2(nx[0] - x, nx[1] - z); scene.add(m); return m; });
  Object.assign(RACE, { on: true, rings, next: 0, count: 3.5, racer: { i: 0, x: RACE_AT[0] + 1.5, z: RACE_AT[1], p: 0 }, speed: save.settings.diff === 'easy' ? 6.2 : 7.4 });
  P.x = RACE_AT[0] - 1.5; P.z = RACE_AT[1]; P.y = height(P.x, P.z); P.yaw = Math.PI; cam.yaw = 0; cam.snap = true;
  toast('🏁 Race against Skipclip! Fly through all 8 rings in order. Ready…', 3000);
  tip('race', `🏁 <b>Race:</b> run through the rings in order (the <b style="color:#ffd34d">gold</b> one is next). Run with <b>${BTN.run()}</b> and jump with <b>${BTN.jump()}</b>. Beat Skipclip back to the flag!`, '🏁 Race');
}
function endRace(win) {
  RACE.on = false; RACE.rings.forEach((r) => scene.remove(r)); raceNpc.position.set(RACE_AT[0] + 1.5, height(...RACE_AT), RACE_AT[1]);
  if (win) { save.coins += 60; stat('raceWins'); SFX.win(); toast('🏆 YOU WON the race against Skipclip! +60 🪙', 5000); } else { SFX.fail(); toast('😅 Skipclip won this time! Talk to it at the flag to race again.', 5000); }
  renderStats();
}
function updateRace(dt, t) {
  if (!RACE.on) return;
  if (RACE.count > 0) { const before = Math.ceil(RACE.count); RACE.count -= dt; const now = Math.ceil(RACE.count); if (now !== before) { if (now > 0) { floatText(P.x, P.y + 2.6, P.z, String(now), '#ffd34d'); SFX.tick(); } else { floatText(P.x, P.y + 2.6, P.z, 'GO!', '#3ddc84'); SFX.chime(1200); } } }
  else {
    const r = RACE.racer, goal = RACE_PATH[Math.min(r.i, RACE_PATH.length - 1)], dx = goal[0] - r.x, dz2 = goal[1] - r.z, dl = Math.hypot(dx, dz2);
    r.x += dx / dl * RACE.speed * dt; r.z += dz2 / dl * RACE.speed * dt; if (dl < 1) r.i++;
    raceNpc.position.set(r.x, height(r.x, r.z), r.z); raceNpc.rotation.y = Math.atan2(dx, dz2); raceNpc.userData.anim(t, { moving: true });
    const ring2 = RACE.rings[RACE.next], rp = RACE_PATH[RACE.next];
    if (dist2(P.x, P.z, rp[0], rp[1]) < 3) { ring2.material.color.set('#3ddc84'); ring2.material.opacity = 0.3; SFX.chime(700 + RACE.next * 80); RACE.next++; if (RACE.next >= RACE.rings.length) return endRace(true); RACE.rings[RACE.next].material.color.set('#ffd34d'); }
    if (r.i >= RACE_PATH.length) return endRace(false);
  }
  RACE.rings.forEach((m, i) => { if (i === RACE.next) m.rotation.z = t * 2; });
}

// ====================================================================== Chapter 2: the Folded City on the Cut Mountain plateau
const CITY_Y = terrainHeight(0, -73);
const LIFT_LOW = [0, -52], LIFT_HIGH = [0, -67];
const city = new THREE.Group(); scene.add(city);
{
  const paper = ['#f2ecdc', '#e8e2d0', '#dcd4bc'];
  for (let i = 0; i < 14; i++) {
    const x = -38 + i * 5.8 + rand(-1, 1), z = rand(-80, -76), h = rand(3, 7), w = rand(2.5, 4);
    if (Math.abs(x) < 7) continue;
    const g = new THREE.Group(); g.position.set(x, terrainHeight(x, z), z); city.add(g);
    bx(g, w, h, w * 0.9, paper[i % 3], 0, h / 2, 0); for (let k = 0; k < 3; k++) bx(g, w + 0.02, 0.05, 0.05, '#2a2a3a', 0, (k + 1) * h / 4, w * 0.45);
    const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.8, 2, 3), mat(paper[(i + 1) % 3])); r.position.y = h + 1; r.castShadow = true; g.add(r);
    bx(g, 0.6, 0.8, 0.05, mat('#ffcf6a', { e: '#ff9a1a', ei: 0.8 }), 0, 1.2, w * 0.46);
  }
  // the Folded Palace where Foldragon sleeps
  const pal = new THREE.Group(); pal.position.set(0, CITY_Y, -79); city.add(pal);
  bx(pal, 12, 9, 3, '#e8e2d0', 0, 4.5, 0); for (let k = 0; k < 4; k++) bx(pal, 12.1, 0.1, 0.1, '#2a2a3a', 0, 1.5 + k * 2, 1.52);
  for (const s of [-1, 1]) { bx(pal, 2.4, 12, 2.4, '#dcd4bc', s * 6.5, 6, 0); const t2 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3, 4), mat('#2a2a3a')); t2.position.set(s * 6.5, 13.5, 0); pal.add(t2); }
  bx(pal, 3, 4.5, 0.2, mat('#3ad0ff', { e: '#3ad0ff', ei: 1.5 }), 0, 2.25, 1.55);
  for (let i = 0; i < 6; i++) { const lx = -30 + i * 12, lz = -69; const l = new THREE.Group(); l.position.set(lx, terrainHeight(lx, lz), lz); city.add(l); bx(l, 0.15, 2.5, 0.15, '#2a2a3a', 0, 1.25, 0); bx(l, 0.6, 0.7, 0.6, mat('#ff8a2a', { e: '#ff5a00', ei: 1.2 }), 0, 2.7, 0); }
  // two glowing lift pads: bottom (in front of the gate) and top (city edge)
  for (const [x, z] of [LIFT_LOW, LIFT_HIGH]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 24), mat('#3ad0ff', { e: '#3ad0ff', ei: 1.4, op: 0.8 })); p.position.set(x, terrainHeight(x, z) + 0.1, z); scene.add(p); }
}
function useLift() {
  const up = dist2(P.x, P.z, ...LIFT_LOW) < 2.5;
  $('fade').style.opacity = 1; SFX.whoosh();
  setTimeout(() => { const [x, z] = up ? [LIFT_HIGH[0], LIFT_HIGH[1] - 3] : [LIFT_LOW[0], LIFT_LOW[1] + 3]; P.x = x; P.z = z; P.y = height(x, z); P.vy = 0; if (comp) { comp.x = x + 1.5; comp.z = z; } cam.snap = true; $('fade').style.opacity = 0; if (up && save.step === 'explore') story('city'); }, 650);
}
// Count Crease: the villain who folds the forest (original character)
function makeCrease() {
  const g = new THREE.Group();
  bx(g, 0.8, 2.6, 0.5, '#15151f', 0, 1.3, 0); for (const s of [-1, 1]) { const c = bx(g, 0.5, 2.0, 0.08, '#2a2a3a', s * 0.55, 1.2, 0.1); c.rotation.z = s * 0.15; }
  bx(g, 0.6, 0.7, 0.55, '#f2ecdc', 0, 2.95, 0); bx(g, 0.02, 0.7, 0.02, '#2a2a3a', 0, 2.95, 0.28);
  for (const s of [-1, 1]) bx(g, 0.14, 0.06, 0.02, mat('#ff2a14', { e: '#ff2a14', ei: 3 }), s * 0.14, 3.05, 0.285);
  bx(g, 0.8, 0.08, 0.8, '#15151f', 0, 3.33, 0); bx(g, 0.5, 0.6, 0.5, '#15151f', 0, 3.65, 0); bx(g, 0.52, 0.1, 0.52, '#3ad0ff', 0, 3.45, 0);
  const cube = bx(g, 0.35, 0.35, 0.35, mat('#a8f0ff', { e: '#3ad0ff', ei: 2 }), 0.7, 1.7, 0.3); g.userData.cube = cube;
  g.visible = false; scene.add(g); return g;
}
const crease = makeCrease();
let seals = [], boss2 = null, legend = null;
const CITY_SPAWNS = [['inkling', -20, -70], ['staplor', 18, -72], ['lanternix', -8, -74], ['inkling', 26, -70], ['lanternix', 10, -76], ['paperfang', -28, -74]];
function spawnCity() {
  if (spawnCity.done) return; spawnCity.done = true;
  for (const [sp, x, z] of CITY_SPAWNS) makeEnemy(sp, x, z, { corrupted: true, atkMul: 1.1, mood: Math.random() < 0.7 ? 'angry' : 'sad', xp: 90 });
}
function startSeals() {
  if (seals.length) return;
  seals = [[-25, -73], [25, -73], [0, -71]].map(([x, z]) => makeObject('seal', x, z, 90, 'Fold seal'));
  setBeacon(seals[0].x, seals[0].z);
}
function onSeal() {
  const left = seals.filter((s) => s.alive).length;
  if (left) { toast(`🔷 A fold seal broke! ${left} left.`); const n = seals.find((s) => s.alive); setBeacon(n.x, n.z); return; }
  toast('🔷 All three seals are broken! The palace doors open…', 4000); story('dragon');
}
function startDragon() {
  if (boss2) return;
  boss2 = makeEnemy('foldragon', 0, -74, { boss: true, mood: 'angry', hp: 900, atkMul: 1.7, corrupted: true, catchable: false, name: 'Foldragon, the Paper Dragon' });
  boss2.state = 'wake'; boss2.shield = false; boss2.atkT = 3; boss2.short = 'Foldragon'; boss2.atkHint = '📜 Paper blades are coming! Get out of the red circles!';
  boss = boss2; setBeacon(0, -74);
}
function updateLegend() {
  const want = reached('city') && isNight() && WX.type === 'snow' && !save.dex.caught.aurorell;
  if (want && !legend) {
    legend = makeEnemy('aurorell', 30, -76, { mood: 'angry', hp: 420, atkMul: 1.3, xp: 300, name: '🌌 Aurorell' });
    toast('🌌 Something shines on the mountain top… a <b>LEGENDARY</b> Monstermon appeared in the snow!', 6000);
    tip('legend', `🌌 <b>Aurorell</b> only appears on the mountain top on <b>snowy nights</b>. It is very strong, so bring your best team and a 💠 Strong FoldCube!`, '🌌 Legendary');
    legend.cineDone = false;
  }
  if (legend && legend.alive && !legend.cineDone && dist2(P.x, P.z, legend.x, legend.z) < 22) { legend.cineDone = true; cinematic(legend, 'AURORELL', 'THE LEGEND OF THE NORTHERN LIGHTS'); }
  if (legend && (!legend.alive || (!want && legend.alive && dist2(P.x, P.z, legend.x, legend.z) > 30))) { if (legend.alive) { removeEnemy(legend); toast('🌌 Aurorell vanished into the morning light…'); } legend = null; }
}
const STORY2 = {
  city: () => {
    save.step = 'city'; spawnCity(); persist();
    say([['📍 The Folded City', 'The lift takes you up through the gate… to a whole <b>city made of folded paper</b> on top of the mountain!'],
      ['❗', 'Everything here is creased and folded: houses, lanterns, even the monsters. Three glowing <b>fold seals</b> keep the palace doors shut.'],
      ['Professor Green (radio)', `This must be where the folding comes from! Break the <b>3 fold seals</b> with <b>${BTN.attack()}</b>. Be careful: the paper monsters here are strong.`]],
      () => { save.step = 'seals'; startSeals(); persist(); tip('ch2', `📜 <b>Chapter 2: The Folded City!</b> New monsters live here: Inkling 💧, Staplor ⚙️ and Lanternix 🔥. Break the 3 fold seals (⭐ on the map).`, '📜 Chapter 2'); });
  },
  dragon: () => { save.step = 'dragon'; startDragon(); persist(); },
  dragonDown: () => {
    save.step = 'ch2done'; save.stats.foldragon = 1; checkMedals(); persist();
    crease.position.set(0, CITY_Y, -76.5); crease.rotation.y = 0; crease.visible = true; crease.scale.setScalar(1);
    say([['❗', '<i>Foldragon unfolds into a rain of old maps… and from behind the palace steps a tall, thin figure with a paper mask.</i>', () => roar(0.4, true)],
      ['Count Crease', `<i>"So YOU are the one unfolding my work, ${save.name}. The forest is so MESSY. I only want to fold it into one perfect, tidy little cube."</i>`],
      ['Count Crease', '<i>"Rootlock, the bridge, the mountain… those were only the first creases. Next time, I will fold the whole of Virelia!"</i>'],
      ['❗', '<i>Count Crease folds himself smaller and smaller… and vanishes with a soft </i><b>snap</b>.', () => { CREASE_OUT.t = 1.2; }],
      ['Professor Green (radio)', `${save.name}… you found who is folding the forest! Come back to the lab. We have a lot to prepare.`],
      ['📜 Wildfold', '<b>End of Chapter 2!</b> Keep exploring: catch all 20 Monstermon, find the legendary Aurorell on a snowy night, and collect every medal!']],
      () => setBeacon(null));
  },
};
const CREASE_OUT = { t: 0 };
function updateCrease(dt) { if (CREASE_OUT.t > 0) { CREASE_OUT.t -= dt; crease.rotation.y += dt * 14; crease.scale.setScalar(Math.max(0.01, CREASE_OUT.t / 1.2)); if (CREASE_OUT.t <= 0) { crease.visible = false; spark(crease.position.x, crease.position.y + 2, crease.position.z, '#3ad0ff', 30); } } }

// ====================================================================== profiles (one adventure per player) + parent time limit
let PROFILE = qs.get('p') || 'main';
const advUrl = () => '/api/adv?p=' + encodeURIComponent(PROFILE);
function chooseProfile() {
  return new Promise(async (resolve) => {
    let list = [];
    try { list = (await (await fetch('/api/advprofiles')).json()).profiles || []; } catch (e) { }
    if (!list.length) return resolve('main');
    openOverlay('profiles');
    $('profList').innerHTML = list.map((p) => `<div class="pcard" data-pid="${p.id}">🧭 ${p.name}<small>${p.team} Monstermon · ${p.step}</small></div>`).join('') + '<div class="pcard" data-pid="__new">➕ New player<small>Start a brand new adventure</small></div>';
    $('profList').querySelectorAll('[data-pid]').forEach((c) => c.onclick = () => { closeOverlay('profiles'); let id = c.dataset.pid; if (id === '__new') id = Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'a'); resolve(id); });
    if (pad.on) setTimeout(() => navMove(0, 1), 100);
  });
}
const PARENT_KEY = 'dreamplay_parent';
function parentCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem(PARENT_KEY) || '{}'); } catch (e) { } const today = new Date().toDateString(); if (c.date !== today) { c.date = today; c.used = 0; c.extra = 0; } if (c.limit === undefined) c.limit = 0; return c; }
function saveParent(c) { try { localStorage.setItem(PARENT_KEY, JSON.stringify(c)); } catch (e) { } }
let parentAcc = 0;
function updateParent(dt) {
  if (state !== 'play' || paused) return;
  parentAcc += dt; if (parentAcc < 5) return;
  const c = parentCfg(); c.used += parentAcc; parentAcc = 0; saveParent(c);
  if (c.limit > 0 && c.used >= (c.limit + c.extra) * 60 && $('rest').classList.contains('hidden')) {
    persist(); openOverlay('rest'); paused = true;
    $('restBody').innerHTML = `<p style="color:var(--muted)">Today's play time: ${Math.round(c.used / 60)} minutes (limit ${c.limit + c.extra}).</p>${mathLock('restLock', '➕ Parent: 15 more minutes')}`;
    bindMathLock('restLock', () => { const c2 = parentCfg(); c2.extra += 15; saveParent(c2); closeOverlay('rest'); paused = false; toast('👪 15 more minutes. Have fun!'); });
  }
}
function mathLock(id, label) { const a = 6 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 7), ans = a * b, opts = [ans, ans + a, ans - b].sort(() => Math.random() - 0.5); mathLock[id] = ans; return `<div style="margin-top:12px"><b>${label}</b><div style="color:var(--muted)">Grown-ups only: what is ${a} × ${b}?</div><div class="row" style="margin-top:8px;justify-content:center">${opts.map((o) => `<button class="btn" data-ml="${id}" data-v="${o}">${o}</button>`).join('')}</div></div>`; }
function bindMathLock(id, ok) { document.querySelectorAll(`[data-ml="${id}"]`).forEach((b) => b.onclick = () => { if (+b.dataset.v === mathLock[id]) ok(); else { toast('❌ Not quite. Ask a grown-up!'); SFX.fail(); } }); }
function openParent() {
  openOverlay('parent');
  const c = parentCfg();
  $('parentBody').innerHTML = `<p>Play time today: <b>${Math.round(c.used / 60)} min</b> · Current daily limit: <b>${c.limit ? c.limit + ' min' : 'Off'}</b></p><div id="plock">${mathLock('pl', '🔒 Unlock parent settings')}</div>`;
  bindMathLock('pl', () => {
    $('plock').innerHTML = `<b>Daily time limit</b><div class="row" style="margin-top:8px">${[[0, 'Off'], [30, '30 min'], [45, '45 min'], [60, '60 min'], [90, '90 min']].map(([v, l]) => `<button class="btn ${c.limit === v ? 'blue' : ''}" data-lim="${v}">${l}</button>`).join('')}</div><p style="color:var(--muted)">When the time is up, Professor Green says "Time to rest!" and the game saves and stops until tomorrow (or until a grown-up adds 15 minutes).</p>`;
    $('plock').querySelectorAll('[data-lim]').forEach((b) => b.onclick = () => { const c2 = parentCfg(); c2.limit = +b.dataset.lim; saveParent(c2); toast(`👪 Daily limit: ${c2.limit ? c2.limit + ' minutes' : 'off'}`); openParent(); });
  });
}

// ====================================================================== per-frame updates for all of the above
function updateExtras(dt, t) {
  updateGreenBeacon(t); updateTalkBubble(); updateMorph(dt, t); updateLabIdle(t); updateSpawner(dt); updateBaba(dt, t); updateRace(dt, t); updateCrease(dt); updateLegend(); updateParent(dt); updateTrophies();
  if (state === 'play' && save.team.length) { for (const m of save.team) { happy(m); m.happy = Math.max(0, m.happy - dt / 30); } }
  if (RIDE.on && !RIDE.dragon && (!comp || !RIDEABLE[comp.m.sp])) dismount();
  if (press.has('dragon')) toggleDragon();
  updateZones(dt); updateDragon(t); updateChests(dt, t);
  raceNpc.userData.anim && !RACE.on && raceNpc.userData.anim(t, {});
  // "busy" states block normal actions
  if (FISH.on) { if (press.has('jumpPress') || press.has('talk')) { press.delete('talk'); press.delete('jumpPress'); fishPress(); } if (press.has('dodge')) { press.delete('dodge'); endFishing('🎣 You put the fishing rod away.'); } }
  if (press.has('ride')) toggleRide();
  if (RIDE.on && (press.has('attack') || press.has('skill1') || press.has('skill2') || press.has('ult'))) dismount('You hopped off to fight!');
}

// ====================================================================== 200 wild Monstermon: abilities, new attacks, spawner
const elemMulE = (a, d) => { if (!a || !d) return 1; if (STRONG[a].includes(d)) return 2; if (STRONG[d].includes(a)) return 0.5; return 1; };
const defElem = (e) => e.elemOverride || elemOf(e.sp);
const has = (e, a) => e.abil && e.abil.includes(a);
const ABIL_TIP = (a) => `${ABILITIES[a][0]} <b>${ABILITIES[a][1]}:</b> ${ABILITIES[a][2]}`;
function abilityTick(e, dt, t, dp) {
  if (!e.abil || !e.abil.length) return;
  if (dp < 16) e.abil.forEach((a) => tip('ab_' + a, `This monster has a special ability!<br>${ABIL_TIP(a)}`, '✨ Special ability'));
  const chasing = e.state === 'chase' || e.state === 'windup' || e.state === 'recover';
  if (has(e, 'regen') && t - (e.lastHit || 0) > 3 && e.hp < e.max) { e.hp = Math.min(e.max, e.hp + e.max * 0.03 * dt); if (Math.random() < dt * 2) floatText(e.x, e.y + 2, e.z, '+', '#3ddc84'); }
  if (has(e, 'blink') && chasing && dp < 14) { e.blinkT = (e.blinkT ?? 5) - dt; if (e.blinkT <= 0) { e.blinkT = 6; smoke(e.x, e.y + 0.6, e.z, 5); const a = P.yaw + Math.PI; e.x = P.x + Math.sin(a) * 2.2; e.z = P.z + Math.cos(a) * 2.2; smoke(e.x, height(e.x, e.z) + 0.6, e.z, 5); floatText(e.x, e.y + 2, e.z, '🌀 blink!', '#b48cff'); SFX.whoosh(); } }
  if (has(e, 'shield')) { e.shieldT = (e.shieldT ?? 4) - dt; if (e.shieldT <= 0) { e.shielded = !e.shielded; e.shieldT = e.shielded ? 2.5 : 7; if (e.shielded) floatText(e.x, e.y + 2.2, e.z, '🛡️ shield!', '#9fe8ff'); }
    if (!e.bubble) { e.bubble = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), new THREE.MeshBasicMaterial({ color: '#6fe3ff', transparent: true, opacity: 0.25, depthWrite: false })); e.bubble.position.y = 0.9; e.model.add(e.bubble); }
    e.bubble.visible = !!e.shielded; }
  if (has(e, 'summon') && !e.summoned && e.hp < e.max * 0.5) {
    e.summoned = true; floatText(e.x, e.y + 2.4, e.z, '📯 HELP!', '#ffd34d'); roar(ROAR_PITCH[e.sp] || 1.2);
    const pool = GEN_IDS.filter((id) => SPECIES[id].elem === elemOf(e.sp) && SPECIES[id].tier === 1);
    for (let i = 0; i < 2 && pool.length; i++) { const sp = pool[Math.floor(Math.random() * pool.length)], a = Math.random() * 6.28; const m = makeEnemy(sp, e.x + Math.cos(a) * 3, e.z + Math.sin(a) * 3, { mood: 'angry', xp: 20, scale: 0.75 }); m.state = 'chase'; m.wild = true; smoke(m.x, m.y + 0.5, m.z, 5); }
  }
  if (has(e, 'poison') && e.movingNow) { e.poisonT = (e.poisonT ?? 0) - dt; if (e.poisonT <= 0) { e.poisonT = 0.9; hazard(e.x, e.z, 1.1, 4, '#7ad83a', 5); } }
  if (has(e, 'magnet') && chasing && dp < 9 && dp > 2.5) { e.magT = (e.magT ?? 3) - dt; if (e.magT <= 0) { e.magT = 6; e.pull = 0.5; floatText(e.x, e.y + 2.2, e.z, '🧲 pull!', '#ff7ad6'); } if (e.pull > 0) { e.pull -= dt; const dx = e.x - P.x, dz2 = e.z - P.z, d = Math.hypot(dx, dz2) || 1; P.x += dx / d * 7 * dt; P.z += dz2 / d * 7 * dt; } }
  if (has(e, 'shadow')) e.model.visible = !isNight() || dp < 9;
  if (has(e, 'enrage') && !e.enraged && e.hp < e.max * 0.3) { e.enraged = true; e.spd *= 1.4; e.atk *= 1.4; e.roarT = 1; roar(ROAR_PITCH[e.sp] || 1, true); floatText(e.x, e.y + 2.4, e.z, '😡 ENRAGED!', '#ff3b2f'); }
  if (has(e, 'mimic') && comp && chasing) { e.mimT = (e.mimT ?? 2) - dt; if (e.mimT <= 0) { e.mimT = 10; const mine = elemOf(comp.m.sp), beat = Object.keys(STRONG).find((k) => STRONG[k].includes(mine)); if (beat && beat !== e.elemOverride) { e.elemOverride = beat; floatText(e.x, e.y + 2.4, e.z, `🎭 now ${ELEM[beat].icon}!`, '#ffd34d'); } } }
  if (has(e, 'fuse') && !e.fused && e.hp < e.max * 0.25) { e.fused = true; floatText(e.x, e.y + 2.4, e.z, '💣 FUSE!', '#ff7a1a'); const ex = e.x, ez = e.z, dmg = e.atk * 1.8; telegraph(ex, ez, 3.8, 1.8, '#ff7a1a', (who) => who === 'player' ? hurtPlayer(dmg) : hurtComp(dmg, e.sp), { hint: `💣 <b>${e.name}</b> is about to EXPLODE! Run out of the orange circle!`, end: (x, z) => { smoke(x, terrainHeight(x, z) + 0.6, z, 12); SFX.big(); rumble(0.8, 400); } }); }
}
function abilityOnHit(e, dmg) {
  e.lastHit = performance.now() / 1000;
  if (e.shielded) { floatText(e.x, e.y + 2, e.z, 'blocked by shield', '#9fe8ff'); return dmg * 0.1; }
  if (has(e, 'thorns') && comp && dist2(comp.x, comp.z, e.x, e.z) < 5) { comp.m.hp = Math.max(1, comp.m.hp - dmg * 0.12); if (Math.random() < 0.4) floatText(comp.x, comp.y + 1.6, comp.z, '🌵', '#3ddc84'); }
  return dmg;
}
function abilityOnAttack(e, who, dealt) {
  if (has(e, 'vampire')) { e.hp = Math.min(e.max, e.hp + dealt * 0.5); floatText(e.x, e.y + 2, e.z, '🧛 +' + Math.round(dealt * 0.5), '#ff3b6a'); }
  if (who !== 'player') return;
  if (has(e, 'frost')) { P.slowT = 2; floatText(P.x, P.y + 2.4, P.z, '🧊 slowed', '#9fe8ff'); }
  if (has(e, 'gust')) { const a = Math.atan2(P.x - e.x, P.z - e.z); P.x += Math.sin(a) * 3; P.z += Math.cos(a) * 3; P.vy = 5; P.onGround = false; }
}
function abilityOnDefeat(e) {
  if (has(e, 'split') && !e.mini) {
    floatText(e.x, e.y + 2.4, e.z, '🧬 SPLIT!', '#b48cff');
    for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, m = makeEnemy(e.sp, e.x + Math.cos(a) * 2, e.z + Math.sin(a) * 2, { mood: 'angry', hpMul: 0.3, scale: 0.55, catchable: false, xp: 10 }); m.mini = true; m.name = 'Mini ' + m.name; m.state = 'chase'; m.wild = true; m.abil = m.abil.filter((x) => x !== 'split'); }
  }
}
// three new attack styles for the new monsters
Object.assign(ATK_TIPS, {
  volley: () => `🔴🔴🔴 A <b>volley</b>: three circles in a row towards you. Step to the side!`,
  spikes: () => `🌵 <b>Spikes</b> burst out of the ground all around the monster. Keep your distance!`,
  burrow: () => `🕳️ This monster <b>digs underground</b> and pops up under you. Run out of the circle!`,
});
Object.assign(ATK_RANGE, { volley: 8, spikes: 3.5, burrow: 9 });
function startAttack2(e, style, tg, hit) {
  if (style === 'volley') { e.wind = 1.0; const a = Math.atan2(tg.x - e.x, tg.z - e.z); for (let k = 1; k <= 3; k++) telegraph(e.x + Math.sin(a) * k * 2.4, e.z + Math.cos(a) * k * 2.4, 1.3, 0.7 + k * 0.2, RED, hit(0.8), { hint: `🔴🔴🔴 <b>${e.name}</b> fires a volley! Step to the side!` }); return true; }
  if (style === 'spikes') { e.wind = 1.0; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; telegraph(e.x + Math.cos(a) * 2.4, e.z + Math.sin(a) * 2.4, 1.2, 1.0, RED, hit(0.9), { hint: `🌵 Spikes are bursting around <b>${e.name}</b>! Back off!` }); } telegraph(tg.x, tg.z, 1.3, 1.2, RED, hit(0.9)); return true; }
  if (style === 'burrow') { e.wind = 1.3; e.burrow = { tx: tg.x, tz: tg.z }; e.model.visible = false; smoke(e.x, e.y + 0.4, e.z, 6); telegraph(tg.x, tg.z, 1.9, 1.3, '#8a5a2b', hit(1.3), { hint: `🕳️ <b>${e.name}</b> is digging under you! Get out of the brown circle!`, end: (x, z) => { e.x = x; e.z = z; e.model.visible = true; e.burrow = null; smoke(x, terrainHeight(x, z) + 0.4, z, 8); rumble(0.5, 200); } }); return true; }
  return false;
}
// region + spawner: creatures appear around you depending on where you are, the weather and the time of day
function regionAt(x, z) {
  const zz = zoneOf(x, z); if (zz !== 'core') return zz;
  const h = terrainHeight(x, z);
  if (z < -63 && h > 14) return 'city';
  if (z < -24) return 'mountain';
  if (dist2(x, z, SPOTS.lake[0], SPOTS.lake[1]) < 22) return 'lake';
  if (dist2(x, z, SPOTS.hill[0], SPOTS.hill[1]) < 17 || dist2(x, z, 44, -22) < 14) return 'hill';
  if (z > 38) return 'village';
  return 'forest';
}
const HAND_HAB = { bellbud: 'forest', mossroll: 'forest', emberlid: 'forest', glimframe: 'forest', rivolo: 'lake', skipclip: 'forest', hingemaw: 'mountain', paperfang: 'mountain', rootlock: 'mountain', inkling: 'city', staplor: 'city', lanternix: 'city' };
const TIER_W = [0, 5, 4, 3, 1.4, 0.55];
function condOk(c) { if (!c) return true; if (c === 'night') return isNight(); return WX.type === c; }
function maxTier() { return reached('city') ? 5 : reached('mountain') ? 4 : reached('boss') ? 3 : 2; }
function pickSpecies(region) {
  const pool = [];
  for (const id of GEN_IDS) { const d = SPECIES[id]; if (d.habitat !== region || d.tier > maxTier() || !condOk(d.cond)) continue; pool.push([id, TIER_W[d.tier] * (d.cond ? 2.2 : 1)]); }
  for (const [id, hab] of Object.entries(HAND_HAB)) if (hab === region && (hab !== 'city' || reached('city'))) pool.push([id, 3]);
  if (!pool.length) return null;
  let r = Math.random() * pool.reduce((s, p) => s + p[1], 0); for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; } return pool[0][0];
}
let spawnTick = 3;
function updateSpawner(dt) {
  if (state !== 'play' || !reached('mission1')) return;
  spawnTick -= dt; if (spawnTick > 0) return; spawnTick = 4;
  // forget far-away wild ones
  for (const e of [...enemies]) if (e.wild && e.alive && !e.capturing && !e.autoCatch && dist2(e.x, e.z, P.x, P.z) > 75 && !(RMT.on && dist2(e.x, e.z, RMT.x, RMT.z) < 70)) removeEnemy(e);
  const near = enemies.filter((e) => e.kind === 'mon' && e.alive && dist2(e.x, e.z, P.x, P.z) < 45).length;
  if (near >= 9) return;
  for (let k = 0; k < 12; k++) {
    const a = Math.random() * 6.28, r = rand(22, 38), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
    if (Math.abs(x) > HALF - 12 || Math.abs(z) > HALF - 12) continue;
    const h = height(x, z), region = regionAt(x, z);
    if (region === 'village' || h < WATER + 0.2 || Math.abs(z) < 10) continue;
    if (region === 'city' && !reached('city')) continue;
    if (region === 'mountain' && !reached('mountain') && z < -40) continue;
    const sp = ZONE_ELEM[region] ? pickZoneSpecies(region) : pickSpecies(region); if (!sp) continue;
    const d = SPECIES[sp], tier = d.tier || 2;
    const e = makeEnemy(sp, x, z, { atkMul: 0.65 + tier * 0.1, xp: 25 + tier * 15, corrupted: Math.random() < 0.2 });
    e.wild = true; e.abil = d.abilities ? d.abilities.slice() : [];
    if (d.cond) { e.special = true; if (dist2(e.x, e.z, P.x, P.z) < 40) toast(`${d.cond === 'night' ? '🌙' : WEATHERS[d.cond] ? WEATHERS[d.cond].icon : '✨'} A rare <b>${d.name}</b> appeared! It only shows up ${d.cond === 'night' ? 'at night' : 'in this weather'}.`, 3500); }
    if (tier >= 5) toast(`⭐⭐⭐⭐⭐ An ALPHA monster appeared nearby: <b>${d.name}</b>! Be careful!`, 4000);
    return;
  }
}

// ====================================================================== GRAPHICS: bloom, living sky, water, grass, weather details, night lights, battle VFX
camera.far = 700; camera.updateProjectionMatrix();
const QUAL = { high: { pr: 2, shadow: 2048, grass: 0, flowers: 0, bloom: true, caps: true }, medium: { pr: 1.25, shadow: 1024, grass: 0, flowers: 0, bloom: true, caps: true }, low: { pr: 1, shadow: 512, grass: 0, flowers: 0, bloom: false, caps: false } };
const Q = () => QUAL[save.settings.quality] || QUAL.high;
// ---- bloom (post-processing)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.55, 0.95);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());
addEventListener('resize', () => { composer.setSize(innerWidth, innerHeight); });
function renderFrame() { if (Q().bloom) composer.render(); else renderer.render(scene, camera); }
function applyQuality() {
  const q = Q(); renderer.setPixelRatio(Math.min(q.pr, devicePixelRatio)); composer.setPixelRatio(Math.min(q.pr, devicePixelRatio)); composer.setSize(innerWidth, innerHeight);
  sun.castShadow = save.settings.quality !== 'low';
  if (sun.shadow.mapSize.x !== q.shadow) { sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  grass.count = q.grass; flowers.count = q.flowers; snowCaps.forEach((c) => c.visible = q.caps && c.visible);
}

// ---- the living sky: gradient dome with sun + moon, stars, drifting clouds, sunsets, aurora
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color('#fff2c8') }, sunAmt: { value: 1 }, moonDir: { value: new THREE.Vector3(0, -1, 0) }, moonAmt: { value: 0 } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
  fragmentShader: `uniform vec3 top, mid, bot, sunCol, sunDir, moonDir; uniform float sunAmt, moonAmt; varying vec3 vDir;
    void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bot, pow(-h, 0.4));
      float sd = max(dot(vDir, normalize(sunDir)), 0.0); c += sunCol * (smoothstep(0.9993, 0.9996, sd) * 6.0 + pow(sd, 10.0) * 0.35) * sunAmt;
      float md = max(dot(vDir, normalize(moonDir)), 0.0); c += vec3(0.85, 0.9, 1.0) * (smoothstep(0.9995, 0.9997, md) * 2.2 + pow(md, 60.0) * 0.12) * moonAmt;
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
scene.background = null;
const starGeo = new THREE.BufferGeometry(), starPos = [];
for (let i = 0; i < 1800; i++) { const u = Math.random(), v = Math.random() * 0.95, th = u * 6.283, ph = Math.acos(1 - v); starPos.push(Math.sin(ph) * Math.cos(th) * 480, Math.cos(ph) * 480, Math.sin(ph) * Math.sin(th) * 480); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); stars.frustumCulled = false; scene.add(stars);
const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, fog: false, transparent: true, opacity: 0.92, depthWrite: false });
const clouds = [];
for (let i = 0; i < 22; i++) {
  const c = new THREE.Group(), n = 4 + Math.floor(Math.random() * 4);
  for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(rand(14, 30), rand(5, 10), rand(10, 20)), cloudMat); b.position.set(rand(-18, 18), rand(-2, 3), rand(-8, 8)); c.add(b); }
  const a = rand(0, 6.28), r = rand(80, 330); c.position.set(Math.cos(a) * r, rand(70, 110), Math.sin(a) * r); c.userData.base = i; scene.add(c); clouds.push(c);
}
const auroraMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 }, amt: { value: 0 } },
  vertexShader: 'uniform float time; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x * 0.02 + time * 0.3) * 30.0; p.y += sin(p.x * 0.035 - time * 0.5) * 8.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
  fragmentShader: `uniform float time, amt; varying vec2 vUv; void main(){ float band = 0.5 + 0.5 * sin(vUv.x * 60.0 + time * 1.5) * sin(vUv.x * 13.0 - time * 0.7); vec3 c = mix(vec3(0.1, 1.0, 0.55), vec3(0.65, 0.3, 1.0), vUv.y); float a = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)) * band * amt; gl_FragColor = vec4(c * a, a);
 #include <colorspace_fragment>
 }`,
});
const aurora = new THREE.Group(); scene.add(aurora);
for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(520, 90, 80, 4), auroraMat); m.position.set(rand(-60, 60), 150 + i * 18, -240 - i * 40); aurora.add(m); }
const SUNV = new THREE.Vector3(), MOONV = new THREE.Vector3();
const C = (h) => new THREE.Color(h);
const SKY = { dayTop: C('#2f86e8'), dayMid: C('#a8dcff'), dusk1: C('#ff8a4a'), dusk2: C('#ff5a8a'), nightTop: C('#02040e'), nightMid: C('#0c1838'), grey: C('#8a96a6'), greyN: C('#0c1220'), ground: C('#3a5a2a') };
const T1 = new THREE.Color(), T2 = new THREE.Color(), T3 = new THREE.Color();
function updateSky(dt, t) {
  const ph = (save.time + 0.05) % 1, sunUp = ph < 0.7;
  const se = sunUp ? Math.sin(ph / 0.7 * Math.PI) * 0.95 : -0.3, sa = (ph / 0.7) * Math.PI;
  SUNV.set(Math.cos(sa), se, -0.35 + Math.sin(sa) * 0.2).normalize();
  const mp = sunUp ? -0.3 : Math.sin((ph - 0.7) / 0.3 * Math.PI) * 0.8, ma = ((ph - 0.7) / 0.3) * Math.PI;
  MOONV.set(Math.cos(ma), mp, -0.5).normalize();
  const L = dayLight(), A = WX.amt, grey = Math.min(1, A.rain * 0.85 + A.cloudy * 0.35 + A.fog * 0.8 + A.snow * 0.55 + A.wind * 0.15);
  const dusk = sunUp ? Math.max(0, 1 - Math.abs(se) / 0.28) * (1 - grey) : 0;
  T1.copy(SKY.nightTop).lerp(SKY.dayTop, L); T2.copy(SKY.nightMid).lerp(SKY.dayMid, L);
  T2.lerp(T3.copy(SKY.dusk1).lerp(SKY.dusk2, 0.4), dusk * 0.85); T1.lerp(SKY.dusk2, dusk * 0.25);
  T1.lerp(L > 0.4 ? SKY.grey : SKY.greyN, grey * 0.85); T2.lerp(L > 0.4 ? SKY.grey : SKY.greyN, grey * 0.8);
  skyMat.uniforms.top.value.copy(T1); skyMat.uniforms.mid.value.copy(T2); skyMat.uniforms.bot.value.copy(T2).multiplyScalar(0.6);
  skyMat.uniforms.sunDir.value.copy(SUNV); skyMat.uniforms.sunAmt.value = (sunUp ? 1 : 0) * (1 - grey * 0.9); skyMat.uniforms.sunCol.value.set(dusk > 0.3 ? '#ffb070' : '#fff2c8');
  skyMat.uniforms.moonDir.value.copy(MOONV); skyMat.uniforms.moonAmt.value = (sunUp ? 0 : 1) * (1 - grey);
  scene.fog.color.lerp(T3.copy(T2), 0.6);
  if (dusk > 0) scene.fog.color.lerp(SKY.dusk1, dusk * 0.25);
  sky.position.copy(camera.position); stars.position.copy(camera.position); stars.rotation.y = t * 0.004;
  stars.material.opacity = Math.max(0, (1 - L) * (1 - grey) - 0.05);
  // clouds drift with the wind, more and darker in bad weather, pink at sunset
  const wdx = Math.sin(WX.windDir), wdz = Math.cos(WX.windDir), wsp = 2 + A.wind * 10;
  const show = 6 + Math.round((A.cloudy + A.rain + A.snow + A.fog + A.wind * 0.5) * 16);
  clouds.forEach((c, i) => {
    c.visible = i < show; c.position.x += wdx * wsp * dt; c.position.z += wdz * wsp * dt;
    const dx = c.position.x - camera.position.x, dz2 = c.position.z - camera.position.z;
    if (Math.hypot(dx, dz2) > 340) { c.position.x = camera.position.x - dx * 0.95; c.position.z = camera.position.z - dz2 * 0.95; }
  });
  cloudMat.color.copy(T3.set('#ffffff')).lerp(SKY.greyN, 1 - L).lerp(SKY.dusk2, dusk * 0.55).lerp(T2.set('#6a7280'), (A.rain + A.snow) * 0.6 * L);
  cloudMat.opacity = 0.75 + grey * 0.2;
  // aurora on snowy nights (and when the legendary Aurorell is around)
  auroraMat.uniforms.time.value = t; const auroraWant = (1 - L) * Math.max(A.snow, legend && legend.alive ? 1 : 0, reached('city') && isNight() ? 0.25 : 0);
  auroraMat.uniforms.amt.value += (auroraWant - auroraMat.uniforms.amt.value) * Math.min(1, dt); aurora.visible = auroraMat.uniforms.amt.value > 0.01;
  aurora.position.set(camera.position.x, 0, camera.position.z);
  // the sun / moon light follows the sky (moving shadows!)
  const dir = sunUp ? SUNV : MOONV; sun.position.set(P.x + dir.x * 60, P.y + Math.max(12, dir.y * 60), P.z + dir.z * 60); sun.target.position.set(P.x, P.y, P.z);
  if (!sunUp) sun.color.set('#9fb8ff'); else if (dusk > 0.2) sun.color.lerp(T3.set('#ffb070'), dusk);
  // bloom: subtle in the day, strong at night (eyes, cracks, fire, fireflies glow)
  bloomPass.strength = 0.22 + (1 - L) * 0.5 + A.fog * 0.08; bloomPass.threshold = 0.78 + L * 0.2;
}

// ---- water: waves, sun glints, shallow colors and foam on the shore
const WATERU = { uTime: { value: 0 } };
{
  const w = WORLD.water, geo = new THREE.PlaneGeometry(W, W, 320, 320), pos = geo.attributes.position, dep = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) dep[i] = WATER - terrainHeight(pos.getX(i), -pos.getY(i));
  geo.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1));
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, roughness: 0.12, metalness: 0.15 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = WATERU.uTime;
    sh.vertexShader = 'attribute float aDepth; varying float vDepth; varying vec3 vWPos; uniform float uTime;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vDepth = aDepth; transformed.z += (sin(position.x * 0.35 + uTime * 1.6) + sin(position.y * 0.27 - uTime * 1.2)) * 0.05 * smoothstep(0.0, 1.5, aDepth);')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying float vDepth; varying vec3 vWPos; uniform float uTime;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float sh2 = smoothstep(0.0, 2.8, vDepth);
        diffuseColor.rgb = mix(vec3(0.32, 0.86, 0.92), vec3(0.05, 0.28, 0.6), sh2);
        float wob = sin(vWPos.x * 3.0 + uTime * 2.0) * 0.06 + sin(vWPos.z * 2.6 - uTime * 1.6) * 0.06;
        float foam = 1.0 - smoothstep(0.0, 0.45, vDepth + wob);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), foam * 0.9);
        diffuseColor.a = mix(0.7, 0.9, sh2);`)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(normal + vec3(sin(vWPos.x * 1.3 + uTime * 2.0) * 0.12, 0.0, cos(vWPos.z * 1.1 - uTime * 1.7) * 0.12));');
  };
  w.geometry.dispose(); w.geometry = geo; w.material = m; w.rotation.x = -Math.PI / 2;
}
const ripples = [];
function ripple(x, z, r = 1, life = 0.9) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, WATER + 0.05, z); m.scale.setScalar(0.1); scene.add(m); ripples.push({ m, r, t: life, max: life });
}

// ---- grass that sways in the wind and bends away from you, plus little flowers
const HMAP_N = 256, hmapData = new Float32Array(HMAP_N * HMAP_N);
for (let j = 0; j < HMAP_N; j++) for (let i = 0; i < HMAP_N; i++) hmapData[j * HMAP_N + i] = terrainHeight(-HALF + (i + 0.5) / HMAP_N * W, -HALF + (j + 0.5) / HMAP_N * W);
const hmap = new THREE.DataTexture(hmapData, HMAP_N, HMAP_N, THREE.RedFormat, THREE.FloatType); hmap.minFilter = hmap.magFilter = THREE.NearestFilter; hmap.generateMipmaps = false; hmap.needsUpdate = true;
const GRASSU = { uTime: { value: 0 }, uCenter: { value: new THREE.Vector2() }, uPlayer: { value: new THREE.Vector2() }, uWind: { value: new THREE.Vector2() }, uSnow: { value: 0 }, uHeight: { value: hmap } };
function grassMaterial(colorTop) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, GRASSU);
    sh.vertexShader = `uniform float uTime, uSnow; uniform vec2 uCenter, uPlayer, uWind; uniform sampler2D uHeight;\n` + sh.vertexShader.replace('#include <project_vertex>', `
      vec3 iOff = instanceMatrix[3].xyz;
      vec2 off = mod(iOff.xz - uCenter + 35.0, 70.0) - 35.0;
      vec2 wp = uCenter + off;
      float h = texture2D(uHeight, (wp + ${HALF.toFixed(1)}) / ${W.toFixed(1)}).r;
      float onPath = step(abs(wp.x - sin(wp.y * 0.08) * 1.5), 2.2) * step(9.0, wp.y) * step(wp.y, 62.0);
      float hide = step(h, ${(WATER + 0.25).toFixed(2)}) + step(6.5, h) + onPath + step(0.45, uSnow);
      float rnd = fract(sin(dot(iOff.xz, vec2(12.9898, 78.233))) * 43758.5453);
      float sc = (1.0 - min(hide, 1.0)) * (0.75 + rnd * 0.4) * (1.0 - smoothstep(28.0, 35.0, length(off)));
      vec3 p = mat3(instanceMatrix) * (transformed * sc);
      float bend = p.y * p.y * 2.2;
      p.x += bend * (sin(uTime * 2.0 + wp.x * 0.5 + wp.y * 0.3) * 0.12 + uWind.x);
      p.z += bend * (cos(uTime * 1.7 + wp.y * 0.4) * 0.08 + uWind.y);
      vec2 dpl = wp - uPlayer; float dd = length(dpl);
      if (dd < 1.4) p.xz += normalize(dpl + 0.0001) * bend * (1.4 - dd) * 1.6;
      vec4 mvPosition = viewMatrix * vec4(wp.x + p.x, h + p.y, wp.y + p.z, 1.0);
      gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);');
  };
  return m;
}
const bladeGeo = (() => { const g = new THREE.BufferGeometry(); const v = [-0.045, 0, 0, 0.045, 0, 0, 0.0, 0.36, 0]; g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3)); g.setAttribute('color', new THREE.Float32BufferAttribute([0.3, 0.55, 0.2, 0.3, 0.55, 0.2, 0.7, 0.95, 0.4], 3)); return g; })();
const grass = new THREE.InstancedMesh(bladeGeo, grassMaterial(), 16000); grass.frustumCulled = false; grass.castShadow = false; grass.receiveShadow = false;
{ const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color(); for (let i = 0; i < 16000; i++) { e.set(0, Math.random() * 6.28, 0); q.setFromEuler(e); mtx.compose(new THREE.Vector3(Math.random() * 70, 0, Math.random() * 70), q, new THREE.Vector3(1, 0.6 + Math.random() * 0.6, 1)); grass.setMatrixAt(i, mtx); col.setHSL(0.25 + Math.random() * 0.06, 0.55, 0.45 + Math.random() * 0.15); grass.setColorAt(i, col); } }
grass.visible = false;   // the user prefers no grass
const flowerGeo = (() => { const g = new THREE.BoxGeometry(0.09, 0.07, 0.09); g.translate(0, 0.2, 0); const n = g.attributes.position.count; g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(1), 3)); return g; })();
const flowers = new THREE.InstancedMesh(flowerGeo, grassMaterial(), 1800); flowers.frustumCulled = false;
{ const mtx = new THREE.Matrix4(), col = new THREE.Color(), cs = ['#ff5ad6', '#ffd34d', '#ffffff', '#8ab4ff', '#ff7a5a']; for (let i = 0; i < 1800; i++) { mtx.makeTranslation(Math.random() * 70, 0, Math.random() * 70); flowers.setMatrixAt(i, mtx); flowers.setColorAt(i, col.set(cs[i % cs.length])); } }
flowers.visible = false;   // the user prefers a clean ground

// ---- snow that builds up slowly on trees and roofs, puddles + wet ground in rain, footprints
const snowCaps = []; let SNOWACC = 0;
{
  const capMat = new THREE.MeshStandardMaterial({ color: '#f4f8ff', roughness: 0.8 });
  const capGeo = new THREE.BoxGeometry(1, 1, 1), capCone = new THREE.ConeGeometry(1, 1, 4);
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.color || o === groundMesh) return;
    const c = o.material.color, wp = new THREE.Vector3(); o.getWorldPosition(wp);
    if (wp.z < -58) return;
    const leafy = o.geometry.type === 'BoxGeometry' && c.g > c.r * 1.15 && c.g > c.b && o.scale.x > 1.2 && wp.y > 2.2;
    const roof = o.geometry.type === 'ConeGeometry' && o.geometry.parameters.radius > 2.5 && wp.y > 2.5 && wp.z > 36;
    if (!leafy && !roof) return;
    const cap = new THREE.Mesh(roof ? capCone : capGeo, capMat); cap.castShadow = false;
    if (roof) { cap.scale.set(o.geometry.parameters.radius * 0.62, o.geometry.parameters.height * 0.55, o.geometry.parameters.radius * 0.62); cap.position.set(wp.x, wp.y + o.geometry.parameters.height * 0.24, wp.z); cap.rotation.y = Math.PI / 4; }
    else { cap.scale.set(o.scale.x * 1.04, 0.14, o.scale.z * 1.04); cap.position.set(wp.x, wp.y + o.scale.y / 2 + 0.07, wp.z); cap.rotation.y = o.parent ? o.parent.rotation.y : 0; }
    cap.userData.full = cap.scale.y; cap.visible = false; scene.add(cap); snowCaps.push(cap);
  });
}
const puddleMat = new THREE.MeshStandardMaterial({ color: '#2a3a4a', roughness: 0.04, metalness: 0.7, transparent: true, opacity: 0, depthWrite: false });
const puddles = [];
for (let i = 0; i < 22; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(rand(0.6, 1.5), 18), puddleMat); m.rotation.x = -Math.PI / 2; m.scale.y = rand(0.6, 1); m.visible = false; scene.add(m); puddles.push(m); }
const footprints = []; let footT = 0, footSide = 1;
const footMat = new THREE.MeshStandardMaterial({ color: '#c8d4e4', roughness: 1, transparent: true, opacity: 0.9, depthWrite: false });
function updateWeatherGfx(dt) {
  const A = WX.amt;
  SNOWACC = Math.max(0, Math.min(1, SNOWACC + (A.snow > 0.5 ? dt / 50 : -dt / 35)));
  if (groundMesh) { groundMesh.material.emissive.setRGB(SNOWACC * 0.42, SNOWACC * 0.45, SNOWACC * 0.5); groundMesh.material.roughness = 0.92 - A.rain * 0.55; groundMesh.material.color.setScalar(1 - A.rain * 0.22); }
  const capsOn = Q().caps && SNOWACC > 0.02;
  for (const c of snowCaps) { c.visible = capsOn; if (capsOn) c.scale.y = c.userData.full * SNOWACC; }
  GRASSU.uSnow.value = SNOWACC;
  // puddles appear around you while it rains
  puddleMat.opacity = A.rain * 0.75;
  for (const p of puddles) {
    if (A.rain < 0.05) { p.visible = false; continue; }
    if (!p.visible || dist2(p.position.x, p.position.z, P.x, P.z) > 30) { for (let k = 0; k < 6; k++) { const a = rand(0, 6.28), r = rand(4, 28), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r, h = terrainHeight(x, z); if (h > WATER + 0.3 && h < 6 && Math.abs(terrainHeight(x + 1, z) - h) < 0.25) { p.position.set(x, h + 0.04, z); p.visible = true; break; } } }
    if (p.visible && Math.random() < dt * A.rain * 3) { const rp = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 18), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false })); rp.rotation.x = -Math.PI / 2; rp.position.set(p.position.x + rand(-0.5, 0.5), p.position.y + 0.02, p.position.z + rand(-0.5, 0.5)); rp.scale.setScalar(0.05); scene.add(rp); ripples.push({ m: rp, r: 0.35, t: 0.6, max: 0.6 }); }
  }
  // rain drops on the lake and river, ripples where you swim
  if (A.rain > 0.1) for (let k = 0; k < Math.round(A.rain * 4); k++) { const x = P.x + rand(-18, 18), z = P.z + rand(-18, 18); if (terrainHeight(x, z) < WATER - 0.1) ripple(x, z, 0.5, 0.6); }
  // footprints in the snow
  footT -= dt;
  if (SNOWACC > 0.3 && P.onGround && (P.mode === 'walk' || P.mode === 'run') && footT <= 0 && !RIDE.on) {
    footT = P.mode === 'run' ? 0.22 : 0.34; footSide = -footSide;
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.26), footMat); const sx = Math.cos(P.yaw) * 0.13 * footSide, sz = -Math.sin(P.yaw) * 0.13 * footSide;
    f.position.set(P.x + sx, height(P.x, P.z) + 0.03, P.z + sz); f.rotation.y = P.yaw; scene.add(f); footprints.push({ m: f, t: 12 });
    if (footprints.length > 70) { const o = footprints.shift(); scene.remove(o.m); }
  }
  for (let i = footprints.length - 1; i >= 0; i--) { const f = footprints[i]; f.t -= dt; if (f.t <= 0 || SNOWACC < 0.2) { scene.remove(f.m); footprints.splice(i, 1); } }
}

// ---- night lights: lanterns, camp fire, the lab and windows glow; fireflies in the forest
const nightLights = [];
function addNightLight(x, y, z, color, power, dist) { const l = new THREE.PointLight(color, 0, dist, 1.8); l.position.set(x, y, z); scene.add(l); nightLights.push({ l, power }); }
addNightLight(SPOTS.fire[0], terrainHeight(...SPOTS.fire) + 1.2, SPOTS.fire[1], '#ff9a3a', 25, 16);
addNightLight(SPOTS.lab[0], terrainHeight(...SPOTS.lab) + 3, SPOTS.lab[1] + 3, '#9fe8ff', 18, 14);
for (const [x, z] of [[-8, 58], [-14, 64], [22, 62], [-30, 58]]) addNightLight(x, terrainHeight(x, z) + 1.6, z + 2.4, '#ffcf6a', 10, 9);
addNightLight(SHOP_AT[0], terrainHeight(...SHOP_AT) + 2, SHOP_AT[1], '#ffb04a', 10, 10);
for (let i = 0; i < 6; i++) { const lx = -30 + i * 12, lz = -69; addNightLight(lx, terrainHeight(lx, lz) + 2.8, lz, '#ff7a2a', 14, 11); }
const FF_N = 220, ffGeo = new THREE.BufferGeometry(), ffPos = new Float32Array(FF_N * 3), ffCol = new Float32Array(FF_N * 3), ffPh = new Float32Array(FF_N);
for (let i = 0; i < FF_N; i++) { ffPos.set([rand(-28, 28), rand(0.4, 3), rand(-28, 28)], i * 3); ffPh[i] = rand(0, 6.28); }
ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3)); ffGeo.setAttribute('color', new THREE.BufferAttribute(ffCol, 3));
const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fireflies.frustumCulled = false; scene.add(fireflies);
function updateNightGfx(dt, t) {
  const L = dayLight(), dark = Math.max(1 - L, (WX.amt.rain + WX.amt.fog) * 0.5);
  for (const n of nightLights) n.l.intensity = n.power * dark * (1 + Math.sin(t * 9 + n.power) * 0.05);
  const ffOn = (1 - L) * (1 - WX.amt.rain) * (1 - WX.amt.snow);
  fireflies.visible = ffOn > 0.05 && regionAt(P.x, P.z) !== 'city';
  if (fireflies.visible) {
    for (let i = 0; i < FF_N; i++) {
      ffPos[i * 3] += Math.sin(t * 0.7 + ffPh[i]) * dt * 0.6; ffPos[i * 3 + 1] += Math.cos(t * 0.9 + ffPh[i]) * dt * 0.3; ffPos[i * 3 + 2] += Math.cos(t * 0.6 + ffPh[i] * 2) * dt * 0.6;
      const b = Math.max(0, Math.sin(t * 2.2 + ffPh[i] * 3)) * ffOn * 2.2; ffCol.set([0.75 * b, 1.0 * b, 0.25 * b], i * 3);
    }
    ffGeo.attributes.position.needsUpdate = true; ffGeo.attributes.color.needsUpdate = true;
    fireflies.position.set(P.x, height(P.x, P.z), P.z);
  }
}

// ---- battle VFX: element particles, slash arcs, hit flashes, camera shake, slow motion, light pillars
const vfx = [];
const ADD = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending });
const EFX = {
  fire: { c: ['#ff7a1a', '#ffd34d', '#ff3b1a'], up: [2, 6], grav: -2, add: true }, water: { c: ['#3ab0ff', '#bfe8ff', '#ffffff'], up: [3, 6], grav: 14 },
  plant: { c: ['#5cb043', '#c9e86a', '#2f8a3a'], up: [2, 4], grav: 3, leaf: true }, metal: { c: ['#ffffff', '#ffd34d'], up: [3, 7], grav: 18, add: true, fast: true },
  wind: { c: ['#ffffff', '#9fe8ff'], up: [0.5, 2], grav: 0, swirl: true, add: true }, stone: { c: ['#8c877f', '#a89a80', '#6f6a62'], up: [3, 6], grav: 20, chunk: true },
  light: { c: ['#fff6c8', '#ffe08a', '#ffffff'], up: [1, 4], grav: -1, add: true, star: true },
};
function elemVfx(el, x, y, z, big) {
  const f = EFX[el] || EFX.light, n = big ? 40 : 14;
  for (let i = 0; i < n; i++) {
    const s = f.chunk ? rand(0.12, 0.26) : f.leaf ? 0.16 : f.star ? 0.12 : rand(0.06, 0.13);
    const m = new THREE.Mesh(f.leaf ? new THREE.BoxGeometry(s, 0.02, s * 0.6) : new THREE.BoxGeometry(s, s, s), f.add ? ADD(f.c[i % f.c.length]) : new THREE.MeshBasicMaterial({ color: f.c[i % f.c.length], transparent: true }));
    m.position.set(x + rand(-0.3, 0.3), y + rand(-0.3, 0.3), z + rand(-0.3, 0.3)); scene.add(m);
    const sp = big ? 1.8 : 1, a = rand(0, 6.28);
    vfx.push({ m, v: new THREE.Vector3(Math.cos(a) * rand(1, 4) * sp * (f.fast ? 1.6 : 1), rand(...f.up) * sp, Math.sin(a) * rand(1, 4) * sp * (f.fast ? 1.6 : 1)), grav: f.grav, t: rand(0.4, 0.8) * (big ? 1.4 : 1), max: 0.8, spin: f.leaf || f.chunk ? rand(-8, 8) : 0, swirl: f.swirl ? a : null, shrink: true });
  }
  if (big) { const rm = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 40), ADD(f.c[0], 0.9)); rm.rotation.x = -Math.PI / 2; rm.position.set(x, terrainHeight(x, z) + 0.2, z); scene.add(rm); vfx.push({ m: rm, t: 0.6, max: 0.6, grow: 6 }); }
}
function slashArc(x, y, z, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 18, 1, 0, Math.PI * 0.85), ADD(color, 0.95)); m.position.set(x, y, z); m.lookAt(camera.position); m.rotateZ(rand(0, 6.28)); scene.add(m);
  vfx.push({ m, t: 0.18, max: 0.18, grow: 0.8 });
}
function hitFlash(e) {
  const r = e.boss ? 2.6 : 0.9 * (e.base || 1), m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), ADD('#ffffff', 0.55)); m.position.set(e.x, e.y + r, e.z); scene.add(m);
  vfx.push({ m, t: 0.12, max: 0.12, grow: 0.3 });
}
function lightPillar(x, y, z, color, h = 14) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, h, 20, 1, true), ADD(color, 0.75)); m.position.set(x, y + h / 2, z); m.material.side = THREE.DoubleSide; scene.add(m);
  vfx.push({ m, t: 1.2, max: 1.2, pillar: true });
}
function evoBurst(x, y, z) {
  for (const c of ['#ff5a8a', '#ffd34d', '#3ddc84', '#3ab0ff', '#b48cff']) { lightPillar(x + rand(-0.4, 0.4), y, z + rand(-0.4, 0.4), c, 18); }
  for (const el of Object.keys(ELEM)) elemVfx(el, x, y + 1.2, z, true);
  shake(0.5, 0.8);
}
const SHAKE = { t: 0, mag: 0 }, TIME = { scale: 1, t: 0 };
function shake(mag, dur) { if (mag >= SHAKE.mag || SHAKE.t <= 0) { SHAKE.mag = mag; SHAKE.t = dur; } }
function slowmo(scale, dur) { TIME.scale = scale; TIME.t = dur; }
function updateVfx(rawDt, t) {
  for (let i = vfx.length - 1; i >= 0; i--) {
    const f = vfx[i]; f.t -= rawDt; const k = Math.max(0, f.t / f.max);
    if (f.v) { if (f.swirl !== null && f.swirl !== undefined) { f.swirl += rawDt * 8; f.v.x = Math.cos(f.swirl) * 3; f.v.z = Math.sin(f.swirl) * 3; } f.v.y -= f.grav * rawDt; f.m.position.addScaledVector(f.v, rawDt); if (f.spin) { f.m.rotation.x += f.spin * rawDt; f.m.rotation.z += f.spin * rawDt; } if (f.shrink) f.m.scale.setScalar(Math.max(0.05, k)); }
    if (f.grow) f.m.scale.setScalar(1 + (1 - k) * f.grow * (f.m.geometry.type === 'RingGeometry' && f.max > 0.3 ? 4 : 1));
    if (f.pillar) { f.m.scale.set(1 - (1 - k) * 0.6, 1, 1 - (1 - k) * 0.6); }
    if (f.m.material.opacity !== undefined) f.m.material.opacity = (f.m.material.userData.o0 ??= f.m.material.opacity) * k;
    if (f.t <= 0) { scene.remove(f.m); f.m.geometry.dispose(); vfx.splice(i, 1); }
  }
  for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.t -= rawDt; const k = 1 - r.t / r.max; r.m.scale.setScalar(0.1 + k * r.r * 1.6); r.m.material.opacity = 0.6 * (1 - k); if (r.t <= 0) { scene.remove(r.m); r.m.geometry.dispose(); ripples.splice(i, 1); } }
  if (TIME.t > 0) { TIME.t -= rawDt; if (TIME.t <= 0) TIME.scale = 1; }
}
function applyShake(dt) { if (SHAKE.t > 0) { SHAKE.t -= dt; const m = SHAKE.mag * Math.min(1, SHAKE.t * 4); camera.position.x += rand(-m, m); camera.position.y += rand(-m, m) * 0.6; camera.position.z += rand(-m, m); } }
// ---- dust when running, a bigger puff when landing, splashes in water
let dustT = 0, wasAir = false, wasSwim = false;
function updateMoveFx(dt) {
  if (state !== 'play') return;
  dustT -= dt;
  const snowy = SNOWACC > 0.3, col = snowy ? '#f4f8ff' : regionAt(P.x, P.z) === 'city' ? '#e8e2d0' : '#b89a6a';
  if (P.mode === 'run' && P.onGround && !RIDE.on && dustT <= 0) { dustT = 0.12; puff(P.x - Math.sin(P.yaw) * 0.3, height(P.x, P.z) + 0.15, P.z - Math.cos(P.yaw) * 0.3, col, 0.25); }
  const air = P.mode === 'air';
  if (wasAir && !air && P.onGround) { for (let i = 0; i < 6; i++) puff(P.x + rand(-0.5, 0.5), height(P.x, P.z) + 0.1, P.z + rand(-0.5, 0.5), col, 0.35); }
  wasAir = air;
  const swim = P.mode === 'swim' || (RIDE.on && RIDE.kind === 'swim' && height(P.x, P.z) < WATER - 0.9);
  if (swim && !wasSwim) { ripple(P.x, P.z, 2.2, 1); elemVfx('water', P.x, WATER + 0.3, P.z, true); SFX.whoosh(); }
  if (swim && Math.random() < dt * 4) ripple(P.x + rand(-0.4, 0.4), P.z + rand(-0.4, 0.4), 1, 0.8);
  wasSwim = swim;
}
function puff(x, y, z, color, s) { const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false })); m.position.set(x, y, z); m.rotation.y = rand(0, 3); scene.add(m); vfx.push({ m, v: new THREE.Vector3(rand(-0.6, 0.6), rand(0.4, 1.0), rand(-0.6, 0.6)), grav: 0, t: 0.6, max: 0.6, grow: 1.2 }); }
function updateGfx(rawDt, t) {
  WATERU.uTime.value = t;
  GRASSU.uTime.value = t; GRASSU.uCenter.value.set(Math.round(P.x), Math.round(P.z)); GRASSU.uPlayer.value.set(P.x, P.z);
  GRASSU.uWind.value.set(Math.sin(WX.windDir) * WX.amt.wind * 0.45, Math.cos(WX.windDir) * WX.amt.wind * 0.45);
  updateSky(rawDt, t); if (RIDE.dragon) { scene.fog.far *= 1 + Math.min(1.6, P.flyH / 25); scene.fog.near *= 1.4; } updateWeatherGfx(rawDt); updateNightGfx(rawDt, t); updateVfx(rawDt, t); updateMoveFx(rawDt);
}

function rarity(sp) { const d = SPECIES[sp] || {}; if (d.legendary) return 'leg'; if (d.starter || d.evoOf) return 'rs'; const t = d.tier || 2; return t >= 5 ? 'r5' : t === 4 ? 'r4' : t === 3 ? 'r3' : 'r1'; }

// ====================================================================== MORPH LAB: fuse two caught Monstermon into a brand-new one
const MORPH_COST = 50;
const LAB_AT = [-21, 71];
const LAB_ROT = Math.PI / 2;                                   // the front of the building faces east (towards the village)
const labLocal = (lx, lz) => [LAB_AT[0] + lz, LAB_AT[1] - lx]; // local (x, z) -> world (x, z) for this rotation
const CHAMBER = labLocal(0, 6.2);
const PODS = [labLocal(-3.4, 3.4), labLocal(3.4, 3.4)];
const morphLab = new THREE.Group(); scene.add(morphLab);
{
  const y = height(...LAB_AT); morphLab.position.set(LAB_AT[0], y, LAB_AT[1]); morphLab.rotation.y = LAB_ROT;
  const steel = mat('#cfd8e4', { m: 0.55, r: 0.3 }), dark = mat('#2a3140', { m: 0.5, r: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 2.8, 24), steel); base.position.y = 1.4; base.castShadow = true; base.receiveShadow = true; morphLab.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9fe8ff', { op: 0.45, e: '#3ad0ff', ei: 0.35, r: 0.05, m: 0.2 })); dome.position.y = 2.8; morphLab.add(dome);
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.12, 8, 40), mat('#b48cff', { e: '#b48cff', ei: 1.6 })); ringM.rotation.x = Math.PI / 2; ringM.position.y = 2.8; morphLab.add(ringM);
  bx(morphLab, 0.15, 2.2, 0.15, dark, 0, 7.6, 0); const beacon2 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), mat('#ff5ad6', { e: '#ff5ad6', ei: 3 })); beacon2.position.y = 8.8; morphLab.add(beacon2); morphLab.userData.beacon = beacon2;
  bx(morphLab, 2.2, 2.4, 0.3, dark, 0, 1.2, 4.25); bx(morphLab, 1.6, 1.9, 0.05, mat('#3ad0ff', { e: '#3ad0ff', ei: 1.2, op: 0.8 }), 0, 1.05, 4.42);
  // sign
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#3ad0ff'); gr.addColorStop(1, '#b48cff'); c.fillStyle = '#0a1222'; c.fillRect(0, 0, 512, 128); c.strokeStyle = gr; c.lineWidth = 8; c.strokeRect(6, 6, 500, 116);
  c.fillStyle = gr; c.font = 'bold 64px Segoe UI'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🧬 MORPH LAB', 256, 66);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshBasicMaterial({ map: tex })); sign.position.set(0, 3.25, 4.5); morphLab.add(sign);
  // two glass pods with glowing liquid
  morphLab.userData.pods = [];
  for (const [lx, col] of [[-3.4, '#3ddc84'], [3.4, '#b48cff']]) {
    const pod = new THREE.Group(); pod.position.set(lx, 0, 3.4); morphLab.add(pod);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.6, 18, 1, true), mat('#bfefff', { op: 0.3, r: 0.05 })); glass.position.y = 1.5; glass.material.side = THREE.DoubleSide; pod.add(glass);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 1.6, 18), mat(col, { e: col, ei: 1.2, op: 0.55 })); liquid.position.y = 1.0; pod.add(liquid);
    bx(pod, 2, 0.3, 2, dark, 0, 0.15, 0); bx(pod, 2, 0.25, 2, dark, 0, 2.9, 0); morphLab.userData.pods.push(liquid);
  }
  // the fusion chamber in front: a platform, three pylons and floating rings
  const ch = new THREE.Group(); ch.position.set(0, 0, 6.2); morphLab.add(ch);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.35, 32), dark); plat.position.y = 0.17; plat.receiveShadow = true; ch.add(plat);
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.07, 8, 48), mat('#6fe3ff', { e: '#6fe3ff', ei: 2 })); glowRing.rotation.x = Math.PI / 2; glowRing.position.y = 0.38; ch.add(glowRing);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; bx(ch, 0.3, 2.4, 0.3, steel, Math.cos(a) * 2.6, 1.2, Math.sin(a) * 2.6); const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat('#ff5ad6', { e: '#ff5ad6', ei: 2.4 })); orb.position.set(Math.cos(a) * 2.6, 2.6, Math.sin(a) * 2.6); ch.add(orb); }
  morphLab.userData.chRings = [0, 1].map((i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(1.4 - i * 0.35, 0.05, 6, 40), mat(i ? '#b48cff' : '#6fe3ff', { e: i ? '#b48cff' : '#6fe3ff', ei: 2 })); r.position.y = 1.6; ch.add(r); return r; });
  addNightLight(CHAMBER[0], y + 2.5, CHAMBER[1], '#b48cff', 16, 12);
}

// ---- fusion rules
function nameBlend(a, b) {
  const pre = a.slice(0, Math.max(3, Math.ceil(a.length * 0.5))), suf = b.slice(Math.floor(b.length * 0.5)).toLowerCase();
  let n = pre + suf; n = n[0].toUpperCase() + n.slice(1);
  let k = 2, out = n; while (Object.values(SPECIES).some((s) => s.name === out)) out = n + ' ' + ['II', 'III', 'IV', 'V', 'VI'][Math.min(4, k++ - 2)];
  return out;
}
const tierOf = (sp) => SPECIES[sp].tier || (SPECIES[sp].starter || SPECIES[sp].evoOf || SPECIES[sp].legendary ? 3 : 2);
function fusionSpec(a, b, customName) {
  const A = SPECIES[a.sp], B = SPECIES[b.sp], ea = elemOf(a.sp), eb = elemOf(b.sp);
  let h = 0; for (const ch of a.sp + '|' + b.sp) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const abil = [...new Set([...(A.abilities || []), ...(B.abilities || [])])].slice(0, 2);
  const tier = Math.min(5, Math.max(tierOf(a.sp), tierOf(b.sp)) + 1);
  const name = (customName || '').trim().slice(0, 18) || nameBlend(A.name, B.name);
  return {
    name, fusion: true, elem: ea, elem2: eb, tier, abilities: abil, attack: A.attack || B.attack || 'melee', parents: [A.name, B.name],
    hp: Math.round((A.hp + B.hp) / 2 * 1.3), atk: Math.round((A.atk + B.atk) / 2 * 1.3), spd: Math.max(A.spd, B.spd),
    role: `🧬 Morph · ${'★'.repeat(tier)} ${ELEM[ea].name}${eb !== ea ? ' + ' + ELEM[eb].name : ''}`,
    about: `A MORPH created in the lab by fusing ${A.name} and ${B.name}. It has the power of ${ELEM[ea].icon} ${ELEM[ea].name}${eb !== ea ? ` and the colors of ${ELEM[eb].icon} ${ELEM[eb].name}` : ''}.${abil.length ? ' ' + abil.map((x) => ABILITIES[x][0] + ' ' + ABILITIES[x][1]).join(', ') + '.' : ''}`,
    skills: [
      { ...A.skills[0] }, { ...A.skills[1] }, { ...B.skills[2] },
      { name: `${name.toUpperCase()} FUSION BURST`, kind: 'aoe', power: Math.max(A.skills[3].power, B.skills[3].power) + 1, range: 5.5, desc: 'The combined power of both parents in one giant blast.' },
    ],
    plan: { seed: 90000 + (h % 100000), el: ea, el2: eb, fusion: true },
  };
}
function registerFusions() { for (const [id, spec] of Object.entries(save.fusions || {})) SPECIES[id] = spec; }

// ---- the Morph Lab window: pick two Monstermon, see the result, press MORPH
document.head.insertAdjacentHTML('beforeend', `<style>
  .mslots { display: grid; grid-template-columns: 1fr auto 1fr auto 1.3fr; gap: 12px; align-items: center; margin-top: 12px; }
  .mslot { background: var(--panel2); border: 2px dashed #2a3f6a; border-radius: 16px; padding: 10px; min-height: 210px; text-align: center; }
  .mslot.full { border-style: solid; border-color: #6fe3ff; } .mslot.res { border-color: #b48cff; box-shadow: 0 0 24px rgba(180,140,255,.35); }
  .msign { font-size: 34px; font-weight: 900; color: #b48cff; text-shadow: 0 0 12px rgba(180,140,255,.7); }
  .mpick { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-top: 12px; max-height: 300px; overflow-y: auto; }
  .mpick .tmc { text-align: center; padding: 6px; } .mpick .tmc img.tport { height: 90px; } .mpick .tmc.sel { outline: 3px solid #b48cff; }
  #morphName { width: 100%; background: #050a16; border: 2px solid #2a3f6a; color: #fff; border-radius: 10px; padding: 6px 10px; font-weight: 800; font-size: 16px; text-align: center; }
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="morph" class="overlay hidden"><div class="panel" style="width:min(1100px,96vw)">
  <div style="display:flex;justify-content:space-between;align-items:center"><h2>🧬 Morph Lab</h2><button class="btn" id="morphClose">✖ Close</button></div>
  <div style="color:var(--muted)">Choose <b>two</b> Monstermon you have caught. They fuse into a <b>brand-new Morph</b>: stronger (+1 ★), with the element of the first, the colors of the second and the special abilities of both. The two parents become the new one. Costs <b>${MORPH_COST} 🪙</b>.</div>
  <div class="mslots"><div class="mslot" id="mA"></div><div class="msign">+</div><div class="mslot" id="mB"></div><div class="msign">=</div><div class="mslot res" id="mR"></div></div>
  <div class="row" style="justify-content:center;margin-top:12px"><button class="btn blue big" id="morphGo">🧬 MORPH!</button></div>
  <div class="mpick" id="mList"></div></div></div>`);
NAV_OVERLAYS.push('morph'); EXTRA_BACK.morph = () => closeOverlay('morph');
$('morphClose').onclick = EXTRA_BACK.morph;
let mSel = [];
const allMine = () => [...save.team.map((m) => ({ m, where: 'team' })), ...save.garden.map((m) => ({ m, where: 'garden' }))];
function specShot(spec) {
  SPECIES.__morph = spec; const url = (() => { DEX_IMG.delete('__morph'); return dexShot('__morph'); })(); DEX_IMG.delete('__morph'); delete SPECIES.__morph; return url;
}
function openMorph() {
  openOverlay('morph');
  const mine = allMine(); mSel = mSel.filter((u) => mine.some((x) => x.m.uid === u));
  const slot = (u) => { const x = mine.find((y) => y.m.uid === u); if (!x) return '<div style="color:var(--muted);margin-top:70px">Pick a Monstermon below</div>'; const d = SPECIES[x.m.sp]; return `<img class="tport" src="${dexShot(x.m.sp)}" alt=""><b>${eIcon(x.m.sp)} ${d.name}</b><div style="font-size:12px;color:var(--muted)">Lv ${x.m.lv || 1} · ${'★'.repeat(tierOf(x.m.sp))}</div>`; };
  $('mA').innerHTML = slot(mSel[0]); $('mB').innerHTML = slot(mSel[1]);
  $('mA').classList.toggle('full', !!mSel[0]); $('mB').classList.toggle('full', !!mSel[1]);
  if (mSel.length === 2) {
    const [a, b] = mSel.map((u) => mine.find((y) => y.m.uid === u).m), sp = fusionSpec(a, b, $('morphName') && $('morphName').dataset.custom ? $('morphName').value : '');
    $('mR').innerHTML = `<img class="tport" src="${specShot(sp)}" alt=""><input id="morphName" maxlength="18" value="${sp.name}" title="Give it a name"><div style="font-size:12px;margin-top:4px">${sp.role}</div><div style="font-size:12px;color:var(--muted)">❤️ ${sp.hp} · ⚔️ ${sp.atk} · 💨 ${sp.spd}${sp.abilities.length ? ' · ' + sp.abilities.map((x) => ABILITIES[x][0] + ' ' + ABILITIES[x][1]).join(', ') : ''}</div><div style="font-size:12px;color:#d9c4ff">Ultimate: ${sp.skills[3].name}</div>`;
    $('morphName').oninput = () => { $('morphName').dataset.custom = '1'; };
  } else $('mR').innerHTML = '<div style="color:var(--muted);margin-top:60px">❔ The new Morph will appear here</div>';
  $('morphGo').disabled = mSel.length !== 2;
  $('mList').innerHTML = mine.map(({ m, where }) => `<div class="tmc rar-${rarity(m.sp)} ${mSel.includes(m.uid) ? 'sel' : ''}" data-u="${m.uid}"><img class="tport" data-sp="${m.sp}" alt=""><b style="font-size:13px">${eIcon(m.sp)} ${SPECIES[m.sp].name}</b><div style="font-size:11px;color:var(--muted)">Lv ${m.lv || 1} · ${where === 'team' ? '👥 team' : '🌱 garden'}</div></div>`).join('') || '<div style="color:var(--muted)">Catch some Monstermon first!</div>';
  $('mList').querySelectorAll('[data-u]').forEach((c) => c.onclick = () => { const u = c.dataset.u; if (mSel.includes(u)) mSel = mSel.filter((x) => x !== u); else if (mSel.length < 2) mSel.push(u); else mSel = [mSel[1], u]; openMorph(); });
  const imgs = [...$('mList').querySelectorAll('img[data-sp]')]; let k = 0; const tok = openMorph.tok = (openMorph.tok || 0) + 1;
  const step = () => { if (tok !== openMorph.tok || $('morph').classList.contains('hidden')) return; for (let n = 0; n < 5 && k < imgs.length; n++, k++) imgs[k].src = dexShot(imgs[k].dataset.sp); if (k < imgs.length) requestAnimationFrame(step); };
  step();
  tip('morph', `🧬 <b>Morph Lab:</b> pick two Monstermon and press <b>MORPH!</b> They fuse into a new, stronger creature that you can name yourself.`, '🧬 Morph Lab');
}
$('morphGo').onclick = () => {
  if (mSel.length !== 2) return;
  if (save.coins < MORPH_COST) { SFX.fail(); return toast(`🪙 A Morph costs ${MORPH_COST} coins. You need ${MORPH_COST - save.coins} more!`); }
  const mine = allMine(), [a, b] = mSel.map((u) => mine.find((y) => y.m.uid === u).m);
  const spec = fusionSpec(a, b, $('morphName') ? $('morphName').value : '');
  closeOverlay('morph'); startMorph(a, b, spec);
};

// ---- the fusion ceremony: pods glow, both creatures rise, spiral together, become a ball of light, and the new Morph is born
const MORPH = { on: false };
function startMorph(a, b, spec) {
  save.coins -= MORPH_COST; renderStats();
  const cy0 = height(...CHAMBER);
  const ma = buildMon(a.sp, 'happy'), mb = buildMon(b.sp, 'happy'); [ma, mb].forEach((m, i) => { m.position.set(PODS[i][0], cy0 + 0.6, PODS[i][1]); m.scale.setScalar(0.01); scene.add(m); });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); orb.scale.setScalar(0.01); orb.position.set(CHAMBER[0], cy0 + 2.2, CHAMBER[1]); scene.add(orb);
  Object.assign(MORPH, { on: true, t: 0, a, b, spec, ma, mb, orb, cy0, born: null, done: false, note: 0 });
  if (comp) comp.model.visible = false;
  if (RIDE.on) dismount();
  P.x = CHAMBER[0] + 7; P.z = CHAMBER[1] + 1; P.y = height(P.x, P.z); P.yaw = Math.atan2(CHAMBER[0] - P.x, CHAMBER[1] - P.z);
  document.body.classList.add('cine'); SFX.chime(520);
  toast(`🧬 The Morph Lab hums… <b>${SPECIES[a.sp].name}</b> and <b>${SPECIES[b.sp].name}</b> are fusing!`, 4000);
}
function updateMorph(dt, t) {
  if (!MORPH.on) return false;
  const M = MORPH; if (M.frozen) dt = 0; M.t += dt; const T = M.t, C0 = new THREE.Vector3(CHAMBER[0], M.cy0, CHAMBER[1]);
  morphLab.userData.chRings.forEach((r, i) => { r.rotation.x = T * (1.5 + i) * (1 + T * 0.4); r.rotation.y = T * (2 - i); r.scale.setScalar(1 + Math.min(0.45, T * 0.06)); });
  morphLab.userData.pods.forEach((p) => p.material.emissiveIntensity = 1.2 + Math.sin(T * 12) * 0.8);
  const els = [elemOf(M.a.sp), elemOf(M.b.sp)];
  if (T < 1.2) { const k = T / 1.2; [M.ma, M.mb].forEach((m) => m.scale.setScalar(Math.max(0.01, k))); if (!M.p0) { M.p0 = 1; PODS.forEach((p, i) => lightPillar(p[0], M.cy0, p[1], i ? '#b48cff' : '#3ddc84', 6)); } }
  else if (T < 2.4) { const k = (T - 1.2) / 1.2; [M.ma, M.mb].forEach((m, i) => { const s = PODS[i], side = i ? 1 : -1; m.position.set(s[0] + (C0.x - s[0]) * k, M.cy0 + 0.6 + k * 1.4, s[1] + (C0.z + side * 2.4 - s[1]) * k); m.rotation.y = T * 2; }); }
  else if (T < 5.2) {
    const k = (T - 2.4) / 2.8, r = 2.4 * (1 - k), ang = (T - 2.4) * (2 + k * 9);
    [M.ma, M.mb].forEach((m, i) => { const a2 = ang + i * Math.PI; m.position.set(C0.x + Math.cos(a2) * r, M.cy0 + 2 + Math.sin(T * 3) * 0.25, C0.z + Math.sin(a2) * r); m.rotation.y = -a2; m.scale.setScalar(1 - k * 0.4); if (Math.random() < 0.6) elemVfx(els[i], m.position.x, m.position.y + 0.6, m.position.z, false); });
    M.note -= dt; if (M.note <= 0) { M.note = 0.28 - k * 0.15; tone(300 + k * 900, 0.18, 'triangle', 0.06); }
    M.orb.scale.setScalar(k * 0.6);
  }
  else if (T < 6.0) { const k = (T - 5.2) / 0.8; [M.ma, M.mb].forEach((m) => { m.scale.setScalar(Math.max(0.01, 0.6 * (1 - k))); m.position.lerp(new THREE.Vector3(C0.x, M.cy0 + 2.2, C0.z), 0.3); }); M.orb.scale.setScalar(0.6 + k * 2.2); M.orb.material.opacity = 0.95; }
  else if (!M.born) {
    // the birth: flash, burst of every element color, and the new Morph appears
    scene.remove(M.ma); scene.remove(M.mb); $('evo').style.opacity = 1; setTimeout(() => $('evo').style.opacity = 0, 450);
    evoBurst(C0.x, M.cy0 + 0.5, C0.z); SFX.evo(); rumble(1, 900);
    const id = 'f' + Date.now().toString(36); save.fusions = save.fusions || {}; save.fusions[id] = M.spec; SPECIES[id] = M.spec; M.id = id;
    M.born = buildMon(id, 'happy'); M.born.position.set(C0.x, M.cy0 + 2.2, C0.z); M.born.scale.setScalar(0.01); scene.add(M.born);
    $('cineTitle').innerHTML = `<small>NEW MORPH</small>${M.spec.name.toUpperCase()}`; $('cineTitle').style.opacity = 1;
  }
  if (M.born) {
    const k = Math.min(1, (T - 6.0) / 0.9); M.born.scale.setScalar(Math.max(0.01, k)); M.born.rotation.y += dt * (6 - k * 5);
    M.born.position.y = M.cy0 + 0.4 + (1 - k) * 1.8; M.orb.scale.setScalar(Math.max(0.01, 2.8 * (1 - k))); M.orb.material.opacity = 0.9 * (1 - k);
    M.born.userData.anim(t, { celebrate: k >= 1 });
    if (T > 6.9 && !M.roared) { M.roared = true; roar(0.7, true); M.born.rotation.y = Math.atan2(P.x - C0.x, P.z - C0.z); }
  }
  // the camera circles the chamber
  const ca = Math.sin(T * 0.32) * 0.95, cd = 10.5 - Math.min(2.5, T * 0.3);   // stays on the open (east) side of the lab
  camera.position.set(C0.x + Math.cos(ca) * cd, M.cy0 + 4.2 + Math.sin(T * 0.5) * 0.5, C0.z + Math.sin(ca) * cd); camera.lookAt(C0.x, M.cy0 + 1.6, C0.z);
  if (T > 9 && !M.done) finishMorph();
  return true;
}
function finishMorph() {
  const M = MORPH; M.done = true;
  scene.remove(M.born); scene.remove(M.orb); document.body.classList.remove('cine'); $('cineTitle').style.opacity = 0;
  const wasActive = activeMember(), uidsGone = [M.a.uid, M.b.uid];
  const keepXp = Math.max(M.a.xp || 0, M.b.xp || 0);
  save.team = save.team.filter((m) => !uidsGone.includes(m.uid)); save.garden = save.garden.filter((m) => !uidsGone.includes(m.uid));
  const nm = newMember(M.id); nm.xp = keepXp; nm.lv = levelOf(nm); nm.maxHp = memberMax(nm); nm.hp = nm.maxHp; nm.happy = 100;
  if (save.team.length < 7) save.team.push(nm); else save.garden.push(nm);
  let idx = wasActive && !uidsGone.includes(wasActive.uid) ? save.team.indexOf(wasActive) : save.team.indexOf(nm); if (idx < 0) idx = 0; save.active = idx;
  spawnCompanion(save.team[save.active]); rebuildGarden(); mSel = [];
  save.stats.morphs = (save.stats.morphs || 0) + 1; checkMedals(); persist(); cam.snap = true; MORPH.on = false;
  toast(`🧬✨ <b>${M.spec.name}</b> was born in the Morph Lab! It joined your ${save.team.includes(nm) ? 'team' : 'garden'}.`, 6000);
  tip('morphdone', `🧬 Your Morph keeps the <b>highest XP</b> of its parents and is <b>one star stronger</b>. Its ultimate is a <b>FUSION BURST</b>! You can morph Morphs too…`, '🧬 New Morph');
}
MEDALS.push(['morph', '🧬', 'Mad Scientist', 'Create your first Morph in the Morph Lab', () => (save.stats.morphs || 0) >= 1]);
function updateLabIdle(t) { if (morphLab.userData.beacon) morphLab.userData.beacon.material.emissiveIntensity = 2 + Math.sin(t * 4) * 1.5; if (!MORPH.on) morphLab.userData.chRings.forEach((r, i) => { r.rotation.x = t * (0.6 + i * 0.4); r.rotation.y = t * 0.8; }); }

// ====================================================================== TOUCH CONTROLS (tablets and phones)
// Left half: a floating joystick wherever the thumb lands. Push it further up past the ring to LOCK RUN.
// Right side: action buttons. Drag on empty space turns the camera, pinch with two fingers zooms.
const TOUCH = { mode: qs.has('touch') || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches), x: 0, y: 0, mag: 0, stickId: null, lock: false, lockReady: false, cams: new Map(), pinch: null };
const TLBL = { jump: '⬆️ Jump', run: 'a long push on the stick', talk: 'the 💬 bubble', attack: '⚔️ Attack', skill1: '✨1', skill2: '✨2', ult: '⚡ Ultimate', cube: '🧊 Cube', dodge: '💨 Roll', team: '👥 Team', pause: '⏸', move: 'the left stick', help: '❓', potion: '🧪', ride: '🐉 Ride' };
for (const k of Object.keys(TLBL)) { const orig = BTN[k]; BTN[k] = () => TOUCH.mode ? TLBL[k] : (orig ? orig() : ''); }
document.head.insertAdjacentHTML('beforeend', `<style>
  #touchLayer { position: fixed; inset: 0; z-index: 3; touch-action: none; display: none; }
  body.touch #touchLayer { display: block; } body.touch .hint { display: none; }
  body.touch #comp { top: 70px; bottom: auto; transform: scale(.82); transform-origin: top left; }
  body.touch #mapWrap { top: 150px; bottom: auto; transform: scale(.78); transform-origin: top right; }
  body.touch #tip { left: 50%; top: 120px; transform: translateX(-50%); width: 360px; }
  body.touch #tip.pop { animation: none; }
  body.touch #dialog { bottom: 24px; }
  .tbase { position: fixed; width: 150px; height: 150px; margin: -75px 0 0 -75px; border-radius: 50%; background: radial-gradient(circle, rgba(111,227,255,.10), rgba(10,16,36,.35)); box-shadow: 0 0 0 2px rgba(111,227,255,.45), 0 0 24px rgba(111,227,255,.25); pointer-events: none; display: none; }
  .tknob { position: fixed; width: 66px; height: 66px; margin: -33px 0 0 -33px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #bff3ff, #3ab0ff 60%, #1a4fb0); box-shadow: 0 0 18px rgba(58,176,255,.7); pointer-events: none; display: none; }
  .tlock { position: fixed; padding: 6px 12px; margin-left: -48px; border-radius: 999px; font-weight: 900; font-size: 14px; color: #fff; background: rgba(10,16,36,.75); box-shadow: 0 0 0 2px rgba(255,211,77,.5); pointer-events: none; display: none; }
  .tlock.on { background: linear-gradient(120deg, #ffb02a, #ff5ad6); box-shadow: 0 0 18px rgba(255,176,42,.7); }
  #tLockBadge { position: fixed; left: 24px; bottom: 24px; padding: 10px 16px; border-radius: 999px; font-weight: 900; color: #2a1a00; background: linear-gradient(180deg, #ffe08a, #ffb02a); box-shadow: 0 6px 18px rgba(255,176,42,.5); display: none; z-index: 4; }
  .tbtn { position: fixed; z-index: 4; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; text-align: center; line-height: 1.05; user-select: none; -webkit-user-select: none; touch-action: none;
    background: radial-gradient(circle at 35% 30%, rgba(60,80,140,.9), rgba(12,18,40,.88)); box-shadow: 0 6px 18px rgba(0,0,0,.45), 0 0 0 2px rgba(111,227,255,.35); backdrop-filter: blur(6px); transition: transform .08s; }
  .tbtn.down { transform: scale(.9); box-shadow: 0 0 0 3px #6fe3ff, 0 0 22px rgba(111,227,255,.7); }
  .tbtn small { display: block; font-size: 10px; font-weight: 700; opacity: .85; }
  .tbtn.big { background: radial-gradient(circle at 35% 30%, #ff8a6a, #e53950 60%, #8a1430); box-shadow: 0 8px 22px rgba(229,57,80,.5), 0 0 0 2px rgba(255,200,200,.45); }
  .tbtn.jump { background: radial-gradient(circle at 35% 30%, #8affc0, #2fb36a 60%, #145a34); }
  .tbtn.talk { background: radial-gradient(circle at 35% 30%, #ffe08a, #ffb02a 60%, #8a5a10); color: #2a1a00; }
  .tbtn.ult { background: radial-gradient(circle at 35% 30%, #fff3a0, #ffd34d 60%, #a07a10); color: #2a1a00; }
  .tbtn.cube { background: radial-gradient(circle at 35% 30%, #bff3ff, #3ad0ff 60%, #106080); }
  .tbtn.dis { opacity: .45; }
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="touchLayer"></div><div class="tbase" id="tBase"></div><div class="tknob" id="tKnob"></div><div class="tlock" id="tLock">🔒 RUN</div><div id="tLockBadge">🔒 Running · tap to stop</div><div id="tBtns"></div>`);
// right-hand buttons: [action, label, sub, size, right, bottom, class]
const TBTNS = [
  ['attack', '⚔️', 'ATTACK', 110, 40, 60, 'big'], ['jumpPress', '⬆️', 'JUMP', 78, 170, 34, 'jump'], ['talk', '💬', 'TALK', 70, 30, 190, 'talk'],
  ['dodge', '💨', 'ROLL', 64, 160, 128, ''], ['skill1', '✨1', 'SKILL', 60, 120, 196, ''], ['skill2', '✨2', 'SKILL', 60, 200, 210, ''],
  ['ult', '⚡', 'ULTI', 64, 270, 150, 'ult'], ['cube', '🧊', 'CUBE', 66, 270, 60, 'cube'],
  ['ride', '🐉', 'RIDE', 54, 30, 275, ''], ['potion', '🧪', '', 50, 96, 280, ''], ['team', '👥', 'TEAM', 54, 160, 286, ''], ['pause', '⏸', '', 50, 226, 292, ''],
];
$('tBtns').innerHTML = TBTNS.map(([a, l, sub, size, r, b, cls]) => `<div class="tbtn ${cls}" data-a="${a}" style="width:${size}px;height:${size}px;right:${r}px;bottom:${b}px;font-size:${Math.round(size * 0.32)}px">${l}${sub ? `<small>${sub}</small>` : ''}</div>`).join('');
function setTouchMode(on) { TOUCH.mode = on; document.body.classList.toggle('touch', on); $('tBtns').style.display = on && state === 'play' ? '' : 'none'; hintBar(); }
addEventListener('touchstart', () => { if (!TOUCH.mode) setTouchMode(true); }, { capture: true, passive: true });
addEventListener('keydown', () => { if (TOUCH.mode && !qs.has('touch')) setTouchMode(false); });
document.querySelectorAll('.tbtn').forEach((b) => {
  const a = b.dataset.a;
  b.addEventListener('touchstart', (e) => {
    e.preventDefault(); e.stopPropagation(); b.classList.add('down'); audio();
    if (dlg.open && (a === 'talk' || a === 'jumpPress' || a === 'attack')) { press.add('talk'); return; }
    press.add(a);
    if (a === 'jumpPress') keys.Space = true;          // hold: swim up / fly up
    if (a === 'dodge') keys.KeyQ = true;               // hold while flying: go down
    if (navigator.vibrate) navigator.vibrate(12);
  }, { passive: false });
  const up = (e) => { e.preventDefault(); b.classList.remove('down'); if (a === 'jumpPress') keys.Space = false; if (a === 'dodge') keys.KeyQ = false; };
  b.addEventListener('touchend', up, { passive: false }); b.addEventListener('touchcancel', up, { passive: false });
});
$('tLockBadge').addEventListener('touchstart', (e) => { e.preventDefault(); TOUCH.lock = false; $('tLockBadge').style.display = 'none'; }, { passive: false });
$('dialog').addEventListener('click', () => { if (dlg.open) showLine(); });
const R0 = 62;
const layer = $('touchLayer');
function stickPos(t) { const dx = t.clientX - TOUCH.ox, dy = t.clientY - TOUCH.oy, d = Math.hypot(dx, dy), k = d > R0 ? R0 / d : 1; return { dx, dy, d, kx: dx * k, ky: dy * k }; }
layer.addEventListener('touchstart', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth * 0.45 && TOUCH.stickId === null) {
      // new joystick wherever the thumb lands; touching it again cancels run-lock
      TOUCH.stickId = t.identifier; TOUCH.ox = t.clientX; TOUCH.oy = t.clientY; TOUCH.lock = false; $('tLockBadge').style.display = 'none';
      $('tBase').style.display = $('tKnob').style.display = 'block'; $('tBase').style.left = $('tKnob').style.left = t.clientX + 'px'; $('tBase').style.top = $('tKnob').style.top = t.clientY + 'px';
      $('tLock').style.display = 'block'; $('tLock').style.left = t.clientX + 'px'; $('tLock').style.top = (t.clientY - R0 * 2.4) + 'px'; $('tLock').classList.remove('on');
    } else TOUCH.cams.set(t.identifier, { x: t.clientX, y: t.clientY });
  }
  if (TOUCH.cams.size === 2) { const [a, b] = [...TOUCH.cams.values()]; TOUCH.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.dist }; }
}, { passive: false });
layer.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === TOUCH.stickId) {
      const p = stickPos(t); TOUCH.x = p.kx / R0; TOUCH.y = p.ky / R0; TOUCH.mag = Math.min(1, p.d / R0);
      $('tKnob').style.left = (TOUCH.ox + p.kx) + 'px'; $('tKnob').style.top = (TOUCH.oy + p.ky) + 'px';
      TOUCH.lockReady = p.dy < -R0 * 1.7 && Math.abs(p.dx) < R0 * 0.9; $('tLock').classList.toggle('on', TOUCH.lockReady);
      if (TOUCH.lockReady) tip('runlock', `🔒 Let go now to <b>lock run</b>: you keep running forward on your own. Touch the stick again to stop.`, '🏃 Run lock');
    } else if (TOUCH.cams.has(t.identifier)) {
      const c = TOUCH.cams.get(t.identifier), s = save.settings.sens;
      if (TOUCH.cams.size === 1) { cam.yaw -= (t.clientX - c.x) * 0.007 * s; cam.pitch = Math.min(1.2, Math.max(-0.05, cam.pitch + (t.clientY - c.y) * 0.005 * s)); }
      c.x = t.clientX; c.y = t.clientY;
    }
  }
  if (TOUCH.cams.size === 2 && TOUCH.pinch) { const [a, b] = [...TOUCH.cams.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); cam.dist = Math.min(16, Math.max(3.5, TOUCH.pinch.dist * TOUCH.pinch.d / Math.max(20, d))); }
}, { passive: false });
const touchEnd = (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === TOUCH.stickId) {
      if (TOUCH.lockReady) { TOUCH.lock = true; $('tLockBadge').style.display = 'block'; SFX.chime(880); }
      TOUCH.stickId = null; TOUCH.x = TOUCH.y = TOUCH.mag = 0; TOUCH.lockReady = false;
      $('tBase').style.display = $('tKnob').style.display = $('tLock').style.display = 'none';
    }
    TOUCH.cams.delete(t.identifier);
  }
  if (TOUCH.cams.size < 2) TOUCH.pinch = null;
};
layer.addEventListener('touchend', touchEnd, { passive: false }); layer.addEventListener('touchcancel', touchEnd, { passive: false });
// tell the movement code what the thumb is doing (returns [x, z, analog, run] or null)
function touchMove() {
  if (!TOUCH.mode) return null;
  if (TOUCH.lock) return [0, 1, 1, true];
  if (TOUCH.stickId === null || TOUCH.mag < 0.12) return null;
  return [TOUCH.x, -TOUCH.y, Math.min(1, TOUCH.mag), TOUCH.mag > 0.92];
}
function updateTouchUI() {
  if (!TOUCH.mode) return;
  updateTouchDials();
  $('tBtns').style.display = state === 'play' && !paused ? '' : 'none';
  const ultBtn = document.querySelector('.tbtn[data-a="ult"]'); if (ultBtn) ultBtn.classList.toggle('dis', ULT.v < 100);
  const rideBtn = document.querySelector('.tbtn[data-a="ride"]'); if (rideBtn) rideBtn.style.display = comp && RIDEABLE[comp.m.sp] ? '' : 'none';
  if (state !== 'play' && TOUCH.lock) { TOUCH.lock = false; $('tLockBadge').style.display = 'none'; }
}
if (TOUCH.mode) setTimeout(() => setTouchMode(true), 0);

// ====================================================================== CUSTOMIZABLE TOUCH LAYOUT (move, resize, hide every button; saved on this device)
const TLAYOUT_KEY = 'dreamplay_touch_layout';
function loadLayout() { try { return JSON.parse(localStorage.getItem(TLAYOUT_KEY) || '{}'); } catch (e) { return {}; } }
let TL = loadLayout();
const TEDIT = { on: false, sel: null, drag: null };
function applyLayout() {
  const g = TL._global || { size: 1, opacity: 1 };
  document.querySelectorAll('.tbtn').forEach((b) => {
    const a = b.dataset.a, def = TBTNS.find((x) => x[0] === a), L = TL[a] || {};
    const size = Math.round((L.size || def[3]) * g.size), r = L.r ?? def[4], bt = L.b ?? def[5];
    Object.assign(b.style, { width: size + 'px', height: size + 'px', right: r + 'px', bottom: bt + 'px', fontSize: Math.round(size * 0.32) + 'px', opacity: L.hidden ? (TEDIT.on ? 0.25 : 0) : g.opacity, pointerEvents: L.hidden && !TEDIT.on ? 'none' : '' });
  });
}
function saveLayout() { try { localStorage.setItem(TLAYOUT_KEY, JSON.stringify(TL)); } catch (e) { } }
document.head.insertAdjacentHTML('beforeend', `<style>
  .tbtn { flex-direction: column; }
  body.tedit .tbtn { outline: 2px dashed rgba(255,211,77,.7); outline-offset: 3px; }
  body.tedit .tbtn.tsel { outline: 3px solid #ffd34d; box-shadow: 0 0 24px rgba(255,211,77,.7); }
  #tEditBar { position: fixed; left: 50%; top: 70px; transform: translateX(-50%); z-index: 30; display: none; padding: 12px 16px; border-radius: 20px; min-width: 560px; max-width: 94vw; color: #fff;
    background: linear-gradient(rgba(10,16,34,.95), rgba(10,16,34,.95)) padding-box, linear-gradient(120deg, #3ad0ff, #8a7dff, #ff5ad6) border-box; border: 2px solid transparent; box-shadow: 0 20px 50px rgba(0,0,0,.6); }
  body.tedit #tEditBar { display: block; }
  #tEditBar .r { display: flex; gap: 10px; align-items: center; margin-top: 8px; flex-wrap: wrap; } #tEditBar label { font-weight: 800; min-width: 130px; } #tEditBar input[type=range] { flex: 1; min-width: 160px; accent-color: #8a7dff; }
  #tEditDim { position: fixed; inset: 0; z-index: 2; background: rgba(0,0,0,.35); display: none; } body.tedit #tEditDim { display: block; } body.tedit .tbtn { z-index: 31; }
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="tEditDim"></div><div id="tEditBar"><b style="font-size:17px">✏️ Edit touch controls</b><div style="color:#9fb3d8;font-size:13px">Drag any button to move it. Tap a button to select it, then change its size or hide it. Everything is saved on this tablet.</div>
  <div class="r"><label id="tSelName">Selected: none</label><input type="range" id="tSelSize" min="40" max="160" step="2"><button class="btn" id="tSelHide">🙈 Hide / show</button></div>
  <div class="r"><label>All buttons size</label><input type="range" id="tAllSize" min="0.6" max="1.5" step="0.05"><label style="min-width:auto">See-through</label><input type="range" id="tAllOp" min="0.3" max="1" step="0.05"></div>
  <div class="r" style="justify-content:flex-end"><button class="btn" id="tReset">↺ Reset to default</button><button class="btn blue" id="tDone">✔ Done</button></div></div>`);
// all the commands (extra: help, dex and the look)
TBTNS.push(['help', '❓', 'HELP', 46, 300, 300, ''], ['dex', '📖', 'DEX', 46, 352, 300, ''], ['avatar', '👕', 'LOOK', 46, 404, 300, '']);
$('tBtns').insertAdjacentHTML('beforeend', TBTNS.slice(-3).map(([a, l, sub]) => `<div class="tbtn" data-a="${a}">${l}<small>${sub}</small></div>`).join(''));
document.querySelectorAll('.tbtn[data-a="help"], .tbtn[data-a="dex"], .tbtn[data-a="avatar"]').forEach((b) => {
  b.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (TEDIT.on) return; b.classList.add('down'); press.add(b.dataset.a); }, { passive: false });
  b.addEventListener('touchend', (e) => { e.preventDefault(); b.classList.remove('down'); }, { passive: false });
});
const TNAME = { attack: 'Attack', jumpPress: 'Jump', talk: 'Talk', dodge: 'Roll', skill1: 'Skill 1', skill2: 'Skill 2', ult: 'Ultimate', cube: 'FoldCube', ride: 'Ride', potion: 'Potion', team: 'Team', pause: 'Pause', help: 'Help', dex: 'Dex', avatar: 'Look' };
function selectBtn(a) {
  TEDIT.sel = a; document.querySelectorAll('.tbtn').forEach((b) => b.classList.toggle('tsel', b.dataset.a === a));
  const def = TBTNS.find((x) => x[0] === a); $('tSelName').textContent = 'Selected: ' + (TNAME[a] || a); $('tSelSize').value = (TL[a] && TL[a].size) || def[3];
}
function startEdit() {
  TEDIT.on = true; document.body.classList.add('tedit'); $('tBtns').style.display = '';
  const g = TL._global || { size: 1, opacity: 1 }; $('tAllSize').value = g.size; $('tAllOp').value = g.opacity; applyLayout();
  tip('tedit', '✏️ Move the buttons where your thumbs like them best! Your layout stays saved on this tablet.', '✏️ Edit controls');
}
function stopEdit() { TEDIT.on = false; TEDIT.sel = null; document.body.classList.remove('tedit'); document.querySelectorAll('.tbtn').forEach((b) => b.classList.remove('tsel')); saveLayout(); applyLayout(); toast('✔ Touch controls saved!'); }
document.querySelectorAll('.tbtn').forEach((b) => {
  b.addEventListener('touchstart', (e) => {
    if (!TEDIT.on) return; e.preventDefault(); e.stopImmediatePropagation();
    const t = e.changedTouches[0], r = b.getBoundingClientRect(); selectBtn(b.dataset.a);
    TEDIT.drag = { a: b.dataset.a, b, ox: t.clientX, oy: t.clientY, r: innerWidth - r.right, bt: innerHeight - r.bottom };
  }, { passive: false, capture: true });
});
addEventListener('touchmove', (e) => {
  if (!TEDIT.on || !TEDIT.drag) return; e.preventDefault();
  const t = e.changedTouches[0], d = TEDIT.drag, L = TL[d.a] = TL[d.a] || {};
  L.r = Math.max(0, Math.min(innerWidth - 40, d.r - (t.clientX - d.ox))); L.b = Math.max(0, Math.min(innerHeight - 40, d.bt - (t.clientY - d.oy))); applyLayout();
}, { passive: false });
addEventListener('touchend', () => { if (TEDIT.drag) { TEDIT.drag = null; saveLayout(); } });
$('tSelSize').oninput = () => { if (!TEDIT.sel) return; (TL[TEDIT.sel] = TL[TEDIT.sel] || {}).size = +$('tSelSize').value; applyLayout(); };
$('tSelHide').onclick = () => { if (!TEDIT.sel) return toast('Tap a button first to select it.'); const L = TL[TEDIT.sel] = TL[TEDIT.sel] || {}; L.hidden = !L.hidden; applyLayout(); };
$('tAllSize').oninput = () => { (TL._global = TL._global || { size: 1, opacity: 1 }).size = +$('tAllSize').value; applyLayout(); };
$('tAllOp').oninput = () => { (TL._global = TL._global || { size: 1, opacity: 1 }).opacity = +$('tAllOp').value; applyLayout(); };
$('tReset').onclick = () => { TL = {}; saveLayout(); applyLayout(); toast('↺ Buttons are back to the default places.'); };
$('tDone').onclick = stopEdit;
applyLayout();

// ====================================================================== TOUCH BUTTONS: glass style with line icons, colored rings, charge + cooldown dials
const TI = {
  attack: ['#ff4d6d', 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2'],
  jumpPress: ['#3ddc84', 'M12 19V5M5 12l7-7 7 7'],
  talk: ['#ffd34d', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  dodge: ['#6fe3ff', 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  skill1: ['#b48cff', 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z'],
  skill2: ['#d98cff', 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z'],
  ult: ['#ffd34d', 'M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  cube: ['#3ad0ff', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12'],
  ride: ['#ff8a3a', 'M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9'],
  potion: ['#ff5ad6', 'M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3'],
  team: ['#6fe3ff', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
  pause: ['#9fb3d8', 'M7 4h3v16H7zM14 4h3v16h-3z'],
  help: ['#9fb3d8', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01'],
  dex: ['#9fb3d8', 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  avatar: ['#9fb3d8', 'M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z'],
};
const TSUB = { attack: 'Attack', jumpPress: 'Jump', talk: 'Talk', dodge: 'Roll', skill1: 'Skill 1', skill2: 'Skill 2', ult: 'Ultimate', cube: 'Cube', ride: 'Ride', potion: 'Potion', team: 'Team', pause: 'Pause', help: 'Help', dex: 'Dex', avatar: 'Look' };
document.querySelectorAll('.tbtn').forEach((b) => {
  const [ac, d] = TI[b.dataset.a] || ['#6fe3ff', ''];
  b.style.setProperty('--ac', ac);
  b.innerHTML = `<span class="cdm"></span><span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg></span><small>${TSUB[b.dataset.a] || ''}</small>`;
});
document.head.insertAdjacentHTML('beforeend', `<style>
  .tbtn, .tbtn.big, .tbtn.jump, .tbtn.talk, .tbtn.ult, .tbtn.cube { color: #fff;
    background: radial-gradient(circle at 50% 30%, rgba(255,255,255,.14), rgba(12,18,40,.30) 62%, rgba(8,12,28,.42)) !important;
    backdrop-filter: blur(8px) saturate(160%); -webkit-backdrop-filter: blur(8px) saturate(160%);
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ac) 75%, transparent), inset 0 0 22px color-mix(in srgb, var(--ac) 20%, transparent), 0 8px 22px rgba(0,0,0,.35) !important; }
  .tbtn .ti { display: flex; justify-content: center; width: 100%; pointer-events: none; }
  .tbtn .ti svg { width: 40%; height: auto; stroke: #fff; filter: drop-shadow(0 0 5px var(--ac)); }
  .tbtn small { font-size: 9px; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; margin-top: 2px; color: color-mix(in srgb, var(--ac) 55%, white); opacity: .95; pointer-events: none; }
  .tbtn[data-a="attack"] small { font-size: 11px; } .tbtn[data-a="attack"] .ti svg { width: 36%; }
  .tbtn.down { transform: scale(.92); background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--ac) 55%, transparent), rgba(10,16,36,.45)) !important;
    box-shadow: inset 0 0 0 2px var(--ac), 0 0 26px color-mix(in srgb, var(--ac) 65%, transparent) !important; }
  .tbtn .cdm { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; background: conic-gradient(rgba(4,6,14,.62) calc(var(--cd, 0) * 1%), transparent 0); }
  .tbtn[data-a="ult"]::before { content: ""; position: absolute; inset: -5px; border-radius: 50%; pointer-events: none;
    background: conic-gradient(var(--ac) calc(var(--p, 0) * 1%), rgba(255,255,255,.10) 0);
    -webkit-mask: radial-gradient(circle, transparent 64%, #000 66%); mask: radial-gradient(circle, transparent 64%, #000 66%); }
  @keyframes ultReady { 0%, 100% { box-shadow: inset 0 0 0 2px #ffd34d, 0 0 14px rgba(255,211,77,.5); } 50% { box-shadow: inset 0 0 0 2px #ffd34d, 0 0 32px rgba(255,211,77,.9); } }
  .tbtn.ready { animation: ultReady 1.2s ease-in-out infinite; }
  .tbtn.dis { opacity: .75; } .tbtn.dis .ti svg { filter: none; opacity: .55; }
  .tbase { background: radial-gradient(circle, rgba(111,227,255,.06), rgba(10,16,36,.22) 70%); backdrop-filter: blur(4px);
    box-shadow: inset 0 0 0 1.5px rgba(111,227,255,.45), inset 0 0 26px rgba(138,125,255,.18), 0 0 20px rgba(111,227,255,.12); }
  .tknob { background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.75), rgba(111,227,255,.35) 55%, rgba(138,125,255,.30)); backdrop-filter: blur(6px);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.6), 0 0 18px rgba(111,227,255,.55); }
  .tlock { background: rgba(10,16,36,.45); backdrop-filter: blur(6px); box-shadow: inset 0 0 0 1.5px rgba(255,211,77,.6); }
  #tLockBadge { background: rgba(10,16,36,.45); color: #ffe08a; backdrop-filter: blur(8px); box-shadow: inset 0 0 0 1.5px rgba(255,211,77,.7), 0 0 18px rgba(255,176,42,.35); }
</style>`);
function updateTouchDials() {
  if (!TOUCH.mode) return;
  const u = document.querySelector('.tbtn[data-a="ult"]'); if (u) { u.style.setProperty('--p', Math.floor(ULT.v)); u.classList.toggle('ready', ULT.v >= 100); }
  if (!comp) return;
  const d = compStats();
  [['attack', 0], ['skill1', 1], ['skill2', 2]].forEach(([a, i]) => { const b = document.querySelector(`.tbtn[data-a="${a}"]`); if (b) b.style.setProperty('--cd', Math.max(0, Math.min(100, (comp.cds[i] / (d.skills[i].cd || 1)) * 100))); });
}

// ====================================================================== TALK BUBBLE above whoever (or whatever) you can talk to / use. Tap it (or press E).
document.querySelector('.tbtn[data-a="talk"]')?.remove();
document.head.insertAdjacentHTML('beforeend', `<style>
  #talkBub { position: fixed; z-index: 6; transform: translate(-50%, -100%); display: flex; align-items: center; gap: 8px; padding: 9px 16px 9px 12px; border-radius: 999px; cursor: pointer;
    color: #fff; font-weight: 800; font-size: 16px; white-space: nowrap; user-select: none; -webkit-user-select: none; touch-action: none;
    border: 2px solid transparent; background: linear-gradient(rgba(10,16,36,.62), rgba(10,16,36,.62)) padding-box, linear-gradient(120deg, #3ad0ff, #8a7dff, #ff5ad6) border-box;
    backdrop-filter: blur(8px); box-shadow: 0 8px 22px rgba(0,0,0,.4), 0 0 18px rgba(138,125,255,.35); animation: bubBob 1.6s ease-in-out infinite; }
  #talkBub::after { content: ""; position: absolute; left: 50%; bottom: -9px; transform: translateX(-50%) rotate(45deg); width: 12px; height: 12px; background: rgba(10,16,36,.75); border-right: 2px solid #8a7dff; border-bottom: 2px solid #8a7dff; }
  #talkBub .ic { font-size: 20px; filter: drop-shadow(0 0 6px rgba(255,255,255,.4)); } #talkBub .k { font-size: 11px; padding: 2px 7px; border-radius: 8px; background: rgba(255,255,255,.14); color: #cfe; }
  #talkBub.down { transform: translate(-50%, -100%) scale(.92); }
  @keyframes bubBob { 0%, 100% { margin-top: 0; } 50% { margin-top: -5px; } }
  body.touch #talkBub { font-size: 18px; padding: 12px 20px 12px 14px; } body.touch #talkBub .k { display: none; }
</style>`);
document.body.insertAdjacentHTML('beforeend', '<div id="talkBub" class="hidden"><span class="ic">💬</span><span class="tx">Talk</span><span class="k">E</span></div>');
const bub = $('talkBub');
const bubGo = (e) => { e.preventDefault(); e.stopPropagation(); bub.classList.add('down'); setTimeout(() => bub.classList.remove('down'), 120); audio(); press.add('talk'); };
bub.addEventListener('touchstart', bubGo, { passive: false }); bub.addEventListener('mousedown', bubGo);
// what can be used right now, and where to float the bubble (same order as interact())
function interactTarget() {
  const d = (x, z) => dist2(P.x, P.z, x, z), at = (x, z, y) => new THREE.Vector3(x, y ?? height(x, z), z);
  { const ch = nearChest(); if (ch) return { p: at(ch.x, ch.z, ch.y + 2.0), ic: '🎁', tx: CHEST_LOOK[ch.tier][2] + ' chest' }; }
  if (D.state === 'waiting' && d(D.x, D.z) < 3.2) return { p: at(D.x, D.z, uncle.position.y + 3.0), ic: '❤️', tx: 'Baba' };
  if (save.step === 'arrive' && d(...SPOTS.green) < 4.5) return { p: at(green.position.x, green.position.z, green.position.y + 2.4), ic: '💬', tx: 'Professor Green' };
  if (nira.visible && d(...NIRA_AT) < 3.5) return { p: at(nira.position.x, nira.position.z, nira.position.y + 2.3), ic: '💬', tx: 'Nira' };
  const v = VILLAGERS.find((vv) => d(vv.at[0], vv.at[1]) < 3.2); if (v) return { p: at(v.model.position.x, v.model.position.z, v.model.position.y + 2.3), ic: '💬', tx: 'Talk' };
  if (reached('explore') && d(...LIFT_LOW) < 2.5) return { p: at(LIFT_LOW[0], LIFT_LOW[1], height(...LIFT_LOW) + 2.2), ic: '🔷', tx: 'Lift up' };
  if (reached('explore') && d(...LIFT_HIGH) < 2.5) return { p: at(LIFT_HIGH[0], LIFT_HIGH[1], height(...LIFT_HIGH) + 2.2), ic: '🔷', tx: 'Lift down' };
  if (state === 'play' && (d(...CHAMBER) < 4.5 || d(...labLocal(0, 4.8)) < 3)) return { p: at(CHAMBER[0], CHAMBER[1], height(...CHAMBER) + 3.2), ic: '🧬', tx: 'Morph Lab' };
  if (d(...RACE_AT) < 3.5 && !RACE.on) return { p: at(raceNpc.position.x, raceNpc.position.z, raceNpc.position.y + 1.6), ic: '🏁', tx: 'Race' };
  if (d(...TROPHY_AT) < 4.5) return { p: at(TROPHY_AT[0], TROPHY_AT[1], height(...TROPHY_AT) + 4.6), ic: '🏆', tx: 'Trophies' };
  if (d(...SHOP_AT) < 4) return { p: at(shopkeeper.position.x, shopkeeper.position.z, shopkeeper.position.y + 2.4), ic: '🛒', tx: 'Shop' };
  if (d(...GARDEN_AT) < 7.5 && save.team.length) return { p: at(GARDEN_AT[0] - 6.8, GARDEN_AT[1] - 3.6, height(...GARDEN_AT) + 2.6), ic: '🌱', tx: 'Garden' };
  if (d(...SPOTS.green) < 4 && save.team.length) return { p: at(green.position.x, green.position.z, green.position.y + 2.4), ic: '💚', tx: 'Heal team' };
  if (d(SPOTS.camp[0], SPOTS.camp[1]) < 6) return { p: at(SPOTS.fire[0], SPOTS.fire[1], height(...SPOTS.fire) + 2.2), ic: '⛺', tx: 'Rest & care' };
  if (nearShore() && dist2(valeza.position.x, valeza.position.z, P.x, P.z) >= 3.5) { const a = Math.atan2(LAKE.x - P.x, LAKE.z - P.z); return { p: at(P.x + Math.sin(a) * 2, P.z + Math.cos(a) * 2, WATER + 1.8), ic: '🎣', tx: 'Fish' }; }
  if (dist2(valeza.position.x, valeza.position.z, P.x, P.z) < 3.5) return { p: at(valeza.position.x, valeza.position.z, valeza.position.y + 1.6), ic: '😊', tx: 'Valeza' };
  for (const p of [...pylons, ...seals]) if (p.alive && d(p.x, p.z) < 2.5) return { p: at(p.x, p.z, p.y + 3.6), ic: '⚡', tx: 'Hit it' };
  return null;
}
let bubKey = '';
function updateTalkBubble() {
  const busy = state !== 'play' || dlg.open || paused || TEDIT.on || MORPH.on || FISH.on || CINE.t > 0 || babaBusy() || evolving || !$('choose').classList.contains('hidden') || NAV_OVERLAYS.some((id) => !$(id).classList.contains('hidden'));
  const tgt = busy ? null : interactTarget();
  if (!tgt) { bub.classList.add('hidden'); bubKey = ''; return; }
  const s = tgt.p.clone().project(camera);
  if (s.z > 1) { bub.classList.add('hidden'); return; }
  bub.classList.remove('hidden');
  bub.style.left = ((s.x + 1) / 2 * innerWidth) + 'px'; bub.style.top = ((1 - s.y) / 2 * innerHeight) + 'px';
  const key = tgt.ic + tgt.tx; if (key !== bubKey) { bubKey = key; bub.querySelector('.ic').textContent = tgt.ic; bub.querySelector('.tx').textContent = tgt.tx; bub.querySelector('.k').textContent = pad.on ? '⬜' : 'E'; }
}


// ====================================================================== HUD LAYOUT (user's choice): map top-left under the title, companion card under the map, Pause button top-center
document.head.insertAdjacentHTML('beforeend', `<style>
  #mapWrap, body.touch #mapWrap { left: 14px; right: auto; top: 66px; bottom: auto; width: 200px; transform: none; }
  #comp, body.touch #comp { left: 14px; top: 278px; bottom: auto; transform-origin: top left; }
  body.touch #comp { transform: scale(.86); }
  #questsBox { position: fixed; right: 14px; top: 196px; width: 220px; z-index: 5; }
  #tip, body.touch #tip { left: 50%; top: 122px; transform: translateX(-50%); width: 360px; } #tip.pop { animation: none; }
  #pauseBtn { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 6; padding: 10px 22px; border-radius: 14px; font-weight: 900; letter-spacing: .5px; }
  .guide { top: 70px; }
</style>`);
{ const qb = document.createElement('div'); qb.id = 'questsBox'; document.body.appendChild(qb); qb.appendChild($('quests')); }
$('hud').insertAdjacentHTML('beforeend', '<button class="btn blue" id="pauseBtn">⏸ Pause</button>');
$('pauseBtn').onclick = () => { if (state === 'play') togglePause(true); };
document.querySelector('.tbtn[data-a="pause"]')?.remove();
// Dex, Look and Help live in the top bar (user's choice), so their round touch buttons are removed
['help', 'dex', 'avatar'].forEach((x) => document.querySelector(`.tbtn[data-a="${x}"]`)?.remove());
document.querySelector('.topbar').insertAdjacentHTML('beforeend', '<button class="btn" id="lookBtn">👕 Look</button>');
document.querySelector('.topbar').appendChild($('pauseBtn')); $('pauseBtn').style.cssText = 'position:static;transform:none;padding:10px 16px';
$('lookBtn').onclick = () => { if (state === 'play') openCreator(); };

// ====================================================================== SPLASH (logo) + TUTORIAL (skippable) + round map, no hint bar
document.head.insertAdjacentHTML('beforeend', `<style>
  .hint, body.touch .hint { display: none !important; }
  #minimap { border-radius: 50% !important; box-shadow: 0 8px 24px rgba(0,0,0,.45), 0 0 0 3px rgba(111,227,255,.45), 0 0 22px rgba(138,125,255,.3) !important; }
  #mapWrap { width: 200px; }
  .topbar .brand { display: none; } .topbar #brandLogo { height: 46px; margin: -6px 2px -6px 0; filter: drop-shadow(0 2px 6px rgba(0,0,0,.6)); }
  #splash { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
    background: radial-gradient(circle at 50% 42%, #1c2658, #070b1c 60%, #02030a); transition: opacity .7s; }
  #splash img { width: min(620px, 86vw); animation: logoIn 1.2s cubic-bezier(.2, 1.3, .4, 1) both, logoFloat 3s ease-in-out 1.2s infinite; }
  #splash .load { width: 220px; height: 6px; border-radius: 4px; background: rgba(255,255,255,.08); overflow: hidden; }
  #splash .load div { height: 100%; width: 0; background: linear-gradient(90deg, #3ad0ff, #8a7dff, #ff5ad6); animation: loadBar 2s ease-out forwards; }
  #splash .tap { color: #9fb3d8; font-weight: 700; letter-spacing: 2px; font-size: 13px; opacity: 0; animation: fadeUp .6s 1.4s forwards; }
  @keyframes logoIn { 0% { opacity: 0; transform: scale(.6) rotate(-6deg); filter: blur(10px); } 100% { opacity: 1; transform: none; filter: none; } }
  @keyframes logoFloat { 50% { transform: translateY(-8px); } }
  @keyframes loadBar { to { width: 100%; } } @keyframes fadeUp { to { opacity: 1; } }
  #tut .panel { width: min(760px, 94vw); text-align: center; }
  #tut .art { font-size: 72px; line-height: 1.1; margin: 4px 0 8px; filter: drop-shadow(0 6px 18px rgba(138,125,255,.45)); }
  #tut .tt { font-size: 26px; font-weight: 900; background: linear-gradient(120deg, #3ad0ff, #8a7dff, #ff5ad6); -webkit-background-clip: text; background-clip: text; color: transparent; }
  #tut .tx { font-size: 17px; line-height: 1.55; color: #e6efff; margin: 10px auto 6px; max-width: 600px; } #tut .tx b { color: #ffd34d; }
  #tut .keys { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 10px 0 4px; }
  #tut .key { padding: 7px 12px; border-radius: 12px; font-weight: 800; font-size: 14px; background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1.5px rgba(111,227,255,.35); }
  #tut .key i { font-style: normal; color: #6fe3ff; margin-right: 6px; }
  #tut .dots { display: flex; gap: 6px; justify-content: center; margin: 14px 0 6px; } #tut .dots span { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.18); } #tut .dots span.on { background: #8a7dff; box-shadow: 0 0 10px #8a7dff; width: 26px; border-radius: 6px; }
  #tut .row { justify-content: space-between; } #tut .slide { animation: zoomIn .3s ease; }
</style>`);
{ const lg = document.createElement('img'); lg.id = 'brandLogo'; lg.src = 'logo.svg'; lg.alt = 'Monstermon Wildfold'; document.querySelector('.topbar').insertBefore(lg, document.querySelector('.topbar').children[1]); }
document.querySelector('.topbar .btn[title="Home"]')?.remove();
for (let i = PROWS.length - 1; i >= 0; i--) if (PROWS[i].label.includes('Back to dreamPlay')) PROWS.splice(i, 1);
document.body.insertAdjacentHTML('beforeend', `<div id="splash"><img src="logo.svg" alt="Monstermon Wildfold"><div class="load"><div></div></div><div class="tap">A DREAMPLAY ADVENTURE</div></div>
<div id="tut" class="overlay hidden"><div class="panel"><div class="slide" id="tutSlide"></div><div class="dots" id="tutDots"></div>
<div class="row"><button class="btn" id="tutSkip">Skip tutorial ⏭</button><div style="display:flex;gap:10px"><button class="btn" id="tutBack">◀ Back</button><button class="btn blue" id="tutNext">Next ▶</button></div></div></div></div>`);
if (qs.has('t') || qs.has('nosplash')) $('splash').remove();
else setTimeout(() => { const s = $('splash'); if (s) { s.style.opacity = 0; setTimeout(() => s.remove(), 750); } }, 2300);
NAV_OVERLAYS.push('tut'); EXTRA_BACK.tut = () => endTutorial();
const TK = (ic, t) => `<span class="key"><i>${ic}</i>${t}</span>`;
function tutSlides() {
  const T = TOUCH.mode, P2 = pad.on && !T;
  return [
    { art: '👋🌲', tt: 'Welcome to Wildfold!', tx: `In the forest of <b>Virelia</b>, old objects full of memories wake up as <b>Monstermon</b>. Some are angry, some are sad… and someone is <b>folding the forest</b> with strange cubes. You will catch Monstermon, make them stronger and find out who is behind it!` },
    { art: T ? '👆🕹️' : P2 ? '🎮' : '⌨️', tt: 'Moving around', tx: T ? `Put your <b>left thumb</b> anywhere on the left side: a joystick appears. Push it all the way to <b>run</b>. Push it <b>far up</b> and let go on <b>🔒 RUN</b> to keep running by yourself.` : P2 ? 'Move with the <b>left stick</b>, turn the camera with the <b>right stick</b>.' : 'Move with <b>W A S D</b>, turn the camera by dragging the mouse, zoom with the wheel.',
      keys: T ? [TK('🕹️', 'Left thumb: move'), TK('🔒', 'Push far up: run lock'), TK('👆', 'Swipe right side: camera'), TK('🤏', 'Pinch: zoom'), TK('⬆️', 'Jump'), TK('🔄', 'Roll')] : P2 ? [TK('L', 'Move'), TK('R', 'Camera'), TK('R2', 'Run'), TK('✕', 'Jump'), TK('○', 'Roll')] : [TK('WASD', 'Move'), TK('Shift', 'Run'), TK('Space', 'Jump'), TK('Q', 'Roll'), TK('🖱️', 'Camera')] },
    { art: '⚔️✨⚡', tt: 'Fighting together', tx: `Your Monstermon fights next to you. You give the orders: <b>Attack</b>, two <b>Skills</b> and the <b>Ultimate</b>, which charges up while you fight. A <b>red circle</b> on the ground means an attack is coming: get out or <b>roll</b>!`,
      keys: T ? [TK('⚔️', 'Attack'), TK('★', 'Skill 1 / 2'), TK('⚡', 'Ultimate'), TK('🔄', 'Roll')] : P2 ? [TK('R1', 'Attack'), TK('L1/L2', 'Skills'), TK('L1+R1', 'Ultimate'), TK('○', 'Roll')] : [TK('J', 'Attack'), TK('1 2', 'Skills'), TK('3', 'Ultimate'), TK('Q', 'Roll')] },
    { art: '🔥💧🌿', tt: 'Elements', tx: `Every Monstermon has an element: 🔥 Fire, 💧 Water, 🌿 Plant, ⚙️ Metal, 🌪️ Wind, 🪨 Stone, ✨ Light. The right element does <b>"Super effective! ×2"</b>. The top box tells you when to switch to a better Monstermon with <b>Team</b>.` },
    { art: '🧊✦', tt: 'Catching', tx: `<b>Defeat</b> a wild Monstermon and your <b>FoldCube</b> flies by itself to catch it. Sad ones 😢 can be caught without fighting: <b>walk slowly</b> near them until the ✦ bar is full, then throw the cube and press again when the rings meet.` },
    { art: '💬🗺️', tt: 'Talking, map and quests', tx: `When you can talk to someone or use something, a <b>💬 bubble</b> appears above it: just <b>tap it</b>${T ? '' : ' (or press E)'}. The <b>round map</b> (top-left) shows ⭐ where to go next. Your quests are on the right.` },
    { art: '👥🧬🛒', tt: 'Your team', tx: `Up to <b>7</b> Monstermon travel with you, the rest live in Professor Green's <b>garden</b>. Level them up to <b>evolve</b>, fuse two of them in the <b>🧬 Morph Lab</b>, buy potions and clothes at the <b>🛒 shop</b>, and rest at the <b>⛺ camp</b>.` },
    { art: '❤️💪', tt: 'Baba is always there', tx: `If your health gets very low, <b>BABA</b> comes running, gives you a big hug and does a <b>SLAM</b> that knocks the evil monsters down to 1%. Weather and day/night change all the time, so watch out for <b>night monsters</b>!` },
    { art: '❓⏸', tt: "You're ready!", tx: `Press <b>❓ Help</b> any time for every detail, and <b>⏸ Pause</b> for settings${T ? ' and <b>✏️ Edit touch controls</b> (move and resize every button)' : ''}. Have fun, adventurer!` },
  ];
}
let tutI = 0, tutDone = null;
function openTutorial(done) {
  tutI = 0; tutDone = done || null; openOverlay('tut'); renderTut();
}
function renderTut() {
  const S = tutSlides(), s = S[tutI];
  $('tutSlide').innerHTML = `<div class="art">${s.art}</div><div class="tt">${s.tt}</div><div class="tx">${s.tx}</div>${s.keys ? `<div class="keys">${s.keys.join('')}</div>` : ''}`;
  $('tutSlide').classList.remove('slide'); void $('tutSlide').offsetWidth; $('tutSlide').classList.add('slide');
  $('tutDots').innerHTML = S.map((_, i) => `<span class="${i === tutI ? 'on' : ''}"></span>`).join('');
  $('tutBack').style.visibility = tutI ? 'visible' : 'hidden';
  $('tutNext').textContent = tutI === S.length - 1 ? "Let's play! ▶" : 'Next ▶';
  SFX.tick();
}
function endTutorial() { closeOverlay('tut'); save.tips.tutorial = 1; persist(); const d = tutDone; tutDone = null; if (d) d(); }
$('tutNext').onclick = () => { if (tutI < tutSlides().length - 1) { tutI++; renderTut(); } else endTutorial(); };
$('tutBack').onclick = () => { if (tutI > 0) { tutI--; renderTut(); } };
$('tutSkip').onclick = () => endTutorial();


// ====================================================================== PROFESSOR GREEN is always easy to find: a green light from the sky + a big green marker on the map
const greenBeam = new THREE.Group(); scene.add(greenBeam);
{
  const gy = height(...SPOTS.green);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x3ddc84, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 60, 20, 1, true), beamMat); core.position.y = 30; greenBeam.add(core);
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.9, 60, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x8affc0, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.y = 30; greenBeam.add(halo);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x3ddc84, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
  greenBeam.userData.rings = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.75, 40), ringMat.clone()); r.rotation.x = -Math.PI / 2; r.position.y = 0.08; greenBeam.add(r); return r; });
  const light = new THREE.PointLight(0x3ddc84, 6, 12, 1.6); light.position.y = 3; greenBeam.add(light);
  greenBeam.position.set(SPOTS.green[0], gy, SPOTS.green[1]);
  greenBeam.userData.core = core; greenBeam.userData.halo = halo;
}
// a floating name tag above him, visible from far away
document.body.insertAdjacentHTML('beforeend', `<div id="greenTag" style="position:fixed;z-index:4;transform:translate(-50%,-100%);pointer-events:none;padding:5px 12px;border-radius:999px;font-weight:900;font-size:14px;color:#eafff2;white-space:nowrap;background:rgba(10,40,26,.7);backdrop-filter:blur(6px);box-shadow:0 0 0 2px #3ddc84,0 0 18px rgba(61,220,132,.6)">👨‍🔬 Professor Green <span id="greenDist" style="opacity:.75;font-weight:700"></span></div>`);
function updateGreenBeacon(t) {
  const d = dist2(P.x, P.z, SPOTS.green[0], SPOTS.green[1]);
  greenBeam.userData.core.material.opacity = 0.22 + Math.sin(t * 2.4) * 0.1;
  greenBeam.userData.halo.material.opacity = 0.07 + Math.sin(t * 2.4 + 1) * 0.04;
  greenBeam.userData.rings.forEach((r, i) => { const k = ((t * 0.6 + i * 0.5) % 1); r.scale.setScalar(0.6 + k * 1.8); r.material.opacity = 0.8 * (1 - k); });
  greenBeam.visible = d > 3;   // hide the light when you are standing right next to him
  const tag = $('greenTag'), p = new THREE.Vector3(SPOTS.green[0], green.position.y + 2.9, SPOTS.green[1]).project(camera);
  if (state !== 'play' || p.z > 1 || d < 4 || Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05) { tag.style.display = 'none'; return; }
  tag.style.display = ''; tag.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; tag.style.top = ((1 - p.y) / 2 * innerHeight) + 'px';
  $('greenDist').textContent = Math.round(d) + ' m';
}

// ====================================================================== EXPLORATION: zones + levels (like WoW), Skyfang the dragon, chests with Grade 3 math, Elevation Cards
// ---- zone banner when you enter a new land
document.head.insertAdjacentHTML('beforeend', `<style>
  #zoneBan { position: fixed; left: 50%; top: 23%; transform: translate(-50%, -50%); z-index: 9; text-align: center; pointer-events: none; opacity: 0; transition: opacity .8s; }
  #zoneBan .zn { font-size: 46px; font-weight: 900; letter-spacing: 4px; color: #fff; text-shadow: 0 3px 16px #000, 0 0 30px var(--zc); }
  #zoneBan .zs { font-size: 15px; font-weight: 800; letter-spacing: 5px; text-transform: uppercase; color: var(--zc); text-shadow: 0 2px 8px #000; }
  #zoneBan .zl { display: inline-block; margin-top: 8px; padding: 4px 14px; border-radius: 999px; font-weight: 900; color: #fff; background: rgba(8,12,28,.6); box-shadow: inset 0 0 0 1.5px var(--zc); }
  #chestUI .panel { width: min(640px, 94vw); text-align: center; }
  #chestUI .q { font-size: 26px; font-weight: 900; margin: 14px 0 6px; color: #fff; } #chestUI .ctx { color: #cfe; font-size: 17px; line-height: 1.5; }
  #chestUI .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; } #chestUI .opts .btn { font-size: 22px; padding: 16px; }
  #chestUI .ok { background: linear-gradient(120deg, #22c56a, #1e90ff) !important; } #chestUI .no { background: linear-gradient(120deg, #e53950, #8a1430) !important; }
  #chestUI .loot { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 12px; }
  #chestUI .li { padding: 14px 10px; border-radius: 16px; background: linear-gradient(180deg, rgba(40,30,80,.9), rgba(14,18,40,.9)); box-shadow: inset 0 0 0 1.5px #ffd34d, 0 0 18px rgba(255,211,77,.3); animation: zoomIn .4s ease both; }
  #chestUI .li .big { font-size: 44px; } #chestUI .li b { display: block; margin-top: 4px; } #chestUI .li small { color: #9fb3d8; }
  #chestUI .prog { display: flex; gap: 6px; justify-content: center; margin-top: 6px; } #chestUI .prog span { width: 30px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.15); } #chestUI .prog span.on { background: #3ddc84; }
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="zoneBan"><div class="zs" id="zbSub"></div><div class="zn" id="zbName"></div><div class="zl" id="zbLv"></div></div>
<div id="chestUI" class="overlay hidden"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h2 id="chTitle">🎁 Treasure chest</h2><button class="btn" id="chClose">✖ Close</button></div><div id="chBody"></div></div></div>`);
NAV_OVERLAYS.push('chestUI'); EXTRA_BACK.chestUI = () => closeOverlay('chestUI'); $('chClose').onclick = EXTRA_BACK.chestUI;
let curZone = null, zbT = 0;
function updateZones(dt) {
  if (state !== 'play') return;
  const z = zoneOf(P.x, P.z);
  if (z !== curZone) {
    const first = curZone === null; curZone = z; if (first) return;
    const Z = ZONES[z], ban = $('zoneBan'); ban.style.setProperty('--zc', Z.color);
    $('zbName').textContent = Z.name.toUpperCase(); $('zbSub').textContent = Z.sub; $('zbLv').textContent = `Level ${Z.lv[0]}–${Z.lv[1]}`;
    ban.style.opacity = 1; zbT = 4; SFX.chime(520);
    save.zones = save.zones || {}; if (!save.zones[z]) { save.zones[z] = 1; save.coins += 20; toast(`🗺️ New land discovered: <b>${Z.name}</b>! +20 🪙`); }
    if (z !== 'core') tip('zones', `🗺️ The world is big! The <b>farther</b> you go from Rootlight, the <b>stronger</b> the monsters get. Look at the <b>Lv</b> next to their names: <span style="color:#3ddc84">green</span> = easy, <span style="color:#ffd34d">yellow</span> = fair, <span style="color:#ff5a6a">red</span> = dangerous!`, '🗺️ Lands and levels');
  }
  if (zbT > 0) { zbT -= dt; if (zbT <= 0) $('zoneBan').style.opacity = 0; }
}
// ---- enemy levels by distance
function applyLevel(e) {
  if (e.kind !== 'mon' || e.boss || e.lvl) return;
  const L = zoneLevel(e.x, e.z); e.lvl = L;
  const k = Math.max(0, L - 6); e.max = e.hp = e.max * (1 + 0.11 * k); e.atk *= 1 + 0.07 * k; e.xp = Math.round((e.xp || 40) * (1 + 0.15 * k));
}
function lvColor(L) { const c = comp ? (comp.m.lv || 1) : 1, d = L - c; return d >= 5 ? '#ff5a6a' : d >= 2 ? '#ff9a3a' : d >= -2 ? '#ffd34d' : d >= -8 ? '#3ddc84' : '#9aa4b8'; }
const ZONE_ELEM = { wastes: ['fire', 'stone'], swamp: ['plant', 'water'], frost: ['water', 'light', 'wind'], peaks: ['wind', 'metal', 'light', 'stone'] };
const ZONE_TIER = { wastes: [1, 3], swamp: [2, 4], frost: [2, 4], peaks: [3, 5] };
function pickZoneSpecies(z) {
  const [t0, t1] = ZONE_TIER[z], pool = GEN_IDS.filter((id) => { const d = SPECIES[id]; return ZONE_ELEM[z].includes(d.elem) && d.tier >= t0 && d.tier <= t1 && condOk(d.cond); });
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

// ---- SKYFANG the dragon (call it any time once you have a companion)
function makeDragon() {
  const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
  const sc = '#3a2a6a', sc2 = '#6a3ab0', belly = '#ffcf6a', glow = '#ffb020';
  bx(root, 1.6, 1.3, 3.2, sc, 0, 1.4, 0); bx(root, 1.2, 0.5, 2.6, belly, 0, 0.85, 0.1);
  for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), mat('#ff5ad6', { e: '#ff5ad6', ei: 0.8 })); s.position.set(0, 2.2, -1.2 + k * 0.45); root.add(s); }
  const neck = new THREE.Group(); neck.position.set(0, 1.8, 1.5); root.add(neck); bx(neck, 0.8, 1.6, 0.8, sc, 0, 0.6, 0.3).rotation.x = 0.5;
  const head = new THREE.Group(); head.position.set(0, 1.4, 0.9); neck.add(head);
  bx(head, 1.0, 0.8, 1.4, sc2, 0, 0, 0.3); bx(head, 0.8, 0.3, 0.9, sc, 0, -0.35, 0.65);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.9, 5), mat('#efe6cf')); h.position.set(s * 0.35, 0.65, -0.1); h.rotation.x = -0.6; head.add(h); bx(head, 0.22, 0.14, 0.05, mat(glow, { e: glow, ei: 3 }), s * 0.28, 0.12, 1.0); }
  for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), mat('#ffffff')); t.position.set(-0.24 + k * 0.16, -0.55, 1.05); t.rotation.x = Math.PI; head.add(t); }
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.8, 1.9, 0.2); root.add(w); for (let k = 0; k < 4; k++) { const p = bx(w, 1.4, 0.08, 1.8 - k * 0.3, k % 2 ? sc2 : '#2a1a4a', s * (0.7 + k * 1.25), k * 0.12, -k * 0.25); p.rotation.z = s * 0.12; } bx(w, 5, 0.18, 0.18, sc, s * 2.5, 0.25, 0.8); wings.push(w); }
  const tail = new THREE.Group(); tail.position.set(0, 1.3, -1.6); root.add(tail);
  for (let k = 0; k < 6; k++) bx(tail, 0.7 - k * 0.1, 0.6 - k * 0.08, 0.8, k % 2 ? sc2 : sc, 0, -k * 0.05, -k * 0.7);
  const tip2 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 4), mat('#ff5ad6', { e: '#ff5ad6', ei: 1 })); tip2.position.set(0, -0.3, -4.4); tip2.rotation.x = -Math.PI / 2; tail.add(tip2);
  const legs = []; for (const [x, z] of [[-0.6, 0.9], [0.6, 0.9], [-0.6, -0.9], [0.6, -0.9]]) { const l = bx(root, 0.45, 1.0, 0.45, sc, x, 0.5, z); legs.push(l); }
  bx(root, 1.0, 0.25, 0.9, '#8a5a2b', 0, 2.1, 0.3);   // saddle
  g.userData.anim = (t, flying) => {
    wings.forEach((w, i) => w.rotation.z = (flying ? Math.sin(t * 6) * 0.55 : 0.9) * (i ? -1 : 1));
    tail.rotation.y = Math.sin(t * 2) * 0.25; head.rotation.x = Math.sin(t * 1.5) * 0.08;
    legs.forEach((l) => l.visible = !flying || P.flyH < 2);
    root.rotation.x = flying ? -0.08 : 0;
  };
  g.scale.setScalar(1.1); g.visible = false; scene.add(g); return g;
}
const skyfang = makeDragon();
function toggleDragon() {
  if (RIDE.on) return dismount(RIDE.dragon ? 'You landed and hopped off Skyfang.' : 'You hopped off.');
  if (!save.team.length) return toast('🐉 Choose your first Monstermon at Professor Green’s lab first!');
  RIDE.on = true; RIDE.dragon = true; RIDE.kind = 'fly'; RIDE.r = { kind: 'fly', seat: 2.35, speed: 22, label: 'fly' }; P.flyH = 2.5;
  skyfang.visible = true; stat('rides'); roar(0.6, true); SFX.whoosh(); spark(P.x, P.y + 1, P.z, '#b48cff', 24);
  toast(`🐉 <b>Skyfang</b> lands next to you! Fly with ${TOUCH.mode ? 'the stick, ⬆️ to go up and 🔄 to go down' : '<b>WASD</b>, <b>Space</b> up, <b>Q</b> down'}. Press 🐉 again to land.`, 5500);
}
const _dismount = dismount;
dismount = function (msg) { if (RIDE.dragon) { RIDE.dragon = false; skyfang.visible = false; if (comp) comp.model.visible = true; } _dismount(msg); };
function updateDragon(t) {
  if (!RIDE.dragon) return;
  skyfang.position.set(P.x, P.y - 0.15, P.z); skyfang.rotation.y = P.yaw; skyfang.userData.anim(t, P.flyH > 1.5);
  if (comp) comp.model.visible = dist2(comp.x, comp.z, P.x, P.z) < 30;
}
// a dragon button for touch screens and the G key
TBTNS.push(['dragon', '🐉', 'DRAGON', 58, 300, 200, '']);
TI.dragon = ['#b48cff', 'M3 17c3-1 5-4 6-8 2 2 4 2 6 0 1 4 3 7 6 8M9 9l-2-5 4 3M15 9l2-5-4 3M12 13v4'];
$('tBtns').insertAdjacentHTML('beforeend', `<div class="tbtn" data-a="dragon" style="--ac:#b48cff"><span class="cdm"></span><span class="ti"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${TI.dragon[1]}"/></svg></span><small>Dragon</small></div>`);
{ const b = document.querySelector('.tbtn[data-a="dragon"]'); b.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (TEDIT.on) return; b.classList.add('down'); press.add('dragon'); }, { passive: false }); b.addEventListener('touchend', (e) => { e.preventDefault(); b.classList.remove('down'); }, { passive: false }); }
applyLayout();

// ---- CHESTS: solve Grade 3 math (IB PYP style) to open them
const CHEST_TIER = { core: 0, wastes: 1, frost: 1, swamp: 2, peaks: 3 };
const CHEST_LOOK = [['#8a5a2b', '#c9a060', 'Wooden'], ['#9aa4b8', '#e8eef6', 'Silver'], ['#d9a020', '#ffe08a', 'Golden'], ['#8a5aff', '#e0d0ff', 'Crystal']];
const CHEST_RESPAWN = 20 * 60 * 1000;
const chests = WORLD.chests.map((c) => {
  const [c1, c2] = CHEST_LOOK[CHEST_TIER[c.zone]], g = new THREE.Group(); g.position.set(c.x, c.y, c.z); g.rotation.y = Math.random() * 6;
  bx(g, 1.3, 0.75, 0.9, c1, 0, 0.38, 0); for (const x of [-0.5, 0.5]) bx(g, 0.1, 0.78, 0.94, c2, x, 0.39, 0);
  const lid = new THREE.Group(); lid.position.set(0, 0.75, -0.45); g.add(lid); bx(lid, 1.32, 0.35, 0.92, c1, 0, 0.17, 0.45); bx(lid, 0.22, 0.24, 0.06, mat('#ffd34d', { e: '#ffb020', ei: 1 }), 0, 0.05, 0.93);
  const glow = new THREE.PointLight(CHEST_TIER[c.zone] === 3 ? 0xb48cff : 0xffd34d, 3, 6); glow.position.y = 1.4; g.add(glow);
  scene.add(g); return { ...c, g, lid, glow, tier: CHEST_TIER[c.zone], open: 0 };
});
const chestReady = (c) => !(save.chests && save.chests[c.id] && Date.now() - save.chests[c.id] < CHEST_RESPAWN);
function updateChests(dt, t) {
  for (const c of chests) {
    const ready = chestReady(c), want = ready ? 0 : 1; c.open += (want - c.open) * Math.min(1, dt * 4);
    c.lid.rotation.x = -c.open * 1.9; c.glow.intensity = ready ? 2.2 + Math.sin(t * 3 + c.x) * 1 : 0;
  }
}
function nearChest() { return chests.find((c) => chestReady(c) && dist2(P.x, P.z, c.x, c.z) < 2.6); }
// ---- Grade 3 math (IB PYP): number, operations, place value, fractions, time, money, measurement, word problems
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const NAMES = ['Nira', 'Professor Green', 'Baba', 'Skipclip', 'Valeza'];
function mathQ() {
  const kind = ri(0, 11); let q, a, ctx = '';
  switch (kind) {
    case 0: { const x = ri(120, 499), y = ri(110, 480); q = `${x} + ${y} = ?`; a = x + y; break; }
    case 1: { const x = ri(300, 900), y = ri(100, x - 50); q = `${x} − ${y} = ?`; a = x - y; break; }
    case 2: { const x = ri(2, 10), y = ri(2, 10); q = `${x} × ${y} = ?`; a = x * y; break; }
    case 3: { const y = ri(2, 10), a2 = ri(2, 10); q = `${y * a2} ÷ ${y} = ?`; a = a2; break; }
    case 4: { const n = ri(100, 999), place = ri(0, 2), names = ['ones', 'tens', 'hundreds']; ctx = `In the number <b>${n}</b>…`; q = `What digit is in the ${names[place]} place?`; a = Math.floor(n / Math.pow(10, place)) % 10; break; }
    case 5: { const n = ri(1, 9) * 100 + ri(0, 9) * 10 + ri(1, 9); q = `Round ${n} to the nearest 10`; a = Math.round(n / 10) * 10; break; }
    case 6: { const d = [2, 3, 4, 5, 6, 8][ri(0, 5)], m = ri(2, 6), tot = d * m; ctx = `${NAMES[ri(0, 4)]} has <b>${tot}</b> berries and gives away <b>1/${d}</b> of them.`; q = `How many berries is 1/${d} of ${tot}?`; a = m; break; }
    case 7: { const h = ri(1, 11), m = [0, 15, 30, 45][ri(0, 3)], add = [15, 30, 45, 60][ri(0, 3)]; const tot = h * 60 + m + add; ctx = `The clock shows <b>${h}:${String(m).padStart(2, '0')}</b>. A quest takes <b>${add} minutes</b>.`; q = 'What time will it end? (minutes past the hour)'; a = tot % 60; break; }
    case 8: { const p = ri(12, 45), c = ri(2, 4); ctx = `A healing potion costs <b>${p} coins</b>.`; q = `How much do ${c} potions cost?`; a = p * c; break; }
    case 9: { const l = ri(3, 12), w = ri(2, 9); ctx = `Professor Green's garden is a rectangle <b>${l} m</b> long and <b>${w} m</b> wide.`; q = 'What is its perimeter in metres?'; a = 2 * (l + w); break; }
    case 10: { const n = ri(3, 9), per = ri(3, 8); ctx = `There are <b>${n}</b> nests and each nest has <b>${per}</b> monster eggs.`; q = 'How many eggs are there in total?'; a = n * per; break; }
    default: { const s0 = ri(5, 40), step = ri(3, 12); ctx = `Find the pattern: <b>${s0}, ${s0 + step}, ${s0 + 2 * step}, ${s0 + 3 * step}, …</b>`; q = 'What number comes next?'; a = s0 + 4 * step; }
  }
  const opts = new Set([a]); const spread = Math.max(3, Math.round(Math.abs(a) * 0.15));
  while (opts.size < 4) { const o = a + ri(-spread, spread) || a + 1; if (o >= 0 && o !== a) opts.add(o); }
  return { q, a, ctx, opts: [...opts].sort(() => Math.random() - 0.5) };
}
let CH = null;
function openChest(c) {
  CH = { c, need: c.tier + 1, done: 0, tries: 0 }; openOverlay('chestUI');
  $('chTitle').textContent = `🎁 ${CHEST_LOOK[c.tier][2]} chest`;
  tip('chestmath', `🧮 Chests are locked with <b>math puzzles</b>! Solve them to open the chest. Wooden chests need 1 answer, Crystal chests need 4. Wrong answers just give you a new puzzle.`, '🎁 Chests');
  askMath();
}
function askMath() {
  const m = mathQ(); CH.m = m;
  $('chBody').innerHTML = `<div class="prog">${Array.from({ length: CH.need }, (_, i) => `<span class="${i < CH.done ? 'on' : ''}"></span>`).join('')}</div><div style="color:#9fb3d8;margin-top:6px">Solve ${CH.need} puzzle${CH.need > 1 ? 's' : ''} to open it (${CH.done}/${CH.need})</div>${m.ctx ? `<div class="ctx" style="margin-top:10px">${m.ctx}</div>` : ''}<div class="q">${m.q}</div><div class="opts">${m.opts.map((o) => `<button class="btn" data-ans="${o}">${o}</button>`).join('')}</div>`;
  $('chBody').querySelectorAll('[data-ans]').forEach((b) => b.onclick = () => answerMath(+b.dataset.ans, b));
  if (pad.on) setTimeout(() => navMove(0, 1), 50);
}
function answerMath(v, b) {
  if (CH.locked) return; CH.locked = true;
  if (v === CH.m.a) { b.classList.add('ok'); SFX.chime(880 + CH.done * 120); CH.done++; stat('mathRight'); setTimeout(() => { CH.locked = false; CH.done >= CH.need ? giveLoot() : askMath(); }, 600); }
  else { b.classList.add('no'); $('chBody').querySelector(`[data-ans="${CH.m.a}"]`).classList.add('ok'); SFX.fail(); setTimeout(() => { CH.locked = false; askMath(); }, 1400); }
}
// loot: clothes, accessories, a gift Monstermon, Elevation Cards, coins
const COSMETICS = ['hat:pirate', 'hat:wizard', 'hat:crown', 'hat:hood', 'glasses:sun', 'scarf:scarf', 'back:cape', 'back:wings', 'back:jetpack', 'back:halo'];
const COS_INFO = { 'hat:pirate': ['🏴‍☠️', 'Pirate hat'], 'hat:wizard': ['🧙', 'Wizard hat'], 'hat:crown': ['👑', 'Golden crown'], 'hat:hood': ['🧥', 'Rain hood'], 'glasses:sun': ['😎', 'Sunglasses'], 'scarf:scarf': ['🧣', 'Scarf'], 'back:cape': ['🦸', 'Hero cape'], 'back:wings': ['🦇', 'Dragon wings'], 'back:jetpack': ['🚀', 'Jetpack'], 'back:halo': ['😇', 'Golden halo'] };
function giveLoot() {
  const c = CH.c, T = c.tier, items = [];
  save.chests = save.chests || {}; save.chests[c.id] = Date.now();
  const coins = 20 + T * 30 + ri(0, 20); save.coins += coins; items.push(['🪙', `${coins} coins`, '']);
  const cards = T >= 2 ? 2 : 1; save.items.elevate = (save.items.elevate || 0) + cards; items.push(['⬆️', `${cards} Elevation Card${cards > 1 ? 's' : ''}`, 'Use in Team: +1 level']);
  const locked = COSMETICS.filter((x) => !save.unlocked.includes(x));
  if (locked.length && Math.random() < 0.55 + T * 0.12) { const it = locked[ri(0, locked.length - 1)]; save.unlocked.push(it); items.push([COS_INFO[it][0], COS_INFO[it][1], 'New look! Try it in 👕 Look']); }
  if (Math.random() < 0.3 + T * 0.15) {
    const zone = c.zone === 'core' ? 'wastes' : c.zone, sp = pickZoneSpecies(zone) || GEN_IDS[ri(0, GEN_IDS.length - 1)], mem = newMember(sp);
    mem.xp = Math.max(0, (zoneLevel(c.x, c.z) - 1) * LV_XP * 0.5); mem.lv = levelOf(mem); mem.maxHp = memberMax(mem); mem.hp = mem.maxHp;
    if (save.team.length < 7) save.team.push(mem); else { save.garden.push(mem); rebuildGarden(); }
    markCaught(sp); items.push([eIcon(sp) || '🐾', `${SPECIES[sp].name} (Lv ${mem.lv})`, 'A Monstermon gift!']);
  }
  if (T >= 1 && Math.random() < 0.5) { save.items.potion += 1; items.push(['🧪', 'Healing Potion', '']); }
  stat('chests'); SFX.win(); rumble(0.6, 400); lightPillar(c.x, c.y, c.z, '#ffd34d', 10); spark(c.x, c.y + 1, c.z, '#ffd34d', 30);
  $('chBody').innerHTML = `<div style="font-size:20px;font-weight:900;margin-top:6px">🎉 The chest is open!</div><div class="loot">${items.map(([i, n, s]) => `<div class="li"><div class="big">${i}</div><b>${n}</b><small>${s}</small></div>`).join('')}</div><div class="row" style="justify-content:center"><button class="btn blue big" id="chDone">Awesome! ▶</button></div>`;
  $('chDone').onclick = EXTRA_BACK.chestUI; persist(); renderStats(); renderComp();
}
// Elevation Cards: +1 level on any Monstermon in your team
function useElevate(i) {
  const m = save.team[i]; if (!m) return;
  if ((save.items.elevate || 0) <= 0) return toast('⬆️ You have no Elevation Cards. Find them in chests!');
  save.items.elevate--; const before = m.lv || 1; m.xp = (before) * LV_XP; m.lv = levelOf(m); m.maxHp = memberMax(m); m.hp = m.maxHp;
  SFX.level(); toast(`⬆️ <b>${SPECIES[m.sp].name}</b> is now <b>level ${m.lv}</b>!`);
  if (i === save.active) { if (comp) spark(comp.x, comp.y + 1, comp.z, '#b48cff', 20); checkEvolution(); }
  persist(); openTeam();
}
MEDALS.push(['treasure', '🎁', 'Treasure Hunter', 'Open 5 chests', () => (save.stats.chests || 0) >= 5], ['mathwiz', '🧮', 'Math Wizard', 'Solve 25 chest puzzles', () => (save.stats.mathRight || 0) >= 25], ['explorer', '🗺️', 'World Explorer', 'Discover all 5 lands', () => Object.keys(save.zones || {}).length >= 5]);

$('helpBtn').onclick = () => openHelp(); $('helpClose').onclick = closeHelp;
$('dexBtn').onclick = () => openDex(); $('dexClose').onclick = closeDex; $('dex3d').onclick = () => window.open('/monsters.html', '_blank');
$('shopClose').onclick = closeShop; $('gardenClose').onclick = closeGarden;

// ====================================================================== creator
const GROUPS = [
  ['Skin', 'skin', null, OPTIONS.skin], ['Hair', 'hairStyle', OPTIONS.hairStyle, null, 'hairColor', OPTIONS.hairColor],
  ['Hat', 'hat', OPTIONS.hat, null, 'hatColor', OPTIONS.colors], ['Top / Jacket', 'top', OPTIONS.top, null, 'topColor', OPTIONS.colors, 'top2'],
  ['Pants', 'pants', OPTIONS.pants, null, 'pantsColor', ['#2f4f8f', '#3a3a3a', '#6b8e4e', '#c9a060', '#1e90ff', '#111827', '#e53950', '#f5f5f5']],
  ['Sneakers', 'shoes', OPTIONS.shoes, null, 'shoeColor', OPTIONS.colors], ['Bag', 'bag', OPTIONS.bag, null, 'bagColor', OPTIONS.colors],
  ['Glasses', 'glasses', OPTIONS.glasses], ['Scarf', 'scarf', OPTIONS.scarf, null, 'scarfColor', OPTIONS.colors], ['Back accessory', 'back', OPTIONS.back, null, 'backColor', OPTIONS.colors],
];
function renderCreator() {
  $('groups').innerHTML = `<div class="group"><div class="group-title">Difficulty</div><div class="chips">${[['easy', '🙂 Easy (recommended)'], ['normal', '😤 Normal']].map(([v, l]) => `<button class="chip ${save.settings.diff === v ? 'on' : ''}" data-diff="${v}">${l}</button>`).join('')}</div></div>` + GROUPS.map(([title, key, choices, only, ck, colors, k2]) => `<div class="group"><div class="group-title">${title}</div>
    ${choices ? `<div class="chips">${choices.filter(([id]) => isUnlocked(key, id)).map(([id, l]) => `<button class="chip ${save.avatar[key] === id ? 'on' : ''}" data-k="${key}" data-v="${id}">${l}</button>`).join('')}</div>` : ''}
    ${only ? `<div class="swatches">${only.map((c) => `<div class="sw ${save.avatar[key] === c ? 'on' : ''}" style="background:${c}" data-k="${key}" data-v="${c}"></div>`).join('')}</div>` : ''}
    ${ck ? `<div class="swatches">${colors.map((c) => `<div class="sw ${save.avatar[ck] === c ? 'on' : ''}" style="background:${c}" data-k="${ck}" data-v="${c}"></div>`).join('')}</div>` : ''}
    ${k2 ? `<div class="swatches">${OPTIONS.colors.map((c) => `<div class="sw ${save.avatar[k2] === c ? 'on' : ''}" style="background:${c};width:20px;height:20px" data-k="${k2}" data-v="${c}"></div>`).join('')}</div>` : ''}</div>`).join('');
  $('groups').querySelectorAll('[data-k]').forEach((el) => el.onclick = () => { save.avatar[el.dataset.k] = el.dataset.v; rebuildAvatar(); renderCreator(); const f = $('groups').querySelector(`[data-k="${el.dataset.k}"][data-v="${el.dataset.v}"]`); if (pad.on && f) setNav(f); });
  $('groups').querySelectorAll('[data-diff]').forEach((el) => el.onclick = () => { save.settings.diff = el.dataset.diff; renderCreator(); });
}
function rebuildAvatar() { scene.remove(avatar); avatar = buildAvatar(state === 'creator' ? save.avatar : weatherOutfit(save.avatar)); attachHeadlamp(); scene.add(avatar); avatar.position.set(P.x, P.y, P.z); avatar.rotation.y = P.yaw; }
$('randomBtn').onclick = () => { save.avatar = randomAvatar(); rebuildAvatar(); renderCreator(); };
$('goBtn').onclick = async () => {
  if (!$('username').value.trim() && pad.on) $('username').value = 'Player';
  const name = $('username').value.trim();
  if (name.length < 2) { toast('Type your name (at least 2 letters) ✏️'); $('username').focus(); return; }
  audio(); save.name = name; await persist(); startPlay();
};
let state = 'creator', started = false;
function openCreator() { state = 'creator'; $('creator').classList.remove('hidden'); $('hud').classList.add('hidden'); renderCreator(); }
function startPlay() {
  state = 'play'; cam.snap = true; $('creator').classList.add('hidden'); $('hud').classList.remove('hidden'); rebuildAvatar(); navEl = null;
  hintBar(); renderStats(); renderComp(); renderQuests();
  if (!started) { started = true; if (!save.tips.tutorial && !qs.has('t')) openTutorial(() => story('start')); else story('start'); }
}

// ====================================================================== main loop
let last = performance.now();
function loop(now) {
  const rawDt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
  pollPad();
  if (paused || TEDIT.on) { press.clear(); renderFrame(); requestAnimationFrame(loop); return; }
  const dt = (bond ? rawDt * 0.35 : rawDt) * TIME.scale;     // slow motion during the bond moment
  if (state === 'play') {
    if (pad.on) { const s = save.settings.sens; cam.yaw -= pad.rx * dt * 2.6 * s; cam.pitch = Math.min(1.2, Math.max(-0.05, cam.pitch + pad.ry * dt * 1.6 * s)); }
    if (press.has('pause')) { const ov = topOverlay(); if (ov && ov !== 'creator') navBack(ov); else togglePause(true); }
    if (press.has('help')) $('help').classList.contains('hidden') ? openHelp() : closeHelp();
    if (press.has('dex')) $('dex').classList.contains('hidden') ? openDex() : closeDex();
    if (press.has('potion')) usePotion();
    if (comp && comp.trial && $('choose').classList.contains('hidden')) { if (press.has('cube')) { press.delete('cube'); pickStarter(comp.m.sp); } else if (press.has('team')) { press.delete('team'); endTrial(); openChoose(); } }
    if (press.has('talk')) interact();
    if (dlg.open && press.has('jumpPress')) showLine();
    if (!dlg.open && $('choose').classList.contains('hidden')) {
      if (press.has('attack') && comp && !evolving) { const tg = currentTarget(); if (tg) { comp.target = tg; comp.auto = true; } else toast('🎯 No target nearby.'); }
      if (press.has('skill1')) useSkill(1);
      if (press.has('skill2')) useSkill(2);
      if (press.has('ult')) useSkill(3);
      if (press.has('cube')) throwCube();
      if (press.has('team')) $('teamMenu').classList.contains('hidden') ? openTeam() : closeTeam();
      if (press.has('avatar')) openCreator();
    }
    updatePlayer(dt); updateCamera(rawDt);
    animateAvatar(avatar, t, P.mode, 1);
    if (RIDE.on) avatar.userData.parts.legs.forEach((l, i) => { l.rotation.x = -1.35; l.rotation.z = i ? -0.35 : 0.35; });
    if (save.step === 'explore' && P.z < -63 && P.y > CITY_Y - 2 && !dlg.open) story('city');
    if (save.step === 'arrive' && dist2(P.x, P.z, ...SPOTS.green) < 3 && !dlg.open) story('meetGreen');
    if (save.step === 'mission1' && P.z < 19 && !dlg.open) story('bridgeFold');
  } else {
    P.y = height(P.x, P.z); avatar.position.set(P.x, P.y, P.z);
    if (!drag) cam.yaw += rawDt * 0.35;
    camera.position.set(P.x + Math.sin(cam.yaw) * 4.2, P.y + 1.4, P.z + Math.cos(cam.yaw) * 4.2);
    const right = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
    camera.lookAt(new THREE.Vector3(P.x, P.y + 0.95, P.z).addScaledVector(right, 0.9));
    avatar.rotation.y = 0; animateAvatar(avatar, t, 'idle', 0);
  }
  updateExtras(dt, t); updateWeather(rawDt); updateDay(rawDt); updateHeadlamp(); updateGarden(dt, t); updatePadTest(); updateGfx(rawDt, t);
  updateCompanion(dt, t); updateEvolution(rawDt); updateEnemies(dt, t); updateTelegraphs(dt); updateCubes(dt, t); updateBond(rawDt);
  updateLake(dt, t); updateUncle(dt, t); updateBridge(dt); updateAmbience(dt, t); updateFx(dt); updateCoop(rawDt, t);
  if (state === 'play') {
    updateGuide();
    if (Math.floor(t * 5) !== loop._q) { loop._q = Math.floor(t * 5); renderStats(); renderComp(); renderQuests(); drawMinimap(); pickMusic(); updateTouchUI(); }
    updateLabels(); updateMusic();
  }
  renderPreviews(t);
  press.clear();
  renderFrame();
  requestAnimationFrame(loop);
}


// ====================================================================== CO-OP: play together on two devices (PeerJS, one private family room)
// The first device that opens the game becomes the room "host", the second one joins it. Nobody types a code.
// Each player keeps their own save. You see each other, your Monstermon, and the wild monsters near both of you
// are shared: hit them together, and when one of you catches a monster, the other one (if close) gets one too.
const COOP_ROOM = qs.get('room') || 'mmwf-kraja-family-q7x2k9v4';
const COOP = { peer: null, conn: null, role: '', status: 'off', retryT: 0, lastRx: 0, sendT: 0, wildT: 0, lookT: 0, sentLook: '', gen: 0 };
const RMT = { on: false, name: 'Friend', look: '', av: null, comp: null, compSp: '', dragon: null, x: 0, y: 0, z: 0, yaw: 0, mode: 'idle', tx: 0, ty: 0, tz: 0, tyaw: 0, c: null, dr: 0, tag: null, seen: {} };
const coopOn = () => save.settings.coop !== false && typeof window.Peer === 'function' && (!qs.has('t') || qs.has('coop'));
function coopLog(s) { console.log('[coop]', s); }
function coopStart() {
  if (save.settings.coop === undefined) save.settings.coop = true;
  if (!coopOn() || COOP.peer) return;
  COOP.gen++; tryHost(COOP.gen);
}
function coopStop() {
  COOP.gen++;
  try { if (COOP.conn) COOP.conn.close(); } catch (e) { }
  try { if (COOP.peer) COOP.peer.destroy(); } catch (e) { }
  COOP.peer = null; COOP.conn = null; COOP.role = ''; COOP.status = 'off'; remoteGone(true); renderStats();
}
function coopRetry(ms) {
  const g = ++COOP.gen;
  try { if (COOP.peer) COOP.peer.destroy(); } catch (e) { }
  COOP.peer = null; COOP.conn = null; COOP.status = 'looking';
  setTimeout(() => { if (g === COOP.gen && coopOn()) tryHost(g); }, ms);
}
function newPeer(id) {
  // PeerJS free cloud server for the "hello", then a direct WebRTC link between the two devices (STUN + PeerJS TURN fallback)
  return id ? new window.Peer(id, { debug: 0 }) : new window.Peer({ debug: 0 });
}
function tryHost(g) {
  COOP.status = 'looking'; COOP.role = 'host';
  const p = newPeer(COOP_ROOM + '-host'); COOP.peer = p;
  p.on('open', () => { if (g !== COOP.gen) return; coopLog('I am the room host, waiting for my friend'); });
  p.on('connection', (c) => { if (g !== COOP.gen) return; if (COOP.conn && COOP.conn !== c) { try { COOP.conn.close(); } catch (e) { } } setupConn(c, g); });
  p.on('disconnected', () => { if (g === COOP.gen && !p.destroyed) setTimeout(() => { try { if (g === COOP.gen) p.reconnect(); } catch (e) { } }, 2000); });
  p.on('error', (err) => {
    if (g !== COOP.gen) return;
    if (err.type === 'unavailable-id') { try { p.destroy(); } catch (e) { } COOP.peer = null; tryGuest(g); }   // my friend is already the host: join them
    else if (!COOP.conn) { coopLog('host error ' + err.type); coopRetry(8000); }
  });
}
function tryGuest(g) {
  COOP.role = 'guest'; COOP.status = 'looking';
  const p = newPeer(); COOP.peer = p;
  p.on('open', () => {
    if (g !== COOP.gen) return;
    const c = p.connect(COOP_ROOM + '-host', { reliable: true, serialization: 'json' });
    setupConn(c, g);
    setTimeout(() => { if (g === COOP.gen && !(COOP.conn && COOP.conn.open)) coopRetry(1500); }, 12000);
  });
  p.on('error', (err) => { if (g !== COOP.gen) return; coopLog('guest error ' + err.type); coopRetry(err.type === 'peer-unavailable' ? 2500 : 6000); });
  p.on('disconnected', () => { if (g === COOP.gen && !p.destroyed) setTimeout(() => { try { if (g === COOP.gen) p.reconnect(); } catch (e) { } }, 2000); });
}
function setupConn(c, g) {
  c.on('open', () => {
    if (g !== COOP.gen) return;
    COOP.conn = c; COOP.status = 'online'; COOP.lastRx = performance.now(); COOP.sentLook = '';
    coopSend({ t: 'hi', name: save.name || 'Friend', look: save.avatar, ver: window.DP_VERSION || '' });
    coopLog('connected as ' + COOP.role);
  });
  c.on('data', (m) => { if (g === COOP.gen) { COOP.lastRx = performance.now(); coopRx(m); } });
  c.on('close', () => { if (g !== COOP.gen || COOP.conn !== c) return; coopLog('link closed'); remoteGone(); COOP.conn = null; if (COOP.role === 'guest') coopRetry(2000); else COOP.status = 'looking'; });
  c.on('error', () => { });
}
function coopSend(m) { try { if (COOP.conn && COOP.conn.open) COOP.conn.send(m); } catch (e) { } }
const coopLinked = () => !!(COOP.conn && COOP.conn.open && RMT.on);

// ---- what I receive
function coopRx(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'hi') {
    const first = !RMT.on; RMT.name = String(m.name || 'Friend').slice(0, 20);
    setRemoteLook(m.look);
    if (first) {
      RMT.on = true; RMT.tx = RMT.x = m.x || P.x + 3; RMT.tz = RMT.z = m.z || P.z;
      toast(`🤝 <b>${RMT.name}</b> joined your world! Look for the 🤝 on the map. Pause ▸ 🤝 Go to ${RMT.name} to jump next to them.`, 6000); SFX.win();
      coopSend({ t: 'hi', name: save.name || 'Friend', look: save.avatar });     // so they know me too
    }
    renderStats(); return;
  }
  if (!RMT.on) return;
  if (m.t === 's') {
    RMT.tx = m.x; RMT.ty = m.y; RMT.tz = m.z; RMT.tyaw = m.yaw; RMT.mode = m.mode || 'idle'; RMT.dr = m.dr ? 1 : 0; RMT.c = m.c || null;
    if (!RMT.av || RMT.snap) { RMT.x = m.x; RMT.y = m.y; RMT.z = m.z; RMT.yaw = m.yaw; RMT.snap = false; }
    if (Array.isArray(m.w)) syncPuppets(m.w);
    return;
  }
  if (m.t === 'dmg') { const e = enemies.find((x) => x.id === m.id && x.alive && !x.puppet); if (e) applyDamage(e, Math.max(0, Math.min(5000, +m.d || 0))); return; }
  if (m.t === 'caught') { teamCatch(m); return; }
  if (m.t === 'wave') { floatText(RMT.x, RMT.y + 2.6, RMT.z, '👋', '#ffffff'); toast(`👋 <b>${RMT.name}</b> waves at you!`, 2500); return; }
}
function setRemoteLook(look) {
  if (!look || typeof look !== 'object') return;
  const key = JSON.stringify(look); if (key === RMT.look && RMT.av) return;
  RMT.look = key; if (RMT.av) scene.remove(RMT.av);
  try { RMT.av = buildAvatar({ ...DEFAULT_AVATAR, ...look }); } catch (e) { RMT.av = buildAvatar({ ...DEFAULT_AVATAR }); }
  RMT.av.position.set(RMT.x, RMT.y, RMT.z); scene.add(RMT.av);
}
function remoteGone(silent) {
  if (RMT.on && !silent) toast(`👋 <b>${RMT.name}</b> left the game. When they come back you will find each other again.`, 4500);
  RMT.on = false; RMT.look = '';
  if (RMT.av) { scene.remove(RMT.av); RMT.av = null; }
  if (RMT.comp) { scene.remove(RMT.comp); RMT.comp = null; RMT.compSp = ''; }
  if (RMT.dragon) RMT.dragon.visible = false;
  if (RMT.tag) { RMT.tag.remove(); RMT.tag = null; }
  for (const e of [...enemies]) if (e.puppet) removeEnemy(e);
  renderStats();
}

// ---- shared wild monsters: the device that spawned a monster runs it; the other one shows a "puppet" copy
function shareList() {
  const out = [];
  for (const e of enemies) {
    if (!e.wild || e.puppet || !e.alive || e.autoCatch || e.capturing || e.kind !== 'mon') continue;
    if (dist2(e.x, e.z, RMT.x, RMT.z) > 70) continue;
    out.push([e.id, e.sp, +e.x.toFixed(2), +e.z.toFixed(2), +e.yaw.toFixed(2), Math.round(e.hp), Math.round(e.max), e.lvl || 1, e.mood === 'sad' ? 1 : 0]);
    if (out.length >= 14) break;
  }
  return out;
}
function syncPuppets(list) {
  const now = performance.now();
  for (const [id, sp, x, z, yaw, hp, max, lvl, sad] of list) {
    if (!SPECIES[sp]) continue;
    let e = enemies.find((q) => q.puppet && q.netId === id);
    if (!e) {
      e = makeEnemy(sp, x, z, { catchable: false, mood: sad ? 'sad' : 'angry' });
      e.puppet = true; e.netId = id; e.wild = false; e.state = 'idle'; e.px = x; e.pz = z;
    }
    if (hp < e.hp - 0.5) { e.hitT = 0.25; hitFlash(e); }
    e.tx = x; e.tz = z; e.tyaw = yaw; e.hp = Math.max(1, hp); e.max = max; e.lvl = lvl; e.seenAt = now;
  }
  for (const e of [...enemies]) if (e.puppet && now - (e.seenAt || 0) > 1500) removeEnemy(e);
}
function updatePuppet(e, dt) {
  const k = 1 - Math.exp(-dt * 10);
  e.x += ((e.tx ?? e.x) - e.x) * k; e.z += ((e.tz ?? e.z) - e.z) * k;
  let d = (e.tyaw ?? e.yaw) - e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); e.yaw += d * k;
  e.y = height(e.x, e.z); e.model.position.set(e.x, e.y, e.z); e.model.rotation.y = e.yaw;
  if (e.hitT > 0) e.hitT -= dt;
}
function puppetHit(e, dmg) {
  // I hit my friend's monster: show it here, the real hit happens on their device
  if (!coopLinked()) return;
  coopSend({ t: 'dmg', id: e.netId, d: Math.round(dmg) });
  SFX.hit(); e.hitT = 0.25; spark(e.x, e.y + 1, e.z, '#fff2a8', 8); hitFlash(e);
  floatText(e.x, e.y + 2, e.z, Math.round(dmg), '#ffffff');
  e.hp = Math.max(1, e.hp - dmg);
}
function coopCaught(e) {
  if (!coopLinked() || !e.wild || dist2(e.x, e.z, RMT.x, RMT.z) > 60) return;
  coopSend({ t: 'caught', sp: e.sp, x: e.x, z: e.z });
  setTimeout(() => toast(`🤝 TEAM CATCH! <b>${RMT.name}</b> was with you, so they get a <b>${SPECIES[e.sp].name}</b> too!`, 4000), 2500);
}
function teamCatch(m) {
  if (!SPECIES[m.sp] || dist2(m.x, m.z, P.x, P.z) > 75) return;
  const mem = newMember(m.sp); markCaught(m.sp); stat('teamCatches');
  if (save.team.length < 7) save.team.push(mem); else { save.garden.push(mem); rebuildGarden(); }
  if (!comp) { save.active = 0; spawnCompanion(save.team[0]); }
  toast(`🤝🧊 TEAM CATCH! <b>${RMT.name}</b> caught <b>${SPECIES[m.sp].name}</b> and you get one too! ${save.team.includes(mem) ? `(team ${save.team.length}/7)` : '(it went to the garden)'}`, 5000);
  SFX.win(); spark(P.x, P.y + 1.5, P.z, '#9fe8ff', 24);
  save.coins += 6; giveXP(20); persist(); renderComp();
}

// ---- every frame
function updateCoop(dt, t) {
  if (!coopOn()) return;
  const now = performance.now();
  if (COOP.conn && COOP.conn.open && now - COOP.lastRx > 9000) { coopLog('no data for 9 s'); try { COOP.conn.close(); } catch (e) { } remoteGone(); COOP.conn = null; if (COOP.role === 'guest') coopRetry(1500); else COOP.status = 'looking'; }
  if (COOP.conn && COOP.conn.open && state === 'play') {
    COOP.sendT -= dt; COOP.wildT -= dt; COOP.lookT -= dt;
    if (COOP.sendT <= 0) {
      COOP.sendT = 0.1;
      const msg = { t: 's', x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), yaw: +P.yaw.toFixed(2), mode: P.mode, dr: RIDE.dragon ? 1 : 0, c: comp && comp.model.visible ? [comp.m.sp, +comp.x.toFixed(2), +(comp.y || P.y).toFixed(2), +comp.z.toFixed(2), +(comp.model.rotation.y || 0).toFixed(2)] : 0 };
      if (COOP.wildT <= 0 && RMT.on) { COOP.wildT = 0.2; msg.w = shareList(); }
      coopSend(msg);
    }
    if (COOP.lookT <= 0) { COOP.lookT = 2; const k = JSON.stringify(save.avatar) + save.name; if (k !== COOP.sentLook) { COOP.sentLook = k; coopSend({ t: 'hi', name: save.name || 'Friend', look: save.avatar }); } }
  }
  if (!RMT.on || !RMT.av) return;
  // smooth the friend's movement
  const k = 1 - Math.exp(-dt * 12);
  if (Math.hypot(RMT.tx - RMT.x, RMT.tz - RMT.z) > 25) { RMT.x = RMT.tx; RMT.z = RMT.tz; RMT.y = RMT.ty; }
  RMT.x += (RMT.tx - RMT.x) * k; RMT.y += (RMT.ty - RMT.y) * k; RMT.z += (RMT.tz - RMT.z) * k;
  let d = RMT.tyaw - RMT.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); RMT.yaw += d * k;
  RMT.av.position.set(RMT.x, RMT.y, RMT.z); RMT.av.rotation.y = RMT.yaw;
  animateAvatar(RMT.av, t, RMT.dr ? 'idle' : RMT.mode, 1);
  // their dragon
  if (RMT.dr) {
    if (!RMT.dragon) RMT.dragon = makeDragon();
    RMT.dragon.visible = true; RMT.dragon.position.set(RMT.x, RMT.y - 0.15, RMT.z); RMT.dragon.rotation.y = RMT.yaw;
    try { RMT.dragon.userData.anim(t, true); } catch (e) { }
    RMT.av.userData.parts.legs.forEach((l, i) => { l.rotation.x = -1.35; l.rotation.z = i ? -0.35 : 0.35; });
  } else if (RMT.dragon) RMT.dragon.visible = false;
  // their Monstermon
  const c = RMT.c;
  if (c && SPECIES[c[0]]) {
    if (RMT.compSp !== c[0]) { if (RMT.comp) scene.remove(RMT.comp); RMT.comp = buildMon(c[0], 'happy'); RMT.comp.position.set(c[1], c[2], c[3]); scene.add(RMT.comp); RMT.compSp = c[0]; }
    const cm = RMT.comp.position; if (cm.distanceTo(new THREE.Vector3(c[1], c[2], c[3])) > 25) cm.set(c[1], c[2], c[3]);
    cm.x += (c[1] - cm.x) * k; cm.y += (c[2] - cm.y) * k; cm.z += (c[3] - cm.z) * k;
    let dy = c[4] - RMT.comp.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); RMT.comp.rotation.y += dy * k;
    RMT.comp.visible = true;
  } else if (RMT.comp) RMT.comp.visible = false;
  // name tag over their head
  if (!RMT.tag) { RMT.tag = document.createElement('div'); RMT.tag.className = 'lbl coopTag'; $('labels').appendChild(RMT.tag); }
  const p = new THREE.Vector3(RMT.x, RMT.y + (RMT.dr ? 3.4 : 2.35), RMT.z).project(camera), far = dist2(RMT.x, RMT.z, P.x, P.z);
  if (p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1 || far > 120) RMT.tag.style.display = 'none';
  else { RMT.tag.style.display = ''; RMT.tag.style.left = (p.x + 1) / 2 * innerWidth + 'px'; RMT.tag.style.top = (1 - p.y) / 2 * innerHeight + 'px'; RMT.tag.innerHTML = `🤝 <b>${RMT.name}</b>${far > 20 ? ` <span style="opacity:.8">${Math.round(far)} m</span>` : ''}`; }
}
function coopMinimap() {
  if (!RMT.on) return;
  const [x, y] = clampMM(toMM(RMT.x, RMT.z));
  mctx.save(); mctx.translate(x, y); mctx.rotate(-RMT.yaw + Math.PI);
  mctx.fillStyle = '#ff5ad6'; mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.moveTo(0, -8); mctx.lineTo(6, 6); mctx.lineTo(0, 2.5); mctx.lineTo(-6, 6); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
  mctx.font = 'bold 11px Segoe UI Emoji, sans-serif'; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillText('🤝', x, y - 13);
}
function goToFriend() {
  if (!RMT.on) return toast('🤝 Your friend is not in the game right now. When they open Monstermon on their device, you find each other automatically.', 5000);
  if (RIDE.on) dismount();
  P.x = RMT.x + 2; P.z = RMT.z + 1.5; P.y = Math.max(height(P.x, P.z), RMT.y); P.vy = 0;
  if (comp) { comp.x = P.x + 1.5; comp.z = P.z + 1.5; comp.y = height(comp.x, comp.z); }
  cam.snap = true; spark(P.x, P.y + 1, P.z, '#ff5ad6', 24); SFX.whoosh(); toast(`✨ You jumped next to <b>${RMT.name}</b>!`);
}
// pause menu rows, the status pill and the hooks into the game loop
PROWS.splice(1, 0,
  { type: 'toggle', key: 'coop', label: '🤝 Play together (co-op)', opts: [[true, 'On'], [false, 'Off']] },
  { type: 'btn', label: '🤝 Go to my friend', act: () => { togglePause(false); goToFriend(); } },
  { type: 'btn', label: '👋 Wave to my friend', act: () => { togglePause(false); if (!coopLinked()) return toast('🤝 Your friend is not in the game right now.'); coopSend({ t: 'wave' }); floatText(P.x, P.y + 2.6, P.z, '👋', '#ffffff'); } });
{ const _st = setToggle; setToggle = function (key, v) { _st(key, v); if (key === 'coop') { if (v) { coopStart(); toast('🤝 Co-op is ON: when your friend opens the game, you find each other.'); } else { coopStop(); toast('🤝 Co-op is OFF.'); } } }; }
{ const _rs = renderStats; renderStats = function () { _rs(); if (!coopOn() || state !== 'play') return; const on = RMT.on; $('stats').insertAdjacentHTML('beforeend', `<div class="pill" style="${on ? 'color:#ff8ae6' : 'opacity:.7'}">${on ? `🤝 ${RMT.name} is here` : '🤝 waiting for friend…'}</div>`); }; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && coopOn() && !(COOP.conn && COOP.conn.open)) coopRetry(300); });
addEventListener('beforeunload', () => { try { if (COOP.peer) COOP.peer.destroy(); } catch (e) { } });
window.__coop = { COOP, RMT, get linked() { return coopLinked(); } };

// ====================================================================== boot
window.__wf = { get save() { return save; }, get comp() { return comp; }, enemies, WORLD, P, get boss() { return boss; } };   // read-only debug handle
async function boot() {
  try {
    if (!qs.has('t') && !qs.has('p')) { let wait = true; const poll = () => { if (!wait) return; pollPad(); press.clear(); requestAnimationFrame(poll); }; poll(); PROFILE = await chooseProfile(); wait = false; }
    const d = await (await fetch(advUrl())).json();
    if (d && d.avatar) {
      Object.assign(save, d); save.avatar = { ...DEFAULT_AVATAR, ...d.avatar };
      save.team = save.team || []; save.garden = save.garden || []; save.step = save.step || 'arrive';
      save.tips = d.tips || {}; save.settings = { music: 0.6, sfx: 0.8, sens: 1, ...(d.settings || {}) };
      save.side = { songs: { state: 'none', heard: [] }, watch: { state: 'none' }, ...(d.side || {}) };
      if (typeof save.time !== 'number') save.time = 0.25;
      save.fusions = d.fusions || {}; registerFusions();
      save.settings = { diff: 'easy', autoClothes: true, quality: 'high', ...save.settings };
      save.items = { potion: 2, strongCube: 0, ...(d.items || {}) }; save.unlocked = d.unlocked || []; save.dex = { seen: {}, caught: {}, ...(d.dex || {}) }; save.dexRewards = d.dexRewards || {};
    }
  } catch (e) { }
  if (!MAIN_STEPS.includes(save.step) && save.step !== 'free_roam') save.step = 'arrive';
  if (save.step === 'free_roam') save.step = 'mountain';     // older saves
  if (!Array.isArray(save.team) || save.team.some((m) => !SPECIES[m.sp])) { save.team = []; save.step = 'arrive'; }
  for (const m of [...save.team, ...save.garden]) { m.xp = m.xp || 0; m.lv = levelOf(m); m.maxHp = memberMax(m); if (typeof m.hp !== 'number' || m.hp > m.maxHp) m.hp = m.maxHp; }
  for (const m of [...save.team, ...save.garden]) { save.dex.seen[m.sp] = 1; save.dex.caught[m.sp] = 1; }
  if (reached('boss')) save.dex.seen.rootlock = 1; if (reached('free')) save.dex.seen.skipclip = 1;
  if (TOUCH.mode && !save.settings.qualityChosen) save.settings.quality = 'medium';
  applyQuality();
  setWeather(qs.get('w') || (WEATHERS[save.weather] ? save.weather : 'cloudy'), true);
  $('username').value = save.name || '';
  rebuildAvatar(); renderCreator(); rebuildGarden();
  addEventListener('pointerdown', startAmbience); addEventListener('keydown', startAmbience);
  for (let i = 0; i < 7; i++) { const [sp, x, z] = SPAWNS[i]; makeEnemy(sp, x, z, { corrupted: i % 3 === 0 }); }
  // test hooks for automated screenshots: ?t=arrive|choose|fold|battle|boss|mountain|evo|night  (&z=18 &auto &sp=…)
  if (qs.has('t')) {
    const step = qs.get('t'); save.name = save.name || 'Tester';
    startPlay(); started = true;
    if (step === 'arrive') { save.step = 'arrive'; story('start'); }
    if (step === 'choose') { save.step = 'choose'; P.x = SPOTS.green[0]; P.z = SPOTS.green[1] + 6; openChoose(); }
    if (['fold', 'boss', 'battle', 'mountain', 'evo', 'night', 'city', 'dragon', 'legend', 'ride'].includes(step)) { save.team = [newMember(qs.get('sp') || 'pinkypunch')]; save.active = 0; spawnCompanion(save.team[0]); nira.visible = true; }
    if (step === 'fold') { save.step = 'mission1'; P.x = 0; P.z = qs.has('z') ? +qs.get('z') : 22; cam.yaw = Math.PI * 0.05; }
    if (step === 'battle' || step === 'night') { save.step = 'explore'; const e = enemies[1]; P.x = e.x + 4; P.z = e.z + 4; cam.yaw = Math.atan2(P.x - e.x, P.z - e.z); if (step === 'night') save.time = 0.72; else setTimeout(() => { comp.target = e; comp.auto = true; useSkill(1); }, 600); }
    if (step === 'boss') { save.step = 'boss'; foldBridge(true); startBoss(); P.x = 0; P.z = 24; cam.yaw = 0.0; boss.state = 'fight'; boss.atkT = 0.5; if (qs.has('p2')) { pylons.forEach((p) => { p.alive = false; }); boss.shield = false; boss.hp = boss.max * 0.45; } }
    if (step === 'mountain') { save.step = 'mountain'; WORLD.bridgeState = 1; setBeacon(GATE[0], GATE[1] + 4); spawnMountain(); P.x = 0; P.z = -30; cam.yaw = 0; }
    if (step === 'evo') { save.step = 'explore'; save.team[0].xp = 395; save.team[0].lv = levelOf(save.team[0]); setTimeout(() => giveXP(10), 800); }
    if (qs.has('auto')) setInterval(() => { if (dlg.open) showLine(); if (save.step === 'free' && comp && cage && cage.alive) { comp.target = cage; comp.auto = true; } if (save.step === 'capture' && trapped && !cubes.length && !bond) throwCube(); }, 1200);
    if (step === 'city') { save.step = 'explore'; WORLD.bridgeState = 1; spawnMountain(); P.x = LIFT_HIGH[0]; P.z = LIFT_HIGH[1] - 3; cam.yaw = 0; setTimeout(() => story('city'), 400); }
    if (step === 'dragon') { save.step = 'dragon'; WORLD.bridgeState = 1; spawnCity(); startDragon(); P.x = 0; P.z = -62; cam.yaw = 0; }
    if (step === 'legend') { save.step = 'ch2done'; WORLD.bridgeState = 1; save.time = 0.75; setWeather('snow', true); P.x = 22; P.z = -68; cam.yaw = 0.8; }
    if (step === 'ride') { save.team = [newMember(qs.get('sp') || 'metawing')]; spawnCompanion(save.team[0]); setTimeout(toggleRide, 600); }
    if (qs.has('baba')) setTimeout(() => { P.hp = 10; }, 1500);
    if (qs.has('zoo')) { save.step = 'ch2done'; for (let k = 0; k < 10; k++) { const id = GEN_IDS[(k * 19 + 3) % GEN_IDS.length], a = k / 10 * 6.28; const m = makeEnemy(id, P.x + Math.cos(a) * 7, P.z + Math.sin(a) * 7, { mood: 'angry' }); m.wild = true; m.state = 'idle'; m.homeX = m.x; m.homeZ = m.z; } }
    if (qs.has('teamtest')) { save.team = [newMember('pinkypunch'), newMember('g004'), newMember('rivolo'), newMember('g033'), newMember('g120')]; save.garden = [newMember('g077'), newMember('mossroll'), newMember('g150')]; save.active = 0; spawnCompanion(save.team[0]); setTimeout(openTeam, 600); }
    if (qs.has('morph') || qs.has('morphrun')) { save.team = [newMember('pinkypunch'), newMember('g004'), newMember('rivolo')]; save.garden = [newMember('g120')]; save.active = 0; spawnCompanion(save.team[0]); P.x = CHAMBER[0] + 4; P.z = CHAMBER[1]; save.coins = Math.max(save.coins, 200); if (qs.has('morph')) setTimeout(() => { mSel = [save.team[0].uid, save.team[1].uid]; openMorph(); }, 600); else setTimeout(() => startMorph(save.team[0], save.team[1], fusionSpec(save.team[0], save.team[1])), 600); }
    if (qs.has('morphstep')) setTimeout(() => { save.team = [newMember('pinkypunch'), newMember('g004')]; save.active = 0; spawnCompanion(save.team[0]); save.coins = 200; startMorph(save.team[0], save.team[1], fusionSpec(save.team[0], save.team[1])); const n = +qs.get('morphstep'); for (let i = 0; i < n; i++) { updateMorph(0.05, i * 0.05); updateVfx(0.05, i * 0.05); } MORPH.frozen = n < 180; document.documentElement.dataset.test = JSON.stringify({ on: MORPH.on, T: +MORPH.t.toFixed(2), team: save.team.map((m) => SPECIES[m.sp].name), active: save.active, coins: save.coins, medal: !!save.medals.morph }); }, 800);
    if (qs.has('tedit')) setTimeout(() => { startEdit(); selectBtn('attack'); }, 700);
    if (qs.has('nearshop')) { P.x = SHOP_AT[0] + 1.5; P.z = SHOP_AT[1] + 2.5; cam.yaw = 0.3; }
    if (qs.has('tut')) setTimeout(() => openTutorial(), 500);
    if (qs.has('farfromgreen')) { P.x = SPOTS.green[0] - 4; P.z = SPOTS.green[1] + 26; cam.yaw = 0; }
    if (qs.has('zone')) { const zz = qs.get('zone'), pt = { wastes: [210, 30], swamp: [10, 220], frost: [-210, 20], peaks: [20, -220] }[zz]; if (pt) { P.x = pt[0]; P.z = pt[1]; } }
    if (qs.has('fly')) setTimeout(() => { toggleDragon(); P.flyH = 22; }, 500);
    if (qs.has('chest')) setTimeout(() => { const c = chests.find((x) => x.zone === (qs.get('chest') || 'core')); P.x = c.x + 1.5; P.z = c.z + 1; openChest(c); }, 600);
    if (qs.has('autocatch')) setTimeout(() => { const e = enemies.find((x) => x.kind === 'mon' && x.alive && x.catchable); const before = save.team.length; e.x = P.x + 3; e.z = P.z; applyDamage(e, 99999); const ph0 = cubes.map((c) => c.phase); for (let i = 0; i < 80; i++) updateCubes(0.05, i * 0.05); setTimeout(() => { document.documentElement.dataset.test = JSON.stringify({ sp: e.sp, before, after: save.team.length, team: save.team.map((m) => m.sp), caught: !!save.dex.caught[e.sp], left: enemies.includes(e), ph0, cubes: cubes.length }); }, 500); }, 1500);
    if (qs.has('babatest')) setTimeout(() => { const near = enemies.filter((e) => e.kind === 'mon' && e.alive); near.forEach((e) => { e.x = P.x + 5; e.z = P.z + 3; }); D.x = P.x + 1; D.z = P.z; uncle.visible = true; D.reason = 'rescue'; babaStart(); const ph = []; for (let i = 0; i < 120; i++) { updateBaba(0.05, i * 0.05); if (!ph.includes(BABA.phase)) ph.push(BABA.phase); } for (let i = 0; i < 80; i++) updateUncle(0.05, i * 0.05); document.documentElement.dataset.test = JSON.stringify({ phases: ph, hp: near.map((e) => +(e.hp / e.max).toFixed(3)), ready: near.map((e) => e.ready), dstate: D.state, bubble: bubbleEl && bubbleEl.textContent, playerHp: Math.round(P.hp), hugs: save.stats.hugs, medal: !!save.medals.baba }); }, 1500);
    if (qs.has('fish')) { P.x = LAKE.x + LAKE.r + 1.5; P.z = LAKE.z; setTimeout(startFishing, 500); }
    if (qs.has('race')) setTimeout(startRace, 500);
    if (qs.has('care')) setTimeout(openCare, 400);
    if (qs.has('medals')) setTimeout(openMedals, 400);
    if (qs.has('parent')) setTimeout(openParent, 400);
    if (qs.has('help')) setTimeout(() => openHelp(qs.get('help') || 'start'), 300);
    if (qs.has('shop')) setTimeout(openShop, 300);
    if (qs.has('dex')) setTimeout(openDex, 300);
    if (qs.has('garden')) { save.garden = [newMember('mossroll'), newMember('bellbud')]; rebuildGarden(); P.x = GARDEN_AT[0] - 3; P.z = GARDEN_AT[1] + 9; cam.yaw = 0.3; setTimeout(openGarden, qs.has('open') ? 300 : 1e9); }
    P.y = height(P.x, P.z); cam.snap = true;
  }
  coopStart();
  requestAnimationFrame(loop);
}
boot();
