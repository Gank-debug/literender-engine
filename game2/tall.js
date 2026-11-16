const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1500 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); HGAME.hideModal(); document.querySelector('[data-allroles]').click(); }); await p.waitForTimeout(300);
  await p.addStyleTag({ content: '#rolesov .rcard{max-height:none!important} #rolesov .rgrid{grid-template-columns:1fr 1fr 1fr!important}' }); await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const r = document.querySelector('#rolesov .rcard').getBoundingClientRect(); return { x: r.x, y: Math.max(0, r.y), width: r.width, height: Math.min(1500, r.height) }; }); await p.screenshot({ path: '/mnt/user-data/outputs/all_roles_pool.png', clip: r }); console.log(errs, r); await b.close(); })();
