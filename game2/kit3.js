// Game 2 art kit v3. Figures follow GANK's own sheet: tall and slim (about 8 heads), narrow square shoulders, cloth that hangs
// straight, small oval heads, flat 3-4 tone shading with vertical folds. Cross-sections are superellipses, so bodies read as
// cloth over a frame rather than turned wood. One model gives eight facings and every pose. Deterministic: no Math.random.
(function () {
  const hs = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (base, t) => { const k = Math.max(0, Math.min(3, Math.floor(t * 4))), f = [.5, .72, .92, 1.1][k]; let c = [base[0] * f, base[1] * f, base[2] * f]; if (k === 0) c = mix(c, [30, 24, 50], .22); if (k === 3) c = mix(c, [255, 236, 200], .1); return c; };
  const LN = (() => { const v = [-.1, .9, .65], n = Math.hypot(...v); return v.map(q => q / n); })();
  class Surf { constructor(w, h, ax, ay) { this.w = w; this.h = h; this.ax = ax; this.ay = ay; this.z = new Float32Array(w * h).fill(-1e9); this.c = new Uint8ClampedArray(w * h * 4); this.tv = new Float32Array(w * h); this.bc = new Int32Array(w * h).fill(-1); this.cs = 1; this.sn = 0; this.tc = 1; this.ts = 0; this.lift = 0; this.k = 1; this.st = .4; }
    scale(k) { this.k = k; this.st = .4 / k; }
    face(rot) { this.cs = Math.cos(rot); this.sn = Math.sin(rot); } tilt(a, lift = 0, slide = 0) { this.tc = Math.cos(a); this.ts = Math.sin(a); this.lift = lift; this.slide = slide; }
    pt(X, Y, Z, nx, ny, nz, base, bias = 0) { if (this.ts) { const X2 = X * this.tc - Z * this.ts + (this.slide || 0), Z2 = X * this.ts + Z * this.tc + this.lift, n2 = nx * this.tc - nz * this.ts; nz = nx * this.ts + nz * this.tc; nx = n2; X = X2; Z = Z2; }
      if (this.k !== 1) { X *= this.k; Y *= this.k; Z *= this.k; }
      const x = X * this.cs - Y * this.sn, y = X * this.sn + Y * this.cs, mx = nx * this.cs - ny * this.sn, my = nx * this.sn + ny * this.cs; const sx = Math.round(this.ax + (x - y) * .7071), sy = Math.round(this.ay + (x + y) * .3536 - Z); if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) return; const d = x + y + Z * .3, k = sy * this.w + sx; if (d <= this.z[k]) return; this.z[k] = d;
      const nl = Math.hypot(mx, my, nz) || 1, l = (mx * LN[0] + my * LN[1] + nz * LN[2]) / nl; this.tv[k] = .52 + l * .42 + bias; this.bc[k] = (base[0] & 255) << 16 | (base[1] & 255) << 8 | (base[2] & 255); this.c[k * 4 + 3] = 255; }
    proj(X, Y, Z) { X *= this.k; Y *= this.k; Z *= this.k; const x = X * this.cs - Y * this.sn, y = X * this.sn + Y * this.cs; return [Math.round(this.ax + (x - y) * .7071), Math.round(this.ay + (x + y) * .3536 - Z)]; }
    // stacked superellipses: a = front-back radius, b = side radius, n = squareness (2 round, 4 boxy)
    ell(z0, z1, a0, b0, a1, b1, mat, cx0 = 0, cx1 = cx0, n = 2) { const dz = z1 - z0 || .01, e = 2 / n, e2 = 2 - 2 / n, sg = v => v < 0 ? -1 : 1; for (let z = z0; z <= z1 + 1e-6; z += this.st) { const t = (z - z0) / dz, a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t, cx = cx0 + (cx1 - cx0) * t, m = Math.ceil(Math.max(a, b) * 6.3 / this.st * (n > 2 ? 1.6 : 1)), slope = ((a0 - a1) + (b0 - b1)) / 2 / dz;
      for (let i = 0; i < m; i++) { const th = i / m * 6.2832, c = Math.cos(th), s = Math.sin(th), X = cx + a * sg(c) * Math.abs(c) ** e, Y = b * sg(s) * Math.abs(s) ** e, mt = mat(th, z, X, Y); if (mt) this.pt(X, Y, z, sg(c) * Math.abs(c) ** e2 / a, sg(s) * Math.abs(s) ** e2 / b, slope / Math.max(a, b) * 1.2, mt[0], mt[1]); } } }
    sph(cx, cy, cz, rx, ry, rz, mat) { const R = Math.max(rx, ry, rz), n = Math.ceil(R * 3.2 / this.st); for (let i = 0; i <= n; i++) { const ph = -1.5708 + i / n * 3.1416, m2 = Math.max(1, Math.ceil(Math.cos(ph) * R * 6.3 / this.st)); for (let j = 0; j < m2; j++) { const th = j / m2 * 6.2832, dx = Math.cos(ph) * Math.cos(th), dy = Math.cos(ph) * Math.sin(th), dz = Math.sin(ph), m = mat(dx, dy, dz); if (m) this.pt(cx + dx * rx, cy + dy * ry, cz + dz * rz, dx / rx, dy / ry, dz / rz, m[0], m[1]); } } }
    tube(p, q, r0, r1, mat) { const len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), n = Math.max(1, Math.ceil(len / this.st)); for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t; this.sph(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t, r, r, r, () => mat); } }
    disk(cx, cy, z, r, mat) { for (let rr = 0; rr <= r; rr += this.st) { const n = Math.max(1, Math.ceil(rr * 6.3 / this.st)); for (let i = 0; i < n; i++) { const th = i / n * 6.2832; this.pt(cx + rr * Math.cos(th), cy + rr * Math.sin(th), z, 0, 0, 1, mat[0], mat[1] - (rr > r - .8 ? .12 : 0)); } } }
    // style pass. clay: smooth ramp (the old look). cel: 3 hard hue-shifted tones, orphan clean-up, selective outline.
    // flat: 2 tones like GANK's sheet, folds as crisp lines, darker selective outline.
    paint(style) { const W = this.w, H = this.h, N = W * H, tone = new Int8Array(N).fill(-1), unp = v => [v >> 16 & 255, v >> 8 & 255, v & 255];
      if (style === 'pre' || style === 'pre2') { const strong = style === 'pre2', k0 = this.k, R = Math.max(2, Math.round(2.5 * k0));
        for (let k = 0; k < N; k++) if (this.bc[k] >= 0) { const b = unp(this.bc[k]), t = Math.max(0, Math.min(1, (this.tv[k] - .1) / .84)), x = k % W, y = (k / W | 0);
          // screen-space occlusion: nearer surfaces around this pixel darken it (creases under arms, inside the hood, between folds)
          let occ = 0, cnt = 0; for (const [dx, dy] of [[R, 0], [-R, 0], [0, R], [0, -R], [R, R], [-R, R], [R, -R], [-R, -R]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= this.h) continue; const q = Y * W + X; cnt++; if (this.bc[q] >= 0 && this.z[q] > this.z[k] + 1.2 * k0) occ++; }
          const ao = 1 - .42 * occ / Math.max(1, cnt);
          let f = (strong ? .1 : .16) + (strong ? 1.28 : 1.1) * Math.pow(t, strong ? 1.5 : 1.25); const floor = Math.max(0, (y - this.ay + 16 * k0) / (18 * k0)); f *= (1 - floor * .4) * ao;
          const warm = [1.07, 1, .9], cool = [.8, .85, 1.14], w = Math.min(1, t * 1.3);
          const c = [0, 1, 2].map(i => b[i] * f * (cool[i] + (warm[i] - cool[i]) * w) + (strong && t > .8 ? (t - .8) * 260 * ao : 0));
          this.c.set(c.map(v => Math.min(255, v)), k * 4); }
        this.edge(strong ? .62 : .75); return; }
      if (style === 'clay') { for (let k = 0; k < N; k++) if (this.bc[k] >= 0) { const c = ramp(unp(this.bc[k]), this.tv[k] + (hs(k % W, k / W | 0) - .5) * .02); this.c.set(c, k * 4); } this.edge(); return; }
      for (let k = 0; k < N; k++) if (this.bc[k] >= 0) { const t = this.tv[k]; tone[k] = style === 'flat' ? (t < .25 ? 0 : t < .44 ? 1 : 2) : (t < .26 ? 0 : t < .46 ? 1 : t < .74 ? 2 : 3); }
      const nb = k => { const x = k % W, out = []; if (x > 0) out.push(k - 1); if (x < W - 1) out.push(k + 1); if (k >= W) out.push(k - W); if (k < N - W) out.push(k + W); return out; };
      for (let pass = 0; pass < 2; pass++) for (let k = 0; k < N; k++) { if (tone[k] < 0) continue; const same = nb(k).filter(q => this.bc[q] === this.bc[k]); if (same.length < 3 || same.some(q => tone[q] === tone[k])) continue; const cnt = {}; same.forEach(q => cnt[tone[q]] = (cnt[tone[q]] || 0) + 1); const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; if (best[1] >= 2) tone[k] = +best[0]; }
      for (let k = 0; k < N; k++) { if (tone[k] < 0) continue; const b = unp(this.bc[k]), edge = nb(k).length < 4 || nb(k).some(q => this.bc[q] < 0); let tn = tone[k]; if (edge) tn = Math.max(0, Math.min(tn - 1, 1)) - (style === 'flat' ? 0 : 0);
        const P = style === 'flat' ? [mix([b[0] * .5, b[1] * .5, b[2] * .5], [30, 22, 56], .3), mix([b[0] * .74, b[1] * .74, b[2] * .74], [60, 48, 96], .16), [b[0] * .96, b[1] * .96, b[2] * .96]] : [mix([b[0] * .46, b[1] * .46, b[2] * .46], [30, 22, 60], .3), mix([b[0] * .68, b[1] * .68, b[2] * .68], [56, 44, 100], .2), [b[0] * .94, b[1] * .94, b[2] * .94], mix([b[0] * 1.14, b[1] * 1.14, b[2] * 1.14], [255, 238, 200], .12)];
        this.c.set(P[Math.max(0, tn)].map(v => Math.min(255, v)), k * 4); } }
    edge(f = .78) { const o = new Uint8ClampedArray(this.c); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const k = (y * this.w + x) * 4; if (!o[k + 3]) continue; const out = (dx, dy) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= this.w || Y >= this.h || !o[(Y * this.w + X) * 4 + 3]; }; if (out(1, 0) || out(0, 1) || out(-1, 0)) { this.c[k] *= f; this.c[k + 1] *= f; this.c[k + 2] *= f + .04; } } } }
  // hand-placed heads: 7 x 7 stamps. L/H/h hair light/mid/dark, S/s skin, E eye, M mouth, O/o hood, k face in hood shadow.
  const HEADS = { bare: [
    ['..LLH..', '.LLHHH.', '.HSSSH.', '.SESES.', '.SSsSS.', '..SMS..', '..sss..'],
    ['..LLH..', '.LLHHH.', '.SSSHH.', '.ESEhH.', 'SSsShh.', '.SMSs..', '..ss...'],
    ['..LLH..', '.LLHHH.', '.SSHHH.', '.ESShH.', 'SSSShH.', '.SMss..', '..ss...'],
    ['..LHH..', '.LHHHH.', '.HHHHH.', '.sHHHH.', '.SHHhh.', '..hhh..', '...s...'],
    ['..LHH..', '.LHHHH.', '.HHHHH.', '.HHHHH.', '.hHHHh.', '..hhh..', '..sss..'] ],
    hood: [
    ['..OOO..', '.OOOOO.', 'OOoooOO', 'Ookkko.', 'OokkkoO', 'OOkkkOO', '.OOOOO.'],
    ['..OOO..', '.OOOOO.', 'oooOOOO', 'kkkoOOO', 'kkkoOOO', '.kkoOOo', '..OOOO.'],
    ['...OO..', '..OOOO.', '.oOOOOO', 'kkoOOOO', 'kkoOOOo', '.koOOOo', '..OOOO.'],
    ['..OOO..', '.OOOOO.', '.OOOOOO', 'oOOOOOO', 'oOOOOOo', '.OOOOOo', '..oooo.'],
    ['..OOO..', '.OOOOO.', '.OOOOO.', 'OOOOOOO', 'OOOOOOo', 'oOOOOOo', '.ooooo.'] ] };
  HEADS.hood[0][3] = 'OokkkoO';
  const stampHead = (S, o, face, cx, cy) => { const idx = [0, 1, 2, 3, 4, 3, 2, 1][face], flip = face >= 5, tpl = HEADS[o.hood ? 'hood' : 'bare'][idx], hair = o.hair || [56, 42, 32], skin = o.skin || [206, 164, 128], hc = o.hoodCol || o.robe;
    const lit = (b, f, sh) => sh ? mix([b[0] * f, b[1] * f, b[2] * f], [56, 44, 100], .2) : [Math.min(255, b[0] * f), Math.min(255, b[1] * f), Math.min(255, b[2] * f)];
    const P = { L: mix(lit(hair, 1.2), [255, 238, 200], .1), H: lit(hair, .94), h: lit(hair, .64, 1), S: lit(skin, .98), s: lit(skin, .74, 1), E: [34, 26, 26], M: lit(skin, .62, 1), O: lit(hc, .9), o: lit(hc, .6, 1), k: [34, 26, 30] };
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { let ch = tpl[r][flip ? 6 - c : c]; if (ch === '.') continue; if (o.tons && r < 2 && 'LH'.includes(ch) && idx !== 3 && (r === 0 || (c > 1 && c < 5))) ch = 'S'; if (o.beard && r >= 4 && 'SsM'.includes(ch) && !(r === 4 && idx === 0 && c !== 3) && idx < 3) ch = r === 4 && idx === 0 ? 's' : 'h';
      const col = ch === 'h' && o.beard && r >= 4 ? lit(o.beard, .8) : P[ch]; const x = cx - 3 + c, y = cy - 3 + r; if (x < 0 || y < 0 || x >= S.w || y >= S.h) continue; const k = y * S.w + x; S.c.set(col.map(v => v | 0), k * 4); S.c[k * 4 + 3] = 255; } };
  // person: same options as v2. face 0..7 = S, SW, W, NW, N, NE, E, SE on screen.
  // finish a supersampled surface: box-filter K x K down to 1x (premultiplied), then an optional soft contact shadow
  const finish = (S, K, shadow) => { if (K === 1 && !shadow) return S; const w = Math.round(S.w / K), h = Math.round(S.h / K), c = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let r = 0, g = 0, b = 0, a = 0; for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const q = ((y * K + j) * S.w + x * K + i) * 4, al = S.c[q + 3] / 255; r += S.c[q] * al; g += S.c[q + 1] * al; b += S.c[q + 2] * al; a += al; }
      const o = (y * w + x) * 4; if (a > 0) { c[o] = r / a; c[o + 1] = g / a; c[o + 2] = b / a; c[o + 3] = Math.round(a / (K * K) * 255); } }
    const ax = Math.round(S.ax / K), ay = Math.round(S.ay / K);
    if (shadow) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, dx = (x - ax) / 9.5, dy = (y - ay - .5) / 4.6, d = dx * dx + dy * dy; if (d >= 1) continue; const sa = Math.round((1 - d) * 120);
      if (c[o + 3] === 0) { c[o] = 0; c[o + 1] = 0; c[o + 2] = 0; c[o + 3] = sa; } else if (c[o + 3] < 255) { const t = c[o + 3] / 255; c[o] *= t; c[o + 1] *= t; c[o + 2] *= t; c[o + 3] = Math.max(c[o + 3], sa); } }
    return { w, h, ax, ay, c }; };
  const FRAMES = { idle: 2, walk: 4, work: 2, point: 2, pray: 2, die: 4 }, cache = new Map(), KM = new WeakMap();
  const person = (o, face = 0, pose = 'idle', frame = 0) => { frame %= FRAMES[pose] || 1; const style = o.style || KIT.style || 'cel', ok = KM.get(o) || (KM.set(o, JSON.stringify(o)), KM.get(o)), key = ok + face + pose + frame + style, hit = cache.get(key); if (hit) return hit;
    const w = o.w || 1, ht = o.ht || 1, K = o.ss || KIT.ss || 1, KB = K * (o.big || 1), S = new Surf(Math.round(104 * KB), Math.round(92 * KB), Math.round(52 * KB), Math.round(78 * KB)), skin = o.skin || [206, 164, 128], rb = o.robe, garb = o.garb || 'robe', mark = o.mark || 'scap', boot = o.boot || [56, 42, 32], belt = o.belt || [176, 156, 110], sl = o.sleeve || rb;
    S.scale(KB); S.face(Math.PI / 4 + face * Math.PI / 4);
    const SH = 5.3 * w, claspDef = garb === 'robe' && !o.prop;
    let bob = 0, kn = 0, bow = 0, stride = 0, clasp = claspDef, lean = 0;
    const hang = [.1, SH + .2, 31, .5, SH, 24];
    let A = [hang.slice(), hang.slice()];   // per arm: elbow xyz, hand xyz; y is outward from the body
    if (clasp) A = [[1.4, SH, 32.5, 4, 1.1, 30.5], [1.4, SH, 32.5, 4, 1.1, 30.5]];
    if (pose === 'idle') bob = frame ? .4 : 0;
    if (pose === 'walk') { const p = frame / 4 * 6.2832 + .8; stride = Math.sin(p) * 3; bob = Math.abs(Math.cos(p)) * .9 - .45; clasp = false; A = [[-stride * .35, SH + .3, 31.5, -stride * .9 + .3, SH + .2, 24.5], [stride * .35, SH + .3, 31.5, stride * .9 + .3, SH + .2, 24.5]]; }
    if (pose === 'work') { clasp = false; lean = .5; const u = frame ? 2 : 0; A = [[2.6, SH - .3, 33.5, 6.4, 2, 31 + u], [2.6, SH - .3, 33.5, 6.4, 2, 33 - u]]; }
    if (pose === 'point') { clasp = false; lean = .3; A = [[3.6, SH - .4, 40.5, 8.4, SH - 1.4, 42 + (frame ? .8 : 0)], hang.slice()]; }
    if (pose === 'pray') { kn = 1; bow = frame ? 1.2 : .8; clasp = false; A = [[2.2, SH - .4, 35, 3.6, .7, 39], [2.2, SH - .4, 35, 3.6, .7, 39]]; }
    if (pose === 'die') { clasp = false; const a = [.14, .6, 1.2, 1.5708][frame]; S.tilt(a, Math.sin(a) * 3.2, Math.sin(a) * 24 * ht); A = frame === 0 ? [[1.6, SH + 1.2, 40, 2.4, SH + 2.2, 46], [1.6, SH + 1.2, 40, 2.4, SH + 2.2, 46]] : [[0, SH + 2.4, 38, 0, SH + 5, 37], [.4, SH + 1.6, 35, 1.4, SH + 3.6, 29]]; }
    if (o.prop && (pose === 'idle' || pose === 'walk')) { clasp = false; A[0] = (o.prop === 'candle' || o.prop === 'lantern') ? [2.2, SH, 32, 4.4, SH - .8, 30.5 + bob] : [1, SH + .3, 35, 2.6, SH + .5, 32 + bob]; }
    const Z = z => z * ht, KN = kn * 12, W0 = Z(29.5) - KN + bob, U = z => W0 + Z(z - 29.5);   // U(z): heights above the waist ride with it
    const band = (Y, z) => mark === 'scap' && Math.abs(Y) < 1.5 && z > 3 ? [o.col, Math.abs(Y) > 1.1 ? -.1 : 0] : null;
    const apr = (th, z) => o.apron && Math.cos(th) > .45 && z > 6 ? [o.apron, Math.cos(th) < .6 ? -.12 : 0] : null;
    const split = (X, Y) => garb === 'coat' && X > 0 && Math.abs(Y) < .45 ? [rb, -.35] : null;
    const fold = (th, z, top) => { const f = Math.abs(Math.sin(th * 5 + .7)); return (f < .07 && z < top - 1) ? -.22 : (f < .2 ? -.06 : 0); };
    // feet
    if (!kn) for (const s of [-1, 1]) { const fx = s * stride; S.ell(0, 1.4, 1.5, .9, 1.4, .8, () => [boot, 0], fx + 1.2, fx + 1.2, 3); S.sph(fx + 2.2, s * 1.3, .8, 1.1, .8, .8, () => [boot, .05]); }
    if (garb === 'tunic') { const lg = o.legs || [78, 66, 54];
      if (kn) S.ell(0, 5, 3.6, 3.8 * w, 3, 3.4 * w, () => [lg, -.06], 1.5, 1, 3);
      else for (const s of [-1, 1]) { const fx = s * stride; S.tube([0, s * 1.6, Z(21)], [fx * .5 + .3, s * 1.5, Z(11)], 1.6, 1.4, [lg, -.02]); S.tube([fx * .5 + .3, s * 1.5, Z(11)], [fx + .4, s * 1.3, 1.6], 1.35, 1.2, [lg, -.04]); S.ell(1, 4.5, 1.4, 1.1, 1.3, 1.1, () => [boot, -.05], fx + .6, fx + .6, 3); }
      S.ell(Z(19.5) - KN, W0, 3.8 * w, 4.6 * w, 3.3 * w, 4.1 * w, (th, z, X, Y) => band(Y, 9) || apr(th, 9) || [rb, fold(th, z, W0) * .6 - (z < Z(20.2) - KN ? .14 : 0)], lean * .6, lean * .3, 3); }
    else { const fl = garb === 'dress' ? 1.08 : 1, hemA = 3.9 * w * fl * (1 + kn * .3) + Math.abs(stride) * .3, hemB = 4.5 * w * fl * (1 + kn * .15);
      S.ell(kn ? 0 : 1.2, W0, hemA, hemB, 3.3 * w, 4 * w, (th, z, X, Y) => (o.flare && z < 2.6 + kn * 0 ? [o.trim || o.col, .12] : null) || band(Y, z / ht) || apr(th, z) || split(X, Y) || [rb, fold(th, z, W0) - (z < 2.2 ? .12 : 0) + (garb === 'dress' && Math.abs(Math.sin(th * 7)) < .08 ? -.1 : 0)], kn * 2 + stride * .2, lean * .3, 3); }
    // torso, shoulders, neck
    S.ell(W0, U(41.6), 3.3 * w, 4 * w, 3.5 * w, SH - .5, (th, z, X, Y) => z < W0 + 1.2 ? [belt, 0] : band(Y, 9) || (z < W0 + 5 ? apr(th, 9) : null) || split(X, Y) || [rb, fold(th, z, 99) * .4], lean * .3, lean, 3.5);
    S.ell(U(41.6), U(43.4), 3.5 * w, SH - .5, 1.5, 1.7, (th, z, X, Y) => mark === 'mantle' ? [o.col, .04] : band(Y, 9) || [rb, .05], lean, lean, 3);
    if (mark === 'mantle') S.ell(U(36.5), U(42.4), 3.9 * w, SH + .2, 3.8 * w, SH + .1, (th, z) => [o.col, z < U(37.1) ? -.16 : fold(th, z, 99) * .4], lean, lean, 3.2);
    if (mark === 'scarf') { S.ell(U(42.4), U(44.8), 2, 2.2, 1.8, 2, () => [o.col, 0], lean, lean, 2.5); S.tube([2.4 + lean, 1.3, U(42.4)], [2.9 * w + lean, 1.6, U(35)], .9, .8, [o.col, -.06]); }
    S.ell(U(43.2), U(45.6), 1.1, 1.2, 1.05, 1.15, () => [o.hood ? (o.hoodCol || rb) : skin, -.14], lean, lean + bow * .6);
    // head: small oval, hair mass at the back, nose and brow give a profile
    const hz = U(48.9) - bow * 1.4, hx = lean + bow * 1.8 + .2, hc = o.hatCol || [60, 50, 44];
    S.sph(hx, 0, hz, 2.6, 2.3, 3.3, (dx, dy, dz) => { if (o.hood) return [skin, dz > -.1 ? -.55 : -.3]; if (o.beak) return [[38, 34, 34], 0];
 if (o.beard && dx > -.1 && dz < -.15) return [o.beard, -.02]; if (dz > .84 && o.tons) return [skin, .05];
      if ((dz > .28 && dx < .66) || (dx < -.1 && dz > -.45) || (dx < .3 && Math.abs(dy) > .85 && dz > -.2)) return [o.hair || [56, 42, 32], dx < -.4 ? -.06 : 0]; return [skin, dz < -.55 ? -.12 : 0]; });
    if (!o.hood && !o.beak) S.sph(hx + 2.5, 0, hz - .3, .6, .5, .7, () => [skin, .04]);
    if (o.hair && o.long) S.ell(U(42), hz + 1, 1.6, 2.1, 1.8, 2.2, () => [o.hair, -.04], hx - 1.6, hx - 1.4, 3);
    if (o.flare) S.ell(U(37.2), U(43.4), 4.5 * w, SH + 1.2, 2.3, 2.7, (th, z) => [z < U(38) ? (o.trim || o.col) : rb, z < U(38) ? .1 : .04 + fold(th, z, 99) * .3], lean, lean, 2.6);
    if (o.hood && o.flare) S.sph(hx - 1.9, 0, hz + 3.7, 1.25, 1.05, 2.3, () => [o.hoodCol || rb, .02]);
    if (o.hood) { S.sph(hx - .5, 0, hz + .35, 3.25, 2.95, 3.85, (dx, dy, dz) => dx > .5 ? null : [o.hoodCol || rb, dx > .32 ? -.16 : dz > .55 ? .04 : 0]); S.sph(hx - 2.4, 0, hz + 2.2, 1.3, 1.1, 1.6, () => [o.hoodCol || rb, .02]);
      S.ell(U(41.2), U(45.4), 3.6 * w, SH - .4, 2.2, 2.6, (th, z) => (z > U(43.6) && (th < .7 || th > 5.58)) ? null : [o.hoodCol || rb, .02], lean, lean, 2.6); }
    else if (garb === 'robe' && !o.hat) S.ell(U(42.6), U(44.4), 2.4, 3.6 * w, 1.9, 3, (th) => Math.cos(th) > .4 ? null : [rb, .03], lean - .8, lean - .9, 2.5);
    if (o.beak) { S.tube([hx + 2.1, 0, hz - .3], [hx + 6.6, 0, hz - 2.1], 1.3, .35, [[196, 184, 156], 0]); for (const s of [-1, 1]) S.sph(hx + 2.2, s * 1, hz + .7, .75, .7, .75, (dx) => [dx > .5 ? [150, 170, 180] : [20, 18, 18], 0]); }
    if (o.hat === 'brim' || o.hat === 'kettle') { const br = o.hat === 'brim' ? 5 : 4.1, t = hz + 2.1; S.disk(hx - .3, 0, t, br, [hc, 0]); S.ell(t - .4, t, br, br, br, br, () => [hc, -.22], hx - .3); S.ell(t, t + (o.hat === 'brim' ? 3.4 : 2.2), 2.5, 2.5, 2.1, 2.1, (th, z) => [z < t + .9 && o.hat === 'brim' ? [30, 26, 24] : hc, 0], hx - .3, hx - .3, 3); if (o.hat === 'kettle') S.sph(hx - .3, 0, t + 2.2, 2.1, 2.1, 1, (dx, dy, dz) => dz > 0 ? [hc, .05] : null); else S.disk(hx - .3, 0, t + 3.4, 2.1, [hc, .05]); }
    if (o.hat === 'cap' || o.hat === 'knit' || o.hat === 'coif' || o.hat === 'peak') { S.sph(hx - .2, 0, hz + .35, 2.85, 2.55, 3.45, (dx, dy, dz) => (dz > .15 || (o.hat === 'coif' && dx < .4 && dz > -.7)) ? [hc, o.hat === 'knit' && Math.floor(dz * 8) % 2 ? -.08 : 0] : null); if (o.hat === 'peak') S.disk(hx + 2.2, 0, hz + 1.1, 1.8, [[30, 28, 30], 0]); if (o.hat === 'knit') S.sph(hx - .2, 0, hz + 3.8, .9, .9, .9, () => [o.col, 0]); }
    // arms: thin, close to the body, sleeves widening a little at the wrist on robes
    [1, -1].forEach((s, i) => { const a = A[i], sh0 = [lean + .2, s * (SH - .4), U(41.2)], el = [a[0] + lean, s * a[1], U(a[2])], hd = [a[3] + lean, s * a[4], U(a[5])]; if (o.flare) { const cf = [el[0] + (hd[0] - el[0]) * .8, el[1] + (hd[1] - el[1]) * .8, el[2] + (hd[2] - el[2]) * .8]; S.tube(sh0, el, 1.6, 1.7, [sl, -.04]); S.tube(el, cf, 1.7, 2.05, [sl, -.06]); S.tube(cf, hd, 2.05, 2.15, [o.trim || o.col, .08]); } else { S.tube(sh0, el, 1.45, 1.4, [sl, -.04]); S.tube(el, hd, 1.4, garb === 'robe' ? 1.75 : 1.3, [sl, -.06]); } if (!clasp) S.sph(hd[0] + .5, hd[1], hd[2] - .6, .95, .9, 1.1, () => [skin, 0]); });
    if (clasp) S.sph(A[0][3] + .6 + lean, 0, U(A[0][5]) - .4, 1, 1.4, 1, () => [skin, 0]);
    if (o.prop && (pose === 'idle' || pose === 'walk')) { const px0 = A[0][3] + .8 + lean, py = A[0][4] + .3; if (o.prop !== 'candle' && o.prop !== 'lantern') S.tube([px0, py, .4], [px0, py, U(53)], .55, .55, [[112, 84, 56], 0]); if (o.prop === 'shovel') S.ell(U(53), U(57), .5, 1.8, .4, 1.4, () => [[120, 122, 130], 0], px0, px0, 4); if (o.prop === 'gaff') S.tube([px0, py, U(53)], [px0 + 2, py, U(51.4)], .5, .35, [[150, 152, 160], 0]); if (o.prop === 'lantern') { S.ell(U(25.5), U(29.5), 1, 1, 1, 1, () => [[226, 190, 100], .2], px0, px0, 4); S.ell(U(29.5), U(30.5), 1.2, 1.2, .5, .5, () => [[60, 56, 52], 0], px0, px0, 4); S.ell(U(24.8), U(25.5), 1.2, 1.2, 1.2, 1.2, () => [[60, 56, 52], 0], px0, px0, 4); }
    if (o.prop === 'candle') { S.ell(U(32), U(36), .45, .45, .45, .45, () => [[232, 222, 196], .1], px0, px0); S.sph(px0, py, U(37), .45, .45, .9, () => [[255, 200, 100], .5]); }
    if (o.prop === 'crook') S.sph(px0 + .8, py, U(53.6), 1.2, .6, 1.2, (dx, dy, dz) => dz > -.2 ? [[112, 84, 56], 0] : null); }
    S.paint(style === 'hand' ? 'cel' : style === 'handflat' ? 'flat' : style); if ((style === 'hand' || style === 'handflat') && pose !== 'die' && !o.hat && !o.beak) { const [cx, cy] = S.proj(hx, 0, hz); stampHead(S, o, face, cx, cy); }
    const F = finish(S, K, style === 'pre' || style === 'pre2'), SW = F.w, SHh = F.h, SAX = F.ax, SAY = F.ay, SC = F.c;
    // crop to the opaque box so blits touch only real pixels
    let x0 = SW, y0 = SHh, x1 = -1, y1 = -1; for (let j = 0; j < SHh; j++) for (let i = 0; i < SW; i++) if (SC[(j * SW + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(SC.subarray(((j + y0) * SW + x0) * 4, ((j + y0) * SW + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -SAX + x0, oy: -SAY + y0, data: cd, get canvas() { const c = document.createElement('canvas'); c.width = cw; c.height = ch; c.getContext('2d').putImageData(new ImageData(cd, cw, ch), 0, 0); Object.defineProperty(this, 'canvas', { value: c }); return c; } };
    cache.set(key, out); return out; };
  // background warm-up: build sprites in small time slices so play never stalls on a cold one
  const warmQ = []; let warming = false;
  const warmTick = () => { const t0 = performance.now(); while (warmQ.length && performance.now() - t0 < 6) { const a = warmQ.shift(); person(...a); } if (warmQ.length) setTimeout(warmTick, 4); else warming = false; };
  const warm = (jobs, front) => { if (front) warmQ.unshift(...jobs); else warmQ.push(...jobs); if (!warming) { warming = true; setTimeout(warmTick, 0); } };
  const has = (o, face = 0, pose = 'idle', frame = 0) => { frame %= FRAMES[pose] || 1; const ok = KM.get(o); return !!ok && cache.has(ok + face + pose + frame + (o.style || KIT.style || 'cel')); };

  // The Hollow Brother's true form, "the Empty Habit": the same cloth as a brother with nobody inside it.
  // Floats, no feet; ragged hem; a hood with a black void and two ember points; sleeves that end in nothing.
  // poses: idle (2, a slow rise and fall), walk (4, a glide), reach (2, sleeves lifted toward you), fade (4, it comes apart)
  const HF = { idle: 2, walk: 4, reach: 2, fade: 4 };
  const hollow = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= HF[pose] || 1; const style = opt.style || KIT.style || 'clay', K = opt.ss || KIT.ss || 1, key = 'HOLLOW' + face + pose + frame + style + K + (opt.robe || ''); const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(130 * K, 140 * K, 65 * K, 122 * K); S.scale(K); S.face(Math.PI / 4 + face * Math.PI / 4);
    const rb = opt.robe || [44, 38, 46], inner = [10, 7, 10], ht = 1.32, SH = 7.2, WD = 1.28;
    const lift = pose === 'fade' ? 3 + frame * 2.5 : 3.2 + (pose === 'idle' ? frame * .9 : Math.sin(frame / 4 * 6.28) * .5), sway = pose === 'walk' ? Math.sin(frame / 4 * 6.28 + 1) * 1.4 : 0, lean = pose === 'walk' ? .9 : pose === 'reach' ? 1.2 : 0;
    const Z = z => z * ht + lift, W0 = Z(30), U = z => W0 + (z - 30) * ht;
    const gone = (th, z) => pose === 'fade' && hs(Math.floor(th * 9), Math.floor(z * 1.3)) < frame * .22 + (z < Z(12) ? .2 : 0);   // pieces drop out as it fades
    const rag = (th, z) => { const r = hs(Math.floor(th * 11 + frame * (pose === 'walk' ? 2 : 0)), 3); return z < Z(0) + r * 7; };   // tattered hem
    // robe: hangs from the shoulders, wide at the hem, tears near the bottom
    S.ell(Z(-6), W0, 4.6 * WD, 5.4 * WD, 3.4 * WD, 4.2 * WD, (th, z, X, Y) => { if (gone(th, z) || (z < Z(4) && rag(th, z - Z(-6) + Z(0) - 3))) return null; const f = Math.abs(Math.sin(th * 5 + .7)); return [rb, (f < .08 ? -.24 : f < .2 ? -.07 : 0) - (z < Z(0) ? .12 : 0)]; }, sway * .2, lean * .3, 3);
    S.ell(W0, U(41.6), 3.4 * WD, 4.2 * WD, 3.7 * WD, SH - .5, (th, z) => gone(th, z) ? null : [rb, Math.abs(Math.sin(th * 5 + .7)) < .1 ? -.12 : 0], lean * .3, lean, 3.5);
    S.ell(U(41.6), U(43.6), 3.7 * WD, SH - .5, 1.8 * WD, 2 * WD, (th, z) => gone(th, z) ? null : [rb, .05], lean, lean, 3);
    // a cord at the waist, knotted, with nothing to tie it to
    S.ell(W0 - .2, W0 + .8, 3.45 * WD, 4.25 * WD, 3.45 * WD, 4.25 * WD, (th) => [[88, 72, 52], 0], lean * .3, lean * .3, 3);
    // hood: a tall cowl. The front opens onto black; two embers sit far back inside it
    const hz = U(50.5), hx = lean + .4;
    S.sph(hx - .6, 0, hz + .4, 3.6 * 1.12, 3.3 * 1.08, 4.3 * 1.14, (dx, dy, dz) => { if (gone(dx * 3, hz)) return null; if (dx > .42 && dz < .62 && dz > -.78 && Math.abs(dy) < .78) return [inner, -.6]; return [rb, dx > .25 ? -.15 : dz > .55 ? .05 : 0]; });
    // the cowl falls from the crown of the hood down the back in one piece, ending in a drooping point
    S.ell(U(42), hz + 3.2, 3.6 * WD, SH - .6, 2.2, 2.4, (th) => Math.cos(th) > .2 ? null : [rb, .02], hx - 1.6, hx - 1.3, 2.4);
    S.tube([hx - 2.2, 0, hz + 3.4], [hx - 3.6, 0, hz + 6.2], 1.5, .5, [rb, .04]);
    S.ell(U(41.2), U(46), 3.9 * WD, SH - .3, 2.4 * WD, 2.8 * WD, (th, z) => (z > U(44) && (th < .7 || th > 5.58)) ? null : [rb, .02], lean, lean, 2.6);
    if (pose !== 'fade' || frame < 3) for (const s of [-1, 1]) S.sph(hx - .6 + 3.6 * 1.12 * .93, s * 1.05, hz - .1, .5, .5, .5, () => [[255, 150, 70], 1.5]);
    // sleeves: hang, glide, or reach. Each ends in an open cuff full of dark
    const hang = [.2, SH + .4, 32, .8, SH + .2, 23.5], A = pose === 'reach' ? [[3.4, SH - .2, 41, 8.6 + frame * .8, SH - 1.6, 43.5 + frame], [3.4, SH - .2, 41, 8.2 + frame * .6, -(SH - 3.2), 42.5]] : pose === 'walk' ? [[-1 - sway * .3, SH + .5, 32, -1.6 - sway * .6, SH + .6, 24], [1 + sway * .3, SH + .5, 32, 1.4 + sway * .6, SH + .6, 24]] : [hang, hang];
    [1, -1].forEach((s, i) => { const a = A[i]; if (pose === 'fade' && frame >= 2) return; const sh0 = [lean + .2, s * (SH - .4), U(41.4)], el = [a[0] + lean, s * a[1], U(a[2])], hd = [a[3] + lean, s * Math.abs(a[4]) * (a[4] < 0 ? -1 : 1) * s * s, U(a[5])];
      S.tube(sh0, el, 1.9, 2, [rb, -.04]); S.tube(el, hd, 2, 2.9, [rb, -.07]);
      const dir = [hd[0] - el[0], hd[1] - el[1], hd[2] - el[2]], n = Math.hypot(...dir); S.sph(hd[0] + dir[0] / n * .5, hd[1] + dir[1] / n * .5, hd[2] + dir[2] / n * .5, 2.2, 2.2, 2.2, () => [inner, -.7]); });
    // smoke curling off the hem (soft pixels only in the pre-rendered look; dark motes otherwise)
    for (let k = 0; k < 14; k++) { const a = hs(k, 7) * 6.28, r = 2 + hs(k, 9) * 4.5, zz = Z(-6) - 1 - hs(k, frame + 3) * (lift + 2); if (pose === 'fade' && k > 14 - frame * 3) continue; S.sph(Math.cos(a) * r + sway * .3, Math.sin(a) * r, zz, .5 + hs(k, 2) * .5, .5 + hs(k, 2) * .5, .45, () => [[34, 30, 40], -.3]); }
    S.paint(style === 'hand' || style === 'handflat' ? 'cel' : style);
    // embers stay hot whatever the light does
    const F = finish(S, K, style === 'pre' || style === 'pre2');
    let x0 = F.w, y0 = F.h, x1 = -1, y1 = -1; for (let j = 0; j < F.h; j++) for (let i = 0; i < F.w; i++) if (F.c[(j * F.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(F.c.subarray(((j + y0) * F.w + x0) * 4, ((j + y0) * F.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -F.ax + x0, oy: -F.ay + y0, data: cd }; cache.set(key, out); return out; };
  // ---- Empty Habit design variants (drafts). opt.v: habit | shroud | patch | wick | spill | lolled
  const hollow2 = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= HF[pose] || 1; const v = opt.v || 'habit', style = opt.style || 'clay', key = 'HV' + v + face + pose + frame + style + JSON.stringify(opt.patches || ''); const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(140, 150, 70, 130); S.face(Math.PI / 4 + face * Math.PI / 4);
    const rb = opt.robe || (v === 'wick' ? [52, 42, 40] : v === 'shroud' ? [70, 64, 60] : [44, 38, 46]), inner = [10, 7, 10], ht = v === 'lolled' ? 1.4 : 1.32, SH = 7.2, WD = v === 'lolled' ? 1.05 : v === 'shroud' ? 1.2 : 1.28, T = frame / (HF[pose] || 1) * 6.2832;
    const hunch = v === 'shroud' ? 3.6 : 0, lift = v === 'lolled' ? 9 + Math.sin(T) * .6 : 3.2 + (pose === 'idle' ? frame * .9 : Math.sin(T) * .5), sway = pose === 'walk' ? Math.sin(T + 1) * 1.4 : v === 'lolled' ? Math.sin(T) * 1.2 : 0, lean = (pose === 'walk' ? .9 : pose === 'reach' ? 1.2 : 0) + hunch * .5;
    const Z = z => z * ht + lift, W0 = Z(30), U = z => W0 + (z - 30) * ht;
    const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
    // material per variant
    const P = opt.patches || [[150, 40, 34], [60, 120, 70], [170, 140, 60], [90, 70, 140], [130, 130, 130]];
    const cloth = (th, z) => {
      if (v === 'patch') { const i = Math.floor((th + .3) / 6.2832 * 4) % 4, j = Math.floor((z - Z(-6)) / 10), pi = (i + j * 2) % (P.length + 2), c = pi < P.length ? P[pi] : rb, uth = ((th + .3) / 6.2832 * 4) % 1, uz = ((z - Z(-6)) / 10) % 1;
        if (uth < .05 || uz < .07) return [[30, 22, 20], .1]; if ((uth < .12 || uz < .14) && Math.floor(z * 2.5 + th * 9) % 2) return [[196, 180, 150], .1]; return [c.map((q, n) => (q * .5 + rb[n] * .5) * .9), fold(th)]; }
      if (v === 'wick') { const scorch = Math.max(0, 1 - (z - Z(-6)) / 14); if (scorch > .3 && hs(Math.floor(th * 30), Math.floor(z * 2)) < .06) return [[255, 120, 40], 1.2];
        if (Math.cos(th) > .7 && hs(Math.floor(th * 22), 5) < .3 && z > U(36) - hs(Math.floor(th * 22), 9) * 18) return [[214, 200, 170], 0];   // wax run down the front
        return [rb.map(q => q * (1 - scorch * .7)), fold(th) - scorch * .2]; }
      return [rb, fold(th)]; };
    // robe body
    const hemZ = v === 'lolled' ? Z(-4) : Z(-6), hemA = v === 'lolled' ? .5 : 4.6 * WD, hemB = v === 'lolled' ? .6 : 5.4 * WD;
    S.ell(hemZ, W0, hemA, hemB, 3.4 * WD, 4.2 * WD, (th, z) => { const r = hs(Math.floor(th * 11 + (pose === 'walk' ? frame * 2 : 0)), 3); if (v !== 'lolled' && z < Z(4) && z < Z(-3) + r * (v === 'shroud' ? 12 : 7)) return null; return cloth(th, z); }, sway * .2 + hunch * .2, lean * .3, 3);
    S.ell(W0, U(41.6), 3.4 * WD, 4.2 * WD, 3.7 * WD, SH - .5, (th, z) => cloth(th, z), lean * .3, lean, 3.5);
    S.ell(U(41.6), U(43.6), 3.7 * WD, SH - .5, 1.8 * WD, 2 * WD, (th, z) => cloth(th, z), lean, lean, 3);
    if (v !== 'patch') S.ell(W0 - .2, W0 + .8, 3.45 * WD, 4.25 * WD, 3.45 * WD, 4.25 * WD, () => [[88, 72, 52], 0], lean * .3, lean * .3, 3);
    // shroud: long strips hanging off the whole body
    if (v === 'shroud') for (let k = 0; k < 22; k++) { const th = hs(k, 1) * 6.2832, z0 = Z(6 + hs(k, 2) * 30), len = 14 + hs(k, 3) * 20, r = 4.6 * WD, flap = Math.sin(T + k) * (pose === 'walk' ? 1.6 : .6);
      S.tube([Math.cos(th) * r + hunch * .2, Math.sin(th) * r, z0], [Math.cos(th) * (r + 2.4) - 1.5 - flap, Math.sin(th) * (r + 2.4), Math.max(Z(-10), z0 - len)], .7, .3, [hs(k, 4) < .5 ? [150, 140, 124] : rb.map(q => q * .8), -.02]); }
    // hood
    const lol = v === 'lolled' ? 1 : 0, hz = U(50.5) - hunch * 1.6 - lol * 4.4, hx = lean + .4 + hunch * .9, hy = lol * 4.6;
    S.sph(hx - .6, hy, hz + .4, 3.6 * 1.12, 3.3 * 1.08, 4.3 * 1.14, (dx, dy, dz) => { if (dx > .42 && dz < .62 && dz > -.78 && Math.abs(dy) < .78 && v !== 'shroud') return [inner, -.6]; if (v === 'shroud' && dx > .55 && dz < .2) return [inner, -.6]; return cloth(dx * 3, hz); });
    if (v === 'shroud') S.tube([hx + 1.8, 0, hz + 1.6], [hx + 6.4, 0, hz - 2.6], 2.2, .5, [rb, .04]);   // the cowl droops forward like a beak
    else if (!lol) { S.ell(U(42), hz + 3.2, 3.6 * WD, SH - .6, 2.2, 2.4, (th) => Math.cos(th) > .2 ? null : [rb, .02], hx - 1.6, hx - 1.3, 2.4); S.tube([hx - 2.2, 0, hz + 3.4], [hx - 3.6, 0, hz + 6.2], 1.5, .5, [rb, .04]); }
    S.ell(U(41.2), U(46), 3.9 * WD, SH - .3, 2.4 * WD, 2.8 * WD, (th, z) => (z > U(44) && (th < .7 || th > 5.58)) ? null : cloth(th, z), lean, lean, 2.6);
    const fx = hx - .6 + 3.6 * 1.12 * .93;
    if (v === 'wick') { const fl = Math.sin(T * 2) * .25; S.sph(fx + .1, hy, hz - .6, .85, .85, 1.1 + fl, () => [[255, 236, 170], 2]); S.sph(fx + .1, hy, hz + .9 + fl, .5, .5, 1.1, () => [[255, 150, 50], 2]); S.sph(fx, hy, hz - 2.2, .55, .55, .9, () => [[220, 208, 180], .2]);
      for (let k = 0; k < 6; k++) S.sph(hx - 1 + hs(k, 4) * 2 + Math.sin(T + k) * .5, hy + (hs(k, 6) - .5) * 3, hz + 5 + k * 1.6, .5, .5, .5, () => [[60, 56, 64], -.2]); }   // smoke from the crown
    else if (v !== 'shroud') for (const s of [-1, 1]) S.sph(fx, hy + s * 1.05, hz - .1, .5, .5, .5, () => [[255, 150, 70], 1.5]);
    else for (const s of [-1, 1]) S.sph(hx + 3.2, s * .8, hz - 1.2, .4, .4, .4, () => [[255, 150, 70], 1.5]);
    // sleeves
    const drag = v === 'shroud' ? 1 : 0, hang = [.2, SH + .4, 32, .8 + drag * 2, SH + .2, drag ? 6 : 23.5];
    const A = pose === 'reach' ? [[3.4, SH - .2, 41, 8.6 + frame * .8, SH - 1.6, 43.5 + frame], [3.4, SH - .2, 41, 8.2 + frame * .6, -(SH - 3.2), 42.5]] : pose === 'walk' ? [[-1 - sway * .3, SH + .5, 32, -1.6 - sway * .6, SH + .6, drag ? 8 : 24], [1 + sway * .3, SH + .5, 32, 1.4 + sway * .6, SH + .6, drag ? 8 : 24]] : lol ? [[.2, SH + .2, 30, .4 + Math.sin(T) * .6, SH, 18], [.2, SH + .2, 30, .4 - Math.sin(T) * .6, SH, 18]] : [hang, hang];
    [1, -1].forEach((s, i) => { const a = A[i], sh0 = [lean + .2, s * (SH - .4), U(41.4)], el = [a[0] + lean, s * a[1], U(a[2])], hd = [a[3] + lean, s * a[4], U(a[5])];
      S.tube(sh0, el, 1.9, 2, [rb, -.04]); S.tube(el, hd, 2, 2.9, cloth(i * 3, U(a[5])));
      const dir = [hd[0] - el[0], hd[1] - el[1], hd[2] - el[2]], n = Math.hypot(...dir); S.sph(hd[0] + dir[0] / n * .5, hd[1] + dir[1] / n * .5, hd[2] + dir[2] / n * .5, 2.2, 2.2, 2.2, () => [inner, -.7]);
      if (v === 'spill') { // the dark pours out of the cuffs and runs to the floor
        let p = [hd[0] + dir[0] / n, hd[1] + dir[1] / n, hd[2] + dir[2] / n]; const steps = 14; for (let k = 1; k <= steps; k++) { const t = k / steps, q = [p[0] + Math.sin(T + k * .7 + i) * .35, p[1] + s * .15, p[2] - (p[2] - (Z(-6) - .5)) * (1 / (steps - k + 1))]; S.tube(p, q, .9 - t * .4, .9 - t * .4, [inner, -.6]); p = q; } } });
    if (v === 'spill') { S.disk(sway * .2, 0, Z(-6) - .6, 9 + Math.sin(T) * .5, [inner, -.5]); S.disk(4.5, 6, Z(-6) - .5, 3, [inner, -.5]); S.disk(4.5, -6.5, Z(-6) - .5, 2.6, [inner, -.5]);   // a black pool under it
      S.tube([fx, 0, hz - 2], [fx + .6 + Math.sin(T) * .3, 0, hz - 9 - frame], .6, .3, [inner, -.6]); }   // and it drips from the hood
    else if (v !== 'lolled') for (let k = 0; k < 14; k++) { const a = hs(k, 7) * 6.28, r = 2 + hs(k, 9) * 4.5, zz = Z(-6) - 1 - hs(k, frame + 3) * (lift + 2); S.sph(Math.cos(a) * r + sway * .3, Math.sin(a) * r, zz, .5 + hs(k, 2) * .5, .5 + hs(k, 2) * .5, .45, () => [v === 'wick' ? [80, 70, 64] : [34, 30, 40], -.3]); }
    if (v === 'lolled') S.tube([sway * .2, 0, Z(-4)], [sway * .5, 0, Z(-7)], .5, .1, [rb, -.1]);   // the hem narrows to a point and turns slowly
    S.paint(style);
    const F = finish(S, 1, false); let x0 = F.w, y0 = F.h, x1 = -1, y1 = -1; for (let j = 0; j < F.h; j++) for (let i = 0; i < F.w; i++) if (F.c[(j * F.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(F.c.subarray(((j + y0) * F.w + x0) * 4, ((j + y0) * F.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -F.ax + x0, oy: -F.ay + y0, data: cd }; cache.set(key, out); return out; };
  // ---- Empty Habit, unnerving pass (drafts). opt.v: mimic | hands | backwards | neck | crawl
  // idle is a twitch: it holds still, then snaps. Hot pixels (eyes, flame) are flagged emissive (alpha 254) so the game can keep them lit in the dark.
  const H3F = { idle: 4, walk: 4, reach: 2 };
  const hollow3 = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= H3F[pose] || 1; const v = opt.v || 'mimic', M = v === 'neck' && opt.morph != null ? Math.max(0, Math.min(1, opt.morph)) : 1, key = 'H3' + v + face + pose + frame + '|' + M.toFixed(2); const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(150, 160, 75, 136); S.face(Math.PI / 4 + face * Math.PI / 4); const EM = [];
    const em = (x, y, z, r, c) => { EM.push([x, y, z, r]); S.sph(x, y, z, r, r, r, () => [c, 1.6]); };
    const rb = [42, 36, 42], inner = [8, 6, 8], skin = [178, 170, 158], gum = [60, 26, 30], ht = 1 + .32 * M, SH = 7.2, WD = 1 + .24 * M, T = frame / (H3F[pose] || 1) * 6.2832;
    const snap = pose === 'idle' && frame === 2, walk = pose === 'walk';
    const lift = v === 'crawl' ? 0 : (3 + (walk ? Math.sin(T) * .4 : 0)) * M, sway = walk ? Math.sin(T + 1) * 1.2 * M : 0, stride = walk && M < .6 ? Math.sin(T) * 3 * (1 - M / .6) : 0;
    const Z = z => z * ht + lift, W0 = Z(30), U = z => W0 + (z - 30) * ht;
    const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
    const cloth = th => [rb, fold(th)];
    // a pale face: no eyes, just two hollows and a mouth that is open too wide
    const faceAt = (cx, cy, cz, dir, tiltA, scale = 1) => { const ca = Math.cos(tiltA), sa = Math.sin(tiltA);
      S.sph(cx, cy, cz, 1.5 * scale, 2.1 * scale, 2.7 * scale, (dx, dy, dz) => { if (dx * dir < .1) return null; const ry = dy * ca - dz * sa, rz = dy * sa + dz * ca;
        if (rz < -.25 && rz > -.75 && Math.abs(ry) < .55 - (rz + .5) * (rz + .5) * .8) return [gum, -.5];      // the mouth
        if (rz > .12 && rz < .42 && Math.abs(Math.abs(ry) - .38) < .17) return [[40, 34, 34], -.4];           // the hollows
        return [skin, rz > .6 ? .05 : 0]; }); };
    const hand = (p, d, len = 2.2, splay = 1) => { S.sph(p[0], p[1], p[2], .7, .7, .55, () => [skin, 0]); for (let f = -1.5; f <= 1.5; f++) { const q = [p[0] + d[0] * len + f * .25 * splay * d[2], p[1] + d[1] * len + f * .35 * splay, p[2] + d[2] * len - Math.abs(f) * .2]; S.tube(p, q, .26, .17, [skin, -.02]); } };
    if (v === 'crawl') {
      // bent at the waist, on all fours: sleeves are forelegs, the hood hangs near the floor and looks up
      const st = walk ? Math.sin(T) : 0, hip = [-8, 0, 19], sh = [8, 0, 15 + (snap ? 2 : 0)];
      S.ell(0, 19, 5, 5.6, 3.4, 4, (th) => cloth(th), -8, -8, 3);                     // the skirt hanging from the hips
      for (let k = 0; k <= 12; k++) { const t = k / 12, c = [hip[0] + (sh[0] - hip[0]) * t, 0, hip[2] + (sh[2] - hip[2]) * t + Math.sin(t * 3.14) * 3]; S.sph(c[0], 0, c[2], 5 - t * .6, 5.2 - t * .4, 4.4 - t * .4, (dx, dy, dz) => [rb, dz > .5 ? .04 : fold(dy * 3)]); }   // the bent back
      [1, -1].forEach((s, i) => { const ph = i ? -st : st, el = [sh[0] + 4 + ph, s * 7.5, 13], ft = [sh[0] + 9 + ph * 3, s * 7, .3]; S.tube([sh[0], s * 4.2, sh[2]], el, 2, 2.1, [rb, -.04]); S.tube(el, ft, 2.1, 2.7, [rb, -.07]); hand([ft[0] + 1.2, ft[1], .5], [1, s * .25, 0], 4.2, 1.9); });
      const hh = [sh[0] + 6.5, 0, 9 + (snap ? 3 : 0)]; S.sph(hh[0] - 1, 0, hh[2], 3.4, 3.2, 3.6, (dx, dy, dz) => dx > .45 && Math.abs(dy) < .75 && dz > -.8 && dz < .6 ? [inner, -.6] : [rb, dz > .4 ? .05 : 0]);
      faceAt(hh[0] + 1.7, 0, hh[2] - .3, 1, snap ? 1.6 : .3, 1);
      S.tube([-11, 0, 2], [-16 - st, 0, .3], 2.4, .6, [rb, -.1]); }
    else {
      const neck = v === 'neck' ? 13 * M * M * (3 - 2 * M) : 0, back = v === 'backwards' ? -1 : 1, hemZ = Z(-5 * M + 1.2 * (1 - M));
      if (M < .6) for (const s of [-1, 1]) { const fx = s * stride; S.ell(0, 1.4, 1.5, .9, 1.4, .8, () => [[30, 26, 28], 0], fx + 1.2, fx + 1.2, 3); S.sph(fx + 2.2, s * 1.3, .8, 1.1, .8, .8, () => [[30, 26, 28], .05]); }   // still walking on feet
      S.ell(hemZ, W0, 4.6 * WD, 5.4 * WD, 3.4 * WD, 4.2 * WD, (th, z) => (z < hemZ + 8 * M && z < hemZ + 3 * M + hs(Math.floor(th * 11 + (walk ? frame * 2 : 0)), 3) * 6 * M) ? null : cloth(th), sway * .2 + stride * .1, 0, 3);
      S.ell(W0, U(41.6), 3.4 * WD, 4.2 * WD, 3.7 * WD, SH - .5, cloth, 0, 0, 3.5);
      S.ell(U(41.6), U(43.6), 3.7 * WD, SH - .5, 1.8 * WD, 2 * WD, cloth, 0, 0, 3);
      S.ell(W0 - .2, W0 + .8, 3.45 * WD, 4.25 * WD, 3.45 * WD, 4.25 * WD, () => [[80, 66, 48], 0], 0, 0, 3);
      // the hood: on a neck that is far too long, or turned all the way round
      const tiltA = v === 'neck' ? (snap && M >= 1 ? -.9 : opt.jerk != null ? opt.jerk : .55 * M * M) : v === 'mimic' ? (snap ? 1.4 : .18) : snap ? .6 : 0;
      const nx = 0, hz = U(50.5) + neck - (v === 'neck' ? Math.abs(Math.sin(tiltA)) * 3 : 0), hy = v === 'neck' ? Math.sin(tiltA) * 6 * Math.min(1, neck / 6) : 0, hx = .4;
      if (neck) for (let k = 0; k <= 14; k++) { const t = k / 14; S.sph(nx + .3, hy * t * t, U(43) + (hz - 3 - U(43)) * t, 1.25, 1.25, 1.1, () => [rb, -.02 + (k % 3 === 0 ? -.12 : 0)]); }
      const op = (dx, dy, dz) => dx * back > .42 && dz < .62 && dz > -.78 && Math.abs(dy) < .78;
      S.sph(hx - .6 * back, hy, hz + .4, 3.6 * 1.12, 3.3 * 1.08, 4.3 * 1.14, (dx, dy, dz) => op(dx, dy, dz) ? [inner, -.6] : [rb, dx * back > .25 ? -.15 : dz > .55 ? .05 : 0]);
      S.tube([hx - 2.2 * back, hy, hz + 3.4], [hx - 3.6 * back, hy, hz + 6.2], 1.5, .5, [rb, .04]);
      if (neck < 3) S.ell(U(41.2), U(46), 3.9 * WD, SH - .3, 2.4 * WD, 2.8 * WD, (th, z) => (z > U(44) && (back > 0 ? (th < .7 || th > 5.58) : Math.abs(th - 3.14) < .7)) ? null : [rb, .02], 0, 0, 2.6);
      const fx = hx - .6 * back + 3.6 * 1.12 * .8 * back;
      if (v === 'mimic' || v === 'backwards' || (v === 'neck' && M > .55)) faceAt(hx - .6 * back + 2.75 * back, hy, hz - .4, back, tiltA, v === 'mimic' ? 1.12 : 1);
      if (v === 'hands') { for (const s of [-1, 1]) em(fx + .3, s * 1.05, hz - .1, .45, [230, 230, 220]);   // two cold points, not embers
        // fingers curled over the rim of the hood from inside
        for (let f = -2; f <= 2; f++) S.tube([fx - .2, f * .55, hz + 2.4], [fx + .5, f * .6, hz + 1.6], .28, .22, [skin, .05]); }
      // sleeves
      const hang = [.2, SH + .4, 32, .8, SH + .2, 23.5], rev = v === 'backwards' ? -1 : 1;
      const A = pose === 'reach' ? [[3.4 * rev, SH - .2, 41, (8.6 + frame) * rev, SH - 1.6, 43.5 + frame], [3.4 * rev, SH - .2, 41, (8.2 + frame) * rev, -(SH - 3.2), 42.5]] : walk ? [[-1 - sway * .3, SH + .5, 32, -1.6 - sway * .6, SH + .6, 24], [1 + sway * .3, SH + .5, 32, 1.4 + sway * .6, SH + .6, 24]] : [hang, hang];
      [1, -1].forEach((s, i) => { const a = A[i], sh0 = [.2, s * (SH - .4), U(41.4)], el = [a[0], s * a[1], U(a[2])], hd = [a[3], s * a[4], U(a[5])];
        S.tube(sh0, el, 1.9, 2, [rb, -.04]); S.tube(el, hd, 2, 2.9, [rb, -.07]); const d = [hd[0] - el[0], hd[1] - el[1], hd[2] - el[2]], n = Math.hypot(...d), u = d.map(q => q / n);
        S.sph(hd[0] + u[0] * .5, hd[1] + u[1] * .5, hd[2] + u[2] * .5, 2.2, 2.2, 2.2, () => [inner, -.7]);
        if (v === 'hands') { for (let k = 0; k < 3; k++) { const off = [(k - 1) * .9, (k - 1) * .5 * s, (k - 1) * .4]; hand([hd[0] + u[0] * .9 + off[0], hd[1] + u[1] * .9 + off[1], hd[2] + u[2] * .9 + off[2]], [u[0] + off[0] * .2, u[1] + off[1] * .3, u[2] - .3], 2.6 + k * .6, 1.2); } }
        else if (pose === 'reach' || v === 'mimic') hand([hd[0] + u[0] * 1.1, hd[1] + u[1] * 1.1, hd[2] + u[2] * 1.1], u, v === 'mimic' ? 3.6 : 2.6, 1); });
      // hands pressing out through the cloth from inside: fingertips poking through the weave
      if (v === 'hands') for (let k = 0; k < 9; k++) { const th = (hs(k, 3) - .5) * 2.4 + (k % 2 ? 0 : 3.14) * (hs(k, 8) < .25 ? 1 : 0), z = Z(2 + hs(k, 5) * 34), r = (z < W0 ? 4.4 : 3.8) * WD, c = Math.cos(th), sn = Math.sin(th), p = [c * r, sn * r, z];
        S.sph(p[0] + c * .2, p[1] + sn * .2, p[2], .9, .9, .7, () => [rb.map(q => q * 1.3), .1]); for (let f = -1.5; f <= 1.5; f++) S.tube([p[0], p[1] + f * .45 * c, p[2] + f * .3], [p[0] + c * 2, p[1] + sn * 2 + f * .5 * c, p[2] - 1 + Math.abs(f) * .2], .3, .2, [skin, -.04]); }
      for (let k = 0; k < 10; k++) { if (hs(k, 21) > M * M) continue; const a = hs(k, 7) * 6.28, r = 2 + hs(k, 9) * 4.5, zz = Z(-5) - 1 - hs(k, frame + 3) * (lift + 2); S.sph(Math.cos(a) * r, Math.sin(a) * r, zz, .6, .6, .45, () => [[30, 26, 34], -.3]); } }
    S.paint('clay');
    // pale flesh keeps a faint glow of its own: in the dark it is the one thing you can half make out
    const SK = (skin[0] & 255) << 16 | (skin[1] & 255) << 8 | (skin[2] & 255);
    for (let k = 0; k < S.w * S.h; k++) if (S.bc[k] === SK && S.c[k * 4 + 3]) { S.c[k * 4] *= .62; S.c[k * 4 + 1] *= .62; S.c[k * 4 + 2] *= .66; S.c[k * 4 + 3] = 254; }
    // flag emissive pixels: anything drawn by em() that survived the depth test
    for (const [x, y, z, r] of EM) { const [sx, sy] = S.proj(x, y, z); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const X = sx + i, Y = sy + j; if (X < 0 || Y < 0 || X >= S.w || Y >= S.h) continue; const k = Y * S.w + X; if (S.c[k * 4 + 3] && S.c[k * 4] > 180) S.c[k * 4 + 3] = 254; } }
    let x0 = S.w, y0 = S.h, x1 = -1, y1 = -1; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.c[(j * S.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(S.c.subarray(((j + y0) * S.w + x0) * 4, ((j + y0) * S.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -S.ax + x0, oy: -S.ay + y0, data: cd }; cache.set(key, out); return out; };
  // ---- Long Neck x Shroud (drafts). opt.arch: 'tilt' (straight neck, head lolled), 'hook' (neck arches over and the hood hangs down at you), 'reach' (neck stretched forward, low)
  const hollowNS = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= H3F[pose] || 1; const arch = opt.arch || 'hook', key = 'HNS' + arch + face + pose + frame; const hit = cache.get(key); if (hit) return hit;
    const S = new Surf(200, 230, 100, 200); S.face(Math.PI / 4 + face * Math.PI / 4);
    const rb = [70, 64, 60], rag = [112, 104, 94], inner = [8, 6, 8], skin = [178, 170, 158], gum = [60, 26, 30], ht = 1.3, SH = 7, WD = 1.18, T = frame / (H3F[pose] || 1) * 6.2832;
    const snap = pose === 'idle' && frame === 2, walk = pose === 'walk', lift = 3 + (walk ? Math.sin(T) * .4 : 0), sway = walk ? Math.sin(T + 1) * 1.2 : 0, hunch = 1.4;
    const Z = z => z * ht + lift, W0 = Z(30), U = z => W0 + (z - 30) * ht;
    const fold = th => { const f = Math.abs(Math.sin(th * 5 + .7)); return f < .08 ? -.24 : f < .2 ? -.07 : 0; };
    const cloth = th => [rb, fold(th)];
    // body: shroud-grey habit, slightly stooped, ragged hem
    S.ell(Z(-5), W0, 4.6 * WD, 5.4 * WD, 3.4 * WD, 4.2 * WD, (th, z) => (z < Z(4) && z < Z(-3) + hs(Math.floor(th * 11 + (walk ? frame * 2 : 0)), 3) * 12) ? null : cloth(th), sway * .2, hunch * .4, 3);
    S.ell(W0, U(41.6), 3.4 * WD, 4.2 * WD, 3.7 * WD, SH - .5, cloth, hunch * .4, hunch, 3.5);
    S.ell(U(41.6), U(43.6), 3.7 * WD, SH - .5, 1.6, 1.8, cloth, hunch, hunch, 3);
    // the neck: a spine of wrapped cloth, sampled along a curve
    const base = [hunch + .2, 0, U(43)], L = arch === 'hook' ? 36 : arch === 'reach' ? 30 : 28;
    const at = t => { const sL = t * L;
      if (arch === 'tilt') { const a = snap ? -.8 : .55; return [base[0] + sL * .05, Math.sin(a) * sL * sL / L * .5, base[2] + sL - Math.abs(Math.sin(a)) * sL * sL / L * .18]; }
      if (arch === 'reach') { if (sL <= 15) return [base[0] + sL * .15, 0, base[2] + sL]; const q = sL - 15; return [base[0] + 2.25 + q * .95, (snap ? 1.2 : 0) * q * .3, base[2] + 15 + q * .25 - q * q * .025]; }
      const s0 = 24, R = 5.2; if (sL <= s0) return [base[0] + sL * .1, 0, base[2] + sL]; const ph = (sL - s0) / R * (snap ? 1.12 : 1);
      return [base[0] + s0 * .1 + R * (1 - Math.cos(ph)), (snap ? 1.6 : 0) * (sL - s0) / 6, base[2] + s0 + R * Math.sin(ph)]; };
    const N = 40; for (let k = 0; k <= N; k++) { const t = k / N, p = at(t), r = 1.35 - t * .25; S.sph(p[0], p[1], p[2], r, r, r * 1.1, () => [k % 6 === 0 ? rag.map(q => q * .8) : rb, k % 4 === 0 ? -.14 : -.02]); }
    // hood at the end of the neck. Its axis follows the neck's last segment, so on the hook it hangs face-down
    const e = at(1), e0 = at(.92), ax = [e[0] - e0[0], e[1] - e0[1], e[2] - e0[2]], an = Math.hypot(...ax), u = ax.map(q => q / an);
    const fwd = arch === 'hook' ? [u[0] * .5 + .6, u[1], u[2] * .6 - .7] : arch === 'reach' ? [1, 0, -.2] : [1, 0, .1], fn = Math.hypot(...fwd), F = fwd.map(q => q / fn);
    const hc = [e[0] + u[0] * 2.8, e[1] + u[1] * 2.8, e[2] + u[2] * 2.8];
    S.sph(hc[0], hc[1], hc[2], 4.5, 4.2, 4.9, (dx, dy, dz) => { const d = dx * F[0] + dy * F[1] + dz * F[2]; return d > .5 ? [inner, -.6] : [rb, dz > .5 ? .05 : -.04]; });
    // the shroud's beak: the cowl droops past the face
    S.tube([hc[0] - F[0] * .5, hc[1], hc[2] + 3.2], [hc[0] + F[0] * 5.8, hc[1] + F[1] * 5.8, hc[2] + F[2] * 5.8 - 2], 2.5, .5, [rb, .04]);
    // pale face deep in the hood: two hollows, a mouth open too wide
    const fc = [hc[0] + F[0] * 2.3, hc[1] + F[1] * 2.3, hc[2] + F[2] * 2.3 - .3];
    S.sph(fc[0], fc[1], fc[2], 1.6, 2.2, 2.8, (dx, dy, dz) => { if (dx * F[0] + dy * F[1] + dz * F[2] < .15) return null; if (dz < -.25 && dz > -.75 && Math.abs(dy) < .55 - (dz + .5) * (dz + .5) * .8) return [gum, -.5]; if (dz > .12 && dz < .42 && Math.abs(Math.abs(dy) - .38) < .17) return [[40, 34, 34], -.4]; return [skin, 0]; });
    // torn strips: off the body, and trailing from the neck like bandages
    for (let k = 0; k < 20; k++) { const th = hs(k, 1) * 6.2832, z0 = Z(6 + hs(k, 2) * 30), len = 14 + hs(k, 3) * 20, r = 4.6 * WD, flap = Math.sin(T + k) * (walk ? 1.6 : .6);
      S.tube([Math.cos(th) * r + hunch * .3, Math.sin(th) * r, z0], [Math.cos(th) * (r + 2.4) - 1.5 - flap, Math.sin(th) * (r + 2.4), Math.max(Z(-10), z0 - len)], .7, .3, [hs(k, 4) < .5 ? rag : rb.map(q => q * .8), -.02]); }
    for (let k = 0; k < 7; k++) { const t = .2 + k * .11, p = at(t), len = 6 + hs(k, 11) * 9, fl = Math.sin(T + k * 1.3) * (walk ? 1.4 : .5); S.tube(p, [p[0] - 1.2 - fl, p[1] + (hs(k, 12) - .5) * 3, p[2] - len], .5, .2, [hs(k, 13) < .5 ? rag : rb, -.02]); }
    // sleeves drag on the floor; long pale fingers trail out of them
    const A = pose === 'reach' ? [[4, SH - .4, 40, 10 + frame, SH - 2, 41 + frame], [4, SH - .4, 40, 9.5 + frame, -(SH - 3.5), 40]] : walk ? [[-1 - sway * .3, SH + .5, 30, 1 - sway * .6, SH + 1, 8], [1 + sway * .3, SH + .5, 30, 1.6 + sway * .6, SH + 1, 8]] : [[.6, SH + .6, 30, 2.4, SH + 1.2, 6.5], [.6, SH + .6, 30, 2.4, SH + 1.2, 6.5]];
    [1, -1].forEach((s, i) => { const a = A[i], sh0 = [hunch * .9, s * (SH - .4), U(41.4)], el = [a[0] + hunch * .5, s * a[1], U(a[2])], hd = [a[3] + hunch * .3, s * a[4], Math.max(Z(-4), U(a[5]))];
      S.tube(sh0, el, 1.9, 2, [rb, -.04]); S.tube(el, hd, 2, 3, [rb, -.07]); const d = [hd[0] - el[0], hd[1] - el[1], hd[2] - el[2]], n = Math.hypot(...d), w = d.map(q => q / n);
      S.sph(hd[0] + w[0] * .5, hd[1] + w[1] * .5, hd[2] + w[2] * .5, 2.3, 2.3, 2.3, () => [inner, -.7]);
      for (let f = -1.5; f <= 1.5; f++) S.tube([hd[0] + w[0] * 1.2, hd[1] + f * .4, hd[2] + w[2] * 1.2], [hd[0] + w[0] * 1.2 + (pose === 'reach' ? w[0] * 4 : 1.5), hd[1] + f * .55 + (pose === 'reach' ? w[1] * 4 : 0), hd[2] + (pose === 'reach' ? w[2] * 4 : -2.8) - Math.abs(f) * .3], .26, .16, [skin, -.02]); });
    S.paint('clay');
    const SK = (skin[0] & 255) << 16 | (skin[1] & 255) << 8 | (skin[2] & 255);
    for (let k = 0; k < S.w * S.h; k++) if (S.bc[k] === SK && S.c[k * 4 + 3]) { S.c[k * 4] *= .62; S.c[k * 4 + 1] *= .62; S.c[k * 4 + 2] *= .66; S.c[k * 4 + 3] = 254; }
    let x0 = S.w, y0 = S.h, x1 = -1, y1 = -1; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.c[(j * S.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(S.c.subarray(((j + y0) * S.w + x0) * 4, ((j + y0) * S.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -S.ax + x0, oy: -S.ay + y0, data: cd }; cache.set(key, out); return out; };
  // ---- "The Thorn-Crowned" (draft): a gaunt shrouded thing with a small grey head in a crown of needles, a tattered poncho,
  // a long thorned staff, spindly clawed legs and roots that coil out from under the hem across the floor.
  const hollowThorn = (face = 0, pose = 'idle', frame = 0, opt = {}) => { frame %= H3F[pose] || 1; const key = 'HTH' + face + pose + frame; const hit = cache.get(key); if (hit) return hit;
    const SC = opt.scale || 1.6, S = new Surf(Math.round(210 * SC), Math.round(230 * SC), Math.round(105 * SC), Math.round(180 * SC)); S.scale(SC); S.face(Math.PI / 4 + face * Math.PI / 4);
    const cl = [96, 92, 88], dk = [54, 50, 52], hd = [150, 146, 140], wood = [70, 60, 52], claw = [40, 36, 36], T = frame / (H3F[pose] || 1) * 6.2832;
    const snap = pose === 'idle' && frame === 2, walk = pose === 'walk';
    const fold = th => { const f = Math.abs(Math.sin(th * 4 + .7)); return f < .1 ? -.26 : f < .24 ? -.08 : 0; };
    // legs: two thin bent legs under the hem, ending in long-toed claws
    [1, -1].forEach((s, i) => { const st = walk ? Math.sin(T + i * 3.14) * 2.4 : 0, hip = [0, s * 2.2, 22], knee = [3 + st * .5, s * 3.4, 11], ft = [.5 + st, s * 3.2, .6];
      S.tube(hip, knee, .9, .7, [dk, -.04]); S.tube(knee, ft, .7, .55, [dk, -.06]);
      for (let c = -1; c <= 1; c++) S.tube(ft, [ft[0] + 2.6, ft[1] + c * 1.1, 0], .4, .15, [claw, 0]); S.tube(ft, [ft[0] - 1.6, ft[1], .1], .35, .12, [claw, 0]); });
    // roots / tendrils: coil out from under the hem and across the floor, ending in tight curls
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832 + .3, len = 22 + hs(k, 2) * 12, curl = (hs(k, 3) < .5 ? 1 : -1) * (1.6 + hs(k, 4)); let p = [Math.cos(a0) * 3.5, Math.sin(a0) * 3.5, 15 + hs(k, 5) * 4], dir = a0, r = 1.15;
      const steps = 34; for (let j = 0; j < steps; j++) { const t = j / steps, seg = len / steps; dir += (t > .6 ? curl * .22 : Math.sin(T + k + t * 4) * .05 + curl * .02); const z = Math.max(.5 * r, p[2] - (t < .3 ? 1.6 : .15));
        const q = [p[0] + Math.cos(dir) * seg, p[1] + Math.sin(dir) * seg, t > .3 ? .5 * r + Math.max(0, Math.sin(t * 9 + k + T) * .8) * (1 - t) : z]; S.tube(p, q, r, r * .97, [dk, -.06]); p = q; r *= .965; } }
    // the poncho: wide at the shoulders, hanging in a ragged cone to mid-thigh, torn into strips at the hem
    const sh = 34, hem = 16, sway = walk ? Math.sin(T) * .8 : Math.sin(T) * .2;
    S.ell(hem, sh, 7.8, 8.6, 4.4, 5.6, (th, z) => { const r = hs(Math.floor(th * 10), 7); if (z < hem + 6 * r && Math.floor(th * 10) % 3 === 0) return null; return [cl, fold(th) - (z < hem + 2 ? .1 : 0)]; }, sway, 0, 2.6);
    S.ell(sh, sh + 2.2, 4.4, 5.6, 2, 2.2, () => [cl, .06], 0, 0, 2.4);
    for (let k = 0; k < 12; k++) { const th = hs(k, 1) * 6.2832, z0 = hem + 2 + hs(k, 2) * 4, len = 5 + hs(k, 3) * 9, r = 7.6; S.tube([Math.cos(th) * r + sway, Math.sin(th) * r * 1.1, z0], [Math.cos(th) * (r + 1) + sway * 1.5, Math.sin(th) * (r + 1) * 1.1, z0 - len], .6, .25, [cl.map(q => q * .85), -.04]); }
    // neck and small elongated head; two dark slits, nothing else
    const tilt = snap ? .5 : .12, hx = Math.sin(tilt) * 1.5, hz = sh + 7.5, hy = Math.sin(tilt) * 1.8;
    S.tube([0, 0, sh + 1.5], [hx * .5, hy * .5, hz - 2.6], .8, .7, [hd.map(q => q * .7), -.05]);
    S.sph(hx, hy, hz, 1.9, 1.7, 2.9, (dx, dy, dz) => (dx > .6 && dz > -.05 && dz < .25 && Math.abs(dy) > .15 && Math.abs(dy) < .55) ? [[20, 16, 18], -.4] : [hd, dz > .5 ? .06 : 0]);
    // crown of needles: thin spikes fanning out around the head like a halo
    for (let k = 0; k < 13; k++) { const a = -1.2 + k / 12 * 2.4 + (snap ? .3 : 0), len = 4.5 + hs(k, 9) * 2.5, d = [-.25, Math.sin(a), Math.cos(a) * .9 + .1], n = Math.hypot(...d);
      S.tube([hx - .3, hy, hz + .8], [hx - .3 + d[0] / n * len, hy + d[1] / n * len, hz + .8 + d[2] / n * len], .32, .1, [[96, 88, 84], .05]); }
    // the staff: held in one long arm, planted ahead, thorned and branching at the foot, its top past the crown
    const hand = [5.5, 6.5, 24], top = [-3.5, 8.5, hz + 10], foot = [10, 5, 0];
    S.tube([1, 6, sh - 1], [4, 7.6, 29], .9, .75, [cl, -.04]); S.tube([4, 7.6, 29], hand, .75, .6, [cl, -.06]); S.sph(hand[0], hand[1], hand[2], .9, .9, .8, () => [hd.map(q => q * .8), 0]);
    S.tube(top, foot, .75, .65, [wood, -.04]);
    for (let k = 0; k < 6; k++) { const t = .55 + k * .07, p = [top[0] + (foot[0] - top[0]) * t, top[1] + (foot[1] - top[1]) * t, top[2] + (foot[2] - top[2]) * t], s = k % 2 ? 1 : -1;
      S.tube(p, [p[0] + 2 + hs(k, 4) * 2, p[1] + s * (2 + hs(k, 5) * 2), p[2] + 2.5 - hs(k, 6) * 3], .4, .12, [wood, -.06]); }
    S.tube([foot[0] - 1, foot[1], 3], [foot[0] + 3, foot[1] - 3, 5.5], .45, .15, [wood, -.06]); S.tube([foot[0] + 3, foot[1] - 3, 5.5], [foot[0] + 4.5, foot[1] - 1.5, 7], .3, .1, [wood, -.06]);
    // second arm hangs, long fingers below the hem
    S.tube([1, -6, sh - 1], [2, -8, 22], .9, .75, [cl, -.04]); S.tube([2, -8, 22], [2.6, -8.4, 12], .7, .5, [hd.map(q => q * .7), -.06]);
    for (let f = -1; f <= 1; f++) S.tube([2.6, -8.4, 12], [3 + f * .4, -8.6 + f * .5, 7.5], .25, .1, [hd.map(q => q * .7), 0]);
    S.paint('clay');
    const SK = (hd[0] & 255) << 16 | (hd[1] & 255) << 8 | (hd[2] & 255);
    for (let k = 0; k < S.w * S.h; k++) if (S.bc[k] === SK && S.c[k * 4 + 3]) { S.c[k * 4] *= .6; S.c[k * 4 + 1] *= .6; S.c[k * 4 + 2] *= .64; S.c[k * 4 + 3] = 254; }
    let x0 = S.w, y0 = S.h, x1 = -1, y1 = -1; for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.c[(j * S.w + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = y0 = x1 = y1 = 0; } const cw = x1 - x0 + 1, ch = y1 - y0 + 1, cd = new Uint8ClampedArray(cw * ch * 4); for (let j = 0; j < ch; j++) cd.set(S.c.subarray(((j + y0) * S.w + x0) * 4, ((j + y0) * S.w + x0 + cw) * 4), j * cw * 4);
    const out = { w: cw, h: ch, ox: -S.ax + x0, oy: -S.ay + y0, data: cd }; cache.set(key, out); return out; };
  const CAST = {
    monastery: [
      { name: 'Hooded brother', robe: [104, 72, 48], col: [176, 52, 48], hood: 1 },
      { name: 'Tonsured brother', robe: [66, 62, 74], col: [62, 140, 88], tons: 1, hair: [70, 52, 38] },
      { name: 'Cellarer', robe: [112, 80, 52], col: [204, 152, 52], beard: [84, 58, 40], hair: [84, 58, 40], w: 1.16, ht: .96 },
      { name: 'Abbot', robe: [182, 172, 152], col: [150, 60, 150], hair: [150, 150, 150], tons: 1, beard: [160, 160, 160], ht: 1.04, prop: 'crook' },
      { name: 'Novice', robe: [86, 84, 92], col: [62, 112, 176], hair: [150, 96, 50], w: .92, ht: .9 } ],
    town: [
      { name: 'Plague doctor', garb: 'coat', robe: [40, 38, 44], col: [176, 52, 48], mark: 'mantle', beak: 1, hat: 'brim', hatCol: [30, 28, 32], belt: [70, 60, 50], prop: 'staff', ht: 1.03 },
      { name: 'Goodwife', garb: 'dress', robe: [110, 78, 66], col: [62, 140, 88], mark: 'mantle', apron: [196, 188, 166], hat: 'coif', hatCol: [210, 202, 182], hair: [90, 60, 40], belt: [80, 62, 48], w: .96, ht: .95 },
      { name: 'Burgher', garb: 'tunic', robe: [120, 64, 54], col: [204, 152, 52], mark: 'mantle', legs: [70, 74, 60], hat: 'cap', hatCol: [60, 44, 60], beard: [70, 50, 36], belt: [50, 40, 34], w: 1.14 },
      { name: 'Gravedigger', garb: 'tunic', robe: [96, 88, 70], col: [150, 60, 150], mark: 'scarf', legs: [60, 54, 46], hood: 1, hoodCol: [74, 66, 54], belt: [50, 40, 34], prop: 'shovel' },
      { name: 'Watchman', garb: 'tunic', robe: [88, 92, 100], col: [62, 112, 176], mark: 'mantle', legs: [66, 56, 46], hat: 'kettle', hatCol: [140, 144, 152], beard: [60, 50, 44], belt: [50, 40, 34], prop: 'staff', ht: 1.03 } ],
    port: [
      { name: 'Fisherman', garb: 'coat', robe: [156, 130, 54], col: [176, 52, 48], mark: 'scarf', hat: 'brim', hatCol: [156, 130, 54], beard: [170, 170, 170], hair: [150, 150, 150], belt: [60, 50, 40], prop: 'gaff', w: 1.06 },
      { name: 'Fishwife', garb: 'dress', robe: [74, 88, 100], col: [62, 140, 88], mark: 'mantle', apron: [156, 156, 146], hat: 'coif', hatCol: [180, 180, 174], hair: [150, 80, 50], belt: [50, 44, 40], w: 1.02, ht: .94 },
      { name: 'Deckhand', garb: 'tunic', robe: [190, 186, 172], col: [204, 152, 52], mark: 'scarf', legs: [50, 62, 86], hat: 'knit', hatCol: [60, 70, 90], hair: [60, 44, 34], belt: [50, 40, 34] },
      { name: 'Harbourmaster', garb: 'coat', robe: [48, 58, 82], col: [150, 60, 150], mark: 'scarf', hat: 'peak', hatCol: [36, 44, 64], beard: [120, 110, 100], hair: [120, 110, 100], belt: [150, 126, 60], ht: 1.04 },
      { name: 'Robed stranger', robe: [42, 62, 60], col: [62, 112, 176], hood: 1, belt: [90, 150, 140] } ] };
  window.KIT = { style: 'clay', hs, mix, ramp, Surf, person, hollow, hollow2, hollow3, hollowNS, hollowThorn, H3F, HF, warm, has, CAST, FRAMES, DIRS: ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'] };
})();
