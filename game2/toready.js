// Online: the host's hanging plays on the guest too, and the guest then gets the result
const { chromium } = require('playwright');
const URL = `file://${__dirname}/hollow_brother_proto.html`;
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 1280, height: 720 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); localStorage.setItem('hollow-scenes', '0'); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 90000 }); return p; };
  const H = await mk('Hugo'), A = await mk('Ana');
  await H.click('[data-mtab=host]'); await H.click('#hopen'); await H.waitForTimeout(500); const code = await H.evaluate(() => HNET.code);
  await A.click('[data-mtab=join]'); await A.fill('#hcode', code); await A.click('#hjoin');
  for (let i = 0; i < 40; i++) { await H.waitForTimeout(300); if (await H.evaluate(() => HNET.lobby.length) >= 2) break; }
  await H.click('#hstart'); await H.waitForTimeout(2500);
  await H.evaluate(() => { PROTO.G.phase = 'dusk'; PROTO.G.day = 1; PROTO.G.hearing = { acc: [], cur: -1 }; }); await H.waitForTimeout(300);
  await H.evaluate(() => { const G = PROTO.G; const v = G.players.find(q => q.id > 1 && PROTO.team(q) === 'good'); const votes = {}; G.players.forEach(q => votes[q.id] = true); G.hearing.acc = [{ target: v.id, by: 0, votes, named: [0], round: 1, out: 'hanged' }]; PROTO.finishHearing(); });
  await H.waitForTimeout(1500); console.log('pre', await H.evaluate(() => JSON.stringify([PROTO.G.humans, PROTO.G.away, PROTO.G.ready, PROTO.G.phase, document.querySelector('#modal .row').innerText]))); await H.evaluate(() => document.querySelector('#modal [data-go="night"]').click()); await H.waitForTimeout(1500);
  console.log('host:', await H.evaluate(() => document.querySelector('#modal .row').innerText)); console.log('guest:', await A.evaluate(() => document.querySelector('#modal .row').innerText));
  await A.evaluate(() => document.querySelector('#modal [data-go="night"]').click()); await A.waitForTimeout(1500); console.log('after both:', await H.evaluate(() => PROTO.G.phase), await A.evaluate(() => document.querySelector('#modal .hd').innerText));
  console.log(errs); await b.close(); process.exit(0); })();
