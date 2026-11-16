# The Hollow Brother: the faithful's victory, v2 (more mourning than triumph). Original composition.
# The same rising fourth A-D as the main theme and the dark loop, still in D minor: the house is saved but half of it is in the ground.
# Only once, in the middle, and again on the very last chord, does the third rise to F#. Slower, lower, no bright octave doubling.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 54; BEAT = 60 / BPM; BAR = 4 * BEAT
GV = {'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'], 'D5': ['D3', 'A3', 'D4', 'A4', 'D4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4', 'F4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4', 'F4'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'],
      'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4'], 'Dm/F': ['F2', 'D3', 'A3', 'D4', 'F4'], 'F/A': ['A2', 'F3', 'A3', 'C4', 'F4'],
      'D': ['D3', 'A3', 'D4', 'F#4', 'A4'], 'G/D': ['D3', 'G3', 'B3', 'D4', 'G4'], 'A/D': ['D3', 'A3', 'C#4', 'E4', 'A4'], 'Bm': ['B2', 'F#3', 'B3', 'D4', 'F#4'],
      'G': ['G2', 'D3', 'G3', 'B3', 'D4'], 'D/F#': ['F#2', 'D3', 'A3', 'D4', 'F#4'], 'Em': ['E2', 'B2', 'E3', 'G3', 'B3'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'],
      'Asus': ['A2', 'E3', 'A3', 'D4', 'E4'], 'Gadd9': ['G2', 'D3', 'A3', 'B3', 'D4']}
ROOT = {'Dm': 'D2', 'D5': 'D2', 'Bb/D': 'D2', 'Bb': 'Bb1', 'F': 'F2', 'C': 'C2', 'Gm': 'G1', 'Dm/F': 'F2', 'F/A': 'A1', 'D': 'D2', 'G/D': 'D2', 'A/D': 'D2', 'Bm': 'B1', 'G': 'G1', 'D/F#': 'F#2', 'Em': 'E2', 'A': 'A1', 'Asus': 'A1', 'Gadd9': 'G1'}
intro = ['D5', 'Bb/D', 'D5', 'Asus']
A = ['Dm', 'Bb', 'F', 'C', 'Gm', 'Dm/F', 'Asus', 'A']
B = ['Bb', 'F/A', 'Gm', 'D', 'Bb', 'F/A', 'Gm', 'Asus']
A2 = ['Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'Asus', 'A']
coda = ['Dm', 'Bb/D', 'Dm', 'D']
SONG = intro + A + B + A2 + coda
mel_A = [[('A3', 2), ('D4', 1), ('E4', 1)], [('F4', 3), ('D4', 1)], [('C4', 2), ('A3', 1), ('C4', 1)], [('E4', 3), (None, 1)],
         [('D4', 2), ('Bb3', 1), ('G3', 1)], [('A3', 2), ('F3', 1), ('A3', 1)], [('G3', 2), ('E3', 2)], [('C#4', 3), (None, 1)]]
mel_B = [[('D5', 3), ('F5', 1)], [('C5', 4)], [('Bb4', 2), ('D5', 1), ('G5', 1)], [('F#5', 4)], [('F5', 2), ('D5', 1), ('Bb4', 1)], [('C5', 2), ('A4', 2)], [('Bb4', 2), ('G4', 1), ('Bb4', 1)], [('A4', 4)]]
mel_A2 = [[('A3', 2), ('D4', 1), ('E4', 1)], [('F4', 4)], [('C4', 2), ('A3', 2)], [('E4', 4)],
          [('D4', 2), ('Bb3', 2)], [('F4', 2), ('D4', 1), ('Bb3', 1)], [('A3', 2), ('G3', 1), ('E3', 1)], [('A3', 4)]]
PAT = [0, 2, 1, 3, 4, 3, 2, 1]
LEN = len(SONG) * BAR; M = Mix(LEN + 14); rng = np.random.default_rng(4)
def line(inst, notes, t0, gain, pan, rel=.9, legato=1.0, seed=0):
    t = t0; r = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: M.add(render(inst, midi(n), d * BEAT * legato, rel), t + r.normal(0, .012), gain * (.9 + .15 * r.random()), pan)
            t += d * BEAT
for bi, ch in enumerate(SONG):
    t0 = bi * BAR; gv = GV[ch]; sec = 0 if bi < 4 else 1 + (bi - 4) // 8; last = bi >= len(SONG) - 4
    # harmonium on the root, very low and soft: the floor, no longer the crypt
    M.add(render('harmonium', midi(ROOT[ch]) + 12, BAR, 1.6), t0, .05 if sec != 2 else .08, 0)
    if sec >= 1 and not last: M.add(render('contrabass', midi(ROOT[ch]), BAR * .95, 1.0), t0, .16, 0)
    # the 12-string, fingerpicked as in the main theme but slower and lighter; in the coda only every other note
    base = .22 if sec in (0, 4) else .15
    for k, pi in enumerate(PAT):
        if last and k % 2: continue
        m = midi(gv[pi]); t = t0 + k * BEAT / 2 + rng.normal(0, .01); g = base * (1 if k == 0 else .62 + .1 * rng.random()) * (1 - .12 * (bi == len(SONG) - 1))
        M.add(render('guitar-acoustic', m, BEAT * 1.6, 1.4), t, g, -.25 + .1 * pi)
        if sec == 0: M.add(render('guitar-acoustic', m + 12, BEAT * 1.6, 1.2, detune=1.003), t + .014, g * .18, .3 - .1 * pi)
    # soft strings: fifths in the violins under B and A', a sustained cello under the guitar in A
    if sec in (2, 3):
        r = midi(ROOT[ch]) + 24; M.add(render('violin', r + 7, BAR, 1.0), t0, .03, -.5); M.add(render('violin', r + 12, BAR, 1.0), t0, .028, .5)
# the motif: cello first (low, plain), violin in the middle, piano and harp at the last
line('cello', mel_A, 4 * BAR, .24, -.3, rel=1.2, legato=1.03, seed=1)
line('violin', [[(n and n[:-1] + str(int(n[-1]) - 1), d) for n, d in bar] for bar in mel_B], 12 * BAR, .16, .3, rel=1.6, legato=1.05, seed=2)
line('cello', [[(n and n[:-1] + str(int(n[-1]) - 2), d) for n, d in bar] for bar in mel_B], 12 * BAR, .07, -.3, rel=1.4, legato=1.05, seed=6)
line('piano', mel_A2, 20 * BAR, .22, .12, rel=3.0, seed=3)
line('cello', mel_A2, 20 * BAR, .08, -.3, rel=1.4, legato=1.04, seed=7)
line('harp', [[('A3', 2), ('D4', 1), ('E4', 1)], [('F4', 4)], [(None, 4)], [('A3', 1), ('D4', 1), ('F#4', 2)]], 28 * BAR, .15, .4, rel=3.5, seed=4)
# harp: a rising arpeggio into A' and a falling one into the coda
for start, notes in [(20 * BAR - BEAT * 2, ['D3', 'F3', 'A3', 'D4', 'F4', 'A4']), (28 * BAR - BEAT * 2, ['A4', 'F4', 'D4', 'A3', 'F3', 'D3'])]:
    for k, n in enumerate(notes): M.add(render('harp', midi(n), BEAT * 3, 2.4), start + k * BEAT / 4, .13, .4)
# the bells: one at the start, far off; one at the end, the bell for the dead, and its echo from the tower
M.add(bell(146.83, 9), 0, .16, -.2); M.add(bell(146.83, 12), 28 * BAR, .2, -.15); M.add(bell(73.42, 12), 30 * BAR, .12, .2)
L = M.L; L[:, 0] += wind(len(L), .012); L[:, 1] += np.roll(wind(len(L), .012), 900)
mix = reverb(L, secs=4.0, decay=.95, wetg=.6, dry=.76)
fe = int((LEN + 2) * SR); mix[fe:] *= np.linspace(1, 0, len(mix) - fe)[:, None] ** 1.5
mix[:int(.6 * SR)] *= np.linspace(0, 1, int(.6 * SR))[:, None]
export(mix, os.path.join(os.path.dirname(__file__), 'monks_victory2'), peak=.72)
print('done', round(len(mix) / SR, 1), 's')
