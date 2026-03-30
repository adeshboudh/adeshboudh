/* ═══════════════════════════════════════════════════════
   ADESH BOUDH — F1 TELEMETRY SCRIPTS
   ═══════════════════════════════════════════════════════ */

/* ── F1 GPS Simulation Engine ── */
/* Dot drives everything: physics loop → sector crossings → lap/sector timers */
(function () {
  const indicator = document.getElementById('driver-indicator');
  const lapEl = document.getElementById('lap-timer');
  const s1El = document.getElementById('s1');
  const s2El = document.getElementById('s2');
  const s3El = document.getElementById('s3');
  const s1t = document.getElementById('s1-time');
  const s2t = document.getElementById('s2-time');
  const s3t = document.getElementById('s3-time');
  const drsLight = document.querySelector('.drs-light');
  if (!indicator || !lapEl) return;

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

  /* ── Yas Marina circuit config ──
     Sector boundaries as progress fractions (0–1) along the main track path.
     Tuned to match where .st1/.st2 sector marker paths visually bisect the track. */
  let S1_END = 0.325;   // S1→S2 boundary (overwritten at init from SVG geometry)
  let S2_END = 0.635;   // S2→S3 boundary (overwritten at init from SVG geometry)

  /* DRS activation zones — progress ranges where dot gets speed boost */
  let DRS_ZONES = [
    [0.410, 0.560],   // Zone 1: Back straight (T8 region) — overwritten at init
    [0.875, 1.000],   // Zone 2: S/F straight (end)         — overwritten at init
    [0.000, 0.055],   // Zone 2: S/F straight (wrap-around) — overwritten at init
  ];

  function inDRS(p) {
    p = ((p % 1) + 1) % 1;
    return DRS_ZONES.some(([a, b]) => p >= a && p <= b);
  }

  /* ── Speed profile: [progress, multiplier]
     Interpolated. 1.0 = average speed. >1 = straights, <1 = corners.
     Normalised by computeNorm() so total lap ≈ BASE_LAP_MS. */
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

  function speedAt(p) {
    p = ((p % 1) + 1) % 1;
    for (let i = 0; i < SPD.length - 1; i++) {
      if (p >= SPD[i][0] && p <= SPD[i+1][0]) {
        const t = (p - SPD[i][0]) / (SPD[i+1][0] - SPD[i][0]);
        return SPD[i][1] + (SPD[i+1][1] - SPD[i][1]) * t;
      }
    }
    return SPD[SPD.length - 1][1];
  }

  /* Normalisation: compute harmonic mean so total lap = exactly BASE_LAP_MS.
     Derivation: dp/dt = speedAt(p)/(normFactor*BASE_LAP_MS)
     → T = normFactor * BASE_LAP_MS * ∫₀¹ dp/speedAt(p)
     → normFactor = 1 / avg(1/speedAt) to make T = BASE_LAP_MS */
  const BASE_LAP_MS = 88000;
  let normFactor = 1.0;
  function computeNorm() {
    const N = 2000;
    let s = 0;
    for (let i = 0; i < N; i++) s += 1 / speedAt(i / N);
    normFactor = N / s;  // harmonic mean = 1 / avg(1/speedAt)
  }

  /* ── Race state ── */
  let lapProgress = 0;        // fraction within current lap (0=finish line, 1=finish line again)
  let progress    = 0;        // raw .st0 path position = (LAP_ORIGIN + lapProgress) % 1
  let LAP_ORIGIN  = 0;        // raw path fraction of the finish line (computed from .st3 end)
  let lapState    = 'INIT';   // INIT | RUNNING
  let lapStart    = null;
  let sectorStart = null;
  let curSector   = 0;        // 0=S1, 1=S2, 2=S3
  let lastFrame   = null;
  let lapJitter   = 1.0;      // per-lap speed variation

  /* ── Velocity state (NEW) ──────────────────────────────────────────
   currentVelocity  : what the car is actually doing right now
   prevVelocity     : last frame's velocity (available for telemetry)
   
   The controller drives currentVelocity toward targetVelocity each
   frame using asymmetric throttle/brake rates. lapProgress advances
   by currentVelocity — not directly by speedAt() — so the dot
   accelerates and brakes with inertia instead of teleporting to speed.
   ────────────────────────────────────────────────────────────────── */
  let currentVelocity = 0;
  let prevVelocity    = 0;

  let best = { s1: Infinity, s2: Infinity, s3: Infinity };
  let prev = { s1: null,     s2: null,     s3: null     };

  /* ── Formatting ── */
  function fmtLap(ms) {
    ms = Math.floor(ms);
    const mi  = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const ms3 = ms % 1000;
    return `${mi}:${String(sec).padStart(2,'0')}.${String(ms3).padStart(3,'0')}`;
  }
  function fmtSec(ms) {
    ms = Math.floor(ms);
    return `${Math.floor(ms / 1000)}.${String(ms % 1000).padStart(3,'0')}`;
  }

  /* ── Sector color logic (same rules as real F1 timing tower) ── */
  function sectorCls(key, ms) {
    if (prev[key] === null) return 's-green';   // first lap ever
    if (ms < best[key])     return 's-purple';  // fastest ever (purple)
    if (ms <= prev[key])    return 's-green';   // beats last lap (green)
    return 's-yellow';                           // slower (yellow)
  }

  /* ── Dot glow based on sector / DRS ──
     lapP  = lap-relative progress (0–1, used for sector color)
     rawP  = raw .st0 progress    (0–1, used for DRS zone lookup) */
  function dotGlow(lapP, rawP) {
    if (inDRS(rawP))      return { color: '#00D2BE', drs: true  };
    if (lapP < S1_END)    return { color: '#BF00FF', drs: false };
    if (lapP < S2_END)    return { color: '#00D45E', drs: false };
    return                       { color: '#FFE900', drs: false };
  }

  /* ── Record completed sector ── */
  function completeSector(num, ms) {
    const key  = `s${num}`;
    const el   = [s1El, s2El, s3El][num - 1];
    const tel  = [s1t,  s2t,  s3t ][num - 1];
    if (!el || !tel) return;
    el.className    = `sector ${sectorCls(key, ms)}`;
    tel.textContent = fmtSec(ms);
    if (ms < best[key]) best[key] = ms;
    prev[key] = ms;
  }

  /* ── Reset for new lap ── */
  function startLap(now) {
    lapStart    = now;
    sectorStart = now;
    lastFrame   = now;
    curSector   = 0;
    lapProgress = 0;
    progress    = LAP_ORIGIN;
    lapJitter   = 0.977 + Math.random() * 0.046;

    /* First lap only: seed velocity to finish-line speed so the dot
      doesn't ramp up from zero on the S/F straight.
      On lap completions currentVelocity carries over — the car
      doesn't stop at the line. */
    if (currentVelocity === 0) {
      currentVelocity = speedAt(0) / normFactor;
    }

    if (s1El) s1El.className = 'sector s-active';
    if (s1t)  s1t.textContent = '0.000';

    // S2 and S3: show previous lap time until sector is completed this lap.
    // Only blank them on the very first lap when there's no data yet.
    if (prev.s2 === null) {
      if (s2El) s2El.className = 'sector';
      if (s2t)  s2t.textContent = '--.-.-';
    }
    if (prev.s3 === null) {
      if (s3El) s3El.className = 'sector';
      if (s3t)  s3t.textContent = '--.-.-';
    }

    lapEl.textContent = '0:00.000';
  }

  /* ── SVG coordinate mapping ── */
  let trackPath = null;
  let trackLen  = 0;
  let cachedCTM = null; // avoid forcing layout reflow at 60fps

  window.addEventListener('resize', () => { cachedCTM = null; });

  function screenPt(p) {
    const t  = Math.max(0, Math.min(1, p));
    const pt = trackPath.getPointAtLength(trackLen * t);
    if (!cachedCTM) cachedCTM = trackPath.ownerSVGElement.getScreenCTM();
    if (!cachedCTM) return null;
    return new DOMPoint(pt.x, pt.y).matrixTransform(cachedCTM);
  }

  /* ── Tab visibility: freeze timers while hidden ──────────────────────
   Without this, lapStart/sectorStart are real timestamps so coming
   back after 10s would instantly show +10s on the timer.
   Instead: advance both anchors by the hidden gap so they reflect
   only simulated (active) time. The 50ms dt-clamp handles position. ── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (lastFrame === null) return;
    const gap = performance.now() - lastFrame;
    lapStart    += gap;
    sectorStart += gap;
    lastFrame    = performance.now();
  });

  /* ── Main animation loop ── */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!trackPath) return;

    if (lapState === 'INIT') {
      lapState = 'RUNNING';
      startLap(now); // now = fresh rAF timestamp, guaranteed correct
      return;        // ← ADD THIS: skip the dt calculation on the very
    }               //   first frame so lastFrame=now before any dt math

    const dt = Math.min(now - lastFrame, 50); // 50ms clamp: tab-switch safety
    lastFrame = now;

    /* ── PHYSICS: asymmetric velocity controller ───────────────────────
      targetVelocity = what the track profile says the car should do.
      currentVelocity chases it with different rates for throttle vs brake.
      
      Throttle : +THROTTLE_RATE per ms  (smooth, gradual build)
      Braking  : -BRAKE_RATE   per ms  (sharp, ~3.33× harder)
      
      lapProgress advances by currentVelocity — not by speedAt() directly.
      This gives the dot real inertia: you see it scrub speed into T9,
      ride the brakes through the hairpin, and slowly unwind on exit.
      ──────────────────────────────────────────────────────────────── */
    prevVelocity    = currentVelocity;
    const targetVel = (speedAt(lapProgress) / normFactor) * lapJitter;

    if (currentVelocity < targetVel) {
      // Throttle: controlled ramp up
      currentVelocity = Math.min(currentVelocity + THROTTLE_RATE * dt, targetVel);
    } else {
      // Brake: sharper deceleration toward corner target
      currentVelocity = Math.max(currentVelocity - BRAKE_RATE * dt, targetVel);
    }

    /* Position advances by controlled velocity, not lookup directly */
    lapProgress += currentVelocity * dt / BASE_LAP_MS;
    progress     = (LAP_ORIGIN + lapProgress) % 1;

    const elapsed = now - lapStart;

    /* ── Sector crossings ── */
    if (curSector === 0 && lapProgress >= S1_END) {
      completeSector(1, now - sectorStart);
      curSector   = 1;
      sectorStart = now;
      if (s2El) s2El.className = 'sector s-active';
    }
    if (curSector === 1 && lapProgress >= S2_END) {
      completeSector(2, now - sectorStart);
      curSector   = 2;
      sectorStart = now;
      if (s3El) s3El.className = 'sector s-active';
    }

    /* ── Lap complete ── */
    if (lapProgress >= 1.0) {
      completeSector(3, now - sectorStart);
      lapEl.textContent = fmtLap(elapsed);
      startLap(now);
      const fp = screenPt(LAP_ORIGIN);
      if (fp) { indicator.style.left = `${fp.x}px`; indicator.style.top = `${fp.y}px`; }
      return;
    }

    /* ── Timer displays ── */
    lapEl.textContent = fmtLap(elapsed);
    if (curSector === 0 && s1t) s1t.textContent = fmtSec(now - sectorStart);
    if (curSector === 1 && s2t) s2t.textContent = fmtSec(now - sectorStart);
    if (curSector === 2 && s3t) s3t.textContent = fmtSec(now - sectorStart);

    /* ── Dot position and glow ── */
    const pt = screenPt(progress);
    if (!pt) return;

    const { color, drs } = dotGlow(lapProgress, progress);
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
      if (!drsGroup) { console.warn('[F1] DRS group not found — using defaults'); return; }
      var lines = drsGroup.querySelectorAll('line.st10');
      if (lines.length < 2) { console.warn('[F1] <2 DRS markers — using defaults'); return; }
      var progs = [];
      for (var j = 0; j < lines.length; j++) {
        var mx = (parseFloat(lines[j].getAttribute('x1')) + parseFloat(lines[j].getAttribute('x2'))) / 2;
        var my = (parseFloat(lines[j].getAttribute('y1')) + parseFloat(lines[j].getAttribute('y2'))) / 2;
        progs.push(closestProgress({ x: mx, y: my }));
      }
      progs.sort(function(a, b) { return a - b; });
      var zones = [], GAP = 0.05, zs = progs[0], ze = progs[0];
      for (var k = 1; k < progs.length; k++) {
        if (progs[k] - progs[k-1] > GAP) { zones.push([+(zs.toFixed(3)), +(ze.toFixed(3))]); zs = progs[k]; }
        ze = progs[k];
      }
      zones.push([+(zs.toFixed(3)), +(ze.toFixed(3))]);
      var expanded = [];
      zones.forEach(function(z) {
        if (z[1] >= 0.90) { expanded.push([z[0], 1.000]); expanded.push([0.000, 0.055]); }
        else { expanded.push(z); }
      });
      if (expanded.length > 0) { DRS_ZONES = expanded; console.log('[F1] DRS zones:', JSON.stringify(DRS_ZONES)); }
    } catch(e) { console.warn('[F1] computeDRSZones error, using defaults:', e); }
  }

  /* ── computeSectorBoundaries ──
   .st3 (red)  = Sector 1: start = finish line → LAP_ORIGIN, end = S1/S2 boundary
   .st2 (blue) = Sector 2: start = S1/S2 boundary, end = S2/S3 boundary
   .st1 (yellow) = Sector 3: implicitly finish line (not queried) ── */
  function computeSectorBoundaries(svgEl) {
    try {
      var sectorGroup = null;
      var groups = svgEl.querySelectorAll('g');
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].id === 'セクター') { sectorGroup = groups[i]; break; }
      }
      var container = sectorGroup || svgEl;
      var s3Path = container.querySelector('.st3'); // red  = S1 path
      var s2Path = container.querySelector('.st2'); // blue = S2 path

      if (s3Path) {
        LAP_ORIGIN = closestProgress(s3Path.getPointAtLength(0));
        console.log('[F1] LAP_ORIGIN:', LAP_ORIGIN.toFixed(4));
      } else {
        console.warn('[F1] .st3 not found — LAP_ORIGIN stays 0');
      }

      var rawS1 = S1_END, rawS2 = S2_END;
      if (s3Path) rawS1 = closestProgress(s3Path.getPointAtLength(s3Path.getTotalLength()));
      else        console.warn('[F1] .st3 not found — using default S1_END');
      if (s2Path) rawS2 = closestProgress(s2Path.getPointAtLength(s2Path.getTotalLength()));
      else        console.warn('[F1] .st2 not found — using default S2_END');

      S1_END = ((rawS1 - LAP_ORIGIN) + 1) % 1;
      S2_END = ((rawS2 - LAP_ORIGIN) + 1) % 1;

      if (S1_END >= S2_END) {
        console.warn('[F1] S1_END >= S2_END — swapping');
        var tmp = S1_END; S1_END = S2_END; S2_END = tmp;
      }
      console.assert(S1_END < S2_END && S2_END < 1.0, '[F1] Sector boundaries sanity check failed');
      console.log('[F1] S1_END:', S1_END.toFixed(4), '| S2_END:', S2_END.toFixed(4));
    } catch(e) { console.warn('[F1] computeSectorBoundaries error, using defaults:', e); }
  }

  /* ── closestProgress: given an SVG-space point, return the progress fraction on .st0
     that is geometrically closest to it. Operates in SVG local coordinate space.
     Requires trackPath and trackLen to be set (called only from init() callbacks). ── */
  function closestProgress(targetPt, steps) {
    steps = steps || 2000;
    var best = Infinity, bestP = 0;
    for (var i = 0; i <= steps; i++) {
      var p  = i / steps;
      var pt = trackPath.getPointAtLength(trackLen * p);
      var d  = (pt.x - targetPt.x) ** 2 + (pt.y - targetPt.y) ** 2;
      if (d < best) { best = d; bestP = p; }
    }
    return bestP;
  }

  /* ── Fetch + inline SVG so JS can access path geometry ── */
  async function init() {
    try {
      const imgEl = document.getElementById('track-map');
      if (!imgEl) return;

      const res    = await fetch('assets/track.svg');
      const text   = await res.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(text, 'image/svg+xml');
      const svgEl  = svgDoc.documentElement;

      svgEl.id           = 'track-map';
      svgEl.style.cssText = imgEl.style.cssText || '';
      imgEl.replaceWith(svgEl);

      trackPath = svgEl.querySelector('.st0');
      if (!trackPath) { console.warn('[F1] .st0 not found in track SVG'); return; }
      trackLen = trackPath.getTotalLength();

      computeNorm();

      /* Calibrate physics rates to normalized velocity space.
        VEL_RANGE spans peak→valley in normalized units.
        Throttle: covers full range in 4000ms  (~1.5g analog)
        Braking:  covers full range in 1200ms  (~5g analog, 3.33× throttle) */
      const VEL_RANGE = (1.55 - 0.38) / normFactor;
      THROTTLE_RATE   = VEL_RANGE / 4000;
      BRAKE_RATE      = VEL_RANGE / 1200;
      console.log(`[F1] Physics — THROTTLE: ${THROTTLE_RATE.toFixed(6)}/ms | BRAKE: ${BRAKE_RATE.toFixed(6)}/ms | ratio: ${(BRAKE_RATE/THROTTLE_RATE).toFixed(2)}x`);

      computeSectorBoundaries(svgEl);
      computeDRSZones(svgEl);
      requestAnimationFrame(frame);
    } catch(e) {
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
