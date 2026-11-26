"""V38: regenerate the 246-note repeated-hand chart using analysed beat timestamps.

beat_grid_v38.json was extracted from the user's actual WAV (157.64-248.04 s)
with librosa onset/beat tracking. A/B/C two-bar motions have fixed lanes
and rhythmic subdivisions, while timing follows measured variable beats.
"""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
beats=json.loads((ROOT/'beat_grid_v38.json').read_text('utf8'))['beats']
assert len(beats)==143
A=[[(0,0),(.5,1),(1,0),(1.5,2),(2,1),(3,3),(3.5,2)],[(0,3),(.5,2),(1,1),(1.5,0),(2,2),(3,3),(3.5,1)]]
B=[[(0,0),(.5,2),(1,1),(1.5,3),(2,1),(3,0),(3.5,2)],[(0,1),(.5,3),(1,2),(1.5,0),(2,2),(3,1),(3.5,3)]]
C=[[(0,0),(.5,1),(1,0),(1.25,1),(2,2),(2.5,3),(3.5,1)],[(0,3),(.5,2),(1,3),(1.25,2),(2,1),(2.5,0),(3.5,3)]]
phrases='A'*8+'B'*8+'A'*4+'C'*16
notes=[]
def grid_time(position):
 i=int(position);frac=position-i
 if i+1<len(beats):return beats[i]*(1-frac)+beats[i+1]*frac
 step=sorted(b-a for a,b in zip(beats[-16:-1],beats[-15:]))[7]
 return beats[-1]+(position-len(beats)+1)*step
for bar,motif in enumerate(phrases):
 pat=list({'A':A,'B':B,'C':C}[motif][bar%2])
 # Build-up: the eight C bars repeat one extra half-beat accent exactly.
 if motif=='C' and 24<=bar<32:pat.append((3,0 if bar%2==0 else 3))
 pat.sort()
 for i,(beat_in_bar,lane) in enumerate(pat):
  # Broader breathing space in low-volume 30-38s transition.
  if bar in (12,13,14) and i in (3,5):continue
  t=round(grid_time(bar*4+beat_in_bar),4)
  if t>88.5:continue
  pitch=[36,38,42,46][lane]
  notes.append({'t':t,'lane':lane,'kind':'tap','pitch':pitch,'sound':{'instrument':'synth','midi':pitch,'velocity':.62,'length':.12}})
assert len(notes)==246,len(notes)
assert all(0<=n['t']<88.51 and n['lane'] in range(4) for n in notes)
assert all(a['t']<b['t'] and b['t']-a['t']>=.14 for a,b in zip(notes,notes[1:]))
chart={'schemaVersion':1,'soundSchemaVersion':1,'source':'문을 열어.wav','sourceSliceSeconds':[157.64,248.04],
'difficulty':3,'bpm':95.7,'duration':90.432,
'notesDesign':'Original stereo music uninterrupted; 143 measured variable beat markers from actual WAV, 36 bars with repeatable A/B/C two-bar thumb motifs; 8 rhythmic extra accents, bridge reduction, ending fades with no late notes.',
'motifs':{'A':'two-bar thumb seesaw','B':'cross-hand alternating','C':'double-tap chorus'},
'motifSections':{'A':12,'B':8,'C':16},'beatsSource':'beat_grid_v38.json (librosa onset 11.025kHz / 256hop, 157.64s WAV excerpt)','notes':notes}
( ROOT/'door_open_easy_v38.json').write_text(json.dumps(chart,ensure_ascii=False,indent=2),encoding='utf8')
print('V38_BEAT_ALIGNED_CHART',len(notes),'notes, max_note',notes[-1]['t'],'source_beat_count',len(beats),'sha256',hashlib.sha256((ROOT/'door_open_easy_v38.json').read_bytes()).hexdigest())