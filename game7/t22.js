const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(424242, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  await p.evaluate(() => { CQ.q = []; ffwd(); $('toasts').innerHTML = ''; });
  const idle = async () => { for (let i = 0; i < 80; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => myTurn() && !UI.scene)) return; } };
  const info = await p.evaluate(() => { const R = me(); Object.assign(R.res, { clay: 12, timber: 6 }); const home = settlements('red').find(v => v.level === 1); const e = home.edges.map(i => G.edges[i]).find(e => canWall('red', e) && !e.owner) || home.edges.map(i => G.edges[i]).find(e => canWall('red', e)); send({ type: 'build', k: 'walls', id: e.id }); return { home: home.id, e: e.id }; });
  await idle();
  console.log('ring', await p.evaluate(i => { const v = G.verts[i.home]; return [v.ring, v.edges.map(x => sideHp(v, G.edges[x]))]; }, info));
  // blue next door can't reach it; gold with a catapult batters the ring
  console.log('blue', await p.evaluate(i => { const v = G.verts[i.home], B = lord('blue'); B.army.v = v.adj.find(a => !G.verts[a].owner); const M = marchMap(B); return [M.targets.includes(v.id), M.cost.has(v.id)]; }, info));
  // make gold a human-controlled test: hand the turn's seat over is complex, so use red batter a blue ring instead
  const i2 = await p.evaluate(() => { const B = lord('blue'), R = me(); const bv = settlements('blue').find(v => v.level === 1) || settlements('blue')[0]; const e = bv.edges.map(i => G.edges[i]).find(e => canWall('blue', e)); build(B, 'walls', e) || (e.wo = 'blue', e.whp = 2, raiseRing(bv)); B.army.v = settlements('blue').find(v => v !== bv).id;
    R.army.v = bv.edges.map(i => G.edges[i]).filter(x => !x.wo).map(x => x.a === bv.id ? x.b : x.a).find(a => !G.verts[a].owner && !G.lords.some(O => O.army.v === a)); R.at = null; R.army.units.cata = 2; R.battered = false; R.deed = false; landChanged(); UI.sel = { lord: R }; hud(); UI.cam.z = 2; centerOn(bv.vx, bv.vy); UI.camGoal = null; return { bv: bv.id, sides: bv.edges.map(x => sideHp(bv, G.edges[x])), can: sidesBatterable(R).map(([v, e]) => v.id + ':' + e.id), target: marchMap(R).targets.includes(bv.id) }; });
  console.log('red at blue', i2); await p.waitForTimeout(500); await p.screenshot({ path: 'r1.png' });
  await p.click('[data-bring]'); await p.waitForTimeout(1200); await p.screenshot({ path: 'r2.png' });
  for (let i = 0; i < 2; i++) { await p.evaluate(i => send({ type: 'shot', bid: G.bid, i: i + 1, dist: 10, hit: true, by: 'red' }), i); await p.waitForTimeout(1500); }
  await p.screenshot({ path: 'r3.png' }); await p.evaluate(() => send({ type: 'storm', bid: G.bid, by: 'red' })); await idle();
  console.log('after', await p.evaluate(i => { const v = G.verts[i.bv]; return [v.edges.map(x => sideHp(v, G.edges[x])), marchMap(me()).targets.includes(i.bv)]; }, i2));
  await p.evaluate(() => { UI.sel = null; hud(); }); await p.waitForTimeout(400); await p.screenshot({ path: 'r4.png' });
  console.log('ERR', errs); await b.close(); })();
