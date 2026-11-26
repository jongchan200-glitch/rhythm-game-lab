from pathlib import Path
import hashlib,json,shutil
s=Path('_site');o=Path('overrides/music-v36')
protected=[p for p in (s/'assets').rglob('*') if p.is_file()]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
m=json.loads((s/'assets/manifest.json').read_text('utf8'))
ids={t['id'] for t in m['tracks'] if t.get('status')=='ready'}
assert len(ids)==11 and {'tonight_easy_v16','deathmatch_one_take_v12','well_lived_easy_v19','wings_original_v34'}<=ids
for n in ('music-v36.js','music-v36.css'):shutil.copy2(o/n,s/'scripts'/n)
dest=s/'assets/music-v36';dest.mkdir(exist_ok=True)
for p in (o/'art').glob('*.svg'):shutil.copy2(p,dest/p.name)
assert len(list(dest.glob('*.svg')))==5
p=s/'index.html';h=p.read_text('utf8')
assert h.count('</head>')==h.count('</body>')==1
h=h.replace('</head>','<link rel="stylesheet" href="scripts/music-v36.css?v36"/></head>')
h=h.replace('</body>','<script defer src="scripts/music-v36.js?v36"></script></body>')
p.write_text(h,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V36_FOUR_UNIQUE_MUSIC_RECORDS_EXISTING_11_GAME_CHARTS_AND_AUDIO_PRESERVED')
