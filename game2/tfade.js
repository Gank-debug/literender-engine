// Fade-in demo for a creature in the cloister. node tfade.js thorn|neck
const { chromium } = require('playwright'); const fs = require('fs'); const WHO = process.argv[2] || 'thorn', OUT = __dirname + '/fade_' + WHO; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(() => { const P = PROTO, G = P.G, V = P.VIEW; G.headless = true; V.cine = true; V.noRing = true; V.scale = 4; G.phase = 'cut';
    for (const el of document.body.children) if (el.id !== 'cv') el.style.display = 'none';
    G.players.forEach(q => q.hidden = true); const a = G.players[0], c = G.players[2]; a.hidden = c.hidden = false; a.x = 10.2; a.y = 16.6; a.face = 7; c.x = 18.2; c.y = 14.2; c.face = 2; a.poseO = c.poseO = 'idle'; a.frO = c.frO = 0;
    V.camT = [12.6, 13.4]; V.cam = [290, 180]; for (let k = 0; k < 40; k++) P.frame(); });
  const spr = WHO === 'thorn' ? "KIT.hollowThorn(1, 'idle', fr)" : "KIT.hollow3(1, 'idle', fr, { v: 'neck' })";
  const N = 48; for (let t = 0; t < N; t++) { const fade = Math.min(1, Math.max(0, (t - 4) / 26)), fr = WHO === 'thorn' ? Math.floor(t / 3) % 4 : (t < 32 ? 0 : [0, 0, 2, 0, 0, 0][Math.floor((t - 32) / 2) % 6]);
    await p.evaluate(`(()=>{ const fr=${fr}; const lit=${t >= N - 6 ? 1 : 0}; PROTO.VIEW.extra=[{ s: ${spr}, x: 13.0, y: 13.0, lt: lit ? null : PROTO.lightAt(13,13).map(q=>q*.32), dark: lit ? 0 : 7, fade: ${fade} }]; PROTO.G.t += 1/10; PROTO.frame(); })()`);
    await p.screenshot({ path: `${OUT}/${String(t).padStart(3, '0')}.png`, clip: { x: 240, y: 0, width: 800, height: 720 } }); }
  console.log(WHO, 'done', errs); await b.close(); })();
