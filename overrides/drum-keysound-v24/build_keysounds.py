#!/usr/bin/env python3
"""V24 experiment: source-derived percussive keysounds, V21 HARD V2 only.
HPSS is an approximate spectral percussion separation, not isolated instrument stems.
No synthesized replacement drum samples. Keep every existing catalog/chart/MP3 byte.
"""
from pathlib import Path
import hashlib,json,subprocess, wave, shutil
import numpy as np
from scipy.signal import stft,istft
from scipy.ndimage import median_filter
site=Path('_site'); out=site/'assets/keysound-v24';out.mkdir(parents=True,exist_ok=True)
src=site/'assets/audio/well_lived_climax_v20.mp3'
chart=site/'assets/charts/well_lived_hard_repeat_v21.json'
ns=json.loads(chart.read_text('utf8'))['notes']
assert len(ns)==240 and sum(n['kind']=='flick' for n in ns)==40
rate=44100
raw=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(src),'-f','f32le','-ac','2','-ar',str(rate),'-'])
x=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()
assert 85.8<len(x)/rate<86.3
# One shared stereo spectral mask preserves stereo phase. Horizontal median estimates
# harmonic instruments/vocal sustain; vertical median estimates transient percussion.
win=2048; hop=256; specs=[]
for c in range(2):
    _,_,z=stft(x[:,c],fs=rate,nperseg=win,noverlap=win-hop,boundary='zeros',padded=True)
    specs.append(z)
mag=np.sqrt((abs(specs[0])**2+abs(specs[1])**2)*.5)
H=median_filter(mag,size=(1,25),mode='nearest')
P=median_filter(mag,size=(25,1),mode='nearest')
mask=(P*P)/(P*P+(1.65*H)**2+1e-12)
# Suppress very low DC and extreme treble; conservative soft mask avoids hollow music.
freq=np.fft.rfftfreq(win,1/rate)
mask*=np.clip((freq-22)/35,0,1)[:,None]
perc=np.empty_like(x)
for c,z in enumerate(specs):
    _,y=istft(z*mask,fs=rate,nperseg=win,noverlap=win-hop,boundary=True)
    perc[:,c]=y[:len(x)]
del specs,mag,H,P,mask
groups=[]
for i,n in enumerate(ns):
    if groups and abs(n['t']-groups[-1]['t'])<.005:groups[-1]['ids'].append(i)
    else:groups.append({'t':n['t'],'ids':[i]})
back=x.copy();sprite=[];entries=[None]*len(ns);cursor=0;removed_power=0.;covered=0
for gi,g in enumerate(groups):
    t=g['t']; prev=groups[gi-1]['t'] if gi else -1.; nxt=groups[gi+1]['t'] if gi+1<len(groups) else len(x)/rate
    # Non-overlapping local slices, preserve original timing, retain 20% percussion
    # under selected hits and leave non-playable percussion fully in the backing.
    start=max(0,int(round(max(t-.050,(prev+t)/2)*rate)))
    end=min(len(x),int(round(min(t+.205,(t+nxt)/2)*rate)))
    assert end>start
    L=end-start; env=np.ones(L,dtype=np.float32);fade=min(int(rate*.008),L//4)
    if fade:
        ramp=np.linspace(0,1,fade,dtype=np.float32)
        env[:fade]=ramp;env[-fade:]=ramp[::-1]
    removed=(.80*perc[start:end]*env[:,None]).astype(np.float32)
    # A/B/C simultaneous notes: each contributes its share of the same source event,
    # never a duplicated full-strength drum hit.
    back[start:end]-=removed
    assert np.max(np.abs((back[start:end]+removed)-x[start:end]))<2e-6
    removed_power+=float(np.sum(removed.astype(np.float64)**2));covered+=L
    rms=float(np.sqrt(np.mean(removed**2)))
    sprite.append(removed)
    for i in g['ids']:
        entries[i]={'t':ns[i]['t'],'lane':ns[i]['lane'],'kind':ns[i]['kind'],
                    'start':round(start/rate,7),'offset':cursor,'length':L,'share':1/len(g['ids']),'rms':round(rms,6)}
    cursor+=L
assert all(e is not None for e in entries)
# Shared headroom ensures the two streams recombine without digital clipping.
samples=np.concatenate(sprite)
peak=max(float(np.max(np.abs(x))),float(np.max(np.abs(back))),float(np.max(np.abs(samples))),1.)
scale=.96/peak
def write_wav(path,a):
    with wave.open(str(path),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate)
        f.writeframes(np.clip(np.round(a*scale*32767),-32768,32767).astype('<i2').tobytes())
write_wav(out/'source_hits.wav',samples)
tmp=out/'backing.tmp.wav';write_wav(tmp,back)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(tmp),'-codec:a','libmp3lame','-b:a','224k',str(out/'backing.mp3')],check=True)
tmp.unlink()
assert abs(len(x)/rate-float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(out/'backing.mp3')])))<.12
meta={'version':24,'songId':'well_lived_hard_repeat_v21','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'chartSha256':hashlib.sha256(chart.read_bytes()).hexdigest(),'rate':rate,'duration':len(x)/rate,'sourceGain':scale,'missPercussionFraction':.20,'entries':entries,'groups':len(groups),'method':'HPSS conservative source percussion; localized 80% removal; original stereo key samples'}
(out/'map.json').write_text(json.dumps(meta,separators=(',',':')),'utf8')
assert removed_power>0 and np.max(np.abs(samples))>0.005
print('V24_SOURCE_KEYSOUND_BUILD',json.dumps({'notes':len(ns),'groups':len(groups),'activeSeconds':covered/rate,'sampleRms':float(np.sqrt(np.mean(samples**2))),'sourceRms':float(np.sqrt(np.mean(x**2))),'minSliceRms':min(e['rms'] for e in entries),'maxSliceRms':max(e['rms'] for e in entries),'duration':len(x)/rate}))
