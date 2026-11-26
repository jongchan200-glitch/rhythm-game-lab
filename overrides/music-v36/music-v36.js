/* V36 independent music library. Four unique user songs, no classical sales. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),home=$('rhHome'),overlay=$('overlay');if(!home||!overlay)return;
const wallet=window.RhythmCoinV18,KEY='rhythm_lab_music_preview_v36';
const tracks=[
 {id:'tonight',game:'tonight_easy_v16',title:'오늘 밤도',en:'ANOTHER NIGHT',lyricist:'챨스',composer:'챨스',producer:'한울',provider:'사용자 제공',theme:'night'},
 {id:'deathmatch',game:'deathmatch_one_take_v12',title:'데스매치',en:'DEATH MATCH',provider:'사용자 제공',theme:'battle'},
 {id:'well-lived',game:'well_lived_easy_v19',title:'우리 꽤 잘살았네',en:'A LIFE WELL LIVED',producer:'한울',provider:'사용자 제공',theme:'memory'},
 {id:'wings',game:'wings_original_v34',title:'날개를 펴',en:'SPREAD YOUR WINGS',producer:'한울',provider:'사용자 제공',theme:'wings'}
].map(t=>({...t,price:500,original:null,lyrics:null,arranger:null}));
const art=t=>'assets/music-v36/'+t.theme+'.svg';
let owned={};try{owned=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
let index=0,mode='store',sound=null,timer=0,previewId=null;
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function button(cls,label,text,fn){const b=el('button',cls,text);b.type='button';b.setAttribute('aria-label',label);if(fn)b.onclick=fn;return b}
function img(src,cls){const i=el('img',cls);i.src=src;i.alt='';i.draggable=false;return i}
const shell=el('section','v36-music');shell.hidden=true;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','음원');
const header=el('header','v36-head'),back=button('v36-back','음원 메뉴 닫기','‹',close);
const ht=el('div','v36-heading');ht.append(el('small','','RHYTHM LAB  /  RECORDS'),el('h2','','음원'));
const coins=el('div','v36-coins');coins.append(img('assets/korean-v32/coin.svg'),el('b','','0'));coins.lastChild.setAttribute('data-rh-coin-total','');header.append(back,ht,coins);
const tabs=el('div','v36-tabs'),store=button('','음원 매장','음원 매장',()=>setMode('store')),library=button('','내 음원','내 음원',()=>setMode('owned'));tabs.append(store,library);
const section=el('div','v36-content'),mast=el('div','v36-mast');mast.append(el('span','','ORIGINAL COLLECTION'),el('span','v36-index','01 / 04'));
const stage=el('div','v36-stage'),left=button('v36-arrow','이전 음원','‹',()=>move(-1)),right=button('v36-arrow','다음 음원','›',()=>move(1));
const record=button('v36-record','음원 상세 보기','',()=>openDetail());stage.append(left,record,right);
const rail=el('div','v36-rail'),info=el('section','v36-info'),actions=el('div','v36-actions'),notice=el('p','v36-notice','검수용 음원 매장 · 원곡 MP3 등록 전');
const preview=button('v36-preview','미리듣기','▷ 미리듣기',()=>playPreview()),buy=button('v36-buy','구매하기','구매하기',()=>openDetail());actions.append(preview,buy);
const empty=el('div','v36-empty','아직 소장한 음원이 없습니다.');empty.hidden=true;
section.append(mast,stage,rail,info,actions,empty,notice);
const shade=el('div','v36-shade');shade.hidden=true;const detail=el('section','v36-detail');detail.setAttribute('role','dialog');detail.setAttribute('aria-label','음원 상세');shade.append(detail);
shell.append(header,tabs,section,shade);home.append(shell);
const entries=()=>mode==='owned'?tracks.filter(t=>owned[t.id]):tracks;
const selected=()=>entries()[index];
function format(n){return Number(n||0).toLocaleString('ko-KR')}
function sync(){coins.lastChild.textContent=format(wallet?.balance?.())}
function stop(){clearTimeout(timer);if(sound){sound.pause();sound.removeAttribute('src');sound.load()}sound=null;previewId=null;preview.textContent='▷ 미리듣기';record.classList.remove('v36-spinning')}
function makeRecord(t,mini=false){
 const disk=el('div','v36-disc'),label=el('div','v36-label');label.append(img(art(t)),el('span','v36-label-title',t.title));disk.append(label);return disk;
}
function meta(t){
 const box=el('dl','v36-meta');
 for(const [key,val] of [['작사',t.lyricist],['작곡',t.composer],['편곡',t.arranger],['제작',t.producer],['음원 제공',t.provider]]){
  box.append(el('dt','',key),el('dd','',val||'확인 예정'))
 }
 return box;
}
function draw(){
 sync();const list=entries(),t=selected(),has=!!t;
 store.setAttribute('aria-pressed',String(mode==='store'));library.setAttribute('aria-pressed',String(mode==='owned'));
 for(const n of [mast,stage,rail,info,actions])n.hidden=!has;empty.hidden=has;rail.replaceChildren();info.replaceChildren();record.replaceChildren();
 if(!has)return;
 mast.lastChild.textContent=String(index+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0');
 record.append(makeRecord(t));record.setAttribute('aria-label',t.title+' 음원 상세 보기');
 list.forEach((x,i)=>{const b=button('v36-thumb',x.title,'',()=>select(i));b.dataset.album=x.id;b.setAttribute('aria-pressed',String(i===index));b.append(makeRecord(x,true));rail.append(b)});
 info.append(el('h3','',t.title),el('p','v36-en',t.en),meta(t));
 const ownedNow=!!owned[t.id];buy.textContent=ownedNow?'소장 중 · 상세 보기':'구매하기  ·  '+format(t.price)+' ◉';
 buy.setAttribute('aria-label',ownedNow?'소장 음원 상세 보기':'구매하기 '+t.price+'코인');
 notice.textContent='검수용 가격 · '+(ownedNow?'테스트 소장 상태':'원곡 MP3 등록 전 · 코인 차감 없음');
 left.disabled=right.disabled=list.length<2;
}
function select(i){stop();index=i;draw()}
function move(d){const l=entries();if(l.length)select((index+d+l.length)%l.length)}
function setMode(m){stop();mode=m;index=0;draw()}
function open(){window.RhythmAlbumPreviewV22?.stop?.();mode='store';index=0;shade.hidden=true;shell.hidden=false;draw();back.focus()}
function close(){stop();shade.hidden=true;shell.hidden=true}
function playPreview(){
 const t=selected();if(!t)return;if(previewId===t.id){stop();return}
 stop();window.RhythmAlbumPreviewV22?.stop?.();
 const track=songs[t.game],src=track?.audio?.src||track?.audioPath;
 if(!src){notice.textContent='미리듣기 음원을 불러올 수 없습니다.';return}
 const a=new Audio(src);sound=a;previewId=t.id;a.playsInline=true;a.preload='auto';a.volume=Math.min(.75,Math.max(0,Number($('songVolume')?.value??78)/100));
 a.addEventListener('ended',()=>{if(sound===a)stop()},{once:true});
 Promise.resolve(a.play()).then(()=>{if(sound!==a)return;preview.textContent='Ⅱ 미리듣기 중';record.classList.add('v36-spinning');timer=setTimeout(()=>{if(sound===a)stop()},22000)}).catch(()=>{if(sound===a){stop();notice.textContent='미리듣기를 다시 눌러 주세요.'}});
}
function openDetail(){
 const t=selected();if(!t)return;
 detail.replaceChildren();const x=button('v36-x','상세 닫기','×',()=>shade.hidden=true);
 const cover=img(art(t),'v36-detail-art');detail.append(x,cover,el('h3','',t.title),el('p','v36-en',t.en),meta(t));
 detail.append(el('p','v36-detail-note','현재는 게임용 음원 미리듣기입니다. 전체 원곡 MP3 및 가사 등록 후 정식 판매합니다.'));
 if(owned[t.id]){
  const dl=button('v36-buy','원곡 다운로드 준비 중','MP3 다운로드 · 준비 중');dl.disabled=true;detail.append(dl,el('p','v36-detail-note','테스트 소장 완료 · 실제 구매 아님'));
 }else{
  const b=button('v36-buy','검수용 구매','검수용 구매  ·  '+format(t.price)+' ◉',()=>{
   const next={...owned,[t.id]:true};try{localStorage.setItem(KEY,JSON.stringify(next));owned=next}catch(e){notice.textContent='소장 상태를 저장하지 못했습니다.';return}
   shade.hidden=true;draw();
  });
  detail.append(b,el('p','v36-detail-note','가격은 임시입니다. 검수용 구매는 실제 코인을 차감하지 않습니다.'));
 }
 shade.hidden=false;x.focus();
}
let down=null;
stage.addEventListener('pointerdown',e=>{if(e.target.closest('.v36-arrow'))return;down={x:e.clientX,y:e.clientY,id:e.pointerId}},{passive:true});
let suppressUntil=0;
stage.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;down=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){suppressUntil=performance.now()+350;move(dx<0?1:-1)}},{passive:true});
stage.addEventListener('pointercancel',()=>down=null);
stage.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
shade.addEventListener('click',e=>{if(e.target===shade)shade.hidden=true});
shell.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();if(!shade.hidden)shade.hidden=true;else close()}else if(shade.hidden&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}});
for(const b of home.querySelectorAll('[data-rh-panel="character"]')){
 b.dataset.rhPanel='music';b.setAttribute('aria-label','음원');const icon=img('assets/music-v36/menu.svg','k32-icon');b.replaceChildren(icon,el('span','','음원'));
}
home.addEventListener('click',e=>{if(e.target.closest('[data-rh-panel="music"]')){e.preventDefault();e.stopImmediatePropagation();open()}},true);
new MutationObserver(()=>{if(overlay.hidden)close()}).observe(overlay,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);
window.RhythmMusicV36={version:36,tracks:tracks.map(t=>({...t})),snapshot:()=>({...owned}),previewId:()=>previewId};
})();