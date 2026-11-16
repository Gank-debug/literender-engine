const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1200, height: 820 } }); await c.addInitScript(() => { window.CROWN_RELAYS = ['ws://localhost:7777']; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ' ' + m.text()); }); await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000); return p; };
  const H = await mk('H'), A = await mk('A'), B = await mk('B');
  await H.click('#lhost'); await H.click('[data-hs="gold:invite"]'); await H.waitForTimeout(500);
  const code = await H.evaluate(() => ROOM.code); console.log('room', code);
  await H.screenshot({ path: 'rm_host0.png' });
  for (const [p, nm] of [[A, 'Ana'], [B, 'Ben']]) { await p.click('#ljoin'); await p.fill('#lname', nm); await p.fill('#lroom', code.slice(6).toLowerCase()); await p.click('#lroomgo'); }
  const t0 = Date.now(); for (let i = 0; i < 60; i++) { await H.waitForTimeout(500); const s = await H.evaluate(() => ['blue', 'gold'].map(id => NET.links[id] && NET.links[id].state + ':' + NET.links[id].name)); if (s.every(x => x && x.startsWith('open'))) { console.log('seated in', (Date.now() - t0) / 1000, 's', s); break; } }
  await H.screenshot({ path: 'rm_host1.png' }); await A.screenshot({ path: 'rm_guest.png' });
  console.log(await A.evaluate(() => NET.seat), await B.evaluate(() => NET.seat));
  await H.click('#lstart'); await H.waitForTimeout(4000);
  const step = async p => p.evaluate(() => { if (G.lords && G.setup && G.setup.step === 'charter' && charterWho()) { send({ type: 'charter', k: 'none', by: charterWho().id }); return 'c'; } if (!myTurn()) return 'w'; const L = me(); if (G.phase === 'setup' && G.setup.step === 'charter') { send({ type: 'charter', k: 'none' }); return 'setup'; } else if (G.phase === 'setup') { if (G.setup.step === 'village') send({ type: 'setupV', v: G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0].id }); else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return 's'; }
    if (G.phase === 'roll') { send({ type: 'roll' }); return 'r'; } if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); return 'b'; } send({ type: 'end' }); return 'e'; });
  for (let i = 0; i < 300; i++) { await H.waitForTimeout(250); for (const p of [H, A, B]) await step(p); if (await H.evaluate(() => G.round >= 4)) break; }
  await H.waitForTimeout(3000);
  console.log(await Promise.all([H, A, B].map(p => p.evaluate(() => [meId(), CQ.done, stateHash(), G.round]))));
  console.log('ERR', errs.slice(0, 8)); await b.close(); })();
