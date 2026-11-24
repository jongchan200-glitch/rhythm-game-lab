import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(c,m)=>{if(!c)throw Error(m)};
async function boot(){
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===8);
 return {p,errors}
}
try{
 const {p,errors}=await boot();
 await p.waitForFunction(()=>window.RhythmDrumV24?.ready()||window.RhythmDrumV24?.failed(),{},{timeout:30000});
 assert(await p.evaluate(()=>window.RhythmDrumV24.ready()),'source audio ready');
 await p.locator('#rhEasyPage .v23-mode button').nth(1).click();
 await p.waitForTimeout(500);
 assert(await p.evaluate(()=>window.RhythmHomeV16.hardAlbum())==='well_lived_hard_repeat_v21','V2 selected');
 const saved=await p.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')]);
 await p.locator('#rhHardDemo').click();
 await p.waitForFunction(()=>playing&&autoplay&&audio&&!audio.paused);
 await p.waitForFunction(()=>notes.filter(n=>n.state==='done').length>=4,{},{timeout:20000});
 const v=await p.evaluate(()=>({used:RhythmDrumV24.used(),backing:audio.src.includes('keysound-v24/backing.mp3'),done:notes.filter(n=>n.state==='done').length,auto:RhythmDrumV24.diag.autoCount,manual:RhythmDrumV24.diag.manualCount,synthetic:RhythmHitV23.count,error:RhythmDrumV24.diag.error,state:ac.state,clock:audio.currentTime,last:RhythmDrumV24.diag.last}));
 assert(v.used&&v.backing&&v.auto>=v.done&&v.auto<=v.done+2&&v.manual===0&&v.synthetic===0&&v.error===''&&v.state==='running','V2 actual audio clock autoplay '+JSON.stringify(v));
 await p.evaluate(()=>finishGame());
 const after=await p.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')]);
 assert(JSON.stringify(saved)===JSON.stringify(after),'autoplay saves unchanged');
 assert(!errors.length,'V2 page errors '+errors.join('; '));
 console.log('V25_V2_REAL_CLOCK_AUTO_SOURCE_PASS '+JSON.stringify(v));
 await p.close();
 const e=await boot(),q=e.p;
 const old=await q.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')]);
 await q.locator('#rhDemo').click();
 await q.waitForFunction(()=>playing&&autoplay&&audio&&!audio.paused);
 await q.waitForFunction(()=>notes.filter(n=>n.state==='done').length>=3,{},{timeout:20000});
 const r=await q.evaluate(()=>({song:current.id,done:notes.filter(n=>n.state==='done'&&n.kind!=='release').length,synth:RhythmHitV23.count,used:RhythmDrumV24.used(),state:ac.state}));
 assert(!r.used&&r.synth===r.done&&r.synth>=3&&r.state==='running','regular song auto note sound '+JSON.stringify(r));
 await q.evaluate(()=>finishGame());
 assert(JSON.stringify(old)===JSON.stringify(await q.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')])),'regular auto saves unchanged');
 assert(!e.errors.length,'regular auto page errors '+e.errors.join('; '));
 console.log('V25_REGULAR_SONG_AUTO_REAL_CLOCK_PASS '+JSON.stringify(r));
 await q.close();
}finally{await browser.close()}
