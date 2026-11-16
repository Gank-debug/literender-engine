# The Strigoi's victory in the plague town, draft 3 (two passes, and a tonal balance matched to the reference the user gave,
# matched by measured EQ only: none of the reference's audio is used). Draft 2: the climax of "the pulse" as a wall of guitars. Original composition
# (the town theme's own figure, chords and melody), at the town's own tempo (80): no speed-up. Like the end of a long
# film-cue build: heavily distorted guitars strummed and left to ring, double-tracked wide, slow heavy drums in a room,
# the figure still ringing on top, then the melody on lead guitar and violins, and the last chord left to die with the bell.
import sys, os, subprocess, base64, wave; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
from scipy.signal import butter, lfilter
BPM = 80; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = ['Dm', 'Dm', 'Eb', 'Eb', 'Gm', 'Gm', 'A', 'A']
ROOT = {'Dm': 'D2', 'Eb': 'Eb2', 'Gm': 'G2', 'A': 'A2'}
V = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4']}
FIG = ['A4', 'D5', 'A5', 'D5', 'F5', 'D5', 'E5', 'D5']
MEL = [('A4', 4), ('D5', 4), ('Eb5', 6), ('D5', 2), ('Bb4', 4), ('D5', 4), ('C#5', 4), ('A4', 4), ('F5', 4), ('E5', 4), ('Eb5', 4), ('G5', 4), ('F5', 4), ('D5', 4), ('E5', 4), ('C#5', 2), ('D5', 2)]
def filt(y, f, kind='low', order=2): b_, a_ = butter(order, np.array(f) / (SR / 2), kind); return lfilter(b_, a_, y)
def amp(y, gain=30, bias=.15):
    """a valve amp and a 4x12 cabinet, roughly: tighten the lows, push the mids, clip asymmetrically twice, then the cabinet"""
    y = filt(y, 120, 'high'); y = y + filt(y, [600, 2200], 'band') * 1.8
    y = np.tanh(y * gain + bias) - np.tanh(bias); y = filt(y, 4000, 'low'); y = np.tanh(y * 2.5) * .8
    y = filt(y, 80, 'high'); y = filt(y, 5000, 'low', 4); y = y + filt(y, [1500, 3000], 'band') * -.35
    return y
def strum(root, dur, k=0, down=True):  # a power chord with the octave and the fifth on top, strummed (the strings hit a few ms apart)
    m = midi(root); notes = [m, m + 7, m + 12, m + 19]; r = np.random.default_rng(k); y = np.zeros(int((dur + .2) * SR))
    for j, n in enumerate(notes if down else notes[::-1]):
        s = render('guitar-electric', n, dur, .4, detune=1 + r.normal(0, .0012)); o = max(0, int((j * .011 + r.normal(0, .002)) * SR)); L = min(len(s), len(y) - o); y[o:o + L] += s[:L]
    pick = filt(r.normal(0, 1, int(.02 * SR)), 3000, 'high') * np.exp(-np.arange(int(.02 * SR)) / (.003 * SR)) * .3; y[:len(pick)] += pick
    return amp(y) * .5
def lead(n, dur, gain=10):
    y = render('guitar-electric', midi(n), dur + .3, .5); t = np.arange(len(y)) / SR; y = y * (1 + .2 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - .25) / .4, 0, 1))
    return amp(y, gain, .05) * .45
def kick(): t = np.arange(int(.6 * SR)) / SR; f = 52 * (1 + .9 * np.exp(-t / .02)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .22) + filt(np.random.default_rng(2).normal(0, 1, len(t)), 1500) * np.exp(-t / .01) * .3
def snare(seed=0):
    r = np.random.default_rng(seed); t = np.arange(int(.6 * SR)) / SR
    body = (np.sin(2 * np.pi * 185 * t) + .5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / .09); wires = filt(r.normal(0, 1, len(t)), [1200, 8000], 'band') * np.exp(-t / .2)
    return body * .7 + wires * .9
def tom(f0): t = np.arange(int(1.0 * SR)) / SR; f = f0 * (1 + .3 * np.exp(-t / .04)); return filt(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .35), 900)
def crash(seed=0, dur=4.0): t = np.arange(int(dur * SR)) / SR; r = np.random.default_rng(seed); y = filt(r.normal(0, 1, len(t)), 3500, 'high') * np.exp(-t / 1.3) + filt(r.normal(0, 1, len(t)), [5000, 9000], 'band') * np.exp(-t / .3) * .5; return y * .4
NB = 32; END = 2; NBAR = NB + END; LEN = NBAR * BAR + 5.0
G = Mix(LEN + 4); D = Mix(LEN + 4); O = Mix(LEN + 4); rng = np.random.default_rng(3)        # guitars, drums, the rest
for bi in range(NBAR):
    t0 = bi * BAR; ch = PROG[(bi // 2) % 8] if bi < NB else 'Dm'; r = ROOT[ch]; first = bi % 2 == 0
    if bi < NB:
        # the wall: eighth-note strums, down and up, let ring; four guitars, two each side
        for k in range(8):
            for j, (pn, dt) in enumerate(((-.9, 0), (-.6, .012), (.9, .007), (.6, .018))):
                G.add(strum(r, BEAT * .55, bi * 100 + k * 4 + j, k % 2 == 0), t0 + k * BEAT / 2 + dt + rng.normal(0, .004), (.32 if k % 2 == 0 else .22) * (1.15 if k == 0 else 1), pn)
        # bass guitar, driven, on the eighths
        for k in range(8): O.add(amp(render('bass-electric', midi(r), BEAT * .5, .15), 4, 0) * .9, t0 + k * BEAT / 2, .45, 0)
        # drums: slow and heavy, half-time: kick on one and the and of two, snare on three; a crash on every bar, toms into each phrase
        for q in (0, 1.5, 2.5) if bi % 2 else (0, 1.5): D.add(kick(), t0 + q * BEAT, .7, 0)
        D.add(snare(bi), t0 + 2 * BEAT, .65, .05); D.add(crash(bi), t0, .45 if first else .3, -.35 if first else .35)
        for k in range(8): D.add(filt(rng.normal(0, 1, int(.12 * SR)), 6000, 'high') * np.exp(-np.arange(int(.12 * SR)) / (.05 * SR)), t0 + k * BEAT / 2, .1, .25)   # the ride
        if bi % 4 == 3:
            for j, (q, f) in enumerate([(3, 120), (3.25, 100), (3.5, 82), (3.75, 68)]): D.add(tom(f), t0 + q * BEAT, .55, .35 - .25 * j)
        # strings: tremolo on the chord, and the organ under it
        if first:
            for n in V[ch]: O.add(render('organ', midi(n), BAR * 2, 1.2), t0, .05, (midi(n) % 5 - 2) * .15)
        for k in range(16): O.add(render('violin', midi(V[ch][2]) + 12 * (k % 2), BEAT / 4 * .9, .06), t0 + k * BEAT / 4, .04, .5 - (k % 2))
    else:
        if bi == NB:  # the end: the last chord struck once and left to ring, with the bell and a last crash
            for j, (pn, dt) in enumerate(((-.9, 0), (-.6, .012), (.9, .007), (.6, .018))): G.add(strum('D2', BAR * 2 + 3, 999 + j), t0 + dt, .45, pn)
            D.add(kick(), t0, .9, 0); D.add(crash(77, 6), t0, .6, 0); D.add(crash(78, 6), t0 + .01, .4, .4); O.add(amp(render('bass-electric', midi('D2'), BAR * 2 + 2, .5), 4, 0), t0, .5, 0)
            O.add(bell(73.42, 9), t0, .5, 0); O.add(bell(55.0, 9), t0 + .02, .45, 0)
            for n in V['Dm']: O.add(render('organ', midi(n), BAR * 2 + 2, 2.0), t0, .06, 0)
# the figure, still ringing on top (lightly driven, as at the end of the town loop), then the melody on lead guitar and violins
for bi in range(NB):
    for k, n in enumerate(FIG): O.add(lead(n if bi < 16 else n[:-1] + str(int(n[-1]) + 1), BEAT * .5, 4), bi * BAR + k * BEAT / 2, .2 if bi < 8 else .12 if bi < 16 else .1, .15)
t = 8 * BAR
t = 8 * BAR; acc = 0
for n, d in MEL:
    if acc >= 32: break
    O.add(lead(n, d * BEAT, 14), t, .3, -.1); O.add(render('violin', midi(n) + 12, d * BEAT * 1.02, .8), t, .12, .3); t += d * BEAT; acc += d
t = 16 * BAR                                                          # the second time round: the whole melody, lead and violins and the cellos under
for n, d in MEL: O.add(lead(n, d * BEAT, 16), t, .32, -.1); O.add(render('violin', midi(n) + 12, d * BEAT * 1.02, .8), t, .14, .3); O.add(render('cello', midi(n) - 12, d * BEAT * 1.02, .8), t, .12, -.3); t += d * BEAT
dr = reverb(D.L, secs=1.6, decay=.6, lp=7000, wetg=.45, dry=.9); gr = reverb(G.L, secs=1.2, decay=.4, lp=5000, wetg=.18, dry=1.0); orr = reverb(O.L, secs=2.6, decay=.8, lp=5000, wetg=.4, dry=.85)
n = min(len(dr), len(gr), len(orr)); mix = dr[:n] + gr[:n] + orr[:n]
# tonal balance: per third-octave band, the difference measured between draft 2 and the climax of the reference (dB), clamped:
# taste and clamped: much more low end, less boxy low-mid, more upper-mid bite
EQ = [(40, 8.1), (50, 7.5), (63, 14.6), (80, 16.6), (101, 7.2), (127, 5.7), (160, 6.7), (202, .6), (254, 1.4), (320, -.9), (403, 1.3), (508, -2.3), (640, -6.7), (806, -4.7), (1016, -1.4), (1280, -1.4), (1613, 2.1), (2032, 6.8), (2560, 7.1), (3225, 7.4), (4064, 6.5), (5120, 3.7), (6451, -.4), (8127, -4.7), (10240, -6.4)]
ef = np.array([f for f, _ in EQ]) * 2 ** (1 / 6); eg = np.clip(np.array([g for _, g in EQ]), -7, 13)
for c in range(2):
    X = np.fft.rfft(mix[:, c]); fr = np.fft.rfftfreq(len(mix), 1 / SR); gdb = np.interp(np.log(np.maximum(fr, 20)), np.log(ef), eg); gdb[fr < 30] = -12
    mix[:, c] = np.fft.irfft(X * 10 ** (gdb / 20), len(mix))
mix = np.tanh(mix / np.abs(mix).max() * 1.6) / np.tanh(1.6)            # a little bus saturation, as a mastered rock mix
pk = np.abs(mix).max(); y = mix / pk * .95; n = int(LEN * SR); y = y[:n]; f = int(3 * SR); y[-f:] *= np.linspace(1, 0, f)[:, None]
here = os.path.dirname(os.path.abspath(__file__)); wav = os.path.join(here, '_metal.wav')
with wave.open(wav, 'wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
mp3 = os.path.join(here, '..', 'listen', 'town_victory_metal3.mp3'); ogg = os.path.join(here, '..', 'listen', 'town_victory_metal3.ogg')
subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, '-b:a', '128k', mp3], check=True); subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3', ogg], check=True); os.remove(wav)
open(os.path.join(here, '..', 'game2', 'townmetal.js'), 'w').write("// The Strigoi's victory in the town: the climax of the pulse as a wall of guitars (music/plague_metal2.py). 80 BPM, plays once.\n" + f"const METAL_OGG = '{base64.b64encode(open(ogg, 'rb').read()).decode()}';\nconst METAL_MP3 = '{base64.b64encode(open(mp3, 'rb').read()).decode()}';\n")
print('len', round(LEN, 1), 's')
