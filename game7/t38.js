const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 860 } });
  const H = await ctx.newPage(), J = await ctx.newPage(), K = await ctx.newPage(); const errs = [];
  for (const [n, p] of [['H', H], ['J', J], ['K', K]]) p.on('pageerror', e => errs.push(n + ' ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  const url = 'file://' + __dirname + '/crown7.html'; await H.goto(url); await J.goto(url); await K.goto(url); await H.waitForTimeout(3000);
  await H.evaluate(() => { LOBBY.seats.green = 'none'; LOBBY.seats.white = 'none'; LOBBY.seats.violet = 'ai'; netLocalHost(['blue', 'gold']); }); await J.evaluate(() => netLocalJoin('blue')); await K.evaluate(() => netLocalJoin('gold')); await H.waitForTimeout(800);
  await H.click('#lstart'); await H.waitForTimeout(500); await H.click('#lstart').catch(() => {}); await H.waitForTimeout(3500);
  console.log('seats', await H.evaluate(() => [NET.seat, G.lords.map(l => l.id + (l.human ? '*' : '')).join(' ')]), await J.evaluate(() => NET.seat), await K.evaluate(() => NET.seat));
  await H.keyboard.press('c'); await H.waitForTimeout(300); await H.fill('#chatin', 'hello table'); await H.press('#chatin', 'Enter'); await H.waitForTimeout(600);
  await J.evaluate(() => chatOpen('gold')); await J.fill('#chatin', 'secret plan, gold'); await J.click('#chatgo'); await J.waitForTimeout(600);
  await K.evaluate(() => chatOpen('red')); await K.fill('#chatin', 'psst host'); await K.press('#chatin', 'Enter'); await K.waitForTimeout(400); await K.evaluate(() => chatOpen('all')); await K.fill('#chatin', 'hi all'); await K.press('#chatin', 'Enter'); await K.waitForTimeout(800);
  const dump = p => p.evaluate(() => JSON.stringify({ msgs: CHAT.msgs, unread: CHAT.unread }));
  console.log('H', await dump(H)); console.log('J', await dump(J)); console.log('K', await dump(K));
  await J.evaluate(() => chatClose()); await J.waitForTimeout(200); await K.evaluate(() => chatOpen('blue')); await K.fill('#chatin', 'deal. after my turn'); await K.press('#chatin', 'Enter'); await J.waitForTimeout(800);
  await J.screenshot({ path: 'o_chat_pop.png' }); await H.screenshot({ path: 'o_chat_h.png' }); await K.screenshot({ path: 'o_chat_k.png' });
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
