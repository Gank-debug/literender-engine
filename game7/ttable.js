// The shelf: open The Hollow Brother from the Long Table, play its first night, come back to the shelf.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await p.goto(`file://${__dirname}/crown7.html`); await p.waitForTimeout(6000); await p.screenshot({ path: 'tt_shelf.png' });
  await p.click('#shhollow'); const f = () => p.frame({ url: /srcdoc/ }) || p.frames().find(x => x !== p.mainFrame());
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); const fr = f(); if (fr && await fr.evaluate(() => !!document.getElementById('hmenu') && document.getElementById('load').style.display === 'none').catch(() => false)) break; }
  await p.waitForTimeout(1500); await p.screenshot({ path: 'tt_hollow_menu.png' });
  const fr = f(); console.log('in frame name', await fr.evaluate(() => localStorage.getItem('crown-name')));
  await fr.click('#hsolo'); await p.waitForTimeout(1200); await p.screenshot({ path: 'tt_hollow_game.png' });
  await fr.evaluate(() => HMENU.leave()); await p.waitForTimeout(4000);
  await fr.evaluate(() => document.getElementById('hshelf') && document.getElementById('hshelf').click()).catch(e => console.log('frame gone?', e.message)); await p.waitForTimeout(1500);
  console.log('frame removed', !(await p.$('#hollowf')), 'away', await p.evaluate(() => window.TABLE_AWAY)); await p.screenshot({ path: 'tt_back.png' });
  console.log(errs.slice(0, 5)); await b.close(); })();
