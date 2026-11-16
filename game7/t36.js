const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(424242, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  await p.evaluate(() => { CQ.q = []; ffwd(); $('toasts').innerHTML = ''; const v = settlements('red')[0]; UI.cam.z = 3; centerOn(v.vx, v.vy); UI.camGoal = null; hud(); }); await p.waitForTimeout(700);
  await p.screenshot({ path: 'o_zoom.png', clip: { x: 420, y: 180, width: 600, height: 500 } }); console.log(errs); await b.close(); })();
