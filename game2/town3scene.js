// DRAFT: the plague town redrawn after Darkwood. Not a walled town on open ground any more but a hamlet cut out of a forest that
// wants it back: log cabins scattered among the stumps, a wooden church with a steep shingle roof, a rough log fence patched with
// boards, mud paths through wet grass, a garden and its scarecrow, and on every side the pines, black and close. The gate opens
// onto a track that goes into the trees and does not come out. Same room keys and rules as the town (chapel, refect, script,
// tower, dorm with a house each, yard, fields outside).
window.MAPS = window.MAPS || {};
(() => {
  const WALL = [7, 7, 41, 39], GATE = [22, 26], CHURCH = [9, 9, 15, 15], TAVERN = [18, 9, 25, 13.5], APOTH = [28, 10, 33, 14], WATCH = [35, 9, 40, 14];
  const HOUSES = [[8.5, 18.5, 12.5, 22.5], [13.5, 21, 17.5, 25], [8.5, 25.5, 12, 29.5], [13, 28.5, 17, 32.5], [8.5, 32, 12.5, 36], [32, 17.5, 36, 21.5],
    [37, 20.5, 40.5, 24.5], [31.5, 25, 35.5, 29], [36.5, 28, 40.5, 32], [31, 32.5, 35, 36.5], [19, 16, 22.5, 19.5], [26.5, 16, 30, 19.5]];
  const bld = (r, d) => { const S = [r[0], r[3], r[2], r[3], d], E = [r[2], r[1], r[2], r[3]]; S.low = E.low = 1; return [[r[0], r[1], r[2], r[1]], [r[0], r[1], r[0], r[3]], S, E]; };
  const dmid = (r, w = 1.6) => { const m = (r[0] + r[2]) / 2; return [m - w / 2, m + w / 2]; };
  const walls = [...bld(CHURCH, dmid(CHURCH)), ...bld(TAVERN, dmid(TAVERN)), ...bld(APOTH, dmid(APOTH)), ...bld(WATCH, dmid(WATCH)), ...HOUSES.flatMap(r => bld(r, [r[0] + 1, r[0] + 2.6]))];
  const pal = [[WALL[0], WALL[1], WALL[2], WALL[1]], [WALL[0], WALL[1], WALL[0], WALL[3]], [WALL[2], WALL[1], WALL[2], WALL[3]], [WALL[0], WALL[3], WALL[2], WALL[3], GATE]];
  MAPS.townwood = {
    key: 'townwood', name: 'The Plague Town (Darkwood draft)', size: [48, 46], view: { W: 940, H: 640, ox: 459, oy: 104 },
    weather: 'ash', print: [40, 36, 26], gibbet: [29.5, 31], gather: [12, 12.5], hangFrom: [24, 24], center: [24, 23], drift: [11, 10],
    complineCam: [12, 16], fogTint: [70, 84, 76], fieldY: 39.4, hordeW: q => 1 + Math.max(0, q.y - 28) / 3,
    G: { WALL, GATE, CHURCH, TAVERN, APOTH, WATCH, HOUSES }, stash: [24.5, 26.6],
    plan: {
      rooms: { chapel: { r: CHURCH, name: 'Church' }, refect: { r: TAVERN, name: 'Inn' }, script: { r: APOTH, name: 'Herbalist' }, tower: { r: WATCH, name: 'Watch House' },
        dorm: { r: HOUSES[0], rs: HOUSES, name: 'Home' }, yard: { r: WALL, name: 'Clearing', out: 1 }, fields: { r: [WALL[0], WALL[3], WALL[2], 46], name: 'The Woods', out: 1, outside: 1 } },
      walls: [...walls, ...pal], pal, furn: [], spots: {}, pad: .12, bounds: [7.35, 7.35, 40.65, 45.65] } };
})();
MAPS.townwood.scene = function (t = 0, N = 4) {
  const M = MAPS.townwood, P = M.plan; P.furn = []; const block = (x, y, w, d) => P.furn.push([x, y, w, d]);
  const e = ENG({ ...M.view, K: 1, t, N, noVig: 1, noWeather: 1, zt: 1, amb: { in: [.22, .2, .21], out: [.22, .28, .3] } });
  const { T, PH, smoke, S, px, dark, hs, vn, sh, mix, iso, box, stone, TIM, TIMD, GRY, STN, light, add, B, candle, lamp, drawAll, backN, backW, low, ground, D, deadTree, finish } = e;
  const inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  const { WALL, GATE, CHURCH, TAVERN, APOTH, WATCH, HOUSES } = M.G, ALL = [CHURCH, TAVERN, APOTH, WATCH, ...HOUSES];
  const LOG = [[88, 70, 52], [76, 60, 44], [98, 80, 58]], MOSS = [62, 74, 44];
  // log walls: round logs stacked, the ends notched, moss in the gaps low down
  const logW = (seed, WH = 40) => (u, z) => { const r = Math.floor(z / 5), f = (z % 5) / 5, rnd = Math.abs(f - .5) * 2; if (z < 3) return sh(stone(u, z, STN, 9, 3), .7);
    if (rnd > .86) return z < 14 && hs(Math.floor(u / 4), r + seed) > .5 ? sh(MOSS, .7) : sh([40, 32, 24], .8); const c = LOG[Math.floor(hs(r, seed) * 3)]; return sh(c, (.95 - rnd * .35) * (.8 + vn(u / 13 + seed, z / 9) * .3)); };
  const shingle = (u, z) => sh(Math.floor(z / 2) % 2 ? [54, 46, 40] : [62, 52, 44], .7 + hs(Math.floor(u / 2 + (Math.floor(z / 2) % 2)), Math.floor(z / 2)) * .3 - (vn(u / 8, z / 5) > .72 ? .15 : 0) + (vn(u / 10 + 3, z / 7) > .78 ? .0 : 0));
  const mossy = (u, z) => vn(u / 9, z / 6) > .62 ? sh(MOSS, .65 + hs(u | 0, z | 0) * .2) : shingle(u, z);
  const plank = (x, y, n, dk) => { const k = Math.floor(x * 2), ed = (x * 2 - k) < .12; return ed ? sh(TIMD, .5) : sh([[96, 74, 52], [86, 66, 46], [78, 60, 42]][Math.floor(hs(k, 7) * 3)], (.9 + n * .1) * dk * (.7 + vn(x * .8, y * .8) * .35)); };
  const segd = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t2 = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - dx * t2, y - a[1] - dy * t2); };
  const PATHS = [[[24, 46], [24, 39]], [[24, 39], [24.5, 31]], [[24.5, 31], [23.5, 23]], [[23.5, 23], [21.5, 15.5]], [[21.5, 15.5], [12, 15.5]], [[21.5, 15.5], [30.5, 14.5]], [[30.5, 14.5], [37.5, 14.5]],
    [[23.5, 23], [17.5, 24]], [[17.5, 24], [12, 22.5]], [[23.5, 23], [31, 22]], [[24.5, 31], [17, 31]], [[17, 31], [11, 31]], [[24.5, 31], [31, 30]], [[31, 30], [37, 33]], [[24, 46], [30, 52]]];
  const GARDEN = [36, 33.5, 40.5, 38];
  // ---- the ground: plank floors indoors; in the clearing wet grass, mud paths and puddles, leaf litter; outside, the forest floor
  ground((x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)), inside = inR(WALL, x, y);
    for (const r of ALL) if (inR(r, x, y)) { const c = r === CHURCH ? sh(stone(x * 10, y * 10, GRY, 12, 6), .7) : plank(x, y, n, .85); const ao = Math.min(x - r[0], y - r[1]); return [ao < 1 ? sh(c, .55 + ao * .4) : c, 1]; }
    let road = 9; for (const [a, b] of PATHS) road = Math.min(road, segd(x, y, a, b)); const w = vn(x * .5 + 3, y * .5), g = vn(x * 1.7, y * 1.7 + 9);
    if (inside) { let c = mix(sh([60, 70, 40], .7 + n * .25), sh([78, 80, 46], .75 + n * .2), g);            // wet grass
      if (vn(x * .8 + 20, y * .8) > .7) c = mix(c, sh([92, 66, 38], .7 + n * .2), .6);                         // dead leaves
      const pw = .9 + (vn(x * 1.3, y * 1.3) - .5) * .6; if (road < pw) { c = mix(c, sh([70, 56, 40], .75 + n * .2), Math.min(1, (pw - road) * 2.5)); if (w > .78) return [sh([34, 40, 42], .9 + n * .1), 0]; }
      if (inR(GARDEN, x, y)) c = Math.floor(y * 2.2) % 2 ? sh([66, 50, 34], .8 + n * .2) : sh([56, 70, 40], .7 + n * .3);
      const ao = Math.min(x - WALL[0], y - WALL[1], WALL[2] - x, WALL[3] - y); if (ao < 1.5) c = sh(c, .6 + ao * .27); return [c, 0]; }
    // the forest floor: needles, ferns, roots; darker the further in
    let c = mix(sh([46, 42, 30], .7 + n * .3), sh([40, 54, 34], .7 + n * .3), g); if (vn(x * 2.6, y * 2.6 + 4) > .74) c = sh([52, 70, 40], .8 + n * .2);
    if (road < 1 + (vn(x, y) - .5) * .4) c = mix(c, sh([66, 54, 38], .7 + n * .2), .75);
    const far = Math.max(0, Math.max(WALL[0] - x, WALL[1] - y, x - WALL[2], y - WALL[3])); return [sh(c, Math.max(.35, 1 - far * .09)), 0]; });
  // ---- the pines: the trees from the monastery, made black-green and close; everywhere outside the fence, a few inside
  const TD = window.__pinesD || (window.__pinesD = TREES.map(sp => { const a = new Uint8ClampedArray(sp.data); for (let i = 0; i < a.length; i += 4) { const l = a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1; a[i] = l * .38; a[i + 1] = l * .5 + 6; a[i + 2] = l * .36; } return { sp, a }; }));
  const tree = (x, y, k, sc = 1) => add(x + y + .4, () => { const tt = TD[k % TD.length], [sx, sy] = iso(x, y), sway = Math.round(Math.sin(PH + k) * .6); S.E = 0; S.D = x + y;
    for (let t2 = 0; t2 < 26; t2++) for (let w = -5 + t2 * .15; w <= 5 - t2 * .15; w++) dark(sx + t2 * 1.2 + w * .5, sy + t2 * .35 + w * .5, .55);
    for (let j = 0; j < tt.sp.h; j++) for (let i = 0; i < tt.sp.w; i++) { const q = (j * tt.sp.w + i) * 4; if (tt.a[q + 3] > 128) px(sx + tt.sp.ox + i + (j < tt.sp.h * .4 ? sway : 0), sy + tt.sp.oy + j, [tt.a[q], tt.a[q + 1], tt.a[q + 2]]); } });
  let tk = 0; for (let y = -3; y < 49; y += 1.35) for (let x = -3; x < 51; x += 1.35) { const jx = x + (hs(tk, 1) - .5) * 1.1, jy = y + (hs(tk, 2) - .5) * 1.1; tk++;
    const out = jx < WALL[0] - 1.2 || jy < WALL[1] - 1.2 || jx > WALL[2] + 1.2 || jy > WALL[3] + 1.6; if (!out) continue; if (Math.abs(jx - 24 - Math.max(0, jy - 46) * 1) < 2 && jy > 39) continue; if (hs(tk, 5) < .12) continue; tree(jx, jy, tk); }
  for (const [x, y, k] of [[17.6, 26.5, 3], [29.8, 26.8, 5], [17.8, 35.8, 1], [12.8, 37.2, 4], [33.6, 15.8, 2], [27.6, 36.8, 6]]) { tree(x, y, k); block(x - .4, y - .4, .8, .8); }
  for (const [x, y, s] of [[20.6, 36.2, 2], [31.2, 37.6, 4], [16.4, 17.2, 7]]) { deadTree(x, y, s, 30); }
  drawAll(); S.Z = 1;
  // ---- the church: wood and a stone footing, a steep shingle roof and a tall shingled spire with a cross
  { const r = CHURCH; backN(r, 70, logW(3, 70), [D.slit(22, 40), D.cross(46, 36), D.slit(70, 40)], mossy); backW(r, 70, logW(7, 70), [D.slit(20, 40), D.sconce(44, 30), D.slit(68, 40)], mossy);
    light(12, 10, 30, 50, .6); B(11, 9.6, 0, 2.4, .9, 7, [120, 100, 80], null, (u, z) => z > 4 ? [110, 30, 34] : sh(TIM, .7)); block(11, 9.6, 2.4, .9); candle(11.3, 9.9, 7, 40, .6); candle(13.1, 9.9, 7, 40, .6);
    for (const y of [11.5, 13]) for (const x of [9.6, 12.8]) { block(x, y, 2, .5); B(x, y, 0, 2, .5, 5, [90, 66, 44]); }
    add(9 + 9, () => { S.E = 0; const sx0 = 9.2, sy0 = 8.2; for (let q = 0; q < 14; q++) { const w = 2.6 - q * .17; box(sx0 + 1.3 - w / 2, sy0 + 1.3 - w / 2, 70 + q * 6, w, w, 6, shingle, shingle, (u, z) => sh(shingle(u, z), .6)); } box(sx0 + 1.2, sy0 + 1.2, 154, .2, .2, 14, TIMD, TIMD, TIMD); box(sx0 + .7, sy0 + 1.2, 162, 1.1, .2, 1.4, TIMD, TIMD, TIMD); });
    drawAll(); }
  // ---- the inn, the herbalist's hut, the watch house (a barn, barricaded)
  { backN(TAVERN, 48, logW(4), [D.win(14, 20, 1), D.hearth(44), D.win(62, 20, 1)], mossy); light(21, 9.6, 6, 80, 1); block(19, 10.6, 3, 1); block(22.4, 11, 2, .9); B(19, 10.6, 7, 3, 1, 2, TIM); B(22.4, 11, 6, 2, .9, 2, TIM);
    backN(APOTH, 44, logW(9, 44), [D.shelf(8, 16, 28, 30, [[110, 140, 84], [120, 86, 60], [90, 120, 80], [160, 150, 126]]), D.win(36, 20, 1)], mossy); light(30.5, 10.6, 26, 50, .7, [.6, 1, .5]);
    for (let i = 0; i < 6; i++) add(29 + i * .5 + 10.4, () => { S.E = 0; const [sx, sy] = iso(28.6 + i * .6, 10.3, 36); for (let j = 0; j < 7; j++) px(sx, sy + j, j < 2 ? [60, 50, 34] : [80 + i * 8, 100, 50]); });   // herbs hung to dry
    block(29, 12, 2.4, 1); B(29, 12, 6, 2.4, 1, 2, TIM);
    backN(WATCH, 50, logW(2, 50), [D.win(30, 22, 1)], mossy); backW(WATCH, 50, logW(5, 50), [], mossy); light(37.5, 10.5, 16, 60, .8); block(35.6, 10, 2, 1.2); B(35.6, 10, 0, 2, 1.2, 8, [96, 74, 50]);
    for (const [x, y, h] of [[38.8, 9.6, 7], [39.2, 10.8, 5]]) { block(x, y, 1, 1); B(x, y, 0, 1, 1, h, [120, 96, 64]); } drawAll(); }
  // ---- the houses: log cabins, mossy shingle roofs, a door each, a cot, a chest; some with the red cross of the plague
  const MARK = [1, 4, 7, 10], XMARK = u => ({ u, z: 6, w: 13, h: 15, f: (a, c) => { a |= 0; c |= 0; const d1 = Math.abs(a - 6 - (c - 7) * .8), d2 = Math.abs(a - 6 + (c - 7) * .8); return d1 < 1.2 || d2 < 1.2 ? sh([140, 26, 24], .85 + hs(a, c) * .2) : null; } });
  HOUSES.forEach((r, i) => { backN(r, 30, logW(i + 11, 30), [D.win(22, 8, 1), ...(MARK.includes(i) ? [XMARK(6)] : [])], mossy); backW(r, 30, logW(i + 31, 30), [D.win(14, 8, 1)], mossy);
    B(r[0] + .4, r[1] + .5, 0, 1.3, 2.2, 3, TIMD, (u, v) => u < 6 ? [150, 140, 120] : sh([110, 96, 66], .85 + hs(u | 0, v | 0) * .15)); B(r[2] - 1.3, r[1] + .4, 0, .9, .7, 4, [90, 68, 46]);
    if (i % 3 === 0) candle(r[2] - .8, r[1] + .7, 4, 30, .5); block(r[2] - 1.3, r[1] + .4, .9, .7); });
  for (const [x0, y0, x1, y1, ...doors] of P.walls.filter(w => w.low)) { const vert = x0 === x1, a0 = vert ? y0 : x0, a1 = vert ? y1 : x1, cuts = [a0]; doors.forEach(d => cuts.push(d[0], d[1])); cuts.push(a1);
    for (let i = 0; i < cuts.length; i += 2) { const s0 = cuts[i], s1 = cuts[i + 1]; if (s1 - s0 < .05) continue; if (vert) low(x0 - .25, s0, .5, s1 - s0, 8, LOG, [70, 56, 40]); else low(s0, y0 - .25, s1 - s0, .5, 8, LOG, [70, 56, 40]); }
    for (const d of doors) for (const q of d) { S.E = 0; if (vert) box(x0 - .3, q - .3 + (q === d[1] ? .3 : 0), 0, .6, .3, 18, TIM, TIMD, sh(TIMD, .8)); else box(q - .3 + (q === d[1] ? .3 : 0), y0 - .3, 0, .3, .6, 18, TIM, TIMD, sh(TIMD, .8)); } }
  drawAll();
  // ---- the fence: uneven split logs with two rails, boards nailed across the gaps, a few leaning; the gate of two log towers
  const post = (x, y, k) => add(x + y + .3, () => { S.E = 0; const h = 13 + (hs(k, 3) * 7 | 0), c = LOG[k % 3]; box(x - .22, y - .22, 0, .44, .44, h, sh(c, .9), sh(c, .75), sh(c, .55)); const [sx, sy] = iso(x, y, h); for (let j = 1; j < 3; j++) for (let i = -1; i <= 1; i++) px(sx + i, sy - j, sh(c, .9));
    for (const z of [4, 10]) { const [ax, ay] = iso(x, y, z); for (let q = -2; q <= 2; q++) px(ax + q, ay + (q > 0 ? 1 : 0), [58, 46, 34]); } if (hs(k, 9) < .1) { const [bx, by] = iso(x, y, 7); for (let q = -4; q <= 4; q++) for (let j = 0; j < 2; j++) px(bx + q, by + j - q * .2, [110, 92, 70]); } });
  let k = 0; for (let x = WALL[0]; x <= WALL[2]; x += .5) { if (x > GATE[0] - .3 && x < GATE[1] + .3) continue; post(x, WALL[3], k++); } for (let y = WALL[1]; y < WALL[3]; y += .5) post(WALL[2], y, k++);
  for (let x = WALL[0]; x <= WALL[2]; x += .5) post(x, WALL[1], k++); for (let y = WALL[1]; y < WALL[3]; y += .5) post(WALL[0], y, k++);
  for (const x of [GATE[0] - 1.5, GATE[1]]) { B(x, WALL[3] - .75, 0, 1.5, 1.5, 30, LOG[1], null, logW(6, 30)); B(x - .3, WALL[3] - 1.05, 30, 2.1, 2.1, 10, null, shingle, shingle); lamp(x + .75, WALL[3] + .5, 60, .8); }
  B(GATE[0] - .2, WALL[3] - .3, 26, GATE[1] - GATE[0] + .4, .5, 4, TIMD);
  // ---- the clearing: the well, the workshop and its stack of timber (the stash), the pyre, the dead cart, the garden and its scarecrow
  { light(23.5, 22.5, 10, 100, .9); block(22.5, 22, 2, 2);
    add(23.5 + 23 + 2, () => { S.E = 0; box(22.5, 22, 0, 2, 2, 7, (u, v) => (u > 4 && u < 16 && v > 4 && v < 16) ? [10, 14, 14] : [110, 104, 90], (u, z) => stone(u, z, STN, 6, 3), (u, z) => sh(stone(u, z, STN, 6, 3), .6)); box(22.6, 22.9, 7, .25, .25, 15, TIM, TIM, TIMD); box(24.15, 22.9, 7, .25, .25, 15, TIM, TIM, TIMD); box(22.4, 22.5, 22, 2.2, 1.1, 3, shingle, shingle, sh([54, 46, 40], .5)); });
    block(22.6, 27.4, 3.6, 1.6); add(24 + 28 + 3, () => { S.E = 0; for (const [x, y, h] of [[22.6, 27.4, 0], [22.6, 28.2, 0], [22.9, 27.8, 3], [23.2, 27.6, 6]]) box(x, y, h, 3.4, .7, 3, LOG[1], (u, v) => sh(LOG[0], .9), (u, z) => (Math.hypot((u % 7) - 3.5, z - 1.5) < 1.4 ? [150, 122, 84] : [80, 62, 44]));
      box(26.6, 27.6, 0, .3, 1.2, 6, TIM, TIM, TIMD); box(27.6, 27.6, 0, .3, 1.2, 6, TIM, TIM, TIMD); box(26.5, 27.6, 6, 1.5, 1.2, .6, TIM, TIM, TIMD); });
    light(24.5, 28, 8, 60, .6); lamp(21.4, 27, 60, .7);
    light(19, 35, 8, 110, 1.05); block(17.8, 33.8, 2.4, 2.4);
    add(19 + 35 + 2, () => { S.E = 0; for (const [dx, dy, w, d, h] of [[-1.2, -.3, 2.6, .5, 3], [-.3, -1.2, .5, 2.6, 3], [-1, .3, 2.2, .5, 5], [.3, -1, .5, 2.2, 5]]) box(19 + dx, 35 + dy, h - 3, w, d, 3, [60, 44, 32], [44, 32, 24], [32, 24, 20]); const [sx, sy] = iso(19, 35, 6); S.E = 1; for (let j = 0; j < 26; j++) { const w = (j < 8 ? 6 : 6 - (j - 8) * .3) + Math.sin(j * 1.3) * 1.1; for (let i = -w; i <= w; i++) { const t2 = j / 26 + Math.abs(i) / 10 + (hs(i | 0, j + T * 17) - .5) * .3; px(sx + i + Math.sin(j * .5 + PH) * 1.5, sy - j, t2 < .3 ? [255, 236, 160] : t2 < .55 ? [255, 180, 70] : t2 < .8 ? [230, 110, 40] : [150, 50, 34]); } } S.E = 0; smoke(sx, sy - 24, 64, [96, 100, 92]); });
    block(26.5, 36.3, 3.4, 1.7); B(26.5, 36.3, 5, 3.4, 1.7, 2, [80, 60, 42]); B(26.5, 36.3, 7, 3.4, .15, 4, [66, 50, 36]); B(26.5, 37.85, 7, 3.4, .15, 4, [66, 50, 36]);
    add(26.5 + 3.4 + 36.3 + 1.9, () => { S.E = 0; for (const [x, y, c] of [[27, 36.7, [150, 144, 126]], [28.1, 37.1, [130, 124, 108]], [29, 36.6, [140, 132, 116]]]) { const [sx, sy] = iso(x, y, 7); for (let i = -4; i <= 6; i++) for (let j = 0; j < 4 - Math.abs(i - 1) * .4; j++) px(sx + i + j, sy + i * .5 - j, sh(c, .6 + j * .1)); } });
    // the garden: rows of something gone to rot, a stick fence, the scarecrow in a coat with a sack for a head
    for (let x = GARDEN[0]; x <= GARDEN[2]; x += .7) { const xx = x; add(xx + GARDEN[3] + .2, () => { S.E = 0; box(xx, GARDEN[3] - .1, 0, .15, .15, 7, TIMD, TIMD, TIMD); }); }
    add(38.2 + 35.6 + 1, () => { S.E = 0; box(38.15, 35.55, 0, .2, .2, 34, TIM, TIM, TIMD); box(37.2, 35.55, 26, 2.1, .2, .4, TIM, TIM, TIMD); box(37.7, 35.35, 14, 1.1, .6, 13, [70, 56, 46], [60, 48, 40], [48, 38, 32]); for (const s of [-1, 1]) box(38.2 + s * .9 - .3, 35.4, 22, .6, .5, 4, [70, 56, 46], [60, 48, 40], [48, 38, 32]);
      const [hx, hy] = iso(38.25, 35.65, 31); for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j < 18) px(hx + i, hy + j, sh([150, 128, 90], .7 + (i + j) * .02)); px(hx - 1, hy - 1, [20, 16, 14]); px(hx + 2, hy - 1, [20, 16, 14]); for (let i = -1; i <= 2; i++) px(hx + i, hy + 2, [30, 20, 16]); });
    for (const [x, y] of [[16.5, 15.5], [30.5, 15.2], [17.6, 23.6], [30.5, 22.3], [17.4, 31.5], [30.8, 30.4], [24.4, 37.6], [12, 23], [36.5, 25.6]]) lamp(x, y, 60, .65);
    drawAll(); }
  // ---- the woods: a toppled cart on the track, a shrine at the edge of the trees, bones in the ferns
  { add(26 + 42 + 1, () => { S.E = 0; box(25.6, 41.6, 0, 3, 1.5, 3, [70, 54, 38], [80, 62, 44], [60, 46, 32]); const [sx, sy] = iso(26.8, 43.2, 5); for (let a = 0; a < 6.3; a += .12) px(sx + Math.cos(a) * 6, sy - Math.sin(a) * 3, [50, 40, 30]); }); block(25.6, 41.6, 3, 1.5);
    add(19.5 + 42.5 + .5, () => { S.E = 0; box(19.4, 42.4, 0, .3, .3, 20, TIM, TIM, TIMD); box(18.9, 42, 20, 1.3, 1.1, 8, [80, 64, 48], [70, 56, 42], [56, 44, 34]); box(18.7, 41.8, 28, 1.7, 1.5, 2, shingle, shingle, shingle); }); candle(19.6, 42.6, 21, 30, .5);
    for (const [x, y] of [[15, 43], [33, 42.4], [9, 41.5]]) add(x + y, () => { S.E = 0; const [sx, sy] = iso(x, y); for (let i = -3; i <= 3; i++) px(sx + i, sy, [190, 184, 166]); px(sx - 4, sy - 1, [190, 184, 166]); px(sx + 4, sy - 1, [190, 184, 166]); for (let i = -1; i <= 1; i++) px(sx + 7 + i, sy - 2, [200, 194, 176]); });
    drawAll(); }
  return { canvas: finish(), e };
};
