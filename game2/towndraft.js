// Draft towns: the plague town redrawn smaller, now that the materials are out in the woods. Same pieces as townscene.js,
// moved: each building and prop group is the original drawn at an offset (OFFS), so they look exactly as in the game.
window.MAPS = window.MAPS || {};
window.mkTown = (key, name, L) => {
  const ORIG = { CHURCH: [7, 7], TAVERN: [16, 7], APOTH: [26, 7], WATCH: [34, 7], WELL: [23, 20], SHOP: [26, 28.4], PYRE: [18.3, 35.3], CART: [36, 36.5], GDN: [40, 33.5], TOWER: [40.6, 4.8] };
  const OFFS = {}; for (const k in ORIG) if (L[k]) OFFS[k] = [L[k][0] - ORIG[k][0], L[k][1] - ORIG[k][1]];
  const SZ = { CHURCH: [7, 7], TAVERN: [8, 5], APOTH: [6, 5], WATCH: [6, 5] }, R4 = k => [L[k][0], L[k][1], L[k][0] + SZ[k][0], L[k][1] + SZ[k][1]];
  const WALL = L.WALL, GATE = L.GATE, CHURCH = R4('CHURCH'), TAVERN = R4('TAVERN'), APOTH = R4('APOTH'), WATCH = R4('WATCH'), HOUSES = L.HOUSES.map(([x, y]) => [x, y, x + 4, y + 4]);
  const bld = (r, d) => { const S = [r[0], r[3], r[2], r[3], [r[0] + d[0], r[0] + d[1]]], E = [r[2], r[1], r[2], r[3]]; S.low = E.low = 1; return [[r[0], r[1], r[2], r[1]], [r[0], r[1], r[0], r[3]], S, E]; };
  const walls = [...bld(CHURCH, [2.9, 4.5]), ...bld(TAVERN, [3, 4.6]), ...bld(APOTH, [2.2, 3.8]), ...bld(WATCH, [2.2, 3.8]), ...HOUSES.flatMap(r => bld(r, [1.1, 2.7]))];
  const pal = [[WALL[0], WALL[1], WALL[2], WALL[1]], [WALL[0], WALL[1], WALL[0], WALL[3]], [WALL[2], WALL[1], WALL[2], WALL[3]], [WALL[0], WALL[3], WALL[2], WALL[3], GATE]];
  const T0 = MAPS.town, gx = (GATE[0] + GATE[1]) / 2;
  MAPS[key] = { ...T0, key, name, G: { WALL, GATE, CHURCH, TAVERN, APOTH, WATCH, HOUSES }, fieldY: WALL[3] + .4,
    pois: L.pois || T0.pois, paths: [[[gx, WALL[3]], [24, 47]], ...T0.paths.slice(1)],
    plan: { rooms: { chapel: { r: CHURCH, name: 'Church' }, refect: { r: TAVERN, name: 'Tavern' }, script: { r: APOTH, name: 'Apothecary' }, tower: { r: WATCH, name: 'Watch House' },
        dorm: { r: HOUSES[0], rs: HOUSES, name: 'Home' }, yard: { r: WALL, name: 'Square', out: 1 }, fields: { r: [0, WALL[3], 48, 72], rs: [[0, WALL[3], 48, 72], [0, 0, WALL[0], WALL[3]], [WALL[2], 0, 48, WALL[3]], [WALL[0], 0, WALL[2], WALL[1]]], name: 'The Woods', out: 1, outside: 1 } },
      walls: [...walls, ...pal], pal, furn: [], spots: {}, pad: .12, bounds: [1.35, 1.35, 46.65, 71.35] } };
const scene = function (t = 0, N = 4) {
  const M = MAPS[key], P = M.plan; P.furn = []; let OX = 0, OY = 0; const block = (x, y, w, d) => P.furn.push([x + OX, y + OY, w, d]); const OFF = k => { const o = OFFS[k] || [0, 0]; OX = o[0]; OY = o[1]; };
  const e = ENG({ ...M.view, K: 1, t, N, noVig: 1, noWeather: 1, zt: 1, amb: { in: [.21, .19, .21], out: [.25, .31, .38] } });
  const { T, PH, smoke, S, px, dark, hs, vn, sh, mix, stone, TIM, TIMD, GRY, STN, drawAll, ground, D, finish } = e;
  const _s = f => (x, y, ...a) => f(x + OX, y + OY, ...a), iso = _s(e.iso), box = _s(e.box), light = _s(e.light), B = _s(e.B), candle = _s(e.candle), lamp = _s(e.lamp), low = _s(e.low), deadTree = _s(e.deadTree);
  const add = (d, f) => { const ox = OX, oy = OY; e.add(d + ox + oy, () => { const a = OX, b = OY; OX = ox; OY = oy; f(); OX = a; OY = b; }); }, rr = r => [r[0] + OX, r[1] + OY, r[2] + OX, r[3] + OY], backN = e.backN, backW = e.backW;
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
  const ROADS = L.roads;
  // ---- the ground: packed dust in the camp, wheel ruts on the streets, sand dunes beyond the wall
  const plank = (x, y, n, dk, rot) => { const a = rot ? x : y, b = rot ? y : x, k = Math.floor(a * 2), ed = (a * 2 - k) < .12 || ((b + hs(k, 1) * 3) % 3) < .1; return ed ? sh(TIMD, .6) : sh([[124, 96, 68], [114, 86, 58], [104, 78, 52]][Math.floor(hs(k, 7) * 3)], (.9 + n * .1) * dk * (.75 + vn(x * .8, y * .8) * .35)); };
  const flag = (x, y, pal, s2, n) => { const X = x / s2, Y = y / s2 + (Math.floor(X) % 2) * .5, ed = (X - Math.floor(X)) < .09 / s2 || (Y - Math.floor(Y)) < .09 / s2; return ed ? sh(pal[2], .55) : sh(pal[Math.floor(hs(Math.floor(X), Math.floor(Y)) * pal.length)], (.9 + n * .1) * (.78 + vn(x * .9, y * .9) * .3)); };
  // ---- the ground: plank and flag floors indoors, cobbles sinking into mud in the camp, furrowed plague fields beyond the wall
  ground((x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)), inside = inR(WALL, x, y);
    for (const r of [CHURCH, CANTEEN, APOTH, BANK, ...HOUSES]) if (inR(r, x, y)) { let c;
      if (r === CHURCH) { c = flag(x, y, GRY, 1.3, n); if (x > r[0] + 2.6 && x < r[0] + 4.4 && y > r[1] + 1.6) c = sh(((Math.floor(x * 2) + Math.floor(y * 4)) % 9 === 0 ? [80, 26, 28] : [110, 34, 36]), (.85 + n * .1) * (.8 + vn(x, y * 3) * .25)); }
      else if (r === APOTH) { const X = x / 1.2, Y = y / 1.2 + (Math.floor(X) % 2) * .5; c = ((X % 1) < .08 || (Y % 1) < .08) ? sh(GRY[2], .5) : sh(GRY[Math.floor(hs(Math.floor(X), Math.floor(Y)) * 4)], (.9 + n * .1) * (.8 + vn(x, y) * .3)); }
      else c = plank(x, y, n, r === CANTEEN || r === BANK ? 1 : .8, r !== CANTEEN && r !== BANK);
      const ao = Math.min(x - r[0], y - r[1]); return [ao < 1 ? sh(c, .62 + ao * .38) : c, 1]; }
    let road = 9; for (const [a, b] of ROADS) road = Math.min(road, segd(x, y, a, b)); const mud = vn(x * .45 + 5, y * .45);
    if (inside && L.d2n) { let c = mix(sh(DUST, .8 + n * .18), sh(SAND, .85 + n * .15), vn(x * .5, y * .5));
      if (road < 1.4) { c = mix(c, sh([150, 116, 80], .8 + n * .2), .7); if (Math.abs(road - .7) < .12) c = sh(c, .72); }
      if (vn(x * 1.3 + 7, y * 1.3) > .8) c = mix(c, [120, 104, 82], .5); if (vn(x * .7 + 40, y * .7) > .7) c = mix(c, sh([110, 100, 70], .8 + n * .2), .5);
      const ao = Math.min(x - WALL[0], y - WALL[1]); if (ao < 1.2) c = sh(c, .6 + ao * .33); return [c, 0]; }
    if (inside) { const cx = x * 2.4 + (Math.floor(y * 2.4) % 2) * .5, cy = y * 2.4, dx = cx - Math.floor(cx) - .5, dy = cy - Math.floor(cy) - .5, rr = Math.hypot(dx, dy);
      let c = rr < .4 ? sh([150, 142, 126], .75 + hs(Math.floor(cx), Math.floor(cy)) * .3 - rr * .5 + (dy < -.15 ? .12 : 0)) : [58, 50, 42];
      const lane = road < 1.5; if (!lane) c = mix(c, sh([110, 88, 62], .8 + n * .25), Math.min(1, Math.max(0, (mud - .42) * 4)));     // off the lanes the cobbles drown in mud
      if (!lane && vn(x * .7 + 40, y * .7) > .6) c = mix(c, sh([62, 72, 42], .7 + n * .25), .75);                                  // grass taking it back
      if (!lane && mud > .84) return [[40, 50, 52], 0];                                                                         // standing water
      if (L.plaza) { const pd = Math.hypot((x - L.plaza[0]) * .8, y - L.plaza[1]) - L.plaza[2] + (vn(x * .8, y * .8) - .5) * 1.2; if (pd < 0) c = mix(c, sh([146, 120, 86], .78 + n * .22 + (Math.sin(x * 3.1 + y * 1.3) > .93 ? -.15 : 0)), Math.min(.85, -pd * .8)); }
      const ao = Math.min(x - WALL[0], y - WALL[1]); if (ao < 1.2) c = sh(c, .6 + ao * .33); return [c, 0]; }
    const fur = Math.abs(Math.sin((x + y * .15) * 2.6)), g = vn(x * 2.1 + 11, y * 2.1), near = Math.min(x - WALL[0] + 4, y - WALL[1] + 4, WALL[2] + 5 - x, WALL[3] + 6 - y) > 0;
    let c = mix(sh([104, 94, 64], .74 + n * .25), sh([66, 54, 38], .8 + n * .2), fur > .75 ? .8 : .2 + g * .2); if (!near) c = sh(mix(c, [40, 38, 30], .5), .7);
    let wr = 9; for (const [a, b] of M.paths) wr = Math.min(wr, segd(x, y, a, b)); for (const q of M.pois) wr = Math.min(wr, Math.hypot(x - q.x, y - q.y) - q.r + 1);
    if (L.d2n) { const du = Math.sin(x * .32 + Math.sin(y * .21) * 2.2) * .5 + .5, rip = Math.sin((x * 1.7 + y * .9) * 2.4 + vn(x * .3, y * .3) * 3) > .97, far = Math.max(0, Math.max(WALL[0] - 3 - x, WALL[1] - 3 - y, x - WALL[2] - 3, y - WALL[3] - 5)) * .012;
      c = mix(sh(SAND, .76 + n * .14), sh(OCHRE, .68 + n * .12), du * .55); if (rip) c = sh(c, .86); if (vn(x * .9 + 3, y * .9) > .82) c = mix(c, [120, 104, 86], .55); c = sh(c, 1 - Math.min(.25, far));
      if (wr < 1.1 + (vn(x * 1.3, y * 1.3) - .5) * .5 || (road < 1.2 && y > WALL[3] && y < WALL[3] + 7)) c = mix(c, sh([140, 112, 80], .82 + n * .2), .6);
      const dp = Math.hypot((x - 12.5) * .8, y - 64); if (dp < 2.6) c = dp < 1.7 ? sh([34, 30, 28], .9 + n * .2) : mix(c, [196, 194, 182], .7 - (dp - 1.7) * .6); return [c, 0]; }
    if (road < 1.3 + (vn(x, y) - .5) * .5 && y > WALL[3] && y < WALL[3] + 6) c = mix(c, sh([96, 78, 56], .85 + n * .2), .8);
    const fo = Math.max(WALL[0] - 2 - x, WALL[1] - 2 - y, x - WALL[2] - 2, y - WALL[3] - 4); if (fo > 0) { let f2 = mix(sh([46, 42, 30], .7 + n * .3), sh([40, 54, 34], .7 + n * .3), g); c = mix(c, sh(f2, Math.max(.8, 1 - fo * .01)), Math.min(1, fo * .6)); if (wr < 1.1 + (vn(x * 1.3, y * 1.3) - .5) * .5) c = mix(c, sh([74, 62, 44], .75 + n * .2), .7); }
    const dp = Math.hypot((x - 12.5) * .8, y - 64); if (dp < 2.6) c = dp < 1.7 ? sh([34, 30, 28], .9 + n * .2) : mix(c, [196, 194, 182], .7 - (dp - 1.7) * .6);   // the lime pit
    return [c, 0]; });
  // ---- far off: dead trees and the ruins of the old villages
  P.sight = []; let tk = 0; for (let y = -3; y < 76; y += 1.5) for (let x = -3; x < 52; x += 1.5) { const jx = x + (hs(tk, 1) - .5) * 1.2, jy = y + (hs(tk, 2) - .5) * 1.2; tk++;
    const out = jx < WALL[0] - (window.__TC || 2.2) || jy < WALL[1] - (window.__TC || 2.2) || jx > WALL[2] + 2.2 || jy > WALL[3] + 4.4; if (!out || hs(tk, 5) < .22) continue;
    let wr = 9; for (const [a, b] of M.paths) wr = Math.min(wr, segd(jx, jy, a, b)); if (wr < 1.7) continue; if (M.pois.some(q => Math.hypot(jx - q.x, jy - q.y) < q.r + .6)) continue; if (jy > WALL[3] && jy < WALL[3] + 5.6 && jx > WALL[0] - 2 && jx < WALL[2] + 2) continue;
    if (L.d2n) { if (hs(tk, 9) < .35) continue; const kind = hs(tk, 11); if (kind < .5) deadTree(jx, jy, tk, 22 + hs(tk, 12) * 22); else if (kind < .85) { const w = .6 + hs(tk, 13) * .7, d2 = .5 + hs(tk, 14) * .6, h = 5 + hs(tk, 15) * 9; add(jx + jy + .5, () => { S.E = 0; box(jx - w / 2, jy - d2 / 2, 0, w, d2, h, sh([112, 98, 78], .8), (u, z) => sh(stone(u, z, [[124, 108, 84], [110, 96, 76], [98, 86, 70]], 6, 3), .75), (u, z) => sh(stone(u, z, [[124, 108, 84], [110, 96, 76], [98, 86, 70]], 6, 3), .55)); }); }
      else { for (let i = 0; i < 3; i++) low(jx - .7 + i * .5, jy, .5, .5, 4 + hs(tk + i, 3) * 16, STN, [150, 140, 124]); } }
    else tree(jx, jy, tk); if (jx > 1 && jx < 47 && jy > 1 && jy < 71.6) { block(jx - .35, jy - .35, .7, .7); P.sight.push([jx, jy]); } }
  for (let i = 0; i < 6; i++) deadTree(-1 - hs(i, 1) * 2.4, 2 + i * 7, i + 3, 46); drawAll();
  S.Z = 1;
  OFF('CHURCH');
  // ---- the church: the one stone building, its bell in a wooden cage on the roof
  { const r = CHURCH; backN(r, 84, kirk, [D.slit(20, 46), D.cross(40, 40), D.slit(60, 46)], thatch); backW(r, 84, kirk, [D.slit(18, 46), D.sconce(40, 34), D.slit(62, 46)], thatch);
    light(10.5, 8, 30, 50, .7); B(9.2, 7.6, 0, 3, 1, 8, [150, 146, 140], null, (u, z) => z > 5 ? [120, 36, 38] : sh(stone(u, z, GRY, 8, 4), .8)); block(9.2, 7.6, 3, 1); candle(9.6, 8, 8, 40, .6); candle(11.8, 8, 8, 40, .6);
    for (const y of [9.8, 11.4]) for (const x of [7.6, 11.2]) { block(x, y, 2.4, .6); B(x, y, 0, 2.4, .6, 5, [100, 74, 48]); B(x, y + .5, 5, 2.4, .14, 5, [86, 62, 40]); }
    B(7.3, 6.4, 84, 1.6, 1.6, 22, null, (u, z) => (u % 7 < 1.2 || z < 2 || z > 20) ? [80, 60, 40] : [24, 20, 18], (u, z) => (u % 7 < 1.2 || z < 2 || z > 20) ? [70, 52, 36] : [20, 16, 14]); drawAll(); }
  OFF('TAVERN');
  // ---- the canteen: long tables, a stove, sacks
  { const r = CANTEEN; backN(r, 56, plankW(4), [D.win(12, 26, 1), D.hearth(40), D.sign ? D.sign(70, 40) : D.win(70, 26)], tin);
    light(19.5, 7.6, 6, 90, 1.1); block(16.8, 9.2, 3, 1); block(20.6, 9.6, 3, 1); block(22.8, 7.4, 1.1, 2.1); for (const [x, y] of [[16.8, 9.2], [20.6, 9.6]]) { B(x, y, 7, 3, 1, 2, TIM); for (const dx of [.2, 2.6]) B(x + dx, y + .1, 0, .3, .8, 7, TIMD); }
    for (const [x, y] of [[22.8, 7.4], [23, 8.6]]) B(x, y, 0, .9, .9, 6, [150, 132, 96], [170, 150, 110]); drawAll(); }
  OFF('APOTH');
  // ---- the apothecary: jars, a green lamp, a sick cot
  { const r = APOTH; backN(r, 56, plankW(9), [D.shelf(8, 18, 30, 34, [[150, 170, 104], [130, 96, 70], [100, 140, 96], [180, 170, 146]]), D.win(46, 26, 1)], tin);
    light(29, 7.6, 30, 60, .8, [.6, 1, .5]); block(26.8, 9.4, 2.6, 1.2); block(30.4, 9, 1.4, 2.6); B(26.8, 9.4, 7, 2.6, 1.2, 2, TIM); B(30.4, 9, 0, 1.4, 2.6, 4, TIMD, (u, v) => v < 6 ? [200, 196, 180] : [150, 140, 110]); drawAll(); }
  OFF('WATCH');
  // ---- the bank: crates, sacks and a counter; the town's stash lives here
  { const r = BANK; backN(r, 60, plankW(2), [D.sign ? D.sign(18, 42) : D.win(18, 26), D.win(44, 26, 1)], tin);
    light(37, 9, 20, 70, .9); block(34.6, 9.6, 4.6, .8); block(38.6, 7.4, 1.6, 2.1); block(35, 7.3, 2.1, 1); B(34.6, 9.6, 0, 4.6, .8, 9, [104, 78, 50], null, (u, z) => sh(TIM, (Math.floor(u) % 6 === 0 ? .5 : .78)));
    for (const [x, y, h] of [[38.6, 7.4, 8], [39.2, 8.5, 6], [35, 7.3, 7], [36.1, 7.3, 5]]) B(x, y, 0, 1, 1, h, [150, 120, 80], (u, v) => sh([170, 136, 92], .9 + (Math.floor(u) % 5 === 0 ? -.3 : 0)), (u, z) => (Math.floor(z) % 4 === 0 ? [96, 72, 48] : [140, 110, 74]));
    drawAll(); }
  OFF('null');
  // ---- the houses: one for each, plank walls and tin roofs, a door, a cot inside
  const MARK = [1, 4, 8, 10], XMARK = u => ({ u, z: 6, w: 13, h: 15, f: (a, c) => { a |= 0; c |= 0; const d1 = Math.abs(a - 6 - (c - 7) * .8), d2 = Math.abs(a - 6 + (c - 7) * .8); return d1 < 1.2 || d2 < 1.2 ? sh([150, 28, 26], .85 + hs(a, c) * .2) : null; } });
  // cottages (Die2Nite-style homes, closed): walls all round, a door and a lit window, a stepped thatch roof and a chimney
  if (L.cottage) HOUSES.forEach((r, i) => { const lg = !L.d2n && i % 3 === 1, W1 = lg ? logW(i + 11, 30) : L.d2n && i % 2 ? plankOld(i + 11) : plankW(i + 11, 30), W2 = lg ? logW(i + 31, 30) : plankW(i + 31, 30), RF = L.d2n ? (i % 2 ? tinOld : thatch) : lg ? mossy : thatch, lit = hs(i, 41) < .6;
    const doorF = (u, z) => { if (u > 11 && u < 27 && z < 22) return (u < 12.5 || u > 25.5 || z > 20.5) ? sh(TIMD, .7) : sh([86, 62, 42], .75 + (Math.floor(u / 3) % 2 ? .1 : 0) + (Math.abs(u - 23) < 1 && Math.abs(z - 11) < 1 ? .5 : 0));
      if (u > 30 && u < 37 && z > 11 && z < 21) return (u < 31 || u > 36 || z < 12 || z > 20 || Math.abs(u - 33.5) < .6 || Math.abs(z - 16) < .6) ? sh(TIMD, .7) : lit ? [226, 170, 92] : [30, 32, 36];
      if (MARK.includes(i) && u > 2 && u < 9 && z > 6 && z < 26) { const d1 = Math.abs(u - 5.5 - (z - 16) * .35), d2 = Math.abs(u - 5.5 + (z - 16) * .35); if (d1 < .9 || d2 < .9) return [150, 28, 26]; } return W1(u, z); };
    const sideF = (u, z) => (u > 14 && u < 22 && z > 11 && z < 21) ? ((u < 15 || u > 21 || z < 12 || z > 20 || Math.abs(u - 18) < .6) ? sh(TIMD, .7) : lit ? [210, 156, 84] : [30, 32, 36]) : sh(W2(u, z), .9);
    add(r[2] + r[3] - .2, () => { S.E = 0; box(r[0], r[1], 0, 4, 4, 30, [70, 56, 40], doorF, sideF);
      box(r[2] - 1.3, r[1] + .5, 30, .7, .7, 34, null, (u, z) => sh(stone(u, z, STN, 4, 3), .8), (u, z) => sh(stone(u, z, STN, 4, 3), .65));
      for (let k = 0; k < 9; k++) { const dd = 4.8 - k * .56, y0 = r[1] - .4 + k * .28; box(r[0] - .22, y0, 30 + k * 3.4, 4.44, dd, 3.4, RF, (u, z) => sh(RF(u, z + k * 4), .82), k < 1 ? (u, z) => sh(RF(u, z), .6) : (u, z) => sh(W2(u + 7, z + 30 + k * 3), .78)); }
      if (i % 4 === 1) { const [sx, sy] = iso(r[2] - .95, r[1] + .85, 66); smoke(sx, sy, 26, [92, 94, 90]); } });
    if (lit) light(r[0] + 3.4, r[3] + .6, 14, 30, .55); });
  else HOUSES.forEach((r, i) => { const lg = i % 3 === 1, W1 = lg ? logW(i + 11, 30) : plankW(i + 11, 30), W2 = lg ? logW(i + 31, 30) : plankW(i + 31, 30), RF = lg ? mossy : thatch; backN(r, 30, W1, [...(MARK.includes(i) ? [XMARK(8)] : [])], RF); backW(r, 30, W2, [], RF);
    B(r[0] + .4, r[1] + .5, 0, 1.4, 2.4, 3, TIMD, (u, v) => u < 6 ? [184, 176, 156] : sh([150, 128, 82], .85 + hs(u | 0, v | 0) * .15)); B(r[2] - 1.4, r[1] + .4, 0, 1, .7, 4, [110, 84, 56]);
    if (i % 3 === 0) candle(r[2] - .9, r[1] + .7, 4, 30, .5); block(r[2] - 1.4, r[1] + .4, 1, .7); });
  // the low front walls of every building, with door posts (the tall back walls are drawn above)
  for (const [x0, y0, x1, y1, ...doors] of P.walls.filter(w => w.low && !(L.cottage && HOUSES.some(h => (w[0] === h[2] && w[1] === h[1]) || (w[1] === h[3] && w[0] === h[0]))))) { const vert = x0 === x1, a0 = vert ? y0 : x0, a1 = vert ? y1 : x1, cuts = [a0]; doors.forEach(d => cuts.push(d[0], d[1])); cuts.push(a1);
    for (let i = 0; i < cuts.length; i += 2) { const s0 = cuts[i], s1 = cuts[i + 1]; if (s1 - s0 < .05) continue; if (vert) low(x0 - .2, s0, .4, s1 - s0, 8, STN, [120, 100, 76]); else low(s0, y0 - .2, s1 - s0, .4, 8, STN, [120, 100, 76]); }
    for (const d of doors) for (const q of d) { S.E = 0; if (vert) box(x0 - .3, q - .3 + (q === d[1] ? .3 : 0), 0, .6, .3, 20, TIM, TIMD, sh(TIMD, .8)); else box(q - .3 + (q === d[1] ? .3 : 0), y0 - .3, 0, .3, .6, 20, TIM, TIMD, sh(TIMD, .8)); } }
  drawAll();
  OFF('TOWER');
  // ---- the watchtower: a tall frame of poles at the north-east corner, a lantern and a ladder
  add(42 + 6 + 3, () => { S.E = 0; const P0 = [40.6, 4.8]; for (const [dx, dy] of [[0, 0], [2, 0], [0, 2], [2, 2]]) box(P0[0] + dx, P0[1] + dy, 0, .3, .3, 120, TIM, TIM, TIMD);
    for (const z of [30, 62, 94]) { box(P0[0], P0[1], z, 2.3, .2, 2, TIMD, TIMD, TIMD); box(P0[0], P0[1], z, .2, 2.3, 2, TIMD, TIMD, TIMD); }
    box(P0[0] - .3, P0[1] - .3, 120, 2.9, 2.9, 3, [130, 104, 72], TIM, TIMD); box(P0[0] - .3, P0[1] - .3, 123, 2.9, .2, 10, TIM, TIM, TIMD); box(P0[0] - .3, P0[1] - .3, 123, .2, 2.9, 10, TIM, TIM, TIMD);
    for (let q = 0; q < 8; q++) { const w = 3.5 - q * .42; box(P0[0] + 1.15 - w / 2, P0[1] + 1.15 - w / 2, 133 + q * 4, w, w, 4, thatch, thatch, (u, z) => sh(thatch(u, z), .6)); } });
  lamp(41.8, 5.9, 130, .8); block(40.5, 4.7, 2.5, 2.5);
  OFF('null');
  // ---- the wall: stakes and planks lashed between posts, scrap nailed over the gaps; the gate with its two watch-platforms
  const stake = (x, y, h, k) => add(x + y + .3, () => { S.E = 0; const top = h + (hs(k, 3) * 5 | 0), scrap = 0; box(x - .2, y - .2, 0, .4, .4, top, scrap ? sh([126, 118, 108], .8 + hs(k, 5) * .3) : sh([150, 118, 80], .85 + hs(k, 1) * .25), scrap ? [100, 94, 86] : sh([126, 96, 64], .9), sh([92, 70, 46], .9)); if (!scrap) { const [sx, sy] = iso(x, y, top); for (let j = 1; j < 5; j++) for (let i = -2 + (j >> 1); i <= 2 - (j >> 1); i++) px(sx + i, sy - j, sh([150, 118, 80], 1 - j * .08)); } for (const z of [5, 12]) { const [ax, ay] = iso(x, y, z); for (let q = -1; q <= 1; q++) px(ax + q, ay, [70, 60, 44]); } });
  let k = 0; for (let x = WALL[0]; x <= WALL[2]; x += .45) { if (x > GATE[0] - .3 && x < GATE[1] + .3) continue; stake(x, WALL[3], 16, k++); } for (let y = WALL[1]; y < WALL[3]; y += .45) stake(WALL[2], y, 16, k++);
  for (let x = WALL[0]; x <= WALL[2]; x += .45) stake(x, WALL[1], 16, k++); for (let y = WALL[1]; y < WALL[3]; y += .45) stake(WALL[0], y, 16, k++);
  for (const x of [GATE[0] - 1.4, GATE[1]]) { B(x, WALL[3] - .7, 0, 1.4, 1.4, 34, [104, 80, 54]); B(x - .2, WALL[3] - .9, 34, 1.8, 1.8, 3, [130, 104, 72]); lamp(x + .7, WALL[3] + .4, 70, .9); }
  B(GATE[0] - .2, WALL[3] - .3, 30, GATE[1] - GATE[0] + .4, .5, 4, TIMD);
  add(GATE[0] + WALL[3] + 2, () => { S.E = 0; for (let i = 0; i < 6; i++) box(GATE[0] - 1 + i * .5, WALL[3] + 1 + (i % 2) * .4, 0, .2, 1.6, 6, [140, 130, 120], [110, 100, 92], [90, 82, 76]); });
  // Die2Nite: the defences outside the stakes, a row of sharpened spikes leaning out, and junk barricades heaped at the corners
  if (L.spikes) { let q = 0; const spike = (x, y, k) => add(x + y + .2, () => { S.E = 0; const [sx, sy] = iso(x, y); const h = 14 + (hs(k, 2) * 6 | 0); for (let j = 0; j < h; j++) { const ox = j * .55; px(sx + ox, sy - j, sh([150, 118, 80], .8 + hs(k, 1) * .2)); if (j < h - 3) px(sx + ox + 1, sy - j, sh([110, 84, 56], .8)); } });
    for (let x = WALL[0] - .6; x <= WALL[2] + .6; x += .8) if (x < GATE[0] - 1.6 || x > GATE[1] + 1.6) { spike(x, WALL[3] + 1.4, q++); spike(x + .4, WALL[3] + 2.1, q++); }
    for (let y = WALL[1]; y <= WALL[3] + 1; y += .8) { spike(WALL[2] + 1.4, y, q++); spike(WALL[0] - 1.4, y, q++); }
    for (const [x, y] of [[WALL[0] - .5, WALL[3] + .8], [WALL[2] + .6, WALL[3] + .8], [GATE[0] - 2.6, WALL[3] + 1.6], [GATE[1] + 1.4, WALL[3] + 1.6]]) { block(x - .6, y - .6, 1.6, 1.2);
      add(x + y + 1, () => { S.E = 0; for (let k = 0; k < 7; k++) box(x - .6 + hs(k, 3) * .8, y - .6 + hs(k, 4) * .6, (k >> 1) * 3, .6 + hs(k, 5) * .9, .5 + hs(k, 6) * .5, 3 + hs(k, 7) * 3, [[120, 96, 66], [110, 104, 96], [90, 72, 50]][k % 3], [[100, 80, 56], [96, 90, 84], [76, 60, 42]][k % 3], [[80, 64, 44], [80, 76, 70], [62, 48, 34]][k % 3]); }); }
    drawAll(); }
  OFF('WELL');
  // ---- the square: the well, the workshop and its scaffold, the pyre, the dead cart (the gallows is the game's own, at MAP.gibbet)
  { light(24, 21, 10, 110, 1.0); block(23, 20, 2, 2); block(26.6, 29.2, 3.3, 1.5);
    add(24 + 21 + 2, () => { S.E = 0; box(23, 20, 0, 2, 2, 8, (u, v) => (u > 4 && u < 16 && v > 4 && v < 16) ? [12, 16, 16] : [150, 140, 120], (u, z) => stone(u, z, [[176, 164, 140], [160, 146, 120], [140, 126, 104]], 6, 3), (u, z) => sh(stone(u, z, GRY, 6, 3), .6)); box(23.1, 20.9, 8, .25, .25, 16, TIM, TIM, TIMD); box(24.65, 20.9, 8, .25, .25, 16, TIM, TIM, TIMD); box(22.9, 20.5, 24, 2.2, 1.1, 3, thatch, thatch, sh([112, 96, 58], .5)); });
  OFF('SHOP');
    // the workshop: a scaffold of poles over the timber, a sawhorse, a hoist
    add(28 + 30 + 4, () => { S.E = 0; for (const [x, y] of [[26, 28.4], [30, 28.4], [26, 31.6], [30, 31.6]]) box(x, y, 0, .25, .25, 46, TIM, TIM, TIMD); for (const z of [20, 44]) { box(26, 28.4, z, 4.25, .25, 2, TIMD, TIMD, TIMD); box(26, 31.6, z, 4.25, .25, 2, TIMD, TIMD, TIMD); box(26, 28.4, z, .25, 3.45, 2, TIMD, TIMD, TIMD); box(30, 28.4, z, .25, 3.45, 2, TIMD, TIMD, TIMD); }
      box(26.2, 28.6, 22, 3.9, 3.1, 1, [140, 112, 78], TIM, TIMD); for (const [x, y, h] of [[26.6, 29.2, 0], [26.6, 30, 0], [26.9, 29.6, 3]]) box(x, y, h, 3, .7, 3, [118, 90, 60], (u, v) => sh([150, 120, 80], .9), (u, z) => (Math.hypot((u % 7) - 3.5, z - 1.5) < 1.4 ? [170, 140, 96] : [96, 72, 48])); });
    light(28, 30, 8, 60, .7); lamp(31.2, 28.2, 60, .7);
  OFF('PYRE');
    // the pyre, the dead cart, the gallows
    light(19.5, 36.5, 8, 120, 1.15); block(18.3, 35.3, 2.4, 2.4);
    add(19.5 + 36.5 + 2, () => { S.E = 0; for (const [dx, dy, w, d, h] of [[-1.2, -.3, 2.6, .5, 3], [-.3, -1.2, .5, 2.6, 3], [-1, .3, 2.2, .5, 5], [.3, -1, .5, 2.2, 5]]) box(19.5 + dx, 36.5 + dy, h - 3, w, d, 3, [70, 50, 36], [50, 36, 28], [36, 26, 22]); const [sx, sy] = iso(19.5, 36.5, 6); S.E = 1; for (let j = 0; j < 28; j++) { const w = (j < 8 ? 7 : 7 - (j - 8) * .34) + Math.sin(j * 1.3) * 1.2; for (let i = -w; i <= w; i++) { const t2 = j / 28 + Math.abs(i) / 11 + (hs(i | 0, j + T * 17) - .5) * .3; px(sx + i + Math.sin(j * .5 + PH) * 1.5, sy - j, t2 < .3 ? [255, 240, 170] : t2 < .55 ? [255, 190, 80] : t2 < .8 ? [240, 120, 50] : [170, 60, 40]); } } S.E = 0; smoke(sx, sy - 26, 64, [130, 122, 112]); });
  OFF('CART');
    block(36, 36.5, 3.6, 1.8);
    B(36, 36.5, 5, 3.6, 1.8, 2, [96, 72, 48]); B(36, 36.5, 7, 3.6, .15, 4, [80, 60, 40]); B(36, 38.15, 7, 3.6, .15, 4, [80, 60, 40]);
    add(36 + 3.6 + 36.5 + 1.8 + .2, () => { S.E = 0; for (const [x, y] of [[36.6, 38.4], [38.8, 38.4]]) { const [sx, sy] = iso(x, y, 4); for (let a = 0; a < 6.3; a += .12) { px(sx + Math.cos(a) * 5, sy - Math.sin(a) * 5, [60, 46, 34]); } for (let q = -4; q <= 4; q++) { px(sx + q, sy, [70, 54, 38]); px(sx, sy + q, [70, 54, 38]); } } for (const [x, y, c] of [[36.5, 36.9, [176, 168, 150]], [37.7, 37.3, [150, 144, 126]], [38.6, 36.8, [166, 156, 136]]]) { const [sx, sy] = iso(x, y, 7); for (let i = -4; i <= 6; i++) for (let j = 0; j < 4 - Math.abs(i - 1) * .4; j++) px(sx + i + j, sy + i * .5 - j, sh(c, .65 + j * .1)); } });
    OFF(null); for (const [x, y, h] of L.lamps) lamp(x, y, h || 70, .75);
    for (const [x, y] of L.dead || []) deadTree(x, y, 5, 30);
    for (const [x, y, k] of L.trees) { tree(x, y, k); block(x - .4, y - .4, .8, .8); }
  OFF('GDN');
    const GDN = [40, 33.5, 42.6, 38.2];
    // the garden: rows of something gone to rot, a stick fence, the scarecrow in a coat with a sack for a head
    for (let x = GDN[0]; x <= GDN[2]; x += .7) { const xx = x; add(xx + GDN[3] + .2, () => { S.E = 0; box(xx, GDN[3] - .1, 0, .15, .15, 7, TIMD, TIMD, TIMD); }); }
    add(41.2 + 35.6 + 1, () => { S.E = 0; box(41.15, 35.55, 0, .2, .2, 34, TIM, TIM, TIMD); box(40.2, 35.55, 26, 2.1, .2, .4, TIM, TIM, TIMD); box(40.7, 35.35, 14, 1.1, .6, 13, [70, 56, 46], [60, 48, 40], [48, 38, 32]); for (const s of [-1, 1]) box(41.2 + s * .9 - .3, 35.4, 22, .6, .5, 4, [70, 56, 46], [60, 48, 40], [48, 38, 32]);
      const [hx, hy] = iso(41.25, 35.65, 31); for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j < 18) px(hx + i, hy + j, sh([150, 128, 90], .7 + (i + j) * .02)); px(hx - 1, hy - 1, [20, 16, 14]); px(hx + 2, hy - 1, [20, 16, 14]); for (let i = -1; i <= 2; i++) px(hx + i, hy + 2, [30, 20, 16]); });
    drawAll(); }
  OFF('null');
  // moonlight through the gaps over each clearing, so the places can be found by day and seen a little
  for (const q of M.pois) light(q.x, q.y, 60, q.r * 40, L.d2n ? .6 : 1.1, [.75, .88, 1]);
  for (const [a, b] of M.paths) for (let t2 = .25; t2 < 1; t2 += .5) light(a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2, 60, 90, L.d2n ? .35 : .7, [.75, .88, 1]);
  // ---- the woods: the old farm, the hunter's hut, the woodcutters' camp, the plague pit, the old shrine, the wreck
  { const ruin = (x, y, w, d, s) => { for (let i = 0; i < w; i += .5) { if (hs(i * 3 + s, 9) < .25) continue; const h = 4 + hs(i * 7 + s, 3) * 18; low(x + i, y, .5, .5, h, STN, [120, 112, 100]); block(x + i, y, .5, .5); } for (let j = .5; j < d; j += .5) { if (hs(j * 5 + s, 8) < .25) continue; const h = 4 + hs(j * 9 + s, 5) * 14; low(x, y + j, .5, .5, h, STN, [120, 112, 100]); block(x, y + j, .5, .5); } };
    ruin(7.4, 48, 5, 3.6, 1); for (let x = 12.4; x < 13.6; x += .5) { const xx = x; add(xx + 51.6, () => { S.E = 0; box(xx, 51.4, 0, .15, .15, 8, TIMD, TIMD, TIMD); }); }   // the farmhouse, fallen in
    add(9.5 + 51 + 1, () => { S.E = 0; box(9, 51.2, 0, 2.4, .5, 3, [80, 64, 46], TIM, TIMD); box(10.9, 51, 0, .3, .9, 5, TIMD, TIMD, TIMD); });
    add(38.5 + 51 + 2, () => { S.E = 0; for (const [dx, dy] of [[-1.2, -1], [1.2, -1], [-1.2, .4], [1.2, .4]]) box(38.5 + dx, 51 + dy, 0, .25, .25, dy < 0 ? 26 : 14, TIM, TIM, TIMD); box(37.1, 49.8, 14, 2.9, 1.8, 2, shingle, shingle, (u, z) => sh(shingle(u, z), .6));   // the lean-to
      box(37.4, 52.6, 0, .2, .2, 18, TIMD, TIMD, TIMD); box(39.4, 52.6, 0, .2, .2, 18, TIMD, TIMD, TIMD); box(37.4, 52.6, 16, 2.2, .15, .6, TIMD, TIMD, TIMD); box(37.9, 52.62, 6, 1.2, .1, 9, [150, 128, 96], [130, 110, 84], [110, 92, 70]); });   // a hide stretched to dry
    block(37.2, 49.9, 2.7, .9);
    for (const [x, y, n] of [[21.6, 56, 4], [26.4, 58.4, 5], [22.8, 59.6, 3]]) { block(x - .2, y - .2, 2.6, .9); add(x + y + 2, () => { S.E = 0; for (let i = 0; i < n; i++) box(x + (i % 2) * .2, y + (i % 3) * .08, (i >> 1) * 3, 2.4, .7, 3, [92, 72, 50], (u, v) => sh([126, 102, 72], .9), (u, z) => Math.hypot((u % 7) - 3.5, z - 1.5) < 1.4 ? [150, 124, 88] : [74, 58, 40]); }); }   // log piles
    for (const [x, y] of [[25.6, 56.2], [20.8, 58.6], [24.6, 60.6], [27.8, 56.8]]) add(x + y + .2, () => { S.E = 0; box(x - .3, y - .3, 0, .6, .6, 3, [150, 124, 88], [88, 70, 50], [70, 56, 40]); });   // stumps
    add(25.6 + 56.2 + .5, () => { S.E = 0; box(25.55, 56.15, 3, .1, .1, 6, TIM, TIM, TIMD); box(25.3, 56.15, 8, .5, .1, 1.2, [160, 160, 166], [140, 140, 146], [120, 120, 126]); });   // an axe left in a stump
    light(24, 57.5, 4, 40, .5); add(24 + 57.5 + .3, () => { S.E = 1; const [sx, sy] = iso(24, 57.5, 1); for (let i = -3; i <= 3; i++) for (let j = 0; j < 2; j++) px(sx + i, sy - j, [190, 70, 30]); S.E = 0; smoke(sx, sy - 2, 30, [90, 92, 86]); });   // a fire gone to embers
    for (const [x, y] of [[10.2, 61.4], [11.6, 66.6], [15, 62.4], [14.4, 66.2], [9.6, 64.8]]) add(x + y + .3, () => { S.E = 0; const [sx, sy] = iso(x, y); for (let j = 1; j < 13; j++) { px(sx, sy - j, [96, 76, 52]); px(sx + 1, sy - j, [70, 54, 36]); } for (let i = -3; i <= 4; i++) { px(sx + i, sy - 9, [96, 76, 52]); px(sx + i, sy - 8, [70, 54, 36]); } });   // crosses by the pit
    add(36.5 + 63 + .5, () => { S.E = 0; box(36.4, 62.4, 0, .3, .3, 20, TIM, TIM, TIMD); box(35.9, 62, 20, 1.3, 1.1, 8, [80, 64, 48], [70, 56, 42], [56, 44, 34]); box(35.7, 61.8, 28, 1.7, 1.5, 2, shingle, shingle, shingle); }); candle(36.6, 62.6, 21, 30, .5); block(35.9, 62, 1.3, 1.1);
    add(26 + 67.5 + 2, () => { S.E = 0; box(24.8, 66.6, 0, 3, 1.5, 3, [70, 54, 38], [80, 62, 44], [60, 46, 32]); const [sx, sy] = iso(26, 68.2, 5); for (let a = 0; a < 6.3; a += .12) px(sx + Math.cos(a) * 6, sy - Math.sin(a) * 3, [50, 40, 30]); }); block(24.8, 66.6, 3, 1.5);
    for (const [x, y] of [[34, 65.6], [18, 52.4], [30.4, 49.6], [6, 56]]) add(x + y, () => { S.E = 0; const [sx, sy] = iso(x, y); for (let i = -3; i <= 3; i++) px(sx + i, sy, [190, 184, 166]); px(sx - 4, sy - 1, [190, 184, 166]); px(sx + 4, sy - 1, [190, 184, 166]); for (let i = -1; i <= 1; i++) px(sx + 7 + i, sy - 2, [200, 194, 176]); });   // bones in the ferns
    drawAll(); }
  return { canvas: finish(), e };
};
  MAPS[key].scene = scene;
};
