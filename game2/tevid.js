// Exercises the evidence choices: tell / whisper / keep and present at the Hearing; checks the fog edge.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('[data-go="night"]').click(); const q = s => document.querySelector(s); const a = q('[data-protect]'); if (a) a.click(); const f = q('[data-follow]'); if (f) f.click(); q('[data-go="sleep"]').click(); });
  await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('[data-go="day"]').click());
  // walk to the yard edge for the fog check
  await p.evaluate(() => { const P = PROTO, m = P.you(); P.G.headless = true; m.path = P.findPath(m.x, m.y, 30, 26); for (let k = 0; k < 600; k++) P.update(.05); P.G.headless = false; });
  await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/evid_fog.png' });
  // fake-find a real clue pointing at the evil, then open the found card
  const r = await p.evaluate(() => { const P = PROTO, G = P.G, E = G.players.find(q => q.role === 'enemy'); const s = { x: P.you().x, y: P.you().y, clue: { id: 9001, kind: 'print', text: 'Boot prints in the snow, heading for the Scriptorium.', set: [E.id, 3, 4], day: G.day }, searched: false };
    G.spots.push(s); window.__s = s; return E.id; });
  await p.evaluate(() => { PROTO.G.spots.at(-1).searched = false; }); await p.evaluate(() => { const s = PROTO.G.spots.at(-1); s.by = null; });
  await p.evaluate(() => { const fc = window.foundCard || null; }); 
  // the found card is internal; trigger via finishSearch path by doSearch on the spot
  await p.evaluate(() => { const P = PROTO; P.doSearch(); }); await p.evaluate(() => { const P = PROTO; P.G.headless = true; for (let k = 0; k < 200; k++) P.update(.05); P.G.headless = false; });
  await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/evid_card.png' });
  const hasW = await p.$('[data-wlist]'); console.log('whisper button', !!hasW);
  if (hasW) { await hasW.click(); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/evid_whisper.png' }); await p.click('[data-close]'); }
  // go to the hearing and lay the kept clue
  await p.evaluate(() => PROTO.startHearing()); await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/evid_hearing.png' });
  const pres = await p.$('[data-present]'); console.log('present button', !!pres); if (pres) { await pres.click(); await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/evid_presented.png' }); }
  console.log('heard', await p.evaluate(() => PROTO.G.players.map(q => q.heard || 0)), errs); await b.close(); })();
