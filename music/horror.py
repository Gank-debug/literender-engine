# The Hollow Brother: monastery theme, dark version, seamless loop. Original composition.
# Same kinship as the calm theme (rising fourth A-D, D minor, the 12-string), turned towards dread:
# a creeping semitone ostinato, flat-2 and tritone colours, church organ, tremolo strings, a heartbeat drum, tolling bells.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 62; BEAT = 60 / BPM; BAR = 4 * BEAT
NB = 40; LEN = NB * BAR
V = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'Eb/D': ['D3', 'G3', 'Bb3', 'Eb4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4'],
     'Eb': ['Eb3', 'G3', 'Bb3', 'Eb4'], 'A7': ['A2', 'G3', 'C#4', 'E4'], 'Edim/D': ['D3', 'E3', 'G3', 'Bb3'], 'A/D': ['D3', 'A3', 'C#4', 'E4'], 'C/D': ['D3', 'G3', 'C4', 'E4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4']}
S1 = ['Dm', 'C/D', 'Bb/D', 'Dm', 'Dm', 'Eb/D', 'Gm', 'A']           # opens exactly like the Lords theme's guitar, then the floor gives way
S2 = ['Dm', 'Eb/D', 'Gm', 'A', 'Dm', 'Bb', 'Eb', 'A7']              # the lament: melody on cello and organ
S3 = ['Bb', 'A', 'Gm', 'Eb', 'Dm', 'Edim/D', 'Eb', 'A']             # the full organ, tremolo strings, heartbeat
S4 = ['Dm', 'Eb/D', 'Dm', 'A/D', 'Dm', 'Eb/D', 'Gm', 'A']           # the old guitar, out of tune, alone
SONG = S1 + S2 + S3 + S4 + S4                                      # the aftermath plays twice before the loop
ROOT = {k: v[0] for k, v in V.items()}
# five-string voicings for the 12-string, as in the Lords theme
GV = {'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'], 'C/D': ['D3', 'G3', 'C4', 'E4', 'G4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4', 'F4'], 'Eb/D': ['D3', 'G3', 'Bb3', 'Eb4', 'G4'],
      'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4', 'F4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4'],
      'A7': ['A2', 'E3', 'G3', 'C#4', 'E4'], 'Edim/D': ['D3', 'G3', 'Bb3', 'E4', 'G4'], 'A/D': ['D3', 'A3', 'C#4', 'E4', 'A4']}
PAT = [0, 2, 1, 3, 4, 3, 2, 1]
mel2 = [[('A3', 2), ('D4', 1), ('Eb4', 1)], [('D4', 3), ('Bb3', 1)], [('G3', 2), ('Bb3', 1), ('D4', 1)], [('C#4', 3), (None, 1)],
        [('A3', 2), ('D4', 1), ('F4', 1)], [('E4', 2), ('D4', 1), ('Bb3', 1)], [('G3', 1.5), ('Ab3', .5), ('G3', 2)], [('C#4', 2), ('Bb3', 1), ('A3', 1)]]
mel3 = [[('D5', 3), ('F5', 1)], [('E5', 4)], [('D5', 2), ('Bb4', 1), ('G5', 1)], [('G5', 4)], [('F5', 2), ('A5', 1), ('F5', 1)], [('Bb5', 2), ('A5', 1), ('G5', 1)], [('G5', 2), ('Eb5', 1), ('D5', 1)], [('C#5', 4)]]
def boom(f0=58, dur=1.4):
    t = np.arange(int(dur * SR)) / SR; f = f0 * (1 + .45 * np.exp(-t / .05)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / .38) + .25 * np.random.default_rng(1).normal(0, 1, len(t)) * np.exp(-t / .02); return y * .8
M = Mix(LEN * 3 + 8); rng = np.random.default_rng(9)
def line(inst, notes, t0, gain, pan, rel=.8, legato=1.0, seed=0, detune=1.0):
    t = t0; r = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: M.add(render(inst, midi(n), d * BEAT * legato, rel, detune), t + r.normal(0, .01), gain * (0.92 + .16 * r.random()), pan)
            t += d * BEAT
for p in range(3):
    o = p * LEN
    for bi, ch in enumerate(SONG):
        t0 = o + bi * BAR; v = V[ch]; sec = bi // 8; root = midi(ROOT[ch])
        # the drone under everything: contrabass and harmonium on D, the floor of the crypt
        M.add(render('contrabass', midi('D2') - 12, BAR, 1.0), t0, .30, 0); M.add(render('harmonium', midi('D2'), BAR, 1.2), t0, .06, 0)
        # the creeping ostinato: low piano, D up to E-flat and back, every bar but the climax
        if sec != 2 and bi >= 4:
            for k, n in enumerate(['D2', 'A2', 'D3', 'Eb3', 'D3', 'A2', 'D3', 'Eb3']): M.add(render('piano', midi(n), BEAT * .6, .5), t0 + k * BEAT / 2 + rng.normal(0, .006), (.16 if k % 4 == 0 else .10) * (.6 if sec >= 3 else 1), -.2)
        # the bell: every second bar in the dread and the climax, once a section otherwise
        if (sec in (0, 2) and bi % 2 == 0) or bi % 8 == 0: M.add(bell(73.42 if sec != 2 else 146.83, 7), t0, .2 if sec != 2 else .16, .2)
        # the 12-string: fingerpicked like the Lords theme through the first two sections, softer under the lament,
        # rolled chords on the downbeats of the climax
        if sec in (0, 1):
            gv = GV[ch]; base = .32 if sec == 0 else .19; det = 1.0 if bi < 4 else 1.003
            for k, pi in enumerate(PAT):
                m = midi(gv[pi]); t = t0 + k * BEAT / 2 + rng.normal(0, .008); g = base * (1 if k == 0 else .66 + .1 * rng.random())
                M.add(render('guitar-acoustic', m, BEAT * 1.3, 1.2, detune=det), t, g, -.25 + .1 * pi)
                if m + 12 <= midi('D5') + 7: M.add(render('guitar-acoustic', m + 12, BEAT * 1.3, 1.0, detune=1.004 * det), t + .012, g * .38, .3 - .1 * pi)
        if sec == 2:
            for k, n in enumerate(GV[ch]): M.add(render('guitar-acoustic', midi(n), BAR * .9, 1.4), t0 + k * .035, .17, -.25 + .1 * k)
        if sec == 1:
            M.add(render('organ', midi(v[0]), BAR, 1.5), t0, .07, -.1)
            for n in v[1:]: M.add(render('organ', midi(n), BAR, 1.5), t0, .05, .1)
            M.add(render('cello', root + 12 if root < midi('C3') else root, BAR, .9), t0, .12, -.4)
        if sec == 2:  # full organ, pedal an octave down, tremolo cellos, heartbeat
            M.add(render('organ', root - 12, BAR, 2), t0, .11, 0)
            for n in v: M.add(render('organ', midi(n), BAR, 2), t0, .075, (midi(n) % 5 - 2) * .15)
            for n in v[:2]:
                for k in range(16): M.add(render('cello', midi(n) + (12 if midi(n) < midi('C3') else 0), BEAT / 4 * .9, .08), t0 + k * BEAT / 4 + rng.normal(0, .004), .055 * (0.7 + .3 * (k % 4 == 0)), -.45 + .9 * (n == v[1]))
            M.add(boom(), t0, .5, 0); M.add(boom(), t0 + .32, .32, 0); M.add(boom(52), t0 + 2 * BEAT, .38, 0); M.add(boom(52), t0 + 2 * BEAT + .32, .24, 0)
        if sec == 4 and bi >= 36: M.add(render('cello', midi('D3'), BAR, 1.2), t0, .10 * (bi - 35) / 4, -.3)   # a low cello closes the circle
        if sec >= 3:  # the guitar from the calm theme, slower and out of tune, like it was left out in the cold
            for k, pi in enumerate([0, 2, 1, 3, 2, 1]):
                m = midi(v[pi]) + (12 if pi > 1 else 0); M.add(render('guitar-acoustic', m, BEAT * 1.6, 1.4, detune=1.0 + .009 * (k % 2)), t0 + k * BAR / 6 + rng.normal(0, .02), .2 if k == 0 else .14, -.3 + .12 * pi)
            if bi % 2 == 1: M.add(render('violin', midi('A5'), BAR, 1.5), t0, .03, -.6); M.add(render('violin', midi('Bb5'), BAR, 1.5), t0, .025, .6)
    line('cello', mel2, o + 8 * BAR, .30, -.15, rel=1.2, legato=1.02, seed=21 + p)
    line('organ', [[(n and n.replace('3', '4').replace('4', '5') if False else n, d) for n, d in b] for b in mel2], o + 8 * BAR, .06, .2, rel=1.2, seed=31 + p)
    line('violin', mel3, o + 16 * BAR, .22, .2, rel=1.4, legato=1.03, seed=41 + p)
    line('violin', [[(n and n[:-1] + str(int(n[-1]) - 1), d) for n, d in b] for b in mel3], o + 16 * BAR, .12, -.25, rel=1.4, legato=1.03, seed=51 + p)
    # a reversed bell swelling into the top of the loop
    rb = bell(73.42, 6)[::-1][-int(4.5 * SR):]; M.add(rb * np.linspace(0, 1, len(rb)) ** 2, o + LEN - len(rb) / SR, .35, -.2)
n = len(M.L); w = wind(int(LEN * SR), .03, lo=90, hi=520); w = np.tile(w, n // len(w) + 1)[:n]; M.L[:, 0] += w; M.L[:, 1] += np.roll(w, 1300)
mix = reverb(M.L, secs=4.5, decay=1.1, lp=4200, wetg=.7, dry=.7); out = loop_cut(mix, LEN, LEN)
export(out, os.path.join(os.path.dirname(__file__), 'hollow_brother_dark_loop')); print('loop', round(LEN, 1), 's')
