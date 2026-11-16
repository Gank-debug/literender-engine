# The plague town's house theme, draft 5: slower, the chord every two bars, colder. Draft 4 was: "the pulse", as a long, slow film-cue build. Original composition.
# The monastery's sounds (the fingerpicked 12-string, harmonium, cello, the bell, the rising fourth A-D, D minor) carry a
# single figure that never changes, over a slow heartbeat; nearly four minutes of organ, strings and then distorted
# guitars and drums piling on, sustained and swelling rather than played, until it all stops and the figure is alone.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 80; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = ['Dm'] * 2 + ['Eb'] * 2 + ['Gm'] * 2 + ['A'] * 2             # a chord every two bars; the flat second (Eb) under the unchanging figure is the dread
V = {'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4'], 'Dm': ['D3', 'A3', 'D4', 'F4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4']}
PW = {'Eb': ['Eb3', 'Bb3', 'Eb4'], 'Dm': ['D3', 'A3', 'D4'], 'Bb': ['Bb2', 'F3', 'Bb3'], 'Gm': ['G2', 'D3', 'G3'], 'A': ['A2', 'E3', 'A3']}
FIG = ['A3', 'D4', 'A4', 'D4', 'F4', 'D4', 'E4', 'D4']                # the figure: the rising fourth, then a turn on D
MEL = [('A3', 4), ('D4', 4), ('Eb4', 6), ('D4', 2), ('Bb3', 4), ('D4', 4), ('C#4', 4), ('A3', 4), ('F4', 4), ('E4', 4), ('Eb4', 4), ('G4', 4), ('F4', 4), ('D4', 4), ('E4', 4), ('C#4', 2), ('D4', 2)]
NB = 80; LEN = NB * BAR                                              # five sections of sixteen bars, 4:00
def lp(y, f): b_, a_ = butter(2, f / (SR / 2)); return lfilter(b_, a_, y)
def hp(y, f): b_, a_ = butter(2, f / (SR / 2), 'high'); return lfilter(b_, a_, y)
def heart(g=1.0):
    t = np.arange(int(.6 * SR)) / SR
    def th(f0, d): f = f0 * (1 + .6 * np.exp(-t / .02)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / d)
    y = th(50, .1); y2 = np.zeros_like(y); k = int(.2 * SR); y2[k:] = th(44, .08)[:-k] * .7; return lp(y + y2, 200) * g
def kick(): t = np.arange(int(.5 * SR)) / SR; f = 50 * (1 + 1.4 * np.exp(-t / .015)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .2)
def snare(seed=0):
    r = np.random.default_rng(seed); t = np.arange(int(.4 * SR)) / SR
    return hp(r.normal(0, 1, len(t)), 1000) * np.exp(-t / .09) * .55 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / .05) * .5
def tom(f0): t = np.arange(int(.9 * SR)) / SR; f = f0 * (1 + .35 * np.exp(-t / .04)); return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .35), 600)
def crash(seed=0): t = np.arange(int(3 * SR)) / SR; return hp(np.random.default_rng(seed).normal(0, 1, len(t)), 5000) * np.exp(-t / .9) * .45
def swell(notes, dur, drive=7.0, rise=.7):  # distorted guitars, sustained, faded in over the chord rather than struck
    y = sum(render('guitar-electric', midi(n), dur, .6, detune=1 + .002 * k) for k, n in enumerate(notes)); y = np.tanh(y * drive) / np.tanh(drive); y = lp(y, 2600)
    n = len(y); env = np.minimum(1, np.arange(n) / (rise * dur * SR)) ** 1.5; return y * env * .5
M = Mix(LEN * 3 + 8); rng = np.random.default_rng(4)
for p in range(3):
    o = p * LEN
    for bi in range(NB):
        t0 = o + bi * BAR; sec = bi // 16; ch = PROG[bi % 8]; v = V[ch]
        tail = bi >= NB - 4                                            # the last four bars: everything stops but the figure
        # the figure on the 12-string, always
        for k, n in enumerate(FIG):
            t = t0 + k * BEAT / 2 + rng.normal(0, .005); g = (.22 if k == 0 else .16) * (.8 if 4 <= sec and not tail else 1)
            M.add(render('guitar-nylon', midi(n), BEAT * 1.3, 1.0), t, g, -.2); M.add(render('guitar-nylon', midi(n) + 12, BEAT * .9, .8, detune=1.006), t + .02, g * .3, .3)
        if tail: continue
        c4 = bi % 2 == 0                                              # first bar of a chord
        # the harmonium drone on D, faint at first
        M.add(render('harmonium', midi('D3'), BAR, 1.4), t0, .025 + .01 * min(sec, 3), 0)
        if bi % 2 == 0: M.add(render('violin', midi('Eb5'), BAR * 2, 1.5), t0, .012 + .006 * min(sec, 3), .5)      # a high Eb against the D: the cold
        if sec >= 1 and rng.random() < .45:                            # glass: a single high note, far off
            M.add(render('piano', midi(['D6', 'Eb6', 'A5', 'G#5'][rng.integers(4)]), BEAT * 3, 3.0), t0 + rng.integers(0, 4) * BEAT, .05, rng.uniform(-.7, .7))
        if sec >= 2 and bi % 2 == 1:                                   # a reversed piano swells into the next chord
            nx = V[PROG[(bi + 1) % 8]]; rp = render('piano', midi(nx[2]), BAR, 1.5)[::-1]; M.add(rp, t0 + BAR - len(rp) / SR, .09, -.3)
        # the heartbeat: slow (every second beat) from the second section, every beat from the fourth
        if sec >= 1:
            for q in ([0, 2] if sec < 3 else [0, 1, 2, 3]): M.add(heart(.7 + .1 * min(sec, 4)), t0 + q * BEAT, .7, 0)
        # bass and bell
        if sec >= 1 and c4: M.add(render('contrabass', midi(v[0]) - 12 if midi(v[0]) >= midi('C3') else midi(v[0]), BAR * 2, 1.2), t0, .2 + .03 * min(sec, 4), 0)
        if sec >= 1 and bi % 8 == 0: M.add(bell(55.0, 8), t0, .17, .25)
        # the piano, low single notes, from the third section
        if sec >= 2 and c4: M.add(render('piano', midi(v[0]) + (12 if midi(v[0]) < midi('C3') else 0), BAR * 2, 1.5), t0, .2, -.1)
        # held cellos from the third section, the organ from the fourth
        if sec >= 2 and c4:
            for n in v[1:]: M.add(render('cello', midi(n), BAR * 2, 1.4), t0, .04 + .012 * (sec - 2), -.3)
        if sec >= 3 and c4:
            for n in v: M.add(render('organ', midi(n), BAR * 2, 1.6), t0, .025 + .012 * (sec - 3), (midi(n) % 5 - 2) * .12)
        # toms in the fourth section, on each chord change and in the last bar of each chord
        if sec == 3:
            if c4: M.add(tom(70), t0, .4, .1)
            if bi % 2 == 1: [M.add(tom(f), t0 + q * BEAT, .3, .1 + .1 * j) for j, (q, f) in enumerate([(2, 90), (2.5, 80), (3, 70), (3.5, 62)])]
        # the distorted guitars: swelling in through the fourth section, a wall through the fifth and sixth
        if sec >= 3 and c4:
            g = .05 if sec == 3 else .12; M.add(swell(PW[ch], BAR * 2, rise=.8 if sec == 3 else .2), t0, g, -.45); M.add(swell(PW[ch], BAR * 2, 9.0, rise=.8 if sec == 3 else .2), t0 + .02, g, .45)
        # drums: a slow, heavy beat in the fifth and sixth sections
        if sec >= 4:
            for q in (0, 2.5): M.add(kick(), t0 + q * BEAT, .55, 0)
            M.add(snare(bi), t0 + 2 * BEAT, .38, .05)
            for k in range(4): M.add(hp(rng.normal(0, 1, int(.08 * SR)), 7000) * np.exp(-np.arange(int(.08 * SR)) / (.02 * SR)), t0 + k * BEAT, .07, .3)
            if bi % 8 == 0: M.add(crash(bi), t0, .3, -.2)
        if sec >= 4:
            for k in range(16): M.add(render('violin', midi(v[2]) + 12 * (k % 2), BEAT / 4 * .9, .06), t0 + k * BEAT / 4 + rng.normal(0, .004), .03, .4 - .8 * (k % 2))
    # the melody, in very long notes: cello in the third section, cello and organ in the fourth, violins an octave up at the top
    def line(inst, t0, gain, pan, oct=0, seed=0):
        t = t0; r = np.random.default_rng(seed)
        for n, d in MEL: M.add(render(inst, midi(n) + 12 * oct, d * BEAT * 1.02, 1.2), t + r.normal(0, .01), gain, pan); t += d * BEAT
    for s0, parts in [(32, [('cello', .24, -.15, 0)]), (48, [('cello', .22, -.15, 0), ('organ', .05, .1, 1)]), (64, [('violin', .2, .15, 1), ('cello', .2, -.2, 0)])]:
        for inst, g, pn, oc in parts: line(inst, o + s0 * BAR, g, pn, oc, s0 + p)
    rc = crash(3)[::-1]; M.add(rc, o + 64 * BAR - len(rc) / SR, .35, 0)
n = len(M.L); w = wind(int(LEN * SR), .025, lo=80, hi=480); w = np.tile(w, n // len(w) + 1)[:n]; M.L[:, 0] += w; M.L[:, 1] += np.roll(w, 1300)
mix = reverb(M.L, secs=3.2, decay=.9, lp=4200, wetg=.5, dry=.8); out = loop_cut(mix, LEN, LEN)
export(out, os.path.join(os.path.dirname(__file__), '..', 'listen', 'town_theme_draft5')); print('loop', round(LEN, 1), 's')
