const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => startGame(515, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(() => { send({ type: 'charter', k: 'geomancer' }); }); await p.waitForTimeout(3000);
  for (let i = 0; i < 40; i++) { const st = await p.evaluate(() => G.phase === 'setup' ? G.setup.step : G.phase); if (st === 'roll') break; await p.evaluate(() => { if (!myTurn()) return; if (G.setup.step === 'village') send({ type: 'setupV', v: aiSetupVillage(me()).id }); else if (G.setup.step === 'road') send({ type: 'setupR', e: aiSetupRoad(me()).id }); }); await p.waitForTimeout(1500); }
  await p.evaluate(() => send({ type: 'roll' })); await p.waitForTimeout(800);
  console.log(await p.evaluate(() => { if (G.phase === 'robber') send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); return G.phase; })); await p.waitForTimeout(600);
  // give red a village spot: a coastal corner, with a road
  console.log(await p.evaluate(() => { const L = me(); Object.assign(L.res, { timber: 9, clay: 9, wool: 9, grain: 9, ore: 9 }); const v = G.verts.find(v => canSettle(v) && v.tiles.length === 2); const e = G.edges.find(e => e.a === v.id || e.b === v.id); e.owner = 'red'; landChanged(); send({ type: 'build', k: 'village', id: v.id }); window._v = v; return [v.id, G.tiles.length]; }));
  await p.waitForTimeout(1200); const g = await p.evaluate(() => { const g = G.geo; if (g) { const [x, y] = hexXY(g.at[0], g.at[1]); UI.cam.z = 1; centerOn(x, y); UI.camGoal = null; } return JSON.stringify(g); }); console.log('geo', g);
  await p.waitForTimeout(600); await p.screenshot({ path: 'o_geo1.png' });
  await p.click('[data-gi="1"]'); await p.click('.gset'); await p.waitForTimeout(400); await p.screenshot({ path: 'o_geo2.png' });
  await p.click('#geogo'); await p.waitForTimeout(2500); await p.screenshot({ path: 'o_geo3.png' });
  console.log(await p.evaluate(() => [G.tiles.length, G.verts.length, G.tiles.filter(t => t.type === 'desert').length, G.geo, G.tiles[G.tiles.length - 1].type, G.tiles[G.tiles.length - 1].num, G.verts.filter(v => v.tiles.length === 3).length]));
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
