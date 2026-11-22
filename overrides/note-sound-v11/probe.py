#!/usr/bin/env python3
from pathlib import Path
import re,json
s=Path("_site/scripts/main.js").read_text(encoding="utf8")
needles=[
"function playHit", "playHit = ", "function registerSuccess", "function registerMiss", 
"function processNotes", "registerSuccess(n", "playHit(", "audioCtx", "const audioCtx",
"function initGame", "function choose", "function startGame",
]
for needle in needles:
    occ=[m.start() for m in re.finditer(re.escape(needle),s)]
    print("PROBE_TAG",needle,"hits",len(occ))
    for i in occ[:4]:
        print("PROBE_CONTEXT", repr(s[max(0,i-350):min(len(s),i+720)]))
for m in ["easy","hard"]:
 p=json.loads(Path(f"_site/assets/charts/moonlight-{m}.json").read_text())
 print("PROBE_CHART",m,"keys",list(p),"meta",repr({k:v for k,v in p.items() if k!="notes"})[:500],
 "notes",len(p["notes"]),"sample",repr(p["notes"][:4])[:900])
print("PROBE_MAIN_LENGTH",len(s))
