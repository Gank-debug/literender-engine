const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } }); p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2500);
  const url = await p.evaluate(() => { const leaf = o => { if (!o || typeof o !== 'object') return null; if (o.img) return o; for (const k in o) { const r = leaf(o[k]); if (r) return r; } return null; }; const W = 460, H = 290, K = 3, c = document.createElement('canvas'); c.width = W * K; c.height = H * K; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(K, K);
    let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.fillStyle = '#dfe7ef'; g.fillRect(0, 0, W, H); for (let i = 0; i < 2600; i++) { g.fillStyle = ['#eef3f8', '#cfd9e4', '#f8fbfd', '#c3cfdc'][(R() * 4) | 0]; g.fillRect((R() * W) | 0, (R() * H) | 0, 1 + (R() * 2 | 0), 1); }
    // trodden paths between rooms
    const rooms = [['Refectory', 'longhouse', 110, 110], ['Chapel', 'keep', 230, 128], ['Bell Tower', 'tower', 345, 112], ['Larder', 'store', 78, 180], ['Cloister', 'fire', 228, 186], ['Scriptorium', 'stonehut', 372, 190], ['Infirmary', 'cottage', 150, 252], ['Gatehouse', 'mudhut', 300, 256]];
    g.strokeStyle = '#b9a98c'; g.lineWidth = 5; g.lineCap = 'round'; for (const r of rooms) if (r[0] !== 'Cloister') { g.beginPath(); g.moveTo(228, 188); g.lineTo(r[2], r[3]); g.stroke(); } g.strokeStyle = '#a39274'; g.lineWidth = 1; g.setLineDash([2, 3]); for (const r of rooms) if (r[0] !== 'Cloister') { g.beginPath(); g.moveTo(228, 188); g.lineTo(r[2], r[3]); g.stroke(); } g.setLineDash([]);
    const D = (sp, x, y, k = 1) => { if (sp && sp.img) g.drawImage(sp.img, Math.round(x + sp.ox * k), Math.round(y + sp.oy * k), sp.w * k, sp.h * k); };
    const items = [];
    for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283, x = 230 + Math.cos(a) * 215 + R() * 10, y = 160 + Math.sin(a) * 128 + R() * 8; if (y > 225 && x > 90 && x < 350) continue; items.push([y, () => D(SPRITES.tree[[2, 3, 6, 7, 8][(R() * 5) | 0] % SPRITES.tree.length], x, y)]); }
    const bl = k => SPRITES3.bld.find(b => b.k === k && b.p === 'red') || SPRITES.bld.find(b => b.k === k) || SPRITES3.bld.find(b => b.k === k);
    for (const [n, k, x, y] of rooms) items.push([y, () => { D(bl(k), x, y); g.font = '600 7px "Pixelify Sans"'; g.textAlign = 'center'; const w = g.measureText(n).width + 6; g.fillStyle = 'rgba(20,24,34,.8)'; g.fillRect(Math.round(x - w / 2), y + 5, Math.round(w), 10); g.fillStyle = '#f2e6c8'; g.fillText(n, x, y + 12.5); }]);
    const who = [['red', 210, 198], ['gold', 246, 200], ['violet', 96, 190], ['blue', 252, 140], ['green', 322, 264]];
    for (const [c2, x, y] of who) items.push([y + 1, () => D(leaf(FOLK[c2]), x, y)]);
    items.sort((a, b) => a[0] - b[0]).forEach(i => i[1]());
    for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect((R() * W) | 0, (R() * H) | 0, 1, 1); }
    g.fillStyle = 'rgba(40,60,110,.16)'; g.fillRect(0, 0, W, H);
    return c.toDataURL(); });
  fs.writeFileSync('art_civ.png', Buffer.from(url.split(',')[1], 'base64')); await b.close(); })();
