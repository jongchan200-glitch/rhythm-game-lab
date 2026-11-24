#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,shutil
s=Path('_site');o=Path('overrides/drum-keysound-v24')
protected=[s/'assets/manifest.json',*sorted((s/'assets/charts').glob('*.json')),*sorted((s/'assets/audio').glob('*.mp3'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
def rep(t,a,b):
 assert t.count(a)==1,(a,t.count(a))
 return t.replace(a,b,1)
main=s/'scripts/main.js';t=main.read_text('utf8')
t=rep(t,'async function startGame(){if(!current||!current.chart.length)return;','async function startGame(){if(!current||!current.chart.length)return;if(window.RhythmDrumV24&&!window.RhythmDrumV24.canStart(current,document.getElementById("auto").checked))return;')
t=rep(t,'audio=current.audio;audio.currentTime=0;','audio=window.RhythmDrumV24?window.RhythmDrumV24.gameAudio(current,document.getElementById("auto").checked):current.audio;audio.currentTime=0;')
main.write_text(t,'utf8')
h=s/'index.html';t=h.read_text('utf8')
t=rep(t,'scripts/main.js?v23','scripts/main.js?v24')
t=rep(t,'</body>','<script defer src="scripts/drum-keysound-v24.js?v24"></script></body>')
h.write_text(t,'utf8')
shutil.copy2(o/'drum-keysound-v24.js',s/'scripts/drum-keysound-v24.js')
hard=s/'scripts/tonight-home-v16.js';t=hard.read_text('utf8')
# Display experiment status without changing selection or original audio preview.
# Late V22 preview retains original Audio URL from songs[id].audio.
hard.write_text(t,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
meta=json.loads((s/'assets/keysound-v24/map.json').read_text())
assert len(meta['entries'])==240 and meta['songId']=='well_lived_hard_repeat_v21'
assert meta['sourceSha256']==before[str(s/'assets/audio/well_lived_climax_v20.mp3')]
assert meta['chartSha256']==before[str(s/'assets/charts/well_lived_hard_repeat_v21.json')]
print('V24_ONLY_V2_SOURCE_KEYSOUNDS_EXISTING_8_TRACKS_CHARTS_AND_AUDIO_IDENTICAL')
