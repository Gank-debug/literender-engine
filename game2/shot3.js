const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } });
  for (const n of ['monastery', 'town', 'port']) { await p.goto('file://' + __dirname + '/ui_' + n + '.html'); await p.waitForTimeout(800); await p.screenshot({ path: __dirname + '/ui_' + n + '.png' }); }
  await b.close(); })();
