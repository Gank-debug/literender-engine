const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000); await p.screenshot({ path: __dirname + '/ren1.png' }); await p.click('#shplay'); await p.waitForTimeout(1500); await p.screenshot({ path: __dirname + '/ren2.png' }); console.log(await p.title(), errs); await b.close(); })();
