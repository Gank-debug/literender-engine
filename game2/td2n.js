// Die2Nite rules: the gate lever, shoring up your house, the dead in the far Wastes
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=12&role=prior'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G && HGAME.mapKey() === 'town', null, { timeout: 120000 });
  const r = await p.evaluate(async () => { const G = PROTO.G, X = PROTO.D2N(), q = s => document.querySelector(s), sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
    q('[data-go="night"]')?.click(); await sl(200); q('[data-go="sleep"]')?.click(); await sl(300);
    for (let k = 0; k < 10 && PROTO.NIGHT.on(); k++) { PROTO.NIGHT.skip(); await sl(100); } q('[data-go="day"]')?.click(); await sl(300);
    const me = PROTO.you(); o.gate0 = G.town.gate; o.keeper = G.town.keeper; o.roam = G.town.roam.length;
    // the lever
    const L = X.LEVER(); me.x = L[0] + .5; me.y = L[1] - .5; me.path = []; await sl(200); o.btn = q('[data-act="gate"]')?.innerText.replace(/\n/g, ' / ');
    q('[data-act="gate"]').click(); await sl(200); o.gate1 = G.town.gate; o.logGate = G.town.log.slice(-1)[0].t;
    me.path = PROTO.findPath(me.x, me.y, 24, 42); await sl(5000); o.posShut = [me.x.toFixed(1), me.y.toFixed(1)];
    me.x = L[0] + .5; me.y = L[1] - .5; me.path = []; await sl(200); q('[data-act="gate"]').click(); await sl(100); o.gate2 = G.town.gate;
    me.path = PROTO.findPath(me.x, me.y, 24, 42); await sl(5000); o.posOpen = [me.x.toFixed(1), me.y.toFixed(1)];
    // shore up the house
    const H = G.players.length; me.pack = { timber: 1, nails: 2 }; const hk = X.homeKey(me), hr = PROTO.G && (() => { const rs = HGAME ? null : null; })();
    const home = (() => { for (let y = 20; y < 38; y += .5) for (let x = 5; x < 43; x += .5) if (X.placeAt(x, y) === hk) return [x + 1.5, y + 1.5]; })(); me.x = home[0]; me.y = home[1]; await sl(300);
    o.fbtn = q('[data-act="fortify"]')?.innerText.replace(/\n/g, ' / '); q('[data-act="fortify"]').click(); await sl(100); o.lv = X.homeLv(me); o.pack = JSON.stringify(me.pack); o.logF = G.town.log.slice(-1)[0].t;
    // the dead in the far Wastes: alone, then with a neighbour
    const d = G.town.roam[0]; o.roamAt = [d.hx, d.hy]; me.pack = { rope: 1 }; me.x = d.x + 2; me.y = d.y; me.path = []; for (const q2 of G.players) if (q2.id !== me.id && Math.hypot(q2.x - me.x, q2.y - me.y) < 6) { q2.x = 24; q2.y = 20; q2.path = []; }
    await sl(2500); o.wound = JSON.stringify(G.town.wound); o.packAfter = JSON.stringify(me.pack); o.dropped = G.spots.filter(s => s.poi === 'dropped').length; o.flash = document.getElementById('flash').textContent;
    const pal = G.players.find(q2 => q2.id !== me.id && q2.alive && q2.role !== 'enemy'); const d2 = G.town.roam[1] || d; d2.cd = 0; me.x = d2.x + 2; me.y = d2.y; pal.x = me.x + 1; pal.y = me.y; pal.path = []; pal.wait = 99; await sl(2500); o.alive = me.alive; o.flash2 = document.getElementById('flash').textContent;
    return o; });
  await p.screenshot({ path: '../shots/d2n_test.png' }); console.log(JSON.stringify(r, null, 1), errs.slice(0, 4)); await b.close(); })();
