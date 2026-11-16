// The town's layers: the turn every other loop, the menace and the metal by the balance, the victory's last chord on a phrase line.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=5'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G, null, { timeout: 90000 });
  await p.mouse.click(5, 5); await p.waitForFunction(() => MUSIC.ready && MUSIC.cur === 'town' && MUSIC.srcs && MUSIC.srcs.length === 7 && MUSIC.turnBufs, null, { timeout: 60000 });
  const g = () => p.evaluate(() => MUSIC.srcs.map(x => +x.g.gain.value.toFixed(2)).join(' ') + ` | stage ${MUSIC.stage} threat ${MUSIC.threat} turnAt ${MUSIC.turnAt} busy ${MUSIC.busy.toFixed(1)} t ${(MUSIC.ctx.currentTime - MUSIC.t0).toFixed(1)}`);
  console.log('start', await g());
  // jump the loop clock so the second time round's bar 25 is a few seconds off: move t0 back
  await p.evaluate(() => { G.day = 2; MUSIC.t0 -= (MUSIC.dur + 24 * MUSIC.bar - 3) - (MUSIC.ctx.currentTime - MUSIC.t0); });
  await p.waitForTimeout(1500); console.log('before turn', await g()); await p.waitForTimeout(3000); console.log('in turn', await g(), await p.evaluate(() => (MUSIC.turnSrcs || []).length));
  await p.evaluate(() => { G.mus = 1; }); await p.waitForTimeout(26000); console.log('menace (after turn)', await g());
  await p.evaluate(() => { G.mus = 2; }); await p.waitForTimeout(4000); console.log('metal', await g());
  await p.evaluate(() => { G.over = 'evil'; musicVictory(); }); await p.waitForTimeout(800); console.log('victory', await p.evaluate(() => JSON.stringify(MUSIC.victoryAt)));
  await p.evaluate(() => { G.over = null; G.mus = 0; G.day = 1; musicTrack('town'); }); await p.waitForTimeout(4000); console.log('rematch', await g());
  console.log(errs); await b.close(); })();
