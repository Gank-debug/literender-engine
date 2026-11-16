const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
  const H = await ctx.newPage(), J = await ctx.newPage(); const errs = [];
  for (const [n, p] of [['H', H], ['J', J]]) { p.on('pageerror', e => errs.push(n + ' ' + e.message + ' ' + (e.stack||'').split('\n')[1])); }
  const url = 'file://' + __dirname + '/crown7.html'; await H.goto(url); await J.goto(url); await H.waitForTimeout(3000);
  await H.evaluate(() => netLocalHost(['blue'])); await J.evaluate(() => netLocalJoin('blue')); await H.waitForTimeout(500);
  await H.click('#lstart'); await H.waitForTimeout(500); await H.click('#lstart').catch(() => {}); await H.waitForTimeout(3500);
  const step = async (p) => p.evaluate(() => { if (G.lords && G.setup && G.setup.step === 'charter' && charterWho()) { send({ type: 'charter', k: 'none', by: charterWho().id }); return 'c'; } if (!myTurn()) return 'wait'; const L = me();
    if (G.phase === 'setup' && G.setup.step === 'charter') { send({ type: 'charter', k: 'none' }); return 'setup'; } else if (G.phase === 'setup') { if (G.setup.step === 'village') { const v = G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0]; send({ type: 'setupV', v: v.id }); } else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return 'setup'; }
    if (G.phase === 'roll') { send({ type: 'roll' }); return 'roll'; }
    if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i, victim: null }); return 'rob'; }
    return 'main'; });
  for (let i = 0; i < 200; i++) { await H.waitForTimeout(300); let r; for (const p of [H, J]) r = await step(p); if (await H.evaluate(() => myTurn() && G.phase === 'main')) break; }
  // the same change on both machines: Red's host stands one step from a Blue village
  const prep = () => { const L = lord('red'), tgt = settlements('blue')[0]; const nb = tgt.adj.find(a => !G.verts[a].owner && !G.lords.some(q => q.army.v === a)); L.army.v = nb; L.at = null; L.army.units = { spear: 4, sword: 2, archer: 2, cata: 0 }; window._t = tgt.id; return [nb, tgt.id]; };
  console.log(await H.evaluate(prep), await J.evaluate(prep));
  await H.evaluate(() => send({ type: 'march', v: _t }));
  let seen = 0;
  for (let i = 0; i < 120; i++) { await H.waitForTimeout(500);
    const hb = await H.$('#btac [data-o="press"]'); if (hb) { await hb.click({ timeout: 2000 }).catch(() => {}); seen |= 1; }
    await H.waitForTimeout(200); const jb = await J.$('#btac [data-o="hold"]'); if (jb) { await jb.click({ timeout: 2000 }).catch(() => {}); seen |= 2; }
    if (i === 8) { await H.screenshot({ path: 'n3.png' }); await J.screenshot({ path: 'n4.png' }); }
    if (await H.evaluate(() => idle() && !UI.scene) && await J.evaluate(() => idle() && !UI.scene) && seen === 3) break; }
  await H.waitForTimeout(1500);
  const hs = await Promise.all([H, J].map(p => p.evaluate(() => [CQ.done, stateHash(), G.verts[_t].owner, JSON.stringify(lord('red').army.units), JSON.stringify(lord('blue').army.units)])));
  console.log(seen, hs);
  console.log('ERR', errs.slice(0, 8)); await b.close();
})();
