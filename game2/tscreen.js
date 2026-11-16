// Big screen + phones: the host plays no brother; three phones join and play.
const { chromium, devices } = require('playwright');
const URL = `file://${__dirname}/hollow_brother_proto.html`, OUT = process.env.OUT || '../shots'; const W8 = async p => p.waitForFunction(() => document.getElementById('load').style.display === 'none' && HGAME.mapKey() === (localStorage.getItem('hollow-map') || 'monastery'), null, { timeout: 90000 });
(async () => { const b = await chromium.launch(); const errs = [];
  const mk = async (n, phone) => { const c = await b.newContext(phone ? { ...devices['iPhone 13'] } : { viewport: { width: 1920, height: 1080 } }); await c.addInitScript(nm => { window.CROWN_RELAYS = ['ws://localhost:7777']; try { localStorage.setItem('crown-name', nm.split('|')[0]); localStorage.setItem('hollow-scenes', '1'); localStorage.setItem('hollow-size', '8'); localStorage.setItem('hollow-map', nm.split('|')[1] || 'monastery'); } catch (e) {} }, n + '|' + (process.env.MAP || 'monastery')); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ' console: ' + m.text()); });
    await p.goto(URL); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && document.getElementById('hmenu'), null, { timeout: 120000 }); return p; };
  const S = await mk('Screen', false); const P = [await mk('Maria', true), await mk('Tom', true), await mk('Ivo', true)]; for (const x of [S, ...P]) await W8(x);
  await S.click('[data-mtab=host]'); await S.click('[data-screen="1"]'); await S.click('#hopen'); await S.waitForTimeout(500); const code = await S.evaluate(() => HNET.code);
  for (const p of P) { await p.click('[data-mtab=join]'); await p.fill('#hcode', code); await p.click('#hjoin'); }
  for (let i = 0; i < 40; i++) { await S.waitForTimeout(300); if (await S.evaluate(() => HNET.lobby.length) >= 4) break; }
  await S.screenshot({ path: OUT + '/scr_lobby.png' }); await P[0].screenshot({ path: OUT + '/ph_lobby.png' });
  await S.evaluate(() => document.getElementById('hstart').click()); await S.waitForTimeout(3000);
  console.log('screen humans', await S.evaluate(() => JSON.stringify(PROTO.G.humans)), 'you', await S.evaluate(() => PROTO.G.you));
  await S.screenshot({ path: OUT + '/scr_intro.png' }); await P[0].screenshot({ path: OUT + '/ph_intro.png' });
  console.log('pad classes', await Promise.all(P.map(p => p.evaluate(() => document.body.className))));
  for (const p of P) await p.evaluate(() => document.querySelector('#modal [data-go="night"]')?.click()); await S.waitForTimeout(1500);
  await S.screenshot({ path: OUT + '/scr_compline.png' }); await P[1].screenshot({ path: OUT + '/ph_compline.png' });
  const choose = p => p.evaluate(() => { for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-frame]', '[data-hush]', '[data-turn]', '[data-kill]', '[data-watch]', '[data-listen]', '[data-bite]']) { const e = document.querySelector('#modal ' + s); if (e) e.click(); } document.querySelector('#modal [data-go="sleep"]')?.click(); });
  for (const p of P) await choose(p); await S.waitForTimeout(1500); for (const p of P) await choose(p);
  await S.waitForFunction(() => PROTO.NIGHT.on(), null, { timeout: 20000 }).catch(() => console.log('screen: no scene')); await S.waitForTimeout(4000); await S.screenshot({ path: OUT + '/scr_scene.png' });
  await P[0].waitForTimeout(500); await P[0].screenshot({ path: OUT + '/ph_scene.png' });
  for (const p of P) await p.evaluate(() => PROTO.NIGHT.skip());
  await P[0].waitForFunction(() => /Dawn/.test(document.getElementById('modal').innerText), null, { timeout: 30000 }).catch(() => console.log('phone: no dawn'));
  await P[0].screenshot({ path: OUT + '/ph_dawn.png' });
  await S.waitForFunction(() => !PROTO.NIGHT.on(), null, { timeout: 60000 }); await S.waitForTimeout(600); await S.screenshot({ path: OUT + '/scr_dawn.png' });
  for (const p of P) await p.evaluate(() => document.querySelector('#modal [data-go="day"]')?.click());
  await S.waitForFunction(() => PROTO.G.phase === 'day', null, { timeout: 20000 }).catch(() => console.log('no day')); await S.waitForTimeout(1200);
  // the d-pad: hold right for a second
  const me = await P[0].evaluate(() => PROTO.G.you); const x0 = await S.evaluate(i => [PROTO.G.players[i].x, PROTO.G.players[i].y], me);
  const box = await P[0].locator('#dpad').boundingBox(); await P[0].mouse.move(box.x + box.width * .92, box.y + box.height / 2); await P[0].mouse.down(); await P[0].waitForTimeout(1200);
  await P[0].screenshot({ path: OUT + '/ph_hands.png' }); await P[0].mouse.up(); await S.waitForTimeout(300);
  const x1 = await S.evaluate(i => [PROTO.G.players[i].x, PROTO.G.players[i].y], me); console.log('d-pad moved brother', me, x0.map(v => v.toFixed(2)), '->', x1.map(v => v.toFixed(2)));
  await S.waitForTimeout(2500); console.log('stopped after release', JSON.stringify(x1) === JSON.stringify(await S.evaluate(i => [PROTO.G.players[i].x, PROTO.G.players[i].y], me)) || 'still moving?');
  await S.screenshot({ path: OUT + '/scr_day.png' });
  for (const [t, f] of [['case', 'ph_case'], ['bro', 'ph_bro'], ['table', 'ph_table'], ['role', 'ph_role']]) { await P[0].click(`#padbar [data-pt=${t}]`); await P[0].waitForTimeout(300); await P[0].screenshot({ path: `${OUT}/${f}.png` }); }
  await P[0].click('#padbar [data-pt=hands]');
  for (const p of P) await p.evaluate(() => document.querySelector('#acts [data-act="dusk"]')?.click());
  await S.waitForFunction(() => PROTO.G.phase === 'dusk', null, { timeout: 20000 }).catch(() => console.log('no dusk'));
  await S.waitForFunction(() => !PROTO.NIGHT.on(), null, { timeout: 30000 }); await S.waitForTimeout(800);
  // everyone names the first other living brother of player 0's list
  const tgt = await S.evaluate(() => PROTO.living().find(p => !PROTO.G.humans.includes(p.id)).id);
  for (const p of P) await p.evaluate(t => document.querySelector(`#modal [data-nom="${t}"]`)?.click(), tgt); await S.waitForTimeout(600);
  await S.screenshot({ path: OUT + '/scr_nom.png' }); await P[1].screenshot({ path: OUT + '/ph_nom.png' });
  for (const p of P) await p.evaluate(() => document.querySelector('#modal [data-go="tally"]')?.click()); await S.waitForTimeout(1200);
  await P[1].screenshot({ path: OUT + '/ph_trial.png' });
  await P[0].evaluate(() => document.querySelector('#modal [data-vote="1"]')?.click()); await S.waitForTimeout(600); await S.screenshot({ path: OUT + '/scr_trial.png' });
  for (const p of P) await p.evaluate(() => document.querySelector('#modal [data-vote="1"]')?.click()); await S.waitForTimeout(800);
  for (const p of P) await p.evaluate(() => document.querySelector('#modal [data-go="next"]')?.click()); await S.waitForTimeout(6000);
  await S.screenshot({ path: OUT + '/scr_result.png' }); console.log('result', await S.evaluate(() => JSON.stringify(PROTO.G.hearing && PROTO.G.hearing.result)));
  // jump to the end
  await S.waitForFunction(() => !PROTO.NIGHT.on(), null, { timeout: 60000 }); await S.screenshot({ path: OUT + '/scr_after.png' }); await S.evaluate(() => { const G = PROTO.G; G.over = 'good'; G.phase = 'over'; HGAME.renderAll(); }); await S.waitForTimeout(500); await S.screenshot({ path: OUT + '/scr_end.png' });
  console.log(errs.slice(0, 10)); await b.close(); process.exit(0); })();
