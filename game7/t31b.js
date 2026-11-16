function mk(s) { let rs = s | 0; return () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const exp = n => (6 - Math.abs(7 - n)) / 36;
function test(name, gen) { const h = Array(13).fill(0); let N = 0; gen((a, b) => { h[a + b]++; N++; }); let chi = 0; for (let n = 2; n <= 12; n++) { const e = exp(n) * N; chi += (h[n] - e) ** 2 / e; } console.log(name.padEnd(36), 'N', N, '7s', (h[7] / N * 100).toFixed(3) + '%', 'chi', chi.toFixed(1)); }
for (let rep = 0; rep < 3; rep++) test('one stream, 10M, seed ' + rep, f => { const r = mk(rep * 99991 + 7); const d = () => 1 + ((r() * 6) | 0); for (let i = 0; i < 1e7; i++) f(d(), d()); });
test('200 game seeds x 5000 (as before)', f => { for (let s = 1; s <= 200; s++) { const r = mk((s * 2654435761) | 0); const d = () => 1 + ((r() * 6) | 0); for (let i = 0; i < 5000; i++) f(d(), d()); } });
test('2000 game seeds x 5000', f => { for (let s = 1; s <= 2000; s++) { const r = mk((s * 2654435761) | 0); const d = () => 1 + ((r() * 6) | 0); for (let i = 0; i < 5000; i++) f(d(), d()); } });
test('Math.random reference, 10M', f => { const d = () => 1 + ((Math.random() * 6) | 0); for (let i = 0; i < 1e7; i++) f(d(), d()); });
