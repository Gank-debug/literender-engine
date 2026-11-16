const { chromium } = require('playwright'); const fs = require('fs'); const V = JSON.parse(fs.readFileSync(__dirname + '/variants_none.json'));
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(3000);
  await p.click('#shplay'); await p.click('#lgo'); await p.waitForTimeout(1500);
  const waitIdle = async () => { for (let i = 0; i < 120; i++) { await p.waitForTimeout(300); if (await p.evaluate(() => myTurn() && !(UI.scene && UI.scene.kind))) return true; const sc = await p.evaluate(() => UI.scene && UI.scene.kind); if (sc === 'battle') await p.evaluate(() => { const b = document.querySelector('#btac [data-o="hold"]'); if (b) b.click(); }); } return false; };
  await p.waitForTimeout(11000); await p.evaluate(() => { if (G.setup && G.setup.step === 'charter') send({ type: 'charter', k: 'merchant', by: charterWho().id }); });
  const setup = async () => { await waitIdle(); await p.evaluate(() => { const L = me(); const v = G.verts.filter(canStartVillage).sort((a, b) => vertValue(b, L) - vertValue(a, L))[0]; send({ type: 'setupV', v: v.id }); }); await waitIdle(); await p.evaluate(() => send({ type: 'setupR', e: G.edges.filter(canStartRoad)[0].id })); };
  await setup(); await setup(); await waitIdle();
  for (let r = 0; r < 6; r++) { await p.evaluate(() => { const t = document.getElementById('tbroll'); if (t) t.click(); }); await waitIdle(); if (await p.evaluate(() => G.phase === 'robber')) { await p.evaluate(() => send({ type: 'robber', tile: aiRobber(me()), victim: null })); await waitIdle(); }
    await p.evaluate(() => { Object.assign(me().res, { timber: 3, clay: 2, wool: 3, grain: 2, ore: 1 }); const e = G.edges.filter(e => canRoad(me().id, e))[0]; if (e) send({ type: 'build', k: 'road', id: e.id }); }); await waitIdle(); await p.evaluate(() => act('end')); await waitIdle(); }
  await p.evaluate(() => { const t = document.getElementById('tbroll'); if (t) t.click(); }); await waitIdle(); await p.waitForTimeout(800);
  // freeze the toasts so every draft shows the same ones
  await p.evaluate(() => { const t = document.getElementById('toasts'); window.__toasts = t.innerHTML; });
  await p.addStyleTag({ content: V.font });
  const shots = [['0_now', '']].concat(Object.entries(V.v).map(([k, [d, css]]) => [k, css]));
  for (const [k, css] of shots) { await p.evaluate(([css]) => { let s = document.getElementById('draftcss'); if (!s) { s = document.createElement('style'); s.id = 'draftcss'; document.head.appendChild(s); } s.textContent = css; const t = document.getElementById('toasts'); t.innerHTML = window.__toasts; t.querySelectorAll('.toast').forEach(x => { x.classList.remove('out'); x.style.opacity = 1; }); }, [css]); await p.waitForTimeout(400); await p.screenshot({ path: __dirname + '/../game2/hudA_' + k + '.png' }); }
  console.log(errs.slice(0, 5)); await b.close(); })();
