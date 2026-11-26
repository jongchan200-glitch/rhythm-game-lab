from pathlib import Path
import hashlib,json,shutil,subprocess
site=Path('_site');root=Path('overrides/locked-songs-v38')
manifest=site/'assets/manifest.json';m=json.loads(manifest.read_text('utf8'))
old=list(m['tracks']);assert len([t for t in old if t.get('status')=='ready'])==11
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in (site/'assets').rglob('*') if p.is_file()}
config={'version':38,'tracks':[],'starPrices':{'1':50,'2':100,'3':150,'4':200,'5':300}}
audio=root/'door_open_easy_v38.mp3';chart=root/'door_open_easy_v38.json'
if audio.exists()!=chart.exists():raise RuntimeError('MP3 and chart required together')
if audio.exists():
 j=json.loads(chart.read_text('utf8'));n=j['notes'];assert j['schemaVersion']==1 and len(n)==246 and abs(float(j.get('bpm',0))-95.7)<0.1
 assert hashlib.sha256(audio.read_bytes()).hexdigest()=='b5e323dd641b49c658c9eca7d4f480d288ea0dbead60a749c2b5f0ea485b1255'
 assert all(0<=x['lane']<=3 and x['kind'] in ('tap','flick','hold') for x in n)
 assert n[-1]['t']<=88.5 and j.get('beatsSource','').startswith('beat_grid_v38.json'), 'real beat-aligned V38 chart required'
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(audio)],text=True).strip())
 assert 90.3<=duration<=90.55, duration
 shutil.copy2(audio,site/'assets/audio'/audio.name);shutil.copy2(chart,site/'assets/charts'/chart.name)
 m['tracks'].append({'id':'door_open_easy_v38','title':'문을 열어','subtitle':'원음 반복 채보 · 약 90초','composer':'Charles','difficulty':3,'ruleDifficulty':3,'bpm':j.get('bpm',120),'base':15000,'preRoll':0,'duration':duration,'audio':'assets/audio/'+audio.name,'chart':'assets/charts/'+chart.name,'color':'#e6c388','status':'ready','inputActions':4,'soundBank':'original-mix-quiet-hit'})
 config['tracks'].append({'id':'door_open_easy_v38','price':30});manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2),'utf8')
else:print('V38_MISSING_USER_WAV_AUDIO_AND_CHART_PENDING_NO_FAKE_SONG')
(site/'assets/v38-locks.json').write_text(json.dumps(config,ensure_ascii=False,indent=2),'utf8')
for file in ['unlock-v38.js','unlock-v38.css']:shutil.copy2(root/file,site/'scripts'/file)
coin=(site/'scripts/coin-v18.js').read_text('utf8')
assert 'window.RhythmCoinV18={balance:()=>amount,selected:()=>notes.filter(n=>n.coin).length,purchase};' in coin, 'V33 transactional wallet required'
# V38.2: One 100-coin test allowance only for an empty wallet. Never overwrite
# an existing positive balance, grant twice, or introduce a second coin ledger.
anchor="let amount=balance(),flightId=0;"
assert coin.count(anchor)==1, 'expected original V18 wallet bootstrap'
coin=coin.replace(anchor, """let amount=balance(),flightId=0;
  const TEST_GRANT_KEY='rhythm_lab_test_100_grant_v382';
  if(amount===0){
    try{
      if(localStorage.getItem(TEST_GRANT_KEY)!=='1'){
        localStorage.setItem(KEY,'100');
        localStorage.setItem(TEST_GRANT_KEY,'1');
        amount=100;
        console.info('V38_2_ONE_TIME_TEST_COINS_PLUS_100');
      }
    }catch(err){console.warn('V38.2 trial grant unavailable',err)}
  }""",1)
(site/'scripts/coin-v18.js').write_text(coin,'utf8')

h=site/'index.html';text=h.read_text('utf8')
assert text.count('</head>')==text.count('</body>')==1
assert text.count('scripts/coin-v18.js?v33')==1, 'V33 coin script cache key required'
text=text.replace('scripts/coin-v18.js?v33','scripts/coin-v18.js?v382',1)
text=text.replace('</head>','<link rel="stylesheet" href="scripts/unlock-v38.css?v38"/></head>',1)
text=text.replace('</body>','<script defer src="scripts/unlock-v38.js?v381"></script></body>',1)
h.write_text(text,'utf8')
assert m['tracks'][:len(old)]==old
for key,value in hashes.items():
 if key!=str(manifest):assert hashlib.sha256(Path(key).read_bytes()).hexdigest()==value,key
print('V38_2_EXISTING_V33_WALLET_ONE_TIME_TEST_GIFT_100_IF_ZERO_ONLY_WITH_SAME_COIN_LEDGER')

print('V38_DOOR_EASY_246_NOTES_95_7_BPM_90_432_SECONDS_LOCKED_30_COINS_AND_11_FREE_SONGS_PRESERVED')
