const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000); await p.click('#shplay'); await p.waitForTimeout(2500); await p.screenshot({ path: __dirname + '/../game2/menu_lords.png' });
  await p.evaluate(() => { const t = [...document.querySelectorAll('.ltabs button')][1]; if (t) t.click(); }); await p.waitForTimeout(800); await p.screenshot({ path: __dirname + '/../game2/menu_lords_host.png' });
  await p.evaluate(() => { const t = [...document.querySelectorAll('.ltabs button')][0]; if (t) t.click(); }); await p.waitForTimeout(300);
  await p.evaluate(() => window.AI_AGGRO = true); await p.click('#lgo'); await p.waitForTimeout(11500); await p.evaluate(() => { if (G.setup && G.setup.step === 'charter') send({ type: 'charter', k: 'merchant', by: charterWho().id }); });
  await p.evaluate(() => { const b = document.getElementById('autob'); if (b) b.click(); });
  for (let i = 0; i < 400; i++) { await p.waitForTimeout(500); const w = await p.evaluate(() => { const b = document.querySelector('#btac [data-o="hold"]'); if (b) b.click(); return !!document.querySelector('.ebox') && document.getElementById('win').style.display !== 'none'; }); if (w) break; if (i === 10) await p.evaluate(() => { G.win = 6; G.lords.forEach(L => {}); }); }
  await p.waitForTimeout(1500); await p.screenshot({ path: __dirname + '/../game2/end_lords.png' }); console.log(errs.slice(0, 5)); await b.close(); })();
