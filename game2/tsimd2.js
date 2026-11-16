// Many games with you passive (vote with the majority of the table, never accuse), at full day length, no rendering.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const res = [];
  for (let g = 0; g < +(process.env.NG || 16); g++) { await p.goto('file://' + __dirname + '/sim_' + (process.env.SF || process.env.SZ || 10) + '.html?scenes=off&seed=' + (103 + g) + (process.env.QS || '')); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 60000 });
    const r = await p.evaluate(() => { const G = PROTO.G; G.headless = true; const q = s => document.querySelector(s); const hangs = [];
      q('[data-go="night"]')?.click(); for (let guard = 0; guard < 40 && G.phase !== 'over'; guard++) {
        if (G.phase === 'night') { const a = q('[data-protect],[data-follow]'); if (a) a.click(); q('[data-go="sleep"]')?.click(); }
        if (G.phase === 'dawn') q('[data-go="day"]')?.click();
        if (G.phase === 'day') { for (let k = 0; k < 3200 && G.phase === 'day'; k++) PROTO.update(.05); }
        if (G.phase === 'dusk') { for (let k = 0; k < 8 && !G.hearing.result; k++) { if (G.hearing.stage === 'nom') { const lead = PROTO.nomTally()[0]; const b = lead && q(`[data-nom="${lead[0]}"]`); (b || q('[data-nom="-1"]') || { click() {} }).click(); const tb = q('[data-go="tally"]'); if (tb) tb.click(); continue; } const a = G.hearing.acc[G.hearing.cur]; if (a && a.votes && a.votes.you == null && q('[data-vote]')) { const ay = Object.values(a.votes).filter(v => v).length; q(`[data-vote="${ay >= 3 ? 1 : 0}"]`).click(); } const n = q('[data-go="next"]'); if (n) n.click(); }
          if (G.hearing.result) hangs.push(G.hearing.result.banished != null ? 'B:' + G.players[G.hearing.result.banished].role : G.hearing.result.hanged == null ? '-' : (G.players[G.hearing.result.hanged].role)); const nf = q('[data-go="night"]'); if (nf) nf.click(); } }
      return { over: G.over, day: G.day, hangs: hangs.join(','), log: (G.town ? G.town.log.filter(l => l.nt).map(l => l.t.replace(/ of the dead came at the walls/, '')) : []).join(' ; '), you: G.players[0].role, dead: G.players.filter(p => !p.alive).map(p => p.role).join(',') }; });
    res.push(r); console.log(JSON.stringify(r)); }
  console.log('good wins', res.filter(r => r.over === 'good').length, '/', res.length, 'avg days', (res.reduce((s, r) => s + r.day, 0) / res.length).toFixed(1)); console.log(errs.slice(0, 5)); await b.close(); })();
