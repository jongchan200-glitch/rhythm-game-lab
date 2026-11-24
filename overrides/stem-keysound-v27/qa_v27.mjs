import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(x,msg)=>{if(!x)throw Error(msg)},N='well_lived_hard_repeat_v21',H='well_lived_hard_master_v26';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8767/?v27',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===9,{},{timeout:30000});
 await page.waitForFunction(()=>window.RhythmStemV27?.ready()||window.RhythmStemV27?.failed(),{},{timeout:60000});
 assert(await page.evaluate(()=>RhythmStemV27.ready()),'real stem sample bank decoded');
 const m=await page.evaluate(()=>RhythmStemV27.map());
 assert(m.model==='htdemucs'&&m.version===27&&m.metrics.notes>=100&&m.metrics.writtenReconstructionRmsError<.00004,'real model and file reconstruction');
 assert(await page.evaluate(([n,h,count])=>songs[n].chart.length===count&&songs[n].difficulty===3&&songs[h].chart.length===390,[N,H,m.entries.length]),'only normal changed');
 for(let i=0;i<7;i++){if(await page.locator('#rhVinyl').getAttribute('data-song')===N)break;await page.locator('#rhRecordZone').press('ArrowRight');await page.waitForTimeout(200)}
 assert(await page.locator('#rhVinyl').getAttribute('data-song')===N,'select normal V2 LP');
 const saved=await page.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')]);
 await page.locator('#rhDemo').click();
 await page.waitForFunction(()=>playing&&autoplay&&audio.src.includes('keysound-stem-v27/backing.flac')&&!audio.paused,{},{timeout:20000});
 await page.waitForFunction(()=>notes.filter(n=>n.state==='done').length>=5,{},{timeout:30000});
 const a=await page.evaluate(()=>({count:RhythmStemV27.diag.autoCount,done:notes.filter(n=>n.state==='done').length,synth:RhythmHitV23.count,last:RhythmStemV27.diag.last,error:RhythmStemV27.diag.error,active:RhythmStemV27.active()}));
 assert(a.active&&a.count>=a.done&&a.count<=a.done+2&&a.synth===0&&a.last.stem&&a.last.rms>.0029&&!a.error,'V27 real automatic audio '+JSON.stringify(a));
 await page.evaluate(()=>finishGame());
 assert(JSON.stringify(saved)===JSON.stringify(await page.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')])),'demo no rewards');
 await page.locator('#rhPlay').click();
 await page.waitForFunction(()=>playing&&!autoplay&&!audio.paused);
 const b=await page.evaluate(()=>{const n=notes.find(n=>n.state==='pending');const start=RhythmStemV27.diag.count;registerSuccess(n,0,false);const hit=RhythmStemV27.diag.count-start;const missed=notes.find(n=>n.state==='pending');const c=RhythmStemV27.diag.count;registerMiss(missed);return {hit,missSound:RhythmStemV27.diag.count-c,last:RhythmStemV27.diag.last,error:RhythmStemV27.diag.error}});
 assert(b.hit===1&&b.missSound===0&&b.last.stem&&b.last.delay===0&&!b.error,'manual actual stem hit, silent miss '+JSON.stringify(b));
 assert(!errors.length,'page errors '+errors.join('; '));
 console.log('V27_QA_REAL_SOURCE_AUTOPLAY_AND_MANUAL_PASS '+JSON.stringify({metrics:m.metrics,auto:a,manual:b}));
 await page.goto('http://127.0.0.1:8767/audio-check-v27.html');assert(await page.locator('audio').count()===5,'comparison audio page');
}finally{await browser.close()}
