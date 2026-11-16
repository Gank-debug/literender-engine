# A demo of the town's music through a whole game, compressed: the stages, the turn at the end of each block, the menace and chant, the metal, the end.
import subprocess, numpy as np, wave, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'listen'))
SR=44100; BAR=3.0; L=int(96*SR); B=int(BAR*SR)
def dec(f):
    d=subprocess.run(['ffmpeg','-v','quiet','-i',f,'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(d,np.float32).reshape(-1,2)
K=('base','lament','dread','storm')
layers=[dec(f'town_stem_{k}.mp3')[:L] for k in K]+[dec(f'metal_{k}.mp3')[:L] for k in ('menace','metal','chant')]; end=dec('metal_end.mp3')
turn=[dec(f'turn_{k}.mp3') for k in K]+[dec(f'metal_t{k}.mp3') for k in ('menace','metal','chant')]
SEG=[(0,8,0,0),(8,32,1,0),(32,48,2,0),(48,64,3,0),(64,96,3,1),(96,128,3,2)]; TURNS=[24,56,88,120]
def want(i,s,th):   # as music.js
    if th>=2: return [.75,.75,.75,.6,0,1,.9][i]
    if th==1: return [1,1,1,1,.9,0,1][i]
    return 1 if (i<=s and i<4) else 0
def at(bar):
    for a,b,s,th in SEG:
        if a<=bar<b: return s,th
NBAR=128; N=NBAR*B; out=np.zeros((N+len(end),2),np.float32); idx=np.arange(N)%L; envs=[]
for i,lay in enumerate(layers):
    xs=[0]; ys=[want(i,*at(0))]; ramp=(1 if i>=4 else 2)*B
    for a,b,s,th in SEG[1:]:
        w=want(i,s,th)
        if w!=ys[-1]: xs+=[a*B,a*B+ramp]; ys+=[ys[-1],w]
    xs.append(N); ys.append(ys[-1]); env=np.interp(np.arange(N),xs,ys).astype(np.float32); envs.append(env); out[:N]+=lay[idx]*env[:,None]
tail=int(.25*SR)
for tb in TURNS:
    t0=tb*B; t1=t0+8*B
    for i in range(7):
        w=envs[i][t0]
        if not w: continue
        out[t0:t1]-=layers[i][idx[t0:t1]]*w; seg=turn[i][:t1-t0+tail]; fade=np.concatenate([np.ones(t1-t0),np.linspace(1,0,tail)])[:len(seg)]; out[t0:t0+len(seg)]+=seg*w*fade[:,None]
out[N-int(.05*SR):N]*=np.linspace(1,0,int(.05*SR))[:,None]; out[N:N+len(end)]+=end*1.3
pk=np.abs(out).max(); out=np.tanh(out/pk*1.2)/np.tanh(1.2)*.95
with wave.open('_j.wav','wb') as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(out,-1,1)*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-v','quiet','-i','_j.wav','-b:a','192k','town_music_journey.mp3'],check=True); os.remove('_j.wav'); print(round(len(out)/SR,1),'s')
