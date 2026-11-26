import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
try{
 for(const [width,height] of [[390,844],[360,640]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(()=>{
   localStorage.setItem('rhythm_lab_coins_v1','200');
   const orig=fetch.bind(window);
   window.fetch=(u,o)=>String(u).includes('v38-locks.json')?Promise.resolve(new Response(JSON.stringify({tracks:[{id:'deathmatch_one_take_v12',price:150}]}),{status:200,headers:{'Content-Type':'application/json'}})):orig(u,o);
  });
  await p.goto('http://127.0.0.1:8778/?v38',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.RhythmSongUnlockV38&&window.RhythmCoinV18&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===11);
  await p.evaluate(()=>window.RhythmSongUnlockV38.ready);
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.locked('deathmatch_one_take_v12')));
  await p.locator('#rhPlay').click();
  assert(await p.locator('.v38-modal').isVisible());
  await p.locator('.v38-actions button').last().click();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),50);
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.unlocked('deathmatch_one_take_v12')));
  assert.equal(await p.evaluate(()=>localStorage.getItem('rhythm_lab_music_preview_v36')),null);
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.RhythmSongUnlockV38&&window.RhythmCoinV18);
  await p.evaluate(()=>window.RhythmSongUnlockV38.ready);
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),50);
  assert.equal(await p.locator('#catalog .songBtn:not([disabled])').count(),11);
  assert.deepEqual(errors,[]);
  await p.close();
 }
 console.log('V38_QA_PASS two mobile viewports locked track, guarded start, 150 spent, persistent unlock, existing 11 tracks and MP3 key');
}finally{await browser.close()}
