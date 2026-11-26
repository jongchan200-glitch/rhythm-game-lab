import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(x,m)=>{if(!x)throw Error(m)};
fs.mkdirSync('/tmp/v36-qa',{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8776/?v36',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.RhythmMusicV36&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===11,{},{timeout:30000});
 assert(await p.locator('[data-rh-panel="character"]').count()===0,'old menu removed');
 await p.locator('[data-rh-panel="music"]').click();
 const shell=p.locator('.v36-music');
 assert(await shell.isVisible(),'music opens');
 assert(await shell.locator('.v36-thumb').count()===4,'four original songs');
 await p.waitForFunction(()=>[...document.querySelectorAll('.v36-disc img')].every(i=>i.complete&&i.naturalWidth>0));
 const initial=await p.evaluate(()=>({balance:window.RhythmCoinV18.balance(),tracks:window.RhythmMusicV36.tracks.map(t=>t.title)}));
 assert(initial.tracks.join('|')==='오늘 밤도|데스매치|우리 꽤 잘살았네|날개를 펴','catalog titles');
 for(let i=0;i<4;i++){
  await shell.locator('.v36-thumb').nth(i).click();
  assert(await shell.locator('.v36-info h3').textContent()===initial.tracks[i],'album switch '+i);
  await p.screenshot({path:'/tmp/v36-qa/ALBUM_'+i+'.png'});
 }
 await shell.locator('.v36-preview').click();
 await p.waitForFunction(()=>window.RhythmMusicV36.previewId()==='wings');
 await shell.locator('.v36-record').click();
 assert(await shell.locator('.v36-detail').isVisible(),'detail opens');
 await p.screenshot({path:'/tmp/v36-qa/DETAIL.png'});
 await shell.locator('button[aria-label="검수용 구매"]').click();
 assert(await p.evaluate(()=>window.RhythmMusicV36.snapshot().wings&&window.RhythmCoinV18.balance()===Number(localStorage.getItem('rhythm_lab_coins_v1')||0)),'test ownership');
 assert(await p.evaluate(()=>window.RhythmCoinV18.balance())===initial.balance,'no debit without full original');
 await shell.locator('.v36-tabs button').nth(1).click();assert(await shell.locator('.v36-thumb').count()===1,'owned filter');
 await shell.locator('.v36-record').click();assert(await shell.locator('button[aria-label="원곡 다운로드 준비 중"]').isDisabled(),'unavailable original truthfully gated');
 await shell.locator('.v36-x').click();await shell.locator('.v36-back').click();
 assert(await shell.isHidden()&&await p.evaluate(()=>window.RhythmMusicV36.previewId()===null),'close and stop audio');
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.RhythmMusicV36);
 assert(await p.evaluate(()=>window.RhythmMusicV36.snapshot().wings),'persistent demo ownership');
 assert(!errors.length,'page errors '+errors.join('; '));console.log('V36_QA_PASS four records, artwork, preview, test ownership, no debit, original download gated');
}finally{await browser.close()}
