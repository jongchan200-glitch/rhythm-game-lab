#!/usr/bin/env python3
"""Add '우리 꽤 잘살았네 버전 2' as a separate, playable HARD CD.
Runs after V20; reuses its complete 86-second climax sound untouched.
The old HARD chart, seven existing tracks, and local score/coin keys survive.
"""
from pathlib import Path
import json, os, hashlib, base64, gzip
SITE=Path(os.getenv('RHYTHM_SITE','_site'))
SRC=Path(os.getenv('RHYTHM_V21_SOURCE','overrides/repeat-hard-v21/well_lived_hard_repeat_v21.json.gz.b64'))
CHART_SHA256='27b667f8c6db1ffa0fa90d8f0797b3cc81b0c808ddc92373f4aedbdb9a2d6d1d'
CHART_NAME='well_lived_hard_repeat_v21.json'
TRACK_ID='well_lived_hard_repeat_v21'

def once(s,a,b,label):
    matches=s.count(a)
    assert matches==1,(label,matches)
    return s.replace(a,b,1)

raw=gzip.decompress(base64.b64decode(SRC.read_text(encoding='ascii')))
assert hashlib.sha256(raw).hexdigest()==CHART_SHA256, 'V21 chart SHA256 mismatch'
chart=json.loads(raw.decode('utf-8'))
notes=chart['notes']
assert chart['sourceSliceSeconds']==[151.2,237.2] and chart['difficulty']==5
assert chart['repeatStructure']=='AAAABBBBAAAABBCCCC' and len(chart['motifSections'])==18
assert len(notes)==240 and sum(n['kind']=='flick' for n in notes)==40
assert all(n['kind'] in ('tap','flick') and 0<=n['lane']<4 and n['pitch']==n['sound']['midi'] for n in notes)
assert (SITE/'assets/audio/well_lived_climax_v20.mp3').is_file()
assert (SITE/'assets/charts/well_lived_hard_v20.json').is_file()
dst=SITE/'assets/charts'/CHART_NAME
assert not dst.exists(),dst
dst.write_bytes(raw)

mfile=SITE/'assets/manifest.json'
m=json.loads(mfile.read_text(encoding='utf-8'))
ready=[x for x in m['tracks'] if x.get('status')=='ready']
expected=['deathmatch_one_take_v12','moonlight_intro_rock_v4_3','moonlight_epic_rock_v2_5',
          'tonight_easy_v16','tonight_hard_v16','well_lived_easy_v19','well_lived_hard_v19']
assert [x['id'] for x in ready]==expected
assert m['version']=='2.4.0-v15-hold-release-playtest'
old=next(x for x in ready if x['id']=='well_lived_hard_v19')
assert old['audio']=='assets/audio/well_lived_climax_v20.mp3'
assert old['chart']=='assets/charts/well_lived_hard_v20.json'
track={
 'id':TRACK_ID,'title':'우리 꽤 잘살았네 · 버전 2',
 'subtitle':'반복 리듬 HARD · A×4 → B×4 → A×4 → B×2 → C×4 · 1분 26초 · V21 TEST',
 'composer':old.get('composer','사용자 제공 원곡'),
 'producer':old.get('producer','한울'),
 'difficulty':5,'bpm':old['bpm'],'base':old['base'],
 'preRoll':0,'duration':old['duration'],
 'audio':old['audio'],'chart':'assets/charts/'+CHART_NAME,
 'color':'#db9afa','status':'ready','inputActions':old.get('inputActions',8),
 'soundBank':old.get('soundBank','note-sound-v11-track-specific'),
 'origin':'V20 86초 원곡 절정/엔딩 사용. 음악 변형 없이 판정 노트만 반복 리듬 A-B-A-B-C 순서로 다시 채보한 HARD V2 별도 실험곡.',
 'licenseNote':'사용자 제공 원본 음원에서 만든 HARD 차트 실험판. 별도의 아티스트/원작권자 확정 표기 없음.'
}
m['tracks'].append(track)
mfile.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')

home=SITE/'scripts/tonight-home-v16.js'
s=home.read_text(encoding='utf-8')
s=once(s,
 'const order={well_lived_hard_v19:0,tonight_hard_v16:1,moonlight_epic_rock_v2_5:2};',
 'const order={well_lived_hard_repeat_v21:0,well_lived_hard_v19:1,tonight_hard_v16:2,moonlight_epic_rock_v2_5:3};',
 'new first HARD disc')
s=once(s,
 "const names={well_lived_hard_v19:'우리 꽤 잘살았네',",
 "const names={well_lived_hard_repeat_v21:'우리 꽤 잘살았네 버전 2',well_lived_hard_v19:'우리 꽤 잘살았네',",
 'new HARD CD printed title')
s=once(s,
 'const credits={well_lived_hard_v19:',
 "const credits={well_lived_hard_repeat_v21:'<span>원곡 <b>사용자 제공</b></span><span>제작 <b>한울</b></span>',well_lived_hard_v19:",
 'HARD V2 credits')
s=once(s,
 "id==='well_lived_hard_v19'?'절정~엔딩 · 1분 26초 · HARD'",
 "id==='well_lived_hard_repeat_v21'?'반복 패턴 · 버전 2 · 1분 26초':(id==='well_lived_hard_v19'?'절정~엔딩 · 1분 26초 · HARD'",
 'HARD V2 descriptor initial')
# Above wraps a second ternary inside the existing ternary; close it once.
s=once(s,
 "'HARD · CLASSIC REMIX');",
 "'HARD · CLASSIC REMIX'));",
 'HARD V2 descriptor close')
s=once(s,
 "selected.dataset.song!=='well_lived_hard_v19'",
 "selected.dataset.song!=='well_lived_hard_repeat_v21'&&selected.dataset.song!=='well_lived_hard_v19'",
 'preserve EASY album on page switch')
home.write_text(s,encoding='utf-8')

html=SITE/'index.html';h=html.read_text(encoding='utf-8')
assert 'scripts/tonight-home-v16.js?v20' in h
h=once(h,'scripts/tonight-home-v16.js?v20','scripts/tonight-home-v16.js?v21','cache-bust HARD CD')
html.write_text(h,encoding='utf-8')
print('V21_REPEAT_HARD_V2_ADDED',TRACK_ID,len(notes),'new score wallet and CD, original 7 tracks preserved')
