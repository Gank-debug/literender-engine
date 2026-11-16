// The hanging plays after the verdict, then the result shows. node thang.js good|evil
const { chromium } = require('playwright');
(async()=>{const K=process.argv[2]||'good';const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/hollow_brother_proto.html?seed=7');await p.waitForFunction(()=>document.getElementById('load').style.display==='none'&&window.HMENU,null,{timeout:90000});
const clk=s=>p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.offsetParent);if(e)e.click();return !!e},s);
await p.evaluate(()=>{PROTO.G.opt.scenes=false});await clk('#modal [data-go="night"]');await clk('[data-protect]');await clk('[data-follow]');await clk('[data-go="sleep"]');await p.waitForTimeout(300);await clk('[data-go="day"]');
await p.evaluate(()=>{PROTO.G.opt.scenes=true;PROTO.startHearing();});await p.waitForTimeout(300);
await p.evaluate(K=>{const G=PROTO.G;const v=G.players.find(q=>q.id!==0&&(K==='evil'?q.role==='enemy':PROTO.team(q)==='good'));const votes={};G.players.forEach(q=>votes[q.id]=true);G.hearing.acc=[{target:v.id,by:0,votes,named:[0],round:1,out:'hanged'}];PROTO.finishHearing();window.HV=v.id;},K);
const ph=[];for(let i=0;i<70;i++){await p.waitForTimeout(500);ph.push(await p.evaluate(()=>PROTO.G.phase+(PROTO.NIGHT.OV.sub?':'+PROTO.NIGHT.OV.sub.slice(0,20):'')));if(i===14)await p.screenshot({path:'thang_mid.png'});if(!ph[ph.length-1].startsWith('cine')&&i>2)break;}
console.log(ph.filter((x,i)=>i%3==0||i==ph.length-1).join(' | '));
console.log('modal', await p.evaluate(()=>document.getElementById('modal').style.display+' '+document.getElementById('modal').innerText.slice(0,160)));
await p.screenshot({path:'thang_after.png'});console.log(errs);await b.close()})();
