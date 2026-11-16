// Ring countdown on Dawn moves on by itself; hints come from the menu
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(() => { try { localStorage.setItem('hollow-hints', '1'); localStorage.setItem('crown-name', 'G.A.N.K.'); } catch (e) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hsolo'), null, { timeout: 90000 });
  console.log('menu hints row', await p.evaluate(() => document.querySelector('[data-hints="1"]').className));
  await p.screenshot({ path: 'cd_menu.png' });
  await p.evaluate(() => { HMENU.scenes = false; document.getElementById('hsolo').click(); }); await p.waitForTimeout(600);
  console.log('intro hint button gone', await p.evaluate(() => !document.querySelector('[data-go="hints"]')), 'opt.hints', await p.evaluate(() => PROTO.G.opt.hints));
  await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); const q = document.querySelector('[data-protect],[data-follow]'); if (q) q.click(); document.querySelector('[data-go="sleep"]').click(); });
  await p.waitForTimeout(3000); await p.evaluate(() => { PROTO.G.players[3].mark = '✗'; PROTO.G.players[5].mark = '✓'; HGAME.renderAll(); }); await p.screenshot({ path: 'cd_dawn.png' });
  console.log('ring', await p.evaluate(() => document.querySelector('#modal .cdr') && document.querySelector('#modal .cdr').textContent), PROTO_phase = await p.evaluate(() => PROTO.G.phase));
  await p.waitForTimeout(13500); console.log('after 16s', await p.evaluate(() => PROTO.G.phase));
  console.log(errs); await b.close(); })();
