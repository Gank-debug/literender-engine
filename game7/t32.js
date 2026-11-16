// usage: node t32.js <mode solo|mix> <from> <to>
const { chromium } = require('playwright'); const [mode, A, B] = [process.argv[2], +process.argv[3], +process.argv[4]];
const CH = ['none', 'raider', 'fortress', 'merchant', 'warlord', 'builder', 'shepherd', 'zealot', 'bandit', 'pioneer', 'geomancer', 'guild'], IDS = ['red', 'blue', 'gold', 'violet'];
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); const out = [];
  for (let g = A; g < B; g++) { const seed = 7000 + g * 37; let pick;
    if (mode === 'solo') { const ch = CH[g % CH.length], seat = Math.floor(g / CH.length) % 4; pick = IDS.map((id, i) => i === seat ? ch : 'none'); }
    else { const pool = CH.slice(1); let s = seed; const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; for (let i = pool.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; } pick = pool.slice(0, 4); }
    await p.evaluate(seed => startGame(seed, ['red']), seed); await p.waitForTimeout(700);
    const r = await p.evaluate(pick => { AI_AGGRO = true; UI.toast = () => {}; lord('red').human = false; CQ.q = []; const ids = ['red', 'blue', 'gold', 'violet'];
      while (G.phase === 'setup') { const L = curL(); if (G.setup.step === 'charter') { pickCharter(L, pick[ids.indexOf(L.id)]); continue; } setupVillage(L, aiSetupVillage(L)); setupRoad(L, aiSetupRoad(L)); }
      let n = 0; while (!checkWin() && n < 1600) { if (n) nextLord(); const L = curL(); n++; if (!L.alive) continue; rollDice(); if (G.phase === 'robber') { const B = robberOf(); moveRobber(B, aiRobber(B)); } aiCards(L); if (G.phase === 'robber') moveRobber(L, aiRobber(L)); aiBuild(L); for (let k = 0; k < 3; k++) { const be = aiBatterSpot(L); if (!be) break; batterAI(L, be); } for (let m = 0; m < 2; m++) { if (L.deed || !L.alive) break; const ch = aiDeed(L); if (ch.kind === 'attack') { const D = defenders(ch.v); applyBattle(L, { v: ch.v, D }, skRun({ A: attackerSide(L), D }), ch.M.prev.get(ch.v)); } else if (ch.kind === 'move') { L.army.v = ch.v; pressOn(L, false); } else break; } }
      return { w: G.winner, rd: G.round, tiles: G.tiles.length, deserts: G.tiles.filter(t => t.type === 'desert').length, L: G.lords.map(L => ({ id: L.id, ch: L.charter || 'none', vp: L.alive ? vp(L.id) : 0, alive: L.alive, won: L.won || 0, taken: L.taken || 0, got: L.got || 0, guilded: L.guilded || 0 })) }; }, pick);
    out.push(r); }
  require('fs').writeFileSync(`t32_${mode}_${A}.json`, JSON.stringify(out)); console.log(mode, A, B, 'done', errs.slice(0, 2)); await b.close(); })();
