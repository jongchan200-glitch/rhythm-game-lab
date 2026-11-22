/* Rhythm Lab V14 two-page EASY/HARD home and record carousel.
 * Design structure mirrors Hell Fall: account+wallet / showcase /
 * best summary / start / bottom five destinations.
 * Uses the existing catalog, playback, records and settings as sources of truth.
 * Store/reward and character unlocks remain truthful placeholders.
 */
(()=>{
 'use strict';
 const overlay=document.getElementById('overlay');
 const catalog=document.getElementById('catalog');
 if(!overlay||!catalog||document.getElementById('rhHome'))return;
 const byId=id=>document.getElementById(id);
 const svg={
  character:'<circle cx="12" cy="7.4" r="3.1"/><path d="M4.3 20c.3-4.5 3.2-6.7 7.7-6.7s7.4 2.2 7.7 6.7"/>',
  shop:'<path d="M3 9l2-5h14l2 5v2a3 3 0 0 1-4.5 2.5 3.4 3.4 0 0 1-4.5 0 3.4 3.4 0 0 1-4.5 0A3 3 0 0 1 3 11zM5 14v6h14v-6M9 20v-5h6v5"/>',
  coin:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 8v8M10 10h3.2a2 2 0 0 1 0 4H10"/>',
  records:'<path d="M7 4h10v6a5 5 0 0 1-10 0zM7 6H4v3a4 4 0 0 0 3 4M17 6h3v3a4 4 0 0 1-3 4M12 15v4M8 21h8"/>',
  settings:'<path d="M10 2h4l.6 2.4 1.8.8 2.2-1.3 2.7 2.8-1.3 2.2.8 1.8L23 11v3l-2.2.5-.8 1.9 1.3 2.2-2.7 2.7-2.2-1.2-1.8.7-.6 2.2h-4l-.5-2.2-1.9-.7-2.2 1.2-2.7-2.7 1.2-2.2-.7-1.9L1 14v-3l2.2-.3.7-1.8-1.2-2.2 2.7-2.8 2.2 1.3 1.9-.8z"/><circle cx="12" cy="12.5" r="3.2"/>'
 };
 const nav=Object.entries({character:'캐릭터',shop:'상점',coin:'코인',records:'기록',settings:'설정'})
    .map(([type,label])=>`<button type="button" data-rh-panel="${type}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true">${svg[type]}</svg><span>${label}</span></button>`).join('');
 const home=document.createElement('div');home.id='rhHome';home.innerHTML=`
 <main class="rh-page-window" id="rhPageWindow" aria-label="EASY와 HARD 홈">
  <div class="rh-page-track" id="rhPageTrack">
   <section class="rh-home-page rh-easy-page" id="rhEasyPage" aria-label="EASY 홈">
    <header class="rh-head"><div class="rh-profile"><div class="rh-avatar" aria-hidden="true">♫</div><div class="rh-profile-meta"><b>PLAYER</b><span>RHYTHM ARTIST</span></div></div><button type="button" class="rh-wallet" id="rhWallet" aria-label="코인 획득소 열기"><span class="rh-wallet-icon">◉</span><b>0</b><span class="rh-wallet-plus">+</span></button></header>
    <div class="rh-brand"><div class="rh-kicker">HANUL MUSIC</div><h1>RHYTHM <em>LAB</em></h1><p>EASY · RECORD COLLECTION</p></div>
    <section class="rh-showcase" id="rhShowcase" aria-label="EASY 음악 선택">
     <div class="rh-stage-line" aria-hidden="true"></div><div class="rh-halo" aria-hidden="true"></div>
     <div class="rh-record-zone" id="rhRecordZone" role="group" tabindex="0" aria-label="레코드를 좌우로 밀어 EASY 음악 선택">
      <div class="rh-vinyl" id="rhVinyl"><div class="rh-vinyl-label"><div class="rh-label-brand">HANUL RECORDS</div><div id="rhSongTitle" class="rh-label-title">곡을 불러오는 중…</div><div class="rh-label-rule"></div><div id="rhStars" class="rh-label-stars">★★★</div><div class="rh-label-hole" aria-hidden="true"></div></div></div>
     </div>
     <div class="rh-record-info"><span class="rh-record-kicker" id="rhPosition">EASY • SIDE A</span><div class="rh-song-sub" id="rhSongSub">리듬의 첫 번째 무대</div><div class="rh-credits" id="rhCredits"><span>작곡·작사 <b>챨스</b></span><span>제작 <b>한울</b></span></div></div>
     <button type="button" class="rh-preview" id="rhPreview">♫ 곡 미리듣기</button>
    </section>
    <div class="rh-play-section"><div id="rhResult" class="rh-result" role="status" hidden></div><div class="rh-stats"><div class="rh-stat"><small>BEST SCORE</small><b id="rhBest">—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>MAX COMBO</small><b id="rhCombo">—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>PLAY COUNT</small><b id="rhPlays">0</b></div></div><div class="rh-play-line"><button type="button" class="rh-main-play" id="rhPlay"><span class="rh-play-tri">▶</span><span><strong>게임 시작하기</strong><small id="rhPlayHint">선택한 음악 연주 시작</small></span></button><button type="button" class="rh-demo" id="rhDemo">▶ 자동<br/>시연</button></div></div>
   </section>
   <section class="rh-home-page rh-hard-page" id="rhHardPage" aria-label="잠긴 HARD 홈" aria-hidden="true" inert>
    <header class="rh-head"><div class="rh-profile"><div class="rh-avatar rh-avatar-hard" aria-hidden="true">✧</div><div class="rh-profile-meta"><b>PLAYER</b><span>HARD STAGE</span></div></div><button type="button" class="rh-wallet rh-hard-wallet" aria-label="코인 획득소 열기"><span class="rh-wallet-icon">◉</span><b>0</b><span class="rh-wallet-plus">+</span></button></header>
    <div class="rh-brand rh-hard-brand"><div class="rh-kicker">HANUL MUSIC</div><h1>RHYTHM <em>LAB</em></h1><p>HARD · COMPACT DISC COLLECTION</p></div>
    <section class="rh-showcase rh-hard-showcase" aria-label="HARD 잠금 앨범">
     <div class="rh-stage-line" aria-hidden="true"></div><div class="rh-halo" aria-hidden="true"></div>
     <div class="rh-cd-stage"><div class="rh-compact-disc"><div class="rh-cd-printed"><span>HANUL RECORDS</span><strong>데스매치</strong><small>★★★★★</small><i aria-hidden="true"></i></div></div><div class="rh-cd-lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div></div>
     <div class="rh-record-info"><span class="rh-record-kicker rh-hard-kicker">HARD • SIDE B</span><div class="rh-hard-lock-title">HARD MODE <span>LOCKED</span></div><div class="rh-credits"><span>작사·작곡 <b>챨스</b></span><span>제작 <b>한울</b></span></div><p class="rh-hard-status">하드 스테이지 준비 중</p></div>
     <div class="rh-hard-placeholder" aria-label="앞으로 추가될 잠긴 앨범">더 많은 앨범은 추후 공개</div>
    </section>
    <div class="rh-play-section"><div class="rh-stats rh-hard-stats"><div class="rh-stat"><small>BEST SCORE</small><b>—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>MAX COMBO</small><b>—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>PLAY COUNT</small><b>0</b></div></div><button type="button" class="rh-main-play rh-hard-play" disabled><span class="rh-play-tri">🔒</span><span><strong>아직 잠겨 있어요</strong><small>HARD · ★★★★ ~ ★★★★★</small></span></button></div>
   </section>
  </div>
 </main>
 <footer class="rh-fixed-footer" id="rhFixedFooter"><nav class="rh-nav" aria-label="게임 홈 메뉴">${nav}</nav><div class="rh-indicator" aria-hidden="true"></div></footer>
 <section id="rhDrawerBackdrop" class="rh-drawer-backdrop" role="dialog" aria-modal="true" aria-label="게임 메뉴" hidden><div class="rh-drawer"><header class="rh-drawer-head"><h2 id="rhDrawerTitle">메뉴</h2><button type="button" class="rh-close" id="rhClose" aria-label="닫기">×</button></header><div id="rhDrawerBody" class="rh-drawer-body"></div></div></section>`;
 overlay.appendChild(home);
 // The original overlay lived inside the game field and could never use the
 // whole screen. Moving it doesn't invalidate main.js's stored element ref.
 document.body.appendChild(overlay);
 overlay.classList.add('rh-home-active');
 const controls={title:byId('rhSongTitle'),subtitle:byId('rhSongSub'),stars:byId('rhStars'),position:byId('rhPosition'),credits:byId('rhCredits'),best:byId('rhBest'),combo:byId('rhCombo'),plays:byId('rhPlays'),result:byId('rhResult'),preview:byId('rhPreview'),vinyl:byId('rhVinyl'),panel:byId('rhDrawerBackdrop'),panelBody:byId('rhDrawerBody')};
 const fmt=n=>Number(n||0).toLocaleString('ko-KR');
 function playable(){return [...catalog.querySelectorAll('.songBtn:not([disabled])')].filter(b=>{const stars=(b.querySelector('small')?.textContent||'').match(/★+/)?.[0].length||0;return stars>=1&&stars<=3;});}
 const displayBySong={
  deathmatch_one_take_v12:{title:'데스매치',detail:'ONE TAKE · 57초'},
  moonlight_intro_rock_v4_3:{title:'월광 소나타',detail:'도입부 · EASY'}
 };
 const creditsBySong={
  deathmatch_one_take_v12:{lyricist:'챨스',composer:'챨스',producer:'한울'},
  moonlight_intro_rock_v4_3:{original:'L. van Beethoven',producer:'한울'},
  moonlight_epic_rock_v2_5:{original:'L. van Beethoven',producer:'한울'}
 };
 function credits(id){const c=creditsBySong[id]||{producer:'한울'};const parts=[];
  if(c.lyricist&&c.composer&&c.lyricist===c.composer)parts.push(`<span>작사·작곡 <b>${safeText(c.composer)}</b></span>`);
  else {if(c.lyricist)parts.push(`<span>작사 <b>${safeText(c.lyricist)}</b></span>`);if(c.composer)parts.push(`<span>작곡 <b>${safeText(c.composer)}</b></span>`)}
  if(c.original)parts.push(`<span>원작곡 <b>${safeText(c.original)}</b></span>`);
  parts.push(`<span>제작 <b>${safeText(c.producer)}</b></span>`);return parts.join('');
 }

 function getSelection(){const buttons=playable();let idx=buttons.findIndex(b=>b.classList.contains('selected'));if(idx<0)idx=0;return {buttons,index:idx,selected:buttons[idx]};}
 function readRecords(){try{const x=JSON.parse(localStorage.getItem('moonlight_demo_records_v1')||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
 function stats(){const {selected}=getSelection();const r=readRecords()[selected?.dataset.song]||{};return {best:r.best||0,count:r.count||0,maxCombo:r.maxCombo||0,master:!!r.master}}
 let lastSong=null,raf=0;
 function refresh(){
   const {buttons,index,selected}=getSelection();
   if(!buttons.length){controls.title.textContent='곡을 불러오는 중…';controls.position.textContent='EASY • SIDE A';byId('rhPlay').disabled=true;return}
   if(!buttons.some(b=>b.classList.contains('selected'))){buttons[0].click();return}
   const id=selected.dataset.song;
   if(lastSong!==id){controls.vinyl.classList.remove('rh-spin');controls.preview.textContent='♫ 곡 미리듣기';lastSong=id;byId('previewPlay').textContent='▶ 음악 미리듣기';}
   controls.title.textContent=displayBySong[id]?.title||(selected.querySelector('strong')?.textContent||'음악');
   const desc=selected.querySelector('small')?.textContent||'';
   const star=desc.match(/★+/)?.[0]||'★★★';
   const name=desc.replace(/★+\s*/, '').replace(/\s*·\s*준비 중/,'');
   controls.stars.textContent=star;
   controls.subtitle.textContent=displayBySong[id]?.detail||(name.length>42?name.slice(0,42)+'…':name);
   controls.position.textContent=`EASY · ${String(index+1).padStart(2,'0')} / ${String(buttons.length).padStart(2,'0')}`;
   controls.credits.innerHTML=credits(id);
   controls.vinyl.dataset.song=id;
   controls.vinyl.classList.toggle('rh-moonlight',id.includes('moonlight'));
      byId('rhPlay').disabled=false;
   const s=stats();controls.best.textContent=s.count?fmt(s.best):'—';controls.combo.textContent=s.count?fmt(s.maxCombo):'—';controls.plays.textContent=fmt(s.count);
   const title=byId('ovTitle').textContent;
   const ended=/STAGE CLEAR|FULL COMBO|MASTER!/.test(title);
   controls.result.hidden=!ended;
   if(ended)controls.result.textContent=`${title} · ${byId('ovDesc').textContent.slice(0,95)}`;
   byId('rhPlayHint').textContent=ended?'다시 연주하기':'선택한 음악 연주 시작';
 }
 function scheduleRefresh(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;refresh()})}
 new MutationObserver(scheduleRefresh).observe(catalog,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
 new MutationObserver(scheduleRefresh).observe(byId('ovTitle'),{subtree:true,childList:true,characterData:true});
 new MutationObserver(()=>{if(overlay.hidden){closePanel();controls.vinyl.classList.remove('rh-spin')}else scheduleRefresh()}).observe(overlay,{attributes:true,attributeFilter:['hidden']});
 function changeSong(delta){const {buttons,index}=getSelection();if(!buttons.length)return;const next=buttons[(index+delta+buttons.length)%buttons.length];
  // Proxy to the ORIGINAL .songBtn, ensuring no new parallel track state.
  next.click();scheduleRefresh();}
 // A swipe starting ON the vinyl changes songs only. The rest of each page
 // behaves like two smartphone home screens; the five-item footer never moves.
 function pointerSwipe(el,{onSwipe,ignore=()=>false,move=null}){
  let state=null;
  el.addEventListener('pointerdown',e=>{if(e.button!==0||ignore(e))return;state={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0};try{el.setPointerCapture(e.pointerId)}catch(_){/* keyboard/synthetic pointer */}});
  el.addEventListener('pointermove',e=>{if(!state||e.pointerId!==state.id)return;state.dx=e.clientX-state.x;state.dy=e.clientY-state.y;
   if(move&&Math.abs(state.dx)>Math.abs(state.dy)*1.15)move(state.dx);
  });
  function end(e,cancel=false){if(!state||e.pointerId!==state.id)return;const dx=e.clientX-state.x,dy=e.clientY-state.y;state=null;try{if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId)}catch(_){}
   if(move)move(0);if(!cancel&&Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2)onSwipe(dx<0?1:-1);
  }
  el.addEventListener('pointerup',e=>end(e));el.addEventListener('pointercancel',e=>end(e,true));
 }
 const recordZone=byId('rhRecordZone');
 pointerSwipe(recordZone,{onSwipe:delta=>{changeSong(delta);recordZone.classList.remove('rh-swipe-bounce');void recordZone.offsetWidth;recordZone.classList.add('rh-swipe-bounce');},move:dx=>recordZone.style.setProperty('--rh-drag-x',Math.max(-44,Math.min(44,dx*.20))+'px')});
 recordZone.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();changeSong(e.key==='ArrowLeft'?-1:1)}});
 const rail=byId('rhPageTrack'),easy=byId('rhEasyPage'),hard=byId('rhHardPage');
 let activePage=0;
 function setPage(next){activePage=Math.max(0,Math.min(1,next));rail.style.setProperty('--rh-page',activePage);rail.style.removeProperty('--rh-page-drag');
  hard.setAttribute('aria-hidden',String(activePage!==1));easy.setAttribute('aria-hidden',String(activePage!==0));
  hard.inert=activePage!==1;easy.inert=activePage!==0;
 }
 for(const page of [easy,hard])pointerSwipe(page,{ignore:e=>!!e.target.closest('.rh-record-zone,button,input,select,textarea,a,.rh-drawer-backdrop'),onSwipe:delta=>setPage(activePage+delta),move:dx=>{
   const width=Math.max(300,byId('rhPageWindow').clientWidth);const desired=Math.max(-width,Math.min(0,-activePage*width+dx*.55));rail.style.setProperty('--rh-page-drag',desired+'px');
  }});
 hard.querySelector('.rh-hard-wallet').addEventListener('click',()=>openPanel('coin'));
 setPage(0);
 byId('rhPlay').addEventListener('click',()=>{byId('auto').checked=false;byId('start').click()});
 byId('rhDemo').addEventListener('click',()=>{byId('autoDemo').click()});
 byId('rhPreview').addEventListener('click',()=>{
   if(!getSelection().selected)return;
   byId('previewPlay').click();
   const previewing=byId('previewPlay').textContent.includes('일시정지');
   controls.vinyl.classList.toggle('rh-spin',previewing);
   controls.preview.textContent=previewing?'Ⅱ 미리듣기 멈추기':'♫ 곡 미리듣기';
 });
 const safeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const info=(title,body)=>`<div class="rh-info-card"><strong>${title}</strong>${body}</div>`;
 const titles={character:'캐릭터',shop:'상점',coin:'코인 획득소',records:'내 기록',settings:'설정'};
 function panelHtml(type){
   const s=stats(),all=Object.values(readRecords()).filter(r=>r&&typeof r==='object');
   const coinHeader='<div class="rh-banner">◉ 현재 코인 <b>0</b><br><small>게임 공통 코인 서비스는 아직 연동 전이야.</small></div>';
   if(type==='character')return `${info('현재 연주자', '<div class="rh-option"><div class="rh-art" aria-hidden="true">♫</div><div><b>기본 연주자</b><br><span class="rh-muted">현재 선택된 플레이어 · 변경 기능 준비 중</span></div></div>')}${info('캐릭터 보관함','<div class="rh-muted">캐릭터·의상·악기 외형은 향후 상점과 연결될 예정이야. 지금은 기본 연주자로 플레이할 수 있어.</div>')}`;
   if(type==='shop')return coinHeader+info('악기 · 건반 스킨','<span class="rh-muted">피아노·기타 등 악기 스킨과 타격 효과 슬롯. 상품·가격은 미정이며 실제 구매 기능은 없어.</span>')+info('노트 · 무대 꾸미기','<span class="rh-muted">노트 색상·판정 이펙트·무대 배경 꾸미기 상품은 추후 추가될 예정이야.</span>')+info('캐릭터 · 코스튬','<span class="rh-muted">캐릭터 의상과 외형 상품 준비 중. 보관함/결제 연동 전이야.</span>');
   if(type==='coin')return coinHeader+info('무료로 얻기','<span class="rh-muted">플레이 보상과 레벨 보상은 아직 설계 중이야. 현재 게임 점수를 코인으로 변환하거나 지급하지 않아.</span>')+info('▶ 보상형 광고','<button type="button" class="rh-action" disabled>광고 시청 · 연결 준비 중</button><span class="rh-muted">광고를 실제로 시청하고 검증한 뒤에만 보상을 지급하도록 구현할 예정이야.</span>')+info('코인 구매','<span class="rh-muted">실제 결제 기능 없음 · 가격과 상품은 미정.</span>');
   if(type==='records')return `<div class="rh-banner">🏆 최고 점수 <b>${fmt(Math.max(0,...all.map(r=>Number(r.best)||0)))}</b></div>${info('선택한 곡',`<span>최고 점수 ${fmt(s.best)} · 최대 콤보 ${fmt(s.maxCombo)} · ${fmt(s.count)}회 플레이${s.master?' · 👑 MASTER':''}</span>`)}${info('전체 기록',`누적 플레이 ${fmt(all.reduce((a,r)=>a+(Number(r.count)||0),0))}회<br>곡별 기록은 지금까지의 브라우저 로컬 데이터에 저장돼.`)}${info('기록 보관','<span class="rh-muted">현재 기기에 저장되며, 로그아웃이나 브라우저 데이터 삭제 시 사라질 수 있어. 원래 기록은 그대로 유지해.</span>')}`;
   if(type==='settings')return `${info('음악 · 타격음',`<label>음악 볼륨 <b id="rhMusicText">${byId('songVolume').value}%</b><input id="rhMusicVolume" type="range" min="0" max="100" value="${byId('songVolume').value}"></label><label>타격음 볼륨 <b id="rhFxText">${byId('fxVolume').value}%</b><input id="rhFxVolume" type="range" min="0" max="100" value="${byId('fxVolume').value}"></label><div class="rh-option"><span>타격음 켜기</span><input id="rhSfxToggle" type="checkbox" ${byId('sfx').checked?'checked':''}></div><div class="rh-option"><span>진동 켜기</span><input id="rhHapticToggle" type="checkbox" ${byId('haptic').checked?'checked':''}></div>`)}${info('연습 · 판정',`<div class="rh-option"><span>연습 재생 속도</span><select id="rhRate"><option value="0.75" ${byId('rateSelect').value==='0.75'?'selected':''}>75%</option><option value="0.85" ${byId('rateSelect').value==='0.85'?'selected':''}>85%</option><option value="1" ${byId('rateSelect').value==='1'?'selected':''}>100%</option></select></div><label>판정 타이밍 보정 <b id="rhOffsetText">${byId('offset').value}ms</b><input id="rhOffset" type="range" min="-150" max="150" step="5" value="${byId('offset').value}"></label>`)}${info('곡 · 채보 관리','<span class="rh-muted">기존 음원 추가, 채보 편집, MIDI 음높이 꼬리표, JSON 내보내기는 그대로 유지해.</span><button type="button" class="rh-action" id="rhAdvanced">곡·채보 고급 관리 열기</button>')}`;
   return '';
 }
 function syncInput(from,to,event='input'){const f=byId(from),t=byId(to);if(!f||!t)return;f.addEventListener(event,()=>{t[t.type==='checkbox'?'checked':'value']=f[f.type==='checkbox'?'checked':'value'];t.dispatchEvent(new Event(event,{bubbles:true}));const tx=byId(from==='rhMusicVolume'?'rhMusicText':from==='rhFxVolume'?'rhFxText':from==='rhOffset'?'rhOffsetText':'');if(tx)tx.textContent=f.value+(from==='rhOffset'?'ms':'%')})}
 function openPanel(type){if(!titles[type])return;byId('rhDrawerTitle').textContent=titles[type];controls.panelBody.innerHTML=panelHtml(type);controls.panel.hidden=false;byId('rhClose').focus();
   if(type==='settings'){
    syncInput('rhMusicVolume','songVolume');syncInput('rhFxVolume','fxVolume');syncInput('rhOffset','offset');syncInput('rhSfxToggle','sfx','change');syncInput('rhHapticToggle','haptic','change');syncInput('rhRate','rateSelect','change');
    byId('rhAdvanced').addEventListener('click',()=>{closePanel();byId('openLab2').click()});
   }
 }
 function closePanel(){controls.panel.hidden=true;controls.panelBody.replaceChildren()}
 byId('rhClose').addEventListener('click',closePanel);
 controls.panel.addEventListener('click',e=>{if(e.target===controls.panel)closePanel()});
 home.querySelectorAll('[data-rh-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.rhPanel)));
 byId('rhWallet').addEventListener('click',()=>openPanel('coin'));
 document.addEventListener('keydown',e=>{if(!overlay.hidden&&e.key==='Escape'&&!controls.panel.hidden){e.stopImmediatePropagation();closePanel()}});
 scheduleRefresh();
})();
