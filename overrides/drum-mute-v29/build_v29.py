#!/usr/bin/env python3
"""V29: zero drum gate, actual Demucs no_drums accompaniment.
Only V3 changes. Keep V28 chart, raw continuous drum stem and its timing.
"""
from pathlib import Path
import hashlib,json,shutil
import numpy as np
import soundfile as sf
from scipy.signal import stft,istft
s=Path('_site');old=s/'assets/drum-v3-v28';out=s/'assets/drum-v3-v29';out.mkdir(exist_ok=True)
m=json.loads((old/'map.json').read_text())
model=Path('/tmp/rhythm-stem-v27/separated/htdemucs/well_lived')
d,rate=sf.read(old/'drums.flac',dtype='float32',always_2d=True)
other,sr=sf.read(model/'no_drums.wav',dtype='float32',always_2d=True)
assert rate==sr==44100 and other.shape==d.shape
other*=m['sourceGain']
# Demucs other-stem sum may retain drum bleed. Attenuate only bins dominated
# by the extracted drum stem, protecting sustained vocals/bass where possible.
# Soft mask, never add synthesized audio.
win=2048;hop=512
_,_,D=stft(d.T,fs=rate,nperseg=win,noverlap=win-hop,boundary='zeros',padded=True)
_,_,B=stft(other.T,fs=rate,nperseg=win,noverlap=win-hop,boundary='zeros',padded=True)
dp=np.mean(abs(D)**2,axis=0);bp=np.mean(abs(B)**2,axis=0)
dominance=dp/(dp+bp+1e-12)
mask=1-.80*np.clip((dominance-.62)/.35,0,1)
_,reduced=istft(B*mask[None,:,:],fs=rate,nperseg=win,noverlap=win-hop,input_onesided=True,boundary=True)
back=reduced.T[:len(d)].astype('float32')
assert back.shape==d.shape and np.isfinite(back).all()
# Preserve ample headroom and the original drum track gain and timing.
assert np.max(abs(back))<=1.0
sf.write(out/'backing.flac',back,rate,subtype='PCM_24')
shutil.copy2(old/'drums.flac',out/'drums.flac')
assert hashlib.sha256((out/'drums.flac').read_bytes()).digest()==hashlib.sha256((old/'drums.flac').read_bytes()).digest()
def rms(x):return float(np.sqrt(np.mean(x*x)))
# Actual test probe chosen by source drum energy, among playable early notes.
probes=[]
for i,e in enumerate(m['entries'][:24]):
 a=int((e['t']+.025)*rate);b=min(int((e['t']+.095)*rate),int(e['end']*rate))
 if b-a>=.035*rate:probes.append((rms(d[a:b]),i))
assert probes
probe=max(probes)[1]
assert max(probes)[0]>.008
m['version']=29;m['missDrumFraction']=0;m['metrics'].update(backingMethod='Demucs no_drums sum + conservative drum-dominant spectral attenuation',backingRms=rms(back),rawNoDrumsRms=rms(other),drumRmsEncoded=rms(d),missDrumOutputRms=0,probeIndex=probe,probeDrumRms=max(probes)[0])
assert rms(back)>rms(other)*.72
(out/'map.json').write_text(json.dumps(m,separators=(',',':')),'utf8')
# Compare the actual encoded backing against fully played drums at the same gain.
for name,y in [('no_hits',back),('all_hits',back+d)]:
 sf.write(out/(name+'.flac'),np.clip(y,-1,1),rate,subtype='PCM_24')
print('V29_STRICT_DRUM_MUTE_ASSETS',json.dumps(m['metrics']))
