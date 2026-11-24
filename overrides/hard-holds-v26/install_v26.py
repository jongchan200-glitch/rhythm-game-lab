#!/usr/bin/env python3
"""V26: move V2's existing chart/id into 3-star LP, create separate 5-star CD."""
from pathlib import Path
import json,hashlib,shutil
site=Path('_site');o=Path('overrides/hard-holds-v26')
NORMAL='well_lived_hard_repeat_v21';HARD='well_lived_hard_master_v26'
def rep(s,a,b):
    assert s.count(a)==1,(a,s.count(a))
    return s.replace(a,b,1)
protected=[*sorted((site/'assets/charts').glob('*.json')),*sorted((site/'assets/audio').glob('*.mp3')),*sorted((site/'assets/keysound-v24').glob('*')),*sorted((site/'assets/keysound-hard-v26').glob('*'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
mf=site/'assets/manifest.json';m=json.loads(mf.read_text('utf8'))
ready=[t for t in m['tracks'] if t.get('status')=='ready'];assert len(ready)==8
v=next(t for t in ready if t['id']==NORMAL)
new={**v,'id':HARD,'title':'우리 꽤 잘살았네 · 버전 2 HARD','subtitle':'HARD · 양손 홀드와 반복 리듬 · 1분 26초','difficulty':5,'ruleDifficulty':5,'inputActions':8,'chart':'assets/charts/well_lived_hard_master_v26.json','origin':'V26 390판정, 18홀드와 18릴리즈, 원곡 86초. 별도 기록/코인 노트.'}
v.update(difficulty=3,ruleDifficulty=5,inputActions=8,subtitle='일반 · 반복 리듬 · 1분 26초 · 버전 2')
m['tracks'].append(new);mf.write_text(json.dumps(m,ensure_ascii=False,indent=2),'utf8')
# Catalog stars and input permissions are independent. Preserve the moved V2's
# original eight actions and 5-star health/grade rules; only display placement changes.
main=site/'scripts/main.js';s=main.read_text('utf8')
s=rep(s,'validateNotes(chart.notes||chart,t.difficulty)','validateNotes(chart.notes||chart,Number(t.inputActions)>=8?5:t.difficulty)')
s=rep(s,'validateNotes(data.notes,t.difficulty)','validateNotes(data.notes,Number(t.inputActions)>=8?5:t.difficulty)')
s=rep(s,'current.difficulty>=4||lane===0||lane===3','Number(current.inputActions)>=8||current.difficulty>=4||lane===0||lane===3')
# Preserve editor/import validation as well as the catalog load.
s=s.replace('validateNotes(Array.isArray(obj)?obj:obj.notes,current.difficulty)','validateNotes(Array.isArray(obj)?obj:obj.notes,Number(current.inputActions)>=8?5:current.difficulty)')
# Actual editor variable is arr assigned from validateNotes(Array.isArray(obj)?obj:obj.notes...)
s=s.replace('validateNotes(Array.isArray(d)?d:d.notes,current.difficulty)','validateNotes(Array.isArray(d)?d:d.notes,Number(current.inputActions)>=8?5:current.difficulty)')
s=s.replace('validateNotes([...current.chart,n],current.difficulty)','validateNotes([...current.chart,n],Number(current.inputActions)>=8?5:current.difficulty)')
main.write_text(s,'utf8')
addon=site/'scripts/easy-v7-addon.js';s=addon.read_text('utf8')
s=rep(s,'current?.difficulty || 3','current?.ruleDifficulty || current?.difficulty || 3')
addon.write_text(s,'utf8')
# Existing record ID and score cap stay exactly the same. Preserve the actual old
# coin count, but new HARD has its own independent ID and normal HARD reward rules.
coin=site/'scripts/coin-v18.js';s=coin.read_text('utf8')
s=rep(s,'const count=Number(current.difficulty)<=3?','const count=current.id==="well_lived_hard_repeat_v21"?20:Number(current.difficulty)<=3?')
coin.write_text(s,'utf8')
home=site/'scripts/home-v14.js';s=home.read_text('utf8')
s=rep(s,"well_lived_easy_v19:{title:'우리 꽤 잘살았네',detail:'절정~완결 · EASY · 1분 26초'}","well_lived_easy_v19:{title:'우리 꽤 잘살았네',detail:'절정~완결 · EASY · 1분 26초'},\n  well_lived_hard_repeat_v21:{title:'우리 꽤 잘살았네 버전 2',detail:'반복 리듬 · 일반 · 1분 26초'}")
s=rep(s,"well_lived_easy_v19:{original:'사용자 제공 음원',producer:'한울'}","well_lived_easy_v19:{original:'사용자 제공 음원',producer:'한울'},\n  well_lived_hard_repeat_v21:{original:'사용자 제공 음원',producer:'한울'}")
home.write_text(s,'utf8')
hard=site/'scripts/tonight-home-v16.js';s=hard.read_text('utf8')
s=rep(s,'well_lived_hard_repeat_v21:0','well_lived_hard_master_v26:0')
s=rep(s,"const names={well_lived_hard_repeat_v21:'우리 꽤 잘살았네 버전\u00a02'","const names={well_lived_hard_master_v26:'우리 꽤 잘살았네 버전 2 HARD'")
s=rep(s,'const credits={well_lived_hard_repeat_v21:','const credits={well_lived_hard_master_v26:')
s=rep(s,"id==='well_lived_hard_repeat_v21'?'반복 패턴 · 버전 2 · 1분 26초'","id==='well_lived_hard_master_v26'?'390판정 · 양손 홀드 · 1분 26초'")
s=rep(s,"selected.dataset.song!=='well_lived_hard_repeat_v21'","selected.dataset.song!=='well_lived_hard_master_v26'")
hard.write_text(s,'utf8')
preview=site/'scripts/album-autoplay-v22.js';s=preview.read_text('utf8')
s=rep(s,"id==='well_lived_hard_repeat_v21'?8.15","['well_lived_hard_repeat_v21','well_lived_hard_master_v26'].includes(id)?8.15")
preview.write_text(s,'utf8')
# Clarify the left page's role, retaining the same layout and action.
ui=site/'scripts/mobile-v23.js';s=ui.read_text('utf8')
s=rep(s,"['EASY','HARD']","['일반','HARD']")
ui.write_text(s,'utf8')
shutil.copy2(o/'keysounds-v26.js',site/'scripts/drum-keysound-v24.js')
h=site/'index.html';s=h.read_text('utf8')
for a in ['main.js?v24','easy-v7-addon.js?v18','coin-v18.js?v18','home-v14.js?v23','tonight-home-v16.js?v22','album-autoplay-v22.js?v22','mobile-v23.js?v23','drum-keysound-v24.js?v25']:
    s=rep(s,a,a.split('?')[0]+'?v26')
h.write_text(s,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
assert len([t for t in m['tracks'] if t.get('status')=='ready'])==9
assert v['chart']=='assets/charts/well_lived_hard_repeat_v21.json' and v['base']==30000
print('V26_NORMAL_V2_UNCHANGED_240_NEW_HARD_390_9_TRACKS_EXISTING_AUDIO_CHARTS_PRESERVED')
