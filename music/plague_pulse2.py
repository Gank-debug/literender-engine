# The plague town's house theme, draft 3: "the pulse", slowed to the monastery's pace and built from its sounds.
# Original composition. Same tempo, key and instruments as the monastery theme (62 BPM, D minor, the fingerpicked
# 12-string, the harmonium, the cello, the bell, the rising fourth A-D), but its own song: one small figure that
# never changes, a heartbeat under it, and the house slowly filling with organ and strings around it until it
# all stops and the figure is alone again. The infection as music: the same small thing, repeating, while the
# body around it fails.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 62; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'A', 'A']
V = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4']}
FIG = ['A3', 'D4', 'A4', 'D4', 'F4', 'D4', 'E4', 'D4']                # the figure: the rising fourth, then a turn on D
mel = [[('A3', 2), ('D4', 2)], [('F4', 3), ('E4', 1)], [('D4', 2), ('Bb3', 2)], [('F4', 4)], [('G4', 2), ('F4', 1), ('D4', 1)], [('Bb3', 4)], [('A3', 2), ('C#4', 1), ('E4', 1)], [('D4', 4)]]
NS = 5; NB = NS * 8; LEN = NB * BAR
def lp(y, f): b_, a_ = butter(2, f / (SR / 2)); return lfilter(b_, a_, y)
def heart(g=1.0):  # lub-dub
    t = np.arange(int(.6 * SR)) / SR
    def th(f0, d): f = f0 * (1 + .6 * np.exp(-t / .02)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / d)
    y = th(50, .1); y2 = np.zeros_like(y); k = int(.2 * SR); y2[k:] = th(44, .08)[:-k] * .7; return lp(y + y2, 200) * g
def boom(f0=48, dur=2.0): t = np.arange(int(dur * SR)) / SR; f = f0 * (1 + .3 * np.exp(-t / .05)); return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .7) + .2 * np.random.default_rng(2).normal(0, 1, len(t)) * np.exp(-t / .03), 400)
M = Mix(LEN * 3 + 8); rng = np.random.default_rng(3)
def line(inst, notes, t0, gain, pan, rel=1.0, legato=1.02, seed=0, oct=0):
    t = t0; r = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: M.add(render(inst, midi(n) + 12 * oct, d * BEAT * legato, rel), t + r.normal(0, .01), gain * (.92 + .16 * r.random()), pan)
            t += d * BEAT
for p in range(3):
    o = p * LEN
    for bi in range(NB):
        t0 = o + bi * BAR; sec = bi // 8; ch = PROG[bi % 8]; v = V[ch]; last = bi == NB - 1
        # the figure, on the 12-string: always there, never changing; alone in the last bar, where the loop turns over
        for k, n in enumerate(FIG):
            t = t0 + k * BEAT / 2 + rng.normal(0, .006); g = (.24 if k == 0 else .17) * (1 if sec < 4 else .85)
            M.add(render('guitar-nylon', midi(n), BEAT * 1.4, 1.1), t, g, -.2); M.add(render('guitar-nylon', midi(n) + 12, BEAT * 1.0, .8, detune=1.006), t + .02, g * .3, .3)
        if last: continue
        # the harmonium drone on D, from the start; swelling with the sections
        M.add(render('harmonium', midi('D3'), BAR, 1.4), t0, .03 + .012 * sec, 0); M.add(render('harmonium', midi('A3'), BAR, 1.4), t0, .02 + .008 * sec, .1)
        # the heartbeat: every second beat from the second section, every beat from the fourth
        if sec >= 1:
            for q in ([0, 2] if sec < 3 else [0, 1, 2, 3]): M.add(heart(.5 + .12 * sec), t0 + q * BEAT, .6, 0)
        # the bass: a held contrabass under the chord
        if sec >= 1: M.add(render('contrabass', midi(v[0]) - 12 if midi(v[0]) >= midi('C3') else midi(v[0]), BAR, 1.0), t0, .2 + .03 * sec, 0)
        # the bell, every second bar from the third section
        if sec >= 2 and bi % 2 == 0: M.add(bell(55.0, 8), t0, .18, .25)
        # held strings from the third section; the organ from the fourth; tremolo and the booms at the top
        if sec >= 2:
            for n in v[1:]: M.add(render('cello', midi(n), BAR, 1.2), t0, .04 + .015 * (sec - 2), -.3)
        if sec >= 3:
            for n in v: M.add(render('organ', midi(n), BAR, 1.4), t0, .03 + .015 * (sec - 3), (midi(n) % 5 - 2) * .12)
            M.add(boom(48 if ch != 'A' else 55), t0, .45, 0)
        if sec == 4:
            for k in range(16): M.add(render('violin', midi(v[2]) + 12 * (k % 2), BEAT / 4 * .9, .06), t0 + k * BEAT / 4 + rng.normal(0, .004), .035, .4 - .8 * (k % 2))
            M.add(boom(48 if ch != 'A' else 55), t0 + 2 * BEAT, .35, 0)
    # the melody: the cello in the third section, cello and organ in the fourth, the violins an octave up at the top
    line('cello', mel, o + 16 * BAR, .24, -.15, seed=10 + p); line('cello', mel, o + 24 * BAR, .22, -.15, seed=20 + p); line('organ', mel, o + 24 * BAR, .05, .1, seed=21 + p, oct=1)
    line('violin', mel, o + 32 * BAR, .2, .15, seed=30 + p, oct=1); line('cello', mel, o + 32 * BAR, .2, -.2, seed=31 + p)
    rb = bell(55.0, 6)[::-1][-int(4.5 * SR):]; M.add(rb * np.linspace(0, 1, len(rb)) ** 2, o + 32 * BAR - len(rb) / SR, .3, -.2)
n = len(M.L); w = wind(int(LEN * SR), .03, lo=80, hi=480); w = np.tile(w, n // len(w) + 1)[:n]; M.L[:, 0] += w; M.L[:, 1] += np.roll(w, 1300)
mix = reverb(M.L, secs=3.6, decay=1.0, lp=3800, wetg=.6, dry=.75); out = loop_cut(mix, LEN, LEN)
export(out, os.path.join(os.path.dirname(__file__), '..', 'listen', 'town_theme_draft3')); print('loop', round(LEN, 1), 's')
