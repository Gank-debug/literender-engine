const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(6000); await p.screenshot({ path: '../shots/shelf_nohollow.png' }); console.log(await p.evaluate(() => [...document.querySelectorAll('.shcard')].map(e => e.innerText.split('\n')[0]).join(' | ')), errs); await b.close(); })();
