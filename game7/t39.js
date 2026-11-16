const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(424242, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  await p.evaluate(() => { CQ.q = []; ffwd(); $('toasts').innerHTML = ''; hud(); }); await p.mouse.move(720, 430);
  await p.mouse.wheel(0, 200); await p.waitForTimeout(400); await p.mouse.wheel(0, 200); await p.waitForTimeout(700);
  console.log(await p.evaluate(() => [UI.cam.z, UI.cam.x, UI.cam.y, W0, H0])); await p.screenshot({ path: 'o_far.png' });
  await p.mouse.move(300, 200); await p.mouse.down(); await p.mouse.move(700, 500, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(500); await p.screenshot({ path: 'o_far2.png' });
  console.log(errs); await b.close(); })();
