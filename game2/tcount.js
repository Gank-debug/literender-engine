// Draft: short countdowns beside the continue buttons (three styles), shown on the real Dawn screen
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); const q = document.querySelector('[data-protect],[data-follow]'); if (q) q.click(); document.querySelector('[data-go="sleep"]').click(); }); await p.waitForTimeout(600);
  await p.addStyleTag({ content: `
    .cd{display:inline-flex;align-items:center;align-self:center;gap:8px;margin-left:12px;font:15px 'Pixelify Sans';color:#a99472;vertical-align:middle}
    .cdA .cnd{position:relative;display:block;flex:none;width:10px;height:34px}.cdA .wax{position:absolute;bottom:0;left:2px;width:6px;height:var(--h);background:linear-gradient(90deg,#f4ead2,#cbbb94);box-shadow:0 0 0 1px #3a2e22}.cdA .fl{position:absolute;left:2px;bottom:calc(var(--h) + 1px);width:6px;height:8px;border-radius:50% 50% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff3c0,#f0a040 60%,transparent 70%);filter:drop-shadow(0 0 4px #f0a040)}
    .cdB .btn.go{position:relative;overflow:hidden}.cdB .btn.go::after{content:'';position:absolute;left:0;bottom:0;height:3px;width:var(--w);background:#d8b060}
    .cdC span.rng{flex:none;position:static;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle,#15100c 10px,transparent 11px),conic-gradient(#d8b060 var(--a),#2a2018 0);display:inline-flex;align-items:center;justify-content:center;font:18px/1 'Jacquard 24';font-style:normal;color:#f4d692}
  ` });
  const shots = [];
  for (const [k, html, cls] of [
    ['A', '<span class="cd cdA"><span class="cnd" style="--h:20px"><i class="wax"></i><i class="fl"></i></span>the day begins in 8</span>', ''],
    ['B', '<span class="cd">8</span>', 'cdB'],
    ['C', '<span class="cd cdC"><span class="rng" style="--a:240deg">8</span>or it begins on its own</span>', '']]) {
    await p.evaluate(([html, cls]) => { HGAME.showDawn(); const m = document.getElementById('modal'), go = m.querySelector('.btn.go'); go.parentElement.classList.add(cls || 'x'); if (cls) { go.style.setProperty('--w', '62%'); go.textContent = 'Begin the day · 8'; } else go.insertAdjacentHTML('afterend', html); }, [html, cls]);
    await p.waitForTimeout(200); const r = await p.evaluate(() => { const r = document.getElementById('modal').getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; });
    await p.screenshot({ path: `cd_${k}.png`, clip: r }); shots.push(k); }
  console.log(errs); await b.close(); })();
