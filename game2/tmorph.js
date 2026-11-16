const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=5'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.KIT, null, { timeout: 90000 });
  await p.addScriptTag({ path: __dirname + '/townkit.js' });
  const url = await p.evaluate(() => { try { const ms = [0, .2, .4, .6, .8, 1], items = [['Townsman', () => KIT.person(PROTO.G.players[1].o, 0, 'idle', 0)], ...ms.map(m => ['morph ' + m, () => TKIT.oldOne(0, m < 1 ? 'walk' : 'idle', 1, { morph: m })]), ['twitch', () => TKIT.oldOne(7, 'idle', 2, {})], ['walk', () => TKIT.oldOne(1, 'walk', 0, {})]];
    const S = 2, CW = 150, cv = document.createElement('canvas'); cv.width = CW * items.length; cv.height = 620; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    for (let row = 0; row < 2; row++) { const night = row === 1, y0 = row * 310; g.fillStyle = night ? '#0d0f16' : '#5a5040'; g.fillRect(0, y0, cv.width, 300);
      items.forEach(([name, f], i) => { const sp = f(), t = document.createElement('canvas'); t.width = sp.w; t.height = sp.h; const id = new ImageData(new Uint8ClampedArray(sp.data), sp.w, sp.h);
        if (night) for (let k = 0; k < sp.w * sp.h; k++) { const a = id.data[k * 4 + 3]; if (a && a !== 254) { id.data[k * 4] *= .32; id.data[k * 4 + 1] *= .36; id.data[k * 4 + 2] *= .5; } }
        for (let k = 0; k < sp.w * sp.h; k++) if (id.data[k * 4 + 3]) id.data[k * 4 + 3] = 255; t.getContext('2d').putImageData(id, 0, 0); const cx = i * CW + CW / 2, by = y0 + 270;
        g.drawImage(t, cx + sp.ox * S, by + sp.oy * S, sp.w * S, sp.h * S); if (!night) { g.fillStyle = '#eee'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText(name, cx, y0 + 292); } }); }
    return cv.toDataURL(); } catch (e) { return 'ERR ' + e.stack; } });
  if (url.startsWith('ERR')) console.log(url); else require('fs').writeFileSync('../shots/oldone_morph.png', Buffer.from(url.split(',')[1], 'base64')); console.log(errs); await b.close(); })();
