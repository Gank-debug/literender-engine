// Lords of the Isle, drawn the way the monastery is: 2.5D pixel iso, low light, firelit villages, shaded figures.
window.SCENE_ISLE = function (mood = 'dusk') {
  const M = { dusk: { amb: { in: [.58, .5, .58], out: [.58, .5, .58] }, fog: [70, 76, 104], fogMax: .1 }, night: { amb: { in: [.3, .32, .5], out: [.3, .32, .5] }, fog: [30, 40, 70], fogMax: .1 } }[mood];
  const e = ENG({ W: 720, H: 470, ox: 345, oy: 75, K: 2, t: 0, N: 4, amb: M.amb, fog: M.fog, fogMax: M.fogMax });
  const { S, px, dark, hs, vn, sh, mix, iso, box, stone, TIM, TIMD, GRY, STN, light, add, B, fig, drawAll, ground, finish, W, H } = e;
  const F = 1.6, R = 4.3 * F, S3 = Math.sqrt(3), C0 = [15, 15];
  const hexW = (q, r) => [C0[0] + R * S3 * (q + r / 2), C0[1] + R * 1.5 * r];
  const toHex = (x, y) => { x -= C0[0]; y -= C0[1]; let q = (S3 / 3 * x - y / 3) / R, r = (2 / 3 * y) / R, s = -q - r; let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s); const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s); if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs; return [rq, rr]; };
  // the island: 19 tiles
  const T = {}, put = (q, r, k, n) => T[q + ',' + r] = { q, r, k, n, c: hexW(q, r) };
  [[0, -2, 'forest', 9], [1, -2, 'field', 6], [2, -2, 'pasture', 4], [-1, -1, 'hill', 5], [0, -1, 'forest', 8], [1, -1, 'mountain', 10], [2, -1, 'field', 11], [-2, 0, 'pasture', 3], [-1, 0, 'field', 8], [0, 0, 'desert', 0], [1, 0, 'forest', 5], [2, 0, 'hill', 9], [-2, 1, 'mountain', 6], [-1, 1, 'pasture', 10], [0, 1, 'hill', 4], [1, 1, 'pasture', 12], [-2, 2, 'forest', 2], [-1, 2, 'field', 3], [0, 2, 'mountain', 11]].forEach(a => put(...a));
  const tileAt = (x, y) => T[toHex(x, y).join(',')];
  const corner = (t, i) => { const a = Math.PI / 180 * (60 * i - 30); return [t.c[0] + R * Math.cos(a), t.c[1] + R * Math.sin(a)]; };
  const segd = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); };
  const COL = { red: [176, 52, 46], blue: [56, 100, 170], gold: [200, 160, 60] };
  // roads along hex edges: [tile, cornerA, cornerB, owner]
  const RD = [[T['0,-1'], 1, 2, 'red'], [T['0,-1'], 2, 3, 'red'], [T['-1,0'], 0, 1, 'red'], [T['1,0'], 3, 4, 'blue'], [T['1,0'], 4, 5, 'blue'], [T['-1,1'], 5, 0, 'gold'], [T['0,1'], 3, 4, 'gold']].map(([t, a, b, o]) => [corner(t, a), corner(t, b), o]);
  const isleD = (x, y) => { let m = 1e9; for (const k in T) m = Math.min(m, Math.hypot(x - T[k].c[0], y - T[k].c[1])); return m; };
  ground((x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)), t = tileAt(x, y);
    if (!t) { const d = isleD(x, y) - R * .95; let c = mix([14, 26, 48], [26, 46, 72], vn(x * .25, y * .25)); const q = vn((x - y) * 1.2, (x + y) * 2.6); if (q > .82) c = mix(c, [90, 120, 150], .5); if (d < 1.4) c = mix(c, [40, 92, 104], 1 - d / 1.4); if (d < .5 && vn(x * 3, y * 3) > .4) c = mix(c, [170, 196, 200], .5); if (d < .15) c = [150, 140, 110]; return [c, 0]; }
    const ed = Math.min(...[0, 1, 2, 3, 4, 5].map(i => segd(x, y, corner(t, i), corner(t, (i + 1) % 6))));
    let c, wear = .85 + vn(x * .8, y * .8) * .25;
    const coast = isleD(x, y) > 0 && !(['1,0'].includes('')) ? 0 : 0;
    if (t.k === 'forest') c = sh(mix([44, 70, 40], [60, 86, 46], vn(x * 1.4, y * 1.4)), .9 + n * .1);
    else if (t.k === 'field') { const row = Math.floor((x + y * .5) * 2.2) % 2; c = sh(row ? [176, 140, 64] : [150, 116, 50], (.9 + n * .12) * wear); }
    else if (t.k === 'pasture') c = sh(mix([84, 120, 58], [104, 138, 64], vn(x * 1.2, y * 1.2)), .92 + n * .1);
    else if (t.k === 'hill') c = sh(mix([132, 76, 50], [150, 92, 60], vn(x * 1.3, y * 1.3)), (.9 + n * .1) * wear);
    else if (t.k === 'mountain') c = sh(mix([90, 88, 92], [112, 108, 106], vn(x * 1.5, y * 1.5)), .88 + n * .12);
    else c = sh(mix([186, 160, 112], [200, 178, 128], vn(x * .9, y * .9)), .92 + n * .1);
    // a rim of beach where the land meets the sea
    let sea = 1e9; for (const i of [0, 1, 2, 3, 4, 5]) { const a = Math.PI / 180 * (60 * i), nb = toHex(t.c[0] + Math.cos(a) * R * S3, t.c[1] + Math.sin(a) * R * S3); if (!T[nb.join(',')]) sea = Math.min(sea, segd(x, y, corner(t, (i + 0) % 6), corner(t, (i + 1) % 6))); }
    if (sea < .8 + vn(x * 2, y * 2) * .4) c = mix([178, 160, 118], [196, 180, 138], n);
    else if (ed < .12) c = sh(c, .72);
    // roads
    for (const [a, b, o] of RD) { const d = segd(x, y, a, b); if (d < .62) { c = d < .45 ? sh(mix([118, 100, 78], COL[o], .22), .85 + n * .25) : sh(c, .7); if (d < .45 && hs(Math.floor(x * 5), Math.floor(y * 5)) < .25) c = sh(c, 1.25); } }
    // number tokens
    if (t.n) { const d = Math.hypot(x - t.c[0], y - t.c[1]); if (d < 1.6) c = d > 1.42 ? [40, 32, 26] : d > 1.22 ? [150, 118, 60] : sh([218, 204, 168], .95 + n * .05); }
    return [c, 0]; });
  // ---- things on the tiles
  const TRE = window.__isleTrees || (window.__isleTrees = TREES.map(sp => { const o = new Uint8ClampedArray(sp.data); for (let i = 0; i < o.length; i += 4) { o[i] *= .78; o[i + 1] *= .84; o[i + 2] *= .8; } return { sp, a: o }; }));
  const tree = (x, y, k) => add(x + y, () => { const tt = TRE[((k % TRE.length) + TRE.length) % TRE.length], [sx, sy] = iso(x, y); S.E = 0; for (let q = 0; q < 26; q++) for (let w = -4 + q * .15; w <= 4 - q * .15; w++) dark(sx + q * 1.1 + w * .5, sy + q * .32 + w * .5, .6); for (let j = 0; j < tt.sp.h; j++) for (let i = 0; i < tt.sp.w; i++) { const q = (j * tt.sp.w + i) * 4; if (tt.a[q + 3] > 128) px(sx + tt.sp.ox + i, sy + tt.sp.oy + j, [tt.a[q], tt.a[q + 1], tt.a[q + 2]]); } });
  const inTile = (t, k, avoid = 1.4) => { for (let g = 0; g < 40; g++) { const a = hs(k, g + t.q * 7) * 6.283, r = Math.sqrt(hs(g, k + t.r * 5)) * R * .78, x = t.c[0] + Math.cos(a) * r, y = t.c[1] + Math.sin(a) * r; if (Math.hypot(x - t.c[0], y - t.c[1]) > avoid && tileAt(x, y) === t) return [x, y]; } return [t.c[0] + 2, t.c[1]]; };
  for (const k in T) { const t = T[k];
    if (t.k === 'forest') for (let i = 0; i < 26; i++) { const [x, y] = inTile(t, i, 2); tree(x, y, i + t.q * 3); }
    if (t.k === 'mountain') for (let i = 0; i < 7; i++) { const [x, y] = inTile(t, i, 2.2), h = 16 + hs(i, t.r) * 26, w = 2 + hs(i, 3) * 1.6; add(x + y + w, () => { S.E = 0; for (let s = 0; s < 4; s++) { const f = 1 - s * .24; box(x + w * (1 - f) / 2, y + w * (1 - f) / 2, s * h / 4, w * f, w * f, h / 4, s === 3 ? [214, 220, 228] : (u, v) => sh(stone(u, v, GRY, 7, 7), 1.05), (u, z) => sh(stone(u, z, GRY, 6, 4), .8), (u, z) => sh(stone(u, z, GRY, 6, 4), .58)); } }, () => e.shadow(x, y, w, w, h)); }
    if (t.k === 'field') for (let i = 0; i < 7; i++) { const [x, y] = inTile(t, i + 9, 2); B(x, y, 0, .8, .8, 6, [190, 156, 70], [214, 182, 96]); }
    if (t.k === 'pasture') { for (let i = 0; i < 7; i++) { const [x, y] = inTile(t, i + 3, 2); add(x + y + .6, () => { S.E = 0; box(x, y, 1.4, 1.1, .6, 3.6, [226, 222, 210], [200, 196, 186], [160, 156, 150]); box(x + 1.1, y + .15, 3, .35, .3, 2.2, [40, 36, 34], [40, 36, 34], [30, 28, 28]); for (const [a, b] of [[.15, .08], [.85, .08], [.15, .45], [.85, .45]]) box(x + a, y + b, 0, .12, .12, 1.4, [40, 36, 34], [40, 36, 34], [30, 28, 28]); }); }
      for (let i = 0; i < 6; i++) { const a = corner(t, 3), b = corner(t, 4), x = a[0] + (b[0] - a[0]) * (i / 6) * .8 + .5, y = a[1] + (b[1] - a[1]) * (i / 6) * .8 + .3; B(x, y, 0, .12, .12, 4, TIMD); } }
    if (t.k === 'hill') for (let i = 0; i < 3; i++) { const [x, y] = inTile(t, i + 5); B(x, y, 0, 1.5, 1, 4, [150, 70, 50], (u, v) => (Math.floor(u) + Math.floor(v / 2)) % 3 ? [170, 84, 58] : [120, 56, 40]); }
    if (t.k === 'desert') for (let i = 0; i < 3; i++) { const [x, y] = inTile(t, i + 2); B(x, y, 0, .5, .5, 3, [120, 112, 96]); }
  }
  drawAll();
  // ---- settlements at hex corners, lit from inside
  const house = (x, y, o, rot) => { const w = rot ? 2.4 : 3.4, d = rot ? 3.4 : 2.4, wl = (u, z) => { if (z < 4) return sh(stone(u, z, STN, 6, 3), .85); if (z > 15) return TIMD; const lw = (Math.floor(u) % 9 >= 3 && Math.floor(u) % 9 <= 5) && z > 6 && z < 11; if (lw) { S.E = 1; return z > 5.5 ? [255, 214, 130] : [250, 170, 70]; } S.E = 0; return (Math.floor(u) % 7 === 0) ? TIMD : sh([196, 184, 158], .85 + hs(Math.floor(u), Math.floor(z)) * .08); };
    light(x + w / 2, y + d / 2, 8, 80, .95);
    add(x + w + y + d, () => { S.E = 0; box(x, y, 0, w, d, 16, TIMD, wl, (u, z) => { const c = wl(u, z); return S.E ? c : sh(c, .72); }); for (let s = 0; s < 4; s++) { const k = s * .28; box(x - .2 + (rot ? 0 : k * 1.6), y - .2 + (rot ? k * 1.6 : 0), 16 + s * 3.4, w + .4 - (rot ? 0 : 3.2 * k), d + .4 - (rot ? 3.2 * k : 0), 3.4, s === 3 ? [70, 40, 34] : [124, 72, 60], (u, z) => Math.floor(u) % 3 ? [112, 60, 48] : [90, 48, 40], (u, z) => [80, 42, 34]); }
      const [fx, fy] = iso(x + w + .3, y + d * .2); for (let j = 0; j < 34; j++) px(fx, fy - j, [60, 50, 40]); S.E = 0; for (let j = 0; j < 6; j++) for (let i = 1; i < 9; i++) px(fx + i, fy - 33 + j + Math.round(Math.sin(i * .7) * .8), sh(COL[o], j === 0 ? 1.15 : j === 5 ? .7 : 1)); }, () => e.shadow(x, y, w, d, 26)); };
  const keep = (x, y, o) => { light(x + 1, y + 1, 26, 70, 1); add(x + y + 4, () => { S.E = 0; const wl = (u, z) => { if ((Math.floor(z) === 22 || Math.floor(z) === 23 || Math.floor(z) === 40 || Math.floor(z) === 41) && Math.floor(u) % 8 > 5) { S.E = 1; return [255, 200, 110]; } S.E = 0; return sh(stone(u, z, GRY, 7, 4), .95); }; box(x, y, 0, 3.4, 3.4, 52, [90, 88, 90], wl, (u, z) => { const c = wl(u, z); return S.E ? c : sh(c, .72); }); for (const [a, b] of [[0, 0], [2.4, 0], [0, 2.4], [2.4, 2.4], [1.2, 0], [0, 1.2]]) box(x + a, y + b, 52, 1, 1, 6, [110, 108, 110], (u, z) => stone(u, z, GRY, 5, 3), (u, z) => sh(stone(u, z, GRY, 5, 3), .7)); const [fx, fy] = iso(x + 1.7, y + 1.7, 58); for (let j = 0; j < 16; j++) px(fx, fy - j, [60, 50, 40]); for (let j = 0; j < 7; j++) for (let i = 1; i < 11; i++) px(fx + i, fy - 15 + j + Math.round(Math.sin(i * .6) * .8), sh(COL[o], j === 0 ? 1.15 : j === 6 ? .7 : 1)); }, () => e.shadow(x, y, 3.4, 3.4, 52)); };
  { const c = corner(T['0,-1'], 2); house(c[0] - 1.7, c[1] - 1.2, 'red', 0); }
  { const c = corner(T['-1,0'], 0); house(c[0] - 1.2, c[1] - 1.7, 'red', 1); }
  { const c = corner(T['1,0'], 4); keep(c[0] - 1.7, c[1] - 1.7, 'blue'); }
  { const c = corner(T['-1,1'], 5); house(c[0] - 1.7, c[1] - 1.2, 'gold', 0); }
  { const c = corner(T['0,1'], 3); house(c[0] - 1.2, c[1] - 1.7, 'gold', 1); }
  // ---- a harbour: jetty and a boat
  { const t = T['2,-1'], a = corner(t, 0), b = corner(t, 1), x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2; B(x, y - .4, 0, 3.4, .8, 2, TIM, (u, v) => Math.floor(u) % 3 ? [140, 104, 70] : [100, 74, 48]); for (const k of [1, 2.2, 3.2]) B(x + k, y - .5, -3, .2, .2, 5, TIMD); add(x + y + 6, () => { S.E = 0; box(x + 3.8, y + .4, -1, 2.4, 1, 2, [90, 64, 44], (u, z) => Math.floor(z) % 2 ? [110, 80, 52] : [86, 60, 40], [70, 50, 34]); const [mx, my] = iso(x + 5, y + .9, 1); for (let j = 0; j < 24; j++) px(mx, my - j, [70, 56, 40]); for (let j = 0; j < 12; j++) for (let i = 1; i < 9 - j * .4; i++) px(mx + i, my - 22 + j, sh([200, 190, 160], .8 + (i < 2 ? -.2 : 0))); }); light(x + 1.6, y, 10, 40, .6); }
  // ---- a host on the road with a brazier, and a farmer
  const C = KIT.CAST.town;
  { const p = corner(T['0,-1'], 1); light(p[0] + 2.8, p[1] + 2.8, 6, 80, 1.15); add(p[0] + p[1] + 5.6, () => { const [sx, sy] = iso(p[0] + 2.8, p[1] + 2.8, 0); S.E = 0; box(p[0] + 2.5, p[1] + 2.5, 0, .6, .6, 4, [40, 34, 32], [56, 50, 50], [36, 32, 32]); S.E = 1; for (const [i, j, c] of [[0, -6, [255, 226, 140]], [-1, -5, [246, 156, 62]], [1, -5, [246, 156, 62]], [0, -7, [246, 156, 62]], [0, -8, [206, 84, 44]], [-1, -6, [255, 200, 100]]]) px(sx + i, sy + j, c); S.E = 0; });
    const sold = (dx, dy, f, ex) => add(p[0] + dx + p[1] + dy, () => fig(p[0] + dx, p[1] + dy, { garb: 'tunic', robe: [96, 92, 100], col: COL.red, mark: 'mantle', legs: [70, 60, 50], hat: 'kettle', hatCol: [140, 144, 152], belt: [50, 40, 34], prop: 'staff', ...ex }, f, 'idle', 0));
    sold(1, 4.2, 6); sold(2.4, 4.6, 7, { beard: [70, 50, 40] }); sold(3.8, 3.8, 5, { hat: 0, hood: 1, hoodCol: [70, 30, 28] }); sold(4.6, 1.6, 4, { robe: [120, 40, 34], hat: 0, hair: [60, 44, 32], beard: [60, 44, 32], prop: 0 }); }
  { const t = T['-1,0'], [x, y] = [t.c[0] + 1.5, t.c[1] + 1.8]; add(x + y, () => fig(x, y, { ...C[2], col: COL.red, hat: 0, hair: [140, 100, 60], garb: 'tunic', robe: [110, 96, 70] }, 1, 'work', 0)); }
  { const t = T['1,1'], [x, y] = [t.c[0] - 1.2, t.c[1] + 1]; add(x + y, () => fig(x, y, { ...C[1], col: COL.gold }, 6, 'idle', 0)); }
  drawAll();
  const out = finish();
  // numbers on the tokens, drawn after scaling so they stay crisp
  const g = out.getContext('2d'); g.font = '600 15px "Pixelify Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const k in T) { const t = T[k]; if (!t.n) continue; const [sx, sy] = iso(t.c[0], t.c[1]); g.fillStyle = (t.n === 6 || t.n === 8) ? '#8a1c18' : '#2a1c12'; g.font = '600 22px "Pixelify Sans"'; g.fillText(t.n, sx * 2, sy * 2 + 1); g.fillStyle = 'rgba(42,28,18,.6)'; const dots = 6 - Math.abs(7 - t.n); for (let d = 0; d < dots; d++) g.fillRect(sx * 2 - dots * 2 + d * 4, sy * 2 + 9, 2, 2); }
  return out; };
