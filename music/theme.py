# "The Hollow Brother" main theme, draft 1. Original composition.
# Rendered from MIT-licensed tonejs-instruments samples with a small numpy sampler:
# 12-string style fingerpicked guitar (doubled an octave up, detuned), harmonium drone,
# cello, violin, piano, harp, a synthesised monastery bell, wind, and a long stone-hall reverb.
import numpy as np, subprocess, os, re, functools
SR = 44100
SAMP = os.path.join(os.path.dirname(__file__), '..', 'tonejs-instruments', 'samples')
NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B']
def midi(n):
    m = re.match(r'([A-G])(#|b|s)?(-?\d)', n); b = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[m.group(1)]
    if m.group(2) in ('#', 's'): b += 1
    if m.group(2) == 'b': b -= 1
    return 12 * (int(m.group(3)) + 1) + b

@functools.lru_cache(None)
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    i0 = np.argmax(np.abs(x) > 0.004 * np.abs(x).max()); return x[max(0, i0 - 40):]
@functools.lru_cache(None)
def bank(inst):
    out = {}
    for f in os.listdir(os.path.join(SAMP, inst)):
        if not f.endswith('.ogg') or ' ' in f: continue
        out[midi(f[:-4])] = os.path.join(SAMP, inst, f)
    return out

def render(inst, m, dur, rel=0.6, detune=1.0):
    b = bank(inst); k = min(b, key=lambda q: abs(q - m)); x = load(b[k]); ratio = 2 ** ((m - k) / 12) * detune
    need = int((dur + rel) * SR * ratio) + 2
    if len(x) < need:  # sustain: loop the middle with crossfades
        a, z = int(len(x) * .35), int(len(x) * .8); seg = x[a:z]; cf = min(2048, len(seg) // 4); out = x[:z].copy()
        while len(out) < need:
            s = seg.copy(); w = np.linspace(0, 1, cf); out[-cf:] = out[-cf:] * (1 - w) + s[:cf] * w; out = np.concatenate([out, s[cf:]])
        x = out
    idx = np.arange(0, need - 1, ratio); y = np.interp(idx, np.arange(len(x)), x[:len(x)])
    n = int((dur + rel) * SR); y = y[:n]
    if len(y) < n: y = np.pad(y, (0, n - len(y)))
    env = np.ones(n); r0 = int(dur * SR); env[r0:] = np.linspace(1, 0, n - r0) ** 2; return y * env

def bell(f0, dur=9.0):
    t = np.arange(int(dur * SR)) / SR; y = np.zeros_like(t)
    for r, a, d in [(.5, .9, 3.2), (1, 1, 2.6), (1.19, .5, 1.8), (1.56, .35, 1.4), (2, .45, 1.2), (2.51, .25, .9), (2.98, .18, .7), (4.1, .1, .5)]:
        y += a * np.sin(2 * np.pi * f0 * r * t + r) * np.exp(-t / d) * (1 + .002 * np.sin(2 * np.pi * 1.3 * t))
    y *= np.minimum(1, t / .004); return y * .35

# ---------------------------------------------------------------- the score
BPM = 74; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = {'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'], 'C/D': ['D3', 'G3', 'C4', 'E4', 'G4'], 'Bb/D': ['D3', 'F3', 'Bb3', 'D4', 'F4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4', 'F4'],
      'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4'], 'Dm/F': ['F2', 'D3', 'A3', 'D4', 'F4'],
      'Em7b5': ['E2', 'Bb2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'], 'F/A': ['A2', 'F3', 'A3', 'C4', 'F4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4'], 'A7': ['A2', 'E3', 'G3', 'C#4', 'E4']}
ROOT = {'Dm': 'D2', 'C/D': 'D2', 'Bb/D': 'D2', 'Bb': 'Bb1', 'F': 'F2', 'C': 'C2', 'Gm': 'G1', 'Dm/F': 'F2', 'Em7b5': 'E2', 'A': 'A1', 'F/A': 'A1', 'Eb': 'Eb2', 'A7': 'A1'}
intro = ['Dm', 'C/D', 'Bb/D', 'Dm'] * 2
A = ['Dm', 'Bb', 'F', 'C', 'Gm', 'Dm/F', 'Em7b5', 'A']
B = ['Bb', 'F/A', 'Gm', 'Dm', 'Eb', 'Bb', 'Gm', 'A7']
A2 = ['Dm', 'Bb', 'F', 'C', 'Gm', 'Dm/F', 'A', 'Dm']
coda = ['Dm', 'C/D', 'Dm']
song = intro + A + A + B + A2 + coda
mel_A1 = [[('A4', 2), ('D5', 1), ('E5', 1)], [('F5', 3), ('D5', 1)], [('C5', 2), ('A4', 1), ('C5', 1)], [('E5', 3), (None, 1)],
          [('D5', 2), ('Bb4', 1), ('G4', 1)], [('A4', 2), ('F4', 1), ('A4', 1)], [('G4', 1.5), ('Bb4', .5), ('E5', 2)], [('C#5', 3), (None, 1)]]
mel_A2 = [[('D5', 1), ('E5', 1), ('F5', 1), ('A5', 1)], [('G5', 2), ('F5', 1), ('D5', 1)], [('C5', 1), ('F5', 1), ('A5', 2)], [('G5', 2), ('E5', 1), ('C5', 1)],
          [('Bb5', 2), ('A5', 1), ('G5', 1)], [('F5', 1), ('E5', 1), ('D5', 2)], [('E5', 1), ('G5', 1), ('Bb5', 1), ('E5', 1)], [('C#5', 2), ('E5', 1), ('A4', 1)]]
mel_B = [[('D5', 3), ('F5', 1)], [('C5', 4)], [('Bb4', 2), ('D5', 1), ('G5', 1)], [('F5', 4)], [('G5', 2), ('Eb5', 1), ('Bb4', 1)], [('D5', 3), ('F5', 1)], [('G5', 2), ('Bb5', 1), ('A5', 1)], [('A5', 2), ('G5', 1), ('E5', 1)]]
cello_B = [[('Bb2', 2), ('D3', 2)], [('A2', 4)], [('G2', 2), ('Bb2', 2)], [('D3', 2), ('F3', 2)], [('Eb3', 2), ('G2', 2)], [('Bb2', 2), ('F3', 2)], [('G2', 2), ('Bb2', 2)], [('A2', 2), ('C#3', 2)]]
mel_A3 = mel_A1[:6] + [[('E5', 2), ('C#5', 2)], [('D5', 4)]]

total = len(song) * BAR + 12
L = np.zeros((int(total * SR) + SR, 2))
def add(y, t, gain=1., pan=0.):
    i = int(t * SR); y = y * gain; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    n = min(len(y), len(L) - i); L[i:i + n, 0] += y[:n] * l; L[i:i + n, 1] += y[:n] * r
def line(inst, notes, t0, gain, pan, rel=.8, legato=1.0, human=.012, seed=0):
    t = t0; rng = np.random.default_rng(seed)
    for bar in notes:
        for n, d in bar:
            if n: add(render(inst, midi(n), d * BEAT * legato, rel), t + rng.normal(0, human) if t > 0 else t, gain * (0.9 + .2 * rng.random()), pan)
            t += d * BEAT
rng = np.random.default_rng(7)
PAT = [0, 2, 1, 3, 4, 3, 2, 1]
sec = {'intro': (0, 8), 'A1': (8, 16), 'A2': (16, 24), 'B': (24, 32), 'A3': (32, 40), 'coda': (40, 43)}
for bi, ch in enumerate(song):
    t0 = bi * BAR; v = CH[ch]
    # 12-string fingerpicking: each pluck doubled an octave up, quieter and detuned; first pluck accented
    fade = 1.0 if bi < 40 else [1, .8, .6][bi - 40]
    for k, pi in enumerate(PAT):
        if bi >= 42 and k > 0: break
        m = midi(v[pi]); t = t0 + k * BEAT / 2 + rng.normal(0, .008); g = (.34 if k == 0 else .22 + .04 * rng.random()) * fade
        dur = BEAT * (4 if bi >= 42 else 1.3)
        add(render('guitar-acoustic', m, dur, 1.2), t, g, -.25 + .1 * pi)
        if m + 12 <= midi('D5') + 7: add(render('guitar-acoustic', m + 12, dur, 1.0, detune=1.004), t + .012, g * .38, .3 - .1 * pi)
    # harmonium drone on D through the intro, A' and coda: the monastery underneath
    if bi < 8 or bi >= 32: add(render('harmonium', midi('D2'), BAR, 1.2), t0, .07, 0); add(render('harmonium', midi('A2'), BAR, 1.2), t0, .05, 0)
    # cello holds the roots from the first A onward
    if 8 <= bi < 24 or 32 <= bi < 40: add(render('cello', midi(ROOT[ch]) + 12, BAR * .98, 1.0), t0, .22, -.35)
# melodies
line('piano', mel_A1, 8 * BAR, .30, .15, rel=1.6, seed=1)
line('piano', mel_A2, 16 * BAR, .27, .15, rel=1.6, seed=2)
line('violin', mel_B, 24 * BAR, .20, .25, rel=1.2, legato=1.02, seed=3)
line('cello', cello_B, 24 * BAR, .24, -.3, rel=1.0, legato=1.02, seed=4)
line('piano', mel_A3, 32 * BAR, .24, .1, rel=2.2, seed=5)
# harp: a rising arpeggio into B and into A'
for start, notes in [(24 * BAR - BEAT * 2, ['D3', 'F3', 'A3', 'D4', 'F4', 'A4', 'D5', 'F5']), (32 * BAR - BEAT * 2, ['A2', 'E3', 'A3', 'C#4', 'E4', 'G4', 'A4', 'C#5'])]:
    for k, n in enumerate(notes): add(render('harp', midi(n), BEAT * 3, 2), start + k * BEAT / 4, .16, .4)
# violin pad (soft fifths) under B
for bi in range(24, 32):
    r = midi(ROOT[B[bi - 24]]) + 24; add(render('violin', r + 7, BAR, .8), bi * BAR, .045, -.5); add(render('violin', r + 12, BAR, .8), bi * BAR, .04, .5)
# the bell: at the start, into A', and at the end
for t in [0.0, 32 * BAR, 42 * BAR]: add(bell(146.83), t, .22, -.15)
# wind
n = len(L); w = np.random.default_rng(3).normal(0, 1, n); from scipy.signal import butter, lfilter
b_, a_ = butter(2, [120 / (SR / 2), 700 / (SR / 2)], 'band'); w = lfilter(b_, a_, w); t = np.arange(n) / SR
w *= .018 * (0.55 + .45 * np.sin(2 * np.pi * t / 11.3) * np.sin(2 * np.pi * t / 4.7 + 1)); L[:, 0] += w; L[:, 1] += np.roll(w, 900)
# stone-hall reverb: decaying stereo noise impulse, convolved by FFT
from scipy.signal import fftconvolve
ir_t = np.arange(int(3.2 * SR)) / SR; rng2 = np.random.default_rng(11)
irs = [rng2.normal(0, 1, len(ir_t)) * np.exp(-ir_t / .75) for _ in range(2)]
for ir in irs: ir[:int(.02 * SR)] *= np.linspace(0, 1, int(.02 * SR));
b_, a_ = butter(1, 5200 / (SR / 2)); irs = [lfilter(b_, a_, ir) for ir in irs]; irs = [ir / np.sqrt((ir ** 2).sum()) for ir in irs]
wet = np.stack([fftconvolve(L[:, c], irs[c])[:len(L)] for c in range(2)], 1)
mix = L * .78 + wet * .55
# end fade, normalise, soft limit
fe = int((len(song) * BAR + 9) * SR); mix[fe:] *= np.linspace(1, 0, len(mix) - fe)[:, None]
mix /= np.abs(mix).max() / .8; mix = np.tanh(mix * 1.1) / np.tanh(1.1)
out = os.path.join(os.path.dirname(__file__), 'hollow_brother_theme')
(mix * 32767).astype('<i2').tofile(out + '.raw')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', out + '.raw', '-b:a', '192k', out + '.mp3'], check=True)
os.remove(out + '.raw'); print('done', round(len(mix) / SR, 1), 's')
