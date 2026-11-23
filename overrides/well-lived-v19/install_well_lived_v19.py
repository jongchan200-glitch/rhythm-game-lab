#!/usr/bin/env python3
"""V19: two independent gameplay edits/charts of user-provided '우리 꽤 잘살았네..wav'.
   Install AFTER V18, never reset scores, EASY/HARD energy, coins, other chart or audio.
   Assets in /tmp/well-lived-v19/assets (extracted from versioned upload ZIP).
"""
from pathlib import Path
import json,shutil
SITE=Path('_site')
ASSET=Path('/tmp/well-lived-v19/assets')

for mode in ('easy','hard'):
    sid=f'well_lived_{mode}_v19'
    for folder,ext in (('audio','mp3'),('charts','json')):
        src=ASSET/folder/f'{sid}.{ext}'
        dst=SITE/'assets'/folder/src.name
        assert src.is_file() and src.stat().st_size>3000,src
        assert not dst.exists(),f'V19 duplicate asset: {dst}'
        shutil.copy2(src,dst)

man=SITE/'assets/manifest.json'
m=json.loads(man.read_text(encoding='utf-8'))
assert m['version']=='2.4.0-v15-hold-release-playtest','retain original user chart compatibility'
assert [t['id'] for t in m['tracks'] if t.get('status')=='ready']==[
'deathmatch_one_take_v12','moonlight_intro_rock_v4_3','moonlight_epic_rock_v2_5','tonight_easy_v16','tonight_hard_v16']
config={
 'easy':(53.14,109.15,3,15000,'#e5ad8f',6),
 'hard':(154.23,206.68,5,30000,'#8ad5df',8)
}
for mode,(start,end,diff,base,color,actions) in config.items():
    sid=f'well_lived_{mode}_v19'
    chart=json.loads((SITE/'assets/charts'/f'{sid}.json').read_text(encoding='utf-8'))
    assert chart['schemaVersion']==1 and chart['soundSchemaVersion']==1
    assert chart['sourceSliceSeconds']==[start,end] and chart['difficulty']==diff
    ns=chart['notes']
    assert len(ns)==(98 if mode=='easy' else 167)
    assert all(n['kind'] in ('tap','flick') and n['sound']['midi']==n['pitch'] for n in ns)
    assert all(n['lane'] in (0,3) for n in ns if n['kind']=='flick') if mode=='easy' else True
    m['tracks'].append({
        'id':sid,'title':'우리 꽤 잘살았네 · '+mode.upper(),
        'subtitle':('LP · 중반부 연속 56초 · ★★★ · V19 TEST' if mode=='easy' else 'CD · 후반부 연속 52초 · ★★★★★ · V19 TEST'),
        'composer':'사용자 제공 음원','difficulty':diff,'bpm':108.17,
        'base':base,'preRoll':0,'duration':round(end-start,3),
        'audio':f'assets/audio/{sid}.mp3','chart':f'assets/charts/{sid}.json',
        'color':color,'status':'ready','inputActions':actions,
        'soundBank':'note-sound-v11-track-specific',
        'origin':f'우리 꽤 잘살았네 원곡 {start:.2f}~{end:.2f}초; 연속 구간 1회 트림·종지부 짧은 페이드',
        'licenseNote':'사용자 제공 원곡. 창작자 크레딧과 상업 라이선스는 출시 전 확인. 현 단계 TEST.'
    })
man.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')

home=SITE/'scripts/home-v14.js'
s=home.read_text(encoding='utf-8')
def replace_once(text,old,new,label):
    assert text.count(old)==1,(label,text.count(old))
    return text.replace(old,new,1)
s=replace_once(s,
  "  tonight_easy_v16:{title:'오늘밤도',detail:'중반부 · EASY · 1분 08초'}",
  "  tonight_easy_v16:{title:'오늘밤도',detail:'중반부 · EASY · 1분 08초'},\n  well_lived_easy_v19:{title:'우리 꽤 잘살았네',detail:'중반 · EASY · 56초'}",
  'LP new album title')
s=replace_once(s,
  "  tonight_hard_v16:{lyricist:'챨스',composer:'챨스',producer:'한울'}",
  "  tonight_hard_v16:{lyricist:'챨스',composer:'챨스',producer:'한울'},\n  well_lived_easy_v19:{original:'사용자 제공 음원',producer:'한울'},\n  well_lived_hard_v19:{original:'사용자 제공 음원',producer:'한울'}",
  'LP new album credits')
home.write_text(s,encoding='utf-8')

hard=SITE/'scripts/tonight-home-v16.js'
s=hard.read_text(encoding='utf-8')
s=replace_once(s,
 "   const va=a.dataset.song==='tonight_hard_v16'?0:1;\n   const vb=b.dataset.song==='tonight_hard_v16'?0:1;",
 "   const order={well_lived_hard_v19:0,tonight_hard_v16:1,moonlight_epic_rock_v2_5:2};\n   const va=order[a.dataset.song]??9;\n   const vb=order[b.dataset.song]??9;",
 'HARD ordered albums')
s=replace_once(s,
 " const names={tonight_hard_v16:'오늘밤도',moonlight_epic_rock_v2_5:'월광 소나타'};",
 " const names={well_lived_hard_v19:'우리 꽤 잘살았네',tonight_hard_v16:'오늘밤도',moonlight_epic_rock_v2_5:'월광 소나타'};",
 'HARD song label')
s=replace_once(s,
 " const credits={tonight_hard_v16:'<span>작사·작곡 <b>챨스</b></span><span>제작 <b>한울</b></span>',moonlight_epic_rock_v2_5:'<span>원작곡 <b>L. van Beethoven</b></span><span>제작 <b>한울</b></span>'};",
 " const credits={well_lived_hard_v19:'<span>원곡 <b>사용자 제공</b></span><span>제작 <b>한울</b></span>',tonight_hard_v16:'<span>작사·작곡 <b>챨스</b></span><span>제작 <b>한울</b></span>',moonlight_epic_rock_v2_5:'<span>원작곡 <b>L. van Beethoven</b></span><span>제작 <b>한울</b></span>'};",
 'HARD credits')
s=replace_once(s,
 "$('rhHardInfo').textContent=id==='tonight_hard_v16'?'후렴 · 1분 07초 · HARD':'HARD · CLASSIC REMIX';",
 "$('rhHardInfo').textContent=id==='well_lived_hard_v19'?'후반 · 52초 · HARD':(id==='tonight_hard_v16'?'후렴 · 1분 07초 · HARD':'HARD · CLASSIC REMIX');",
 'HARD current details')
# On returning EASY page, a newly selected HARD song must not replace previous EASY selection.
s=replace_once(s,
 "if(selected&&selected.dataset.song!=='tonight_hard_v16'&&selected.dataset.song!=='moonlight_epic_rock_v2_5')lastEasy=selected.dataset.song;",
 "if(selected&&selected.dataset.song!=='well_lived_hard_v19'&&selected.dataset.song!=='tonight_hard_v16'&&selected.dataset.song!=='moonlight_epic_rock_v2_5')lastEasy=selected.dataset.song;",
 'keep EASY selection')
hard.write_text(s,encoding='utf-8')

html=SITE/'index.html';s=html.read_text(encoding='utf-8')
s=replace_once(s,'scripts/home-v14.js?v18','scripts/home-v14.js?v19','LP cache version')
s=replace_once(s,'scripts/tonight-home-v16.js?v16','scripts/tonight-home-v16.js?v19','HARD cache version')
html.write_text(s,encoding='utf-8')
print('V19_WELL_LIVED_TWO_SEPARATE_MUSICAL_EXCERPTS_REGISTERED_AND_PLAYABLE')
