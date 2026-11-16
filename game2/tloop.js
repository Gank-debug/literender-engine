// The town's day: walk out into the Wastes, scavenge, hear the dusk bell, read the day's account in the log.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=21'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G, null, { timeout: 90000 });
  await p.waitForFunction(() => HGAME.mapKey() === 'town', null, { timeout: 60000 });
  const r = await p.evaluate(async () => { const G = PROTO.G, q = s => document.querySelector(s), sl = ms => new Promise(r => setTimeout(r, ms));
    q('[data-go="night"]')?.click(); await sl(200); for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-bite]']) q('#modal ' + s)?.click(); q('[data-go="sleep"]')?.click(); await sl(300);
    for (let k = 0; k < 10 && PROTO.NIGHT.on(); k++) { PROTO.NIGHT.skip(); await sl(100); } q('[data-go="day"]')?.click(); await sl(300);
    const spots = G.spots.filter(s => s.mat); const inside = spots.filter(s => s.y < 41).length, outside = spots.length - inside, sum = a => a.reduce((t, s) => t + Object.values(s.mat).reduce((x, y) => x + y, 0), 0);
    const me = PROTO.you(); const s0 = spots.find(s => s.y > 41); me.x = s0.x + .3; me.y = s0.y; G.timer = 31; for (let k = 0; k < 60; k++) PROTO.update(.05);
    const flash = document.body.innerText.includes('dusk bell'); G.timer = .1; for (let k = 0; k < 10; k++) PROTO.update(.05);
    const log = G.town.log.slice(-4).map(l => l.t);
    return { inside, outside, matsIn: sum(spots.filter(s => s.y < 41)), matsOut: sum(spots.filter(s => s.y >= 41)), flash, phase: G.phase, log }; });
  console.log(JSON.stringify(r, null, 1)); await p.screenshot({ path: '../shots/town_loop.png' }); console.log(errs); await b.close(); })();
