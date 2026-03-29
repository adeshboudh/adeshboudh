# F1 Simulation Improvements — Design Spec
**Date:** 2026-03-30
**Scope:** `script.js` + `assets/track.svg` (read-only)

---

## Overview

Three targeted improvements to the F1 GPS simulation engine on the portfolio site:

1. **Accurate sector crossing detection** — sector timers fire when the dot visually crosses the colored sector lines in the SVG, not at hardcoded progress thresholds.
2. **16-turn speed profile** — update the `SPD` array to match Abu Dhabi's current 16-corner layout (post-2021 revision).
3. **SVG-derived DRS zones** — read DRS zone positions from the SVG at init time instead of hardcoding progress ranges.

---

## 1. Accurate Sector Crossing Detection

### Problem
`S1_END = 0.325` and `S2_END = 0.635` are hand-tuned fractions. They don't correspond to the actual pixel positions of the yellow (`.st1`), blue (`.st2`), and red (`.st3`) sector paths in the SVG. Sector times are recorded at the wrong moment.

### Solution
At `init()` time, after the SVG is inlined into the DOM:

1. Query `.st2` (blue path — S1/S2 boundary) and call `.getPointAtLength(0)` to get its start coordinate.
2. Query `.st3` (red path — S2/S3 boundary) and call `.getPointAtLength(0)` to get its start coordinate.
3. For each boundary point, scan the main track path `.st0` in ~2000 steps using `getPointAtLength()`, computing Euclidean distance from each sampled point to the boundary coordinate.
4. The `progress` fraction at the minimum-distance sample becomes the computed `S1_END` and `S2_END`.
5. Replace the hardcoded constants with these computed values.

### Outcome
Sector timers fire **at the exact moment the dot crosses the visual sector color line**, matching what is shown on the track map.

### Edge cases
- If `.st2` or `.st3` cannot be found, fall back to the existing hardcoded values and log a warning.
- Scan resolution: 2000 steps ≈ 0.3m precision on a ~5.3km track, well within one animation frame of movement.

---

## 2. 16-Turn Speed Profile

### Problem
The current `SPD` array references corners T1–T19 from Abu Dhabi's old 21-turn layout. The circuit was revised in 2021 to 16 corners.

### Solution
Replace the `SPD` array with a 16-turn profile. Corner positions are expressed as progress fractions (0–1) along `.st0`. Speed multipliers follow real F1 corner characterisation:

| Segment | Progress | Multiplier | Notes |
|---|---|---|---|
| S/F straight (DRS) | 0.000 | 1.20 | Start/finish |
| T1 heavy braking | 0.050 | 0.62 | Hard stop from 330 km/h |
| T1 apex | 0.090 | 0.42 | Tight right-hander |
| T2 exit | 0.130 | 0.58 | |
| T3 fast right | 0.175 | 0.82 | High-speed |
| T4 medium | 0.210 | 0.60 | |
| T5 chicane entry | 0.240 | 0.50 | |
| T6 hairpin apex | 0.270 | 0.40 | Slowest point |
| T7 exit | 0.310 | 0.68 | S1/S2 region |
| Back straight run-up | 0.370 | 1.00 | |
| T8 DRS zone open | 0.410 | 1.35 | |
| Back straight peak | 0.480 | 1.55 | Fastest point |
| T9 braking | 0.540 | 0.52 | Heavy braking |
| T9 marina hairpin | 0.580 | 0.38 | Tightest corner |
| T10 exit | 0.620 | 0.55 | S2/S3 region |
| T11 medium | 0.660 | 0.70 | |
| T12 fast | 0.700 | 0.85 | |
| T13 hotel entry | 0.735 | 0.55 | |
| T14 hotel hairpin | 0.765 | 0.40 | |
| T15 exit | 0.800 | 0.58 | |
| T16 final corner | 0.845 | 0.82 | Onto DRS zone |
| DRS Z2 opens | 0.875 | 1.05 | |
| Final straight | 0.930 | 1.18 | |
| Approach finish | 0.975 | 1.22 | |
| Finish line | 1.000 | 1.20 | |

`BASE_LAP_MS` remains `74203` (Leclerc's 2023 pole: 1:24.203). The existing `computeNorm()` function normalises the new profile so lap time stays accurate.

---

## 3. SVG-Derived DRS Zones

### Problem
`DRS_ZONES` is a hardcoded array of `[start, end]` progress fractions. If the track SVG is updated, the DRS zones become stale.

### Solution
At `init()` time, after the SVG is inlined:

1. Query all elements inside `<g id="DRS">` — specifically the `line.st10` elements (the tick marks indicating zone boundaries).
2. Collect their midpoint coordinates.
3. For each DRS marker, find the closest progress fraction on `.st0` using the same scan approach as sector detection.
4. Cluster the progress fractions into zone pairs (start/end) — the SVG has two DRS zones, each with a detection line at the start of the zone. Zones extend forward until the next detection line or a fixed braking distance (~0.06 progress units based on current layout).
5. Replace the hardcoded `DRS_ZONES` array with the computed pairs.

### Fallback
If the `DRS` group or its markers cannot be found in the SVG, fall back to the existing hardcoded `DRS_ZONES` and log a warning.

---

## Architecture

All three changes live in the existing IIFE in `script.js`. No new files. No new dependencies.

**Modified functions/constants:**
- `S1_END`, `S2_END` — become `let` variables set during `init()`
- `DRS_ZONES` — becomes a `let` variable set during `init()`
- `SPD` — array replacement in-place
- `init()` — gains a `computeSectorBoundaries()` and `computeDRSZones()` call after the SVG is inlined and `trackPath` is set

**New helper functions (inside the IIFE):**
- `closestProgress(pt)` — given an SVG point `{x, y}`, scans `.st0` in 2000 steps and returns the `progress` fraction of the nearest point
- `computeSectorBoundaries()` — calls `closestProgress` for `.st2` and `.st3` start points, sets `S1_END` and `S2_END`
- `computeDRSZones()` — reads DRS marker positions, calls `closestProgress` for each, sets `DRS_ZONES`

---

## Testing

Since this is a visual browser animation, verification is manual:
1. Open the page and watch the dot circuit.
2. Sector timer for S1 should flip to green/purple at the exact moment the dot crosses the yellow-to-blue color transition on the track.
3. Sector timer for S2 should flip at the blue-to-red transition.
4. S3 timer completes at the red-to-yellow transition (finish line).
5. The DRS light in the nav should activate when the dot enters the green-dotted zones on the track map.
6. Lap time should remain close to 1:24.203 ± ~1.5% (existing jitter).
