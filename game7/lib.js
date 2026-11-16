'use strict';
/* Shared pixel-art painter for the decision drafts.
   Palette + 4x4 Bayer 3-tone ramps lifted from Civ Sim's PAL / artSlots. */
const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v => (v + .5) / 16);
const bay = (x, y) => BAYER[(x & 3) + ((y & 3) << 2)];
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y, s) => vnoise(x, y, s) * .6 + vnoise(x * 2.1, y * 2.1, s + 7) * .3 + vnoise(x * 4.3, y * 4.3, s + 13) * .1;
const toneI = (v, x, y) => { v += bay(x, y) * .22; return v < .4 ? 0 : v < .66 ? 1 : 2; };
const tone = (r, v, x, y) => r[toneI(v, x, y)];
const hx = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const RGB = {}; const rgb = c => RGB[c] || (RGB[c] = hx(c));

const TER = {
  forest:   { ramp: ['#2f5e2c', '#3a6e33', '#4a7f3c'], res: 'Timber' },
  hill:     { ramp: ['#7a4a30', '#8f5a3a', '#a66e4a'], res: 'Clay' },
  pasture:  { ramp: ['#4f8a3a', '#5f9c43', '#79b252'], res: 'Wool' },
  field:    { ramp: ['#9a8a3a', '#b29f48', '#c9b65e'], res: 'Grain' },
  mountain: { ramp: ['#57514c', '#6e6862', '#8a837b'], res: 'Ore' },
  desert:   { ramp: ['#c4ab72', '#d6bf86', '#e6d39f'], res: '—' },
};
const SEA = { deep: ['#173659', '#1c4068', '#22497a'], shallow: ['#2a6688', '#33789a', '#4b8fa8'], surf: '#8fbcc8', sand: ['#c4ab72', '#d6bf86', '#e6d39f'] };
const PLAYER = { red: ['#c8463a', '#8a2a22', '#e8786a'], blue: ['#3a6ec8', '#22468a', '#6a9ae8'], gold: ['#e9b95a', '#a87a2a', '#f4d692'], violet: ['#8a5ad0', '#5a3a8a', '#b48cff'], raider: ['#4e4a48', '#2c2a29', '#7c7670'] };

/* ---------- art buffer ---------- */
function Art(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
Art.prototype.set = function (x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4, [r, g, b] = rgb(c);
  if (a == null || a >= 1) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; } else { this.d[i] += (r - this.d[i]) * a; this.d[i + 1] += (g - this.d[i + 1]) * a; this.d[i + 2] += (b - this.d[i + 2]) * a; this.d[i + 3] = 255; } };
Art.prototype.shade = function (x, y, k) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4; for (let j = 0; j < 3; j++) this.d[i + j] = this.d[i + j] * k; };
Art.prototype.canvas = function () { const c = document.createElement('canvas'); c.width = this.w; c.height = this.h; c.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return c; };
Art.prototype.sprite = function (rows, x, y, pal, flip) { rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || ch === ' ') continue; const c = pal[ch]; if (c) this.set(flip ? x + row.length - 1 - i : x + i, y + j, c); } }); };

/* ---------- boards ---------- */
const S3 = Math.sqrt(3);
const HEXES = []; for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) if (Math.abs(q + r) <= 2) HEXES.push([q, r]);
const LAYOUT = ['mountain', 'pasture', 'forest', 'field', 'hill', 'pasture', 'hill', 'field', 'forest', 'desert', 'forest', 'mountain', 'forest', 'mountain', 'field', 'pasture', 'hill', 'field', 'pasture'];
const NUMS = [10, 2, 9, 12, 6, 4, 10, 9, 11, 0, 3, 8, 8, 3, 4, 5, 5, 6, 11];
function cubeRound(q, r) { let x = q, z = r, y = -x - z, rx = Math.round(x), ry = Math.round(y), rz = Math.round(z); const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry; return [rx, rz]; }

/* kind: 'hex' | 'square' | 'organic'. Returns {art, tiles, corner(tile,i), toScreen} */
function makeBoard(o) {
  const W = o.w, H = o.h, s = o.s, ox = o.ox, oy = o.oy, kind = o.kind;
  const tiles = []; const byKey = {};
  if (kind === 'square') {
    const rows = [3, 5, 5, 5, 3]; const types = ['mountain','pasture','forest','field','hill','pasture','hill','field','forest','mountain','forest','desert','field','pasture','hill','forest','mountain','field','hill','pasture','field'];
    const nums = [10,2,9,12,6,4,10,9,11,5,3,0,8,3,4,8,5,6,11,4,9]; let k = 0;
    rows.forEach((n, r) => { for (let c = 0; c < n; c++) { const col = c + (5 - n) / 2; const t = { key: r + ',' + c, q: col, r, type: types[k], num: nums[k], cx: ox + (col - 2) * s, cy: oy + (r - 2) * s }; k++; tiles.push(t); byKey[t.key] = t; } });
  } else {
    HEXES.forEach(([q, r], i) => { const t = { key: q + ',' + r, q, r, type: LAYOUT[i], num: NUMS[i], cx: ox + s * S3 * (q + r / 2), cy: oy + s * 1.5 * r }; tiles.push(t); byKey[t.key] = t; });
  }
  if (o.override) o.override(tiles);
  const id = new Int16Array(W * H).fill(-1), land = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let px = x, py = y;
    if (kind === 'organic') { px += (fbm(x * .07, y * .07, 11) - .5) * s * .75; py += (fbm(x * .07, y * .07, 29) - .5) * s * .75; }
    let t;
    if (kind === 'square') { const r = Math.floor((py - oy) / s + 2.5), rowN = [3, 5, 5, 5, 3][r]; if (rowN) { const c = Math.floor((px - ox) / s + 2.5 - (5 - rowN) / 2); t = byKey[r + ',' + c]; } }
    else { const fx = px - ox, fy = py - oy; const [q, r] = cubeRound((S3 / 3 * fx - fy / 3) / s, (2 / 3 * fy) / s); t = byKey[q + ',' + r]; }
    if (t) { id[y * W + x] = tiles.indexOf(t); land[y * W + x] = 1; }
  }
  if (kind === 'organic') { // erode coast a little so it reads as a shoreline, not a stamped shape
    const L2 = land.slice(); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; let nb = land[i - 1] + land[i + 1] + land[i - W] + land[i + W]; if (land[i] && nb < 4 && hash(x, y, 77) < .35) L2[i] = 0; } land.set(L2);
  }
  // distance to land (sea) / to sea (land) — two-pass chamfer
  const dist = (mask, want) => { const D = new Float32Array(W * H).fill(1e9); for (let i = 0; i < W * H; i++) if (mask[i] === want) D[i] = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (x) D[i] = Math.min(D[i], D[i - 1] + 1); if (y) D[i] = Math.min(D[i], D[i - W] + 1); if (x && y) D[i] = Math.min(D[i], D[i - W - 1] + 1.41); if (y && x < W - 1) D[i] = Math.min(D[i], D[i - W + 1] + 1.41); }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (x < W - 1) D[i] = Math.min(D[i], D[i + 1] + 1); if (y < H - 1) D[i] = Math.min(D[i], D[i + W] + 1); if (x < W - 1 && y < H - 1) D[i] = Math.min(D[i], D[i + W + 1] + 1.41); if (y < H - 1 && x) D[i] = Math.min(D[i], D[i + W - 1] + 1.41); } return D; };
  const toLand = dist(land, 1), toSea = dist(land, 0);
  const art = new Art(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, n = fbm(x * .11, y * .11, 3), sh = (fbm((x - 1) * .11, (y - 1) * .11, 3) - fbm((x + 1) * .11, (y + 1) * .11, 3)) * 6;
    if (!land[i]) { const d = toLand[i];
      let c = d < 6.5 ? tone(SEA.shallow, (1 - d / 6.5) * .8 + n * .25, x, y) : tone(SEA.deep, n * .7 + Math.max(0, .3 - (d - 6) * .03), x, y);
      if (d < 1.6 && fbm(x * .3, y * .3, 9) > .42) c = SEA.surf; if (hash(x, y, 991) < .006) c = '#3e6a96';
      art.set(x, y, c); continue; }
    const t = tiles[id[i]], R = TER[t.type].ramp; let v = n * .85 + sh * .8;
    if (t.type === 'field') v = .35 + sh * .5 + (((x + (y >> 1)) % 4) < 2 ? .28 : -.1);
    if (t.type === 'mountain') v = n * .6 + sh * 1.4;
    let c = tone(R, v, x, y);
    if (t.type === 'pasture' && hash(x, y, 5) < .025) c = ['#f2e27a', '#f4f2ee', '#e978a8'][(hash(x, y, 6) * 3) | 0];
    if (kind === 'organic' && toSea[i] < 2.2) c = tone(SEA.sand, n + .2, x, y);
    art.set(x, y, c);
  }
  // tile borders
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!land[i]) continue;
    const a = id[i], r = x < W - 1 ? id[i + 1] : a, b = y < H - 1 ? id[i + W] : a;
    const edge = (r !== a && r >= 0) || (b !== a && b >= 0);
    if (edge) { if (kind === 'organic') { if ((x + y) % 2 === 0) art.shade(x, y, .72); } else art.shade(x, y, .5); }
    if (kind !== 'organic' && toSea[i] < 1.2) art.shade(x, y, .45);
  }
  const board = { art, tiles, kind, s, id, land, W, H };
  board.corner = (t, k) => kind === 'square' ? [t.cx + (k === 1 || k === 2 ? s / 2 : -s / 2), t.cy + (k >= 2 ? s / 2 : -s / 2)] : [t.cx + s * Math.cos((60 * k - 90) * Math.PI / 180), t.cy + s * Math.sin((60 * k - 90) * Math.PI / 180)];
  board.tile = (q, r) => byKey[q + ',' + r];
  if (o.decor !== false) decorate(board);
  return board;
}

/* ---------- decorations ---------- */
const TREE = ['..o..', '.oGo.', '.oGgo', 'oGGgo', 'oGggo', 'oggdo', '.ooo.', '..t..'];
const TREE_P = { o: '#12240f', G: '#5f9a48', g: '#3a6e33', d: '#2b5728', t: '#4a2c16' };
const SHEEP = ['.ww.', 'wwwk', 'wwww', '.d.d'];
const SHEEP_P = { w: '#f2ece0', k: '#2a221a', d: '#3a3024' };
const TENT = ['....o....', '...oRo...', '..oRRro..', '.oRRrrro.', 'oRRRkrrro', 'ooooooooo'];
const TENT_P = { o: '#1e140c', R: '#8a5a36', r: '#5a3a22', k: '#140e0a' };
function peak(art, cx, by, h, snow) { for (let j = 0; j <= h; j++) { const hw = Math.round(j * .75), yy = by - h + j; for (let x = -hw; x <= hw; x++) {
  let c = x < 0 ? '#8a837b' : x === 0 ? '#6e6862' : '#57514c'; if (snow && j < h * .38) c = x <= 0 ? '#f7f9fc' : '#c9d2dc'; if (x === -hw || x === hw) c = '#2a2622'; art.set(cx + x, yy, c); } } art.set(cx, by - h - 1, '#2a2622'); }
function mound(art, cx, by, w, h) { for (let j = 0; j < h; j++) { const hw = Math.round(w * Math.sqrt(1 - Math.pow(1 - j / h, 2))), yy = by - h + j + 1;
  for (let x = -hw; x <= hw; x++) { let c = x < -hw / 3 ? '#c08058' : x < hw / 3 ? '#a66e4a' : '#7a4a30'; if (x === -hw || x === hw || j === 0) c = '#3a2216'; art.set(cx + x, yy, c); } } }
function decorate(b) {
  const { art, tiles, s } = b; const R = s * (b.kind === 'square' ? .4 : .6);
  tiles.forEach((t, ti) => {
    const pts = []; const NK = Math.min(4, Math.max(1, (s / 15) ** 2)); const N0 = t.type === 'forest' ? 14 : t.type === 'pasture' ? 4 : t.type === 'mountain' ? 3 : t.type === 'hill' ? 3 : 0; const N = Math.round(N0 * (t.type === 'forest' || t.type === 'pasture' ? NK : Math.sqrt(NK)));
    for (let k = 0; k < N * 6 && pts.length < N; k++) { const a = hash(ti, k, 41) * Math.PI * 2, rr = Math.sqrt(hash(ti, k, 43)) * R, x = Math.round(t.cx + Math.cos(a) * rr), y = Math.round(t.cy + Math.sin(a) * rr);
      if (Math.hypot(x - t.cx, y - t.cy) < s * .28 && t.num) continue; // keep the number token clear
      if (pts.every(p => Math.hypot(p[0] - x, p[1] - y) > (t.type === 'forest' ? 3.2 : 6))) pts.push([x, y]); }
    pts.sort((a, c) => a[1] - c[1]);
    pts.forEach(([x, y], k) => {
      if (t.type === 'forest') { for (let i = -2; i <= 2; i++) art.shade(x + i + 1, y + 4, .7); art.sprite(TREE, x - 2, y - 4, TREE_P); }
      if (t.type === 'pasture') art.sprite(SHEEP, x - 2, y - 2, SHEEP_P, k % 2);
      if (t.type === 'mountain') peak(art, x, y + 3, 5 + ((hash(ti, k, 3) * 4) | 0), true);
      if (t.type === 'hill') { mound(art, x, y + 2, 4, 4); }
    });
    if (t.type === 'hill') { const x = Math.round(t.cx - s * .05), y = Math.round(t.cy + s * .42); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) art.set(x + i, y + j, (i + j) % 2 ? '#b5603a' : '#c8784a'); }
    if (t.type === 'desert' && !t.noTent) { art.sprite(TENT, Math.round(t.cx - 4), Math.round(t.cy - 3), TENT_P); art.set(t.cx + 6, t.cy + 1, '#e9675a'); art.set(t.cx + 6, t.cy, '#f4d692'); }
  });
}

/* ---------- pieces ---------- */
function house(art, x, y, p) { const P = PLAYER[p]; art.sprite(['...o...', '..oPo..', '.oPPpo.', 'oPPPPpo', '.owwwo.', '.owdwo.', '.ooooo.'], x - 3, y - 5, { o: '#140e0a', P: P[0], p: P[1], w: '#e8dcc0', d: '#4a2c16' }); }
function city(art, x, y, p) { const P = PLAYER[p]; art.sprite(['.o.......', 'oPo......', 'oPpo.o...', 'owwooPo..', 'owdoPPpo.', 'owwoPPPpo', 'owwowwwwo', 'owwowdwwo', 'ooooooooo'], x - 4, y - 6, { o: '#140e0a', P: P[0], p: P[1], w: '#e8dcc0', d: '#4a2c16' }); }
function road(art, a, b, p) { const P = PLAYER[p]; const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])); for (let pass = 0; pass < 2; pass++) for (let i = 2; i <= n - 2; i++) { const x = Math.round(a[0] + (b[0] - a[0]) * i / n), y = Math.round(a[1] + (b[1] - a[1]) * i / n);
  if (!pass) { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) art.set(x + dx, y + dy, '#140e0a'); } else { art.set(x, y, P[0]); art.set(x + 1, y, P[2]); } } }
const SOLDIER = ['......w', '..ooo.t', '.ohhhot', '.osssot', '..oso.t', '.oPPPot', 'oPPpPPs', 'oPPpPo.', '.oPPPo.', '.oLLLo.', '.od.do.', '.oo.oo.'];
const ARCHER = ['..ooo..', '.ohhho.', '.osssob', '..osob.', '.oPPPb.', 'oPPpPbs', 'oPPpPb.', '.oPPPob', '.oLLLo.', '.od.do.', '.oo.oo.'];
const RIDER = ['.....ooo....', '....ohhho...', '....osssot..', '.....oPPotw.', '....oPPpPt..', '..ooooPPoooo', '.oHHHHHHHHHo', 'oHHHHHHHHhHo', '.oHo..oHhoHo', '.oo...oo..oo', '.......o..o.'].map(r => r);
function unitPal(p) { const P = PLAYER[p]; return { o: '#140e0a', h: '#8a837b', s: '#d8a878', P: P[0], p: P[1], L: '#4a2c16', d: '#2a1c14', t: '#c8b08a', w: '#e2e8ef', b: '#a87a48', H: '#7a4a2a', a: '#a86c48' }; }
function soldier(art, x, y, p, flip, kind) { const spr = kind === 'archer' ? ARCHER : kind === 'rider' ? RIDER : SOLDIER; for (let i = 0; i < spr[0].length; i++) art.shade(x + i - 1, y + spr.length, .65); art.sprite(spr, x, y, Object.assign(unitPal(p), { h: '#8a837b' }), flip); }
function die(art, x, y, v, red) { const face = red ? '#c8463a' : '#e8dcc0', pip = red ? '#f7f9fc' : '#2a2018', edge = red ? '#8a2a22' : '#b8ae9a';
  for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) { const corner = (i === 0 || i === 10) && (j === 0 || j === 10); if (corner) continue; let c = (i === 0 || j === 0 || i === 10 || j === 10) ? '#140e0a' : (j >= 9 || i >= 9) ? edge : face; art.set(x + i, y + j, c); }
  const P = { 1: [[4, 4]], 2: [[2, 2], [6, 6]], 3: [[2, 2], [4, 4], [6, 6]], 4: [[2, 2], [6, 2], [2, 6], [6, 6]], 5: [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]], 6: [[2, 2], [6, 2], [2, 4], [6, 4], [2, 6], [6, 6]] }[v];
  P.forEach(([a, b]) => { art.set(x + 1 + a, y + 1 + b, pip); }); }

/* ---------- blit + screen-space overlays ---------- */
function blit(cv, art, scale) { const W = art.w * scale, H = art.h * scale, DPR = 2; cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(art.canvas(), 0, 0, W * DPR, H * DPR); g.scale(DPR, DPR); return g; }
function tokens(art, b) { b.tiles.forEach(t => { if (!t.num) return; const cx = Math.round(t.cx), cy = Math.round(t.cy), r = b.s > 16 ? 6 : 4.6;
  for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) { const d = Math.hypot(x, y); if (d > r + .6) continue; let c = d > r - .5 ? '#2a2018' : (y > 1 && bay(x + 8, y + 8) < .5) ? '#c8b98a' : '#e8dcc0'; if (y === r - 1 + 1 && d <= r + .6) c = '#2a2018'; art.set(cx + x, cy + y, c); art.shade(cx + x + 1, cy + r + 1, 1); } }); }
function tokenTextB(g, b, scale) { g.textAlign = 'center'; g.textBaseline = 'middle'; b.tiles.forEach(t => { if (!t.num) return; g.font = `600 ${b.s > 16 ? 17 : 13}px "Pixelify Sans"`; g.fillStyle = (t.num === 6 || t.num === 8) ? '#b8322a' : '#2a2018'; g.fillText(t.num, (Math.round(t.cx) + .5) * scale, (Math.round(t.cy) + .2) * scale); }); }

function arrow(art, a, b, col) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, px = -uy, py = ux, n = Math.ceil(L), pts = [];
  for (let i = 0; i <= n - 5; i++) if (i % 5 < 3) pts.push([a[0] + ux * i, a[1] + uy * i]);
  for (let k = 0; k <= 5; k++) for (let w = -k * .7; w <= k * .7 + .01; w += .5) pts.push([b[0] - ux * k + px * w, b[1] - uy * k + py * w]);
  pts.forEach(([x, y]) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) art.set(Math.round(x) + dx, Math.round(y) + dy, '#140e0a'); });
  pts.forEach(([x, y]) => art.set(Math.round(x), Math.round(y), col)); }
function tintTiles(b, pred, col, a) { for (let y = 0; y < b.H; y++) for (let x = 0; x < b.W; x++) { const i = y * b.W + x; if (!b.land[i] || b.id[i] < 0) continue; if (pred(b.tiles[b.id[i]])) b.art.set(x, y, col, a * (bay(x, y) < .5 ? 1 : .55)); } }

const ICONS = {
  timber: [['........', '.oooooo.', 'obbbbbro', 'oBBBBBro', 'obbbbbro', '.oooooo.', '........'], { o: '#1e140c', b: '#7a4a2a', B: '#a87a48', r: '#e2c9a0' }],
  clay: [['oooooooo', 'obbobbbo', 'oooooooo', 'obbbobbo', 'oooooooo', 'obbobbbo', 'oooooooo'], { o: '#3a2216', b: '#c8784a' }],
  wool: [['..ooo...', '.owwwoo.', 'owwwwwwo', 'owWwwwwo', '.owwwwo.', '..oooo..'], { o: '#4a4540', w: '#f2ece0', W: '#ffffff' }],
  grain: [['.y.y.y..', '.yYyYy..', '..yYy...', '...g....', '..ogo...', '.og.go..', '........'], { y: '#c9b65e', Y: '#f2e27a', g: '#7f8a3c', o: '#4a3a1a' }],
  ore: [['...oo...', '..oggo..', '.ogGgbo.', 'oggggbbo', 'ogBgggbo', '.oooooo.'], { o: '#1e1a16', g: '#6e6862', G: '#a69c86', b: '#57514c', B: '#6a9ae8' }],
};
function iconURL(k, sc) { const [rows, pal] = ICONS[k]; const a = new Art(8, 8); a.sprite(rows, 0, 0, pal); const c = document.createElement('canvas'); c.width = 8 * sc; c.height = 8 * sc; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(a.canvas(), 0, 0, 8 * sc, 8 * sc); return c.toDataURL(); }
