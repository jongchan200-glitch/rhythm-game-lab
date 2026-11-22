#!/usr/bin/env python3
"""V13: install simplified music carousel / Hell Fall-style five-tab home.

Runs after V12 chart/audio verification. Does not alter gameplay scoring,
existing playlist, game audio, records or any existing settings control.
"""
from pathlib import Path

site = Path('_site')
script = site/'scripts/home-v13.js'
style = site/'scripts/home-v13.css'
html = site/'index.html'

assert script.exists() and script.stat().st_size>12000
assert style.exists() and style.stat().st_size>10000
text = html.read_text(encoding='utf-8')
assert 'scripts/main.js?v12' in text
assert 'easy-v7-addon.js?v11' in text
assert text.count('</head>')==1 and text.count('</body>')==1
assert 'home-v13.js' not in text and 'home-v13.css' not in text
text=text.replace('</head>', '<link rel="stylesheet" href="scripts/home-v13.css?v13"/></head>',1)
text=text.replace('</body>', '<script defer src="scripts/home-v13.js?v13"></script></body>',1)
html.write_text(text,encoding='utf-8')
print('RHYTHM_HOME_V13_INSTALLED_SONG_CAROUSEL_AND_HELL_FALL_NAV')
