#!/usr/bin/env python3
"""V17: one musical hold near the final '얘들아' phrase of 오늘밤도 HARD,
and a coherent high-quality Canvas note/gesture design for every song.
Apply AFTER V16 to the assembled site; do not touch other charts or audio.
"""
from pathlib import Path
import json

SITE=Path('_site')
CHART=SITE/'assets/charts/tonight_hard_v16.json'
MAIN=SITE/'scripts/main.js'
HTML=SITE/'index.html'
CSS=SITE/'scripts/note-style-v17.css'
START=62.6428
END=65.0500

# The final melodic phrase before an audible decay is a musical candidate for a
# long gesture, not a demand to attach holds to every sustained sound.
c=json.loads(CHART.read_text(encoding='utf-8'))
notes=c['notes']
assert len(notes)==230
matches=[n for n in notes if abs(n['t']-START)<.001 and n['lane']==1 and n['kind']=='tap']
assert len(matches)==1,matches
head=matches[0]
assert head['pitch']==43 and all(n['lane']!=1 or n is head or not START<n['t']<END+.25 for n in notes)
head.update(kind='hold',duration=round(END-START,4),holdVersion=17)
release={
 't':END,'lane':1,'kind':'release','pitch':head['pitch'],
 'startT':START,'sound':dict(head['sound']),
 'origin':'2026-11-23 user requested a single sustained last lyrical phrase; tentative release point in quiet ending'
}
notes.append(release)
notes.sort(key=lambda n:(n['t'],n['lane'],n['kind']))
c['notes']=notes;c['holdSchemaVersion']=1
c['holdDesignNotes']='One candidate 62.6428-65.0500s (original 246.2128-248.6200s) for ending vocal/phrase. Trial, exact lyric onset to be confirmed by user ear.'
assert len(notes)==231 and sum(n['kind']=='hold' for n in notes)==1 and sum(n['kind']=='release' for n in notes)==1
CHART.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('V17_TONIGHT_HARD_ENDING_HOLD',START,END,len(notes))

s=MAIN.read_text(encoding='utf-8')
# Replace ONLY the note-render pass. Note timing, hit lines, input, scoring and
# keyboard are kept verbatim. All main source functions outside this region stay.
open_marker="if(playing){\n  for(let r of notes){\n    if(r.kind!=='release'"
close_marker="ctx.globalAlpha=1;for(let i=particles.length-1;i>=0;i--)"
assert s.count(open_marker)==1,(open_marker,s.count(open_marker))
assert s.count(close_marker)==1
begin=s.index('if(playing){\n  for(let r of notes){\n    if(r.kind')
end=s.index(close_marker,begin)
old=s[begin:end]
assert "fillText('↑'" in old and "fillText('HOLD'" in old and 'kind===\'release\'' in old
new=r'''if(playing){
  // V17 unified premium note language. Same body geometry & judgement centre
  // for tap, flick and hold; a flick is identified by its upward light trail,
  // not by a crude printed arrow. Notes never change gameplay timing.
  for(const r of notes){
    if(r.kind!=='release'||r.state!=='pending'||!Number.isFinite(r.startT))continue;
    if(r.t<t-.28||r.startT>t+3.6)continue;
    const sy=hitY-(r.startT-t)*speedPx,ey=hitY-(r.t-t)*speedPx;
    const upper=Math.max(-20,ey),lower=Math.min(hitY+18,sy);
    if(lower<=upper)continue;
    const x=r.lane*tw+tw*.215,w=tw*.57,h=lower-upper;
    ctx.save();
    const beam=ctx.createLinearGradient(x,upper,x+w,upper);
    beam.addColorStop(0,'rgba(61,136,195,.27)');beam.addColorStop(.19,'rgba(82,221,244,.67)');
    beam.addColorStop(.57,'rgba(187,248,255,.82)');beam.addColorStop(1,'rgba(50,138,215,.34)');
    ctx.shadowColor='#70ddff';ctx.shadowBlur=16;
    ctx.fillStyle=beam;rr(x,upper,w,h,Math.min(9,h*.38));ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(202,251,255,.66)';ctx.lineWidth=1.2;
    rr(x+.65,upper+.65,w-1.3,Math.max(1,h-1.3),Math.min(8,h*.36));ctx.stroke();
    const core=ctx.createLinearGradient(0,upper,0,lower);
    core.addColorStop(0,'rgba(245,255,255,.75)');core.addColorStop(.6,'rgba(151,245,255,.23)');core.addColorStop(1,'rgba(255,255,255,.5)');
    ctx.fillStyle=core;rr(x+w*.36,upper,w*.12,h,4);ctx.fill();
    // End marker: the finger comes off precisely when this rim meets the line.
    if(ey>-22&&ey<H+22){
      ctx.strokeStyle='#ecfbff';ctx.lineWidth=2.4;ctx.shadowColor='#a3f3ff';ctx.shadowBlur=9;
      ctx.beginPath();ctx.moveTo(x-3,ey);ctx.lineTo(x+w+3,ey);ctx.stroke();
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }
  const darks=['#8c274f','#946029','#126b89','#613a8b'];
  for(const n of notes){
    if(n.state!=='pending'||n.kind==='release')continue;
    if(n.t>t+3.6)break;
    const y=hitY-(n.t-t)*speedPx;
    if(y<-70||y>H+35)continue;
    const x=n.lane*tw+7,w=tw-14,half=13;
    const flick=n.kind==='flick',hold=n.kind==='hold';
    const bright=flick?'#72fff0':hold?'#b0f8ff':colors[n.lane];
    ctx.save();
    // Gesture comet: two swept, fading curves, floating motes and an upper tail.
    // Its body still occupies exactly y-13..y+13 like an ordinary TAP note.
    if(flick){
      const cx=x+w*.5,tail=ctx.createLinearGradient(0,y-63,0,y-12);
      tail.addColorStop(0,'rgba(130,255,244,0)');tail.addColorStop(.35,'rgba(104,255,239,.57)');
      tail.addColorStop(1,'rgba(220,255,252,.92)');
      ctx.strokeStyle=tail;ctx.lineCap='round';ctx.shadowBlur=9;ctx.shadowColor='#5af4ef';
      ctx.lineWidth=3.6;ctx.beginPath();
      ctx.moveTo(cx-w*.14,y-12);ctx.bezierCurveTo(cx-w*.28,y-27,cx+w*.10,y-40,cx+w*.07,y-58);ctx.stroke();
      ctx.lineWidth=1.8;ctx.globalAlpha=.72;ctx.beginPath();
      ctx.moveTo(cx+w*.09,y-14);ctx.bezierCurveTo(cx+w*.28,y-31,cx+w*.20,y-43,cx+w*.22,y-49);ctx.stroke();
      ctx.globalAlpha=1;ctx.shadowBlur=0;
      for(let i=0;i<3;i++){
        const py=y-21-i*13,px=cx+w*(i===1?.24:-.24)+Math.sin(t*3+i)*2;
        ctx.fillStyle=i===1?'#d6fff9':'rgba(145,255,244,.65)';
        ctx.beginPath();ctx.arc(px,py,1.35+(2-i)*.26,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.shadowBlur=13;ctx.shadowColor=bright;
    const fill=ctx.createLinearGradient(x,y-half,x,y+half);
    fill.addColorStop(0,flick?'#edfffe':hold?'#edfdff':'#fff5fb');
    fill.addColorStop(.19,bright);
    fill.addColorStop(.62,flick?'#26c7bb':hold?'#4ca5d3':colors[n.lane]);
    fill.addColorStop(1,flick?'#0b676e':hold?'#154f84':darks[n.lane]);
    ctx.fillStyle=fill;rr(x,y-half,w,26,8);ctx.fill();
    ctx.shadowBlur=0;
    ctx.lineWidth=1.1;ctx.strokeStyle=flick?'rgba(236,255,254,.92)':hold?'rgba(215,251,255,.92)':'rgba(255,255,255,.78)';
    rr(x+.55,y-half+.55,w-1.1,24.9,7.5);ctx.stroke();
    // Reflected lacquer highlight gives all three kinds depth, not flat blocks.
    const gloss=ctx.createLinearGradient(x,y-10,x,y+4);
    gloss.addColorStop(0,'rgba(255,255,255,.48)');gloss.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gloss;rr(x+5,y-10,w-10,9,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.32)';rr(x+8,y+8,w-16,1.4,1);ctx.fill();
    if(flick){
      // Small flowing double-swoosh on the surface, not a single arrow glyph.
      ctx.strokeStyle='#063d51';ctx.lineWidth=2.3;ctx.lineCap='round';
      const cx=x+w*.5;ctx.beginPath();
      ctx.moveTo(cx-11,y+5);ctx.quadraticCurveTo(cx-2,y-6,cx+12,y-4);ctx.stroke();
      ctx.strokeStyle='#e5fffc';ctx.lineWidth=1.5;ctx.beginPath();
      ctx.moveTo(cx-8,y+7);ctx.quadraticCurveTo(cx+3,y-2,cx+12,y-1);ctx.stroke();
    }else if(hold){
      ctx.strokeStyle='rgba(9,52,95,.83)';ctx.lineWidth=2;ctx.lineCap='round';
      for(const dx of [-8,0,8]){ctx.beginPath();ctx.moveTo(x+w*.5+dx,y+5);ctx.lineTo(x+w*.5+dx,y-6);ctx.stroke()}
      ctx.fillStyle='#e9feff';ctx.beginPath();ctx.arc(x+w*.5,y-8,2,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle='rgba(255,255,255,.52)';
      rr(x+w*.27,y+1,w*.46,2.3,2);ctx.fill();
    }
    ctx.restore();
  }
}
'''
s=s[:begin]+new+s[end:]
# The flick pad hint stays readable, but no raw up arrow is printed in it.
old_hint="b.querySelector('.sub').textContent=allowed?'↑ FLICK':'TAP'"
assert s.count(old_hint)==1
s=s.replace(old_hint,"b.querySelector('.sub').textContent=allowed?'FLICK':'TAP'",1)
assert s.count("fillText('↑'")==0
MAIN.write_text(s,encoding='utf-8')

assert CSS.is_file() and CSS.stat().st_size>1000
h=HTML.read_text(encoding='utf-8')
assert h.count('</head>')==1 and 'scripts/note-style-v17.css' not in h
h=h.replace('</head>','<link rel="stylesheet" href="scripts/note-style-v17.css?v17"/></head>',1)
HTML.write_text(h,encoding='utf-8')
print('V17_NOTE_ART_UNIFIED_AND_GESTURE_TRAILS_INSTALLED')
