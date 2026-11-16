const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000);
  await p.click('#volb'); await p.waitForTimeout(2500); await p.screenshot({ path: __dirname + '/vol1.png' });
  console.log(await p.evaluate(() => ({ ready: MUSIC.ready, state: MUSIC.ctx && MUSIC.ctx.state, vol: MUSIC.vol, dur: 0 })));
  await p.click('#shplay'); await p.click('#lgo'); await p.waitForTimeout(12500); await p.evaluate(() => { if (G.setup && G.setup.step === 'charter') send({ type: 'charter', k: 'merchant', by: charterWho().id }); }); await p.waitForTimeout(2000);
  await p.click('#volb'); await p.fill('#volr', '25'); await p.dispatchEvent('#volr', 'input'); await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/vol2.png' });
  console.log(await p.evaluate(() => ({ vol: MUSIC.vol, gain: MUSIC.gain && MUSIC.gain.gain.value })), errs.slice(0, 5)); await b.close(); })();
