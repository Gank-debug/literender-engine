// The Hollow Brother: the menu, and playing online.
// Online is host-authoritative. The host's machine runs the whole monastery; each guest sends what he does (HNET.act) and gets back
// a picture of the house several times a second (public: where everyone is, what is searched, the table, the hearing) plus what
// only he may know (his role, his casebook). Anything the host's game shows "you" while acting for a guest goes to that guest.
// Rooms are found through Trystero over public Nostr relays, the same way Lords of the Isle does it.
(function () {
'use strict';
const $ = id => document.getElementById(id), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const APP = 'hollow-brother-v1', ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }];
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', mkCode = () => 'HOLLOW-' + Array.from({ length: 4 }, () => ALPHA[(Math.random() * ALPHA.length) | 0]).join('');
const cleanRoom = s => { const m = /([A-Z0-9]{4})\s*$/.exec((s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')); return m ? 'HOLLOW-' + m[1] : null; };
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
let MAXP = 10;

const H = window.HNET = { seen: {}, host: false, guest: false, room: null, code: null, started: false, seat: null, lobby: [], peerSeat: {}, seatPeer: {}, hostPeer: null, last: {}, buf: [], msg: '', snapT: 0 };
const send = (pid, m) => { try { H.chan && H.chan.send(JSON.stringify(m), { target: pid }); } catch (e) {} };

function roomOpen(code) {
  if (typeof Trystero === 'undefined') { H.msg = 'Online play needs the internet.'; MENU.draw(); return false; }
  roomClose(); H.code = code; H.hostPeer = null;
  const cfg = { appId: APP, rtcConfig: { iceServers: ICE } }; if (window.CROWN_RELAYS) cfg.relayConfig = { urls: window.CROWN_RELAYS };
  try { H.room = Trystero.joinRoom(cfg, code); } catch (e) { H.msg = 'Could not reach the relays: ' + e.message; MENU.draw(); return false; }
  H.chan = H.room.makeAction('m'); H.chan.onMessage = (data, ctx) => { let m; try { m = JSON.parse(data); } catch (e) { return; } (H.host ? hostMsg : guestMsg)(ctx.peerId, m); };
  H.room.onPeerJoin = pid => { if (H.host) send(pid, { t: 'host' }); };
  H.room.onPeerLeave = pid => { if (H.host) hostLeave(pid); else if (pid === H.hostPeer) guestLost(); };
  return true; }
function roomClose() { try { H.room && H.room.leave(); } catch (e) {} H.room = H.chan = null; }

// ---------------------------------------------------------------- host
function hostOpen() { MAXP = MENU.size; H.host = true; H.guest = false; H.lobby = [{ name: myName(), peer: null }]; H.peerSeat = {}; H.seatPeer = {}; H.started = false; roomOpen(mkCode()); MENU.draw(); }
function lobbySend() { const names = H.lobby.map(x => x.name); H.lobby.forEach((x, i) => { if (x.peer) send(x.peer, { t: 'lobby', names, you: i }); }); MENU.draw(); }
function hostMsg(pid, m) { const seat = H.peerSeat[pid]; if (seat != null) { H.seen[seat] = Date.now(); if (H.started && G.away[seat] && H.seatPeer[seat] === pid) { G.away[seat] = false; H.last[seat] = {}; } }
  if (m.t === 'hi') { const nm = String(m.name || '').replace(/[<>&"]/g, '').slice(0, 16).trim() || 'A brother';
    if (!H.started) { if (H.lobby.some(x => x.peer === pid)) return; if (H.lobby.length >= MAXP) return send(pid, { t: 'full' }); H.lobby.push({ name: nm, peer: pid }); H.peerSeat[pid] = H.lobby.length - 1; lobbySend(); return; }
    // a game is running: take back a held seat, by name if it matches
    const away = G.humans.filter(id => G.away[id]); const s = G.humans.find(id => id && (G.names[id] || '').toLowerCase() === nm.toLowerCase()) ?? (away.length === 1 ? away[0] : null);
    if (s == null) return send(pid, { t: 'full', inGame: true });
    const old = H.seatPeer[s]; if (old && old !== pid) delete H.peerSeat[old]; H.peerSeat[pid] = s; H.seatPeer[s] = pid; G.away[s] = false; H.seen[s] = Date.now(); G.names[s] = nm; sendStart(s); HGAME.flash(`${HGAME.who(s)} is back.`); return; }
  if (seat == null || !H.started) return;
  if (m.t === 'act' && m.d) HGAME.asSeat(seat, () => HGAME.handle(m.d)); }
function hostLeave(pid) { const seat = H.peerSeat[pid]; delete H.peerSeat[pid];
  if (!H.started) { H.lobby = H.lobby.filter(x => x.peer !== pid); H.lobby.forEach((x, i) => { if (x.peer) H.peerSeat[x.peer] = i; }); lobbySend(); return; }
  if (seat != null && H.seatPeer[seat] === pid) { delete H.seatPeer[seat]; G.away[seat] = true; HGAME.flash(`${HGAME.who(seat)} has gone. The house keeps his place.`); } }
async function hostStart(opt) { await HGAME.loadMap(opt.map || 'monastery'); H.lobby = H.lobby.filter((x, i) => i === 0 || x.peer); const scr = !!opt.screen, humans = H.lobby.map((x, i) => i).filter(i => !scr || i), names = {};
  H.lobby.forEach((x, i) => { if (!scr || i) names[i] = x.name; if (x.peer) { H.peerSeat[x.peer] = i; H.seatPeer[i] = x.peer; } });
  H.started = true; MENU.hide(); HGAME.newGame({ seed: (Date.now() % 2147483000) + 1, humans, names, lot: true, scenes: opt.scenes, hints: !!opt.hints, size: opt.size || 10, online: true, screen: scr, map: opt.map || 'monastery' });
  const now = Date.now(); for (const i of humans) { H.seen[i] = now; if (i) sendStart(i); } }
// a guest's own copy of the brothers: everything visible, no one's role but his own
const pubBrother = p => ({ id: p.id, name: p.name, short: p.short, col: p.col, foot: p.foot, habit: p.habit, tall: p.tall, item: p.item, o: p.o });
function sendStart(seat) { const pid = H.seatPeer[seat]; if (!pid) return; H.last[seat] = {};
  send(pid, { t: 'start', seat, players: G.players.map(pubBrother), names: G.names, humans: G.humans, opt: { scenes: G.opt.scenes, hints: !!G.opt.hints, size: G.opt.size, screen: !!G.opt.screen, map: G.opt.map || 'monastery' } });
  H.pubNow = pub(); snapTo(seat, true); const lm = G.lastModal[seat]; if (lm) send(pid, { t: 'modal', html: lm.html, cls: lm.cls }); }
function pub() { return { ph: G.phase === 'cine' ? 'nightsim' : G.phase, day: G.day, mus: G.mus || 0, clock: G.clock, timer: Math.round(G.timer * 10) / 10, night: G.night, over: G.over,
  pl: G.players.map(p => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, p.face, p.state, Math.round(p.dist * 100) / 100, p.alive ? 1 : 0, p.claimed, Math.round((p.heard || 0) * 10) / 10, p.diedDay || 0, p.ghostVote ? 1 : 0, Math.round((p.st || 0) * 10) / 10]) }; }
function heavy(seat) { const me = G.players[seat], ev = me.role && HGAME.ROLES[me.role].team === 'evil';
  return { spots: JSON.stringify(G.spots.map(s => [s.x, s.y, s.searched ? 1 : 0, s.busy != null ? 1 : 0, s.room])), prints: JSON.stringify(G.prints), bodies: JSON.stringify(G.bodies.map(b => ({ id: b.id, x: b.x, y: b.y, room: b.room, face: b.face, examined: b.examined }))),
    chat: JSON.stringify(G.chat), wch: JSON.stringify((G.wchat || []).filter(m => m.from === seat || m.to === seat)), hearing: JSON.stringify(G.hearing), town: JSON.stringify(G.town || null), table: JSON.stringify({ rang: G.rang || {}, ready: G.ready, names: G.names, humans: G.humans, away: G.away, inherit: G.inheritNote }),
    mine: JSON.stringify({ pack: me.pack || {}, role: me.role, wasRole: me.wasRole, bluff: me.bluff, inherited: me.inherited, mates: ev && me.role !== 'empty' ? G.players.filter(p => p.id !== seat && HGAME.ROLES[p.role].team === 'evil').map(p => [p.id, p.role]) : [], cases: G.cases[seat] || [], over: G.over ? G.players.map(p => p.role) : null }) }; }
function snapTo(seat, all) { const pid = H.seatPeer[seat]; if (!pid) return; const L = H.last[seat] || (H.last[seat] = {}), hv = heavy(seat), out = { t: 'snap', pub: H.pubNow };
  for (const k in hv) if (all || L[k] !== hv[k]) { out[k] = hv[k]; L[k] = hv[k]; } send(pid, out); }
H.tick = dt => { if (H.guest) return guestTick(dt); if (!H.host || !H.started) return; H.snapT += dt; if (H.snapT < .1) return; H.snapT = 0;
  const now = Date.now(); for (const s of G.humans) if (s && !G.away[s] && H.seatPeer[s] && now - (H.seen[s] || now) > 10000) { G.away[s] = true; HGAME.flash(`${HGAME.who(s)} has gone quiet. The house plays his brother until he is back.`); } H.pubNow = pub(); for (const s of G.humans) if (s && !G.away[s]) snapTo(s); nudge(); };
H.toSeat = (seat, m) => { const pid = H.seatPeer[seat]; if (pid) send(pid, m); };
H.night = () => { const lg = G.nightLog, msg = { t: 'night', log: { targets: lg.targets, protect: lg.protect, dead: lg.dead, start: lg.start, path: lg.path }, bodies: G.bodies.map(b => ({ id: b.id, x: b.x, y: b.y, room: b.room, face: b.face, examined: b.examined })) };
  H.pubNow = pub(); for (const s of G.humans) if (s && !G.away[s]) { snapTo(s); H.toSeat(s, msg); } };
H.hang = (id, kind) => { H.pubNow = pub(); for (const s of G.humans) if (s && !G.away[s]) { snapTo(s); H.toSeat(s, { t: 'hang', id, kind }); } };
H.rematch = () => { if (!H.started) return; const scr = !!G.opt.screen, humans = G.humans.filter(id => id === 0 || !G.away[id]); H.lobby = (scr ? [{ name: myName(), peer: null }] : []).concat(humans.map(id => ({ name: G.names[id], peer: H.seatPeer[id] || null }))); hostStart({ scenes: G.opt.scenes, hints: G.opt.hints, size: G.opt.size, screen: scr, map: G.opt.map }); };
// nobody keeps the table waiting forever: after a long wait, the house decides for whoever has not
let waitKey = '', waitT = 0;
function nudge() { if (G.humans.length < 2 || G.phase === 'cine' || G.phase === 'over' || G.phase === 'day') { waitT = 0; return; }
  const h = G.hearing, key = G.phase + G.day + (h ? h.stage + h.round + h.cur + !!h.result : '') + Object.keys(G.ready).length; if (key !== waitKey) { waitKey = key; waitT = 0; return; } waitT += .1; if (waitT < 90) return; waitT = 0;
  for (const s of G.humans) if (!G.ready[s]) HGAME.asSeat(s, () => { const d = HGAME.handle;
    if (G.phase === 'night' && G.day === 0 && !h) return d({ go: 'night' });
    if (G.phase === 'dawn') return d({ go: 'day' });
    if (G.phase === 'night') { const nc = G.nightChoices[s] || {}, me = G.players[s], L = G.players.filter(p => p.alive && p.id !== s); if (me.role === 'enemy' && nc.kill == null) nc.kill = (L.find(p => HGAME.ROLES[p.role].team === 'good') || {}).id; if (me.role === 'enemy' && nc.turn == null) nc.turn = (L.find(p => HGAME.ROLES[p.role].team === 'good') || {}).id; if (nc.protect == null) nc.protect = L[0] && L[0].id; if (!nc.ring) nc.ring = 'chapel'; const G1 = L.find(p => HGAME.ROLES[p.role].team === 'good'); if (nc.frame == null) nc.frame = G1 && G1.id; if (nc.hush == null) nc.hush = G1 && G1.id; if (nc.follow == null) nc.follow = L[0] && L[0].id; G.nightChoices[s] = nc; return d({ go: 'sleep' }); }
    if (h && h.stage === 'nom' && !h.result) return d({ go: 'tally' });
    if (h && h.stage === 'trial' && !h.result) { const a = h.acc[h.cur]; if (a.votes[s] == null && (G.players[s].alive || G.players[s].ghostVote)) d({ vote: '0' }); return d({ go: 'next' }); }
    if (h && h.result) return d({ go: 'night' }); }); }

// ---------------------------------------------------------------- guest
function guestJoin(code, name) { H.guest = true; H.host = false; H.started = false; H.myName = name; H.msg = 'Looking for the host…'; if (!roomOpen(code)) return; MENU.draw();
  clearTimeout(H.slowT); H.slowT = setTimeout(() => { if (H.guest && !H.hostPeer) { H.msg = 'Still looking… Check the code, and that the host has the room open.'; MENU.draw(); } }, 15000); }
function guestMsg(pid, m) {
  if (m.t === 'host' && !H.hostPeer) { H.hostPeer = pid; send(pid, { t: 'hi', name: H.myName }); H.msg = 'Found the host.'; MENU.draw(); return; }
  if (pid !== H.hostPeer) return;
  if (m.t === 'lobby') { H.lobby = m.names.map(n => ({ name: n })); H.seat = m.you; H.msg = ''; MENU.draw(); return; }
  if (m.t === 'full') { H.msg = m.inGame ? 'That game is already under way and has no empty place.' : 'The house is full.'; MENU.draw(); return; }
  if (m.t === 'start') return guestStart(m);
  if (!H.started) return;
  if (m.t === 'snap') return guestSnap(m);
  if (m.t === 'sfx') { if (m.k === 'chime' && window.sfxChime) sfxChime(); return; }
  if (m.t === 'modal' || m.t === 'hide' || m.t === 'flash') { if (G.phase === 'cine') { if (m.t !== 'flash') H.buf.push(m); return; } return show(m); }
  if (m.t === 'hang') { if (HGAME.sceneOn() && document.visibilityState !== 'hidden' && G.phase !== 'cine') HGAME.NIGHT.hang(m.id, m.kind, () => H.cineDone()); else if (m.kind === 'good' && window.musicTaunt) musicTaunt(); return; }
  if (m.t === 'night') { G.nightLog = m.log; G.bodies = m.bodies.map(b => ({ ...b, cineHide: false })); G.phase = 'nightsim'; if (HGAME.sceneOn() && document.visibilityState !== 'hidden') HGAME.NIGHT.play(); return; } }
function show(m) { if (m.t === 'modal') HGAME.modal(m.html, m.cls); if (m.t === 'hide') HGAME.hideModal(); if (m.t === 'flash') HGAME.flash(m.text); }
// a scene can end here before it ends for the host (each player watches his own night). Until the host's word comes, say so,
// rather than leaving a quiet house with nothing to press.
H.cineDone = () => { const b = H.buf; H.buf = []; if (H.pub) G.phase = H.pub.ph === 'nightsim' ? 'dawn' : H.pub.ph; for (const m of b) show(m);
  if (!b.some(m => m.t === 'modal') && G.phase !== 'day' && G.phase !== 'over') { H.waiting = true; show({ t: 'modal', cls: 'dawn', html: `<div class="hd" style="font-size:36px"><span class="cap">L</span>auds</div><p class="big">The night is over for you. The others are still in it.</p><p class="sub">The day begins when every brother has woken. This takes a moment.</p><div class="row"><span class="btn off">Waiting for the house…</span></div>` }); } };
async function guestStart(m) { if (m.opt && HGAME.mapKey() !== (m.opt.map || 'monastery')) { H.started = true; MENU.hide(); await HGAME.loadMap(m.opt.map || 'monastery'); } clearInterval(H.pingI); H.pingI = setInterval(() => { if (H.hostPeer) send(H.hostPeer, { t: 'ping' }); }, 2000); H.started = true; H.seat = m.seat; H.buf = []; MENU.hide(); G.demo = false; document.body.classList.remove('demo'); Object.assign(HGAME.VIEW, { fogOff: false, noRing: false, cine: false, camT: null, extra: [] });
  G.players = m.players.map(p => ({ ...p, role: 'unknown', alive: true, ghostVote: true, x: 0, y: 0, tx: null, path: [], face: 0, dist: 0, state: 'idle', st: 0, sus: new Array(m.players.length).fill(0), trust: new Array(m.players.length).fill(1), said: {}, mark: '', claimed: null, heard: 0 }));
  Object.assign(G, { names: m.names, humans: m.humans, opt: m.opt, day: 0, phase: 'night', over: null, hearing: null, bodies: [], spots: [], prints: [], chat: [], wchat: [], cases: {}, away: {}, ready: {}, rang: {}, nightLog: null });
  HGAME.setLocal(m.seat); if (HGAME.turnTexts) HGAME.turnTexts(); if (window.musicTrack) musicTrack(HGAME.mapKey() === 'town' ? 'town' : 'house'); HGAME.warmAll(); HGAME.hideModal(); HGAME.renderAll();
  const pad = !!(m.opt && m.opt.screen) || matchMedia('(max-width: 760px)').matches || /[?&]pad=1/.test(location.search); document.body.classList.toggle('pad', pad); if (pad) HGAME.padInit(); }
function guestSnap(m) { const P = m.pub; if (!P) return; H.pub = P; const cine = G.phase === 'cine';
  if (!cine) { G.phase = P.ph === 'nightsim' ? G.phase : P.ph; } G.day = P.day; G.mus = P.mus || 0; G.clock = P.clock; G.timer = P.timer; G.night = P.night; if (P.over && !G.over) { if (P.over === 'evil' && window.musicVictory) musicVictory(); if (P.over === 'good' && window.musicFaithful) musicFaithful(); } G.over = P.over;
  P.pl.forEach((a, i) => { const p = G.players[i]; if (!p) return; if (!cine) { if (p.tx == null || Math.hypot(a[0] - p.x, a[1] - p.y) > 3) { p.x = a[0]; p.y = a[1]; } p.tx = a[0]; p.ty = a[1]; p.face = a[2]; p.state = a[3]; p.dist = a[4]; }
    p.alive = !!a[5]; p.claimed = a[6]; p.heard = a[7]; p.diedDay = a[8]; p.ghostVote = !!a[9]; p.st = a[10]; });
  let re = false;
  if (m.spots) { G.spots = JSON.parse(m.spots).map(([x, y, s, b, room]) => ({ x, y, searched: !!s, busy: b ? 1 : null, room })); }
  if (m.prints) G.prints = JSON.parse(m.prints);
  if (m.bodies && !cine) G.bodies = JSON.parse(m.bodies);
  if (m.chat) { G.chat = JSON.parse(m.chat); re = true; }
  if (m.wch) { G.wchat = JSON.parse(m.wch); re = true; }
  if (m.hearing) G.hearing = JSON.parse(m.hearing); if (m.town) { G.town = JSON.parse(m.town); re = true; }
  if (m.table) { const T = JSON.parse(m.table); G.rang = T.rang; G.ready = T.ready; G.names = T.names; G.humans = T.humans; G.away = T.away; G.inheritNote = T.inherit; re = true; }
  if (m.mine) { const M = JSON.parse(m.mine), me = G.players[H.seat]; me.pack = M.pack; me.role = M.role; me.wasRole = M.wasRole; me.bluff = M.bluff; me.inherited = M.inherited; for (const p of G.players) if (p.id !== H.seat && !M.over) p.role = 'unknown'; for (const [id, r] of M.mates) G.players[id].role = r; if (M.over) M.over.forEach((r, i) => G.players[i].role = r); G.cases[H.seat] = M.cases; re = true; }
  if (re || m.spots) { HGAME.renderAll(); if (document.body.classList.contains('pad')) HGAME.padHead(); } HGAME.stashTick(); }
function guestTick(dt) { for (const p of G.players) if (p.tx != null && G.phase !== 'cine') { const k = Math.min(1, dt * 10); p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; } }
function guestLost() { if (!H.started) { H.msg = 'The host has gone.'; H.hostPeer = null; MENU.draw(); return; }
  HGAME.modal(`<div class="hd"><span class="cap">T</span>he host has gone</div><p class="big">The link to the host's monastery was lost. If he opens the same room again, join with the same code and your name: you will get your brother back.</p><div class="row"><span class="btn go" data-go="menu">Back to the menu</span></div>`, 'end'); }
H.act = d => { if (H.hostPeer) send(H.hostPeer, { t: 'act', d }); };

// ---------------------------------------------------------------- the menu
const myName = () => (store('crown-name') || '').trim() || 'Brother';
const inFrame = (() => { try { return window.parent !== window; } catch (e) { return true; } })();
const HOW = `<p><b>The house.</b> Ten brothers are snowed into a monastery for the winter. One is the <b>Hollow Brother</b>, who takes a brother each night he hungers. Everyone else begins faithful, dealt nine gifts from a pool of fifteen, so no one knows which gifts are in the house. On the first night he takes no one: he goes to one brother and turns him. What that brother becomes is dealt at random from six: the <b>Scrubber</b>, the <b>Forger</b>, the <b>Lamb</b>, the <b>Hush</b>, the <b>Bellwether</b> or the <b>Empty Habit</b>. Press R in the game to read every role.</p>
  <p><b>Night.</b> Choose where you sleep and use your gift: the Infirmarer keeps watch over a brother, the Tracker follows one. The Hollow Brother walks. Whatever really happened leaves traces: prints in the snow, thread on a doorframe, wax and soot.</p>
  <p><b>Day.</b> Walk the house (click, or WASD) and search the glinting places (E). Read the bodies. Ask brothers where they slept: the evil lie. Anything you find you may <b>tell the table</b> (everyone learns it, but you are marked as heard, and the evil have the day to answer it), <b>whisper</b> it to one brother, or <b>keep it for the Hearing</b>, where it counts double.</p>
  <p><b>Dusk.</b> The Hearing: the brothers name one man to go up, then vote aye or nay. He hangs if half the living say aye. If he is spared, one more may go up; then night falls, hanged or not. Never more than one hangs. The dead name no one but keep one vote.</p>
  <p><b>The candle.</b> It burns a notch each night, two if no one hangs, and steadies when evil hangs. As it burns down, he hungers more often and leaves fewer prints.</p>
  <p><b>Winning.</b> The faithful must hang both the Hollow Brother and his Scrubber: if the Hollow Brother hangs while his Scrubber lives, the hollow passes to the Scrubber. The evil win when they are as many as the faithful.</p>`;
// fullscreen, the same buttons as the Lords table: one top right of the menu, one beside the sound in the game
const FS_ICON = {"full": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZUlEQVR4AdySywkAIAxD1SkcwEEc3UEcwC2UJyhSvPg5iEIObdqQBo06fFUgxZBnGLVnPL0qwKB1XkvQb5AcNVwXoNjBLwItkNUM2HskAz7Eqn3m2XvkBOzs4t4JBCIxupIcNXwBAAD//3osEQQAAAAGSURBVAMA4MlaRbiBh1gAAAAASUVORK5CYII=", "unfull": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAa0lEQVR4AdyQ6wmAMAyE1SkcwEEc3UEcwC2UCwSO44r08auFkNf1I8m2dL4i4Lmvl9maZ68ISMGfnwWAA6m53VWDPG6wH+fqjCGuj1oAWFgbjwFgF2c8jeujFhNgFzX+nLFqkAcgBS1+AsAHAAD//4CLbewAAAAGSURBVAMAOSFfJ5rnBGIAAAAASUVORK5CYII="};
const EYE = shut => `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="#d8b060" stroke-width="1.6" stroke-linejoin="round"><path d="M1 7c2.5-4 5-5.5 8-5.5S14.5 3 17 7c-2.5 4-5 5.5-8 5.5S3.5 11 1 7z"/>${shut ? '<path d="M2 13L16 1"/>' : '<circle cx="9" cy="7" r="2.4" fill="#d8b060"/>'}</svg>`;
const HFS = window.HFS = { on: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
  toggle() { try { if (HFS.on()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { const d = document.documentElement, r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d); if (r && r.catch) r.catch(() => {}); } } catch (e) {} },
  draw() { document.querySelectorAll('.hfs').forEach(b => { b.innerHTML = `<img src="${HFS.on() ? FS_ICON.unfull : FS_ICON.full}" alt="">`; b.title = HFS.on() ? 'Leave fullscreen' : 'Fullscreen'; });
    const u = $('hui'); if (u) { const hid = document.body.classList.contains('noui'); u.innerHTML = EYE(hid); u.title = hid ? 'Show the panels (U)' : 'Hide every panel but this bar (U)'; u.classList.toggle('go', hid); } },
  install() { const t = document.querySelector('.topbar'); if (t && !$('tbtools')) { const g = document.createElement('span'); g.id = 'tbtools'; const w = $('volw'); if (w) g.appendChild(w);
      const b = document.createElement('span'); b.className = 'btn hfs'; b.id = 'hfsg'; b.onclick = HFS.toggle; g.appendChild(b);
      const u = document.createElement('span'); u.className = 'btn hfs'; u.id = 'hui'; u.onclick = HFS.ui; g.appendChild(u); t.appendChild(g); } HFS.draw(); },
  ui() { document.body.classList.toggle('noui'); HFS.draw(); } };
document.addEventListener('fullscreenchange', () => HFS.draw()); document.addEventListener('webkitfullscreenchange', () => HFS.draw());
const MENU = window.HMENU = { tab: 'solo', as: 'good', size: Math.max(6, Math.min(10, +store('hollow-size') || 10)), scenes: store('hollow-scenes') !== '0', hints: store('hollow-hints') === '1', screen: store('hollow-screen') === '1', map: store('hollow-map') || 'monastery', info: null,
  open() { MENU.el = MENU.el || Object.assign(document.createElement('div'), { id: 'hmenu' }); document.body.appendChild(MENU.el); MENU.el.style.display = ''; if (MENU.map !== HGAME.mapKey()) HGAME.loadMap(MENU.map).then(() => HGAME.demoGame());
    if (matchMedia('(max-width: 760px)').matches && MENU.tab === 'solo') MENU.tab = 'join';
    const m = /#(join|room)=([^&]+)/.exec(location.hash); if (m) { MENU.tab = 'join'; const c = cleanRoom(decodeURIComponent(m[2])); if (c) { MENU.code = c; guestJoin(c, myName()); } } MENU.draw(); },
  hide() { if (MENU.el) MENU.el.style.display = 'none'; },
  leave() { try { if (H.host && H.started) for (const s in H.seatPeer) send(H.seatPeer[s], { t: 'bye' }); } catch (e) {} roomClose(); location.hash = ''; location.reload(); },
  again() { HGAME.newGame({ seed: (Date.now() % 2147483000) + 1, humans: [0], names: { 0: (store('crown-name') || '').trim() }, lot: true, scenes: MENU.scenes, hints: MENU.hints, size: MENU.size, map: HGAME.mapKey() }); },
  draw() { const el = MENU.el; if (!el || el.style.display === 'none') return; const saves = HGAME.savesGet();
    const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : new Date(t).toLocaleDateString(); };
    let left = `<div class="mtitle"><span class="cap">T</span>he Hollow<br>Brother</div>
      <p class="mpitch">Snow has closed the pass. Ten brothers are shut in for the winter, and one of them is not a brother at all. Search the house by day, choose what to say and to whom, and hang him before the house is empty.</p>
      <div class="row">${inFrame ? '<span class="btn small" id="hshelf">‹ All games</span>' : ''}<span class="btn small" id="hhow">How to play</span></div>`;
    if (saves.length) left += `<div class="v msaves"><div class="hd2">Continue</div>${saves.map((S, i) => `<div class="msv"><div><b>${S.online ? 'Online' : 'Alone'} · ${S.day ? 'the ' + ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'][S.day - 1] + ' day' : 'before the first night'}</b><small>${ago(S.when)}${S.online ? ' · ' + Object.values(S.names || {}).map(esc).join(', ') : ''}</small></div><span class="btn small go" data-sv="${i}">Resume</span><span class="btn small" data-svx="${i}">✕</span></div>`).join('')}</div>`;
    const tabs = [['solo', 'Singleplayer'], ['host', 'Host online'], ['join', 'Join with a code']];
    let r = `<div class="mtabs">${tabs.map(([k, t]) => `<span class="${MENU.tab === k ? 'on' : ''}" data-mtab="${k}">${t}</span>`).join('')}</div>`;
    const sizeRow = `<div class="mrow"><span>Brothers</span>${[6, 7, 8, 9, 10].map(n => `<span class="btn small ${MENU.size === n ? 'go' : ''}" data-size="${n}" ${H.host && H.lobby.length > n ? 'style="opacity:.4" title="More players have joined than this"' : ''}>${n}</span>`).join('')}</div>`;
    const hintRow = `<div class="mrow"><span>Clue hints</span><span class="btn small ${MENU.hints ? 'go' : ''}" data-hints="1" title="Each clue names the brothers it fits">On</span><span class="btn small ${MENU.hints ? '' : 'go'}" data-hints="0">Off</span></div>`;
    const mapRow = `<div class="mrow"><span>Map</span>${[['monastery', 'The Monastery'], ['town', 'The Plague Town']].map(([k, t]) => `<span class="btn small ${MENU.map === k ? 'go' : ''}" data-map="${k}">${t}</span>`).join('')}</div>`;
    const scrRow = `<div class="mrow"><span>This screen</span><span class="btn small ${MENU.screen ? '' : 'go'}" data-screen="0" title="You play a brother on this computer">Plays a brother</span><span class="btn small ${MENU.screen ? 'go' : ''}" data-screen="1" title="For playing in one room: this computer is the big screen (a TV or laptop everyone can see), and every player uses a phone as his private hand">Big screen</span></div>`;
    const sceneRow = `<div class="mrow"><span>Night scenes</span><span class="btn small ${MENU.scenes ? 'go' : ''}" data-scenes="1">On</span><span class="btn small ${MENU.scenes ? '' : 'go'}" data-scenes="0">Off</span></div>`;
    if (MENU.tab === 'solo') r += `<p class="sub">You, and ${MENU.size - 1} brothers played by the house.</p><p class="sub">Your role is dealt by lot: you may be faithful, or evil.</p>${mapRow}${sizeRow}${hintRow}${sceneRow}<div class="row" style="justify-content:flex-end"><span class="btn go big" id="hsolo">${MENU.map === 'town' ? 'Enter the town' : 'Enter the monastery'}</span></div>`;
    if (MENU.tab === 'host') { if (!H.host) r += `<p class="sub">Open a room and send its code to your friends. Up to ten players; the house plays any brother nobody takes. Roles are dealt by lot, so any of you may be evil.</p>${mapRow}${scrRow}${sizeRow}${hintRow}${sceneRow}${MENU.screen ? '<p class="sub">Big screen: this computer plays no brother. Put it where everyone can see it; each player joins on his phone with the code.</p>' : ''}<div class="row" style="justify-content:flex-end"><span class="btn go" id="hopen">Open a room</span></div>`;
      else r += `<div class="mroom"><b>${H.code || '…'}</b><span class="btn small" id="hcopy">${MENU.copied ? 'Copied' : 'Copy'}</span></div><p class="sub">Send this to your friends. They press <b>Join with a code</b> and type it in.</p>${H.msg ? `<p class="sub">${esc(H.msg)}</p>` : ''}
        <div class="hd2">At the table · ${H.lobby.length - (MENU.screen ? 1 : 0)} of ${MAXP - (MENU.screen ? 1 : 0)} players</div><div class="mseats">${H.lobby.map((x, i) => `<div><i class="chip"></i><b>${esc(x.name)}</b><small>${i ? 'joined' : MENU.screen ? 'the big screen · plays no brother' : 'you, the host'}</small></div>`).join('')}${H.lobby.length < MAXP ? `<div class="mdim"><small>${MAXP - H.lobby.length + (MENU.screen ? 1 : 0)} brother${MAXP - H.lobby.length + (MENU.screen ? 1 : 0) > 1 ? 's' : ''} played by the house</small></div>` : ''}</div>${mapRow}${scrRow}${sizeRow}${hintRow}${sceneRow}
        <div class="row" style="justify-content:space-between"><span class="btn" id="hclose">Close the room</span><span class="btn go big" id="hstart">Begin</span></div>`; }
    if (MENU.tab === 'join') { if (!H.guest) r += `<p class="sub">Type the room code your host sent you.</p><div class="mrow"><input id="hcode" placeholder="HOLLOW-XXXX" maxlength="11" value="${esc(MENU.code || '')}"><span class="btn go" id="hjoin">Join</span></div>`;
      else r += `<div class="mroom"><b>${esc(H.code)}</b></div>${H.msg ? `<p class="sub">${esc(H.msg)}</p>` : ''}${H.lobby.length ? `<div class="hd2">At the table</div><div class="mseats">${H.lobby.map((x, i) => `<div><i class="chip"></i><b>${esc(x.name)}</b><small>${i === 0 ? 'host' : i === H.seat ? 'you' : ''}</small></div>`).join('')}</div><p class="sub">Waiting for the host to begin.</p>` : ''}<div class="row"><span class="btn" id="hleave">Leave</span></div>`; }
    r += `<div class="mname"><span>Your name</span><input id="hname" maxlength="16" placeholder="Your name" value="${esc(store('crown-name') || '')}"></div>`;
    el.innerHTML = `<span class="btn hfs" id="hfsm"></span><div class="mleft">${left}</div><div class="v p mright">${r}</div>${MENU.info ? `<div class="minfo"><div class="v p"><div class="hd2">How to play</div>${HOW}<div class="row"><span class="btn go" id="hinfox">Close</span></div></div></div>` : ''}`;
    const on = (id, f) => { const e = $(id); if (e) e.onclick = f; };
    on('hfsm', HFS.toggle); HFS.draw(); on('hshelf', () => parent.postMessage({ hollow: 'shelf' }, '*')); on('hhow', () => { MENU.info = 1; MENU.draw(); }); on('hinfox', () => { MENU.info = null; MENU.draw(); });
    el.querySelectorAll('[data-mtab]').forEach(b => b.onclick = () => { if (H.room && !H.started) { roomClose(); H.host = H.guest = false; H.lobby = []; H.msg = ''; } MENU.tab = b.dataset.mtab; MENU.draw(); });
    el.querySelectorAll('[data-as]').forEach(b => b.onclick = () => { MENU.as = b.dataset.as; MENU.draw(); });
    el.querySelectorAll('[data-size]').forEach(b => b.onclick = () => { const n = +b.dataset.size; if (H.host && H.lobby.length > n) return; MENU.size = n; MAXP = n; store('hollow-size', String(n)); MENU.draw(); });
    el.querySelectorAll('[data-map]').forEach(b => b.onclick = () => { if (H.started) return; MENU.map = b.dataset.map; store('hollow-map', MENU.map); MENU.draw(); HGAME.loadMap(MENU.map).then(() => HGAME.demoGame()); });
    el.querySelectorAll('[data-screen]').forEach(b => b.onclick = () => { if (H.started) return; MENU.screen = b.dataset.screen === '1'; store('hollow-screen', MENU.screen ? '1' : '0'); MENU.draw(); });
    el.querySelectorAll('[data-hints]').forEach(b => b.onclick = () => { MENU.hints = b.dataset.hints === '1'; store('hollow-hints', MENU.hints ? '1' : '0'); MENU.draw(); });
    el.querySelectorAll('[data-scenes]').forEach(b => b.onclick = () => { MENU.scenes = b.dataset.scenes === '1'; store('hollow-scenes', MENU.scenes ? '1' : '0'); MENU.draw(); });
    el.querySelectorAll('[data-sv]').forEach(b => b.onclick = async () => { const S = HGAME.savesGet()[+b.dataset.sv]; await HGAME.loadMap((S.G && S.G.opt && S.G.opt.map) || 'monastery'); MENU.hide(); if (S.online) { HGAME.loadGame(S, { patch: { humans: [0], names: {} } }); HGAME.flash('Resumed alone: the other players\' brothers are played by the house.'); } else HGAME.loadGame(S); });
    el.querySelectorAll('[data-svx]').forEach(b => b.onclick = () => { const L = HGAME.savesGet(); L.splice(+b.dataset.svx, 1); store('hollow-saves', JSON.stringify(L)); MENU.draw(); });
    on('hsolo', async () => { await HGAME.loadMap(MENU.map); MENU.hide(); HGAME.newGame({ map: MENU.map, seed: (Date.now() % 2147483000) + 1, humans: [0], names: { 0: (store('crown-name') || '').trim() }, lot: true, scenes: MENU.scenes, hints: MENU.hints, size: MENU.size }); });
    on('hopen', () => { store('hollow-scenes', MENU.scenes ? '1' : '0'); hostOpen(); });
    on('hcopy', () => { try { navigator.clipboard.writeText(H.code); } catch (e) {} MENU.copied = 1; MENU.draw(); setTimeout(() => { MENU.copied = 0; MENU.draw(); }, 1500); });
    on('hclose', () => { roomClose(); H.host = false; H.lobby = []; MENU.draw(); });
    on('hstart', () => hostStart({ scenes: MENU.scenes, hints: MENU.hints, size: MENU.size, screen: MENU.screen, map: MENU.map }));
    const join = () => { const c = cleanRoom($('hcode').value); if (!c) { $('hcode').focus(); return; } MENU.code = c; guestJoin(c, myName()); };
    on('hjoin', join); if ($('hcode')) $('hcode').onkeydown = e => { if (e.key === 'Enter') join(); };
    on('hleave', () => { roomClose(); H.guest = false; H.lobby = []; H.msg = ''; MENU.draw(); });
    const nm = $('hname'); if (nm) nm.oninput = () => { store('crown-name', nm.value); if (H.host && H.lobby[0]) { H.lobby[0].name = nm.value || 'Brother'; } }; } };
window.addEventListener('message', e => { const d = e.data || {}; if (d.hollowJoin) { const c = cleanRoom(d.hollowJoin); if (c) { MENU.tab = 'join'; MENU.code = c; guestJoin(c, myName()); } } });
})();
