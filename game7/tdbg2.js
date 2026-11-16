const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/crown7.html`); await p.waitForTimeout(5000); await p.click('#shhollow'); await p.waitForTimeout(8000);
  console.log(await p.evaluate(() => { const f = document.getElementById('hollowf'); if (!f) return 'no iframe'; const r = f.getBoundingClientRect(); return [r.width, r.height, getComputedStyle(f).display, getComputedStyle(f).zIndex, f.srcdoc.length, document.elementFromPoint(640, 400).tagName]; }));
  const fr = p.frames()[1]; console.log(fr && await fr.evaluate(() => [document.readyState, !!document.getElementById('hmenu'), document.getElementById('load').style.display, innerWidth, innerHeight]));
  console.log(errs.slice(0, 5)); await b.close(); })();
