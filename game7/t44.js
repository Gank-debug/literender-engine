const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(424242, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  await p.evaluate(() => { CQ.q = []; UI.toast = () => {}; ffwd(); $('toasts').innerHTML = ''; const L = lord('red'); L.charter = 'geomancer'; G.cur = L.i; G.phase = 'main'; Object.assign(L.res, { ore: 5, grain: 5 }); send({ type: 'build', k: 'town', id: settlements('red')[0].id }); });
  await p.waitForTimeout(1200); console.log(await p.evaluate(() => [JSON.stringify(G.parch), parchMine()]));
  const t = await p.evaluate(() => { const t = G.tiles.find(t => t.type !== 'desert' && t.num && t.verts.some(v => G.verts[v].owner && G.verts[v].owner !== 'red')); UI.cam.z = 1; centerOn(t.cx, t.cy); UI.camGoal = null; return t.i; });
  await p.waitForTimeout(500); await p.mouse.move(720, 430); await p.waitForTimeout(300); await p.screenshot({ path: 'o_parch.png' }); await p.mouse.click(720, 430); await p.waitForTimeout(2000);
  console.log(await p.evaluate(t => [G.parch, G.tiles[t].type, G.log.slice(0, 3).map(l => l.html.replace(/<[^>]+>/g, ''))], t));
  // the computer Geomancer
  console.log(await p.evaluate(() => { const L = lord('blue'); L.charter = 'geomancer'; G.parch = { who: 'blue' }; const pick = aiParch(L); parchApply(L, pick); return [pick, G.parch, pick >= 0 ? G.tiles[pick].type : null]; }));
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
