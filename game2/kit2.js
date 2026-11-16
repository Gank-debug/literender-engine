// Game 2 art kit v2. Hash noise, colour ramps, a z-buffered 3/4 surface, and a person builder that gives any costume
// in eight facings and a set of poses (idle, walk, work, point, pray, die). Deterministic: no Math.random.
(function () {
  const hs = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (base, t) => { const k = Math.max(0, Math.min(4, Math.floor(t * 5))), f = [.3, .5, .72, .93, 1.12][k]; let c = [base[0] * f, base[1] * f, base[2] * f]; if (k < 2) c = mix(c, [24, 20, 46], .2); if (k === 4) c = mix(c, [255, 230, 190], .14); return c; };
  const LN = (() => { const v = [-.15, .85, .8], n = Math.hypot(...v); return v.map(q => q / n); })();
  class Surf { constructor(w, h, ax, ay) { this.w = w; this.h = h; this.ax = ax; this.ay = ay; this.z = new Float32Array(w * h).fill(-1e9); this.c = new Uint8ClampedArray(w * h * 4); this.cs = 1; this.sn = 0; this.tc = 1; this.ts = 0; this.lift = 0; }
    face(rot) { this.cs = Math.cos(rot); this.sn = Math.sin(rot); } tilt(a, lift = 0) { this.tc = Math.cos(a); this.ts = Math.sin(a); this.lift = lift; }
    pt(X, Y, Z, nx, ny, nz, base, bias = 0) { if (this.ts) { const X2 = X * this.tc - Z * this.ts, Z2 = X * this.ts + Z * this.tc + this.lift, n2 = nx * this.tc - nz * this.ts; nz = nx * this.ts + nz * this.tc; nx = n2; X = X2; Z = Z2; }
      const x = X * this.cs - Y * this.sn, y = X * this.sn + Y * this.cs, mx = nx * this.cs - ny * this.sn, my = nx * this.sn + ny * this.cs; const sx = Math.round(this.ax + (x - y) * .7071), sy = Math.round(this.ay + (x + y) * .3536 - Z); if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) return; const d = x + y + Z * .3, k = sy * this.w + sx; if (d <= this.z[k]) return; this.z[k] = d;
      const nl = Math.hypot(mx, my, nz) || 1, l = (mx * LN[0] + my * LN[1] + nz * LN[2]) / nl, c = ramp(base, .5 + l * .46 + bias + (hs(sx, sy) - .5) * .07); this.c[k * 4] = c[0]; this.c[k * 4 + 1] = c[1]; this.c[k * 4 + 2] = c[2]; this.c[k * 4 + 3] = 255; }
    ell(z0, z1, a0, b0, a1, b1, mat, cx0 = 0, cx1 = cx0) { const dz = z1 - z0 || .01; for (let z = z0; z <= z1; z += .4) { const t = (z - z0) / dz, a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t, cx = cx0 + (cx1 - cx0) * t, n = Math.ceil(Math.max(a, b) * 6.3 / .45), slope = ((a0 - a1) + (b0 - b1)) / 2 / dz; for (let i = 0; i < n; i++) { const th = i / n * 6.2832, X = cx + a * Math.cos(th), Y = b * Math.sin(th), m = mat(th, z, X, Y); if (m) this.pt(X, Y, z, Math.cos(th) / a, Math.sin(th) / b, slope / Math.max(a, b) * 1.2, m[0], m[1]); } } }
    sph(cx, cy, cz, rx, ry, rz, mat) { const R = Math.max(rx, ry, rz), n = Math.ceil(R * 3.2 / .4); for (let i = 0; i <= n; i++) { const ph = -1.5708 + i / n * 3.1416, m2 = Math.max(1, Math.ceil(Math.cos(ph) * R * 6.3 / .4)); for (let j = 0; j < m2; j++) { const th = j / m2 * 6.2832, dx = Math.cos(ph) * Math.cos(th), dy = Math.cos(ph) * Math.sin(th), dz = Math.sin(ph), m = mat(dx, dy, dz); if (m) this.pt(cx + dx * rx, cy + dy * ry, cz + dz * rz, dx / rx, dy / ry, dz / rz, m[0], m[1]); } } }
    tube(p, q, r0, r1, mat) { const len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), n = Math.max(1, Math.ceil(len / .5)); for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t; this.sph(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t, r, r, r, () => mat); } }
    disk(cx, cy, z, r, mat) { for (let rr = 0; rr <= r; rr += .4) { const n = Math.max(1, Math.ceil(rr * 6.3 / .4)); for (let i = 0; i < n; i++) { const th = i / n * 6.2832; this.pt(cx + rr * Math.cos(th), cy + rr * Math.sin(th), z, 0, 0, 1, mat[0], mat[1] - (rr > r - .8 ? .1 : 0)); } } }
    edge(f = .62) { const o = new Uint8ClampedArray(this.c); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const k = (y * this.w + x) * 4; if (!o[k + 3]) continue; const out = (dx, dy) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= this.w || Y >= this.h || !o[(Y * this.w + X) * 4 + 3]; }; if (out(1, 0) || out(0, 1) || out(-1, 0)) { this.c[k] *= f; this.c[k + 1] *= f; this.c[k + 2] *= f + .05; } } } }
  // ---- person. o = { garb: robe|dress|coat|tunic, robe, col (player colour), mark: scap|mantle|scarf, hood, hat: brim|kettle|cap|knit|coif|peak, hatCol,
  //                    beak, hair, tons, beard, apron, legs, boot, prop: staff, w, ht, skin }.  face 0..7 = S, SW, W, NW, N, NE, E, SE on screen.
  const FRAMES = { idle: 2, walk: 4, work: 2, point: 2, pray: 1, die: 4 }, cache = {};
  const person = (o, face = 0, pose = 'idle', frame = 0) => { frame %= FRAMES[pose] || 1; const key = JSON.stringify(o) + face + pose + frame; if (cache[key]) return cache[key];
    const w = o.w || 1, ht = o.ht || 1, S = new Surf(84, 76, 42, 62), skin = o.skin || [206, 164, 128], rb = o.robe, garb = o.garb || 'robe', mark = o.mark || 'scap', boot = o.boot || [52, 40, 32], sY = 6.2 * w; S.face(Math.PI / 4 + face * Math.PI / 4);
    let bob = 0, kn = 0, bow = 0, stride = 0, clasp = true, A = [[2.3, sY + .1, 25.5, 4.8 * w + .5, 1.7, 23.6], [2.3, sY + .1, 25.5, 4.8 * w + .5, 1.7, 23.6]];   // per arm: elbow xyz, hand xyz (y is outward)
    if (pose === 'idle') { bob = frame ? .5 : 0; }
    if (pose === 'walk') { const p = frame / 4 * 6.2832 + .6; stride = Math.sin(p) * 3.3; bob = Math.abs(Math.cos(p)) * 1.2 - .5; clasp = false; A = [[-stride * .4, sY + .5, 26, -stride * .9 + .8, sY + .7, 21], [stride * .4, sY + .5, 26, stride * .9 + .8, sY + .7, 21]]; }
    if (pose === 'work') { clasp = false; const u = frame ? 2.5 : 0; A = [[3.4, 5.4, 26, 7.2, 2.6, 26 + u], [3.4, 5.4, 26, 7.2, 2.6, 28.5 - u]]; bob = frame ? -.5 : 0; }
    if (pose === 'point') { clasp = false; A = [[5.6, 5, 32.4, 10.8, 3.2, 33 + (frame ? 1 : 0)], [0, sY + .5, 26, .8, sY + .7, 21]]; }
    if (pose === 'pray') { kn = 1; bow = 1; A = [[3, 5.4, 25, 4.7, 1, 29.5], [3, 5.4, 25, 4.7, 1, 29.5]]; }
    if (pose === 'die') { clasp = false; const a = [.12, .6, 1.2, 1.5708][frame]; S.tilt(a, Math.sin(a) * 4.6); A = frame === 0 ? [[2, sY + 1.5, 31, 3, sY + 3, 37], [2, sY + 1.5, 31, 3, sY + 3, 37]] : [[0, sY + 2.6, 30, 0, sY + 5.4, 29], [0, sY + 2, 28, 1, sY + 4.6, 24]]; }
    if (o.prop && (pose === 'idle' || pose === 'walk')) { clasp = false; A[0] = [1.6, sY + .6, 25.5, 3.4, sY + 1.3, 25 + bob]; if (pose === 'idle') A[1] = [0, sY + .5, 26, .8, sY + .7, 21]; }
    const Zs = z => z * ht, zW = Zs(20) - kn * 9 + bob, U = z => zW + Zs(z - 20);
    const band = (Y, z) => mark === 'scap' && Math.abs(Y) < 2.1 && z > 3 ? [o.col, Math.abs(Y) > 1.5 ? -.12 : .02] : null, apr = (th, z) => o.apron && Math.cos(th) > .3 && z > 5 ? [o.apron, Math.cos(th) < .42 ? -.1 : 0] : null, split = (X, Y) => garb === 'coat' && X > 0 && Math.abs(Y) < .6 ? [rb, -.3] : null;
    if (garb === 'tunic') { const lg = o.legs || [78, 66, 54];
      if (kn) S.sph(1, 0, 3, 5, 5.4 * w, 3, () => [lg, -.05]); else for (const s of [-1, 1]) { const fx = s * stride * 1.25; S.tube([0, s * 2.4, Zs(19)], [fx * .45, s * 2.5, Zs(10)], 2.2, 2, [lg, -.02]); S.tube([fx * .45, s * 2.5, Zs(10)], [fx, s * 2.5, 2.6], 2, 1.8, [lg, -.04]); S.sph(fx + .9, s * 2.5, 1.7, 2.7, 1.9, 1.7, () => [boot, 0]); S.ell(2, 6, 2.1, 2.1, 2.1, 2.1, () => [boot, -.03], fx); }
      S.ell(Zs(11) - kn * 5, zW, 5 * w, 6 * w, 4.3 * w, 5.5 * w, (th, z, X, Y) => band(Y, 9) || apr(th, 9) || [rb, Math.sin(th * 7) * .06 - (z < Zs(11.6) - kn * 5 ? .14 : 0)]); }
    else { const fl = garb === 'dress' ? 1.12 : 1, a0 = 6 * w * fl * (1 + kn * .2) + Math.abs(stride) * .28;
      if (stride) for (const s of [-1, 1]) S.sph(s * stride * 1.15 + .8, s * 2.3, 1.3, 2.4, 1.7, 1.3, () => [boot, 0]);
      S.ell(0, zW, a0, 6.9 * w * fl, 4.3 * w, 5.5 * w, (th, z, X, Y) => band(Y, z / ht) || apr(th, z) || split(X, Y) || [rb, Math.sin(th * (garb === 'dress' ? 11 : 9) + 1 + stride) * .1 * (1 - z / zW) - (z < 1 ? .15 : 0)], kn * 1.6 + stride * .12, 0); }
    S.ell(zW, U(33), 4.3 * w, 5.5 * w, 4.6 * w, 6.5 * w, (th, z, X, Y) => z < zW + 1.3 ? [o.belt || [176, 156, 110], 0] : band(Y, 9) || (z < zW + 7 ? apr(th, 9) : null) || split(X, Y) || [rb, Math.sin(th * 5) * .03]);
    S.ell(U(33), U(36.6), 4.6 * w, 6.5 * w, 1.9, 2.1, (th, z, X, Y) => mark === 'mantle' ? [o.col, .03] : band(Y, 9) || [rb, .04]);
    if (mark === 'mantle') S.ell(U(29.5), U(33.6), 5.3 * w, 7.2 * w, 4.9 * w, 6.8 * w, (th, z) => [o.col, z < U(30.2) ? -.14 : 0]);
    if (mark === 'scarf') { S.ell(U(35), U(37.8), 2.9, 3.1, 2.6, 2.8, () => [o.col, 0]); S.tube([3.6, 1.6, U(35)], [4.7 * w, 1.9, U(27.5)], 1.2, 1.1, [o.col, -.06]); }
    if (garb === 'robe' && !kn) S.ell(zW + .2, U(13), 4.6 * w, 5.2 * w, 4.9 * w, 5.3 * w, (th) => Math.abs(th - .5) < .16 ? [o.belt || [176, 156, 110], -.05] : null);
    S.ell(U(36), U(38.2), 1.7, 1.9, 1.7, 1.9, () => [o.hood ? rb : skin, -.12]);
    const hz = U(41) - bow * 1.7, hx = .5 + bow * 2.2, hc = o.hatCol || [60, 50, 44];
    S.sph(hx, 0, hz, 3.3, 3.1, 3.8, (dx, dy, dz) => { if (o.hood) return [skin, dz > .05 ? -.5 : -.22]; if (o.beak) return [[38, 34, 34], 0]; if (dx > .72 && Math.abs(Math.abs(dy) - .42) < .17 && dz > .02 && dz < .3) return [[40, 30, 28], -.2]; if (o.beard && dx > .1 && dz < -.22) return [o.beard, 0]; if (dz > .86 && o.tons) return [skin, .05]; if ((dz > .3 && dx < .62) || (dx < -.2 && dz > -.35)) return [o.hair || [66, 50, 38], 0]; return [skin, dz < -.5 ? -.15 : 0]; });
    if (o.hair && o.long) S.sph(-1.6, 0, hz - 3, 2.6, 3.4, 4.6, () => [o.hair, -.04]);
    if (o.hood) { S.sph(hx - .8, 0, hz + .2, 4.6, 4.4, 4.8, (dx, dy, dz) => dx > .52 ? null : [o.hoodCol || rb, dx > .36 ? -.14 : dz > .6 ? .06 : 0]); S.ell(U(33.4), U(38.4), 5 * w, 6.7 * w, 3.5, 3.7, (th, z) => (z > U(36) && (th < .6 || th > 5.68)) ? null : [o.hoodCol || rb, .03]); }
    else if (garb === 'robe') S.sph(-1.9, 0, U(36.9), 3, 4.4 * w, 1.9, () => [rb, .02]);
    if (o.beak) { S.tube([hx + 2.4, 0, hz - .4], [hx + 8.2, 0, hz - 2.6], 1.8, .5, [[196, 184, 156], 0]); for (const s of [-1, 1]) S.sph(hx + 2.7, s * 1.4, hz + .9, 1, 1, 1, (dx) => [dx > .5 ? [150, 170, 180] : [20, 18, 18], 0]); }
    if (o.hat === 'brim' || o.hat === 'kettle') { const br = o.hat === 'brim' ? 6.6 : 5.6; S.disk(hx - .4, 0, hz + 2.4, br, [hc, 0]); S.ell(hz + 1.9, hz + 2.4, br, br, br, br, () => [hc, -.2], hx - .4); S.ell(hz + 2.4, hz + (o.hat === 'brim' ? 6.2 : 4.6), 3.5, 3.5, 2.7, 2.7, (th, z) => [z < hz + 3.3 && o.hat === 'brim' ? [30, 26, 24] : hc, 0], hx - .4); S.sph(hx - .4, 0, hz + (o.hat === 'brim' ? 6.2 : 4.6), 2.7, 2.7, 1.2, (dx, dy, dz) => dz > 0 ? [hc, .04] : null); }
    if (o.hat === 'cap' || o.hat === 'knit' || o.hat === 'coif' || o.hat === 'peak') { S.sph(hx - .2, 0, hz + .3, 3.7, 3.5, 4, (dx, dy, dz) => (dz > .12 || (o.hat === 'coif' && dx < .35 && dz > -.6)) ? [hc, o.hat === 'knit' && Math.floor(dz * 9) % 2 ? -.08 : 0] : null); if (o.hat === 'peak') S.disk(hx + 2.6, 0, hz + 1, 2.3, [[30, 28, 30], 0]); if (o.hat === 'knit') S.sph(hx - .2, 0, hz + 4.6, 1.2, 1.2, 1.1, () => [o.col, 0]); }
    [1, -1].forEach((s, i) => { const a = A[i], sh0 = [.4, s * 6.1 * w, U(32)], el = [a[0], s * a[1], U(a[2])], hd = [a[3], s * a[4], U(a[5])], sl = o.sleeve || rb; S.tube(sh0, el, 2.2, 2.3, [sl, -.03]); S.tube(el, hd, 2.3, garb === 'robe' ? 2.6 : 2, [sl, -.03]); if (!clasp) S.sph(hd[0] + .7, hd[1], hd[2] - .4, 1.5, 1.4, 1.5, () => [skin, 0]); });
    if (clasp) S.sph(A[0][3] + .6, 0, U(A[0][5]) - .3, 1.5, 1.9, 1.4, () => [skin, 0]);
    if (o.prop && (pose === 'idle' || pose === 'walk')) { const px0 = A[0][3] + .9, py = A[0][4] + .4; S.tube([px0, py, .5], [px0, py, U(44)], .75, .75, [[112, 84, 56], 0]); if (o.prop === 'shovel') S.sph(px0, py, U(46), .9, 2.4, 3, () => [[120, 122, 130], 0]); if (o.prop === 'gaff') S.tube([px0, py, U(44)], [px0 + 2.4, py, U(42.4)], .7, .5, [[150, 152, 160], 0]); if (o.prop === 'crook') S.sph(px0 + 1, py, U(44.6), 1.6, .8, 1.6, (dx, dy, dz) => dz > -.2 ? [[112, 84, 56], 0] : null); }
    S.edge(); const c = document.createElement('canvas'); c.width = S.w; c.height = S.h; c.getContext('2d').putImageData(new ImageData(S.c, S.w, S.h), 0, 0);
    return cache[key] = { w: S.w, h: S.h, ox: -S.ax, oy: -S.ay, data: S.c, canvas: c }; };
  const CAST = {
    monastery: [
      { name: 'Hooded brother', robe: [104, 72, 48], col: [176, 52, 48], hood: 1 },
      { name: 'Tonsured brother', robe: [66, 62, 74], col: [62, 140, 88], tons: 1, hair: [70, 52, 38] },
      { name: 'Cellarer', robe: [112, 80, 52], col: [204, 152, 52], beard: [84, 58, 40], hair: [84, 58, 40], w: 1.18, ht: .95 },
      { name: 'Abbot', robe: [182, 172, 152], col: [150, 60, 150], hair: [150, 150, 150], tons: 1, w: .94, ht: 1.06, prop: 'crook' },
      { name: 'Novice', robe: [86, 84, 92], col: [62, 112, 176], hair: [150, 96, 50], w: .9, ht: .88 } ],
    town: [
      { name: 'Plague doctor', garb: 'coat', robe: [40, 38, 44], col: [176, 52, 48], mark: 'mantle', beak: 1, hat: 'brim', hatCol: [30, 28, 32], belt: [70, 60, 50], prop: 'staff', ht: 1.04 },
      { name: 'Goodwife', garb: 'dress', robe: [96, 70, 62], col: [62, 140, 88], mark: 'mantle', apron: [190, 182, 160], hat: 'coif', hatCol: [206, 198, 178], hair: [90, 60, 40], belt: [80, 62, 48], w: .96, ht: .95 },
      { name: 'Burgher', garb: 'tunic', robe: [112, 60, 52], col: [204, 152, 52], mark: 'mantle', legs: [70, 74, 60], hat: 'cap', hatCol: [60, 44, 60], beard: [70, 50, 36], belt: [50, 40, 34], w: 1.14 },
      { name: 'Gravedigger', garb: 'tunic', robe: [92, 84, 66], col: [150, 60, 150], mark: 'scarf', legs: [60, 54, 46], hood: 1, hoodCol: [70, 62, 52], belt: [50, 40, 34], prop: 'shovel' },
      { name: 'Watchman', garb: 'tunic', robe: [84, 88, 96], col: [62, 112, 176], mark: 'mantle', legs: [66, 56, 46], hat: 'kettle', hatCol: [140, 144, 152], beard: [60, 50, 44], belt: [50, 40, 34], prop: 'staff', ht: 1.03 } ],
    port: [
      { name: 'Fisherman', garb: 'coat', robe: [150, 126, 52], col: [176, 52, 48], mark: 'scarf', hat: 'brim', hatCol: [150, 126, 52], beard: [170, 170, 170], belt: [60, 50, 40], prop: 'gaff', w: 1.08 },
      { name: 'Fishwife', garb: 'dress', robe: [70, 84, 96], col: [62, 140, 88], mark: 'mantle', apron: [150, 150, 140], hat: 'coif', hatCol: [176, 176, 170], hair: [150, 80, 50], belt: [50, 44, 40], w: 1.04, ht: .94 },
      { name: 'Deckhand', garb: 'tunic', robe: [188, 184, 170], col: [204, 152, 52], mark: 'scarf', legs: [50, 62, 86], hat: 'knit', hatCol: [60, 70, 90], hair: [60, 44, 34], belt: [50, 40, 34] },
      { name: 'Harbourmaster', garb: 'coat', robe: [44, 54, 78], col: [150, 60, 150], mark: 'scarf', hat: 'peak', hatCol: [36, 44, 64], beard: [120, 110, 100], belt: [150, 126, 60], ht: 1.05 },
      { name: 'Robed stranger', robe: [42, 62, 60], col: [62, 112, 176], hood: 1, belt: [90, 150, 140] } ] };
  const monk = (o, face) => person(o, face);
  window.KIT = { hs, mix, ramp, Surf, person, monk, CAST, FRAMES, DIRS: ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'] };
})();
