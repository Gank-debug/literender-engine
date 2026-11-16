const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/hollow_brother_proto.html?seed=7&scenes=off');await p.waitForFunction(()=>document.getElementById('load').style.display==='none'&&window.HMENU,null,{timeout:90000});
const clk=s=>p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent);if(e)e.click();return !!e},s);
await clk('#modal [data-go="night"]');await clk('[data-protect]');await clk('[data-follow]');await clk('[data-go="sleep"]');await p.waitForTimeout(300);await clk('[data-go="day"]');
await p.evaluate(()=>{PROTO.G.headless=true;for(let k=0;k<700;k++)PROTO.update(.05);PROTO.G.headless=false;G.players[2].mark='✓';G.players[5].mark='?';G.players[8].mark='✗';HGAME.renderAll();});await p.waitForTimeout(800);
await p.screenshot({path:'C_game.png'});
await p.evaluate(()=>{PROTO.G.headless=true;for(let k=0;k<3000&&G.phase==='day';k++)PROTO.update(.05);PROTO.G.headless=false;});await p.waitForTimeout(600);await p.screenshot({path:'C_hear.png'});
console.log(errs);await b.close()})();
