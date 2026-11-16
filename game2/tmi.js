const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); PROTO.G.players[3].mark = '✗'; PROTO.G.players[5].mark = '✓'; PROTO.G.players[6].mark = '?'; HGAME.hideModal(); HGAME.renderAll(); });
  console.log(await p.evaluate(() => [...document.querySelectorAll('#bro .mi')].map(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return [e.textContent, r.width, r.height, cs.padding, cs.borderWidth, cs.boxSizing]; })));
  const r = await p.evaluate(() => { const e = document.querySelectorAll('#bro .mk')[3].getBoundingClientRect(); return { x: e.x - 30, y: e.y - 70, width: 60, height: 120 }; }); await p.screenshot({ path: 'mi.png', clip: r });
  await b.close(); })();
