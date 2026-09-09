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
    document.dispatchEvent(new CustomEvent('viewchange', { detail: { id } }));
    return true;
  };

  // Views cross-fade through the View Transitions API where the browser has it.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canTransition = typeof document.startViewTransition === 'function' && !prefersReducedMotion;
  if (canTransition) document.documentElement.classList.add('has-vt');
  const route = () => {
    const hash = location.hash.replace('#', '');
    if (hash === 'map') {
      showView('home');
      document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const id = VIEW_IDS.includes(hash) ? hash : 'home';
    const apply = () => {
      const changed = showView(id);
      if (changed || id === 'home') window.scrollTo({ top: 0, behavior: changed ? 'instant' : 'smooth' });
    };
    if (canTransition && currentView && id !== currentView) {
      // Shared element: the scanner (home) and the station thumbnail (sections)
      // carry the same view-transition-name, so the close-up the camera flew to
      // shrinks into the section header, and grows back when the visitor returns.
      const oldEl = sharedEl(currentView), newEl = sharedEl(id);
      if (oldEl) oldEl.style.viewTransitionName = 'scanner';
      const vt = document.startViewTransition(() => {
        if (oldEl) oldEl.style.viewTransitionName = '';
        apply();
        if (newEl) newEl.style.viewTransitionName = 'scanner';
      });
      vt.finished.finally(() => { if (newEl) newEl.style.viewTransitionName = ''; });
    } else apply();
  };
  function sharedEl(viewId) {
    if (viewId === 'home') return document.querySelector('.pet-scene.ready:not([hidden])');
    return document.querySelector('#' + viewId + ' .station-thumb-link');
  }
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

  // ===== 2c. Station cards: every section shows its place in the PET event =====
  // The thumbnail is rendered by pet-scene.js (the same camera pose the click
  // flight ends on) and arrives through the 'scenethumbs' event; until then an
  // inline mark stands in.
  const STATIONS = [
    { id: 'home', n: '01', stage: 'Subject', title: 'Home' },
    { id: 'research', n: '02', stage: 'Annihilation', title: 'Research' },
    { id: 'publications', n: '03', stage: 'Detector', title: 'Publications' },
    { id: 'cv', n: '04', stage: 'Readout', title: 'CV' },
    { id: 'contact', n: '05', stage: 'Image', title: 'Contact' }
  ];
  const MARK_SVG = '<svg class="station-thumb-fallback" viewBox="0 0 32 32" aria-hidden="true"><circle class="bm-ring" cx="16" cy="16" r="12.5"/><path class="bm-hit" d="M23.87 6.93 A12.5 12.5 0 0 1 26.2 9.6"/><path class="bm-hit" d="M8.13 25.07 A12.5 12.5 0 0 1 5.8 22.4"/><line class="bm-lor" x1="24.5" y1="7.5" x2="7.5" y2="24.5"/><circle class="bm-core" cx="16" cy="16" r="2.1"/></svg>';
  document.querySelectorAll('.station-card[data-station]').forEach(card => {
    const me = card.dataset.station;
    const s = STATIONS.find(x => x.id === me);
    if (!s) return;
    card.innerHTML =
      '<a href="#home" class="station-thumb-link" aria-label="Back to the scanner, station ' + s.n + ' ' + s.stage + '">'
      + '<img class="station-thumb" alt="" hidden />' + MARK_SVG
      + '<span class="station-thumb-cap"><span>' + s.n + ' · ' + s.stage + '</span><strong>← Back to the scanner</strong></span></a>'
      + '<ol class="chain-nav" aria-label="Sections as the stages of one PET event">'
      + STATIONS.map(t => '<li' + (t.id === me ? ' class="is-current"' : '') + '><a href="#' + t.id + '" data-section="' + t.id + '" title="' + t.title + '" aria-label="' + t.n + ' ' + t.stage + ': ' + t.title + '"><i>' + t.n + '</i><span>' + t.stage + '</span></a></li>').join('')
      + '</ol>';
  });
  document.addEventListener('scenethumbs', (e) => {
    const thumbs = e.detail || {};
    document.querySelectorAll('.station-card[data-station]').forEach(card => {
      const src = thumbs[card.dataset.station];
      const img = card.querySelector('.station-thumb');
      if (!src || !img) return;
      img.src = src;
      img.hidden = false;
      card.classList.add('has-thumb');
    });
  });

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

  // ===== 5. Publications: list, filters, per-year spectrum, BibTeX =====
  const pubList = document.getElementById('pub-list');
  const statTotal = document.getElementById('stat-total');
  const statFirst = document.getElementById('stat-first');
  const pubs = window.PUBLICATIONS || [];
  const isConference = (p) => /NSS\/MIC|NSS-MIC|conference|symposium|proceedings|workshop/i.test(p.venue || '');
  const isFirst = (p) => !!(p.firstAuthor || p.coFirst);

  const totalCount = pubs.length;
  const firstCount = pubs.filter(isFirst).length;
  if (statTotal) statTotal.textContent = String(totalCount);
  if (statFirst) statFirst.textContent = String(firstCount);

  // "synced from Google Scholar" note, written by scripts/update-publications.mjs
  const statsBarEl = document.querySelector(".pub-stats");
  if (statsBarEl && window.PUBLICATIONS_UPDATED) {
    const note = document.createElement("span");
    note.className = "stat-sync";
    note.textContent = "Synced from Google Scholar · " + window.PUBLICATIONS_UPDATED;
    statsBarEl.appendChild(note);
  }

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

  // ---- list ----
  const pubItems = [];      // { el, p }
  const yearHeads = {};     // year -> heading <li>
  if (pubList && pubs.length) {
    const byYear = {};
    pubs.forEach(p => { (byYear[p.year] = byYear[p.year] || []).push(p); });
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    const frag = document.createDocumentFragment();
    years.forEach(year => {
      const heading = document.createElement('li');
      heading.className = 'pub-year';
      heading.id = 'year-' + year;
      heading.textContent = year;
      yearHeads[year] = heading;
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
        doiLink.textContent = p.doi ? 'DOI ↗' : 'Scholar ↗';
        meta.appendChild(venue);
        meta.appendChild(doiLink);
        const bib = document.createElement('button');
        bib.type = 'button';
        bib.className = 'pub-bib';
        bib.textContent = 'BibTeX';
        bib.setAttribute('aria-label', 'BibTeX for ' + p.title);
        bib.addEventListener('click', () => openBib(p));
        meta.appendChild(bib);
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
        pubItems.push({ el: li, p });
      });
    });
    pubList.appendChild(frag);
  }

  // ---- per-year spectrum: one bar per year, first-author share in terracotta ----
  const spectrum = document.querySelector('.pub-spectrum');
  const specCols = {};
  if (spectrum && pubs.length) {
    const ys = pubs.map(p => p.year);
    const y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    for (let y = y0; y <= y1; y++) {
      const col = document.createElement('button');
      col.type = 'button';
      col.className = 'spec-col';
      col.innerHTML = '<span class="spec-count"></span><span class="spec-bar"><span class="spec-first"></span></span><span class="spec-year">' + y + '</span>';
      col.addEventListener('click', () => {
        const head = yearHeads[y];
        if (head && !head.hidden) head.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
      spectrum.appendChild(col);
      specCols[y] = col;
    }
    const legend = document.createElement('span');
    legend.className = 'spec-legend';
    legend.innerHTML = '<span><i class="l-all"></i>papers / year</span><span><i class="l-first"></i>first author</span>';
    spectrum.parentNode.appendChild(legend);
  }
  const renderSpectrum = (test, fromZero) => {
    if (!spectrum) return;
    const n = {}, f = {};
    pubs.forEach(p => { if (!test(p)) return; n[p.year] = (n[p.year] || 0) + 1; if (isFirst(p)) f[p.year] = (f[p.year] || 0) + 1; });
    const max = Math.max(1, ...Object.values(n));
    const paint = () => Object.keys(specCols).forEach(y => {
      const col = specCols[y], c = n[y] || 0;
      col.style.setProperty('--h', String(c / max));
      col.style.setProperty('--f', String(c ? (f[y] || 0) / c : 0));
      col.querySelector('.spec-count').textContent = c ? String(c) : '';
      col.setAttribute('aria-label', y + ': ' + c + (c === 1 ? ' paper' : ' papers') + ((f[y] || 0) ? ', ' + f[y] + ' first-author' : ''));
      col.classList.toggle('is-empty', !c);
    });
    if (fromZero && !reduceMotion) {
      Object.values(specCols).forEach(col => { col.style.setProperty('--h', '0'); col.style.setProperty('--f', '0'); });
      requestAnimationFrame(() => requestAnimationFrame(paint));
    } else paint();
  };

  // ---- filters ----
  const FILTERS = { all: () => true, first: isFirst, journal: p => !isConference(p), conference: isConference };
  let activeFilter = 'all';
  const chips = Array.from(document.querySelectorAll('.pub-filters .chip'));
  let emptyNote = null;
  const applyFilter = (fromZero) => {
    const test = FILTERS[activeFilter] || FILTERS.all;
    const perYear = {};
    let shown = 0;
    pubItems.forEach(({ el, p }) => {
      const show = test(p);
      el.hidden = !show;
      if (show) { perYear[p.year] = (perYear[p.year] || 0) + 1; shown++; }
    });
    Object.keys(yearHeads).forEach(y => { yearHeads[y].hidden = !perYear[y]; });
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.filter === activeFilter));
    if (pubList) {
      if (!shown && !emptyNote) { emptyNote = document.createElement('li'); emptyNote.className = 'pub-empty'; emptyNote.textContent = 'Nothing in this category yet.'; pubList.appendChild(emptyNote); }
      if (shown && emptyNote) { emptyNote.remove(); emptyNote = null; }
    }
    renderSpectrum(test, fromZero);
  };
  chips.forEach(c => c.addEventListener('click', () => { activeFilter = c.dataset.filter; applyFilter(false); }));
  applyFilter(false);
  // replay the bars growing whenever the Publications view opens
  document.addEventListener('viewchange', (e) => { if (e.detail.id === 'publications') renderSpectrum(FILTERS[activeFilter] || FILTERS.all, true); });

  // ---- BibTeX: Crossref's record when the DOI resolves, otherwise built from the site data ----
  const bibModal = document.querySelector('.bib-modal');
  const bibText = bibModal && bibModal.querySelector('.bib-text');
  const bibStatus = bibModal && bibModal.querySelector('.bib-status');
  const bibSource = bibModal && bibModal.querySelector('.bib-source');
  const bibCopy = bibModal && bibModal.querySelector('.bib-copy');
  const bibClose = bibModal && bibModal.querySelector('.bib-close');
  let bibToken = 0, bibReturnFocus = null;

  const bibAuthors = (str) => str.split(/,\s*/).map(a => a.trim()).filter(Boolean).map(a => {
    if (/^et al\.?$/i.test(a)) return 'others';
    const t = a.replace(/\*/g, '').split(/\s+/);
    return t.length > 1 ? t[0] + ', ' + t.slice(1).join(' ') : t[0];
  }).join(' and ');
  const bibKey = (p) => {
    const last = ((p.authors.split(',')[0] || 'Zhang').trim().split(/\s+/)[0] || 'Zhang').toLowerCase().replace(/[^a-z]/g, '');
    const word = ((p.title.match(/[A-Za-z]{4,}/g) || ['paper'])[0]).toLowerCase();
    return last + p.year + word;
  };
  const localBib = (p) => {
    const conf = isConference(p);
    const lines = [
      '@' + (conf ? 'inproceedings' : 'article') + '{' + bibKey(p) + ',',
      '  title = {' + p.title + '},',
      '  author = {' + bibAuthors(p.authors) + '},',
      '  ' + (conf ? 'booktitle' : 'journal') + ' = {' + p.venue + '},',
      '  year = {' + p.year + '}' + (p.doi || p.url ? ',' : '')
    ];
    if (p.doi) lines.push('  doi = {' + p.doi + '}');
    else if (p.url) lines.push('  url = {' + p.url + '}');
    lines.push('}');
    return lines.join('\n') + '\n';
  };
  const prettyBib = (t) => t.trim()
    .replace(/,\s+(?=[A-Za-z_-]+\s*=)/g, ',\n  ')
    .replace(/\s*\}\s*$/, '\n}\n')
    .replace(/=\{/g, ' = {');

  const closeBib = () => {
    if (!bibModal || bibModal.hidden) return;
    bibModal.hidden = true;
    document.body.classList.remove('modal-open');
    bibToken++;
    if (bibReturnFocus) { bibReturnFocus.focus(); bibReturnFocus = null; }
  };
  async function openBib(p) {
    if (!bibModal) return;
    const token = ++bibToken;
    bibReturnFocus = document.activeElement;
    bibText.value = localBib(p);
    bibStatus.textContent = '';
    bibSource.textContent = p.doi ? 'Fetching the publisher record from Crossref…' : 'Built from the site data (no DOI on record)';
    bibModal.hidden = false;
    document.body.classList.add('modal-open');
    bibCopy.focus();
    if (!p.doi) return;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch('https://api.crossref.org/works/' + encodeURIComponent(p.doi) + '/transform/application/x-bibtex', { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const txt = await res.text();
      if (token !== bibToken) return;
      if (!/^\s*@\w+\s*\{/.test(txt)) throw new Error('not bibtex');
      bibText.value = prettyBib(txt);
      bibSource.textContent = 'Publisher record via Crossref · doi:' + p.doi;
    } catch (err) {
      if (token === bibToken) bibSource.textContent = 'Crossref unavailable, built from the site data · doi:' + p.doi;
    }
  }
  if (bibModal) {
    bibCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(bibText.value);
        bibStatus.textContent = 'Copied ✓';
      } catch (err) {
        bibText.focus(); bibText.select();
        bibStatus.textContent = 'Selected, press Ctrl/Cmd+C';
      }
      setTimeout(() => { if (!bibModal.hidden) bibStatus.textContent = ''; }, 2200);
    });
    bibClose.addEventListener('click', closeBib);
    bibModal.addEventListener('click', (e) => { if (e.target === bibModal) closeBib(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBib(); });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }
})();
