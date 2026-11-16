# The plague town's own house theme, draft 2: "the pulse". Original composition, in the manner of a slow-build
# film cue: one clean guitar figure that never changes, a heartbeat under it, and everything else piling on until
# the guitar is buried in distortion and drums, then it all cuts out and the figure is alone again (the loop point).
# The infection as music: the same small thing, repeating, while the body around it fails.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 112; BEAT = 60 / BPM; BAR = 4 * BEAT
BASS = ['D2', 'D2', 'Bb1', 'Bb1', 'G1', 'G1', 'A1', 'A1']            # i - VI - iv - V, two bars each
FIG = ['A4', 'D5', 'F5', 'D5', 'A4', 'D5', 'E5', 'D5']                # the figure: eight quavers, the same over every chord
CH = {'D2': ['D3', 'A3', 'D4'], 'Bb1': ['Bb2', 'F3', 'Bb3'], 'G1': ['G2', 'D3', 'G3'], 'A1': ['A2', 'E3', 'A3']}
NS = 7; NB = NS * 8; LEN = NB * BAR                                   # seven sections of eight bars
def lp(y, f): b_, a_ = butter(2, f / (SR / 2)); return lfilter(b_, a_, y)
def hp(y, f): b_, a_ = butter(2, f / (SR / 2), 'high'); return lfilter(b_, a_, y)
def heart(g=1.0, seed=0):  # lub-dub: two low thumps
    t = np.arange(int(.5 * SR)) / SR
    def th(f0, d): f = f0 * (1 + .6 * np.exp(-t / .02)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / d)
    y = th(52, .09); y2 = np.zeros_like(y); k = int(.16 * SR); y2[k:] = th(46, .07)[:-k] * .7; return lp(y + y2, 220) * g
def kick(): t = np.arange(int(.4 * SR)) / SR; f = 55 * (1 + 1.5 * np.exp(-t / .015)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .16)
def snare(seed=0):
    r = np.random.default_rng(seed); t = np.arange(int(.3 * SR)) / SR
    return hp(r.normal(0, 1, len(t)), 1200) * np.exp(-t / .07) * .55 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / .04) * .5
def tom(f0, seed=0): t = np.arange(int(.6 * SR)) / SR; f = f0 * (1 + .4 * np.exp(-t / .03)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .22) + np.random.default_rng(seed).normal(0, .15, len(t)) * np.exp(-t / .03)
def crash(seed=0): t = np.arange(int(2.5 * SR)) / SR; return hp(np.random.default_rng(seed).normal(0, 1, len(t)), 5000) * np.exp(-t / .7) * .5
def dist(notes, dur, drive=6.0):  # a distorted guitar chord: clean samples, overdriven and darkened
    y = sum(render('guitar-electric', midi(n), dur, .3, detune=1 + .002 * k) for k, n in enumerate(notes)); y = np.tanh(y * drive) / np.tanh(drive)
    return lp(y, 2800) * .5
M = Mix(LEN * 3 + 8); rng = np.random.default_rng(5)
for p in range(3):
    o = p * LEN
    for bi in range(NB):
        t0 = o + bi * BAR; sec = bi // 8; b = BASS[bi % 8]; ch = CH[b]; last = bi == NB - 1
        # the figure: clean guitar, always there (alone in the last bar, where the loop turns over)
        for k, n in enumerate(FIG):
            g = .2 if sec < 5 else .16; M.add(render('guitar-electric', midi(n), BEAT * .9, .6), t0 + k * BEAT / 2 + rng.normal(0, .003), g * (1.1 if k % 4 == 0 else .9), -.2)
            if sec >= 2 and not last: M.add(render('guitar-electric', midi(n) + 12, BEAT * .7, .5, detune=1.004), t0 + k * BEAT / 2 + .012, .07, .35)
        if last: continue
        # the heartbeat: from the second section, once a bar; twice a bar from the fourth; every beat at the peak
        if sec >= 1:
            beats = [0] if sec < 3 else [0, 2] if sec < 5 else [0, 1, 2, 3]; hg = [0, .5, .6, .7, .8, .9, 1.0][sec]
            for q in beats: M.add(heart(hg, bi), t0 + q * BEAT, .9, 0)
        # bass: a held low note from the second section, pulsing quavers from the fourth
        if 1 <= sec <= 2: M.add(render('contrabass', midi(b), BAR, .6), t0, .2, 0)
        if sec >= 3:
            for k in range(8): M.add(render('bass-electric', midi(b) + 12 if midi(b) < midi('C2') else midi(b), BEAT * .45, .1), t0 + k * BEAT / 2, .17 + .03 * (sec - 3), 0)
        # strings: a held chord from the third section, tremolo from the fifth
        if sec >= 2:
            for n in ch[1:]: M.add(render('cello', midi(n), BAR, .8), t0, .06 + .015 * (sec - 2), -.3)
            M.add(render('violin', midi(ch[2]) + 12, BAR, .8), t0, .05 + .01 * (sec - 2), .3)
        if sec >= 4:
            for k in range(16): M.add(render('violin', midi(ch[2]) + 7 + 12 * (k % 2 == 0), BEAT / 4 * .9, .05), t0 + k * BEAT / 4, .025 + .01 * (sec - 4), .4 - .8 * (k % 2))
        # the piano: low single strokes, the bell of the town
        if sec >= 3 and bi % 2 == 0: M.add(render('piano', midi(b), BAR * 2, 1.2), t0, .22, 0); M.add(bell(73.42, 6), t0, .07, .2)
        # drums: toms from the fourth section, the full kit at the peak
        if sec == 4:
            for q in (0, 2.5, 3): M.add(tom(90, bi), t0 + q * BEAT, .3, .1)
        if sec >= 5:
            for q in (0, 1.5, 2, 3.5): M.add(kick(), t0 + q * BEAT, .5, 0)
            for q in (1, 3): M.add(snare(bi * 4 + q), t0 + q * BEAT, .32, .05)
            for k in range(8): M.add(hp(rng.normal(0, 1, int(.06 * SR)), 7000) * np.exp(-np.arange(int(.06 * SR)) / (.015 * SR)), t0 + k * BEAT / 2, .06, .3)
            if bi % 4 == 0: M.add(crash(bi), t0, .3, -.2)
        # distorted guitars: they swell in over the fifth section and roar through the sixth and seventh
        if sec >= 5:
            M.add(dist([ch[0], ch[1], ch[2]], BAR * .98), t0, .1 if sec == 5 else .14, -.45); M.add(dist([ch[0], ch[1], ch[2]], BAR * .98, 8.0), t0 + .015, .1 if sec == 5 else .14, .45)
    # the swell into the peak, and the cut at the end: a reversed crash and nothing after
    rc = crash(3)[::-1]; M.add(rc, o + 40 * BAR - len(rc) / SR, .35, 0)
n = len(M.L); w = wind(int(LEN * SR), .02, lo=80, hi=400); w = np.tile(w, n // len(w) + 1)[:n]; M.L[:, 0] += w; M.L[:, 1] += np.roll(w, 1300)
mix = reverb(M.L, secs=2.4, decay=.6, lp=5000, wetg=.35, dry=.85); out = loop_cut(mix, LEN, LEN)
export(out, os.path.join(os.path.dirname(__file__), '..', 'listen', 'town_theme_draft2')); print('loop', round(LEN, 1), 's')
