const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 300)); });
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=12&role=prior'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G && HGAME.mapKey() === 'town', null, { timeout: 120000 });
  const r = await p.evaluate(async () => { const G = PROTO.G, q = s => document.querySelector(s), sl = ms => new Promise(r => setTimeout(r, ms));
    q('[data-go="night"]')?.click(); await sl(200); q('[data-go="sleep"]')?.click(); await sl(300);
    for (let k = 0; k < 10 && PROTO.NIGHT.on(); k++) { PROTO.NIGHT.skip(); await sl(100); } q('[data-go="day"]')?.click(); await sl(300);
    const me = PROTO.you(); me.x = 24; me.y = 55; me.path = []; await sl(400); G.timer = 0.5; await sl(1500);
    const o = { phase: G.phase, locked: me.lockedOut, log: G.town.log.map(l => l.t).filter(t => /gate shut/.test(String(t))).slice(-1) };
    me.x = 24; me.y = 30; await sl(300); o.pushedY = me.y.toFixed(1);
    for (let k = 0; k < 30 && G.phase !== 'night'; k++) { (q('[data-go="night"]') || q('[data-vote="0"]') || q('[data-go]'))?.click(); await sl(300); }
    o.night = G.phase; o.modal = q('#modal')?.innerText.slice(0, 200); return o; });
  await p.screenshot({ path: '../shots/lock.png' }); console.log(JSON.stringify(r, null, 1), errs); await b.close(); })();
