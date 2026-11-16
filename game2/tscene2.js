// Online with scenes: the guest skips his scene at once and must see Dawn straight away, while the host is still watching his.
const { chromium } = require('playwright');
const URL = `file://${__dirname}/hollow_brother_proto.html`;
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 1280, height: 720 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); localStorage.setItem('hollow-scenes', '1'); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 90000 }); return p; };
  const H = await mk('Hugo'), A = await mk('Ana');
  await H.click('[data-mtab=host]'); await H.evaluate(() => { HMENU.scenes = true; }); await H.click('#hopen'); await H.waitForTimeout(500); const code = await H.evaluate(() => HNET.code);
  await A.click('[data-mtab=join]'); await A.fill('#hcode', code); await A.click('#hjoin');
  for (let i = 0; i < 40; i++) { await H.waitForTimeout(300); if (await H.evaluate(() => HNET.lobby.length) >= 2) break; }
  await H.evaluate(() => document.getElementById('hstart').click()); await H.waitForTimeout(2500);
  const night = async p => p.evaluate(() => { const q = s => document.querySelector(s); q('#modal [data-go="night"]')?.click(); });
  await night(H); await night(A); await H.waitForTimeout(1200);
  const choose = p => p.evaluate(() => { for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-frame]', '[data-hush]', '[data-turn]', '[data-kill]']) { const e = document.querySelector('#modal ' + s); if (e) e.click(); } document.querySelector('#modal [data-go="sleep"]')?.click(); });
  await choose(H); await choose(A);
  await A.waitForFunction(() => PROTO.NIGHT.on(), null, { timeout: 20000 }); await A.waitForTimeout(1500); await A.keyboard.press('Space'); const t0 = Date.now();
  await A.waitForFunction(() => !PROTO.NIGHT.on() && getComputedStyle(document.getElementById('modal')).display === 'block' && /Dawn/.test(document.getElementById('modal').innerText), null, { timeout: 40000 }).catch(() => {});
  console.log('guest saw Dawn after', Date.now() - t0, 'ms; host still in scene:', await H.evaluate(() => PROTO.NIGHT.on()), 'host phase', await H.evaluate(() => PROTO.G.phase));
  console.log('guest modal:', (await A.evaluate(() => document.getElementById('modal').innerText)).slice(0, 80).replace(/\n/g, ' '));
  await A.evaluate(() => document.querySelector('#modal [data-go="day"]')?.click()); await A.waitForTimeout(800);
  console.log('guest after Begin:', (await A.evaluate(() => document.getElementById('modal').innerText)).slice(0, 80).replace(/\n/g, ' '));
  await H.waitForFunction(() => !PROTO.NIGHT.on(), null, { timeout: 60000 }); await H.waitForTimeout(500);
  console.log('host after scene:', (await H.evaluate(() => document.getElementById('modal').innerText)).slice(0, 80).replace(/\n/g, ' '));
  await H.evaluate(() => document.querySelector('#modal [data-go="day"]')?.click()); await H.waitForTimeout(1500);
  const pos = async () => A.evaluate(() => PROTO.G.players.map(q => q.x.toFixed(1)).join()); const p0 = await pos(); await A.waitForTimeout(8000);
  console.log('day: phases', await H.evaluate(() => PROTO.G.phase), await A.evaluate(() => PROTO.G.phase), 'guest sees brothers moving', p0 !== await pos());
  console.log(errs); await b.close(); process.exit(0); })();
