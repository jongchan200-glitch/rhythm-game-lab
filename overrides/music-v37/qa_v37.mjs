import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(x,m)=>{if(!x)throw Error(m)};
fs.mkdirSync('/tmp/v37-qa',{recursive:true});
try{
 for(const [width,height] of [[390,844],[360,640]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8777/?v37',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.RhythmMusicV37&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===11,{},{timeout:30000});
 await p.locator('[data-rh-panel="music"]').click();
 const shell=p.locator('.v37-music'),rec=shell.locator('.v37-record');
 assert(await shell.isVisible(),'gallery visible');
 assert(await shell.locator('.v36-thumb,.v36-arrow,.v36-preview,.v36-meta').count()===0,'old clutter removed');
 const b=await rec.boundingBox(),buy=await shell.locator('.v37-buy').first().boundingBox();
 assert(b.width>=width*.84&&b.x>=-1&&b.x+b.width<=width+1,'large LP '+JSON.stringify(b));
 assert(buy.y+buy.height<=height+1,'buy within viewport');
 assert(await shell.locator('.v37-credits').textContent()==='작사 · 작곡 Charles','English credit');
 const ids=['tonight','deathmatch','well-lived','wings'];
 for(let i=0;i<4;i++){
  await p.waitForFunction(id=>window.RhythmMusicV37.selectedId()===id&&document.querySelector('.v37-art').complete&&document.querySelector('.v37-art').naturalWidth>=600,ids[i]);
  await p.screenshot({path:'/tmp/v37-qa/ALBUM_'+width+'_'+i+'.png'});
  if(i<3){const q=await rec.boundingBox(),x=q.x+q.width*.83,y=q.y+q.height*.52;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(q.x+q.width*.17,y,{steps:9});await p.mouse.up();await p.waitForFunction(id=>window.RhythmMusicV37.previewId()===id,ids[i+1]);}
 }
 await p.waitForTimeout(450);await rec.click();assert(await p.evaluate(()=>window.RhythmMusicV37.previewId()===null),'tap pauses');
 const bal=await p.evaluate(()=>window.RhythmCoinV18.balance());
 await shell.locator('.v37-content>.v37-buy').click();assert(await shell.locator('.v37-detail').isVisible(),'detail visible');
 await p.screenshot({path:'/tmp/v37-qa/DETAIL_'+width+'.png'});
 await shell.locator('button[aria-label="검수용 구매"]').click();
 assert(await p.evaluate(()=>window.RhythmMusicV37.snapshot().wings&&window.RhythmCoinV18.balance()===0+Number(localStorage.getItem('rhythm_lab_coins_v1')||0)),'owned without payment');
 assert(await p.evaluate(()=>window.RhythmCoinV18.balance())===bal,'wallet unchanged');
 await shell.locator('.v37-tabs button').nth(1).click();
 assert(await p.evaluate(()=>window.RhythmMusicV37.selectedId()==='wings'),'owned gallery');
 await p.screenshot({path:'/tmp/v37-qa/OWNED_'+width+'.png'});
 await shell.locator('.v37-content>.v37-buy').click();assert(await shell.locator('button[aria-label="원곡 다운로드 준비 중"]').isDisabled(),'unavailable download gated');
 await shell.locator('.v37-x').click();await shell.locator('.v37-back').click();
 assert(await shell.isHidden()&&await p.evaluate(()=>window.RhythmMusicV37.previewId()===null),'close stops audio');
 assert(!errors.length,'page errors '+errors.join('; '));
 await p.close();
 }
 console.log('V37_QA_PASS large LP, four AI arts, swipe autoplay, concise Charles credits, purchase and owned gallery');
}finally{await browser.close()}
