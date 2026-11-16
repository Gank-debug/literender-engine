const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 860 } });
  const H = await ctx.newPage(), J = await ctx.newPage(); const errs = [];
  for (const [n, p] of [['H', H], ['J', J]]) p.on('pageerror', e => errs.push(n + ' ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  const url = 'file://' + __dirname + '/crown7.html'; await H.goto(url); await J.goto(url); await H.waitForTimeout(3000);
  await H.evaluate(() => { LOBBY.seats.green = 'none'; LOBBY.seats.white = 'none'; LOBBY.seats.gold = 'ai'; LOBBY.seats.violet = 'ai'; netLocalHost(['blue']); }); await J.evaluate(() => netLocalJoin('blue')); await H.waitForTimeout(800);
  await H.click('#lstart'); await H.waitForTimeout(500); await H.evaluate(() => { const b = $('lstart'); if (b) b.click(); }); await H.waitForTimeout(3000);
  await H.screenshot({ path: 'o_ch_lock.png' });
  console.log('locked', await H.evaluate(() => [Date.now() - UI.chT0, UI.chGame, G.seed, $('chgo').disabled, G.lords.map(l => l.id + (l.chose ? '+' : '')).join(' ')]), await J.evaluate(() => $('chgo') && $('chgo').disabled));
  await H.waitForTimeout(9500);
  // both try for the Merchant at once
  await H.evaluate(() => document.querySelector('[data-ch="merchant"]').click()); await J.evaluate(() => document.querySelector('[data-ch="merchant"]').click());
  await H.evaluate(() => $('chgo').click()); await J.evaluate(() => $('chgo').click()); await H.waitForTimeout(1500);
  console.log('after race', await H.evaluate(() => G.lords.map(l => l.id + ':' + (l.charter || '-') + (l.chose ? '+' : '')).join(' ')), await J.evaluate(() => [!!charterWho(), $('charters').style.display]));
  await J.screenshot({ path: 'o_ch_race.png' });
  await J.evaluate(() => document.querySelector('[data-ch="zealot"]').click()); await J.evaluate(() => $('chgo').click()); await H.waitForTimeout(2500);
  console.log('done', await H.evaluate(() => [G.setup.step, G.lords.map(l => l.id + ':' + (l.charter || '-')).join(' '), curL().id]), await J.evaluate(() => [G.setup.step, G.lords.map(l => l.charter || '-').join(' ')]));
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
