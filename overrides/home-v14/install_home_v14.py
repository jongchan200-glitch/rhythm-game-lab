#!/usr/bin/env python3
"""Upgrade only the deployed music lobby from V13 to the V14 two-page UI.

V13 tests run first. This patch retains all existing song files, charts, source,
settings, record keys, scoring, auto play, and auxiliary panels unchanged.
"""
from pathlib import Path
from hashlib import sha256
site=Path('_site')
js=site/'scripts/home-v14.js'
css=site/'scripts/home-v14.css'
html=site/'index.html'
assert js.is_file() and css.is_file()
assert len(js.read_text(encoding='utf-8'))>16500
assert len(css.read_text(encoding='utf-8'))>22500
s=html.read_text(encoding='utf-8')
old_css='scripts/home-v13.css?v13'
old_js='scripts/home-v13.js?v13'
assert s.count(old_css)==1 and s.count(old_js)==1
assert 'scripts/main.js?v12' in s and 'easy-v7-addon.js?v11' in s
assert s.count('</head>')==1 and s.count('</body>')==1
s=s.replace(old_css,'scripts/home-v14.css?v14',1).replace(old_js,'scripts/home-v14.js?v14',1)
assert s.count('home-v14.css?v14')==1 and s.count('home-v14.js?v14')==1
assert old_css not in s and old_js not in s
html.write_text(s,encoding='utf-8')
print('RHYTHM_HOME_V14_INSTALLED_TWO_SWIPE_PAGES_FIXED_FOOTER_CREDITS')
