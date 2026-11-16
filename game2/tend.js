const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } }); p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none');
  await p.screenshot({ path: __dirname + '/pt_0intro.png' });
  await p.evaluate(() => { const G = PROTO.G, q = s => document.querySelector(s); q('[data-go="night"]').click(); const a = q('[data-protect],[data-follow]'); if (a) a.click(); q('[data-go="sleep"]').click(); q('[data-go="day"]').click(); PROTO.startHearing(); const E = G.players.find(p => p.role === 'enemy'); q(`[data-accuse="${E.id}"]`) ? q(`[data-accuse="${E.id}"]`).click() : 0; });
  await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/pt_8accuse.png' });
  await p.evaluate(() => { const G = PROTO.G, q = s => document.querySelector(s); q('[data-go="vote"]').click(); for (let k = 0; k < 6; k++) { const v = q('[data-vote="1"]'); if (v) v.click(); const n = q('[data-go="next"]'); if (n) n.click(); } });
  await p.waitForTimeout(800); await p.screenshot({ path: __dirname + '/pt_9end.png' }); await b.close(); })();
