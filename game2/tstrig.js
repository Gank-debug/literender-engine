const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=4&scenes=off&map=town'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && HGAME.mapKey() === 'town', null, { timeout: 90000 });
  const out = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), G = PROTO.G, q = s => document.querySelector('#modal ' + s), log = [];
    HGAME.newGame({ seed: 9, humans: [0], forceEnemy: true, scenes: false, map: 'town' }); await w(100);
    log.push('intro: ' + document.getElementById('modal').innerText.slice(0, 260).replace(/\n+/g, ' | '));
    q('[data-go="night"]')?.click(); await w(100);
    for (let n = 0; n < 7 && G.phase !== 'over'; n++) {
      if (G.phase === 'night') { const m = document.getElementById('modal'); const th = m.querySelector('[data-send]'); if (th && n % 2) th.click(); else m.querySelector('[data-bite]')?.click(); await w(60); log.push(`night ${G.night + 1}: ${m.innerText.replace(/\n+/g, ' | ').slice(0, 230)}`); q('[data-go="sleep"]')?.click(); await w(120); }
      if (G.phase === 'dawn') { log.push('  dawn: ' + document.getElementById('modal').innerText.replace(/\n+/g, ' | ').slice(0, 300)); log.push('  state: ' + G.players.map(p => p.short + ':' + p.role + (p.bitten ? '*' + p.bitten : '') + (p.alive ? '' : '†')).join(' ')); q('[data-go="day"]')?.click(); await w(60); }
      if (G.phase === 'day') { G.timer = .01; for (let k = 0; k < 4; k++) PROTO.update(.05); await w(60); }
      if (G.phase === 'dusk') { for (let k = 0; k < 6 && !G.hearing.result; k++) { q('[data-nom="-1"]')?.click(); q('[data-go="tally"]')?.click(); q('[data-vote="0"]')?.click(); q('[data-go="next"]')?.click(); await w(40); } q('[data-go="night"]')?.click(); await w(100); } }
    log.push('chat: ' + G.chat.slice(-6).map(c => c.text).join(' / '));
    log.push('clocknote: ' + document.getElementById('clocknote').innerText + ' | top: ' + document.querySelector('.topbar').innerText.replace(/\n/g, ' '));
    return log; });
  console.log(out.join('\n')); await p.screenshot({ path: '../shots/strig_ui.png' }); console.log(errs.slice(0, 6)); await b.close(); })();
