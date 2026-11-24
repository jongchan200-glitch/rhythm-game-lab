/* V23 UI bridges existing controls, no parallel catalog, scores, coins or game input. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),home=$('rhHome'),drawer=$('rhDrawerBackdrop');
if(!home||!drawer)return;
const add=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e};
for(const [pageId,titleId] of [['rhEasyPage','rhSongTitle'],['rhHardPage','rhHardTitle']]){
 const page=$(pageId),title=$(titleId);if(!page||!title)continue;
 const info=page.querySelector('.rh-record-info'),name=add('div','v23-title',title.textContent);
 if(info){info.insertBefore(name,info.children[1]||null);new MutationObserver(()=>{name.textContent=title.textContent}).observe(title,{subtree:true,childList:true,characterData:true})}
 const mode=add('div','v23-mode');mode.setAttribute('aria-label','난이도 선택');
 ['EASY','HARD'].forEach((label,i)=>{const b=add('button','',label);b.type='button';b.setAttribute('aria-pressed',String((pageId==='rhHardPage'?1:0)===i));b.addEventListener('click',()=>window.RhythmHomeV23Page?.(i));mode.append(b)});
 page.querySelector('.rh-brand')?.append(mode);
}
const foot=add('div','v23-drawer-footer'),done=add('button','v23-done','완료');done.type='button';done.addEventListener('click',()=>$('rhClose').click());foot.append(done);drawer.querySelector('.rh-drawer').append(foot);
$('rhClose').textContent='‹';$('rhClose').setAttribute('aria-label','뒤로 가기');
function fill(el){if(!el||el.type!=='range')return;el.style.setProperty('--v23-fill',((Number(el.value)-Number(el.min))/(Number(el.max)-Number(el.min))*100)+'%')}
const saveKey='rhythm_lab_audio_settings_v23';
const controls=[['fxVolume','input'],['songVolume','input'],['sfx','change'],['haptic','change'],['offset','input'],['rateSelect','change']];
function save(){try{localStorage.setItem(saveKey,JSON.stringify(Object.fromEntries(controls.map(([id])=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]))))}catch(e){console.warn('V23 settings save',e)}}
function restore(){try{const s=JSON.parse(localStorage.getItem(saveKey)||'null');if(!s)return;for(const [id,event] of controls){const el=$(id);if(!el||!(id in s))continue;if(el.type==='checkbox')el.checked=!!s[id];else el.value=s[id];el.dispatchEvent(new Event(event,{bubbles:true}))}}catch(e){console.warn('V23 settings restore',e)}}
for(const [id,event] of controls)$(id)?.addEventListener(event,save);
let restoring=false;
function restoreSafe(){const raw=localStorage.getItem(saveKey);if(!raw)return;restoring=true;restore();restoring=false;localStorage.setItem(saveKey,raw)}
// Catalog boot sets audio asynchronously, so restore only after it is available.
function wait(){if(typeof audio!=='undefined'&&audio){try{restoreSafe()}catch(e){console.warn(e)}return}setTimeout(wait,100)}wait();
function enhance(){
 if(drawer.hidden)return;const body=$('rhDrawerBody');const setting=!!$('rhFxVolume');
 done.textContent=setting?'설정 완료':'돌아가기';
 body.querySelectorAll('input[type=range]').forEach(el=>{fill(el);if(!el.dataset.v23){el.dataset.v23='1';el.addEventListener('input',()=>fill(el))}});
 if(!setting||$('v23SoundTest'))return;
 const card=$('rhFxVolume').closest('.rh-info-card'),test=add('button','rh-action','♫  타격음 시험 재생'),status=add('div','v23-sound-status','음악과 별개로 3개의 음을 시험합니다.');
 test.id='v23SoundTest';test.type='button';status.setAttribute('role','status');
 test.addEventListener('click',async()=>{
   try{window.RhythmAlbumPreviewV22?.stop?.();if(typeof fxEnabled==='undefined'||!fxEnabled){status.textContent='타격음 켜기를 활성화해 주세요.';return}if(fxVol<=0){status.textContent='타격음 볼륨을 올려 주세요.';return}
   initAudio();if(!ac){status.textContent='이 브라우저에서는 오디오 엔진을 사용할 수 없습니다.';return}
   await ac.resume();if(ac.state!=='running')throw Error('AudioContext '+ac.state);
   const before=window.RhythmHitV23?.count||0;
   [60,64,67].forEach((m,i)=>setTimeout(()=>{playHit({instrument:'piano',midi:m,velocity:.8,length:.29},'tap');if(i===2){status.textContent=(window.RhythmHitV23?.count||0)>before?'시험음 출력 요청 완료 · '+Math.round(fxVol*100)+'%':'시험음 출력 실패 · '+(window.RhythmHitV23?.error||'확인 필요')}},i*180));
   }catch(e){status.textContent='오디오 재생 실패 · '+e.message;console.warn(e)}
 });
 card.append(test,status);
}
new MutationObserver(enhance).observe(drawer,{attributes:true,attributeFilter:['hidden']});
new MutationObserver(enhance).observe($('rhDrawerBody'),{childList:true});
window.RhythmUIV23={enhance};enhance();
})();
