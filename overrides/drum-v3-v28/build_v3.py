#!/usr/bin/env python3
"""V28 V3: the entire separated drum stem, continuously played with the residual backing."""
from pathlib import Path
# Reuse exactly the V27 separated stem and real onset analysis, not its sliced samples.
p=Path('overrides/stem-keysound-v27/build_stem_keysounds.py')
exec(compile(p.read_text('utf8').split('# Group the original repeat gestures')[0],str(p),'exec'))
out=site/'assets/drum-v3-v28';out.mkdir(parents=True,exist_ok=True)
ID='well_lived_drum_v3_v28'
# A playable pulse can contain several close kit attacks. Group close attacks
# into one gesture, preserving ALL their audio in the continuous stem.
valid=[o for o in onsets if 1.35<=o['t']<=len(x)/rate-.20]
pulses=[]
for o in valid:
    if pulses and o['t']-pulses[-1]['first']<.135:
        pulses[-1]['members'].append(o)
    else:pulses.append({'first':o['t'],'members':[o]})
# Merge any too-short gap caused by picking a late attack in a preceding group.
selected=[]
for g in pulses:
    t=g['first']
    strongest=max(g['members'],key=lambda o:o['strength'])
    if selected and t-selected[-1]['t']<.135:
        selected[-1]['members']+=g['members'];continue
    selected.append({'t':t,'band':strongest['band'],'members':g['members']})
assert len(selected)>=180
chart=[];entries=[];last=[-10.,-10.]
for i,g in enumerate(selected):
    t=round(g['t'],4);hand=i%2
    assert t-last[hand]>=.25,(t,last[hand])
    last[hand]=t
    low=g['band'].startswith('LOW')
    # Two-thumb alternating pulses; bass on outer lanes, snare/cymbal on inner.
    lane=(0 if low else 1) if hand==0 else (3 if low else 2)
    midi=36 if low else 38 if g['band'].startswith('MID') else 42
    chart.append(dict(t=t,lane=lane,kind='tap',pitch=midi,sound=dict(instrument='synth',midi=midi,velocity=.75,length=.2)))
    # Metadata sound is only for core validator; V3 runtime forbids synth.
    entries.append(dict(t=t,lane=lane,kind='tap',start=max(0,t-.010),drumBand=g['band'],attacks=len(g['members'])))
for i,e in enumerate(entries):e['end']=entries[i+1]['start'] if i+1<len(entries) else len(x)/rate
assert all(e['end']>e['start'] for e in entries)
assert all(b['t']-a['t']>=.1348 for a,b in zip(chart,chart[1:]))
# No cutting, sampling, replaying attacks, or foreign drum sounds. The two
# complete 86s stereo buffers are complementary and start at one audio clock.
back=x-d
peak=max(float(np.max(abs(x))),float(np.max(abs(back))),float(np.max(abs(d))),1.)
scale=.80/peak
sf.write(out/'backing.flac',back*scale,rate,subtype='PCM_24')
sf.write(out/'drums.flac',d*scale,rate,subtype='PCM_24')
bb,br=sf.read(out/'backing.flac',dtype='float32',always_2d=True)
dd,dr=sf.read(out/'drums.flac',dtype='float32',always_2d=True)
err=float(np.sqrt(np.mean((bb+dd-x*scale)**2)))
assert br==dr==rate and bb.shape==dd.shape==x.shape and err<.000001
# Listen references are useful, but full perfect reconstruction is also tested
# with the actual decoded files and WebAudio graph in Chrome.
dest=site/'assets/charts/well_lived_drum_v3_v28.json'
new={**old,'difficulty':3,'notes':chart,'notesDesign':'V28 V3: all separated drums assigned to playable continuous intervals; real onset clusters, two-thumb alternating taps, no sliced samples','repeatStructure':'drum-onsets','motifSections':[]}
dest.write_text(json.dumps(new,ensure_ascii=False,indent=2),'utf8')
meta=dict(version=28,songId=ID,model='htdemucs',rate=rate,duration=len(x)/rate,entries=entries,sourceGain=scale,missDrumFraction=.12,chartSha256=hashlib.sha256(dest.read_bytes()).hexdigest(),metrics=dict(notes=len(entries),detectedAttacks=len(onsets),assignedAttacks=sum(e['attacks'] for e in entries),minNoteGap=min(b['t']-a['t'] for a,b in zip(chart,chart[1:])),reconstructionError=err,drumRms=drum_rms,mixRms=mix_rms,continuousSeconds=len(x)/rate))
(out/'map.json').write_text(json.dumps(meta,separators=(',',':')),'utf8')
print('V28_CONTINUOUS_DRUM_STEM_VERIFIED',json.dumps(meta['metrics']))
