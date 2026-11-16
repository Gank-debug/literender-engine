const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now(); await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 60000 }); console.log('loaded in', Date.now() - t0, 'ms');
  await p.screenshot({ path: __dirname + '/pt_0intro.png' });
  const click = async sel => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); else throw new Error('no ' + s); }, sel); await p.waitForTimeout(150); };
  await click('[data-go="night"]');
  // pick a target if the role needs one
  await p.evaluate(() => { const a = document.querySelector('[data-protect],[data-follow]'); if (a) a.click(); });
  await p.waitForTimeout(100); await p.screenshot({ path: __dirname + '/pt_1night.png' });
  await click('[data-go="sleep"]'); await p.waitForTimeout(400); await p.screenshot({ path: __dirname + '/pt_2dawn.png' });
  await click('[data-go="day"]'); await p.waitForTimeout(3500);
  // walk towards the nearest glint
  await p.evaluate(() => { const G = PROTO.G, me = PROTO.you(), s = G.spots.filter(s => !s.searched).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; me.path = PROTO.findPath(me.x, me.y, s.x, s.y); });
  await p.waitForTimeout(6000); await p.screenshot({ path: __dirname + '/pt_3day.png' });
  await p.keyboard.press('e'); await p.waitForTimeout(3600); await p.screenshot({ path: __dirname + '/pt_4found.png' });
  await p.evaluate(() => { const c = document.querySelector('[data-share]'); if (c) c.click(); });
  await p.waitForTimeout(12000); await p.screenshot({ path: __dirname + '/pt_5later.png' });
  console.log(await p.evaluate(() => JSON.stringify({ day: PROTO.G.day, phase: PROTO.G.phase, clock: PROTO.G.clock, alive: PROTO.living().length, spots: PROTO.G.spots.length, searched: PROTO.G.spots.filter(s => s.searched).length, chat: PROTO.G.chat.length, roles: PROTO.G.players.map(p => p.short + ':' + p.role).join(' ') })));
  await click('[data-act="dusk"]'); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/pt_6hearing.png' });
  // play several days through quickly
  for (let d = 0; d < 6; d++) { const st = await p.evaluate(async () => { const G = PROTO.G; const q = s => document.querySelector(s);
      if (G.phase === 'over') return 'over:' + G.over; if (G.phase === 'dusk') { if (q('[data-go="vote"]')) q('[data-go="vote"]').click(); for (let k = 0; k < 6; k++) { const v = q('[data-vote="0"]'); if (v) v.click(); const n = q('[data-go="next"]'); if (n) n.click(); } const nf = q('[data-go="night"]'); if (nf) nf.click(); }
      if (G.phase === 'night') { const a = q('[data-protect],[data-follow]'); if (a) a.click(); const s = q('[data-go="sleep"]'); if (s) s.click(); }
      if (G.phase === 'dawn') { q('[data-go="day"]').click(); }
      return G.phase + ' day ' + G.day + ' alive ' + PROTO.living().length + ' clock ' + G.clock; }); console.log(st); if (st.startsWith('over')) break; await p.waitForTimeout(2500);
    await p.evaluate(() => { if (PROTO.G.phase === 'day') PROTO.startHearing(); }); await p.waitForTimeout(200); }
  await p.screenshot({ path: __dirname + '/pt_7end.png' });
  console.log('errors', errs.slice(0, 10)); await b.close(); })();
