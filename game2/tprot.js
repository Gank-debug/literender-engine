const { chromium } = require('playwright'); const fs = require('fs'); const OUT = __dirname + '/night_prot'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 }); await p.waitForTimeout(3000);
  // two quiet-skipped nights to get a kill, then replay that night as a protected one
  const r = await p.evaluate(() => { const P = PROTO, G = P.G; let tries = 0; while (tries++ < 6) { P.simulateNight({ room: 'refect', protect: null, follow: null }); if (G.nightLog.targets.length) break; G.phase = 'night'; }
    const lg = G.nightLog, t = lg.targets[0]; lg.protect = t; lg.dead = []; G.players[t].alive = true; G.bodies = G.bodies.filter(b => b.id !== t); G.phase = 'nightsim'; P.NIGHT.play(); return [t, G.night]; });
  let n = 0; const t0 = Date.now(); while (await p.evaluate(() => PROTO.G.phase) === 'cine' && Date.now() - t0 < 40000) { await p.screenshot({ path: `${OUT}/${String(n++).padStart(4, '0')}.png` }); await p.waitForTimeout(150); }
  console.log('target', r, 'frames', n, 'phase', await p.evaluate(() => PROTO.G.phase), errs); await b.close(); })();
