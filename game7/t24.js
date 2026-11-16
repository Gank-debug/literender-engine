const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(77, ['red'], ['red', 'blue', 'gold', 'violet'], null, { names: { red: 'GANK' }, win: 20 })); await p.waitForTimeout(2500);
  await p.screenshot({ path: 'ch1.png' });
  await p.click('#charters [data-ch="raider"]'); await p.waitForTimeout(200); await p.screenshot({ path: 'ch2.png' }); await p.click('#chgo'); await p.waitForTimeout(4500);
  console.log(await p.evaluate(() => [G.setup && G.setup.step, G.lords.map(L => L.id + ':' + L.charter).join(' '), JSON.stringify(lord('red').army.units)]));
  await p.screenshot({ path: 'ch3.png' });
  console.log('ERR', errs); await b.close(); })();
