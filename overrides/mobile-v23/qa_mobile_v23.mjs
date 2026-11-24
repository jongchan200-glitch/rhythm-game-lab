// Real compiled site smoke test on Chrome mobile viewports, no fake audio or notes.
import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
fs.mkdirSync('/tmp/v23-mobile-qa',{recursive:true});
const assert=(condition,label)=>{if(!condition)throw Error(label)};
try{
for(const [width,height] of [[390,844],[360,640]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#catalog .songBtn:not([disabled])').length===8,{timeout:30000});
 await page.waitForFunction(()=>document.getElementById('rhPlay')&&!document.getElementById('rhPlay').disabled);
 await page.waitForTimeout(300);
 async function shot(name){const buf=await page.screenshot({type:'jpeg',quality:45,path:'/tmp/v23-mobile-qa/'+name+'.jpg'});if(width===390)console.log('V23SHOT_'+name+'='+buf.toString('base64'))}
 async function inside(sel){const box=await page.locator(sel).boundingBox();return box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1}
 assert(await inside('#rhPlay'),'EASY play visible');assert(await inside('#rhFixedFooter'),'fixed footer visible');
 assert(await inside('#rhEasyPage .v23-title'),'fixed album title visible');await shot('HOME_'+width);
 await page.locator('[data-rh-panel="settings"]').click();
 assert(await inside('.v23-done'),'settings completion visible');
 assert(await page.locator('#rhFxVolume').inputValue()==='80','default FX 80');
 await page.locator('#rhFxVolume').evaluate(e=>{e.value='100';e.dispatchEvent(new Event('input',{bubbles:true}))});
 await page.locator('#rhMusicVolume').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}))});
 assert(await page.evaluate(()=>fxVol===1&&songVol===0),'volume sliders reach engine');
 await shot('SETTINGS_'+width);
 await page.locator('#v23SoundTest').click();
 await page.waitForFunction(()=>window.RhythmHitV23.count>=3,{timeout:5000});
 const hit=await page.evaluate(()=>({...window.RhythmHitV23,state:ac?.state,fxVol,songVol}));
 assert(hit.state==='running'&&hit.peak>=.4&&hit.fxVol===1,'real WebAudio test note output scheduled');
 await page.locator('.v23-done').click();assert(await page.locator('#rhDrawerBackdrop').isHidden(),'settings done closes');
 for(const panel of ['character','shop','coin','records']){await page.locator('[data-rh-panel="'+panel+'"]').click();assert(await inside('.v23-done'),panel+' close visible');await page.locator('.v23-done').click()}
 await page.locator('#rhEasyPage .v23-mode button').nth(1).click();
 await page.waitForFunction(()=>document.getElementById('rhHardPage').getAttribute('aria-hidden')==='false');
 await page.waitForTimeout(500);assert(await inside('#rhHardPlay'),'HARD play visible');await shot('HARD_'+width);
 await page.locator('#rhHardPage .v23-mode button').nth(0).click();await page.waitForTimeout(500);
 await page.locator('#rhPlay').click();
 await page.waitForFunction(()=>playing&&audio&&!audio.paused,{timeout:10000});
 // Invoke the normal manual-success path on a pending chart note to verify audio, not auto-demo.
 const hitTest=await page.evaluate(()=>{const n=notes.find(n=>n.state==='pending'&&n.kind==='tap');if(!n)throw Error('no tap');const before=window.RhythmHitV23.count;registerSuccess(n,0,false);return {delta:window.RhythmHitV23.count-before,state:n.state,peak:window.RhythmHitV23.peak}});
 assert(hitTest.delta===1&&hitTest.state==='done'&&hitTest.peak>0,'one actual manual judgement emits one sound');
 assert(errors.length===0,'page errors: '+errors.join('; '));
 console.log('V23_QA_PASS '+width+'x'+height+' '+JSON.stringify({hit,hitTest,errors}));
 await page.close();
}
}finally{await browser.close()}
