const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/hollow_brother_proto.html?seed=5&scenes=off');await p.waitForFunction(()=>document.getElementById('load').style.display==='none'&&window.HMENU,null,{timeout:90000});
const clk=s=>p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent);if(e)e.click();return !!e},s);
await clk('#modal [data-go="night"]');await clk('[data-protect]');await clk('[data-follow]');await clk('[data-go="sleep"]');await p.waitForTimeout(300);await clk('[data-go="day"]');await p.waitForTimeout(600);
const gd=()=>p.evaluate(()=>[...document.querySelectorAll('.glass')].map(e=>(e.id||e.className)+':'+e.style.getPropertyValue('--gd')));
await p.keyboard.down('a');let got=false;for(let i=0;i<60&&!got;i++){await p.waitForTimeout(100);got=(await gd()).length>0;}
await p.keyboard.up('a');await p.waitForTimeout(500);console.log('edge',await gd());await p.screenshot({path:'../shots/gd_edge.png'});
for(let k=0;k<3;k++){await p.keyboard.down('a');await p.keyboard.down('w');await p.waitForTimeout(450);await p.keyboard.up('w');await p.keyboard.up('a');await p.waitForTimeout(450);console.log('in'+k,await gd());}
await p.waitForTimeout(300);await p.screenshot({path:'../shots/gd_deep.png'});
console.log(errs);await b.close()})();
