const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n, ctx) => { const c = ctx || await b.newContext({ viewport: { width: 1200, height: 820 } }); if (!ctx) await c.addInitScript(() => { window.CROWN_RELAYS = ['ws://localhost:7777']; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ' ' + e.message + (e.stack || '').split('\n')[1])); await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000); return p; };
  const join = async (p, nm, code) => { await p.click('#ljoin'); await p.fill('#lname', nm); await p.fill('#lroom', code); await p.click('#lroomgo'); };
  const step = async p => { try { return await p.evaluate(() => { if (!G.lords) return 'w'; if (G.lords && G.setup && G.setup.step === 'charter' && charterWho()) { send({ type: 'charter', k: 'none', by: charterWho().id }); return 'c'; } if (!myTurn()) return 'w'; const L = me(); if (G.phase === 'setup' && G.setup.step === 'charter') { send({ type: 'charter', k: 'none' }); return 'setup'; } else if (G.phase === 'setup') { if (G.setup.step === 'village') send({ type: 'setupV', v: G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0].id }); else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return 's'; }
    if (G.phase === 'roll') { send({ type: 'roll' }); return 'r'; } if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); return 'b'; } send({ type: 'end' }); return 'e'; }); } catch (e) { return 'x'; } };
  const play = async (ps, until) => { for (let i = 0; i < 400; i++) { await ps[0].waitForTimeout(200); for (const p of ps) await step(p); if (await ps[0].evaluate(until)) return; } };
  const hc = await b.newContext({ viewport: { width: 1200, height: 820 } }); await hc.addInitScript(() => { window.CROWN_RELAYS = ['ws://localhost:7777']; });
  let H = await mk('H', hc), A = await mk('A'), B = await mk('B');
  await H.click('#lhost'); await H.click('[data-hs="gold:invite"]'); const code = await H.evaluate(() => ROOM.code);
  await join(A, 'Ana', code); await join(B, 'Ben', code); await H.waitForTimeout(1500); await H.click('#lstart'); await H.waitForTimeout(3500);
  await play([H, A, B], () => G.round >= 3);
  console.log('r3', await Promise.all([H, A, B].map(p => p.evaluate(() => [CQ.done, stateHash()]))));
  // Ana drops
  const actx = A.context(); await actx.close(); await H.waitForTimeout(2500);
  console.log('host sees', await H.evaluate(() => G.lords.map(l => l.id + ':' + (l.human ? 'H' : 'C') + (l.away ? '(away ' + l.away + ')' : '')).join(' ')));
  await play([H, B], () => G.round >= 4); await H.screenshot({ path: 'rj_host_away.png' });
  // Ana comes back
  A = await mk('A2'); await join(A, 'ana', code); for (let i = 0; i < 40; i++) { await A.waitForTimeout(300); if (await A.evaluate(() => !!(G.lords && NET.seat))) break; }
  await A.waitForTimeout(3000);
  console.log('rejoined', await Promise.all([H, A, B].map(p => p.evaluate(() => [NET.seat, CQ.done, stateHash(), G.lords.map(l => (l.human ? 'H' : 'C')).join('')]))));
  await play([H, A, B], () => G.round >= 6); await H.waitForTimeout(2000);
  console.log('r6', await Promise.all([H, A, B].map(p => p.evaluate(() => [CQ.done, stateHash(), G.round]))));
  // host leaves; everyone comes back to the saved game
  await H.close(); await A.context().close(); await B.context().close();
  H = await mk('H2', hc); await H.screenshot({ path: 'rj_menu.png' }); await H.click('[data-resume="0"]'); await H.waitForTimeout(1000); const code2 = await H.evaluate(() => ROOM.code); console.log('same room', code2 === code);
  A = await mk('A3'); B = await mk('B3'); await join(A, 'Ana', code2); await join(B, 'Ben', code2); await H.waitForTimeout(2000); await H.screenshot({ path: 'rj_resume_lobby.png' }); await H.click('#lstart'); await H.waitForTimeout(4000);
  console.log('resumed', await Promise.all([H, A, B].map(p => p.evaluate(() => [NET.seat, CQ.done, stateHash(), G.round]))));
  await play([H, A, B], () => G.round >= 8); await H.waitForTimeout(2000);
  console.log('r8', await Promise.all([H, A, B].map(p => p.evaluate(() => [CQ.done, stateHash(), G.round]))));
  console.log('ERR', errs.slice(0, 8)); await b.close(); })();
