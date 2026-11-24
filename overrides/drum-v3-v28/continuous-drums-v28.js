/* V28: continuous source drum track, shared AudioContext timeline, no sampled-hit retrigger. */
(()=>{
'use strict';
const ID='well_lived_drum_v3_v28',ROOT='assets/drum-v3-v28/',BASE=.12;
let data=null,buffers=null,loading=null,error='',player=null;
const diag={auto:0,manual:0,miss:0,scheduled:0,error:'',clock:0,level:BASE};
const decisions=new Map(),judgedIds=new Set();
function load(){
 if(loading)return loading;
 loading=(async()=>{try{
 const [m,b,d]=await Promise.all([fetch(ROOT+'map.json').then(r=>{if(!r.ok)throw Error('map '+r.status);return r.json()}),...['backing.flac','drums.flac'].map(f=>fetch(ROOT+f).then(r=>{if(!r.ok)throw Error(f+' '+r.status);return r.arrayBuffer()}))]);
 if(m.songId!==ID||m.version!==28||m.entries.length<180)throw Error('V3 map mismatch');
 const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 const dec=new O(2,1,m.rate);
 buffers=await Promise.all([dec.decodeAudioData(b),dec.decodeAudioData(d)]);
 if(buffers.some(x=>x.numberOfChannels!==2||Math.abs(x.duration-m.duration)>.02))throw Error('V3 stereo buffer mismatch');
 data=m;error='';
 }catch(e){error=String(e);diag.error=error;console.warn('V28 drum load',e)}})();
 return loading;
}
const isV3=()=>current?.id===ID;
function matches(t){return data&&t?.chart?.length===data.entries.length&&t.chart.every((n,i)=>{const e=data.entries[i];return Math.abs(n.t-e.t)<.004&&n.lane===e.lane&&n.kind===e.kind})}
function slotAt(t){
 let lo=0,hi=data.entries.length;while(lo<hi){let m=(lo+hi)>>1;if(data.entries[m].start<=t)lo=m+1;else hi=m}return lo-1
}
function levelFor(i){if(i<0)return 1;return fxEnabled?decisions.get(i)??BASE:BASE}
function amp(i){return levelFor(i)*Math.min(1.25,Math.max(0,fxVol/.8))}
class DrumClock{
 constructor(){this._pos=0;this._rate=1;this._volume=songVol;this._paused=true;this._anchor=0;this._nodes=[];this._token=0;this.src=ROOT+'backing.flac';this.preservesPitch=false}
 get duration(){return data.duration}
 get paused(){return this._paused}
 get seeking(){return false}
 get ended(){return this.currentTime>=this.duration-.001}
 get currentTime(){return Math.min(this.duration,this._paused?this._pos:this._pos+Math.max(0,ac.currentTime-this._anchor)*this._rate)}
 set currentTime(v){const was=!this._paused;this.pause();this._pos=Math.max(0,Math.min(this.duration,Number(v)||0));decisions.clear();judgedIds.clear();if(was&&this._pos<this.duration)this.play().catch(e=>{diag.error=String(e)})}
 get volume(){return this._volume}
 set volume(v){this._volume=Math.max(0,Math.min(1,Number(v)||0));if(this._master)this._master.gain.setTargetAtTime(this._volume,ac.currentTime,.008)}
 get playbackRate(){return this._rate}
 set playbackRate(v){const rate=Math.max(.25,Math.min(2,Number(v)||1));if(rate===this._rate)return;const was=!this._paused;this.pause();this._rate=rate;if(was)this.play().catch(e=>{diag.error=String(e)})}
 _disconnect(){
  this._token++;for(const n of this._nodes){try{n.stop()}catch(_){}try{n.disconnect()}catch(_){}}
  this._nodes=[];for(const g of [this._master,this._gate])try{g?.disconnect()}catch(_){}this._master=null;this._gate=null;
 }
 pause(){if(!this._paused)this._pos=this.currentTime;this._paused=true;this._disconnect()}
 async play(){
  if(!this._paused)return;
  if(!data||!buffers)throw Error('V3 audio not loaded');
  initAudio();if(!ac)throw Error('AudioContext unavailable');if(ac.state!=='running')await ac.resume();
  if(this._pos>=this.duration)this._pos=0;
  this._disconnect();this._anchor=ac.currentTime+.035;this._paused=false;
  const token=this._token;
  this._master=ac.createGain();this._master.gain.value=this._volume;this._master.connect(ac.destination);
  this._gate=ac.createGain();this._gate.gain.value=amp(slotAt(this._pos));this._gate.connect(this._master);
  for(let i=0;i<2;i++){
   const n=ac.createBufferSource();n.buffer=buffers[i];n.playbackRate.value=this._rate;n.connect(i?this._gate:this._master);
   this._nodes.push(n);n.start(this._anchor,this._pos);
   if(i===0)n.onended=()=>{if(token===this._token&&!this._paused){this._pos=this.duration;this._paused=true;this._disconnect();if(playing&&audio===this)finishGame()}};
  }
  this.schedule();
 }
 schedule(){
  if(this._paused||!this._gate)return;
  const now=ac.currentTime,t=this.currentTime,idx=slotAt(t),g=this._gate.gain;
  const baseTime=Math.max(now,this._anchor);
  // Rebuild only future gain automation. Consecutive successful slots stay
  // at one level, so the real cymbal/kit tails remain continuous.
  if(typeof g.cancelAndHoldAtTime==='function')g.cancelAndHoldAtTime(baseTime);
  else{const prev=g.value;g.cancelScheduledValues(baseTime);g.setValueAtTime(prev,baseTime)}
  let level=amp(idx);g.linearRampToValueAtTime(level,baseTime+.007);
  for(let i=idx+1;i<data.entries.length;i++){
   const e=data.entries[i];if(e.start>t+.45)break;
   const at=this._anchor+(e.start-this._pos)/this._rate;
   if(at<baseTime+.009)continue;
   const next=amp(i);if(Math.abs(next-level)>.00001){g.setValueAtTime(level,at);g.linearRampToValueAtTime(next,at+.007);level=next}
  }
  diag.clock=t;diag.level=amp(idx);
 }
}
function approve(n,label,auto){
 const e=data?.entries[n.id];if(!e||Math.abs(n.t-e.t)>.004||n.lane!==e.lane){diag.error='V3 chart mismatch';return false}
 const level=label==='BAD'?BASE:1;
 if(!decisions.has(n.id)){decisions.set(n.id,level);diag.scheduled++;return true}
 return false;
}
const engine=window.RhythmDrumV24,oldCan=engine.canStart,oldAudio=engine.gameAudio;
engine.canStart=function(t,auto){
 if(t?.id!==ID)return oldCan(t,auto);
 if(error){alert('V3 드럼 음원 로드 실패. 새로고침 후 다시 실행해 주세요.');return false}
 if(!data){load();alert('V3 드럼 음원을 불러오는 중입니다. 로드 후 다시 시작해 주세요.');return false}
 if(!matches(t)){alert('V3 채보와 음원이 일치하지 않습니다. 새로고침해 주세요.');return false}
 return true
};
engine.gameAudio=function(t,auto){
 if(player)player.pause();
 const other=oldAudio(t,auto);
 if(t?.id!==ID)return other;
 decisions.clear();judgedIds.clear();Object.assign(diag,{auto:0,manual:0,miss:0,scheduled:0,error:'',clock:0,level:BASE});
 player=new DrumClock();return player
};
const prevHit=playHit;playHit=function(sound,kind){if(isV3()&&playing)return;return prevHit(sound,kind)};
const prevSuccess=registerSuccess;
registerSuccess=function(n,delta,auto=false){
 const target=isV3()&&playing&&audio===player,pending=n.state==='pending',label=grade(delta)[0];
 prevSuccess(n,delta,auto);
 if(!target||!pending||n.state!=='done'||judgedIds.has(n.id))return;
 judgedIds.add(n.id);approve(n,label,auto);if(auto)diag.auto++;else diag.manual++;
 player.schedule();
};
const prevMiss=registerMiss;
registerMiss=function(n){
 const target=isV3()&&playing&&audio===player&&n.state==='pending';prevMiss(n);
 if(target&&n.state==='miss'){diag.miss++;decisions.set(n.id,BASE);player.schedule()}
};
const prevProcess=processNotes;
processNotes=function(){
 if(isV3()&&playing&&!paused&&audio===player&&!player.paused&&data){
  let changed=false;
  if(autoplay){const t=player.currentTime;for(const n of notes){
   if(n.state!=='pending'||decisions.has(n.id))continue;const e=data.entries[n.id];if(!e)continue;
   if(e.start>t+.16)break;if(e.end>t)changed=approve(n,'PERFECT',true)||changed;
  }}
  // Maintain a rolling automation horizon even through long gaps/misses.
  if(changed||player.currentTime-(player._lastScheduled||-1)>.10){player._lastScheduled=player.currentTime;player.schedule()}
 }
 return prevProcess()
};
for(const id of ['fxVolume','sfx'])document.getElementById(id)?.addEventListener(id==='sfx'?'change':'input',()=>player?.schedule());
window.addEventListener('pagehide',()=>player?.pause());
window.RhythmDrumV28={ready:()=>!!data,failed:()=>error,map:()=>data,diag,active:()=>isV3()&&audio===player,decision:i=>decisions.get(i),clock:()=>player?.currentTime,graph:()=>player?{sources:player._nodes.length,paused:player.paused,gate:player._gate?.gain.value,anchor:player._anchor}:null};
// Only load on demand/idle so the previous nine songs don't wait on V3.
setTimeout(load,350);
})();
