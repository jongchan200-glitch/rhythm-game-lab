/* V25: both manual and autoplay V2 use the identical source percussion mix.
   Other songs' autoplay invokes their existing note sound once per judgement. */
(()=>{
'use strict';
const ID='well_lived_hard_repeat_v21',ROOT='assets/keysound-v24/';
const $=id=>document.getElementById(id);
let map=null,buffer=null,ready=false,failed='',loading=null,used=false;
const backing=new Audio(ROOT+'backing.mp3');backing.preload='auto';backing.playsInline=true;
const sources=new Set(),scheduled=new Set();
const diag={count:0,autoCount:0,manualCount:0,miss:0,error:'',last:null};
function stop(){for(const s of [...sources]){try{s.stop()}catch(_){}sources.delete(s)}scheduled.clear()}
for(const event of ['pause','seeking','emptied','ended'])backing.addEventListener(event,stop);
backing.addEventListener('ended',()=>{if(audio===backing&&playing)finishGame()});
window.addEventListener('pagehide',()=>{stop();backing.pause()});
function status(text){if($('rhHardInfo'))$('rhHardInfo').textContent=text}
function load(){
 if(loading)return loading;
 loading=(async()=>{try{
  const [m,b]=await Promise.all([fetch(ROOT+'map.json').then(r=>{if(!r.ok)throw Error('keysound map '+r.status);return r.json()}),fetch(ROOT+'source_hits.wav').then(r=>{if(!r.ok)throw Error('keysound audio '+r.status);return r.arrayBuffer()})]);
  if(m.songId!==ID||m.entries.length!==240)throw Error('keysound map mismatch');
  const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!O)throw Error('OfflineAudioContext unavailable');
  const decoder=new O(2,1,m.rate);buffer=await decoder.decodeAudioData(b);
  if(buffer.numberOfChannels!==2||Math.abs(buffer.duration-(m.entries.at(-1).offset+m.entries.at(-1).length)/m.rate)>.02)throw Error('keysound duration mismatch');
  map=m;ready=true;failed='';if(window.RhythmHomeV16?.hardAlbum()===ID)status('DRUM KEY SOUND · 원곡 타격음 연주');
 }catch(e){failed=String(e);diag.error=failed;console.warn('V24 keysound load',e);if(window.RhythmHomeV16?.hardAlbum()===ID)status('드럼 음원 로드 실패 · 원곡 재생 가능')}})();
 return loading;
}
function matches(track){return map&&track?.chart?.length===map.entries.length&&track.chart.every((n,i)=>{const e=map.entries[i];return Math.abs(n.t-e.t)<.004&&n.lane===e.lane&&n.kind===e.kind})}
function canStart(track,auto){
 if(track?.id!==ID)return true;
 if(failed){status('드럼 음원 로드 실패 · 원곡으로 플레이');return true}
 if(!ready){status('드럼 연주 음원 불러오는 중 · 잠시 후 시작');load();return false}
 if(!matches(track)){status('채보 변경 감지 · 원곡으로 플레이');return true}
 return true;
}
function gameAudio(track,auto){
 stop();backing.pause();used=track?.id===ID&&ready&&matches(track);
 diag.count=0;diag.autoCount=0;diag.manualCount=0;diag.miss=0;diag.last=null;
 return used?backing:track.audio;
}
function active(){return playing&&current?.id===ID}
const oldHit=playHit;
playHit=function(sound,kind){if(active())return;return oldHit(sound,kind)};
function emitKey(n,label,auto=false){
 if(!used||!fxEnabled||fxVol<=0||audio!==backing||!buffer||scheduled.has(n.id))return false;
 try{
  const e=map.entries[n.id];if(!e||Math.abs(n.t-e.t)>.004||n.lane!==e.lane)throw Error('keysound note mismatch');
  initAudio();if(!ac||ac.state!=='running'){diag.error='AudioContext not running';return false}
  const now=ac.currentTime,clock=audio.currentTime,rate=audio.playbackRate||1;
  const delay=Math.max(0,(e.start-clock)/rate);
  // Autoplay schedules the original source transient slightly ahead on the audio
  // clock. Manual hits retain V24's bounded skip for forgiving tap response.
  const skip=auto?Math.max(0,clock-e.start):Math.min(.034,Math.max(0,clock-e.start));
  const duration=e.length/map.rate-skip;if(duration<=.012)return false;
  const src=ac.createBufferSource(),gain=ac.createGain();
  src.buffer=buffer;src.playbackRate.value=rate;
  const v=Math.min(1,Math.max(0,fxVol))*e.share*(label==='BAD'?.35:label==='GOOD'?.78:1);
  gain.gain.setValueAtTime(0,now+delay);
  gain.gain.linearRampToValueAtTime(v,now+delay+.004);
  gain.gain.setValueAtTime(v,now+delay+Math.max(.004,duration/rate-.008));
  gain.gain.linearRampToValueAtTime(0,now+delay+duration/rate);
  src.connect(gain);gain.connect(ac.destination);sources.add(src);
  src.onended=()=>{sources.delete(src);src.disconnect();gain.disconnect()};
  src.start(now+delay,e.offset/map.rate+skip,duration);
  scheduled.add(n.id);diag.count++;if(auto)diag.autoCount++;else diag.manualCount++;
  diag.error='';diag.last={id:n.id,t:n.t,share:e.share,gain:v,delay,skip,auto};
  return true;
 }catch(e){diag.error=String(e);console.warn('V25 keysound',e);return false}
}
const oldSuccess=registerSuccess;
registerSuccess=function(n,delta,auto=false){
 const pending=n.state==='pending',target=active(),label=grade(delta)[0];
 oldSuccess(n,delta,auto);
 if(!pending||n.state!=='done')return;
 if(target){emitKey(n,label,auto);return}
 // The original scoring engine deliberately skipped playHit on auto.
 // Route through the same instrument/pitch/volume settings as manual,
 // never through a second manual judgement or coin/record code.
 if(auto&&playing&&autoplay&&n.kind!=='release')oldHit(n.sound||n.pitch,n.kind);
};
const oldProcess=processNotes;
processNotes=function(){
 if(active()&&autoplay&&!paused&&used&&audio===backing&&!audio.seeking&&!audio.paused&&map){
  const clock=audio.currentTime;
  for(const n of notes){
   if(n.state!=='pending'||scheduled.has(n.id))continue;
   const e=map.entries[n.id];if(!e)continue;
   if(e.start>clock+.105)break;
   if(e.start+e.length/map.rate>clock+.012)emitKey(n,'PERFECT',true);
  }
 }
 return oldProcess();
};
const oldMiss=registerMiss;
registerMiss=function(n){const was=n.state==='pending';oldMiss(n);if(was&&active()&&used&&n.state==='miss')diag.miss++};
const oldFinish=finishGame;
finishGame=function(){stop();return oldFinish()};
window.RhythmDrumV24={canStart,gameAudio,load,ready:()=>ready,failed:()=>failed,used:()=>used,diag,backing,stop};
window.RhythmAutoplayV25={version:25,diag};
load();
})();
