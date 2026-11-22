#!/usr/bin/env python3
"""Generate two INDEPENDENT 66-68s excerpts from user-owned source WAV.
Cuts land at independently measured musical transitions (near-zero dynamic troughs).
Charts are onset-following, melodic-pitch-tagged 4 lane playtest charts; no random grid notes.
Original source remains untouched; both excerpts independently encoded and never stitched.
"""
from pathlib import Path
import json,subprocess,math
import soundfile as sf
import numpy as np
from scipy.signal import find_peaks
import librosa

ROOT=Path('/mnt/data/rhythm_todaynight_v16')
WORK=ROOT/'work'
DEST=ROOT/'build/assets'
DEST.joinpath('audio').mkdir(parents=True,exist_ok=True)
DEST.joinpath('charts').mkdir(parents=True,exist_ok=True)
Y,SR=sf.read(str(WORK/'source_mono_22k.wav'),dtype='float32')
OB=np.load(str(WORK/'onset_22k.npz'))
ON,TS=OB['onset'],OB['times']
F_RATE=SR/256
# The 115.5s and 183.5s junctions are low-energy musical pauses; 250.0s a pause before next entry.
CLIPS={
  'easy':{'id':'tonight_easy_v16','start':115.52,'end':183.63,'difficulty':3,'title':'오늘밤도 · EASY','base':15000,'color':'#b6a2fb','target':133},
  'hard':{'id':'tonight_hard_v16','start':183.57,'end':250.16,'difficulty':5,'title':'오늘밤도 · HARD','base':30000,'color':'#75d5fa','target':230},
}
# Real drum/accent onset peaks, instrument and pitch inferred separately from audio spectra.
PEAKS,_=find_peaks(ON,distance=int(F_RATE*.13),prominence=.30)
PHASES={}

def local_peak(guess,window=.078):
    # Snap a beat only to a nearby real transient; never move far out of phase.
    idx=np.where(np.abs(TS[PEAKS]-guess)<=window)[0]
    if len(idx)==0:return float(guess),.2
    sel=PEAKS[idx];rank=ON[sel]-.15*np.abs(TS[sel]-guess)/window
    i=sel[np.argmax(rank)]
    return float(TS[i]),float(ON[i])

def pitch_sound(t,accent=0.):
    # FFT estimates dominant tonal frequencies from a short window after an onset.
    # No lane-to-pitch fixed mapping: each event uses a separate measured pitch tag.
    a=max(0,int((t+.012)*SR));b=min(len(Y),a+8192)
    seg=Y[a:b]
    if len(seg)<1024:return 60,'piano'
    win=np.hanning(len(seg));mag=np.abs(np.fft.rfft(seg*win,n=16384));freq=np.fft.rfftfreq(16384,1/SR)
    # score tones by local harmonic energy across harmonics; favor lower fundamentals on bass accents
    lo,hi=(83,560) if accent>.3 else (105,900)
    ix=np.where((freq>=lo)&(freq<=hi))[0]
    vals=mag[ix]+.4*np.interp(freq[ix]*2,freq,mag)+.23*np.interp(freq[ix]*3,freq,mag)
    if len(vals):ff=float(freq[ix[np.argmax(vals)]])
    else:ff=261.6
    midi=int(round(69+12*math.log2(max(1,ff)/440)))
    midi=max(40,min(88,midi))
    # Use existing instrument synthesizer; no fake claims about isolated stems.
    inst='bass' if midi<54 else ('piano' if midi<73 else 'strings')
    return midi,inst

def chart_for(cfg):
    a,b=cfg['start'],cfg['end'];beat_span=60/129.6
    k=(TS>=a)&(TS<b)
    tempo,inds=librosa.beat.beat_track(onset_envelope=ON[k],sr=SR,hop_length=256,start_bpm=129.6,tightness=75,trim=False,units='frames')
    beats=TS[np.where(k)[0][0]+inds]
    # steady pulses between phrase intro and final natural tail, with occasional resting beats.
    beats=beats[(beats>=a+1.08)&(beats<=b-2.15)]
    # If tracker misses a dense transition, interpolate reasonable 130-bpm pulses.
    seeded=[]
    for i,t in enumerate(beats):
        if i and t-beats[i-1]>.72:
            n=int(round((t-beats[i-1])/beat_span))-1
            for j in range(n):seeded.append(beats[i-1]+beat_span*(j+1))
        seeded.append(t)
    beats=np.asarray(sorted(seeded))
    notes=[];last_lane=-1
    for i,t in enumerate(beats):
        p,score=local_peak(float(t),.092)
        # EASY preserves quiet breathing spaces (no note on weak transitions), HARD follows main beats closely.
        local_energy=np.sqrt(np.mean(Y[int(t*SR):int((t+.15)*SR)]**2))
        if cfg['difficulty']==3 and ((score<.74 and i%3==1) or (local_energy<.03 and i%4!=0)):
            continue
        if cfg['difficulty']==5 and score<.50 and local_energy<.018:
            continue
        midi,inst=pitch_sound(p,accent=score)
        # Melody and rhythmic accent participate in lane arrangement, no meaningless sequential pattern.
        lane=(midi%4+int(t//beat_span)%2+(i//7)%2)%4
        if lane==last_lane and i%3!=0:lane=(lane+1+int(score>2))%4
        last_lane=lane
        kind='tap'
        if cfg['difficulty']==3:
            if lane in (0,3) and i%19==6 and score>1.1:kind='flick'
        elif i%11 in (4,9) and score>1.05:
            kind='flick'
        n={'t':round(p-a,4),'lane':lane,'kind':kind,'pitch':midi,'sound':{'instrument':inst,'midi':midi,'velocity':round(min(.95,.53+score*.065),2),'length':.25}}
        if .7<=n['t']<b-a-1.7:notes.append(n)
    # Add offbeats only where the source contains distinct mid-beat attacks.
    if cfg['difficulty']==5:
        pairs=list(zip(beats[:-1],beats[1:]))
        offCandidates=[]
        for j,(p1,p2) in enumerate(pairs):
            gap=p2-p1
            if not .32<gap<.65:continue
            middle=(p1+p2)/2
            actual,strength=local_peak(float(middle),.082)
            if strength<1.12:continue
            # Don't add offbeats in rests or near an established note.
            if any(abs(x['t']-(actual-a))<.16 for x in notes):continue
            offCandidates.append((strength,actual,j))
        offCandidates.sort(key=lambda x:x[0],reverse=True)
        quota=max(0,cfg['target']-len(notes)-10)
        for strength,actual,j in offCandidates[:quota]:
            t=round(actual-a,4)
            if t<.9 or t>b-a-1.6 or any(abs(n['t']-t)<.13 for n in notes):continue
            midi,inst=pitch_sound(actual,accent=strength)
            lane=(midi+2+j)%4
            notes.append({'t':t,'lane':lane,'kind':'flick' if strength>1.8 and j%5==0 else 'tap','pitch':midi,'sound':{'instrument':inst,'midi':midi,'velocity':.66,'length':.21}})
        # Controlled two-finger chords on strong downbeats; never 3 notes at same instant.
        singles=sorted(notes,key=lambda n:n['t'])
        chord_added=0
        for j,n in enumerate(singles):
            if chord_added>=10:break
            source_time=n['t']+a
            _,strength=local_peak(source_time,.01)
            if strength<1.65 or j%7!=2 or n['t']<2 or n['t']>b-a-3:continue
            if sum(abs(x['t']-n['t'])<.02 for x in notes)>1:continue
            lane=(n['lane']+2)%4
            pitch=max(42,n['pitch']-12)
            notes.append({'t':n['t'],'lane':lane,'kind':'tap','pitch':pitch,'sound':{'instrument':'bass','midi':pitch,'velocity':.60,'length':.22}})
            chord_added+=1
    else:
        # Occasional second percussion accent, still only two fingers; keep EASY sparse.
        candidates=[(i,n) for i,n in enumerate(sorted(notes,key=lambda v:v['t'])) if i%29==12]
        for j,n in candidates[:3]:
            _,strength=local_peak(n['t']+a,.015)
            if strength<1.8:continue
            if sum(abs(x['t']-n['t'])<.02 for x in notes)>1:continue
            pp=max(45,n['pitch']-12)
            notes.append({'t':n['t'],'lane':(n['lane']+2)%4,'kind':'tap','pitch':pp,'sound':{'instrument':'bass','midi':pp,'velocity':.56,'length':.2}})
    notes.sort(key=lambda n:(n['t'],n['lane']))
    # validate 4 lanes, <= 2 identical timestamp and EASY outer-lane flicks only.
    for j,n in enumerate(notes):
        assert 0<=n['lane']<=3 and n['t']>=.6 and n['t']<b-a-1.0
        if cfg['difficulty']<=3 and n['kind']=='flick':assert n['lane'] in (0,3)
        if j+2<len(notes):assert notes[j+2]['t']-n['t']>=.020-1e-7,(j,n,notes[j+2])
    # Must not have same-lane duplicates within 100 ms.
    for lane in range(4):
        z=[n['t'] for n in notes if n['lane']==lane]
        assert all(b-a>.095 for a,b in zip(z,z[1:])), (lane,z)
    chart={'schemaVersion':1,'soundSchemaVersion':1,'source':'오늘밤도.wav','sourceSliceSeconds':[a,b], 'difficulty':cfg['difficulty'],'bpm':129.6,'notes':notes,
       'notesDesign':'beat/onset tracked from user audio; separate pitched sound tag per note; no duration padding or random pattern; preliminary user playtest'}
    return chart

for mode,cfg in CLIPS.items():
    out=DEST/'audio'/f'{cfg["id"]}.mp3'
    duration=cfg['end']-cfg['start']
    # 0.25s gentle attack / 0.8s fade AFTER musical cadence; no artificial collage.
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(cfg['start']),'-i','/mnt/data/오늘밤도.wav','-t',str(duration),
       '-af',f'afade=t=in:st=0:d=0.20,afade=t=out:st={duration-.88:.3f}:d=0.88','-ac','2','-ar','44100','-c:a','libmp3lame','-b:a','192k',str(out)],check=True)
    chart=chart_for(cfg)
    file=DEST/'charts'/f'{cfg["id"]}.json'
    file.write_text(json.dumps(chart,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    pitches=[n['pitch'] for n in chart['notes']]
    print(mode,'slice',cfg['start'],cfg['end'],'duration',duration,'notes',len(chart['notes']),'flick',sum(n['kind']=='flick' for n in chart['notes']),'pairs',sum(chart['notes'][j]['t']==chart['notes'][j+1]['t'] for j in range(len(chart['notes'])-1)),'pitches',len(set(pitches)),'last_note',chart['notes'][-1]['t'],flush=True)
