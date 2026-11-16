// Draft: a bigger role pool and other servants for the Hollow, as cards in the game's own style
const { chromium } = require('playwright');
const GOOD = [
  ['Infirmarer', 'night', 'Each night, keep watch over a brother: he cannot be taken. You read the dead.', 'now'],
  ['Tracker', 'night', 'Each night, follow one brother. At dawn you learn every room he passed through.', 'now'],
  ['Archivist', 'dawn', 'At dawn you learn how many brothers left their rooms, and one who did.', 'now'],
  ['Confessor', 'dawn', 'At dawn you learn three names: one of them serves the Hollow Brother.', 'now'],
  ['Gravedigger', 'dawn', 'At dawn you learn what the last hanged brother truly was.', 'now'],
  ['Bell-ringer', 'night', 'Each night, choose a room. At dawn you learn how many brothers passed through it.', 'new'],
  ['Keeper of Keys', 'night', 'Each night, lock one door. Whoever must pass it goes the long way round, and a brother sleeping behind it cannot be taken.', 'new'],
  ['Watchman', 'night', 'Each night, keep watch in one room. At dawn you learn the habit colour of anyone who came in.', 'new'],
  ['Herbalist', 'once', 'Once, brew a sleeping draught for one brother. If he serves the Hollow, he does nothing that night.', 'new'],
  ['Sacristan', 'dawn', 'At dawn you learn whether a candle was carried in the night, and in which room it was set down.', 'new'],
  ['Precentor', 'dawn', 'At dawn you learn how many of the three brothers nearest you at Compline serve the Hollow: none, or some.', 'new'],
  ['Mason', 'dawn', 'You know the walls. At dawn you learn whether any trace in the house was wiped away.', 'new'],
  ['Scribe', 'day', 'Once a day, read one brother\'s casebook: you learn one clue he has kept back.', 'new'],
  ['Prior', 'hearing', 'Once, at the Hearing, pardon the brother who goes up. He cannot be hanged that day.', 'new'],
  ['Almoner', 'hearing', 'When the brothers name who goes up, your name counts twice.', 'new'],
  ['Penitent', 'passive', 'If you are hanged, innocent or not, the candle burns back two notches.', 'new'],
  ['Cellarer', 'none', 'You keep the stores and know every face. No gift.', 'now'],
  ['Novice', 'none', 'No gift but your eyes. Search, share, and vote well.', 'now'],
  ['Lay Brother', 'none', 'You keep the fires and the gate. No gift. (Can be dealt twice.)', 'now']];
const EVIL = [
  ['Scrubber', 'Each night, wipe one of the Hollow\'s traces away.', 'now'],
  ['Forger', 'Each night, lay one false trace that points at a brother of your choosing.', 'new'],
  ['Lamb', 'You read as faithful to the Confessor, the Precentor and the Gravedigger.', 'new'],
  ['Hush', 'Each night, silence one gifted brother: his gift tells him nothing at dawn.', 'new'],
  ['Bellwether', 'Your name counts twice at the Hearing, and you know whom the Hollow will take.', 'new'],
  ['Empty Habit', 'You do not know your master; he knows you. If he hangs, the hollow still finds you.', 'new']];
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1640 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${__dirname}/hollow_brother_proto.html?seed=5&scenes=off`); await p.waitForFunction(() => document.getElementById('load').style.display === 'none' && window.HMENU, null, { timeout: 90000 });
  await p.evaluate(() => { document.querySelector('#modal [data-go="night"]').click(); HGAME.hideModal(); });
  await p.evaluate(([GOOD, EVIL]) => { const o = document.createElement('div'); o.id = 'rolesov'; o.style.display = 'flex'; document.body.appendChild(o);
    const tag = { night: 'acts by night', dawn: 'learns at dawn', day: 'by day', hearing: 'at the Hearing', once: 'once a game', passive: 'always', none: 'no gift' };
    const card = (n, t, sub, isNew, ev) => `<div class="rr ${ev ? 'ev' : ''}" style="${isNew ? '' : 'opacity:.72'}"><span class="drop">${n[0]}</span><div class="rn">${n.slice(1)} <small style="color:${isNew ? '#8fbf7a' : '#7c6c50'}">${isNew ? 'new' : 'now'}</small></div><div class="rt">${sub}</div><p>${t}</p></div>`;
    o.innerHTML = `<div class="v rcard" style="width:min(1180px,96vw);max-height:none"><div class="hd" style="font-size:34px"><span class="cap">T</span>he House, enlarged <span class="sub" style="font:14px 'Pixelify Sans'">draft</span></div>
      <p class="sub">Each game deals 9 faithful gifts at random from these 19, so no one can count the roles and find the odd one out. On the first night the Hollow turns one of them; what he becomes is also dealt at random from the six below, and only the Hollow and the turned man know which.</p>
      <div class="hd2" style="font:22px 'Jacquard 24';color:#d8b060;margin-top:8px">The faithful · 19 gifts, 9 in each game</div>
      <div class="rgrid" style="grid-template-columns:1fr 1fr 1fr">${GOOD.map(([n, k, t, s]) => card(n, t, 'Faithful · ' + tag[k], s === 'new')).join('')}</div>
      <div class="hd2" style="font:22px 'Jacquard 24';color:#e07a64;margin-top:8px">The turned · one of six, dealt on the first night</div>
      <div class="rgrid" style="grid-template-columns:1fr 1fr 1fr">${EVIL.map(([n, t, s]) => card(n, t, 'Evil · turned on the first night', s === 'new', 1)).join('')}</div></div>`; }, [GOOD, EVIL]);
  await p.waitForTimeout(400); const r = await p.evaluate(() => { const r = document.querySelector('#rolesov .rcard').getBoundingClientRect(); return { x: r.x - 4, y: r.y - 4, width: r.width + 8, height: r.height + 8 }; });
  await p.screenshot({ path: '/mnt/user-data/outputs/roles_pool_draft.png', clip: r }); console.log(errs, r); await b.close(); })();
