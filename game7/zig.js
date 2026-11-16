/* ==========================================================================
   ZIGGURATS — four stepped temples in the Civ Sim style, as one standalone file
   --------------------------------------------------------------------------
   No dependencies. Works in any browser (or anything with a 2D canvas).

   Usage
     const z = Ziggurats.build('A', { color: '#b04a2a', rot: 0 });
     ctx.drawImage(z.canvas, x - z.ax, y - z.ay);   // (ax, ay) = the middle of its floor

   Kinds
     'A'  Mud brick      three broad tiers, brick courses, a painted band in the
                         owner's colour, three stairs meeting at a gatehouse, a
                         white shrine and two pennants on top
     'B'  Stone          five steep tiers of great fitted blocks, corner lamps,
                         one long stair to an ever-burning brazier
     'C'  Painted tiers  four plastered tiers — bone, soot, ochre, the owner's
                         colour — a white coping on each, a blue shrine with a gilt roof
     'D'  Old ruin       the stone kind fallen: top gone, a front corner slumped
                         into scree, grass and vines on the steps (no owner colour)

   Options
     color   the owner's colour: '#rrggbb' or [r, g, b]          (default '#b04a2a')
     rot     facing, in eighths of a turn (0–7); 0 = stair towards the viewer
     outline true to ring the sprite in a dark 1px line           (default false — the sim draws without)
     canvas  (w, h) => canvas  — supply your own (e.g. node-canvas, OffscreenCanvas)

   Scale and look
     One unit = one art pixel. In Civ Sim a person stands ~9 px tall and the art is
     drawn at 4 px per world tile-unit, then zoomed 1–4× with no smoothing.
     The projection is the sim's three-quarter view: plan x → (1, 0.22),
     plan y (away) → (0.6, −0.38), z straight up; lit from the upper left.
     Sprites are deterministic: the same kind, colour and facing always give the same pixels.
     Footprints (plan units, half-widths × half-depths of the bottom tier):
       A 60×44 (stairs reach out to −84), B 54×42 (−88), C 56×42 (−76), D 54×42 (−80).
     Each is ~100–180 ms to build: build once per kind/colour/facing and cache.
   ========================================================================== */
(function (root) {
'use strict';
let _mkCanvas = (w, h) => { const c = (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') ? new OffscreenCanvas(w, h) : document.createElement('canvas'); c.width = w; c.height = h; return c; };
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function hex(h) { if (Array.isArray(h)) return h; const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(c, f) { return [clamp(c[0] * f, 0, 255), clamp(c[1] * f, 0, 255), clamp(c[2] * f, 0, 255)]; }
function hash2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function mkCanvas(w, h) { const c = _mkCanvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
let _outline = false;
function outline(c, col, alpha) {
  if (!_outline) return c;
  const x2 = c.getContext('2d'), w = c.width, h = c.height;
  const im = x2.getImageData(0, 0, w, h), d = im.data, o = new Uint8ClampedArray(d);
  const [r, gg, b] = hex(col || '#1a120c');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (x + y * w) * 4; if (d[k + 3] > 0) continue;
    let n = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && d[(xx + yy * w) * 4 + 3] > 120) { n = true; break; } }
    if (n) { o[k] = r; o[k + 1] = gg; o[k + 2] = b; o[k + 3] = alpha ?? 215; }
  }
  im.data.set(o); x2.putImageData(im, 0, 0); return c;
}
const H3 = s => s.map(hex);
// the sim's wall palettes (the parts the ziggurats use)
const W3_PAL = {
  earth: [H3(['#6a4a30', '#8a6440', '#a8804f', '#c49c66']), H3(['#5e4632', '#7e5e42', '#9c7a54', '#b8966a']), H3(['#74503a', '#94684a', '#b2845a', '#cca070'])],
  sod: H3(['#2f4a22', '#3f622c', '#557d38', '#6f9a48']),
  stone: H3(['#4e4a44', '#6a655d', '#868076', '#a29b8f', '#bab3a6']),
  rubble: H3(['#46423c', '#5e5951', '#787268', '#928b7f', '#aca496']),
};

/* ---- the 3/4 projection: a z-buffered surface, sampled point by point (from the sim's round buildings) ---- */
const B3_EX = [1, 0.22], B3_EY = [0.6, -0.38], B3_VIEW = [-0.6, 1, -0.512];
const B3_LT = (() => { const l = [-0.55, -0.45, 0.7], m = Math.hypot(...l); return l.map(a => a / m); })();
function surf3D(Wd, Ht, cx, base, rot, split) {
  const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
  const mk = () => ({ zb: new Float32Array(Wd * Ht).fill(1e9), img: new Uint8ClampedArray(Wd * Ht * 4) });
  const L0 = mk(), L1 = split ? mk() : null;
  const S3 = {
    Wd, Ht, cx, base, layer: 0,
    // local frame → plan (turned to its facing)
    turn: (x, y) => [x * c - y * s, x * s + y * c],
    proj: (x, y, z) => [cx + _k * (x * B3_EX[0] + y * B3_EY[0]), base + _k * (-z + x * B3_EX[1] + y * B3_EY[1])],
    lit: N => 0.5 + 0.62 * Math.max(0, N[0] * B3_LT[0] + N[1] * B3_LT[1] + N[2] * B3_LT[2]),
    put(sx, sy, d, col, lay) {
      sx = Math.round(sx); sy = Math.round(sy); if (sx < 0 || sy < 0 || sx >= Wd || sy >= Ht) return;
      const L = (lay ?? S3.layer) && L1 ? L1 : L0, i = sx + sy * Wd; if (d >= L.zb[i]) return; L.zb[i] = d;
      L.img[i * 4] = col[0]; L.img[i * 4 + 1] = col[1]; L.img[i * 4 + 2] = col[2]; L.img[i * 4 + 3] = 255;
    },
    // a surface point in the local frame, its local normal and a colour function of the plan-lit normal
    emit(x, y, z, N, colFn) {
      const [px, py] = S3.turn(x, y), Nw = [N[0] * c - N[1] * s, N[0] * s + N[1] * c, N[2]];
      const pr = S3.proj(px, py, z), d = px * B3_VIEW[0] + py * B3_VIEW[1] + z * B3_VIEW[2];
      S3.put(pr[0], pr[1], d, typeof colFn === 'function' ? colFn(S3.lit(Nw), Nw) : colFn, split ? (py > 0.5 ? 0 : 1) : 0);
    },
    at: (x, y, z) => { const [px, py] = S3.turn(x, y); return S3.proj(px, py, z); },
    canvas(L) { L = L || L0; const [c0, x0] = mkCanvas(Wd, Ht); const id = x0.createImageData(Wd, Ht); id.data.set(L.img); x0.putImageData(id, 0, 0); return c0; },
    layers() { return [L0, L1]; },
  };
  return S3;
}

/* ---- a small kit of lit surfaces: quads, boxes, cylinders, disks, tubes (from the sim's halls) ---- */
const HK = (() => {
  const ST = 0.33, norm = v => { const m = Math.hypot(...v) || 1; return v.map(a => a / m); };
  const sp = (col, l, x, y, s, k) => shade(col, l * (1 - (k || 0.08) + (k || 0.08) * 2 * hash2(Math.floor(x), Math.floor(y), s || 7)));
  function quad(S, P, U, V, N, cf) {
    const lu = Math.hypot(...U), lv = Math.hypot(...V), nu = Math.max(1, Math.ceil(lu / ST)), nv = Math.max(1, Math.ceil(lv / ST));
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const a = i / nu, b = j / nv; S.emit(P[0] + U[0] * a + V[0] * b, P[1] + U[1] * a + V[1] * b, P[2] + U[2] * a + V[2] * b, N, l => cf(a * lu, b * lv, l)); }
  }
  function box(S, x0, x1, y0, y1, z0, z1, cf) {
    const w = x1 - x0, d = y1 - y0, h = z1 - z0;
    quad(S, [x0, y0, z0], [w, 0, 0], [0, 0, h], [0, -1, 0], (u, v, l) => cf('f', u, v, l));
    quad(S, [x0, y1, z0], [w, 0, 0], [0, 0, h], [0, 1, 0], (u, v, l) => cf('b', u, v, l));
    quad(S, [x0, y0, z0], [0, d, 0], [0, 0, h], [-1, 0, 0], (u, v, l) => cf('l', u, v, l));
    quad(S, [x1, y0, z0], [0, d, 0], [0, 0, h], [1, 0, 0], (u, v, l) => cf('r', u, v, l));
    quad(S, [x0, y0, z1], [w, 0, 0], [0, d, 0], [0, 0, 1], (u, v, l) => cf('t', u, v, l));
  }
  function gable(S, x0, x1, y0, y1, ze, zr, ov, cf, endCf) {
    const ym = (y0 + y1) / 2, X0 = x0 - ov, X1 = x1 + ov, Y0 = y0 - ov, Y1 = y1 + ov, zE = ze - ov * (zr - ze) / (ym - y0);
    const Nf = norm([0, -(zr - zE), ym - Y0]), Nb = norm([0, zr - zE, ym - Y0]);
    quad(S, [X0, Y0, zE], [X1 - X0, 0, 0], [0, ym - Y0, zr - zE], Nf, (u, v, l) => cf('f', u, v, l));
    quad(S, [X0, Y1, zE], [X1 - X0, 0, 0], [0, ym - Y1, zr - zE], Nb, (u, v, l) => cf('b', u, v, l));
    for (const [x, n] of [[x0, -1], [x1, 1]]) for (let y = y0; y <= y1; y += ST) { const zt = ze + (zr - ze) * (1 - Math.abs(y - ym) / (ym - y0)); for (let z = ze; z <= zt; z += ST) S.emit(x, y, z, [n, 0, 0], l => (endCf || cf)('e' + (n < 0 ? 'l' : 'r'), y - y0, z - ze, l)); }
  }
  function cyl(S, cx, cy, r0, z0, z1, cf, r1) {
    r1 = r1 ?? r0; const h = z1 - z0;
    for (let z = z0; z <= z1; z += ST) { const r = r0 + (r1 - r0) * (z - z0) / (h || 1); for (let a = 0; a < TAU; a += ST / Math.max(1, r)) { const N = norm([Math.cos(a), Math.sin(a), (r0 - r1) / (h || 1)]); S.emit(cx + r * Math.cos(a), cy + r * Math.sin(a), z, N, l => cf(a, z - z0, l, r)); } }
  }
  function disk(S, cx, cy, r, z, cf, ri) { for (let rr = ri || 0; rr <= r; rr += ST) for (let a = 0; a < TAU; a += ST / Math.max(1, rr)) S.emit(cx + rr * Math.cos(a), cy + rr * Math.sin(a), z, [0, 0, 1], l => cf(a, rr, l)); }
  function tube(S, p0, p1, r, cf) {
    const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(...d), u = d.map(a => a / L);
    let v = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]; const dt = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; v = norm([v[0] - u[0] * dt, v[1] - u[1] * dt, v[2] - u[2] * dt]);
    const w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (let t = 0; t <= L; t += ST) for (let a = 0; a < TAU; a += Math.min(1, ST / Math.max(0.3, r))) { const N = [v[0] * Math.cos(a) + w[0] * Math.sin(a), v[1] * Math.cos(a) + w[1] * Math.sin(a), v[2] * Math.cos(a) + w[2] * Math.sin(a)]; S.emit(p0[0] + u[0] * t + N[0] * r, p0[1] + u[1] * t + N[1] * r, p0[2] + u[2] * t + N[2] * r, N, l => cf(t / L, a, l)); }
  }
  const fin = S => ({ c: outline(S.canvas(), '#1d140d', 200), ax: S.cx, ay: S.base });
  return { ST, norm, sp, quad, box, gable, cyl, disk, tube, fin };
})();
const HKC = (() => { const C = h => hex(h); return {
  WD: ['#6b4e34', '#7d5c3e', '#5c432c'].map(C), WDD: C('#3e2c1e'), WDL: C('#9a7652'), DARK: C('#1c120a'), RED: C('#b04a2a'),
  THA: ['#9a8048', '#b49a5a', '#c8b070'].map(C), STN: ['#776c5c', '#8d8370', '#a69c86'].map(C), STD: C('#4e463c'),
}; })();

/* ---- stone and earth, as the sim's walls draw them ---- */
const STW = (() => {
  const lv = lit => clamp((lit - 0.5) / 0.62, 0, 1), pk = (pal, v) => pal[clamp(Math.floor(v * pal.length), 0, pal.length - 1)], fr = v => ((v % 1) + 1) % 1;
  // look: 'dyke' (rubble) · 'cyclop' (great fitted blocks) · 'curtain' (coursed); f: 'side' | 'top'
  function col(look, u, z, f, lit, seed) {
    const ST = W3_PAL.stone, RB = W3_PAL.rubble, cur = look === 'curtain', big = look === 'cyclop';
    if (f === 'top') return pk(cur ? ST : RB, lv(lit) * 0.8 + 0.12 + (hash2(Math.round(u * 1.5), 7, seed) - 0.5) * 0.14);
    if (cur) { const row = Math.floor(z / 2.6), uu = u + (row % 2) * 2.6, fu = fr(uu / 5.2), fv = fr(z / 2.6); return pk(ST, lv(lit) * 0.85 + (fv < 0.17 || fu < 0.09 ? -0.2 : (hash2(Math.floor(uu / 5.2), row, seed) - 0.5) * 0.12)); }
    if (big) { const iy = Math.floor(z / 4.8), gx = u / 6.5 + hash2(iy, 1, 3) * 0.8, ix = Math.floor(gx), fx = fr(gx), fy = fr(z / 4.8), sk = (hash2(ix, iy, 4) - 0.5) * 0.4, e = Math.min(fx, 1 - fx, fy + sk * (fx - 0.5), 1 - fy); return pk(ST, lv(lit) * 0.85 + (e < 0.06 ? -0.26 : (hash2(ix, iy, 8) - 0.5) * 0.22 + (1 - fy) * 0.05)); }
    const row = Math.floor(z / 2.2), off = hash2(row, 7, seed) * 4, w = 2.6 + hash2(row, 3, 2) * 2, fu = fr((u + off) / w), fv = fr(z / 2.2), cu = Math.floor((u + off) / w);
    return pk(RB, lv(lit) * 0.85 + (fv < 0.2 || fu < 0.12 ? -0.28 : (hash2(cu, row, 5) - 0.5) * 0.34));
  }
  // rammed earth, as the walls draw it
  function earth(u, z, f, lit, seed) {
    if (f === 'top') return pk(W3_PAL.earth[(seed + 1) % 3], lv(lit) * 0.75 + 0.2 + (hash2(Math.round(u * 2), 3, seed) - 0.5) * 0.1);
    const course = Math.floor(z / 3.5), pal = W3_PAL.earth[(course + seed) % 3], band = (z % 3.5) < 0.5 ? -0.16 : 0;
    const hole = f === 'side' && Math.abs((z % 3.5) - 1.75) < 0.45 && Math.abs((((u % 6) + 6) % 6) - 3) < 0.5 ? -0.5 : 0;
    return pk(pal, lv(lit) * 0.85 + band + hole + (hash2(Math.round(u * 2), Math.round(z * 2), seed) - 0.5) * 0.14);
  }
  return { col, earth, lv, pk };
})();

let _rot = 0, _k = 1, _ang = 0;

/* ======================= the four ziggurats ======================= */
// ziggurats, built with the game's own 3/4 surface kit (HK / surf3D) and wall palettes
const ZIG = (() => {
  const C = h => hex(h), sh = shade;
  const ST = W3_PAL.stone, RB = W3_PAL.rubble, pk = STW.pk, lv = STW.lv;
  const brick = (u, v, l, s, pal) => { const row = Math.floor(v / 1.7), off = (row % 2) * 2.2, fu = (((u + off) / 4.4) % 1 + 1) % 1, fv = (v / 1.7) % 1;
    const P = pal || W3_PAL.earth[(row + s) % 3]; return pk(P, lv(l) * 0.85 + (fv < 0.22 || fu < 0.1 ? -0.18 : (hash2(Math.floor((u + off) / 4.4), row, s) - 0.5) * 0.16)); };
  const plaster = (col, u, v, l, s, k) => sh(col, l * (0.94 + 0.12 * hash2(Math.floor(u * 0.7), Math.floor(v * 0.7), s)) * (k || 1));
  // one flight of stairs climbing in +y from yf to the face at yw, rising to zt; sw half-width, at x offset ox
  function stair(S3, ox, sw, yf, yw, z0, zt, stepCf, sideCf, rail) {
    const n = Math.max(2, Math.round((zt - z0) / 2)), rise = (zt - z0) / n, dep = (yw - yf) / n;
    for (let k = 0; k < n; k++) HK.box(S3, ox - sw, ox + sw, yf + k * dep, yw + 0.6, z0, z0 + (k + 1) * rise, (f, u, v, l) => f === 't' ? stepCf(u, v, l, k) : (f === 'f' ? stepCf(u, v + 9, l * 0.82, k) : sideCf(u, v, l)));
    if (rail) for (const sx of [-1, 1]) {   // a low wall each side of the flight, sloping with it
      const x = ox + sx * (sw + 0.9);
      HK.box(S3, x - 0.9, x + 0.9, yf - 0.5, yf + 1.2, z0, z0 + rise + 1.6, (f, u, v, l) => sideCf(u, v, l));
      HK.quad(S3, [x - 0.9, yf, z0 + rise + 1.6], [1.8, 0, 0], [0, yw - yf, zt - z0 - rise], HK.norm([0, -(zt - z0), yw - yf]), (u, v, l) => sideCf(u, v + 40, l * 1.05));
      HK.quad(S3, [x + sx * 0.9, yf, z0], [0, 0, rise + 1.6], [0, yw - yf, zt - z0 - rise], [sx, 0, 0], (u, v, l) => sideCf(u + 7, v, l));
    }
  }
  // a little shrine on the top: walls, a door, a flat or domed roof
  function shrine(S3, z, hw, hd, h, wallCf, roofCf, opt) {
    HK.box(S3, -hw, hw, -hd, hd, z, z + h, (f, u, v, l) => (f === 'f' && Math.abs(u - hw) < 1.8 && v < h * 0.62) ? HKC.DARK : (f === 't' ? roofCf(u, v, l) : wallCf(f, u, v, l)));
    if (opt && opt.dome) HK.disk(S3, 0, 0, Math.min(hw, hd) * 0.8, z + h + 0.1, (a, r, l) => roofCf(a * r, r, l));
    if (opt && opt.cap) HK.box(S3, -hw - 0.8, hw + 0.8, -hd - 0.8, hd + 0.8, z + h, z + h + 1.2, (f, u, v, l) => roofCf(u, v, l));
  }
  function fire(S3, x, y, z) {   // a brazier and its flame (fixed colours: the drafts' still frame)
    HK.cyl(S3, x, y, 2.2, z, z + 2.5, (a, zz, l) => sh(C('#5a4a3a'), l), 3);
    const F = [C('#ffe9a0'), C('#ffc040'), C('#f08a28'), C('#c8501c')];
    for (let k = 0; k < 70; k++) { const zz = z + 3 + hash2(k, 1, 9) * 7, r = (1 - (zz - z - 3) / 7) * 2.6 * hash2(k, 2, 9), a = hash2(k, 3, 9) * TAU; S3.emit(x + Math.cos(a) * r, y + Math.sin(a) * r, zz, [0, -1, 0], F[Math.min(3, Math.floor((zz - z - 3) / 2.2 + hash2(k, 4, 9)))]); }
  }
  function pole(S3, x, y, z, h, col) {
    HK.tube(S3, [x, y, z], [x, y, z + h], 0.45, (t, a, l) => sh(C('#5b3e26'), l));
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) S3.emit(x + 0.6 + i * 0.5, y, z + h - 0.6 - j * 0.55 - i * 0.12 * (j / 3), [0, -1, 0], l => sh(col, 0.95 - i * 0.03));
  }

  /* A · mud brick: three broad tiers of sun-dried brick with fired-brick facing at the corners, three stairs meeting at a gate */
  function A(col) {
    const S3 = surf3D(230, 210, 115, 168, _ang), s = 3;
    const T = [[60, 44, 0, 26], [42, 30, 26, 46], [26, 19, 46, 62]];
    const wall = (u, v, l, k) => { const g = v < 1.4 ? -0.08 : 0; return brick(u, v, l * (1 + g), s + k); };
    T.forEach(([hw, hd, z0, z1], k) => HK.box(S3, -hw, hw, -hd, hd, z0, z1, (f, u, v, l) => {
      if (f === 't') return pk(W3_PAL.earth[(k + 1) % 3], lv(l) * 0.7 + 0.22 + (hash2(Math.floor(u * 0.5), Math.floor(v * 0.5), 5) - 0.5) * 0.1);
      if (v > (z1 - z0) - 1.6) return sh(col, l * 0.9);   // a painted band along each tier's lip, the people's colour
      if (Math.floor(v) % 6 === 3 && Math.floor(u) % 9 === 4 && v < (z1 - z0) - 3) return sh(C('#2a1e14'), l);   // weep holes for the rain in the brick
      return wall(u, v, l, k); }));
    const stepC = (u, v, l, k) => pk(W3_PAL.earth[2], lv(l) * 0.75 + 0.2 + (Math.floor(v) % 2 ? -0.06 : 0)), side = (u, v, l) => brick(u, v, l, 8, W3_PAL.earth[0]);
    stair(S3, 0, 5, -84, -44, 0, 26, stepC, side, true);                    // the great centre flight, out in front
    stair(S3, 0, 4.2, -44, -30, 26, 46, stepC, side, true);                   // and on up the second tier
    // the two side flights, running along the front face to meet the centre at the gatehouse
    for (const sx of [-1, 1]) for (let k = 0; k < 13; k++) { const x0 = sx * (58 - k * 3.8); HK.box(S3, Math.min(x0, x0 - sx * 3.8), Math.max(x0, x0 - sx * 3.8), -51, -44, 0, (k + 1) * 2, (f, u, v, l) => f === 't' ? stepC(u, v, l, k) : brick(u, v, l * 0.92, 8, W3_PAL.earth[2])); }
    HK.box(S3, -9, 9, -52, -42, 26, 35, (f, u, v, l) => (f === 'f' && Math.abs(u - 9) < 3 && v < 6) ? HKC.DARK : f === 't' ? stepC(u, v, l, 0) : brick(u, v, l, 9));   // the gatehouse where the flights meet
    shrine(S3, 62, 11, 8, 11, (f, u, v, l) => plaster(C('#d8ccb0'), u, v, l, 4), (u, v, l) => plaster(C('#b8a888'), u, v, l, 5), { cap: true });
    for (const [x, y] of [[-9, -6], [9, -6]]) pole(S3, x, y, 73, 9, col);
    return HK.fin(S3);
  }
  /* B · stone: five steep tiers of great fitted blocks and one long stair to a fire that never goes out */
  function B(col) {
    const S3 = surf3D(220, 250, 110, 200, _ang), s = 11;
    const T = [[54, 42, 0, 22], [44, 33, 22, 42], [34, 25, 42, 60], [24, 17, 60, 76], [14, 10, 76, 90]];
    T.forEach(([hw, hd, z0, z1], k) => HK.box(S3, -hw, hw, -hd, hd, z0, z1, (f, u, v, l) => {
      if (f === 't') return pk(ST, lv(l) * 0.8 + 0.12 + (hash2(Math.floor(u * 0.4), Math.floor(v * 0.4), 3) - 0.5) * 0.12);
      if (v < 1.2) return pk(ST, lv(l) * 0.55);
      return STW.col('cyclop', u, v, f, l, s + k); }));
    const stepC = (u, v, l, k) => pk(ST, lv(l) * 0.8 + 0.14 + (k % 2 ? -0.05 : 0)), side = (u, v, l) => STW.col('curtain', u, v, 'side', l, 21);
    stair(S3, 0, 6, -88, -10, 0, 90, stepC, side, true);
    // stone lamps on the corners of each tier
    T.slice(0, 4).forEach(([hw, hd, z0, z1]) => { for (const sx of [-1, 1]) HK.box(S3, sx * (hw - 2.5) - 1.3, sx * (hw - 2.5) + 1.3, -hd + 1.2, -hd + 3.8, z1, z1 + 3.2, (f, u, v, l) => pk(ST, lv(l) * 0.9 + 0.05)); });
    HK.box(S3, -8, 8, -6, 6, 90, 92, (f, u, v, l) => pk(ST, lv(l) * 0.85 + 0.1));
    fire(S3, 0, 2, 92);
    for (const sx of [-1, 1]) pole(S3, sx * 11, -8, 90, 11, col);
    return HK.fin(S3);
  }
  /* C · painted: four plastered tiers, each its own colour (bone, soot, ochre, the people's own) under a gilt shrine */
  function Cz(col) {
    const S3 = surf3D(220, 240, 110, 190, _ang), s = 17;
    const PC = [C('#d9cfb6'), C('#3a3330'), C('#a8562e'), col];
    const T = [[56, 42, 0, 22], [42, 31, 22, 42], [30, 22, 42, 58], [19, 14, 58, 72]];
    T.forEach(([hw, hd, z0, z1], k) => HK.box(S3, -hw, hw, -hd, hd, z0, z1, (f, u, v, l) => {
      if (f === 't') return plaster(C('#c4b896'), u, v, l, k, 0.92);
      if (v > (z1 - z0) - 1.4) return plaster(C('#e6dcc4'), u, v, l, k);   // a white coping on every tier
      if ((Math.floor(u) % 5 === 0) && v > 2) return plaster(PC[k], u, v, l, k, 0.78);   // the flat buttresses, shadowed
      return plaster(PC[k], u, v, l, k); }));
    const stepC = (u, v, l, k) => plaster(C('#d0c4a4'), u, v, l, k, k % 2 ? 0.92 : 1), side = (u, v, l) => plaster(C('#cfc3a2'), u, v, l, 3);
    // a ramp wound round it: here, a straight stair up the first two, then the side approach drawn as a walkway on the third
    stair(S3, 0, 5.5, -76, -42, 0, 22, stepC, side, true);
    stair(S3, 0, 4.8, -42, -31, 22, 42, stepC, side, true);
    stair(S3, 0, 4, -31, -22, 42, 58, stepC, side, true);
    shrine(S3, 72, 10, 8, 8, (f, u, v, l) => plaster(C('#3f5fa0'), u, v, l, 9), (u, v, l) => sh(C('#e0b04a'), l * (0.9 + 0.2 * hash2(Math.floor(u), Math.floor(v), 4))), { cap: true, dome: false });
    for (const [x, y] of [[-53, -40], [53, -40], [-39, -29], [39, -29]]) pole(S3, x, y, x < -50 || x > 50 ? 22 : 42, 10, col);
    return HK.fin(S3);
  }
  /* D · old ruin: the stone kind, long fallen — the top gone, a corner slumped to a slope of rubble, grass and vines on the steps */
  function D() {
    const S3 = surf3D(220, 220, 110, 170, _ang), s = 29, SOD = W3_PAL.sod;
    const T = [[54, 42, 0, 22], [44, 33, 22, 42], [34, 25, 42, 56]];
    const broken = (x, y, z) => z > 64 - (x - 6) * 1.1 - (-y - 4) * 1.1 + hash2(Math.floor(x * 0.5), Math.floor(z * 0.5), 3) * 5;   // the right-front corner slumped away   // the slumped right-front corner
    T.forEach(([hw, hd, z0, z1], k) => {
      const cf = (f, u, v, l) => {
        if (f === 't') return hash2(Math.floor(u * 0.25), Math.floor(v * 0.25), k + 3) < 0.4 ? pk(SOD, lv(l) * 0.8 + 0.1) : pk(RB, lv(l) * 0.75 + 0.15);
        if (v > (z1 - z0) - 2.5 && hash2(Math.floor(u * 0.2), k, 8) < 0.35) return pk(SOD, lv(l) * 0.7 + 0.08);   // grass spilling over each lip
        if (hash2(Math.floor(u / 3), 0, 13) < 0.06 && Math.floor(u) % 3 === 1 && hash2(Math.floor(u / 3), Math.floor(v / 4), 14) < 0.8) return pk(SOD, lv(l) * 0.55);   // a vine
        return STW.col(k ? 'dyke' : 'cyclop', u, v, f, l, s + k); };
      // built point by point so the slumped corner can be left out
      const S0 = { emit: (x, y, z, N, fn) => { if (!broken(x, y, z)) S3.emit(x, y, z, N, fn); } };
      HK.box(S0, -hw, hw, -hd, hd, z0, z1, cf);
    });
    // the scree of the fallen corner
    for (let k = 0; k < 2600; k++) { const a = hash2(k, 1, 5), b = hash2(k, 2, 5), x = 8 + a * 56, y = -64 + b * 56, z = Math.max(0, 22 - Math.max(0, x - 40) * 0.8 - Math.max(0, -y - 42) * 0.8) * Math.sqrt(hash2(k, 3, 5)) + hash2(k, 4, 5) * 1.2;
      if (!broken(x, y, z + 0.1) || z > 30) continue; S3.emit(x, y, z, HK.norm([0.3, -0.6, 1]), l => pk(RB, lv(l) * 0.8 + (hash2(k, 6, 5) - 0.5) * 0.4)); }
    const stepC = (u, v, l, k) => hash2(Math.floor(u * 0.4), k, 4) < 0.18 ? pk(SOD, lv(l) * 0.8 + 0.12) : pk(RB, lv(l) * 0.8 + 0.12 - (hash2(Math.floor(u * 0.5), k, 6) < 0.15 ? 0.3 : 0)), side = (u, v, l) => STW.col('dyke', u, v, 'side', l, 31);
    stair(S3, 0, 6, -80, -25, 0, 42, stepC, side, true);
    // a toppled block or two and a broken lamp
    HK.box(S3, -50, -42, -66, -60, 0, 4, (f, u, v, l) => STW.col('cyclop', u, v, f === 't' ? 'top' : 'side', l, 40));
    HK.box(S3, -30, -25, -62, -56, 0, 3, (f, u, v, l) => STW.col('cyclop', u, v, f === 't' ? 'top' : 'side', l, 41));
    return HK.fin(S3);
  }
  return { A, B, C: Cz, D };
})();

/* ---- the public face ---- */
const KINDS = { A: 'Mud brick', B: 'Stone', C: 'Painted tiers', D: 'Old ruin' };
function build(kind, o) {
  o = o || {}; kind = String(kind || 'A').toUpperCase(); if (!ZIG[kind]) throw new Error('Ziggurats: no kind ' + kind + ' (A, B, C or D)');
  if (o.canvas) _mkCanvas = (w, h) => o.canvas(w, h);
  _outline = !!o.outline; _rot = ((o.rot | 0) % 8 + 8) % 8; _k = o.scale || 1; _ang = o.angle != null ? o.angle : _rot * Math.PI / 4;
  const keep = W3_PAL.earth; if (o.white) W3_PAL.earth = [H3(['#a39b8a', '#c4bcab', '#ddd6c6', '#f1ece0']), H3(['#9a9281', '#bbb3a2', '#d6cfbf', '#ece7da']), H3(['#a7a08f', '#c8c1b0', '#e1dacb', '#f5f1e6'])];
  let s; try { s = ZIG[kind](hex(o.color || '#b04a2a')); } finally { W3_PAL.earth = keep; }
  return { canvas: s.c, ax: s.ax, ay: s.ay, kind, name: KINDS[kind] };
}
root.Ziggurats = { build, KINDS, version: 1 };
if (typeof module !== 'undefined' && module.exports) module.exports = root.Ziggurats;
})(typeof window !== 'undefined' ? window : globalThis);
