#!/usr/bin/env python3
"""V8: musical ~60s arrangement + synchronized four-lane charts + stricter V7 energy.

Run *after* V6 audio/chart extraction and the V7 addon ZIP extraction.
No original asset or source archive is overwritten; only the assembled _site changes.
"""
from __future__ import annotations

import copy
import json
import subprocess
from collections import deque
from pathlib import Path

SITE = Path("_site")
ADDON = Path("/tmp/rhythm-easy-v7/easy-v7-addon.js")
XFADE = 0.18

# (tempo, intro bars, feature bars, finale bars, feature position as fraction of original)
ARRANGEMENTS = {
    "easy": (124, 6, 17, 8, 0.35),
    "hard": (138, 7, 19, 8, 0.35),
}

# PERFECT, GREAT recovery and BAD, MISS penalty. GOOD remains zero.
ENERGY = {
    1: (1.5, 0.6, -5, -9),
    2: (1.1, 0.4, -7, -12),
    3: (0.8, 0.3, -9, -16),
    4: (0.5, 0.2, -13, -22),
    5: (0.3, 0.1, -18, -30),
}
OLD_ENERGY = {
    1: (4, 2, -2, -4),
    2: (3, 1.5, -3, -6),
    3: (2, 1, -4, -8),
    4: (2, 1, -6, -12),
    5: (2, 1, -8, -16),
}
BANDS = {1: 28, 2: 23, 3: 18, 4: 12, 5: 4}


def run(*args: str) -> str:
    result = subprocess.run(args, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def duration(path: Path) -> float:
    return float(
        run(
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        )
    )


def build_segments(original_length: float, bpm: int, intro_bars: int,
                   feature_bars: int, finale_bars: int, feature_fraction: float):
    bar = 4.0 * 60.0 / bpm
    intro_end = intro_bars * bar
    feature_start = round(original_length * feature_fraction / bar) * bar
    feature_end = feature_start + feature_bars * bar
    finale_start = round((original_length - finale_bars * bar) / bar) * bar
    assert 0 < intro_end + 3 < feature_start, "Intro overlaps feature"
    assert feature_end + 3 < finale_start, "Feature overlaps ending"
    assert finale_start < original_length - 7, "Ending too short"
    return [(0.0, intro_end), (feature_start, feature_end),
            (finale_start, original_length)]


def render_audio(src: Path, out: Path, segments):
    chains = []
    for i, (start, end) in enumerate(segments):
        chains.append(
            f"[0:a]atrim=start={start:.6f}:end={end:.6f},"
            f"asetpts=PTS-STARTPTS[a{i}]"
        )
    chains.append(f"[a0][a1]acrossfade=d={XFADE}:c1=tri:c2=tri[x01]")
    chains.append(f"[x01][a2]acrossfade=d={XFADE}:c1=tri:c2=tri[out]")
    subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
         "-i", str(src), "-filter_complex", ";".join(chains),
         "-map", "[out]", "-ar", "44100", "-c:a", "libmp3lame",
         "-b:a", "224k", str(out)],
        check=True,
    )


def rechart(path: Path, segments, full_audio_duration: float):
    chart = json.loads(path.read_text(encoding="utf-8"))
    notes = chart["notes"]
    assert chart["schemaVersion"] == 1 and len(notes) >= 300
    output_notes = []
    new_offset = 0.0
    for idx, (start, end) in enumerate(segments):
        for note in notes:
            t = float(note["t"])
            if not start <= t < end:
                continue
            # A short visual rest at each audio transition prevents accidental
            # overlapping 3+ note clusters while the two phrases crossfade.
            if idx > 0 and t - start < 0.32:
                continue
            if idx < len(segments) - 1 and end - t < 0.32:
                continue
            rebuilt = copy.deepcopy(note)
            rebuilt["t"] = round(new_offset + (t - start), 4)
            output_notes.append(rebuilt)
        new_offset += (end - start) - (XFADE if idx < len(segments) - 1 else 0)
    output_notes.sort(key=lambda n: (n["t"], n["lane"], n["kind"]))

    # Only remove a third simultaneous/near-simultaneous input. Rapid sequences
    # *after* a two-note chord are intentionally not subject to a blanket gap.
    cleaned = []
    window = deque()
    dropped_three = 0
    for note in output_notes:
        while window and note["t"] - window[0] > 0.080:
            window.popleft()
        if len(window) >= 2:
            dropped_three += 1
            continue
        window.append(note["t"])
        cleaned.append(note)

    assert 75 <= len(cleaned) <= 350, f"Implausible short chart count: {len(cleaned)}"
    assert all(0 <= n["lane"] <= 3 and 0 <= n["t"] < full_audio_duration - 0.4 for n in cleaned)
    assert all(n["kind"] in ("tap", "flick") for n in cleaned)
    chart["notes"] = cleaned
    path.write_text(json.dumps(chart, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return len(notes), len(cleaned), dropped_three, cleaned[-1]["t"]


def patch_energy():
    text = ADDON.read_text(encoding="utf-8")
    for star, older in OLD_ENERGY.items():
        newer = ENERGY[star]
        # Match the exact approved V7 table and retain the judgement band width.
        old = (f"{star}:{{perfect:{BANDS[star]},"
               f" plusPerfect:{older[0]}, plusGreat:{older[1]}, bad:{older[2]}, miss:{older[3]}}},")
        # The original V7 fifth line has two spaces after the comma.
        if star == 5:
            old = old.replace("perfect:4, plusPerfect", "perfect:4,  plusPerfect")
        new = (f"{star}:{{perfect:{BANDS[star]},"
               f" plusPerfect:{newer[0]}, plusGreat:{newer[1]}, bad:{newer[2]}, miss:{newer[3]}}},")
        if star == 5:
            new = new.replace("perfect:4, plusPerfect", "perfect:4,  plusPerfect")
        assert text.count(old) == 1, f"Unexpected V7 energy rule for {star}-star: {old}"
        text = text.replace(old, new)
    ADDON.write_text(text, encoding="utf-8")


def main():
    manifest_file = SITE / "assets/manifest.json"
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    tracks = [t for t in manifest["tracks"] if t.get("status") == "ready"]
    assert len(tracks) == 2 and [t["difficulty"] for t in tracks] == [3, 5]

    for mode, config in ARRANGEMENTS.items():
        bpm, intro, feature, finale, fraction = config
        original = SITE / f"assets/audio/moonlight-{mode}-dynamic-v6.mp3"
        edited = SITE / f"assets/audio/moonlight-{mode}-short-v8.mp3"
        chart = SITE / f"assets/charts/moonlight-{mode}.json"
        old_duration = duration(original)
        segments = build_segments(old_duration, bpm, intro, feature, finale, fraction)
        render_audio(original, edited, segments)
        edited_duration = duration(edited)
        expected = sum(end - start for start, end in segments) - 2 * XFADE
        assert 55 <= edited_duration <= 64, f"{mode}: {edited_duration} seconds"
        assert abs(edited_duration - expected) < 0.12, (mode, edited_duration, expected)
        was, now, removed, last = rechart(chart, segments, edited_duration)
        print(
            f"V8_{mode.upper()} original={old_duration:.2f}s "
            f"new={edited_duration:.2f}s notes={was}->{now} "
            f"third-near-simultaneous-removed={removed} last-note={last:.2f}s "
            f"segments={[(round(a, 2), round(b, 2)) for a, b in segments]}"
        )
        track = next(t for t in tracks if t["difficulty"] == (3 if mode == "easy" else 5))
        track["audio"] = f"assets/audio/moonlight-{mode}-short-v8.mp3"
        track["subtitle"] += " · 60s EDIT V8"

    manifest["version"] = "2.1.0-v8-60sec"
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    patch_energy()
    print("V8_ENERGY", ENERGY)
    print("V8_VALIDATED")


if __name__ == "__main__":
    main()
