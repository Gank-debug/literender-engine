const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=3&scenes=off'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  console.log(await p.evaluate(async () => { HGAME.newGame({ seed: 5, humans: [0, 1, 2], scenes: false }); const G = PROTO.G; HGAME.hideModal(); G.phase = 'day';
    const roles = G.players.map(p => p.role); G.players[0].role = 'enemy'; G.players[1].role = 'empty'; G.players[2].role = 'infirm';
    const has = (me, t) => HGAME.asSeat(me, () => { HGAME.renderAll(); return !!document.querySelector(`#bro [data-wsp="${t}"]`); });
    // as LOCAL=0 only seat 0 renders; check the others through the host-side rule via handle
    const out = { hollowToEmpty: has(0, 1), hollowToInfirm: has(0, 2) };
    HGAME.asSeat(1, () => HGAME.handle({ wsay: 'who are you', to: 0 })); HGAME.asSeat(0, () => HGAME.handle({ wsay: 'it is me', to: 1 })); HGAME.asSeat(1, () => HGAME.handle({ wsay: 'hi', to: 2 }));
    out.wchat = G.wchat.map(m => `${m.from}->${m.to}: ${m.text}`); return out; }), errs); await b.close(); })();
