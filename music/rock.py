# "The House Is His": the Hollow Brother's victory theme, draft 1. Original composition.
# The dark theme's motifs (rising fourth A-D, the D/E-flat creep, the lament) as gothic rock:
# piano riff, down-tuned distorted guitars, bass, synthesised drums, strings, organ, and a wordless soprano with a choir.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
from scipy.signal import butter, lfilter, sosfilt
BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT
# ---------------------------------------------------------------- drums, synthesised
rs = np.random.default_rng(5)
def kick():
    t = np.arange(int(.5 * SR)) / SR; f = 48 + 110 * np.exp(-t / .03); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .22)
    y += .5 * rs.normal(0, 1, len(t)) * np.exp(-t / .004); return np.tanh(y * 1.8) * .9
def snare():
    t = np.arange(int(.45 * SR)) / SR; n = rs.normal(0, 1, len(t)); b, a = butter(2, [900 / (SR / 2), 7000 / (SR / 2)], 'band'); n = lfilter(b, a, n)
    y = n * np.exp(-t / .13) * 1.4 + np.sin(2 * np.pi * 185 * t) * np.exp(-t / .07) * .8 + np.sin(2 * np.pi * 330 * t) * np.exp(-t / .04) * .3; return np.tanh(y * 1.3) * .8
def hat(open_=False):
    t = np.arange(int((.5 if open_ else .07) * SR)) / SR; n = rs.normal(0, 1, len(t)); b, a = butter(2, 7000 / (SR / 2), 'high'); y = lfilter(b, a, n) * np.exp(-t / (.18 if open_ else .025)) * .22; b, a = butter(1, 11000 / (SR / 2)); return lfilter(b, a, y)
def crash():
    t = np.arange(int(2.6 * SR)) / SR; n = rs.normal(0, 1, len(t)); b, a = butter(2, 4200 / (SR / 2), 'high'); y = lfilter(b, a, n) * np.exp(-t / .9); b, a = butter(1, 9000 / (SR / 2)); y = lfilter(b, a, y)
    y += .3 * np.sin(2 * np.pi * 3870 * t + 4 * np.sin(2 * np.pi * 5230 * t)) * np.exp(-t / .6); return y * .45
def tom(f0):
    t = np.arange(int(.7 * SR)) / SR; f = f0 * (1 + .6 * np.exp(-t / .04)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .3) * .8
KICK, SNARE, HAT, OHAT, CRASH = kick(), snare(), hat(), hat(True), crash()
# ---------------------------------------------------------------- distorted guitar: power chords from the electric samples
def dist(y, drive=9.0):
    y = np.tanh(y * drive); b, a = butter(2, 4300 / (SR / 2)); y = lfilter(b, a, y); b, a = butter(1, 90 / (SR / 2), 'high'); return lfilter(b, a, y)
def power(root, dur, mute=False):
    y = sum(render('guitar-electric', root + i, dur * (0.35 if mute else 1), .12 if mute else .5) for i in (0, 7, 12))
    y = dist(y / 3, 12 if mute else 9)
    if mute: b, a = butter(2, 1400 / (SR / 2)); y = lfilter(b, a, y) * 1.4
    return y * .75
# ---------------------------------------------------------------- the voice: formant synthesis, wordless 'ah'
def voice(notes, t_beats, vowel='ah', vib=.55, bright=1.0, seed=0):
    """notes: list of (midi or None, beats). Returns a signal with portamento, delayed vibrato and breath."""
    F = {'ah': [(800, 80, 1), (1150, 90, .5), (2900, 120, .25), (3900, 130, .2), (4950, 140, .12)], 'oh': [(450, 70, 1), (800, 80, .45), (2830, 100, .15), (3500, 120, .1), (4950, 120, .05)]}[vowel]
    total = sum(d for _, d in notes) * BEAT + 1.2; n = int(total * SR); f0 = np.zeros(n); amp = np.zeros(n); t = 0.0; prev = None
    for m, d in notes:
        a, b = int(t * SR), int((t + d * BEAT) * SR)
        if m is not None:
            hz = 440 * 2 ** ((m - 69) / 12); seg = np.full(b - a, hz)
            if prev: g = min(len(seg), int(.07 * SR)); seg[:g] = np.geomspace(prev, hz, g)
            tt = np.arange(b - a) / SR; vd = np.clip((tt - .25) / .5, 0, 1); seg *= 2 ** (vib / 12 * vd * np.sin(2 * np.pi * 5.6 * tt) / 2)
            f0[a:b] = seg; env = np.minimum(1, tt / .09) * np.minimum(1, (len(tt) / SR - tt) / .12 + .25); amp[a:b] = np.clip(env, 0, 1); prev = hz
        else: prev = None
        t += d * BEAT
    f0[f0 == 0] = 220; ph = np.cumsum(f0) / SR; src = 2 * (ph % 1) - 1                      # sawtooth glottal source
    b, a = butter(1, 2500 * bright / (SR / 2)); src = lfilter(b, a, src)
    src = src * amp + np.random.default_rng(seed).normal(0, .04, n) * amp                       # a little breath
    out = np.zeros(n)
    for fc, bw, g in F:
        lo, hi = max(30, fc - bw), fc + bw; b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); out += lfilter(b, a, src) * g
    return out * 2.2
mid = lambda s: None if s is None else midi(s)
# ---------------------------------------------------------------- the song
#  intro 4 | riff 8 | chorus 8 | bridge 4 | final chorus 8 | out 2
PROG_RIFF = ['Dm', 'Eb', 'Gm', 'A', 'Dm', 'Bb', 'Eb', 'A']
PROG_CH = ['Bb', 'A', 'Gm', 'Eb', 'Dm', 'Edim', 'Eb', 'A']
ROOTS = {'Dm': 'D2', 'Eb': 'Eb2', 'Gm': 'G2', 'A': 'A2', 'Bb': 'Bb2', 'Edim': 'E2'}
CHORD = {'Dm': ['D4', 'F4', 'A4'], 'Eb': ['Eb4', 'G4', 'Bb4'], 'Gm': ['G3', 'Bb3', 'D4'], 'A': ['A3', 'C#4', 'E4'], 'Bb': ['Bb3', 'D4', 'F4'], 'Edim': ['E4', 'G4', 'Bb4']}
SECT = [('intro', ['Dm'] * 4), ('riff', PROG_RIFF), ('chorus', PROG_CH), ('bridge', ['Gm', 'Eb', 'Bb', 'A']), ('final', PROG_CH), ('out', ['Dm', 'Dm'])]
bars = [(name, ch) for name, chs in SECT for ch in chs]; NB = len(bars); LEN = NB * BAR + 7
band, drums = Mix(LEN), Mix(LEN)
RIFF = ['D5', 'A4', 'D5', 'Eb5', 'D5', 'A4', 'F5', 'E5']          # the creep, played as an Evanescence-style piano figure
for bi, (sec, ch) in enumerate(bars):
    t0 = bi * BAR; root = midi(ROOTS[ch]) - (0 if ROOTS[ch][-1] == '2' else 0)
    loud = sec in ('chorus', 'final', 'riff')
    # piano riff: everywhere but the bridge, transposed to sit on the chord
    if sec != 'bridge':
        shift = {'Dm': 0, 'Eb': 1, 'Gm': -2 + 7 - 5, 'A': -5 + 12 - 7, 'Bb': -4, 'Edim': 2}.get(ch, 0) if sec != 'intro' else 0
        shift = {'Dm': 0, 'Eb': 1, 'Gm': 5, 'A': 0, 'Bb': -4, 'Edim': 2}[ch] if sec != 'intro' else 0
        for k, n in enumerate(RIFF): band.add(render('piano', midi(n) + shift - (0 if sec == 'intro' else 12 if k % 2 else 0), BEAT * .55, .7), t0 + k * BEAT / 2, (.26 if sec == 'intro' else .17) * (1.15 if k == 0 else 1), .25)
    if sec == 'intro':
        if bi == 3:  # snare build into the riff
            for k in range(8): drums.add(SNARE, t0 + 2 * BEAT + k * BEAT / 4, .25 + .08 * k, 0)
        band.add(render('organ', midi('D3'), BAR, 1), t0, .05, 0)
        continue
    if sec == 'out':
        if bi == NB - 2:
            drums.add(KICK, t0, 1, 0); drums.add(CRASH, t0, .9, .3); drums.add(CRASH, t0, .7, -.3)
            for side in (-.8, .8): band.add(power(midi('D2'), BAR * 1.8), t0, .55, side)
            band.add(render('bass-electric', midi('D2'), BAR * 1.8, 1.5), t0, .5, 0)
            band.add(voice([(midi('D5'), 6)], 0, vib=.8, seed=9), t0, .55, 0)
            band.add(bell(73.42, 8), t0, .35, 0)
        continue
    # bass: eighths on the root
    for k in range(8): band.add(render('bass-electric', root, BEAT * .48, .08), t0 + k * BEAT / 2, .42 if k % 2 == 0 else .34, 0)
    # guitars: chugging eighths in the riff, held power chords in the choruses, doubled hard left and right
    for side, dt in ((-.85, 0), (.85, .011)):
        if sec == 'riff':
            for k in range(8): band.add(power(root, BEAT / 2, mute=k not in (0, 3, 6)), t0 + k * BEAT / 2 + dt, .42, side)
        elif sec == 'bridge':
            band.add(power(root, BAR), t0 + dt, .30, side)
        else:
            band.add(power(root, BEAT * 2.4), t0 + dt, .46, side); band.add(power(root, BEAT * 1.6), t0 + 2.5 * BEAT + dt, .4, side)
    # drums
    if sec == 'bridge':
        drums.add(KICK, t0, .9, 0); drums.add(SNARE, t0 + 2 * BEAT, .7, 0)
        if bi % 2 == 1:
            for k, f in enumerate([180, 150, 120, 95, 180, 150, 120, 95]): drums.add(tom(f), t0 + k * BEAT / 2, .55, -.4 + .1 * k)
        drums.add(CRASH, t0, .3, .4)
    else:
        for b_ in (0, 1.5, 2.5) if sec == 'riff' else (0, .75, 1.5, 2, 2.5, 3.25): drums.add(KICK, t0 + b_ * BEAT, 1 if b_ == 0 else .85, 0)
        for b_ in (1, 3): drums.add(SNARE, t0 + b_ * BEAT, .85, .05)
        for k in range(8): drums.add(OHAT if (k == 7 and sec != 'riff') else HAT, t0 + k * BEAT / 2, .55 if k % 2 == 0 else .35, .35)
        if sec != 'riff' or bi % 4 == 1: drums.add(CRASH, t0, .55, -.35)
    # strings and organ in the choruses
    if sec in ('chorus', 'final'):
        for n in CHORD[ch]: band.add(render('violin', midi(n) + 12, BAR, .6), t0, .05, (midi(n) % 3 - 1) * .5)
        band.add(render('organ', root + 12, BAR, .8), t0, .06, 0); band.add(render('cello', root + 12, BAR, .6), t0, .12, -.3)
    if sec == 'bridge':
        for n in CHORD[ch]: band.add(render('organ', midi(n), BAR, 1), t0, .07, 0)
# the soprano: the lament from the dark theme, an octave up, over the choruses; a wail over the bridge
LAM = [('A4', 2), ('D5', 1), ('Eb5', 1), ('D5', 3), ('Bb4', 1), ('G4', 2), ('Bb4', 1), ('D5', 1), ('C#5', 3), (None, 1),
       ('A4', 2), ('D5', 1), ('F5', 1), ('E5', 2), ('D5', 1), ('Bb4', 1), ('G4', 1.5), ('Ab4', .5), ('G4', 2), ('C#5', 2), ('Bb4', 1), ('A4', 1)]
LAM2 = [('D5', 2), ('A5', 1), ('Bb5', 1), ('A5', 3), ('F5', 1), ('D5', 2), ('F5', 1), ('A5', 1), ('C#6', 3), (None, 1),
        ('A5', 2), ('D6', 1), ('C6', 1), ('Bb5', 2), ('A5', 1), ('G5', 1), ('G5', 1.5), ('Ab5', .5), ('G5', 2), ('E5', 2), ('C#5', 1), ('D5', 1)]
start = {name: next(i for i, (s, _) in enumerate(bars) if s == name) * BAR for name in ('chorus', 'bridge', 'final')}
band.add(voice([(mid(n), d) for n, d in LAM], 0, seed=1), start['chorus'], .62, .05)
band.add(voice([(mid('A5'), 4), (mid('Bb5'), 4), (mid('F5'), 4), (mid('E5'), 4)], 0, vib=.8, seed=2), start['bridge'], .45, -.05)
band.add(voice([(mid(n), d) for n, d in LAM2], 0, seed=3), start['final'], .6, .05)
# a choir under the final chorus: 'oh' on the chord tones, two octaves
for bi, (sec, ch) in enumerate(bars):
    if sec == 'final':
        for k, n in enumerate(CHORD[ch]):
            band.add(voice([(midi(n), 4)], 0, vowel='oh', vib=.35, bright=.7, seed=10 + bi * 3 + k), bi * BAR, .16, -.6 + .6 * k)
            band.add(voice([(midi(n) - 12, 4)], 0, vowel='oh', vib=.3, bright=.6, seed=40 + bi * 3 + k), bi * BAR, .12, .6 - .6 * k)
# mix: band in a big hall, drums in a tighter room, then glue
B = reverb(band.L, secs=3.4, decay=.9, lp=6000, wetg=.45, dry=.85)
D = reverb(drums.L, secs=1.2, decay=.25, lp=8000, wetg=.35, dry=.95, seed=4)
mix = B * 1.25 + D * .5
if os.environ.get('STEMS'):
    r = lambda a: round(float(20 * np.log10(np.sqrt((a ** 2).mean()) + 1e-9)), 1); a, b = int(12 * BAR * SR), int(20 * BAR * SR)
    print('band', r(B[a:b]), 'drums', r(D[a:b]))
    for nm, X in (('stem_band', B), ('stem_drums', D)): export(X, os.path.join(os.path.dirname(__file__), nm), peak=.85)
fe = int((NB * BAR + 4) * SR); mix[fe:] *= np.linspace(1, 0, len(mix) - fe)[:, None]
export(mix, os.path.join(os.path.dirname(__file__), 'hollow_brother_victory'), peak=.85); print('done', round(len(mix) / SR, 1), 's')
