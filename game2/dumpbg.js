const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=21&fog=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 90000 });
  const r = await p.evaluate(() => { const V = PROTO.VIEW, c = document.createElement('canvas'); c.width = V.W; c.height = V.H; const x = c.getContext('2d'); const id = x.createImageData(V.W, V.H); id.data.set(V.frames[0]); x.putImageData(id, 0, 0);
    const spr = (s) => { const k = document.createElement('canvas'); k.width = s.w; k.height = s.h; k.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(s.data), s.w, s.h), 0, 0); return { url: k.toDataURL(), ox: s.ox, oy: s.oy }; };
    const G = PROTO.G, cur = []; for (const id of [0, 1, 2]) { const o = G.players[id].o; cur.push({ idle: [0, 1, 7, 6].map(f => spr(PROTO.KIT.person(o, f, 'idle', 0))), walk: [0, 1, 2, 3].map(k => spr(PROTO.KIT.person(o, 1, 'walk', k))), col: G.players[id].col }); }
    const L = {}; for (const [x, y] of [[4, 12], [5, 13], [6, 12], [14, 4], [15, 5], [16, 4], [12, 14], [13, 15], [14, 14]]) L[x + ',' + y] = { l: PROTO.lightAt(x, y), s: PROTO.isoP(x, y) };
    return { bg: c.toDataURL(), cur, L, dep: Array.from(V.dep, v => v < -1e8 ? -999 : Math.round(v * 10) / 10) }; });
  fs.writeFileSync(__dirname + '/../sprites/scene.json', JSON.stringify(r)); await b.close(); })();
