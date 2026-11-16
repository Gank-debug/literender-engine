const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); }); 
  const shotModal = async (f) => { const r = await p.evaluate(() => { const r = document.getElementById('modal').getBoundingClientRect(); return { x: r.x - 4, y: r.y - 4, width: r.width + 8, height: r.height + 8 }; }); await p.screenshot({ path: f, clip: r }); };
  for (const role of ['bell', 'hush', 'wether']) { await p.evaluate(r => { const G = PROTO.G; G.players[0].role = r; G.night = 2; G.prepick = 4; HGAME.showNight(); }, role); await p.waitForTimeout(200); await shotModal(`cmp_${role}.png`); }
  // the Prior in a trial
  await p.evaluate(() => { const G = PROTO.G; G.players[0].role = 'prior'; G.night = 0; G.phase = 'dusk'; G.day = 1; G.hearing = { stage: 'trial', round: 1, noms: {}, acc: [{ target: 3, by: 2, named: [2, 5], round: 1, votes: { 2: true, 5: true, 6: false } }], cur: 0, result: null }; HGAME.showHearing(); }); await p.waitForTimeout(200); await shotModal('hear_prior.png');
  await p.evaluate(() => document.querySelector('[data-pardon]').click()); await p.waitForTimeout(300); console.log('after pardon', await p.evaluate(() => [PROTO.G.hearing.stage, PROTO.G.hearing.round, PROTO.G.hearing.acc[0].out, PROTO.G.hearing.acc[0].pardon]));
  await shotModal('hear_prior2.png');
  console.log(errs); await b.close(); })();
