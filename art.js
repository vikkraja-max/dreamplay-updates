/* dreamPlay art: original hand-drawn cartoon style for tower-defense maps (thick dark outlines, cel shading,
   warm palettes). Everything is drawn with canvas paths: no image files. */
'use strict';

const INK = '#2b1d12';
// every ground type the child can paint (no fixed theme: the map is built tile by tile)
const LANDS = {
  e: { fill: null },                                                                  // empty: nothing yet
  g: { fill: '#6aa843', dark: '#4f8a31', speck: ['#7fbf55', '#5a9638', '#9ad06a'], tuft: '#3f7a26' },
  f: { fill: '#86c75c', dark: '#6aa843', speck: ['#9ad06a', '#b6e07a', '#ffb3d1'], tuft: '#4f8a31', flowers: true },
  s: { fill: '#e2bd78', dark: '#c99a55', speck: ['#c79a58', '#efd296', '#b5864a'] },
  d: { fill: '#7a4a2c', dark: '#5c3520', speck: ['#8c5a38', '#6a3c22', '#a06a42'], cracks: true },
  n: { fill: '#eef5fb', dark: '#c9dceb', speck: ['#ffffff', '#d6e6f2', '#b9d2e6'] },
};
const LAND_ORDER = ['d', 's', 'n', 'g', 'f'];
const LIQUIDS = {
  w: { edge: '#1f5c94', fill: '#3b8fd6', light: '#7cc4f2', lightA: .35 },
  l: { edge: '#8a2a08', fill: '#ff7a1a', light: '#ffd23a', lightA: .55 },
};

// ------------------------------------------------------------------ seeded noise
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }

// ------------------------------------------------------------------ terrain (baked to an offscreen canvas)
function bakeTerrain(m, cols, rows, T) {
  const cv = document.createElement('canvas');
  cv.width = cols * T; cv.height = rows * T;
  const c = cv.getContext('2d');
  const at = (x, y) => (x >= 0 && y >= 0 && x < cols && y < rows) ? m.ground[y * cols + x] : null;
  const cx = (x) => x * T + T / 2;

  // the empty canvas: dark blue with a soft grid, like a blank page waiting for the child
  c.fillStyle = '#0b1530'; c.fillRect(0, 0, cv.width, cv.height);
  c.strokeStyle = 'rgba(90,150,255,.12)'; c.lineWidth = 1;
  for (let x = 0; x <= cols; x++) { c.beginPath(); c.moveTo(x * T + .5, 0); c.lineTo(x * T + .5, cv.height); c.stroke(); }
  for (let y = 0; y <= rows; y++) { c.beginPath(); c.moveTo(0, y * T + .5); c.lineTo(cv.width, y * T + .5); c.stroke(); }

  // land: each type as overlapping blobs (organic edges), then its own texture
  const landOf = (g) => (g === 'p' || g === 'b' || g === 'w' || g === 'l') ? null : g;
  for (const type of LAND_ORDER) {
    const L = LANDS[type], R = rng(77 + type.charCodeAt(0));
    c.fillStyle = L.fill;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const g = at(x, y);
      // roads and rivers sit on the land around them, so give them a bed of the neighbour's land
      const bed = landOf(g) || neighbourLand(at, x, y, landOf);
      if (bed !== type) continue;
      c.fillRect(x * T - 1, y * T - 1, T + 2, T + 2);
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(cx(x) + (R() - .5) * T * .5, cx(y) + (R() - .5) * T * .5, T * (.45 + R() * .25), 0, 7); c.fill(); }
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const g = at(x, y);
      if ((landOf(g) || neighbourLand(at, x, y, landOf)) !== type) continue;
      for (let k = 0; k < 4; k++) {
        c.fillStyle = R() < .5 ? L.dark : L.speck[Math.floor(R() * 3)]; c.globalAlpha = .25 + R() * .2;
        c.beginPath(); c.ellipse(x * T + R() * T, y * T + R() * T, 4 + R() * 12, 3 + R() * 7, R() * 3, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
      if (landOf(g) !== type) continue;
      if (L.tuft) {
        c.strokeStyle = L.tuft; c.lineWidth = 2; c.lineCap = 'round';
        for (let k = 0; k < 2; k++) { const px = x * T + 6 + R() * (T - 12), py = y * T + 10 + R() * (T - 14); c.beginPath(); c.moveTo(px, py); c.lineTo(px - 3, py - 7); c.moveTo(px + 2, py); c.lineTo(px + 3, py - 8); c.moveTo(px + 4, py); c.lineTo(px + 8, py - 5); c.stroke(); }
      }
      if (L.flowers && R() < .7) { c.fillStyle = R() < .5 ? '#fff6a8' : '#ffb3d1'; c.strokeStyle = 'rgba(43,29,18,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(x * T + 8 + R() * (T - 16), y * T + 8 + R() * (T - 16), 3, 0, 7); c.fill(); c.stroke(); }
      if (L.cracks) { c.strokeStyle = 'rgba(30,10,5,.45)'; c.lineWidth = 1.6; let px = x * T + R() * T, py = y * T + R() * T; c.beginPath(); c.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (R() - .5) * 16; py += (R() - .5) * 16; c.lineTo(px, py); } c.stroke(); }
      if (type === 's' || type === 'd') { c.fillStyle = L.speck[Math.floor(R() * 3)]; c.strokeStyle = 'rgba(43,29,18,.45)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x * T + R() * T, y * T + R() * T, 2 + R() * 2.5, 1.5 + R() * 1.5, 0, 0, 7); c.fill(); c.stroke(); }
      if (type === 'n') { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x * T + R() * T, y * T + R() * T, 1.5, 0, 7); c.fill(); }
    }
  }

  // liquids and the road as connected rounded strokes
  const network = (pred, layers) => {
    for (const [w, col, alpha] of layers) {
      c.strokeStyle = col; c.fillStyle = col; c.globalAlpha = alpha; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (!pred(x, y)) continue;
        c.beginPath(); c.arc(cx(x), cx(y), w / 2, 0, 7); c.fill();
        for (const [dx, dy] of [[1, 0], [0, 1]]) if (pred(x + dx, y + dy)) { c.beginPath(); c.moveTo(cx(x), cx(y)); c.lineTo(cx(x + dx), cx(y + dy)); c.stroke(); }
        const edge = (ex, ey) => { c.beginPath(); c.moveTo(cx(x), cx(y)); c.lineTo(ex, ey); c.stroke(); };
        if (x === 0) edge(-T, cx(y)); if (x === cols - 1) edge(cv.width + T, cx(y));
        if (y === 0) edge(cx(x), -T); if (y === rows - 1) edge(cx(x), cv.height + T);
      }
    }
    c.globalAlpha = 1;
  };
  // a bridge belongs to the liquid next to it (water by default)
  const liquidAt = (x, y) => {
    const g = at(x, y);
    if (g === 'w' || g === 'l') return g;
    if (g !== 'b') return null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = at(x + dx, y + dy); if (n === 'w' || n === 'l') return n; }
    return 'w';
  };
  for (const kind of ['w', 'l']) {
    const L = LIQUIDS[kind];
    network((x, y) => liquidAt(x, y) === kind, [[T * 1.08, L.edge, 1], [T * 0.9, L.fill, 1], [T * 0.42, L.light, L.lightA]]);
  }
  network((x, y) => at(x, y) === 'p', [[T * 1.02, INK, 0.55], [T * 0.94, '#9c7442', 1], [T * 0.8, '#e3c48c', 1], [T * 0.4, '#f1dcab', 0.45]]);
  const R = rng(4242);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (at(x, y) !== 'p') continue;
    for (let k = 0; k < 3; k++) { c.fillStyle = '#9c7442'; c.globalAlpha = .55; c.beginPath(); c.ellipse(cx(x) + (R() - .5) * T * .7, cx(y) + (R() - .5) * T * .7, 2 + R() * 2.5, 1.5 + R() * 1.5, R() * 3, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1;

  // bridges
  const walkish = (g) => g === 'p' || g === 'b';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (at(x, y) !== 'b') continue;
    const horiz = walkish(at(x - 1, y)) || walkish(at(x + 1, y)) || !(walkish(at(x, y - 1)) || walkish(at(x, y + 1)));
    c.save(); c.translate(cx(x), cx(y)); if (!horiz) c.rotate(Math.PI / 2);
    const L = T * 1.1, Wd = T * .7;
    c.fillStyle = liquidAt(x, y) === 'l' ? '#6a6a6a' : '#9b6a35'; c.strokeStyle = INK; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(-L / 2, -Wd / 2, L, Wd, 4); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(43,29,18,.6)'; c.lineWidth = 1.5;
    for (let k = 1; k < 6; k++) { const px = -L / 2 + k * L / 6; c.beginPath(); c.moveTo(px, -Wd / 2); c.lineTo(px, Wd / 2); c.stroke(); }
    c.fillStyle = '#6e4524'; c.strokeStyle = INK; c.lineWidth = 2;
    for (const sy of [-1, 1]) { c.beginPath(); c.roundRect(-L / 2 - 2, sy * Wd / 2 - 3, L + 4, 6, 3); c.fill(); c.stroke(); }
    c.restore();
  }
  return cv;
}

function neighbourLand(at, x, y, landOf) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const l = landOf(at(x + dx, y + dy));
    if (l && l !== 'e') return l;
  }
  return 'e';
}

// animated shimmer on water and bubbling on lava, drawn live on top of the baked terrain
function drawLiquidFx(c, m, cols, rows, T, t) {
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const g = m.ground[y * cols + x];
    if (g !== 'w' && g !== 'l') continue;
    const n = hash2(x, y), px = x * T + T / 2, py = y * T + T / 2;
    if (g === 'l') {
      const ph = (t * 0.8 + n) % 1;
      c.strokeStyle = `rgba(255,220,90,${0.7 * (1 - ph)})`; c.lineWidth = 2;
      c.beginPath(); c.arc(px + (n - .5) * 20, py + (hash2(y, x) - .5) * 20, 3 + ph * 7, 0, 7); c.stroke();
    } else {
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.lineCap = 'round';
      const off = ((t * 14 + n * 40) % 30) - 15, wy = py + (n - .5) * 16;
      c.beginPath(); c.moveTo(px + off - 6, wy); c.quadraticCurveTo(px + off, wy - 4, px + off + 6, wy); c.stroke();
    }
  }
}

// ------------------------------------------------------------------ props
function ol(c, w) { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; }
function shadow(c, x, y, rx, ry) { c.fillStyle = 'rgba(30,15,5,.3)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }

const PROPS = {
  tree(c, x, y, s, t, n) {
    const sw = Math.sin(t * 1.4 + n * 6) * s * 0.02;
    shadow(c, x, y + s * .38, s * .42, s * .13);
    ol(c, s * .07); c.fillStyle = '#7a4a24'; c.beginPath(); c.roundRect(x - s * .07, y, s * .14, s * .38, 3); c.fill(); c.stroke();
    const blobs = [[-.2, -.12, .26], [.2, -.1, .25], [0, -.3, .3], [0, -.05, .28]];
    c.fillStyle = '#3f8a2e'; ol(c, s * .07);
    for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(x + bx * s + sw, y + by * s, r * s, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = '#3f8a2e'; for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(x + bx * s + sw, y + by * s, r * s - s * .035, 0, 7); c.fill(); }
    c.fillStyle = '#69b845'; for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(x + bx * s + sw - r * s * .25, y + by * s - r * s * .25, r * s * .55, 0, 7); c.fill(); }
  },
  pine(c, x, y, s, t, n) {
    shadow(c, x, y + s * .38, s * .3, s * .1);
    ol(c, s * .06); c.fillStyle = '#6a3f1e'; c.fillRect(x - s * .05, y + s * .18, s * .1, s * .2); c.strokeRect(x - s * .05, y + s * .18, s * .1, s * .2);
    for (let k = 0; k < 3; k++) {
      const w = s * (.36 - k * .08), top = y - s * (.05 + k * .22), bot = y + s * (.25 - k * .2);
      c.fillStyle = k % 2 ? '#2f7a3a' : '#276b31';
      c.beginPath(); c.moveTo(x, top - s * .12); c.lineTo(x + w, bot); c.lineTo(x - w, bot); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(140,220,120,.35)'; c.beginPath(); c.moveTo(x, top - s * .08); c.lineTo(x - w * .6, bot - 3); c.lineTo(x - w * .1, bot - 3); c.closePath(); c.fill();
    }
  },
  bush(c, x, y, s) {
    shadow(c, x, y + s * .2, s * .34, s * .1);
    ol(c, s * .06); c.fillStyle = '#4c9a34';
    for (const [bx, by, r] of [[-.16, .05, .17], [.16, .05, .17], [0, -.06, .2]]) { c.beginPath(); c.arc(x + bx * s, y + by * s, r * s, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = '#4c9a34'; for (const [bx, by, r] of [[-.16, .05, .17], [.16, .05, .17], [0, -.06, .2]]) { c.beginPath(); c.arc(x + bx * s, y + by * s, r * s - s * .03, 0, 7); c.fill(); }
    c.fillStyle = '#e8434f'; for (const [bx, by] of [[-.1, -.05], [.12, .02], [0, -.15]]) { c.beginPath(); c.arc(x + bx * s, y + by * s, s * .03, 0, 7); c.fill(); }
  },
  rock(c, x, y, s, t, n) {
    shadow(c, x, y + s * .18, s * .36, s * .1);
    ol(c, s * .06); c.fillStyle = '#8c8a86';
    c.beginPath(); c.moveTo(x - s * .32, y + s * .15); c.lineTo(x - s * .26, y - s * .1); c.lineTo(x - s * .05, y - s * .25); c.lineTo(x + s * .22, y - s * .16); c.lineTo(x + s * .33, y + s * .12); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#b3b0aa'; c.beginPath(); c.moveTo(x - s * .22, y - s * .07); c.lineTo(x - s * .05, y - s * .2); c.lineTo(x + s * .12, y - s * .13); c.lineTo(x - s * .02, y - s * .02); c.closePath(); c.fill();
  },
  flower(c, x, y, s, t, n) {
    for (let k = 0; k < 3; k++) {
      const fx = x + (hash2(n * 9 + k, k) - .5) * s * .5, fy = y + (hash2(k, n * 7 + k) - .5) * s * .4;
      ol(c, 1.5); c.fillStyle = ['#ff7eb6', '#ffd34d', '#ffffff'][k];
      for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; c.beginPath(); c.arc(fx + Math.cos(a) * s * .055, fy + Math.sin(a) * s * .055, s * .045, 0, 7); c.fill(); c.stroke(); }
      c.fillStyle = '#ff9d2a'; c.beginPath(); c.arc(fx, fy, s * .03, 0, 7); c.fill();
    }
  },
  sun(c, x, y, s, t) {
    ol(c, 2); c.strokeStyle = '#3f7a26'; c.beginPath(); c.moveTo(x, y + s * .3); c.lineTo(x, y - s * .05); c.stroke();
    ol(c, 2);
    for (let p = 0; p < 10; p++) { const a = p / 10 * 6.28 + Math.sin(t) * .1; c.fillStyle = '#ffd34d'; c.beginPath(); c.ellipse(x + Math.cos(a) * s * .13, y - s * .12 + Math.sin(a) * s * .13, s * .07, s * .035, a, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = '#7a4a24'; c.beginPath(); c.arc(x, y - s * .12, s * .08, 0, 7); c.fill(); c.stroke();
  },
  mush(c, x, y, s) {
    shadow(c, x, y + s * .2, s * .22, s * .07);
    ol(c, s * .05); c.fillStyle = '#f3e6c8'; c.beginPath(); c.roundRect(x - s * .07, y - s * .02, s * .14, s * .2, 4); c.fill(); c.stroke();
    c.fillStyle = '#e2453a'; c.beginPath(); c.ellipse(x, y - s * .04, s * .22, s * .15, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fff'; for (const [a, b, r] of [[-.1, -.1, .035], [.08, -.12, .03], [.02, -.06, .025]]) { c.beginPath(); c.arc(x + a * s, y + b * s, r * s, 0, 7); c.fill(); }
  },
  barrel(c, x, y, s) {
    shadow(c, x, y + s * .26, s * .24, s * .08);
    ol(c, s * .06); c.fillStyle = '#9b6232';
    c.beginPath(); c.moveTo(x - s * .18, y - s * .22); c.quadraticCurveTo(x - s * .26, y, x - s * .18, y + s * .24); c.lineTo(x + s * .18, y + s * .24); c.quadraticCurveTo(x + s * .26, y, x + s * .18, y - s * .22); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6f8a8c'; for (const by of [-.12, .12]) { c.beginPath(); c.roundRect(x - s * .22, y + by * s - s * .03, s * .44, s * .06, 2); c.fill(); c.stroke(); }
    c.fillStyle = '#b77a44'; c.beginPath(); c.ellipse(x, y - s * .22, s * .18, s * .06, 0, 0, 7); c.fill(); c.stroke();
  },
  crate(c, x, y, s) {
    shadow(c, x, y + s * .24, s * .3, s * .08);
    ol(c, s * .06); c.fillStyle = '#c08a4a'; c.beginPath(); c.roundRect(x - s * .24, y - s * .22, s * .48, s * .46, 3); c.fill(); c.stroke();
    c.lineWidth = s * .045; c.beginPath(); c.moveTo(x - s * .22, y - s * .2); c.lineTo(x + s * .22, y + s * .22); c.moveTo(x + s * .22, y - s * .2); c.lineTo(x - s * .22, y + s * .22); c.stroke();
  },
  torch(c, x, y, s, t, n) {
    shadow(c, x, y + s * .32, s * .14, s * .05);
    ol(c, s * .05); c.fillStyle = '#6a4424'; c.beginPath(); c.roundRect(x - s * .05, y - s * .1, s * .1, s * .42, 3); c.fill(); c.stroke();
    c.fillStyle = '#4a4a4a'; c.beginPath(); c.roundRect(x - s * .1, y - s * .17, s * .2, s * .1, 3); c.fill(); c.stroke();
    flame(c, x, y - s * .2, s * .28, t + n * 5);
  },
  campfire(c, x, y, s, t, n) {
    shadow(c, x, y + s * .14, s * .3, s * .09);
    ol(c, s * .05);
    for (const [a, col] of [[.5, '#7a4a24'], [-.5, '#8a5a2c']]) { c.save(); c.translate(x, y + s * .06); c.rotate(a); c.fillStyle = col; c.beginPath(); c.roundRect(-s * .26, -s * .045, s * .52, s * .09, 4); c.fill(); c.stroke(); c.restore(); }
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; c.fillStyle = '#8c8a86'; c.beginPath(); c.arc(x + Math.cos(a) * s * .26, y + s * .08 + Math.sin(a) * s * .1, s * .045, 0, 7); c.fill(); c.stroke(); }
    flame(c, x, y - s * .02, s * .42, t + n * 3);
  },
  banner(c, x, y, s, t, n) {
    shadow(c, x, y + s * .36, s * .1, s * .04);
    ol(c, s * .05); c.fillStyle = '#6a4424'; c.fillRect(x - s * .03, y - s * .36, s * .06, s * .72); c.strokeRect(x - s * .03, y - s * .36, s * .06, s * .72);
    const wv = Math.sin(t * 3 + n * 4) * s * .03;
    c.fillStyle = '#2f7fe0';
    c.beginPath(); c.moveTo(x + s * .03, y - s * .32); c.lineTo(x + s * .3 + wv, y - s * .3); c.lineTo(x + s * .28 + wv, y + s * .02); c.lineTo(x + s * .16 + wv, y - s * .06); c.lineTo(x + s * .03, y + s * .02); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(x + s * .16 + wv * .6, y - s * .16, s * .05, 0, 7); c.fill();
  },
  crystal(c, x, y, s, t) {
    const g = c.createRadialGradient(x, y - s * .1, 2, x, y - s * .1, s * .5);
    g.addColorStop(0, `rgba(90,230,255,${.35 + .15 * Math.sin(t * 2)})`); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.beginPath(); c.arc(x, y - s * .1, s * .5, 0, 7); c.fill();
    shadow(c, x, y + s * .2, s * .26, s * .08);
    ol(c, s * .05);
    for (const [dx, h, w, col] of [[-.14, .3, .1, '#3fc8e8'], [.13, .34, .1, '#3fc8e8'], [0, .48, .13, '#6fe3ff']]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(x + dx * s, y - h * s); c.lineTo(x + (dx + w) * s, y - h * s * .4); c.lineTo(x + (dx + w * .7) * s, y + s * .2); c.lineTo(x + (dx - w * .7) * s, y + s * .2); c.lineTo(x + (dx - w) * s, y - h * s * .4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(x + dx * s, y - h * s + 3); c.lineTo(x + (dx - w * .6) * s, y - h * s * .4); c.lineTo(x + dx * s, y); c.closePath(); c.fill();
    }
  },
  hut(c, x, y, s) {
    shadow(c, x, y + s * .3, s * .42, s * .1);
    ol(c, s * .05); c.fillStyle = '#c99a5a'; c.beginPath(); c.roundRect(x - s * .3, y - s * .08, s * .6, s * .38, 3); c.fill(); c.stroke();
    c.fillStyle = '#5a3a1c'; c.beginPath(); c.roundRect(x - s * .08, y + s * .08, s * .16, s * .22, 3); c.fill(); c.stroke();
    c.fillStyle = '#d8b04a'; c.beginPath(); c.moveTo(x - s * .4, y - s * .02); c.lineTo(x, y - s * .42); c.lineTo(x + s * .4, y - s * .02); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(43,29,18,.4)'; c.lineWidth = 1.5; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x - s * .4 + k * s * .16, y - s * .02); c.lineTo(x, y - s * .42); c.stroke(); }
  },
  cactus(c, x, y, s) {
    shadow(c, x, y + s * .34, s * .2, s * .06);
    ol(c, s * .05); c.fillStyle = '#4fa04a';
    c.beginPath(); c.roundRect(x - s * .09, y - s * .34, s * .18, s * .68, s * .09); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(x - s * .3, y - s * .14, s * .12, s * .26, s * .06); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(x + s * .18, y - s * .24, s * .12, s * .24, s * .06); c.fill(); c.stroke();
    c.fillRect(x - s * .2, y + s * .04, s * .12, s * .07); c.fillRect(x + s * .08, y - s * .05, s * .12, s * .07);
    c.strokeStyle = 'rgba(30,70,25,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - s * .28); c.lineTo(x, y + s * .3); c.stroke();
  },
  tent(c, x, y, s) {
    shadow(c, x, y + s * .26, s * .4, s * .1);
    ol(c, s * .05); c.fillStyle = '#d64545'; c.beginPath(); c.moveTo(x - s * .38, y + s * .26); c.lineTo(x, y - s * .34); c.lineTo(x + s * .38, y + s * .26); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#f0e6d0'; c.beginPath(); c.moveTo(x - s * .12, y + s * .26); c.lineTo(x, y - s * .1); c.lineTo(x + s * .12, y + s * .26); c.closePath(); c.fill(); c.stroke();
  },
  fence(c, x, y, s) {
    ol(c, s * .05); c.fillStyle = '#9b6a35';
    for (const fx of [-.3, 0, .3]) { c.beginPath(); c.moveTo(x + fx * s - s * .06, y + s * .22); c.lineTo(x + fx * s - s * .06, y - s * .14); c.lineTo(x + fx * s, y - s * .22); c.lineTo(x + fx * s + s * .06, y - s * .14); c.lineTo(x + fx * s + s * .06, y + s * .22); c.closePath(); c.fill(); c.stroke(); }
    for (const fy of [-.06, .1]) { c.beginPath(); c.roundRect(x - s * .42, y + fy * s - s * .03, s * .84, s * .06, 2); c.fill(); c.stroke(); }
  },
  skull(c, x, y, s) {
    ol(c, s * .05); c.fillStyle = '#efe6d2';
    c.beginPath(); c.arc(x, y - s * .04, s * .16, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(x - s * .09, y + s * .06, s * .18, s * .1, 3); c.fill(); c.stroke();
    c.fillStyle = INK; for (const ex of [-.06, .06]) { c.beginPath(); c.arc(x + ex * s, y - s * .04, s * .04, 0, 7); c.fill(); }
  },
};

function flame(c, x, y, s, t) {
  const f = 1 + Math.sin(t * 12) * .08 + Math.sin(t * 7.3) * .06;
  const g = c.createRadialGradient(x, y, 1, x, y, s * 1.4);
  g.addColorStop(0, 'rgba(255,170,40,.45)'); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, s * 1.4, 0, 7); c.fill();
  ol(c, Math.max(1.5, s * .1));
  c.fillStyle = '#ff7a1a';
  c.beginPath(); c.moveTo(x - s * .35, y + s * .1); c.quadraticCurveTo(x - s * .4, y - s * .4 * f, x + Math.sin(t * 9) * s * .1, y - s * .85 * f); c.quadraticCurveTo(x + s * .42, y - s * .35 * f, x + s * .35, y + s * .1); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ffd23a'; c.beginPath(); c.moveTo(x - s * .18, y + s * .06); c.quadraticCurveTo(x - s * .2, y - s * .2 * f, x + Math.sin(t * 11) * s * .05, y - s * .5 * f); c.quadraticCurveTo(x + s * .22, y - s * .2 * f, x + s * .18, y + s * .06); c.closePath(); c.fill();
}

// round stone build-spot (where heroes go)
function drawSpot(c, x, y, s, t, state) {
  shadow(c, x, y + s * .12, s * .5, s * .2);
  ol(c, s * .05);
  c.fillStyle = '#6e4a2a'; c.beginPath(); c.ellipse(x, y, s * .46, s * .3, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#4a3018'; c.beginPath(); c.ellipse(x, y - s * .02, s * .34, s * .2, 0, 0, 7); c.fill();
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * 6.28;
    c.fillStyle = k % 2 ? '#a19c94' : '#8c877f';
    c.beginPath(); c.ellipse(x + Math.cos(a) * s * .4, y + Math.sin(a) * s * .26, s * .1, s * .07, a, 0, 7); c.fill(); c.stroke();
  }
  if (state === 'hover' || state === 'free') {
    const a = state === 'hover' ? .9 : .35 + .25 * Math.sin(t * 3);
    c.strokeStyle = `rgba(255,220,90,${a})`; c.lineWidth = 3; c.setLineDash([6, 5]);
    c.beginPath(); c.ellipse(x, y - s * .02, s * .3, s * .18, 0, 0, 7); c.stroke(); c.setLineDash([]);
  }
}

// ------------------------------------------------------------------ enemies: original cute elemental monsters
// (round chibi bodies, big glossy eyes, one element each)
function body(c, s, rx, ry, c1, c2, y = 0) {
  const g = c.createRadialGradient(-s * rx * .4, y - s * ry * .5, s * .02, 0, y, s * Math.max(rx, ry));
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  c.fillStyle = g; ol(c, s * .055);
  c.beginPath(); c.ellipse(0, y, s * rx, s * ry, 0, 0, 7); c.fill(); c.stroke();
}
function bigEyes(c, s, y, gap, r, iris, angry) {
  // villain eyes: yellow sclera, glowing iris, slit pupil, heavy angry brow cutting the top of the eye
  const glow = EVIL_GLOW[iris] || '#ff3b2f';
  for (const sd of [-1, 1]) {
    const ex = sd * s * gap;
    c.save();
    c.fillStyle = '#ffe9a8'; ol(c, s * .035);
    c.beginPath(); c.ellipse(ex, y, s * r * .9, s * r * .8, sd * .25, 0, 7); c.fill(); c.stroke();
    c.shadowColor = glow; c.shadowBlur = s * .12;
    c.fillStyle = glow; c.beginPath(); c.ellipse(ex + sd * s * r * .1, y + s * r * .1, s * r * .55, s * r * .6, 0, 0, 7); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = INK; c.beginPath(); c.ellipse(ex + sd * s * r * .1, y + s * r * .12, s * r * .12, s * r * .5, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - s * r * .25, y - s * r * .2, s * r * .14, 0, 7); c.fill();
    // brow: a dark wedge sloping down to the nose
    c.fillStyle = INK;
    c.beginPath(); c.moveTo(ex - sd * s * r * 1.1, y - s * r * 1.15); c.lineTo(ex + sd * s * r * 1.0, y - s * r * .35); c.lineTo(ex + sd * s * r * 1.05, y - s * r * .75); c.lineTo(ex - sd * s * r * 1.0, y - s * r * 1.45); c.closePath(); c.fill();
    c.restore();
  }
}
const EVIL_GLOW = { '#7a2a10': '#ffcf2a', '#1d4f8a': '#ff3b2f', '#3a2a00': '#ff2a6a', '#5a3a1c': '#ff7a1a', '#ff4d9a': '#7dff6a', '#2a1a3a': '#ff3b2f', '#3a0a4a': '#b6ff3a', '#1d6fb8': '#3ae0ff' };
function feet(c, s, y, col, t) {
  const st = Math.sin(t * 14) * s * .03;
  c.fillStyle = col; ol(c, s * .045);
  for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .15, y + sd * st, s * .09, s * .06, 0, 0, 7); c.fill(); c.stroke(); }
}
function grin(c, s, y) {
  // wide wicked grin full of sharp teeth
  const w = s * .14, h = s * .07;
  ol(c, s * .035);
  c.fillStyle = '#3a0a10';
  c.beginPath(); c.moveTo(-w, y - h * .3); c.quadraticCurveTo(0, y + h * 1.4, w, y - h * .3); c.quadraticCurveTo(0, y + h * .2, -w, y - h * .3); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#fffbe8';
  for (let k = 0; k < 5; k++) {
    const x0 = -w * .8 + k * w * .4;
    c.beginPath(); c.moveTo(x0 - w * .14, y - h * .05); c.lineTo(x0, y + h * .45); c.lineTo(x0 + w * .14, y - h * .05); c.closePath(); c.fill();
  }
}
function horns(c, s, y, col) {
  ol(c, s * .04); c.fillStyle = col;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * .12, y); c.quadraticCurveTo(sd * s * .3, y - s * .08, sd * s * .3, y - s * .26); c.quadraticCurveTo(sd * s * .2, y - s * .12, sd * s * .05, y - s * .04); c.closePath(); c.fill(); c.stroke(); }
}
function spikes(c, s, y, n, col) {
  ol(c, s * .035); c.fillStyle = col;
  for (let k = 0; k < n; k++) { const x0 = (k - (n - 1) / 2) * s * .1; c.beginPath(); c.moveTo(x0 - s * .045, y); c.lineTo(x0, y - s * .12); c.lineTo(x0 + s * .045, y); c.closePath(); c.fill(); c.stroke(); }
}

const ENEMY_ART = {
  // fire: round salamander-ball with a flickering tail flame
  flamix(c, s, t) {
    feet(c, s, s * .26, '#e0571f', t);
    c.save(); c.translate(s * .36, -s * .02); c.rotate(.5); flame(c, 0, 0, s * .26, t); c.restore();
    horns(c, s, -s * .2, '#3a1a10'); body(c, s, .3, .28, '#ff8a3a', '#a8280c', 0);
    c.fillStyle = '#ffc070'; c.beginPath(); c.ellipse(0, s * .12, s * .16, s * .1, 0, 0, 7); c.fill();
    bigEyes(c, s, -s * .06, .12, .085, '#7a2a10', true); grin(c, s, s * .1, true);
  },
  // water: chubby fish-frog with a fin and bubbles
  bubbo(c, s, t) {
    feet(c, s, s * .26, '#2f6fc0', t);
    c.fillStyle = '#7cc4f2'; ol(c, s * .05);
    c.beginPath(); c.moveTo(-s * .05, -s * .26); c.quadraticCurveTo(s * .05, -s * .48, s * .14, -s * .24); c.closePath(); c.fill(); c.stroke();
    body(c, s, .31, .27, '#5aa8e8', '#123f8a', 0);
    spikes(c, s, -s * .24, 3, '#0d2a5a');
    bigEyes(c, s, -s * .05, .13, .09, '#1d4f8a', false); grin(c, s, s * .1);
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; const b = (t * .8) % 1;
    c.beginPath(); c.arc(-s * .3, -s * .2 - b * s * .3, s * .04 + b * s * .02, 0, 7); c.stroke();
  },
  // electric: puffball bird with zig-zag crest and sparks
  zappy(c, s, t) {
    feet(c, s, s * .25, '#c28a10', t);
    c.fillStyle = '#ffe14a'; ol(c, s * .05);
    c.beginPath(); c.moveTo(-s * .06, -s * .24); c.lineTo(-s * .02, -s * .44); c.lineTo(s * .03, -s * .34); c.lineTo(s * .08, -s * .5); c.lineTo(s * .1, -s * .22); c.closePath(); c.fill(); c.stroke();
    for (const sd of [-1, 1]) { c.fillStyle = '#ffd21a'; c.beginPath(); c.ellipse(sd * s * .3, s * .02, s * .1, s * .06, sd * (.6 + Math.sin(t * 20) * .3), 0, 7); c.fill(); c.stroke(); }
    body(c, s, .27, .26, '#ffe14a', '#b8700a', 0);
    c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(-s * .06, s * .03); c.lineTo(s * .06, s * .03); c.lineTo(0, s * .14); c.closePath(); c.fill(); c.stroke();
    bigEyes(c, s, -s * .07, .11, .08, '#3a2a00', true);
    if (Math.sin(t * 9) > .3) { c.strokeStyle = '#fffbcf'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(s * .34, -s * .25); c.lineTo(s * .27, -s * .16); c.lineTo(s * .35, -s * .12); c.lineTo(s * .28, -s * .02); c.stroke(); }
  },
  // rock: pebble buddy with stone plates and a moss tuft
  rocko(c, s, t) {
    feet(c, s, s * .27, '#6d6862', t);
    spikes(c, s, -s * .26, 4, '#4a4640'); body(c, s, .33, .29, '#9c968c', '#4a4640', 0);
    c.fillStyle = '#8c867c'; ol(c, s * .04);
    for (const [px, py, r] of [[-.18, -.14, .09], [.17, -.16, .08], [.22, .08, .07]]) { c.beginPath(); c.ellipse(px * s, py * s, r * s, r * s * .7, .3, 0, 7); c.fill(); c.stroke(); }
    c.strokeStyle = '#ff7a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-s * .2, s * .05); c.lineTo(-s * .1, s * .12); c.lineTo(-s * .16, s * .2); c.stroke();
    bigEyes(c, s, -s * .02, .12, .075, '#5a3a1c', true); grin(c, s, s * .13);
  },
  // ghost: floating wisp with a curly tail
  spooki(c, s, t) {
    c.translate(0, Math.sin(t * 3) * s * .05);
    const g = c.createRadialGradient(0, 0, 2, 0, 0, s * .45); g.addColorStop(0, 'rgba(180,120,255,.35)'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * .45, 0, 7); c.fill();
    c.fillStyle = '#5a2aa8'; ol(c, s * .055);
    c.beginPath(); c.moveTo(-s * .28, 0); c.arc(0, -s * .02, s * .28, Math.PI, 0);
    c.quadraticCurveTo(s * .3, s * .2, s * .12, s * .22); c.quadraticCurveTo(s * .05, s * .38 + Math.sin(t * 6) * s * .04, -s * .1, s * .3);
    c.quadraticCurveTo(-s * .3, s * .22, -s * .28, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-s * .12, -s * .14, s * .06, s * .09, -.4, 0, 7); c.fill();
    bigEyes(c, s, -s * .04, .11, .08, '#ff4d9a', false);
    grin(c, s, s * .1);
  },
  // bug: round beetle-ball with little wings and antennae
  buzzi(c, s, t) {
    feet(c, s, s * .25, '#3a6a20', t);
    for (const sd of [-1, 1]) { c.fillStyle = 'rgba(220,250,255,.7)'; ol(c, s * .04); c.beginPath(); c.ellipse(sd * s * .24, -s * .2, s * .14, s * .07, sd * (.7 + Math.sin(t * 30) * .4), 0, 7); c.fill(); c.stroke(); }
    ol(c, s * .04);
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * .06, -s * .24); c.quadraticCurveTo(sd * s * .1, -s * .4, sd * s * .18, -s * .4); c.stroke(); c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(sd * s * .18, -s * .4, s * .03, 0, 7); c.fill(); c.stroke(); }
    horns(c, s, -s * .18, '#1a2a10'); body(c, s, .28, .27, '#7ab83a', '#24501a', 0);
    c.fillStyle = '#2f5a1a'; for (const [px, py] of [[-.14, .1], [.15, .12], [0, .19]]) { c.beginPath(); c.arc(px * s, py * s, s * .035, 0, 7); c.fill(); }
    bigEyes(c, s, -s * .06, .11, .085, '#2a1a3a', false); grin(c, s, s * .08);
  },
  // poison: wobbly purple goo with rising bubbles
  toxa(c, s, t) {
    const j = Math.sin(t * 6) * .05;
    c.fillStyle = '#7a2ab0'; ol(c, s * .055);
    c.beginPath(); c.moveTo(-s * .32, s * .24);
    c.quadraticCurveTo(-s * (.36 - j), -s * (.24 + j), 0, -s * (.3 + j)); c.quadraticCurveTo(s * (.36 - j), -s * (.24 + j), s * .32, s * .24);
    c.quadraticCurveTo(s * .2, s * .18, s * .12, s * .3); c.quadraticCurveTo(0, s * .2, -s * .12, s * .28); c.quadraticCurveTo(-s * .2, s * .18, -s * .32, s * .24);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-s * .13, -s * .14, s * .06, s * .1, -.4, 0, 7); c.fill();
    c.fillStyle = '#7dff6a'; for (const [px, r] of [[-.1, .035], [.06, .045], [.15, .03]]) { c.beginPath(); c.arc(px * s, -s * (.32 + j) - ((t * .7 + px + 1) % 1) * s * .15, r * s, 0, 7); c.fill(); c.stroke(); }
    bigEyes(c, s, -s * .04, .12, .085, '#3a0a4a', true); grin(c, s, s * .12, true);
  },
  // ice: snowball cub with icicle ears
  frosty(c, s, t) {
    feet(c, s, s * .27, '#7fb0d8', t);
    c.fillStyle = '#bfefff'; ol(c, s * .045);
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * .1, -s * .22); c.lineTo(sd * s * .2, -s * .46); c.lineTo(sd * s * .26, -s * .16); c.closePath(); c.fill(); c.stroke(); }
    body(c, s, .31, .29, '#d8f2ff', '#4f8ac0', 0);
    c.fillStyle = 'rgba(120,190,240,.5)'; c.beginPath(); c.ellipse(0, s * .13, s * .16, s * .09, 0, 0, 7); c.fill();
    bigEyes(c, s, -s * .05, .12, .085, '#1d6fb8', false); grin(c, s, s * .11);
    c.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; c.beginPath(); c.arc(Math.cos(a) * s * .4, Math.sin(a) * s * .25 - s * .1, s * .025, 0, 7); c.fill(); }
  },
};

function eyes(c, s, y, r, pupil, big) {
  const R = s * r * (big ? 1.4 : 1);
  for (const ex of [-1, 1]) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex * s * (big ? .1 : .07), y, R, 0, 7); c.fill(); ol(c, Math.max(1, s * .03)); c.stroke();
    c.fillStyle = pupil; c.beginPath(); c.arc(ex * s * (big ? .1 : .07) + R * .2, y + R * .1, R * .5, 0, 7); c.fill();
  }
}

function drawEnemyArt(c, id, x, y, size, t, o = {}) {
  const fn = ENEMY_ART[id];
  if (!fn) return false;
  c.save();
  shadow(c, x, y + size * .3, size * .3, size * .09);
  c.translate(x, y);
  if (o.dir < 0) c.scale(-1, 1);
  if (o.flash) c.globalAlpha = .55;
  fn(c, size, t);
  c.restore();
  return true;
}

// ------------------------------------------------------------------ portal + castle (home)
function drawPortal(c, x, y, s, t) {
  shadow(c, x, y + s * .3, s * .45, s * .14);
  ol(c, s * .05);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; c.fillStyle = k % 2 ? '#8c877f' : '#a19c94'; c.beginPath(); c.ellipse(x + Math.cos(a) * s * .42, y + Math.sin(a) * s * .3, s * .1, s * .08, a, 0, 7); c.fill(); c.stroke(); }
  const g = c.createRadialGradient(x, y, 1, x, y, s * .36);
  g.addColorStop(0, '#f2d7ff'); g.addColorStop(.5, '#9b4dff'); g.addColorStop(1, '#3a0a6a');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, s * .34, s * .24, 0, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2.5;
  for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x, y, s * (.28 - k * .08), s * (.2 - k * .055), t * (2 + k), 0, 4.2); c.stroke(); }
}
function drawCastle(c, x, y, s, t) {
  shadow(c, x, y + s * .3, s * .48, s * .13);
  ol(c, s * .045);
  const stone = '#b8b2a6', dark = '#8c867c';
  for (const sx of [-1, 1]) {
    c.fillStyle = stone; c.beginPath(); c.roundRect(x + sx * s * .3 - s * .12, y - s * .38, s * .24, s * .66, 3); c.fill(); c.stroke();
    c.fillStyle = '#2f7fe0'; c.beginPath(); c.moveTo(x + sx * s * .3 - s * .15, y - s * .36); c.lineTo(x + sx * s * .3, y - s * .6); c.lineTo(x + sx * s * .3 + s * .15, y - s * .36); c.closePath(); c.fill(); c.stroke();
  }
  c.fillStyle = dark; c.beginPath(); c.roundRect(x - s * .22, y - s * .22, s * .44, s * .5, 3); c.fill(); c.stroke();
  for (let k = -2; k <= 2; k++) { c.fillStyle = stone; c.beginPath(); c.rect(x + k * s * .09 - s * .035, y - s * .3, s * .07, s * .08); c.fill(); c.stroke(); }
  c.fillStyle = '#5a3a1c'; c.beginPath(); c.moveTo(x - s * .09, y + s * .28); c.lineTo(x - s * .09, y + s * .02); c.arc(x, y + s * .02, s * .09, Math.PI, 0); c.lineTo(x + s * .09, y + s * .28); c.closePath(); c.fill(); c.stroke();
  const wv = Math.sin(t * 3) * s * .03;
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - s * .3); c.lineTo(x, y - s * .62); c.stroke();
  c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(x, y - s * .62); c.lineTo(x + s * .2 + wv, y - s * .56); c.lineTo(x, y - s * .48); c.closePath(); c.fill(); ol(c, 1.5); c.stroke();
}

// little round shield for the castle guardian
function drawShield(c, x, y, s) {
  ol(c, s * .06);
  c.fillStyle = '#2f7fe0'; c.beginPath(); c.moveTo(x, y - s * .3); c.quadraticCurveTo(x + s * .28, y - s * .28, x + s * .26, y); c.quadraticCurveTo(x + s * .2, y + s * .24, x, y + s * .34); c.quadraticCurveTo(x - s * .2, y + s * .24, x - s * .26, y); c.quadraticCurveTo(x - s * .28, y - s * .28, x, y - s * .3); c.fill(); c.stroke();
  c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(x, y - s * .16); c.lineTo(x + s * .05, y - s * .03); c.lineTo(x + s * .15, y - s * .03); c.lineTo(x + s * .07, y + s * .05); c.lineTo(x + s * .1, y + s * .17); c.lineTo(x, y + s * .09); c.lineTo(x - s * .1, y + s * .17); c.lineTo(x - s * .07, y + s * .05); c.lineTo(x - s * .15, y - s * .03); c.lineTo(x - s * .05, y - s * .03); c.closePath(); c.fill(); c.stroke();
}

// ------------------------------------------------------------------ mountains and hills (big props)
PROPS.mountain = function (c, x, y, s, t, n) {
  shadow(c, x, y + s * .3, s * .55, s * .14);
  ol(c, s * .045);
  const peaks = [[-.28, -.32, .3], [.22, -.22, .26], [0, -.5, .34]];
  for (const [px, py, w] of peaks) {
    c.fillStyle = '#8a7a6a';
    c.beginPath(); c.moveTo(x + (px - w) * s, y + s * .3); c.lineTo(x + px * s, y + py * s); c.lineTo(x + (px + w) * s, y + s * .3); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6a5c50';   // shaded side
    c.beginPath(); c.moveTo(x + px * s, y + py * s); c.lineTo(x + (px + w) * s, y + s * .3); c.lineTo(x + (px + w * .25) * s, y + s * .3); c.closePath(); c.fill();
    c.fillStyle = '#f4f8ff';   // snow cap
    c.beginPath(); c.moveTo(x + px * s, y + py * s); c.lineTo(x + (px + w * .38) * s, y + (py + .16) * s); c.lineTo(x + (px + w * .12) * s, y + (py + .12) * s);
    c.lineTo(x + (px - w * .1) * s, y + (py + .18) * s); c.lineTo(x + (px - w * .36) * s, y + (py + .15) * s); c.closePath(); c.fill(); c.stroke();
  }
};
PROPS.hill = function (c, x, y, s) {
  shadow(c, x, y + s * .22, s * .48, s * .12);
  ol(c, s * .045);
  c.fillStyle = '#5a9a3a'; c.beginPath(); c.ellipse(x, y + s * .2, s * .46, s * .32, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(160,230,120,.45)'; c.beginPath(); c.ellipse(x - s * .14, y - s * .02, s * .16, s * .08, -.3, 0, 7); c.fill();
  c.fillStyle = '#ff7eb6'; for (const [a, b] of [[-.2, .1], [.15, .05], [.05, .15]]) { c.beginPath(); c.arc(x + a * s, y + b * s, s * .025, 0, 7); c.fill(); }
};

// ------------------------------------------------------------------ night: darkness with holes cut by every light
function drawNightOverlay(c, lc, lights, t) {
  const W = c.canvas.width, H = c.canvas.height;
  if (lc.width !== W || lc.height !== H) { lc.width = W; lc.height = H; }
  const l = lc.getContext('2d');
  l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, W, H);
  l.fillStyle = 'rgba(5,10,32,0.68)'; l.fillRect(0, 0, W, H);
  l.globalCompositeOperation = 'destination-out';
  for (const L of lights) {
    const r = L.r * (1 + Math.sin(t * 9 + L.x * .1) * (L.flicker || 0));
    const g = l.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.beginPath(); l.arc(L.x, L.y, r, 0, 7); l.fill();
  }
  c.drawImage(lc, 0, 0);
  // coloured glow on top
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    if (!L.color) continue;
    const r = L.r * .7;
    const g = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
    g.addColorStop(0, L.color); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(L.x, L.y, r, 0, 7); c.fill();
  }
  c.restore();
}

// fireflies / stars twinkle at night
function drawNightSparkles(c, W, H, t) {
  for (let i = 0; i < 26; i++) {
    const x = (hash2(i, 3) * W + Math.sin(t * .6 + i) * 30) % W, y = (hash2(5, i) * H + Math.cos(t * .5 + i * 2) * 20) % H;
    const a = .4 + .6 * Math.abs(Math.sin(t * 2 + i));
    c.fillStyle = `rgba(220,255,140,${a})`; c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill();
  }
}

// ------------------------------------------------------------------ connected fence (auto-tiles with neighbours)
function drawFence(c, x, y, T, con) {
  const L = con.l, R = con.r, U = con.u, D = con.d;
  const lone = !L && !R && !U && !D;
  const h = T / 2;
  ol(c, Math.max(2, T * .045));
  const plank = (x0, y0, x1, y1, w) => {
    c.fillStyle = '#9b6a35';
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len * w / 2, ny = dx / len * w / 2;
    c.beginPath(); c.moveTo(x0 + nx, y0 + ny); c.lineTo(x1 + nx, y1 + ny); c.lineTo(x1 - nx, y1 - ny); c.lineTo(x0 - nx, y0 - ny); c.closePath(); c.fill(); c.stroke();
  };
  const post = (px, py) => {
    c.fillStyle = '#b77a44';
    const w = T * .13, top = py - T * .42, bot = py + T * .16;
    c.beginPath(); c.moveTo(px - w, bot); c.lineTo(px - w, top + T * .07); c.lineTo(px, top); c.lineTo(px + w, top + T * .07); c.lineTo(px + w, bot); c.closePath(); c.fill(); c.stroke();
  };
  const pw = T * .095;
  // vertical runs: rails go up/down the screen (drawn first, posts on top)
  if (U || D) {
    const y0 = U ? y - h : y, y1 = D ? y + h : y;
    plank(x - T * .07, y0 - T * .12, x - T * .07, y1 - T * .12, pw);
    plank(x + T * .07, y0 - T * .02, x + T * .07, y1 - T * .02, pw);
  }
  // horizontal runs
  if (L || R || lone) {
    const x0 = L || lone ? x - h : x, x1 = R || lone ? x + h : x;
    shadow(c, (x0 + x1) / 2, y + T * .16, (x1 - x0) / 2, T * .05);
    plank(x0, y - T * .16, x1, y - T * .16, pw);
    plank(x0, y - T * .01, x1, y - T * .01, pw);
  }
  // posts: centre, plus the half-way posts along every connected side
  const posts = [[x, y]];
  if (L || lone) posts.push([x - h * .9, y]);
  if (R || lone) posts.push([x + h * .9, y]);
  if (U) posts.push([x, y - h]);
  posts.sort((a, b) => a[1] - b[1]);
  for (const [px, py] of posts) post(px, py);
}

// ------------------------------------------------------------------ fence as one continuous network (like the road)
function drawFenceNetwork(c, m, cols, rows, T) {
  const isF = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && m.decor[y * cols + x] === 'fence';
  const cx = (v) => v * T + T / 2;
  const segs = [], posts = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (!isF(x, y)) continue;
    const r = isF(x + 1, y), d = isF(x, y + 1), l = isF(x - 1, y), u = isF(x, y - 1);
    if (r) segs.push([cx(x), cx(y), cx(x + 1), cx(y)]);
    if (d) segs.push([cx(x), cx(y), cx(x), cx(y + 1)]);
    if (!r && !d && !l && !u) segs.push([cx(x) - T * .45, cx(y), cx(x) + T * .45, cx(y)]);   // a lone piece
    posts.push([cx(x), cx(y)]);
    if (r) posts.push([cx(x) + T / 2, cx(y)]);
    if (d) posts.push([cx(x), cx(y) + T / 2]);
    if (!r && !d && !l && !u) posts.push([cx(x) - T * .42, cx(y)], [cx(x) + T * .42, cx(y)]);
  }
  if (!segs.length) return;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  // two rails, each an outline pass then a wood pass, so joins and corners melt together like the road
  for (const off of [-.2, -.03]) {
    for (const [w, col] of [[T * .15, INK], [T * .09, '#9b6a35']]) {
      c.strokeStyle = col; c.lineWidth = w;
      c.beginPath();
      for (const [x0, y0, x1, y1] of segs) { c.moveTo(x0, y0 + off * T); c.lineTo(x1, y1 + off * T); }
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,220,160,.35)'; c.lineWidth = T * .025;
    c.beginPath();
    for (const [x0, y0, x1, y1] of segs) { c.moveTo(x0, y0 + off * T - T * .02); c.lineTo(x1, y1 + off * T - T * .02); }
    c.stroke();
  }
  // posts in front, back to front
  posts.sort((a, b) => a[1] - b[1]);
  ol(c, Math.max(2, T * .045));
  for (const [px, py] of posts) {
    const w = T * .12, top = py - T * .42, bot = py + T * .14;
    c.fillStyle = 'rgba(30,15,5,.25)'; c.beginPath(); c.ellipse(px, bot, w * 1.4, T * .05, 0, 0, 7); c.fill();
    c.fillStyle = '#b77a44';
    c.beginPath(); c.moveTo(px - w, bot); c.lineTo(px - w, top + T * .07); c.lineTo(px, top); c.lineTo(px + w, top + T * .07); c.lineTo(px + w, bot); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,220,160,.4)'; c.fillRect(px - w * .6, top + T * .1, w * .35, (bot - top) * .6);
  }
  c.restore();
}
