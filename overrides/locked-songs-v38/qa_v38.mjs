import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
 for(const [width,height] of [[390,844],[360,640]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  // Start below the 30-coin unlock price: the user must never go negative.
  await p.addInitScript(()=>{if(!sessionStorage.getItem('v38_qa_seed')){localStorage.setItem('rhythm_lab_coins_v1','29');sessionStorage.setItem('v38_qa_seed','1')}});
  const waitReady=async()=>{await p.waitForFunction(()=>window.RhythmSongUnlockV38&&window.RhythmCoinV18&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===12,{},{timeout:30000});await p.evaluate(()=>window.RhythmSongUnlockV38.ready)};
  const reload=async()=>{await p.reload({waitUntil:'domcontentloaded'});await waitReady()};
  const selectDoor=async()=>{await p.evaluate(()=>document.querySelector('#catalog .songBtn[data-song="door_open_easy_v38"]').click());await p.waitForFunction(()=>document.querySelector('#catalog .songBtn.selected')?.dataset.song==='door_open_easy_v38')};
  await p.goto('http://127.0.0.1:8778/?v38',{waitUntil:'domcontentloaded'});await waitReady();
  const manifest=await (await p.request.get('http://127.0.0.1:8778/assets/manifest.json')).json();
  assert.equal(manifest.tracks.filter(x=>x.status==='ready').length,12);
  const song=manifest.tracks.find(x=>x.id==='door_open_easy_v38');
  assert(song&&song.difficulty===3&&song.duration>90&&song.duration<91&&song.audio.endsWith('.mp3'));
  const chart=await (await p.request.get('http://127.0.0.1:8778/'+song.chart)).json();
  assert.equal(chart.notes.length,246);
  assert.equal(chart.bpm,95.7);
  const audioFile=await p.request.get('http://127.0.0.1:8778/'+song.audio);
  assert(audioFile.ok()&&Number(audioFile.headers()['content-length']||0)>1000000);
  const config=await(await p.request.get('http://127.0.0.1:8778/assets/v38-locks.json')).json();
  assert.deepEqual(config.tracks,[{id:'door_open_easy_v38',price:30}]);
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.locked('door_open_easy_v38')));
  assert(!await p.evaluate(()=>window.RhythmSongUnlockV38.locked('deathmatch_one_take_v12')));
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),29);
  await selectDoor();await p.locator('#rhPlay').click();
  assert(await p.locator('.v38-modal').isVisible(),'locked song shows purchase dialog');
  assert((await p.locator('.v38-funds').textContent()).includes('30'));
  assert(await p.locator('.v38-actions button').last().isDisabled(),'29 coins cannot pay 30');
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),29);
  await p.locator('.v38-actions button').first().click();

  // Simulate an existing balance of 50, then earn one coin using actual PERFECT-note reward wiring.
  await p.evaluate(()=>localStorage.setItem('rhythm_lab_coins_v1','50'));
  await reload();
  await p.evaluate(()=>document.querySelector('#catalog .songBtn:not(.v38-locked):not([disabled])').click());
  await p.locator('#rhPlay').click();
  await p.waitForFunction(()=>playing&&!audio.paused,{},{timeout:15000});
  const reward=await p.evaluate(()=>{
    audio.pause();paused=true;
    const marked=notes.filter(n=>n.coin&&n.state==='pending');
    if(marked.length<2)throw Error('Not enough actual gold coin notes');
    registerSuccess(marked[0],0,true); // autoplay never earns currency.
    const afterDemo=window.RhythmCoinV18.balance();
    registerSuccess(marked[1],0,false); // actual PERFECT handler generates a flying coin.
    return {afterDemo,count:marked.length};
  });
  assert.equal(reward.afterDemo,50,'autoplay must not award coins');
  assert(reward.count>=2,'coin notes are present in game');
  await p.waitForFunction(()=>window.RhythmCoinV18.balance()===51,{},{timeout:6000});
  assert.equal(await p.evaluate(()=>localStorage.getItem('rhythm_lab_coins_v1')),'51');
  assert.equal((await p.locator('#v18GameCoinNumber').textContent()).trim(),'51');
  await reload();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),51,'earned coins persist after reload');

  // Unlock exactly once from that same persisted total (51 -> 21).
  await selectDoor();await p.locator('#rhPlay').click();
  assert(await p.locator('.v38-modal').isVisible(),'locked song requires explicit purchase');
  assert((await p.locator('.v38-funds').textContent()).includes('30'));
  await p.locator('.v38-actions button').last().click();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),21,'51 - 30 = 21');
  assert.equal(await p.evaluate(()=>localStorage.getItem('rhythm_lab_coins_v1')),'21');
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.unlocked('door_open_easy_v38')));
  assert.equal(await p.evaluate(()=>window.RhythmSongUnlockV38.buy('door_open_easy_v38')),false,'no duplicate billing');
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),21,'no additional coin debit');
  assert.equal(await p.evaluate(()=>localStorage.getItem('rhythm_lab_music_preview_v36')),null,'game unlock not a full MP3 purchase');
  await reload();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),21);
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.unlocked('door_open_easy_v38')));

  // The unlocked song is not just saved: actual gameplay must start with its audio.
  await selectDoor();await p.locator('#rhPlay').click();
  await p.waitForFunction(()=>playing&&!audio.paused&&current?.id==='door_open_easy_v38',{},{timeout:15000});
  assert(!await p.locator('.v38-modal').isVisible(),'no unlock dialog after purchase');
  await reload();

  // A shop purchase consumes the SAME wallet, not a second pool (21 -> 6).
  await p.locator('[data-rh-panel="shop"]').click();
  await p.locator('.v33-sale [data-item="drink30"]').click();
  await p.locator('.v33-buy').click();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),6,'21 - 15 = 6');
  assert.equal(await p.evaluate(()=>localStorage.getItem('rhythm_lab_coins_v1')),'6');
  assert.equal(await p.evaluate(()=>window.RhythmShopV33.snapshot().owned.drink30),1);
  await reload();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),6,'wallet persists');
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.unlocked('door_open_easy_v38')),'unlocked song persists');
  assert.equal(await p.evaluate(()=>window.RhythmShopV33.snapshot().owned.drink30),1,'shop inventory persists');
  assert.deepEqual(errors,[],'no browser runtime exceptions');
  await p.close();
  console.log('V38_COIN_QA_PASS '+width+'x'+height+' insufficient 29/30, earned +1 (demo +0), unlock -30, shop -15, reload persistence, no duplicate billing, 90s chart gameplay');
 }
 console.log('V38_30_COIN_UNLOCK_AND_SINGLE_WALLET_TWO_MOBILE_VIEWPORTS_PASS');
}finally{await browser.close()}
