const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=3&scenes=off&map=town'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && HGAME.mapKey() === 'town', null, { timeout: 90000 });
  await p.mouse.click(600, 400); await p.waitForFunction(() => MUSIC.ready, null, { timeout: 30000 });
  const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), o = {}; o.start = MUSIC.cur + ' ' + MUSIC.dur.toFixed(1);
    musicFaithful(); await w(8000); o.afterVictory = MUSIC.victoryOn + ' live ' + MUSIC.live;
    HGAME.newGame({ seed: 4, humans: [0], scenes: false, map: 'town' }); await w(4000); o.rematch = MUSIC.cur + ' victoryOn ' + MUSIC.victoryOn + ' live ' + MUSIC.live + ' gain ' + MUSIC.loopGain.gain.value.toFixed(2);
    await HGAME.loadMap('monastery'); await w(4000); o.monastery = MUSIC.cur + ' ' + MUSIC.dur.toFixed(1); return o; });
  console.log(r, errs); await b.close(); })();
