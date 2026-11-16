// The town's theme: four stems in step; the nights bring them in; the Strigoi's victory takes them all up, then the ending.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=5'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G, null, { timeout: 90000 });
  await p.mouse.click(5, 5); await p.waitForFunction(() => MUSIC.ready && MUSIC.cur === 'town' && MUSIC.srcs && MUSIC.srcs.length === 4, null, { timeout: 60000 });
  const g = () => p.evaluate(() => MUSIC.srcs.map(x => +x.g.gain.value.toFixed(2)).join(' ') + ` stage ${MUSIC.stage} bar ${MUSIC.bar.toFixed(2)} dur ${MUSIC.dur.toFixed(1)}`);
  console.log('day 1:', await g());
  for (const d of [2, 4, 6]) { await p.evaluate(d => { G.day = d; }, d); await p.waitForTimeout(9000); console.log('day ' + d + ':', await g()); }
  await p.evaluate(() => { G.day = 1; }); await p.waitForTimeout(9000); console.log('back to day 1:', await g());
  await p.evaluate(() => musicTaunt()); await p.waitForTimeout(4500); console.log('taunt:', await g());
  await p.waitForTimeout(8000); await p.evaluate(() => musicVictory()); await p.waitForTimeout(1500); console.log("victory:", await p.evaluate(() => JSON.stringify(MUSIC.victoryAt) + " vsrc " + MUSIC.vsrc.length)); await p.waitForTimeout(3000); console.log("after:", await p.evaluate(() => MUSIC.live + " " + MUSIC.ctx.currentTime.toFixed(1)));
  await p.evaluate(() => { G.over = null; musicTrack('town'); }); await p.waitForTimeout(3500); console.log('rematch:', await g(), await p.evaluate(() => MUSIC.live));
  console.log(errs); await b.close(); })();
