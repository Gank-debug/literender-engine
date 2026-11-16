const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack||'').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000); await p.click('#lgo'); await p.waitForTimeout(2500);
  const waitIdle = async () => { for (let i = 0; i < 80; i++) { await p.waitForTimeout(300); if (await p.evaluate(() => myTurn())) return; } };
  for (let k = 0; k < 4; k++) { await waitIdle(); await p.evaluate(() => { const L = me(); if (G.setup.step === 'village') send({ type: 'setupV', v: G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0].id }); else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); }); }
  await waitIdle(); await p.click('[data-act="roll"]'); await waitIdle(); if (await p.evaluate(() => G.phase === 'robber')) { await p.evaluate(() => send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i })); await waitIdle(); }
  await p.evaluate(() => { Object.assign(me().res, { timber: 0, clay: 5, wool: 0, grain: 0, ore: 0 }); hud(); });
  await p.click('[data-act="trade"]'); await p.click('[data-bg="clay"]'); await p.screenshot({ path: 'bank.png' }); await p.click('[data-bw="ore"]'); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => JSON.stringify(me().res)), errs); await b.close(); })();
