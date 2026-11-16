const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.click('#shplay'); await p.waitForTimeout(2500);
  const s = []; for (let i = 0; i < 6; i++) { s.push(await p.evaluate(() => { const m = /translate3d\(([-\d.]+)px, ?([-\d.]+)px/.exec($('cv').style.transform); return [UI.cam.x - +m[1], UI.cam.y - +m[2]].map(v => v.toFixed(2)).join(' '); })); await p.waitForTimeout(120); } console.log(s.join(' | '));
  await p.click('#lgo'); await p.waitForTimeout(3000); console.log(await p.evaluate(() => [$('cv').style.transform, UI.demo]), errs); await b.close(); })();
