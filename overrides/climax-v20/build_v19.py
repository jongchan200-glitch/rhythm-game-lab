#!/usr/bin/env python3
"""V19 original-source climax: same continuous, naturally ending excerpt for two *distinct* charts.

Full source: 237.2s, audible/intensity transition around 151s then rising final section.
Selected: 151.2 to natural recorded song ending 237.2; no collage, no artificial hard cutoff.
Chart onsets are snapped to source transients, unlike blindly fixed MIDI grids.
"""
from pathlib import Path
import math,json,hashlib,subprocess
import soundfile as sf
import librosa
import numpy as np
from scipy.signal import find_peaks
ROOT=Path('/mnt/data/rhythm_welllived_v19')
SRC=Path('/mnt/data/우리 꽤 잘살았네..wav')
START,END=151.2,237.2
DURATION=END-START
ASSET=ROOT/'assets'; (ASSET/'audio').mkdir(parents=True,exist_ok=True);(ASSET/'charts').mkdir(parents=True,exist_ok=True)
SID='well_lived_climax_v19'
AUDIO=ASSET/'audio'/f'{SID}.mp3'
subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-ss',str(START),'-i',str(SRC),'-t',str(DURATION),'-af','afade=t=in:st=0:d=0.16','-ac','2','-ar','44100','-c:a','libmp3lame','-b:a','192k',str(AUDIO)],check=True)
# True beat timestamps and acoustic accents from original source (avoid onset artificial cutoff boundary).
sr=11025;hop=256
y,_=librosa.load(str(SRC),sr=sr,mono=True)
z=y[int(START*sr):int(END*sr)]
ON=librosa.onset.onset_strength(y=z,sr=sr,hop_length=hop)
TIMES=librosa.times_like(ON,sr=sr,hop_length=hop)
valTempo,BEATS=librosa.beat.beat_track(onset_envelope=ON,sr=sr,hop_length=hop,start_bpm=108,tightness=88,trim=False,units='frames')
beat_t=librosa.frames_to_time(BEATS,sr=sr,hop_length=hop)
strength=np.array(ON,dtype=float)
peaks,_=find_peaks(strength,distance=int(sr/hop*.16),prominence=.28)
peaks=peaks[(TIMES[peaks]>.6)&(TIMES[peaks]<DURATION-1)]

def snap(t,window=.09):
    eligible=peaks[np.abs(TIMES[peaks]-t)<=window]
    if len(eligible)==0:return float(t),float(np.interp(t,TIMES,strength))
    idx=eligible[np.argmax(strength[eligible]-1.2*np.abs(TIMES[eligible]-t))]
    return float(TIMES[idx]),float(strength[idx])

def note_sound(t,velocity):
    # Gentle note harmonics estimated from recorded music; no claim to isolate vocals.
    start=int((t+.045)*sr); win=z[start:start+4096]
    if len(win)<1024:return 60,'piano'
    nfft=8192; mag=np.abs(np.fft.rfft(win*np.hanning(len(win)),n=nfft));hz=np.fft.rfftfreq(nfft,1/sr)
    lo,hi=(90,590) if velocity>1.65 else (115,1000)
    candidates=np.where((hz>=lo)&(hz<=hi))[0]
    power=mag[candidates]+.30*np.interp(hz[candidates]*2,hz,mag)+.16*np.interp(hz[candidates]*3,hz,mag)
    pos=int(candidates[np.argmax(power)])
    f=hz[pos];m=int(np.clip(round(69+12*np.log2(f/440)),40,88))
    ins='bass' if m<=54 else ('piano' if m<=74 else 'strings')
    return m,ins

def create():
    cfg={}
    beat_index=[(i,t) for i,t in enumerate(beat_t) if 1.12<=t<=DURATION-2.4]
    for mode in ('easy','hard'):
        ishard=mode=='hard';notes=[]; last=-1;lastt=-10
        # quarter notes: never add random notes in obvious rests
        for i,t in beat_index:
            onset,accent=snap(t,.095)
            local=z[int(onset*sr):int((onset+.15)*sr)]
            loud=math.sqrt(float(np.mean(local**2))) if len(local) else 0
            if not ishard and ((accent<1.1 and i%4 in (1,3)) or (loud<.056 and i%3!=0)):
                continue
            if ishard and (accent<.55 and loud<.04):continue
            if notes and onset-notes[-1]['t']<.16:continue
            midi,instr=note_sound(onset,accent)
            # Melody register controls hand direction, with variation to avoid mechanical stairs.
            base=int(np.clip(round((midi-49)/10),0,3))
            lane=(base+(i//4)%2) %4
            if lane==last and onset-lastt<.92:lane=(lane+(1 if i%2 else 3))%4
            kind='tap'
            if ishard:
                if accent>1.3 and i%11 in (4,9):kind='flick'
            else:
                if accent>1.0 and i%15 in (5,11) and lane in (0,3):kind='flick'
            note={'t':round(onset,4),'lane':lane,'kind':kind,'pitch':midi,'sound':{'instrument':instr,'midi':midi,'velocity':round(float(np.clip(.52+accent*.055,.54,.93)),2),'length':.24}}
            notes.append(note);last=lane;lastt=onset
        if ishard:
            # syncopation: add a note only when recorded transients support the offbeat
            basebeats=[x for _,x in beat_index]
            extras=[]
            for j,(a,b) in enumerate(zip(basebeats[:-1],basebeats[1:])):
                if not .47<b-a<.68:continue
                mid=(a+b)*.5
                onset,accent=snap(mid,.085)
                if accent<1.05:continue
                if not (1.45<onset<DURATION-2.6):continue
                if any(abs(n['t']-onset)<.145 for n in notes):continue
                extras.append((accent,onset,j))
            extras.sort(key=lambda x:x[0],reverse=True)
            quota=86
            for accent,onset,j in extras:
                if quota<=0:break
                if any(abs(n['t']-onset)<.19 for n in notes):continue
                midi,instr=note_sound(onset,accent)
                lane=(j+midi)%4
                notes.append({'t':round(onset,4),'lane':lane,'kind':'flick' if accent>1.7 and j%5==1 else 'tap','pitch':midi,'sound':{'instrument':instr,'midi':midi,'velocity':.72,'length':.20}})
                quota-=1
            # sparse grounded simultaneous two-finger accents on strongly marked beats
            base=sorted(notes,key=lambda n:n['t'])
            chords=0
            for i,n in enumerate(base):
                if chords>=12:break
                if i%13!=3 or not (3<n['t']<DURATION-5):continue
                a=float(np.interp(n['t'],TIMES,strength))
                if a<1.45 or any(other is not n and abs(other['t']-n['t'])<.035 for other in notes):continue
                lane=(n['lane']+2)%4;m=max(41,n['pitch']-12)
                notes.append({'t':n['t'],'lane':lane,'kind':'tap','pitch':m,'sound':{'instrument':'bass','midi':m,'velocity':.58,'length':.2}})
                chords+=1
        notes.sort(key=lambda n:(n['t'],n['lane']))
        # user is beta testing; ensure safe reachable input and legibility
        assert all(.9<n['t']<DURATION-1.2 for n in notes)
        assert all(n['kind'] in ('tap','flick') for n in notes)
        assert all(0<=n['lane']<=3 for n in notes)
        for j,n in enumerate(notes[:-2]):assert notes[j+2]['t']-n['t']>=.02
        for lane in range(4):
            arr=[n['t'] for n in notes if n['lane']==lane]
            assert all(b-a>=.10 for a,b in zip(arr,arr[1:])),(mode,lane)
        chart={'schemaVersion':1,'soundSchemaVersion':1,'source':'우리 꽤 잘살았네..wav','sourceSliceSeconds':[START,END],
               'difficulty':5 if ishard else 3,'bpm':round(float(np.ravel(valTempo)[0]),2),
               'notes':notes,'notesDesign':'Two modes share one continuous complete finale, original last 86.0s. Onset-snapped musical beat patterns; HARD increases density, syncopation and pairs. Beta chart; ear review pending.'}
        path=ASSET/'charts'/f'well_lived_{mode}_v19.json';path.write_text(json.dumps(chart,ensure_ascii=False,indent=2),encoding='utf-8')
        cfg[mode]={'count':len(notes),'flick':sum(n['kind']=='flick' for n in notes),'chords':sum(notes[j]['t']==notes[j+1]['t'] for j in range(len(notes)-1)), 'first':notes[0]['t'],'last':notes[-1]['t']}
    cfg['bpm']=round(float(np.ravel(valTempo)[0]),2);cfg['audio_sec']=DURATION;cfg['sha256']=hashlib.sha256(AUDIO.read_bytes()).hexdigest()
    (ROOT/'work/build_report.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(cfg,ensure_ascii=False,indent=2))
create()
