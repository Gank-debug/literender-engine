const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
  const H = await ctx.newPage(), J = await ctx.newPage(); const errs = [];
  for (const [n, p] of [['H', H], ['J', J]]) { p.on('pageerror', e => errs.push(n + ' ' + e.message + ' ' + (e.stack||'').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push(n + ' ' + m.text()); }); }
  const url = 'file://' + __dirname + '/crown7.html'; await H.goto(url); await J.goto(url); await H.waitForTimeout(3000);
  await H.evaluate(() => { LOBBY.seats.green = 'ai'; LOBBY.seats.white = 'ai'; netLocalHost(['blue']); }); await J.evaluate(() => netLocalJoin('blue')); await H.waitForTimeout(500);
  await H.screenshot({ path: 'n0.png' });
  await H.click('#lstart'); await H.waitForTimeout(500); await H.click('#lstart').catch(() => {}); await H.waitForTimeout(3500);
  const step = async (p) => p.evaluate(() => { if (G.lords && G.setup && G.setup.step === 'charter' && charterWho()) { send({ type: 'charter', k: 'none', by: charterWho().id }); return 'c'; } if (!myTurn()) return 'wait'; const L = me();
    if (G.phase === 'setup' && G.setup.step === 'charter') { send({ type: 'charter', k: 'none' }); return 'setup'; } else if (G.phase === 'setup') { if (G.setup.step === 'village') { const v = G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0]; send({ type: 'setupV', v: v.id }); } else send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id }); return 'setup'; }
    if (G.phase === 'roll') { send({ type: 'roll' }); return 'roll'; }
    if (G.phase === 'robber') { send({ type: 'robber', tile: G.tiles.find(t => t.num && t.i !== G.robber).i, victim: null }); return 'rob'; }
    if (!L._acted) { L._acted = G.round; const e = G.edges.filter(e => canRoad(L.id, e))[0]; if (e && canPay(L, COST.road)) send({ type: 'build', k: 'road', id: e.id }); const M = marchMap(L); const t = M.targets[0]; if (t != null && !L.deed) { send({ type: 'march', v: t }); return 'attack'; } return 'build'; }
    L._acted = 0; send({ type: 'end' }); return 'end'; });
  const battle = async (p) => { const btn = await p.$('#btac [data-o="press"]'); if (btn) { await btn.click(); return true; } return false; };
  let log = [];
  for (let i = 0; i < 260; i++) { await H.waitForTimeout(300);
    for (const p of [H, J]) { await battle(p); const r = await step(p); if (r !== 'wait') log.push((p === H ? 'H:' : 'J:') + r); }
    const round = await H.evaluate(() => G.round); if (round === 3 && !global.forced) { global.forced = 1; await J.evaluate(() => { G.lords[2].res.ore += 5; }); } if (round >= 6) break; }
  await H.waitForTimeout(3000);
  const toasts = await J.evaluate(() => G.log.map(l => l.html).filter(h => /Catching|Back in/.test(h)).length + ' ' + document.getElementById('toasts').innerText.includes('step')); console.log('resync', toasts); const hs = await Promise.all([H, J].map(p => p.evaluate(() => [CQ.done, stateHash(), G.round, G.lords.map(L => vp(L.id)).join('/'), meId()])));
  console.log(hs); console.log(log.slice(-12).join(' '), log.length);
  await H.screenshot({ path: 'n1.png' }); await J.screenshot({ path: 'n2.png' });
  console.log('ERR', errs.slice(0, 8)); await b.close();
})();
