const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(424242, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  await p.evaluate(() => { CQ.q = []; ffwd(); $('toasts').innerHTML = ''; });
  const idle = async () => { for (let i = 0; i < 60; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => myTurn() && !UI.scene)) return; } };
  // Red walls the borders around its first village
  const r1 = await p.evaluate(() => { const L = me(); Object.assign(L.res, { clay: 12, timber: 6 }); const home = settlements('red')[0]; const es = home.edges.map(i => G.edges[i]).filter(e => canWall('red', e));
    es.forEach(e => send({ type: 'build', k: 'walls', id: e.id })); return es.map(e => e.id); });
  await idle(); console.log('walls', await p.evaluate(() => G.edges.filter(e => e.wo).map(e => [e.id, e.wo, e.whp, e.owner === e.wo ? 'gate' : 'wall'])));
  // Blue's march may not cross any of them
  console.log('blue blocked', await p.evaluate(() => { const B = lord('blue'), home = settlements('red')[0]; const out = home.adj[0]; B.army.v = out; const M = marchMap(B); return [M.cost.has(home.id), G.edges.filter(e => e.wo).every(e => !(M.prev.get(e.a) === e.b || M.prev.get(e.b) === e.a))]; }));
  await p.evaluate(() => { UI.mode = 'walls'; const h = settlements('red')[0]; centerOn(h.vx, h.vy); UI.cam.z = 2; hud(); }); await p.waitForTimeout(500); await p.screenshot({ path: 'w1.png' });
  // now Blue walls a border and Red, with a catapult, batters it
  const bat = await p.evaluate(() => { const B = lord('blue'), R = me(); B.army.v = settlements('blue')[0].adj[0]; const e = G.edges.find(e => canWall('blue', e) && !e.owner && [e.a, e.b].some(vi => !G.verts[vi].owner)); e.wo = 'blue'; e.whp = 2; const at = G.verts[e.a].owner ? e.b : e.a; R.army.v = at; R.at = null; R.army.units.cata = 1; R.deed = false; R.battered = false; landChanged(); UI.sel = { lord: R }; hud(); return [e.id, batterable(R).map(x => x.id), marchMap(R).cost.has(e.a === at ? e.b : e.a)]; });
  console.log('batter options', bat); await p.waitForTimeout(400); await p.screenshot({ path: 'w2.png' });
  await p.click('[data-bat]'); await p.waitForTimeout(1500); await p.screenshot({ path: 'w3.png' });
  for (let i = 0; i < 2; i++) { await p.evaluate(i => send({ type: 'shot', bid: G.bid, i: i + 1, dist: 10, hit: true, by: 'red' }), i); await p.waitForTimeout(1500); }
  await p.screenshot({ path: 'w4.png' }); await p.evaluate(() => send({ type: 'storm', bid: G.bid, by: 'red' })); await idle();
  console.log('after', await p.evaluate(e => { const x = G.edges[e]; const R = me(); return [x.whp, R.battered, marchMap(R).cost.has(x.a === R.army.v ? x.b : x.a)]; }, bat[0]));
  await p.evaluate(() => { UI.sel = null; hud(); }); await p.waitForTimeout(300); await p.screenshot({ path: 'w5.png' });
  console.log('ERR', errs); await b.close(); })();
