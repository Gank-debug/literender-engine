import re, base64, json
src=open('../game7/crown7.html').read()
FONTS=''.join(re.findall(r"@font-face\{[^}]*\}", src))
F='../fonts/node_modules/@fontsource/'
def ff(name, path): return "@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2')}"%(name, base64.b64encode(open(F+path,'rb').read()).decode())
FONTS+=ff('Jacquard 24','jacquard-24/files/jacquard-24-latin-400-normal.woff2')+ff('Jacquard 12','jacquard-12/files/jacquard-12-latin-400-normal.woff2')+ff('Bastarda','jacquarda-bastarda-9/files/jacquarda-bastarda-9-latin-400-normal.woff2')+ff('Pirata','pirata-one/files/pirata-one-latin-400-normal.woff2')+ff('Fell','im-fell-english/files/im-fell-english-latin-400-normal.woff2')
def iso(x,y,z=0,off=60): return (3*(196+(x-y)*10), 3*(92+(x+y)*5-z)-off)

ICONS = r'''
const IC={
sandal:["........."," ..bb....",".bBBb....",".bBBBb...","..bBBBb..","...bBBBb.","....bBBb.",".....bb..","........."],
boot:["..bbbb...","..bBBb...","..bBBb...","..bBBb...","..bBBbb..","..bBBBBb.","..bBBBBBb","..bbbbbbb","........."],
candle:["....f....","...fFf...","....F....","....w....","...wWw...","...wWw...","...wWw...","..ddddd..","........."],
lantern:["...ddd...","..d...d..","..ddddd..","..dfFfd..","..dFYFd..","..dfFfd..","..ddddd..","...ddd...","........."],
quill:[".......wW","......wW.",".....wW..","....wW...","...wW....","..wW.....",".kk......","kkk......",".k......."],
key:[".........","..yyy....",".y...y...",".y...y...","..yyy....","...y.....","...yy....","...y.....","...yy...."],
print:["....pp...","...pppp..","...pppp..","....pp...",".........","...ppp...","...ppp...","....p....","........."],
blood:["....r....","....r....","...rRr...","..rRRRr..","..rRRRr..","..rRRRr..","...rrr...",".........","........."],
thread:[".........",".c.......","..c......","...c...c.","....c.c..",".....c...","....c.c..","...c...c.","........."],
wax:[".........","..www....",".wWWWw...",".wWWWWw..","..wWWWWw.","...wwWw..",".....w...",".........","........."],
coin:[".........","...yyy...","..yYYYy..",".yYyyYYy.",".yYyYYYy.",".yYyyYYy.","..yYYYy..","...yyy...","........."],
mark:[".........","..r...r..","...r.r...","....r....","...r.r...","..r...r..",".........","..R...R..","...RRR..."],
cap:[".........","...hhh...","..hHHHh..",".hHHHHHh.",".hhhhhhh.",".........",".........",".........","........."],
staff:["....bb...","....bB...","....bB...","....bB...","....bB...","....bB...","....bB...","....bB...","....bB..."],
scale:["....g....","....g....","..ggggg..",".s..g..s.","sss.g.sss",".s..g..s.","....g....","..ggggg..","........."],
eye:[".........",".........","..ttttt..",".tTTkTTt.","tTTkkkTTt",".tTTkTTt.","..ttttt..",".........","........."],
rope:["....b....","...b.....","....b....",".....b...","....b....","...b.....","..bbb....",".b...b...","..bbb...."],
};
const PAL={b:[74,52,34],B:[140,100,60],f:[255,200,100],F:[255,240,190],Y:[255,226,130],w:[200,190,160],W:[240,232,210],d:[60,56,52],k:[30,26,40],y:[190,150,70],p:[170,184,208],r:[110,20,24],R:[170,34,38],c:[150,70,160],h:[40,36,40],H:[90,70,96],g:[120,130,140],s:[160,150,120],t:[60,150,140],T:[110,210,190]};
function ic(cv){const k=cv.dataset.i,m=IC[k];if(!m)return;const s=+cv.dataset.s||2;cv.width=9*s;cv.height=9*s;const g=cv.getContext('2d');m.forEach((row,y)=>[...row].forEach((ch,x)=>{const c=PAL[ch];if(!c)return;g.fillStyle=`rgb(${c})`;g.fillRect(x*s,y*s,s,s)}))}
document.querySelectorAll('canvas.ic').forEach(ic);
// pressure clocks, drawn in pixels
function px(g,x,y,c,s){g.fillStyle=c;g.fillRect(x*s,y*s,s,s)}
function clockCandle(cv,v,max){const s=3,W=60,H=26;cv.width=W*s;cv.height=H*s;const g=cv.getContext('2d');const L=Math.round(52*(1-v/max));
 for(let x=2;x<58;x++)for(let y=8;y<16;y++){const lit=x>=4+L;let c=lit?(y<10?'#efe6cf':y>13?'#9a8a66':'#d8ccaa'):'#2a2420';if(!lit&&y==12)c='#3a3028';px(g,x,y,c,s)}
 for(let k=1;k<max;k++){const x=4+Math.round(52*k/max);for(let y=7;y<17;y++)if(y<8||y>15)px(g,x,y,'#8a6a2a',s)}
 const fx=3+L;[[0,0,'#ff9a3a'],[0,-1,'#ffd27a'],[-1,0,'#ffd27a'],[0,1,'#fff2c0'],[-1,1,'#ffb84a'],[-2,0,'#ff9a3a']].forEach(([dx,dy,c])=>px(g,fx+dx,12+dy,c,s));
 for(let y=10;y<15;y++)px(g,fx+1,y,'#3a2a20',s); for(let x=0;x<60;x++){px(g,x,17,'#5a4630',s);px(g,x,18,'#3a2c20',s)}
 for(let k=0;k<6;k++)px(g,fx+3+k*2,10-k%2,'rgba(200,200,210,.25)',s)}
function clockBell(cv,v,max){const s=3,W=60,H=26;cv.width=W*s;cv.height=H*s;const g=cv.getContext('2d');
 const B=['....kkkk....','...kyyyyk...','..kyYYYyyk..','..kyYyyyyk..','..kyYyyyyk..','.kyYyyyyyyk.','.kyYyyyyyyk.','kyyyyyyyyyyk','kkkkkkkkkkkk','.....kk.....'];
 B.forEach((r,y)=>[...r].forEach((ch,x)=>{const c={k:'#2a2018',y:'#9a7a3a',Y:'#d8b060'}[ch];if(c)px(g,x+1,y+6,c,s)}));
 for(let k=0;k<max;k++){const x=17+k*4.6|0,on=k<v;for(let y=7;y<17;y++)for(let dx=0;dx<3;dx++)px(g,x+dx,y,on?(y<9?'#c43a32':'#9a2a26'):'#3a2e22',s);if(on){px(g,x+1,12,'#e8d8b8',s);px(g,x,12,'#e8d8b8',s);px(g,x+2,12,'#e8d8b8',s);px(g,x+1,11,'#e8d8b8',s);px(g,x+1,13,'#e8d8b8',s)}}}
function clockTide(cv,v,max){const s=3,W=60,H=26;cv.width=W*s;cv.height=H*s;const g=cv.getContext('2d');
 for(let y=0;y<26;y++)for(let x=0;x<60;x++){const lvl=24-Math.round(20*v/max),wave=Math.sin(x*.6)*.8;let c=y>lvl+wave?(y>lvl+3?'#123038':'#1e5a5a'):null;if(y>lvl+wave&&y<=lvl+wave+1)c='#6ac8b4';if(c)px(g,x,y,c,s)}
 for(let y=0;y<26;y++)for(let x=26;x<32;x++){let c=x<28?'#6a5236':'#4a3824';if(y%3==0&&x>27)c='#3a2a1c';const lvl=24-Math.round(20*v/max);if(y>lvl)c=x<28?'#2e4c40':'#22382e';px(g,x,y,c,s)}
 for(let k=1;k<=max;k++){const y=24-Math.round(20*k/max);for(let x=32;x<36;x++)px(g,x,y,k==max?'#c43a32':'#d8b060',s)}}
document.querySelectorAll('canvas.clock').forEach(cv=>({candle:clockCandle,bell:clockBell,tide:clockTide})[cv.dataset.k](cv,+cv.dataset.v,+cv.dataset.m));
'''

BASE_CSS = '''
*{box-sizing:border-box;margin:0} body{background:#060507;overflow:hidden;font-family:'Pixelify Sans',monospace}
.stage{position:relative;width:1680px;height:945px;background:var(--bg) 0 -60px/1680px auto no-repeat;image-rendering:pixelated}
canvas.ic,canvas.clock{image-rendering:pixelated;vertical-align:middle}
.p{position:absolute}
.hd{font-family:var(--hf);color:var(--hc);font-size:var(--hs);line-height:1;margin-bottom:8px;letter-spacing:.5px}
.hd .cap{color:var(--cap);font-size:1.25em}
.sub{font-size:13px;color:var(--dim)}
.top{left:50%;top:12px;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:8px 18px}
.top .day{font-family:var(--hf);font-size:34px;color:var(--hc)}
.ph{display:flex;gap:2px} .ph span{font-size:15px;padding:4px 10px;color:var(--dim)} .ph span.on{color:var(--on-ink);background:var(--on)}
.timer{font-size:24px;color:var(--ink)}
.clockp{left:14px;top:12px;width:290px;padding:10px 12px} .clockp .row{display:flex;gap:10px;align-items:center} .clockp p{font-size:13px;line-height:1.35;color:var(--dim);margin-top:6px}
.sus{left:14px;top:236px;width:290px;padding:12px}
.s{display:grid;grid-template-columns:14px 1fr auto 22px;gap:8px;align-items:center;padding:5px 4px;border-bottom:1px solid var(--rule)}
.s i{width:12px;height:12px;box-shadow:0 0 0 2px var(--sw)} .s b{font-weight:500;font-size:16px;color:var(--ink)} .s small{display:block;font-size:12px;color:var(--dim);font-weight:400}
.s .tr{display:flex;gap:2px} .s .mk{font-size:16px;text-align:center;color:var(--hc)} .s.dead{opacity:.55} .s.dead b{text-decoration:line-through} .s.you{background:var(--hl)}
.right{right:14px;top:12px;width:340px} .right .v{position:relative!important}
.role{padding:12px} .role .t{font-family:var(--hf);font-size:30px;color:var(--hc)} .role .k{font-size:12px;letter-spacing:2px;color:var(--good)} .role p{font-size:14px;line-height:1.4;color:var(--ink);margin-top:4px}
.case{padding:12px;margin-top:12px} .clue{display:grid;grid-template-columns:22px 1fr;gap:8px;padding:7px 2px;border-bottom:1px solid var(--rule)} .clue p{font-size:14px;line-height:1.35;color:var(--ink)} .clue .to{display:flex;gap:3px;margin-top:4px;align-items:center;font-size:12px;color:var(--dim)} .clue .to i{width:10px;height:10px;box-shadow:0 0 0 1px var(--sw)} .clue.said p{font-style:italic;color:var(--dim)} .clue.new{background:var(--hl)}
.chat{padding:10px 12px;margin-top:12px} .chat p{font-size:14px;line-height:1.4;color:var(--ink);margin-bottom:3px} .chat .w{color:var(--whis)}
.acts{left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:8px;padding:10px 12px;align-items:center}
.btn{white-space:nowrap;padding:8px 14px;font-size:16px;color:var(--ink);border:var(--bb);background:var(--bbg)} .btn small{display:block;font-size:12px;color:var(--dim)} .btn.go{color:var(--hc);border-color:var(--hc)} .btn.off{opacity:.4}
.glint{position:absolute;width:21px;height:21px;transform:translate(-50%,-50%)} .glint:before,.glint:after{content:'';position:absolute;left:9px;top:0;width:3px;height:21px;background:var(--glint);box-shadow:0 0 8px var(--glint)} .glint:after{left:0;top:9px;width:21px;height:3px}
.tag{position:absolute;transform:translate(-50%,-50%);font-size:14px;padding:3px 9px;white-space:nowrap;color:var(--ink);background:var(--tagbg);border-bottom:2px solid var(--hc)}
.ring{position:absolute;width:46px;height:20px;border:2px solid var(--hc);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 12px var(--hc)}
.found{padding:14px;width:330px} .found .hd{font-size:26px} .found p{font-size:15px;line-height:1.4;color:var(--ink)} .found .row{display:flex;gap:8px;margin-top:10px}
.dim{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.15),rgba(0,0,0,.6))}
'''

SKINS = {
'monastery': dict(name='The Hollow Brother', css='''
:root{--hf:'Jacquard 24';--hc:#d8b060;--hs:30px;--cap:#c43a32;--ink:#ece2c8;--dim:#9a8f78;--rule:#2e2620;--sw:#0a0809;--hl:rgba(196,58,50,.14);--on:#d8b060;--on-ink:#1a120c;--good:#8cc49a;--whis:#c9a0d8;--bb:1px solid #5a4630;--bbg:linear-gradient(#2a2018,#17110c);--glint:#ffe7a0;--tagbg:rgba(14,10,8,.82)}
.v{background:radial-gradient(ellipse at 30% 0%,rgba(80,60,40,.25),transparent 60%),repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0 1px,transparent 1px 3px),#15100c;border:2px solid #4a3a28;outline:2px solid #0a0706;box-shadow:inset 0 0 0 4px #15100c,inset 0 0 0 5px #6a5236,0 10px 30px rgba(0,0,0,.7);position:absolute}
.v:before,.v:after{content:'';position:absolute;width:14px;height:14px;background:#3c3a3a;box-shadow:inset 2px 2px #6a6866,inset -2px -2px #1a1818,0 0 0 2px #0a0706}
.v:before{left:-8px;top:-8px} .v:after{right:-8px;bottom:-8px}
.drop{float:left;font-family:'Jacquard 24';font-size:46px;line-height:.8;color:#c43a32;background:#1f1612;border:1px solid #6a5236;padding:4px 6px 2px;margin:2px 8px 0 0;text-shadow:2px 2px #6a1a14}
'''),
'town': dict(name='The Carrier', css='''
:root{--hf:'Bastarda';--hc:#2a1a12;--hs:28px;--cap:#9a1c18;--ink:#2a1c12;--dim:#6a5238;--rule:rgba(90,60,30,.35);--sw:#2a1c12;--hl:rgba(154,28,24,.12);--on:#9a1c18;--on-ink:#f2e2c0;--good:#3a6a3a;--whis:#6a3a7a;--bb:2px solid #5a3a20;--bbg:linear-gradient(#d8c49a,#b89c6a);--glint:#fff0b0;--tagbg:rgba(216,196,154,.92)}
.v{position:absolute;background:radial-gradient(ellipse at 70% 20%,rgba(120,80,20,.22),transparent 45%),radial-gradient(ellipse at 20% 90%,rgba(90,50,20,.3),transparent 50%),radial-gradient(circle at 85% 80%,rgba(110,70,30,.18) 0 6%,transparent 7%),#d2bd90;box-shadow:inset 0 0 18px 6px rgba(70,40,10,.55),inset 0 0 2px 2px rgba(40,20,5,.6),0 12px 30px rgba(0,0,0,.75);clip-path:polygon(0 2%,3% 0,40% 1%,62% 0,100% 1%,99% 40%,100% 97%,96% 100%,50% 99%,8% 100%,0 98%,1% 50%)}
.v:after{content:'';position:absolute;right:10px;top:-2px;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#d0443a,#8a1612 60%,#5a0c0a);box-shadow:0 2px 0 #3a0806}
.noseal:after{display:none} .v .nail{position:absolute;left:10px;top:8px;width:6px;height:6px;background:#3a3430;box-shadow:inset 1px 1px #7a7470}
.top .day{color:#f2e2c0;text-shadow:2px 2px #000} .town-top .ph span{color:#c8b48a} .town-top .timer{color:#f2e2c0}
.cross{display:inline-block;width:18px;height:18px;position:relative;vertical-align:middle;margin-right:6px} .cross:before,.cross:after{content:'';position:absolute;background:#9a1c18} .cross:before{left:7px;top:0;width:4px;height:18px} .cross:after{left:0;top:7px;width:18px;height:4px}
.btn{box-shadow:inset 0 -3px rgba(60,30,10,.35)}
'''),
'port': dict(name='The Deep Speaker', css='''
:root{--hf:'Pirata';--hc:#d4b05a;--hs:28px;--cap:#5ad0b8;--ink:#d8e4dc;--dim:#7e9a96;--rule:rgba(90,150,140,.2);--sw:#061012;--hl:rgba(90,208,184,.1);--on:#5ad0b8;--on-ink:#061012;--good:#d4b05a;--whis:#8ad8c8;--bb:1px solid #3a6a64;--bbg:linear-gradient(#123036,#0a1c20);--glint:#8affe6;--tagbg:rgba(6,16,18,.84)}
.v{position:absolute;background:radial-gradient(ellipse at 80% 10%,rgba(90,208,184,.08),transparent 50%),radial-gradient(ellipse at 10% 100%,rgba(140,110,50,.12),transparent 50%),repeating-linear-gradient(0deg,rgba(90,150,140,.07) 0 1px,transparent 1px 22px),#0b1a1d;border:3px solid #6a5a32;box-shadow:inset 0 0 0 2px #2a2414,inset 0 0 0 3px #3e7a6a,0 0 0 2px #050a0b,0 12px 30px rgba(0,0,0,.75)}
.v:before,.v:after{content:'';position:absolute;top:6px;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#e8cc7a,#8a6a2a);box-shadow:0 0 0 1px #2a2010} .v:before{left:6px} .v:after{right:6px}
.ledger{background:repeating-linear-gradient(0deg,transparent 0 23px,rgba(90,208,184,.16) 23px 24px),linear-gradient(90deg,transparent 0 46px,rgba(196,58,50,.35) 46px 47px,transparent 47px),#0b1a1d}
'''),
}

def chip(c): return f'<i style="background:{c}"></i>'
def icon(k,s=2): return f'<canvas class="ic" data-i="{k}" data-s="{s}"></canvas>'

def page(skin, bg, body):
    S=SKINS[skin]
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>{S['name']} — screen draft</title><style>{FONTS}{BASE_CSS}{S['css']}</style></head><body><div class="stage" style="--bg:url(data:image/png;base64,{base64.b64encode(open(bg,'rb').read()).decode()})">{body}</div><script>{ICONS}</script></body></html>'''

def suspects(title, rows):
    h=f'<div class="v p sus"><div class="hd">{title}</div>'
    for n,c,sub,tr,mk,cls in rows:
        h+=f'<div class="s {cls}">{chip(c)}<b>{n}<small>{sub}</small></b><span class="tr">{"".join(icon(t) for t in tr)}</span><span class="mk">{mk}</span></div>'
    return h+'</div>'
def clues(title, items, extra=''):
    h=f'<div class="v case"><div class="hd">{title}</div>'
    for ic_,txt,to,cls in items:
        h+=f'<div class="clue {cls}">{icon(ic_)}<div><p>{txt}</p>'+(f'<div class="to">points to {"".join(chip(c) for c in to)}</div>' if to else '')+'</div></div>'
    return h+extra+'</div>'

# ---------------- monastery: day 3, searching -----------------
R,G,Y,V,B,O,Pk,Tl='#b03430','#3e8c58','#cc9834','#963c96','#3e70b0','#c4642c','#aa5078','#3c9696'
m=''
x,y=iso(4.5,4.5,30); m+=f'<div class="glint" style="left:{x}px;top:{y}px"></div>'
for (a,b_,z) in [(22.6,6.4,6),(20.9,17.9,0),(4.8,13.2,12)]:
    x,y=iso(a,b_,z); m+=f'<div class="glint" style="left:{x}px;top:{y}px;opacity:.7;transform:translate(-50%,-50%) scale(.75)"></div>'
x,y=iso(17.3,5.5); m+=f'<div class="ring" style="left:{x}px;top:{y}px"></div>'
x,y=iso(19.6,17.2); m+=f'<div class="tag" style="left:{x+10}px;top:{y+34}px">Brother Eadric · found at dawn</div>'
m+='''<div class="v p clockp"><div class="hd" style="font-size:24px">The Long Night</div><div class="row"><canvas class="clock" data-k="candle" data-v="5" data-m="8"></canvas></div><p>The candle burns a notch each night, and two if dusk passes without a hanging. At Matins the Hollow Brother's tread leaves no prints. When it gutters, the monastery is his.</p></div>'''
m+=suspects('The Brethren',[('Brother Aldo',R,'you · Chapel',['sandal','candle'],'','you'),('Brother Ivo',G,'Chapel',['sandal','quill'],'✓',''),('Cellarer Bede',Y,'Refectory',['boot','key'],'',''),('Abbot Osric',V,'Chapel',['boot','lantern'],'?',''),('Novice Tam',B,'Bell tower',['sandal','candle'],'',''),('Brother Wulf',O,'Cloister',['boot','candle'],'?',''),('Brother Cuth',Pk,'Cloister',['sandal','lantern'],'?',''),('Brother Eadric',Tl,'found by the well, night 2',['sandal','quill'],'✝','dead')])
m+='''<div class="v p top"><span class="day">Day the Third</span><div class="ph"><span>Dawn</span><span class="on">Searching</span><span>Dusk</span><span>Night</span></div><span class="timer">1:42</span></div>'''
m+='<div class="p right">'
m+='<div class="v role" style="position:relative"><div class="k">FAITHFUL</div><span class="drop">I</span><div class="t">nfirmarer</div><p>Each night, keep watch over a brother; the Hollow Brother cannot take him. You may read the dead: the hour and manner of death.</p></div>'
m+=clues('<span class="cap">C</span>asebook',[
 ('thread','A thread of brown wool caught on the bell rope.',[R,Y,O],'new'),
 ('print','Sandal prints in the snow, from the well to the chapel door.',[R,G,B,Pk],''),
 ('wax','Fresh wax on the tower stair. Someone climbed with a candle after Compline.',[R,B,O],''),
 ('blood','You read Eadric: cold before Lauds. Struck from behind, by someone taller.',[],''),
 ('eye','Ivo says: Cuth walked four rooms last night. (Unproven.)',[Pk],'said')])
m+='<div class="v chat"><div class="hd" style="font-size:22px">The Table <span class="sub">· 3 new · 1 whisper</span></div><p><b style="color:#cc9834">Bede:</b> Who was in the tower after Compline?</p><p class="w">Ivo whispers: I trust you. Look at the rope.</p></div></div>'
x,y=iso(4.5,4.5,30)
m+=f'''<div class="v p found" style="left:{x+30}px;top:{y-150}px"><div class="hd"><span class="cap">F</span>ound</div><p>A thread of <b>brown wool</b>, caught on the bell rope at shoulder height.</p><p class="sub" style="margin-top:6px">Only you know this. Share it, keep it, or lie about it.</p><div class="row"><span class="btn go">Share with the table</span><span class="btn">Keep it</span></div></div>'''
m+='''<div class="v p acts"><span class="btn go">Search here<small>bell tower · 6s</small></span><span class="btn">Examine body<small>Eadric, cloister</small></span><span class="btn">Question<small>ask one brother</small></span><span class="btn off">Keep watch<small>at night</small></span><span class="btn off">Accuse<small>opens at dusk</small></span><span class="btn">Ready<small>4 of 7</small></span></div>'''
open('ui_monastery.html','w').write(page('monastery','fr/monastery_00.png',m))

# ---------------- plague town: dawn, examining the body -----------------
t=''
x,y=iso(17.2,22.6); t+=f'<div class="ring" style="left:{x}px;top:{y}px;width:70px;border-color:#c43a32;box-shadow:0 0 14px #c43a32"></div>'
for (a,b_,z) in [(14.6,16.4,8),(24.4,15,0),(4.6,3,10)]:
    x,y=iso(a,b_,z); t+=f'<div class="glint" style="left:{x}px;top:{y}px;opacity:.75;transform:translate(-50%,-50%) scale(.75)"></div>'
t+='<div class="v p top town-top noseal" style="background:rgba(10,8,6,.0);box-shadow:none;clip-path:none;padding:0"><span class="day" style="font-family:Bastarda;font-size:40px">The Fourth Dawn</span></div>'
t+='''<div class="v p clockp" style="top:12px"><span class="nail"></span><div class="hd" style="padding-left:12px">The Toll</div><canvas class="clock" data-k="bell" data-v="4" data-m="9"></canvas><p>The plague bell tolls once a night, twice if no one hangs. At the sixth toll the sick no longer bleed. At the ninth the town is the Carrier's.</p></div>'''
t+=suspects('<span class="cross"></span>The Townsfolk',[('Doctor Vane','#b03430','you',['staff','boot'],'','you'),('Goody Marl','#3e8c58','The Bell inn',['candle','key'],'?',''),('Alderman Pike','#cc9834','The Bell inn',['coin','cap'],'?',''),('Hob the Digger','#963c96','Graveyard',['boot','rope'],'',''),('Watchman Crane','#3e70b0','Square',['staff','lantern'],'✓',''),('Widow Ash','#c4642c','Sick house',['candle','quill'],'',''),('Mistress Agnes','#aa5078','found in the square',['key','coin'],'✝','dead')])
t+=f'''<div class="v p" style="left:50%;top:96px;transform:translateX(-50%);width:560px;padding:20px 26px 18px"><span class="nail"></span><div class="hd" style="font-size:34px;text-align:center"><span class="cross"></span>Mistress Agnes is dead</div><p class="sub" style="text-align:center;margin-bottom:12px">Found face down in the market mud at first light.</p>
<div class="clue new">{icon('mark')}<div><p><b>Two marks</b> on the neck. The Carrier's sign: she had been marked twice and turned, then killed.</p></div></div>
<div class="clue">{icon('coin')}<div><p>In her fist, a <b>copper token</b> from the Bell inn.</p><div class="to">points to {chip('#3e8c58')}{chip('#cc9834')}<span style="margin-left:6px">drank at the Bell last night</span></div></div></div>
<div class="clue">{icon('print')}<div><p><b>Boot prints</b> leave the body toward the gallows, then vanish into the cobbles.</p><div class="to">points to {chip('#b03430')}{chip('#963c96')}</div></div></div>
<div class="clue said">{icon('eye')}<div><p>Hob says he heard a cart at midnight. (Unproven.)</p></div></div>
<div style="display:flex;gap:8px;margin-top:14px"><span class="btn go">Pin to casebook</span><span class="btn">Share findings</span><span class="btn">Search the square<small>3 spots left</small></span></div></div>'''
t+='<div class="p right" style="top:12px"><div class="v role"><span class="nail"></span><div class="k" style="padding-left:12px">FAITHFUL</div><div class="t">Physician</div><p>You read the dead: hour, marks and manner. Each night, bleed one townsman; you learn whether he carries a mark.</p></div>'
t+=clues('Casebook',[('mark','Crane bled clean last night: no marks.',['#3e70b0'],''),('candle','Wax on the sick-house latch. Someone came in the dark.',['#3e8c58','#c4642c'],''),('quill','Ash keeps a ledger of the dead. Agnes was not in it.',['#c4642c'],'')])+'</div>'
t+='''<div class="v p acts"><span class="btn go">Examine<small>Agnes · 4s</small></span><span class="btn">Search<small>square</small></span><span class="btn">Question<small>ask one</small></span><span class="btn off">Bleed<small>at night</small></span><span class="btn off">Accuse<small>at dusk</small></span><span class="btn">Ready<small>2 of 6</small></span></div>'''
open('ui_town.html','w').write(page('town','fr/town_00.png',t))

# ---------------- port: dusk, the hearing -----------------
p=''
p+='<div class="dim"></div>'
p+='''<div class="v p clockp"><div class="hd">The Tide</div><div class="row"><canvas class="clock" data-k="tide" data-v="5" data-m="8"></canvas></div><p>The water climbs the pier post each night, and twice when no one is hanged. At the sixth mark the Deep Speaker may call a second soul. At the eighth, the town drowns.</p></div>'''
p+=suspects('The Harbour',[('Skipper Hale','#b03430','you',['boot','rope'],'','you'),('Nell Fisher','#3e8c58','Net loft',['knot' if False else 'thread','candle'],'✓',''),('Pell the Deckhand','#cc9834','found in the shrine',['boot','lantern'],'✝','dead'),('Harbourmaster Rook','#963c96','Office',['key','quill'],'?',''),('Old Tobin','#3e70b0','Quay',['boot','lantern'],'?',''),('Sister Maud','#c4642c','Lighthouse',['candle','eye'],'',''),('Ezra Penhallow','#3c9696','Quay',['coin','rope'],'',''),('Wyn Tamsin','#aa5078','Net loft',['thread','key'],'','')])
p+='''<div class="v p top"><span class="day" style="font-size:30px">The Fifth Dusk</span><div class="ph"><span>Dawn</span><span>Searching</span><span class="on">The Hearing</span><span>Night</span></div><span class="timer">0:31</span></div>'''
p+=f'''<div class="v p ledger" style="left:50%;top:50%;transform:translate(-50%,-50%);width:600px;padding:22px 28px 20px 66px">
<div class="hd" style="font-size:34px">Hearing at the Harbour Office</div><p class="sub" style="margin-bottom:12px">Entered in the harbour book, the fifth night of the tide.</p>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px"><span class="sub">Nell Fisher accuses</span>{chip('#963c96')}<span style="font-family:Pirata;font-size:32px;color:var(--ink)">Harbourmaster Rook</span></div>
<p class="sub" style="margin:4px 0 8px">Evidence laid before the town:</p>
<div class="clue">{icon('key')}<div><p>The shrine door was opened with a key. Rook holds the harbour keys.</p><div class="to">points to {chip('#963c96')}{chip('#aa5078')}</div></div></div>
<div class="clue">{icon('quill')}<div><p>The harbour book has a page cut out: the night Pell drowned.</p><div class="to">points to {chip('#963c96')}</div></div></div>
<div class="clue said">{icon('eye')}<div><p>Rook says the key was stolen two nights past, and he told no one. (Unproven.)</p></div></div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 6px;font-size:13px"><span class="btn" style="padding:3px 8px;font-size:13px;color:#d4b05a;border-color:#d4b05a">Nell · aye</span><span class="btn" style="padding:3px 8px;font-size:13px;color:#d4b05a;border-color:#d4b05a">Tobin · aye</span><span class="btn" style="padding:3px 8px;font-size:13px;color:#e08a8a;border-color:#8a3a3a">Rook · nay</span><span class="btn" style="padding:3px 8px;font-size:13px;color:#d4b05a;border-color:#d4b05a">Ezra · aye</span><span class="btn" style="padding:3px 8px;font-size:13px">Maud · …</span><span class="btn" style="padding:3px 8px;font-size:13px">Wyn · …</span><span class="btn" style="padding:3px 8px;font-size:13px">you · …</span><span class="btn" style="padding:3px 8px;font-size:13px;opacity:.6">Pell (drowned) · …</span></div>
<p class="sub">Hanged at 4 ayes. Three so far.</p>
<div style="display:flex;gap:10px;margin-top:12px"><span class="btn go" style="flex:1;text-align:center;font-size:20px">Aye, hang him</span><span class="btn" style="flex:1;text-align:center;font-size:20px">Nay</span></div></div>'''
p+='<div class="p right"><div class="v role"><div class="k">FAITHFUL</div><div class="t">Harbour Pilot</div><p>Each night, follow one soul through the fog. At dawn you learn every door they opened.</p></div>'
p+=clues('Casebook',[('print','Wet boot prints on the shrine floor, salt-white as they dried.',['#b03430','#cc9834','#3e70b0'],''),('lantern','Tobin\'s lantern was dark at the turn of the tide.',['#3e70b0'],''),('rope','You followed Rook: office, then the quay steps. Never the shrine.',['#963c96'],'new')])+'</div>'
p+='''<div class="v p acts"><span class="btn off">Search<small>closed at dusk</small></span><span class="btn">Speak<small>to the hearing</small></span><span class="btn go">Lay evidence<small>from casebook</small></span><span class="btn off">Follow<small>at night</small></span></div>'''
open('ui_port.html','w').write(page('port','fr/port_00.png',p))
