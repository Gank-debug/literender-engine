// The Hollow Brother: monastery prototype. One device, you plus seven bot brothers.
// Night is simulated; evidence comes from what really happened; bots search, share, lie and vote.
(function () {
'use strict';
const $ = id => document.getElementById(id);
const hs = KIT.hs;
let seed = (Date.now() % 100000) | 0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[(rnd() * a.length) | 0], shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const P = PLAN, RK = Object.keys(P.rooms), RN = k => P.rooms[k].name;
const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
const DAY_LEN = 150, SEARCH_T = 3, SPEED = 2.6;

// ---------------------------------------------------------------- the brothers
const NAMES = ['Aldo', 'Ivo', 'Bede', 'Osric', 'Tam', 'Wulf', 'Cuth', 'Eadric'];
const COLS = ['#b03430', '#3e8c58', '#cc9834', '#963c96', '#3e70b0', '#c4642c', '#aa5078', '#3c9696'];
const HABIT = { brown: [104, 72, 48], black: [50, 48, 56], grey: [104, 102, 108] };
const ROLES = {
  enemy: { name: 'Hollow Brother', team: 'evil', text: 'Each night you take a brother. Your traces are your undoing: leave as few as you can.' },
  scrub: { name: 'Scrubber', team: 'evil', text: 'You serve the Hollow Brother. Each night you scrub one of his traces away.' },
  infirm: { name: 'Infirmarer', team: 'good', night: 'protect', text: 'Each night, keep watch over a brother: he cannot be taken. You read the dead: how they died, and by whom.' },
  tracker: { name: 'Tracker', team: 'good', night: 'follow', text: 'Each night, follow one brother. At dawn you learn every room he passed through.' },
  archiv: { name: 'Archivist', team: 'good', text: 'You keep the night ledger. At dawn you learn how many brothers left their rooms, and one who did.' },
  confess: { name: 'Confessor', team: 'good', text: 'You hear what is not said. At dawn you learn three names: one of them serves the Hollow Brother.' },
  novice: { name: 'Novice', team: 'good', text: 'You have no gift but your eyes. Search, share, and vote well.' },
  cellar: { name: 'Cellarer', team: 'good', text: 'You keep the stores and know every face. No gift by night.' } };
const BLUFFS = ['Keeper of Keys', 'Bell-ringer', 'Gravedigger', 'Mason'];

const G = window.G = { day: 0, phase: 'load', clock: 0, extraKill: false, players: [], spots: [], bodies: [], prints: [], clues: [], chat: [], t: 0, timer: 0, you: 0, sel: null, hearing: null, over: null, log: [] };

function makeBrothers() {
  const n = 8, foot = shuffle(['sandal', 'sandal', 'sandal', 'sandal', 'boot', 'boot', 'boot', 'boot']), habit = shuffle(['brown', 'brown', 'brown', 'black', 'black', 'black', 'grey', 'grey']),
    tall = shuffle([1, 1, 1, 1, 0, 0, 0, 0]), item = shuffle(['candle', 'candle', 'candle', 'lantern', 'lantern', 'lantern', 'none', 'none']),
    roles = shuffle(['scrub', 'infirm', 'tracker', 'archiv', 'confess', 'novice', 'cellar']), hairs = [[56, 42, 32], [90, 60, 40], [150, 96, 50], [130, 130, 130], [40, 34, 30], [170, 150, 110]];
  // you are always good with a gift; the Enemy is a bot
  const youRole = pick(['infirm', 'tracker', 'archiv', 'confess']); roles.splice(roles.indexOf(youRole), 1);
  const order = [youRole, 'enemy', ...roles];
  G.players = NAMES.map((nm, i) => { const hood = i % 3 === 1, o = { robe: HABIT[habit[i]], col: COLS[i].match(/\w\w/g).map(h => parseInt(h, 16)), boot: foot[i] === 'boot' ? [44, 34, 28] : [150, 108, 76], ht: tall[i] ? 1.06 : .93, hood: hood ? 1 : 0, hair: pick(hairs), tons: !hood && rnd() < .5 ? 1 : 0, beard: !hood && rnd() < .35 ? pick(hairs) : 0, w: tall[i] ? 1 : 1.05 };
    if (item[i] !== 'none') o.prop = item[i];
    return { id: i, name: 'Brother ' + nm, short: nm, col: COLS[i], role: order[i], foot: foot[i], habit: habit[i], tall: tall[i], item: item[i], o, alive: true, ghostVote: true, x: 0, y: 0, path: [], face: 0, dist: 0, room: 'dorm', state: 'idle', st: 0, night: 'dorm', sus: new Array(n).fill(0), trust: new Array(n).fill(1), claimed: null, said: {}, plan: null, mark: '', searched: 0, ready: false, bluff: null, ask: false }; });
  // the Enemy's two shuffled into positions so "you" are always id 0 and others are random roles
  const others = shuffle(G.players.slice(1).map(p => p.role)); G.players.slice(1).forEach((p, i) => p.role = others[i]);
  G.players.forEach(p => { if (ROLES[p.role].team === 'evil') { const notIn = BLUFFS.slice(); p.bluff = rnd() < .5 ? pick(notIn) : pick(['Tracker', 'Archivist', 'Confessor']); } });
}
const team = p => ROLES[p.role].team, living = () => G.players.filter(p => p.alive), you = () => G.players[G.you];
const evilIds = () => G.players.filter(p => team(p) === 'evil').map(p => p.id);

// ---------------------------------------------------------------- the grid and paths
const CS = .5, GW = Math.ceil(32 / CS), GH = Math.ceil(28 / CS);
let BLOCK;
function buildGrid() { BLOCK = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = (i + .5) * CS, y = (j + .5) * CS; let b = x < P.bounds[0] || y < P.bounds[1] || x > P.bounds[2] || y > P.bounds[3];
    for (const [x0, y0, x1, y1, ...doors] of P.walls) { if (x0 === x1) { if (Math.abs(x - x0) < .45 && y >= y0 && y <= y1 && !doors.some(d => y > d[0] + .2 && y < d[1] - .2)) b = true; } else { if (Math.abs(y - y0) < .45 && x >= x0 && x <= x1 && !doors.some(d => x > d[0] + .2 && x < d[1] - .2)) b = true; } }
    for (const [fx, fy, fw, fd] of P.furn) if (x > fx - .3 && x < fx + fw + .3 && y > fy - .3 && y < fy + fd + .3) b = true;
    BLOCK[j * GW + i] = b ? 1 : 0; } }
const cell = (x, y) => [Math.max(0, Math.min(GW - 1, (x / CS) | 0)), Math.max(0, Math.min(GH - 1, (y / CS) | 0))], free = (i, j) => i >= 0 && j >= 0 && i < GW && j < GH && !BLOCK[j * GW + i];
function nearestFree(x, y) { let [i, j] = cell(x, y); if (free(i, j)) return [i, j]; for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (free(i + di, j + dj)) return [i + di, j + dj]; return [i, j]; }
function findPath(x0, y0, x1, y1) { const [si, sj] = nearestFree(x0, y0), [ti, tj] = nearestFree(x1, y1), N = GW * GH, g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), open = [[0, si, sj]], done = new Uint8Array(N); g[sj * GW + si] = 0;
  while (open.length) { let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k; const [, i, j] = open.splice(bi, 1)[0], id = j * GW + i; if (done[id]) continue; done[id] = 1; if (i === ti && j === tj) break;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (!free(ni, nj)) continue; if (di && dj && (!free(i + di, j) || !free(i, j + dj))) continue; const nid = nj * GW + ni, c = g[id] + (di && dj ? 1.414 : 1); if (c < g[nid]) { g[nid] = c; from[nid] = id; open.push([c + Math.hypot(ti - ni, tj - nj), ni, nj]); } } }
  const out = []; let id = tj * GW + ti; if (from[id] < 0 && id !== sj * GW + si) return [[x1, y1]]; while (id >= 0 && id !== sj * GW + si) { out.push([(id % GW + .5) * CS, ((id / GW) | 0) * CS + .25]); id = from[id]; } out.reverse();
  // smooth: drop points with clear line of sight
  const sm = []; let a = [x0, y0]; for (let k = 0; k < out.length; k++) { if (k + 1 < out.length && los(a, out[k + 1])) continue; sm.push(out[k]); a = out[k]; } if (free(...cell(x1, y1))) sm.push([x1, y1]); return sm; }
function los(a, b) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .2); for (let k = 1; k <= n; k++) { const t = k / n; if (!free(...cell(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))) return false; } return true; }
const roomAt = (x, y) => { for (const k of ['tower', 'chapel', 'script', 'refect', 'dorm']) { const r = P.rooms[k].r; if (x >= r[0] && x < r[2] && y >= r[1] && y < r[3]) return k; } return 'yard'; };
function pointIn(room, margin = .9) { const r = P.rooms[room].r; for (let k = 0; k < 60; k++) { const x = r[0] + margin + rnd() * (r[2] - r[0] - margin * 2), y = r[1] + margin + rnd() * (r[3] - r[1] - margin * 2); if (free(...cell(x, y)) && roomAt(x, y) === room) return [x, y]; } const [i, j] = nearestFree((r[0] + r[2]) / 2, (r[1] + r[3]) / 2); return [(i + .5) * CS, (j + .5) * CS]; }
const roomsOnPath = (pts) => { const out = []; for (const [x, y] of pts) { const r = roomAt(x, y); if (out[out.length - 1] !== r) out.push(r); } return out; };
function densify(pts, step = .4) { const out = [pts[0]]; for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let s = 1; s <= n; s++) out.push([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n]); } return out; }

// ---------------------------------------------------------------- clues
let CID = 0;
const TRAIT = { foot: (v) => G.players.filter(p => p.foot === v), habit: (v) => G.players.filter(p => p.habit === v), item: (v) => G.players.filter(p => p.item === v), tall: (v) => G.players.filter(p => p.tall === v) };
const ids = a => a.map(p => p.id);
function clue(kind, text, set, extra = {}) { return { id: ++CID, kind, text, set, day: G.day, ...extra }; }
const ICON = { print: 'print', thread: 'thread', wax: 'wax', soot: 'lantern', body: 'blood', info: 'eye', said: 'eye', alibi: 'key', none: 'none' };
const THING = { tower: 'bell rope', chapel: 'pew end', script: 'desk corner', refect: 'bench', dorm: 'cot frame', yard: 'well rope' };
function traceFor(p, kind, room, dead) {
  const not = q => !dead.includes(q.id);
  if (kind === 'print') { const s = TRAIT.foot(p.foot).filter(not); return clue('print', `${p.foot === 'boot' ? 'Boot' : 'Sandal'} prints in the snow, fresh since the bell, crossing the cloister.`, ids(s)); }
  if (kind === 'thread') { const s = TRAIT.habit(p.habit).filter(not); return clue('thread', `A thread of ${p.habit} wool snagged on the ${THING[room]} in the ${RN(room)}.`, ids(s)); }
  if (kind === 'wax') { const s = TRAIT.item('candle').filter(not); return clue('wax', `Fresh wax spilled on the ${RN(room)} floor. Someone came with a candle in the night.`, ids(s)); }
  if (kind === 'soot') { const s = TRAIT.item('lantern').filter(not); return clue('soot', `Lantern soot on the ${RN(room)} doorframe, still warm to the touch.`, ids(s)); }
}
const EMPTY = ['Nothing here but old straw.', 'Only dust, and a dead moth.', 'A mouse, nothing more.', 'Cold ash. Nothing of use.', 'Melted snow. Nothing else.'];

// ---------------------------------------------------------------- night
function simulateNight(choice) {
  G.phase = 'nightsim'; const dead = [], movers = [], log = { kills: [], protect: null, info: {} };
  const L = living(), E = G.players.find(p => p.role === 'enemy'), S = G.players.find(p => p.role === 'scrub');
  // where each brother spends the night
  for (const p of L) { if (p.id === G.you) p.night = choice.room; else if (team(p) === 'evil') p.night = rnd() < .6 ? 'dorm' : pick(['chapel', 'refect', 'script']); else p.night = rnd() < .6 ? 'dorm' : pick(['chapel', 'refect', 'script', 'tower']); [p.x, p.y] = pointIn(p.night); }
  // the clock
  G.clock = Math.min(8, G.clock + 1 + (G.noHang ? 1 : 0)); G.noHang = false;
  // night actions
  const prot = choice.protect != null ? choice.protect : null; let protects = [];
  for (const p of L) { if (p.role === 'infirm') protects.push(p.id === G.you ? prot : botPick(p, 'protect')); }
  const follows = {}; for (const p of L) if (p.role === 'tracker') follows[p.id] = p.id === G.you ? choice.follow : botPick(p, 'follow');
  // the Enemy chooses
  const nk = G.clock >= 8 ? 2 : (G.clock >= 6 && !G.extraKill ? (G.extraKill = true, 2) : 1);
  const targets = []; if (E && E.alive) for (let k = 0; k < nk; k++) { const t = enemyPick(E, targets); if (t) targets.push(t.id); }
  const paths = {};
  if (E && E.alive) { let cur = [E.x, E.y], full = [cur];
    for (const tid of targets) { const v = G.players[tid], pth = findPath(cur[0], cur[1], v.x, v.y); full = full.concat(pth); cur = [v.x, v.y];
      if (protects.includes(tid)) { log.protect = tid; continue; }
      v.alive = false; dead.push(tid); log.kills.push(tid); G.bodies.push({ id: tid, x: v.x, y: v.y, room: roomAt(v.x, v.y), face: (rnd() * 8) | 0, examined: {} }); }
    const back = findPath(cur[0], cur[1], E.x, E.y); full = full.concat(back); paths[E.id] = densify(full); if (targets.length) movers.push(E.id); }
  // innocent night walks: two brothers go to pray, eat or read
  for (const p of shuffle(L.filter(q => team(q) === 'good' && !dead.includes(q.id))).slice(0, 2)) { const to = pick(RK.filter(r => r !== 'yard' && r !== p.night)), [tx, ty] = pointIn(to), go = findPath(p.x, p.y, tx, ty), back = findPath(tx, ty, p.x, p.y); paths[p.id] = densify([[p.x, p.y], ...go, ...back]); movers.push(p.id); p.walkTo = to; }
  // the Scrubber walks too, sometimes
  // traces along each path
  G.spots = []; G.prints = [];
  const addSpot = (x, y, c, evil) => G.spots.push({ x, y, room: roomAt(x, y), clue: c, evil: !!evil, searched: false, by: null, taken: false });
  for (const [pid, pts] of Object.entries(paths)) { const p = G.players[pid], isE = p.role === 'enemy';
    const yard = pts.filter(([x, y]) => roomAt(x, y) === 'yard');
    if (yard.length) { yard.forEach(([x, y], k) => { if (k % 2 === 0) G.prints.push([x + (k % 4 ? .12 : -.12), y, p.foot]); }); if (!(isE && G.clock >= 4)) { const [x, y] = yard[(yard.length * (.3 + rnd() * .4)) | 0]; addSpot(x + .3, y + .2, traceFor(p, 'print', 'yard', dead), isE); } }
    const rooms = roomsOnPath(pts).filter(r => r !== 'yard' && r !== p.night);
    if (isE) { for (const tid of targets) { const b = G.bodies.find(b => b.id === tid) || G.players[tid]; addSpot(b.x + .9, b.y + .5, traceFor(p, 'thread', roomAt(b.x, b.y), dead), true); }
      if (p.item !== 'none' && rooms.length) { const r = pick(rooms), [x, y] = pointIn(r, .6); addSpot(x, y, traceFor(p, p.item === 'candle' ? 'wax' : 'soot', r, dead), true); } }
    else if (p.item !== 'none' && p.walkTo) { const [x, y] = pointIn(p.walkTo, .6); addSpot(x, y, traceFor(p, p.item === 'candle' ? 'wax' : 'soot', p.walkTo, dead), false); }
    p.walkTo = null; }
  // the Scrubber removes one of the Enemy's traces
  if (S && S.alive) { const ev = G.spots.filter(s => s.evil); if (ev.length && rnd() < .8) { const s = pick(ev); G.spots.splice(G.spots.indexOf(s), 1); } }
  // empty spots
  for (let k = 0; k < 7; k++) { const r = pick(RK), [x, y] = pointIn(r, .7); addSpot(x, y, null, false); }
  // dawn information for each gifted brother
  const info = {};
  for (const p of L.filter(q => q.alive)) {
    if (p.role === 'tracker' && follows[p.id] != null) { const t = G.players[follows[p.id]], pth = paths[t.id]; const rs = pth ? roomsOnPath(pth) : [t.night]; info[p.id] = clue('info', pth ? `You followed ${t.name}: ${rs.map(RN).join(' → ')}.` : `You followed ${t.name}: he never left the ${RN(t.night)}.`, pth && targets.some(tid => rs.includes(roomAt(G.players[tid].x, G.players[tid].y))) ? [t.id] : [], { src: 'role', about: t.id, rooms: rs }); }
    if (p.role === 'archiv') { const m = movers.filter(id => id !== p.id); info[p.id] = clue('info', m.length ? `The ledger: ${m.length} brother${m.length > 1 ? 's' : ''} left their rooms in the night. One was ${G.players[pick(m)].name}.` : 'The ledger: no brother left his room in the night.', [], { src: 'role' }); const nm = info[p.id].text.match(/One was (Brother \w+)/); if (nm) info[p.id].set = [G.players.find(q => q.name === nm[1]).id]; info[p.id].weak = true; }
    if (p.role === 'confess') { const ev = L.filter(q => team(q) === 'evil' && q.alive && q.id !== p.id), gd = shuffle(L.filter(q => team(q) === 'good' && q.alive && q.id !== p.id)); if (ev.length) { const three = shuffle([pick(ev), ...gd.slice(0, 2)]); info[p.id] = clue('info', `In confession, three names: ${three.map(q => q.short).join(', ')}. One of them serves the Hollow Brother.`, ids(three), { src: 'role' }); } }
  }
  G.nightInfo = info; G.nightLog = { ...log, targets, dead, movers };
  for (const id of dead) if (id === G.you) G.youDied = G.day + 1;
  dawn();
}
function botPick(p, what) { const L = living().filter(q => q.id !== p.id); if (what === 'protect') { const claimed = L.filter(q => q.claimed && team(q) === 'good'); return (claimed.length ? pick(claimed) : pick(L)).id; } const top = L.slice().sort((a, b) => p.sus[b.id] - p.sus[a.id]); return (rnd() < .7 ? top[0] : pick(L)).id; }
function enemyPick(E, already) { const L = living().filter(q => team(q) === 'good' && !already.includes(q.id)); if (!L.length) return null;
  // prefer brothers who claimed a gift, or who suspect the evil the most
  const w = L.map(q => { let s = 1; if (q.claimed && ['Tracker', 'Confessor', 'Archivist', 'Infirmarer'].includes(q.claimed)) s += 3; s += (q.sus[E.id] || 0) + (q.id === G.you ? (G.youShared || 0) * .4 : 0); return s; });
  let r = rnd() * w.reduce((a, b) => a + b, 0); for (let k = 0; k < L.length; k++) { r -= w[k]; if (r <= 0) return L[k]; } return L[0]; }

// ---------------------------------------------------------------- dawn and day
function dawn() {
  G.day++; G.phase = 'dawn'; const lg = G.nightLog;
  for (const p of G.players) { p.path = []; p.state = 'idle'; p.ready = false; p.plan = null; p.searchN = 0; p.ask = false; p.wait = 4 + rnd() * 10; }
  // bodies examined by role
  for (const b of G.bodies) if (b.clues == null) { const v = G.players[b.id], E = G.players.find(p => p.role === 'enemy'), rel = E.tall === v.tall ? 'his own height' : (E.tall ? 'taller' : 'shorter');
    b.clues = { all: clue('body', `${v.name}, dead in the ${RN(b.room)}. Struck from behind; no cry was heard.`, []), infirm: clue('body', `Reading ${v.short}'s body: struck from behind by someone ${rel === 'his own height' ? 'of his own height' : rel + ' than him'}.`, ids(G.players.filter(p => p.id !== b.id && (rel === 'his own height' ? p.tall === v.tall : rel === 'taller' ? p.tall && !v.tall : !p.tall && v.tall)))) }; }
  // your role info into your casebook
  const ni = G.nightInfo[G.you]; if (ni) addCase(ni);
  // bots: their role info becomes their knowledge, and maybe a claim
  for (const p of living()) if (p.id !== G.you) { const ni = G.nightInfo[p.id]; if (ni) learn(p, ni, 1.4); }
  G.timer = DAY_LEN; if (checkEnd()) return; showDawn(); }
function startDay() { G.phase = 'day'; hideModal(); renderTop(); toast('The bell for Prime. Search the house before dusk.');
  // dawn talk: claims and info
  const L = living().filter(p => p.id !== G.you); let delay = 1.5;
  for (const p of shuffle(L.slice())) { const ni = G.nightInfo[p.id];
    if (team(p) === 'good' && ni && (G.day > 1 || rnd() < .75)) { later(delay, () => { if (!p.alive) return; p.claimed = ROLES[p.role].name; const line = `I am the ${p.claimed}. ${ni.text.replace(/^You /, 'I ').replace(/^The ledger/, 'My ledger').replace(/^In confession/, 'In confession I heard')}`; say(p, line); broadcast(ni, p, 1, line); }); delay += 2.5 + rnd() * 2; }
    else if (team(p) === 'evil' && (G.day > 1 || rnd() < .6) && !p.claimed) { later(delay, () => { if (!p.alive) return; evilClaim(p); }); delay += 2.5 + rnd() * 2; } }
  later(delay + 1, () => { const sp = living().filter(p => p.id !== G.you && team(p) === 'good').sort((a, b) => maxSus(b) - maxSus(a))[0]; if (sp && maxSus(sp) > .9) { const t = topSus(sp); say(sp, pick([`I'd keep an eye on ${t.short}.`, `${t.short}, where were you last night?`, `Everything keeps pointing at ${t.short}.`])); } }); }
function evilClaim(p) { const goods = living().filter(q => team(q) === 'good' && q.id !== p.id); const avg = q => living().filter(b => team(b) === 'good' && b.id !== q.id).reduce((s, b) => s + b.sus[q.id], 0); const target = goods.sort((a, b) => avg(b) - avg(a))[rnd() < .6 ? 0 : 1] || goods[0]; if (!target) return;
  p.claimed = p.bluff; let line;
  if (p.bluff === 'Tracker') line = `I am the Tracker. I followed ${target.short} last night: Dormitory → Cloister → ${RN(G.bodies.length ? G.bodies[G.bodies.length - 1].room : 'chapel')}.`;
  else if (p.bluff === 'Archivist') line = `I am the Archivist. My ledger says ${target.short} left his room in the night.`;
  else if (p.bluff === 'Confessor') { const two = shuffle(goods.filter(q => q.id !== target.id)).slice(0, 2); line = `I am the Confessor. Three names: ${shuffle([target, ...two]).map(q => q.short).join(', ')}. One is evil.`; }
  else line = `I am the ${p.bluff}. ${pick([`I saw ${target.short} near the tower stair after Compline.`, `${target.short} was not in his cot when I made my round.`, `I'd look hard at ${target.short}.`])}`;
  say(p, line); broadcast(clue('said', line, [target.id], { src: 'said' }), p, .6, line); }

const later = (s, f) => G.timers.push([G.t + s, f]);
G.timers = [];
function say(p, text, cls) { G.chat.push({ who: p ? p.id : null, text, cls, t: G.t }); if (G.chat.length > 80) G.chat.shift(); renderChat(); }
function addCase(c) { if (G.clues.some(q => q.id === c.id)) return; G.clues.unshift(c); renderCase(); }
// bots learn from a clue: suspicion spread over the people it points to, weighed by trust in whoever shared it
function learn(b, c, w = 1) { if (!b.alive && b.id !== G.you) return; if (team(b) === 'evil' || !c.set) return; const s = c.set.filter(id => id !== b.id); if (!s.length) { if (c.rooms && c.about != null) b.sus[c.about] -= .4; return; } const kw = { print: 1.6, thread: 1.6, wax: 1.6, soot: 1.6, body: 1.8, said: .5, info: 1 }[c.kind] || 1; for (const id of s) b.sus[id] += w * kw / s.length * (c.kind === 'info' && s.length === 1 ? 1.8 : 1) * (c.weak ? .3 : 1); }
function broadcast(c, from, w = 1, line) { for (const b of G.players) if (b.id !== G.you && b.alive && (!from || b.id !== from.id)) learn(b, c, w * (from ? b.trust[from.id] : 1)); if (from) addCase({ ...c, id: ++CID, kind: c.kind === 'info' ? 'said' : c.kind, said: from.id, text: line || c.text, src: 'said' });
  // two brothers claiming the same gift: someone is lying
  if (from && from.claimed) for (const q of G.players) if (q !== from && q.claimed === from.claimed && q.alive) for (const b of G.players) if (b.id !== from.id && b.id !== q.id && team(b) === 'good') { b.sus[from.id] += .3; b.sus[q.id] += .3; } }
const maxSus = b => Math.max(...living().filter(q => q.id !== b.id).map(q => b.sus[q.id])), topSus = b => living().filter(q => q.id !== b.id).sort((x, y) => b.sus[y.id] - b.sus[x.id])[0];

// ---------------------------------------------------------------- bots by day
function botThink(p, dt) {
  if (!p.alive || p.id === G.you) return;
  if (p.state === 'search') { p.st -= dt; if (p.st <= 0) { p.state = 'idle'; finishSearch(p, p.plan.spot); p.plan = null; } return; }
  if (p.path.length) return;
  if (p.plan && p.plan.spot && !p.plan.spot.searched && Math.hypot(p.x - p.plan.spot.x, p.y - p.plan.spot.y) < 1.1) { p.state = 'search'; p.st = SEARCH_T + 2; p.plan.spot.busy = p.id; face(p, p.plan.spot.x - p.x, p.plan.spot.y - p.y); return; }
  if (p.wait > 0) { p.wait -= dt; return; }
  const body = G.bodies.find(b => !b.examined[p.id] && b.clues); if (body && rnd() < .35) { if (Math.hypot(p.x - body.x, p.y - body.y) < 1.6) { body.examined[p.id] = true; if (p.role === 'infirm') { const c = body.clues.infirm; learn(p, c, 1.3); later(1 + rnd() * 2, () => { if (!p.alive) return; if (!p.claimed) p.claimed = 'Infirmarer'; const line = `I am the Infirmarer. ${c.text.replace('Reading', 'I read')}`; say(p, line); broadcast(c, p, 1, line); }); } p.wait = 2; return; } p.path = findPath(p.x, p.y, body.x + .8, body.y + .4); return; }
  // choose: evil brothers go first to traces that betray them
  p.plan = null; let spots = G.spots.filter(s => !s.searched && !G.players.some(q => q !== p && q.plan && q.plan.spot === s));
  if (team(p) === 'evil') { const bad = spots.filter(s => s.clue && s.clue.set.some(id => team(G.players[id]) === 'evil') && s.evil); if (bad.length && rnd() < .85) spots = bad; }
  if (spots.length && rnd() < .55) { spots.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); const s = spots[rnd() < .7 ? 0 : Math.min(spots.length - 1, 1)]; p.plan = { spot: s }; p.path = findPath(p.x, p.y, s.x, s.y); }
  else { const r = pick(RK), [x, y] = pointIn(r); p.path = findPath(p.x, p.y, x, y); p.wait = 4 + rnd() * 8; }
}
function finishSearch(p, s) { s.busy = null; if (s.searched) return; s.searched = true; s.by = p.id; p.searchN++;
  if (p.id === G.you) { foundCard(s); return; }
  const c = s.clue; if (!c) return;
  if (team(p) === 'evil') { if (c.set.some(id => team(G.players[id]) === 'evil') && s.evil) { s.taken = true; return; } later(2 + rnd() * 3, () => { if (p.alive) { say(p, `Found something: ${c.text}`); broadcast(c, p, 1, `Found something: ${c.text}`); } }); return; }
  learn(p, c, 1.3); later(1.5 + rnd() * 3, () => { if (!p.alive) return; const line = `${pick(['Look here.', 'Brothers, listen.', 'I found this.'])} ${c.text}`; say(p, line); broadcast(c, p, 1, line); }); }
function face(p, dx, dy) { if (Math.abs(dx) + Math.abs(dy) < 1e-3) return; const a = Math.atan2(dy, dx); p.face = ((Math.round((a - Math.PI / 4) / (Math.PI / 4)) % 8) + 8) % 8; }
function step(p, dt) { if (!p.path.length) { if (p.state === 'walk') p.state = 'idle'; return; } const [tx, ty] = p.path[0], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), m = SPEED * (p.id === G.you ? 1 : .8) * dt; face(p, dx, dy); p.state = 'walk';
  if (d <= m) { p.x = tx; p.y = ty; p.path.shift(); p.dist += d; } else { p.x += dx / d * m; p.y += dy / d * m; p.dist += m; } p.room = roomAt(p.x, p.y); }

// ---------------------------------------------------------------- the hearing
function startHearing() { if (G.phase !== 'day') return; G.phase = 'dusk'; G.timers = []; for (const p of G.players) { p.path = []; p.state = 'idle'; }
  const L = living(), acc = [];
  const goods = L.filter(p => p.id !== G.you && team(p) === 'good').sort((a, b) => maxSus(b) - maxSus(a));
  for (const b of goods) { const t = topSus(b); if (t && b.sus[t.id] > 2 && !acc.some(a => a.target === t.id) && acc.length < 2) acc.push({ by: b.id, target: t.id }); }
  const ev = L.filter(p => p.id !== G.you && team(p) === 'evil'); if (ev.length && acc.length < 2) { const avg = q => goods.reduce((s, b) => s + b.sus[q.id], 0) / Math.max(1, goods.length), cand = L.filter(q => team(q) === 'good').sort((a, b) => avg(b) - avg(a))[0]; if (cand && avg(cand) > .9 && !acc.some(a => a.target === cand.id)) acc.push({ by: pick(ev).id, target: cand.id }); }
  G.hearing = { acc, cur: -1, votes: {}, yourAcc: null, result: null }; showHearing(); }
function botVote(b, target) { if (b.id === G.you) return null; if (!b.alive && !b.ghostVote) return false;
  if (team(b) === 'evil') return team(G.players[target]) === 'good' && (b.alive || rnd() < .5);
  const s = b.sus[target], mx = maxSus(b); const yes = s > 1.5 && s >= mx * .8; if (!b.alive) return yes && s > 1.6; return yes; }
function runVote(i) { const h = G.hearing, a = h.acc[i]; h.cur = i; a.votes = {}; for (const b of G.players) { if (b.id === G.you) continue; if (!b.alive && !b.ghostVote) continue; const v = botVote(b, a.target); if (v === null) continue; if (!b.alive) { if (!v) continue; b.ghostVote = false; } a.votes[b.id] = v; } showHearing(); }
function finishHearing() { const h = G.hearing, need = Math.ceil(living().length / 2); let best = null, tie = false;
  for (const a of h.acc) { const n = Object.values(a.votes || {}).filter(v => v).length; a.ayes = n; if (n >= need) { if (!best || n > best.ayes) { best = a; tie = false; } else if (n === best.ayes) tie = true; } }
  if (best && !tie) { const v = G.players[best.target]; v.alive = false; h.result = { hanged: v.id }; if (v.id === G.you) G.youDied = G.day; if (team(v) === 'evil') { G.clock = Math.max(0, G.clock - 1); } }
  else { h.result = { hanged: null, tie }; G.noHang = true; }
  showHearing(); checkEnd(); }
function checkEnd() { const L = living(), ev = L.filter(p => team(p) === 'evil').length, gd = L.length - ev, E = G.players.find(p => p.role === 'enemy');
  if (!E.alive) G.over = 'good'; else if (ev >= gd) G.over = 'evil'; if (G.over) { G.phase = 'over'; setTimeout(showEnd, 300); return true; } return false; }

// ---------------------------------------------------------------- the view
const VIEW = { scale: 3, cam: [0, 0], frames: [], fi: 0, W: 720, H: 520, dep: null, zone: null, lights: [], amb: null, snow: [] };
let cv, ctx, low, lctx, img;
function lightAt(x, y) { const [sx, sy] = isoP(x, y, 20), out = !VIEW.zone[(Math.round(sy) | 0) * VIEW.W + (Math.round(sx) | 0)], a = out ? VIEW.amb.out : VIEW.amb.in, f = a.slice();
  for (const l of VIEW.lights) { const d = Math.hypot(sx - l[0], (sy - l[1]) * 1.7) / l[2]; if (d < 1) { const q = l[3] * (1 - d) * (1 - d); f[0] += q * l[6][0]; f[1] += q * l[6][1]; f[2] += q * l[6][2]; } }
  return f.map(v => Math.min(1.35, v)); }
const isoP = (x, y, z = 0) => [350 + (x - y) * 10, 170 + (x + y) * 5 - z];
function blit(data, s, x, y, depth, lt, alpha = 1) { const D = data.data, W = VIEW.W, [bx, by] = [Math.round(isoP(x, y)[0]) + s.ox, Math.round(isoP(x, y)[1]) + s.oy];
  for (let j = 0; j < s.h; j++) { const Y = by + j; if (Y < 0 || Y >= VIEW.H) continue; for (let i = 0; i < s.w; i++) { const q = (j * s.w + i) * 4; if (!s.data[q + 3]) continue; const X = bx + i; if (X < 0 || X >= W) continue; const k = Y * W + X; if (VIEW.dep[k] > depth) continue; const o = k * 4;
    if (alpha < 1) { D[o] += (s.data[q] * lt[0] - D[o]) * alpha; D[o + 1] += (s.data[q + 1] * lt[1] - D[o + 1]) * alpha; D[o + 2] += (s.data[q + 2] * lt[2] - D[o + 2]) * alpha; } else { D[o] = s.data[q] * lt[0]; D[o + 1] = s.data[q + 1] * lt[1]; D[o + 2] = s.data[q + 2] * lt[2]; } } } }
function frame() {
  const W = VIEW.W, bg = VIEW.frames[VIEW.fi]; img.data.set(bg);
  const D = img.data, put = (x, y, c, a = 1) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= VIEW.H) return; const o = (y * W + x) * 4; D[o] += (c[0] - D[o]) * a; D[o + 1] += (c[1] - D[o + 1]) * a; D[o + 2] += (c[2] - D[o + 2]) * a; };
  // prints in the snow
  for (const [x, y, f] of G.prints) { const [sx, sy] = isoP(x, y); put(sx, sy, [70, 84, 120], .7); put(sx + 1, sy, [80, 96, 132], .5); if (f === 'boot') put(sx, sy + 1, [70, 84, 120], .5); }
  // search glints
  const tt = G.t;
  if (G.phase === 'day' || G.phase === 'dawn') for (const s of G.spots) { if (s.searched) continue; const [sx, sy] = isoP(s.x, s.y, 2), k = Math.sin(tt * 3 + s.x) * .5 + .5, c = [255, 236, 160]; put(sx, sy, c, .9); for (let r = 1; r <= 2 + Math.round(k); r++) { put(sx + r, sy, c, .7 - r * .15); put(sx - r, sy, c, .7 - r * .15); put(sx, sy + r, c, .7 - r * .15); put(sx, sy - r, c, .7 - r * .15); } }
  // ring under you
  const me = you(); if (me.alive) { const [sx, sy] = isoP(me.x, me.y); for (let a = 0; a < 6.28; a += .08) put(sx + Math.cos(a) * 9, sy + Math.sin(a) * 4.5, [224, 184, 90], .8); }
  if (G.sel != null && G.players[G.sel].alive) { const p = G.players[G.sel], [sx, sy] = isoP(p.x, p.y); for (let a = 0; a < 6.28; a += .1) put(sx + Math.cos(a) * 9, sy + Math.sin(a) * 4.5, [200, 200, 220], .6); }
  // bodies and brothers, back to front
  const list = [];
  for (const b of G.bodies) list.push({ d: b.x + b.y, f: () => { const p = G.players[b.id]; blit(img, KIT.person(p.o, b.face, 'die', 3), b.x, b.y, b.x + b.y + .9, lightAt(b.x, b.y)); } });
  for (const p of G.players) { if (!p.alive && p.id !== G.you) continue; if (!p.alive && G.phase === 'over') continue; const ghost = !p.alive;
    list.push({ d: p.x + p.y, f: () => { const pose = p.state === 'walk' ? 'walk' : p.state === 'search' ? 'work' : 'idle', fr = pose === 'walk' ? Math.floor(p.dist * 2.2) % 4 : pose === 'work' ? Math.floor(tt * 3) % 2 : Math.floor(tt / 1.6 + p.id) % 2; blit(img, KIT.person(p.o, p.face, pose, fr), p.x, p.y, p.x + p.y + .6, ghost ? [.7, .8, 1.1] : lightAt(p.x, p.y), ghost ? .4 : 1); } }); }
  list.sort((a, b) => a.d - b.d).forEach(o => o.f());
  lctx.putImageData(img, 0, 0);
  // camera on you
  const sc = VIEW.scale, vw = cv.width / sc, vh = cv.height / sc, [mx, my] = isoP(me.x, me.y, 26); VIEW.cam[0] += ((mx - vw / 2) - VIEW.cam[0]) * .12; VIEW.cam[1] += ((my - vh / 2) - VIEW.cam[1]) * .12;
  VIEW.cam[0] = Math.max(0, Math.min(VIEW.W - vw, VIEW.cam[0])); VIEW.cam[1] = Math.max(0, Math.min(VIEW.H - vh, VIEW.cam[1]));
  const cx = Math.round(VIEW.cam[0] * sc) / sc, cy = Math.round(VIEW.cam[1] * sc) / sc;
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(low, cx, cy, vw, vh, 0, 0, vw * sc, vh * sc);
  // falling snow, outdoors only
  for (const f of VIEW.snow) { f.y += f.v * .016 * 22; f.x += Math.sin(tt * .8 + f.p) * .1; if (f.y > VIEW.H) { f.y = -4; f.x = Math.random() * VIEW.W; } const X = f.x | 0, Y = f.y | 0; if (X < 0 || X >= VIEW.W || Y < 0 || Y >= VIEW.H || VIEW.zone[Y * VIEW.W + X]) continue; const sx = (f.x - cx) * sc, sy = (f.y - cy) * sc; if (sx < 0 || sy < 0 || sx > cv.width || sy > cv.height) continue; ctx.fillStyle = `rgba(220,228,246,${f.a})`; ctx.fillRect(Math.round(sx / sc) * sc, Math.round(sy / sc) * sc, sc, sc); }
  // names over brothers near you or selected
  ctx.font = `${Math.max(12, sc * 5)}px "Pixelify Sans"`; ctx.textAlign = 'center';
  for (const p of G.players) { if (!p.alive) continue; const near = Math.hypot(p.x - me.x, p.y - me.y) < 6 || p.id === G.sel; if (!near || p.id === G.you) continue; const [sx, sy] = isoP(p.x, p.y, 60); const X = (sx - cx) * sc, Y = (sy - cy) * sc; ctx.fillStyle = 'rgba(10,8,8,.7)'; const w = ctx.measureText(p.short).width + 10; ctx.fillRect(X - w / 2, Y - sc * 4, w, sc * 6); ctx.fillStyle = p.col; ctx.fillRect(X - w / 2, Y + sc * 2 - 2, w, 2); ctx.fillStyle = '#ece2c8'; ctx.fillText(p.short, X, Y + sc); if (p.state === 'search') { ctx.fillStyle = '#e0b85a'; ctx.fillText('searching…', X, Y - sc * 6); } }
  // room names, faint
  ctx.font = `${Math.max(14, sc * 6)}px "Jacquard 24"`;
  for (const k of RK) { const r = P.rooms[k].r, [sx, sy] = isoP((r[0] + r[2]) / 2, (r[1] + r[3]) / 2); const X = (sx - cx) * sc, Y = (sy - cy) * sc; if (X < -100 || Y < -40 || X > cv.width + 100 || Y > cv.height + 40) continue; ctx.fillStyle = 'rgba(236,226,200,.22)'; ctx.fillText(P.rooms[k].name, X, Y); }
  VIEW.cx = cx; VIEW.cy = cy;
}

// ---------------------------------------------------------------- input
function screenToWorld(px, py) { const X = VIEW.cx + px / VIEW.scale, Y = VIEW.cy + py / VIEW.scale, dx = X - 350, dy = Y - 170; return [(dx / 10 + dy / 5) / 2, (dy / 5 - dx / 10) / 2]; }
function pickBrother(px, py) { const X = VIEW.cx + px / VIEW.scale, Y = VIEW.cy + py / VIEW.scale; let best = null; for (const p of G.players) { if (!p.alive || p.id === G.you) continue; const [sx, sy] = isoP(p.x, p.y); if (Math.abs(X - sx) < 7 && Y < sy + 2 && Y > sy - 56) { if (!best || p.x + p.y > best.x + best.y) best = p; } } return best; }
function onClick(e) { if (G.phase !== 'day') return; const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; const b = pickBrother(px, py); if (b) { selectBrother(b.id); return; }
  const me = you(); if (me.state === 'search') return; const [x, y] = screenToWorld(px, py); me.path = findPath(me.x, me.y, x, y); }
function keyMove(dt) { const me = you(); if (G.phase !== 'day' || me.state === 'search') return; let dx = 0, dy = 0; if (KEYS.w || KEYS.arrowup) { dx -= 1; dy -= 1; } if (KEYS.s || KEYS.arrowdown) { dx += 1; dy += 1; } if (KEYS.a || KEYS.arrowleft) { dx -= 1; dy += 1; } if (KEYS.d || KEYS.arrowright) { dx += 1; dy -= 1; } if (!dx && !dy) return; me.path = []; const n = Math.hypot(dx, dy), m = SPEED * dt, nx = me.x + dx / n * m, ny = me.y + dy / n * m; face(me, dx, dy); me.state = 'walk'; me.walkKey = true; if (free(...cell(nx, ny))) { me.x = nx; me.y = ny; me.dist += m; } else if (free(...cell(nx, me.y))) { me.x = nx; me.dist += m; } else if (free(...cell(me.x, ny))) { me.y = ny; me.dist += m; } me.room = roomAt(me.x, me.y); }
const KEYS = {};

// ---------------------------------------------------------------- your actions
const nearSpot = () => { const me = you(); return G.spots.filter(s => !s.searched && !s.busy).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y)).find(s => Math.hypot(s.x - me.x, s.y - me.y) < 1.3); };
const nearBody = () => { const me = you(); return G.bodies.find(b => Math.hypot(b.x - me.x, b.y - me.y) < 1.6 && !b.examined[G.you]); };
function doSearch() { const me = you(), s = nearSpot(); if (!s || !me.alive) return; me.path = []; me.state = 'search'; me.st = SEARCH_T; me.spot = s; s.busy = me.id; face(me, s.x - me.x, s.y - me.y); }
function doExamine() { const b = nearBody(); if (!b || !you().alive) return; b.examined[G.you] = true; addCase(b.clues.all); if (you().role === 'infirm') addCase(b.clues.infirm); flash(`You kneel by ${G.players[b.id].short}.`); renderActs(); }
function foundCard(s) { const c = s.clue; if (!c) { flash(pick(EMPTY)); return; } addCase({ ...c, found: true }); modal(`<div class="hd"><span class="cap">F</span>ound</div><p class="big">${c.text}</p><div class="to">points to ${chips(c.set)}</div><p class="sub">Only you know this. Share it, keep it, or say nothing.</p><div class="row"><span class="btn go" data-share="${c.id}">Share with the table</span><span class="btn" data-close>Keep it</span></div>`, 'found'); }
function shareClue(id) { const c = G.clues.find(q => q.id === id); if (!c || c.shared) return; c.shared = true; G.youShared = (G.youShared || 0) + 1; say(you(), c.kind === 'info' ? `I am the ${ROLES[you().role].name}. ${c.text.replace(/^You /, 'I ')}` : c.text); if (c.kind === 'info') you().claimed = ROLES[you().role].name; broadcast(c, you()); renderCase(); }
function askAlibi(id) { const p = G.players[id]; if (p.asked === G.day) return; p.asked = G.day; say(you(), `${p.short}, where did you sleep last night?`);
  later(1.2, () => { let r = p.night; if (team(p) === 'evil') r = 'dorm'; say(p, r === 'dorm' ? pick(['In my cot, like a Christian.', 'Dormitory. Ask anyone.', 'In the dormitory. Where else?']) : pick([`I kept vigil in the ${RN(r)}.`, `In the ${RN(r)}. I could not sleep.`])); addCase(clue('alibi', `${p.short} says he spent the night in the ${RN(r)}.`, [], { src: 'said', said: p.id })); }); }

// ---------------------------------------------------------------- UI
const icon = (k, s = 2) => k === 'none' ? '' : `<canvas class="ic" data-i="${k}" data-s="${s}"></canvas>`;
const chips = set => set && set.length ? set.map(id => `<i class="chip" style="background:${G.players[id].col}" title="${G.players[id].short}"></i>`).join('') : '<span class="sub">no one in particular</span>';
function drawIcons(root) { root.querySelectorAll('canvas.ic:not([data-done])').forEach(c => { ic(c); c.dataset.done = 1; }); }
function renderBrothers() { const h = G.players.map(p => { const me = p.id === G.you; const tr = `${icon(p.foot === 'boot' ? 'boot' : 'sandal')}${icon(p.item)}`; const sub = me ? `you · ${ROLES[p.role].name}` : p.alive ? `${p.habit} habit · ${p.tall ? 'tall' : 'short'}` : (G.bodies.some(b => b.id === p.id) ? `found in the ${RN(G.bodies.find(b => b.id === p.id).room)}` : 'hanged');
  return `<div class="s ${me ? 'you' : ''} ${p.alive ? '' : 'dead'} ${G.sel === p.id ? 'sel' : ''}" data-b="${p.id}"><i class="sw" style="background:${p.col}"></i><b>${p.short}<small>${sub}</small></b><span class="tr"><i class="hab" style="background:rgb(${HABIT[p.habit]})" title="${p.habit} habit"></i>${tr}</span><span class="mk">${p.alive ? p.mark : '✝'}</span></div>`; }).join('');
  $('bro').innerHTML = `<div class="hd">The Brethren</div>${h}`; drawIcons($('bro')); }
function selectBrother(id) { G.sel = id; renderBrothers(); const p = G.players[id]; const pop = $('pop'); pop.innerHTML = `<div class="hd" style="font-size:24px">${p.name}</div><p class="sub">${p.habit} habit · ${p.tall ? 'tall' : 'short'} · ${p.foot === 'boot' ? 'boots' : 'sandals'} · ${p.item === 'none' ? 'carries nothing' : 'carries a ' + p.item}${p.claimed ? ` · claims to be the ${p.claimed}` : ''}</p>
  <div class="row">${p.alive && id !== G.you && G.phase === 'day' ? `<span class="btn" data-ask="${id}">Where did you sleep?</span>` : ''}<span class="btn" data-mark="${id}" data-m="✓">✓ trust</span><span class="btn" data-mark="${id}" data-m="?">? doubt</span><span class="btn" data-mark="${id}" data-m="✗">✗ accuse</span><span class="btn" data-mark="${id}" data-m="">clear</span></div>`; pop.style.display = 'block'; }
function renderCase() { const h = G.clues.map(c => `<div class="clue ${c.src === 'said' ? 'said' : ''} ${c.found && !c.shared ? 'new' : ''}">${icon(ICON[c.kind] || 'eye')}<div><p>${c.said != null ? `<b style="color:${G.players[c.said].col}">${G.players[c.said].short}:</b> ` : ''}${c.text}</p>${c.set && c.set.length ? `<div class="to">points to ${chips(c.set)}</div>` : ''}${(c.found || c.kind === 'info' || (c.kind === 'body' && c.set.length)) && !c.shared && c.said == null ? `<span class="mini" data-share="${c.id}">share</span>` : c.shared ? '<span class="sub">shared</span>' : ''}</div></div>`).join('');
  $('case').innerHTML = `<div class="hd"><span class="cap">C</span>asebook</div><div class="scroll">${h || '<p class="sub">Nothing yet. Search the glinting places.</p>'}</div>`; drawIcons($('case')); }
function renderChat() { const h = G.chat.slice(-40).map(m => m.who == null ? `<p class="sys">${m.text}</p>` : `<p><b style="color:${G.players[m.who].col}">${G.players[m.who].short}:</b> ${m.text}</p>`).join(''); const el = $('chatlog'); el.innerHTML = h; el.scrollTop = 1e9; }
function renderRole() { const me = you(), R = ROLES[me.role]; $('role').innerHTML = `<div class="k">${me.alive ? 'FAITHFUL' : 'FAITHFUL · DEAD'}</div><span class="drop">${R.name[0]}</span><div class="t">${R.name.slice(1)}</div><p>${R.text}</p>${me.claimed ? '<p class="sub">You have claimed your gift openly.</p>' : ''}`; }
function renderClock() { $('clockv').dataset.v = G.clock; clockCandle($('clockv'), G.clock, 8); const n = G.clock; $('clocknote').innerHTML = n >= 8 ? 'The candle has guttered. <b>He takes two every night.</b>' : n >= 6 ? `Notch ${n} of 8. ${G.extraKill ? 'He has had his second kill.' : '<b>Tonight he may take two.</b>'} At 8, two every night.` : n >= 4 ? `Notch ${n} of 8. <b>He leaves no prints in the snow.</b> At 6, a second kill.` : `Notch ${n} of 8. A notch each night, two if no one hangs; one back when evil hangs. At 4 he stops leaving prints.`; }
function renderTop() { const ph = { dawn: 0, day: 1, dusk: 2, night: 3, nightsim: 3, over: 3 }[G.phase] || 0; $('day').textContent = G.day ? `Day the ${ORD[G.day - 1]}` : 'The First Night'; document.querySelectorAll('#phases span').forEach((s, i) => s.classList.toggle('on', i === ph)); }
function renderActs() { const me = you(); let h = '';
  if (G.phase === 'day') { const s = nearSpot(), b = nearBody();
    if (me.alive) { h += me.state === 'search' ? `<span class="btn go">Searching…<small><i class="bar"><i style="width:${(1 - me.st / SEARCH_T) * 100}%"></i></i></small></span>` : `<span class="btn ${s ? 'go' : 'off'}" data-act="search">Search<small>${s ? 'here · E' : 'find a glint'}</small></span>`; h += `<span class="btn ${b ? 'go' : 'off'}" data-act="examine">Examine<small>${b ? G.players[b.id].short : 'a body'}</small></span>`; }
    else h += '<span class="btn off">You are dead<small>talk, and keep your one vote</small></span>';
    h += `<span class="btn" data-act="dusk">Ring for dusk<small>end the day</small></span>`; }
  if ($('acts')._h !== h) { $('acts').innerHTML = h; $('acts')._h = h; } }
function flash(t) { const f = $('flash'); f.textContent = t; f.style.opacity = 1; clearTimeout(f._t); f._t = setTimeout(() => f.style.opacity = 0, 2600); }
const toast = flash;
function modal(html, cls = '') { const m = $('modal'); m.className = 'v p ' + cls; m.innerHTML = html; m.style.display = 'block'; $('veil').style.display = cls === 'found' ? 'none' : 'block'; drawIcons(m); }
function hideModal() { $('modal').style.display = 'none'; $('veil').style.display = 'none'; }
function showDawn() { renderAll(); const lg = G.nightLog, me = you(); let h = `<div class="hd" style="font-size:40px"><span class="cap">D</span>awn of the ${ORD[G.day - 1]} Day</div>`;
  if (lg.dead.length) h += lg.dead.map(id => `<p class="big"><i class="chip" style="background:${G.players[id].col}"></i> <b>${G.players[id].name}</b> lies dead in the ${RN(G.bodies.find(b => b.id === id).room)}.</p>`).join('');
  else h += `<p class="big">No one was taken in the night.${lg.protect != null ? ' Someone was watched over.' : ''}</p>`;
  if (G.youDied === G.day) h += '<p class="big" style="color:#e05a4a">It was you. You walk the halls now as a ghost: you may still talk, and you keep one vote.</p>';
  const ni = G.nightInfo[G.you]; if (ni && me.alive) h += `<div class="clue">${icon('eye')}<div><p>${ni.text}</p>${ni.set.length ? `<div class="to">points to ${chips(ni.set)}</div>` : ''}</div></div>`;
  h += `<p class="sub" style="margin-top:8px">The candle burns to notch ${G.clock} of 8. Fresh snow has covered all but last night's prints.</p><div class="row"><span class="btn go" data-go="day">Begin the day</span></div>`; modal(h, 'dawn'); }
function showHearing() { renderAll(); const h = G.hearing, need = Math.ceil(living().length / 2), me = you(); let s = `<div class="hd" style="font-size:38px"><span class="cap">T</span>he Hearing</div><p class="sub">Dusk of the ${ORD[G.day - 1]} day. A brother hangs if ${need} vote aye (half the ${living().length} living). The dead may spend their one vote.</p>`;
  if (h.result) { const r = h.result; s += r.hanged != null ? `<p class="big"><i class="chip" style="background:${G.players[r.hanged].col}"></i> <b>${G.players[r.hanged].name}</b> is hanged at the gate.${team(G.players[r.hanged]) === 'evil' ? ' <span style="color:#d8b060">The candle steadies: it burns back a notch.</span>' : ''}</p>` : `<p class="big">${r.tie ? 'The votes are tied.' : 'No one has enough votes.'} No one hangs; the candle will burn twice tonight.</p>`; if (!G.over) s += `<div class="row"><span class="btn go" data-go="night">Night falls</span></div>`; modal(s, 'hear'); return; }
  s += h.acc.map((a, i) => { const n = a.votes ? Object.values(a.votes).filter(v => v).length : 0; const t = G.players[a.target];
    return `<div class="acc ${h.cur === i ? 'cur' : ''}"><p><span class="sub">${a.by === G.you ? 'You accuse' : G.players[a.by].short + ' accuses'}</span> <i class="chip" style="background:${t.col}"></i> <b class="nm">${t.name}</b></p>${a.votes ? `<div class="tally">${Object.entries(a.votes).filter(([k]) => k !== 'you').map(([k, v]) => `<span class="${v ? 'y' : 'n'}">${G.players[k].short}${G.players[k].alive ? '' : ' (dead)'} · ${v ? 'aye' : 'nay'}</span>`).join('')}${a.votes.you != null ? `<span class="${a.votes.you ? 'y' : 'n'}">you · ${a.votes.you ? 'aye' : 'nay'}</span>` : ''}</div><p class="sub">${n} aye of ${need} needed</p>` : ''}${h.cur === i && a.votes.you == null && (me.alive || me.ghostVote) ? `<div class="row"><span class="btn go" data-vote="1">Aye, hang him</span><span class="btn" data-vote="0">Nay</span></div>` : ''}</div>`; }).join('');
  if (h.cur === -1) { s += h.acc.length ? '' : '<p class="big">No one has been accused yet.</p>'; if (h.yourAcc == null && me.alive) s += `<p class="sub" style="margin-top:8px">Accuse a brother yourself:</p><div class="row wrap">${living().filter(p => p.id !== G.you && !h.acc.some(a => a.target === p.id)).map(p => `<span class="btn small" data-accuse="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div>`;
    s += `<div class="row"><span class="btn go" data-go="vote">${h.acc.length ? 'Begin the vote' : 'Let the day end'}</span></div>`; }
  else if (h.acc[h.cur].votes.you != null || !(me.alive || me.ghostVote)) s += `<div class="row"><span class="btn go" data-go="next">${h.cur + 1 < h.acc.length ? 'Next accusation' : 'Count the votes'}</span></div>`;
  modal(s, 'hear'); }
function showNight() { G.phase = 'night'; renderAll(); const me = you(), R = ROLES[me.role]; G.nightChoice = { room: me.alive ? 'dorm' : 'dorm', protect: null, follow: null };
  const draw = () => { const c = G.nightChoice; let s = `<div class="hd" style="font-size:38px"><span class="cap">C</span>ompline</div><p class="sub">The doors are barred. Where will you spend the night? Others will see the ledger, or follow you.</p>`;
    if (me.alive) { s += `<div class="row wrap">${['dorm', 'chapel', 'refect', 'script', 'tower'].map(r => `<span class="btn small ${c.room === r ? 'go' : ''}" data-room="${r}">${RN(r)}</span>`).join('')}</div>`;
      if (R.night === 'protect') s += `<p class="sub" style="margin-top:10px">Keep watch over:</p><div class="row wrap">${living().filter(p => p.id !== G.you).map(p => `<span class="btn small ${c.protect === p.id ? 'go' : ''}" data-protect="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div>`;
      if (R.night === 'follow') s += `<p class="sub" style="margin-top:10px">Follow:</p><div class="row wrap">${living().filter(p => p.id !== G.you).map(p => `<span class="btn small ${c.follow === p.id ? 'go' : ''}" data-follow="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div>`; }
    else s += '<p class="big">You are dead. You watch the house from the rafters.</p>';
    const ok = !me.alive || (!R.night || (R.night === 'protect' ? c.protect != null : c.follow != null));
    s += `<div class="row"><span class="btn ${ok ? 'go' : 'off'}" data-go="${ok ? 'sleep' : ''}">Snuff the candle</span></div>`; modal(s, 'night'); };
  G.drawNight = draw; draw(); }
function showEnd() { renderAll(); const good = G.over === 'good'; let s = `<div class="hd" style="font-size:44px"><span class="cap">${good ? 'T' : 'T'}</span>${good ? 'he Hollow Brother hangs' : 'he house is his'}</div><p class="big">${good ? 'The thaw comes to a quiet house.' : 'By the thaw, there is no one left to ring the bell.'}</p><div class="roles">${G.players.map(p => `<div class="s ${p.alive ? '' : 'dead'}"><i class="sw" style="background:${p.col}"></i><b>${p.name}<small>${ROLES[p.role].name}${p.id === G.you ? ' · you' : ''}</small></b><span class="${team(p) === 'evil' ? 'ev' : 'gd'}">${team(p) === 'evil' ? 'evil' : 'faithful'}</span></div>`).join('')}</div><div class="row"><span class="btn go" data-go="again">Another night</span></div>`; modal(s, 'end'); }
function renderAll() { renderTop(); renderBrothers(); renderCase(); renderChat(); renderRole(); renderClock(); renderActs(); }

document.addEventListener('click', e => { const t = e.target.closest('[data-share],[data-close],[data-go],[data-act],[data-b],[data-ask],[data-mark],[data-vote],[data-accuse],[data-room],[data-protect],[data-follow]'); if (!t) { if (!e.target.closest('#pop')) $('pop').style.display = 'none'; return; } const d = t.dataset;
  if (d.share) { shareClue(+d.share); if ($('modal').classList.contains('found')) hideModal(); }
  if (d.close != null) hideModal();
  if (d.act === 'search') doSearch(); if (d.act === 'examine') doExamine(); if (d.act === 'dusk') startHearing();
  if (d.b) selectBrother(+d.b);
  if (d.ask) { askAlibi(+d.ask); $('pop').style.display = 'none'; }
  if (d.mark) { G.players[+d.mark].mark = d.m; renderBrothers(); $('pop').style.display = 'none'; }
  if (d.accuse) { G.hearing.acc.push({ by: G.you, target: +d.accuse }); G.hearing.yourAcc = +d.accuse; showHearing(); }
  if (d.vote != null) { const a = G.hearing.acc[G.hearing.cur]; a.votes.you = d.vote === '1'; if (!you().alive && a.votes.you) you().ghostVote = false; showHearing(); }
  if (d.room) { G.nightChoice.room = d.room; G.drawNight(); } if (d.protect) { G.nightChoice.protect = +d.protect; G.drawNight(); } if (d.follow) { G.nightChoice.follow = +d.follow; G.drawNight(); }
  if (d.go === 'day') startDay();
  if (d.go === 'vote') { if (G.hearing.acc.length) runVote(0); else finishHearing(); }
  if (d.go === 'next') { if (G.hearing.cur + 1 < G.hearing.acc.length) runVote(G.hearing.cur + 1); else finishHearing(); }
  if (d.go === 'night') showNight();
  if (d.go === 'sleep') { hideModal(); simulateNight(G.nightChoice); }
  if (d.go === 'again') location.reload(); });
addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (document.activeElement && document.activeElement.tagName === 'INPUT') { if (k === 'enter') { const v = e.target.value.trim(); if (v) say(you(), v.replace(/</g, '&lt;')); e.target.value = ''; } return; } KEYS[k] = true; if (k === 'e' || k === ' ') { doSearch(); doExamine(); e.preventDefault(); } });
addEventListener('keyup', e => { KEYS[e.key.toLowerCase()] = false; if (you().walkKey) { you().walkKey = false; you().state = 'idle'; } });

// ---------------------------------------------------------------- the loop
let last = 0;
function loop(ts) { const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; if (!G.headless) update(dt); VIEW.fi = Math.floor(G.t * 6) % VIEW.frames.length; if (!G.headless) frame(); requestAnimationFrame(loop); }
function update(dt) { G.t += dt;
  if (G.phase === 'day') { G.timer -= dt; if (G.timer <= 0) { G.timer = 0; startHearing(); }
    for (let k = G.timers.length - 1; k >= 0; k--) if (G.timers[k][0] <= G.t) { const f = G.timers[k][1]; G.timers.splice(k, 1); f(); }
    const me = you(); keyMove(dt);
    if (me.state === 'search') { me.st -= dt; if (me.st <= 0) { me.state = 'idle'; finishSearch(me, me.spot); } }
    for (const p of G.players) { if (p.alive) { if (!(p.id === G.you && me.walkKey)) step(p, dt); botThink(p, dt); } else if (p.id === G.you) step(p, dt); }
    if ((G.t * 4 | 0) !== (G.lastAct | 0)) { G.lastAct = G.t * 4; renderActs(); }
    $('timer').textContent = `${Math.floor(G.timer / 60)}:${String(Math.floor(G.timer % 60)).padStart(2, '0')}`; }
  else $('timer').textContent = ''; }

// ---------------------------------------------------------------- start
function resize() { cv.width = innerWidth; cv.height = innerHeight; VIEW.scale = innerHeight >= 860 ? 3 : 2; }
window.startProto = async function () {
  cv = $('cv'); ctx = cv.getContext('2d'); resize(); addEventListener('resize', resize); cv.addEventListener('click', onClick);
  const fr = []; for (let t = 0; t < 4; t++) { const r = SCENE_P(t, 4); if (t === 0) { VIEW.dep = r.e.dep; VIEW.zone = r.e.zone; VIEW.lights = r.e.lights.map(l => [l[0], l[1], l[2], l[3], l[4], l[5], l[6]]); VIEW.amb = r.e.cfg.amb; VIEW.W = r.canvas.width; VIEW.H = r.canvas.height; } fr.push(r.canvas.getContext('2d').getImageData(0, 0, VIEW.W, VIEW.H).data); $('loadbar').style.width = (t + 1) * 20 + '%'; await new Promise(r => setTimeout(r, 10)); }
  VIEW.frames = fr; low = document.createElement('canvas'); low.width = VIEW.W; low.height = VIEW.H; lctx = low.getContext('2d'); img = lctx.createImageData(VIEW.W, VIEW.H);
  for (let k = 0; k < 260; k++) VIEW.snow.push({ x: Math.random() * VIEW.W, y: Math.random() * VIEW.H, v: .6 + Math.random() * .8, p: Math.random() * 6, a: .35 + Math.random() * .45 });
  buildGrid(); makeBrothers();
  for (const p of G.players) { [p.x, p.y] = pointIn('dorm'); p.night = 'dorm'; }
  // warm the sprite cache for the first frames
  for (const p of G.players) for (let f = 0; f < 8; f++) KIT.person(p.o, f, 'idle', 0);
  $('load').style.display = 'none'; G.phase = 'night'; renderAll();
  const R = ROLES[you().role]; modal(`<div class="hd" style="font-size:40px"><span class="cap">T</span>he Hollow Brother</div><p class="big">Snow has closed the pass. Eight brothers are shut in for the winter, and one of them is not a brother at all.</p><p class="big">You are <b>Brother Aldo</b>, the <b style="color:#d8b060">${R.name}</b>. ${R.text}</p><p class="sub">Click to walk (or WASD). Search the glinting places with E. Click a brother to question him or mark him. Share what you find, or don't. At dusk, the hearing: hang the Hollow Brother before he empties the house.</p><div class="row"><span class="btn go" data-go="night">The first night</span></div>`, 'dawn');
  requestAnimationFrame(loop); };
// exposed for the test harness
window.PROTO = { update, G, simulateNight, startDay, startHearing, runVote, finishHearing, showNight, findPath, you, living };
})();
