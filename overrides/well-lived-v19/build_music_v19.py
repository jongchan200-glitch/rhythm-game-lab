#!/usr/bin/env python3
"""Build TWO nonoverlapping musical excerpts and chart playtest previews from the user's WAV.
    Whole cuts follow measured phrase-level dynamic dips; no collage or arbitrary hard 60-second cut.
    Original WAV kept untouched. No claims of manually transcribed vocals/lyrics.
"""
from pathlib import Path
import math,json,subprocess,hashlib
import numpy as np, soundfile as sf
from scipy.signal import find_peaks
P=Path('/mnt/data/rhythm_v19')
SRC=Path('/mnt/data/우리 꽤 잘살았네..wav')
SITE=P/'site';OUT=P/'new_assets';(OUT/'audio').mkdir(parents=True,exist_ok=True);(OUT/'charts').mkdir(parents=True,exist_ok=True)
if not (P/'source_mono_12k.wav').is_file():
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(SRC),'-ac','1','-ar','12000',str(P/'source_mono_12k.wav')],check=True)
Y,FS=sf.read(str(P/'source_mono_12k.wav'),dtype='float32')
if not (P/'audio_features.npz').is_file():
 import librosa
 hop=256
 onset=librosa.onset.onset_strength(y=Y,sr=FS,hop_length=hop)
 times=librosa.frames_to_time(np.arange(len(onset)),sr=FS,hop_length=hop)
 tempo,beat_frames=librosa.beat.beat_track(onset_envelope=onset,sr=FS,hop_length=hop,start_bpm=115,tightness=70,trim=False)
 np.savez(P/'audio_features.npz',onset=onset,times=times,beats=times[beat_frames],tempo=np.atleast_1d(tempo))
Z=np.load(P/'audio_features.npz');ON=Z['onset'];TS=Z['times'];BEATS=Z['beats'];TEMPO=float(Z['tempo'][0]);
PEAKS,_=find_peaks(ON,distance=6,prominence=.30)
# Located from 0.7s-smoothed RMS troughs at 53.2, 108.9, 154.3, 206.5 secs;
# these brackets are two separate middle/late song phrases, not different charts of the same passage.
CLIPS={
 'easy':dict(id='well_lived_easy_v19',start=53.14,end=109.15,difficulty=3,base=15000,color='#e5ad8f',type='LP',label='중반부 · EASY'),
 'hard':dict(id='well_lived_hard_v19',start=154.23,end=206.68,difficulty=5,base=30000,color='#8ad5df',type='CD',label='후반부 · HARD')
}

def local_peak(t,window=.085):
 ix=PEAKS[np.abs(TS[PEAKS]-t)<=window]
 if not len(ix):return float(t),.2
 ranks=ON[ix]-2.0*np.abs(TS[ix]-t)
 k=ix[np.argmax(ranks)];return float(TS[k]),float(ON[k])

def pitch_sound(t,score=0):
 a=max(0,int((t+.013)*FS));b=min(len(Y),a+4096)
 w=Y[a:b];
 if len(w)<300:return 60,'piano'
 w=w*np.hanning(len(w));size=8192
 mag=np.abs(np.fft.rfft(w,n=size));freq=np.fft.rfftfreq(size,1/FS)
 mask=(freq>=75)&(freq<=1000);ix=np.where(mask)[0]
 ff=freq[ix]
 vals=mag[ix]+.35*np.interp(ff*2,freq,mag)+.16*np.interp(ff*3,freq,mag)
 best=float(ff[np.argmax(vals)]) if len(vals) else 261.6
 midi=max(40,min(86,int(round(69+12*math.log2(max(best,1)/440)))))
 ins='bass' if midi<54 else 'piano' if midi<73 else 'strings'
 return midi,ins

def build_chart(mode,cfg):
 start,end=cfg['start'],cfg['end'];span=end-start;difficult=cfg['difficulty']==5
 bs=BEATS[(BEATS>=start+.85)&(BEATS<=end-1.6)]
 current=[];prev_lane=1;last_midi=60;stepdir=1
 for i,b in enumerate(bs):
  t,score=local_peak(b,.095)
  if t-start<.72 or t-start>span-1.3:continue
  window=Y[int(t*FS):int((t+.16)*FS)];rms=np.sqrt(np.mean(window**2)) if len(window) else 0
  if not difficult and ((score<.58 and i%4==2) or (rms<.020 and i%3)):continue
  if difficult and score<.28 and rms<.012:continue
  midi,inst=pitch_sound(t,score)
  change=midi-last_midi
  # Gentle pitch contour, plus deliberate alternating fingers on repeated notes.
  if abs(change)>3:
   shift=(1 if change>0 else -1)
   lane=max(0,min(3,prev_lane+shift))
   if lane==prev_lane: lane=prev_lane-stepdir;lane=max(0,min(3,lane));stepdir*=-1
  else:
   lane=(prev_lane+stepdir)%4
   if lane in (0,3):stepdir*=-1
  if i%8==0:lane=(0 if (i//8)%2==0 else 3)
  last_midi=midi;prev_lane=lane
  # A few EASY outer-lane flicks; HARD flicks on genuine strong accents.
  kind='tap'
  if not difficult and lane in (0,3) and i%21 in (5,18) and score>1.45:kind='flick'
  if difficult and i%10 in (3,8) and score>2.0:kind='flick'
  current.append({'t':round(t-start,4),'lane':lane,'kind':kind,'pitch':midi,
    'sound':{'instrument':inst,'midi':midi,'velocity':round(float(min(.98,.49+score*.07)),2),'length':.23}})
 if difficult:
  # Hard accents are beat midpoints only WHEN actual transients exist nearby.
  choices=[]
  for j,(t0,t1) in enumerate(zip(bs[:-1],bs[1:])):
   gap=t1-t0
   if not .40<gap<.69:continue
   t,score=local_peak((t0+t1)/2,.09)
   if score<.95 or t-start<.9 or t-start>span-1.9:continue
   if any(abs(n['t']-(t-start))<.12 for n in current):continue
   choices.append((score,t,j))
  # Strength prioritization plus timeline coverage: max 70 offbeats for 52s.
  choices.sort(key=lambda v:(-v[0],v[1]));off=[]
  for score,t,j in choices:
   if len(off)>=66:break
   if any(abs(x[1]-t)<.20 for x in off):continue
   if any(abs(n['t']-(t-start))<.12 for n in current):continue
   off.append((score,t,j))
  for score,t,j in off:
   midi,inst=pitch_sound(t,score)
   lanes_at_time={n['lane'] for n in current if abs(n['t']-(t-start))<.18}
   lane=(midi+2+j)%4
   if lane in lanes_at_time:lane=(lane+1)%4
   kind='flick' if (score>2.9 and j%3 in (0,2)) else 'tap'
   current.append({'t':round(t-start,4),'lane':lane,'kind':kind,'pitch':midi,
    'sound':{'instrument':inst,'midi':midi,'velocity':round(float(min(.95,.51+score*.057)),2),'length':.20}})
  # Emphasize a limited number of rhythmic downbeat chords.
  added=0
  for j,n in enumerate(sorted(current,key=lambda x:x['t'])):
   if added>=11:break
   if j%10 not in (1,):continue
   if not 3<n['t']<span-3:continue
   if any(x is not n and abs(x['t']-n['t'])<.02 for x in current):continue
   src_t=n['t']+start;_,score=local_peak(src_t,.023)
   if score<2.0:continue
   lane=(n['lane']+2)%4
   current.append({'t':n['t'],'lane':lane,'kind':'tap','pitch':max(40,n['pitch']-12),
    'sound':{'instrument':'bass','midi':max(40,n['pitch']-12),'velocity':.61,'length':.21}})
   added+=1
 else:
  # Occasional two-note chord on strong beat, sparsely distributed.
  added=0
  for j,n in enumerate(sorted(current,key=lambda x:x['t'])):
   if added>=3:break
   if j%30!=13:continue
   if not 4<n['t']<span-3:continue
   _,score=local_peak(n['t']+start,.025)
   if score<2.55:continue
   if any(x is not n and abs(x['t']-n['t'])<.02 for x in current):continue
   pp=max(40,n['pitch']-12);current.append({'t':n['t'],'lane':(n['lane']+2)%4,'kind':'tap','pitch':pp,'sound':{'instrument':'bass','midi':pp,'velocity':.56,'length':.20}});added+=1
 # Prevent same-lane events <110ms (without changing musical event timing), keep strongest.
 current.sort(key=lambda n:(n['t'],n['lane']))
 cleaned=[]
 for n in current:
  if any(x['lane']==n['lane'] and abs(x['t']-n['t'])<.112 for x in cleaned):continue
  if sum(abs(x['t']-n['t'])<.023 for x in cleaned)>=2:continue
  cleaned.append(n)
 current=sorted(cleaned,key=lambda n:(n['t'],n['lane']))
 assert all(n['t']>=0.7 and n['t']<span-1.3 for n in current)
 for j,n in enumerate(current):
  assert 0<=n['lane']<4 and n['kind'] in ('tap','flick') and n['sound']['midi']==n['pitch']
  if not difficult and n['kind']=='flick':assert n['lane'] in (0,3)
  if j+2<len(current):assert current[j+2]['t']-n['t']>=.023-1e-6
 print(mode,'notes',len(current),'tap',sum(n['kind']=='tap' for n in current),'flick',sum(n['kind']=='flick' for n in current),'pairs',sum(n['t']==current[i+1]['t'] for i,n in enumerate(current[:-1])),'last',current[-1]['t'])
 return {'schemaVersion':1,'soundSchemaVersion':1,'source':'우리 꽤 잘살았네..wav','sourceSliceSeconds':[start,end],
         'difficulty':cfg['difficulty'],'bpm':round(TEMPO,2),'notes':current,
         'notesDesign':'Sustained 108-BPM beat/onset transients from the provided audio, pitch-contour lanes. Separate song passage per mode. Human ear/phone playtest pending.'}

for mode,cfg in CLIPS.items():
 duration=round(cfg['end']-cfg['start'],3)
 wav=OUT/'audio'/f'{cfg["id"]}.mp3'
 # Make a short, unobtrusive fade to the actual phrasing trough, never arbitrarily trim at 60.00 seconds.
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(cfg['start']),'-i',str(SRC),'-t',str(duration),
   '-af',f'afade=t=in:st=0:d=0.14,afade=t=out:st={duration-.78:.3f}:d=0.78','-ac','2','-ar','44100','-c:a','libmp3lame','-b:a','192k',str(wav)],check=True)
 chart=build_chart(mode,cfg)
 (OUT/'charts'/f'{cfg["id"]}.json').write_text(json.dumps(chart,ensure_ascii=False,indent=2),encoding='utf-8')
 real=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(wav)]).decode().strip())
 assert abs(real-duration)<.06
 print('clip',mode,cfg['start'],cfg['end'],round(real,2),'seconds',wav.stat().st_size,'bytes')
