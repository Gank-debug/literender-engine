const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = []; const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=mem`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('[data-go="night"]').click(); const q = s => document.querySelector(s); const a = q('[data-protect]'); if (a) a.click(); const f = q('[data-follow]'); if (f) f.click(); q('[data-go="sleep"]').click(); });
  await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('[data-go="day"]').click());
  // let everyone wander for 20 s while you follow a route through the house
  await p.evaluate(() => { const P = PROTO, m = P.you(); P.G.headless = true; m.path = P.findPath(m.x, m.y, 4, 13); for (let k = 0; k < 400; k++) { P.update(.05); if (k % 4 === 0) P.frame(); } m.path = P.findPath(m.x, m.y, 15, 14); for (let k = 0; k < 260; k++) { P.update(.05); if (k % 4 === 0) P.frame(); } P.G.headless = false; });
  await p.waitForTimeout(500); await p.screenshot({ path: `${__dirname}/fog_mem2.png` }); console.log(errs); await b.close(); })();
