const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=3&scenes=off'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.addScriptTag({ path: __dirname + '/towndraft.js' }); await p.addScriptTag({ path: __dirname + '/towndraft_layouts.js' }); await p.evaluate(t => window.__TC = t, +(process.env.TC || 0));
  for (const k of (process.argv[2]==='town'?['town']:null) ||  (process.argv[2] || 'td0,tdA,tdB,tdC').split(',')) {
    const url = await p.evaluate(k => { try { const r = MAPS[k].scene(0, 4); return r.canvas.toDataURL(); } catch (e) { return 'ERR ' + e.stack; } }, k);
    if (url.startsWith('ERR')) console.log(k, url); else fs.writeFileSync(`../shots/${k}.png`, Buffer.from(url.split(',')[1], 'base64')); }
  console.log(errs); await b.close(); })();
