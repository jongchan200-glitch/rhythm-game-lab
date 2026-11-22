#!/usr/bin/env python3
"""Patch the packed web game after V14 for ONE musically suitable Deathmatch hold.

Keep prior chart, song audio, settings, all mode screens and save keys intact.
The one bass sustain is held on lane 0 from 26.308s until 27.980s.
Two scored events distinguish the press and its timed release.
"""
import json
from pathlib import Path

SITE=Path('_site')
CHART=SITE/'assets/charts/deathmatch_easy_v12.json'
MAIN=SITE/'scripts/main.js'
HTML=SITE/'index.html'
MANIFEST=SITE/'assets/manifest.json'
CSS=SITE/'scripts/hold-v15.css'
JS=SITE/'scripts/hold-v15.js'
START=26.308
END=27.980

def replace_once(s,old,new,which):
    assert s.count(old)==1, f'{which}: expected one match, got {s.count(old)}'
    return s.replace(old,new,1)

def patch_chart():
    c=json.loads(CHART.read_text(encoding='utf-8'))
    n=c['notes']
    assert len(n)==131 and all(x['kind'] in ('tap','flick') for x in n)
    matches=[x for x in n if abs(x['t']-START)<.004 and x['lane']==0 and x['pitch']==54]
    assert len(matches)==1, matches
    head=matches[0]
    assert head['kind']=='tap' and head['sound']['instrument']=='bass'
    # The sustained bass is continuous until just before the next rhythmic entry.
    assert all(x['lane']!=0 or x is head or not START<x['t']<END+.3 for x in n)
    head['kind']='hold';head['duration']=round(END-START,4)
    head['holdVersion']=15
    release={'t':END,'lane':0,'kind':'release','pitch':head['pitch'],
             'startT':START,'sound':dict(head['sound']),
             'origin':'manual-phrasing-after-audio-spectrogram-review'}
    n.append(release)
    n.sort(key=lambda x:(x['t'],x['lane'],x['kind']))
    assert sum(x['kind']=='hold' for x in n)==sum(x['kind']=='release' for x in n)==1
    assert len(n)==132 and all(0<=x['lane']<=3 for x in n)
    c['notes']=n
    c['holdSchemaVersion']=1
    c['holdDesignNotes']='Only the sustained bass/rolling-pulse phrase at 26.308-27.980s uses hold/release. Other 130 notes unchanged.'
    CHART.write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
    print('HOLD_V15_CHART_VERIFIED',len(n),'press',START,'release',END)

def patch_engine():
    s=MAIN.read_text(encoding='utf-8')
    # V12 kept V11 sound tags but destroyed unknown kinds. Preserve four kinds.
    s=replace_once(s,
        "kind:n.kind==='flick'?'flick':'tap'",
        "kind:['tap','flick','hold','release'].includes(n.kind)?n.kind:'tap'",
        'kind validation')
    s=replace_once(s,
        "pitch:Number(n.pitch)||60,sound:n.sound",
        "pitch:Number(n.pitch)||60,duration:Number(n.duration)||0,startT:Number.isFinite(Number(n.startT))?Number(n.startT):undefined,sound:n.sound",
        'duration/startT preservation')
    s=replace_once(s,
        "out.sort((a,b)=>a.t-b.t||a.lane-b.lane);",
        """out.sort((a,b)=>a.t-b.t||a.lane-b.lane);
 // A release must be paired to one preceding hold, never become a tap.
 for(const n of out){
   if(n.kind==='hold'&&(!Number.isFinite(n.duration)||n.duration<.45||n.duration>3.5))throw Error('홀드 노트 길이 오류');
   if(n.kind==='release'){
     const h=out.find(x=>x.kind==='hold'&&x.lane===n.lane&&Math.abs(x.t-n.startT)<.035);
     if(!h||Math.abs(h.t+h.duration-n.t)>.035)throw Error('홀드 종료 시점 또는 연결 오류');
   }
 }""",
        'paired hold/release validation')
    # Draw the vertical sustained ribbon BEFORE the normal head. The linked
    # release event survives after the head is scored.
    original="if(playing){for(let n of notes){if(n.state!=='pending')continue;if(n.t>t+3.6)break;"
    new="""if(playing){
  for(let r of notes){
    if(r.kind!=='release'||r.state!=='pending'||!Number.isFinite(r.startT))continue;
    if(r.t<t-0.28||r.startT>t+3.6)continue;
    const sy=hitY-(r.startT-t)*speedPx,ey=hitY-(r.t-t)*speedPx;
    const upper=Math.max(-20,ey),lower=Math.min(hitY+18,sy);
    if(lower>upper){
      const left=r.lane*tw+tw*.24,w=tw*.52;
      ctx.save();ctx.shadowBlur=17;ctx.shadowColor='#b4e9fa';
      ctx.fillStyle='rgba(96,218,248,.44)';rr(left,upper,w,lower-upper,7);ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle='rgba(205,249,255,.68)';rr(left+w*.19,upper,w*.15,lower-upper,4);ctx.fill();
      ctx.restore();
    }
  }
  for(let n of notes){if(n.state!=='pending')continue;if(n.kind==='release')continue;if(n.t>t+3.6)break;"""
    s=replace_once(s,original,new,'hold ribbon drawing')
    s=replace_once(s,
      "}else{ctx.fillStyle=colors[n.lane];rr(left,y-12,nw,24,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffffffa7';rr(left+6,y-8,nw-12,4,2);ctx.fill()}}}",
      """}else if(n.kind==='hold'){
      ctx.fillStyle='#8ce7ff';rr(left,y-15,nw,30,8);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#08384b';ctx.textAlign='center';ctx.font='900 11px system-ui';
      ctx.fillText('HOLD',left+nw/2,y+4);
    }else{ctx.fillStyle=colors[n.lane];rr(left,y-12,nw,24,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffffffa7';rr(left+6,y-8,nw-12,4,2);ctx.fill()}}}""",
      'hold head drawing')
    MAIN.write_text(s,encoding='utf-8')
    assert s.count("kind:['tap','flick','hold','release']")==1
    assert s.count("ctx.fillText('HOLD'")==1
    print('HOLD_V15_ENGINE_AND_RENDER_VERIFIED')

def patch_page():
    assert JS.is_file() and CSS.is_file()
    s=HTML.read_text(encoding='utf-8')
    assert s.count('</head>')==1 and s.count('</body>')==1
    assert s.count('scripts/home-v14.js?v14')==1
    s=s.replace('</head>','<link rel="stylesheet" href="scripts/hold-v15.css?v15"/></head>',1)
    s=s.replace('</body>','<script defer src="scripts/hold-v15.js?v15"></script></body>',1)
    HTML.write_text(s,encoding='utf-8')
    m=json.loads(MANIFEST.read_text(encoding='utf-8'))
    assert [x['id'] for x in m['tracks'] if x.get('status')=='ready']==[
      'deathmatch_one_take_v12','moonlight_intro_rock_v4_3','moonlight_epic_rock_v2_5']
    m['version']='2.4.0-v15-hold-release-playtest'
    MANIFEST.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
    print('HOLD_V15_PAGE_INTEGRATED')

if __name__=='__main__':
    patch_chart();patch_engine();patch_page()
    print('HOLD_V15_COMPLETE')
