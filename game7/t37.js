const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(424242, ['red'], null, null, { names: { red: 'Bartholomew the Bold', blue: 'Ysolde', gold: 'Marguerite', violet: 'Konstantin' } })); await p.waitForTimeout(1800);
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  console.log(await p.evaluate(() => { CQ.q = []; ffwd(); const ch = ['guild', 'shepherd', 'fortress', 'geomancer']; G.lords.forEach((L, i) => L.charter = ch[i]); $('toasts').innerHTML = ''; fit(); UI.cam.z = 1.4; const v = settlements('red')[0]; centerOn(v.vx + 60, v.vy); UI.camGoal = null; landChanged(); hud(); return G.lords.map(L => L.id).join(','); })); await p.waitForTimeout(900);
  await p.screenshot({ path: 'o_patch1.png' }); await p.screenshot({ path: 'o_side.png', clip: { x: 0, y: 0, width: 330, height: 420 } });
  console.log(errs); await b.close(); })();
