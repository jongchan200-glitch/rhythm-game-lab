import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
try{
 for(const [width,height] of [[390,844],[360,640]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(()=>{if(!sessionStorage.getItem('v38_qa_seed')){localStorage.setItem('rhythm_lab_coins_v1','200');sessionStorage.setItem('v38_qa_seed','1')}});
  await p.goto('http://127.0.0.1:8778/?v38',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.RhythmSongUnlockV38&&window.RhythmCoinV18&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===12,{},{timeout:30000});
  await p.evaluate(()=>window.RhythmSongUnlockV38.ready);
  const manifest=await (await p.request.get('http://127.0.0.1:8778/assets/manifest.json')).json();
  assert.equal(manifest.tracks.filter(x=>x.status==='ready').length,12);
  const song=manifest.tracks.find(x=>x.id==='door_open_easy_v38');
  assert(song&&song.difficulty===3&&song.duration>90&&song.duration<91&&song.audio.endsWith('.mp3'));
  const chart=await (await p.request.get('http://127.0.0.1:8778/'+song.chart)).json();
  assert.equal(chart.notes.length,246);
  assert.equal(chart.bpm,95.7);
  const audio=await p.request.get('http://127.0.0.1:8778/'+song.audio);
  assert(audio.ok()&&Number(audio.headers()['content-length']||0)>1000000);
  const config=await(await p.request.get('http://127.0.0.1:8778/assets/v38-locks.json')).json();
  assert.deepEqual(config.tracks,[{id:'door_open_easy_v38',price:150}]);
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.locked('door_open_easy_v38')));
  assert(!await p.evaluate(()=>window.RhythmSongUnlockV38.locked('deathmatch_one_take_v12')));
  await p.evaluate(()=>document.querySelector('#catalog .songBtn[data-song="door_open_easy_v38"]').click());
  await p.waitForFunction(()=>document.querySelector('#catalog .songBtn.selected')?.dataset.song==='door_open_easy_v38');
  await p.locator('#rhPlay').click();
  assert(await p.locator('.v38-modal').isVisible(),'locked song start shows purchase');
  assert((await p.locator('.v38-funds').textContent()).includes('150'));
  await p.locator('.v38-actions button').last().click();
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),50);
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.unlocked('door_open_easy_v38')));
  assert.equal(await p.evaluate(()=>window.RhythmSongUnlockV38.buy('door_open_easy_v38')),false);
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),50);
  assert.equal(await p.evaluate(()=>localStorage.getItem('rhythm_lab_music_preview_v36')),null);
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.RhythmSongUnlockV38&&window.RhythmCoinV18&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===12,{},{timeout:30000});
  await p.evaluate(()=>window.RhythmSongUnlockV38.ready);
  assert.equal(await p.evaluate(()=>window.RhythmCoinV18.balance()),50);
  assert(await p.evaluate(()=>window.RhythmSongUnlockV38.unlocked('door_open_easy_v38')));
  assert.deepEqual(errors,[]);
  await p.close();
 }
 console.log('V38_DOOR_REAL_AUDIO_CHART_QA_PASS two mobile viewports, 12 tracks, 246 notes, 90s audio, lock, 150 debit, persistent unlock, original MP3 store unchanged');
}finally{await browser.close()}
