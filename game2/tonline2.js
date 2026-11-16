// Host + two guests over a local test relay, driven by clicks on each screen. Checks phases agree, roles stay hidden, chat and walking arrive.
const { chromium } = require('playwright');
const URL = `file://${__dirname}/hollow_brother_proto.html`, DAYS = +(process.argv[2] || 3);
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); localStorage.setItem('hollow-scenes', '1'); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ' console: ' + m.text().slice(0, 300)); });
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 90000 }); p.nm = n; return p; };
  const H = await mk('Hugo'), A = await mk('Ana'), B = await mk('Ben'), all = [H, A, B];
  await H.click('[data-mtab=host]'); await H.click('#hopen'); await H.waitForTimeout(500); const code = await H.evaluate(() => HNET.code);
  for (const p of [A, B]) { await p.click('[data-mtab=join]'); await p.fill('#hcode', code); await p.click('#hjoin'); }
  for (let i = 0; i < 40; i++) { await H.waitForTimeout(300); if (await H.evaluate(() => HNET.lobby.length) >= 3) break; }
  await H.screenshot({ path: 'on_lobby_host.png' }); await A.screenshot({ path: 'on_lobby_guest.png' });
  await H.click('#hstart'); await H.waitForTimeout(2000);
  const roles = await Promise.all(all.map(p => p.evaluate(() => [HGAME.getLocal(), G.players[HGAME.getLocal()].role, G.players.filter(q => q.role !== 'unknown').map(q => q.id)])));
  console.log('seats/roles/known', JSON.stringify(roles)); await A.screenshot({ path: 'on_intro_guest.png' });
  const js = (p, sel) => p.evaluate(sel => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent); if (!e) return false; e.click(); return true; }, sel);
  const jsAll = async sel => { const r = []; for (const p of all) r.push(await js(p, sel)); return r; };
  const until = async (f, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await H.waitForTimeout(250); } return false; };
  const hph = () => H.evaluate(() => [G.phase, G.day, G.over]);
  await jsAll('#modal [data-go="night"]');
  for (let day = 0; day < DAYS; day++) {
    await until(async () => (await hph())[0] === 'night'); await H.waitForTimeout(400);
    for (const p of all) await p.evaluate(() => { const q = s => [...document.querySelectorAll(s)].find(e => e.offsetParent); for (const s of ['#modal [data-kill]', '#modal [data-protect]', '#modal [data-follow]']) { const e = q(s); if (e) e.click(); } });
    await H.waitForTimeout(700); console.log('sleep', await jsAll('#modal [data-go="sleep"]'));
    await H.waitForTimeout(1200); await A.screenshot({ path: `on_n${day}_guest.png` });
    const ok = await until(async () => { for (const p of all) await p.keyboard.press('Space'); const ph = await Promise.all(all.map(p => p.evaluate(() => G.phase))); return ph.every(x => x === 'dawn' || x === 'over'); }, 40000);
    console.log('dawn', day + 1, ok, await hph(), 'targets', await H.evaluate(() => JSON.stringify(G.nightLog.targets)));
    if ((await hph())[2]) break;
    await A.screenshot({ path: `on_dawn${day}_guest.png` });
    await jsAll('#modal [data-go="day"]'); await until(async () => (await hph())[0] === 'day');
    await H.waitForTimeout(800); await A.mouse.click(700, 520); await B.mouse.click(520, 400); await A.keyboard.down('d'); await A.waitForTimeout(900); await A.keyboard.up('d');
    await A.evaluate(() => { const i = document.querySelector('#chat input'); i.focus(); i.value = 'Ana here: I slept in the dormitory.'; }); await A.keyboard.press('Enter');
    await H.waitForTimeout(1500);
    console.log('positions agree', JSON.stringify(await Promise.all(all.map(p => p.evaluate(() => G.players.slice(0, 3).map(q => [+q.x.toFixed(1), +q.y.toFixed(1)]))))));
    await A.screenshot({ path: `on_d${day}_guest.png` }); await H.screenshot({ path: `on_d${day}_host.png` });
    console.log('dusk clicks', await jsAll('#acts [data-act="dusk"]')); await until(async () => (await hph())[0] === 'dusk', 8000);
    await H.waitForTimeout(800); await B.screenshot({ path: `on_h${day}_guest.png` });
    for (let k = 0; k < 8; k++) { await H.waitForTimeout(700); await jsAll('#modal [data-nom="-1"]'); await jsAll('#modal [data-go="tally"]'); await H.waitForTimeout(700); await jsAll('#modal [data-vote="0"]'); await H.waitForTimeout(700); await jsAll('#modal [data-go="next"]'); if (await H.evaluate(() => !!(G.hearing && G.hearing.result))) break; }
    console.log('hearing', await H.evaluate(() => JSON.stringify(G.hearing.result)), await B.evaluate(() => JSON.stringify(G.hearing && G.hearing.result)));
    await H.waitForTimeout(800); if ((await hph())[2]) break;
    await jsAll('#modal [data-go="night"]'); }
  console.log('guest B chat tail:', await B.evaluate(() => G.chat.slice(-2).map(c => c.text).join(' | ')));
  console.log('B casebook entries', await B.evaluate(() => (G.cases[HGAME.getLocal()] || []).length), 'roles visible to B', await B.evaluate(() => G.players.map(p => p.role === 'unknown' ? '?' : p.role.slice(0, 3)).join(' ')));
  console.log('errors', errs.slice(0, 8)); await b.close(); })();
