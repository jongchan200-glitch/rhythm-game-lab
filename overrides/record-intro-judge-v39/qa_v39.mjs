import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
 for(const [width,height] of [[390,844],[360,640]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[];const consoles=[];const responses=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')consoles.push(m.type()+':'+m.text())});p.on('response',r=>{if(/manifest\.json|charts\//.test(r.url()))responses.push([r.status(),r.url().slice(-100)])});
  await p.addInitScript(()=>{localStorage.setItem('rhythm_lab_coins_v1','300')});
  await p.goto('http://127.0.0.1:8779/?v39',{waitUntil:'domcontentloaded'});
  try{
   await p.waitForFunction(()=>window.RhythmJudgementV39&&window.RhythmShopV33&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===12,{},{timeout:14000});
  }catch(err){
   console.log('V39_BOOT_DIAG',JSON.stringify(await p.evaluate(()=>({
    judge:!!window.RhythmJudgementV39,shop:!!window.RhythmShopV33,
    total:document.querySelectorAll('#catalog .songBtn').length,
    usable:document.querySelectorAll('#catalog .songBtn:not([disabled])').length,
    selected:document.querySelector('#catalog .songBtn.selected')?.dataset.song,
    scripts:[...document.scripts].map(x=>x.src).filter(x=>x.includes('v39')||x.includes('shop-v33')),
    body:document.body?.innerText.slice(-2000),catalog:document.getElementById('catalog')?.innerHTML.slice(0,400),songs:typeof songs==='object'?Object.keys(songs).slice(0,20):null,manifestReady:typeof manifest!=='undefined',
   }))),errors,consoles,responses.slice(-35));throw err;
  }
  const manifest=await(await p.request.get('http://127.0.0.1:8779/assets/manifest.json')).json();
  assert.equal(manifest.tracks.filter(t=>t.status==='ready').length,12);
  for(const t of manifest.tracks.filter(t=>t.status==='ready')){
   const chart=await(await p.request.get('http://127.0.0.1:8779/'+t.chart)).json();
   assert((chart.notes||chart)[0].t>=2.8,'minimum lead-in '+t.id);
  }
  await p.locator('[data-rh-panel="shop"]').click();
  const shell=p.locator('.v33-shop');
  assert.equal(await shell.locator('.v33-sale [data-item="judge2"]').count(),1);
  assert.equal(await shell.locator('.v33-sale [data-item="judge3"]').count(),1);
  await shell.locator('.v33-sale [data-item="judge2"]').click();
  await shell.locator('.v33-buy').click();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),260);
  await shell.locator('.v33-back').click();
  await p.locator('#rhEasyPage .v33-slot').first().click();
  await shell.locator('.v33-sale [data-item="judge2"]').click();
  assert.equal(await p.evaluate(()=>window.RhythmJudgementV39.multiplier()),2);
  await p.locator('#rhPlay').click();
  await p.waitForFunction(()=>playing&&!audio.paused,{},{timeout:15000});
  const a=await p.evaluate(()=>({m:RhythmJudgementV39.multiplier(),width:getComputedStyle(document.querySelector('.v7-hit-band')).height,shade:document.querySelector('.field').dataset.judgeItem,perf:grade(0)[0]}));
  assert.equal(a.m,2);assert.equal(a.shade,'double');assert.equal(a.perf,'PERFECT');
  assert(Number.parseFloat(a.width)>=8,'physical band is visible');
  assert.equal(errors.length,0,'page errors '+errors.join(';'));
  await p.close();
 }
 console.log('V39_QA_PASS 12 lead-ins, permanent red equipment purchase and real visual judge band, 2 mobile sizes');
}finally{await browser.close()}
