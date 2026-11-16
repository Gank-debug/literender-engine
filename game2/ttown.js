const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=3&scenes=off'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  const t0 = Date.now(); const url = await p.evaluate(() => { const r = MAPS.town.scene(0, 4); const c = document.createElement('canvas'); c.width = r.canvas.width * 2; c.height = r.canvas.height * 2; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(r.canvas, 0, 0, c.width, c.height); return c.toDataURL(); });
  console.log('ms', Date.now() - t0); fs.writeFileSync('../shots/town_scene.png', Buffer.from(url.split(',')[1], 'base64')); console.log(errs); await b.close(); })();
