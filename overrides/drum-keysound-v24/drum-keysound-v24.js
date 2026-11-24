/* V24: the selected V21 HARD V2 uses source percussion, not V11/V23 synth.
   The untouched original plays for album preview, autoplay and every other song. */
(()=>{
'use strict';
const ID='well_lived_hard_repeat_v21',ROOT='assets/keysound-v24/';
const $=id=>document.getElementById(id);
let map=null,buffer=null,ready=false,failed='',loading=null,used=false;
const backing=new Audio(ROOT+'backing.mp3');backing.preload='auto';backing.playsInline=true;
const sources=new Set();
const diag={count:0,miss:0,error:'',last:null};
function stop(){for(const s of [...sources]){try{s.stop()}catch(_){}sources.delete(s)}}
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
 if(track?.id!==ID||auto)return true;
 if(failed){status('드럼 음원 로드 실패 · 원곡으로 플레이');return true}
 if(!ready){status('드럼 연주 음원 불러오는 중 · 잠시 후 시작');load();return false}
 if(!matches(track)){status('채보 변경 감지 · 원곡으로 플레이');return true}
 return true;
}
function gameAudio(track,auto){
 stop();backing.pause();used=track?.id===ID&&!auto&&ready&&matches(track);
 diag.count=0;diag.miss=0;diag.last=null;
 return used?backing:track.audio;
}
function active(){return playing&&current?.id===ID&&!autoplay}
const oldHit=playHit;
playHit=function(sound,kind){if(active())return;return oldHit(sound,kind)};
const oldSuccess=registerSuccess;
registerSuccess=function(n,delta,auto=false){
 const pending=n.state==='pending',isTarget=active()&&!auto;
 const label=grade(delta)[0];
 oldSuccess(n,delta,auto);
 if(!pending||!isTarget||!used||n.state!=='done'||!fxEnabled||fxVol<=0||audio!==backing||!buffer)return;
 try{
  const e=map.entries[n.id];if(!e||Math.abs(n.t-e.t)>.004||n.lane!==e.lane)throw Error('keysound note mismatch');
  initAudio();if(!ac||ac.state!=='running'){diag.error='AudioContext not running';return}
  const now=ac.currentTime,clock=audio.currentTime,rate=audio.playbackRate||1;
  // Early hits wait at most to the actual original slice onset. Late hits use
  // a small bounded skip rather than playing the entire transient twice.
  const delay=Math.max(0,(e.start-clock)/rate),skip=Math.min(.034,Math.max(0,clock-e.start));
  const duration=e.length/map.rate-skip;if(duration<=.012)return;
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
  diag.count++;diag.error='';diag.last={id:n.id,t:n.t,share:e.share,gain:v,delay,skip};
 }catch(e){diag.error=String(e);console.warn('V24 keysound',e)}
};
const oldMiss=registerMiss;
registerMiss=function(n){const was=n.state==='pending';oldMiss(n);if(was&&active()&&used&&n.state==='miss')diag.miss++};
const oldFinish=finishGame;
finishGame=function(){stop();return oldFinish()};
window.RhythmDrumV24={canStart,gameAudio,load,ready:()=>ready,failed:()=>failed,used:()=>used,diag,backing,stop};
load();
})();
