import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(v,m)=>{if(!v)throw Error(m)};
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{window.wingsVibrations=[];Object.defineProperty(navigator,'vibrate',{configurable:true,value:n=>{window.wingsVibrations.push(n);return true}})});
 await p.goto('http://127.0.0.1:8774/?v34',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===11,{},{timeout:30000});
 await p.evaluate(()=>document.querySelector('#catalog [data-song="wings_original_v34"]').click());
 await p.waitForFunction(()=>current?.id==='wings_original_v34'&&!document.getElementById('rhPlay').disabled);
 await p.locator('#rhPlay').click();
 await p.waitForFunction(()=>playing&&audio&&!audio.paused,{},{timeout:15000});
 const result=await p.evaluate(()=>{
  const original=audio,src=audio.src;fxEnabled=true;hapticEnabled=true;
  const count=window.RhythmHitV23.count;
  const n=notes.find(n=>n.kind==='tap'&&n.state==='pending'&&!n.coin);
  const before=combo;registerSuccess(n,0,false);
  return {source:src,stillPlaying:audio===original&&!audio.paused,noteCount:notes.length,combo:combo-before,syntheticHits:window.RhythmHitV23.count-count,vibrations:window.wingsVibrations.length,difficulty:current.difficulty,stemActive:window.RhythmDrumV28.active()};
 });
 assert(result.source.includes('wings_original_v34.mp3')&&result.stillPlaying,'original continuous playback '+JSON.stringify(result));
 assert(result.noteCount>=155&&result.noteCount<=235&&Number(result.difficulty)===3,'normal chart '+JSON.stringify(result));
 assert(result.combo===1&&result.syntheticHits===0&&result.vibrations>0&&!result.stemActive,'haptic only '+JSON.stringify(result));
 assert(!errors.length,'page errors '+errors.join('; '));
 console.log('V34_QA_PASS '+JSON.stringify(result));
}finally{await browser.close()}
