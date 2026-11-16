const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 }); await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(() => { window.PF = {}; const wrap = (obj, k, name) => { const f = obj[k]; obj[k] = function () { const t = performance.now(); const r = f.apply(this, arguments); const d = performance.now() - t; const e = PF[name] || (PF[name] = { n: 0, tot: 0, max: 0 }); e.n++; e.tot += d; e.max = Math.max(e.max, d); return r; }; };
    wrap(KIT, 'person', 'person'); wrap(PROTO, 'frame', 'frame'); wrap(PROTO, 'update', 'update'); const lp = window.requestAnimationFrame;
    window.LT = []; new PerformanceObserver(l => { for (const e of l.getEntries()) LT.push(Math.round(e.duration)); }).observe({ entryTypes: ['longtask'] });
    let last = performance.now(); window.FT = []; const tick = () => { const n = performance.now(); FT.push(n - last); last = n; requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  const q = s => p.evaluate(s2 => { const e = document.querySelector(s2); if (e) e.click(); }, s);
  await q('[data-go="night"]'); await p.evaluate(() => { const a = document.querySelector('[data-protect],[data-follow]'); if (a) a.click(); }); await q('[data-go="sleep"]'); await q('[data-go="day"]');
  for (let d = 0; d < 2; d++) {
    await p.waitForTimeout(30000);
    const r = await p.evaluate(() => { const ft = FT.slice().sort((a, b) => b - a); const o = { day: PROTO.G.day, phase: PROTO.G.phase, worst: ft.slice(0, 8).map(Math.round), avg: Math.round(FT.reduce((a, b) => a + b, 0) / FT.length), longtasks: LT.slice(-12), PF: JSON.parse(JSON.stringify(PF)) }; FT.length = 0; LT.length = 0; for (const k in PF) PF[k] = { n: 0, tot: 0, max: 0 }; return o; });
    console.log(JSON.stringify(r));
    await p.evaluate(() => { if (PROTO.G.phase === 'day') PROTO.startHearing(); const q = s => document.querySelector(s); if (q('[data-go="vote"]')) q('[data-go="vote"]').click(); for (let k = 0; k < 8; k++) { const v = q('[data-vote="0"]'); if (v) v.click(); const n = q('[data-go="next"]'); if (n) n.click(); } const nf = q('[data-go="night"]'); if (nf) nf.click(); const a = q('[data-protect],[data-follow]'); if (a) a.click(); const s = q('[data-go="sleep"]'); if (s) s.click(); const dd = q('[data-go="day"]'); if (dd) dd.click(); });
  }
  console.log(errs); await b.close(); })();
