#!/usr/bin/env python3
"""V25: use real judgement audio in demo, after V24 source asset build."""
from pathlib import Path
import shutil, hashlib
site=Path('_site'); o=Path('overrides/autoplay-sound-v25')
protected=[site/'assets/manifest.json',*sorted((site/'assets/charts').glob('*.json')),*sorted((site/'assets/audio').glob('*.mp3')),*sorted((site/'assets/keysound-v24').glob('*'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
shutil.copy2(o/'autoplay-sound-v25.js',site/'scripts/drum-keysound-v24.js')
h=site/'index.html';t=h.read_text('utf8')
assert t.count('scripts/drum-keysound-v24.js?v24')==1
h.write_text(t.replace('scripts/drum-keysound-v24.js?v24','scripts/drum-keysound-v24.js?v25'),'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V25_AUTOPLAY_AUDIO_ONLY_ALL_8_TRACKS_AND_V24_SOURCE_ASSETS_UNCHANGED')
