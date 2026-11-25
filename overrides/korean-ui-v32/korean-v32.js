/* V32 live title sizing, original album and page swipe retained. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('rhHome');if(!home)return;
for(const btn of home.querySelectorAll('.rh-nav button')){
 const img=document.createElement('img');img.className='k32-icon';img.alt='';img.src='assets/korean-v32/'+btn.dataset.rhPanel+(btn.dataset.rhPanel==='character'?'.webp':'.svg');
 btn.querySelector('svg')?.replaceWith(img);
}
for(const el of home.querySelectorAll('.rh-stats .rh-stat small'))el.textContent=({'BEST SCORE':'최고 점수','MAX COMBO':'최대 콤보','PLAY COUNT':'플레이 횟수'})[el.textContent]||el.textContent;
for(const [zoneId,discSel,labelSel,titleId,indexId,side] of [
 ['rhRecordZone','#rhVinyl','.rh-vinyl-label','rhSongTitle','rhPosition',0],
 ['rhHardDiscZone','.rh-compact-disc','.rh-cd-printed','rhHardTitle','rhHardPosition',1]
]){
 const zone=$(zoneId),disc=zone?.querySelector(discSel),label=zone?.querySelector(labelSel),title=$(titleId),position=$(indexId);
 if(!zone||!disc||!label||!title||!position)continue;
 const index=document.createElement('span');index.className='k32-index';label.append(index);
 let raf=0;
 function fit(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
  const w=label.clientWidth;if(w<=0)return;
  index.textContent=position.textContent.replace(/EASY|HARD/,'').replace(/^\s*[·•]\s*/,'').trim();
  const count=[...title.textContent].length;let size=Math.max(10,Math.min(27,w/(count>12?6.8:count>7?5.6:4.5)));
  title.style.fontSize=size+'px';
  for(let k=0;k<12&&size>10&&(title.scrollWidth>title.clientWidth+1||title.offsetHeight>label.clientHeight*.44);k++){size-=.7;title.style.fontSize=size+'px'}
 })} 
 new MutationObserver(fit).observe(title,{childList:true,subtree:true,characterData:true});
 new MutationObserver(fit).observe(position,{childList:true,subtree:true,characterData:true});
 new ResizeObserver(fit).observe(label);fit();
 // A stationary click on the disc toggles the existing album preview; swipes
 // remain song changes. No status button/text on the home screen.
 let down=null;
 zone.addEventListener('pointerdown',e=>{down={id:e.pointerId,x:e.clientX,y:e.clientY}},{passive:true});
 zone.addEventListener('pointerup',e=>{
  if(down&&down.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<9){
   const id=side?zone.dataset.song:disc.dataset.song;if(id)window.RhythmAlbumPreviewV22?.toggle(id);
  }down=null;
 },{passive:true});
 zone.addEventListener('pointercancel',()=>down=null);
 const brand=zone.closest('.rh-home-page').querySelector('.rh-brand');brand.tabIndex=0;brand.setAttribute('aria-label',side?'HARD · 왼쪽 화살표로 일반 모드':'일반 · 오른쪽 화살표로 HARD 모드');
 brand.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();window.RhythmHomeV23Page?.(e.key==='ArrowRight'?1:0)}});
}
document.querySelector('.head .brand strong')?.replaceChildren('RHYTHM LAB');
const brand=document.querySelector('.head .brand strong');if(brand)new MutationObserver(()=>{if(brand.textContent!=='RHYTHM LAB')brand.textContent='RHYTHM LAB'}).observe(brand,{childList:true,subtree:true,characterData:true});
for(let i=0;i<buttons.length;i++){buttons[i].querySelector('.keyname').textContent=['M',',','.','/'][i]}
window.RhythmSkinV32={version:32};
})();