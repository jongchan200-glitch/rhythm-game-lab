#!/usr/bin/env python3
"""V23: mobile visual system and real audible note gain. Apply AFTER V22."""
from pathlib import Path
import hashlib, json, shutil
site=Path('_site'); ov=Path('overrides/mobile-v23')
def replace(s,a,b):
    assert s.count(a)==1,(a,s.count(a))
    return s.replace(a,b,1)
protected=[site/'assets/manifest.json',*sorted((site/'assets/charts').glob('*.json')),*sorted((site/'assets/audio').glob('*.mp3'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
main=site/'scripts/main.js';s=main.read_text('utf8')
s=replace(s,'fxVol=.28,songVol=.88','fxVol=.80,songVol=.78')
s=replace(s,'fxBus.gain.value=.75','fxBus.gain.value=.88')
s=replace(s,'comp.threshold.value=-19;comp.ratio.value=5','comp.threshold.value=-9;comp.ratio.value=3')
s=replace(s,"if(ac.state==='suspended')ac.resume().catch(()=>{})","if(ac.state==='suspended')ac.resume().catch(e=>{window.RhythmHitV23.error=String(e);console.warn('V23 audio resume',e)})")
s=replace(s,'function playHit(sound,kind){',"window.RhythmHitV23={count:0,error:'',peak:0};\nfunction playHit(sound,kind){")
s=replace(s,'initAudio();if(!ac)return;\n  // Input lane',"try{initAudio()}catch(e){window.RhythmHitV23.error=String(e);console.warn('V23 audio init',e);return}if(!ac){window.RhythmHitV23.error='AudioContext unavailable';return;}\n  // Input lane")
s=replace(s,'const peak=Math.max(.0002,fxVol*.095*velocity);','const peak=Math.max(.0002,fxVol*.52*velocity);\n    window.RhythmHitV23.peak=peak;')
s=replace(s,'envelope.gain.exponentialRampToValueAtTime(.0001,now+seconds);','envelope.gain.exponentialRampToValueAtTime(peak*.48,now+Math.min(.065,seconds*.5));\n    envelope.gain.exponentialRampToValueAtTime(.0001,now+seconds);')
s=replace(s,'osc.start(now);osc.stop(now+seconds+.018);\n    }\n  }catch(e){}','osc.start(now);osc.stop(now+seconds+.018);\n    }\n    window.RhythmHitV23.count++;window.RhythmHitV23.error="";\n  }catch(e){window.RhythmHitV23.error=String(e);console.warn("V23 hit audio",e)}')
main.write_text(s,'utf8')
home=site/'scripts/home-v14.js';s=home.read_text('utf8')
s=replace(s,' setPage(0);',' window.RhythmHomeV23Page=setPage;setPage(0);')
home.write_text(s,'utf8')
h=site/'index.html';s=h.read_text('utf8')
for a,b in [('id="fxText">28%','id="fxText">80%'),('id="songText">88%','id="songText">78%'),('id="fxVolume" max="100" min="0" type="range" value="28"','id="fxVolume" max="100" min="0" type="range" value="80"'),('id="songVolume" max="100" min="0" type="range" value="88"','id="songVolume" max="100" min="0" type="range" value="78"'),('scripts/main.js?v18','scripts/main.js?v23'),('scripts/home-v14.js?v22','scripts/home-v14.js?v23'),('</head>','<link rel="stylesheet" href="scripts/mobile-v23.css?v23"/></head>'),('</body>','<script defer src="scripts/mobile-v23.js?v23"></script></body>')]: s=replace(s,a,b)
h.write_text(s,'utf8')
for f in ['mobile-v23.js','mobile-v23.css']:shutil.copy2(ov/f,site/'scripts'/f)
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
assert len([t for t in json.loads((site/'assets/manifest.json').read_text())['tracks'] if t.get('status')=='ready'])==8
print('V23_MOBILE_UI_AND_HIT_GAIN_ALL_8_AUDIO_CHART_MANIFEST_UNCHANGED')
