// The woods: caches only out there, three in your arms at most, the Strigoi's bite by day when no one sees.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=12&role=enemy'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G && HGAME.mapKey() === 'town', null, { timeout: 120000 });
  const r = await p.evaluate(async () => { const G = PROTO.G, q = s => document.querySelector(s), sl = ms => new Promise(r => setTimeout(r, ms));
    q('[data-go="night"]')?.click(); await sl(200); for (const s of ['[data-bite]', '[data-protect]', '[data-follow]', '[data-ring]']) q('#modal ' + s)?.click(); q('[data-go="sleep"]')?.click(); await sl(300);
    for (let k = 0; k < 10 && PROTO.NIGHT.on(); k++) { PROTO.NIGHT.skip(); await sl(100); } q('[data-go="day"]')?.click(); await sl(300);
    const me = PROTO.you(), out = { role: me.role, spots: G.spots.length, inTown: G.spots.filter(s => s.y < 41).length, mats: G.spots.reduce((a, s) => a + Object.values(s.mat || {}).reduce((x, y) => x + y, 0), 0), pois: [...new Set(G.spots.map(s => s.poi))].length };
    // carry: stand at the richest cache and scavenge twice
    const sp = G.spots.slice().sort((a, b) => Object.values(b.mat).reduce((x, y) => x + y, 0) - Object.values(a.mat).reduce((x, y) => x + y, 0))[0];
    me.pack = { timber: 2 }; me.x = sp.x + .3; me.y = sp.y; await sl(400);
    out.cacheBefore = JSON.stringify(sp.mat); q('[data-act="search"]')?.click(); for (let k = 0; k < 80; k++) PROTO.update(.05); out.packAfter = JSON.stringify(me.pack); out.cacheAfter = JSON.stringify(sp.mat) + ' searched ' + sp.searched;
    // the bite: a bot alone with me in the woods, everyone else far
    for (const x of G.players) if (x.role === 'enemy' && x.id !== me.id) x.role = 'lay'; me.role = 'enemy'; const v = G.players.find(x => x.id !== me.id && x.alive && x.role !== 'enemy'); for (const x of G.players) if (x.id !== me.id && x.id !== v.id) { x.x = 24; x.y = 20; x.path = []; }
    v.x = 36.5; v.y = 65.2; v.path = []; me.x = 36.5; me.y = 64; me.path = []; await sl(400);
    out.biteBtn = q('[data-act="daybite"]')?.innerText; q('[data-act="daybite"]')?.click(); await sl(50); out.bitten = [v.short, v.bitten, v.dayBit, JSON.stringify(G.dayBite)];
    // someone watching: no bite
    G.dayBite = null; v.bitten = null; const w = G.players.find(x => x.id !== me.id && x.id !== v.id); w.x = 36.5; w.y = 60.5; await sl(400); out.watchedBtn = q('[data-act="daybite"]')?.innerText;
    return out; });
  console.log(JSON.stringify(r, null, 1)); await p.screenshot({ path: '../shots/woods_test.png' }); console.log(errs); await b.close(); })();
