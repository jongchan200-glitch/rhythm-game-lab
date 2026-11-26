/* V37 premium LP collection; original V36 test ownership key preserved. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),home=$('rhHome'),overlay=$('overlay');if(!home||!overlay)return;
const wallet=window.RhythmCoinV18,KEY='rhythm_lab_music_preview_v36';
const tracks=[
{id:'tonight',game:'tonight_easy_v16',title:'오늘 밤도',theme:'night',hue:'#91b4dd'},
{id:'deathmatch',game:'deathmatch_one_take_v12',title:'데스매치',theme:'battle',hue:'#d9804c'},
{id:'well-lived',game:'well_lived_easy_v19',title:'우리 꽤 잘살았네',theme:'memory',hue:'#e9b768'},
{id:'wings',game:'wings_original_v34',title:'날개를 펴',theme:'wings',hue:'#91c5df'}
].map(t=>({...t,lyricist:'Charles',composer:'Charles',producer:'한울',provider:'사용자 제공',price:500,original:null,lyrics:null}));
const art=t=>'assets/music-v37/'+t.theme+'.webp';
let owned={};try{owned=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
let index=0,mode='store',sound=null,timer=0,previewId=null,gesture=null,suppressUntil=0;
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function button(cls,label,text,fn){const b=el('button',cls,text);b.type='button';b.setAttribute('aria-label',label);if(fn)b.onclick=fn;return b}
function img(src,cls){const i=el('img',cls);i.src=src;i.alt='';i.draggable=false;return i}
const shell=el('section','v37-music');shell.hidden=true;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','음원');
const bg=el('div','v37-bg');bg.setAttribute('aria-hidden','true');shell.append(bg);
const header=el('header','v37-head'),back=button('v37-back','음원 메뉴 닫기','‹',close),heading=el('div','v37-heading');
heading.append(el('small','','HANUL RECORDS'),el('h2','','음원'));
const coins=el('div','v37-coins');coins.append(img('assets/korean-v32/coin.svg'),el('b','','0'));coins.lastChild.setAttribute('data-rh-coin-total','');header.append(back,heading,coins);
const tabs=el('nav','v37-tabs'),store=button('','음원 매장','음원 매장',()=>setMode('store')),library=button('','내 음원','내 음원',()=>setMode('owned'));tabs.append(store,library);
const content=el('main','v37-content'),stage=el('div','v37-stage'),record=button('v37-record','음원 재생 또는 정지','',()=>playPreview());stage.append(record);
const count=el('div','v37-count'),info=el('section','v37-info'),title=el('h3'),credits=el('p','v37-credits','작사 · 작곡 Charles'),producer=el('p','v37-producer','제작 한울');
info.append(title,credits,producer);
const buy=button('v37-buy','구매하기','구매하기',openDetail),note=el('p','v37-note','검수용 가격 · 코인 차감 없음'),empty=el('div','v37-empty');empty.hidden=true;empty.append(el('div','v37-empty-mark','♪'),el('h3','','아직 소장한 음원이 없습니다.'),button('v37-buy','음원 매장으로','음원 매장으로',()=>setMode('store')));
content.append(stage,count,info,buy,note,empty);
const shade=el('div','v37-shade');shade.hidden=true;const detail=el('section','v37-detail');detail.setAttribute('role','dialog');detail.setAttribute('aria-modal','true');detail.setAttribute('aria-label','음원 상세');shade.append(detail);
shell.append(header,tabs,content,shade);home.append(shell);
const entries=()=>mode==='owned'?tracks.filter(t=>owned[t.id]):tracks,selected=()=>entries()[index];
const format=n=>Number(n||0).toLocaleString('ko-KR');
function sync(){coins.lastChild.textContent=format(wallet?.balance?.())}
function stop(){clearTimeout(timer);if(sound){sound.pause();sound.removeAttribute('src');sound.load()}sound=null;previewId=null;record.classList.remove('v37-spinning');record.setAttribute('aria-pressed','false')}
function disk(t){
 const outer=el('div','v37-disc'),grooves=el('div','v37-grooves'),label=el('div','v37-label');
 const cover=img(art(t),'v37-art'),name=el('div','v37-label-title',t.title),rim=el('div','v37-label-rim');
 label.append(cover,name,rim);outer.append(grooves,label);return outer;
}
function draw(direction=0){
 sync();const list=entries(),t=selected(),has=!!t;
 store.setAttribute('aria-pressed',String(mode==='store'));library.setAttribute('aria-pressed',String(mode==='owned'));
 for(const n of [stage,count,info,buy,note])n.hidden=!has;empty.hidden=has;record.replaceChildren();
 if(!has){bg.style.removeProperty('--album-bg');shell.style.removeProperty('--album-accent');return}
 bg.style.setProperty('--album-bg','url("'+art(t)+'")');shell.style.setProperty('--album-accent',t.hue);
 record.append(disk(t));record.setAttribute('aria-label',t.title+' 재생 또는 정지');record.setAttribute('aria-pressed','false');
 count.textContent=String(index+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0');
 title.textContent=t.title;credits.textContent='작사 · 작곡 '+t.composer;producer.textContent='제작 '+t.producer;
 const have=!!owned[t.id];buy.textContent=have?'소장 중 · 상세 보기':'구매하기   '+format(t.price)+' ◉';buy.setAttribute('aria-label',have?'소장 음원 상세 보기':'구매하기 '+t.price+'코인');
 note.textContent=have?'테스트 소장 · 원곡 다운로드 준비 중':'검수용 가격 · 코인 차감 없음';
 if(direction&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&record.animate)record.animate([{opacity:.4,transform:'translateX('+(direction*35)+'px) scale(.96)'},{opacity:1,transform:'translateX(0) scale(1)'}],{duration:240,easing:'cubic-bezier(.2,.8,.25,1)'});
}
function move(d){const l=entries();if(l.length<2)return;stop();index=(index+d+l.length)%l.length;draw(d);playPreview()}
function setMode(m){stop();mode=m;index=0;draw()}
function open(){window.RhythmAlbumPreviewV22?.stop?.();mode='store';index=0;shade.hidden=true;shell.hidden=false;draw();back.focus()}
function close(){stop();shade.hidden=true;shell.hidden=true}
function playPreview(){
 const t=selected();if(!t)return;if(previewId===t.id){stop();return}
 stop();window.RhythmAlbumPreviewV22?.stop?.();
 const track=songs[t.game],src=track?.audio?.src||track?.audioPath;
 if(!src){note.textContent='미리듣기 음원을 불러올 수 없습니다.';return}
 const a=new Audio(src);sound=a;previewId=t.id;a.playsInline=true;a.preload='auto';a.volume=Math.min(.75,Math.max(0,Number($('songVolume')?.value??78)/100));
 a.addEventListener('ended',()=>{if(sound===a)stop()},{once:true});
 Promise.resolve(a.play()).then(()=>{if(sound!==a)return;record.classList.add('v37-spinning');record.setAttribute('aria-pressed','true');timer=setTimeout(()=>{if(sound===a)stop()},22000)}).catch(()=>{if(sound===a){stop();note.textContent='레코드판을 눌러 음악을 재생해 주세요.'}});
}
function openDetail(){
 const t=selected();if(!t)return;
 detail.replaceChildren();detail.style.setProperty('--detail-bg','url("'+art(t)+'")');
 const x=button('v37-x','상세 닫기','×',()=>shade.hidden=true),cover=el('div','v37-detail-cover');cover.append(img(art(t)),el('span','v37-cover-mark','HANUL RECORDS'));
 detail.append(x,cover,el('h3','',t.title),el('p','v37-detail-credit','작사 · 작곡 Charles  |  제작 한울'));
 detail.append(el('p','v37-detail-note','원곡 MP3 · 등록 준비 중'));
 if(owned[t.id]){
  const dl=button('v37-buy','원곡 다운로드 준비 중','MP3 다운로드 · 준비 중');dl.disabled=true;detail.append(dl,el('p','v37-detail-note','테스트 소장 완료 · 실제 구매 아님'));
 }else{
  const b=button('v37-buy','검수용 구매','검수용 구매   '+format(t.price)+' ◉',()=>{
   const next={...owned,[t.id]:true};try{localStorage.setItem(KEY,JSON.stringify(next));owned=next}catch(e){note.textContent='소장 상태를 저장하지 못했습니다.';return}
   stop();shade.hidden=true;draw();
  });detail.append(b,el('p','v37-detail-note','임시 가격 · 실제 코인 차감 없음'));
 }
 shade.hidden=false;x.focus();
}
// Pointer capture keeps a horizontal swipe alive even outside the disc.
stage.addEventListener('pointerdown',e=>{if(!e.isPrimary)return;gesture={x:e.clientX,y:e.clientY,id:e.pointerId};try{stage.setPointerCapture(e.pointerId)}catch(_){}},{passive:true});
stage.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.2){suppressUntil=performance.now()+400;move(dx<0?1:-1)}else if(Math.abs(dx)<12&&Math.abs(dy)<12){suppressUntil=performance.now()+350;playPreview()}},{passive:true});
stage.addEventListener('pointercancel',()=>gesture=null);
stage.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
shade.addEventListener('click',e=>{if(e.target===shade)shade.hidden=true});
shell.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();if(!shade.hidden)shade.hidden=true;else close()}else if(shade.hidden&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}});
for(const b of home.querySelectorAll('[data-rh-panel="character"]')){
 b.dataset.rhPanel='music';b.setAttribute('aria-label','음원');b.replaceChildren(img('assets/music-v36/menu.svg','k32-icon'),el('span','','음원'));
}
home.addEventListener('click',e=>{if(e.target.closest('[data-rh-panel="music"]')){e.preventDefault();e.stopImmediatePropagation();open()}},true);
new MutationObserver(()=>{if(overlay.hidden)close()}).observe(overlay,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);
window.RhythmMusicV37={version:37,tracks:tracks.map(t=>({...t})),snapshot:()=>({...owned}),previewId:()=>previewId,selectedId:()=>selected()?.id||null};
})();