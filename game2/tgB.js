// Illuminated marks in the popup + the whisper button, online with two players
const { chromium } = require('playwright');
const URL = `file://${__dirname}/hollow_brother_proto.html`;
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); localStorage.setItem('hollow-scenes', '0'); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 90000 }); return p; };
  const H = await mk('Hugo'), A = await mk('Ana');
  await H.click('[data-mtab=host]'); await H.click('#hopen'); await H.waitForTimeout(500); const code = await H.evaluate(() => HNET.code);
  await A.click('[data-mtab=join]'); await A.fill('#hcode', code); await A.click('#hjoin');
  for (let i = 0; i < 40; i++) { await H.waitForTimeout(300); if (await H.evaluate(() => HNET.lobby.length) >= 2) break; }
  await H.click('#hstart'); await H.waitForTimeout(2500);
  for (const p of [H, A]) await p.evaluate(() => { const q = document.querySelector('#modal [data-go]'); if (q) q.click(); });
  await H.waitForTimeout(500);
  const hs = await H.evaluate(() => HGAME.getLocal());
  await A.evaluate(s => document.querySelector(`#bro [data-b="${s}"]`).click(), hs); await A.waitForTimeout(400);
  await A.evaluate(() => [...document.querySelectorAll('#pop .gB .g')][1].click()); await A.waitForTimeout(1200);
  await A.evaluate(s => document.querySelector(`#bro [data-b="${s}"]`).click(), hs); await A.waitForTimeout(400);
  console.log('A marks', await A.evaluate(s => PROTO.G.players[s].mark, hs), 'row whisper', await A.evaluate(() => document.querySelectorAll('#bro [data-wsp]').length), 'pop whisper', await A.evaluate(() => !!document.querySelector('#pop [data-wsp]')));
  await A.screenshot({ path: 'gB_online.png' });
  console.log(errs); await b.close(); process.exit(0); })();
