// Real-time nights with scenes on: log every stall over 150 ms (with the phase it happened in) and how long each phase lasts
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto(`file://${__dirname}/hollow_brother_proto.html`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { window.STALL = []; let last = performance.now(); const f = () => { const n = performance.now(); if (n - last > 150) STALL.push([Math.round(n - last), PROTO.G.phase, PROTO.NIGHT.OV.cap || '']); last = n; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await p.mouse.click(640, 360); await p.waitForTimeout(300); // start the music
  await p.evaluate(() => { HMENU.scenes = true; document.getElementById('hsolo').click(); }); await p.waitForTimeout(800);
  const clk = s => p.evaluate(s => { const e = [...document.querySelectorAll(s)].find(x => x.offsetParent); if (e) e.click(); return !!e; }, s);
  const log = [];
  for (let night = 0; night < 4; night++) {
    await clk('#modal [data-go="night"]'); await p.waitForTimeout(300);
    for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-frame]', '[data-hush]', '[data-kill]', '[data-turn]']) await clk(s);
    await clk('[data-go="sleep"]'); const t0 = Date.now();
    await p.waitForFunction(() => PROTO.G.phase !== 'cine' && PROTO.G.phase !== 'nightsim', null, { timeout: 120000 }).catch(() => log.push('night ' + night + ' never left the scene'));
    log.push(`night ${night}: scene ${Math.round((Date.now() - t0) / 1000)}s, now ${await p.evaluate(() => PROTO.G.phase + ' modal:' + getComputedStyle(document.getElementById('modal')).display + ' cine:' + document.body.classList.contains('cine'))}`);
    if (await p.evaluate(() => PROTO.G.over)) break;
    await clk('[data-go="day"]'); await p.waitForTimeout(500);
    const st0 = await p.evaluate(() => [PROTO.G.t, PROTO.G.timer, PROTO.G.players.map(q => q.x.toFixed(1)).join()]); await p.waitForTimeout(12000); const st1 = await p.evaluate(() => [PROTO.G.t, PROTO.G.timer, PROTO.G.players.map(q => q.x.toFixed(1)).join(), PROTO.G.headless, PROTO.VIEW.cine, document.body.className]); const pos0 = st0[2], pos1 = st1[2]; log.push('   t ' + st0[0].toFixed(1) + '->' + st1[0].toFixed(1) + ' timer ' + st0[1].toFixed(1) + '->' + st1[1].toFixed(1) + ' headless ' + st1[3] + ' body ' + st1[5]);
    log.push(`  day ${await p.evaluate(() => PROTO.G.day)}: phase ${await p.evaluate(() => PROTO.G.phase)}, brothers moving: ${pos0 !== pos1}`);
    await p.evaluate(() => PROTO.startHearing()); await p.waitForTimeout(300);
    for (let k = 0; k < 6; k++) { await clk('[data-nom="-1"]'); await clk('[data-go="tally"]'); await clk('[data-vote="0"]'); await clk('[data-go="next"]'); await p.waitForTimeout(400); if (await p.evaluate(() => PROTO.G.hearing && PROTO.G.hearing.result)) break; }
    await p.waitForFunction(() => PROTO.G.phase !== 'cine', null, { timeout: 60000 }).catch(() => {});
  }
  console.log(log.join('\n')); console.log('stalls', JSON.stringify(await p.evaluate(() => STALL))); console.log(errs.slice(0, 5)); await b.close(); })();
