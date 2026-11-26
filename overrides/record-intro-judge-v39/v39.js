/* V39: permanent equipment, song-and-difficulty-specific record celebration. */
(()=>{
'use strict';
const STORAGE='rhythm_lab_inventory_v33';
function multiplier(){
 try{
  const x=JSON.parse(localStorage.getItem(STORAGE)||'{}');
  const slots=Array.isArray(x.slots)?x.slots:[];
  if(slots.includes('judge3')&&Number(x.owned?.judge3)>0)return 3;
  if(slots.includes('judge2')&&Number(x.owned?.judge2)>0)return 2;
 }catch(e){console.warn('V39 equipment storage unavailable',e)}
 return 1;
}
window.RhythmJudgementV39={multiplier};
const field=document.getElementById('field');
if(!field||typeof finishGame!=='function'||typeof initGame!=='function')return;
const effect=document.createElement('div');
effect.className='v39-record-fx';effect.hidden=true;effect.setAttribute('aria-live','polite');
effect.innerHTML='<div class="v39-record-glow"></div><div class="v39-record-sparks"></div><div class="v39-record-heading"></div><div class="v39-record-number"></div>';
field.append(effect);
let baseline=null,celebrating=false;
const records=()=>{try{return JSON.parse(localStorage.getItem('moonlight_demo_records_v1')||'{}')}catch{return {}}};
const originalInit=initGame;
initGame=function(...args){
 const id=current?.id;
 const r=records()[id]||{};
 baseline={id,best:Number(r.best)||0,combo:Number(r.maxCombo)||0};
 effect.hidden=true;celebrating=false;
 return originalInit.apply(this,args);
};
const originalFinish=finishGame;
finishGame=function(...args){
 if(celebrating)return;
 if(!playing||autoplay||!current||!baseline||baseline.id!==current.id)return originalFinish.apply(this,args);
 const wins=[];
 if(maxCombo>baseline.combo)wins.push(['NEW BEST COMBO!',maxCombo.toLocaleString('ko-KR')+' COMBO']);
 const master=misses===0&&goods===0&&greats===0&&perfects===notes.length;
 const finalScore=Math.min(current.base,Math.round(score))+(master?3000:0);
 if(finalScore>baseline.best)wins.push(['NEW HIGH SCORE!',finalScore.toLocaleString('ko-KR')]);
 if(!wins.length)return originalFinish.apply(this,args);
 celebrating=true;playing=false;paused=true;
 const savedArgs=args;
 let index=0;
 function showNext(){
  if(index>=wins.length){
   effect.hidden=true;celebrating=false;playing=true;paused=false;
   return originalFinish.apply(null,savedArgs);
  }
  const [heading,number]=wins[index++];
  effect.querySelector('.v39-record-heading').textContent=heading;
  effect.querySelector('.v39-record-number').textContent=number;
  effect.dataset.mode=heading.includes('COMBO')?'combo':'score';
  effect.hidden=false;effect.classList.remove('v39-burst');
  void effect.offsetWidth;effect.classList.add('v39-burst');
  setTimeout(showNext,1450);
 }
 showNext();
};
})();
