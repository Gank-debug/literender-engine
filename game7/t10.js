const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1300, height: 820 } }); const errs = [];
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000); await p.click('#shplay'); await p.click('#lgo'); await p.waitForTimeout(2500);
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(200); const r = await p.evaluate(() => { if (G.lords && G.setup && G.setup.step === 'charter' && charterWho()) { send({ type: 'charter', k: 'none', by: charterWho().id }); return 'c'; } if (!myTurn()) return 'w'; const L = curL(); if (G.phase === 'setup' && G.setup.step === 'charter') { send({ type: 'charter', k: 'none' }); return 'setup'; } else if (G.phase === 'setup') { if (G.setup.step === 'village') send({ type: 'setupV', v: G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0].id }); else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return 's'; }
    if (G.round >= 4) return 'stop'; if (G.phase === 'roll') { send({ type: 'roll' }); return 'r'; } if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); return 'b'; } const e = G.edges.filter(e => canRoad(L.id, e))[0]; if (e && canPay(L, COST.road)) send({ type: 'build', k: 'road', id: e.id }); send({ type: 'end' }); return 'e'; }); if (r === 'stop') break; }
  await p.waitForTimeout(800);
  const before = await p.evaluate(() => [stateHash(), G.round, G.phase, savesGet().length, JSON.stringify(savesGet()).length]); console.log('before', before);
  await p.reload(); await p.waitForTimeout(3000); await p.screenshot({ path: 'sv_menu.png' });
  await p.click('#shplay'); await p.click('[data-resume="0"]'); await p.waitForTimeout(2500);
  console.log('after', await p.evaluate(() => [stateHash(), G.round, G.phase, myTurn()]));
  await p.evaluate(() => send({ type: 'roll' })); await p.waitForTimeout(500); await p.evaluate(() => { if (G.phase === 'robber') send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); }); await p.waitForTimeout(300); await p.evaluate(() => send({ type: 'end' })); 
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(300); if (await p.evaluate(() => myTurn())) break; }
  console.log('played on', await p.evaluate(() => [G.round, G.phase]));
  await p.screenshot({ path: 'sv_after.png' });
  console.log('ERR', errs.slice(0, 6)); await b.close(); })();
