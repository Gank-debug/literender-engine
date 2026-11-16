'use strict';
/* In-game renderer for the drafts: Civ-Sim-scale terrain (2px cells, 3-tone Bayer ramps) on a hex-logic island,
   dressed with sprites rendered by Civ Sim's own draw code (sprites.js / sprites2.js). Depends on lib.js helpers. */
const IMG = new Map();
function loadImgs() {
  const all = []; const walk = o => { if (!o || typeof o !== 'object') return; if (o.u) { all.push(o); return; } for (const k in o) walk(o[k]); };
  walk(SPRITES); walk(SPRITES2); if (typeof SPRITES3 !== 'undefined') walk(SPRITES3);
  return Promise.all(all.map(s => new Promise(res => { const i = new Image(); i.onload = () => { s.img = i; res(); }; i.src = s.u; })));
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TCOL = { red: '#d9573f', blue: '#4f8fd9', gold: '#e3c04a', violet: '#9b5fd0', green: '#5aa04a', white: '#e4e0d6', raider: '#4e4a48' };
const TIDX = { red: 0, blue: 1, gold: 2, violet: 0, green: 0, white: 0 };

function World(o) {
  const W = this.W = o.W || 1700, H = this.H = o.H || 1000, s = this.s = o.s || 96, CX = this.CX = W / 2, CY = this.CY = H / 2;
  const C = this.C = o.C || 2, cw = Math.ceil(W / C), ch = Math.ceil(H / C); this.cw = cw; this.ch = ch; this.style = o.style || 'civ';
  const tiles = this.tiles = []; const byKey = {};
  (o.map || HEXES.map(([q, r], i) => ({ q, r, type: LAYOUT[i], num: NUMS[i] }))).forEach(({ q, r, type, num }, i) => { const t = { i, q, r, type, num, cx: CX + s * S3 * (q + r / 2), cy: CY + s * 1.5 * r }; tiles.push(t); byKey[q + ',' + r] = t; });
  this.tile = (q, r) => byKey[q + ',' + r];
  const wf = o.style === 'd1' ? .021 : .006, wa = o.style === 'd1' ? .42 : .62;
  const warp = this.warp = (x, y) => [(fbm(x * wf, y * wf, 11) - .5) * s * wa * 1.6 + (fbm(x * .05, y * .05, 5) - .5) * s * .14, (fbm(x * wf, y * wf, 29) - .5) * s * wa * 1.6 + (fbm(x * .05, y * .05, 6) - .5) * s * .14];
  // a visual point for a logical hex point (inverse of the warp, a few fixed-point steps)
  this.vis = (x, y) => { let px = x, py = y; for (let k = 0; k < 6; k++) { const [a, b] = warp(px, py); px = x - a; py = y - b; } return [px, py]; };
  const id = this.id = new Int16Array(cw * ch).fill(-1), land = this.land = new Uint8Array(cw * ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const x = i * C + C / 2, y = j * C + C / 2, [a, b] = warp(x, y); const [q, r] = cubeRound((S3 / 3 * (x + a - CX) - (y + b - CY) / 3) / s, (2 / 3 * (y + b - CY)) / s); const t = byKey[q + ',' + r]; if (t) { id[j * cw + i] = t.i; land[j * cw + i] = 1; } }
  if (o.style === 'd1') { const L2 = land.slice(); for (let j = 1; j < ch - 1; j++) for (let i = 1; i < cw - 1; i++) { const k = j * cw + i; const nb = land[k - 1] + land[k + 1] + land[k - cw] + land[k + cw]; if (land[k] && nb < 4 && hash(i, j, 77) < .35) L2[k] = 0; } land.set(L2); }
  const dist = (mask, want) => { const D = new Float32Array(cw * ch).fill(1e9); for (let i = 0; i < cw * ch; i++) if (mask[i] === want) D[i] = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (x) D[i] = Math.min(D[i], D[i - 1] + 1); if (y) D[i] = Math.min(D[i], D[i - cw] + 1); if (x && y) D[i] = Math.min(D[i], D[i - cw - 1] + 1.41); if (y && x < cw - 1) D[i] = Math.min(D[i], D[i - cw + 1] + 1.41); }
    for (let y = ch - 1; y >= 0; y--) for (let x = cw - 1; x >= 0; x--) { const i = y * cw + x; if (x < cw - 1) D[i] = Math.min(D[i], D[i + 1] + 1); if (y < ch - 1) D[i] = Math.min(D[i], D[i + cw] + 1); if (x < cw - 1 && y < ch - 1) D[i] = Math.min(D[i], D[i + cw + 1] + 1.41); if (y < ch - 1 && x) D[i] = Math.min(D[i], D[i + cw - 1] + 1.41); } return D; };
  this.toLand = dist(land, 1); this.toSea = dist(land, 0);
  // mountain peaks
  const rnd = mulberry(7); tiles.forEach(t => { if (t.type === 'mountain') { t.peaks = []; for (let k = 0; k < 3; k++) { const a = rnd() * 6.28, d = k ? s * (.22 + rnd() * .12) : 0; t.peaks.push([t.cx + Math.cos(a) * d, t.cy + Math.sin(a) * d * .8 - s * .05, s * (k ? .34 : .5), k ? .72 : 1]); } } });
  this.paint();
  this.items = []; this.reserved = [];
}
World.prototype.cellTile = function (x, y) { const i = Math.max(0, Math.min(this.cw - 1, Math.floor(x / this.C))), j = Math.max(0, Math.min(this.ch - 1, Math.floor(y / this.C))); const v = this.id[j * this.cw + i]; return v < 0 ? null : this.tiles[v]; };
World.prototype.seaDist = function (x, y) { const i = Math.max(0, Math.min(this.cw - 1, Math.floor(x / this.C))), j = Math.max(0, Math.min(this.ch - 1, Math.floor(y / this.C))); return this.toSea[j * this.cw + i] * this.C; };
World.prototype.elev = function (t, x, y) { let e = 0; for (const [px, py, r, h] of t.peaks) { const d = Math.hypot(x - px, (y - py) * 1.25) / r; e = Math.max(e, h * Math.exp(-d * d * 1.6)); } return e; };
// how the grain and the sheep read from afar (drafts switch these)
const LOOK = { fieldGold: false, pastureMint: true, pens: false, plots: 5, flocks: true };
World.prototype.paint = function () { if (this.style === 'd1') return this.paintD1();
  const { cw, ch, id, land, toLand, toSea, tiles } = this; const art = new Art(cw, ch);
  const R = { forest: ['#2f5e2c', '#3a6e33', '#467a38'], pasture: LOOK.pastureMint ? ['#5f9e46', '#74b355', '#93c96c'] : ['#4f8a3a', '#5f9c43', '#79b252'], field: LOOK.fieldGold ? ['#a9852c', '#c29e3e', '#d8b856'] : ['#5a8a38', '#6c9840', '#86a84c'], hill: ['#86503a', '#9a6044', '#ae7450'], desert: ['#c4ab72', '#d6bf86', '#e6d39f'],
    rock: ['#57514c', '#6e6862', '#8a837b'], snow: ['#c9d2dc', '#e2e8ef', '#f7f9fc'], skirt: ['#5e6a48', '#6e7852', '#80885e'] };
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const k = j * cw + i, x = i * 2, y = j * 2, n = fbm(x * .018, y * .018, 3), f = hash(i, j, 17) * .12;
    if (!land[k]) { const d = toLand[k]; let c;
      if (d < 11) c = tone(SEA.shallow, (1 - d / 11) * .85 + n * .2, i, j); else c = tone(SEA.deep, n * .55 + Math.max(0, .35 - (d - 11) * .02), i, j);
      if (d < 1.6 && fbm(x * .05, y * .05, 9) > .38) c = '#a8d0d8';
      if (d > 12 && hash(i >> 1, j, 991) < .004) c = '#3e6a96';
      art.set(i, j, c); continue; }
    const t = tiles[id[k]]; let c;
    if (toSea[k] < 3.2 + fbm(x * .03, y * .03, 4) * 2.5) c = tone(SEA.sand, n * .8 + .1, i, j);
    else if (t.type === 'mountain') { const e = this.elev(t, x, y) + (fbm(x * .05, y * .05, 21) - .5) * .22, lit = (this.elev(t, x - 4, y - 4) - this.elev(t, x + 4, y + 4)) * 5;
      const M = ['#3f3a36', '#4f4944', '#625b55', '#78716a', '#928a80', '#aaa294'];
      if (e > .86 + (fbm(x * .07, y * .07, 31) - .5) * .3 + (hash(i >> 1, j >> 2, 33) - .5) * .12 - lit * .6) c = tone(lit > -.05 ? ['#d6dde6', '#e8edf3', '#f7f9fc'] : ['#a8b2c0', '#bcc6d2', '#cfd8e2'], .5 + lit * 2 + f, i, j);
      else if (e > .1) { const v = Math.max(0, Math.min(.999, .45 + lit * 1.6 + (e - .3) * .5 + n * .12)) * (M.length - 1); c = M[Math.min(M.length - 1, Math.floor(v + bay(i, j) * .9))]; }
      else c = tone(R.skirt, n * .8 + f + lit, i, j); }
    else { const r = R[t.type]; c = tone(r, n * .85 + f + (t.type === 'desert' ? Math.sin(x * .09 + n * 6) * .12 : 0) + (t.type === 'field' && LOOK.fieldGold ? ((((i + (j >> 1)) % 5) < 2) ? .22 : -.12) : 0), i, j);
      if (t.type === 'pasture' && hash(i, j, 5) < .012) c = ['#f2e27a', '#f4f2ee', '#e978a8', '#9b8cf0'][(hash(i, j, 6) * 4) | 0]; }
    art.set(i, j, c);
  }
  // soft tile borders: a broken darker seam where two tiles meet
  for (let j = 0; j < ch - 1; j++) for (let i = 0; i < cw - 1; i++) { const k = j * cw + i; if (!land[k]) continue; const a = id[k], b = id[k + 1], c = id[k + cw];
    if ((b >= 0 && b !== a) || (c >= 0 && c !== a)) { if (((i + j) & 1) === 0) art.shade(i, j, .8); } }
  this.ground = art.canvas();
};
// sprite helpers ----------------------------------------------------------
World.prototype.add = function (spr, x, y, flip, extra) { if (!spr) return; this.items.push(Object.assign({ spr, x: Math.round(x), y: Math.round(y), flip: !!flip }, extra || {})); };
World.prototype.free = function (x, y, r) { return this.reserved.every(([a, b, rr]) => Math.hypot(a - x, b - y) > rr + r); };
World.prototype.reserve = function (x, y, r) { this.reserved.push([x, y, r]); };
World.prototype.scatter = function (t, n, minD, fn, seed, opt) {
  opt = opt || {}; const rnd = mulberry(seed + t.i * 101), pts = []; const s = this.s;
  for (let k = 0; k < n * 40 && pts.length < n; k++) { const x = t.cx + (rnd() * 2 - 1) * s * 1.05, y = t.cy + (rnd() * 2 - 1) * s * 1.05;
    if (this.cellTile(x, y) !== t || this.seaDist(x, y) < (opt.coast || 14)) continue;
    if (Math.hypot(x - t.cx, y - t.cy) < (opt.clear || 30)) continue; if (!this.free(x, y, opt.r || 8)) continue;
    if (pts.some(p => Math.hypot(p[0] - x, (p[1] - y) * 1.4) < minD)) continue;
    if (opt.box) { const [bw, bh] = opt.box; const pts4 = [[x - bw / 2, y], [x + bw / 2, y], [x - bw / 2, y - bh], [x + bw / 2, y - bh], [x, y - bh / 2]]; if (pts4.some(([a, b]) => this.cellTile(a, b) !== t || this.seaDist(a, b) < 10 || Math.hypot(a - t.cx, b - t.cy) < 24)) continue; }
    pts.push([x, y]); }
  pts.forEach((p, k) => fn(p[0], p[1], k, rnd)); return pts;
};
const SP = () => SPRITES, SP2 = () => SPRITES2;
const bldP = (k, p) => (typeof SPRITES3 !== 'undefined' && SPRITES3.bld.find(b => b.k === k && b.p === p)) || bld(k, TIDX[p]);
const bld = (k, tribe) => SPRITES.bld.find(b => b.k === k && b.t === (tribe == null ? 0 : tribe)) || SPRITES.bld.find(b => b.k === k);
World.prototype.dress = function () {
  const P = SPRITES, Q = SPRITES2;
  this.tiles.forEach(t => {
    if (t.type === 'forest') this.scatter(t, 46, 13, (x, y, k, r) => this.add(P.tree[r() < .45 ? 5 + ((r() * 5) | 0) : (r() * 5) | 0], x, y, r() < .5, { shadow: 9 }), 1, { r: 6 });
    if (t.type === 'pasture') { const pens = this.scatter(t, LOOK.pens ? 3 : 0, 70, (x, y, k) => { const pn = Q.pen[k ? 0 : 1], fl = k % 2, x0 = fl ? x - pn.ox - pn.w : x + pn.ox, y0 = y + pn.oy; if (t.cx > x0 - 18 && t.cx < x0 + pn.w + 18 && t.cy > y0 - 18 && t.cy < y0 + pn.h + 18) return; if (this._pens === t) return; this._pens = t; this.add(pn, x, y, fl); }, 2, { r: 30, coast: 24, box: [70, 30], clear: 50 }); pens.forEach(p => this.reserve(p[0], p[1], 34));
      this.scatter(t, 8, 22, (x, y, k, r) => this.add(P.bush[(r() * 8) | 0], x, y), 3, { r: 6 }); this.scatter(t, 4, 30, (x, y, k, r) => this.add(P.tree[(r() * 5) | 0], x, y, r() < .5, { shadow: 9 }), 4, { r: 8 }); }
    if (t.type === 'field') { const fs = this.scatter(t, this.style === 'd1' ? 2 : LOOK.plots, 34, (x, y, k) => this.add(Q.fieldS[[0, 1, 3, 2, 5, 4][k]], x, y), 5, { r: 22, clear: 34, coast: 26, box: [Math.max(...Q.fieldS.map(f => f.w)) * .8, 30] }); fs.forEach(p => this.reserve(p[0], p[1], 30));
      this.scatter(t, 1, 0, (x, y) => this.add(bld('silo', 2), x, y), 6, { r: 20, clear: 34 }); this.scatter(t, 3, 30, (x, y, k, r) => this.add(P.tree[(r() * 5) | 0], x, y, 0, { shadow: 9 }), 7, { r: 8 }); }
    if (t.type === 'hill') { this.scatter(t, 7, 22, (x, y, k) => this.add(Q.mud[k % 4], x, y), 8, { r: 10 }); this.scatter(t, 6, 18, (x, y, k) => this.add(P.rock[k % 2], x, y), 9, { r: 6 }); this.scatter(t, 5, 20, (x, y, k, r) => this.add(P.bush[(r() * 8) | 0], x, y), 10, { r: 6 }); }
    if (t.type === 'mountain') { this.scatter(t, 16, 14, (x, y, k) => { if (this.elev(t, x, y) < .55) this.add(P.rock[k % 2], x, y); }, 11, { r: 6, clear: 26 }); this.scatter(t, 7, 16, (x, y, k, r) => { if (this.elev(t, x, y) < .2) this.add(P.tree[5 + ((r() * 5) | 0)], x, y, r() < .5, { shadow: 9 }); }, 12, { r: 6 }); }
  });
};
World.prototype.town = function (x, y, tribe, big) {
  if (big) { this.add(bldP('cottage', tribe), x - 8, y + 6); this.add(bldP('tower', tribe), x + 36, y - 4); this.add(bldP('trullo', tribe), x - 46, y - 6); this.items.push({ banner: tribe, x: x + 58, y: y + 10 }); }
  else { this.add(bldP('hut', tribe), x - 6, y + 4); this.add(bldP('trullo', tribe), x + 20, y - 4); this.add(bldP('fire', tribe), x + 8, y + 14); this.items.push({ banner: tribe, x: x - 30, y: y + 10 }); }
  this.reserve(x, y, big ? 56 : 36); };
World.prototype.road = function (a, b, tribe) { this.roads = this.roads || []; this.roads.push([a, b, tribe]); };
World.prototype.figure = function (tribe, unit, pose, who, x, y, flip) { const FS = (typeof SPRITES3 !== 'undefined' ? SPRITES3 : SPRITES).fig; const L = FS[tribe][unit].filter(f => f.pose === pose && (who == null || f.who === who)); const f = L.length ? L[(who || 0) % L.length] : FS[tribe][unit][0]; this.add(f, x, y, flip, { shadow: 4 }); };
World.prototype.army = function (tribe, x, y, comp, flip, opt) { opt = opt || {}; const rnd = mulberry(opt.seed || 3); const list = []; for (const [u, n] of comp) for (let k = 0; k < n; k++) list.push(u);
  const cols = opt.cols || Math.ceil(Math.sqrt(list.length * 1.6)), dx = opt.dx || 9, dy = opt.dy || 7;
  list.forEach((u, k) => { const c = k % cols, r = Math.floor(k / cols); const px = x + (c - (cols - 1) / 2) * dx + (r % 2 ? dx / 2 : 0) + (rnd() - .5) * 2, py = y + r * dy + (rnd() - .5) * 2;
    const pose = opt.pose ? opt.pose(u, k, rnd) : (rnd() < .4 ? 'walk' + ((rnd() * 4) | 0) : 'stand'); this.figure(tribe, u, pose, (rnd() * 8) | 0, px, py, flip); });
  if (opt.banner !== false) this.items.push({ banner: tribe, x: Math.round(x + (flip ? 1 : -1) * (cols / 2 + .7) * dx), y: Math.round(y - 2) });
  this.reserve(x, y + 10, 30); };
World.prototype.draw = function (ctx) {
  ctx.imageSmoothingEnabled = false; ctx.drawImage(this.ground, 0, 0, this.cw * this.C, this.ch * this.C);
  (this.under || []).forEach(fn => fn(ctx));
  // roads: packed earth with the owner's stakes
  (this.roads || []).forEach(([a, b, tribe]) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])); for (let i = 6; i <= n - 6; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n, w = 2.5 + fbm(x * .1, y * .1, 3);
      for (let dx = -w; dx <= w; dx++) for (let dy = -w * .7; dy <= w * .7; dy++) { const xx = Math.round(x + dx), yy = Math.round(y + dy); ctx.fillStyle = tone(['#6c543a', '#7d6345', '#8f7350'], fbm(xx * .2, yy * .2, 9) + (dy < 0 ? .15 : -.1), xx, yy); ctx.fillRect(xx, yy, 1, 1); } }
    for (let i = 14; i < n - 10; i += 22) { const x = Math.round(a[0] + (b[0] - a[0]) * i / n + 5), y = Math.round(a[1] + (b[1] - a[1]) * i / n - 3); ctx.fillStyle = '#4a3220'; ctx.fillRect(x, y - 8, 1, 9); ctx.fillStyle = TCOL[tribe]; ctx.fillRect(x + 1, y - 8, 4, 3); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 1, y - 6, 4, 1); } });
  this.items.sort((a, b) => (a.z ?? a.y) - (b.z ?? b.y));
  for (const it of this.items) {
    if (it.banner) { const c = TCOL[it.banner], X = it.x, Y = it.y; ctx.fillStyle = 'rgba(15,10,5,.3)'; ctx.fillRect(X - 2, Y, 6, 2); ctx.fillStyle = '#3a2616'; ctx.fillRect(X, Y - 30, 1, 31); ctx.fillStyle = '#5a3e26'; ctx.fillRect(X + 1, Y - 30, 1, 31);
      for (let j = 0; j < 9; j++) for (let i = 0; i < 11 - (j > 6 ? (j - 6) * 3 : 0); i++) { ctx.fillStyle = j === 0 || i === 0 ? '#1e140c' : (bay(i, j) < .3 && j > 4) ? '#00000033' : c; ctx.fillRect(X + 2 + i, Y - 30 + j + Math.round(Math.sin(i * .6) * .8), 1, 1); } continue; }
    if (it.fn) { it.fn(ctx); continue; }
    const s = it.spr; if (!s.img) continue;
    if (it.shadow) { ctx.fillStyle = 'rgba(10,20,8,.28)'; const r = it.shadow; for (let k = -r; k <= r; k++) { const hh = Math.round(Math.sqrt(1 - (k / (r + .5)) ** 2) * r * .3); ctx.fillRect(it.x + k, it.y - hh + 1, 1, hh * 2 + 1); } }
    if (it.flip) { ctx.save(); ctx.translate(it.x * 2 + 1, 0); ctx.scale(-1, 1); ctx.drawImage(s.img, it.x + s.ox, it.y + s.oy); ctx.restore(); }
    else ctx.drawImage(s.img, it.x + s.ox, it.y + s.oy);
  }
};
World.prototype.render = function () { const c = document.createElement('canvas'); c.width = this.W; c.height = this.H; this.draw(c.getContext('2d')); return c; };
/* show part of the world in a display canvas: (sx,sy) world top-left, zoom integer, DPR 2 */
function view(cv, world, sx, sy, zoom, Wd, Hd) { const DPR = 2; cv.width = Wd * DPR; cv.height = Hd * DPR; cv.style.width = Wd + 'px'; cv.style.height = Hd + 'px';
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#16304f'; g.fillRect(0, 0, cv.width, cv.height);
  g.drawImage(world, sx, sy, Wd / zoom, Hd / zoom, 0, 0, Wd * DPR, Hd * DPR); g.scale(DPR, DPR); const toS = (x, y) => [(x - sx) * zoom, (y - sy) * zoom]; return { g, toS }; }
function tokenDiscs(world) { world.under = world.under || []; world.under.push(ctx => world.tiles.forEach(t => { if (!t.num) return; const cx = Math.round(t.cx), cy = Math.round(t.cy), r = 13;
  for (let y = -r - 1; y <= r + 3; y++) for (let x = -r - 1; x <= r + 1; x++) { const d = Math.hypot(x, y), d2 = Math.hypot(x - 1, y - 3); let c = null;
    if (d <= r) c = d > r - 1.2 ? '#2a2018' : (y > 3 && bay(x + 16, y + 16) < .5) ? '#c8b98a' : (y < -6 && bay(x + 16, y + 16) < .3) ? '#f6eedc' : '#e8dcc0'; else if (d2 <= r) c = 'rgba(10,8,5,.35)';
    if (c) { ctx.fillStyle = c; ctx.fillRect(cx + x, cy + y, 1, 1); } } })); }
function tokenText(g, world, toS, zoom) { g.textAlign = 'center'; g.textBaseline = 'middle'; world.tiles.forEach(t => { if (!t.num) return; const [x, y] = toS(Math.round(t.cx) + .5, Math.round(t.cy) - .5); g.font = `600 ${15 * zoom}px "Pixelify Sans"`; g.fillStyle = (t.num === 6 || t.num === 8) ? '#b8322a' : '#2a2018'; g.fillText(t.num, x, y);
  const pips = 6 - Math.abs(7 - t.num); g.fillStyle = g.fillStyle; for (let k = 0; k < pips; k++) g.fillRect(x + (k - (pips - 1) / 2) * 3 * zoom - zoom * .5, y + 7 * zoom, zoom * 1.5, zoom * 1.5); }); }
/* the catapult: Civ Sim's wood ramp, drawn by hand in its manner */
const CATA = ['...................ooo..', '..................oBbBo.', '..................oBBo..', '.................oLo....', '................oLo.....', '...............oLo......', '..............oLo.......', '.............oLo........', '......o.....oLo.........', '.....oLo...oLo..........', '.....oLo..oLo...........', '.....oLooLLo............', '.....oLLLLLo.....o......', '..ooooooooooooooooo.....', '.oDDDDDDDDDDDDDDDDDo....', '.oddddddddddddddddddo...', '..oWWo.........oWWo.....', '.oWwWWo.......oWwWWo....', '.oWWWWo.......oWWWWo....', '..oWWo.........oWWo.....'];
function cataSprite() { const a = new Art(24, 20); a.sprite(CATA, 0, 0, { L: '#a87a48', D: '#8a6a3c', d: '#6e5034', W: '#5a3a24', w: '#8a6a3c', B: '#8a837b', b: '#c8c0b2' }); return { img: a.canvas(), w: 24, h: 20, ox: -12, oy: -19 }; }
function cropSpr(s) { const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; const x = c.getContext('2d'); x.drawImage(s.img, 0, 0); const d = x.getImageData(0, 0, s.w, s.h).data; let x0 = s.w, y0 = s.h, x1 = -1, y1 = -1;
  for (let y = 0; y < s.h; y++) for (let xx = 0; xx < s.w; xx++) if (d[(y * s.w + xx) * 4 + 3] > 0) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, -x0, -y0); s.img = o; s.ox += x0; s.oy += y0; s.w = o.width; s.h = o.height; }
function fixAnchors() { (SPRITES2.fieldS || []).forEach(cropSpr); SPRITES.tree.forEach(t => { t.ox = -Math.floor(t.w / 2); t.oy = -t.h + 2; }); SPRITES.rock.forEach(t => { t.ox = -7; t.oy = -t.h + 2; }); SPRITES.bush.forEach(t => { t.ox = -Math.floor(t.w / 2); t.oy = -(t.h - 3); }); }
function ctxArrow(ctx, a, b, col) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, px = -uy, py = ux, pts = [];
  for (let i = 0; i <= L - 9; i += .5) if ((i % 10) < 6) pts.push([a[0] + ux * i + px * 0, a[1] + uy * i], [a[0] + ux * i + px, a[1] + uy * i + py]);
  for (let k = 0; k <= 9; k += .5) for (let w = -k * .65; w <= k * .65; w += .5) pts.push([b[0] - ux * k + px * w, b[1] - uy * k + py * w]);
  ctx.fillStyle = col; pts.forEach(([x, y]) => ctx.fillRect(Math.round(x), Math.round(y), 1, 1)); }
function tintTilesW(world, pred, col, a) { world.under = world.under || []; world.under.push(ctx => { const { cw, ch, id, tiles } = world; ctx.fillStyle = col;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const v = id[j * cw + i]; if (v < 0 || !pred(tiles[v])) continue; ctx.globalAlpha = ((i + j) & 1) ? a : a * .5; ctx.fillRect(i * world.C, j * world.C, world.C, world.C); }
  ctx.globalAlpha = 1; }); }
function corner(world, t, k) { return world.vis(t.cx + world.s * Math.cos((60 * k - 90) * Math.PI / 180), t.cy + world.s * Math.sin((60 * k - 90) * Math.PI / 180)); }
function figURL(tribe, unit, who, sc) { const FS = (typeof SPRITES3 !== 'undefined' ? SPRITES3 : SPRITES).fig; const f = FS[tribe][unit].find(x => x.pose === 'stand' && x.who === who) || FS[tribe][unit][0]; const c = document.createElement('canvas'); c.width = f.w * sc; c.height = f.h * sc; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(f.img, 0, 0, f.w * sc, f.h * sc); return c.toDataURL(); }

/* ---- draft-1 ground: chunkier cells, saturated tile colours, wheat furrows, painted peaks, mounds and sheep ---- */
World.prototype.paintD1 = function () {
  const { cw, ch, id, land, toLand, toSea, tiles, C } = this; const art = new Art(cw, ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const k = j * cw + i, n = fbm(i * .11, j * .11, 3), sh = (fbm((i - 1) * .11, (j - 1) * .11, 3) - fbm((i + 1) * .11, (j + 1) * .11, 3)) * 6;
    if (!land[k]) { const d = toLand[k]; let c = d < 6.5 ? tone(SEA.shallow, (1 - d / 6.5) * .8 + n * .25, i, j) : tone(SEA.deep, n * .7 + Math.max(0, .3 - (d - 6) * .03), i, j);
      if (d < 1.6 && fbm(i * .3, j * .3, 9) > .42) c = SEA.surf; if (hash(i, j, 991) < .006) c = '#3e6a96'; art.set(i, j, c); continue; }
    const t = tiles[id[k]], Rm = TER[t.type].ramp; let v = n * .85 + sh * .8;
    if (t.type === 'field') v = .35 + sh * .5 + (((i + (j >> 1)) % 4) < 2 ? .28 : -.1);
    if (t.type === 'mountain') v = n * .6 + sh * 1.4;
    let c = tone(Rm, v, i, j);
    if (t.type === 'pasture' && hash(i, j, 5) < .025) c = ['#f2e27a', '#f4f2ee', '#e978a8'][(hash(i, j, 6) * 3) | 0];
    if (toSea[k] < 2.2) c = tone(SEA.sand, n + .2, i, j);
    art.set(i, j, c);
  }
  for (let j = 0; j < ch - 1; j++) for (let i = 0; i < cw - 1; i++) { const k = j * cw + i; if (!land[k]) continue; const a = id[k], r = id[k + 1], b = id[k + cw];
    if (((r !== a && r >= 0) || (b !== a && b >= 0)) && (i + j) % 2 === 0) art.shade(i, j, .72); }
  // painted relief, at cell scale, the way draft 1 drew it
  const cx = t => Math.round(t.cx / C), cy = t => Math.round(t.cy / C), S = this.s / C;
  tiles.forEach((t, ti) => { const pts = [], N = t.type === 'pasture' ? 6 : t.type === 'mountain' ? 4 : t.type === 'hill' ? 4 : 0, Rr = S * .62;
    for (let k = 0; k < N * 8 && pts.length < N; k++) { const a = hash(ti, k, 41) * 6.283, rr = Math.sqrt(hash(ti, k, 43)) * Rr, x = Math.round(cx(t) + Math.cos(a) * rr), y = Math.round(cy(t) + Math.sin(a) * rr);
      if (Math.hypot(x - cx(t), y - cy(t)) < S * .3) continue; if (id[y * cw + x] !== ti || toSea[y * cw + x] < 3) continue; if (pts.every(p => Math.hypot(p[0] - x, p[1] - y) > 8)) pts.push([x, y]); }
    pts.sort((a, b) => a[1] - b[1]);
    pts.forEach(([x, y], k) => { if (t.type === 'mountain') peak(art, x, y + 4, 6 + ((hash(ti, k, 3) * 5) | 0), true); if (t.type === 'hill') mound(art, x, y + 2, 5, 5); if (t.type === 'pasture') art.sprite(SHEEP, x - 2, y - 2, SHEEP_P, k % 2); });
    if (t.type === 'hill') { const x = cx(t) - 2, y = cy(t) + Math.round(S * .42); for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) art.set(x + i, y + j, (i + j) % 2 ? '#b5603a' : '#c8784a'); }
  });
  this.ground = art.canvas();
};
