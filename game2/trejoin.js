// A guest drops mid-day (the house plays his brother), then comes back with the same name and gets his brother back.
const { chromium } = require('playwright');
const URL = `file://${__dirname}/hollow_brother_proto.html`;
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); localStorage.setItem('hollow-scenes', '0'); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 90000 }); return p; };
  const js = (p, sel) => p.evaluate(sel => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent); if (!e) return false; e.click(); return true; }, sel);
  const H = await mk('Hugo'); let A = await mk('Ana');
  await H.click('[data-mtab=host]'); await H.click('[data-scenes="0"]'); await H.click('#hopen'); await H.waitForTimeout(500); const code = await H.evaluate(() => HNET.code);
  await A.click('[data-mtab=join]'); await A.fill('#hcode', code); await A.click('#hjoin');
  for (let i = 0; i < 40; i++) { await H.waitForTimeout(300); if (await H.evaluate(() => HNET.lobby.length) >= 2) break; }
  await H.click('#hstart'); await H.waitForTimeout(1500);
  for (const p of [H, A]) await js(p, '#modal [data-go="night"]'); await H.waitForTimeout(800);
  for (const p of [H, A]) await p.evaluate(() => { const q = s => [...document.querySelectorAll(s)].find(e => e.offsetParent); for (const s of ['#modal [data-kill]', '#modal [data-protect]', '#modal [data-follow]']) { const e = q(s); if (e) e.click(); } });
  await H.waitForTimeout(500); for (const p of [H, A]) await js(p, '#modal [data-go="sleep"]'); await H.waitForTimeout(1500);
  for (const p of [H, A]) await js(p, '#modal [data-go="day"]'); await H.waitForTimeout(1500);
  console.log('day', await H.evaluate(() => [G.phase, G.day]));
  await A.context().close(); await H.waitForTimeout(10000);
  console.log('after drop: away', await H.evaluate(() => JSON.stringify(G.away)), 'Ana brother walking as bot:', await H.evaluate(() => { const p = G.players[1]; const x0 = p.x; for (let k = 0; k < 60; k++) PROTO.update(.05); return [x0.toFixed(1), p.x.toFixed(1), p.state]; }));
  await H.screenshot({ path: 'rj_host.png' });
  A = await mk('Ana'); await A.click('[data-mtab=join]'); await A.fill('#hcode', code); await A.click('#hjoin');
  for (let i = 0; i < 40; i++) { await A.waitForTimeout(300); if (await A.evaluate(() => HNET.started)) break; }
  await A.waitForTimeout(1500);
  console.log('rejoined', await A.evaluate(() => [HNET.seat, G.phase, G.day, G.players[HNET.seat].role]), 'host away', await H.evaluate(() => JSON.stringify(G.away)));
  await A.screenshot({ path: 'rj_guest.png' });
  console.log('errors', errs.slice(0, 5)); await b.close(); })();
