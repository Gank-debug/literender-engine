import glob, os
from PIL import Image
def gif(frames, out, ms):
    # one shared palette across frames so colours don't shimmer between frames
    W,H=frames[0].size; strip=Image.new('RGB',(W,H*len(frames)))
    for i,f in enumerate(frames): strip.paste(f,(0,i*H))
    pal=strip.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    q=[f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    q[0].save(out, save_all=True, append_images=q[1:], duration=ms, loop=0, optimize=False, disposal=1)
    print(out, os.path.getsize(out)//1024, 'KB')
def load(pat): return [Image.open(p).convert('RGB') for p in sorted(glob.glob(pat))]
# scenes: back to 1x, then 2x, so the pixel grid stays exact
for s in ['monastery','town','port']:
    fr=load(f'fr/{s}_*.png'); one=[f.resize((f.width//3,f.height//3),Image.NEAREST) for f in fr]
    gif([o.resize((o.width*2,o.height*2),Image.NEAREST) for o in one], f'gifs/scene_{s}.gif', 120)
# close-ups at 3x
crops={'closeup_hearth_brazier':('monastery',(0,330,760,830)),'closeup_pyre_gallows':('town',(450,520,1150,1000)),'closeup_shrine':('port',(0,200,700,700)),'closeup_water':('port',(760,640,1460,1092)),'closeup_bell_rope_snow':('monastery',(380,0,1080,500))}
for n,(s,b) in crops.items(): gif([f.crop(b) for f in load(f'fr/{s}_*.png')], f'gifs/{n}.gif', 120)
# character poses
for p,ms in [('idle',220),('walk',150),('work',220),('accuse',220),('pray',260),('die',160)]:
    fr=load(f'fr/{p}_*.png'); gif(fr, f'gifs/pose_{p}.gif', ms)
