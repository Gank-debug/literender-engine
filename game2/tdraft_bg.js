const { chromium } = require('playwright'); const fs = require('fs');
const tag = process.argv[2] || 'a';
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  const u = await p.evaluate(() => { const V = PROTO.VIEW, c = document.createElement('canvas'); c.width = V.W; c.height = V.H; const x = c.getContext('2d'); const id = x.createImageData(V.W, V.H); id.data.set(V.frames[0]); x.putImageData(id, 0, 0); const k=document.createElement('canvas');k.width=V.W*2;k.height=V.H*2;const g=k.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,V.W*2,V.H*2);return k.toDataURL(); });
  fs.writeFileSync(`../shots/${tag}_bg.png`, Buffer.from(u.split(',')[1], 'base64')); await b.close(); })();
