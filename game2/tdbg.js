const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/sim_town.html?scenes=off&seed=103&map=town'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  const r = await p.evaluate(() => { const G = PROTO.G; G.headless = true; const q = s => document.querySelector(s), out = [];
    q('[data-go="night"]')?.click(); for (let guard = 0; guard < 24 && G.phase !== 'over'; guard++) {
      if (G.phase === 'night') { const a = q('[data-protect],[data-follow]'); if (a) a.click(); q('[data-go="sleep"]')?.click(); const lg = G.nightLog || {}; out.push(`N${G.night}: kills ${JSON.stringify(lg.kills)} bites ${JSON.stringify(lg.bites)} prot ${lg.protect} horde ${lg.horde && lg.horde.n + '/' + lg.horde.def} thralls ${G.players.filter(p => p.role === 'thrall' && p.alive).length} bitten ${G.players.filter(p => p.bitten).length} out ${G.players.filter(p => p.night === 'fields').length}`); }
      if (G.phase === 'dawn') q('[data-go="day"]')?.click();
      if (G.phase === 'day') { for (let k = 0; k < 3200 && G.phase === 'day'; k++) PROTO.update(.05); }
      if (G.phase === 'dusk') { for (let k = 0; k < 8 && !G.hearing.result; k++) { if (G.hearing.stage === 'nom') { const lead = PROTO.nomTally()[0]; const b = lead && q(`[data-nom="${lead[0]}"]`); (b || q('[data-nom="-1"]'))?.click(); q('[data-go="tally"]')?.click(); } else { const a = G.hearing.acc[G.hearing.cur]; const ay = Object.values(a.votes).filter(v => v).length; q(`[data-vote="${ay * 2 >= Object.keys(a.votes).length ? 1 : 0}"]`)?.click(); q('[data-go="next"]')?.click(); } } q('[data-go="night"]')?.click(); } }
    return out; });
  console.log(r.join('\n'), errs.slice(0, 3)); await b.close(); })();
