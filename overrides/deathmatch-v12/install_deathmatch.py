#!/usr/bin/env python3
"""Install the user's original Deathmatch as a playable V12 EASY track.

Must run *after* all V11 validations and V7 preview preparation.
Uses 153.0-210.3s of a single continuous source; never splices distant
sections. Previous Moonlight assets/tracks are retained unmodified.
"""
import json
from pathlib import Path
from zipfile import ZipFile
from hashlib import sha256

SITE=Path("_site")
AUDIO=SITE/"assets/audio/deathmatch_one_take_v12.mp3"
CHART=SITE/"assets/charts/deathmatch_easy_v12.json"

def main():
    assert AUDIO.is_file() and CHART.is_file(),"Deathmatch V12 ZIP must be unpacked first"
    assert sha256(AUDIO.read_bytes()).hexdigest()=="2e7b1290f474bfb54f64e9c30c7fa9d53791ec15fbdfb5a551a21a24f182b01d"
    c=json.loads(CHART.read_text(encoding="utf-8"))
    n=c["notes"]
    assert c["schemaVersion"]==1 and c["soundSchemaVersion"]==1
    assert 90<=len(n)<=150 and all(0<=x["lane"]<4 for x in n)
    assert all(0<x["t"]<56 and (x["kind"]=="tap" or x["lane"] in (0,3)) for x in n)
    assert all(x["sound"]["midi"]==x["pitch"] for x in n)
    assert all(n[i+1]["t"]-n[i]["t"]>.135 for i in range(len(n)-1))
    assert c["sourceAudioStartSeconds"]==153.0 and c["sourceAudioEndSeconds"]==210.3

    # V11's note renderer understands note.sound but a legacy validation function
    # discards additional fields. Keep vetted sound tags in loaded AND edited charts.
    js=SITE/"scripts/main.js"
    s=js.read_text(encoding="utf-8")
    needle="kind:n.kind==='flick'?'flick':'tap',pitch:Number(n.pitch)||60}));"
    replacement=("kind:n.kind==='flick'?'flick':'tap',pitch:Number(n.pitch)||60,"
        "sound:n.sound&&typeof n.sound==='object'?{"
        "instrument:['piano','guitar','strings','bass','synth'].includes(n.sound.instrument)?n.sound.instrument:'piano',"
        "midi:Number.isFinite(Number(n.sound.midi))?Number(n.sound.midi):(Number(n.pitch)||60),"
        "velocity:Math.min(1,Math.max(.15,Number(n.sound.velocity)||.7)),"
        "length:Math.min(.46,Math.max(.1,Number(n.sound.length)||.24))"
        "}:undefined}));")
    assert s.count(needle)==1,("V11 code's note validator changed",s.count(needle))
    s=s.replace(needle,replacement,1)
    assert s.count("sound:n.sound&&typeof n.sound==='object'")==1
    js.write_text(s,encoding="utf-8")

    mfile=SITE/"assets/manifest.json"
    m=json.loads(mfile.read_text(encoding="utf-8"))
    current=[t for t in m["tracks"] if t.get("status")=="ready"]
    assert len(current)==2 and [t["difficulty"] for t in current]==[3,5]
    track={
        "id":"deathmatch_one_take_v12",
        "title":"데스매치 · ONE TAKE",
        "subtitle":"원곡 연속 57초 · EASY ★★★ · V12 TEST",
        "composer":"사용자 제작 원곡 (Suno)",
        "difficulty":3,
        "bpm":143.55,
        "base":15000,
        "preRoll":0,
        "duration":57.3388,
        "audio":"assets/audio/deathmatch_one_take_v12.mp3",
        "chart":"assets/charts/deathmatch_easy_v12.json",
        "color":"#ff9878",
        "status":"ready",
        "origin":"데스매치 3:40 원본 2:33-3:30.3 연속 구간, 2.1초 마무리 페이드",
        "inputActions":6,
        "soundBank":"note-sound-v11-track-specific",
        "licenseNote":"사용자 제공 원곡 테스트 시안. 상업 배포 전 Suno 이용권·음원 권리 확인 필요"
    }
    # New track is shown first and selected by default for this requested test.
    # Existing Moonlight tracks, records and charts stay untouched.
    m["tracks"]=[track]+m["tracks"]
    m["version"]="2.3.0-v12-deathmatch-one-take"
    mfile.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding="utf-8")

    html=SITE/"index.html"
    h=html.read_text(encoding="utf-8")
    assert h.count('scripts/main.js?v11')==1
    h=h.replace('scripts/main.js?v11','scripts/main.js?v12',1)
    html.write_text(h,encoding="utf-8")
    print("DEATHMATCH_V12_INTEGRATION_VERIFIED",len(n),"notes","audio bytes",AUDIO.stat().st_size)

if __name__=="__main__":
    main()
