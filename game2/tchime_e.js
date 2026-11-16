const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?seed=11&scenes=off'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.mouse.click(800, 450); await p.waitForFunction(() => MUSIC.ready, null, { timeout: 30000 });
  const r = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); let n = 0; const orig = window.sfxChime; window.sfxChime = () => { n++; orig(); };
    const out = [];
    for (const seed of [11, 12, 13, 14, 15, 16]) { HGAME.newGame({ seed, humans: [0], forceEnemy: true, scenes: false }); const G = PROTO.G, q = s => document.querySelector('#modal ' + s);
      q('[data-go="night"]')?.click(); await w(50); for (const s of ['[data-protect]', '[data-follow]', '[data-ring]', '[data-turn]', '[data-kill]', '[data-frame]', '[data-hush]']) q(s)?.click(); await w(30); q('[data-go="sleep"]')?.click(); await w(80); q('[data-go="day"]')?.click(); await w(50);
      if (G.phase !== 'day') { out.push(seed + ' no day ' + G.phase); continue; }
      const me = PROTO.you(), good = PROTO.team(me) === 'good';
      for (const want of [true, false]) { const sp = G.spots.find(s => !s.searched && !s.busy && !!s.clue === want); if (!sp) continue; me.x = sp.x; me.y = sp.y; me.path = []; const before = n; PROTO.doSearch(); for (let k = 0; k < 200 && me.state === 'search'; k++) PROTO.update(.05); await w(50);
        out.push(`${me.role} (${good ? 'faithful' : 'evil'}) found ${want ? 'a clue' : 'scrap'}: chime ${n > before ? 'yes' : 'no'}`); HGAME.hideModal(); }
      if (out.length > 1) break; }
    return out; });
  console.log(r.join('\n'), errs);
  await p.screenshot({ path: '../shots/found_evil.png' }); await b.close(); })();
