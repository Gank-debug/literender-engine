// Renders the unnerving Empty Habit drafts in the real engine with the darkness aura. node tdark.js
const { chromium } = require('playwright'); const fs = require('fs'); const OUT = __dirname + '/dark'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(() => { const P = PROTO, G = P.G, V = P.VIEW; G.headless = true; V.cine = true; V.noRing = true; V.scale = 4; G.phase = 'cut';
    for (const el of document.body.children) if (el.id !== 'cv') el.style.display = 'none';
    G.players.forEach(q => q.hidden = true); const a = G.players[0], c = G.players[2]; a.hidden = c.hidden = false; a.x = 10.2; a.y = 16.6; a.face = 7; c.x = 18.2; c.y = 14.2; c.face = 2; a.poseO = c.poseO = 'idle'; a.frO = c.frO = 0;
    V.camT = [13.2, 14.6]; V.cam = [290, 200]; for (let k = 0; k < 40; k++) P.frame(); });
  const shot = async (name) => { await p.evaluate('PROTO.frame()'); await p.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 240, y: 40, width: 800, height: 640 } }); };
  for (const v of ['mimic', 'hands', 'backwards', 'neck', 'crawl']) {
    for (const [mode, dark] of [['lit', 0], ['dark', 7]]) { await p.evaluate(([v, dark]) => { const V = PROTO.VIEW; V.extra = [{ s: KIT.hollow3(1, 'idle', 0, { v }), x: 13.0, y: 13.0, lt: dark ? PROTO.lightAt(13.0, 13.0).map(q => q * .32) : null, dark }]; }, [v, dark]); await shot(`${v}_${mode}`); }
    // animation: twitching idle, then gliding toward camera-left
    for (let t = 0; t < 24; t++) { await p.evaluate(([v, t]) => { const V = PROTO.VIEW; const glide = t >= 12, x = glide ? 13.0 + (t - 12) * .1 : 13.0, y = glide ? 13.0 + (t - 12) * .14 : 13.0;
      const pose = glide ? 'walk' : 'idle', fr = glide ? t % 4 : [0, 0, 0, 1, 1, 2, 3, 0, 0, 2, 0, 0][t];
      V.extra = [{ s: KIT.hollow3(glide ? 0 : 1, pose, fr, { v }), x, y, lt: PROTO.lightAt(x, y).map(q => q * .32), dark: 7 }]; PROTO.G.t += 1 / 8; }, [v, t]); await shot(`${v}_anim_${String(t).padStart(2, '0')}`); } }
  console.log('done', errs); await b.close(); })();
