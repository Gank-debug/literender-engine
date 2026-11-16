const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3500);
  await p.click('[data-ls="green:ai"]'); await p.click('[data-ls="white:you"]'); await p.waitForTimeout(200); await p.screenshot({ path: 's6_lobby.png' });
  await p.click('#lgo'); await p.waitForTimeout(3000);
  for (let i = 0; i < 400; i++) { await p.waitForTimeout(200); const r = await p.$('#ready:visible'); if (r) { await r.click(); continue; }
    await p.evaluate(() => { if (G.lords && G.setup && G.setup.step === 'charter' && charterWho()) { send({ type: 'charter', k: 'none', by: charterWho().id }); return 'c'; } if (!myTurn()) return; const L = curL(); if (G.phase === 'setup' && G.setup.step === 'charter') { send({ type: 'charter', k: 'none' }); return 'setup'; } else if (G.phase === 'setup') { if (G.setup.step === 'village') send({ type: 'setupV', v: G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0].id }); else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return; }
      if (G.phase === 'roll') { send({ type: 'roll' }); return; } if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); return; }
      if (G.round >= 3 && L.id === 'red') return 'stop'; const e = G.edges.filter(e => canRoad(L.id, e))[0]; if (e && canPay(L, COST.road)) send({ type: 'build', k: 'road', id: e.id }); send({ type: 'end' }); });
    if (await p.evaluate(() => G.round >= 3 && myTurn() && curL().id === 'red' && G.phase === 'main')) break; }
  console.log(await p.evaluate(() => [G.size, G.tiles.length, W0, H0, G.lords.map(l => l.id + (l.human ? '*' : '') + ':' + settlements(l.id).length + '/' + roadsOf(l.id).length).join(' '), G.round]));
  await p.evaluate(() => { UI.cam.z = 1; centerOn(G.world.CX, G.world.CY); UI.camGoal = null; }); await p.waitForTimeout(400); await p.screenshot({ path: 's6_game.png' });
  await p.evaluate(() => { const v = settlements('green')[0]; UI.cam.z = 2; centerOn(v.vx, v.vy); UI.camGoal = null; }); await p.waitForTimeout(400); await p.screenshot({ path: 's6_green.png' });
  await p.evaluate(() => { const v = settlements('white')[0]; centerOn(v.vx, v.vy); UI.camGoal = null; }); await p.waitForTimeout(400); await p.screenshot({ path: 's6_white.png' });
  console.log('ERR', errs.slice(0, 6)); await b.close(); })();
