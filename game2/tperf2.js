const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  const r = await p.evaluate(() => { const out = {}; const T = (k, f) => { const t = performance.now(); f(); out[k] = Math.round(performance.now() - t); };
    const q = s => document.querySelector(s);
    q('[data-go="night"]').click(); const a = q('[data-protect],[data-follow]'); if (a) a.click();
    T('night1', () => q('[data-go="sleep"]').click()); q('[data-go="day"]').click();
    T('frame', () => PROTO.frame()); T('update100', () => { for (let i = 0; i < 100; i++) PROTO.update(.016); });
    // a cold sprite: new brother outfit, all faces/poses
    T('sprite_cold_1', () => KIT.person({ robe: [10, 20, 30], col: [1, 2, 3] }, 3, 'walk', 2));
    T('hearing', () => PROTO.startHearing());
    q('[data-go="vote"]') && q('[data-go="vote"]').click(); for (let k = 0; k < 8; k++) { const v = q('[data-vote="0"]'); if (v) v.click(); const n = q('[data-go="next"]'); if (n) n.click(); }
    q('[data-go="night"]') && q('[data-go="night"]').click(); const a2 = q('[data-protect],[data-follow]'); if (a2) a2.click();
    T('night2', () => q('[data-go="sleep"]').click());
    return out; });
  console.log(JSON.stringify(r), errs); await b.close(); })();
