from pathlib import Path
import hashlib,json,re
s=Path('_site')
protected=[p for p in (s/'assets').rglob('*') if p.is_file()]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
m=json.loads((s/'assets/manifest.json').read_text('utf8'))
assert len([x for x in m['tracks'] if x.get('status')=='ready'])==11
# Disable legacy vibration calls before installing one common judgement hook.
# Retain feature checks and original game logic; do not alter settings.
total=0
for p in (s/'scripts').glob('*.js'):
    t=p.read_text('utf8')
    t,n=re.subn(r'navigator\s*\.\s*vibrate\s*(?:\?\.)?\s*\(', 'window.RhythmV35LegacyVibrate(', t)
    if n:
        p.write_text(t,'utf8');total+=n
assert total>0, 'legacy vibration call not found'
p=s/'scripts/main.js';t=p.read_text('utf8')
assert t.count('function playHit(sound,kind){')==1
t=t.replace('function playHit(sound,kind){','function playHit(sound,kind){if(window.RhythmV35Active)return;',1)
# Captured older playHit callbacks are silent after the V35 hook activates.
t="window.RhythmV35LegacyVibrate=function(){return false};\n"+t
p.write_text(t,'utf8')
# Stop redundant stem downloads in the common original-mix mode.
p=s/'scripts/drum-keysound-v24.js';t=p.read_text('utf8')
assert t.count('load(NORMAL);load(HARD);')==1
p.write_text(t.replace('load(NORMAL);load(HARD);','// V35: original mix, no eager keysound downloads.'),'utf8')
p=s/'scripts/continuous-drums-v28.js';t=p.read_text('utf8')
assert t.count('setTimeout(load,350);')==1
p.write_text(t.replace('setTimeout(load,350);','// V35: original mix, no eager drum-stem download.'),'utf8')
o=Path('overrides/common-v35')
(s/'scripts/common-v35.js').write_text((o/'common-v35.js').read_text('utf8'),'utf8')
(s/'scripts/common-v35.css').write_text((o/'common-v35.css').read_text('utf8'),'utf8')
p=s/'index.html';t=p.read_text('utf8')
# Cache bust all runtime files because older scripts also used vibration.
t=re.sub(r'(scripts/[^"\'<>\s]+\.js)(?:\?v\d+)?(?=["\'])',r'\1?v35',t)
assert t.count('</head>')==t.count('</body>')==1
t=t.replace('</head>','<link rel="stylesheet" href="scripts/common-v35.css?v35"/></head>')
t=t.replace('</body>','<script defer src="scripts/common-v35.js?v35"></script></body>')
p.write_text(t,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V35_ALL_11_ORIGINAL_AUDIO_CHARTS_RECORD_IDS_PRESERVED; LEGACY_VIBRATION_CALLS_REPLACED',total)
