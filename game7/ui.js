'use strict';
/* ==========================================================================
   CROWN OF THE ISLE v0.7 — the screen. Dice, roads and villages;
   marches, battles and sieges on the world map; up to four players.
   ========================================================================== */
const UI = { cam: { x: 0, y: 0, z: 1 }, mode: 'idle', sel: null, busy: false, scene: null, hover: null };
const $ = id => document.getElementById(id);
const DPR = () => Math.max(1, Math.round(window.devicePixelRatio || 1));
const COLS = { red: '#d9573f', blue: '#4f8fd9', gold: '#e3c04a', violet: '#9b5fd0', green: '#5aa04a', white: '#e4e0d6', raider: '#4e4a48', neutral: '#a69c86' };
const LIGHT = { red: '#e8786a', blue: '#6a9ae8', gold: '#f2cf6a', violet: '#b48cff', green: '#8fd16a', white: '#f4f0e8', raider: '#e9675a', neutral: '#cfc8b6' };
const pn = id => `<b style="color:${LIGHT[id] || '#ddd'}">${youAre(id) ? 'You' : PNM(id) || id}</b>`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let W0 = 1900, H0 = 1600;   // the world's size: larger for five or six lords
// the goods as Civ Sim draws them in a person's bag: a stack of wood, a lump of clay, a fleece, a bound sheaf (ripened to gold), a stone
const CIV_ICON = {"timber": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABRElEQVR4AayRoUsDYRjG37u/wGBYEDEsLcghIibTWBARGQYxGMQksr/gMIh/gCyYxsLSksGwsGgQEZFjYWlhiGHBYDCsnf5eeOXu/D4cbIPnnr3Pvd/D8z0Xypy/xRt044MUzBrMmeD27kkw2amU0v+McgaN/Sh9HIzlvL6t52CMdPA8cga2gwno9BKpHu7JR9LyJskZNO+TIBlN1AfutGP9/9Lvy+7GmtNEDYgJ2H4YToLR+6dE5RKjtG9ayr5HyL3tpZn0XscB2snptaxXVmWzVhPT0LPQBLSOCGNicb+mU2l2n6V+HOtXMZ1dgxoQl9Lg6k9pjaMtuby60GuUV5aUTS8WGlIcd8YRprDB8E1gZpeeTaIJuB+ts1yET7c9NWCgfYwoLFucT+cM+DVgAMvRWUBxMLOB2aX/MeAASeAiXPo3AAAA//+Q3uwTAAAABklEQVQDAIcJpSFWJIaRAAAAAElFTkSuQmCC", "clay": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA2ElEQVR4AeyQvREBURSFHxUoQCQ2ApFIoALxFiBUw9YgVMDGKhCIRIIdkUBgFKCDtd+dOXfumodAyvjc33Ouef304+dvkNLXNziWy+bTO2cNEAnEyonUkY4BC8BCta8JBnl9uSXYFtMGbND+dAza2r4ISBTHw0E63x+0jJi7gS6zUSwmhETkKoVMJF7PR/Y2bsBSBIHE9CUkj7jBrNz1NIhCejkxB5i5AQVEMUKg/8qqOtlBN+Bl+RcavBNuDteermPqBhLSJGcRqImCmjkR3IAiB8JcX70nAAAA//8qk94+AAAABklEQVQDAE8AcSEPWHvsAAAAAElFTkSuQmCC", "wool": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA30lEQVR4AeyQvQ4BQRSF73oEUYhEKFQajdIDaDRKHaV4BKVHUHsEjcYDKDUalYJIRCHbSXRrv0nuZMbObiJamz1zf+ackzu3JD9+fwOR4A5ezzjJw+1yTNy9ZwwQugTN48ddAPVqubAmnoErhnzY7+BbIcV2syZYeAbaRUze6fYKxXCCBuVKVQAEjeSj8VTAZDaPqEHQgNF1Co3X8wm+mchdZMYAQb3ZEt5KblTp4T6Hu7Rlfs9ABS4BFnXenWdQa7QjyIj6gyHBTEJCH5AX7oBLgBkg/wQmCm8CbX4T3wAAAP//gdMo0wAAAAZJREFUAwAzf4QhGNdeXQAAAABJRU5ErkJggg==", "grain": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAnklEQVR4XmNgGGjAiO6AK9vS/z+7exwsLKVsyYDM1vGaiaGeCd0AbIrwAQwDYDYTCzCcBAO7Juv9h7FBXsHlMqwuIMUVOA0gNiyweqErywXufHRQNm0Pih4WbIH14MELbMJYAVGBCAJuuZewqsUaBqAYOHrxE9xGEBs5VpABzkC01ucDayQEMAxAt50QQDEAprlxzgMU/4L4+LxBEQAAQoY703kJXYYAAAAASUVORK5CYII=", "ore": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA3UlEQVR4AeSQIQ7CQBBFp2gEByGBUyAIClVFOAWiWMI5CII0CIJoKggCVUEQbUJQCE5C6Z/kl2nZYpA0+bt/Z+f9dKclP37/FBBFp5wKgmXO0TlncIjC3AoggSRJ1A6HYw2pBBDSDscCOE0vAvG6DADMot3T7Cq37CiEeRfHOw++DMCBWq1DtYDVFMvjfpZO+6kiXJTFGTCd+MIQNNkgnK2cAQD6va72watpWD4CLGB9A/9+wmDkexaw3sKb7V6Hx1rlD2bzhQe5YIAQQe6VABbRWBfv6rszoN707fwCAAD//5hbYPwAAAAGSURBVAMAFrdyIVJhgJIAAAAASUVORK5CYII="};
const ICON_URL = {}; const icon = (k, sc) => `<img class="ri" src="${ICON_URL[k + (sc || 3)]}">`;
const costHTML = c => Object.entries(c).map(([k, v]) => Array.from({ length: v }, () => icon(k, 3)).join('')).join('');

/* ---------- boot ---------- */
async function boot() {
  await document.fonts.ready; const all = []; const walk = o => { if (!o || typeof o !== 'object') return; if (o.u) { all.push(o); return; } for (const k in o) walk(o[k]); };
  for (const S of [SPRITES, SPRITES2, SPRITES3, FOLK, CFX, XTRA]) walk(S);
  await Promise.all(all.map(s => new Promise(res => { const i = new Image(); i.onload = () => { s.img = i; res(); }; i.onerror = res; i.src = s.u; }))); fixAnchors();
  newTribes();
  RES.forEach(k => { ICON_URL[k + 3] = ICON_URL[k + 4] = CIV_ICON[k]; });
  UI.cata = cataSprite(); bindInput(); fsInstall(); addEventListener('resize', fit);
  requestAnimationFrame(loop); document.body.classList.remove('booting'); lobbyOpen();
}
// the living backdrop of Crown's menu page: a computer-only isle, a few rounds in, with the camera drifting over it
function demoWorld() { if (UI.demo || UI.booting || (G.lords && !UI.demo)) return; UI.demo = true; document.body.classList.add('demo');
  const toast0 = UI.toast; UI.toast = () => {};
  try { applyColours(null); setupGame(31337 + ((Math.random() * 50) | 0), [], ['red', 'blue', 'gold', 'violet']); gameOptions({ chset: [] }); G.win = 99; G.names = {}; G.cols = {}; W0 = G.world.W; H0 = G.world.H;
    while (G.phase === 'setup') { const L = curL(); setupVillage(L, aiSetupVillage(L)); setupRoad(L, aiSetupRoad(L)); }
    for (let n = 0; n < 44; n++) { if (n) nextLord(); const L = curL(); if (!L.alive) continue; rollDice(); if (G.phase === 'robber') { const B = robberOf(); moveRobber(B, aiRobber(B)); } aiCards(L); if (G.phase === 'robber') moveRobber(L, aiRobber(L)); aiBuild(L); }
    G.dice = null; G.phase = 'roll'; UI.borders = null; UI.live = []; UI.sel = null; UI.mode = 'idle'; UI.scene = null; CQ.q = []; CQ.running = false;
    UI.static = G.world.render(); buildRoads(); buildMini(); makeFlocks(); fit(); UI.cam.z = 1; UI.camGoal = null; UI.demoT = performance.now(); landChanged(); }
  catch (e) { UI.demo = false; document.body.classList.remove('demo'); console.log('demo', e); }
  UI.toast = toast0; }
function demoPan() { const t = (performance.now() - UI.demoT) / 1000, w = G.world, cv = $('cv'); UI.cam.z = 1; UI.camGoal = null;
  // whole pixels go to the camera; the fraction left over slides the canvas itself, so the drift is smooth instead of stepping a pixel at a time
  const x = w.CX + Math.sin(t * .05) * w.W * .15 - innerWidth / 2, y = w.CY + Math.sin(t * .037 + 1) * w.H * .14 - innerHeight / 2;
  UI.cam.x = Math.floor(x); UI.cam.y = Math.floor(y); cv.style.transform = `translate3d(${-(x - UI.cam.x)}px,${-(y - UI.cam.y)}px,0) scale(1.002)`; cv.style.transformOrigin = '0 0'; }
function startGame(seed, humans, seats, resume, opts) {   // resume: { snap, n, seq, gid } to carry on a saved game, or to rejoin one
  UI.demo = false; document.body.classList.remove('demo'); $('cv').style.transform = ''; $('lobby').style.display = 'none'; document.body.classList.add('booting'); UI.net = !!NET.role; if (!resume) UI.lastStart = [humans, seats, opts]; UI.booting = true; CQ.hold = [];
  setTimeout(() => { UI.chT0 = null; applyColours(opts && opts.cols); setupGame(seed, humans, seats); G.cols = Object.assign({}, (opts && opts.cols) || {}); gameOptions(opts); G.seed = seed; G.win = (opts && opts.win) || WIN; G.names = Object.assign({}, (opts && opts.names) || {}); W0 = G.world.W; H0 = G.world.H; UI.borders = null; CQ.q = []; CQ.done = 0; CQ.running = false; UI.live = []; UI.view = null; UI.lastViewer = null; UI.shownWin = null;
    UI.static = G.world.render(); buildRoads(); buildMini(); makeFlocks(); fit(); UI.cam.z = 1; centerOn(G.world.CX, G.world.CY);
    document.body.classList.remove('booting'); $('toasts').innerHTML = ''; $('win').style.display = 'none'; $('trade').style.display = 'none'; UI.sel = null; UI.mode = 'idle'; UI.scene = null; $('battle').style.display = 'none';
    if (resume) { loadSnapshot(resume.snap); CQ.done = resume.n || 0; NET.seq = resume.seq || CQ.done; G.gid = resume.gid; }
    else { G.gid = 'g' + Date.now().toString(36) + ((Math.random() * 1e4) | 0); NET.seq = 0; }
    hud(); if (resume) UI.toast(`The game carries on: round <b>${G.round}</b>, ${pn(curL().id)}${youAre(curL().id) ? 'r' : "'s"} turn.${UI.net ? ' You play <b style="color:' + LIGHT[NET.seat] + '">' + PNM(NET.seat) + '</b>.' : ''}`, 'big');
    else UI.toast(`Each lord places two villages, each with a road; your host musters at your first. <b>${winPts()} points</b> wins, or be the last lord standing.${UI.net ? ' You play <b style="color:' + LIGHT[NET.seat] + '">' + PNM(NET.seat) + '</b>.' : ''}`, 'big');
    UI.booting = false; const held = CQ.hold; CQ.hold = []; held.forEach(enqueue);
    if (!UI.net || NET.role === 'host') send({ type: 'begin' }); }, 30);
}
function fit() { const cv = $('cv'), d = DPR(); cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; if (G.world) clampCam(); }
function clampCam() { const c = UI.cam, vw = innerWidth / c.z, vh = innerHeight / c.z; c.x = Math.round(vw > W0 + 400 ? (W0 - vw) / 2 : Math.max(-200, Math.min(W0 - vw + 200, c.x))); c.y = Math.round(vh > H0 + 400 ? (H0 - vh) / 2 : Math.max(-200, Math.min(H0 - vh + 200, c.y))); }
// zoom steps: the whole isle, normal, close
const zFar = () => Math.min(.75, Math.min(innerWidth / (W0 * 1.04), innerHeight / (H0 * 1.04)));
const zLevels = () => [zFar(), 1, 2];
function centerOn(x, y) { UI.cam.x = x - innerWidth / UI.cam.z / 2; UI.cam.y = y - innerHeight / UI.cam.z / 2; clampCam(); }
function panTo(x, y, z) { UI.camGoal = { x, y, z: z || UI.cam.z }; }
const toWorld = (sx, sy) => [sx / UI.cam.z + UI.cam.x, sy / UI.cam.z + UI.cam.y];
const toScreen = (x, y) => [(x - UI.cam.x) * UI.cam.z, (y - UI.cam.y) * UI.cam.z];
const VX = vi => [G.verts[vi].vx, G.verts[vi].vy];
const homeOf = id => { const c = settlements(id)[0] || G.verts[0]; return [c.vx, c.vy]; };

/* ---------- the fifth and sixth lords: Civ Sim draws four peoples' colours; green and white are
   made from red's sprites, recolouring just the pixels where red and blue's drawings differ ---------- */
const NEWT = { green: { h: 105, s: 1, l: 0 }, white: { h: 40, s: .1, l: .3 } };
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; }
function hsl2rgb(h, s, l) { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0) * 255, f(8) * 255, f(4) * 255].map(Math.round); }
let _rc = 0;
function recolour(sr, sb, T) { if (!sr || !sr.img) return sr; const w = sr.img.width, h = sr.img.height, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(sr.img, 0, 0); const D = g.getImageData(0, 0, w, h);
  let B = null; if (sb && sb.img && sb.img.width === w && sb.img.height === h) { const cb = document.createElement('canvas'); cb.width = w; cb.height = h; const gb = cb.getContext('2d'); gb.drawImage(sb.img, 0, 0); B = gb.getImageData(0, 0, w, h).data; }
  const d = D.data; for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const [hh, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
    const team = B ? (Math.abs(d[i] - B[i]) + Math.abs(d[i + 1] - B[i + 1]) + Math.abs(d[i + 2] - B[i + 2]) > 30) : (s > .35 && (hh < 25 || hh > 340));
    if (!team) continue; const [r, gg, bb] = hsl2rgb(T.h, Math.min(1, s * T.s), Math.min(.97, l + T.l * (1 - l))); d[i] = r; d[i + 1] = gg; d[i + 2] = bb; }
  g.putImageData(D, 0, 0); return Object.assign({}, sr, { img: c, u: 'gen' + (++_rc) }); }
function mirror(R, Bl, T) { if (!R || typeof R !== 'object') return R; if (R.img || R.u) return recolour(R, Bl, T); if (Array.isArray(R)) return R.map((x, i) => mirror(x, Bl && Bl[i], T)); const o = {}; for (const k in R) o[k] = mirror(R[k], Bl && Bl[k], T); return o; }
/* ---------- lord colours: any seat can wear any of twelve; the four hand-drawn sets are used as they are, the rest are dyed from Red ---------- */
const PALETTE = [
  { k: 'crimson', name: 'Crimson', src: 'red', c: '#d9573f', l: '#e8786a' }, { k: 'azure', name: 'Azure', src: 'blue', c: '#4f8fd9', l: '#6a9ae8' },
  { k: 'gold', name: 'Gold', src: 'gold', c: '#e3c04a', l: '#f2cf6a' }, { k: 'violet', name: 'Violet', src: 'violet', c: '#9b5fd0', l: '#b48cff' },
  { k: 'moss', name: 'Moss', T: { h: 105, s: 1, l: 0 }, c: '#5aa04a', l: '#8fd16a' }, { k: 'bone', name: 'Bone', T: { h: 40, s: .1, l: .3 }, c: '#e4e0d6', l: '#f4f0e8' },
  { k: 'amber', name: 'Amber', T: { h: 28, s: 1, l: .05 }, c: '#e08a32', l: '#f0a860' }, { k: 'teal', name: 'Teal', T: { h: 172, s: .9, l: 0 }, c: '#2fa59a', l: '#5cc9bd' },
  { k: 'rose', name: 'Rose', T: { h: 328, s: .8, l: .18 }, c: '#d96aa0', l: '#ec94bd' }, { k: 'slate', name: 'Slate', T: { h: 215, s: .25, l: 0 }, c: '#5b6577', l: '#97a1b5' },
  { k: 'umber', name: 'Umber', T: { h: 24, s: .5, l: 0 }, c: '#8a5a36', l: '#b98a62' }, { k: 'ice', name: 'Ice', T: { h: 192, s: .7, l: .38 }, c: '#9fd3e6', l: '#c4e6f2' }];
const SEAT_COL = { red: 'crimson', blue: 'azure', gold: 'gold', violet: 'violet', green: 'moss', white: 'bone' };
const palOf = k => PALETTE.find(P => P.k === k) || PALETTE[0];
let ORIGS = null;
function applyColours(cols) { if (typeof SPRITES3 === 'undefined') return; if (!ORIGS) { ORIGS = { F: {}, C: {}, fig: {}, bld: {} }; for (const p of ['red', 'blue', 'gold', 'violet']) { ORIGS.F[p] = FOLK[p]; ORIGS.C[p] = CFX[p]; ORIGS.fig[p] = SPRITES3.fig[p]; ORIGS.bld[p] = SPRITES3.bld.filter(b => b.p === p); } }
  UI.colNow = UI.colNow || {};
  for (const id of LORDS) { const P = palOf((cols && cols[id]) || SEAT_COL[id]); if (UI.colNow[id] === P.k) continue; UI.colNow[id] = P.k;
    COLS[id] = TCOL[id] = P.c; LIGHT[id] = P.l; PNAME[id] = P.name; delete CROFT[id];
    let B; if (P.src) { FOLK[id] = ORIGS.F[P.src]; CFX[id] = ORIGS.C[P.src]; SPRITES3.fig[id] = ORIGS.fig[P.src]; B = ORIGS.bld[P.src].map(b => Object.assign({}, b, { p: id })); }
    else { FOLK[id] = mirror(ORIGS.F.red, ORIGS.F.blue, P.T); CFX[id] = mirror(ORIGS.C.red, ORIGS.C.blue, P.T); SPRITES3.fig[id] = mirror(ORIGS.fig.red, ORIGS.fig.blue, P.T); B = ORIGS.bld.red.map(b => Object.assign(recolour(b, ORIGS.bld.blue.find(x => x.k === b.k), P.T), { p: id })); }
    SPRITES3.bld = SPRITES3.bld.filter(b => b.p !== id).concat(B); } }
function newTribes() { for (const [id, T] of Object.entries(NEWT)) {
  FOLK[id] = mirror(FOLK.red, FOLK.blue, T); CFX[id] = mirror(CFX.red, CFX.blue, T); SPRITES3.fig[id] = mirror(SPRITES3.fig.red, SPRITES3.fig.blue, T);
  for (const b of SPRITES3.bld.filter(b => b.p === 'red')) SPRITES3.bld.push(Object.assign(recolour(b, SPRITES3.bld.find(x => x.p === 'blue' && x.k === b.k), T), { p: id })); } }

/* ---------- static layers ---------- */
const RDC = { STONE: ['#57514c', '#6e6862', '#8a837b', '#a39c93'], joint: '#5c5650', kerbD: '#7a736a', p3: '#9a9288', g2: '#776d5e', g4: '#9a8f7c', EARTH: ['#6c543a', '#7d6345', '#8f7350'] };
const rfr = v => v - Math.floor(v);
function segQ(ax, ay, bx, by, s0, qx, qy) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, ll = Math.sqrt(l2); let t = ((qx - ax) * dx + (qy - ay) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const cx = ax + dx * t, cy = ay + dy * t; return { d: Math.hypot(qx - cx, qy - cy), o: ((qx - ax) * dy - (qy - ay) * dx) / ll, s: s0 + t * ll }; }
// each lord's kerb stones: their colour in four shades (dark joint, shade, face, lit top)
const PAINT = {}; const paintOf = o => PAINT[o] || (PAINT[o] = { joint: mixHex(COLS[o], '#2a2622', .62), kerb: mixHex(COLS[o], '#3a3530', .5), s: [mixHex(COLS[o], '#6e6862', .45), mixHex(COLS[o], '#a39c93', .42), mixHex(COLS[o], '#e8e2d8', .38)] });
function mixHex(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
// Civ Sim roadPx, tier 4: grey paving in a ragged band of trodden earth; the owner's colour in pairs of thin bands every few metres
const ROAD_BAND = { every: 22, width: 2.6, gap: 2 };
const BANDC = {}; const bandOf = o => BANDC[o] || (BANDC[o] = [mixHex(COLS[o], '#2a2622', .45), mixHex(COLS[o], '#6e6862', .25), mixHex(COLS[o], '#b8b0a4', .3)]);
function pavePx(q, X, Y, pass, owner) {
  const { d, o, s } = q, hw = 5.6, e = d - hw + (vnoise(X / 3, Y / 3, 23) - .5) * 1.4;
  if (e > 0) { if (pass !== 0) return null; const mw = 2 + vnoise(s / 8, 4, 21) * 3.4; if (e > mw) return null; const f = 1 - e / mw; if (hash(X, Y, 25) * .35 + vnoise(X / 4, Y / 4, 27) * .65 > f + .12) return null;
    if (hash(X, Y, 29) < .08 * f) return hash(X, Y, 30) < .5 ? RDC.g2 : RDC.g4; return tone(RDC.EARTH, vnoise(X / 2, Y / 2, 9), X, Y); }
  if (pass !== 1) return null;
  const B = ROAD_BAND, ph = ((s + 6) % B.every + B.every) % B.every;
  if (ph < B.width || (ph >= B.width + B.gap && ph < B.width * 2 + B.gap)) {   // paint, dithered in the owner's ramp and scuffed by feet and wheels
    const edge = ph < .9 || ph > B.width * 2 + B.gap - .9 || (ph > B.width - .9 && ph < B.width + B.gap + .9), worn = hash(X, Y, 61) < .16 || vnoise(X / 2, Y / 2, 63) > .72;
    if (!worn) return tone(bandOf(owner), vnoise(X / 2.5, Y / 2.5, 65) * .7 + (edge ? -.25 : .1) + (o < 0 ? .1 : -.1), X, Y); }
  if (hash(X, Y, 35) < (e > -1.5 ? .22 : .03) || (vnoise(X / 6, Y / 6, 33) > .8 && hash(X, Y, 34) < .6)) return tone(RDC.EARTH, vnoise(X / 2, Y / 2, 9), X, Y);
  if (e > -1) return rfr(s / 5) < .12 ? RDC.joint : RDC.kerbD;
  const v = (o + hw) / 3.2, row = Math.floor(v), u = s / 4.2 + row * .5;
  if (rfr(u) < .16 || rfr(v) < .2) return RDC.joint;
  const k = hash(Math.floor(u), row, 13); return k < .33 ? RDC.STONE[1] : k < .75 ? RDC.STONE[2] : RDC.p3; }
function buildRoads() {
  const c = UI.roads || (UI.roads = document.createElement('canvas')); c.width = W0; c.height = H0; const ctx = c.getContext('2d'); ctx.clearRect(0, 0, W0, H0);
  const segs = G.edges.filter(e => e.owner).map(e => { const A = G.verts[e.a], B = G.verts[e.b]; return [A.vx, A.vy, B.vx, B.vy, e]; });
  for (const pass of [0, 1]) for (const [ax, ay, bx, by, e] of segs) { const R = 12;
    for (let y = Math.floor(Math.min(ay, by) - R); y <= Math.max(ay, by) + R; y++) for (let x = Math.floor(Math.min(ax, bx) - R); x <= Math.max(ax, bx) + R; x++) {
      const q = segQ(ax, ay, bx, by, 0, x + .5, y + .5); if (q.d > R) continue; const col = pavePx(q, x, y, pass, e.owner); if (!col) continue; ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); } }
  if (UI.roadCol) for (const [ax, ay, bx, by, e] of segs) { const ll = Math.hypot(bx - ax, by - ay), c = COLS[e.owner];
    for (let y = Math.floor(Math.min(ay, by) - 4); y <= Math.max(ay, by) + 4; y++) for (let x = Math.floor(Math.min(ax, bx) - 4); x <= Math.max(ax, bx) + 4; x++) { const q = segQ(ax, ay, bx, by, 0, x + .5, y + .5); if (q.s < 13 || q.s > ll - 13 || q.d > 2.6) continue; ctx.fillStyle = q.d > 1.6 ? 'rgba(20,12,6,.75)' : c; ctx.fillRect(x, y, 1, 1); } }
  for (const [ax, ay, bx, by, e] of segs) { const n = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / n, ny = (bx - ax) / n, sd = ny < 0 ? -1 : 1; const x = Math.round(ax + (bx - ax) * .5 + nx * 10 * sd), y = Math.round(ay + (by - ay) * .5 + ny * 10 * sd);
    ctx.fillStyle = 'rgba(15,10,5,.3)'; ctx.fillRect(x - 1, y, 4, 1); ctx.fillStyle = '#4a3220'; ctx.fillRect(x, y - 11, 1, 12); ctx.fillStyle = COLS[e.owner]; ctx.fillRect(x + 1, y - 11, 5, 4); ctx.fillRect(x + 1, y - 7, 3, 1); }
}
// trees and stones standing where a road or a house now goes are cleared away, and the land redrawn
function clearGround() { const w = G.world, segs = G.edges.filter(e => e.owner).map(e => [G.verts[e.a], G.verts[e.b]]), homes = G.verts.filter(v => v.owner); const before = w.items.length;
  w.items = w.items.filter(it => { if (it.banner) return true; const x = it.x, y = it.y; for (const v of homes) if (Math.hypot(x - v.vx, (y - v.vy) * 1.3) < (v.level === 2 ? 40 : 30)) return false; for (const [A, B] of segs) if (segQ(A.vx, A.vy, B.vx, B.vy, 0, x, y).d < 11) return false; return true; });
  if (w.items.length !== before) UI.static = w.render(); }
function isleChanged() { if (typeof UI === 'undefined' || !UI.static) return; UI.static = G.world.render(); UI.occ = null; UI.borders = null; buildRoads(); buildMini(); makeFlocks(); clearGround(); UI.ver++; }
function landChanged() { clearGround(); buildRoads(); UI.ver++; }
function buildMini() { const m = $('mini'), w = G.world; m.width = 440; m.height = Math.round(440 * H0 / W0); const b = UI.miniBase || (UI.miniBase = document.createElement('canvas')); b.width = m.width; b.height = m.height; const g = b.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(w.ground, 0, 0, w.cw, w.ch, 0, 0, m.width, m.height); }
function drawMini() {
  const m = $('mini'), g = m.getContext('2d'), k = m.width / W0; g.drawImage(UI.miniBase, 0, 0);
  for (const e of G.edges) if (e.owner) { const A = G.verts[e.a], B = G.verts[e.b]; g.strokeStyle = COLS[e.owner]; g.lineWidth = 2; g.beginPath(); g.moveTo(A.vx * k, A.vy * k); g.lineTo(B.vx * k, B.vy * k); g.stroke(); }
  for (const e of G.edges) if (e.wo && e.whp > 0) { const A = G.verts[e.a], B = G.verts[e.b]; g.strokeStyle = '#d8d0c2'; g.lineWidth = 1.5; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(A.vx * k, A.vy * k - 2); g.lineTo(B.vx * k, B.vy * k - 2); g.stroke(); g.setLineDash([]); }
  for (const v of G.verts) if (v.owner) { const r = v.level === 2 ? 5 : 3.5; g.fillStyle = '#140e0a'; g.fillRect(v.vx * k - r - 1, v.vy * k - r - 1, r * 2 + 2, r * 2 + 2); g.fillStyle = COLS[v.owner]; g.fillRect(v.vx * k - r, v.vy * k - r, r * 2, r * 2); }
  for (const L of G.lords) if (L.alive && L.army.v >= 0) { const [x, y] = armyPos(L); g.fillStyle = COLS[L.id]; g.beginPath(); g.arc(x * k, y * k, 6, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
  const t = G.tiles[G.robber]; g.fillStyle = '#140e0a'; g.beginPath(); g.arc(t.cx * k, t.cy * k, 5, 0, 7); g.fill();
  g.strokeStyle = '#f4d692'; g.lineWidth = 2; g.strokeRect(UI.cam.x * k, UI.cam.y * k, innerWidth / UI.cam.z * k, innerHeight / UI.cam.z * k);
}

/* ---------- sprites ---------- */
let CTX = null;
function spr(s, x, y, flip) { const ctx = CTX; if (!s || !s.img) return; x = Math.round(x); y = Math.round(y); if (flip) { ctx.save(); ctx.translate(x * 2 + 1, 0); ctx.scale(-1, 1); ctx.drawImage(s.img, x + s.ox, y + s.oy); ctx.restore(); } else ctx.drawImage(s.img, x + s.ox, y + s.oy); }
function shadow(x, y, r) { const ctx = CTX; ctx.fillStyle = 'rgba(10,20,8,.28)'; for (let k = -r; k <= r; k++) { const hh = Math.round(Math.sqrt(1 - (k / (r + .5)) ** 2) * r * .3); ctx.fillRect(Math.round(x) + k, Math.round(y) - hh + 1, 1, hh * 2 + 1); } }
function banner(X, Y, c, tall) { const ctx = CTX; X = Math.round(X); Y = Math.round(Y); const t = performance.now() / 1000, h = tall ? 40 : 30; ctx.fillStyle = 'rgba(15,10,5,.3)'; ctx.fillRect(X - 2, Y, 6, 2); ctx.fillStyle = '#3a2616'; ctx.fillRect(X, Y - h, 1, h + 1); ctx.fillStyle = '#5a3e26'; ctx.fillRect(X + 1, Y - h, 1, h + 1);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 11 - (j > 6 ? (j - 6) * 3 : 0); i++) { ctx.fillStyle = (bay(i, j) < .3 && j > 4) ? 'rgba(0,0,0,.2)' : c; ctx.fillRect(X + 2 + i, Y - h + j + Math.round(Math.sin(i * .6 + t * 4) * .8), 1, 1); } }
const folkF = (o, who, act, f) => { const L = FOLK[o][who % FOLK[o].length][act]; return L[((f % L.length) + L.length) % L.length]; };
const figSpr = (o, u, pose, who) => { const L = SPRITES3.fig[o][u]; const m = L.filter(f => f.pose === pose); return (m.length ? m : L)[who % (m.length || L.length)]; };
function palisade(x, y, rx, ry, half, wall) { const ctx = CTX; for (let a = 0; a < 70; a++) { const an = a / 70 * Math.PI * 2, sy = Math.sin(an); if ((half === 'back') !== (sy < 0)) continue; if (wall < 75 && a % 9 === 4) continue; if (wall < 50 && a % 5 === 2) continue; if (wall < 25 && a % 3 === 0) continue; const px = Math.round(x + Math.cos(an) * rx), py = Math.round(y + sy * ry), h = 9 + (a % 3 === 0 ? 2 : 0); ctx.fillStyle = a % 2 ? '#6e6862' : '#8a837b'; ctx.fillRect(px, py - h, 2, h); ctx.fillStyle = '#c8c0b2'; ctx.fillRect(px, py - h, 2, 1); } }
function smoke(x, y, seed) { const t = performance.now() / 1000; for (let k = 0; k < 5; k++) { const u = ((t * .3 + k / 5 + seed * .17) % 1); CTX.fillStyle = `rgba(210,205,195,${.35 * (1 - u)})`; CTX.fillRect(Math.round(x + Math.sin(u * 6 + seed) * 3 + u * 9), Math.round(y - u * 30), 2 + Math.round(u * 2), 2 + Math.round(u * 2)); } }
/* ---------- walls on the borders: the grey stakes of the old ring palisades, run edge to edge ---------- */
const PAL = { a: '#d6d0c2', b: '#efeadf', cap: '#ffffff', foot: 'rgba(15,10,5,.45)' };
/* the ring of stakes round a walled settlement; walls run right up to it and join it at a post */
const hasRing = v => ringed(v);
const ringDims = v => v.level === 2 ? [50, 21] : [38, 17];
function ringReach(v, tx, ty) { const [rx, ry] = ringDims(v), a = (tx / rx) ** 2 + (ty / ry) ** 2, b = -8 * ty / (ry * ry), c = 16 / (ry * ry) - 1; return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a); }
function stakePost(ctx, x, y, h) { x = Math.round(x); y = Math.round(y); ctx.fillStyle = PAL.foot; ctx.fillRect(x - 1, y + 1, 5, 1); ctx.fillStyle = PAL.a; ctx.fillRect(x - 1, y - h, 2, h); ctx.fillStyle = PAL.b; ctx.fillRect(x + 1, y - h, 2, h); ctx.fillStyle = PAL.cap; ctx.fillRect(x - 1, y - h - 1, 4, 1); }
function drawRing(v, half) { if (!hasRing(v)) return; const ctx = CTX, x = v.vx, y = v.vy + 4, [rx, ry] = ringDims(v), max = ringMax(v), N = Math.round(Math.PI * (rx + ry) / 2);
  const dirOf = e => { const o = G.verts[e.a === v.id ? e.b : e.a]; return Math.atan2((o.vy - v.vy - 4) / ry, (o.vx - v.vx) / rx); };
  const sides = v.edges.map(i => G.edges[i]).map(e => ({ e, g: dirOf(e), hp: sideHp(v, e), gate: e.owner === v.owner && e.wo !== v.owner }));
  const dAng = (a, g) => Math.abs(((a - g + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  for (let a = 0; a < N; a++) { const an = a / N * Math.PI * 2, sy = Math.sin(an); if ((half === 'back') !== (sy < 0)) continue;
    const sd = sides.reduce((b, s) => dAng(an, s.g) < dAng(an, b.g) ? s : b, sides[0]); if (!sd) continue; const hp = sd.hp;
    if (sd.gate && hp > 0 && dAng(an, sd.g) < .2) continue; if (hp <= 0 && dAng(an, sd.g) < .5) continue;
    if (hp > 0 && hp < max && (a % 5 === 2 || a % 9 === 4)) continue; if (hp <= 0 && a % 3) continue;
    const X = Math.round(x + Math.cos(an) * rx), Y = Math.round(y + sy * ry), h = hp <= 0 ? 3 : 9 + (a % 3 === 0 ? 2 : 0);
    ctx.fillStyle = PAL.foot; ctx.fillRect(X, Y + 1, 2, 1); ctx.fillStyle = a % 2 ? PAL.a : PAL.b; ctx.fillRect(X, Y - h, 2, h); ctx.fillStyle = PAL.cap; ctx.fillRect(X, Y - h, 2, 1); }
  for (const sd of sides) if (sd.gate && sd.hp > 0) for (const s of [-.21, .21]) { const an = sd.g + s; if ((half === 'back') !== (Math.sin(an) < 0)) continue; stakePost(ctx, x + Math.cos(an) * rx, y + Math.sin(an) * ry, 16); } }
function drawWall(e) { const ctx = CTX, A = G.verts[e.a], B = G.verts[e.b], ax = A.vx, ay = A.vy, bx = B.vx, by = B.vy, L = Math.hypot(bx - ax, by - ay), tx = (bx - ax) / L, ty = (by - ay) / L, gate = e.owner === e.wo, dmg = e.whp === 1 ? 2 : 0, breach = e.whp <= 0;
  const s0 = hasRing(A) ? ringReach(A, tx, ty) : 9, s1 = hasRing(B) ? L - ringReach(B, -tx, -ty) : L - 9;
  for (const [s, R] of [[s0, A], [s1, B]]) if (hasRing(R)) stakePost(ctx, ax + tx * s, ay + ty * s, 13);
  for (let s = s0 + 2, a = 0; s < s1 - 1; s += 2, a++) { const fr = s / L; if (gate && fr > .36 && fr < .64) continue; if (breach && fr > .38 && fr < .66) continue; if (dmg >= 1 && a % 9 === 4) continue; if (dmg >= 2 && a % 5 === 2) continue;
    const x = Math.round(ax + tx * s), y = Math.round(ay + ty * s), h = 9 + (a % 3 === 0 ? 2 : 0); ctx.fillStyle = PAL.foot; ctx.fillRect(x, y + 1, 2, 1); ctx.fillStyle = a % 2 ? PAL.a : PAL.b; ctx.fillRect(x, y - h, 2, h); ctx.fillStyle = PAL.cap; ctx.fillRect(x, y - h, 2, 1); }
  const mx = ax + tx * L / 2, my = ay + ty * L / 2;
  if (gate) { const P = [-9, 9].map(k => [Math.round(mx + tx * k), Math.round(my + ty * k)]);
    for (const [x, y] of P) { ctx.fillStyle = PAL.foot; ctx.fillRect(x - 1, y + 1, 5, 1); ctx.fillStyle = PAL.a; ctx.fillRect(x - 1, y - 17, 2, 17); ctx.fillStyle = PAL.b; ctx.fillRect(x + 1, y - 17, 2, 17); ctx.fillStyle = PAL.cap; ctx.fillRect(x - 1, y - 18, 4, 1); }
    if (!breach) { for (let k = 0; k <= 20; k++) { const x = Math.round(P[0][0] + (P[1][0] - P[0][0]) * k / 20), y = Math.round(P[0][1] + (P[1][1] - P[0][1]) * k / 20); ctx.fillStyle = PAL.a; ctx.fillRect(x, y - 16, 1, 2); ctx.fillStyle = PAL.cap; ctx.fillRect(x, y - 17, 1, 1); }
      ctx.fillStyle = '#4a3220'; ctx.fillRect(Math.round(mx), Math.round(my) - 30, 1, 14); ctx.fillStyle = COLS[e.wo]; ctx.fillRect(Math.round(mx) + 1, Math.round(my) - 30, 6, 4); } }
  if (breach) for (let k = 0; k < 16; k++) { const s = (hash(k, e.id, 5) - .5) * 22, x = Math.round(mx + tx * s + (hash(k, 3, e.id) - .5) * 6), y = Math.round(my + ty * s + (hash(k, 2, e.id) - .5) * 6); ctx.fillStyle = k % 2 ? PAL.a : PAL.b; ctx.fillRect(x, y, 4, 2); ctx.fillStyle = PAL.cap; ctx.fillRect(x, y, 4, 1); }
  else if (!gate) { ctx.fillStyle = COLS[e.wo]; ctx.fillRect(Math.round(mx), Math.round(my) - 11, 2, 2); } }
/* ---------- the croft: the village home — a trullo's whitewashed drum on the tower's fieldstone footing, under a cone of the town's own thatch,
   with the tent's poles crossed at the peak and its stitched, painted band in the lord's colour ---------- */
const makeCroft = (() => {
const RP = { white: ['#8d877b', '#a39d90', '#bab3a5', '#cfc9bb', '#ddd7c9'], stone: ['#3a3631', '#46423c', '#5e5951', '#787268', '#928b7f'],
  thatch: ['#3e3420', '#4f4228', '#65542f', '#74633a', '#7e6c3f', '#8e7b4a', '#a08c58'], slate: ['#2f2d29', '#3e3c37', '#504d48', '#605d56', '#6e6a62', '#77746d', '#8a877f'],
  hide: ['#302519', '#453524', '#5a452f', '#70563a', '#9a7650'], pole: ['#2a1d12', '#4a3220', '#6c4a2c'], door: '#22170e', frame: ['#3a2818', '#5a3e24'] };
const pick = (P, v) => P[Math.max(0, Math.min(P.length - 1, Math.floor(v * P.length)))];
const hsh = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function makeCroft(col, style = {}) {
  const drum = style.drum || 'white', roof = style.roof || 'thatch', W = 54, Hh = 64, cx = 27, by = 57;
  const rx = style.rx || 15, ry = rx * .46, h = style.h || 12, R = rx + (style.over || 4), Rry = R * .46, Hc = style.hc || 30, y0 = by - h + (style.drop || 0);
  const c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d'), px = (x, y, f) => { g.fillStyle = f; g.fillRect(x, y, 1, 1); };
  // ground: a trodden ring and a soft shadow on the east side
  for (let x = -rx - 5; x <= rx + 7; x++) for (let y = -4; y <= 4; y++) { if ((x / (rx + 6)) ** 2 + (y / (ry + 2.5)) ** 2 > 1) continue; if (x < -rx + 4 && hsh(x, y, 1) < .6) continue; g.fillStyle = `rgba(20,14,6,${x > 0 ? .3 : .14})`; g.fillRect(cx + x, by + y, 1, 1); }
  // the drum
  for (let x = -rx; x <= rx; x++) { const u = x / rx, yb = Math.round(by + ry * Math.sqrt(1 - u * u)), yt = yb - h, lit = .78 - .62 * (u + 1) / 2;
    for (let y = yt; y <= yb; y++) { const fromB = yb - y; let f;
      if (drum === 'stone' || fromB < 3) { const row = Math.floor(fromB / 3), brick = (Math.floor((x + 40 + row * 2) / 4)), seam = fromB % 3 === 0 || (x + 40 + row * 2) % 4 === 0; f = seam ? RP.stone[0] : pick(RP.stone, lit * .8 + .2 * hsh(brick, row, 3)); }
      else f = pick(RP.white, lit + (hsh(x, y, 4) - .5) * .12);
      px(cx + x, y, f); } }
  // a shadow under the eaves
  for (let x = -rx; x <= rx; x++) { const u = x / rx, yt = Math.round(by + ry * Math.sqrt(1 - u * u)) - h; const ye = Math.round(y0 + Rry * Math.sqrt(Math.max(0, 1 - (x / R) ** 2))); for (let k = 0; k < 2; k++) px(cx + x, Math.max(yt, ye) + k, k ? 'rgba(30,20,10,.35)' : 'rgba(30,20,10,.6)'); }
  // the door, framed in timber, on the south-west of the drum
  const dx0 = -4, dh = style.door || 8; for (let x = dx0; x <= dx0 + 5; x++) { const u = x / rx, yb = Math.round(by + ry * Math.sqrt(1 - u * u)); for (let y = yb - dh; y <= yb; y++) px(cx + x, y, x === dx0 || x === dx0 + 5 ? RP.frame[x === dx0 ? 1 : 0] : RP.door); px(cx + x, yb - dh - 1, RP.frame[1]); }
  // the cone: drawn ring by ring from the eave up, the front of each ring over the last
  const P = roof === 'slate' ? RP.slate : roof === 'hide' ? RP.hide : RP.thatch, steps = Hc * 4;
  for (let i = 0; i <= steps; i++) { const s = i / steps, r = R * (1 - s), rr = Rry * (1 - s), yc = y0 - s * Hc; if (r < .4) break;
    for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) { const u = x / r; if (Math.abs(u) > 1) continue; const y = Math.round(yc + rr * Math.sqrt(1 - u * u)), th = Math.asin(u);
      let lit = .8 - .62 * (u + 1) / 2 + s * .1; const layer = Math.floor((y0 - y) / 3.4);
      let f;
      if (roof === 'slate') { const slab = Math.floor((th + 2) * (6 - s * 3)); f = ((y0 - y) % 3 === 0 && hsh(slab, layer, 7) < .7) ? RP.slate[0] : pick(P, lit + (hsh(slab, layer, 5) - .5) * .25); }
      else { const T = thatchTex(), tx = ((Math.round((th + Math.PI / 2) * R * 1.15) % T.w) + T.w) % T.w, ty = Math.round(s * Hc * 1.05) % T.h; let q = (ty * T.w + tx) * 3; if (!(T.c[q] >= 0)) q = ((ty * T.w + 3) * 3) % T.c.length; const k = .62 + lit * .62; f = `rgb(${Math.min(255, T.c[q] * k) | 0},${Math.min(255, T.c[q + 1] * k) | 0},${Math.min(255, T.c[q + 2] * k) | 0})`; }
      if (i < 3) f = pick(P, lit * .45); // the eave's cut edge
      if (style.script) { const z = th + 2, top = .36, bot = .22, mid = .29 + .016 * Math.sin(z * 13 + Math.sin(z * 3) * 2);
        if ((Math.abs(s - top) < .011 || Math.abs(s - bot) < .011) && Math.floor(z * 18) % 2 === 0) f = u > .6 ? RP.white[1] : RP.white[3];
        else if (Math.abs(s - mid) < .016 && hsh(Math.floor(z * 7), 0, 9) > .15) f = u > .6 ? shade(col, .6) : col;
        else if (s > bot && s < top && Math.abs(s - (mid + .035)) < .01 && Math.floor(z * 7) % 3 === 1) f = u > .6 ? shade(col, .6) : col; }
      const band = !style.script && s > .34 && s < .44; if (band) { const z = Math.floor((th + 2) * 9); const mid = Math.abs(s - .39) < .02 || ((z % 2) ? s < .39 : s > .39); f = mid ? col : (roof === 'hide' ? RP.white[3] : pick(P, lit * .7)); if (u > .55) f = shade(col, .55); }
      if (roof === 'hide' && Math.abs((th * 7 + 20) % 1.6) < .18) f = pick(P, lit * .6);
      px(cx + x, y, f); } }
  // the tent's poles, crossed at the peak
  const ay = Math.round(y0 - Hc); for (const [dx, len] of [[-1, 6], [1, 6], [0, 7]]) for (let k = 0; k < len; k++) px(cx + Math.round(dx * k * .55), ay - k + 1, RP.pole[k < 2 ? 0 : dx < 0 ? 2 : 1]);
  return { img: c, ox: -cx, oy: -by };
}
let THT = null;
function thatchTex() { if (THT) return THT; const s = SPRITES3.bld.find(b => b.k === 'cottage' && b.p === 'red'), im = s.img, c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const x0 = 16, y0 = 8, w = 44, h = 24, d = g.getImageData(x0, y0, w, h).data, L = []; for (let i = 0; i < w * h; i++) L.push(d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11);
  const lo = Math.min(...L), hi = Math.max(...L), rgb = [], ok = i => L[i] >= 80 && d[i * 4 + 3] >= 200; let g0 = 0; while (!ok(g0)) g0++; for (let i = 0; i < w * h; i++) { const j = ok(i) ? i : i ? i - 1 : g0; if (j !== i) { L[i] = L[j]; d[i * 4 + 3] = 255; d[i * 4] = d[j * 4]; d[i * 4 + 1] = d[j * 4 + 1]; d[i * 4 + 2] = d[j * 4 + 2]; } rgb.push(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]); } return (THT = { w, h, c: rgb, v: L.map(l => (l - lo) / (hi - lo || 1)) }); }
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.round(((n >> s) & 255) * k).toString(16).padStart(2, '0')).join(''); }
return makeCroft; })();
const CROFT = {}, croftOf = o => CROFT[o] || (CROFT[o] = makeCroft(COLS[o], { drum: 'white', roof: 'thatch', script: 1 }));
/* monuments: a white mud-brick ziggurat (Ziggurats kind A, whitewashed), standing where the tile's number was */
const ZIGC = {}, ZIG_K = 1, ZIG_ANG = Math.atan(1.838);   // at most full size, turned to face down and to the right like the towns
// the ground it stands on (plan units): the bottom tier, the great stair out front, and the side flights
const ZIG_FOOT = [[-60, -44], [60, -44], [60, 44], [-60, 44], [-6, -84], [6, -84], [-62, -51], [62, -51]];
// the largest size, up to full, whose ground stays inside the tile and clear of the roads along its borders
function zigFit(t) { if (t._zk) return t._zk; const c = Math.cos(ZIG_ANG), s = Math.sin(ZIG_ANG), poly = t.verts.map(vi => [G.verts[vi].vx, G.verts[vi].vy]), M = 12;
  const inside = (px, py) => { for (let i = 0; i < poly.length; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length], ex = bx - ax, ey = by - ay, L = Math.hypot(ex, ey), sd = ((px - ax) * ey - (py - ay) * ex) / L, sc = ((t.cx - ax) * ey - (t.cy - ay) * ex) / L; if (Math.sign(sd) !== Math.sign(sc) || Math.abs(sd) < M) return false; } return true; };
  // it may also step off the tile's centre a little, if that lets it stand bigger
  const fits = (k, ox, oy) => ZIG_FOOT.every(([x, y]) => { const px = x * c - y * s, py = x * s + y * c; return inside(t.cx + ox + k * (px + py * .6), t.cy + oy + k * (px * .22 - py * .38)); });
  let best = [.3, 0, 0]; for (let oy = -24; oy <= 24; oy += 4) for (let ox = -24; ox <= 24; ox += 4) { let lo = best[0], hi = ZIG_K; if (!fits(lo + .01, ox, oy)) continue; while (hi - lo > .01) { const m = (lo + hi) / 2; if (fits(m, ox, oy)) lo = m; else hi = m; } if (lo > best[0] + .005 || (Math.abs(lo - best[0]) < .005 && Math.hypot(ox, oy) < Math.hypot(best[1], best[2]))) best = [lo, ox, oy]; }
  t._zk = [Math.floor(best[0] * 50) / 50, best[1], best[2]];
  // clear the trees and rocks off the ground it stands on
  const [k, ox, oy] = t._zk, W = G.world, n0 = W.items.length; W.items = W.items.filter(it => it.banner || Math.hypot((it.x - t.cx - ox) / (k * 72), (it.y - t.cy - oy) / (k * 46)) > 1); if (W.items.length !== n0) setTimeout(() => { UI.static = W.render(); }, 0);
  return t._zk; }
function zigOf(o, k) { const key = o + k; return ZIGC[key] || (ZIGC[key] = Ziggurats.build('A', { color: COLS[o], white: true, scale: k, angle: ZIG_ANG })); }
function drawMonument(t) { const [k, ox, oy] = zigFit(t), z = zigOf(t.mono, k); CTX.drawImage(z.canvas, Math.round(t.cx + ox - z.ax), Math.round(t.cy + oy - z.ay)); }
function drawSettlement(v) { drawRing(v, 'back'); drawSettlement0(v); drawRing(v, 'front'); }
function drawSettlement0(v) {
  const x = v.vx, y = v.vy, o = v.owner, B = k => bldP(k, o);
  if (v.level === 2) { if (v.wall > 0) palisade(x + 4, y + 8, 40, 17, 'back', v.wall); spr(B('cottage'), x - 8, y + 12); spr(B('tower'), x + 20, y + 8); banner(x - 30, y + 12, COLS[o]); if (v.wall > 0) palisade(x + 4, y + 8, 40, 17, 'front', v.wall); smoke(x - 10, y - 14, v.id); return; }
  spr(croftOf(o), x, y + 6); banner(x - 18, y + 8, COLS[o]); smoke(x + 1, y - 34, v.id);
}
/* villages: the town's cottage at three quarters, shrunk by area-averaging and snapped back onto its own palette */
const SMALL = {};
function shrink(s, k) { const key = s.p + k; if (SMALL[key]) return SMALL[key]; const im = s.img, w = im.width, h = im.height, c0 = document.createElement('canvas'); c0.width = w; c0.height = h; const g0 = c0.getContext('2d'); g0.drawImage(im, 0, 0); const d = g0.getImageData(0, 0, w, h).data;
  const pal = new Map(); for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { const kk = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; pal.set(kk, (pal.get(kk) || 0) + 1); }
  const P = [...pal].filter(([, n]) => n > 3).map(([c]) => [c >> 16, (c >> 8) & 255, c & 255]);
  const W = Math.round(w * k), H = Math.round(h * k), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), out = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let r = 0, gg = 0, b = 0, a = 0, n = 0; const x0 = x / k, x1 = (x + 1) / k, y0 = y / k, y1 = (y + 1) / k;
    for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) { if (sx >= w || sy >= h) continue; const i = (sy * w + sx) * 4; n++; if (d[i + 3] > 128) { a++; r += d[i]; gg += d[i + 1]; b += d[i + 2]; } }
    const o = (y * W + x) * 4; if (a / n < .5) continue; r /= a; gg /= a; b /= a; let best = P[0], bd = 1e9; for (const q of P) { const dd = (q[0] - r) ** 2 + (q[1] - gg) ** 2 + (q[2] - b) ** 2; if (dd < bd) { bd = dd; best = q; } } out.data[o] = best[0]; out.data[o + 1] = best[1]; out.data[o + 2] = best[2]; out.data[o + 3] = 255; }
  g.putImageData(out, 0, 0); return (SMALL[key] = { img: c, ox: Math.round(s.ox * k), oy: Math.round(s.oy * k) }); }
function drawDen(d) { const t = G.tiles[d.tile], x = t.cx, y = t.cy - 6; if (d.cleared) { spr(bldP('fire', 'red'), x + 2, y + 10); return; }
  spr(bldP('hut', 'raider'), x - 26, y - 10); spr(bldP('hut', 'raider'), x + 24, y - 14); spr(bldP('fire', 'raider'), x + 2, y + 6);
  const ph = performance.now() / 1000; for (let i = 0; i < Math.min(4, d.units.spear); i++) { const px = x - 20 + i * 14, py = y + 24 + (i % 2) * 5; shadow(px, py, 4); spr(figSpr('raider', 'spear', 'stand', i), px, py, i % 2); } }
function drawRobber() { const t = G.tiles[G.robber], x = t.cx + 30, y = t.cy + 22, ph = performance.now() / 1000;
  for (let i = 0; i < 3; i++) { const px = x + (i - 1) * 10 + Math.sin(ph * .7 + i) * 2, py = y + (i % 2) * 6; shadow(px, py, 4); spr(figSpr('raider', i === 1 ? 'archer' : 'spear', 'stand', i), px, py, i === 2); }
  CTX.fillStyle = '#2a2018'; CTX.fillRect(Math.round(x - 10), Math.round(y - 42), 1, 14); CTX.fillStyle = '#141210'; for (let j = 0; j < 7; j++) CTX.fillRect(Math.round(x - 9), Math.round(y - 42 + j), 8 - (j > 4 ? (j - 4) * 2 : 0), 1); }

/* ---------- sheep grazing the pastures: a flock wanders each one, heads down, now and then trotting on ---------- */
function makeFlocks() { UI.flocks = []; if (!LOOK.flocks) return; const rr = mulberry(G.seed + 77);
  for (const t of G.tiles) { if (t.type !== 'pasture') continue; const n = 7 + ((rr() * 3) | 0);
    for (let k = 0; k < n; k++) { let x, y, tries = 0; do { const a = rr() * Math.PI * 2, r = 24 + rr() * 46; x = t.cx + Math.cos(a) * r; y = t.cy + Math.sin(a) * r * .8; tries++; } while ((G.world.cellTile(x, y) !== t || Math.hypot(x - t.cx, y - t.cy) < 22) && tries < 30);
      UI.flocks.push({ t, x, y, hx: x, hy: y, tx: x, ty: y, flip: rr() < .5, ph: rr() * 9, wait: rr() * 4, wool: rr() < .12 ? 'dark' : 'white' }); } } }
function stepFlocks(dt) { for (const s of UI.flocks || []) { if (s.wait > 0) { s.wait -= dt; continue; } const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
  if (d < 1) { s.wait = 2 + Math.random() * 5; const a = Math.random() * Math.PI * 2, r = Math.random() * 14; let nx = s.hx + Math.cos(a) * r, ny = s.hy + Math.sin(a) * r * .7; if (G.world.cellTile(nx, ny) === s.t) { s.tx = nx; s.ty = ny; } continue; }
  const sp = 7 * dt; s.x += dx / d * Math.min(sp, d); s.y += dy / d * Math.min(sp, d); s.flip = dx < 0; } }
const SHEEP_K = 1.5;   // drawn half again as large as Civ Sim's little sheep, so a flock reads from afar
function drawSheep(s, t) { const k = SHEEP_K, c = CTX, x = Math.round(s.x), y = Math.round(s.y), grazing = s.wait > 0, f = s.flip ? -1 : 1, W = s.wool === 'dark' ? ['#5a524a', '#6e665c', '#857c70'] : ['#cfc6b6', '#ece5d8', '#fbf8f1'];
  const px = (dx, dy, col) => { c.fillStyle = col; c.fillRect(x + Math.round(dx * k * f) - (f < 0 ? Math.ceil(k) : 0), y + Math.round(dy * k), Math.ceil(k), Math.ceil(k)); };
  c.fillStyle = 'rgba(10,20,8,.25)'; c.fillRect(x - 5 * k, y, 10 * k, 2);
  const leg = !grazing && Math.floor(t * 8 + s.ph) % 2; px(-3, -1, '#2a221a'); px(2, -1, '#2a221a'); if (!leg) { px(-2, -1, '#2a221a'); px(3, -1, '#2a221a'); }
  for (let j = -6; j <= -2; j++) for (let i = -4; i <= 3; i++) { if ((j === -6 || j === -2) && (i === -4 || i === 3)) continue; px(i, j, j === -6 ? W[2] : j === -2 ? W[0] : ((i * 3 + j * 5) % 4 === 0 ? W[1] : W[2])); }
  const hy = grazing && Math.floor(t * 1.5 + s.ph) % 3 ? -2 : -4; px(4, hy, '#2a221a'); px(5, hy, '#2a221a'); px(4, hy - 1, '#3a3024'); px(5, hy + 1, '#2a221a'); px(3, hy - 1, '#2a221a'); px(5, hy - 1, '#f2ece0'); }
/* ---------- villagers working the land around their homes ---------- */
const WORK = { forest: ['chop', 'carry_wood'], mountain: ['gather', 'carry_stone'], hill: ['gather', 'carry_stone'], field: ['gather', 'carry_fibre'], pasture: ['kneel_tend', 'carry_fibre'] };
function folkAgents() { if (UI.agents && UI.agentsKey === UI.ver) return UI.agents; const out = [];
  for (const v of G.verts) { if (!v.owner || !FOLK[v.owner]) continue; v.tiles.forEach((ti, k) => { const t = G.tiles[ti]; if (!WORK[t.type] || ti === G.robber) return; if (k >= v.level + 1) return; const h1 = hash(ti, v.id, 3), an = h1 * Math.PI * 2, r = 26 + h1 * 22;
    out.push({ o: v.owner, who: (k + v.id) % 5, home: [v.vx + 6, v.vy + 16], spot: [t.cx + (v.vx - t.cx) * .35 + Math.cos(an) * r * .4, t.cy + (v.vy - t.cy) * .35 + Math.sin(an) * r * .3 + 6], act: WORK[t.type][0], carry: WORK[t.type][1], off: h1 * 9 }); }); }
  UI.agentsKey = UI.ver; return (UI.agents = out); }
function agentPos(a, t) { const d = Math.hypot(a.spot[0] - a.home[0], a.spot[1] - a.home[1]), work = 2.6, walk = Math.max(.5, d / WALK_SPEED), L = walk * 2 + work + .6; let u = ((t + a.off) % L + L) % L;
  if (u < walk) { const f = u / walk; return { x: a.home[0] + (a.spot[0] - a.home[0]) * f, y: a.home[1] + (a.spot[1] - a.home[1]) * f, act: 'walk', flip: a.spot[0] < a.home[0], f: Math.floor(d * f / 4) }; } u -= walk;
  if (u < work) return { x: a.spot[0], y: a.spot[1], act: a.act, f: Math.floor(u * 6) }; u -= work;
  if (u < walk) { const f = u / walk; return { x: a.spot[0] + (a.home[0] - a.spot[0]) * f, y: a.spot[1] + (a.home[1] - a.spot[1]) * f, act: a.carry, flip: a.home[0] < a.spot[0], f: Math.floor(d * f / 4) }; } return null; }


/* ---------- hosts walking: steady off the road, quicker along your own roads ---------- */
const WALK_SPEED = 34, MARCH_SPEED = { open: 60, road: 100 };
const restXY = vi => { const v = G.verts[vi]; if (!v) return [W0 / 2, H0 / 2]; return v.owner ? [v.vx - 6, v.vy + 46] : [v.vx, v.vy + 8]; };
function walkPath(L, pts, speeds) {
  const seg = []; let tot = 0, len = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), sp = (speeds && speeds[i - 1]) || MARCH_SPEED.open; seg.push({ l, t0: tot, d: l / sp * 1000, s0: len }); tot += l / sp * 1000; len += l; }
  L.walk = { pts, seg, len, t0: performance.now(), dur: Math.max(300, tot) }; L.at = pts[pts.length - 1]; return sleep(L.walk.dur + 60); }
function armyPos(L) { if (L.walk) { const W = L.walk, el = performance.now() - W.t0; for (let i = 0; i < W.seg.length; i++) { const s = W.seg[i]; if (el <= s.t0 + s.d || i === W.seg.length - 1) { const f = s.d ? Math.max(0, Math.min(1, (el - s.t0) / s.d)) : 1, a = W.pts[i], b = W.pts[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, b[0] < a[0], s.s0 + s.l * f]; } } }
  return L.at || restXY(L.army.v); }
function drawArmy(L) {
  if (UI.scene && UI.scene.hide && UI.scene.hide.includes(L.id)) return;
  const [x, y, back, trav] = armyPos(L), walking = L.walk && performance.now() - L.walk.t0 < L.walk.dur, flip = walking ? !!back : x > W0 / 2;
  if (L.walk && !walking) L.walk = null;
  const list = []; for (const k of ['sword', 'spear', 'archer']) for (let i = 0; i < (L.army.units[k] || 0); i++) list.push(k); const n = Math.min(10, list.length), f = []; for (let i = 0; i < n; i++) f.push(list[Math.floor(i * list.length / n)]);
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt((f.length + 1) * 1.4))));
  if (UI.mode === 'march' && L.id === meId()) { CTX.fillStyle = '#f4d692'; for (let i = 0; i < 140; i++) { if (i % 6 > 3) continue; const an = i / 140 * Math.PI * 2; CTX.fillRect(Math.round(x + Math.cos(an) * 30), Math.round(y + 8 + Math.sin(an) * 13), 2, 1); } }
  const ph = (trav || 0) / 4;
  const draw = (u, k, px, py, hero) => { shadow(px, py, 4); const look = CFX[L.id][hero ? 'sword' : u][hero ? 0 : k % 3], st = Math.floor(ph + k) % 4;
    if (u === 'archer' && !hero) spr(look.shoot0, px, py - (walking && st % 2 ? 1 : 0), flip); else spr(walking ? look['gw' + st] : look.guard, px, py, flip); };
  f.forEach((u, k) => { const c = (k + 1) % cols, r = Math.floor((k + 1) / cols), px = x + (c - (cols - 1) / 2) * 9 + (r % 2 ? 4 : 0), py = y + r * 7; draw(u, k, px, py); });
  if (!L.hero.wounded) { const px = x + (flip ? 1 : -1) * ((cols - 1) / 2) * 9, py = y - 2; draw('sword', 0, px, py, true); crown(px, py); }
  if (L.army.units.cata) { shadow(x + (flip ? -26 : 26), y + 16, 8); spr(UI.cata, x + (flip ? -26 : 26), y + 16, flip); }
  banner(x + (flip ? 1 : -1) * (cols / 2 + 1) * 9, y - 2, COLS[L.id]);
}
function crown(x, y) { const c = CTX; c.fillStyle = '#f4d692'; c.fillRect(Math.round(x) - 2, Math.round(y) - 31, 5, 1); c.fillRect(Math.round(x) - 2, Math.round(y) - 33, 1, 2); c.fillRect(Math.round(x), Math.round(y) - 33, 1, 2); c.fillRect(Math.round(x) + 2, Math.round(y) - 33, 1, 2); }
function dot(x, y, col, r) { const c = CTX; r = r || 6; c.fillStyle = 'rgba(20,14,8,.55)'; c.beginPath(); c.arc(x, y, r + 1.5, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
function dash(ax, ay, bx, by, col) { const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 3); CTX.fillStyle = col; for (let i = 4; i < n - 4; i++) if (i % 3 !== 2) CTX.fillRect(Math.round(ax + (bx - ax) * i / n), Math.round(ay + (by - ay) * i / n), 2, 2); }

/* ==========================================================================
   WHO IS PLAYING HERE
   On one device every human seat plays here, passing the device round; in
   an online game this machine plays exactly one seat.
   ========================================================================== */
function meId() {
  if (UI.net) return NET.seat;
  if (!G.lords) return 'red';
  if (G.phase === 'robber' && G.robBy && lord(G.robBy) && lord(G.robBy).human) return G.robBy;
  const L = curL(); if (L && L.human && L.alive) UI.view = L.id;
  if (G.offer && lord(G.offer.to) && lord(G.offer.to).human) return G.offer.to;
  return UI.view || (G.lords.find(l => l.human) || G.lords[0]).id; }
const sharedDevice = () => !UI.net && !!G.lords && G.lords.filter(l => l.human).length > 1;   // several players passing one device: name them, never "you"
const canAct = id => UI.net ? id === NET.seat : !!(lord(id) && lord(id).human);
const me = () => lord(meId());
const idle = () => !CQ.running && !CQ.q.length;
const parchMine = () => G.lords && G.parch && canAct(G.parch.who) && !UI.scene && idle();
const robMine = () => G.lords && !G.winner && G.phase === 'robber' && !UI.scene && !UI.curtain && idle() && robberOf().human && canAct(robberOf().id);
const myTurn = () => G.lords && !G.winner && !UI.scene && !UI.curtain && idle() && curL().human && canAct(curL().id);

/* ==========================================================================
   MOVES: everything that changes the game is a move, played in the same
   order on every machine (the host numbers them).
   ========================================================================== */
const CQ = { q: [], running: false, done: 0, hold: [] };
/* ---------- saving: after every move the game keeps itself on this device (the host's copy, online) ---------- */
const SAVE_KEY = 'crown-saves';
const savesGet = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; } };
const savesPut = a => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(a.slice(0, 6))); return true; } catch (e) { return false; } };
function makeSave() { const lead = G.lords.filter(l => l.alive).sort((a, b) => vpPublic(b) - vpPublic(a))[0], names = {};
  for (const id in NET.links) { const L = NET.links[id]; if (L && L.name) names[id] = L.name; } for (const Q of G.lords) if (Q.away) names[Q.id] = Q.away;
  let thumb = ''; try { const m = $('mini'), c = document.createElement('canvas'); c.width = 96; c.height = Math.round(96 * m.height / m.width); c.getContext('2d').drawImage(m, 0, 0, c.width, c.height); thumb = c.toDataURL('image/jpeg', .7); } catch (e) {}
  return { id: G.gid, v: 1, t: Date.now(), seed: G.seed, seats: G.lords.map(l => l.id), humans: G.lords.filter(l => l.human || l.away).map(l => l.id), names, online: UI.net && NET.role === 'host' ? ROOM.code : null,
    snap: snapshot(), n: CQ.done, seq: NET.seq, thumb, meta: { round: G.round, cur: curL().id, setup: G.phase === 'setup', lead: lead ? lead.id : null, pts: lead ? vpPublic(lead) : 0 } }; }
function autosave() { if (!G.lords || UI.booting || (UI.net && NET.role !== 'host')) return; const all = savesGet().filter(s => s.id !== G.gid);
  if (G.winner) { savesPut(all); return; } const s = makeSave(); all.unshift(s); if (!savesPut(all)) { s.thumb = ''; all.splice(0, 1, s); savesPut(all.slice(0, 3)); } }
const LIVE = new Set(['beat', 'shot', 'storm']);   // moves inside a battle or siege that is already playing
function send(c) { c.by = c.by || meId(); if (!UI.net) { c.n = ++NET.seq; return enqueue(c); } if (NET.role === 'host') return hostSequence(c); netSend(NET.links.host, { t: 'cmd', c }); }
function enqueue(c) { if (UI.booting) { CQ.hold.push(c); return; } if (c.n && c.n <= CQ.done && UI.net && NET.role === 'guest' && !LIVE.has(c.type)) return; if (LIVE.has(c.type)) { UI.live.push(c); return; } CQ.q.push(c); pump(); }
async function pump() {
  if (CQ.running) return; CQ.running = true; hud();
  while (CQ.q.length) { const c = CQ.q.shift(); try { await apply(c); } catch (e) { console.error(e); } CQ.done = c.n || CQ.done; afterCommand(c); }
  CQ.running = false; onIdle(); autosave();
  hud(); turnCue(); }
async function apply(c) {
  const L = lord(c.by), turn = L && L === curL() && L.alive, main = turn && G.phase === 'main';
  if (G.hurry && !G.hurry.go && c.by === G.hurry.who && !['hurry', 'hurryEnd', 'auto'].includes(c.type)) G.hurry = null;   // playing before the vote passes clears it; once the clock runs, nothing stops it
  switch (c.type) {
    case 'here': break;
    case 'hurry': { const C = curL(); if (!L || !L.human || !L.alive || L === C || !C.human || G.winner) break; if (!G.hurry || G.hurry.who !== C.id) G.hurry = { who: C.id, votes: [], go: false }; if (G.hurry.go || G.hurry.votes.includes(L.id)) break; G.hurry.votes.push(L.id);
      if (G.hurry.votes.length >= hurryNeed()) { G.hurry.go = true; logMsg(`${G.hurry.votes.length} lords vote to hurry ${pn(C.id)}: ${HURRY_SECS} seconds left in the turn.`, 'war'); } else logMsg(`${pn(L.id)} ${vb(L.id, 'want', 'wants')} to hurry ${pn(C.id)} along (${G.hurry.votes.length} of ${hurryNeed()}).`); break; }
    case 'hurryEnd': { const C = curL(); if (!G.hurry || !G.hurry.go || G.hurry.who !== C.id || !C.human) break; G.hurry = null; logMsg(`Time is up: ${pn(C.id)}${youAre(C.id) ? 'r' : "'s"} turn is skipped.`, 'war'); C.human = false; C.hurried = true; await aiFlow(); break; }
    case 'auto': { if (!L || !L.alive || L.away) break; if (c.on && L.human) { L.human = false; L.auto = true; charterBots(); logMsg(`${pn(L.id)} ${vb(L.id, 'step', 'steps')} away: the computer plays for ${youAre(L.id) ? 'you' : 'them'}.`); if (curL() === L && !CQ.busyTurn) await aiFlow(); }
      else if (!c.on && L.auto) { L.human = true; L.auto = false; logMsg(`${pn(L.id)} ${vb(L.id, 'take', 'takes')} back ${youAre(L.id) ? 'your' : 'their'} turns.`); } break; }
    case 'begin': await aiFlow(); break;
    case 'drop': { const Q = lord(c.seat); if (Q && Q.human) { Q.human = false; Q.away = c.name || PNM(c.seat); charterBots(); logMsg(`<b>${esc2(Q.away)}</b> (${PNM(c.seat)}) lost connection. The seat is held: they can rejoin with the room code. The computer plays for them meanwhile.`, 'war'); if (curL() === Q) await aiFlow(); } break; }
    case 'back': { const Q = lord(c.seat); if (Q && Q.away) { Q.human = true; Q.away = null; logMsg(`<b>${esc2(c.name || PNM(c.seat))}</b> is back as ${PNM(c.seat)}.`, 'big'); } break; }
    case 'release': { const Q = lord(c.seat); if (Q && Q.away && c.by === 'red') { Q.away = null; logMsg(`${PNM(c.seat)}'s seat goes to the computer for good.`); } break; }
    case 'charter': if (L && L.human && G.phase === 'setup' && G.setup.step === 'charter' && !L.chose) { if (pickCharter(L, c.k)) { charterBots(); hud(); await aiFlow(); } else if (canAct(L.id) && !sharedDevice()) UI.toast('Another lord took that charter first. Choose again.'); } break;
    case 'setupV': if (turn && G.phase === 'setup' && G.setup.step === 'village' && setupVillage(L, G.verts[c.v])) landChanged(); break;
    case 'setupR': if (turn && G.phase === 'setup' && G.setup.step === 'road' && G.geo && G.geo.who === L.id) { geoApply(L, ...aiGeo(L)); landChanged(); }
      if (turn && G.phase === 'setup' && G.setup.step === 'road' && setupRoad(L, G.edges[c.e])) { landChanged(); await aiFlow(); } break;
    case 'roll': if (turn && G.phase === 'roll') { diceShake(); rollFor(L); UI.ver++; if (G.phase === 'robber' && G.robBy && !robberOf().human) { const B = robberOf(); moveRobber(B, aiRobber(B)); } } break;
    case 'parch': if (L && G.parch && G.parch.who === L.id && parchApply(L, c.t)) landChanged(); break;
    case 'geo': if (L && G.geo && G.geo.who === L.id && geoApply(L, c.pick, c.t)) landChanged(); break;
    case 'robber': if (L && L === robberOf() && L.alive && G.phase === 'robber' && c.tile !== G.robber && G.tiles[c.tile]) { moveRobber(L, c.tile, c.victim ? lord(c.victim) : null); UI.ver++; if (!curL().human) { hud(); await aiFlow(); } } break;
    case 'build': if (main) { const x = ['road', 'walls', 'mend', 'mendSide'].includes(c.k) ? G.edges[c.id] : G.verts[c.id]; if (x && build(L, c.k, x)) { landChanged(); if (canAct(L.id)) UI.toast({ village: 'A new village rises.', town: 'The village grows into a town.', walls: 'A wall section goes up.', mend: 'The wall is mended.', mendSide: 'The ring of stakes is mended.', road: 'A road is laid.' }[c.k], ['road', 'walls', 'mend', 'mendSide'].includes(c.k) ? '' : 'big'); } } break;
    case 'batter': if (main) { const T = c.v != null ? (canBatterSide(L, G.verts[c.v], G.edges[c.e]) ? ringT(G.verts[c.v], G.edges[c.e]) : null) : (canBatter(L, G.edges[c.e]) ? wallT(G.edges[c.e]) : null); if (T) { if (L.human) { L.battered = true; G.bid = (G.bid || 0) + 1; await wallSiege(L, T, G.bid); } else batterAI(L, T); landChanged(); } } break;
    case 'free': if (main && L.freeRoads > 0 && G.edges[c.e] && canRoad(L.id, G.edges[c.e])) { G.edges[c.e].owner = L.id; L.freeRoads--; awards(); landChanged(); } break;
    case 'card': if (main) { const k = buyCard(L); if (k && canAct(L.id)) UI.toast(`${sharedDevice() ? PNM(L.id) + ' draws' : 'You draw'} a fortune card: <b>${CARDS[k].name}</b>${k === 'chronicle' ? ' (a hidden point)' : CARDS[k].battle ? ' (for battle)' : ' (playable next turn)'}.`); } break;
    case 'play': if (main && playCard(L, c.k, c.arg)) { if (c.k === 'knight') { G.phase = 'robber'; logMsg(`${pn(L.id)} ${vb(L.id, 'play', 'plays')} a <b>Knight</b>: the outlaws move.`); } if (c.k === 'roads') logMsg(`${pn(L.id)} ${vb(L.id, 'play', 'plays')} <b>Road Building</b>.`); } break;
    case 'recruit': if (main) recruit(L, c.u); break;
    case 'monument': if (main && raiseMonument(L, G.tiles[c.t])) { landChanged(); } break;
    case 'bank': if (main) bankTrade(L, c.give, c.get); break;
    case 'offer': if (main && !G.offer) { const O = lord(c.to); if (!O || !O.alive || O === L || chOf(L) === 'zealot' || chOf(O) === 'zealot' || !Object.entries(c.give).every(([k, v]) => L.res[k] >= v)) break;
      if (!O.human) { if (aiAccepts(O, c.give, c.get, L)) { doTrade(L, O, c.give, c.get); logMsg(`${pn(O.id)} ${vb(O.id, 'trade', 'trades')} with ${pn(L.id)}: ${resText(c.give)} for ${resText(c.get)}.`, youAre(L.id) ? 'big' : ''); } else if (youAre(L.id)) UI.toast(`${pn(O.id)} refuses.`); }
      else { G.offer = { from: L.id, to: O.id, give: c.give, get: c.get }; logMsg(`${pn(L.id)} ${vb(L.id, 'offer', 'offers')} ${pn(O.id)} ${resText(c.give)} for ${resText(c.get)}.`, youAre(O.id) ? 'big' : ''); } } break;
    case 'reply': { const o = G.offer; if (!o || c.by !== o.to) break; G.offer = null; const A = lord(o.from), B = lord(o.to);
      if (c.ok && Object.entries(o.give).every(([k, v]) => A.res[k] >= v) && Object.entries(o.get).every(([k, v]) => B.res[k] >= v)) { doTrade(A, B, o.give, o.get); logMsg(`${pn(B.id)} ${vb(B.id, 'accept', 'accepts')} the trade.`, youAre(A.id) || youAre(B.id) ? 'big' : ''); }
      else logMsg(`${pn(B.id)} ${vb(B.id, 'decline', 'declines')} the trade.`); break; }
    case 'march': if (main && !L.deed && hostSize(L) > 0) { const M = marchMap(L); if (M.cost.has(c.v) && c.v !== L.army.v) await march(L, { v: c.v }, M); } break;
    case 'end': if (main) { if (G.parch && G.parch.who === L.id) parchApply(L, -1); if (G.geo && G.geo.who === L.id) { const [p, s] = aiGeo(L); geoApply(L, p, s); landChanged(); } G.offer = null; L.freeRoads = 0; nextLord(); await aiFlow(); } break;
  }
  hud(); checkWinUI();
}
// the computer's seats move on their own, on every machine alike (the dice are shared)
async function aiFlow() {
  while (!G.winner) {
    const L = curL(); if (L.human && L.alive) break;
    if (G.phase === 'setup' && G.setup.step === 'charter') { if (!playersChosen()) break; charterBots(); hud(); continue; }
    if (G.phase === 'setup' && L.hurried) { L.hurried = false; L.human = true; }
    if (G.phase === 'setup') { hud(); await sleep(450); const v = aiSetupVillage(L); setupVillage(L, v); landChanged(); if (!onScreen(v.vx, v.vy)) panTo(v.vx, v.vy); UI.toast(`${pn(L.id)} settles a village.`); hud(); await sleep(450); setupRoad(L, aiSetupRoad(L)); landChanged(); continue; }
    if (!L.alive) { nextLord(); continue; }
    if (G.phase === 'roll') { hud(); await sleep(300); rollFor(L); diceShake(); UI.ver++; hud(); await sleep(400); }
    if (G.phase === 'robber') { const B = robberOf(); if (B !== L && B.human && B.alive) { hud(); break; } moveRobber(B, aiRobber(B)); UI.ver++; }
    aiCards(L); if (G.phase === 'robber') { moveRobber(L, aiRobber(L)); }
    if (L.hurried) { L.hurried = false; L.human = true; landChanged(); hud(); nextLord(); continue; }
    aiBuild(L); landChanged(); hud(); if (checkWinUI()) return; await sleep(200);
    for (let k = 0; k < 3; k++) { const be = aiBatterSpot(L); if (!be) break; if (onScreen(be.x, be.y)) await sleep(300); batterAI(L, be); landChanged(); hud(); }
    const ch = aiDeed(L); if (ch.kind === 'attack' || ch.kind === 'move') await march(L, { v: ch.v }, ch.M);
    if (!L.deed && L.again && L.alive) { const c2 = aiDeed(L); if (c2.kind === 'attack' || c2.kind === 'move') await march(L, { v: c2.v }, c2.M); }
    landChanged(); hud(); if (checkWinUI()) return;
    nextLord(); }
}
function diceShake() { UI.shakeT = performance.now(); }
/* ---------- the turn box (bottom left): the dice are the Roll button; after rolling, the result and End turn ---------- */
const DFACE = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
const bigDie = (n, sz, cls) => `<span class="bd${cls ? ' ' + cls : ''}" style="width:${sz}px;height:${sz}px">${(DFACE[n] || []).map(([a, b]) => `<i style="left:${sz * (.2 + a * .3) - sz * .075}px;top:${sz * (.2 + b * .3) - sz * .075}px;width:${sz * .15}px;height:${sz * .15}px"></i>`).join('')}</span>`;
function nextUp() { let i = G.cur; for (let k = 0; k < G.lords.length; k++) { i = (i + 1) % G.lords.length; if (G.lords[i].alive) return G.lords[i]; } return curL(); }
function turnBox() {
  const el = $('turnbox'), cur = curL(), mine = myTurn(), d = G.dice, shake = UI.shakeT && performance.now() - UI.shakeT < 700 ? 'shake' : '', who = cur.id;
  if (UI.curtain) { el.style.display = 'none'; return; } el.style.display = '';
  const result = d ? `<div class="dres">${bigDie(d[0], 52, shake)}${bigDie(d[1], 52, shake)}<span class="tot${d[0] + d[1] === 7 ? ' seven' : ''}">${d[0] + d[1]}</span></div>` : '';
  let h;
  if (G.phase === 'setup') h = `<div class="dlbl">Settling the isle</div><div class="tbmsg">${G.setup.step === 'charter' ? (charterWho() ? 'Choose your charter.' : 'The lords are choosing their charters…') : mine ? (G.setup.step === 'village' ? 'Place your ' + (G.setup.n < G.lords.length ? 'first' : 'second') + ' village: click a lit corner.' : 'Lay a road out of it: click a lit edge.') : pn(who) + ' is placing ' + (G.setup.step === 'village' ? 'a village' : 'a road') + '…'}</div>`;
  else if (mine && G.phase === 'roll') h = `<div class="dlbl">${sharedDevice() ? PNM(who) + "'s" : 'Your'} turn · round ${G.round}</div><button class="endbig rollbtn" id="tbroll">${bigDie(d ? d[0] : 6, 52)}${bigDie(d ? d[1] : 3, 52)}<span>Roll</span></button><div class="small dim" style="text-align:center">Click the dice or press Space</div>`;
  else if (parchMine()) h = `<div class="dlbl">Your new town</div><div class="tbmsg neg">Click any land on the isle to turn it to desert.</div><button class="btn" id="parchno" style="margin-top:6px">Spare the land</button>`;
  else if (robMine()) h = `<div class="dlbl">${pn(who)} rolled</div>${result}<div class="tbmsg neg">${G.robBy ? (sharedDevice() ? esc2(lordName(G.robBy)) + ', the' : 'The') + ' outlaws answer to you. ' : ''}Click a tile to send the outlaw band there.</div>`;
  else if (G.phase === 'robber' && G.robBy) h = `<div class="dlbl">${pn(who)} rolled</div>${result}<div class="tbmsg">The Bandit Lord ${pn(G.robBy)} is moving the outlaws…</div>`;
  else if (mine) h = `<div class="dlbl">${sharedDevice() ? PNM(who) + "'s" : 'Your'} roll</div>${result}<div class="small dim" style="text-align:center;margin-top:-4px">${d ? 'Tiles showing ' + (d[0] + d[1]) + (d[0] + d[1] === 7 ? ': the outlaws moved' : ' paid out') : ''}</div><button class="endbig" id="tbend" ${G.offer ? 'disabled' : ''}>⏎ End turn<small>Enter · ${PNM(nextUp().id)} is next</small></button>`;
  else h = `<div class="dlbl">${d ? pn(who) + ' rolled' : ''}</div>${result}<div class="tbmsg">${pn(who)} ${vb(who, 'are', 'is')} moving…</div>`;
  if (el._h === h) return; el._h = h; el.innerHTML = h;
  const r = $('tbroll'); if (r) r.onclick = () => act('roll'); const e = $('tbend'); if (e) e.onclick = () => act('end'); }
/* ---------- the goods (left, above the dice): a card per good, how many you hold, and the numbers that pay you more ---------- */
function yieldNums(id) { const R = {}; RES.forEach(r => R[r] = {}); for (const v of G.verts) { if (v.owner !== id) continue; for (const ti of v.tiles) { const t = G.tiles[ti]; if (!YIELD[t.type] || !t.num) continue; const o = R[YIELD[t.type]][t.num] || (R[YIELD[t.type]][t.num] = { n: t.num, x: 0, blocked: G.robber === ti }); o.x += v.level; } }
  for (const r of RES) R[r] = Object.values(R[r]).sort((a, b) => pips(b.n) - pips(a.n)); return R; }
function goodsTray() { const el = $('rtray'); if (UI.curtain || G.phase === 'setup') { el.style.display = 'none'; return; } el.style.display = '';
  const ME = meId(), L = me(), Y = yieldNums(ME), gain = UI.gain && UI.gain.who === ME ? UI.gain.d : {};
  const h = RES.map(r => `<div class="rc${L.res[r] ? '' : ' zero'}" title="${RES_NAME[r]}"><div class="top"><img src="${CIV_ICON[r]}"><b>${L.res[r]}</b></div>${gain[r] ? `<span class="gain">+${gain[r]}</span>` : ''}${Y[r].length ? `<div class="nums">${Y[r].map(o => `<span class="tk${o.n === 6 || o.n === 8 ? ' hot' : ''}${o.blocked ? ' off' : ''}" title="a roll of ${o.n} gives you ${o.x} ${RES_NAME[r]}${o.blocked ? ' (blocked by the outlaws)' : ''}">${o.n}${o.x > 1 ? `<sup>×${o.x}</sup>` : ''}</span>`).join('')}</div>` : '<div class="nonum">no source</div>'}</div>`).join('');
  if (el._h !== h) { el._h = h; el.innerHTML = h; }
  const tb = $('turnbox'); el.style.bottom = (tb.style.display === 'none' ? 12 : tb.offsetHeight + 22) + 'px';
  $('lords').style.maxHeight = Math.max(120, innerHeight - 12 - el.offsetHeight - (tb.style.display === 'none' ? 12 : tb.offsetHeight + 22) - 10 - 12) + 'px'; }
function rollFor(L) { const M = me(), b = Object.assign({}, M.res); const n = rollDice(); const d = {}; for (const k of RES) if (M.res[k] > b[k]) d[k] = M.res[k] - b[k]; UI.gain = { who: M.id, d }; return n; }
/* ---------- fullscreen, as Civ Sim does it ---------- */
const FS_ICON = {"full": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZUlEQVR4AdySywkAIAxD1SkcwEEc3UEcwC2UJyhSvPg5iEIObdqQBo06fFUgxZBnGLVnPL0qwKB1XkvQb5AcNVwXoNjBLwItkNUM2HskAz7Eqn3m2XvkBOzs4t4JBCIxupIcNXwBAAD//3osEQQAAAAGSURBVAMA4MlaRbiBh1gAAAAASUVORK5CYII=", "unfull": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAa0lEQVR4AdyQ6wmAMAyE1SkcwEEc3UEcwC2UCwSO44r08auFkNf1I8m2dL4i4Lmvl9maZ68ISMGfnwWAA6m53VWDPG6wH+fqjCGuj1oAWFgbjwFgF2c8jeujFhNgFzX+nLFqkAcgBS1+AsAHAAD//4CLbewAAAAGSURBVAMAOSFfJ5rnBGIAAAAASUVORK5CYII="};
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFullscreen() { try { if (fsOn()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { const d = document.documentElement, r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d); if (r && r.catch) r.catch(() => {}); } } catch (e) {} }
function fsDraw() { const b = $('fsBtn'); if (!b) return; b.innerHTML = `<img src="${fsOn() ? FS_ICON.unfull : FS_ICON.full}" alt="">`; b.title = fsOn() ? 'Leave fullscreen' : 'Fullscreen'; }
function fsInstall() { const d = document.documentElement; if (!(d.requestFullscreen || d.webkitRequestFullscreen) || $('fsBtn')) return; const b = document.createElement('button'); b.id = 'fsBtn'; b.className = 'btn'; b.onclick = toggleFullscreen; $('newg').after(b); fsDraw();
  document.addEventListener('fullscreenchange', () => { fsDraw(); fit(); }); document.addEventListener('webkitfullscreenchange', () => { fsDraw(); fit(); }); }
/* ---------- the lords tab (top left): what everyone can see of everyone ---------- */
UI.lordsOpen = true;
function lordsTab() {
  const el = $('lords'); if (UI.curtain) { el.style.display = 'none'; return; } el.style.display = '';
  const heroImg = id => sprURL(CFX[id].sword[0].guard);
  const awayNote = Q => Q.away ? `<div class="awayt">⏸ ${esc2(Q.away)} disconnected · seat held · the computer plays for now${UI.net && NET.role === 'host' ? ` · <a href="#" data-release="${Q.id}">give it away</a>` : ''}</div>` : '';
  const rows = G.lords.map(Q => { const vil = settlements(Q.id).filter(v => v.level === 1).length, town = settlements(Q.id).filter(v => v.level === 2).length;
    return `<div class="pc2${G.cur === Q.i && G.phase !== 'over' ? ' cur' : ''}${Q.alive ? '' : ' out'}" data-find="${Q.id}" style="position:relative" title="Click to find ${esc2(lordName(Q.id))}'s host">${G.cur === Q.i ? '<span class="turnmark"></span>' : ''}<div class="por" style="background:${COLS[Q.id]}33"><img src="${heroImg(Q.id)}"></div>
      <div class="nm"><span style="color:${LIGHT[Q.id]}">${esc2(lordName(Q.id))}${youAre(Q.id) && G.names && G.names[Q.id] ? ' <span class="dim" style="font-size:11px">(you)</span>' : youAre(Q.id) ? ' <span class="dim" style="font-size:11px">(you)</span>' : ''}</span>${Q.away || Q.auto || !Q.human ? `<span class="tag">${Q.away ? 'away' : Q.auto ? 'auto' : 'bot'}</span>` : ''}${chOf(Q) ? `<span class="tag chtag" title="${CHARTERS[Q.charter].name}: ${CHARTERS[Q.charter].boon.replace(/<[^>]+>/g, '')} But: ${CHARTERS[Q.charter].pen.replace(/<[^>]+>/g, '')}">${CHARTERS[Q.charter].name}</span>` : ''}</div><div class="vp">${Q.alive ? vpPublic(Q) : '✕'}<small>points</small></div>
      <div class="st"><span title="goods in hand">✋ <b>${handSize(Q)}</b></span><span title="fortune cards">🂠 <b>${Q.cards.length + Q.fresh.length}</b></span><span title="men in the host">⚑ <b>${hostSize(Q)}</b>${Q.hero.wounded ? ' <span class="neg" title="hero wounded">✚</span>' : ''}</span></div>
      <div class="st" style="grid-column:2/4"><span>⌂ <b>${vil}</b> village${vil === 1 ? '' : 's'}</span><span>♜ <b>${town}</b> town${town === 1 ? '' : 's'}</span><span>═ <b>${longestRoad(Q.id)}</b> road</span></div>${G.lh.road === Q.id || G.lh.host === Q.id ? `<div style="grid-column:1/4;margin-top:3px">${G.lh.road === Q.id ? '<span class="aw">═ Longest Road</span>' : ''}${G.lh.host === Q.id ? '<span class="aw">⚑ Greatest Host</span>' : ''}</div>` : ''}${awayNote(Q)}</div>`; }).join('');
  const cur = curL(), turnTxt = G.phase === 'setup' ? 'settling the isle' : `${youAre(cur.id) ? 'your' : esc2(lordName(cur.id)) + "'s"} turn`;
  const h = `<h4 id="lordsh">Lords of the Isle <span class="dim">· ${UI.lordsOpen ? 'Tab hides' : 'Tab shows'} ${UI.lordsOpen ? '▾' : '▸'}</span><span class="rnd">Round ${G.round} · ${turnTxt} · first to ${winPts()} points</span></h4>${UI.lordsOpen ? rows : ''}`;
  if (el._h === h) return; el._h = h; el.innerHTML = h;
  $('lordsh').onclick = () => { UI.lordsOpen = !UI.lordsOpen; hud(); };
  el.querySelectorAll('[data-release]').forEach(a => a.onclick = e => { e.preventDefault(); e.stopPropagation(); send({ type: 'release', seat: a.dataset.release, by: 'red' }); });
  if (chatOn()) el.querySelectorAll('.pc2').forEach(c => { const id = c.dataset.find, Q = lord(id); if (!Q || !Q.human || id === NET.seat) return; c.insertAdjacentHTML('beforeend', `<button class="wsp" data-w="${id}" title="Whisper to ${PNM(id)}"><svg width="14" height="12" viewBox="0 0 14 12"><path d="M1 1h12v7H6l-3 3V8H1z" fill="none" stroke="#f4d692" stroke-width="1.4" stroke-linejoin="round"/></svg></button>`); });
  el.querySelectorAll('.wsp').forEach(b => b.onclick = e => { e.stopPropagation(); chatOpen(b.dataset.w); });
  el.querySelectorAll('[data-find]').forEach(c => c.onclick = () => { const Q = lord(c.dataset.find); if (Q.alive && Q.army.v >= 0) { const [x, y] = armyPos(Q); panTo(x, y); } });
}
// when it comes round to a player on this device: on a shared device, hand it over first
function turnCue() {
  if (!G.lords || G.winner) return; const L = curL(); if (!L.human || !canAct(L.id) || UI.scene) return;
  const key = L.id + ':' + G.round + ':' + G.phase.slice(0, 2);
  if (UI.cued === key) return; UI.cued = key;
  const humansHere = G.lords.filter(q => q.human && q.alive && canAct(q.id)).length;
  if (!UI.net && humansHere > 1 && UI.lastViewer !== L.id) { UI.lastViewer = L.id; return curtain(L); }
  UI.lastViewer = L.id;
  if (G.phase === 'setup' && G.setup.step === 'charter') UI.toast(`${humansHere > 1 ? pn(L.id) + ': choose' : 'Choose'} a charter, or keep to the old ways.`);
  else if (G.phase === 'setup') UI.toast(G.setup.n < G.lords.length ? `${humansHere > 1 ? pn(L.id) + ': click' : 'Your turn: click'} a lit corner for your <b>first village</b>. Your host musters there.` : `${humansHere > 1 ? pn(L.id) + ': place' : 'Your turn: place'} your <b>second village</b>. It gathers one of each good around it.`, 'big');
  else if (G.phase === 'roll') { UI.toast(`Round ${G.round}. ${humansHere > 1 || UI.net ? 'Your turn, ' + PNM(L.id) : 'Your turn'}: roll the dice.`, 'big'); const [x, y] = armyPos(L); panTo(x, y); }
}
function curtain(L) { UI.curtain = true; const el = $('win'); el.style.display = ''; el.innerHTML = `<div class="gl wbox"><div style="font:600 24px var(--pix);color:${LIGHT[L.id]}">${PNM(L.id)}'s turn</div><div class="dim" style="margin:6px 0 14px">Pass the device to ${PNM(L.id)}. Their goods and cards stay hidden till they're ready.</div><button class="btn big" id="ready">I'm ${PNM(L.id)}: go</button></div>`;
  $('ready').onclick = () => { el.style.display = 'none'; UI.curtain = false; UI.view = L.id; UI.sel = null; UI.mode = 'idle'; UI.cued = null; hud(); turnCue(); }; hud(); }

/* ---------- the frame ---------- */
function render(dt) {
  const cv = $('cv'), ctx = cv.getContext('2d'), d = DPR(), t = performance.now() / 1000; CTX = ctx;
  if (UI.camGoal) { const g = UI.camGoal; UI.cam.z = g.z; const tx = g.x - innerWidth / UI.cam.z / 2, ty = g.y - innerHeight / UI.cam.z / 2, k = Math.min(1, dt * 5); UI.cam.x += (tx - UI.cam.x) * k; UI.cam.y += (ty - UI.cam.y) * k; if (Math.hypot(tx - UI.cam.x, ty - UI.cam.y) < 1) UI.camGoal = null; }
  const c = UI.cam, k = c.z * d, ME = meId();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#16304f'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(k, 0, 0, k, -c.x * k, -c.y * k); ctx.imageSmoothingEnabled = false; drawSea(ctx, c); ctx.drawImage(UI.static, 0, 0); ctx.drawImage(UI.roads, 0, 0);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const H = UI.hover || {}, mine = myTurn();
  for (const e of G.edges.filter(e => e.wo).sort((a, b) => (G.verts[a.a].vy + G.verts[a.b].vy) - (G.verts[b.a].vy + G.verts[b.b].vy))) drawWall(e);
  if (G.phase === 'setup' && mine) { if (G.setup.step === 'village') for (const v of G.verts) { if (canStartVillage(v)) dot(v.vx, v.vy, H.vert === v ? '#fff' : '#f4d692', 5); } else for (const e of G.edges) if (canStartRoad(e)) { const A = G.verts[e.a], B = G.verts[e.b]; dash(A.vx, A.vy, B.vx, B.vy, H.edge === e ? '#fff' : '#f4d692'); } }
  if (mine && (UI.mode === 'road' || UI.mode === 'freeroad')) for (const e of G.edges) if (e.tiles.length && canRoad(ME, e)) { const A = G.verts[e.a], B = G.verts[e.b]; dash(A.vx, A.vy, B.vx, B.vy, H.edge === e ? '#fff' : '#f4d692'); }
  if (mine && UI.mode === 'village') for (const v of G.verts) if (canVillage(ME, v)) dot(v.vx, v.vy, H.vert === v ? '#fff' : '#f4d692', 5);
  if (mine && UI.mode === 'town') for (const v of G.verts) if (canTown(ME, v)) dot(v.vx + 22, v.vy - 26, '#f4d692', 5);
  if (mine && UI.mode === 'monument') for (const t of G.tiles) if (canMonument(ME, t)) { ctx.strokeStyle = H.tile === t.i ? '#fff' : '#f4d692'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.cx, t.cy, 30 + Math.sin(performance.now() / 300) * 2, 0, 7); ctx.stroke(); }
  if (mine && UI.mode === 'walls') for (const e of G.edges) { const A = G.verts[e.a], B = G.verts[e.b]; if (canWall(ME, e)) dash(A.vx, A.vy, B.vx, B.vy, H.edge === e ? '#fff' : '#cfc8b6'); else if (canMend(ME, e)) dot((A.vx + B.vx) / 2, (A.vy + B.vy) / 2 - 14, H.edge === e ? '#fff' : '#f4d692', 5); }
  if (mine && UI.mode === 'walls') for (const e of G.edges) { const v = sideToMend(ME, e); if (!v) continue; const o = G.verts[e.a === v.id ? e.b : e.a]; dot(v.vx + (o.vx - v.vx) * .32, v.vy + (o.vy - v.vy) * .32 - 14, H.edge === e ? '#fff' : '#f4d692', 5); }
  drawPorts(ctx); drawGeo(ctx);
  if (parchMine() && UI.hover && UI.hover.tile != null && G.tiles[UI.hover.tile] && G.tiles[UI.hover.tile].type !== 'desert') { const T = G.tiles[UI.hover.tile]; ctx.strokeStyle = '#e9675a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(T.cx, T.cy, 34 + Math.sin(performance.now() / 160) * 2, 0, 7); ctx.stroke(); }
  if (robMine()) for (const tl of G.tiles) if (tl.i !== G.robber) { ctx.strokeStyle = H.tile === tl.i ? '#fff' : 'rgba(233,103,90,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tl.cx, tl.cy, 22, 0, 7); ctx.stroke(); }
  if (mine && UI.mode === 'march' && UI.march) { const L = me(), M = UI.march; for (const [vi, cst] of M.cost) { if (vi === L.army.v) continue; const v = G.verts[vi], tgt = M.targets.includes(vi); if (!tgt && v.owner === ME) continue; dot(v.vx, v.vy, tgt ? '#e9675a' : H.vert === v ? '#fff' : '#f4d692', tgt ? 7 : 4); }
    if (H.vert && M.cost.has(H.vert.id)) { const p = pathTo(M, H.vert.id); for (let i = 1; i < p.length; i++) { const a = G.verts[p[i - 1]], b = G.verts[p[i]]; dash(a.vx, a.vy, b.vx, b.vy, '#fff'); } } }
  const items = [];
  for (const v of G.verts) if (v.owner) items.push([v.vy + 12, () => drawSettlement(v), v.vx, 34]);
  for (const t of G.tiles) if (t.mono) items.push([t.cy + 40, () => drawMonument(t), t.cx, 70]);
  items.push([G.tiles[G.robber].cy + 22, drawRobber, G.tiles[G.robber].cx, 30]);
  for (const L of G.lords) if (L.alive && L.army.v >= 0) { const p = armyPos(L); items.push([p[1], () => drawArmy(L), p[0], 34]); }
  for (const s of UI.flocks || []) items.push([s.y, () => drawSheep(s, t), s.x, 8]);
  if (!UI.scene || UI.scene.kind !== 'battle') for (const ag of folkAgents()) { const p = agentPos(ag, t); if (!p) continue; items.push([p.y, () => { shadow(p.x, p.y, 3); spr(folkF(ag.o, ag.who, p.act, p.f), p.x, p.y, p.flip); }, p.x, 6]); }
  if (UI.scene && UI.scene.items) UI.scene.items(items, t);
  occluders(items);
  items.sort((a, b) => a[0] - b[0]).forEach(i => i[1]());
  for (const tl of G.tiles) { if (!tl.num) continue;  }
  drawClouds(ctx);
  drawTokens(ctx);
  if (UI.scene && UI.scene.over) UI.scene.over(ctx, t);
  drawMini(); labels();
}
/* depth: the ground and its trees are painted once, so a tree standing in front of a sheep, a man or a house is painted again over it */
function occGrid() { const W = G.world; if (UI.occ && UI.occ.src === W.items && UI.occ.n === W.items.length) return UI.occ; const cells = new Map();
  for (const it of W.items) { const s = it.spr; if (!s || !s.img || it.banner || it.fn || s.img.height < 12 || s.img.width > 60) continue; const k = (it.x >> 6) + ',' + (it.y >> 6); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(it); }
  return (UI.occ = { src: W.items, n: W.items.length, cells }); }
function occluders(items) { const O = occGrid(), seen = new Set(), add = [];
  for (const [y, , x, r] of items) { if (x == null) continue; for (let cx = (x - r - 40) >> 6; cx <= (x + r + 40) >> 6; cx++) for (let cy = (y) >> 6; cy <= (y + 70) >> 6; cy++) { const L = O.cells.get(cx + ',' + cy); if (!L) continue;
      for (const it of L) { if (seen.has(it) || it.y <= y) continue; const s = it.spr, h = s.img.height, w = s.img.width; if (it.y - h > y + 2 || Math.abs(it.x - x) > w / 2 + r) continue; seen.add(it); add.push([it.y, () => drawStatic(it)]); } } }
  items.push(...add); }
function drawStatic(it) { const s = it.spr, ctx = CTX; if (it.flip) { ctx.save(); ctx.translate(it.x * 2 + 1, 0); ctx.scale(-1, 1); ctx.drawImage(s.img, it.x + s.ox, it.y + s.oy); ctx.restore(); } else ctx.drawImage(s.img, it.x + s.ox, it.y + s.oy); }
/* number tokens: drawn last, over every house, tree and flock */
let TOKEN_K = 1.5; const TOKS = {};
function tokenDisc(K, gold) { const key = K + (gold ? 'g' : ''); if (TOKS[key]) return TOKS[key]; const P = gold ? ['#d9a92e', '#fff1b8', '#f6d25c'] : ['#c8b98a', '#f6eedc', '#e8dcc0']; const r = Math.round(13 * K), S = 2 * r + 6, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'), o = r + 2;
  for (let y = -r - 1; y <= r + 3; y++) for (let x = -r - 1; x <= r + 1; x++) { const d = Math.hypot(x, y), d2 = Math.hypot(x - 1, y - 3); let col = null;
    if (d <= r) col = d > r - 1.2 ? '#2a2018' : (y > 3 * K && bay(x + 16, y + 16) < .5) ? P[0] : (y < -6 * K && bay(x + 16, y + 16) < .3) ? P[1] : P[2]; else if (d2 <= r) col = 'rgba(10,8,5,.35)';
    if (col) { g.fillStyle = col; g.fillRect(o + x, o + y, 1, 1); } } return (TOKS[key] = { c, o }); }
function drawTokens(ctx) { const D0 = tokenDisc(TOKEN_K), DG = tokenDisc(TOKEN_K, true), K = TOKEN_K, n = G.dice && G.phase !== 'roll' ? G.dice[0] + G.dice[1] : 0, R = Math.round(13 * K) + 3.5; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineCap = 'butt';
  for (const t of G.tiles) { if (!t.num) continue; const cx = Math.round(t.cx), cy = Math.round(t.cy), D = t.num === n && G.robber !== t.i ? DG : D0;
    const own = []; for (const vi of t.verts) { const v = G.verts[vi]; if (v.owner) for (let i = 0; i < v.level; i++) own.push(v.owner); }   // who harvests here: one share of the ring per village, two per town
    if (own.length) { own.sort(); const gap = own.length > 1 ? .14 : 0; ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + .5, cy + .5, R, 0, 6.2832); ctx.stroke();
      own.forEach((o, i) => { const a0 = -Math.PI / 2 + i / own.length * 6.2832 + gap / 2, a1 = -Math.PI / 2 + (i + 1) / own.length * 6.2832 - gap / 2; ctx.strokeStyle = TCOL[o]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + .5, cy + .5, R, a0, a1); ctx.stroke(); }); }
    ctx.drawImage(D.c, cx - D.o, cy - D.o);
    const x = cx + .5, y = cy - .5; ctx.font = `600 ${15 * K}px "Pixelify Sans"`; ctx.fillStyle = (t.num === 6 || t.num === 8) ? '#b8322a' : '#2a2018'; ctx.fillText(t.num, x, y);
    const pips = 6 - Math.abs(7 - t.num); for (let k = 0; k < pips; k++) ctx.fillRect(x + (k - (pips - 1) / 2) * 3 * K - K * .5, y + 7 * K, K * 1.5, K * 1.5); } }
/* the open sea beyond the edge of the map: painted by the map's own deep-water rule, in world space, so it runs on from the map's water without a seam */
const SEA_CH = 256, SEA_CACHE = new Map();
function seaChunk(cx, cy) { const key = cx + ',' + cy; let c = SEA_CACHE.get(key); if (c) return c; c = document.createElement('canvas'); c.width = c.height = SEA_CH; const g = c.getContext('2d');
  const i0 = cx * SEA_CH / 2, j0 = cy * SEA_CH / 2; for (let j = 0; j < SEA_CH / 2; j++) for (let i = 0; i < SEA_CH / 2; i++) { const I = i0 + i, J = j0 + j, n = fbm(I * 2 * .018, J * 2 * .018, 3);
    g.fillStyle = hash(I >> 1, J, 991) < .004 ? '#3e6a96' : tone(SEA.deep, n * .55, I, J); g.fillRect(i * 2, j * 2, 2, 2); }
  if (SEA_CACHE.size > 160) SEA_CACHE.delete(SEA_CACHE.keys().next().value); SEA_CACHE.set(key, c); return c; }
function drawSea(ctx, cam) { const W = UI.static.width, H = UI.static.height, x0 = Math.floor(cam.x / SEA_CH) - 1, y0 = Math.floor(cam.y / SEA_CH) - 1, x1 = Math.ceil((cam.x + innerWidth / cam.z) / SEA_CH), y1 = Math.ceil((cam.y + innerHeight / cam.z) / SEA_CH);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const X = cx * SEA_CH, Y = cy * SEA_CH; if (X >= 0 && Y >= 0 && X + SEA_CH <= W && Y + SEA_CH <= H) continue; ctx.drawImage(seaChunk(cx, cy), X, Y); } }
/* choosing a charter, before the first village */
const CHARTER_WAIT = 10;
const charterWho = () => { if (!G.setup || G.setup.step !== 'charter') return null; if (UI.net) { const Q = lord(NET.seat); return Q && Q.human && !Q.chose ? Q : null; } return G.lords.find(Q => Q.human && !Q.chose) || null; };
function charterPick() { let el = $('charters'); const L = G.phase === 'setup' && !UI.curtain ? charterWho() : null;
  if (!L) { if (el) el.style.display = 'none'; return; } if (!el) { el = document.createElement('div'); el.id = 'charters'; document.body.appendChild(el); } el.style.display = '';
  if (!UI.chT0) { UI.chT0 = Date.now(); clearInterval(UI.chTick); UI.chTick = setInterval(() => { if (!charterWho()) return clearInterval(UI.chTick); charterPick(); if (Date.now() - UI.chT0 > CHARTER_WAIT * 1000 + 600) clearInterval(UI.chTick); }, 250); }
  const left = Math.max(0, Math.ceil(CHARTER_WAIT - (Date.now() - UI.chT0) / 1000)), locked = left > 0;
  const taken = k => G.lords.find(Q => Q.charter === k && Q.chose), gone = UI.chSel && UI.chSel !== 'none' && taken(UI.chSel);
  const key = L.id + ':' + G.setup.cn + ':' + (UI.chSel || '') + ':' + left; if (el._k === key) return; el._k = key; const sel = UI.chSel || 'none';
  const card = (k, t, boon, pen) => { const T = k !== 'none' && taken(k); return `<div class="sc${sel === k && !locked ? ' on' : ''}${T ? ' taken' : ''}${locked ? ' lock' : ''}" data-ch="${T || locked ? '' : k}">${T ? `<span class="who" style="background:${COLS[T.id]}">${esc2(lordName(T.id))} took it</span>` : sel === k && !locked ? `<span class="who" style="background:${COLS[L.id]}">Your pick</span>` : ''}<div class="t">${t}</div><div class="boon">${boon}</div><div class="pen">${pen}</div></div>`; };
  const waiting = G.lords.filter(Q => Q.human && !Q.chose).length;
  el.innerHTML = `<div class="chbox"><h2>${sharedDevice() ? esc2(lordName(L.id)) + ', choose' : 'Choose'} your charter</h2><div class="sub">${locked ? `Read them over. Charters open in <b class="chcount">${left}</b>` : 'Every charter bends one rule your way and one against you. Everyone sees what you took.'}</div><div class="sgrid">${card('none', 'The Old Ways', 'Play by the plain rules.', 'Nothing bent either way.')}${Object.entries(CHARTERS).map(([k, c]) => card(k, c.name, c.boon, c.pen)).join('')}</div>
    <div class="sbar"><span>${sharedDevice() ? 'Players take turns at this screen; computer lords choose last.' : 'Everyone chooses at once: the first to confirm a charter gets it. Computer lords choose last.'} ${waiting > 1 ? waiting + ' players still choosing.' : ''}</span><button class="btn big war" id="chgo" ${locked || gone ? 'disabled' : ''}>${locked ? 'Opens in ' + left : gone ? 'Taken: choose another' : sel === 'none' ? 'Keep to the old ways' : 'Take the ' + CHARTERS[sel].name + ' charter'}</button></div></div>`;
  el.querySelectorAll('[data-ch]').forEach(d => d.onclick = () => { if (!d.dataset.ch) return; UI.chSel = d.dataset.ch; charterPick(); });
  $('chgo').onclick = () => { if (Date.now() - UI.chT0 < CHARTER_WAIT * 1000 || gone) return; const k = UI.chSel || 'none'; UI.chSel = null; el._k = null; send({ type: 'charter', k, by: L.id }); }; }
const TCOLR = { forest: '#3a6e33', hill: '#a5603e', pasture: '#74b355', field: '#d0b04c', mountain: '#8a837b', desert: '#d6bf86' }, TLAB = { forest: 'Forest', hill: 'Clay hills', pasture: 'Pasture', field: 'Fields', mountain: 'Mountains', desert: 'Waste' };
function geoUI() { let el = $('geo'); const g = G.geo, show = g && canAct(g.who) && !UI.scene && !UI.curtain && !G.winner;
  if (!show) { if (el) el.style.display = 'none'; UI.geoSel = null; UI.geoS = null; return; } if (!el) { el = document.createElement('div'); el.id = 'geo'; el.className = 'gl'; document.body.appendChild(el); } el.style.display = '';
  const L = lord(g.who), T = g.free ? [] : geoBurnable(L).sort((a, b) => pips(G.tiles[b].num) - pips(G.tiles[a].num)), sel = UI.geoSel, ss = UI.geoS, key = JSON.stringify([g, sel, ss, T]); if (el._k === key) return; el._k = key;
  const pipsOf = n => '<span class="gp">' + '•'.repeat(6 - Math.abs(7 - n)) + '</span>';
  const who = ti => { const c = {}; for (const vi of G.tiles[ti].verts) { const v = G.verts[vi]; if (v.owner) c[v.owner] = (c[v.owner] || 0) + v.level; } return Object.entries(c).map(([o, n]) => `<i class="gw" style="background:${TCOL[o]}" title="${esc2(lordName(o))}">${n > 1 ? n : ''}</i>`).join(''); };
  el.innerHTML = `<div class="gh">The sea gives up new land</div><div class="dim" style="font-size:12px;margin-bottom:8px">Choose what rises beside your new village.</div>
    <div class="gopts">${g.opts.map((o, i) => `<button class="gopt${sel === i ? ' on' : ''}" data-gi="${i}"><span class="ghex" style="background:${TCOLR[o.type]}">${icon(YIELD[o.type], 4)}</span><b>${TLAB[o.type]}</b><span class="gnum${o.num === 6 || o.num === 8 ? ' red' : ''}">${o.num}</span>${pipsOf(o.num)}</button>`).join('')}</div>
    ${g.free ? '<div class="dim" style="font-size:12px;margin-top:10px">A founding gift: no land withers this time.</div>' : `<div class="gh" style="font-size:14px;margin-top:12px">…and one land withers</div><div class="dim" style="font-size:12px;margin-bottom:6px">Choose a land beside one of your settlements to turn to waste. Whoever else harvests it loses it too.</div>
    <div class="gsets">${T.length ? T.map(ti => { const t = G.tiles[ti]; return `<button class="gset${ss === ti ? ' on' : ''}" data-gs="${ti}"><span class="gch"><i style="background:${TCOLR[t.type]}">${t.num}</i> ${TLAB[t.type]}</span><span class="gch">${who(ti)}</span></button>`; }).join('') : '<div class="dim">You have no land left to lose.</div>'}</div>`}
    <button class="btn big war" id="geogo" style="width:100%;margin-top:10px" ${sel == null || (ss == null && T.length) ? 'disabled' : ''}>${sel == null ? 'Choose a land' : ss == null && T.length ? 'Choose the land that withers' : 'Raise the ' + TLAB[g.opts[sel].type].toLowerCase()}</button>${g.free ? '' : '<button class="btn" id="geono" style="width:100%;margin-top:6px">Leave the sea be</button>'}`;
  el.querySelectorAll('[data-gi]').forEach(b => b.onclick = () => { UI.geoSel = +b.dataset.gi; geoUI(); });
  el.querySelectorAll('[data-gs]').forEach(b => { b.onclick = () => { UI.geoS = +b.dataset.gs; geoUI(); }; b.onmouseenter = () => { UI.geoHov = +b.dataset.gs; }; b.onmouseleave = () => { UI.geoHov = null; }; });
  $('geogo').onclick = () => { if (UI.geoSel == null || (UI.geoS == null && T.length)) return; send({ type: 'geo', pick: UI.geoSel, t: UI.geoS == null ? -1 : UI.geoS }); UI.geoSel = null; UI.geoS = null; el.style.display = 'none'; };
  const no = $('geono'); if (no) no.onclick = () => { send({ type: 'geo', pick: -1, t: -1 }); UI.geoSel = null; UI.geoS = null; el.style.display = 'none'; }; }
// where the new land will rise, while a Geomancer chooses
function drawGeo(ctx) { const g = G.geo; if (!g) return; const [cx, cy] = hexXY(g.at[0], g.at[1]), s = G.world.s, t = performance.now() / 1000, o = UI.geoSel != null && canAct(g.who) ? g.opts[UI.geoSel] : null;
  ctx.beginPath(); for (let k = 0; k < 6; k++) { const [x, y] = G.world.vis(cx + s * .96 * Math.cos((60 * k - 90) * Math.PI / 180), cy + s * .96 * Math.sin((60 * k - 90) * Math.PI / 180)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath();
  if (o) { ctx.globalAlpha = .45; ctx.fillStyle = TCOLR[o.type]; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 12; ctx.strokeStyle = 'rgba(255,248,220,.9)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
  const hv = UI.geoHov != null ? UI.geoHov : UI.geoS; if (hv != null && canAct(g.who)) { for (const ti of [hv]) { const T = G.tiles[ti]; ctx.strokeStyle = '#e9675a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(T.cx, T.cy, 30 + Math.sin(t * 5) * 2, 0, 7); ctx.stroke(); } } }
function afkUI() { let el = $('afk'); if (!G.lords || G.winner) { if (el) el.style.display = 'none'; return; } if (!el) { el = document.createElement('div'); el.id = 'afk'; document.body.appendChild(el); }
  const C = curL(), key = G.round + ':' + G.cur; if (UI.turnKey !== key) { UI.turnKey = key; UI.turnT0 = Date.now(); UI.hurrySent = false; }
  const mine = UI.net ? NET.seat : (UI.autoSeat && lord(UI.autoSeat) && lord(UI.autoSeat).auto ? UI.autoSeat : meId()), M = lord(mine); if (!M) return;
  const wait = Math.max(0, HURRY_AFTER - (Date.now() - UI.turnT0) / 1000), H = G.hurry && G.hurry.who === C.id ? G.hurry : null, voted = H && H.votes.includes(mine);
  let hb; if (!UI.net) hb = ''; else if (C === M) hb = `<button class="btn" disabled>Hurry <small>not on your turn</small></button>`; else if (!C.human) hb = `<button class="btn" disabled>Hurry <small>${C.auto ? 'on autoplay' : 'no one to hurry'}</small></button>`;
  else if (!M.human) hb = `<button class="btn" disabled>Hurry</button>`; else if (H && H.go) hb = `<button class="btn on" disabled>Timer running</button>`; else if (voted) hb = `<button class="btn on" disabled>You voted <small>${H.votes.length} of ${hurryNeed()}</small></button>`;
  else if (wait > 0) hb = `<button class="btn" disabled>Hurry <small>in ${Math.floor(wait / 60)}:${String(Math.ceil(wait % 60) % 60).padStart(2, '0')}</small></button>`; else hb = `<button class="btn" id="hurryb">Hurry${H ? ` <small>${H.votes.length} of ${hurryNeed()}</small>` : ''}</button>`;
  const ab = M.auto ? `<button class="btn warn" id="autob">Autoplay on <small>take back</small></button>` : `<button class="btn" id="autob" ${M.human ? '' : 'disabled'}>Autoplay</button>`;
  const html = hb + ab; if (el._h !== html) { el._h = html; el.innerHTML = html; const h = $('hurryb'); if (h) h.onclick = () => send({ type: 'hurry', by: mine }); $('autob').onclick = () => { if (M.auto) send({ type: 'auto', on: false, by: mine }); else { UI.autoSeat = mine; send({ type: 'auto', on: true, by: mine }); } }; }
  const mn = $('mini').getBoundingClientRect(); el.style.bottom = (innerHeight - mn.top + 8) + 'px'; el.style.right = (innerWidth - mn.right) + 'px'; el.style.width = mn.width + 'px'; el.style.display = '';
  // the countdown
  let bar = $('hurrybar'); if (!(H && H.go)) { if (bar) bar.style.display = 'none'; UI.hurryKey = null; return; }
  if (UI.hurryKey !== key) { UI.hurryKey = key; UI.hurryT0 = Date.now(); } if (UI.scene) UI.hurryT0 = Date.now() - Math.min(Date.now() - UI.hurryT0, (HURRY_SECS - 5) * 1000);
  const left = Math.max(0, HURRY_SECS - (Date.now() - UI.hurryT0) / 1000); if (!bar) { bar = document.createElement('div'); bar.id = 'hurrybar'; document.body.appendChild(bar); } bar.style.display = '';
  const me2 = C.id === mine; bar.innerHTML = (me2 ? `The others want you to move along. Your turn ends in <b>0:${String(Math.ceil(left)).padStart(2, '0')}</b>.` : `${H.votes.length} of ${hurryNeed()} lords voted to hurry <b style="color:${LIGHT[C.id]}">${esc2(lordName(C.id))}</b>. Their turn ends in <b>0:${String(Math.ceil(left)).padStart(2, '0')}</b> unless they play.`) + `<div class="tb"><i style="width:${left / HURRY_SECS * 100}%"></i></div>`;
  const hr = $('hereb'); if (hr) hr.onclick = () => send({ type: 'here', by: mine });
  if (left <= 0 && !UI.hurrySent && H.votes.includes(mine)) { UI.hurrySent = true; send({ type: 'hurryEnd', by: mine }); } }
setInterval(() => { try { if (G && G.lords) afkUI(); } catch (e) {} }, 300);
function labels() { const ov = $('ov'); let h = '';
  for (const L of G.lords) { if (!L.alive || L.army.v < 0 || (UI.scene && UI.scene.hide && UI.scene.hide.includes(L.id))) continue; const [x, y] = armyPos(L), [X, Y] = toScreen(x, y - 38); h += `<div class="badge" style="left:${X}px;top:${Y}px"><i style="background:${COLS[L.id]}"></i>${L.hero.wounded ? '<span class="dim">✚</span>' : '♛'} ${hostSize(L)}${L.army.units.cata ? ' · ●' + L.army.units.cata : ''}</div>`; }
  if (UI.scene && UI.scene.labels) h += UI.scene.labels();
  ov.innerHTML = h; }
let lastT = performance.now();
function loop() { if (window.TABLE_AWAY) { requestAnimationFrame(loop); return; } document.body.classList.toggle('inscene', !!UI.scene); const now = performance.now(), dt = Math.min(.1, (now - lastT) / 1000); lastT = now; if (G.lords) stepFlocks(dt); if (UI.scene && UI.scene.step) UI.scene.step(dt); if (UI.demo && G.world) demoPan(); if (UI.static && G.lords) render(dt); requestAnimationFrame(loop); }

/* ---------- input ---------- */
function pick(wx, wy) {
  let vert = null, vd = 18; for (const v of G.verts) { const d = Math.hypot(v.vx - wx, v.vy - wy); if (d < vd) { vd = d; vert = v; } }
  let town = null; for (const v of G.verts) if (v.owner && Math.abs(wx - v.vx) < 32 && wy > v.vy - 44 && wy < v.vy + 22) { if (!town || Math.hypot(v.vx - wx, v.vy - wy) < Math.hypot(town.vx - wx, town.vy - wy)) town = v; }
  const ME = G.lords && meId(), want = !G.lords || !myTurn() ? null : G.phase === 'setup' && G.setup.step === 'road' ? canStartRoad : (UI.mode === 'road' || UI.mode === 'freeroad') ? e => e.tiles.length && canRoad(ME, e) : UI.mode === 'walls' ? e => canWall(ME, e) || canMend(ME, e) || sideToMend(ME, e) : null;
  let edge = null, ed = want ? 46 : Math.max(20, 14 / UI.cam.z); for (const e of G.edges) { if (want && !want(e)) continue; const A = G.verts[e.a], B = G.verts[e.b], q = segQ(A.vx, A.vy, B.vx, B.vy, 0, wx, wy), d = q.d + (want ? 0 : Math.abs(q.s / (Math.hypot(B.vx - A.vx, B.vy - A.vy) || 1) - .5) * 14); if (d < ed) { ed = d; edge = e; } }
  const t = G.world.cellTile(wx, wy); let army = null; for (const L of G.lords) { if (!L.alive || L.army.v < 0) continue; const [x, y] = armyPos(L); if (Math.abs(wx - x) < 26 && wy > y - 30 && wy < y + 20) army = L; }
  return { vert, edge, town, tile: t ? t.i : null, army }; }
function bindInput() {
  const cv = $('cv'); let down = null;
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, cx: UI.cam.x, cy: UI.cam.y, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 5) down.moved = true; if (down.moved) { UI.camGoal = null; UI.cam.x = down.cx - dx / UI.cam.z; UI.cam.y = down.cy - dy / UI.cam.z; clampCam(); return; } } if (!G.world) return; UI.mouse = toWorld(e.clientX, e.clientY); if (!UI.scene) { UI.hover = pick(...UI.mouse); cv.style.cursor = UI.hover.army || UI.hover.town || UI.mode !== 'idle' ? 'pointer' : ''; } });
  cv.addEventListener('pointerup', e => { if (down && !down.moved && G.world) clickAt(e.clientX, e.clientY); down = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); if (!G.world) return; const [wx, wy] = toWorld(e.clientX, e.clientY); UI.camGoal = null; const Z = zLevels(), i = Z.reduce((b, z, j) => Math.abs(z - UI.cam.z) < Math.abs(Z[b] - UI.cam.z) ? j : b, 0); UI.cam.z = Z[Math.max(0, Math.min(Z.length - 1, i + (e.deltaY < 0 ? 1 : -1)))]; UI.cam.x = wx - e.clientX / UI.cam.z; UI.cam.y = wy - e.clientY / UI.cam.z; clampCam(); }, { passive: false });
  $('mini').addEventListener('click', e => { const r = $('mini').getBoundingClientRect(), k = W0 / r.width; UI.camGoal = null; centerOn((e.clientX - r.left) * k, (e.clientY - r.top) * k); });
  addEventListener('keydown', e => { if (e.target && /TEXTAREA|INPUT/.test(e.target.tagName)) return; if (chatOn() && (e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); return CHAT.open ? chatClose() : chatOpen(); } if (CHAT.open && e.key === 'Escape') return chatClose(); if (UI.scene && UI.scene.key) return UI.scene.key(e); if (G.lords && e.key === 'Tab') { e.preventDefault(); UI.lordsOpen = !UI.lordsOpen; hud(); return; } if (!G.lords || !myTurn()) return; if (e.key === 'Tab') { e.preventDefault(); UI.lordsOpen = !UI.lordsOpen; hud(); return; } if (e.key === 'Escape') { UI.mode = UI.mode === 'freeroad' ? 'freeroad' : 'idle'; UI.sel = null; hud(); } if (e.key === 'Enter') act(G.phase === 'roll' ? 'roll' : 'end'); if (e.key === ' ' && G.phase === 'roll') { e.preventDefault(); act('roll'); } });
}
function clickAt(sx, sy) {
  const [wx, wy] = toWorld(sx, sy); if (UI.scene && UI.scene.click) return UI.scene.click(wx, wy);
  const h = pick(wx, wy), ME = meId(), L = me();
  if (parchMine()) { const T = h.tile != null && G.tiles[h.tile]; if (!T || T.type === 'desert') return UI.toast('Click a land that is not already desert.'); return send({ type: 'parch', t: h.tile }); }
  if (robMine()) { const R = robberOf(); if (h.tile == null || h.tile === G.robber) return UI.toast('Click a tile for the outlaws (not where they are now).'); const opts = robTargets(R, h.tile); if (opts.length > 1) return robChoice(h.tile, opts); return send({ type: 'robber', tile: h.tile, victim: opts[0] ? opts[0].id : null, by: R.id }); }
  if (myTurn()) {
    if (G.phase === 'setup') { if (G.setup.step === 'village') { const v = h.vert; if (!v || !canStartVillage(v)) return UI.toast('Pick a lit corner: two corners apart from any village, not on the waste.'); return send({ type: 'setupV', v: v.id }); }
      const e = h.edge; if (G.geo && G.geo.who === meId()) return UI.toast('First choose the land that rises from the sea.'); if (!e || !canStartRoad(e)) return UI.toast('Pick one of the lit roads leading out of your new village.'); return send({ type: 'setupR', e: e.id }); }
    if (G.phase === 'robber') return UI.toast(G.robBy ? 'The Bandit Lord is moving the outlaws.' : 'Click a tile for the outlaws.');
    if (UI.mode === 'freeroad' || UI.mode === 'road') { if (!h.edge || !canRoad(ME, h.edge)) return; if (UI.mode === 'freeroad') { send({ type: 'free', e: h.edge.id }); if (L.freeRoads <= 1) UI.mode = 'idle'; return; } if (!canPay(L, COST.road)) return UI.toast('Not enough for a road.'); send({ type: 'build', k: 'road', id: h.edge.id }); return; }
    if (UI.mode === 'village') { if (!h.vert || !canVillage(ME, h.vert)) return; UI.mode = 'idle'; return send({ type: 'build', k: 'village', id: h.vert.id }); }
    if (UI.mode === 'walls') { const e = h.edge; if (!e) return; if (!canMend(ME, e) && sideToMend(ME, e)) { if (!canPay(L, COST.mend)) return UI.toast('Mending the ring takes a clay.'); return send({ type: 'build', k: 'mendSide', id: e.id }); } if (canMend(ME, e)) { if (!canPay(L, COST.mend)) return UI.toast('Mending a wall takes a clay.'); return send({ type: 'build', k: 'mend', id: e.id }); }
      if (!canWall(ME, e)) return UI.toast(wallsOf(ME).length >= WALL_MAX ? `You have all ${WALL_MAX} wall sections.` : 'Pick a lit border: one touching your roads, villages or towns.'); if (!canPay(L, COST.walls)) return UI.toast('Not enough for a wall.'); return send({ type: 'build', k: 'walls', id: e.id }); }
    if (UI.mode === 'monument') { const t = h.tile != null ? G.tiles[h.tile] : null; if (!t || !canMonument(ME, t)) return UI.toast('Pick a lit tile: one only your villages and towns touch.'); if (!canPay(L, monoCost(L))) return UI.toast('Not enough for a monument.'); UI.mode = 'idle'; return send({ type: 'monument', t: t.i }); }
    if (UI.mode === 'town') { const v = h.town || h.vert; if (!v) return; const k = UI.mode; UI.mode = 'idle'; return send({ type: 'build', k, id: v.id }); }
    if (UI.mode === 'march') { const M = UI.march, v = h.vert || (h.town && M.cost.has(h.town.id) ? h.town : null); if (v && M.cost.has(v.id) && v.id !== L.army.v) { UI.mode = 'idle'; UI.sel = null; return send({ type: 'march', v: v.id }); } if (h.army === L) { UI.mode = 'idle'; hud(); } return; }
  }
  if (h.army && h.army.id === ME) { UI.sel = { lord: h.army }; hud(); return; }
  if (h.army) { UI.sel = { foe: h.army }; hud(); return; }
  if (h.town) { UI.sel = { vert: h.town }; hud(); return; }
  UI.sel = h.tile != null ? { tile: h.tile } : null; hud();
}
UI.ver = 0;

/* ---------- HUD ---------- */
function dk(k, label, glyph, cost, ok, on) { return `<button class="dk${on ? ' on' : ''}" data-act="${k}" ${ok ? '' : 'disabled'}><i>${glyph}</i>${label}<span class="cost">${cost ? costHTML(cost) : ''}</span></button>`; }
const BOATPX = ['.....m.....', '....wm.....', '...wwm.....', '..wwwm.....', '.....m.....', 'hhhhhhhhhhh', '.hHHHHHHHh.', '..hhhhhhh..'];
function pxArt(g, x, y, k, rows, pal) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (!c) continue; g.fillStyle = c; g.fillRect(Math.round(x + i * k), Math.round(y + j * k), k, k); } }); }
function drawPorts(g) { if (!G.ports) return; const t = performance.now() / 1000;
  for (const p of G.ports) { if (p.v == null) continue; const V = G.verts[p.v]; let cx = 0, cy = 0; for (const ti of V.tiles) { cx += G.tiles[ti].cx; cy += G.tiles[ti].cy; } cx /= V.tiles.length; cy /= V.tiles.length;
    const ang = Math.atan2(V.vy - cy, V.vx - cx), mx = V.vx, my = V.vy, H = portHolder(p), fc = H ? COLS[H.id] : '#a69c86';
    g.save(); g.translate(Math.round(mx), Math.round(my)); g.rotate(ang); g.fillStyle = 'rgba(10,20,30,.35)'; g.fillRect(10, -5, 44, 13); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#8a5f34' : '#b0844e'; g.fillRect(10 + i * 5.5, -6, 5, 12); g.fillStyle = '#4a3220'; g.fillRect(10 + i * 5.5, 5, 5, 1.5); } g.fillStyle = '#3a2814'; for (const px of [14, 31, 50]) { g.fillRect(px, -8, 2.5, 3); g.fillRect(px, 6, 2.5, 4); } g.restore();
    const bob = Math.sin(t * 1.6 + p.v) * 1, bx = mx + Math.cos(ang) * 46 + Math.cos(ang + 1.57) * 17, by = my + Math.sin(ang) * 46 + Math.sin(ang + 1.57) * 17 + bob; pxArt(g, bx - 11, by - 16, 2, BOATPX, { m: '#3a2814', w: '#f3eedf', h: '#3a2814', H: fc });
    g.strokeStyle = H ? fc : 'rgba(255,248,220,.85)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(V.vx, V.vy, 14, 0, 7); g.stroke(); g.setLineDash([]);
    if (UI.cam.z >= .9) { const tx = mx + Math.cos(ang) * 74, ty = my + Math.sin(ang) * 74 + 16; g.font = '600 10px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; const tw = g.measureText(p.name).width + 10; g.fillStyle = 'rgba(10,14,20,.72)'; g.fillRect(Math.round(tx - tw / 2), Math.round(ty - 7), Math.round(tw), 14); g.fillStyle = H ? LIGHT[H.id] : '#e8dcc0'; g.fillText(p.name + (H ? '' : ' · 3:1'), tx, ty + .5); } } }
// light and atmosphere: slow cloud shadows over the isle (the warm light and the dark edges are a fixed layer over the map, #atmo)
let CLOUD = null;
function drawClouds(g) { if (!CLOUD) { CLOUD = document.createElement('canvas'); CLOUD.width = 420; CLOUD.height = 220; const c = CLOUD.getContext('2d'); c.filter = 'blur(22px)'; c.fillStyle = 'rgb(8,16,36)'; for (const [x, y, w, h] of [[150, 110, 100, 46], [250, 95, 90, 40], [210, 130, 120, 38], [120, 85, 60, 28]]) { c.beginPath(); c.ellipse(x, y, w, h, -.2, 0, 7); c.fill(); } }
  const t = performance.now() / 1000, span = W0 + 1400; g.save(); g.globalAlpha = .2; g.imageSmoothingEnabled = true;
  for (let i = 0; i < 6; i++) { const k = 1.6 + (i % 3) * .5, x = ((i * 733 + t * (7 + i % 3 * 2)) % span) - 700, y = ((i * 419) % (H0 + 300)) - 150 + Math.sin(t * .05 + i) * 30; g.drawImage(CLOUD, x, y, CLOUD.width * k, CLOUD.height * k); }
  g.restore(); g.imageSmoothingEnabled = false; }
function cornerUI() { let b = $('roadColB'); if (!b) { try { UI.roadCol = localStorage.getItem('crown-roadcol') === '1'; } catch (e) {} b = document.createElement('button'); b.id = 'roadColB'; b.className = 'btn'; b.title = 'Paint each road in its owner’s colour';
    b.onclick = () => { UI.roadCol = !UI.roadCol; try { localStorage.setItem('crown-roadcol', UI.roadCol ? '1' : '0'); } catch (e) {} if (G.lords) buildRoads(); cornerUI(); }; $('corner').prepend(b); if (UI.roadCol && G.lords) buildRoads(); }
  b.classList.toggle('on', !!UI.roadCol); b.innerHTML = `<i class="rcsw"></i>Road colours`; b.style.display = G.lords ? '' : 'none'; }
/* ---------- table talk: a chat everyone sees, and whispers between two lords (online only; never part of the game state) ---------- */
const CHAT = { open: false, tab: 'all', msgs: { all: [] }, unread: {} };
const chatOn = () => !!(UI.net && G.lords && NET.seat);
function chatGot(from, to, text) { const tab = to ? (from === NET.seat ? to : from) : 'all'; const box = CHAT.msgs[tab] = CHAT.msgs[tab] || []; box.push([from, String(text).slice(0, 240), !!to]); if (box.length > 150) box.shift();
  if (from !== NET.seat && !(CHAT.open && CHAT.tab === tab)) { CHAT.unread[tab] = (CHAT.unread[tab] || 0) + 1; if (to) chatPop(from, text); }
  chatDraw(); chatBadges(); }
function chatSend(text) { text = String(text || '').trim().slice(0, 240); if (!text || !chatOn()) return; const to = CHAT.tab === 'all' ? null : CHAT.tab;
  if (NET.role === 'host') chatRoute(NET.seat, to, text); else { netSend(NET.links.host, { t: 'chat', to, text }); chatGot(NET.seat, to, text); } }
function chatRoute(from, to, text) { const m = { t: 'chat', from, to, text };   // the host carries every message to whoever should see it
  if (!to) { for (const k in NET.links) { const L = NET.links[k]; if (k !== from && L.state === 'open' && !L.pending) netSend(L, m); } chatGot(from, null, text); return; }
  if (to === NET.seat || from === NET.seat) chatGot(from, to, text); const L = NET.links[to]; if (to !== NET.seat && L && L.state === 'open') netSend(L, m); }
function chatPop(from, text) { let p = $('chatpop'); if (!p) { p = document.createElement('div'); p.id = 'chatpop'; p.className = 'gl'; document.body.appendChild(p); p.onclick = () => { chatOpen(p.dataset.from); p.style.display = 'none'; }; }
  p.dataset.from = from; p.innerHTML = `<b style="color:#d9b2ef">${PNM(from)} whispers</b> ${esc2(text)}`; p.style.display = ''; clearTimeout(UI.popT); UI.popT = setTimeout(() => { p.style.display = 'none'; }, 6000); }
function chatOpen(tab) { CHAT.open = true; if (tab) CHAT.tab = tab; CHAT.unread[CHAT.tab] = 0; chatDraw(); chatBadges(); setTimeout(() => { const i = $('chatin'); if (i) i.focus(); }, 30); }
function chatClose() { CHAT.open = false; chatDraw(); }
function chatDraw() { let el = $('chat'); if (!chatOn() || !CHAT.open) { if (el) el.style.display = 'none'; return; }
  if (!el) { el = document.createElement('div'); el.id = 'chat'; el.className = 'gl'; document.body.appendChild(el); }
  const tabs = ['all'].concat(G.lords.filter(Q => Q.human && Q.id !== NET.seat).map(Q => Q.id)), T = CHAT.tab, wh = T !== 'all', draft = $('chatin') ? $('chatin').value : '';
  const list = (CHAT.msgs[T] || []).map(([f, t]) => `<div class="cm"><b style="color:${LIGHT[f]}">${f === NET.seat ? 'You' : PNM(f)}</b> ${esc2(t)}</div>`).join('') || `<div class="dim cm">${wh ? 'Nothing whispered yet.' : 'Nothing said yet.'}</div>`;
  el.classList.toggle('wh', wh); el.style.display = '';
  el.innerHTML = `<div class="chh"><b>${wh ? 'Whispers with ' + PNM(T) : 'The table'}</b><span class="dim">C opens · Esc closes</span><button class="chx" title="Close">×</button></div>
    <div class="chtabs">${tabs.map(k => `<button class="btn mini${k === T ? ' on' : ''}${k !== 'all' ? ' w' : ''}" data-ct="${k}">${k === 'all' ? 'Table' : 'Whisper · <span style="color:' + LIGHT[k] + '">' + PNM(k) + '</span>'}${CHAT.unread[k] && k !== T ? '<span class="udot"></span>' : ''}</button>`).join('')}</div>
    <div class="chlist">${list}</div>${wh ? `<div class="dim chnote">Only you and ${PNM(T)} see this. Nobody else is told you are whispering.</div>` : ''}
    <div class="chin"><input id="chatin" maxlength="240" placeholder="${wh ? 'Whisper to ' + PNM(T) + '…' : 'Say something to the table…'}" value="${esc2(draft)}"><button class="btn" id="chatgo">Send</button></div>`;
  const lst = el.querySelector('.chlist'); lst.scrollTop = lst.scrollHeight;
  el.querySelector('.chx').onclick = chatClose; el.querySelectorAll('[data-ct]').forEach(b => b.onclick = () => chatOpen(b.dataset.ct));
  const inp = $('chatin'), go = () => { const t = inp.value; inp.value = ''; chatSend(t); const i2 = $('chatin'); if (i2) i2.focus(); };
  $('chatgo').onclick = go; inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') go(); if (e.key === 'Escape') chatClose(); }; }
function chatBadges() { const n = Object.entries(CHAT.unread).reduce((a, [k, v]) => a + (CHAT.open && CHAT.tab === k ? 0 : v), 0); const b = $('chatB'); if (b) { const d = b.querySelector('.udot'); if (n && !d) b.insertAdjacentHTML('beforeend', '<span class="udot"></span>'); if (!n && d) d.remove(); }
  document.querySelectorAll('.wsp').forEach(w => { const d = w.querySelector('.udot'), u = CHAT.unread[w.dataset.w]; if (u && !d) w.insertAdjacentHTML('beforeend', '<span class="udot"></span>'); if (!u && d) d.remove(); }); }
function chatUI() { cornerUI(); if (!chatOn()) { chatDraw(); return; } const dock = $('dock'); if (dock && !$('chatB')) { dock.insertAdjacentHTML('beforeend', `<span class="sep"></span><button class="dk" id="chatB" title="Chat (C)"><i><svg width="16" height="14" viewBox="0 0 14 12"><path d="M1 1h12v7H6l-3 3V8H1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></i>Chat<span class="cost"></span></button>`); $('chatB').onclick = () => CHAT.open ? chatClose() : chatOpen(); }
  chatBadges(); }
function hud() { hud0(); chatUI(); }
function hud0() {
  if (!G.lords) return; const ME = meId(), L = me(), mine = myTurn(), main = mine && G.phase === 'main', cur = curL(); if (G.phase !== 'setup') charterPick(); geoUI();
  $('clock').innerHTML = `Round <b>${G.round}</b> · ${mine ? '<span class="gold">' + (sharedDevice() ? PNM(cur.id) + "'s turn" : 'your turn') + '</span>' : pn(cur.id) + ' is moving'}`;
  $('dice').innerHTML = G.dice ? G.dice.map(n => `<span class="die">${pipDots(n)}</span>`).join('') + `<span style="margin-left:3px">${G.dice[0] + G.dice[1]}</span>` : '';
  const hide = UI.curtain;
  $('res').innerHTML = hide ? '' : `<span class="who" style="color:${LIGHT[ME]}">${PNM(ME)}</span>`;
  $('folk').innerHTML = hide ? '' : `<span class="gold" title="victory points">★ ${vp(ME)}/${winPts()}</span><span title="${L.hero.name}">♛ ${L.hero.name}${L.hero.wounded ? ' <span class="neg">wounded</span>' : ''}</span>${L.outlaw ? `<span title="the outlaw of the greenwood answers your horn in battle">♣ ${L.outlaw}</span>` : ''}`;
  $('pls').innerHTML = (UI.net ? `<span class="netpill" title="Playing online">⇆ online</span>` : '') + G.lords.map(Q => `<span class="pl${G.cur === Q.i ? ' cur' : ''}${Q.alive ? '' : ' dead'}" title="${Q.human ? 'a player' : 'the computer'} · ${handSize(Q)} goods · ${Q.cards.length + Q.fresh.length} cards · host ${hostSize(Q)}${G.lh.road === Q.id ? ' · Longest Road' : ''}${G.lh.host === Q.id ? ' · Greatest Host' : ''}"><i style="background:${COLS[Q.id]}"></i>${youAre(Q.id) ? 'You' : PNM(Q.id)}${Q.human ? '' : '<span class="dim"> (AI)</span>'} · ★${Q.alive ? vpPublic(Q) : '✕'}${G.lh.road === Q.id ? ' ═' : ''}${G.lh.host === Q.id ? ' ⚑' : ''}</span>`).join('');
  offerPanel(); if (UI.redrawTrade && $('trade').style.display !== 'none') UI.redrawTrade();
  turnBox(); lordsTab(); goodsTray();
  if (G.phase === 'setup') { charterPick(); $('dock').innerHTML = `<div class="dlab" style="width:auto;padding:4px 12px">${G.setup.step === 'charter' ? (charterWho() ? 'Choose your charter' : 'Waiting for the other lords to choose…') : mine ? (G.setup.step === 'village' ? 'Place your ' + (G.setup.n < G.lords.length ? 'first' : 'second') + ' village' : 'Lay a road from it') : pn(cur.id) + ' is settling…'}</div>`; card(); return; }
  const can = c => main && canPay(L, c);
  const playable = c => !CARDS[c].battle && c !== 'chronicle' && main && !L.played;
  const hand = hide ? '' : L.cards.map(c => `<button class="cardp${playable(c) ? ' play' : ''}" data-card="${c}" title="${CARDS[c].desc}" ${playable(c) ? '' : 'disabled'}><i>${CARDS[c].glyph}</i>${CARDS[c].name}</button>`).join('') + L.fresh.map(c => `<span class="cardp new" title="Bought this turn: playable next turn. ${CARDS[c].desc}"><i>${CARDS[c].glyph}</i>${CARDS[c].name}</span>`).join('');
  $('dock').innerHTML =     (UI.mode === 'freeroad' && main ? `<div class="dlab" style="width:auto;padding:4px 10px">${L.freeRoads} free road${L.freeRoads === 1 ? '' : 's'}</div><span class="sep"></span>` : '') +
    dk('road', 'Road', '═', costFor(L, COST.road), can(COST.road), UI.mode === 'road') + dk('village', 'Village', '⌂', COST.village, can(COST.village), UI.mode === 'village') + dk('town', 'Town', '♜', COST.town, can(COST.town), UI.mode === 'town') + dk('walls', 'Walls', '▥', costFor(L, COST.walls), can(COST.walls) || (can(COST.mend) && (wallsOf(ME).some(e => canMend(ME, e)) || G.edges.some(e => sideToMend(ME, e)))), UI.mode === 'walls') + dk('card', 'Fortune', '🂠', COST.card, can(COST.card) && G.deck.length) + (MONUMENTS_ON && (vp(ME) >= winPts() - 5 || monumentsOf(ME).length) ? dk('monument', 'Monument', '♖', monoCost(L), can(monoCost(L)) && G.tiles.some(t => canMonument(ME, t)), UI.mode === 'monument') : '') +
    `<button class="dk" data-act="trade" ${main && !G.offer ? '' : 'disabled'}><i>⇄</i>Trade<span class="cost"></span></button><span class="sep"></span>` +
    `<div class="dlab">${L.deed ? 'Marched<br>✓' : 'One<br>march'}</div>` + dk('march', 'March', '⚑', null, main && !L.deed && hostSize(L) > 0 && L.alive, UI.mode === 'march') +
    `<span class="sep"></span><div class="hand">${hand || '<span class="dim" style="font-size:11px">no cards</span>'}</div>`;
  $('dock').querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act));
  $('dock').querySelectorAll('[data-card]').forEach(b => b.onclick = () => useCard(b.dataset.card));
  card();
}
const vpPublic = Q => vp(Q.id) - (Q.id === meId() ? 0 : Q.cards.filter(c => c === 'chronicle').length + Q.fresh.filter(c => c === 'chronicle').length);
function pipDots(n) { const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n] || []; return P.map(([a, b]) => `<i style="left:${2 + a * 5}px;top:${2 + b * 5}px"></i>`).join(''); }
function act(k) {
  if (!myTurn()) return; const L = me();
  if (k === 'roll') { if (G.phase === 'roll') send({ type: 'roll' }); return; }
  if (G.phase !== 'main') return;
  if (k === 'end') { UI.mode = 'idle'; UI.sel = null; $('trade').style.display = 'none'; send({ type: 'end' }); return; }
  if (['road', 'village', 'town', 'walls', 'monument'].includes(k)) { UI.mode = UI.mode === k ? 'idle' : k; UI.sel = null; hud(); return; }
  if (k === 'card') { send({ type: 'card' }); return; }
  if (k === 'trade') { UI.sel = null; hud(); return tradePanel(); }
  if (k === 'march') { if (UI.mode === 'march') { UI.mode = 'idle'; hud(); return; } UI.march = marchMap(L); UI.mode = 'march'; UI.sel = { lord: L }; const [x, y] = armyPos(L); panTo(x, y); hud(); UI.toast('Click a lit corner to march: <b>two steps along your own roads</b>, or <b>one step</b> anywhere else. Red marks are settlements and hosts you can attack.'); return; }
}
function useCard(c) { const L = me(); if (!myTurn() || G.phase !== 'main' || L.played) return;
  if (c === 'knight') { send({ type: 'play', k: 'knight' }); UI.toast('Knight! A man-at-arms joins your host. Now click a tile to send the outlaws.'); return; }
  if (c === 'roads') { send({ type: 'play', k: 'roads' }); UI.mode = 'freeroad'; UI.toast('Lay two roads for free.'); return; }
  if (c === 'plenty' || c === 'monopoly') { const el = $('card'); el.style.display = ''; el.innerHTML = `<h4>${CARDS[c].name}</h4><div class="small dim">${CARDS[c].desc}</div><div class="pick" style="margin-top:8px">${RES.map(k => `<button class="btn" data-r="${k}">${icon(k, 4)}</button>`).join('')}</div><div id="picked" class="small"></div>`;
    const got = []; el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { got.push(b.dataset.r); if (c === 'monopoly' || got.length === 2) { send({ type: 'play', k: c, arg: c === 'monopoly' ? got[0] : got }); UI.sel = null; hud(); } else $('picked').innerHTML = 'Took ' + RES_NAME[got[0]] + '. One more.'; }); }
}
function robChoice(ti, opts) { const el = $('card'); el.style.display = ''; el.innerHTML = `<h4>Rob whom?</h4>${opts.map(O => `<button class="btn" data-o="${O.id}" style="width:100%;margin-top:4px;display:flex;justify-content:space-between"><span>${pn(O.id)}</span><span class="dim">${handSize(O)} goods</span></button>`).join('')}`; el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { send({ type: 'robber', tile: ti, victim: b.dataset.o, by: robberOf().id }); UI.sel = null; el.style.display = 'none'; }); }
const URLC = {}; function sprURL(s) { if (!s || !s.img) return ''; if (URLC[s.u]) return URLC[s.u]; const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; c.getContext('2d').drawImage(s.img, 0, 0); return (URLC[s.u] = c.toDataURL()); }
const unitImg = (o, k) => k === 'cata' ? (UI.cataURL || (UI.cataURL = (() => { const c = document.createElement('canvas'); c.width = 24; c.height = 20; c.getContext('2d').drawImage(UI.cata.img, 0, 0); return c.toDataURL(); })())) : sprURL(CFX[o === 'neutral' ? 'raider' : o][k][1][k === 'archer' ? 'shoot1' : 'guard']);
function unitRows(o, u) { return ['sword', 'spear', 'archer', 'militia', 'cata'].filter(k => u[k]).map(k => `<div class="urow"><img src="${unitImg(o, k)}"><div><b>${UNIT_NAME[k]}</b> <span class="gold">×${u[k]}</span><div class="dim" style="font-size:11px">${UNIT_NOTE[k]}</div></div></div>`).join('') || '<div class="dim">nobody</div>'; }
function card() {
  const el = $('card'), s = UI.sel, ME = meId(), L = me(); el.style.display = 'none'; if (!s || UI.curtain) return; el.style.display = ''; const mine = myTurn() && G.phase === 'main';
  if (s.lord) { const u = L.army.units, here = G.verts[L.army.v], ok = recruitHere(L);
    el.innerHTML = `<h4>${L.hero.name}'s host <span class="dim">· ${here && here.owner === ME ? 'at your ' + (here.level === 2 ? 'town' : 'village') : 'in the field'}</span></h4>${L.hero.wounded ? '<div class="neg small">Your hero is wounded and sits out ' + L.hero.wounded + ' more turn(s). Heroes never die.</div>' : '<div class="small dim">Your hero fights in the front rank with 5 wounds. If he falls he is only wounded.</div>'}${unitRows(ME, u)}
    <div class="small dim">Marches two steps along your own roads, or one step anywhere else. Rivals' walls bar the way${u.cata ? '; each catapult gets one shot at a wall a turn, and the wall\'s archers shoot back on a miss' : ': only catapults can break them'}.</div>${batterable(L).length || sidesBatterable(L).length ? `<div class="rec" style="margin-top:6px">${sidesBatterable(L).map(([v, e]) => `<button class="btn war" data-bring="${v.id}:${e.id}" ${mine ? '' : 'disabled'}>◯ Batter the ring round ${PNM(v.owner)}'s ${v.level === 2 ? 'town' : 'village'}${sideHp(v, e) < ringMax(v) ? ' (cracked)' : ''}</button>`).join('')}${batterable(L).map(e => `<button class="btn war" data-bat="${e.id}" ${mine ? '' : 'disabled'}>▥ Batter ${PNM(e.wo)}'s wall${e.whp < 2 ? ' (cracked)' : ''}</button>`).join('')}</div>` : ''}
    <h5>Muster ${ok ? '' : '<span class="dim" style="text-transform:none;letter-spacing:0">· only at one of your villages or towns</span>'}</h5><div class="rec">${UNITS.map(k => `<button class="btn" data-ra="${k}" ${mine && ok && canRecruit(L, k) && canPay(L, COST[k]) ? '' : 'disabled'}><img src="${unitImg(ME, k)}">${UNIT_ONE[k]}<span class="cost">${costHTML(costFor(L, COST[k]))}</span></button>`).join('')}</div>`;
    el.querySelectorAll('[data-ra]').forEach(b => b.onclick = () => send({ type: 'recruit', u: b.dataset.ra })); el.querySelectorAll('[data-bat]').forEach(b => b.onclick = () => { UI.sel = null; send({ type: 'batter', e: +b.dataset.bat }); }); el.querySelectorAll('[data-bring]').forEach(b => b.onclick = () => { UI.sel = null; const [v, e] = b.dataset.bring.split(':').map(Number); send({ type: 'batter', v, e }); }); return; }
  if (s.foe) { const O = s.foe; el.innerHTML = `<h4>${pn(O.id)}'s host <span class="dim">· ${O.hero.name}${O.hero.wounded ? ' (wounded)' : ''}</span></h4>${unitRows(O.id, O.army.units)}<div class="small dim">${handSize(O)} goods · ${O.cards.length + O.fresh.length} cards · ★ ${vpPublic(O)}</div>`; return; }
  if (s.vert) { const v = s.vert, D = defenders(v.id), own = v.owner === ME, M = mine && !L.deed ? marchMap(L) : null, can = M && M.targets.includes(v.id);
    const prod = v.tiles.map(i => G.tiles[i]).filter(t => t.num).map(t => `${icon(YIELD[t.type], 3)}<b>${t.num}</b>${t.i === G.robber ? '<span class="neg">✕</span>' : ''}`).join(' ');
    el.innerHTML = `<h4>${v.level === 2 ? 'Town' : 'Village'} <span class="dim">· ${own ? 'yours' : pn(v.owner)}</span></h4><div class="row2"><span class="dim">Gathers ${v.level}× from</span><span>${prod}</span></div>${v.wall ? `<div class="row2"><span class="dim">Walls</span><b>${v.wall}%</b></div>` : ''}
      <h5>Defenders</h5>${unitRows(v.owner, D.units)}${D.guard ? `<div class="small dim">Guard +${D.guard} (${v.wall ? 'walls' : ''}${v.wall && terrainGuard(v.id) ? ', ' : ''}${terrainGuard(v.id) ? 'rough ground' : ''}).</div>` : ''}
      ${own && canTown(ME, v) ? `<button class="btn" id="vt" ${mine && canPay(L, COST.town) ? '' : 'disabled'} style="margin-top:6px">♜ Grow into a town ${costHTML(COST.town)}</button>` : ''}
      ${can ? `<div class="row2" style="margin-top:8px"><span class="dim">Your odds</span><b id="oddsv">…</b></div><button class="btn war big" id="mgo" style="width:100%;margin-top:4px">⚑ Attack</button>` : !own && mine && !L.deed ? '<div class="small dim">Out of your host\'s reach: two steps along your roads, one step off them.</div>' : ''}`;
    const vt = $('vt'); if (vt) vt.onclick = () => send({ type: 'build', k: 'town', id: v.id }); const vw = $('vw'); if (vw) vw.onclick = () => send({ type: 'build', k: 'walls', id: v.id });
    if (can) { setTimeout(() => { const o = $('oddsv'); if (o) { const D2 = Object.assign({}, D, { guard: Math.max(0, D.guard - (v.wall > 0 && L.army.units.cata ? 1 : 0)) }); const p = Math.round(skOdds({ A: attackerSide(L), D: D2 }, 30) * 100); o.innerHTML = `<span style="color:${p > 60 ? '#8fd16a' : p > 35 ? '#e9b95a' : '#e9675a'}">${p}%</span>${v.wall > 0 ? (L.army.units.cata ? ' <span class="dim">before your catapults</span>' : ' <span class="dim">no catapults: you storm the walls</span>') : ''}`; } }, 20); $('mgo').onclick = () => { UI.sel = null; UI.mode = 'idle'; send({ type: 'march', v: v.id }); }; }
    return; }
  if (s.tile != null) { const t = G.tiles[s.tile]; el.innerHTML = `<h4>${TNAME[t.type]}${t.num ? ' · ' + t.num : ''}</h4>${YIELD[t.type] ? `<div class="row2"><span class="dim">Yields</span><span>${icon(YIELD[t.type], 4)} ${RES_NAME[YIELD[t.type]]} on a roll of <b>${t.num}</b> (${pips(t.num)}/36 · ${'•'.repeat(pips(t.num))})</span></div>` : ''}${G.robber === t.i ? '<div class="neg small">The outlaw band sits here: nobody gathers from it.</div>' : ''}`; return; }
}
function tradePanel() {
  const el = $('trade'); el.style.display = ''; let give = {}, get = {}, bankGive = null;
  const draw = () => { const L = me(), gv = Object.values(give).reduce((a, b) => a + b, 0), gt = Object.values(get).reduce((a, b) => a + b, 0), main = myTurn() && G.phase === 'main';
    const R = bankRate(L); if (bankGive && L.res[bankGive] < R) bankGive = null;
    el.innerHTML = `<h4>Trade <button class="btn" id="tx" style="float:right;padding:0 7px">✕</button></h4>
      <h5>The bank · ${chOf(L) === 'guild' ? 'closed to the Guild' : R + ' of one good for 1 of another'}</h5>${portOf(L) && chOf(L) !== 'guild' && chOf(L) !== 'merchant' ? `<div class="small pos" style="margin:-2px 0 4px">Your host holds the harbour of ${portOf(L).name}. Leave its landing and the bank goes back to 4 : 1.</div>` : ''}<div class="small dim">${chOf(L) === 'guild' ? 'The Guild takes what others pay the bank, but may not trade there itself.' : bankGive ? 'Now pick what you want for ' + R + ' ' + RES_NAME[bankGive] + '.' : 'Pick a good you hold ' + R + ' of.'}</div>
      <div class="pick">${RES.map(k => `<button class="btn${bankGive === k ? ' on' : ''}" data-bg="${k}" ${main && L.res[k] >= R && chOf(L) !== 'guild' ? '' : 'disabled'} title="give ${R} ${RES_NAME[k]}">${R}×${icon(k, 4)}</button>`).join('')}</div>
      ${bankGive ? `<div class="pick" style="margin-top:4px"><span class="dim" style="align-self:center">→</span>${RES.filter(k => k !== bankGive).map(k => `<button class="btn" data-bw="${k}" title="get 1 ${RES_NAME[k]}">${icon(k, 4)}</button>`).join('')}</div>` : ''}
      <h5>The other lords</h5><div class="small dim">Computer lords answer at once; players answer on their own screen.</div>
      <div class="row2"><span class="dim">You give</span><div class="pick">${RES.map(k => `<button class="btn" data-g="${k}" ${L.res[k] > (give[k] || 0) ? '' : 'disabled'}>${icon(k, 4)}${give[k] ? '<b>' + give[k] + '</b>' : ''}</button>`).join('')}</div></div>
      <div class="row2"><span class="dim">You want</span><div class="pick">${RES.map(k => `<button class="btn" data-w="${k}">${icon(k, 4)}${get[k] ? '<b>' + get[k] + '</b>' : ''}</button>`).join('')}</div></div>
      <div class="sbtns">${chOf(L) === 'zealot' ? '<span class="small dim">A Zealot trades with no lord.</span>' : ''}${G.lords.filter(O => O.alive && O !== L && chOf(L) !== 'zealot' && chOf(O) !== 'zealot').map(O => `<button class="btn" data-l="${O.id}" ${main && gv && gt && !G.offer ? '' : 'disabled'}>Offer ${pn(O.id)}</button>`).join('')}<button class="btn" id="tclr">Clear</button></div>`;
    el.querySelector('#tx').onclick = () => { el.style.display = 'none'; UI.redrawTrade = null; };
    el.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { bankGive = bankGive === b.dataset.bg ? null : b.dataset.bg; draw(); });
    el.querySelectorAll('[data-bw]').forEach(b => b.onclick = () => { send({ type: 'bank', give: bankGive, get: b.dataset.bw }); UI.toast(`The bank takes ${bankRate(me())} ${RES_NAME[bankGive]} for 1 ${RES_NAME[b.dataset.bw]}.`); bankGive = null; });
    el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { give[b.dataset.g] = (give[b.dataset.g] || 0) + 1; draw(); });
    el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { get[b.dataset.w] = (get[b.dataset.w] || 0) + 1; draw(); });
    el.querySelector('#tclr').onclick = () => { give = {}; get = {}; draw(); };
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { send({ type: 'offer', to: b.dataset.l, give, get }); give = {}; get = {}; }); };
  draw(); UI.redrawTrade = draw;
}
// a player being offered a trade answers it on their own screen
function offerPanel() { const el = $('offer'), o = G.offer; if (!o || !canAct(o.to) || UI.curtain) { el.style.display = 'none'; return; } el.style.display = '';
  el.innerHTML = `<h4>${pn(o.from)} offers ${UI.net ? 'you' : PNM(o.to)} a trade</h4><div class="row2"><span class="dim">You get</span><span>${costHTML(o.give)}</span></div><div class="row2"><span class="dim">You give</span><span>${costHTML(o.get)}</span></div><div class="sbtns"><button class="btn war" id="oyes" ${Object.entries(o.get).every(([k, v]) => lord(o.to).res[k] >= v) ? '' : 'disabled'}>Accept</button><button class="btn" id="ono">Decline</button></div>`;
  $('oyes').onclick = () => send({ type: 'reply', ok: true, by: o.to }); $('ono').onclick = () => send({ type: 'reply', ok: false, by: o.to }); }
UI.toast = (html, kind) => { const t = $('toasts'); if (!t) return; const d = document.createElement('div'); d.className = 'gl toast' + (kind ? ' ' + kind : ''); d.innerHTML = `<span class="ki">${kind === 'war' ? '!' : kind === 'big' ? '✦' : '·'}</span><span>${html}</span>`; t.prepend(d); while (t.children.length > 5) t.lastChild.remove(); setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 600); }, kind ? 9000 : 6000); };

/* ==========================================================================
   MARCHES AND BATTLES on the world map
   ========================================================================== */
async function march(L, target, M) {
  UI.sel = null; L.deed = true; hud();
  const goal = target.v, v = G.verts[goal], foe = M.targets.includes(goal), stop = foe ? M.prev.get(goal) : goal, tx = v.vx, ty = v.vy + 10;
  let D = foe ? defenders(goal) : null;
  const watch = L.human || (D && lord(D.owner) && lord(D.owner).human);
  const p = pathTo(M, stop), path = p.map(vi => [G.verts[vi].vx, G.verts[vi].vy + 8]); path[0] = armyPos(L).slice(0, 2);
  const roadSpd = (a, b) => { const e = G.verts[a].edges.map(i => G.edges[i]).find(e => e.a === b || e.b === b); return e && e.owner === L.id ? MARCH_SPEED.road : MARCH_SPEED.open; };
  const speeds = []; for (let i = 1; i < p.length; i++) speeds.push(roadSpd(p[i - 1], p[i]));
  if (!D) { if (watch || onScreen(tx, ty)) panTo(tx, ty); path.push(restXY(goal)); speeds.push(MARCH_SPEED.open); await walkPath(L, path, speeds); L.army.v = goal; L.at = null; pressOn(L, false); hud(); return; }
  const [sx, sy] = VX(stop), dl = Math.hypot(tx - sx, ty - sy) || 1, ux = (tx - sx) / dl, uy = (ty - sy) / dl, bat = [sx + (tx - sx) * .55, sy + (ty - sy) * .55 + 10];
  panTo(bat[0], bat[1], watch ? 2 : UI.cam.z);
  path.push([bat[0] - ux * 36, bat[1] - uy * 20]); speeds.push(roadSpd(stop, goal)); await walkPath(L, path, speeds);
  G.bid = (G.bid || 0) + 1; const bid = G.bid;
  if (v.wall > 0 && L.army.units.cata) { if (L.human) await siegeGame(L, v, bat, bid); else for (let i = 0; i < L.army.units.cata * 2; i++) if (rand() < .45) v.wall = Math.max(0, v.wall - 25); D = defenders(goal); }
  const A = attackerSide(L), Dlord = lord(D.owner);
  const bcards = Q => Q ? Q.cards.filter(c => CARDS[c] && CARDS[c].battle).concat(Q.outlaw > 0 ? ['outlaw'] : []) : [];
  let S;
  if (watch) S = await fightOnMap({ bid, A: Object.assign(A, { cards: bcards(L) }), D: Object.assign({}, D, { cards: bcards(Dlord) }), at: bat, dirA: [ux, uy], hide: [L.id, D.host ? D.host.id : null].filter(Boolean),
    title: `${pn(L.id)} ${vb(L.id, 'attack', 'attacks')} ${v.owner ? (youAre(v.owner) ? 'your ' : PNM(v.owner) + "'s ") + (v.level === 2 ? 'town' : 'village') : (youAre(D.owner) ? 'your' : PNM(D.owner) + "'s") + ' host'}` });
  else S = skRun({ A: Object.assign(A, { cards: bcards(L) }), D: Object.assign({}, D, { cards: bcards(Dlord) }) });
  syncCards(S, L, Dlord);
  applyBattle(L, { v: goal, D }, S, stop);
  for (const Q of G.lords) if (Q !== L && Q.at) Q.at = null;
  const back = restXY(L.army.v); await walkPath(L, [armyPos(L).slice(0, 2), back]); L.at = null;
  if (watch) UI.camGoal = { x: bat[0], y: bat[1], z: 1 };
  UI.ver++; hud();
}
const onScreen = (x, y) => { const [X, Y] = toScreen(x, y); return X > 0 && Y > 0 && X < innerWidth && Y < innerHeight; };
function syncCards(S, L, Dl) { for (const [k, Q] of [['A', L], ['D', Dl]]) { if (!Q || !S.sides[k].cardsIn) continue; const sd = S.sides[k]; const used = sd.cardsIn.filter(c => c !== 'outlaw' && !sd.cards.includes(c)); for (const c of used) { const i = Q.cards.indexOf(c); if (i >= 0) Q.cards.splice(i, 1); } if (sd.cardsIn.includes('outlaw') && !sd.cards.includes('outlaw')) Q.outlaw--; } }
// a battle on the map. Each beat waits for both sides' choices: a player's comes as a move from
// their machine, the computer's is worked out here (alike everywhere). The fighting itself steps at a
// fixed rate with the shared dice, so every machine sees the same blows.
function fightOnMap(o) {
  return new Promise(resolve => {
    const S = makeSkirmish({ A: o.A, D: o.D, cx: o.at[0], cy: o.at[1], dirA: o.dirA }); for (const k of ['A', 'D']) S.sides[k].cardsIn = S.sides[k].cards.slice();
    const ctl = k => { const Q = lord(S.sides[k].owner); return Q && Q.human && Q.alive ? Q.id : null; };
    const sc = UI.scene = { kind: 'battle', S, hide: o.hide, acc: 0, ch: {}, asked: {} };
    const DT = 1 / 60;
    const ready = () => { const b = S.beat + 1; sc.ch[b] = sc.ch[b] || {};
      for (const c of UI.live) if (c.type === 'beat' && c.bid === o.bid && c.beat === b && !sc.ch[b][c.side] && ctl(c.side) === c.by) sc.ch[b][c.side] = c.ch;
      UI.live = UI.live.filter(c => !(c.type === 'beat' && c.bid === o.bid && c.beat <= b && sc.ch[b][c.side]));
      for (const k of ['A', 'D']) if (!sc.ch[b][k] && !ctl(k)) sc.ch[b][k] = skAIChoice(S, k);
      return sc.ch[b].A && sc.ch[b].D ? sc.ch[b] : null; };
    sc.step = dt => {
      if (S.result) { sc.endT = (sc.endT || 0) + dt; if (sc.endT > 3.5) finish(); return; }
      if (S.paused) { const c = ready(); if (c) { skBeat(S, c.A, c.D); panels(); } else if (sc.drawn !== S.beat) { sc.drawn = S.beat; panels(); } return; }
      sc.acc += dt; while (sc.acc >= DT && !S.paused) { skStep(S, DT); sc.acc -= DT; } if (S.paused) { sc.acc = 0; panels(); } };
    // while both sides choose, nobody strikes: the fighters only sway on their feet (drawn, not moved, so every machine stays alike)
    sc.items = (items, t) => { for (const f of S.F) if (!f.gone) items.push([f.alive ? f.y : f.dy - 30, () => { if (S.paused && f.alive && !f.flee && !S.result) { const ox = Math.sin(t * 1.3 + f.id) * 3, oy = Math.cos(t * 1.1 + f.id * 1.7) * 2; const sx = f.x, sy = f.y; f.x += ox; f.y += oy; drawFighter(f); f.x = sx; f.y = sy; } else drawFighter(f); }]); };
    sc.over = (ctx) => drawBattleFx(ctx, S);
    sc.labels = () => S.F.filter(f => f.hero && f.alive && !f.flee).map(f => { const [X, Y] = toScreen(f.x, f.y - 34); return `<div class="badge" style="left:${X}px;top:${Y}px;font-size:10px"><i style="background:${COLS[S.sides[f.side].owner] || '#999'}"></i>${f.name}</div>`; }).join('');
    $('battle').style.display = ''; $('trade').style.display = 'none';
    $('btitle').innerHTML = `<div style="font:600 18px var(--pix);color:var(--gold)">${o.title}</div><div class="dim" style="font-size:12px"></div>`;
    let done = false; const finish = () => { if (done) return; done = true; $('battle').style.display = 'none'; UI.scene = null; resolve(S); };
    const panels = () => {
      const side = k => { const sd = S.sides[k], al = S.F.filter(f => f.side === k && f.alive && !f.flee), u = {}; al.forEach(f => { if (!f.hero) u[f.k] = (u[f.k] || 0) + 1; }); const hero = S.F.find(f => f.side === k && f.hero);
        return `<h4>${pn(sd.owner)} <span class="dim">· ${k === 'A' ? 'attacking' : 'defending'} · ${al.length} of ${sd.start}</span></h4>${hero ? `<div class="small">${hero.alive ? '♛ <b>' + hero.name + '</b> · ' + hero.hp + ' wounds left' : '<span class="dim">♛ ' + hero.name + ' is down (wounded, not dead)</span>'}</div>` : ''}${unitRows(sd.owner, u)}

        ${sd.guard ? `<div class="small dim">Guard +${sd.guard} from rough ground</div>` : ''}${S.beat ? `<div class="ord">${sd.played ? CARDS[sd.played] ? CARDS[sd.played].glyph + ' ' + CARDS[sd.played].name : '♣ The Outlaw' : ORDERS[sd.order].glyph + ' ' + ORDERS[sd.order].name}${sd.ctr ? ' <span class="pos">· beats theirs</span>' : ''}</div>` : ''}${S.paused && !S.result ? `<div class="small ${sc.ch[S.beat + 1] && sc.ch[S.beat + 1][k] ? 'pos' : 'dim'}">${sc.ch[S.beat + 1] && sc.ch[S.beat + 1][k] ? '✓ ready' : ctl(k) ? 'choosing…' : ''}</div>` : ''}`; };
      $('bA').innerHTML = side('A'); $('bD').innerHTML = side('D');
      $('btitle').children[1].innerHTML = S.result ? '' : `Beat <b class="gold">${S.beat + (S.paused ? 1 : 0)}</b> of ${SK.MAXBEATS} · ${S.paused ? 'both sides choose; nobody strikes until both have' : 'fighting…'} · every blow is <b style="color:#e8dcc0">d6 + edge</b> vs <b style="color:#e8dcc0">d6 + guard</b>`;
      if (S.result) { const aWon = S.result === 'A' || S.result === 'D_fell', w = aWon ? S.sides.A.owner : S.sides.D.owner, mineW = youAre(w), inIt = youAre(S.sides.A.owner) || youAre(S.sides.D.owner);
        const txt = { A: 'The attackers carry the field.', D: 'The attackers are cut down.', A_fell: 'The attackers fall back.', D_fell: 'The defenders flee.', D_hold: 'Neither side breaks: the armies draw apart.' }[S.result];
        $('btac').innerHTML = `<div class="bres ${!inIt ? '' : mineW ? 'w' : 'l'}"><div>${inIt ? (mineW ? 'Victory' : 'Defeat') : PNM(w) + ' wins'}</div><span>${txt}</span><button class="btn big" id="bok">Continue</button></div>`;
        $('bok').onclick = finish; return; }
      if (!S.paused) { $('btac').innerHTML = '<div class="dim" style="padding:10px 16px">The lines clash…</div>'; return; }
      const b = S.beat + 1, my = ['A', 'D'].filter(k => ctl(k) && canAct(ctl(k)) && !(sc.ch[b] && sc.ch[b][k]) && !sc.asked[b + k]);
      if (!my.length) { $('btac').innerHTML = `<div class="dim" style="padding:10px 16px">${['A', 'D'].some(k => ctl(k) && !(sc.ch[b] && sc.ch[b][k])) ? 'Waiting for ' + ['A', 'D'].filter(k => ctl(k) && !(sc.ch[b] && sc.ch[b][k])).map(k => PNM(S.sides[k].owner)).join(' and ') + ' to choose…' : '…'}</div>`; return; }
      const k = my[0], sd = S.sides[k], Q = lord(sd.owner), two = my.length > 1 || ['A', 'D'].filter(x => ctl(x) && canAct(ctl(x))).length > 1;
      const opk = k === 'A' ? 'D' : 'A', prev = sc.ch[b - 1] && sc.ch[b - 1][opk], prevN = prev && (ORDERS[prev] ? ORDERS[prev].name : prev.indexOf('card:') === 0 ? 'a fortune card' : null), opCh = sc.ch[b] && sc.ch[b][opk], opName = esc2(lordName(S.sides[opk].owner === 'neutral' ? 'raider' : S.sides[opk].owner) || 'The outlaws');
      const LOSES = { press: 'hold', hold: 'loose', loose: 'press' };
      $('btac').innerHTML = `<div class="owrap">${two ? `<div class="ofoot" style="margin:0 0 6px"><b style="color:${LIGHT[sd.owner]}">${esc2(lordName(sd.owner))} chooses</b></div>` : ''}<div class="orow">` + ['press', 'hold', 'loose'].map(x => { const O = ORDERS[x]; return `<button class="tc oc" data-o="${x}" title="${O.desc}"><b style="color:${O.col}">${O.name}</b><span class="os">${O.short}</span><span class="ob">beats ${ORDERS[BEATS[x]].name}</span><span class="ol">loses to ${ORDERS[LOSES[x]].name}</span></button>`; }).join('') +
        `<div class="oside">` + [...new Set(sd.cards)].map(c => `<button class="tc card" data-o="card:${c}" title="${c === 'outlaw' ? 'Four greenwood bowmen join you.' : CARDS[c].desc.replace('Battle: ', '') + ' Then press on.'}"><b>${c === 'outlaw' ? 'Call the Outlaw' : CARDS[c].name}</b><span class="k">${c === 'outlaw' ? 'four bowmen join · ' + Q.outlaw + ' call(s) left' : 'fortune card, then press on'}</span></button>`).join('') + (sd.garrison ? '' : `<button class="tc" data-o="fall" title="${ORDERS.fall.desc}"><b>Fall back</b><span class="k">break off · they get a parting volley</span></button>`) + `</div></div>` +
        `<div class="ofoot"><span>Beat ${b} of ${SK.MAXBEATS}${opCh ? ' · ' + opName + ' has chosen' : ''}</span>${prevN ? `<span>Last beat ${opName} played <b style="color:${ORDERS[prev] ? ORDERS[prev].col : '#f2cf6a'}">${prevN}</b></span>` : '<span>A counter takes the edge off their order; it does not win the beat outright</span>'}</div></div>`;
      $('btac').querySelectorAll('[data-o]').forEach(btn => btn.onclick = () => { sc.asked[b + k] = true; send({ type: 'beat', bid: o.bid, beat: b, side: k, ch: btn.dataset.o, by: sd.owner }); panels(); });
    };
    panels();
  });
}
function drawFighter(f) {
  const L = CFX[f.owner === 'neutral' ? 'raider' : f.owner][f.k][f.who % 3]; if (!f.alive) { spr(L.down, f.dx, f.dy + 4, f.face < 0); return; }
  shadow(f.x, f.y, 4); let key;
  if (f.flash > 0) key = 'hit'; else if (f.k === 'archer') key = f.act === 'shoot' ? 'shoot' + Math.min(3, Math.floor(f.at * 12)) : 'shoot0';
  else if (f.act === 'windup') key = 'windup'; else if (f.act === 'strike') key = 'strike'; else if (f.act === 'parry') key = 'parry'; else key = Math.hypot(f.vx, f.vy) > 6 || f.flee ? 'gw' + (Math.floor(f.walkPh / 5) % 4) : 'guard';
  if (f.k === 'archer' && (Math.hypot(f.vx, f.vy) > 9 || f.flee) && !f.act && f.flash <= 0) spr(L.shoot0, f.x, f.y - (Math.floor(f.walkPh / 5) % 2), f.face < 0);   // an archer keeps his own look on the move
  else spr(L[key] || L.guard, f.x, f.y, f.face < 0);
  if (f.hero) crown(f.x, f.y); if (f.outlaw) { CTX.fillStyle = '#5f9c43'; CTX.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 30, 5, 2); }
}
function drawBattleFx(ctx, S) {
  for (const b of S.blood) { const u = S.t - b.t0; if (b.spark) { if (u > .35) continue; ctx.fillStyle = '#fff6c8'; for (let j = 0; j < 7; j++) ctx.fillRect(Math.round(b.x + Math.cos(j) * u * 40), Math.round(b.y + Math.sin(j * 2) * u * 26), 1, 1); } }
  for (const a of S.arrows) { const u = (S.t - a.t0) / a.dur; if (u < 0 || u >= 1) continue; const tx = a.t.x, ty = a.t.y - 12, x = a.x0 + (tx - a.x0) * u, y = a.y0 + (ty - a.y0) * u - Math.sin(u * Math.PI) * 18, dir = Math.sign(tx - a.x0) || 1; for (let j = 0; j < 6; j++) { ctx.fillStyle = j === 0 ? '#e2e8ef' : j > 4 ? '#f2ece0' : '#8a6a3c'; ctx.fillRect(Math.round(x - dir * j), Math.round(y + Math.cos(u * Math.PI) * j * .4), 1, 1); } }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const p of S.pops) { const u = S.t - p.t0, life = p.res === 'say' ? 2.6 : 1.1; if (u > life) continue; ctx.globalAlpha = u > life - .3 ? 1 - (u - life + .3) / .3 : 1; const y = p.y - Math.min(1, u * 5) * 3, col = COLS[S.sides[p.side].owner] || '#999', oc = COLS[S.sides[p.side === 'A' ? 'D' : 'A'].owner] || '#999';
    if (p.res === 'say') { ctx.font = '600 9px "Pixelify Sans"'; ctx.fillStyle = '#f4d692'; ctx.fillText(p.txt, p.x, y); ctx.globalAlpha = 1; continue; }
    if (p.res === 'rout') { ctx.font = '600 9px "Pixelify Sans"'; ctx.fillStyle = '#ff8a7a'; ctx.fillText('they break!', p.x, y); ctx.globalAlpha = 1; continue; }
    if (p.b == null) pixDie(ctx, p.x - 4, y, p.a, col, p.res === 'hit'); else { pixDie(ctx, p.x - 11, y, p.a, col, p.res === 'hit' || p.res === 'down'); pixDie(ctx, p.x + 2, y, p.b, oc, p.res === 'miss'); }
    ctx.font = '600 7px "Pixelify Sans"'; ctx.fillStyle = p.res === 'parry' ? '#f4d692' : p.res === 'down' ? '#ff8a7a' : p.res === 'miss' ? '#cfe0f0' : '#f2e6c8'; ctx.fillText(p.res, p.x, y - 2); ctx.globalAlpha = 1; }
}
function pixDie(ctx, x, y, n, col, win) { const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n]; if (!P) return; x = Math.round(x); y = Math.round(y);
  if (win) { ctx.fillStyle = 'rgba(244,214,146,.6)'; ctx.fillRect(x - 1, y - 1, 11, 11); } ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x, y, 9, 9); ctx.fillStyle = '#b8ae9a'; ctx.fillRect(x, y + 8, 9, 1); ctx.fillRect(x + 8, y, 1, 9); ctx.fillStyle = col; ctx.fillRect(x, y, 9, 1); ctx.fillStyle = '#2a2018'; P.forEach(([a, b]) => ctx.fillRect(x + 1 + a * 2.5 | 0, y + 1 + b * 2.5 | 0, 2, 2)); }

/* ==========================================================================
   THE SIEGE: the attacker times the catapult's swing on their own screen;
   each shot (hit or miss) is a move every machine plays out.
   ========================================================================== */
function siegeGame(L, v, bat, bid) {
  return new Promise(resolve => {
    const cx = v.vx, cy = v.vy, from = [bat[0] - (cx - bat[0]) * .9, bat[1] - (cy - bat[1]) * .9 + 20], aimer = canAct(L.id); let shots = L.army.units.cata * 2, power = 0, dir = 1, flying = null, msg = '', fired = 0, used = 0, storming = false;
    const target = Math.hypot(cx - from[0], cy - from[1]), maxR = target * 1.35;
    panTo((from[0] + cx) / 2, (from[1] + cy) / 2, 2);
    const sc = UI.scene = { kind: 'siege', hide: [] };
    const panel = () => { $('battle').style.display = ''; $('bA').innerHTML = `<h4>Siege</h4><div class="row2"><span class="dim">Wall</span><b class="gold">${v.wall}%</b></div><div class="seg">${Array.from({ length: 4 }, (_, i) => `<i class="${i * 25 >= v.wall ? 'x' : ''}"></i>`).join('')}</div><div class="small dim">Each hit knocks 25% off. Walls give the defenders guard: +3 at 75% or more, +2 at 50%, +1 at 25%, nothing once breached.</div>${msg ? `<div class="msg">${msg}</div>` : ''}`; $('bD').innerHTML = `<h4>${pn(L.id)}${youAre(L.id) ? 'r' : "'s"} catapults</h4><div class="row2"><span class="dim">Shots left</span><b class="gold">${shots - used}</b></div><div class="small dim">${aimer ? 'Watch the swing. Loose when the needle sits in the gold band: too soft falls short, too hard flies over.' : PNM(L.id) + ' is aiming…'}</div>`;
      $('btitle').innerHTML = `<div style="font:600 18px var(--pix);color:var(--gold)">Break the walls</div><div class="dim" style="font-size:12px">${aimer ? 'Click (or press Space) to loose · then storm' : 'The catapults are loosing'}</div>`;
      $('btac').innerHTML = !aimer ? '<div class="dim" style="padding:10px 16px">…</div>' : fired < shots && v.wall > 0 ? `<div class="meter"><div class="band" style="left:${(target - 26) / maxR * 100}%;width:${52 / maxR * 100}%"></div><div class="needle" id="needle"></div></div><button class="btn war big" id="fire">● Loose</button><button class="btn" id="storm">⚔ Storm now</button>` : `<button class="btn war big" id="storm">⚔ Storm</button>`;
      const f = $('fire'); if (f) f.onclick = fire; const s = $('storm'); if (s) s.onclick = storm; };
    const fire = () => { if (!aimer || flying || fired >= shots || v.wall <= 0 || storming) return; const dist = power * maxR; fired++; send({ type: 'shot', bid, i: fired, dist, hit: Math.abs(dist - target) < 26, by: L.id }); panel(); };
    const storm = () => { if (!aimer || storming) return; storming = true; send({ type: 'storm', bid, by: L.id }); };
    sc.key = e => { if (e.code === 'Space') { e.preventDefault(); fire(); } };
    sc.click = () => fire();
    sc.step = dt => {
      if (aimer && !flying) { power += dir * dt * .7; if (power > 1) { power = 1; dir = -1; } if (power < 0) { power = 0; dir = 1; } const n = $('needle'); if (n) n.style.left = (power * 100) + '%'; }
      if (flying) { if (performance.now() - flying.t0 > 1100) { if (flying.hit) { v.wall = Math.max(0, v.wall - 25); msg = '<span class="pos">A hit! The wall cracks.</span>'; } else msg = flying.dist < target ? '<span class="neg">Short.</span>' : '<span class="neg">Over the walls.</span>'; flying = null; panel(); } return; }
      const c = UI.live.find(x => x.bid === bid && x.by === L.id && ((x.type === 'shot' && x.i === used + 1) || x.type === 'storm'));
      if (!c) return; if (c.type === 'shot') { UI.live.splice(UI.live.indexOf(c), 1); used++; flying = { t0: performance.now(), dist: c.dist, hit: c.hit }; panel(); return; }
      if (used < fired) return; UI.live = UI.live.filter(x => x.bid !== bid); $('battle').style.display = 'none'; UI.scene = null; resolve(); };
    sc.items = items => { items.push([from[1], () => { shadow(from[0], from[1], 8); spr(UI.cata, from[0], from[1], cx < from[0]); }]); };
    sc.over = ctx => { if (!flying) return; const u = Math.min(1, (performance.now() - flying.t0) / 1000), dx = (cx - from[0]) / target, dy = (cy - from[1]) / target, x = from[0] + dx * flying.dist * u, y = from[1] - 16 + dy * flying.dist * u - Math.sin(u * Math.PI) * 80;
      ctx.fillStyle = '#8a837b'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); ctx.fillStyle = '#c8c0b2'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 3, 3);
      if (u >= 1) { const r = mulberry(7); for (let k = 0; k < 40; k++) { ctx.fillStyle = flying.hit ? '#c8c0b2' : '#8f7a52'; ctx.fillRect(Math.round(x + (r() - .5) * 30), Math.round(y + (r() - .5) * 14), 2, 2); } } };
    panel();
  });
}
/* battering a border wall: the same catapult swing, aimed at a wall section; two hits breach it */
function wallSiege(L, T, bid) {
  return new Promise(resolve => {
    const cx = T.x, cy = T.y, [ax, ay] = armyPos(L), dl = Math.hypot(ax - cx, ay - cy) || 1, from = [ax + (ax - cx) / dl * 30, ay + (ay - cy) / dl * 18 + 6], aimer = canAct(L.id);
    let shots = shotsLeft(L), power = 0, volley = null, dir = 1, flying = null, msg = '', fired = 0, used = 0, done = false;
    const target = Math.hypot(cx - from[0], cy - from[1]), maxR = target * 1.35, band = Math.max(7, target * .09);
    panTo((from[0] + cx) / 2, (from[1] + cy) / 2, 2);
    const sc = UI.scene = { kind: 'siege', hide: [] }, wname = PNM(T.owner), bf = T.bf;
    const panel = () => { $('battle').style.display = ''; $('bA').innerHTML = `<h4>${wname}'s ${T.what}</h4><div class="row2"><span class="dim">Standing</span><b class="gold">${T.hp()}/${T.max}</b></div><div class="seg">${Array.from({ length: T.max }, (_, i) => i).map(i => `<i class="${i >= T.hp() ? 'x' : ''}"></i>`).join('')}</div><div class="small dim">${T.kind === 'ring' ? `${T.max} hits break the ring on this side, and armies can pass on this border. A wall on the same border must fall too.` : 'Two hits breach a section. A breached section is torn down: the border is open, and anyone may build there again.'}</div><div class="row2"><span class="dim">Archers on the wall</span><b class="neg">${Math.round(bf * 100)}%</b></div><div class="small dim">On every miss they shoot back; a hit wrecks a catapult.${bf > .4 ? ' They shoot better from a settlement.' : ''}</div>${msg ? `<div class="msg">${msg}</div>` : ''}`;
      $('bD').innerHTML = `<h4>${pn(L.id)}${youAre(L.id) ? 'r' : "'s"} catapults</h4><div class="row2"><span class="dim">Shots left</span><b class="gold">${shots - used}</b></div><div class="row2"><span class="dim">Catapults</span><b>${L.army.units.cata}</b></div><div class="small dim">${chOf(L) === 'warlord' ? 'Two free shots each turn, plus one per catapult.' : 'One shot per catapult each turn.'}</div><div class="small dim">${aimer ? 'Loose when the needle sits in the gold band: too soft falls short, too hard flies over.' : PNM(L.id) + ' is aiming…'}</div>`;
      $('btitle').innerHTML = `<div style="font:600 18px var(--pix);color:var(--gold)">Batter the ${T.kind === 'ring' ? 'ring' : 'wall'}</div><div class="dim" style="font-size:12px">${aimer ? 'Click (or press Space) to loose' : 'The catapults are loosing'}</div>`;
      $('btac').innerHTML = !aimer ? '<div class="dim" style="padding:10px 16px">…</div>' : fired < shots && T.hp() > 0 ? `<div class="meter"><div class="band" style="left:${(target - band) / maxR * 100}%;width:${band * 2 / maxR * 100}%"></div><div class="needle" id="needle"></div></div><button class="btn war big" id="fire">● Loose</button><button class="btn" id="storm">Stop</button>` : `<button class="btn big" id="storm">${T.hp() > 0 ? 'Fall back' : (T.kind === 'ring' ? 'Done: the ring is broken' : 'Done: the wall is down')}</button>`;
      const f = $('fire'); if (f) f.onclick = fire; const s = $('storm'); if (s) s.onclick = stop; };
    const fire = () => { if (!aimer || flying || fired >= shots || T.hp() <= 0 || done) return; const dist = power * maxR; fired++; send({ type: 'shot', bid, i: fired, dist, hit: Math.abs(dist - target) < band, by: L.id }); panel(); };
    const stop = () => { if (!aimer || done || flying) return; done = true; send({ type: 'storm', bid, by: L.id }); };
    sc.key = ev => { if (ev.code === 'Space') { ev.preventDefault(); fire(); } };
    sc.click = () => fire();
    sc.step = dt => {
      if (aimer && !flying) { power += dir * dt * .7; if (power > 1) { power = 1; dir = -1; } if (power < 0) { power = 0; dir = 1; } const n = $('needle'); if (n) n.style.left = (power * 100) + '%'; }
      if (flying) { if (performance.now() - flying.t0 > 1100) { if (flying.hit) { T.hit(L.id); landChanged(); msg = T.hp() > 0 ? '<span class="pos">A hit! Stakes split and fall.</span>' : '<span class="pos">Breached!</span>'; flying = null; } else { const miss = flying.dist < target ? 'Short.' : 'Over the wall.', wreck = returnFire(L, T.owner, T.bf); msg = `<span class="neg">${miss} The archers shoot back${wreck ? ' and wreck a catapult!' : ', but miss.'}</span>`; volley = { t0: performance.now(), wreck }; flying = null; } panel(); } return; }
      if (volley && performance.now() - volley.t0 > 900) volley = null; if (volley) return;
      const c = UI.live.find(x => x.bid === bid && x.by === L.id && ((x.type === 'shot' && x.i === used + 1) || x.type === 'storm'));
      if (!c) return; if (c.type === 'shot') { UI.live.splice(UI.live.indexOf(c), 1); used++; L.shot = (L.shot || 0) + 1; flying = { t0: performance.now(), dist: c.dist, hit: c.hit }; panel(); return; }
      if (used < fired) return; UI.live = UI.live.filter(x => x.bid !== bid); $('battle').style.display = 'none'; UI.scene = null; resolve(); };
    sc.items = items => { items.push([from[1], () => { shadow(from[0], from[1], 8); spr(UI.cata, from[0], from[1], cx < from[0]); }]); };
    sc.over = ctx => { if (volley) { const u = Math.min(1, (performance.now() - volley.t0) / 700); for (let k = 0; k < 7; k++) { const uu = Math.max(0, Math.min(1, u * 1.3 - k * .05)), sx = cx + (k - 3) * 4, sy = cy - 12, x = sx + (from[0] - sx) * uu, y = sy + (from[1] - 8 - sy) * uu - Math.sin(uu * Math.PI) * 30, ang = Math.atan2(from[1] - sy, from[0] - sx);
          if (uu <= 0 || uu >= 1) continue; ctx.fillStyle = '#2a1e12'; for (let j = 0; j < 9; j++) ctx.fillRect(Math.round(x - Math.cos(ang) * j), Math.round(y - Math.sin(ang) * j), 2, 2); ctx.fillStyle = '#f4f0e6'; ctx.fillRect(Math.round(x - Math.cos(ang) * 9), Math.round(y - Math.sin(ang) * 9), 2, 2); }
        if (u >= 1 && volley.wreck) { const r = mulberry(11); for (let k = 0; k < 26; k++) { ctx.fillStyle = k % 3 ? '#6a4a30' : '#3a2e22'; ctx.fillRect(Math.round(from[0] + (r() - .5) * 24), Math.round(from[1] - 6 + (r() - .5) * 14), 2, 1); } } }
      if (!flying) return; const u = Math.min(1, (performance.now() - flying.t0) / 1000), dx = (cx - from[0]) / target, dy = (cy - from[1]) / target, x = from[0] + dx * flying.dist * u, y = from[1] - 16 + dy * flying.dist * u - Math.sin(u * Math.PI) * 60;
      ctx.fillStyle = '#8a837b'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); ctx.fillStyle = '#c8c0b2'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 3, 3);
      if (u >= 1) { const r = mulberry(7); for (let k = 0; k < 30; k++) { ctx.fillStyle = flying.hit ? '#c8c0b2' : '#8f7a52'; ctx.fillRect(Math.round(x + (r() - .5) * 26), Math.round(y + (r() - .5) * 12), 2, 2); } } };
    panel();
  });
}
function checkWinUI() { if (!G.lords) return false; const w = checkWin(); const meOut = !UI.net ? !G.lords.some(l => l.human && l.alive) : !lord(NET.seat).alive;
  if (!w && !meOut) return false; if (UI.shownWin === (w || 'out')) return !!w; UI.shownWin = w || 'out'; const el = $('win'); el.style.display = '';
  const you = w && canAct(w), nm = id => esc2(lordName(id));
  if (!w) el.innerHTML = `<div class="gl wbox"><div style="font:600 26px var(--pix);color:#e9675a">Your last village has fallen</div><div class="dim" style="margin:6px 0 12px">Round ${G.round}. ${G.lords.map(Q => `${nm(Q.id)} ${Q.alive ? vp(Q.id) : '✕'}`).join(' · ')}</div><div style="margin-top:14px"><button class="btn big" id="watch">Watch on</button></div></div>`;
  else { const st = G.st || { h: {}, ev: [] }, target = winPts(), byPts = vp(w) >= target, segC = ['#c9c1ae', '#9a8f78', '#7fa7d8', '#d9573f', '#e3c04a'], segN = ['Villages', 'Towns', 'Longest Road', 'Greatest Host', 'Chronicles'];
    const parts = Q => { const S = settlements(Q.id); return [S.filter(v => v.level === 1).length, S.filter(v => v.level === 2).length * 2, G.lh.road === Q.id ? (chOf(Q) === 'builder' ? 3 : 2) : 0, G.lh.host === Q.id ? 2 : 0, Q.cards.concat(Q.fresh).filter(c => c === 'chronicle').length]; };
    const rank = G.lords.slice().sort((a, b) => (b.id === w) - (a.id === w) || (b.alive - a.alive) || vp(b.id) - vp(a.id)), top = Math.max(target, ...G.lords.map(Q => vp(Q.id)));
    const rows = rank.map((Q, i) => `<div class="erow"><div class="ern" style="color:${i ? '#8d8676' : '#f2cf6a'}">${i + 1}</div><div class="erw"><div style="font:600 15px var(--pix);color:${LIGHT[Q.id]}">${nm(Q.id)}</div><div class="dim" style="font-size:11px">${Q.charter && CHARTERS[Q.charter] ? CHARTERS[Q.charter].name : 'The Old Ways'}${Q.alive ? '' : ' · conquered'}</div></div><div class="ebar">${Q.alive ? parts(Q).map((v, j) => v ? `<i style="width:${v / top * 100}%;background:${segC[j]}" title="${segN[j]} ${v}"></i>` : '').join('') : ''}</div><div class="erp">${Q.alive ? vp(Q.id) : '✕'}</div></div>`).join('');
    const H = {}; let len = 0; for (const Q of G.lords) { H[Q.id] = [2].concat(st.h[Q.id] || [], [Q.alive ? vp(Q.id) : 0]); len = Math.max(len, H[Q.id].length); }
    const CW = 430, CH = 150, X = i => 8 + i * (CW - 16) / Math.max(1, len - 1), Y = v => CH - 8 - v * (CH - 16) / top;
    const svg = `<svg viewBox="0 0 ${CW} ${CH}" style="display:block;width:100%"><line x1="8" x2="${CW - 8}" y1="${Y(target)}" y2="${Y(target)}" stroke="#f2cf6a" stroke-dasharray="3 4" opacity=".6"/>${rank.slice().reverse().map(Q => `<polyline fill="none" stroke="${TCOL[Q.id]}" stroke-width="${Q.id === w ? 3 : 2}" stroke-linejoin="round" points="${H[Q.id].map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ')}"/>`).join('')}</svg>`;
    const best = (f, min) => { const r = G.lords.map(Q => [Q, f(Q) || 0]).sort((a, b) => b[1] - a[1])[0]; return r[1] >= min ? r : null; };
    const aw = [['Bloodiest hand', best(Q => Q.won, 1), n => n + (n === 1 ? ' battle won' : ' battles won')], ['Conqueror', best(Q => Q.taken, 1), n => n + (n === 1 ? ' settlement taken' : ' settlements taken')], ['Master builder', best(Q => roadsOf(Q.id).length, 1), n => n + ' roads laid'], ['Fullest barns', best(Q => Q.got, 1), n => n + ' goods gathered']].filter(a => a[1]);
    const ev = st.ev.slice(-7);
    el.innerHTML = `<div class="gl ebox"><div class="ehead"><div><div class="etitle" style="color:${you || !UI.net ? '#f2cf6a' : '#e9675a'}">${you && UI.net ? 'The Isle is yours' : nm(w) + ' rules the Isle'}</div><div class="dim" style="margin-top:4px">Round ${G.round} · ${byPts ? 'won by reaching ' + target + ' points' : 'won as the last lord standing'}</div></div><div class="ebtns"><button class="btn" id="watch">Look over the isle</button>${UI.net ? '' : '<button class="btn big war" id="rematch">Rematch, same lords</button>'}<button class="btn big" id="again">New game</button></div></div>
      <div class="egrid"><div>${rows}<div class="eleg">${segN.map((l, j) => `<span class="dim"><i style="background:${segC[j]}"></i>${l}</span>`).join('')}</div>${aw.length ? `<div class="eaw">${aw.map(a => `<div><div class="dim" style="font-size:11px">${a[0]}</div><div style="font:600 14px var(--pix);margin-top:2px;color:${LIGHT[a[1][0].id]}">${nm(a[1][0].id)}</div><div class="dim" style="font-size:11px">${a[2](a[1][1])}</div></div>`).join('')}</div>` : ''}</div>
      <div><div class="elab">The race, round by round</div><div class="echart">${svg}</div>${ev.length ? `<div class="elab" style="margin-top:14px">The chronicle</div><div class="echr">${ev.map(e => `Round ${e[0]}, ${esc2(String(e[1]).replace(/<[^>]*>/g, ''))}`).join('<br>')}</div>` : ''}</div></div></div>`; }
  const rm = $('rematch'); if (rm) rm.onclick = () => { const A = UI.lastStart; if (!A) return location.reload(); el.style.display = 'none'; startGame((Math.random() * 2 ** 31) | 0, A[0], A[1], null, A[2]); };
  const a = $('again'); if (a) a.onclick = () => location.reload(); const wb = $('watch'); if (wb) wb.onclick = () => { el.style.display = 'none'; }; return !!w; }
document.addEventListener('click', e => { if (e.target && e.target.id === 'parchno' && G.parch) send({ type: 'parch', t: -1 }); });
