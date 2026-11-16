'use strict';
/* ==========================================================================
   SKIRMISH — Civ Sim style fighting in beats. Before every beat both sides
   choose an action; until then the fighters only circle and posture. Then
   for a few seconds they close in and strike; every blow is a roll:
   d6 + edge against d6 + guard.
   ========================================================================== */
const SK = {
  base: { sword: [2, 0], spear: [1, 1], archer: [-1, -1], militia: [0, 1] },
  reach: { sword: 14, spear: 18, archer: 11, militia: 11 },
  hp: { sword: 3, spear: 3, archer: 2, militia: 3 },
  BEAT: 4.2, MAXBEATS: 2,
};
const ORDERS = {
  press: { name: 'Press', glyph: '⚔', short: 'Edge +1, strike often', col: '#e9675a', desc: 'Edge +1. Strike often. Beats Loose: you rush the bows (they shoot as normal, you get +1 more).' },
  hold: { name: 'Hold', glyph: '▣', short: 'Guard +1, arrows hit only on 6', col: '#7fa7d8', desc: 'Guard +1. Arrows hit only on 6. Beats Press: you brace (their +1 is lost, yours is +1 edge).' },
  loose: { name: 'Loose', glyph: '➶', short: 'Bowmen shoot twice as often', col: '#9fd18a', desc: 'Bowmen shoot twice as often. Beats Hold: arrows find packed ranks (they hit on 4+).' },
  fall: { name: 'Fall back', glyph: '⇠', desc: 'Break off. They get a parting volley.' },
};
function skRand(a, b) { return a + rand() * (b - a); }
function skAdd(S, side, u, x, y, extra) { const sd = S.sides[side]; S.F.push(Object.assign({ id: S.nid++, side, owner: sd.owner === 'neutral' ? 'raider' : sd.owner, k: u, x, y, vx: 0, vy: 0, hp: SK.hp[u], alive: true, who: S.nid % 3, mode: 'in', mt: skRand(.8, 2.4), strafe: rand() < .5 ? 1 : -1, st: skRand(.5, 1.8), cd: skRand(.4, 1.2), act: null, at: 0, walkPh: rand() * 20, flash: 0, slotT: 0, face: side === 'A' ? 1 : -1, tgt: null, flee: false, gone: false }, extra || {})); }
function makeSkirmish(o) {
  const S = { t: 0, F: [], pops: [], arrows: [], blood: [], result: null, cx: o.cx, cy: o.cy, sides: {}, nid: 1, paused: true, beat: 0, beatEnd: 0, dirA: o.dirA || [-1, 0] };
  for (const [k, sd] of [['A', o.A], ['D', o.D]]) S.sides[k] = { owner: sd.owner, order: 'hold', morale: 12 + (sd.hero ? sd.hero.lead * 2 : 0), guard: sd.guard || 0, edge: sd.edge || 0, garrison: !!sd.garrison, start: 0, human: !!sd.human, tmpEdge: 0, tmpGuard: 0, cards: (sd.cards || []).slice(), hero: sd.hero || null };
  const [ux, uy] = S.dirA; const px = -uy, py = ux;
  for (const [k, sd] of [['A', o.A], ['D', o.D]]) {
    const list = []; for (const u of ['sword', 'spear', 'militia', 'archer']) for (let i = 0; i < (sd.units[u] || 0); i++) list.push(u);
    const dir = k === 'A' ? 1 : -1, base = sd.at || [o.cx + ux * 60 * dir, o.cy + uy * 60 * dir];
    if (sd.hero) skAdd(S, k, 'sword', base[0] - ux * 6 * dir, base[1] - uy * 6 * dir, { hero: true, hp: 5, name: sd.hero.name, heroEdge: 1 + (sd.hero.sword > 1 ? 1 : 0) });
    list.forEach((u, i) => { const back = u === 'archer' ? 34 : 0, lat = ((i % 7) - 3) * 13, row = Math.floor(i / 7) * 12; skAdd(S, k, u, base[0] + ux * (back + row) * dir + px * lat + skRand(-4, 4), base[1] + uy * (back + row) * dir + py * lat * .7 + skRand(-4, 4)); });
    S.sides[k].start = S.F.filter(f => f.side === k).length;
  }
  return S;
}
const skFoes = (S, f) => S.F.filter(o => o.alive && !o.flee && o.side !== f.side);
function skPop(S, p) { if (S.quiet) return; S.pops.push(Object.assign({ t0: S.t }, p)); if (S.pops.length > 40) S.pops.shift(); }
function skWound(S, t, n, kx, ky) {
  const d = Math.hypot(kx, ky) || 1; t.vx += kx / d * 110; t.vy += ky / d * 110; t.flash = .22; t.hp -= n;
  if (!S.quiet) { S.blood.push({ x: t.x, y: t.y - 10, t0: S.t, kx: kx / d, ky: ky / d }); if (S.blood.length > 60) S.blood.shift(); }
  if (t.hp <= 0) { t.alive = false; t.act = null; t.dx = t.x; t.dy = t.y; const sd = S.sides[t.side]; sd.morale -= t.hero ? 3 : 1; sd.lostThisBeat = true; }
}
function skMorale(S) { return; for (const k of ['A', 'D']) { const sd = S.sides[k]; if (!sd.lostThisBeat || sd.garrison || sd.routed) continue; sd.lostThisBeat = false; if (!S.F.some(o => o.side === k && o.alive && !o.flee)) continue; const r = [1 + rndI(6), 1 + rndI(6)]; sd.lastCheck = { r, m: sd.morale };
  if (r[0] + r[1] > sd.morale) { S.F.filter(o => o.side === k && o.alive).forEach(o => o.flee = true); sd.routed = true; const f = S.F.find(o => o.side === k && o.alive); if (f) skPop(S, { x: f.x, y: f.y - 50, res: 'rout', side: k }); } } }
const rndI = n => (rand() * n) | 0;
// each order beats one other: a counter is a real edge for that beat, never a win by itself
const BEATS = { hold: 'press', press: 'loose', loose: 'hold' }, CTR = { hold: 'brace', press: 'rush', loose: 'pierce' };
const CTR_SAY = { brace: 'Braced! The charge breaks on the spears.', rush: 'Rushed the bows before they could shoot!', pierce: 'Arrows pour into the packed ranks!' };
const oppOf = (S, side) => S.sides[side === 'A' ? 'D' : 'A'];
function edgeOf(S, f) { const sd = S.sides[f.side], op = oppOf(S, f.side); return SK.base[f.k][0] + (f.heroEdge || 0) + sd.tmpEdge + (sd.edge || 0) + (sd.order === 'press' && op.ctr !== 'brace' ? 1 : 0) + (sd.ctr === 'brace' || sd.ctr === 'rush' ? 1 : 0); }
function guardOf(S, f) { const sd = S.sides[f.side]; return SK.base[f.k][1] + sd.guard + sd.tmpGuard + (sd.order === 'hold' ? 1 : 0) + (f.hero ? 1 : 0); }
function skBlow(S, f, t) {
  if (!t || !t.alive) return; const ra = 1 + rndI(6), rd = 1 + rndI(6), ta = ra + edgeOf(S, f), td = rd + guardOf(S, t), mx = (f.x + t.x) / 2, my = Math.min(f.y, t.y) - 34;
  if (ta > td) { const dmg = ta - td >= 4 ? 2 : 1; skPop(S, { x: mx, y: my, a: ra, b: rd, res: dmg > 1 ? 'down' : 'hit', side: f.side }); skWound(S, t, dmg, t.x - f.x, t.y - f.y); }
  else if (ta === td) { skPop(S, { x: mx, y: my, a: ra, b: rd, res: 'parry', side: f.side }); t.act = 'parry'; t.at = 0; const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy) || 1; f.vx -= dx / d * 40; f.vy -= dy / d * 40; t.vx += dx / d * 30; t.vy += dy / d * 30; if (!S.quiet) S.blood.push({ x: mx, y: my + 22, t0: S.t, spark: true }); }
  else { skPop(S, { x: mx, y: my, a: ra, b: rd, res: 'miss', side: f.side }); t.strafe *= -1; const dx = t.x - f.x, dy = t.y - f.y, d = Math.hypot(dx, dy) || 1; t.vx += -dy / d * 50 * t.strafe; t.vy += dx / d * 50 * t.strafe; }
}
function skShoot(S, f, t) { f.act = 'shoot'; f.at = 0; S.arrows.push({ f, t, t0: S.t, x0: f.x, y0: f.y - 14, dur: Math.hypot(t.x - f.x, t.y - f.y) / 160 }); }
/* choose this beat's action for a computer-run side */
function skAIChoice(S, k) {
  const sd = S.sides[k], mine = S.F.filter(f => f.side === k && f.alive && !f.flee), theirs = S.F.filter(f => f.side !== k && f.alive && !f.flee), arch = mine.filter(f => f.k === 'archer').length;
  if (sd.cards.includes('rally') && S.F.filter(f => f.side === k && !f.alive && !f.hero).length >= 2) return 'card:rally';
  if (sd.cards.length && rand() < .25) return 'card:' + sd.cards[rndI(sd.cards.length)];
  const r = rand(), bows = arch >= 2 && arch >= mine.length / 4;
  if (mine.length >= theirs.length * 1.2) return r < .55 ? 'press' : r < .8 || !bows ? 'hold' : 'loose';
  return bows ? (r < .4 ? 'loose' : r < .75 ? 'hold' : 'press') : (r < .55 ? 'hold' : 'press');
}
/* both sides have chosen: apply and let the beat run */
function skBeat(S, aChoice, dChoice) {
  S.beat++;
  for (const [k, ch] of [['A', aChoice], ['D', dChoice]]) { const sd = S.sides[k]; if (sd.tmpEdgeB > 0) sd.tmpEdgeB--; else sd.tmpEdge = 0; if (sd.tmpGuardB > 0) sd.tmpGuardB--; else sd.tmpGuard = 0;
    sd.played = null;
    if (ch.startsWith('card:')) { const c = ch.slice(5); sd.cards.splice(sd.cards.indexOf(c), 1); sd.played = c; sd.order = 'press';
      if (c === 'rally') { let n = 0; for (const f of S.F) if (n < 2 && f.side === k && !f.alive && !f.hero && !f.gone) { f.alive = true; f.hp = Math.max(1, Math.ceil(SK.hp[f.k] / 2)); f.x = f.dx; f.y = f.dy; f.act = null; n++; } } if (c === 'charge') { sd.tmpEdge = 1; sd.tmpEdgeB = 2; } if (c === 'wall') { sd.tmpGuard = 1; sd.tmpGuardB = 2; sd.order = 'hold'; }
      if (c === 'volley') { for (const f of S.F) if (f.side === k && f.alive && !f.flee && f.k === 'archer') { const fs = skFoes(S, f); if (fs.length) skShoot(S, f, fs[rndI(Math.min(4, fs.length))]); } sd.order = 'loose'; }
      if (c === 'reinforce') { const back = S.F.filter(f => f.side === k && f.alive)[0]; for (let i = 0; i < 2; i++) skAdd(S, k, 'spear', (back ? back.x : S.cx) - S.dirA[0] * 30 * (k === 'A' ? 1 : -1) + i * 10, (back ? back.y : S.cy) + i * 12); sd.start += 2; }
      if (c === 'outlaw') { const back = S.F.filter(f => f.side === k && f.alive)[0]; for (let i = 0; i < 4; i++) skAdd(S, k, 'archer', (back ? back.x : S.cx) + (i - 1.5) * 16, (back ? back.y : S.cy) + 30 + (i % 2) * 10, { owner: 'raider', outlaw: true }); sd.start += 4; sd.order = 'loose'; }
    } else sd.order = ch;
    if (sd.order === 'fall' && !sd.routed) { sd.routed = true; sd.fell = true; S.F.filter(f => f.side === k && f.alive).forEach(f => f.flee = true);
      const other = k === 'A' ? 'D' : 'A'; for (const f of S.F) if (f.side === other && f.alive && f.k === 'archer') { const fs = S.F.filter(o => o.side === k && o.alive); if (fs.length) skShoot(S, f, fs[rndI(fs.length)]); } } }
  for (const k of ['A', 'D']) { const sd = S.sides[k], op = oppOf(S, k); sd.ctr = !sd.played && !op.played && BEATS[sd.order] === op.order ? CTR[sd.order] : null;
    if (sd.ctr) { const f = S.F.find(o => o.side === k && o.alive && !o.flee); if (f) skPop(S, { x: f.x, y: f.y - 54, res: 'say', txt: CTR_SAY[sd.ctr], side: k }); } }
  S.paused = false; S.beatEnd = S.t + SK.BEAT;
}
function skStep(S, dt) {
  S.t += dt; const live = !S.paused, strikeOK = live && S.t < S.beatEnd;
  for (const f of S.F) {
    if (!f.alive || f.gone) continue; f.flash = Math.max(0, f.flash - dt); const sd = S.sides[f.side];
    if (f.flee) { f.act = null; const ax = -S.dirA[0] * (f.side === 'A' ? 1 : -1), ay = -S.dirA[1] * (f.side === 'A' ? 1 : -1); f.vx += (ax * 70 - f.vx) * dt * 3; f.vy += (ay * 70 - f.vy) * dt * 3; f.x += f.vx * dt; f.y += f.vy * dt; f.walkPh += Math.hypot(f.vx, f.vy) * dt; f.face = f.vx >= 0 ? 1 : -1; if (Math.hypot(f.x - S.cx, f.y - S.cy) > 230) f.gone = true; continue; }
    const fs = skFoes(S, f); if (!fs.length) { f.vx *= .9; f.vy *= .9; f.act = null; continue; }
    if (!f.tgt || !f.tgt.alive || f.tgt.flee || rand() < .004) { let b = null, bd = 1e9; for (const o of fs) { const d = Math.hypot(o.x - f.x, o.y - f.y); if (d < bd) { bd = d; b = o; } } f.tgt = b; }
    const t = f.tgt, dxr = t.x - f.x, dyr = t.y - f.y, d = Math.max(.01, Math.hypot(dxr, dyr)), dx = dxr / d, dy = dyr / d; f.face = dx >= 0 ? 1 : -1;
    if (f.k === 'archer') {
      const want = 62; f.vx += (-dx * (want - d) * 4 - dy * f.strafe * 20 + (S.cx - f.x) * .6) * dt; f.vy += (-dy * (want - d) * 4 + dx * f.strafe * 20 + (S.cy - f.y) * 1.2) * dt; f.vx *= Math.exp(-4 * dt); f.vy *= Math.exp(-4 * dt);
      f.cd -= dt * (sd.order === 'loose' && oppOf(S, f.side).ctr !== 'rush' ? 2 : 1); if (strikeOK && f.cd <= 0 && d < 160) { f.cd = skRand(2, 2.8); skShoot(S, f, t); }
    } else {
      f.st -= dt; if (f.st <= 0) { f.strafe = rand() < .5 ? 1 : -1; f.st = skRand(.5, 1.8); }
      // waiting for orders: they circle at a wary distance; once the beat starts they close in and fall back by turns
      const inT = sd.order === 'press' ? [1.6, 3] : sd.order === 'hold' ? [.8, 1.6] : [1.2, 2.6], outT = sd.order === 'hold' ? [1.2, 2.2] : [.7, 1.5];
      f.mt -= dt; if (!live) f.mode = 'out'; else if (f.mode === 'out') { if (f.mt <= 0) { f.mode = 'in'; f.mt = skRand(...inT); } } else if (f.mt <= 0) { f.mode = 'out'; f.mt = skRand(...outT); f.strafe = rand() < .5 ? 1 : -1; }
      if ((f.slotT -= dt) <= 0) { f.slotT = .5; const mates = S.F.filter(o => o.alive && !o.flee && o.tgt === t); const n = mates.length, i = mates.indexOf(f); f.slot = n > 1 ? (i / n) * Math.PI * 2 + (f.side === 'A' ? Math.PI : 0) : null; }
      const reach = SK.reach[f.k], stand = f.mode === 'out' ? reach + (live ? 18 : 30) : reach * .78;
      let ux = -dx, uy = -dy; if (f.slot != null) { const cur = Math.atan2(uy, ux); let dl = ((f.slot - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI; dl = Math.max(-.9, Math.min(.9, dl)); ux = Math.cos(cur + dl); uy = Math.sin(cur + dl); }
      const gx = t.x + ux * stand, gy = t.y + uy * stand * .8, sw = live ? 1 : .6; let ax = (gx - f.x) * 16 - dy * f.strafe * (f.mode === 'out' ? 20 : 36) * sw, ay = (gy - f.y) * 16 + dx * f.strafe * (f.mode === 'out' ? 20 : 36) * sw;
      if (f.act === 'strike') { ax += dx * 180; ay += dy * 180; }
      for (const o of S.F) { if (o === f || o === t || !o.alive || o.gone) continue; const ox = f.x - o.x, oy = f.y - o.y; if (Math.abs(ox) > 19 || Math.abs(oy) > 19) continue; const od = Math.hypot(ox, oy) || .01; if (od > 19) continue; const kk = (19 - od) * (o.side === f.side ? 30 : 18); ax += ox / od * kk; ay += oy / od * kk; }
      ax += (S.cx - f.x) * .4; ay += (S.cy - f.y) * .8;
      const al = Math.hypot(ax, ay); if (al > 280) { ax *= 280 / al; ay *= 280 / al; }
      f.vx += ax * dt; f.vy += ay * dt; const fr = Math.exp(-5 * dt); f.vx *= fr; f.vy *= fr; const sp = Math.hypot(f.vx, f.vy), mx = live ? 40 : 22; if (sp > mx) { f.vx *= mx / sp; f.vy *= mx / sp; }
      if (d < 7) { f.x -= dx * (7 - d) * .5; f.y -= dy * (7 - d) * .5; }
      f.cd -= dt * (sd.order === 'press' ? 1.25 : sd.order === 'hold' ? .8 : 1);
      if (strikeOK && !f.act && f.mode === 'in' && f.cd <= 0 && d < reach + 4) { f.act = 'windup'; f.at = 0; f.cd = skRand(1.4, 2.2); }
    }
    if (f.act) { f.at += dt; if (f.act === 'windup' && f.at > .17) { f.act = 'strike'; f.at = 0; skBlow(S, f, f.tgt); } else if (f.act === 'strike' && f.at > .16) f.act = null; else if ((f.act === 'parry' || f.act === 'shoot') && f.at > .3) f.act = null; }
    f.x += f.vx * dt; f.y += f.vy * dt; f.walkPh += Math.hypot(f.vx, f.vy) * dt;
  }
  for (const a of S.arrows) if (!a.done && S.t - a.t0 >= a.dur) { a.done = true; if (!a.t.alive) continue; const r = 1 + rndI(6), need = S.sides[a.f.side].ctr === 'pierce' ? 4 : S.sides[a.t.side].order === 'hold' ? 6 : 5, hit = r >= need; skPop(S, { x: a.t.x, y: a.t.y - 32, a: r, res: hit ? 'hit' : 'miss', side: a.f.side }); if (hit) skWound(S, a.t, 1, a.t.x - a.f.x, a.t.y - a.f.y); }
  if (S.arrows.length > 40) S.arrows = S.arrows.filter(a => !a.done || S.t - a.t0 < 2);
  // the beat ends once the time is up and nobody is mid-swing or mid-flight
  if (live && S.t >= S.beatEnd && !S.F.some(f => f.alive && !f.flee && !f.gone && (f.act === 'windup' || f.act === 'strike')) && !S.arrows.some(a => !a.done)) {
    S.paused = true; skMorale(S);
    const upA = S.F.some(f => f.side === 'A' && f.alive && !f.flee), upD = S.F.some(f => f.side === 'D' && f.alive && !f.flee);
    if (!upA) S.result = S.sides.A.fell ? 'A_fell' : 'D'; else if (!upD) S.result = S.sides.D.fell ? 'D_fell' : 'A'; else if (S.beat >= SK.MAXBEATS) S.result = 'D_hold';
    if (S.result) S.endT = S.t;
  }
}
function skSurvivors(S, side) { const u = { spear: 0, sword: 0, archer: 0, militia: 0, heroDown: false }; for (const f of S.F) if (f.side === side) { if (f.hero) { if (!f.alive) u.heroDown = true; continue; } if (f.outlaw) continue; if (f.alive) u[f.k]++; } return u; }
function skRun(o) { const S = makeSkirmish(Object.assign({ cx: 0, cy: 0 }, o)); S.quiet = true; let guard = 0; while (!S.result && guard++ < 4000) { if (S.paused) skBeat(S, skAIChoice(S, 'A'), skAIChoice(S, 'D')); skStep(S, 1 / 15); } if (!S.result) S.result = 'D_hold'; return S; }
function skOdds(o, n) { const rs = G.rs; let w = 0; try { for (let i = 0; i < n; i++) { const r = skRun(o).result; if (r === 'A' || r === 'D_fell') w++; } } finally { G.rs = rs; } return w / n; }
