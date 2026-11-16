// The town: the Bell-ringer listens at one neighbour's door; the Watchman watches his own house; the Hunter names houses.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const [role, seed] of [['bell', 11], ['watch', 12], ['tracker', 13]]) {
    await p.goto('file://' + __dirname + '/hollow_brother_proto.html?scenes=off&map=town&seed=' + seed + '&role=' + role); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.PROTO && PROTO.G, null, { timeout: 90000 });
    await p.waitForFunction(() => HGAME.mapKey() === 'town', null, { timeout: 60000 });
    const r = await p.evaluate(async (role) => { const G = PROTO.G; const me = PROTO.you(); me.role = role; document.querySelector('[data-go="night"]')?.click(); await new Promise(r => setTimeout(r, 300));
      const btns = [...document.querySelectorAll('#modal [data-ring]')].map(e => e.textContent); const r1 = document.querySelector('#modal [data-ring]'); if (r1) r1.click(); const f = document.querySelector('#modal [data-follow]'); if (f) f.click();
      document.querySelector('[data-go="sleep"]')?.click(); await new Promise(r => setTimeout(r, 1500)); for (let k = 0; k < 8 && PROTO.NIGHT.on(); k++) { PROTO.NIGHT.skip(); await new Promise(r => setTimeout(r, 200)); }
      return { role: me.role, btns: btns.slice(0, 12).join(' | '), dawn: document.querySelector('#modal')?.innerText.slice(0, 400) }; }, role);
    console.log(JSON.stringify(r, null, 1)); }
  console.log(errs); await b.close(); })();
