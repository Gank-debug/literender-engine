// Snowed-in monastery on the shared engine: chapel, refectory, bell tower, cloister yard with graves and a body by the well.
window.SCENE = function (t = 0, N = 8) {
  const e = ENG({ W: 560, H: 364, ox: 196, oy: 92, t, N, amb: { in: [.2, .19, .25], out: [.2, .27, .46] }, weather: 'snow' });
  const { T, PH, smoke, fr, blend, S, px, dark, hs, vn, sh, mix, iso, box, stone, TIM, TIMD, GRY, STN, light, fig, add, B, flame, candle, stand, drawAll, backN, backW, low, ground, D, finish } = e, C = KIT.CAST.monastery;
  const PL = [196, 184, 158], TIL = [[112, 60, 48], [124, 72, 60], [130, 80, 68]], SNOW = [226, 234, 246], WH = 74;
  const GLS = [[176, 46, 44], [48, 80, 160], [214, 164, 60], [58, 124, 86], [128, 60, 140], [200, 210, 230]], WINX = [11.9, 17.5, 23.1];
  const RM = { tower: [0, 0, 9, 9], chapel: [9, 0, 27, 10], refect: [0, 9, 9, 21] }, inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  const plaster = (u, z) => { const g = vn(u / 13 + 7, z / 9), grime = .74 + vn(u / 31, z / 17 + 3) * .32; let c;
    if (z < 13) c = sh(stone(u, z, STN, 10, 4), .9); else if (z >= WH - 4) c = Math.floor(z) === WH - 4 ? sh(TIMD, .7) : sh(TIM, .9 - (Math.floor(u) % 4 === 0 ? .1 : 0)); else if (g > .66) c = sh(stone(u, z, STN, 10, 4), .8); else if (g > .62) c = sh(PL, .62);
    else { c = sh(PL, grime * (.97 + hs(Math.floor(u), Math.floor(z)) * .05)); if (z < 22) c = sh(c, .78 + (z - 13) * .02); if (z > WH - 12) c = sh(c, .8); if (hs(Math.floor(u / 2), 7) < .08 && z < WH - 8 && z > WH - 8 - hs(Math.floor(u / 2), 3) * 30) c = sh(c, .84); } return c; };
  const towerStone = (u, z) => sh(stone(u, z, GRY), .74 + vn(u / 31, z / 17 + 3) * .32);
  const roofTile = (u, z) => { const r = Math.floor(z / 2); return Math.floor(u + r * 2) % 5 === 0 ? sh(TIL[0], .7) : TIL[(r + Math.floor(hs(Math.floor((u + r * 2) / 5), r) * 2)) % 3]; };
  const glass = (u, z) => ({ u, z, w: 20, h: 44, f: (a, c) => { a |= 0; c |= 0; const lim = c >= 30 ? Math.sqrt(Math.max(0, 196 - (c - 30) * (c - 30))) * .72 : 10; if (Math.abs(a - 9.5) > lim) return null; S.E = 0; if (Math.abs(a - 9.5) > lim - 1.5 || c < 2) return sh(GRY[1], .7); const p = a + c * .5, q = a - c * .5 + 60, rd = Math.hypot(a - 9.5, (c - 24) * .8);
    if (a === 9 || Math.floor(p) % 5 === 0 || Math.floor(q) % 5 === 0 || Math.abs(rd - 5) < .6 || c === 12) return [20, 18, 26]; S.E = .3; if (rd < 5) return sh(GLS[rd < 2.2 ? 2 : 0], .8); if (c < 12) return sh(GLS[1], .7); return sh(GLS[[1, 3, 1, 4, 5, 1, 3][(Math.floor(p / 5) + Math.floor(q / 5) * 3 + u) % 7]], .66); } });
  ground((x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)); let c, r, ef = 0; const wear = .78 + vn(x * .9, y * .9) * .3;
    const flag = (pal, s) => { const X = x / s, Y = y / s + (Math.floor(X) % 2) * .5, ed = (X - Math.floor(X)) < .09 / s || (Y - Math.floor(Y)) < .09 / s; return ed ? sh(pal[2], .55) : sh(pal[Math.floor(hs(Math.floor(X), Math.floor(Y)) * pal.length)], (.9 + n * .1) * wear); };
    if (inR(r = RM.chapel, x, y)) { const X = x - .5, fx = X - Math.floor(X), fy = y - Math.floor(y); c = sh(((Math.floor(X) + Math.floor(y)) % 2 ? [168, 158, 140] : [112, 104, 98]), (.92 + n * .1) * wear); if (fx < .08 || fy < .08) c = sh(c, .6);
      if (y > 4.3 && y < 5.7 && x > 14) c = sh((y < 4.5 || y > 5.5) ? [170, 136, 66] : ((Math.floor(x * 2) + Math.floor(y * 5)) % 7 === 0 ? [96, 28, 30] : [124, 36, 38]), (.9 + n * .12) * (.8 + vn(x, y * 3) * .25));
      if (x < 14 && x > 9.6 && y > 2.6 && y < 7.4) c = sh(flag(GRY, 1.3), 1.08);
      for (const wx of WINX) { const yy = y - 3.4, cx = wx + 2.2 + yy * .55, hw = .95 - Math.max(0, yy - 2.2) * .7; if (yy > 0 && yy < 3.5 && Math.abs(x - cx) < hw) { const lu = (x - cx) * 10, lv = yy * 12, pp = lu + lv * .5, qq = lu - lv * .5 + 60; if (!(Math.floor(pp + 100) % 5 === 0 || Math.floor(qq) % 5 === 0)) { c = mix(c, GLS[[1, 3, 1, 4, 5, 1, 0][(Math.floor((pp + 100) / 5) + Math.floor(qq / 5) * 3) % 7]], .42); ef = .42; } } } }
    else if (inR(r = RM.refect, x, y)) c = flag(STN, 1.5); else if (inR(r = RM.tower, x, y)) c = flag(GRY, 1.2);
    if (c) { const ao = Math.min(x - r[0], y - r[1]); return [ao < 1 ? sh(c, .62 + ao * .38) : c, 1, ef]; }
    const drift = vn(x * .5, y * 1.4); c = mix([170, 184, 208], SNOW, drift * .75 + n * .25);
    if (x >= 9 && y >= 10) { const dp = Math.min(Math.abs(y - 15.6), Math.abs(x - 17.5), x < 11.4 || y < 11.6 ? 0 : 9), edge = 1.05 + (vn(x * 1.3, y * 1.3) - .5) * .5; if (dp < edge) { const X = x * 1.25, Y = y * 1.25 + (Math.floor(X) % 2) * .5, ed = (X - Math.floor(X)) < .14 || (Y - Math.floor(Y)) < .14, st = sh(STN[Math.floor(hs(Math.floor(X) + 5, Math.floor(Y)) * 3)], .82 + n * .06); c = ed ? sh(c, .9) : mix(st, c, Math.max(0, Math.min(.85, (dp / edge - .45) * 1.6 + (vn(x * 4, y * 4) - .5) * .5))); } else if (hs(Math.floor(x * 3), Math.floor(y * 6)) < .04) c = sh(c, .86); const ao = Math.min(x - 9, y - 10); if (ao < 1.2) c = sh(c, .6 + ao * .33); }
    return [c, 0]; });
  // Civ Sim pines with a snow pass, built once
  const TD = window.__pines || (window.__pines = SPRITES.tree.slice(5, 10).map(sp => { const c = document.createElement('canvas'); c.width = sp.w; c.height = sp.h; const g = c.getContext('2d'); g.drawImage(sp.img, 0, 0); const d = g.getImageData(0, 0, sp.w, sp.h), a = d.data, ls = []; for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 128) ls.push(a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1); ls.sort((p, q) => p - q); const c1 = ls[(ls.length * .55) | 0], c2 = ls[(ls.length * .8) | 0];
    for (let i = 0; i < a.length; i += 4) { const l = a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1, py = (i / 4 / sp.w) | 0; if (a[i + 3] > 128 && l > c1 && py < sp.h * .82) { const m = l > c2 ? .92 : .6; a[i] += (226 - a[i]) * m; a[i + 1] += (234 - a[i + 1]) * m; a[i + 2] += (246 - a[i + 2]) * m; } else { a[i] *= .7; a[i + 1] *= .72; a[i + 2] *= .78; } } return { sp, a }; }));
  const tree = (x, y, k) => { const tt = TD[k % TD.length], [sx, sy] = iso(x, y), sway = Math.round(Math.sin(PH + k) * .6); S.Z = 0; S.E = 0; for (let t2 = 0; t2 < 30; t2++) for (let w = -5 + t2 * .15; w <= 5 - t2 * .15; w++) dark(sx + t2 * 1.2 + w * .5, sy + t2 * .35 + w * .5, .6); for (let j = 0; j < tt.sp.h; j++) for (let i = 0; i < tt.sp.w; i++) { const q = (j * tt.sp.w + i) * 4; if (tt.a[q + 3] > 128) px(sx + tt.sp.ox + i + (j < tt.sp.h * .4 ? sway : 0), sy + tt.sp.oy + j, [tt.a[q], tt.a[q + 1], tt.a[q + 2]]); } };
  const back = []; for (let i = 0; i < 30; i++) { back.push([-1.6 - hs(i, 1) * 2.4, -3 + i * 1.1 + hs(i, 2) * .5, i]); back.push([-3 + i * 1.3 + hs(i, 3) * .5, -1.6 - hs(i, 4) * 2.4, i + 2]); }
  back.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(q => tree(...q));
  const snowN = r => box(r[0] - .4, r[1] - .7, WH + 7, r[2] - r[0] + .4, .8, 3, SNOW, SNOW, [170, 184, 208]), snowW = r => box(r[0] - .7, r[1] - .4, WH + 7, .8, r[3] - r[1] + .4, 3, SNOW, SNOW, [170, 184, 208]);
  S.Z = 1;
  // Bell tower: the rope sways
  { const r = RM.tower, TH = 170; backN(r, TH, towerStone, [D.slit(40, 40)]); backW(r, TH, towerStone, [D.slit(40, 40)]); candle(2, 2, 0, 50, .8);
    B(1, 5.6, 0, 1.4, 1.4, 10, [112, 84, 56]); B(1.3, 5.9, 10, 1, 1, 7, [128, 96, 64]); B(5.8, 1, 0, 1.2, 1.2, 9, [112, 84, 56]);
    add(9.4, () => { const [fx, fy] = iso(4.5, 4.5); for (let j = 0; j < fy - 12; j++) { const sw = Math.sin(PH) * 2 * (j / (fy - 12)) ** 2; px(fx + sw + (j % 9 < 4 ? 0 : 1), j, [150, 134, 100]); } });
    add(11.2, () => fig(5.4, 5.2, C[4], 1, 'idle', fr('idle', 1))); drawAll(); }
  // Chapel
  { const r = RM.chapel; backN(r, WH, plaster, [glass(19, 20), D.sconce(49, 30), D.cross(60, 34), glass(75, 20), D.sconce(105, 30), D.cross(116, 34), glass(131, 20), D.sconce(161, 30)], roofTile); snowN(r);
    for (const u of [49, 105, 161]) light(9 + u / 10 + .7, .4, 28, 62, .7); low(r[0] - .4, r[1], .4, 10, 11);
    add(0, () => { S.E = 0; box(10, 3, 0, 3.6, 4, 2, (u, v) => sh(stone(u, v, GRY, 12, 12), 1.05), sh(GRY[1], .8), sh(GRY[1], .6)); });
    { const cloth = (u, z) => z > 8 ? [200, 192, 174] : z > 6 ? [150, 118, 54] : (Math.floor(u) % 6 === 3 && z > 2) ? [150, 118, 54] : z < 1 ? [150, 118, 54] : [116, 34, 36]; add(18.52, () => { S.E = 0; box(10.7, 3.7, 2, 1.5, 2.6, 11, (u, v) => (v < 2 || v > 24 || u < 2 || u > 13) ? [150, 118, 54] : sh([188, 180, 162], .94 + hs(Math.floor(u), Math.floor(v)) * .08), (u, z) => sh(cloth(u, z), .8), cloth); }); }
    add(15.3, () => { const [sx, sy] = iso(11.2, 5, 13); S.E = 0; for (let i = -2; i <= 3; i++) px(sx + i, sy, [110, 84, 40]); for (let j = 1; j < 17; j++) { px(sx, sy - j, [206, 166, 76]); px(sx + 1, sy - j, [130, 100, 44]); } for (let i = -4; i <= 5; i++) { px(sx + i, sy - 12, [206, 166, 76]); px(sx + i, sy - 11, [130, 100, 44]); } });
    candle(11.3, 4, 13, 34, .5); candle(11.3, 6, 13, 34, .5); stand(10.6, 2.6, 80); stand(10.6, 7.4, 80);
    for (const x of [15.4, 17.4, 19.4, 21.4, 23.4]) for (const y of [.9, 6.1]) { B(x, y, 0, .7, 3, 5, [104, 76, 48]); B(x + .58, y, 5, .14, 3, 5, [88, 64, 40]); }
    stand(25.6, 1.2, 60); stand(25.6, 8.6, 60);
    add(21.2, () => fig(14.4, 5.1, C[3], 7, 'idle', fr('idle', 2))); add(24.4, () => fig(17.3, 5.5, C[0], 3, 'pray', fr('pray', 3))); add(29.6, () => fig(22.6, 6.9, C[1], 2, 'idle', fr('idle', 5))); drawAll();
    const y = r[3] - .4; low(r[0], y, 7, .4, 7); low(17.6, y, 9.4, .4, 7); low(r[2] - .4, r[1], .4, 10, 7);
    for (const x of [9, 15.7, 17.6, 26.5]) { S.E = 0; box(x, y - .1, 0, .6, .6, 16, [150, 140, 124], (u, z) => sh(stone(u, z, STN, 6, 4), .7), (u, z) => sh(stone(u, z, STN, 6, 4), .5)); box(x - .05, y - .15, 16, .7, .7, 2, SNOW, [190, 200, 220], [160, 172, 196]); } }
  // Refectory
  { const r = RM.refect; backW(r, WH, plaster, [D.win(10, 26), D.hearth(42), D.win(94, 26)], roofTile); snowW(r); light(.8, 15, 4, 120, 1.25); low(r[0], r[1] - .4, 9, .4, 11);
    B(4, 11, 9, 1.6, 7, 2, TIM); for (const [x, y] of [[4.1, 11.1], [5.3, 11.1], [4.1, 17.7], [5.3, 17.7]]) B(x, y, 0, .25, .25, 9, TIMD); B(3, 11.3, 0, .6, 6.4, 5, TIMD); B(6, 11.3, 0, .6, 6.4, 5, TIMD);
    for (const y of [12, 13.6, 15.2, 16.8]) add(5 + y + .09, () => { const [sx, sy] = iso(4.8, y, 11); S.E = 0; px(sx, sy, [170, 160, 136]); px(sx + 1, sy, [170, 160, 136]); px(sx - 1, sy, [120, 110, 90]); px(sx, sy - 1, [130, 112, 80]); });
    candle(4.8, 12.8, 11, 46, .8); candle(4.8, 16, 11, 46, .8);
    add(17.4, () => { const [sx, sy] = iso(4.8, 14.4, 11); smoke(sx, sy - 2, 14, [200, 196, 190]); });   // steam off the pot
    add(23.3, () => fig(7.3, 15.6, C[2], 2, 'work', fr('work', 0))); drawAll(); const x = r[2] - .4; low(x, r[1], .4, 3, 7); low(x, 14.2, .4, 6.8, 7); }
  // Cloister yard
  S.Z = 0;
  { light(12.4, 18.6, 7, 84, 1.15);
    add(36.1, () => { S.E = 0; box(16.5, 14.6, 0, 2, 2, 8, (u, v) => (u > 4 && u < 16 && v > 4 && v < 16) ? [10, 14, 30] : SNOW, (u, z) => stone(u, z, GRY, 6, 3), (u, z) => sh(stone(u, z, GRY, 6, 3), .6)); box(16.6, 15.5, 8, .25, .25, 16, TIM, TIM, TIMD); box(18.15, 15.5, 8, .25, .25, 16, TIM, TIM, TIMD); box(16.4, 15.1, 24, 2.2, 1.1, 4, SNOW, roofTile, sh(TIL[0], .6)); });
    for (const [x, y] of [[22.6, 12.4], [24.3, 12.7], [26, 12.3], [23, 18], [25, 18.4], [21.4, 20.4]]) add(x + y + .5, () => { S.E = 0; box(x - .5, y, 0, 1.3, .7, 2, SNOW, [190, 200, 220], [160, 172, 196]); const [sx, sy] = iso(x, y + .2); for (let q = 0; q < 14; q++) dark(sx + q, sy + q * .3, .6); for (let j = 1; j < 14; j++) { px(sx, sy - j, GRY[1]); px(sx + 1, sy - j, sh(GRY[1], .6)); } for (let i = -3; i <= 4; i++) { px(sx + i, sy - 10, GRY[3]); px(sx + i, sy - 9, sh(GRY[1], .6)); } for (const i of [-3, -2, 3, 4]) px(sx + i, sy - 11, SNOW); px(sx, sy - 14, SNOW); px(sx + 1, sy - 14, SNOW); });
    add(32, () => { S.E = 0; box(12, 18.2, 0, .8, .8, 7, [40, 34, 32], [56, 50, 50], [36, 32, 32]); const [sx, sy] = iso(12.4, 18.6, 7); S.E = 1; for (let k = 0; k < 9; k++) { const i = Math.round((hs(k, T) - .5) * 3), j = -Math.floor(hs(k + 9, T) * 4); px(sx + i, sy + j, j < -2 ? [206, 84, 44] : j < -1 ? [246, 156, 62] : [255, 214, 120]); } S.E = 0; smoke(sx, sy - 5, 30, [150, 156, 170], 1); });
    add(33.6, () => fig(13.9, 19, { ...C[1], col: [196, 100, 44], robe: [104, 72, 48] }, 3, 'idle', fr('idle', 6))); add(30.4, () => fig(10.9, 18.9, { ...C[0], col: [170, 80, 120], robe: [58, 54, 66] }, 7, 'point', fr('point', 2)));
    add(19.6 + 17.4 + .9, () => { S.E = 0; const [sx, sy] = iso(19.6, 17.2); for (let i = -9; i <= 9; i++) for (let j = -3; j <= 2; j++) { const hg = 3 - Math.abs(i) * .12 - Math.abs(j) * .7 + (i < -5 ? 1 : 0); if (hg > 0) px(sx + i + j, sy + j + i * .5 - hg, sh([170, 160, 146], .6 + hg * .12 - (j > 0 ? .2 : 0))); } for (let k = 0; k < 40; k++) { const a = hs(k, 9) * 6.28, rr = hs(k, 5) * 9; px(sx + 2 + Math.cos(a) * rr * 1.4, sy + 5 + Math.sin(a) * rr * .6, [96, 22, 26]); } });
    for (let k = 0; k < 22; k++) add(0, () => { const [sx, sy] = iso(20.6 + k * .42, 17.6 + k * .33 + (k % 2) * .35); px(sx, sy, [128, 142, 170]); px(sx + 1, sy, [128, 142, 170]); px(sx, sy + 1, [150, 162, 188]); });
    for (const [x, y, k] of [[26.5, 21, 1], [15.6, 23.4, 3], [28.6, 16.6, 2], [23.4, 25, 4], [10.4, 25.5, 2], [19.4, 27.4, 0], [30, 22, 3], [31.4, 12, 1], [29.6, 8.6, 4], [14, 29, 1], [26.6, 28, 2]]) add(x + y, () => tree(x, y, k)); drawAll(); }
  return finish();
};
