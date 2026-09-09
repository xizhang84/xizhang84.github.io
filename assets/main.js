(function () {
  'use strict';

  // ===== 1. Views (hash router) + sticky header tint =====
  // The landing view is the hero + 3D scanner. Research, Publications, CV
  // and Contact are separate views, opened by clicking a part of the
  // scanner (or a nav link); #research etc. still deep-link.
  const header = document.getElementById('site-header');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const mapLinks = () => Array.from(document.querySelectorAll('.pet-map a[data-section]'));
  const views = Array.from(document.querySelectorAll('.view'));
  const VIEW_IDS = views.map(v => v.id);
  const BASE_TITLE = document.title;
  let currentView = null;

  const setActiveNav = (id) => {
    navLinks.concat(mapLinks()).forEach(link => {
      link.classList.toggle('active', link.dataset.section === id);
    });
  };

  const showView = (id) => {
    if (id === currentView) return false;
    views.forEach(v => { v.hidden = v.id !== id; });
    const el = document.getElementById(id);
    el.classList.remove('view-enter');
    void el.offsetWidth;            // restart the entrance animation
    el.classList.add('view-enter');
    currentView = id;
    document.title = (id === 'home' ? '' : el.dataset.title + ' — ') + BASE_TITLE;
    setActiveNav(id);
    return true;
  };

  const route = () => {
    const hash = location.hash.replace('#', '');
    if (hash === 'map') {
      showView('home');
      document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const id = VIEW_IDS.includes(hash) ? hash : 'home';
    const changed = showView(id);
    if (changed || id === 'home') window.scrollTo({ top: 0, behavior: changed ? 'instant' : 'smooth' });
  };
  window.addEventListener('hashchange', route);
  route();

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // ===== 2. Mobile nav toggle =====
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('nav-list');
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  // ===== 2b. Light / dark theme toggle =====
  const root = document.documentElement;
  const themeBtn = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector("meta[name=theme-color]");
  const THEME_COLORS = { light: "#FFFBF1", dark: "#16120F" };

  const applyTheme = (theme, animate) => {
    if (animate) {
      root.classList.add("theme-transition");
      setTimeout(() => root.classList.remove("theme-transition"), 400);
    }
    root.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", THEME_COLORS[theme]);
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  };

  applyTheme(root.getAttribute("data-theme") || "dark", false);

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
      applyTheme(next, true);
    });
  }

  // ===== 2c. Scanner fallback =====
  // If the 3D scanner never becomes ready (no WebGL, CDN blocked), show the flat map.
  const sceneEl = document.querySelector('.pet-scene');
  const flatMap = document.querySelector('.pet-map');
  if (sceneEl && flatMap) {
    setTimeout(() => {
      if (!sceneEl.classList.contains('ready')) { sceneEl.hidden = true; flatMap.hidden = false; }
    }, 8000);
  }

  // ===== 3. Entrance animations =====
  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        animateObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  // siblings inside a grid reveal one after another
  document.querySelectorAll('.pet-map-stations, .research-grid, .contact-grid, .cv-grid, .skills-grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      const el = child.matches('[data-animate]') ? child : child.querySelector('[data-animate]');
      if (!el) return;
      el.style.transitionDelay = (i * 90) + 'ms';
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    });
  });
  document.querySelectorAll('[data-animate]').forEach(el => animateObserver.observe(el));

  // ===== 3b. Card tilt (pointer devices only) =====
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (finePointer && !reduceMotion) {
    const MAX_TILT = 5; // degrees
    document.querySelectorAll('.research-card, .contact-card').forEach(card => {
      card.classList.add('tilt');
      card.addEventListener('pointerenter', () => card.classList.add('is-tilting'));
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * MAX_TILT * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * MAX_TILT * 2).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ===== 4. Footer year =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== 5. Publications renderer =====
  const pubList = document.getElementById('pub-list');
  const statTotal = document.getElementById('stat-total');
  const statFirst = document.getElementById('stat-first');
  const pubs = window.PUBLICATIONS || [];

  const totalCount = pubs.length;
  const firstCount = pubs.filter(p => p.firstAuthor || p.coFirst).length;
  if (statTotal) statTotal.textContent = String(totalCount);
  if (statFirst) statFirst.textContent = String(firstCount);

  // count the numbers up when the stats bar scrolls into view
  const statsBar = document.querySelector(".pub-stats");
  if (statsBar && statTotal && statFirst && !reduceMotion) {
    const countUp = (el, target, duration) => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    // numbers stay at their real values until the bar is in view,
    // then drop to 0 and count up (so nothing is lost if IO never fires)
    const statsObserver = new IntersectionObserver((entries) => {
      if (!entries.some(en => en.isIntersecting)) return;
      countUp(statTotal, totalCount, 1100);
      countUp(statFirst, firstCount, 900);
      statsObserver.disconnect();
    }, { threshold: 0.5 });
    statsObserver.observe(statsBar);
  }

  if (pubList && pubs.length) {
    const byYear = {};
    pubs.forEach(p => { (byYear[p.year] = byYear[p.year] || []).push(p); });
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    const frag = document.createDocumentFragment();
    years.forEach(year => {
      const heading = document.createElement('li');
      heading.className = 'pub-year';
      heading.textContent = year;
      frag.appendChild(heading);

      byYear[year].forEach(p => {
        const li = document.createElement('li');
        li.className = 'pub-item'
          + (p.firstAuthor ? ' first-author' : '')
          + (p.coFirst ? ' co-first' : '');

        const title = document.createElement('div');
        title.className = 'pub-title';
        const a = document.createElement('a');
        a.href = p.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = p.title;
        title.appendChild(a);

        const authors = document.createElement('div');
        authors.className = 'pub-authors';
        authors.innerHTML = escapeHtml(p.authors).replace(/(Zhang X\*?)/g, '<span class="me">$1</span>');

        const meta = document.createElement('div');
        meta.className = 'pub-meta';
        const venue = document.createElement('span');
        venue.textContent = p.venue + ' · ' + p.year + ' · ';
        const doiLink = document.createElement('a');
        doiLink.href = p.url;
        doiLink.target = '_blank';
        doiLink.rel = 'noopener';
        doiLink.textContent = 'DOI ↗';
        meta.appendChild(venue);
        meta.appendChild(doiLink);
        if (p.coFirst) {
          const note = document.createElement('span');
          note.className = 'pub-cofirst-note';
          note.textContent = '(CO-FIRST AUTHOR)';
          meta.appendChild(note);
        }

        li.appendChild(title);
        li.appendChild(authors);
        li.appendChild(meta);
        frag.appendChild(li);
      });
    });
    pubList.appendChild(frag);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }
})();
