const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } });
  await p.goto('file://' + __dirname + '/crown7.html'); await p.waitForTimeout(2500); await p.evaluate(() => startGame(424242, ['red'])); await p.waitForTimeout(1800);
  await p.evaluate(fs.readFileSync(__dirname + '/../drafts7/inject.js', 'utf8').replace(/\/\/ --- road colourings[\s\S]*$/, ''));
  await p.evaluate(() => { CQ.q = []; UI.toast = () => {}; ffwd(); document.body.insertAdjacentHTML('beforeend', '<style>.gl,#corner,#afk,#mini,#rtray,#dock,#lords,.help,#toasts,#tb,#charters{display:none!important}</style>'); UI.cam.z = 1; UI.camGoal = null; centerOn(G.world.CX + 330, G.world.CY); UI.camGoal = null; landChanged(); }); await p.waitForTimeout(900);
  const big = (await p.screenshot({ type: 'jpeg', quality: 55 })).toString('base64');
  await p.evaluate(() => { const v = settlements('red')[0]; centerOn(v.vx, v.vy); UI.camGoal = null; }); await p.waitForTimeout(500);
  const card = (await p.screenshot({ type: 'jpeg', quality: 70, clip: { x: 450, y: 280, width: 540, height: 300 } })).toString('base64');
  fs.writeFileSync('cover.js', `const COVER_CROWN = 'data:image/jpeg;base64,${card}', BACK_CROWN = 'data:image/jpeg;base64,${big}';\n`); console.log(big.length, card.length); await b.close(); })();
