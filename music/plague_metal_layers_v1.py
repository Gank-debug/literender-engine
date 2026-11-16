# The plague town's metal, as layers that loop in step with the town theme's stems (32 bars, 80 BPM, Dm Eb Gm A), so the game
# can lay them over the town's own instruments as the Strigoi gains: 'menace' (the wall at half strength: downstrokes on the
# beat, half-time drums) when the town leans his way, 'metal' (the full victory: the wall, the drums, the figure and then the
# melody on lead guitar) when the town can no longer last; and 'end', the last chord with the bell, struck when the game is over.
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'plague_metal3.py')).read().split('NB = 32; END = 2;')[0])
import base64, subprocess, wave
NB = 32; LEN = NB * BAR
EQ = [(40, 8.1), (50, 7.5), (63, 14.6), (80, 16.6), (101, 7.2), (127, 5.7), (160, 6.7), (202, .6), (254, 1.4), (320, -.9), (403, 1.3), (508, -2.3), (640, -6.7), (806, -4.7), (1016, -1.4), (1280, -1.4), (1613, 2.1), (2032, 6.8), (2560, 7.1), (3225, 7.4), (4064, 6.5), (5120, 3.7), (6451, -.4), (8127, -4.7), (10240, -6.4)]
def master(G, D, O):
    dr = reverb(D.L, secs=1.6, decay=.6, lp=7000, wetg=.45, dry=.9); gr = reverb(G.L, secs=1.2, decay=.4, lp=5000, wetg=.18, dry=1.0); orr = reverb(O.L, secs=2.6, decay=.8, lp=5000, wetg=.4, dry=.85)
    n = min(len(dr), len(gr), len(orr)); mix = dr[:n] + gr[:n] + orr[:n]; ef = np.array([f for f, _ in EQ]) * 2 ** (1 / 6); eg = np.clip(np.array([g for _, g in EQ]), -7, 13)
    for c in range(2):
        X = np.fft.rfft(mix[:, c]); fr = np.fft.rfftfreq(len(mix), 1 / SR); gdb = np.interp(np.log(np.maximum(fr, 20)), np.log(ef), eg); gdb[fr < 30] = -12; mix[:, c] = np.fft.irfft(X * 10 ** (gdb / 20), len(mix))
    return mix
GTR = ((-.9, 0), (-.6, .012), (.9, .007), (.6, .018))
def layer(kind):
    G = Mix(LEN * 3 + 8); D = Mix(LEN * 3 + 8); O = Mix(LEN * 3 + 8); rng = np.random.default_rng(3 if kind == 'metal' else 5)
    for p in range(3):
        o = p * LEN
        for bi in range(NB):
            t0 = o + bi * BAR; ch = PROG[(bi // 2) % 8]; r = ROOT[ch]; first = bi % 2 == 0
            if kind == 'menace':   # tension, not the wall: tight palm-muted eighths, one distorted chord swelling up out of nothing, a low tom pulse
                ph = bi % 8
                for k in range(8):
                    for j, pn in enumerate((-.7, .7)):
                        y = strum(r, BEAT * .2, bi * 100 + k * 2 + j); y = y[:int(BEAT * .5 * SR)] * np.exp(-np.arange(min(len(y), int(BEAT * .5 * SR))) / (.06 * SR))
                        G.add(y, t0 + k * BEAT / 2 + .006 * j + rng.normal(0, .003), .15, pn)
                if first:
                    for j, pn in enumerate((-.4, .4)): y = strum(r, BAR * 2, 500 + bi + j); G.add(y * np.linspace(0, 1, len(y)) ** 2.5, t0 + .01 * j, .22, pn)   # swells up out of nothing over the chord
                for q in (0, 2): D.add(tom(58), t0 + q * BEAT, .47, 0)
            else:                  # the full victory, as the one-shot draft 3 (bars 1-32)
                for k in range(8):
                    for j, (pn, dt) in enumerate(GTR): G.add(strum(r, BEAT * .55, bi * 100 + k * 4 + j, k % 2 == 0), t0 + k * BEAT / 2 + dt + rng.normal(0, .004), (.32 if k % 2 == 0 else .22) * (1.15 if k == 0 else 1), pn)
                for k in range(8): O.add(amp(render('bass-electric', midi(r), BEAT * .5, .15), 4, 0) * .9, t0 + k * BEAT / 2, .45, 0)
                for q in (0, 1.5, 2.5) if bi % 2 else (0, 1.5): D.add(kick(), t0 + q * BEAT, .7, 0)
                D.add(snare(bi), t0 + 2 * BEAT, .65, .05); D.add(crash(bi), t0, .45 if first else .3, -.35 if first else .35)
                for k in range(8): D.add(filt(rng.normal(0, 1, int(.12 * SR)), 6000, 'high') * np.exp(-np.arange(int(.12 * SR)) / (.05 * SR)), t0 + k * BEAT / 2, .1, .25)
                if bi % 4 == 3:
                    for j, (q, f) in enumerate([(3, 120), (3.25, 100), (3.5, 82), (3.75, 68)]): D.add(tom(f), t0 + q * BEAT, .55, .35 - .25 * j)
                for k, n in enumerate(FIG): O.add(lead(n if bi < 16 else n[:-1] + str(int(n[-1]) + 1), BEAT * .5, 4), t0 + k * BEAT / 2, .2 if bi < 8 else .12 if bi < 16 else .1, .15)
        if kind == 'metal':
            t = o + 8 * BAR; acc = 0
            for n, d in MEL:
                if acc >= 32: break
                O.add(lead(n, d * BEAT, 14), t, .3, -.1); O.add(render('violin', midi(n) + 12, d * BEAT * 1.02, .8), t, .12, .3); t += d * BEAT; acc += d
            t = o + 16 * BAR
            for n, d in MEL: O.add(lead(n, d * BEAT, 16), t, .32, -.1); O.add(render('violin', midi(n) + 12, d * BEAT * 1.02, .8), t, .14, .3); O.add(render('cello', midi(n) - 12, d * BEAT * 1.02, .8), t, .12, -.3); t += d * BEAT
    return loop_cut(master(G, D, O), LEN, LEN)
def ending():
    L = 2 * BAR + 6; G = Mix(L + 4); D = Mix(L + 4); O = Mix(L + 4)
    for j, (pn, dt) in enumerate(GTR): G.add(strum('D2', BAR * 2 + 3, 999 + j), dt, .45, pn)
    D.add(kick(), 0, .9, 0); D.add(crash(77, 6), 0, .6, 0); D.add(crash(78, 6), .01, .4, .4); O.add(amp(render('bass-electric', midi('D2'), BAR * 2 + 2, .5), 4, 0), 0, .5, 0)
    O.add(bell(73.42, 9), 0, .5, 0); O.add(bell(55.0, 9), .02, .45, 0)
    for n in ['D3', 'A3', 'D4', 'F4']: O.add(render('organ', midi(n), BAR * 2 + 2, 2.0), 0, .06, 0)
    y = master(G, D, O)[:int(L * SR)]; f = int(3 * SR); y[-f:] *= np.linspace(1, 0, f)[:, None]; return y
outs = {'menace': layer('menace'), 'metal': layer('metal'), 'end': ending()}
pk = max(np.abs(outs['metal']).max(), np.abs(outs['end']).max()); here = os.path.dirname(os.path.abspath(__file__)); js = ['// The plague town metal layers, in step with the stems (music/plague_metal_layers.py).']
for k, y in outs.items():
    y = np.tanh(y / pk * 1.6) / np.tanh(1.6) * .95; wav = os.path.join(here, f'_ml_{k}.wav')
    with wave.open(wav, 'wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
    for ext, args in (('ogg', ['-c:a', 'libvorbis', '-q:a', '2']), ('mp3', ['-b:a', '112k'])):
        out = os.path.join(here, '..', 'listen', f'metal_{k}.{ext}'); subprocess.run(['ffmpeg', '-y', '-v', 'quiet', '-i', wav, *args, out], check=True)
        js.append(f"const METAL_{k.upper()}_{ext.upper()} = '{base64.b64encode(open(out, 'rb').read()).decode()}';")
    os.remove(wav)
open(os.path.join(here, '..', 'game2', 'townmetal.js'), 'w').write('\n'.join(js) + '\n'); print('ok', round(LEN, 1))
