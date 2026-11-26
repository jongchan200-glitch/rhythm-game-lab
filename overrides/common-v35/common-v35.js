/* V35: full original mixes, quiet common tap, graded haptics, temporary fullscreen. */
(()=>{
'use strict';
const home=document.getElementById('rhHome');
if(!home)return;
const engine=window.RhythmDrumV24;
if(!engine)throw Error('V35 missing existing audio engine');
window.RhythmV35Active=true;
let inJudge=0;
const durations=Object.freeze({PERFECT:100,GREAT:50,GOOD:20,BAD:10,MISS:0});
const diag={hits:0,vibrations:0,lastPeak:0,lastVibration:0,route:''};
// Bypass the legacy interactive stem banks for every song, including V2/V3/HARD.
// Keep the original audio element, timing, chart, records and score.
engine.canStart=()=>true;
engine.gameAudio=function(track){
 engine.stop?.();
 diag.route=track.id;
 return track.audio;
};
function quietHit(){
 if(inJudge||!fxEnabled||!(fxVol>0))return;
 try{
  initAudio();
  if(!ac||ac.state!=='running')return;
  const peak=.010*Math.min(1,Math.max(0,Number(fxVol)||0));
  if(!peak)return;
  const t=ac.currentTime,osc=ac.createOscillator(),g=ac.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(420,t);
  g.gain.setValueAtTime(.00001,t);
  g.gain.linearRampToValueAtTime(peak,t+.003);
  g.gain.exponentialRampToValueAtTime(.00001,t+.036);
  osc.connect(g);g.connect(ac.destination);
  osc.onended=()=>{osc.disconnect();g.disconnect()};
  osc.start(t);osc.stop(t+.040);
  diag.hits++;diag.lastPeak=peak;
 }catch(e){console.warn('V35 quiet hit',e)}
}
playHit=quietHit;
const oldSuccess=registerSuccess;
registerSuccess=function(n,delta,auto=false){
 const pending=n.state==='pending',label=grade(delta)[0];
 let result;
 inJudge++;
 try{result=oldSuccess(n,delta,auto)}finally{inJudge--}
 if(!pending||n.state!=='done'||!Object.prototype.hasOwnProperty.call(durations,label)||label==='MISS')return result;
 if(n.kind!=='release')quietHit();
 if(!auto&&!autoplay&&hapticEnabled&&typeof navigator.vibrate==='function'){
  const ms=durations[label];
  if(ms){navigator.vibrate(ms);diag.vibrations++;diag.lastVibration=ms}
 }
 return result;
};
const root=document.documentElement;
const enter=root.requestFullscreen||root.webkitRequestFullscreen;
const leave=document.exitFullscreen||document.webkitExitFullscreen;
const active=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement);
const switches=[];
function sync(){
 const on=active();
 for(const b of switches){b.setAttribute('aria-checked',String(on));b.title=on?'전체 화면 종료':'테스트용 전체 화면'}
}
async function toggle(){
 try{
  if(active()){if(!leave)throw Error('fullscreen exit unavailable');await leave.call(document)}
  else{if(!enter||document.fullscreenEnabled===false)throw Error('fullscreen unavailable');await enter.call(root,{navigationUI:'hide'})}
 }catch(e){console.warn('V35 fullscreen',e);window.alert('이 브라우저에서는 전체 화면을 사용할 수 없습니다. Chrome 또는 삼성 인터넷에서 게임 주소를 직접 열어 주세요.')}
 sync();
}
for(const page of home.querySelectorAll('.rh-home-page')){
 const head=page.querySelector('.rh-head');if(!head)continue;
 const b=document.createElement('button');b.type='button';b.className='v35-fullscreen';
 b.setAttribute('role','switch');b.setAttribute('aria-label','전체 화면 테스트');b.setAttribute('aria-checked','false');
 const text=document.createElement('span');text.textContent='전체 화면';
 const track=document.createElement('span');track.className='v35-track';track.setAttribute('aria-hidden','true');
 b.append(text,track);b.addEventListener('click',toggle);
 // The open space between the existing profile and coin wallet.
 const wallet=head.querySelector('.rh-wallet');
 if(wallet?.parentElement===head)head.insertBefore(b,wallet);else head.append(b);
 switches.push(b);
}
for(const event of ['fullscreenchange','webkitfullscreenchange','fullscreenerror'])document.addEventListener(event,sync);
sync();
window.RhythmV35={version:35,durations,diag};
})();