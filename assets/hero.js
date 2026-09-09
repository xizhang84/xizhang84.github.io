/* ============================================================
   Hero animation (assets/hero.js). The landing page tells the start
   of one PET event without drawing anything over the portrait:

   1. background  a full-width canvas behind the hero where, every few
                  seconds, a positron annihilates somewhere in the
                  dark: two photons fly apart, the detection points
                  flash and the line of response fades. The layer
                  parallaxes a little with the pointer.
   2. title       on first load the name is "reconstructed": counts
                  accumulate inside the letter shapes until the text
                  resolves, then the real heading takes over.
   3. guide line  a dashed line from under the portrait to the scanner
                  below, with a pulse running down it: the event
                  continues in the scanner.
   4. avatar      the portrait tilts a few degrees toward the pointer.

   Everything is skipped under prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';
  const hero = document.querySelector('.hero');
  const home = document.getElementById('home');
  if (!hero || !home) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cssVar = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;
  const readPalette = () => ({
    dark: document.documentElement.getAttribute('data-theme') === 'dark',
    ink: cssVar('--ink', '#1f1611'),
    teal: cssVar('--teal', '#04a4ba'),
    terra: cssVar('--terracotta', '#c6644d')
  });
  const hexRGB = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
  const rand = (a, b) => a + Math.random() * (b - a);
  let pal = readPalette();
  document.addEventListener('themechange', () => { pal = readPalette(); });

  /* ---------------- 1. background events ---------------- */
  const canvas = hero.querySelector('.hero-events');
  const heroBg = hero.querySelector('.hero-bg');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const SPEED = 240;            // px/s
    const DETECT_MS = 900;        // photons are "detected" this long after the annihilation
    const LOR_MS = 1500;
    let W = 0, H = 0, dpr = 1;
    let events = [], nextAt = 0, clock = 0;
    let target = { x: 0, y: 0 }, offset = { x: 0, y: 0 };
    let ptr = null, ptrMovedAt = 0, dwellNext = 0;   // a pointer that rests for a moment becomes the source
    let running = false, raf = 0, last = 0, visible = false;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    const spawnAt = (x, y) => {
      const a = rand(0, Math.PI * 2);
      events.push({ x, y, dx: Math.cos(a), dy: Math.sin(a), t: 0 });
    };
    const spawn = () => spawnAt(rand(W * 0.08, W * 0.92), rand(H * 0.1, H * 0.9));
    const draw = (dt, now) => {
      const ds = dt / 1000;
      clock += dt;
      if (clock >= nextAt) { spawn(); nextAt = clock + (ptr ? rand(2600, 4200) : rand(1800, 3400)); }
      if (ptr && now - ptrMovedAt > 450 && now >= dwellNext) {
        spawnAt(ptr.x - offset.x + rand(-5, 5), ptr.y - offset.y + rand(-5, 5));
        dwellNext = now + rand(800, 1300);
      }
      offset.x += (target.x - offset.x) * Math.min(1, ds * 3);
      offset.y += (target.y - offset.y) * Math.min(1, ds * 3);
      if (heroBg) heroBg.style.transform = 'translate(' + (offset.x * 1.6).toFixed(1) + 'px,' + (offset.y * 1.6).toFixed(1) + 'px)';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.translate(offset.x, offset.y);
      const photonAlpha = pal.dark ? 0.9 : 0.75;
      events = events.filter(ev => {
        ev.t += dt;
        if (ev.t > DETECT_MS + LOR_MS) return false;
        const reach = Math.min(ev.t, DETECT_MS) / 1000 * SPEED;
        const p1 = { x: ev.x + ev.dx * reach, y: ev.y + ev.dy * reach };
        const p2 = { x: ev.x - ev.dx * reach, y: ev.y - ev.dy * reach };
        if (ev.t < DETECT_MS) {
          // two photons in flight, with a short fading trail
          [[p1, 1], [p2, -1]].forEach(([p, sg]) => {
            const g = ctx.createLinearGradient(p.x - ev.dx * sg * 28, p.y - ev.dy * sg * 28, p.x, p.y);
            g.addColorStop(0, rgba(pal.terra, 0)); g.addColorStop(1, rgba(pal.terra, photonAlpha));
            ctx.strokeStyle = g; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(p.x - ev.dx * sg * 28, p.y - ev.dy * sg * 28); ctx.lineTo(p.x, p.y); ctx.stroke();
            ctx.fillStyle = rgba(pal.terra, photonAlpha);
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
          });
          // the annihilation point itself, fading
          const k = 1 - ev.t / DETECT_MS;
          ctx.fillStyle = rgba(pal.terra, 0.5 * k);
          ctx.beginPath(); ctx.arc(ev.x, ev.y, 2 + 6 * (1 - k), 0, Math.PI * 2); ctx.fill();
        } else {
          // detected: rings at the hits, line of response fading out
          const k = 1 - (ev.t - DETECT_MS) / LOR_MS;
          ctx.strokeStyle = rgba(pal.teal, (pal.dark ? 0.45 : 0.35) * k * k);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          [p1, p2].forEach(p => {
            ctx.strokeStyle = rgba(pal.teal, 0.8 * k);
            ctx.beginPath(); ctx.arc(p.x, p.y, 3 + 5 * (1 - k), 0, Math.PI * 2); ctx.stroke();
          });
        }
        return true;
      });
    };
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(now - (last || now), 50);
      last = now;
      draw(dt, now);
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const want = visible && !document.hidden && W > 0;
      if (want && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
      else if (!want && running) { running = false; cancelAnimationFrame(raf); }
    };
    new ResizeObserver(() => { resize(); sync(); }).observe(canvas);
    new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); sync(); }, { threshold: 0.05 }).observe(hero);
    document.addEventListener('visibilitychange', sync);
    if (finePointer) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width - 0.5) * 16;
        target.y = ((e.clientY - r.top) / r.height - 0.5) * 10;
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (!ptr || Math.hypot(x - ptr.x, y - ptr.y) > 3) { ptrMovedAt = performance.now(); dwellNext = 0; }
        ptr = { x, y };
      });
      hero.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; ptr = null; });
    }
  }

  /* ---------------- 2. title reconstruction ---------------- */
  const h1 = hero.querySelector('.hero-name');
  const homeIsFirst = !location.hash || location.hash === '#home' || location.hash === '#map';
  if (h1 && !reduceMotion && homeIsFirst) {
    let seen = false;
    try { seen = sessionStorage.getItem('title-revealed') === '1'; } catch (e) { /* private mode */ }
    if (!seen) reveal();
  }
  async function reveal() {
    try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]); } catch (e) { /* no Font Loading API */ }
    const rect = h1.getBoundingClientRect();
    const cs = getComputedStyle(h1);
    const fs = parseFloat(cs.fontSize);
    const lh = parseFloat(cs.lineHeight) || fs * 1.2;
    if (!rect.width || rect.height > lh * 1.5) return;           // wrapped onto two lines: keep it simple

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(rect.width * dpr), ch = Math.round(rect.height * dpr);
    // letter shapes, drawn with the heading's own font
    const mask = document.createElement('canvas');
    mask.width = cw; mask.height = ch;
    const mctx = mask.getContext('2d', { willReadFrequently: true });
    mctx.scale(dpr, dpr);
    const fontFor = (italic) => (italic ? 'italic ' : 'normal ') + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    mctx.font = fontFor(false);
    if ('letterSpacing' in mctx) mctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    mctx.textBaseline = 'alphabetic';
    const met = mctx.measureText('Xg');
    const asc = met.fontBoundingBoxAscent || fs * 0.92, desc = met.fontBoundingBoxDescent || fs * 0.24;
    const baseline = (lh - (asc + desc)) / 2 + asc;
    const parts = [];
    h1.childNodes.forEach(n => {
      if (n.nodeType === 3) parts.push({ text: n.textContent, italic: false, color: pal.ink });
      else if (n.nodeType === 1) parts.push({ text: n.textContent, italic: n.classList.contains('accent'), color: n.classList.contains('accent') ? pal.terra : pal.ink });
    });
    let x = 0;
    parts.forEach(pt => {
      mctx.font = fontFor(pt.italic);
      mctx.fillStyle = pt.color;
      mctx.fillText(pt.text, x, baseline);
      x += mctx.measureText(pt.text).width;
    });
    const data = mctx.getImageData(0, 0, cw, ch).data;
    const pts = [];
    const step = Math.max(1, Math.round(dpr));
    for (let y = 0; y < ch; y += step) {
      for (let xx = 0; xx < cw; xx += step) {
        const i = (y * cw + xx) * 4;
        if (data[i + 3] > 90) pts.push([xx, y, data[i], data[i + 1], data[i + 2]]);
      }
    }
    if (pts.length < 50) return;
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pts[i]; pts[i] = pts[j]; pts[j] = t; }

    const cv = document.createElement('canvas');
    cv.className = 'title-reveal';
    cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d');
    h1.classList.add('is-revealing');
    h1.appendChild(cv);
    const DURATION = 1100;
    const dot = 1.1 * dpr;
    let start = 0, shown = 0;
    const tick = (now) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.2);
      const upto = Math.floor(pts.length * eased);
      for (; shown < upto; shown++) {
        const p = pts[shown];
        ctx.fillStyle = 'rgba(' + p[2] + ',' + p[3] + ',' + p[4] + ',0.85)';
        ctx.fillRect(p[0] - dot / 2, p[1] - dot / 2, dot, dot);
      }
      if (t < 1) { requestAnimationFrame(tick); return; }
      h1.classList.remove('is-revealing');
      cv.classList.add('is-done');
      setTimeout(() => cv.remove(), 500);
      try { sessionStorage.setItem('title-revealed', '1'); } catch (e) { /* ignore */ }
    };
    requestAnimationFrame(tick);
    // a background tab gets no frames: never leave the heading invisible
    setTimeout(() => { if (h1.classList.contains('is-revealing')) { h1.classList.remove('is-revealing'); cv.remove(); } }, 4000);
  }

  /* ---------------- 3. guide line into the scanner ---------------- */
  const guide = home.querySelector('.chain-guide');
  const avatar = hero.querySelector('.avatar-wrap');
  const heroRight = hero.querySelector('.hero-right');
  if (guide && avatar && heroRight) {
    const place = () => {
      const scanner = document.querySelector('.pet-scene:not([hidden])') || document.querySelector('.pet-map:not([hidden])');
      if (window.innerWidth <= 900 || !scanner || reduceMotion) { guide.hidden = true; return; }
      const hr = home.getBoundingClientRect();
      const av = avatar.getBoundingClientRect();
      const right = heroRight.getBoundingClientRect();
      const sc = scanner.getBoundingClientRect();
      if (!hr.height || !sc.height) { guide.hidden = true; return; }
      const top = right.bottom - hr.top + 12;
      const bottom = sc.top - hr.top - 8;
      if (bottom - top < 40) { guide.hidden = true; return; }
      guide.hidden = false;
      guide.style.left = (av.left + av.width / 2 - hr.left - 1) + 'px';
      guide.style.top = top + 'px';
      guide.style.height = (bottom - top) + 'px';
    };
    new ResizeObserver(place).observe(home);
    window.addEventListener('resize', place);
    document.addEventListener('viewchange', () => setTimeout(place, 50));
    setTimeout(place, 0);
  }

  /* ---------------- 4. avatar tilt ---------------- */
  if (avatar && finePointer && !reduceMotion) {
    hero.addEventListener('pointermove', (e) => {
      const r = avatar.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * 2)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * 2)));
      avatar.style.setProperty('--ry', (dx * 4).toFixed(2) + 'deg');
      avatar.style.setProperty('--rx', (-dy * 4).toFixed(2) + 'deg');
      // the eyes look toward the pointer
      const ex = Math.max(-1, Math.min(1, (e.clientX - cx) / 260)), ey = Math.max(-1, Math.min(1, (e.clientY - cy) / 200));
      avatar.style.setProperty('--ex', (ex * 2.4).toFixed(2) + 'px');
      avatar.style.setProperty('--ey', (ey * 1.6).toFixed(2) + 'px');
    });
    hero.addEventListener('pointerleave', () => {
      avatar.style.setProperty('--rx', '0deg');
      avatar.style.setProperty('--ry', '0deg');
      avatar.style.setProperty('--ex', '0px');
      avatar.style.setProperty('--ey', '0px');
    });
  }
})();
