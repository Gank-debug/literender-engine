const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500);
  for (const [seed, seats] of [[424242, ['red', 'blue', 'gold', 'violet']], [777, ['red', 'blue', 'gold', 'violet', 'green', 'white']], [31337, ['red', 'blue', 'gold']]]) { await p.evaluate(([s, se]) => startGame(s, ['red'], se), [seed, seats]); await p.waitForTimeout(1800);
    console.log(seed, await p.evaluate(() => JSON.stringify(G.ports.map(p => [p.name, G.verts[p.v].tiles.map(ti => G.tiles[ti].type[0] + (G.tiles[ti].num || ''))]))));
    if (seed === 424242) { await p.evaluate(() => { G.lords.forEach(L => L.chose = true); G.setup.step = 'village'; $('charters').style.display = 'none'; hud(); UI.cam.z = zFar(); UI.camGoal = null; clampCam(); }); await p.waitForTimeout(600); await p.screenshot({ path: 'o_ports_far.png' }); await p.evaluate(() => { const V = G.verts[G.ports[0].v]; UI.cam.z = 2; UI.camGoal = null; centerOn(V.vx, V.vy); }); await p.waitForTimeout(600); await p.screenshot({ path: 'o_port1.png', clip: { x: 420, y: 230, width: 600, height: 400 } }); } }
  console.log(errs); await b.close(); })();
