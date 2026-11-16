const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500);
  // can every lord keep to the old ways?
  await p.evaluate(() => startGame(3, ['red'])); await p.waitForTimeout(1200);
  console.log('old ways x4', await p.evaluate(() => { for (const L of G.lords) pickCharter(L, 'none'); return [G.setup.step, G.lords.map(L => L.charter).join(',')]; }));
  const V = { off: "SHEP_MODE='off'", three: "SHEP_MODE='three'" };
  for (const [name, code] of Object.entries(V)) { let wins = 0, vps = [], rounds = [];
    for (const seed of [11, 222, 3333, 44444, 555, 6060, 707, 8888, 919, 1010, 1111, 1212, 1313, 1414, 1515, 1616, 17, 18, 19, 20, 21, 22, 23, 24]) { await p.evaluate(seed => startGame(seed, ['red']), seed); await p.waitForTimeout(900);
      if (code !== 'NOSHEP') await p.evaluate(code); else await p.evaluate("SHEP_MODE='now'");
      const r = await p.evaluate(([seed, noshep]) => { UI.toast = () => {}; lord('red').human = false; CQ.q = [];
        while (G.phase === 'setup') { const L = curL(); if (G.setup.step === 'charter') { pickCharter(L, L.id === ['red', 'blue', 'gold', 'violet'][seed % 4] && !noshep ? 'shepherd' : 'none'); continue; } setupVillage(L, aiSetupVillage(L)); setupRoad(L, aiSetupRoad(L)); }
        let n = 0; while (!checkWin() && n < 1600) { if (n) nextLord(); const L = curL(); n++; if (!L.alive) continue; const r = rollDice(); if (r === 7) moveRobber(L, aiRobber(L)); aiCards(L); aiBuild(L); const be = aiBatterSpot(L); if (be) batterAI(L, be); const ch = aiDeed(L); if (ch.kind === 'attack') { const D = defenders(ch.v); applyBattle(L, { v: ch.v, D }, skRun({ A: attackerSide(L), D }), ch.M.prev.get(ch.v)); } else if (ch.kind === 'move') L.army.v = ch.v; }
        const sh = G.lords.find(L => L.id === ['red', 'blue', 'gold', 'violet'][seed % 4]); return [G.winner === sh.id, vp(sh.id), Math.max(...G.lords.filter(L => L !== sh).map(L => vp(L.id))), G.round]; }, [seed, code === 'NOSHEP']);
      if (r[0]) wins++; vps.push(r[1]); rounds.push(r[3]); }
    console.log(name.padEnd(6), 'shepherd wins', wins + '/' + vps.length, 'avg shepherd pts', (vps.reduce((a, b) => a + b) / vps.length).toFixed(1), 'avg rounds', (rounds.reduce((a, b) => a + b) / vps.length).toFixed(1)); }
  console.log('ERR', errs.slice(0, 3)); await b.close(); })();
