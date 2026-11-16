const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(() => document.querySelector('[data-go="night"]').click()); await p.evaluate(() => { const a = document.querySelector('[data-protect],[data-follow]'); if (a) a.click(); document.querySelector('[data-go="sleep"]').click(); document.querySelector('[data-go="day"]').click(); });
  await p.click('#volb'); await p.waitForTimeout(3000); await p.screenshot({ path: __dirname + '/pvol.png' });
  console.log(await p.evaluate(() => ({ ready: MUSIC.ready, state: MUSIC.ctx && MUSIC.ctx.state })), errs.slice(0, 5)); await b.close(); })();
