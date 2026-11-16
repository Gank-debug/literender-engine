const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=3&scenes=off'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.addScriptTag({ path: __dirname + '/hivescene.js' });
  const url = await p.evaluate(() => { try { return MAPS.hive.scene(0, 4).canvas.toDataURL(); } catch (e) { return 'ERR ' + e.stack; } });
  if (url.startsWith('ERR')) console.log(url); else fs.writeFileSync('../shots/hive.png', Buffer.from(url.split(',')[1], 'base64')); console.log(errs); await b.close(); })();
