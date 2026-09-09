/* ============================================================
   Contact page helpers (assets/contact.js):
   - local time in Boston, updated every half minute
   - copy-the-address button
   - the "image" station: the portrait is reconstructed from randomly
     accumulated counts, the way a PET image builds up from
     coincidences. Replays each time the page opens; click to rescan.
   ============================================================ */
(function () {
  'use strict';
  const view = document.getElementById('contact');
  if (!view) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- local time ----
  const timeEl = view.querySelector('.local-time');
  if (timeEl) {
    let fmt = null;
    try { fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }); } catch (e) { fmt = null; }
    const tick = () => { timeEl.textContent = fmt ? fmt.format(new Date()) + ' ET' : new Date().toLocaleTimeString(); };
    tick();
    setInterval(tick, 30000);
  }

  // ---- copy address ----
  view.querySelectorAll('.copy-email').forEach(btn => {
    const original = btn.textContent;
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied ✓';
      } catch (e) {
        btn.textContent = text;
      }
      setTimeout(() => { btn.textContent = original; }, 1800);
    });
  });

  // ---- the image station ----
  const canvas = view.querySelector('.recon-canvas');
  const countEl = view.querySelector('.recon-count');
  const restart = view.querySelector('.recon-restart');
  if (!canvas) return;
  const SIZE = 220, SAMPLE = 160, TOTAL = 16000, PER_FRAME = 90, SETTLE_MS = 900;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = SIZE * dpr; canvas.height = SIZE * dpr;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  // the hero's 3D figure renders a portrait for this page; the SVG avatar is the fallback
  const portrait = document.querySelector('.avatar-svg');
  if (window.PORTRAIT_URL) {
    img.src = window.PORTRAIT_URL;
  } else if (portrait) {
    document.addEventListener('portrait', (e) => { img.src = e.detail; }, { once: true });
    img.src = 'assets/portrait.jpg';
  } else {
    img.src = 'assets/avatar.jpg';
  }
  let pixels = null, ready = false, done = 0, running = false, raf = 0, visible = false;

  const prepare = () => {
    const off = document.createElement('canvas');
    off.width = SAMPLE; off.height = SAMPLE;
    const o = off.getContext('2d', { willReadFrequently: true });
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    o.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, SAMPLE, SAMPLE);
    try { pixels = o.getImageData(0, 0, SAMPLE, SAMPLE).data; } catch (e) { pixels = null; }
    ready = true;
  };
  const clear = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    done = 0;
    if (countEl) countEl.textContent = '0';
  };
  const drawWhole = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2); ctx.clip();
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, SIZE, SIZE);
    ctx.restore();
    if (countEl) countEl.textContent = String(TOTAL);
    done = TOTAL;
  };
  const addCounts = (n) => {
    const scale = SIZE / SAMPLE, r = SAMPLE / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < n && done < TOTAL; i++) {
      // uniform point inside the circle
      const a = Math.random() * Math.PI * 2, d = r * Math.sqrt(Math.random());
      const sx = Math.min(SAMPLE - 1, Math.max(0, Math.floor(r + Math.cos(a) * d)));
      const sy = Math.min(SAMPLE - 1, Math.max(0, Math.floor(r + Math.sin(a) * d)));
      const k = (sy * SAMPLE + sx) * 4;
      ctx.fillStyle = 'rgba(' + pixels[k] + ',' + pixels[k + 1] + ',' + pixels[k + 2] + ',0.75)';
      ctx.fillRect(sx * scale, sy * scale, scale + 0.6, scale + 0.6);
      done++;
    }
    if (countEl) countEl.textContent = String(done);
  };
  // once every count is in, the sharp portrait fades over the grainy estimate:
  // the reconstruction converges instead of stopping noisy
  let settleStart = 0;
  const settle = (now) => {
    if (!running) return;
    if (!settleStart) settleStart = now;
    const t = Math.min(1, (now - settleStart) / SETTLE_MS);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.globalAlpha = t * t;
    ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2); ctx.clip();
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, SIZE, SIZE);
    ctx.restore();
    if (t < 1) { raf = requestAnimationFrame(settle); return; }
    running = false;
  };
  const frame = () => {
    if (!running) return;
    addCounts(PER_FRAME);
    if (done >= TOTAL) { settleStart = 0; raf = requestAnimationFrame(settle); return; }
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!ready) return;
    if (!pixels || reduceMotion) { drawWhole(); return; }
    clear();
    running = true;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  img.addEventListener('load', () => { prepare(); if (visible) start(); });
  img.addEventListener('error', () => { ready = false; });
  new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
    if (visible && ready && done === 0) start();
    if (!visible) stop();
  }, { threshold: 0.3 }).observe(canvas);
  document.addEventListener('viewchange', (e) => { if (e.detail.id === 'contact') { stop(); done = 0; } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible && !running && done > 0) { if (done >= TOTAL) drawWhole(); else { running = true; raf = requestAnimationFrame(frame); } } });
  if (restart) restart.addEventListener('click', start);
  canvas.addEventListener('click', start);
})();
