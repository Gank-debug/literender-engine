// Character drafts: before/after, the full cast in eight facings, and one GIF per pose.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2000);
  const old = fs.readFileSync(__dirname + '/kit2.js', 'utf8').replace('window.KIT =', 'window.KIT2 ='); await p.addScriptTag({ content: old }); await p.addScriptTag({ path: __dirname + '/kit3.js' });
  const out = await p.evaluate(async () => { await document.fonts.ready; const K = 3, CW = 50, CH = 70, L = 170, strip = ({ name, ...o }) => o;
    const cell = (g, s, x, y, alt, cw = CW) => { g.fillStyle = alt ? '#302c28' : '#2b2824'; g.fillRect(x, y, cw * K, CH * K); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x + cw * K / 2, y + (CH - 7) * K, 8 * K, 4 * K, 0, 0, 7); g.fill(); g.drawImage(s.canvas, x + (cw / 2 + s.ox) * K, y + (CH - 7 + s.oy) * K, s.w * K, s.h * K); };
    const mk = (rows, cols, cw = CW, head = KIT.DIRS) => { const c = document.createElement('canvas'); c.width = L + cw * K * cols + 12; c.height = 36 + CH * K * rows + 8; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#262320'; g.fillRect(0, 0, c.width, c.height); g.font = '600 18px "Pixelify Sans"'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = '#e9c46a'; head.forEach((d, i) => g.fillText(d, L + i * cw * K + cw * K / 2, 18)); return [c, g]; };
    const label = (g, r, a, bb) => { g.textAlign = 'left'; g.font = '600 15px "Pixelify Sans"'; g.fillStyle = '#f4ecd6'; g.fillText(a, 10, 36 + r * CH * K + CH * K / 2 - 9); g.fillStyle = '#9a917e'; g.fillText(bb, 10, 36 + r * CH * K + CH * K / 2 + 11); };
    // before / after: three characters, old and new, in S, SW and E
    const pick = [['monastery', 0], ['monastery', 3], ['town', 0], ['town', 2], ['port', 1], ['port', 0]], [cb, gb] = mk(2, pick.length * 2, 40, pick.flatMap(() => ['', '']));
    pick.forEach(([set, i], k) => { for (const [r, kit] of [[0, KIT2], [1, KIT]]) { const o = strip((kit === KIT ? KIT.CAST : KIT2.CAST)[set][i]); cell(gb, kit.person(o, 0), L + (k * 2) * 40 * K, 36 + r * CH * K, (k + r) % 2, 40); cell(gb, kit.person(o, 1), L + (k * 2 + 1) * 40 * K, 36 + r * CH * K, (k + r + 1) % 2, 40); } });
    label(gb, 0, 'Before', 'round, stocky'); label(gb, 1, 'After', 'slim, 8 heads');
    const all = Object.entries(KIT.CAST).flatMap(([set, l]) => l.map(o => [set, o])), [c1, g1] = mk(all.length, 8);
    all.forEach(([set, o], r) => { label(g1, r, o.name, set); for (let f = 0; f < 8; f++) cell(g1, KIT.person(strip(o), f), L + f * CW * K, 36 + r * CH * K, (f + r) % 2); });
    const M = KIT.CAST.monastery, T = KIT.CAST.town, P = KIT.CAST.port, G = {};
    const poses = { idle: [[M[0], M[3], T[1], P[3]], 8, t => (t >> 2) % 2], walk: [[M[1], T[0], T[2], P[2]], 8, t => t % 4], work: [[M[1], T[1], P[1], P[2]], 8, t => (t >> 1) % 2], accuse: [[M[2], T[4], P[3]], 8, t => (t >> 2) % 2, 'point'], pray: [[M[4], M[0], T[1], P[4]], 8, t => (t >> 2) % 2], die: [[M[0], T[2], P[2]], 12, t => Math.min(3, t)] };
    for (const [pn, [chars, nf, ff, real]] of Object.entries(poses)) { G[pn] = []; const cw = pn === 'die' ? 66 : CW; for (let t = 0; t < nf; t++) { const [c, g] = mk(chars.length, 8, cw); chars.forEach((o, r) => { label(g, r, o.name, pn); for (let f = 0; f < 8; f++) cell(g, KIT.person(strip(o), f, real || pn, ff(t)), L + f * cw * K, 36 + r * CH * K, (f + r) % 2, cw); }); G[pn].push(c.toDataURL()); } }
    return { ba: cb.toDataURL(), all: c1.toDataURL(), G }; });
  const w = (n, u) => fs.writeFileSync(__dirname + '/' + n, Buffer.from(u.split(',')[1], 'base64')); w('cast_before_after.png', out.ba); w('cast_v3.png', out.all);
  fs.mkdirSync(__dirname + '/fr', { recursive: true }); for (const [pn, fr] of Object.entries(out.G)) fr.forEach((u, i) => w('fr/' + pn + '_' + String(i).padStart(2, '0') + '.png', u)); await b.close(); })();
