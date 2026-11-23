#!/usr/bin/env python3
"""V20 revision of existing V19 '우리 꽤 잘살았네' two songs.

Replace only V19's *two* short/awkward song clips and chart paths with the SAME
continuous 86-second finale. Keep existing two song IDs and records, all other
five songs, coins, HARD health, home positions, and other assets unchanged.
"""
from pathlib import Path
import hashlib,json,shutil,os
SITE=Path(os.environ.get('RHYTHM_SITE','_site'))
SRC=Path(os.environ.get('RHYTHM_V20_ASSETS','/tmp/well-lived-v20/assets'))
CLIP='well_lived_climax_v20.mp3'
FILE_HASH='67adbbd33837f97cb5c4f66a057ebff18f2fdf0e176bc47bf3343f77ba3bc820'
assert hashlib.sha256((SRC/'audio'/CLIP).read_bytes()).hexdigest()==FILE_HASH
shutil.copy2(SRC/'audio'/CLIP,SITE/'assets/audio'/CLIP)
for name in ('well_lived_easy_v20.json','well_lived_hard_v20.json'):
    assert (SRC/'charts'/name).is_file()
    shutil.copy2(SRC/'charts'/name,SITE/'assets/charts'/name)

mfile=SITE/'assets/manifest.json';m=json.loads(mfile.read_text(encoding='utf-8'))
ready=[t for t in m['tracks'] if t.get('status')=='ready']
expected=['deathmatch_one_take_v12','moonlight_intro_rock_v4_3','moonlight_epic_rock_v2_5','tonight_easy_v16','tonight_hard_v16','well_lived_easy_v19','well_lived_hard_v19']
assert [x['id'] for x in ready]==expected
for mode,old_duration in [('easy',56.01),('hard',52.45)]:
    sid=f'well_lived_{mode}_v19';t=next(x for x in ready if x['id']==sid)
    assert abs(t['duration']-old_duration)<.1
    assert t['audio']==f'assets/audio/{sid}.mp3' and t['chart']==f'assets/charts/{sid}.json'
    newchart=f'well_lived_{mode}_v20.json'
    c=json.loads((SITE/'assets/charts'/newchart).read_text(encoding='utf-8'))
    assert c['sourceSliceSeconds']==[151.2,237.2]
    assert len(c['notes'])==(140 if mode=='easy' else 246)
    assert c['difficulty']==(3 if mode=='easy' else 5)
    t['audio']='assets/audio/'+CLIP
    t['chart']='assets/charts/'+newchart
    t['duration']=86.0
    t['bpm']=107.67
    t['subtitle']=f'원곡 절정~실제 엔딩 연속 1분 26초 · {"★★★" if mode=="easy" else "★★★★★"} · V20 RE-CUT TEST'
    t['origin']='사용자 제공 WAV 원곡 151.20~237.20초(실제 엔딩까지) 86.0초 연속 1구간 공유; 난이도별 채보만 분리. V19 기존 짧은 편집 롤백 가능.'
# The user's score and custom-chart data stay in localStorage; do not change
a=m.get('version');assert a=='2.4.0-v15-hold-release-playtest'
mfile.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')

h=SITE/'scripts/home-v14.js';s=h.read_text(encoding='utf-8')
old="well_lived_easy_v19:{title:'우리 꽤 잘살았네',detail:'중반 · EASY · 56초'}"
new="well_lived_easy_v19:{title:'우리 꽤 잘살았네',detail:'절정~완결 · EASY · 1분 26초'}"
assert s.count(old)==1;s=s.replace(old,new,1);h.write_text(s,encoding='utf-8')

h=SITE/'scripts/tonight-home-v16.js';s=h.read_text(encoding='utf-8')
old="id==='well_lived_hard_v19'?'후반 · 52초 · HARD'"
new="id==='well_lived_hard_v19'?'절정~엔딩 · 1분 26초 · HARD'"
assert s.count(old)==1;s=s.replace(old,new,1);h.write_text(s,encoding='utf-8')

h=SITE/'index.html';s=h.read_text(encoding='utf-8')
assert s.count('scripts/home-v14.js?v19')==1 and s.count('scripts/tonight-home-v16.js?v19')==1
s=s.replace('scripts/home-v14.js?v19','scripts/home-v14.js?v20',1)
s=s.replace('scripts/tonight-home-v16.js?v19','scripts/tonight-home-v16.js?v20',1)
h.write_text(s,encoding='utf-8')
print('V20_RECUT_EXISTING_V19_TWO_SONGS_TO_SHARED_NATURAL_FULL_ENDING_86S')
