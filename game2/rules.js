'use strict';
/* ==========================================================================
   HEARTHLAND — rules. Seasons, souls placed on tiles, omens, patrons and
   their powers, raider camps, and the dice clash of lines.
   ========================================================================== */
const RES = ['timber', 'clay', 'wool', 'grain', 'ore'];
const RES_NAME = { timber: 'Timber', clay: 'Clay', wool: 'Wool', grain: 'Grain', ore: 'Ore' };
const YIELD = { forest: 'timber', hill: 'clay', pasture: 'wool', field: 'grain', mountain: 'ore' };
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const PLAYERS = ['red', 'blue', 'gold', 'violet'];
const PNAME = { red: 'Red', blue: 'Blue', gold: 'Gold', violet: 'Violet', raider: 'Raiders' };
const WIN = 15;
const CAP = { 1: 6, 2: 10 };
const PATRONS = {
  mother: { name: 'Hearth Mother', power: 'rain', passive: 'An extra soul is born each spring at every fed hearth.' },
  storm: { name: 'Storm Father', power: 'lightning', passive: 'Charge costs your captains no command.' },
  tide: { name: 'Tide Singer', power: 'raise', passive: 'Your armies march 3 tiles along the coast.' },
  stone: { name: 'Stone Keeper', power: 'quake', passive: 'Walls cost half. Each mountain you work yields +1 ore.' },
};
const POWERS = {
  rain: { name: 'Rain', cost: 2, glyph: '☂', desc: 'Pick a tile your people work: it yields again, doubled, right now.' },
  lightning: { name: 'Lightning', cost: 3, glyph: 'ϟ', desc: 'Pick an enemy or raider army you can see: 2 of them fall.' },
  quake: { name: 'Quake', cost: 4, glyph: '≈', desc: "Pick a walled hearth: its wall loses half." },
  raise: { name: 'Raise Land', cost: 5, glyph: '≋', desc: 'Pick open sea beside your land: a new tile rises, inside your border.' },
};
const COST = {
  hearth: { timber: 2, clay: 1, grain: 1, wool: 1 }, hall: { grain: 2, ore: 2, clay: 1 }, walls: { clay: 2, ore: 1 }, monument: { timber: 2, clay: 2, ore: 2, wool: 2 },
  spear: { timber: 1 }, sword: { ore: 1, timber: 1 }, archer: { timber: 1, wool: 1 }, cata: { timber: 2, ore: 1 },
};
const UNITS = ['spear', 'sword', 'archer', 'cata'];
const UNIT_NAME = { spear: 'Spearmen', sword: 'Swordsmen', archer: 'Bowmen', cata: 'Catapults', militia: 'Townsfolk' };
const UNIT_ONE = { spear: 'Spearman', sword: 'Swordsman', archer: 'Bowman', cata: 'Catapult', militia: 'Townsman' };
const STAT = { spear: { atk: 0, def: 1, hp: 2 }, sword: { atk: 2, def: 0, hp: 2 }, archer: { atk: -1, def: -1, hp: 1 }, cata: { atk: -2, def: -2, hp: 1 }, militia: { atk: -1, def: -1, hp: 1 } };
const UNIT_NOTE = { spear: 'def +1 · braced spears stop charges', sword: 'atk +2 · 2 wounds', archer: 'shoots each beat: 5+ hits', cata: 'breaks walls · 2d6, 9+ kills', militia: 'souls defending their home' };
const ORDERS = {
  advance: { name: 'Advance', glyph: '➜', cost: 0, desc: 'Fight as you stand.' },
  wall: { name: 'Shield Wall', glyph: '▣', cost: 0, desc: 'Def +2, atk −1. Arrows only hit on 6.' },
  charge: { name: 'Charge', glyph: '⚔', cost: 1, desc: 'Atk +2. Braced spears get +2 on you; you are easier to shoot.' },
  volley: { name: 'Volley', glyph: '➶', cost: 1, desc: 'Bowmen loose twice. Your front fights at −1.' },
  rally: { name: 'Rally', glyph: '✚', cost: 1, desc: 'Morale +2. Your front fights at −1 this beat.' },
  fallback: { name: 'Fall Back', glyph: '⇠', cost: 0, desc: 'End the battle. They get one parting volley.' },
};

const G = {};
const d6 = () => 1 + ((Math.random() * 6) | 0);
const rndInt = n => (Math.random() * n) | 0;
const uCount = u => UNITS.reduce((a, k) => a + (u[k] || 0), 0);
const canPay = (p, c) => Object.entries(c).every(([k, v]) => (p.res[k] || 0) >= v);
const pay = (p, c) => { for (const [k, v] of Object.entries(c)) p.res[k] -= v; };
const gain = (p, k, n) => { p.res[k] = (p.res[k] || 0) + n; };
const player = id => G.players.find(p => p.id === id);
const curP = () => G.players[G.cur];
function logMsg(html, kind) { G.log.unshift({ html, kind }); if (G.log.length > 80) G.log.pop(); if (typeof UI !== 'undefined' && UI.toast) UI.toast(html, kind); }

/* ---------- the island and its graph ---------- */
function buildWorld() {
  const w = new World({ W: 2100, H: 1800, s: 96, C: 2, style: 'civ', map: G.map });
  G.world = w; G.tiles = w.tiles;
  const at = {}; G.tiles.forEach(t => at[t.q + ',' + t.r] = t);
  G.tiles.forEach(t => { t.nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => at[(t.q + a) + ',' + (t.r + b)]).filter(Boolean).map(x => x.i); t.verts = []; t.coast = t.nb.length < 6; });
  const old = G.verts || []; const oldBy = {}; old.forEach(v => oldBy[v.key] = v);
  G.verts = []; const vk = {};
  G.tiles.forEach(t => { for (let k = 0; k < 6; k++) { const x = t.cx + w.s * Math.cos((60 * k - 90) * Math.PI / 180), y = t.cy + w.s * Math.sin((60 * k - 90) * Math.PI / 180), key = Math.round(x / 4) + ',' + Math.round(y / 4);
    let v = vk[key]; if (!v) { const o = oldBy[key]; v = vk[key] = { key, id: G.verts.length, x, y, tiles: [], adj: [], owner: o ? o.owner : null, level: o ? o.level : 0, wall: o ? o.wall : 0, souls: o ? o.souls : 0, burned: o ? o.burned : 0, monument: o ? o.monument : false, name: o ? o.name : null };
      const [vx, vy] = w.vis(x, y); v.vx = vx; v.vy = vy; G.verts.push(v); }
    v.tiles.push(t.i); t.verts.push(v.id); } });
  G.tiles.forEach(t => { const ids = t.verts; for (let k = 0; k < 6; k++) { const a = G.verts[ids[k]], b = G.verts[ids[(k + 1) % 6]]; if (!a.adj.includes(b.id)) a.adj.push(b.id); if (!b.adj.includes(a.id)) b.adj.push(a.id); } });
  G.verts.forEach(v => w.reserve(v.vx, v.vy, 20));
  G.tiles.filter(t => t.type === 'desert').forEach(t => w.reserve(t.cx, t.cy, 60));
  w.dress();
}
const NAMES = { red: ['Redwater', 'Emberhold', 'Rust Ford', 'Alder Hearth', 'Cinder Hill', 'Rowan Gate', 'Brickfield', 'Foxden'], blue: ['Bluemere', 'Coldwell', 'Tidewick', 'Slate Hearth', 'Gullstone', 'Frostmoor', 'Kelpwater', 'Ashby'], gold: ['Goldfield', 'Sunhallow', 'Barley Mound', 'Amber Hearth', 'Haystead', 'Honeywick', 'Brightford', 'Oatley'], violet: ['Violet Crag', 'Dusk Hollow', 'Heatherholm', 'Plum Hearth', 'Mothwood', 'Shadeholt', 'Thistle Ford', 'Gloaming'] };

function setupGame(seed) {
  Object.keys(G).forEach(k => delete G[k]);
  G.seed = seed; G.year = 1; G.season = 0; G.cur = 0; G.log = []; G.winner = null; G.nextArmy = 1; G.omen = null; G.started = false; G.verts = null;
  G.map = makeMap(seed); buildWorld();
  G.players = PLAYERS.map((id, i) => ({ id, i, human: i === 0, res: { timber: 2, clay: 1, wool: 1, grain: 3, ore: 0 }, favour: 0, patron: null, camps: 0, captured: 0, workers: {}, prayer: 0, explored: new Set(), powerUsed: false, names: 0 }));
  G.armies = []; G.campRespawn = [];
  G.tiles.filter(t => t.type === 'desert').forEach((t, k) => newArmy('raider', t.i, { spear: 3 + k, archer: 1 }, { camp: true, home: t.i }));
  // landfall choices: coastal corners, spread round the island
  G.beaches = landingSpots();
}
function landingSpots() {
  const w = G.world, cands = G.verts.filter(v => v.tiles.length === 2 && v.tiles.every(ti => G.tiles[ti].type !== 'desert') && new Set(v.tiles.map(ti => G.tiles[ti].type)).size === 2);
  const score = v => v.tiles.reduce((a, ti) => { const n = G.tiles[ti].num; return a + (n ? 6 - Math.abs(7 - n) : 0); }, 0);
  const pick = []; const sectors = 8;
  for (let s = 0; s < sectors; s++) { const a0 = s / sectors * Math.PI * 2 - Math.PI, a1 = a0 + Math.PI * 2 / sectors;
    const inS = cands.filter(v => { const a = Math.atan2(v.y - w.CY, v.x - w.CX); return a >= a0 && a < a1; }).sort((a, b) => score(b) - score(a));
    if (inS[0]) pick.push(inS[0]); }
  return pick;
}
function landfall(beachId, patron) {
  const human = G.players[0]; human.patron = patron;
  const used = [G.verts[beachId]];
  const pats = Object.keys(PATRONS).filter(k => k !== patron);
  G.players.forEach((P, i) => {
    let v; if (i === 0) v = G.verts[beachId];
    else { const far = c => Math.min(...used.map(u => Math.hypot(u.x - c.x, u.y - c.y))); v = G.beaches.filter(c => !used.includes(c)).sort((x, y) => far(y) - far(x))[0]; used.push(v); P.patron = pats[i - 1]; }
    found(P.id, v, 6); autoWorkers(P);
  });
  G.started = true; startSeason(true);
  logMsg(`Your canoe grinds onto the sand. <b>${G.verts[beachId].name}</b> is founded, under the <b>${PATRONS[patron].name}</b>.`, 'big');
}
function found(pid, v, souls) { const P = player(pid); v.owner = pid; v.level = 1; v.souls = souls; v.wall = 0; v.name = NAMES[pid][P.names % 8] + (P.names >= 8 ? ' ' + 'II III IV V'.split(' ')[Math.floor(P.names / 8) - 1] : ''); P.names++; reveal(pid); }
const hearths = pid => G.verts.filter(v => v.owner === pid);
function territory(pid) { const s = new Set(); for (const v of hearths(pid)) for (const ti of v.tiles) s.add(ti); return s; }
function terrOwner(ti) { const o = new Set(); for (const vi of G.tiles[ti].verts) { const v = G.verts[vi]; if (v.owner) o.add(v.owner); } return o; }
function reveal(pid) { const P = player(pid), ex = P.explored; const add = (ti, r) => { const q = [[ti, 0]], seen = new Set([ti]); while (q.length) { const [t, d] = q.shift(); ex.add(t); if (d >= r) continue; for (const n of G.tiles[t].nb) if (!seen.has(n)) { seen.add(n); q.push([n, d + 1]); } } };
  for (const v of hearths(pid)) for (const ti of v.tiles) add(ti, 1); for (const a of G.armies) if (a.owner === pid) add(a.tile, 1); }

/* ---------- people ---------- */
const civilians = pid => hearths(pid).reduce((a, v) => a + v.souls, 0);
const soldiers = pid => G.armies.filter(a => a.owner === pid).reduce((a, x) => a + uCount(x.units), 0);
const placed = P => Object.values(P.workers).reduce((a, b) => a + b, 0) + P.prayer;
function trimWorkers(P) { const terr = territory(P.id); for (const k of Object.keys(P.workers)) if (!terr.has(+k)) delete P.workers[k]; let over = placed(P) - civilians(P.id);
  while (over > 0) { if (P.prayer > 0) { P.prayer--; over--; continue; } const k = Object.keys(P.workers).sort((a, b) => P.workers[b] - P.workers[a])[0]; if (!k) break; P.workers[k]--; if (!P.workers[k]) delete P.workers[k]; over--; } }
function tileYield(P, ti, blessed) { const t = G.tiles[ti], k = YIELD[t.type]; if (!k) return null; const n = P.workers[ti] || 0; if (!n) return null; if (G.armies.some(a => a.tile === ti && a.owner !== P.id)) return { k, n: 0, blocked: true };
  let mult = 1; if (G.season === 1 && (k === 'grain' || k === 'wool')) mult = 2; if (G.season === 3 && k === 'grain') mult = 0; if (blessed) mult *= 2;
  let v = n * mult; if (P.patron === 'stone' && k === 'ore') v += 1; return { k, n: v }; }
function autoWorkers(P, need) {
  const terr = [...territory(P.id)].filter(ti => YIELD[G.tiles[ti].type]); const free = () => civilians(P.id) - placed(P);
  const mouths = Math.ceil((civilians(P.id) + soldiers(P.id)) / 2); const want = need || (P.res.grain < mouths + 1 ? 'grain' : null);
  const val = ti => { const t = G.tiles[ti], k = YIELD[t.type], p = t.num ? 6 - Math.abs(7 - t.num) : 0; return p + (k === want ? 4 : 0) + (k === 'grain' ? 1.5 : 0) + (G.armies.some(a => a.tile === ti && a.owner !== P.id) ? -20 : 0) - (P.workers[ti] || 0) * 1.5; };
  if (!P.human && civilians(P.id) >= 7 && P.prayer < 1 + (P.patron === 'tide' ? 1 : 0)) P.prayer++;
  let guard = 0; while (free() > 0 && guard++ < 40) { const opts = terr.filter(ti => (P.workers[ti] || 0) < 3).sort((a, b) => val(b) - val(a)); if (!opts.length) break; P.workers[opts[0]] = (P.workers[opts[0]] || 0) + 1; }
}

/* ---------- the turning year ---------- */
function startSeason(first) {
  const sp = G.season === 0;
  if (G.season === 2) births(true);
  if (sp && !first) {   // winter's end: everyone eats, then the spring births
    for (const P of G.players) { const mouths = Math.ceil((civilians(P.id) + soldiers(P.id)) / 2); if (P.res.grain >= mouths) P.res.grain -= mouths;
      else { const short = mouths - P.res.grain; P.res.grain = 0; let dead = Math.ceil(short / 2); for (const v of hearths(P.id).sort((a, b) => b.souls - a.souls)) { while (dead > 0 && v.souls > 1) { v.souls--; dead--; } } logMsg(`${pn(P.id)} went hungry through the winter: <b class="neg">${Math.ceil(short / 2)} soul${Math.ceil(short / 2) > 1 ? 's' : ''}</b> lost.`, P.human ? 'war' : ''); } }
    births();
  }
  G.omen = d6() + d6(); G.omenDice = null;
  if (G.omen === 7) { G.armies.filter(a => a.camp).forEach(a => a.units.spear++); logMsg(`${SEASONS[G.season]} omen: <b>7</b> — a raider omen. The camps swell; nothing is blessed.`, 'war'); }
  // the season's harvest
  for (const P of G.players) { trimWorkers(P); const got = {}; if (G.season !== 3) for (const v of hearths(P.id)) { gain(P, 'grain', v.level); got.grain = (got.grain || 0) + v.level; } for (const ti of Object.keys(P.workers)) { const y = tileYield(P, +ti, G.tiles[+ti].num === G.omen); if (y && y.n) { gain(P, y.k, y.n); got[y.k] = (got[y.k] || 0) + y.n; } } P.favour = Math.min(9, P.favour + P.prayer); P.powerUsed = false; P.lastHarvest = got;
    if (P.human) { const s = Object.entries(got).map(([k, n]) => `${n} ${RES_NAME[k]}`).join(', '); logMsg(`${SEASONS[G.season]}, year ${G.year}. Omen <b>${G.omen}</b>${G.omen !== 7 ? ' blesses its tiles' : ''}. Your people bring in ${s || 'nothing'}.`); } }
  G.armies.forEach(a => { a.moves = moveAllow(a); a.fired = 0; });
  raidersTurn();
  G.players.forEach(P => reveal(P.id));
}
function births(hallsOnly) {
    for (const P of G.players) { let born = 0; for (const v of hearths(P.id)) { if (hallsOnly && v.level < 2) continue; const n = 1 + (P.patron === 'mother' && !hallsOnly ? 1 : 0); for (let k = 0; k < n; k++) if (v.souls < CAP[v.level] && P.res.grain >= 1) { v.souls++; P.res.grain--; born++; } } if (P.human && born) logMsg(`${SEASONS[G.season]}: <b>${born}</b> born in your hearths.`, 'big'); }
}
function moveAllow(a) { const P = player(a.owner); return P && P.patron === 'tide' && G.tiles[a.tile].coast ? 3 : 2; }
function endTurn() { G.cur++; if (G.cur >= G.players.length) { G.cur = 0; G.season++; if (G.season > 3) { G.season = 0; G.year++; } startSeason(); } }

/* ---------- legend ---------- */
function legend(pid) { const P = player(pid); let n = 0; for (const v of hearths(pid)) n += v.level + (v.monument ? 3 : 0); n += P.camps * 2 + P.captured; if (largestPeople() === pid) n += 2; if (strongestHost() === pid) n += 2; return n; }
function largestPeople() { let b = null, bs = 11; for (const P of G.players) { const s = civilians(P.id) + soldiers(P.id); if (s > bs) { bs = s; b = P.id; } } return b; }
function strongestHost() { let b = null, bs = 7; for (const P of G.players) { const s = soldiers(P.id); if (s > bs) { bs = s; b = P.id; } } return b; }
function checkWin() { for (const P of G.players) if (legend(P.id) >= WIN) { G.winner = P.id; return P.id; } return null; }

/* ---------- building ---------- */
function canHearth(pid, v) { if (v.owner || v.adj.some(a => G.verts[a].owner)) return false; if (v.tiles.every(ti => G.tiles[ti].type === 'desert')) return false; const terr = territory(pid); return v.tiles.some(ti => terr.has(ti)); }
function hearthCost(P) { return COST.hearth; }
function donor(pid) { return hearths(pid).filter(v => v.souls >= 3).sort((a, b) => b.souls - a.souls)[0]; }
function buildHearth(pid, v) { const P = player(pid), d = donor(pid); if (!d || !canHearth(pid, v) || !canPay(P, COST.hearth)) return false; pay(P, COST.hearth); d.souls -= 2; found(pid, v, 2); return true; }
function wallCost(P) { return P.patron === 'stone' ? { clay: 1, ore: 1 } : COST.walls; }
function recruitCost(unit) { return COST[unit]; }
function recruitTile(pid, v) { const opts = v.tiles.map(i => G.tiles[i]).filter(t => t.type !== 'desert' && !G.armies.some(a => a.tile === t.i && a.owner !== pid)); return opts.find(t => armyAt(t.i, pid)) || opts[0] || null; }
function recruit(pid, v, unit) { const P = player(pid); if (v.souls < 2 || !canPay(P, COST[unit])) return null; const t = recruitTile(pid, v); if (!t) return null; pay(P, COST[unit]); v.souls--; trimWorkers(P); let a = armyAt(t.i, pid); if (!a) { a = newArmy(pid, t.i, {}); a.moves = 0; } a.units[unit]++; return a; }

/* ---------- armies ---------- */
function newArmy(owner, tile, units, extra) { const a = Object.assign({ id: G.nextArmy++, owner, tile, units: Object.assign({ spear: 0, sword: 0, archer: 0, cata: 0 }, units), moves: 2, fired: 0, from: tile }, extra || {}); G.armies.push(a); return a; }
const armyAt = (tile, owner) => G.armies.find(a => a.tile === tile && (owner == null || a.owner === owner));
function moveCost(t) { return t.type === 'mountain' ? 2 : 1; }
function reachable(a) { const out = new Map(); out.set(a.tile, 0); const q = [a.tile];
  while (q.length) { const ti = q.shift(), d = out.get(ti); for (const n of G.tiles[ti].nb) { const c = d + moveCost(G.tiles[n]); if (c > a.moves) continue; if (out.has(n) && out.get(n) <= c) continue; out.set(n, c); if (!G.armies.some(x => x.tile === n && x.owner !== a.owner)) q.push(n); } }
  out.delete(a.tile); return out; }
function moveArmy(a, ti, cost) { a.from = a.tile; a.tile = ti; a.moves -= cost; const same = G.armies.find(x => x !== a && x.tile === ti && x.owner === a.owner); reveal(a.owner); if (same) { for (const k of UNITS) same.units[k] += a.units[k]; same.moves = Math.min(same.moves, a.moves); G.armies.splice(G.armies.indexOf(a), 1); return same; } return a; }
const adjacentEnemyHearths = a => G.verts.filter(v => v.owner && v.owner !== a.owner && v.tiles.includes(a.tile));
const removeArmy = a => { const i = G.armies.indexOf(a); if (i >= 0) G.armies.splice(i, 1); };

/* ---------- the clash of lines ---------- */
function makeSide(owner, units, opt) { opt = opt || {}; const f = []; let id = 0;
  for (const k of ['sword', 'spear', 'militia', 'archer', 'cata']) for (let i = 0; i < (units[k] || 0); i++) f.push({ id: id++, k, hp: STAT[k].hp, alive: true });
  return { owner, f, morale: 12 + (opt.moraleBonus || 0), command: 3, terrain: opt.terrain || 0, wall: opt.wall || 0, garrison: !!opt.garrison, order: 'advance', lastOrder: null, patron: player(owner) ? player(owner).patron : null, start: f.length }; }
const alive = S => S.f.filter(x => x.alive);
const front = S => { const a = alive(S); const m = a.filter(x => x.k !== 'archer' && x.k !== 'cata'); return m.length ? m : a.filter(x => x.k === 'archer'); };
function orderOK(S, k) { const o = ORDERS[k]; let cost = o.cost; if (k === 'charge' && S.patron === 'storm') cost = 0; if (cost > S.command) return false; if (k === 'volley' && !alive(S).some(x => x.k === 'archer')) return false; if (k === 'fallback' && S.garrison) return false; return true; }
function payOrder(S, k) { let c = ORDERS[k].cost; if (k === 'charge' && S.patron === 'storm') c = 0; S.command -= c; }
function aiOrder(S, E, beat) {
  const opts = Object.keys(ORDERS).filter(k => orderOK(S, k)); const mine = alive(S).length, theirs = alive(E).length; const arch = alive(S).filter(x => x.k === 'archer').length, earch = alive(E).filter(x => x.k === 'archer').length;
  if (opts.includes('fallback') && S.morale <= 4 && mine < theirs) return 'fallback';
  if (opts.includes('rally') && S.morale <= 6 && Math.random() < .6) return 'rally';
  if (opts.includes('charge') && beat <= 2 && mine >= theirs && E.lastOrder !== 'wall' && Math.random() < .55) return 'charge';
  if (opts.includes('volley') && arch >= 2 && Math.random() < .5) return 'volley';
  if ((earch >= 2 || S.wall) && Math.random() < .55) return 'wall';
  return Math.random() < .3 ? 'wall' : 'advance';
}
function shoot(S, E, times, out) {
  for (const a of alive(S).filter(x => x.k === 'archer' || x.k === 'cata')) for (let t = 0; t < (a.k === 'cata' ? 1 : times); t++) {
    const tgts = alive(E); if (!tgts.length) return; const tgt = tgts[rndInt(Math.min(tgts.length, 6))];
    if (a.k === 'cata') { const r = d6() + d6(); const hit = r >= 9; out.push({ kind: 'cata', from: a.id, to: tgt.id, side: S, roll: [r], hit }); if (hit) wound(tgt, 2); continue; }
    const r = d6(); const need = E.order === 'wall' ? 6 : (E.order === 'charge' ? 4 : 5); const hit = r >= need; out.push({ kind: 'arrow', from: a.id, to: tgt.id, side: S, roll: [r], need, hit }); if (hit) wound(tgt, 1);
  } }
function wound(x, n) { x.hp -= n; if (x.hp <= 0) { x.alive = false; x.hp = 0; } }
const BASE = { spear: 1, sword: 2, archer: -1, cata: -2, militia: -1 };
function duelMod(S, E, x, isDef) { let m = BASE[x.k];
  if (S.order === 'wall') m += 1; if (S.order === 'charge') m += 2; if (S.order === 'volley' || S.order === 'rally') m -= 1;
  if (x.k === 'spear' && E.order === 'charge' && S.order !== 'charge') m += 2;   // spears set against the rush
  if (isDef) m += S.terrain + (S.wall >= 25 ? 3 : S.wall > 0 ? 1 : 0) + (S.garrison ? 1 : 0); return m; }
function fightBeat(A, D, beat) {
  const ev = { shots: [], duels: [], morale: [], beat };
  if (A.order === 'rally') A.morale += 2; if (D.order === 'rally') D.morale += 2;
  shoot(A, D, A.order === 'volley' ? 2 : 1, ev.shots); shoot(D, A, D.order === 'volley' ? 2 : 1, ev.shots);
  const fa = front(A), fd = front(D), n = Math.min(fa.length, fd.length);
  for (let i = 0; i < n; i++) {
    const a = fa[i], d = fd[i];
    const helpA = n ? Math.floor((fa.length - n) / n) + (i < (fa.length - n) % n ? 1 : 0) : 0, helpD = n ? Math.floor((fd.length - n) / n) + (i < (fd.length - n) % n ? 1 : 0) : 0;
    const ra = d6(), rd = d6(), ma = duelMod(A, D, a, false) + helpA, md = duelMod(D, A, d, true) + helpD, ta = ra + ma, td = rd + md;
    let res = 'parry', loser = null, dmg = 0;
    if (ta !== td) { const aw = ta > td; loser = aw ? d : a; const W = aw ? A : D, L = aw ? D : A; dmg = Math.abs(ta - td) >= 4 && W.order !== 'wall' && L.order !== 'wall' ? 2 : 1; wound(loser, dmg); res = loser.alive ? 'hit' : 'down'; }
    ev.duels.push({ a: a.id, d: d.id, ra, rd, ma, md, ta, td, res, loser: loser ? (loser === a ? 'A' : 'D') : null, dmg });
  }
  for (const [S, k] of [[A, 'A'], [D, 'D']]) { const lost = S.f.filter(x => !x.alive && !x.counted).length; S.f.forEach(x => { if (!x.alive) x.counted = true; }); if (lost) { S.morale -= lost; if (!S.garrison && alive(S).length) { const r = [d6(), d6()]; const broke = r[0] + r[1] > S.morale; ev.morale.push({ side: k, roll: r, morale: S.morale, broke }); if (broke) S.broken = true; } } }
  A.lastOrder = A.order; D.lastOrder = D.order;
  return ev;
}
function battleEnd(A, D, beat) {
  if (A.order === 'fallback') return 'A_fell'; if (D.order === 'fallback') return 'D_fell';
  if (!alive(D).length) return 'A'; if (!alive(A).length) return 'D';
  if (D.broken) return 'A'; if (A.broken) return 'D';
  if (beat >= 6) return 'D_hold';
  return null;
}
function autoBattle(A, D) { let beat = 0, r = null; while (!r) { beat++; A.order = aiOrder(A, D, beat); payOrder(A, A.order); D.order = aiOrder(D, A, beat); payOrder(D, D.order); if (A.order !== 'fallback' && D.order !== 'fallback') fightBeat(A, D, beat); r = battleEnd(A, D, beat); } return r; }
function survivors(S) { const u = { spear: 0, sword: 0, archer: 0, cata: 0, militia: 0 }; for (const x of alive(S)) u[x.k]++; return u; }
function odds(mkA, mkD) { let w = 0; const N = 200; for (let i = 0; i < N; i++) { const r = autoBattle(mkA(), mkD()); if (r === 'A' || r === 'D_fell') w++; } return w / N; }
function terrainBonus(ti) { const t = G.tiles[ti]; return t.type === 'forest' || t.type === 'hill' ? 1 : 0; }
function armySide(a, extra) { return makeSide(a.owner, a.units, Object.assign({ terrain: 0 }, extra || {})); }
function hearthSide(v) { return makeSide(v.owner, { militia: v.souls }, { garrison: true, wall: v.wall, moraleBonus: v.level === 2 ? 1 : 0, terrain: 0 }); }

/* ---------- what a battle does to the world ---------- */
function afterArmyBattle(att, def, A, D, r) {
  const sA = survivors(A), sD = survivors(D);
  for (const k of UNITS) { att.units[k] = sA[k]; def.units[k] = sD[k]; }
  const attWon = r === 'A' || r === 'D_fell';
  if (attWon) {
    if (def.camp) { removeArmy(def); const P = player(att.owner); if (P) { P.camps++; for (let k = 0; k < 4; k++) gain(P, RES[rndInt(5)], 1); P.favour = Math.min(9, P.favour + 2); } G.campRespawn.push({ tile: def.home, at: G.year * 4 + G.season + 6 }); logMsg(`${pn(att.owner)} broke a raider camp: loot, favour and <b>+2 legend</b>.`, 'big'); }
    else if (uCount(def.units)) { const flee = G.tiles[def.tile].nb.find(n => !G.armies.some(x => x.tile === n)); if (flee != null) def.tile = flee; else removeArmy(def); } else removeArmy(def);
    if (uCount(att.units)) att.tile = def.camp ? def.home : att.tile === def.tile ? att.tile : def.tile; else removeArmy(att);
  } else { if (!uCount(def.units)) removeArmy(def); if (!uCount(att.units)) removeArmy(att); else att.tile = att.from; }
  att.moves = 0; reveal(att.owner);
}
function afterAssault(att, v, A, D, r) {
  const sA = survivors(A), sD = survivors(D); for (const k of UNITS) att.units[k] = sA[k]; att.moves = 0;
  const attWon = r === 'A' || r === 'D_fell';
  if (attWon) { const old = v.owner, Q = player(old), P = player(att.owner); v.souls = Math.max(1, Math.ceil(sD.militia / 2) + 1);
    if (att.owner === 'raider') { for (let k = 0; k < 3; k++) { const kk = RES[rndInt(5)]; if (Q.res[kk] > 0) Q.res[kk]--; } v.souls = Math.max(1, v.souls - 1); v.burned = 2; if (v.level === 2 && Math.random() < .5) v.level = 1; logMsg(`Raiders sacked ${pn(old)}'s <b>${v.name}</b>.`, 'war'); }
    else { for (const k of RES) { const take = Math.floor(Q.res[k] / 2); Q.res[k] -= take; P.res[k] += take; } v.owner = att.owner; v.wall = 0; P.captured++; trimWorkers(Q); logMsg(`${pn(att.owner)} took <b>${v.name}</b> from ${pn(old)} and carried off half their stores.`, 'war'); }
  } else { v.souls = Math.max(1, sD.militia); logMsg(`${pn(v.owner)}'s <b>${v.name}</b> held against ${pn(att.owner)}.`, v.owner === 'red' ? 'big' : ''); }
  if (!uCount(att.units)) removeArmy(att);
  G.players.forEach(trimWorkers);
}
function bombard(a, v) { if (!a.units.cata || a.fired >= a.units.cata || v.wall <= 0) return null; a.fired++; const r = [d6(), d6()]; const hit = r[0] + r[1] >= 7; if (hit) v.wall = Math.max(0, v.wall - 25); return { r, hit }; }

/* ---------- patron powers ---------- */
function powerCost(P, k) { return POWERS[k].cost - (PATRONS[P.patron] && PATRONS[P.patron].power === k ? 1 : 0); }
function canPower(P, k) { return !P.powerUsed && P.favour >= powerCost(P, k); }
function raiseTargets(pid) { const terr = territory(pid), have = new Set(G.map.map(m => m.q + ',' + m.r)), out = []; for (const ti of terr) { const t = G.tiles[ti]; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) { const q = t.q + a, r = t.r + b; if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > 5 || have.has(q + ',' + r) || out.some(o => o.q === q && o.r === r)) continue; out.push({ q, r, cx: G.world.CX + 96 * Math.sqrt(3) * (q + r / 2), cy: G.world.CY + 96 * 1.5 * r }); } } return out; }
function raiseLand(pid, q, r, type) { const nums = [3, 4, 5, 6, 8, 9, 10, 11]; G.map.push({ q, r, type, num: nums[rndInt(nums.length)] }); buildWorld(); reveal(pid); }

/* ---------- raiders ---------- */
function raidersTurn() {
  const now = G.year * 4 + G.season;
  G.campRespawn = G.campRespawn.filter(c => { if (now >= c.at && !G.armies.some(a => a.tile === c.tile)) { newArmy('raider', c.tile, { spear: 3, archer: 1 }, { camp: true, home: c.tile }); logMsg('A new raider band has made camp in the waste.', 'war'); return false; } return true; });
  G.pendingRaid = [];
  for (const a of G.armies.filter(x => x.camp)) {
    if (G.season % 2 === 1) a.units.spear++;
    if (a.rest > 0) { a.rest--; continue; }
    if (uCount(a.units) < 8 || !G.started) continue;
    const home = G.tiles[a.home]; let best = null, bd = 1e9; for (const v of G.verts) { if (!v.owner) continue; const d = Math.hypot(v.x - home.cx, v.y - home.cy) - (v.wall > 0 ? 200 : 0) * -1; if (d < bd && d < 480) { bd = d; best = v; } }
    if (!best) continue; const send = { spear: Math.ceil(a.units.spear * .6), archer: Math.ceil(a.units.archer * .5) }; a.units.spear -= send.spear; a.units.archer -= send.archer;
    G.pendingRaid.push({ camp: a, v: best, units: send });
  }
}

/* ---------- the AI ---------- */
const pipV = v => v.tiles.reduce((a, ti) => { const t = G.tiles[ti]; return a + (t.num ? 6 - Math.abs(7 - t.num) : 0) + (t.type === 'desert' ? -3 : 0); }, 0);
function aiTurn(P) {
  trimWorkers(P);
  // build
  let founded = 0;
  for (let g = 0; g < 8; g++) {
    if (canPay(P, COST.monument) && hearths(P.id).some(v => v.level === 2) && !hearths(P.id).some(v => v.monument)) { pay(P, COST.monument); hearths(P.id).find(v => v.level === 2).monument = true; logMsg(`${pn(P.id)} raised their patron's great work (+3 legend).`, 'war'); continue; }
    const ups = hearths(P.id).filter(v => v.level === 1 && v.souls >= 5); if (ups.length && canPay(P, COST.hall)) { pay(P, COST.hall); ups[0].level = 2; logMsg(`${pn(P.id)} raised a hall at ${ups[0].name}.`); continue; }
    const sites = G.verts.filter(v => canHearth(P.id, v)); if (!founded && sites.length && canPay(P, COST.hearth) && donor(P.id)) { founded++; const v = sites.sort((a, b) => pipV(b) - pipV(a))[0]; buildHearth(P.id, v); logMsg(`${pn(P.id)} founded <b>${v.name}</b>.`); continue; }
    const thr = hearths(P.id).filter(v => v.wall <= 0 && v.tiles.some(ti => G.armies.some(a => a.tile === ti && a.owner !== P.id))); if (thr.length && canPay(P, wallCost(P))) { pay(P, wallCost(P)); thr[0].wall = 100; continue; }
    const sol = soldiers(P.id), civ = civilians(P.id); const v = hearths(P.id).sort((a, b) => b.souls - a.souls)[0];
    if (v && v.souls >= 4 && civ >= 5 && sol < Math.max(2, Math.floor(civ / 3))) { const u = canPay(P, COST.sword) && Math.random() < .4 ? 'sword' : canPay(P, COST.archer) && Math.random() < .4 ? 'archer' : canPay(P, COST.spear) ? 'spear' : null; if (u && recruit(P.id, v, u)) continue; }
    break;
  }
  for (const k of RES) if (P.res[k] >= 6) { const need = RES.filter(x => P.res[x] === 0); if (need.length) { P.res[k] -= 3; P.res[need[rndInt(need.length)]]++; } }
  autoWorkers(P);
  // a power
  if (!P.powerUsed) { const pw = PATRONS[P.patron].power;
    if (pw === 'raise' && canPower(P, 'raise') && (P.raised || 0) < 3 && Math.random() < .3) { P.raised = (P.raised || 0) + 1; const ts = raiseTargets(P.id); if (ts.length) { const t = ts[rndInt(ts.length)]; P.favour -= powerCost(P, 'raise'); P.powerUsed = true; raiseLand(P.id, t.q, t.r, ['forest', 'pasture', 'field'][rndInt(3)]); autoWorkers(P); logMsg(`${pn(P.id)}'s Tide Singer raised new land from the sea.`, 'war'); if (typeof UI !== 'undefined') UI.worldChanged = true; } }
    else if (canPower(P, 'lightning')) { const tgt = G.armies.find(a => a.owner !== P.id && hearths(P.id).some(v => v.tiles.includes(a.tile) || v.tiles.some(ti => G.tiles[ti].nb.includes(a.tile)))); if (tgt) { P.favour -= powerCost(P, 'lightning'); P.powerUsed = true; strike(tgt); logMsg(`Lightning from ${pn(P.id)}'s patron struck ${tgt.owner === 'raider' ? 'raiders' : pn(tgt.owner) + "'s host"}.`, tgt.owner === 'red' ? 'war' : ''); } }
  }
}
function strike(a) { let n = 2; for (const k of ['spear', 'archer', 'sword', 'cata']) { const d = Math.min(n, a.units[k]); a.units[k] -= d; n -= d; } if (!uCount(a.units)) removeArmy(a); }
const strength = u => (u.spear || 0) * 2.2 + (u.sword || 0) * 3 + (u.archer || 0) * 1.6 + (u.cata || 0) + (u.militia || 0);
function aiArmies(P) {
  const asks = [];
  for (const a of G.armies.filter(x => x.owner === P.id)) {
    if (!G.armies.includes(a) || a.moves <= 0) continue;
    const hv = adjacentEnemyHearths(a)[0];
    if (hv) { if (a.units.cata) while (a.fired < a.units.cata && hv.wall > 0) bombard(a, hv); const mult = hv.wall >= 25 ? 1.8 : hv.wall > 0 ? 1.4 : 1; if (strength(a.units) > hv.souls * mult * 1.6 + 2) { asks.push({ kind: 'assault', a, v: hv }); continue; } }
    const R = reachable(a); let target = null, best = 0;
    for (const [ti, c] of R) for (const e of G.armies.filter(x => x.tile === ti && x.owner !== P.id)) { const ratio = strength(a.units) / Math.max(1, strength(e.units)); if (ratio > (e.camp ? 1.4 : 1.7) && ratio > best) { best = ratio; target = { e, ti, c }; } }
    if (target) { asks.push({ kind: 'army', a, e: target.e, ti: target.ti, c: target.c }); continue; }
    if (uCount(a.units) >= 5) { let goal = null, gd = 1e9; const here = G.tiles[a.tile];
      for (const c of G.armies.filter(x => x.camp)) { const t = G.tiles[c.tile], d = Math.hypot(t.cx - here.cx, t.cy - here.cy); if (d < gd && strength(a.units) > strength(c.units) * 1.3) { gd = d; goal = t; } }
      for (const v of G.verts) if (v.owner && v.owner !== P.id && strength(a.units) > v.souls * 2.2 + 3) { const d = Math.hypot(v.x - here.cx, v.y - here.cy) * 1.2; if (d < gd) { gd = d; goal = { cx: v.x, cy: v.y }; } }
      if (goal) { let bt = null, bdd = 1e9; for (const [ti, c] of R) { if (G.armies.some(x => x.tile === ti)) continue; const t = G.tiles[ti], d = Math.hypot(t.cx - goal.cx, t.cy - goal.cy); if (d < bdd) { bdd = d; bt = [ti, c]; } } if (bt) moveArmy(a, bt[0], bt[1]); } }
  }
  return asks;
}
