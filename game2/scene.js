// Monastery at dusk, composed from Civ Sim's own sprites with a snow pass and warm window light. Everything is drawn at 1x and scaled up 3x.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } }); p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2500);
  const extra = JSON.parse(fs.readFileSync(__dirname + '/../timber.json')).concat(JSON.parse(fs.readFileSync(__dirname + '/../mono.json')));
  const url = await p.evaluate(async (extra) => {
    await Promise.all(extra.map(s => new Promise(r => { const i = new Image(); i.onload = () => { s.img = i; r(); }; i.src = s.u; })));
    const E = k => extra.find(s => s.k === k), leaf = o => { if (!o || typeof o !== 'object') return null; if (o.img) return o; for (const k in o) { const r = leaf(o[k]); if (r) return r; } return null; };
    const W = 520, H = 330, K = 3; let sd = 11; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    // --- snow pass: cap every sprite with snow where it faces the sky
    const snowed = (sp, depth = 3, roof = .0) => { const o = document.createElement('canvas'); o.width = sp.w; o.height = sp.h; const x = o.getContext('2d'); x.drawImage(sp.img, 0, 0); const d = x.getImageData(0, 0, sp.w, sp.h), a = d.data;
      let lumCut = 0, lumCut2 = 0; if (roof < 0) { const ls = []; for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 128) ls.push(a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1); ls.sort((p, q) => p - q); lumCut = ls[(ls.length * .58) | 0]; lumCut2 = ls[(ls.length * .82) | 0]; }
      for (let px = 0; px < sp.w; px++) { let n = 0, dep = depth + ((px * 7919) % 3 === 0 ? 1 : 0) - ((px * 104729) % 5 === 0 ? 1 : 0);
        for (let py = 0; py < sp.h; py++) { const i = (py * sp.w + px) * 4; if (a[i + 3] < 128) { if (n > 0 && n < 99) n = 99; continue; } if (n >= 99) { n = 0; dep = Math.max(1, depth - 1); }   // each overhang gets its own, thinner, cap
          if (n < dep) { const t = n / dep, col = n === 0 ? [255, 255, 255] : t < .6 ? [236, 242, 249] : [196, 210, 228]; a[i] = col[0]; a[i + 1] = col[1]; a[i + 2] = col[2]; }
          else if (roof < 0) { const l = a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1; if (l > lumCut && py < sp.h * .82) { const m = l > lumCut2 ? .9 : .6; a[i] += (236 - a[i]) * m; a[i + 1] += (243 - a[i + 1]) * m; a[i + 2] += (250 - a[i + 2]) * m; } }
          else if (roof && py < sp.h * roof) { const t = py / (sp.h * roof), m = t < .45 ? .8 : t < .75 ? (((px + py) % 2 === 0) ? .75 : .45) : ((px + py) % 2 === 0 ? .4 : .1); a[i] += (232 - a[i]) * m; a[i + 1] += (240 - a[i + 1]) * m; a[i + 2] += (250 - a[i + 2]) * m; }
          n++; } }
      x.putImageData(d, 0, 0); return o; };
    const D = (img, sp, x, y) => g.drawImage(img, Math.round(x + sp.ox), Math.round(y + sp.oy));
    // --- ground: snow, drifts, trodden yard and paths
    g.fillStyle = '#dbe5f0'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5200; i++) { const x = (R() * W) | 0, y = (R() * H) | 0; g.fillStyle = ['#edf3f9', '#cbd8e8', '#f7fafd', '#c0cee0', '#e4ecf5'][(R() * 5) | 0]; g.fillRect(x, y, 1 + (R() * 3 | 0), 1); }
    for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H, w = 18 + R() * 40; g.fillStyle = 'rgba(176,194,218,.5)'; for (let k = 0; k < w; k++) if ((k + i) % 2) g.fillRect((x + k) | 0, (y + Math.sin(k / w * 3.14) * 3) | 0, 1, 1); g.fillStyle = '#fbfdff'; g.fillRect(x | 0, (y - 1) | 0, w * .7, 1); }
    const yard = (cx, cy, rx, ry, col, dens) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (d > 1) continue; if (d > .8 && (x + y) % 2) continue; if (R() < dens) { g.fillStyle = col[(R() * col.length) | 0]; g.fillRect(cx + x, cy + y, 1, 1); } } };
    const path = (x0, y0, x1, y1) => { const n = Math.hypot(x1 - x0, y1 - y0); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t + Math.sin(t * 9) * 2, y = y0 + (y1 - y0) * t; for (let k = -3; k <= 3; k++) { if (Math.abs(k) === 3 && i % 2) continue; g.fillStyle = Math.abs(k) > 1 ? '#c2cede' : ['#aab6c6', '#9aa5b6', '#b4a892', '#a39a88'][(R() * 4) | 0]; g.fillRect((x + k) | 0, y | 0, 1, 1); } if (i % 5 === 0) { g.fillStyle = '#7f8798'; g.fillRect((x + (i % 10 ? 1 : -1)) | 0, y | 0, 1, 2); } } };
    const C = [262, 196];
    const ROOMS = [['Chapel', 'moothall', 236, 118], ['Bell Tower', 'keep', 312, 126], ['Refectory', 'warlodge', 104, 150], ['Larder', 'store', 86, 226], ['Scriptorium', 'tablets', 424, 168], ['Infirmary', 'healhouse', 414, 262], ['Gatehouse', 'cottage', 214, 296], ['Cloister', 'well', C[0], C[1]]];
    for (const r of ROOMS) if (r[0] !== 'Cloister' && r[0] !== 'Bell Tower') path(C[0], C[1], r[2], r[3] + 4);
    path(214, 300, 250, 332);
    yard(C[0], C[1] + 2, 46, 20, ['#b9c4d4', '#a9b3c3', '#b4a892', '#c8d2e0'], .85);
    // --- things, back to front
    const items = [], add = (y, f) => items.push([y, f]);
    const shadow = (x, y, w) => { for (let k = -w; k <= w; k++) for (let j = 0; j < 4; j++) if ((k + j) % 2 === 0 && Math.abs(k) < w - j * 2) { g.fillStyle = 'rgba(92,112,150,.55)'; g.fillRect(Math.round(x + k + j * 3), Math.round(y + j - 1), 1, 1); } };
    const pines = [5, 6, 7, 8, 9].map(i => SPRITES.tree[i % SPRITES.tree.length]);
    for (let i = 0; i < 74; i++) { const a = i / 74 * 6.283 + R() * .05, rr = 1 + (i % 3) * .09, x = 262 + Math.cos(a) * 248 * rr, y = 176 + Math.sin(a) * 150 * rr; if (y > 268 && x > 150 && x < 330) continue; if (x < -10 || x > W + 10 || y < 26 || y > H + 30) continue; const sp = pines[(R() * pines.length) | 0]; add(y, () => { shadow(x, y, 9); D(snowed(sp, 3, -1), sp, x, y); }); }
    for (const [x, y] of [[170, 190], [356, 214], [318, 250], [150, 262], [352, 150]]) { const sp = pines[(x + y) % pines.length]; add(y, () => { shadow(x, y, 9); D(snowed(sp, 3, -1), sp, x, y); }); }
    const lights = [];
    for (const [n, k, x, y] of ROOMS) { const sp = E(k); add(y, () => { shadow(x + 4, y, Math.round(sp.w * .42)); D(snowed(sp, k === 'keep' ? 2 : 4, k === 'keep' || k === 'well' ? 0 : .5), sp, x, y); }); lights.push([x, y - (k === 'keep' ? 40 : 8), k === 'keep' ? 26 : k === 'well' ? 0 : 34]); }
    // extras: a brazier in the yard, a shrine, stacked stones, a gate of posts
    const fire = SPRITES3.bld.find(b => b.k === 'fire'); add(C[1] + 9, () => D(fire.img, fire, C[0] - 24, C[1] + 8)); lights.push([C[0] - 24, C[1] + 2, 44]);
    add(232, () => D(snowed(E('shrine'), 2), E('shrine'), 300, 232)); add(238, () => D(snowed(E('rack'), 2), E('rack'), 118, 236)); add(160, () => D(snowed(E('smokehouse:turf'), 4, .8), E('smokehouse:turf'), 40, 196));
    for (const r of SPRITES.rock) for (const [x, y] of [[196, 236], [342, 186]]) add(y, () => D(snowed(r, 2), r, x + (r === SPRITES.rock[0] ? 0 : 12), y));
    const who = [['red', C[0] - 8, C[1] + 12], ['gold', C[0] + 16, C[1] + 14], ['violet', 96, 232], ['blue', 250, 128], ['green', 226, 304]];
    for (const [c2, x, y] of who) { const sp = leaf(FOLK[c2]); add(y + 1, () => { shadow(x, y, 4); D(sp.img, sp, x, y); }); }
    items.sort((a, b) => a[0] - b[0]).forEach(i => i[1]());
    // --- dusk: cool blue over everything, then warm light punched back in at windows and fires (dithered, so it stays pixel art)
    const day = g.getImageData(0, 0, W, H), o = g.getImageData(0, 0, W, H), dd = day.data, od = o.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; let warm = 0; for (const [lx, ly, lr] of lights) { if (!lr) continue; const d = Math.hypot(x - lx, (y - ly) * 1.6) / lr; if (d < 1) warm = Math.max(warm, 1 - d); }
      const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]][y & 3][x & 3] / 16, wq = Math.min(1, Math.floor((warm + bayer * .22) * 5) / 5);
      const vg = 1 - Math.min(1, Math.hypot((x - 262) / 330, (y - 180) / 215)) ** 2.2 * .32, cool = [(dd[i] * .62 + 6) * vg, (dd[i + 1] * .68 + 14) * vg, (dd[i + 2] * .80 + 30) * (vg * .6 + .4)], hot = [Math.min(255, dd[i] * 1.08 + 30), Math.min(255, dd[i + 1] * .92 + 12), dd[i + 2] * .62];
      for (let k = 0; k < 3; k++) od[i + k] = cool[k] + (hot[k] - cool[k]) * wq; }
    g.putImageData(o, 0, 0);
    // lit windows and the lantern in the tower
    const win = (x, y) => { g.fillStyle = '#ffe9a8'; g.fillRect(x, y, 2, 3); g.fillStyle = '#ffb84a'; g.fillRect(x - 1, y + 3, 4, 1); };
    for (const [x, y] of [[214, 110], [232, 112], [250, 114], [84, 142], [110, 144], [410, 160], [400, 254], [424, 256], [202, 284], [226, 286]]) win(x, y); g.fillStyle = '#ffe9a8'; g.fillRect(315, 62, 3, 4); g.fillStyle = '#fff6d8'; g.fillRect(316, 63, 1, 2);
    // chimney smoke and falling snow
    for (const [x, y] of [[262, 44], [226, 246], [118, 108]]) for (let k = 0; k < 16; k++) { g.fillStyle = `rgba(220,228,240,${.5 - k * .028})`; g.fillRect(Math.round(x + Math.sin(k * .6) * 3 + k * .6), y - k * 2, 2 + (k > 6 ? 1 : 0), 1); }
    for (let i = 0; i < 380; i++) { g.fillStyle = R() < .3 ? '#ffffff' : 'rgba(235,242,250,.8)'; g.fillRect((R() * W) | 0, (R() * H) | 0, 1, 1); }
    // scale up, then the room names
    const out = document.createElement('canvas'); out.width = W * K; out.height = H * K; const x2 = out.getContext('2d'); x2.imageSmoothingEnabled = false; x2.drawImage(c, 0, 0, W * K, H * K);
    await document.fonts.ready; x2.font = '600 17px "Pixelify Sans"'; x2.textAlign = 'center'; x2.textBaseline = 'middle';
    for (const [n, k, x, y] of ROOMS) { const w = x2.measureText(n).width + 16, X = x * K, Y = (y + 9) * K + (n === 'Cloister' ? 30 : 0); x2.fillStyle = 'rgba(14,18,30,.82)'; x2.fillRect(Math.round(X - w / 2), Y - 12, Math.round(w), 24); x2.fillStyle = '#e9c46a'; x2.fillRect(Math.round(X - w / 2), Y + 10, Math.round(w), 2); x2.fillStyle = '#f4ecd6'; x2.fillText(n, X, Y); }
    return out.toDataURL(); }, extra);
  fs.writeFileSync('art_monastery.png', Buffer.from(url.split(',')[1], 'base64')); await b.close(); })();
