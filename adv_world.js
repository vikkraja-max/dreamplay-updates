/* WILDFOLD - the world of Virelia, first region: Pylli i Tingujve with the village Rrënjëdritë.
   Terrain, water, the root bridge, Professor Green's lab, the camp and the strange beautiful details. */
import * as THREE from './lib/three.module.min.js';
import { bx, mat } from './adv_mons.js';

export const W = 190, HALF = W / 2, WATER = -0.8;
export const SPOTS = {
  start: [0, 66], lab: [13, 50], green: [9, 45], camp: [-20, 46], tent: [-23, 44], fire: [-17, 47],
  bridge: [0, 0], cage: [4, 13], rootlock: [0, 11.5], pylonA: [-7, 14], pylonB: [7, 14],
  lake: [-40, 22], hill: [36, 20], mountain: [0, -78],
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------ height field
export function terrainHeight(x, z) {
  let h = Math.sin(x * 0.07) * 0.7 + Math.cos(z * 0.06) * 0.6 + Math.sin((x - z) * 0.12) * 0.35 + 0.8;
  h = h * (1 - smooth(34, 44, z)) + 0.6 * smooth(34, 44, z);                               // flat village
  const river = Math.abs(z); if (river < 9) h -= Math.pow(1 - river / 9, 1.6) * 3.6;          // the river (west-east)
  const lk = Math.hypot(x - SPOTS.lake[0], z - SPOTS.lake[1]); if (lk < 13) h -= Math.pow(1 - lk / 13, 1.3) * 4.4;
  const hl = Math.hypot(x - SPOTS.hill[0], z - SPOTS.hill[1]); if (hl < 15) h += Math.pow(1 - hl / 15, 2) * 9;
  const rk = Math.hypot(x - 44, z + 22); if (rk < 10) h += Math.pow(1 - rk / 10, 1.2) * 13;   // steep rocks to climb
  // the strange mountain on the horizon: its top is cut perfectly flat, as if with a ruler
  const mt = smooth(-58, -78, z) * (1 - smooth(45, 70, Math.abs(x)));
  if (mt > 0) h = Math.max(h, Math.min(h + mt * 40, 17 + Math.sin(x * 0.2) * 0.0));
  const edge = Math.max(0, (Math.max(Math.abs(x), Math.abs(z)) - (HALF - 14)) / 12); h += edge * edge * 14;
  return h;
}

// ------------------------------------------------------------------ build the world
export function buildWorld(scene) {
  const W2 = {};
  const seg = 190;
  const g = new THREE.PlaneGeometry(W, W, seg, seg); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, cols = [], c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = terrainHeight(x, z); pos.setY(i, y);
    const path = Math.abs(x - Math.sin(z * 0.08) * 1.5) < 2.2 && z > 9 && z < 60;
    if (y < WATER + 0.25) c.set('#d9c27a');
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
    const x = (R() - 0.5) * (W - 30), z = (R() - 0.5) * (W - 30), y = at(x, z);
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
