// Every turned kind and the new gifts, played through headless: errors, and what each gift says at dawn
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const errs = [], said = {}, outs = [];
  for (const turn of ['scrub', 'forger', 'lamb', 'hush', 'wether', 'empty']) for (let g = 0; g < 3; g++) {
    const p = await b.newPage(); p.on('pageerror', e => errs.push(turn + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(turn + ' console: ' + m.text().slice(0, 200)); });
    await p.goto(`file://${__dirname}/hollow_brother_proto.html?scenes=off&seed=${300 + g * 17}&turn=${turn}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
    const r = await p.evaluate(() => { const G = PROTO.G; G.headless = true; const q = s => document.querySelector(s); const info = []; const roles = G.players.map(x => x.role).join(',');
      q('[data-go="night"]').click(); for (let guard = 0; guard < 40 && G.phase !== 'over'; guard++) {
        if (G.phase === 'night') { for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-frame]', '[data-hush]', '[data-kill]', '[data-turn]']) { const a = q(s); if (a) a.click(); } q('[data-go="sleep"]')?.click(); for (const [id, c] of Object.entries(G.nightInfo || {})) info.push([G.players[id].role, c.text]); }
        if (G.phase === 'dawn') q('[data-go="day"]')?.click();
        if (G.phase === 'day') { for (let k = 0; k < 3200 && G.phase === 'day'; k++) PROTO.update(.05); }
        if (G.phase === 'dusk') { for (let k = 0; k < 10 && !G.hearing.result; k++) { if (G.hearing.stage === 'nom') { const lead = PROTO.nomTally()[0]; (lead && q(`[data-nom="${lead[0]}"]`) || q('[data-nom="-1"]') || { click() {} }).click(); q('[data-go="tally"]')?.click(); continue; } if (q('[data-vote]')) q('[data-vote="0"]').click(); q('[data-go="next"]')?.click(); } q('[data-go="night"]')?.click(); } }
      return { over: G.over, day: G.day, roles, turned: G.players.filter(x => x.turnedNight).map(x => x.wasRole + '>' + (x.turnedAs || x.role)).join(), forged: G.spots.filter(s => s.forged).length, info }; });
    outs.push(`${turn} ${r.over} d${r.day} ${r.turned}`); for (const [role, t] of r.info) if (['bell', 'watch', 'precent', 'sacrist', 'confess', 'grave'].includes(role) || /heavy/.test(t)) (said[role] = said[role] || new Set()).add(t.slice(0, 150));
    await p.close(); }
  console.log(outs.join('\n')); for (const [k, v] of Object.entries(said)) console.log('--', k, '\n  ' + [...v].slice(0, 3).join('\n  '));
  console.log('errors', errs.slice(0, 8)); await b.close(); })();
