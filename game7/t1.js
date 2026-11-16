const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack||'').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000);
  await p.screenshot({ path: 'l1.png' });
  await p.click('#shplay'); await p.click('#lgo'); await p.waitForTimeout(2500);
  const waitIdle = async () => { for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); if (await p.evaluate(() => myTurn())) return true; } return false; };
  const setup = async () => { await waitIdle(); await p.evaluate(() => { if (G.setup && G.setup.step === 'charter') send({ type: 'charter', k: 'none' }); }); await waitIdle(); await p.evaluate(() => { const L = me(); const v = G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0]; send({ type: 'setupV', v: v.id }); }); await waitIdle(); await p.evaluate(() => send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id })); };
  await setup(); await setup(); await waitIdle();
  console.log(await p.evaluate(() => [G.phase, G.lords.map(L => settlements(L.id).length + '/' + roadsOf(L.id).length)]));
  await p.click('#tbroll'); await waitIdle();
  if (await p.evaluate(() => G.phase === 'robber')) { await p.evaluate(() => send({ type: 'robber', tile: aiRobber(me()), victim: null })); await waitIdle(); }
  await p.evaluate(() => { Object.assign(me().res, { timber: 3, clay: 3, wool: 2, grain: 3, ore: 3 }); const e = G.edges.filter(e => canRoad('red', e))[0]; send({ type: 'build', k: 'road', id: e.id }); send({ type: 'recruit', u: 'spear' }); });
  await waitIdle(); console.log('mapsize', await p.evaluate(() => { const M = marchMap(me()); return [M.cost.size, [...M.cost.values()].join(',')]; }));
  const t0 = Date.now(); await p.evaluate(() => { const M = marchMap(me()); const vi = [...M.cost.keys()].filter(v => v !== me().army.v && !M.targets.includes(v)).sort((a, b) => M.cost.get(b) - M.cost.get(a))[0]; send({ type: 'march', v: vi }); }); await waitIdle(); console.log('march s', (Date.now() - t0) / 1000);
  await p.screenshot({ path: 'l2.png' });
  for (let r = 0; r < 3; r++) { await p.evaluate(() => act('end')); for (let i = 0; i < 200; i++) { await p.waitForTimeout(500); const s = await p.evaluate(() => ({ mt: myTurn(), sc: UI.scene && UI.scene.kind })); if (s.sc === 'battle') { const btn = await p.$('#btac [data-o="hold"]'); if (btn) await btn.click(); } if (s.mt) break; } await p.click('#tbroll'); await waitIdle(); if (await p.evaluate(() => G.phase === 'robber')) { await p.evaluate(() => send({ type: 'robber', tile: aiRobber(me()), victim: null })); await waitIdle(); } }
  console.log(await p.evaluate(() => [G.round, G.phase, G.lords.map(L => vp(L.id))]));
  await p.screenshot({ path: 'l3.png' }); await p.click('[data-act="trade"]').catch(()=>{}); await p.waitForTimeout(300); await p.screenshot({ path: 'l5.png' }); await p.evaluate(() => { $('trade').style.display='none'; UI.sel = { lord: me() }; hud(); }); await p.waitForTimeout(300); await p.screenshot({ path: 'l6.png' }); await p.evaluate(() => { UI.cam.z = 2; const v = settlements('red')[0]; centerOn(v.vx, v.vy); UI.camGoal = null; }); await p.waitForTimeout(300); await p.screenshot({ path: 'l4.png' }); await p.evaluate(() => { const t = G.tiles.find(t => t.type === 'pasture'); centerOn(t.cx, t.cy); }); await p.waitForTimeout(400); await p.screenshot({ path: 'l7.png' });
  console.log('ERR', errs.slice(0, 8)); await b.close();
})();
