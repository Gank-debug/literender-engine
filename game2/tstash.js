const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=4&scenes=off&map=town'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && HGAME.mapKey() === 'town', null, { timeout: 90000 });
  const log = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), G = PROTO.G, q = s => document.querySelector('#modal ' + s), out = [];
    HGAME.newGame({ seed: 21, humans: [0], scenes: false, map: 'town' }); await w(100); q('[data-go="night"]')?.click(); await w(80);
    for (let n = 0; n < 6 && G.phase !== 'over'; n++) {
      if (G.phase === 'night') { for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-bite]']) q(s)?.click(); await w(40); q('[data-go="sleep"]')?.click(); await w(100); }
      if (G.phase === 'dawn') { out.push(`dawn ${G.day}: ` + document.getElementById('modal').innerText.split('\n').filter(l => /dead|walls|lies/.test(l)).join(' | ')); q('[data-go="day"]')?.click(); await w(60); }
      if (G.phase === 'day') { if (n === 1) { const me = PROTO.you(); me.x = 24.3; me.y = 23.2; me.pack = { timber: 2, rope: 1 }; document.querySelector('[data-stash="open"]')?.click(); await w(200); q('[data-stash="dep"]')?.click(); await w(100); q('[data-stash="build:pal"]')?.click(); await w(200); out.push('stash: ' + JSON.stringify(G.town.stash) + ' def ' + G.town.def); return out; }
        for (let k = 0; k < 2400 && G.phase === 'day'; k++) PROTO.update(.05); }
      if (G.phase === 'dusk') { for (let k = 0; k < 6 && !G.hearing.result; k++) { q('[data-nom="-1"]')?.click(); q('[data-go="tally"]')?.click(); q('[data-vote="0"]')?.click(); q('[data-go="next"]')?.click(); await w(40); } q('[data-go="night"]')?.click(); await w(100); } }
    return out; });
  console.log(log.join('\n')); await p.waitForTimeout(500); await p.screenshot({ path: '../shots/stash.png' }); console.log(await p.evaluate(() => PROTO.G.town.log.map(l => l.t).slice(-12).join('\n'))); console.log(errs.slice(0, 5)); await b.close(); })();
