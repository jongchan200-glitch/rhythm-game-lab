#!/usr/bin/env python3
"""V11: note-specific MIDI pitch and timbre, never fixed-pitch buttons.

Four lanes remain input targets. Difficulty controls allowed tap/flick actions.
Each NOTE chooses instrument and MIDI pitch (and later per-note duration/velocity).
The original packaged files and all scoring/level/UI rules stay unchanged.
"""
from __future__ import annotations
import json
from pathlib import Path

SITE = Path("_site")
ADDON = Path("/tmp/rhythm-easy-v7/easy-v7-addon.js")

# Currently both playable songs are Moonlight Piano-based arrangements.
# Add future songs and override individual notes via their chart's sound tag.
SONG_PRESETS = {
    "easy": "piano",
    "hard": "piano",
}

SOUND_ENGINE = r"""function playHit(sound,kind){
  if(!fxEnabled||fxVol<=0)return;
  initAudio();if(!ac)return;
  // Input lane and gesture NEVER determine pitch. The exact chart note does.
  const tag=(sound&&typeof sound==='object')?sound:{midi:sound,instrument:'piano'};
  const rawMidi=Number(tag.midi===undefined?tag.pitch:tag.midi);
  if(!Number.isFinite(rawMidi))return;
  const midi=Math.max(21,Math.min(108,rawMidi));
  const fundamental=440*Math.pow(2,(midi-69)/12);
  const instrument=String(tag.instrument||'piano').toLowerCase();
  const banks={
    piano:{partials:[1,.30,.12,.045],attack:.003,decay:.28},
    guitar:{partials:[1,.50,.20,.06],attack:.002,decay:.23},
    strings:{partials:[1,.31,.14,.06],attack:.012,decay:.31},
    bass:{partials:[1,.24,.08],attack:.003,decay:.24},
    synth:{partials:[1,.42,.18,.07],attack:.008,decay:.29}
  };
  const bank=banks[instrument]||banks.piano;
  const velocity=Math.max(.15,Math.min(1,Number(tag.velocity)||.75));
  const length=Math.max(.10,Math.min(.46,Number(tag.length)||bank.decay));
  // A flick is a gesture, not a separate drum key or musical pitch.
  const seconds=kind==='flick'?length*.86:length;
  const now=ac.currentTime;
  try{
    const envelope=ac.createGain(),sum=bank.partials.reduce((a,b)=>a+b,0);
    const peak=Math.max(.0002,fxVol*.095*velocity);
    envelope.gain.setValueAtTime(.0001,now);
    envelope.gain.exponentialRampToValueAtTime(peak,now+bank.attack);
    envelope.gain.exponentialRampToValueAtTime(.0001,now+seconds);
    envelope.connect(fxBus||ac.destination);
    for(let i=0;i<bank.partials.length;i++){
      const freq=fundamental*(i+1);
      if(freq>11000)break;
      const osc=ac.createOscillator(),partial=ac.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(freq,now);
      partial.gain.value=bank.partials[i]/sum;
      osc.connect(partial);partial.connect(envelope);
      osc.start(now);osc.stop(now+seconds+.018);
    }
  }catch(e){}
}
"""

def change_once(s, old, new, what):
    count=s.count(old)
    assert count==1, f"{what}: expected exactly one occurrence, got {count}"
    return s.replace(old,new,1)

def tag_charts():
    for mode, instrument in SONG_PRESETS.items():
        chart_file=SITE/f"assets/charts/moonlight-{mode}.json"
        chart=json.loads(chart_file.read_text(encoding="utf-8"))
        notes=chart["notes"]
        assert len(notes)>=75, (mode,len(notes))
        for n in notes:
            # Chart pitch already comes from the selected musical phrase.
            # Never replace it by lane-based C/D/E/F mapping.
            pitch=n.get("pitch")
            assert isinstance(pitch,int) and 21<=pitch<=108, (mode,n)
            n["sound"]={"instrument":instrument,"midi":pitch,"velocity":.75,"length":.27}
        lane_pitch={i:{n["sound"]["midi"] for n in notes if n["lane"]==i} for i in range(4)}
        assert all(len(s)>1 for s in lane_pitch.values()), f"Pitch wrongly locked to lane in {mode}: {lane_pitch}"
        assert all(n["sound"]["midi"]==n["pitch"] for n in notes)
        chart["soundSchemaVersion"]=1
        chart["soundBank"]=f"note-sound-v11-{instrument}"
        chart_file.write_text(json.dumps(chart,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
        print("V11_CHART_SOUND_TAGGED",mode,len(notes),"varying_notes_per_lane",[len(s) for s in lane_pitch.values()])

    manifest_file=SITE/"assets/manifest.json"
    manifest=json.loads(manifest_file.read_text(encoding="utf8"))
    for track in manifest["tracks"]:
        if track.get("status")=="ready" and int(track.get("difficulty") or 0) in (3,5):
            difficulty=int(track["difficulty"])
            track["inputActions"]=4 if difficulty==1 else (6 if difficulty<=3 else 8)
            track["soundBank"]="note-sound-v11-piano"
    manifest["version"]="2.2.0-v11-note-pitch"
    manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")

def patch_main():
    p=SITE/"scripts/main.js"
    s=p.read_text(encoding="utf8")
    start=s.index("function playHit(pitch,kind){")
    end=s.index("function toast(label)",start)
    old=s[start:end]
    assert "kind==='flick'?150:118" in old, "Original fixed 118/150 Hz effect changed"
    assert old.count("function playHit(")==1
    s=s[:start]+SOUND_ENGINE+"\n"+s[end:]
    s=change_once(s,"playHit(n.pitch,n.kind);toast(label)",
                  "playHit(n.sound||n.pitch,n.kind);toast(label)",
                  "legacy success note call")
    p.write_text(s,encoding="utf-8")
    print("V11_BASE_NOTE_PITCH_ENGINE_PATCHED")

def patch_addon():
    s=ADDON.read_text(encoding="utf8")
    # V7 has its own success handler and must also forward the note's sound tag.
    # V7 replaces registerSuccess completely, so the original main.js
    # sound call is not executed for EASY. Add it only on a real valid tap.
    # Do not play notes on auto-demo or for a missed/duplicate input.
    needle="  registerSuccess = function(n, delta, auto=false){\n    if(n.state"
    replacement="  registerSuccess = function(n, delta, auto=false){\n    if(!auto && n.state==='pending')playHit(n.sound||n.pitch,n.kind);\n    if(n.state"
    assert s.count(needle)==1, "Unexpected V7 success override"
    assert "playHit(" not in s, "V7 now has a separate sound call; inspect to avoid duplicate audio"
    s=s.replace(needle,replacement,1)
    ADDON.write_text(s,encoding="utf8")
    print("V11_EASY_SOUND_TAG_CALLS_PATCHED",1)

if __name__=="__main__":
    tag_charts()
    patch_main()
    patch_addon()
    print("V11_NOTE_SOUND_PREPARED")
