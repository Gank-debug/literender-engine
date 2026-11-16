// Night-scene drafts rendered with the game's own engine. node cine.js compline|vigil|taking
const { chromium } = require('playwright'); const fs = require('fs');
const SC = process.argv[2] || 'compline', OUT = `${__dirname}/cine_${SC}`; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const TF = JSON.parse(fs.readFileSync(__dirname + '/../sprites/tf_sprites.json'));
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=${SC === 'compline' ? 'off' : 'sight'}`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  await p.evaluate(async (TF) => {
    const P = PROTO, G = P.G, V = P.VIEW; G.headless = true; V.cine = true; V.noRing = true;
    for (const el of document.body.children) if (el.id !== 'cv') el.style.display = 'none';
    const ld = u => new Promise(r => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); r({ w: im.width, h: im.height, ox: -28, oy: -97, data: x.getImageData(0, 0, im.width, im.height).data }); }; im.src = u; });
    window.HF = (face, pose, k) => KIT.hollow3(face, pose, k, { v: 'neck' });
    // the creature as a scene object: m = 0 a black-habited monk, 1 the Long Neck; its darkness and its own dimness grow with m
    window.MON = (face, pose, k, m, jerk) => { const L = PROTO.lightAt(EN.x, EN.y), d = 1 - .85 * m; return { s: KIT.hollow3(face, pose, k, { v: 'neck', morph: Math.round(m * 20) / 20, jerk }), x: EN.x, y: EN.y, lt: L.map(q => q * d), dark: 6 * m }; };
    window.EN = { x: 0, y: 0 };
    const faceOf = (dx, dy) => { const a = Math.atan2(dy, dx); return ((Math.round((a - Math.PI / 4) / (Math.PI / 4)) % 8) + 8) % 8; };
    window.M = { movers: [], walk(q, x, y, sp = 1.5) { q.cp = P.findPath(q.x, q.y, x, y); q.sp = sp; if (!this.movers.includes(q)) this.movers.push(q); },
      tick(dt) { for (const q of this.movers) { if (!q.cp || !q.cp.length) { if (q.state === 'walk') q.state = 'idle'; continue; } const [tx, ty] = q.cp[0], dx = tx - q.x, dy = ty - q.y, d = Math.hypot(dx, dy), m = q.sp * dt; q.state = 'walk'; q.face = faceOf(dx, dy);
        if (d <= m) { q.x = tx; q.y = ty; q.cp.shift(); } else { q.x += dx / d * m; q.y += dy / d * m; } q.dist = (q.dist || 0) + m; } } };
    window.faceOf = faceOf;
    // overlay: letterbox, caption, fade, red flash
    window.OV = { cap: '', sub: '', fade: 0, red: 0, dim: 0, tint: null };
    V.scale = 4;
    window.draw = () => { P.frame(); const cv = document.getElementById('cv'), x = cv.getContext('2d'), W = cv.width, H = cv.height, sc = V.scale;
      // candle glow: additive warm pools around every lit candle
      x.globalCompositeOperation = 'lighter';
      for (const q of G.players) { if (q.hidden || !q.o.prop) continue; const [sx, sy] = P.isoP(q.x + .35, q.y + .1, 27), X = (sx - V.cam[0]) * sc, Y = (sy - V.cam[1]) * sc, r = (9 + Math.sin(G.t * 13 + q.id) * .8) * sc;
        const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(255,170,80,${(OV.candle == null ? .32 : OV.candle)})`); g.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2); }
      x.globalCompositeOperation = 'source-over';
      if (OV.tint) { x.fillStyle = OV.tint; x.fillRect(0, 0, W, H); }
      if (OV.dim) { x.fillStyle = `rgba(0,0,0,${OV.dim})`; x.fillRect(0, 0, W, H); }
      if (OV.red) { x.fillStyle = `rgba(120,0,0,${OV.red})`; x.fillRect(0, 0, W, H); }
      if (OV.fade) { x.fillStyle = `rgba(0,0,0,${OV.fade})`; x.fillRect(0, 0, W, H); }
      x.fillStyle = '#000'; x.fillRect(0, 0, W, 78); x.fillRect(0, H - 96, W, 96);
      x.textAlign = 'center'; if (OV.cap) { x.font = '44px "Jacquard 24"'; x.fillStyle = '#d8b060'; x.fillText(OV.cap, W / 2, H - 48); }
      if (OV.sub) { x.font = '20px "Pixelify Sans"'; x.fillStyle = 'rgba(236,226,200,.85)'; x.fillText(OV.sub, W / 2, H - 16); } };
  }, TF);
  let n = 0; const shot = async () => { await p.evaluate('draw()'); await p.screenshot({ path: `${OUT}/${String(n++).padStart(4, '0')}.png` }); };
  const run = async (sec, fn = '') => { const N = Math.round(sec * 12); for (let k = 0; k < N; k++) { await p.evaluate(`(()=>{ const t=${k}/${N}; ${fn}; M.tick(1/12); PROTO.G.t += 1/12; PROTO.VIEW.fi = Math.floor(PROTO.G.t*6)%4; })()`); await shot(); } };
  const ev = s => p.evaluate(s);
  if (SC === 'compline') {
    await ev(`(()=>{ const G=PROTO.G; G.phase='cut'; const pts=[[12,4],[13.5,6],[15,4.5],[16.5,7],[18,5],[19.5,7.5],[14,8],[17.5,8.6],[20.5,5],[12.5,7.5]];
      G.players.forEach((q,i)=>{ q.x=pts[i][0]; q.y=pts[i][1]; q.o={...q.o, prop:'candle'}; q.face=1; q.poseO='pray'; q.frO=0; q.state='idle'; });
      PROTO.VIEW.camT=[16,6]; PROTO.VIEW.cam=[200,40]; for (const q of G.players) for (let f=0;f<8;f++){ for(let k=0;k<4;k++) PROTO.KIT.person(q.o,f,'walk',k); PROTO.KIT.person(q.o,f,'pray',0); PROTO.KIT.person(q.o,f,'pray',1); } })()`);
    await run(2.4, `OV.cap='Compline'; OV.sub='The last office is sung in the dark chapel.'; OV.fade=Math.max(0,1-t*2.5); PROTO.G.players.forEach(q=>q.frO=Math.floor(t*4+q.id)%2)`);
    await ev(`(()=>{ const G=PROTO.G; G.players.forEach((q,i)=>{ q.poseO=null; q.frO=null; setTimeout(()=>{},0); q.delay=i*0.22; }); })()`);
    // file out of the chapel door, across the cloister, into the dormitory
    await run(10, `OV.cap='Compline'; OV.sub= t<.5 ? 'The brothers file out with their candles, two by two.' : 'The dormitory door is barred until Lauds.';
      const G=PROTO.G; G.players.forEach(q=>{ if(q.delay!=null){ q.delay-=1/12; if(q.delay<=0){ q.delay=null; q.leg=1; M.walk(q,15.8,11.2,2.6);} } else if(q.leg===1 && !q.cp.length){ q.leg=2; M.walk(q,9.2,22.8,2.6);} else if(q.leg===2 && !q.cp.length){ q.leg=3; M.walk(q,3+ (q.id%4)*1.2,20+Math.floor(q.id/4)*2.2,2.2);} });
      const mv=G.players.filter(q=>q.leg===1||q.leg===2); if(mv.length){ const cx=mv.reduce((s,q)=>s+q.x,0)/mv.length, cy=mv.reduce((s,q)=>s+q.y,0)/mv.length; const c=PROTO.VIEW.camT; c[0]+=(cx-c[0])*.08; c[1]+=(cy-c[1])*.08; }`);
    await run(2.6, `OV.cap='Compline'; OV.sub='One by one the candles go out.'; const G=PROTO.G; const k=Math.floor(t*11); G.players.forEach(q=>{ if(q.id<k && q.o.prop){ q.o={...q.o}; delete q.o.prop; } }); OV.dim=t*.55; OV.fade=Math.max(0,(t-.75)*4)`);
  }
  if (SC === 'vigil') {
    await ev(`(()=>{ const G=PROTO.G, me=PROTO.you(); G.phase='cut'; G.players.forEach(q=>{ q.hidden=true; }); me.hidden=false; me.x=14.6; me.y=6.4; me.face=0; me.poseO='pray'; me.frO=0;
      PROTO.VIEW.camT=[15.5,9.5]; PROTO.VIEW.cam=[260,150]; for(let f=0;f<8;f++){ PROTO.KIT.person(me.o,f,'pray',0); PROTO.KIT.person(me.o,f,'pray',1); PROTO.KIT.person(me.o,f,'idle',0); }
      EN.x=8.4; EN.y=18.2; PROTO.VIEW.extra=[]; })()`);
    await run(2.6, `OV.cap='The Vigil'; OV.sub='You keep watch in the Chapel. Past midnight, the house is silent.'; OV.fade=Math.max(0,1-t*2); PROTO.you().frO=Math.floor(t*3)%2`);
    await ev(`M.walk(EN,15.2,12.6,1.15)`);
    // a brother crosses the cloister. Nothing wrong with him, until he passes the door
    await run(10, `OV.cap='The Vigil'; const m = Math.max(0, Math.min(1, (EN.x - 12.2) / 1.9)); const c = PROTO.VIEW.camT; c[0] += ((EN.x + 14.6) / 2 + .5 - c[0]) * .05; c[1] += ((EN.y + 6.4) / 2 + 1.5 - c[1]) * .05; OV.sub = m < .05 ? 'A brother crosses the cloister. Out of bed, after Compline.' : m < 1 ? 'He slows by the chapel door. Something is wrong with his shape.' : 'He is taller than any brother. His head hangs to one side.';
      if (m > 0 && !EN.slow) { EN.slow = 1; EN.sp = .7; } if (m >= 1 && EN.cp && EN.cp.length && !EN.stop) { EN.stop = 1; EN.cp = []; }
      const me=PROTO.you(); if(m > .2){ me.poseO=null; me.frO=null; me.face=7; } else me.frO=Math.floor(t*6)%2;
      const moving = EN.cp && EN.cp.length, jerk = m > .25 && m < .9 && Math.sin(t * 90) > .6 ? (Math.sin(t * 37) > 0 ? .7 : -.6) : undefined;
      PROTO.VIEW.extra=[MON(moving ? faceOf(1,-.5) : 0, moving ? 'walk' : 'idle', moving ? Math.floor((EN.dist||0) * 2.2) % 4 : [0,0,0,0,2,0][Math.floor(t*30)%6], m, jerk)]; OV.dim=.02+m*.06`);
    await run(2.4, `OV.cap='The Vigil'; OV.sub='Then he is gone. You did not see his face.'; PROTO.VIEW.extra=[]; OV.fade=Math.max(0,(t-.3)*1.6)`);
  }
  if (SC === 'taking') {
    await ev(`(()=>{ const G=PROTO.G; G.phase='cut'; const v=G.players[5]; G.you=5; G.players.forEach(q=>{ q.hidden=true; }); v.hidden=false; v.x=28.2; v.y=4.6; v.face=0; v.poseO='pray'; v.frO=0; v.o={...v.o, prop:'candle'};
      for(let f=0;f<8;f++){ PROTO.KIT.person(v.o,f,'pray',0); PROTO.KIT.person(v.o,f,'pray',1); PROTO.KIT.person(v.o,f,'idle',0); for(let k=0;k<4;k++) PROTO.KIT.person(v.o,f,'die',k); }
      PROTO.VIEW.camT=[28,7]; PROTO.VIEW.cam=[420,170]; EN.x=27.9; EN.y=13.2; })()`);
    await run(2.6, `OV.cap='The Scriptorium'; OV.sub='Brother Wulf could not sleep. He prays by one candle.'; OV.fade=Math.max(0,1-t*2); PROTO.G.players[5].frO=Math.floor(t*3)%2`);
    await ev(`M.walk(EN,28.4,6.4,1.15)`);
    await run(7, `OV.cap='The Scriptorium'; const m = Math.max(0, Math.min(1, (9.6 - EN.y) / 2.4)); OV.sub = m < .05 ? 'The door opens. Only a brother, come to sit with him.' : m < 1 ? 'The candle leans away from him.' : 'Wulf does not look up.';
      if (m > 0 && !EN.slow) { EN.slow = 1; EN.sp = .6; }
      const v = PROTO.G.players[5], moving = EN.cp && EN.cp.length, jerk = m > .25 && m < .9 && Math.sin(t * 80) > .55 ? (Math.sin(t * 29) > 0 ? .75 : -.6) : undefined;
      PROTO.VIEW.extra=[MON(moving ? faceOf(.1,-1) : faceOf(v.x-EN.x,v.y-EN.y), moving ? 'walk' : 'idle', moving ? Math.floor((EN.dist||0) * 2.2) % 4 : [0,0,2,0][Math.floor(t*14)%4], m, jerk)];
      OV.dim=m*.18+Math.max(0,Math.sin(t*37))*.08*m; OV.candle=.32*(1-m*.7)+Math.max(0,Math.sin(t*61))*.1*m; if(t > .8){ v.poseO='idle'; v.frO=0; v.face=7; } else v.frO=Math.floor(t*6)%2`);
    await run(.8, `OV.cap=''; OV.sub=''; OV.fade=1; OV.red=0`);
    await run(.6, `OV.fade=.55; OV.red=.85*(1-t); PROTO.VIEW.extra=[]; const v=PROTO.G.players[5]; v.poseO='die'; v.frO=3; v.o={...v.o}; delete v.o.prop;`);
    await run(1.2, `OV.fade=1; OV.red=0; OV.cap='Lauds'; OV.sub=''`);
    // dawn: the brothers find him
    await ev(`(()=>{ const G=PROTO.G; G.you=0; const v=G.players[5]; const ring=[[26.4,6.2],[27.2,7.6],[29.6,7.4],[30.4,5.8],[26.6,3.8]]; [0,1,2,3,4].forEach((id,i)=>{ const q=G.players[id]; q.hidden=false; q.x=ring[i][0]; q.y=ring[i][1]; q.face=faceOf(v.x-q.x,v.y-q.y); q.poseO=i===2?'point':'idle'; q.frO=0; q.o={...q.o, prop: i%2?'candle':undefined}; if(!q.o.prop) delete q.o.prop; for(let f=0;f<8;f++){ PROTO.KIT.person(q.o,f,'idle',0); PROTO.KIT.person(q.o,f,'point',0);} }); OV.candle=.3; const me=G.players[0]; me.x=26.4; me.y=6.2; })()`);
    await run(4, `OV.cap='Lauds'; OV.sub= t<.5 ? 'The bell is rung. Brother Wulf does not come down.' : 'They find him at his desk. The candle is cold.'; OV.fade=Math.max(0,1-t*2.5); OV.tint='rgba(90,110,160,.10)'`);
  }
  console.log(SC, n, 'frames'); await b.close(); })();
