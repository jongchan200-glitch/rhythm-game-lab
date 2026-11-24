import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(v,m)=>{if(!v)throw Error(m)};
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8770/?v30',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===10);
 await p.waitForFunction(()=>RhythmDrumV30?.ready(),{},{timeout:90000});
 const m=await p.evaluate(()=>RhythmDrumV30.map());
 assert(m.entries.length===281&&m.metrics.automaticDrumSeconds>0&&m.metrics.playerDrumGapPeak<.000001,'split verification');
 const id='well_lived_drum_v3_v28';
 for(let i=0;i<8;i++){if(await p.locator('#rhVinyl').getAttribute('data-song')===id)break;await p.locator('#rhRecordZone').press('ArrowRight');await p.waitForTimeout(160)}
 assert(await p.locator('#rhVinyl').getAttribute('data-song')===id,'V3 selected');
 await p.locator('#rhPlay').click();await p.waitForFunction(()=>playing&&!autoplay&&RhythmDrumV28.active()&&!audio.paused);
 const probe=await p.evaluate(()=>{const m=RhythmDrumV30.map(),i=m.metrics.probeIndex;for(let j=0;j<i;j++)notes[j].state='skipped';audio.currentTime=m.entries[i].t-.055;return {i,t:m.entries[i].t}});
 await p.waitForFunction(t=>audio.currentTime>t+.075,probe.t);
 const quiet=await p.evaluate(()=>({rms:RhythmDrumV30.meter(),gate:RhythmDrumV28.graph().gate,clock:audio.currentTime}));
 assert(quiet.gate<.02,'unplayed drum gain '+JSON.stringify(quiet));
 await p.evaluate(({i,t})=>{notes[i].state='pending';audio.currentTime=t-.055;registerSuccess(notes[i],0,false)},probe);
 await p.waitForFunction(t=>audio.currentTime>t+.075,probe.t);
 const full=await p.evaluate(()=>({rms:RhythmDrumV30.meter(),gate:RhythmDrumV28.graph().gate,clock:audio.currentTime,synth:RhythmHitV23.count}));
 assert(full.rms>.002&&full.gate>.90&&full.rms>quiet.rms*20&&full.synth===0,'hit vs miss measured '+JSON.stringify({quiet,full}));
 assert(!errors.length,'page errors '+errors.join('; '));
 console.log('V30_SELECTIVE_DRUM_REAL_OUTPUT_PASS '+JSON.stringify({metrics:m.metrics,quiet,full}));
 await p.evaluate(()=>finishGame());
}finally{await browser.close()}
