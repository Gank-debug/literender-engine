// Host + two guests over a local test relay: lobby, start, nights, days, the hearing; checks hidden roles and that everyone agrees.
const { chromium } = require('playwright'); const fs = require('fs');
const URL = `file://${__dirname}/hollow_brother_proto.html`;
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm); localStorage.setItem('hollow-scenes', '1'); } catch (e) {} }, n); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ' console: ' + m.text()); });
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU && document.getElementById('hmenu'), null, { timeout: 90000 }); return p; };
  const H = await mk('Hugo'), A = await mk('Ana'), B = await mk('Ben'), all = [H, A, B];
  await H.click('[data-mtab=host]'); await H.click('#hopen'); await H.waitForTimeout(500); const code = await H.evaluate(() => HNET.code); console.log('room', code);
  for (const p of [A, B]) { await p.click('[data-mtab=join]'); await p.fill('#hcode', code); await p.click('#hjoin'); }
  for (let i = 0; i < 40; i++) { await H.waitForTimeout(300); if (await H.evaluate(() => HNET.lobby.length) >= 3) break; }
  console.log('lobby', await H.evaluate(() => HNET.lobby.map(x => x.name))); await H.screenshot({ path: 'on_lobby_host.png' }); await A.screenshot({ path: 'on_lobby_guest.png' });
  await H.click('#hstart'); await H.waitForTimeout(2500);
  console.log('seats', await Promise.all(all.map(p => p.evaluate(() => [HGAME.getLocal(), G.players[HGAME.getLocal()].role, G.players.filter(q => q.role !== 'unknown').length]))));
  await A.screenshot({ path: 'on_intro_guest.png' });
  const clickAll = async sel => { for (const p of all) { const e = await p.$(sel); if (e && await e.isVisible()) try { await e.click({ timeout: 800 }); } catch (x) {} } };
  const phase = p => p.evaluate(() => G.phase);
  await clickAll('#modal [data-go="night"]'); await H.waitForTimeout(800);
  for (let day = 0; day < 3; day++) {
    // night: everyone picks and snuffs the candle
    for (let k = 0; k < 3; k++) { for (const p of all) await p.evaluate(() => { const q = s => [...document.querySelectorAll(s)].filter(e => e.offsetParent); const k = q('#modal [data-kill]'); if (k.length) k[0].click(); const pr = q('#modal [data-protect]'); if (pr.length) pr[0].click(); const f = q('#modal [data-follow]'); if (f.length) f[0].click(); }); await H.waitForTimeout(400); }
    console.log('pre-sleep', await H.evaluate(() => JSON.stringify({ ready: G.ready, nc: G.nightChoices, ph: G.phase })), await Promise.all(all.map(p => p.evaluate(() => document.getElementById('modal').innerText.slice(-40).replace(/\n/g, ' ')))));
    await clickAll('#modal [data-go="sleep"]'); await H.waitForTimeout(1500);
    await A.screenshot({ path: `on_n${day}_guest.png` });
    for (let i = 0; i < 20; i++) { for (const p of all) await p.keyboard.press('Space'); await H.waitForTimeout(500); if ((await Promise.all(all.map(phase))).every(x => x === 'dawn' || x === 'over')) break; }
    console.log('dawn', day, await Promise.all(all.map(phase)));
    if (await H.evaluate(() => G.over)) break;
    await clickAll('#modal [data-go="day"]'); await H.waitForTimeout(1200);
    console.log('day', await Promise.all(all.map(p => p.evaluate(() => [G.phase, G.day, Math.round(G.timer)]))));
    // the guests walk and search; Ana says something
    await A.mouse.click(640, 520); await B.mouse.click(500, 380); await A.keyboard.down('d'); await A.waitForTimeout(900); await A.keyboard.up('d');
    await A.click('#chatin').catch(() => {}); await A.evaluate(() => { const i = document.querySelector('#chat input'); if (i) { i.focus(); i.value = 'Ana here. I slept in the dormitory.'; } }); await A.keyboard.press('Enter');
    await H.waitForTimeout(1500);
    const pos = await Promise.all(all.map(p => p.evaluate(() => G.players.slice(0, 3).map(q => [q.x.toFixed(1), q.y.toFixed(1)]).join(' '))));
    console.log('positions', pos); await A.screenshot({ path: `on_d${day}_guest.png` });
    console.log('acts', await Promise.all(all.map(p => p.evaluate(() => [document.getElementById('acts').innerHTML.slice(0, 300), getComputedStyle(document.getElementById('acts')).display, document.body.className]))));
    try { await H.click('#acts [data-act="dusk"]', { timeout: 3000 }); } catch (e) { console.log('CLICKERR', e.message.split('\n').filter(l => /intercept/.test(l)).slice(0, 2)); }
    for (const p of all) console.log('jsclick', await p.evaluate(() => { const e = document.querySelector('#acts [data-act="dusk"]'); if (!e) return 'none'; e.click(); return [G.phase, JSON.stringify(G.rang)]; }));
    await H.waitForTimeout(1500); console.log('rang', await H.evaluate(() => JSON.stringify(G.rang)));
    console.log('dusk', await Promise.all(all.map(phase)));
    await H.screenshot({ path: `on_h${day}_host.png` }); await B.screenshot({ path: `on_h${day}_guest.png` });
    await clickAll('#modal [data-go="vote"]'); await H.waitForTimeout(1000);
    for (let k = 0; k < 4; k++) { await clickAll('#modal [data-vote="0"]'); await H.waitForTimeout(600); await clickAll('#modal [data-go="next"]'); await H.waitForTimeout(800); }
    console.log('result', await H.evaluate(() => JSON.stringify(G.hearing.result)), await A.evaluate(() => JSON.stringify(G.hearing && G.hearing.result)));
    await clickAll('#modal [data-go="night"]'); await H.waitForTimeout(1200);
    if (await H.evaluate(() => G.over)) break; }
  console.log('chat on guest B:', await B.evaluate(() => G.chat.slice(-3).map(c => c.text).join(' | ')));
  console.log('B casebook', await B.evaluate(() => (G.cases[HGAME.getLocal()] || []).length), 'roles B sees', await B.evaluate(() => G.players.map(p => p.role[0]).join('')));
  console.log('errors', errs.slice(0, 8)); await b.close(); })();
