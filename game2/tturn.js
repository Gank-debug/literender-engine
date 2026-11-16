// Menu start with a set name, playing the Hollow: night 1 turns a brother; then as the faithful, a turned 'you' sees the notice
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  const run = async (as, shot) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(() => { try { localStorage.setItem('crown-name', 'G.A.N.K.'); localStorage.setItem('hollow-scenes', '0'); } catch (e) {} });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(`file://${__dirname}/hollow_brother_proto.html`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU && document.getElementById('hsolo'), null, { timeout: 90000 });
    await p.evaluate(as => { HMENU.as = as; HMENU.scenes = false; document.getElementById('hsolo').click(); }, as); await p.waitForTimeout(800);
    await p.evaluate(() => { const q = document.querySelector('#modal [data-go="night"]'); if (q) q.click(); }); await p.waitForTimeout(400);
    if (as === 'enemy') { await p.screenshot({ path: shot + '_night.png' }); await p.evaluate(() => document.querySelectorAll('[data-turn]')[3].click()); }
    else await p.evaluate(() => { PROTO.G.players.forEach(q => { if (q.id) q.heard = 5; }); const q = document.querySelector('[data-protect],[data-follow]'); if (q) q.click(); });
    await p.evaluate(() => document.querySelector('[data-go="sleep"]').click()); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const G = PROTO.G; return { you: G.players[0].name, turned: G.nightLog.turned, roleNow: G.players[G.nightLog.turned].role, was: G.players[G.nightLog.turned].wasRole, phase: G.phase }; });
    await p.screenshot({ path: shot + '_dawn.png' }); console.log(as, JSON.stringify(r)); await c.close(); };
  await run('enemy', 'tt_enemy');
  // force the house to turn "you"
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(() => { try { localStorage.setItem('crown-name', 'G.A.N.K.'); } catch (e) {} }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=9&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { const G = PROTO.G; G.players.forEach(q => { if (q.id) q.heard = 30; }); document.querySelector('#modal [data-go="night"]').click(); const q = document.querySelector('[data-protect],[data-follow]'); if (q) q.click(); document.querySelector('[data-go="sleep"]').click(); });
  await p.waitForTimeout(800); console.log('you turned?', await p.evaluate(() => [PROTO.G.nightLog.turned, PROTO.G.players[0].role])); await p.screenshot({ path: 'tt_you_dawn.png' });
  console.log(errs); await b.close(); })();
