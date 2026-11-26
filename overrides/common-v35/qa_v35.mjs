import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const assert=(x,m)=>{if(!x)throw Error(m)};
try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  window.v35Vibrations=[];
  Object.defineProperty(navigator,'vibrate',{configurable:true,value:n=>{window.v35Vibrations.push(n);return true}});
  let fs=null;Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>fs});
  Object.defineProperty(document,'fullscreenEnabled',{configurable:true,get:()=>true});
  document.documentElement?.addEventListener('noop',()=>{});
  Element.prototype.requestFullscreen=function(options){window.v35FullscreenOptions=options;fs=this;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve()};
  Document.prototype.exitFullscreen=function(){fs=null;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve()};
 });
 await p.goto('http://127.0.0.1:8775/?v35',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.RhythmV35&&document.querySelectorAll('#catalog .songBtn:not([disabled])').length===11,{},{timeout:30000});
 const toggle=p.locator('#rhEasyPage .v35-fullscreen');
 assert(await toggle.isVisible(),'home switch absent');
 await toggle.click();assert(await toggle.getAttribute('aria-checked')==='true','fullscreen on');
 assert(await p.evaluate(()=>document.fullscreenElement===document.documentElement&&window.v35FullscreenOptions.navigationUI==='hide'),'root fullscreen');
 await toggle.click();assert(await toggle.getAttribute('aria-checked')==='false','fullscreen off');
 const routes=await p.evaluate(async()=>{
  const m=await fetch('assets/manifest.json').then(r=>r.json());
  return m.tracks.filter(t=>t.status==='ready').map(t=>{
   const track=songs[t.id];if(!track)return {id:t.id,ready:false};
   const original=track.audio,selected=window.RhythmDrumV24.gameAudio(track,false);
   return {id:t.id,ready:window.RhythmDrumV24.canStart(track,false),same:selected===original,source:original?.src||track.audioPath||t.audio};
  });
 });
 assert(routes.length===11&&routes.every(t=>t.ready&&t.same&&t.source.includes('assets/audio/')),'original mix routes '+JSON.stringify(routes));
 await p.evaluate(()=>document.querySelector('#catalog [data-song="wings_original_v34"]').click());
 await p.waitForFunction(()=>current?.id==='wings_original_v34'&&!document.getElementById('rhPlay').disabled);
 await p.locator('#rhPlay').click();await p.waitForFunction(()=>playing&&audio&&!audio.paused,{},{timeout:15000});
 const result=await p.evaluate(async()=>{
  audio.pause();initGame();paused=true;fxEnabled=true;fxVol=.8;hapticEnabled=true;
  initAudio();if(!ac)throw Error("AudioContext unavailable");await ac.resume();
  window.v35Vibrations.length=0;
  const first=window.RhythmV35.diag.hits;
  const wanted=['PERFECT','GREAT','GOOD','BAD'],found={};
  for(let i=0;i<=500;i++){const d=i/1000;const g=grade(d)[0];if(wanted.includes(g)&&!(g in found))found[g]=d}
  for(const g of wanted){if(!(g in found))throw Error('grade not found '+g);const n=notes.find(x=>x.kind==='tap'&&x.state==='pending'&&!x.coin);registerSuccess(n,found[g],false)}
  const n=notes.find(x=>x.state==='pending');registerMiss(n);
  const after=window.RhythmV35.diag.hits;
  const a=notes.find(x=>x.kind==='tap'&&x.state==='pending'&&!x.coin);registerSuccess(a,0,true);
  return {vibes:window.v35Vibrations.slice(),hits:after-first,peak:window.RhythmV35.diag.lastPeak,src:audio.src};
 });
 assert(JSON.stringify(result.vibes)==='[100,50,20,10]','grade vibration '+JSON.stringify(result));
 assert(result.hits===4&&result.peak>0&&result.peak<=.010,'quiet single hit '+JSON.stringify(result));
 assert(!errors.length,'page errors '+errors.join('; '));
 console.log('V35_QA_PASS 11 original mix routes, graded haptics, quiet hits, fullscreen on/off '+JSON.stringify(result));
}finally{await browser.close()}
