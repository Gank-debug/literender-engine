// DRAFT: the plague town, larger, after Die2Nite. A walled camp of shacks in the dust: a ring of scrap-and-stake walls,
// one house for every soul, the well, the workshop with its scaffold, the bank, the watchtower, the gate; beyond it, the
// World Beyond: dunes, ruins, bones and dead trees. Same engine as the monastery and the small town.
window.MAPS = window.MAPS || {};
MAPS.town2 = { key: 'town2', name: 'The Plague Town (large draft)', size: [48, 46], view: { W: 940, H: 640, ox: 459, oy: 104 } };
MAPS.town2.scene = function (t = 0, N = 4) {
  const M = MAPS.town2;
  const e = ENG({ ...M.view, K: 1, t, N, noVig: 1, noWeather: 1, amb: { in: [.42, .36, .3], out: [.78, .66, .5] } });
  const { T, PH, smoke, S, px, hs, vn, sh, mix, iso, box, stone, TIM, TIMD, GRY, STN, light, add, B, candle, lamp, drawAll, backN, backW, low, ground, D, deadTree, finish } = e;
  const inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  const WALL = [5, 5, 43, 41], GATE = [22, 26];                    // the camp's wall, and its gate on the south side
  // ---- what stands in the camp
  const CHURCH = [7, 7, 14, 14], CANTEEN = [16, 7, 24, 12], APOTH = [26, 7, 32, 12], BANK = [34, 7, 40, 12];
  const HOUSES = []; for (const y of [17, 23, 29]) for (const x of [7, 12.5, 33.5, 39]) HOUSES.push([x, y, x + 4, y + 4]); HOUSES.splice(11, 1); HOUSES.splice(3, 1);
  HOUSES.push([7, 35, 11, 39], [12.5, 35, 16.5, 39]);              // ten houses in all, a door each
  const SAND = [190, 160, 108], DUST = [168, 136, 92], OCHRE = [176, 128, 72];
  const plankW = seed => (u, z) => { const k = Math.floor(u / 5), dk = .72 + hs(k, seed) * .3; if (z > 4 && z < 6 || (u % 5) < .7) return sh(TIMD, .75); if (hs(k, seed + 3) < .12 && z > 18 && z < 28) return sh([120, 112, 104], .9); return sh([[138, 112, 82], [124, 100, 72], [150, 124, 90]][Math.floor(hs(k, seed + 7) * 3)], dk * (.85 + vn(u / 9, z / 13) * .25)); };
  const tin = (u, z) => sh([118, 106, 96], .7 + (Math.floor(u / 3) % 2 ? .12 : 0) + vn(u / 20, z / 8) * .2 - (vn(u / 6 + 9, z / 6) > .7 ? .25 : 0));
  const thatch = (u, z) => sh([126, 104, 62], .6 + hs(Math.floor(u), Math.floor(z / 2)) * .35 - (Math.floor(u) % 3 === 0 ? .12 : 0));
  const kirk = (u, z) => sh(stone(u, z, [[176, 164, 140], [160, 146, 120], [140, 126, 104], [190, 178, 152]], 11, 5), .72 + vn(u / 31, z / 17 + 3) * .3);
  const segd = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t2 = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - dx * t2, y - a[1] - dy * t2); };
  const ROADS = [[[24, 41], [24, 14]], [[9, 15.5], [41, 15.5]], [[24, 27], [36, 27]], [[24, 27], [12, 27]], [[24, 33.5], [12, 33.5]], [[24, 50], [24, 41]], [[24, 50], [10, 58]]];
  // ---- the ground: packed dust in the camp, wheel ruts on the streets, sand dunes beyond the wall
  ground((x, y) => { const n = hs(Math.floor(x * 9), Math.floor(y * 9)), inside = inR(WALL, x, y);
    for (const r of [CHURCH, CANTEEN, APOTH, BANK, ...HOUSES]) if (inR(r, x, y)) { const k = Math.floor((r === CHURCH ? y : x) * 2), ed = ((r === CHURCH ? y : x) * 2 - k) < .12; const c = r === CHURCH ? sh(stone(x * 10, y * 10, GRY, 12, 6), .9) : ed ? sh(TIMD, .6) : sh([[132, 104, 72], [120, 94, 64], [110, 86, 58]][Math.floor(hs(k, 7) * 3)], .9 + n * .1); const ao = Math.min(x - r[0], y - r[1]); return [ao < .8 ? sh(c, .62 + ao * .45) : c, 1]; }
    let road = 9; for (const [a, b] of ROADS) road = Math.min(road, segd(x, y, a, b));
    if (inside) { let c = mix(sh(DUST, .8 + n * .18), sh(SAND, .85 + n * .15), vn(x * .5, y * .5));
      if (road < 1.4) { c = mix(c, sh([150, 116, 80], .8 + n * .2), .7); const rut = Math.abs(road - .7) < .12; if (rut) c = sh(c, .72); }
      if (vn(x * 1.3 + 7, y * 1.3) > .8) c = mix(c, [120, 104, 82], .5);        // trampled dirt
      const ao = Math.min(x - WALL[0], y - WALL[1]); if (ao < 1.2) c = sh(c, .6 + ao * .33); return [c, 0]; }
    // the World Beyond: dunes with ripples and long shadows, the old road out, scattered stones
    const du = Math.sin(x * .32 + Math.sin(y * .21) * 2.2) * .5 + .5, rip = Math.sin((x * 1.7 + y * .9) * 2.4 + vn(x * .3, y * .3) * 3) > .97;
    let c = mix(sh(SAND, .78 + n * .14), sh(OCHRE, .7 + n * .12), du * .55); if (rip) c = sh(c, .86); if (vn(x * .9 + 3, y * .9) > .82) c = mix(c, [120, 104, 86], .55);
    if (road < 1.1 && y > 41) c = mix(c, sh([150, 120, 86], .9), .55);
    return [c, 0]; });
  // ---- far off: dead trees and the ruins of the old villages
  for (let i = 0; i < 11; i++) deadTree(-1 - hs(i, 1) * 2.4, -1 + i * 4.2, i + 3, 46); for (let i = 0; i < 11; i++) deadTree(1 + i * 4.3, -1.6 - hs(i, 4) * 2, i + 20, 46); drawAll();
  S.Z = 1;
  // ---- the church: the one stone building, its bell in a wooden cage on the roof
  { const r = CHURCH; backN(r, 84, kirk, [D.slit(20, 46), D.cross(40, 40), D.slit(60, 46)], thatch); backW(r, 84, kirk, [D.slit(18, 46), D.sconce(40, 34), D.slit(62, 46)], thatch);
    light(10.5, 8, 30, 50, .7); B(9.2, 7.6, 0, 3, 1, 8, [150, 146, 140], null, (u, z) => z > 5 ? [120, 36, 38] : sh(stone(u, z, GRY, 8, 4), .8)); candle(9.6, 8, 8, 40, .6); candle(11.8, 8, 8, 40, .6);
    for (const y of [9.8, 11.4]) for (const x of [7.6, 11.2]) { B(x, y, 0, 2.4, .6, 5, [100, 74, 48]); B(x, y + .5, 5, 2.4, .14, 5, [86, 62, 40]); }
    B(7.3, 6.4, 84, 1.6, 1.6, 22, null, (u, z) => (u % 7 < 1.2 || z < 2 || z > 20) ? [80, 60, 40] : [24, 20, 18], (u, z) => (u % 7 < 1.2 || z < 2 || z > 20) ? [70, 52, 36] : [20, 16, 14]); drawAll(); }
  // ---- the canteen: long tables, a stove, sacks
  { const r = CANTEEN; backN(r, 56, plankW(4), [D.win(12, 26, 1), D.hearth(40), D.sign ? D.sign(70, 40) : D.win(70, 26)], tin);
    light(19.5, 7.6, 6, 90, 1.1); for (const [x, y] of [[16.8, 9.2], [20.6, 9.6]]) { B(x, y, 7, 3, 1, 2, TIM); for (const dx of [.2, 2.6]) B(x + dx, y + .1, 0, .3, .8, 7, TIMD); }
    for (const [x, y] of [[22.8, 7.4], [23, 8.6]]) B(x, y, 0, .9, .9, 6, [150, 132, 96], [170, 150, 110]); drawAll(); }
  // ---- the apothecary: jars, a green lamp, a sick cot
  { const r = APOTH; backN(r, 56, plankW(9), [D.shelf(8, 18, 30, 34, [[150, 170, 104], [130, 96, 70], [100, 140, 96], [180, 170, 146]]), D.win(46, 26, 1)], tin);
    light(29, 7.6, 30, 60, .8, [.6, 1, .5]); B(26.8, 9.4, 7, 2.6, 1.2, 2, TIM); B(30.4, 9, 0, 1.4, 2.6, 4, TIMD, (u, v) => v < 6 ? [200, 196, 180] : [150, 140, 110]); drawAll(); }
  // ---- the bank: crates, sacks and a counter; the town's stash lives here
  { const r = BANK; backN(r, 60, plankW(2), [D.sign ? D.sign(18, 42) : D.win(18, 26), D.win(44, 26, 1)], tin);
    light(37, 9, 20, 70, .9); B(34.6, 9.6, 0, 4.6, .8, 9, [104, 78, 50], null, (u, z) => sh(TIM, (Math.floor(u) % 6 === 0 ? .5 : .78)));
    for (const [x, y, h] of [[38.6, 7.4, 8], [39.2, 8.5, 6], [35, 7.3, 7], [36.1, 7.3, 5]]) B(x, y, 0, 1, 1, h, [150, 120, 80], (u, v) => sh([170, 136, 92], .9 + (Math.floor(u) % 5 === 0 ? -.3 : 0)), (u, z) => (Math.floor(z) % 4 === 0 ? [96, 72, 48] : [140, 110, 74]));
    drawAll(); }
  // ---- the houses: one for each, plank walls and tin roofs, a door, a cot inside
  HOUSES.forEach((r, i) => { backN(r, 44, i % 3 ? plankW(i + 11) : tin, [D.door(14, 0), D.win(30, 22, 1)], i % 2 ? tin : thatch); backW(r, 44, plankW(i + 31), [D.win(16, 22, 1)], i % 2 ? tin : thatch);
    B(r[0] + .4, r[1] + .5, 0, 1.4, 2.4, 3, TIMD, (u, v) => u < 6 ? [184, 176, 156] : sh([150, 128, 82], .85 + hs(u | 0, v | 0) * .15)); B(r[2] - 1.4, r[1] + .4, 0, 1, .7, 4, [110, 84, 56]);
    if (i % 3 === 0) candle(r[2] - .9, r[1] + .7, 4, 30, .5); low(r[0] + 1.9, r[3] - .2, r[2] - r[0] - 1.9, .4, 7, STN, [130, 112, 90]); low(r[2] - .2, r[1], .4, r[3] - r[1] - 1.6, 7, STN, [130, 112, 90]); });
  drawAll();
  // ---- the watchtower: a tall frame of poles at the north-east corner, a lantern and a ladder
  add(42 + 6 + 3, () => { S.E = 0; const P0 = [40.6, 4.8]; for (const [dx, dy] of [[0, 0], [2, 0], [0, 2], [2, 2]]) box(P0[0] + dx, P0[1] + dy, 0, .3, .3, 120, TIM, TIM, TIMD);
    for (const z of [30, 62, 94]) { box(P0[0], P0[1], z, 2.3, .2, 2, TIMD, TIMD, TIMD); box(P0[0], P0[1], z, .2, 2.3, 2, TIMD, TIMD, TIMD); }
    box(P0[0] - .3, P0[1] - .3, 120, 2.9, 2.9, 3, [130, 104, 72], TIM, TIMD); box(P0[0] - .3, P0[1] - .3, 123, 2.9, .2, 10, TIM, TIM, TIMD); box(P0[0] - .3, P0[1] - .3, 123, .2, 2.9, 10, TIM, TIM, TIMD);
    box(P0[0] - .5, P0[1] - .5, 140, 3.3, 3.3, 3, [110, 98, 90], [96, 86, 78], [80, 72, 64]); });
  lamp(41.8, 5.9, 130, .8);
  // ---- the wall: stakes and planks lashed between posts, scrap nailed over the gaps; the gate with its two watch-platforms
  const stake = (x, y, h, k) => add(x + y + .3, () => { S.E = 0; const top = h + (hs(k, 3) * 5 | 0), scrap = hs(k, 9) < .18; box(x - .2, y - .2, 0, .4, .4, top, scrap ? sh([126, 118, 108], .8 + hs(k, 5) * .3) : sh([150, 118, 80], .85 + hs(k, 1) * .25), scrap ? [100, 94, 86] : sh([126, 96, 64], .9), sh([92, 70, 46], .9)); if (!scrap) { const [sx, sy] = iso(x, y, top); for (let j = 1; j < 5; j++) for (let i = -2 + (j >> 1); i <= 2 - (j >> 1); i++) px(sx + i, sy - j, sh([150, 118, 80], 1 - j * .08)); } for (const z of [5, 12]) { const [ax, ay] = iso(x, y, z); for (let q = -1; q <= 1; q++) px(ax + q, ay, [70, 60, 44]); } });
  let k = 0; for (let x = WALL[0]; x <= WALL[2]; x += .45) { if (x > GATE[0] - .3 && x < GATE[1] + .3) continue; stake(x, WALL[3], 16, k++); } for (let y = WALL[1]; y < WALL[3]; y += .45) stake(WALL[2], y, 16, k++);
  for (let x = WALL[0]; x <= WALL[2]; x += .45) stake(x, WALL[1], 16, k++); for (let y = WALL[1]; y < WALL[3]; y += .45) stake(WALL[0], y, 16, k++);
  for (const x of [GATE[0] - 1.4, GATE[1]]) { B(x, WALL[3] - .7, 0, 1.4, 1.4, 34, [104, 80, 54]); B(x - .2, WALL[3] - .9, 34, 1.8, 1.8, 3, [130, 104, 72]); lamp(x + .7, WALL[3] + .4, 70, .9); }
  B(GATE[0] - .2, WALL[3] - .3, 30, GATE[1] - GATE[0] + .4, .5, 4, TIMD);
  add(GATE[0] + WALL[3] + 2, () => { S.E = 0; for (let i = 0; i < 6; i++) box(GATE[0] - 1 + i * .5, WALL[3] + 1 + (i % 2) * .4, 0, .2, 1.6, 6, [140, 130, 120], [110, 100, 92], [90, 82, 76]); });
  // ---- the square: the well, the workshop and its scaffold, the pyre, the dead cart, the gallows
  { light(24, 21, 10, 110, 1.0);
    add(24 + 21 + 2, () => { S.E = 0; box(23, 20, 0, 2, 2, 8, (u, v) => (u > 4 && u < 16 && v > 4 && v < 16) ? [12, 16, 16] : [150, 140, 120], (u, z) => stone(u, z, [[176, 164, 140], [160, 146, 120], [140, 126, 104]], 6, 3), (u, z) => sh(stone(u, z, GRY, 6, 3), .6)); box(23.1, 20.9, 8, .25, .25, 16, TIM, TIM, TIMD); box(24.65, 20.9, 8, .25, .25, 16, TIM, TIM, TIMD); box(22.9, 20.5, 24, 2.2, 1.1, 3, thatch, thatch, sh([112, 96, 58], .5)); });
    // the workshop: a scaffold of poles over the timber, a sawhorse, a hoist
    add(28 + 30 + 4, () => { S.E = 0; for (const [x, y] of [[26, 28.4], [30, 28.4], [26, 31.6], [30, 31.6]]) box(x, y, 0, .25, .25, 46, TIM, TIM, TIMD); for (const z of [20, 44]) { box(26, 28.4, z, 4.25, .25, 2, TIMD, TIMD, TIMD); box(26, 31.6, z, 4.25, .25, 2, TIMD, TIMD, TIMD); box(26, 28.4, z, .25, 3.45, 2, TIMD, TIMD, TIMD); box(30, 28.4, z, .25, 3.45, 2, TIMD, TIMD, TIMD); }
      box(26.2, 28.6, 22, 3.9, 3.1, 1, [140, 112, 78], TIM, TIMD); for (const [x, y, h] of [[26.6, 29.2, 0], [26.6, 30, 0], [26.9, 29.6, 3]]) box(x, y, h, 3, .7, 3, [118, 90, 60], (u, v) => sh([150, 120, 80], .9), (u, z) => (Math.hypot((u % 7) - 3.5, z - 1.5) < 1.4 ? [170, 140, 96] : [96, 72, 48])); });
    light(28, 30, 8, 60, .7); lamp(31.2, 28.2, 60, .7);
    // the pyre, the dead cart, the gallows
    light(18, 36, 8, 120, 1.15);
    add(18 + 36 + 2, () => { S.E = 0; for (const [dx, dy, w, d, h] of [[-1.2, -.3, 2.6, .5, 3], [-.3, -1.2, .5, 2.6, 3], [-1, .3, 2.2, .5, 5], [.3, -1, .5, 2.2, 5]]) box(18 + dx, 36 + dy, h - 3, w, d, 3, [70, 50, 36], [50, 36, 28], [36, 26, 22]); const [sx, sy] = iso(18, 36, 6); S.E = 1; for (let j = 0; j < 28; j++) { const w = (j < 8 ? 7 : 7 - (j - 8) * .34) + Math.sin(j * 1.3) * 1.2; for (let i = -w; i <= w; i++) { const t2 = j / 28 + Math.abs(i) / 11 + (hs(i | 0, j + T * 17) - .5) * .3; px(sx + i + Math.sin(j * .5 + PH) * 1.5, sy - j, t2 < .3 ? [255, 240, 170] : t2 < .55 ? [255, 190, 80] : t2 < .8 ? [240, 120, 50] : [170, 60, 40]); } } S.E = 0; smoke(sx, sy - 26, 64, [130, 122, 112]); });
    B(28.5, 35, 5, 3.6, 1.8, 2, [96, 72, 48]); B(28.5, 35, 7, 3.6, .15, 4, [80, 60, 40]); B(28.5, 36.65, 7, 3.6, .15, 4, [80, 60, 40]);
    add(28.5 + 3.6 + 35 + 1.8 + .2, () => { S.E = 0; for (const [x, y] of [[29.1, 36.9], [31.3, 36.9]]) { const [sx, sy] = iso(x, y, 4); for (let a = 0; a < 6.3; a += .12) { px(sx + Math.cos(a) * 5, sy - Math.sin(a) * 5, [60, 46, 34]); } for (let q = -4; q <= 4; q++) { px(sx + q, sy, [70, 54, 38]); px(sx, sy + q, [70, 54, 38]); } } for (const [x, y, c] of [[29, 35.4, [176, 168, 150]], [30.2, 35.8, [150, 144, 126]], [31.1, 35.3, [166, 156, 136]]]) { const [sx, sy] = iso(x, y, 7); for (let i = -4; i <= 6; i++) for (let j = 0; j < 4 - Math.abs(i - 1) * .4; j++) px(sx + i + j, sy + i * .5 - j, sh(c, .65 + j * .1)); } });
    add(34 + 33 + 2, () => { S.E = 0; box(34, 33, 0, 3, 2, 4, [120, 96, 66], TIM, TIMD); box(34.2, 33.2, 4, .3, .3, 34, TIM, TIM, TIMD); box(34.2, 33.2, 38, 2.4, .3, 2, TIMD, TIMD, TIMD); const [sx, sy] = iso(36.2, 33.35, 38); for (let j = 1; j < 14; j++) px(sx, sy + j, [150, 130, 96]); });
    lamp(17, 21.2, 70, .7); lamp(31.2, 21.2, 70, .7); lamp(12, 16, 60, .6); lamp(36, 16, 60, .6);
    deadTree(9.5, 15.4, 5, 30); deadTree(41, 36, 9, 34); drawAll(); }
  // ---- the World Beyond: ruins, bones, an overturned cart, a zone post, dead trees
  { const ruin = (x, y, w, d, s) => { for (let i = 0; i < w; i += .5) { const h = 6 + hs(i * 7 + s, 3) * 22 * (1 - i / w * .6); low(x + i, y, .5, .5, h, [[176, 164, 140], [160, 146, 120], [140, 126, 104], [190, 178, 152]], [196, 184, 160]); } for (let j = .5; j < d; j += .5) { const h = 6 + hs(j * 9 + s, 5) * 16; low(x, y + j, .5, .5, h, [[176, 164, 140], [160, 146, 120], [140, 126, 104], [190, 178, 152]], [196, 184, 160]); } };
    ruin(1, 43.4, 4, 2.6, 1); ruin(31, 43.8, 3, 2, 2); ruin(45, 18, 2, 4, 3);
    add(12 + 44 + 1, () => { S.E = 0; box(11, 43.2, 0, 3, 1.5, 3, [96, 72, 48], [110, 84, 56], [80, 60, 40]); const [sx, sy] = iso(12.2, 44.9, 5); for (let a = 0; a < 6.3; a += .12) px(sx + Math.cos(a) * 6, sy - Math.sin(a) * 3, [60, 46, 34]); });
    for (const [x, y] of [[8, 45], [19, 44], [37, 45], [45, 10], [46, 30]]) add(x + y, () => { S.E = 0; const [sx, sy] = iso(x, y); for (let i = -3; i <= 3; i++) px(sx + i, sy, [214, 208, 190]); px(sx - 4, sy - 1, [214, 208, 190]); px(sx + 4, sy - 1, [214, 208, 190]); px(sx - 1, sy - 2, [200, 194, 176]); px(sx + 1, sy - 2, [200, 194, 176]); for (let i = -1; i <= 1; i++) px(sx + 7 + i, sy - 2, [222, 216, 200]); px(sx + 7, sy - 3, [222, 216, 200]); });
    add(25 + 44.6 + 1, () => { S.E = 0; box(25.4, 44.6, 0, .25, .25, 30, TIM, TIM, TIMD); box(25.4, 44.2, 22, .2, 1.4, 6, [176, 160, 120], [160, 144, 104], [120, 104, 76]); });
    for (const [x, y, s] of [[3, 46, 2], [16, 45.4, 5], [40, 44.6, 7], [46, 25, 3], [45.5, 38, 6], [2, 30, 8], [2.2, 14, 4]]) deadTree(x, y, s, 42);
    drawAll(); }
  return { canvas: finish(), e };
};
