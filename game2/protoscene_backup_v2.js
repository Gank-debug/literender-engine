// Monastery for the prototype: six rooms joined by doors, a cloister yard, snow outside. Drawn without people;
// the game draws them live. Exports the room plan so the game and the art share one source of truth.
window.PLAN = {
  rooms: { tower: { r: [0, 0, 8, 8], name: 'Bell Tower' }, chapel: { r: [8, 0, 24, 10], name: 'Chapel' }, script: { r: [24, 0, 32, 10], name: 'Scriptorium' },
    refect: { r: [0, 8, 8, 18], name: 'Refectory' }, dorm: { r: [0, 18, 8, 28], name: 'Dormitory' }, yard: { r: [8, 10, 32, 28], name: 'Cloister', out: 1 } },
  // wall lines with door gaps: [x0, y0, x1, y1, [doorFrom, doorTo]...]
  walls: [[8, 0, 8, 28, [3, 4.6], [12, 13.6], [22, 23.6]], [0, 8, 8, 8, [3, 4.6]], [0, 18, 8, 18, [3, 4.6]], [8, 10, 32, 10, [15, 16.6], [27, 28.6]], [24, 0, 24, 10, [6, 7.6]], [0, 28, 8, 28], [32, 0, 32, 10]],
  furn: [], spots: {}, bounds: [0.35, 0.35, 31.65, 27.65] };
window.SCENE_P = function (t = 0, N = 4) {
  const P = PLAN; P.furn = [];
  const e = ENG({ W: 720, H: 520, ox: 350, oy: 170, K: 1, t, N, noVig: 1, noWeather: 1, amb: { in: [.2, .19, .25], out: [.21, .28, .46] } });
  const { T, PH, smoke, S, px, dark, hs, vn, sh, mix, iso, box, stone, TIM, TIMD, GRY, STN, light, add, B, candle, stand, drawAll, backN, backW, low, ground, D, finish } = e;
  const R = k => P.rooms[k].r, PL = [196, 184, 158], TIL = [[112, 60, 48], [124, 72, 60], [130, 80, 68]], SNOW = [226, 234, 246], WH = 74;
  const GLS = [[176, 46, 44], [48, 80, 160], [214, 164, 60], [58, 124, 86], [128, 60, 140], [200, 210, 230]];
  const block = (x, y, w, d) => P.furn.push([x, y, w, d]);
  const plaster = (u, z) => { const g = vn(u / 13 + 7, z / 9), grime = .74 + vn(u / 31, z / 17 + 3) * .32; let c;
    if (z < 13) c = sh(stone(u, z, STN, 10, 4), .9); else if (z >= WH - 4) c = Math.floor(z) === WH - 4 ? sh(TIMD, .7) : sh(TIM, .9 - (Math.floor(u) % 4 === 0 ? .1 : 0)); else if (g > .66) c = sh(stone(u, z, STN, 10, 4), .8); else if (g > .62) c = sh(PL, .62);
    else { c = sh(PL, grime * (.97 + hs(Math.floor(u), Math.floor(z)) * .05)); if (z < 22) c = sh(c, .78 + (z - 13) * .02); if (z > WH - 12) c = sh(c, .8); if (hs(Math.floor(u / 2), 7) < .08 && z < WH - 8 && z > WH - 8 - hs(Math.floor(u / 2), 3) * 30) c = sh(c, .84); } return c; };
  const towerStone = (u, z) => sh(stone(u, z, GRY), .74 + vn(u / 31, z / 17 + 3) * .32);
  const roofTile = (u, z) => { const r = Math.floor(z / 2); return Math.floor(u + r * 2) % 5 === 0 ? sh(TIL[0], .7) : TIL[(r + Math.floor(hs(Math.floor((u + r * 2) / 5), r) * 2)) % 3]; };
  const glass = (u, z) => ({ u, z, w: 20, h: 44, f: (a, c) => { a |= 0; c |= 0; const lim = c >= 30 ? Math.sqrt(Math.max(0, 196 - (c - 30) * (c - 30))) * .72 : 10; if (Math.abs(a - 9.5) > lim) return null; S.E = 0; if (Math.abs(a - 9.5) > lim - 1.5 || c < 2) return sh(GRY[1], .7); const p = a + c * .5, q = a - c * .5 + 60, rd = Math.hypot(a - 9.5, (c - 24) * .8);
    if (a === 9 || Math.floor(p) % 5 === 0 || Math.floor(q) % 5 === 0 || Math.abs(rd - 5) < .6 || c === 12) return [20, 18, 26]; S.E = .3; if (rd < 5) return sh(GLS[rd < 2.2 ? 2 : 0], .8); if (c < 12) return sh(GLS[1], .7); return sh(GLS[[1, 3, 1, 4, 5, 1, 3][(Math.floor(p / 5) + Math.floor(q / 5) * 3 + u) % 7]], .66); } });
  const inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  const segd = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); };
  const PATHS = [[[8.3, 12.8], [19, 17.6]], [[8.3, 22.8], [19, 17.6]], [[15.8, 10.3], [19, 17.6]], [[27.8, 10.3], [19, 17.6]]];
  const WINX = [11.5, 17, 21.2];
  ground((x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)); let c, r, ef = 0; const wear = .78 + vn(x * .9, y * .9) * .3;
    const flag = (pal, s) => { const X = x / s, Y = y / s + (Math.floor(X) % 2) * .5, ed = (X - Math.floor(X)) < .09 / s || (Y - Math.floor(Y)) < .09 / s; return ed ? sh(pal[2], .55) : sh(pal[Math.floor(hs(Math.floor(X), Math.floor(Y)) * pal.length)], (.9 + n * .1) * wear); };
    const plank = (dk, rot) => { const a = rot ? x : y, b = rot ? y : x, k = Math.floor(a * 2), ed = (a * 2 - k) < .12 || ((b + hs(k, 1) * 3) % 3) < .1; return ed ? sh(TIMD, .6) : sh([[124, 96, 68], [114, 86, 58], [104, 78, 52]][Math.floor(hs(k, 7) * 3)], (.9 + n * .1) * dk * (.75 + vn(x * .8, y * .8) * .35)); };
    if (inR(r = R('chapel'), x, y)) { const X = x - .5, fx = X - Math.floor(X), fy = y - Math.floor(y); c = sh(((Math.floor(X) + Math.floor(y)) % 2 ? [168, 158, 140] : [112, 104, 98]), (.92 + n * .1) * wear); if (fx < .08 || fy < .08) c = sh(c, .6);
      if (y > 4.3 && y < 5.7 && x > 12.5) c = sh((y < 4.5 || y > 5.5) ? [170, 136, 66] : ((Math.floor(x * 2) + Math.floor(y * 5)) % 7 === 0 ? [96, 28, 30] : [124, 36, 38]), (.9 + n * .12) * (.8 + vn(x, y * 3) * .25));
      if (x < 12.4 && x > 8.6 && y > 2.6 && y < 7.4) c = sh(flag(GRY, 1.3), 1.08);
      for (const wx of WINX) { const yy = y - 3.2, cx = wx + 2 + yy * .55, hw = .95 - Math.max(0, yy - 2.2) * .7; if (yy > 0 && yy < 3.5 && Math.abs(x - cx) < hw) { const lu = (x - cx) * 10, lv = yy * 12, pp = lu + lv * .5, qq = lu - lv * .5 + 60; if (!(Math.floor(pp + 100) % 5 === 0 || Math.floor(qq) % 5 === 0)) { c = mix(c, GLS[[1, 3, 1, 4, 5, 1, 0][(Math.floor((pp + 100) / 5) + Math.floor(qq / 5) * 3) % 7]], .42); ef = .42; } } } }
    else if (inR(r = R('script'), x, y)) c = plank(.95, 1); else if (inR(r = R('refect'), x, y)) c = flag(STN, 1.5); else if (inR(r = R('tower'), x, y)) c = flag(GRY, 1.2); else if (inR(r = R('dorm'), x, y)) c = plank(.8, 0);
    if (c) { const ao = Math.min(x - r[0], y - r[1]); return [ao < 1 ? sh(c, .62 + ao * .38) : c, 1, ef]; }
    const drift = vn(x * .5, y * 1.4); c = mix([170, 184, 208], SNOW, drift * .75 + n * .25);
    if (inR(R('yard'), x, y)) { const dp = Math.min(...PATHS.map(([a, b]) => segd(x, y, a, b))), edge = .85 + (vn(x * 1.3, y * 1.3) - .5) * .4; if (dp < edge) { const X = x * 1.25, Y = y * 1.25 + (Math.floor(X) % 2) * .5, ed = (X - Math.floor(X)) < .14 || (Y - Math.floor(Y)) < .14, st = sh(STN[Math.floor(hs(Math.floor(X) + 5, Math.floor(Y)) * 3)], .82 + n * .06); c = ed ? sh(c, .9) : mix(st, c, Math.max(0, Math.min(.85, (dp / edge - .45) * 1.6 + (vn(x * 4, y * 4) - .5) * .5))); } else if (hs(Math.floor(x * 3), Math.floor(y * 6)) < .04) c = sh(c, .86); const ao = Math.min(x - 8, y - 10); if (ao < 1.2) c = sh(c, .6 + ao * .33); }
    return [c, 0]; });
  // trees outside the walls: procedural snowy pines at native pixel size, a forest that fills the snow beyond the walls.
  // Each tree is capped so it never hides floor a brother can walk on behind it (front-edge trees stay small).
  const PINE = window.__pineBig2 || (window.__pineBig2 = {}), pine = (h, k) => { const key = h + ':' + (k % 6); if (PINE[key]) return PINE[key];
    const r = (i, j) => hs(i * 7.13 + k * 31.7 + h, j * 3.71 + k), w = Math.round(h * .56) | 1, hw = w >> 1, a = new Uint8ClampedArray(w * h * 4), tid = new Int8Array(w * h).fill(-1),
      trunkH = Math.max(4, Math.round(h * .08)), crown = h - trunkH, nT = Math.max(4, Math.min(8, Math.round(crown / 15))), tw = h > 80 ? 3 : 2;
    const DK = [16, 30, 30], MD = [26, 50, 44], LT = [40, 74, 58], UN = [11, 21, 23], SN = [226, 234, 246], SS = [150, 166, 196], TR = [[62, 46, 36], [38, 28, 24], [30, 22, 20]];
    const put = (x, y, c, t) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const q = (y * w + x) * 4; a[q] = c[0]; a[q + 1] = c[1]; a[q + 2] = c[2]; a[q + 3] = 255; tid[y * w + x] = t; };
    for (let y = crown - 3; y < h; y++) for (let i = 0; i < tw; i++) put(hw - (tw >> 1) + i, y, TR[i], 99);
    for (let t = nT - 1; t >= 0; t--) { const f = (t + 1) / nT, yt = Math.round(crown * (t / nT) * .78), yb = Math.round(crown * f), R = Math.max(2, (hw - 1) * Math.pow(f, .75) * (.88 + r(t, 1) * .14)), Ht = yb - yt, per = 3 + Math.round(R / 4), ph = r(t, 2) * per;
      for (let y = yt; y <= yb; y++) { const half = R * (y - yt) / Ht;
        for (let x = -Math.ceil(half); x <= Math.ceil(half); x++) { const ax = Math.abs(x); if (ax > half + .4) continue;
          const hem = yb - Math.round(Math.abs(Math.sin((x + ph) * Math.PI / per)) * 2.4) - Math.round((1 - ax / R) * 1.5); if (y > hem) continue;
          let c = x < -half * .3 ? LT : x > half * .35 ? DK : MD; if (y >= hem - 1) c = UN; else if (y >= hem - 3 && x > -half * .5) c = DK; if (r(x * 3, y * 5) < .08) c = c === LT ? MD : DK;
          put(hw + x, y, c, t); } } }
    // snow: a ledge where each tier shows from under the hem above it, and along the top of the crown; brighter on the lit left
    const o = new Uint8ClampedArray(a); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, t = tid[i]; if (t < 0 || t === 99) continue; const up = y ? tid[i - w] : -1, up2 = y > 1 ? tid[i - 2 * w] : -1, dx = x - hw;
      const rel = dx / Math.max(1, hw); let sn = 0; if (up !== t) sn = 1; else if (up2 !== t && rel < .15) sn = 1; if (!sn || rel > .75 || r(x, y + 50) < .12) continue; const c = rel > .2 ? SS : SN, q = i * 4; o[q] = c[0]; o[q + 1] = c[1]; o[q + 2] = c[2]; }
    for (let y = 0; y < h; y++) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (tid[i] >= 0 && tid[i] !== 99) { const q = i * 4; o[q] *= .7; o[q + 1] *= .7; o[q + 2] *= .75; break; } }
    return (PINE[key] = { w, h, ox: -hw, oy: -h + 2, a: o, sc: h / 45 }); };
  const tree = (x, y, k, h = 46, back, tone = 1) => { const tt = pine(h, k), [sx, sy] = iso(x, y), sc = tt.sc, sway = Math.sin(PH + k) * .6 * Math.min(2, sc); S.Z = 0; S.E = 0; S.D = back ? -2e8 : x + y;
    for (let t2 = 0; t2 < 30 * sc; t2++) { const n = Math.max(1, 5 * Math.sqrt(sc)) - t2 * .15 / sc; for (let w = -n; w <= n; w++) dark(sx + t2 * 1.2 + w * .5, sy + t2 * .35 + w * .5, .6); }
    for (let j = 0; j < tt.h; j++) { const s2 = Math.round(sway * Math.max(0, 1 - j / (tt.h * .55))); for (let i = 0; i < tt.w; i++) { const q = (j * tt.w + i) * 4; if (tt.a[q + 3] > 128) px(sx + tt.ox + i + s2, sy + tt.oy + j, tone === 1 ? [tt.a[q], tt.a[q + 1], tt.a[q + 2]] : [tt.a[q] * tone, tt.a[q + 1] * tone, tt.a[q + 2] * (tone * .9 + .1)]); } } };
  // forest: jittered grid outside the walls, cropped to the view
  const FOREST = window.__forestP || (window.__forestP = (() => { const out = [], WK = []; for (let wx = 0; wx <= 32; wx += .5) for (let wy = 0; wy <= 28; wy += .5) WK.push([wx - wy, wx + wy]);
    for (let gx = -40; gx <= 70; gx += 1.6) for (let gy = -40; gy <= 70; gy += 1.6) { const x = gx + (hs(gx * 3.1, gy * 1.7) - .5) * 1.1, y = gy + (hs(gy * 2.3, gx * 4.9) - .5) * 1.1;
      if (x > -1.2 && x < 33.2 && y > -1.2 && y < 29.2) continue; const o0 = Math.max(-1.2 - x, x - 33.2, -1.2 - y, y - 29.2); if (hs(x * 2.7, y * 3.3) < .45 - o0 * .1) continue; if (vn(x * .16 + 40, y * .16) < .2 && o0 > 3) continue; const sx = 350 + (x - y) * 10, sy = 170 + (x + y) * 5; if (sx < -40 || sx > 760 || sy < 20 || sy > 580) continue;
      const out1 = Math.max(-1.2 - x, x - 33.2, -1.2 - y, y - 29.2, 0); let h = Math.round(64 + Math.min(54, out1 * 9) + hs(x * 5, y * 5) * 24);
      let g = 1e9; const d = x - y, s = x + y; for (const [wd, ws] of WK) if (ws < s && Math.abs(wd - d) * 10 < h * .28 + 3) g = Math.min(g, (s - ws) * 5);
      if (g < 1e9) { if (g - 3 < 40) { if (hs(x, y + 11) > .4 || g < 26) continue; h = 40; } else h = Math.min(h, Math.round(g - 3)); }
      out.push([x, y, Math.floor(hs(x * 9, y * 9) * 6), h - h % 2, Math.max(.62, 1 - o0 * .035) * (.92 + hs(x * 4, y * 7) * .16)]); } return out; })());
  // back of the house first (behind the walls), the rest join the depth-sorted draw list with the yard
  const BACK = q => q[0] < -1 || q[1] < -1; FOREST.filter(BACK).sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(([x, y, k, h, tn]) => tree(x, y, k, h, true, tn));
  const snowN = r => box(r[0] - .4, r[1] - .7, WH + 7, r[2] - r[0] + .4, .8, 3, SNOW, SNOW, [170, 184, 208]), snowW = r => box(r[0] - .7, r[1] - .4, WH + 7, .8, r[3] - r[1] + .4, 3, SNOW, SNOW, [170, 184, 208]);
  S.Z = 1;
  // ---- Bell tower
  { const r = R('tower'), TH = 150; backN(r, TH, towerStone, [D.slit(36, 40), D.sconce(60, 30)]); backW(r, TH, towerStone, [D.slit(40, 40)]); light(5.5, .4, 28, 56, .8);
    B(1, 5, 0, 1.4, 1.4, 10, [112, 84, 56]); B(1.3, 5.3, 10, 1, 1, 7, [128, 96, 64]); block(1, 5, 1.4, 1.4); B(5.6, .8, 0, 1.2, 1.2, 9, [112, 84, 56]); block(5.6, .8, 1.2, 1.2);
    add(9.4, () => { const [fx, fy] = iso(4.4, 4.4); for (let j = 0; j < fy - 12; j++) { const sw = Math.sin(PH) * 2 * (j / (fy - 12)) ** 2; px(fx + sw + (j % 9 < 4 ? 0 : 1), j, [150, 134, 100]); } }); drawAll(); }
  // ---- Chapel
  { const r = R('chapel'); backN(r, WH, plaster, [glass(28, 20), D.sconce(52, 30), D.cross(64, 34), glass(83, 20), D.sconce(110, 30), D.cross(120, 34), glass(125 + 0, 20)], roofTile); snowN(r);
    for (const u of [52, 110]) light(8 + u / 10 + .7, .4, 28, 62, .7);
    add(0, () => { S.E = 0; box(8.8, 3, 0, 3.4, 4, 2, (u, v) => sh(stone(u, v, GRY, 12, 12), 1.05), sh(GRY[1], .8), sh(GRY[1], .6)); });
    { const cloth = (u, z) => z > 8 ? [200, 192, 174] : z > 6 ? [150, 118, 54] : (Math.floor(u) % 6 === 3 && z > 2) ? [150, 118, 54] : z < 1 ? [150, 118, 54] : [116, 34, 36]; add(9.4 + 1.5 + 3.7 + 2.6, () => { S.E = 0; box(9.4, 3.7, 2, 1.5, 2.6, 11, (u, v) => (v < 2 || v > 24 || u < 2 || u > 13) ? [150, 118, 54] : sh([188, 180, 162], .94 + hs(Math.floor(u), Math.floor(v)) * .08), (u, z) => sh(cloth(u, z), .8), cloth); }); block(9.4, 3.7, 1.5, 2.6); }
    add(14.5, () => { const [sx, sy] = iso(9.9, 5, 13); S.E = 0; for (let i = -2; i <= 3; i++) px(sx + i, sy, [110, 84, 40]); for (let j = 1; j < 17; j++) { px(sx, sy - j, [206, 166, 76]); px(sx + 1, sy - j, [130, 100, 44]); } for (let i = -4; i <= 5; i++) { px(sx + i, sy - 12, [206, 166, 76]); px(sx + i, sy - 11, [130, 100, 44]); } });
    candle(10, 4, 13, 34, .5); candle(10, 6, 13, 34, .5); stand(9.4, 2.4, 80); stand(9.4, 7.6, 80);
    for (const x of [14, 16, 18, 20]) for (const y of [.9, 6.1]) { B(x, y, 0, .7, 3, 5, [104, 76, 48]); B(x + .58, y, 5, .14, 3, 5, [88, 64, 40]); block(x, y, .7, 3); }
    stand(23.2, 1.2, 60); stand(23.2, 8.6, 60); drawAll(); }
  // ---- Scriptorium
  { const r = R('script'); const BOOK = [[150, 60, 50], [62, 86, 130], [176, 140, 70], [78, 112, 84], [112, 80, 110], [206, 196, 168]];
    backN(r, WH, plaster, [D.shelf(6, 14, 26, 40, BOOK), D.win(40, 28), D.shelf(58, 14, 18, 40, BOOK)], roofTile); snowN(r);
    for (const [x, y] of [[25.4, 3], [27.8, 3], [25.4, 6.2], [27.8, 6.2]]) { B(x, y, 0, 1.2, 1.5, 8, TIM, (u, v) => (u > 3 && u < 9 && v > 4 && v < 11) ? [226, 216, 186] : sh(TIM, 1.12)); block(x, y, 1.2, 1.5); B(x + 1.4, y + .4, 0, .5, .5, 4, TIMD); candle(x + .3, y + .3, 8, 46, .8); }
    B(30.6, 1, 0, .8, .8, 12, TIMD, [226, 216, 186]); block(30.6, 1, .8, .8); drawAll(); }
  // ---- Refectory
  { const r = R('refect'); backW(r, WH, plaster, [D.win(8, 26), D.hearth(34), D.win(80, 26)], roofTile); snowW(r); light(.8, 13.6, 4, 110, 1.2); light(5, 8.4, 30, 40, .5);
    B(3.6, 10, 9, 1.6, 6.4, 2, TIM); for (const [x, y] of [[3.7, 10.1], [4.9, 10.1], [3.7, 16.1], [4.9, 16.1]]) B(x, y, 0, .25, .25, 9, TIMD); B(2.6, 10.3, 0, .6, 5.8, 5, TIMD); B(5.6, 10.3, 0, .6, 5.8, 5, TIMD); block(2.6, 10, 3.6, 6.4);
    for (const y of [10.8, 12.4, 14, 15.6]) add(5 + y + .09, () => { const [sx, sy] = iso(4.4, y, 11); S.E = 0; px(sx, sy, [170, 160, 136]); px(sx + 1, sy, [170, 160, 136]); px(sx - 1, sy, [120, 110, 90]); px(sx, sy - 1, [130, 112, 80]); });
    candle(4.4, 11.6, 11, 46, .8); candle(4.4, 14.8, 11, 46, .8); drawAll(); }
  // ---- Dormitory: cots along the wall
  { const r = R('dorm'); backW(r, WH, plaster, [D.win(14, 30), D.cross(46, 34), D.win(66, 30)], roofTile); snowW(r); light(.5, 23, 30, 50, .45);
    for (const y of [18.8, 21, 23.2, 25.4]) { B(.5, y, 0, 2.6, 1.3, 4, TIMD, (u, v) => u < 6 ? [190, 182, 160] : sh([96, 84, 70], .85 + hs(u | 0, v | 0) * .15)); block(.5, y, 2.6, 1.3); }
    B(5.8, 26.4, 0, 1.4, .9, 5, [104, 78, 50], (u, v) => Math.floor(u) === 7 ? [190, 150, 70] : [124, 94, 60]); block(5.8, 26.4, 1.4, .9); candle(6.4, 26.8, 5, 50, .7); drawAll(); }
  // ---- inner walls with door gaps, door posts either side
  for (const [x0, y0, x1, y1, ...doors] of P.walls) { const vert = x0 === x1, a0 = vert ? y0 : x0, a1 = vert ? y1 : x1, cuts = [a0]; doors.forEach(d => cuts.push(d[0], d[1])); cuts.push(a1);
    for (let i = 0; i < cuts.length; i += 2) { const s0 = cuts[i], s1 = cuts[i + 1]; if (s1 - s0 < .05) continue; if (vert) low(x0 - .2, s0, .4, s1 - s0, 9); else low(s0, y0 - .2, s1 - s0, .4, 9); }
    for (const d of doors) for (const q of d) { S.E = 0; if (vert) box(x0 - .3, q - .3 + (q === d[1] ? .3 : 0), 0, .6, .3, 20, [150, 140, 124], (u, z) => sh(stone(u, z, STN, 6, 4), .7), (u, z) => sh(stone(u, z, STN, 6, 4), .5)); else box(q - .3 + (q === d[1] ? .3 : 0), y0 - .3, 0, .3, .6, 20, [150, 140, 124], (u, z) => sh(stone(u, z, STN, 6, 4), .7), (u, z) => sh(stone(u, z, STN, 6, 4), .5)); } }
  // ---- the cloister yard
  S.Z = 0;
  { light(13.6, 15.4, 7, 84, 1.1);
    add(19 + 17.6 + 2, () => { S.E = 0; box(18, 16.6, 0, 2, 2, 8, (u, v) => (u > 4 && u < 16 && v > 4 && v < 16) ? [10, 14, 30] : SNOW, (u, z) => stone(u, z, GRY, 6, 3), (u, z) => sh(stone(u, z, GRY, 6, 3), .6)); box(18.1, 17.5, 8, .25, .25, 16, TIM, TIM, TIMD); box(19.65, 17.5, 8, .25, .25, 16, TIM, TIM, TIMD); box(17.9, 17.1, 24, 2.2, 1.1, 4, SNOW, roofTile, sh(TIL[0], .6)); }); block(18, 16.6, 2, 2);
    for (const [x, y] of [[25.6, 21.4], [27.3, 21.7], [29, 21.3], [26, 25], [28, 25.4], [24.4, 24.4]]) { block(x - .5, y, 1.3, .7); add(x + y + .5, () => { S.E = 0; box(x - .5, y, 0, 1.3, .7, 2, SNOW, [190, 200, 220], [160, 172, 196]); const [sx, sy] = iso(x, y + .2); for (let q = 0; q < 14; q++) dark(sx + q, sy + q * .3, .6); for (let j = 1; j < 14; j++) { px(sx, sy - j, GRY[1]); px(sx + 1, sy - j, sh(GRY[1], .6)); } for (let i = -3; i <= 4; i++) { px(sx + i, sy - 10, GRY[3]); px(sx + i, sy - 9, sh(GRY[1], .6)); } for (const i of [-3, -2, 3, 4]) px(sx + i, sy - 11, SNOW); }); }
    add(13.6 + 15.4 + 1.6, () => { S.E = 0; box(13.2, 15, 0, .8, .8, 7, [40, 34, 32], [56, 50, 50], [36, 32, 32]); const [sx, sy] = iso(13.6, 15.4, 7); S.E = 1; for (let k = 0; k < 9; k++) { const i = Math.round((hs(k, T) - .5) * 3), j = -Math.floor(hs(k + 9, T) * 4); px(sx + i, sy + j, j < -2 ? [206, 84, 44] : j < -1 ? [246, 156, 62] : [255, 214, 120]); } S.E = 0; }); block(13.2, 15, .8, .8);
    for (const [x, y, k, h, tn] of FOREST) if (!(x < -1 || y < -1)) add(x + y, () => tree(x, y, k, h, false, tn));
    for (const [x, y, k] of [[10.4, 26.8, 2], [30.6, 13.4, 3]]) add(x + y, () => tree(x, y, k, 52));
    block(10, 26.4, 1, 1); block(30.2, 13, 1, 1); drawAll(); }
  return { canvas: finish(), e };
};

// the monastery as a map: the game reads its layout, view, weather and set-piece positions from here
window.MAPS = window.MAPS || {};
MAPS.monastery = { key: 'monastery', name: 'The Monastery', size: [32, 28], view: { W: 720, H: 520, ox: 350, oy: 170 }, weather: 'snow', print: [70, 84, 120],
  gibbet: [23.2, 19.4], gather: [15.5, 5], hangFrom: [16.4, 12.6], center: [15, 13], drift: [7, 6], complineCam: [10, 16], plan: PLAN, scene: (t, N) => SCENE_P(t, N) };
MAPS.monastery.monRoles = { infirm: 'Infirmarer', tracker: 'Tracker', archiv: 'Archivist', confess: 'Confessor', cellar: 'Cellarer', novice: 'Novice', precent: 'Precentor', prior: 'Prior', penit: 'Penitent', scribe: 'Scribe', sacrist: 'Sacristan' };
