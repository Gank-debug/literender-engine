// Contact sheet: every monk in all eight facings, on a plain dark ground, 4x, no smoothing.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2000); await p.addScriptTag({ path: __dirname + '/kit.js' });
  const url = await p.evaluate(async () => { const K = 4, CW = 40, CH = 62, L = 150, c = document.createElement('canvas'); c.width = L + CW * K * 8 + 16; c.height = 40 + CH * K * KIT.CAST.length + 10; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#262320'; g.fillRect(0, 0, c.width, c.height);
    await document.fonts.ready; g.font = '600 18px "Pixelify Sans"'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = '#e9c46a'; KIT.DIRS.forEach((d, i) => g.fillText(d, L + i * CW * K + CW * K / 2, 20));
    KIT.CAST.forEach((o, r) => { g.textAlign = 'left'; g.fillStyle = '#f4ecd6'; g.font = '600 15px "Pixelify Sans"'; const words = o.name.split(' ('); g.fillText(words[0], 10, 40 + r * CH * K + CH * K / 2 - 8); if (words[1]) { g.fillStyle = '#9a917e'; g.fillText('(' + words[1], 10, 40 + r * CH * K + CH * K / 2 + 12); }
      for (let f = 0; f < 8; f++) { const { name, ...opt } = o, s = KIT.monk(opt, f), x = L + f * CW * K, y = 40 + r * CH * K; g.fillStyle = (f + r) % 2 ? '#302c28' : '#2b2824'; g.fillRect(x, y, CW * K, CH * K); g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(x + CW * K / 2, y + (CH - 6) * K, 9 * K, 4.5 * K, 0, 0, 7); g.fill(); g.drawImage(s.canvas, x + (CW / 2 + s.ox) * K, y + (CH - 6 + s.oy) * K, s.w * K, s.h * K); } });
    return c.toDataURL(); });
  fs.writeFileSync(__dirname + '/monks_turnaround.png', Buffer.from(url.split(',')[1], 'base64')); await b.close(); })();
