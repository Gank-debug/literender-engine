# "The House Is His": the Hollow Brother's victory, draft 2. Original composition.
# It IS the dark theme, made heavier: same tempo (62), same key, same chords, same opening bars, so the game can cut
# from the dark loop into it on any bar line. Doom-slow rather than action: half-time drums, sustained low guitars,
# a wordless choir, organ, one switch into a churning 12/8 in the middle, and the old out-of-tune guitar at the end.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
from scipy.signal import butter, lfilter
BPM = 62; BEAT = 60 / BPM; BAR = 4 * BEAT
GV = {'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'], 'C/D': ['D3', 'G3', 'C4', 'E4', 'G4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4', 'F4'], 'Eb/D': ['D3', 'G3', 'Bb3', 'Eb4', 'G4'],
      'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4', 'F4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4'],
      'A7': ['A2', 'E3', 'G3', 'C#4', 'E4'], 'Edim/D': ['D3', 'G3', 'Bb3', 'E4', 'G4'], 'A/D': ['D3', 'A3', 'C#4', 'E4', 'A4']}
ROOT = {'Dm': 'D2', 'C/D': 'D2', 'Bb/D': 'D2', 'Eb/D': 'D2', 'Gm': 'G1', 'A': 'A1', 'Bb': 'Bb1', 'Eb': 'Eb2', 'A7': 'A1', 'Edim/D': 'D2', 'A/D': 'D2'}
PAT = [0, 2, 1, 3, 4, 3, 2, 1]
S1a = ['Dm', 'C/D', 'Bb/D', 'Dm']; S1b = ['Dm', 'Eb/D', 'Gm', 'A']
S2 = ['Dm', 'Eb/D', 'Gm', 'A', 'Dm', 'Bb', 'Eb', 'A7']
TURN = ['Dm', 'Eb/D', 'Dm', 'Eb/D']
S3 = ['Bb', 'A', 'Gm', 'Eb', 'Dm', 'Edim/D', 'Eb', 'A']
DROP = ['Edim/D', 'A']
S4 = ['Dm', 'Eb/D', 'Dm', 'Dm']
PLAN = [('open', S1a), ('creep', S1b), ('lament', S2), ('turn', TURN), ('climax', S3), ('drop', DROP), ('after', S4)]
bars = [(s, c) for s, cs in PLAN for c in cs]; NB = len(bars); LEN = NB * BAR + 9
mel2 = [[('A3', 2), ('D4', 1), ('Eb4', 1)], [('D4', 3), ('Bb3', 1)], [('G3', 2), ('Bb3', 1), ('D4', 1)], [('C#4', 3), (None, 1)],
        [('A3', 2), ('D4', 1), ('F4', 1)], [('E4', 2), ('D4', 1), ('Bb3', 1)], [('G3', 1.5), ('Ab3', .5), ('G3', 2)], [('C#4', 2), ('Bb3', 1), ('A3', 1)]]
mel3 = [[('D5', 3), ('F5', 1)], [('E5', 4)], [('D5', 2), ('Bb4', 1), ('G5', 1)], [('G5', 4)], [('F5', 2), ('A5', 1), ('F5', 1)], [('Bb5', 2), ('A5', 1), ('G5', 1)], [('G5', 2), ('Eb5', 1), ('D5', 1)], [('C#5', 4)]]
rs = np.random.default_rng(5)
# ---------------------------------------------------------------- drums: few, huge, in a stone room
def kick(v=1.):
    t = np.arange(int(.9 * SR)) / SR; f = 44 + 90 * np.exp(-t / .045); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .38)
    b, a = butter(2, 3000 / (SR / 2), 'high'); clk = lfilter(b, a, rs.normal(0, 1, len(t))) * np.exp(-t / .003) * .25
    return np.tanh((y + clk) * 1.6) * .9 * v
def snare(v=1.):
    t = np.arange(int(.9 * SR)) / SR; n = rs.normal(0, 1, len(t)); b, a = butter(2, [700 / (SR / 2), 5200 / (SR / 2)], 'band'); n = lfilter(b, a, n)
    body = (np.sin(2 * np.pi * 172 * t) * .8 + np.sin(2 * np.pi * 291 * t) * .35) * np.exp(-t / .09)
    y = n * np.exp(-t / .22) * 1.1 + body; b, a = butter(1, 6000 / (SR / 2)); return np.tanh(lfilter(b, a, y) * 1.2) * .75 * v
def tom(f0, v=1.):
    t = np.arange(int(1.2 * SR)) / SR; f = f0 * (1 + .35 * np.exp(-t / .06)); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .5)
    b, a = butter(2, [300 / (SR / 2), 2500 / (SR / 2)], 'band'); y += lfilter(b, a, rs.normal(0, 1, len(t))) * np.exp(-t / .03) * .3; return y * .8 * v
def cymbal(dur=4., v=1., hp=3500):
    t = np.arange(int(dur * SR)) / SR; b, a = butter(2, [hp / (SR / 2), 9000 / (SR / 2)], 'band'); y = lfilter(b, a, rs.normal(0, 1, len(t))) * np.exp(-t / (dur / 3.5))
    return y * .4 * v
def swell(dur):   # reversed cymbal into a downbeat
    y = cymbal(dur, 1)[::-1]; return y * np.linspace(0, 1, len(y)) ** 2
# ---------------------------------------------------------------- low guitars: sustained, dark, not chugging
def dist(y, drive=7.):
    y = np.tanh(y * drive); b, a = butter(2, 2600 / (SR / 2)); y = lfilter(b, a, y); b, a = butter(1, 70 / (SR / 2), 'high'); return lfilter(b, a, y)
def power(root, dur):
    return dist(sum(render('guitar-electric', root + i, dur, .9) for i in (0, 7, 12)) / 3) * .6
# ---------------------------------------------------------------- the choir: an ensemble of formant voices, never one exposed singer
VOW = {'oo': [(330, 60, 1), (760, 70, .3), (2400, 110, .06), (3300, 130, .04)], 'ah': [(760, 80, 1), (1150, 90, .45), (2800, 120, .18), (3600, 130, .1)],
       'oh': [(470, 70, 1), (820, 80, .4), (2700, 110, .1), (3400, 120, .05)]}
def one_voice(notes, vowel, seed, cents, delay):
    r = np.random.default_rng(seed); total = sum(d for _, d in notes) * BEAT + 2; n = int(total * SR); f0 = np.zeros(n); amp = np.zeros(n); t = delay; prev = None
    rate, depth = 4.8 + r.random() * 1.2, .25 + r.random() * .2
    for m, d in notes:
        a, b = int(t * SR), min(n, int((t + d * BEAT) * SR))
        if m is not None and b > a:
            hz = 440 * 2 ** ((m - 69 + cents / 100) / 12); seg = np.full(b - a, hz)
            if prev: g = min(len(seg), int(.12 * SR)); seg[:g] = np.geomspace(prev, hz, g)
            tt = np.arange(b - a) / SR; seg *= 2 ** (depth / 12 * np.clip((tt - .4) / .8, 0, 1) * np.sin(2 * np.pi * rate * tt + r.random() * 6) / 2)
            f0[a:b] = seg; amp[a:b] = np.minimum(1, tt / .35) * np.clip((len(tt) / SR - tt) / .3, 0, 1); prev = hz
        else: prev = None
        t += d * BEAT
    drift = np.interp(np.arange(n), np.linspace(0, n, 12), 1 + r.normal(0, .0025, 12)); f0 = np.where(f0 == 0, 200, f0) * drift
    ph = np.cumsum(f0) / SR; src = 2 * (ph % 1) - 1; b, a = butter(1, 1300 / (SR / 2)); src = lfilter(b, a, src)
    shimmer = 1 + .08 * np.interp(np.arange(n), np.linspace(0, n, 40), r.normal(0, 1, 40))
    src = src * amp * shimmer + r.normal(0, .05, n) * amp; out = np.zeros(n)
    for fc, bw, g in VOW[vowel]: b, a = butter(2, [max(40, fc - bw) / (SR / 2), (fc + bw) / (SR / 2)], 'band'); out += lfilter(b, a, src) * g
    return out
def choir(notes, vowel='oo', n=6, seed=0):
    return sum(one_voice(notes, vowel, seed * 31 + k, (k - n / 2) * 4.5 + np.random.default_rng(seed + k).normal(0, 2), k * .018) for k in range(n)) / np.sqrt(n) * 2.4
CHORD = {'Dm': ['D4', 'F4', 'A4'], 'Eb/D': ['D4', 'G4', 'Bb4'], 'Gm': ['D4', 'G4', 'Bb4'], 'A': ['C#4', 'E4', 'A4'], 'Bb': ['D4', 'F4', 'Bb4'], 'Eb': ['Eb4', 'G4', 'Bb4'],
         'A7': ['C#4', 'G4', 'A4'], 'Edim/D': ['E4', 'G4', 'Bb4'], 'C/D': ['C4', 'E4', 'G4'], 'Bb/D': ['D4', 'F4', 'Bb4']}
# ---------------------------------------------------------------- arrange
band, kit = Mix(LEN), Mix(LEN); rng = np.random.default_rng(9)
def line(mix, inst, notes, t0, gain, pan, rel=.8, legato=1.0, seed=0, oct_=0):
    t = t0; r = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: mix.add(render(inst, midi(n) + 12 * oct_, d * BEAT * legato, rel), t + r.normal(0, .01), gain * (0.92 + .16 * r.random()), pan)
            t += d * BEAT
start = {}; T = 0.
for bi, (sec, ch) in enumerate(bars):
    start.setdefault(sec, bi * BAR); t0 = bi * BAR; root = midi(ROOT[ch]); gv = GV[ch]
    # drone, exactly as in the dark theme, all the way through
    band.add(render('contrabass', midi('D2') - 12, BAR, 1.0), t0, .30, 0); band.add(render('harmonium', midi('D2'), BAR, 1.2), t0, .06, 0)
    # the 12-string: identical to the dark loop's first bars; later it keeps picking under the band, then plays alone at the end
    if sec in ('open', 'creep', 'lament', 'after'):
        base = {'open': .32, 'creep': .3, 'lament': .14, 'after': .2}[sec]; det = 1.0 if sec == 'open' else 1.003 if sec != 'after' else 1.008
        for k, pi in enumerate(PAT if sec != 'after' else [0, 2, 1, 3, 2, 1]):
            stepb = BEAT / 2 if sec != 'after' else BAR / 6; m = midi(gv[pi]); t = t0 + k * stepb + rng.normal(0, .008 if sec != 'after' else .02)
            g = base * (1 if k == 0 else .66 + .1 * rng.random())
            band.add(render('guitar-acoustic', m, BEAT * 1.3, 1.2, detune=det * (1 + .004 * (k % 2) * (sec == 'after'))), t, g, -.25 + .1 * pi)
            if sec != 'after' and m + 12 <= midi('D5') + 7: band.add(render('guitar-acoustic', m + 12, BEAT * 1.3, 1.0, detune=1.004 * det), t + .012, g * .38, .3 - .1 * pi)
    # the creeping ostinato, as in the dark loop, from bar 5; doubled by low distorted guitar from the lament on
    if sec in ('creep', 'lament', 'climax'):
        for k, n in enumerate(['D2', 'A2', 'D3', 'Eb3', 'D3', 'A2', 'D3', 'Eb3']):
            band.add(render('piano', midi(n), BEAT * .6, .5), t0 + k * BEAT / 2 + rng.normal(0, .006), (.16 if k % 4 == 0 else .10), -.2)
    # bells: as in the dark theme, deeper as it goes
    if bi % 2 == 0 and sec in ('open', 'creep', 'climax'): band.add(bell(73.42, 7), t0, .2, .2)
    # low guitars: sustained power chords, two takes panned wide
    if sec in ('lament', 'climax'):
        for side, dt in ((-.8, 0), (.8, .013)): band.add(power(root + 12, BAR * .97), t0 + dt, .32 if sec == 'lament' else .4, side)
    if sec == 'creep' and bi == start['creep'] / BAR + 3:
        for side, dt in ((-.8, 0), (.8, .013)): band.add(power(root + 12, BEAT * 2), t0 + 2 * BEAT + dt, .3, side)
    # organ: fills the climax, holds the drop
    if sec in ('climax', 'drop', 'turn'):
        band.add(render('organ', root, BAR, 2), t0, .10, 0)
        for n in CHORD[ch]: band.add(render('organ', midi(n), BAR, 2), t0, .06, (midi(n) % 5 - 2) * .15)
    # drums, half-time: the kick on 1, a huge snare on 3, toms answering; nothing busy
    if sec == 'creep':
        for b_ in (0, 1, 2, 3): kit.add(tom(70, .55 + .1 * (b_ == 0)), t0 + b_ * BEAT, 1, 0)   # the heartbeat from the dark theme, on floor tom
        if bi == start['creep'] / BAR + 3: kit.add(swell(BAR), t0, .9, 0)
    if sec in ('lament', 'climax'):
        kit.add(kick(1), t0, 1, 0); kit.add(snare(1), t0 + 2 * BEAT, 1, .05)
        if sec == 'climax': kit.add(kick(.8), t0 + 2.5 * BEAT, 1, 0); kit.add(cymbal(2.5, .5, 5000), t0 + BEAT, 1, .3); kit.add(cymbal(2.5, .5, 5000), t0 + 3 * BEAT, 1, .3)
        if bi % 4 == 0: kit.add(cymbal(5, 1.1), t0, 1, -.35)
        if bi % 4 == 3: [kit.add(tom(f, .7), t0 + 3 * BEAT + k * BEAT / 4, 1, -.3 + .2 * k) for k, f in enumerate([150, 120, 95, 75])]
    # the switch-up: four bars of 12/8, the creep turned into a churning triplet, toms underneath
    if sec == 'turn':
        tri = BEAT / 3
        for k in range(12):
            n = ['D3', 'A3', 'Eb4', 'D3', 'A3', 'D4'][k % 6] if ch == 'Dm' else ['D3', 'Bb3', 'Eb4', 'D3', 'G3', 'Eb4'][k % 6]
            band.add(render('piano', midi(n), tri * 1.5, .4), t0 + k * tri, .13, .2); band.add(render('cello', midi(n) - 12, tri * .9, .1), t0 + k * tri, .09, -.3)
            if k % 3 == 0: kit.add(tom(95 if k % 6 == 0 else 120, .6), t0 + k * tri, 1, -.2)
        kit.add(kick(.9), t0, 1, 0); kit.add(snare(.8), t0 + 2 * BEAT, 1, 0)
        for side, dt in ((-.8, 0), (.8, .013)): band.add(power(root + 12, BAR * .97), t0 + dt, .22, side)
        if bi == start['turn'] / BAR + 3: kit.add(swell(BAR), t0, 1, 0)
    if sec == 'drop' and bi == start['drop'] / BAR: band.add(bell(73.42, 9), t0, .35, 0); band.add(bell(146.83, 9), t0, .2, .2)
    if sec == 'after' and bi == NB - 1: band.add(bell(73.42, 9), t0 + BAR, .3, 0)
# melodies: the lament on cello (as in the dark loop) with the choir humming it; the climax melody on violins with the choir singing it
line(band, 'cello', mel2, start['lament'], .30, -.15, rel=1.2, legato=1.02, seed=21)
band.add(choir([(midi(n) + 12 if n else None, d) for b in mel2 for n, d in b], 'oo', 6, 1), start['lament'], .16, .1)
line(band, 'violin', mel3, start['climax'], .22, .2, rel=1.4, legato=1.03, seed=41)
line(band, 'violin', [[(n and n[:-1] + str(int(n[-1]) - 1), d) for n, d in b] for b in mel3], start['climax'], .12, -.25, rel=1.4, legato=1.03, seed=51)
band.add(choir([(midi(n), d) for b in mel3 for n, d in b], 'ah', 8, 2), start['climax'], .26, .05)
# held choir chords: humming under the creep, 'oh' under the climax, alone in the drop, fading in the aftermath
for bi, (sec, ch) in enumerate(bars):
    if sec in ('creep', 'climax', 'drop', 'after', 'turn'):
        v = {'creep': ('oo', .07), 'turn': ('oo', .06), 'climax': ('oh', .09), 'drop': ('ah', .16), 'after': ('oo', .05 * (1 - (bi - start['after'] / BAR) / 4))}[sec]
        for k, n in enumerate(CHORD[ch]): band.add(choir([(midi(n) - 12 * (k == 0), 4)], v[0], 4, 100 + bi * 7 + k), bi * BAR, v[1], -.5 + .5 * k)
# wind, as in the dark theme
w = wind(len(band.L), .03, lo=90, hi=520); band.L[:, 0] += w; band.L[:, 1] += np.roll(w, 1300)
mix = reverb(band.L, secs=4.5, decay=1.1, lp=4200, wetg=.7, dry=.7) + reverb(kit.L, secs=3, decay=.7, lp=6000, wetg=.6, dry=.8, seed=4) * .55
fe = int((NB * BAR + 6) * SR); mix[fe:] *= np.linspace(1, 0, len(mix) - fe)[:, None]
export(mix, os.path.join(os.path.dirname(__file__), 'hollow_brother_victory'), peak=.85); print('done', round(len(mix) / SR, 1), 's', {k: round(v / BAR) for k, v in start.items()})
