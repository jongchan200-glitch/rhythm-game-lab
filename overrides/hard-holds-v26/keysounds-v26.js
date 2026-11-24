/* V26: two separate source-derived percussion banks. Normal V2 stays intact. */
(()=>{
'use strict';
const NORMAL='well_lived_hard_repeat_v21',HARD='well_lived_hard_master_v26';
const $=id=>document.getElementById(id);
const banks=new Map([[NORMAL,{root:'assets/keysound-v24/',count:240}],[HARD,{root:'assets/keysound-hard-v26/',count:390}]]);
let bank=null;const sources=new Set(),scheduled=new Set();
const diag={count:0,autoCount:0,manualCount:0,miss:0,error:'',last:null};
function stop(){for(const s of [...sources]){try{s.stop()}catch(_){}sources.delete(s)}scheduled.clear()}
function status(id,text){const el=$(id===HARD?'rhHardInfo':'rhSongSub');if(el)el.textContent=text}
function load(id){
 const b=banks.get(id);if(!b)return Promise.resolve();if(b.loading)return b.loading;
 b.loading=(async()=>{try{
  const [m,bytes]=await Promise.all([fetch(b.root+'map.json').then(r=>{if(!r.ok)throw Error('keysound map '+r.status);return r.json()}),fetch(b.root+'source_hits.wav').then(r=>{if(!r.ok)throw Error('keysound wav '+r.status);return r.arrayBuffer()})]);
  if(m.songId!==id||m.entries.length!==b.count)throw Error('keysound map mismatch');
  const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!O)throw Error('OfflineAudioContext unavailable');
  b.buffer=await new O(2,1,m.rate).decodeAudioData(bytes);
  if(b.buffer.numberOfChannels!==2||Math.abs(b.buffer.duration-(m.entries.at(-1).offset+m.entries.at(-1).length)/m.rate)>.02)throw Error('keysound duration mismatch');
  b.map=m;b.ready=true;b.failed='';
 }catch(e){b.failed=String(e);diag.error=b.failed;console.warn('V26 keysound load',id,e)}})();
 return b.loading;
}
for(const [id,b] of banks){
 b.audio=new Audio(b.root+'backing.mp3');b.audio.preload='auto';b.audio.playsInline=true;
 for(const event of ['pause','seeking','emptied','ended'])b.audio.addEventListener(event,()=>{if(bank===b)stop()});
 b.audio.addEventListener('ended',()=>{if(audio===b.audio&&playing)finishGame()});
}
window.addEventListener('pagehide',()=>{stop();for(const b of banks.values())b.audio.pause()});
function matches(track,b){return b?.map&&track?.chart?.length===b.map.entries.length&&track.chart.every((n,i)=>{const e=b.map.entries[i];return Math.abs(n.t-e.t)<.004&&n.lane===e.lane&&n.kind===e.kind})}
function canStart(track,auto){
 const b=banks.get(track?.id);if(!b)return true;
 if(b.failed){status(track.id,'드럼 음원 로드 실패 · 원곡 재생');return true}
 if(!b.ready){status(track.id,'드럼 연주 음원 불러오는 중 · 다시 시작');load(track.id);return false}
 if(!matches(track,b)){status(track.id,'채보 변경 감지 · 원곡 재생');return true}
 return true;
}
function gameAudio(track,auto){
 stop();bank=null;for(const b of banks.values())b.audio.pause();
 const b=banks.get(track?.id);bank=b?.ready&&matches(track,b)?b:null;
 Object.assign(diag,{count:0,autoCount:0,manualCount:0,miss:0,last:null,error:''});
 return bank?bank.audio:track.audio;
}
function active(){return playing&&banks.has(current?.id)}
const oldHit=playHit;
playHit=function(sound,kind){if(active())return;return oldHit(sound,kind)};
function emitKey(n,label,auto=false){
 if(!bank||!fxEnabled||fxVol<=0||audio!==bank.audio||scheduled.has(n.id))return false;
 try{
 const m=bank.map,e=m.entries[n.id];if(!e||Math.abs(n.t-e.t)>.004||n.lane!==e.lane||n.kind!==e.kind)throw Error('keysound note mismatch');
 initAudio();if(!ac||ac.state!=='running'){diag.error='AudioContext not running';return false}
 const now=ac.currentTime,clock=audio.currentTime,rate=audio.playbackRate||1,delay=Math.max(0,(e.start-clock)/rate);
 const skip=auto?Math.max(0,clock-e.start):Math.min(.034,Math.max(0,clock-e.start)),duration=e.length/m.rate-skip;
 if(duration<=.012)return false;
 const src=ac.createBufferSource(),gain=ac.createGain(),v=Math.min(1,Math.max(0,fxVol))*e.share*(label==='BAD'?.35:label==='GOOD'?.78:1);
 src.buffer=bank.buffer;src.playbackRate.value=rate;
 gain.gain.setValueAtTime(0,now+delay);gain.gain.linearRampToValueAtTime(v,now+delay+.004);
 gain.gain.setValueAtTime(v,now+delay+Math.max(.004,duration/rate-.008));gain.gain.linearRampToValueAtTime(0,now+delay+duration/rate);
 src.connect(gain);gain.connect(ac.destination);sources.add(src);
 src.onended=()=>{sources.delete(src);src.disconnect();gain.disconnect()};
 src.start(now+delay,e.offset/m.rate+skip,duration);scheduled.add(n.id);
 diag.count++;if(auto)diag.autoCount++;else diag.manualCount++;diag.error='';diag.last={id:n.id,t:n.t,kind:n.kind,share:e.share,gain:v,delay,skip,auto};
 return true;
 }catch(e){diag.error=String(e);console.warn('V26 keysound',e);return false}
}
const oldSuccess=registerSuccess;
registerSuccess=function(n,delta,auto=false){
 const pending=n.state==='pending',target=active(),label=grade(delta)[0];oldSuccess(n,delta,auto);
 if(!pending||n.state!=='done')return;
 if(target){emitKey(n,label,auto);return}
 if(auto&&playing&&autoplay&&n.kind!=='release')oldHit(n.sound||n.pitch,n.kind);
};
const oldProcess=processNotes;
processNotes=function(){
 if(active()&&autoplay&&!paused&&bank&&audio===bank.audio&&!audio.seeking&&!audio.paused){
  const clock=audio.currentTime,m=bank.map;
  for(const n of notes){if(n.state!=='pending'||scheduled.has(n.id))continue;const e=m.entries[n.id];if(!e)continue;if(e.start>clock+.105)break;if(e.start+e.length/m.rate>clock+.012)emitKey(n,'PERFECT',true)}
 }
 return oldProcess();
};
const oldMiss=registerMiss;
registerMiss=function(n){const was=n.state==='pending';oldMiss(n);if(was&&active()&&bank&&n.state==='miss')diag.miss++};
const oldFinish=finishGame;finishGame=function(){stop();return oldFinish()};
window.RhythmDrumV24={canStart,gameAudio,load,ready:(id=NORMAL)=>!!banks.get(id)?.ready,failed:(id=NORMAL)=>banks.get(id)?.failed||'',used:()=>!!bank,diag,stop};
window.RhythmAutoplayV25={version:26,diag};
window.RhythmKeysV26={ready:id=>!!banks.get(id)?.ready,failed:id=>banks.get(id)?.failed||'',diag};
load(NORMAL);load(HARD);
})();
