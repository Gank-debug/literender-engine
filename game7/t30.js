const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs=[]; p.on('pageerror', e => errs.push(e.message + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500);
  // 1. a whole game, then the end screen
  await p.evaluate(() => startGame(3333, ['red'], null, null, { win: 20, names: { red: 'Mira' } })); await p.waitForTimeout(1800);
  console.log(await p.evaluate(() => { UI.toast = () => {}; CQ.q = []; 
    while (G.phase === 'setup') { const L = curL(); if (G.setup.step === 'charter') { pickCharter(L, aiCharter(L)); continue; } setupVillage(L, aiSetupVillage(L)); setupRoad(L, aiSetupRoad(L)); }
    let n = 0; while (!checkWin() && n < 1200) { if (n) nextLord(); const L = curL(); n++; if (!L.alive) continue; const r = rollDice(); if (r === 7) moveRobber(L, aiRobber(L)); aiCards(L); aiBuild(L); const be = aiBatterSpot(L); if (be) batterAI(L, be); const ch = aiDeed(L); if (ch.kind === 'attack') { const D = defenders(ch.v); applyBattle(L, { v: ch.v, D }, skRun({ A: attackerSide(L), D }), ch.M.prev.get(ch.v)); } else if (ch.kind === 'move') L.army.v = ch.v; }
    landChanged(); hud(); const s = JSON.stringify(snapshot()); loadSnapshot(JSON.parse(s)); checkWinUI(); return [G.round, G.winner, G.lords.map(L => vp(L.id)), G.st.ev.length, Object.values(G.st.h).map(a => a.length)].join(' '); }));
  await p.waitForTimeout(900); await p.screenshot({ path: 'o_end.png' });
  await p.setViewportSize({ width: 420, height: 800 }); await p.waitForTimeout(400); await p.screenshot({ path: 'o_end_m.png' }); await p.setViewportSize({ width: 1440, height: 860 });
  await p.click('#watch'); await p.evaluate(() => { fit(); UI.cam.z = 1; UI.camGoal = null; centerOn(G.world.CX - 80, G.world.CY); }); await p.waitForTimeout(600); await p.screenshot({ path: 'o_tokens.png' });
  // rematch
  await p.evaluate(() => { UI.shownWin = null; checkWinUI(); }); await p.click('#rematch'); await p.waitForTimeout(3000); console.log('rematch', await p.evaluate(() => [G.round, G.phase, G.winner, G.names.red, G.win, G.st.ev.length].join(' ')));
  // 2. battle cards
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  await p.evaluate(() => { CQ.q = []; ffwd(); $('toasts').innerHTML = ''; act('trade'); const L = me(); L.deed = false; L.cards.push('rally'); Object.assign(L.army.units, { spear: 4, sword: 2, archer: 2 }); const v = G.verts.find(v => v.owner && v.owner !== 'red' && !ringed(v)); L.army.v = v.adj.find(a => !G.verts[a].owner); L.at = null; send({ type: 'march', v: v.id }); });
  await p.waitForTimeout(3500); await p.screenshot({ path: 'o_b1.png' }); await p.click('[data-o="press"]'); await p.waitForTimeout(400);
  for (let i = 0; i < 40; i++) { if (await p.$('[data-o="hold"]')) break; await p.waitForTimeout(500); } await p.screenshot({ path: 'o_b2.png' });
  console.log('ERR', errs.slice(0, 5)); await b.close(); })();
