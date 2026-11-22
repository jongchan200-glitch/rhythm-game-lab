#!/usr/bin/env python3
"""V18: show HARD energy; replace a few regular TAP *visuals* with full 3D coin notes.
Run at end of V17 build. No chart/audio/scoring/record-key rewriting.
"""
from pathlib import Path
SITE=Path('_site')
MAIN=SITE/'scripts/main.js'
ADDON=SITE/'scripts/easy-v7-addon.js'
HOME=SITE/'scripts/home-v14.js'
HTML=SITE/'index.html'

def rep(s,old,new,name):
    n=s.count(old)
    assert n==1,(name,n)
    return s.replace(old,new,1)

# Bring the *existing* health and grade machinery to HARD too, using already-approved
# difficulty 4/5 rules: +0.5/+0.2 or +0.3/+0.1 for successes,
# BAD -13/-18 and MISS -22/-30. Keep EASY visuals / scrubber EASY-only.
s=ADDON.read_text(encoding='utf-8')
s=rep(s,'  function showHealth(){\n    if(!isEasy())return;',
      '  function showHealth(){\n    if(!current)return;', 'hard health visibility')
for method,name,orig in [
    ('grade','grade','origGrade(delta)'),('nearest','nearest','origNearest(lane,kind)'),
    ('registerSuccess','success','origSuccess(n,delta,auto)'),('registerMiss','miss','origMiss(n)'),
    ('initGame','init','origInitGame()'),('finishGame','finish','origFinish()'),
    ('processNotes','process','origProcessNotes()')]:
    # Single exact contextual check to avoid touching any other if(!isEasy()) usage.
    prefix='  '+method+' = function('
    ix=s.index(prefix)
    start=s[ix:ix+350]
    old='if(!isEasy())'+('return' if name in ['init','finish','process'] else ' return')+' '+orig+';'
    new='if(!current)'+('return' if name in ['init','finish','process'] else ' return')+' '+orig+';'
    assert old in start,(name,old,start[:180])
    s=s[:ix]+s[ix:].replace(old,new,1)
s=rep(s,
      "    if(easy){showHealth();paintBand();document.getElementById('modeHint').textContent='EASY · SIGNATURE PIANO';}\n    else {delete field.dataset.health;delete document.body.dataset.health;}\n    const meter=document.getElementById('v9HealthMeter');\n    if(meter)meter.hidden=!easy;",
      "    if(easy){paintBand();document.getElementById('modeHint').textContent='EASY · SIGNATURE PIANO';}\n    // HARD uses the same existing health engine but keeps its own visuals.\n    if(!playing)health=100;showHealth();\n    const meter=document.getElementById('v9HealthMeter');\n    if(meter)meter.hidden=false;", 'hard switch bar')
assert "if(!isEasy())return;\n    const level" not in s
assert "if(meter)meter.hidden=false" in s
# V11 gave the V7 handler a manual playHit even though main.js's origSuccess
# now also plays the exact same note. Prevent double hit sounds on GOOD+ grades;
# BAD skips origSuccess, so it retains one explicit note sound.
s=rep(s,"    if(!auto && n.state==='pending')playHit(n.sound||n.pitch,n.kind);\n    if(n.state!=='pending')return;",
      "    if(n.state!=='pending')return;",'avoid double pitched hits in V7 and HARD')
s=rep(s,"    if(label==='BAD'){\n      n.state='done';",
      "    if(label==='BAD'){\n      if(!auto)playHit(n.sound||n.pitch,n.kind);\n      n.state='done';",'BAD single hit sound')
ADDON.write_text(s,encoding='utf-8')
print('V18_HARD_ENERGY_ENGINE_ENABLED_WITH_DIFFICULTY_5_RULES')

# Only the drawing changes, never timing/position/input. A gold token is the
# *whole* note; there is no note background with a little coin printed on it.
s=MAIN.read_text(encoding='utf-8')
anchor="    const bright=flick?'#72fff0':hold?'#b0f8ff':colors[n.lane];\n    ctx.save();"
coin=r'''    const bright=flick?'#72fff0':hold?'#b0f8ff':colors[n.lane];
    if(n.coin){
      // V18: one standalone tilted, thick-sided medallion fills the note area.
      // Replaces the TAP slab completely while keeping identical hit timing.
      const cx=x+w*.5;
      ctx.save();ctx.translate(cx,y);ctx.rotate(-.135);
      const radius=Math.max(18,w*.47);
      ctx.shadowColor='#ffcc65';ctx.shadowBlur=15;
      const edge=ctx.createLinearGradient(0,-2,0,17);
      edge.addColorStop(0,'#ffe8a0');edge.addColorStop(.45,'#cb8d2d');edge.addColorStop(1,'#7f460c');
      ctx.fillStyle=edge;ctx.beginPath();ctx.ellipse(0,5,radius,12.5,0,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      const gold=ctx.createLinearGradient(-radius,-13,radius,12);
      gold.addColorStop(0,'#fff8cf');gold.addColorStop(.24,'#ffe58b');gold.addColorStop(.55,'#edae34');gold.addColorStop(.85,'#bc7219');gold.addColorStop(1,'#fff0a4');
      ctx.fillStyle=gold;ctx.strokeStyle='#fff1bd';ctx.lineWidth=1.9;
      ctx.beginPath();ctx.ellipse(0,-2,radius,12.7,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#925017';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.ellipse(0,-2,radius*.79,9.4,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fff3b4';ctx.beginPath();ctx.ellipse(-radius*.30,-7,radius*.27,2.2,-.16,0,Math.PI*2);ctx.fill();
      // A mint mark belongs on the coin itself, NOT a coin icon on a note.
      ctx.fillStyle='#9b5914';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('★',0,-2.5);ctx.restore();
      continue;
    }
    ctx.save();'''
s=rep(s,anchor,coin,'draw full independent coin medallion')
MAIN.write_text(s,encoding='utf-8')
print('V18_STANDALONE_GOLD_COIN_NOTE_CANVAS_INSTALLED')

# Dynamic wallet in both home pages and truthful earned-currency copy. No fake shop.
s=HOME.read_text(encoding='utf-8')
s=rep(s,
  "const coinHeader='<div class=\"rh-banner\">◉ 현재 코인 <b>0</b><br><small>게임 공통 코인 서비스는 아직 연동 전이야.</small></div>';",
  "const coinHeader='<div class=\"rh-banner\">◉ 현재 코인 <b data-rh-coin-total>0</b><br><small>PERFECT로 획득한 코인은 이 기기에 저장돼.</small></div>';",
  'coin panel real earned balance')
s=rep(s,
  "플레이 보상과 레벨 보상은 아직 설계 중이야. 현재 게임 점수를 코인으로 변환하거나 지급하지 않아.",
  "EASY에는 5~6개, HARD에는 18~20개의 금화 노트가 나와. PERFECT로 성공하면 1코인씩 획득해.",
  'actual coin earning instructions')
HOME.write_text(s,encoding='utf-8')

h=HTML.read_text(encoding='utf-8')
assert h.count('</head>')==1 and h.count('</body>')==1
assert 'note-style-v17.css?v17' in h and 'tonight-home-v16.js?v16' in h
assert 'scripts/coin-v18.js?v18' not in h
h=h.replace('</head>','<link rel="stylesheet" href="scripts/coin-v18.css?v18"/></head>',1)
h=h.replace('</body>','<script defer src="scripts/coin-v18.js?v18"></script></body>',1)
# Changed already-loaded core and addon scripts must not come from a stale PWA cache.
h=h.replace('scripts/main.js?v12','scripts/main.js?v18',1)
h=h.replace('easy-v7-addon.js?v11','easy-v7-addon.js?v18',1)
h=h.replace('scripts/home-v14.js?v16','scripts/home-v14.js?v18',1)
HTML.write_text(h,encoding='utf-8')
print('V18_COIN_AND_HARD_ENERGY_SCRIPTS_LOADED_WITH_CACHE_BUSTING')
