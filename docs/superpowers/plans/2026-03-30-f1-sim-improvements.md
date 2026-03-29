# F1 Simulation Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the F1 GPS simulation in `script.js` to use race-pace timing, a 16-turn speed profile, SVG-derived sector crossing detection, and auto-computed DRS zones.

**Architecture:** All changes are confined to the existing IIFE in `script.js`. Three new helper functions (`closestProgress`, `computeSectorBoundaries`, `computeDRSZones`) are added and called from `init()` after the SVG is inlined. The existing constants `S1_END`, `S2_END`, and `DRS_ZONES` become `let` variables set at init time from live SVG geometry instead of hardcoded fractions.

**Tech Stack:** Vanilla JS, SVG DOM API (`getPointAtLength`, `getTotalLength`, `querySelector`), no build tooling, no dependencies.

---

## File Map

| File | Change |
|------|--------|
| `script.js` | All edits — timing constants, SPD array, new helpers, init() call chain |

No new files. No HTML or CSS changes.

---

## Task 1: Lap Timing Calibration

**Files:**
- Modify: `script.js` — `BASE_LAP_MS` constant and `lapJitter` expression in `startLap()`

- [ ] **Step 1: Update BASE_LAP_MS**

Find:
```javascript
const BASE_LAP_MS = 74203;
```
Replace with:
```javascript
const BASE_LAP_MS = 88000;
```

- [ ] **Step 2: Update lapJitter range**

Find (inside `startLap()`):
```javascript
lapJitter   = 0.985 + Math.random() * 0.03;  // ±1.5% lap-to-lap variation
```
Replace with:
```javascript
lapJitter   = 0.977 + Math.random() * 0.046;  // race-pace variation → laps land 86–90 s
```

- [ ] **Step 3: Verify in browser**

Open `index.html` in a browser. Watch the lap timer in the telemetry panel. Laps should complete in roughly **1:26–1:30** (86–90 seconds). Previously they completed in ~1:14. If still fast, confirm the file was saved.

- [ ] **Step 4: Commit**
```bash
git add script.js
git commit -m "feat: calibrate lap timing to race pace (88 s avg, 86–90 s range)"
```

---

## Task 2: Replace SPD Array with 16-Turn Profile

**Files:**
- Modify: `script.js` — `const SPD = [...]` array

- [ ] **Step 1: Replace the SPD array**

Find the entire `const SPD = [` block (from `[0.000, 1.20]` to the closing `];`) and replace it with:

```javascript
const SPD = [
  [0.000, 1.20],  // S/F straight — DRS active
  [0.050, 0.62],  // T1 heavy braking (330 km/h → ~170)
  [0.090, 0.42],  // T1 apex — tight right-hander
  [0.130, 0.58],  // T2 exit
  [0.175, 0.82],  // T3 fast right
  [0.210, 0.60],  // T4 medium
  [0.240, 0.50],  // T5 chicane entry
  [0.270, 0.40],  // T6 hairpin apex ← slowest point
  [0.310, 0.68],  // T7 exit / S1–S2 region
  [0.370, 1.00],  // back straight run-up
  [0.410, 1.35],  // T8 DRS zone 1 opens
  [0.480, 1.55],  // back straight peak ← fastest point
  [0.540, 0.52],  // T9 heavy braking
  [0.580, 0.38],  // T9 marina hairpin ← tightest corner
  [0.620, 0.55],  // T10 exit / S2–S3 region
  [0.660, 0.70],  // T11 medium
  [0.700, 0.85],  // T12 fast
  [0.735, 0.55],  // T13 hotel section entry
  [0.765, 0.40],  // T14 hotel hairpin
  [0.800, 0.58],  // T15 exit
  [0.845, 0.82],  // T16 final corner onto S/F straight
  [0.875, 1.05],  // DRS zone 2 opens
  [0.930, 1.18],  // final straight
  [0.975, 1.22],  // approach finish line
  [1.000, 1.20],  // finish line
];
```

- [ ] **Step 2: Verify in browser**

Watch the dot for a full lap. It should:
- Noticeably crawl at T6 (~0.270 progress) and T14 (~0.765)
- Sprint hard on the back straight (~0.410–0.540)
- Lap time stays in the 1:26–1:30 range (the existing `computeNorm()` normalises the profile)

- [ ] **Step 3: Commit**
```bash
git add script.js
git commit -m "feat: update SPD to 16-turn Abu Dhabi race profile"
```

---

## Task 3: Add closestProgress() Helper

**Files:**
- Modify: `script.js` — add function inside the IIFE, immediately before `init()`

This helper is used by both `computeSectorBoundaries` and `computeDRSZones`. It must live **inside the outer IIFE** to access `trackPath` and `trackLen` from the same closure scope.

- [ ] **Step 1: Add the function**

Locate the `/* ── Fetch + inline SVG ── */` comment (just above the `async function init()`). Insert the following block immediately before that comment:

```javascript
/* ── closestProgress: given an SVG-space point, return the progress fraction on .st0
   that is geometrically closest to it. Operates in SVG local coordinate space.
   Requires trackPath and trackLen to be set (called only from init() callbacks). ── */
function closestProgress(targetPt, steps) {
  steps = steps || 2000;
  var bestDist = Infinity, bestP = 0;
  for (var i = 0; i <= steps; i++) {
    var p  = i / steps;
    var pt = trackPath.getPointAtLength(trackLen * p);
    var dx = pt.x - targetPt.x;
    var dy = pt.y - targetPt.y;
    var d  = dx * dx + dy * dy;
    if (d < bestDist) { bestDist = d; bestP = p; }
  }
  return bestP;
}

```

- [ ] **Step 2: Verify it is scoped correctly**

In the browser DevTools console, type:
```javascript
typeof closestProgress
```
Expected: `"undefined"` — because it is correctly **inside** the IIFE and not exposed to global scope. If it returns `"function"`, the function was accidentally placed outside the IIFE; move it inside.

- [ ] **Step 3: Commit**
```bash
git add script.js
git commit -m "feat: add closestProgress helper for SVG-to-progress geometry lookup"
```

---

## Task 4: Compute Sector Boundaries from SVG at Init

**Files:**
- Modify: `script.js` — `S1_END`/`S2_END` declarations, new `computeSectorBoundaries()`, `init()` call chain

**Background:** The SVG `セクター` group contains three colored paths that trace the track through each sector:
- `.st1` (yellow) — S1 portion
- `.st2` (blue) — S2 portion: **its start point `getPointAtLength(0)` is the S1→S2 boundary**
- `.st3` (red) — S3 portion: **its start point is the S2→S3 boundary**

We find the progress fraction on `.st0` closest to each start point and use that as `S1_END` / `S2_END`.

- [ ] **Step 1: Change S1_END and S2_END from const to let**

Find:
```javascript
const S1_END = 0.325;   // S1→S2 boundary
const S2_END = 0.635;   // S2→S3 boundary
```
Replace with:
```javascript
let S1_END = 0.325;   // S1→S2 boundary (overwritten at init from SVG geometry)
let S2_END = 0.635;   // S2→S3 boundary (overwritten at init from SVG geometry)
```

- [ ] **Step 2: Add computeSectorBoundaries() function**

Add this function immediately before `closestProgress` (both go in the same block before `init()`):

```javascript
/* ── computeSectorBoundaries: derive S1/S2 and S2/S3 crossing progress from SVG ──
   Looks for the セクター group, then finds .st2 (S1→S2) and .st3 (S2→S3).
   Falls back to hardcoded defaults with a console warning if paths are missing. ── */
function computeSectorBoundaries(svgEl) {
  try {
    /* Find the sector group by its Japanese ID */
    var sectorGroup = null;
    var groups = svgEl.querySelectorAll('g');
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].id === 'セクター') { sectorGroup = groups[i]; break; }
    }
    var container = sectorGroup || svgEl;

    var s2Path = container.querySelector('.st2');   // blue — start = S1→S2 boundary
    var s3Path = container.querySelector('.st3');   // red  — start = S2→S3 boundary

    if (s2Path) {
      var p1 = s2Path.getPointAtLength(0);
      S1_END = closestProgress(p1);
    } else {
      console.warn('[F1] .st2 sector path not found — using default S1_END=' + S1_END);
    }

    if (s3Path) {
      var p2 = s3Path.getPointAtLength(0);
      S2_END = closestProgress(p2);
    } else {
      console.warn('[F1] .st3 sector path not found — using default S2_END=' + S2_END);
    }

    /* Sanity check: S1_END must be less than S2_END */
    if (S1_END >= S2_END) {
      console.warn('[F1] S1_END >= S2_END after SVG computation — swapping endpoints');
      var tmp = S1_END; S1_END = S2_END; S2_END = tmp;
    }

    console.log('[F1] Sector boundaries — S1_END: ' + S1_END.toFixed(4) + ', S2_END: ' + S2_END.toFixed(4));
  } catch (e) {
    console.warn('[F1] computeSectorBoundaries error, using defaults:', e);
  }
}

```

- [ ] **Step 3: Call computeSectorBoundaries from init()**

In the `init()` function, find:
```javascript
      computeNorm();
      requestAnimationFrame(frame);
```
Replace with:
```javascript
      computeNorm();
      computeSectorBoundaries(svgEl);
      requestAnimationFrame(frame);
```

- [ ] **Step 4: Check computed values in the browser console**

Reload the page. In DevTools console, look for:
```
[F1] Sector boundaries — S1_END: 0.XXXX, S2_END: 0.XXXX
```

Expected ranges:
- `S1_END` between `0.28` and `0.45`
- `S2_END` between `0.55` and `0.72`

**If values are outside these ranges:** `getPointAtLength(0)` is returning the wrong end of the path. Fix by changing both `getPointAtLength(0)` calls to `getPointAtLength(path.getTotalLength())`:
```javascript
var p1 = s2Path.getPointAtLength(s2Path.getTotalLength());
// ...
var p2 = s3Path.getPointAtLength(s3Path.getTotalLength());
```

- [ ] **Step 5: Verify sector timing visually**

Watch the dot lap the circuit. The S1 sector timer in the telemetry panel must freeze and turn green/purple **at the exact moment the dot crosses the yellow-to-blue color transition** on the track map — not a beat before or after.

- [ ] **Step 6: Commit**
```bash
git add script.js
git commit -m "feat: compute sector boundaries from SVG geometry at init"
```

---

## Task 5: Compute DRS Zones from SVG at Init

**Files:**
- Modify: `script.js` — `DRS_ZONES` declaration, new `computeDRSZones()`, `init()` call chain

**Background:** The SVG `<g id="DRS">` group contains `line.st10` elements that mark DRS zone boundaries. Computing their progress on `.st0` gives us zone start/end fractions. Abu Dhabi has two zones; Zone 2 wraps the lap boundary (ends after the finish line and resumes at the start of the next lap).

- [ ] **Step 1: Change DRS_ZONES from const to let**

Find:
```javascript
  const DRS_ZONES = [
    [0.415, 0.575],   // Zone 1: Back straight (T7 → T8)
    [0.875, 1.000],   // Zone 2: S/F straight (end)
    [0.000, 0.055],   // Zone 2: S/F straight (wrap to next lap)
  ];
```
Replace with:
```javascript
  let DRS_ZONES = [
    [0.410, 0.560],   // Zone 1: Back straight (T8 region) — overwritten at init
    [0.875, 1.000],   // Zone 2: S/F straight (end)         — overwritten at init
    [0.000, 0.055],   // Zone 2: S/F straight (wrap-around) — overwritten at init
  ];
```

- [ ] **Step 2: Add computeDRSZones() function**

Add this function in the same block as `computeSectorBoundaries`, before `init()`:

```javascript
/* ── computeDRSZones: derive DRS activation zones from SVG DRS group ──
   line.st10 elements mark zone boundaries. Progress values are sorted and
   clustered into [start, end] pairs. Zone 2 wraps the lap boundary. ── */
function computeDRSZones(svgEl) {
  try {
    var drsGroup = null;
    var groups = svgEl.querySelectorAll('g');
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].id === 'DRS') { drsGroup = groups[i]; break; }
    }
    if (!drsGroup) {
      console.warn('[F1] DRS group not found — using default DRS_ZONES');
      return;
    }

    var lines = drsGroup.querySelectorAll('line.st10');
    if (lines.length < 2) {
      console.warn('[F1] Fewer than 2 DRS markers found — using defaults');
      return;
    }

    /* Compute progress for each line's midpoint */
    var progs = [];
    for (var j = 0; j < lines.length; j++) {
      var mx = (parseFloat(lines[j].getAttribute('x1')) + parseFloat(lines[j].getAttribute('x2'))) / 2;
      var my = (parseFloat(lines[j].getAttribute('y1')) + parseFloat(lines[j].getAttribute('y2'))) / 2;
      progs.push(closestProgress({ x: mx, y: my }));
    }
    progs.sort(function(a, b) { return a - b; });

    /* Cluster consecutive values within GAP into one zone */
    var zones = [];
    var GAP   = 0.05;
    var zs = progs[0], ze = progs[0];
    for (var k = 1; k < progs.length; k++) {
      if (progs[k] - progs[k - 1] > GAP) {
        zones.push([+(zs.toFixed(3)), +(ze.toFixed(3))]);
        zs = progs[k];
      }
      ze = progs[k];
    }
    zones.push([+(zs.toFixed(3)), +(ze.toFixed(3))]);

    /* Expand wrap-around: any zone ending >= 0.90 spans the finish line */
    var expanded = [];
    zones.forEach(function(z) {
      if (z[1] >= 0.90) {
        expanded.push([z[0], 1.000]);
        expanded.push([0.000, 0.055]);   // hard-coded wrap end (T1 braking point)
      } else {
        expanded.push(z);
      }
    });

    if (expanded.length > 0) {
      DRS_ZONES = expanded;
      console.log('[F1] DRS zones:', JSON.stringify(DRS_ZONES));
    }
  } catch (e) {
    console.warn('[F1] computeDRSZones error, using defaults:', e);
  }
}

```

- [ ] **Step 3: Call computeDRSZones from init()**

Find:
```javascript
      computeNorm();
      computeSectorBoundaries(svgEl);
      requestAnimationFrame(frame);
```
Replace with:
```javascript
      computeNorm();
      computeSectorBoundaries(svgEl);
      computeDRSZones(svgEl);
      requestAnimationFrame(frame);
```

- [ ] **Step 4: Verify DRS zones in the browser console**

Reload and look for:
```
[F1] DRS zones: [[0.41X,0.56X],[0.87X,1],[0,0.055]]
```

Expected:
- First zone: spans roughly `0.40–0.58` (back straight)
- Second pair: `[0.87X, 1]` and `[0, 0.055]` (S/F straight wrap-around)

If only one zone appears and the wrap-around pair is missing: the SVG doesn't have a `line.st10` near the S/F straight start. In that case, after the `computeDRSZones` call in `init()`, add a manual fallback:
```javascript
// Ensure S/F straight wrap-around zone always exists
var hasSF = DRS_ZONES.some(function(z) { return z[0] === 0.000; });
if (!hasSF) { DRS_ZONES.push([0.875, 1.000]); DRS_ZONES.push([0.000, 0.055]); }
```

- [ ] **Step 5: Verify DRS light in browser**

Watch the dot circuit. The cyan DRS indicator light in the nav should:
- Activate when the dot enters the back-straight green-dotted zone
- Deactivate when the dot brakes for T9
- Reactivate on the S/F straight and deactivate at T1 braking

- [ ] **Step 6: Commit**
```bash
git add script.js
git commit -m "feat: compute DRS zones from SVG geometry at init"
```

---

## Task 6: Final Verification

- [ ] **Step 1: Full lap checklist (watch 2 complete laps)**

| Check | Expected |
|-------|----------|
| S1 timer starts | Immediately at S/F line crossing |
| S1 timer freezes | Exact moment dot crosses yellow→blue on track |
| S2 timer freezes | Exact moment dot crosses blue→red on track |
| S3 timer completes | At finish line (S/F line) |
| Lap time | 1:26–1:30 range |
| DRS light — back straight | Cyan when dot in green-dot zone |
| DRS light — S/F straight | Cyan, off at T1 braking |
| Dot speed — T6 hairpin | Visibly slow |
| Dot speed — T14 hotel hairpin | Visibly slow |
| Dot speed — back straight | Noticeably faster than corners |
| Console | No `[F1] ... not found` or error warnings |

- [ ] **Step 2: Final commit**
```bash
git add script.js
git commit -m "feat: complete F1 sim improvements — 16-turn profile, SVG-derived sector/DRS detection"
```
