// The Lords of the Isle theme: one seamless loop played through Web Audio (gapless), started by the first click or key.
// A volume button sits top right; it opens a slider. The level is remembered on this device.
const MUSIC = { ctx: null, gain: null, vol: 0.5, started: false, ready: false };
try { const v = localStorage.getItem('lords-vol'); if (v != null) MUSIC.vol = Math.max(0, Math.min(1, +v)); } catch (e) {}
const musicLevel = v => v * v * 0.9;   // a gentle curve: the slider feels even to the ear
function musicStart() {
  if (MUSIC.started) return; MUSIC.started = true;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = MUSIC.ctx = new AC(), g = MUSIC.gain = ctx.createGain(); g.gain.value = 0; g.connect(ctx.destination);
  const bytes = b64 => { const bin = atob(b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; };
  const decode = b64 => new Promise((ok, no) => { try { const p = ctx.decodeAudioData(bytes(b64), ok, no); if (p && p.then) p.then(ok, no); } catch (e) { no(e); } });
  decode(MUSIC_OGG).catch(() => decode(MUSIC_MP3)).then(buf => {
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(g); s.start();
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(musicLevel(MUSIC.vol), ctx.currentTime + 4); MUSIC.ready = true; volUI();
  }).catch(() => {});
}
function musicSet(v) { MUSIC.vol = v; try { localStorage.setItem('lords-vol', String(v)); } catch (e) {} if (MUSIC.gain) MUSIC.gain.gain.setTargetAtTime(musicLevel(v), MUSIC.ctx.currentTime, 0.08); if (v > 0 && MUSIC.ctx && MUSIC.ctx.state === 'suspended') MUSIC.ctx.resume(); volUI(); }
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
