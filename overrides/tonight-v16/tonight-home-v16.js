/* V16: genuine playable HARD home, preserving two smartphone pages and fixed footer.
   HARD is unlocked ONLY for the active development preview; score & audio reuse
   the original engine via the existing catalog buttons. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const hard=$('rhHardPage'), easy=$('rhEasyPage'),disc=$('rhHardDiscZone');
 if(!hard||!easy||!disc||!$('rhHardPlay'))return;
 const tracks=()=>[...document.querySelectorAll('#catalog .songBtn:not([disabled])')].filter(b=>{
   const stars=(b.querySelector('small')?.textContent||'').match(/★+/)?.[0]?.length||0;
   return stars>=4&&stars<=5;
 }).sort((a,b)=>{
   const va=a.dataset.song==='tonight_hard_v16'?0:1;
   const vb=b.dataset.song==='tonight_hard_v16'?0:1;
   return va-vb;
 });
 const names={tonight_hard_v16:'오늘밤도',moonlight_epic_rock_v2_5:'월광 소나타'};
 const credits={tonight_hard_v16:'<span>작사·작곡 <b>챨스</b></span><span>제작 <b>한울</b></span>',moonlight_epic_rock_v2_5:'<span>원작곡 <b>L. van Beethoven</b></span><span>제작 <b>한울</b></span>'};
 let hardIndex=0,lastEasy='deathmatch_one_take_v12';
 const stats=()=>{try{return JSON.parse(localStorage.getItem('moonlight_demo_records_v1')||'{}')}catch{return {}}};
 function render(){
   const list=tracks(),b=list[hardIndex%Math.max(1,list.length)];
   if(!b){$('rhHardTitle').textContent='곡 준비 중';$('rhHardPlay').disabled=true;return}
   hardIndex=hardIndex%list.length;
   const id=b.dataset.song,s=b.querySelector('small')?.textContent||'';
   $('rhHardTitle').textContent=names[id]||b.querySelector('strong')?.textContent||'HARD';
   $('rhHardStars').textContent=s.match(/★+/)?.[0]||'★★★★★';
   $('rhHardPosition').textContent=`HARD · ${String(hardIndex+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;
   $('rhHardInfo').textContent=id==='tonight_hard_v16'?'후렴 · 1분 07초 · HARD':'HARD · CLASSIC REMIX';
   $('rhHardCredits').innerHTML=credits[id]||'<span>제작 <b>한울</b></span>';
   $('rhHardPlay').disabled=false;
   const r=stats()[id]||{};
   $('rhHardBest').textContent=r.count?Number(r.best||0).toLocaleString('ko-KR'):'—';
   $('rhHardCombo').textContent=r.count?Number(r.maxCombo||0).toLocaleString('ko-KR'):'—';
   $('rhHardPlays').textContent=Number(r.count||0).toLocaleString('ko-KR');
   disc.dataset.song=id;
   disc.classList.toggle('rh-hard-moonlight',id.includes('moonlight'));
 }
 function activeTrack(){const b=tracks()[hardIndex];if(!b)return false;b.click();return true}
 function stopPreview(){
   if(typeof audio!=='undefined'&&audio&&!audio.paused&&!playing)audio.pause();
   if($('previewPlay'))$('previewPlay').textContent='▶ 음악 미리듣기';
   $('rhHardPreview').textContent='♫ 곡 미리듣기';disc.classList.remove('rh-hard-spin');
 }
 function changeHard(delta){stopPreview();const z=tracks();if(!z.length)return;hardIndex=(hardIndex+delta+z.length)%z.length;render();}
 // A drag starting on the CD changes HARD tracks only, never the surrounding home page.
 // Prevent propagation of pointerdown to the page's existing, separate swipe handler.
 let start=null;
 disc.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={id:e.pointerId,x:e.clientX,y:e.clientY};e.stopPropagation();try{disc.setPointerCapture(e.pointerId)}catch(_){}});
 disc.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x;
   disc.style.setProperty('--rh-hard-drag',Math.max(-40,Math.min(40,dx*.19))+'px');e.stopPropagation();});
 disc.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
   disc.style.removeProperty('--rh-hard-drag');e.stopPropagation();if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)changeHard(dx<0?1:-1);});
 disc.addEventListener('pointercancel',e=>{start=null;disc.style.removeProperty('--rh-hard-drag');e.stopPropagation()});
 disc.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();changeHard(e.key==='ArrowLeft'?-1:1)}});
 $('rhHardPlay').addEventListener('click',()=>{stopPreview();if(activeTrack()){$('auto').checked=false;$('start').click()}});
 $('rhHardDemo').addEventListener('click',()=>{stopPreview();if(activeTrack())$('autoDemo').click()});
 $('rhHardPreview').addEventListener('click',()=>{
   if(!activeTrack())return;
   $('previewPlay').click();const active=$('previewPlay').textContent.includes('일시정지');
   $('rhHardPreview').textContent=active?'Ⅱ 미리듣기 멈추기':'♫ 곡 미리듣기';disc.classList.toggle('rh-hard-spin',active);
 });
 // Preserve the last EASY record selection while switching whole screens.
 // The V14 closure intentionally does not auto-select EASY during HARD page presence.
 new MutationObserver(()=>{
   if(hard.getAttribute('aria-hidden')==='false'){
     const selected=document.querySelector('#catalog .songBtn.selected');
     if(selected&&selected.dataset.song!=='tonight_hard_v16'&&selected.dataset.song!=='moonlight_epic_rock_v2_5')lastEasy=selected.dataset.song;
     render();
   }else{
     stopPreview();const old=document.querySelector('#catalog .songBtn.selected');
     if(old&&/★{4,5}/.test(old.querySelector('small')?.textContent||'')){
       const restore=document.querySelector(`#catalog .songBtn[data-song="${lastEasy}"]`);
       if(restore&&!restore.disabled)restore.click();
     }
   }
 }).observe(hard,{attributes:true,attributeFilter:['aria-hidden']});
 new MutationObserver(()=>{if(!document.querySelector('#rhHome')?.closest('#overlay')?.hidden)render()}).observe($('overlay'),{attributes:true,attributeFilter:['hidden']});
 let tries=0;const ready=()=>{if(tracks().length){render();return}if(++tries<80)requestAnimationFrame(ready)};ready();
 window.RhythmHomeV16={hardTracks:tracks,renderHard:render,hardAlbum:()=>tracks()[hardIndex]?.dataset.song||null};
})();
