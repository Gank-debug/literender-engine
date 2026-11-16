// Records the Taking from a real night (night 2), frame-stepped at 24 fps, and logs the creature's change for the score. node trec.js seed
const { chromium } = require('playwright'); const fs = require('fs'); const SEED = process.argv[2] || '21', ANON = process.argv[3] === 'anon', MODE = process.argv[4] || '', OUT = `${__dirname}/night_${MODE || (ANON ? 'anon' : 'plain')}`, FPS = 12;
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?as=good&seed=${SEED}${MODE ? '&night=' + MODE : ''}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  const pick = () => p.evaluate(() => { const q = s => document.querySelector(s); const go = q('#modal [data-go="night"]'); if (go) go.click(); const pr = q('[data-protect]'); if (pr) pr.click(); const f = q('[data-follow]'); if (f) f.click(); const rooms = [...document.querySelectorAll('[data-room]')]; if (rooms.length) rooms[1].click(); });
  // night 1 without scenes, a quick day, then night 2 with them
  await p.evaluate(() => { PROTO.G.opt.scenes = false; }); await pick(); await p.waitForTimeout(200); await pick(); await p.click('[data-go="sleep"]'); await p.waitForTimeout(500);
  await p.evaluate(() => { const q = document.querySelector('[data-go="day"]'); if (q) q.click(); }); await p.waitForTimeout(300); await p.evaluate(() => PROTO.startHearing()); await p.waitForTimeout(300);
  for (let k = 0; k < 8; k++) { await p.evaluate(() => { const q = s => document.querySelector(s); const b2 = q('[data-go="vote"]') || q('[data-vote="0"]') || q('[data-go="next"]'); if (b2) b2.click(); }); await p.waitForTimeout(150); }
  await p.evaluate(() => { PROTO.G.opt.scenes = true; }); await pick(); await p.waitForTimeout(300); await pick(); await p.waitForTimeout(200);
  await p.click('[data-go="sleep"]'); await p.waitForFunction(() => PROTO.G.phase === 'cine', null, { timeout: 20000 }); await p.evaluate(() => { PROTO.G.headless = true; });
  const log = []; let n = 0, k = 0;
  while (k < 60 * FPS && await p.evaluate(() => PROTO.G.phase) === 'cine') {
    const st = await p.evaluate(F => { const N = PROTO.NIGHT, O = N.OV; N.tick(1 / F); PROTO.G.t += 1 / F; PROTO.VIEW.fi = Math.floor(PROTO.G.t * 6) % PROTO.VIEW.frames.length; if (PROTO.G.phase !== 'cine') return null; PROTO.frame(); N.draw(); const e = (PROTO.VIEW.extra || [])[0]; return { cap: O.cap, sub: O.sub, red: O.red, fade: O.fade, m: e && e.dark ? e.dark / 6 : 0 }; }, FPS);
    if (!st) break; const taking = st.cap && !['Compline', 'The Vigil', 'Lauds', 'And again, before Lauds.'].includes(st.cap) || (log.length && log[log.length - 1].taking && st.cap === '');
    st.taking = taking; if (true) { await p.screenshot({ path: `${OUT}/${String(n++).padStart(4, '0')}.png` }); log.push(st); } else if (log.length) log.push(st); k++; if (log.length && !taking && log[log.length - 2] && log[log.length - 2].taking && st.cap === 'Lauds') break; }
  fs.writeFileSync(OUT + '/log.json', JSON.stringify(log.filter(x => x.taking))); console.log('frames', n, 'targets', await p.evaluate(() => JSON.stringify([PROTO.G.nightLog.targets, PROTO.G.nightLog.protect, PROTO.G.nightLog.dead])), errs.slice(0, 4)); await b.close(); })();
