# THE LONG TABLE: source and handoff

Source for GANK's two finished-so-far games. The live builds are on the `gh-pages` branch of this repo:
- **Lords of the Isle** (Catan × Reprisal): https://gank-debug.github.io/literender-engine/ (the shelf, `index.html`)
- **The Hollow Brother** (social deduction; monastery + plague town maps): https://gank-debug.github.io/literender-engine/hollow.html

Project docs (in the claude.ai project "CATAN 2") hold the design history: `claude/crown-v0.*` for Lords, `claude/game2-*` for the Hollow; the newest Hollow notes are `claude/game2-hamlet-shutout.md` and `claude/game2-map2-plague-town-strigoi.md`.

## Picking this up in a new chat

1. Clone: `git clone -b source https://github.com/Gank-debug/literender-engine work && cd work`
2. Build Lords: `cd game7 && python3 build.py` → `game7/crown7.html` (the shelf page).
3. Build the Hollow: `cd game2 && python3 build_proto.py` → `game2/hollow_brother_proto.html` (needs `game7/crown7.html` built first: it borrows its fonts from it).
4. Publish: clone the `gh-pages` branch to a second folder, copy `crown7.html` → `index.html` and `hollow_brother_proto.html` → `hollow.html`, commit as GANK (`noreply@users.noreply.github.com`), push.
5. Music re-renders need the instrument samples (not in the repo, 821 MB): `git clone https://github.com/nbrosowsky/tonejs-instruments` next to `music/`. Needs numpy, scipy, ffmpeg. Already-rendered music is in the repo as `game2/town*.js`, `faithmusic.js`, `takemusic.js`, `musicdata.js` (base64 audio).
6. Push this `source` branch too after each change, so the next chat has it.

## Layout

| Path | What |
|---|---|
| `game7/` | Lords of the Isle: `data.js` … `ui.js`, `net.js` (shelf, lobby, online), `music.js`, `build.py`, `shell.html` |
| `game2/engine.js` | the isometric pixel renderer (ENG) |
| `game2/kit3.js`, `townkit.js` | figures; plague-town creatures (the Old One, the dead) |
| `game2/proto.js` | the Hollow Brother: rules, bots, UI, nights, hearing, Strigoi mode, gate/house/roaming dead |
| `game2/protoscene.js` | the monastery map |
| `game2/townscene.js`, `towndraft.js`, `townhamlet.js` | the plague town: original scene, the parameterised redraw (`mkTown`), the live layout (the Crossing, Die2Nite look) |
| `game2/hivescene.js` | DRAFT hive map ("The Stack"), not wired in |
| `game2/hnet.js` | the Hollow's menu + online (Trystero, host-authoritative) |
| `game2/music.js` | adaptive layered music |
| `game2/t*.js` | Playwright tests: renders, play-tests, sims (`tsimx.js`: `SF=… QS='&map=town' NG=12 node tsimx.js` after copying the build to `sim_<SF>.html`) |
| `music/*.py` | music renderer (`lib.py`) and every composition script |
| `drafts/fonts.css`, `fontfix/`, `fonts/` | fonts for the builds |
| `tryst/trystero.iife.js` | networking library (inlined) |

## Where things stand (16 Nov 2026)

**Lords of the Isle:** considered finished for now (charters, armies, ports, online, shelf).

**The Hollow Brother**
- Monastery mode: feature-complete for now.
- Plague town (Strigoi mode), GANK paused it for balancing. Current state:
  - Map: "the Crossing" in the Die2Nite look (dust, dunes, dead trees, closed plank-and-tin cottages, spikes outside the stakes); the outside is "The Wastes" with six places to scavenge.
  - Gate is a manual lever (logged by name); left open at dusk the dead walk in. Anyone outside when the timer ends sleeps outside.
  - Shore up your own house (logged); the dead favour weak homes.
  - The dead roam the far places by day: alone you're wounded and drop your pack, twice in a day you die; with a neighbour you drive it off.
  - Bot sims (10 valid games): faithful 6/10, 4.3 days; bots bring in little (4–7 items a game), so walls grow slowly.
  - Open: balance with real players; bot boldness in the far Wastes; how deadly a second wound is; the empty north/flank woods (more places, or a smaller map); a town faithful victory theme.
- The hive map draft ("The Stack") is a picture only.

## How GANK works
Concise replies, a thinking partner; "draft" = show visuals/mp3s first; every build a single HTML, sent and pushed; back up before big edits (`file_backup_vN.js`); test before reporting; original music only (references are for mood). More in `INSTRUCTIONS.md` of the kit (`hollow_kit.zip`).
