
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
