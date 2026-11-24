#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,shutil
s=Path('_site');o=Path('overrides/drum-v3-v28');ID='well_lived_drum_v3_v28'
def rep(t,a,b):
 assert t.count(a)==1,(a,t.count(a));return t.replace(a,b,1)
files=[*sorted((s/'assets/audio').glob('*.mp3')),*sorted((s/'assets/charts').glob('*.json')),*sorted((s/'assets/keysound-stem-v27').glob('*')),*sorted((s/'assets/keysound-hard-v26').glob('*'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
m=s/'assets/manifest.json';manifest=json.loads(m.read_text('utf8'));old=json.loads(m.read_text('utf8'))
tracks=manifest['tracks'];n=next(t for t in tracks if t['id']=='well_lived_hard_repeat_v21')
meta=json.loads((s/'assets/drum-v3-v28/map.json').read_text('utf8'))
assert len([t for t in tracks if t.get('status')=='ready'])==9
v={**n,'id':ID,'title':'우리 꽤 잘살았네 · 버전 3','subtitle':'DRUM PLAY · 전체 드럼 연주 · 1분 26초','difficulty':3,'ruleDifficulty':3,'inputActions':6,'base':15000,'chart':'assets/charts/well_lived_drum_v3_v28.json','soundBank':'continuous-demucs-drums-v28','origin':'V28 AI 분리 드럼 전체를 연주하는 별도 일반곡. 두 엄지 TAP. 원본 반주+드럼 동일 오디오 시간축.'}
tracks.append(v);m.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),'utf8')
assert tracks[:-1]==old['tracks']
home=s/'scripts/home-v14.js';t=home.read_text('utf8')
t=rep(t,"well_lived_hard_repeat_v21:{title:'우리 꽤 잘살았네 버전 2',detail:'V27 실제 드럼 연주 · 일반 · 1분 26초'}","well_lived_hard_repeat_v21:{title:'우리 꽤 잘살았네 버전 2',detail:'V27 실제 드럼 연주 · 일반 · 1분 26초'},\n  well_lived_drum_v3_v28:{title:'우리 꽤 잘살았네 버전 3',detail:'DRUM PLAY · 전체 드럼 · 1분 26초'}")
t=rep(t,"well_lived_hard_repeat_v21:{original:'사용자 제공 음원',producer:'한울'}","well_lived_hard_repeat_v21:{original:'사용자 제공 음원',producer:'한울'},\n  well_lived_drum_v3_v28:{original:'사용자 제공 음원',producer:'한울'}")
home.write_text(t,'utf8')
prev=s/'scripts/drum-keysound-v24.js';t=prev.read_text('utf8')
# V27's captured oldHit bypasses the outer playHit wrapper for other-song auto.
# Explicitly exclude V3; leave all existing routes unchanged.
t=rep(t,"if(auto&&playing&&autoplay&&n.kind!=='release')oldHit","if(auto&&playing&&autoplay&&current?.id!=='well_lived_drum_v3_v28'&&n.kind!=='release')oldHit")
prev.write_text(t,'utf8')
shutil.copy2(o/'continuous-drums-v28.js',s/'scripts/continuous-drums-v28.js')
h=s/'index.html';t=h.read_text('utf8')
for a in ['scripts/home-v14.js?v27','scripts/drum-keysound-v24.js?v27']:t=rep(t,a,a.split('?')[0]+'?v28')
t=rep(t,'</body>','<script defer src="scripts/continuous-drums-v28.js?v28"></script></body>')
h.write_text(t,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
assert meta['songId']==ID and meta['metrics']['notes']>=180
print('V28_NEW_NORMAL_V3_ONLY_EXISTING_9_TRACKS_AND_ASSETS_UNCHANGED')
