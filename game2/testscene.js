const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log(e.message)); p.on('console', m => console.log(m.text()));
  await p.setContent('<html><body></body></html>');
  const trees = JSON.parse(fs.readFileSync(__dirname + '/trees.json'));
  await p.evaluate(async (trees) => { window.TREES = await Promise.all(trees.map(t => new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = t.w; c.height = t.h; const g = c.getContext('2d'); g.drawImage(i, 0, 0); r({ ...t, data: g.getImageData(0, 0, t.w, t.h).data }); }; i.src = t.u; }))); }, trees);
  for (const f of ['kit3.js', 'engine.js', 'protoscene.js']) await p.addScriptTag({ path: __dirname + '/' + f });
  const u = await p.evaluate(() => { const t0 = performance.now(); const r = SCENE_P(0, 4); console.log('ms', performance.now() - t0); const o = document.createElement('canvas'); o.width = r.canvas.width * 2; o.height = r.canvas.height * 2; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(r.canvas, 0, 0, o.width, o.height); return o.toDataURL(); });
  fs.writeFileSync(__dirname + '/proto_scene.png', Buffer.from(u.split(',')[1], 'base64')); await b.close(); })();
