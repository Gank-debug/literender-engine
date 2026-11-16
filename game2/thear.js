const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/hollow_brother_proto.html?seed=5&scenes=off');await p.waitForFunction(()=>document.getElementById('load').style.display==='none'&&window.HMENU,null,{timeout:90000});


const clk=s=>p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent);if(e)e.click();return !!e},s);
await clk('#modal [data-go="night"]');await clk('[data-protect]');await clk('[data-follow]');await clk('[data-go="sleep"]');await p.waitForTimeout(300);await clk('[data-go="day"]');
await p.evaluate(()=>{PROTO.G.headless=true;for(let k=0;k<3000&&G.phase==='day';k++)PROTO.update(.05);PROTO.G.headless=false;});await p.waitForTimeout(800);
console.log('phase',await p.evaluate(()=>[G.phase,document.body.className,G.clues.length]));
// casebook scroll during hearing
const hit=await p.evaluate(()=>{const r=document.getElementById('case').getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e&&!!e.closest('#case')});
console.log('casebook clickable in hearing',hit);
await p.screenshot({path:'h_hear.png'});console.log(errs);await b.close()})();
