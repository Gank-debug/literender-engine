# The Hollow Brother: adaptive victory music, Devil May Cry 5 style.
# 1. victory_layer: a stem bar-for-bar aligned with the dark loop (same 40 bars, same chords). It adds the victory
#    theme's drums, guitars, fuzz bass, piano riff, choir and soprano on top of whichever section is playing.
# 2. victory_ending: the drop and the aftermath, written to follow the end of any 8-bar section (they all end on A).
# At a Hollow Brother win the game fades the layer in on the next bar, lets it run to the end of the section,
# then hands over to the ending. Original composition; drums are Virtuosity Drums (CC0).
import sys, os; HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
src = open(os.path.join(HERE, 'victory.py')).read(); exec(src[:src.index('# ---------------------------------------------------------------- arrange')])
NB = 40; LEN = NB * BAR
S1 = ['Dm', 'C/D', 'Bb/D', 'Dm', 'Dm', 'Eb/D', 'Gm', 'A']; S2 = ['Dm', 'Eb/D', 'Gm', 'A', 'Dm', 'Bb', 'Eb', 'A7']
S3 = ['Bb', 'A', 'Gm', 'Eb', 'Dm', 'Edim/D', 'Eb', 'A']; S4 = ['Dm', 'Eb/D', 'Dm', 'A/D', 'Dm', 'Eb/D', 'Gm', 'A']
SONG = S1 + S2 + S3 + S4 + S4                      # identical to the dark loop
CHORD['A/D'] = ['D4', 'E4', 'A4']; CHORD['A7'] = ['C#4', 'G4', 'A4']
RIFF = ['D5', 'A4', 'D5', 'Eb5', 'D5', 'A4', 'F5', 'E5']; SH = {'Dm': 0, 'Eb/D': 1, 'Gm': 5, 'A': 0, 'Bb': -4, 'Eb': 1, 'A7': 0, 'Edim/D': 2, 'A/D': 0, 'C/D': -2, 'Bb/D': -4}
PULSE2 = {'Dm': ['A5', 'A5', 'F5', 'A5'], 'Edim/D': ['Bb5', 'Bb5', 'G5', 'E5'], 'Eb': ['Bb5', 'G5', 'Bb5', 'G5'], 'A': ['A5', 'C#6', 'E6', 'C#6']}
PULSE = {'Dm': ['A5', 'A5', 'F5', 'A5'], 'Eb/D': ['Bb5', 'Bb5', 'G5', 'Bb5'], 'A/D': ['A5', 'A5', 'C#6', 'E6'], 'Gm': ['Bb5', 'G5', 'D6', 'Bb5'], 'A': ['C#6', 'E6', 'D6', 'C#6']}

def layer_pass(o):
    for bi, ch in enumerate(SONG):
        t0 = o + bi * BAR; sec, bar_in = bi // 8, bi % 8; root = midi(ROOT[ch])
        last = bar_in == 7
        if sec == 0:   # the opening stays bare; the operatic build rises over bars 5-8
            if bar_in == 3: hum = choir([(midi('D4'), 4.5)], 'oo', 5, 61); hum *= np.linspace(0, 1, len(hum)) ** 1.5; band.add(hum, t0, .12, 0); rcrash(t0 + BAR, 3.5, .35)
            if bar_in >= 6:
                for k, n in enumerate(RIFF): band.add(render('piano', midi(n) + SH[ch] - (12 if k % 2 else 0), BEAT * .55, .9), t0 + k * BEAT / 2, .11, .3)
        if sec == 1:   # the lament: doom groove under the dark loop's cello
            D('kick', t0, .9); D('kick', t0 + 1.5 * BEAT, .75); D('kick', t0 + 2.75 * BEAT, .6); D('snare', t0 + BEAT, .85); D('snare', t0 + 2.25 * BEAT, .15, .5)
            if not last: D('snare', t0 + 3 * BEAT, .9)
            for k in range(8): D('bell' if k in (0, 4) else 'ride', t0 + k * BEAT / 2, .75 if k % 2 == 0 else .5)
            if bar_in % 2 == 0: D('crash', t0, .85)
            for side, dt in ((-.8, 0), (.8, .013)): band.add(power(root + 12, BAR * .97), t0 + dt, .26, side)
        if sec == 2:   # the climax: over the dark loop's organ and violins
            D('kick', t0, 1); D('kick', t0 + .5 * BEAT, .7); D('kick', t0 + 1.5 * BEAT, .85); D('kick', t0 + 2.5 * BEAT, .85); D('snare', t0 + BEAT, .95)
            if not last:
                D('snare', t0 + 3 * BEAT, .95); D('snare', t0 + 3.25 * BEAT, .2, .5)
                for k in range(8): D('hho' if k % 2 == 1 else 'hhh', t0 + k * BEAT / 2, .7 if k % 2 else .55)
                D('crash', t0, .95, 1, -.4); D('crash' if bar_in % 2 else 'sizzle', t0 + 2 * BEAT, .75, .8, .4)
                for k in range(4): D('kick', t0 + 3 * BEAT + k * BEAT / 4, .5 + .1 * k, .8)
            else: D('crash', t0, 1); [D('snare', t0 + 2 * BEAT + k * BEAT / 2, .35 + .15 * k, .7 + .1 * k) for k in range(4)]
            for side, dt in ((-.85, 0), (.85, .011)):
                band.add(power(root + 12, BAR * .97), t0 + dt, .34, side)
                for k in (1, 2, 4, 5, 7): band.add(chug(root + 12, BEAT / 2), t0 + k * BEAT / 2 + dt, .22, side)
        if sec >= 3:   # the aftermath becomes the 12/8 switch-up: the dark loop's guitar already picks in sixes
            for k in range(4): D('bell' if k == 0 else 'ride', t0 + k * BEAT, .75 if k == 0 else .5)
            D('kick', t0, .9); D('rim', t0 + 2 * BEAT, .7)
            if bar_in % 4 == 0: D('crash', t0, .8); D('sizzle', t0, .5, .6, .5)
            if bar_in % 4 == 2: D('sizzle', t0, .6)
            tri = BEAT / 3; v = [midi(n) for n in CHORD[ch]]; cyc = [v[0] - 12, v[2] - 12, v[1], v[0] - 12, v[2] - 12, v[2]]
            for k in range(12): band.add(render('piano', cyc[k % 6], tri * 1.5, .4), t0 + k * tri, .12, .2); band.add(render('cello', cyc[k % 6] - 12, tri * .9, .1), t0 + k * tri, .08, -.3)
            for side, dt in ((-.8, 0), (.8, .013)): band.add(power(root + 12, BAR * .97), t0 + dt, .22, side)
            for k, n in enumerate(CHORD[ch]): band.add(choir([(midi(n) - 12 * (k == 0), 4)], 'oo', 4, 500 + bi * 7 + k), t0, .06, -.5 + .5 * k)
        if sec in (1, 2):
            for k, n in enumerate(RIFF): band.add(render('piano', midi(n) + SH[ch] - (12 if k % 2 else 0), BEAT * .55, .9), t0 + k * BEAT / 2, .16, .3)
            for k, n in enumerate([root, root, root + 12, root, root + 1 if ch in ('Dm', 'Eb/D', 'Edim/D') else root, root, root + 12, root]):
                band.add(fuzzbass(n + (12 if n < midi('E1') else 0), BEAT * .45), t0 + k * BEAT / 2, .28, 0)
        if last and sec != 2: rcrash(t0 + BAR, 3.2, .55)
    # voices
    sop = choir([(midi('A4'), 4), (midi('Bb4'), 2), (midi('D5'), 2), (midi('D5'), 1.5), (midi('Eb5'), .5), (midi('F5'), 2), (midi('E5'), 2), (midi('A5'), 3)], 'ah', 3, 11)
    sop *= np.linspace(.55, 1.15, len(sop)); band.add(sop, o + 4 * BAR, .3, .05)
    for k, ch in enumerate(S1[4:]):
        for j, n in enumerate(CHORD[ch]):
            for oc, vw in ((0, 'ah'), (-12, 'oh')):
                y = choir([(midi(n) + oc, 4.3)], vw, 4, 300 + k * 9 + j + oc); y *= np.linspace(.6 + .1 * k, .8 + .12 * k, len(y)); band.add(y, o + (4 + k) * BAR, .07 + .03 * k, -.5 + .5 * j)
    low = choir([(midi('D3'), 16)], 'oh', 5, 77); low *= np.linspace(.4, 1, len(low)); band.add(low, o + 4 * BAR, .12, 0)
    band.add(choir([(midi(n) + 12 if n else None, d) for b in mel2 for n, d in b], 'oo', 6, 1), o + 8 * BAR, .16, .1)
    band.add(choir([(midi(n), d) for b in mel3 for n, d in b], 'ah', 3, 2), o + 16 * BAR, .34, .05)
    band.add(choir([(midi(n) - 12, d) for b in mel3 for n, d in b], 'oh', 6, 7), o + 16 * BAR, .14, -.1)
    band.add(choir(sum([[(midi(n), .55), (None, .45)] for ch in S3[4:] for n in PULSE2[ch]], []), 'ah', 3, 12, att=.05, rel=.12), o + 20 * BAR, .2, .35)
    for s in (3, 4):
        band.add(choir(sum([[(midi(n), .7), (None, .3)] for ch in SONG[s * 8:s * 8 + 8] for n in PULSE[ch]], []), 'ah', 3, 8 + s, att=.06, rel=.15), o + s * 8 * BAR, .24, -.05)

band, kit = Mix(LEN * 3 + 8), Mix(LEN * 3 + 8); rng = np.random.default_rng(9)
for p in range(3): layer_pass(p * LEN)
LAYER = loop_cut(reverb(band.L, secs=4.5, decay=1.1, lp=4200, wetg=.7, dry=.7) + reverb(kit.L, secs=2.8, decay=.7, lp=9000, wetg=.4, dry=.95, seed=4) * 1.1, LEN, LEN)

# ---------------------------------------------------------------- the ending: drop (Edim/D, A) and aftermath (Dm, Eb/D, Dm, Dm)
EN = ['Edim/D', 'A', 'Dm', 'Eb/D', 'Dm', 'Dm']; ELEN = len(EN) * BAR + 9
band, kit = Mix(ELEN), Mix(ELEN)
for bi, ch in enumerate(EN):
    t0 = bi * BAR; root = midi(ROOT[ch]); gv = GV[ch]
    band.add(render('contrabass', midi('D2') - 12, BAR, 1.0), t0, .30, 0); band.add(render('harmonium', midi('D2'), BAR, 1.2), t0, .06, 0)
    if bi < 2:
        band.add(render('organ', root, BAR, 2), t0, .10, 0)
        for n in CHORD[ch]: band.add(render('organ', midi(n), BAR, 2), t0, .06, (midi(n) % 5 - 2) * .15)
        for k, n in enumerate(CHORD[ch]): band.add(choir([(midi(n) - 12 * (k == 0), 4)], 'ah', 4, 700 + bi * 7 + k), t0, .16, -.5 + .5 * k)
    else:
        for k, pi in enumerate([0, 2, 1, 3, 2, 1]):
            m = midi(gv[pi]); band.add(render('guitar-acoustic', m, BEAT * 1.3, 1.2, detune=1.008 * (1 + .004 * (k % 2))), t0 + k * BAR / 6 + rng.normal(0, .02), .2 if k == 0 else .14, -.25 + .1 * pi)
        for k, n in enumerate(CHORD[ch]): band.add(choir([(midi(n) - 12 * (k == 0), 4)], 'oo', 4, 800 + bi * 7 + k), t0, .05 * (1 - (bi - 2) / 4), -.5 + .5 * k)
        if bi % 2 == 0: D('bell', t0, .35, .7)
D('kick', 0, 1, 1.2); D('crash', 0, 1, 1.1, -.4); D('sizzle', 0, 1, 1, .4); band.add(tom(58, 1), 0, .5, 0)
band.add(bell(73.42, 9), 0, .35, 0); band.add(bell(146.83, 9), 0, .2, .2); band.add(choir([(midi('D5'), 8)], 'ah', 3, 9), 0, .3, 0)
band.add(bell(73.42, 9), (len(EN) - 1) * BAR + BAR, .3, 0)
w = wind(len(band.L), .03, lo=90, hi=520); band.L[:, 0] += w; band.L[:, 1] += np.roll(w, 1300)
ENDING = reverb(band.L, secs=4.5, decay=1.1, lp=4200, wetg=.7, dry=.7) + reverb(kit.L, secs=2.8, decay=.7, lp=9000, wetg=.4, dry=.95, seed=4) * 1.1
fe = int((len(EN) * BAR + 6) * SR); ENDING[fe:] *= np.linspace(1, 0, len(ENDING) - fe)[:, None]

# ---------------------------------------------------------------- levels: match the dark loop as it was exported
dec = lambda p: np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout, np.float32).reshape(-1, 2).astype(np.float64)
LOOP = dec(os.path.join(HERE, 'hollow_brother_dark_loop.ogg'))[:len(LAYER)]
rms = lambda X: np.sqrt((X ** 2).mean())
a, b = int(16 * BAR * SR), int(24 * BAR * SR)
gL = rms(LOOP[a:b]) * 1.6 / rms(LAYER[a:b])               # the layer sits ~4 dB over the loop in the climax
LAYER *= gL; gE = rms(LOOP[a:b] + LAYER[a:b]) * .55 / rms(ENDING[:int(2 * BAR * SR)]); ENDING *= gE
print('layer gain', round(gL, 3), 'ending gain', round(gE, 3), 'peak loop+layer', round(float(np.abs(LOOP + LAYER).max()), 2), 'peak ending', round(float(np.abs(ENDING).max()), 2))
def raw_export(X, name):
    X = X * .5                    # stored at half level, played back at x2 through the game's compressor
    (X * 32767).astype('<i2').tofile(name + '.raw')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', name + '.raw', '-c:a', 'libvorbis', '-q:a', '3', name + '.ogg'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', name + '.raw', '-b:a', '128k', name + '.mp3'], check=True); os.remove(name + '.raw')
raw_export(LAYER, os.path.join(HERE, 'victory_layer')); raw_export(ENDING, os.path.join(HERE, 'victory_ending'))
# demos: the win landing at three different moments, as the game would play them
def demo(win_t, name):
    bar = int(np.ceil(win_t / BAR)); end = (bar // 8 + 1) * 8
    if end - bar < 3: end += 8
    n = int((end * BAR) * SR) + len(ENDING) + SR; out = np.zeros((n, 2)); L2 = np.tile(LOOP, (3, 1))[:n]; Y2 = np.tile(LAYER, (3, 1))[:n]
    g = np.ones(n); s0, s1 = int((bar * BAR - BAR * .5) * SR), int((bar * BAR + .2) * SR); gl = np.zeros(n); gl[s0:s1] = np.linspace(0, 1, s1 - s0); gl[s1:] = 1
    e0 = int(end * BAR * SR); fade = np.ones(n); f1 = e0 + int(1.5 * SR); fade[e0:f1] = np.linspace(1, 0, f1 - e0); fade[f1:] = 0
    out += (L2 + Y2 * gl[:, None]) * fade[:, None]; out[e0:e0 + len(ENDING)] += ENDING[:n - e0]
    out = np.tanh(out * .9); a0 = max(0, int((win_t - 12) * SR)); export(out[a0:], os.path.join(HERE, name), peak=.85)
    print(name, 'win at', round(win_t, 1), 's: layer from bar', bar, 'ending at bar', end, '(', round((end - bar) * BAR, 1), 's later)')
demo(20 * BAR + 1.3, 'demo_win_in_climax'); demo(10 * BAR + 2.0, 'demo_win_in_lament'); demo(29 * BAR + .5, 'demo_win_in_aftermath')
