import re, base64
src=open('../game7/crown7.html').read()
FONTS=''.join(re.findall(r"@font-face\{[^}]*\}", src))
F='../fonts/node_modules/@fontsource/'
def ff(name, path): return "@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2')}"%(name, base64.b64encode(open(F+path,'rb').read()).decode())
FONTS+=ff('Jacquard 24','jacquard-24/files/jacquard-24-latin-400-normal.woff2')+ff('Pirata','pirata-one/files/pirata-one-latin-400-normal.woff2')+ff('FellSC','im-fell-english-sc/files/im-fell-english-sc-latin-400-normal.woff2')+ff('Fell','im-fell-english/files/im-fell-english-latin-400-normal.woff2')+ff('Uncial','uncial-antiqua/files/uncial-antiqua-latin-400-normal.woff2')
BG=base64.b64encode(open('isle_bg.png','rb').read()).decode()

JS=r'''
const IC={
timber:["...lll...","..lLLLl..",".lLtTtLl.",".lLTtTLl.",".lLtTtLl.","..lLLLl..","...lll...","........."],
clay:[".........","rrrrRrrrr","rRRRrRRRr","rrrrrrrrr","rRrRRRrRR","rrrrrrrrr","RRRrRRRRr","rrrrrrrrr"],
wool:["..www.ww.",".wWWWwWWw","wWWWWWWWw","wWWWWWWWw","wWWWWWWWw",".wWWWWWw.","..k...k..","..k...k.."],
grain:[".g.y.y.g.","..yYyYy..","...yYy...","....y....","...ggg...","..g.g.g..",".g..g..g.","........."],
ore:["...ss....","..sSSs...",".sSSoSs..",".sSSSSSs.","sSoSSSoSs","sSSSSSSSs",".sssssss.","........."],
road:[".........","ss.......","sSss.....",".sSSss...","...sSSss.",".....sSSs",".......ss","........."],
village:["....r....","...rRr...","..rRRRr..",".rRRRRRr.","..wwkww..","..wwkww..","..wwkww..","........."],
town:[".s.......","sSs..r...","sSs.rRr..","sSsrRRRr.","sSs.wkw..","sSs.wkw..","sSs.wkw..","........."],
wall:["s.s.s.s.s","SSSSSSSSS","sSsSsSsSs","SSSSSSSSS","sSsSsSsSs","SSSSSSSSS","sSsSsSsSs","........."],
sword:[".......S.","......SS.",".....SS..","....SS...",".y.SS....","..yS.....",".kyy.....","k..y....."],
spear:["....S....","...SSS...","....S....","....l....","....l....","....l....","....l....","....l...."],
bow:["..ll.....","...l.....","....l..S.","....l.S..","....lS...","...Sl....","..S.l....","..ll....."],
cat:[".........","l......S.",".l....S..","..l..S...","...lS....",".llllll..",".l.ll.l..","..k..k..."],
card:[".pppppp..",".pPPPPp..",".pPrrPp..",".pPrrPp..",".pPPPPp..",".pPPPPp..",".pppppp..","........."],
crown:[".........",".y..y..y.",".yy.y.yy.",".yYyYyYy.",".yYYYYYy.",".yyyyyyy.",".........","........."],
anchor:["...yyy...","...y.y...","....y....","..yyyyy..","....y....","y...y...y",".y..y..y.","..yyyyy.."],
};
const PAL={l:[90,56,30],L:[150,100,56],t:[196,150,96],T:[226,186,124],r:[130,56,40],R:[180,88,60],w:[200,196,186],W:[240,238,232],k:[40,34,30],g:[140,130,56],y:[214,176,70],Y:[244,214,120],s:[70,74,84],S:[140,146,160],o:[210,220,240],p:[120,90,60],P:[220,200,160]};
function ic(cv){const m=IC[cv.dataset.i];if(!m)return;const s=+cv.dataset.s||3;cv.width=9*s;cv.height=8*s;const g=cv.getContext('2d');m.forEach((row,y)=>[...row].forEach((ch,x)=>{const c=PAL[ch];if(!c)return;g.fillStyle=`rgb(${c})`;g.fillRect(x*s,y*s,s,s)}))}
document.querySelectorAll('canvas.ic').forEach(ic);
// compass rose for the chart skin, drawn in pixels
document.querySelectorAll('canvas.rose').forEach(cv=>{const s=2,N=33;cv.width=N*s;cv.height=N*s;const g=cv.getContext('2d'),c=16;const P=(x,y,col)=>{g.fillStyle=col;g.fillRect(x*s,y*s,s,s)};
 for(let a=0;a<360;a+=1){const r=15,x=Math.round(c+Math.cos(a*Math.PI/180)*r),y=Math.round(c+Math.sin(a*Math.PI/180)*r);P(x,y,'#6a4a2a')}
 for(let a=0;a<360;a+=1){const r=12,x=Math.round(c+Math.cos(a*Math.PI/180)*r),y=Math.round(c+Math.sin(a*Math.PI/180)*r);if(a%3==0)P(x,y,'#8a6a40')}
 const star=(ang,len,w,c1,c2)=>{for(let t=0;t<len;t++){const ww=w*(1-t/len);for(let k=-ww;k<=ww;k+=.5){const x=Math.round(c+Math.cos(ang)*t-Math.sin(ang)*k),y=Math.round(c+Math.sin(ang)*t+Math.cos(ang)*k);P(x,y,k<0?c1:c2)}}};
 for(let i=0;i<8;i++)star(i*Math.PI/4+Math.PI/8,9,1.6,'#a88a5a','#d8c08a');for(let i=0;i<4;i++)star(i*Math.PI/2-Math.PI/2,15,2.6,i==0?'#8a1c18':'#4a3420',i==0?'#c4423a':'#8a6a40');P(c,c,'#f4e4c0')});
'''
BASE='''
*{box-sizing:border-box;margin:0} body{background:#000;overflow:hidden;font-family:'Pixelify Sans',monospace}
.stage{position:relative;width:1680px;height:945px;background:url(data:image/png;base64,%s) 0 0/1680px 945px no-repeat;image-rendering:pixelated}
canvas.ic{image-rendering:pixelated;vertical-align:middle}
.p{position:absolute}
.hd{font-family:var(--hf);color:var(--hc);font-size:var(--hs);line-height:1;margin-bottom:8px}
.sub{font-size:13px;color:var(--dim)}
.top{left:50%%;top:12px;transform:translateX(-50%%);display:flex;align-items:center;gap:18px;padding:8px 18px}
.top .title{font-family:var(--hf);font-size:30px;color:var(--hc);white-space:nowrap} .top .rd{font-size:14px;color:var(--dim)}
.ph{display:flex;gap:2px} .ph span{font-size:15px;padding:4px 10px;color:var(--dim)} .ph span.on{color:var(--on-ink);background:var(--on)}
.dice{display:flex;gap:6px;align-items:center} .die{width:34px;height:34px;background:var(--die);box-shadow:inset -3px -3px 0 rgba(0,0,0,.25),0 0 0 2px var(--dieb);display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:4px} .die i{width:6px;height:6px;background:var(--pip);align-self:center;justify-self:center} .sum{font-size:24px;color:var(--ink);margin-left:4px}
.timer{font-size:20px;color:var(--ink)}
.lords{left:14px;top:12px;width:300px;padding:12px}
.ld{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;padding:8px 4px;border-bottom:1px solid var(--rule)} .ld.turn{background:var(--hl)}
.shield{width:28px;height:32px;clip-path:polygon(0 0,100%% 0,100%% 60%%,50%% 100%%,0 60%%);box-shadow:inset 0 0 0 3px rgba(0,0,0,.35);position:relative} .shield:after{content:'';position:absolute;left:6px;top:6px;width:6px;height:10px;background:rgba(255,255,255,.35)}
.ld b{font-weight:500;font-size:16px;color:var(--ink)} .ld small{display:block;font-size:12px;color:var(--dim);font-weight:400}
.pts{text-align:right;font-size:20px;color:var(--hc)} .pts small{font-size:11px;color:var(--dim)}
.bar{grid-column:1/-1;height:6px;background:var(--track);position:relative} .bar i{position:absolute;left:0;top:0;bottom:0}
.stats{grid-column:2/-1;display:flex;gap:10px;font-size:12px;color:var(--dim)} .stats span{display:flex;align-items:center;gap:3px}
.badge{font-size:11px;padding:1px 6px;border:1px solid var(--hc);color:var(--hc)}
.right{right:14px;top:12px;width:330px;display:flex;flex-direction:column;gap:12px} .right>.v{position:relative!important}
.charter{padding:12px} .charter .k{font-size:12px;letter-spacing:2px;color:var(--dim)} .charter .t{font-family:var(--hf);font-size:30px;color:var(--hc)} .charter p{font-size:14px;line-height:1.4;color:var(--ink);margin-top:4px} .charter b{color:var(--hc);font-weight:500}
.chron{padding:12px} .ev{display:grid;grid-template-columns:24px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid var(--rule);font-size:14px;line-height:1.35;color:var(--ink)} .ev .r{font-size:11px;color:var(--dim)}
.chat{padding:10px 12px} .chat p{font-size:14px;line-height:1.4;color:var(--ink);margin-bottom:3px} .chat .w{color:var(--whis)} .tabs{display:flex;gap:4px;margin-bottom:6px} .tabs span{font-size:12px;padding:2px 8px;color:var(--dim);border:1px solid var(--rule)} .tabs span.on{color:var(--ink);border-color:var(--hc)}
.dock{left:50%%;bottom:12px;transform:translateX(-50%%);display:flex;gap:14px;align-items:stretch;padding:10px 14px}
.goods{display:flex;gap:6px} .gd{display:flex;flex-direction:column;align-items:center;justify-content:center;width:52px;padding:4px 0;background:var(--slot);box-shadow:inset 0 0 0 1px var(--rule)} .gd b{font-size:18px;color:var(--ink);font-weight:500} .gd.zero b{color:var(--dim)} .gd small{font-size:10px;color:var(--dim)}
.sep{width:1px;background:var(--rule)}
.builds{display:flex;gap:6px} .bt{display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 8px;border:var(--bb);background:var(--bbg);min-width:66px} .bt span{font-size:13px;color:var(--ink)} .bt .cost{display:flex;gap:1px} .bt.off{opacity:.4} .bt.go{border-color:var(--hc)} .bt.go span{color:var(--hc)}
.hand{display:flex;gap:4px} .ord{width:40px;height:56px;background:var(--card);box-shadow:0 0 0 1px var(--cardb),inset 0 0 0 3px rgba(0,0,0,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:20px;color:var(--cardink)} .ord small{font-size:9px}
.end{display:flex;align-items:center;padding:0 18px;font-size:18px;color:var(--hc);border:var(--bb);border-color:var(--hc);background:var(--bbg)}
.tag{position:absolute;transform:translate(-50%%,-50%%);font-size:14px;padding:3px 9px;white-space:nowrap;color:var(--ink);background:var(--tagbg);border-bottom:2px solid var(--hc)}
'''%BG

SKINS={
# ---------------------------------------------------------------------------- 1. the sea chart
'chart':('Sea Chart','''
:root{--hf:'FellSC';--hc:#5a2a14;--hs:30px;--ink:#2e2014;--dim:#7a6044;--rule:rgba(110,80,40,.3);--hl:rgba(180,60,40,.12);--on:#8a2a1c;--on-ink:#f4e6c4;--track:rgba(90,60,30,.2);--die:#efe2c0;--dieb:#5a3a20;--pip:#3a2414;--slot:rgba(255,248,226,.35);--bb:1px solid #7a5a34;--bbg:linear-gradient(#f2e4c0,#dcc89a);--card:#efe0b8;--cardb:#6a4a2a;--cardink:#5a2a14;--whis:#6a3a7a;--tagbg:rgba(242,228,192,.92)}
.v{position:absolute;background:repeating-conic-gradient(from 0deg at 85% 15%,rgba(90,60,30,.07) 0 .4deg,transparent .4deg 22.5deg),radial-gradient(ellipse at 25% 20%,rgba(255,250,230,.6),transparent 55%),radial-gradient(ellipse at 80% 90%,rgba(140,100,50,.28),transparent 60%),#e4d3a8;box-shadow:inset 0 0 22px 4px rgba(110,70,30,.45),0 0 0 1px #6a4a2a,0 0 0 4px #e4d3a8,0 0 0 5px #6a4a2a,0 12px 26px rgba(0,0,0,.55)}
.v .seal{position:absolute;right:-10px;bottom:-10px;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#d04a3a,#8a1a14 60%,#5a0c0a);box-shadow:0 2px 0 #3a0806}
.rose{position:absolute;right:-16px;top:-22px;opacity:.9;image-rendering:pixelated}
.hd{border-bottom:1px solid rgba(90,42,20,.4);padding-bottom:4px} .top .title{font-family:'FellSC';font-style:normal}
.cartouche{position:absolute;left:50%;transform:translateX(-50%);top:-1px;font-family:'Fell';font-style:italic;font-size:13px;color:#7a5a34}
'''),
# ---------------------------------------------------------------------------- 2. the royal court
'court':('Royal Court','''
:root{--hf:'Jacquard 24';--hc:#e2bf62;--hs:30px;--ink:#efe6d2;--dim:#9aa2c0;--rule:rgba(226,191,98,.18);--hl:rgba(226,191,98,.12);--on:#e2bf62;--on-ink:#141a3a;--track:rgba(255,255,255,.08);--die:#f4ead2;--dieb:#8a6a2a;--pip:#7a1a1a;--slot:rgba(10,14,40,.5);--bb:1px solid #6a5426;--bbg:linear-gradient(#232a5a,#141a3a);--card:#232a5a;--cardb:#e2bf62;--cardink:#e2bf62;--whis:#d8a0e0;--tagbg:rgba(16,20,48,.88)}
.v{position:absolute;background:radial-gradient(ellipse at 50% 0%,rgba(90,110,220,.18),transparent 60%),repeating-linear-gradient(45deg,rgba(255,255,255,.018) 0 2px,transparent 2px 6px),#141a3a;border:2px solid #e2bf62;box-shadow:0 0 0 2px #0a0d20,inset 0 0 0 3px #141a3a,inset 0 0 0 4px rgba(226,191,98,.45),0 12px 30px rgba(0,0,0,.6)}
.v:before,.v:after{content:'';position:absolute;width:12px;height:12px;background:#e2bf62;transform:rotate(45deg);box-shadow:0 0 0 2px #0a0d20,inset -3px -3px #8a6a2a}
.v:before{left:-7px;top:-7px} .v:after{right:-7px;bottom:-7px}
.lords{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;display:flex;gap:10px}
.lords:before,.lords:after{display:none}
.banner{width:66px;padding:10px 6px 30px;clip-path:polygon(0 0,100% 0,100% 100%,50% 88%,0 100%);display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:inset 0 0 0 3px rgba(0,0,0,.25);position:relative}
.banner:before{content:'';position:absolute;left:-6px;right:-6px;top:-6px;height:6px;background:#8a6a2a}
.banner .nm{font-family:'Jacquard 24';font-size:20px;color:#fff;text-shadow:2px 2px 0 rgba(0,0,0,.4);writing-mode:vertical-rl;transform:rotate(180deg)} .banner .pt{font-size:26px;color:#fff;text-shadow:2px 2px 0 rgba(0,0,0,.45)} .banner .of{font-size:11px;color:rgba(255,255,255,.75)}
.banner .ch{font-size:11px;color:rgba(255,255,255,.85);text-align:center;line-height:1.1} .banner.turn{outline:3px solid #e2bf62;outline-offset:3px}
.banner .st{font-size:11px;color:#fff;display:flex;flex-direction:column;gap:2px;align-items:center}
'''),
# ---------------------------------------------------------------------------- 3. ship's timber and brass
'timber':("Ship's Timber",'''
:root{--hf:'Pirata';--hc:#e8c26a;--hs:30px;--ink:#f2e4c8;--dim:#c2a682;--rule:rgba(30,16,6,.45);--hl:rgba(232,194,106,.14);--on:#e8c26a;--on-ink:#2a160a;--track:rgba(0,0,0,.35);--die:#efe2c4;--dieb:#3a2414;--pip:#2a160a;--slot:rgba(0,0,0,.28);--bb:2px solid #2a160a;--bbg:linear-gradient(#7a5434,#5a3a20);--card:#efe2c4;--cardb:#2a160a;--cardink:#5a2a14;--whis:#a8e0d0;--tagbg:rgba(60,36,18,.92)}
.v{position:absolute;background:linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.2)),repeating-linear-gradient(0deg,#6a4628 0 22px,#5a3a20 22px 23px,#71492a 23px 46px,#4e321c 46px 47px);border:4px solid #2a160a;box-shadow:inset 0 0 0 2px #8a6440,inset 0 0 30px rgba(0,0,0,.45),0 0 0 3px #b08a4a,0 0 0 5px #2a160a,0 12px 28px rgba(0,0,0,.6)}
.v:before,.v:after{content:'';position:absolute;top:6px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f4d890,#9a7430);box-shadow:0 0 0 1px #2a160a} .v:before{left:6px} .v:after{right:6px}
.rope{position:absolute;left:-6px;right:-6px;bottom:-8px;height:8px;background:repeating-linear-gradient(60deg,#c8a46a 0 4px,#8a6a3a 4px 8px);box-shadow:0 0 0 1px #2a160a}
.hd{text-shadow:2px 2px 0 #2a160a}
'''),
# ---------------------------------------------------------------------------- 4. standing stones
'stone':('Standing Stones','''
:root{--hf:'Uncial';--hc:#cfe0b0;--hs:28px;--ink:#e8e8e0;--dim:#a2a89a;--rule:rgba(0,0,0,.35);--hl:rgba(160,200,120,.12);--on:#8ab060;--on-ink:#141812;--track:rgba(0,0,0,.4);--die:#d8d8cc;--dieb:#3a3e38;--pip:#2a2e28;--slot:rgba(0,0,0,.28);--bb:1px solid #3a3e38;--bbg:linear-gradient(#5e625a,#44483f);--card:#4e5248;--cardb:#8ab060;--cardink:#cfe0b0;--whis:#e0c890;--tagbg:rgba(40,44,38,.9)}
.v{position:absolute;background:radial-gradient(circle at 12% 88%,rgba(110,150,60,.55) 0 7%,transparent 14%),radial-gradient(circle at 92% 8%,rgba(120,160,70,.45) 0 5%,transparent 11%),radial-gradient(circle at 70% 60%,rgba(255,255,255,.05) 0 2%,transparent 3%),radial-gradient(circle at 30% 30%,rgba(0,0,0,.12) 0 3%,transparent 4%),repeating-radial-gradient(circle at 40% 40%,rgba(255,255,255,.02) 0 3px,rgba(0,0,0,.03) 3px 7px),linear-gradient(160deg,#6a6e66,#4a4e47);box-shadow:inset 3px 3px 0 rgba(255,255,255,.14),inset -4px -4px 0 rgba(0,0,0,.35),0 0 0 2px #1e221c,0 12px 28px rgba(0,0,0,.6);border-radius:3px 6px 4px 8px}
.knot{height:12px;margin:-2px -2px 8px;background:repeating-linear-gradient(45deg,transparent 0 4px,rgba(207,224,176,.55) 4px 6px,transparent 6px 10px),repeating-linear-gradient(-45deg,transparent 0 4px,rgba(207,224,176,.35) 4px 6px,transparent 6px 10px);border-top:2px solid rgba(207,224,176,.5);border-bottom:2px solid rgba(207,224,176,.5)}
.hd{text-shadow:2px 2px 0 rgba(0,0,0,.5)} .torch{position:absolute;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(255,170,70,.25),transparent 70%);pointer-events:none}
'''),
}

LORDS=[('Sir Edric','#c0392b','Merchant',9,'you',5,2,3,'turn'),('Lady Maren','#2e6fc0','Raider',7,'',3,4,2,''),('Lord Corvin','#8e44ad','Geomancer',11,'',6,1,4,''),('Lady Isolde','#d4a017','Banking Guild',8,'',2,3,3,'')]
def ic(k,s=3): return f'<canvas class="ic" data-i="{k}" data-s="{s}"></canvas>'
def die(n):
    pos={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[n]
    return '<div class="die">'+''.join(f'<i style="grid-area:{i//3+1}/{i%3+1}"></i>' for i in pos)+'</div>'
def lords_list(skin):
    if skin=='court':
        h='<div class="v p lords">'
        for n,c,ch,pt,me,cards,host,settl,turn in LORDS:
            h+=f'<div class="banner {turn}" style="background:linear-gradient(rgba(255,255,255,.08),rgba(0,0,0,.18)),{c}"><span class="pt">{pt}</span><span class="of">of 20</span><span class="nm">{n}</span><span class="ch">{ch}</span><span class="st"><span>{ic("card",2)} {cards}</span><span>{ic("sword",2)} {host}</span></span></div>'
        return h+'</div>'
    deco={'chart':'<canvas class="rose"></canvas><span class="seal"></span>','stone':'<div class="knot"></div>','timber':'<div class="rope"></div>'}.get(skin,'')
    h=f'<div class="v p lords">{deco}<div class="hd">The Lords</div>'
    for n,c,ch,pt,me,cards,host,settl,turn in LORDS:
        h+=f'''<div class="ld {turn}"><div class="shield" style="background:{c}"></div><b>{n}{' <span class="badge">you</span>' if me else ''}<small>{ch}</small></b><div class="pts">{pt}<small>/20</small></div>
<div class="stats"><span>{ic("card",2)}{cards}</span><span>{ic("sword",2)}{host}</span><span>{ic("village",2)}{settl}</span>{'<span class="badge">Longest Road</span>' if n=='Lord Corvin' else ''}{'<span class="badge">Largest Host</span>' if n=='Lady Maren' else ''}</div><div class="bar"><i style="width:{pt*5}%;background:{c}"></i></div></div>'''
    return h+'</div>'

def page(skin):
    name,css=SKINS[skin]
    title={'chart':'Lords of the Isle','court':'Lords of the Isle','timber':'Lords of the Isle','stone':'Lords of the Isle'}[skin]
    top=f'''<div class="v p top"><span class="title">{title}</span><span class="rd">Round 14</span><div class="ph"><span>Roll</span><span class="on">Trade &amp; Build</span><span>March</span></div><div class="dice">{die(4)}{die(5)}<span class="sum">9</span></div><span class="timer">1:12</span></div>'''
    deco={'timber':'<div class="rope"></div>','stone':'<div class="knot"></div>'}.get(skin,'')
    right=f'''<div class="p right">
<div class="v charter">{deco}<div class="k">YOUR CHARTER</div><div class="t">The Merchant</div><p>Trade with the bank at <b>2 for 1</b> in any good. You may raise <b>no men-at-arms</b>, and your host holds at most <b>6</b>.</p></div>
<div class="v chron">{deco}<div class="hd">Chronicle</div>
<div class="ev">{ic("grain",2)}<div>Nine is rolled. Your mill at the Long Fields yields <b>2 grain</b>.<div class="r">Round 14</div></div></div>
<div class="ev">{ic("sword",2)}<div>Lady Maren's host breaks the ring at Hollow Ford and plunders 4 goods from Lord Corvin.<div class="r">Round 13</div></div></div>
<div class="ev">{ic("anchor",2)}<div>Lord Corvin takes the harbour at Saltmouth. He trades at 3 for 1.<div class="r">Round 13</div></div></div>
<div class="ev">{ic("town",2)}<div>Lady Isolde raises a town at Greywater.<div class="r">Round 12</div></div></div></div>
<div class="v chat">{deco}<div class="tabs"><span class="on">Council</span><span>Whispers · 1</span></div><p><b style="color:#2e6fc0">Maren:</b> Ore for wool, two for one? Nobody?</p><p class="w">Isolde whispers: Help me break Corvin's ring and the harbour is yours.</p><p><b style="color:#8e44ad">Corvin:</b> Touch my road and I march.</p></div></div>'''
    cost=lambda *k:'<span class="cost">'+''.join(ic(x,2) for x in k)+'</span>'
    goods=[('timber',3),('clay',1),('wool',4),('grain',2),('ore',0)]
    dock=f'''<div class="v p dock">{'<div class="rope"></div>' if skin=='timber' else ''}<div class="goods">{''.join(f'<div class="gd {"zero" if n==0 else ""}">{ic(k)}<b>{n}</b><small>{k}</small></div>' for k,n in goods)}</div><div class="sep"></div>
<div class="builds"><div class="bt go">{ic("road")}<span>Road</span>{cost("timber","clay")}</div><div class="bt go">{ic("village")}<span>Village</span>{cost("timber","clay","wool","grain")}</div><div class="bt off">{ic("town")}<span>Town</span>{cost("grain","grain","ore","ore","ore")}</div><div class="bt off">{ic("wall")}<span>Wall</span>{cost("clay","clay")}</div><div class="bt">{ic("spear")}<span>Spearman</span>{cost("timber","wool")}</div><div class="bt off">{ic("card")}<span>Order</span>{cost("wool","grain","ore")}</div><div class="bt go">{ic("crown")}<span>Trade</span><span class="sub">2 : 1</span></div></div><div class="sep"></div>
<div class="hand"><div class="ord">♞<small>Knight</small></div><div class="ord">⚔<small>Charge</small></div><div class="ord">✿<small>Plenty</small></div></div>
<div class="end">End turn</div></div>'''
    tags=f'''<div class="tag" style="left:640px;top:600px">The Long Fields</div><div class="tag" style="left:1040px;top:250px">Corvin's Quarry</div>'''
    torches=('<div class="torch" style="left:-30px;top:-40px"></div><div class="torch" style="right:-30px;top:-40px"></div>' if skin=='stone' else '')
    return f'<!doctype html><html><head><meta charset="utf-8"><title>Lords of the Isle — {name}</title><style>{FONTS}{BASE}{css}</style></head><body><div class="stage">{tags}{lords_list(skin)}{top}{right}{dock}{torches}</div><script>{JS}</script></body></html>'

for k in SKINS: open(f'lords_{k}.html','w').write(page(k))
