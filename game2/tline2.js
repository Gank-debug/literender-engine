// Lineup: the brothers now (top) and with more variety (bottom), same seed, same evidence traits
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const errs = []; const rows = [];
  for (const q of ['', '&look=varied']) { const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off${q}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
    rows.push(await p.evaluate(() => { const G = PROTO.G, c = document.createElement('canvas'), W = 120; c.width = W * 10 + 20; c.height = 320; const g = c.getContext('2d'); g.fillStyle = '#15100c'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false; g.font = '15px "Pixelify Sans"'; g.textAlign = 'center';
      G.players.forEach((q, i) => { const s = KIT.person({ ...q.o, big: 2 }, 1, 'idle', 0), x = 10 + i * W + W / 2; g.drawImage(s.canvas, Math.round(x - s.w * 1.5 / 2), 262 - s.h * 1.5, s.w * 1.5, s.h * 1.5); g.fillStyle = '#e8d8b0'; g.fillText(q.short, x, 284); g.fillStyle = '#8a7a5c'; g.fillText(`${q.habit} · ${q.tall ? 'tall' : 'short'}`, x, 302); });
      return c.toDataURL(); })); await p.close(); }
  rows.forEach((u, i) => fs.writeFileSync(`line_${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); console.log(errs); await b.close(); })();
