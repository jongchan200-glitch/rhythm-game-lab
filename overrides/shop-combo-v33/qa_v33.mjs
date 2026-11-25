import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(v,m)=>{if(!v)throw Error(m)};
fs.mkdirSync('/tmp/v33-qa',{recursive:true});
try{
const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const errors=[];p.on('pageerror',e=>errors.push(String(e)));
await p.addInitScript(()=>{if(!localStorage.getItem('v33_qa_seed')){localStorage.setItem('rhythm_lab_coins_v1','3000');localStorage.setItem('v33_qa_seed','1')}});
await p.goto('http://127.0.0.1:8773/?v33',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.RhythmShopV33&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===10,{},{timeout:30000});
await p.waitForFunction(()=>!document.getElementById('rhPlay').disabled);
await p.locator('[data-rh-panel="shop"]').click();
const shell=p.locator('.v33-shop'),sale=shell.locator('.v33-sale'),bag=shell.locator('.v33-bag');
assert(await shell.isVisible(),'shop opens');
assert(await sale.locator('.v33-item').count()===10,'9 items + expansion');
assert(await sale.locator('.v33-item').evaluateAll(a=>a.every(b=>b.textContent.trim()==='')),'icon-only sale tiles');
await p.waitForFunction(()=>[...document.querySelectorAll('.v33-sale img')].every(i=>i.complete&&i.naturalWidth>0));
await p.screenshot({path:'/tmp/v33-qa/SHOP.png'});
await sale.locator('[data-item="drink30"]').click();assert(await shell.locator('.v33-dialog').isVisible(),'detail popup');
await p.screenshot({path:'/tmp/v33-qa/DETAIL.png'});
await shell.locator('.v33-buy').click();
assert(await p.evaluate(()=>window.RhythmCoinV18.balance()===2985&&window.RhythmShopV33.snapshot().owned.drink30===1),'real debit and inventory');
assert(await bag.locator('[data-item="drink30"]').count()===1,'inventory tile');
await sale.locator('[data-item="expand"]').click();await shell.locator('.v33-buy').click();
assert(await p.evaluate(()=>window.RhythmCoinV18.balance()===2485&&window.RhythmShopV33.snapshot().capacity===3),'expansion paid');
await shell.locator('.v33-tabs button').nth(1).click();assert(await sale.locator('.v33-item').count()===6,'skin tab');
await p.screenshot({path:'/tmp/v33-qa/SKINS.png'});
await shell.locator('.v33-back').click();
assert(await p.locator('#rhEasyPage .v33-slot').count()===3,'three slots, no fourth placeholder');
await p.locator('#rhEasyPage .v33-slot').first().click();await sale.locator('[data-item="drink30"]').click();
assert(await p.evaluate(()=>window.RhythmShopV33.snapshot().slots[0]==='drink30'),'selected equipment');
await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.RhythmShopV33&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===10,{},{timeout:30000});
assert(await p.evaluate(()=>window.RhythmShopV33.snapshot().slots[0]==='drink30'&&window.RhythmCoinV18.balance()===2485),'persistent equipment and wallet');
await p.screenshot({path:'/tmp/v33-qa/HOME.png'});
await p.locator('#rhPlay').click();await p.waitForFunction(()=>playing&&!audio.paused,{},{timeout:12000});
// Freeze the clock and reset the real engine so exact milestone assertions
// cannot be shifted by a note judged before the browser automation resumes.
await p.evaluate(()=>{audio.pause();initGame();paused=true;});
const stages=[19,20,21,29,30,31,39,40,41,49,50,51];
let priorSize=0;
for(const target of stages){
 const result=await p.evaluate(target=>{
  const a=notes.filter(n=>n.kind==='tap'&&n.state==='pending'&&!n.coin);
  const need=target-combo;
  if(need<0||a.length<need)throw Error('Unexpected QA state '+JSON.stringify({combo,need,available:a.length}));
  for(let i=0;i<need;i++)registerSuccess(a[i],0,false);
  const box=document.querySelector('.v33-combo'),num=box.querySelector('strong');
  return {actual:combo,hud:document.getElementById('combo').textContent,visible:!box.hidden,number:num.textContent,tier:box.dataset.tier,size:parseFloat(getComputedStyle(num).fontSize),playing,overlayHidden:document.getElementById('overlay').hidden,grade:grade(0)[0]};
 },target);
 console.log('V33_COMBO_QA '+target+' '+JSON.stringify(result));
 assert(result.actual===target,'real combo mismatch '+JSON.stringify(result));
 assert(result.visible===(target>=20),'combo visibility '+JSON.stringify(result));
 if(target>=20){
  assert(result.number===String(target),'visible number mismatch '+JSON.stringify(result));
  assert(result.tier===String(Math.min(5,Math.floor(target/10))),'tier mismatch '+JSON.stringify(result));
  if(target%10===0){assert(result.size>priorSize,'milestone font must increase');priorSize=result.size;await p.screenshot({path:'/tmp/v33-qa/COMBO'+target+'.png'});}
  else if(target%10===1)assert(result.size===priorSize,'large combo stays visible between milestones');
 }
}
await p.evaluate(()=>{const n=notes.find(n=>n.state==='pending');registerMiss(n)});
assert(await p.evaluate(()=>combo===0&&document.querySelector('.v33-combo').hidden),'combo resets after miss');
assert(await p.evaluate(()=>window.RhythmShopV33.snapshot().owned.drink30===1),'review stage no automatic item consumption');
assert(!errors.length,'page errors '+errors.join('; '));
console.log('V33_QA_PASS icon art, buy/debit, inventory, expansion, equip, persistence, 19/20/21/30/40/50 milestones and reset');
}finally{await browser.close()}
