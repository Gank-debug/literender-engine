import re, base64, json
src=open('../game7/crown7.html').read()
src=src.split('HOLLOW_HTML')[0]
FONTS=''.join(dict.fromkeys(re.findall(r"@font-face\{[^}]*\}", src)))
F='../fonts/node_modules/@fontsource/'
def ff(name, path): return "@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2')}"%(name, base64.b64encode(open(F+path,'rb').read()).decode())
FONTS+=ff('Jacquard 24','jacquard-24/files/jacquard-24-latin-400-normal.woff2')
CSS=open('proto_css.txt').read()+'''
html,body{width:100%;height:100%;color:var(--ink)} #cv{position:fixed;inset:0;display:block;image-rendering:pixelated}
body.demo>.p,body.demo #acts,body.demo #flash,body.demo #modal,body.demo #veil,body.cine .p,body.cine #acts,body.cine #modal,body.cine #pop,body.cine #veil,body.cine #flash{display:none!important}#skip{display:none;position:fixed;right:22px;bottom:18px;z-index:70;opacity:.75}body.cine #skip{display:block}
#vig{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,transparent 45%,rgba(0,0,0,.55) 80%,rgba(0,0,0,.85))}
.p{position:fixed} .left{left:12px;top:12px;width:280px;display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 24px)}
.left .v,.right .v{position:relative!important}
.clockp{position:relative!important;left:auto;top:auto;width:auto}
#bro{padding:10px 12px;overflow:hidden;min-height:0}
#bro .pn{font:12px var(--pix,'Pixelify Sans');color:#c9b98f;opacity:.85;margin-left:4px}
/* the menu */
#hmenu{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;gap:48px;padding:24px;background:radial-gradient(ellipse at 40% 45%,rgba(20,12,10,.55),rgba(4,3,6,.92) 70%)}
#hmenu .mleft{width:min(420px,40vw);display:flex;flex-direction:column;gap:14px}
#hmenu .mtitle{font:72px/0.95 'Jacquard 24';color:#e8d8b0;text-shadow:0 3px 0 #000,0 0 24px rgba(0,0,0,.8)}
#hmenu .mtitle .cap{display:inline-block;background:#7a1f16;color:#f0d68a;border:2px solid #b08a46;padding:0 10px;margin-right:6px;font-size:80px;line-height:1}
#hmenu .mpitch{font:15px/1.5 'Pixelify Sans';color:#d8ccb0;margin:0}
#hmenu .mright{position:relative;inset:auto;width:min(480px,46vw);padding:18px 22px;display:flex;flex-direction:column;gap:10px}
#hmenu .mtabs{display:flex;gap:2px;border-bottom:1px solid #6a5232;margin-bottom:4px}
#hmenu .mtabs span{font:22px 'Jacquard 24';color:#a99472;padding:4px 12px;cursor:pointer;border:1px solid transparent;border-bottom:0}
#hmenu .mtabs span.on{color:#f0d68a;border-color:#6a5232;background:rgba(122,31,22,.25)}
#hmenu .mrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}#hmenu .mrow>span:first-child{min-width:96px;font:15px 'Pixelify Sans';color:#c9b98f}
#hmenu input{background:#120d0b;border:1px solid #6a5232;color:#ece2c8;font:15px 'Pixelify Sans';padding:7px 10px;flex:1;min-width:0}
#hmenu .mname{display:flex;align-items:center;gap:8px;margin-top:6px;padding-top:10px;border-top:1px solid #3a2a1c}#hmenu .mname span{font:14px 'Pixelify Sans';color:#a99472}
#hmenu .mroom{display:flex;align-items:center;gap:10px}#hmenu .mroom b{font:600 28px 'Pixelify Sans';color:#f0d68a;letter-spacing:3px}
#hmenu .hd2{font:24px 'Jacquard 24';color:#e8d8b0}#hmenu .hd2::first-letter{color:#c0392b}
#hmenu .mseats{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px}#hmenu .mseats div{font:14px 'Pixelify Sans';color:#ece2c8;display:flex;gap:6px;align-items:baseline}#hmenu .mseats small{color:#a99472;font-size:12px}#hmenu .mseats .mdim{color:#7c6c50;grid-column:1/-1}
#hmenu .mseats .chip{width:9px;height:9px;background:#b08a46;display:inline-block}
#hmenu .msaves{position:relative;inset:auto;padding:12px 14px}#hmenu .msv{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #3a2a1c}#hmenu .msv div{flex:1;font:14px 'Pixelify Sans';color:#ece2c8;display:flex;flex-direction:column}#hmenu .msv small{color:#a99472}
#chattabs{display:flex;flex-wrap:wrap;gap:3px;margin:-2px 0 6px}#chattabs:empty{display:none}#chattabs .ct{position:relative;font:13px 'Pixelify Sans';color:#a99472;padding:2px 8px;border:1px solid #3a2a1c;cursor:pointer;display:flex;align-items:center;gap:5px}#chattabs .ct.on{color:#f0d68a;border-color:#8b6a34;background:rgba(122,31,22,.3)}#chattabs .chip{width:8px;height:8px;display:inline-block}
#chatlog .wh{color:#e6d6f0}#chatlog .wh b{font-style:normal}
.udot{position:absolute;top:-3px;right:-3px;width:7px;height:7px;background:#e05a4a;border-radius:50%;box-shadow:0 0 0 1px #0a0809}
#bro .wsp{position:relative;display:inline-flex;align-items:center;justify-content:center;width:20px;height:16px;margin-right:3px;border:1px solid #6a5236;background:linear-gradient(#2a2018,#17110c);cursor:pointer;align-self:center}#bro .wsp:hover{filter:brightness(1.4)}
#bro .leg{text-align:right;font:11px 'Pixelify Sans';color:#7c6c50;margin:-6px 2px 2px}#bro .s>b{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#bro .s small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.hear .p.right{z-index:23} 
#tbtools{display:flex;align-items:center;gap:4px}#tbtools .btn.go{background:linear-gradient(#5a1a14,#2e0e0a)}
#timer{display:inline-block;min-width:3.1em;text-align:center;font-variant-numeric:tabular-nums}
body.noui .p.left,body.noui .p.right,body.noui #acts,body.noui #pop{display:none!important}
.left>.v,.right>.v,#acts{transition:background-color .35s,opacity .35s}
.v.glass{background:rgba(18,13,10,.2)!important;backdrop-filter:blur(2px) saturate(.75);-webkit-backdrop-filter:blur(2px) saturate(.75);box-shadow:inset 0 0 0 4px rgba(21,16,12,.4),inset 0 0 0 5px rgba(106,82,54,.6),0 6px 18px rgba(0,0,0,.35)!important}
.v.glass>*{opacity:.5;transition:opacity .35s}.v.glass:hover{background:#15100c!important}.v.glass:hover>*{opacity:1}
#bro .s{grid-template-columns:34px 1fr auto 18px!important;gap:8px;align-items:center;padding:3px 4px!important}
#bro .doll{width:34px;height:36px;position:relative;overflow:hidden;border:1px solid #6a5236;box-shadow:inset 0 0 0 1px #0a0706;background:radial-gradient(ellipse at 50% 30%,rgba(var(--c),.45),rgba(var(--c),.12) 70%),#120d0b}
#bro .doll img{position:absolute;left:50%;top:2px;transform:translateX(-50%);image-rendering:pixelated}
#bro .s.dead .doll img{filter:grayscale(1) brightness(.45)}#bro .s.dead .doll::after{content:'✝';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#c9b98f;font-size:18px;text-shadow:0 1px 0 #000}
#bro .s>b .nm{font:22px/1 'Jacquard 24';letter-spacing:.5px;color:#e8d8b0}#bro .s.dead>b .nm{color:#7c6c50}#bro .s>b small{margin-top:1px}#bro .s.dead b{text-decoration:none}#bro .s.dead .nm{text-decoration:line-through}
#bro .ic16{width:16px;height:16px;image-rendering:pixelated;display:block}#bro .tr{align-items:center}#bro .seal{width:16px;height:16px;image-rendering:pixelated;display:block;margin:auto}
@media (max-height:820px){#bro .doll{width:30px;height:30px}#bro .s{grid-template-columns:30px 1fr auto 18px!important}#bro .s>b .nm{font-size:19px}}
body.hear #modal{left:50%!important;width:min(620px,calc(100vw - 720px))!important;min-width:520px}
#hmenu #hfsm{position:fixed;top:18px;right:18px;z-index:2}
.hfs{height:34px;width:40px;display:flex!important;align-items:center;justify-content:center;padding:0!important;border:1px solid #6a5236;background:linear-gradient(#2a2018,#17110c);cursor:pointer}.hfs:hover{filter:brightness(1.25)}.hfs img{width:16px;height:16px;image-rendering:pixelated}.topbar .hfs{height:30px;width:36px}
#hmenu .btn.big{font-size:22px;padding:8px 18px}
#hmenu .minfo{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:95}#hmenu .minfo .v{position:relative;inset:auto;width:min(640px,92vw);padding:20px 24px;font:14.5px/1.5 'Pixelify Sans';color:#ddd0b4}
@media (max-width:900px){#hmenu{flex-direction:column;gap:16px;overflow:auto}#hmenu .mleft,#hmenu .mright{width:min(520px,94vw)}#hmenu .mtitle{font-size:52px}}
/* scrollbars: none anywhere, except the casebook and the table, which get a slim iron-and-gold one */
html,body{overflow:hidden}*{font-variant-ligatures:none;font-feature-settings:'liga' 0,'clig' 0}*{scrollbar-width:none}*::-webkit-scrollbar{width:0;height:0}
#case .scroll,#chatlog{scrollbar-width:thin;scrollbar-color:#8b6a34 #120d0b}
#case .scroll::-webkit-scrollbar,#chatlog::-webkit-scrollbar{width:9px}
#case .scroll::-webkit-scrollbar-track,#chatlog::-webkit-scrollbar-track{background:#120d0b;border-left:1px solid #3a2a1c}
#case .scroll::-webkit-scrollbar-thumb,#chatlog::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#5a1a14,#7a2a1e);border:1px solid #b08a46;border-radius:0;min-height:28px}
#case .scroll::-webkit-scrollbar-thumb:hover,#chatlog::-webkit-scrollbar-thumb:hover{background:#8e2e20}
@media (max-height:820px){#bro .s{padding-top:1px!important;padding-bottom:1px!important}#clocknote{display:none}.clockp{padding-bottom:6px!important}#bro .s small{font-size:11px;line-height:1.1}} .s{grid-template-columns:14px 1fr auto 18px;cursor:pointer} .s .sw{width:12px;height:12px;box-shadow:0 0 0 2px #0a0809} .s .hab{display:inline-block;width:8px;height:14px;margin-right:3px;box-shadow:0 0 0 1px #0a0809;vertical-align:middle} .s.sel{outline:1px solid #d8b060}
.right{right:12px;top:12px;width:330px;display:flex;flex-direction:column;gap:12px;height:calc(100vh - 24px)}
#rolep{padding:12px} #case{padding:12px;flex:1;min-height:120px;display:flex;flex-direction:column} #case .scroll{overflow:auto;flex:1;padding-right:4px}
#chat{padding:10px 12px;height:30%;display:flex;flex-direction:column} #chatlog{flex:1;overflow:auto;font-size:14px;line-height:1.4;color:var(--ink)} #chatlog p{margin-bottom:4px} #chatlog .sys{color:var(--dim)}
#chat input{margin-top:6px;background:#0f0b08;border:1px solid #4a3a28;color:var(--ink);font:14px 'Pixelify Sans';padding:6px 8px;outline:none}
.mini{display:inline-block;margin-top:4px;font-size:12px;padding:1px 8px;border:1px solid #6a5236;color:var(--hc);cursor:pointer}
.chip{display:inline-block;width:11px;height:11px;box-shadow:0 0 0 1px #0a0809;vertical-align:middle;margin-right:2px}
.topbar{left:50%;top:12px;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:8px 18px}
.topbar .day{font-family:'Jacquard 24';font-size:32px;color:var(--hc)}
#acts{left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:8px;padding:10px 12px}
.btn{cursor:pointer;user-select:none}
#volw{position:relative;z-index:60} #veil{z-index:20} #modal{z-index:25} #pop{z-index:24} .topbar{z-index:22} .topbar .day,.topbar .ph span{white-space:nowrap} @media (max-width:1500px){.topbar{gap:10px;padding:6px 12px}.topbar .day{font-size:24px!important}.topbar .ph span{padding:3px 6px;font-size:13px}.topbar .timer{font-size:20px}} .topbar #volb{height:30px;width:36px}
#volb{height:34px;width:40px;display:flex;align-items:center;justify-content:center;padding:0;color:#d8b060;border:1px solid #6a5236;background:linear-gradient(#2a2018,#17110c)}
#volb:hover{filter:brightness(1.25)}
#volpop{display:none;position:absolute;right:0;top:42px;width:210px;padding:10px 12px;background:#15100c;border:2px solid #4a3a28;outline:2px solid #0a0706;box-shadow:inset 0 0 0 3px #15100c,inset 0 0 0 4px #6a5236,0 10px 30px rgba(0,0,0,.7)}
#volw.open #volpop{display:block}
#volpop .vh{font:400 22px 'Jacquard 24';color:#d8b060;margin-bottom:6px} #volpop .vh::first-letter{color:#c43a32}
#volr{width:100%;accent-color:#c43a32;cursor:pointer}
#volpop .vrow{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:13px;color:#cfc4a8}
#volm{font-size:13px;padding:3px 10px} .btn.small{padding:5px 10px;font-size:14px} .btn .bar{display:block;width:90px;height:5px;background:#2a2018;margin-top:4px} .btn .bar i{display:block;height:100%;background:#d8b060}
.row{display:flex;gap:8px;margin-top:12px} .row.wrap{flex-wrap:wrap}
#veil{position:fixed;inset:0;background:radial-gradient(ellipse,rgba(0,0,0,.35),rgba(0,0,0,.75));display:none}
#modal{left:50%;top:50%;transform:translate(-50%,-50%);width:min(620px,92vw);max-height:86vh;overflow:auto;padding:22px 26px;display:none}
#modal.found{top:auto;bottom:110px;transform:translateX(-50%);width:420px}
#modal .big{font-size:17px;line-height:1.45;color:var(--ink);margin:6px 0} #modal .to{font-size:13px;color:var(--dim);margin:4px 0}
.acc{border:1px solid #3a2e22;padding:10px 12px;margin-top:10px} .acc.cur{border-color:#d8b060} .acc .nm{font-family:'Jacquard 24';font-size:26px;font-weight:400;color:var(--ink)}
.tally{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 4px} .tally span{font-size:13px;padding:2px 7px;border:1px solid #3a2e22} .tally .y{border-color:#7fbf8a;color:#9fe0aa} .tally .n{border-color:#8a3a3a;color:#e08a8a}
.roles .s{cursor:default} .roles .ev{color:#e05a4a} .roles .gd{color:#8cc49a}
#pop{left:50%;top:84px;transform:translateX(-50%);padding:14px 16px;display:none;width:min(560px,90vw)}
#flash{position:fixed;left:50%;top:84px;transform:translateX(-50%);padding:8px 16px;background:rgba(14,10,8,.88);border:1px solid #4a3a28;color:var(--ink);font-size:15px;opacity:0;transition:opacity .4s;pointer-events:none}
#load{position:fixed;inset:0;background:#08060a;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#d8b060;font:40px 'Jacquard 24'} #load .b{width:240px;height:6px;background:#2a2018} #load .b i{display:block;height:100%;width:0;background:#d8b060}
'''
HTML='''<canvas id="cv"></canvas><div id="vig"></div><span class="btn" id="skip" onclick="PROTO.NIGHT.skip()">Skip &#9656;<small>space</small></span>
<div class="p left"><div class="v clockp"><div class="hd" style="font-size:24px">The Long Night</div><canvas class="clock" id="clockv" data-k="candle" data-v="0" data-m="8"></canvas><p id="clocknote"></p></div><div class="v" id="bro"></div></div>
<div class="v p topbar"><span class="day" id="day"></span><div class="ph" id="phases"><span>Dawn</span><span>Searching</span><span>The Hearing</span><span>Night</span></div><span class="timer" id="timer"></span></div>
<div class="p right"><div class="v role" id="rolep"><div id="role"></div></div><div class="v" id="case"></div><div class="v" id="chat"><div class="hd" style="font-size:22px">The Table</div><div id="chattabs"></div><div id="chatlog"></div><input placeholder="Speak to the table, Enter to send"></div></div>
<div class="v p" id="acts"></div><div id="flash"></div><div id="veil"></div><div class="v p" id="modal"></div><div class="v p" id="pop"></div>
<div id="load">The Hollow Brother<div class="b"><i id="loadbar"></i></div></div>'''
trees=open('trees.json').read()
JS="window.TREES_RAW="+trees+";\n"+open('kit3.js').read()+"\n"+open('engine.js').read()+"\n"+open('protoscene.js').read()+"\n"+open('icons.js').read()+'\n'+open('ic16.js').read()+'\n'+"\n"+open('proto.js').read()+'\n'+open('hnet.js').read()+'\n'+open('musicdata.js').read()+'\n'+open('takemusic.js').read()+'\n'+open('music.js').read()+"\nsetTimeout(()=>{const w=document.getElementById('volw'),t=document.querySelector('.topbar');if(window.HFS)HFS.install()},50);\n"+'''
(async()=>{await document.fonts.ready;window.TREES=await Promise.all(TREES_RAW.map(t=>new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=t.w;c.height=t.h;const g=c.getContext('2d');g.drawImage(i,0,0);r({...t,data:g.getImageData(0,0,t.w,t.h).data})};i.src=t.u})));setTimeout(startProto,30)})();'''
TRYST=open('../tryst/trystero.iife.js').read().replace('</script>','<\\/script>')
out=f'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Hollow Brother — prototype</title><style>{FONTS}{CSS}</style></head><body>{HTML}<script>{TRYST}</script><script>{JS}</script></body></html>'
open('hollow_brother_proto.html','w').write(out); print(len(out)//1024,'KB')
