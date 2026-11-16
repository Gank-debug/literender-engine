// Random human-ish input against the real rAF loop; reports page errors and stalls.
const { chromium } = require('playwright');
const SEED = process.argv[2] || '5', AS = process.argv[3] || 'good', DUR = +(process.argv[4] || 180);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.stack || e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?as=${AS}&seed=${SEED}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(() => { window.__f = 0; const t = () => { window.__f++; requestAnimationFrame(t); }; requestAnimationFrame(t); });
  const t0 = Date.now(); let lastT = 0, stalls = 0, rng = +SEED; const r = () => (rng = (rng * 9301 + 49297) % 233280) / 233280;
  while (Date.now() - t0 < DUR * 1000) {
    const st = await p.evaluate(() => ({ t: PROTO.G.t, ph: PROTO.G.phase, over: PROTO.G.over, day: PROTO.G.day }));
    if (st.over) { console.log('game over', st.over, 'day', st.day); break; }
    // shorten days so we cover more phases
    await p.evaluate(() => { if (PROTO.G.phase === 'day' && PROTO.G.timer > 40) PROTO.G.timer = 40; });
    const btns = await p.$$('#modal:not([style*="none"]) .btn, #pop .btn, #modal:not([style*="none"]) [data-close]');
    const vis = []; for (const x of btns) if (await x.isVisible()) vis.push(x);
    if (vis.length && r() < .7) { try { await vis[Math.floor(r() * vis.length)].click({ timeout: 500 }); } catch (e) {} }
    else if (r() < .5) { await p.mouse.click(100 + r() * 1080, 80 + r() * 640); }
    else { const k = 'wasd'[Math.floor(r() * 4)]; await p.keyboard.down(k); await p.waitForTimeout(200 + r() * 600); await p.keyboard.up(k); }
    // also random UI buttons outside modals
    if (r() < .1) { const ui = await p.$$('.topbar .btn, #side .btn, [data-sel], [data-clue]'); const u = ui[Math.floor(r() * ui.length)]; if (u && await u.isVisible()) try { await u.click({ timeout: 500 }); } catch (e) {} }
    await p.waitForTimeout(150);
    const s2 = await p.evaluate(() => PROTO.G.t);
    if (s2 === lastT && st.ph === 'day') { stalls++; if (stalls > 6) { console.log('STALL: G.t stuck at', s2, 'phase', st.ph); break; } } else stalls = 0; lastT = s2;
  }
  const fin = await p.evaluate(() => ({ t: PROTO.G.t, ph: PROTO.G.phase, day: PROTO.G.day, f: window.__f }));
  console.log(SEED, AS, JSON.stringify(fin), 'errors:', errs.length, errs.slice(0, 3).join('\n---\n')); await b.close(); })();
