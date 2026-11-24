import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(c,m)=>{if(!c)throw Error(m)};
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===8);
 await page.waitForFunction(()=>window.RhythmDrumV24?.ready()||window.RhythmDrumV24?.failed(),{},{timeout:30000});
 assert(await page.evaluate(()=>window.RhythmDrumV24.ready()),'keysound decoded');
 await page.locator('#rhEasyPage .v23-mode button').nth(1).click();
 await page.waitForTimeout(500);
 assert(await page.evaluate(()=>window.RhythmHomeV16.hardAlbum())==='well_lived_hard_repeat_v21','HARD first album V2');
 await page.locator('#rhHardPlay').click();
 await page.waitForFunction(()=>playing&&audio&&!audio.paused,{},{timeout:15000});
 await page.waitForFunction(()=>ac?.state==='running');
 const result=await page.evaluate(()=>{
  const v=window.RhythmDrumV24;const n=notes.find(n=>n.state==='pending'&&n.kind==='tap');const m=notes.find(n=>n!==n&&n.state==='pending');
  const before=window.RhythmHitV23.count,hitBefore=v.diag.count;
  // Use a chart note near the audio clock, avoiding a future scheduled source.
  audio.currentTime=Math.max(0,n.t-.01);
  registerSuccess(n,0,false);
  const missed=notes.find(x=>x!==n&&x.state==='pending');registerMiss(missed);
  return {used:v.used(),backing:audio.src.includes('keysound-v24/backing.mp3'),notes:notes.length,coins:notes.filter(x=>x.coin).length,hit:v.diag.count-hitBefore,miss:v.diag.miss,synthetic:window.RhythmHitV23.count-before,last:v.diag.last,error:v.diag.error,state:n.state};
 });
 assert(result.used&&result.backing&&result.notes===240&&result.coins===20&&result.hit===1&&result.miss===1&&result.synthetic===0&&result.state==='done','V2 hit/miss routes '+JSON.stringify(result));
 assert(errors.length===0,'page errors '+errors.join('; '));
 console.log('V24_QA_PASS '+JSON.stringify(result));
}finally{await browser.close()}
