/* Rhythm Lab V18: a real descending gold coin IN PLACE OF an ordinary tap note.
   5-6 EASY / 18-20 HARD per song; only human PERFECT pays. No chart or score change. */
(()=>{
  'use strict';
  const KEY='rhythm_lab_coins_v1';
  const $=id=>document.getElementById(id);
  const UI=document.createElement('div');
  UI.className='v18-game-wallet';UI.id='v18GameWallet';UI.setAttribute('aria-label','보유 코인');
  UI.innerHTML='<span class="v18-coin-mark" aria-hidden="true">★</span><b id="v18GameCoinNumber">0</b><span class="v18-plus" aria-hidden="true">+</span>';
  const head=document.querySelector('.headact');
  if(head)head.insertBefore(UI,head.querySelector('#pause')||head.firstChild);
  function balance(){try{return Math.max(0,Math.floor(Number(localStorage.getItem(KEY))||0))}catch(_){return 0}}
  let amount=balance(),flightId=0;
  const fmt=n=>n.toLocaleString('ko-KR');
  function sync(){
    const value=fmt(amount);
    const n=$('v18GameCoinNumber');if(n&&n.textContent!==value)n.textContent=value;
    for(const x of document.querySelectorAll('#rhWallet b, .rh-hard-wallet b, [data-rh-coin-total]')){
      if(x.textContent!==value)x.textContent=value;
    }
    const panel=$('rhDrawerBody');
    const banner=panel?.querySelector('.rh-banner b');
    if(banner&&banner.textContent!==value)banner.textContent=value;
  }
  function credit(){
    amount++;try{localStorage.setItem(KEY,String(amount))}catch(_){/* private browsing: session only */}
    sync(); UI.classList.remove('v18-hit');void UI.offsetWidth;UI.classList.add('v18-hit');
    const plus=UI.querySelector('.v18-plus');plus.textContent='+1';
    const node=document.createElement('span');node.className='v18-coin-popup';node.textContent='+1';
    UI.appendChild(node);setTimeout(()=>node.remove(),820);
  }
  const drawer=$('rhDrawerBody');if(drawer)new MutationObserver(sync).observe(drawer,{childList:true,subtree:false});
  window.addEventListener('storage',e=>{if(e.key===KEY){amount=balance();sync()}});
  function hash(str){let h=2166136261;for(const ch of str){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function markCoins(){
    if(!current||!notes.length)return;
    const count=Number(current.difficulty)<=3?5+(hash(current.id)%2):18+(hash(current.id)%3);
    const tap=notes.filter(n=>n.kind==='tap').filter(n=>notes.every(other=>other===n||Math.abs(other.t-n.t)>.12||other.lane!==n.lane));
    const all=notes.filter(n=>n.kind==='tap').filter(n=>n.t>1.4&&n.t<Math.max(2,(Number(current.duration)||notes.at(-1).t)-1.8));
    const candidates=all.filter(n=>!notes.some(other=>other!==n&&Math.abs(other.t-n.t)<.065));
    const pool=candidates.length>=count?candidates:tap.filter(n=>n.t>1.4);
    const chosen=[];const min=pool[0]?.t||0,max=pool.at(-1)?.t||0;
    for(let i=0;i<count&&pool.length;i++){
      const target=min+((i+.5)/count)*(max-min);
      const options=pool.filter(n=>!chosen.includes(n)&&chosen.every(c=>Math.abs(c.t-n.t)>.72));
      const choices=options.length?options:pool.filter(n=>!chosen.includes(n));
      if(!choices.length)break;
      const pick=choices.reduce((best,n)=>Math.abs(n.t-target)<Math.abs(best.t-target)?n:best);
      pick.coin=true;chosen.push(pick);
    }
    console.info('V18_COIN_NOTES',current.id,chosen.length,'difficulty',current.difficulty);
  }
  const originalInit=initGame;
  initGame=function(){originalInit();markCoins();sync()};
  const pending=new Map();
  function emitCoin(lane){
    const f=$('field');const r=f.getBoundingClientRect(),target=UI.getBoundingClientRect();
    const sx=r.left+r.width*(lane+.5)/4,sy=r.top+r.height*.79;
    const ex=target.left+target.width*.27,ey=target.top+target.height*.50;
    const el=document.createElement('span');el.className='v18-flying-coin';el.setAttribute('aria-hidden','true');el.textContent='★';
    el.style.left=sx+'px';el.style.top=sy+'px';document.body.appendChild(el);
    const dx=ex-sx,dy=ey-sy,curve=Math.max(-100,Math.min(100,dx*.26));
    const angle=dx>=0?300:-300;
    let paid=false;const id=++flightId;
    const settle=()=>{if(paid)return;paid=true;pending.delete(id);el.remove();credit()};
    pending.set(id,settle);
    if(!el.animate){settle();return}
    const anim=el.animate([
      {offset:0,transform:'translate(-50%,-50%) rotate(-10deg) scale(1.15)',opacity:1},
      {offset:.25,transform:`translate(calc(-50% + ${dx*.15+curve}px), calc(-50% + ${dy*.14-55}px)) rotate(${angle*.35}deg) scale(1.16)`,opacity:1},
      {offset:.68,transform:`translate(calc(-50% + ${dx*.64}px), calc(-50% + ${dy*.68-40}px)) rotate(${angle*.72}deg) scale(.84)`,opacity:1},
      {offset:1,transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${angle}deg) scale(.42)`,opacity:1}
    ],{duration:690,easing:'cubic-bezier(.23,.76,.36,1)',fill:'forwards'});
    anim.onfinish=settle;anim.oncancel=settle;
    setTimeout(settle,850); // paused animations or tab visibility never lose a PERFECT.
  }
  const originalSuccess=registerSuccess;
  registerSuccess=function(n,delta,auto=false){
    const reward=!!n?.coin&&n.state==='pending'&&!auto&&grade(delta)[0]==='PERFECT';
    originalSuccess(n,delta,auto);
    if(reward&&n.state==='done'&&!n.coinPaid){n.coinPaid=true;emitCoin(n.lane)}
  };
  // Flush earned-but-flying coins if the browser navigates away before arrival.
  window.addEventListener('pagehide',()=>{for(const finish of [...pending.values()])finish()});
  window.RhythmCoinV18={balance:()=>amount,selected:()=>notes.filter(n=>n.coin).length};
  sync();
})();
