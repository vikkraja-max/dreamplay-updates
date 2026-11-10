/* Monstermon Aventura - game data. Every creature, place and character here is an original design
   (the three starters were designed by the player's family). */

export const TYPES = {
  normal: { name: 'Normal', color: '#a8a8a0' }, metal: { name: 'Metal', color: '#8fa3b8' }, zjarr: { name: 'Zjarr', color: '#ff7a2a' },
  uje: { name: 'Ujë', color: '#3b8fd6' }, bime: { name: 'Bimë', color: '#4fb84a' }, rrufe: { name: 'Rrufe', color: '#f2c81e' },
  lufte: { name: 'Luftë', color: '#e0457a' }, ere: { name: 'Erë', color: '#8fd6e8' }, guri: { name: 'Gur', color: '#a8865a' },
  fantazme: { name: 'Fantazmë', color: '#8a5ad6' },
};

// attacker type -> defender type -> multiplier
const E = {
  zjarr: { bime: 2, metal: 2, uje: .5, guri: .5, zjarr: .5 },
  uje: { zjarr: 2, guri: 2, bime: .5, uje: .5 },
  bime: { uje: 2, guri: 2, zjarr: .5, bime: .5, metal: .5 },
  rrufe: { uje: 2, ere: 2, guri: .5, bime: .5 },
  lufte: { metal: 2, guri: 2, normal: 2, fantazme: 0, ere: .5 },
  metal: { guri: 2, ere: 1, zjarr: .5, uje: .5, metal: .5 },
  ere: { lufte: 2, bime: 2, rrufe: .5, guri: .5, metal: .5 },
  guri: { zjarr: 2, ere: 2, lufte: .5, metal: .5 },
  fantazme: { fantazme: 2, normal: 0 },
  normal: { guri: .5, metal: .5, fantazme: 0 },
};
export function effectiveness(moveType, defTypes) {
  return defTypes.reduce((m, t) => m * ((E[moveType] || {})[t] ?? 1), 1);
}

export const MOVES = {
  gervishtje: { name: 'Gërvishtje', type: 'normal', power: 40, acc: 100 },
  zinxhir: { name: 'Zinxhir Hekuri', type: 'metal', power: 55, acc: 95 },
  frymezjarri: { name: 'Frymë Zjarri', type: 'zjarr', power: 60, acc: 95 },
  gjemba: { name: 'Rrotullim Gjembash', type: 'metal', power: 80, acc: 90 },
  harku: { name: 'Goditje Harku', type: 'metal', power: 45, acc: 100 },
  fluturimx: { name: 'Fluturim X', type: 'ere', power: 60, acc: 95, fly: true },
  prerje: { name: 'Prerje Metali', type: 'metal', power: 70, acc: 95 },
  stuhi: { name: 'Stuhi Ere', type: 'ere', power: 85, acc: 85, fly: true },
  grushtroze: { name: 'Grusht Rozë', type: 'lufte', power: 45, acc: 100 },
  dyfishte: { name: 'Grusht i Dyfishtë', type: 'lufte', power: 60, acc: 95 },
  syri: { name: 'Syri Hipnotik', type: 'fantazme', power: 50, acc: 100 },
  supergrusht: { name: 'Super Grusht', type: 'lufte', power: 85, acc: 85 },
  flake: { name: 'Flakë', type: 'zjarr', power: 40, acc: 100 },
  shpertim: { name: 'Shpërthim Zjarri', type: 'zjarr', power: 70, acc: 90 },
  sperkatje: { name: 'Spërkatje', type: 'uje', power: 40, acc: 100 },
  vala: { name: 'Vala', type: 'uje', power: 65, acc: 95 },
  gjethe: { name: 'Gjethe Brisk', type: 'bime', power: 45, acc: 100 },
  hardhi: { name: 'Hardhia', type: 'bime', power: 65, acc: 95 },
  fllad: { name: 'Fllad', type: 'ere', power: 40, acc: 100 },
  vorbull: { name: 'Vorbull', type: 'ere', power: 65, acc: 90 },
  shkendije: { name: 'Shkëndijë', type: 'rrufe', power: 40, acc: 100 },
  rrufeja: { name: 'Rrufeja', type: 'rrufe', power: 70, acc: 90 },
  gur: { name: 'Hedh Gur', type: 'guri', power: 50, acc: 90 },
  dridhje: { name: 'Dridhje', type: 'guri', power: 70, acc: 90 },
  hije: { name: 'Hije', type: 'fantazme', power: 45, acc: 100 },
  frike: { name: 'Frikë', type: 'fantazme', power: 65, acc: 95 },
  perplasje: { name: 'Përplasje', type: 'normal', power: 50, acc: 95 },
};

// base stats: hp, atk, def, spd
export const SPECIES = {
  dracometal: { name: 'Dracometal', types: ['metal', 'zjarr'], base: [52, 64, 72, 45], catch: 0.3, starter: true,
    about: 'Një orë dore me zinxhir hekuri dhe gjemba. Fusha e orës është fytyra e një dragoi.',
    learn: [[1, 'gervishtje'], [1, 'zinxhir'], [7, 'frymezjarri'], [11, 'perplasje'], [14, 'gjemba']] },
  metasteal: { name: 'Metasteal', types: ['metal', 'ere'], base: [46, 58, 56, 74], catch: 0.3, starter: true,
    about: 'Dy këmbë metali si hark dhe koka petashuqe në mes. Kur fluturon, këmbët bashkohen si X.',
    learn: [[1, 'harku'], [1, 'gervishtje'], [6, 'fluturimx'], [10, 'prerje'], [14, 'stuhi']] },
  pinkpunch: { name: 'Pinkpunch', types: ['lufte'], base: [56, 76, 48, 56], catch: 0.3, starter: true,
    about: 'Dy krahë hekuri me doreza boksi rozë dhe një kokë trekëndëshe me një sy.',
    learn: [[1, 'grushtroze'], [1, 'gervishtje'], [6, 'syri'], [9, 'dyfishte'], [14, 'supergrusht']] },
  flakez: { name: 'Flakëz', types: ['zjarr'], base: [39, 52, 43, 62], catch: 0.55, about: 'Një top zjarri që digjet nga inati.',
    learn: [[1, 'flake'], [1, 'gervishtje'], [8, 'shpertim']] },
  pikez: { name: 'Pikëz', types: ['uje'], base: [44, 48, 62, 43], catch: 0.55, about: 'Një pikë uji që qan gjithë kohën.',
    learn: [[1, 'sperkatje'], [1, 'perplasje'], [8, 'vala']] },
  gjethak: { name: 'Gjethak', types: ['bime'], base: [46, 50, 50, 45], catch: 0.55, about: 'Gjethe e zemëruar që rritet në barin e lartë.',
    learn: [[1, 'gjethe'], [1, 'gervishtje'], [8, 'hardhi']] },
  erez: { name: 'Erëz', types: ['ere'], base: [40, 46, 40, 72], catch: 0.5, about: 'Një re e vogël e mërzitur që fryn.',
    learn: [[1, 'fllad'], [1, 'perplasje'], [9, 'vorbull']] },
  zhurmak: { name: 'Zhurmak', types: ['rrufe'], base: [40, 56, 40, 82], catch: 0.45, about: 'Bateri e nxehur që lëshon shkëndija.',
    learn: [[1, 'shkendije'], [1, 'perplasje'], [8, 'rrufeja']] },
  gurgull: { name: 'Gurgull', types: ['guri'], base: [52, 62, 88, 25], catch: 0.45, about: 'Gur kokëfortë, shumë i rëndë.',
    learn: [[1, 'gur'], [1, 'perplasje'], [9, 'dridhje']] },
  hijezi: { name: 'Hijezi', types: ['fantazme'], base: [42, 62, 45, 66], catch: 0.4, about: 'Fantazmë e trishtuar që del natën.',
    learn: [[1, 'hije'], [1, 'gervishtje'], [9, 'frike']] },
};

export function statsOf(m) {
  const sp = SPECIES[m.sp], L = m.lv, [h, a, d, s] = sp.base;
  return {
    hp: Math.floor(h * 2 * L / 100 + L + 12),
    atk: Math.floor(a * 2 * L / 100 + 5),
    def: Math.floor(d * 2 * L / 100 + 5),
    spd: Math.floor(s * 2 * L / 100 + 5),
  };
}
export const xpForLevel = (L) => Math.floor(L * L * L * 0.8);
export function movesAt(sp, lv) {
  const list = SPECIES[sp].learn.filter(([l]) => l <= lv).map(([, m]) => m);
  return [...new Set(list)].slice(-4);
}
export function makeMon(sp, lv, mood = 'happy') {
  const m = { sp, lv, xp: xpForLevel(lv), moves: movesAt(sp, lv), mood, uid: Math.random().toString(36).slice(2) };
  m.hp = statsOf(m).hp;
  return m;
}

// ---------------------------------------------------------------- the world map (28 x 36)
// . grass  , tall grass  = path  T tree  W water  B bridge  F fence  R rock  f flowers  M mountain
// A arena floor  h house  C chest  S sign  Q fountain
const RAW = [
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMMMAAAAAAAAAAAAMMMMMMMM',
  'MMMMMMMAAAAAAAAAAAAAAMMMMMMM',
  'MMMMMMMAAAAAAAAAAAAAAMMMMMMM',
  'MMMMMMMAAAAAAAAAAAAAAMMMMMMM',
  'MMMMMMMMMMMMM==MMMMMMMMMMMMM',
  'TTTTTTTTTTTTT==TTTTTTTTTTTTT',
  'TT,,,,TT.....==.....TT,,,,TT',
  'TT,,,,TT.TTTT==TTTT.TT,,,,TT',
  'TT,,,,...T...==...T...,,,,TT',
  'TT..C....T.,,==,,.T...Q...TT',
  'TTTTTT...T.,,==,,.T...TTTTTT',
  'TT.......TTTT==TTTT.......TT',
  'TT.,,,,,,.....==.....,,,,.TT',
  'TT.,,,,,,.....==.....,,,,.TT',
  'TTTTTTTTTTTTT==TTTTTTTTTTTTT',
  '....fff......==.......fff...',
  '.,,,,,,,,....==....,,,,,,,,.',
  '.,,,,,,,,....==....,,,,,,,,.',
  '.,,,,,,,,....==....,,,,,,,,.',
  'WWWWWWWWWWWWWBBWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWBBWWWWWWWWWWWWW',
  '..R.....,,,,.==.,,,,....R...',
  '...,,,,,,,,,.==.,,,,,,,,,...',
  'F..,,,,,,,,,.==.,,,,,,,,,..F',
  'FFFFFFFFFFFFF==FFFFFFFFFFFFF',
  'ff..........====..........ff',
  '..hhhh......====......hhhh..',
  '..hhhh......====......hhhh..',
  '..hhhh......====......hhhh..',
  '....=.......====.......=....',
  '....====================....',
  '..f.......S..............f..',
  'T.......ffff.....ffff......T',
  'TT........................TT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];
export const COLS = 28, ROWS = RAW.length;
export const MAP = RAW.map((r) => (r + '.'.repeat(COLS)).slice(0, COLS));
export const tileAt = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? 'M' : MAP[y][x];
export const BLOCKED = new Set(['T', 'W', 'F', 'R', 'M', 'h', 'C', 'S', 'Q']);

export const HOUSES = [
  { x: 2, y: 27, w: 4, h: 3, roof: '#d64545', name: 'Shtëpia jote' },
  { x: 22, y: 27, w: 4, h: 3, roof: '#3fa34d', name: 'Laboratori i Profesor Green' },
];

export const START = { x: 4, y: 31, dir: 'down' };
export const GATE_ROW = 25;      // can't pass without a monstermon

export const AREAS = [
  { name: 'Fshati i Gjelbër', y0: 26, y1: 35 },
  { name: 'Rruga 1', y0: 16, y1: 25, wild: [['flakez', 3, 5], ['pikez', 3, 5], ['gjethak', 3, 5], ['erez', 3, 5]] },
  { name: 'Pylli i Errët', y0: 6, y1: 15, wild: [['zhurmak', 6, 8], ['hijezi', 6, 8], ['gurgull', 6, 8], ['gjethak', 6, 8], ['erez', 6, 8]] },
  { name: 'Arena e Hekurt', y0: 0, y1: 5 },
];
export const areaAt = (y) => AREAS.find((a) => y >= a.y0 && y <= a.y1) || AREAS[0];

// people: professor, rival, trainers and the boss (all original characters)
export const NPCS = [
  { id: 'prof', name: 'Profesor Green', x: 23, y: 30, dir: 'down', look: 'prof' },
  { id: 'rina', name: 'Rina', x: 16, y: 31, dir: 'left', look: 'rival' },
  { id: 'mom', name: 'Mami', x: 5, y: 32, dir: 'up', look: 'mom' },
  { id: 't1', name: 'Andi me kapelë', x: 6, y: 22, dir: 'right', look: 'kid1', sight: 4, team: [['flakez', 4]], coins: 40,
    hello: 'Hej! Monstrat tona duhet të luftojnë!', lose: 'Uau, je i fortë!' },
  { id: 't2', name: 'Lea e luleve', x: 21, y: 23, dir: 'left', look: 'kid2', sight: 4, team: [['gjethak', 5], ['pikez', 5]], coins: 60,
    hello: 'Lulet e mia nuk duan të shkelen! Lufto!', lose: 'Oh jo... lulet e mia...' },
  { id: 't3', name: 'Gjahtari Dren', x: 10, y: 13, dir: 'right', look: 'hunter', sight: 3, team: [['zhurmak', 7], ['gurgull', 7]], coins: 90,
    hello: 'Në pyllin tim nuk kalon kush pa luftuar!', lose: 'Mirë... kalo, kalo.' },
  { id: 't4', name: 'Mira e hijeve', x: 19, y: 9, dir: 'left', look: 'ghostgirl', sight: 3, team: [['hijezi', 8], ['erez', 8]], coins: 100,
    hello: 'Hijet e mia të kanë parë që larg...', lose: 'Hijet u zhdukën...' },
  { id: 'boss', name: 'Kapiteni Hekur', x: 13, y: 2, dir: 'down', look: 'boss', sight: 2, team: [['gurgull', 10], ['zhurmak', 10], ['hijezi', 11]], coins: 300, boss: true,
    hello: 'Pra, ti je trajneri që po flasin të gjithë. Arena e Hekurt është e imja. Tregoji forcën!',
    lose: 'E pabesueshme... Ti e meriton KUPËN E HEKURT! 🏆' },
];
export const CHESTS = [{ x: 4, y: 10, items: { kub: 3, molle: 2 } }];
export const SIGNS = [{ x: 10, y: 32, text: 'Fshati i Gjelbër. Në veri: Rruga 1, Pylli i Errët dhe Arena e Hekurt.' }];
export const FOUNTAIN = { x: 22, y: 10 };
