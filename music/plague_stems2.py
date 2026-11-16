# The plague town's house theme, with a melancholy turn: the last eight bars of the loop leave the dread for Bb and F
# (a warm, sad lift into the relative major), then sink back through Gm and A before the loop comes round to D minor again.
# Before that, "the pulse" (draft 5) as four stems that loop together, so the game can build it over the
# nights instead of over four minutes: base (the figure, the drone, the cold Eb, glass, a slow heartbeat, bass and bell)
# from the first day; lament (cello melody, piano, reversed piano, held cellos) from the second; dread (organ, toms, the
# heartbeat doubling, distorted guitars swelling in) from the fourth; storm (the drums, the guitar wall, tremolo violins,
# the melody an octave up) from the sixth. Original composition. 80 BPM, D minor, a chord every two bars: Dm Eb Gm A.
import sys, os, subprocess; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
BPM = 80; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = ['Dm', 'Dm', 'Eb', 'Eb', 'Gm', 'Gm', 'A', 'A'] * 3 + ['Bb', 'Bb', 'F', 'F', 'Gm', 'Gm', 'A', 'A']   # 32 bars; the melancholy turn in bars 25-28
WARM = set(range(24, 28))
V = {'Bb': ['Bb2', 'F3', 'Bb3', 'D4'], 'F': ['F2', 'C3', 'F3', 'A3'], 'C': ['C3', 'G3', 'C4', 'E4'], 'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4'], 'Dm': ['D3', 'A3', 'D4', 'F4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4']}
PW = {'Bb': ['Bb2', 'F3', 'Bb3'], 'F': ['F2', 'C3', 'F3'], 'C': ['C3', 'G3', 'C4'], 'Eb': ['Eb3', 'Bb3', 'Eb4'], 'Dm': ['D3', 'A3', 'D4'], 'Gm': ['G2', 'D3', 'G3'], 'A': ['A2', 'E3', 'A3']}
FIG = ['A3', 'D4', 'A4', 'D4', 'F4', 'D4', 'E4', 'D4']
MEL2 = None
MEL = [('A3', 4), ('D4', 4), ('Eb4', 6), ('D4', 2), ('Bb3', 4), ('D4', 4), ('C#4', 4), ('A3', 4), ('F4', 4), ('E4', 4), ('Eb4', 4), ('G4', 4), ('F4', 4), ('D4', 4), ('E4', 4), ('C#4', 2), ('D4', 2)]
NB = 32; LEN = NB * BAR
MEL2 = MEL[:8] + [('D4', 4), ('F4', 4), ('E4', 4), ('C4', 4), ('D4', 4), ('Bb3', 4), ('E4', 6), ('C#4', 2)]   # the second time round, the melody turns with the chords
assert sum(d for _, d in MEL2) == 64
def lp(y, f): b_, a_ = butter(2, f / (SR / 2)); return lfilter(b_, a_, y)
def hp(y, f): b_, a_ = butter(2, f / (SR / 2), 'high'); return lfilter(b_, a_, y)
def heart(g=1.0):
    t = np.arange(int(.6 * SR)) / SR
    def th(f0, d): f = f0 * (1 + .6 * np.exp(-t / .02)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / d)
    y = th(50, .1); y2 = np.zeros_like(y); k = int(.2 * SR); y2[k:] = th(44, .08)[:-k] * .7; return lp(y + y2, 200) * g
def kick(): t = np.arange(int(.5 * SR)) / SR; f = 50 * (1 + 1.4 * np.exp(-t / .015)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .2)
def snare(seed=0):
    r = np.random.default_rng(seed); t = np.arange(int(.4 * SR)) / SR
    return hp(r.normal(0, 1, len(t)), 1000) * np.exp(-t / .09) * .55 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / .05) * .5
def tom(f0): t = np.arange(int(.9 * SR)) / SR; f = f0 * (1 + .35 * np.exp(-t / .04)); return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .35), 600)
def crash(seed=0): t = np.arange(int(3 * SR)) / SR; return hp(np.random.default_rng(seed).normal(0, 1, len(t)), 5000) * np.exp(-t / .9) * .45
def swell(notes, dur, drive=7.0, rise=.7):
    y = sum(render('guitar-electric', midi(n), dur, .6, detune=1 + .002 * k) for k, n in enumerate(notes)); y = np.tanh(y * drive) / np.tanh(drive); y = lp(y, 2600)
    n = len(y); env = np.minimum(1, np.arange(n) / (rise * dur * SR)) ** 1.5; return y * env * .5
S = {k: Mix(LEN * 3 + 8) for k in ('base', 'lament', 'dread', 'storm')}; rng = np.random.default_rng(4)
def line(m, inst, t0, gain, pan, oct=0, seed=0, mel=None):
    t = t0; r = np.random.default_rng(seed)
    for n, d in mel or MEL: m.add(render(inst, midi(n) + 12 * oct, d * BEAT * 1.02, 1.2), t + r.normal(0, .01), gain, pan); t += d * BEAT
for p in range(3):
    o = p * LEN; b, l, d, s = S['base'], S['lament'], S['dread'], S['storm']
    for bi in range(NB):
        t0 = o + bi * BAR; ch = PROG[bi]; v = V[ch]; c2 = bi % 2 == 0; warm = bi in WARM
        # base
        for k, n in enumerate(FIG):
            t = t0 + k * BEAT / 2 + rng.normal(0, .005); g = .22 if k == 0 else .16
            b.add(render('guitar-nylon', midi(n), BEAT * 1.3, 1.0), t, g, -.2); b.add(render('guitar-nylon', midi(n) + 12, BEAT * .9, .8, detune=1.006), t + .02, g * .3, .3)
        b.add(render('harmonium', midi('D3'), BAR, 1.4), t0, .035, 0)
        if c2 and not warm: b.add(render('violin', midi('Eb5'), BAR * 2, 1.5), t0, .016, .5)      # the cold Eb lets go in the warm bars
        if rng.random() < .45: b.add(render('piano', midi((['F5', 'A5', 'C6', 'D6'] if warm else ['D6', 'Eb6', 'A5', 'G#5'])[rng.integers(4)]), BEAT * 3, 3.0), t0 + rng.integers(0, 4) * BEAT, .05, rng.uniform(-.7, .7))
        for q in (0, 2): b.add(heart(.8), t0 + q * BEAT, .7, 0)
        if c2: b.add(render('contrabass', midi(v[0]) - 12 if midi(v[0]) >= midi('C3') else midi(v[0]), BAR * 2, 1.2), t0, .25, 0)
        if bi % 8 == 0: b.add(bell(55.0, 8), t0, .17, .25)
        # lament
        if c2:
            l.add(render('piano', midi(v[0]) + (12 if midi(v[0]) < midi('C3') else 0), BAR * 2, 1.5), t0, .2, -.1)
            for n in v[1:]: l.add(render('cello', midi(n), BAR * 2, 1.4), t0, .05, -.3)
        else: nx = V[PROG[(bi + 1) % NB]]; rp = render('piano', midi(nx[2]), BAR, 1.5)[::-1]; l.add(rp, t0 + BAR - len(rp) / SR, .09, -.3)
        # dread
        for q in (1, 3): d.add(heart(.9), t0 + q * BEAT, .7, 0)
        if c2:
            for n in v: d.add(render('organ', midi(n), BAR * 2, 1.6), t0, .04, (midi(n) % 5 - 2) * .12)
            d.add(tom(70), t0, .4, .1); d.add(swell(PW[ch], BAR * 2, rise=.8), t0, .06, -.45); d.add(swell(PW[ch], BAR * 2, 9.0, rise=.8), t0 + .02, .06, .45)
        else: [d.add(tom(f), t0 + q * BEAT, .3, .1 + .1 * j) for j, (q, f) in enumerate([(2, 90), (2.5, 80), (3, 70), (3.5, 62)])]
        # storm
        for q in (0, 2.5): s.add(kick(), t0 + q * BEAT, .55, 0)
        s.add(snare(bi), t0 + 2 * BEAT, .38, .05)
        for k in range(4): s.add(hp(rng.normal(0, 1, int(.08 * SR)), 7000) * np.exp(-np.arange(int(.08 * SR)) / (.02 * SR)), t0 + k * BEAT, .07, .3)
        if bi % 8 == 0: s.add(crash(bi), t0, .3, -.2)
        if c2: s.add(swell(PW[ch], BAR * 2, rise=.2), t0, .1, -.45); s.add(swell(PW[ch], BAR * 2, 9.0, rise=.2), t0 + .02, .1, .45)
        for k in range(16): s.add(render('violin', midi(v[2]) + 12 * (k % 2), BEAT / 4 * .9, .06), t0 + k * BEAT / 4 + rng.normal(0, .004), .03, .4 - .8 * (k % 2))
    for h, mel in ((0, MEL), (16, MEL2)):
        line(l, 'cello', o + h * BAR, .24, -.15, 0, h + p, mel); line(d, 'organ', o + h * BAR, .04, .1, 1, h + p + 7, mel); line(s, 'violin', o + h * BAR, .2, .15, 1, h + p + 13, mel)
n = len(S['base'].L); w = wind(int(LEN * SR), .025, lo=80, hi=480); w = np.tile(w, n // len(w) + 1)[:n]; S['base'].L[:, 0] += w; S['base'].L[:, 1] += np.roll(w, 1300)
outs = {k: loop_cut(reverb(m.L, secs=3.2, decay=.9, lp=4200, wetg=.5, dry=.8), LEN, LEN) for k, m in S.items()}
pk = max(np.abs(sum(outs.values())).max(), 1e-9); acc = 0
for k, y in outs.items(): acc = acc + y; print('stage rms', k, round(float(np.sqrt((acc ** 2).mean()) / pk), 4))
here = os.path.dirname(os.path.abspath(__file__)); js = ['// The plague town theme, four stems that loop together (music/plague_stems.py).']
for k, y in outs.items():
    y = y / pk * .95; wav = os.path.join(here, f'_st_{k}.wav'); import wave
    with wave.open(wav, 'wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
    mp3 = os.path.join(here, '..', 'listen', f'town2_stem_{k}.mp3'); subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, '-b:a', '96k', mp3], check=True)
    ogg = os.path.join(here, '..', 'listen', f'town2_stem_{k}.ogg'); subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, '-c:a', 'libvorbis', '-q:a', '1', ogg], check=True)
    import base64; js.append(f"const TOWN_{k.upper()}_OGG = '{base64.b64encode(open(ogg, 'rb').read()).decode()}';"); js.append(f"const TOWN_{k.upper()}_MP3 = '{base64.b64encode(open(mp3, 'rb').read()).decode()}';"); os.remove(wav)
for nm, ks in (('day2', ('base', 'lament')),):
    m2 = sum(outs[k] for k in ks) / pk * .95 * 1.4; w2 = os.path.join(here, '_st_d2.wav')
    with wave.open(w2, 'wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(m2, -1, 1) * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', w2, '-b:a', '160k', os.path.join(here, '..', 'listen', f'town2_{nm}.mp3')], check=True); os.remove(w2)
# the turn alone (bars 25-32, and half a second over), per stem, for the game to swap in every other time round
tj = ['// The plague town theme: the melancholy turn (bars 25-32) per stem, swapped in every other loop (music/plague_stems2.py).']
for k, y in outs.items():
    a0 = int(24 * BAR * SR); seg = y[a0:a0 + int((8 * BAR + .5) * SR)] / pk * .95; w3 = os.path.join(here, f'_tn_{k}.wav')
    with wave.open(w3, 'wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(seg, -1, 1) * 32767).astype('<i2').tobytes())
    for ext, args in (('ogg', ['-c:a', 'libvorbis', '-q:a', '1']), ('mp3', ['-b:a', '96k'])):
        out = os.path.join(here, '..', 'listen', f'turn_{k}.{ext}'); subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', w3, *args, out], check=True)
        tj.append(f"const TURN_{k.upper()}_{ext.upper()} = '{base64.b64encode(open(out, 'rb').read()).decode()}';")
    os.remove(w3)
open(os.path.join(here, '..', 'game2', 'townturn.js'), 'w').write('\n'.join(tj) + '\n')
mixall = sum(outs.values()) / pk * .95; wav = os.path.join(here, '_st_all.wav')
with wave.open(wav, 'wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(mixall, -1, 1) * 32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, '-b:a', '160k', os.path.join(here, '..', 'listen', 'town2_stems_all.mp3')], check=True); os.remove(wav)
open(os.path.join(here, '..', 'listen', 'townstems_melancholy.js'), 'w').write('\n'.join(js) + '\n'); print('loop', round(LEN, 1), 's', 'peak', round(float(pk), 3))
