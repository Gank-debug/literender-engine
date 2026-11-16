// Records the hanging scene draft from the game's own engine. node hrec.js good|evil|heir [from-shot]
const { chromium } = require('playwright'); const fs = require('fs');
const KIND = process.argv[2] || 'heir', FROM = +(process.argv[3] || 0), HOW = process.argv[4] || 'rope', OUT = __dirname + '/hang_' + KIND + (HOW === 'blade' ? '_blade' : ''); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  const clk = s => p.evaluate(s => { const e = [...document.querySelectorAll(s)].find(x => x.offsetParent); if (e) e.click(); return !!e; }, s);
  await clk('#modal [data-go="night"]'); await clk('[data-protect]'); await clk('[data-follow]'); await clk('[data-go="sleep"]'); await p.waitForTimeout(300); await clk('[data-go="day"]');
  await p.evaluate(() => { PROTO.G.headless = true; for (let k = 0; k < 400; k++) PROTO.update(.05); });
  await p.evaluate(h => { window.HOW = h; }, HOW); await p.evaluate(k => { const G = PROTO.G; HGAME.hideModal(); const v = G.players.find(q => q.id !== HGAME.getLocal() && q.alive && (k === 'good' ? q.role !== 'enemy' && q.role !== 'scrubber' : true) && (k !== 'good' ? q.role === 'enemy' : true)) || G.players[3];
    v.alive = false; for (const q of G.players) for (let f = 0; f < 8; f++) { PROTO.KIT.person(q.o, f, 'idle', 0); PROTO.KIT.person({ ...q.o, prop: 'candle' }, f, 'idle', 0); PROTO.KIT.person({ ...q.o, prop: 'candle' }, f, 'pray', 0); PROTO.KIT.person({ ...q.o, prop: 'candle' }, f, 'pray', 1); for (let j = 0; j < 4; j++) PROTO.KIT.person(q.o, f, 'walk', j); }
    window.HV = v.id; PROTO.NIGHT.hang(v.id, k, () => { window.HDONE = 1; }, window.HOW, 0); }, KIND);
  let n = 0, k = 0; while (!(await p.evaluate(() => window.HDONE)) && k < 600) { const r = await p.evaluate(() => { const N = PROTO.NIGHT; N.tick(1 / 12); PROTO.G.t += 1 / 12; PROTO.VIEW.fi = Math.floor(PROTO.G.t * 6) % PROTO.VIEW.frames.length; if (window.HDONE) return 0; PROTO.frame(); N.draw(); return 1; });
    if (r && k >= FROM) await p.screenshot({ path: `${OUT}/${String(n++).padStart(4, '0')}.png` }); k++; }
  console.log(KIND, 'frames', n, errs.slice(0, 5)); await b.close(); })();
