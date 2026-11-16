// Style options sheet: same models, four ways of turning them into pixels, plus each in a scene and walking.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(2000); for (const f of ['kit3.js', 'engine.js', 'monastery.js', 'town.js']) await p.addScriptTag({ path: __dirname + '/' + f });
  const out = await p.evaluate(async () => { await document.fonts.ready; const K = 4, CW = 32, CH = 62, L = 230, strip = ({ name, ...o }) => o;
    const STY = [['clay', 'Now', 'smooth 3D shading'], ['cel', 'A  Cel', '3 hard tones, hue-shifted, clean-up, selective outline'], ['flat', 'B  Flat', '2 tones like your sheet, crisp folds'], ['hand', 'C  Cel + drawn heads', 'A with heads placed pixel by pixel'], ['handflat', 'D  Flat + drawn heads', 'B with heads placed pixel by pixel']];
    const M = KIT.CAST.monastery, T = KIT.CAST.town, P = KIT.CAST.port, chars = [M[0], M[1], M[3], T[1], T[2], P[0]], faces = [0, 1, 2, 4];
    const c = document.createElement('canvas'); c.width = L + chars.length * faces.length * CW * K + 10; c.height = STY.length * CH * K + 20; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#262320'; g.fillRect(0, 0, c.width, c.height);
    STY.forEach(([st, nm, sub], r) => { g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = '600 20px "Pixelify Sans"'; g.fillStyle = r ? '#f4ecd6' : '#9a917e'; g.fillText(nm, 12, 10 + r * CH * K + CH * K / 2 - 14); g.font = '600 13px "Pixelify Sans"'; g.fillStyle = '#9a917e'; const words = sub.split(' '); let line = '', y = 10 + r * CH * K + CH * K / 2 + 10; for (const w of words) { if (g.measureText(line + w).width > L - 24) { g.fillText(line, 12, y); line = ''; y += 16; } line += w + ' '; } g.fillText(line, 12, y);
      chars.forEach((o, ci) => faces.forEach((f, fi) => { const s = KIT.person({ ...strip(o), style: st }, f), x = L + (ci * faces.length + fi) * CW * K, yy = 10 + r * CH * K; g.fillStyle = (ci + r) % 2 ? '#302c28' : '#2b2824'; g.fillRect(x, yy, CW * K, CH * K); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x + CW * K / 2, yy + (CH - 5) * K, 7 * K, 3.5 * K, 0, 0, 7); g.fill(); g.drawImage(s.canvas, x + (CW / 2 + s.ox) * K, yy + (CH - 5 + s.oy) * K, s.w * K, s.h * K); })); });
    // in a scene: the same crop of the monastery and the town at each style
    const scenes = []; for (const [st] of STY) { KIT.style = st; const a = (() => { const m = window.SCENE; return m; })(); scenes.push(st); }
    return c.toDataURL(); });
  fs.writeFileSync(__dirname + '/style_options.png', Buffer.from(out.split(',')[1], 'base64'));
  // scene crops per style
  const crops = [];
  for (const st of ['clay', 'cel', 'flat', 'hand', 'handflat']) {
    for (const [file, box] of [['monastery', [560, 330, 640, 380]], ['town', [460, 230, 640, 380]]]) {
      await p.addScriptTag({ path: __dirname + '/' + file + '.js' });
      const u = await p.evaluate(([st, box]) => { KIT.style = st; const s = SCENE(0, 12), c = document.createElement('canvas'); c.width = box[2]; c.height = box[3]; c.getContext('2d').drawImage(s, box[0], box[1], box[2], box[3], 0, 0, box[2], box[3]); return c.toDataURL(); }, [st, box]);
      fs.writeFileSync(__dirname + `/fr/opt_${file}_${st}.png`, Buffer.from(u.split(',')[1], 'base64')); } }
  // walking, all four options side by side
  const w = await p.evaluate(async () => { await document.fonts.ready; const K = 4, CW = 30, CH = 62, strip = ({ name, ...o }) => o, M = KIT.CAST.monastery, T = KIT.CAST.town, P = KIT.CAST.port, chars = [M[1], T[2], P[2]], STY = ['clay', 'cel', 'flat', 'hand', 'handflat'], LAB = ['Now', 'A', 'B', 'C', 'D'], fr = [];
    for (let t = 0; t < 8; t++) { const c = document.createElement('canvas'); c.width = STY.length * chars.length * 2 * CW * K; c.height = CH * K + 34; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#262320'; g.fillRect(0, 0, c.width, c.height); g.font = '600 20px "Pixelify Sans"'; g.textAlign = 'center'; g.fillStyle = '#e9c46a';
      STY.forEach((st, si) => { g.fillText(LAB[si], (si * chars.length * 2 + chars.length) * CW * K, 18); chars.forEach((o, ci) => [1, 6].forEach((f, fi) => { const s = KIT.person({ ...strip(o), style: st }, f, 'walk', t % 4), x = ((si * chars.length + ci) * 2 + fi) * CW * K, y = 30; g.fillStyle = si % 2 ? '#302c28' : '#2b2824'; g.fillRect(x, y, CW * K, CH * K); g.drawImage(s.canvas, x + (CW / 2 + s.ox) * K, y + (CH - 5 + s.oy) * K, s.w * K, s.h * K); })); }); fr.push(c.toDataURL()); }
    return fr; });
  w.forEach((u, i) => fs.writeFileSync(__dirname + `/fr/optwalk_${String(i).padStart(2, '0')}.png`, Buffer.from(u.split(',')[1], 'base64')));
  await b.close(); })();
