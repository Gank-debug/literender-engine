const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.click('#volb'); await p.waitForTimeout(3000);
  await p.evaluate(() => { PROTO.G.over = 'evil'; PROTO.G.phase = 'over'; musicVictory(); }); await p.waitForTimeout(9000);
  console.log(await p.evaluate(() => ({ on: MUSIC.victoryOn, v: MUSIC.victoryAt, t: MUSIC.ctx.currentTime, loop: MUSIC.loopGain.gain.value })), errs.slice(0, 5)); await b.close(); })();
