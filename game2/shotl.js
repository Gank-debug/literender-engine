const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } }); p.on('pageerror', e => console.log(e.message));
  for (const n of ['chart', 'court', 'timber', 'stone']) { await p.goto('file://' + __dirname + '/lords_' + n + '.html'); await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/lords_' + n + '.png' }); }
  await b.close(); })();
