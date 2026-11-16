// Game 2 art kit: hash noise, material ramps and a tiny z-buffered 3/4 surface. Shapes are emitted as lit points, rotated to a facing,
// projected to 2:1 isometric and the nearest kept, so one model gives every direction of a turnaround. Deterministic: no Math.random.
(function () {
  const hs = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (base, t) => { const k = Math.max(0, Math.min(4, Math.floor(t * 5))), f = [.3, .5, .72, .93, 1.12][k]; let c = [base[0] * f, base[1] * f, base[2] * f]; if (k < 2) c = mix(c, [24, 20, 46], .2); if (k === 4) c = mix(c, [255, 230, 190], .14); return c; };
  const LN = (() => { const v = [-.15, .85, .8], n = Math.hypot(...v); return v.map(q => q / n); })();
  class Surf { constructor(w, h, ax, ay) { this.w = w; this.h = h; this.ax = ax; this.ay = ay; this.z = new Float32Array(w * h).fill(-1e9); this.c = new Uint8ClampedArray(w * h * 4); this.cs = 1; this.sn = 0; }
    face(rot) { this.cs = Math.cos(rot); this.sn = Math.sin(rot); }
    pt(X, Y, Z, nx, ny, nz, base, bias = 0) { const x = X * this.cs - Y * this.sn, y = X * this.sn + Y * this.cs, mx = nx * this.cs - ny * this.sn, my = nx * this.sn + ny * this.cs; const sx = Math.round(this.ax + (x - y) * .7071), sy = Math.round(this.ay + (x + y) * .3536 - Z); if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) return; const d = x + y + Z * .3, k = sy * this.w + sx; if (d <= this.z[k]) return; this.z[k] = d;
      const nl = Math.hypot(mx, my, nz) || 1, l = (mx * LN[0] + my * LN[1] + nz * LN[2]) / nl, c = ramp(base, .5 + l * .46 + bias + (hs(sx, sy) - .5) * .07); this.c[k * 4] = c[0]; this.c[k * 4 + 1] = c[1]; this.c[k * 4 + 2] = c[2]; this.c[k * 4 + 3] = 255; }
    // stacked ellipses from z0 to z1: radii a (front-back) and b (side to side) taper linearly. mat(theta, z, X, Y) -> [base, bias] or null
    ell(z0, z1, a0, b0, a1, b1, mat, cx = 0) { for (let z = z0; z <= z1; z += .4) { const t = (z - z0) / Math.max(.01, z1 - z0), a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t, n = Math.ceil(Math.max(a, b) * 6.3 / .45), slope = ((a0 - a1) + (b0 - b1)) / 2 / Math.max(.01, z1 - z0); for (let i = 0; i < n; i++) { const th = i / n * 6.2832, X = cx + a * Math.cos(th), Y = b * Math.sin(th), m = mat(th, z, X, Y); if (m) this.pt(X, Y, z, Math.cos(th) / a, Math.sin(th) / b, slope / Math.max(a, b) * 1.2, m[0], m[1]); } } }
    sph(cx, cy, cz, rx, ry, rz, mat) { const R = Math.max(rx, ry, rz), n = Math.ceil(R * 3.2 / .4); for (let i = 0; i <= n; i++) { const ph = -1.5708 + i / n * 3.1416, m2 = Math.max(1, Math.ceil(Math.cos(ph) * R * 6.3 / .4)); for (let j = 0; j < m2; j++) { const th = j / m2 * 6.2832, dx = Math.cos(ph) * Math.cos(th), dy = Math.cos(ph) * Math.sin(th), dz = Math.sin(ph), m = mat(dx, dy, dz); if (m) this.pt(cx + dx * rx, cy + dy * ry, cz + dz * rz, dx / rx, dy / ry, dz / rz, m[0], m[1]); } } }
    tube(p, q, r0, r1, mat) { const len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), n = Math.ceil(len / .5); for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t; this.sph(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t, r, r, r, () => mat); } }
    edge(f = .62) { const o = new Uint8ClampedArray(this.c); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const k = (y * this.w + x) * 4; if (!o[k + 3]) continue; const out = (dx, dy) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= this.w || Y >= this.h || !o[(Y * this.w + X) * 4 + 3]; }; if (out(1, 0) || out(0, 1) || out(-1, 0)) { this.c[k] *= f; this.c[k + 1] *= f; this.c[k + 2] *= f + .05; } } } }
  // ---- monk: o = { robe, col (player), hood, hair, tons, beard, w (build), ht (height), skin }; face 0..7 = S, SW, W, NW, N, NE, E, SE on screen
  const cache = {};
  const monk = (o, face = 0) => { const key = JSON.stringify(o) + face; if (cache[key]) return cache[key];
    const w = o.w || 1, ht = o.ht || 1, S = new Surf(36, 58, 18, 53), skin = o.skin || [206, 164, 128], rb = o.robe, cord = [176, 156, 110]; S.face(Math.PI / 4 + face * Math.PI / 4);
    const Zs = z => z * ht, body = (th, z, X, Y) => Math.abs(Y) < 2.1 && z > 3 ? [o.col, Math.abs(Y) > 1.5 ? -.12 : .02] : null;
    S.ell(Zs(0), Zs(20), 6 * w, 6.9 * w, 4.3 * w, 5.5 * w, (th, z, X, Y) => body(th, z / ht, X, Y) || [rb, Math.sin(th * 9 + 1) * .1 * (1 - z / Zs(20)) - (z < 1 ? .15 : 0)]);
    S.ell(Zs(20), Zs(33), 4.3 * w, 5.5 * w, 4.6 * w, 6.5 * w, (th, z, X, Y) => z < Zs(21.3) ? [cord, 0] : body(th, 9, X, Y) || [rb, Math.sin(th * 5) * .03]);
    S.ell(Zs(33), Zs(36.6), 4.6 * w, 6.5 * w, 1.9, 2.1, (th, z, X, Y) => body(th, 9, X, Y) || [rb, .04]);
    S.ell(Zs(20.2), Zs(13), 4.6 * w, 5.2 * w, 4.9 * w, 5.3 * w, (th, z) => Math.abs(th - .5) < .16 ? [cord, -.05] : null);       // hanging end of the cord
    S.ell(Zs(36), Zs(38.2), 1.7, 1.9, 1.7, 1.9, () => [o.hood ? rb : skin, -.12]);
    const hz = Zs(41);
    S.sph(.5, 0, hz, 3.3, 3.1, 3.8, (dx, dy, dz) => { if (o.hood) return [skin, dz > .05 ? -.5 : -.22]; if (dx > .72 && Math.abs(Math.abs(dy) - .42) < .17 && dz > .02 && dz < .3) return [[40, 30, 28], -.2]; if (o.beard && dx > .1 && dz < -.22) return [o.beard, 0]; if (dz > .86 && o.tons) return [skin, .05]; if ((dz > .3 && dx < .62) || (dx < -.2 && dz > -.35)) return [o.hair || [66, 50, 38], 0]; if (dx > .9 && dz < 0 && dz > -.3) return [skin, .1]; return [skin, dz < -.5 ? -.15 : 0]; });
    if (o.hood) { S.sph(-.3, 0, hz + .2, 4.6, 4.4, 4.8, (dx, dy, dz) => dx > .52 ? null : [rb, dx > .36 ? -.14 : dz > .6 ? .06 : 0]); S.ell(Zs(33.4), Zs(38.4), 5 * w, 6.7 * w, 3.5, 3.7, (th, z) => (z > Zs(36) && (th < .6 || th > 5.68)) ? null : [rb, .03]); }
    else S.sph(-1.9, 0, Zs(36.9), 3, 4.4 * w, 1.9, () => [rb, .02]);
    for (const s of [-1, 1]) { S.tube([.4, s * 6.1 * w, Zs(32)], [2.3, s * 6.3 * w, Zs(25.5)], 2.2, 2.3, [rb, -.03]); S.tube([2.3, s * 6.3 * w, Zs(25.5)], [4.6 * w + .5, s * 1.7, Zs(23.6)], 2.3, 2.6, [rb, -.03]); }
    S.sph(5.1 * w + .4, 0, Zs(23.3), 1.5, 1.9, 1.4, () => [skin, 0]);
    S.edge(); const c = document.createElement('canvas'); c.width = S.w; c.height = S.h; c.getContext('2d').putImageData(new ImageData(S.c, S.w, S.h), 0, 0);
    return cache[key] = { w: S.w, h: S.h, ox: -S.ax, oy: -S.ay, data: S.c, canvas: c }; };
  const CAST = [
    { name: 'Hooded brother', robe: [104, 72, 48], col: [176, 52, 48], hood: 1 },
    { name: 'Tonsured brother', robe: [66, 62, 74], col: [62, 140, 88], tons: 1, hair: [70, 52, 38] },
    { name: 'Cellarer (stout, bearded)', robe: [112, 80, 52], col: [204, 152, 52], beard: [84, 58, 40], hair: [84, 58, 40], w: 1.18, ht: .95 },
    { name: 'Abbot (tall, grey)', robe: [182, 172, 152], col: [150, 60, 150], hair: [150, 150, 150], tons: 1, w: .94, ht: 1.06 },
    { name: 'Novice (small)', robe: [86, 84, 92], col: [62, 112, 176], hair: [150, 96, 50], w: .9, ht: .88 },
  ];
  window.KIT = { hs, mix, ramp, Surf, monk, CAST, DIRS: ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'] };
})();
