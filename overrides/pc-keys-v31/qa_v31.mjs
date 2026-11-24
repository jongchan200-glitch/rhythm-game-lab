import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(v,m)=>{if(!v)throw Error(m)};
try{
 const p=await browser.newPage({viewport:{width:1100,height:900}});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8771/?v31',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===10,{},{timeout:30000});
 await p.waitForFunction(()=>RhythmDrumV30?.ready(),{},{timeout:90000});
 const id='well_lived_drum_v3_v28';
 for(let i=0;i<8;i++){if(await p.locator('#rhVinyl').getAttribute('data-song')===id)break;await p.locator('#rhRecordZone').press('ArrowRight');await p.waitForTimeout(160)}
 assert(await p.locator('#rhVinyl').getAttribute('data-song')===id,'V3 selected');
 await p.locator('#rhPlay').click();await p.waitForFunction(()=>playing&&!autoplay&&RhythmDrumV28.active()&&!audio.paused);
 const tap=['m',',','.','/'],flick=['k','l',';','\''];
 // Exercise real browser key events for every lane. Spy only on dispatch,
 // while leaving gameplay input functions intact and calling their originals.
 await p.evaluate(()=>{window.pcTrace=[];const t=inputTap,f=inputFlick;inputTap=function(l){pcTrace.push(['tap',l]);return t(l)};inputFlick=function(l){pcTrace.push(['flick',l]);return f(l)}});
 for(const k of [...tap,...flick])await p.keyboard.press(k);
 const trace=await p.evaluate(()=>pcTrace);
 assert(JSON.stringify(trace)===JSON.stringify([...[0,1,2,3].map(i=>['tap',i]),...[0,1,2,3].map(i=>['flick',i])]),'key route '+JSON.stringify(trace));
 // One real chart hit via keyboard, not direct registerSuccess.
 const probe=await p.evaluate(()=>{const n=notes.find(n=>n.state==='pending');audio.currentTime=n.t-.04;return {lane:n.lane,id:n.id,t:n.t}});
 await p.waitForFunction(t=>audio.currentTime>=t-.015,probe.t);
 await p.keyboard.press(tap[probe.lane]);
 assert(await p.evaluate(i=>notes[i].state==='done',probe.id),'actual chart tap judgement');
 assert(await p.evaluate(()=>RhythmDrumV30.diag.manual>=1),'drum audio trigger');
 assert(!errors.length,'page errors '+errors.join('; '));
 console.log('V31_PC_KEYBOARD_REAL_BROWSER_PASS '+JSON.stringify({trace,probe,errors}));
}finally{await browser.close()}
