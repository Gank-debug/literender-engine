const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 820 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack||'').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000);
  await p.click('[data-ls="blue:player"]'); await p.click('#lgo'); await p.waitForTimeout(2500);
  let curtains = 0;
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(250); const r = await p.$('#ready:visible'); if (r) { curtains++; if (curtains === 2) await p.screenshot({ path: 'h1.png' }); await r.click(); continue; }
    const s = await p.evaluate(() => { if (!myTurn()) return 'w'; const L = curL(); if (G.phase === 'setup') { if (G.setup.step === 'village') send({ type: 'setupV', v: G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0].id }); else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return 's'; }
      if (G.phase === 'roll') { send({ type: 'roll' }); return 'r'; } if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); return 'b'; } send({ type: 'end' }); return 'e'; });
    if (await p.evaluate(() => G.round >= 3)) break; }
  console.log('curtains', curtains, await p.evaluate(() => [G.round, meId(), G.lords.map(l => l.human)]));
  console.log('ERR', errs); await b.close(); })();
