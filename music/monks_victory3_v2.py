# The Hollow Brother: the faithful's victory, v3. Original composition.
# The in-game loop itself (the 12-string, the cello lament, the aftermath guitar), slowed from 62 to 52 and drained of dread:
# no heartbeat, no full organ, the creeping D-Eb ostinato softened to D-F. Under it the brothers chant: a plainchant on the
# motif's rising fourth, a fifth-below organum and a low hummed drone, ending on an Amen and an open D.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
from scipy.signal import butter, lfilter
BPM = 52; BEAT = 60 / BPM; BAR = 4 * BEAT
V = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'Eb/D': ['D3', 'G3', 'Bb3', 'Eb4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4'],
     'Eb': ['Eb3', 'G3', 'Bb3', 'Eb4'], 'A7': ['A2', 'G3', 'C#4', 'E4'], 'A/D': ['D3', 'A3', 'C#4', 'E4'], 'C/D': ['D3', 'G3', 'C4', 'E4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4'], 'D5': ['D3', 'A3', 'D4', 'A4']}
GV = {'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'], 'C/D': ['D3', 'G3', 'C4', 'E4', 'G4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4', 'F4'], 'Eb/D': ['D3', 'G3', 'Bb3', 'Eb4', 'G4'],
      'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4', 'F4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4'],
      'A7': ['A2', 'E3', 'G3', 'C#4', 'E4'], 'A/D': ['D3', 'A3', 'C#4', 'E4', 'A4'], 'D5': ['D3', 'A3', 'D4', 'A4', 'D4']}
intro = ['Dm', 'Dm', 'Bb/D', 'Dm']
S1 = ['Dm', 'C/D', 'Bb/D', 'Dm', 'Dm', 'Eb/D', 'Gm', 'A']
S2 = ['Dm', 'Eb/D', 'Gm', 'A', 'Dm', 'Bb', 'Eb', 'A7']
S4 = ['Dm', 'Bb/D', 'Dm', 'A/D', 'Dm', 'Eb/D', 'Gm', 'A']
coda = ['Gm', 'Bb/D', 'Dm', 'D5']
SONG = intro + S1 + S2 + S4 + coda; NB = len(SONG); LEN = NB * BAR
ROOT = {k: v[0] for k, v in V.items()}
PAT = [0, 2, 1, 3, 4, 3, 2, 1]
mel2 = [[('A3', 2), ('D4', 1), ('Eb4', 1)], [('D4', 3), ('Bb3', 1)], [('G3', 2), ('Bb3', 1), ('D4', 1)], [('C#4', 3), (None, 1)],
        [('A3', 2), ('D4', 1), ('F4', 1)], [('E4', 2), ('D4', 1), ('Bb3', 1)], [('G3', 1.5), ('Ab3', .5), ('G3', 2)], [('C#4', 2), ('Bb3', 1), ('A3', 1)]]
mel4 = [[('A3', 2), ('D4', 1), ('E4', 1)], [('F4', 4)], [('D4', 2), ('A3', 2)], [('C#4', 4)], [('A3', 2), ('D4', 1), ('F4', 1)], [('E4', 2), ('D4', 2)], [('Bb3', 2), ('G3', 2)], [('A3', 4)]]
M = Mix(LEN + 16); rng = np.random.default_rng(12)
def line(inst, notes, t0, gain, pan, rel=.9, legato=1.0, seed=0, detune=1.0):
    t = t0; r = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: M.add(render(inst, midi(n), d * BEAT * legato, rel, detune), t + r.normal(0, .012), gain * (.9 + .15 * r.random()), pan)
            t += d * BEAT
# ---------------------------------------------------------------- the brothers: an ensemble of formant voices
VOW = {'oo': [(330, 60, 1), (760, 70, .3), (2400, 110, .06), (3300, 130, .04)], 'ah': [(700, 80, 1), (1100, 90, .4), (2600, 120, .12), (3400, 130, .06)],
       'oh': [(450, 70, 1), (800, 80, .4), (2700, 110, .08), (3400, 120, .04)], 'mm': [(250, 50, 1), (2100, 120, .02)]}
def one_voice(notes, vowel, seed, cents, delay, att=.5, rel=.6):
    r = np.random.default_rng(seed); total = sum(d for _, d in notes) * BEAT + 3; n = int(total * SR); f0 = np.zeros(n); amp = np.zeros(n); t = delay; prev = None
    for m, d in notes:
        a, b = int(t * SR), min(n, int((t + d * BEAT) * SR))
        if m is not None and b > a:
            hz = 440 * 2 ** ((m - 69 + cents / 100) / 12); seg = np.full(b - a, hz)
            if prev: g = min(len(seg), int(.16 * SR)); seg[:g] = np.geomspace(prev, hz, g)
            f0[a:b] = seg; tt = np.arange(b - a) / SR; amp[a:b] = np.minimum(1, tt / att) if prev is None else 1; prev = hz
            nxt_rest = True
        else:
            if prev is not None and a > 0:  # release into the rest
                k = min(int(rel * SR), n - a); amp[a:a + k] = np.linspace(1, 0, k) if k > 0 else amp[a:a + k]; f0[a:a + k] = prev
            prev = None
        t += d * BEAT
    if prev is not None:
        a = min(n, int(t * SR)); k = min(int(rel * 2 * SR), n - a); amp[a:a + k] = np.linspace(1, 0, k); f0[a:a + k] = prev
    drift = np.interp(np.arange(n), np.linspace(0, n, 14), 1 + r.normal(0, .002, 14)); f0 = np.where(f0 == 0, 120, f0) * drift
    ph = np.cumsum(f0) / SR; src = 2 * (ph % 1) - 1; b, a = butter(1, 900 / (SR / 2)); src = lfilter(b, a, src)
    shimmer = 1 + .07 * np.interp(np.arange(n), np.linspace(0, n, 50), r.normal(0, 1, 50))
    src = src * amp * shimmer + r.normal(0, .03, n) * amp; out = np.zeros(n)
    for fc, bw, g in VOW[vowel]: b, a = butter(2, [max(40, fc - bw) / (SR / 2), (fc + bw) / (SR / 2)], 'band'); out += lfilter(b, a, src) * g
    return out
def choir(notes, vowel='oo', n=6, seed=0, att=.5, rel=.6):
    return sum(one_voice(notes, vowel, seed * 31 + k, (k - n / 2) * 5 + np.random.default_rng(seed + k).normal(0, 3), k * .025, att, rel) for k in range(n)) / np.sqrt(n) * 2.2
N = lambda s: [(midi(a) if a else None, d) for a, d in s]
P1 = [('A2', 2), ('D3', 1), ('E3', 1), ('F3', 3), ('E3', 1), ('D3', 4), (None, 4)]
P2 = [('D3', 2), ('F3', 1), ('G3', 1), ('A3', 3), ('G3', 1), ('F3', 2), ('E3', 2), ('D3', 4)]
P3 = [('A2', 2), ('C3', 1), ('D3', 1), ('E3', 2), ('D3', 2), ('C3', 2), ('A2', 2), ('D3', 4), (None, 4)]
AMEN = [('E3', 4), ('D3', 10)]
def chant(phrase, bar, vowel, gain, organum=True, seed=0):
    t = bar * BAR; M.add(choir(N(phrase), vowel, 7, seed), t, gain, -.15)
    if organum: M.add(choir(N([(a and a[:-1] + a[-1], d) for a, d in phrase]), vowel, 5, seed + 50)[:0] if False else choir([(m - 7 if m else None, d) for m, d in N(phrase)], vowel, 5, seed + 50), t + .03, gain * .55, .25)
for bar, ph, vw, g in [(4, P1, 'oo', .13), (8, P2, 'ah', .14), (12, P1, 'oo', .07), (16, P3, 'oo', .10), (20, P1, 'ah', .14), (24, P3, 'oh', .14), (28, AMEN, 'ah', .16)]:
    chant(ph, bar, vw, g, seed=bar)
# the hummed drone of the house, D and A, from the first bar to the last
drone = choir([(midi('D2'), NB * 4 - 2)], 'mm', 5, 99, att=3, rel=4) + .7 * choir([(midi('A2'), NB * 4 - 2)], 'mm', 4, 98, att=4, rel=4)
dt = np.arange(len(drone)) / SR; drone *= .75 + .25 * np.sin(2 * np.pi * dt / (BAR * 2))
M.add(drone, 0, .085, 0)
# ---------------------------------------------------------------- light chimes: wind chimes in the cloister, a few at a time, for comfort
def chime(f0, dur=5.0):
    t = np.arange(int(dur * SR)) / SR; y = np.zeros_like(t)
    for r, a_, d in [(1, 1, 2.4), (2.76, .35, 1.1), (5.4, .12, .5), (8.93, .05, .25)]: y += a_ * np.sin(2 * np.pi * f0 * r * t + r) * np.exp(-t / d)
    return y * np.minimum(1, t / .002) * .3
CHN = [midi(n) for n in ['D5', 'F5', 'G5', 'A5', 'C6', 'D6', 'F6']]; cr = np.random.default_rng(77)
for bar in list(range(5, 12)) + list(range(20, 32)):
    if cr.random() < .35 and bar not in (28, 29): continue
    t = bar * BAR + cr.random() * BAR * .5
    for k in range(int(cr.integers(2, 5))):
        m = CHN[int(cr.integers(0, len(CHN)))]; M.add(chime(440 * 2 ** ((m - 69) / 12)), t, .045 * (.7 + .5 * cr.random()), cr.uniform(-.7, .7)); t += cr.uniform(.12, .5)
# ---------------------------------------------------------------- the loop, slowed and softened
for bi, ch in enumerate(SONG):
    t0 = bi * BAR; v = V[ch]; root = midi(ROOT[ch]); sec = 0 if bi < 4 else 1 + (bi - 4) // 8 if bi < 28 else 4; last = bi == NB - 1
    M.add(render('contrabass', midi('D2') - 12 if sec != 4 else root - 12 + (12 if root - 12 < midi('D1') else 0), BAR, 1.2), t0, .2, 0)
    M.add(render('harmonium', midi('D2'), BAR, 1.4), t0, .05, 0)
    if sec in (1, 3) and bi % 4 != 0:  # the ostinato, without its semitone: D-F, low and far
        for k, n in enumerate(['D2', 'A2', 'D3', 'F3', 'D3', 'A2', 'D3', 'F3']): M.add(render('piano', midi(n), BEAT * .7, .7), t0 + k * BEAT / 2 + rng.normal(0, .008), (.09 if k % 4 == 0 else .055), -.2)
    if bi % 8 == 0 or last: M.add(bell(73.42, 10), t0, .18, .2)
    if sec in (0, 1):
        gv = GV[ch]; base = .2 if sec == 0 else .26
        for k, pi in enumerate(PAT):
            if sec == 0 and k % 2: continue
            m = midi(gv[pi]); t = t0 + k * BEAT / 2 + rng.normal(0, .01); g = base * (1 if k == 0 else .64 + .1 * rng.random())
            M.add(render('guitar-acoustic', m, BEAT * 1.6, 1.4), t, g, -.25 + .1 * pi)
            if sec == 1 and m + 12 <= midi('D5') + 7: M.add(render('guitar-acoustic', m + 12, BEAT * 1.6, 1.2, detune=1.004), t + .012, g * .3, .3 - .1 * pi)
    if sec == 2:
        M.add(render('organ', midi(v[0]), BAR, 1.8), t0, .05, -.1)
        for n in v[1:]: M.add(render('organ', midi(n), BAR, 1.8), t0, .035, .1)
        for k, pi in enumerate(PAT[::2]): M.add(render('guitar-acoustic', midi(GV[ch][pi]), BEAT * 2, 1.4), t0 + k * BEAT + rng.normal(0, .01), .14, -.2 + .1 * pi)
    if sec >= 3:
        for k, pi in enumerate([0, 2, 1, 3, 2, 1]):
            if last and k > 0: break
            m = midi(v[pi]) + (12 if pi > 1 else 0); M.add(render('guitar-acoustic', m, BEAT * 1.8, 1.8), t0 + k * BAR / 6 + rng.normal(0, .02), .19 if k == 0 else .13, -.3 + .12 * pi)
        if bi % 2 == 1 and sec == 3: M.add(render('violin', midi('A4'), BAR, 1.6), t0, .028, -.6); M.add(render('violin', midi('D5'), BAR, 1.6), t0, .022, .6)
    if sec == 4: M.add(render('cello', root + (12 if root < midi('C3') else 0), BAR * (2 if last else 1), 2.5), t0, .13, -.3)
# the lament on cello in the middle, and on a muted violin, an octave up, in the aftermath
line('cello', mel2, 12 * BAR, .27, -.15, rel=1.4, legato=1.03, seed=21)
line('violin', [[(n and n[:-1] + str(int(n[-1]) + 1), d) for n, d in b] for b in mel4], 20 * BAR, .1, .25, rel=1.8, legato=1.04, seed=41)
line('harp', [[('D3', 1), ('A3', 1), ('D4', 1), ('F4', 1)], [('A4', 4)]], (NB - 1) * BAR, .12, .4, rel=4, seed=5)
L = M.L; L[:, 0] += wind(len(L), .02, lo=90, hi=520); L[:, 1] += np.roll(wind(len(L), .02, lo=90, hi=520), 1300)
mix = reverb(L, secs=5.0, decay=1.3, lp=4000, wetg=.75, dry=.68)
fe = int((LEN + 4) * SR); mix[fe:] *= np.linspace(1, 0, len(mix) - fe)[:, None] ** 1.5
mix[:int(1.0 * SR)] *= np.linspace(0, 1, int(1.0 * SR))[:, None]
export(mix, os.path.join(os.path.dirname(__file__), 'monks_victory3'), peak=.74)
print('done', round(len(mix) / SR, 1), 's')
