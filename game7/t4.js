const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const H = await (await b.newContext()).newPage(), J = await (await b.newContext()).newPage(); const errs = [];
  for (const [n, p] of [['H', H], ['J', J]]) p.on('pageerror', e => errs.push(n + ' ' + e.message));
  const url = 'file://' + __dirname + '/crown7.html'; await H.goto(url); await J.goto(url); await H.waitForTimeout(3000);
  await H.click('#lhost'); await H.click('[data-man="blue"]'); await J.click('#ljoin'); await J.click('#lmanual');
  for (let i = 0; i < 30; i++) { await H.waitForTimeout(500); const a = await H.evaluate(() => NET.links.blue && NET.links.blue.code), c = await J.evaluate(() => NET.links.host && NET.links.host.code); if (a && c) break; }
  const hc = await H.evaluate(() => NET.links.blue.code), jc = await J.evaluate(() => NET.links.host.code); console.log('code lengths', hc.length, jc.length);
  await J.fill('[data-paste="host"]', hc);
  await H.fill('[data-paste="blue"]', jc);
  for (let i = 0; i < 30; i++) { await H.waitForTimeout(500); if (await H.evaluate(() => NET.links.blue.state === 'open')) break; }
  await H.waitForTimeout(800); await H.screenshot({ path: 'r1.png' }); await J.screenshot({ path: 'r2.png' });
  console.log('states', await H.evaluate(() => NET.links.blue.state), await J.evaluate(() => [NET.links.host.state, NET.seat]));
  await H.click('#lstart'); await H.waitForTimeout(500); if (await H.$('#lstart')) await H.click('#lstart').catch(() => {}); await H.waitForTimeout(4000);
  console.log(await Promise.all([H, J].map(p => p.evaluate(() => [G.seed, meId(), G.phase, CQ.done]))));
  console.log('ERR', errs); await b.close(); })();
