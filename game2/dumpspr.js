// node dumpspr.js '<js expression returning [{name, s}] using KIT and PROTO>' out.json
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  const r = await p.evaluate(src => { const list = eval(src); return list.map(({ name, s }) => { const k = document.createElement('canvas'); k.width = s.w; k.height = s.h; k.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(s.data), s.w, s.h), 0, 0); return { name, url: k.toDataURL(), ox: s.ox, oy: s.oy }; }); }, process.argv[2]);
  fs.writeFileSync(process.argv[3], JSON.stringify(r)); console.log(r.length, 'sprites', errs); await b.close(); })();
