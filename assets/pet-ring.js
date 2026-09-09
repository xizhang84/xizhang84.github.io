/* ============================================================
   PET ring hero animation
   A ring of scintillator crystals surrounds the portrait.
   Positron annihilation events emit back-to-back 511 keV photons
   that fly outward, light up the crystals they hit, and briefly
   draw the line of response between them.
   Pure canvas, no dependencies. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  const host = document.querySelector('.hero-visual');
  const canvas = host && host.querySelector('.pet-ring');
  if (!host || !canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Config ----------
  const CRYSTALS = 64;           // segments around the ring
  const RING_THICKNESS = 12;     // px
  const GAP_RATIO = 0.22;        // fraction of each slot left empty
  const PHOTON_SPEED = 0.42;     // px per ms
  const TRAIL = 22;              // px streak behind the photon
  const FLASH_MS = 720;
  const LOR_MS = 1000;
  const IDLE_INTERVAL = [1300, 2100];   // ms between spontaneous events
  const HOVER_INTERVAL = [260, 420];    // ms between events while hovering

  // ---------- State ----------
  let size = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  let photons = [];
  const flashes = new Float64Array(CRYSTALS); // timestamp of last hit per crystal
  let lors = [];
  let pointer = null;          // {x, y} in canvas CSS px while hovering
  let nextEventAt = 0;
  let running = false;
  let rafId = 0;
  let lastTs = 0;
  let colors = {};

  // ---------- Helpers ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const pick = (name, fallback) => (cs.getPropertyValue(name).trim() || fallback);
    colors = {
      crystal: pick('--ring-crystal', 'rgba(31,22,17,0.14)'),
      flash: pick('--teal', '#04A4BA'),
      photon: pick('--terracotta', '#C6644D'),
      lor: pick('--ring-lor', 'rgba(4,164,186,0.35)')
    };
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    size = Math.round(rect.width);
    if (!size) return;   // hero hidden (another view is open); measured again when shown
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = size / 2;
    cy = size / 2;
    R = size / 2 - RING_THICKNESS / 2 - 2;
    drawStatic();
  }

  function withAlpha(color, a) {
    // accepts #rgb, #rrggbb, rgb() or rgba(); returns rgba() with alpha a
    if (color.startsWith('rgb')) {
      const inner = color.slice(color.indexOf('(') + 1, color.lastIndexOf(')'));
      const parts = inner.split(',').slice(0, 3).map(s => s.trim());
      return 'rgba(' + parts.join(',') + ',' + a + ')';
    }
    let h = color.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // ---------- Drawing ----------
  function drawRing(now) {
    const slot = (Math.PI * 2) / CRYSTALS;
    const arc = slot * (1 - GAP_RATIO);
    ctx.lineWidth = RING_THICKNESS;
    ctx.lineCap = 'butt';
    for (let i = 0; i < CRYSTALS; i++) {
      const a0 = i * slot - Math.PI / 2 + (slot - arc) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a0 + arc);
      ctx.strokeStyle = colors.crystal;
      ctx.stroke();

      const age = now - flashes[i];
      if (age >= 0 && age < FLASH_MS) {
        const t = 1 - age / FLASH_MS;
        const eased = t * t;
        ctx.save();
        ctx.shadowBlur = 14 * eased;
        ctx.shadowColor = withAlpha(colors.flash, 0.9 * eased);
        ctx.beginPath();
        ctx.arc(cx, cy, R, a0, a0 + arc);
        ctx.strokeStyle = withAlpha(colors.flash, 0.15 + 0.85 * eased);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawStatic() {
    ctx.clearRect(0, 0, size, size);
    drawRing(-Infinity);
  }

  function drawLORs(now) {
    ctx.lineWidth = 1;
    for (const l of lors) {
      const age = now - l.t;
      const t = clamp(1 - age / LOR_MS, 0, 1);
      ctx.strokeStyle = withAlpha(colors.lor, 0.6 * t * t);
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    }
  }

  function drawPhotons() {
    for (const p of photons) {
      const tx = p.x - Math.cos(p.a) * TRAIL;
      const ty = p.y - Math.sin(p.a) * TRAIL;
      const g = ctx.createLinearGradient(tx, ty, p.x, p.y);
      g.addColorStop(0, withAlpha(colors.photon, 0));
      g.addColorStop(1, withAlpha(colors.photon, 0.9));
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = withAlpha(colors.photon, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- Simulation ----------
  function spawnEvent(ox, oy) {
    const a = Math.random() * Math.PI * 2;
    // both photons share one event so the LOR can be drawn once both land
    const ev = { hits: [] };
    photons.push({ x: ox, y: oy, a: a, ev: ev });
    photons.push({ x: ox, y: oy, a: a + Math.PI, ev: ev });
  }

  function randomOrigin() {
    // within a disc of radius 0.45 R, uniform by area
    const r = Math.sqrt(Math.random()) * R * 0.45;
    const a = Math.random() * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }

  function step(now) {
    if (!running) return;
    const dt = Math.min(now - lastTs || 16, 48);
    lastTs = now;

    if (now >= nextEventAt) {
      if (pointer) {
        spawnEvent(pointer.x, pointer.y);
        nextEventAt = now + rand(HOVER_INTERVAL[0], HOVER_INTERVAL[1]);
      } else {
        const o = randomOrigin();
        spawnEvent(o[0], o[1]);
        nextEventAt = now + rand(IDLE_INTERVAL[0], IDLE_INTERVAL[1]);
      }
    }

    const inner = R - RING_THICKNESS / 2;
    const remaining = [];
    for (const p of photons) {
      p.x += Math.cos(p.a) * PHOTON_SPEED * dt;
      p.y += Math.sin(p.a) * PHOTON_SPEED * dt;
      const dx = p.x - cx, dy = p.y - cy;
      if (dx * dx + dy * dy >= inner * inner) {
        const hitAng = Math.atan2(dy, dx);
        const idx = ((Math.round((hitAng + Math.PI / 2) / (Math.PI * 2) * CRYSTALS) % CRYSTALS) + CRYSTALS) % CRYSTALS;
        flashes[idx] = now;
        p.ev.hits.push({ x: cx + Math.cos(hitAng) * inner, y: cy + Math.sin(hitAng) * inner });
        if (p.ev.hits.length === 2) {
          const h1 = p.ev.hits[0], h2 = p.ev.hits[1];
          lors.push({ x1: h1.x, y1: h1.y, x2: h2.x, y2: h2.y, t: now });
        }
      } else {
        remaining.push(p);
      }
    }
    photons = remaining;
    lors = lors.filter(l => now - l.t < LOR_MS);

    ctx.clearRect(0, 0, size, size);
    drawLORs(now);
    drawRing(now);
    drawPhotons();

    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (!size) resize();
    if (running || reduceMotion.matches || !size) return;
    running = true;
    lastTs = performance.now();
    nextEventAt = lastTs + 400;
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  // ---------- Wiring ----------
  readColors();
  resize();

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('themechange', () => { readColors(); if (!running) drawStatic(); });

  host.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const d = Math.hypot(x - cx, y - cy);
    pointer = d > R - RING_THICKNESS ? null : { x: x, y: y };
  });
  host.addEventListener('pointerleave', () => { pointer = null; });

  // only animate while on screen and the tab is visible
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => en.isIntersecting ? start() : stop());
  }, { threshold: 0.1 });
  io.observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (host.getBoundingClientRect().bottom > 0) start();
  });
  reduceMotion.addEventListener('change', () => { stop(); drawStatic(); if (!reduceMotion.matches) start(); });
})();
