/* V33: icon-only shop, real local wallet transactions and equipment UI.
   Effects/prices are review-stage proposals; no scoring or consumption hooks. */
(()=>{
'use strict';
const $=id=>document.getElementById(id), home=$('rhHome'), overlay=$('overlay');
if(!home||!overlay||!window.RhythmCoinV18)return;
const KEY='rhythm_lab_inventory_v33';
const items=[
 ['coin2','엽전 ×2',30,'한 판 동안 획득 코인 2배.'],
 ['coin4','엽전 ×4',90,'한 판 동안 획득 코인 4배.'],
 ['coin8','엽전 ×8',220,'한 판 동안 획득 코인 8배.'],
 ['drink30','에너지 드링크',15,'에너지 30% 회복.'],
 ['drink50','파워 드링크',30,'에너지 50% 회복.'],
 ['drink100','활력 드링크',60,'에너지 100% 회복.'],
 ['continue','이어하기',30,'게임오버 시 한 번 이어하기.'],
 ['guard','실수 방어',20,'BAD/MISS 발생 시 에너지 차감 방어.'],
 ['combo','콤보 보호',20,'콤보가 끊길 때 보호.'],
 ['expand','슬롯 확장',500,'장착칸을 한 개 영구 개방. 최대 4칸.'],
 ['skin-note','노트 스킨',200,'낙하 노트 외형 변경.'],
 ['skin-key','건반 스킨',200,'하단 터치판 외형 변경.'],
 ['skin-bg','배경 스킨',300,'플레이 배경 변경.'],
 ['skin-theme','테마 스킨',400,'게임 UI 테마 변경.'],
 ['skin-hit','노트 이펙트',200,'타격 효과 변경.'],
 ['skin-judge','판정 이펙트',200,'판정 효과 변경.']
].map(([id,name,price,desc])=>({id,name,price,desc,skin:id.startsWith('skin-'),expand:id==='expand'}));
const byId=Object.fromEntries(items.map(x=>[x.id,x]));
function load(){
 let r;try{r=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
 let capacity=Math.min(4,Math.max(2,Math.floor(Number(r?.capacity)||2))), owned={};
 for(const x of items){if(x.expand)continue;const n=Math.max(0,Math.floor(Number(r?.owned?.[x.id])||0));if(n)owned[x.id]=x.skin?1:Math.min(n,9999)}
 let slots=Array(capacity).fill(null),used={};for(let i=0;i<capacity;i++){let id=r?.slots?.[i],x=byId[id];if(!x||x.skin||x.expand||(used[id]||0)>=(owned[id]||0))continue;slots[i]=id;used[id]=(used[id]||0)+1}
 return {capacity,owned,slots}
}
let state=load(), tab='game', mode='shop', selection=-1;
const clone=()=>JSON.parse(JSON.stringify(state));
const save=next=>{localStorage.setItem(KEY,JSON.stringify(next));state=next};
const art=id=>'assets/items-v33/'+id+(id==='expand'?'.svg':'.webp');
function icon(id){const i=document.createElement('img');i.src=art(id);i.alt='';i.draggable=false;return i}
function button(cls,label){const b=document.createElement('button');b.type='button';b.className=cls;b.setAttribute('aria-label',label);return b}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function owned(id){return state.owned[id]||0}
function available(id,slot){return owned(id)-state.slots.filter((v,i)=>v===id&&i!==slot).length}
function price(x){return x.expand?(state.capacity===2?500:1000):x.price}
const shell=el('section','v33-shop');shell.hidden=true;shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','상점');
const header=el('header','v33-header'),close=button('v33-back','닫기');close.textContent='‹';
const title=el('h2','','상점'),wallet=el('div','v33-wallet');wallet.innerHTML='<img src="assets/korean-v32/coin.svg" alt=""><b data-rh-coin-total>0</b>';header.append(close,title,wallet);
const tabs=el('div','v33-tabs'),tGame=button('','게임 아이템'),tSkin=button('','스킨');tGame.textContent='게임 아이템';tSkin.textContent='스킨';tabs.append(tGame,tSkin);
const sale=el('div','v33-sale'),saleGrid=el('div','v33-grid'),saleLabel=el('h3','','판매 중인 아이템');sale.append(saleLabel,saleGrid);
const bag=el('section','v33-bag'),bagLabel=el('h3','','내 아이템 보관함'),bagGrid=el('div','v33-grid v33-bag-grid');bag.append(bagLabel,bagGrid);
const detail=el('div','v33-detail');detail.hidden=true;
const dialog=el('section','v33-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
detail.append(dialog);shell.append(header,tabs,sale,bag,detail);home.append(shell);
function syncWallet(){wallet.querySelector('b').textContent=window.RhythmCoinV18.balance().toLocaleString('ko-KR')}
function tile(x,qty,handler){
 const b=button('v33-item',x.name+(qty===undefined?'':' '+qty+'개'));b.dataset.item=x.id;b.append(icon(x.id));
 if(qty!==undefined)b.append(el('span','v33-quantity','×'+qty));
 b.addEventListener('click',handler);return b
}
function refreshSlots(){
 for(const rack of home.querySelectorAll('.v33-rack')){
  rack.replaceChildren();
  for(let i=0;i<state.capacity;i++){
   const id=state.slots[i],b=button('v33-slot',id?byId[id].name+' 장착됨':'아이템 선택');
   b.dataset.slot=String(i);if(id)b.append(icon(id));
   b.addEventListener('click',()=>openInventory(i));rack.append(b)
  }
 }
}
for(const page of home.querySelectorAll('.rh-home-page')){
 const rack=el('div','v33-rack');page.querySelector('.rh-play-line')?.before(rack)
}
function refresh(){
 syncWallet();refreshSlots();
 tGame.setAttribute('aria-pressed',String(tab==='game'));tSkin.setAttribute('aria-pressed',String(tab==='skin'));
 saleGrid.replaceChildren();bagGrid.replaceChildren();
 const list=items.filter(x=>tab==='skin'?x.skin:!x.skin&&(!x.expand||state.capacity<4));
 if(mode==='shop'){
  for(const x of list)saleGrid.append(tile(x,undefined,()=>showDetail(x,'buy')));
  for(const x of list.filter(x=>!x.expand&&owned(x.id)>0))bagGrid.append(tile(x,owned(x.id),()=>showDetail(x,'owned')));
  if(!bagGrid.children.length)bagGrid.append(el('p','v33-empty','보유 아이템이 없습니다.'));
 }else{
  for(const x of items.filter(x=>!x.skin&&!x.expand&&available(x.id,selection)>0)){
   saleGrid.append(tile(x,available(x.id,selection),()=>{let next=clone();next.slots[selection]=x.id;try{save(next);closeShop()}catch(e){alert('저장할 수 없습니다.')}}))
  }
  if(!saleGrid.children.length)saleGrid.append(el('p','v33-empty','장착 가능한 아이템이 없습니다.'));
  const current=state.slots[selection];
  if(current){const b=button('v33-unset','장착 해제');b.textContent='해제';b.onclick=()=>{let next=clone();next.slots[selection]=null;try{save(next);closeShop()}catch(e){alert('저장할 수 없습니다.')}};saleGrid.append(b)}
 }
}
function showDetail(x,kind){
 dialog.replaceChildren();
 const cancel=button('v33-x','닫기');cancel.textContent='×';cancel.onclick=()=>detail.hidden=true;
 const preview=icon(x.id);preview.className='v33-preview';
 dialog.append(cancel,preview,el('h3','',x.name),el('p','v33-desc',x.desc));
 if(kind==='buy'){
  if(x.expand)dialog.append(el('p','v33-desc',state.capacity+' → '+Math.min(4,state.capacity+1)+'칸'));
  else dialog.append(el('p','v33-review','검수용 상품 · 효과 및 소모는 아직 적용 전'));
  const cost=price(x),buy=button('v33-buy','구매하기 '+cost+'코인');buy.textContent='구매하기  ·  '+cost+' ◉';
  const feedback=el('div','v33-feedback');feedback.setAttribute('role','status');
  buy.disabled=(x.skin&&owned(x.id)>0)||(x.expand&&state.capacity>=4);
  if(buy.disabled)buy.textContent='보유 중';
  buy.onclick=()=>{
   buy.disabled=true;
   if(window.RhythmCoinV18.balance()<cost){feedback.textContent='코인이 부족합니다.';buy.disabled=false;return}
   const next=clone();if(x.expand){next.capacity++;next.slots.push(null)}else{next.owned[x.id]=(next.owned[x.id]||0)+1}
   const ok=window.RhythmCoinV18.purchase(cost,()=>save(next));
   if(!ok){feedback.textContent='구매하지 못했습니다. 코인은 차감되지 않았습니다.';buy.disabled=false;return}
   detail.hidden=true;refresh();
  };
  dialog.append(buy,feedback);
 }else dialog.append(el('p','v33-desc','보유 '+owned(x.id)+'개'));
 detail.hidden=false;cancel.focus();
}
function openShop(){
 mode='shop';selection=-1;tab='game';shell.dataset.mode=mode;shell.setAttribute('aria-label','상점');title.textContent='상점';saleLabel.textContent='판매 중인 아이템';
 tabs.hidden=false;bag.hidden=false;detail.hidden=true;
 window.RhythmAlbumPreviewV22?.stop?.();shell.hidden=false;refresh();close.focus();
}
function openInventory(i){
 mode='inventory';selection=i;tab='game';shell.dataset.mode=mode;shell.setAttribute('aria-label','아이템 보관함');title.textContent='아이템 보관함';saleLabel.textContent='내 아이템';
 tabs.hidden=true;bag.hidden=true;detail.hidden=true;
 window.RhythmAlbumPreviewV22?.stop?.();shell.hidden=false;refresh();close.focus();
}
function closeShop(){detail.hidden=true;shell.hidden=true;refreshSlots()}
close.onclick=closeShop;tGame.onclick=()=>{tab='game';refresh()};tSkin.onclick=()=>{tab='skin';refresh()};
detail.addEventListener('click',e=>{if(e.target===detail)detail.hidden=true});
shell.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!detail.hidden)detail.hidden=true;else closeShop()}});
home.addEventListener('click',e=>{if(e.target.closest('[data-rh-panel="shop"]')){e.preventDefault();e.stopImmediatePropagation();openShop()}},true);
new MutationObserver(()=>{if(overlay.hidden)closeShop()}).observe(overlay,{attributes:true,attributeFilter:['hidden']});
refreshSlots();
window.RhythmShopV33={version:33,snapshot:()=>clone()};
// Combo is a presentation-only observer on the real HUD counter; no alternate scoring.
const counter=$('combo'),field=$('field');
if(counter&&field){
 const display=el('div','v33-combo');display.setAttribute('aria-hidden','true');display.hidden=true;
 const num=el('strong','','0'),word=el('span','','COMBO');display.append(num,word);field.append(display);
 let previous=-1,animation=null;
 function update(){
  const n=Number(counter.textContent.replace(/[^0-9]/g,''))||0;
  if(!overlay.hidden||n<20){display.hidden=true;field.classList.remove('v33-combo-on');previous=n;animation?.cancel();return}
  if(n===previous&&!display.hidden)return;previous=n;display.hidden=false;field.classList.add('v33-combo-on');
  num.textContent=String(n);const step=Math.min(6,Math.floor(n/10)-2);display.style.setProperty('--v33-combo-size',Math.min(84,48+step*7)+'px');
  const milestone=n===20||n%10===0;display.dataset.milestone=milestone?'1':'0';
  animation?.cancel();
  if(display.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)animation=display.animate(milestone?[
   {transform:'translateX(-50%) scale(.66)',opacity:.25},{transform:'translateX(-50%) scale(1.18)',opacity:1,offset:.30},{transform:'translateX(-50%) scale(1)',opacity:.82}
  ]:[{transform:'translateX(-50%) scale(1.08)',opacity:.93},{transform:'translateX(-50%) scale(1)',opacity:.74}],{duration:milestone?480:170,easing:'cubic-bezier(.2,.8,.25,1)',fill:'forwards'});
 }
 new MutationObserver(update).observe(counter,{childList:true,subtree:true,characterData:true});
 new MutationObserver(update).observe(overlay,{attributes:true,attributeFilter:['hidden']});update()
}
})();