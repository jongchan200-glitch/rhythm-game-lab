/* V38 — game chart unlocking, not original-MP3 ownership. */
(()=>{
'use strict';
const KEY='rhythm_lab_song_unlocks_v38',$=id=>document.getElementById(id);
const prices={1:50,2:100,3:150,4:200,5:300},priceMap={};
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(_){return {}}}
let owned=read(),pending=null,lastFocus=null;
const wallet=()=>window.RhythmCoinV18;
const balance=()=>wallet()?.balance?.()||0;
const price=id=>priceMap[id]||0;
const unlocked=id=>!!owned[id];
const locked=id=>!!price(id)&&!unlocked(id);
const easy=()=>document.querySelector('#catalog .songBtn.selected')?.dataset.song||null;
const hard=()=>window.RhythmHomeV16?.hardAlbum?.()||null;
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!=null)n.textContent=text;return n};
const modal=el('div','v38-modal');modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
const panel=el('section','v38-card'),heading=el('h2','','게임곡 해금'),desc=el('p','v38-desc'),funds=el('p','v38-funds'),notice=el('p','v38-notice');
const actions=el('div','v38-actions'),no=el('button','','취소'),yes=el('button','','해금하기');no.type=yes.type='button';
actions.append(no,yes);panel.append(heading,desc,funds,notice,actions);modal.append(panel);
($('rhHome')||document.body).append(modal);
const fmt=n=>Number(n||0).toLocaleString('ko-KR');
function close(){modal.hidden=true;pending=null;lastFocus?.focus?.()}
no.onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
function prompt(id){
 if(!locked(id))return false;
 pending=id;lastFocus=document.activeElement;
 const name=document.querySelector('#catalog .songBtn[data-song="'+id+'"] strong')?.textContent||'선택한 음악';
 desc.textContent='「'+name+'」 게임 채보 영구 해금 · 전체 원곡 MP3 소장과는 별개입니다.';
 funds.textContent='필요 '+fmt(price(id))+'엽전 / 보유 '+fmt(balance())+'엽전';
 yes.disabled=balance()<price(id);notice.textContent=yes.disabled?'엽전이 부족합니다.':'해금은 현재 기기에 저장됩니다.';
 modal.hidden=false;no.focus();return true;
}
function buy(id){
 const cost=price(id),w=wallet();if(!locked(id)||!w?.spend||balance()<cost)return false;
 const old=localStorage.getItem(KEY),next={...owned,[id]:true};
 try{localStorage.setItem(KEY,JSON.stringify(next))}catch(_){return false}
 if(!w.spend(cost)){
  try{if(old===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,old)}catch(_){}
  return false;
 }
 owned=next;refresh();return true;
}
yes.onclick=()=>{const id=pending;if(!id)return;if(buy(id))close();else{prompt(id);notice.textContent='저장 또는 잔액을 확인해 주세요.'}};
function refresh(){
 for(const [id,get] of [['rhRecordZone',easy],['rhHardDiscZone',hard]]){
  const n=$(id);if(!n)continue;n.classList.toggle('v38-locked',locked(get()));
 }
 for(const n of document.querySelectorAll('#catalog .songBtn')){
  const song=n.dataset.song;n.classList.toggle('v38-locked',locked(song));
 }
}
document.addEventListener('click',e=>{
 const t=e.target?.closest?.('#start,#autoDemo,#rhPlay,#rhDemo,#rhHardPlay,#rhHardDemo');
 if(!t)return;
 const id=t.id.startsWith('rhHard')?hard():easy();
 if(locked(id)){e.preventDefault();e.stopImmediatePropagation();prompt(id)}
},true);
for(const [id,get] of [['rhRecordZone',easy],['rhHardDiscZone',hard]]){
 const n=$(id);n?.addEventListener('click',e=>{if(locked(get())){e.preventDefault();e.stopImmediatePropagation();prompt(get())}},true);
}
if(typeof initGame==='function'){
 const original=initGame;initGame=function(){if(typeof current!=='undefined'&&locked(current?.id)){prompt(current.id);return}return original.apply(this,arguments)};
}
const cat=$('catalog');if(cat)new MutationObserver(refresh).observe(cat,{attributes:true,attributeFilter:['class','disabled'],childList:true,subtree:true});
const ht=$('rhHardTitle');if(ht)new MutationObserver(refresh).observe(ht,{childList:true,characterData:true,subtree:true});
window.addEventListener('storage',e=>{if(e.key===KEY){owned=read();refresh()}});
async function load(){
 try{const r=await fetch('assets/v38-locks.json',{cache:'no-store'}),j=await r.json();if(!Array.isArray(j.tracks))throw Error('invalid locks');
  for(const t of j.tracks){if(typeof t.id==='string'&&/^[\w-]{3,90}$/.test(t.id)&&Object.values(prices).includes(t.price))priceMap[t.id]=t.price}
 }catch(err){console.warn('V38 lock config unavailable',err)}
 refresh();
}
window.RhythmSongUnlockV38={version:38,price,locked,unlocked,balance,buy,snapshot:()=>({...owned}),ready:load()};
})();