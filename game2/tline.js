// All ten brothers side by side (one seed), and the one look everyone wears at night
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  const u = await p.evaluate(() => { const G = PROTO.G, Z = 3, c = document.createElement('canvas'), W = 130; c.width = W * 11 + 20; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#15100c'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
    g.font = '15px "Pixelify Sans"'; g.textAlign = 'center';
    const all = [...G.players.map(q => [q.short, q.o, `${q.habit}${q.o.hood ? ' · hood' : ''}`]), ['at night', { ...G.players[1].o, prop: undefined, robe: [30, 28, 34], col: [30, 28, 34], hood: 1, ht: 1, w: 1, boot: [30, 26, 24], beard: 0 }, 'everyone else']];
    all.forEach(([nm, o, sub], i) => { const s = KIT.person({ ...o, big: 2 }, 1, 'idle', 0), x = 10 + i * W + W / 2; g.drawImage(s.canvas, Math.round(x - s.w * 1.5 / 2), 250 - s.h * 1.5, s.w * 1.5, s.h * 1.5); g.fillStyle = i === 10 ? '#e07a64' : '#e8d8b0'; g.fillText(nm, x, 272); g.fillStyle = '#8a7a5c'; g.fillText(sub, x, 290); });
    return c.toDataURL(); });
  fs.writeFileSync('/mnt/user-data/outputs/brothers_lineup.png', Buffer.from(u.split(',')[1], 'base64')); console.log(errs); await b.close(); })();
