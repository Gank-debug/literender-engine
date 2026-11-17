// The Hollow Brother: monastery prototype. One device, you plus seven bot brothers.
// Night is simulated; evidence comes from what really happened; bots search, share, lie and vote.
(function () {
'use strict';
const $ = id => document.getElementById(id);
const hs = KIT.hs;
const toLine = set => G.opt && G.opt.hints && set && set.length ? `<p class="sub">Points to: ${chips(set)}</p>` : '';
const QS = new URLSearchParams(location.search), MODE = QS.get('as') === 'enemy' ? 'enemy' : 'good'; let seed = +QS.get('seed') || (Date.now() % 100000) | 0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[(rnd() * a.length) | 0], shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
// the map: the monastery or the plague town. Rules read rooms by key (dorm is where everyone sleeps, yard the open ground), so they run on either.
let MAP = MAPS.monastery, P = MAP.plan, RK = Object.keys(P.rooms); const RN = k => P.rooms[k].name, INDOOR = () => RK.filter(k => !P.rooms[k].out), OUTS = () => RK.filter(k => P.rooms[k].out);
const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
let TW = +(QS.get('tw') || .6), ACC_T = +(QS.get('acc') || 3.8), VOTE_T = +(QS.get('vote') || 2.6); const DAY_LEN = 150, SEARCH_T = 3, SPEED = 2.6;

// ---------------------------------------------------------------- the brothers
const NAMES = ['Aldo', 'Ivo', 'Bede', 'Osric', 'Tam', 'Wulf', 'Cuth', 'Eadric', 'Ansel', 'Godric'];
const COLS = ['#b03430', '#3e8c58', '#cc9834', '#963c96', '#3e70b0', '#c4642c', '#aa5078', '#3c9696', '#8a9a3a', '#c8c0b0'];
const HABIT = { brown: [104, 72, 48], black: [50, 48, 56], grey: [104, 102, 108] };
const ROLES = {
  enemy: { name: 'Hollow Brother', team: 'evil', text: 'Each night you take a brother. Your traces are your undoing: leave as few as you can. On the first night you take no one: you turn a brother to serve you. If you hang, the hollow passes to him.' },
  scrub: { name: 'Scrubber', team: 'evil', text: 'The Hollow Brother came to you on the first night and you serve him now. Each night you scrub one of his traces away. If he hangs, the hollow passes to you.' },
  husk: { name: 'Hollow Brother (cast off)', team: 'evil', text: 'The hollow left you at the rope.' },
  infirm: { name: 'Infirmarer', team: 'good', night: 'protect', text: 'Each night, keep watch over a brother: he cannot be taken. You read the dead: how they died, and by whom.' },
  tracker: { name: 'Tracker', team: 'good', night: 'follow', text: 'Each night, follow one brother. At dawn you learn every room he passed through.' },
  archiv: { name: 'Archivist', team: 'good', text: 'You keep the night ledger. At dawn you learn how many brothers left their rooms, and one who did.' },
  confess: { name: 'Confessor', team: 'good', text: 'You hear what is not said. At dawn you learn three names: one of them serves the Hollow Brother.' },
  grave: { name: 'Gravedigger', team: 'good', text: 'You dig the graves of the hanged. At dawn you learn what the last hanged brother truly was.' },
  lay: { name: 'Lay Brother', team: 'good', text: 'You keep the fires and the gate. No gift but your eyes and your vote.' },
  novice: { name: 'Novice', team: 'good', text: 'You have no gift but your eyes. Search, share, and vote well.' },
  unknown: { name: 'Brother', team: 'good', text: '' },
  cellar: { name: 'Cellarer', team: 'good', text: 'You keep the stores and know every face. No gift by night.' },
  bell: { name: 'Bell-ringer', team: 'good', night: 'ring', text: 'Each night, choose a door to listen at. At dawn you learn how many brothers passed through that room.' },
  watch: { name: 'Watchman', team: 'good', text: 'You keep watch in the room where you spend the night. At dawn you learn the habit colour of anyone who came in.' },
  precent: { name: 'Precentor', team: 'good', text: 'At dawn you learn whether any of the three brothers who slept nearest you serves the Hollow: none, or some.' },
  prior: { name: 'Prior', team: 'good', text: 'Once in the game, when a brother goes up at the Hearing, you may pardon him. He cannot hang that day.' },
  penit: { name: 'Penitent', team: 'good', text: 'No gift. If you are hanged, innocent or not, the candle burns back two notches.' },
  scribe: { name: 'Scribe', team: 'good', text: 'Once a day, read one brother\'s casebook: you learn one thing he has kept back.' },
  sacrist: { name: 'Sacristan', team: 'good', text: 'You keep the sacristy. At the first dawn after the turning, you learn what the turned brother has become (not who he is).' },
  forger: { name: 'Forger', team: 'evil', turned: 1, night: 'frame', text: 'The Hollow Brother turned you on the first night. Each night you lay one false trace that points at a brother of your choosing. If he hangs, the hollow passes to you.' },
  lamb: { name: 'Lamb', team: 'evil', turned: 1, text: 'The Hollow Brother turned you on the first night. To the Confessor, the Precentor and the Gravedigger you read as faithful. If he hangs, the hollow passes to you.' },
  hush: { name: 'Hush', team: 'evil', turned: 1, night: 'hush', text: 'The Hollow Brother turned you on the first night. Each night you silence one brother: his gift tells him nothing at dawn. If he hangs, the hollow passes to you.' },
  wether: { name: 'Bellwether', team: 'evil', turned: 1, text: 'The Hollow Brother turned you on the first night. When the brothers name who goes up, your name counts twice, and at Compline you know whom he will take. If he hangs, the hollow passes to you.' },
  empty: { name: 'Empty Habit', team: 'evil', turned: 1, text: 'Something spoke to you in your sleep on the first night, and you serve it now. You do not know which brother is the Hollow; he knows you. If he hangs, the hollow finds you.' } };
ROLES.thrall = { name: 'Thrall', team: 'evil', text: 'The Strigoi bit you, and the fever broke into hunger. You serve him now: you know him, he knows you. You have lost your gift, but you may still claim it. When he sends you, you kill.', power: 'He kills when his master sends him.' };
// the town's words: the monastery's text is rewritten on the way to the screen (text nodes only, never attributes)
let TWL = null;
const tw = t => { if (!t || !MAP.words || typeof t !== 'string') return t; if (!TWL) TWL = MAP.words(); for (const [a, b] of TWL) t = t.replace(a, b); return MAP.female ? sheHer(t) : t; };
// she and her: a sentence that names one of the town's women, and none of its men, has its he/his/him turned
const PRON = [[/\bhe\b/g, 'she'], [/\bHe\b/g, 'She'], [/\bhis\b/g, 'her'], [/\bHis\b/g, 'Her'], [/\bhim\b/g, 'her'], [/\bhimself\b/g, 'herself']];
function sheHer(t) { if (!/\b(he|his|him|He|His)\b/.test(t)) return t; const F = MAP.female, Mn = (MAP.names || []).filter(n => !F.includes(n)), names = G.players.map(p => p.short);
  return t.split(/(?<=[.!?])\s+/).map(sn => { const f = F.some(n => names.includes(n) && new RegExp('\\b' + n + '\\b').test(sn)), m = Mn.some(n => new RegExp('\\b' + n + '\\b').test(sn)); if (!f || m || /Strigoi/.test(sn)) return sn; for (const [a, b] of PRON) sn = sn.replace(a, b); return sn; }).join(' '); }
function twNode(root, all) { if ((!MAP.words && !all) || !root) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.parentElement && n.parentElement.closest('#hmenu,input,textarea,script,style')) continue; if (all) { if (n._o != null) { const v = MAP.words ? tw(n._o) : n._o; n._t = v; n.nodeValue = v; } else if (MAP.words) { n._o = n.nodeValue; n._t = tw(n._o); n.nodeValue = n._t; } continue; } if (n._t === n.nodeValue) continue; n._o = n.nodeValue; const v = tw(n._o); n._t = v; if (v !== n.nodeValue) n.nodeValue = v; } }
new MutationObserver(ms => { if (!MAP.words) return; for (const m of ms) { if (m.type === 'characterData') twNode(m.target.parentElement); else for (const n of m.addedNodes) n.nodeType === 3 ? twNode(n.parentElement) : twNode(n); } }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
// ---------------------------------------------------------------- the town's walls (after Die2Nite): materials found by searching go into a
// shared stash at the worksite, with a public log; from it the town builds its defences. Each night the dead come at the walls in
// greater numbers; if they outnumber the defences, they come over and take someone. Rope and timber can also bar your own door.
const BUILDS = { pal: { name: 'Palisade section', cost: { timber: 2, rope: 1 }, def: 2 }, spikes: { name: 'Spikes in the ditch', cost: { nails: 2, timber: 1 }, def: 2 },
  gate: { name: 'Gate bar', cost: { timber: 3, nails: 2 }, def: 4, once: 1 }, tower: { name: 'Watchtower lookout', cost: { timber: 3, rope: 2 }, def: 1, once: 1, see: 1 }, fire: { name: 'Pitch fires on the wall (tonight only)', cost: { pitch: 2 }, def: 3, tonight: 1 } };
const TOWN0 = () => ({ stash: { timber: 2, nails: 1, rope: 1, pitch: 0 }, log: [], built: {}, def: 8, fire: 0, last: null, holy: 2, gate: 0, homes: {}, wound: {}, roam: [] });
const townDef = () => G.town ? G.town.def + (G.town.fire ? BUILDS.fire.def : 0) : 0;
const hordeSize = n => Math.round((4 + (n - 1) * 4.6 + G.clock) * (+QS.get('hz') || MAP.hz || 1));
const matStr = o => Object.entries(o || {}).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(', ');
const nearStash = p => !!(STRIG() && MAP.stash && p && !p.banished && Math.hypot(p.x - MAP.stash[0], p.y - MAP.stash[1]) < 2.8);
function tlog(t, nt) { G.town.log.push({ d: G.day, nt, t, q: G.seq = (G.seq || 0) + 1 }); if (G.town.log.length > 80) G.town.log.shift(); }
function deposit(p) { const pk = p.pack || {}; if (!Object.values(pk).some(v => v)) return false; for (const k in pk) G.town.stash[k] += pk[k]; tlog(`${p.short} put ${matStr(pk)} in the stash.`); p.dayPut = (p.dayPut || 0) + Object.values(pk).reduce((a, b) => a + b, 0); p.pack = {}; return true; }
const suspectTake = p => { for (const b of living()) if (!isHuman(b.id) && b.id !== p.id && team(b) === 'good') b.sus[p.id] += .2; };
const witnesses = p => living().filter(q => q.id !== p.id && !q.banished && Math.hypot(q.x - MAP.stash[0], q.y - MAP.stash[1]) < 4.5);
function tookLog(p, what) { const w = witnesses(p); if (w.length) { tlog(`${p.short} took ${what} from the stash (${w.slice(0, 2).map(q => q.short).join(' and ')} saw).`); suspectTake(p); } else { tlog(`Someone took ${what} from the stash.`); for (const b of living()) if (!isHuman(b.id) && team(b) === 'good' && b.id !== p.id) for (const q of living()) if (q.id !== b.id && Math.hypot(q.x - MAP.stash[0], q.y - MAP.stash[1]) < 9) b.sus[q.id] += .25; } }
function takeMat(p, k) { if (!G.town.stash[k]) return false; G.town.stash[k]--; (p.pack = p.pack || {})[k] = (p.pack[k] || 0) + 1; tookLog(p, '1 ' + k); return true; }
const canBuild = k => { const b = BUILDS[k]; if (b.once && G.town.built[k]) return false; if (b.tonight && G.town.fire) return false; return Object.entries(b.cost).every(([m, n]) => G.town.stash[m] >= n); };
function buildIt(p, k) { if (!canBuild(k)) return false; const b = BUILDS[k]; for (const [m, n] of Object.entries(b.cost)) G.town.stash[m] -= n; if (b.tonight) G.town.fire = 1; else { G.town.def += b.def; G.town.built[k] = (G.town.built[k] || 0) + 1; } tlog(`${p.short} built: ${b.name}.`); return true; }
function barDoor(p) { if (G.town.stash.timber < 1 || G.town.stash.rope < 1 || p.barred === (G.night || 0) + 1) return false; G.town.stash.timber--; G.town.stash.rope--; tookLog(p, '1 timber and 1 rope'); p.barred = (G.night || 0) + 1; return true; }
// a bot at the worksite: the faithful put in and build; the evil sometimes give, sometimes steal
function stashBot(p) { const ev = team(p) === 'evil', H = hordeSize((G.night || 0) + 1);
  if (!ev) deposit(p); else if (rnd() < .6) { const pk = p.pack || {}, keep = {}; for (const k in pk) { const h = Math.floor(pk[k] / 2 + rnd() * .6); keep[k] = h; pk[k] -= h; } deposit(p); p.pack = keep; }
  if (ev) { if (rnd() < .4) { const ks = Object.keys(G.town.stash).filter(k => G.town.stash[k]); for (let n = 0; n < 1 + (rnd() < .4) && ks.length; n++) takeMat(p, pick(ks)); } return; }
  for (let n = 0; n < 1; n++) { const k = canBuild('tower') && rnd() < .7 ? 'tower' : canBuild('gate') ? 'gate' : townDef() < H + 2 && canBuild('fire') && G.town.def < H ? 'fire' : canBuild('pal') ? 'pal' : canBuild('spikes') ? 'spikes' : null; if (!k || (townDef() >= H + 4 && rnd() < .6)) break; buildIt(p, k); }
  if ((p.heard >= 1 || p.claimed) && rnd() < .35) barDoor(p); }
// the stash panel: what is in it, what you carry, what can be built, the log
function showStash() { const me = you(), T = G.town; if (!T) return; const near = nearStash(me) && me.alive && G.phase === 'day', H = hordeSize((G.night || 0) + 1);
  const ico = { timber: '▤', nails: '⟂', rope: '§', pitch: '●' };
  let h = `<div class="hd" style="font-size:34px"><span class="cap">T</span>he Stash</div><p class="sub">The workshop in the square. Walls tonight: <b>${townDef()}</b>${T.last ? ` · last night ${T.last.n} of the dead came` : ''}. What is put in is written in the log with a name. What is taken is written too, but the name only if someone else at the workshop sees it.${near ? '' : ' <b>Go to the worksite by the gate to use it.</b>'}</p>`;
  h += `<div class="row wrap">${Object.entries(T.stash).map(([k, v]) => `<span class="btn small ${near && v ? '' : 'off'}" ${near && v ? `data-stash="take:${k}"` : ''} title="Take one">${ico[k]} ${v} ${k}</span>`).join('')}</div>`;
  h += `<p class="sub">You carry: ${matStr(me.pack) || 'nothing'}.</p><div class="row wrap"><span class="btn ${near && matStr(me.pack) ? 'go' : 'off'}" ${near ? 'data-stash="dep"' : ''}>Put it all in</span><span class="btn ${near && T.stash.timber && T.stash.rope && me.barred !== (G.night || 0) + 1 ? '' : 'off'}" ${near ? 'data-stash="bar"' : ''} title="Takes 1 timber and 1 rope. A sent Thrall cannot get in tonight; the Strigoi's bite still can.">${me.barred === (G.night || 0) + 1 ? 'Your door is barred tonight' : 'Bar my door tonight'}<small>1 timber · 1 rope</small></span></div>`;
  h += `<p class="sub" style="margin-top:10px">Build (from the stash):</p><div class="row wrap">${Object.entries(BUILDS).map(([k, b]) => `<span class="btn small ${near && canBuild(k) ? 'go' : 'off'}" ${near ? `data-stash="build:${k}"` : ''}>${b.name}${b.once && T.built[k] ? ' (built)' : ''}<small>${matStr(b.cost)} · +${b.def}</small></span>`).join('')}</div>`;
  h += `<p class="sub" style="margin-top:10px">The log:</p><div class="tlog">${T.log.slice(-14).map(l => `<p><small>Day ${l.d}</small> ${l.t}</p>`).join('') || '<p class="sub">Nothing written yet.</p>'}</div><div class="row"><span class="btn" data-stash="close">Close</span></div>`;
  modal(h, 'stash'); }
function stashAct(p, a) { if (a === 'close' || a === 'open' || !nearStash(p) || !p.alive || G.phase !== 'day') return;
  if (a === 'dep') deposit(p); else if (a === 'bar') barDoor(p); else if (a.startsWith('take:')) takeMat(p, a.slice(5)); else if (a.startsWith('build:')) buildIt(p, a.slice(6)); if (isHuman(p.id)) asSeat(p.id, () => renderCase()); renderClock(); }
function stashTick() { if (!STRIG() || !G.town || G.you < 0) return; const ns = nearStash(you()) + '|' + matStr(you().pack) + '|' + G.phase; if (ns !== you()._ns) { you()._ns = ns; renderCase(); renderActs(); } }
document.addEventListener('click', e => { const t = e.target.closest('[data-ptgo]'); if (t) padTab(t.dataset.ptgo); });
// ---- Die2Nite: the gate is a lever, your own house can be shored up, and the dead roam the far Wastes by day
// The gate: open at cockcrow, shut only by a hand at the lever (and the log names the hand). Left open at night, the dead walk in.
const LEVER = () => MAP.G ? [MAP.G.GATE[0] - 1.3, MAP.G.WALL[3] - 1.1] : null;
const GATEC = () => MAP.G ? [(MAP.G.GATE[0] + MAP.G.GATE[1]) / 2, MAP.G.WALL[3]] : null;
const hasGate = () => !!(STRIG() && G.town && MAP.wastes && MAP.G);
const nearLever = p => { const L = LEVER(); return !!(hasGate() && p && p.alive && !p.banished && G.phase === 'day' && L && !P.rooms[roomAt(p.x, p.y)].outside && Math.hypot(p.x - L[0], p.y - L[1]) < 2.4); };
function setGate(p, open) { if (!nearLever(p) || !!G.town.gate === !!open) return false; G.town.gate = open ? 1 : 0; tlog(`${p.short} ${open ? 'opened' : 'shut'} the gate.`); toastAll(`${p.short} ${open ? 'opened' : 'shut'} the gate.`); renderClock(); return true; }
// your own house: shore it up with what you carry (any two things); the dead go for the weakest homes, and the log says whose
const HOME_MAX = 3, homeLv = p => (G.town && G.town.homes && G.town.homes[p.id]) || 0, atHome = p => !!(P.rooms.dorm && P.rooms.dorm.rs && placeAt(p.x, p.y) === homeKey(p));
function fortify(p, free) { if (!STRIG() || !G.town || !p.alive || homeLv(p) >= HOME_MAX || G.phase !== 'day' && !free) return false; if (!free && (!atHome(p) || packN(p) < 2)) return false;
  let n = 2; for (const k of ['timber', 'nails', 'rope', 'pitch']) while (n && p.pack[k]) { p.pack[k]--; n--; } if (n) return false;
  (G.town.homes = G.town.homes || {})[p.id] = homeLv(p) + 1; tlog(`${p.short}'s house was shored up (${homeLv(p)} of ${HOME_MAX}).`); for (const b of living()) if (!isHuman(b.id) && team(b) === 'good' && b.id !== p.id && townDef() < hordeSize((G.night || 0) + 1)) b.sus[p.id] += .15; return true; }
// the dead out in the Wastes: one or two hang about each far place by day; alone, they catch you; with a neighbour by you, they back off
const ROAM_SP = 1.55;
function roamSpawn() { if (!hasGate() || !MAP.pois) return; const g = GATEC(), far = MAP.pois.filter(q => Math.hypot(q.x - g[0], q.y - g[1]) > 24), mid = MAP.pois.filter(q => { const d = Math.hypot(q.x - g[0], q.y - g[1]); return d > 15 && d <= 24; });
  const R = []; for (const q of far) for (let k = 0; k < 1 + (G.day >= 3); k++) R.push({ x: q.x + (rnd() - .5) * 3, y: q.y + (rnd() - .5) * 3, hx: q.x, hy: q.y, hr: q.r + 3.5, tx: q.x, ty: q.y, ch: null, cd: 0, f: 0, face: 0, k: R.length });
  if (G.day >= 4) for (const q of mid) R.push({ x: q.x + (rnd() - .5) * 3, y: q.y + (rnd() - .5) * 3, hx: q.x, hy: q.y, hr: q.r + 3, tx: q.x, ty: q.y, ch: null, cd: 0, f: 0, face: 0, k: R.length });
  G.town.roam = R; G.town.wound = {}; }
function roamTick(dt) { const T = G.town; if (!T || !T.roam || G.phase !== 'day') return; const L = living().filter(q => !q.hidden && q.role !== 'enemy' && P.rooms[roomAt(q.x, q.y)].outside);
  for (const d of T.roam) { d.cd = Math.max(0, d.cd - dt); let tx = d.tx, ty = d.ty, sp = ROAM_SP * .45;
    const v = d.cd ? null : L.filter(q => Math.hypot(q.x - d.x, q.y - d.y) < 5.5 && Math.hypot(q.x - d.hx, q.y - d.hy) < d.hr + 4).sort((a, b) => Math.hypot(a.x - d.x, a.y - d.y) - Math.hypot(b.x - d.x, b.y - d.y))[0];
    if (v) { tx = v.x; ty = v.y; sp = ROAM_SP; if (d.ch !== v.id && isHuman(v.id)) asSeat(v.id, () => flash('Something comes out from among the dead trees. Run, or stand with someone.')); if (d.ch !== v.id && !isHuman(v.id) && MAP.stash) { v.plan = null; v.state = 'walk'; v.path = findPath(v.x, v.y, MAP.stash[0], MAP.stash[1]); } d.ch = v.id; } else { d.ch = null; if (Math.hypot(d.tx - d.x, d.ty - d.y) < .3 || rnd() < dt * .08) { const a = rnd() * 6.28, r = rnd() * d.hr; d.tx = d.hx + Math.cos(a) * r; d.ty = d.hy + Math.sin(a) * r; } }
    const dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy); if (dd > .05) { const m = Math.min(dd, sp * dt); d.x += dx / dd * m; d.y += dy / dd * m; face(d, dx, dy); d.f += m * 2.4; }
    if (v && dd < .75) { const pal = L.find(q => q.id !== v.id && Math.hypot(q.x - v.x, q.y - v.y) < 3.5);
      if (pal) { d.cd = 6; const a = Math.atan2(d.y - v.y, d.x - v.x); d.x += Math.cos(a) * 2.5; d.y += Math.sin(a) * 2.5; for (const q of [v, pal]) if (isHuman(q.id)) asSeat(q.id, () => flash(`You and ${q.id === v.id ? pal.short : v.short} drive it back into the trees.`)); continue; }
      d.cd = 9; const a = Math.atan2(d.y - v.y, d.x - v.x); d.x += Math.cos(a) * 3; d.y += Math.sin(a) * 3; wound(v); } } }
function wound(v) { const T = G.town; T.wound = T.wound || {}; const pk = v.pack || {}, had = matStr(pk);
  if (had) { G.spots.push({ x: v.x + .4, y: v.y + .3, room: roomAt(v.x, v.y), clue: null, evil: false, searched: false, by: null, taken: false, mat: { ...pk }, poi: 'dropped' }); v.pack = {}; }
  if (T.wound[v.id] === G.day) { v.alive = false; G.bodies.push({ id: v.id, x: v.x, y: v.y, room: roomAt(v.x, v.y), face: (rnd() * 8) | 0, examined: {}, horde: 1 }); tlog(`${v.short} was found torn apart out in the Wastes.`); toastAll(`Something screams out in the Wastes.`); checkEnd(); return; }
  T.wound[v.id] = G.day; if (!isHuman(v.id)) { v.goHome = true; v.noOut = G.day; } if (isHuman(v.id)) asSeat(v.id, () => flash(`It catches you. You tear free, bleeding${had ? ', and drop what you carried' : ''}. Again today, and you will not get up.`)); }
function roamDraw() { const T = G.town; if (!T || !T.roam || G.phase !== 'day' || VIEW.cine || NIGHT.on() || !window.TKIT) { if (VIEW._roam) { VIEW.extra = []; VIEW._roam = 0; } return; } const out = [];
  for (const d of T.roam) { const c = cell(d.x, d.y); if (!(FOG === 'off' || G.screen || VIS[c[1] * GW + c[0]] > .35)) continue; const fr = Math.floor(d.f) % 4; out.push({ s: TKIT.dead('neighbour', d.face, 'walk', fr, d.k + 3), x: d.x, y: d.y, lt: lightAt(d.x, d.y).map(v => Math.max(v, .62)) }); }
  VIEW.extra = out; VIEW._roam = 1; }

// the plague town plays the Strigoi's rules: he bites (the bitten turn in two nights unless cured) or sends a thrall to kill
const STRIG = () => MAP.rules === 'strigoi';
ROLES.scrub.turned = 1;
ROLES.scrub.power = 'Each night he wipes one of his master\'s traces away.';
ROLES.forger.power = 'Each night he lays a false trace against a brother of his choosing.';
ROLES.lamb.power = 'To the Confessor, the Precentor and the Gravedigger he reads as faithful.';
ROLES.hush.power = 'Each night he silences one brother\'s gift.';
ROLES.wether.power = 'His name counts twice at the Hearing, and he knows whom his master will take.';
ROLES.empty.power = 'He does not know his master; his master knows him.';
const TURNED = ['scrub', 'forger', 'lamb', 'hush', 'wether', 'empty'], isTurned = p => !!(p && ROLES[p.role] && ROLES[p.role].turned);
// the faithful are dealt 9 of these each game (the Lay Brother can come twice), so no one can count the roles to find the odd one out
const POOL = ['infirm', 'tracker', 'archiv', 'confess', 'grave', 'cellar', 'novice', 'lay', 'lay', 'bell', 'watch', 'precent', 'prior', 'penit', 'scribe', 'sacrist'];
const GIFTED = ['infirm', 'tracker', 'archiv', 'confess', 'grave', 'bell', 'watch', 'precent', 'prior', 'scribe', 'sacrist'];
const readsEvil = p => team(p) === 'evil' && p.role !== 'lamb';
const BLUFFS = ['Bell-ringer', 'Watchman', 'Precentor', 'Scribe', 'Sacristan', 'Cellarer', 'Gravedigger', 'Infirmarer'];

const G = window.G = { day: 0, phase: 'load', clock: 0, extraKill: false, players: [], spots: [], bodies: [], prints: [], chat: [], t: 0, timer: 0, you: 0, sel: null, hearing: null, over: null, log: [],
  humans: [0], away: {}, names: {}, cases: {}, nightChoices: {}, ready: {}, lastModal: {}, wchat: [] };
// Seats. G.you is whose eyes we are looking through: on the host it is switched to a guest's seat while that guest's action runs (asSeat),
// and anything shown to "you" in that time is sent to the guest instead of drawn here. LOCAL is the seat of this machine.
let LOCAL = 0; const NETH = () => window.HNET || null;
const isHuman = id => G.humans.includes(id) && !G.away[id], humansNow = () => G.humans.filter(id => !G.away[id]);
const remote = () => G.you !== LOCAL;
function asSeat(s, f) { const o = G.you; G.you = s; try { return f(); } finally { G.you = o; } }
const forHumans = f => { for (const h of humansNow()) asSeat(h, f); };
Object.defineProperty(G, 'clues', { get() { return G.cases[G.you] || (G.cases[G.you] = []); }, set(v) { G.cases[G.you] = v; }, enumerable: false });
Object.defineProperty(G, 'nightChoice', { get() { return G.nightChoices[G.you]; }, set(v) { G.nightChoices[G.you] = v; }, enumerable: false });

// the size of the house: 6 to 10 brothers (10 by default). Traits are spread evenly whatever the size, so evidence still narrows.
const houseSize = () => Math.max(6, Math.min(10, +(G.opt && G.opt.size) || +QS.get('size') || 10));
// auto-balance by size. turn: the Hollow turns a brother on the first night. ks: the notch from which he hungers every night.
// first: the first night he may kill. Tuned with tsim.js (bots, you passive); see the project notes.
// tsim, 16 games each (faithful wins / avg days). tn = the night of the Turning; on it he takes no one.
// 10 turn n1: 4 (5.3) · 9 turn n3, ks 7: 4 (5.2) · 8 turn n4, ks 8: 4 (4.0) · 7 turn n4, ks 8: 5 (3.7) · 6 alone: 4 (3.6)
// tried: 8 turn n1 (any ks/first, calm): 0-1 · 8 turn n3: 2 · 8 turn n5: 6 but most games end before it · 9 turn n1 first 3: 2
const BAL = { 10: { turn: 1, tn: 1, ks: 7, first: 2 }, 9: { turn: 1, tn: 3, ks: 7, first: 2 }, 8: { turn: 1, tn: 4, ks: 8, first: 2 }, 7: { turn: 1, tn: 4, ks: 8, first: 2 }, 6: { turn: 0, ks: 7, first: 2 } };
const bal = () => { const b = { ...BAL[houseSize()] }; if (QS.get('turn0')) b.turn = 0; if (QS.get('ks')) b.ks = +QS.get('ks'); if (QS.get('first')) b.first = +QS.get('first'); if (QS.get('turn1')) b.turn = 1; if (QS.get('calm')) b.calm = +QS.get('calm'); if (STRIG()) b.turn = 0; if (QS.get('tn')) b.tn = +QS.get('tn'); b.tn = b.tn || 1; return b; };
const spread = (n, kinds) => { const out = []; for (let i = 0; i < n; i++) out.push(kinds[i % kinds.length]); return shuffle(out); };
function makeBrothers() {
  const n = houseSize(), foot = spread(n, ['sandal', 'boot']), habit = spread(n, ['brown', 'black', 'grey', 'brown']).slice(0, n),
    tall = spread(n, [1, 0]), item = spread(n, ['candle', 'lantern', 'none', 'candle']),
    roles = shuffle(POOL.slice()).slice(0, n - 1), hairs = [[56, 42, 32], [90, 60, 40], [150, 96, 50], [130, 130, 130], [40, 34, 30], [170, 150, 110]];
  // you are always good with a gift; the Enemy is a bot
  const youRole = G.opt && G.opt.forceEnemy ? 'enemy' : G.opt && G.opt.lot ? pick(['enemy', ...roles]) : MODE === 'enemy' ? 'enemy' : pick(roles.filter(r => GIFTED.includes(r)).length ? roles.filter(r => GIFTED.includes(r)) : roles); const all = ['enemy', ...roles]; all.splice(all.indexOf(youRole), 1);
  const order = [youRole, ...all];
  const NM = MAP.names || NAMES, TT = MAP.title != null ? MAP.title : 'Brother ';
  G.players = NM.slice(0, n).map((nm, i) => { const hood = i % 3 === 1, o = { robe: HABIT[habit[i]], col: COLS[i].match(/\w\w/g).map(h => parseInt(h, 16)), boot: foot[i] === 'boot' ? [44, 34, 28] : [150, 108, 76], ht: tall[i] ? 1.06 : .93, hood: hood ? 1 : 0, hair: pick(hairs), tons: !hood && rnd() < .5 ? 1 : 0, beard: !hood && rnd() < .35 ? pick(hairs) : 0, w: tall[i] ? 1 : 1.05 };
    if (item[i] !== 'none') o.prop = item[i];
    if (MAP.folk) MAP.folk(o, i, nm, { habit: habit[i], tall: tall[i], hood }); return { id: i, name: TT + nm, short: nm, col: COLS[i], role: order[i], foot: foot[i], habit: habit[i], tall: tall[i], item: item[i], o, alive: true, ghostVote: true, x: 0, y: 0, path: [], face: 0, dist: 0, room: 'dorm', state: 'idle', st: 0, night: 'dorm', sus: new Array(n).fill(0), trust: new Array(n).fill(1), claimed: null, said: {}, plan: null, mark: '', searched: 0, ready: false, bluff: null, ask: false }; });
  // the Enemy's two shuffled into positions so "you" are always id 0 and others are random roles
  const others = shuffle(G.players.slice(1).map(p => p.role)); G.players.slice(1).forEach((p, i) => p.role = others[i]);
  if (QS.get('look') === 'varied' && !MAP.folk) varyBrothers();
  // a player who has set his name takes it in place of the brother's
  const taken = new Set(G.players.map(p => p.short.toLowerCase()));
  for (const [id, raw] of Object.entries(G.names || {})) { const p = G.players[+id], nm = String(raw || '').replace(/[<>&"]/g, '').trim().slice(0, 14); if (!p || !nm || nm.toLowerCase() === 'brother') continue;
    let n2 = nm; if (taken.has(n2.toLowerCase()) && n2.toLowerCase() !== p.short.toLowerCase()) n2 = nm + ' II'; taken.delete(p.short.toLowerCase()); taken.add(n2.toLowerCase()); p.short = n2; p.name = TT + n2; p.named = true; }
  G.players.forEach(p => { if (ROLES[p.role].team === 'evil') { const notIn = BLUFFS.slice(); p.bluff = rnd() < .5 ? pick(notIn) : pick(['Tracker', 'Archivist', 'Confessor']); } });
}
// each brother gets a face and a manner of his own: age, skin, build, what is on his head, his beard, scapular or mantle, belt.
// Ten looks dealt from a shuffled deck so no two are alike; none of it is evidence.
function varyBrothers() { const SK = [[226, 186, 150], [206, 164, 128], [184, 136, 100], [150, 104, 72], [118, 80, 56], [92, 62, 44]];
  const HAIR = { dark: [40, 34, 30], brown: [90, 60, 40], red: [150, 86, 46], fair: [176, 150, 100], grey: [140, 138, 134], white: [214, 212, 206] };
  const LOOKS = shuffle([
    { age: 'old', hair: 'white', beard: 'white', head: 'tons', mark: 'mantle', w: 1.02 },          // the eldest, with a winter mantle
    { age: 'young', hair: 'fair', head: 'tons', w: .9 },                                          // a slight young novice, fresh tonsure
    { hair: 'brown', beard: 'brown', head: 'bare', w: 1.18, apron: 1 },                            // broad, aproned from the kitchens
    { head: 'hood', hoodDark: 1, mark: 'scap', w: 1.0 },                                          // the cowl a shade darker than his habit
    { age: 'old', hair: 'grey', head: 'tons', w: .92 },                                           // gaunt, grey fringe
    { hair: 'dark', head: 'coif', beard: 'dark', w: 1.05 },                                       // a black skullcap against the cold
    { head: 'hood', flare: 1, w: 1.08 },                                                          // the deep pointed cowl
    { hair: 'red', head: 'bare', beard: 'red', mark: 'scap', w: 1.0 },                            // red-bearded, scapular
    { hair: 'dark', head: 'knit', mark: 'scarf', w: .98 },                                         // knitted cap and a wool scarf
    { hair: 'grey', beard: 'grey', head: 'hood', w: 1.12 }]);                                      // heavy, grey-bearded, hooded
  const skins = shuffle(SK.concat(SK)).slice(0, 10), belts = [[176, 156, 110], [90, 60, 36], [60, 46, 36], [196, 180, 140]];
  G.players.forEach((p, i) => { const L = LOOKS[i], o = p.o, rb = o.robe;
    o.skin = skins[i]; o.hair = HAIR[L.hair || 'brown']; o.beard = L.beard ? HAIR[L.beard] : 0; o.tons = L.head === 'tons' ? 1 : 0; o.hood = L.head === 'hood' ? 1 : 0;
    o.hat = L.head === 'coif' ? 'coif' : L.head === 'knit' ? 'knit' : undefined; if (o.hat) o.hatCol = L.head === 'coif' ? [28, 24, 26] : [120, 96, 70];
    o.w = (L.w || 1) * (p.tall ? 1 : 1.04); o.ht = (p.tall ? 1.06 : .93) * (L.age === 'old' ? .985 : 1) * (L.age === 'young' ? 1.01 : 1);
    if (L.hoodDark) o.hoodCol = rb.map(v => v * .62); if (L.flare) { o.flare = 1; o.trim = rb.map(v => v * .7); }
    o.mark = L.mark || undefined; o.belt = pick(belts); if (L.apron) o.apron = [150, 136, 112]; if (L.mark === 'scarf') o.trim = [120, 40, 34];
    p.look = L; }); }
const avgSus = q => { const gs = living().filter(b => team(b) === 'good' && b.id !== q.id); return gs.reduce((s2, b) => s2 + b.sus[q.id], 0) / Math.max(1, gs.length); };
const team = p => ROLES[p.role].team, living = () => G.players.filter(p => p.alive), you = () => G.you < 0 ? SPEC : G.players[G.you];
// the big screen sits at the table as no brother: seat -1, everything public, nothing private
const SPEC = { id: -1, alive: false, role: 'unknown', x: 15, y: 13, night: 'dorm', mark: '', sus: [], trust: [], ghostVote: false, state: 'idle', path: [], face: 0, dist: 0, short: 'The house', name: 'The house', col: '#d8b060' };
const evilIds = () => G.players.filter(p => team(p) === 'evil').map(p => p.id);

// ---------------------------------------------------------------- the grid and paths
const CS = .5; let GW = Math.ceil(32 / CS), GH = Math.ceil(28 / CS);
let BLOCK;
function buildGrid() { BLOCK = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = (i + .5) * CS, y = (j + .5) * CS; let b = x < P.bounds[0] || y < P.bounds[1] || x > P.bounds[2] || y > P.bounds[3];
    for (const [x0, y0, x1, y1, ...doors] of P.walls) { if (x0 === x1) { if (Math.abs(x - x0) < .45 && y >= y0 && y <= y1 && !doors.some(d => y > d[0] + .2 && y < d[1] - .2)) b = true; } else { if (Math.abs(y - y0) < .45 && x >= x0 && x <= x1 && !doors.some(d => x > d[0] + .2 && x < d[1] - .2)) b = true; } }
    const pd = P.pad != null ? P.pad : .3; for (const [fx, fy, fw, fd] of P.furn) if (x > fx - pd && x < fx + fw + pd && y > fy - pd && y < fy + fd + pd) b = true;
    BLOCK[j * GW + i] = b ? 1 : 0; } }
const cell = (x, y) => [Math.max(0, Math.min(GW - 1, (x / CS) | 0)), Math.max(0, Math.min(GH - 1, (y / CS) | 0))], free = (i, j) => i >= 0 && j >= 0 && i < GW && j < GH && !BLOCK[j * GW + i];
function nearestFree(x, y) { let [i, j] = cell(x, y); if (free(i, j)) return [i, j]; for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (free(i + di, j + dj)) return [i + di, j + dj]; return [i, j]; }
function findPath(x0, y0, x1, y1) { const [si, sj] = nearestFree(x0, y0), [ti, tj] = nearestFree(x1, y1), N = GW * GH, g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), done = new Uint8Array(N); g[sj * GW + si] = 0;
  // binary heap of [f, id]
  const hf = [], hi = [], push = (f, id) => { let k = hf.length; hf.push(f); hi.push(id); while (k) { const pk = (k - 1) >> 1; if (hf[pk] <= f) break; hf[k] = hf[pk]; hi[k] = hi[pk]; k = pk; } hf[k] = f; hi[k] = id; },
    pop = () => { const top = hi[0], lf = hf.pop(), li = hi.pop(), n = hf.length; if (n) { let k = 0; for (;;) { let c = 2 * k + 1; if (c >= n) break; if (c + 1 < n && hf[c + 1] < hf[c]) c++; if (hf[c] >= lf) break; hf[k] = hf[c]; hi[k] = hi[c]; k = c; } hf[k] = lf; hi[k] = li; } return top; };
  push(0, sj * GW + si);
  while (hf.length) { const id = pop(), i = id % GW, j = (id / GW) | 0; if (done[id]) continue; done[id] = 1; if (i === ti && j === tj) break;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (!free(ni, nj)) continue; if (di && dj && (!free(i + di, j) || !free(i, j + dj))) continue; const nid = nj * GW + ni, c = g[id] + (di && dj ? 1.414 : 1); if (c < g[nid]) { g[nid] = c; from[nid] = id; push(c + Math.hypot(ti - ni, tj - nj), nid); } } }
  const out = []; let id = tj * GW + ti; if (from[id] < 0 && id !== sj * GW + si) return [[x1, y1]]; while (id >= 0 && id !== sj * GW + si) { out.push([(id % GW + .5) * CS, ((id / GW) | 0) * CS + .25]); id = from[id]; } out.reverse();
  // smooth: drop points with clear line of sight
  const sm = []; let a = [x0, y0]; for (let k = 0; k < out.length; k++) { if (k + 1 < out.length && los(a, out[k + 1])) continue; sm.push(out[k]); a = out[k]; } if (free(...cell(x1, y1))) sm.push([x1, y1]); return sm; }
function los(a, b) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .2); for (let k = 1; k <= n; k++) { const t = k / n; if (!free(...cell(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))) return false; } return true; }
const RRS = k => P.rooms[k].rs || [P.rooms[k].r], homeOf = id => { const rs = P.rooms.dorm && P.rooms.dorm.rs; return rs ? rs[id % rs.length] : null; };
// the night's creature: the Hollow (Long Neck) in the monastery; in the town, the Strigoi's true form, the Old One
const BEAST = (face, pose, fr, opt = {}) => STRIG() && window.TKIT ? TKIT.oldOne(face, pose, fr, opt) : KIT.hollow3(face, pose, fr, { v: 'neck', ...opt });
const roomAt = (x, y) => { for (const k of INDOOR()) for (const r of RRS(k)) { if (x >= r[0] && x < r[2] && y >= r[1] && y < r[3]) return k; } for (const k of OUTS()) { const r = P.rooms[k].r; if (x >= r[0] && x < r[2] && y >= r[1] && y < r[3]) return k; } return 'yard'; };
function pointIn(room, margin = .9, who) { const rs = P.rooms[room].rs, r = rs ? (who != null && room === 'dorm' ? homeOf(who) : rs[Math.floor(rnd() * rs.length)]) : P.rooms[room].r; for (let k = 0; k < 60; k++) { const x = r[0] + margin + rnd() * (r[2] - r[0] - margin * 2), y = r[1] + margin + rnd() * (r[3] - r[1] - margin * 2); if (free(...cell(x, y)) && roomAt(x, y) === room) return [x, y]; } const [i, j] = nearestFree((r[0] + r[2]) / 2, (r[1] + r[3]) / 2); return [(i + .5) * CS, (j + .5) * CS]; }
// places: a room, or in the town one soul's own house ('h3' is the house of player 3)
const placeAt = (x, y) => { const r = roomAt(x, y), rs = r === 'dorm' && P.rooms.dorm.rs; if (!rs) return r; const i = rs.findIndex(q => x >= q[0] && x < q[2] && y >= q[1] && y < q[3]); return i < 0 ? r : 'h' + i; };
const PN = k => k[0] === 'h' && /^h\d+$/.test(k) ? ((G.players[+k.slice(1)] || {}).short || 'an empty') + "'s house" : RN(k), homeKey = p => P.rooms.dorm && P.rooms.dorm.rs ? 'h' + p.id : 'dorm';
const placesOnPath = (pts) => { const out = []; for (const [x, y] of pts) { const r = placeAt(x, y); if (out[out.length - 1] !== r) out.push(r); } return out; };
const roomsOnPath = (pts) => { const out = []; for (const [x, y] of pts) { const r = roomAt(x, y); if (out[out.length - 1] !== r) out.push(r); } return out; };
function densify(pts, step = .4) { const out = [pts[0]]; for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let s = 1; s <= n; s++) out.push([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n]); } return out; }

// ---------------------------------------------------------------- clues
let CID = 0;
const TRAIT = { foot: (v) => G.players.filter(p => p.foot === v), habit: (v) => G.players.filter(p => p.habit === v), item: (v) => G.players.filter(p => p.item === v), tall: (v) => G.players.filter(p => p.tall === v) };
const ids = a => a.map(p => p.id);
function clue(kind, text, set, extra = {}) { return { id: ++CID, kind, text, set, day: G.day, ...extra }; }
const ICON = { print: 'print', thread: 'thread', wax: 'wax', soot: 'lantern', body: 'blood', info: 'eye', said: 'eye', alibi: 'key', none: 'none' };
const THING0 = { tower: 'bell rope', chapel: 'pew end', script: 'desk corner', refect: 'bench', dorm: 'cot frame', yard: 'well rope' }, THING = new Proxy({}, { get: (o, k) => (MAP.thing || THING0)[k] || 'doorpost' });
function traceFor(p, kind, room, dead) {
  const not = q => !dead.includes(q.id);
  if (kind === 'print') { const s = TRAIT.foot(p.foot).filter(not); return clue('print', `${p.foot === 'boot' ? 'Boot' : 'Sandal'} prints in the snow, fresh since the bell, crossing the cloister.`, ids(s)); }
  if (kind === 'thread') { const s = TRAIT.habit(p.habit).filter(not); return clue('thread', `A thread of ${p.habit} wool snagged on the ${THING[room]} in the ${RN(room)}.`, ids(s)); }
  if (kind === 'wax') { const s = TRAIT.item('candle').filter(not); return clue('wax', `Fresh wax spilled on the ${RN(room)} floor. Someone came with a candle in the night.`, ids(s)); }
  if (kind === 'soot') { const s = TRAIT.item('lantern').filter(not); return clue('soot', `Lantern soot on the ${RN(room)} doorframe, still warm to the touch.`, ids(s)); }
}
const EMPTY = ['Nothing here but old straw.', 'Only dust, and a dead moth.', 'A mouse, nothing more.', 'Cold ash. Nothing of use.', 'Melted snow. Nothing else.'];

// ---------------------------------------------------------------- night
function simulateNight(choice) { if (choice && 'room' in choice) G.nightChoices[G.you] = choice;
  G.phase = 'nightsim'; const dead = [], movers = [], log = { kills: [], protect: null, info: {} };
  const L = living(), E = G.players.find(p => p.role === 'enemy'), S = G.players.find(p => p.role === 'scrub');
  // where each brother spends the night
  const CH = id => G.nightChoices[id] || {}; const start = {}; for (const p of L) { if (isHuman(p.id)) p.night = CH(p.id).room || 'dorm'; else if (team(p) === 'evil') p.night = rnd() < .6 ? 'dorm' : pick(['chapel', 'refect', 'script']); else p.night = rnd() < .6 ? 'dorm' : pick(['chapel', 'refect', 'script', 'tower']); if (STRIG() && (p.banished || p.lockedOut || (p._out && P.rooms.fields))) p.night = 'fields'; [p.x, p.y] = pointIn(p.night, .9, p.id); start[p.id] = { x: p.x, y: p.y, room: p.night }; }
  // the clock
  G.night = (G.night || 0) + 1; G.clock = Math.min(8, G.clock + (G.night > 1 ? 1 : 0) + (G.noHang && !(bal().calm && G.night < bal().first + 1) && !(STRIG() && (QS.get('tcalm') || MAP.tcalm)) ? 1 : 0)); G.noHang = false;
  // night actions
  const prot = choice.protect != null ? choice.protect : null; let protects = [];
  for (const p of L) { if (p.role === 'infirm') protects.push(isHuman(p.id) && CH(p.id).protect != null ? CH(p.id).protect : botPick(p, 'protect')); }
  const ring = {}; for (const p of L) if (p.role === 'bell') ring[p.id] = isHuman(p.id) && CH(p.id).ring ? CH(p.id).ring : pick(RINGS(p));
  const goodsL = L.filter(q => team(q) === 'good'), frameT = {}, hushT = {};
  for (const p of L) { if (p.role === 'forger') frameT[p.id] = isHuman(p.id) && CH(p.id).frame != null ? CH(p.id).frame : (goodsL.slice().sort((a, b) => avgSus(b) - avgSus(a))[0] || {}).id;
    if (p.role === 'hush') { const gifted = goodsL.filter(q => q.claimed || GIFTED.includes(q.role)); hushT[p.id] = isHuman(p.id) && CH(p.id).hush != null ? CH(p.id).hush : (pick(gifted.filter(q => q.claimed)) || pick(gifted) || {}).id; } }
  const follows = {}; for (const p of L) if (p.role === 'tracker') follows[p.id] = isHuman(p.id) && CH(p.id).follow != null ? CH(p.id).follow : botPick(p, 'follow');
  // the Enemy chooses
  const KS = bal().ks, nk = G.night < bal().first || (bal().turn && G.night === bal().tn && E && !G.players.some(isTurned)) ? 0 : G.clock >= 8 ? 2 : G.clock >= KS ? 1 : (G.night % 2 === 0 ? 1 : 0);
  // the Strigoi: bite or send (at the last tolls, both)
  let bite = null, sent = null, sentBy = null; G.nightNote = {};
  // the bitten by day, out in the woods, find it at dawn; they do not know when, or who
  for (const p of L) if (p.dayBit) { p.dayBit = false; if (!isHuman(p.id) && p.sus) for (const id in (p.alone || {})) if (p.alone[id] === G.day && G.players[id].alive) p.sus[id] += .7; if (team(p) === 'good' && p.bitten) G.nightNote[p.id] = { text: 'You woke cold, with two small wounds on your neck, already scabbed. Not from tonight: out in the woods, yesterday, when you were alone with someone. You have been bitten. Two more nights and you will turn and serve the Strigoi, unless you are cured first: the Physician can bleed it out of you, or holy water at the church.' }; }
  if (STRIG() && E && E.alive) { const thralls = L.filter(p => p.role === 'thrall'), c = CH(E.id), human = isHuman(E.id), inc = L.filter(p => p.bitten).map(p => p.id);
    // the bitten whose two nights are up turn now
    for (const p of L) if (p.bitten && G.night >= p.bitten + (+QS.get('inc') || MAP.inc || 2) && team(p) === 'good') { p.wasRole = p.role; p.role = 'thrall'; p.turnedNight = G.night; p.bitten = null; p.bluff = isHuman(p.id) ? ROLES[p.wasRole].name : pick(BLUFFS.slice());
      G.nightNote[p.id] = { text: `The fever broke in the night, and something else broke with it. You are the Strigoi's now: his Thrall. Your master is ${E.name}.`, evil: 1 }; (G.nightNote[E.id] = G.nightNote[E.id] || { text: '', evil: 1 }).text += `${p.name} has turned: your Thrall now. `; }
    const th = L.filter(p => p.role === 'thrall' && p.turnedNight !== G.night);
    let mode = human ? (c.send != null && th.length ? 'send' : 'bite') : (!th.length ? 'bite' : (G.clock >= bal().ks || inc.length + th.length >= 2 || rnd() < .45) ? 'send' : 'bite');
    if (G.dayBite && mode === 'bite') mode = 'none';   // he fed by day: no bite tonight (he may still send)
    const pickT = ex => { const t = enemyPick(E, ex); return t && t.alive ? t : null; };
    const outs = L.filter(q => q.night === 'fields' && team(q) === 'good' && !q.bitten); if (mode === 'bite' && !human && outs.length && rnd() < .6) bite = pick(outs);
    if (mode === 'bite' && !bite) { bite = human && c.bite != null && G.players[c.bite].alive && !G.players[c.bite].bitten ? G.players[c.bite] : pickT(inc); if (bite && bite.bitten) bite = null; }
    if (mode === 'send' || (G.clock >= 8 && th.length)) { sent = human && c.send != null && G.players[c.send].alive && team(G.players[c.send]) === 'good' ? G.players[c.send] : pickT(bite ? [bite.id] : []); sentBy = human && c.thrall != null && th.some(q => q.id === c.thrall) ? G.players[c.thrall] : pick(th); if (!sent || !sentBy) sent = sentBy = null; } }
  const targets = []; if (STRIG()) { if (sent) targets.push(sent.id); } else if (E && E.alive) for (let k = 0; k < nk; k++) { const pre = !isHuman(E.id) && k === 0 && G.prepick != null && G.players[G.prepick] && G.players[G.prepick].alive && team(G.players[G.prepick]) === 'good' ? G.players[G.prepick] : null; const t = (isHuman(E.id) && k === 0 && CH(E.id).kill != null && G.players[CH(E.id).kill].alive) ? G.players[CH(E.id).kill] : pre || enemyPick(E, targets); if (t && !targets.includes(t.id)) targets.push(t.id); }
  // the first night he takes no one: he goes to one brother and turns him (no one can stop it; the Infirmarer watches for a knife, not a whisper)
  let turned = null; if (G.night === bal().tn && bal().turn && E && E.alive && !G.players.some(isTurned)) { const can = L.filter(p => team(p) === 'good' && p.id !== E.id), want = isHuman(E.id) && CH(E.id).turn != null ? G.players[CH(E.id).turn] : null;
    const v = want && can.includes(want) ? want : can.length ? (() => { const w = can.map(q => 1 + (isHuman(q.id) ? 0 : .3) + ((q.heard || 0) ? -.5 : 0)); let r = rnd() * w.reduce((a, b) => a + b, 0); for (let k = 0; k < can.length; k++) { r -= w[k]; if (r <= 0) return can[k]; } return can[0]; })() : null;
    if (v) { turned = v.id; v.wasRole = v.role; v.role = QS.get('turn') && TURNED.includes(QS.get('turn')) ? QS.get('turn') : pick(TURNED); v.turnedNight = G.night; v.bluff = isHuman(v.id) ? ROLES[v.wasRole].name : (rnd() < .5 ? pick(BLUFFS.slice()) : pick(['Tracker', 'Archivist', 'Confessor'])); log.turned = v.id; } }
  const paths = {}, evilWalk = {};
  if (STRIG()) {
    if (sentBy && sent) { let cur = [sentBy.x, sentBy.y], full = [cur]; const v = sent; full = full.concat(findPath(cur[0], cur[1], v.x, v.y)); cur = [v.x, v.y];
      if (protects.includes(v.id) || v.barred === G.night) { log.protect = v.id; if (v.barred === G.night) G.nightNote[v.id] = { text: 'In the night someone tried your barred door, a long time, and went away.', cure: 1 }; } else { v.alive = false; dead.push(v.id); log.kills.push(v.id); G.bodies.push({ id: v.id, x: v.x, y: v.y, room: roomAt(v.x, v.y), face: (rnd() * 8) | 0, examined: {}, killer: sentBy.id }); }
      full = full.concat(findPath(cur[0], cur[1], sentBy.x, sentBy.y)); paths[sentBy.id] = densify(full); evilWalk[sentBy.id] = [v.id]; movers.push(sentBy.id);
      (G.nightNote[sentBy.id] = G.nightNote[sentBy.id] || { text: '', evil: 1 }).text += `Your master sent you to ${v.name} in the night. ${v.alive ? 'Someone was watching over him; you came back with nothing.' : 'You did what you were sent to do.'} `; }
    if (bite) { let cur = [E.x, E.y], full = [cur]; const v = bite; full = full.concat(findPath(cur[0], cur[1], v.x, v.y)); cur = [v.x, v.y];
      if (protects.includes(v.id)) log.protect = log.protect != null ? log.protect : v.id; else { v.bitten = G.night; log.bites = [v.id];
        G.nightNote[v.id] = { text: 'You woke cold, with two small wounds on your neck. You have been bitten. In two nights you will turn and serve the Strigoi, unless you are cured first: the Physician can bleed it out of you, or you can take the holy water at the church (the whole town will see).', bite: 1 }; }
      full = full.concat(findPath(cur[0], cur[1], E.x, E.y)); paths[E.id] = densify(full); evilWalk[E.id] = [v.id]; movers.push(E.id); }
    // the Physician's bleeding cures a bite
    for (const pid of protects) { const q = G.players[pid]; if (q && q.alive && q.bitten && q.bitten !== G.night) { q.bitten = null; const doc = L.find(p => p.role === 'infirm' && (isHuman(p.id) ? CH(p.id).protect : null) === pid) || L.find(p => p.role === 'infirm');
        if (doc) G.nightNote[doc.id] = { text: `You bled ${q.name} in the night. The blood ran black at first, then red. Whatever was in him is out.`, set: [q.id] }; G.nightNote[q.id] = { text: 'In the night the Physician bled you. The cold has left your neck. You are clean.', cure: 1 }; } }
  } else if (E && E.alive) { evilWalk[E.id] = targets; let cur = [E.x, E.y], full = [cur];
    if (turned != null) { const v = G.players[turned]; full = full.concat(findPath(cur[0], cur[1], v.x, v.y)); cur = [v.x, v.y]; }
    for (const tid of targets) { const v = G.players[tid], pth = findPath(cur[0], cur[1], v.x, v.y); full = full.concat(pth); cur = [v.x, v.y];
      if (protects.includes(tid)) { log.protect = tid; continue; }
      v.alive = false; dead.push(tid); log.kills.push(tid); G.bodies.push({ id: tid, x: v.x, y: v.y, room: roomAt(v.x, v.y), face: (rnd() * 8) | 0, examined: {} }); }
    const back = findPath(cur[0], cur[1], E.x, E.y); full = full.concat(back); paths[E.id] = densify(full); if (targets.length || turned != null) movers.push(E.id); }
  // innocent night walks: two brothers go to pray, eat or read
  for (const p of shuffle(L.filter(q => team(q) === 'good' && !dead.includes(q.id))).slice(0, 2)) { const to = pick(RK.filter(r => !P.rooms[r].out && r !== p.night)), [tx, ty] = pointIn(to), go = findPath(p.x, p.y, tx, ty), back = findPath(tx, ty, p.x, p.y); paths[p.id] = densify([[p.x, p.y], ...go, ...back]); movers.push(p.id); p.walkTo = to; }
  // the Scrubber walks too, sometimes
  // traces along each path
  G.spots = []; G.prints = [];
  const addSpot = (x, y, c, evil) => G.spots.push({ x, y, room: roomAt(x, y), clue: c, evil: !!evil, searched: false, by: null, taken: false });
  for (const [pid, pts] of Object.entries(paths)) { const p = G.players[pid], isE = evilWalk[pid] != null;
    const yard = pts.filter(([x, y]) => roomAt(x, y) === 'yard');
    if (yard.length) { yard.forEach(([x, y], k) => { if (k % 2 === 0) G.prints.push([x + (k % 4 ? .12 : -.12), y, p.foot]); }); if (!(isE && G.clock >= 4)) { const [x, y] = yard[(yard.length * (.3 + rnd() * .4)) | 0]; addSpot(x + .3, y + .2, traceFor(p, 'print', 'yard', dead), isE); } }
    const rooms = roomsOnPath(pts).filter(r => r !== 'yard' && r !== p.night);
    // the Strigoi comes softly to a bite: half the time no thread, never his light
    const soft = STRIG() && p.role === 'enemy';
    if (isE) { for (const tid of evilWalk[pid]) { if (soft && rnd() < .5) continue; const b = G.bodies.find(b => b.id === tid) || G.players[tid]; addSpot(b.x + .9, b.y + .5, traceFor(p, 'thread', roomAt(b.x, b.y), dead), true); }
      if (p.item !== 'none' && rooms.length && !soft) { const r = pick(rooms), [x, y] = pointIn(r, .6); addSpot(x, y, traceFor(p, p.item === 'candle' ? 'wax' : 'soot', r, dead), true); } }
    else if (p.item !== 'none' && p.walkTo) { const [x, y] = pointIn(p.walkTo, .6); addSpot(x, y, traceFor(p, p.item === 'candle' ? 'wax' : 'soot', p.walkTo, dead), false); }
    p.walkTo = null; }
  // the Scrubber removes one of the Enemy's traces
  if (S && S.alive) { const ev = G.spots.filter(s => s.evil); if (ev.length && rnd() < .8) { const s = pick(ev); G.spots.splice(G.spots.indexOf(s), 1); } }
  // the Forger lays a false trace that fits the brother he chose
  for (const [fid, tid] of Object.entries(frameT)) { const f = G.players[fid], t = G.players[tid]; if (!f.alive || !t || !t.alive || !G.players[fid].turnedNight || G.night === f.turnedNight) continue; const r = pick(['chapel', 'refect', 'script', 'tower']), [x, y] = pointIn(r, .6), kind = t.item !== 'none' && rnd() < .5 ? (t.item === 'candle' ? 'wax' : 'soot') : 'thread'; addSpot(x, y, traceFor(t, kind, r, dead), false); G.spots[G.spots.length - 1].forged = true; }
  // the dead at the walls
  if (STRIG() && G.town) { const Hn = hordeSize(G.night), open = hasGate() && G.town.gate, D = open ? Math.floor(townDef() / 2) : townDef(); let breach = null; const taken = [];
    const nv = Hn > D ? (open ? Math.max(1, Math.min(2, Math.ceil((Hn - D) / 10))) : 1) : 0;
    for (let k = 0; k < nv; k++) { const pool = L.filter(q => q.alive && !dead.includes(q.id) && q.role !== 'enemy'); if (!pool.length) break; // the dead pass the Strigoi by: he is one of them
      const w = pool.map(q => ((MAP.hordeW ? MAP.hordeW(q) : 1 + Math.max(0, q.y - 17) / 3 + Math.max(0, q.x - 24) / 3) + (P.rooms[roomAt(q.x, q.y)].outside ? 8 : 0)) / (q.night === 'dorm' ? 1 + 1.4 * homeLv(q) : 1)); let r = rnd() * w.reduce((a, b) => a + b, 0), v = pool[0]; for (let j = 0; j < pool.length; j++) { r -= w[j]; if (r <= 0) { v = pool[j]; break; } }
      if (v) { if (breach == null) breach = v.id; taken.push(v.id); v.alive = false; dead.push(v.id); G.bodies.push({ id: v.id, x: v.x, y: v.y, room: roomAt(v.x, v.y), face: (rnd() * 8) | 0, examined: {}, horde: 1 }); } }
    G.town.last = { n: Hn, def: D, breach, taken, open: !!open, night: G.night }; G.town.fire = 0; log.horde = G.town.last; tlog(`${open ? 'The gate stood open. ' : ''}${Hn} of the dead came ${open ? 'through the gate' : `at the walls (${D})`}. ${taken.length ? `They came ${open ? 'in' : 'over'}. ${taken.map(id => G.players[id].short).join(' and ')} ${taken.length > 1 ? 'were' : 'was'} taken.` : 'The walls held.'}`, G.night); }
  // the watchtower: whoever slept outside the walls, and whatever crossed the open square in the dark
  if (STRIG() && G.town && G.town.built.tower) { const outs = L.filter(q => q.night === 'fields'), seen = [];
    if (outs.length) seen.push(`${outs.map(q => q.short).join(', ')} slept outside the walls.`);
    for (const [pid, pts] of Object.entries(paths)) { const w = G.players[pid]; if (!pts || !pts.some(([x, y]) => roomAt(x, y) === 'yard') || rnd() < .35) continue; const byH = rnd() < .5, t = byH ? `A figure in a ${w.habit} cloak crossed the square in the dark.` : `A ${w.tall ? 'tall' : 'short'} figure crossed the square in the dark.`; seen.push(t);
      if (evilWalk[pid] != null) { const c = clue('found', t, ids((byH ? TRAIT.habit(w.habit) : TRAIT.tall(w.tall)).filter(q => q.alive && !dead.includes(q.id)))); for (const b of L) if (!isHuman(b.id) && team(b) === 'good' && b.alive) learn(b, c, .9); } }
    tlog('From the watchtower: ' + (seen.join(' ') || 'nothing moved in the square.'), G.night); }
  // the bitten show it: blood on the pillow, a fever heard in the night
  if (STRIG()) for (const p of L.filter(q => q.alive && q.bitten)) { const [x, y] = [p.x + .6, p.y + .4];
    const c = rnd() < .55 ? clue('body', `Blood on a pillow in the ${RN(roomAt(p.x, p.y))}, two small drops. Whoever slept there wears a ${p.habit} cloak.`, ids(TRAIT.habit(p.habit).filter(q => q.alive && !dead.includes(q.id))))
      : clue('body', `A sweat-soaked blanket in the ${RN(roomAt(p.x, p.y))}, cold as a grave. Someone ${p.tall ? 'tall' : 'short'} has a fever that is not the plague.`, ids(TRAIT.tall(p.tall).filter(q => q.alive && !dead.includes(q.id))));
    addSpot(x, y, c, false); }
  // empty spots
  for (let k = 0; k < 7; k++) { const r = pick(RK), [x, y] = pointIn(r, .7); addSpot(x, y, null, false); }
  // materials: in the town and, richer, out in the fields
  if (STRIG()) { const MK = ['timber', 'timber', 'nails', 'rope', 'pitch'], inT = RK.filter(r => !P.rooms[r].outside), outF = RK.filter(r => P.rooms[r].outside);
    if (MAP.pois) { G.spots = []; const per = +(QS.get('per') || 2); for (const q of MAP.pois) for (let k = 0; k < per; k++) { const a = rnd() * 6.28, rr = rnd() * q.r * .6, x = q.x + Math.cos(a) * rr, y = q.y + Math.sin(a) * rr; addSpot(x, y, null, false);
        const far = q.y > 60 ? 2 : q.y > 54 ? 1.5 : 1, m = {}, n = Math.floor(far + rnd() * .99); for (let j = 0; j < Math.max(1, n); j++) { const a2 = pick(MK); m[a2] = (m[a2] || 0) + 1; } const sp = G.spots[G.spots.length - 1]; sp.mat = m; sp.poi = q.name; } }
    else { const big = !!MAP.wastes, nIn = big ? +(QS.get('nin') || 3) : 10, nOut = big ? +(QS.get('nout') || 9) : 8; G.spots = []; for (let k = 0; k < nIn; k++) { const [x, y] = pointIn(pick(inT), .7); addSpot(x, y, null, false); G.spots[G.spots.length - 1].mat = { [pick(MK)]: 1 }; }
    for (let k = 0; k < nOut && outF.length; k++) { const [x, y] = pointIn(pick(outF), .7); addSpot(x, y, null, false); const m = {}, n = big ? (y > 43.4 ? 2 + (rnd() < .5) : 1 + (rnd() < .5)) : 2; for (let j = 0; j < n; j++) { const a = pick(MK); m[a] = (m[a] || 0) + 1; } G.spots[G.spots.length - 1].mat = m; } } }
  // dawn information for each gifted brother
  const info = {};
  const gh = G.lastHanged; G.lastHanged = null;
  for (const p of L.filter(q => q.alive)) {
    if (p.role === 'tracker' && follows[p.id] != null) { const t = G.players[follows[p.id]], pth = paths[t.id]; const rs = pth ? roomsOnPath(pth) : [t.night], ps = pth ? placesOnPath(pth) : [t.night === 'dorm' ? homeKey(t) : t.night]; info[p.id] = clue('info', pth ? `You followed ${t.name}: ${ps.map(PN).join(' → ')}.` : `You followed ${t.name}: he never left ${ps[0][0] === 'h' ? (ps[0] === homeKey(t) ? 'his house' : PN(ps[0])) : 'the ' + RN(t.night)}.`, pth && targets.some(tid => rs.includes(roomAt(G.players[tid].x, G.players[tid].y))) ? [t.id] : [], { src: 'role', about: t.id, rooms: rs }); }
    if (p.role === 'archiv') { const m = movers.filter(id => id !== p.id); info[p.id] = clue('info', m.length ? `The ledger: ${m.length} brother${m.length > 1 ? 's' : ''} left their rooms in the night. One was ${G.players[pick(m)].name}.` : 'The ledger: no brother left his room in the night.', [], { src: 'role' }); const nm = info[p.id].text.match(/One was (Brother \w+)/); if (nm) info[p.id].set = [G.players.find(q => q.name === nm[1]).id]; info[p.id].weak = true; }
    if (p.role === 'grave' && gh) { const v = G.players[gh.id], ev = readsEvil(v); info[p.id] = clue('info', `You dug ${v.short}'s grave. He was ${ev ? 'the ' + ROLES[v.role].name + '. Evil.' : 'the ' + ROLES[v.role === 'lamb' ? v.wasRole : v.role].name + ', and innocent.'}`, ev ? [] : (G.players[gh.by] && G.players[gh.by].alive ? [gh.by] : []), { src: 'role', grave: gh, evil: ev }); }
    if (p.role === 'confess') { const ev = L.filter(q => readsEvil(q) && q.alive && q.id !== p.id), gd = shuffle(L.filter(q => !readsEvil(q) && q.alive && q.id !== p.id)); if (ev.length) { const three = shuffle([pick(ev), ...gd.slice(0, 2)]); info[p.id] = clue('info', `In confession, three names: ${three.map(q => q.short).join(', ')}. One of them serves the Hollow Brother.`, ids(three), { src: 'role' }); } }
    if (p.role === 'bell' && ring[p.id]) { const r = ring[p.id], n = movers.filter(id => id !== p.id && paths[id] && placesOnPath(paths[id]).includes(r)).length; info[p.id] = clue('info', `You listened at ${r[0] === 'h' && /^h\d+$/.test(r) ? 'the door of ' + PN(r) : 'the ' + RN(r) + ' door'}. ${n ? n + ' brother' + (n > 1 ? 's' : '') + ' passed through in the night.' : 'No one passed through in the night.'}`, [], { src: 'role', weak: true }); }
    if (p.role === 'watch') { const r = p.night === 'dorm' ? homeKey(p) : p.night, who = movers.filter(id => id !== p.id && paths[id] && placesOnPath(paths[id]).includes(r)).map(id => G.players[id]); const cols = [...new Set(who.map(q => q.habit))];
      info[p.id] = clue('info', who.length ? `You kept watch in ${r[0] === 'h' && r !== 'h' ? 'your house' : 'the ' + RN(r)}. In the dark you saw ${who.length === 1 ? 'one brother' : who.length + ' brothers'} come in: ${cols.map(c => 'a ' + c + ' habit').join(' and ')}.` : `You kept watch in ${r[0] === 'h' ? 'your house' : 'the ' + RN(r)}. No one came in.`, ids(L.filter(q => q.id !== p.id && cols.includes(q.habit))), { src: 'role', weak: true }); }
    if (p.role === 'precent') { const st = start[p.id], near = L.filter(q => q.id !== p.id && q.alive && start[q.id]).sort((a, b) => Math.hypot(start[a.id].x - st.x, start[a.id].y - st.y) - Math.hypot(start[b.id].x - st.x, start[b.id].y - st.y)).slice(0, 3); const some = near.some(readsEvil);
      info[p.id] = clue('info', `Of the three who slept nearest you, ${near.map(q => q.short).join(', ')}: ${some ? 'at least one serves the Hollow.' : 'none serves the Hollow.'}`, some ? ids(near) : [], { src: 'role' }); }
    if (p.role === 'sacrist' && STRIG()) { const n = L.filter(q => q.alive && q.bitten).length; info[p.id] = clue('info', `You ring the passing bell and count the sick. ${n ? n + ' in the town ' + (n > 1 ? 'are' : 'is') + ' bitten and not yet turned.' : 'No one in the town is bitten tonight.'}`, [], { src: 'role' }); }
    else if (p.role === 'sacrist' && !p.sacKnew) { const T = G.players.find(isTurned); if (T) { p.sacKnew = true; const k = T.turnedAs || T.role; info[p.id] = clue('info', `In the sacristy the Hollow has left his mark. The brother he turned is his ${ROLES[k].name}: ${ROLES[k].power}`, [], { src: 'role', weak: true }); } }
  }
  for (const [hid, tid] of Object.entries(hushT)) { const h = G.players[hid]; if (!h.alive || tid == null || h.turnedNight === G.night) continue; if (info[tid] && !isHuman(+tid)) delete info[tid]; else if (info[tid]) info[tid] = clue('info', 'You woke heavy, and the night is a blank. Whatever your gift would have shown you, it has gone.', [], { src: 'role', hushed: true }); }
  G.nightInfo = info; G.nightLog = { ...log, targets, dead, movers, turned };
  for (const id of dead) G.players[id].diedDay = G.day + 1;
  G.nightLog.path = (STRIG() ? (sentBy && paths[sentBy.id]) || paths[E && E.id] : paths[E && E.id]) || null; G.nightLog.start = start;
  if (NETH() && NETH().host) NETH().night();
  if (G.headless || !sceneOn()) dawn(); else { NIGHT.play(); if (NETH() && NETH().host && (humansNow().length > 1 || G.screen)) dawn(); }
}
const TNW = () => ['first', 'second', 'third', 'fourth', 'fifth'][bal().tn - 1] + ' night';
// the turned are told which night it was (it is later in an eight-brother house)
function turnTexts() { for (const k in ROLES) { const R = ROLES[k]; if (R._t == null) R._t = R.text; R.text = R._t.replace(/the first night/g, 'the ' + TNW()); } }
const isTurnNight = () => !!bal().turn && (G.night || 0) + 1 === bal().tn && !G.players.some(isTurned);
function killsTonight() { const KS = bal().ks, n = (G.night || 0) + 1; if (isTurnNight()) return 0; const c = Math.min(8, G.clock + (n > 1 ? 1 : 0) + (G.noHang && !(bal().calm && n < bal().first + 1) ? 1 : 0)); return n < bal().first ? 0 : c >= 8 ? 2 : c >= KS ? 1 : (n % 2 === 0 ? 1 : 0); }
function botPick(p, what) { const L = living().filter(q => q.id !== p.id); if (what === 'protect') { const claimed = L.filter(q => q.claimed && team(q) === 'good'); return (claimed.length ? pick(claimed) : pick(L)).id; } const top = L.slice().sort((a, b) => p.sus[b.id] - p.sus[a.id]); return (rnd() < .7 ? top[0] : pick(L)).id; }
function enemyPick(E, already) { const L = living().filter(q => team(q) === 'good' && !already.includes(q.id)); if (!L.length) return null;
  // prefer brothers who claimed a gift, or who suspect the evil the most
  const w = L.map(q => { let s = 1; if (q.claimed && ['Tracker', 'Confessor', 'Archivist', 'Infirmarer'].includes(q.claimed)) s += 3; s += (q.sus[E.id] || 0) + (q.heard || 0) * 1.6; return s; });
  let r = rnd() * w.reduce((a, b) => a + b, 0); for (let k = 0; k < L.length; k++) { r -= w[k]; if (r <= 0) return L[k]; } return L[0]; }

// ---------------------------------------------------------------- dawn and day
function dawn() {
  G.day++; G.phase = 'dawn'; const lg = G.nightLog;
  for (const p of G.players) { p.path = []; p.state = 'idle'; p.ready = false; p.plan = null; p.searchN = 0; p.ask = false; p.wait = 4 + rnd() * 10; }
  // bodies examined by role
  for (const b of G.bodies) if (b.clues == null) { const v = G.players[b.id], E = b.killer != null ? G.players[b.killer] : G.players.find(p => p.role === 'enemy'), rel = E.tall === v.tall ? 'his own height' : (E.tall ? 'taller' : 'shorter');
    if (b.horde) { b.clues = { all: clue('body', `${v.name}, torn apart in the ${RN(b.room)}. The dead came over the wall for him. No hand of the town did this.`, []), infirm: clue('body', `Reading ${v.short}'s body: teeth and nails, many of them. The dead, not the Strigoi's own.`, []) }; continue; }
    b.clues = { all: clue('body', `${v.name}, dead in the ${RN(b.room)}. Struck from behind; no cry was heard.`, []), infirm: clue('body', `Reading ${v.short}'s body: struck from behind by someone ${rel === 'his own height' ? 'of his own height' : rel + ' than him'}.`, ids(G.players.filter(p => p.id !== b.id && (rel === 'his own height' ? p.tall === v.tall : rel === 'taller' ? p.tall && !v.tall : !p.tall && v.tall)))) }; }
  // your role info into your casebook
  G.timers = []; forHumans(() => { const ni = G.nightInfo[G.you]; if (ni) addCase(ni); const nn = (G.nightNote || {})[G.you]; if (nn) addCase(clue('info', nn.text.trim(), nn.set || [], { src: 'role' })); });
  // bots: their role info becomes their knowledge, and maybe a claim
  for (const p of living()) if (!isHuman(p.id)) { const ni = G.nightInfo[p.id]; if (ni) learn(p, ni, 1.4); }
  G.timer = DAY_LEN; if (checkEnd()) return; G.ready = {}; forHumans(showDawn); saveGame(); }
function startDay() { G.gateWarn = false; for (const p of G.players) { p.lockedOut = false; p.gateGo = false; } if (hasGate()) { G.town.gate = 1; const gb = living().filter(q => !isHuman(q.id) && team(q) === 'good' && !q.banished), eb = living().filter(q => !isHuman(q.id) && team(q) === 'evil' && !q.banished); G.town.keeper = gb.length && rnd() < .85 ? pick(gb).id : null; G.town.sab = eb.length && rnd() < .35 ? pick(eb).id : null; G.town.sabMode = rnd() < .5 ? 'early' : 'late'; roamSpawn(); } G.dayBite = null; for (const p of G.players) { p.goHome = false; p.dayPut = 0; p.dayOut = 0; } if (STRIG()) for (const p of living()) { if (!isHuman(p.id) && p.bitten && !p.holy && team(p) === 'good' && G.town && G.town.holy > 0 && rnd() < .45) p.goHoly = true; if (!isHuman(p.id) && rnd() < .25) p.goStash = true; }
 for (const p of living()) if (p.role === 'scribe' && !isHuman(p.id)) { const t = topSus(p); const kept = t ? (isHuman(t.id) ? (G.cases[t.id] || []).filter(c => c.found && !c.shared) : (t.held || [])) : []; if (kept.length) learn(p, pick(kept), 1.2); }
  G.phase = 'day'; G.ready = {}; forHumans(hideModal); renderTop(); if (!G.demo) toastAll('The bell for Prime. Search the house before dusk.');
  // dawn talk: claims and info
  const L = living().filter(p => !isHuman(p.id)); let delay = 1.5;
  for (const p of shuffle(L.slice())) { const ni = G.nightInfo[p.id];
    if (team(p) === 'good' && ni && (G.day > 1 || rnd() < .75)) { later(delay, () => { if (!p.alive) return; p.claimed = ROLES[p.role].name; const line = `I am the ${p.claimed}. ${ni.text.replace(/^You /, 'I ').replace(/^The ledger/, 'My ledger').replace(/^In confession/, 'In confession I heard')}`; say(p, line); broadcast(ni, p, 1, line); }); delay += 2.5 + rnd() * 2; }
    else if (team(p) === 'evil' && (G.day > 1 || rnd() < .6) && !p.claimed) { later(delay, () => { if (!p.alive) return; evilClaim(p); }); delay += 2.5 + rnd() * 2; } }
  later(delay + 1, () => { const sp = living().filter(p => !isHuman(p.id) && team(p) === 'good').sort((a, b) => maxSus(b) - maxSus(a))[0]; if (sp && maxSus(sp) > .9) { const t = topSus(sp); say(sp, pick([`I'd keep an eye on ${t.short}.`, `${t.short}, where were you last night?`, `Everything keeps pointing at ${t.short}.`])); } }); }
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
function addCase(c) { if (G.clues.some(q => q.id === c.id)) return; if (c.q == null) c.q = G.seq = (G.seq || 0) + 1; if (c.d == null) c.d = G.day; G.clues.push(c); if (team(you()) === 'good') learn({ ...you(), alive: true, sus: you().sus }, c, c.src === 'said' ? .6 : 1.3); renderCase(); }
// bots learn from a clue: suspicion spread over the people it points to, weighed by trust in whoever shared it
function learn(b, c, w = 1) { if (!b.alive && !isHuman(b.id)) return; if (team(b) === 'evil' || !c.set) return; const s = c.set.filter(id => id !== b.id); if (!s.length) { if (c.rooms && c.about != null) b.sus[c.about] -= .4; return; } const kw = ({ print: 1.6, thread: 1.6, wax: 1.6, soot: 1.6, body: 1.8, said: .5, info: 1 }[c.kind] || 1) * TW; for (const id of s) b.sus[id] += w * kw / s.length * (c.kind === 'info' && s.length === 1 ? 1.8 : 1) * (c.weak ? .3 : 1); }
function broadcast(c, from, w = 1, line) { if (from && c.kind !== 'alibi') { from.heard = (from.heard || 0) + (c.set && c.set.length ? 1 : .5); if (team(from) === 'good' && G.phase === 'day') answer(c, from); } for (const b of G.players) if (!isHuman(b.id) && b.alive && (!from || b.id !== from.id)) learn(b, c, w * (from ? b.trust[from.id] : 1)); if (from) { const said = { ...c, id: ++CID, kind: c.kind === 'info' ? 'said' : c.kind, said: from.id, text: line || c.text, src: 'said' }; forHumans(() => { if (G.you !== from.id) addCase({ ...said }); }); }
  // two brothers claiming the same gift: someone is lying
  if (from && from.claimed) for (const q of G.players) if (q !== from && q.claimed === from.claimed && q.alive) for (const b of G.players) if (b.id !== from.id && b.id !== q.id && team(b) === 'good') { b.sus[from.id] += .3; b.sus[q.id] += .3; } }
const maxSus = b => Math.max(...living().filter(q => q.id !== b.id).map(q => b.sus[q.id])), topSus = b => living().filter(q => q.id !== b.id).sort((x, y) => b.sus[y.id] - b.sus[x.id])[0];

// ---------------------------------------------------------------- bots by day
// the holy water at the church: once each, in front of everyone. It cures a bite; it burns the Strigoi's own.
function takeHoly(p) { if (!STRIG() || !p || !p.alive || p.holy || G.phase !== 'day' || roomAt(p.x, p.y) !== 'chapel' || !(G.town && G.town.holy > 0)) return; p.holy = true; G.town.holy--; tlog(`${p.short} took holy water at the church. ${G.town.holy ? G.town.holy + ' flask' + (G.town.holy > 1 ? 's' : '') + ' left.' : 'The font is dry.'}`);
  if (team(p) === 'evil') { say(null, `${p.short} takes the holy water at the church, and screams: it burns him. He is the Strigoi's.`, 'sys'); for (const b of living()) if (!isHuman(b.id) && b.id !== p.id && team(b) === 'good') b.sus[p.id] += 6; if (isHuman(p.id)) asSeat(p.id, () => flash('It burns.')); }
  else { const was = !!p.bitten; p.bitten = null; say(null, `${p.short} takes the holy water at the church.`, 'sys'); if (isHuman(p.id)) asSeat(p.id, () => flash(was ? 'The cold leaves your neck. You are clean.' : 'It tastes of stone and nothing more: there was nothing in you to cure.')); }
  renderActs(); }
// bots at the lever: the day's gatekeeper (a faithful bot, most days) shuts it at dusk once the others are in, and opens it to a knock;
// an evil bot, some days, shuts it early on those still out, or opens it again at the last moment
function gateBot(p) { if (!hasGate() || G.phase !== 'day' || p.banished) return false; const T = G.town, outs = living().filter(q => q._out && !q.banished && q.id !== p.id), g = GATEC();
  let want = null; if (T.keeper === p.id && team(p) === 'good') { if (T.gate && (G.timer < 12 || (G.timer < 30 && !outs.length))) want = 0; else if (!T.gate && G.timer > 6 && outs.some(q => Math.hypot(q.x - g[0], q.y - g[1]) < 4)) want = 1; }
  if (want == null && T.keeper == null && team(p) === 'good' && T.gate && G.timer < 10) { const L0 = LEVER(); if (Math.hypot(p.x - L0[0], p.y - L0[1]) < 9) want = 0; }
  if (T.sab === p.id && team(p) === 'evil') { if (T.sabMode === 'early' && T.gate && G.timer < 55 && G.timer > 22 && outs.some(q => team(q) === 'good')) want = 0; if (T.sabMode === 'late' && !T.gate && G.timer < 9) want = 1; }
  if (want == null || p._out) { p.gateGo = false; return false; } if (nearLever(p)) { setGate(p, !!want); p.path = []; p.gateGo = false; p.wait = 1; return true; }
  if (p.gateGo && p.path.length) return true; const L = LEVER(); p.path = findPath(p.x, p.y, L[0] + .3, L[1] - .3); p.gateGo = true; return true; }
function botThink(p, dt) {
  if (!p.alive || isHuman(p.id)) return;
  if (p.role === 'enemy' && G.phase === 'day' && !G.dayBite && rnd() < dt * .5) { const v = dayBiteTarget(p); if (v) dayBite(p, v); }
  if (STRIG() && MAP.carry && !roomFor(p) && !p.goStash) p.goStash = true;
  if (p.state === 'search') { p.st -= dt; if (p.st <= 0) { p.state = 'idle'; finishSearch(p, p.plan.spot); p.plan = null; } return; }
  if (gateBot(p)) return;
  if (p.path.length) return;
  if (p.goHome) { if (!P.rooms[roomAt(p.x, p.y)].outside) { p.goHome = false; } else { p.path = findPath(p.x, p.y, MAP.stash[0] + rnd() * 2 - 1, MAP.stash[1] - 2 + rnd()); return; } }
  if (STRIG() && p.goStash && MAP.stash) { if (nearStash(p)) { p.goStash = false; stashBot(p); p.wait = 2 + rnd() * 3; return; } p.path = findPath(p.x, p.y, MAP.stash[0] + rnd() - .5, MAP.stash[1] + rnd() * .6); return; }
  if (p.goHoly) { if (roomAt(p.x, p.y) === 'chapel') { p.goHoly = false; takeHoly(p); p.wait = 3; return; } if (!p.holy && p.bitten) { const [tx, ty] = pointIn('chapel', .9); p.path = findPath(p.x, p.y, tx, ty); return; } p.goHoly = false; }
  if (p.plan && p.plan.spot && !p.plan.spot.searched && Math.hypot(p.x - p.plan.spot.x, p.y - p.plan.spot.y) < 1.1) { p.state = 'search'; p.st = SEARCH_T + 2; p.plan.spot.busy = p.id; face(p, p.plan.spot.x - p.x, p.plan.spot.y - p.y); return; }
  if (p.wait > 0) { p.wait -= dt; return; }
  const body = G.bodies.find(b => !b.examined[p.id] && b.clues); if (body && rnd() < .35) { if (Math.hypot(p.x - body.x, p.y - body.y) < 1.6) { body.examined[p.id] = true; if (p.role === 'infirm') { const c = body.clues.infirm; learn(p, c, 1.3); later(1 + rnd() * 2, () => { if (!p.alive) return; if (!p.claimed) p.claimed = 'Infirmarer'; const line = `I am the Infirmarer. ${c.text.replace('Reading', 'I read')}`; say(p, line); broadcast(c, p, 1, line); }); } p.wait = 2; return; } p.path = findPath(p.x, p.y, body.x + .8, body.y + .4); return; }
  // choose: evil brothers go first to traces that betray them
  p.plan = null; let spots = G.spots.filter(s => !s.searched && !G.players.some(q => q !== p && q.plan && q.plan.spot === s)); if (STRIG() && p.noOut === G.day) spots = spots.filter(s => !P.rooms[roomAt(s.x, s.y)].outside);
  if (team(p) === 'evil') { const bad = spots.filter(s => s.clue && s.clue.set.some(id => team(G.players[id]) === 'evil') && s.evil); if (bad.length && rnd() < .85) spots = bad; }
  if (spots.length && rnd() < (MAP.pois ? .85 : .55)) { const risk = s => { if (!G.town || !G.town.roam || !G.town.roam.some(d => Math.hypot(d.hx - s.x, d.hy - s.y) < d.hr + 2)) return 0; return living().some(q => q.id !== p.id && Math.hypot(q.x - s.x, q.y - s.y) < 8) ? 2 : 14; }; spots.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) + risk(a) - Math.hypot(b.x - p.x, b.y - p.y) - risk(b)); const s = spots[rnd() < .7 ? 0 : Math.min(spots.length - 1, 1)]; p.plan = { spot: s }; p.path = findPath(p.x, p.y, s.x, s.y); }
  else { const r = pick(RK), [x, y] = pointIn(r); p.path = findPath(p.x, p.y, x, y); p.wait = 4 + rnd() * 8; }
}
// ---- the woods by day: alone with someone, out past the gate and out of sight of anyone else, the Strigoi can bite (once a day, and then not that night)
function dayBiteTarget(E) { if (!STRIG() || !MAP.pois || G.phase !== 'day' || G.dayBite || !E || !E.alive || E.role !== 'enemy') return null; const out = q => P.rooms[roomAt(q.x, q.y)].outside;
  if (!out(E)) return null; const L = living().filter(q => q.id !== E.id && !q.cineAlive), near = L.filter(q => out(q) && team(q) === 'good' && !q.bitten && Math.hypot(q.x - E.x, q.y - E.y) < 1.8).sort((a, b) => Math.hypot(a.x - E.x, a.y - E.y) - Math.hypot(b.x - E.x, b.y - E.y));
  for (const v of near) { const seen = L.some(q => q.id !== v.id && Math.hypot(q.x - v.x, q.y - v.y) < 9 && sees(...cell(q.x, q.y), ...cell(v.x, v.y))); if (!seen) return v; } return null; }
function dayBite(E, v) { if (!v || G.dayBite) return; G.dayBite = { by: E.id, v: v.id, day: G.day }; v.bitten = G.night + 1; v.dayBit = true; if (isHuman(E.id)) asSeat(E.id, () => flash(`You take ${v.short} by the throat among the trees, and drink. No one saw. ${v.short} will not remember it until dawn. (No bite tonight: you have fed.)`)); }
const packN = p => Object.values(p.pack || {}).reduce((a, b) => a + b, 0), roomFor = p => MAP.carry ? Math.max(0, MAP.carry - packN(p)) : 99;
function takeFrom(p, s) { const got = {}; let room = roomFor(p); p.pack = p.pack || {}; for (const k in s.mat) { const n = Math.min(room, s.mat[k]); if (n > 0) { got[k] = n; p.pack[k] = (p.pack[k] || 0) + n; s.mat[k] -= n; room -= n; } if (!s.mat[k]) delete s.mat[k]; }
  const left = Object.keys(s.mat).length; if (left) { s.searched = false; s.by = null; } return { got, left }; }
function finishSearch(p, s) { s.busy = null; if (s.searched) return; s.searched = true; s.by = p.id; p.searchN++;
  if (isHuman(p.id)) { asSeat(p.id, () => foundCard(s)); return; }
  if (s.mat) { takeFrom(p, s); if (rnd() < .7 || !roomFor(p)) p.goStash = true; }
  const c = s.clue; if (!c) return;
  if (team(p) === 'evil') { if (c.set.some(id => team(G.players[id]) === 'evil') && s.evil) { s.taken = true; return; } later(2 + rnd() * 3, () => { if (p.alive) { say(p, `Found something: ${c.text}`); broadcast(c, p, 1, `Found something: ${c.text}`); } }); return; }
  learn(p, c, 1.3); if (rnd() < .3) { (p.held = p.held || []).push(c); return; } later(1.5 + rnd() * 3, () => { if (!p.alive) return; const line = `${pick(['Look here.', 'Brothers, listen.', 'I found this.'])} ${c.text}`; say(p, line); broadcast(c, p, 1, line); }); }
function face(p, dx, dy) { if (Math.abs(dx) + Math.abs(dy) < 1e-3) return; const a = Math.atan2(dy, dx); p.face = ((Math.round((a - Math.PI / 4) / (Math.PI / 4)) % 8) + 8) % 8; }
function step(p, dt) { if (!p.path.length) { if (p.state === 'walk') p.state = 'idle'; return; } const [tx, ty] = p.path[0], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), m = SPEED * (p.id === G.you ? 1 : .8) * dt; face(p, dx, dy); p.state = 'walk';
  if (d <= m) { p.x = tx; p.y = ty; p.path.shift(); p.dist += d; } else { p.x += dx / d * m; p.y += dy / d * m; p.dist += m; } p.room = roomAt(p.x, p.y); }

// ---------------------------------------------------------------- the hearing
function startHearing() { if (G.phase !== 'day') return;
  if (STRIG() && G.town && MAP.wastes) { const outs = living().filter(p => (p.dayOut || 0) > 12 && !p.banished); // the day's account: who went out, what each brought back
    if (outs.length) tlog('Past the gate today: ' + outs.map(p => `${p.short} (${p.dayPut ? 'put in ' + p.dayPut : 'put in nothing'})`).join(', ') + '.');
    if (hasGate()) { if (G.town.gate) tlog('Dusk, and the gate still stands open.'); for (const p of living()) if (!isHuman(p.id) && packN(p) >= 2 && homeLv(p) < HOME_MAX && (team(p) === 'evil' ? rnd() < .45 : rnd() < .12)) fortify(p, true); }
    const shut = living().filter(p => p._out && !p.banished); for (const p of shut) { p.lockedOut = true; p.path = []; } if (shut.length) tlog(`The gate shut on ${shut.map(p => p.short).join(', ')}: a night in the Wastes.`);
    for (const p of outs) if (!p.dayPut && p.dayOut > 25) for (const b of living()) if (!isHuman(b.id) && team(b) === 'good' && b.id !== p.id) b.sus[p.id] += .35; }
  G.rang = {}; G.phase = 'dusk'; G.timers = []; for (const p of G.players) { p.path = []; p.state = 'idle'; }
  for (const p of living()) if (!isHuman(p.id) && team(p) === 'good' && p.held && p.held.length) { for (const c of p.held) present(c, p); p.held = []; }
  G.hearing = { stage: 'nom', round: 1, noms: {}, acc: [], cur: -1, result: null }; botNoms(); G.ready = {}; forHumans(hideModal); showHearingAll(); }
// the Hearing: the brothers first name one man to go up (most names, at least two). Then aye or nay: he hangs if half the living say aye.
// If he is spared, one more may be named and tried. Whatever the second verdict, night falls. Never more than one hanging.
const spared = () => G.hearing.acc.map(a => a.target);
const DEFER_AT = +(QS.get('defer') || 5), houseDefers = () => humansNow().length >= DEFER_AT;
function botNoms() { const h = G.hearing, L = living(), goods = L.filter(p => !isHuman(p.id) && team(p) === 'good'), ex = spared();
  if (houseDefers()) { // the house names only the man the players lead with, and only when at least two players named him
    const t = {}; for (const id of humansNow()) { const v = h.noms[id]; if (v != null && v >= 0 && G.players[id].alive) t[v] = (t[v] || 0) + 1; } const lead = Object.entries(t).sort((a, b) => b[1] - a[1]);
    const go = lead[0] && lead[0][1] >= 2 && !(lead[1] && lead[1][1] === lead[0][1]) ? +lead[0][0] : -1; for (const b of L) if (!isHuman(b.id)) h.noms[b.id] = go; return; }
  for (const b of goods) { const t = L.filter(q => q.id !== b.id && !ex.includes(q.id)).sort((x, y) => b.sus[y.id] - b.sus[x.id])[0]; h.noms[b.id] = t && b.sus[t.id] > VOTE_T * (STRIG() ? .8 : 1) && (G.bodies.length || STRIG()) ? t.id : -1; }
  const ev = L.filter(p => !isHuman(p.id) && team(p) === 'evil'); if (ev.length) { const avg = q => goods.reduce((s2, b) => s2 + b.sus[q.id], 0) / Math.max(1, goods.length), cand = L.filter(q => team(q) === 'good' && !ex.includes(q.id)).sort((a, b) => avg(b) - avg(a))[0];
    // the Empty Habit does not know his master, so he names like a faithful brother unless the man is faithful in his own eyes
    const blind = e => e.role === 'empty';
    // the evil go with the crowd when it is against a faithful brother, otherwise push the most doubted faithful one
    const tally = nomTally(), lead = tally[0]; for (const e of ev) h.noms[e.id] = lead && (team(G.players[lead[0]]) === 'good' || (blind(e) && G.players[lead[0]].role !== 'enemy' && false)) ? +lead[0] : blind(e) && lead ? +lead[0] : cand && avg(cand) > .9 && G.bodies.length ? cand.id : -1; } }
const nomW = id => G.players[id].role === 'wether' ? 2 : 1;
function nomTally() { const t = {}; for (const [k, v] of Object.entries(G.hearing.noms)) if (v >= 0 && G.players[+k].alive) (t[v] = t[v] || []).push(+k); return Object.entries(t).map(([id, by]) => [+id, by, by.reduce((s2, q) => s2 + nomW(q), 0)]).sort((a, b) => b[2] - a[2]); }
function tallyNoms() { const h = G.hearing, t = nomTally(), top = t[0];
  if (!top || top[2] < 2 || (t[1] && t[1][2] === top[2])) { h.nomFail = top && t[1] && t[1][2] === top[2] ? 'tie' : 'few'; return finishHearing(); }
  h.nomFail = null; const by = top[1].find(id => h.noms[id] === top[0]); h.acc.push({ target: top[0], by, named: top[1], round: h.round }); h.stage = 'trial'; runVote(h.acc.length - 1); }
function resolveTrial() { const h = G.hearing, a = h.acc[h.cur], need = Math.ceil(living().length / 2); a.ayes = Object.values(a.votes || {}).filter(v => v).length;
  if (a.ayes >= need) { const vs = Object.values(a.votes || {}), nb = vs.filter(v => v === 'b').length; a.out = STRIG() && nb > vs.filter(v => v === true).length ? 'banished' : 'hanged'; return finishHearing(); } a.out = 'spared';
  if (h.round === 1) { h.round = 2; h.stage = 'nom'; h.noms = {}; h.cur = -1; botNoms(); G.ready = {}; return showHearingAll(); }
  finishHearing(); }
function botAccuse(acc) { const L = living();
  const goods = L.filter(p => !isHuman(p.id) && team(p) === 'good').sort((a, b) => maxSus(b) - maxSus(a));
  for (const b of goods) { const t = topSus(b); if (t && b.sus[t.id] > ACC_T && G.bodies.length && !acc.some(a => a.target === t.id) && acc.length < 2) acc.push({ by: b.id, target: t.id }); }
  const ev = L.filter(p => !isHuman(p.id) && team(p) === 'evil'); if (ev.length && acc.length < 2) { const avg = q => goods.reduce((s, b) => s + b.sus[q.id], 0) / Math.max(1, goods.length), cand = L.filter(q => team(q) === 'good').sort((a, b) => avg(b) - avg(a))[0]; if (cand && avg(cand) > .9 && G.bodies.length && !acc.some(a => a.target === cand.id)) acc.push({ by: pick(ev).id, target: cand.id }); } }
function botVote(b, target) { if (isHuman(b.id)) return null; if (!b.alive && !b.ghostVote) return false;
  if (team(b) === 'evil' && !(b.role === 'empty' && G.players[target].role === 'enemy')) return team(G.players[target]) === 'good' && (b.alive || rnd() < .5);
  const s = b.sus[target], mx = maxSus(b); const yes = s > VOTE_T && s >= mx * .85; if (!b.alive) return yes && s > VOTE_T + .6; return yes; }
function runVote(i) { const h = G.hearing, a = h.acc[i]; h.cur = i; a.votes = {}; if (houseDefers()) { a.deferred = true; G.ready = {}; return showHearingAll(); } for (const b of G.players) { if (isHuman(b.id)) continue; if (!b.alive && !b.ghostVote) continue; let v = botVote(b, a.target); if (v === null) continue; if (STRIG() && v === true && rnd() < .35) v = 'b'; if (!b.alive) { if (!v) continue; b.ghostVote = false; } a.votes[b.id] = v; } G.ready = {};
  // a bot Prior may pardon a brother he believes innocent
  const P = living().find(q => q.role === 'prior' && !isHuman(q.id) && !q.pardoned && q.id !== a.target); if (P && P.sus[a.target] < .8 && team(G.players[a.target]) !== 'evil' && Object.values(a.votes).filter(x => x).length >= Math.ceil(living().length / 2) - 1 && rnd() < .6) return pardon(P.id);
  showHearingAll(); }
// once every player has voted, the house votes with the players' majority (a tie among the players is a nay)
function houseFollows(i) { const h = G.hearing, a = h.acc[i]; if (!a || !a.deferred || a.houseIn) return; a.houseIn = true; const hv = humansNow().map(id => a.votes[id]).filter(v => v != null), ay = hv.filter(v => v).length, yes = ay > hv.length - ay;
  for (const b of G.players) { if (isHuman(b.id)) continue; if (b.alive) a.votes[b.id] = yes; else if (b.ghostVote && yes) { a.votes[b.id] = true; b.ghostVote = false; } } }
function pardon(pid) { const h = G.hearing, a = h.acc[h.cur], P = G.players[pid]; if (!a || a.out || P.pardoned || P.role !== 'prior' || !P.alive) return; P.pardoned = true; P.claimed = 'Prior'; a.pardon = pid;
  say(P, `I am the Prior, and I pardon ${G.players[a.target].short}. He will not hang today.`); a.ayes = Object.values(a.votes || {}).filter(v => v).length; a.out = 'spared';
  if (h.round === 1) { h.round = 2; h.stage = 'nom'; h.noms = {}; h.cur = -1; botNoms(); G.ready = {}; return showHearingAll(); } finishHearing(); }
function finishHearing() { const h = G.hearing; h.stage = 'done'; const best = h.acc.find(a => a.out === 'hanged'), ban = h.acc.find(a => a.out === 'banished'), tie = h.nomFail === 'tie';
  if (ban && !best) { const v = G.players[ban.target]; v.banished = G.day; h.result = { hanged: null, banished: v.id }; if (G.town) tlog(`${v.short} was banished beyond the gate.`); }
  else if (best) { const v = G.players[best.target]; v.alive = false; G.lastHanged = { id: v.id, by: best.by, ayes: Object.entries(best.votes).filter(([k, x]) => x).map(([k]) => +k) }; h.result = { hanged: v.id }; v.diedDay = G.day; if (team(v) === 'evil') { G.clock = Math.max(0, G.clock - 1); } if (v.role === 'penit') { G.clock = Math.max(0, G.clock - 2); h.result.penit = true; } }
  else { h.result = { hanged: null, tie }; G.noHang = true; }
  inherit(); G.ready = {}; const hv = h.result.hanged;
  if (hv != null) { const v = G.players[hv], kind = v.role === 'husk' && G.players.some(p => p.alive && p.role === 'enemy') ? 'heir' : team(v) === 'evil' ? 'evil' : 'good'; h.result.kind = kind; const N = NETH();
    if (N && N.host) N.hang(hv, kind);
    if (!G.headless && !G.demo && sceneOn() && document.visibilityState !== 'hidden') { if (N && N.host && (humansNow().length > 1 || G.screen)) { NIGHT.hang(hv, kind, () => {}); G.phase = 'dusk'; showHearingAll(); checkEnd(); return; } NIGHT.hang(hv, kind, () => { showHearingAll(); checkEnd(); }); return; }
    if (kind === 'good' && !G.headless && window.musicTaunt) musicTaunt(); }
  showHearingAll(); checkEnd(); }
// the hollow does not die with the man: if the Hollow Brother is dead and his Scrubber lives, it passes to the Scrubber
function inherit() { if (STRIG()) return; const E = G.players.find(p => p.role === 'enemy'); if (!E || E.alive) return; const S = G.players.find(p => isTurned(p) && p.alive); if (!S) return; S.turnedAs = S.role;
  E.role = 'husk'; S.role = 'enemy'; S.inherited = G.day; G.inheritNote = true;
  say(null, 'The candle gutters, but it does not go out. Something else is wearing the hollow now.', 'sys'); }
function checkEnd() { inherit(); const L = living(), ev = L.filter(p => team(p) === 'evil').length, gd = L.length - ev;
  // the town theme's threat (the music only): 1, the menace, when the evil are four in ten of the living; 2, the metal, when one more will finish it
  G.mus = STRIG() && ev ? (ev >= gd - 1 ? 2 : ev / L.length >= .4 ? 1 : 0) : 0;
  if (!ev || (STRIG() && !L.some(p => p.role === 'enemy'))) G.over = 'good'; else if (ev >= gd) G.over = 'evil'; if (G.over) { G.phase = 'over'; saveDrop(); setTimeout(() => { forHumans(showEnd); if (G.screen) { renderScreen(true); if (G.over === 'evil' && window.musicVictory) musicVictory(); if (G.over === 'good' && window.musicFaithful) musicFaithful(); } }, 300); return true; } return false; }

// ---------------------------------------------------------------- the view
const VIEW = { scale: 3, cam: [0, 0], frames: [], fi: 0, W: 720, H: 520, dep: null, zone: null, lights: [], amb: null, snow: [] };
let cv, ctx, low, lctx, img;
function lightAt(x, y) { const [sx, sy] = isoP(x, y, 20), out = !VIEW.zone[(Math.round(sy) | 0) * VIEW.W + (Math.round(sx) | 0)], a = out ? VIEW.amb.out : VIEW.amb.in, f = a.slice();
  for (const l of VIEW.lights) { const d = Math.hypot(sx - l[0], (sy - l[1]) * 1.7) / l[2]; if (d < 1) { const q = l[3] * (1 - d) * (1 - d); f[0] += q * l[6][0]; f[1] += q * l[6][1]; f[2] += q * l[6][2]; } }
  return f.map(v => Math.min(1.35, v)); }

// ---------------------------------------------------------------- fog of war
// FOG: 'off' | 'room' (see your room only) | 'sight' (line of sight) | 'mem' (sight + last-seen shades)
const FOG = ['off', 'room', 'sight', 'mem'].includes(QS.get('fog')) ? QS.get('fog') : 'mem', SIGHT = 12;
let WALLG, SG = null, VIS = new Float32Array(GW * GH).fill(1), VISK = '', CELLPX = null;
function buildWalls() { WALLG = new Uint8Array(GW * GH); SG = new Uint8Array(GW * GH); for (const [x, y] of (P.sight || [])) { const [i, j] = cell(x, y); SG[j * GW + i] = 1; }
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = (i + .5) * CS, y = (j + .5) * CS;
    for (const [x0, y0, x1, y1, ...doors] of P.walls) { if (x0 === x1) { if (Math.abs(x - x0) < .45 && y >= y0 && y <= y1 && !doors.some(d => y > d[0] + .2 && y < d[1] - .2)) WALLG[j * GW + i] = 1; } else if (Math.abs(y - y0) < .45 && x >= x0 && x <= x1 && !doors.some(d => x > d[0] + .2 && x < d[1] - .2)) WALLG[j * GW + i] = 1; } }
  // which floor cell each background pixel shows, from the depth buffer (depth = x + y, screen x gives x - y)
  CELLPX = new Int16Array(VIEW.W * VIEW.H).fill(-1);
  for (let Y = 0; Y < VIEW.H; Y++) for (let X = 0; X < VIEW.W; X++) { const d0 = VIEW.dep[Y * VIEW.W + X], xm = (X + .5 - MAP.view.ox) / 10, d = d0 < -1e8 ? (Y + .5 - MAP.view.oy) / 5 : d0, x = (d + xm) / 2, y = (d - xm) / 2; // ground has no depth: read it flat
    const i = Math.max(0, Math.min(GW - 1, Math.floor(x / CS))), j = Math.max(0, Math.min(GH - 1, Math.floor(y / CS))); CELLPX[Y * VIEW.W + X] = j * GW + i; } }
const sees = (i0, j0, i1, j1) => { const n = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0)); for (let k = 1; k < n; k++) { const i = Math.round(i0 + (i1 - i0) * k / n), j = Math.round(j0 + (j1 - j0) * k / n); if (WALLG[j * GW + i] || (SG && SG[j * GW + i])) return false; } return true; };
function updateVis() { const me = VIEW.fogFrom ? { x: VIEW.fogFrom[0], y: VIEW.fogFrom[1] } : you(); if (FOG === 'off' || G.screen || G.phase === 'over' || VIEW.fogOff) { if (VISK !== 'off') { VIS.fill(1); VISK = 'off'; } return; }
  const [ci, cj] = cell(me.x, me.y), key = ci + ',' + cj + ',' + G.phase + (VIEW.fogFrom ? 'f' : ''); if (key === VISK) return; VISK = key;
  const raw = new Float32Array(GW * GH), R = (MAP.pois && P.rooms[roomAt(me.x, me.y)].outside ? 7 : SIGHT) / CS;   // in the woods you see a little way, and not through the trees
  if (FOG === 'room') { const rm = roomAt(me.x, me.y); for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (roomAt((i + .5) * CS, (j + .5) * CS) === rm) raw[j * GW + i] = 1;
    // let the walls of your room catch the light
    const r2 = raw.slice(); for (let j = 1; j < GH - 1; j++) for (let i = 1; i < GW - 1; i++) if (WALLG[j * GW + i] || BLOCK[j * GW + i]) for (let d = -2; d <= 2; d++) for (let e = -2; e <= 2; e++) { const a = j + d, b = i + e; if (a >= 0 && b >= 0 && a < GH && b < GW && r2[a * GW + b]) raw[j * GW + i] = 1; } }
  else for (let j = Math.max(0, cj - R - 1 | 0); j <= Math.min(GH - 1, cj + R + 1 | 0); j++) for (let i = Math.max(0, ci - R - 1 | 0); i <= Math.min(GW - 1, ci + R + 1 | 0); i++) { const d = Math.hypot(i - ci, j - cj); if (d > R) continue;
    if (!sees(ci, cj, i, j)) continue; raw[j * GW + i] = Math.min(1, (R - d) / 6); }
  // soften the edge
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { let s = 0, n = 0; for (let d = -1; d <= 1; d++) for (let e = -1; e <= 1; e++) { const a = j + d, b = i + e; if (a < 0 || b < 0 || a >= GH || b >= GW) continue; s += raw[a * GW + b]; n++; } VIS[j * GW + i] = Math.max(raw[j * GW + i] * .7, s / n); } }
const inHouse = p => !!(STRIG() && P.rooms.dorm && P.rooms.dorm.rs && /^h\d+$/.test(placeAt(p.x, p.y)));
const seen = p => (!inHouse(p) || p.id === G.you || G.screen || VIEW.fogOff || G.phase === 'over' || placeAt(p.x, p.y) === placeAt(you().x, you().y)) && seenR(p), seenR = p => FOG === 'off' || G.screen || VIEW.fogOff || (p.id === G.you && !VIEW.fogFrom) || G.phase === 'over' || VIS[cell(p.x, p.y)[1] * GW + cell(p.x, p.y)[0]] > .35;
function darkenFog(D) { if (FOG === 'off' || VISK === 'off') return; const W = VIEW.W, F = .24, sc = VIEW.scale;
  // only the part of the house the camera shows
  const x0 = Math.max(0, VIEW.cam[0] - 4 | 0), y0 = Math.max(0, VIEW.cam[1] - 4 | 0), x1 = Math.min(W, x0 + cv.width / sc + 10 | 0), y1 = Math.min(VIEW.H, y0 + cv.height / sc + 10 | 0);
  for (let Y = y0; Y < y1; Y++) for (let k = Y * W + x0, e = Y * W + x1; k < e; k++) { const c = CELLPX[k]; const v = c < 0 ? 0 : VIS[c]; if (v >= 1) continue; const f = F + (1 - F) * v, o = k * 4; D[o] *= f; D[o + 1] *= f; D[o + 2] *= f; } }
// never build a sprite mid-frame: use the nearest ready one and queue the real one
function spr(o, face, pose, fr) { if (KIT.has(o, face, pose, fr)) return KIT.person(o, face, pose, fr); KIT.warm([[o, face, pose, fr]], true);
  if (pose === 'walk') for (let k = 0; k < 4; k++) if (KIT.has(o, face, 'walk', k)) return KIT.person(o, face, 'walk', k);
  if (KIT.has(o, face, 'idle', 0)) return KIT.person(o, face, 'idle', 0); for (let f = 0; f < 8; f++) if (KIT.has(o, f, 'idle', 0)) return KIT.person(o, f, 'idle', 0);
  return KIT.person(o, face, pose, fr); }
const isoP = (x, y, z = 0) => [MAP.view.ox + (x - y) * 10, MAP.view.oy + (x + y) * 5 - z];
function blit(data, s, x, y, depth, lt, alpha = 1) { const D = data.data, W = VIEW.W, [bx, by] = [Math.round(isoP(x, y)[0]) + s.ox, Math.round(isoP(x, y)[1]) + s.oy];
  for (let j = 0; j < s.h; j++) { const Y = by + j; if (Y < 0 || Y >= VIEW.H) continue; for (let i = 0; i < s.w; i++) { const q = (j * s.w + i) * 4; if (!s.data[q + 3]) continue; const X = bx + i; if (X < 0 || X >= W) continue; const k = Y * W + X; if (VIEW.dep[k] > depth) continue; const o = k * 4, sa = s.data[q + 3];
    if (sa === 254) { D[o] = s.data[q]; D[o + 1] = s.data[q + 1]; D[o + 2] = s.data[q + 2]; continue; }
    if (sa < 255) { const al = sa / 255 * alpha; D[o] += (s.data[q] * lt[0] - D[o]) * al; D[o + 1] += (s.data[q + 1] * lt[1] - D[o + 1]) * al; D[o + 2] += (s.data[q + 2] * lt[2] - D[o + 2]) * al; continue; }
    if (alpha < 1) { D[o] += (s.data[q] * lt[0] - D[o]) * alpha; D[o + 1] += (s.data[q + 1] * lt[1] - D[o + 1]) * alpha; D[o + 2] += (s.data[q + 2] * lt[2] - D[o + 2]) * alpha; } else { D[o] = s.data[q] * lt[0]; D[o + 1] = s.data[q + 1] * lt[1]; D[o + 2] = s.data[q + 2] * lt[2]; } } } }
// at night every brother but you looks alike: one dark hooded habit, one height, so no one can be told apart by who is missing (draft: ?anon=1)
const ANON = { robe: [30, 28, 34], col: [30, 28, 34], hood: 1, ht: 1, w: 1, boot: [30, 26, 24], beard: 0 };
const nightDim = p => VIEW.anon && VIEW.nightMode === 'dark' && p.id !== G.you && p.id !== VIEW.anonKeep;
function nightO(p) { if (VIEW.nightMode === 'dark') return p.o; if (!VIEW.anon || p.id === G.you || p.id === VIEW.anonKeep) return p.o; if (p._anK !== p.o) { p._anK = p.o; p._an = { ...p.o, ...ANON, prop: p._o ? 'candle' : undefined }; } return p._an; }
function frame() { if (STRIG()) roamDraw();
  const W = VIEW.W, bg = VIEW.frames[VIEW.fi]; img.data.set(bg); updateVis();
  const D = img.data, put = (x, y, c, a = 1) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= VIEW.H) return; const o = (y * W + x) * 4; D[o] += (c[0] - D[o]) * a; D[o + 1] += (c[1] - D[o + 1]) * a; D[o + 2] += (c[2] - D[o + 2]) * a; };
  // prints in the snow
  for (const [x, y, f] of G.prints) { const [sx, sy] = isoP(x, y); const pc = MAP.print; put(sx, sy, pc, .7); put(sx + 1, sy, pc.map(v => v * 1.14), .5); if (f === 'boot') put(sx, sy + 1, pc, .5); }
  // search glints
  const tt = G.t;
  if ((G.phase === 'day' || G.phase === 'dawn') && !STRIG()) for (const s of G.spots) { if (s.searched) continue; const [sx, sy] = isoP(s.x, s.y, 2), k = Math.sin(tt * 3 + s.x) * .5 + .5, c = [255, 236, 160]; put(sx, sy, c, .9); for (let r = 1; r <= 2 + Math.round(k); r++) { put(sx + r, sy, c, .7 - r * .15); put(sx - r, sy, c, .7 - r * .15); put(sx, sy + r, c, .7 - r * .15); put(sx, sy - r, c, .7 - r * .15); } }
  // ring under you
  const me = you(); if (me.alive && !VIEW.noRing) { const [sx, sy] = isoP(me.x, me.y); for (let a = 0; a < 6.28; a += .08) put(sx + Math.cos(a) * 9, sy + Math.sin(a) * 4.5, [224, 184, 90], .8); }
  if (G.sel != null && G.players[G.sel].alive && seen(G.players[G.sel])) { const p = G.players[G.sel], [sx, sy] = isoP(p.x, p.y); for (let a = 0; a < 6.28; a += .1) put(sx + Math.cos(a) * 9, sy + Math.sin(a) * 4.5, [200, 200, 220], .6); }
  // bodies and brothers, back to front
  const list = [];
  for (const b of G.bodies) if (!b.cineHide) list.push({ d: b.x + b.y, f: () => { const p = G.players[b.id]; blit(img, spr(p.o, b.face, 'die', 3), b.x, b.y, b.x + b.y + .9, lightAt(b.x, b.y)); } });
  for (const p of G.players) { if (!p.alive && p.id !== G.you && !p.cineAlive) continue; if (!p.alive && G.phase === 'over') continue; const ghost = !p.alive && !p.cineAlive; if (!seen(p)) continue; if (p.id !== G.you) p.ls = { x: p.x, y: p.y, face: p.face, t: G.t, day: G.day };
    if (p.hidden) continue; list.push({ d: p.x + p.y, f: () => { const pose = p.poseO || (p.state === 'walk' ? 'walk' : p.state === 'search' ? 'work' : 'idle'), fr = p.frO != null ? p.frO : pose === 'walk' ? Math.floor(p.dist * 2.2) % 4 : pose === 'work' ? Math.floor(tt * 3) % 2 : Math.floor(tt / 1.6 + p.id) % 2; blit(img, spr(nightO(p), p.face, pose, fr), p.x, p.y, p.x + p.y + .6, ghost ? [.7, .8, 1.1] : (VIEW.extra && VIEW.extra.length ? lightAt(p.x, p.y).map(v => v * VIEW.auraAt(p.x, p.y)) : lightAt(p.x, p.y)).map(v => nightDim(p) ? Math.min(.16, v * .14) : v), ghost ? .4 : 1); } }); }
  for (const e of (VIEW.extra || [])) if (e.dark) { const [cx, cy] = isoP(e.x, e.y, 18), R = e.dark * 10 * (e.fade == null ? 1 : .55 + .45 * Math.min(1, e.fade * 1.6)), k0 = (e.depth == null ? .82 : e.depth) * (e.fade == null ? 1 : Math.min(1, e.fade * 1.6));
    for (let Y = Math.max(0, cy - R | 0); Y < Math.min(VIEW.H, cy + R); Y++) for (let X = Math.max(0, cx - R | 0); X < Math.min(W, cx + R); X++) { const dx = (X - cx) / R, dy = (Y - cy) / (R * .75), d = dx * dx + dy * dy; if (d >= 1) continue; const f = 1 - k0 * Math.pow(1 - d, 1.4), o = (Y * W + X) * 4; D[o] *= f; D[o + 1] *= f; D[o + 2] *= f * 1.04; } }
  // the Walls: beyond the stakes it is black; the further out, the blacker
  if (VIEW.outDark) { const oy = VIEW.outDark, sc = VIEW.scale, x0 = Math.max(0, VIEW.cam[0] - 4 | 0), y0 = Math.max(0, VIEW.cam[1] - 4 | 0), x1 = Math.min(W, x0 + cv.width / sc + 10 | 0), y1 = Math.min(VIEW.H, y0 + cv.height / sc + 10 | 0);
    for (let Y = y0; Y < y1; Y++) for (let k = Y * W + x0, e = Y * W + x1; k < e; k++) { const c = CELLPX[k], cy = c < 0 ? oy + 9 : (c / GW | 0) * CS; if (cy <= oy) continue; const f = Math.max(.07, .55 - (cy - oy) * .22), o = k * 4; D[o] *= f; D[o + 1] *= f; D[o + 2] *= f; } }
  VIEW.auraAt = (x, y) => { let f = 1; for (const e of (VIEW.extra || [])) if (e.dark) { const d = Math.hypot(x - e.x, y - e.y) / (e.dark * .55); if (d < 1) f *= 1 - .75 * (1 - d) * (1 - d); } return f; };
  for (const e of (VIEW.extra || [])) list.push({ d: e.x + e.y, f: () => (e.fade != null && e.fade < 1) ? blitFade(img, e.s, e.x, e.y, e.x + e.y + .6, e.lt || lightAt(e.x, e.y), e.fade) : blit(img, e.s, e.x, e.y, e.x + e.y + .6, e.lt || lightAt(e.x, e.y), e.a == null ? 1 : e.a) });
  list.sort((a, b) => a.d - b.d).forEach(o => o.f());
  darkenFog(D);
  // last-seen shades: where you last laid eyes on each brother, fading
  if (FOG === 'mem' && G.phase === 'day') for (const p of G.players) { if (!p.alive || p.id === G.you || seen(p) || !p.ls || p.ls.day !== G.day) continue; const age = G.t - p.ls.t, a = .42 * Math.max(0, 1 - age / 45); if (a <= .02) continue;
    if (VIS[cell(p.ls.x, p.ls.y)[1] * GW + cell(p.ls.x, p.ls.y)[0]] > .5) { p.ls.day = -1; continue; } // you can see the spot now and he is gone
    blit(img, spr(p.o, p.ls.face, 'idle', 0), p.ls.x, p.ls.y, p.ls.x + p.ls.y + .6, [.55, .6, .85], a); }
  lctx.putImageData(img, 0, 0);
  // camera on you
  const sc = VIEW.scale, vw = cv.width / sc, vh = cv.height / sc, [mx, my] = isoP(VIEW.camT ? VIEW.camT[0] : me.x, VIEW.camT ? VIEW.camT[1] : me.y, 26); VIEW.cam[0] += ((mx - vw / 2) - VIEW.cam[0]) * .12; VIEW.cam[1] += ((my - vh / 2) - VIEW.cam[1]) * .12;
  VIEW.cam[0] = Math.max(0, Math.min(VIEW.W - vw, VIEW.cam[0])); VIEW.cam[1] = Math.max(0, Math.min(VIEW.H - vh, VIEW.cam[1]));
  const cx = Math.round(VIEW.cam[0] * sc) / sc, cy = Math.round(VIEW.cam[1] * sc) / sc; VIEW.cx = cx; VIEW.cy = cy;
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(low, cx, cy, vw, vh, 0, 0, vw * sc, vh * sc);
  // falling snow, outdoors only
  const ash = MAP.weather === 'ash'; for (const f of VIEW.snow) { if (ash) { f.y += f.v * .016 * 7; f.x += .05 + Math.sin(tt * .5 + f.p) * .18; if (f.x > VIEW.W) f.x = 0; } else { f.y += f.v * .016 * 22; f.x += Math.sin(tt * .8 + f.p) * .1; } if (f.y > VIEW.H) { f.y = -4; f.x = Math.random() * VIEW.W; } const X = f.x | 0, Y = f.y | 0; if (X < 0 || X >= VIEW.W || Y < 0 || Y >= VIEW.H || VIEW.zone[Y * VIEW.W + X]) continue; const sx = (f.x - cx) * sc, sy = (f.y - cy) * sc; if (sx < 0 || sy < 0 || sx > cv.width || sy > cv.height) continue; ctx.fillStyle = ash ? (f.p > 5.2 ? `rgba(255,150,70,${f.a})` : `rgba(150,146,138,${f.a * .8})`) : `rgba(220,228,246,${f.a})`; ctx.fillRect(Math.round(sx / sc) * sc, Math.round(sy / sc) * sc, sc, sc); }
  // names over brothers near you or selected
  ctx.font = `${Math.max(12, sc * 5)}px "Pixelify Sans"`; ctx.textAlign = 'center';
  for (const p of G.players) { if (VIEW.cine || !p.alive || !seen(p)) continue; const near = G.screen || Math.hypot(p.x - me.x, p.y - me.y) < 6 || p.id === G.sel; if (!near || p.id === G.you) continue; const [sx, sy] = isoP(p.x, p.y, 60); const X = (sx - cx) * sc, Y = (sy - cy) * sc; ctx.fillStyle = 'rgba(10,8,8,.7)'; const w = ctx.measureText(p.short).width + 10; ctx.fillRect(X - w / 2, Y - sc * 4, w, sc * 6); ctx.fillStyle = p.col; ctx.fillRect(X - w / 2, Y + sc * 2 - 2, w, 2); ctx.fillStyle = '#ece2c8'; ctx.fillText(p.short, X, Y + sc); if (p.state === 'search') { ctx.fillStyle = '#e0b85a'; ctx.fillText('searching…', X, Y - sc * 6); } }
  // room names, faint
  ctx.font = `${Math.max(14, sc * 6)}px "Jacquard 24"`;
  for (const k of (VIEW.cine ? [] : RK)) RRS(k).forEach((r, i) => { const rs = P.rooms[k].rs, own = rs && G.players[i]; if (rs && (k !== 'dorm' || !own || i >= G.players.length)) return; const [sx, sy] = isoP((r[0] + r[2]) / 2, (r[1] + r[3]) / 2); const X = (sx - cx) * sc, Y = (sy - cy) * sc; if (X < -100 || Y < -40 || X > cv.width + 100 || Y > cv.height + 40) return; ctx.fillStyle = 'rgba(236,226,200,.22)'; ctx.fillText(rs ? own.short + (homeLv(own) ? ' ' + '▮'.repeat(homeLv(own)) : '') : P.rooms[k].name, X, Y); }); if (!VIEW.cine && hasGate()) { const g = GATEC(), [sx, sy] = isoP(g[0], g[1] - .6), X = (sx - cx) * sc, Y = (sy - cy) * sc; ctx.fillStyle = G.town.gate ? 'rgba(236,226,200,.4)' : 'rgba(224,90,74,.75)'; ctx.fillText(G.town.gate ? 'the gate · open' : 'the gate · shut', X, Y); } if (!VIEW.cine && MAP.pois) for (const q of MAP.pois) { const [sx, sy] = isoP(q.x, q.y), X = (sx - cx) * sc, Y = (sy - cy) * sc; if (X < -100 || Y < -40 || X > cv.width + 100 || Y > cv.height + 40) continue; ctx.fillStyle = 'rgba(200,214,180,.2)'; ctx.fillText(q.name, X, Y); }
  VIEW.cx = cx; VIEW.cy = cy;
}

// ---------------------------------------------------------------- input
function screenToWorld(px, py) { const X = VIEW.cx + px / VIEW.scale, Y = VIEW.cy + py / VIEW.scale, dx = X - MAP.view.ox, dy = Y - MAP.view.oy; return [(dx / 10 + dy / 5) / 2, (dy / 5 - dx / 10) / 2]; }
function pickBrother(px, py) { const X = VIEW.cx + px / VIEW.scale, Y = VIEW.cy + py / VIEW.scale; let best = null; for (const p of G.players) { if (!p.alive || p.id === G.you || !seen(p)) continue; const [sx, sy] = isoP(p.x, p.y); if (Math.abs(X - sx) < 7 && Y < sy + 2 && Y > sy - 56) { if (!best || p.x + p.y > best.x + best.y) best = p; } } return best; }
function onClick(e) { if (G.phase !== 'day' || G.screen) return; const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; const b = pickBrother(px, py); if (b) { selectBrother(b.id); return; }
  const me = you(); if (me.state === 'search') return; const [x, y] = screenToWorld(px, py); if (NETH() && NETH().guest) return act({ walk: x.toFixed(2) + ',' + y.toFixed(2) }); me.kdir = null; me.path = findPath(me.x, me.y, x, y); }
const keyDir = () => { let dx = 0, dy = 0; if (KEYS.w || KEYS.arrowup) { dx -= 1; dy -= 1; } if (KEYS.s || KEYS.arrowdown) { dx += 1; dy += 1; } if (KEYS.a || KEYS.arrowleft) { dx -= 1; dy += 1; } if (KEYS.d || KEYS.arrowright) { dx += 1; dy -= 1; } return [dx, dy]; };
function keyMove(dt, me = you(), dir = keyDir()) { if (G.phase !== 'day' || me.state === 'search') return; let [dx, dy] = dir; if (!dx && !dy) return; me.path = []; const n = Math.hypot(dx, dy), m = SPEED * dt, nx = me.x + dx / n * m, ny = me.y + dy / n * m; face(me, dx, dy); me.state = 'walk'; me.walkKey = true; if (free(...cell(nx, ny))) { me.x = nx; me.y = ny; me.dist += m; } else if (free(...cell(nx, me.y))) { me.x = nx; me.dist += m; } else if (free(...cell(me.x, ny))) { me.y = ny; me.dist += m; } me.room = roomAt(me.x, me.y); }
const KEYS = {};

// ---------------------------------------------------------------- your actions
const nearSpot = () => { const me = you(); if (STRIG()) { const r = roomAt(me.x, me.y); if (MAP.carry && !roomFor(me)) return null; return G.spots.filter(s => !s.searched && !s.busy && s.room === r && (!MAP.pois || r !== 'fields' || Math.hypot(s.x - me.x, s.y - me.y) < 3)).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; } return G.spots.filter(s => !s.searched && !s.busy).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y)).find(s => Math.hypot(s.x - me.x, s.y - me.y) < 1.3); };
const nearBody = () => { const me = you(); return G.bodies.find(b => Math.hypot(b.x - me.x, b.y - me.y) < 1.6 && !b.examined[G.you]); };
function doSearch() { const me = you(), s = nearSpot(); if (!s || !me.alive) return; me.path = []; me.state = 'search'; me.st = SEARCH_T; me.spot = s; s.busy = me.id; face(me, s.x - me.x, s.y - me.y); }
function doExamine() { const b = nearBody(); if (!b || !you().alive) return; b.examined[G.you] = true; addCase(b.clues.all); if (you().role === 'infirm') addCase(b.clues.infirm); flash(`You kneel by ${G.players[b.id].short}.`); renderActs(); }
// a faithful brother who finds something real hears a small chime: the rising fourth of the faithful's theme, on its cloister chimes
function sfx(k) { if (remote()) return NETH() && NETH().toSeat(G.you, { t: 'sfx', k }); if (k === 'chime' && window.sfxChime) sfxChime(); }
function foundCard(s) { const c = s.clue; if (!c && s.mat) { const me = you(), all = matStr(s.mat), { got, left } = takeFrom(me, s); flash(left ? `You find ${all}, and can carry only ${matStr(got) || 'nothing more'}. The rest stays here. Carry it to the stash at the workshop.` : `You find ${all}. Carry it to the stash at the workshop.`); renderActs(); renderCase(); return; } if (!c) { flash(pick(EMPTY)); return; } addCase({ ...c, found: true }); modal(`<div class="hd"><span class="cap">F</span>ound</div><p class="big">${c.text}</p>${toLine(c.set)}<p class="sub">${team(you()) === 'evil' && c.set.includes(G.you) ? 'It points at you. No one else has seen it.' : 'Only you know this.'}</p>${team(you()) === 'good' ? `<p class="sub"><b>Tell the table</b> and everyone learns it, but so does he: you are marked, and the evil have the day to answer it. <b>Whisper</b> it to one brother. Or <b>keep it</b> and lay it before the Hearing, where it counts double.</p>` : ''}<div class="row wrap"><span class="btn ${team(you()) === 'evil' && c.set.includes(G.you) ? '' : 'go'}" data-share="${c.id}">Tell the table</span>${team(you()) === 'good' ? `<span class="btn" data-wlist="${c.id}">Whisper…</span>` : ''}<span class="btn ${team(you()) === 'evil' && c.set.includes(G.you) ? 'go' : ''}" data-close>${team(you()) === 'evil' ? 'Bury it' : 'Keep it for the Hearing'}</span></div>`, 'found'); }

// ---------------------------------------------------------------- what you do with what you know
// Tell the table: everyone learns it, but he hears it too. You are marked, and in daylight the evil have the rest of the day to answer it.
// Whisper: one brother learns it, and may lay it before the Hearing himself. If he is evil, he knows what you know.
// Keep it: lay it before the Hearing, where it counts double and there is no time to answer.
const REBUT = ['Convenient, that {n} found it and no one else.', 'Half this house wears that. It proves nothing.', 'I saw {n} near that spot before Prime. Ask him why.', 'Snow drifts. Thread tears. We are hanging men on rags now?'];
function answer(c, from) { if (!c.set || !c.set.some(id => team(G.players[id]) === 'evil')) return;
  const ev = living().filter(p => team(p) === 'evil' && !isHuman(p.id)), S = living().find(p => p.role === 'scrub');
  later(5 + rnd() * 7, () => { if (G.phase !== 'day' || !ev.length) return; const e = pick(ev); if (!e.alive) return; say(e, pick(REBUT).replace('{n}', from.short));
    for (const b of living()) if (team(b) === 'good' && b.id !== from.id && !isHuman(b.id)) b.sus[from.id] += .15 * (b.trust[e.id] || 1);
    if (S && S.alive) { const sp = G.spots.filter(q => q.evil && !q.searched && !q.taken); if (sp.length) { const q = pick(sp); q.taken = true; q.searched = true; } } }); }
function present(c, by) { const line = `Before the brothers I lay this: ${c.text.replace(/^You /, 'I ')}`; say(by, line); by.heard = (by.heard || 0) + .6;
  for (const b of living()) if (b.id !== by.id && !isHuman(b.id)) learn(b, c, 2 * (b.trust[by.id] || 1));
  const said = { ...c, id: ++CID, kind: c.kind === 'info' ? 'said' : c.kind, said: by.id, text: line, src: 'said' }; forHumans(() => { if (G.you !== by.id) addCase({ ...said }); }); }
function presentClue(id) { const c = G.clues.find(q => q.id === id); if (!c || c.shared) return; c.shared = c.presented = true; if (c.kind === 'info') you().claimed = ROLES[you().role].name; present(c, you());
  const h = G.hearing; if (h && h.stage === 'nom') botNoms(); renderCase(); showHearingAll(); }
function whisper(id, to) { const c = G.clues.find(q => q.id === id), t = G.players[to]; if (!c || !t) return; c.whispered = to; c.shared = true;
  if (team(t) === 'evil') { you().heard = (you().heard || 0) + 2; const S = living().find(p => p.role === 'scrub'); if (S && c.set && c.set.some(q => team(G.players[q]) === 'evil')) { const sp = G.spots.filter(q => q.evil && !q.searched); if (sp.length) { const q = pick(sp); q.taken = q.searched = true; } } }
  else if (isHuman(t.id)) asSeat(t.id, () => { addCase({ ...c, id: ++CID, src: 'said', said: G.players.length && c._from != null ? c._from : null, text: `Whispered to you: ${c.text}` }); flash('A brother whispers something to you.'); }); else { learn(t, c, 1.4 * (t.trust[G.you] || 1)); (t.held = t.held || []).push(c); }
  addCase(clue('alibi', `You told ${t.short}, quietly: ${c.text.replace(/^You /, 'you ')}`, [], { src: 'said', said: G.you })); flash(`You tell ${t.short}. No one else heard.`); renderCase(); }
function shareClue(id) { const c = G.clues.find(q => q.id === id); if (!c || c.shared) return; c.shared = true; G.youShared = (G.youShared || 0) + 1; flash('Said aloud. He is listening.'); say(you(), c.kind === 'info' ? `I am the ${ROLES[you().role].name}. ${c.text.replace(/^You /, 'I ')}` : c.text); if (c.kind === 'info') you().claimed = ROLES[you().role].name; broadcast(c, you()); renderCase(); }
function askAlibi(id) { const p = G.players[id]; p.askedBy = p.askedBy || {}; if (p.askedBy[G.you] === G.day) return; p.askedBy[G.you] = G.day; if (isHuman(p.id)) { say(you(), `${p.short}, where did you sleep last night?`); return; } say(you(), `${p.short}, where did you sleep last night?`); const asker = G.you;
  later(1.2, () => { let r = p.night; if (team(p) === 'evil') r = 'dorm'; say(p, r === 'dorm' ? pick(['In my cot, like a Christian.', 'Dormitory. Ask anyone.', 'In the dormitory. Where else?']) : pick([`I kept vigil in the ${RN(r)}.`, `In the ${RN(r)}. I could not sleep.`])); asSeat(asker, () => addCase(clue('alibi', `${p.short} says he spent the night in the ${RN(r)}.`, [], { src: 'said', said: p.id }))); }); }

// ---------------------------------------------------------------- UI
const icon = (k, s = 2) => k === 'none' ? '' : `<canvas class="ic" data-i="${k}" data-s="${s}"></canvas>`;
const chips = set => set && set.length ? set.map(id => `<i class="chip" style="background:${G.players[id].col}" title="${G.players[id].short}"></i>`).join('') : '<span class="sub">no one in particular</span>';
function drawIcons(root) { root.querySelectorAll('canvas.ic:not([data-done])').forEach(c => { ic(c); c.dataset.done = 1; }); }
// the brethren: each brother's head as a doll (as the Lords table shows its lords), his name in blackletter, his traits as 16px icons, your mark as a wax seal
const DOLL = {};
function doll(p) { const k = p.id + JSON.stringify(p.o); if (DOLL[k]) return DOLL[k]; if (!KIT.has({ ...p.o, big: 3 }, 0, 'idle', 0) && !doll.q) { doll.q = 1; setTimeout(() => { doll.q = 0; renderBrothers(); }, 60); }
  const s = KIT.person({ ...p.o, big: 3 }, 0, 'idle', 0), c = document.createElement('canvas'); c.width = s.w; c.height = 44; c.getContext('2d').drawImage(s.canvas, 0, 0); return DOLL[k] = c.toDataURL(); }
const IC = (k, t) => `<img class="ic16" src="${window.IC16[k]}" alt="" title="${t}">`;
const SEAL = { '✓': ['T', 'trs', 'You trust him'], '?': ['D', 'dbt', 'You doubt him'], '✗': ['A', 'acc', 'You accuse him'] };
function renderBrothers() { if (remote()) return; const h = G.players.map(p => { const me = p.id === G.you;
    const tr = IC('habit_' + p.habit, `${p.habit} habit: matches threads torn on doorframes`) + IC(p.foot === 'boot' ? 'boot' : 'sandal', `${p.foot === 'boot' ? 'Boots' : 'Sandals'}: matches prints in the snow`) + IC(p.item, p.item === 'none' ? 'Carries nothing' : `Carries a ${p.item}: matches wax, soot and the like`);
    const sub = p.banished && p.alive ? `<span style="color:#e05a4a">banished</span> · ${p.habit} habit` : me ? `you · ${ROLES[p.role].name}` : p.alive ? `${p.habit} habit · ${p.tall ? 'tall' : 'short'}` : (G.bodies.some(b => b.id === p.id) ? `found in the ${RN(G.bodies.find(b => b.id === p.id).room)}` : 'hanged');
    const heard = p.alive && p.heard >= 1 ? ` · <span style="color:#d06048" title="Has spoken evidence aloud. The Hollow Brother hunts those he has heard.">heard${p.heard >= 3 ? ' ×' + Math.floor(p.heard) : ''}</span>` : '';
    const sl = p.alive && SEAL[p.mark] ? `<i class="mi ${SEAL[p.mark][1]}" title="${SEAL[p.mark][2]}">${SEAL[p.mark][0]}</i>` : '';
    const wsp = canWhisper(G.you, p.id) ? `<span class="wsp" data-wsp="${p.id}" title="Whisper to ${p.short}"><svg width="14" height="12" viewBox="0 0 14 12"><path d="M1 1h12v7H6l-3 3V8H1z" fill="none" stroke="#f4d692" stroke-width="1.4" stroke-linejoin="round"/></svg>${CW.unread[p.id] ? '<i class="udot"></i>' : ''}</span>` : '';
    return `<div class="s ${me ? 'you' : ''} ${p.alive ? '' : 'dead'} ${G.sel === p.id ? 'sel' : ''}" data-b="${p.id}"><div class="doll" style="--c:${p.o.col.join(',')}"><img src="${doll(p)}" alt=""></div><b><span class="nm"><span style="color:${p.col}">${p.short[0]}</span>${p.short.slice(1)}</span>${G.names[p.id] && !p.named ? ` <span class="pn">${G.names[p.id]}</span>` : ''}${G.away[p.id] ? ' <span class="pn" style="opacity:.6">away</span>' : ''}<small>${sub}${heard}</small></b><span class="tr">${wsp}${tr}</span><span class="mk" title="${p.alive ? 'Your mark: click the brother to trust, doubt or accuse' : 'Dead'}">${sl}</span></div>`; }).join('');
  $('bro').innerHTML = `<div class="hd">The Brethren</div><div class="leg">habit · feet · carries · mark</div>${h}`; }
// the Scribe reads one brother's casebook a day: one thing he found and kept to himself
function scribeRead(tid) { const me = you(), t = G.players[tid]; if (me.role !== 'scribe' || !me.alive || me.scribeDay === G.day || !t || tid === G.you) return; me.scribeDay = G.day;
  const kept = isHuman(tid) ? (G.cases[tid] || []).filter(c => c.found && !c.shared && c.src !== 'scribe') : (t.held || []); const c = kept.length ? pick(kept) : null;
  if (!c) { flash(`${t.short} keeps nothing back that you can read.`); addCase(clue('info', `You read ${t.short}'s casebook. He keeps nothing back.`, [], { src: 'scribe' })); }
  else { addCase(clue(c.kind === 'info' ? 'info' : c.kind, `From ${t.short}'s casebook: ${c.text}`, c.set || [], { src: 'scribe', found: true })); flash(`You read ${t.short}'s casebook.`); }
  renderCase(); if ($('pop').style.display === 'block') selectBrother(tid); }
function selectBrother(id) { if (G.screen) return; G.sel = id; renderBrothers(); const p = G.players[id]; const pop = $('pop'); pop.innerHTML = `<div class="hd" style="font-size:24px">${p.name}</div><p class="sub">${p.habit} habit · ${p.tall ? 'tall' : 'short'} · ${p.foot === 'boot' ? 'boots' : 'sandals'} · ${p.item === 'none' ? 'carries nothing' : 'carries a ' + p.item}${p.claimed ? ` · claims to be the ${p.claimed}` : ''}</p>
  <div class="row">${p.alive && id !== G.you && G.phase === 'day' ? `<span class="btn" data-ask="${id}">Where did you sleep?</span>` : ''}${canWhisper(G.you, id) ? `<span class="btn" data-wsp="${id}">Whisper to him</span>` : ''}${you().role === 'scribe' && you().alive && p.alive && id !== G.you && G.phase === 'day' ? `<span class="btn ${you().scribeDay === G.day ? 'off' : ''}" ${you().scribeDay === G.day ? '' : `data-scribe="${id}"`}>${you().scribeDay === G.day ? 'Read today already' : 'Read his casebook'}</span>` : ''}</div>${id !== G.you ? `<div class="gm gB">${[['✓', 'T', 'rust', 'trs', 'You hold him blameless'], ['?', 'D', 'oubt', 'dbt', 'Something about him is wrong'], ['✗', 'A', 'ccuse', 'acc', 'You believe he is the Hollow Brother']].map(([m, i, r, c, t]) => `<span class="g ${c} ${p.mark === m ? 'on' : ''}" data-mark="${id}" data-m="${m}" title="${t}"><i>${i}</i><span>${r}</span></span>`).join('')}</div>${p.mark ? `<div class="gx" data-mark="${id}" data-m="">clear the mark</div>` : ''}` : ''}`; pop.style.display = 'block'; }
const CASE = { tab: 'log' };
function renderCase() { if (remote()) return; if (STRIG() && G.town) return renderLog(); const h = G.clues.map(c => `<div class="clue ${c.src === 'said' ? 'said' : ''} ${c.found && !c.shared ? 'new' : ''}">${icon(ICON[c.kind] || 'eye')}<div><p>${c.said != null ? `<b style="color:${G.players[c.said].col}">${G.players[c.said].short}:</b> ` : ''}${c.text}</p>${c.set && c.set.length ? `${toLine(c.set)}` : ''}${(c.found || c.kind === 'info' || (c.kind === 'body' && c.set.length)) && !c.shared && c.said == null ? `<span class="mini" data-share="${c.id}">share</span>` : c.shared ? '<span class="sub">shared</span>' : ''}</div></div>`).join('');
  $('case').innerHTML = `<div class="hd"><span class="cap">C</span>asebook</div><div class="scroll">${h || '<p class="sub">Nothing yet. Search the glinting places.</p>'}</div>`; drawIcons($('case')); const sc = $('case').querySelector('.scroll'); if (sc) sc.scrollTop = 1e9; }
// the town keeps no casebook: its side panel is the stash. On top, what is in it, what you carry, what can be built; below, the log,
// the public record (who put in, who took, who built, who went out of the gate, what came at night) with your own notes in among it
function renderLog() { const T = G.town, me = you(), near = nearStash(me) && me.alive && G.phase === 'day', ico = { timber: '▤', nails: '⟂', rope: '§', pitch: '●' }, tn = (G.night || 0) + (G.phase === 'night' ? 0 : 1);
  const gap = hordeSize(tn) - townDef(), top = `<p class="sw">Walls <b>${townDef()}</b> · the dead tonight about <b>${hordeSize(tn)}</b> · ${gap > 0 ? `<b style="color:#e07050">short by ${gap}</b>` : `holding by ${-gap}`}${near ? '' : ' · <i>at the workshop in the square</i>'}</p>
    <div class="row wrap chips">${Object.entries(T.stash).map(([k, v]) => `<span class="btn small ${near && v ? '' : 'off'}" ${near && v ? `data-stash="take:${k}"` : ''} title="${near ? 'Take one (the log says something was taken; your name only if someone here sees)' : ''}">${ico[k]} ${v} ${k}</span>`).join('')}</div>
    <div class="row wrap"><span class="btn small ${near && matStr(me.pack) ? 'go' : 'off'}" ${near ? 'data-stash="dep"' : ''}>${matStr(me.pack) ? 'Put in ' + matStr(me.pack) : 'You carry nothing'}</span><span class="btn small ${near && T.stash.timber && T.stash.rope && me.barred !== (G.night || 0) + 1 ? '' : 'off'}" ${near ? 'data-stash="bar"' : ''} title="1 timber and 1 rope. A sent Thrall cannot get in tonight; the Strigoi's bite still can.">${me.barred === (G.night || 0) + 1 ? 'Door barred tonight' : 'Bar my door'}</span></div>
    <div class="bgrid">${Object.entries(BUILDS).map(([k, b]) => `<span class="btn small ${near && canBuild(k) ? 'go' : 'off'}" ${near ? `data-stash="build:${k}"` : ''} title="${b.name}: ${matStr(b.cost)}, +${b.def}${b.tonight ? ' tonight' : ''}">${b.name.replace(' (tonight only)', '')}${b.once && T.built[k] ? ' ✓' : ''}<small>${matStr(b.cost)} · +${b.def}</small></span>`).join('')}</div>`;
  const feed = T.log.map(l => ({ q: l.q || 0, h: `<p class="tl"><small>${l.nt ? 'Night ' + l.nt : 'Day ' + l.d}</small> ${l.t}</p>` }))
    .concat(G.clues.map(c => ({ q: c.q || 0, h: `<div class="clue mine ${c.src === 'said' ? 'said' : ''}">${icon(ICON[c.kind] || 'eye')}<div><p>${c.said != null ? `<b style="color:${G.players[c.said].col}">${G.players[c.said].short}:</b> ` : '<small class="yours">yours</small> '}${c.text}</p>${c.set && c.set.length ? `${toLine(c.set)}` : ''}${(c.kind === 'info' || (c.kind === 'body' && c.set.length)) && !c.shared && c.said == null ? `<span class="mini" data-share="${c.id}">tell the table</span>` : c.shared ? '<span class="sub">told</span>' : ''}</div></div>` })))
    .sort((a, b) => a.q - b.q).map(x => x.h).join('');
  const sc0 = $('case').querySelector('.scroll'), atEnd = !sc0 || sc0.scrollTop + sc0.clientHeight >= sc0.scrollHeight - 30;
  $('case').innerHTML = `<div class="hd"><span class="cap">T</span>he Stash</div>${top}<div class="lhd">The Log</div><div class="scroll">${feed || '<p class="sub">Nothing written yet. Whatever goes into or out of the stash, and whoever goes out of the gate, is written here for all to read. What your gift tells you is written here too, for you alone.</p>'}</div>`;
  drawIcons($('case')); const sc = $('case').querySelector('.scroll'); if (sc && atEnd) sc.scrollTop = 1e9; else if (sc && sc0) sc.scrollTop = sc0.scrollTop; }
// whispers: private talk between two players, carried by the host only to the two of them (never to bots, never part of the evidence)
const CW = { tab: 'all', tabs: [], unread: {}, seen: 0 };
function canWhisper(a, b) { const A = G.players[a], B = G.players[b]; return !!(A && B) && a !== b && G.humans.length > 1 && G.humans.includes(a) && G.humans.includes(b) && A.alive && B.alive && !G.demo && !(A.role === 'enemy' && B.role === 'empty'); }
// the Hollow may not whisper his Empty Habit: the Empty Habit is not to learn who turned him. The Empty Habit may still whisper
// anyone (the Hollow included, so no button is missing on his side), but the Hollow cannot answer that thread.
const myW = () => (G.wchat || []).filter(m => m.from === G.you || m.to === G.you);
function renderChat() { if (remote()) return; const me = G.you, W = myW(); if (W.length < CW.seen) Object.assign(CW, { tab: 'all', tabs: [], unread: {}, seen: 0 });
  let ping = false; W.slice(CW.seen).forEach(m => { const o = m.from === me ? m.to : m.from; if (!CW.tabs.includes(o)) CW.tabs.push(o); if (m.from !== me && CW.tab !== o) { CW.unread[o] = 1; ping = true; } }); CW.seen = W.length;
  if (ping) { const m = W[W.length - 1]; flash(`${G.players[m.from].short} whispers to you.`); setTimeout(renderBrothers); }
  const tb = $('chattabs'); if (tb) tb.innerHTML = CW.tabs.length ? [['all', 'Table'], ...CW.tabs.map(k => [k, G.players[k].short])].map(([k, t]) => `<span class="ct ${CW.tab === k ? 'on' : ''}" data-ct="${k}">${k === 'all' ? t : `<i class="chip" style="background:${G.players[k].col}"></i>${t}`}${CW.unread[k] && CW.tab !== k ? '<i class="udot"></i>' : ''}</span>`).join('') : '';
  const el = $('chatlog'), inp = $('chat').querySelector('input'); const dead = !you().alive && G.phase !== 'over'; if (inp) { inp.disabled = dead; if (dead) { inp.value = ''; if (CW.tab !== 'all') CW.tab = 'all'; } }
  if (CW.tab === 'all') { el.innerHTML = G.chat.slice(-40).map(m => m.who == null ? `<p class="sys">${m.text}</p>` : `<p><b style="color:${G.players[m.who].col}">${G.players[m.who].short}:</b> ${m.text}</p>`).join(''); if (inp) inp.placeholder = dead ? 'The dead do not speak.' : 'Speak to the table, Enter to send'; }
  else { const o = CW.tab, P = G.players[o]; el.innerHTML = `<p class="sys">Only you and ${P.short} see this. Nobody is told you whisper.</p>` + W.filter(m => m.from === o || m.to === o).slice(-40).map(m => `<p class="wh"><b style="color:${m.from === me ? '#e8d8b0' : P.col}">${m.from === me ? 'You' : P.short}:</b> ${m.text}</p>`).join(''); if (inp) { const can = canWhisper(me, o); inp.disabled = !can; inp.placeholder = can ? `Whisper to ${P.short}…` : `You cannot answer ${P.short}: your Empty Habit must not learn who you are.`; } }
  el.scrollTop = 1e9; const said = G.chat.length + W.length; if (said > TB.seen && TB.hid) { TB.unread = true; renderActs(); } TB.seen = said; }
function openWhisper(k) { if (document.body.classList.contains('pad')) padTab('table'); if (TB.hid) tableToggle(); k = k === 'all' ? 'all' : +k; if (k !== 'all' && !CW.tabs.includes(k)) CW.tabs.push(k); CW.tab = k; delete CW.unread[k]; renderChat(); renderBrothers(); const i = $('chat').querySelector('input'); if (i) i.focus(); }
document.addEventListener('click', e => { const tb = e.target.closest('[data-tbl],[data-allroles]'); if (tb) { e.stopPropagation(); if (tb.dataset.tbl) tableToggle(); else showRoles(); return; } const w = e.target.closest('[data-wsp],[data-ct]'); if (!w) return; e.stopPropagation(); openWhisper(w.dataset.wsp != null ? w.dataset.wsp : w.dataset.ct); }, true);
function renderRole() { if (remote()) return; const me = you(), R = ROLES[me.role]; const ev = team(me) === 'evil', mate = ev && me.role !== 'empty' ? G.players.find(p => p.id !== me.id && team(p) === 'evil' && p.role !== 'husk') : null; $('role').innerHTML = `<div class="k" style="${ev ? 'color:#e05a4a' : ''}">${ev ? 'EVIL' : 'FAITHFUL'}${me.alive ? '' : ' · DEAD'}</div><span class="drop">${R.name[0]}</span><div class="t">${R.name.slice(1)}</div><p>${R.text}</p>${mate ? `<p class="sub">Your ${ROLES[mate.role].name}: <b style="color:${mate.col}">${mate.short}</b>. Bluff as the <b>${me.bluff}</b>.</p>` : ''}${me.claimed ? `<p class="sub">You have claimed ${ev ? 'to be the ' + me.claimed : 'your gift openly'}.</p>` : ''}<span class="allr" data-allroles="1" title="Every role in the house (R)">All roles</span>`; }
function renderClock() { if (remote()) return; $('clockv').dataset.v = G.clock; clockCandle($('clockv'), G.clock, 8); const n = G.clock; $('clocknote').innerHTML = n >= 8 ? 'The candle has guttered. <b>He takes two every night.</b>' : n >= 7 ? `Notch ${n} of 8. <b>He hungers every night now.</b> At 8, twice a night.` : n >= 4 ? `Notch ${n} of 8. <b>He leaves no prints in the snow.</b> At 7 he hungers every night; at 8, twice.` : `Notch ${n} of 8. He hungers every second night. A notch each night, two if no one hangs; one back when evil hangs. At 4 he leaves no prints; at 7 he hungers every night.`;
  if (STRIG() && G.town) $('clocknote').innerHTML = `Toll ${G.clock} of 8. A toll each night, two if no one is hanged or banished; one back when one of his is hanged. At the last toll he bites and sends in the same night.` + `<br><b>Walls ${townDef()}</b> · the dead tonight: about ${hordeSize((G.night || 0) + (G.phase === 'night' || G.phase === 'day' || G.phase === 'dusk' || G.phase === 'dawn' ? 1 : 0))}${G.town.last ? ` · last night ${G.town.last.n}` : ''}.`; }
function renderTop() { if (remote()) return; const ph = { dawn: 0, day: 1, dusk: 2, night: 3, nightsim: 3, over: 3 }[G.phase] || 0; $('day').textContent = G.day ? `Day the ${ORD[G.day - 1]}` : 'The First Night'; document.querySelectorAll('#phases span').forEach((s, i) => s.classList.toggle('on', i === ph)); }
// every role in the house, as illuminated cards. The set is the same every game, so showing it gives nothing away.
const RINGS = me => P.rooms.dorm && P.rooms.dorm.rs ? [...living().filter(q => q.id !== me.id).map(q => 'h' + q.id), 'chapel', 'refect', 'script', 'tower'] : ['chapel', 'refect', 'script', 'tower', 'yard', 'dorm'];
const ROLE_ORDER = [['enemy', 1], ...TURNED.map(k => [k, 1]), ...['infirm', 'tracker', 'archiv', 'confess', 'grave', 'bell', 'watch', 'precent', 'prior', 'scribe', 'sacrist', 'penit', 'cellar', 'novice', 'lay'].map(k => [k, 1])];
function showRoles() { let o = $('rolesov'); if (!o) { o = document.createElement('div'); o.id = 'rolesov'; document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.closest('[data-rclose]')) o.style.display = 'none'; }; }
  const mine = you().role, was = you().wasRole;
  o.innerHTML = `<div class="v rcard"><div class="hd" style="font-size:34px"><span class="cap">T</span>he House</div><p class="sub">${STRIG() ? `${G.players.length} neighbours. One is the Strigoi. The other ${G.players.length - 1} are dealt ${G.players.length - 1} of these gifts (the Townsman can come twice). Each night he bites one of them, or sends a Thrall to kill. The bitten turn two nights later and serve him, unless the Physician bleeds them or they take the holy water at the church.</p><p class="sub" style="display:none">` : ''}${G.players.length} brothers. One is the Hollow Brother. The other ${G.players.length - 1} are dealt ${G.players.length - 1} of these fifteen gifts (the Lay Brother can come twice), so no one can tell which are in the house.${bal().turn ? '' : ' In a house this small the Hollow turns no one: he is alone.'} On the ${TNW()} the Hollow turns one of them, who loses his gift and becomes one of the six turned; which one is dealt at random.</p>
    <div class="rgrid">${(STRIG() ? [['enemy', 1], ['thrall', 1], ...ROLE_ORDER.filter(([k]) => !ROLES[k].turned && k !== 'enemy')] : ROLE_ORDER).map(([k, n]) => { const R = ROLES[k], ev = R.team === 'evil'; return `<div class="rr ${ev ? 'ev' : ''} ${k === mine ? 'me' : ''}"><span class="drop">${R.name[0]}</span><div class="rn">${R.name.slice(1)}${n > 1 ? ` <small>× ${n}</small>` : ''}${ROLES[k].turned ? ' <small>turned</small>' : ''}</div><div class="rt">${ev ? 'Evil' : 'Faithful'}${R.night ? ' · acts by night' : ''}${k === mine ? ' · <b>you</b>' : k === was ? ' · <b>you were</b>' : ''}</div><p>${R.text}</p></div>`; }).join('')}</div>
    <div class="row" style="justify-content:flex-end"><span class="btn" data-rclose="1">Close</span></div></div>`; o.style.display = 'flex'; }
// the Table can be put away, as on the Lords table; a dot shows when something is said while it is hidden
const TB = { hid: false, unread: false, seen: 0 };
function tableToggle() { TB.hid = !TB.hid; document.body.classList.toggle('notable', TB.hid); if (!TB.hid) TB.unread = false; renderActs(); if (!TB.hid) { renderChat(); const i = $('chat').querySelector('input'); if (i) i.focus(); } }
function renderActs() { if (remote()) return; const me = you(); let h = '';
  if (G.phase === 'day') { const s = nearSpot(), b = nearBody();
    if (me.alive) { h += me.state === 'search' ? `<span class="btn go">Searching…<small><i class="bar"><i style="width:${(1 - me.st / SEARCH_T) * 100}%"></i></i></small></span>` : `<span class="btn ${s ? 'go' : 'off'}" data-act="search">${STRIG() ? 'Scavenge' : 'Search'}<small>${s ? (STRIG() ? (s.poi ? 'here · E' : 'this room · E') : 'here · E') : STRIG() ? (MAP.carry && !roomFor(me) ? 'your arms are full' : 'nothing left here') : 'find a glint'}</small></span>`; h += (me.role === 'enemy' && MAP.pois ? (() => { const v = dayBiteTarget(me); return `<span class="btn ${v ? 'go' : 'off'}" data-act="daybite">Bite<small>${G.dayBite ? 'you have fed today' : v ? v.short + ' · no one sees' : 'alone with one, in the woods'}</small></span>`; })() : '') + `<span class="btn ${b ? 'go' : 'off'}" data-act="examine">Examine<small>${b ? G.players[b.id].short : 'a body'}</small></span>`; if (STRIG() && !me.holy && G.town) { const inC = roomAt(me.x, me.y) === 'chapel' && G.town.holy > 0; h += `<span class="btn ${inC ? '' : 'off'}" data-act="holy">Holy water<small>${!G.town.holy ? 'the font is dry' : inC ? (team(me) === 'evil' ? 'it would burn you' : G.town.holy + ' left · all will see') : G.town.holy + ' left · at the church'}</small></span>`; } if (hasGate()) { const nl = nearLever(me); h += `<span class="btn ${nl ? 'go' : 'off'}" data-act="gate">${G.town.gate ? 'Shut the gate' : 'Open the gate'}<small>${nl ? 'the lever · all will know' : G.town.gate ? 'the gate stands open' : 'the gate is shut'}</small></span>`; } if (STRIG() && G.town && P.rooms.dorm && P.rooms.dorm.rs) { const ah = atHome(me), lv = homeLv(me), ok = ah && packN(me) >= 2 && lv < HOME_MAX; h += `<span class="btn ${ok ? 'go' : 'off'}" data-act="fortify">Shore up my house<small>${lv >= HOME_MAX ? 'as strong as it gets' : !ah ? `at your house · ${lv} of ${HOME_MAX}` : packN(me) < 2 ? 'carry two things home' : `two of what you carry · ${lv} of ${HOME_MAX}`}</small></span>`; } if (STRIG() && G.town && document.body.classList.contains('pad') && nearStash(me)) h += `<span class="btn go" data-ptgo="case">The stash<small>${matStr(me.pack) ? 'put in what you carry' : 'build · take'}</small></span>`; }
    else h += '<span class="btn off">You are dead<small>silent, but you keep one vote</small></span>';
    const rung = G.rang || {}, LH = humansNow().filter(id => G.players[id].alive), nr = LH.filter(id => rung[id]).length; h += rung[G.you] ? `<span class="btn off">Dusk rung<small>${nr} of ${LH.length} have rung</small></span>` : `<span class="btn" data-act="dusk">Ring for dusk<small>${LH.length > 1 ? (nr ? nr + ' of ' + LH.length + ' have rung' : 'when all have rung') : 'end the day'}</small></span>`; }
  if (!G.demo) h += `<span class="sep"></span><span class="btn tbl ${TB.hid ? '' : 'on'}" data-tbl="1" title="Show or hide the Table (C)"><svg width="16" height="14" viewBox="0 0 14 12"><path d="M1 1h12v7H6l-3 3V8H1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>The Table<small>${TB.hid ? 'show · C' : 'hide · C'}</small>${TB.hid && TB.unread ? '<i class="udot"></i>' : ''}</span>`;
  if ($('acts')._h !== h) { $('acts').innerHTML = h; $('acts')._h = h; } }
function flash(t) { if (remote()) return NETH() && NETH().toSeat(G.you, { t: 'flash', text: t }); const f = $('flash'); f.textContent = t; f.style.opacity = 1; clearTimeout(f._t); f._t = setTimeout(() => f.style.opacity = 0, 2600); }
const toast = flash, toastAll = t => forHumans(() => flash(t));
// countdowns: a gold ring beside a continue button; when it runs out the button presses itself. The deadline is kept per screen,
// so the ring does not restart when the screen is redrawn (another player ready, a vote coming in).
const CD = { dl: {}, done: {} };
function cdArm(m) { const b = m.querySelector('.btn.go[data-cdk]'); if (!b || G.demo) return; const k = b.dataset.cdk; if (CD.done[k]) return; CD.dl[k] = CD.dl[k] || performance.now() + (+b.dataset.cd) * 1000;
  b.insertAdjacentHTML('afterend', `<span class="cdr" data-cdr="${k}" title="Moves on by itself"></span>`); cdTick(); }
function cdTick() { const now = performance.now(); if (document.body.classList.contains('cine')) { for (const k in CD.dl) if (!CD.done[k]) CD.dl[k] += 200; return; } document.querySelectorAll('#modal [data-cdr]').forEach(r => { const k = r.dataset.cdr, b = r.parentElement.querySelector(`.btn.go[data-cdk="${k}"]`); if (!b) return;
    const left = Math.max(0, CD.dl[k] - now), tot = (+b.dataset.cd) * 1000; r.style.setProperty('--a', (left / tot * 360) + 'deg'); r.textContent = Math.ceil(left / 1000);
    if (left <= 0 && !CD.done[k] && G.phase !== 'cine' && $('modal').style.display !== 'none') { CD.done[k] = true; b.click(); } }); }
setInterval(cdTick, 200);
function modal(html, cls = '') { G.lastModal[G.you] = { html, cls }; if (remote()) return NETH() && NETH().toSeat(G.you, { t: 'modal', html, cls }); const m = $('modal'); m.className = 'v p ' + cls; m.innerHTML = html; m.style.display = 'block'; $('veil').style.display = cls === 'found' ? 'none' : 'block'; $('pop').style.display = 'none'; document.body.classList.toggle('hear', cls === 'hear'); drawIcons(m); cdArm(m); if (document.body.classList.contains('pad') && PAD.tab !== 'hands') { const t = document.querySelector('#padbar [data-pt=hands]'); if (t) t.classList.add('ping'); } }
function hideModal() { G.lastModal[G.you] = null; if (remote()) return NETH() && NETH().toSeat(G.you, { t: 'hide' }); $('modal').style.display = 'none'; $('veil').style.display = 'none'; document.body.classList.remove('hear'); }
function showDawn() { renderAll(); const lg = G.nightLog, me = you(); let h = `<div class="hd" style="font-size:40px"><span class="cap">D</span>awn of the ${ORD[G.day - 1]} Day</div>`;
  if (lg.horde) h += `<p class="big" style="color:${lg.horde.breach != null ? '#e05a4a' : '#b8c0a0'}">In the night ${lg.horde.n} of the dead came at the walls. ${lg.horde.breach != null ? `There were only ${lg.horde.def} to hold them: they came over.` : `The walls held (${lg.horde.def}).`}</p>`;
  if (lg.dead.length) h += lg.dead.map(id => `<p class="big"><i class="chip" style="background:${G.players[id].col}"></i> <b>${G.players[id].name}</b> lies dead in the ${RN(G.bodies.find(b => b.id === id).room)}.</p>`).join('');
  else h += `<p class="big">No one was taken in the night.${lg.protect != null ? ' Someone was watched over.' : ''}</p>`;
  if (me.diedDay === G.day) h += '<p class="big" style="color:#e05a4a">It was you. You walk the halls now as a ghost. The dead do not speak, but you keep one vote at the Hearing.</p>';
  if (lg.turned === G.you) { const E = G.players.find(p => p.role === 'enemy'), R = ROLES[me.role]; h += `<div class="clue" style="border-color:#7a1f16">${icon('eye')}<div><p style="color:#e8a090">${me.role === 'empty' ? 'In your sleep something spoke to you, and you listened.' : 'In the night a brother came to your bed and spoke to you, and you listened.'} <b>You serve the Hollow Brother now</b>: you are his ${R.name}.</p><p>${me.role === 'empty' ? 'You do not know which brother he is. He knows you.' : `Your master is <b style="color:${E.col}">${E.name}</b>.`} You were the ${ROLES[me.wasRole].name}; you may still say so.</p></div></div>`; }
  if (me.role === 'enemy' && lg.turned != null && lg.turned !== G.you) { const T = G.players[lg.turned]; h += `<p class="big" style="color:#e05a4a">${T.name} serves you now. He is your ${ROLES[T.role].name}.</p><p class="sub">${ROLES[T.role].power}</p>`; }
  const nn = (G.nightNote || {})[G.you]; if (nn && me.alive) h += `<div class="clue" style="border-color:${nn.evil || nn.bite ? '#7a1f16' : '#4f6a3a'}">${icon('eye')}<div><p style="color:${nn.evil || nn.bite ? '#e8a090' : '#b8d0a0'}">${nn.text.trim()}</p></div></div>`;
  const ni = G.nightInfo[G.you]; if (ni && me.alive && lg.turned !== G.you) h += `<div class="clue">${icon('eye')}<div><p>${ni.text}</p>${ni.set.length ? `${toLine(ni.set)}` : ''}</div></div>`;
  h += `<p class="sub" style="margin-top:8px">The candle burns to notch ${G.clock} of 8. Fresh snow has covered all but last night's prints.</p>${G.ready[G.you] ? `<div class="row"><span class="btn off">Waiting for ${readyLeft()}…</span>${readyTally()}</div>` : `<div class="row"><span class="btn go" data-go="day" data-cd="15" data-cdk="dawn${G.day}">Begin the day</span>${readyTally()}</div>`}`; modal(h, 'dawn'); }
function showHearingAll() { forHumans(showHearing); }
function showHearing() { renderAll(); const h = G.hearing, me0 = G.you, need = Math.ceil(living().length / 2), me = you(); let s = `<div class="hd" style="font-size:38px"><span class="cap">T</span>he Hearing</div><p class="sub">Dusk of the ${ORD[G.day - 1]} day. A brother hangs if ${need} vote aye (half the ${living().length} living). The dead may spend their one vote.${houseDefers() ? ' With five or more players at the table, the brothers the house plays follow the players: they name only whom at least two players name, and vote with the players\' majority.' : ''}</p>`;
  if (h.result) { const r = h.result; if (r.banished != null) s += `<p class="big"><i class="chip" style="background:${G.players[r.banished].col}"></i> <b>${G.players[r.banished].name}</b> is banished beyond the gate. He lives, outside the walls: no stash, no church, and his nights with the dead.</p>`; else s += r.hanged != null ? `<p class="big"><i class="chip" style="background:${G.players[r.hanged].col}"></i> <b>${G.players[r.hanged].name}</b> is hanged in the cloister.${team(G.players[r.hanged]) === 'evil' ? ' <span style="color:#d8b060">The candle steadies: it burns back a notch.</span>' : ''}${r.penit ? ' <span style="color:#d8b060">He was the Penitent: the candle burns back two notches.</span>' : ''}</p>${G.players[r.hanged].role === 'husk' && living().some(p => p.role === 'enemy') ? `<p class="big" style="color:#e05a4a">${you().role === 'enemy' && you().inherited === G.day ? 'He was the Hollow Brother. As the rope goes taut, the hollow leaves him and finds you. Tonight, you hunger.' : 'He was the Hollow Brother. But the candle gutters and does not go out: the hollow has passed to someone else in this house.'}</p>` : ''}` : `<p class="big">${h.acc.some(a => a.out === 'spared') ? 'He is spared.' : h.nomFail === 'tie' ? 'The names are split; no one goes up.' : h.nomFail === 'few' ? 'Too few name anyone; no one goes up.' : 'No one has enough votes.'} No one hangs; the candle will burn twice tonight.</p>`; if (!G.over) s += G.ready[G.you] ? `<div class="row"><span class="btn off">Waiting for ${readyLeft()}…</span>${readyTally()}</div>` : `<div class="row"><span class="btn go" data-go="night" data-cd="12" data-cdk="res${G.day}">Night falls</span>${readyTally()}</div>`; modal(s, 'hear'); return; }
  const chipOf = id => `<i class="chip" style="background:${G.players[id].col}"></i>`, nm = id => id === me0 ? 'you' : G.players[id].short;
  // the trials so far
  s += h.acc.map((a, i) => { const n = Object.values(a.votes || {}).filter(v => v).length, t = G.players[a.target], live = h.stage === 'trial' && h.cur === i;
    return `<div class="acc ${live ? 'cur' : ''}"><p><span class="sub">${a.round === 2 ? 'Second' : 'First'} to go up, named by ${a.named.map(nm).join(', ')}</span><br>${chipOf(t.id)} <b class="nm">${t.name}</b>${a.out === 'spared' ? ' <span class="sub" style="color:#8fbf7a">· spared</span>' : ''}</p>
      <div class="tally">${Object.entries(a.votes || {}).map(([k, v]) => `<span class="${v ? 'y' : 'n'}">${nm(+k)}${G.players[k].alive ? '' : ' (dead)'} · ${v ? 'aye' : 'nay'}</span>`).join('')}${live ? waitingOn(i) : ''}</div><p class="sub">${n} aye of ${need} needed</p>
      ${a.pardon != null ? `<p class="sub" style="color:#d8b060">Pardoned by ${nm(a.pardon)}, the Prior.</p>` : ''}${live && a.votes[G.you] == null && (me.alive || me.ghostVote) ? `<div class="row"><span class="btn go" data-vote="1">Aye, hang him</span>${STRIG() ? '<span class="btn" data-vote="2" title="He lives, but outside the walls: no stash, no church, and nights with the dead.">Banish him</span>' : ''}<span class="btn" data-vote="0">Nay, spare him</span></div>` : ''}${live && me.role === 'prior' && me.alive && !me.pardoned && a.target !== G.you ? `<div class="row"><span class="btn" data-pardon="1" title="Once in the game">Pardon him, as Prior</span></div>` : ''}</div>`; }).join('');
  if (h.stage === 'nom') { const T = nomTally(), mine = h.noms[G.you];
    s += `<div class="acc cur"><p class="big" style="margin:0">${h.round === 1 ? 'Who should go up before the brothers?' : 'He is spared. One more may go up tonight.'}</p><p class="sub">Name one brother. The one most named goes up, if at least two name him.</p>
      <div class="tally">${T.length ? T.map(([id, by, w]) => `<span class="y">${chipOf(id)} ${G.players[id].short} · ${me.role === 'wether' || me.role === 'enemy' ? w : by.length} <small>(${by.map(nm).join(', ')})</small></span>`).join('') : '<span class="n">no one named yet</span>'}</div>`;
    if (me.alive && !G.ready[G.you]) s += `<div class="row wrap">${living().filter(p => p.id !== G.you && !spared().includes(p.id)).map(p => `<span class="btn small ${mine === p.id ? 'go' : ''}" data-nom="${p.id}">${chipOf(p.id)} ${p.short}</span>`).join('')}<span class="btn small ${mine === -1 ? 'go' : ''}" data-nom="-1">No one</span></div>`;
    else if (!me.alive) s += '<p class="sub">The dead do not name. You keep your vote for the trial.</p>';
    const kept = me.alive ? G.clues.filter(c => !c.shared && c.src !== 'said' && (c.found || c.kind === 'info' || c.kind === 'body')) : []; if (kept.length && !G.ready[G.you]) s += `<p class="sub" style="margin-top:8px">Lay evidence before the brothers. It counts double, and there is no time to answer it:</p><div class="row wrap">${kept.map(c => `<span class="btn small" data-present="${c.id}" title="${c.text.replace(/"/g, '')}">${icon(ICON[c.kind] || 'eye')} ${c.text.length > 38 ? c.text.slice(0, 36) + '…' : c.text}</span>`).join('')}</div>`;
    s += `</div>` + (G.ready[G.you] ? `<div class="row"><span class="btn off">Waiting for ${readyLeft()}…</span>${readyTally()}</div>` : `<div class="row"><span class="btn go" data-go="tally" data-cd="25" data-cdk="nom${G.day}_${h.round}">Count the names</span>${readyTally()}</div>`); }
  else if (h.stage === 'trial' && (h.acc[h.cur].votes[G.you] != null || !(me.alive || me.ghostVote))) s += votesIn(h.cur) ? (G.ready[G.you] ? `<div class="row"><span class="btn off">Waiting for ${readyLeft()}…</span>${readyTally()}</div>` : `<div class="row"><span class="btn go" data-go="next" data-cd="10" data-cdk="next${G.day}_${h.cur}">Count the votes</span>${readyTally()}</div>`) : `<div class="row"><span class="btn off">Waiting for the others to vote…</span></div>`;
  modal(s, 'hear'); }
// readiness: the table moves on when every human at it has said so (the dead included, they still sit there)
const readyTally = () => { const hs = humansNow(); if (hs.length < 2) return ''; const n = hs.filter(h => G.ready[h]).length; return `<span class="rt">${n} of ${hs.length} ready</span>`; };
const readyLeft = () => { const w = humansNow().filter(h => !G.ready[h]); return w.length === 1 ? (w[0] === G.you ? 'you' : who(w[0])) : w.length + ' brothers'; };
const who = id => G.names[id] && !G.players[id].named ? `${G.players[id].short} (${G.names[id]})` : G.players[id].short;
const canVote = id => { const p = G.players[id]; return p.alive || p.ghostVote; };
const votesIn = i => { const a = G.hearing.acc[i]; const all = humansNow().every(h => !canVote(h) || a.votes[h] != null); if (all && a.deferred && !a.houseIn) houseFollows(i); return all; };
const waitingOn = i => { const a = G.hearing.acc[i], w = humansNow().filter(h => canVote(h) && a.votes[h] == null); return w.length ? `<span class="n" style="opacity:.6">waiting on ${w.map(who).join(', ')}</span>` : ''; };
function allReady(f) { if (humansNow().every(h => G.ready[h])) { G.ready = {}; f(); return true; } return false; }
function showNightAll() { G.phase = 'night'; G.ready = {}; G.nightChoices = {}; const E = living().find(p => p.role === 'enemy'); G.prepick = E && !isHuman(E.id) && killsTonight() ? (enemyPick(E, []) || {}).id : null; forHumans(showNight); }
function showNight() { G.phase = 'night'; renderAll(); const me = you(), R = ROLES[me.role]; G.nightChoice = { room: me.alive ? 'dorm' : 'dorm', protect: null, follow: null };
  const draw = () => { const c = G.nightChoice; let s = `<div class="hd" style="font-size:38px"><span class="cap">C</span>ompline</div><p class="sub">The doors are barred. Where will you spend the night? Others will see the ledger, or follow you.</p>`;
    if (me.alive && me.lockedOut) s += `<p class="big" style="color:#e05a4a">The gate is barred, and you are on the wrong side of it. You sleep in the Wastes tonight.</p>`; else if (me.alive) { s += `<div class="row wrap">${['dorm', 'chapel', 'refect', 'script', 'tower'].map(r => `<span class="btn small ${c.room === r ? 'go' : ''}" data-room="${r}">${RN(r)}</span>`).join('')}</div>`;
      if (R.night === 'protect') s += `<p class="sub" style="margin-top:10px">Keep watch over:</p><div class="row wrap">${living().filter(p => p.id !== G.you).map(p => `<span class="btn small ${c.protect === p.id ? 'go' : ''}" data-protect="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div>`;
      if (me.role === 'enemy' && STRIG()) { const th = living().filter(p => p.role === 'thrall'), gl = living().filter(p => team(p) === 'good'), ch = p => `<i class="chip" style="background:${p.col}"></i> ${p.short}`;
        s += `<p class="sub" style="margin-top:10px;color:#e05a4a">Bite one: in two nights he turns and is yours, unless he is cured.</p><div class="row wrap">${gl.filter(p => !p.bitten).map(p => `<span class="btn small ${c.bite === p.id ? 'go' : ''}" data-bite="${p.id}">${ch(p)}</span>`).join('')}</div>`;
        if (gl.some(p => p.bitten)) s += `<p class="sub">Bitten, not yet turned: ${gl.filter(p => p.bitten).map(p => p.short).join(', ')}.</p>`;
        if (th.length) s += `<p class="sub" style="margin-top:10px;color:#e05a4a">Or send a Thrall to kill${th.length > 1 ? ':' : ' (' + th[0].short + '):'}</p>${th.length > 1 ? `<div class="row wrap">${th.map(p => `<span class="btn small ${(c.thrall != null ? c.thrall : th[0].id) === p.id ? 'go' : ''}" data-thrall="${p.id}">${ch(p)}</span>`).join('')}</div>` : ''}<div class="row wrap">${gl.map(p => `<span class="btn small ${c.send === p.id ? 'go' : ''}" data-send="${p.id}">${ch(p)}${p.claimed ? ' <span class="sub">(' + p.claimed + ')</span>' : ''}</span>`).join('')}</div>`;
        else s += '<p class="sub">You have no Thralls yet. The bitten turn two nights after the bite.</p>'; }
      else if (me.role === 'enemy' && isTurnNight()) s += `<p class="sub" style="margin-top:10px;color:#e05a4a">Tonight you take no one. Go to one brother and make him yours: he will be your Scrubber.</p><div class="row wrap">${living().filter(p => p.id !== G.you).map(p => `<span class="btn small ${c.turn === p.id ? 'go' : ''}" data-turn="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div>`;
      else if (me.role === 'enemy' && !killsTonight()) s += `<p class="sub" style="margin-top:10px;color:#e05a4a">Tonight you do not hunger. Sleep where you like.</p>`;
      else if (me.role === 'enemy') s += `<p class="sub" style="margin-top:10px;color:#e05a4a">Take a brother tonight:</p><div class="row wrap">${living().filter(p => team(p) === 'good').map(p => `<span class="btn small ${c.kill === p.id ? 'go' : ''}" data-kill="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}${p.claimed ? ' <span class="sub">(' + p.claimed + ')</span>' : ''}</span>`).join('')}</div>`;
      if (R.night === 'ring') s += `<p class="sub" style="margin-top:10px">Listen at the door of:</p><div class="row wrap">${RINGS(me).map(r => `<span class="btn small ${c.ring === r ? 'go' : ''}" data-ring="${r}">${PN(r)}</span>`).join('')}</div>`;
      if (R.night === 'frame') s += `<p class="sub" style="margin-top:10px;color:#e05a4a">Lay a false trace against:</p><div class="row wrap">${living().filter(p => team(p) === 'good').map(p => `<span class="btn small ${c.frame === p.id ? 'go' : ''}" data-frame="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div>`;
      if (R.night === 'hush') s += `<p class="sub" style="margin-top:10px;color:#e05a4a">Silence:</p><div class="row wrap">${living().filter(p => p.id !== G.you && team(p) === 'good').map(p => `<span class="btn small ${c.hush === p.id ? 'go' : ''}" data-hush="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}${p.claimed ? ' <span class="sub">(' + p.claimed + ')</span>' : ''}</span>`).join('')}</div>`;
      if (me.role === 'wether') { const E = G.players.find(p => p.role === 'enemy' && p.alive), k = E && isHuman(E.id) ? (G.nightChoices[E.id] || {}).kill : G.prepick; s += `<p class="sub" style="margin-top:10px;color:#e05a4a">${!E ? 'Your master is gone.' : killsTonight() === 0 ? 'Tonight he will not hunt.' : k != null && G.players[k] ? 'Tonight he will take ' + G.players[k].name + '.' : 'He has not yet chosen.'}</p>`; }
      if (R.night === 'follow') s += `<p class="sub" style="margin-top:10px">Follow:</p><div class="row wrap">${living().filter(p => p.id !== G.you).map(p => `<span class="btn small ${c.follow === p.id ? 'go' : ''}" data-follow="${p.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div>`; }
    else s += '<p class="big">You are dead. You watch the house from the rafters.</p>';
    const ok = !me.alive || (me.role === 'enemy' ? (STRIG() ? (c.bite != null || c.send != null) : isTurnNight() ? c.turn != null : killsTonight() ? c.kill != null : true) : (!R.night || (R.night === 'protect' ? c.protect != null : R.night === 'follow' ? c.follow != null : R.night === 'ring' ? !!c.ring : R.night === 'frame' ? c.frame != null : R.night === 'hush' ? c.hush != null : true)));
    s += G.ready[G.you] ? `<div class="row"><span class="btn off">Waiting for ${readyLeft()}…</span>${readyTally()}</div>` : `<div class="row"><span class="btn ${ok ? 'go' : 'off'}" data-go="${ok ? 'sleep' : ''}">Snuff the candle</span></div>`; modal(s, 'night'); };
  (G.drawNights = G.drawNights || {})[G.you] = draw; draw(); }
function showEnd() { renderAll(); if (!remote()) { if (G.over === 'evil' && window.musicVictory) musicVictory(); if (G.over === 'good' && window.musicFaithful) musicFaithful(); } const good = G.over === 'good', won = (team(you()) === 'good') === good; let s = `<div class="hd" style="font-size:44px"><span class="cap">${good ? 'T' : 'T'}</span>${good ? 'he Hollow Brother hangs' : 'he house is his'}</div><p class="big" style="color:${won ? '#d8b060' : '#e05a4a'}">${won ? 'You have won.' : 'You have lost.'}</p><p class="big">${good ? 'The thaw comes to a quiet house.' : 'By the thaw, there is no one left to ring the bell.'}</p><div class="roles">${G.players.map(p => `<div class="s ${p.alive ? '' : 'dead'}"><i class="sw" style="background:${p.col}"></i><b>${p.name}<small>${ROLES[p.role].name}${p.id === G.you ? ' · you' : ''}</small></b><span class="${team(p) === 'evil' ? 'ev' : 'gd'}">${team(p) === 'evil' ? 'evil' : 'faithful'}</span></div>`).join('')}</div><div class="row">${NETH() && NETH().guest ? '<span class="btn off">The host may start another night</span>' : '<span class="btn go" data-go="again">Another night</span>'}<span class="btn" data-go="menu">Leave the monastery</span></div>`; modal(s, 'end'); }
function renderAll() { if (remote()) return; if (G.screen) { renderTop(); renderBrothers(); renderChat(); renderClock(); renderScreen(true); return; } renderTop(); renderBrothers(); renderCase(); renderChat(); renderRole(); renderClock(); renderActs(); }

// clicks: things that only change this screen are done here; everything else is an action, run by the host as the seat that asked
const LOCAL_ONLY = d => d.b != null || d.mark != null || d.wlist != null || d.close != null || d.go === 'menu' || d.go === 'swap';
document.addEventListener('click', e => { const t = e.target.closest('[data-present],[data-wlist],[data-whisper],[data-share],[data-close],[data-go],[data-act],[data-b],[data-ask],[data-mark],[data-vote],[data-accuse],[data-room],[data-protect],[data-follow],[data-kill],[data-turn],[data-nom],[data-ring],[data-frame],[data-hush],[data-pardon],[data-scribe],[data-bite],[data-send],[data-thrall],[data-stash]'); if (!t) { if (!e.target.closest('#pop')) $('pop').style.display = 'none'; return; } const d = { ...t.dataset };
  act(d); });
// send an action to the host, or run it here
function act(d) { const N = NETH(); if (N && N.guest && !LOCAL_ONLY(d)) { N.act(d); if (d.whisper || d.share) hideModal(); if (d.ask) $('pop').style.display = 'none'; return; } handle(d); }
function handle(d) { const me = G.you, h = G.hearing;
  if (d.share) { shareClue(+d.share); if (G.lastModal[me] && G.lastModal[me].cls === 'found') hideModal(); }
  if (d.present) presentClue(+d.present);
  if (d.wlist) { const c = G.clues.find(q => q.id === +d.wlist); if (c) modal(`<div class="hd"><span class="cap">W</span>hisper</div><p class="big">${c.text}</p><p class="sub">Tell one brother, quietly. If you trust the wrong man, he will know what you know.</p><div class="row wrap">${living().filter(p => p.id !== G.you).map(p => `<span class="btn small" data-whisper="${p.id}" data-cid="${c.id}"><i class="chip" style="background:${p.col}"></i> ${p.short}</span>`).join('')}</div><div class="row"><span class="btn" data-close>Never mind</span></div>`, 'found'); }
  if (d.whisper) { whisper(+d.cid, +d.whisper); hideModal(); }
  if (d.close != null) hideModal();
  if (d.chat && you().alive) say(you(), String(d.chat).slice(0, 200).replace(/</g, '&lt;'));
  if (d.wsay && canWhisper(me, +d.to)) { G.wchat.push({ from: me, to: +d.to, text: String(d.wsay).slice(0, 200).replace(/</g, '&lt;'), t: G.t }); if (G.wchat.length > 200) G.wchat.shift(); setTimeout(renderChat); }
  if (d.walk && G.phase === 'day') { const [x, y] = d.walk.split(',').map(Number), p = you(); if (p.state !== 'search' && isFinite(x) && isFinite(y)) { p.kdir = null; p.path = findPath(p.x, p.y, x, y); } }
  if (d.kdir != null) { const [x, y] = String(d.kdir).split(',').map(Number); you().kdir = x || y ? [x, y] : null; if (!(x || y) && you().state === 'walk' && !you().path.length) you().state = 'idle'; }
  if (d.act === 'search') doSearch(); if (d.act === 'examine') doExamine(); if (d.act === 'holy') takeHoly(G.players[me]); if (d.act === 'gate') { const gp = G.players[me]; setGate(gp, !G.town.gate); renderActs(); } if (d.act === 'fortify') { if (fortify(G.players[me])) { if (isHuman(me)) asSeat(me, () => renderCase()); renderActs(); } } if (d.act === 'daybite') { const E = G.players[me], v = dayBiteTarget(E); if (v) dayBite(E, v); } if (d.stash) stashAct(G.players[me], d.stash);
  if (d.act === 'dusk' && G.phase === 'day') { G.rang = G.rang || {}; G.rang[me] = true; const L = humansNow().filter(id => G.players[id].alive), n = L.filter(id => G.rang[id]).length; if (n >= L.length) startHearing(); else { toastAll(`${who(me)} rings for dusk (${n} of ${L.length}).`); renderActs(); } }
  if (d.b) selectBrother(+d.b);
  if (d.ask) { askAlibi(+d.ask); if (!remote()) $('pop').style.display = 'none'; }
  if (d.mark) { G.players[+d.mark].mark = d.m; renderBrothers(); $('pop').style.display = 'none'; }
  if (d.nom != null && h && h.stage === 'nom' && you().alive && !G.ready[me]) { const t = +d.nom; if (t === -1 || (G.players[t] && G.players[t].alive && t !== me && !spared().includes(t))) { h.noms[me] = t; botNoms(); showHearingAll(); } }
  if (d.pardon && h && h.stage === 'trial') pardon(me);
  if (d.scribe != null && G.phase === 'day') scribeRead(+d.scribe);
  if (d.vote != null && h && h.cur >= 0) { const a = h.acc[h.cur]; if (a.votes[me] == null) { a.votes[me] = d.vote === '1' ? true : d.vote === '2' && STRIG() ? 'b' : false; if (!you().alive && a.votes[me]) you().ghostVote = false; } showHearingAll(); }
  const nc = G.nightChoice, redraw = () => G.drawNights && G.drawNights[me] && G.drawNights[me]();
  if (G.phase === 'night' && nc && !G.ready[me]) { if (d.room) nc.room = d.room; if (d.protect) nc.protect = +d.protect; if (d.follow) nc.follow = +d.follow; if (d.kill) { nc.kill = +d.kill; for (const w of G.players.filter(q => q.role === 'wether' && isHuman(q.id))) asSeat(w.id, () => G.drawNights && G.drawNights[w.id] && !G.ready[w.id] && G.drawNights[w.id]()); } if (d.turn) nc.turn = +d.turn; if (d.ring) nc.ring = d.ring; if (d.frame) nc.frame = +d.frame; if (d.hush) nc.hush = +d.hush; if (d.bite != null) { nc.bite = +d.bite; nc.send = null; } if (d.send != null) { nc.send = +d.send; nc.bite = null; } if (d.thrall != null) nc.thrall = +d.thrall; if (d.room || d.protect || d.follow || d.kill || d.turn || d.ring || d.frame || d.hush || d.bite != null || d.send != null || d.thrall != null) redraw(); }
  if (d.go === 'night' && G.day === 0 && !h && G.phase === 'night') { G.ready[me] = true; if (!allReady(showNightAll)) forHumans(showIntro); }
  if (d.go === 'day' && G.phase === 'dawn') { G.ready[me] = true; if (!allReady(startDay)) forHumans(showDawn); }
  if (d.go === 'tally' && h && h.stage === 'nom' && !h.result) { G.ready[me] = true; if (!allReady(tallyNoms)) showHearingAll(); }
  if (d.go === 'next' && h && h.cur >= 0 && !h.result && votesIn(h.cur)) { G.ready[me] = true; if (!allReady(resolveTrial)) showHearingAll(); }
  if (d.go === 'night' && h && h.result && !G.over) { G.ready[me] = true; if (!allReady(showNightAll)) showHearingAll(); }
  if (d.go === 'sleep' && G.phase === 'night') { G.ready[me] = true; if (!allReady(() => { forHumans(hideModal); simulateNight(G.nightChoices); })) forHumans(() => G.drawNights && G.drawNights[G.you] && G.drawNights[G.you]()); }
  if (d.go === 'again') { const N = NETH(); if (N && N.host) N.rematch(); else if (!N || !N.guest) { if (window.HMENU) HMENU.again(); else location.reload(); } }
  if (d.go === 'menu') { if (window.HMENU) HMENU.leave(); else location.reload(); }
  if (d.go === 'swap') { location.search = MODE === 'enemy' ? '' : '?as=enemy'; } }
addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (NIGHT.on() && (k === ' ' || k === 'escape' || k === 'enter')) { e.preventDefault(); NIGHT.skip(); return; } if (document.activeElement && document.activeElement.tagName === 'INPUT') { if (k === 'enter') { const v = e.target.value.trim(); if (v && e.target.closest('#chat')) act(CW.tab === 'all' ? { chat: v } : { wsay: v, to: CW.tab }); e.target.value = ''; } if (k === 'escape') e.target.blur(); return; } const was = keyDir().join(); KEYS[k] = true; if (NETH() && NETH().guest && keyDir().join() !== was) act({ kdir: keyDir().join() }); if (k === 'u') { HFS.ui(); return; } if (k === 'c' && !G.demo) { tableToggle(); return; } if (k === 'r' && !G.demo) { const o = $('rolesov'); if (o && o.style.display === 'flex') o.style.display = 'none'; else showRoles(); return; } if (k === 'escape') { const o = $('rolesov'); if (o) o.style.display = 'none'; } if (k === 'e' || k === ' ') { act({ act: 'search' }); act({ act: 'examine' }); e.preventDefault(); } });
addEventListener('keyup', e => { const was = keyDir().join(); KEYS[e.key.toLowerCase()] = false; if (NETH() && NETH().guest) { if (keyDir().join() !== was) act({ kdir: keyDir().join() }); return; } if (G.players && you() && you().walkKey) { you().walkKey = false; you().state = 'idle'; } });

// dissolve a sprite in: each pixel has a fixed threshold (noise, biased so the feet come first); the edge of the dissolve smoulders dark
const fhash = (i, j) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); };
function blitFade(data, s, x, y, depth, lt, fade) { const D = data.data, W = VIEW.W, bx = Math.round(isoP(x, y)[0]) + s.ox, by = Math.round(isoP(x, y)[1]) + s.oy, f = fade * 1.25;
  for (let j = 0; j < s.h; j++) { const Y = by + j; if (Y < 0 || Y >= VIEW.H) continue; for (let i = 0; i < s.w; i++) { const q = (j * s.w + i) * 4; if (!s.data[q + 3]) continue;
    const th = fhash(i >> 1, j >> 1) * .7 + (1 - j / s.h) * .55; if (th > f) continue; const X = bx + i; if (X < 0 || X >= W) continue; const k = Y * W + X; if (VIEW.dep[k] > depth) continue; const o = k * 4;
    const edge = Math.max(0, 1 - (f - th) / .18), em = s.data[q + 3] === 254, m = (1 - edge * .85) * Math.min(1, .35 + fade);
    D[o] = s.data[q] * (em ? 1 : lt[0]) * m; D[o + 1] = s.data[q + 1] * (em ? 1 : lt[1]) * m; D[o + 2] = s.data[q + 2] * (em ? 1 : lt[2]) * m; } } }

const sceneOn = () => !(G.opt && G.opt.scenes === false) && QS.get('scenes') !== 'off';
// ---------------------------------------------------------------- saving: the host's machine keeps the game after every dawn
const SKEY = 'hollow-saves', SKIP = new Set(['timers', 'drawNights', 'lastModal', 'cw', '_o']);
const savesGet = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '[]'); } catch (e) { return []; } };
function saveGame() { if ((NETH() && NETH().guest) || G.headless || G.over || G.demo) return; try { const data = JSON.parse(JSON.stringify(G, (k, v) => SKIP.has(k) ? undefined : v));
    const S = { id: G.saveId || (G.saveId = Date.now().toString(36)), when: Date.now(), day: G.day, phase: G.phase, online: G.humans.length > 1, names: G.names, humans: G.humans, CID, seed, G: data };
    const L = savesGet().filter(x => x.id !== S.id); L.unshift(S); localStorage.setItem(SKEY, JSON.stringify(L.slice(0, 4))); } catch (e) { console.warn('save failed', e); } }
function saveDrop() { try { localStorage.setItem(SKEY, JSON.stringify(savesGet().filter(x => x.id !== G.saveId))); } catch (e) {} }
function loadGame(S, opt = {}) { Object.assign(G, S.G, opt.patch || {}); G.demo = false; document.body.classList.remove('demo'); Object.assign(VIEW, { fogOff: false, noRing: false, cine: false, camT: null, extra: [] }); G.timers = []; G.drawNights = {}; G.lastModal = {}; CID = S.CID; seed = S.seed; LOCAL = 0; G.you = 0; G.screen = false; document.body.classList.remove('screen');
  for (const p of G.players) { p.path = p.path || []; p._oc = { ...p.o, prop: 'candle' }; } warmAll(); VISK = ''; hideModal(); renderAll();
  if (G.phase === 'dawn' || G.phase === 'nightsim') { G.phase = 'dawn'; G.ready = {}; forHumans(showDawn); } else { G.ready = {}; forHumans(showIntro); } }
// ---------------------------------------------------------------- the night, played out
// Compline, then your own vigil, then the Taking, then the bell for Lauds. Built from what simulateNight decided.
// The Hollow Brother walks in as an ordinary black-habited monk and changes as he closes in. Space, Esc or the button skips.
const NIGHT = (() => {
  let shots = [], cur = null, t = 0, done = null, saved = null;
  const OV = { cap: '', sub: '', fade: 0, red: 0, dim: 0, tint: null, candle: .3 };
  const faceOf = (dx, dy) => { const a = Math.atan2(dy, dx); return ((Math.round((a - Math.PI / 4) / (Math.PI / 4)) % 8) + 8) % 8; };
  const ease = v => v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  // something that walks a polyline at a speed; returns true while moving
  const walker = (pts, sp) => ({ pts, i: 0, x: pts[0][0], y: pts[0][1], sp, dist: 0, face: 0, moving: true,
    step(dt) { if (this.i >= this.pts.length - 1) { this.moving = false; return false; } let m = this.sp * dt; while (m > 0 && this.i < this.pts.length - 1) { const [tx, ty] = this.pts[this.i + 1], dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy); if (d < 1e-4) { this.i++; continue; } this.face = faceOf(dx, dy); const k = Math.min(m, d); this.x += dx / d * k; this.y += dy / d * k; this.dist += k; m -= k; if (k >= d) this.i++; } return true; } });
  const monk = (w, m, pose, fr, jerk) => { const L = lightAt(w.x, w.y), d = 1 - .85 * m; return { s: BEAST(w.face, pose, fr, { morph: Math.round(m * 20) / 20, jerk }), x: w.x, y: w.y, lt: L.map(q => q * d), dark: 6 * m }; };
  const jerkAt = (m, tt) => m > .25 && m < .9 && Math.sin(tt * 80) > .6 ? (Math.sin(tt * 29) > 0 ? .75 : -.6) : undefined;
  const cam = (x, y, k = .06) => { const c = VIEW.camT; c[0] += (x - c[0]) * k; c[1] += (y - c[1]) * k; };
  const kneel = (p, on) => { p.poseO = on ? 'pray' : null; p.frO = on ? 0 : null; };
  const candle = (p, on) => { if (on && !p._o) { p._o = p.o; p.o = p._oc || (p._oc = { ...p.o, prop: 'candle' }); } else if (!on && p._o) { p.o = p._o; delete p._o; } };

  function build() { const lg = G.nightLog, S = lg.start, E = G.players.find(p => p.role === 'enemy'), me = you(), out = [], night = Object.keys(S).map(Number);
    // ---- Compline: the brothers carry candles from the chapel to where they will sleep
    if (G.night > 1) out.push({ len: 3.4, init() { VIEW.fogOff = true; for (const id of night) { const p = G.players[id]; p.x = S[id].x; p.y = S[id].y; p.cineAlive = true; candle(p, true); kneel(p, true); } VIEW.camT = MAP.complineCam.slice(); },
      tick(dt) { OV.cap = 'Compline'; OV.sub = 'The doors are barred. One by one, the candles go out.'; OV.fade = Math.max(0, 1 - t * 2.5); cam(MAP.center[0] - 2, MAP.center[1] + 1, .02); const k = Math.floor((t - .8) / 1.8 * night.length); night.forEach((id, j) => { if (j < k) candle(G.players[id], false); }); OV.dim = Math.max(0, t - .8) * .2; OV.fade = Math.max(OV.fade, (t - 2.7) * 1.6); },
      end() { for (const id of night) candle(G.players[id], false); VIEW.fogOff = false; OV.dim = 0; } });
    else out.push({ len: 6.2, init() { VIEW.fogOff = true; const ids = night.slice(); ids.forEach((id, k) => { const p = G.players[id], a = k / ids.length * 6.28, from = [MAP.gather[0] + Math.cos(a) * 2.2, MAP.gather[1] + Math.sin(a) * 1.4], to = [S[id].x, S[id].y];
          p.cw = walker(densify([from, ...findPath(from[0], from[1], to[0], to[1])], .3), 2.9 + (k % 3) * .2); p.cw.delay = k * .18; p.x = from[0]; p.y = from[1]; p.hidden = false; p.cineAlive = true; candle(p, true); kneel(p, false); });
        VIEW.camT = [MAP.gather[0] - .5, MAP.gather[1] + 3]; },
      tick(dt) { OV.cap = 'Compline'; OV.sub = t < 2 ? 'The last office is sung. The doors are barred until Lauds.' : 'Each brother goes to where he will sleep.'; OV.fade = Math.max(0, 1 - t * 2);
        let cx = 0, cy = 0, n = 0; for (const id of night) { const p = G.players[id], w = p.cw; if ((w.delay -= dt) > 0) continue; if (w.step(dt)) { p.state = 'walk'; p.dist = w.dist; p.face = w.face; cx += w.x; cy += w.y; n++; } else p.state = 'idle'; p.x = w.x; p.y = w.y; }
        if (n) cam(cx / n, cy / n, .04); if (t > 4.6) { const k = Math.floor((t - 4.6) / 1.4 * night.length); night.forEach((id, j) => { if (j < k) candle(G.players[id], false); }); OV.dim = (t - 4.6) * .3; } OV.fade = Math.max(OV.fade, (t - 5.6) * 1.7); },
      end() { for (const id of night) { const p = G.players[id]; candle(p, false); p.x = S[id].x; p.y = S[id].y; p.state = 'idle'; kneel(p, true); delete p.cw; } VIEW.fogOff = false; OV.dim = 0; } });
    // ---- the Vigil: your own night. If his path passes in sight of you, you see a brother go by, and then you see what he is
    const path = lg.path, mine = me.alive && E && E.id !== me.id;
    if (mine) { let seg = null; if (path) { const [ci, cj] = cell(me.x, me.y), vis = path.map(([x, y]) => { const [i, j] = cell(x, y); return Math.hypot(i - ci, j - cj) < SIGHT / CS * .85 && sees(ci, cj, i, j); });
        const a = vis.indexOf(true); if (a >= 0) { let b = a; while (b + 1 < vis.length && vis[b + 1]) b++; seg = path.slice(Math.max(0, a - 10), Math.min(path.length, b + 4)); if (seg.length < 6) seg = null; } }
      out.push({ len: seg ? 10.5 : 5.5, init() { VIEW.camT = [me.x + .6, me.y + 1.2]; kneel(me, true); if (seg) { this.w = walker(seg, 1.15); this.n = seg.length; } },
        tick(dt) { OV.cap = 'The Vigil'; OV.fade = Math.max(0, 1 - t * 2); me.frO = Math.floor(t * 2.5) % 2;
          if (!seg) { OV.sub = t < 2.6 ? `You keep watch in the ${RN(me.night)}. Past midnight, the house is silent.` : 'Somewhere, a door. Footsteps that do not come this way.'; OV.fade = Math.max(OV.fade, (t - 4.6) * 1.2); VIEW.extra = []; return; }
          const w = this.w; if (t > 1.4) w.step(dt); const prog = w.i / this.n, m = ease((prog - .45) / .35); if (m > 0) w.sp = .7;
          OV.sub = t < 1.4 ? `You keep watch in the ${RN(me.night)}. Past midnight, the house is silent.` : m < .05 ? 'A brother passes. Out of bed, after Compline.' : m < 1 ? 'He slows. Something is wrong with his shape.' : 'He is taller than any brother. You did not see his face.';
          if (m > .2) { kneel(me, false); me.face = faceOf(w.x - me.x, w.y - me.y); }
          VIEW.extra = w.moving || t < 9 ? [monk(w, m, w.moving ? 'walk' : 'idle', w.moving ? Math.floor(w.dist * 2.2) % 4 : [0, 0, 2, 0][Math.floor(t * 8) % 4], jerkAt(m, t))] : []; OV.dim = m * .06; OV.fade = Math.max(OV.fade, (t - 9.4) * 1); },
        end() { VIEW.extra = []; kneel(me, true); OV.dim = 0; } }); }
    // ---- the Taking: the first brother he goes to. He comes as a brother, and changes on the way
    const tid = lg.targets && lg.targets[0];
    if (tid != null && E && path) { const v = G.players[tid], protectedHim = lg.protect === tid, killed = lg.dead.includes(tid), body = G.bodies.find(b => b.id === tid);
      let k = path.findIndex(([x, y]) => Math.hypot(x - v.x, y - v.y) < 1.4); if (k < 0) k = path.length - 1; let a = k; while (a > 0 && Math.hypot(path[a][0] - v.x, path[a][1] - v.y) < 7.5) a--;
      const seg = path.slice(a, k + 1), ret = path.slice(k, Math.min(path.length, k + 18));
      const youAre = E.id === G.you;
      out.push({ len: protectedHim ? 11 : 10, init() { VIEW.anonKeep = v.id; if (window.musicTake) musicTake('bed'); VIEW.fogFrom = [v.x, v.y]; VIEW.camT = [v.x + .4, v.y + 1.4]; v.cineAlive = true; v.hidden = false; candle(v, true); kneel(v, true); if (body) body.cineHide = true; this.w = walker(seg.length > 1 ? seg : [[v.x + 4, v.y + 4], [v.x + 1, v.y + 1]], 1.15); this.ph = 0; },
        tick(dt) { const w = this.w, d = Math.hypot(w.x - v.x, w.y - v.y), m = ease((5.2 - d) / 3.4); OV.fade = Math.max(0, 1 - t * 2);
          OV.cap = `The ${RN(roomAt(v.x, v.y))}`;
          if (this.ph === 0) { OV.sub = t < 1.6 ? (youAre ? `You go to Brother ${v.short}. He prays by one candle.` : `Brother ${v.short} could not sleep. He prays by one candle.`) : m < .05 ? 'The door opens. Only a brother, come to sit with him.' : 'The candle leans away from him.';
            if (t > 1.3) { if (m > 0) w.sp = .65; if (!w.step(dt) || d < 1.3) { this.ph = 1; this.t1 = t; this.len = Math.max(this.len, t + (protectedHim ? 6 : 4)); if (window.musicTake && !protectedHim) musicTake('sting'); } }
            if (m > .5) { kneel(v, false); v.face = faceOf(w.x - v.x, w.y - v.y); }
            VIEW.extra = [monk(w, m, w.moving ? 'walk' : 'idle', w.moving ? Math.floor(w.dist * 2.2) % 4 : 0, jerkAt(m, t))]; OV.dim = m * .08; OV.candle = .3 * (1 - m * .6) + Math.max(0, Math.sin(t * 61)) * .08 * m; return; }
          const h = t - this.t1; w.face = faceOf(v.x - w.x, v.y - w.y);
          if (protectedHim) { OV.sub = h < 2.2 ? 'It stands over him. It does not touch him.' : 'Someone keeps watch over him tonight. It goes back the way it came.';
            if (h > 2.2) { if (!this.back) { if (window.musicTake) musicTake('leave'); this.back = walker(ret.length > 1 ? ret : [[w.x, w.y], [w.x + 4, w.y + 4]], .9); } const b = this.back; b.step(dt); w.x = b.x; w.y = b.y; w.face = b.face; }
            const mm = h > 2.2 ? 1 - ease((h - 2.2) / 2.5) : 1; VIEW.extra = [monk(w, mm, this.back ? 'walk' : 'idle', this.back ? Math.floor(this.back.dist * 2.2) % 4 : [0, 0, 2, 0][Math.floor(h * 8) % 4], undefined)];
            OV.fade = Math.max(OV.fade, (h - 4.6) * 1.2); return; }
          OV.sub = 'Brother ' + v.short + ' does not look up.'; VIEW.extra = [monk(w, 1, 'idle', [0, 0, 2, 0, 0, 2][Math.floor(h * 9) % 6], h > .6 && h < 1 ? .8 : undefined)]; OV.dim = .08 + h * .2; OV.candle = Math.max(0, .3 - h * .2);
          if (h > 1.5) { OV.fade = 1; OV.sub = ''; OV.cap = ''; } if (h > 2.2 && !this.dead) { this.dead = 1; candle(v, false); if (killed) { v.cineAlive = false; if (body) body.cineHide = false; } VIEW.extra = []; }
          if (h > 2.2) { OV.red = Math.max(0, .85 - (h - 2.2) * 1.4); OV.fade = h < 3 ? .55 : Math.min(1, .55 + (h - 3) * 1.2); } },
        end() { if (window.musicTake) musicTake('off'); VIEW.extra = []; VIEW.fogFrom = null; candle(v, false); v.cineAlive = false; if (body) body.cineHide = false; kneel(v, false); OV.red = 0; OV.dim = 0; OV.candle = .3; } });
      if (lg.targets.length > 1) out.push({ len: 2.6, init() {}, tick() { OV.fade = 1; OV.cap = 'And again, before Lauds.'; OV.sub = ''; }, end() {} }); }
    // ---- the Walls (the town): the dead come out of the dark beyond the gate in the night's numbers and press at the stakes; some of them
    // wear the clothes of the town's own dead. The walls hold, or they give at the gate and the dead come through.
    if (STRIG() && lg.horde && MAP.G && window.TKIT) { const H = lg.horde, WL = MAP.G.WALL, GT = MAP.G.GATE, wy = WL[3], gone = G.players.filter(p => !p.alive && !lg.dead.includes(p.id)), breach = H.breach != null;
      const N = Math.min(34, Math.max(9, Math.round(H.n * 1.1))), r = k => hs(k * 7 + G.night * 31, 3);
      out.push({ len: breach ? 10 : 9, init() { VIEW.fogOff = true; VIEW.outDark = wy + .35; VIEW.camT = [(GT[0] + GT[1]) / 2 - .5, wy + .5];
          this.d = Array.from({ length: N }, (_, k) => { const x = (GT[0] + GT[1]) / 2 + (r(k) - .5) * 26, gate = breach && k < 6, tx = gate ? GT[0] + .6 + r(k + 50) * (GT[1] - GT[0] - 1.2) : x + (r(k + 9) - .5) * 1.5, ty = gate ? wy - 3 - r(k + 70) * 3 : wy + .7 + r(k + 3) * .8;
            const wear = gone.length && r(k + 90) < .35 ? gone[k % gone.length] : null;
            return { x, y: wy + 3.2 + r(k + 5) * 1.6, tx, ty, gate, sp: .55 + r(k + 11) * .35, delay: r(k + 13) * 2.8, face: 0, f: 0, seed: k, wear, at: false }; }); },
        tick(dt) { OV.cap = 'The Walls'; OV.fade = Math.max(0, 1 - t * 2); const L = [];
          OV.sub = t < 2.6 ? `Out past the gate, in the dark: ${H.n} of the dead.` : t < 5.6 ? 'They come to the stakes, and they lean on them, and they push.' : breach ? 'At the gate, something gives.' : `The walls hold (${H.def}). At first light they go back into the dark.`;
          for (const d of this.d) { if ((d.delay -= dt) <= 0) { const gx = breach && d.gate && t > 5.6 ? d.tx : d.tx, gy = d.gate && !(breach && t > 5.6) ? wy + .8 : d.ty, dx = gx - d.x, dy = gy - d.y, dd = Math.hypot(dx, dy);
              if (dd > .1) { const m = Math.min(dd, d.sp * dt); d.x += dx / dd * m; d.y += dy / dd * m; d.face = faceOf(dx, dy); d.f += m * 2.4; d.at = false; } else d.at = true; }
            const sway = d.at ? Math.sin(t * 3 + d.seed) * .06 : 0, fr = Math.floor(d.f) % 4, lt = lightAt(d.x, d.y);
            const sp = d.wear ? spr(d.wear.o, d.face, d.at ? 'idle' : 'walk', d.at ? 0 : fr) : TKIT.dead('neighbour', d.face, d.at ? 'idle' : 'walk', d.at ? (Math.floor(t * 4 + d.seed) % 4) : fr, d.seed);
            const dk = d.y > wy + .35 ? Math.max(.1, .6 - (d.y - wy - .35) * .25) : 1; L.push({ s: sp, x: d.x + sway, y: d.y, lt: (d.wear ? lt.map((q, i) => q * [.55, .66, .55][i]) : lt).map(q => q * dk) }); }
          VIEW.extra = L; if (breach && t > 5.6) OV.red = Math.max(OV.red, Math.min(.45, (t - 7.6) * .3)); OV.fade = Math.max(OV.fade, (t - (breach ? 8.8 : 7.8)) * 1.1); },
        end() { VIEW.extra = []; VIEW.fogOff = false; VIEW.outDark = null; OV.red = 0; } }); }
    // ---- Lauds
    out.push({ len: 2.4, init() {}, tick() { OV.fade = 1; OV.cap = 'Lauds'; OV.sub = 'The bell is rung.'; }, end() {} });
    return out; }


  // ---- the hanging, at Vespers in the cloister. kind: 'good' (only a brother), 'evil' (the hollow leaves him), 'heir' (it passes into the house)
  const GIB = MAP.gibbet, P0 = [GIB[0] + 1.05, GIB[1] - 1.05];
  const mk = (w, h, ox, oy, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f(g); return { w, h, ox, oy, canvas: c, data: g.getImageData(0, 0, w, h).data }; };
  const pp = (g, x, y, c, w = 1, h = 1) => { g.fillStyle = `rgb(${c})`; g.fillRect(x, y, w, h); };
  const EMPTY = mk(1, 1, 0, 0, () => {});
  let gibS = null; const ropeS = {};
  const gibbet = () => gibS || (gibS = mk(32, 92, -5, -90, g => { const D = [46, 32, 22], M = [86, 58, 36], L = [124, 90, 56], SN = [214, 222, 236];
    pp(g, 3, 6, D, 1, 82); pp(g, 4, 6, L, 1, 82); pp(g, 5, 6, M, 1, 82); pp(g, 6, 6, D, 1, 82); for (let y = 14; y < 86; y += 11) pp(g, 5, y, D);
    pp(g, 0, 86, D, 11, 3); pp(g, 0, 86, M, 11, 1); pp(g, 1, 85, SN, 9, 1);
    pp(g, 3, 5, D, 25, 1); pp(g, 3, 6, L, 25, 1); pp(g, 3, 7, M, 25, 1); pp(g, 3, 8, D, 25, 1); pp(g, 26, 9, D, 2, 2); pp(g, 4, 4, SN, 22, 1);
    for (let k = 0; k < 11; k++) { pp(g, 7 + k, 20 - k, M, 2, 1); pp(g, 7 + k, 21 - k, D, 2, 1); } pp(g, 18, 9, D); }));
  const rope = a => { const key = Math.round(a * 8); if (ropeS[key]) return ropeS[key]; const ang = key / 8 * .22, len = 25, R = [150, 128, 88], RD = [92, 76, 50];
    return ropeS[key] = mk(24, 40, 9, -81, g => { let ex = 12, ey = 0; for (let k = 0; k <= len; k++) { const x = Math.round(12 + Math.sin(ang) * k), y = Math.round(Math.cos(ang) * k); pp(g, x, y, k % 3 ? R : RD); ex = x; ey = y; }
      for (const [dx, dy] of [[-1, 1], [-2, 2], [-2, 3], [-2, 4], [-1, 5], [0, 6], [1, 5], [2, 4], [2, 3], [2, 2], [1, 1]]) pp(g, ex + dx, ey + dy, dy > 3 ? RD : R); }); };
  const prop = (s, x, y, d = 0) => ({ s, x: x + d, y: y + d, lt: lightAt(x, y) });
  function hangShots(id, kind) { const v = G.players[id], ring = G.players.filter(p => p.alive && p.id !== id), n = ring.length, out = [];
    const spot = k => { const half = Math.ceil(n / 2), side = k < half, j = side ? k : k - half, m = side ? half : n - half, a = (side ? -100 + j / Math.max(1, m - 1) * 105 : 85 + j / Math.max(1, m - 1) * 105) * Math.PI / 180, r = 3.3 + (j % 2) * .5; return [P0[0] + Math.cos(a) * r, P0[1] + Math.sin(a) * r]; };
    const props = sw => [prop(gibbet(), GIB[0], GIB[1]), prop(rope(sw), GIB[0], GIB[1], .3)];
    // Vespers: the house has gathered in the snow; he is brought out to them
    out.push({ len: 7.5, init() { VIEW.fogOff = true; ring.forEach((p, k) => { const [x, y] = spot(k); p.x = x; p.y = y; p.cineAlive = true; p.hidden = false; candle(p, true); kneel(p, false); p.face = faceOf(P0[0] - x, P0[1] - y); p.state = 'idle'; });
        v.cineAlive = true; v.hidden = false; candle(v, false); const from = MAP.hangFrom.slice(); v.x = from[0]; v.y = from[1]; this.w = walker(densify([from, ...findPath(from[0], from[1], P0[0], P0[1])], .3), 1.05); VIEW.camT = [P0[0] - 2.5, P0[1] - 2.2]; },
      tick(dt) { OV.cap = 'Vespers'; OV.sub = t < 3.2 ? `The Hearing has spoken. Brother ${v.short} is led out into the snow.` : 'The house has come to watch. No one speaks for him.'; OV.fade = Math.max(0, 1 - t * 1.8);
        const w = this.w; if (t > .8 && w.step(dt)) { v.state = 'walk'; v.dist = w.dist; v.face = w.face; } else { v.state = 'idle'; if (!w.moving) v.face = 0; } v.x = w.x; v.y = w.y; cam(w.x + .6, w.y + .9, .035);
        VIEW.extra = props(Math.sin(t * 1.3) * .3); OV.candle = .3; },
      end() { v.x = P0[0]; v.y = P0[1]; v.state = 'idle'; v.face = 0; } });
    // the bell: they kneel, it is rung once, and the light goes
    out.push({ len: 5.2, init() { ring.forEach(p => kneel(p, true)); VIEW.camT = [P0[0] + .2, P0[1] + .9]; },
      tick(dt) { OV.cap = 'Vespers'; OV.sub = t < 2.4 ? 'They kneel. He stands under the beam with the rope about him.' : 'The bell is rung once.'; cam(P0[0] - .2, P0[1] + .5, .02); ring.forEach(p => p.frO = Math.floor(t * 2.2 + p.id) % 2);
        VIEW.extra = props(0); OV.flash = t > 3 ? Math.max(0, .35 - (t - 3) * 1.2) : 0; OV.fade = Math.max(0, (t - 3.6) * 1.8); },
      end() { OV.flash = 0; } });
    out.push({ len: 1.8, init() { v.hidden = true; v.cineAlive = false; }, tick() { OV.fade = 1; OV.cap = ''; OV.sub = 'The rope creaks.'; }, end() {} });
    // after: the empty rope, and what left him (if anything did)
    const sub = kind === 'good' ? ['The rope swings. He was only a brother.', 'Snow settles on the beam. The candle burns down as it did.']
      : kind === 'evil' ? ['Something leaves him as the rope goes taut.', 'It scatters in the snow. The candle steadies.']
      : ['Something leaves him as the rope goes taut.', 'It does not go out into the snow. It goes into the house.'];
    out.push({ len: kind === 'good' ? 6 : 8, init() { if (kind === 'good' && window.musicTaunt) musicTaunt(); ring.forEach(p => { kneel(p, false); p.face = faceOf(P0[0] - p.x, P0[1] - p.y); }); VIEW.camT = [P0[0] - .6, P0[1] + .4]; this.sh = { s: EMPTY, x: P0[0], y: P0[1], dark: 0, fade: 1 }; this.path = kind === 'heir' ? densify([[P0[0], P0[1]], [P0[0] + 1.6, P0[1] + 1.2], [P0[0] + 2.4, P0[1] + 3.6], [P0[0] - .4, P0[1] + 4.6]], .2) : null; },
      tick(dt) { OV.cap = 'Vespers'; OV.fade = Math.max(0, 1 - t * 1.2); OV.sub = t < 3.2 ? sub[0] : sub[1]; const sw = Math.sin(t * 1.7) * Math.max(0, 1 - t / 7);
        const L = [...props(sw)], sh = this.sh;
        if (kind === 'evil') { const a = t < 1 ? 0 : t < 2.4 ? ease((t - 1) / 1.4) : Math.max(0, 1 - (t - 3.2) * .45); sh.dark = 1.6 * a; sh.fade = a * .8; sh.y = P0[1] - Math.max(0, t - 2.4) * .05; sh.x = P0[0] - Math.max(0, t - 2.4) * .05;
          sh.s = BEAST(0, 'idle', [0, 0, 2, 0, 0, 2][Math.floor(t * 9) % 6], { morph: 1, jerk: Math.sin(t * 70) > .7 ? .8 : undefined }); OV.candle = .3 + Math.max(0, t - 3.4) * .1; }
        if (kind === 'heir') { const a = t < 1 ? 0 : Math.min(1, (t - 1) / 1.2) * (t > 6.2 ? Math.max(0, 1 - (t - 6.2) * .9) : 1), P = this.path; sh.dark = 1.4 * a; sh.fade = a * .75; let moving = false;
          if (t > 2.6) { const k = Math.min(P.length - 1, Math.floor((t - 2.6) * P.length / 3.6)), dx = P[k][0] - sh.x, dy = P[k][1] - sh.y; if (Math.hypot(dx, dy) > .05) { moving = true; sh.face = faceOf(dx, dy); } sh.x += dx * .09; sh.y += dy * .09; }
          sh.s = BEAST(sh.face || 0, moving ? 'walk' : 'idle', moving ? Math.floor(t * 7) % 4 : [0, 0, 2, 0][Math.floor(t * 8) % 4], { morph: 1 }); }
        if (sh.dark > 0) { sh.lt = lightAt(sh.x, sh.y).map(q => q * .15); L.push(sh); } VIEW.extra = L; if (kind === 'good') OV.dim = Math.min(.12, t * .03); OV.fade = Math.max(OV.fade, (t - (kind === 'good' ? 5.2 : 7.2)) * 1.4); },
      end() { VIEW.extra = []; OV.dim = 0; } });
    return out; }

  // ---- draft: the headsman. The brother who accused takes up the blade; the condemned kneels at a block in the snow
  let blockS = null; const bladeS = {};
  const block = () => blockS || (blockS = mk(16, 12, -8, -10, g => { const D = [52, 34, 22], M = [96, 64, 40], L = [134, 96, 60], SN = [214, 222, 236]; pp(g, 1, 3, M, 14, 7); pp(g, 1, 3, L, 14, 2); pp(g, 1, 9, D, 14, 1); pp(g, 0, 3, D, 1, 7); pp(g, 15, 3, D, 1, 7); pp(g, 2, 2, SN, 11, 1); pp(g, 6, 4, D, 3, 1); pp(g, 2, 10, [40, 44, 60], 13, 2); }));
  const blade = a => { const k = Math.round(a * 20); if (bladeS[k]) return bladeS[k]; const ang = k / 20, c = Math.cos(ang), sn = Math.sin(ang);
    return bladeS[k] = mk(80, 80, -40 + 4, -40 - 28, g => { const at = (d, w, col) => { for (let q = -w; q <= w; q++) { g.fillStyle = `rgba(${col},${254 / 255})`; g.fillRect(Math.round(40 + c * d - sn * q * .7), Math.round(40 + sn * d + c * q * .7), 1, 1); } };
      for (let d = -6; d < 0; d++) at(d, 0, [70, 44, 28]); at(0, 3, [176, 132, 58]); for (let d = 1; d < 34; d++) { at(d, 1, d % 5 ? [118, 124, 140] : [96, 100, 114]); at(d, 0, [196, 204, 220]); } at(34, 0, [170, 176, 190]); }); };
  function bladeShots(id, kind, byId) { const v = G.players[id], ring = G.players.filter(p => p.alive && p.id !== id), ex = G.players[byId != null && G.players[byId].alive && byId !== id ? byId : ring[0].id], others = ring.filter(p => p !== ex), n = others.length, out = [];
    const B = [P0[0] - .9, P0[1] + .9], EX = [P0[0] + .75, P0[1] - .55], spot = k => { const half = Math.ceil(n / 2), side = k < half, j = side ? k : k - half, m = side ? half : n - half, a = (side ? -110 + j / Math.max(1, m - 1) * 95 : 105 + j / Math.max(1, m - 1) * 95) * Math.PI / 180, r = 4.4 + (j % 2) * .6; return [P0[0] + Math.cos(a) * r, P0[1] + Math.sin(a) * r]; };
    let ang = 1.75; const exO = { ...ex.o, ...ANON, prop: undefined }; OV.glows = [[P0[0] - .2, P0[1] + .5, 26, .34]];
    const props = () => [prop(block(), B[0], B[1]), { s: blade(ang), x: EX[0] + .02, y: EX[1] + .02, lt: lightAt(EX[0], EX[1]) }];
    out.push({ len: 7.5, init() { VIEW.fogOff = true; others.forEach((p, k) => { const [x, y] = spot(k); p.x = x; p.y = y; p.cineAlive = true; p.hidden = false; candle(p, true); kneel(p, false); p.face = faceOf(P0[0] - x, P0[1] - y); p.state = 'idle'; });
        ex._o2 = ex.o; ex.o = exO; ex.x = EX[0]; ex.y = EX[1]; ex.face = faceOf(B[0] - EX[0], B[1] - EX[1]); ex.cineAlive = true; ex.hidden = false; ex.state = 'idle';
        v.cineAlive = true; v.hidden = false; candle(v, false); const from = MAP.hangFrom.slice(); v.x = from[0]; v.y = from[1]; this.w = walker(densify([from, ...findPath(from[0], from[1], P0[0], P0[1])], .3), 1.05); VIEW.camT = [P0[0] - 2.5, P0[1] - 2.2]; },
      tick(dt) { OV.cap = 'Vespers'; OV.sub = t < 3.2 ? `The Hearing has spoken. Brother ${v.short} is led out into the snow.` : `Brother ${ex.short} accused him. He has taken up the blade.`; OV.fade = Math.max(0, 1 - t * 1.8);
        const w = this.w; if (t > .8 && w.step(dt)) { v.state = 'walk'; v.dist = w.dist; v.face = w.face; } else { v.state = 'idle'; } v.x = w.x; v.y = w.y; cam(w.x + .2, w.y + .9, .035); VIEW.extra = props(); },
      end() { v.x = P0[0]; v.y = P0[1]; v.state = 'idle'; } });
    out.push({ len: 5.4, init() { this.sc = VIEW.scale; VIEW.scale = Math.min(6, VIEW.scale + 1); kneel(v, true); v.frO = 0; v.face = faceOf(B[0] - P0[0], B[1] - P0[1]); others.forEach(p => kneel(p, true)); VIEW.camT = [P0[0] + .1, P0[1] + .7]; },
      tick(dt) { OV.cap = 'Vespers'; OV.sub = t < 2.4 ? 'He kneels at the block. The brothers kneel with him.' : 'The blade goes up.'; cam(P0[0], P0[1] + .4, .02); others.forEach(p => p.frO = Math.floor(t * 2.2 + p.id) % 2);
        ang = t < 2.4 ? 1.75 : t < 4.1 ? 1.75 - ease((t - 2.4) / 1.7) * 3.3 : t < 4.3 ? -1.55 + ease((t - 4.1) / .2) * 4.0 : 2.45; VIEW.extra = props();
        if (t > 4.28) { OV.red = .8; OV.fade = 1; } },
      end() { VIEW.scale = this.sc; } });
    out.push({ len: 1.8, init() { v.hidden = true; v.cineAlive = false; }, tick() { OV.fade = 1; OV.red = Math.max(0, OV.red - .02); OV.cap = ''; OV.sub = 'It is done in one stroke.'; }, end() { OV.red = 0; } });
    const sub = kind === 'good' ? ['The brothers rise. He was only a brother.', 'Snow covers the block. The candle burns down as it did.'] : kind === 'evil' ? ['Something leaves him as the blade falls.', 'It scatters in the snow. The candle steadies.'] : ['Something leaves him as the blade falls.', 'It does not go out into the snow. It goes into the house.'];
    out.push({ len: kind === 'good' ? 6 : 8, init() { if (kind === 'good' && window.musicTaunt) musicTaunt(); ang = 2.6; others.forEach(p => { kneel(p, false); p.face = faceOf(P0[0] - p.x, P0[1] - p.y); }); VIEW.camT = [P0[0] - .6, P0[1] + .4]; this.sh = { s: EMPTY, x: P0[0], y: P0[1], dark: 0, fade: 1 }; },
      tick(dt) { OV.cap = 'Vespers'; OV.fade = Math.max(0, 1 - t * 1.2); OV.sub = t < 3.2 ? sub[0] : sub[1]; const L = props(), sh = this.sh;
        if (kind !== 'good') { const a = t < 1 ? 0 : t < 2.4 ? ease((t - 1) / 1.4) : Math.max(0, 1 - (t - 3.2) * .45); sh.dark = 1.6 * a; sh.fade = a * .8; sh.s = BEAST(0, 'idle', [0, 0, 2, 0, 0, 2][Math.floor(t * 9) % 6], { morph: 1 }); sh.lt = lightAt(sh.x, sh.y).map(q => q * .15); if (sh.dark > 0) L.push(sh); }
        VIEW.extra = L; OV.fade = Math.max(OV.fade, (t - (kind === 'good' ? 5.2 : 7.2)) * 1.4); },
      end() { VIEW.extra = []; OV.glows = null; if (ex._o2) { ex.o = ex._o2; delete ex._o2; } } });
    return out; }
  let onDone = null, posSave = null;
  function hang(id, kind, cb, how, by) { saved = { scale: VIEW.scale, cam: VIEW.camT, phase: G.phase }; posSave = G.players.map(p => [p.x, p.y, p.face, p.state]); onDone = cb || (() => {}); G.phase = 'cine';
    VIEW.scale = Math.min(5, saved.scale + 1); VIEW.cine = true; VIEW.noRing = true; VIEW.camT = [0, 0]; document.body.classList.add('cine'); shots = how === 'blade' ? bladeShots(id, kind, by) : hangShots(id, kind); cur = null; next(); }
  function play() { onDone = null; VIEW.anon = QS.get('anon') !== '0'; VIEW.nightMode = QS.get('night') || 'dark'; G.phase = 'cine'; saved = { scale: VIEW.scale, cam: VIEW.camT }; VIEW.scale = Math.min(5, saved.scale + 1); VIEW.cine = true; VIEW.noRing = true; VIEW.camT = [0, 0];
    document.body.classList.add('cine'); shots = build(); cur = null; next(); }
  function next() { if (cur) cur.end(); cur = shots.shift(); t = 0; if (!cur) return finish(); cur.init(); }
  function finish() { if (cur) cur.end(); cur = null; shots = []; for (const p of G.players) { candle(p, false); p.poseO = null; p.frO = null; p.cineAlive = false; p.hidden = false; delete p.cw; } for (const b of G.bodies) b.cineHide = false;
    VIEW.extra = []; VIEW.fogFrom = null; VIEW.fogOff = false; VIEW.cine = false; VIEW.anon = false; VIEW.anonKeep = null; VIEW.noRing = false; VIEW.camT = null; VIEW.scale = saved ? saved.scale : VIEW.scale; Object.assign(OV, { cap: '', sub: '', fade: 0, red: 0, dim: 0, tint: null, candle: .3, flash: 0, glows: null });
    document.body.classList.remove('cine'); if (onDone) { const f = onDone; onDone = null; G.players.forEach((p, i) => { [p.x, p.y, p.face, p.state] = posSave[i]; }); if (G.phase === 'cine') G.phase = saved.phase; f(); return; } for (const p of G.players) { const st = G.nightLog.start[p.id]; if (st) { p.x = st.x; p.y = st.y; } p.state = 'idle'; }
    if (G.phase === 'cine') { G.phase = 'nightsim'; if (NETH() && NETH().guest) NETH().cineDone(); else dawn(); } }
  function tick(dt) { if (!cur) return; t += dt; cur.tick(dt); if (t >= cur.len) next(); }
  function draw() { const W = cv.width, H = cv.height, x = ctx, sc = VIEW.scale;
    x.globalCompositeOperation = 'lighter';
    for (const p of G.players) { if (p.hidden || !p._o || (!p.alive && !p.cineAlive) || !seen(p)) continue; const [sx, sy] = isoP(p.x + .35, p.y + .1, 27), X = (sx - VIEW.cx) * sc, Y = (sy - VIEW.cy) * sc, r = (9 + Math.sin(G.t * 13 + p.id) * .8) * sc;
      const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(255,170,80,${OV.candle * (nightDim(p) ? .3 : 1)})`); g.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2); }
    for (const [gx, gy, gr, ga] of OV.glows || []) { const [sx, sy] = isoP(gx, gy, 14), X = (sx - VIEW.cx) * sc, Y = (sy - VIEW.cy) * sc, r = gr * sc * (1 + Math.sin(G.t * 9) * .04); const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(255,150,70,${ga})`); g.addColorStop(1, 'rgba(255,110,40,0)'); x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2); }
    x.globalCompositeOperation = 'source-over';
    if (OV.dim) { x.fillStyle = `rgba(0,0,0,${OV.dim})`; x.fillRect(0, 0, W, H); } if (OV.red) { x.fillStyle = `rgba(120,0,0,${OV.red})`; x.fillRect(0, 0, W, H); } if (OV.flash) { x.fillStyle = `rgba(255,240,214,${OV.flash})`; x.fillRect(0, 0, W, H); } if (OV.fade) { x.fillStyle = `rgba(0,0,0,${Math.min(1, OV.fade)})`; x.fillRect(0, 0, W, H); }
    const bar = Math.round(H * .11); x.fillStyle = '#000'; x.fillRect(0, 0, W, bar); x.fillRect(0, H - bar * 1.25, W, bar * 1.25);
    x.textAlign = 'center'; if (OV.cap) { x.font = `${Math.round(H * .06)}px "Jacquard 24"`; x.fillStyle = '#d8b060'; x.fillText(tw(OV.cap), W / 2, H - bar * .62); }
    if (OV.sub) { x.font = `${Math.round(H * .026)}px "Pixelify Sans"`; x.fillStyle = 'rgba(236,226,200,.86)'; x.fillText(tw(OV.sub), W / 2, H - bar * .2); } }
  return { play, hang, tick, draw, on: () => !!cur, skip: () => { if (cur) finish(); }, OV };
})();
// ---------------------------------------------------------------- the loop
let last = 0;
// panels turn to glass when your brother walks under them, so the house behind stays readable (as the Lords table does)
let glassT = 0; const GLASS_PAD = 36;
function glassCheck() { if (G.t - glassT < .12) return; glassT = G.t; const me = G.players[LOCAL]; const on = G.phase === 'day' && me && !G.demo && cv;
  const [sx, sy] = on ? isoP(me.x, me.y) : [0, 0], px = (sx - VIEW.cx) * VIEW.scale, py = (sy - VIEW.cy) * VIEW.scale, head = 48 * VIEW.scale;
  document.querySelectorAll('.left>.v,.right>.v,#acts').forEach(el => { let g = false, gd = 0; if (on) { const r = el.getBoundingClientRect(); g = px > r.left - GLASS_PAD && px < r.right + GLASS_PAD && py > r.top - GLASS_PAD && py - head < r.bottom + GLASS_PAD;
    // deeper under the panel = clearer still: 0 at its edge, 1 once he is ~90px inside it
    if (g) gd = Math.max(0, Math.min(1, Math.min(px - r.left, r.right - px, py - r.top, r.bottom - (py - head)) / 90)); }
    el.classList.toggle('glass', g); const v = gd.toFixed(2); if (el._gd !== v) { el._gd = v; el.style.setProperty('--gd', v); } }); }
let rafAt = 0, bgAt = 0;
setInterval(() => { const now = performance.now(); if (now - rafAt < 300 || G.headless || !cv) { bgAt = now; return; } let el = Math.min(3, (now - (bgAt || now)) / 1000); bgAt = now;
  try { while (el > 1e-4) { const d = Math.min(.05, el); update(d); el -= d; } } catch (e) { if (!loop.bgErr) { loop.bgErr = 1; console.error('background step', e); } } }, 250);
function loop(ts) { requestAnimationFrame(loop); rafAt = bgAt = performance.now(); const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  // an error in one frame must never stop the game; log it once and carry on
  try { if (!G.headless) update(dt); VIEW.fi = Math.floor(G.t * 6) % VIEW.frames.length; if (!G.headless) { frame(); if (NIGHT.on()) NIGHT.draw(); glassCheck(); } } catch (e) { if (!loop.err) { loop.err = 1; console.error('frame error', e); } } }
function update(dt) { G.t += dt; if (G.phase === 'cine' || NIGHT.on()) { NIGHT.tick(dt); return; }
  const N = NETH(); if (N && N.guest) { N.tick(dt); if (G.phase === 'day') { renderActs(); $('timer').textContent = `${String(Math.floor(G.timer / 60)).padStart(2, '0')}:${String(Math.floor(G.timer % 60)).padStart(2, '0')}`; } else $('timer').textContent = '--:--'; return; }
  if (N && N.host) N.tick(dt); if (G.demo) demoTick(dt); if (G.screen) screenTick(dt);
  if (G.phase === 'day') { G.timer -= dt; if (hasGate()) roamTick(dt); if (STRIG() && MAP.wastes && G.timer < 30 && !G.gateWarn) { G.gateWarn = true; for (const p of living()) { if (p._out && !p.banished && isHuman(p.id)) asSeat(p.id, () => flash('The dusk bell. The gate shuts soon: get inside the walls, or spend the night in the Wastes.')); if (p._out && !p.banished && !isHuman(p.id) && !(team(p) === 'evil' && rnd() < .3)) { if (p.state !== 'search') { p.plan = null; p.path = []; } p.wait = 0; p.goHome = true; } } }
    if (G.timer <= 0) { G.timer = 0; startHearing(); }
    for (let k = G.timers.length - 1; k >= 0; k--) if (G.timers[k][0] <= G.t) { const f = G.timers[k][1]; G.timers.splice(k, 1); f(); }
    if (!G.demo && LOCAL >= 0) keyMove(dt, G.players[LOCAL]); for (const id of humansNow()) if (id !== LOCAL && G.players[id].kdir) { const p = G.players[id]; keyMove(dt, p, p.kdir); p.walkKey = true; } else if (id !== LOCAL && G.players[id].walkKey) { G.players[id].walkKey = false; if (G.players[id].state === 'walk' && !G.players[id].path.length) G.players[id].state = 'idle'; }
    if (STRIG() && G.town) { for (const p of G.players) { if (!p.alive) continue; if (p.banished && p.y < (MAP.fieldY || 28.4)) { p.y = MAP.fieldY || 28.4; p.path = []; p.kdir = null; } if (p.lockedOut && !P.rooms[roomAt(p.x, p.y)].outside) { p.y = MAP.fieldY || 28.4; p.path = []; p.kdir = null; } const o = !!P.rooms[roomAt(p.x, p.y)].outside; if (o && G.phase === 'day') { p.dayOut = (p.dayOut || 0) + dt; if (MAP.pois) for (const q of living()) if (q.id !== p.id && Math.hypot(q.x - p.x, q.y - p.y) < 3 && P.rooms[roomAt(q.x, q.y)].outside) (p.alone = p.alone || {})[q.id] = G.day; } if (p._out != null && o !== p._out && hasGate() && !G.town.gate && G.phase === 'day' && p._lx != null) { p.x = p._lx; p.y = p._ly; p.path = []; p.kdir = null; if (p.state === 'walk') p.state = 'idle'; if (isHuman(p.id) && (!p._gm || G.t - p._gm > 3)) { p._gm = G.t; asSeat(p.id, () => flash(p._out ? 'The gate is shut. Someone inside must open it: knock, and wait.' : 'The gate is shut. The lever is by the gate, on this side.')); } if (p._out && (!G.town.knock || G.t - G.town.knock > 12)) { G.town.knock = G.t; for (const h of humansNow()) if (h !== p.id && G.players[h].alive && !G.players[h]._out) asSeat(h, () => flash(`${p.short} is knocking at the gate.`)); } } p._lx = p.x; p._ly = p.y; const o2 = !!P.rooms[roomAt(p.x, p.y)].outside;
      if (p._out == null) p._out = o2; else if (o2 !== p._out) { p._out = o2; tlog(o2 ? `${p.short} went out of the gate.` : `${p.short} came back in through the gate.`); } }
      if (G.town.log.length !== G.town._n) { G.town._n = G.town.log.length; renderCase(); }
      for (const id of humansNow()) asSeat(id, stashTick); }
    for (const id of humansNow()) { const me = G.players[id]; if (me.state === 'search') { me.st -= dt; if (me.st <= 0) { me.state = 'idle'; finishSearch(me, me.spot); } } }
    for (const p of G.players) { if (p.alive) { if (!(isHuman(p.id) && p.walkKey)) step(p, dt); botThink(p, dt); } else if (isHuman(p.id)) step(p, dt); }
    if ((G.t * 4 | 0) !== (G.lastAct | 0)) { G.lastAct = G.t * 4; renderActs(); }
    $('timer').textContent = `${String(Math.floor(G.timer / 60)).padStart(2, '0')}:${String(Math.floor(G.timer % 60)).padStart(2, '0')}`; }
  else $('timer').textContent = '--:--'; }


// ---------------------------------------------------------------- the big screen (Jackbox style): a host with no brother of its own.
// It shows the house with every brother in it, the Brethren, the Table, the candle, and a banner with what the table is waiting on.
// It never shows a role, a casebook, a whisper or a night choice: those are on each player's phone.
const SCR = { k: '', t: 0, cam: null };
function screenTick(dt) { SCR.t += dt;
  if (!NIGHT.on()) { const L = living(), c = L.length ? [L.reduce((a, p) => a + p.x, 0) / L.length, L.reduce((a, p) => a + p.y, 0) / L.length] : MAP.center, C0 = MAP.center, T = [C0[0] + (c[0] - C0[0]) * .55, C0[1] + (c[1] - C0[1]) * .55];
    if (!SCR.cam || !VIEW.camT) SCR.cam = T.slice(); SCR.cam[0] += (T[0] - SCR.cam[0]) * Math.min(1, dt * .6); SCR.cam[1] += (T[1] - SCR.cam[1]) * Math.min(1, dt * .6); VIEW.camT = SCR.cam.slice(); }
  if (SCR.t > .3) { SCR.t = 0; renderScreen(); if (SCR.ph !== G.phase + G.day + '|' + G.clock) { SCR.ph = G.phase + G.day + '|' + G.clock; renderTop(); renderClock(); } } }
const ORDN = n => ['', '', '', '', '', '', 'six', 'seven', 'eight', 'nine', 'ten'][n] || n;
function renderScreen(force) { if (!G.screen) return; let el = $('scr'); if (!el) { el = document.createElement('div'); el.id = 'scr'; el.className = 'v p'; document.body.appendChild(el); }
  const hs = humansNow(), nm = id => `<b style="color:${G.players[id].col}">${G.players[id].short}</b>${G.names[id] && !G.players[id].named ? ` <small>(${G.names[id]})</small>` : ''}`, rdy = () => hs.length ? `<p class="sc2">${hs.filter(h => G.ready[h]).length} of ${hs.length} ready</p>` : '';
  const code = NETH() && NETH().code; let h = '';
  if (G.phase === 'over') { const good = G.over === 'good'; h = `<div class="sc1"><span class="cap">T</span>${good ? 'he Hollow Brother hangs' : 'he house is his'}</div><p class="sc2">${good ? 'The thaw comes to a quiet house. The faithful win.' : 'By the thaw, there is no one left to ring the bell. The evil win.'}</p><div class="roles">${G.players.map(p => `<div class="s ${p.alive ? '' : 'dead'}"><i class="sw" style="background:${p.col}"></i><b>${p.short}${G.names[p.id] && !p.named ? ` <small>${G.names[p.id]}</small>` : ''}<small>${ROLES[p.role].name}${p.wasRole ? ' (was the ' + ROLES[p.wasRole].name + ')' : ''}</small></b><span class="${team(p) === 'evil' ? 'ev' : 'gd'}">${team(p) === 'evil' ? 'evil' : 'faithful'}</span></div>`).join('')}</div><div class="row" style="justify-content:center"><span class="btn go" data-scr="again">Another night</span><span class="btn" data-scr="menu">Leave</span></div>`; }
  else if (G.phase === 'cine' || G.phase === 'nightsim' || NIGHT.on()) h = '';
  else if (G.phase === 'night' && G.day === 0) h = `<div class="sc1"><span class="cap">T</span>he House is Dealt</div><p class="sc2">${ORDN(G.players.length)[0].toUpperCase() + ORDN(G.players.length).slice(1)} brothers, snowed in. One of them is not a brother at all. Look at your phone, and keep it to yourself.</p>${rdy()}`;
  else if (G.phase === 'night') h = `<div class="sc1"><span class="cap">C</span>ompline</div><p class="sc2">Choose on your phone where you will spend the night.</p>${rdy()}`;
  else if (G.phase === 'dawn') { const lg = G.nightLog || { dead: [] }; h = `<div class="sc1"><span class="cap">D</span>awn of the ${ORD[G.day - 1]} Day</div>${lg.dead.length ? lg.dead.map(id => { const b = G.bodies.find(q => q.id === id); return `<p class="sc2">${nm(id)} lies dead${b ? ' in the ' + RN(b.room) : ''}.</p>`; }).join('') : `<p class="sc2">No one was taken in the night.${lg.protect != null ? ' Someone was watched over.' : ''}</p>`}<p class="sc3">The candle burns to notch ${G.clock} of 8.</p>${rdy()}`; }
  else if (G.phase === 'day') { const rung = G.rang || {}, LH = hs.filter(id => G.players[id].alive), nr = LH.filter(id => rung[id]).length; h = `<p class="sc2 one">Find your brother. Search the glints with your phone. ${LH.length ? `<b>${nr} of ${LH.length}</b> have rung for dusk.` : ''}${STRIG() && G.town ? ` Walls <b>${townDef()}</b>, the dead tonight about <b>${hordeSize((G.night || 0) + 1)}</b>.` : ''}</p>`; }
  else if (G.phase === 'dusk' && G.hearing) { const H = G.hearing, need = Math.ceil(living().length / 2);
    if (H.result) { const r = H.result; h = `<div class="sc1"><span class="cap">T</span>he Hearing</div>` + (r.banished != null ? `<p class="sc2">${nm(r.banished)} is banished beyond the gate.</p>` : r.hanged != null ? `<p class="sc2">${nm(r.hanged)} is hanged in the cloister.</p>` : `<p class="sc2">${H.acc.some(a => a.out === 'spared') ? 'He is spared.' : H.nomFail === 'tie' ? 'The names are split; no one goes up.' : 'Too few name anyone; no one goes up.'} No one hangs: the candle burns twice tonight.</p>`) + rdy(); }
    else if (H.stage === 'nom') { const T = nomTally(); h = `<div class="sc1"><span class="cap">T</span>he Hearing</div><p class="sc2">${H.round === 1 ? 'Who should go up before the brothers?' : 'He is spared. One more may go up.'} Name him on your phone.</p><div class="sct">${T.length ? T.map(([id, by]) => `<span>${nm(id)} · ${by.length}</span>`).join('') : '<span class="n">no one named yet</span>'}</div>${rdy()}`; }
    else { const a = H.acc[H.cur], ay = Object.values(a.votes || {}).filter(v => v).length, nay = Object.values(a.votes || {}).filter(v => !v).length, left = hs.filter(x => canVote(x) && a.votes[x] == null);
      h = `<div class="sc1"><span class="cap">T</span>he Hearing</div><p class="sc2">${nm(a.target)} goes up, named by ${a.named.map(id => G.players[id].short).join(', ')}.</p><div class="sct"><span class="y">${ay} aye</span><span class="n">${nay} nay</span><span>${need} to hang</span></div><p class="sc3">${left.length ? 'Waiting on ' + left.map(id => G.players[id].short).join(', ') : 'Every vote is in.'}</p>`; } }
  const k = G.phase + '|' + h + '|' + code; if (!force && k === SCR.k) return; SCR.k = k;
  el.innerHTML = h; el.style.display = h ? '' : 'none'; el.className = 'v p ' + (G.phase === 'day' ? 'thin' : G.phase === 'over' ? 'end' : '');
  let c = $('scode'); if (!c) { c = document.createElement('div'); c.id = 'scode'; c.className = 'v p'; document.body.appendChild(c); }
  c.innerHTML = code ? `<b>${code}</b><small>Join on your phone: open the game and press <i>Join with a code</i>. A lost phone can rejoin with the same name.</small>` : ''; c.style.display = code ? '' : 'none'; }
document.addEventListener('click', e => { const b = e.target.closest('[data-scr]'); if (!b) return; if (b.dataset.scr === 'again') { const N = NETH(); if (N && N.rematch) N.rematch(); } else if (window.HMENU) HMENU.leave(); });

// ---------------------------------------------------------------- the phone: a private hand. One panel at a time behind a tab bar;
// the house itself is on the big screen (the canvas shows here only for the night scenes). The pad sends the same kdir as WASD.
const PAD = { tab: 'hands', dir: '0,0' };
function padTab(t) { PAD.tab = t; if (t === 'hands') { const h = document.querySelector('#padbar [data-pt=hands]'); if (h) h.classList.remove('ping'); } document.body.dataset.ptab = t; document.querySelectorAll('#padbar [data-pt]').forEach(b => b.classList.toggle('on', b.dataset.pt === t)); if (t === 'table') { renderChat(); } padHead(); }
function padHead() { const h = $('padme'); if (!h || !G.players.length) return; const me = you(); if (!me || G.you < 0) return; const R = ROLES[me.role] || ROLES.unknown;
  h.innerHTML = `Your brother is <b style="color:${me.col}">${me.short}</b> on the big screen${me.role !== 'unknown' ? ` · <span style="color:${R.team === 'evil' ? '#e05a4a' : '#d8b060'}">${R.name}</span>` : ''}${me.alive ? '' : ' · <span style="color:#e05a4a">dead</span>'}`; }
function padInit() { if ($('padbar')) return padHead(); const b = document.createElement('div'); b.id = 'padbar'; b.className = 'v';
  b.innerHTML = [['hands', 'Hands'], ['case', 'Casebook'], ['bro', 'Brethren'], ['table', 'Table'], ['role', 'Role']].map(([k, t]) => `<span data-pt="${k}">${t}</span>`).join(''); document.body.appendChild(b);
  b.onclick = e => { const t = e.target.closest('[data-pt]'); if (t) padTab(t.dataset.pt); };
  const p = document.createElement('div'); p.id = 'padhands'; p.innerHTML = `<p id="padme"></p><div id="dpad"><i class="u">▲</i><i class="r">▶</i><i class="d">▼</i><i class="l">◀</i><span></span></div>`; document.body.appendChild(p);
  const d = $('dpad'), send = v => { if (v === PAD.dir) return; PAD.dir = v; act({ kdir: v }); };
  const at = e => { const r = d.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); if (Math.hypot(x, y) < r.width * .12) return send('0,0');
    const a = Math.round(Math.atan2(y, x) / (Math.PI / 4)), ux = Math.round(Math.cos(a * Math.PI / 4)), uy = Math.round(Math.sin(a * Math.PI / 4)); d.style.setProperty('--px', x / r.width * 100 + '%'); d.style.setProperty('--py', y / r.height * 100 + '%'); d.classList.add('on'); send(`${ux + uy},${uy - ux}`); };
  const stop = () => { d.classList.remove('on'); send('0,0'); };
  d.addEventListener('pointerdown', e => { e.preventDefault(); d.setPointerCapture(e.pointerId); at(e); }); d.addEventListener('pointermove', e => { if (d.hasPointerCapture(e.pointerId)) at(e); });
  d.addEventListener('pointerup', stop); d.addEventListener('pointercancel', stop); d.addEventListener('lostpointercapture', stop);
  padTab('hands'); }

// ---------------------------------------------------------------- start
function resize() { cv.width = innerWidth; cv.height = innerHeight; VIEW.scale = G.screen ? (innerHeight >= 1300 ? 3 : 2) : innerHeight >= 860 ? 3 : 2; }
window.startProto = async function () {
  cv = $('cv'); ctx = cv.getContext('2d'); resize(); addEventListener('resize', resize); cv.addEventListener('click', onClick);
  await loadMap(QS.get('map') || 'monastery', true); $('load').style.display = 'none'; requestAnimationFrame(loop);
  if (window.HMENU && !QS.has('seed') && !QS.has('as')) { demoGame(); HMENU.open(); } else newGame({ map: MAP.key }); };
// load a map: its art (four lit frames), walls, grid and weather. The menu calls this before dealing a game on another map.
let mapLoading = null;
async function loadMap(key, first) { key = MAPS[key] ? key : 'monastery'; if (MAP.key === key && VIEW.frames && !first) return; if (mapLoading) await mapLoading;
  if (MAP.key === key && VIEW.frames && !first) return;
  mapLoading = (async () => { const ld = $('load'); if (!first) { ld.style.display = 'flex'; ld.style.background = 'rgba(8,6,10,.92)'; }
    MAP = MAPS[key]; P = MAP.plan; TWL = null; for (const k in ROLES) { const r = ROLES[k]; if (r._n == null) { r._n = r.name; r._x = r.text; } r.name = (MAP.roles && MAP.roles[k] && MAP.roles[k].name) || r._n; r.text = (MAP.roles && MAP.roles[k] && MAP.roles[k].text) || r._x; } window.PLAN = P; RK = Object.keys(P.rooms); GW = Math.ceil(MAP.size[0] / CS); GH = Math.ceil(MAP.size[1] / CS);
    const fr = []; for (let t = 0; t < 4; t++) { const r = MAP.scene(t, 4); if (t === 0) { VIEW.dep = r.e.dep; VIEW.zone = r.e.zone; VIEW.lights = r.e.lights.map(l => [l[0], l[1], l[2], l[3], l[4], l[5], l[6]]); VIEW.amb = r.e.cfg.amb; VIEW.W = r.canvas.width; VIEW.H = r.canvas.height; } fr.push(r.canvas.getContext('2d').getImageData(0, 0, VIEW.W, VIEW.H).data); $('loadbar').style.width = (t + 1) * 20 + '%'; await new Promise(r => setTimeout(r, 10)); }
    VIEW.frames = fr; low = document.createElement('canvas'); low.width = VIEW.W; low.height = VIEW.H; lctx = low.getContext('2d'); img = lctx.createImageData(VIEW.W, VIEW.H);
    VIEW.snow = []; for (let k = 0; k < (MAP.weather === 'ash' ? 160 : 260); k++) VIEW.snow.push({ x: Math.random() * VIEW.W, y: Math.random() * VIEW.H, v: .6 + Math.random() * .8, p: Math.random() * 6, a: .35 + Math.random() * .45 });
    VIS = new Float32Array(GW * GH); VISK = ''; buildGrid(); buildWalls(); document.body.dataset.map = key; twNode(document.body, true); if (window.musicTrack) musicTrack(MAP.music || 'house'); if (!first) ld.style.display = 'none'; })();
  await mapLoading; mapLoading = null; }
// a new game on this machine (alone, or as the host): deal the brothers, warm their sprites, show each human his role
function newGame(opt) { seed = opt.seed || seed; G.opt = opt; G.demo = !!opt.demo; document.body.classList.toggle('demo', G.demo); Object.assign(VIEW, { fogOff: G.demo, noRing: G.demo, cine: G.demo, camT: null, extra: [] }); Object.assign(G, { day: 0, phase: 'night', clock: 0, spots: [], bodies: [], prints: [], chat: [], timer: 0, sel: null, hearing: null, over: null, log: [], night: 0, noHang: false, timers: [], nightLog: null, nightInfo: {}, lastHanged: null,
    humans: opt.humans || [0], away: {}, names: opt.names || {}, cases: {}, nightChoices: {}, ready: {}, lastModal: {}, rang: {}, inheritNote: false, wchat: [] }); LOCAL = 0; G.you = 0; G.screen = !!opt.screen; if (G.screen) { LOCAL = -1; G.you = -1; } document.body.classList.toggle('screen', G.screen); SCR.k = ''; Object.assign(CW, { tab: 'all', tabs: [], unread: {}, seen: 0 });
  turnTexts(); G.town = STRIG() ? TOWN0() : null; if (window.musicTrack && !opt.demo) musicTrack(MAP.music || 'house'); makeBrothers(); for (const p of G.players) { [p.x, p.y] = pointIn('dorm', .9, p.id); p.night = 'dorm'; }
  warmAll(); hideModal(); VISK = ''; renderAll(); forHumans(showIntro); saveGame(); }
// behind the menu: the house going about its day, nobody's eyes, the camera drifting
function demoGame() { newGame({ demo: true, humans: [], seed: (Date.now() % 2147483000) + 1 }); G.headless = true; simulateNight({}); G.headless = false; startDay(); G.timer = 1e9; G.demoT = 0; VIEW.camT = MAP.center.slice(); }
function demoTick(dt) { G.demoT += dt; const a = G.demoT * .05; VIEW.camT = [MAP.center[0] + Math.cos(a) * MAP.drift[0], MAP.center[1] + Math.sin(a * 1.3) * MAP.drift[1]]; }
function warmAll() { for (const p of G.players) for (let f = 0; f < 8; f++) KIT.person(p.o, f, 'idle', 0);
  const J = []; for (const p of G.players) for (let f = 0; f < 8; f++) for (let k = 0; k < 4; k++) J.push([p.o, f, 'walk', k]);
  for (const p of G.players) { p._oc = { ...p.o, prop: 'candle' }; for (let f = 0; f < 8; f++) { J.push([p.o, f, 'pray', 0]); J.push([p.o, f, 'pray', 1]); for (let k = 0; k < 4; k++) J.push([p._oc, f, 'walk', k]); J.push([p._oc, f, 'idle', 0]); J.push([p._oc, f, 'pray', 0]); J.push([p._oc, f, 'pray', 1]); } }
  for (const p of G.players) for (let f = 0; f < 8; f++) { J.push([p.o, f, 'idle', 1]); J.push([p.o, f, 'work', 0]); J.push([p.o, f, 'work', 1]); J.push([p.o, f, 'die', 3]); } KIT.warm(J); }
function showIntro() { const R = ROLES[you().role], mate = R.team === 'evil' ? G.players.find(p => p.id !== G.you && team(p) === 'evil') : null, online = G.humans.length > 1 || (NETH() && NETH().guest);
  modal(`<div class="hd" style="font-size:40px"><span class="cap">T</span>he Hollow Brother</div><p class="big">Snow has closed the pass. ${['', '', '', '', '', '', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][G.players.length]} brothers are shut in for the winter, and one of them is not a brother at all.</p><p class="big">You are <b>${you().name}</b>, the <b style="color:${R.team === 'evil' ? '#e05a4a' : '#d8b060'}">${R.name}</b>. ${R.text}${mate ? ` Your ${ROLES[mate.role].name} is <b style="color:${mate.col}">${mate.name}</b>. If anyone asks, you are the <b>${you().bluff}</b>.` : ''}</p><p class="sub">Click to walk (or WASD). Search the glinting places with E. Click a brother to question him or mark him. What you find you may tell the table, whisper to one brother, or keep for the Hearing. At dusk, the Hearing: hang the Hollow Brother and his Scrubber before they empty the house.${online ? ' The other players are brothers too, and any of them may be evil.' : ''}</p><div class="row">${G.ready[G.you] ? `<span class="btn off">Waiting for ${readyLeft()}…</span>` : '<span class="btn go" data-go="night">The first night</span>'}</div>`, 'dawn'); }

// exposed for the test harness
window.HGAME = { who, demoGame, newGame, loadGame, savesGet, saveGame, handle, asSeat, isHuman, showIntro, showDawn, showHearing, showNight, showEnd, renderAll, padInit, padHead, turnTexts, stashTick, loadMap, mapKey: () => MAP.key, setLocal: s => { LOCAL = s; G.you = s; }, getLocal: () => LOCAL, warmAll, sceneOn, ROLES, NIGHT, modal, hideModal, flash, VIEW };
window.PROTO = { D2N: () => ({ setGate, nearLever, fortify, homeLv, atHome, roamTick, LEVER, GATEC, homeKey, placeAt }), nomTally, NIGHT, frame: () => frame(), VIEW, lightAt, isoP, KIT: window.KIT, fogDbg: () => ({ VIS, VISK, CELLPX, WALLG }), evilClaim, shareClue, doSearch, doExamine, nearSpot, nearBody, team, maxSus, topSus, learn, update, G, simulateNight, startDay, startHearing, runVote, finishHearing, showNight, findPath, you, living };
})();
