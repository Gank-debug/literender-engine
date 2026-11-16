// Plays real nights in the built game and records them. node tnight.js good|enemy seed nights
const { chromium } = require('playwright'); const fs = require('fs'); const AS = process.argv[2] || 'good', SEED = process.argv[3] || '21', NN = +(process.argv[4] || 3), OUT = `${__dirname}/night_${AS}`;
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?as=${AS}&seed=${SEED}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.waitForTimeout(4000); let n = 0; const shot = async () => p.screenshot({ path: `${OUT}/${String(n++).padStart(4, '0')}.png` });
  const pick = () => p.evaluate(() => { const q = s => document.querySelector(s), m = PROTO.you(); const go = q('[data-go="night"]'); if (go) go.click();
    const k = q('[data-kill]'); if (k) { const ks = [...document.querySelectorAll('[data-kill]')]; ks[ks.length - 1].click(); } const pr = q('[data-protect]'); if (pr) pr.click(); const f = q('[data-follow]'); if (f) f.click();
    const rooms = [...document.querySelectorAll('[data-room]')]; if (rooms.length) rooms[1 + (PROTO.G.night || 0) % 3].click(); });
  for (let night = 0; night < NN; night++) {
    await pick(); await p.waitForTimeout(200); await pick(); await p.waitForTimeout(200);
    const sleep = await p.$('[data-go="sleep"]'); if (!sleep) { console.log('no sleep button'); break; } await sleep.click();
    // record the scene at ~6 fps until dawn
    const t0 = Date.now(); while (await p.evaluate(() => PROTO.G.phase) === 'cine' && Date.now() - t0 < 60000) { await shot(); await p.waitForTimeout(120); }
    console.log('night', night + 1, 'targets', JSON.stringify(await p.evaluate(() => [PROTO.G.nightLog.targets, PROTO.G.nightLog.protect, PROTO.G.nightLog.dead])), 'phase', await p.evaluate(() => PROTO.G.phase), 'secs', (Date.now() - t0) / 1000);
    if (await p.evaluate(() => PROTO.G.over)) break;
    // through dawn, skip the day quickly
    await p.evaluate(() => { const q = document.querySelector('[data-go="day"]'); if (q) q.click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { PROTO.startHearing(); }); await p.waitForTimeout(300);
    for (let k = 0; k < 6; k++) await p.evaluate(() => { const q = s => document.querySelector(s); const b2 = q('[data-go="vote"]') || q('[data-vote="0"]') || q('[data-go="next"]'); if (b2) b2.click(); });
    await p.waitForTimeout(300); }
  console.log('frames', n, 'errors', errs.slice(0, 5)); await b.close(); })();
