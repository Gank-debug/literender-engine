const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=3&scenes=off'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.mouse.click(600, 400); await p.waitForFunction(() => MUSIC.ready, null, { timeout: 30000 }); await p.waitForTimeout(2300);
  const r = await p.evaluate(async () => { const c0 = MUSIC.ctx.currentTime; musicFaithful(); await new Promise(r => setTimeout(r, 1500)); const f = MUSIC.faithAt; const ph = ((f.at - MUSIC.t0) % MUSIC.dur) / LOOP_BAR;
    await new Promise(r => setTimeout(r, (f.at - MUSIC.ctx.currentTime + LOOP_BAR + .5) * 1000)); return { calledAt: +c0.toFixed(2), entersAt: +f.at.toFixed(2), wait: +(f.at - c0).toFixed(2), barPhase: +ph.toFixed(4), loopGainAfter: MUSIC.loopGain.gain.value }; });
  console.log(r, errs); await b.close(); })();
