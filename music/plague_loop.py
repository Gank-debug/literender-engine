# The Hollow Brother: the plague town's house theme, seamless loop. Original composition.
# The monastery's dark loop, bar for bar (same tempo, chords and length, so both victory themes still fit over it),
# played by the town: a lute for the 12-string, a hurdy-gurdy drone, a fiddle and a bassoon for the lament,
# the passing bell tolled low and often, and a cart wheel's rattle in the climax.
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

def rattle(dur=.9, seed=0):  # the dead cart's wheel: a burst of dry wooden clicks
    r = np.random.default_rng(seed); n = int(dur * SR); y = np.zeros(n)
    for k in range(int(dur * 11)):
        i = int((k / 11 + r.normal(0, .006)) * SR); L = int(.018 * SR)
        if 0 <= i < n - L: y[i:i + L] += r.normal(0, 1, L) * np.exp(-np.arange(L) / (.004 * SR)) * (.6 + .4 * r.random())
    return y * np.linspace(1, .4, n) * .5
def hurdy(m, dur, seed=0):  # a hurdy-gurdy-ish drone: harmonium with a buzzing, slightly beating bassoon over it
    a = render('harmonium', m, dur, 1.4); b = render('bassoon', m, dur, 1.2, detune=1.003); n = min(len(a), len(b))
    t = np.arange(n) / SR; return a[:n] * .8 + b[:n] * .5 * (1 + .25 * np.sin(2 * np.pi * 5.5 * t))
M = Mix(LEN * 3 + 8); rng = np.random.default_rng(19)
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
        # the drone: contrabass and the hurdy-gurdy on D
        M.add(render('contrabass', midi('D2') - 12, BAR, 1.0), t0, .26, 0); M.add(hurdy(midi('D3'), BAR), t0, .05 if sec != 2 else .08, -.1)
        # the creeping figure, on the lute's low strings
        if sec != 2 and bi >= 4:
            for k, n in enumerate(['D2', 'A2', 'D3', 'Eb3', 'D3', 'A2', 'D3', 'Eb3']): M.add(render('guitar-nylon', midi(n), BEAT * .6, .5), t0 + k * BEAT / 2 + rng.normal(0, .006), (.15 if k % 4 == 0 else .09) * (.6 if sec >= 3 else 1), -.25)
        # the passing bell: low, every second bar, every bar in the climax
        if bi % 2 == 0 or sec == 2: M.add(bell(55.0 if sec != 2 else 73.42, 8), t0, .22 if sec != 2 else .16, .25)
        # the lute: fingerpicked through the first two sections, rolled in the climax
        if sec in (0, 1):
            gv = GV[ch]; base = .30 if sec == 0 else .18
            for k, pi in enumerate(PAT):
                m = midi(gv[pi]); t = t0 + k * BEAT / 2 + rng.normal(0, .008); g = base * (1 if k == 0 else .66 + .1 * rng.random())
                M.add(render('guitar-nylon', m, BEAT * 1.3, 1.1), t, g, -.25 + .1 * pi)
                if m + 12 <= midi('D5') + 7: M.add(render('guitar-nylon', m + 12, BEAT * 1.0, .8, detune=1.006), t + .02, g * .3, .3 - .1 * pi)
        if sec == 2:
            for k, n in enumerate(GV[ch]): M.add(render('guitar-nylon', midi(n), BAR * .9, 1.4), t0 + k * .04, .18, -.25 + .1 * k)
        if sec == 1:
            for n in v[1:]: M.add(render('harmonium', midi(n), BAR, 1.4), t0, .045, .1)
            M.add(render('bassoon', root if root < midi('C3') else root - 12, BAR, .9), t0, .13, -.4)
        if sec == 2:  # the hurdy-gurdy full, tremolo fiddles, the drum and the cart
            for n in v: M.add(hurdy(midi(n), BAR, bi), t0, .045, (midi(n) % 5 - 2) * .15)
            for n in v[2:]:
                for k in range(16): M.add(render('violin', midi(n), BEAT / 4 * .9, .08), t0 + k * BEAT / 4 + rng.normal(0, .004), .04 * (0.7 + .3 * (k % 4 == 0)), -.45 + .9 * (n == v[3]))
            M.add(boom(64, 1.0), t0, .42, 0); M.add(boom(64, 1.0), t0 + 2 * BEAT, .32, 0); M.add(rattle(1.2, bi), t0 + BEAT, .5, .35)
        if sec == 4 and bi >= 36: M.add(render('bassoon', midi('D3'), BAR, 1.2), t0, .10 * (bi - 35) / 4, -.3)
        if sec >= 3:  # the lute alone, slower and out of tune; a far clarinet
            for k, pi in enumerate([0, 2, 1, 3, 2, 1]):
                m = midi(v[pi]) + (12 if pi > 1 else 0); M.add(render('guitar-nylon', m, BEAT * 1.6, 1.4, detune=1.0 + .009 * (k % 2)), t0 + k * BAR / 6 + rng.normal(0, .02), .2 if k == 0 else .14, -.3 + .12 * pi)
            if bi % 2 == 1: M.add(render('clarinet', midi('A4'), BAR, 1.5), t0, .035, -.6)
    line('violin', mel2, o + 8 * BAR, .24, -.15, rel=1.0, legato=1.02, seed=21 + p)
    line('bassoon', [[(n and n[:-1] + str(int(n[-1]) - 1), d) for n, d in b] for b in mel2], o + 8 * BAR, .12, .2, rel=1.0, seed=31 + p)
    line('violin', mel3, o + 16 * BAR, .2, .2, rel=1.4, legato=1.03, seed=41 + p)
    line('clarinet', [[(n and n[:-1] + str(int(n[-1]) - 1), d) for n, d in b] for b in mel3], o + 16 * BAR, .1, -.25, rel=1.4, legato=1.03, seed=51 + p)
    rb = bell(55.0, 6)[::-1][-int(4.5 * SR):]; M.add(rb * np.linspace(0, 1, len(rb)) ** 2, o + LEN - len(rb) / SR, .35, -.2)
n = len(M.L); w = wind(int(LEN * SR), .035, lo=80, hi=480); w = np.tile(w, n // len(w) + 1)[:n]; M.L[:, 0] += w; M.L[:, 1] += np.roll(w, 1300)
mix = reverb(M.L, secs=3.6, decay=1.0, lp=3800, wetg=.6, dry=.75); out = loop_cut(mix, LEN, LEN)
export(out, os.path.join(os.path.dirname(__file__), 'plague_town_loop')); print('loop', round(LEN, 1), 's')
