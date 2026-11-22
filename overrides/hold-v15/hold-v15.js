/* V15: song-led HOLD + RELEASE. Only notes explicitly marked hold/release use
 * this mechanic; original tap/flick input and V7 judgement remain untouched.
 * A HOLD is a scored press, a RELEASE a separately scored timed lift.
 */
(()=>{
  'use strict';
  if(typeof notes==='undefined'||typeof processNotes!=='function')return;
  const holdPointers=new Map(),holdKeys=new Map();
  const keymap={KeyD:0,KeyF:1,KeyJ:2,KeyK:3};
  const WINDOW=.175;
  const link=(lane,head)=>notes.find(n=>n.kind==='release'&&n.lane===lane&&Math.abs(n.startT-head.t)<.035);
  const findHead=lane=>{
    if(!playing||paused||autoplay)return null;
    const n=nearest(lane,'hold');
    return n&&Math.abs(n.t-tNow())<=WINDOW?n:null;
  };
  const releaseNow=(data,cancel=false)=>{
    if(!data)return;
    const end=data.end;
    if(playing&&!paused&&!autoplay&&end.state==='pending'){
      if(!cancel&&Math.abs(end.t-tNow())<=WINDOW)registerSuccess(end,end.t-tNow());
      else registerMiss(end);
    }
    pressed(data.lane,false);
  };
  const startHold=(n,lane)=>{
    const end=link(lane,n);
    if(!end||end.state!=='pending')return null;
    registerSuccess(n,n.t-tNow());
    if(n.state!=='done')return null;
    pressed(lane,true);
    return {lane,end};
  };
  for(let lane=0;lane<4;lane++){
    const btn=buttons[lane];
    btn.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      const n=findHead(lane);
      if(!n)return;
      e.preventDefault();e.stopImmediatePropagation();
      try{btn.setPointerCapture(e.pointerId)}catch(_){}
      const data=startHold(n,lane);
      if(data)holdPointers.set(e.pointerId,data);
    },true);
    const finish=(e,cancel=false)=>{
      const data=holdPointers.get(e.pointerId);
      if(!data)return;
      e.preventDefault();e.stopImmediatePropagation();
      holdPointers.delete(e.pointerId);
      releaseNow(data,cancel);
      try{if(btn.hasPointerCapture(e.pointerId))btn.releasePointerCapture(e.pointerId)}catch(_){}
    };
    btn.addEventListener('pointerup',e=>finish(e,false),true);
    btn.addEventListener('pointercancel',e=>finish(e,true),true);
    btn.addEventListener('lostpointercapture',e=>{
      const data=holdPointers.get(e.pointerId);
      if(data){holdPointers.delete(e.pointerId);releaseNow(data,true)}
    },true);
  }
  // Desktop test support: D/F/J/K press -> hold -> release at its tail.
  document.addEventListener('keydown',e=>{
    if(!(e.code in keymap)||e.repeat||e.shiftKey||holdKeys.has(e.code))return;
    const lane=keymap[e.code],n=findHead(lane);
    if(!n)return;
    e.preventDefault();e.stopImmediatePropagation();
    const data=startHold(n,lane);
    if(data)holdKeys.set(e.code,data);
  },true);
  document.addEventListener('keyup',e=>{
    const data=holdKeys.get(e.code);
    if(!data)return;
    e.preventDefault();e.stopImmediatePropagation();
    holdKeys.delete(e.code);releaseNow(data);
  },true);
  // Do not synthesize a second pitched note merely because a key was lifted.
  const oldHit=playHit;
  playHit=function(sound,kind){if(kind!=='release')return oldHit(sound,kind)};
  // V7 replaces processNotes() for EASY. Wrap its FINAL implementation after
  // it has been installed, so the energy/BAD/MISS model stays authoritative.
  const baseProcess=processNotes;
  processNotes=function(){
    if(!playing||paused)return baseProcess();
    if(autoplay){
      const t=tNow();
      for(const n of notes){
        if(n.state!=='pending'||n.t>t)continue;
        if(n.kind==='hold'){
          registerSuccess(n,0,true);
          if(n.state==='done')pressed(n.lane,true);
        }else if(n.kind==='release'){
          const head=notes.find(h=>h.kind==='hold'&&h.lane===n.lane&&Math.abs(h.t-n.startT)<.035);
          if(head?.state==='done')registerSuccess(n,0,true);
          else registerMiss(n);
          pressed(n.lane,false);
        }
      }
    }
    baseProcess();
    if(!autoplay&&playing){
      for(const n of notes){
        if(n.kind!=='release'||n.state!=='pending')continue;
        const h=notes.find(x=>x.kind==='hold'&&x.lane===n.lane&&Math.abs(x.t-n.startT)<.035);
        if(h?.state==='miss')registerMiss(n);
      }
    }
  };
  const baseReset=resetControls;
  resetControls=function(){holdPointers.clear();holdKeys.clear();baseReset()};
  console.info('HOLD_V15_INPUT_READY');
})();
