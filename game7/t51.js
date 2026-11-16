const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.click('#shplay'); await p.waitForTimeout(2500);
  const c1 = await p.evaluate(() => [UI.demo, UI.cam.x, UI.cam.y, G.round, G.lords.map(L => vp(L.id)).join()]); await p.screenshot({ path: 'o_demo1.png' }); await p.waitForTimeout(6000); const c2 = await p.evaluate(() => [UI.cam.x, UI.cam.y]); await p.screenshot({ path: 'o_demo2.png' }); console.log(c1, c2);
  await p.click('[data-tab="host"]'); await p.waitForTimeout(500); await p.click('[data-tab="menu"]'); await p.click('#lshelf'); await p.waitForTimeout(300); await p.screenshot({ path: 'o_demo_shelf.png' }); await p.click('#shplay');
  await p.click('#lgo'); await p.waitForTimeout(3500); console.log(await p.evaluate(() => [UI.demo, document.body.className, G.round, G.setup && G.setup.step, G.lords.map(L => L.human).join(), !!charterWho(), getComputedStyle($('lords')).display]));
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
