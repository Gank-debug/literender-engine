// The second box on the shelf: The Hollow Brother is its own game, kept whole in its own frame so the two never share a style or a name.
// It shares this page's origin (srcdoc), so the player's name and its saves sit in the same browser storage as Lords of the Isle.
function openHollow(code) { if (document.getElementById('hollowf')) return; window.TABLE_AWAY = true;
  try { if (MUSIC.gain) MUSIC.gain.gain.setTargetAtTime(0, MUSIC.ctx.currentTime, .4); } catch (e) {}
  const f = document.createElement('iframe'); f.id = 'hollowf'; f.title = 'The Hollow Brother'; f.allow = 'autoplay; clipboard-write; fullscreen';
  f.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:99999;background:#05040a;display:block!important;visibility:visible!important';
  f.onload = () => { if (code) f.contentWindow.postMessage({ hollowJoin: code }, '*'); setTimeout(() => f.contentWindow.focus(), 50); };
  f.srcdoc = HOLLOW_HTML; document.body.appendChild(f); }
function closeHollow() { const f = document.getElementById('hollowf'); if (f) f.remove(); window.TABLE_AWAY = false;
  try { if (MUSIC.gain) MUSIC.gain.gain.setTargetAtTime(musicLevel(MUSIC.vol), MUSIC.ctx.currentTime, .6); } catch (e) {} if (typeof lobbyDraw === 'function') lobbyDraw(); }
window.addEventListener('message', e => { const d = e.data || {}; if (d.hollow === 'shelf') closeHollow(); });
