const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/hollow_brother_proto.html?seed=5&scenes=off');await p.waitForFunction(()=>document.getElementById('load').style.display==='none'&&window.HMENU,null,{timeout:90000});
const clk=s=>p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent);if(e)e.click();return !!e},s);
await p.screenshot({path:'g_night.png',clip:{x:300,y:0,width:680,height:70}});
await clk('#modal [data-go="night"]');await clk('[data-protect]');await clk('[data-follow]');await clk('[data-go="sleep"]');await p.waitForTimeout(300);await clk('[data-go="day"]');await p.waitForTimeout(500);
// walk west (A) until left panels glass
await p.keyboard.down('a');let got=false;for(let i=0;i<60&&!got;i++){await p.waitForTimeout(150);got=await p.evaluate(()=>document.querySelectorAll('.glass').length>0);}await p.keyboard.up('a');
await p.waitForTimeout(500);console.log('glass',await p.evaluate(()=>[...document.querySelectorAll('.glass')].map(e=>e.id||e.className)));
await p.screenshot({path:'g_glass.png'});
await p.keyboard.press('u');await p.waitForTimeout(300);await p.screenshot({path:'g_noui.png'});
console.log(errs);await b.close()})();
