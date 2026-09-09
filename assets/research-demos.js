/* ============================================================
   Research demos — one small canvas simulation per research theme.

   Each card's visual is a <canvas class="research-demo"> with the
   paper figure behind a Demo / Figure toggle. A demo is a factory
   that receives a shared state object {w, h, pal, pointer, still}
   and returns {reset, draw(ctx, now, dt), click?}. Demos run only
   while on screen and while the demo tab is active; under
   prefers-reduced-motion they paint a single still frame.

     liob       femtosecond-laser optical barriers in CsI:Tl:
                the laser writes converging pixel walls, a gamma
                ray is absorbed, and its light stays in its pixel
     dcspect    cardiac SPECT: an arc of collimated modules whose
                loft holes converge on the heart
     msr        monolithic scintillator ring: light spreads in
                one crystal, SiPMs read out the centroid
     sigmadelta sigma-delta SiPM readout: analog pulse → 1-bit
                stream → FPGA bit count → energy spectrum
   ============================================================ */
(function () {
  'use strict';
  const hosts = Array.from(document.querySelectorAll('.research-visual[data-demo]'));
  if (!hosts.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAPTION_H = 26;   // the HTML caption sits over the bottom strip of the canvas
  const cssVar = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;
  const readPalette = () => ({
    dark: document.documentElement.getAttribute('data-theme') === 'dark',
    ink: cssVar('--ink', '#1f1611'),
    soft: cssVar('--ink-soft', '#4a3f33'),
    faint: cssVar('--ink-faint', '#8a7b66'),
    teal: cssVar('--teal', '#04a4ba'),
    terra: cssVar('--terracotta', '#c6644d'),
    sage: cssVar('--sage', '#7a9a6e'),
    sand: cssVar('--sand', '#e8d9b8'),
    elev: cssVar('--bg-elev', '#f8f1de')
  });
  const hexRGB = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const MONO = "500 10px 'JetBrains Mono', ui-monospace, Consolas, monospace";
  const label = (ctx, text, x, y, color, align) => {
    ctx.font = MONO; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x, y);
  };
  const glowDot = (ctx, x, y, r, color, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, alpha)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };

  /* ---------------- 1. Laser-processed converging-pixel CsI:Tl ---------------- */
  function makeLiob(S) {
    const NPIX = 11, NSIPM = 8, REFLECT = 0.93, LASER_MS = 170;
    let cr, focus, sipms, photons, gammas, marks, written, laserStart, nextGamma, clock;
    // pixel walls are straight lines through a focal point above the crystal
    const wallX = (i, y) => focus.x + (cr.x + cr.w * i / NPIX - focus.x) * (y - focus.y) / (cr.y - focus.y);
    const side = (i, px, py) => px - wallX(i, py);   // > 0: right of wall i
    const pixelAt = (px, py) => clamp(Math.floor((px - wallX(0, py)) / ((wallX(NPIX, py) - wallX(0, py)) / NPIX)), 0, NPIX - 1);
    const reset = () => {
      cr = { x: S.w * 0.2, y: S.h * 0.36, w: S.w * 0.6, h: S.h * 0.34 };
      focus = { x: S.w * 0.5, y: cr.y - cr.w * 1.15 };
      sipms = [];
      for (let i = 0; i < NSIPM; i++) sipms.push({ x0: cr.x + cr.w * i / NSIPM, x1: cr.x + cr.w * (i + 1) / NSIPM, light: 0 });
      photons = []; gammas = []; marks = [];
      written = 0; laserStart = 0; nextGamma = 0; clock = 0;
    };
    const fireGamma = () => {
      const k = S.pointer ? pixelAt(clamp(S.pointer.x, cr.x + 1, cr.x + cr.w - 1), cr.y) : Math.floor(rand(0, NPIX));
      const xl = wallX(k, cr.y), xr = wallX(k + 1, cr.y);
      const xTop = (xl + xr) / 2 + rand(-0.3, 0.3) * (xr - xl);
      let dx = xTop - focus.x, dy = cr.y - focus.y;
      const L = Math.hypot(dx, dy); dx /= L; dy /= L;
      const depth = rand(0.12, 0.6) * cr.h / dy;
      const y0 = -8;
      gammas.push({ x: focus.x + dx * ((y0 - focus.y) / dy), y: y0, dx, dy, left: (cr.y - y0) / dy + depth, pix: k, speed: S.h * 1.8 });
    };
    const absorb = (g, now) => {
      for (let i = 0; i < 26; i++) {
        const a = rand(0, Math.PI * 2), sp = S.h * rand(0.35, 0.65);
        photons.push({ x: g.x, y: g.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, pix: g.pix, born: now });
      }
      marks.push({ x: g.x, y: g.y, t: now, pix: g.pix });
    };
    const reflect = (ph, wi) => {
      let dx = wallX(wi, cr.y + cr.h) - wallX(wi, cr.y), dy = cr.h;
      const L = Math.hypot(dx, dy); dx /= L; dy /= L;
      const dot = ph.vx * dx + ph.vy * dy;
      ph.vx = 2 * dot * dx - ph.vx; ph.vy = 2 * dot * dy - ph.vy;
      ph.x -= side(wi, ph.x, ph.y) * 1.05;
    };
    const draw = (ctx, now, dt) => {
      const p = S.pal, ds = dt / 1000;
      if (!laserStart) laserStart = now;
      written = S.still ? NPIX + 1 : Math.min(NPIX + 1, (now - laserStart) / LASER_MS);
      const writing = written < NPIX + 1;

      if (!writing && !S.still) {
        clock += dt;
        if (clock >= nextGamma) { fireGamma(); nextGamma = clock + (S.pointer ? rand(380, 560) : rand(800, 1200)); }
        gammas = gammas.filter(g => {
          const step = Math.min(g.speed * ds, g.left);
          g.x += g.dx * step; g.y += g.dy * step; g.left -= step;
          if (g.left <= 0.001) { absorb(g, now); return false; }
          return true;
        });
        photons = photons.filter(ph => {
          if (now - ph.born > 2600) return false;
          ph.x += ph.vx * ds; ph.y += ph.vy * ds;
          if (ph.y < cr.y) { ph.y = 2 * cr.y - ph.y; ph.vy = -ph.vy; }          // entrance face: reflector
          if (ph.y >= cr.y + cr.h) {                                              // exit face: SiPM
            sipms[clamp(Math.floor((ph.x - cr.x) / (cr.w / NSIPM)), 0, NSIPM - 1)].light += 1;
            return false;
          }
          for (const [wi, sign] of [[ph.pix, 1], [ph.pix + 1, -1]]) {
            if (side(wi, ph.x, ph.y) * sign < 0) {
              if (Math.random() < REFLECT || wi === 0 || wi === NPIX) reflect(ph, wi);
              else ph.pix -= sign;                                                // leaked into the neighbour
            }
          }
          return true;
        });
        const decay = Math.pow(0.12, ds);
        sipms.forEach(s => { s.light *= decay; });
        marks = marks.filter(m => now - m.t < 1500);
      }

      // crystal body (wider at the SiPM face)
      const yb = cr.y + cr.h;
      ctx.beginPath();
      ctx.moveTo(wallX(0, cr.y), cr.y); ctx.lineTo(wallX(NPIX, cr.y), cr.y);
      ctx.lineTo(wallX(NPIX, yb), yb); ctx.lineTo(wallX(0, yb), yb); ctx.closePath();
      ctx.fillStyle = rgba(p.sand, p.dark ? 0.55 : 0.6); ctx.fill();
      ctx.strokeStyle = rgba(p.ink, 0.4); ctx.lineWidth = 1; ctx.stroke();
      // walls written so far, from the exit face up
      ctx.lineWidth = 0.9;
      for (let i = 1; i < NPIX; i++) {
        const frac = clamp(written - i, 0, 1);
        if (frac <= 0) continue;
        const y0 = yb - cr.h * frac;
        ctx.strokeStyle = rgba(p.ink, 0.45);
        ctx.beginPath(); ctx.moveTo(wallX(i, yb), yb); ctx.lineTo(wallX(i, y0), y0); ctx.stroke();
        if (frac < 1) {
          const fx = wallX(i, y0);
          ctx.strokeStyle = rgba(p.terra, 0.75); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(fx, -2); ctx.lineTo(fx, y0); ctx.stroke();
          glowDot(ctx, fx, y0, 9, p.terra, 0.9);
          ctx.lineWidth = 0.9;
        }
      }
      // SiPMs
      sipms.forEach(s => {
        const k = Math.min(1, s.light / 9);
        ctx.fillStyle = rgba(p.teal, 0.12 + 0.8 * k);
        ctx.fillRect(s.x0 + 1, yb + 4, s.x1 - s.x0 - 2, 9);
        if (k > 0.05) glowDot(ctx, (s.x0 + s.x1) / 2, yb + 8, 16, p.teal, 0.5 * k);
      });
      label(ctx, 'SiPM', cr.x - 8, yb + 12, p.faint, 'right');
      label(ctx, 'CsI:Tl', cr.x - 8, cr.y + cr.h / 2 + 3, p.faint, 'right');
      // gammas
      ctx.strokeStyle = p.terra; ctx.lineWidth = 2;
      gammas.forEach(g => {
        ctx.beginPath(); ctx.moveTo(g.x - g.dx * 16, g.y - g.dy * 16); ctx.lineTo(g.x, g.y); ctx.stroke();
        glowDot(ctx, g.x, g.y, 7, p.terra, 0.8);
      });
      // scintillation photons
      photons.forEach(ph => {
        const a = 1 - (now - ph.born) / 2600;
        ctx.fillStyle = rgba(p.teal, 0.9 * a);
        ctx.beginPath(); ctx.arc(ph.x, ph.y, 1.5, 0, Math.PI * 2); ctx.fill();
      });
      // absorption flash + decoded pixel
      marks.forEach(m => {
        const k = (now - m.t) / 1500;
        glowDot(ctx, m.x, m.y, 6 + 26 * k, p.terra, 0.7 * (1 - k));
        const xc = (wallX(m.pix, cr.y) + wallX(m.pix + 1, cr.y)) / 2;
        label(ctx, 'px ' + String(m.pix + 1).padStart(2, '0'), xc, cr.y - 6, rgba(p.teal, 1 - k), 'center');
      });
      if (writing) label(ctx, 'fs laser · writing optical barriers', 10, 14, p.terra);
      else label(ctx, 'γ 140 keV · ' + NPIX + ' converging pixels, no saw cuts', 10, 14, p.faint);
    };
    return { reset, draw };
  }

  /* ---------------- 2. DC-SPECT: collimated modules around the heart ---------------- */
  function makeDcspect(S) {
    const NMOD = 30, COVER = 230 * Math.PI / 180, ACCEPT = 0.085;
    let cx, cy, R, mods, heart, focusPt, photons, septa, emitAcc, total, accepted;
    const reset = () => {
      cx = S.w * 0.5; cy = S.h * 0.5; R = Math.min(S.w * 0.34, S.h * 0.44);
      focusPt = { x: cx - R * 0.16, y: cy + R * 0.04 };
      heart = { x: focusPt.x, y: focusPt.y };
      mods = [];
      for (let i = 0; i < NMOD; i++) {
        const a = -Math.PI / 2 + (i / (NMOD - 1) - 0.5) * COVER;
        mods.push({ a, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, counts: 0, flash: 0 });
      }
      photons = []; septa = []; emitAcc = 0; total = 0; accepted = 0;
    };
    const emit = () => {
      const a = rand(0, Math.PI * 2), r = R * 0.1 * Math.sqrt(Math.random());
      const d = rand(0, Math.PI * 2);
      photons.push({ x: heart.x + Math.cos(a) * r, y: heart.y + Math.sin(a) * r, dx: Math.cos(d), dy: Math.sin(d), sp: R * 1.4 });
    };
    const draw = (ctx, now, dt) => {
      const p = S.pal, ds = dt / 1000;
      if (S.pointer) {
        const ex = (S.pointer.x - cx) / (R * 0.62), ey = (S.pointer.y - cy) / (R * 0.5);
        const m = Math.hypot(ex, ey), k = m > 0.82 ? 0.82 / m : 1;
        heart.x = cx + ex * k * R * 0.62; heart.y = cy + ey * k * R * 0.5;
      } else {
        const k = Math.min(1, ds * 2.5);
        heart.x += (focusPt.x - heart.x) * k; heart.y += (focusPt.y - heart.y) * k;
      }
      if (!S.still) {
        const gap = S.pointer ? 45 : 70;
        emitAcc += dt;
        while (emitAcc >= gap) { emit(); emitAcc -= gap; }
        photons = photons.filter(ph => {
          ph.x += ph.dx * ph.sp * ds; ph.y += ph.dy * ph.sp * ds;
          const r = Math.hypot(ph.x - cx, ph.y - cy);
          if (r >= R - 3) {
            const rel = wrap(Math.atan2(ph.y - cy, ph.x - cx) + Math.PI / 2);
            if (Math.abs(rel) <= COVER / 2) {
              const m = mods[Math.round((rel / COVER + 0.5) * (NMOD - 1))];
              total++;
              // a loft hole only passes photons travelling along its axis, which points at the focal region
              const axis = Math.atan2(m.y - focusPt.y, m.x - focusPt.x);
              if (Math.abs(wrap(Math.atan2(ph.dy, ph.dx) - axis)) < ACCEPT) { m.counts++; m.flash = 1; accepted++; }
              else septa.push({ x: ph.x, y: ph.y, t: now });
            }
            return false;
          }
          return r < R * 1.4;
        });
        const decay = Math.pow(0.02, ds);
        mods.forEach(m => { m.flash *= decay; });
        septa = septa.filter(s => now - s.t < 260);
      }
      const maxC = Math.max(1, ...mods.map(m => m.counts));

      // chest outline and the focal region the loft holes converge on
      ctx.strokeStyle = rgba(p.ink, 0.28); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.72, R * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba(p.teal, 0.5);
      ctx.beginPath(); ctx.arc(focusPt.x, focusPt.y, R * 0.2, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, 'focal region', focusPt.x + R * 0.2 + 6, focusPt.y + 4, rgba(p.teal, 0.8), 'left');
      // hole axes of a few modules, faint
      ctx.strokeStyle = rgba(p.teal, 0.12);
      mods.forEach((m, i) => { if (i % 3) return; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(focusPt.x, focusPt.y); ctx.stroke(); });
      // modules with their count bars
      mods.forEach(m => {
        const k = m.counts / maxC;
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a + Math.PI / 2);
        ctx.fillStyle = rgba(p.teal, 0.18 + 0.7 * k);
        ctx.fillRect(-R * 0.055, -4, R * 0.11, 8);
        ctx.strokeStyle = rgba(p.ink, 0.35); ctx.strokeRect(-R * 0.055, -4, R * 0.11, 8);
        if (m.flash > 0.02) { ctx.fillStyle = rgba(p.teal, m.flash); ctx.fillRect(-R * 0.055, -4, R * 0.11, 8); }
        ctx.fillStyle = rgba(p.terra, 0.85);
        ctx.fillRect(-R * 0.03, 6, R * 0.06, 3 + R * 0.16 * k);
        ctx.restore();
      });
      // heart / tracer
      const beat = 1 + 0.06 * Math.sin(now / 160);
      glowDot(ctx, heart.x, heart.y, R * 0.26, p.terra, 0.35);
      ctx.fillStyle = p.terra;
      ctx.beginPath(); ctx.arc(heart.x, heart.y, R * 0.11 * beat, 0, Math.PI * 2); ctx.fill();
      // photons in flight and photons stopped by the septa
      ctx.fillStyle = rgba(p.terra, 0.9);
      photons.forEach(ph => { ctx.beginPath(); ctx.arc(ph.x, ph.y, 1.7, 0, Math.PI * 2); ctx.fill(); });
      septa.forEach(s => { const k = 1 - (now - s.t) / 260; ctx.fillStyle = rgba(p.ink, 0.5 * k); ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2); ctx.fill(); });
      label(ctx, '230° · 80 CsI:Tl modules, one loft-hole collimator each', 10, 14, p.faint);
      label(ctx, accepted + ' counts · ' + (total ? Math.round(100 * accepted / total) : 0) + '% pass the septa', 10, 28, p.teal);
    };
    return { reset, draw };
  }

  /* ---------------- 3. Monolithic scintillator ring PET ---------------- */
  function makeMsr(S) {
    const NS = 46, SIGMA = 0.24;
    let cx, cy, ri, ro, rm, sipms, src, home, photons, glows, lors, image, next, clock;
    const reset = () => {
      cx = S.w * 0.5; cy = S.h * 0.5;
      ri = Math.min(S.w * 0.34, S.h * 0.42) * 0.78; ro = ri * 1.28; rm = (ri + ro) / 2;
      sipms = [];
      for (let i = 0; i < NS; i++) { const a = (i / NS) * Math.PI * 2; sipms.push({ a, x: cx + Math.cos(a) * rm, y: cy + Math.sin(a) * rm, light: 0 }); }
      home = { x: cx + ri * 0.3, y: cy - ri * 0.15 }; src = { x: home.x, y: home.y };
      photons = []; glows = []; lors = []; image = []; next = 0; clock = 0;
    };
    const hit = (ph, now) => {
      const ha = Math.atan2(ph.y - cy, ph.x - cx);
      glows.push({ a: ha, t: now });
      sipms.forEach(s => { const d = wrap(s.a - ha); s.light += Math.exp(-d * d / (2 * SIGMA * SIGMA)); });
      const est = ha + rand(-0.035, 0.035);        // centroid of the SiPM light, with its noise
      ph.ev.hits.push(est);
      if (ph.ev.hits.length === 2) { lors.push({ a1: ph.ev.hits[0], a2: ph.ev.hits[1], t: now }); image.push(lors[lors.length - 1]); if (image.length > 90) image.shift(); }
    };
    const draw = (ctx, now, dt) => {
      const p = S.pal, ds = dt / 1000;
      if (S.pointer) {
        const dx = S.pointer.x - cx, dy = S.pointer.y - cy, m = Math.hypot(dx, dy), k = m > ri * 0.8 ? ri * 0.8 / m : 1;
        src.x = cx + dx * k; src.y = cy + dy * k;
      } else { const k = Math.min(1, ds * 2.5); src.x += (home.x - src.x) * k; src.y += (home.y - src.y) * k; }
      if (!S.still) {
        clock += dt;
        if (clock >= next) {
          const a = rand(0, Math.PI * 2), ev = { hits: [] };
          [1, -1].forEach(sg => photons.push({ x: src.x, y: src.y, dx: Math.cos(a) * sg, dy: Math.sin(a) * sg, ev }));
          next = clock + (S.pointer ? rand(220, 320) : rand(380, 520));
        }
        photons = photons.filter(ph => {
          ph.x += ph.dx * ri * 2.4 * ds; ph.y += ph.dy * ri * 2.4 * ds;
          if (Math.hypot(ph.x - cx, ph.y - cy) >= ri) { hit(ph, now); return false; }
          return true;
        });
        const decay = Math.pow(0.04, ds);
        sipms.forEach(s => { s.light *= decay; });
        glows = glows.filter(g => now - g.t < 700);
        lors = lors.filter(l => now - l.t < 1200);
      }
      const onRing = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      // accumulated lines of response: the image forms where they cross
      ctx.lineWidth = 1;
      image.forEach(l => { const A = onRing(l.a1, ri), B = onRing(l.a2, ri); ctx.strokeStyle = rgba(p.terra, 0.07); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); });
      // the ring: one crystal, no pixels
      ctx.beginPath(); ctx.arc(cx, cy, ro, 0, Math.PI * 2); ctx.arc(cx, cy, ri, 0, Math.PI * 2, true);
      ctx.fillStyle = rgba(p.sand, p.dark ? 0.55 : 0.6); ctx.fill();
      ctx.strokeStyle = rgba(p.ink, 0.4);
      ctx.beginPath(); ctx.arc(cx, cy, ro, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, ri, 0, Math.PI * 2); ctx.stroke();
      // light spreading in the crystal from each hit
      glows.forEach(g => {
        const k = 1 - (now - g.t) / 700, [x, y] = onRing(g.a, rm);
        glowDot(ctx, x, y, (ro - ri) * (1.2 + 2.4 * (1 - k)), p.teal, 0.8 * k);
      });
      // SiPMs on the end face
      const sz = (ro - ri) * 0.42;
      sipms.forEach(s => {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
        ctx.fillStyle = rgba(p.teal, 0.1 + 0.9 * Math.min(1, s.light));
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        ctx.strokeStyle = rgba(p.ink, 0.35); ctx.lineWidth = 0.8; ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      });
      // current lines of response and the decoded hit positions
      lors.forEach(l => {
        const k = 1 - (now - l.t) / 1200, A = onRing(l.a1, ri), B = onRing(l.a2, ri);
        ctx.strokeStyle = rgba(p.teal, 0.9 * k); ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        [A, B].forEach(P => { ctx.strokeStyle = rgba(p.teal, k); ctx.beginPath(); ctx.arc(P[0], P[1], 4, 0, Math.PI * 2); ctx.stroke(); });
      });
      // photons and the source
      ctx.fillStyle = p.terra;
      photons.forEach(ph => { ctx.beginPath(); ctx.arc(ph.x, ph.y, 2.2, 0, Math.PI * 2); ctx.fill(); });
      glowDot(ctx, src.x, src.y, 14, p.terra, 0.6);
      ctx.beginPath(); ctx.arc(src.x, src.y, 3.5, 0, Math.PI * 2); ctx.fill();
      label(ctx, 'monolithic LYSO ring · 46 SiPMs per end face', 10, 14, p.faint);
      label(ctx, 'no pixels · no reflectors · 100% fill factor', 10, 28, p.teal);
    };
    return { reset, draw };
  }

  /* ---------------- 4. Sigma-delta SiPM readout ---------------- */
  function makeSigmaDelta(S) {
    const FS = 240, TAU = 0.11, WIN = 12, BINS = 22, BASE = 0.02;
    let N, xs, ys, rs, head, acc, yPrev, tSim, pulses, hist, nextPulse, primed, winSum, flashes;
    const reset = () => {
      N = Math.max(80, Math.floor(S.w * 0.66 / 1.15));
      xs = new Float32Array(N); ys = new Uint8Array(N); rs = new Float32Array(N);
      head = 0; acc = 0; yPrev = 0; tSim = 0; winSum = 0;
      pulses = []; hist = new Float32Array(BINS); nextPulse = 0.5; primed = false; flashes = [];
    };
    const fire = (A) => { pulses.push({ t0: tSim, A, bits: 0, until: tSim + TAU * 5 }); };
    const click = () => { if (!S.still) fire(rand(0.72, 0.8)); };
    const sample = () => {
      tSim += 1 / FS;
      if (tSim >= nextPulse) { fire(Math.random() < 0.6 ? rand(0.7, 0.82) : rand(0.18, 0.55)); nextPulse = tSim + rand(0.9, 1.7); }
      let x = BASE + rand(-0.012, 0.012);
      pulses.forEach(pl => { if (tSim >= pl.t0) x += pl.A * Math.exp(-(tSim - pl.t0) / TAU); });
      x = clamp(x, 0, 1);
      // first-order sigma-delta: integrate the error against the 1-bit feedback
      acc += x - yPrev;
      const y = acc > 0.5 ? 1 : 0;
      yPrev = y;
      pulses.forEach(pl => { if (tSim >= pl.t0) pl.bits += y; });
      pulses = pulses.filter(pl => {
        if (tSim < pl.until) return true;
        const e = pl.bits - BASE * FS * TAU * 5;                 // bits counted during the pulse, baseline removed
        const bin = clamp(Math.round(e / (FS * TAU * 0.95) * (BINS - 1)), 0, BINS - 1);
        hist[bin] += 1; flashes.push({ bin, t: tSim });
        return false;
      });
      // ring buffers + moving-average reconstruction (what the FPGA counter sees)
      winSum += y - ys[(head - WIN + N) % N];
      xs[head] = x; ys[head] = y; rs[head] = winSum / WIN;
      head = (head + 1) % N;
    };
    const draw = (ctx, now, dt) => {
      const p = S.pal;
      let steps = Math.min(Math.round(dt / 1000 * FS), 24);
      if (S.still) { steps = primed ? 0 : N; primed = true; }
      for (let i = 0; i < steps; i++) sample();

      const left = 10, right = S.w * 0.66, sx = (right - left) / N;
      const laneH = (S.h - 10) / 3;
      const lane = (i) => 8 + i * laneH;
      const idx = (k) => (head + k) % N;
      // lane 1: SiPM analog pulse
      let y0 = lane(0);
      ctx.beginPath();
      for (let k = 0; k < N; k++) { const y = y0 + laneH * 0.9 - xs[idx(k)] * laneH * 0.78; k ? ctx.lineTo(left + k * sx, y) : ctx.moveTo(left, y); }
      ctx.strokeStyle = p.terra; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.lineTo(right, y0 + laneH * 0.9); ctx.lineTo(left, y0 + laneH * 0.9); ctx.closePath();
      ctx.fillStyle = rgba(p.terra, 0.12); ctx.fill();
      label(ctx, 'SiPM pulse', left, y0 + 10, p.faint);
      // lane 2: 1-bit stream
      y0 = lane(1);
      ctx.fillStyle = rgba(p.teal, 0.85);
      const tw = Math.max(1, sx * 0.7);
      for (let k = 0; k < N; k++) if (ys[idx(k)]) ctx.fillRect(left + k * sx, y0 + laneH * 0.28, tw, laneH * 0.6);
      label(ctx, 'Σ-Δ 1-bit stream · no ADC', left, y0 + 10, p.faint);
      // lane 3: FPGA bit density
      y0 = lane(2);
      ctx.beginPath();
      for (let k = 0; k < N; k++) { const y = y0 + laneH * 0.9 - rs[idx(k)] * laneH * 0.78; k ? ctx.lineTo(left + k * sx, y) : ctx.moveTo(left, y); }
      ctx.strokeStyle = p.sage; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.lineTo(right, y0 + laneH * 0.9); ctx.lineTo(left, y0 + laneH * 0.9); ctx.closePath();
      ctx.fillStyle = rgba(p.sage, 0.14); ctx.fill();
      label(ctx, 'FPGA: bits per window', left, y0 + 10, p.faint);
      // energy spectrum from the counted bits
      const sxp = S.w * 0.71, swp = S.w * 0.27, top = 22, bottom = S.h - 4;
      const maxH = Math.max(1, ...hist);
      const bw = swp / BINS;
      for (let b = 0; b < BINS; b++) {
        const hgt = (bottom - top) * hist[b] / maxH;
        const hot = flashes.some(f => f.bin === b && tSim - f.t < 0.25);
        ctx.fillStyle = hot ? p.teal : rgba(p.terra, 0.85);
        ctx.fillRect(sxp + b * bw + 0.5, bottom - hgt, bw - 1, hgt);
      }
      flashes = flashes.filter(f => tSim - f.t < 0.25);
      ctx.strokeStyle = rgba(p.ink, 0.35); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sxp, bottom + 0.5); ctx.lineTo(sxp + swp, bottom + 0.5); ctx.stroke();
      label(ctx, 'energy spectrum', sxp, 14, p.faint);
      const pk = Math.round(0.76 / 0.95 * (BINS - 1));
      label(ctx, 'photopeak', sxp + (pk + 0.5) * bw, top + 8, rgba(p.terra, 0.9), 'center');
    };
    return { reset, draw, click };
  }

  const DEMOS = { liob: makeLiob, dcspect: makeDcspect, msr: makeMsr, sigmadelta: makeSigmaDelta };

  /* ---------------- lifecycle per card ---------------- */
  hosts.forEach(host => {
    const canvas = host.querySelector('canvas.research-demo');
    const make = DEMOS[host.dataset.demo];
    if (!canvas || !make) return;
    const ctx = canvas.getContext('2d');
    const S = { w: 0, h: 0, pal: readPalette(), pointer: null, still: reduceMotion };
    const demo = make(S);
    let dpr = 1, running = false, raf = 0, last = 0, visible = false, showDemo = true;

    const paint = (now, dt) => {
      if (S.w <= 0) return;                 // not laid out yet (view hidden)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S.w, S.h + CAPTION_H);
      demo.draw(ctx, now, dt);
    };
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(now - (last || now), 50);
      last = now;
      paint(now, dt);
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const want = visible && showDemo && !document.hidden && !reduceMotion && S.w > 0;
      if (want && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
      else if (!want && running) { running = false; cancelAnimationFrame(raf); }
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      S.w = r.width; S.h = r.height - CAPTION_H;
      demo.reset();
      if (!running) paint(performance.now(), 0);
      sync();
    };
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(entries => {
      visible = entries.some(e => e.isIntersecting);
      if (visible && !running && S.w > 0) demo.reset();   // replay the story each time it scrolls in
      sync();
    }, { threshold: 0.15 }).observe(host);
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('themechange', () => { S.pal = readPalette(); if (!running) paint(performance.now(), 0); });

    const setPointer = (e) => { const r = canvas.getBoundingClientRect(); S.pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.addEventListener('pointermove', setPointer);
    canvas.addEventListener('pointerleave', () => { S.pointer = null; });
    canvas.addEventListener('pointerdown', (e) => {
      setPointer(e);
      if (demo.click) demo.click(S.pointer);
      if (e.pointerType === 'touch') setTimeout(() => { S.pointer = null; }, 2500);
      if (reduceMotion) paint(performance.now(), 0);
    });
    host.querySelectorAll('.visual-tab').forEach(btn => btn.addEventListener('click', () => {
      showDemo = btn.dataset.show === 'demo';
      host.classList.toggle('show-figure', !showDemo);
      host.querySelectorAll('.visual-tab').forEach(b => b.classList.toggle('is-active', b === btn));
      sync();
    }));
  });
})();
