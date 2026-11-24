import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(c,m)=>{if(!c)throw Error(m)};
const N='well_lived_hard_repeat_v21',H='well_lived_hard_master_v26';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===9,{},{timeout:30000});
 await page.waitForFunction(([n,h])=>RhythmKeysV26.ready(n)&&RhythmKeysV26.ready(h),[N,H],{timeout:45000});
 const cats=await page.evaluate(([n,h])=>({normal:songs[n].difficulty,normalActions:songs[n].inputActions,normalRules:songs[n].ruleDifficulty,normalNotes:songs[n].chart.length,hard:songs[h].difficulty,hardNotes:songs[h].chart.length,hold:songs[h].chart.filter(x=>x.kind==='hold').length,release:songs[h].chart.filter(x=>x.kind==='release').length}),[N,H]);
 assert(JSON.stringify(cats)===JSON.stringify({normal:3,normalActions:8,normalRules:5,normalNotes:240,hard:5,hardNotes:390,hold:18,release:18}),'catalog '+JSON.stringify(cats));
 await page.locator('#rhEasyPage .v23-mode button').nth(1).click();await page.waitForTimeout(500);
 assert(await page.evaluate(()=>RhythmHomeV16.hardAlbum())===H,'new hard first CD');
 const saved=await page.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')]);
 await page.locator('#rhHardDemo').click();
 await page.waitForFunction(()=>playing&&autoplay&&audio.src.includes('keysound-hard-v26/backing.mp3'));
 await page.waitForFunction(()=>notes.some(n=>n.kind==='release'&&n.state==='done'),{},{timeout:15000});
 const a=await page.evaluate(()=>({hold:notes.filter(n=>n.kind==='hold'&&n.state==='done').length,release:notes.filter(n=>n.kind==='release'&&n.state==='done').length,done:notes.filter(n=>n.state==='done').length,keys:RhythmKeysV26.diag.autoCount,error:RhythmKeysV26.diag.error,coins:notes.filter(n=>n.coin).length}));
 assert(a.hold>=1&&a.release>=1&&a.keys>=a.done&&a.error===''&&a.coins>=18,'HARD hold autoplay '+JSON.stringify(a));
 await page.evaluate(()=>finishGame());
 assert(JSON.stringify(saved)===JSON.stringify(await page.evaluate(()=>[localStorage.getItem('moonlight_demo_records_v1'),localStorage.getItem('rhythm_lab_coins_v1')])),'auto no rewards');
 // Select the moved V2 through the real album gesture (keyboard equivalent).
 await page.locator('#rhHardPage .v23-mode button').nth(0).click();await page.waitForTimeout(500);
 for(let i=0;i<6;i++){if(await page.locator('#rhVinyl').getAttribute('data-song')===N)break;await page.locator('#rhRecordZone').press('ArrowRight');await page.waitForTimeout(150)}
 assert(await page.locator('#rhVinyl').getAttribute('data-song')===N,'moved V2 visible on normal LP');
 await page.locator('#rhPlay').click();
 await page.waitForFunction(()=>playing&&!autoplay&&audio.src.includes('keysound-v24/backing.mp3'));
 const b=await page.evaluate(()=>({id:current.id,notes:notes.length,coins:notes.filter(n=>n.coin).length,innerFlick:buttons[1].classList.contains('flickAllowed')&&buttons[2].classList.contains('flickAllowed')}));
 assert(b.id===N&&b.notes===240&&b.coins===20&&b.innerFlick,'normal preserved '+JSON.stringify(b));
 assert(!errors.length,'page errors '+errors.join('; '));
 console.log('V26_QA_PASS '+JSON.stringify({cats,hardAuto:a,normal:b,errors}));
}finally{await browser.close()}
