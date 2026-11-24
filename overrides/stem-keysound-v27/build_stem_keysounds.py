#!/usr/bin/env python3
"""V27: real Demucs drum stem + actual onset-based musical keysounds.
Do NOT fall back to HPSS or synthesize sounds. Original 86s audio remains immutable.
Only selected real drum events become playable; unselected drums remain in backing.
"""
from pathlib import Path
from collections import Counter
import subprocess, hashlib, json, wave, math
import numpy as np
from scipy.signal import stft,find_peaks
from scipy.ndimage import gaussian_filter1d
import soundfile as sf
site=Path('_site'); out=site/'assets/keysound-stem-v27';out.mkdir(parents=True,exist_ok=True)
src=site/'assets/audio/well_lived_climax_v20.mp3'
original=site/'assets/charts/well_lived_hard_repeat_v21.json'
old=json.loads(original.read_text('utf8')); ns=old['notes'];assert len(ns)==240
rate=44100
tmp=Path('/tmp/rhythm-stem-v27');tmp.mkdir(exist_ok=True)
wav=tmp/'well_lived.wav'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(src),'-ac','2','-ar',str(rate),'-c:a','pcm_f32le',str(wav)],check=True)
x,sr=sf.read(wav,dtype='float32',always_2d=True)
assert sr==rate and 85.8<len(x)/rate<86.3
drum_path=tmp/'separated'/'htdemucs'/'well_lived'/'drums.wav'
assert drum_path.is_file(),'Demucs separation must succeed before building keysounds'
d,dr=sf.read(drum_path,dtype='float32',always_2d=True)
assert dr==rate and abs(len(d)-len(x))<rate*.05
d=np.pad(d,((0,max(0,len(x)-len(d))),(0,0)))[:len(x)]
assert d.shape==x.shape and np.isfinite(d).all()
drum_rms=float(np.sqrt(np.mean(d*d)));mix_rms=float(np.sqrt(np.mean(x*x)))
assert drum_rms>mix_rms*.08,'Separated drum stem has insufficient signal'
# Stereo magnitude and log spectral flux in three bands identify real percussive onsets.
# The band label is a spectral proxy, not a claim of isolated kit instruments.
win=1024;hop=128
f,ts,z=stft(d.T,fs=rate,nperseg=win,noverlap=win-hop,boundary='zeros',padded=True)
mag=np.sqrt(np.mean(abs(z)**2,axis=0));del z
bands=[(25,180,'LOW / kick-like'),(180,2200,'MID / snare-like'),(2200,18000,'HIGH / cymbal-like')]
flux=[]; energies=[]
for lo,hi,name in bands:
    a=mag[(f>=lo)&(f<hi)]
    energy=np.sqrt(np.mean(a*a,axis=0))
    v=np.maximum(0,np.diff(energy,prepend=energy[0]))
    v=gaussian_filter1d(v,1.2)
    norm=max(float(np.quantile(v,.98)),1e-8)
    flux.append(v/norm);energies.append(energy)
flux=np.asarray(flux);energies=np.asarray(energies)
strength=np.max(flux,axis=0)
peaks,_=find_peaks(strength,height=.075,prominence=.05,distance=max(1,int(.065*rate/hop)))
assert len(peaks)>=100,('too few real drum events',len(peaks))
# Peak is positive attack derivative, move slightly earlier to the start of its rise.
onsets=[]
for p in peaks:
    band=int(np.argmax(flux[:,p]))
    q=p
    while q>max(1,p-9) and strength[q-1]>=max(.025,strength[p]*.20) and strength[q-1]<=strength[q]*1.12:q-=1
    t=max(0,float(ts[q])-.004)
    onsets.append({'t':t,'strength':float(strength[p]),'band':bands[band][2]})
# Group the original repeat gestures, retain their lanes and kinds. Match only
# genuine drum attacks, avoiding fake sounds at grid times with no attack.
groups=[]
for n in ns:
    if groups and abs(n['t']-groups[-1]['t'])<.005:groups[-1]['notes'].append(n)
    else:groups.append({'t':n['t'],'notes':[n]})
matched=[];last_t=-2.;rejected=Counter()
for i,g in enumerate(groups):
    t=g['t'];lo=max(t-.135,last_t+.135,(groups[i-1]['t']+t)/2+.035 if i else 0)
    hi=min(t+.135,(groups[i+1]['t']+t)/2-.035 if i+1<len(groups) else len(x)/rate-.08)
    candidates=[o for o in onsets if lo<=o['t']<=hi]
    if not candidates:rejected['no_attack']+=len(g['notes']);continue
    # Nearest real attack, weighted mildly toward stronger transients.
    o=min(candidates,key=lambda o:abs(o['t']-t)-.016*min(o['strength'],2))
    a=int(o['t']*rate);b=min(len(d),a+int(.10*rate))
    rms=float(np.sqrt(np.mean(d[a:b]**2)))
    if rms<max(.0035,drum_rms*.09):rejected['weak_attack']+=len(g['notes']);continue
    matched.append({'t':round(o['t'],4),'oldT':t,'notes':g['notes'],'band':o['band'],'strength':o['strength']});last_t=o['t']
assert len(matched)>=100,('too few matched attacks',len(matched),dict(rejected))
# Source-stem surgery: a separate local sample for each selected real drum event.
# Start just before its attack. End before the next real attack where practical.
# Leave 10% of the selected drum stem in the backing; everything else remains.
back=x.copy();key_timeline=np.zeros_like(x);samples=[];entries=[];chart=[];cursor=0
for i,g in enumerate(matched):
    t=g['t'];prev=matched[i-1]['t'] if i else -1.;nxt=matched[i+1]['t'] if i+1<len(matched) else len(x)/rate
    future=[o['t'] for o in onsets if o['t']>t+.055]
    stop=future[0]-.006 if future else t+.30
    start=max(0,int(round(max(t-.012,(prev+t)/2)*rate)))
    end=min(len(x),int(round(min(t+.30,max(t+.07,stop),(t+nxt)/2)*rate)))
    if end-start<int(rate*.055):rejected['short_attack']+=len(g['notes']);continue
    L=end-start;env=np.ones(L,np.float32);fade=min(int(rate*.006),L//4)
    env[:fade]=np.linspace(0,1,fade,dtype=np.float32);env[-fade:]=env[:fade][::-1]
    removed=(.90*d[start:end]*env[:,None]).astype(np.float32)
    rms=float(np.sqrt(np.mean(removed*removed)))
    if rms<max(.003,drum_rms*.08):rejected['weak_sample']+=len(g['notes']);continue
    back[start:end]-=removed;key_timeline[start:end]+=removed
    samples.append(removed)
    # Simultaneous notes share a single drum event, with no double-play.
    for n in sorted(g['notes'],key=lambda n:n['lane']):
        new={**n,'t':t}
        chart.append(new)
        entries.append({'t':t,'lane':n['lane'],'kind':n['kind'],'start':start/rate,'offset':cursor,'length':L,'share':1/len(g['notes']),'rms':round(rms,7),'drumBand':g['band'],'sourceGridT':g['oldT']})
    cursor+=L
assert 100<=len(chart)<=240 and len(entries)==len(chart),len(chart)
assert all(chart[i+2]['t']-chart[i]['t']>=.13 for i in range(len(chart)-2))
assert all(abs(n['t']-e['sourceGridT'])<=.136 for n,e in zip(chart,entries))
assert max(abs((back+key_timeline)-x).ravel())<2e-6
keys=np.concatenate(samples);key_rms=float(np.sqrt(np.mean(keys*keys)))
assert key_rms>mix_rms*.09 and min(e['rms'] for e in entries)>.0029
# Same digital headroom, lossless backing and samples. Default song .78 and
# FX .80 * .975 match exactly; 100% FX is a modest boost, not foreign sound.
peak=max(float(np.max(abs(x))),float(np.max(abs(back))),float(np.max(abs(keys))),float(np.max(abs(d))),1.)
scale=.90/peak
sf.write(out/'backing.flac',back*scale,rate,subtype='PCM_24')
sf.write(out/'source_hits.wav',keys*scale,rate,subtype='PCM_16')
# User-facing listening comparisons (same timeline/level, not an invented demo).
def listen(name,a):
    p=tmp/(name+'.wav');sf.write(p,a*scale,rate,subtype='PCM_24')
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(p),'-codec:a','libmp3lame','-b:a','192k',str(out/(name+'.mp3'))],check=True)
listen('original',x);listen('no_hits',back);listen('perfect_reference',back+key_timeline);listen('drums_only',d);listen('playable_keys_only',key_timeline)
# Decode actual written playback assets and measure reconstruction, not only in-memory math.
decoded,rr=sf.read(out/'backing.flac',dtype='float32',always_2d=True)
ks,kr=sf.read(out/'source_hits.wav',dtype='float32',always_2d=True)
restored=decoded.copy()
for e in entries:
    a=int(round(e['start']*rate));b=e['offset'];L=e['length']
    restored[a:a+L]+=ks[b:b+L]*e['share']
error=float(np.sqrt(np.mean((restored-x*scale)**2)))
assert rr==kr==rate and error<.00004,('written audio reconstruction error',error)
newchart={**old,'difficulty':3,'notes':chart,'notesDesign':'V27 Demucs drum stem + detected onsets; original repeated gesture lanes retained for matched genuine drum attacks; unmatched grid events omitted. No synthetic audio.'}
dest=site/'assets/charts/well_lived_normal_stem_v27.json'
dest.write_text(json.dumps(newchart,ensure_ascii=False,indent=2),'utf8')
meta={'version':27,'songId':'well_lived_hard_repeat_v21','model':'htdemucs','rate':rate,'duration':len(x)/rate,'entries':entries,'sourceGain':scale,'missDrumFraction':.10,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'chartSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'originalChartSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'metrics':{'notes':len(chart),'originalNotes':240,'matchedGroups':len(samples),'detectedAttacks':len(onsets),'rejected':dict(rejected),'drumRms':drum_rms,'mixRms':mix_rms,'keyRms':key_rms,'writtenReconstructionRmsError':error,'medianTimingShiftMs':float(np.median([abs(e['t']-e['sourceGridT'])*1000 for e in entries])),'bands':dict(Counter(e['drumBand'] for e in entries))}}
(out/'map.json').write_text(json.dumps(meta,separators=(',',':')),'utf8')
print('V27_REAL_DEMUCS_STEM_MEASURED',json.dumps(meta['metrics'],ensure_ascii=False))
