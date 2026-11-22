#!/usr/bin/env python3
"""Add a small, text-free energy bar to the V8 EASY add-on during site build.

Keeps the original ZIP, score logic, audio, hit windows and HARD behavior intact.
Runs after build_short_v8.py has applied the approved energy values.
"""
from pathlib import Path
import sys

def apply(source: str) -> str:
    needle = "    const pct=Math.min(100, Math.max(0,health));"
    assert source.count(needle) == 1, "Unexpected V8 showHealth structure"
    insert = """
    // V9 slim meter: no visible digits or labels. Reuses the existing health
    // and existing stable / warning / danger thresholds, so the background
    // tint and bar always describe exactly the same game state.
    let v9Meter = document.getElementById('v9HealthMeter');
    if (!v9Meter) {
      const hud = document.querySelector('.hud');
      if (hud) {
        v9Meter = document.createElement('div');
        v9Meter.id = 'v9HealthMeter';
        v9Meter.setAttribute('role', 'progressbar');
        v9Meter.setAttribute('aria-label', 'Energy remaining');
        v9Meter.setAttribute('aria-valuemin', '0');
        v9Meter.setAttribute('aria-valuemax', '100');
        const v9Fill = document.createElement('div');
        v9Fill.className = 'v9HealthFill';
        v9Meter.appendChild(v9Fill);
        hud.insertAdjacentElement('afterend', v9Meter);
      }
    }
    if (v9Meter) {
      v9Meter.dataset.level = level;
      v9Meter.firstElementChild.style.width = pct + '%';
      v9Meter.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
"""
    return source.replace(needle, needle + insert, 1)

if __name__ == '__main__':
    target = Path(sys.argv[1])
    before = target.read_text(encoding='utf-8')
    after = apply(before)
    assert after != before and after.count("id = 'v9HealthMeter'") == 1
    target.write_text(after, encoding='utf-8')
    print("V9_ENERGY_METER_PATCHED")
