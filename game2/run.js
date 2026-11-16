const { chromium } = require('playwright'); const fs = require('fs'); const name = process.argv[2];
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log(e.message)); p.on('console', m => console.log(m.text()));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2000); for (const f of ['kit2.js', 'engine.js', name + '.js']) await p.addScriptTag({ path: __dirname + '/' + f });
  const url = await p.evaluate(() => SCENE().toDataURL()); fs.writeFileSync(__dirname + '/art_' + name + '.png', Buffer.from(url.split(',')[1], 'base64')); await b.close(); })();
