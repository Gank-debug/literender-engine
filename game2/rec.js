// Records a full game with an autopilot playing "you", from either side. node rec.js good|enemy seed
const { chromium } = require('playwright'); const fs = require('fs');
const AS = process.argv[2] || 'good', SEED = process.argv[3] || '777', SCAN = process.argv[4] === 'scan', OUT = __dirname + '/rec_' + AS; if (!SCAN) { fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT); }
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?as=${AS}&seed=${SEED}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  if (SCAN) await p.evaluate(() => { window.NOFRAME = 1; }); await p.evaluate(() => { PROTO.G.headless = true; window.AP = { t0: 0, done: 0, claimed: 0, shared: {} };
    const q = s => document.querySelector(s), G = PROTO.G, me = () => PROTO.you(), team = PROTO.team, living = PROTO.living;
    window.apNight = () => { const m = me(); if (m.alive) { const goods = living().filter(x => x.id !== m.id && team(x) === 'good');
        if (m.role === 'enemy') { const pickV = goods.filter(x => x.claimed).sort((a, b2) => b2.sus[m.id] - a.sus[m.id])[0] || goods.sort((a, b2) => b2.sus[m.id] - a.sus[m.id])[0]; if (pickV) q(`[data-kill="${pickV.id}"]`).click(); }
        else { const a = q('[data-protect]'); if (a) { const cl = living().filter(x => x.id !== m.id && x.claimed && m.sus[x.id] < 1); (q(`[data-protect="${(cl[0] || living().find(x => x.id !== m.id)).id}"]`) || a).click(); } const f = q('[data-follow]'); if (f) { const t = PROTO.topSus(m); (q(`[data-follow="${t.id}"]`) || f).click(); } } }
      q('[data-go="sleep"]').click(); };
    window.apHearing = () => { const m = me(), h = G.hearing; if (h.result) return 'result'; if (h.cur === -1) { if (m.alive) { let t = null; if (team(m) === 'good') { const ts = PROTO.topSus(m); if (ts && m.sus[ts.id] > .9) t = ts; } else { const goods = living().filter(x => team(x) === 'good' && x.id !== m.id); const avg = x => goods.reduce((s, g) => s + g.sus[x.id], 0); t = goods.sort((a, b2) => avg(b2) - avg(a))[0]; } if (t && q(`[data-accuse="${t.id}"]`)) { q(`[data-accuse="${t.id}"]`).click(); return 'accused'; } } q('[data-go="vote"]').click(); return 'vote'; }
      if (h.result) return 'result'; const a = h.acc[h.cur]; if (a.votes.you == null && q('[data-vote]')) { let aye; const tg = G.players[a.target]; if (team(m) === 'evil') aye = team(tg) === 'good'; else { const ts = PROTO.topSus(m); aye = ts && ts.id === a.target && m.sus[a.target] > .8; if (!m.alive) aye = aye && m.sus[a.target] > 1.6; } q(`[data-vote="${aye ? 1 : 0}"]`).click(); return 'voted'; } const n = q('[data-go="next"]'); if (n) { n.click(); return 'next'; } return 'wait'; };
    // advance the day by s seconds with the autopilot; stop early on events
    window.apDay = (s) => { const m = me(); let ev = null; const steps = Math.round(s / .05);
      for (let k = 0; k < steps; k++) { if (G.phase !== 'day') return 'phase'; PROTO.update(.05); if (!window.NOFRAME) PROTO.frame(); const md = q('#modal'); if (md.style.display === 'block' && md.classList.contains('found')) return 'found';
        if (!m.alive) continue;
        if (m.state === 'search' || m.path.length) continue;
        const el = G.t - AP.t0;
        if (!AP.claimed && el > 4) { AP.claimed = 1; if (team(m) === 'evil') { PROTO.evilClaim(m); ev = 'talk'; } else { const ni = G.clues.find(c => c.kind === 'info' && c.day === G.day && !c.shared); if (ni) { PROTO.shareClue(ni.id); ev = 'talk'; } } }
        const bd = PROTO.nearBody(); if (bd) { PROTO.doExamine(); const r = G.clues.find(c => c.kind === 'body' && c.set && c.set.length && !c.shared && c.day === G.day); if (r && team(m) === 'good') PROTO.shareClue(r.id); ev = ev || 'examine'; continue; }
        const body = G.bodies.find(x => !x.examined[G.you]); if (body) { m.path = PROTO.findPath(m.x, m.y, body.x + .8, body.y + .4); continue; }
        if (PROTO.nearSpot()) { PROTO.doSearch(); continue; }
        const sp = G.spots.filter(x => !x.searched && !x.busy).sort((a, b2) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b2.x - m.x, b2.y - m.y))[0];
        if (sp) { m.path = PROTO.findPath(m.x, m.y, sp.x, sp.y); continue; }
        if (!AP.done) AP.done = G.t; if (G.t - AP.done > 8) { PROTO.startHearing(); return 'phase'; } }
      if (!m.alive && G.t - AP.t0 > 60) { PROTO.startHearing(); return 'phase'; }
      return ev; }; });
  let n = 0; const frames = [];
  const shot = async (ms) => { if (SCAN) return; const f = `${OUT}/${String(n++).padStart(4, '0')}.png`; await p.screenshot({ path: f }); frames.push([f, ms]); };
  const ev = s => p.evaluate(s); const G = s => p.evaluate(`PROTO.G.${s}`);
  await ev('PROTO.frame()'); await shot(5000);
  await ev("document.querySelector('[data-go=\"night\"]').click(); PROTO.frame()"); await ev('apNight; 0'); 
  for (let guard = 0; guard < 2000; guard++) {
    const ph = await G('phase');
    if (ph === 'over') { await p.waitForTimeout(700); await ev('PROTO.frame()'); await shot(8000); break; }
    if (ph === 'night') { await ev('PROTO.frame()'); await shot(1400); await ev('(()=>{ const m=PROTO.you(); const q=s=>document.querySelector(s); if(m.alive){ if(m.role==="enemy"){} } })()'); await ev(`(()=>{ const q=s=>document.querySelector(s), m=PROTO.you(); const goods=PROTO.living().filter(x=>x.id!==m.id&&PROTO.team(x)==='good'); if(m.alive&&m.role==='enemy'){ const v=goods.filter(x=>x.claimed).sort((a,b)=>b.sus[m.id]-a.sus[m.id])[0]||goods.sort((a,b)=>b.sus[m.id]-a.sus[m.id])[0]; if(v) q('[data-kill="'+v.id+'"]').click(); } else if(m.alive){ const a=q('[data-protect]'); if(a){ const cl=PROTO.living().filter(x=>x.id!==m.id&&x.claimed&&m.sus[x.id]<1); (q('[data-protect="'+((cl[0]||goods[0])||{}).id+'"]')||a).click(); } const f=q('[data-follow]'); if(f){ const t=PROTO.topSus(m); (q('[data-follow="'+t.id+'"]')||f).click(); } } PROTO.frame(); })()`); await shot(2200); await ev("document.querySelector('[data-go=\"sleep\"]').click(); PROTO.frame()"); continue; }
    if (ph === 'dawn') { await ev('PROTO.frame()'); await shot(4200); await ev("document.querySelector('[data-go=\"day\"]').click(); AP.t0 = PROTO.G.t; AP.done = 0; AP.claimed = 0; PROTO.frame()"); continue; }
    if (ph === 'day') { const r = await ev('apDay(2.4)'); if (r === 'found') { await shot(2600); await ev(`(()=>{ const q=s=>document.querySelector(s), m=PROTO.you(), G=PROTO.G; const c=G.clues[0]; const bury = PROTO.team(m)==='evil' && c.set.includes(m.id); if (bury || (PROTO.team(m)==='evil' && c.set.some(id=>PROTO.team(G.players[id])==='evil'))) q('[data-close]').click(); else q('[data-share]').click(); PROTO.frame(); })()`); } else await shot(r === 'talk' || r === 'examine' ? 900 : 160); continue; }
    if (ph === 'dusk') { for (let k = 0; k < 20; k++) { const r = await ev('apHearing()'); await ev('PROTO.frame()'); await shot(r === 'result' ? 4500 : 2200); if (r === 'result') break; }
      if (await G('phase') !== 'over') await ev("document.querySelector('[data-go=\"night\"]') && document.querySelector('[data-go=\"night\"]').click()"); continue; }
    await ev('PROTO.update(.05); PROTO.frame()'); }
  if (!SCAN) fs.writeFileSync(OUT + '/frames.json', JSON.stringify(frames)); console.log(AS, SEED, 'frames', frames.length, 'over', await G('over'), 'day', await G('day'), 'youDied', await G('youDied'), errs.slice(0, 5)); await b.close(); })();
