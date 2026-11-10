/* dreamPlay 3D: a blocky, toy-like 3D view of the same map and game state (three.js r170, MIT).
   All gameplay stays in app.js; this module only draws what app.js already computes and turns mouse
   positions into tiles. Every model here is an original design built from boxes. */
import * as THREE from './lib/three.module.min.js';

const R3D = { ready: false };
window.R3D = R3D;

let H;                     // helpers from app.js (grid size, defs, ...)
let renderer, scene, camera, wrap, world, decorGroup, groundGroup, dynGroup, fxGroup;
let hemi, sun, moon, ambient;
const pointLights = [];
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let terrainKey = '', decorKey = '';
let hoverBox, rangeRing, routeDots = [];
const cam = { az: 0.0, pol: 0.86, dist: 21, tx: 0, tz: 0.8 };

// ------------------------------------------------------------------ small helpers
const mats = new Map();
function M(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) {
    mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.65, metalness: o.metal ?? 0,
      emissive: o.emissive ? new THREE.Color(o.emissive) : new THREE.Color(0), emissiveIntensity: o.ei ?? 1,
      transparent: !!o.opacity, opacity: o.opacity ?? 1, flatShading: !!o.flat }));
  }
  return mats.get(k);
}
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, color, x = 0, y = 0, z = 0, o) {
  const m = new THREE.Mesh(boxGeo, color instanceof THREE.Material ? color : M(color, o));
  m.scale.set(w, h, d); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 8, o) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(color, o));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
const wx = (tx) => tx - H.COLS / 2 + 0.5;
const wz = (ty) => ty - H.ROWS / 2 + 0.5;
const fromPx = (px, py) => [px / H.T - H.COLS / 2, py / H.T - H.ROWS / 2];
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }

// ------------------------------------------------------------------ faces (canvas textures)
const faceCache = new Map();
function faceTex(kind, a = '#e08a12', b = '#ff3b2f') {
  const k = kind + a + b;
  if (faceCache.has(k)) return faceCache.get(k);
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(0,0,0,0)'; c.fillRect(0, 0, 128, 128);
  if (kind === 'hero') {
    for (const sx of [40, 88]) {
      c.fillStyle = '#fff'; c.strokeStyle = '#1f3a1c'; c.lineWidth = 4;
      c.beginPath(); c.ellipse(sx, 54, 17, 21, 0, 0, 7); c.fill(); c.stroke();
      const g = c.createRadialGradient(sx, 48, 2, sx, 58, 15); g.addColorStop(0, '#ffe9a0'); g.addColorStop(1, a);
      c.fillStyle = g; c.beginPath(); c.ellipse(sx + 2, 58, 12, 15, 0, 0, 7); c.fill();
      c.fillStyle = '#1b1208'; c.beginPath(); c.ellipse(sx + 2, 60, 6, 8, 0, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(sx - 4, 50, 4.5, 0, 7); c.fill(); c.beginPath(); c.arc(sx + 6, 66, 2, 0, 7); c.fill();
    }
    c.fillStyle = '#7a2a3a'; c.strokeStyle = '#1f3a1c'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(48, 86); c.quadraticCurveTo(64, 110, 80, 86); c.quadraticCurveTo(64, 92, 48, 86); c.fill(); c.stroke();
    c.fillStyle = '#ff8fa6'; c.beginPath(); c.ellipse(64, 98, 7, 4, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,120,140,.45)'; c.beginPath(); c.ellipse(22, 84, 9, 5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(106, 84, 9, 5, 0, 0, 7); c.fill();
  } else {
    // villain face: yellow eyes with glowing iris + slit pupil, heavy brows, jagged grin
    for (const [sx, sd] of [[40, -1], [88, 1]]) {
      c.fillStyle = '#ffe9a8'; c.strokeStyle = '#2b1d12'; c.lineWidth = 4;
      c.beginPath(); c.ellipse(sx, 56, 17, 14, sd * 0.25, 0, 7); c.fill(); c.stroke();
      c.shadowColor = b; c.shadowBlur = 10; c.fillStyle = b;
      c.beginPath(); c.ellipse(sx + sd * 2, 57, 10, 10, 0, 0, 7); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#1b0f08'; c.beginPath(); c.ellipse(sx + sd * 2, 57, 2.5, 9, 0, 0, 7); c.fill();
      c.fillStyle = '#2b1d12'; c.beginPath();
      c.moveTo(sx - sd * 20, 34); c.lineTo(sx + sd * 18, 48); c.lineTo(sx + sd * 19, 40); c.lineTo(sx - sd * 19, 27); c.closePath(); c.fill();
    }
    c.fillStyle = '#3a0a10'; c.strokeStyle = '#2b1d12'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(36, 84); c.quadraticCurveTo(64, 118, 92, 84); c.quadraticCurveTo(64, 94, 36, 84); c.fill(); c.stroke();
    c.fillStyle = '#fffbe8';
    for (let i = 0; i < 6; i++) { const x0 = 42 + i * 9; c.beginPath(); c.moveTo(x0 - 4, 87); c.lineTo(x0, 97); c.lineTo(x0 + 4, 87); c.closePath(); c.fill(); }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  faceCache.set(k, tex);
  return tex;
}
function facePlane(tex, w, h, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.position.z = z;
  return m;
}

// ------------------------------------------------------------------ init
R3D.init = function (container, helpers) {
  H = helpers; wrap = container;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.id = 'stage3d';
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  world = new THREE.Group(); scene.add(world);
  groundGroup = new THREE.Group(); decorGroup = new THREE.Group(); dynGroup = new THREE.Group(); fxGroup = new THREE.Group();
  world.add(groundGroup, decorGroup, dynGroup, fxGroup);

  hemi = new THREE.HemisphereLight(0xdff2ff, 0x5a7a3a, 1.1); scene.add(hemi);
  ambient = new THREE.AmbientLight(0xffffff, 0.25); scene.add(ambient);
  sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(-10, 18, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 50 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  moon = new THREE.DirectionalLight(0x6f8cff, 0.0); moon.position.set(8, 14, -6); scene.add(moon);
  for (let i = 0; i < 10; i++) { const p = new THREE.PointLight(0xffaa55, 0, 6, 1.6); scene.add(p); pointLights.push(p); }

  hoverBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.06, 1)), new THREE.LineBasicMaterial({ color: 0x6fe3ff }));
  hoverBox.visible = false; scene.add(hoverBox);
  rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0x50b4ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  rangeRing.rotation.x = -Math.PI / 2; rangeRing.visible = false; scene.add(rangeRing);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: 0x50b4ff, transparent: true, opacity: 0.12, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; rangeRing.add(disc); disc.rotation.x = 0;

  // camera: right/middle drag rotates, wheel zooms; left button stays for painting
  let drag = null;
  const el = renderer.domElement;
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('pointerdown', (e) => { if (e.button === 1 || e.button === 2) { drag = { x: e.clientX, y: e.clientY, az: cam.az, pol: cam.pol }; el.setPointerCapture(e.pointerId); } });
  el.addEventListener('pointermove', (e) => { if (!drag) return; cam.az = drag.az - (e.clientX - drag.x) * 0.008; cam.pol = Math.min(1.35, Math.max(0.35, drag.pol - (e.clientY - drag.y) * 0.006)); });
  el.addEventListener('pointerup', () => drag = null);
  el.addEventListener('wheel', (e) => { e.preventDefault(); cam.dist = Math.min(40, Math.max(9, cam.dist * (e.deltaY > 0 ? 1.08 : 0.93))); }, { passive: false });
  R3D.ready = true;
  R3D.resize();
};

R3D.rotate = (d) => { cam.az += d; };
R3D.resetCam = () => Object.assign(cam, { az: 0, pol: 0.86, dist: 21 });

R3D.resize = function () {
  if (!renderer) return;
  const r = wrap.getBoundingClientRect();
  const w = Math.max(100, Math.floor(r.width - 4)), h = Math.max(100, Math.floor(r.height - 4));
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
  camera.aspect = w / h; camera.updateProjectionMatrix();
};

R3D.pickTile = function (ev) {
  if (!renderer) return null;
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(groundPlane, p)) return null;
  const x = Math.floor(p.x + H.COLS / 2), y = Math.floor(p.z + H.ROWS / 2);
  return x >= 0 && y >= 0 && x < H.COLS && y < H.ROWS ? { x, y } : null;
};

// ------------------------------------------------------------------ terrain (blocks)
const LAND = { g: ['#62b047', '#7a5a34'], f: ['#86c75c', '#7a5a34'], s: ['#e2c27a', '#c9a060'], d: ['#7a4a2c', '#5c3520'], n: ['#f4f9ff', '#b9d2e6'] };
function buildTerrain(m) {
  groundGroup.clear();
  const { COLS, ROWS } = H;
  // dark base under everything + a faint grid for empty tiles
  const base = box(COLS + 0.3, 0.3, ROWS + 0.3, '#0b1530', 0, -0.62, 0); base.castShadow = false; groundGroup.add(base);
  // grid exactly the size of the field (shows on empty tiles)
  const pts = [];
  for (let x = 0; x <= COLS; x++) pts.push(x - COLS / 2, -0.46, -ROWS / 2, x - COLS / 2, -0.46, ROWS / 2);
  for (let y = 0; y <= ROWS; y++) pts.push(-COLS / 2, -0.46, y - ROWS / 2, COLS / 2, -0.46, y - ROWS / 2);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  groundGroup.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x3a6ad8, transparent: true, opacity: 0.5 })));
  const counts = {};
  m.ground.forEach((g) => counts[g] = (counts[g] || 0) + 1);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  const inst = {};
  const topY = { g: 0, f: 0, s: 0, d: 0, n: 0, p: -0.04, b: -0.2, w: -0.2, l: -0.2 };
  for (const [type, n] of Object.entries(counts)) {
    if (type === 'e') continue;
    let matl;
    if (LAND[type]) matl = [M(LAND[type][1]), M(LAND[type][1]), M(LAND[type][0]), M(LAND[type][1]), M(LAND[type][1]), M(LAND[type][1])];
    else if (type === 'p' || type === 'b') matl = M('#e3c48c');
    else if (type === 'w') matl = M('#3b8fd6', { opacity: 0.85, rough: 0.15 });
    else if (type === 'l') matl = M('#ff6a10', { emissive: '#ff4a00', ei: 1.4, rough: 0.4 });
    const mesh = new THREE.InstancedMesh(boxGeo, matl, n);
    mesh.receiveShadow = true; mesh.castShadow = type !== 'w' && type !== 'l';
    mesh.userData.type = type; mesh.userData.i = 0;
    inst[type] = mesh; groundGroup.add(mesh);
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const g = m.ground[y * COLS + x]; if (g === 'e') continue;
    const mesh = inst[g], ty = topY[g] ?? 0, hgt = 0.5 + ty + (LAND[g] ? hash2(x, y) * 0.06 : 0);
    dummy.position.set(wx(x), ty - hgt / 2 + (LAND[g] ? hash2(x, y) * 0.06 : 0), wz(y));
    dummy.scale.set(1, hgt, 1); dummy.updateMatrix();
    mesh.setMatrixAt(mesh.userData.i, dummy.matrix);
    col.set(0xffffff).multiplyScalar(0.92 + hash2(y, x) * 0.12);
    mesh.setColorAt(mesh.userData.i, col);
    mesh.userData.i++;
  }
  for (const k in inst) { inst[k].instanceMatrix.needsUpdate = true; if (inst[k].instanceColor) inst[k].instanceColor.needsUpdate = true; }
  // little details: grass tufts, pebbles, road stones, bridge planks, river banks
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const g = m.ground[y * COLS + x], h = hash2(x, y), X = wx(x), Z = wz(y);
    if ((g === 'g' || g === 'f') && h > 0.55) groundGroup.add(box(0.06, 0.12, 0.06, g === 'f' ? (h > .8 ? '#ff7eb6' : '#fff27a') : '#3f8a2e', X + (h - .5) * .7, 0.06, Z + (hash2(y, x) - .5) * .7));
    if ((g === 's' || g === 'd') && h > 0.6) groundGroup.add(box(0.12, 0.06, 0.1, g === 's' ? '#c99a55' : '#8c5a38', X + (h - .5) * .7, 0.03, Z + (hash2(y, x) - .5) * .7));
    if (g === 'p' && h > 0.5) groundGroup.add(box(0.12, 0.04, 0.1, '#b08850', X + (h - .5) * .6, -0.02, Z + (hash2(y, x) - .5) * .6));
    if (g === 'b') {
      const walk = (a, c2) => { const q = m.ground[c2 * COLS + a]; return q === 'p' || q === 'b'; };
      const horiz = (x > 0 && walk(x - 1, y)) || (x < COLS - 1 && walk(x + 1, y));
      const br = new THREE.Group(); br.position.set(X, 0.02, Z); if (!horiz) br.rotation.y = Math.PI / 2;
      for (let k = 0; k < 5; k++) br.add(box(0.18, 0.08, 0.86, k % 2 ? '#9b6a35' : '#8a5a2b', -0.4 + k * 0.2, 0, 0));
      for (const sd of [-1, 1]) { br.add(box(1.05, 0.08, 0.08, '#6e4524', 0, 0.22, sd * 0.42)); for (const px of [-0.45, 0.45]) br.add(box(0.08, 0.26, 0.08, '#5a3a1c', px, 0.1, sd * 0.42)); }
      groundGroup.add(br);
    }
  }
}

// ------------------------------------------------------------------ decor models (all original, blocky)
const DECOR3D = {
  tree(h) { const g = new THREE.Group(); g.add(box(0.2, 0.6, 0.2, '#7a4a24', 0, 0.3, 0)); g.add(box(0.75, 0.55, 0.75, '#3f8a2e', 0, 0.85, 0)); g.add(box(0.5, 0.35, 0.5, '#5cb043', 0.05, 1.25, -0.03)); g.add(box(0.35, 0.3, 0.35, '#4f9e38', -0.25, 0.7, 0.25)); return g; },
  pine() { const g = new THREE.Group(); g.add(box(0.16, 0.3, 0.16, '#6a3f1e', 0, 0.15, 0)); [[0.8, 0.42], [0.6, 0.78], [0.4, 1.1], [0.2, 1.35]].forEach(([w, y], i) => g.add(box(w, 0.3, w, i % 2 ? '#2f7a3a' : '#276b31', 0, y, 0))); return g; },
  bush() { const g = new THREE.Group(); g.add(box(0.6, 0.35, 0.5, '#4c9a34', 0, 0.18, 0)); g.add(box(0.4, 0.25, 0.35, '#5cb043', 0.1, 0.42, 0)); for (const [x, z] of [[-0.2, 0.26], [0.15, 0.26], [0.05, -0.26]]) g.add(box(0.07, 0.07, 0.07, '#e8434f', x, 0.3, z)); return g; },
  rock() { const g = new THREE.Group(); g.add(box(0.6, 0.35, 0.5, '#8c8a86', 0, 0.17, 0)); g.add(box(0.35, 0.25, 0.3, '#a8a5a0', 0.08, 0.42, -0.02)); return g; },
  mountain() { const g = new THREE.Group(); [[1.6, 0.5, '#7a6a5c'], [1.2, 0.5, '#8a7a6a'], [0.85, 0.45, '#958676'], [0.5, 0.35, '#f4f8ff'], [0.25, 0.25, '#ffffff']].forEach(([w, hh, c], i) => g.add(box(w, hh, w * 0.9, c, (i % 2 ? 0.04 : -0.03), 0.25 + i * 0.47, 0))); return g; },
  hill() { const g = new THREE.Group(); g.add(box(1.3, 0.3, 1.1, '#5a9a3a', 0, 0.15, 0)); g.add(box(0.9, 0.3, 0.8, '#68a845', 0, 0.45, 0)); g.add(box(0.45, 0.2, 0.4, '#7ab84f', 0, 0.7, 0)); return g; },
  cactus() { const g = new THREE.Group(); g.add(box(0.24, 0.9, 0.24, '#4fa04a', 0, 0.45, 0)); g.add(box(0.3, 0.12, 0.14, '#4fa04a', -0.2, 0.45, 0)); g.add(box(0.14, 0.3, 0.14, '#4fa04a', -0.3, 0.62, 0)); g.add(box(0.3, 0.12, 0.14, '#4fa04a', 0.2, 0.6, 0)); g.add(box(0.14, 0.25, 0.14, '#4fa04a', 0.3, 0.75, 0)); return g; },
  flower(h) { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const x = (hash2(k, h * 9) - .5) * .6, z = (hash2(h * 7, k) - .5) * .6; g.add(box(0.04, 0.2, 0.04, '#3f7a26', x, 0.1, z)); g.add(box(0.14, 0.06, 0.14, ['#ff7eb6', '#ffd34d', '#ffffff'][k], x, 0.22, z)); g.add(box(0.06, 0.07, 0.06, '#ff9d2a', x, 0.24, z)); } return g; },
  sun() { const g = new THREE.Group(); g.add(box(0.05, 0.5, 0.05, '#3f7a26', 0, 0.25, 0)); g.add(box(0.36, 0.36, 0.06, '#ffd34d', 0, 0.55, 0)); g.add(box(0.16, 0.16, 0.08, '#7a4a24', 0, 0.55, 0.01)); return g; },
  mush() { const g = new THREE.Group(); g.add(box(0.12, 0.2, 0.12, '#f3e6c8', 0, 0.1, 0)); g.add(box(0.36, 0.14, 0.36, '#e2453a', 0, 0.26, 0)); g.add(box(0.06, 0.02, 0.06, '#ffffff', 0.08, 0.34, 0.05)); g.add(box(0.05, 0.02, 0.05, '#ffffff', -0.08, 0.34, -0.06)); return g; },
  barrel() { const g = new THREE.Group(); g.add(cyl(0.24, 0.24, 0.55, '#9b6232', 0, 0.28, 0, 10)); for (const y of [0.12, 0.44]) g.add(cyl(0.255, 0.255, 0.05, '#6f8a8c', 0, y, 0, 10)); return g; },
  crate() { const g = new THREE.Group(); g.add(box(0.5, 0.5, 0.5, '#c08a4a', 0, 0.25, 0)); for (const s of [-1, 1]) g.add(box(0.06, 0.52, 0.52, '#8a5a2b', s * 0.22, 0.25, 0)); return g; },
  torch() { const g = new THREE.Group(); g.add(box(0.1, 0.7, 0.1, '#6a4424', 0, 0.35, 0)); g.add(box(0.2, 0.1, 0.2, '#4a4a4a', 0, 0.72, 0)); const f = box(0.16, 0.22, 0.16, '#ffb02a', 0, 0.88, 0, { emissive: '#ff8a1a', ei: 2 }); f.castShadow = false; f.userData.flame = true; g.add(f); return g; },
  campfire() { const g = new THREE.Group(); g.add(box(0.6, 0.1, 0.12, '#7a4a24', 0, 0.06, 0)); g.add(box(0.12, 0.1, 0.6, '#8a5a2c', 0, 0.12, 0)); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; g.add(box(0.14, 0.1, 0.14, '#8c8a86', Math.cos(a) * 0.36, 0.05, Math.sin(a) * 0.36)); } const f = box(0.26, 0.34, 0.26, '#ffb02a', 0, 0.32, 0, { emissive: '#ff7a1a', ei: 2.2 }); f.castShadow = false; f.userData.flame = true; g.add(f); return g; },
  banner(h) { const g = new THREE.Group(); g.add(box(0.07, 1.0, 0.07, '#6a4424', 0, 0.5, 0)); const fl = box(0.45, 0.32, 0.03, '#2f7fe0', 0.25, 0.8, 0); fl.userData.wave = true; g.add(fl); g.add(box(0.1, 0.1, 0.04, '#ffd34d', 0.25, 0.8, 0.01)); return g; },
  crystal() { const g = new THREE.Group(); const cm = { emissive: '#3fc8e8', ei: 0.9, rough: 0.2 }; const a = box(0.22, 0.7, 0.22, '#6fe3ff', 0, 0.35, 0, cm); a.rotation.y = 0.6; g.add(a); const b2 = box(0.16, 0.45, 0.16, '#3fc8e8', 0.2, 0.22, 0.05, cm); b2.rotation.z = -0.35; g.add(b2); const c3 = box(0.15, 0.4, 0.15, '#3fc8e8', -0.18, 0.2, -0.05, cm); c3.rotation.z = 0.35; g.add(c3); g.userData.glow = true; return g; },
  hut() { const g = new THREE.Group(); g.add(box(0.8, 0.5, 0.7, '#c99a5a', 0, 0.25, 0)); g.add(box(0.18, 0.32, 0.04, '#5a3a1c', 0, 0.16, 0.36)); const r = new THREE.Mesh(new THREE.ConeGeometry(0.66, 0.5, 4), M('#d8b04a', { flat: true })); r.position.y = 0.75; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r); return g; },
  tent() { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.75, 4), M('#d64545', { flat: true })); t.position.y = 0.37; t.rotation.y = Math.PI / 4; t.castShadow = true; g.add(t); g.add(box(0.18, 0.3, 0.02, '#f0e6d0', 0, 0.15, 0.33)); return g; },
  skull() { const g = new THREE.Group(); g.add(box(0.28, 0.24, 0.26, '#efe6d2', 0, 0.14, 0)); g.add(box(0.18, 0.08, 0.2, '#efe6d2', 0, 0.02, 0.02)); for (const x of [-0.07, 0.07]) g.add(box(0.07, 0.07, 0.02, '#2b1d12', x, 0.16, 0.13)); return g; },
};
function spot3d() {
  const g = new THREE.Group();
  g.add(cyl(0.38, 0.4, 0.06, '#4a3018', 0, 0.03, 0, 16));
  for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; const s = box(0.18, 0.12, 0.14, k % 2 ? '#a19c94' : '#8c877f', Math.cos(a) * 0.4, 0.06, Math.sin(a) * 0.4); s.rotation.y = -a; g.add(s); }
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 24), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.08; g.add(glow); g.userData.spotGlow = glow;
  return g;
}
function portal3d() {
  const g = new THREE.Group();
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; g.add(box(0.2, 0.14, 0.18, '#8c877f', Math.cos(a) * 0.45, 0.07, Math.sin(a) * 0.45)); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 24), M('#b06dff', { emissive: '#9b4dff', ei: 1.6 }));
  ring.position.y = 0.55; ring.userData.spin = true; g.add(ring);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshBasicMaterial({ color: 0xd9a8ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
  core.position.y = 0.55; g.add(core); g.userData.core = core;
  return g;
}
function castle3d() {
  const g = new THREE.Group();
  const stone = '#b8b2a6', dark = '#8c867c';
  g.add(box(0.9, 0.8, 0.7, dark, 0, 0.4, 0));
  for (const s of [-1, 1]) {
    g.add(box(0.36, 1.25, 0.36, stone, s * 0.48, 0.62, 0));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 4), M('#2f7fe0', { flat: true }));
    roof.position.set(s * 0.48, 1.47, 0); roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  }
  for (let k = -1; k <= 1; k++) g.add(box(0.16, 0.14, 0.7, stone, k * 0.3, 0.87, 0));
  g.add(box(0.26, 0.42, 0.04, '#5a3a1c', 0, 0.21, 0.36));
  g.add(box(0.03, 0.5, 0.03, '#2b1d12', 0, 1.15, 0));
  const flag = box(0.3, 0.18, 0.02, '#ffd34d', 0.16, 1.3, 0); flag.userData.wave = true; g.add(flag);
  return g;
}

// fence: posts on every fence tile and rails to fence neighbours (one continuous network)
function fence3d(m, x, y) {
  const g = new THREE.Group();
  const is = (a, b) => a >= 0 && b >= 0 && a < H.COLS && b < H.ROWS && m.decor[b * H.COLS + a] === 'fence';
  g.add(box(0.12, 0.5, 0.12, '#b77a44', 0, 0.25, 0));
  const r = is(x + 1, y), d = is(x, y + 1), lone = !r && !d && !is(x - 1, y) && !is(x, y - 1);
  if (r || lone) for (const yy of [0.18, 0.36]) g.add(box(lone ? 0.9 : 1, 0.07, 0.06, '#9b6a35', lone ? 0 : 0.5, yy, 0));
  if (d) for (const yy of [0.18, 0.36]) g.add(box(0.06, 0.07, 1, '#9b6a35', 0, yy, 0.5));
  if (r) g.add(box(0.1, 0.45, 0.1, '#b77a44', 0.5, 0.22, 0));
  if (d) g.add(box(0.1, 0.45, 0.1, '#b77a44', 0, 0.22, 0.5));
  if (lone) for (const xx of [-0.42, 0.42]) g.add(box(0.1, 0.45, 0.1, '#b77a44', xx, 0.22, 0));
  return g;
}

// Claude-made decor / enemies: a camera-facing card with their SVG or emoji
const spriteCache = new Map();
function cardSprite(def, size) {
  const k = def.id;
  if (!spriteCache.has(k)) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const c = cv.getContext('2d');
    const draw = () => { tex.needsUpdate = true; };
    if (def.svg) { const im = new Image(); im.onload = () => { c.drawImage(im, 4, 4, 120, 120); draw(); }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(def.svg); }
    else { c.font = '100px "Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(def.emoji || '?', 64, 70); draw(); }
    spriteCache.set(k, new THREE.SpriteMaterial({ map: tex, transparent: true }));
  }
  const s = new THREE.Sprite(spriteCache.get(k)); s.scale.set(size, size, 1); s.position.y = size / 2;
  return s;
}

function buildDecor(m) {
  decorGroup.clear();
  for (let y = 0; y < H.ROWS; y++) for (let x = 0; x < H.COLS; x++) {
    const id = m.decor[y * H.COLS + x]; if (!id) continue;
    let obj;
    if (id === 'spot') obj = spot3d();
    else if (id === 'fence') obj = fence3d(m, x, y);
    else if (DECOR3D[id]) obj = DECOR3D[id](hash2(x, y));
    else { const def = H.decorDef(id); if (!def) continue; obj = cardSprite(def, 0.9); }
    obj.position.set(wx(x), 0, wz(y));
    if (id !== 'fence' && id !== 'spot') obj.rotation.y = (hash2(y, x) - 0.5) * 0.8;
    obj.userData.id = id; obj.userData.tile = [x, y];
    decorGroup.add(obj);
  }
  if (m.spawn) { const p = portal3d(); p.position.set(wx(m.spawn.x), 0, wz(m.spawn.y)); p.userData.id = 'portal'; decorGroup.add(p); }
  if (m.home) { const c = castle3d(); c.position.set(wx(m.home.x), 0, wz(m.home.y)); c.rotation.y = 0; c.userData.id = 'castle'; decorGroup.add(c); }
}

// ------------------------------------------------------------------ hero (original blocky sprout-sprite)
const heroCache = new Map();
function makeHero(stage, hat, outfit) {
  const admin = stage >= 7;
  const body = admin ? '#5cb8ff' : '#7fd65a', dark = admin ? '#1f5fb8' : '#3c8f2e', belly = admin ? '#eaf8ff' : '#f6f3c8';
  const g = new THREE.Group();
  const legs = [], arms = [];
  for (const s of [-1, 1]) { const l = box(0.18, 0.2, 0.2, dark, s * 0.13, 0.1, 0); legs.push(l); g.add(l); }
  const torso = box(0.56, 0.42, 0.42, body, 0, 0.41, 0); g.add(torso);
  g.add(box(0.36, 0.3, 0.02, belly, 0, 0.38, 0.215));
  for (const s of [-1, 1]) { const a = box(0.12, 0.3, 0.14, body, s * 0.35, 0.44, 0); a.geometry = boxGeo; arms.push(a); g.add(a); }
  const head = new THREE.Group(); head.position.y = 0.86; g.add(head);
  head.add(box(0.62, 0.5, 0.52, body, 0, 0, 0));
  const face = facePlane(faceTex('hero', admin ? '#ffb020' : '#e08a12'), 0.56, 0.46, 0.265); head.add(face);
  for (const s of [-1, 1]) { const e = box(0.08, 0.32, 0.16, '#9ef08a', s * 0.36, 0.1, 0); e.rotation.z = s * -0.9; head.add(e); }
  // plant on top, grows with the stage
  const plant = new THREE.Group(); plant.position.y = 0.25; head.add(plant);
  const leaf = (len, rz, col, y = 0, rx = 0) => { const l = box(0.06, len, 0.2, col, Math.sin(rz) * len * 0.45, y + len / 2 * Math.cos(rz), 0); l.rotation.z = -rz; l.rotation.x = rx; plant.add(l); };
  leaf(0.22, 0.5, '#9ef08a'); leaf(0.22, -0.5, '#5cb84a');
  if (stage >= 1) leaf(0.28, 0, '#c4ff9a');
  if (stage >= 2) { leaf(0.32, 1.0, '#5cb84a'); leaf(0.32, -1.0, '#9ef08a'); }
  if (stage >= 4) for (let i = 0; i < 5; i++) { const a = -1.2 + i * 0.6; const l = box(0.08, 0.5, 0.22, i % 2 ? '#3c9a3e' : '#7fd65a', Math.sin(a) * 0.24, 0.24, -0.12); l.rotation.z = -a; l.rotation.x = -0.4; plant.add(l); }
  if (stage >= 3) {
    const big = stage >= 6, fy = stage >= 4 ? 0.48 : 0.34;
    const petal = big ? '#ffc83a' : '#ff7eb6', n = big ? 8 : 6;
    for (let i = 0; i < n; i++) { const a = i / n * 6.28; const p = box(0.13, 0.05, 0.13, petal, Math.cos(a) * (big ? 0.2 : 0.14), fy, Math.sin(a) * (big ? 0.2 : 0.14)); p.rotation.y = -a; plant.add(p); }
    plant.add(box(0.14, 0.08, 0.14, big ? '#ff8c1a' : '#ffe066', 0, fy + 0.02, 0, big ? { emissive: '#ff8c1a', ei: 0.6 } : undefined));
  }
  if (stage === 2) plant.add(box(0.12, 0.16, 0.12, '#ff9fc4', 0, 0.36, 0));
  if (stage >= 5) for (const s of [-1, 1]) { const v = box(0.06, 0.06, 0.5, '#4fae3e', s * 0.38, -0.05, -0.05); v.rotation.y = s * 0.6; plant.add(v); }
  if (admin) {
    const crown = new THREE.Group(); crown.position.y = 0.36; head.add(crown);
    crown.add(box(0.4, 0.1, 0.36, '#ffd34d', 0, 0, 0, { metal: 0.6, rough: 0.3 }));
    for (const [x, z] of [[-0.16, 0], [0, 0], [0.16, 0]]) crown.add(box(0.07, 0.14, 0.07, '#ffd34d', x, 0.1, z + 0.12, { metal: 0.6, rough: 0.3 }));
    crown.add(box(0.06, 0.06, 0.02, '#3a8bff', 0, 0.02, 0.19, { emissive: '#3a8bff', ei: 1 }));
    const cape = box(0.5, 0.6, 0.03, '#1e6fff', 0, 0.45, -0.24); g.add(cape);
  }
  // merch: hats and outfits as simple blocks or a card
  if (hat) {
    const hatModels = {
      cap: () => { const h2 = new THREE.Group(); h2.add(box(0.5, 0.14, 0.46, '#e53950', 0, 0, 0)); h2.add(box(0.36, 0.04, 0.2, '#e53950', 0, -0.05, 0.3)); return h2; },
      tophat: () => { const h2 = new THREE.Group(); h2.add(box(0.5, 0.04, 0.46, '#222', 0, 0, 0)); h2.add(box(0.32, 0.32, 0.3, '#222', 0, 0.18, 0)); h2.add(box(0.33, 0.06, 0.31, '#c0392b', 0, 0.06, 0)); return h2; },
      crown: () => { const h2 = new THREE.Group(); h2.add(box(0.42, 0.12, 0.38, '#ffd34d', 0, 0, 0, { metal: 0.6, rough: 0.3 })); for (const x of [-0.15, 0, 0.15]) h2.add(box(0.07, 0.14, 0.07, '#ffd34d', x, 0.12, 0.14, { metal: 0.6 })); return h2; },
      helmet: () => box(0.56, 0.2, 0.5, '#f0f0f0', 0, 0, 0),
      grad: () => { const h2 = new THREE.Group(); h2.add(box(0.36, 0.12, 0.34, '#222', 0, 0, 0)); h2.add(box(0.58, 0.04, 0.58, '#222', 0, 0.08, 0)); return h2; },
    };
    const def = H.merchDef(hat);
    const hm = hatModels[hat] ? hatModels[hat]() : def ? cardSprite(def, 0.45) : null;
    if (hm) { hm.position.y = admin ? 0.55 : 0.32; head.add(hm); if (hatModels[hat]) plant.visible = false; }
  }
  if (outfit) {
    const outfitModels = {
      scarf: () => box(0.6, 0.1, 0.46, '#e53950', 0, 0.62, 0),
      bow: () => { const b = new THREE.Group(); b.add(box(0.12, 0.1, 0.04, '#ff4d8a', -0.08, 0.6, 0.22)); b.add(box(0.12, 0.1, 0.04, '#ff4d8a', 0.08, 0.6, 0.22)); return b; },
      cape: () => box(0.5, 0.6, 0.03, '#e53950', 0, 0.45, -0.24),
      medal: () => box(0.12, 0.12, 0.03, '#ffd34d', 0, 0.48, 0.23, { metal: 0.6 }),
      glasses: () => { const b = new THREE.Group(); b.add(box(0.46, 0.1, 0.03, '#111', 0, 0.9, 0.28)); return b; },
    };
    const om = outfitModels[outfit] ? outfitModels[outfit]() : null;
    if (om) g.add(om);
  }
  g.userData = { legs, arms, head };
  g.scale.setScalar(1);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}
function heroFor(stage, hat, outfit) {
  const k = stage + '|' + hat + '|' + outfit;
  if (!heroCache.has(k)) heroCache.set(k, makeHero(stage, hat, outfit));
  const src = heroCache.get(k);
  const g = src.clone(true);
  // re-link animated parts on the clone
  const legs = [], arms = [];
  g.children.forEach((c, i) => { if (src.userData.legs.includes(src.children[i])) legs.push(c); if (src.userData.arms.includes(src.children[i])) arms.push(c); });
  const head = g.children[src.children.indexOf(src.userData.head)];
  g.userData = { legs, arms, head, key: k };
  return g;
}

// ------------------------------------------------------------------ villains (original blocky monsters)
const ENEMY3D = {
  flamix: { body: '#e8541c', dark: '#a8280c', glow: '#ffcf2a', extra(g) { g.add(box(0.12, 0.22, 0.08, '#3a1a10', -0.2, 0.86, 0)); g.add(box(0.12, 0.22, 0.08, '#3a1a10', 0.2, 0.86, 0)); const f = box(0.2, 0.3, 0.2, '#ffb02a', 0, 0.45, -0.38, { emissive: '#ff7a1a', ei: 2 }); f.userData.flame = true; f.castShadow = false; g.add(f); } },
  bubbo: { body: '#2f7fd8', dark: '#123f8a', glow: '#ff3b2f', extra(g) { g.add(box(0.06, 0.26, 0.3, '#5aa8e8', 0, 0.86, -0.02)); } },
  zappy: { body: '#f0b414', dark: '#b8700a', glow: '#ff2a6a', extra(g) { for (const [x, y] of [[-0.06, 0.85], [0.04, 0.95], [0.12, 0.88]]) g.add(box(0.07, 0.2, 0.07, '#ffe14a', x, y, 0, { emissive: '#ffd21a', ei: 0.6 })); for (const s of [-1, 1]) { const w = box(0.3, 0.06, 0.2, '#ffd21a', s * 0.42, 0.45, 0); w.userData.flap = s; g.add(w); } } },
  rocko: { body: '#8c867c', dark: '#4a4640', glow: '#ff7a1a', scale: 1.2, extra(g) { for (const [x, y, z] of [[-0.22, 0.7, 0.05], [0.2, 0.75, -0.1], [0.28, 0.4, 0.1]]) g.add(box(0.2, 0.16, 0.2, '#6f6a62', x, y, z)); for (let k = -1; k <= 1; k++) g.add(box(0.08, 0.16, 0.08, '#4a4640', k * 0.14, 0.86, 0)); } },
  spooki: { body: '#5a2aa8', dark: '#3a1a7a', glow: '#7dff6a', ghost: true, extra(g) { for (let k = -1; k <= 1; k++) g.add(box(0.14, 0.18, 0.4, '#5a2aa8', k * 0.16, 0.08, 0, { opacity: 0.85 })); } },
  buzzi: { body: '#4c9a2a', dark: '#24501a', glow: '#ff3b2f', extra(g) { for (const s of [-1, 1]) { g.add(box(0.05, 0.25, 0.05, '#1a2a10', s * 0.12, 0.88, 0)); g.add(box(0.08, 0.08, 0.08, '#ffd34d', s * 0.14, 1.02, 0)); const w = box(0.3, 0.04, 0.22, '#dcfaff', s * 0.3, 0.7, -0.15, { opacity: 0.7 }); w.userData.flap = s; g.add(w); } } },
  toxa: { body: '#7a2ab0', dark: '#4a1a7a', glow: '#b6ff3a', extra(g) { for (const [x, z] of [[-0.15, 0.1], [0.05, -0.12], [0.18, 0.05]]) { const b = box(0.1, 0.1, 0.1, '#7dff6a', x, 0.9, z, { emissive: '#4aff3a', ei: 0.6 }); b.userData.bubble = true; g.add(b); } } },
  frosty: { body: '#9fd4f5', dark: '#4f8ac0', glow: '#3ae0ff', extra(g) { for (const s of [-1, 1]) { const ear = box(0.1, 0.3, 0.1, '#bfefff', s * 0.2, 0.88, 0); ear.rotation.z = s * -0.3; g.add(ear); } } },
};
const enemyCache = new Map();
function makeEnemy(id) {
  const d = ENEMY3D[id];
  if (!d) return null;
  const g = new THREE.Group();
  const legs = [];
  if (!d.ghost) for (const s of [-1, 1]) { const l = box(0.16, 0.18, 0.2, d.dark, s * 0.15, 0.09, 0); legs.push(l); g.add(l); }
  g.add(box(0.62, 0.6, 0.56, d.body, 0, 0.48, 0, d.ghost ? { opacity: 0.88 } : undefined));
  g.add(box(0.4, 0.2, 0.02, d.dark, 0, 0.26, 0.285));
  g.add(facePlane(faceTex('villain', '', d.glow), 0.58, 0.5, 0.29).translateY(0.52));
  d.extra(g);
  g.userData = { legs };
  g.scale.setScalar((d.scale || 1) * 1.05);
  g.traverse((o) => { if (o.isMesh && o.material && !o.material.transparent) o.castShadow = true; });
  return g;
}
function enemyFor(def) {
  if (!ENEMY3D[def.id]) { const s = new THREE.Group(); s.add(cardSprite(def, 0.8)); s.userData = { legs: [] }; return s; }
  if (!enemyCache.has(def.id)) enemyCache.set(def.id, makeEnemy(def.id));
  const src = enemyCache.get(def.id), g = src.clone(true);
  const legs = []; src.children.forEach((c, i) => { if (src.userData.legs.includes(c)) legs.push(g.children[i]); });
  g.userData = { legs };
  return g;
}

// ------------------------------------------------------------------ live objects
const live = new Map();          // game object -> 3D object
function hpBar() {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.08), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthTest: false }));
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.08), new THREE.MeshBasicMaterial({ color: 0x3ddc84, depthTest: false }));
  fg.position.z = 0.001; bg.renderOrder = 10; fg.renderOrder = 11;
  g.add(bg, fg); g.userData.fg = fg;
  return g;
}
const shotMat = new THREE.MeshStandardMaterial({ color: 0x9ef08a, emissive: 0x4fdc6a, emissiveIntensity: 1.2 });
const bombMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const shotPool = [], beamPool = [], partPool = [], textPool = [];
function pooled(pool, make) { for (const o of pool) if (!o.visible) { o.visible = true; return o; } const o = make(); pool.push(o); fxGroup.add(o); return o; }
const textCache = new Map();
function textSprite(text, color) {
  const k = text + color;
  let mat = textCache.get(k);
  if (!mat) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
    c.font = 'bold 40px "Segoe UI Emoji","Segoe UI",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 7; c.strokeStyle = '#000'; c.strokeText(text, 128, 34); c.fillStyle = color; c.fillText(text, 128, 34);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    if (textCache.size > 120) textCache.clear();
    textCache.set(k, mat);
  }
  return mat;
}

// ------------------------------------------------------------------ per-frame render
R3D.render = function (s) {
  if (!renderer) return;
  const { map, mode, game, t } = s;
  // rebuild static parts only when the map changed
  const tk = map.ground.join('');
  if (tk !== terrainKey) { buildTerrain(map); terrainKey = tk; decorKey = ''; }
  const dk = map.decor.join(',') + '|' + JSON.stringify(map.spawn) + JSON.stringify(map.home);
  if (dk !== decorKey) { buildDecor(map); decorKey = dk; }

  // camera
  const tx = cam.tx, tz = cam.tz;
  camera.position.set(tx + Math.sin(cam.az) * Math.sin(cam.pol) * cam.dist, Math.cos(cam.pol) * cam.dist, tz + Math.cos(cam.az) * Math.sin(cam.pol) * cam.dist);
  if (s.shake > 0) camera.position.add(new THREE.Vector3((Math.random() - .5) * s.shake * .03, (Math.random() - .5) * s.shake * .03, 0));
  camera.lookAt(tx, 0, tz);

  // day / night
  const night = !!map.night;
  wrap.classList.toggle('night3d', night);
  hemi.intensity = night ? 0.18 : 1.1; ambient.intensity = night ? 0.12 : 0.25;
  sun.intensity = night ? 0 : 2.2; moon.intensity = night ? 0.55 : 0;
  renderer.toneMappingExposure = night ? 1.1 : 1.0;
  let li = 0;
  if (night) {
    const L = (s.lights || []).slice().sort((a, b) => b.r - a.r).slice(0, pointLights.length);
    for (const l of L) {
      const p = pointLights[li++]; const [x, z] = fromPx(l.x, l.y);
      p.position.set(x, 0.9, z); p.distance = l.r / H.T * 1.8; p.intensity = 2.2 * (1 + Math.sin(t * 9 + x) * (l.flicker || 0) * 2);
      const m2 = /rgba?\((\d+),(\d+),(\d+)/.exec(l.color || ''); p.color.setRGB(m2 ? m2[1] / 255 : 1, m2 ? m2[2] / 255 : .7, m2 ? m2[3] / 255 : .4);
    }
  }
  for (; li < pointLights.length; li++) pointLights[li].intensity = 0;

  // animate decor
  decorGroup.children.forEach((o) => {
    const id = o.userData.id;
    o.traverse((c) => {
      if (c.userData.flame) { c.scale.y = 0.22 * (1 + Math.sin(t * 14 + o.position.x) * 0.25); c.scale.x = c.scale.z = 0.16 * (1 + Math.sin(t * 11) * 0.12) * (id === 'campfire' ? 1.6 : 1); }
      if (c.userData.wave) c.rotation.y = Math.sin(t * 3 + o.position.z) * 0.35;
      if (c.userData.spin) c.rotation.z = t * 2;
    });
    if (id === 'spot') {
      const placing = mode === 'play' && game && game.placing && !game.towers.some((tw) => tw.x === o.userData.tile[0] && tw.y === o.userData.tile[1]);
      o.userData.spotGlow.material.opacity = mode === 'create' ? 0.35 : placing ? 0.5 + Math.sin(t * 5) * 0.4 : 0;
    }
    if ((id === 'tree' || id === 'pine') && o.children.length) o.rotation.z = Math.sin(t * 1.3 + o.position.x) * 0.02;
  });

  // hover + range
  const ht = s.hoverTile;
  hoverBox.visible = !!ht && (mode === 'create' || (game && game.placing));
  if (ht) hoverBox.position.set(wx(ht.x), 0.05, wz(ht.y));
  rangeRing.visible = false;
  const showRange = (tl, ok) => { rangeRing.visible = true; rangeRing.position.set(wx(tl.x), 0.06, wz(tl.y)); rangeRing.scale.setScalar(s.range); rangeRing.material.color.set(ok ? 0x50b4ff : 0xff5064); rangeRing.children[0].material.color.set(ok ? 0x50b4ff : 0xff5064); };
  if (game && game.selected) showRange(game.selected, true);
  if (game && game.placing && ht) showRange(ht, s.canBuild(ht));

  // route preview dots (create mode)
  const route = mode === 'create' ? s.route : null;
  while (routeDots.length < (route ? route.length * 2 : 0)) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); fxGroup.add(d); routeDots.push(d); }
  routeDots.forEach((d) => d.visible = false);
  if (route) for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1], f = (t * 1.2 + i) % 1, d = routeDots[i];
    d.visible = true; d.position.set(wx(a.x + (b.x - a.x) * f), 0.08, wz(a.y + (b.y - a.y) * f));
  }

  // heroes: guardian preview in create mode, towers in play
  const seen = new Set();
  const placeHero = (key, tl, scale, tw) => {
    const hk = s.profile.stage + '|' + s.profile.hat + '|' + s.profile.outfit;
    let h = live.get(key);
    if (h && h.userData.key !== hk) { dynGroup.remove(h); live.delete(key); h = null; }
    if (!h) {
      h = heroFor(s.profile.stage, s.profile.hat, s.profile.outfit); dynGroup.add(h); live.set(key, h);
      if (scale > 1) { h.add(box(0.06, 0.42, 0.36, '#2f7fe0', 0.4, 0.45, 0.1)); h.add(box(0.07, 0.14, 0.14, '#ffd34d', 0.41, 0.47, 0.1)); }   // guardian shield
    }
    seen.add(key);
    h.position.set(wx(tl.x), 0.06, wz(tl.y));
    h.scale.setScalar((1.05 + s.profile.stage * 0.04) * scale * (tw && tw.born > 0 ? Math.min(1, (t - tw.born) * 4 + 0.3) : 1));
    // face the nearest enemy (or the camera)
    let target = null;
    if (game) { let best = 1e9; for (const e of game.enemies) { const [ex, ez] = fromPx(e.x, e.y); const d = (ex - h.position.x) ** 2 + (ez - h.position.z) ** 2; if (d < best) { best = d; target = [ex, ez]; } } }
    const yaw = target ? Math.atan2(target[0] - h.position.x, target[1] - h.position.z) : cam.az;
    const diff = ((yaw - h.rotation.y) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    h.rotation.y += diff * 0.15;
    const kick = tw && tw.kick > 0 ? 0.1 : 0;
    h.position.y += Math.abs(Math.sin(t * 3 + tl.x)) * 0.04 + kick;
    h.userData.arms.forEach((a, i) => a.rotation.x = kick ? -1.2 : Math.sin(t * 3 + i * 3) * 0.2);
  };
  if (mode === 'create' && map.home) { const gt = s.guardianTile; if (gt) placeHero('guardian-preview', gt, 1.2, null); }
  if (game) for (const tw of game.towers) placeHero(tw, tw, tw.guardian ? 1.2 : 1, tw);

  // enemies
  if (game) for (const e of game.enemies) {
    let o = live.get(e);
    if (!o) { o = enemyFor(e.def); const bar = hpBar(); bar.position.y = 1.0; o.add(bar); o.userData.bar = bar; dynGroup.add(o); live.set(e, o);
      if (e.elite) { o.scale.multiplyScalar(1.45); const cr = box(0.36, 0.1, 0.34, '#ffd34d', 0, 0.92, 0, { metal: 0.6, rough: 0.3, emissive: '#ffb000', ei: 0.4 }); o.add(cr); } }
    seen.add(e);
    const [x, z] = fromPx(e.x, e.y);
    const prev = o.position.clone();
    o.position.set(x, 0.05 + (ENEMY3D[e.def.id] && ENEMY3D[e.def.id].ghost ? 0.25 + Math.sin(t * 3 + e.wob) * 0.08 : Math.abs(Math.sin(t * 8 + e.wob)) * 0.05), z);
    const dx = x - prev.x, dz = z - prev.z;
    if (dx * dx + dz * dz > 1e-6) o.rotation.y = Math.atan2(dx, dz);
    o.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 14 + e.wob + i * Math.PI) * 0.6);
    o.traverse((c) => { if (c.userData.flap) c.rotation.z = c.userData.flap * Math.sin(t * 30) * 0.6; if (c.userData.flame) c.scale.y = 0.3 * (1 + Math.sin(t * 15) * 0.3); if (c.userData.bubble) c.position.y = 0.9 + ((t * 0.7 + c.position.x + 1) % 1) * 0.3; });
    const bar = o.userData.bar, f = Math.max(0, Math.min(1, e.hp / e.maxHp));
    bar.quaternion.copy(camera.quaternion); bar.quaternion.premultiply(o.quaternion.clone().invert());
    bar.userData.fg.scale.x = Math.max(0.001, f); bar.userData.fg.position.x = -0.3 * (1 - f);
    bar.userData.fg.material.color.set(f > 0.5 ? 0x3ddc84 : f > 0.25 ? 0xffd34d : 0xff5a6a);
    o.visible = true;
    if (game.freezeT > 0) o.userData.legs.forEach((l) => l.rotation.x = 0);
  }
  for (const [k, o] of live) if (!seen.has(k)) { dynGroup.remove(o); live.delete(k); }

  // shots / beams / particles / floating text
  shotPool.forEach((o) => o.visible = false); beamPool.forEach((o) => o.visible = false); partPool.forEach((o) => o.visible = false); textPool.forEach((o) => o.visible = false);
  if (game) {
    for (const sh of game.shots) {
      const o = pooled(shotPool, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), shotMat); return m; });
      const [x, z] = fromPx(sh.x, sh.y); o.position.set(x, 0.7, z); o.rotation.set(t * 8, t * 6, 0);
      o.material = sh.st.splash ? bombMat : shotMat;
    }
    for (const b of game.beams) {
      const o = pooled(beamPool, () => new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true })));
      const [x0, z0] = fromPx(b.x0, b.y0), [x1, z1] = fromPx(b.x1, b.y1);
      const a = new THREE.Vector3(x0, 1.0, z0), c = new THREE.Vector3(x1, 0.5, z1), len = a.distanceTo(c);
      o.position.copy(a).add(c).multiplyScalar(0.5); o.scale.set(1, len, 1); o.lookAt(c); o.rotateX(Math.PI / 2);
      o.material.opacity = b.t / 0.18;
    }
  }
  for (const p of s.particles) {
    const o = pooled(partPool, () => new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })));
    const [x, z] = fromPx(p.x, p.y);
    o.position.set(x, 0.6 + (p.max - p.life) * 1.2 - (p.max - p.life) ** 2 * 2, z);
    o.material.color.set(p.color); o.material.opacity = Math.max(0, p.life / p.max);
  }
  for (const f of s.floats) {
    const o = pooled(textPool, () => { const sp = new THREE.Sprite(); sp.renderOrder = 20; return sp; });
    o.material = textSprite(f.text, f.color);
    const [x, z] = fromPx(f.x, f.y);
    o.position.set(x, 1.3 + (1.1 - f.life) * 0.8, z); o.scale.set(1.2, 0.3, 1); o.material.opacity = Math.max(0, Math.min(1, f.life));
  }
  if (game && game.freezeT > 0) renderer.setClearColor(0x9fdcff, 0.25); else renderer.setClearColor(0x000000, 0);
  renderer.render(scene, camera);
};

window.dispatchEvent(new Event('r3d-ready'));
