const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2000);
  const t = await p.evaluate(() => SPRITES.tree.slice(5, 10).map(s => { const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; c.getContext('2d').drawImage(s.img, 0, 0); return { w: s.w, h: s.h, ox: s.ox, oy: s.oy, u: c.toDataURL() }; }));
  fs.writeFileSync(__dirname + '/trees.json', JSON.stringify(t)); console.log(t.length, t.map(x => x.w + 'x' + x.h)); await b.close(); })();
