"""V39: preserve source assets, add a 2.8s playable lead-in and two real judgment equipments."""
from pathlib import Path
import json, re, subprocess, hashlib
s=Path('_site')
o=Path('overrides/record-intro-judge-v39')
manifest=s/'assets/manifest.json'
m=json.loads(manifest.read_text('utf8'))
tracks=[t for t in m['tracks'] if t.get('status')=='ready']
assert len(tracks)==12
# The deployed derivatives are changed; all original repository MP3s/charts remain untouched.
lead=2.8
audio_paths=sorted({t['audio'] for t in tracks})
chart_paths=sorted({t['chart'] for t in tracks})
before={x:hashlib.sha256((s/x).read_bytes()).hexdigest() for x in audio_paths+chart_paths}
for rel in chart_paths:
 p=s/rel;chart=json.loads(p.read_text('utf8'))
 seq=chart['notes'] if isinstance(chart,dict) else chart
 assert seq and all('t' in n for n in seq)
 for n in seq:
  n['t']=round(float(n['t'])+lead,4)
  if n.get('startT') is not None:n['startT']=round(float(n['startT'])+lead,4)
 if isinstance(chart,dict) and isinstance(chart.get('duration'),(int,float)):chart['duration']=round(chart['duration']+lead,4)
 p.write_text(json.dumps(chart,ensure_ascii=False,separators=(',',':')),'utf8')
for rel in audio_paths:
 p=s/rel;tmp=p.with_name(p.stem+'-v39-tmp.mp3')
 # Add digital silence ahead of the ORIGINAL musical phrase; do not cut or reorder any song.
 subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y',
     '-f','lavfi','-t',str(lead),'-i','anullsrc=channel_layout=stereo:sample_rate=44100',
     '-i',str(p),'-filter_complex','[0:a][1:a]concat=n=2:v=0:a=1[out]',
     '-map','[out]','-c:a','libmp3lame','-q:a','2',str(tmp)],check=True)
 assert tmp.stat().st_size>10000
 tmp.replace(p)
for t in tracks:t['duration']=round(float(t['duration'])+lead,4)
manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2),'utf8')
assert all(hashlib.sha256((s/x).read_bytes()).hexdigest()!=v for x,v in before.items())
# The original V7 width setting already influences timing. Connect real timing and visual width
# to ONE equipment multiplier for both EASY and HARD; never only paint a thicker line.
p=s/'scripts/easy-v7-addon.js';a=p.read_text('utf8')
def rep(old,new):
 global a
 assert a.count(old)==1,(old,a.count(old))
 a=a.replace(old,new,1)
rep('function perfectSeconds(){return (getRules().perfect+24)/(2*speedPx());}',
    'function perfectSeconds(){return ((getRules().perfect+24)*(window.RhythmJudgementV39?.multiplier?.()||1))/(2*speedPx());}')
# Keep the game's existing neutral GREAT/GOOD thresholds unchanged without equipment.
# When PERFECT widens beyond them, shift GREAT/GOOD/MISS borders outward too.
rep("const BAD_WINDOW = .242;",
"""const BAD_WINDOW = .242;
  function v39Windows(){
    const p=perfectSeconds(),m=window.RhythmJudgementV39?.multiplier?.()||1;
    if(m===1)return {perfect:p,great:.119,good:.175,bad:BAD_WINDOW};
    const great=Math.max(.119,p+.045),good=Math.max(.175,great+.055);
    return {perfect:p,great,good,bad:Math.max(BAD_WINDOW,good+.065)};
  }""")
rep("sec<=perfectSeconds() ? ['PERFECT',1,100] :",
    "sec<=v39Windows().perfect ? ['PERFECT',1,100] :")
rep("sec<=.119 ? ['GREAT',.88,88] :",
    "sec<=v39Windows().great ? ['GREAT',.88,88] :")
rep("sec<=.175 ? ['GOOD',.55,55] :",
    "sec<=v39Windows().good ? ['GOOD',.55,55] :")
assert a.count('dist=BAD_WINDOW')==1,a.count('dist=BAD_WINDOW')
a=a.replace('dist=BAD_WINDOW','dist=v39Windows().bad')
assert a.count('n.t+BAD_WINDOW')>=1,a.count('n.t+BAD_WINDOW')
a=a.replace('n.t+BAD_WINDOW','n.t+v39Windows().bad')
assert a.count('t+BAD_WINDOW')>=1,a.count('t+BAD_WINDOW')
a=a.replace('t+BAD_WINDOW','t+v39Windows().bad')

rep("field.style.setProperty('--hit-band',r.perfect+'px');",
    "const m=window.RhythmJudgementV39?.multiplier?.()||1;field.style.setProperty('--hit-band',(r.perfect*m)+'px');field.dataset.judgeItem=m===3?'triple':m===2?'double':'none';")
rep("if(!isEasy())return;\n    const r=getRules();",
    "if(!isEasy()&&(window.RhythmJudgementV39?.multiplier?.()||1)===1)return;\n    const r=getRules();")
rep("band.style.display=ttl.style.display=easy?'':'none';",
    "band.style.display=(easy||(window.RhythmJudgementV39?.multiplier?.()||1)>1)?'':'none';ttl.style.display=easy?'':'none';")
p.write_text(a,'utf8')
# Integrate two products into existing V33 wallet/slots; do NOT create another balance.
p=s/'scripts/shop-v33.js';a=p.read_text('utf8')
assert a.count(" ['combo','콤보 보호',20,'콤보가 끊길 때 보호.'],")==1
a=a.replace(" ['combo','콤보 보호',20,'콤보가 끊길 때 보호.'],",
""" ['combo','콤보 보호',20,'콤보가 끊길 때 보호.'],
 ['judge2','판정선 2배',40,'EASY/HARD PERFECT 판정선과 허용시간을 2배로 확장. 빨간빛. 장착형 영구 소지.'],
 ['judge3','판정선 3배',80,'EASY/HARD PERFECT 판정선과 허용시간을 3배로 확장. 파란빛. 장착형 영구 소지.'],""",1)
assert a.count("const art=id=>'assets/items-v33/'+id+(id==='expand'?'.svg':'.webp');")==1
a=a.replace("const art=id=>'assets/items-v33/'+id+(id==='expand'?'.svg':'.webp');",
            "const art=id=>'assets/items-v33/'+id+(['expand','judge2','judge3'].includes(id)?'.svg':'.webp');",1)
old="let next=clone();next.slots[selection]=x.id;try{save(next);closeShop()}"
new="let next=clone();next.slots[selection]=x.id;if(x.id==='judge2'||x.id==='judge3'){next.slots=next.slots.map((v,i)=>i!==selection&&(v==='judge2'||v==='judge3')?null:v)}try{save(next);closeShop()}"
assert a.count(old)==1
a=a.replace(old,new,1)
# These are functional, permanent equipment, unlike V33 consumables still in review.
old="else dialog.append(el('p','v33-review','검수용 상품 · 효과 및 소모는 아직 적용 전'));"
new="else if(!['judge2','judge3'].includes(x.id))dialog.append(el('p','v33-review','검수용 상품 · 효과 및 소모는 아직 적용 전'));"
assert a.count(old)==1;a=a.replace(old,new,1)
p.write_text(a,'utf8')
for name in ['judge2.svg','judge3.svg']:
 (s/'assets/items-v33'/name).write_text((o/name).read_text('utf8'),'utf8')
for name in ['v39.js','v39.css']:
 (s/'scripts'/name).write_text((o/name).read_text('utf8'),'utf8')
p=s/'index.html';h=p.read_text('utf8')
assert h.count('</head>')==h.count('</body>')==1
for js in ['easy-v7-addon.js','shop-v33.js']:
 h,n=re.subn(r'(scripts/'+re.escape(js)+r')(?:\?v\d+)?',lambda z:z.group(1)+'?v39',h)
 assert n==1,(js,n)
h=h.replace('</head>','<link rel="stylesheet" href="scripts/v39.css?v39"/></head>',1)
h=h.replace('</body>','<script defer src="scripts/v39.js?v39"></script></body>',1)
p.write_text(h,'utf8')
print('V39_READY: 12 tracks 2.8s quiet lead-in, judge2/judge3 real rules, end-screen record effects; original source assets retained')
