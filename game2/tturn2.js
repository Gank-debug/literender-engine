const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=5'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G, null, { timeout: 90000 });
  await p.mouse.click(5, 5); await p.waitForFunction(() => MUSIC.ready && MUSIC.srcs && MUSIC.srcs.length === 7 && MUSIC.turnBufs, null, { timeout: 60000 });
  await p.evaluate(() => { G.day = 6; G.mus = 2; }); await p.waitForTimeout(5000);
  await p.evaluate(() => { MUSIC.t0 -= (MUSIC.dur + 24 * MUSIC.bar - 3) - (MUSIC.ctx.currentTime - MUSIC.t0); }); await p.waitForTimeout(4500);
  console.log(await p.evaluate(() => 'turn layers ' + (MUSIC.turnSrcs || []).length + ' main ' + MUSIC.srcs.map(x => +x.g.gain.value.toFixed(2)).join(' ') + ' turn ' + MUSIC.turnSrcs.map(x => +x.g.gain.value.toFixed(2)).join(' ')));
  console.log(errs); await b.close(); })();
