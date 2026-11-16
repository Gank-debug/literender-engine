// The Hollow Brother theme: one seamless loop played through Web Audio (gapless), started by the first click or key.
// A volume button sits top right; it opens a slider. The level is remembered on this device.
const MUSIC = { ctx: null, gain: null, vol: 0.5, started: false, ready: false, track: 'house', cur: null, vsrc: [] };
// the house theme per map. The town's is four stems that loop together (base, lament, dread, storm): the nights bring them in
// one by one (musicStage), so the drums only come when the game has got that far.
// Over them, in step: the menace (muted guitars, a tom pulse) and the chant when the Strigoi leans to winning, the metal (his victory) when
// the town can no longer last; and every other time round the melancholy turn swaps in for the last eight bars, in every layer.
const TRACKS = () => ({ house: [MUSIC_OGG, MUSIC_MP3], town: typeof TOWN_BASE_OGG !== 'undefined' ? { bpm: 80,
  stems: [[TOWN_BASE_OGG, TOWN_BASE_MP3], [TOWN_LAMENT_OGG, TOWN_LAMENT_MP3], [TOWN_DREAD_OGG, TOWN_DREAD_MP3], [TOWN_STORM_OGG, TOWN_STORM_MP3], [METAL_MENACE_OGG, METAL_MENACE_MP3], [METAL_METAL_OGG, METAL_METAL_MP3], [METAL_CHANT_OGG, METAL_CHANT_MP3]],
  turn: [[TURN_BASE_OGG, TURN_BASE_MP3], [TURN_LAMENT_OGG, TURN_LAMENT_MP3], [TURN_DREAD_OGG, TURN_DREAD_MP3], [TURN_STORM_OGG, TURN_STORM_MP3], [METAL_TMENACE_OGG, METAL_TMENACE_MP3], [METAL_TMETAL_OGG, METAL_TMETAL_MP3], [METAL_TCHANT_OGG, METAL_TCHANT_MP3]], end: [METAL_END_OGG, METAL_END_MP3] } : [MUSIC_OGG, MUSIC_MP3] });
MUSIC.stage = 0; MUSIC.threat = 0; MUSIC.bar = 4 * 60 / 62; MUSIC.turnAt = -1; MUSIC.busy = 0;
// the gain each town layer wants: the stems by the day; with the menace every stem plays; under the metal the stems sit back a little
const want = (i, st, th) => th >= 2 ? [.75, .75, .75, .6, 0, 1, .9][i] : th === 1 ? [1, 1, 1, 1, .9, 0, 1][i] : i <= st && i < 4 ? 1 : 0;   // nothing drops out as the threat comes   // the seventh layer: the chant, from the menace on
// start a track's loop at time n (all its stems together, in step), fading in over f seconds
function loopUp(k, n, f) { const ctx = MUSIC.ctx, tr = TRACKS()[k] || TRACKS().house, list = tr.stems || [tr];
  return Promise.all(list.map(([o, m]) => musicDecode(o, m))).then(bufs => { n = Math.max(n, ctx.currentTime + .02);
    const lg = MUSIC.loopGain = ctx.createGain(); lg.gain.setValueAtTime(0, n); lg.gain.linearRampToValueAtTime(1, n + f); lg.connect(MUSIC.gain);
    MUSIC.srcs = bufs.map((b, i) => { const g = ctx.createGain(); g.gain.value = tr.stems ? want(i, MUSIC.stage, MUSIC.threat) : 1; g.connect(lg); const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(g); s.start(n); return { s, g }; });
    MUSIC.src = MUSIC.srcs[0].s; MUSIC.stems = !!tr.stems; MUSIC.turnAt = -1; MUSIC.busy = 0; MUSIC.turnBufs = null; if (tr.turn) Promise.all(tr.turn.map(([o, m]) => musicDecode(o, m))).then(b => { MUSIC.turnBufs = b; }).catch(() => {}); MUSIC.bar = 4 * 60 / (tr.bpm || 62); MUSIC.t0 = n; MUSIC.dur = bufs[0].duration; MUSIC.cur = k; MUSIC.live = true; MUSIC.victoryOn = false; }); }
const stopLoop = (t, list) => { for (const x of list || [...(MUSIC.srcs || []), ...(MUSIC.turnSrcs || [])]) try { x.s.stop(t); } catch (e) {} };
// the town's stage: 0 the figure and the heartbeat, 1 the lament, 2 the dread, 3 the storm. Changes ride in over two bars.
function musicStage(st, th = MUSIC.threat) { MUSIC.stage = st; MUSIC.threat = th; musicApply(); }
function musicApply() { if (!MUSIC.ctx || !MUSIC.stems || MUSIC.victoryOn || MUSIC.taunting || !MUSIC.srcs) return; const ctx = MUSIC.ctx, n = ctx.currentTime; if (n < MUSIC.busy) return;
  MUSIC.srcs.forEach((x, i) => { const w = want(i, MUSIC.stage, MUSIC.threat); if (x.w === w) return; x.w = w; const g = x.g.gain; g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(w, n + MUSIC.bar * (i >= 4 ? 1 : 2)); }); }
// every other time round, whatever the stage, the turn (every layer has its turned self): on bar 25 the stems step aside for their turned selves, and come back on bar 1
function musicTurnTick() { if (!MUSIC.ctx || !MUSIC.stems || !MUSIC.turnBufs || MUSIC.victoryOn || MUSIC.taunting) return; const ctx = MUSIC.ctx, n = ctx.currentTime, bar = MUSIC.bar;
  const k = Math.floor((n - MUSIC.t0) / MUSIC.dur), T = MUSIC.t0 + k * MUSIC.dur + 24 * bar; if (k % 2 !== 1 || MUSIC.turnAt === k || T - n < .3 || T - n > 5 || n < MUSIC.busy) return;
  MUSIC.turnAt = k; const E = T + 8 * bar; MUSIC.busy = E + .1; MUSIC.turnSrcs = [];
  MUSIC.srcs.forEach((x, i) => { const w = want(i, MUSIC.stage, MUSIC.threat), g = x.g.gain; if (!w || !MUSIC.turnBufs[i]) return; x.w = w; g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.setValueAtTime(w, T - .03); g.linearRampToValueAtTime(0, T + .02); g.setValueAtTime(0, E - .03); g.linearRampToValueAtTime(w, E + .02);
    const tg = ctx.createGain(); tg.gain.setValueAtTime(0, T - .03); tg.gain.linearRampToValueAtTime(w, T + .02); tg.gain.setValueAtTime(w, E - .03); tg.gain.linearRampToValueAtTime(0, E + .25); tg.connect(MUSIC.loopGain);
    const s = ctx.createBufferSource(); s.buffer = MUSIC.turnBufs[i]; s.connect(tg); s.start(T); s.stop(E + .3); MUSIC.turnSrcs.push({ s, g: tg }); }); }
// where the town stands: the day sets the stems; the balance of the living (the host's word, G.mus) sets the threat
const townStageOf = day => day >= 6 ? 3 : day >= 4 ? 2 : day >= 2 ? 1 : 0;
setInterval(() => { try { if (typeof G === 'undefined' || !G || !G.players) return; musicStage(townStageOf(G.over ? 6 : (G.day || 1)), G.over === 'evil' ? 2 : (G.mus || 0)); musicTurnTick(); } catch (e) {} }, 500);
try { const v = localStorage.getItem('hollow-vol'); if (v != null) MUSIC.vol = Math.max(0, Math.min(1, +v)); } catch (e) {}
const musicLevel = v => v * v * 0.9;   // a gentle curve: the slider feels even to the ear
function musicStart() {
  if (MUSIC.started) return; MUSIC.started = true;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = MUSIC.ctx = new AC(), g = MUSIC.gain = ctx.createGain(); g.gain.value = 0; const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -6; comp.knee.value = 6; comp.ratio.value = 8; comp.attack.value = .005; comp.release.value = .25; g.connect(comp); comp.connect(ctx.destination);
  const bytes = b64 => { const bin = atob(b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; };
  const decode = b64 => new Promise((ok, no) => { try { const p = ctx.decodeAudioData(bytes(b64), ok, no); if (p && p.then) p.then(ok, no); } catch (e) { no(e); } });
  loopUp(MUSIC.track, ctx.currentTime, .01).then(() => {
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(musicLevel(MUSIC.vol), ctx.currentTime + 4); MUSIC.ready = true; volUI();
  }).catch(() => {});
}
function musicSet(v) { MUSIC.vol = v; try { localStorage.setItem('hollow-vol', String(v)); } catch (e) {} if (MUSIC.gain) MUSIC.gain.gain.setTargetAtTime(musicLevel(v), MUSIC.ctx.currentTime, 0.08); if (v > 0 && MUSIC.ctx && MUSIC.ctx.state === 'suspended') MUSIC.ctx.resume(); volUI(); }
function volIcon(v) { const w = v <= 0 ? '<path d="M15 9l5 6M20 9l-5 6" stroke="currentColor" stroke-width="2" fill="none"/>' : (v < .5 ? '<path d="M15 9.5q2 2.5 0 5" stroke="currentColor" stroke-width="2" fill="none"/>' : '<path d="M15 9.5q2 2.5 0 5M17.5 7q4 5 0 10" stroke="currentColor" stroke-width="2" fill="none"/>');
  return `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/>${w}</svg>`; }
function volUI() {
  let w = document.getElementById('volw');
  if (!w) {
    w = document.createElement('div'); w.id = 'volw';
    w.innerHTML = `<button class="btn" id="volb" title="Music volume"></button><div id="volpop"><div class="vh">Music</div><input id="volr" type="range" min="0" max="100" step="1"><div class="vrow"><span id="volv"></span><button class="btn" id="volm"></button></div></div>`;
    document.body.appendChild(w);
    document.getElementById('volb').onclick = e => { e.stopPropagation(); musicStart(); w.classList.toggle('open'); volUI(); };
    document.getElementById('volr').oninput = e => { musicStart(); musicSet(+e.target.value / 100); };
    document.getElementById('volm').onclick = e => { e.stopPropagation(); musicStart(); if (MUSIC.vol > 0) { MUSIC.last = MUSIC.vol; musicSet(0); } else musicSet(MUSIC.last || .5); };
    w.onclick = e => e.stopPropagation();
    document.addEventListener('pointerdown', e => { if (!w.contains(e.target)) w.classList.remove('open'); });
  }
  document.getElementById('volb').innerHTML = volIcon(MUSIC.vol);
  const r = document.getElementById('volr'); if (document.activeElement !== r) r.value = Math.round(MUSIC.vol * 100);
  document.getElementById('volv').textContent = MUSIC.vol <= 0 ? 'Silent' : Math.round(MUSIC.vol * 100) + '%';
  document.getElementById('volm').textContent = MUSIC.vol > 0 ? 'Mute' : 'Unmute';
}
addEventListener('pointerdown', musicStart, { once: true }); addEventListener('keydown', musicStart, { once: true });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', volUI); else setTimeout(volUI, 0);

// When the Hollow Brother wins (Devil May Cry 5 style): the victory layer is the same 40 bars as the dark loop, so it fades in
// on the next bar wherever the loop is; at the end of that 8-bar section (at least 3 bars on) the ending takes over.
const LOOP_BAR = 4 * 60 / 62;
function musicVictory() {
  if (MUSIC.victoryOn || !MUSIC.ctx || !MUSIC.src) return; MUSIC.victoryOn = true; const ctx = MUSIC.ctx;
  // in the town: every stem surges up to the next chord change, the victory's own first chord swells in reversed, and on the line
  // the loop cuts out and the wall of guitars takes over, at the same tempo; it plays once
  if (MUSIC.stems) { const tr = TRACKS().town; musicDecode(tr.end[0], tr.end[1]).then(end => { const bar = MUSIC.bar, now = ctx.currentTime + .15, pos = (now - MUSIC.t0) % MUSIC.dur, b = Math.ceil(pos / bar);
      for (const x of MUSIC.turnSrcs || []) { try { x.g.gain.cancelScheduledValues(now); x.g.gain.setTargetAtTime(0, now, .2); x.s.stop(now + 1.5); } catch (e) {} } MUSIC.busy = 0;
      MUSIC.srcs.forEach((x, i) => { const w = want(i, 0, 2), g = x.g.gain; x.w = w; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(w, now + (b * bar - pos) + .02); });
      const tb = Math.ceil((b + 16) / 16) * 16, te = now + (tb * bar - pos);                     // the last chord: a phrase line at least sixteen bars on
      const lg = MUSIC.loopGain.gain; lg.cancelScheduledValues(now); lg.setValueAtTime(lg.value, now); lg.setValueAtTime(1, te - .04); lg.linearRampToValueAtTime(0, te + .06);
      const eg = ctx.createGain(); eg.gain.value = 1.3; eg.connect(MUSIC.gain); const es = ctx.createBufferSource(); es.buffer = end; es.connect(eg); es.start(te); MUSIC.vsrc.push({ s: es, g: eg });
      stopLoop(te + .3); MUSIC.live = false; MUSIC.victoryAt = { at: now, te, b, tb, metal: true }; }).catch(() => { MUSIC.victoryOn = false; }); return; }
  const LOOP_BAR = MUSIC.bar;
  const bytes = b64 => { const bin = atob(b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; };
  const decode = (o, m) => new Promise((ok, no) => { try { const p = ctx.decodeAudioData(bytes(o), ok, no); if (p && p.then) p.then(ok, no); } catch (e) { no(e); } }).catch(() => new Promise((ok, no) => ctx.decodeAudioData(bytes(m), ok, no)));
  Promise.all([decode(LAYER_OGG, LAYER_MP3), decode(ENDING_OGG, ENDING_MP3)]).then(([layer, ending]) => {
    const now = ctx.currentTime + .15, pos = (now - MUSIC.t0) % MUSIC.dur, b = Math.ceil(pos / LOOP_BAR), at = now + (b * LOOP_BAR - pos);
    // the victory runs one whole loop (40 bars) before the ending, landing on a section line
    const loopBars = Math.round(MUSIC.dur / LOOP_BAR); let end = (Math.floor((b + loopBars) / 8) + 1) * 8; if (end - b < loopBars) end += 8; const te = at + (end - b) * LOOP_BAR;
    // the layer: started half a bar early, in step with the loop, swelling in to land on the bar line
    const ts = Math.max(ctx.currentTime + .02, at - LOOP_BAR / 2), lg = ctx.createGain(); lg.gain.setValueAtTime(0, ts); lg.gain.linearRampToValueAtTime(2, at + .2); lg.connect(MUSIC.gain);
    const ls = ctx.createBufferSource(); ls.buffer = layer; ls.loop = true; ls.connect(lg); ls.start(ts, (ts - MUSIC.t0) % MUSIC.dur); MUSIC.vsrc.push({ s: ls, g: lg }); MUSIC.live = false;
    // the ending lands on the section line; loop and layer let go under it
    const eg = ctx.createGain(); eg.gain.value = 2; eg.connect(MUSIC.gain); const es = ctx.createBufferSource(); es.buffer = ending; es.connect(eg); es.start(te); MUSIC.vsrc.push({ s: es, g: eg });
    for (const g of [MUSIC.loopGain.gain, lg.gain]) { g.setValueAtTime(g === lg.gain ? 2 : 1, te); g.linearRampToValueAtTime(0, te + 1.5); }
    stopLoop(te + 2); ls.stop(te + 2); MUSIC.victoryAt = { at, te, b, end };
  }).catch(() => {});
}

// The Hollow's own theme, for the Taking: a chant that sinks as he changes ('bed'), then held breath and the blow ('sting').
// 'leave' lets it go when he is turned away; 'off' gives the night back to the loop.
const TAKE = { on: [], p: null };
function musicDecode(o, m) { const ctx = MUSIC.ctx, bytes = b64 => { const bin = atob(b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; };
  return new Promise((ok, no) => { try { const p = ctx.decodeAudioData(bytes(o), ok, no); if (p && p.then) p.then(ok, no); } catch (e) { no(e); } }).catch(() => new Promise((ok, no) => ctx.decodeAudioData(bytes(m), ok, no))); }
function musicTake(stage) { const ctx = MUSIC.ctx; if (!ctx || !MUSIC.gain) return; const lg = MUSIC.loopGain && MUSIC.loopGain.gain;
  const fadeAll = tc => { const n = ctx.currentTime; for (const s of TAKE.on) { s.g.gain.cancelScheduledValues(n); s.g.gain.setTargetAtTime(0, n, tc); try { s.src.stop(n + tc * 6); } catch (e) {} } TAKE.on = []; };
  if (stage === 'off') { fadeAll(1); if (lg && !MUSIC.victoryOn) { lg.cancelScheduledValues(ctx.currentTime); lg.setTargetAtTime(1, ctx.currentTime + 1.5, 1.4); } return; }
  if (stage === 'leave') { fadeAll(.9); return; }
  TAKE.p = TAKE.p || Promise.all([musicDecode(TAKE_BED_OGG, TAKE_BED_MP3), musicDecode(TAKE_STING_OGG, TAKE_STING_MP3)]);
  TAKE.p.then(([bed, sting]) => { const n = ctx.currentTime; if (lg && !MUSIC.victoryOn) { lg.cancelScheduledValues(n); lg.setTargetAtTime(.1, n, .5); }
    fadeAll(stage === 'sting' ? .25 : .4); const g = ctx.createGain(); g.gain.value = stage === 'sting' ? 2.2 : 1.8; g.connect(MUSIC.gain);
    const src = ctx.createBufferSource(); src.buffer = stage === 'sting' ? sting : bed; src.connect(g); src.start(n + .02); TAKE.on.push({ g, src }); }).catch(() => {}); }
// An innocent hangs: the Hollow's victory layer rises over the loop for two bars, as if he were already winning, then sinks back.
function musicTaunt() { if (!MUSIC.ctx || !MUSIC.src || MUSIC.victoryOn || MUSIC.taunting || (MUSIC.stems && (MUSIC.threat || MUSIC.ctx.currentTime < MUSIC.busy))) return; const ctx = MUSIC.ctx; MUSIC.taunting = true; const LOOP_BAR = MUSIC.bar;
  if (MUSIC.stems) { const bar = MUSIC.bar, now = ctx.currentTime + .1, pos = (now - MUSIC.t0) % MUSIC.dur, at = now + (Math.ceil(pos / bar) * bar - pos);
    MUSIC.srcs.forEach((x, i) => { if (i <= MUSIC.stage || i > 3) return; const g = x.g.gain; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(1.1, at + .2); g.setValueAtTime(1.1, at + 2 * bar); g.linearRampToValueAtTime(0, at + 3 * bar); });
    setTimeout(() => { MUSIC.taunting = false; MUSIC.srcs.forEach(x => { x.w = null; }); musicApply(); }, (at - ctx.currentTime + 3.2 * bar) * 1000); return; }
  (MUSIC.layerP = MUSIC.layerP || musicDecode(LAYER_OGG, LAYER_MP3)).then(layer => { if (MUSIC.victoryOn) { MUSIC.taunting = false; return; }
    const now = ctx.currentTime + .15, pos = (now - MUSIC.t0) % MUSIC.dur, b = Math.ceil(pos / LOOP_BAR), at = now + (b * LOOP_BAR - pos), ts = Math.max(ctx.currentTime + .02, at - LOOP_BAR / 2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(2, at + .2); g.gain.setValueAtTime(2, at + 2 * LOOP_BAR); g.gain.linearRampToValueAtTime(0, at + 3.2 * LOOP_BAR); g.connect(MUSIC.gain);
    const s = ctx.createBufferSource(); s.buffer = layer; s.loop = true; s.connect(g); s.start(ts, (ts - MUSIC.t0) % MUSIC.dur); s.stop(at + 3.4 * LOOP_BAR); s.onended = () => { MUSIC.taunting = false; }; }).catch(() => { MUSIC.taunting = false; }); }

// When the faithful win (as the Hollow's victory does): wait for the next bar line of the house loop wherever it is, swell into it
// with the theme's own first bell played backwards, land the theme's first downbeat on that bar line, and let the loop go over one bar.
// It plays once and does not loop.
function musicFaithful() { if (MUSIC.victoryOn || !MUSIC.ctx || !MUSIC.src) return; MUSIC.victoryOn = true; const ctx = MUSIC.ctx, LOOP_BAR = MUSIC.bar;
  musicDecode(FAITH_OGG, FAITH_MP3).then(buf => {
    const now = ctx.currentTime + .15, pos = (now - MUSIC.t0) % MUSIC.dur; let b = Math.ceil(pos / LOOP_BAR), at = now + (b * LOOP_BAR - pos);
    const SW = Math.min(1.8, LOOP_BAR / 2); if (at - ctx.currentTime < SW + .05) { at += LOOP_BAR; b++; }
    for (const s of TAKE.on) { try { s.src.stop(ctx.currentTime + .5); } catch (e) {} } TAKE.on = [];
    // the swell: the first moments of the theme, reversed, rising into the bar line
    const n = Math.floor(SW * buf.sampleRate), rv = ctx.createBuffer(buf.numberOfChannels, n, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) { const src = buf.getChannelData(c), dst = rv.getChannelData(c); for (let i = 0; i < n; i++) dst[i] = src[n - 1 - i]; }
    const sg = ctx.createGain(); sg.gain.setValueAtTime(0, at - SW); sg.gain.linearRampToValueAtTime(1.1, at - .05); sg.gain.linearRampToValueAtTime(0, at + .1); sg.connect(MUSIC.gain);
    const ss = ctx.createBufferSource(); ss.buffer = rv; ss.connect(sg); ss.start(at - SW); ss.stop(at + .15);
    // the theme, its first downbeat on the bar line; the loop holds to the line, then fades over one bar
    const g = ctx.createGain(); g.gain.value = 1.3; g.connect(MUSIC.gain); const s = ctx.createBufferSource(); s.buffer = buf; s.connect(g); s.start(at); MUSIC.vsrc.push({ s, g }, { s: ss, g: sg }); MUSIC.live = false;
    const lg = MUSIC.loopGain.gain; lg.cancelScheduledValues(ctx.currentTime); lg.setValueAtTime(lg.value, ctx.currentTime); lg.setValueAtTime(lg.value, at); lg.linearRampToValueAtTime(0, at + LOOP_BAR);
    stopLoop(at + LOOP_BAR + .2); MUSIC.faithAt = { at, b };
  }).catch(() => { MUSIC.victoryOn = false; }); }

// switch the house theme (a new map), or bring it back after a victory (a new game): crossfade over a couple of seconds
function musicTrack(k) { MUSIC.track = k; if (!MUSIC.ctx || !MUSIC.ready) return; if (MUSIC.cur === k && MUSIC.live && !MUSIC.victoryOn) return; const ctx = MUSIC.ctx, n = ctx.currentTime, old = MUSIC.srcs, og = MUSIC.loopGain;
  if (k !== MUSIC.cur || MUSIC.victoryOn) MUSIC.stage = 0;
  for (const v of MUSIC.vsrc) { try { v.g.gain.cancelScheduledValues(n); v.g.gain.setTargetAtTime(0, n, .5); v.s.stop(n + 3); } catch (e) {} } MUSIC.vsrc = [];
  if (og) { try { og.gain.cancelScheduledValues(n); og.gain.setValueAtTime(og.gain.value, n); og.gain.linearRampToValueAtTime(0, n + 2.5); stopLoop(n + 2.6, old); } catch (e) {} }
  loopUp(k, n, 2.5).catch(() => {}); }
