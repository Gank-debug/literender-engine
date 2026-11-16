const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
await p.goto('file://'+__dirname+'/hollow_brother_proto.html?seed=5&scenes=off');await p.waitForFunction(()=>document.getElementById('load').style.display==='none'&&window.HMENU,null,{timeout:90000});
console.log(await p.evaluate(()=>{const s=KIT.person(G.players[0].o,0,'idle',0);return [s.w,s.h,s.ox,s.oy,PROTO.isoP(0,0),PROTO.isoP(1,0),PROTO.isoP(0,1),PROTO.isoP(0,0,10)]}));await b.close()})();
