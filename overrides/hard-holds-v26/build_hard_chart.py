#!/usr/bin/env python3
"""V26 two-thumb HARD arrangement: 18 repeat phrases, no occupied-hand collisions."""
from pathlib import Path
from bisect import bisect_left
from collections import Counter
import json, hashlib
site=Path('_site'); root=Path('overrides/repeat-hard-v21')
original=site/'assets/charts/well_lived_hard_repeat_v21.json'
src=json.loads(original.read_text('utf8')); old=src['notes']
assert len(old)==240
beats=json.loads((root/'beat_grid_v21.json').read_text())['beats']
A=[(0,0,'hold',4),(0,2,'tap'),(1,3,'tap'),(2,2,'tap'),(3,3,'tap'),(4,0,'release',0),(4,2,'tap'),(5,1,'tap'),(6,0,'tap'),(6,3,'tap'),(7,2,'flick'),(8,1,'tap'),(9,2,'tap'),(10,0,'tap'),(10,3,'tap'),(11,1,'tap'),(12,2,'tap'),(13,0,'flick'),(14,1,'tap'),(14,3,'tap'),(15,2,'tap')]
B=[(n[0],3-n[1],*n[2:]) for n in A]
C=[(0,3,'hold',4),(0,0,'tap'),(1,1,'tap'),(2,0,'tap'),(3,1,'tap'),(4,3,'release',0),(4,0,'tap'),(5,2,'tap'),(6,0,'tap'),(6,3,'tap'),(7,1,'tap'),(8,0,'tap'),(8,2,'tap'),(9,3,'flick'),(10,1,'tap'),(10,2,'tap'),(11,0,'tap'),(12,1,'tap'),(12,3,'tap'),(13,2,'flick'),(14,0,'tap'),(14,3,'tap'),(15,1,'tap')]
structure='AAAABBBBAAAABBCCCC'; motifs={'A':A,'B':B,'C':C}
def at(c,step):
    i=3+8*c+step//2
    return round((beats[i]+beats[i+1])/2 if step%2 else beats[i],4)
times=[n['t'] for n in old]
def note(t,lane,kind):
    i=bisect_left(times,t)
    s=min(old[max(0,i-3):i+3],key=lambda n:abs(n['t']-t))
    return dict(t=t,lane=lane,kind=kind,pitch=s['pitch'],sound=dict(s['sound']))
notes=[]; sections=[]
for c,symbol in enumerate(structure):
    for step,lane,kind,*extra in motifs[symbol]:
        n=note(at(c,step),lane,kind)
        if kind=='hold': n['duration']=round(at(c,extra[0])-n['t'],4)
        if kind=='release': n['startT']=at(c,extra[0])
        notes.append(n)
    sections.append(dict(motif=symbol,bar=c*2+1,start=at(c,0),end=at(c+1,0)))
for i in range(4):notes.append(note(at(18,i*2),2 if i%2 else 0,'tap'))
notes.sort(key=lambda n:(n['t'],n['lane']))
counts=Counter(n['kind'] for n in notes)
assert counts==dict(tap=318,flick=36,hold=18,release=18)
assert len(notes)==390
held=[None,None]; last=[-10.,-10.]; min_gap=10.; opposite_hits=0
for n in notes:
    h=n['lane']//2
    gap=n['t']-last[h]; min_gap=min(min_gap,gap)
    assert gap>=.22,(n,gap)
    if held[1-h] and n['kind']!='release':opposite_hits+=1
    if held[h] is not None:assert n['kind']=='release' and n['lane']==held[h]['lane'] and abs(n['startT']-held[h]['t'])<.001,(n,held[h])
    if n['kind']=='hold':held[h]=n;assert .95<=n['duration']<=1.25
    elif n['kind']=='release':
        assert held[h] and abs(held[h]['t']+held[h]['duration']-n['t'])<.001
        held[h]=None
    last[h]=n['t']
assert held==[None,None] and opposite_hits>=54
for i,n in enumerate(notes[:-2]):assert notes[i+2]['t']-n['t']>=.22
dest=site/'assets/charts/well_lived_hard_master_v26.json'
chart={**src,'difficulty':5,'notes':notes,'holdSchemaVersion':1,'repeatStructure':structure,'motifs':{k:len(v) for k,v in motifs.items()},'motifSections':sections,'notesDesign':'V26 HARD: A/B mirrored holds plus opposite thumb eighth notes, denser C chords, same 86s source; exactly two thumbs. 18 scored presses and 18 timed releases.'}
dest.write_text(json.dumps(chart,ensure_ascii=False,indent=2),'utf8')
print('V26_TWO_THUMB_CHART',json.dumps({'events':len(notes),'counts':dict(counts),'minHandGap':min_gap,'oppositeHoldHits':opposite_hits,'oldChartSHA':hashlib.sha256(original.read_bytes()).hexdigest()}))
