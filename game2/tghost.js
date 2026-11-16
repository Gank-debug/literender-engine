const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); const q = document.querySelector('[data-protect],[data-follow]'); if (q) q.click(); document.querySelector('[data-go="sleep"]').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('[data-go="day"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => { PROTO.G.players[0].alive = false; HGAME.renderAll(); }); const n0 = await p.evaluate(() => PROTO.G.chat.length);
  await p.evaluate(() => HGAME.handle({ chat: 'hello from the grave' }));
  console.log('input', await p.evaluate(() => { const i = document.querySelector('#chat input'); return [i.disabled, i.placeholder]; }), 'chat grew', (await p.evaluate(() => PROTO.G.chat.length)) - n0);
  console.log(errs); await b.close(); })();
