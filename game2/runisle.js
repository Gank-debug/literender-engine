const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log(e.message)); p.on('console', m => console.log(m.text()));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(1500);
  const trees = JSON.parse(fs.readFileSync(__dirname + '/trees.json'));
  await p.evaluate(async (trees) => { window.TREES = await Promise.all(trees.map(t => new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = t.w; c.height = t.h; const g = c.getContext('2d'); g.drawImage(i, 0, 0); r({ ...t, data: g.getImageData(0, 0, t.w, t.h).data }); }; i.src = t.u; }))); }, trees);
  for (const f of ['kit3.js', 'engine.js', 'isledark.js']) await p.addScriptTag({ path: __dirname + '/' + f });
  for (const m of ['dusk', 'night']) { const u = await p.evaluate(async m => { await document.fonts.ready; return SCENE_ISLE(m).toDataURL(); }, m); fs.writeFileSync(__dirname + '/isle_' + m + '.png', Buffer.from(u.split(',')[1], 'base64')); }
  await b.close(); })();
