#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,shutil
s=Path('_site');o=Path('overrides/stem-keysound-v27')
N='well_lived_hard_repeat_v21'
def rep(t,a,b):
    assert t.count(a)==1,(a,t.count(a))
    return t.replace(a,b,1)
files=[*sorted((s/'assets/audio').glob('*.mp3')),*sorted((s/'assets/charts').glob('*.json')),*sorted((s/'assets/keysound-v24').glob('*')),*sorted((s/'assets/keysound-hard-v26').glob('*'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
m=s/'assets/manifest.json';data=json.loads(m.read_text('utf8'));tracks=data['tracks']
old=json.loads(m.read_text('utf8'))
n=next(t for t in tracks if t['id']==N)
meta=json.loads((s/'assets/keysound-stem-v27/map.json').read_text('utf8'))
assert meta['model']=='htdemucs' and meta['version']==27
assert n['difficulty']==3 and n['ruleDifficulty']==5
n.update(chart='assets/charts/well_lived_normal_stem_v27.json',subtitle='V27 실제 드럼 분리 · 일반 · 1분 26초',soundBank='demucs-drum-stem-v27')
assert all(a==b for a,b in zip(old['tracks'],tracks) if a['id']!=N)
m.write_text(json.dumps(data,ensure_ascii=False,indent=2),'utf8')
home=s/'scripts/home-v14.js';h=home.read_text('utf8')
h=rep(h,"well_lived_hard_repeat_v21:{title:'우리 꽤 잘살았네 버전 2',detail:'반복 리듬 · 일반 · 1분 26초'}","well_lived_hard_repeat_v21:{title:'우리 꽤 잘살았네 버전 2',detail:'V27 실제 드럼 연주 · 일반 · 1분 26초'}")
home.write_text(h,'utf8')
shutil.copy2(o/'keysounds-v27.js',s/'scripts/drum-keysound-v24.js')
shutil.copy2(o/'audio-check-v27.html',s/'audio-check-v27.html')
html=s/'index.html';h=html.read_text('utf8')
for a in ('scripts/home-v14.js?v26','scripts/drum-keysound-v24.js?v26'):
    h=rep(h,a,a.split('?')[0]+'?v27')
html.write_text(h,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
print('V27_ONLY_NORMAL_V2_MANIFEST_POINTER_CHANGED_OTHER_EIGHT_TRACKS_AND_ALL_OLD_ASSETS_IDENTICAL')
