'use strict';
/* the bigger island: a radius-3 hex continent with headlands pushed out and two bays cut in (43 tiles, two raider camps) */
// five or six lords get a wider island: radius 4, with some of the outer ring trimmed (55 tiles for five, 59 for six)
function makeMap(seed, players) {
  const rnd = mulberry(seed || 11), C = [], big = players > 4, R = big ? 4 : 3;
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (Math.abs(q + r) <= R) C.push([q, r]);
  const add = big ? [] : [[4, -2], [4, -1], [-1, 4], [0, 4], [-4, 1], [-4, 2], [1, -4], [2, -4]], cut = big ? (players > 5 ? ['4,-4', '-4,4'] : ['4,-4', '-4,4', '4,0', '-4,0', '0,4', '0,-4']) : ['3,-3', '-3,3'];
  const coords = C.filter(([q, r]) => !cut.includes(q + ',' + r)).concat(add);
  const key = (q, r) => q + ',' + r, at = {}; coords.forEach((c, i) => at[key(...c)] = i);
  const nb = (q, r) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([a, b]) => at[key(q + a, r + b)]).filter(v => v != null);
  const ring = ([q, r]) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
  const types = new Array(coords.length);
  // two raider camps, inland and apart
  const inner = coords.map((c, i) => i).filter(i => ring(coords[i]) <= 2 && ring(coords[i]) >= 1);
  const d1 = inner[(rnd() * inner.length) | 0]; let d2; do { d2 = inner[(rnd() * inner.length) | 0]; } while (hexDist({ q: coords[d1][0], r: coords[d1][1] }, { q: coords[d2][0], r: coords[d2][1] }) < 3);
  types[d1] = types[d2] = 'desert';
  const bag = [], KINDS = ['forest', 'pasture', 'field', 'hill', 'mountain']; for (let k = 0; k < coords.length - 2; k++) bag.push(KINDS[k % 5]);
  for (let i = bag.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [bag[i], bag[j]] = [bag[j], bag[i]]; }
  let b = 0; for (let i = 0; i < coords.length; i++) if (!types[i]) types[i] = bag[b++];
  const base = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12], extra = [3, 4, 9, 10, 11, 5]; const nums = []; for (let k = 0; nums.length < coords.length - 2; k++) nums.push(k < base.length * Math.floor((coords.length - 2) / base.length) ? base[k % base.length] : extra[(k - base.length * Math.floor((coords.length - 2) / base.length)) % extra.length]);
  for (let i = nums.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [nums[i], nums[j]] = [nums[j], nums[i]]; }
  const num = new Array(coords.length).fill(0); let n = 0; for (let i = 0; i < coords.length; i++) if (types[i] !== 'desert') num[i] = nums[n++];
  // no two red numbers side by side
  const red = v => v === 6 || v === 8;
  for (let pass = 0; pass < 200; pass++) { let bad = -1; for (let i = 0; i < coords.length; i++) if (red(num[i]) && nb(...coords[i]).some(j => red(num[j]))) { bad = i; break; } if (bad < 0) break;
    const ok = coords.map((c, i) => i).filter(i => num[i] && !red(num[i]) && !nb(...coords[i]).some(j => red(num[j]) && j !== bad)); const j = ok[(rnd() * ok.length) | 0]; [num[bad], num[j]] = [num[j], num[bad]]; }
  return coords.map(([q, r], i) => ({ q, r, type: types[i], num: num[i] }));
}
