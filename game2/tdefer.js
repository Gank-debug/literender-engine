// Five players: the house names only what two players name, and votes with the players' majority
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  const r = await p.evaluate(() => { const G = PROTO.G, H = HGAME, out = [];
    H.newGame({ seed: 77, humans: [0, 1, 2, 3, 4], names: {}, lot: true, scenes: false }); G.headless = true;
    G.day = 1; G.phase = 'day'; G.bodies.push({ id: 9, x: 5, y: 5, room: 'chapel', examined: {} }); PROTO.startHearing ? PROTO.startHearing() : null;
    out.push('house noms before any player: ' + JSON.stringify(Object.values(G.hearing.noms)));
    H.asSeat(0, () => H.handle({ nom: '6' })); out.push('one player names 6: ' + JSON.stringify(PROTO.nomTally().map(t => [t[0], t[1].length])));
    H.asSeat(1, () => H.handle({ nom: '6' })); out.push('two players name 6: ' + JSON.stringify(PROTO.nomTally().map(t => [t[0], t[1].length])));
    for (const s of [0, 1, 2, 3, 4]) H.asSeat(s, () => H.handle({ go: 'tally' }));
    const h = G.hearing; out.push('stage ' + h.stage + ' target ' + (h.acc[0] && h.acc[0].target) + ' bot votes before players: ' + Object.keys(h.acc[0].votes).length);
    // players split 3 nay, 2 aye
    [[0, '1'], [1, '1'], [2, '0'], [3, '0'], [4, '0']].forEach(([s, v]) => H.asSeat(s, () => H.handle({ vote: v })));
    const a = h.acc[0]; out.push('after players: ayes ' + Object.values(a.votes).filter(v => v).length + ' of ' + Object.keys(a.votes).length + ' (house followed: ' + !!a.houseIn + ')');
    return out; });
  console.log(r.join('\n')); console.log(errs); await b.close(); })();
