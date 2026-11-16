# GANK game kit: how we build games (instruction set)

Give this file to a new project, with the starter kit (`hollow_kit.zip`) beside it. It describes how The Hollow Brother was made: the engine, the pixel art made in code, the music, online play, the UI everyone now expects, and the way GANK likes to work. The first use is a **multiplayer dungeon crawler** built on the Hollow Brother's bones.

---

## 1. Working with GANK

- **Be concise.** Short replies. Be a thinking partner: give opinions, trade-offs and a recommendation, not a menu with no view.
- **"Draft" means pictures first.** Render the art, or the mp3, and show it before wiring anything into the game. Offer 2–4 variants side by side on one comparison sheet when the direction is open.
- **Every build is one standalone HTML file** (fonts, art, music and the network library all inlined). Send it to GANK, and push it to the hosted site after every change.
- **Back up before editing.** Copy `file.js` to `file_backup_vN.js` before a big change.
- **Test before you report.** Use a scripted Playwright playthrough and a screenshot you look at yourself. For balance, run headless simulations and give the win rates.
- **Originality.** Compose original music. A reference track gives mood and tempo only: never sample it, never copy its melody. Never draw logos or emblems from existing IP (no Games Workshop aquila, no named characters). "Inspired by" means the feel, not the marks.
- **Keep design notes** in a project doc as you go: what was decided, what the numbers are, what's still open.

## 2. The build: one file

- Source is plain JS files plus a Python build script (`build/build_proto.py` is the reference) that concatenates them into one HTML file:
  - `@font-face` with the woff2 files as base64 data URLs (`fonts.css` in the kit is ready to paste);
  - audio as base64 `.ogg`/`.mp3` strings in generated JS files (`townstems.js` style), decoded with Web Audio;
  - `trystero.iife.js` inlined for online play (escape `</script>`).
- Run `node --check` on each JS file before building. A missing brace shows up as a blank page and "X is not defined" errors.
- Expose a test hook: `window.GAME = { G, update, … }` so tests can drive the game.
- Query parameters for testing: `?seed=12` (deterministic RNG), `?scenes=off` (skip cinematics), `?map=…`, `?role=…`.

## 3. The engine (`engine/engine.js`)

A software pixel renderer into a canvas, isometric 2:1: `iso(x, y, z) = [ox + (x − y)·10, oy + (x + y)·5 − z]` (one tile = 20×10 px; z in pixels).

`const e = ENG({ W, H, ox, oy, K: 1, t, N, zt: 1, amb: { in: [r, g, b], out: [r, g, b] }, fog, fogMax, noVig, noWeather })`

- `ground((x, y) => [colour, insideFlag, emissive])`: called for every pixel with the tile coordinate under it. All floors, roads, rugs and decals are painted here procedurally.
- `box(x, y, z, w, d, h, top, left, right)`: a block. Each face is a colour or a function `(u, z) => colour` (u in tenths of a tile, z in px). Walls, furniture and buildings are all boxes with textured faces.
- `B(...)` and `add(depth, fn)` queue things; `drawAll()` sorts them by depth (x + y) and draws them. Flush between layers.
- `zt: 1` turns on a per-pixel depth test, so props never draw over the walls in front of them. The ground has no depth: if a tall thing must not paint over a floor in front of it, give the floor pixels a depth (see `hivescene.js`, `ground2`).
- Lights: `light(x, y, z, radius, intensity, colour, flicker, pulse)`, `lamp`, `candle`, `stand`. They're registered up front so shadows can be cast; `finish()` applies ambient, lights, dithering and fog and returns a canvas. `S.E = 1` while drawing makes pixels emissive (windows, flames, screens).
- Helpers: `hs(a, b)` hash noise, `vn(x, y)` value noise, `sh(c, k)` shade, `mix(a, b, t)`, `stone(u, z, pal, bw, bh)` masonry, `smoke`, `flame`, `deadTree`, `low` (low walls), `backN`/`backW` (tall back walls).
- **The cutaway look:** the north and west walls of a room are tall and textured, the south and east walls are low kerbs, so you see into every room. Closed buildings (homes) are full boxes with roofs.

### A map

```js
MAPS.key = { name, view: { W, H, ox, oy }, plan: { rooms: { id: { r: [x0, y0, x1, y1], rs: [...rects], name, out, outside } },
  walls: [[x0, y0, x1, y1, [doorFrom, doorTo]], …], furn: [], bounds }, pois, paths, scene(t, N) { … return { canvas: finish(), e }; } };
```
- Walls carry door gaps; `furn` blocks are added by the scene as it places furniture (`block(x, y, w, d)`), so collision and art never disagree.
- A sight grid from walls and blockers gives fog of war: you see what your character could see.
- The scene is rendered once to a background canvas; characters, bodies and effects are drawn live over it each frame.

## 4. Art in code

- **Style:** dark, moody, Diablo 2-ish 2.5D pixel art. Cool, low ambient light with warm pools from lamps and candles; emissive windows; light dithering. Rooms are big enough that the camera, zoomed in, doesn't show everything at once.
- **Textures are functions.** Build materials from noise and pattern: planks, stone, plaster, corrugated metal, rust streaks, grime at the base, moss. Keep 3–4 tone palettes per material. Everything is deterministic (`hs`, never `Math.random`), so a scene renders the same every time.
- **Figures** (`engine/kit3.js`, `KIT.person(opts, face, pose, frame)`): a tiny 3D renderer of superellipse body parts. Tall, slim (about 8 heads), square shoulders, cloth hanging straight, flat 3–4 tone shading, no eyes. One model gives 8 facings and every pose (idle, walk, die, pray…). Options: height, build, cloak colour, hat or hood, etc.
- **Creatures** (`engine/townkit.js`): same approach, own silhouettes (`TKIT.oldOne`, `TKIT.dead`). A creature that changes form takes a `morph` 0..1.
- **The draft workflow:**
  1. Write the scene or sprite in its own file.
  2. Render it headless with Playwright: load the game HTML, `addScriptTag` the draft, call `scene()`, save `canvas.toDataURL()` to PNG (`tests/ttdraft.js`, `tests/thive.js`).
  3. Brighten and crop with PIL, upscale 2× nearest-neighbour, and lay variants out on one labelled sheet.
  4. Look at it yourself before sending. Fix overlaps, props in front of walls, lights that are too hot.
- Keep a scene parameterised (a layout object of rects and positions, as `towndraft.js` does with `mkTown`) so redesigns are moves of numbers, not rewrites.

## 5. Music

Original pieces rendered offline in Python from real instrument samples, then embedded.

- **Samples:** `git clone https://github.com/nbrosowsky/tonejs-instruments` (MIT) next to `music/`. Instruments: cello, violin, contrabass, harmonium, organ, piano, harp, guitars (nylon, acoustic, electric), bassoon, clarinet, flute, horn, trumpet, trombone, tuba, xylophone.
- **`music/lib.py`:** `render(inst, midi, dur)` (pitch-shifted, looped sustain), `bell(f0)` (synthesised bell), `wind(n)`, `Mix(seconds).add(y, t, gain, pan)`, `reverb(L, secs, decay)` (a stone hall), `loop_cut(L, start, length)`, `export(mix, path)` (mp3 + ogg). Needs numpy, scipy, ffmpeg.
- **How pieces are built:** tempo and key first (the Hollow is 62 BPM, the plague town 80 BPM in D minor), a chord every 2 bars, a signature figure (a fingerpicked 12-string), a drone, a heartbeat or bell for pulse, then the melody.
  - **Seamless loops:** render three passes of the loop and keep the middle one (`loop_cut`), so reverb tails and wind wrap around.
  - **Stems:** render each layer as its own loop of identical length (base, lament, dread, storm…) so they can be mixed live.
- **In the game (`engine/music.js`):** Web Audio, gapless.
  - All stems start together and loop in sync; game state sets each stem's gain (`want(i, stage, threat)`), faded over 2 bars. Tension rises by bringing layers in: the drums only arrive once the game has got that far.
  - Changes land on the bar line; a victory theme waits for a phrase line. A variation segment can swap in every other loop.
  - Music starts on the first click or key (browser autoplay rule). A volume button opens a slider; the level is kept in `localStorage`.
- **Draft music as mp3s first**, labelled by version, and let GANK listen before wiring it in. Give a long "journey" render (calm → threat → victory) to judge the whole arc.

## 6. Online play (`engine/hnet.js`)

- **Serverless:** Trystero over public Nostr relays (WebRTC). No backend to run. App id per game, STUN servers listed.
- **Room codes:** `PREFIX-XXXX` from an alphabet without look-alike characters. A join link opens straight into a room: `game.html#join=CODE`.
- **The host is the authority.** The host's machine runs the whole game. Guests send only their actions, as `{ t: 'act', d }`, and the host applies them with `asSeat(seat, () => handle(d))`.
  - `asSeat` temporarily makes "you" that seat, so all UI code written for "you" works for guests too.
  - Several times a second the host sends a **public snapshot** (positions, world state, chat) plus a **private part per seat** (his role, his notes). Never send a player what he shouldn't know.
  - Shared state that must sync goes in snapshot objects. Per-player public facts go in maps keyed by seat id.
- **Seats:** a lobby up to the size limit, and bots fill empty seats. When a player drops, his seat is held: he rejoins by name and takes it back. A player who goes AFK gets a bot standing in for him until he returns.
- **Saves:** game state serialised to `localStorage`, so a host can resume and guests can rejoin.
- **Big screen + phones:** one machine can host as a TV view (spectator, sees everything), with players on their phones using a controller layout (`body.pad`), Jackbox style.
- **Chat:** a table chat plus whisper tabs per player, with unread dots.

## 7. UI: the checklist every game is expected to have

- **Top bar:** day or turn title, phase steps, timer (`font-variant-numeric: tabular-nums`), then tool buttons: **volume**, **fullscreen** (`requestFullscreen`, with the webkit fallback), **hide UI** (an eye that hides the side panels and action bar).
- **Side panels** (left: players/party; right: role, log/stash, chat). They turn to glass (translucent, blurred) when your character walks under them, and come back on hover.
- **Action bar:** big buttons, each with a small second line saying what it does or why it's greyed out ("at the lever · all will know", "carry two things home").
- **Toasts / flashes** for events; **modals** centred for decisions; **countdowns** on continue screens so nobody waits forever; **skip** on every cinematic.
- **Controls:** click to move (pathfinding), WASD / arrows too. Keyboard shortcuts for the main actions.
- **Keeps running when alt-tabbed:** time comes from timestamps, never paused on `visibilitychange`.
- **Menu:** big title, a one-line pitch, tabs (Play / Online / Saves), name field, room code shown large, the seat list, options (house size, map, cinematics on or off, hints).
- **End screen** with a recap of what really happened; a "rematch" that keeps the room.
- **Responsive:** works on a laptop (`@media (max-height: 820px)` tightens things), a TV, and phones.
- **Fonts:** `'Jacquard 24'` (blackletter) for titles, names and headings; `'Pixelify Sans'` for everything else. Both are inlined in `fonts.css`.
- **Gothic palette:** panel `#15100c`, border `#6a5232`, ink `#ece2c8`, muted `#a99472`, gold `#f0d68a`, blood `#7a1f16` / `#c0392b`. Headings get a red first letter (`::first-letter`). Pixel art is shown with `image-rendering: pixelated`. The base CSS is in `engine/proto_css.txt`.

## 8. Testing and balance

- Playwright and Chromium are usually pre-installed (`require('playwright')`; `chromium.launch()`).
- **Play-tests:** load the HTML with test params, wait for the loading veil to go, drive the game through the test hook and the buttons (`[data-act="…"]`), screenshot, and read the screenshot (`tests/ttownplay2.js`, `tests/td2n.js`).
- **Sims:** run whole bot games headless by calling `update(0.05)` thousands of times per day, and print one JSON line per game plus a summary ("good wins 6 / 10, avg days 4.3") (`tests/tsimx.js`). Run them in the background; 10–16 games per setting. Report what you changed and the before/after numbers.
- Treat bot-only results with care: bots don't read logs like people. Say so when it matters.

## 9. Hosting

- GitHub Pages: a `gh-pages` branch with one HTML per game (`index.html` can be a shelf linking to them). Commit as GANK with the attribution lines the session provides.
- After each change: build, copy the HTML into the site checkout, commit, push, and give the URL.

## 10. Starting the dungeon crawler from these bones

**Reuse as is:**
- the engine;
- the figure kit (for adventurers);
- online play (host authority, `asSeat`, snapshots, held seats, bots, big screen + phones);
- the music system;
- the fonts, UI shell, menu, chat and test tooling.

**New:**
- **Dungeon maps as plans:** chambers (rooms with `r`), corridors (thin rooms), doors (wall gaps), and furniture blocks from the scene. The cutaway look suits dungeons; fog of war from the sight grid suits them even better.
- **Real-time co-op, still host-authoritative:** monsters are host-side actors drawn like the roaming dead in the plague town (a sprite list with positions, synced in the snapshot).
- **Combat, loot, inventory, levelling:** design first, in a doc, then a draft screen, then code.
- **Music:** a crawl loop in stems that rises with danger (exploring → combat → boss), the boss on its own stem.

Suggested first steps:
1. One chamber and one corridor rendered as a draft, in two or three looks.
2. A hero figure in 2–3 class silhouettes.
3. The menu and lobby with the new name.
4. Walking, doors and fog of war, played online with two browsers.
5. A first monster and a hit.

---

### What's in `hollow_kit.zip`

| Path | What |
|---|---|
| `engine/engine.js` | the renderer (ENG) |
| `engine/kit3.js` | the figure kit (KIT.person) |
| `engine/townkit.js` | creature kit example (the Old One, the dead) |
| `engine/music.js` | adaptive Web Audio music player |
| `engine/hnet.js` | menu + online play (Trystero), reference implementation |
| `engine/trystero.iife.js` | the network library, to inline |
| `engine/proto_css.txt`, `engine/fonts.css` | gothic UI CSS, fonts as data URLs |
| `reference/proto.js` | the whole Hollow Brother game logic, UI, bots: read for patterns |
| `reference/townscene.js`, `towndraft.js`, `townhamlet.js`, `hivescene.js` | example map scenes |
| `build/build_proto.py` | the single-file build script (paths need adjusting) |
| `music/lib.py` + example scripts | the music renderer and stem/metal layer scripts |
| `tests/` | Playwright render, play-test and sim scripts |
