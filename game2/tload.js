const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now(); await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=5');
  for (let k = 0; k < 40; k++) { await p.waitForTimeout(3000); const st = await p.evaluate(() => [document.getElementById('load').style.display, window.HGAME && HGAME.mapKey && HGAME.mapKey(), !!(window.PROTO && PROTO.G)]); console.log((Date.now() - t0) / 1000, JSON.stringify(st), errs.slice(0, 3)); if (st[0] === 'none' && st[1] === 'town') break; }
  await b.close(); })();
