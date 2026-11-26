import json,hashlib
from pathlib import Path
BPM=95.7
BEAT=60/BPM
PHASE=0.16
# Each pair of bars is a learned, literal repeating two-thumb motion.
A=[[(0,0),(0.5,1),(1,0),(1.5,2),(2,1),(3,3),(3.5,2)],[(0,3),(0.5,2),(1,1),(1.5,0),(2,2),(3,3),(3.5,1)]]
B=[[(0,0),(.5,2),(1,1),(1.5,3),(2,1),(3,0),(3.5,2)],[(0,1),(.5,3),(1,2),(1.5,0),(2,2),(3,1),(3.5,3)]]
C=[[(0,0),(.5,1),(1,0),(1.25,1),(2,2),(2.5,3),(3.5,1)],[(0,3),(.5,2),(1,3),(1.25,2),(2,1),(2.5,0),(3.5,3)]]
# 36 four-beat bars: 12 A bars, eight B bars, 16 C bars.
phrases='A'*8+'B'*8+'A'*4+'C'*16
assert len(phrases)==36
notes=[]
for bar,name in enumerate(phrases):
 group={'A':A,'B':B,'C':C}[name][bar%2]
 for index,(pos,lane) in enumerate(group):
  # Short bridge after first peak: sparse pattern, no mandatory repetitive accents.
  if bar in (12,13,14) and index in (3,5):continue
  t=round(PHASE+(bar*4+pos)*BEAT,4)
  assert 0<=t<90.40
  pitch=[36,38,42,46][lane]
  notes.append({'t':t,'lane':lane,'kind':'tap','pitch':pitch,'sound':{'instrument':'synth','midi':pitch,'velocity':0.62,'length':0.12}})
assert len(notes)==246, len(notes)
assert all(notes[i]['t']<notes[i+1]['t'] for i in range(len(notes)-1))
assert all(notes[i+1]['t']-notes[i]['t']>0.14 for i in range(len(notes)-1))
chart={
 'schemaVersion':1,'soundSchemaVersion':1,'source':'문을 열어.wav','sourceSliceSeconds':[157.64,248.04],
 'difficulty':3,'bpm':BPM,'duration':90.432,
 'notesDesign':'Original stereo mix continuous. Audibly detected ~95.7 BPM beat grid; repeated two-bar A/B/C thumb motions. Six sparse bridge events removed; C has short 16th-note double taps. No synthetic instrument replaces the original mix.',
 'motifs':{'A':'two-bar thumb seesaw','B':'cross-hand alternating','C':'double-tap chorus'},
 'motifSections':{'A':12,'B':8,'C':16},'notes':notes
}
out=Path('/mnt/data/rhythm_v38/door_open_easy_v38.json')
out.write_text(json.dumps(chart,ensure_ascii=False,indent=2),encoding='utf-8')
print('chart',len(notes),'notes; duration',notes[-1]['t'],'sec; size',out.stat().st_size,'sha256',hashlib.sha256(out.read_bytes()).hexdigest())
for pos in [0,8,16,24,32]:
 print('bar',pos,'motif',phrases[pos],'first',[(x['t'],x['lane']) for x in notes if pos*4*BEAT<=x['t']<(pos+1)*4*BEAT][:9])