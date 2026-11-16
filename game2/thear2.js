// The new Hearing, solo: name someone, trial, spared -> second round, then night
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=11&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  const clk = s => p.evaluate(s => { const e = [...document.querySelectorAll(s)].find(x => x.offsetParent); if (e) e.click(); return !!e; }, s);
  await clk('#modal [data-go="night"]'); await clk('[data-protect]'); await clk('[data-follow]'); await clk('[data-go="sleep"]'); await p.waitForTimeout(300); await clk('[data-go="day"]');
  for (let n = 0; n < 2; n++) { await p.evaluate(() => { PROTO.G.headless = true; for (let k = 0; k < 4000 && PROTO.G.phase === 'day'; k++) PROTO.update(.05); PROTO.G.headless = false; }); if (await p.evaluate(() => PROTO.G.phase) !== 'dusk') { await clk('[data-go="night"]'); await clk('[data-protect]'); await clk('[data-follow]'); await clk('[data-go="sleep"]'); await p.waitForTimeout(300); await clk('[data-go="day"]'); } }
  console.log('phase', await p.evaluate(() => [PROTO.G.phase, JSON.stringify(PROTO.G.hearing && PROTO.G.hearing.noms)]));
  await p.waitForTimeout(300); await p.screenshot({ path: 'h2_nom.png' });
  // name the brother the bots lead with (or the first)
  await p.evaluate(() => { const b = document.querySelector('[data-nom]:not([data-nom="-1"])'); b.click(); }); await p.waitForTimeout(200);
  await clk('[data-go="tally"]'); await p.waitForTimeout(300);
  console.log('after tally', await p.evaluate(() => { const h = PROTO.G.hearing; return [h.stage, h.round, h.acc.length, h.nomFail, h.result && h.result.hanged]; }));
  await p.screenshot({ path: 'h2_trial.png' });
  await clk('[data-vote="0"]'); await p.waitForTimeout(200); await clk('[data-go="next"]'); await p.waitForTimeout(400);
  console.log('after verdict', await p.evaluate(() => { const h = PROTO.G.hearing; return [h.stage, h.round, h.acc.map(a => a.out + ':' + a.ayes), h.result && JSON.stringify(h.result)]; }));
  await p.screenshot({ path: 'h2_after.png' });
  console.log(errs); await b.close(); })();
