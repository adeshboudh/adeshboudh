/* ═══════════════════════════════════════════════════════
   ADESH BOUDH — F1 TELEMETRY SCRIPTS
   ═══════════════════════════════════════════════════════ */

/* ── F1 GPS Simulation Engine ── */
/* Dot drives everything: physics loop → sector crossings → lap/sector timers */
(function () {
  const indicator = document.getElementById('driver-indicator');
  const lapEl     = document.getElementById('lap-timer');
  const s1El      = document.getElementById('s1');
  const s2El      = document.getElementById('s2');
  const s3El      = document.getElementById('s3');
  const s1t       = document.getElementById('s1-time');
  const s2t       = document.getElementById('s2-time');
  const s3t       = document.getElementById('s3-time');
  const drsLight  = document.querySelector('.drs-light');

  if (!indicator || !lapEl) return;

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
  const S1_END = 0.325;   // S1→S2 boundary
  const S2_END = 0.635;   // S2→S3 boundary

  /* DRS activation zones — progress ranges where dot gets speed boost */
  const DRS_ZONES = [
    [0.415, 0.575],   // Zone 1: Back straight (T7 → T8)
    [0.875, 1.000],   // Zone 2: S/F straight (end)
    [0.000, 0.055],   // Zone 2: S/F straight (wrap to next lap)
  ];

  function inDRS(p) {
    p = ((p % 1) + 1) % 1;
    return DRS_ZONES.some(([a, b]) => p >= a && p <= b);
  }

  /* ── Speed profile: [progress, multiplier]
     Interpolated. 1.0 = average speed. >1 = straights, <1 = corners.
     Normalised by computeNorm() so total lap ≈ BASE_LAP_MS. */
  const SPD = [
    [0.000, 1.20],  // S/F straight — DRS
    [0.050, 0.68],  // T1 heavy braking
    [0.100, 0.46],  // T1 apex
    [0.140, 0.54],  // T2 exit
    [0.190, 0.78],  // T3 short straight
    [0.225, 0.52],  // T4-5 chicane entry
    [0.265, 0.44],  // T5 hairpin apex  ← slowest point
    [0.295, 0.65],  // T6-7 exit
    [0.325, 0.80],  // S1/S2 — acceleration
    [0.380, 1.00],  // Back straight run-up
    [0.415, 1.35],  // DRS Z1 opens
    [0.490, 1.55],  // Back straight peak  ← fastest point
    [0.555, 1.22],  // DRS Z1 closes
    [0.578, 0.52],  // T8 heavy braking
    [0.615, 0.40],  // T8-9 marina hairpin
    [0.635, 0.52],  // S2/S3 — marina exit
    [0.668, 0.65],  // T10-11
    [0.705, 0.82],  // T12 medium-speed
    [0.740, 0.55],  // Hotel section entry
    [0.775, 0.43],  // Hotel hairpin
    [0.805, 0.56],  // T17 exit
    [0.845, 0.82],  // T18-19 acceleration
    [0.875, 1.05],  // DRS Z2 opens
    [0.935, 1.18],  // Final straight
    [0.975, 1.22],  // Approach finish
    [1.000, 1.20],  // Finish line
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

  /* Normalisation: compute average speed so total lap ≈ BASE_LAP_MS */
  const BASE_LAP_MS = 88000;
  let normFactor = 1.0;
  function computeNorm() {
    const N = 2000;
    let s = 0;
    for (let i = 0; i < N; i++) s += speedAt(i / N);
    normFactor = s / N;
  }

  /* ── Race state ── */
  let progress    = 0;
  let lapState    = 'INIT';   // INIT | RUNNING | LAP_END
  let lapStart    = 0;
  let sectorStart = 0;
  let curSector   = 0;        // 0=S1, 1=S2, 2=S3
  let lastFrame   = 0;
  let lapEndAt    = 0;
  let lapJitter   = 1.0;      // per-lap speed variation

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
    if (prev[key] === null) return 's-green';    // first lap
    if (ms < best[key])     return 's-purple';   // fastest ever
    if (ms <= prev[key])    return 's-green';    // beats last lap
    return 's-yellow';                           // slower than last
  }

  /* ── Dot glow based on sector / DRS ── */
  function dotGlow(p) {
    if (inDRS(p))    return { color: '#00D2BE', drs: true  };  // cyan = DRS
    if (p < S1_END)  return { color: '#BF00FF', drs: false };  // purple = S1
    if (p < S2_END)  return { color: '#00D45E', drs: false };  // green  = S2
    return                  { color: '#FFE900', drs: false };  // yellow = S3
  }

  /* ── Record completed sector ── */
  function completeSector(num, ms) {
    const key  = `s${num}`;
    const elArr = [s1El, s2El, s3El];
    const tArr  = [s1t,  s2t,  s3t];
    const el    = elArr[num - 1];
    const tel   = tArr[num - 1];
    if (!el || !tel) return;
    const cls = sectorCls(key, ms);
    el.className    = `sector ${cls}`;
    tel.textContent = fmtSec(ms);
    if (ms < best[key]) best[key] = ms;
    prev[key] = ms;  // store for next-lap comparison
  }

  /* ── Reset for new lap ── */
  function startLap(now) {
    lapStart    = now;
    sectorStart = now;
    lastFrame   = now;
    curSector   = 0;
    progress    = 0;
    lapJitter   = 0.977 + Math.random() * 0.046;  // race-pace variation → laps land 86–90 s
    if (s1El) s1El.className = 'sector s-active';
    if (s2El) s2El.className = 'sector';
    if (s3El) s3El.className = 'sector';
    if (s1t)  s1t.textContent = '0.000';
    if (s2t)  s2t.textContent = '--.-.-';
    if (s3t)  s3t.textContent = '--.-.-';
    lapEl.textContent = '0:00.000';
  }

  /* ── SVG coordinate mapping ── */
  let trackPath = null;
  let trackLen  = 0;

  function screenPt(p) {
    const t   = Math.max(0, Math.min(1, p));
    const pt  = trackPath.getPointAtLength(trackLen * t);
    const ctm = trackPath.ownerSVGElement.getScreenCTM();
    if (!ctm) return null;
    return new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
  }

  /* ── Main animation loop ── */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!trackPath) return;

    /* First frame: kick off */
    if (lapState === 'INIT') {
      lapState = 'RUNNING';
      startLap(now);
      return;
    }

    /* Between laps: freeze dot at finish for 1.2 s */
    if (lapState === 'LAP_END') {
      if (now - lapEndAt > 1200) {
        lapState = 'RUNNING';
        startLap(now);
      }
      return;
    }

    /* ── RUNNING ── */
    const dt = Math.min(now - lastFrame, 50);  // clamp to 50 ms (tab-hidden safety)
    lastFrame = now;

    /* Advance progress using speed profile */
    const spd = (speedAt(progress) / normFactor) * lapJitter;
    progress += spd * dt / BASE_LAP_MS;

    const elapsed  = now - lapStart;
    const sElapsed = now - sectorStart;  // time within current sector

    /* ── Sector crossing: S1 → S2 ── */
    if (curSector === 0 && progress >= S1_END) {
      completeSector(1, now - sectorStart);
      curSector   = 1;
      sectorStart = now;
      if (s2El) s2El.className = 'sector s-active';
    }

    /* ── Sector crossing: S2 → S3 ── */
    if (curSector === 1 && progress >= S2_END) {
      completeSector(2, now - sectorStart);
      curSector   = 2;
      sectorStart = now;
      if (s3El) s3El.className = 'sector s-active';
    }

    /* ── Lap complete (finish line) ── */
    if (progress >= 1.0) {
      completeSector(3, now - sectorStart);
      lapEl.textContent = fmtLap(elapsed);
      lapState = 'LAP_END';
      lapEndAt = now;
      progress = 1.0;
      const fp = screenPt(1.0);
      if (fp) { indicator.style.left = `${fp.x}px`; indicator.style.top = `${fp.y}px`; }
      return;
    }

    /* ── Update timer displays ── */
    lapEl.textContent = fmtLap(elapsed);
    const secNow = now - sectorStart;
    if (curSector === 0 && s1t) s1t.textContent = fmtSec(secNow);
    if (curSector === 1 && s2t) s2t.textContent = fmtSec(secNow);
    if (curSector === 2 && s3t) s3t.textContent = fmtSec(secNow);

    /* ── Update dot position ── */
    const pt = screenPt(progress);
    if (!pt) return;

    const { color, drs } = dotGlow(progress);
    indicator.style.left      = `${pt.x}px`;
    indicator.style.top       = `${pt.y}px`;
    indicator.style.boxShadow = drs
      ? `0 0 8px 3px #00D2BE, 0 0 22px #00D2BE88, 0 0 4px #fff`
      : `0 0 6px 2px ${color}, 0 0 18px ${color}88, 0 0 4px #fff`;

    /* ── DRS light in nav hero ── */
    if (drsLight) {
      drsLight.style.background = drs ? '#00D2BE' : '#E10600';
      drsLight.style.boxShadow  = drs ? '0 0 8px #00D2BE' : '0 0 8px #E10600';
    }
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

      svgEl.id            = 'track-map';
      svgEl.style.cssText = imgEl.style.cssText || '';
      imgEl.replaceWith(svgEl);

      trackPath = svgEl.querySelector('.st0');
      if (!trackPath) { console.warn('.st0 not found in track SVG'); return; }
      trackLen = trackPath.getTotalLength();

      computeNorm();
      requestAnimationFrame(frame);
    } catch (e) {
      console.error('GPS init error:', e);
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
