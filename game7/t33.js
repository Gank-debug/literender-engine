const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => startGame(515, ['red'])); await p.waitForTimeout(1800);
  console.log(await p.evaluate(() => { UI.toast = () => {}; lord('red').human = false; CQ.q = []; const pick = { red: 'geomancer', blue: 'bandit', gold: 'pioneer', violet: 'guild' };
    while (G.phase === 'setup') { const L = curL(); if (G.setup.step === 'charter') { pickCharter(L, pick[L.id]); continue; } setupVillage(L, aiSetupVillage(L)); setupRoad(L, aiSetupRoad(L)); }
    const t0 = G.tiles.length, v0 = G.verts.length; let n = 0, sevens = 0, banditRobs = 0;
    while (!checkWin() && n < 1200) { if (n) nextLord(); const L = curL(); n++; if (!L.alive) continue; rollDice(); if (G.phase === 'robber') { sevens++; const B = robberOf(); if (chOf(B) === 'bandit') banditRobs++; moveRobber(B, aiRobber(B)); } aiCards(L); if (G.phase === 'robber') moveRobber(L, aiRobber(L)); aiBuild(L); for (let m = 0; m < 2; m++) { if (L.deed) break; const ch = aiDeed(L); if (ch.kind === 'attack') { const D = defenders(ch.v); applyBattle(L, { v: ch.v, D }, skRun({ A: attackerSide(L), D }), ch.M.prev.get(ch.v)); } else if (ch.kind === 'move') { L.army.v = ch.v; pressOn(L); } else break; } }
    const s = JSON.stringify(snapshot()); const h1 = stateHash(); loadSnapshot(JSON.parse(s)); const h2 = stateHash();
    return JSON.stringify({ round: G.round, winner: G.winner, tiles: [t0, G.tiles.length], verts: [v0, G.verts.length], deserts: G.tiles.filter(t => t.type === 'desert').length, sevens, banditRobs, guild: lord('violet').guilded || 0, pioneerRoad: G.lh.road, gold: settlements('gold').length, vps: G.lords.map(L => [L.id, vp(L.id)]), hashSame: h1 === h2, banditWalls: wallsOf('blue').length }); }));
  await p.evaluate(() => { isleChanged(); hud(); fit(); UI.cam.z = 1; UI.camGoal = null; centerOn(G.world.CX, G.world.CY); }); await p.waitForTimeout(800); await p.screenshot({ path: 'o_geo_isle.png' });
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
