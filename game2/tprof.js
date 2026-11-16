const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await p.goto('file://' + __dirname + '/hollow_brother_proto.html'); await p.waitForFunction(() => document.getElementById('load').style.display === 'none', null, { timeout: 180000 });
  const q = s => p.evaluate(s2 => { const e = document.querySelector(s2); if (e) e.click(); }, s);
  await q('[data-go="night"]'); await p.evaluate(() => { const a = document.querySelector('[data-protect],[data-follow]'); if (a) a.click(); }); await q('[data-go="sleep"]'); await q('[data-go="day"]');
  await p.waitForTimeout(3000);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); await p.waitForTimeout(25000);
  const { profile } = await cdp.send('Profiler.stop');
  const self = {}, byId = {}; for (const n of profile.nodes) byId[n.id] = n; const dt = {}; profile.samples.forEach((s, i) => { dt[s] = (dt[s] || 0) + (profile.timeDeltas[i] || 0); });
  for (const n of profile.nodes) { const k = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self[k] = (self[k] || 0) + (dt[n.id] || 0); }
  const tot = Object.values(self).reduce((a, b) => a + b, 0); console.log(Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + ' ' + (100 * v / tot).toFixed(1) + '%').join('\n'));
  await b.close(); })();
