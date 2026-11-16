'use strict';
/* the bigger island: a radius-3 hex continent with headlands pushed out and two bays cut in (43 tiles, two raider camps) */
function makeMap(seed) {
  const rnd = mulberry(seed || 11), C = [];
  for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) if (Math.abs(q + r) <= 3) C.push([q, r]);
  const add = [[4, -2], [4, -1], [-1, 4], [0, 4], [-4, 1], [-4, 2], [1, -4], [2, -4]], cut = ['3,-3', '-3,3'];
  const coords = C.filter(([q, r]) => !cut.includes(q + ',' + r)).concat(add);
  const key = (q, r) => q + ',' + r, at = {}; coords.forEach((c, i) => at[key(...c)] = i);
  const nb = (q, r) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => at[key(q + a, r + b)]).filter(v => v != null);
  const ring = ([q, r]) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
  const types = new Array(coords.length);
  // two raider camps, inland and apart
  const inner = coords.map((c, i) => i).filter(i => ring(coords[i]) <= 2 && ring(coords[i]) >= 1);
  const d1 = inner[(rnd() * inner.length) | 0]; let d2; do { d2 = inner[(rnd() * inner.length) | 0]; } while (hexDist({ q: coords[d1][0], r: coords[d1][1] }, { q: coords[d2][0], r: coords[d2][1] }) < 3);
  types[d1] = types[d2] = 'desert';
  const bag = []; for (const [t, n] of [['forest', 9], ['pasture', 8], ['field', 8], ['hill', 8], ['mountain', 8]]) for (let k = 0; k < n; k++) bag.push(t);
  for (let i = bag.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [bag[i], bag[j]] = [bag[j], bag[i]]; }
  let b = 0; for (let i = 0; i < coords.length; i++) if (!types[i]) types[i] = bag[b++];
  const base = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]; const nums = [...base, ...base, 3, 4, 9, 10, 11];
  for (let i = nums.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [nums[i], nums[j]] = [nums[j], nums[i]]; }
  const num = new Array(coords.length).fill(0); let n = 0; for (let i = 0; i < coords.length; i++) if (types[i] !== 'desert') num[i] = nums[n++];
  // no two red numbers side by side
  const red = v => v === 6 || v === 8;
  for (let pass = 0; pass < 200; pass++) { let bad = -1; for (let i = 0; i < coords.length; i++) if (red(num[i]) && nb(...coords[i]).some(j => red(num[j]))) { bad = i; break; } if (bad < 0) break;
    const ok = coords.map((c, i) => i).filter(i => num[i] && !red(num[i]) && !nb(...coords[i]).some(j => red(num[j]) && j !== bad)); const j = ok[(rnd() * ok.length) | 0]; [num[bad], num[j]] = [num[j], num[bad]]; }
  return coords.map(([q, r], i) => ({ q, r, type: types[i], num: num[i] }));
}
