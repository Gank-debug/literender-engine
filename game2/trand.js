// Is the lot fair? Deal 400 online-style games and count the host's and a guest's roles
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=1&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  const r = await p.evaluate(() => { const c = [{}, {}, {}]; for (let s = 1; s <= 400; s++) { HGAME.newGame({ seed: s * 7919 + 13, humans: [0, 1, 2], names: {}, lot: true, scenes: false }); for (const k of [0, 1, 2]) { const ro = PROTO.G.players[k].role; c[k][ro] = (c[k][ro] || 0) + 1; } } return c; });
  console.log(JSON.stringify(r)); await b.close(); })();
