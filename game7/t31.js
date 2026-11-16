const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500);
  const out = await p.evaluate(async () => {
    const res = {};
    // 1. raw pairs straight from the game's RNG, many seeds
    const raw = Array(13).fill(0); let N = 0; for (let s = 1; s <= 200; s++) { G.rs = (s * 2654435761) | 0; for (let i = 0; i < 5000; i++) { raw[d6() + d6()]++; N++; } } res.raw = [raw, N];
    // 2. rolls as they happen in real AI games (battles and AI draw from the same RNG between rolls)
    const real = Array(13).fill(0), firsts = Array(7).fill(0); let R = 0, games = 0;
    const orig = rollDice; for (const seed of [11, 222, 3333, 44444, 555, 6060, 707, 8888, 99, 1234, 4321, 2468]) { startGame(seed, ['red']); await new Promise(r => setTimeout(r, 1300)); UI.toast = () => {}; lord('red').human = false; CQ.q = []; games++;
      while (G.phase === 'setup') { const L = curL(); if (G.setup.step === 'charter') { pickCharter(L, aiCharter(L)); continue; } setupVillage(L, aiSetupVillage(L)); setupRoad(L, aiSetupRoad(L)); }
      let n = 0; while (!checkWin() && n < 1200) { if (n) nextLord(); const L = curL(); n++; if (!L.alive) continue; const r = rollDice(); real[r]++; R++; firsts[G.dice[0]]++; if (r === 7) moveRobber(L, aiRobber(L)); aiCards(L); aiBuild(L); const be = aiBatterSpot(L); if (be) batterAI(L, be); const ch = aiDeed(L); if (ch.kind === 'attack') { const D = defenders(ch.v); applyBattle(L, { v: ch.v, D }, skRun({ A: attackerSide(L), D }), ch.M.prev.get(ch.v)); } else if (ch.kind === 'move') L.army.v = ch.v; } }
    res.real = [real, R, games]; res.firsts = firsts; return res; });
  const exp = n => (6 - Math.abs(7 - n)) / 36;
  for (const [k, [h, N]] of [['raw', out.raw], ['real', out.real]]) { let chi = 0; console.log(`\n${k}: ${N} rolls`); for (let n = 2; n <= 12; n++) { const e = exp(n) * N; chi += (h[n] - e) ** 2 / e; console.log(String(n).padStart(2), (h[n] / N * 100).toFixed(2).padStart(6) + '%', 'expected', (exp(n) * 100).toFixed(2).padStart(6) + '%'); } console.log('chi-square', chi.toFixed(1), '(10 d.f.; above 18.3 would be suspicious at 5%)'); }
  console.log('first die faces', out.firsts.slice(1)); console.log('ERR', errs); await b.close(); })();
