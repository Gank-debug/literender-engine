// Draft sheet: the Strigoi's true forms and the dead, beside a townsman for scale; lit, and at night.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=5'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.KIT, null, { timeout: 90000 });
  await p.addScriptTag({ path: __dirname + '/townkit.js' });
  const url = await p.evaluate(() => { try {
    const items = [['Townsman', () => KIT.person(PROTO.G.players[1].o, 0, 'idle', 0)], ['(the Hollow, for size)', () => KIT.hollow3(0, 'idle', 0, { v: 'neck', morph: 1 })],
      ['E. the Old One', () => TKIT.strigoi('orlok', 0, 'idle', 0)], ['the Old One (facing)', () => TKIT.strigoi('orlok', 7, 'idle', 2)],
      ['F. the Cloak', () => TKIT.strigoi('count', 0, 'idle', 0)], ['the Cloak (spread)', () => TKIT.strigoi('count', 7, 'idle', 2)],
      ['G. the Feeder', () => TKIT.strigoi('feeder', 0, 'idle', 0)], ['the Feeder (facing)', () => TKIT.strigoi('feeder', 7, 'idle', 0)],
      ['H. the Bat', () => TKIT.strigoi('batwing', 0, 'idle', 0)], ['the Bat (facing)', () => TKIT.strigoi('batwing', 7, 'idle', 2)]];
    const _unused = [['Dead: in the shroud', () => TKIT.dead('shroud', 0, 'walk', 0, 1)], ['Dead: from the lime pit', () => TKIT.dead('pit', 0, 'walk', 1, 2)], ['Dead: a neighbour', () => TKIT.dead('neighbour', 0, 'walk', 2, 3)], ['a neighbour', () => TKIT.dead('neighbour', 1, 'walk', 0, 4)]];
    const S = 2, CW = 170, cv = document.createElement('canvas'); cv.width = CW * items.length; cv.height = 2 * 300 + 20; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    for (let row = 0; row < 2; row++) { const night = row === 1, y0 = row * 310;
      g.fillStyle = night ? '#0d0f16' : '#5a5040'; g.fillRect(0, y0, cv.width, 300);
      items.forEach(([name, f], i) => { const sp = f(); const t = document.createElement('canvas'); t.width = sp.w; t.height = sp.h; const id = new ImageData(new Uint8ClampedArray(sp.data), sp.w, sp.h);
        if (night) for (let k = 0; k < sp.w * sp.h; k++) { const a = id.data[k * 4 + 3]; if (a && a !== 254) { id.data[k * 4] *= .32; id.data[k * 4 + 1] *= .36; id.data[k * 4 + 2] *= .5; } }
        for (let k = 0; k < sp.w * sp.h; k++) if (id.data[k * 4 + 3]) id.data[k * 4 + 3] = 255;
        t.getContext('2d').putImageData(id, 0, 0); const cx = i * CW + CW / 2, by = y0 + 270;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, by, 22, 7, 0, 0, 6.3); g.fill(); if (night && i > 0) { const gr = g.createRadialGradient(cx, by - 60, 10, cx, by - 60, 90); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx - 90, by - 150, 180, 180); }
        g.drawImage(t, cx + sp.ox * S, by + sp.oy * S, sp.w * S, sp.h * S);
        if (!night) { g.fillStyle = '#eee'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText(name, cx, y0 + 292); } }); }
    return cv.toDataURL(); } catch (e) { return 'ERR ' + e.stack; } });
  if (url.startsWith('ERR')) console.log(url); else require('fs').writeFileSync('../shots/creatures_sheet.png', Buffer.from(url.split(',')[1], 'base64'));
  console.log(errs); await b.close(); })();
