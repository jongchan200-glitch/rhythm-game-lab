import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(v,m)=>{if(!v)throw Error(m)};
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8769/?v29',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===10);
 await p.waitForFunction(()=>RhythmDrumV29?.ready(),{},{timeout:90000});
 const id='well_lived_drum_v3_v28';
 for(let i=0;i<8;i++){if(await p.locator('#rhVinyl').getAttribute('data-song')===id)break;await p.locator('#rhRecordZone').press('ArrowRight');await p.waitForTimeout(160)}
 assert(await p.locator('#rhVinyl').getAttribute('data-song')===id,'V3 selected');
 await p.locator('#rhPlay').click();await p.waitForFunction(()=>playing&&!autoplay&&RhythmDrumV28.active()&&!audio.paused);
 // Seek on the real audio graph to a strong early drum pulse. Mark earlier notes
 // skipped for this test only, to avoid game over on intentional forward seek.
 const probe=await p.evaluate(()=>{const m=RhythmDrumV29.map(),i=m.metrics.probeIndex;for(let j=0;j<i;j++)notes[j].state='skipped';audio.currentTime=m.entries[i].t-.055;return {i,t:m.entries[i].t}});
 await p.waitForFunction(t=>audio.currentTime>t+.075,probe.t);
 const silent=await p.evaluate(()=>({rms:RhythmDrumV29.meter(),gate:RhythmDrumV28.graph().gate,level:RhythmDrumV29.diag.level,clock:audio.currentTime}));
 assert(silent.rms<.000001&&silent.gate<.00001,'real no-input drum waveform silent '+JSON.stringify(silent));
 const played=await p.evaluate(({i,t})=>{notes[i].state='pending';audio.currentTime=t-.055;registerSuccess(notes[i],0,false);return RhythmDrumV28.decision(i)},probe);
 assert(played===1,'manual hit decision');
 await p.waitForFunction(t=>audio.currentTime>t+.075,probe.t);
 const audible=await p.evaluate(()=>({rms:RhythmDrumV29.meter(),gate:RhythmDrumV28.graph().gate,level:RhythmDrumV29.diag.level,clock:audio.currentTime,synthetic:RhythmHitV23.count}));
 assert(audible.rms>.002&&audible.gate>.90&&audible.synthetic===0,'actual real drum waveform on hit '+JSON.stringify(audible));
 await p.evaluate(()=>finishGame());
 assert(!errors.length,'page errors '+errors.join('; '));
 console.log('V29_REAL_AUDIO_WAVEFORM_MISS_VS_HIT_PASS '+JSON.stringify({probe,silent,audible,errors}));
}finally{await browser.close()}
