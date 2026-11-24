#!/usr/bin/env python3
from pathlib import Path
import hashlib,shutil,json
s=Path('_site');o=Path('overrides/drum-mute-v29')
protected=[s/'assets/manifest.json',*sorted((s/'assets/charts').glob('*.json')),*sorted((s/'assets/audio').glob('*.mp3')),*sorted((s/'assets/drum-v3-v28').glob('*'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
shutil.copy2(o/'continuous-drums-v29.js',s/'scripts/continuous-drums-v28.js')
p=s/'index.html';t=p.read_text('utf8');assert t.count('scripts/continuous-drums-v28.js?v28')==1
p.write_text(t.replace('scripts/continuous-drums-v28.js?v28','scripts/continuous-drums-v28.js?v29'),'utf8')
shutil.copy2(o/'drum-check-v29.html',s/'drum-check-v29.html')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V29_V3_ONLY_STRICT_MUTE_EXISTING_MANIFEST_ALL_CHARTS_UNCHANGED')
