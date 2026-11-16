// Monastery, closer and darker: a Diablo II mood. Low ambient light, pools of candle and hearth light, long shadows, heavy vignette.
// Bigger rooms, camera pulled in on the Chapel and the Cloister; figures are volumetric three-quarter-view monks.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } }); p.on('pageerror', e => console.log(e.message)); p.on('console', m => console.log(m.text()));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2500);
  const url = await p.evaluate(async () => {
    const W = 560, H = 364, K = 3, ox = 196, oy = 92;
    const buf = new Uint8ClampedArray(W * H * 4), zone = new Uint8Array(W * H), emis = new Float32Array(W * H), shd = new Uint8Array(W * H); let Z = 0, E = 0;
    const px = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H || !c) return; const i = (y * W + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255; zone[y * W + x] = Z; emis[y * W + x] = E; shd[y * W + x] = 0; };
    const dark = (x, y, f = .5) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H || shd[y * W + x]) return; shd[y * W + x] = 1; const i = (y * W + x) * 4; buf[i] *= f; buf[i + 1] *= f; buf[i + 2] *= f + .04; };
    const hs = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, s = t => t * t * (3 - 2 * t), a = hs(xi, yi), b = hs(xi + 1, yi), c = hs(xi, yi + 1), d = hs(xi + 1, yi + 1); return a + (b - a) * s(fx) + (c - a) * s(fy) + (a - b - c + d) * s(fx) * s(fy); };
    const sh = (c, f) => [c[0] * f, c[1] * f, c[2] * f], mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const iso = (x, y, z = 0) => [ox + (x - y) * 10, oy + (x + y) * 5 - z];
    const col = (c, a, b) => typeof c === 'function' ? c(a, b) : c;
    const box = (x, y, z, w, d, h, top, left, right) => { const xs = [iso(x, y + d)[0], iso(x + w, y)[0]], ys = [iso(x, y, z + h)[1], iso(x + w, y + d, z)[1]];
      for (let sy = Math.max(0, Math.floor(ys[0]) - 1); sy <= Math.min(H - 1, ys[1] + 1); sy++) for (let sx = Math.max(0, Math.floor(xs[0]) - 1); sx <= Math.min(W - 1, xs[1] + 1); sx++) { const dx = sx + .5 - ox, dy0 = sy + .5 - oy;
        let dy = dy0 + z + h, gx = (dx / 10 + dy / 5) / 2, gy = (dy / 5 - dx / 10) / 2;
        if (gx >= x && gx < x + w && gy >= y && gy < y + d) { px(sx, sy, col(top, (gx - x) * 10, (gy - y) * 10)); continue; }
        gx = dx / 10 + y + d; if (gx >= x && gx < x + w) { const zq = (gx + y + d) * 5 - dy0; if (zq >= z && zq < z + h) { px(sx, sy, col(left, (gx - x) * 10, zq - z)); continue; } }
        gy = x + w - dx / 10; if (gy >= y && gy < y + d) { const zq = (x + w + gy) * 5 - dy0; if (zq >= z && zq < z + h) px(sx, sy, col(right, (gy - y) * 10, zq - z)); } } };
    // ---- palette: the reference sheet's plaster, timber and tile, aged and dirtied
    const PL = [196, 184, 158], TIM = [128, 96, 64], TIMD = [88, 64, 40], TIL = [[112, 60, 48], [124, 72, 60], [130, 80, 68]], STN = [[150, 138, 120], [138, 126, 110], [122, 112, 100]], GRY = [[112, 110, 108], [100, 100, 100], [94, 98, 108], [120, 120, 124]], SNOW = [226, 234, 246];
    const stone = (u, z, pal, bw = 9, bh = 5) => { const r = Math.floor(z / bh), o = (r % 2) * bw / 2, k = Math.floor((u + o) / bw); if (Math.floor(z) % bh === bh - 1 || Math.floor(u + o) % bw === 0) return sh(pal[2], .62); const top = Math.floor(z) % bh === bh - 2 ? 1.1 : 1; return sh(pal[Math.floor(hs(k, r) * pal.length)], (.86 + hs(k + 3, r) * .2 + (hs(Math.floor(u), Math.floor(z)) - .5) * .08) * top); };
    const GLS = [[176, 46, 44], [48, 80, 160], [214, 164, 60], [58, 124, 86], [128, 60, 140], [200, 210, 230]];
    const D = {
      glass: (u, z) => ({ u, z, w: 20, h: 44, f: (a, c) => { a |= 0; c |= 0; const lim = c >= 30 ? Math.sqrt(Math.max(0, 196 - (c - 30) * (c - 30))) * .72 : 10; if (Math.abs(a - 9.5) > lim) return null; E = 0; if (Math.abs(a - 9.5) > lim - 1.5 || c < 2) return sh(GRY[1], .8); if (a === 9 || a === 10 || c % 6 === 0 || (a + Math.floor(c / 6) * 2) % 5 === 0) return [30, 28, 36]; E = .36; if (c >= 30 && Math.hypot(a - 9.5, c - 34) < 4) return GLS[2]; return GLS[Math.floor(hs(Math.floor((a + Math.floor(c / 6) * 2) / 5) + u, Math.floor(c / 6)) * 6)]; } }),
      hearth: (u) => ({ u, z: 0, w: 36, h: 34, f: (a, c) => { a |= 0; c |= 0; E = 0; if (a < 5 || a > 30 || c > 25) return c > 29 ? TIMD : stone(a, c, GRY, 7, 4); if (c < 13 && Math.abs(a - 17.5) < 9 - c * .66 + Math.sin(a * 1.7) * 1.2) { E = 1; return c < 3 ? [255, 232, 150] : c < 7 ? [248, 160, 60] : [208, 80, 40]; } if (c < 3) return [60, 40, 30]; return [22, 16, 16]; } }),
      cross: (u, z) => ({ u, z, w: 9, h: 18, f: (a, c) => { a |= 0; c |= 0; return (a === 4 || a === 3) ? (a === 3 ? [120, 92, 50] : [176, 140, 70]) : (c === 12 || c === 11) ? (c === 11 ? [120, 92, 50] : [176, 140, 70]) : null; } }),
      sconce: (u, z) => ({ u, z, w: 5, h: 9, f: (a, c) => { a |= 0; c |= 0; E = 0; if (c < 2) return [70, 62, 56]; if (a === 2 && c < 6) return [226, 216, 190]; if (a === 2 && c < 9) { E = 1; return c === 6 ? [255, 190, 80] : [255, 240, 170]; } return null; } }),
      slit: (u, z) => ({ u, z, w: 4, h: 14, f: (a) => { a |= 0; return a === 0 || a === 3 ? sh(GRY[1], .6) : [16, 22, 44]; } }),
      win: (u, z) => ({ u, z, w: 12, h: 20, f: (a, c) => { a |= 0; c |= 0; if (c >= 16 && Math.abs(a - 5.5) > (20 - c) * 1.2 + .6) return null; if (a === 0 || a === 11 || c < 2 || c === 19 || (c >= 16 && Math.abs(a - 5.5) > (19 - c) * 1.2 + .6)) return TIMD; return ((a + c) % 4 === 0 || (a - c + 40) % 4 === 0) ? [60, 74, 110] : [18, 24, 48]; } }),
      shelf: (u, z, w, h, pal) => ({ u, z, w, h, f: (a, c) => { a |= 0; c |= 0; if (a === 0 || a === w - 1 || c % 8 === 0 || c === h - 1) return TIM; const k = Math.floor(a / 2), r = Math.floor(c / 8), hh = 3 + Math.floor(hs(k + u, r) * 5); if (c % 8 > hh || hs(k + u, r + 9) < .15) return [44, 32, 24]; return sh(pal[Math.floor(hs(k + u * 3, r + 5) * pal.length)], .8); } }),
    };
    const JAR = [[170, 150, 104], [130, 96, 70], [100, 120, 96], [180, 170, 146], [150, 80, 62]];
    const wall = (len, Hh, decals, pal, f = 1) => (u, z) => { E = 0; for (const d of decals) if (u >= d.u && u < d.u + d.w && z >= d.z && z < d.z + d.h) { const c = d.f(u - d.u, z - d.z); if (c) return E ? c : sh(c, f); }
      let c; const g = vn(u / 13 + len, z / 9), grime = .74 + vn(u / 31, z / 17 + 3) * .32;
      if (pal) c = sh(stone(u, z, pal), grime); else if (z < 13) c = sh(stone(u, z, STN, 10, 4), .9); else if (z >= Hh - 4) c = (Math.floor(z) === Math.floor(Hh - 4)) ? sh(TIMD, .7) : sh(TIM, .9 + (Math.floor(u) % 4 === 0 ? -.1 : 0)); else if (g > .66) c = sh(stone(u, z, STN, 10, 4), .8); else if (g > .62) c = sh(PL, .62); else { c = sh(PL, grime * (.97 + hs(Math.floor(u), Math.floor(z)) * .05)); if (z < 22) c = sh(c, .78 + (z - 13) * .02); if (z > Hh - 12) c = sh(c, .8); if (hs(Math.floor(u / 2), 7) < .08 && z < Hh - 8 && z > Hh - 8 - hs(Math.floor(u / 2), 3) * 30) c = sh(c, .84); }
      return sh(c, f); };
    const roofTile = (u, z) => { const r = Math.floor(z / 2); return Math.floor(u + r * 2) % 5 === 0 ? sh(TIL[0], .7) : TIL[(r + Math.floor(hs(Math.floor((u + r * 2) / 5), r) * 2)) % 3]; };
    const capTop = [60, 52, 44];
    // ---- rooms (bigger than before)
    const WH = 74, T = .4;
    const RM = { tower: [0, 0, 9, 9], chapel: [9, 0, 27, 10], refect: [0, 9, 9, 21] }, WINX = [11.9, 17.5, 23.1];
    const inR = (r, x, y) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3]; let EF = 0;
    const floorAt = (x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)); let c, r; EF = 0; const wear = .78 + vn(x * .9, y * .9) * .3;
      const flag = (pal, s) => { const X = x / s, Y = y / s + (Math.floor(X) % 2) * .5, e = (X - Math.floor(X)) < .09 / s || (Y - Math.floor(Y)) < .09 / s; return e ? sh(pal[2], .55) : sh(pal[Math.floor(hs(Math.floor(X), Math.floor(Y)) * pal.length)], (.9 + n * .1) * wear); };
      if (inR(r = RM.chapel, x, y)) { const X = x - .5, fx = X - Math.floor(X), fy = y - Math.floor(y); c = sh(((Math.floor(X) + Math.floor(y)) % 2 ? [168, 158, 140] : [112, 104, 98]), (.92 + n * .1) * wear); if (fx < .08 || fy < .08) c = sh(c, .6);
        if (y > 4.3 && y < 5.7 && x > 14) { const fr = (y < 4.5 || y > 5.5); c = sh(fr ? [170, 136, 66] : ((Math.floor(x * 2) + Math.floor(y * 5)) % 7 === 0 ? [96, 28, 30] : [124, 36, 38]), (.9 + n * .12) * (.8 + vn(x, y * 3) * .25)); }
        if (x < 14 && x > 9.6 && y > 2.6 && y < 7.4) c = sh(flag(GRY, 1.3), 1.08);
        for (const wx of WINX) { const yy = y - 1.2, cx = wx + 1 + yy * .5; if (yy > 0 && yy < 4.6 && Math.abs(x - cx) < 1 - Math.max(0, yy - 3.2) * .5) { const q = hs(Math.floor((x - yy * .5) * 2.2 + wx), Math.floor(yy * 1.6)); if ((Math.floor((x - yy * .5) * 11) % 5) && (Math.floor(yy * 8) % 5)) { c = mix(c, GLS[Math.floor(q * 6)], .22); EF = .2; } } } }
      else if (inR(r = RM.refect, x, y)) c = flag(STN, 1.5);
      else if (inR(r = RM.tower, x, y)) c = flag(GRY, 1.2);
      else return null;
      const ao = Math.min(x - r[0], y - r[1]); if (ao < 1) c = sh(c, .62 + ao * .38); return c; };
    const groundAt = (x, y) => { const n = hs(Math.floor(x * 10), Math.floor(y * 10)), drift = vn(x * .5, y * 1.4); let c = mix([170, 184, 208], SNOW, drift * .75 + n * .25);
      if (x >= 9 && y >= 10) { const dp = Math.min(Math.abs(y - 15.6), Math.abs(x - 17.5), x < 11.4 || y < 11.6 ? 0 : 9); if (dp < 1 + vn(x * 2, y * 2) * .5) { const X = x * 1.5, Y = y * 1.5 + (Math.floor(X) % 2) * .5, e = (X % 1) < .12 || (Y % 1) < .12; c = vn(x * 3, y * 3) > .8 ? sh(c, .92) : e ? [96, 98, 110] : sh(GRY[Math.floor(hs(Math.floor(X) + 5, Math.floor(Y)) * 4)], 1.2 + n * .08); } else if (hs(Math.floor(x * 3), Math.floor(y * 6)) < .04) c = sh(c, .86); const ao = Math.min(x - 9, y - 10); if (ao < 1.2) c = sh(c, .6 + ao * .33); }
      return c; };
    for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) { const dx = sx + .5 - ox, dy = sy + .5 - oy, x = (dx / 10 + dy / 5) / 2, y = (dy / 5 - dx / 10) / 2; const f = floorAt(x, y); if (f) { Z = 1; E = EF; px(sx, sy, f); continue; } Z = 0; E = 0; px(sx, sy, groundAt(x, y)); }
    // ---- snowy pines from Civ Sim
    const treeData = SPRITES.tree.slice(5, 10).map(sp => { const c = document.createElement('canvas'); c.width = sp.w; c.height = sp.h; const g = c.getContext('2d'); g.drawImage(sp.img, 0, 0); const d = g.getImageData(0, 0, sp.w, sp.h), a = d.data, ls = []; for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 128) ls.push(a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1); ls.sort((p, q) => p - q); const c1 = ls[(ls.length * .55) | 0], c2 = ls[(ls.length * .8) | 0];
      for (let i = 0; i < a.length; i += 4) { const l = a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1, py = (i / 4 / sp.w) | 0; if (a[i + 3] > 128 && l > c1 && py < sp.h * .82) { const m = l > c2 ? .92 : .6; a[i] += (226 - a[i]) * m; a[i + 1] += (234 - a[i + 1]) * m; a[i + 2] += (246 - a[i + 2]) * m; } else { a[i] *= .7; a[i + 1] *= .72; a[i + 2] *= .78; } } return { sp, a }; });
    const tree = (x, y, k) => { const t = treeData[k % treeData.length], [sx, sy] = iso(x, y); Z = 0; E = 0; for (let t2 = 0; t2 < 30; t2++) for (let w = -5 + t2 * .15; w <= 5 - t2 * .15; w++) dark(sx + t2 * 1.2 + w * .5, sy + t2 * .35 + w * .5, .6); for (let j = 0; j < t.sp.h; j++) for (let i = 0; i < t.sp.w; i++) { const q = (j * t.sp.w + i) * 4; if (t.a[q + 3] > 128) px(sx + t.sp.ox + i, sy + t.sp.oy + j, [t.a[q], t.a[q + 1], t.a[q + 2]]); } };
    const back = []; for (let i = 0; i < 30; i++) { back.push([-1.6 - hs(i, 1) * 2.4, -3 + i * 1.1 + hs(i, 2) * .5, i]); back.push([-3 + i * 1.3 + hs(i, 3) * .5, -1.6 - hs(i, 4) * 2.4, i + 2]); }
    back.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(t => tree(...t));
    // ---- figures: three-quarter view, shaded as volumes, long shadow thrown away from the nearest flame
    const lights = [];
    const fig = (x, y, o) => { const [fx0, fy0] = iso(x, y), fx = Math.round(fx0), fy = Math.round(fy0), f = o.dir || 1, sd = o.sh || [1, .3], rb = o.robe, Hh = 46; E = 0;
      for (let t = 0; t < 34; t++) { const w = 5 - t * .11; for (let k = -w; k <= w; k++) dark(fx + sd[0] * t + k, fy + sd[1] * t + k * .35 * (sd[0] > 0 ? -1 : 1), .45); }
      for (let j = 0; j < Hh; j++) { let hw = j < 10 ? [2.2, 3.2, 3.9, 4.3, 4.5, 4.5, 4.4, 4.2, 3.9, 3.7][j] : j < 14 ? 4 + (j - 9) * .9 : j < 28 ? 7.4 + (j >= 17 && j <= 25 ? .9 : 0) - (j > 25 ? .6 : 0) : 6.6 + (j - 28) * .12; const cx = j < 10 ? f * .6 : 0;
        for (let i = -9; i <= 9; i++) { const q = i - cx; if (Math.abs(q) > hw) continue; const nx = q / hw; let l = .66 - nx * .3 * (o.lit || 1) + (j < 3 ? .08 : 0); let c = rb;
          if (j >= 28 && ((i + 20) % 3 === 0 || hs(i, 4) < .2 && j > 34)) l -= .13; if (j >= 14 && j < 27 && Math.abs(Math.abs(q) - (hw - 2.6)) < .5) l -= .18; if (Math.abs(nx) > .8) l -= .22; if (j === Hh - 1) l -= .2; if (j > 9 && j < 13) l -= .08;
          if (j >= 12 && j <= 41 && Math.abs(i - f * 1.4) <= 1.6) { c = o.col; if (Math.abs(i - f * 1.4) > 1) l -= .15; }
          if (j === 27) { c = [150, 132, 96]; }
          if (j >= 21 && j <= 23 && Math.abs(i - f * 1.4) <= 1.6) { c = [176, 138, 106]; l = .7 - (j === 23 ? .15 : 0); }
          if (o.hood) { if (j >= 3 && j <= 8 && Math.abs(q - f * 1.2) <= 1.8) { c = j < 6 ? [26, 20, 20] : [150, 114, 88]; l = j < 6 ? 1 : (j === 8 ? .5 : .66); } }
          else if (j < 10) { c = [186, 146, 112]; if (j < 2 || (j < 5 && Math.abs(q + f * 2) < 2.6) || (j < 4 && Math.abs(nx) > .5)) c = o.hair || [70, 56, 44]; if (j === 0 && Math.abs(q) < 1.2) c = [186, 146, 112]; if (j === 5 && Math.abs(q - f * 1.6) < 1.4 && (i & 1)) { c = [30, 22, 20]; } if (j >= 7 && o.beard && Math.abs(q - f) < 2.4) c = o.beard; }
          l = Math.max(.18, Math.round(l * 9) / 9); px(fx + i, fy - Hh + 1 + j, sh(c, l)); } } };
    // ---- furniture
    const things = []; const add = (k, f) => things.push([k, f]);
    const B = (x, y, z, w, d, h, c, tf) => add(x + w + y + d + z * .01, () => { E = 0; box(x, y, z, w, d, h, tf || sh(c, 1.1), sh(c, .8), sh(c, .58)); });
    const flame = (sx, sy, r, I) => { E = 1; px(sx, sy, [255, 190, 80]); px(sx, sy - 1, [255, 240, 170]); px(sx, sy - 2, [255, 200, 110]); E = 0; lights.push([sx, sy + 4, r, I]); };
    const candle = (x, y, z, r = 44, I = .9) => add(x + y + .2 + z * .01, () => { const [sx, sy] = iso(x, y, z); E = 0; px(sx, sy - 1, [226, 216, 190]); px(sx, sy - 2, [226, 216, 190]); px(sx, sy - 3, [240, 230, 200]); flame(sx, sy - 4, r, I); });
    const stand = (x, y, r = 70) => add(x + y + .3, () => { const [sx, sy] = iso(x, y); E = 0; for (let j = 0; j < 20; j++) px(sx, sy - j, j % 6 === 5 ? [150, 120, 60] : [96, 76, 40]); for (let i = -2; i <= 2; i++) { px(sx + i, sy, [80, 62, 34]); px(sx + i, sy - 20, [150, 120, 60]); } for (const i of [-2, 0, 2]) { px(sx + i, sy - 21, [226, 216, 190]); px(sx + i, sy - 22, [226, 216, 190]); } flame(sx - 2, sy - 23, 0, 0); flame(sx + 2, sy - 23, 0, 0); flame(sx, sy - 23, r, 1.05); });
    const drawAll = () => { things.sort((a, b) => a[0] - b[0]).forEach(t => t[1]()); things.length = 0; };
    const backN = (r, Hh, decals, pal) => { box(r[0] - T, r[1] - T, 0, r[2] - r[0] + T, T, Hh, capTop, wall(r[2] - r[0], Hh, decals.map(d => ({ ...d, u: d.u + T * 10 })), pal), sh(pal ? pal[1] : PL, .4)); E = 0; if (!pal) { box(r[0] - T, r[1] - T - .3, Hh, r[2] - r[0] + T, T + .6, 7, roofTile, roofTile, sh(TIL[0], .6)); box(r[0] - T, r[1] - T - .3, Hh + 7, r[2] - r[0] + T, T + .4, 3, SNOW, SNOW, [170, 184, 208]); } };
    const backW = (r, Hh, decals, pal) => { box(r[0] - T, r[1] - T, 0, T, r[3] - r[1] + T, Hh, capTop, sh(pal ? pal[1] : PL, .4), wall(r[3] - r[1], Hh, decals.map(d => ({ ...d, u: d.u + T * 10 })), pal, .74)); E = 0; if (!pal) { box(r[0] - T - .3, r[1] - T, Hh, T + .6, r[3] - r[1] + T, 7, sh(TIL[1], .8), sh(TIL[0], .6), (u, z) => sh(roofTile(u, z), .74)); box(r[0] - T - .3, r[1] - T, Hh + 7, T + .4, r[3] - r[1] + T, 3, SNOW, SNOW, [170, 184, 208]); } };
    const low = (x, y, w, d, h = 9) => { E = 0; box(x, y, 0, w, d, h, (u, v) => sh([150, 140, 124], .9 + hs(Math.floor(u / 4), Math.floor(v / 4)) * .15), (u, z) => sh(stone(u, z, STN, 10, 4), .7), (u, z) => sh(stone(u, z, STN, 10, 4), .5)); };
    Z = 1;
    { const r = RM.tower, TH = 170; backN(r, TH, [D.slit(40, 40)], GRY); backW(r, TH, [D.slit(40, 40)], GRY);
      B(1, 5.6, 0, 1.4, 1.4, 10, [112, 84, 56]); B(1.3, 5.9, 10, 1, 1, 7, [128, 96, 64]); B(5.8, 1, 0, 1.2, 1.2, 9, [112, 84, 56]); add(9.4, () => { const [fx, fy] = iso(4.5, 4.5); for (let j = 0; j < fy - 12; j++) px(fx + (j % 9 < 4 ? 0 : 1), j, [150, 134, 100]); }); candle(2, 2, 0, 50, .8);
      add(11.2, () => fig(5.4, 5.2, { robe: [70, 66, 74], col: [60, 110, 170], hood: 1, dir: -1, sh: [1, .45] })); drawAll(); }
    { const r = RM.chapel; backN(r, WH, [D.glass(19, 20), D.sconce(49, 30), D.cross(60, 34), D.glass(75, 20), D.sconce(105, 30), D.cross(116, 34), D.glass(131, 20), D.sconce(161, 30)]); for (const u of [49, 105, 161]) { const [sx, sy] = iso(9 + u / 10 + .7, .4, 28); lights.push([sx, sy, 62, .7]); } low(r[0] - T, r[1], T, 10, 11);
      B(10, 3, 0, 3.6, 4, 2, [120, 114, 108]); B(10.7, 3.7, 2, 1.5, 2.6, 11, [150, 142, 128], (u, v) => (v < 3 || v > 22) ? [140, 40, 40] : [214, 206, 188]); add(15.3, () => { const [sx, sy] = iso(11.45, 5, 13); E = 0; for (let j = 0; j < 12; j++) { px(sx, sy - j, [196, 156, 70]); px(sx + 1, sy - j, [130, 100, 44]); } for (let i = -3; i <= 4; i++) px(sx + i, sy - 8, [196, 156, 70]); }); candle(11.4, 4.1, 13, 40, .7); candle(11.4, 5.9, 13, 40, .7); stand(10.6, 2.6, 80); stand(10.6, 7.4, 80);
      for (const x of [15.4, 17.4, 19.4, 21.4, 23.4]) for (const y of [.9, 6.1]) { B(x, y, 0, .7, 3, 5, [104, 76, 48]); B(x + .58, y, 5, .14, 3, 5, [88, 64, 40]); }
      stand(25.6, 1.2, 60); stand(25.6, 8.6, 60);
      add(21.2, () => fig(14.4, 5.1, { robe: [176, 168, 150], col: [176, 140, 60], hair: [130, 130, 130], dir: 1, sh: [1, .12] })); add(24.4, () => fig(17.3, 5.5, { robe: [96, 66, 44], col: [170, 50, 46], hood: 1, dir: -1, sh: [1, .25] })); add(27.2, () => fig(22.6, 4.6, { robe: [54, 52, 62], col: [60, 136, 84], hood: 1, dir: -1, sh: [-1, .3] })); drawAll();
      const y = r[3] - T; low(r[0], y, 7, T, 7); low(17.6, y, 9.4, T, 7); low(r[2] - T, r[1], T, 10, 7); for (const x of [9, 15.7, 17.6, 26.5]) { E = 0; box(x, y - .1, 0, .6, .6, 16, [150, 140, 124], (u, z) => sh(stone(u, z, STN, 6, 4), .7), (u, z) => sh(stone(u, z, STN, 6, 4), .5)); box(x - .05, y - .15, 16, .7, .7, 2, SNOW, [190, 200, 220], [160, 172, 196]); } }
    { const r = RM.refect; backW(r, WH, [D.win(10, 26), D.hearth(42), D.win(94, 26)]); { const [sx, sy] = iso(.8, 15, 4); lights.push([sx + 4, sy, 120, 1.25]); } low(r[0], r[1] - T, 9, T, 11);
      B(4, 11, 9, 1.6, 7, 2, TIM); for (const [x, y] of [[4.1, 11.1], [5.3, 11.1], [4.1, 17.7], [5.3, 17.7]]) B(x, y, 0, .25, .25, 9, TIMD); B(3, 11.3, 0, .6, 6.4, 5, TIMD); B(6, 11.3, 0, .6, 6.4, 5, TIMD);
      for (const y of [12, 13.6, 15.2, 16.8]) add(5 + y + .09, () => { const [sx, sy] = iso(4.8, y, 11); E = 0; px(sx, sy, [170, 160, 136]); px(sx + 1, sy, [170, 160, 136]); px(sx - 1, sy, [120, 110, 90]); px(sx, sy - 1, [130, 112, 80]); }); candle(4.8, 12.8, 11, 46, .8); candle(4.8, 16, 11, 46, .8);
      add(23.3, () => fig(7.3, 15.6, { robe: [96, 66, 44], col: [200, 150, 50], beard: [80, 56, 40], dir: -1, sh: [1, .1] })); drawAll(); const x = r[2] - T; low(x, r[1], T, 3, 7); low(x, 14.2, T, 6.8, 7); }
    // Cloister
    Z = 0; E = 0;
    { add(17.5 + 15.6 + 3, () => { E = 0; box(16.5, 14.6, 0, 2, 2, 8, (u, v) => (u > 4 && u < 16 && v > 4 && v < 16) ? [10, 14, 30] : SNOW, (u, z) => stone(u, z, GRY, 6, 3), (u, z) => sh(stone(u, z, GRY, 6, 3), .6)); box(16.6, 15.5, 8, .25, .25, 16, TIM, TIM, TIMD); box(18.15, 15.5, 8, .25, .25, 16, TIM, TIM, TIMD); box(16.4, 15.1, 24, 2.2, 1.1, 4, SNOW, roofTile, sh(TIL[0], .6)); });
      for (const [x, y] of [[22.6, 12.4], [24.3, 12.7], [26, 12.3], [23, 18], [25, 18.4], [21.4, 20.4]]) add(x + y + .5, () => { E = 0; box(x - .5, y, 0, 1.3, .7, 2, SNOW, [190, 200, 220], [160, 172, 196]); const [sx, sy] = iso(x, y + .2); for (let t = 0; t < 14; t++) dark(sx + t, sy + t * .3, .6); for (let j = 1; j < 14; j++) { px(sx, sy - j, GRY[1]); px(sx + 1, sy - j, sh(GRY[1], .6)); } for (let i = -3; i <= 4; i++) { px(sx + i, sy - 10, GRY[3]); px(sx + i, sy - 9, sh(GRY[1], .6)); } px(sx - 3, sy - 11, SNOW); px(sx - 2, sy - 11, SNOW); px(sx + 3, sy - 11, SNOW); px(sx + 4, sy - 11, SNOW); px(sx, sy - 14, SNOW); px(sx + 1, sy - 14, SNOW); });
      add(12.4 + 18.6 + 1, () => { E = 0; box(12, 18.2, 0, .8, .8, 7, [40, 34, 32], [56, 50, 50], [36, 32, 32]); const [sx, sy] = iso(12.4, 18.6, 7); E = 1; for (const [i, j, c] of [[0, -1, [255, 226, 140]], [-1, 0, [246, 156, 62]], [0, 0, [255, 200, 100]], [1, 0, [246, 156, 62]], [0, -2, [246, 156, 62]], [1, -3, [206, 84, 44]], [-1, -1, [255, 190, 90]], [1, -1, [255, 190, 90]], [0, -3, [246, 156, 62]]]) px(sx + i, sy + j, c); E = 0; lights.push([sx, sy + 6, 84, 1.15]); });
      add(33.6, () => fig(13.9, 19, { robe: [96, 66, 44], col: [196, 100, 44], hair: [60, 44, 34], dir: -1, sh: [1, .2] })); add(30.4, () => fig(10.9, 18.9, { robe: [54, 52, 62], col: [170, 80, 120], hood: 1, dir: 1, sh: [-1, .15] }));
      // a body under a shroud by the well, and the tracks that lead away from it
      add(19.6 + 17.4 + .9, () => { E = 0; const [sx, sy] = iso(19.6, 17.2); for (let i = -9; i <= 9; i++) for (let j = -3; j <= 2; j++) { const hgt = 3 - Math.abs(i) * .12 - Math.abs(j) * .7 + (i < -5 ? 1 : 0); if (hgt > 0) px(sx + i + j, sy + j + i * .5 - hgt, sh([170, 160, 146], .6 + hgt * .12 - (j > 0 ? .2 : 0))); } for (let k = 0; k < 40; k++) { const a = hs(k, 9) * 6.28, r = hs(k, 5) * 9; px(sx + 2 + Math.cos(a) * r * 1.4, sy + 5 + Math.sin(a) * r * .6, [96, 22, 26]); } });
      for (let k = 0; k < 22; k++) add(0, () => { const [sx, sy] = iso(20.6 + k * .42, 17.6 + k * .33 + (k % 2) * .35); px(sx, sy, [128, 142, 170]); px(sx + 1, sy, [128, 142, 170]); px(sx, sy + 1, [150, 162, 188]); });
      for (const [x, y, k] of [[26.5, 21, 1], [15.6, 23.4, 3], [28.6, 16.6, 2], [23.4, 25, 4], [10.4, 25.5, 2], [19.4, 27.4, 0], [30, 22, 3], [31.4, 12, 1], [29.6, 8.6, 4], [14, 29, 1], [26.6, 28, 2]]) add(x + y, () => tree(x, y, k)); drawAll(); }
    // ---- light. Dark by default; flames carve warm pools out of it. Stepped so it stays pixel art.
    const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, k = y * W + x, bay = BAY[y & 3][x & 3] / 16; let l = 0; for (const [lx, ly, lr, I] of lights) { if (!lr) continue; const d = Math.hypot(x - lx, (y - ly) * 1.7) / lr; if (d < 1) l += I * (1 - d) * (1 - d); }
      l = Math.min(1.25, l); const q = Math.floor(l * 9 + bay) / 9, e = emis[k], out = !zone[k];
      const amb = out ? [.2, .27, .46] : [.2, .19, .25], f = [amb[0] + q * 1.12, amb[1] + q * .82, amb[2] + q * .5];
      const v = 1 - Math.min(1, Math.pow(Math.hypot((x - W * .5) / (W * .64), (y - H * .52) / (H * .66)), 2.6)) * .9;
      for (let c = 0; c < 3; c++) buf[i + c] = buf[i + c] * Math.max(f[c] * v, e * (.6 + v * .4));
      if (out && hs(x, y) < .0028) { const s = .3 + v * .4; buf[i] = 190 * s; buf[i + 1] = 200 * s; buf[i + 2] = 225 * s; if (i > 4 * W) { buf[i - 4 * W + 4] = 120 * s; buf[i - 4 * W + 5] = 132 * s; buf[i - 4 * W + 6] = 160 * s; } } }
    const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').putImageData(new ImageData(buf, W, H), 0, 0);
    const out = document.createElement('canvas'); out.width = W * K; out.height = H * K; const g = out.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W * K, H * K);
    return out.toDataURL(); });
  fs.writeFileSync(__dirname + '/art_dark.png', Buffer.from(url.split(',')[1], 'base64')); await b.close(); })();
