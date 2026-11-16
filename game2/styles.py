fonts = open('../drafts/fonts.css').read() + open('../fontfix/fix25.css').read()
R = [('Refectory',0,0,2,2),('Chapel',2,0,2,2),('Bell Tower',4,0,1,2),('Larder',0,2,1,2),('Cloister',1,2,3,2),('Scriptorium',4,2,1,2),('Infirmary',1,4,2,1),('Gatehouse',3,4,2,1)]
WHO = {'Cloister':['#2fa59a','#e08a32'],'Larder':['#9b5fd0'],'Chapel':['#4f8fd9'],'Gatehouse':['#e3c04a']}
K=118
def monk(x,y,c,st):
    if st=='wood': return f'<g transform="translate({x},{y})"><path d="M0 34 L4 12 Q11 -2 18 12 L22 34 Z" fill="{c}" stroke="#2a1a0c" stroke-width="2.2"/><circle cx="11" cy="6" r="6.5" fill="#f0dfc0" stroke="#2a1a0c" stroke-width="2.2"/><path d="M5 20 L17 26 M5 26 L17 32" stroke="#2a1a0c" stroke-width="1"/></g>'
    if st=='glass': return f'<g transform="translate({x},{y})"><path d="M0 36 L5 12 L11 2 L17 12 L22 36 Z" fill="{c}" stroke="#0b0b10" stroke-width="3"/><circle cx="11" cy="6" r="6" fill="#ffe9b8" stroke="#0b0b10" stroke-width="3"/></g>'
    return f'<g transform="translate({x},{y})" shape-rendering="crispEdges"><rect x="4" y="0" width="12" height="10" fill="#e8c9a0"/><rect x="2" y="0" width="16" height="4" fill="{c}"/><rect x="0" y="10" width="20" height="18" fill="{c}"/><rect x="0" y="24" width="20" height="4" fill="rgba(0,0,0,.3)"/><rect x="6" y="4" width="2" height="2" fill="#222"/><rect x="12" y="4" width="2" height="2" fill="#222"/></g>'
def woodcut():
    s='<rect width="640" height="640" fill="#e9d9b4"/><filter id="p"><feTurbulence baseFrequency=".8" numOctaves="2"/><feColorMatrix values="0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .1 0 0 0 .12 0"/></filter><rect width="640" height="640" filter="url(#p)"/><defs><pattern id="h" width="6" height="6" patternTransform="rotate(40)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="#2a1a0c" stroke-width="1"/></pattern></defs>'
    for n,x,y,w,h in R:
        X,Y,W,H=25+x*K,25+y*K,w*K-8,h*K-8
        s+=f'<rect x="{X+5}" y="{Y+5}" width="{W}" height="{H}" fill="url(#h)" opacity=".55"/><rect x="{X}" y="{Y}" width="{W}" height="{H}" fill="{"#f4e8c8" if n!="Cloister" else "#dfe6c2"}" stroke="#2a1a0c" stroke-width="3.5"/><rect x="{X+5}" y="{Y+5}" width="{W-10}" height="{H-10}" fill="none" stroke="#2a1a0c" stroke-width="1"/>'
        s+=f'<text x="{X+12}" y="{Y+30}" font-family="Georgia,serif" font-size="17" fill="#2a1a0c"><tspan fill="#a3271a" font-size="26" font-weight="700">{n[0]}</tspan>{n[1:]}</text>'
        if n=='Chapel': s+=f'<path d="M{X+W/2} {Y+H-70} v50 M{X+W/2-16} {Y+H-52} h32" stroke="#a3271a" stroke-width="5"/>'
        if n=='Bell Tower': s+=f'<path d="M{X+W/2-18} {Y+H-30} q18 -70 36 0 z" fill="#d8b24a" stroke="#2a1a0c" stroke-width="3"/><circle cx="{X+W/2}" cy="{Y+H-24}" r="5" fill="#2a1a0c"/>'
        if n=='Cloister': s+=f'<circle cx="{X+W/2}" cy="{Y+H/2+20}" r="34" fill="#f4e8c8" stroke="#2a1a0c" stroke-width="3"/><circle cx="{X+W/2}" cy="{Y+H/2+20}" r="12" fill="#7fa7c8" stroke="#2a1a0c" stroke-width="2"/>'
        for i,c in enumerate(WHO.get(n,[])): s+=monk(X+14+i*30,Y+44,c,'wood')
    return s
def glass():
    s='<rect width="640" height="640" fill="#0b0b10"/><defs><radialGradient id="gl" cx=".5" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
    col={'Refectory':'#b5532c','Chapel':'#2f5fb8','Bell Tower':'#c9a227','Larder':'#3d8a4a','Cloister':'#6fb7c9','Scriptorium':'#7a3fa0','Infirmary':'#b83a4b','Gatehouse':'#56606e'}
    for n,x,y,w,h in R:
        X,Y,W,H=25+x*K,25+y*K,w*K-8,h*K-8
        s+=f'<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{W/2 if n=="Bell Tower" else 6}" ry="{40 if n=="Bell Tower" else 6}" fill="{col[n]}" stroke="#0b0b10" stroke-width="7"/><rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="6" fill="url(#gl)"/>'
        s+=f'<path d="M{X} {Y+H*.55} L{X+W} {Y+H*.4} M{X+W*.45} {Y} L{X+W*.6} {Y+H}" stroke="#0b0b10" stroke-width="3" opacity=".8"/>'
        s+=f'<text x="{X+W/2}" y="{Y+H-12}" text-anchor="middle" font-family="Pixelify Sans" font-weight="600" font-size="14" fill="#fff8e0" stroke="#0b0b10" stroke-width="3" paint-order="stroke">{n}</text>'
        for i,c in enumerate(WHO.get(n,[])): s+=monk(X+16+i*32,Y+18,c,'glass')
    return s
def cutaway():
    s='<rect width="640" height="640" fill="#141b2b"/>'
    import random; random.seed(3)
    for i in range(90): s+=f'<rect x="{random.randint(0,640)}" y="{random.randint(0,640)}" width="3" height="3" fill="#fff" opacity="{random.random()*.7+.2:.2f}"/>'
    F=[('Bell Tower',430,40,120,130,'#3b3340'),('Scriptorium',70,170,170,120,'#4a3b2c'),('Chapel',240,170,190,120,'#3b3340'),('Refectory',430,170,140,120,'#4a3b2c'),('Larder',70,290,110,120,'#33302a'),('Cloister',180,290,250,120,'#2c3a34'),('Infirmary',430,290,140,120,'#40322f'),('Gatehouse',240,410,190,110,'#2b2b33')]
    s+='<path d="M50 170 L320 60 L430 110 L430 40 L490 0 L550 40 L550 150 L590 170 Z" fill="#8a2f2a" stroke="#0c0f18" stroke-width="5" shape-rendering="crispEdges"/><path d="M50 170 L320 60 L590 170" fill="none" stroke="#f1f5fa" stroke-width="9"/>'
    for n,X,Y,W,H,c in F:
        s+=f'<g shape-rendering="crispEdges"><rect x="{X}" y="{Y}" width="{W}" height="{H}" fill="{c}" stroke="#0c0f18" stroke-width="5"/><rect x="{X+3}" y="{Y+H-14}" width="{W-6}" height="11" fill="#6b5236"/><rect x="{X+W-34}" y="{Y+18}" width="18" height="26" fill="#ffd77a"/><rect x="{X+W-26}" y="{Y+18}" width="2" height="26" fill="#0c0f18"/><rect x="{X+W-50}" y="{Y+10}" width="50" height="60" fill="#ffd77a" opacity=".08"/></g>'
        s+=f'<text x="{X+9}" y="{Y+20}" font-family="Pixelify Sans" font-weight="600" font-size="13" fill="#f2e6c8">{n}</text>'
        if n=='Bell Tower': s+=f'<path d="M{X+45} {Y+92} q15 -50 30 0 z" fill="#d8b24a" stroke="#0c0f18" stroke-width="3"/>'
        if n=='Cloister': s+=f'<g shape-rendering="crispEdges"><rect x="{X+110}" y="{Y+84}" width="30" height="22" fill="#55606e"/><rect x="{X+116}" y="{Y+70}" width="6" height="14" fill="#ff9a3c"/><rect x="{X+122}" y="{Y+62}" width="8" height="22" fill="#ffd24a"/></g>'
        for i,cc in enumerate(WHO.get(n,[])): s+=monk(X+16+i*30,Y+H-42,cc,'px')
    s+='<rect x="0" y="520" width="640" height="120" fill="#e6edf4"/><rect x="0" y="520" width="640" height="8" fill="#fff"/>'
    return s
for nm,f in [('woodcut',woodcut),('glass',glass),('cutaway',cutaway)]:
    open(f'art_{nm}.html','w').write(f'<!doctype html><meta charset=utf-8><style>{fonts}body{{margin:0;background:#111}}</style><svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">{f()}</svg>')
