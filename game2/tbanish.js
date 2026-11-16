const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=4&scenes=off&map=town'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && HGAME.mapKey() === 'town', null, { timeout: 90000 });
  const out = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), G = PROTO.G, q = s => document.querySelector('#modal ' + s), o = {};
    HGAME.newGame({ seed: 31, humans: [0], scenes: false, map: 'town' }); await w(100); q('[data-go="night"]')?.click(); await w(80);
    for (const s of ['[data-protect]', '[data-follow]', '[data-ring]']) q(s)?.click(); await w(40); q('[data-go="sleep"]')?.click(); await w(150); q('[data-go="day"]')?.click(); await w(80);
    G.town.built.tower = 1; G.timer = .01; for (let k = 0; k < 5; k++) PROTO.update(.05); await w(200);
    // name Piet; everyone else names Piet too
    q('[data-nom="1"]')?.click(); await w(50); for (const pl of G.players) if (pl.id && pl.alive) G.hearing.noms[pl.id] = 1; q('[data-go="tally"]')?.click(); await w(200);
    o.stage = G.hearing.stage; const a = G.hearing.acc[G.hearing.cur]; if (a) for (const pl of G.players) if (pl.id && pl.alive) a.votes[pl.id] = pl.id === 1 ? false : pl.id % 3 ? 'b' : true;
    o.buttons = [...document.querySelectorAll('#modal [data-vote]')].map(b => b.innerText); window.__shot = 1; await w(50); q('[data-vote="2"]')?.click(); await w(150); q('[data-go="next"]')?.click(); await w(300);
    o.result = JSON.stringify(G.hearing.result); o.modal = document.getElementById('modal').innerText.split('\n').filter(l => /banish/i.test(l)).join(' | ');
    q('[data-go="night"]')?.click(); await w(100); for (const s of ['[data-protect]', '[data-follow]', '[data-ring]']) q(s)?.click(); await w(40); q('[data-go="sleep"]')?.click(); await w(200);
    o.pietNight = G.players[1].night + ' y=' + G.players[1].y.toFixed(1); o.tower = G.town.log.filter(l => /watchtower/.test(l.t)).map(l => l.t).join(' / ');
    q('[data-go="day"]')?.click(); await w(80); const pt = G.players[1]; pt.path = PROTO.findPath(pt.x, pt.y, 18.5, 20); for (let k = 0; k < 200; k++) PROTO.update(.05); o.pietAfterWalk = pt.y.toFixed(1); o.list = document.getElementById('bro').innerText.split('\n').filter(l => /banished/.test(l)).join(' ');
    return o; });
  console.log(out); console.log(errs); await b.close(); })();
