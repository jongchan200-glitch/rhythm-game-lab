from pathlib import Path
import hashlib,shutil,json
s=Path('_site');o=Path('overrides/drum-selective-v30')
files=[s/'assets/manifest.json',*sorted((s/'assets/charts').glob('*.json')),*sorted((s/'assets/audio').glob('*.mp3')),*sorted((s/'assets/drum-v3-v29').glob('*'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
shutil.copy2(o/'continuous-drums-v30.js',s/'scripts/continuous-drums-v28.js')
p=s/'index.html';t=p.read_text('utf8');assert t.count('scripts/continuous-drums-v28.js?v29')==1
p.write_text(t.replace('scripts/continuous-drums-v28.js?v29','scripts/continuous-drums-v28.js?v30'),'utf8')
shutil.copy2(o/'drum-check-v30.html',s/'drum-check-v30.html')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
print('V30_ONLY_V3_DRUM_ROUTING_CHANGED_ALL_CHARTS_PRESERVED')
