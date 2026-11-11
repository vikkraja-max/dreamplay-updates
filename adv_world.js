/* WILDFOLD - the world of Virelia, first region: Pylli i Tingujve with the village Rrënjëdritë.
   Terrain, water, the root bridge, Professor Green's lab, the camp and the strange beautiful details. */
import * as THREE from './lib/three.module.min.js';
import { bx, mat } from './adv_mons.js';

export const W = 640, HALF = W / 2, WATER = -0.8, CORE = 95;
export const SPOTS = {
  start: [0, 66], lab: [13, 50], green: [9, 45], camp: [-20, 46], tent: [-23, 44], fire: [-17, 47],
  bridge: [0, 0], cage: [4, 13], rootlock: [0, 11.5], pylonA: [-7, 14], pylonB: [7, 14],
  lake: [-40, 22], hill: [36, 20], mountain: [0, -78],
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------ height field
function coreHeight(x, z) {
  let h = Math.sin(x * 0.07) * 0.7 + Math.cos(z * 0.06) * 0.6 + Math.sin((x - z) * 0.12) * 0.35 + 0.8;
  h = h * (1 - smooth(34, 44, z)) + 0.6 * smooth(34, 44, z);                               // flat village
  const lk = Math.hypot(x - SPOTS.lake[0], z - SPOTS.lake[1]); if (lk < 13) h -= Math.pow(1 - lk / 13, 1.3) * 4.4;
  const hl = Math.hypot(x - SPOTS.hill[0], z - SPOTS.hill[1]); if (hl < 15) h += Math.pow(1 - hl / 15, 2) * 9;
  const rk = Math.hypot(x - 44, z + 22); if (rk < 10) h += Math.pow(1 - rk / 10, 1.2) * 13;   // steep rocks to climb
  // the strange mountain on the horizon: its top is cut perfectly flat, as if with a ruler
  const mt = smooth(-58, -78, z) * (1 - smooth(-96, -112, z)) * (1 - smooth(45, 70, Math.abs(x)));
  if (mt > 0) h = Math.max(h, Math.min(h + mt * 40, 17));
  return h;
}
// the four outer lands (east, south, west, north) and how strong they are
export const ZONES = {
  core: { name: 'Songwood Forest', sub: 'Rootlight', lv: [1, 8], color: '#3ddc84' },
  wastes: { name: 'Ember Wastes', sub: 'Land of fire and ash', lv: [10, 25], color: '#ff7a1a', dir: 0 },
  swamp: { name: 'Gloomfen Swamp', sub: 'Where the dead trees whisper', lv: [18, 32], color: '#7ad83a', dir: Math.PI / 2 },
  frost: { name: 'Frostveil Tundra', sub: 'The land of endless winter', lv: [14, 28], color: '#9fe8ff', dir: Math.PI },
  peaks: { name: 'Shattered Peaks', sub: 'The broken sky', lv: [30, 50], color: '#b48cff', dir: -Math.PI / 2 },
};
const OUTER = ['wastes', 'swamp', 'frost', 'peaks'];
function zoneWeights(x, z) {
  const a = Math.atan2(z, x), w = {}; let sum = 0;
  for (const k of OUTER) { let d = Math.abs(((a - ZONES[k].dir) + Math.PI * 3) % (Math.PI * 2) - Math.PI); const v = Math.pow(Math.max(0, Math.cos(d)), 3); w[k] = v; sum += v; }
  for (const k of OUTER) w[k] /= sum || 1;
  return w;
}
export function outerAmount(x, z) { return smooth(CORE, CORE + 32, Math.max(Math.abs(x), Math.abs(z))); }
export function zoneOf(x, z) {
  if (outerAmount(x, z) < 0.5) return 'core';
  const w = zoneWeights(x, z); return OUTER.reduce((b, k) => w[k] > w[b] ? k : b, OUTER[0]);
}
export function zoneLevel(x, z) {
  const zn = zoneOf(x, z), Z = ZONES[zn];
  if (zn === 'core') return Math.max(1, Math.min(8, Math.round(1 + Math.hypot(x, z - 50) / 14)));
  const t = Math.min(1, Math.max(0, (Math.max(Math.abs(x), Math.abs(z)) - CORE - 20) / (HALF - CORE - 40)));
  return Math.round(Z.lv[0] + (Z.lv[1] - Z.lv[0]) * t);
}
const OUTER_H = {
  wastes: (x, z) => 1.2 + Math.sin(x * 0.025) * 1.8 + Math.sin((x + z) * 0.04) * 1.2 + Math.abs(Math.sin(z * 0.02)) * 2.5 + Math.pow(Math.max(0, Math.sin(x * 0.011) * Math.cos(z * 0.013)), 3) * 14,
  swamp: (x, z) => WATER + 0.55 + Math.sin(x * 0.06) * 0.9 + Math.cos(z * 0.07) * 0.9 + Math.sin((x - z) * 0.03) * 0.6,
  frost: (x, z) => 2 + Math.sin(x * 0.03) * 2.5 + Math.cos(z * 0.035) * 2 + Math.sin((x - z) * 0.05) + Math.pow(Math.max(0, Math.cos(x * 0.012) * Math.sin(z * 0.017)), 2) * 12,
  peaks: (x, z) => 6 + Math.pow(Math.abs(Math.sin(x * 0.03) * Math.cos(z * 0.025)), 1.4) * 30 + Math.sin(x * 0.1) * 1.4 + Math.cos(z * 0.08),
};
export function terrainHeight(x, z) {
  const t = outerAmount(x, z);
  let h = t < 1 ? coreHeight(x, z) : 0;
  if (t > 0) { const w = zoneWeights(x, z); let o = 0; for (const k of OUTER) if (w[k] > 0.001) o += OUTER_H[k](x, z) * w[k]; h = h * (1 - t) + o * t; }
  const river = Math.abs(z); if (river < 9 && Math.abs(x) < CORE + 40) h -= Math.pow(1 - river / 9, 1.6) * 3.6 * (1 - smooth(CORE + 10, CORE + 40, Math.abs(x)));
  const edge = Math.max(0, (Math.max(Math.abs(x), Math.abs(z)) - (HALF - 14)) / 12); h += edge * edge * 14;
  return h;
}
const ZCOL = {
  wastes: (x, z, y) => y < 0.6 ? '#3a1a0e' : ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? '#c9763a' : '#b8682f',
  swamp: (x, z, y) => ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? '#3a5a2e' : '#2f4a28',
  frost: (x, z, y) => ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? '#eef4fa' : '#dbe7f2',
  peaks: (x, z, y) => y > 28 ? '#f4f6fa' : y > 14 ? '#7a7488' : ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? '#5c5a6e' : '#6a6680',
};

// ------------------------------------------------------------------ build the world
export function buildWorld(scene) {
  const W2 = {};
  const seg = 400;
  const g = new THREE.PlaneGeometry(W, W, seg, seg); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, cols = [], c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = terrainHeight(x, z); pos.setY(i, y);
    const path = Math.abs(x - Math.sin(z * 0.08) * 1.5) < 2.2 && z > 9 && z < 60;
    const zn = zoneOf(x, z);
    if (zn !== 'core' && y >= WATER + 0.25) c.set(ZCOL[zn](x, z, y));
    else if (y < WATER + 0.25) c.set(zn === 'swamp' ? '#2a3a22' : '#d9c27a');
    else if (path) c.set('#d8b77a');
    else if (y > 15.5) c.set('#e9edf2');
    else if (y > 7) c.set('#8c877f');
    else if (z > 38) c.set(((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? '#76c25a' : '#7ccb60');
    else c.set(((Math.floor(x) + Math.floor(z)) & 1) ? '#4f9e3a' : '#57a842');
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92 }));
  ground.receiveShadow = true; scene.add(ground);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshStandardMaterial({ color: '#3b9fe8', transparent: true, opacity: 0.74, roughness: 0.08, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = WATER; scene.add(water);
  W2.water = water;
  const R = (() => { let s = 4242; return () => (s = s * 16807 % 2147483647) / 2147483647; })();
  const at = (x, z) => terrainHeight(x, z);
  const props = new THREE.Group(); scene.add(props);
  const near = (x, z, list, r) => list.some(([a, b]) => Math.hypot(x - a, z - b) < r);
  const keep = [SPOTS.lab, SPOTS.camp, SPOTS.start, SPOTS.green, SPOTS.cage, SPOTS.rootlock, SPOTS.pylonA, SPOTS.pylonB];

  // metal-leaf trees, normal trees, sound mushrooms, bell flowers, moss gears
  W2.mushrooms = []; W2.bells = [];
  for (let i = 0; i < 420; i++) {
    const x = (R() - 0.5) * 160, z = (R() - 0.5) * 160, y = at(x, z);
    if (y < WATER + 0.5 || y > 7 || near(x, z, keep, 9)) continue;
    if (Math.abs(x - Math.sin(z * 0.08) * 1.5) < 4 && z > 9 && z < 60) continue;                    // keep the path clear
    if (z > 36 && R() < 0.75) continue;                                                              // the village is open
    const k = R();
    const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = R() * 6; props.add(grp);
    if (k < 0.42) {
      const s = 0.9 + R() * 0.9, metal = R() < 0.4;
      bx(grp, 0.55 * s, 2.4 * s, 0.55 * s, '#6e4524', 0, 1.2 * s, 0);
      const leaf = metal ? mat('#b8d8c4', { m: 0.45, r: 0.3 }) : mat(R() < 0.5 ? '#3f8a2e' : '#2f7a3a');
      bx(grp, 2.4 * s, 1.6 * s, 2.4 * s, leaf, 0, 3.1 * s, 0); bx(grp, 1.5 * s, 1.0 * s, 1.5 * s, metal ? mat('#d5ecdf', { m: 0.5, r: 0.25 }) : mat('#5cb043'), 0.2, 4.1 * s, -0.1);
      if (metal) for (let j = 0; j < 3; j++) bx(grp, 0.35, 0.05, 0.25, mat('#e8f4ee', { m: 0.6, r: 0.2 }), (R() - .5) * 2 * s, 2.2 * s, (R() - .5) * 2 * s).rotation.z = R();
    } else if (k < 0.6) {
      const m = new THREE.Group(); grp.add(m);
      bx(m, 0.22, 0.5, 0.22, '#f3e6c8', 0, 0.25, 0);
      const col = R() < 0.5 ? '#ff5ad6' : '#5ae0ff';
      const cap = bx(m, 0.8, 0.28, 0.8, mat(col, { e: col, ei: 0.25 }), 0, 0.6, 0);
      W2.mushrooms.push({ x, z, y, cap, col, open: 0, cool: 0 });
    } else if (k < 0.72) {
      bx(grp, 0.05, 0.5, 0.05, '#3f7a26', 0, 0.25, 0);
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.2, 10), mat('#ffd34d', { m: 0.5, r: 0.3 }));
      bell.position.y = 0.55; bell.castShadow = true; grp.add(bell); W2.bells.push(bell);
      for (let j = 0; j < 4; j++) { const l = bx(grp, 0.12, 0.03, 0.3, '#4fae3e', 0, 0.62, 0); l.rotation.y = j * 1.57; l.rotation.x = 0.5; }
    } else if (k < 0.8) {
      const gear = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.18, 6, 14), mat('#8a7a5a', { m: 0.3 }));
      gear.position.y = 0.35; gear.rotation.x = Math.PI / 2 - 0.25; gear.castShadow = true; grp.add(gear);
      for (let j = 0; j < 8; j++) { const a = j / 8 * 6.28; bx(grp, 0.22, 0.18, 0.22, '#7a6a4a', Math.cos(a) * 0.9, 0.4, Math.sin(a) * 0.9); }
      bx(grp, 0.7, 0.1, 0.5, '#5aa84a', 0.2, 0.55, 0.1);                                      // moss
    } else if (k < 0.9) {
      bx(grp, 1.0, 0.6, 0.8, '#8c8a86', 0, 0.3, 0); bx(grp, 0.6, 0.4, 0.5, '#a8a5a0', 0.1, 0.75, 0);
    } else {
      bx(grp, 0.7, 0.5, 0.7, '#4c9a34', 0, 0.25, 0); bx(grp, 0.5, 0.35, 0.5, '#5cb043', 0.1, 0.6, 0);
    }
  }
  // pools that show the night sky even in daytime
  W2.nightPools = [];
  for (const [x, z] of [[22, 30], [-12, 28], [28, -30]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: '#0b1640' }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, at(x, z) + 0.06, z); props.add(p);
    for (let k = 0; k < 9; k++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.05, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); s.rotation.x = -Math.PI / 2; s.position.set(x + (R() - .5) * 2.2, at(x, z) + 0.07, z + (R() - .5) * 2.2); props.add(s); W2.nightPools.push(s); }
  }

  // ---------------- village Rrënjëdritë: houses, Professor Green's lab (half greenhouse, half workshop, inside a giant tree's roots)
  const houses = [[-8, 58, '#d64545'], [-14, 64, '#2f7fe0'], [22, 62, '#ffb02a'], [-30, 58, '#8a5ad6']];
  for (const [x, z, roof] of houses) {
    const h = new THREE.Group(); h.position.set(x, at(x, z), z); props.add(h);
    bx(h, 4, 2.6, 3.4, '#f0e2c4', 0, 1.3, 0); bx(h, 1, 1.7, 0.1, '#6e4524', 0, 0.85, 1.72);
    bx(h, 0.8, 0.7, 0.1, '#9fd8ff', -1.2, 1.6, 1.72); bx(h, 0.8, 0.7, 0.1, '#9fd8ff', 1.2, 1.6, 1.72);
    const r = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.8, 4), mat(roof)); r.position.y = 3.5; r.rotation.y = Math.PI / 4; r.castShadow = true; h.add(r);
  }
  const lab = new THREE.Group(); lab.position.set(SPOTS.lab[0], at(...SPOTS.lab), SPOTS.lab[1]); props.add(lab);
  bx(lab, 3.2, 12, 3.2, '#6e4524', 0, 6, -3);                                                            // giant tree trunk
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const r = bx(lab, 0.9, 0.9, 5, '#5a3a1c', Math.cos(a) * 2.6, 0.3, -3 + Math.sin(a) * 2.6); r.rotation.y = -a; r.rotation.x = 0.25; }
  bx(lab, 10, 5, 10, '#2f8a3a', 0, 13, -3); bx(lab, 7, 3, 7, '#4fb84a', 1, 16, -3); bx(lab, 5, 2.5, 6, '#3fa34d', -3, 11.5, -1);
  bx(lab, 6, 3.4, 4.5, mat('#bfefff', { op: 0.38, r: 0.05 }), -3.2, 1.7, 1.5);                          // greenhouse
  for (const [x, y] of [[-6.2, 1.7], [-0.2, 1.7]]) bx(lab, 0.15, 3.4, 4.6, '#3fa34d', x, y, 1.5);
  bx(lab, 6.2, 0.15, 4.6, '#3fa34d', -3.2, 3.45, 1.5);
  for (let i = 0; i < 6; i++) bx(lab, 0.5, 0.6, 0.5, ['#ff7eb6', '#ffd34d', '#5cb043'][i % 3], -5.4 + i * 0.9, 0.4, 1.5);
  bx(lab, 4.5, 3, 4, '#c99a5a', 3.4, 1.5, 1.2); bx(lab, 1.2, 2, 0.1, '#5a3a1c', 3.4, 1, 3.22);              // workshop
  const lg = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 6, 14), mat('#b0b8c4', { m: 0.4 })); lg.position.set(5.6, 2.4, 3.3); lab.add(lg); W2.labGear = lg;
  bx(lab, 3, 0.6, 0.2, '#ffd34d', 0, 3.8, 3.3);                                                         // sign
  W2.lab = lab;

  // ---------------- camp: tent, fire, stools
  const camp = new THREE.Group(); camp.position.set(SPOTS.camp[0], at(...SPOTS.camp), SPOTS.camp[1]); props.add(camp);
  const tent = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.6, 4), mat('#2f7fe0')); tent.position.set(-3, 1.3, -2); tent.rotation.y = Math.PI / 4; tent.castShadow = true; camp.add(tent);
  bx(camp, 0.8, 1.2, 0.1, '#0b1a3a', -3, 0.6, -0.5);
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; bx(camp, 0.4, 0.3, 0.4, '#8c8a86', 3 + Math.cos(a) * 1, 0.15, 1 + Math.sin(a) * 1); }
  const fire = bx(camp, 0.7, 0.9, 0.7, mat('#ffb02a', { e: '#ff7a1a', ei: 2 }), 3, 0.55, 1); W2.fire = fire;
  const fl = new THREE.PointLight(0xff9a3a, 3, 12, 1.5); fl.position.set(3, 1.5, 1); camp.add(fl);
  for (const [x, z] of [[1, 2.5], [5, 2.5], [3, -1]]) bx(camp, 0.8, 0.4, 0.8, '#8a5a2b', x, 0.2, z);

  // ---------------- the root bridge over the river (folds during the story)
  const bridge = new THREE.Group(); bridge.position.set(0, 0, 0); props.add(bridge);
  W2.bridgePlanks = [];
  for (let i = 0; i < 9; i++) {
    const piv = new THREE.Group(); piv.position.set(0, 0.35, -8 + i * 2); bridge.add(piv);
    bx(piv, 4.4, 0.3, 1.9, i % 2 ? '#7a4a24' : '#6a3f1e', 0, 0, 0);
    bx(piv, 0.3, 0.6, 1.9, '#5a3a1c', -2.2, 0.35, 0); bx(piv, 0.3, 0.6, 1.9, '#5a3a1c', 2.2, 0.35, 0);
    W2.bridgePlanks.push(piv);
  }
  W2.bridge = bridge;
  W2.bridgeState = 1;          // 1 open, 0 folded
  // ------------------------------------------------ the outer lands: props (instanced, so thousands stay fast)
  const spot = (zone, minH = WATER + 0.3, maxH = 99, tries = 60) => { for (let k = 0; k < tries; k++) { const x = (R() - 0.5) * (W - 40), z = (R() - 0.5) * (W - 40); if (zoneOf(x, z) !== zone || outerAmount(x, z) < 0.95) continue; const y = at(x, z); if (y < minH || y > maxH) continue; return [x, y, z]; } return null; };
  const inst = (geo, material, n, zone, place) => {
    const m = new THREE.InstancedMesh(geo, material, n), d = new THREE.Object3D(); let c = 0;
    for (let k = 0; k < n; k++) { const p = spot(zone, place.minH, place.maxH); if (!p) continue; d.position.set(p[0], p[1] + (place.dy || 0), p[2]); d.rotation.set(place.tilt ? (R() - 0.5) * place.tilt : 0, R() * 6.28, place.tilt ? (R() - 0.5) * place.tilt : 0); const sc = place.s[0] + R() * (place.s[1] - place.s[0]); d.scale.set(sc * (place.sx || 1), sc * (place.sy || 1), sc * (place.sx || 1)); d.updateMatrix(); m.setMatrixAt(c++, d.matrix); }
    m.count = c; m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
  };
  const box = (w, h, d2, y = h / 2) => { const g2 = new THREE.BoxGeometry(w, h, d2); g2.translate(0, y, 0); return g2; };
  const coneG = (r, h, sides = 6) => { const g2 = new THREE.ConeGeometry(r, h, sides); g2.translate(0, h / 2, 0); return g2; };
  // Ember Wastes: cacti, obsidian spikes, glowing lava pools, bones
  inst(box(0.6, 3, 0.6), mat('#3f8a3a'), 260, 'wastes', { s: [0.7, 1.5], minH: 0.8, maxH: 12 });
  inst(box(1.6, 0.5, 0.5, 1.6), mat('#3f8a3a'), 260, 'wastes', { s: [0.7, 1.5], minH: 0.8, maxH: 12 });
  inst(coneG(0.8, 4, 5), mat('#2a1838', { e: '#ff5a1a', ei: 0.25, r: 0.25, m: 0.4 }), 320, 'wastes', { s: [0.6, 2.2], tilt: 0.5 });
  inst(new THREE.CylinderGeometry(2.6, 2.6, 0.12, 18), mat('#ff6a1a', { e: '#ff4a00', ei: 2.2 }), 70, 'wastes', { s: [0.6, 1.8], dy: 0.08, minH: 0.2, maxH: 3 });
  inst(box(1.8, 0.25, 0.3), mat('#efe6cf'), 160, 'wastes', { s: [0.6, 1.4], tilt: 0.4 });
  // Gloomfen Swamp: dead trees, glowing mushrooms, reeds, lily pads
  inst(box(0.5, 5, 0.5), mat('#3a2a1c'), 340, 'swamp', { s: [0.8, 1.8], tilt: 0.25, minH: WATER - 0.2 });
  inst(box(2.4, 0.3, 0.3, 4), mat('#3a2a1c'), 340, 'swamp', { s: [0.8, 1.8], minH: WATER - 0.2 });
  inst(coneG(0.7, 0.6, 10), mat('#b45aff', { e: '#9a3aff', ei: 1.6 }), 380, 'swamp', { s: [0.5, 1.4], dy: 0.4, minH: WATER });
  inst(box(0.08, 1.4, 0.08), mat('#5a7a3a'), 900, 'swamp', { s: [0.6, 1.4], tilt: 0.4, minH: WATER - 0.6 });
  inst(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 10), mat('#4f9e3a'), 260, 'swamp', { s: [0.6, 1.4], dy: WATER + 0.03, minH: -99, maxH: WATER - 0.1 });
  // Frostveil Tundra: snowy pines, ice spikes, snowmen-like rock heaps
  inst(coneG(1.6, 4.5, 6), mat('#1f4a3a'), 420, 'frost', { s: [0.8, 1.8], dy: 1 });
  inst(coneG(1.2, 2.2, 6), mat('#f4f8ff'), 420, 'frost', { s: [0.8, 1.8], dy: 3.6 });
  inst(coneG(0.6, 4, 5), mat('#bff3ff', { e: '#4ad8ff', ei: 0.4, op: 0.85, r: 0.1, m: 0.2 }), 300, 'frost', { s: [0.6, 2.2], tilt: 0.6 });
  inst(new THREE.SphereGeometry(1, 8, 6), mat('#e8f0f8'), 140, 'frost', { s: [0.6, 1.6], sy: 0.6 });
  // Shattered Peaks: crystals, floating rocks, sharp spires
  inst(new THREE.OctahedronGeometry(1), mat('#b48cff', { e: '#8a5aff', ei: 1.4, r: 0.1, m: 0.3 }), 260, 'peaks', { s: [0.7, 2.2], sy: 1.8, dy: 1.2, tilt: 0.6 });
  inst(new THREE.OctahedronGeometry(1), mat('#6fe3ff', { e: '#3ad0ff', ei: 1.4, r: 0.1, m: 0.3 }), 200, 'peaks', { s: [0.6, 1.8], sy: 1.8, dy: 1.2, tilt: 0.6 });
  inst(new THREE.DodecahedronGeometry(1.6), mat('#5c5a6e'), 120, 'peaks', { s: [0.8, 2.2], dy: 12, minH: 3 });
  inst(coneG(1.4, 9, 5), mat('#4a4658'), 160, 'peaks', { s: [0.7, 1.6] });
  // ------------------------------------------------ one landmark in every land
  W2.landmarks = [];
  const landmark = (zone, name, build) => { const p = spot(zone, 0.5, 30, 400) || [ZONES[zone].dir === 0 ? 200 : 0, 0, 0]; const gL = new THREE.Group(); gL.position.set(p[0], p[1], p[2]); build(gL); props.add(gL); W2.landmarks.push({ zone, name, x: p[0], z: p[2] }); };
  landmark('wastes', 'Ember Altar', (gL) => { for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; bx(gL, 1.2, 7 + (k % 3) * 2, 1.2, mat('#2a1838', { e: '#ff5a1a', ei: 0.4 }), Math.cos(a) * 9, 4, Math.sin(a) * 9); } const f = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.4, 1, 16), mat('#ff6a1a', { e: '#ff4a00', ei: 2.5 })); f.position.y = 0.5; gL.add(f); });
  landmark('frost', 'Frozen Titan', (gL) => { const ice = mat('#bff3ff', { e: '#4ad8ff', ei: 0.5, op: 0.8 }); bx(gL, 6, 9, 4, ice, 0, 4.5, 0); bx(gL, 4, 4, 4, ice, 0, 11, 0); bx(gL, 2, 8, 2, ice, -4.2, 5, 0); bx(gL, 2, 8, 2, ice, 4.2, 5, 0); for (const sd of [-1, 1]) bx(gL, 0.8, 0.5, 0.2, mat('#ff2a14', { e: '#ff2a14', ei: 3 }), sd * 0.9, 11.4, 2.05); });
  landmark('swamp', 'Witch Hut', (gL) => { for (const [x2, z2] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) bx(gL, 0.4, 3, 0.4, '#3a2a1c', x2, 1.5, z2); bx(gL, 5, 3, 5, '#4a3a2a', 0, 4.5, 0); const r2 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 4, 4), mat('#2a1a10')); r2.position.y = 8; r2.rotation.y = Math.PI / 4; gL.add(r2); bx(gL, 1, 1, 0.1, mat('#b45aff', { e: '#b45aff', ei: 2 }), 0, 4.6, 2.55); });
  landmark('peaks', 'Sky Shrine', (gL) => { bx(gL, 10, 1, 10, '#4a4658', 0, 0.5, 0); for (const sd of [-1, 1]) bx(gL, 1.4, 10, 1.4, '#6a6680', sd * 3.5, 5.5, 0); bx(gL, 9, 1.2, 1.6, '#6a6680', 0, 11, 0); const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.25, 8, 32), mat('#b48cff', { e: '#b48cff', ei: 2.5 })); ring2.position.y = 5.5; gL.add(ring2); W2.shrineRing = ring2; });
  // ------------------------------------------------ chest spots: more and richer far away
  W2.chests = [];
  const addChest = (zone, n) => { for (let k = 0; k < n; k++) { const p = zone === 'core' ? (() => { for (let q = 0; q < 80; q++) { const x = (R() - 0.5) * 170, z = (R() - 0.5) * 170, y = at(x, z); if (y > WATER + 0.4 && y < 6 && Math.hypot(x, z - 50) > 18 && Math.abs(z) > 10) return [x, y, z]; } return null; })() : spot(zone, WATER + 0.3, 30); if (p) W2.chests.push({ id: zone + k, zone, x: p[0], y: p[1], z: p[2] }); } };
  addChest('core', 8); addChest('wastes', 9); addChest('swamp', 9); addChest('frost', 9); addChest('peaks', 9);

  // ---------------- skyline: the straight-cut mountain gets a faint golden line on its cut
  const cut = new THREE.Mesh(new THREE.BoxGeometry(80, 0.15, 6), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.6 }));
  cut.position.set(0, 17.1, -74); props.add(cut);
  return W2;
}

// ground height including the bridge deck while it is open
export function groundAt(W2, x, z) {
  const h = terrainHeight(x, z);
  if (W2 && W2.bridgeState > 0.9 && Math.abs(x) < 2.3 && Math.abs(z) < 9.2) return Math.max(h, 0.5);
  return h;
}

// ------------------------------------------------------------------ people (original blocky humans)
export function buildPerson(look) {
  const L = {
    green: { skin: '#f1c27d', hair: '#3fbf5a', coat: '#f5f5f5', shirt: '#2f8a3a', pants: '#3a3a3a', glasses: true, coatLong: true },
    nira: { skin: '#d9a066', hair: '#2b1d12', coat: '#e07a2a', shirt: '#2f4f8f', pants: '#5a4a3a', hat: '#2f6a3a' },
    villager: { skin: '#ffdcb8', hair: '#a0662b', coat: '#8a5ad6', shirt: '#ffd34d', pants: '#2f4f8f' },
  }[look] || {};
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const legs = [], arms = [];
  for (const s of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.62, 0); body.add(hip); bx(hip, 0.22, 0.6, 0.24, L.pants, 0, -0.3, 0); bx(hip, 0.24, 0.12, 0.32, '#2b1d12', 0, -0.58, 0.04); legs.push(hip); }
  bx(body, 0.52, 0.52, 0.3, L.shirt, 0, 0.9, 0);
  if (L.coatLong) { bx(body, 0.56, 0.9, 0.32, L.coat, 0, 0.72, -0.02); bx(body, 0.2, 0.4, 0.02, L.shirt, 0, 0.98, 0.15); }
  else bx(body, 0.56, 0.5, 0.32, L.coat, 0, 0.92, -0.02);
  for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * 0.36, 1.12, 0); body.add(sh); bx(sh, 0.16, 0.5, 0.2, L.coat, 0, -0.22, 0); bx(sh, 0.14, 0.12, 0.16, L.skin, 0, -0.5, 0); arms.push(sh); }
  const head = new THREE.Group(); head.position.y = 1.42; body.add(head);
  bx(head, 0.46, 0.44, 0.42, L.skin, 0, 0, 0);
  bx(head, 0.5, 0.16, 0.46, L.hair, 0, 0.24, 0); bx(head, 0.5, 0.3, 0.1, L.hair, 0, 0.1, -0.2);
  if (look === 'green') for (let k = -2; k <= 2; k++) bx(head, 0.1, 0.18, 0.1, L.hair, k * 0.1, 0.36, (k % 2) * 0.05);
  if (L.hat) { bx(head, 0.5, 0.14, 0.46, L.hat, 0, 0.32, 0); bx(head, 0.62, 0.04, 0.58, L.hat, 0, 0.26, 0); }
  for (const s of [-1, 1]) { bx(head, 0.08, 0.08, 0.02, '#1b1208', s * 0.1, 0.03, 0.215); if (L.glasses) bx(head, 0.16, 0.12, 0.02, mat('#bfefff', { op: 0.5 }), s * 0.11, 0.03, 0.225); }
  bx(head, 0.14, 0.03, 0.02, '#7a2a3a', 0, -0.1, 0.215);
  g.userData.parts = { legs, arms, head, body };
  return g;
}
