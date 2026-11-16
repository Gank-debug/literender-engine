// Render N frames of a scene into fr/<name>_NN.png
const { chromium } = require('playwright'); const fs = require('fs'); const name = process.argv[2], N = +(process.argv[3] || 8), only = process.argv[4];
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log(e.message)); p.on('console', m => console.log(m.text()));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2000); for (const f of ['kit3.js', 'engine.js', name + '.js']) await p.addScriptTag({ path: __dirname + '/' + f });
  fs.mkdirSync(__dirname + '/fr', { recursive: true });
  for (let t = 0; t < N; t++) { if (only != null && t !== +only) continue; const t0 = Date.now(); const url = await p.evaluate(([t, N]) => SCENE(t, N).toDataURL(), [t, N]); fs.writeFileSync(__dirname + '/fr/' + name + '_' + String(t).padStart(2, '0') + '.png', Buffer.from(url.split(',')[1], 'base64')); console.log(name, t, Date.now() - t0, 'ms'); }
  await b.close(); })();
