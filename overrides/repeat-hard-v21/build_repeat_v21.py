#!/usr/bin/env python3
"""Build a learnable HARD V2 chart for the user's original '우리 꽤 잘살았네'.
Keep all audio untouched and reuse V20's natural 86s ending. Fourteen of eighteen
2-bar motifs are repeats of A or B, with four repeated C climax phrases.
"""
import json
from pathlib import Path
from bisect import bisect_left
import numpy as np

ROOT=Path(__file__).resolve().parent
SITE=Path(__import__('os').environ.get('RHYTHM_SITE','_site'))
BASE=json.loads((SITE/'assets/charts/well_lived_hard_v20.json').read_text(encoding='utf-8'))
BEATS=np.asarray(json.loads((ROOT/'beat_grid_v21.json').read_text(encoding='utf-8'))['beats'])
ORIGINAL=BASE['notes']
# Times are indexed against real beat detections from the clip; avoid a speculative
# rigid metronome that would drift away from the music.
START_BEAT=3
# (beat index within 2-bar phrase, half-beat offset, lane, kind)
A=[(0,0,0,'tap'),(0,.5,1,'tap'),(1,0,2,'tap'),(2,0,1,'tap'),
   (2,.5,0,'tap'),(3,0,2,'flick'),(4,0,0,'tap'),(4,.5,1,'tap'),
   (5,0,2,'tap'),(6,0,1,'tap'),(6,.5,3,'tap'),(7,0,2,'flick')]
B=[(0,0,3,'tap'),(1,0,2,'tap'),(1,.5,1,'tap'),(2,0,0,'tap'),
   (2,.5,1,'tap'),(3,0,2,'flick'),(4,0,3,'tap'),(4,.5,2,'tap'),
   (5,0,1,'tap'),(6,0,0,'tap'),(6,.5,2,'tap'),(7,0,3,'flick')]
C=[(0,0,0,'tap'),(0,0,3,'tap'),(0,.5,1,'tap'),(1,0,2,'tap'),
   (1,.5,3,'flick'),(2,0,2,'tap'),(2,.5,1,'tap'),(3,0,0,'tap'),
   (3,.5,1,'tap'),(4,0,2,'tap'),(4,0,3,'tap'),(4,.5,1,'tap'),
   (5,0,0,'tap'),(5,.5,2,'flick'),(6,0,1,'tap'),(6,.5,2,'tap'),
   (7,0,3,'flick')]
# Play the recognizable riff A repeatedly, contrast it with B, then reprise A,
# revisit B, and give the full final high-energy stretch to a recognizable C.
STRUCTURE='AAAABBBBAAAABBCCCC'
assert len(STRUCTURE)==18
MOTIFS={'A':A,'B':B,'C':C}
# Use the closest pitch tag from the V20 source chart so played notes do not
# acquire random pitches. Pattern repetition concerns the gestures/rhythm.
old_t=np.asarray([n['t'] for n in ORIGINAL])

def note_sound(t,lane,kind):
    idx=bisect_left(old_t,t)
    near=[ORIGINAL[j] for j in (idx-2,idx-1,idx,idx+1) if 0<=j<len(ORIGINAL)]
    origin=min(near,key=lambda n:(abs(n['t']-t),abs(n['lane']-lane)))
    meta=dict(origin['sound'])
    return origin['pitch'],meta

def at(beat,half):
    index=START_BEAT+beat
    if half==0:
        return float(BEATS[index])
    return (float(BEATS[index])+float(BEATS[index+1]))/2

notes=[];motif_sections=[]
for cycle,symbol in enumerate(STRUCTURE):
    template=MOTIFS[symbol]
    section_start=at(cycle*8,0)
    for local_beat,half,lane,kind in template:
        when=round(at(cycle*8+local_beat,half),4)
        pitch,sound=note_sound(when,lane,kind)
        notes.append({'t':when,'lane':lane,'kind':kind,'pitch':pitch,'sound':sound})
    motif_sections.append({'motif':symbol,'bar':cycle*2+1,'start':round(section_start,3),'end':round(at((cycle+1)*8,0),3)})

# At the recorded outro use one deliberate, readable final four-beat cadence
# instead of forcing more hard notes into the dying reverb.
for local,lane in [(0,0),(1,1),(2,2),(3,0)]:
    when=round(at(18*8+local,0),4)
    pitch,sound=note_sound(when,lane,'tap')
    notes.append({'t':when,'lane':lane,'kind':'tap','pitch':pitch,'sound':sound})

notes.sort(key=lambda n:(n['t'],n['lane']))
assert len(notes)==240
assert sum(n['kind']=='flick' for n in notes)==(8*2+6*2+4*3)==40
assert all(0<=n['lane']<=3 and n['t']>=1.2 and n['t']<84.2 for n in notes)
for a,b in zip(notes,notes[1:]):
    if a['lane']==b['lane']:assert b['t']-a['t']>.10, (a,b)
for i,n in enumerate(notes[:-2]):
    assert notes[i+2]['t']-n['t']>=.025, (i,notes[i:i+3])
for n in notes:
    assert n['pitch']==n['sound']['midi']
chart={
 'schemaVersion':1,'soundSchemaVersion':1,'source':BASE['source'],
 'sourceSliceSeconds':BASE['sourceSliceSeconds'],'difficulty':5,'bpm':BASE['bpm'],
 'notesDesign':'V21 HARD V2 PLAYTEST: recurring 2-bar A and B thumb/flick gestures and four repeated C climax riffs. A x4, B x4, A x4, B x2, C x4, then final four-beat cadence. Patterns are fixed by BEAT index and real track beat positions. Practice and improve on repeating figures. No changes to the V20 86-second audio.',
 'repeatSchemaVersion':1,'repeatStructure':STRUCTURE,
 'motifs':{'A':len(A),'B':len(B),'C':len(C)},
 'motifSections':motif_sections,
 'notes':notes
}
out=ROOT;out.mkdir(parents=True,exist_ok=True)
p=out/'well_lived_hard_repeat_v21.json';p.write_text(json.dumps(chart,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'notes':len(notes),'tap':sum(n['kind']=='tap' for n in notes),'flick':sum(n['kind']=='flick' for n in notes),'repeats':STRUCTURE,'sections':len(motif_sections),'lastNote':notes[-1]['t'],'output':str(p)},ensure_ascii=False))
