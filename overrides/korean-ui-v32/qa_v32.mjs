import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(v,m)=>{if(!v)throw Error(m)};
fs.mkdirSync('/tmp/v32-ui-qa',{recursive:true});
try{
for(const [width,height] of [[390,844],[360,640],[560,900]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500,deviceScaleFactor:1});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8772/?v32',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.RhythmSkinV32&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===10,{},{timeout:30000});
 await p.waitForFunction(()=>!document.getElementById('rhPlay').disabled);
 await p.waitForTimeout(200);
 const box=async sel=>p.locator(sel).boundingBox(), inside=async sel=>{const b=await box(sel);return b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=width+1&&b.y+b.height<=height+1};
 assert(await inside('#rhPlay')&&await inside('#rhFixedFooter')&&await inside('#rhVinyl'),'home fits '+width);
 const disc=await box('#rhVinyl');assert(disc.width>Math.min(width*.65,height*.40),'large record '+JSON.stringify(disc));
 assert(await p.locator('#rhEasyPage .v23-title').isHidden()&&await p.locator('#rhPreview').isHidden(),'no duplicate title and preview text');
 assert(await p.locator('.rh-nav .k32-icon').count()===5,'five icon art assets');
 assert(await p.evaluate(()=>[...document.querySelectorAll('.k32-icon')].every(i=>i.complete&&i.naturalWidth>0)),'all icons load');
 const screenshot=async name=>{const img=await p.screenshot({type:'jpeg',quality:55,path:'/tmp/v32-ui-qa/'+name+'.jpg'});if(width===390)console.log('V32SHOT_'+name+'='+img.toString('base64'))};
 await screenshot('HOME_'+width);
 // Actual page swipe on non-record area, not on the carousel.
 const brand=await box('#rhEasyPage .rh-brand');
 await p.mouse.move(width*.82,brand.y+brand.height*.55);await p.mouse.down();await p.mouse.move(width*.18,brand.y+brand.height*.55,{steps:8});await p.mouse.up();
 await p.waitForFunction(()=>document.getElementById('rhHardPage').getAttribute('aria-hidden')==='false',{},{timeout:5000});await p.waitForTimeout(500);
 assert(await inside('#rhHardPlay'),'hard page fits');
 await screenshot('HARD_'+width);
 await p.evaluate(()=>window.RhythmHomeV23Page(0));await p.waitForTimeout(500);
 await p.locator('[data-rh-panel="settings"]').click();assert(await inside('.v23-done'),'settings usable');await p.locator('.v23-done').click();
 await p.locator('#rhPlay').click();await p.waitForFunction(()=>playing&&!audio.paused,{},{timeout:12000});
 const f=await box('#field'),k=await box('#keyboard');assert(f.height>height*.60&&k.y+k.height>=height-18,'maximum field and bottom pads '+JSON.stringify({f,k}));
 assert(await p.locator('#keyboard .key').count()===4,'exact four pads');
 const n=await p.evaluate(()=>({canvas:canvas.height,notes:notes.length,hitLine:document.querySelector('.v7-hit-band')?.style.top||getComputedStyle(document.querySelector('.v7-hit-band')).top,health:!document.getElementById('v9HealthMeter').hidden}));
 assert(n.health&&n.notes>0,'real gameplay state');
 await screenshot('PLAY_'+width);
 assert(!errors.length,'page errors '+errors.join('; '));console.log('V32_QA_PASS '+JSON.stringify({width,height,disc,f,k,n,errors}));
 await p.close();
}
}finally{await browser.close()}
