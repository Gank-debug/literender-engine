'use strict';
/* ==========================================================================
   CROWN OF THE ISLE v0.5 — rules. The bones (dice, five goods, roads,
   villages and towns on the corners, trading, the robber, fortune cards)
   with Defender of the Crown's flesh: lords, heroes who never die, one
   host each, beat battles and sieges.
   Win at 20 points, or be the last lord standing.
   ========================================================================== */
const LORDS = ['red', 'blue', 'gold', 'violet', 'green', 'white'];   // seats; a game uses those that are filled
const PNAME = { red: 'Red', blue: 'Blue', gold: 'Gold', violet: 'Violet', green: 'Green', white: 'White', raider: 'Outlaws', neutral: 'Free folk' };
const LORD_NAME = { red: 'Lord Aldric', blue: 'Lady Merewen', gold: 'Lord Osric', violet: 'Lady Isolde', green: 'Lord Leofric', white: 'Lady Ælfwyn' };
const HERO_NAME = { red: 'Sir Cedric', blue: 'Dame Eadgyth', gold: 'Sir Wulfstan', violet: 'Sir Godwin', green: 'Sir Oswin', white: 'Dame Hild' };
const CASTLE_NAME = { red: 'Redmoor', blue: 'Bluecastle', gold: 'Goldenhall', violet: 'Violetkeep', green: 'Greenholt', white: 'Whitecliff' };
const RES = ['timber', 'clay', 'wool', 'grain', 'ore'];
const RES_NAME = { timber: 'Timber', clay: 'Clay', wool: 'Wool', grain: 'Grain', ore: 'Ore' };
const YIELD = { forest: 'timber', hill: 'clay', pasture: 'wool', field: 'grain', mountain: 'ore' };
const COST = {
  road: { timber: 1, clay: 1 }, village: { timber: 1, clay: 1, wool: 1, grain: 1 }, town: { grain: 2, ore: 3 }, walls: { clay: 2, timber: 1 }, mend: { clay: 1 }, mendSide: { clay: 1 }, monument: { ore: 3, clay: 3, grain: 2 }, card: { wool: 1, grain: 1, ore: 1 },
  spear: { timber: 1, grain: 1 }, archer: { timber: 1, wool: 1 }, sword: { ore: 1, grain: 1, wool: 1 }, cata: { timber: 2, ore: 1 },
};
const WIN = 20;   // the default; the host picks the target for each game (G.win)
const winPts = () => (typeof G !== 'undefined' && G.win) || WIN;
const PNM = id => String(lordName(id)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));   // a lord's chosen name, safe for the page
const lordName = id => (typeof G !== 'undefined' && G.names && G.names[id]) || PNAME[id];
const UNITS = ['spear', 'sword', 'archer', 'cata'];
const UNIT_NAME = { spear: 'Spearmen', sword: 'Men-at-arms', archer: 'Bowmen', cata: 'Catapults', militia: 'Townsfolk' };
const UNIT_ONE = { spear: 'Spearman', sword: 'Man-at-arms', archer: 'Bowman', cata: 'Catapult' };
const UNIT_NOTE = { spear: 'edge +1 · guard +1', sword: 'edge +2 · guard 0', archer: 'shoots from range', cata: 'breaks walls before a storm', militia: 'defending their home' };
// fortune cards: the first five are played on your turn, the rest in battle
const CARDS = {
  knight: { name: 'Knight', glyph: '♞', desc: 'Move the outlaw band and rob a lord beside it. A man-at-arms joins your host.' },
  roads: { name: 'Road Building', glyph: '═', desc: 'Lay two roads for free.' },
  plenty: { name: 'Year of Plenty', glyph: '✿', desc: 'Take any two goods.' },
  monopoly: { name: 'Monopoly', glyph: '⚖', desc: 'Name a good. Every lord hands you all of theirs.' },
  chronicle: { name: 'Chronicle', glyph: '✎', desc: 'A victory point. It counts while you hold it.' },
  rally: { name: 'Rally', glyph: '✚', desc: 'Battle: two of your fallen men rise and fight on.', battle: true },
  charge: { name: 'Charge', glyph: '⚔', desc: 'Battle: edge +1 for two beats.', battle: true },
  wall: { name: 'Shield Wall', glyph: '▣', desc: 'Battle: guard +1 for two beats.', battle: true },
  volley: { name: 'Volley', glyph: '➶', desc: 'Battle: every bowman looses at once.', battle: true },
  reinforce: { name: 'Reinforce', glyph: '☗', desc: 'Battle: two spearmen join the fight.', battle: true },
};
const DECK = { knight: 10, roads: 2, plenty: 2, monopoly: 2, chronicle: 4, rally: 2, charge: 2, wall: 2, volley: 2, reinforce: 2 };

const G = {};
// the game's own dice: seeded, and the same on every machine in a shared game
function rand() { G.rs = (G.rs + 0x6D2B79F5) | 0; let t = Math.imul(G.rs ^ G.rs >>> 15, 1 | G.rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rndInt = n => (rand() * n) | 0;
// who is looking at this screen (set by the interface); messages are written for them
const youAre = id => typeof meId === 'function' && !(typeof sharedDevice === 'function' && sharedDevice()) && meId() === id;
const vb = (id, a, b) => youAre(id) ? a : b;
const d6 = () => 1 + rndInt(6);
const ring = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const hexDist = (a, b) => ring(a.q - b.q, a.r - b.r);
const uCount = u => ['spear', 'sword', 'archer', 'militia'].reduce((a, k) => a + ((u && u[k]) || 0), 0);
const pips = n => n ? 6 - Math.abs(7 - n) : 0;
const lord = id => G.lords.find(l => l.id === id);
const curL = () => G.lords[G.cur];
/* charters: each lord may take one before settling; each bends one rule their way and one against them */
const CHARTERS = {
  raider: { name: 'Raider', boon: 'Your host marches <b>2 steps anywhere</b>. Win a battle and you <b>plunder 4 goods</b> from the loser.', pen: 'You can never <b>take</b> a village or town: you only plunder it.' },
  fortress: { name: 'Fortress Lord', boon: 'Walls cost <b>a clay and a timber</b>; each side of your rings takes <b>3 hits</b>; a settlement with its <b>whole ring standing</b> gathers <b>1 extra good</b> each time it is paid.', pen: 'Your host can’t end a march more than <b>2 steps</b> from your land.' },
  merchant: { name: 'Merchant', boon: 'Trade with the bank at <b>2 : 1</b> for anything.', pen: 'No men-at-arms, and your host is capped at <b>6</b>.' },
  warlord: { name: 'Warlord', boon: 'Men-at-arms cost <b>no ore</b>. After a <b>battle</b>, your host may <b>march again</b>, and batters walls with <b>2 free shots</b> a turn, no catapults needed.', pen: 'You can never build <b>towns</b>.' },
  builder: { name: 'Roadwarden', boon: 'Roads cost only <b>a timber</b>; the Longest Road is worth <b>3 points</b> to you.', pen: 'Your host fights at <b>−1 edge</b> when it marches out from off your roads.' },
  shepherd: { name: 'Shepherd King', boon: 'Once per build, <b>two wool</b> can stand in for any one missing good.', pen: 'On every 7 you lose <b>half your wool</b>.' },
  zealot: { name: 'Zealot', boon: 'Every fortune card you buy comes <b>twice</b>.', pen: 'You can never trade with <b>other lords</b>.' },
  bandit: { name: 'Bandit Lord', boon: 'On <b>every 7</b>, whoever rolled, <b>you</b> move the outlaws and rob.', pen: 'You can never build <b>walls</b>, and your settlements raise <b>no militia</b>: nobody fights for a bandit.' },
  pioneer: { name: 'Pioneer', boon: '<b>Landfall</b>: you may settle any free corner <b>on the coast</b> with no road to it.', pen: 'Roads cost <b>double</b>, and the Longest Road <b>never counts</b> for you.' },
  geomancer: { name: 'Geomancer', boon: 'Each village you build may raise <b>new land from the sea</b> beside it: you choose <b>1 of 3</b>. Your two starting villages raise land <b>for free</b>. Each town you build may turn <b>any land on the isle</b> to desert.', pen: 'Each later raising turns one land beside a settlement of yours to <b>desert</b>. You choose which, and a rival may share it.' },
  guild: { name: 'Banking Guild', boon: 'Whenever another lord trades with the bank, <b>half</b> the goods they hand over come to you.', pen: 'You can never trade with the <b>bank</b>.' } };
const chOf = L => L && L.charter && L.charter !== 'none' ? L.charter : null;
const costFor = (L, c) => { const ch = chOf(L); if (ch === 'builder' && c === COST.road) return { timber: 1 }; if (ch === 'fortress' && c === COST.walls) return { clay: 1, timber: 1 }; if (ch === 'pioneer' && c === COST.road) return { timber: 2, clay: 2 }; if (ch === 'warlord' && WAR_COST[UNITS.find(u => COST[u] === c)]) return WAR_COST[UNITS.find(u => COST[u] === c)]; return c; };
const WAR_COST = { sword: { grain: 1, wool: 1 } };   // the Warlord's men-at-arms come cheap: no ore
const short = (L, c) => Object.entries(c).reduce((a, [k, v]) => a + Math.max(0, v - (L.res[k] || 0)), 0);
let SHEP_MODE = 'two', SHEP_SEVEN = 'half';   // the Shepherd King: 2 wool stand in for 1 missing good; a 7 scatters every sheep   // drafting the Shepherd King's nerf: 'now' | 'two' | 'turn' | 'basic' | 'combo'
const shepCost = () => SHEP_MODE === 'three' ? 3 : SHEP_MODE === 'two' || SHEP_MODE === 'combo' ? 2 : 1;
const shepOK = (L, c) => { if (chOf(L) !== 'shepherd' || SHEP_MODE === 'off') return false; if ((SHEP_MODE === 'turn' || SHEP_MODE === 'combo') && L.woolUsed === G.round + ':' + G.cur) return false; if (SHEP_MODE === 'basic' && c !== COST.road && c !== COST.village) return false; return true; };
const canPay = (L, c) => { const c0 = c; c = costFor(L, c); const s = short(L, c); if (!s) return true; return shepOK(L, c0) && s === 1 && (L.res.wool || 0) >= (c.wool || 0) + shepCost(); };
const pay = (L, c) => { c = costFor(L, c); const s = short(L, c); for (const [k, v] of Object.entries(c)) L.res[k] -= Math.min(v, L.res[k] || 0); if (s && chOf(L) === 'shepherd') { L.res.wool -= s * shepCost(); L.woolUsed = G.round + ':' + G.cur; } };
const ringMax = v => (v.owner && chOf(lord(v.owner)) === 'fortress') ? 3 : 2;
function takeCharter(L, k) { L.charter = k; }
// the Warlord's host may march again straight after a battle, win or lose
function pressOn(L, battled) { L.deed = true; if (battled && chOf(L) === 'warlord' && !L.again && L.alive && hostSize(L) > 0) { L.again = true; L.deed = false; logMsg(`${pn(L.id)} ${vb(L.id, 'press', 'presses')} on: the Warlord may march again.`, youAre(L.id) ? 'big' : ''); } }
const fullRing = v => ringed(v) && v.edges.every(i => sideHp(v, G.edges[i]) > 0);
const onMyLand = (id, vi) => { const v = G.verts[vi]; return v.owner === id || v.edges.some(i => G.edges[i].owner === id); };
const gain = (L, k, n) => { L.res[k] = (L.res[k] || 0) + n; };
const handSize = L => RES.reduce((a, k) => a + L.res[k], 0);
const resText = o => Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${v} ${RES_NAME[k]}`).join(', ');
function logMsg(html, kind) { G.log.unshift({ html, kind }); if (G.log.length > 80) G.log.pop(); if (typeof UI !== 'undefined' && UI.toast) UI.toast(html, kind); }

/* ---------- the island, its corners and edges ---------- */
function setupGame(seed, humans, seats) {   // seats: the colours in play (2 to 6), in seat order
  Object.keys(G).forEach(k => delete G[k]);
  const rnd = mulberry(seed); G.seed = seed; G.round = 1; G.cur = 0; G.log = []; G.st = { h: {}, ev: [] }; G.winner = null; G.phase = 'roll'; G.dice = null; G.rs = (seed * 2654435761) | 0; G.offer = null;
  seats = seats && seats.length >= 2 ? LORDS.filter(id => seats.includes(id)) : LORDS.slice(0, 4); G.size = seats.length;
  G.map = makeMap(seed % 97 + 3, G.size);
  const w = new World({ W: G.size > 4 ? 2450 : 1900, H: G.size > 4 ? 2100 : 1600, s: 96, C: 2, style: 'civ', map: G.map }); G.world = w; G.tiles = w.tiles;
  const at = {}; G.tiles.forEach(t => at[t.q + ',' + t.r] = t);
  G.tiles.forEach(t => { t.nb = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => at[(t.q + a) + ',' + (t.r + b)]).filter(Boolean).map(x => x.i); t.verts = []; });
  G.verts = []; G.edges = []; const vk = {}, ek = {};
  G.tiles.forEach(t => { const ids = [];
    for (let k = 0; k < 6; k++) { const x = t.cx + w.s * Math.cos((60 * k - 90) * Math.PI / 180), y = t.cy + w.s * Math.sin((60 * k - 90) * Math.PI / 180), key = Math.round(x / 4) + ',' + Math.round(y / 4);
      let v = vk[key]; if (!v) { v = vk[key] = { id: G.verts.length, x, y, tiles: [], adj: [], edges: [], owner: null, level: 0, wall: 0, home: null, name: null }; const [vx, vy] = w.vis(x, y); v.vx = vx; v.vy = vy; G.verts.push(v); }
      v.tiles.push(t.i); ids.push(v.id); t.verts.push(v.id); }
    for (let k = 0; k < 6; k++) { const a = ids[k], b = ids[(k + 1) % 6], key = Math.min(a, b) + '-' + Math.max(a, b);
      let e = ek[key]; if (!e) { e = ek[key] = { id: G.edges.length, a, b, tiles: [], owner: null, wo: null, whp: 0 }; G.edges.push(e); G.verts[a].adj.push(b); G.verts[b].adj.push(a); G.verts[a].edges.push(e.id); G.verts[b].edges.push(e.id); } e.tiles.push(t.i); } });
  // the outlaw band (the robber) starts in a waste
  G.dens = []; G.robber = (G.tiles.find(t => t.type === 'desert') || G.tiles[0]).i;
  // the deck
  G.deck = []; for (const [k, n] of Object.entries(DECK)) for (let i = 0; i < n; i++) G.deck.push(k); for (let i = G.deck.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [G.deck[i], G.deck[j]] = [G.deck[j], G.deck[i]]; }
  const host0 = seats[0]; seats = seats.slice(); for (let i = seats.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [seats[i], seats[j]] = [seats[j], seats[i]]; }   // turn order is drawn by lot
  G.lords = seats.map((id, i) => ({ id, i, human: humans ? humans.includes(id) : id === host0, alive: true, res: { timber: 0, clay: 0, wool: 0, grain: 0, ore: 0 }, cards: ['rally'], fresh: [], played: false, outlaw: 2,
    hero: { name: HERO_NAME[id], lead: 1, sword: 1 + (i % 2), bow: 1 + ((i + 1) % 2), wounded: 0 }, army: { v: -1, units: { spear: 2, sword: 1, archer: 1, cata: 0 } }, deed: false, dens: 0, won: 0 }));
    for (const v of G.verts) w.reserve(v.vx, v.vy, 26);
  for (const t of G.tiles) if (t.num) w.reserve(t.cx, t.cy, 18);
  w.dress();
  G.lh = { road: null, host: null };
  // each lord places a village and a road, then a second pair in reverse order
  G.ports = placePorts();
  G.phase = 'setup'; const ord = G.lords.map((L, i) => i); G.setup = { order: ord.concat(ord.slice().reverse()), n: 0, step: 'charter', cn: 0, last: null }; G.cur = 0;
}
const castleOf = id => null;
const canStartVillage = v => canSettle(v) && !v.tiles.some(ti => G.tiles[ti].type === 'desert');
const canStartRoad = e => !e.owner && G.setup && (e.a === G.setup.last || e.b === G.setup.last);
const chartersFree = () => Object.keys(CHARTERS).filter(k => (!G.chset || G.chset.includes(k)) && !G.lords.some(Q => Q.charter === k));
// the host's choices for a game: which charters are on the table (null = all, [] = none) and how bold the computer lords are (0 gentle, 1 steady, 2 bloodthirsty)
function gameOptions(o) { G.chset = o && Array.isArray(o.chset) ? o.chset.filter(k => CHARTERS[k]) : null; G.bots = o && o.bots != null ? o.bots : 1;
  if (G.chset && !G.chset.length && G.setup && G.setup.step === 'charter') { for (const L of G.lords) L.chose = true; G.setup.cn = G.lords.length; G.setup.step = 'village'; G.cur = G.setup.order[0]; } }
const aggro = () => AI_AGGRO ? 2 : G.bots == null ? 1 : G.bots;
// everyone picks at once: first to confirm a charter gets it; computer lords take theirs once every player has chosen
function pickCharter(L, k) { if (!G.setup || G.setup.step !== 'charter' || L.chose || (k !== 'none' && !chartersFree().includes(k))) return false; takeCharter(L, k); L.chose = true; G.setup.cn++;
  if (k !== 'none') logMsg(`${pn(L.id)} ${vb(L.id, 'take', 'takes')} the <b>${CHARTERS[k].name}</b> charter.`); if (G.setup.cn >= G.lords.length) { G.setup.step = 'village'; G.cur = G.setup.order[0]; } else G.cur = G.lords.findIndex(Q => !Q.chose); return true; }
const playersChosen = () => G.lords.every(Q => !Q.human || Q.chose);
function charterBots() { if (!G.setup || G.setup.step !== 'charter' || !playersChosen()) return; for (const Q of G.lords) if (!Q.chose) { const k = aiCharter(Q); pickCharter(Q, k); if (k === 'none') logMsg(`${pn(Q.id)} ${vb(Q.id, 'keep', 'keeps')} to the old ways.`); } }
function aiCharter(L) { const f = chartersFree().filter(k => k !== 'warlord' || rand() < .5); return rand() < .3 || !f.length ? 'none' : f[rndInt(f.length)]; }
function setupVillage(L, v) { if (!canStartVillage(v)) return false; v.owner = L.id; v.level = 1; G.setup.last = v.id; G.setup.step = 'road';
  if (chOf(L) === 'geomancer') { geoStart(L, v, true); if (G.geo && !L.human) geoApply(L, ...aiGeo(L)); }
  if (G.setup.n < G.lords.length) { L.army.v = v.id; } else for (const ti of v.tiles) { const t = G.tiles[ti]; if (YIELD[t.type]) gain(L, YIELD[t.type], 1); }
  return true; }
function setupRoad(L, e) { if (!canStartRoad(e)) return false; e.owner = L.id; G.setup.step = 'village'; G.setup.last = null; G.setup.n++;
  if (G.setup.n >= G.setup.order.length) { G.setup = null; G.cur = 0; startTurn(); } else G.cur = G.setup.order[G.setup.n];
  return true; }
function aiSetupVillage(L) { const c = G.verts.filter(canStartVillage); const sc = v => vertValue(v, L) + rand() * .3; return c.sort((a, b) => sc(b) - sc(a))[0]; }
function aiSetupRoad(L) { return G.edges.filter(canStartRoad).sort((a, b) => edgeAim(b, L) - edgeAim(a, L))[0]; }
const settlements = id => G.verts.filter(v => v.owner === id);
const roadsOf = id => G.edges.filter(e => e.owner === id);

/* ---------- what may be built where ---------- */
function canSettle(v) { return !v.owner && v.tiles.length >= 2 && !v.adj.some(a => G.verts[a].owner) && !v.tiles.every(ti => G.tiles[ti].type === 'desert'); }
function canVillage(id, v) { return canSettle(v) && (v.edges.some(e => G.edges[e].owner === id) || (chOf(lord(id)) === 'pioneer' && v.tiles.length < 3)) && !armyBlocks(v, id); }
function canRoad(id, e) { if (e.owner || (e.wo && e.wo !== id)) return false; return [e.a, e.b].some(vi => { const v = G.verts[vi]; if (v.owner === id) return true; if (v.owner) return false; return v.edges.some(x => x !== e.id && G.edges[x].owner === id); }); }
const canTown = (id, v) => v.owner === id && v.level === 1 && chOf(lord(id)) !== 'warlord';
// walls stand on the borders like roads: a section shuts rivals out, a section over your own road is a gate
const WALL_MAX = 12;
const wallsOf = id => G.edges.filter(e => e.wo === id);
const touchesMine = (id, e) => [e.a, e.b].some(vi => { const v = G.verts[vi]; return v.owner === id || v.edges.some(x => G.edges[x].owner === id); });
const canWall = (id, e) => !!e && chOf(lord(id)) !== 'bandit' && e.tiles.length > 0 && !e.wo && (!e.owner || e.owner === id) && touchesMine(id, e) && wallsOf(id).length < WALL_MAX;
const canMend = (id, e) => !!e && e.wo === id && e.whp === 1 && ![e.a, e.b].some(vi => G.lords.some(O => O.alive && O.id !== id && O.army.v === vi));
const wallBlocks = (id, e) => !!e.wo && e.wo !== id && e.whp > 0;
const siegeShots = L => (L.army.units.cata || 0) + (chOf(L) === 'warlord' ? 2 : 0);
const shotsLeft = L => Math.max(0, siegeShots(L) - (L.shot || 0));
const canShoot = L => shotsLeft(L) > 0 && !(L.shot > 0 && L.deed) && hostSize(L) > 0;
const canBatter = (L, e) => !!e && wallBlocks(L.id, e) && (e.a === L.army.v || e.b === L.army.v) && canShoot(L);
const batterable = L => (L.army.v >= 0 ? G.verts[L.army.v].edges.map(i => G.edges[i]).filter(e => canBatter(L, e)) : []);
function hitWall(e, by) { if (e.whp <= 0) return; e.whp--; if (!e.whp) { logMsg(`${pn(by)} ${vb(by, 'tear', 'tears')} down ${youAre(e.wo) ? 'your' : PNM(e.wo) + "'s"} wall.`, youAre(e.wo) || youAre(by) ? 'big' : ''); e.wo = null; } }
// the wall's lord shoots back: every miss gives the defenders a volley at the catapults, better from a wall that guards a settlement
const backfire = e => [e.a, e.b].some(vi => G.verts[vi].owner === e.wo) ? .5 : 1 / 3;
function returnFire(L, wo, bf) { if (rand() >= bf || !L.army.units.cata) return false; L.army.units.cata--; logMsg(`${youAre(wo) ? 'Your' : PNM(wo) + "'s"} archers ${L.army.units.cata ? 'wreck one of ' + (youAre(L.id) ? 'your' : PNM(L.id) + "'s") + ' catapults' : 'wreck ' + (youAre(L.id) ? 'your' : PNM(L.id) + "'s") + ' catapult'}.`, youAre(L.id) || youAre(wo) ? 'big' : ''); return true; }
// rings: the first wall that touches your village or town raises a ring of stakes round it, with one side on each border into it.
// each side is broken on its own; a broken side lets armies through on that border only, and a new wall there raises it again
const ringed = v => !!v.owner && (v.ring || 0) > 0;
const sideHp = (v, e) => (e.a === v.id ? e.ra : e.rb) || 0;
const setSide = (v, e, hp) => { if (e.a === v.id) e.ra = hp; else e.rb = hp; };
const sideShut = (id, v, e) => ringed(v) && v.owner !== id && sideHp(v, e) > 0;
const edgeRingShut = (id, e) => sideShut(id, G.verts[e.a], e) || sideShut(id, G.verts[e.b], e);
function raiseRing(v) { v.ring = 1; for (const i of v.edges) setSide(v, G.edges[i], ringMax(v)); }
function dropRing(v) { v.ring = 0; for (const i of v.edges) setSide(v, G.edges[i], 0); }
const rivalNear = (id, v) => v.adj.concat(v.id).some(a => G.lords.some(O => O.alive && O.id !== id && O.army.v === a));
const canMendSide = (id, v, e) => !!v && !!e && v.owner === id && ringed(v) && v.edges.includes(e.id) && sideHp(v, e) > 0 && sideHp(v, e) < ringMax(v) && !rivalNear(id, v);
const sideToMend = (id, e) => [G.verts[e.a], G.verts[e.b]].find(v => canMendSide(id, v, e));
const canBatterSide = (L, v, e) => !!v && !!e && sideShut(L.id, v, e) && (e.a === L.army.v || e.b === L.army.v) && v.id !== L.army.v && canShoot(L);
const sidesBatterable = L => (L.army.v >= 0 ? G.verts[L.army.v].edges.map(i => G.edges[i]).map(e => [G.verts[e.a === L.army.v ? e.b : e.a], e]).filter(([v, e]) => canBatterSide(L, v, e)) : []);
function hitSide(v, e, by) { const hp = sideHp(v, e); if (hp <= 0) return; setSide(v, e, hp - 1); if (hp === 1) logMsg(`${pn(by)} ${vb(by, 'break', 'breaks')} through the ring round ${youAre(v.owner) ? 'your' : PNM(v.owner) + "'s"} ${v.level === 2 ? 'town' : 'village'} on one side.`, youAre(v.owner) || youAre(by) ? 'big' : ''); }
// a siege target: a wall section, or the ring round a settlement
const wallT = e => { const A = G.verts[e.a], B = G.verts[e.b]; return { kind: 'wall', e, owner: e.wo, hp: () => e.whp, hit: by => hitWall(e, by), max: 2, bf: backfire(e), x: (A.vx + B.vx) / 2, y: (A.vy + B.vy) / 2, what: 'wall' }; };
const ringT = (v, e) => { const o = G.verts[e.a === v.id ? e.b : e.a]; return { kind: 'ring', v, e, max: ringMax(v), owner: v.owner, hp: () => sideHp(v, e), hit: by => hitSide(v, e, by), bf: .5, x: v.vx + (o.vx - v.vx) * .3, y: v.vy + 4 + (o.vy - v.vy) * .3, what: 'ring of stakes' }; };
function batterAI(L, T) { L.battered = true; const shots = shotsLeft(L); for (let i = 0; i < shots && T.hp() > 0; i++) { L.shot = (L.shot || 0) + 1; if (rand() < .45) T.hit(L.id); else returnFire(L, T.owner, T.bf); } if (T.hp() > 0) logMsg(`${pn(L.id)} ${vb(L.id, 'batter', 'batters')} ${youAre(T.owner) ? 'your' : PNM(T.owner) + "'s"} ${T.what}${T.hp() < T.max ? ': it is cracked' : ', but it holds'}.`); }
function aiWallSpot(L) { let best = null, bs = 0; for (const e of G.edges) { if (!canWall(L.id, e)) continue; let s = 0; for (const vi of [e.a, e.b]) { const v = G.verts[vi]; if (v.owner === L.id) s += v.level * 2; } if (!s) continue;
    const far = G.verts[G.verts[e.a].owner === L.id ? e.b : e.a]; if (G.lords.some(O => O.alive && O !== L && Math.hypot(G.verts[O.army.v] ? G.verts[O.army.v].x - far.x : 1e9, G.verts[O.army.v] ? G.verts[O.army.v].y - far.y : 0) < 260)) s += 2; if (e.owner === L.id) s -= 1; if (s > bs) { bs = s; best = e; } } return best; }
function aiBatterSpot(L) { const rg = sidesBatterable(L)[0]; if (rg) return ringT(rg[0], rg[1]); let best = null, bs = 0; for (const e of batterable(L)) { const far = G.verts[e.a === L.army.v ? e.b : e.a]; let s = 1; if (far.owner && far.owner !== L.id) s += 3; if (far.adj.some(a => G.verts[a].owner && G.verts[a].owner !== L.id)) s += 2; if (s > bs) { bs = s; best = e; } } return bs >= 3 ? wallT(best) : null; }
const armyBlocks = (v, id) => G.lords.some(L => L.alive && L.id !== id && L.army.v === v.id);
// what each charter looks for in land: a weight per good, and a taste for the coast
const CH_TASTE = { pioneer: { coast: 2 }, geomancer: { coast: 2.5 } };   // tried wool for the Shepherd King and clay/timber for builders: they settled worse land and won less
function vertValue(v, L) { const T = (L && CH_TASTE[chOf(L)]) || {}; let s = 0; const kinds = new Set(); for (const ti of v.tiles) { const t = G.tiles[ti]; if (!YIELD[t.type]) continue; s += pips(t.num) * ((T.w && T.w[YIELD[t.type]]) || 1); kinds.add(t.type); if (L && settlements(L.id).some(o => o.tiles.some(x => G.tiles[x].type === t.type))) s -= .4; } return s + kinds.size * (T.mix != null ? T.mix : .7) + (T.coast && v.tiles.length < 3 ? T.coast : 0); }
function edgeAim(e, L) { return Math.max(...[e.a, e.b].map(vi => { const v = G.verts[vi]; let best = canSettle(v) ? vertValue(v, L) : 0; for (const a of v.adj) if (canSettle(G.verts[a])) best = Math.max(best, vertValue(G.verts[a], L) * .8); return best; })); }
/* monuments: a late way to the last points. Raise one on a tile that only you settle: it gives you 1 glory, and the tile never pays again.
   They fall, and the land pays once more, only if their lord is wiped out */
const monumentsOf = id => G.tiles.filter(t => t.mono === id);
const monoCost = L => { const n = monumentsOf(L.id).length; return n ? { ore: 3 + n, clay: 3 + n, grain: 2 + n } : COST.monument; };
const MONO_MAX = 3;
const MONUMENTS_ON = false;   // monuments are switched off: points come easily enough without them
const canMonument = (id, t) => MONUMENTS_ON && !!t && monumentsOf(id).length < MONO_MAX && !t.mono && !!t.num && t.verts.some(vi => G.verts[vi].owner === id) && !t.verts.some(vi => G.verts[vi].owner && G.verts[vi].owner !== id);
function raiseMonument(L, t) { if (!canMonument(L.id, t) || !canPay(L, monoCost(L))) return false; pay(L, monoCost(L)); t.num0 = t.num; t.num = 0; t.mono = L.id; logMsg(`${pn(L.id)} ${vb(L.id, 'raise', 'raises')} ${tileName(ti)} from the sea${was ? `, and ${was} withers to waste` : ''}.`, youAre(L.id) ? 'big' : ''); return true; }
function fellMonuments(id) { for (const t of G.tiles) if (t.mono === id) { t.num = t.num0; t.mono = null; } }
function build(L, kind, x) {
  if (!canPay(L, COST[kind])) return false;
  if (kind === 'road') { if (!canRoad(L.id, x)) return false; x.owner = L.id; }
  else if (kind === 'village') { if (!canVillage(L.id, x)) return false; x.owner = L.id; x.level = 1; if (chOf(L) === 'geomancer') geoStart(L, x); }
  else if (kind === 'town') { if (!canTown(L.id, x)) return false; x.level = 2; if (chOf(L) === 'geomancer') G.parch = { who: L.id }; }
  else if (kind === 'walls') { if (!canWall(L.id, x)) return false; x.wo = L.id; x.whp = 2; for (const vi of [x.a, x.b]) { const v = G.verts[vi]; if (v.owner !== L.id) continue; if (!ringed(v)) raiseRing(v); else setSide(v, x, ringMax(v)); } }
  else if (kind === 'mendSide') { const v = sideToMend(L.id, x); if (!v) return false; setSide(v, x, ringMax(v)); }
  else if (kind === 'mend') { if (!canMend(L.id, x)) return false; x.whp = 2; }
  else return false;
  pay(L, COST[kind]); awards(); return true;
}
function drawCard(L) { if (!G.deck.length) return null; const k = G.deck.pop(); L.fresh.push(k); return k; }
function buyCard(L) { if (!canPay(L, COST.card) || !G.deck.length) return null; pay(L, COST.card); const k = drawCard(L); if (chOf(L) === 'zealot') drawCard(L); return k; }
function recruitHere(L) { const v = G.verts[L.army.v]; return v && v.owner === L.id; }
const canRecruit = (L, unit) => !(chOf(L) === 'merchant' && (unit === 'sword' || (unit !== 'cata' && hostSize(L) >= 6)));
function recruit(L, unit) { if (!recruitHere(L) || !canRecruit(L, unit) || !canPay(L, COST[unit])) return false; pay(L, COST[unit]); L.army.units[unit] = (L.army.units[unit] || 0) + 1; awards(); return true; }
const bankRate = L => chOf(L) === 'merchant' ? 2 : portOf(L) ? 3 : 4;
/* ---------- harbours: a pier on the coast; a host standing on its landing (the pier's two corners) trades with the bank at 3 : 1 ---------- */
const PORT_NAMES = ['Saltmarsh', 'Gull Rock', 'Westhaven', 'Tern Quay', 'Kelp Landing', 'Driftwood Cove'];
// one fewer harbour than lords, each on a single coastal corner, on poor land (deserts, 2s and 12s) and spread round the isle
function placePorts() { const w = G.world, n = Math.max(1, G.lords.length - 1), worth = v => v.tiles.reduce((a, ti) => a + (G.tiles[ti].num ? pips(G.tiles[ti].num) : 0), 0);
  const cand = G.verts.filter(v => v.tiles.length === 2).sort((a, b) => worth(a) - worth(b) || a.id - b.id), out = [];
  for (const gap of [w.s * 3.2, w.s * 2.4, w.s * 1.6]) { for (const v of cand) { if (out.length >= n) break; if (out.some(p => Math.hypot(G.verts[p.v].x - v.x, G.verts[p.v].y - v.y) < gap)) continue; out.push({ v: v.id, name: PORT_NAMES[out.length] }); } if (out.length >= n) break; }
  return out; }
const portLanding = (p, vi) => p.v === vi;
const portAt = vi => (G.ports || []).find(p => portLanding(p, vi));
const portOf = L => L && L.alive && hostSize(L) > 0 && L.army.v >= 0 ? portAt(L.army.v) : null;
const portHolder = p => G.lords.find(Q => Q.alive && hostSize(Q) > 0 && portLanding(p, Q.army.v));
function bankTrade(L, give, get) { const n = bankRate(L); if (chOf(L) === 'guild' || L.res[give] < n || give === get) return false; L.res[give] -= n; L.res[get]++;
  const Gd = G.lords.find(Q => Q.alive && Q !== L && chOf(Q) === 'guild'); const half = Math.floor(n / 2); if (Gd && half) { gain(Gd, give, half); Gd.guilded = (Gd.guilded || 0) + half; if (youAre(Gd.id)) logMsg(`The bank pays the Guild: you take ${half} ${RES_NAME[give]} from ${pn(L.id)}${youAre(L.id) ? 'r' : "'s"} trade.`); } return true; }
// a rival weighs an offer by how scarce each good is to them
function aiAccepts(O, give, get, asker) { // give: what the asker gives O; get: what the asker wants from O
  if (Object.entries(get).some(([k, v]) => O.res[k] < v)) return false; if (asker && vp(asker.id) >= winPts() - 2) return false;
  const val = (k, n, sign) => { let s = 0; for (let i = 0; i < n; i++) s += 1 / (1 + O.res[k] + sign * i); return s; };
  let inn = 0, out = 0; for (const [k, v] of Object.entries(give)) inn += val(k, v, 1); for (const [k, v] of Object.entries(get)) out += val(k, v, -1) * (O.res[k] - v <= 0 ? 1.6 : 1);
  return inn > out * 1.05; }
function doTrade(A, B, give, get) { for (const [k, v] of Object.entries(give)) { A.res[k] -= v; B.res[k] += v; } for (const [k, v] of Object.entries(get)) { B.res[k] -= v; A.res[k] += v; } }

/* ---------- points ---------- */
/* hurrying a slow player: after a while, half the players (rounded up) can vote to start a 30 second timer; any move by them stops it */
const HURRY_AFTER = 90, HURRY_SECS = 30;
const hurryVoters = () => G.lords.filter(Q => Q.alive && Q.human);
const hurryNeed = () => Math.max(1, Math.min(2, hurryVoters().length));
function vp(id) { const L = lord(id); if (!L) return 0; let n = monumentsOf(id).length; for (const v of G.verts) if (v.owner === id) n += v.level; n += L.cards.filter(c => c === 'chronicle').length + L.fresh.filter(c => c === 'chronicle').length; if (G.lh.road === id) n += chOf(L) === 'builder' ? 3 : 2; if (G.lh.host === id) n += 2; return n; }
const hostSize = L => (L.army.units.spear || 0) + (L.army.units.sword || 0) + (L.army.units.archer || 0);
function longestRoad(id) {
  const mine = roadsOf(id); let best = 0;
  const blocked = vi => { const v = G.verts[vi]; return v.owner && v.owner !== id; };
  const dfs = (vi, used, len) => { best = Math.max(best, len); if (len > 0 && blocked(vi)) return; for (const eid of G.verts[vi].edges) { const e = G.edges[eid]; if (e.owner !== id || used.has(eid)) continue; used.add(eid); dfs(e.a === vi ? e.b : e.a, used, len + 1); used.delete(eid); } };
  for (const e of mine) { dfs(e.a, new Set(), 0); dfs(e.b, new Set(), 0); }
  return best; }
function awards() {
  const alive = G.lords.filter(L => L.alive);
  const road = alive.filter(L => chOf(L) !== 'pioneer').map(L => [L.id, longestRoad(L.id)]), cur = G.lh.road;
  const curLen = cur ? (road.find(r => r[0] === cur) || [0, 0])[1] : 4; const top = road.sort((a, b) => b[1] - a[1])[0] || [null, 0];
  if (top[1] >= 5 && top[1] > (cur && lord(cur).alive ? curLen : 4) && top[0] !== cur) { G.lh.road = top[0]; chron(`${lordName(top[0])}'s road became the longest on the isle.`); logMsg(`${pn(top[0])} ${vb(top[0], 'have', 'has')} the <b>Longest Road</b> (${top[1]}): 2 points.`, youAre(top[0]) ? 'big' : ''); }
  if (cur && (!lord(cur).alive || longestRoad(cur) < 5)) G.lh.road = null;
  const host = alive.map(L => [L.id, hostSize(L)]).sort((a, b) => b[1] - a[1]), hc = G.lh.host, hcs = hc && lord(hc).alive ? hostSize(lord(hc)) : 9;
  if (host[0][1] >= 10 && host[0][1] > hcs && host[0][0] !== hc) { G.lh.host = host[0][0]; chron(`${lordName(host[0][0])} mustered the greatest host.`); logMsg(`${pn(host[0][0])} ${vb(host[0][0], 'lead', 'leads')} the <b>Greatest Host</b> (${host[0][1]} men): 2 points.`, youAre(host[0][0]) ? 'big' : ''); }
  if (hc && (!lord(hc).alive || hostSize(lord(hc)) < 10)) G.lh.host = null;
}
function checkWin() { if (G.winner) return G.winner; if (G.phase === 'setup') return null; const alive = G.lords.filter(l => l.alive); if (alive.length === 1) return (G.winner = alive[0].id); for (const L of alive) if (vp(L.id) >= winPts()) return (G.winner = L.id); return null; }

/* ---------- turns, dice and the outlaw band ---------- */
function startTurn() { const L = curL(); if (!L.alive) return; L.deed = false; L.again = false; L.battered = false; L.shot = 0; L.played = false; L.cards.push(...L.fresh); L.fresh = []; if (L.hero.wounded > 0) L.hero.wounded--; G.phase = 'roll'; G.dice = null; }
function nextLord() { G.hurry = null; do { G.cur = (G.cur + 1) % G.lords.length; if (G.cur === 0) endRound(); } while (!G.lords[G.cur].alive); startTurn(); }
function chron(txt) { const s = (G.st = G.st || { h: {}, ev: [] }); if (s.ev.some(e => e[1] === txt && G.round - e[0] < 6)) return; s.ev.push([G.round, txt]); if (s.ev.length > 60) s.ev.shift(); }
function endRound() { const s = (G.st = G.st || { h: {}, ev: [] }); for (const L of G.lords) (s.h[L.id] = s.h[L.id] || []).push(L.alive ? vp(L.id) : 0); G.round++; }
function rollDice() {
  const L = curL(), a = d6(), b = d6(), n = a + b; G.dice = [a, b];
  if (n === 7) {
    for (const Q of G.lords) if (Q.alive && chOf(Q) === 'shepherd' && Q.res.wool > (SHEP_SEVEN === 'all' ? 0 : 1)) { const lost = SHEP_SEVEN === 'all' ? Q.res.wool : Math.floor(Q.res.wool / 2); Q.res.wool -= lost; if (youAre(Q.id)) logMsg(`Seven! Your flocks scatter: you lose ${lost} wool.`, 'war'); }
    const B = G.lords.find(Q => Q.alive && chOf(Q) === 'bandit'); G.robBy = B && B !== L ? B.id : null;
    G.phase = 'robber'; logMsg(`${pn(L.id)} rolled <b>7</b>. ${G.robBy ? (youAre(B.id) ? 'The outlaws answer to you, Bandit Lord.' : 'The Bandit Lord ' + pn(B.id) + ' moves the outlaw band.') : 'The outlaw band moves.'}`, 'war'); return n;
  }
  const got = {};
  for (const t of G.tiles) { if (t.num !== n || !YIELD[t.type] || G.robber === t.i) continue; for (const vi of t.verts) { const v = G.verts[vi]; if (!v.owner || !lord(v.owner) || !lord(v.owner).alive) continue; const O = lord(v.owner), rk = YIELD[t.type]; let amt = v.level + (chOf(O) === 'fortress' && fullRing(v) ? 1 : 0); if (amt) { gain(O, rk, amt); O.got = (O.got || 0) + amt; } if (youAre(v.owner) && amt) got[rk] = (got[rk] || 0) + amt; } }
  if (Object.keys(got).length) logMsg(`${pn(L.id)} rolled <b>${n}</b>. You gather ${resText(got)}.`); else logMsg(`${pn(L.id)} rolled <b>${n}</b>.${youAre(L.id) ? ' Nothing for you.' : ''}`);
  G.phase = 'main'; return n;
}
function robTargets(L, ti) { const ids = new Set(); for (const vi of G.tiles[ti].verts) { const v = G.verts[vi]; if (v.owner && v.owner !== L.id && lord(v.owner) && lord(v.owner).alive && handSize(lord(v.owner))) ids.add(v.owner); } return [...ids].map(lord); }
const robberOf = () => (G.robBy && lord(G.robBy)) || curL();
function moveRobber(L, ti, victim) {
  G.robber = ti; G.robBy = null; const opts = robTargets(L, ti); const O = victim || opts[rndInt(opts.length)];
  if (O) { const got = {}; for (let i = 0; i < 1; i++) { const have = RES.filter(k => O.res[k] > 0); if (!have.length) break; const k = have[rndInt(have.length)]; O.res[k]--; L.res[k]++; got[k] = (got[k] || 0) + 1; } logMsg(`The outlaws settle on ${tileName(ti)}. ${pn(L.id)} ${vb(L.id, 'rob', 'robs')} ${pn(O.id)} of ${youAre(L.id) || youAre(O.id) ? resText(got) : 'goods'}.`, youAre(O.id) ? 'war' : ''); }
  else logMsg(`The outlaws settle on ${tileName(ti)}.`);
  if (G.phase === 'robber') G.phase = 'main';
}
const TNAME = { forest: 'the woods', hill: 'the clay hills', pasture: 'the pastures', field: 'the fields', mountain: 'the mountains', desert: 'the waste' };
const tileName = ti => `<b>${TNAME[G.tiles[ti].type]} (${G.tiles[ti].num || '–'})</b>`;
function playCard(L, k, arg) {
  if (L.played || !L.cards.includes(k) || CARDS[k].battle || k === 'chronicle') return false; L.cards.splice(L.cards.indexOf(k), 1); L.played = true;
  if (k === 'knight') { L.army.units.sword = (L.army.units.sword || 0) + 1; awards(); }
  if (k === 'plenty') { for (const r of arg) gain(L, r, 1); logMsg(`${pn(L.id)} ${vb(L.id, 'play', 'plays')} <b>Year of Plenty</b>.`); }
  if (k === 'monopoly') { let n = 0; for (const O of G.lords) if (O !== L) { n += O.res[arg]; L.res[arg] += O.res[arg]; O.res[arg] = 0; } logMsg(`${pn(L.id)} ${vb(L.id, 'play', 'plays')} <b>Monopoly</b> on ${RES_NAME[arg]}: ${n} handed over.`, vb(L.id, 'big', 'war')); }
  if (k === 'roads') { L.freeRoads = 2; }
  return true;
}

/* ---------- marching: the host walks corner to corner ---------- */
const MARCH = 2;
function marchMap(L) { // cost to reach each corner (own roads 1, open ground 2); enemy corners and dens are targets
  const from = L.army.v, cost = new Map([[from, 0]]), prev = new Map(), q = [from], targets = [];
  while (q.length) { q.sort((a, b) => cost.get(a) - cost.get(b)); const vi = q.shift(), c0 = cost.get(vi);
    for (const eid of G.verts[vi].edges) { const e = G.edges[eid], ni = e.a === vi ? e.b : e.a, c = c0 + (e.owner === L.id || chOf(L) === 'raider' ? 1 : 2); if (c > MARCH || wallBlocks(L.id, e) || edgeRingShut(L.id, e)) continue; if (cost.has(ni) && cost.get(ni) <= c) continue;
      const nv = G.verts[ni], foe = G.lords.find(O => O.alive && O !== L && O.army.v === ni);
      cost.set(ni, c); prev.set(ni, vi);
      if ((nv.owner && nv.owner !== L.id) || foe) { targets.push(ni); continue; }
      q.push(ni); } }
  if (chOf(L) === 'fortress') { const near = new Map(); const q2 = []; for (const v of G.verts) if (onMyLand(L.id, v.id)) { near.set(v.id, 0); q2.push(v.id); } while (q2.length) { const a = q2.shift(), d = near.get(a); if (d >= 2) continue; for (const b of G.verts[a].adj) if (!near.has(b)) { near.set(b, d + 1); q2.push(b); } }
    for (const k of [...cost.keys()]) if (k !== from && !near.has(k)) cost.delete(k); for (let i = targets.length - 1; i >= 0; i--) if (!near.has(targets[i])) targets.splice(i, 1); }
  return { cost, prev, targets }; }
function pathTo(M, vi) { const p = [vi]; while (M.prev.has(p[0])) p.unshift(M.prev.get(p[0])); return p; }
function denAt(vi) { return G.dens.find(d => !d.cleared && G.tiles[d.tile].verts.includes(vi)); }
function dendTargets(L, M) { const out = []; for (const d of G.dens) if (!d.cleared && G.tiles[d.tile].verts.some(vi => M.cost.has(vi) && !M.targets.includes(vi))) out.push(d); return out; }
function terrainGuard(vi) { return G.verts[vi].tiles.some(ti => ['forest', 'hill'].includes(G.tiles[ti].type)) ? 1 : 0; }
function defenders(vi) { // a corner: its settlement's folk, plus whatever host stands there
  const v = G.verts[vi], u = { spear: 0, sword: 0, archer: 0, militia: 0 }; let hero = null, owner = v.owner;
  if (v.owner && chOf(lord(v.owner)) !== 'bandit') { u.militia += v.level === 2 ? 4 : 2; if (v.level === 2) u.spear += 2; }
  const host = G.lords.find(O => O.alive && O.army.v === vi && (!v.owner || O.id === v.owner)); if (host) { owner = owner || host.id; for (const k of ['spear', 'sword', 'archer']) u[k] += host.army.units[k] || 0; if (!host.hero.wounded) hero = host.hero; }
  const wallG = 0; // settlements no longer have ring walls: their walls stand on the borders
  return { owner: owner || 'neutral', units: u, hero, guard: Math.min(3, wallG + terrainGuard(vi) + (host && portAt(vi) ? 1 : 0)), garrison: false, host, edge: host && chOf(host) === 'builder' && !onMyLand(host.id, vi) ? -1 : 0 }; }
function denDefenders(d) { return { owner: 'raider', units: Object.assign({ spear: 0, sword: 0, archer: 0 }, d.units), hero: null, guard: 1, garrison: true }; }
function attackerSide(L) { return { owner: L.id, units: L.army.units, hero: L.hero.wounded ? null : L.hero, edge: chOf(L) === 'builder' && L.army.v >= 0 && !onMyLand(L.id, L.army.v) ? -1 : 0 }; }
function retreatTo(L) { const M = marchMap(L); let best = null, bc = 99; for (const v of settlements(L.id)) { const c = M.cost.has(v.id) ? M.cost.get(v.id) : 50 + Math.hypot(v.x - G.verts[L.army.v].x, v.y - G.verts[L.army.v].y) / 96; if (c < bc && !armyBlocks(v, L.id)) { bc = c; best = v; } } return best ? best.id : -1; }
function applyBattle(L, target, S, stopV) {
  const sA = skSurvivors(S, 'A'), sD = skSurvivors(S, 'D'), won = S.result === 'A' || S.result === 'D_fell';
  for (const k of ['spear', 'sword', 'archer']) L.army.units[k] = sA[k] || 0; if (sA.heroDown) L.hero.wounded = 2; L.won += won ? 1 : 0;
  if (target.den) { const d = target.den; if (won) { d.cleared = true; L.dens++; const loot = {}; for (let i = 0; i < 4; i++) { const k = RES[rndInt(5)]; loot[k] = (loot[k] || 0) + 1; gain(L, k, 1); } L.army.v = stopV; logMsg(`${pn(L.id)} cleared an outlaw den: 1 point and ${L.human ? resText(loot) : 'their loot'}.`, youAre(L.id) ? 'big' : ''); }
    else { d.units = { spear: Math.max(2, sD.spear || 0), archer: sD.archer || 0 }; L.army.v = stopV; logMsg(`${pn(L.id)} ${vb(L.id, 'were', 'was')} thrown back from the outlaw den.`, youAre(L.id) ? 'war' : ''); }
    pressOn(L, true); awards(); return won; }
  const vi = target.v, v = G.verts[vi], D = target.D, H = D.host;
  if (H) { const left = Object.assign({}, sD); const folk = v.owner && chOf(lord(v.owner)) !== 'bandit'; let mil = folk ? (v.level === 2 ? 4 : 2) : 0; left.militia = Math.max(0, (left.militia || 0) - mil); for (const k of ['spear', 'sword', 'archer']) H.army.units[k] = Math.max(0, (left[k] || 0) - (k === 'spear' && v.level === 2 && folk ? 2 : 0)); if (sD.heroDown) H.hero.wounded = 2; }
  const old = v.owner;
  if (won) {
    if (H) { if (hostSize(H) > 0) H.army.v = retreatTo(H); else { H.army.units = { spear: 0, sword: 0, archer: 0, cata: H.army.units.cata || 0 }; } if (H.army.v === vi || H.army.v == null) H.army.v = (G.verts.find(x => x.owner === H.id) || { id: -1 }).id; }
    if (old && chOf(L) === 'raider') { logMsg(`${pn(L.id)} ${vb(L.id, 'sack', 'sacks')} ${v.level === 2 ? 'a town' : 'a village'} of ${pn(old)}, and ${vb(L.id, 'ride', 'rides')} off.`, youAre(L.id) ? 'big' : youAre(old) ? 'war' : ''); }
    else if (old) { v.owner = L.id; v.wall = Math.max(0, v.wall - 50); dropRing(v); L.taken = (L.taken || 0) + 1; chron(`${lordName(L.id)} took a ${v.level === 2 ? 'town' : 'village'} from ${lordName(old)}.`);
      if (!settlements(old).length && lord(old)) { const O = lord(old); O.alive = false; chron(`${lordName(old)} lost the last of their lands and left the isle.`); for (const e of G.edges) if (e.owner === old) e.owner = null; for (const k of RES) { L.res[k] += O.res[k]; O.res[k] = 0; } O.army.v = -1; if (monumentsOf(old).length) { fellMonuments(old); logMsg(`${PNM(old)}'s monuments are pulled down, and their lands pay again.`, 'war'); } logMsg(`${pn(L.id)} ${vb(L.id, 'take', 'takes')} the last ${PNM(old)} settlement and ${vb(L.id, 'seize', 'seizes')} their stores. <b>${youAre(old) ? 'You are' : PNM(old) + ' is'} out.</b>`, 'war'); }
      else logMsg(`${pn(L.id)} ${vb(L.id, 'take', 'takes')} ${v.level === 2 ? 'a town' : 'a village'} from ${pn(old)}.`, youAre(L.id) ? 'big' : youAre(old) ? 'war' : ''); }
    else logMsg(`${pn(L.id)} ${vb(L.id, 'rout', 'routs')} ${pn(H ? H.id : 'neutral')}'s host in the field.`, youAre(L.id) ? 'big' : H && youAre(H.id) ? 'war' : '');
    L.army.v = old && chOf(L) === 'raider' ? stopV : vi;
  } else { L.army.v = stopV; logMsg(`${pn(L.id)} ${vb(L.id, 'were', 'was')} thrown back${old ? ' from ' + ('a ' + (v.level === 2 ? 'town' : 'village') + ' of ' + pn(old)) : ''}.`, youAre(L.id) ? 'war' : youAre(old) ? 'big' : ''); }
  if (won) { const victim = old ? lord(old) : H; if (chOf(L) === 'raider' && victim) { const got = {}; for (let i = 0; i < 4; i++) { const have = RES.filter(k => victim.res[k] > 0); if (!have.length) break; const k = have[rndInt(have.length)]; victim.res[k]--; gain(L, k, 1); got[k] = (got[k] || 0) + 1; }
      if (Object.keys(got).length) logMsg(`${pn(L.id)} ${vb(L.id, 'plunder', 'plunders')} ${youAre(L.id) || youAre(victim.id) ? resText(got) : 'goods'} from ${pn(victim.id)}.`, youAre(victim.id) ? 'war' : youAre(L.id) ? 'big' : ''); } }
  pressOn(L, true);
  awards(); return won;
}

/* ---------- the rival lords ---------- */
const strength = u => (u.spear || 0) * 2.2 + (u.sword || 0) * 3 + (u.archer || 0) * 1.7 + (u.militia || 0) * 1.3;
function aiRobber(L) { let best = null, bs = -99; const lead = G.lords.filter(o => o.alive && o !== L).sort((a, b) => vp(b.id) - vp(a.id))[0];
  for (const t of G.tiles) { if (t.i === G.robber || !t.num) continue; let s = 0; for (const vi of t.verts) { const v = G.verts[vi]; if (!v.owner) continue; s += (v.owner === L.id ? -2 : v.owner === (lead && lead.id) ? 1.4 : 1) * pips(t.num) * v.level; } s += rand() * .5; if (s > bs) { bs = s; best = t.i; } } return best; }
function need(L) { const c = canTown(L.id, settlements(L.id).find(v => v.level === 1) || {}) ? COST.town : COST.village; return c; }
function aiTrade(L, cost) { for (const [k, v] of Object.entries(cost)) { if (L.res[k] >= v) continue; const spare = RES.filter(r => L.res[r] >= bankRate(L) + (cost[r] || 0)).sort((a, b) => L.res[b] - L.res[a])[0]; if (spare) bankTrade(L, spare, k); } }
function aiBuild(L) {
  for (let it = 0; it < 14; it++) {
    const town = settlements(L.id).filter(v => v.level === 1).sort((a, b) => vertValue(b) - vertValue(a))[0];
    if (town && canPay(L, COST.town) && build(L, 'town', town)) { if (G.parch && G.parch.who === L.id) parchApply(L, aiParch(L)); continue; }
    const spots = G.verts.filter(v => canVillage(L.id, v)).sort((a, b) => vertValue(b, L) - vertValue(a, L));
    if (spots[0] && canPay(L, COST.village) && build(L, 'village', spots[0])) { if (G.geo && G.geo.who === L.id) { const [p, s] = aiGeo(L); geoApply(L, p, s); } continue; }
    if (L.freeRoads || (canPay(L, COST.road) && !spots.length && roadsOf(L.id).length < 15) || (canPay(L, COST.road) && L.res.timber + L.res.clay > 4)) { const opts = G.edges.filter(e => canRoad(L.id, e)).sort((a, b) => edgeAim(b, L) - edgeAim(a, L)); if (opts[0] && edgeAim(opts[0], L) > 0) { if (L.freeRoads) { opts[0].owner = L.id; L.freeRoads--; awards(); continue; } if (build(L, 'road', opts[0])) continue; } }
    // the host
    const threat = G.lords.some(O => O.alive && O !== L && hostSize(O) > hostSize(L));
    if (recruitHere(L) && (hostSize(L) < (chOf(L) === 'warlord' ? 10 : [3, 5, 8][aggro()]) + G.round / 2 || threat) && (aggro() === 2 || chOf(L) === 'warlord' || rand() < (aggro() ? .8 : .5))) { const want = (L.army.units.archer || 0) < (L.army.units.spear || 0) / 2 ? 'archer' : canPay(L, COST.sword) && rand() < .5 ? 'sword' : 'spear'; if (recruit(L, want)) continue; }
    if (canPay(L, COST.card) && rand() < .5 && buyCard(L)) continue;
    if (L.army.units.cata < 1 && (hostSize(L) >= 8 || (G.round > 8 && (G.edges.some(e => wallBlocks(L.id, e)) || G.verts.some(v => ringed(v) && v.owner !== L.id)))) && recruitHere(L) && recruit(L, 'cata')) continue;
    if (vp(L.id) >= winPts() - 3) { const mt = G.tiles.filter(t => canMonument(L.id, t)).sort((a, b) => pips(a.num) - pips(b.num))[0]; if (mt) { if (!canPay(L, monoCost(L))) aiTrade(L, monoCost(L)); if (canPay(L, monoCost(L)) && raiseMonument(L, mt)) continue; } }
    const sore = wallsOf(L.id).find(e => canMend(L.id, e)); if (sore && canPay(L, COST.mend) && build(L, 'mend', sore)) continue;
    const sr = G.edges.find(e => sideToMend(L.id, e)); if (sr && canPay(L, COST.mend) && build(L, 'mendSide', sr)) continue;
    const we = G.round > 4 && canPay(L, COST.walls) ? aiWallSpot(L) : null; if (we && rand() < .5 && build(L, 'walls', we)) continue;
    if (handSize(L) > 7) { const before = handSize(L); aiTrade(L, need(L)); if (handSize(L) < before) continue; }
    break; }
  L.freeRoads = 0; }
function aiCards(L) { if (L.played) return; if (L.cards.includes('knight') && (G.tiles[G.robber].verts.some(vi => G.verts[vi].owner === L.id) || rand() < .3)) { playCard(L, 'knight'); moveRobber(L, aiRobber(L)); return; }
  if (L.cards.includes('roads') && roadsOf(L.id).length < 13) { playCard(L, 'roads'); return; }
  if (L.cards.includes('plenty')) { const c = need(L), miss = RES.filter(k => (c[k] || 0) > L.res[k]); playCard(L, 'plenty', [miss[0] || 'ore', miss[1] || miss[0] || 'grain']); return; }
  if (L.cards.includes('monopoly') && rand() < .5) playCard(L, 'monopoly', 'ore'); }
let AI_AGGRO = false;   // bolder computer lords: attack at worse odds, march on rivals sooner, keep a bigger host
function aiDeed(L) {
  if (L.hero.wounded && hostSize(L) < 4) return { kind: 'rest' };
  const M = marchMap(L), mine = strength(L.army.units) + (L.hero.wounded ? 0 : 3); let best = null, bv = 0;
  for (const vi of M.targets) { const D = defenders(vi), v = G.verts[vi]; const ratio = mine / Math.max(1, strength(D.units) * (1 + D.guard * .25)); const val = ratio * (v.level ? v.level * 2 + 1 : 1.2) * (lord(v.owner) && lord(v.owner).human ? 1.05 : 1); if (ratio > (chOf(L) === 'warlord' && aggro() ? .95 : [1.8, 1.35, 1.1][aggro()]) && val > bv) { bv = val; best = { kind: 'attack', v: vi, M }; } }
  if (best) return best;
  // harbours: hold one if you're there; otherwise go and take a free landing within reach
  if ((G.ports || []).length && hostSize(L) >= 3) { if (portOf(L) && rand() < .6) return { kind: 'rest' };
    if (!portOf(L) && rand() < .5) { const land = [...M.cost.keys()].filter(vi => vi !== L.army.v && portAt(vi) && !G.verts[vi].owner && !armyBlocks(G.verts[vi], L.id) && !G.lords.some(Q => Q !== L && Q.alive && Q.army.v === vi)); if (land.length) return { kind: 'move', v: land[0], M }; } }
  // with catapults, go and sit outside a rival's ring, ready to batter it next turn
  if (siegeShots(L) > 0 && hostSize(L) >= 5) { const spots = new Map(); for (const v of G.verts) { if (!ringed(v) || v.owner === L.id) continue; const D = defenders(v.id), w = strength(D.units) * (1 + D.guard * .25); for (const i of v.edges) { const e = G.edges[i], o = e.a === v.id ? e.b : e.a; if (sideHp(v, e) > 0 && !G.verts[o].owner && (!spots.has(o) || spots.get(o) > w)) spots.set(o, w); } }
    if (spots.size && !spots.has(L.army.v)) { const reach = [...M.cost.keys()].filter(vi => spots.has(vi) && !armyBlocks(G.verts[vi], L.id)); if (reach.length) return { kind: 'move', v: reach.sort((a, b) => spots.get(a) - spots.get(b))[0], M };
      const goal = [...spots.keys()].map(i => G.verts[i]), d = vi => Math.min(...goal.map(g => Math.hypot(g.x - G.verts[vi].x, g.y - G.verts[vi].y))); const step = [...M.cost.keys()].filter(vi => vi !== L.army.v && !G.verts[vi].owner && !armyBlocks(G.verts[vi], L.id)).sort((a, b) => d(a) - d(b))[0]; if (step != null && d(step) < d(L.army.v)) return { kind: 'move', v: step, M }; }
    if (spots.has(L.army.v)) return { kind: 'rest' }; }
  // drift towards the nearest rival settlement when strong
  if (hostSize(L) >= (chOf(L) === 'warlord' ? 4 : [9, 7, 5][aggro()]) && (aggro() === 2 || chOf(L) === 'warlord' || rand() < (aggro() ? .5 : .2))) { const far = [...M.cost.keys()].filter(vi => !M.targets.includes(vi) && vi !== L.army.v && !G.verts[vi].owner); if (far.length) { const goal = G.verts.filter(v => v.owner && v.owner !== L.id); const sc = vi => Math.min(...goal.map(g => Math.hypot(g.x - G.verts[vi].x, g.y - G.verts[vi].y))); const vi = far.sort((a, b) => sc(a) - sc(b))[0]; if (sc(vi) < sc(L.army.v)) return { kind: 'move', v: vi, M }; } }
  return { kind: 'rest' }; }

/* ---------- the Geomancer: each village raises new land from the sea, and parches an old one ---------- */
const HEX_D = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const hexXY = (q, r) => { const w = G.world; return [w.CX + w.s * S3 * (q + r / 2), w.CY + w.s * 1.5 * r]; };
function geoSpot(v) { const w = G.world, have = new Set(G.map.map(m => m.q + ',' + m.r)); let best = null, bd = 1e9;
  for (const m of G.map) for (const [a, b] of HEX_D) { const q = m.q + a, r = m.r + b; if (have.has(q + ',' + r)) continue; const [cx, cy] = hexXY(q, r);
    if (cx < w.s * 1.35 || cx > w.W - w.s * 1.35 || cy < w.s * 1.35 || cy > w.H - w.s * 1.35) continue;
    const d = Math.hypot(cx - v.x, cy - v.y) - HEX_D.filter(([c, e]) => have.has((q + c) + ',' + (r + e))).length * 4; if (d < bd) { bd = d; best = [q, r]; } }
  return best; }
function geoStart(L, v, free) { const at = geoSpot(v); if (!at) return; const kinds = ['forest', 'pasture', 'field', 'hill', 'mountain'];
  for (let i = kinds.length - 1; i > 0; i--) { const j = rndInt(i + 1); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
  const pool = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12], byKey = {}; G.tiles.forEach(t => byKey[t.q + ',' + t.r] = t);
  const redNear = HEX_D.some(([a, b]) => { const t = byKey[(at[0] + a) + ',' + (at[1] + b)]; return t && (t.num === 6 || t.num === 8); });
  const opts = kinds.slice(0, 3).map(type => { let num = pool[rndInt(pool.length)]; if (redNear && (num === 6 || num === 8)) num = num === 6 ? 5 : 9; return { type, num }; });
  G.geo = { who: L.id, v: v.id, at, opts, free: !!free }; if (youAre(L.id)) logMsg('The sea stirs beside your new village. Choose the land that rises.', 'big'); }
const geoBurnable = L => [...new Set(settlements(L.id).flatMap(v => v.tiles))].filter(ti => G.tiles[ti].type !== 'desert');
function geoApply(L, pick, ti0) { const g = G.geo; if (!g || g.who !== L.id) return false; if (pick === -1) { G.geo = null; logMsg(`${pn(L.id)} ${vb(L.id, 'let', 'lets')} the sea lie.`); return true; }
  const o = g.opts[pick], can = g.free ? [] : geoBurnable(L); if (!o || (can.length && !can.includes(ti0))) return false;
  G.geo = null; let was = '', burnt = can.length ? ti0 : null; if (burnt != null) { was = tileName(burnt); G.map[burnt].type = 'desert'; G.map[burnt].num = 0; }
  G.map.push({ q: g.at[0], r: g.at[1], type: o.type, num: o.num }); rebuildIsle();
  const ti = G.tiles.length - 1; chron(`${lordName(L.id)} raised ${TNAME[o.type]} (${o.num}) from the sea.`);
  logMsg(`${pn(L.id)} ${vb(L.id, 'raise', 'raises')} ${tileName(ti)} from the sea${burnt != null ? `, and ${TNAME[G.tiles[burnt].type] === 'the waste' ? 'a land of theirs' : ''}${tileName(burnt)} withers to waste` : ''}.`, youAre(L.id) ? 'big' : ''); return true; }
// the computer: the best yield, and the settlement with the least to lose
function aiGeo(L) { const g = G.geo; let pick = 0, ps = -1; g.opts.forEach((o, i) => { const s = pips(o.num) + (settlements(L.id).some(v => v.tiles.some(t => G.tiles[t].type === o.type)) ? 0 : 1.5); if (s > ps) { ps = s; pick = i; } });
  const hurt = ti => G.tiles[ti].verts.reduce((a, vi) => { const v = G.verts[vi]; return a + (!v.owner ? 0 : v.owner === L.id ? -1.3 : 1) * v.level * pips(G.tiles[ti].num); }, 0);
  if (g.free) return [pick, -1]; const t = geoBurnable(L).sort((a, b) => hurt(b) - hurt(a))[0]; if (t != null && ps + hurt(t) < -1) return [-1, -1]; return [pick, t == null ? -1 : t]; }
function rebuildIsle() { const o = G.world, w = new World({ W: o.W, H: o.H, s: o.s, C: o.C, style: 'civ', map: G.map }); G.world = w; G.tiles = w.tiles;
  const at = {}; G.tiles.forEach(t => at[t.q + ',' + t.r] = t);
  G.tiles.forEach(t => { t.nb = HEX_D.map(([a, b]) => at[(t.q + a) + ',' + (t.r + b)]).filter(Boolean).map(x => x.i); t.verts = []; });
  const vk = {}, ek = {}; for (const v of G.verts) { v.tiles = []; vk[Math.round(v.x / 4) + ',' + Math.round(v.y / 4)] = v; } for (const e of G.edges) { e.tiles = []; ek[Math.min(e.a, e.b) + '-' + Math.max(e.a, e.b)] = e; }
  G.tiles.forEach(t => { const ids = [];
    for (let k = 0; k < 6; k++) { const x = t.cx + w.s * Math.cos((60 * k - 90) * Math.PI / 180), y = t.cy + w.s * Math.sin((60 * k - 90) * Math.PI / 180), key = Math.round(x / 4) + ',' + Math.round(y / 4);
      let v = vk[key]; if (!v) { v = vk[key] = { id: G.verts.length, x, y, tiles: [], adj: [], edges: [], owner: null, level: 0, wall: 0, home: null, name: null }; const [vx, vy] = w.vis(x, y); v.vx = vx; v.vy = vy; G.verts.push(v); }
      v.tiles.push(t.i); ids.push(v.id); t.verts.push(v.id); }
    for (let k = 0; k < 6; k++) { const a = ids[k], b = ids[(k + 1) % 6], key = Math.min(a, b) + '-' + Math.max(a, b);
      let e = ek[key]; if (!e) { e = ek[key] = { id: G.edges.length, a, b, tiles: [], owner: null, wo: null, whp: 0 }; G.edges.push(e); G.verts[a].adj.push(b); G.verts[b].adj.push(a); G.verts[a].edges.push(e.id); G.verts[b].edges.push(e.id); } e.tiles.push(t.i); } });
  if (G.ports) { const lost = G.ports.filter(p => p.v == null || G.verts[p.v].tiles.length > 2); if (lost.length) { G.ports = G.ports.filter(p => !lost.includes(p)); for (const p of lost) logMsg(`The new land closes the harbour of ${p.name}.`); } }
  for (const v of G.verts) w.reserve(v.vx, v.vy, 26); for (const t of G.tiles) if (t.num) w.reserve(t.cx, t.cy, 18); w.dress();
  if (typeof isleChanged === 'function') isleChanged(); }

// the Geomancer's town: one land anywhere on the isle may be turned to waste (ti -1 lets it be)
function parchApply(L, ti) { if (!G.parch || G.parch.who !== L.id) return false; G.parch = null; if (ti == null || ti < 0) { logMsg(`${pn(L.id)} ${vb(L.id, 'spare', 'spares')} the land.`); return true; }
  const t = G.tiles[ti]; if (!t || t.type === 'desert') return false; const was = tileName(ti); G.map[ti].type = 'desert'; G.map[ti].num = 0; rebuildIsle();
  chron(`${lordName(L.id)} turned ${was} to waste.`); logMsg(`${pn(L.id)} ${vb(L.id, 'turn', 'turns')} ${was} to waste.`, 'war'); return true; }
function aiParch(L) { const hurt = ti => G.tiles[ti].verts.reduce((a, vi) => { const v = G.verts[vi]; return a + (!v.owner ? 0 : v.owner === L.id ? -1.3 : vp(v.owner) >= vp(L.id) ? 1.3 : 1) * v.level * pips(G.tiles[ti].num); }, 0);
  const best = G.tiles.filter(t => t.type !== 'desert' && t.num).map(t => t.i).sort((a, b) => hurt(b) - hurt(a))[0]; return best != null && hurt(best) > 0 ? best : -1; }
