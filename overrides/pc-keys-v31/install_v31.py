from pathlib import Path
import hashlib
s=Path('_site')
files=[s/'assets/manifest.json',*sorted((s/'assets/charts').glob('*.json')),*sorted((s/'assets/audio').glob('*')),*sorted((s/'assets/drum-v3-v30').glob('*'))]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files if p.is_file()}
def rep(t,a,b):
 assert t.count(a)==1,(a,t.count(a));return t.replace(a,b,1)
p=s/'scripts/main.js';t=p.read_text('utf8')
a=t.index("const keymap={KeyD:0,KeyF:1,KeyJ:2,KeyK:3};")
z=t.index("function resetControls()",a)
old=t[a:z]
assert "document.addEventListener('keydown'" in old and "document.addEventListener('keyup'" in old
# Preserve everything outside the original keydown/keyup statement.
end=old.index("pressed(keymap[e.code],false)}});")+len("pressed(keymap[e.code],false)}});")
new="""const keymap={KeyM:0,Comma:1,Period:2,Slash:3,KeyK:0,KeyL:1,Semicolon:2,Quote:3};
const pcFlickKeys=new Set(['KeyK','KeyL','Semicolon','Quote']);
function pcTextInput(e){return !!e.target?.closest?.('input,textarea,select,[contenteditable=true]')}
document.addEventListener('keydown',e=>{
 if(e.code in keymap){
  if(!playing||paused||autoplay||pcTextInput(e)||e.ctrlKey||e.altKey||e.metaKey)return;
  e.preventDefault();if(e.repeat||keyHeld.has(e.code))return;
  keyHeld.add(e.code);const lane=keymap[e.code];pressed(lane,true);
  if(pcFlickKeys.has(e.code))inputFlick(lane);else inputTap(lane);
 }else if(e.code==='Escape'&&playing&&!pcTextInput(e)){$('pause').click()}
});
document.addEventListener('keyup',e=>{
 if(!keyHeld.has(e.code))return;
 keyHeld.delete(e.code);const lane=keymap[e.code];
 if(![...keyHeld].some(k=>keymap[k]===lane))pressed(lane,false);
});
window.addEventListener('blur',()=>{if(playing)resetControls()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)resetControls()});
"""
t=t[:a]+new+old[end:]+t[z:];p.write_text(t,'utf8')
h=s/'scripts/hold-v15.js';t=h.read_text('utf8')
t=rep(t,'const keymap={KeyD:0,KeyF:1,KeyJ:2,KeyK:3};','const keymap={KeyM:0,Comma:1,Period:2,Slash:3};')
t=rep(t,'e.repeat||e.shiftKey||holdKeys.has(e.code)','e.repeat||e.ctrlKey||e.altKey||e.metaKey||pcTextInput(e)||holdKeys.has(e.code)')
h.write_text(t,'utf8')
# Add desktop-only physical-key hints inside each existing pad; no geometry change.
(s/'scripts/pc-keys-v31.js').write_text("""(()=>{const labels=['M / K',', / L','. / ;','/ / \\''];for(let i=0;i<buttons.length;i++){const b=buttons[i];b.title='TAP / FLICK: '+labels[i];const k=document.createElement('span');k.className='pc-v31-keyhint';k.textContent=labels[i];b.append(k)}})();""",'utf8')
(s/'scripts/pc-keys-v31.css').write_text('.pc-v31-keyhint{display:none}@media (hover:hover) and (pointer:fine){#keyboard .key{position:relative}#keyboard .pc-v31-keyhint{display:block;position:absolute;top:3px;right:5px;font:700 10px/1.1 system-ui;color:#e9f5ff;opacity:.8;pointer-events:none}}','utf8')
h=s/'index.html';t=h.read_text('utf8')
import re
for name in ['main.js','hold-v15.js']:
 t,n=re.subn(r'(scripts/'+re.escape(name)+r')(?:\?v\d+)?',lambda m:m.group(1)+'?v31',t)
 assert n==1,(name,n)
t=rep(t,'</head>','<link rel="stylesheet" href="scripts/pc-keys-v31.css?v31"/></head>')
t=rep(t,'</body>','<script defer src="scripts/pc-keys-v31.js?v31"></script></body>')
h.write_text(t,'utf8')
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files if p.is_file()}
print('V31_PHYSICAL_KEYS_AND_HOLD_ONLY_ALL_CHART_AUDIO_UNCHANGED')
