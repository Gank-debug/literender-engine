# Lords of the Isle: the theme as a seamless loop (intro, A, A, B, A'), 40 bars. Original composition.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 74; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = {'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'], 'C/D': ['D3', 'G3', 'C4', 'E4', 'G4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4', 'F4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4', 'F4'],
      'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4'], 'Dm/F': ['F2', 'D3', 'A3', 'D4', 'F4'],
      'Em7b5': ['E2', 'Bb2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'], 'F/A': ['A2', 'F3', 'A3', 'C4', 'F4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4'], 'A7': ['A2', 'E3', 'G3', 'C#4', 'E4']}
ROOT = {'Dm': 'D2', 'C/D': 'D2', 'Bb/D': 'D2', 'Bb': 'Bb1', 'F': 'F2', 'C': 'C2', 'Gm': 'G1', 'Dm/F': 'F2', 'Em7b5': 'E2', 'A': 'A1', 'F/A': 'A1', 'Eb': 'Eb2', 'A7': 'A1'}
intro = ['Dm', 'C/D', 'Bb/D', 'Dm'] * 2
A = ['Dm', 'Bb', 'F', 'C', 'Gm', 'Dm/F', 'Em7b5', 'A']; B = ['Bb', 'F/A', 'Gm', 'Dm', 'Eb', 'Bb', 'Gm', 'A7']; A2 = ['Dm', 'Bb', 'F', 'C', 'Gm', 'Dm/F', 'A', 'Dm']
LOOP = intro + A + A + B + A2; NB = len(LOOP); LEN = NB * BAR
mel_A1 = [[('A4', 2), ('D5', 1), ('E5', 1)], [('F5', 3), ('D5', 1)], [('C5', 2), ('A4', 1), ('C5', 1)], [('E5', 3), (None, 1)], [('D5', 2), ('Bb4', 1), ('G4', 1)], [('A4', 2), ('F4', 1), ('A4', 1)], [('G4', 1.5), ('Bb4', .5), ('E5', 2)], [('C#5', 3), (None, 1)]]
mel_A2 = [[('D5', 1), ('E5', 1), ('F5', 1), ('A5', 1)], [('G5', 2), ('F5', 1), ('D5', 1)], [('C5', 1), ('F5', 1), ('A5', 2)], [('G5', 2), ('E5', 1), ('C5', 1)], [('Bb5', 2), ('A5', 1), ('G5', 1)], [('F5', 1), ('E5', 1), ('D5', 2)], [('E5', 1), ('G5', 1), ('Bb5', 1), ('E5', 1)], [('C#5', 2), ('E5', 1), ('A4', 1)]]
mel_B = [[('D5', 3), ('F5', 1)], [('C5', 4)], [('Bb4', 2), ('D5', 1), ('G5', 1)], [('F5', 4)], [('G5', 2), ('Eb5', 1), ('Bb4', 1)], [('D5', 3), ('F5', 1)], [('G5', 2), ('Bb5', 1), ('A5', 1)], [('A5', 2), ('G5', 1), ('E5', 1)]]
cello_B = [[('Bb2', 2), ('D3', 2)], [('A2', 4)], [('G2', 2), ('Bb2', 2)], [('D3', 2), ('F3', 2)], [('Eb3', 2), ('G2', 2)], [('Bb2', 2), ('F3', 2)], [('G2', 2), ('Bb2', 2)], [('A2', 2), ('C#3', 2)]]
mel_A3 = mel_A1[:6] + [[('E5', 2), ('C#5', 2)], [('D5', 4)]]
M = Mix(LEN * 3 + 6); rng = np.random.default_rng(7)
def line(inst, notes, t0, gain, pan, rel=.8, legato=1.0, seed=0):
    t = t0; r = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: M.add(render(inst, midi(n), d * BEAT * legato, rel), t + r.normal(0, .012), gain * (0.9 + .2 * r.random()), pan)
            t += d * BEAT
PAT = [0, 2, 1, 3, 4, 3, 2, 1]
for p in range(3):
    o = p * LEN
    for bi, ch in enumerate(LOOP):
        t0 = o + bi * BAR; v = CH[ch]
        for k, pi in enumerate(PAT):
            m = midi(v[pi]); t = t0 + k * BEAT / 2 + rng.normal(0, .008); g = .34 if k == 0 else .22 + .04 * rng.random()
            M.add(render('guitar-acoustic', m, BEAT * 1.3, 1.2), t, g, -.25 + .1 * pi)
            if m + 12 <= midi('D5') + 7: M.add(render('guitar-acoustic', m + 12, BEAT * 1.3, 1.0, detune=1.004), t + .012, g * .38, .3 - .1 * pi)
        if bi < 8 or bi >= 32: M.add(render('harmonium', midi('D2'), BAR, 1.2), t0, .07, 0); M.add(render('harmonium', midi('A2'), BAR, 1.2), t0, .05, 0)
        if 8 <= bi < 24 or 32 <= bi < 40: M.add(render('cello', midi(ROOT[ch]) + 12, BAR * .98, 1.0), t0, .22, -.35)
    line('piano', mel_A1, o + 8 * BAR, .30, .15, rel=1.6, seed=1 + p); line('piano', mel_A2, o + 16 * BAR, .27, .15, rel=1.6, seed=2 + p)
    line('violin', mel_B, o + 24 * BAR, .20, .25, rel=1.2, legato=1.02, seed=3 + p); line('cello', cello_B, o + 24 * BAR, .24, -.3, rel=1.0, legato=1.02, seed=4 + p)
    line('piano', mel_A3, o + 32 * BAR, .24, .1, rel=2.2, seed=5 + p)
    for start, notes in [(o + 24 * BAR - BEAT * 2, ['D3', 'F3', 'A3', 'D4', 'F4', 'A4', 'D5', 'F5']), (o + 32 * BAR - BEAT * 2, ['A2', 'E3', 'A3', 'C#4', 'E4', 'G4', 'A4', 'C#5'])]:
        for k, n in enumerate(notes): M.add(render('harp', midi(n), BEAT * 3, 2), start + k * BEAT / 4, .16, .4)
    for bi in range(24, 32):
        r = midi(ROOT[B[bi - 24]]) + 24; M.add(render('violin', r + 7, BAR, .8), o + bi * BAR, .045, -.5); M.add(render('violin', r + 12, BAR, .8), o + bi * BAR, .04, .5)
    for t in [o, o + 32 * BAR]: M.add(bell(146.83), t, .16, -.15)
n = len(M.L); w = wind(int(LEN * SR), .015); w = np.tile(w, n // len(w) + 1)[:n]; M.L[:, 0] += w; M.L[:, 1] += np.roll(w, 900)
mix = reverb(M.L); out = loop_cut(mix, LEN, LEN)
export(out, os.path.join(os.path.dirname(__file__), 'lords_theme_loop')); print('loop', round(LEN, 1), 's')
