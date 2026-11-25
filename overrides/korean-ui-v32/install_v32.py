from pathlib import Path
import hashlib,shutil,re,base64
s=Path('_site');o=Path('overrides/korean-ui-v32')
protected=[s/'assets/manifest.json',*sorted(p for p in (s/'assets').rglob('*') if p.is_file())]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
dest=s/'assets/korean-v32';dest.mkdir(exist_ok=True)
for p in (o/'art').glob('*.svg'):shutil.copy2(p,dest/p.name)
(dest/'character.webp').write_bytes(base64.b64decode((o/'art/character.webp.b64').read_text()))
for name in ['korean-v32.css','korean-v32.js']:shutil.copy2(o/name,s/'scripts'/name)
def rep(t,a,b):
 assert t.count(a)==1,(a,t.count(a));return t.replace(a,b,1)
p=s/'scripts/main.js';t=p.read_text('utf8')
a=t.index('if(playing){\n  // V17 unified premium note language.')
z=t.index('ctx.globalAlpha=1;for(let i=particles.length-1',a)
assert 'if(n.coin)' in t[a:z] and "kind==='hold'" in t[a:z]
t=t[:a]+(o/'note-draw.js').read_text('utf8')+t[z:]
# Hit line nearer the controls; all timing logic untouched. Synchronize overlay and coin origin.
t=rep(t,'hitY=H*.79','hitY=H*.94')
t=rep(t,"const colors=['#ff7d99','#ffcf76','#73e9ff','#c08aff']","const colors=['#edb9c4','#f5dca0','#a9e0e5','#d4c2ee']")
a=t.index('let grad=ctx.createLinearGradient(0,0,W,H);')
z=t.index('const beat=60/',a)
assert 'flash[i]>ms' in t[a:z]
t=t[:a]+"""let grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#102238');grad.addColorStop(1,'#142a42');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#13294025':'#091b2e25';ctx.fillRect(i*tw,0,tw,H);ctx.strokeStyle='#8ab1d04b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(i*tw,0);ctx.lineTo(i*tw,H);ctx.stroke();if(flash[i]>ms){ctx.fillStyle=colors[i]+'2c';ctx.fillRect(i*tw,0,tw,H)}}
ctx.save();ctx.strokeStyle='#9bb5cd1b';ctx.lineWidth=1;for(const [cx,cy] of [[0,H*.19],[W,H*.59],[0,H*.83],[W,H*.87]]){for(let j=0;j<4;j++){ctx.beginPath();ctx.arc(cx,cy,16+j*13,Math.PI,Math.PI*2);ctx.stroke()}}ctx.restore();
"""+t[z:]
t=t.replace("ctx.shadowColor='#ff91dc';ctx.strokeStyle='#ffe7fb'","ctx.shadowColor='#e5cba2';ctx.strokeStyle='#fff0ca'")
p.write_text(t,'utf8')
p=s/'scripts/coin-v18.js';t=p.read_text('utf8');t=rep(t,'r.top+r.height*.79','r.top+r.height*.94');p.write_text(t,'utf8')
# Only display changes: no chart IDs, code paths, rules or data keys.
p=s/'index.html';t=p.read_text('utf8')
for name in ['main.js','coin-v18.js']:
 t,n=re.subn(r'(scripts/'+re.escape(name)+r')(?:\?v\d+)?',lambda m:m.group(1)+'?v32',t)
 assert n==1,(name,n)
t=rep(t,'</head>','<link rel="stylesheet" href="scripts/korean-v32.css?v32"/></head>')
t=rep(t,'</body>','<script defer src="scripts/korean-v32.js?v32"></script></body>')
p.write_text(t,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
print('V32_KOREAN_SKIN_ALL_EXISTING_AUDIO_CHARTS_MANIFEST_UNCHANGED')
