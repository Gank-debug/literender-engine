const fs = require('fs'), mode = process.argv[2]; const G = fs.readdirSync('.').filter(f => f.startsWith(`t32_${mode}_`)).flatMap(f => JSON.parse(fs.readFileSync(f)));
const S = {}; let rounds = 0, stalls = 0;
for (const g of G) { rounds += g.rd; if (!g.w) stalls++; const top = Math.max(...g.L.map(l => l.vp));
  for (const l of g.L) { if (mode === 'solo' && l.ch === 'none' && g.L.some(x => x.ch !== 'none')) continue; const s = S[l.ch] = S[l.ch] || { n: 0, w: 0, vp: 0, dead: 0, won: 0, taken: 0, got: 0, gap: 0 };
    s.n++; s.w += g.w === l.id ? 1 : 0; s.vp += l.vp; s.dead += l.alive ? 0 : 1; s.won += l.won; s.taken += l.taken; s.got += l.got; } }
console.log(`${mode}: ${G.length} games, avg ${(rounds / G.length).toFixed(1)} rounds, ${stalls} unfinished`);
const fair = mode === 'solo' ? 25 : 25; console.log('charter'.padEnd(14), 'games', 'win%', ' ±', 'avg pts', 'conquered', 'battles won', 'goods/game');
for (const [k, s] of Object.entries(S).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n)) { const p = s.w / s.n; console.log(k.padEnd(14), String(s.n).padStart(5), (p * 100).toFixed(0).padStart(4) + '%', ('±' + (196 * Math.sqrt(p * (1 - p) / s.n)).toFixed(0)).padStart(4), (s.vp / s.n).toFixed(1).padStart(7), ((s.dead / s.n * 100).toFixed(0) + '%').padStart(9), (s.won / s.n).toFixed(1).padStart(11), (s.got / s.n).toFixed(0).padStart(10)); }
