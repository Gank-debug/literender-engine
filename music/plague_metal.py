# The Strigoi's victory in the plague town: "the pulse" as heavy metal. Original composition (the town theme's own figure,
# chords and melody). Twice the tempo of the house loop (160 against 80) so it can land on any bar line of it. Plays once:
# a hit, the riff with the figure on lead guitar, the melody as a solo over double kick and organ, then the stops and the
# last chord ringing out with the bell.
import sys, os, subprocess, base64, wave; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 160; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = ['Dm', 'Dm', 'Eb', 'Eb', 'Gm', 'Gm', 'A', 'A']
ROOT = {'Dm': 'D2', 'Eb': 'Eb2', 'Gm': 'G2', 'A': 'A2'}
FIG = ['A4', 'D5', 'A5', 'D5', 'F5', 'D5', 'E5', 'D5']
MEL = [('A4', 4), ('D5', 4), ('Eb5', 6), ('D5', 2), ('Bb4', 4), ('D5', 4), ('C#5', 4), ('A4', 4), ('F5', 4), ('E5', 4), ('Eb5', 4), ('G5', 4), ('F5', 4), ('D5', 4), ('E5', 4), ('C#5', 2), ('D5', 2)]
def lp(y, f): b_, a_ = butter(2, f / (SR / 2)); return lfilter(b_, a_, y)
def hp(y, f): b_, a_ = butter(2, f / (SR / 2), 'high'); return lfilter(b_, a_, y)
def amp(y, drive, tone=3200): y = hp(y, 90); y = np.tanh(y * drive) / np.tanh(drive); return lp(lp(y, tone), tone * 1.4)   # an amp and a cabinet, roughly
def power(root, dur, drive=14, mute=False):  # root, fifth, octave
    m = midi(root); y = sum(render('guitar-electric', n, dur, .05 if mute else .5, detune=1 + .0015 * k) for k, n in enumerate([m, m + 7, m + 12]))
    if mute: n = len(y); y = y * np.exp(-np.arange(n) / (.07 * SR))
    return amp(y, drive, 1700 if mute else 3000) * .55
def lead(n, dur, drive=10):
    y = render('guitar-electric', midi(n), dur, .4); t = np.arange(len(y)) / SR; y = y * (1 + .25 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .3))
    return amp(y, drive, 4200) * .5
def kick(): t = np.arange(int(.3 * SR)) / SR; f = 60 * (1 + 2.5 * np.exp(-t / .008)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .1) + hp(np.random.default_rng(1).normal(0, 1, len(t)), 3000) * np.exp(-t / .004) * .4
def snare(seed=0): r = np.random.default_rng(seed); t = np.arange(int(.35 * SR)) / SR; return hp(r.normal(0, 1, len(t)), 900) * np.exp(-t / .1) * .7 + np.sin(2 * np.pi * 200 * t) * np.exp(-t / .04) * .6
def tom(f0): t = np.arange(int(.5 * SR)) / SR; f = f0 * (1 + .4 * np.exp(-t / .03)); return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .2), 800)
def cym(seed=0, dur=2.5, d=.8, lo=5000): t = np.arange(int(dur * SR)) / SR; return hp(np.random.default_rng(seed).normal(0, 1, len(t)), lo) * np.exp(-t / d) * .45
def hat(seed=0): n = int(.05 * SR); return hp(np.random.default_rng(seed).normal(0, 1, n), 8000) * np.exp(-np.arange(n) / (.012 * SR))
NA, NB, NC = 16, 16, 4; NBAR = NA + NB + NC; TAIL = 6.0; LEN = NBAR * BAR + TAIL
M = Mix(LEN + 4); rng = np.random.default_rng(9)
for bi in range(NBAR):
    t0 = bi * BAR; sec = 0 if bi < NA else 1 if bi < NA + NB else 2; ch = PROG[(bi // 2) % 8]; r = ROOT[ch]; first = bi % 2 == 0
    if sec < 2:
        # rhythm guitars, doubled hard left and right: an open power chord on each change, palm-muted gallop the rest
        if first: [M.add(power(r, BEAT * 2), t0 + .006 * j, .5, pn) for j, pn in enumerate((-.8, .8))]
        steps = range(4 if first else 0, 16)
        for k in steps:
            if k % 4 == 3 and sec == 0: continue                      # a gallop: da-da-da, rest
            for j, pn in enumerate((-.8, .8)): M.add(power(r, BEAT / 4, mute=True), t0 + k * BEAT / 4 + rng.normal(0, .003) + .005 * j, .42, pn)
        # bass guitar locked to the chug
        for k in range(0, 16, 2): M.add(amp(render('bass-electric', midi(r), BEAT / 2, .1), 3, 1200), t0 + k * BEAT / 4, .5, 0)
        # drums: double kick in sixteenths, snare on two and four, hats; a crash on every change
        for k in range(16): M.add(kick(), t0 + k * BEAT / 4, .32 if sec == 0 else .36, 0)
        for q in (1, 3): M.add(snare(bi * 4 + q), t0 + q * BEAT, .55, .05)
        for k in range(8): M.add(hat(bi * 8 + k), t0 + k * BEAT / 2, .1, .35)
        if first: M.add(cym(bi), t0, .35 if bi % 8 == 0 else .2, -.3 if bi % 4 == 0 else .3)
        if bi % 8 == 7:                                               # a fill into the next phrase
            for j, (q, f) in enumerate([(2, 140), (2.25, 140), (2.5, 110), (2.75, 110), (3, 85), (3.25, 85), (3.5, 70), (3.75, 70)]): M.add(tom(f), t0 + q * BEAT, .4, .4 - .1 * j)
        # the organ, a choir of dread, on the solo
        if sec == 1 and first:
            v = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4']}[ch]
            for n in v: M.add(render('organ', midi(n), BAR * 2, 1.0), t0, .06, 0)
    else:
        # the stops: four hits on D, the last left to ring with the bell
        hits = [(0, .5), (1.5, .5), (3, .5)] if bi < NBAR - 1 else [(0, 8)]
        for q, dd in hits:
            for j, pn in enumerate((-.8, .8)): M.add(power('D2', BEAT * dd if dd < 1 else 6.0), t0 + q * BEAT + .006 * j, .55, pn)
            M.add(kick(), t0 + q * BEAT, .5, 0); M.add(cym(bi * 3 + int(q), 3.5 if dd > 1 else 1.5, 1.2 if dd > 1 else .5), t0 + q * BEAT, .35, 0); M.add(amp(render('bass-electric', midi('D2'), BEAT * dd if dd < 1 else 6.0, .3), 3, 1200), t0 + q * BEAT, .5, 0)
        if bi == NBAR - 1: M.add(bell(73.42, 8), t0, .45, 0); M.add(bell(55.0, 8), t0 + .02, .35, 0)
# lead guitar: the figure through the riff (an octave up on its second time), the melody as the solo
for bi in range(NA):
    for k, n in enumerate(FIG):
        m = n if bi < 8 else n[:-1] + str(int(n[-1]) + 1)              # the second time round, an octave up
        M.add(lead(m, BEAT * .48), bi * BAR + k * BEAT / 2, .2 if bi < 8 else .15, .1)
t = NA * BAR
for n, d in MEL: M.add(lead(n, d * BEAT * .98, 12), t, .26, .05); M.add(lead(n[:-1] + str(int(n[-1]) - 1), d * BEAT * .98, 9), t + .01, .1, -.2); t += d * BEAT
mix = reverb(M.L, secs=1.8, decay=.5, lp=6000, wetg=.22, dry=.95)
pk = np.abs(mix).max(); y = mix / pk * .95; n = int(LEN * SR); y = y[:n]; f = int(3 * SR); y[-f:] *= np.linspace(1, 0, f)[:, None]
here = os.path.dirname(os.path.abspath(__file__)); wav = os.path.join(here, '_metal.wav')
with wave.open(wav, 'wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
mp3 = os.path.join(here, '..', 'listen', 'town_victory_metal.mp3'); ogg = os.path.join(here, '..', 'listen', 'town_victory_metal.ogg')
subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, '-b:a', '128k', mp3], check=True); subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3', ogg], check=True); os.remove(wav)
open(os.path.join(here, '..', 'game2', 'townmetal.js'), 'w').write("// The Strigoi's victory in the town: the pulse as heavy metal (music/plague_metal.py). 160 BPM, plays once.\n" + f"const METAL_OGG = '{base64.b64encode(open(ogg, 'rb').read()).decode()}';\nconst METAL_MP3 = '{base64.b64encode(open(mp3, 'rb').read()).decode()}';\n")
print('len', round(LEN, 1), 's')
