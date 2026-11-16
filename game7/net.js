'use strict';
/* ==========================================================================
   PLAYING TOGETHER — up to four people, each on their own device.
   Made the way Civ Sim's "Play together" is: a direct browser-to-browser
   link (WebRTC), set up by swapping two codes by hand (no server). Both
   sides press, both paste; the codes' fingerprints settle who opens the
   handshake.
   The host keeps the order of play: every move anyone makes is sent to the
   host, numbered, and sent back out, and every machine plays the moves in
   the same order with the same seeded dice. Now and then the host sends a
   checksum; a machine that has drifted asks for the host's copy.
   ========================================================================== */
const NET = { role: null, seat: null, links: {}, seq: 0, log: [], started: false, hashes: {}, snapWant: [] };
const NET_ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }];

/* ---- codes: the connection offer, packed small enough to paste ---- */
async function packCode(o) { const raw = new TextEncoder().encode(JSON.stringify(o));
  let bytes = raw; try { const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(raw); w.close(); bytes = new Uint8Array(await new Response(cs.readable).arrayBuffer()); } catch (e) {}
  let b = ''; for (const x of bytes) b += String.fromCharCode(x); return 'CROWN-' + (bytes === raw ? 'j' : 'z') + btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '~'; }
async function unpackCode(txt) { const m = /CROWN-([jz])([A-Za-z0-9_-]+)(~?)/.exec((txt || '').replace(/\s+/g, '')); if (!m) throw new Error('not a code'); if (!m[3]) throw new Error('cut short');
  const bin = atob(m[2].replace(/-/g, '+').replace(/_/g, '/')); let bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (m[1] === 'z') { const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(bytes); w.close(); bytes = new Uint8Array(await new Response(ds.readable).arrayBuffer()); }
  return JSON.parse(new TextDecoder().decode(bytes)); }
const fpOf = sdp => { const m = /a=fingerprint:sha-256 (\S+)/i.exec(sdp || ''); return m ? m[1].toUpperCase() : ''; };
function gathered(pc) { return new Promise(res => { if (pc.iceGatheringState === 'complete') return res(); let done = false, quiet = null, host = false, srflx = false;
  const fin = () => { if (done) return; done = true; clearTimeout(quiet); res(); };
  pc.onicecandidate = e => { if (!e.candidate) return fin(); const c = e.candidate.candidate || ''; if (c.includes('typ host')) host = true; if (c.includes('typ srflx') || c.includes('typ relay')) srflx = true; clearTimeout(quiet); quiet = setTimeout(fin, host && srflx ? 250 : 1500); };
  pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') fin(); }; setTimeout(fin, 6000); }); }

/* one link to one other machine (the host has one per guest; a guest has one, to the host) */
function makeLink(key, onState) {
  const L = { key, code: null, state: 'making', pc: null, ch: null, send: () => {}, met: false };
  if (typeof RTCPeerConnection === 'undefined') { L.state = 'nortc'; onState(L); return L; }
  const pc = L.pc = new RTCPeerConnection({ iceServers: NET_ICE });
  const ch = L.ch = pc.createDataChannel('crown', { ordered: true, negotiated: true, id: 0 });
  ch.onopen = () => { L.state = 'open'; L.send = s => { if (ch.readyState === 'open') ch.send(s); }; onState(L); };
  ch.onclose = () => { if (L.state === 'open') { L.state = 'closed'; onState(L); } };
  ch.onmessage = e => netOnMsg(L, e.data);
  pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { L.state = 'failed'; onState(L); } };
  pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => gathered(pc)).then(() => packCode({ sdp: pc.localDescription.sdp }))
    .then(code => { L.code = code; L.state = 'ready'; onState(L); }, e => { L.state = 'error'; L.err = e.message; onState(L); });
  return L; }
async function linkMeet(L, txt) {
  if (L.met) return 'Already connecting.'; let o; try { o = await unpackCode(txt); } catch (e) { return e.message === 'cut short' ? 'That code arrived incomplete: copy all of it.' : "That doesn't look like a code."; }
  if (!L.pc || !L.pc.localDescription) return 'Wait a moment for your own code first.';
  const mine = fpOf(L.pc.localDescription.sdp), theirs = fpOf(o.sdp); if (!theirs) return 'That code has no fingerprint in it.'; if (mine === theirs) return "That's your own code: paste the one they sent you.";
  L.met = true; try { await L.pc.setRemoteDescription({ type: 'answer', sdp: o.sdp.replace(/a=setup:actpass/g, 'a=setup:' + (mine < theirs ? 'active' : 'passive')) }); return 'Codes met. Connecting…'; }
  catch (e) { L.met = false; return 'That code would not take: ' + e.message; } }
// two tabs of one browser (and the tests): a BroadcastChannel per seat, no network at all
function localLink(key, onState) { const bc = new BroadcastChannel('crown-' + key), L = { key, state: 'open', local: true, send: s => bc.postMessage(s) }; bc.onmessage = e => netOnMsg(L, e.data); setTimeout(() => onState(L), 0); return L; }

/* ---- messages ---- */
function netSend(L, o) { try { L.send(JSON.stringify(o)); } catch (e) {} }
function netAll(o) { for (const k in NET.links) if (NET.links[k].state === 'open' && !NET.links[k].pending) netSend(NET.links[k], o); }
function netOnMsg(L, data) { let m; try { m = JSON.parse(data); } catch (e) { return; }
  if (NET.role === 'host') {
    if (m.t === 'hi') { L.name = m.name; lobbyDraw(); lobbyShare(); return; }
    if (m.t === 'colour') { const k = m.k; if (!NET.started && L.key && PALETTE.some(P => P.k === k) && !lcolTaken(k, L.key)) { LOBBY.cols[L.key] = k; lobbyDraw(); } lobbyShare(); return; }
    if (m.t === 'cmd') { if (!NET.started) return; m.c.by = L.key; hostSequence(m.c); return; }   // a guest can only ever act as their own seat
    if (m.t === 'chat') { if (NET.started && L.key) chatRoute(L.key, m.to && lord(m.to) ? m.to : null, String(m.text || '').slice(0, 240)); return; }
    if (m.t === 'want') { if (!NET.snapWant.includes(L)) NET.snapWant.push(L); if (idle()) hostSnaps(); return; }
  } else {
    if (m.t === 'seat') { NET.seat = m.seat; if (LOBBY.myCol && !NET.started) netSend(L, { t: 'colour', k: LOBBY.myCol }); lobbyDraw(); return; }
    if (m.t === 'lobby') { NET.lobby = m.seats; LOBBY.cols = m.cols || {}; lobbyDraw(); return; }
    if (m.t === 'start') { NET.started = true; NET.seat = m.seat; startGame(m.seed, m.humans, m.seats, m.snap ? m : null, { win: m.win, names: m.names, cols: m.cols, chset: m.chset, bots: m.bots }); return; }
    if (m.t === 'ingame') { LOBBY.ingame = m; lobbyDraw(); return; }
    if (m.t === 'do') { enqueue(m.c); return; }
    if (m.t === 'chat') { chatGot(m.from, m.to || null, m.text); return; }
    if (m.t === 'hash') { if (CQ.done === m.n && !CQ.running) compareHash(m.n, m.h); else if (CQ.done < m.n) NET.hashes[m.n] = m.h; return; }
    if (m.t === 'snap') { CQ.pendingSnap = m; if (idle()) onIdle(); return; }
  } }
function hostSequence(c) { c.n = ++NET.seq; netAll({ t: 'do', c }); enqueue(c); }
// every few moves the host says what the game should look like; a guest that disagrees asks for the host's copy
function stateHash() { let h = 0x811c9dc5; const mix = n => { h ^= (n | 0); h = Math.imul(h, 16777619) >>> 0; };
  mix(G.rs); mix(G.cur); mix(G.round); mix(G.robber); mix(G.tiles.length); for (const t of G.tiles) mix((t.mono ? LORDS.indexOf(t.mono) + 1 : 0) + (t.type === 'desert' ? 64 : 0)); for (const v of G.verts) { mix(v.level * 8 + v.wall + (v.ring || 0) * 1000); mix(v.owner ? LORDS.indexOf(v.owner) + 1 : 0); } for (const e of G.edges) { mix(e.owner ? LORDS.indexOf(e.owner) + 1 : 0); mix(e.wo ? LORDS.indexOf(e.wo) * 3 + e.whp + 1 : 0); mix((e.ra || 0) * 7 + (e.rb || 0)); }
  for (const L of G.lords) { for (const k of RES) mix(L.res[k]); mix(L.army.v); for (const k of UNITS) mix(L.army.units[k] || 0); mix(L.cards.length + L.fresh.length * 16); } return h >>> 0; }
function compareHash(n, h) { if (NET.asked) return; if (stateHash() !== h) { NET.asked = true; netSend(NET.links.host, { t: 'want' }); UI.toast('Catching up with the host…'); } }
function afterCommand(c) { if (!UI.net || !c.n) return; if (NET.role === 'host') netAll({ t: 'hash', n: c.n, h: stateHash() }); else if (NET.hashes[c.n] != null) { const h = NET.hashes[c.n]; delete NET.hashes[c.n]; compareHash(c.n, h); } }
// the host only ever sends its copy between moves, never halfway through one
function hostSnaps() { const s = snapshot(); for (const L of NET.snapWant) netSend(L, { t: 'snap', n: CQ.done, s }); NET.snapWant = []; }
function onIdle() { if (!UI.net) return; if (NET.role === 'host' && NET.snapWant.length) hostSnaps(); if (NET.role === 'host' && NET.rejoin && NET.rejoin.length) rejoinNow();
  if (NET.role === 'guest' && CQ.pendingSnap && CQ.done <= CQ.pendingSnap.n) { const m = CQ.pendingSnap; CQ.pendingSnap = null; loadSnapshot(m.s); CQ.done = m.n; NET.asked = false; NET.hashes = {}; UI.toast('Back in step with the host.'); } }
function snapshot() { return { v: G.verts.map(v => [v.owner, v.level, v.wall, v.ring || 0]), e: G.edges.map(e => e.owner), w: G.edges.map(e => e.wo ? [e.wo, e.whp] : 0), rs: G.edges.map(e => e.ra || e.rb ? [e.ra || 0, e.rb || 0] : 0), mo: G.tiles.map(t => t.mono ? [t.mono, t.num0] : 0), lords: G.lords.map(L => { const o = Object.assign({}, L); delete o.walk; delete o.at; return o; }),
  k: { robber: G.robber, deck: G.deck, phase: G.phase, setup: G.setup, cur: G.cur, round: G.round, dice: G.dice, lh: G.lh, winner: G.winner, rs: G.rs, offer: G.offer, bid: G.bid || 0, win: G.win, names: G.names, hurry: G.hurry || null, st: G.st || null, robBy: G.robBy || null, geo: G.geo || null, ports: G.ports || [], cols: G.cols || {}, parch: G.parch || null, chset: G.chset || null, bots: G.bots == null ? 1 : G.bots }, map: G.map.map(m => [m.q, m.r, m.type, m.num]) }; }
function loadSnapshot(s) { if (s.k && s.k.cols && JSON.stringify(s.k.cols) !== JSON.stringify(G.cols || {})) { applyColours(s.k.cols); setTimeout(() => { if (UI.static) buildRoads(); }, 0); } if (s.map && JSON.stringify(s.map) !== JSON.stringify(G.map.map(m => [m.q, m.r, m.type, m.num]))) { G.map = s.map.map(([q, r, type, num]) => ({ q, r, type, num })); rebuildIsle(); } s.v.forEach((a, i) => { const v = G.verts[i]; [v.owner, v.level, v.wall] = a; v.ring = a[3] || 0; }); s.e.forEach((o, i) => G.edges[i].owner = o); G.tiles.forEach((t, i) => { const m = s.mo && s.mo[i]; if (m) { t.mono = m[0]; t.num0 = m[1]; t.num = 0; } else if (t.mono) { t.num = t.num0; t.mono = null; } }); G.edges.forEach((e, i) => { const q = s.rs && s.rs[i]; e.ra = q ? q[0] : 0; e.rb = q ? q[1] : 0; }); G.edges.forEach((e, i) => { const w = s.w && s.w[i]; e.wo = w ? w[0] : null; e.whp = w ? w[1] : 0; }); s.lords.forEach((o, i) => Object.assign(G.lords[i], JSON.parse(JSON.stringify(o)), { walk: null, at: null })); Object.assign(G, JSON.parse(JSON.stringify(s.k))); landChanged(); hud(); }

/* ---- rooms: a short code everyone types in. Browsers find each other through public Nostr relays
   (via Trystero), then talk directly, as before. The manual codes stay as the fallback. ---- */
const ROOM = { room: null, act: null, code: null, hostPeer: null };
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newRoomCode = () => 'CROWN-' + Array.from({ length: 4 }, () => CODE_ABC[(Math.random() * CODE_ABC.length) | 0]).join('');
const cleanRoom = s => { const m = /([A-Z0-9]{4})\s*$/.exec((s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')); return m ? 'CROWN-' + m[1] : null; };
const atWeb = () => /^https?:/.test(location.protocol);
const shareText = (kind, code) => atWeb() ? location.href.split('#')[0] + '#' + kind + '=' + encodeURIComponent(code) : code;
function roomOpen(code) {
  if (typeof Trystero === 'undefined') { LOBBY.msg.room = '<span class="neg">Room codes need the internet. Use a manual code instead.</span>'; lobbyDraw(); return; }
  roomClose(); ROOM.code = code; ROOM.hostPeer = null;
  const cfg = { appId: 'crown-of-the-isle-v1', rtcConfig: { iceServers: NET_ICE } }; if (window.CROWN_RELAYS) cfg.relayConfig = { urls: window.CROWN_RELAYS };
  try { ROOM.room = Trystero.joinRoom(cfg, code); } catch (e) { LOBBY.msg.room = '<span class="neg">Could not reach the relays: ' + e.message + '</span>'; lobbyDraw(); return; }
  ROOM.act = ROOM.room.makeAction('m');
  ROOM.act.onMessage = (data, ctx) => roomMsg(ctx.peerId, data);
  ROOM.room.onPeerJoin = pid => { if (NET.role === 'host') roomSend(pid, JSON.stringify({ t: 'host', code })); };
  ROOM.room.onPeerLeave = pid => { for (const k in NET.links) { const L = NET.links[k]; if (L.peer === pid && L.state === 'open') { L.state = 'closed'; linkState(L); if (NET.role === 'host' && !NET.started) delete NET.links[k]; lobbyDraw(); } } };
}
function roomClose() { try { ROOM.room && ROOM.room.leave(); } catch (e) {} ROOM.room = ROOM.act = null; }
const roomSend = (pid, s) => { try { ROOM.act && ROOM.act.send(s, { target: pid }); } catch (e) {} };
function roomMsg(pid, data) { let m; try { m = JSON.parse(data); } catch (e) { return; }
  if (NET.role === 'guest') {
    if (m.t === 'host' && !ROOM.hostPeer) { ROOM.hostPeer = pid; const L = NET.links.host = { key: 'host', state: 'open', peer: pid, send: s => roomSend(pid, s) }; linkState(L); return; }
    if (pid !== ROOM.hostPeer) return;   // only ever listen to the host
    if (m.t === 'full') { LOBBY.msg.room = m.inGame ? '<span class="neg">That game is already under way and has no empty seat.</span>' : '<span class="neg">The host has no open seat for you yet: ask them to set one to Player.</span>'; lobbyDraw(); return; }
    if (m.t === 'unseat') { NET.seat = null; lobbyDraw(); return; }
    return netOnMsg(NET.links.host, data); }
  if (NET.role === 'host') { let L = Object.values(NET.links).find(x => x.peer === pid && x.state === 'open');
    if (!L && m.t === 'hi' && NET.started) return rejoinHello(pid, m.name);
    if (!L && m.t === 'reclaim' && NET.started) return rejoinSeat(pid, m.seat, m.name);
    if (!L && m.t === 'hi' && LOBBY.resume) return resumeHello(pid, m.name);
    if (!L && m.t === 'hi') { const seat = LORDS.slice(1).find(id => LOBBY.seats[id] === 'invite' && !(NET.links[id] && NET.links[id].state === 'open'));
      if (!seat) { ROOM.waiting = ROOM.waiting || {}; ROOM.waiting[pid] = m.name; lobbyDraw(); return roomSend(pid, JSON.stringify({ t: 'full' })); }
      const old = NET.links[seat]; if (old && old.pc) try { old.pc.close(); } catch (e) {}
      L = NET.links[seat] = { key: seat, state: 'open', peer: pid, name: m.name, send: s => roomSend(pid, s) }; if (ROOM.waiting) delete ROOM.waiting[pid]; linkState(L); return; }
    if (L) netOnMsg(L, data); } }
// someone waiting with no seat gets one as soon as the host opens a Player seat
/* ---- rejoining a game in progress: a dropped player's seat is held, and they get it back by name ---- */
function rejoinHello(pid, name) { const away = G.lords.filter(Q => Q.away), nm = (name || '').trim().toLowerCase();
  const mine = away.find(Q => nm && Q.away.toLowerCase() === nm); if (mine) return rejoinSeat(pid, mine.id, name);
  if (!away.length) return roomSend(pid, JSON.stringify({ t: 'full', inGame: true }));
  roomSend(pid, JSON.stringify({ t: 'ingame', round: G.round, cur: curL().id, seats: G.lords.map(Q => Q.id), away: away.map(Q => [Q.id, Q.away]) })); }
function rejoinSeat(pid, seat, name) { const Q = lord(seat); if (!Q || !Q.away) return roomSend(pid, JSON.stringify({ t: 'full', inGame: true }));
  const L = NET.links[seat] = { key: seat, state: 'open', pending: true, peer: pid, name: name || Q.away, send: s => roomSend(pid, s) };
  NET.rejoin = NET.rejoin || []; NET.rejoin.push(L); if (idle()) rejoinNow(); }
// only between moves: send the newcomer the whole game as it stands, then hand them the seat as the next move
function rejoinNow() { const R = NET.rejoin || []; NET.rejoin = []; for (const L of R) { const seats = G.lords.map(q => q.id), humans = G.lords.filter(q => q.human).map(q => q.id).concat(L.key);
    L.pending = false; netSend(L, { t: 'start', seed: G.seed, seats, humans, seat: L.key, snap: snapshot(), n: CQ.done, seq: NET.seq, gid: G.gid }); hostSequence({ type: 'back', seat: L.key, name: L.name, by: 'red' }); } }
/* ---- carrying on an online game from a save: the host reopens the same room and the players come back by name ---- */
function resumeHello(pid, name) { const S = LOBBY.resume, nm = (name || '').trim().toLowerCase(), want = S.humans.filter(id => id !== 'red' && !(NET.links[id] && NET.links[id].state === 'open'));
  const seat = want.find(id => (S.names[id] || '').toLowerCase() === nm) || want.find(id => !S.names[id]) || want[0];
  if (!seat) return roomSend(pid, JSON.stringify({ t: 'full' }));
  const L = NET.links[seat] = { key: seat, state: 'open', peer: pid, name: name || S.names[seat], send: s => roomSend(pid, s) }; linkState(L); }
function resumeOnline(S) { NET.role = 'host'; NET.seat = 'red'; NET.links = {}; LOBBY.view = 'host'; LOBBY.resume = S; LOBBY.msg = {}; roomOpen(S.online || newRoomCode()); lobbyDraw(); }
function resumeLocal(S) { UI.net = false; NET.role = null; startGame(S.seed, S.humans, S.seats, { snap: S.snap, n: S.n, seq: S.seq, gid: S.id }); }
function seatWaiting() { if (!ROOM.waiting) return; for (const [pid, name] of Object.entries(ROOM.waiting)) roomMsg(pid, JSON.stringify({ t: 'hi', name })); }

/* ---- the lobby ---- */
const SEATS0 = () => ({ red: 'you', blue: 'ai', gold: 'ai', violet: 'ai', green: 'none', white: 'none' });
const LOBBY = { view: 'shelf', seats: SEATS0(), msg: {}, name: '', win: 20, lnames: {}, cols: {}, pick: null, chmode: 'all', chpick: [], bots: 1, seed: (Math.random() * 1e6) | 0, myCol: null, info: null };
// colours in the lobby: each seat wears one of PALETTE; no two lords in play share one
const lcol = id => LOBBY.cols[id] || SEAT_COL[id];
const lseatsOn = () => NET.role === 'guest' && NET.lobby ? Object.keys(NET.lobby).filter(id => NET.lobby[id] !== 'none') : LORDS.filter(id => LOBBY.seats[id] !== 'none');
const lcolTaken = (k, id) => lseatsOn().some(o => o !== id && lcol(o) === k);
const lswatch = (id, can) => { const P = palOf(lcol(id)); return `<button class="lsw${LOBBY.pick === id ? ' on' : ''}${can ? '' : ' fixed'}" data-sw="${can ? id : ''}" style="background:${P.c}" title="${P.name}${can ? ' · click to change' : ''}"></button>`; };
const lpalette = id => `<div class="lpal">${PALETTE.map(P => { const t = lcolTaken(P.k, id); return `<button class="lpc${lcol(id) === P.k ? ' on' : ''}" data-pc="${t ? '' : id + ':' + P.k}" style="background:${P.c}" title="${P.name}${t ? ' (taken)' : ''}" ${t ? 'disabled' : ''}></button>`; }).join('')}</div>`;
function lobbyShare() { if (NET.role === 'host') netAll({ t: 'lobby', seats: LOBBY.seats, cols: LOBBY.cols }); }
function lobbyFixCols() { const used = new Set(); for (const id of lseatsOn()) { let k = lcol(id); if (used.has(k)) { k = PALETTE.find(P => !used.has(P.k) && !lseatsOn().some(o => o !== id && lcol(o) === P.k)).k; LOBBY.cols[id] = k; } used.add(k); } }
const WIN_OPTS = [10, 15, 20, 25, 30];
const winPick = () => `<div class="lseat"><span>Points to win</span><div class="seg2">${WIN_OPTS.map(w => `<button class="btn${LOBBY.win === w ? ' on' : ''}" data-win="${w}">${w}</button>`).join('')}</div></div>`;
try { LOBBY.name = localStorage.getItem('crown-name') || ''; LOBBY.myCol = localStorage.getItem('crown-col') || null; } catch (e) {}
const lopts = (names, cols) => ({ win: LOBBY.win, names, cols, chset: LOBBY.chmode === 'all' ? null : LOBBY.chmode === 'none' ? [] : LOBBY.chpick.slice(), bots: LOBBY.bots });
const SET_NAME = 'THE LONG TABLE';   // the name of the whole set of games: change it here
// the games on the shelf; only Crown of the Isle is playable so far
const SHELF = [{ k: 'crown', t: 'Lords of the Isle', d: 'Settle, trade and march. Roads and villages, hosts and sieges, eleven charters.', p: '2–6 lords', m: '40–60 min' }, { k: 'g3', t: 'The third game', d: 'Another box for the shelf, later on.', soon: 'Later' }];
const segG = (cur, opts, attr) => `<div class="seg2">${opts.map(([k, lab]) => `<button class="btn${cur === k ? ' on' : ''}" data-${attr}="${k}">${lab}</button>`).join('')}</div>`;
function gameOpts(count) { const big = count > 4; return winPick() +
  `<div class="lseat"><span>Charters</span>${segG(LOBBY.chmode, [['all', 'All eleven'], ['none', 'Old Ways only'], ['pick', 'Pick which']], 'chm')}</div>` +
  (LOBBY.chmode === 'pick' ? `<div class="lchk">${Object.entries(CHARTERS).map(([k, c]) => `<button class="btn mini${LOBBY.chpick.includes(k) ? ' on' : ''}" data-chk="${k}">${c.name}</button>`).join('')}</div>` : '') +
  `<div class="lseat"><span>Bots</span>${segG(LOBBY.bots, [[0, 'Gentle'], [1, 'Steady'], [2, 'Bloodthirsty']], 'bots')}</div>` +
  `<div class="lseat"><span>Isle</span><span class="lisle"><canvas id="lisle" width="150" height="110"></canvas><span><span class="small dim">${big ? (count > 5 ? 59 : 55) : 43} tiles · ${Math.max(1, count - 1)} harbour${count - 1 > 1 ? 's' : ''}</span><br><button class="btn mini" id="lreroll" style="margin-top:4px">Reroll the isle</button></span></span></div>`; }
function islePreview(count) { const c = $('lisle'); if (!c || count < 2) return; const g = c.getContext('2d'), M = makeMap(LOBBY.seed % 97 + 3, count), P = M.map(m => [1.732 * (m.q + m.r / 2), 1.5 * m.r, m]);
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]), x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1, k = Math.min(c.width / (x1 - x0), c.height / (y1 - y0));
  g.clearRect(0, 0, c.width, c.height); for (const [x, y, m] of P) { const cx = (x - x0) * k + (c.width - (x1 - x0) * k) / 2, cy = (y - y0) * k + (c.height - (y1 - y0) * k) / 2; g.beginPath(); for (let i = 0; i < 6; i++) { const a = (60 * i - 90) * Math.PI / 180; g.lineTo(cx + Math.cos(a) * k * .98, cy + Math.sin(a) * k * .98); } g.closePath(); g.fillStyle = TCOLR[m.type] || '#888'; g.fill(); g.strokeStyle = 'rgba(20,14,8,.55)'; g.lineWidth = 1; g.stroke(); } }
const INFO = { how: ['How to play', () => `<p><b>Goal.</b> Be first to the points target (20 unless the host changes it), or the last lord standing. A village is 1 point, a town 2, the Longest Road and the Greatest Host 2 each, and each chronicle card 1.</p>
  <p><b>Your turn.</b> Roll the dice: every land showing that number pays its good to the villages (1) and towns (2) on its corners. Then build, trade and play cards in any order, and march your host once.</p>
  <p><b>Building.</b> Roads run along the edges of lands; villages go on corners your roads reach, never next to another settlement; towns replace villages. Walls go on borders and raise a ring of stakes round any settlement they touch.</p>
  <p><b>Sevens.</b> On a 7 the roller moves the outlaw band onto a land, which stops paying, and robs one lord beside it.</p>
  <p><b>Hosts and battles.</b> Muster spearmen, archers and men-at-arms at your settlements. A march goes two steps along your own roads or one step anywhere else. Marching into a rival host or settlement starts a battle of two beats: each beat both sides pick Press, Hold or Loose. Press beats Loose, Loose beats Hold, Hold beats Press. Win at a settlement and it is yours.</p>
  <p><b>Sieges.</b> Walls and rings stop a host. Catapults batter them down, one shot each a turn, and the defenders' archers shoot back.</p>
  <p><b>Harbours.</b> Stand your host on a harbour's corner and you trade with the bank at 3 for 1 instead of 4 for 1. There is always one harbour fewer than there are lords.</p>
  <p><b>Charters.</b> Before settling, each lord may take a charter that bends one rule in their favour and one against them.</p>`],
  charters: ['The eleven charters', () => `<div class="lcharts">${Object.values(CHARTERS).map(c => `<div><b>${c.name}</b><span class="pos">+ ${c.boon}</span><span class="neg">− ${c.pen}</span></div>`).join('')}</div>`],
  news: ['What changed', () => `<p><b>This version.</b> A shelf of games as the main menu; your name and colour set once; join by room code from the menu; charter sets, bot temperament and isle reroll in the lobby; warm light and drifting cloud shadows over the map.</p>
  <p><b>Before that.</b> Harbours on single corners, one fewer than the lords. Twelve lord colours. Everyone picks charters at once after a ten-second look. A whole-isle zoom. Table chat and whispers online. Four new charters: Bandit Lord, Pioneer, Geomancer and Banking Guild.</p>
  <p><b>Earlier.</b> Rings with sides, sieges, two-beat battles with orders that counter each other, the end-of-game chronicle, hurry votes and autoplay.</p>`] };
const inPlay = () => LORDS.filter(id => LOBBY.seats[id] !== 'none');
function lobbyOpen() { $('lobby').style.display = ''; lobbyDraw(); setTimeout(() => { if (!G.lords && !UI.booting) demoWorld(); }, 250);
  const m = /#(room|join)=([^&]+)/.exec(location.hash); if (m) { const v = decodeURIComponent(m[2]); if (m[1] === 'room') { guestRoom(cleanRoom(v)); } else { guestManual(v); } } }
function guestRoom(code) { if (!code) return; NET.role = 'guest'; NET.links = {}; LOBBY.view = 'join'; LOBBY.manual = false; LOBBY.joinCode = code; LOBBY.msg.room = 'Looking for the host…'; roomOpen(code); lobbyDraw();
  clearTimeout(LOBBY.slowT); LOBBY.slowT = setTimeout(() => { if (NET.role === 'guest' && !ROOM.hostPeer && LOBBY.view === 'join' && !LOBBY.manual) { LOBBY.msg.room = 'Still looking… Check the code, and that the host has the lobby open. If it never connects, use a manual code.'; lobbyDraw(); } }, 15000); }
function guestManual(pasted) { roomClose(); NET.role = 'guest'; NET.links = {}; LOBBY.view = 'join'; LOBBY.manual = true; const L = NET.links.host = makeLink('host', linkState);
  if (pasted) { const t = setInterval(async () => { if (L.state === 'ready' || L.state === 'error') { clearInterval(t); LOBBY.msg.host = await linkMeet(L, pasted); lobbyDraw(); } }, 200); } lobbyDraw(); }
function lobbyDraw() {
  const el = $('lobby'); if (!el || el.style.display === 'none') return;
  const ae = document.activeElement, keep = ae && ae.id === 'lname' ? ae.value : null;
  const nm = id => `<i style="background:${COLS[id]}"></i>${PNAME[id]}`;
  el.classList.toggle('shelf', LOBBY.view === 'shelf'); if (LOBBY.view !== 'shelf' && !UI.demo && !G.lords) demoWorld();   // the live isle is built before the page is ever shown: no still picture
  el.style.backgroundImage = LOBBY.view === 'shelf' ? '' : 'linear-gradient(90deg,rgba(6,10,20,.25),rgba(6,10,20,.8) 58%)';
  if (LOBBY.view === 'shelf') { const P = palOf(LOBBY.myCol || 'crimson');
    el.innerHTML = `<div class="shwrap"><div class="shsub">A BOX OF BOARD GAMES</div><div class="shtitle">${SET_NAME}</div>
      <div class="shrow">${SHELF.map(o => `<div class="shcard${o.soon ? ' dim2' : ' on'}"><div class="shimg" ${o.k === 'crown' ? `style="background-image:url(${COVER_CROWN})"` : o.k === 'hollow' ? `style="background-image:url(${COVER_HOLLOW})"` : ''}>${o.soon ? '<b>?</b>' : '<span class="shtag">Play now</span>'}</div><div class="shbody"><div class="sht">${o.t}</div><div class="shd">${o.d}</div><div class="shm">${o.p ? `<span>${o.p}</span><span>${o.m}</span>` : ''}</div>${o.soon ? `<button class="btn big" disabled>${o.soon}</button>` : (o.k === 'hollow' ? `<div style="display:flex;gap:6px"><button class="btn big war" id="shhollow" style="flex:1">Play</button></div>` : `<div style="display:flex;gap:6px"><button class="btn big war" id="shplay" style="flex:1">Play</button>${savesGet().length ? '<button class="btn big" id="shcont">Continue</button>' : ''}</div>`)}</div></div>`).join('')}</div>
      <div class="shbar"><div class="gl shme"><button class="lsw${LOBBY.pick === 'me' ? ' on' : ''}" id="shsw" style="background:${P.c}" title="${P.name} · click to change"></button><input id="shname" placeholder="Your name" maxlength="16" value="${esc2(LOBBY.name)}"><span class="small dim">your name and colour carry into every game</span>${LOBBY.pick === 'me' ? `<div class="shpal">${PALETTE.map(Q => `<button class="lpc${P.k === Q.k ? ' on' : ''}" data-mycol="${Q.k}" style="background:${Q.c}" title="${Q.name}"></button>`).join('')}</div>` : ''}</div>
      <div class="gl shme"><span class="small dim">Got a room code?</span><input id="shroom" placeholder="CROWN- or HOLLOW-XXXX" maxlength="11" style="text-transform:uppercase;width:130px;flex:none"><button class="btn war" id="shjoin">Join</button></div></div></div>`;
    const enter = () => { LOBBY.view = 'menu'; LOBBY.pick = null; if (LOBBY.myCol) LOBBY.cols.red = LOBBY.myCol; if (LOBBY.name && !LOBBY.lnames.red) LOBBY.lnames.red = LOBBY.name; lobbyFixCols(); lobbyDraw(); };
    $('shplay').onclick = enter;  const sc = $('shcont'); if (sc) sc.onclick = () => { const S = savesGet()[0]; if (!S) return enter(); LOBBY.view = 'menu'; S.online ? resumeOnline(S) : resumeLocal(S); };
    $('shsw').onclick = () => { LOBBY.pick = LOBBY.pick === 'me' ? null : 'me'; lobbyDraw(); };
    el.querySelectorAll('[data-mycol]').forEach(b => b.onclick = () => { LOBBY.myCol = b.dataset.mycol; LOBBY.pick = null; try { localStorage.setItem('crown-col', LOBBY.myCol); } catch (e) {} lobbyDraw(); });
    $('shname').oninput = () => { LOBBY.name = $('shname').value; try { localStorage.setItem('crown-name', LOBBY.name); } catch (e) {} };
    const sj = () => { if (/HOLLOW/i.test($('shroom').value)) { location.href = 'hollow.html#join=' + encodeURIComponent($('shroom').value.trim().toUpperCase()); return; } const c = cleanRoom($('shroom').value); if (!c) { $('shroom').focus(); return; } LOBBY.name = (LOBBY.name || '').trim(); if (LOBBY.myCol) LOBBY.cols.red = LOBBY.myCol; guestRoom(c); }; $('shjoin').onclick = sj; $('shroom').onkeydown = e => { if (e.key === 'Enter') sj(); };
    return; }
  const tabOn = LOBBY.view === 'menu' ? 'menu' : LOBBY.view === 'host' ? 'host' : 'join';
  let left = `<button class="btn" id="lshelf">‹ All games</button><div class="cptitle">Lords of<br>the Isle</div><div class="cppitch">Roll the dice, build roads and villages, and raise hosts that march into battles you fight beat by beat. First to the points target, or the last lord standing.</div><div class="cplinks"><button class="btn" data-info="how">How to play</button><button class="btn" data-info="charters">The eleven charters</button></div>`;
  let h = `<div class="gl lbox">` + (LOBBY.resume ? '' : `<div class="ltabs">${[['menu', 'This device'], ['host', 'Host online'], ['join', 'Join with a code']].map(([k, t]) => `<button class="${tabOn === k ? 'on' : ''}" data-tab="${k}">${t}</button>`).join('')}</div>`);
  const seg = (id, opts, attr) => `<div class="seg2">${opts.map(([k, lab]) => `<button class="btn${LOBBY.seats[id] === k ? ' on' : ''}" data-${attr}="${id}:${k}">${lab}</button>`).join('')}</div>`;
  const count = inPlay().length, big = count > 4, warn = count < 2 ? '<div class="neg small">At least two seats must be filled.</div>' : '';
  const sizeNote = `<div class="small dim" style="margin-top:4px">${count} lord${count === 1 ? '' : 's'} · ${big ? 'the larger island (' + (count > 5 ? 59 : 55) + ' tiles)' : 'the island of 43 tiles'}</div>`;
  if (LOBBY.view === 'menu') {
    const saves = savesGet(); if (saves.length) { const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : new Date(t).toLocaleDateString(); };
      left += `<div class="gl cpsaves"><div class="lsec" style="margin-top:0">Continue</div><div class="svlist">${saves.map((S, i) => `<div class="sv">${S.thumb ? `<img src="${S.thumb}">` : '<img>'}<div><b>Round ${S.meta.round} · ${S.meta.setup ? 'settling' : ((S.online ? S.meta.cur === 'red' : S.humans.length === 1 && S.humans[0] === S.meta.cur) ? 'your turn' : PNAME[S.meta.cur] + "'s turn")}</b>${S.online ? `<span class="chip">online · ${S.online}</span>` : ''}<span class="dots">${S.seats.map(id => `<i style="background:${COLS[id]}" title="${PNAME[id]}${S.humans.includes(id) ? ' (player' + (S.names[id] ? ': ' + esc2(S.names[id]) : '') + ')' : ' (computer)'}"></i>`).join('')}</span><small>${ago(S.t)}${S.meta.lead ? ' · ' + PNAME[S.meta.lead] + ' leads with ' + S.meta.pts : ''}</small></div><div class="acts"><button class="btn${i ? '' : ' war'}" data-resume="${i}">Resume</button><button class="btn" data-export="${i}" title="Save to a file">⤓</button><button class="btn" data-del="${i}" title="Delete">✕</button></div></div>`).join('')}</div></div>`; }
    left += `<div class="small cpnote">Games save themselves after every move. <a href="#" id="lload">Load a save file</a><input type="file" id="lfile" accept=".json,application/json" style="display:none"></div>`;
    h += `<div class="lsec" style="margin-top:0">The lords</div><div class="small dim">Pass the device round. Each seat is a player, the computer, or empty; five or six lords play on a bigger island.</div>
      ${LORDS.map(id => `<div class="lseat"><span>${LOBBY.seats[id] === 'none' ? nm(id) : lswatch(id, true) + '<b style="color:' + palOf(lcol(id)).l + '">' + palOf(lcol(id)).name + '</b>'}${LOBBY.seats[id] === 'you' ? ` <input class="lpn" data-lpn="${id}" placeholder="name" maxlength="16" value="${esc2(LOBBY.lnames[id] || '')}">` : ''}</span>${seg(id, [['you', 'Player'], ['ai', 'Computer'], ['none', 'None']], 'ls')}</div>${LOBBY.pick === id && LOBBY.seats[id] !== 'none' ? lpalette(id) : ''}`).join('')}<div class="lsec">The game</div>${gameOpts(count)}${warn}
      <div class="row3" style="align-items:center"><span class="small dim" style="margin-right:auto">Turn order is drawn by lot.</span><button class="btn big war" id="lgo" ${count < 2 ? 'disabled' : ''}>Start</button></div>`;
  }
  if (LOBBY.view === 'host' && LOBBY.resume) { const S = LOBBY.resume;
    h += `<div class="lsec">Carrying on · round ${S.meta.round}</div><div class="roomcode"><b>${ROOM.code || '…'}</b><button class="btn" id="lcopyroom">${LOBBY.copied === 'room' ? 'Copied' : 'Copy'}</button></div>
      <div class="small dim">Same room as before. Your players press <b>Join a game</b> and type it in; each gets their old seat back by name.</div>${LOBBY.msg.room ? `<div class="small">${LOBBY.msg.room}</div>` : ''}<div class="lsec">Seats · you are ${nm('red')}</div>`;
    for (const id of S.seats.filter(x => x !== 'red')) { const L = NET.links[id], hum = S.humans.includes(id);
      h += `<div class="lcard"><div class="lseat"><span>${nm(id)}</span><span class="small dim">${hum ? 'player' : 'computer'}</span></div>${hum ? (L && L.state === 'open' ? `<div class="pos small">✓ ${esc2(L.name) || 'A player'} is back.</div>` : `<div class="small dim">Waiting for ${esc2(S.names[id]) || 'their player'}… If they don't come, the computer plays the seat and holds it for them.</div>`) : ''}</div>`; }
    h += `<div class="row3"><button class="btn" id="lback">Back</button><button class="btn big war" id="lstart">Carry on the game</button></div>`;
  }
  if (LOBBY.view === 'host' && !LOBBY.resume) {
    h += `<div class="lsec">Your room</div><div class="roomcode"><b>${ROOM.code || '…'}</b><button class="btn" id="lcopyroom">${LOBBY.copied === 'room' ? 'Copied' : 'Copy'}</button></div>
      <div class="small dim">Send this to your friends. They press <b>Join a game</b> and type it in, then appear in a seat set to Player below.</div>${LOBBY.msg.room ? `<div class="small">${LOBBY.msg.room}</div>` : ''}
      ${LOBBY.pick === 'red' ? lpalette('red') : ''}<div class="lsec">Seats · you are ${lswatch('red', true)}<b style="color:${palOf(lcol('red')).l}">${palOf(lcol('red')).name}</b> <input id="lname" placeholder="Your name" maxlength="16" value="${esc2(LOBBY.name)}" style="margin-left:8px"></div>`;
    for (const id of LORDS.slice(1)) { const L = NET.links[id], st = LOBBY.seats[id];
      const joined = st === 'invite' && L && L.state === 'open', P = palOf(lcol(id));
      h += `<div class="lcard"><div class="lseat"><span>${st === 'none' ? nm(id) : lswatch(id, !joined) + '<b style="color:' + P.l + '">' + (joined && L.name ? esc2(L.name) : P.name) + '</b>' + (joined ? ' <span class="small dim">picks their own colour</span>' : '')}</span>${seg(id, [['invite', 'Player'], ['ai', 'Computer'], ['none', 'None']], 'hs')}</div>${LOBBY.pick === id && st !== 'none' && !joined ? lpalette(id) : ''}`;
      if (st === 'invite') {
        if (L && L.state === 'open') h += `<div class="pos small">✓ ${esc2(L.name) || 'A player'} is in, wearing ${palOf(lcol(id)).name}${L.peer ? '' : ' (manual code)'}.</div>`;
        else if (L && L.manual) h += `<div class="small dim">1 · Send them this code${L.code ? ` <button class="btn mini" data-copy="${id}">${LOBBY.copied === id ? 'Copied' : 'Copy'}</button>` : ' (making it…)'}</div><textarea readonly>${L.code || ''}</textarea><div class="small dim">2 · Paste the code they send back</div><textarea data-paste="${id}" placeholder="CROWN-…"></textarea><div class="small">${LOBBY.msg[id] || ''}${L.state === 'failed' ? '<span class="neg">The link failed. Switch this seat to Computer and back, then try again.</span>' : ''}</div>`;
        else h += `<div class="small dim">Waiting for someone to join with the room code… <a href="#" data-man="${id}">use a manual code</a></div>`; }
      h += `</div>`; }
    const wait = ROOM.waiting && Object.keys(ROOM.waiting).length; if (wait) h += `<div class="small neg">${wait} player${wait > 1 ? 's are' : ' is'} in the room without a seat: set a seat to Player.</div>`;
    h += `<div class="lsec">The game</div>` + gameOpts(count) + warn + `<div class="row3"><button class="btn" id="lback">Back</button><button class="btn big war" id="lstart" ${count < 2 ? 'disabled' : ''}>Start the game</button></div>`;
  }
  if (LOBBY.view === 'join') { const L = NET.links.host;
    h += `<div class="lsec" style="margin-top:0">Join a friend's game</div>`;
    if (L && L.state === 'open' && LOBBY.ingame && !NET.seat) { const I = LOBBY.ingame; h += `<div class="lcard" style="border-color:#c79a3e"><div class="pos">✓ Found the game in progress · round ${I.round}</div><div class="small dim" style="margin:4px 0">${I.away.length > 1 ? 'These seats are' : 'This seat is'} held for a player who lost connection. Take yours back:</div>${I.away.map(([id, nmv]) => `<div class="lseat"><span>${nm(id)} <span class="dim" style="font:400 11px var(--ui)">· ${esc2(nmv)}</span></span><button class="btn war" data-reclaim="${id}">Take my seat back</button></div>`).join('')}</div>`; }
    else if (L && L.state === 'open') h += `<div class="pos">✓ In the room${NET.seat ? `. You play ${lswatch(NET.seat, false)}<b style="color:${palOf(lcol(NET.seat)).l}">${palOf(lcol(NET.seat)).name}</b>` : ''}.</div>${NET.seat ? '<div class="small dim" style="margin-top:6px">Choose your colour:</div>' + lpalette(NET.seat) : ''}<div class="dim small">${NET.seat ? 'Waiting for the host to start…' : ''}</div>${LOBBY.msg.room && !NET.seat ? `<div class="small">${LOBBY.msg.room}</div>` : ''}`;
    else if (!LOBBY.manual) h += `<div class="lseat" style="gap:8px"><input id="lname" placeholder="Your name" maxlength="16" value="${esc2(LOBBY.name)}"><input id="lroom" placeholder="CROWN-XXXX" maxlength="11" value="${LOBBY.joinCode || ''}" style="text-transform:uppercase"><button class="btn war" id="lroomgo">Join</button></div><div class="small">${LOBBY.msg.room || ''}</div><div class="small dim" style="margin-top:8px">Can't connect? <a href="#" id="lmanual">Use a manual code</a> instead.</div>`;
    else h += `<div class="small dim">1 · Paste the code the host sent you</div><textarea data-paste="host" placeholder="CROWN-…"></textarea><div class="small dim">2 · Send this code back to the host${L && L.code ? ` <button class="btn mini" data-copy="host">${LOBBY.copied === 'host' ? 'Copied' : 'Copy'}</button>` : ' (making it…)'}</div><textarea readonly>${L && L.code || ''}</textarea><div class="small">${LOBBY.msg.host || ''}${L && L.state === 'failed' ? '<span class="neg">The link failed: press Back and try again with fresh codes on both sides.</span>' : ''}</div>`;
    h += `<div class="row3"><button class="btn" id="lback">Back</button></div>`;
  }
  const I = LOBBY.info && INFO[LOBBY.info];
  el.innerHTML = `<div class="cpage"><div class="cpleft">${left}</div>${h}</div></div>` + (I ? `<div class="linfo"><div class="gl"><div class="lt" style="font-size:20px">${I[0]}</div>${I[1]()}<div class="row3"><button class="btn big" id="linfox">Close</button></div></div></div>` : '');
  islePreview(count);
  if (keep != null && $('lname')) { $('lname').value = keep; $('lname').focus(); }
  const copy = (txt, tag) => { try { navigator.clipboard.writeText(txt); } catch (e) {} LOBBY.copied = tag; lobbyDraw(); setTimeout(() => { LOBBY.copied = null; lobbyDraw(); }, 1500); };
  el.querySelectorAll('[data-ls]').forEach(b => b.onclick = () => { const [id, k] = b.dataset.ls.split(':'); LOBBY.seats[id] = k; lobbyFixCols(); lobbyDraw(); });
  const go = $('lgo'); if (go) go.onclick = () => { if (inPlay().length < 2) return; UI.net = false; NET.role = null; $('lobby').style.display = 'none'; const hum = LORDS.filter(id => LOBBY.seats[id] === 'you'), names = {}; for (const id of hum) { const v = (LOBBY.lnames[id] || '').trim(); if (v) names[id] = v; } lobbyFixCols(); const cols = {}; for (const id of inPlay()) cols[id] = lcol(id); const seed = LOBBY.seed; LOBBY.seed = (Math.random() * 1e6) | 0; startGame(seed, hum, inPlay(), null, lopts(names, cols)); };
  el.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { const id = b.dataset.sw; if (!id) return; LOBBY.pick = LOBBY.pick === id ? null : id; lobbyDraw(); });
  el.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { if (!b.dataset.pc) return; const [id, k] = b.dataset.pc.split(':'); if (NET.role === 'guest') { netSend(NET.links.host, { t: 'colour', k }); LOBBY.cols[id] = k; lobbyDraw(); return; } if (lcolTaken(k, id)) return; LOBBY.cols[id] = k; LOBBY.pick = null; lobbyDraw(); lobbyShare(); });
  el.querySelectorAll('[data-win]').forEach(b => b.onclick = () => { LOBBY.win = +b.dataset.win; lobbyDraw(); });
  el.querySelectorAll('[data-lpn]').forEach(i => i.oninput = () => { LOBBY.lnames[i.dataset.lpn] = i.value; });
  const ln = $('lname'); if (ln && LOBBY.view === 'host') ln.oninput = () => { LOBBY.name = ln.value; try { localStorage.setItem('crown-name', ln.value); } catch (e) {} };
  const goHost = () => { NET.role = 'host'; NET.seat = 'red'; NET.links = {}; LOBBY.view = 'host'; LOBBY.seats = SEATS0(); LOBBY.seats.blue = 'invite'; LOBBY.msg = {}; if (LOBBY.myCol) LOBBY.cols.red = LOBBY.myCol; lobbyFixCols(); roomOpen(newRoomCode()); lobbyDraw(); };
  const goJoin = () => { NET.role = 'guest'; NET.links = {}; LOBBY.view = 'join'; LOBBY.manual = false; LOBBY.msg = {}; lobbyDraw(); const i = $('lroom'); if (i) i.focus(); };
  const rg = $('lroomgo'), doJoin = () => { const nmv = ($('lname').value || '').trim(); LOBBY.name = nmv; try { localStorage.setItem('crown-name', nmv); } catch (e) {} const c = cleanRoom($('lroom').value); if (!c) { LOBBY.msg.room = '<span class="neg">Type the room code, like CROWN-K7QX.</span>'; lobbyDraw(); return; } guestRoom(c); };
  if (rg) { rg.onclick = doJoin; $('lroom').onkeydown = e => { if (e.key === 'Enter') doJoin(); }; }
  const lm = $('lmanual'); if (lm) lm.onclick = e => { e.preventDefault(); guestManual(); };
  const cr = $('lcopyroom'); if (cr) cr.onclick = () => copy(shareText('room', ROOM.code), 'room');
  const leave = () => { roomClose(); for (const k in NET.links) try { NET.links[k].pc && NET.links[k].pc.close(); } catch (e) {} NET.links = {}; NET.role = null; ROOM.waiting = null; LOBBY.resume = null; LOBBY.ingame = null; LOBBY.view = 'menu'; LOBBY.seats = SEATS0(); LOBBY.msg = {}; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} lobbyDraw(); };
  const bk = $('lback'); if (bk) bk.onclick = leave;
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { const k = b.dataset.tab; if (k === tabOn) return; if (LOBBY.view !== 'menu') leave(); if (k === 'host') goHost(); if (k === 'join') goJoin(); });
  const sh = $('lshelf'); if (sh) sh.onclick = () => { if (LOBBY.view !== 'menu') leave(); LOBBY.view = 'shelf'; LOBBY.pick = null; LOBBY.info = null; lobbyDraw(); };
  el.querySelectorAll('[data-info]').forEach(b => b.onclick = () => { LOBBY.info = b.dataset.info; lobbyDraw(); }); const ix = $('linfox'); if (ix) ix.onclick = () => { LOBBY.info = null; lobbyDraw(); };
  el.querySelectorAll('[data-chm]').forEach(b => b.onclick = () => { LOBBY.chmode = b.dataset.chm; if (LOBBY.chmode === 'pick' && !LOBBY.chpick.length) LOBBY.chpick = Object.keys(CHARTERS); lobbyDraw(); });
  el.querySelectorAll('[data-chk]').forEach(b => b.onclick = () => { const k = b.dataset.chk, i = LOBBY.chpick.indexOf(k); i < 0 ? LOBBY.chpick.push(k) : LOBBY.chpick.splice(i, 1); lobbyDraw(); });
  el.querySelectorAll('[data-bots]').forEach(b => b.onclick = () => { LOBBY.bots = +b.dataset.bots; lobbyDraw(); });
  const rr = $('lreroll'); if (rr) rr.onclick = () => { LOBBY.seed = (Math.random() * 1e6) | 0; lobbyDraw(); };
  el.querySelectorAll('[data-hs]').forEach(b => b.onclick = () => { const [id, k] = b.dataset.hs.split(':'); const old = NET.links[id]; if (old && k !== 'invite') { if (old.pc) try { old.pc.close(); } catch (e) {} if (old.peer) { roomSend(old.peer, JSON.stringify({ t: 'unseat' })); ROOM.waiting = ROOM.waiting || {}; ROOM.waiting[old.peer] = old.name; } delete NET.links[id]; } LOBBY.msg[id] = '';
    LOBBY.seats[id] = k; if (k === 'invite') seatWaiting(); lobbyFixCols(); lobbyDraw(); lobbyShare(); });
  el.querySelectorAll('[data-man]').forEach(a => a.onclick = e => { e.preventDefault(); const id = a.dataset.man; const L = NET.links[id] = makeLink(id, linkState); L.manual = true; lobbyDraw(); });
  el.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { const k = b.dataset.copy, L = NET.links[k]; copy(L.code, k); });
  el.querySelectorAll('[data-paste]').forEach(t => t.oninput = async () => { const k = t.dataset.paste, L = NET.links[k], v = decodeURIComponent(t.value.replace(/\s+/g, '')); if (!L || !/CROWN-\S+~/.test(v)) return; LOBBY.msg[k] = await linkMeet(L, v); lobbyDraw(); });
  const st = $('lstart'); if (st) st.onclick = () => hostStart();
  el.querySelectorAll('[data-resume]').forEach(b => b.onclick = () => { const S = savesGet()[+b.dataset.resume]; if (!S) return; S.online ? resumeOnline(S) : resumeLocal(S); });
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const a = savesGet(); if (!confirm('Delete this saved game?')) return; a.splice(+b.dataset.del, 1); savesPut(a); lobbyDraw(); });
  el.querySelectorAll('[data-export]').forEach(b => b.onclick = () => { const S = savesGet()[+b.dataset.export], a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = `crown-of-the-isle-round${S.meta.round}.json`; a.click(); });
  const ll = $('lload'); if (ll) { ll.onclick = e => { e.preventDefault(); $('lfile').click(); }; $('lfile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const S = JSON.parse(await f.text()); if (!S.snap || !S.seats) throw 0; const a = savesGet().filter(x => x.id !== S.id); a.unshift(S); savesPut(a); lobbyDraw(); } catch (err) { alert("That file isn't a Lords of the Isle save."); } }; }
  el.querySelectorAll('[data-reclaim]').forEach(b => b.onclick = () => { netSend(NET.links.host, { t: 'reclaim', seat: b.dataset.reclaim, name: LOBBY.name }); b.disabled = true; b.textContent = 'Joining…'; });
}
const esc2 = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function linkState(L) {
  if (NET.role === 'host' && L.state === 'open') { netSend(L, { t: 'seat', seat: L.key }); lobbyFixCols(); lobbyShare(); }
  if (NET.role === 'host' && L.state === 'closed' && NET.started) { hostSequence({ type: 'drop', seat: L.key, name: L.name, by: 'red' }); delete NET.links[L.key]; }
  if (NET.role === 'guest' && L.state === 'open') netSend(L, { t: 'hi', name: LOBBY.name || 'Player' });
  if (NET.role === 'guest' && L.state === 'closed' && NET.started) { UI.toast('The link to the host was lost. The game cannot go on from here.', 'war'); }
  lobbyDraw(); }
function hostStart() {
  if (LOBBY.resume) { const S = LOBBY.resume, open = id => NET.links[id] && NET.links[id].state === 'open', humans = ['red'].concat(S.seats.filter(id => id !== 'red' && open(id)));
    const snap = JSON.parse(JSON.stringify(S.snap)); snap.lords.forEach(o => { const was = S.humans.includes(o.id); o.human = humans.includes(o.id); o.away = was && !o.human ? (S.names[o.id] || PNAME[o.id]) : (o.away && !o.human ? o.away : null); });
    NET.started = true; for (const id of humans) if (id !== 'red') netSend(NET.links[id], { t: 'start', seed: S.seed, humans, seats: S.seats, seat: id, snap, n: S.n, seq: S.seq, gid: S.id });
    startGame(S.seed, humans, S.seats, { snap, n: S.n, seq: S.seq, gid: S.id }); return; }
  if (inPlay().length < 2) return;
  const open = id => LOBBY.seats[id] === 'invite' && NET.links[id] && NET.links[id].state === 'open';
  const humans = ['red'].concat(LORDS.slice(1).filter(open)), pending = LORDS.slice(1).filter(id => LOBBY.seats[id] === 'invite' && !open(id));
  if (pending.length && !confirmStart(pending)) return;
  const seats = inPlay(), seed = LOBBY.seed; LOBBY.seed = (Math.random() * 1e6) | 0; NET.started = true; NET.seq = 0;
  const names = {}; if ((LOBBY.name || '').trim()) names.red = LOBBY.name.trim(); for (const id of humans) if (id !== 'red' && NET.links[id] && NET.links[id].name) names[id] = NET.links[id].name;
  const cols = {}; for (const id of seats) cols[id] = lcol(id);
  for (const id of humans) if (id !== 'red') netSend(NET.links[id], Object.assign({ t: 'start', seed, humans, seats, seat: id }, lopts(names, cols)));
  startGame(seed, humans, seats, null, lopts(names, cols));
}
function confirmStart(pending) { const el = $('lobby').querySelector('.lbox'); if (LOBBY.warned) { LOBBY.warned = false; return true; } LOBBY.warned = true; const d = document.createElement('div'); d.className = 'neg small'; d.textContent = `${pending.map(id => PNAME[id]).join(', ')} not connected yet: press Start again to let the computer play ${pending.length > 1 ? 'those seats' : 'that seat'}.`; el.appendChild(d); return false; }
// for tests: tabs of one browser joined by BroadcastChannels
window.netLocalHost = seats => { NET.role = 'host'; NET.seat = 'red'; NET.links = {}; for (const id of seats) { LOBBY.seats[id] = 'invite'; NET.links[id] = localLink(id, linkState); } LOBBY.view = 'host'; lobbyDraw(); };
window.netLocalJoin = seat => { NET.role = 'guest'; NET.links = { host: localLink(seat, linkState) }; LOBBY.view = 'join'; NET.seat = seat; lobbyDraw(); };
