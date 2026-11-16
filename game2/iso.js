// Monastery as a 2.5D pixel cutaway: back walls full height, partitions cut low, courtyard open to the snow.
// Palette and figure proportions follow GANK's own sheet (cream plaster, timber, terracotta, tall slim profile figures).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } }); p.on('pageerror', e => console.log(e.message)); p.on('console', m => console.log(m.text()));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2500);
  const url = await p.evaluate(async () => {
    const W = 580, H = 376, K = 3, ox = 268, oy = 132;
    const buf = new Uint8ClampedArray(W * H * 4), zone = new Uint8Array(W * H); let Z = 0;
    const px = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H || !c) return; const i = (y * W + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255; zone[y * W + x] = Z; };
    const hs = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
    const sh = (c, f) => [c[0] * f, c[1] * f, c[2] * f], mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const iso = (x, y, z = 0) => [ox + (x - y) * 10, oy + (x + y) * 5 - z];
    const col = (c, a, b) => typeof c === 'function' ? c(a, b) : c;
    // ---- one primitive for everything solid: an iso box with a top, a left face (south) and a right face (east)
    const box = (x, y, z, w, d, h, top, left, right) => { const xs = [iso(x, y + d)[0], iso(x + w, y)[0]], ys = [iso(x, y, z + h)[1], iso(x + w, y + d, z)[1]];
      for (let sy = Math.floor(ys[0]) - 1; sy <= ys[1] + 1; sy++) for (let sx = Math.floor(xs[0]) - 1; sx <= xs[1] + 1; sx++) { const dx = sx + .5 - ox, dy0 = sy + .5 - oy;
        let dy = dy0 + z + h, gx = (dx / 10 + dy / 5) / 2, gy = (dy / 5 - dx / 10) / 2;
        if (gx >= x && gx < x + w && gy >= y && gy < y + d) { px(sx, sy, col(top, (gx - x) * 10, (gy - y) * 10)); continue; }
        gx = dx / 10 + y + d; if (gx >= x && gx < x + w) { const zq = (gx + y + d) * 5 - dy0; if (zq >= z && zq < z + h) { px(sx, sy, col(left, (gx - x) * 10, zq - z)); continue; } }
        gy = x + w - dx / 10; if (gy >= y && gy < y + d) { const zq = (x + w + gy) * 5 - dy0; if (zq >= z && zq < z + h) px(sx, sy, col(right, (gy - y) * 10, zq - z)); } } };
    // ---- palette (from the reference sheet)
    const PL = [218, 209, 186], TIM = [140, 108, 75], TIMD = [103, 78, 47], TIL = [[125, 69, 55], [136, 83, 70], [142, 89, 77]], STN = [[201, 185, 160], [194, 178, 151], [181, 164, 136]], GRY = [[125, 125, 125], [117, 117, 117], [112, 117, 128], [132, 134, 140]], SNOW = [236, 242, 250];
    const stone = (u, z, pal, bw = 8, bh = 4) => { const r = Math.floor(z / bh), o = (r % 2) * bw / 2, k = Math.floor((u + o) / bw); if (Math.floor(z) % bh === bh - 1 || Math.floor(u + o) % bw === 0) return sh(pal[2], .8); return sh(pal[Math.floor(hs(k, r) * pal.length)], .96 + hs(k + 3, r) * .08); };
    // wall decals
    const D = {
      win: (u, z) => ({ u, z, w: 10, h: 16, f: (a, c) => { a |= 0; c |= 0; const arch = c >= 13 ? Math.abs(a - 4.5) > (16 - c) + .6 : false; if (arch) return null; if (c === 0) return TIM; if (a === 0 || a === 9 || c === 1 || (c >= 13 && Math.abs(a - 4.5) > (15 - c) + .6) || c === 15) return TIMD; return ((a + c) % 3 === 0 || (a - c + 30) % 3 === 0) ? [92, 108, 150] : [34, 44, 78]; } }),
      door: (u) => ({ u, z: 0, w: 14, h: 30, f: (a, c) => { a |= 0; c |= 0; if (a === 0 || a === 13 || c >= 29) return TIM; if (a === 10 && c === 13) return [210, 180, 110]; return a % 3 === 0 ? [88, 65, 38] : TIMD; } }),
      gate: (u) => ({ u, z: 0, w: 28, h: 38, f: (a, c) => { a |= 0; c |= 0; if (c >= 32 && Math.abs(a - 13.5) > (38 - c) * 1.6 + 4) return null; if (a < 2 || a > 25 || c >= 36 || (c >= 32 && Math.abs(a - 13.5) > (37 - c) * 1.6 + 3)) return GRY[1]; if (a === 13 || a === 14) return [60, 44, 26]; if (c === 9 || c === 24) return [84, 86, 94]; return a % 3 === 0 ? [88, 65, 38] : TIMD; } }),
      shelf: (u, z, w, h, pal) => ({ u, z, w, h, f: (a, c) => { a |= 0; c |= 0; if (a === 0 || a === w - 1 || c % 7 === 0 || c === h - 1) return TIM; const k = Math.floor(a / 2), r = Math.floor(c / 7), hh = 3 + Math.floor(hs(k + u, r) * 4); if (c % 7 > hh || hs(k + u, r + 9) < .12) return [74, 54, 36]; return pal[Math.floor(hs(k + u * 3, r + 5) * pal.length)]; } }),
      glass: (u, z) => ({ u, z, w: 14, h: 28, f: (a, c) => { a |= 0; c |= 0; const lim = c >= 20 ? (28 - c) * .85 + .4 : 7; if (Math.abs(a - 6.5) > lim) return null; if (Math.abs(a - 6.5) > lim - 1 || c === 0) return GRY[1]; if (a % 4 === 2 || c % 4 === 0) return [44, 40, 52]; return [[196, 62, 54], [58, 96, 170], [226, 178, 70], [70, 140, 96], [150, 74, 150]][Math.floor(hs(Math.floor(a / 4) + u, Math.floor(c / 4)) * 5)]; } }),
      hearth: (u) => ({ u, z: 0, w: 26, h: 24, f: (a, c) => { a |= 0; c |= 0; if (a < 4 || a > 21 || c > 18) return c > 20 ? TIM : stone(a, c, GRY, 6, 4); if (c < 9 && Math.abs(a - 12.5) < 6 - c * .65) return c < 3 ? [255, 226, 140] : c < 6 ? [246, 156, 62] : [206, 84, 44]; if (c < 2) return [70, 50, 36]; return [38, 28, 28]; } }),
      cross: (u, z) => ({ u, z, w: 7, h: 12, f: (a, c) => { a |= 0; c |= 0; return (a === 3 || c === 8) ? [196, 160, 84] : (a === 2 && c < 12) || c === 7 ? null : null; } }),
      ladder: (u, h) => ({ u, z: 0, w: 8, h, f: (a, c) => { a |= 0; c |= 0; return a === 0 || a === 7 ? TIM : c % 5 === 2 ? TIMD : null; } }),
      slit: (u, z) => ({ u, z, w: 4, h: 12, f: (a, c) => { a |= 0; return a === 0 || a === 3 ? sh(GRY[1], .7) : [26, 32, 58]; } }),
      rack: (u) => ({ u, z: 8, w: 18, h: 22, f: (a, c) => { a |= 0; c |= 0; if (c === 4 || c === 15) return TIM; if (a % 5 === 2) return c > 17 ? [190, 194, 204] : [120, 92, 60]; return null; } }),
      hang: (u, z) => ({ u, z, w: 16, h: 9, f: (a, c) => { a |= 0; c |= 0; if (c === 8) return TIMD; const k = a % 5; if (k === 4) return null; return c > 5 ? (k === 1 ? [120, 100, 70] : null) : (k === 0 || k === 3) && (c === 0 || c === 5) ? null : [[168, 86, 70], [150, 126, 78], [176, 100, 84]][Math.floor(a / 5) % 3]; } }),
    };
    const BOOK = [[150, 60, 50], [62, 86, 130], [176, 140, 70], [78, 112, 84], [112, 80, 110], [206, 196, 168]], JAR = [[190, 170, 120], [150, 110, 80], [120, 140, 110], [206, 196, 168], [170, 90, 70]];
    const wall = (len, Hh, decals, pal, f = 1) => (u, z) => { for (const d of decals) if (u >= d.u && u < d.u + d.w && z >= d.z && z < d.z + d.h) { const c = d.f(u - d.u, z - d.z); if (c) return sh(c, f); }
      let c; if (pal) c = stone(u, z, pal, 9, 5); else if (z < 7) c = stone(u, z, STN); else if (z >= Hh - 3) c = (Math.floor(z) === Math.floor(Hh - 3)) ? TIMD : TIM; else if (u < 2 || u >= len * 10 - 2) c = TIM; else { c = sh(PL, .97 + hs(Math.floor(u), Math.floor(z)) * .05); if (z < 10) c = sh(c, .94); if (z > Hh - 7) c = sh(c, .9); }
      return sh(c, f); };
    const roofTile = (u, z) => { const r = Math.floor(z / 2); return Math.floor(u + r * 2) % 5 === 0 ? sh(TIL[0], .85) : TIL[(r + Math.floor(hs(Math.floor((u + r * 2) / 5), r) * 2)) % 3]; };
    const capTop = [84, 70, 56];
    // ---- rooms
    const WH = 48, T = .35;
    const RM = { tower: [0, 0, 6, 6], chapel: [6, 0, 16, 6], script: [16, 0, 22, 6], infirm: [22, 0, 28, 6], refect: [0, 6, 6, 13], larder: [0, 13, 6, 18], gate: [0, 18, 6, 23] };
    const inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
    const floorAt = (x, y) => { const fx = x - Math.floor(x), fy = y - Math.floor(y), n = hs(Math.floor(x * 10), Math.floor(y * 10)); let c, r;
      const flag = (pal, s) => { const X = x / s, Y = y / s + (Math.floor(X) % 2) * .5, e = (X - Math.floor(X)) < .1 / s || (Y - Math.floor(Y)) < .1 / s; return e ? sh(pal[2], .82) : sh(pal[Math.floor(hs(Math.floor(X), Math.floor(Y)) * pal.length)], .95 + n * .07); };
      const plank = () => { const k = Math.floor(y * 2), e = (y * 2 - k) < .12 || ((x + hs(k, 1) * 3) % 3) < .1; return e ? TIMD : sh([[148, 118, 86], [140, 108, 75], [132, 98, 64]][Math.floor(hs(k, 7) * 3)], .96 + n * .08); };
      if (inR(r = RM.chapel, x, y)) { c = ((Math.floor(x) + Math.floor(y)) % 2 ? [206, 196, 174] : [170, 160, 146]); if (fx < .1 || fy < .1) c = sh(c, .86); if (y > 2.4 && y < 3.6 && x > 8.4) { c = (y < 2.55 || y > 3.45) ? [206, 170, 90] : sh([150, 52, 48], .95 + n * .1); } }
      else if (inR(r = RM.script, x, y) || inR(r = RM.infirm, x, y)) c = plank();
      else if (inR(r = RM.refect, x, y)) c = flag(STN, 1.5);
      else if (inR(r = RM.larder, x, y)) c = sh(flag(STN, 1), .78);
      else if (inR(r = RM.gate, x, y)) c = flag(GRY, .7);
      else if (inR(r = RM.tower, x, y)) c = flag(GRY, 1.2);
      else return null;
      if (x - r[0] < .7 || y - r[1] < .7) c = sh(c, .86); return c; };
    const yard = (x, y) => x >= 6 && y >= 6 && x < 21.5 && y < 19.5;
    const groundAt = (x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)), n2 = hs(Math.floor(x * 3.3), Math.floor(y * 9)); let c = mix([214, 224, 238], SNOW, n2 * .7 + n * .3);
      if (yard(x, y)) { const onPath = (Math.abs(y - 11.5) < .9 && x < 20) || (Math.abs(x - 12.5) < .9 && y < 18) || x < 7.6 || y < 7.6; if (onPath) { const X = x * 1.6, Y = y * 1.6 + (Math.floor(X) % 2) * .5, e = (X % 1) < .14 || (Y % 1) < .14; c = hs(Math.floor(X), Math.floor(Y)) < .1 ? c : e ? [176, 172, 166] : sh(STN[Math.floor(hs(Math.floor(X) + 5, Math.floor(Y)) * 3)], 1.0 + n * .06); } if (x < 6.9 || y < 6.9) c = sh(c, .82); }
      else if (hs(Math.floor(x * 1.2), Math.floor(y * 4)) < .05) c = [196, 208, 228];
      return c; };
    // ---- ground pass
    for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) { const dx = sx + .5 - ox, dy = sy + .5 - oy, x = (dx / 10 + dy / 5) / 2, y = (dy / 5 - dx / 10) / 2; const f = floorAt(x, y); if (f) { Z = 1; px(sx, sy, f); continue; } Z = 0;
      const e = Math.max(-4 - x, -4 - y, x - 31, y - 26, (x + y) - 47) ; const bay = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]][sy & 3][sx & 3] / 16;
      if (e < -bay * 3) px(sx, sy, groundAt(x, y)); else px(sx, sy, [13, 17, 30]); }
    // ---- sprites from Civ Sim: snowy pines, blitted into the same buffer
    const treeData = SPRITES.tree.slice(5, 10).map(sp => { const c = document.createElement('canvas'); c.width = sp.w; c.height = sp.h; const g = c.getContext('2d'); g.drawImage(sp.img, 0, 0); const d = g.getImageData(0, 0, sp.w, sp.h), a = d.data, ls = []; for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 128) ls.push(a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1); ls.sort((p, q) => p - q); const c1 = ls[(ls.length * .55) | 0], c2 = ls[(ls.length * .8) | 0];
      for (let i = 0; i < a.length; i += 4) { const l = a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1, py = (i / 4 / sp.w) | 0; if (a[i + 3] > 128 && l > c1 && py < sp.h * .82) { const m = l > c2 ? .92 : .6; a[i] += (236 - a[i]) * m; a[i + 1] += (243 - a[i + 1]) * m; a[i + 2] += (250 - a[i + 2]) * m; } } return { sp, a }; });
    const tree = (x, y, k) => { const t = treeData[k % treeData.length], [sx, sy] = iso(x, y); Z = 0; for (let j = 0; j < t.sp.h; j++) for (let i = 0; i < t.sp.w; i++) { const q = (j * t.sp.w + i) * 4; if (t.a[q + 3] > 128) px(sx + t.sp.ox + i, sy + t.sp.oy + j, [t.a[q], t.a[q + 1], t.a[q + 2]]); } };
    const back = []; for (let i = 0; i < 26; i++) { back.push([-1.4 - hs(i, 1) * 2.2, -3 + i * 1.08 + hs(i, 2) * .5, i]); back.push([-3 + i * 1.3 + hs(i, 3) * .5, -1.4 - hs(i, 4) * 2.2, i + 2]); }
    back.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(t => tree(...t));
    // ---- figures: tall, slim, in profile, as on the reference sheet. Scapular carries the player's colour.
    const SK = [222, 182, 144], SKD = [184, 139, 95];
    const fig = (x, y, o) => { const [fx, fy] = iso(x, y), d = o.dir || 1, R = (a, b, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(Math.round(fx) + (a + i) * d, Math.round(fy) + b + j, c); }; const rb = o.robe, rd = sh(rb, .76), rl = sh(rb, 1.14);
      for (let k = -3; k <= 3; k++) for (let j = 0; j < 2; j++) if ((k + j) % 2 === 0) { const i = ((Math.round(fy) + j) * W + Math.round(fx) + k + 2) * 4; buf[i] *= .7; buf[i + 1] *= .7; buf[i + 2] *= .74; }
      R(-1, -1, 2, 1, SKD); R(1, -1, 1, 1, [96, 70, 44]);
      for (let i = 0; i < 13; i++) { const w = i < 4 ? 7 : i < 9 ? 6 : 5, x0 = -Math.floor(w / 2) - (w % 2 ? 0 : 0); R(x0, -2 - i, w, 1, rb); R(x0, -2 - i, 1, 1, rd); R(x0 + w - 1, -2 - i, 1, 1, rl); if (i === 0) R(x0, -2, w, 1, rd); }
      R(-2, -24, 5, 10, rb); R(-2, -24, 1, 10, rd); R(-3, -22, 1, 5, rd);          // torso, back shadow
      R(1, -24, 2, 19, o.col); R(1, -24, 1, 19, sh(o.col, .8));                    // scapular
      R(-1, -15, 4, 1, [206, 190, 150]);                                           // cord
      R(0, -23, 1, 7, rd); R(0, -16, 2, 1, SK);                                    // arm and hand
      R(0, -25, 2, 1, SKD);                                                        // neck
      R(-1, -30, 4, 5, SK); R(3, -28, 1, 1, SK); R(2, -29, 1, 1, [50, 40, 36]); R(1, -26, 2, 1, SKD);
      if (o.hood) { R(-2, -31, 5, 1, rb); R(-3, -30, 2, 6, rb); R(-1, -30, 2, 1, rb); R(-3, -30, 1, 6, rd); R(-3, -24, 2, 1, rd); }
      else { const h = o.hair || [70, 50, 36]; R(-2, -30, 2, 4, h); R(-2, -31, 5, 1, h); if (o.tons) R(0, -31, 2, 1, SK); if (o.beard) { R(1, -26, 3, 2, o.beard); } } };
    // ---- furniture helpers
    const things = []; const add = (k, f) => things.push([k, f]);
    const B = (x, y, z, w, d, h, c, tf) => add(x + w + y + d + z * .01, () => box(x, y, z, w, d, h, tf || sh(c, 1.12), sh(c, .92), sh(c, .74)));
    const candle = (x, y, z) => add(x + y + .2 + z * .01, () => { const [sx, sy] = iso(x, y, z); px(sx, sy - 1, [240, 232, 210]); px(sx, sy - 2, [240, 232, 210]); px(sx, sy - 3, [255, 190, 80]); px(sx, sy - 4, [255, 240, 170]); lights.push([sx, sy - 3, 30]); });
    const table = (x, y, w, d, c = TIM) => { B(x, y, 6, w, d, 2, c); B(x + .1, y + .1, 0, .2, .2, 6, TIMD); B(x + w - .3, y + d - .3, 0, .2, .2, 6, TIMD); B(x + .1, y + d - .3, 0, .2, .2, 6, TIMD); };
    const barrel = (x, y) => add(x + y + 1.6, () => box(x, y, 0, .8, .8, 9, [150, 116, 80], (u, z) => (Math.floor(z) === 2 || Math.floor(z) === 6) ? [84, 86, 94] : Math.floor(u) % 3 === 0 ? [110, 80, 50] : [132, 98, 64], (u, z) => (Math.floor(z) === 2 || Math.floor(z) === 6) ? [70, 72, 80] : Math.floor(u) % 3 === 0 ? [92, 66, 40] : [112, 82, 52]));
    const lights = [];
    const drawAll = () => { things.sort((a, b) => a[0] - b[0]).forEach(t => t[1]()); things.length = 0; };
    const backN = (r, Hh, decals, pal) => { box(r[0] - T, r[1] - T, 0, r[2] - r[0] + T, T, Hh, capTop, wall(r[2] - r[0], Hh, decals.map(d => ({ ...d, u: d.u + T * 10 })), pal), sh(pal ? pal[1] : PL, .7)); if (!pal) { box(r[0] - T, r[1] - T - .25, Hh, r[2] - r[0] + T, T + .5, 6, roofTile, roofTile, sh(TIL[0], .8)); box(r[0] - T, r[1] - T - .25, Hh + 6, r[2] - r[0] + T, T + .35, 2, SNOW, SNOW, [200, 212, 230]); } };
    const backW = (r, Hh, decals, pal) => { box(r[0] - T, r[1] - T, 0, T, r[3] - r[1] + T, Hh, capTop, sh(pal ? pal[1] : PL, .7), wall(r[3] - r[1], Hh, decals.map(d => ({ ...d, u: d.u + T * 10 })), pal, .86)); if (!pal) { box(r[0] - T - .25, r[1] - T, Hh, T + .5, r[3] - r[1] + T, 6, sh(TIL[1], .9), sh(TIL[0], .8), (u, z) => sh(roofTile(u, z), .86)); box(r[0] - T - .25, r[1] - T, Hh + 6, T + .35, r[3] - r[1] + T, 2, SNOW, SNOW, [200, 212, 230]); } };
    const low = (x, y, w, d, h = 7) => box(x, y, 0, w, d, h, [226, 218, 198], (u, z) => sh(stone(u, z, STN), .95), (u, z) => sh(stone(u, z, STN), .8));
    const stubS = (r, gap) => { const y = r[3] - T; if (gap == null) return low(r[0], y, r[2] - r[0], T, 5); low(r[0], y, gap - r[0], T, 5); low(gap + 1.5, y, r[2] - gap - 1.5, T, 5); };
    const stubE = (r, gap) => { const x = r[2] - T; low(x, r[1], T, gap - r[1], 5); low(x, gap + 1.5, T, r[3] - gap - 1.5, 5); };
    Z = 1;
    // Bell Tower (corner): tall stone, bell under a beam, rope to the floor
    { const r = RM.tower, TH = 112; backN(r, TH, [D.slit(26, 30), D.slit(26, 76), D.ladder(44, 70)], GRY); backW(r, TH, [D.slit(28, 30), D.slit(28, 76)], GRY);
      for (const [bx, by, bw, bd] of [[-T, -T - .2, 6 + T, T + .2], [-T - .2, -T, T + .2, 6 + T]]) for (let i = 0; i < 6; i += 1) if (i % 2 === 0) box(bx + (bw > 1 ? i + .1 : 0), by + (bd > 1 ? i + .1 : 0), TH, bw > 1 ? .9 : bw, bd > 1 ? .9 : bd, 6, SNOW, GRY[1], sh(GRY[1], .8));
      B(0, 2.8, 86, 6, .4, 3, TIMD); add(6.5, () => { const [sx, sy] = iso(3, 3, 86); for (let j = 0; j < 9; j++) for (let i = -4; i <= 4; i++) { const w = j < 2 ? 2 : j < 6 ? 3 : 4; if (Math.abs(i) <= w) px(sx + i, sy + j, i < -1 ? [150, 112, 44] : i > 1 ? [236, 200, 110] : [206, 164, 72]); } px(sx, sy + 9, [90, 70, 40]); const [fx, fy] = iso(3, 3, 0); for (let j = sy + 10; j < fy - 12; j++) px(sx + (j % 9 < 4 ? 0 : 1), j, [196, 176, 130]); });
      B(.6, 3.9, 0, 1.1, 1.1, 8, [132, 98, 64]); B(.9, 4.2, 8, .8, .8, 6, [150, 116, 80]); barrel(4.6, .8); add(7.2, () => fig(3.7, 3.5, { robe: [88, 84, 92], col: [70, 130, 190], hood: 1, dir: -1 })); candle(1.2, 1.2, 0); drawAll(); }
    // Chapel
    { const r = RM.chapel; backN(r, WH, [D.glass(12, 12), D.glass(43, 12), D.glass(74, 12), D.cross(31, 26), D.cross(62, 26)]); low(r[0] - T, r[1], T, 6, 7);
      B(7, 2.1, 0, 1.3, 1.8, 9, [226, 220, 204], (u, v) => (v < 2 || v > 15) ? [196, 62, 54] : [240, 236, 224]); candle(7.6, 2.4, 9); candle(7.6, 3.6, 9); add(10.3, () => { const [sx, sy] = iso(7.65, 3, 9); for (let j = 0; j < 9; j++) px(sx, sy - j, [226, 188, 90]); for (let i = -2; i <= 2; i++) px(sx + i, sy - 6, [226, 188, 90]); });
      for (const x of [10, 11.4, 12.8, 14.2]) for (const y of [.7, 3.9]) { B(x, y, 0, .5, 1.5, 4, [132, 98, 64]); B(x + .4, y, 4, .12, 1.5, 4, [112, 82, 52]); }
      add(12.6, () => fig(9, 3.1, { robe: [226, 220, 204], col: [200, 160, 70], tons: 1, hair: [150, 150, 150], dir: 1 })); add(15.2, () => fig(11, 4.6, { robe: [112, 78, 52], col: [190, 60, 54], hood: 1, dir: -1 })); drawAll(); stubS(r, 10.5); }
    // Scriptorium
    { const r = RM.script; backN(r, WH, [D.shelf(4, 8, 22, 30, BOOK), D.win(30, 16), D.shelf(44, 8, 14, 30, BOOK)]); low(r[0] - T, r[1], T, 6, 7);
      for (const [x, y] of [[17.2, 2.2], [19.4, 2.2], [18.3, 4.2]]) { B(x, y, 0, .9, 1.3, 7, TIM, (u, v) => (u > 2 && u < 7 && v > 3 && v < 10) ? [236, 226, 196] : sh(TIM, 1.12)); B(x + 1.05, y + .4, 0, .45, .45, 4, TIMD); candle(x + .2, y + .2, 7); }
      B(20.9, .5, 0, .7, .7, 11, TIMD, [236, 226, 196]); add(22.6, () => fig(18.75, 2.9, { robe: [58, 56, 66], col: [70, 150, 96], tons: 1, dir: -1 })); drawAll(); stubS(r, 18.3); }
    // Infirmary
    { const r = RM.infirm; backN(r, WH, [D.win(8, 16), D.shelf(22, 18, 16, 15, JAR), D.win(42, 16)]); low(r[0] - T, r[1], T, 6, 7);
      for (const x of [22.7, 24.5, 26.3]) { B(x, .5, 0, 1.2, 2.5, 4, TIMD, (u, v) => v < 6 ? [240, 238, 230] : (v < 8 ? [150, 60, 50] : [214, 208, 196])); B(x, .35, 0, 1.2, .15, 8, TIMD); }
      B(27, 4.2, 0, .8, .9, 13, TIM); table(23.2, 4.2, 1.4, .9); candle(23.6, 4.5, 8); add(30.2, () => fig(25.2, 4.3, { robe: [200, 186, 156], col: [140, 90, 170], hair: [120, 70, 40], dir: 1 }));
      drawAll(); stubS(r, 24.4); low(r[2] - T, r[1], T, 6, 5); }
    // Refectory
    { const r = RM.refect; backW(r, WH, [D.win(6, 16), D.hearth(22), D.win(54, 16)]); lights.push([iso(.6, 9.5, 6)[0], iso(.6, 9.5, 6)[1], 60]); low(r[0], r[1] - T, 6, T, 7);
      table(2.6, 7.4, 1.2, 4.4); B(1.9, 7.6, 0, .45, 4, 4, TIMD); B(4.05, 7.6, 0, .45, 4, 4, TIMD); for (const y of [8, 9.3, 10.6]) { add(3.4 + y + .09, () => { const [sx, sy] = iso(3.2, y, 8); px(sx, sy, [206, 196, 168]); px(sx + 1, sy, [206, 196, 168]); px(sx, sy - 1, [170, 150, 110]); }); } candle(3.2, 8.7, 8); candle(3.2, 10, 8);
      add(15.6, () => fig(4.8, 10.6, { robe: [112, 78, 52], col: [226, 178, 70], beard: [90, 60, 40], dir: -1 })); drawAll(); stubE(r, 8.6); }
    // Larder
    { const r = RM.larder; backW(r, WH, [D.shelf(4, 8, 20, 22, JAR), D.hang(28, 30)]); low(r[0], r[1] - T, 6, T, 7);
      barrel(.5, 15.6); barrel(1.5, 15.9); barrel(.6, 16.7); B(2.9, 13.5, 0, 1, 1, 6, [200, 180, 140]); B(3.1, 13.7, 6, .7, .7, 4, [186, 164, 124]); B(4.2, 13.6, 0, .9, .9, 7, [132, 98, 64]); B(2.6, 16.6, 0, 1.1, 1, 7, [132, 98, 64], (u, v) => (Math.floor(u) % 4 === 0) ? TIMD : [150, 116, 80]); candle(3.1, 17, 7); drawAll(); stubE(r, 15); }
    // Gatehouse
    { const r = RM.gate; backW(r, WH, [D.gate(11), D.rack(31)]); low(r[0], r[1] - T, 6, T, 7);
      table(3.4, 18.8, 1.2, 1.2); candle(4, 19.4, 8); B(3.9, 21.4, 0, 1.1, .7, 5, [112, 82, 52], (u, v) => Math.floor(u) === 5 ? [206, 170, 90] : [132, 98, 64]);
      add(24.7, () => fig(2, 20.6, { robe: [108, 108, 116], col: [60, 150, 150], hood: 1, dir: 1 })); drawAll(); stubE(r, 20.2); low(r[0], r[3] - T, 6, T, 5); }
    // Cloister yard: well, graves, a brazier, two monks talking
    Z = 0;
    { add(12 + 11.2 + 2.8, () => { box(11.7, 10.7, 0, 1.6, 1.6, 6, (u, v) => (u > 3 && u < 13 && v > 3 && v < 13) ? [30, 40, 66] : SNOW, (u, z) => stone(u, z, GRY, 5, 3), (u, z) => sh(stone(u, z, GRY, 5, 3), .8)); box(11.75, 11.4, 6, .2, .2, 13, TIM, TIM, TIMD); box(13.05, 11.4, 6, .2, .2, 13, TIM, TIM, TIMD); box(11.6, 11.05, 19, 1.8, .9, 3, SNOW, roofTile, sh(TIL[0], .8)); });
      for (const [x, y] of [[16.5, 9], [17.9, 9.2], [19.2, 9], [16.7, 13.6], [18.2, 13.8]]) add(x + y + .5, () => { box(x - .35, y, 0, .9, .5, 2, SNOW, [214, 224, 238], [196, 208, 228]); const [sx, sy] = iso(x, y + .1); for (let j = 1; j < 10; j++) px(sx, sy - j, j > 8 ? SNOW : GRY[1]); for (let i = -2; i <= 2; i++) px(sx + i, sy - 7, i === 0 ? GRY[1] : GRY[3]); px(sx - 2, sy - 8, SNOW); px(sx + 2, sy - 8, SNOW); });
      add(9 + 14.4 + .8, () => { box(8.7, 14.1, 0, .6, .6, 5, [60, 52, 50], [70, 62, 62], [52, 46, 46]); const [sx, sy] = iso(9, 14.4, 5); for (const [i, j, c] of [[0, -1, [255, 226, 140]], [-1, 0, [246, 156, 62]], [0, 0, [255, 200, 100]], [1, 0, [246, 156, 62]], [0, -2, [246, 156, 62]], [1, -3, [206, 84, 44]]]) px(sx + i, sy + j, c); lights.push([sx, sy, 46, 1]); });
      add(24.6, () => fig(9.9, 14.6, { robe: [112, 78, 52], col: [226, 120, 60], tons: 1, dir: -1 })); add(22.9, () => fig(8.1, 14.7, { robe: [58, 56, 66], col: [210, 110, 150], hood: 1, dir: 1 }));
      for (const [x, y, k] of [[20, 16.5, 1], [15.5, 17.6, 3], [19.6, 18.2, 2]]) add(x + y, () => tree(x, y, k)); drawAll();
      const front = []; for (let i = 0; i < 16; i++) { front.push([29.3 + hs(i, 5) * 1.6, 5.5 + i * 1.25, i]); front.push([7 + i * 1.5, 24 + hs(i, 6) * 1.6 - Math.max(0, i - 9) * 1.25, i + 1]); } front.filter(t => t[0] + t[1] < 46).sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(t => tree(...t)); }
    // ---- light: night outside, lamplight inside (dithered steps so it stays pixel art)
    const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, bay = BAY[y & 3][x & 3] / 16; let l = 0, lo = 0; for (const [lx, ly, lr, out] of lights) { const d = Math.hypot(x - lx, (y - ly) * 1.5) / lr; if (d < 1) { if (out) lo = Math.max(lo, 1 - d); else l = Math.max(l, 1 - d); } }
      if (zone[y * W + x]) { const q = Math.min(1, Math.floor((l + bay * .2) * 5) / 5), f = .8 + q * .3; buf[i] *= f + q * .05; buf[i + 1] *= f; buf[i + 2] *= f - q * .1 + .02; }
      else if (buf[i] > 14 || buf[i + 2] > 31) { const q = Math.min(1, Math.floor((lo + bay * .25) * 4) / 4), c = [buf[i] * .5 + 8, buf[i + 1] * .58 + 14, buf[i + 2] * .8 + 28], h = [Math.min(255, buf[i] * 1.02 + 16), buf[i + 1] * .9 + 6, buf[i + 2] * .66]; for (let k = 0; k < 3; k++) buf[i + k] = c[k] + (h[k] - c[k]) * q; if (hs(x, y) < .012) { buf[i] = 240; buf[i + 1] = 245; buf[i + 2] = 252; } }
      else if (hs(x, y) < .006) { buf[i] = 150; buf[i + 1] = 165; buf[i + 2] = 200; } }
    const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').putImageData(new ImageData(buf, W, H), 0, 0);
    const out = document.createElement('canvas'); out.width = W * K; out.height = H * K; const g = out.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W * K, H * K);
    await document.fonts.ready; g.font = '600 17px "Pixelify Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [n, x, y] of [['Bell Tower', 3.6, 5.2], ['Chapel', 12.5, 5.6], ['Scriptorium', 20, 5.6], ['Infirmary', 26.4, 5.6], ['Refectory', 5.4, 11.6], ['Larder', 5.4, 16.8], ['Gatehouse', 5.4, 22], ['Cloister', 13.6, 14]]) { const [sx, sy] = iso(x, y), w = g.measureText(n).width + 16, X = sx * K, Y = sy * K; g.fillStyle = 'rgba(14,18,30,.84)'; g.fillRect(Math.round(X - w / 2), Y - 12, Math.round(w), 24); g.fillStyle = '#e9c46a'; g.fillRect(Math.round(X - w / 2), Y + 10, Math.round(w), 2); g.fillStyle = '#f4ecd6'; g.fillText(n, X, Y); }
    return out.toDataURL(); });
  fs.writeFileSync(__dirname + '/art_cutaway2.png', Buffer.from(url.split(',')[1], 'base64')); await b.close(); })();
