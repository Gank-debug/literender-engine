const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 90000 });
  await p.waitForTimeout(800); await p.screenshot({ path: '../shots/menu_single.png' });
  await p.click('#hsolo'); await p.waitForTimeout(1500); console.log(await p.evaluate(() => [PROTO.G.opt.lot, PROTO.G.players[0].role, document.getElementById('modal').innerText.slice(0, 160)]), errs); await b.close(); })();
