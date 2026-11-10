/* The player's avatar: an original blocky kid built from boxes, fully customisable. */
import * as THREE from './lib/three.module.min.js';

export const OPTIONS = {
  skin: ['#ffdcb8', '#f1c27d', '#d9a066', '#a86b3c', '#6b4226'],
  hairStyle: [['short', 'Short'], ['spiky', 'Spiky'], ['curly', 'Curly'], ['long', 'Long on top'], ['buzz', 'Buzz cut']],
  hairColor: ['#2b1d12', '#5a3a1c', '#a0662b', '#e8c26a', '#d64545', '#3a7bff'],
  hat: [['none', 'No hat'], ['cap', 'Cap'], ['capback', 'Backwards cap'], ['beanie', 'Beanie'], ['bucket', 'Bucket hat'], ['winter', 'Winter pom-pom'], ['hood', 'Rain hood'], ['crown', 'Crown'], ['pirate', 'Pirate hat'], ['wizard', 'Wizard hat']],
  top: [['tee', 'T-shirt'], ['long', 'Long sleeves'], ['hoodie', 'Hoodie'], ['jacket', 'Jacket'], ['raincoat', 'Raincoat'], ['puffer', 'Puffer jacket']],
  pants: [['shorts', 'Shorts'], ['long', 'Long pants']],
  shoes: [['sneaker', 'Sneakers'], ['high', 'High-tops'], ['boots', 'Boots']],
  glasses: [['none', 'No glasses'], ['sun', 'Sunglasses']],
  scarf: [['none', 'No scarf'], ['scarf', 'Scarf']],
  bag: [['none', 'No bag'], ['backpack', 'Backpack']],
  colors: ['#1e90ff', '#e53950', '#3ddc84', '#ffd34d', '#ff8c1a', '#8a5ad6', '#111827', '#f5f5f5', '#00c2c7', '#ff7eb6'],
};

export function randomAvatar() {
  const p = (a) => a[Math.floor(Math.random() * a.length)];
  const c = () => p(OPTIONS.colors);
  return {
    skin: p(OPTIONS.skin), hairStyle: p(OPTIONS.hairStyle)[0], hairColor: p(OPTIONS.hairColor),
    hat: p(OPTIONS.hat.slice(0, 6))[0], hatColor: c(), top: p(OPTIONS.top)[0], topColor: c(), top2: c(),
    pants: p(OPTIONS.pants)[0], pantsColor: p(['#2f4f8f', '#3a3a3a', '#6b8e4e', '#c9a060', '#1e90ff', '#111827']),
    shoes: p(OPTIONS.shoes.slice(0, 2))[0], shoeColor: c(), bag: p(OPTIONS.bag)[0], bagColor: c(), glasses: 'none', scarf: 'none', scarfColor: c(),
  };
}
export const DEFAULT_AVATAR = {
  skin: '#f1c27d', hairStyle: 'short', hairColor: '#5a3a1c', hat: 'cap', hatColor: '#1e90ff', top: 'hoodie', topColor: '#111827', top2: '#1e90ff',
  pants: 'shorts', pantsColor: '#2f4f8f', shoes: 'sneaker', shoeColor: '#e53950', bag: 'backpack', bagColor: '#ffd34d',
  glasses: 'none', scarf: 'none', scarfColor: '#e53950',
};

const geo = new THREE.BoxGeometry(1, 1, 1);
const matCache = new Map();
function mat(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.7, metalness: o.m ?? 0 }));
  return matCache.get(k);
}
function b(w, h, d, c, x, y, z, parent) {
  const m = new THREE.Mesh(geo, c instanceof THREE.Material ? c : mat(c));
  m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

let faceTex = null;
function face() {
  if (faceTex) return faceTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  for (const x of [44, 84]) {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, 62, 11, 13, 0, 0, 7); c.fill();
    c.fillStyle = '#2b1d12'; c.beginPath(); c.ellipse(x + 1, 64, 7, 9, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 2, 59, 3, 0, 7); c.fill();
    c.strokeStyle = '#2b1d12'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 10, 44); c.lineTo(x + 9, 42); c.stroke();
  }
  c.strokeStyle = '#7a2a3a'; c.lineWidth = 5; c.beginPath(); c.arc(64, 84, 14, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  c.fillStyle = 'rgba(255,120,120,.35)'; c.beginPath(); c.ellipse(28, 82, 9, 5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(100, 82, 9, 5, 0, 0, 7); c.fill();
  faceTex = new THREE.CanvasTexture(cv); faceTex.colorSpace = THREE.SRGBColorSpace;
  return faceTex;
}

/** Builds the avatar. Returns a group with userData.parts for animation (legs, arms, head, body). */
export function buildAvatar(a) {
  a = { ...DEFAULT_AVATAR, ...a };
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skin = a.skin;
  // legs (hip pivots so they can swing)
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.62, 0); body.add(hip);
    const long = a.pants === 'long';
    b(0.22, long ? 0.5 : 0.24, 0.24, a.pantsColor, 0, long ? -0.25 : -0.12, 0, hip);
    if (!long) b(0.18, 0.26, 0.2, skin, 0, -0.37, 0, hip);
    const high = a.shoes === 'high', boots = a.shoes === 'boots';
    if (boots) { b(0.26, 0.34, 0.33, a.shoeColor, 0, -0.45, 0.03, hip); b(0.28, 0.06, 0.35, shade(a.shoeColor, 0.75), 0, -0.29, 0.03, hip); }
    else b(0.24, high ? 0.2 : 0.13, 0.32, a.shoeColor, 0, high ? -0.52 : -0.555, 0.04, hip);
    b(0.25, 0.04, 0.33, '#f5f5f5', 0, -0.6, 0.04, hip);                           // white sole
    b(0.12, 0.03, 0.02, '#f5f5f5', 0, high ? -0.48 : -0.53, 0.205, hip);          // shoe stripe
    legs.push(hip);
  }
  // torso
  const torso = new THREE.Group(); torso.position.y = 0.62; body.add(torso);
  const tc = a.topColor, t2 = a.top2;
  b(0.5, 0.5, 0.28, tc, 0, 0.27, 0, torso);
  if (a.top === 'tee' || a.top === 'long') { b(0.18, 0.06, 0.02, t2, 0, 0.36, 0.145, torso); b(0.5, 0.06, 0.29, t2, 0, 0.04, 0, torso); }
  if (a.top === 'hoodie') { b(0.36, 0.14, 0.02, shade(tc, 0.8), 0, 0.12, 0.145, torso); b(0.04, 0.16, 0.01, t2, -0.06, 0.42, 0.146, torso); b(0.04, 0.16, 0.01, t2, 0.06, 0.42, 0.146, torso); b(0.46, 0.18, 0.12, shade(tc, 0.85), 0, 0.5, -0.16, torso); }
  if (a.top === 'raincoat') { b(0.56, 0.8, 0.32, tc, 0, 0.12, 0, torso); b(0.04, 0.78, 0.02, shade(tc, 0.7), 0, 0.12, 0.165, torso); for (let k = 0; k < 4; k++) b(0.06, 0.06, 0.02, '#f5f5f5', 0.08, 0.4 - k * 0.17, 0.17, torso); b(0.46, 0.12, 0.34, shade(tc, 0.85), 0, 0.52, 0, torso); }
  if (a.top === 'puffer') { b(0.64, 0.6, 0.42, tc, 0, 0.26, 0, torso); for (let k = 0; k < 4; k++) b(0.67, 0.05, 0.45, shade(tc, 0.8), 0, 0.05 + k * 0.15, 0, torso); b(0.44, 0.16, 0.38, shade(tc, 0.85), 0, 0.6, 0, torso); b(0.04, 0.58, 0.02, '#d0d0d0', 0, 0.26, 0.215, torso); }
  if (a.top === 'jacket') { b(0.04, 0.48, 0.02, '#d0d0d0', 0, 0.27, 0.15, torso); for (let k = 0; k < 4; k++) b(0.52, 0.03, 0.3, shade(tc, 0.82), 0, 0.08 + k * 0.12, 0, torso); b(0.5, 0.1, 0.3, t2, 0, 0.54, 0, torso); }
  // arms (shoulder pivots)
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.34, 1.1, 0); body.add(sh);
    const sleeveLong = a.top !== 'tee';
    const bulky = a.top === 'puffer' ? 1.35 : a.top === 'raincoat' ? 1.12 : 1;
    b(0.16 * bulky, sleeveLong ? 0.44 : 0.2, 0.2 * bulky, tc, 0, sleeveLong ? -0.2 : -0.08, 0, sh);
    if (a.top === 'puffer') for (let k = 0; k < 2; k++) b(0.23, 0.04, 0.28, shade(tc, 0.8), 0, -0.12 - k * 0.16, 0, sh);
    if (!sleeveLong) b(0.14, 0.26, 0.18, skin, 0, -0.32, 0, sh);
    b(0.15, 0.12, 0.17, skin, 0, -0.48, 0, sh);                                     // hand
    if (a.top === 'jacket' || a.top === 'hoodie' || a.top === 'puffer') b(0.17 * bulky, 0.05, 0.21 * bulky, t2, 0, -0.4, 0, sh);  // cuff
    arms.push(sh);
  }
  // backpack
  if (a.bag === 'backpack') { b(0.4, 0.42, 0.16, a.bagColor, 0, 0.92, -0.23, body); b(0.3, 0.16, 0.06, shade(a.bagColor, 0.8), 0, 0.82, -0.33, body); for (const s of [-1, 1]) b(0.05, 0.42, 0.04, shade(a.bagColor, 0.7), s * 0.16, 0.92, 0.15, body); }
  // head
  const head = new THREE.Group(); head.position.y = 1.4; body.add(head);
  b(0.46, 0.44, 0.42, skin, 0, 0, 0, head);
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.42), new THREE.MeshBasicMaterial({ map: face(), transparent: true }));
  fp.position.z = 0.212; head.add(fp);
  b(0.06, 0.1, 0.06, skin, -0.25, -0.02, 0, head); b(0.06, 0.1, 0.06, skin, 0.25, -0.02, 0, head);   // ears
  if (a.glasses === 'sun') { b(0.44, 0.05, 0.02, '#111111', 0, 0.06, 0.222, head); for (const s of [-1, 1]) b(0.15, 0.1, 0.02, '#1a2a4a', s * 0.1, 0.03, 0.228, head); }
  if (a.scarf === 'scarf') { b(0.44, 0.11, 0.36, a.scarfColor, 0, 1.17, 0, body); b(0.1, 0.32, 0.05, a.scarfColor, 0.12, 0.98, 0.17, body); b(0.1, 0.05, 0.06, shade(a.scarfColor, 0.75), 0.12, 0.84, 0.17, body); }
  // hair
  const hc = a.hairColor;
  const hairTop = a.hairStyle === 'buzz' ? 0.04 : 0.1;
  b(0.48, hairTop, 0.44, hc, 0, 0.23, 0, head);
  b(0.48, 0.3, 0.08, hc, 0, 0.08, -0.2, head);
  if (a.hairStyle !== 'buzz') { b(0.06, 0.2, 0.44, hc, -0.24, 0.12, 0, head); b(0.06, 0.2, 0.44, hc, 0.24, 0.12, 0, head); b(0.48, 0.08, 0.06, hc, 0, 0.19, 0.2, head); }
  if (a.hairStyle === 'spiky') for (let k = -2; k <= 2; k++) { const sp = b(0.08, 0.16, 0.08, hc, k * 0.09, 0.33, (k % 2) * 0.06, head); sp.rotation.z = k * 0.15; }
  if (a.hairStyle === 'curly') for (let k = 0; k < 9; k++) b(0.12, 0.1, 0.12, hc, -0.18 + (k % 3) * 0.18, 0.28, -0.14 + Math.floor(k / 3) * 0.14, head);
  if (a.hairStyle === 'long') { b(0.5, 0.14, 0.46, hc, 0, 0.3, -0.02, head); b(0.2, 0.08, 0.12, hc, 0.08, 0.27, 0.24, head); }
  // hats
  const hcol = a.hatColor;
  if (a.hat !== 'none') {
    const hat = new THREE.Group(); hat.position.y = 0.26; head.add(hat);
    if (a.hat === 'cap' || a.hat === 'capback') {
      b(0.5, 0.14, 0.46, hcol, 0, 0.04, 0, hat); b(0.06, 0.02, 0.06, '#f5f5f5', 0, 0.12, 0, hat);
      const brim = b(0.4, 0.03, 0.22, shade(hcol, 0.8), 0, -0.02, a.hat === 'cap' ? 0.3 : -0.3, hat);
      if (a.hat === 'capback') b(0.12, 0.04, 0.02, '#f5f5f5', 0, 0.02, 0.231, hat);
      brim.castShadow = true;
    }
    if (a.hat === 'beanie') { b(0.5, 0.2, 0.46, hcol, 0, 0.06, 0, hat); b(0.52, 0.07, 0.48, shade(hcol, 0.75), 0, -0.04, 0, hat); }
    if (a.hat === 'bucket') { b(0.46, 0.16, 0.42, hcol, 0, 0.06, 0, hat); b(0.66, 0.03, 0.62, shade(hcol, 0.85), 0, -0.02, 0, hat); }
    if (a.hat === 'hood') { b(0.56, 0.3, 0.52, hcol, 0, 0.0, -0.03, hat); b(0.06, 0.4, 0.5, hcol, -0.27, -0.16, -0.02, hat); b(0.06, 0.4, 0.5, hcol, 0.27, -0.16, -0.02, hat); b(0.56, 0.05, 0.12, shade(hcol, 0.8), 0, 0.12, 0.25, hat); }
    if (a.hat === 'crown') { b(0.48, 0.12, 0.44, '#ffcf3a', 0, 0.02, 0, hat); for (const [x, z] of [[-0.2, 0.18], [0, 0.18], [0.2, 0.18], [-0.2, -0.18], [0.2, -0.18], [0, -0.18]]) b(0.08, 0.14, 0.08, '#ffcf3a', x, 0.14, z, hat); b(0.08, 0.08, 0.02, '#e53950', 0, 0.03, 0.225, hat); }
    if (a.hat === 'pirate') { b(0.5, 0.16, 0.46, '#1a1a1a', 0, 0.05, 0, hat); b(0.72, 0.1, 0.3, '#1a1a1a', 0, 0.16, 0, hat); b(0.1, 0.1, 0.02, '#f5f5f5', 0, 0.12, 0.16, hat); }
    if (a.hat === 'wizard') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 8), mat('#5a2ab0')); c.position.y = 0.38; c.castShadow = true; hat.add(c); b(0.68, 0.04, 0.68, '#5a2ab0', 0, 0.02, 0, hat); b(0.06, 0.06, 0.02, '#ffd34d', 0.08, 0.35, 0.2, hat); }
    if (a.hat === 'winter') { b(0.5, 0.22, 0.46, hcol, 0, 0.07, 0, hat); b(0.52, 0.08, 0.48, '#f5f5f5', 0, -0.04, 0, hat); b(0.14, 0.14, 0.14, '#f5f5f5', 0, 0.25, 0, hat); }
  }
  root.userData.parts = { legs, arms, head, body };
  return root;
}

/** Simple walk / run / jump / swim animation. speed01 0..1, mode 'idle'|'walk'|'run'|'air'|'swim'|'climb'. */
export function animateAvatar(av, t, mode, speed01 = 0) {
  const { legs, arms, head, body } = av.userData.parts;
  const f = mode === 'run' ? 14 : 9;
  const sw = mode === 'idle' ? 0 : mode === 'air' ? 0.6 : mode === 'swim' ? 0.9 : mode === 'climb' ? 0.7 : (mode === 'run' ? 0.95 : 0.6) * Math.max(0.3, speed01);
  const ph = Math.sin(t * f);
  legs[0].rotation.x = mode === 'air' ? -0.5 : ph * sw; legs[1].rotation.x = mode === 'air' ? 0.3 : -ph * sw;
  if (mode === 'swim') { arms[0].rotation.x = -1.8 + Math.sin(t * 6) * 1.2; arms[1].rotation.x = -1.8 - Math.sin(t * 6) * 1.2; }
  else if (mode === 'climb') { arms[0].rotation.x = -2.6 + ph * 0.4; arms[1].rotation.x = -2.6 - ph * 0.4; }
  else if (mode === 'air') { arms[0].rotation.x = -2.4; arms[1].rotation.x = -2.4; }
  else { arms[0].rotation.x = -ph * sw * 0.9; arms[1].rotation.x = ph * sw * 0.9; }
  arms[0].rotation.z = mode === 'air' ? 0.3 : 0.05; arms[1].rotation.z = mode === 'air' ? -0.3 : -0.05;
  body.position.y = mode === 'idle' ? Math.sin(t * 2) * 0.01 : Math.abs(ph) * 0.04 * sw;
  body.rotation.x = mode === 'swim' ? 1.1 : mode === 'run' ? 0.15 : 0;
  head.rotation.y = mode === 'idle' ? Math.sin(t * 0.7) * 0.25 : 0;
}
