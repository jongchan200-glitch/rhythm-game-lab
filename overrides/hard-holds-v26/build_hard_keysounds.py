#!/usr/bin/env python3
"""Reuse V24's real-source separation for the independently mapped HARD chart."""
from pathlib import Path
p=Path('overrides/drum-keysound-v24/build_keysounds.py')
s=p.read_text('utf8')
for a,b in [
 ("out=site/'assets/keysound-v24'","out=site/'assets/keysound-hard-v26'"),
 ("chart=site/'assets/charts/well_lived_hard_repeat_v21.json'","chart=site/'assets/charts/well_lived_hard_master_v26.json'"),
 ("assert len(ns)==240 and sum(n['kind']=='flick' for n in ns)==40","assert len(ns)==390 and sum(n['kind']=='hold' for n in ns)==18"),
 ("'songId':'well_lived_hard_repeat_v21'","'songId':'well_lived_hard_master_v26'"),
 ("'version':24","'version':26"),
 ("V24_SOURCE_KEYSOUND_BUILD","V26_HARD_SOURCE_KEYSOUND_BUILD")]:
    assert s.count(a)==1,(a,s.count(a))
    s=s.replace(a,b,1)
exec(compile(s,str(p),'exec'))
