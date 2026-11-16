const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
  const H = await ctx.newPage(), J = await ctx.newPage(); const errs = [];
  for (const [n, p] of [['H', H], ['J', J]]) p.on('pageerror', e => errs.push(n + ' ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  const url = 'file://' + __dirname + '/crown7.html'; await H.goto(url); await J.goto(url); await H.waitForTimeout(3000);
  await H.evaluate(() => { LOBBY.seats.green = 'none'; LOBBY.seats.white = 'none'; LOBBY.seats.gold = 'ai'; LOBBY.seats.violet = 'ai'; netLocalHost(['blue']); }); await J.evaluate(() => netLocalJoin('blue')); await H.waitForTimeout(500);
  await H.click('#lstart'); await H.waitForTimeout(500); await H.click('#lstart').catch(() => {}); await H.waitForTimeout(3500);
  const step = async (p, who) => p.evaluate(who => { if (G.lords && G.setup && G.setup.step === 'charter' && charterWho()) { send({ type: 'charter', k: 'none', by: charterWho().id }); return 'c'; } if (!myTurn()) return 'wait'; if (who === 'J' && G.phase === 'main') return 'stall';
    if (G.phase === 'setup' && G.setup.step === 'charter') { send({ type: 'charter', k: 'none' }); return 'c'; } if (G.phase === 'setup') { const L = me(); if (G.setup.step === 'village') { const v = G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0]; send({ type: 'setupV', v: v.id }); } else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return 's'; }
    if (G.phase === 'roll') { send({ type: 'roll' }); return 'r'; } if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i, victim: null }); return 'rob'; } send({ type: 'end' }); return 'e'; }, who);
  // play until Blue (the guest) stalls in its main phase
  for (let i = 0; i < 200; i++) { const a = await step(H, 'H'), c = await step(J, 'J'); if (c === 'stall') break; await H.waitForTimeout(250); }
  console.log('stalled', await H.evaluate(() => [curL().id, G.phase, G.round]));
  await H.evaluate(() => { UI.turnT0 = Date.now() - 125000; }); await H.waitForTimeout(600); await H.screenshot({ path: 'h1.png' });
  await H.click('#hurryb'); await H.waitForTimeout(1500); await H.screenshot({ path: 'h2.png' }); await J.screenshot({ path: 'h3.png' });
  console.log('hurry', await H.evaluate(() => JSON.stringify(G.hurry)), await J.evaluate(() => JSON.stringify(G.hurry)));
  await H.evaluate(() => { UI.hurryT0 = Date.now() - 29000; }); await H.waitForTimeout(4000);
  console.log('after', await H.evaluate(() => [curL().id, G.round, G.phase, stateHash()]), await J.evaluate(() => [curL().id, G.round, G.phase, stateHash()]));
  // autoplay for the guest, then take it back
  await J.click('#autob'); await H.waitForTimeout(800); console.log('auto', await H.evaluate(() => [lord('blue').auto, lord('blue').human]));
  for (let i = 0; i < 40; i++) { await step(H, 'H'); await H.waitForTimeout(300); if (await H.evaluate(() => G.round) >= 0 && i > 25) break; }
  await J.screenshot({ path: 'h4.png' }); console.log('jbtn', await J.evaluate(() => [$('autob') && $('autob').outerHTML, curL().id, CQ.running, CQ.q.length])); await J.click('#autob'); await H.waitForTimeout(3000);
  console.log('back', await H.evaluate(() => [lord('blue').auto, lord('blue').human, G.round, stateHash()]), await J.evaluate(() => [G.round, stateHash()]));
  console.log('ERR', errs); await b.close(); })();
