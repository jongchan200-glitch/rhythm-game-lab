/* Rhythm Lab V13 minimalist music-selection lobby.
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
 <header class="rh-head"><div class="rh-profile"><div class="rh-avatar" aria-hidden="true">♫</div><div class="rh-profile-meta"><b>PLAYER</b><span>RHYTHM ARTIST</span></div></div><button type="button" class="rh-wallet" id="rhWallet" aria-label="코인 획득소 열기"><span class="rh-wallet-icon">◉</span><b>0</b><span class="rh-wallet-plus">+</span></button></header>
 <div class="rh-brand"><div class="rh-kicker">FEEL THE MUSIC</div><h1>RHYTHM <em>LAB</em></h1><p>THE STAGE IS YOURS</p></div>
 <section class="rh-showcase" id="rhShowcase" aria-label="음악 좌우 선택"><div class="rh-stage-line"></div><div class="rh-halo"></div>
 <div class="rh-vinyl" id="rhVinyl" aria-hidden="true"><div class="rh-vinyl-center">♫</div></div>
 <div class="rh-track-stage"><button type="button" class="rh-arrow" id="rhPrev" aria-label="이전 곡">‹</button><div class="rh-song"><div class="rh-song-tag" id="rhPosition">MUSIC SELECT</div><div class="rh-song-title" id="rhSongTitle">곡을 불러오는 중…</div><div class="rh-song-stars" id="rhStars">★★★</div><div class="rh-song-sub" id="rhSongSub">선택할 음악을 준비하고 있어</div></div><button type="button" class="rh-arrow" id="rhNext" aria-label="다음 곡">›</button></div>
 <div class="rh-side-labels"><span id="rhLeftLabel"></span><span id="rhRightLabel"></span></div><div class="rh-swipe-hint">‹ 좌우로 밀어 음악 선택 ›</div><button type="button" class="rh-preview" id="rhPreview">♫ 곡 미리듣기</button>
 </section>
 <div class="rh-bottom"><div id="rhResult" class="rh-result" role="status" hidden></div><div class="rh-stats"><div class="rh-stat"><small>PERSONAL BEST</small><b id="rhBest">—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>PLAY COUNT</small><b id="rhPlays">0</b></div></div><div class="rh-play-line"><button type="button" class="rh-main-play" id="rhPlay"><span class="rh-play-tri">▶</span><span><strong>게임 시작하기</strong><small id="rhPlayHint">선택한 음악 연주 시작</small></span></button><button type="button" class="rh-demo" id="rhDemo">▶ 자동<br/>시연</button></div><nav class="rh-nav" aria-label="게임 홈 메뉴">${nav}</nav><div class="rh-indicator" aria-hidden="true"></div></div>
 <section id="rhDrawerBackdrop" class="rh-drawer-backdrop" role="dialog" aria-modal="true" aria-label="게임 메뉴" hidden><div class="rh-drawer"><header class="rh-drawer-head"><h2 id="rhDrawerTitle">메뉴</h2><button type="button" class="rh-close" id="rhClose" aria-label="닫기">×</button></header><div id="rhDrawerBody" class="rh-drawer-body"></div></div></section>`;
 overlay.appendChild(home);
 // The original overlay lived inside the game field and could never use the
 // whole screen. Moving it doesn't invalidate main.js's stored element ref.
 document.body.appendChild(overlay);
 overlay.classList.add('rh-home-active');
 const controls={title:byId('rhSongTitle'),subtitle:byId('rhSongSub'),stars:byId('rhStars'),position:byId('rhPosition'),left:byId('rhLeftLabel'),right:byId('rhRightLabel'),best:byId('rhBest'),plays:byId('rhPlays'),result:byId('rhResult'),preview:byId('rhPreview'),vinyl:byId('rhVinyl'),panel:byId('rhDrawerBackdrop'),panelBody:byId('rhDrawerBody')};
 const fmt=n=>Number(n||0).toLocaleString('ko-KR');
 function playable(){return [...catalog.querySelectorAll('.songBtn:not([disabled])')];}
 function getSelection(){const buttons=playable();let idx=buttons.findIndex(b=>b.classList.contains('selected'));if(idx<0)idx=0;return {buttons,index:idx,selected:buttons[idx]};}
 function readRecords(){try{const x=JSON.parse(localStorage.getItem('moonlight_demo_records_v1')||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
 function stats(){const {selected}=getSelection();const r=readRecords()[selected?.dataset.song]||{};return {best:r.best||0,count:r.count||0,maxCombo:r.maxCombo||0,master:!!r.master}}
 let lastSong=null,raf=0;
 function refresh(){
   const {buttons,index,selected}=getSelection();
   if(!buttons.length){controls.title.textContent='곡을 불러오는 중…';controls.position.textContent='MUSIC SELECT';byId('rhPlay').disabled=true;return}
   const id=selected.dataset.song;
   if(lastSong!==id){controls.vinyl.classList.remove('rh-spin');controls.preview.textContent='♫ 곡 미리듣기';lastSong=id;byId('previewPlay').textContent='▶ 음악 미리듣기';}
   controls.title.textContent=selected.querySelector('strong')?.textContent||'음악';
   const desc=selected.querySelector('small')?.textContent||'';
   const star=desc.match(/★+/)?.[0]||'★★★';
   const name=desc.replace(/★+\s*/, '').replace(/\s*·\s*준비 중/,'');
   controls.stars.textContent=star;
   controls.subtitle.textContent=name.length>48?name.slice(0,48)+'…':name;
   controls.position.textContent=`MUSIC SELECT · ${index+1} / ${buttons.length}`;
   controls.left.textContent=buttons[(index-1+buttons.length)%buttons.length]?.querySelector('strong')?.textContent||'';
   controls.right.textContent=buttons[(index+1)%buttons.length]?.querySelector('strong')?.textContent||'';
   byId('rhPlay').disabled=false;
   const s=stats();controls.best.textContent=s.count?fmt(s.best):'—';controls.plays.textContent=fmt(s.count);
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
 byId('rhPrev').addEventListener('click',()=>changeSong(-1));
 byId('rhNext').addEventListener('click',()=>changeSong(1));
 let dragX=null,dragY=null;const showcase=byId('rhShowcase');
 showcase.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;dragX=e.clientX;dragY=e.clientY});
 showcase.addEventListener('pointerup',e=>{if(dragX===null)return;const dx=e.clientX-dragX,dy=e.clientY-dragY;dragX=dragY=null;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.3)changeSong(dx<0?1:-1)});
 showcase.addEventListener('pointercancel',()=>{dragX=dragY=null});
 showcase.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();changeSong(e.key==='ArrowLeft'?-1:1)}});
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
