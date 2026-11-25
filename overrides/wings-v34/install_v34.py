from pathlib import Path
import hashlib,json,re,shutil
s=Path('_site');o=Path('overrides/wings-v34');sid='wings_original_v34'
protected=[p for p in (s/'assets').rglob('*') if p.is_file() and p.name!='manifest.json']
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
def rep(t,a,b):
 assert t.count(a)==1,(a,t.count(a));return t.replace(a,b,1)
src=o/'wings-88.mp3'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='0cb63a47fb01fa1165c988b9b7555990d3cfcd0211a6b49fe4a98e179d5badfe'
shutil.copy2(src,s/'assets/audio'/f'{sid}.mp3')
# 98 BPM verified on the edited waveform, phase 0.588s; half-beat grid.
# Each eight-character phrase is a bar: 0-3 lanes, dash = rest.
# Reuse recognizable thumb patterns; no rolls faster than an eighth note.
bars=[
 '--0-2-13','031-203-','031-203-','130-312-',
 '031-203-','0-2-1-3-','0-2-1-3-','13-02-13',
 '13-02-13','0-2-1-3-','0---2---','1---3---',
 '0---2---','0-2-1-3-','031-203-','0312031-',
 '13-02-13','031-203-','0-2-13-0','0-2-13-0',
 '1-3-02-1','1-3-02-1','031-203-','031-203-',
 '0312031-','1303120-','0312031-','1303120-',
 '02130213','13021302','02130213','13021302',
 '0312031-','13-02-1-','0---2---'
]
assert all(len(x)==8 for x in bars)
notes=[]
for b,bar in enumerate(bars):
 for j,lane in enumerate(bar):
  if lane=='-':continue
  t=round(.588+(b*8+j)*30/98,4);lane=int(lane)
  if not 1<=t<86.5:continue
  pitch=[36,38,42,46][lane]
  notes.append(dict(t=t,lane=lane,kind='tap',pitch=pitch,sound=dict(instrument='synth',midi=pitch,velocity=.65,length=.15)))
assert 155<=len(notes)<=235
assert all(b['t']-a['t']>=.305 for a,b in zip(notes,notes[1:]))
assert all(0<=n['lane']<=3 for n in notes)
chart=dict(schemaVersion=1,soundSchemaVersion=1,source='날개를 펴.wav',sourceSliceSeconds=[166,254],difficulty=3,bpm=98,notes=notes,notesDesign='Full original mix; measured 98 BPM beat grid, repeated four-lane thumb motifs, light bridge and dense chorus. No hit audio.')
(s/'assets/charts'/f'{sid}.json').write_text(json.dumps(chart,ensure_ascii=False,indent=2),'utf8')
p=s/'assets/manifest.json';m=json.loads(p.read_text('utf8'));old=list(m['tracks'])
assert len([t for t in old if t.get('status')=='ready'])==10 and not any(t['id']==sid for t in old)
m['tracks'].append(dict(id=sid,title='날개를 펴',subtitle='원음 리듬 플레이 · 1분 28초',composer='사용자 제공 음원',difficulty=3,ruleDifficulty=3,bpm=98,base=15000,preRoll=0,duration=88,audio=f'assets/audio/{sid}.mp3',chart=f'assets/charts/{sid}.json',color='#a7d9df',status='ready',inputActions=4,soundBank='original-mix-haptic-only',origin='원곡 2:46~4:14 연속 편집, 실제 박자 기반 반복 채보',licenseNote='사용자 제공 음원; 출시 전 권리 및 크레딧 확인'))
p.write_text(json.dumps(m,ensure_ascii=False,indent=2),'utf8')
assert m['tracks'][:-1]==old
p=s/'scripts/main.js';t=p.read_text('utf8')
# Guard the original sound function itself, including calls captured by older wrappers.
t=rep(t,'function playHit(sound,kind){',"function playHit(sound,kind){if(current?.id==='wings_original_v34')return;")
p.write_text(t,'utf8')
p=s/'scripts/home-v14.js';t=p.read_text('utf8')
t=rep(t,' const creditsBySong={'," const creditsBySong={\n  wings_original_v34:{original:'사용자 제공 음원',producer:'한울'},")
# Existing title fallback already uses the catalog; explicit localized entry if present.
anchor="well_lived_drum_v3_v28:{title:'우리 꽤 잘살았네 버전 3',detail:'DRUM PLAY · 전체 드럼 · 1분 26초'}"
if anchor in t:
 t=rep(t,anchor,anchor+",\n  wings_original_v34:{title:'날개를 펴',detail:'원음 · 일반 · 1분 28초'}")
p.write_text(t,'utf8')
p=s/'index.html';t=p.read_text('utf8')
for name in ['main.js','home-v14.js']:
 t,n=re.subn(r'(scripts/'+re.escape(name)+r')(?:\?v\d+)?',lambda m:m.group(1)+'?v34',t);assert n==1
p.write_text(t,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V34_WINGS_ORIGINAL_MIX_HAPTIC_ONLY',len(notes),'notes; 98 BPM; 10 prior tracks unchanged')
