from pathlib import Path
import hashlib,shutil,subprocess,re
s=Path('_site');o=Path('overrides/shop-combo-v33')
protected=[p for p in (s/'assets').rglob('*') if p.is_file()]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
dest=s/'assets/items-v33';dest.mkdir(exist_ok=True)
# Exact approved sheet. Crop the art only, not the captions. No regeneration.
source=o/'approved-item-sheet.png'
items=['coin2','coin4','coin8','drink30','drink50','drink100','continue','guard','combo']
for i,name in enumerate(items):
 x=43+165*i
 # The multiplier ribbon belongs to the picture. Other captions start at y=302.
 y=162;h=155 if i<3 else 137
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(source),'-vf',f'crop=146:{h}:{x}:{y},scale=144:144:force_original_aspect_ratio=decrease,pad=144:144:(ow-iw)/2:(oh-ih)/2:color=0x10243a','-frames:v','1','-c:v','libwebp','-quality','93',str(dest/(name+'.webp'))],check=True)
for i,name in enumerate(['skin-note','skin-key','skin-bg','skin-theme','skin-hit','skin-judge']):
 x=[43,244,446,647,849,1050][i]
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(source),'-vf',f'crop=184:121:{x}:445,scale=144:144:force_original_aspect_ratio=decrease,pad=144:144:(ow-iw)/2:(oh-ih)/2:color=0x10243a','-frames:v','1','-c:v','libwebp','-quality','93',str(dest/(name+'.webp'))],check=True)
shutil.copy2(o/'expand.svg',dest/'expand.svg')
for name in ['shop-v33.js','shop-v33.css']:shutil.copy2(o/name,s/'scripts'/name)
# Extend the existing local coin wallet rather than introducing a parallel balance.
p=s/'scripts/coin-v18.js';t=p.read_text('utf8')
old="window.RhythmCoinV18={balance:()=>amount,selected:()=>notes.filter(n=>n.coin).length};"
assert t.count(old)==1
t=t.replace(old,"""function purchase(cost,commit){
    if(!Number.isSafeInteger(cost)||cost<=0||typeof commit!=='function')return false;
    const old=balance();if(old<cost)return false;
    try{localStorage.setItem(KEY,String(old-cost));commit();amount=old-cost;sync();return true}
    catch(e){try{localStorage.setItem(KEY,String(old))}catch(_){}amount=old;sync();console.warn('V33 purchase rolled back',e);return false}
  }
  window.RhythmCoinV18={balance:()=>amount,selected:()=>notes.filter(n=>n.coin).length,purchase};""")
p.write_text(t,'utf8')
p=s/'index.html';t=p.read_text('utf8')
t,n=re.subn(r'(scripts/coin-v18\.js)(?:\?v\d+)?',r'\1?v33',t);assert n==1
assert t.count('</head>')==1 and t.count('</body>')==1
t=t.replace('</head>','<link rel="stylesheet" href="scripts/shop-v33.css?v331"/></head>').replace('</body>','<script defer src="scripts/shop-v33.js?v331"></script></body>')
p.write_text(t,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V33_APPROVED_ART_CROPPED_EXISTING_MUSIC_CHARTS_UNCHANGED')
