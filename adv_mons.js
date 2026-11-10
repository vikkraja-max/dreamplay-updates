/* MONSTERMON: WILDFOLD - creatures (all original, designed by the player's family) and their blocky 3D models.
   Each model returns a THREE.Group with userData.anim(t, state) so the engine can animate it. */
import * as THREE from './lib/three.module.min.js';

// ------------------------------------------------------------------ data
// stats: hp, atk, spd (m/s). skills: [basic, skill1, skill2, ultimate]
export const SPECIES = {
  dracometal: { name: 'Dracometal', starter: true, evo: 'dracotime', color: '#8f9db0', hp: 120, atk: 14, spd: 4.2, role: 'Defense and control',
    about: 'A wristwatch with a spiked iron chain; the clock face is a dragon face. Proud, precise, a little impatient.',
    skills: [
      { name: 'Chain Strike', kind: 'melee', power: 1.0, range: 2.2, cd: 0.8 },
      { name: 'Chain Snap', kind: 'melee', power: 2.0, range: 3.2, cd: 4, stagger: 0.8, desc: 'Lashes with the spiked chain and knocks the enemy off balance.' },
      { name: 'Tick Lock', kind: 'slow', power: 0.8, range: 6, cd: 7, slow: 3, desc: 'Slows the enemy down for a few moments.' },
      { name: 'Dragon Hour', kind: 'aoe', power: 4.0, range: 4.5, desc: 'Spins the chain in a circle and throws back every enemy around.' }] },
  dracotime: { name: 'Dracotime', evoOf: 'dracometal', color: '#a8b4c4', hp: 200, atk: 22, spd: 4.6, role: 'Time control',
    about: 'Taller and stronger. The chain lifts the clock high, and the hands spin before it attacks.',
    skills: [
      { name: 'Chain Strike', kind: 'melee', power: 1.0, range: 2.8, cd: 0.8 },
      { name: 'Chain Snap', kind: 'melee', power: 2.2, range: 4, cd: 4, stagger: 1, desc: 'A heavier chain lash that stuns.' },
      { name: 'Timehold', kind: 'slow', power: 1.0, range: 7, cd: 7, slow: 4, desc: 'A zone where everything moves slowly.' },
      { name: 'Hourbreak', kind: 'aoe', power: 5.5, range: 5.5, desc: 'Freezes the area in time, then ends with a crushing blow.' }] },
  metasteal: { name: 'Metasteal', starter: true, evo: 'metawing', color: '#bcd6f0', hp: 95, atk: 12, spd: 6.2, role: 'Speed and flight',
    about: 'Two bladed metal arch legs with a flat head in the middle. When it flies, the legs cross into an X. Very curious.',
    skills: [
      { name: 'Arc Slash', kind: 'melee', power: 1.0, range: 2.2, cd: 0.6 },
      { name: 'X Rush', kind: 'dash', power: 1.8, range: 7, cd: 4, desc: 'Turns into an X and dashes into the enemy.' },
      { name: 'Mirror Spin', kind: 'guard', power: 0.6, range: 2.5, cd: 6, desc: 'Spins and deflects incoming hits.' },
      { name: 'Sky Cross', kind: 'aoe', power: 3.6, range: 4.5, desc: 'Two mighty passes that draw an X across the battlefield.' }] },
  metawing: { name: 'Metawing', evoOf: 'metasteal', color: '#cfe6ff', hp: 160, atk: 19, spd: 7.5, role: 'Flight and air attacks',
    about: 'The arch legs became razor metal wings. It hovers in the air.',
    skills: [
      { name: 'Arc Slash', kind: 'melee', power: 1.0, range: 2.6, cd: 0.6 },
      { name: 'Wingrush', kind: 'dash', power: 2.2, range: 9, cd: 4, desc: 'A blade-wing dive from the sky.' },
      { name: 'Mirror Spin', kind: 'guard', power: 0.8, range: 3, cd: 6, desc: 'Spins and deflects incoming hits.' },
      { name: 'Wingstorm', kind: 'aoe', power: 5.0, range: 5.5, desc: 'A storm of steel feathers.' }] },
  pinkypunch: { name: 'Pinkypunch', starter: true, evo: 'pinkyabsorve', color: '#ff5fa8', hp: 110, atk: 16, spd: 5.0, role: 'Power and close combat',
    about: 'A triangle head with one bloodshot eye and iron arms ending in spiked pink boxing gloves. Brave, excited and a bit dramatic.',
    skills: [
      { name: 'Pink One-Two', kind: 'melee', power: 1.1, range: 2.0, cd: 0.7 },
      { name: 'Spring Uppercut', kind: 'melee', power: 2.2, range: 2.4, cd: 4, stagger: 1, desc: 'Launches small foes and staggers big ones.' },
      { name: 'Double Guard', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Crosses the gloves and blocks an attack.' },
      { name: 'Neon Knockout', kind: 'aoe', power: 4.2, range: 3.8, desc: 'A punch combo that ends in a shockwave.' }] },
  pinkyabsorve: { name: 'Pinkyabsorve', evoOf: 'pinkypunch', color: '#ff7ab8', hp: 190, atk: 24, spd: 5.2, role: 'Grab and absorb energy',
    about: 'Keeps the triangle head and gloves; stretchy tentacles with metal segments and hooks grow out of it.',
    skills: [
      { name: 'Pink One-Two', kind: 'melee', power: 1.1, range: 2.4, cd: 0.7 },
      { name: 'Spring Uppercut', kind: 'melee', power: 2.4, range: 2.8, cd: 4, stagger: 1, desc: 'Launches small foes and staggers big ones.' },
      { name: 'Absorb Guard', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Soaks up a hit with its tentacles.' },
      { name: 'Absorb Burst', kind: 'aoe', power: 5.5, range: 4.5, desc: 'Releases all the stored energy at once.' }] },
  skipclip: { name: 'Skipclip', color: '#c99a5a', hp: 70, atk: 10, spd: 6.5, role: 'Jumps and distracts', attack: 'pounce',
    about: 'A big wooden clothes-peg with a metal spring and rows of nail teeth. It jumps, grabs things and causes chaos.',
    skills: [{ name: 'Peg Bite', kind: 'melee', power: 1, range: 2, cd: 0.7 }, { name: 'Spring Leap', kind: 'dash', power: 1.6, range: 6, cd: 4, desc: 'Springs onto the target.' }, { name: 'Distraction', kind: 'slow', power: 0.4, range: 5, cd: 6, slow: 2, desc: 'Confuses the enemy and slows it.' }, { name: 'Peg Storm', kind: 'aoe', power: 3, range: 4, desc: 'Snaps at everything around it.' }] },
  rootlock: { name: 'Rootlock', color: '#8c877f', hp: 160, atk: 13, spd: 2.6, role: 'Anchor and defense', attack: 'melee',
    about: 'A cracked stone padlock with a shackle made of a thorny root. It becomes an anchor and holds machines in place.',
    skills: [{ name: 'Stone Slam', kind: 'melee', power: 1, range: 2.2, cd: 1 }, { name: 'Grabbing Roots', kind: 'slow', power: 1, range: 5, cd: 5, slow: 2, desc: 'Roots grab the enemy.' }, { name: 'Root Wall', kind: 'guard', power: 0, range: 0, cd: 7, desc: 'A wall of roots blocks hits.' }, { name: 'Earthquake', kind: 'aoe', power: 3.5, range: 4.5, desc: 'Shakes the ground around it.' }] },
  rivolo: { name: 'Rivolo', color: '#c08a3a', hp: 85, atk: 11, spd: 5, attack: 'geyser', about: 'A saw-toothed bronze valve with a water face in the middle. It redirects currents.',
    skills: [{ name: 'Water Push', kind: 'melee', power: 1, range: 2.6, cd: 0.8 }, { name: 'Current', kind: 'dash', power: 1.5, range: 6, cd: 4, desc: 'Rides a stream of water.' }, { name: 'Valve Shut', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Closes up and blocks.' }, { name: 'Geyser', kind: 'aoe', power: 3, range: 4, desc: 'Water blasts out of the ground.' }] },
  mossroll: { name: 'Mossroll', color: '#5aa84a', hp: 90, atk: 10, spd: 4.5, attack: 'charge', about: 'A thorny spool wrapped in plant threads, leaves and roots. It rolls over anything in its way.',
    skills: [{ name: 'Thread Whip', kind: 'melee', power: 1, range: 2.6, cd: 0.8 }, { name: 'Net', kind: 'slow', power: 0.8, range: 6, cd: 5, slow: 3, desc: 'Throws a sticky net.' }, { name: 'Wrap Up', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Wraps itself in threads.' }, { name: 'Tangled Forest', kind: 'aoe', power: 3, range: 4, desc: 'Vines burst out all around.' }] },
  glimframe: { name: 'Glimframe', color: '#ffe08a', hp: 70, atk: 12, spd: 5.5, attack: 'beam', about: 'A haunted floating frame with shattered glass and a cluster of glowing eyes. It reveals hidden signs.',
    skills: [{ name: 'Ray', kind: 'melee', power: 1, range: 3, cd: 0.8 }, { name: 'Refraction', kind: 'slow', power: 1, range: 6, cd: 5, slow: 2, desc: 'Bends the light and confuses.' }, { name: 'Mirror', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Reflects attacks.' }, { name: 'Prism', kind: 'aoe', power: 3.2, range: 4, desc: 'Fires rays in every direction.' }] },
  bellbud: { name: 'Bellbud', color: '#ffd34d', hp: 75, atk: 10, spd: 4.8, attack: 'ring', about: 'A dark toothed bell rising from a crown of biting leaves. It attacks with sound.',
    skills: [{ name: 'Ding', kind: 'melee', power: 1, range: 2.6, cd: 0.8 }, { name: 'Echo', kind: 'slow', power: 0.8, range: 6, cd: 5, slow: 2, desc: 'A sound wave that slows.' }, { name: 'Bell Shield', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Hides inside the bell.' }, { name: 'Big Dong', kind: 'aoe', power: 3, range: 4.5, desc: 'A deafening ring.' }] },
  emberlid: { name: 'Emberlid', color: '#7a7f8a', hp: 85, atk: 13, spd: 5.2, attack: 'embers', about: 'A spiked metal lid rolling on a ring of burning embers.',
    skills: [{ name: 'Ember', kind: 'melee', power: 1, range: 2.4, cd: 0.8 }, { name: 'Roll', kind: 'dash', power: 1.6, range: 6, cd: 4, desc: 'Rolls into the enemy.' }, { name: 'Lid Shield', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Hides under the lid.' }, { name: 'Heat Pulse', kind: 'aoe', power: 3.2, range: 4, desc: 'A wave of heat.' }] },
  hingemaw: { name: 'Hingemaw', color: '#7a4a2a', hp: 120, atk: 16, spd: 4.6, attack: 'charge', about: 'An old door torn from a ruined house. Its rusty hinge became a jaw full of crooked nails. It slams shut on anything that comes close.',
    skills: [{ name: 'Door Slam', kind: 'melee', power: 1.1, range: 2.4, cd: 0.9 }, { name: 'Hinge Bite', kind: 'melee', power: 2, range: 2.6, cd: 4, stagger: 0.8, desc: 'Bites with its nail teeth.' }, { name: 'Bolt Lock', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Locks itself shut.' }, { name: 'Slamstorm', kind: 'aoe', power: 4, range: 4.5, desc: 'Slams open and shut so hard the ground shakes.' }] },
  paperfang: { name: 'Paperfang', color: '#e8e2d0', hp: 95, atk: 17, spd: 7, attack: 'pounce', about: 'A wolf folded out of an old map. Its paper fangs are sharp as knives and its ink eyes glow red. It hunts in silence.',
    skills: [{ name: 'Paper Cut', kind: 'melee', power: 1, range: 2.2, cd: 0.6 }, { name: 'Fold Pounce', kind: 'dash', power: 1.9, range: 7, cd: 4, desc: 'Folds flat and leaps.' }, { name: 'Crumple', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Crumples into a hard ball.' }, { name: 'Origami Howl', kind: 'aoe', power: 3.8, range: 4.5, desc: 'A howl that slices the air.' }] },
  inkling: { name: 'Inkling', color: '#1a1a3a', hp: 100, atk: 17, spd: 5.5, attack: 'beam', about: 'A cracked ink bottle that crawls on dripping tentacles. It spits black ink that stings.',
    skills: [{ name: 'Ink Splash', kind: 'melee', power: 1, range: 2.6, cd: 0.8 }, { name: 'Ink Jet', kind: 'dash', power: 1.8, range: 7, cd: 4, desc: 'Shoots itself forward on a jet of ink.' }, { name: 'Blot', kind: 'slow', power: 0.8, range: 6, cd: 5, slow: 3, desc: 'A sticky blot that slows.' }, { name: 'Ink Flood', kind: 'aoe', power: 4, range: 4.5, desc: 'Floods the ground with ink.' }] },
  staplor: { name: 'Staplor', color: '#5a5f6a', hp: 130, atk: 19, spd: 4.8, attack: 'charge', about: 'A huge office stapler that walks on staple legs. Its jaw slams shut with a terrible CLACK.',
    skills: [{ name: 'Clack', kind: 'melee', power: 1.1, range: 2.4, cd: 0.9 }, { name: 'Staple Shot', kind: 'melee', power: 2, range: 4, cd: 4, stagger: 0.8, desc: 'Fires a giant staple.' }, { name: 'Steel Shell', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Closes its metal shell.' }, { name: 'Staple Storm', kind: 'aoe', power: 4.2, range: 4.5, desc: 'Staples fly everywhere.' }] },
  lanternix: { name: 'Lanternix', color: '#ff7a1a', hp: 90, atk: 18, spd: 6, attack: 'embers', about: 'A torn paper lantern with a fire burning inside and a face of flames. It floats and drips burning wax.',
    skills: [{ name: 'Flicker', kind: 'melee', power: 1, range: 2.6, cd: 0.7 }, { name: 'Wax Drip', kind: 'slow', power: 1, range: 5, cd: 5, slow: 2, desc: 'Hot wax slows the enemy.' }, { name: 'Paper Shield', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Folds its paper around itself.' }, { name: 'Lantern Blaze', kind: 'aoe', power: 4.2, range: 4.5, desc: 'Bursts into flames.' }] },
  aurorell: { name: 'Aurorell', legendary: true, color: '#bfefff', hp: 260, atk: 26, spd: 6.5, attack: 'ring', role: 'Legendary', about: 'LEGENDARY. A crystal stag with antlers of northern lights. It only appears on the mountain top on snowy nights.',
    skills: [{ name: 'Crystal Horn', kind: 'melee', power: 1.2, range: 2.8, cd: 0.8 }, { name: 'Aurora Dash', kind: 'dash', power: 2.4, range: 9, cd: 4, desc: 'Gallops through the air on light.' }, { name: 'Frost Veil', kind: 'guard', power: 0, range: 0, cd: 6, desc: 'A veil of frozen light.' }, { name: 'Northern Lights', kind: 'aoe', power: 6, range: 6, desc: 'The whole sky falls on the enemies.' }] },
  foldragon: { name: 'Foldragon', color: '#e8e2d0', hp: 300, atk: 22, spd: 4, attack: 'melee', about: 'A giant dragon folded from a thousand old maps. Count Crease built it to guard the Folded City.',
    skills: [{ name: 'Paper Claw', kind: 'melee', power: 1.2, range: 3, cd: 1 }, { name: 'Crease Wing', kind: 'dash', power: 2, range: 8, cd: 4 }, { name: 'Fold Shield', kind: 'guard', power: 0, range: 0, cd: 6 }, { name: 'Map Storm', kind: 'aoe', power: 5, range: 5 }] },
};
export const STARTERS = ['dracometal', 'metasteal', 'pinkypunch'];

// ------------------------------------------------------------------ helpers
const geo = new THREE.BoxGeometry(1, 1, 1);
const mcache = new Map();
export function mat(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!mcache.has(k)) mcache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, emissive: o.e ? new THREE.Color(o.e) : new THREE.Color(0), emissiveIntensity: o.ei ?? 1, transparent: o.op !== undefined, opacity: o.op ?? 1 }));
  return mcache.get(k);
}
export function bx(p, w, h, d, c, x, y, z, o) { const m = new THREE.Mesh(geo, c.isMaterial ? c : mat(c, o)); m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; }
function cy(p, rt, rb, h, c, x, y, z, seg = 12, o) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c, o)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; }
function tor(p, r, tube, c, x, y, z, arc = Math.PI * 2, o) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 20, arc), mat(c, o)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; }
function cone(p, r, h, c, x, y, z, seg = 6, o) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c, o)); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; }

// ---- monster detail helpers: fangs, horns, spikes, glowing cracks
const BONE = '#efe6cf', DARK = '#23262d';
const rnd = (a, b) => a + Math.random() * (b - a);
function teethRow(p, n, w, x, y, z, len, down = true, col = BONE) {
  const out = [];
  for (let i = 0; i < n; i++) { const big = i === 1 || i === n - 2; const t = cone(p, len * (big ? 0.34 : 0.24), len * (big ? 1.5 : 1), col, x - w / 2 + i * (w / Math.max(1, n - 1)), y, z, 4); t.rotation.x = down ? Math.PI : 0; out.push(t); }
  return out;
}
function horn(p, x, y, z, len, col, side, up = 1) {
  // a curved horn made of three shrinking cones that bend outward
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  let px = 0, py = 0, a = -side * 0.35;
  for (let i = 0; i < 3; i++) {
    const l = len * (0.45 - i * 0.08), r = len * (0.16 - i * 0.045);
    const m = cone(g, r, l, col, px - Math.sin(a) * l / 2, py + Math.cos(a) * l / 2 * up, 0, 6, { r: 0.4 });
    m.rotation.z = a; if (up < 0) m.rotation.z = Math.PI - a;
    px += -Math.sin(a) * l * 0.9; py += Math.cos(a) * l * 0.9 * up; a -= side * 0.45;
  }
  return g;
}
function spikePlane(p, n, R, len, col, from = 0, to = Math.PI * 2, skip) {
  // spikes radiating in the XY plane of p (a ring, a dial, a wheel)
  for (let i = 0; i < n; i++) { const a = from + (to - from) * (i + 0.5) / n; if (skip && skip(a)) continue; const s = cone(p, len * 0.28, len, col, Math.cos(a) * (R + len * 0.4), Math.sin(a) * (R + len * 0.4), 0, 5, { m: 0.3, r: 0.4 }); s.rotation.z = a - Math.PI / 2; }
}
function crack(p, w, h, x, y, z, rz, col = '#ff4a1a') { const m = bx(p, w, h, 0.02, mat(col, { e: col, ei: 2.2 }), x, y, z); m.rotation.z = rz; m.castShadow = false; return m; }
function claws(p, x, y, z, s = 1, col = BONE) { for (let i = -1; i <= 1; i++) { const c = cone(p, 0.035 * s, 0.16 * s, col, x + i * 0.06 * s, y, z + 0.08 * s, 4); c.rotation.x = Math.PI / 2 + 0.5; } }

// faces: mood = happy | angry | sad ; style = eyes | dragon | cyclops | water
// Monster faces: dark eye sockets, glowing slit-pupil eyes, heavy brows, jagged fanged mouths, scars when angry.
const faceCache = new Map();
export function faceTex(mood, style = 'eyes', glow = '#ffb020') {
  const k = mood + style + glow;
  if (faceCache.has(k)) return faceCache.get(k);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'); c.scale(2, 2);
  const ink = '#120a06';
  const eyeCol = mood === 'angry' ? '#ff2a14' : mood === 'sad' ? '#8fd8ff' : style === 'water' ? '#3ae0ff' : glow;
  const eye = (x, y, w, h, sd) => {
    const gr = c.createRadialGradient(x, y, 2, x, y, w * 1.7); gr.addColorStop(0, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, w * 1.7, 0, 7); c.fill();
    const tilt = mood === 'angry' ? -sd * 0.38 : mood === 'sad' ? sd * 0.3 : -sd * 0.18;
    c.save(); c.translate(x, y); c.rotate(tilt);
    c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, -h * 1.5, w, 0); c.quadraticCurveTo(0, h * 1.1, -w, 0); c.closePath();
    c.fillStyle = eyeCol; c.shadowColor = eyeCol; c.shadowBlur = 16; c.fill(); c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,215,.6)'; c.beginPath(); c.ellipse(0, -h * 0.1, w * 0.42, h * 0.4, 0, 0, 7); c.fill();
    c.fillStyle = ink; c.beginPath(); c.ellipse(0, -h * 0.1, w * 0.13, h * 0.95, 0, 0, 7); c.fill();
    c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.moveTo(-w - 2, 1); c.quadraticCurveTo(0, -h * 1.55, w + 2, 1); c.stroke();
    c.restore();
    // heavy brow slab (inner end = toward the face centre)
    const by = y - h - 7, ix = x - sd * w * 1.1, ox = x + sd * w * 1.3;
    const iy = mood === 'angry' ? by + 8 : mood === 'sad' ? by - 6 : by + 3, oy = mood === 'angry' ? by - 7 : mood === 'sad' ? by + 4 : by - 3;
    c.fillStyle = ink; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ix, iy); c.lineTo(ix, iy + 6); c.lineTo(ox, oy + 4); c.closePath(); c.fill();
    if (mood === 'sad') { c.fillStyle = 'rgba(40,10,60,.85)'; c.beginPath(); c.moveTo(x - 3, y + h); c.quadraticCurveTo(x, y + h + 18, x + 3, y + h); c.fill(); }
  };
  const maw = (y, wide) => {
    // u in [-1,1]; mouth outline = top/bottom curves + mood bend
    const sh = mood === 'happy' ? { a: 2, b: 11, bend: -11 } : mood === 'angry' ? { a: 8, b: 16, bend: 0 } : { a: 2, b: 7, bend: 9 };
    const T = (u) => y - sh.a * (1 - u * u) + sh.bend * u * u, B = (u) => y + sh.b * (1 - u * u) + sh.bend * u * u;
    c.fillStyle = '#2a0408'; c.beginPath();
    for (let i = 0; i <= 20; i++) { const u = -1 + i / 10; c.lineTo(64 + u * wide, T(u)); }
    for (let i = 20; i >= 0; i--) { const u = -1 + i / 10; c.lineTo(64 + u * wide, B(u)); }
    c.closePath(); c.fill();
    c.fillStyle = '#6a0d16'; c.beginPath(); c.ellipse(64, (T(0) + B(0)) / 2 + 3, wide * 0.4, (sh.b) * 0.35, 0, 0, 7); c.fill();
    c.fillStyle = BONE;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const u0 = -0.92 + i * (1.84 / n), u1 = u0 + 1.84 / n, um = (u0 + u1) / 2, fang = i === 1 || i === n - 2;
      const L = (fang ? 1.9 : 1) * Math.min(7, (B(um) - T(um)) * 0.55 + 2);
      c.beginPath(); c.moveTo(64 + u0 * wide, T(u0)); c.lineTo(64 + u1 * wide, T(u1)); c.lineTo(64 + um * wide, T(um) + L); c.closePath(); c.fill();
      if (i % 2 === 0) { const Lb = Math.min(5, (B(um) - T(um)) * 0.4 + 1.5); c.beginPath(); c.moveTo(64 + u0 * wide, B(u0)); c.lineTo(64 + u1 * wide, B(u1)); c.lineTo(64 + um * wide, B(um) - Lb); c.closePath(); c.fill(); }
    }
    c.strokeStyle = ink; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= 20; i++) { const u = -1 + i / 10; c.lineTo(64 + u * wide, T(u)); }
    for (let i = 20; i >= 0; i--) { const u = -1 + i / 10; c.lineTo(64 + u * wide, B(u)); }
    c.closePath(); c.stroke();
    if (mood === 'angry') { c.fillStyle = 'rgba(170,255,140,.75)'; for (const u of [-0.45, 0.3]) { const xx = 64 + u * wide; c.beginPath(); c.moveTo(xx - 2, B(u)); c.quadraticCurveTo(xx, B(u) + 16, xx + 2, B(u)); c.fill(); } }
  };
  const scar = () => { c.strokeStyle = '#3a0a10'; c.lineWidth = 3; c.beginPath(); c.moveTo(30, 28); c.lineTo(58, 78); c.stroke(); c.lineWidth = 2; for (let i = 0; i < 4; i++) { const t = 0.15 + i * 0.22, x = 30 + 28 * t, y = 28 + 50 * t; c.beginPath(); c.moveTo(x - 5, y + 2); c.lineTo(x + 5, y - 2); c.stroke(); } };
  if (style === 'dragon') {
    c.fillStyle = '#14181f'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill();
    c.fillStyle = '#ffcf6a'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; c.fillRect(64 + Math.cos(a) * 55 - 2, 64 + Math.sin(a) * 55 - 2, 4, 4); }
    eye(40, 50, 15, 8, -1); eye(88, 50, 15, 8, 1);
    c.fillStyle = '#3a404c'; c.beginPath(); c.ellipse(64, 74, 20, 10, 0, 0, 7); c.fill();
    c.fillStyle = mood === 'angry' ? '#ff5a1a' : '#ffb020'; c.shadowColor = c.fillStyle; c.shadowBlur = 8; c.beginPath(); c.ellipse(56, 73, 3, 4, 0.5, 0, 7); c.ellipse(72, 73, 3, 4, -0.5, 0, 7); c.fill(); c.shadowBlur = 0;
    maw(94, 30);
  } else if (style === 'cyclops') {
    const gr = c.createRadialGradient(64, 56, 4, 64, 56, 44); gr.addColorStop(0, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.beginPath(); c.arc(64, 56, 44, 0, 7); c.fill();
    c.fillStyle = '#fff4e8'; c.strokeStyle = ink; c.lineWidth = 4; c.beginPath(); c.ellipse(64, 56, 30, mood === 'angry' ? 17 : 23, 0, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = '#d8203a'; c.lineWidth = 1.6; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; c.beginPath(); c.moveTo(64 + Math.cos(a) * 28, 56 + Math.sin(a) * 18); c.quadraticCurveTo(64 + Math.cos(a + 0.3) * 20, 56 + Math.sin(a + 0.3) * 13, 64 + Math.cos(a) * 15, 56 + Math.sin(a) * 10); c.stroke(); }
    c.fillStyle = eyeCol; c.shadowColor = eyeCol; c.shadowBlur = 16; c.beginPath(); c.arc(64, 57, 14, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = ink; c.beginPath(); c.ellipse(64, 57, 3.5, 12, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(58, 51, 3, 0, 7); c.fill();
    c.fillStyle = ink; c.beginPath(); if (mood === 'sad') { c.moveTo(36, 30); c.lineTo(92, 22); c.lineTo(92, 28); c.lineTo(36, 36); } else { c.moveTo(34, 22); c.lineTo(64, 34); c.lineTo(94, 22); c.lineTo(94, 29); c.lineTo(64, 40); c.lineTo(34, 29); } c.fill();
    maw(102, 26);
  } else {
    eye(42, 54, 14, 9, -1); eye(86, 54, 14, 9, 1);
    maw(94, 30);
  }
  if (mood === 'angry') scar();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  faceCache.set(k, t); return t;
}
function face(p, tex, w, h, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.position.set(x, y, z); m.rotation.y = ry; p.add(m); return m;
}
// a glowing fold fragment stuck in a corrupted creature
export function foldShard(p, y = 1) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: '#a8f0ff', emissive: '#3ad0ff', emissiveIntensity: 1.6, transparent: true, opacity: 0.85 }));
  s.position.set(0.2, y, 0.25); s.rotation.set(0.6, 0.6, 0); s.userData.shard = true; p.add(s); return s;
}

// ------------------------------------------------------------------ models
const METAL = { m: 0.35, r: 0.35 };
const BUILD = {
  dracometal(mood, big = false) {
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const dialY = big ? 2.0 : 0.85, R = big ? 0.62 : 0.48;
    const links = [];
    const nLinks = big ? 14 : 9;
    for (let i = 0; i < nLinks; i++) {
      const a = Math.PI * 0.62 + i / (nLinks - 1) * Math.PI * 1.76;
      const lk = tor(root, 0.09 * (big ? 1.4 : 1), 0.025 * (big ? 1.4 : 1), '#3a3f48', Math.cos(a) * R * 1.35, dialY + Math.sin(a) * R * 1.35, -0.05, Math.PI * 2, METAL);
      lk.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, a); links.push(lk);
      if (i % 2 === 0) { const sp = cone(root, 0.035, 0.16, '#1c1f25', Math.cos(a) * R * 1.55, dialY + Math.sin(a) * R * 1.55, -0.05, 4, METAL); sp.rotation.z = a - Math.PI / 2; }
    }
    if (big) for (const s of [-1, 1]) { for (let k = 0; k < 6; k++) { const lk = tor(root, 0.12, 0.035, '#2e323a', s * 0.35, 0.2 + k * 0.26, 0, Math.PI * 2, METAL); lk.rotation.y = k % 2 ? Math.PI / 2 : 0; links.push(lk); } claws(root, s * 0.35, 0.06, 0.05, 1.4); }
    else for (const s of [-1, 1]) { const f = tor(root, 0.1, 0.03, '#2e323a', s * 0.22, 0.12, 0, Math.PI * 2, METAL); f.rotation.x = Math.PI / 2; claws(root, s * 0.22, 0.05, 0.02, 0.9); }
    const dial = new THREE.Group(); dial.position.y = dialY; root.add(dial);
    const body = cy(dial, R, R, 0.2, '#555c68', 0, 0, 0, 24, METAL); body.rotation.x = Math.PI / 2;
    tor(dial, R, 0.06, '#c9ced8', 0, 0, 0.1, Math.PI * 2, METAL);
    face(dial, faceTex(mood, 'dragon', '#ffb020'), R * 1.9, R * 1.9, 0, 0, 0.115);
    // crown of long dark spikes around the bezel, tipped red
    spikePlane(dial, big ? 14 : 10, R + 0.04, big ? 0.42 : 0.3, '#1c1f25', 0.2, Math.PI - 0.2);
    spikePlane(dial, 6, R + 0.04, big ? 0.26 : 0.18, '#1c1f25', Math.PI + 0.5, Math.PI * 2 - 0.5);
    // curved dragon horns and two iron fangs hanging under the dial
    for (const s of [-1, 1]) { horn(dial, s * R * 0.62, R * 0.72, 0.02, big ? 1.0 : 0.62, '#8a1e18', s); const f = cone(dial, 0.05, big ? 0.32 : 0.22, BONE, s * R * 0.32, -R - 0.06, 0.1, 4); f.rotation.x = Math.PI; }
    crack(dial, 0.03, R * 0.5, -R * 0.75, -R * 0.2, 0.12, 0.5);
    // clock hands (spin when charging)
    const hands = new THREE.Group(); hands.position.z = 0.13; dial.add(hands);
    bx(hands, 0.03, R * 0.75, 0.01, '#ffcf6a', 0, R * 0.3, 0, { e: '#ffb020', ei: 0.8 });
    bx(hands, 0.03, R * 0.5, 0.01, '#ffcf6a', 0.12, 0.08, 0, { e: '#ffb020', ei: 0.8 }).rotation.z = -1.2;
    g.userData.anim = (t, st) => {
      dial.position.y = dialY + Math.sin(t * 3) * 0.04 + (st.hop ? Math.abs(Math.sin(t * 10)) * 0.15 : 0);
      hands.rotation.z = -t * (st.charging ? 12 : 1);
      links.forEach((l, i) => l.position.z = -0.05 + Math.sin(t * 4 + i) * 0.03);
      if (st.attack) dial.rotation.z = Math.sin(t * 30) * 0.15; else dial.rotation.z *= 0.9;
    };
    return g;
  },
  metasteal(mood, big = false) {
    // two bladed metal arch-legs crossing under a flat round head; flying mode turns them into an X
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const R = big ? 0.5 : 0.42, H = big ? 1.25 : R + 0.08;
    const legs = [];
    for (let i = 0; i < 2; i++) {
      const piv = new THREE.Group(); piv.position.y = big ? H - 0.1 : 0; root.add(piv);
      if (big) {
        const s = i ? 1 : -1;
        for (let k = 0; k < 4; k++) {
          const p = bx(piv, 0.42, 0.2, 0.5 - k * 0.06, k % 2 ? '#c4d8ec' : '#8fb0d0', s * (0.36 + k * 0.32), 0.15 + k * 0.2, -k * 0.05, METAL);
          p.rotation.z = s * 0.5;
          const sp = cone(piv, 0.06, 0.34, '#1c2430', s * (0.36 + k * 0.32 + 0.2), 0.0 + k * 0.2, -k * 0.05, 4, METAL); sp.rotation.z = s * 2.4;
        }
        bx(piv, 0.08, 0.08, 0.5, '#4a6a88', s * 0.2, 0.05, 0, METAL);
        crack(piv, 0.9, 0.03, s * 0.75, 0.32, 0.26, s * 0.5, '#4ad8ff');
      } else {
        const arc = tor(piv, R, 0.065, '#b4cce4', 0, 0, 0, Math.PI, METAL);
        arc.rotation.y = i ? Math.PI / 2 : 0;
        spikePlane(arc, 7, R, 0.16, '#1c2430', 0.25, Math.PI - 0.25);   // saw-blade edge
        for (const e of [-1, 1]) { const f = bx(piv, 0.14, 0.05, 0.14, '#4a6a88', 0, 0.02, 0, METAL); if (i) f.position.z = e * R; else f.position.x = e * R; }
      }
      legs.push(piv);
    }
    const head = new THREE.Group(); head.position.y = H; root.add(head);
    cy(head, 0.34, 0.37, 0.12, '#d8e2ee', 0, 0, 0, 24, METAL);
    cy(head, 0.22, 0.28, 0.06, '#7f98b0', 0, 0.08, 0, 24, METAL);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < 0.45) continue; const s = cone(head, 0.04, 0.16, '#1c2430', Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4, 4, METAL); s.rotation.z = -Math.PI / 2; s.rotation.y = -a; }
    for (const s of [-1, 1]) { const ant = cone(head, 0.03, 0.34, '#1c2430', s * 0.14, 0.26, -0.05, 4, METAL); ant.rotation.z = -s * 0.35; }
    face(head, faceTex(mood, 'eyes', '#4ad8ff'), 0.5, 0.36, 0, 0.0, 0.375);
    g.userData.anim = (t, st) => {
      const fly = st.fly || big;
      root.position.y = fly ? 0.7 + Math.sin(t * 3) * 0.12 : Math.abs(Math.sin(t * (st.moving ? 9 : 2))) * (st.moving ? 0.1 : 0.02);
      legs.forEach((l, i) => {
        if (big) { l.rotation.z = Math.sin(t * 7) * 0.3 * (i ? 1 : -1); return; }
        const tx = fly ? Math.PI / 2 : 0, ty = fly ? (i ? 0.785 : -0.785) : 0;
        l.rotation.x += (tx - l.rotation.x) * 0.15; l.rotation.y += (ty - l.rotation.y) * 0.15;
        l.position.y += ((fly ? H - 0.05 : 0) - l.position.y) * 0.15;
      });
      head.rotation.y = st.attack ? t * 20 : Math.sin(t * 1.5) * 0.3;
    };
    return g;
  },
  pinkypunch(mood, big = false) {
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const head = new THREE.Group(); head.position.y = big ? 1.25 : 0.95; root.add(head);
    const tri = cy(head, 0.02, 0.62, 0.9, '#5a1838', 0, 0, 0, 3, METAL); tri.rotation.y = Math.PI / 6;
    cy(head, 0.02, 0.5, 0.75, '#e0408a', 0, 0.02, 0.06, 3).rotation.y = Math.PI / 6;
    face(head, faceTex(mood, 'cyclops', '#ff3ad6'), 0.52, 0.52, 0, -0.05, 0.3);
    for (const s of [-1, 1]) { horn(head, s * 0.3, 0.05, 0, big ? 0.8 : 0.6, '#1c1f25', s); crack(head, 0.025, 0.3, s * 0.2, 0.18, 0.27, s * 0.4, '#ff3ad6'); }
    const arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(s * 0.38, big ? 1.0 : 0.7, 0); root.add(sh);
      for (let k = 0; k < 3; k++) cy(sh, 0.06, 0.06, 0.18, '#3a3f48', s * 0.06 * k, -0.12 - k * 0.16, 0.05 * k, 8, METAL);
      const elbow = cone(sh, 0.04, 0.2, '#1c1f25', s * 0.14, -0.3, -0.02, 4, METAL); elbow.rotation.z = -s * 1.4;
      const glove = new THREE.Group(); glove.position.set(s * 0.18, -0.62, 0.15); sh.add(glove);
      bx(glove, 0.38, 0.34, 0.42, '#e0408a', 0, 0, 0); bx(glove, 0.14, 0.18, 0.18, '#e0408a', s * 0.2, 0.06, 0.1); bx(glove, 0.4, 0.08, 0.44, '#2a2e36', 0, 0.18, 0, METAL);
      for (const [x, y] of [[-0.1, 0.06], [0.1, 0.06], [0, -0.08]]) { const st = cone(glove, 0.045, 0.16, '#d8dde6', x, y, 0.26, 4, METAL); st.rotation.x = Math.PI / 2; }
      arms.push(sh);
    }
    const tents = [];
    if (big) for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, piv = new THREE.Group(); piv.position.set(Math.cos(a) * 0.35, 1.1, Math.sin(a) * 0.35 - 0.1); root.add(piv);
      for (let k = 0; k < 5; k++) bx(piv, 0.12 - k * 0.012, 0.18, 0.12 - k * 0.012, k % 2 ? '#2a2e36' : '#e0408a', Math.cos(a) * k * 0.13, -k * 0.12, Math.sin(a) * k * 0.13, k % 2 ? METAL : undefined);
      const hook = cone(piv, 0.05, 0.2, BONE, Math.cos(a) * 0.68, -0.66, Math.sin(a) * 0.68, 4); hook.rotation.x = Math.PI;
      tents.push(piv);
    }
    g.userData.anim = (t, st) => {
      root.position.y = st.moving ? Math.abs(Math.sin(t * 8)) * 0.25 : Math.sin(t * 2) * 0.03;
      arms.forEach((a, i) => { a.rotation.x = st.attack ? -1.4 + Math.sin(t * 25 + i * Math.PI) * 0.9 : st.guard ? -1.2 : Math.sin(t * 2 + i) * 0.15; a.rotation.z = st.guard ? (i ? -0.6 : 0.6) : 0; });
      tents.forEach((p, i) => { p.rotation.z = Math.sin(t * 3 + i) * 0.5; p.rotation.x = Math.cos(t * 2.5 + i) * 0.4; });
      head.rotation.z = st.celebrate ? Math.sin(t * 12) * 0.25 : 0;
    };
    return g;
  },
  skipclip(mood) {
    // a big wooden clothes-peg with a metal spring; it snaps like a toothy mouth
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    bx(root, 0.3, 0.14, 1.1, '#8a6236', 0, 0.22, 0);
    const jaw = new THREE.Group(); jaw.position.set(0, 0.3, -0.1); root.add(jaw);
    bx(jaw, 0.3, 0.14, 1.1, '#b5864a', 0, 0.08, 0.1);
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = 0.15 + i * 0.11; const t1 = cone(jaw, 0.03, 0.1, BONE, s * 0.12, -0.03, z, 4); t1.rotation.x = Math.PI; cone(root, 0.03, 0.09, BONE, s * 0.12, 0.33, z - 0.1, 4); }
    const spring = tor(root, 0.13, 0.045, '#8a949e', 0, 0.3, -0.12, Math.PI * 2, METAL); spring.rotation.y = Math.PI / 2;
    for (let i = 0; i < 3; i++) { const sp = cone(jaw, 0.04, 0.16, '#3a2410', 0, 0.2, -0.3 + i * 0.25, 4); sp.rotation.x = -0.4; }
    face(jaw, faceTex(mood, 'eyes', '#ffd34d'), 0.3, 0.24, 0, 0.09, 0.66);
    for (const z of [-0.35, 0.3]) for (const x of [-0.12, 0.12]) { bx(root, 0.06, 0.16, 0.06, '#3a2410', x, 0.08, z); claws(root, x, 0.0, z, 0.6); }
    g.userData.anim = (t, st) => {
      root.position.y = Math.abs(Math.sin(t * (st.moving ? 7 : 2))) * (st.moving ? 0.5 : 0.06);
      jaw.rotation.x = st.attack ? -0.5 + Math.sin(t * 20) * 0.35 : -0.18 + Math.sin(t * 3) * 0.08;
    };
    return g;
  },
  rootlock(mood, big = false) {
    // cracked stone padlock with a thorny root shackle; glowing seams inside the stone
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const k = big ? 2.4 : 1, glow = big ? '#3ad0ff' : '#ff7a2a';
    bx(root, 1.0 * k, 0.9 * k, 0.55 * k, '#6f6a62', 0, 0.55 * k, 0);
    bx(root, 0.9 * k, 0.12 * k, 0.5 * k, '#55504a', 0, 0.98 * k, 0);
    for (const [x, y, w, h, r] of [[-0.36, 0.78, 0.03, 0.32, 0.4], [0.38, 0.42, 0.03, 0.36, -0.5], [-0.3, 0.3, 0.025, 0.22, -0.9], [0.3, 0.86, 0.025, 0.2, 1.1]]) crack(root, w * k, h * k, x * k, y * k, 0.281 * k, r, glow);
    const shackle = tor(root, 0.38 * k, 0.09 * k, '#4a2e18', 0, 1.0 * k, 0, Math.PI);
    spikePlane(shackle, 7, 0.38 * k + 0.06 * k, 0.16 * k, '#2a1a0c', 0.2, Math.PI - 0.2);
    for (const s of [-1, 1]) horn(root, s * 0.42 * k, 1.0 * k, 0, 0.55 * k, '#3a2410', s);
    for (let i = 0; i < 5; i++) { const lf = bx(root, 0.12 * k, 0.06 * k, 0.12 * k, '#3f7a34', -0.3 * k + i * 0.15 * k, 1.05 * k + Math.sin(i) * 0.25 * k, 0.05 * k); lf.rotation.z = i; }
    face(root, faceTex(mood, 'eyes', glow), 0.82 * k, 0.66 * k, 0, 0.62 * k, 0.28 * k);
    teethRow(root, 6, 0.5 * k, 0, 0.3 * k, 0.29 * k, 0.12 * k, true, '#d8d2c0');
    // root tendrils with thorns hanging from the sides
    const tendrils = [];
    for (const s of [-1, 1]) { const tp = new THREE.Group(); tp.position.set(s * 0.52 * k, 0.75 * k, 0); root.add(tp); for (let j = 0; j < 4; j++) { bx(tp, 0.09 * k, 0.16 * k, 0.09 * k, '#4a2e18', s * j * 0.05 * k, -j * 0.15 * k, 0); const th = cone(tp, 0.025 * k, 0.09 * k, '#2a1a0c', s * (j * 0.05 + 0.06) * k, -j * 0.15 * k, 0, 4); th.rotation.z = -s * Math.PI / 2; } claws(tp, s * 0.18 * k, -0.62 * k, 0, 0.9 * k); tendrils.push(tp); }
    const feet = [bx(root, 0.3 * k, 0.16 * k, 0.4 * k, '#55504a', -0.28 * k, 0.08 * k, 0), bx(root, 0.3 * k, 0.16 * k, 0.4 * k, '#55504a', 0.28 * k, 0.08 * k, 0)];
    g.userData.anim = (t, st) => {
      root.rotation.z = st.moving ? Math.sin(t * 5) * 0.08 : 0;
      feet[0].position.y = 0.08 * k + (st.moving ? Math.max(0, Math.sin(t * 5)) * 0.1 * k : 0); feet[1].position.y = 0.08 * k + (st.moving ? Math.max(0, -Math.sin(t * 5)) * 0.1 * k : 0);
      root.position.y = st.attack ? Math.abs(Math.sin(t * 6)) * 0.3 * k : 0;
      tendrils.forEach((tp, i) => tp.rotation.z = Math.sin(t * 2 + i * 2) * 0.25 + (st.attack ? (i ? -0.8 : 0.8) : 0));
    };
    return g;
  },
  rivolo(mood) {
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 0.75; g.add(root);
    const wheel = new THREE.Group(); root.add(wheel);
    tor(wheel, 0.45, 0.08, '#8a5a24', 0, 0, 0, Math.PI * 2, METAL);
    spikePlane(wheel, 12, 0.5, 0.18, '#3a2a14');      // saw-tooth valve wheel
    for (let i = 0; i < 4; i++) { const sp = bx(wheel, 0.06, 0.9, 0.06, '#6a4a1e', 0, 0, 0, METAL); sp.rotation.z = i * Math.PI / 4; }
    const water = cy(root, 0.26, 0.26, 0.1, '#1d5f9a', 0, 0, 0.02, 20, { op: 0.9, e: '#0a3a70', ei: 0.5 }); water.rotation.x = Math.PI / 2;
    face(root, faceTex(mood, 'water'), 0.5, 0.5, 0, 0, 0.09);
    for (const x of [-0.25, 0.1, 0.3]) crack(root, 0.03, 0.18, x, -0.42, 0.06, 0, '#3ae0ff');
    bx(g, 0.2, 0.3, 0.2, '#3a2a14', 0, 0.15, 0); claws(g, 0, 0.02, 0.05, 1.1);
    g.userData.anim = (t, st) => { wheel.rotation.z = t * (st.moving ? 4 : 1); root.position.y = 0.75 + Math.sin(t * 3) * 0.04; };
    return g;
  },
  mossroll(mood) {
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 0.48; g.add(root);
    const sp = cy(root, 0.42, 0.42, 0.7, '#2f6a2a', 0, 0, 0, 16); sp.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const e = cy(root, 0.5, 0.5, 0.08, '#4a2e18', s * 0.38, 0, 0, 16); e.rotation.z = Math.PI / 2; }
    // thorns all around the spool (leaving the face clear)
    for (const x of [-0.22, 0, 0.22]) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + x; if (a > 1.0 && a < 2.1) continue; const th = cone(root, 0.04, 0.18, '#1c2a14', x, Math.cos(a) * 0.48, Math.sin(a) * 0.48, 4); th.rotation.x = a; }
    for (let i = 0; i < 5; i++) { const v = bx(root, 0.04, 0.28, 0.04, '#3f7a34', -0.3 + i * 0.15, -0.5, 0.3 - (i % 2) * 0.5); v.rotation.x = 0.2; }
    face(root, faceTex(mood, 'eyes', '#b4ff3a'), 0.56, 0.46, 0, 0.02, 0.43);
    g.userData.anim = (t, st) => { root.position.y = 0.48 + Math.abs(Math.sin(t * (st.moving ? 8 : 2))) * 0.08; };
    return g;
  },
  glimframe(mood) {
    // a haunted floating frame: shattered glass, splinters and a cluster of glowing eyes
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 1.15; g.add(root);
    const wood = '#7a5a24';
    bx(root, 0.9, 0.1, 0.1, wood, 0, 0.45, 0); bx(root, 0.9, 0.1, 0.1, wood, 0, -0.45, 0); bx(root, 0.1, 1.0, 0.1, wood, -0.45, 0, 0); bx(root, 0.1, 1.0, 0.1, wood, 0.45, 0, 0);
    for (const [x, y] of [[-0.45, 0.45], [0.45, 0.45], [-0.45, -0.45], [0.45, -0.45]]) { const s = cone(root, 0.05, 0.26, '#2a1a0c', x * 1.15, y * 1.15, 0, 4); s.rotation.z = Math.atan2(y, x) - Math.PI / 2; }
    bx(root, 0.8, 0.8, 0.02, '#1a2a3a', 0, 0, -0.01, { op: 0.6 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + 0.3; const sh = cone(root, 0.06, 0.32, '#bfe8ff', Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.02, 3, { op: 0.6, e: '#4a8aff', ei: 0.4 }); sh.rotation.z = a - Math.PI / 2; sh.scale.z = 0.2; }
    const eyeC = mood === 'angry' ? '#ff4a1a' : mood === 'sad' ? '#8fd8ff' : '#ffe08a';
    const eyes = [];
    for (const [x, y, r] of [[-0.18, 0.1, 0.1], [0.18, 0.1, 0.1], [0, -0.12, 0.07], [-0.26, -0.22, 0.05], [0.28, -0.2, 0.05], [0.05, 0.3, 0.05]]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(eyeC, { e: eyeC, ei: 2.2 })); e.position.set(x, y, 0.06); root.add(e);
      const pupil = bx(root, r * 0.3, r * 1.6, 0.02, '#0a0604', x, y, 0.06 + r); eyes.push(e, pupil);
    }
    g.userData.anim = (t) => { root.position.y = 1.15 + Math.sin(t * 2) * 0.12; root.rotation.y = Math.sin(t) * 0.3; root.rotation.z = Math.sin(t * 7) * 0.03; eyes.forEach((e, i) => { if (i % 2 === 0) e.scale.setScalar(1 + Math.sin(t * 5 + i) * 0.15); }); };
    return g;
  },
  bellbud(mood) {
    // a dark bell rising from a crown of jagged flytrap leaves, with a tongue clapper and teeth on the rim
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const leaves = [];
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; const lf = new THREE.Group(); lf.position.set(Math.cos(a) * 0.22, 0.1, Math.sin(a) * 0.22); lf.rotation.y = -a + Math.PI / 2; root.add(lf); bx(lf, 0.16, 0.05, 0.42, '#2f6a2a', 0, 0, 0.18); for (let j = 0; j < 3; j++) for (const s of [-1, 1]) { const th = cone(lf, 0.02, 0.09, BONE, s * 0.09, 0.03, 0.06 + j * 0.12, 3); th.rotation.z = -s * 0.6; } lf.rotation.x = -0.5; leaves.push(lf); }
    const bell = new THREE.Group(); bell.position.y = 0.35; root.add(bell);
    cy(bell, 0.18, 0.36, 0.5, '#8a6a1a', 0, 0.25, 0, 16, { m: 0.6, r: 0.3 });
    cy(bell, 0.36, 0.4, 0.06, '#5a4410', 0, 0.02, 0, 16, { m: 0.6 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; const t1 = cone(bell, 0.035, 0.12, BONE, Math.cos(a) * 0.37, -0.04, Math.sin(a) * 0.37, 4); t1.rotation.x = Math.PI; }
    const clap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat('#a01830', { e: '#600010', ei: 0.6 })); clap.position.y = -0.06; bell.add(clap);
    horn(bell, 0, 0.5, 0, 0.35, '#3a2410', 1);
    face(bell, faceTex(mood, 'eyes', '#ffd34d'), 0.38, 0.3, 0, 0.28, 0.3);
    g.userData.anim = (t, st) => { bell.rotation.z = Math.sin(t * (st.attack ? 18 : 3)) * (st.attack ? 0.35 : 0.08); leaves.forEach((l, i) => l.rotation.x = -0.5 + Math.sin(t * 3 + i) * 0.12 + (st.attack ? -0.4 : 0)); };
    return g;
  },
  emberlid(mood) {
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 0.55; g.add(root);
    const ring = tor(root, 0.42, 0.1, '#ff5a1a', 0, 0, 0, Math.PI * 2, { e: '#ff3a00', ei: 1.8 });
    const lid = new THREE.Group(); root.add(lid);
    const d = cy(lid, 0.4, 0.4, 0.1, '#3a3d44', 0, 0, 0.05, 20, METAL); d.rotation.x = Math.PI / 2;
    spikePlane(lid, 10, 0.42, 0.2, '#1c1f25', 0, Math.PI * 2);
    cy(lid, 0.08, 0.08, 0.14, '#1c1f25', 0, 0, 0.15, 10, METAL).rotation.x = Math.PI / 2;
    for (const [x, y, r] of [[-0.25, 0.18, 0.6], [0.22, -0.28, -0.4], [0.3, 0.2, 1.2]]) crack(lid, 0.03, 0.2, x, y, 0.105, r, '#ff7a1a');
    face(lid, faceTex(mood, 'eyes', '#ff9a1a'), 0.5, 0.4, 0, -0.04, 0.11);
    g.userData.anim = (t, st) => { ring.rotation.z = -t * (st.moving ? 8 : 1); root.position.y = 0.55 + Math.sin(t * 3) * 0.03; ring.material.emissiveIntensity = 1.5 + Math.sin(t * 6) * 0.5; };
    return g;
  },
  hingemaw(mood) {
    // a ruined door turned into a jaw: rusty hinge at the back, crooked nail teeth, glowing eyes in the gap
    const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
    const plank = (p, y, col) => { for (let i = 0; i < 4; i++) bx(p, 0.24, 0.14, 1.4, i % 2 ? col : '#5a3418', -0.36 + i * 0.24, y, 0.2); };
    plank(root, 0.5, '#6a4020');
    const jaw = new THREE.Group(); jaw.position.set(0, 0.6, -0.45); root.add(jaw);
    plank(jaw, 0.08, '#7a4a2a');
    for (const x of [-0.42, 0.42]) { const h = cy(root, 0.09, 0.09, 0.3, '#5a3a24', x, 0.6, -0.5, 10, METAL); h.rotation.z = Math.PI / 2; }
    cy(root, 0.05, 0.05, 1.0, '#3a2a1c', 0, 0.6, -0.5, 8, METAL).rotation.z = Math.PI / 2;
    for (let i = 0; i < 7; i++) { const x = -0.42 + i * 0.14; const t1 = cone(jaw, 0.035, 0.18 + (i % 3) * 0.05, '#9aa0a8', x, 0.0, 0.85 - (i % 2) * 0.1, 4, METAL); t1.rotation.x = Math.PI; t1.rotation.z = (i % 2 ? 0.25 : -0.2); const t2 = cone(root, 0.035, 0.16, '#9aa0a8', x + 0.07, 0.62, 0.8 - (i % 2) * 0.08, 4, METAL); t2.rotation.z = (i % 2 ? -0.2 : 0.2); }
    for (let i = 0; i < 4; i++) { const s = cone(jaw, 0.05, 0.22, '#2a1a0c', -0.3 + i * 0.2, 0.3, 0.1 + (i % 2) * 0.3, 4); s.rotation.x = -0.3; }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#b08a2a', { m: 0.7, r: 0.3 })); knob.position.set(0.4, 0.2, 0.75); jaw.add(knob);
    face(root, faceTex(mood, 'eyes', '#ff7a1a'), 0.7, 0.42, 0, 0.66, 0.92);
    crack(jaw, 0.03, 0.4, -0.1, 0.16, 0.92, 0.5, '#ff5a1a');
    const legs = [];
    for (const [x, z] of [[-0.35, 0.65], [0.35, 0.65], [-0.35, -0.3], [0.35, -0.3]]) { const l = new THREE.Group(); l.position.set(x, 0.43, z); root.add(l); bx(l, 0.14, 0.4, 0.14, '#3a2410', 0, -0.2, 0); claws(l, 0, -0.4, 0.02, 0.8); legs.push(l); }
    g.userData.anim = (t, st) => {
      jaw.rotation.x = st.attack ? -0.7 + Math.sin(t * 22) * 0.45 : -0.12 + Math.sin(t * 2.5) * 0.1;
      legs.forEach((l, i) => l.rotation.x = st.moving ? Math.sin(t * 9 + i * Math.PI) * 0.6 : 0);
      root.position.y = st.moving ? Math.abs(Math.sin(t * 9)) * 0.06 : 0;
    };
    return g;
  },
  paperfang(mood) {
    // an origami wolf folded from an old map: sharp paper planes, paper fangs, glowing ink eyes
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 0.55; g.add(root);
    const paper = '#e8e2d0', shade = '#c9c0a6', ink = '#2a2a3a';
    const body = bx(root, 0.5, 0.5, 1.1, paper, 0, 0.1, 0); body.rotation.z = Math.PI / 4;
    bx(root, 0.36, 0.36, 1.12, shade, 0, 0.1, 0).rotation.z = Math.PI / 4;
    for (let i = 0; i < 5; i++) { const s = cone(root, 0.09, 0.3, paper, 0, 0.5, -0.4 + i * 0.2, 3); s.rotation.y = Math.PI / 6; }
    crack(root, 0.02, 0.9, 0.18, 0.18, 0.0, Math.PI / 2, ink).rotation.y = Math.PI / 2;
    const head = new THREE.Group(); head.position.set(0, 0.32, 0.62); root.add(head);
    const skull = cy(head, 0.02, 0.32, 0.6, paper, 0, 0, 0.18, 4); skull.rotation.x = Math.PI / 2; skull.rotation.y = Math.PI / 4;
    for (const s of [-1, 1]) { const ear = cone(head, 0.1, 0.32, paper, s * 0.16, 0.26, -0.02, 3); ear.rotation.z = -s * 0.25; }
    const jaw = new THREE.Group(); jaw.position.set(0, -0.12, 0.05); head.add(jaw);
    const lj = bx(jaw, 0.3, 0.08, 0.45, shade, 0, 0, 0.18);
    for (const s of [-1, 1]) { const f = cone(head, 0.035, 0.2, '#ffffff', s * 0.08, -0.12, 0.34, 3); f.rotation.x = Math.PI; const f2 = cone(jaw, 0.03, 0.14, '#ffffff', s * 0.07, 0.08, 0.32, 3); }
    face(head, faceTex(mood, 'eyes', '#ff2a14'), 0.46, 0.3, 0, 0.1, 0.36);
    const legs = [];
    for (const [x, z] of [[-0.18, 0.4], [0.18, 0.4], [-0.18, -0.4], [0.18, -0.4]]) { const l = new THREE.Group(); l.position.set(x, -0.1, z); root.add(l); const lg = cone(l, 0.09, 0.5, paper, 0, -0.25, 0, 3); lg.rotation.x = Math.PI; claws(l, 0, -0.5, 0.03, 0.6, ink); legs.push(l); }
    const tail = cone(root, 0.1, 0.55, paper, 0, 0.3, -0.75, 3); tail.rotation.x = -2.2;
    g.userData.anim = (t, st) => {
      legs.forEach((l, i) => l.rotation.x = st.moving ? Math.sin(t * 12 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.7 : 0);
      jaw.rotation.x = st.attack ? 0.5 + Math.sin(t * 25) * 0.3 : 0.08 + Math.sin(t * 2) * 0.05;
      head.rotation.x = st.moving ? Math.sin(t * 12) * 0.08 : Math.sin(t * 1.5) * 0.05;
      tail.rotation.y = Math.sin(t * 6) * 0.4;
      root.position.y = 0.55 + (st.moving ? Math.abs(Math.sin(t * 12)) * 0.08 : 0);
    };
    return g;
  },
  inkling(mood) {
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 0.6; g.add(root);
    cy(root, 0.38, 0.42, 0.7, '#1a1a3a', 0, 0.2, 0, 10, { r: 0.15, m: 0.2 }); cy(root, 0.2, 0.28, 0.25, '#2a2a5a', 0, 0.68, 0, 10, { r: 0.15 });
    cy(root, 0.24, 0.24, 0.12, '#6e4524', 0, 0.86, 0, 10); crack(root, 0.03, 0.5, 0.2, 0.25, 0.39, 0.5, '#7a5aff');
    face(root, faceTex(mood, 'eyes', '#7a5aff'), 0.6, 0.45, 0, 0.25, 0.43);
    const legs = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, l = new THREE.Group(); l.position.set(Math.cos(a) * 0.32, -0.15, Math.sin(a) * 0.32); root.add(l); for (let k = 0; k < 4; k++) bx(l, 0.1 - k * 0.015, 0.14, 0.1 - k * 0.015, k % 2 ? '#0e0e22' : '#22224a', Math.cos(a) * k * 0.09, -k * 0.11, Math.sin(a) * k * 0.09); legs.push(l); }
    for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat('#0a0a1a', { r: 0.1 })); d.position.set(rnd(-0.3, 0.3), -0.55, rnd(-0.3, 0.3)); root.add(d); }
    g.userData.anim = (t, st) => { legs.forEach((l, i) => { l.rotation.z = Math.sin(t * (st.moving ? 10 : 3) + i) * 0.4; }); root.position.y = 0.6 + Math.sin(t * 3) * 0.05; root.rotation.x = st.attack ? Math.sin(t * 20) * 0.2 : 0; };
    return g;
  },
  staplor(mood) {
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 0.55; g.add(root);
    bx(root, 0.6, 0.25, 1.5, '#3a3f48', 0, 0, 0, METAL);
    const jaw = new THREE.Group(); jaw.position.set(0, 0.15, -0.65); root.add(jaw);
    bx(jaw, 0.62, 0.28, 1.5, '#7a8090', 0, 0.12, 0.7, METAL); bx(jaw, 0.64, 0.06, 0.4, '#e53950', 0, 0.28, 1.1);
    for (let i = 0; i < 6; i++) { const t1 = cone(jaw, 0.04, 0.2, '#d8dde6', -0.22 + (i % 3) * 0.22, -0.06, 1.25 + Math.floor(i / 3) * 0.12, 4, METAL); t1.rotation.x = Math.PI; }
    face(root, faceTex(mood, 'eyes', '#ff2a14'), 0.55, 0.32, 0, 0.18, 0.78);
    for (let i = 0; i < 4; i++) cone(jaw, 0.06, 0.25, '#1c1f25', -0.2 + (i % 2) * 0.4, 0.38, 0.3 + Math.floor(i / 2) * 0.5, 4, METAL);
    const legs = []; for (const [x, z] of [[-0.3, 0.5], [0.3, 0.5], [-0.3, -0.5], [0.3, -0.5]]) { const l = new THREE.Group(); l.position.set(x, -0.1, z); root.add(l); bx(l, 0.06, 0.45, 0.06, '#c0c6d0', 0, -0.22, 0, METAL); bx(l, 0.06, 0.06, 0.2, '#c0c6d0', 0, -0.44, 0.08, METAL); legs.push(l); }
    g.userData.anim = (t, st) => { jaw.rotation.x = st.attack ? -0.6 + Math.sin(t * 24) * 0.45 : -0.08 + Math.sin(t * 2) * 0.05; legs.forEach((l, i) => l.rotation.x = st.moving ? Math.sin(t * 10 + i * Math.PI) * 0.5 : 0); };
    return g;
  },
  lanternix(mood) {
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 1.2; g.add(root);
    for (let i = 0; i < 6; i++) cy(root, 0.42 - Math.abs(i - 2.5) * 0.05, 0.42 - Math.abs(i - 2.5) * 0.05, 0.14, i % 2 ? '#ff8a2a' : '#e05a1a', 0, -0.35 + i * 0.14, 0, 12, { e: '#ff5a00', ei: 0.6, op: 0.92 });
    cy(root, 0.2, 0.25, 0.12, '#2a1a0c', 0, 0.5, 0, 10); cy(root, 0.2, 0.25, 0.1, '#2a1a0c', 0, -0.45, 0, 10);
    const flame = cone(root, 0.15, 0.4, '#ffd34d', 0, 0.75, 0, 6, { e: '#ff9a1a', ei: 2 });
    face(root, faceTex(mood, 'eyes', '#ffd34d'), 0.55, 0.42, 0, 0.0, 0.43);
    for (let i = 0; i < 3; i++) { const tear = bx(root, 0.2, 0.03, 0.02, '#1a0a00', rnd(-0.2, 0.2), rnd(-0.3, 0.3), 0.44); tear.rotation.z = rnd(-1, 1); }
    const drips = []; for (let i = 0; i < 4; i++) drips.push(bx(root, 0.06, 0.18, 0.06, mat('#ffcf6a', { e: '#ff7a1a', ei: 1 }), Math.cos(i * 1.6) * 0.18, -0.6, Math.sin(i * 1.6) * 0.18));
    g.userData.anim = (t, st) => { root.position.y = 1.2 + Math.sin(t * 2) * 0.15; root.rotation.z = Math.sin(t * 1.3) * 0.1; flame.scale.set(1, 1 + Math.sin(t * 12) * 0.25, 1); drips.forEach((d, i) => d.position.y = -0.6 - ((t * 0.6 + i * 0.25) % 0.5)); if (st.attack) root.rotation.y = t * 10; };
    return g;
  },
  aurorell(mood) {
    // legendary crystal stag with aurora antlers
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 1.1; g.add(root);
    const ice = mat('#cfefff', { e: '#4ad8ff', ei: 0.5, r: 0.1, m: 0.3, op: 0.92 });
    bx(root, 0.55, 0.55, 1.3, ice, 0, 0, 0); for (let i = 0; i < 5; i++) cone(root, 0.08, 0.35, '#e8fbff', 0, 0.35, -0.5 + i * 0.25, 4, { e: '#9fe8ff', ei: 1 });
    const neck = new THREE.Group(); neck.position.set(0, 0.3, 0.6); root.add(neck); bx(neck, 0.3, 0.6, 0.3, ice, 0, 0.3, 0.05).rotation.x = -0.3;
    const head = new THREE.Group(); head.position.set(0, 0.65, 0.2); neck.add(head); bx(head, 0.35, 0.35, 0.55, ice, 0, 0, 0.1);
    face(head, faceTex(mood, 'eyes', '#7affd8'), 0.4, 0.28, 0, 0.04, 0.38);
    const cols = ['#4affb0', '#4ad8ff', '#b48cff', '#ff7ad6'];
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const a = bx(head, 0.06, 0.4, 0.06, mat(cols[k], { e: cols[k], ei: 2.2 }), sd * (0.15 + k * 0.1), 0.35 + k * 0.18, -0.05 - k * 0.05); a.rotation.z = -sd * (0.3 + k * 0.15); }
    const legs = []; for (const [x, z] of [[-0.18, 0.5], [0.18, 0.5], [-0.18, -0.5], [0.18, -0.5]]) { const l = new THREE.Group(); l.position.set(x, -0.25, z); root.add(l); bx(l, 0.12, 0.8, 0.12, ice, 0, -0.4, 0); cone(l, 0.08, 0.15, '#2a4a6a', 0, -0.85, 0, 4); legs.push(l); }
    g.userData.anim = (t, st) => { legs.forEach((l, i) => l.rotation.x = st.moving ? Math.sin(t * 9 + (i % 2 ? Math.PI : 0) + (i > 1 ? 1 : 0)) * 0.6 : 0); head.rotation.x = Math.sin(t * 1.4) * 0.1; root.position.y = 1.1 + (st.moving ? Math.abs(Math.sin(t * 9)) * 0.1 : Math.sin(t * 2) * 0.03); };
    return g;
  },
  foldragon(mood) {
    // boss: a giant origami dragon made of old maps
    const g = new THREE.Group(), root = new THREE.Group(); root.position.y = 3; g.add(root); const k = 2.2;
    const paper = '#e8e2d0', shade2 = '#bfb59a', ink = '#2a2a3a';
    const b1 = bx(root, 1.2 * k, 1.2 * k, 2.4 * k, paper, 0, 0, 0); b1.rotation.z = Math.PI / 4;
    for (let i = 0; i < 7; i++) cone(root, 0.25 * k, 0.6 * k, shade2, 0, 0.9 * k, -1 + i * 0.32 * k, 3);
    const neck = new THREE.Group(); neck.position.set(0, 0.6 * k, 1.1 * k); root.add(neck);
    bx(neck, 0.5 * k, 1.4 * k, 0.5 * k, paper, 0, 0.6 * k, 0.3 * k).rotation.x = 0.5;
    const head = new THREE.Group(); head.position.set(0, 1.3 * k, 0.8 * k); neck.add(head);
    const sk = cy(head, 0.02, 0.6 * k, 1.3 * k, paper, 0, 0, 0.4 * k, 4); sk.rotation.x = Math.PI / 2; sk.rotation.y = Math.PI / 4;
    face(head, faceTex(mood, 'dragon', '#ff2a14'), 0.9 * k, 0.9 * k, 0, 0.1 * k, 0.62 * k);
    for (const s of [-1, 1]) horn(head, s * 0.35 * k, 0.4 * k, 0, 1.2 * k, ink, s);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.3 * k, 0.2 * k); head.add(jaw); bx(jaw, 0.8 * k, 0.15 * k, 1.0 * k, shade2, 0, 0, 0.4 * k);
    teethRow(jaw, 7, 0.7 * k, 0, 0.12 * k, 0.85 * k, 0.15 * k, false, '#ffffff');
    const wings = []; for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.6 * k, 0.5 * k, 0); root.add(w); for (let i = 0; i < 4; i++) { const p = bx(w, 1.4 * k, 0.05 * k, (1.2 - i * 0.2) * k, i % 2 ? paper : shade2, s * (0.7 + i * 0.9) * k, i * 0.15 * k, -i * 0.2 * k); p.rotation.z = s * 0.2; } wings.push(w); }
    for (let i = 0; i < 5; i++) crack(root, 0.03 * k, 0.8 * k, (i - 2) * 0.25 * k, 0.1 * k, 0.86 * k, 0.4 * i, ink);
    const tail = new THREE.Group(); tail.position.set(0, 0, -1.4 * k); root.add(tail); for (let i = 0; i < 5; i++) bx(tail, (0.5 - i * 0.08) * k, (0.5 - i * 0.08) * k, 0.6 * k, i % 2 ? paper : shade2, 0, -i * 0.1 * k, -i * 0.5 * k);
    for (const [x, z] of [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]]) { const l = new THREE.Group(); l.position.set(x * k, -0.5 * k, z * k); root.add(l); cone(l, 0.25 * k, 1.1 * k, paper, 0, -0.5 * k, 0, 3).rotation.x = Math.PI; claws(l, 0, -1.1 * k, 0.05, 1.6 * k, ink); }
    g.userData.anim = (t, st) => { wings.forEach((w, i) => w.rotation.z = Math.sin(t * (st.attack ? 6 : 2)) * 0.35 * (i ? -1 : 1)); jaw.rotation.x = st.attack ? 0.5 + Math.sin(t * 18) * 0.25 : 0.1; head.rotation.y = Math.sin(t * 0.8) * 0.25; tail.rotation.y = Math.sin(t * 1.5) * 0.4; root.position.y = 3 + Math.sin(t * 1.6) * 0.2; };
    return g;
  },
};
BUILD.dracotime = (mood) => BUILD.dracometal(mood, true);
BUILD.metawing = (mood) => BUILD.metasteal(mood, true);
BUILD.pinkyabsorve = (mood) => BUILD.pinkypunch(mood, true);


// ====================================================================== THE BESTIARY GENERATOR: 187 more original Monstermon
// Lore: in Virelia, everyday objects full of memories wake up as creatures. Each generated species is one haunted object
// with its own element, body plan, attack style, special ability, habitat and strength tier (1-5).
function rng32(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const ELEMS = ['fire', 'water', 'plant', 'metal', 'wind', 'stone', 'light'];
const OBJECTS = {
  fire: [['Kettle', 'a scorched kettle that screams steam'], ['Candle', 'a melted candle whose wick never stops burning'], ['Toaster', 'a toaster that shoots burning toast'], ['Match', 'a giant matchstick with a sulfur head'], ['Stove', 'an old iron stove with a fire belly'], ['Chili', 'a dried chili pepper with a temper'], ['Coal', 'a lump of coal that glows inside'], ['Iron', 'a clothes iron that brands what it touches'], ['Grill', 'a barbecue grill with a smoking grin'], ['Torch', 'a cave torch that whispers in flames'], ['Furnace', 'a tiny furnace with a hungry door']],
  water: [['Bucket', 'a dented bucket that overflows with cold water'], ['Teapot', 'a cracked teapot full of swamp tea'], ['Sponge', 'a soggy sponge that squeezes acid'], ['Umbrella', 'a broken umbrella that rains from inside'], ['Faucet', 'a rusty faucet that drips forever'], ['Bottle', 'a message bottle with a drowned message'], ['Tub', 'a bathtub with clawed feet'], ['Fishbowl', 'a fishbowl with something hungry inside'], ['Raincoat', 'an empty raincoat that walks in the rain'], ['Anchor', 'a sunken anchor covered in barnacles'], ['Snorkel', 'a snorkel that breathes bubbles of ink']],
  plant: [['Broom', 'a straw broom that sweeps people away'], ['Basket', 'a woven basket with a mouth of reeds'], ['Flowerpot', 'a flowerpot with a carnivorous flower'], ['Cork', 'a wine cork full of roots'], ['Pinecone', 'a pinecone with sharp scales'], ['Rope', 'a mossy rope that strangles branches'], ['Scarecrow', 'a scarecrow that the crows fear'], ['Carrot', 'a giant carrot with angry eyes'], ['Hay', 'a haystack that hides needles'], ['Gourd', 'a rotten gourd with a carved grin'], ['Vine', 'a garden hose taken over by vines']],
  metal: [['Spoon', 'a bent spoon that reflects nightmares'], ['Fork', 'a three-pronged fork that stabs'], ['Scissor', 'a pair of scissors that snips anything'], ['Key', 'a skeleton key that unlocks bad luck'], ['Nail', 'a bundle of crooked nails'], ['Coin', 'an old coin that bites greedy hands'], ['Bolt', 'a giant bolt with a nut for a head'], ['Wrench', 'a monkey wrench with a twisted jaw'], ['Trap', 'a rusty bear trap that snaps shut'], ['Bell', 'a cracked church bell'], ['Tin', 'a tin can robot made of leftovers']],
  wind: [['Kite', 'a torn kite that never lands'], ['Fan', 'a ceiling fan with spinning blades'], ['Paper', 'a crumpled paper that unfolds into claws'], ['Feather', 'a giant black feather'], ['Balloon', 'a popped balloon that refills with storms'], ['Windmill', 'a toy windmill that never stops'], ['Flag', 'a ragged flag with a face in the cloth'], ['Sail', 'a ship sail that lost its ship'], ['Pinwheel', 'a pinwheel that spins into a blade'], ['Newspaper', 'a newspaper full of scary headlines'], ['Chime', 'a wind chime that howls']],
  stone: [['Brick', 'a brick with a crack for a mouth'], ['Dice', 'a giant die that always rolls badly'], ['Marble', 'a glass marble with a storm inside'], ['Rook', 'a chess tower that marches alone'], ['Pebble', 'a pile of angry pebbles'], ['Statue', 'a garden statue that moves when you blink'], ['Domino', 'a domino that knocks everything down'], ['Chalk', 'a stick of chalk that draws traps'], ['Clay', 'a clay pot full of rocks'], ['Gargoyle', 'a roof gargoyle that came down'], ['Millstone', 'an old millstone that grinds']],
  light: [['Lamp', 'a desk lamp with a burning stare'], ['Mirror', 'a cracked mirror with a stranger inside'], ['Bulb', 'a light bulb that buzzes with anger'], ['Crystal', 'a crystal that hums at night'], ['Glowstick', 'a glowstick that never fades'], ['Jar', 'a jar of fireflies that escaped'], ['Disco', 'a disco ball that dazzles enemies'], ['Prism', 'a prism that splits light into blades'], ['Projector', 'an old projector that shows nightmares'], ['Halo', 'a broken halo that lost its owner'], ['Camera', 'an old camera with a blinding flash']],
};
const SUFFIX = ['fang', 'maw', 'claw', 'wraith', 'gloom', 'snap', 'horn', 'grub', 'ling', 'spike', 'shade', 'crusher', 'howl', 'bite', 'skull', 'viper', 'golem', 'imp', 'rex', 'thorn', 'grin', 'beast', 'stalker', 'mite'];
const ATTACKS = { fire: ['embers', 'melee', 'charge', 'volley'], water: ['geyser', 'beam', 'pounce', 'ring'], plant: ['charge', 'spikes', 'melee', 'burrow'], metal: ['charge', 'melee', 'volley', 'spikes'], wind: ['pounce', 'volley', 'beam', 'ring'], stone: ['burrow', 'charge', 'ring', 'spikes'], light: ['beam', 'ring', 'volley', 'pounce'] };
export const ABILITIES = {
  thorns: ['🌵', 'Thorns', 'Hurts your companion a little every time it is hit.'],
  regen: ['💚', 'Regenerate', 'Heals itself if you stop attacking.'],
  split: ['🧬', 'Splitter', 'Splits into 2 mini monsters when defeated.'],
  blink: ['🌀', 'Blink', 'Teleports behind its target.'],
  shield: ['🛡️', 'Bubble shield', 'Puts up a shield every few seconds: wait it out!'],
  summon: ['📯', 'Summoner', 'Calls 2 helpers when it gets hurt.'],
  vampire: ['🧛', 'Vampire', 'Heals itself when it hits you.'],
  fuse: ['💣', 'Fuse', 'When almost defeated it tries to explode: run from the big circle!'],
  speedy: ['⚡', 'Speedy', 'Very fast.'],
  tank: ['🧱', 'Tank', 'Lots of health but slow.'],
  poison: ['☠️', 'Poison trail', 'Leaves poison puddles where it walks.'],
  frost: ['🧊', 'Frost bite', 'Its hits slow you down.'],
  magnet: ['🧲', 'Magnet', 'Pulls you towards it.'],
  gust: ['💨', 'Gust', 'Its hits push you away.'],
  shadow: ['👻', 'Shadow', 'Almost invisible at night until you get close.'],
  enrage: ['😡', 'Enrage', 'Gets faster and stronger when hurt.'],
  mimic: ['🎭', 'Mimic', 'Changes its element to beat your companion!'],
};
const ABIL_KEYS = Object.keys(ABILITIES);
const HABITAT = { fire: ['forest', 'city', 'hill'], water: ['lake', 'forest', 'lake'], plant: ['forest', 'forest', 'hill'], metal: ['city', 'mountain', 'forest'], wind: ['hill', 'mountain', 'forest'], stone: ['mountain', 'hill', 'mountain'], light: ['forest', 'city', 'mountain'] };
const CONDS = ['night', 'rain', 'snow', 'fog', 'wind', 'sun'];
const SKILLW = { fire: [['Ember', 'Scorch', 'Blaze', 'Cinder'], ['Bite', 'Burst', 'Spin', 'Storm']], water: [['Splash', 'Tide', 'Drip', 'Flood'], ['Slap', 'Jet', 'Wave', 'Whirl']], plant: [['Thorn', 'Root', 'Vine', 'Spore'], ['Lash', 'Grab', 'Snare', 'Bloom']], metal: [['Iron', 'Rust', 'Steel', 'Rivet'], ['Snap', 'Clamp', 'Slash', 'Crash']], wind: [['Gust', 'Gale', 'Breeze', 'Cyclone'], ['Cut', 'Rush', 'Howl', 'Twister']], stone: [['Rock', 'Boulder', 'Gravel', 'Quake'], ['Smash', 'Slam', 'Crush', 'Wall']], light: [['Flash', 'Glare', 'Prism', 'Halo'], ['Beam', 'Burst', 'Shine', 'Nova']] };
export const GEN_IDS = [];
(function generate() {
  const used = new Set(Object.values(SPECIES).map((s) => s.name));
  for (let i = 0; i < 187; i++) {
    const r = rng32(1000 + i * 7919), el = ELEMS[i % 7], list = OBJECTS[el], obj = list[Math.floor(i / 7) % list.length];
    let k = (i * 5 + Math.floor(i / 77) * 3) % SUFFIX.length, name;
    do { name = obj[0] + SUFFIX[k]; k = (k + 1) % SUFFIX.length; } while (used.has(name)); used.add(name);
    const tr = r(), tier = tr < 0.3 ? 1 : tr < 0.6 ? 2 : tr < 0.82 ? 3 : tr < 0.95 ? 4 : 5;
    const abil = [ABIL_KEYS[Math.floor(r() * ABIL_KEYS.length)]]; if (tier >= 4) { let b; do { b = ABIL_KEYS[Math.floor(r() * ABIL_KEYS.length)]; } while (b === abil[0]); abil.push(b); }
    const attack = ATTACKS[el][Math.floor(r() * 4)], hab = HABITAT[el][Math.floor(r() * 3)], cond = r() < 0.28 ? CONDS[Math.floor(r() * CONDS.length)] : null;
    let hp = Math.round(55 + tier * 24 + r() * 20), atk = Math.round(8 + tier * 3.4 + r() * 3), spd = +(3.4 + r() * 3).toFixed(1);
    if (abil.includes('tank')) { hp = Math.round(hp * 1.8); spd = +(spd * 0.7).toFixed(1); } if (abil.includes('speedy')) spd = +(spd * 1.6).toFixed(1);
    const [w1, w2] = SKILLW[el], pick = (a) => a[Math.floor(r() * a.length)];
    const skills = [
      { name: `${pick(w1)} ${pick(w2)}`, kind: 'melee', power: 1, range: 2.4, cd: 0.8 },
      { name: `${pick(w1)} ${pick(w2)}`, kind: ['melee', 'dash', 'slow'][Math.floor(r() * 3)], power: 1.8, range: 6, cd: 4, slow: 2, stagger: 0.6, desc: 'A strong special move.' },
      { name: `${pick(w1)} ${['Guard', 'Shell', 'Veil', 'Wall'][Math.floor(r() * 4)]}`, kind: 'guard', power: 0, range: 0, cd: 6, desc: 'Blocks attacks for a moment.' },
      { name: `${pick(w1).toUpperCase()} ${['APOCALYPSE', 'FRENZY', 'CATACLYSM', 'RAMPAGE', 'ERUPTION'][Math.floor(r() * 5)]}`, kind: 'aoe', power: 3.2 + tier * 0.4, range: 4.5, desc: 'A huge attack that hits everything around.' },
    ];
    const id = 'g' + String(i + 1).padStart(3, '0');
    const where = { forest: 'the Songwood Forest', lake: 'around the lake', hill: 'the hills', mountain: 'the Cut Mountain', city: 'the Folded City' }[hab];
    SPECIES[id] = {
      name, gen: true, elem: el, tier, abilities: abil, attack, habitat: hab, cond, color: '#888', hp, atk, spd, skills,
      role: `${'★'.repeat(tier)} ${el[0].toUpperCase() + el.slice(1)}`,
      about: `It is ${obj[1]}. Lives in ${where}${cond ? `, but only ${cond === 'night' ? 'at night' : cond === 'sun' ? 'when it is sunny' : `in ${cond === 'wind' ? 'windy weather' : cond}`}` : ''}. ${abil.map((a) => ABILITIES[a][0] + ' ' + ABILITIES[a][1] + ': ' + ABILITIES[a][2]).join(' ')}`,
      plan: { seed: 5000 + i * 131, el },
    };
    GEN_IDS.push(id);
  }
})();

// ---- procedural monster bodies (every species gets its own combination of parts)
const PAL = { fire: ['#c0391a', '#ff7a1a', '#3a1208', '#ffb02a'], water: ['#1d5f9a', '#3ab0ff', '#0a2a44', '#9fe8ff'], plant: ['#2f6a2a', '#5cb043', '#1c2a14', '#c9e86a'], metal: ['#5a606c', '#a8b0bc', '#1c1f25', '#ffd34d'], wind: ['#7aa8c8', '#d8eef8', '#2a3a4a', '#9fe8ff'], stone: ['#6f6a62', '#a89a80', '#2a2620', '#ff7a2a'], light: ['#d8b04a', '#fff3a0', '#3a2a10', '#ffffff'] };
function buildProc(spec, mood) {
  const r = rng32(spec.plan.seed), el = spec.plan.el, tier = spec.tier || 1;
  let [c1, c2, c3, glow] = PAL[el];
  if (spec.plan.el2 && spec.plan.el2 !== el) { c2 = PAL[spec.plan.el2][1]; c3 = PAL[spec.plan.el2][2]; glow = PAL[spec.plan.el2][3]; }
  const pick = (a) => a[Math.floor(r() * a.length)];
  const g = new THREE.Group(), root = new THREE.Group(); g.add(root);
  const shape = pick(['box', 'tall', 'round', 'flat', 'cone', 'barrel', 'blob', 'diamond']);
  const legsN = pick([0, 2, 2, 4, 4, 6, 8]), hover = legsN === 0;
  const S = 0.75 + tier * 0.13 + r() * 0.15, bw = (0.6 + r() * 0.5) * S, bh = (0.5 + r() * 0.6) * S, bd = (0.55 + r() * 0.5) * S;
  const legH = hover ? 0 : (legsN === 2 ? 0.55 : 0.4) * S;
  const by = (hover ? 0.9 * S : legH) + bh / 2;
  const body = new THREE.Group(); body.position.y = by; root.add(body);
  const metal = el === 'metal' ? { m: 0.45, r: 0.35 } : el === 'light' ? { e: glow, ei: 0.25 } : undefined;
  if (shape === 'box') bx(body, bw, bh, bd, c1, 0, 0, 0, metal);
  else if (shape === 'tall') bx(body, bw * 0.75, bh * 1.5, bd * 0.75, c1, 0, bh * 0.25, 0, metal);
  else if (shape === 'round') { const m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(bw, bh) * 0.55, 14, 10), mat(c1, metal)); m.castShadow = true; body.add(m); }
  else if (shape === 'flat') bx(body, bw * 1.3, bh * 0.55, bd * 1.3, c1, 0, -bh * 0.2, 0, metal);
  else if (shape === 'cone') { const m = cone(body, bw * 0.6, bh * 1.6, c1, 0, bh * 0.2, 0, pick([4, 6, 8]), metal); }
  else if (shape === 'barrel') { const m = cy(body, bw * 0.5, bw * 0.55, bh * 1.2, c1, 0, 0, 0, 12, metal); }
  else if (shape === 'blob') { for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(bw * (0.35 + r() * 0.2), 10, 8), mat(i % 2 ? c1 : c2, metal)); m.position.set((r() - .5) * bw * 0.6, (r() - .5) * bh * 0.5, (r() - .5) * bd * 0.5); m.castShadow = true; body.add(m); } }
  else { const m = bx(body, bw * 0.8, bw * 0.8, bw * 0.8, c1, 0, 0, 0, metal); m.rotation.set(0.6, 0.78, 0); }
  // stripes / plates in the second color
  for (let i = 0; i < 2; i++) bx(body, bw * 1.02, 0.05 * S, bd * 1.02, c2, 0, (i - 0.5) * bh * 0.45, 0, metal);
  // face
  const fstyle = pick(['eyes', 'eyes', 'cyclops', 'dragon']);
  const fz = (shape === 'round' ? Math.max(bw, bh) * 0.55 : shape === 'flat' ? bd * 0.65 : shape === 'barrel' ? bw * 0.55 : shape === 'cone' ? bw * 0.35 : bd * 0.5) + 0.01;
  const fw = Math.min(bw, 0.75 * S) * 0.95;
  face(body, faceTex(mood, fstyle, glow), fw, fw * 0.8, 0, shape === 'cone' ? -bh * 0.1 : bh * 0.05, fz);
  // extra glowing eyes
  const extraEyes = pick([0, 0, 0, 2, 3, 4]);
  for (let i = 0; i < extraEyes; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05 * S, 8, 6), mat(mood === 'angry' ? '#ff2a14' : glow, { e: mood === 'angry' ? '#ff2a14' : glow, ei: 2.4 })); e.position.set((r() - .5) * bw * 0.9, bh * (0.25 + r() * 0.2), fz - 0.02); body.add(e); }
  // fangs under the face
  if (r() < 0.65) teethRow(body, pick([3, 4, 5]), fw * 0.7, 0, -bh * 0.32, fz, 0.13 * S, true, BONE);
  // horns / crown
  const hornT = pick(['none', 'pair', 'pair', 'crown', 'single']);
  if (hornT === 'pair') for (const s of [-1, 1]) horn(body, s * bw * 0.35, bh * 0.45, 0, (0.4 + r() * 0.5) * S, c3, s);
  if (hornT === 'single') horn(body, 0, bh * 0.5, 0, (0.5 + r() * 0.4) * S, c3, 1);
  if (hornT === 'crown') spikePlane(body, 6, bw * 0.3, 0.25 * S, c3, 0.3, Math.PI - 0.3);
  // back spikes
  if (r() < 0.55) for (let i = 0; i < 3 + Math.floor(r() * 3); i++) { const s = cone(body, 0.06 * S, 0.3 * S, c3, 0, bh * 0.5, -bd * 0.4 + i * 0.16 * S, 4); s.rotation.x = -0.4; }
  // glowing cracks
  for (let i = 0; i < 1 + Math.floor(r() * 3); i++) crack(body, 0.03, bh * 0.4, (r() - .5) * bw * 0.7, (r() - .5) * bh * 0.4, fz + 0.005, r() * 3, glow);
  // element details
  if (el === 'fire') for (let i = 0; i < 3; i++) { const f = cone(body, 0.09 * S, 0.35 * S, '#ffb02a', (i - 1) * 0.15 * S, bh * 0.55, -0.05, 5, { e: '#ff5a00', ei: 1.8 }); f.userData.flame = true; }
  if (el === 'water') { for (const s of [-1, 1]) { const fin = bx(body, 0.04, bh * 0.6, bd * 0.6, c2, s * bw * 0.52, 0, -bd * 0.1, { op: 0.85 }); fin.rotation.y = s * 0.3; } }
  if (el === 'plant') for (let i = 0; i < 4; i++) { const l = bx(body, 0.22 * S, 0.04, 0.12 * S, '#5cb043', (r() - .5) * bw, bh * 0.52, (r() - .5) * bd); l.rotation.y = r() * 6; }
  if (el === 'metal') for (let i = 0; i < 4; i++) bx(body, 0.07, 0.07, 0.07, '#d8dde6', (i % 2 ? 1 : -1) * bw * 0.4, (i < 2 ? 1 : -1) * bh * 0.35, fz - 0.03, { m: 0.7, r: 0.2 });
  if (el === 'stone') for (let i = 0; i < 3; i++) bx(body, 0.2 * S, 0.16 * S, 0.2 * S, c2, (r() - .5) * bw, bh * 0.5, (r() - .5) * bd).rotation.set(r(), r(), r());
  const floaters = [];
  if (el === 'light' || el === 'wind') for (let i = 0; i < 3; i++) { const f = bx(root, el === 'light' ? 0.12 : 0.25, el === 'light' ? 0.12 : 0.03, el === 'light' ? 0.12 : 0.18, el === 'light' ? mat(glow, { e: glow, ei: 2 }) : c2, 0, by + bh * 0.8, 0); floaters.push(f); }
  // legs
  const legs = [];
  if (legsN === 2) for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * bw * 0.28, legH, 0); root.add(l); bx(l, 0.16 * S, legH, 0.18 * S, c3, 0, -legH / 2, 0); claws(l, 0, -legH + 0.02, 0.02, S); legs.push(l); }
  if (legsN === 4) for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const l = new THREE.Group(); l.position.set(x * bw * 0.35, legH, z * bd * 0.35); root.add(l); bx(l, 0.13 * S, legH, 0.13 * S, c3, 0, -legH / 2, 0); claws(l, 0, -legH + 0.02, 0.02, 0.8 * S); legs.push(l); }
  if (legsN === 6 || legsN === 8) for (let i = 0; i < legsN; i++) { const a = i / legsN * 6.28, l = new THREE.Group(); l.position.set(Math.cos(a) * bw * 0.4, legH + 0.05, Math.sin(a) * bd * 0.4); root.add(l); for (let k = 0; k < 3; k++) bx(l, 0.07 * S, 0.18 * S, 0.07 * S, k % 2 ? c3 : c1, Math.cos(a) * k * 0.1 * S, -k * 0.13 * S, Math.sin(a) * k * 0.1 * S); legs.push(l); }
  // arms with claws or blades
  const arms = [];
  if (r() < 0.45) for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * bw * 0.55, by + bh * 0.1, 0); root.add(a); bx(a, 0.12 * S, 0.45 * S, 0.12 * S, c3, 0, -0.2 * S, 0.05); const blade = r() < 0.5; if (blade) { const b2 = cone(a, 0.05 * S, 0.45 * S, '#d8dde6', 0, -0.55 * S, 0.12, 4, { m: 0.6, r: 0.2 }); b2.rotation.x = Math.PI; } else claws(a, 0, -0.45 * S, 0.06, S); arms.push(a); }
  // wings
  const wings = [];
  if (r() < (el === 'wind' ? 0.75 : 0.25)) for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * bw * 0.45, by + bh * 0.3, -bd * 0.2); root.add(w); for (let k = 0; k < 3; k++) { const p = bx(w, 0.45 * S, 0.03, (0.4 - k * 0.1) * S, k % 2 ? c2 : c3, s * (0.25 + k * 0.38) * S, k * 0.06, -k * 0.06); p.rotation.z = s * 0.25; } wings.push(w); }
  // tail
  let tail = null;
  if (r() < 0.5) { tail = new THREE.Group(); tail.position.set(0, by - bh * 0.2, -bd * 0.5); root.add(tail); for (let k = 0; k < 4; k++) bx(tail, (0.16 - k * 0.03) * S, (0.16 - k * 0.03) * S, 0.22 * S, k % 2 ? c1 : c3, 0, -k * 0.04, -k * 0.2 * S); if (r() < 0.6) { const st = cone(tail, 0.07 * S, 0.25 * S, c3, 0, -0.16, -0.85 * S, 4); st.rotation.x = -Math.PI / 2; } }
  // alpha aura for tier 5
  if (tier >= 5) { const halo = new THREE.Mesh(new THREE.TorusGeometry(Math.max(bw, bd) * 0.8, 0.04, 6, 30), mat(glow, { e: glow, ei: 2.5 })); halo.rotation.x = Math.PI / 2; halo.position.y = 0.06; root.add(halo); g.userData.halo = halo; }
  // fusion (Morph Lab) creatures: a floating crystal core with two orbiting rings in both parents' colors
  let fRings = null;
  if (spec.plan.fusion) {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 * S), mat(glow, { e: glow, ei: 2.6 })); core.position.set(0, by + bh * 0.95 + 0.35 * S, 0); root.add(core);
    fRings = [PAL[el][3], PAL[spec.plan.el2 || el][1]].map((c, i) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32 * S, 0.025, 6, 28), mat(c, { e: c, ei: 2 })); ring.position.copy(core.position); ring.rotation.x = i ? 1.1 : 0.4; root.add(ring); return ring; });
    fRings.push(core);
    for (let i = 0; i < 3; i++) crack(body, 0.03, bh * 0.5, (i - 1) * bw * 0.25, 0, fz + 0.006, (i - 1) * 0.5, PAL[spec.plan.el2 || el][3]);
  }
  const baseY = 0;
  g.userData.anim = (t, st) => {
    const sp = st.moving ? 10 : 2.5;
    legs.forEach((l, i) => { if (legsN >= 6) l.rotation.z = Math.sin(t * sp + i) * 0.35; else l.rotation.x = st.moving ? Math.sin(t * sp + (i % 2 ? Math.PI : 0) + (i > 1 ? 1.2 : 0)) * 0.6 : 0; });
    arms.forEach((a, i) => a.rotation.x = st.attack ? -1.3 + Math.sin(t * 22 + i * Math.PI) * 0.7 : Math.sin(t * 2 + i) * 0.15);
    wings.forEach((w, i) => w.rotation.z = Math.sin(t * (hover ? 9 : 4)) * 0.4 * (i ? -1 : 1));
    if (tail) tail.rotation.y = Math.sin(t * 3) * 0.5;
    floaters.forEach((f, i) => { const a = t * 1.5 + i * 2.1; f.position.set(Math.cos(a) * bw * 0.9, by + bh * 0.6 + Math.sin(t * 2 + i) * 0.15, Math.sin(a) * bw * 0.9); f.rotation.y = t * 2; });
    root.position.y = baseY + (hover ? Math.sin(t * 2.5) * 0.15 : st.moving ? Math.abs(Math.sin(t * sp)) * 0.06 : 0);
    body.rotation.z = st.attack ? Math.sin(t * 30) * 0.08 : 0;
    if (g.userData.halo) g.userData.halo.rotation.z = t;
    if (fRings) { fRings[0].rotation.y = t * 2; fRings[1].rotation.z = t * 2.6; fRings[2].rotation.y = t * 1.5; fRings[2].position.y += Math.sin(t * 2) * 0.002; }
  };
  return g;
}

export function buildMon(sp, mood = 'happy', opts = {}) {
  const g = BUILD[sp] ? BUILD[sp](mood, opts.big) : buildProc(SPECIES[sp], mood);
  g.userData.sp = sp;
  g.traverse((o) => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true; });
  return g;
}
