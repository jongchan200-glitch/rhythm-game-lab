import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(x,m)=>{if(!x)throw Error(m)},ID='well_lived_drum_v3_v28';
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8768/?v28',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===10,{},{timeout:30000});
 await p.waitForFunction(()=>RhythmDrumV28.ready()||RhythmDrumV28.failed(),{},{timeout:90000});
 assert(await p.evaluate(()=>RhythmDrumV28.ready()),'V3 decoded two continuous stems');
 const m=await p.evaluate(()=>RhythmDrumV28.map());
 assert(m.metrics.reconstructionError<.000001&&m.metrics.notes>=180,'lossless stem reconstruction');
 for(let i=0;i<8;i++){if(await p.locator('#rhVinyl').getAttribute('data-song')===ID)break;await p.locator('#rhRecordZone').press('ArrowRight');await p.waitForTimeout(180)}
 assert(await p.locator('#rhVinyl').getAttribute('data-song')===ID,'V3 on normal LP');
 const saved=await p.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')]);
 await p.locator('#rhDemo').click();
 await p.waitForFunction(()=>playing&&autoplay&&RhythmDrumV28.active()&&!audio.paused);
 await p.waitForFunction(()=>RhythmDrumV28.diag.auto>=8,{},{timeout:30000});
 const a=await p.evaluate(()=>({diag:{...RhythmDrumV28.diag},graph:RhythmDrumV28.graph(),synth:RhythmHitV23.count,done:notes.filter(n=>n.state==='done').length,full:RhythmDrumV28.decision(0)}));
 assert(a.graph.sources===2&&a.diag.auto===a.done&&a.synth===0&&a.full===1&&a.diag.error===''&&a.graph.gate>.90,'continuous automatic drum graph '+JSON.stringify(a));
 await p.locator('#pause').click();const clock=await p.evaluate(()=>audio.currentTime);await p.waitForTimeout(250);assert(Math.abs(await p.evaluate(()=>audio.currentTime)-clock)<.005,'pause both stems');
 await p.locator('#pause').click();await p.waitForTimeout(100);assert(await p.evaluate(()=>RhythmDrumV28.graph().sources===2),'resume both stems');
 await p.evaluate(()=>finishGame());
 assert(JSON.stringify(saved)===JSON.stringify(await p.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')])),'no demo rewards');
 await p.locator('#rhPlay').click();await p.waitForFunction(()=>playing&&!autoplay&&!audio.paused);
 const b=await p.evaluate(()=>{const n=notes[0],q=notes[1];registerSuccess(n,0,false);registerMiss(q);return {hit:RhythmDrumV28.decision(0),miss:RhythmDrumV28.decision(1),diag:{...RhythmDrumV28.diag},graph:RhythmDrumV28.graph(),synth:RhythmHitV23.count}});
 assert(b.hit===1&&b.miss===.12&&b.diag.manual===1&&b.diag.miss===1&&b.synth===0&&b.graph.sources===2,'manual gate and miss '+JSON.stringify(b));
 assert(!errors.length,'page errors '+errors.join('; '));console.log('V28_QA_PASS '+JSON.stringify({metrics:m.metrics,auto:a,manual:b,errors}));
}finally{await browser.close()}
