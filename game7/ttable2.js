// Through the shelf: the host opens The Hollow Brother and a room; a guest types the HOLLOW code into the shelf's join box.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); await p.goto(`file://${__dirname}/crown7.html`); await p.waitForTimeout(5000); return p; };
  const fr = async p => { for (let i = 0; i < 80; i++) { const f = p.frames().find(x => x !== p.mainFrame()); if (f && await f.evaluate(() => !!window.HNET && document.getElementById('load').style.display === 'none').catch(() => false)) return f; await p.waitForTimeout(500); } };
  const H = await mk('Hugo'), A = await mk('Ana');
  await H.click('#shhollow'); const hf = await fr(H); await hf.click('[data-mtab=host]'); await hf.click('#hopen'); await H.waitForTimeout(800); const code = await hf.evaluate(() => HNET.code); console.log('code', code);
  await A.fill('#shroom', code); await A.click('#shjoin'); const af = await fr(A);
  for (let i = 0; i < 40; i++) { await H.waitForTimeout(400); if (await hf.evaluate(() => HNET.lobby.length) >= 2) break; }
  console.log('lobby', await hf.evaluate(() => HNET.lobby.map(x => x.name)), 'guest sees', await af.evaluate(() => [HNET.guest, HNET.lobby.length]));
  await hf.click('#hstart'); await H.waitForTimeout(2500); console.log('guest started', await af.evaluate(() => [HNET.started, HGAME.getLocal()]));
  await A.screenshot({ path: 'tt2_guest.png' }); console.log(errs.slice(0, 4)); await b.close(); })();
