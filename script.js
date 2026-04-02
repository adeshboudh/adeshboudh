/* ═══════════════════════════════════════════════════════
   ADESH BOUDH — F1 TELEMETRY SCRIPTS
   ═══════════════════════════════════════════════════════ */

/* ── F1 GPS Simulation Engine ── */
/* Dot drives everything: physics loop → sector crossings → lap/sector timers */

(function () {

  const indicator = document.getElementById('driver-indicator');
  const mapLayer  = document.getElementById('parallax-circuit');
  const loaderEl  = document.getElementById('track-loader');
  const lapEl     = document.getElementById('lap-timer');
  const s1El      = document.getElementById('s1');
  const s2El      = document.getElementById('s2');
  const s3El      = document.getElementById('s3');
  const s1t       = document.getElementById('s1-time');
  const s2t       = document.getElementById('s2-time');
  const s3t       = document.getElementById('s3-time');
  const drsLight  = document.querySelector('.drs-light');
  const flLapEl   = document.getElementById('fl-lap-time');
  const flS1El    = document.getElementById('fl-s1');
  const flS2El    = document.getElementById('fl-s2');
  const flS3El    = document.getElementById('fl-s3');
  if (!indicator || !lapEl || !mapLayer) return;

  lapEl.textContent = '0:00.000';
  if (s1t) s1t.textContent = '0.000';
  if (s2t) s2t.textContent = '--.-.-';
  if (s3t) s3t.textContent = '--.-.-';

  /* ── Pulse animation ── */
  const pulseStyle = document.createElement('style');
  pulseStyle.textContent = `
  @keyframes f1-pulse {
    0%, 100% { transform: translate(-50%,-50%) scale(1);   opacity: 1;   }
    50%       { transform: translate(-50%,-50%) scale(2.6); opacity: 0.3; }
  }
  #driver-indicator { animation: f1-pulse 1.1s ease-in-out infinite; }
  `;
  document.head.appendChild(pulseStyle);

  /* ── Track length — overwritten from tracks.json ── */
  let TRACK_LEN_KM = 5.281;

  /* ── F1 Car constants — universal, independent of circuit ─────────────────
    These describe the 2024-spec F1 car. Never change per track.
    a_lat     : max lateral acceleration m/s² — determines corner speed
                from radius. Calibrate once against known lap time.
                26 m/s² ≈ medium downforce (Bahrain, Yas Marina, Baku)
    topSpeed  : km/h ceiling on full straights (no DRS)
    drsBoost  : km/h added when DRS is open (FIA regulated)
    throttle  : km/h per second (~1.4g F1 acceleration)
    brake     : km/h per second (~5.0g F1 braking)
    ──────────────────────────────────────────────────────────────────────── */
  const CAR = {
    a_lat:    26,
    topSpeed: 320,
    drsBoost:  15,
    throttle:  53,
    brake:    176,
  };

  /* ── Per-track setup — overrides applied from tracks.json ─────────────────
    Only topSpeed changes meaningfully track-to-track (wing level).
    Populated in init(). Falls back to CAR defaults if not in JSON.
    ──────────────────────────────────────────────────────────────────────── */
  let PHYSICS = { ...CAR };

  /* ── Sector boundaries — lap-relative, overwritten at init ── */
  let S1_END = 0.325;
  let S2_END = 0.635;

  /* ── DRS zones — raw SVG progress fractions ───────────────────────────────
    Populated by computeDRSZones() from invisible #DRS-ZONES paths.
    Falls back to st12 line markers, then tracks.json fallback.
    Used for: visual glow + DRS_ZONES_LAP conversion.
    ──────────────────────────────────────────────────────────────────────── */
  let DRS_ZONES = [];

  /* ── Physics DRS zones — lap-relative ────────────────────────────────────
    Built by buildPhysicsDRS() from DRS_ZONES after LAP_ORIGIN is known.
    Controls speed boost and prevents mid-zone braking.
    Wrapping zones have b > 1.0.
    ──────────────────────────────────────────────────────────────────────── */
  let DRS_ZONES_LAP = [];

  /* ── Race state ── */
  let lapProgress = 0;
  let progress    = 0;
  let LAP_ORIGIN  = 0;
  let lapState    = 'INIT';
  let lapStart    = null;
  let sectorStart = null;
  let curSector   = 0;
  let lastFrame   = null;
  let lapJitter   = 1.0;
  let currentSpeed_kmh = 0;

  /* ── Cold start ── */
  let isFirstLap    = true;
  let lightsOutDelay = 0;

  /* ── Sector records ── */
  let best = { s1: Infinity, s2: Infinity, s3: Infinity };
  let prev = { s1: null,     s2: null,     s3: null     };

  /* ── Fastest lap ── */
  let bestLapRecord = { lapMs: Infinity, s1: null, s2: null, s3: null };

  function updateFLDisplay() {
    if (bestLapRecord.lapMs === Infinity) return;
    if (flLapEl) flLapEl.textContent = fmtLap(bestLapRecord.lapMs);
    if (flS1El)  flS1El.textContent  = bestLapRecord.s1 !== null ? fmtSec(bestLapRecord.s1) : '--.-.-';
    if (flS2El)  flS2El.textContent  = bestLapRecord.s2 !== null ? fmtSec(bestLapRecord.s2) : '--.-.-';
    if (flS3El)  flS3El.textContent  = bestLapRecord.s3 !== null ? fmtSec(bestLapRecord.s3) : '--.-.-';
  }

  /* ── Physics lookup tables ── */
  let HOLD_ZONES = [];   // [{ start, end, speed }] entry→apex per corner
  let ENTRY_LIST = [];   // [{ lapAt, speed }] sorted by lapAt

  /* ── SVG coordinate mapping ── */
  let trackPath  = null;
  let trackLen   = 0;
  let trackScale = 1;    // metres per SVG unit = (TRACK_LEN_KM × 1000) / trackLen
  let cachedCTM  = null;

  window.addEventListener('resize', () => { cachedCTM = null; });

  function screenPt(p) {
    const t  = Math.max(0, Math.min(1, p));
    const pt = trackPath.getPointAtLength(trackLen * t);
    if (!cachedCTM) cachedCTM = trackPath.ownerSVGElement.getScreenCTM();
    if (!cachedCTM) return null;
    return new DOMPoint(pt.x, pt.y).matrixTransform(cachedCTM);
  }

  function setMapState(state) {
    mapLayer.dataset.mapState = state;
    mapLayer.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');

    if (state === 'ready') {
      document.body.classList.add('map-ready');
      if (loaderEl) loaderEl.hidden = true;
      return;
    }

    document.body.classList.remove('map-ready');
  }

  function waitForMapViewport(target) {
    return new Promise(resolve => {
      if (!target || !('IntersectionObserver' in window)) {
        resolve();
        return;
      }

      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          resolve();
        }
      }, { rootMargin: '240px 0px' });

      observer.observe(target);
    });
  }

  /* ── Tab visibility: freeze timers while hidden ── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || lastFrame === null) return;
    const gap = performance.now() - lastFrame;
    if (lapStart !== null) lapStart += gap;
    if (sectorStart !== null) sectorStart += gap;
    lastFrame    = performance.now();
  });

  /* ── Formatting ── */
  function fmtLap(ms) {
    ms = Math.floor(ms);
    return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2,'0')}.${String(ms % 1000).padStart(3,'0')}`;
  }
  function fmtSec(ms) {
    ms = Math.floor(ms);
    return `${Math.floor(ms / 1000)}.${String(ms % 1000).padStart(3,'0')}`;
  }

  /* ── Sector color ── */
  function sectorCls(key, ms) {
    if (prev[key] === null)    return 's-green';
    if (ms < best[key])        return 's-purple';
    if (ms <= prev[key])       return 's-green';
    return 's-yellow';
  }

  /* ── Dot glow ── */
  function dotGlow(lapP) {
    if (inDRSLap(lapP)) return { color: '#00D2BE', drs: true  };
    if (lapP < S1_END)  return { color: '#BF00FF', drs: false };
    if (lapP < S2_END)  return { color: '#00D45E', drs: false };
    return                     { color: '#FFE900', drs: false };
  }

  /* ── Record completed sector ── */
  function completeSector(num, ms) {
    const key = `s${num}`;
    const el  = [s1El, s2El, s3El][num - 1];
    const tel = [s1t,  s2t,  s3t ][num - 1];
    if (!el || !tel) return;
    el.className    = `sector ${sectorCls(key, ms)}`;
    tel.textContent = fmtSec(ms);
    if (ms < best[key]) best[key] = ms;
    prev[key] = ms;
  }

  /* ── Reset for new lap ── */
  function startLap(now) {
    lastFrame   = now;
    curSector   = 0;
    lapProgress = 0;
    progress    = LAP_ORIGIN;
    lapJitter   = 0.977 + Math.random() * 0.046;

    if (isFirstLap) {
      currentSpeed_kmh = 0;
      lightsOutDelay   = 1000;
      isFirstLap       = false;
      lapStart         = null;    // ← defer: set on first real tick, not here
      sectorStart      = null;    // ← keep sector timing aligned with lap timing
    } else {
      lapStart    = now;
      sectorStart = now;
    }

    if (s1El) s1El.className    = 'sector s-active';
    if (s1t)  s1t.textContent   = '0.000';
    if (s2El) s2El.className    = 'sector';
    if (s2t)  s2t.textContent   = '--.-.-';
    if (s3El) s3El.className    = 'sector';
    if (s3t)  s3t.textContent   = '--.-.-';
    lapEl.textContent            = '0:00.000';
  }

  /* ── Physics: corner speed from real-world radius ─────────────────────────
    v = sqrt(a_lat × r_metres)
    Uses trackScale to convert SVG κ into real metres.
    Override wins if tracks.json provides racingLine for this corner.
    ──────────────────────────────────────────────────────────────────────── */
  function cornerSpeedFromKappa(kappa, override) {
    if (override != null) return override;
    if (kappa < 1e-6) return PHYSICS.topSpeed;   // near-zero κ = straight
    const r_metres = (1 / kappa) * trackScale;
    const v_kmh    = Math.sqrt(PHYSICS.a_lat * r_metres) * 3.6;
    return Math.max(40, Math.min(PHYSICS.topSpeed, Math.round(v_kmh)));
  }

  /* ── Physics: inHoldZone ── */
  function inHoldZone(lapP) {
    for (const z of HOLD_ZONES) {
      if (lapP >= z.start && lapP <= z.end) return z.speed;
    }
    return null;
  }

  /* ── Physics: lookAheadEntry ── */
  function lookAheadEntry(lapP) {
    for (const e of ENTRY_LIST) {
      if (e.lapAt > lapP) return e;
    }
    return { lapAt: ENTRY_LIST[0].lapAt + 1.0, speed: ENTRY_LIST[0].speed };
  }

  /* ── Physics: inDRSLap ── */
  function inDRSLap(lapP) {
    for (const [a, b] of DRS_ZONES_LAP) {
      if (b <= 1.0) {
        if (lapP >= a && lapP <= b) return true;
      } else {
        if (lapP >= a || lapP <= b - 1.0) return true;
      }
    }
    return false;
  }

  /* ── Physics: getTargetSpeed ── */
  function getTargetSpeed(lapP) {
    const holdSpd = inHoldZone(lapP);
    if (holdSpd !== null) return holdSpd * lapJitter;

    const next = lookAheadEntry(lapP);
    const drs  = inDRSLap(lapP);
    const top  = (PHYSICS.topSpeed + (drs ? PHYSICS.drsBoost : 0)) * lapJitter;

    if (currentSpeed_kmh > next.speed) {
      const approachSpeed = Math.max(currentSpeed_kmh, top);
      const brakeDist_km  = (approachSpeed ** 2 - next.speed ** 2) / (7200 * PHYSICS.brake);
      const distAhead_km = (next.lapAt - lapP) * TRACK_LEN_KM;
      if (distAhead_km <= brakeDist_km * 1.05) return next.speed * lapJitter;
    }

    return top;
  }

  /* ── Main animation loop ── */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!trackPath) return;

    if (lapState === 'INIT') {
      lapState = 'RUNNING';
      startLap(now);
      return;
    }

    const dt = Math.min(now - lastFrame, 50);
    lastFrame = now;

    /* Lights-out freeze */
    if (lightsOutDelay > 0) {
      lightsOutDelay -= dt;
      if (lapStart === null) lapStart = now;   // ← anchor only when freeze starts ticking
      if (sectorStart === null) sectorStart = now;
      lapStart    += dt;
      sectorStart += dt;
      return;
    }
    
    /* First tick after freeze expires */
    if (lapStart === null) lapStart = now;
    if (sectorStart === null) sectorStart = now;
    
    const targetSpeed = getTargetSpeed(lapProgress);
    if (currentSpeed_kmh < targetSpeed) {
      currentSpeed_kmh = Math.min(currentSpeed_kmh + PHYSICS.throttle * dt / 1000, targetSpeed);
    } else {
      currentSpeed_kmh = Math.max(currentSpeed_kmh - PHYSICS.brake   * dt / 1000, targetSpeed);
    }

    lapProgress += (currentSpeed_kmh * dt) / (TRACK_LEN_KM * 3600000);
    progress     = (LAP_ORIGIN + lapProgress) % 1;

    const elapsed = now - lapStart;

    if (curSector === 0 && lapProgress >= S1_END) {
      completeSector(1, now - sectorStart);
      curSector = 1; sectorStart = now;
      if (s2El) s2El.className = 'sector s-active';
    }
    if (curSector === 1 && lapProgress >= S2_END) {
      completeSector(2, now - sectorStart);
      curSector = 2; sectorStart = now;
      if (s3El) s3El.className = 'sector s-active';
    }

    if (lapProgress >= 1.0) {
      completeSector(3, now - sectorStart);
      lapEl.textContent = fmtLap(elapsed);

      /* ── Calibration log ── */
      console.log(
        `[F1] LAP COMPLETE | time=${fmtLap(elapsed)}` +
        ` | S1=${prev.s1 != null ? fmtSec(prev.s1) : '?'}` +
        ` S2=${prev.s2 != null ? fmtSec(prev.s2) : '?'}` +
        ` S3=${prev.s3 != null ? fmtSec(prev.s3) : '?'}`
      );

      if (elapsed < bestLapRecord.lapMs) {
        bestLapRecord = { lapMs: elapsed, s1: prev.s1, s2: prev.s2, s3: prev.s3 };
        updateFLDisplay();
        console.log(`[F1] ★ NEW FASTEST LAP: ${fmtLap(bestLapRecord.lapMs)}`);
      }
      startLap(now);
      const fp = screenPt(LAP_ORIGIN);
      if (fp) { indicator.style.left = `${fp.x}px`; indicator.style.top = `${fp.y}px`; }
      return;
    }

    lapEl.textContent = fmtLap(elapsed);
    if (curSector === 0 && s1t) s1t.textContent = fmtSec(now - sectorStart);
    if (curSector === 1 && s2t) s2t.textContent = fmtSec(now - sectorStart);
    if (curSector === 2 && s3t) s3t.textContent = fmtSec(now - sectorStart);

    const pt = screenPt(progress);
    if (!pt) return;

    const { color, drs } = dotGlow(lapProgress);
    indicator.style.left      = `${pt.x}px`;
    indicator.style.top       = `${pt.y}px`;
    indicator.style.boxShadow = drs
      ? `0 0 8px 3px #00D2BE, 0 0 22px #00D2BE88, 0 0 4px #fff`
      : `0 0 6px 2px ${color}, 0 0 18px ${color}88, 0 0 4px #fff`;

    if (drsLight) {
      drsLight.style.background = drs ? '#00D2BE' : '#E10600';
      drsLight.style.boxShadow  = drs ? '0 0 8px #00D2BE' : '0 0 8px #E10600';
    }
  }

  /* ── closestProgress ── */
  function closestProgress(targetPt, steps = 2000) {
    let bestD = Infinity, bestP = 0;
    for (let i = 0; i <= steps; i++) {
      const p  = i / steps;
      const pt = trackPath.getPointAtLength(trackLen * p);
      const d  = (pt.x - targetPt.x) ** 2 + (pt.y - targetPt.y) ** 2;
      if (d < bestD) { bestD = d; bestP = p; }
    }
    return bestP;
  }

  /* ── computeDRSZones ───────────────────────────────────────────────────────
    Priority 1: invisible #DRS-ZONES paths  (getPointAtLength start/end)
    Priority 2: st12 line markers in #DRS group
    Priority 3: tracks.json fallback.drsZones (already set before this runs)
    ──────────────────────────────────────────────────────────────────────── */
  function computeDRSZones(svgEl) {
    try {
      /* Priority 1 — invisible drs-zone paths */
      const zonePaths = svgEl.querySelectorAll('#DRS-ZONES .drs-zone');
      // console.log('[F1] DRS invisible paths found:', zonePaths.length);

      if (zonePaths.length > 0) {
        const zones = [];
        for (const [idx, zp] of [...zonePaths].entries()) {
          const len    = zp.getTotalLength();
          const startP = closestProgress(zp.getPointAtLength(0));
          const endP   = closestProgress(zp.getPointAtLength(len));
          // console.log(`[F1]   Zone ${idx + 1}: rawStart=${startP.toFixed(4)} rawEnd=${endP.toFixed(4)} pathLen=${len.toFixed(1)}`);
          zones.push([+startP.toFixed(3), +endP.toFixed(3)]);
        }
        DRS_ZONES = zones;
        console.log('[F1] ✓ DRS source: invisible paths |', JSON.stringify(DRS_ZONES));
        return;
      }

      /* Priority 2 — st12 boundary markers */
      const drsGroup = [...svgEl.querySelectorAll('g')].find(g => g.id === 'DRS');
      // console.log('[F1] DRS group (#DRS) found:', !!drsGroup);
      if (drsGroup) {
        const markers = drsGroup.querySelectorAll('line.st12');
        // console.log('[F1] st12 markers found:', markers.length);
        if (markers.length >= 2) {
          const progs = [...markers].map(l => {
            const mx = (parseFloat(l.getAttribute('x1')) + parseFloat(l.getAttribute('x2'))) / 2;
            const my = (parseFloat(l.getAttribute('y1')) + parseFloat(l.getAttribute('y2'))) / 2;
            return closestProgress({ x: mx, y: my });
          }).sort((a, b) => a - b);

          DRS_ZONES = [];
          for (let i = 0; i + 1 < progs.length; i += 2)
            DRS_ZONES.push([+progs[i].toFixed(3), +progs[i + 1].toFixed(3)]);
          console.log('[F1] ✓ DRS source: st12 markers |', JSON.stringify(DRS_ZONES));
          return;
        }
      }

      /* Priority 3 — fallback from tracks.json (already set) */
      console.warn('[F1] ✗ No SVG DRS markers — using tracks.json fallback:', JSON.stringify(DRS_ZONES));

    } catch (e) {
      console.warn('[F1] computeDRSZones error:', e);
    }
  }

  /* ── buildPhysicsDRS ───────────────────────────────────────────────────────
    Converts DRS_ZONES (raw SVG progress) → DRS_ZONES_LAP (lap-relative).
    The DRS zone end is pulled back by the braking distance from
    (topSpeed + drsBoost) to the corner speed, so the car never brakes
    mid-zone.
    Wrapping zones (S/F straight) get end += 1.0.
    ──────────────────────────────────────────────────────────────────────── */
  function buildPhysicsDRS() {
    DRS_ZONES_LAP = [];
    const drsApproach = PHYSICS.topSpeed + PHYSICS.drsBoost;
    // console.log(`[F1] buildPhysicsDRS — drsApproach: ${drsApproach} km/h | ${DRS_ZONES.length} zone(s)`);

    for (const [idx, [rawStart, rawEnd]] of DRS_ZONES.entries()) {
      const lapStart = ((rawStart - LAP_ORIGIN) + 1) % 1;
      let   lapEnd   = ((rawEnd   - LAP_ORIGIN) + 1) % 1;

      let cornerSpeedAtExit = PHYSICS.topSpeed;
      for (const e of ENTRY_LIST) {
        if (e.lapAt > lapEnd) { cornerSpeedAtExit = e.speed; break; }
      }

      const bd     = (drsApproach ** 2 - cornerSpeedAtExit ** 2) / (7200 * PHYSICS.brake * TRACK_LEN_KM);
      const rawEnd_pulled = lapEnd;
      lapEnd = ((lapEnd - bd) % 1 + 1) % 1;
      if (lapEnd < lapStart) lapEnd += 1.0;

      DRS_ZONES_LAP.push([+lapStart.toFixed(3), +lapEnd.toFixed(3)]);
    }
    console.log('[F1] DRS_ZONES_LAP:', JSON.stringify(DRS_ZONES_LAP));
  }

  /* ── computeSectorBoundaries ── */
  function computeSectorBoundaries(svgEl, fbS1, fbS2) {
    try {
      const sectorGroup = [...svgEl.querySelectorAll('g')].find(g => g.id === 'セクター');
      const container   = sectorGroup || svgEl;
      const s3Path      = container.querySelector('.st3');
      const s2Path      = container.querySelector('.st2');

      // console.log('[F1] Sector paths found — .st3:', !!s3Path, '.st2:', !!s2Path);

      if (s3Path) {
        LAP_ORIGIN = closestProgress(s3Path.getPointAtLength(0));
        console.log('[F1] LAP_ORIGIN (raw SVG):', LAP_ORIGIN.toFixed(4));
      } else {
        console.warn('[F1] .st3 not found — LAP_ORIGIN stays 0');
      }

      const rawS1 = s3Path ? closestProgress(s3Path.getPointAtLength(s3Path.getTotalLength())) : fbS1;
      const rawS2 = s2Path ? closestProgress(s2Path.getPointAtLength(s2Path.getTotalLength())) : fbS2;
      // console.log('[F1] Sector raw SVG progress — S1 boundary:', rawS1.toFixed(4), '| S2 boundary:', rawS2.toFixed(4));

      S1_END = ((rawS1 - LAP_ORIGIN) + 1) % 1;
      S2_END = ((rawS2 - LAP_ORIGIN) + 1) % 1;
      if (S1_END >= S2_END) [S1_END, S2_END] = [S2_END, S1_END];
      console.log('[F1] S1_END (lapAt):', S1_END.toFixed(4), '| S2_END (lapAt):', S2_END.toFixed(4));

    } catch (e) {
      console.warn('[F1] computeSectorBoundaries error — using fallback:', e);
      S1_END = ((fbS1 - LAP_ORIGIN) + 1) % 1;
      S2_END = ((fbS2 - LAP_ORIGIN) + 1) % 1;
    }
  }

  /* ── detectCorners ── */
  function detectCorners(path, len) {
    const N   = 3000;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const pt = path.getPointAtLength(len * i / N);
      pts.push({ x: pt.x, y: pt.y, p: i / N });
    }

    const W     = 4;
    const kappa = new Array(N + 1).fill(0);
    for (let i = W; i <= N - W; i++) {
      const dx1   = (pts[i + W].x - pts[i - W].x) / (2 * W);
      const dy1   = (pts[i + W].y - pts[i - W].y) / (2 * W);
      const dx2   = (pts[i + W].x - 2 * pts[i].x + pts[i - W].x) / (W * W);
      const dy2   = (pts[i + W].y - 2 * pts[i].y + pts[i - W].y) / (W * W);
      const denom = Math.pow(dx1 * dx1 + dy1 * dy1, 1.5);
      kappa[i]    = denom > 1e-12 ? Math.abs(dx1 * dy2 - dy1 * dx2) / denom : 0;
    }

    const THRESHOLD = 0.003;
    const MIN_GAP   = 80;
    const corners   = [];
    let   lastExit  = -MIN_GAP;

    for (let i = W + 1; i <= N - W - 1; i++) {
      if (
        kappa[i] > THRESHOLD &&
        kappa[i] >= kappa[i - 1] &&
        kappa[i] >= kappa[i + 1] &&
        i - lastExit > MIN_GAP
      ) {
        let ei = i;
        while (ei > lastExit + 5 && kappa[ei] > kappa[i] * 0.30) ei--;
        let xi = i;
        while (xi < N - 5  && kappa[xi] > kappa[i] * 0.30) xi++;

        corners.push({ entryP: pts[ei].p, apexP: pts[i].p, exitP: pts[xi].p, kappa: kappa[i] });
        lastExit = xi;
        i        = xi;
      }
    }

    return corners;
  }

  /* ── debugDRSOverlay ───────────────────────────────────────────────────────
    Draws a colored stroke along .st0 between each DRS zone's
    detected start and end progress fractions.
    GREEN  = DRS zone active region
    RED    = braking-pullback region (lapEnd → rawEnd)
    Visible in browser, remove after calibration is done.
    ──────────────────────────────────────────────────────────────────────── */
  // function debugDRSOverlay(svgEl) {
  //   const STEPS = 800;                    // resolution of the drawn overlay
  //   const DRS_COLOR   = '#00FF88';        // zone active  (green)
  //   const BRAKE_COLOR = '#FF3300';        // brake pullback (red)
  //   const WIDTH       = 4;

  //   DRS_ZONES.forEach(([rawStart, rawEnd], idx) => {
  //     const lapStart    = ((rawStart  - LAP_ORIGIN) + 1) % 1;
  //     const lapEnd_full = ((rawEnd    - LAP_ORIGIN) + 1) % 1;
  //     const lapEnd_phys = DRS_ZONES_LAP[idx]?.[1] % 1;  // physics end (mod 1 for wrap)

  //     /* Draw active DRS region (lapStart → lapEnd_phys) */
  //     drawSegment(svgEl, lapStart, lapEnd_phys, DRS_COLOR, WIDTH, `drs-active-${idx}`);

  //     /* Draw brake-pullback region (lapEnd_phys → lapEnd_full) */
  //     drawSegment(svgEl, lapEnd_phys, lapEnd_full, BRAKE_COLOR, WIDTH * 0.6, `drs-brake-${idx}`);

  //     console.log(`[F1] DEBUG overlay Zone ${idx + 1}: active=${lapStart.toFixed(3)}→${lapEnd_phys?.toFixed(3)} brake=${lapEnd_phys?.toFixed(3)}→${lapEnd_full.toFixed(3)}`);
  //   });
  // }

  // function drawSegment(svgEl, fromLap, toLap, color, width, id) {
  //   const STEPS = 600;
  //   if (fromLap == null || toLap == null) return;

  //   /* Handle wrap: if toLap < fromLap, split into two segments */
  //   if (toLap < fromLap) {
  //     drawSegment(svgEl, fromLap, 1.0,    color, width, `${id}-a`);
  //     drawSegment(svgEl, 0.0,    toLap,   color, width, `${id}-b`);
  //     return;
  //   }

  //   const ns = 'http://www.w3.org/2000/svg';
  //   const polyline = document.createElementNS(ns, 'polyline');
  //   const points   = [];

  //   for (let i = 0; i <= STEPS; i++) {
  //     const frac  = fromLap + (toLap - fromLap) * (i / STEPS);
  //     const rawP  = (LAP_ORIGIN + frac) % 1;
  //     const pt    = trackPath.getPointAtLength(trackLen * rawP);
  //     points.push(`${pt.x.toFixed(2)},${pt.y.toFixed(2)}`);
  //   }

  //   polyline.setAttribute('points',         points.join(' '));
  //   polyline.setAttribute('fill',           'none');
  //   polyline.setAttribute('stroke',         color);
  //   polyline.setAttribute('stroke-width',   String(width));
  //   polyline.setAttribute('stroke-linecap', 'round');
  //   polyline.setAttribute('opacity',        '0.85');
  //   polyline.setAttribute('id',             `debug-${id}`);

  //   svgEl.appendChild(polyline);
  // }

  /* ── init ──────────────────────────────────────────────────────────────────
    Strict execution order:
    1.  fetch SVG + tracks.json in parallel
    2.  apply TRACK_LEN_KM + PHYSICS setup from metadata
    3.  insert SVG into live DOM
    4.  set trackPath, trackLen, trackScale
    5.  computeSectorBoundaries  → LAP_ORIGIN, S1_END, S2_END
    6.  computeDRSZones          → DRS_ZONES (raw SVG progress)
    7.  detectCorners            → raw κ positions
    8.  convert to lapAt, sort, trim
    9.  cornerSpeedFromKappa     → speed per corner (override or physics)
    10. compute entryLapAt per corner
    11. build HOLD_ZONES + ENTRY_LIST
    12. buildPhysicsDRS          → DRS_ZONES_LAP (lap-relative, physics)
    13. requestAnimationFrame    → simulation begins
    ──────────────────────────────────────────────────────────────────────── */
  async function init() {
    try {
      const F1_CALENDAR_2025 = [
        { date: '03-16', track: 'albert-park'   },
        { date: '03-23', track: 'hungaroring'   },
        { date: '04-06', track: 'bahrain'       },
        { date: '04-13', track: 'jeddah'        },
        { date: '05-04', track: 'miami'         },
        { date: '05-18', track: 'imola'         },
        { date: '05-25', track: 'monaco'        },
        { date: '06-01', track: 'barcelona'     },
        { date: '06-15', track: 'montreal'      },
        { date: '06-29', track: 'red-bull-ring' },
        { date: '07-06', track: 'silverstone'   },
        { date: '07-27', track: 'spa'           },
        { date: '08-10', track: 'suzuka'        },
        { date: '08-17', track: 'paul-ricard'   },
        { date: '08-31', track: 'zandvoort'     },
        { date: '09-07', track: 'monza'         },
        { date: '09-21', track: 'baku'          },
        { date: '10-05', track: 'singapore'     },
        { date: '10-19', track: 'cota'          },
        { date: '10-26', track: 'mexico'        },
        { date: '11-09', track: 'interlagos'    },
        { date: '11-22', track: 'las-vegas'     },
        { date: '11-30', track: 'lusail'        },
        { date: '12-07', track: 'yas-marina'    },
      ];

      async function resolveTrack() {
        const now   = new Date();
        const mmdd  = (now.getMonth() + 1) * 100 + now.getDate();

        // Convert calendar to MM*100+DD for year-agnostic comparison
        const withMmdd = F1_CALENDAR_2025.map(e => {
          const d = new Date(e.date);
          return { ...e, mmdd: (d.getMonth() + 1) * 100 + d.getDate() };
        });

        // Most recent past race by day-of-year, wrapping if needed
        const past = withMmdd
          .filter(e => e.mmdd <= mmdd)
          .sort((a, b) => b.mmdd - a.mmdd);

        // If nothing passed yet this year (e.g. Jan 1), wrap around to Dec 7
        const ordered = past.length > 0
          ? past
          : [...withMmdd].sort((a, b) => b.mmdd - a.mmdd);

        // Walk from most recent backwards until an SVG loads
        for (const entry of ordered) {
          const ok = await fetch(`assets/${entry.track}.svg`, { method: 'HEAD' })
            .then(r => r.ok).catch(() => false);
          if (ok) return entry.track;
        }

        // All SVGs missing: day-based cycle
        const dayIdx = mmdd % F1_CALENDAR_2025.length;
        return F1_CALENDAR_2025[dayIdx].track;
      }

      setMapState('loading');
      await waitForMapViewport(document.getElementById('hero') || mapLayer);

      const trackKey = await resolveTrack();
      const svgSrc  = `assets/${trackKey}.svg`;
      mapLayer.dataset.trackKey = trackKey;

      const [svgText, allTracks] = await Promise.all([
        fetch(svgSrc).then(r => {
          if (!r.ok) throw new Error(`Track SVG failed to load: ${svgSrc}`);
          return r.text();
        }),
        fetch('assets/tracks.json').then(r => r.json()).catch(() => {
          console.warn('[F1] tracks.json not found — using defaults');
          return {};
        }),
      ]);

      const meta = allTracks[trackKey] ?? null;
      if (!meta) console.warn(`[F1] No entry for "${trackKey}" in tracks.json`);

      if (meta) {
        TRACK_LEN_KM = meta.trackLenKm ?? TRACK_LEN_KM;
        PHYSICS = {
          a_lat:    meta.setup?.a_lat    ?? CAR.a_lat,
          topSpeed: meta.setup?.topSpeed ?? CAR.topSpeed,
          drsBoost: meta.setup?.drsBoost ?? CAR.drsBoost,
          throttle: meta.setup?.throttle ?? CAR.throttle,
          brake:    meta.setup?.brake    ?? CAR.brake,
        };
        if (meta.fallback?.drsZones) DRS_ZONES = meta.fallback.drsZones;
        console.log(`[F1] Track: ${meta.name} (${TRACK_LEN_KM} km) | top=${PHYSICS.topSpeed} a_lat=${PHYSICS.a_lat}`);
      } else {
        console.warn(`[F1] No data for "${trackKey}" in tracks.json — lap times will be wrong`);
      }

      const fbS1      = meta?.fallback?.s1End  ?? 0.325;
      const fbS2      = meta?.fallback?.s2End  ?? 0.635;
      const cornerDefs = meta?.corners ?? [];

      /* Insert SVG into live DOM */
      const svgEl = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
      svgEl.id            = 'track-map';
      svgEl.setAttribute('aria-hidden', 'true');
      const existingMap = mapLayer.querySelector('#track-map');
      if (existingMap) existingMap.remove();
      mapLayer.appendChild(svgEl);
      setMapState('ready');

      trackPath  = svgEl.querySelector('.st0');
      if (!trackPath) { console.warn('[F1] .st0 not found'); return; }
      trackLen   = trackPath.getTotalLength();
      trackScale = (TRACK_LEN_KM * 1000) / trackLen;   // metres per SVG unit
      console.log(`[F1] trackScale: ${trackScale.toFixed(4)} m/unit`);

      /* Steps 5–6 */
      computeSectorBoundaries(svgEl, fbS1, fbS2);
      computeDRSZones(svgEl);

      /* Steps 7–8 */
      const rawCorners = detectCorners(trackPath, trackLen);
      console.log(`[F1] Detected ${rawCorners.length} corners`);

      rawCorners.forEach(c => {
        c.apexLapAt  = ((c.apexP  - LAP_ORIGIN) + 1) % 1;
        c.entryLapAt = ((c.entryP - LAP_ORIGIN) + 1) % 1;
      });
      rawCorners.sort((a, b) => a.apexLapAt - b.apexLapAt);

      /* Trim false detections to match cornerDefs count if provided */
      if (cornerDefs.length > 0 && rawCorners.length > cornerDefs.length) {
        rawCorners.splice(cornerDefs.length);
        console.log(`[F1] Trimmed to ${cornerDefs.length} corners`);
      }

      /* Steps 9–10 */
      rawCorners.forEach((c, i) => {
        const override  = cornerDefs[i]?.racingLine ?? null;
        c.speed         = cornerSpeedFromKappa(c.kappa, override);
        c.fiaMin        = cornerDefs[i]?.fiaMin ?? c.speed;

        const approachSpeed = PHYSICS.topSpeed + PHYSICS.drsBoost;
        const brakeDist     = (approachSpeed ** 2 - c.speed ** 2)
                              / (7200 * PHYSICS.brake * TRACK_LEN_KM);
        c.entryLapAt    = ((c.apexLapAt - brakeDist) % 1 + 1) % 1;
      });

      // console.log('[F1] Corners:', rawCorners.map((c, i) =>
      //   `T${i+1}@${c.apexLapAt.toFixed(3)} κ=${c.kappa.toFixed(4)} r=${((1/c.kappa)*trackScale).toFixed(0)}m spd=${c.speed}km/h`
      // ).join(' | '));

      /* Step 11 */
      HOLD_ZONES = rawCorners
        .filter(c => c.speed < PHYSICS.topSpeed)          // ← drop flat-out corners
        .map(c => ({ start: c.entryLapAt, end: c.apexLapAt, speed: c.speed }));

      ENTRY_LIST = rawCorners
        .filter(c => c.speed < PHYSICS.topSpeed)          // ← same filter
        .map(c => ({ lapAt: c.entryLapAt, speed: c.speed }));
      
      ENTRY_LIST.sort((a, b) => a.lapAt - b.lapAt);

      /* Step 12 */
      buildPhysicsDRS();

      await new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
      });
      // debugDRSOverlay(svgEl);
      requestAnimationFrame(frame);

    } catch (e) {
      setMapState('error');
      console.error('[F1] GPS init error:', e);
    }
  }
  
  init();
})();

/* ── Live F1 WDC Leader ── */
(function () {
  const TEAM_COLORS = {
    mercedes:          '#00D2BE',
    red_bull:          '#3671C6',
    ferrari:           '#E8002D',
    mclaren:           '#FF8000',
    aston_martin:      '#358C75',
    williams:          '#64C4FF',
    alpine:            '#FF87BC',
    haas:              '#B6BABD',
    sauber:            '#00E701',
    kick_sauber:       '#00E701',
    rb:                '#6692FF',
    racing_bulls:      '#6692FF',
  };

  function teamColor(constructorId) {
    const id = (constructorId || '').toLowerCase().replace(/\s+/g, '_');
    return TEAM_COLORS[id] || '#8C8C9B';
  }

  async function fetchWDC() {
    try {
      const res  = await fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings/1.json');
      const data = await res.json();
      const standing = data.MRData.StandingsTable.StandingsLists[0];
      const s        = standing.DriverStandings[0];
      const driver   = s.Driver;
      const team     = s.Constructors[0];
      const color    = teamColor(team.constructorId);
      const num      = driver.permanentNumber || '?';
      const lastName = driver.familyName.toUpperCase();
      const round    = standing.round;

      const numEl = document.getElementById('wdc-number');
      if (numEl) {
        numEl.textContent = num;
        numEl.style.color = color;
        numEl.style.textShadow = `0 0 12px ${color}66`;
      }
      const nameEl = document.getElementById('wdc-name');
      if (nameEl) {
        nameEl.textContent = lastName;
        nameEl.style.color = color;
      }
      const teamEl = document.getElementById('wdc-team');
      if (teamEl) teamEl.textContent = team.name.toUpperCase();

      const ptsEl = document.getElementById('wdc-pts');
      if (ptsEl) ptsEl.textContent = s.points;

      const winsEl = document.getElementById('wdc-wins');
      if (winsEl) winsEl.textContent = s.wins;

      const roundEl = document.getElementById('wdc-round');
      if (roundEl) roundEl.textContent = round;
    } catch (e) {
      const w = document.getElementById('wdc-widget');
      if (w) w.style.display = 'none';
    }
  }

  fetchWDC();
})();

/* ── Telemetry Canvas ── */
(function () {
  const canvas = document.getElementById('telemetry-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  const LINES = 6;
  const lines = Array.from({ length: LINES }, (_, i) => ({
    y:     (H || window.innerHeight) * ((i + 1) / (LINES + 1)) + (Math.random() - 0.5) * 80,
    x:     Math.random() * (window.innerWidth || 1400),
    speed: 0.4 + Math.random() * 0.6,
    len:   120 + Math.random() * 180,
    color: ['#E10600','#BF00FF','#00D45E','#FFE900','#00D2BE','#FF8700'][i],
    alpha: 0.25 + Math.random() * 0.3,
    amp:   12 + Math.random() * 20,
    freq:  0.008 + Math.random() * 0.012,
    phase: Math.random() * Math.PI * 2,
    tick:  0,
  }));

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.01;

    lines.forEach(line => {
      line.x += line.speed;
      line.tick += 0.04;
      if (line.x - line.len > W) line.x = -line.len;

      ctx.beginPath();
      const grad = ctx.createLinearGradient(line.x - line.len, 0, line.x, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.7, line.color);
      grad.addColorStop(1, line.color);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.globalAlpha = line.alpha;

      let first = true;
      for (let px = line.x - line.len; px <= line.x; px += 2) {
        const py = line.y + Math.sin(px * line.freq + line.phase + line.tick) * line.amp;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const tipY = line.y + Math.sin(line.x * line.freq + line.phase + line.tick) * line.amp;
      ctx.beginPath();
      ctx.arc(line.x, tipY, 2, 0, Math.PI * 2);
      ctx.fillStyle = line.color;
      ctx.globalAlpha = line.alpha * 2;
      ctx.fill();

      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    lines.forEach((line, i) => {
      line.y = H * ((i + 1) / (LINES + 1)) + (Math.random() - 0.5) * 80;
    });
  });

  resize();
  draw();
})();

/* Lap timer is now driven by the GPS simulation engine above */

/* ── Scroll Reveal ── */
(function () {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, idx) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), idx * 60);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
})();

/* ── Counter animation ── */
(function () {
  const counters = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur    = 1600;
      const start  = performance.now();

      function step(now) {
        const t    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        const val  = Math.round(ease * target);
        el.textContent = val.toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
})();

/* ── Nav active section highlight ── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => io.observe(s));
})();

/* ── Nav background on scroll ── */
(function () {
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 40
      ? 'rgba(21,21,30,0.98)'
      : 'rgba(21,21,30,0.92)';
  }, { passive: true });
})();
