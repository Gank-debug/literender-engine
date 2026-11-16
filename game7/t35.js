const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => startGame(616, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(() => send({ type: 'charter', k: 'bandit' })); await p.waitForTimeout(3000);
  for (let i = 0; i < 40; i++) { const st = await p.evaluate(() => G.phase === 'setup' ? G.setup.step : G.phase); if (st === 'roll') break; await p.evaluate(() => { if (!myTurn()) return; if (G.setup.step === 'village') send({ type: 'setupV', v: aiSetupVillage(me()).id }); else if (G.setup.step === 'road') send({ type: 'setupR', e: aiSetupRoad(me()).id }); }); await p.waitForTimeout(1500); }
  await p.evaluate(() => send({ type: 'roll' })); await p.waitForTimeout(800); await p.evaluate(() => { if (G.phase === 'robber') send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i }); }); await p.waitForTimeout(600);
  // blue (computer) will roll a 7
  await p.evaluate(() => { const r0 = window.rand; let n = 0; window.rand = () => { n++; if (n === 1) return .4; if (n === 2) { window.rand = r0; return .55; } return r0(); }; G.lords.forEach(L => L.res.ore += 3); send({ type: 'end' }); });
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => G.phase === 'robber')) break; }
  await p.waitForTimeout(800); console.log('state', await p.evaluate(() => [curL().id, G.phase, G.robBy, robMine(), G.dice])); await p.screenshot({ path: 'o_bandit.png' });
  await p.evaluate(() => { const t = G.tiles.filter(t => t.num && t.i !== G.robber).sort((a, b) => robTargets(lord('red'), b.i).length - robTargets(lord('red'), a.i).length)[0]; const [x, y] = [(t.cx - UI.cam.x) * UI.cam.z, (t.cy - UI.cam.y) * UI.cam.z]; window._t = t.i; centerOn(t.cx, t.cy); UI.camGoal = null; });
  await p.waitForTimeout(300); await p.mouse.click(720, 430); await p.waitForTimeout(500);
  const c = await p.$('#card [data-o]'); if (c) await c.click();
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => myTurn())) break; }
  console.log('after', await p.evaluate(() => [curL().id, G.phase, G.robber === window._t, G.robBy, G.log.slice(0, 12).map(l => l.html.replace(/<[^>]+>/g, '')).filter(s => /outlaw|rob/i.test(s))]));
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
