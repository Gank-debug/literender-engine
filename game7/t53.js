const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForSelector('#shplay'); await p.click('#shplay');
  console.log(await p.evaluate(() => [UI.demo, !!UI.static, $('lobby').style.backgroundImage.includes('url')])); await p.screenshot({ path: 'o_demo_now.png' });
  await p.waitForTimeout(1500); await p.click('#lgo'); await p.waitForTimeout(3000); console.log(await p.evaluate(() => [UI.demo, G.round, G.setup.step]), errs); await b.close(); })();
