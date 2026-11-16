const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } });
  for (const [h, n] of [['', 'screen_day.png'], ['?vote', 'screen_vote.png']]) { await p.goto('file://' + __dirname + '/screen_draft.html' + h); await p.waitForTimeout(600); await p.screenshot({ path: __dirname + '/' + n }); }
  await b.close(); })();
