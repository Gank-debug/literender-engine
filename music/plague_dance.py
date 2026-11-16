# The plague town's own house theme: a danse macabre, seamless loop. Original composition, except the Dies Irae
# (13th-century chant, public domain), quoted on bassoon and cello. Kin to the monastery's theme (D minor, the bell,
# the drone, the plucked strings) but its own song: in three, a tabor and a recorder over a hurdy-gurdy, a dance the
# town keeps up because stopping would mean listening to the bell.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 84; BEAT = 60 / BPM; BAR = 3 * BEAT
V = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'C': ['C3', 'G3', 'C4', 'E4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4'], 'A': ['A2', 'E3', 'A3', 'C#4'], 'Eb/D': ['D3', 'G3', 'Bb3', 'Eb4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'Eb': ['Eb3', 'G3', 'Bb3', 'Eb4']}
SA = ['Dm', 'Dm', 'Eb/D', 'Dm', 'Dm', 'C', 'Bb', 'A']        # the dance gathers: drone, harp, tabor
SB = ['Dm', 'C', 'Dm', 'A', 'Dm', 'C', 'Bb', 'A']            # the recorder's tune
SC = ['Dm', 'C', 'Dm', 'Dm', 'Bb', 'Dm', 'C', 'A']           # Dies Irae, low, under the bell
SD = SB                                                      # the whole town dancing: fiddle, rattle, faster tabor
SE = ['Dm', 'Eb/D', 'Dm', 'Eb/D', 'Bb', 'Gm', 'A', 'A']      # the dance stops; the bell and a far recorder
SF = ['Dm', 'Dm', 'Eb/D', 'Dm', 'Gm', 'Eb', 'A', 'A']        # it starts again, as if nothing happened
SONG = SA + SB + SC + SD + SE + SF; NB = len(SONG); LEN = NB * BAR
tune = [[('A4', 1), ('D5', 1), ('E5', 1)], [('F5', 1.5), ('E5', .5), ('D5', 1)], [('C5', 1), ('D5', 1), ('A4', 1)], [('E5', 2), ('C#5', 1)],
        [('A4', 1), ('D5', 1), ('F5', 1)], [('G5', 1), ('E5', 1), ('C5', 1)], [('D5', 1), ('Bb4', 1), ('G4', 1)], [('A4', 3)]]
tune2 = tune[:7] + [[('A4', 1.5), ('C#5', .5), ('E5', 1)]]
dies = [[('F3', 1), ('E3', 1), ('F3', 1)], [('D3', 1), ('E3', 1), ('C3', 1)], [('D3', 2), ('D3', 1)], [(None, 3)],
        [('F3', 1), ('F3', 1), ('G3', 1)], [('F3', 1), ('E3', 1), ('D3', 1)], [('C3', 1), ('E3', 1), ('D3', 1)], [('E3', 3)]]
far = [[('F5', 1.5), ('E5', 1.5)], [('F5', 3)], [('D5', 1.5), ('E5', 1.5)], [('C5', 3)], [('D5', 3)], [('D5', 3)], [(None, 3)], [(None, 3)]]
def tabor(f0=110, dur=.45, seed=0, g=1.0):  # a rope-tensioned drum: a short pitched thump with a snare buzz
    r = np.random.default_rng(seed); t = np.arange(int(dur * SR)) / SR; f = f0 * (1 + .3 * np.exp(-t / .03)); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t / .12) + .35 * r.normal(0, 1, len(t)) * np.exp(-t / .05)) * g
def rattle(dur=.6, seed=0):
    r = np.random.default_rng(seed); n = int(dur * SR); y = np.zeros(n)
    for k in range(int(dur * 14)):
        i = int((k / 14 + r.normal(0, .005)) * SR); L = int(.016 * SR)
        if 0 <= i < n - L: y[i:i + L] += r.normal(0, 1, L) * np.exp(-np.arange(L) / (.004 * SR)) * (.5 + .5 * r.random())
    return y * np.linspace(1, .3, n) * .5
def hurdy(m, dur, seed=0):
    a = render('harmonium', m, dur, 1.4); b = render('bassoon', m, dur, 1.2, detune=1.004); n = min(len(a), len(b))
    t = np.arange(n) / SR; return a[:n] * .8 + b[:n] * .5 * (1 + .3 * np.sin(2 * np.pi * 6.0 * t))
M = Mix(LEN * 3 + 8); rng = np.random.default_rng(7)
def line(inst, notes, t0, gain, pan, rel=.6, legato=1.0, seed=0, detune=1.0, sw=0):
    t = t0; r = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: M.add(render(inst, midi(n), d * BEAT * legato, rel, detune), t + r.normal(0, .008) + sw, gain * (0.9 + .2 * r.random()), pan)
            t += d * BEAT
for p in range(3):
    o = p * LEN
    for bi, ch in enumerate(SONG):
        t0 = o + bi * BAR; v = V[ch]; sec = bi // 8; root = midi(v[0])
        # the drone on D and A, quiet in the break
        dg = {0: .05, 1: .045, 2: .06, 3: .055, 4: .02, 5: .04}[sec]
        M.add(hurdy(midi('D3'), BAR, bi), t0, dg, -.1); M.add(hurdy(midi('A3'), BAR, bi + 50), t0, dg * .6, .15)
        # the bass: plucked on the downbeat
        if sec != 4: M.add(render('contrabass', root - 12 if root >= midi('C3') else root, BEAT * 1.6, .5), t0, .22, 0)
        # the harp: a turning figure in quavers, rolled chords in the break
        if sec != 4:
            fig = [v[0], v[1], v[2], v[3], v[2], v[1]]
            for k, n in enumerate(fig):
                m = midi(n) + (12 if k in (2, 3, 4) else 0); M.add(render('harp', m, BEAT * 1.2, .9), t0 + k * BEAT / 2 + rng.normal(0, .005), (.16 if k == 0 else .1) * (.7 if sec == 3 else 1), -.3 + .1 * k)
        else:
            for k, n in enumerate(v): M.add(render('harp', midi(n) + 12, BAR, 1.4), t0 + k * .07, .09, -.2 + .12 * k)
        # the tabor: ONE-two-three; in the full dance a pickup on the and of two
        if sec in (0, 1, 3, 5) and not (sec == 0 and bi < 2):
            g = .5 if sec == 3 else .38; M.add(tabor(120, .45, bi, 1.0), t0, g, .05); M.add(tabor(150, .3, bi + 9, .6), t0 + 2 * BEAT, g * .7, .05)
            if sec == 3: M.add(tabor(150, .25, bi + 19, .5), t0 + 1.5 * BEAT, g * .5, .05)
            if sec == 3 and bi % 2 == 1: M.add(rattle(.6, bi), t0 + BEAT, .35, .35)
        # the passing bell
        if (sec in (0, 1, 3, 5) and bi % 4 == 0) or sec == 2 or (sec == 4 and bi % 2 == 0): M.add(bell(55.0 if sec != 4 else 73.42, 8), t0, .2 if sec != 2 else .16, .25)
        # the low organ under the chant
        if sec == 2:
            for n in v[:3]: M.add(render('organ', midi(n) - 12, BAR, 1.2), t0, .04, 0)
    line('flute', tune, o + 8 * BAR, .2, -.2, rel=.5, legato=.95, seed=11 + p)
    line('bassoon', dies, o + 16 * BAR, .2, -.15, rel=1.0, legato=1.02, seed=21 + p)
    line('cello', dies, o + 16 * BAR, .15, .2, rel=1.0, legato=1.02, seed=23 + p)
    line('flute', tune2, o + 24 * BAR, .18, -.25, rel=.5, legato=.95, seed=31 + p)
    line('violin', tune2, o + 24 * BAR, .14, .25, rel=.6, legato=.98, seed=33 + p, detune=1.003)
    line('clarinet', [[(n and n[:-1] + str(int(n[-1]) - 1), d) for n, d in b] for b in tune2], o + 24 * BAR, .06, 0, rel=.6, seed=35 + p)
    line('flute', far, o + 32 * BAR, .08, .5, rel=1.5, legato=1.05, seed=41 + p)
    rb = bell(55.0, 6)[::-1][-int(3 * SR):]; M.add(rb * np.linspace(0, 1, len(rb)) ** 2, o + LEN - len(rb) / SR, .3, -.2)
n = len(M.L); w = wind(int(LEN * SR), .03, lo=80, hi=480); w = np.tile(w, n // len(w) + 1)[:n]; M.L[:, 0] += w; M.L[:, 1] += np.roll(w, 1300)
mix = reverb(M.L, secs=3.2, decay=.95, lp=4200, wetg=.5, dry=.8); out = loop_cut(mix, LEN, LEN)
export(out, os.path.join(os.path.dirname(__file__), '..', 'listen', 'town_theme_draft')); print('loop', round(LEN, 1), 's')
