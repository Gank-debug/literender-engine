// DRAFT: between the medieval plague town and the Darkwood hamlet: the town's layout, daub and thatch, cobbles and stakes, with
// the forest closing in past the fields, grass taking the mud back, log cabins among the houses, pines inside the stakes, a garden and its scarecrow.
MAPS.townmix = Object.assign({}, MAPS.town, { key: 'townmix', name: 'The Plague Town (between)' });
MAPS.townmix.scene = function (t = 0, N = 4) {
  const M = MAPS.town, P = M.plan; P.furn = []; const block = (x, y, w, d) => P.furn.push([x, y, w, d]);
  const e = ENG({ ...M.view, K: 1, t, N, noVig: 1, noWeather: 1, zt: 1, amb: { in: [.21, .19, .21], out: [.25, .31, .38] } });
  const { T, PH, smoke, S, px, dark, hs, vn, sh, mix, iso, box, stone, TIM, TIMD, GRY, STN, light, add, B, candle, lamp, drawAll, backN, backW, low, ground, D, deadTree, finish } = e;
  const inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  const { WALL, GATE, CHURCH, TAVERN: CANTEEN, APOTH, WATCH: BANK, HOUSES } = M.G;
  const DAUB = [196, 182, 150];
  const SAND = [190, 160, 108], DUST = [168, 136, 92], OCHRE = [176, 128, 72];
  const plankW = (seed, WH = 56) => (u, z) => { const g = .72 + vn(u / 31 + seed, z / 17) * .34; if (z < 9) return sh(stone(u, z, STN, 10, 4), .85); if (z >= WH - 4 || Math.abs(z - WH * .56) < 2) return sh(TIMD, .8 + (Math.floor(u) % 5 === 0 ? -.15 : 0)); const m = ((u % 30) + 30) % 30, pan = Math.floor(u / 30), mid = WH * .56; if (m < 3) return sh(TIMD, .85); if ((pan + seed) % 3 === 0 && z > mid && Math.abs((m - 3) - (z - mid) * 1.0) < 1.6) return sh(TIMD, .8); if ((pan + seed) % 3 === 1 && z < mid && Math.abs((27 - m) - (z - 9) * .85) < 1.6) return sh(TIMD, .8); if (vn(u / 9 + seed, z / 7) > .74) return sh([120, 96, 70], g); return sh(DAUB, g * (.97 + hs(Math.floor(u), Math.floor(z)) * .05) * (z < 20 ? .8 : 1)); };
  const plankOld = seed => (u, z) => { const k = Math.floor(u / 5), dk = .72 + hs(k, seed) * .3; if (z > 4 && z < 6 || (u % 5) < .7) return sh(TIMD, .75); if (hs(k, seed + 3) < .12 && z > 18 && z < 28) return sh([120, 112, 104], .9); return sh([[138, 112, 82], [124, 100, 72], [150, 124, 90]][Math.floor(hs(k, seed + 7) * 3)], dk * (.85 + vn(u / 9, z / 13) * .25)); };
  const tinOld = (u, z) => sh([118, 106, 96], .7 + (Math.floor(u / 3) % 2 ? .12 : 0) + vn(u / 20, z / 8) * .2 - (vn(u / 6 + 9, z / 6) > .7 ? .25 : 0));
  const thatch = (u, z) => sh([112, 96, 58], .6 + hs(Math.floor(u), Math.floor(z / 2)) * .35 - (Math.floor(u) % 3 === 0 ? .12 : 0));
  const kirk = (u, z) => sh(stone(u, z, GRY, 11, 5), .7 + vn(u / 31, z / 17 + 3) * .3);
  const tin = thatch;
  const LOG = [[88, 70, 52], [76, 60, 44], [98, 80, 58]], MOSS = [62, 74, 44];
  // log walls: round logs stacked, the ends notched, moss in the gaps low down
  const logW = (seed, WH = 40) => (u, z) => { const r = Math.floor(z / 5), f = (z % 5) / 5, rnd = Math.abs(f - .5) * 2; if (z < 3) return sh(stone(u, z, STN, 9, 3), .7);
    if (rnd > .86) return z < 14 && hs(Math.floor(u / 4), r + seed) > .5 ? sh(MOSS, .7) : sh([40, 32, 24], .8); const c = LOG[Math.floor(hs(r, seed) * 3)]; return sh(c, (.95 - rnd * .35) * (.8 + vn(u / 13 + seed, z / 9) * .3)); };
  const shingle = (u, z) => sh(Math.floor(z / 2) % 2 ? [54, 46, 40] : [62, 52, 44], .7 + hs(Math.floor(u / 2 + (Math.floor(z / 2) % 2)), Math.floor(z / 2)) * .3 - (vn(u / 8, z / 5) > .72 ? .15 : 0) + (vn(u / 10 + 3, z / 7) > .78 ? .0 : 0));
  const mossy = (u, z) => vn(u / 9, z / 6) > .62 ? sh(MOSS, .65 + hs(u | 0, z | 0) * .2) : shingle(u, z);
  const TD = window.__pinesD || (window.__pinesD = TREES.map(sp => { const a = new Uint8ClampedArray(sp.data); for (let i = 0; i < a.length; i += 4) { const l = a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1; a[i] = l * .38; a[i + 1] = l * .5 + 6; a[i + 2] = l * .36; } return { sp, a }; }));
  const tree = (x, y, k, sc = 1) => add(x + y + .4, () => { const tt = TD[k % TD.length], [sx, sy] = iso(x, y), sway = Math.round(Math.sin(PH + k) * .6); S.E = 0; S.D = x + y;
    for (let t2 = 0; t2 < 26; t2++) for (let w = -5 + t2 * .15; w <= 5 - t2 * .15; w++) dark(sx + t2 * 1.2 + w * .5, sy + t2 * .35 + w * .5, .55);
    for (let j = 0; j < tt.sp.h; j++) for (let i = 0; i < tt.sp.w; i++) { const q = (j * tt.sp.w + i) * 4; if (tt.a[q + 3] > 128) px(sx + tt.sp.ox + i + (j < tt.sp.h * .4 ? sway : 0), sy + tt.sp.oy + j, [tt.a[q], tt.a[q + 1], tt.a[q + 2]]); } });
  const segd = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t2 = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - dx * t2, y - a[1] - dy * t2); };
  const ROADS = [[[24, 41], [24, 14]], [[9, 15.5], [41, 15.5]], [[24, 27], [36, 27]], [[24, 27], [12, 27]], [[24, 33.5], [12, 33.5]], [[24, 50], [24, 41]], [[24, 50], [10, 58]]];
  // ---- the ground: packed dust in the camp, wheel ruts on the streets, sand dunes beyond the wall
  const plank = (x, y, n, dk, rot) => { const a = rot ? x : y, b = rot ? y : x, k = Math.floor(a * 2), ed = (a * 2 - k) < .12 || ((b + hs(k, 1) * 3) % 3) < .1; return ed ? sh(TIMD, .6) : sh([[124, 96, 68], [114, 86, 58], [104, 78, 52]][Math.floor(hs(k, 7) * 3)], (.9 + n * .1) * dk * (.75 + vn(x * .8, y * .8) * .35)); };
  const flag = (x, y, pal, s2, n) => { const X = x / s2, Y = y / s2 + (Math.floor(X) % 2) * .5, ed = (X - Math.floor(X)) < .09 / s2 || (Y - Math.floor(Y)) < .09 / s2; return ed ? sh(pal[2], .55) : sh(pal[Math.floor(hs(Math.floor(X), Math.floor(Y)) * pal.length)], (.9 + n * .1) * (.78 + vn(x * .9, y * .9) * .3)); };
  // ---- the ground: plank and flag floors indoors, cobbles sinking into mud in the camp, furrowed plague fields beyond the wall
  ground((x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)), inside = inR(WALL, x, y);
    for (const r of [CHURCH, CANTEEN, APOTH, BANK, ...HOUSES]) if (inR(r, x, y)) { let c;
      if (r === CHURCH) { c = flag(x, y, GRY, 1.3, n); if (x > 9.6 && x < 11.4 && y > 8.6) c = sh(((Math.floor(x * 2) + Math.floor(y * 4)) % 9 === 0 ? [80, 26, 28] : [110, 34, 36]), (.85 + n * .1) * (.8 + vn(x, y * 3) * .25)); }
      else if (r === APOTH) { const X = x / 1.2, Y = y / 1.2 + (Math.floor(X) % 2) * .5; c = ((X % 1) < .08 || (Y % 1) < .08) ? sh(GRY[2], .5) : sh(GRY[Math.floor(hs(Math.floor(X), Math.floor(Y)) * 4)], (.9 + n * .1) * (.8 + vn(x, y) * .3)); }
      else c = plank(x, y, n, r === CANTEEN || r === BANK ? 1 : .8, r !== CANTEEN && r !== BANK);
      const ao = Math.min(x - r[0], y - r[1]); return [ao < 1 ? sh(c, .62 + ao * .38) : c, 1]; }
    let road = 9; for (const [a, b] of ROADS) road = Math.min(road, segd(x, y, a, b)); const mud = vn(x * .45 + 5, y * .45);
    if (inside) { const cx = x * 2.4 + (Math.floor(y * 2.4) % 2) * .5, cy = y * 2.4, dx = cx - Math.floor(cx) - .5, dy = cy - Math.floor(cy) - .5, rr = Math.hypot(dx, dy);
      let c = rr < .4 ? sh([150, 142, 126], .75 + hs(Math.floor(cx), Math.floor(cy)) * .3 - rr * .5 + (dy < -.15 ? .12 : 0)) : [58, 50, 42];
      const lane = road < 1.5; if (!lane) c = mix(c, sh([110, 88, 62], .8 + n * .25), Math.min(1, Math.max(0, (mud - .42) * 4)));     // off the lanes the cobbles drown in mud
      if (!lane && vn(x * .7 + 40, y * .7) > .6) c = mix(c, sh([62, 72, 42], .7 + n * .25), .75);                                  // grass taking it back
      if (!lane && mud > .84) return [[40, 50, 52], 0];                                                                         // standing water
      const ao = Math.min(x - WALL[0], y - WALL[1]); if (ao < 1.2) c = sh(c, .6 + ao * .33); return [c, 0]; }
    const fur = Math.abs(Math.sin((x + y * .15) * 2.6)), g = vn(x * 2.1 + 11, y * 2.1), near = Math.min(x - WALL[0] + 4, y - WALL[1] + 4, WALL[2] + 5 - x, WALL[3] + 6 - y) > 0;
    let c = mix(sh([104, 94, 64], .74 + n * .25), sh([66, 54, 38], .8 + n * .2), fur > .75 ? .8 : .2 + g * .2); if (!near) c = sh(mix(c, [40, 38, 30], .5), .7);
    if (road < 1.3 + (vn(x, y) - .5) * .5 && y > 41) c = mix(c, sh([96, 78, 56], .85 + n * .2), .8);
    const fo = Math.max(WALL[0] - 2 - x, WALL[1] - 2 - y, x - WALL[2] - 2, y - 45); if (fo > 0) { let f2 = mix(sh([46, 42, 30], .7 + n * .3), sh([40, 54, 34], .7 + n * .3), g); c = mix(c, sh(f2, Math.max(.4, 1 - fo * .08)), Math.min(1, fo * .6)); }
    const dp = Math.hypot((x - 17.5) * .8, y - 43.9); if (dp < 2.6) c = dp < 1.7 ? sh([34, 30, 28], .9 + n * .2) : mix(c, [196, 194, 182], .7 - (dp - 1.7) * .6);   // the lime pit
    return [c, 0]; });
  // ---- far off: dead trees and the ruins of the old villages
  let tk = 0; for (let y = -3; y < 52; y += 1.4) for (let x = -3; x < 52; x += 1.4) { const jx = x + (hs(tk, 1) - .5) * 1.1, jy = y + (hs(tk, 2) - .5) * 1.1; tk++;
    const out = jx < WALL[0] - 2.2 || jy < WALL[1] - 2.2 || jx > WALL[2] + 2.2 || jy > 45.6; if (!out || hs(tk, 5) < .15) continue; if (Math.abs(jx - 24 - Math.max(0, jy - 46) * .6) < 1.6 && jy > 41) continue; tree(jx, jy, tk); }
  for (let i = 0; i < 6; i++) deadTree(-1 - hs(i, 1) * 2.4, 2 + i * 7, i + 3, 46); drawAll();
  S.Z = 1;
  // ---- the church: the one stone building, its bell in a wooden cage on the roof
  { const r = CHURCH; backN(r, 84, kirk, [D.slit(20, 46), D.cross(40, 40), D.slit(60, 46)], thatch); backW(r, 84, kirk, [D.slit(18, 46), D.sconce(40, 34), D.slit(62, 46)], thatch);
    light(10.5, 8, 30, 50, .7); B(9.2, 7.6, 0, 3, 1, 8, [150, 146, 140], null, (u, z) => z > 5 ? [120, 36, 38] : sh(stone(u, z, GRY, 8, 4), .8)); block(9.2, 7.6, 3, 1); candle(9.6, 8, 8, 40, .6); candle(11.8, 8, 8, 40, .6);
    for (const y of [9.8, 11.4]) for (const x of [7.6, 11.2]) { block(x, y, 2.4, .6); B(x, y, 0, 2.4, .6, 5, [100, 74, 48]); B(x, y + .5, 5, 2.4, .14, 5, [86, 62, 40]); }
    B(7.3, 6.4, 84, 1.6, 1.6, 22, null, (u, z) => (u % 7 < 1.2 || z < 2 || z > 20) ? [80, 60, 40] : [24, 20, 18], (u, z) => (u % 7 < 1.2 || z < 2 || z > 20) ? [70, 52, 36] : [20, 16, 14]); drawAll(); }
  // ---- the canteen: long tables, a stove, sacks
  { const r = CANTEEN; backN(r, 56, plankW(4), [D.win(12, 26, 1), D.hearth(40), D.sign ? D.sign(70, 40) : D.win(70, 26)], tin);
    light(19.5, 7.6, 6, 90, 1.1); block(16.8, 9.2, 3, 1); block(20.6, 9.6, 3, 1); block(22.8, 7.4, 1.1, 2.1); for (const [x, y] of [[16.8, 9.2], [20.6, 9.6]]) { B(x, y, 7, 3, 1, 2, TIM); for (const dx of [.2, 2.6]) B(x + dx, y + .1, 0, .3, .8, 7, TIMD); }
    for (const [x, y] of [[22.8, 7.4], [23, 8.6]]) B(x, y, 0, .9, .9, 6, [150, 132, 96], [170, 150, 110]); drawAll(); }
  // ---- the apothecary: jars, a green lamp, a sick cot
  { const r = APOTH; backN(r, 56, plankW(9), [D.shelf(8, 18, 30, 34, [[150, 170, 104], [130, 96, 70], [100, 140, 96], [180, 170, 146]]), D.win(46, 26, 1)], tin);
    light(29, 7.6, 30, 60, .8, [.6, 1, .5]); block(26.8, 9.4, 2.6, 1.2); block(30.4, 9, 1.4, 2.6); B(26.8, 9.4, 7, 2.6, 1.2, 2, TIM); B(30.4, 9, 0, 1.4, 2.6, 4, TIMD, (u, v) => v < 6 ? [200, 196, 180] : [150, 140, 110]); drawAll(); }
  // ---- the bank: crates, sacks and a counter; the town's stash lives here
  { const r = BANK; backN(r, 60, plankW(2), [D.sign ? D.sign(18, 42) : D.win(18, 26), D.win(44, 26, 1)], tin);
    light(37, 9, 20, 70, .9); block(34.6, 9.6, 4.6, .8); block(38.6, 7.4, 1.6, 2.1); block(35, 7.3, 2.1, 1); B(34.6, 9.6, 0, 4.6, .8, 9, [104, 78, 50], null, (u, z) => sh(TIM, (Math.floor(u) % 6 === 0 ? .5 : .78)));
    for (const [x, y, h] of [[38.6, 7.4, 8], [39.2, 8.5, 6], [35, 7.3, 7], [36.1, 7.3, 5]]) B(x, y, 0, 1, 1, h, [150, 120, 80], (u, v) => sh([170, 136, 92], .9 + (Math.floor(u) % 5 === 0 ? -.3 : 0)), (u, z) => (Math.floor(z) % 4 === 0 ? [96, 72, 48] : [140, 110, 74]));
    drawAll(); }
  // ---- the houses: one for each, plank walls and tin roofs, a door, a cot inside
  const MARK = [1, 4, 8, 10], XMARK = u => ({ u, z: 6, w: 13, h: 15, f: (a, c) => { a |= 0; c |= 0; const d1 = Math.abs(a - 6 - (c - 7) * .8), d2 = Math.abs(a - 6 + (c - 7) * .8); return d1 < 1.2 || d2 < 1.2 ? sh([150, 28, 26], .85 + hs(a, c) * .2) : null; } });
  HOUSES.forEach((r, i) => { const lg = i % 3 === 1, W1 = lg ? logW(i + 11, 30) : plankW(i + 11, 30), W2 = lg ? logW(i + 31, 30) : plankW(i + 31, 30), RF = lg ? mossy : thatch; backN(r, 30, W1, [...(MARK.includes(i) ? [XMARK(8)] : [])], RF); backW(r, 30, W2, [], RF);
    B(r[0] + .4, r[1] + .5, 0, 1.4, 2.4, 3, TIMD, (u, v) => u < 6 ? [184, 176, 156] : sh([150, 128, 82], .85 + hs(u | 0, v | 0) * .15)); B(r[2] - 1.4, r[1] + .4, 0, 1, .7, 4, [110, 84, 56]);
    if (i % 3 === 0) candle(r[2] - .9, r[1] + .7, 4, 30, .5); block(r[2] - 1.4, r[1] + .4, 1, .7); });
  // the low front walls of every building, with door posts (the tall back walls are drawn above)
  for (const [x0, y0, x1, y1, ...doors] of P.walls.filter(w => w.low)) { const vert = x0 === x1, a0 = vert ? y0 : x0, a1 = vert ? y1 : x1, cuts = [a0]; doors.forEach(d => cuts.push(d[0], d[1])); cuts.push(a1);
    for (let i = 0; i < cuts.length; i += 2) { const s0 = cuts[i], s1 = cuts[i + 1]; if (s1 - s0 < .05) continue; if (vert) low(x0 - .2, s0, .4, s1 - s0, 8, STN, [120, 100, 76]); else low(s0, y0 - .2, s1 - s0, .4, 8, STN, [120, 100, 76]); }
    for (const d of doors) for (const q of d) { S.E = 0; if (vert) box(x0 - .3, q - .3 + (q === d[1] ? .3 : 0), 0, .6, .3, 20, TIM, TIMD, sh(TIMD, .8)); else box(q - .3 + (q === d[1] ? .3 : 0), y0 - .3, 0, .3, .6, 20, TIM, TIMD, sh(TIMD, .8)); } }
  drawAll();
  // ---- the watchtower: a tall frame of poles at the north-east corner, a lantern and a ladder
  add(42 + 6 + 3, () => { S.E = 0; const P0 = [40.6, 4.8]; for (const [dx, dy] of [[0, 0], [2, 0], [0, 2], [2, 2]]) box(P0[0] + dx, P0[1] + dy, 0, .3, .3, 120, TIM, TIM, TIMD);
    for (const z of [30, 62, 94]) { box(P0[0], P0[1], z, 2.3, .2, 2, TIMD, TIMD, TIMD); box(P0[0], P0[1], z, .2, 2.3, 2, TIMD, TIMD, TIMD); }
    box(P0[0] - .3, P0[1] - .3, 120, 2.9, 2.9, 3, [130, 104, 72], TIM, TIMD); box(P0[0] - .3, P0[1] - .3, 123, 2.9, .2, 10, TIM, TIM, TIMD); box(P0[0] - .3, P0[1] - .3, 123, .2, 2.9, 10, TIM, TIM, TIMD);
    for (let q = 0; q < 8; q++) { const w = 3.5 - q * .42; box(P0[0] + 1.15 - w / 2, P0[1] + 1.15 - w / 2, 133 + q * 4, w, w, 4, thatch, thatch, (u, z) => sh(thatch(u, z), .6)); } });
  lamp(41.8, 5.9, 130, .8); block(40.5, 4.7, 2.5, 2.5);
  // ---- the wall: stakes and planks lashed between posts, scrap nailed over the gaps; the gate with its two watch-platforms
  const stake = (x, y, h, k) => add(x + y + .3, () => { S.E = 0; const top = h + (hs(k, 3) * 5 | 0), scrap = 0; box(x - .2, y - .2, 0, .4, .4, top, scrap ? sh([126, 118, 108], .8 + hs(k, 5) * .3) : sh([150, 118, 80], .85 + hs(k, 1) * .25), scrap ? [100, 94, 86] : sh([126, 96, 64], .9), sh([92, 70, 46], .9)); if (!scrap) { const [sx, sy] = iso(x, y, top); for (let j = 1; j < 5; j++) for (let i = -2 + (j >> 1); i <= 2 - (j >> 1); i++) px(sx + i, sy - j, sh([150, 118, 80], 1 - j * .08)); } for (const z of [5, 12]) { const [ax, ay] = iso(x, y, z); for (let q = -1; q <= 1; q++) px(ax + q, ay, [70, 60, 44]); } });
  let k = 0; for (let x = WALL[0]; x <= WALL[2]; x += .45) { if (x > GATE[0] - .3 && x < GATE[1] + .3) continue; stake(x, WALL[3], 16, k++); } for (let y = WALL[1]; y < WALL[3]; y += .45) stake(WALL[2], y, 16, k++);
  for (let x = WALL[0]; x <= WALL[2]; x += .45) stake(x, WALL[1], 16, k++); for (let y = WALL[1]; y < WALL[3]; y += .45) stake(WALL[0], y, 16, k++);
  for (const x of [GATE[0] - 1.4, GATE[1]]) { B(x, WALL[3] - .7, 0, 1.4, 1.4, 34, [104, 80, 54]); B(x - .2, WALL[3] - .9, 34, 1.8, 1.8, 3, [130, 104, 72]); lamp(x + .7, WALL[3] + .4, 70, .9); }
  B(GATE[0] - .2, WALL[3] - .3, 30, GATE[1] - GATE[0] + .4, .5, 4, TIMD);
  add(GATE[0] + WALL[3] + 2, () => { S.E = 0; for (let i = 0; i < 6; i++) box(GATE[0] - 1 + i * .5, WALL[3] + 1 + (i % 2) * .4, 0, .2, 1.6, 6, [140, 130, 120], [110, 100, 92], [90, 82, 76]); });
  // ---- the square: the well, the workshop and its scaffold, the pyre, the dead cart (the gallows is the game's own, at MAP.gibbet)
  { light(24, 21, 10, 110, 1.0); block(23, 20, 2, 2); block(26.6, 29.2, 3.3, 1.5);
    add(24 + 21 + 2, () => { S.E = 0; box(23, 20, 0, 2, 2, 8, (u, v) => (u > 4 && u < 16 && v > 4 && v < 16) ? [12, 16, 16] : [150, 140, 120], (u, z) => stone(u, z, [[176, 164, 140], [160, 146, 120], [140, 126, 104]], 6, 3), (u, z) => sh(stone(u, z, GRY, 6, 3), .6)); box(23.1, 20.9, 8, .25, .25, 16, TIM, TIM, TIMD); box(24.65, 20.9, 8, .25, .25, 16, TIM, TIM, TIMD); box(22.9, 20.5, 24, 2.2, 1.1, 3, thatch, thatch, sh([112, 96, 58], .5)); });
    // the workshop: a scaffold of poles over the timber, a sawhorse, a hoist
    add(28 + 30 + 4, () => { S.E = 0; for (const [x, y] of [[26, 28.4], [30, 28.4], [26, 31.6], [30, 31.6]]) box(x, y, 0, .25, .25, 46, TIM, TIM, TIMD); for (const z of [20, 44]) { box(26, 28.4, z, 4.25, .25, 2, TIMD, TIMD, TIMD); box(26, 31.6, z, 4.25, .25, 2, TIMD, TIMD, TIMD); box(26, 28.4, z, .25, 3.45, 2, TIMD, TIMD, TIMD); box(30, 28.4, z, .25, 3.45, 2, TIMD, TIMD, TIMD); }
      box(26.2, 28.6, 22, 3.9, 3.1, 1, [140, 112, 78], TIM, TIMD); for (const [x, y, h] of [[26.6, 29.2, 0], [26.6, 30, 0], [26.9, 29.6, 3]]) box(x, y, h, 3, .7, 3, [118, 90, 60], (u, v) => sh([150, 120, 80], .9), (u, z) => (Math.hypot((u % 7) - 3.5, z - 1.5) < 1.4 ? [170, 140, 96] : [96, 72, 48])); });
    light(28, 30, 8, 60, .7); lamp(31.2, 28.2, 60, .7);
    // the pyre, the dead cart, the gallows
    light(19.5, 36.5, 8, 120, 1.15); block(18.3, 35.3, 2.4, 2.4);
    add(19.5 + 36.5 + 2, () => { S.E = 0; for (const [dx, dy, w, d, h] of [[-1.2, -.3, 2.6, .5, 3], [-.3, -1.2, .5, 2.6, 3], [-1, .3, 2.2, .5, 5], [.3, -1, .5, 2.2, 5]]) box(19.5 + dx, 36.5 + dy, h - 3, w, d, 3, [70, 50, 36], [50, 36, 28], [36, 26, 22]); const [sx, sy] = iso(19.5, 36.5, 6); S.E = 1; for (let j = 0; j < 28; j++) { const w = (j < 8 ? 7 : 7 - (j - 8) * .34) + Math.sin(j * 1.3) * 1.2; for (let i = -w; i <= w; i++) { const t2 = j / 28 + Math.abs(i) / 11 + (hs(i | 0, j + T * 17) - .5) * .3; px(sx + i + Math.sin(j * .5 + PH) * 1.5, sy - j, t2 < .3 ? [255, 240, 170] : t2 < .55 ? [255, 190, 80] : t2 < .8 ? [240, 120, 50] : [170, 60, 40]); } } S.E = 0; smoke(sx, sy - 26, 64, [130, 122, 112]); });
    block(36, 36.5, 3.6, 1.8);
    B(36, 36.5, 5, 3.6, 1.8, 2, [96, 72, 48]); B(36, 36.5, 7, 3.6, .15, 4, [80, 60, 40]); B(36, 38.15, 7, 3.6, .15, 4, [80, 60, 40]);
    add(36 + 3.6 + 36.5 + 1.8 + .2, () => { S.E = 0; for (const [x, y] of [[36.6, 38.4], [38.8, 38.4]]) { const [sx, sy] = iso(x, y, 4); for (let a = 0; a < 6.3; a += .12) { px(sx + Math.cos(a) * 5, sy - Math.sin(a) * 5, [60, 46, 34]); } for (let q = -4; q <= 4; q++) { px(sx + q, sy, [70, 54, 38]); px(sx, sy + q, [70, 54, 38]); } } for (const [x, y, c] of [[36.5, 36.9, [176, 168, 150]], [37.7, 37.3, [150, 144, 126]], [38.6, 36.8, [166, 156, 136]]]) { const [sx, sy] = iso(x, y, 7); for (let i = -4; i <= 6; i++) for (let j = 0; j < 4 - Math.abs(i - 1) * .4; j++) px(sx + i + j, sy + i * .5 - j, sh(c, .65 + j * .1)); } });
    lamp(17, 21.2, 70, .7); lamp(31.2, 21.2, 70, .7); lamp(12, 16, 60, .6); lamp(36, 16, 60, .6); for (const [x, y] of [[17.2, 22.4], [17.2, 33.8], [32.6, 22.4], [32.6, 28.4], [20.4, 27.6], [28.4, 15.9], [24.8, 39.6]]) lamp(x, y, 70, .75);
    deadTree(9.5, 15.4, 5, 30);
    for (const [x, y, k] of [[18.2, 26.2, 3], [30.6, 25.6, 5], [5.9, 39.5, 1], [42, 6.2, 4], [18.5, 38.8, 6]]) { tree(x, y, k); block(x - .4, y - .4, .8, .8); }
    const GDN = [40, 33.5, 42.6, 38.2];
    // the garden: rows of something gone to rot, a stick fence, the scarecrow in a coat with a sack for a head
    for (let x = GDN[0]; x <= GDN[2]; x += .7) { const xx = x; add(xx + GDN[3] + .2, () => { S.E = 0; box(xx, GDN[3] - .1, 0, .15, .15, 7, TIMD, TIMD, TIMD); }); }
    add(41.2 + 35.6 + 1, () => { S.E = 0; box(41.15, 35.55, 0, .2, .2, 34, TIM, TIM, TIMD); box(40.2, 35.55, 26, 2.1, .2, .4, TIM, TIM, TIMD); box(40.7, 35.35, 14, 1.1, .6, 13, [70, 56, 46], [60, 48, 40], [48, 38, 32]); for (const s of [-1, 1]) box(41.2 + s * .9 - .3, 35.4, 22, .6, .5, 4, [70, 56, 46], [60, 48, 40], [48, 38, 32]);
      const [hx, hy] = iso(41.25, 35.65, 31); for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j < 18) px(hx + i, hy + j, sh([150, 128, 90], .7 + (i + j) * .02)); px(hx - 1, hy - 1, [20, 16, 14]); px(hx + 2, hy - 1, [20, 16, 14]); for (let i = -1; i <= 2; i++) px(hx + i, hy + 2, [30, 20, 16]); });
    drawAll(); }
  // ---- the World Beyond: ruins, bones, an overturned cart, a zone post, dead trees
  { const ruin = (x, y, w, d, s) => { for (let i = 0; i < w; i += .5) { const h = 6 + hs(i * 7 + s, 3) * 22 * (1 - i / w * .6); low(x + i, y, .5, .5, h, STN, [150, 140, 124]); } for (let j = .5; j < d; j += .5) { const h = 6 + hs(j * 9 + s, 5) * 16; low(x, y + j, .5, .5, h, STN, [150, 140, 124]); } };
    ruin(1, 43.4, 4, 2.6, 1); ruin(31, 43.8, 3, 2, 2); block(31, 43.8, 3, .5); block(31, 43.8, .5, 2); block(11, 43.2, 3, 1.5); ruin(45, 18, 2, 4, 3);
    add(12 + 44 + 1, () => { S.E = 0; box(11, 43.2, 0, 3, 1.5, 3, [96, 72, 48], [110, 84, 56], [80, 60, 40]); const [sx, sy] = iso(12.2, 44.9, 5); for (let a = 0; a < 6.3; a += .12) px(sx + Math.cos(a) * 6, sy - Math.sin(a) * 3, [60, 46, 34]); });
    for (const [x, y] of [[8, 45], [19, 44], [37, 45], [45, 10], [46, 30]]) add(x + y, () => { S.E = 0; const [sx, sy] = iso(x, y); for (let i = -3; i <= 3; i++) px(sx + i, sy, [214, 208, 190]); px(sx - 4, sy - 1, [214, 208, 190]); px(sx + 4, sy - 1, [214, 208, 190]); px(sx - 1, sy - 2, [200, 194, 176]); px(sx + 1, sy - 2, [200, 194, 176]); for (let i = -1; i <= 1; i++) px(sx + 7 + i, sy - 2, [222, 216, 200]); px(sx + 7, sy - 3, [222, 216, 200]); });
    for (const [x, y] of [[20, 43], [21.4, 44.4], [27, 43.2], [28.4, 44.6], [29.8, 43.4], [7.5, 44.2]]) add(x + y + .3, () => { S.E = 0; const [sx, sy] = iso(x, y); for (let j = 1; j < 13; j++) { px(sx, sy - j, [96, 76, 52]); px(sx + 1, sy - j, [70, 54, 36]); } for (let i = -3; i <= 4; i++) { px(sx + i, sy - 9, [96, 76, 52]); px(sx + i, sy - 8, [70, 54, 36]); } });
    for (const [x, y, s] of [[3, 46, 2], [16, 45.4, 5], [40, 44.6, 7], [46, 25, 3], [45.5, 38, 6], [2, 30, 8], [2.2, 14, 4]]) deadTree(x, y, s, 42);
    drawAll(); }
  return { canvas: finish(), e };
};
