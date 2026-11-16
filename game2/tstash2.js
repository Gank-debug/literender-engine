// online: a phone guest uses the stash on the town map
const { chromium, devices } = require('playwright');
const URL = `file://${__dirname}/hollow_brother_proto.html`;
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n, phone) => { const c = await b.newContext(phone ? { ...devices['iPhone 13'] } : { viewport: { width: 1600, height: 900 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); localStorage.setItem('hollow-scenes', '0'); localStorage.setItem('hollow-map', 'town'); localStorage.setItem('hollow-size', '6'); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu') && HGAME.mapKey() === 'town', null, { timeout: 120000 }); return p; };
  const S = await mk('Host', false), A = await mk('Ana', true);
  await S.click('[data-mtab=host]'); await S.click('#hopen'); await S.waitForTimeout(500); const code = await S.evaluate(() => HNET.code);
  await A.click('[data-mtab=join]'); await A.fill('#hcode', code); await A.click('#hjoin');
  for (let i = 0; i < 40; i++) { await S.waitForTimeout(300); if (await S.evaluate(() => HNET.lobby.length) >= 2) break; }
  await S.evaluate(() => document.getElementById('hstart').click()); await S.waitForTimeout(3000);
  for (const p of [S, A]) await p.evaluate(() => document.querySelector('#modal [data-go="night"]')?.click()); await S.waitForTimeout(1200);
  const choose = p => p.evaluate(() => { for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-bite]']) document.querySelector('#modal ' + s)?.click(); });
  for (const p of [S, A]) await choose(p); await S.waitForTimeout(1200); for (const p of [S, A]) await p.evaluate(() => document.querySelector('#modal [data-go="sleep"]')?.click());
  await S.waitForFunction(() => PROTO.G.phase === 'dawn', null, { timeout: 20000 }); await S.waitForTimeout(800);
  for (const p of [S, A]) await p.evaluate(() => document.querySelector('#modal [data-go="day"]')?.click()); await S.waitForFunction(() => PROTO.G.phase === 'day', null, { timeout: 20000 });
  await S.evaluate(() => { const g = PROTO.G.players[1]; g.x = 24.3; g.y = 23.2; g.pack = { timber: 2, rope: 1 }; }); await A.waitForTimeout(1500);
  await A.evaluate(() => document.querySelector('[data-ptgo="case"]')?.click()); await A.waitForTimeout(600);
  await A.evaluate(() => document.querySelector('#case [data-stash="dep"]')?.click()); await A.waitForTimeout(1500);
  await A.screenshot({ path: '../shots/stash_phone.png' });
  console.log('host stash', await S.evaluate(() => JSON.stringify(PROTO.G.town.stash) + ' ' + PROTO.G.town.log.slice(-2).map(l => l.t).join(' / ')));
  console.log('guest sees', await A.evaluate(() => document.body.dataset.ptab + ' ' + document.getElementById('case').innerText.slice(0, 200).replace(/\n/g, ' | ')));
  console.log(errs); await b.close(); process.exit(0); })();
