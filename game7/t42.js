const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 860 } });
  const H = await ctx.newPage(), J = await ctx.newPage(); const errs = [];
  for (const [n, p] of [['H', H], ['J', J]]) p.on('pageerror', e => errs.push(n + ' ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  const url = 'file://' + __dirname + '/crown7.html'; await H.goto(url); await J.goto(url); await H.waitForTimeout(3000);
  await H.evaluate(() => { LOBBY.seats.green = 'none'; LOBBY.seats.white = 'none'; LOBBY.seats.gold = 'ai'; LOBBY.seats.violet = 'ai'; netLocalHost(['blue']); }); await J.evaluate(() => netLocalJoin('blue')); await H.waitForTimeout(800);
  await J.evaluate(() => { LOBBY.view = 'join'; lobbyDraw(); }); await J.waitForTimeout(300);
  const jp = await J.$('[data-pc="blue:amber"]'); console.log('guest palette?', !!jp); if (jp) await jp.click(); else await J.evaluate(() => { netSend(NET.links.host, { t: 'colour', k: 'amber' }); });
  await H.waitForTimeout(600); await H.evaluate(() => { LOBBY.cols.gold = 'ice'; lobbyShare(); lobbyDraw(); }); await H.waitForTimeout(400);
  await J.screenshot({ path: 'o_guest_lobby.png' });
  console.log('lobby', await H.evaluate(() => JSON.stringify(LOBBY.cols)), await J.evaluate(() => JSON.stringify(LOBBY.cols)));
  await H.click('#lstart'); await H.waitForTimeout(500); await H.evaluate(() => { const b = $('lstart'); if (b) b.click(); }); await H.waitForTimeout(3000);
  console.log('game', await H.evaluate(() => [JSON.stringify(G.cols), COLS.blue, COLS.gold].join(' ')), await J.evaluate(() => [JSON.stringify(G.cols), COLS.blue, COLS.gold].join(' ')));
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
