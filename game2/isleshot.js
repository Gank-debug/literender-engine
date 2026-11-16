const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1680, height: 945 } }); p.on('pageerror', e => console.log(e.message));
  await p.goto('file://' + __dirname + '/../game7/crown7.html'); await p.waitForTimeout(4000);
  await p.evaluate(() => { UI.demo = false; document.body.classList.add('demo'); cv.style.transform = ''; for (const id of ['lobby', 'top', 'dock', 'mini', 'corner', 'toasts']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } const L = G.lords[0]; const v = settlements(L.id)[0]; UI.cam.z = 1.6; centerOn(v.vx + 40, v.vy + 20); UI.camGoal = null; });
  await p.waitForTimeout(1500); await p.screenshot({ path: __dirname + '/isle_bg.png' });
  console.log(await p.evaluate(() => [UI.cam.z, G.lords.map(L => L.id + ':' + vp(L.id))].join(' '))); await b.close(); })();
