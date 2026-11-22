#!/usr/bin/env python3
"""Adapt the approved V7 EASY preview add-on for the main multi-track game.
Only EASY (difficulty <= 3) gets V7; HARD uses the original engine and styling.
"""
from pathlib import Path
import sys

def adapt(src):
    changes = [
      ("  const origSuccess = registerSuccess, origMiss = registerMiss;",
       "  const origSuccess = registerSuccess, origMiss = registerMiss;\n  const origGrade = grade, origNearest = nearest, origProcessNotes = processNotes;\n  const isEasy = () => !!current && Number(current.difficulty) <= 3;"),
      ("  document.title = 'MOONLIGHT | EASY · V7 Rhythm Lab';\n  document.querySelector('.brand strong').textContent='MOONLIGHT / RHYTHM LAB';\n  document.querySelector('.brand small').textContent='CLASSICAL ARCADE  ·  EASY PLAYTEST';\n  document.querySelector('.genre').textContent='BEETHOVEN · MOVEMENT III · PLAYTEST V7';",
       "  const previousTitle = document.title;\n  const brandStrong = document.querySelector('.brand strong');\n  const brandSmall = document.querySelector('.brand small');\n  const genre = document.querySelector('.genre');\n  const previousStrong = brandStrong.textContent, previousSmall = brandSmall.textContent, previousGenre = genre.textContent;"),
      ("  document.querySelector('.hud').after(timeline);",
       "  document.querySelector('.hud').after(timeline);\n  timeline.style.display='none';"),
      ("  field.append(band);",
       "  field.append(band); band.style.display='none';"),
      ("  ttl.textContent='EASY · BUILD 07'; field.append(ttl);",
       "  ttl.textContent='EASY · BUILD 07'; field.append(ttl); ttl.style.display='none';"),
      ("  function paintBand(){\n    const r=getRules();",
       "  function paintBand(){\n    if(!isEasy())return;\n    const r=getRules();"),
      ("  function showHealth(){\n    const level =",
       "  function showHealth(){\n    if(!isEasy())return;\n    const level ="),
      ("  grade = function(delta){\n    const sec=",
       "  grade = function(delta){\n    if(!isEasy()) return origGrade(delta);\n    const sec="),
      ("  nearest = function(lane,kind){\n    const t=",
       "  nearest = function(lane,kind){\n    if(!isEasy()) return origNearest(lane,kind);\n    const t="),
      ("  registerSuccess = function(n, delta, auto=false){\n    if(!auto && n.state==='pending')playHit(n.sound||n.pitch,n.kind);\n    if(n.state",
       "  registerSuccess = function(n, delta, auto=false){\n    if(!isEasy()) return origSuccess(n,delta,auto);\n    if(!auto && n.state==='pending')playHit(n.sound||n.pitch,n.kind);\n    if(n.state"),
      ("  registerMiss = function(n){\n    if(n.state",
       "  registerMiss = function(n){\n    if(!isEasy()) return origMiss(n);\n    if(n.state"),
      ("  initGame = function(){\n    health=",
       "  initGame = function(){\n    if(!isEasy())return origInitGame();\n    health="),
      ("  choose = function(next){\n    origChoose(next);showHealth();paintBand();\n    document.getElementById('modeHint').textContent='EASY · SIGNATURE PIANO';\n  };",
       "  choose = function(next){\n    origChoose(next);\n    const easy=isEasy();\n    const sheet=document.getElementById('v7Theme');\n    if(sheet)sheet.disabled=!easy;\n    timeline.style.display=easy?'flex':'none';\n    band.style.display=ttl.style.display=easy?'':'none';\n    document.title=easy?'MOONLIGHT | EASY · V7 Rhythm Lab':previousTitle;\n    brandStrong.textContent=easy?'MOONLIGHT / RHYTHM LAB':previousStrong;\n    brandSmall.textContent=easy?'CLASSICAL ARCADE  ·  EASY PLAYTEST':previousSmall;\n    genre.textContent=easy?'BEETHOVEN · MOVEMENT III · PLAYTEST V7':previousGenre;\n    if(easy){showHealth();paintBand();document.getElementById('modeHint').textContent='EASY · SIGNATURE PIANO';}\n    else {delete field.dataset.health;delete document.body.dataset.health;}\n    const meter=document.getElementById('v9HealthMeter');\n    if(meter)meter.hidden=!easy;\n  };"),
      ("  updateHud = function(){\n    origUpdateHud();\n    if(!audio)return;",
       "  updateHud = function(){\n    origUpdateHud();\n    if(!isEasy()||!audio)return;"),
      ("  finishGame = function(){\n    if(!playing)return;",
       "  finishGame = function(){\n    if(!isEasy())return origFinish();\n    if(!playing)return;"),
      ("  processNotes = function(){\n    if(!playing||paused)return;",
       "  processNotes = function(){\n    if(!isEasy())return origProcessNotes();\n    if(!playing||paused)return;"),
      ("  function jumpTo(time){\n    if(!audio || !current)return;",
       "  function jumpTo(time){\n    if(!isEasy() || !audio || !current)return;"),
      ("  showHealth();paintBand();\n})();",
       "  if(current && !playing)choose(mode);\n  showHealth();paintBand();\n})();"),
    ]
    for i, (old, new) in enumerate(changes, start=1):
        if src.count(old) != 1:
            raise RuntimeError("V7 compatibility patch %d expected exactly once; got %d" % (i, src.count(old)))
        src = src.replace(old, new)
    return src

if __name__ == '__main__':
    original, target = map(Path, sys.argv[1:3])
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(adapt(original.read_text(encoding='utf-8')), encoding='utf-8')
