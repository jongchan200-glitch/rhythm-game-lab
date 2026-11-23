/* V22: Swipe an LP/CD to hear that album automatically.
 * Separate preview audio is crossfaded and never touches the gameplay song,
 * scoring, record storage or saved wallet. A genuine swipe/arrow key gesture
 * triggers .play() synchronously to satisfy mobile user-activation rules.
 */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const playingSet=new Set();
  let active=null, previewSerial=0;
  const homes={easy:$('rhEasyPage'),hard:$('rhHardPage')};
  const buttonOf=id=>Number(songs[id]?.difficulty)>=4?$('rhHardPreview'):$('rhPreview');
  const isVisible=()=>!$('overlay')?.hidden && !playing && $('rhDrawerBackdrop')?.hidden!==false;
  function status(id,message){
    const button=buttonOf(id);if(button)button.textContent=message;
    const disk=Number(songs[id]?.difficulty)>=4?$('rhHardDiscZone'):$('rhVinyl');
    if(disk)disk.classList.toggle(Number(songs[id]?.difficulty)>=4?'rh-hard-spin':'rh-spin',message.includes('재생 중'));
  }
  function fade(a,target,duration,onEnd){
    if(!a)return;
    const serial=a._rhFade=(a._rhFade||0)+1;
    const start=performance.now(),initial=a.volume;
    function tick(now){
      if(a._rhFade!==serial)return;
      const progress=Math.min(1,(now-start)/duration);
      a.volume=Math.max(0,Math.min(1,initial+(target-initial)*progress));
      if(progress<1)requestAnimationFrame(tick);else if(onEnd)onEnd();
    }
    requestAnimationFrame(tick);
  }
  function dispose(a){
    if(!a)return;
    a._rhFade=(a._rhFade||0)+1;
    a.pause();a.removeAttribute('src');a.load();playingSet.delete(a);
  }
  function stop(){
    ++previewSerial;
    for(const a of [...playingSet])dispose(a);
    active=null;
    for(const id of ['rhPreview','rhHardPreview']){
      const b=$(id);if(b)b.textContent='♫ 앨범을 넘기면 자동 재생';
    }
    $('rhVinyl')?.classList.remove('rh-spin');
    $('rhHardDiscZone')?.classList.remove('rh-hard-spin');
  }
  // Main engine's audio is selected by the catalog but is not used for home preview.
  function playSong(id){
    if(!isVisible()||!songs[id])return;
    const seq=++previewSerial;
    const old=active;
    if(old?.id===id){old.sound.currentTime=0;status(id,'♫ 자동 재생 중 · 탭하면 멈춤');return}
    const gameTrack=songs[id];
    const sound=new Audio(gameTrack.audio?.src || gameTrack.audioPath);
    sound.preload='auto';sound.playsInline=true;sound.playbackRate=1;sound.volume=0;
    sound._rhFade=0;
    // This V2 is explicitly a drum-led chart: preview starts where the regular
    // kick/snare groove enters, while the game itself always plays the full cut.
    const start=id==='well_lived_hard_repeat_v21'?8.15:Math.max(0,Number(gameTrack.preRoll)||0);
    try{sound.currentTime=start}catch(_){/*metadata not loaded yet*/}
    playingSet.add(sound);active={id,sound};
    const desired=Math.max(0,Math.min(.75,(Number($('songVolume')?.value??88)/100)*.72));
    // Call play() before awaiting anything: browser unlock comes from swipe.
    const promise=sound.play();
    if(old?.sound&&old.sound!==sound)fade(old.sound,0,210,()=>dispose(old.sound));
    Promise.resolve(promise).then(()=>{
      if(seq!==previewSerial||active?.sound!==sound){dispose(sound);return}
      fade(sound,desired,300);
      status(id,'♫ 자동 재생 중 · 탭하면 멈춤');
    }).catch(()=>{
      if(active?.sound!==sound){dispose(sound);return}
      dispose(sound);active=null;status(id,'♫ 재생하려면 한 번 눌러 주세요');
    });
    sound.addEventListener('ended',()=>{
      if(active?.sound!==sound)return;
      stop();
    });
    // It's a music taste while browsing, not a second full-song playback.
    setTimeout(()=>{
      if(active?.sound!==sound)return;
      fade(sound,0,550,()=>{
        if(active?.sound===sound){dispose(sound);active=null;status(id,'♫ 다시 듣기')}
      });
    },22000);
  }
  function toggle(id){
    if(active?.id===id){stop();return}
    playSong(id);
  }
  // Any actual performance or autoplay demo stops the detached album sampler.
  for(const id of ['start','autoDemo','rhPlay','rhDemo','rhHardPlay','rhHardDemo'])
    $(id)?.addEventListener('click',stop,true);
  new MutationObserver(()=>{if($('overlay')?.hidden)stop()})
    .observe($('overlay'),{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(()=>{
    if(active && ((active.id===undefined)|| (Number(songs[active.id]?.difficulty)>=4?homes.hard?.getAttribute('aria-hidden')==='true':homes.easy?.getAttribute('aria-hidden')==='true')))stop();
  }).observe($('rhPageTrack'),{attributes:true,subtree:true,attributeFilter:['aria-hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
  window.addEventListener('pagehide',stop);
  $('songVolume')?.addEventListener('input',()=>{
    if(active)fade(active.sound,Math.max(0,Math.min(.75,Number($('songVolume').value)/100*.72)),160);
  });
  window.RhythmAlbumPreviewV22={playSong,toggle,stop,activeId:()=>active?.id||null};
})();
