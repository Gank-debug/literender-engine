const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  // find a seed where the house turns you
  for (let s = 1; s < 40; s++) { await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=${s}&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
    const t = await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); const q = document.querySelector('[data-protect],[data-follow]'); if (q) q.click(); document.querySelector('[data-go="sleep"]').click(); return PROTO.G.nightLog && PROTO.G.nightLog.turned; });
    if (t === 0) { await p.waitForTimeout(600); await p.evaluate(() => { PROTO.G.players[3].mark = '?'; PROTO.G.players[5].mark = '✗'; PROTO.G.players[6].mark = '✓'; HGAME.renderAll(); }); await p.screenshot({ path: 'tt_you_dawn.png' }); console.log('seed', s); break; } }
  console.log(errs); await b.close(); })();
