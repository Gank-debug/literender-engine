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


from scipy.signal import butter, lfilter, fftconvolve
class Mix:
    def __init__(s, seconds): s.L = np.zeros((int(seconds * SR) + SR, 2))
    def add(s, y, t, gain=1., pan=0.):
        i = int(t * SR)
        if i < 0: y = y[-i:]; i = 0
        y = y * gain; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        n = min(len(y), len(s.L) - i)
        if n > 0: s.L[i:i + n, 0] += y[:n] * l; s.L[i:i + n, 1] += y[:n] * r
def reverb(L, secs=3.2, decay=.75, lp=5200, wetg=.55, dry=.78, seed=11):
    ir_t = np.arange(int(secs * SR)) / SR; rng2 = np.random.default_rng(seed)
    irs = [rng2.normal(0, 1, len(ir_t)) * np.exp(-ir_t / decay) for _ in range(2)]
    for ir in irs: ir[:int(.02 * SR)] *= np.linspace(0, 1, int(.02 * SR))
    b_, a_ = butter(1, lp / (SR / 2)); irs = [lfilter(b_, a_, ir) for ir in irs]; irs = [ir / np.sqrt((ir ** 2).sum()) for ir in irs]
    wet = np.stack([fftconvolve(L[:, c], irs[c])[:len(L)] for c in range(2)], 1); return L * dry + wet * wetg
def wind(n, level=.018, seed=3, lo=120, hi=700):
    w = np.random.default_rng(seed).normal(0, 1, n); b_, a_ = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); w = lfilter(b_, a_, w); t = np.arange(n) / SR
    return w * level * (0.55 + .45 * np.sin(2 * np.pi * t / 11.3) * np.sin(2 * np.pi * t / 4.7 + 1))
def export(mix, path, peak=.8):
    mix = mix / (np.abs(mix).max() / peak); mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    (mix * 32767).astype('<i2').tofile(path + '.raw')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', path + '.raw', '-b:a', '192k', path + '.mp3'], check=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', path + '.raw', '-c:a', 'libvorbis', '-q:a', '5', path + '.ogg'], check=True)
    os.remove(path + '.raw')
def loop_cut(L, start, length):
    """L holds three passes of the loop; take the middle one so reverb tails and wind wrap seamlessly."""
    a = int(start * SR); return L[a:a + int(length * SR)]
