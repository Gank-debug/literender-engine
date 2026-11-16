const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  for (const fog of ['off', 'room', 'sight', 'mem']) { const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); p.on('pageerror', e => errs.push(fog + ': ' + e.message));
    await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=${fog}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
    await p.evaluate(() => { document.querySelector('[data-go="night"]').click(); });
    await p.evaluate(() => { const q = s => document.querySelector(s); const a = q('[data-protect]'); if (a) a.click(); const f = q('[data-follow]'); if (f) f.click(); q('[data-go="sleep"]').click(); });
    await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('[data-go="day"]').click());
    // walk into the yard-chapel doorway area and let bots spread
    await p.evaluate(() => { const P = PROTO, m = P.you(); P.G.headless = true; m.path = P.findPath(m.x, m.y, 14, 12); for (let k = 0; k < 500; k++) P.update(.05); for (const x of P.G.players) if (x.id !== m.id && x.ls) x.ls.t = P.G.t - 8; for (let k = 0; k < 160; k++) P.update(.05); P.G.headless = false; });
    await p.waitForTimeout(600); await p.screenshot({ path: `${__dirname}/fog_${fog}.png` }); await p.close(); }
  console.log(errs); await b.close(); })();
