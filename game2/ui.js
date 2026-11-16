'use strict';
/* ==========================================================================
   HEARTHLAND — the screen: camera, living villages, panels, the clash.
   ========================================================================== */
const UI = { cam: { x: 0, y: 0, z: 1 }, mode: 'idle', sel: null, hover: null, busy: false, masks: {}, power: null, raiseType: 'pasture' };
const $ = id => document.getElementById(id);
const DPR = () => Math.max(1, Math.round(window.devicePixelRatio || 1));
const COLS = { red: '#d9573f', blue: '#4f8fd9', gold: '#e3c04a', violet: '#9b5fd0', raider: '#4e4a48' };
const LIGHT = { red: '#e8786a', blue: '#6a9ae8', gold: '#f2cf6a', violet: '#b48cff', raider: '#e9675a' };
const pn = id => `<b style="color:${LIGHT[id]}">${id === 'red' ? 'You' : PNAME[id]}</b>`;
const ICON_URL = {};
const icon = (k, sc) => `<img class="ri" src="${ICON_URL[k + (sc || 3)]}">`;
const costHTML = c => Object.entries(c).map(([k, v]) => Array.from({ length: v }, () => icon(k, 3)).join('')).join('');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => (window.__T != null ? window.__T : performance.now() / 1000);
const TNAME = { forest: 'Forest', hill: 'Clay pits', pasture: 'Pasture', field: 'Wheat', mountain: 'Mountain', desert: 'Waste' };

/* ---------- boot ---------- */
async function boot() {
  await document.fonts.ready; const all = []; const walk = o => { if (!o || typeof o !== 'object') return; if (o.u) { all.push(o); return; } for (const k in o) walk(o[k]); }; walk(SPRITES); walk(SPRITES2); walk(SPRITES3); walk(FOLK); walk(CFX);
  await Promise.all(all.map(s => new Promise(res => { const i = new Image(); i.onload = () => { s.img = i; res(); }; i.onerror = res; i.src = s.u; }))); fixAnchors();
  RES.forEach(k => { ICON_URL[k + 3] = iconURL(k, 3); ICON_URL[k + 4] = iconURL(k, 4); }); UI.cata = cataSprite();
  bindInput(); addEventListener('resize', () => fit());
  newGame(+(location.hash.slice(1)) || ((Math.random() * 1e6) | 0));
  requestAnimationFrame(loop);
}
function newGame(seed) {
  document.body.classList.add('booting');
  setTimeout(() => {
    setupGame(seed); try { history.replaceState(null, '', '#' + seed); } catch (e) {}
    worldLayers(); fit(); UI.cam.z = 1; centerOn(G.world.CX, G.world.CY);
    document.body.classList.remove('booting'); $('toasts').innerHTML = ''; UI.mode = 'idle'; UI.sel = null; UI.busy = false;
    $('win').style.display = 'none'; ['siege', 'trade', 'powers'].forEach(id => $(id).style.display = 'none');
    showLandfall(); hud();
  }, 30);
}
function worldLayers() { UI.static = G.world.render(); UI.masks = {}; buildFog(); buildMini(); }
function fit() { const cv = $('cv'), d = DPR(); cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; if (G.world) clampCam(); }
function clampCam() { const c = UI.cam, vw = innerWidth / c.z, vh = innerHeight / c.z; c.x = Math.max(-260, Math.min(G.world.W - vw + 260, c.x)); c.y = Math.max(-260, Math.min(G.world.H - vh + 260, c.y)); c.x = Math.round(c.x); c.y = Math.round(c.y); }
function centerOn(x, y) { UI.cam.x = x - innerWidth / UI.cam.z / 2; UI.cam.y = y - innerHeight / UI.cam.z / 2; clampCam(); }
const toWorld = (sx, sy) => [sx / UI.cam.z + UI.cam.x, sy / UI.cam.z + UI.cam.y];
const toScreen = (x, y) => [(x - UI.cam.x) * UI.cam.z, (y - UI.cam.y) * UI.cam.z];

/* ---------- fog, masks, minimap ---------- */
function buildFog() {
  const w = G.world, c = UI.fog || (UI.fog = document.createElement('canvas')); c.width = w.W; c.height = w.H; const g = c.getContext('2d'), C = w.C, ex = player('red').explored;
  UI.fogKey = [...ex].sort().join();
  for (let j = 0; j < w.ch; j++) for (let i = 0; i < w.cw; i++) { const k = j * w.cw + i, v = w.id[k];
    if (v >= 0) { if (ex.has(v)) continue; const n = fbm(i * .03, j * .03, 41); g.fillStyle = n > .55 ? '#3a4656' : n > .42 ? '#2e3a4a' : '#26303e'; g.globalAlpha = .92; g.fillRect(i * C, j * C, C, C); }
    else { const d = w.toLand[k]; if (d > 18) continue; const near = nearestLandTile(i, j); if (near == null || ex.has(near)) continue; const a = (1 - d / 18) * .55 - bay(i, j) * .12; if (a <= 0) continue; g.globalAlpha = a; g.fillStyle = '#26303e'; g.fillRect(i * C, j * C, C, C); } }
  g.globalAlpha = 1;
}
function nearestLandTile(i, j) { const w = G.world; for (let r = 1; r < 20; r += 3) for (const [a, b] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= w.cw || jj >= w.ch) continue; const v = w.id[jj * w.cw + ii]; if (v >= 0) return v; } return null; }
function refreshFog() { const k = [...player('red').explored].sort().join(); if (k !== UI.fogKey) { buildFog(); buildMini(); } }
function tileMask(ti, col) {
  const k = ti + col; if (UI.masks[k]) return UI.masks[k];
  const w = G.world, C = w.C, t = G.tiles[ti]; const x0 = Math.floor((t.cx - w.s * 1.5) / C), y0 = Math.floor((t.cy - w.s * 1.5) / C), x1 = Math.ceil((t.cx + w.s * 1.5) / C), y1 = Math.ceil((t.cy + w.s * 1.5) / C);
  const c = document.createElement('canvas'); c.width = (x1 - x0) * C; c.height = (y1 - y0) * C; const g = c.getContext('2d'); g.fillStyle = col;
  for (let j = Math.max(0, y0); j < Math.min(w.ch, y1); j++) for (let i = Math.max(0, x0); i < Math.min(w.cw, x1); i++) { const k2 = j * w.cw + i; if (w.id[k2] !== ti) continue; const edge = w.id[k2 + 1] !== ti || w.id[k2 - 1] !== ti || w.id[k2 + w.cw] !== ti || w.id[k2 - w.cw] !== ti; g.globalAlpha = edge ? (((i * 3 + j * 5) % 7) < 5 ? 1 : 0) : (((i + j) & 1) ? .35 : .18); g.fillRect((i - x0) * C, (j - y0) * C, C, C); }
  return (UI.masks[k] = { c, x: x0 * C, y: y0 * C });
}
function borderOf(pid) { const terr = territory(pid); return terr; }
function buildMini() { const m = $('mini'), w = G.world; m.width = 440; m.height = Math.round(440 * w.H / w.W); const b = UI.miniBase || (UI.miniBase = document.createElement('canvas')); b.width = m.width; b.height = m.height; const g = b.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(w.ground, 0, 0, w.cw, w.ch, 0, 0, m.width, m.height); g.drawImage(UI.fog, 0, 0, w.W, w.H, 0, 0, m.width, m.height); }
function drawMini() {
  const m = $('mini'), g = m.getContext('2d'), w = G.world, k = m.width / w.W, ex = player('red').explored; g.drawImage(UI.miniBase, 0, 0);
  for (const v of G.verts) if (v.owner && v.tiles.some(t => ex.has(t))) { g.fillStyle = '#140e0a'; g.fillRect(v.vx * k - 4, v.vy * k - 4, 8, 8); g.fillStyle = COLS[v.owner]; g.fillRect(v.vx * k - 3, v.vy * k - 3, 6, 6); }
  for (const a of G.armies) { if (!ex.has(a.tile)) continue; const t = G.tiles[a.tile]; g.fillStyle = a.owner === 'raider' ? '#e9675a' : COLS[a.owner]; g.beginPath(); g.arc(t.cx * k, t.cy * k, 5, 0, 7); g.fill(); g.strokeStyle = '#140e0a'; g.lineWidth = 1.5; g.stroke(); }
  g.strokeStyle = '#f4d692'; g.lineWidth = 2; g.strokeRect(UI.cam.x * k, UI.cam.y * k, innerWidth / UI.cam.z * k, innerHeight / UI.cam.z * k);
}

/* ---------- sprites ---------- */
function spr(ctx, s, x, y, flip) { if (!s || !s.img) return; x = Math.round(x); y = Math.round(y); if (flip) { ctx.save(); ctx.translate(x * 2 + 1, 0); ctx.scale(-1, 1); ctx.drawImage(s.img, x + s.ox, y + s.oy); ctx.restore(); } else ctx.drawImage(s.img, x + s.ox, y + s.oy); }
function shadow(ctx, x, y, r) { ctx.fillStyle = 'rgba(10,20,8,.28)'; for (let k = -r; k <= r; k++) { const hh = Math.round(Math.sqrt(1 - (k / (r + .5)) ** 2) * r * .3); ctx.fillRect(Math.round(x) + k, Math.round(y) - hh + 1, 1, hh * 2 + 1); } }
function banner(ctx, X, Y, c) { X = Math.round(X); Y = Math.round(Y); const t = now(); ctx.fillStyle = 'rgba(15,10,5,.3)'; ctx.fillRect(X - 2, Y, 6, 2); ctx.fillStyle = '#3a2616'; ctx.fillRect(X, Y - 30, 1, 31); ctx.fillStyle = '#5a3e26'; ctx.fillRect(X + 1, Y - 30, 1, 31);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 11 - (j > 6 ? (j - 6) * 3 : 0); i++) { ctx.fillStyle = (bay(i, j) < .3 && j > 4) ? 'rgba(0,0,0,.2)' : c; ctx.fillRect(X + 2 + i, Y - 30 + j + Math.round(Math.sin(i * .6 + t * 4) * .8), 1, 1); } }
const folkF = (o, who, act, f) => { const L = FOLK[o][who % FOLK[o].length][act]; return L[((f % L.length) + L.length) % L.length]; };
const figSpr = (o, u, pose, who) => { const L = SPRITES3.fig[o][u]; const m = L.filter(f => f.pose === pose); return (m.length ? m : L)[who % (m.length || L.length)]; };
const cfx = (o, u, who, key) => { const L = CFX[o][u === 'cata' ? 'spear' : u]; return L[who % L.length][key] || L[0].guard; };
function palisade(ctx, x, y, rx, ry, half, wall) { for (let a = 0; a < 72; a++) { const an = a / 72 * Math.PI * 2, sy = Math.sin(an); if ((half === 'back') !== (sy < 0)) continue; if (wall < 50 && (a === 60 || a === 61 || (wall < 25 && (a === 62 || a === 59)))) continue;
  const px = Math.round(x + Math.cos(an) * rx), py = Math.round(y + sy * ry), h = 7 + (a % 3 === 0 ? 1 : 0); ctx.fillStyle = a % 2 ? '#6e5034' : '#8a6a3c'; ctx.fillRect(px, py - h, 2, h); ctx.fillStyle = '#c8a878'; ctx.fillRect(px, py - h, 1, 1); ctx.fillStyle = 'rgba(15,10,5,.25)'; ctx.fillRect(px, py, 3, 1); } }
function stones(ctx, x, y) { for (let k = 0; k < 7; k++) { const an = k / 7 * Math.PI * 2, px = Math.round(x + Math.cos(an) * 14), py = Math.round(y + Math.sin(an) * 6), h = 8 + (k % 3); for (let j = 0; j < h; j++) { ctx.fillStyle = j < 2 ? '#c8c0b2' : k % 2 ? '#8a837b' : '#a69c86'; ctx.fillRect(px, py - j, 3, 1); ctx.fillStyle = '#57514c'; ctx.fillRect(px + 2, py - j, 1, 1); } } }
function drawHearth(ctx, v) {
  const x = v.vx, y = v.vy, o = v.owner, B = k => bldP(k, o);
  if (v.wall > 0) palisade(ctx, x + 4, y + 6, v.level === 2 ? 62 : 46, v.level === 2 ? 26 : 20, 'back', v.wall);
  if (v.level === 2) { spr(ctx, B('trullo'), x - 46, y - 4); spr(ctx, B('tower'), x + 36, y - 6); spr(ctx, B('cottage'), x - 6, y + 8); banner(ctx, x + 58, y + 10, COLS[o]); }
  else { spr(ctx, B('hut'), x - 8, y + 2); spr(ctx, B('trullo'), x + 18, y - 4); banner(ctx, x - 30, y + 12, COLS[o]); }
  spr(ctx, B('fire'), x + 8, y + 18);
  if (v.monument) stones(ctx, x - 50, y + 24);
  if (v.wall > 0) palisade(ctx, x + 4, y + 6, v.level === 2 ? 62 : 46, v.level === 2 ? 26 : 20, 'front', v.wall);
  const t = now(); for (let k = 0; k < 5; k++) { const fl = hash(k, Math.floor(t * 10), v.id); ctx.fillStyle = fl > .5 ? '#f4d692' : '#e9675a'; ctx.fillRect(Math.round(x + 6 + k % 3), Math.round(y + 12 - fl * 3), 1, 2); }
  for (let k = 0; k < 6; k++) { const u = ((t * .3 + k / 6 + v.id * .17) % 1); ctx.fillStyle = `rgba(${v.burned ? '60,55,50' : '210,205,195'},${(v.burned ? .6 : .38) * (1 - u)})`; ctx.fillRect(Math.round(x + 8 + Math.sin(u * 6 + v.id) * 3 + u * 9), Math.round(y + 8 - u * 32), 2 + Math.round(u * 2), 2 + Math.round(u * 2)); }
}

/* ---------- the living land: people walking to work ---------- */
const WORK = { forest: ['chop', 'carry_wood'], mountain: ['gather', 'carry_stone'], hill: ['gather', 'carry_stone'], field: ['gather', 'carry_fibre'], pasture: ['kneel_tend', 'carry_fibre'] };
function folkAgents() {
  const out = [], ex = player('red').explored;
  for (const P of G.players) {
    const hs = hearths(P.id); if (!hs.length) continue;
    for (const [tis, n] of Object.entries(P.workers)) { const ti = +tis, t = G.tiles[ti]; if (!ex.has(ti)) continue; const home = hs.find(v => v.tiles.includes(ti)) || hs[0]; const [act, carry] = WORK[t.type] || ['gather', 'carry_fibre']; const blocked = G.armies.some(a => a.tile === ti && a.owner !== P.id); const idleW = G.season === 3 && t.type === 'field';
      for (let k = 0; k < n; k++) { const h1 = hash(ti, k, home.id), h2 = hash(k, ti, 7); const an = h1 * Math.PI * 2, r = 30 + h2 * 34; out.push({ o: P.id, who: (k + ti) % 6 === 5 ? 4 : (k + ti) % 5, home: [home.vx - 6 + k * 5, home.vy + 22], spot: [t.cx + Math.cos(an) * r, t.cy + Math.sin(an) * r * .8 + 6], act, carry, off: h1 * 8, stay: blocked || idleW }); } }
    const h0 = hs[0]; if (ex.has(h0.tiles[0]) || h0.tiles.some(t => ex.has(t))) { for (let k = 0; k < P.prayer; k++) out.push({ o: P.id, who: 2 + k, still: 'pray', at: [h0.vx + 20 + k * 12, h0.vy + 30], rate: 3 });
      const idle = civilians(P.id) - placed(P); for (let k = 0; k < Math.min(3, idle); k++) out.push({ o: P.id, who: 5, still: 'joy', at: [h0.vx - 40 + k * 13, h0.vy + 34 + (k % 2) * 5], rate: 5, ph: k * 2 }); }
  }
  return out;
}
function agentPos(a, t) {
  if (a.still) return { x: a.at[0], y: a.at[1], act: a.still, f: Math.floor(t * a.rate + (a.ph || 0)) };
  if (a.stay) return { x: a.home[0], y: a.home[1], act: 'walk', f: 0, idle: true };
  const L = 9, work = 2.6, rest = .6, walk = (L - work - rest) / 2, d = Math.hypot(a.spot[0] - a.home[0], a.spot[1] - a.home[1]); let u = ((t + a.off) % L + L) % L;
  if (u < walk) { const f = u / walk; return { x: a.home[0] + (a.spot[0] - a.home[0]) * f, y: a.home[1] + (a.spot[1] - a.home[1]) * f, act: 'walk', flip: a.spot[0] < a.home[0], f: Math.floor(d * f / 4) }; } u -= walk;
  if (u < work) return { x: a.spot[0], y: a.spot[1], act: a.act, f: Math.floor(u * 6) }; u -= work;
  if (u < walk) { const f = u / walk; return { x: a.spot[0] + (a.home[0] - a.spot[0]) * f, y: a.spot[1] + (a.home[1] - a.spot[1]) * f, act: a.carry, flip: a.home[0] < a.spot[0], f: Math.floor(d * f / 4) }; }
  return { idle: true };
}

/* ---------- armies on the map ---------- */
function armyPos(a) { const t = G.tiles[a.tile]; let x = t.cx - 34, y = t.cy - 26; if (a.camp) { x = t.cx - 22; y = t.cy + 4; } if (a.anim) { const u = Math.min(1, (performance.now() - a.anim.t0) / 600); const e = u * u * (3 - 2 * u); x = a.anim.x + (x - a.anim.x) * e; y = a.anim.y + (y - a.anim.y) * e; if (u >= 1) a.anim = null; } return [x, y]; }
function drawArmy(ctx, a) {
  const [x, y] = armyPos(a), walking = !!a.anim, flip = a.owner !== 'raider' && G.tiles[a.tile].cx > G.world.CX;
  const list = []; for (const k of ['sword', 'spear', 'archer']) for (let i = 0; i < a.units[k]; i++) list.push(k); const n = Math.min(9, list.length), f = []; for (let i = 0; i < n; i++) f.push(list[Math.floor(i * list.length / n)]);
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(f.length * 1.4))));
  if (UI.sel && UI.sel.army === a) { ctx.fillStyle = '#f4d692'; for (let i = 0; i < 140; i++) { if (i % 6 > 3) continue; const an = i / 140 * Math.PI * 2; ctx.fillRect(Math.round(x + Math.cos(an) * 30), Math.round(y + 10 + Math.sin(an) * 13), 2, 1); } }
  const ph = Math.floor(performance.now() / 140) % 4;
  f.forEach((u, k) => { const c = k % cols, r = Math.floor(k / cols), px = x + (c - (cols - 1) / 2) * 9 + (r % 2 ? 4 : 0), py = y + r * 7; shadow(ctx, px, py, 4); spr(ctx, figSpr(a.owner, u, walking ? 'walk' + ((ph + k) % 4) : 'stand', (k * 3 + a.id) % 6), px, py, flip); });
  if (a.units.cata) { shadow(ctx, x + 26, y + 14, 8); spr(ctx, UI.cata, x + 26, y + 14, flip); }
  if (a.owner !== 'raider') banner(ctx, x + (flip ? 1 : -1) * (cols / 2 + 1) * 9, y - 2, COLS[a.owner]);
}

/* ---------- the frame ---------- */
function render() {
  const cv = $('cv'), ctx = cv.getContext('2d'), d = DPR(), c = UI.cam, k = c.z * d, t = now(), ex = player('red').explored;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#16304f'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(k, 0, 0, k, -c.x * k, -c.y * k); ctx.imageSmoothingEnabled = false; ctx.drawImage(UI.static, 0, 0);
  const mk = (ti, col, a) => { const m = tileMask(ti, col); ctx.globalAlpha = a; ctx.drawImage(m.c, m.x, m.y); ctx.globalAlpha = 1; };
  if (G.started) { for (const P of G.players) for (const ti of territory(P.id)) if (ex.has(ti)) mk(ti, COLS[P.id], P.human ? .55 : .4); }
  if (UI.sel && UI.sel.reach) for (const [ti] of UI.sel.reach) { const en = G.armies.some(x => x.tile === ti && x.owner !== 'red'); mk(ti, en ? '#e9675a' : '#f4ecd0', en ? .9 : .7); }
  if (UI.sel && UI.sel.tile != null) mk(UI.sel.tile, '#fff4d0', .9);
  if (UI.hover && UI.hover.tile != null && (UI.mode !== 'idle' || G.started)) mk(UI.hover.tile, '#fff4d0', .45);
  if (UI.power === 'raise') for (const s of raiseTargets('red')) ring(ctx, s.cx, s.cy, 50, '#c9a8ff');
  if (UI.mode === 'hearth') for (const v of G.verts) if (canHearth('red', v)) ring(ctx, v.vx, v.vy, 10, UI.hover && UI.hover.vert === v ? '#fff' : '#f4d692');
  // tokens with worker pips
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const R = player('red');
  for (const ti of G.tiles.map(t => t.i)) { const tl = G.tiles[ti]; if (!tl.num || !ex.has(ti)) continue; const cx = Math.round(tl.cx), cy = Math.round(tl.cy), blessed = G.omen === tl.num;
    if (blessed) { ctx.fillStyle = '#f4d692'; for (let a = 0; a < 90; a++) { if (a % 5 > 2) continue; const q = a / 90 * 6.283 + t * .4; ctx.fillRect(Math.round(cx + Math.cos(q) * 19), Math.round(cy + Math.sin(q) * 19), 2, 2); } }
    for (let y = -13; y <= 15; y++) for (let x = -13; x <= 13; x++) { const dd = Math.hypot(x, y), d2 = Math.hypot(x - 1, y - 2); let col = null; if (dd <= 13) col = dd > 11.8 ? '#2a2018' : (y > 3 && bay(x + 16, y + 16) < .5) ? '#c8b98a' : '#e8dcc0'; else if (d2 <= 13) col = 'rgba(10,8,5,.3)'; if (col) { ctx.fillStyle = col; ctx.fillRect(cx + x, cy + y, 1, 1); } }
    ctx.font = '600 15px "Pixelify Sans"'; ctx.fillStyle = (tl.num === 6 || tl.num === 8) ? '#b8322a' : '#2a2018'; ctx.fillText(tl.num, cx + .5, cy - .5);
    if (territory('red').has(ti)) { const n = R.workers[ti] || 0; for (let i = 0; i < 3; i++) { const px = cx - 8 + i * 8, py = cy + 18; ctx.fillStyle = '#140e0a'; ctx.fillRect(px - 3, py - 3, 6, 6); ctx.fillStyle = i < n ? LIGHT.red : '#5a4a36'; ctx.fillRect(px - 2, py - 2, 4, 4); } } }
  // the world's moving things, back to front
  const items = [];
  for (const v of G.verts) if (v.owner && v.tiles.some(tt => ex.has(tt))) items.push([v.vy, () => drawHearth(ctx, v)]);
  for (const tl of G.tiles) if (tl.type === 'desert' && ex.has(tl.i)) items.push([tl.cy - 20, () => { if (G.armies.some(a => a.camp && a.tile === tl.i)) { spr(ctx, bldP('hut', 'red'), tl.cx - 28, tl.cy - 22); spr(ctx, bldP('hut', 'gold'), tl.cx + 26, tl.cy - 26); spr(ctx, bldP('hut', 'blue'), tl.cx + 6, tl.cy + 34); spr(ctx, bldP('fire', 'red'), tl.cx + 2, tl.cy - 2); } }]);
  for (const a of G.armies) if (ex.has(a.tile)) items.push([armyPos(a)[1], () => drawArmy(ctx, a)]);
  if (G.started) for (const ag of folkAgents()) { const p = agentPos(ag, t); if (p.idle) continue; items.push([p.y, () => { shadow(ctx, p.x, p.y, 3); spr(ctx, folkF(ag.o, ag.who, p.act, p.f), p.x, p.y, p.flip); }]); }
  items.sort((a, b) => a[0] - b[0]).forEach(i => i[1]());
  ctx.drawImage(UI.fog, 0, 0);
  if (UI.landfall) for (const v of G.beaches) { const on = UI.landfall.beach === v.id; ring(ctx, v.vx, v.vy, 26, on ? '#f4d692' : '#e8dcc0'); if (on) canoe(ctx, v.vx + (v.vx > G.world.CX ? 46 : -46), v.vy + 18, 'red', t, v.vx < G.world.CX); }
  if (UI.sel && UI.sel.army && UI.hover && UI.hover.tile != null && UI.sel.reach && UI.sel.reach.has(UI.hover.tile)) { const [ax, ay] = armyPos(UI.sel.army), tt = G.tiles[UI.hover.tile]; ctxArrow(ctx, [ax, ay + 4], [tt.cx - 10, tt.cy - 14], G.armies.some(x => x.tile === tt.i && x.owner !== 'red') ? '#e9675a' : '#f4d692'); }
  if (UI.sel && UI.sel.army) for (const v of adjacentEnemyHearths(UI.sel.army)) ring(ctx, v.vx, v.vy + 4, 38, '#e9675a');
  drawMini(); labels();
}
function ring(ctx, x, y, r, col) { ctx.fillStyle = col; for (let a = 0; a < 72; a++) { if (a % 4 === 3) continue; const an = a / 72 * Math.PI * 2; ctx.fillRect(Math.round(x + Math.cos(an) * r), Math.round(y + Math.sin(an) * r * .5), 2, 1); } }
function canoe(ctx, x, y, tribe, t, flip) { x = Math.round(x); y = Math.round(y); const d = flip ? -1 : 1;
  for (let k = 0; k < 9; k++) { const u = (t * .6 + k / 9) % 1; ctx.fillStyle = `rgba(200,225,232,${.6 * (1 - u)})`; ctx.fillRect(Math.round(x - d * (16 + u * 30)), Math.round(y + 2 + (k % 2 ? 2 : -1) * u * 3), 3, 1); }
  [0, 1, 2].forEach(k => { const s = folkF(tribe, k, 'walk', 0); ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 40, 40, 39); ctx.clip(); spr(ctx, s, x - 9 + k * 9, y + 6, flip); ctx.restore(); });
  for (let i = -15; i <= 15; i++) for (let j = Math.abs(i) > 12 ? 1 : 0; j < 4; j++) { ctx.fillStyle = j === 0 || (j === 1 && Math.abs(i) > 12) ? '#a87a48' : j === 1 ? '#8a6a3c' : '#5a3a24'; ctx.fillRect(x + i, y - 2 + j, 1, 1); } }
function labels() {
  const ov = $('ov'); let h = ''; const ex = player('red').explored;
  for (const a of G.armies) { if (!ex.has(a.tile)) continue; const [x, y] = armyPos(a), [X, Y] = toScreen(x, y - 30); if (X < -60 || Y < -20 || X > innerWidth + 60 || Y > innerHeight + 40) continue; const n = uCount(a.units);
    h += `<div class="badge" style="left:${X}px;top:${Y}px"><i style="background:${COLS[a.owner]}"></i>${a.owner === 'raider' ? `<span class="neg">Raiders ${n}</span>` : `⚔ ${n - a.units.cata}${a.units.cata ? ' · ● ' + a.units.cata : ''}`}${a.owner === 'red' && a.moves > 0 && G.cur === 0 ? `<span class="gold">·${a.moves}</span>` : ''}</div>`; }
  for (const v of G.verts) { if (!v.owner || !v.tiles.some(t => ex.has(t))) continue; const [X, Y] = toScreen(v.vx, v.vy + 44); if (X < -80 || Y < -20 || X > innerWidth + 80 || Y > innerHeight + 30) continue;
    h += `<div class="hlab" style="left:${X}px;top:${Y}px"><i style="background:${COLS[v.owner]}"></i>${v.name} <span>· ${v.souls}${v.wall > 0 ? ' ▥' : ''}</span></div>`; }
  ov.innerHTML = h;
}
let lastFog = 0;
function loop() { if (UI.static && !UI.inBattle) { if (performance.now() - lastFog > 500) { lastFog = performance.now(); refreshFog(); } render(); } if (UI.inBattle && UI.battleFrame) UI.battleFrame(); requestAnimationFrame(loop); }

/* ---------- input ---------- */
function bindInput() {
  const cv = $('cv'); let down = null;
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, cx: UI.cam.x, cy: UI.cam.y, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 5) down.moved = true; if (down.moved) { UI.cam.x = down.cx - dx / UI.cam.z; UI.cam.y = down.cy - dy / UI.cam.z; clampCam(); return; } } hoverAt(e.clientX, e.clientY); });
  cv.addEventListener('pointerup', e => { if (down && !down.moved) clickAt(e.clientX, e.clientY); down = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); const [wx, wy] = toWorld(e.clientX, e.clientY); UI.cam.z = e.deltaY < 0 ? 2 : 1; UI.cam.x = wx - e.clientX / UI.cam.z; UI.cam.y = wy - e.clientY / UI.cam.z; clampCam(); }, { passive: false });
  $('mini').addEventListener('click', e => { const r = $('mini').getBoundingClientRect(), k = G.world.W / r.width; centerOn((e.clientX - r.left) * k, (e.clientY - r.top) * k); });
  addEventListener('keydown', e => { if (UI.busy || UI.inBattle) return; if (e.key === 'Escape') { UI.mode = 'idle'; UI.sel = null; UI.power = null; hud(); } if (e.key === 'Enter' && G.started) act('end'); });
}
function pick(wx, wy) {
  let vert = null, vd = 20; for (const v of G.verts) { const d = Math.hypot(v.vx - wx, v.vy - wy); if (d < vd) { vd = d; vert = v; } }
  let town = null; for (const v of G.verts) if (v.owner && Math.abs(wx - v.vx) < 50 && wy > v.vy - 52 && wy < v.vy + 30) { if (!town || Math.hypot(v.vx - wx, v.vy - wy) < Math.hypot(town.vx - wx, town.vy - wy)) town = v; }
  const t = G.world.cellTile(wx, wy); let army = null; for (const a of G.armies) { const [x, y] = armyPos(a); if (Math.abs(wx - x) < 26 && wy > y - 26 && wy < y + 22) army = a; }
  return { vert, town, tile: t ? t.i : null, army, wx, wy };
}
function hoverAt(sx, sy) { if (!G.world) return; const [wx, wy] = toWorld(sx, sy), h = pick(wx, wy); const key = [h.tile, h.vert && h.vert.id, h.army && h.army.id, h.town && h.town.id].join(); if (key !== UI.hoverKey) { UI.hover = h; UI.hoverKey = key; oddsCard(); } $('cv').style.cursor = (h.army || h.town) ? 'pointer' : ''; }
const myTurn = () => G.started && G.cur === 0 && !UI.busy && !G.winner && !UI.inBattle;
function clickAt(sx, sy) {
  const [wx, wy] = toWorld(sx, sy), h = pick(wx, wy), P = player('red');
  if (UI.landfall) { const b = G.beaches.find(v => Math.hypot(v.vx - wx, v.vy - wy) < 40); if (b) { UI.landfall.beach = b.id; showLandfall(); } return; }
  if (!myTurn()) return;
  if (UI.power) return usePowerAt(h);
  if (UI.mode === 'hearth') { if (h.vert && canHearth('red', h.vert)) { if (!donor('red')) return UI.toast('No hearth has 3 souls to send out.'); if (!canPay(P, COST.hearth)) return UI.toast('Not enough goods for a hearth.'); buildHearth('red', h.vert); UI.toast(`You founded <b>${h.vert.name}</b>. Two souls walk out to it.`, 'big'); UI.mode = 'idle'; UI.sel = { vert: h.vert }; hud(); checkWinUI(); } return; }
  if (UI.sel && UI.sel.army) { const a = UI.sel.army;
    if (h.town && h.town.owner !== 'red' && adjacentEnemyHearths(a).includes(h.town)) return openSiege(a, h.town);
    if (h.tile != null && UI.sel.reach && UI.sel.reach.has(h.tile)) { const cost = UI.sel.reach.get(h.tile), e = G.armies.find(x => x.tile === h.tile && x.owner !== 'red'); if (e) return attackArmy(a, e, cost);
      const [ox, oy] = armyPos(a); const m = moveArmy(a, h.tile, cost); m.anim = { x: ox, y: oy, t0: performance.now() }; selectArmy(m.moves > 0 ? m : null); return; } }
  if (h.army && h.army.owner === 'red') return selectArmy(h.army);
  if (h.town && h.town.owner === 'red') { UI.sel = { vert: h.town }; hud(); return; }
  if (h.town || (h.army && player('red').explored.has(h.army.tile))) { UI.sel = { info: h.army || h.town }; hud(); return; }
  if (h.tile != null && territory('red').has(h.tile)) { UI.sel = { tile: h.tile }; hud(); return; }
  UI.sel = null; hud();
}
function selectArmy(a) { UI.mode = 'idle'; UI.sel = a ? { army: a, reach: a.moves > 0 ? reachable(a) : new Map() } : null; hud(); }

/* ---------- landfall ---------- */
function showLandfall() {
  if (!UI.landfall) UI.landfall = { beach: G.beaches[0].id, patron: 'mother' };
  const L = UI.landfall, el = $('landfall'); el.style.display = '';
  const sees = v => v.tiles.map(ti => TNAME[G.tiles[ti].type]).join(' · ');
  el.innerHTML = `<div class="gl lfh"><div class="lft">Landfall</div><div class="dim">Year 1, early spring. The island is unwalked. Choose a patron, then the beach where your canoe comes ashore. Click a ring on the coast to choose.</div>
    <div class="dim" style="margin-top:6px">Beach: <b style="color:#f4d692">${sees(G.verts[L.beach])}</b></div></div>
    <div class="gl lfp">${Object.entries(PATRONS).map(([k, p], i) => `<button class="pc${L.patron === k ? ' on' : ''}" data-p="${k}"><img src="${folkURL(i)}"><b>${p.name}</b><span class="pw">✦ ${POWERS[p.power].name}</span><span>${p.passive}</span></button>`).join('')}
    <button class="btn big go" id="lfgo">Come ashore ➜</button></div>`;
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { L.patron = b.dataset.p; showLandfall(); });
  $('lfgo').onclick = () => { landfall(L.beach, L.patron); UI.landfall = null; el.style.display = 'none'; worldLayers(); const v = hearths('red')[0]; UI.cam.z = 2; centerOn(v.vx, v.vy + 20); UI.sel = { vert: v }; hud(); UI.toast('Click a tile inside your red border to send people to work it. Click your hearth to recruit or build.'); };
  const v = G.verts[L.beach]; UI.cam.z = 1; centerOn((v.vx + G.world.CX) / 2, (v.vy + G.world.CY) / 2);
}
const FOLKURL = {}; function folkURL(i) { if (FOLKURL[i]) return FOLKURL[i]; const s = folkF('red', i, 'pray', 2); const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; c.getContext('2d').drawImage(s.img, 0, 0); return (FOLKURL[i] = c.toDataURL()); }

/* ---------- the HUD ---------- */
function hud() {
  const P = player('red');
  $('res').innerHTML = RES.map(k => `<span title="${RES_NAME[k]}">${icon(k, 4)}${P.res[k]}</span>`).join('');
  $('clock').innerHTML = `Year <b>${G.year}</b>`;
  $('seasons').innerHTML = SEASONS.map((s, i) => `<i class="${i === G.season ? 'on' : ''}">${s}</i>`).join('');
  $('omen').innerHTML = G.omen ? `<span class="dim">Omen</span> <b class="${G.omen === 7 ? 'neg' : 'gold'}">${G.omen}</b>` : '';
  const civ = civilians('red'), sol = soldiers('red'), mouths = Math.ceil((civ + sol) / 2);
  $('folk').innerHTML = G.started ? `<span title="souls at home · under arms">☺ ${civ} <span class="dim">· ⚔ ${sol}</span></span> <span class="dim" title="grain eaten at winter's end">eats ${mouths}</span> <span class="fav" title="favour">${Array.from({ length: 9 }, (_, i) => `<i class="${i < P.favour ? '' : 'x'}"></i>`).join('')}</span>` : '';
  const lp = largestPeople(), sh = strongestHost();
  $('pls').innerHTML = G.players.map(Q => `<span class="pl${G.cur === Q.i ? ' cur' : ''}" title="${Q.patron ? PATRONS[Q.patron].name : ''}"><i style="background:${COLS[Q.id]}"></i>${Q.human ? 'You' : PNAME[Q.id]} · ${G.started ? legend(Q.id) : 0}${lp === Q.id ? ' ☺' : ''}${sh === Q.id ? ' ⚔' : ''}</span>`).join('') + `<span class="dim" style="font:500 11px var(--pix)">to ${WIN}</span>`;
  const mine = myTurn();
  const dk = (k, n, g, cost, on, cls) => `<button class="dk${UI.mode === k || UI.power && k === 'powers' ? ' on' : ''}${cls || ''}" data-act="${k}" ${on ? '' : 'disabled'}><i>${g}</i>${n}<span class="cost">${cost ? costHTML(cost) : ''}</span></button>`;
  $('dock').style.display = G.started ? '' : 'none';
  $('dock').innerHTML = dk('hearth', 'Hearth', '⌂', COST.hearth, mine && canPay(P, COST.hearth)) + dk('powers', 'Patron', '✦', null, mine && !P.powerUsed, ' pow') + dk('trade', 'Trade', '⇄', null, mine) + dk('end', 'End ' + SEASONS[G.season].toLowerCase(), '⏎', null, mine, ' end');
  $('dock').querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act));
  card();
}
function act(k) {
  if (!myTurn()) return;
  if (k === 'end') { UI.mode = 'idle'; UI.sel = null; UI.power = null; ['siege', 'trade', 'powers'].forEach(id => $(id).style.display = 'none'); hud(); runOthers(); return; }
  if (k === 'trade') return openTrade();
  if (k === 'powers') return openPowers();
  UI.mode = UI.mode === k ? 'idle' : k; UI.sel = null; hud(); if (UI.mode === 'hearth') UI.toast('Click a lit corner touching your land. Two souls from your largest hearth will settle it.');
}
const URLC = {}; function sprURL(s) { if (!s) return ''; if (URLC[s.u]) return URLC[s.u]; const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; c.getContext('2d').drawImage(s.img, 0, 0); return (URLC[s.u] = c.toDataURL()); }
function unitRows(o, u) { return ['sword', 'spear', 'archer', 'cata', 'militia'].filter(k => u[k]).map(k => `<div class="urow"><img src="${k === 'cata' ? sprURL(UI.cata) : sprURL(cfx(o, k, 1, k === 'archer' ? 'shoot1' : 'guard'))}"><div><b>${UNIT_NAME[k]}</b> <span class="gold">×${u[k]}</span><div class="dim" style="font-size:11px">${UNIT_NOTE[k]}</div></div></div>`).join(''); }
function card() {
  const el = $('card'), s = UI.sel, P = player('red'); el.style.display = 'none'; if (!s || !G.started) return; el.style.display = '';
  if (s.army) { const a = s.army; el.innerHTML = `<h4>Your host <span class="dim">· ${uCount(a.units)} strong</span></h4>${unitRows('red', a.units)}<div class="row2"><span class="dim">Moves left <b class="gold">${a.moves}</b></span>${a.units.cata ? `<span class="dim">Shots <b class="gold">${a.units.cata - a.fired}</b></span>` : ''}</div><div class="dim small">Click a lit tile to march (mountains cost 2), a red one to attack. A red ring is an enemy hearth you can besiege.</div>`; return; }
  if (s.tile != null) { const t = G.tiles[s.tile], n = P.workers[s.tile] || 0, y = YIELD[t.type], free = civilians('red') - placed(P), yl = tileYield(Object.assign({}, P, { workers: { [s.tile]: Math.max(1, n) } }), s.tile, t.num === G.omen);
    el.innerHTML = `<h4>${TNAME[t.type]} <span class="dim">· ${t.num || '—'}${t.num === G.omen ? ' · blessed' : ''}</span></h4>${y ? `<div class="row2"><span class="dim">Workers</span><span class="wk"><button class="btn" id="wm" ${n ? '' : 'disabled'}>−</button><b class="gold">${n} / 3</b><button class="btn" id="wp" ${n < 3 && free > 0 ? '' : 'disabled'}>+</button></span></div>
      <div class="row2"><span class="dim">Each season</span><span>${n ? `${yl && yl.n ? yl.n : 0} ${icon(y, 3)}` : '—'}${yl && yl.blocked ? ' <span class="neg">blocked by an army</span>' : ''}</span></div><div class="dim small">${free} soul${free === 1 ? '' : 's'} free at home. Wheat and wool yield double in summer; wheat yields nothing in winter. The omen number doubles a tile. Every hearth's garden also gives 1 grain a season (2 for a hall), except in winter.</div>` : '<div class="dim">Nothing grows in the waste.</div>'}`;
    const m = $('wm'), p = $('wp'); if (m) m.onclick = () => { P.workers[s.tile]--; if (!P.workers[s.tile]) delete P.workers[s.tile]; hud(); }; if (p) p.onclick = () => { P.workers[s.tile] = n + 1; hud(); }; return; }
  if (s.vert) { const v = s.vert, mine = myTurn(), work = Object.entries(P.workers).filter(([ti]) => v.tiles.includes(+ti)).reduce((a, [, n]) => a + n, 0);
    const btn = (id, label, cost, on) => `<button class="btn" id="${id}" ${mine && on && canPay(P, cost) ? '' : 'disabled'}>${label} <span class="cost">${costHTML(cost)}</span></button>`;
    el.innerHTML = `<h4>${v.name} <span class="dim">· ${v.level === 2 ? 'hall' : 'hearth'}${v.monument ? ' · great work' : ''}</span></h4>
      <div class="row2"><span class="dim">Souls</span><b class="gold">${v.souls} / ${CAP[v.level]}</b><span class="dim">Walls</span><span>${v.wall > 0 ? v.wall + '%' : 'none'}</span></div>
      <div class="row2"><span class="dim">At prayer</span><span class="wk"><button class="btn" id="pm" ${P.prayer ? '' : 'disabled'}>−</button><b style="color:#c9a8ff">${P.prayer}</b><button class="btn" id="pp" ${civilians('red') - placed(P) > 0 ? '' : 'disabled'}>+</button></span><span class="dim">+${P.prayer} favour a season</span></div>
      <h5>Arm a soul <span class="dim" style="text-transform:none;letter-spacing:0">· each soldier leaves the hearth</span></h5><div class="rec">${['spear', 'sword', 'archer', 'cata'].map(u => `<button class="btn" data-rec="${u}" ${mine && v.souls >= 2 && canPay(P, COST[u]) ? '' : 'disabled'}><img src="${u === 'cata' ? sprURL(UI.cata) : sprURL(cfx('red', u, 0, u === 'archer' ? 'shoot1' : 'guard'))}">${UNIT_ONE[u]}<span class="cost">${costHTML(COST[u])}</span></button>`).join('')}</div>
      <h5>Build</h5><div class="bld">${btn('bhall', 'Raise hall', COST.hall, v.level === 1)}${btn('bwall', 'Walls', wallCost(P), v.wall <= 0)}${btn('bmon', 'Great work +3', COST.monument, v.level === 2 && !hearths('red').some(x => x.monument))}</div>`;
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on('pm', () => { P.prayer--; hud(); }); on('pp', () => { P.prayer++; hud(); });
    on('bhall', () => { pay(P, COST.hall); v.level = 2; UI.toast(`${v.name} is a hall now: room for 9 souls, +1 legend.`, 'big'); hud(); checkWinUI(); });
    on('bwall', () => { pay(P, wallCost(P)); v.wall = 100; UI.toast(`Walls around ${v.name}: defenders get +3 while they stand.`, 'big'); hud(); });
    on('bmon', () => { pay(P, COST.monument); v.monument = true; UI.toast(`Your patron's great work stands at ${v.name}: +3 legend.`, 'big'); hud(); checkWinUI(); });
    el.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => { const a = recruit('red', v, b.dataset.rec); if (a) { UI.toast(`A ${UNIT_ONE[b.dataset.rec].toLowerCase()} takes up arms.`); hud(); } });
    return; }
  if (s.info) { const o = s.info; if (o.units) el.innerHTML = `<h4>${pn(o.owner)} <span class="dim">· ${o.camp ? 'raider camp' : 'host'} · ${uCount(o.units)}</span></h4>${unitRows(o.owner, o.units)}`;
    else el.innerHTML = `<h4>${o.name} <span class="dim">· ${pn(o.owner)}'s ${o.level === 2 ? 'hall' : 'hearth'}</span></h4><div class="row2"><span class="dim">Souls</span><span>${o.souls}</span><span class="dim">Walls</span><span>${o.wall > 0 ? o.wall + '%' : 'none'}</span></div><div class="dim small">Its souls defend it. Bring a host next to it to besiege it.</div>`; }
}
function oddsCard() {
  const el = $('odds'); el.style.display = 'none'; const s = UI.sel, h = UI.hover; if (!s || !s.army || !h) return; const a = s.army;
  let mkD = null, title = '';
  if (h.town && h.town.owner !== 'red' && adjacentEnemyHearths(a).includes(h.town)) { const v = h.town; mkD = () => hearthSide(v); title = `Assault ${v.name}?`; }
  else if (h.tile != null && s.reach && s.reach.has(h.tile)) { const e = G.armies.find(x => x.tile === h.tile && x.owner !== 'red'); if (e) { mkD = () => armySide(e, { terrain: terrainBonus(e.tile) }); title = e.camp ? 'Attack the raider camp?' : `Attack ${PNAME[e.owner]}'s host?`; } }
  if (!mkD) return; const key = h.tile + ':' + JSON.stringify(a.units) + (h.town ? h.town.id : ''); if (UI.oddsKey !== key) { UI.oddsKey = key; UI.oddsVal = odds(() => armySide(a), mkD); }
  const p = Math.round(UI.oddsVal * 100), col = p > 60 ? '#8fd16a' : p > 35 ? '#e9b95a' : '#e9675a', D = mkD();
  el.style.display = ''; el.innerHTML = `<h4>${title}</h4><div class="kv"><span>You</span><span>${a.units.sword} sword · ${a.units.spear} spear · ${a.units.archer} bow</span><span>Them</span><span>${alive(D).length} fighters${D.terrain ? ' · <span class="neg">+1 ground</span>' : ''}${D.wall ? ` · <span class="neg">walls +${D.wall >= 25 ? 3 : 1}</span>` : ''}</span></div>
    <div style="display:flex;gap:6px;align-items:center;margin:7px 0 2px"><span class="dim">Odds</span><div class="bar" style="flex:1"><i style="width:${p}%;background:${col}"></i></div><b style="color:${col}">${p}%</b></div><div class="dim" style="font-size:11px">Each beat you give one order; then every pair of fighters rolls.</div>`;
}
UI.toast = (html, kind) => { const t = $('toasts'); if (!t) return; const d = document.createElement('div'); d.className = 'gl toast' + (kind ? ' ' + kind : ''); d.innerHTML = `<span class="ki">${kind === 'war' ? '!' : kind === 'big' ? '✦' : '·'}</span><span>${html}</span>`; t.prepend(d); while (t.children.length > 5) t.lastChild.remove(); setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 600); }, kind ? 9000 : 6000); };

/* ---------- patron powers ---------- */
function openPowers() {
  const el = $('powers'), P = player('red'); el.style.display = '';
  el.innerHTML = `<h4 style="color:#c9a8ff">${PATRONS[P.patron].name} <span class="dim">· favour ${P.favour}</span></h4><div class="dim" style="font-size:11px">One power a season. Souls at prayer earn favour; breaking a raider camp earns 2.</div>
    ${Object.entries(POWERS).map(([k, p]) => `<button class="pw" data-pw="${k}" ${canPower(P, k) ? '' : 'disabled'}><i>${p.glyph}</i><b>${p.name}</b><span class="c">${powerCost(P, k)}</span><span class="d">${p.desc}</span></button>`).join('')}
    ${'<div class="pick" id="rt">' + ['forest', 'pasture', 'field'].map(t => `<button class="btn${UI.raiseType === t ? ' on' : ''}" data-rt="${t}">${icon(YIELD[t], 4)}${TNAME[t]}</button>`).join('') + '</div>'}<div class="sbtns"><button class="btn" id="pwx">Close</button></div>`;
  el.querySelectorAll('[data-pw]').forEach(b => b.onclick = () => { UI.power = b.dataset.pw; el.style.display = 'none'; hud(); UI.toast({ rain: 'Click a tile your people work.', lightning: 'Click an enemy or raider army you can see.', quake: 'Click a walled enemy hearth.', raise: 'Click a violet ring in the sea beside your land.' }[UI.power]); });
  el.querySelectorAll('[data-rt]').forEach(b => b.onclick = () => { UI.raiseType = b.dataset.rt; openPowers(); });
  $('pwx').onclick = () => { el.style.display = 'none'; };
}
function usePowerAt(h) {
  const P = player('red'), k = UI.power, done = (msg) => { P.favour -= powerCost(P, k); P.powerUsed = true; UI.power = null; UI.toast(msg, 'big'); hud(); };
  if (k === 'rain' && h.tile != null && P.workers[h.tile]) { const y = tileYield(P, h.tile, true); if (y && y.n) { gain(P, y.k, y.n); return done(`Rain on the ${TNAME[G.tiles[h.tile].type].toLowerCase()}: +${y.n} ${RES_NAME[y.k]}.`); } }
  if (k === 'lightning' && h.army && h.army.owner !== 'red' && P.explored.has(h.army.tile)) { strike(h.army); return done('Lightning splits the sky. Two of them fall.'); }
  if (k === 'quake' && h.town && h.town.owner !== 'red' && h.town.wall > 0) { h.town.wall = Math.floor(h.town.wall / 2); return done(`The ground heaves under ${h.town.name}: its wall is cracked.`); }
  if (k === 'raise') { const s = raiseTargets('red').find(s => Math.hypot(s.cx - h.wx, s.cy - h.wy) < 60); if (s) { done('The Tide Singer is answered: new land rises from the sea.'); raiseLand('red', s.q, s.r, UI.raiseType); worldLayers(); P.workers[G.tiles.length - 1] = 0; hud(); return; } }
  UI.toast('That is not a target for this power. Press Esc to cancel.');
}

/* ---------- trade ---------- */
function openTrade() {
  const el = $('trade'), P = player('red'); let give = RES.find(k => P.res[k] >= 3) || null, get = null;
  const draw = () => { el.innerHTML = `<h4>Trade at the shore <span class="dim">· 3 of one for 1 of another</span></h4><h5>Give 3</h5><div class="pick">${RES.map(k => `<button class="btn${give === k ? ' on' : ''}" data-g="${k}" ${P.res[k] >= 3 ? '' : 'disabled'}>${icon(k, 4)}${P.res[k]}</button>`).join('')}</div>
    <h5>Get 1</h5><div class="pick">${RES.map(k => `<button class="btn${get === k ? ' on' : ''}" data-r="${k}" ${k === give ? 'disabled' : ''}>${icon(k, 4)}</button>`).join('')}</div><div class="sbtns"><button class="btn big" id="tgo" ${give && get ? '' : 'disabled'}>Trade</button><button class="btn" id="tx">Close</button></div>`; el.style.display = '';
    el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { give = b.dataset.g; if (get === give) get = null; draw(); }); el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { get = b.dataset.r; draw(); });
    $('tx').onclick = () => el.style.display = 'none'; $('tgo').onclick = () => { P.res[give] -= 3; P.res[get]++; if (P.res[give] < 3) give = RES.find(k => P.res[k] >= 3) || null; hud(); draw(); }; };
  draw();
}

/* ---------- attacks and sieges ---------- */
async function attackArmy(a, e, cost) {
  a.from = a.tile; a.moves = Math.max(0, a.moves - cost); UI.sel = null; hud();
  const A = armySide(a), D = armySide(e, { terrain: terrainBonus(e.tile) });
  const r = await battle({ A, D, tile: e.tile, title: e.camp ? 'The raider camp' : `${PNAME[e.owner]}'s host`, camp: e.camp });
  afterArmyBattle(a, e, A, D, r); hud(); checkWinUI();
}
function openSiege(a, v) {
  const el = $('siege');
  const draw = (msg) => { const shots = a.units.cata - a.fired, segs = Array.from({ length: 10 }, (_, i) => `<i class="${i * 10 >= v.wall ? 'x' : ''}"></i>`).join('');
    const p = Math.round(odds(() => armySide(a), () => hearthSide(v)) * 100);
    el.innerHTML = `<h4 style="font-size:16px">Siege of ${v.name}</h4><div class="row2"><span class="dim">Wall</span><b class="gold">${v.wall > 0 ? v.wall + '%' : 'no walls'}</b></div>${v.wall > 0 ? `<div class="seg">${segs}</div>` : ''}
      <div class="dim small">${v.wall >= 25 ? 'While it stands, defenders add <b>+3</b> to every roll.' : v.wall > 0 ? 'Breached: defenders add only <b>+1</b>.' : 'No wall.'} Its ${v.souls} souls fight as townsfolk and never break.</div>
      ${msg ? `<div class="msg">${msg}</div>` : ''}<div class="sbtns"><button class="btn" data-s="bomb" ${shots > 0 && v.wall > 0 ? '' : 'disabled'}>● Bombard <span class="dim">${shots} shot${shots === 1 ? '' : 's'} · 2d6, 7+</span></button>
      <button class="btn war" data-s="storm" ${a.moves > 0 ? '' : 'disabled'}>⚔ Assault <span class="dim">${p}%</span></button><button class="btn" data-s="close">Close</button></div>`; el.style.display = '';
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = async () => { const k = b.dataset.s; if (k === 'close') { el.style.display = 'none'; return; }
      if (k === 'bomb') { const r = bombard(a, v); draw(`${dieHTML(r.r[0], 1)}${dieHTML(r.r[1], 0)} <b>${r.r[0] + r.r[1]}</b> — ${r.hit ? '<span class="pos">the wall cracks (−25)</span>' : '<span class="neg">wide</span>'}`); return; }
      if (k === 'storm') { el.style.display = 'none'; a.from = a.tile; const A = armySide(a), D = hearthSide(v); const r = await battle({ A, D, vert: v, title: `Assault on ${v.name}` }); afterAssault(a, v, A, D, r); UI.sel = null; hud(); checkWinUI(); } }); };
  draw();
}
function dieHTML(n, red) { const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n]; return `<span class="die${red ? ' r' : ''}">${P.map(([x, y]) => `<i style="left:${3 + x * 5}px;top:${3 + y * 5}px"></i>`).join('')}</span>`; }

/* ==========================================================================
   THE CLASH — Civ Sim's own strike frames, our dice.
   ========================================================================== */
function battle(o) {
  return new Promise(resolve => {
    const A = o.A, D = o.D, humanA = A.owner === 'red', me = humanA ? A : D, them = humanA ? D : A;
    UI.inBattle = true; UI.busy = true; const el = $('battle'); el.style.display = ''; ['siege', 'odds', 'card'].forEach(id => $(id).style.display = 'none');
    const loc = o.vert ? [o.vert.vx - 70, o.vert.vy + 6] : [G.tiles[o.tile].cx + 8, G.tiles[o.tile].cy + 4];
    // place everyone
    const place = (S, dir) => { const melee = S.f.filter(x => x.k !== 'archer' && x.k !== 'cata'), arch = S.f.filter(x => x.k === 'archer'), cata = S.f.filter(x => x.k === 'cata');
      const put = (L, col0) => L.forEach((x, i) => { const col = col0 + Math.floor(i / 6) * 16, row = i % 6; x.hx = loc[0] + dir * col + (row % 2) * dir * 3; x.hy = loc[1] - 62 + row * 25; x.x = x.hx; x.y = x.hy; x.who = (x.id * 7 + 3) % 3; x.dir = dir; x.owner = S.owner; x.vis = 'guard'; x.dead = false; });
      put(melee, 28); put(arch, 28 + Math.max(1, Math.ceil(melee.length / 6)) * 16 + 18); put(cata, 28 + Math.max(1, Math.ceil(melee.length / 6)) * 16 + 52); };
    place(A, -1); place(D, 1);
    let beat = 0, ev = null, t0 = 0, playing = false, result = null, last = '';
    const fx = [];   // floating dice and words
    const cv = $('bcv');
    const fig = id => (A.f.find(x => x === id) || D.f.find(x => x === id));
    const byId = (S, id) => S.f.find(x => x.id === id);
    const paint = () => {
      const W = innerWidth, H = innerHeight, d = DPR(), z = 2, k = z * d, sx = Math.round(loc[0] - W / z / 2), sy = Math.round(loc[1] - H / z / 2 - 18);
      if (cv.width !== W * d) { cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
      const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#16304f'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(k, 0, 0, k, -sx * k, -sy * k); ctx.imageSmoothingEnabled = false; ctx.drawImage(UI.static, 0, 0);
      const T = playing ? now() - t0 : 99, items = [];
      if (o.vert) items.push([o.vert.vy, () => drawHearth(ctx, o.vert)]);
      if (o.camp) { const tl = G.tiles[o.tile]; items.push([tl.cy - 30, () => { spr(ctx, bldP('hut', 'red'), loc[0] + 120, loc[1] - 48); spr(ctx, bldP('hut', 'gold'), loc[0] + 150, loc[1] + 34); spr(ctx, bldP('fire', 'red'), loc[0] + 126, loc[1] + 4); }]); }
      for (const S of [A, D]) for (const x of S.f) { const st = animOf(x, T); items.push([st.dead ? st.y - 40 : st.y, () => { if (!st.dead) shadow(ctx, st.x, st.y, x.k === 'cata' ? 8 : 4); if (x.k === 'cata' && !st.dead) spr(ctx, UI.cata, st.x, st.y, x.dir < 0 ? false : true); else spr(ctx, cfx(x.owner, x.k === 'cata' ? 'spear' : x.k, x.who, st.key), st.x, st.y, x.dir > 0); }]); }
      items.sort((a, b) => a[0] - b[0]).forEach(i => i[1]());
      // missiles
      if (ev && T < 0.75) for (const s of ev.shots) { const sh = byId(s.side, s.from), tg = byId(s.side === A ? D : A, s.to); if (!sh || !tg) continue; const u = Math.min(1, Math.max(0, (T - .05) / .55)); if (u <= 0 || u >= 1) continue; const x = sh.hx + (tg.hx - sh.hx) * u, y = sh.hy - 14 + (tg.hy - 12 - (sh.hy - 14)) * u - Math.sin(u * Math.PI) * 26;
        if (s.kind === 'cata') { ctx.fillStyle = '#8a837b'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.fillStyle = '#c8c0b2'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 2, 2); }
        else { const dx = (tg.hx - sh.hx) > 0 ? 1 : -1; for (let j = 0; j < 6; j++) { ctx.fillStyle = j === 0 ? '#e2e8ef' : j > 4 ? '#f2ece0' : '#8a6a3c'; ctx.fillRect(Math.round(x - dx * j), Math.round(y + (Math.cos(u * Math.PI)) * j * .4), 1, 1); } } }
      // sparks and blood at the clash
      if (ev && T > 1.42 && T < 1.9) for (const du of ev.duels) { const a = byId(A, du.a), dd = byId(D, du.d); if (!a || !dd) continue; const mx = (a.hx + dd.hx) / 2, my = (a.hy + dd.hy) / 2 - 12, r = mulberry(du.a * 31 + du.d + beat);
        for (let k2 = 0; k2 < (du.res === 'parry' ? 6 : 8); k2++) { const sp = (T - 1.42) * 30; ctx.fillStyle = du.res === 'parry' ? (r() < .5 ? '#fff6c8' : '#f4d692') : (r() < .6 ? '#a8201a' : '#e9675a'); ctx.fillRect(Math.round(mx + (r() - .5) * sp * 2), Math.round(my + (r() - .3) * sp + (du.res === 'parry' ? 0 : sp * .6)), 1, 1); } }
      // a die beside each fighter's head
      if (ev && T > 1.1) for (const du of ev.duels) { const a = byId(A, du.a), dd = byId(D, du.d); if (!a || !dd) continue; const mx = Math.round((a.hx + dd.hx) / 2), my = Math.round((a.hy + dd.hy) / 2) - 31 - Math.round(Math.min(1, (T - 1.1) * 5) * 2);
        const fade = T > 2.6 ? Math.max(0, 1 - (T - 2.6) * 2) : 1; ctx.globalAlpha = fade;
        pixDie(ctx, mx - 19, my, du.ra, COLS[A.owner], du.loser === 'D'); pixDie(ctx, mx + 10, my, du.rd, COLS[D.owner], du.loser === 'A');
        if (T > 1.45) { ctx.font = '600 7px "Pixelify Sans"'; ctx.textAlign = 'center'; ctx.fillStyle = du.res === 'parry' ? '#f4d692' : du.res === 'down' ? '#ff8a7a' : '#f2e6c8'; ctx.fillText(du.res === 'parry' ? 'parry' : du.res === 'down' ? 'down' : 'hit', mx, my + 5); }
        ctx.globalAlpha = 1; }
    };
    const animOf = (x, T) => {
      // where and how a fighter looks at time T into the beat
      const diedAt = x._diedAt; if (x.dead || (diedAt != null && T >= diedAt)) return { x: x.dx ?? x.hx, y: (x.dy ?? x.hy) + 4, key: 'down', dead: true };
      if (!ev || T > 2.6) return { x: x.hx, y: x.hy, key: x.k === 'archer' ? 'shoot0' : 'guard' };
      if (x.k === 'archer' || x.k === 'cata') { const shooting = ev.shots.some(s => s.from === x.id && s.side.f.includes(x)); const hit = x._hitAt != null && T >= x._hitAt && T < x._hitAt + .25; return { x: x.hx, y: x.hy, key: hit ? 'hit' : shooting && T < .6 ? 'shoot' + Math.min(3, Math.floor(T * 6)) : 'shoot0' }; }
      const du = x._duel; let px = x.hx, py = x.hy, key = 'guard';
      if (x._hitAt != null && T >= x._hitAt && T < x._hitAt + .25 && !du) key = 'hit';
      if (du) { const me2 = x.dir < 0 ? byId(A, du.a) : byId(D, du.d), foe = x.dir < 0 ? byId(D, du.d) : byId(A, du.a), mx = (me2.hx + foe.hx) / 2, my = (me2.hy + foe.hy) / 2;
        const tx = mx + x.dir * 7, ty = my; const step = T < .7 ? 0 : T < 1.0 ? (T - .7) / .3 : T < 1.65 ? 1 : T < 2.2 ? 1 - (T - 1.65) / .55 : 0;
        px = x.hx + (tx - x.hx) * step; py = x.hy + (ty - x.hy) * step;
        const lost = (du.loser === 'A' && x.dir < 0) || (du.loser === 'D' && x.dir > 0);
        if (T >= 1.0 && T < 1.25) key = 'windup'; else if (T >= 1.25 && T < 1.45) key = 'strike'; else if (T >= 1.45 && T < 1.7) key = du.res === 'parry' ? 'parry' : lost ? 'hit' : 'strike';
        if (lost && T >= 1.45 && T < 1.9) px += x.dir * Math.min(4, (T - 1.45) * 20);
        if ((step > 0 && step < 1) && (T < 1.0 || T > 1.65)) key = 'guard'; }
      return { x: px, y: py, key };
    };
    const panel = (S, label) => { const al = alive(S), u = { sword: 0, spear: 0, archer: 0, cata: 0, militia: 0 }; al.forEach(x => u[x.k]++);
      return `<h4>${label} <span class="dim">· ${al.length} of ${S.start}</span></h4>${unitRows(S.owner, u)}<div class="mor"><span class="dim">Morale</span><div class="bar" style="flex:1"><i style="width:${Math.max(0, Math.min(100, S.morale / 14 * 100))}%;background:${S.morale > 8 ? '#8fd16a' : S.morale > 5 ? '#e9b95a' : '#e9675a'}"></i></div><b>${S.morale}</b></div>
        <div class="mor"><span class="dim">Command</span><span class="cmd">${Array.from({ length: 3 }, (_, i) => `<i class="${i < S.command ? '' : 'x'}"></i>`).join('')}</span>${S.garrison ? '<span class="dim" style="font-size:11px">never breaks</span>' : ''}</div>
        ${S.terrain ? '<div class="dim small">+1 for the ground they hold</div>' : ''}${S.wall ? `<div class="dim small">Walls: +${S.wall >= 25 ? 3 : 1} to every roll</div>` : ''}${S.order && beat ? `<div class="ord">${ORDERS[S.lastOrder || S.order].glyph} ${ORDERS[S.lastOrder || S.order].name}</div>` : ''}`; };
    const ui = () => {
      $('btitle').innerHTML = `<div style="font:600 19px var(--pix);color:var(--gold)">${o.title}</div><div class="dim" style="font-size:12px">Beat <b class="gold">${Math.min(6, beat + (result ? 0 : 1))}</b> of 6 · you give one order a beat, then every pair of fighters rolls</div>`;
      $('bA').innerHTML = panel(A, humanA ? '<span style="color:#e8786a">Your host</span>' : pn(A.owner)); $('bD').innerHTML = panel(D, humanA ? (D.owner === 'raider' ? '<span class="neg">Raiders</span>' : pn(D.owner)) : '<span style="color:#e8786a">Your people</span>');
      $('blog').innerHTML = last || `<span class="dim">How a duel works: each of you rolls a die and adds your edge. Swordsmen +2, spearmen +1, bowmen and townsfolk −1, +1 for each spare man helping. The higher total wounds the lower; win by 4 and he goes down. A tie is a parry. Bowmen shoot first each beat.</span>`;
      if (result) { const won = humanA ? (result === 'A' || result === 'D_fell') : (result === 'D' || result === 'A_fell' || result === 'D_hold');
        const txt = { A: humanA ? 'They are broken. The field is yours.' : 'They broke through.', D: humanA ? 'Your host is thrown back.' : 'They break against you.', A_fell: humanA ? 'You fall back.' : 'They fall back.', D_fell: humanA ? 'They flee the field.' : 'You give up the field.', D_hold: humanA ? 'Dusk: the defenders hold.' : 'You hold until they give up.' }[result];
        $('btac').innerHTML = `<div class="bres ${won ? 'w' : 'l'}"><div>${won ? 'Victory' : 'Defeat'}</div><span>${txt}</span><button class="btn big" id="bok">Continue</button></div>`;
        $('bok').onclick = () => { el.style.display = 'none'; UI.inBattle = false; UI.busy = false; UI.battleFrame = null; resolve(result); }; return; }
      if (playing) { $('btac').innerHTML = '<div class="dim" style="padding:10px 16px">…</div>'; return; }
      $('btac').innerHTML = Object.entries(ORDERS).map(([k, O]) => { const ok = orderOK(me, k); const c = k === 'charge' && me.patron === 'storm' ? 0 : O.cost; return `<button class="tc" data-o="${k}" ${ok ? '' : 'disabled'}><b><i>${O.glyph}</i>${O.name}</b>${O.desc}<span class="k">${c ? '● '.repeat(c) + 'command' : 'free'}</span></button>`; }).join('');
      $('btac').querySelectorAll('[data-o]').forEach(b => b.onclick = () => go(b.dataset.o));
    };
    const go = (k) => {
      beat++; me.order = k; payOrder(me, k); them.order = aiOrder(them, me, beat); payOrder(them, them.order);
      for (const S of [A, D]) for (const x of S.f) { x._duel = null; x._hitAt = null; x._diedAt = null; if (!x.alive) x.dead = true; }
      if (A.order === 'fallback' || D.order === 'fallback') { ev = { shots: [], duels: [], morale: [] }; const S = A.order === 'fallback' ? D : A; shoot(S, S === A ? D : A, 1, ev.shots); }
      else ev = fightBeat(A, D, beat);
      for (const s of ev.shots) { const tg = byId(s.side === A ? D : A, s.to); if (s.hit && tg) { tg._hitAt = .6; if (!tg.alive && tg._diedAt == null) { tg._diedAt = .62; tg.dx = tg.hx; tg.dy = tg.hy; } } }
      for (const du of ev.duels) { const a = byId(A, du.a), d = byId(D, du.d); a._duel = du; d._duel = du; const lo = du.loser === 'A' ? a : du.loser === 'D' ? d : null; if (lo && !lo.alive) { lo._diedAt = 1.7; const mx = (a.hx + d.hx) / 2; lo.dx = mx + lo.dir * 10; lo.dy = (a.hy + d.hy) / 2; } }
      const won = ev.duels.filter(du => du.loser === (humanA ? 'D' : 'A')).length, lost = ev.duels.filter(du => du.loser === (humanA ? 'A' : 'D')).length, par = ev.duels.filter(du => du.res === 'parry').length;
      const arrows = ev.shots.filter(s => s.hit && s.side === me).length, arrowsIn = ev.shots.filter(s => s.hit && s.side === them).length;
      const mor = ev.morale.map(m => `<div>${(m.side === 'A') === humanA ? 'Your' : 'Their'} morale check: ${dieHTML(m.roll[0], 1)}${dieHTML(m.roll[1], 0)} <b>${m.roll[0] + m.roll[1]}</b> vs ${m.morale} — ${m.broke ? '<span class="neg">they break!</span>'.replace('they', (m.side === 'A') === humanA ? 'your line' : 'they') : '<span class="pos">holds</span>'}</div>`).join('');
      last = `<h4 style="font-size:12px">Beat ${beat} · <span class="gold">${ORDERS[me.order].name}</span> <span class="dim">vs</span> ${ORDERS[them.order].name}</h4><div>Duels: <span class="pos">${won} won</span> · <span class="neg">${lost} lost</span> · ${par} parried</div><div>Arrows: <span class="pos">${arrows} hit them</span> · <span class="neg">${arrowsIn} hit you</span></div>${mor}`;
      playing = true; t0 = now(); ui();
      const wait = () => { if (now() - t0 < 2.9) { setTimeout(wait, 60); return; } playing = false; for (const S of [A, D]) for (const x of S.f) if (!x.alive) x.dead = true; result = battleEnd(A, D, beat); ui(); }; wait();
    };
    UI.battleFrame = paint; ui();
  });
}
function pixDie(ctx, x, y, n, col, win) { const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n];
  if (win) { ctx.fillStyle = 'rgba(244,214,146,.6)'; ctx.fillRect(x - 1, y - 1, 11, 11); }
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x, y, 9, 9); ctx.fillStyle = '#b8ae9a'; ctx.fillRect(x, y + 8, 9, 1); ctx.fillRect(x + 8, y, 1, 9); ctx.fillStyle = col; ctx.fillRect(x, y, 9, 1);
  ctx.fillStyle = '#2a2018'; P.forEach(([a, b]) => ctx.fillRect(x + 1 + a * 2.5 | 0, y + 1 + b * 2.5 | 0, 2, 2)); }

/* ---------- the other peoples' seasons ---------- */
async function runOthers() {
  UI.busy = true; endTurn(); hud();
  while (G.cur !== 0 && !G.winner) {
    const P = curP(); await sleep(350); aiTurn(P); if (UI.worldChanged) { UI.worldChanged = false; worldLayers(); } hud();
    for (const q of aiArmies(P)) {
      if (!G.armies.includes(q.a)) continue;
      if (q.kind === 'army') { if (!G.armies.includes(q.e)) continue; q.a.from = q.a.tile; q.a.moves = 0; const A = armySide(q.a), D = armySide(q.e, { terrain: terrainBonus(q.e.tile) }); let r;
        if (q.e.owner === 'red') { centerOn(G.tiles[q.e.tile].cx, G.tiles[q.e.tile].cy); UI.toast(`${pn(P.id)} attacks your host!`, 'war'); await sleep(600); r = await battle({ A, D, tile: q.e.tile, title: `${PNAME[P.id]} attacks!` }); UI.busy = true; }
        else { r = autoBattle(A, D); if (player('red').explored.has(q.e.tile)) logMsg(`${pn(P.id)} ${r === 'A' || r === 'D_fell' ? 'beat' : 'was thrown back by'} ${q.e.camp ? 'a raider camp' : pn(q.e.owner) + "'s host"}.`); }
        afterArmyBattle(q.a, q.e, A, D, r); }
      if (q.kind === 'assault') { const v = q.v, A = armySide(q.a), D = hearthSide(v); let r;
        if (v.owner === 'red') { centerOn(v.vx, v.vy); UI.toast(`${pn(P.id)} storms ${v.name}!`, 'war'); await sleep(600); r = await battle({ A, D, vert: v, title: `${PNAME[P.id]} storms ${v.name}` }); UI.busy = true; } else r = autoBattle(A, D);
        afterAssault(q.a, v, A, D, r); }
      hud(); if (checkWinUI()) return; await sleep(200);
    }
    if (checkWinUI()) return; endTurn(); hud();
  }
  for (const R of G.pendingRaid || []) { if (!R.v.owner) continue; const A = makeSide('raider', R.units), D = hearthSide(R.v); let r;
    if (R.v.owner === 'red') { centerOn(R.v.vx, R.v.vy); UI.toast(`Raiders fall on ${R.v.name}!`, 'war'); await sleep(600); r = await battle({ A, D, vert: R.v, title: `Raiders at ${R.v.name}` }); } else r = autoBattle(A, D);
    const s = survivors(A); for (const k of UNITS) R.camp.units[k] += Math.floor((s[k] || 0) * .5); R.camp.rest = 4;
    const fakeArmy = { owner: 'raider', units: { spear: 0, sword: 0, archer: 0, cata: 0 }, moves: 0, tile: R.camp.tile }; G.armies.push(fakeArmy); afterAssault(fakeArmy, R.v, A, D, r); removeArmy(fakeArmy); }
  G.pendingRaid = []; G.players.forEach(trimWorkers);
  UI.busy = false; UI.mode = 'idle'; UI.sel = null; hud(); if (!checkWinUI()) UI.toast(`${SEASONS[G.season]}, year ${G.year}. Your move.`, 'big');
}
function checkWinUI() { const w = checkWin(); if (!w) return false; UI.busy = true; const el = $('win'); el.style.display = '';
  el.innerHTML = `<div class="gl wbox"><div style="font:600 26px var(--pix);color:${LIGHT[w]}">${w === 'red' ? 'Your legend is sung' : PNAME[w] + "'s legend outlives yours"}</div><div class="dim" style="margin:6px 0 12px">Year ${G.year}, ${SEASONS[G.season].toLowerCase()}.</div>${G.players.map(Q => `<div class="pl" style="justify-content:center"><i style="background:${COLS[Q.id]}"></i>${Q.human ? 'You' : PNAME[Q.id]} · ${legend(Q.id)} legend</div>`).join('')}<div style="margin-top:14px"><button class="btn big" id="again">New island</button></div></div>`;
  $('again').onclick = () => { el.style.display = 'none'; location.hash = ''; newGame((Math.random() * 1e6) | 0); }; return true; }
