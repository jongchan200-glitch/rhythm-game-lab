#!/usr/bin/env python3
"""V30: separate the player-owned drum intervals from the automatic accompaniment.
Keep V3's 281 exact note times. A gap is not a player-owned note forever.
Use V29's cleaned no-drums accompaniment, and move the unowned drum
material back into it. Both tracks remain continuous and sample aligned.
"""
from pathlib import Path
import hashlib,json
import numpy as np
import soundfile as sf
from scipy.signal import stft,istft
s=Path('_site');old=s/'assets/drum-v3-v29';out=s/'assets/drum-v3-v30';out.mkdir(exist_ok=True)
m=json.loads((old/'map.json').read_text())
d,rate=sf.read(old/'drums.flac',dtype='float32',always_2d=True)
b,sr=sf.read(old/'backing.flac',dtype='float32',always_2d=True)
assert rate==sr==44100 and b.shape==d.shape
n=m['entries'];assert len(n)==281
# Each note owns the attack and its decay, up to 270 ms or the next note.
# Within dense passages this joins into a continuous player-owned drum stem.
# In longer gaps the unattended drum material returns to automatic backing.
# The complementary raised-cosine split preserves the original drum waveform
# when both tracks are combined, without cutting/retriggering individual sounds.
ownership=np.zeros(len(d),dtype=np.float32)
intervals=[]
for i,e in enumerate(n):
 start=max(0,int(round((e['t']-.016)*rate)))
 end=min(len(d),int(round(min(e['t']+.270,n[i+1]['t']-.016 if i+1<len(n) else len(d)/rate)*rate)))
 assert end>start
 intervals.append((start,end))
# Merge contiguous ownership before fading to prevent gaps between dense notes.
merged=[]
for a,z in intervals:
 if merged and a<=merged[-1][1]+2:merged[-1]=(merged[-1][0],max(z,merged[-1][1]))
 else:merged.append((a,z))
for a,z in merged:
 ownership[a:z]=1
 fade=min(int(rate*.006),(z-a)//3)
 if fade:
  ramp=(.5-.5*np.cos(np.linspace(0,np.pi,fade))).astype(np.float32)
  ownership[a:a+fade]=ramp;ownership[z-fade:z]=ramp[::-1]
# Additional suppression of residual drums ONLY in the player-owned windows.
# Use drum-correlated spectral bins, not global low-pass/volume reduction.
win=2048;hop=256
_,_,D=stft(d.T,fs=rate,nperseg=win,noverlap=win-hop,boundary='zeros',padded=True)
_,_,B=stft(b.T,fs=rate,nperseg=win,noverlap=win-hop,boundary='zeros',padded=True)
dp=np.mean(abs(D)**2,axis=0);bp=np.mean(abs(B)**2,axis=0)
# Stronger subtraction where drum energy dominates; preserve unrelated bins.
ratio=dp/(dp+bp+1e-12)
mask=1-.97*np.clip((ratio-.30)/.55,0,1)
_,clean=istft(B*mask[None,:,:],fs=rate,nperseg=win,noverlap=win-hop,input_onesided=True,boundary=True)
clean=clean.T[:len(d)].astype('float32')
assert clean.shape==b.shape and np.isfinite(clean).all()
owned=d*ownership[:,None]
auto=d-owned
back=b+(clean-b)*ownership[:,None]+auto
peak=max(float(np.max(abs(back))),float(np.max(abs(owned))),float(np.max(abs(back+owned))),1.)
gain=.98/peak
back*=gain;owned*=gain
sf.write(out/'backing.flac',back,rate,subtype='PCM_24')
sf.write(out/'drums.flac',owned,rate,subtype='PCM_24')
# Direct file-level verification: no player drum in gaps, automatic drum
# contribution exactly full in gaps, and nearly zero player channel on a miss.
db,_=sf.read(out/'drums.flac',dtype='float32',always_2d=True)
gap=ownership==0
assert np.any(gap) and np.any(ownership==1)
assert np.max(abs(db[gap]))<.000001
assert np.max(abs((auto+owned/gain)-d))<.000001
def rms(x):return float(np.sqrt(np.mean(x*x)))
assert rms(back)>rms(b)*.65
# Probe a strong owned attack in the actual encoded channel.
probes=[]
for i,e in enumerate(n[:24]):
 a=int((e['t']+.025)*rate);z=min(int((e['t']+.095)*rate),intervals[i][1])
 if z-a>=.035*rate:probes.append((rms(db[a:z]),i))
assert probes and max(probes)[0]>.008
for i,e in enumerate(n):
 e['start']=intervals[i][0]/rate;e['end']=intervals[i][1]/rate
m.update(version=30,missDrumFraction=.01)
m['metrics'].update(playerOwnedSeconds=float(np.sum(ownership)/rate),automaticDrumSeconds=float(np.sum(1-ownership)/rate),ownedRegions=len(merged),playerDrumGapPeak=float(np.max(abs(db[gap]))),probeIndex=max(probes)[1],probeDrumRms=max(probes)[0],backingRms=rms(back),playerDrumRms=rms(db),originalNoteCount=281)
(out/'map.json').write_text(json.dumps(m,separators=(',',':')),'utf8')
for name,y in [('no_hits',back+.01*owned),('all_hits',back+owned)]:
 sf.write(out/(name+'.flac'),np.clip(y,-1,1),rate,subtype='PCM_24')
print('V30_SELECTIVE_DRUM_ASSETS',json.dumps(m['metrics']))
