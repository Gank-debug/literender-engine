const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { try { localStorage.setItem('hollow-map', 'town'); localStorage.setItem('hollow-scenes', '1'); } catch (e) {} });
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 90000 });
  await p.waitForFunction(() => HGAME.mapKey() === 'town' && document.getElementById('load').style.display === 'none', null, { timeout: 60000 }); await p.waitForTimeout(2500);
  await p.screenshot({ path: '../shots/town_menu.png' });
  await p.click('#hsolo'); await p.waitForTimeout(1500); await p.screenshot({ path: '../shots/town_intro.png' });
  const q = s => p.evaluate(s => document.querySelector('#modal ' + s)?.click(), s);
  await q('[data-go="night"]'); await p.waitForTimeout(300);
  for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-turn]', '[data-kill]', '[data-frame]', '[data-hush]']) await q(s); await p.waitForTimeout(200); await q('[data-go="sleep"]');
  await p.waitForTimeout(5000); await p.screenshot({ path: '../shots/town_night.png' });
  await p.evaluate(() => PROTO.NIGHT.skip()); await p.waitForTimeout(400); for (let k = 0; k < 6 && await p.evaluate(() => PROTO.NIGHT.on()); k++) { await p.evaluate(() => PROTO.NIGHT.skip()); await p.waitForTimeout(300); }
  await p.waitForTimeout(800); await p.screenshot({ path: '../shots/town_dawn.png' }); await q('[data-go="day"]'); await p.waitForTimeout(1200);
  // walk out of the gate into the fields
  await p.evaluate(() => { const me = PROTO.you(); me.path = PROTO.findPath(me.x, me.y, 24, 43.5); }); await p.waitForTimeout(14000);
  console.log('pos', await p.evaluate(() => { const me = PROTO.you(); return [me.x.toFixed(1), me.y.toFixed(1), PROTO.G.phase]; }));
  await p.screenshot({ path: '../shots/town_day_fields.png' });
  await p.evaluate(() => { const me = PROTO.you(); me.path = PROTO.findPath(me.x, me.y, 24, 24); }); await p.waitForTimeout(8000); await p.screenshot({ path: '../shots/town_day_square.png' });
  console.log(errs.slice(0, 8)); await b.close(); })();
