from pathlib import Path
import base64, hashlib, shutil
s=Path('_site');o=Path('overrides/music-v37')
protected=[p for p in (s/'assets').rglob('*') if p.is_file()]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
d=s/'assets/music-v37';d.mkdir(exist_ok=True)
for name in ('night','battle','memory','wings'):
    b=base64.b64decode((o/'art'/f'{name}.webp.b64').read_text('ascii'),validate=True)
    assert b[:4]==b'RIFF' and b[8:12]==b'WEBP' and len(b)>50000
    (d/f'{name}.webp').write_bytes(b)
for name in ('music-v37.js','music-v37.css'):shutil.copy2(o/name,s/'scripts'/name)
p=s/'index.html';h=p.read_text('utf8')
for old,new in [('scripts/music-v36.css?v36','scripts/music-v37.css?v37'),('scripts/music-v36.js?v36','scripts/music-v37.js?v37')]:
    assert h.count(old)==1
    h=h.replace(old,new)
p.write_text(h,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V37_AI_WEBP_FOUR_ALBUMS_EXISTING_AUDIO_CHARTS_AND_ASSETS_PRESERVED')
