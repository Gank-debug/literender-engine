const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=7&scenes=off'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  const out = await p.evaluate(async () => { HGAME.newGame({ seed: 7, humans: [0], size: 8, forceEnemy: true, scenes: false }); const G = PROTO.G, q = s => document.querySelector('#modal ' + s), log = [];
    const w = ms => new Promise(r => setTimeout(r, ms));
    q('[data-go="night"]')?.click(); await w(100);
    for (let g = 0; g < 30 && G.phase !== 'over' && log.length < 6; g++) {
      if (G.phase === 'night') { const m = document.getElementById('modal').innerText; log.push(`night ${G.night + 1}: turn ${!!q('[data-turn]')} kill ${!!q('[data-kill]')} | ${/do not hunger|take no one|Take a brother/.exec(m)}`); (q('[data-turn]') || q('[data-kill]') || { click() {} }).click(); await w(50); q('[data-go="sleep"]')?.click(); await w(100); }
      if (G.phase === 'dawn') { q('[data-go="day"]')?.click(); await w(50); }
      if (G.phase === 'day') { G.timer = .01; PROTO.update(.05); await w(50); }
      if (G.phase === 'dusk') { for (let k = 0; k < 6 && !G.hearing.result; k++) { q('[data-nom="-1"]')?.click(); q('[data-go="tally"]')?.click(); q('[data-vote="0"]')?.click(); q('[data-go="next"]')?.click(); await w(30); } q('[data-go="night"]')?.click(); await w(100); } }
    return log.concat(['turned: ' + G.players.filter(p => p.wasRole).map(p => p.role + '@' + p.turnedNight).join()]); });
  console.log(out.join('\n')); console.log(errs); await b.close(); })();
