#!/usr/bin/env python3
"""Install two independent cuts/charts, and unlock HARD home for testing.

Runs after V15's original music and the entire existing scoring engine are verified.
V15 and historical songs remain exactly as-is. Score and record keys are unchanged.
"""
from pathlib import Path
import json,shutil,hashlib
SITE=Path('_site')
ASSET=Path('/tmp/tonight-v16/assets')
for mode in ('easy','hard'):
    id=f'tonight_{mode}_v16'
    for sub,ext in [('audio','mp3'),('charts','json')]:
        src=ASSET/sub/f'{id}.{ext}'
        dst=SITE/'assets'/sub/src.name
        assert src.is_file() and src.stat().st_size>1000,src
        shutil.copy2(src,dst)

man=SITE/'assets/manifest.json'
m=json.loads(man.read_text(encoding='utf-8'))
assert m['version']=='2.4.0-v15-hold-release-playtest'
ready=[t for t in m['tracks'] if t.get('status')=='ready']
assert [t['id'] for t in ready]==['deathmatch_one_take_v12','moonlight_intro_rock_v4_3','moonlight_epic_rock_v2_5']
from itertools import count
for mode,start,end,stars,base,color in [
    ('easy',115.52,183.63,3,15000,'#ba9fe2'),
    ('hard',183.57,250.16,5,30000,'#70d7f4'),
]:
    id=f'tonight_{mode}_v16'
    ch=json.loads((SITE/'assets/charts'/f'{id}.json').read_text(encoding='utf8'))
    assert ch['schemaVersion']==1 and ch['difficulty']==stars
    assert ch['sourceSliceSeconds']==[start,end]
    n=ch['notes'];assert len(n)>95 if mode=='easy' else len(n)>190
    assert all(x['kind'] in ('tap','flick') and 0<=x['lane']<=3 for x in n)
    assert all(x['lane'] in (0,3) for x in n if x['kind']=='flick') if mode=='easy' else True
    track={'id':id,'title':'오늘밤도' + (' · EASY' if mode=='easy' else ' · HARD'),
      'subtitle':f'{"LP · 중반부" if mode=="easy" else "CD · 후반부"} 연속 {end-start:.1f}초 · {"★"*stars} · V16 TEST',
      'composer':'챨스','lyricist':'챨스','producer':'한울','difficulty':stars,'bpm':129.6,
      'base':base,'preRoll':0,'duration':round(end-start,3),
      'audio':f'assets/audio/{id}.mp3','chart':f'assets/charts/{id}.json',
      'color':color,'status':'ready','inputActions':6 if mode=='easy' else 8,
      'soundBank':'note-sound-v11-track-specific','origin':f'오늘밤도 원본 {start:.2f}~{end:.2f}초; 1회 연속 트림·간단한 끝 페이드',
      'licenseNote':'사용자 제공 WAV에서 채보·편집한 시험판. 생성 방식/상업 라이선스 검토는 출시 전 별도.'}
    m['tracks'].append(track)
# Keep version unchanged so personal V15 chart edits remain recognized.
man.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf8')

home=SITE/'scripts/home-v14.js'
s=home.read_text(encoding='utf-8')
def replace_one(old,new,key):
    global s
    assert s.count(old)==1,(key,s.count(old));s=s.replace(old,new,1)
replace_one("  moonlight_intro_rock_v4_3:{title:'월광 소나타',detail:'도입부 · EASY'}", "  moonlight_intro_rock_v4_3:{title:'월광 소나타',detail:'도입부 · EASY'},\n  tonight_easy_v16:{title:'오늘밤도',detail:'중반부 · EASY · 1분 08초'}",'easy metadata')
replace_one("  moonlight_epic_rock_v2_5:{original:'L. van Beethoven',producer:'한울'}", "  moonlight_epic_rock_v2_5:{original:'L. van Beethoven',producer:'한울'},\n  tonight_easy_v16:{lyricist:'챨스',composer:'챨스',producer:'한울'},\n  tonight_hard_v16:{lyricist:'챨스',composer:'챨스',producer:'한울'}",'credits')
# Without this fix, V14 forcibly re-selects an EASY track whenever HARD is selected.
replace_one("if(!buttons.some(b=>b.classList.contains('selected'))){buttons[0].click();return}",
    "if(!buttons.some(b=>b.classList.contains('selected'))&&activePage===0){buttons[0].click();return}", 'hard selection stability')
replace_one('<div class="rh-cd-stage"><div class="rh-compact-disc">',
    '<div class="rh-cd-stage" id="rhHardDiscZone" role="group" tabindex="0" aria-label="HARD CD를 밀어 음악 변경"><div class="rh-compact-disc">', 'disc zone')
replace_one('<strong>데스매치</strong><small>★★★★★</small>',
    '<strong id="rhHardTitle">오늘밤도</strong><small id="rhHardStars">★★★★★</small>','hard title')
replace_one('<span class="rh-record-kicker rh-hard-kicker">HARD • SIDE B</span><div class="rh-hard-lock-title">HARD MODE <span>LOCKED</span></div><div class="rh-credits"><span>작사·작곡 <b>챨스</b></span><span>제작 <b>한울</b></span></div><p class="rh-hard-status">하드 스테이지 준비 중</p>',
    '<span class="rh-record-kicker rh-hard-kicker" id="rhHardPosition">HARD · 01 / 02</span><div class="rh-hard-lock-title">HARD MODE <span>TEST PLAY</span></div><div id="rhHardInfo" class="rh-song-sub">후반부 · HARD</div><div class="rh-credits" id="rhHardCredits"><span>작사·작곡 <b>챨스</b></span><span>제작 <b>한울</b></span></div>', 'hard header')
replace_one('<div class="rh-hard-placeholder" aria-label="앞으로 추가될 잠긴 앨범">더 많은 앨범은 추후 공개</div>',
    '<button type="button" class="rh-preview" id="rhHardPreview">♫ 곡 미리듣기</button>', 'hard preview')
replace_one('<div class="rh-stats rh-hard-stats"><div class="rh-stat"><small>BEST SCORE</small><b>—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>MAX COMBO</small><b>—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>PLAY COUNT</small><b>0</b></div></div><button type="button" class="rh-main-play rh-hard-play" disabled><span class="rh-play-tri">🔒</span><span><strong>아직 잠겨 있어요</strong><small>HARD · ★★★★ ~ ★★★★★</small></span></button>',
    '<div class="rh-stats rh-hard-stats"><div class="rh-stat"><small>BEST SCORE</small><b id="rhHardBest">—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>MAX COMBO</small><b id="rhHardCombo">—</b></div><div class="rh-stat-divider"></div><div class="rh-stat"><small>PLAY COUNT</small><b id="rhHardPlays">0</b></div></div><div class="rh-play-line"><button id="rhHardPlay" type="button" class="rh-main-play rh-hard-play"><span class="rh-play-tri">▶</span><span><strong>HARD 시작하기</strong><small>선택한 HARD 앨범 연주</small></span></button><button id="rhHardDemo" type="button" class="rh-demo rh-hard-demo">▶ 자동<br>시연</button></div>', 'hard play/stats')
home.write_text(s,encoding='utf-8')

html=SITE/'index.html'
s=html.read_text(encoding='utf-8')
assert s.count('scripts/home-v14.js?v14')==1 and s.count('scripts/hold-v15.js?v15')==1
assert s.count('</head>')==1 and s.count('</body>')==1
s=s.replace('scripts/home-v14.js?v14','scripts/home-v14.js?v16',1)
s=s.replace('</head>','<link rel="stylesheet" href="scripts/tonight-home-v16.css?v16"/></head>',1)
s=s.replace('</body>','<script defer src="scripts/tonight-home-v16.js?v16"></script></body>',1)
html.write_text(s,encoding='utf-8')
print('TODAYNIGHT_V16_INSTALLED_TWO_INDEPENDENT_EXCERPTS_AND_UNLOCKED_HARD')
