# Personal Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page dark-themed academic website for Xi Zhang (Postdoc, MGH/HMS) deployable as `xizhang84.github.io` via GitHub Pages.

**Architecture:** Static site with one `index.html`, one `styles.css`, one `main.js`, and a `data/publications.js` data module. No build pipeline, no framework. Sections are anchored `<section>` blocks within a single page. JavaScript handles smooth scroll, scroll-spy nav highlight, IntersectionObserver-driven entrance animations, mobile hamburger, and Publications rendering from the data module.

**Tech Stack:** Plain HTML5, CSS3 (custom properties, grid, flexbox, `backdrop-filter`), vanilla ES2020 JavaScript, Google Fonts (Inter, Space Grotesk, JetBrains Mono), inline SVG icons. Deploys to GitHub Pages with `.nojekyll`.

**Verification approach:** Manual browser checks (open `index.html` directly with `file://` protocol) since this is a static site with no logic to unit-test. Spot-check links, responsive layout, and animations.

---

## File Structure

```
Personal Website/
├── index.html                    # Single page, all 5 sections (NEW)
├── assets/
│   ├── styles.css                # All styles (NEW)
│   ├── main.js                   # Navigation + animations + publications render (NEW)
│   ├── profile.jpg               # Headshot, downloaded from Sabet Lab (NEW)
│   ├── CV-XiZhang.pdf            # Copied from Personal Doc/CV-XiZhang_02182026.pdf (NEW)
│   └── favicon.svg               # Simple geometric icon (NEW)
├── data/
│   └── publications.js           # window.PUBLICATIONS array, 30 entries (NEW)
├── README.md                     # Deployment instructions (NEW)
└── .nojekyll                     # Skip Jekyll on GitHub Pages (NEW)
```

**Files to delete** (research artifacts from brainstorming phase):
- `bundle.js`, `sabet_raw.html`, `read_cv.py` — temp scratch files

---

## Task 1: Project setup and asset collection

**Files:**
- Create: `assets/` and `data/` directories
- Create: `assets/profile.jpg` (download)
- Create: `assets/CV-XiZhang.pdf` (copy)
- Create: `.nojekyll` (empty marker file)
- Delete: `bundle.js`, `sabet_raw.html`, `read_cv.py`

- [ ] **Step 1: Create directories**

Run (PowerShell):
```powershell
New-Item -ItemType Directory -Force -Path "assets","data" | Out-Null
```

- [ ] **Step 2: Copy CV PDF**

Run (PowerShell):
```powershell
Copy-Item "..\Personal Doc\CV-XiZhang_02182026.pdf" "assets\CV-XiZhang.pdf"
```

Verify: `Test-Path assets\CV-XiZhang.pdf` returns `True`.

- [ ] **Step 3: Download headshot from Sabet Lab**

Run (PowerShell):
```powershell
Invoke-WebRequest -Uri "https://sabetlab.mgh.harvard.edu/pictures/xi-zhang.jpg" -OutFile "assets\profile.jpg"
```

Verify: `Get-Item assets\profile.jpg | Select-Object Length` shows non-zero size.

- [ ] **Step 4: Create `.nojekyll` marker**

Create empty file `.nojekyll` at project root (so GitHub Pages serves files literally, including paths starting with underscore if any).

Run (PowerShell):
```powershell
New-Item -ItemType File -Path ".nojekyll" -Force | Out-Null
```

- [ ] **Step 5: Create `assets/favicon.svg`**

Write `assets/favicon.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ea8ff"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="#0a0e1a"/>
  <circle cx="16" cy="16" r="9" fill="none" stroke="url(#g)" stroke-width="2"/>
  <circle cx="16" cy="16" r="3" fill="url(#g)"/>
</svg>
```

- [ ] **Step 6: Delete research scratch files**

Run (PowerShell):
```powershell
Remove-Item -Force bundle.js, sabet_raw.html, read_cv.py -ErrorAction SilentlyContinue
```

- [ ] **Step 7: Commit**

```powershell
git init
git add .
git commit -m "chore: scaffold project structure and copy assets"
```

(If user prefers to defer `git init` until ready to push, skip the commit step and just note that the assets are in place.)

---

## Task 2: Publications data module

**Files:**
- Create: `data/publications.js`

- [ ] **Step 1: Write the data file**

Create `data/publications.js` exporting `window.PUBLICATIONS` as an array of 30 objects. Each object has shape:

```js
{
  year: 2025,
  authors: "Zhang X, ...",   // exact author string from CV
  title: "...",
  venue: "Med Phys",          // short venue label
  doi: "10.1002/mp.17665",
  url: "https://doi.org/10.1002/mp.17665",
  firstAuthor: true,          // true if "Zhang X" is first author
  coFirst: false              // true ONLY for the Xie S* / Zhang X* paper
}
```

**Full list** (extracted from CV, verified count = 30, first-author = 11, co-first = 1):

```js
window.PUBLICATIONS = [
  // 2025
  { year: 2025, authors: "Zhang X, Sitek A, Blackberg L, Kupinski M, Furenlid L, Sabet H", title: "Development and Performance Evaluation of a Laser Processed CsI:Tl Detector with Converging Pixels", venue: "IEEE NSS/MIC/RTSD", doi: "10.1109/NSS/MIC/RTSD57106.2025.11286546", url: "https://doi.org/10.1109/NSS/MIC/RTSD57106.2025.11286546", firstAuthor: true, coFirst: false },
  { year: 2025, authors: "Zhang X, Feng Y, Ottensmeyer MP, Sabet H", title: "Modular and Robust PET Platform for Evaluating Detector Configurations", venue: "IEEE NSS/MIC/RTSD", doi: "10.1109/NSS/MIC/RTSD57106.2025.11287227", url: "https://doi.org/10.1109/NSS/MIC/RTSD57106.2025.11287227", firstAuthor: true, coFirst: false },
  { year: 2025, authors: "Hashemi A, Zhang X, Kouame D, Sabet H", title: "Enhancing Detector Event Positioning Data Using L1 Regularization", venue: "IEEE NSS/MIC/RTSD", doi: "10.1109/NSS/MIC/RTSD57106.2025.11287406", url: "https://doi.org/10.1109/NSS/MIC/RTSD57106.2025.11287406", firstAuthor: false, coFirst: false },
  { year: 2025, authors: "Zhang X, Yu X, Cheng H, et al.", title: "Enhancing gamma-ray detection: Processing grooved microstructures on LYSO crystal with femtosecond laser", venue: "Med Phys", doi: "10.1002/mp.17665", url: "https://doi.org/10.1002/mp.17665", firstAuthor: true, coFirst: false },
  { year: 2025, authors: "Yu X, Zhang X, Zeng J, et al.", title: "Depth of Interaction in PET Detector Design: Performance Optimization With Light-Sharing Window", venue: "IEEE Trans Instrum Meas", doi: "10.1109/TIM.2024.3522335", url: "https://doi.org/10.1109/TIM.2024.3522335", firstAuthor: false, coFirst: false },
  // 2024
  { year: 2024, authors: "Cheng H, Bai L, Zhang X, et al.", title: "68Ga labeled Olmutinib: Design, synthesis, and evaluation of a novel PET EGFR probe", venue: "Bioorganic Chem", doi: "10.1016/j.bioorg.2024.107987", url: "https://doi.org/10.1016/j.bioorg.2024.107987", firstAuthor: false, coFirst: false },
  { year: 2024, authors: "Cheng H, Liu R, Fang S, Li Z, Zhang D, Zhang X, et al.", title: "Synthesis of easily-modified and useful dibenzo-[b,d]azepines by palladium(ii)-catalyzed cyclization/addition with a green solvent", venue: "Chem Commun", doi: "10.1039/D3CC06321F", url: "https://doi.org/10.1039/D3CC06321F", firstAuthor: false, coFirst: false },
  // 2023
  { year: 2023, authors: "Zhang X, Yu X, Zhang H, et al.", title: "Development and Evaluation of 0.35-mm-Pitch PET Detectors With Different Reflector Arrangements", venue: "IEEE Trans Radiat Plasma Med Sci", doi: "10.1109/TRPMS.2023.3307128", url: "https://doi.org/10.1109/TRPMS.2023.3307128", firstAuthor: true, coFirst: false },
  // 2022
  { year: 2022, authors: "Yu X, Zhang X, Zhang H, et al.", title: "Requirements of Scintillation Crystals with the Development of PET Scanners", venue: "Crystals", doi: "10.3390/cryst12091302", url: "https://doi.org/10.3390/cryst12091302", firstAuthor: false, coFirst: false },
  { year: 2022, authors: "Zhang X, Yu X, Zhu Z, et al.", title: "Development and Evaluation of a Dual-Layer-Offset PET Detector Constructed with Different Reflectors", venue: "Crystals", doi: "10.3390/cryst12010093", url: "https://doi.org/10.3390/cryst12010093", firstAuthor: true, coFirst: false },
  // 2021
  { year: 2021, authors: "Xie S, Zhu Z, Zhang X, et al.", title: "Optical Simulation and Experimental Assessment with Time-Walk Correction of TOF-PET Detectors with Multi-Ended Readouts", venue: "Sensors", doi: "10.3390/s21144681", url: "https://doi.org/10.3390/s21144681", firstAuthor: false, coFirst: false },
  { year: 2021, authors: "Zhang X, Yu H, Xie Q, et al.", title: "Design study of a PET detector with 0.5 mm crystal pitch for high-resolution preclinical imaging", venue: "Phys Med Biol", doi: "10.1088/1361-6560/ac0b82", url: "https://doi.org/10.1088/1361-6560/ac0b82", firstAuthor: true, coFirst: false },
  { year: 2021, authors: "Zhang X, Xie Q, Xie S, Yu X, Xu J, Peng Q", title: "A Novel Portable Gamma Radiation Sensor Based on a Monolithic Lutetium-Yttrium Oxyorthosilicate Ring", venue: "Sensors", doi: "10.3390/s21103376", url: "https://doi.org/10.3390/s21103376", firstAuthor: true, coFirst: false },
  { year: 2021, authors: "Zhang X, Ye B, Yu H, et al.", title: "Depth of Interaction Measurements Based on Rectangular Light Sharing Window Technology and Nine-Crystals-to-One-SiPM Coupling Method", venue: "IEEE Trans Radiat Plasma Med Sci", doi: "10.1109/TRPMS.2020.3038214", url: "https://doi.org/10.1109/TRPMS.2020.3038214", firstAuthor: true, coFirst: false },
  // 2020
  { year: 2020, authors: "Zhang X, Ye B, Xie S, et al.", title: "Preliminary Optimized Design of a High-resolution PET Detector with a 0.5 mm Crystal Size", venue: "IEEE NSS/MIC", doi: "10.1109/NSS/MIC42677.2020.9507797", url: "https://doi.org/10.1109/NSS/MIC42677.2020.9507797", firstAuthor: true, coFirst: false },
  { year: 2020, authors: "Yang J, Xie Q, Xie Y, Zhang X, et al.", title: "A Simulation Study on Two Readout Methods of a Monolithic Scintillator Ring PET", venue: "IEEE NSS/MIC", doi: "10.1109/NSS/MIC42677.2020.9508071", url: "https://doi.org/10.1109/NSS/MIC42677.2020.9508071", firstAuthor: false, coFirst: false },
  { year: 2020, authors: "Xie Q, Zhang X, Xie Y, Xie S, Peng Q, Xu J", title: "A Novel Portable Radiation Detector Based on Monolithic LYSO Ring: A Simulation Study", venue: "IEEE NSS/MIC", doi: "10.1109/NSS/MIC42677.2020.9507999", url: "https://doi.org/10.1109/NSS/MIC42677.2020.9507999", firstAuthor: false, coFirst: false },
  { year: 2020, authors: "Jiao W, Zhang X, Xie S, Ying G, Xu J, Peng Q", title: "A Novel Method for Processing Photonic Crystals: Femtosecond Laser", venue: "IEEE NSS/MIC", doi: "10.1109/NSS/MIC42677.2020.9507800", url: "https://doi.org/10.1109/NSS/MIC42677.2020.9507800", firstAuthor: false, coFirst: false },
  { year: 2020, authors: "Xie S, Zhang X, Zhang Y, et al.", title: "Evaluation of Various Scintillator Materials in Radiation Detector Design for Positron Emission Tomography (PET)", venue: "Crystals", doi: "10.3390/cryst10100869", url: "https://doi.org/10.3390/cryst10100869", firstAuthor: false, coFirst: false },
  { year: 2020, authors: "Xie S, Zhang X, Huang Q, Gong Z, Xu J, Peng Q", title: "Methods to Compensate the Time Walk Errors in Timing Measurements for PET Detectors", venue: "IEEE Trans Radiat Plasma Med Sci", doi: "10.1109/TRPMS.2020.2981388", url: "https://doi.org/10.1109/TRPMS.2020.2981388", firstAuthor: false, coFirst: false },
  { year: 2020, authors: "Song Z, Zhao Z, Yu H, Yang J, Zhang X, et al.", title: "An 8.8 ps RMS Resolution Time-To-Digital Converter Implemented in a 60 nm FPGA with Real-Time Temperature Correction", venue: "Sensors", doi: "10.3390/s20082172", url: "https://doi.org/10.3390/s20082172", firstAuthor: false, coFirst: false },
  // 2019
  { year: 2019, authors: "Zhang X, Ye B, Xie S, et al.", title: "A Novel Preclinical PET Scanner Constructed with Stacks of Sliced Monolithic Scintillator Rings", venue: "IEEE NSS/MIC", doi: "10.1109/NSS/MIC42101.2019.9059816", url: "https://doi.org/10.1109/NSS/MIC42101.2019.9059816", firstAuthor: true, coFirst: false },
  { year: 2019, authors: "Xie Q, Ye B, Xie S, Zhang X, Xu J, Peng Q", title: "Design, fabrication and evaluation of anti-reflection films coated on LYSO scintillators", venue: "IEEE NSS/MIC", doi: "10.1109/NSS/MIC42101.2019.9059696", url: "https://doi.org/10.1109/NSS/MIC42101.2019.9059696", firstAuthor: false, coFirst: false },
  { year: 2019, authors: "Zhao Z, Xie S, Zhang X, et al.", title: "An Advanced 100-Channel Readout System for Nuclear Imaging", venue: "IEEE Trans Instrum Meas", doi: "10.1109/TIM.2018.2877952", url: "https://doi.org/10.1109/TIM.2018.2877952", firstAuthor: false, coFirst: false },
  { year: 2019, authors: "Xie S, Xu J, Yang M, Ying G, Zhang X, et al.", title: "Methods to Improve Light Transport Efficiency in LYSO Crystals Based on Characteristics of Optical Reflectance", venue: "IEEE Trans Nucl Sci", doi: "10.1109/TNS.2019.2931929", url: "https://doi.org/10.1109/TNS.2019.2931929", firstAuthor: false, coFirst: false },
  { year: 2019, authors: "Xu J, Xie S, Zhang X, et al.", title: "A preclinical PET detector constructed with a monolithic scintillator ring", venue: "Phys Med Biol", doi: "10.1088/1361-6560/ab2ca4", url: "https://doi.org/10.1088/1361-6560/ab2ca4", firstAuthor: false, coFirst: false },
  { year: 2019, authors: "Xie S*, Zhang X*, Peng H, et al.", title: "PET detectors with 127 ps CTR for the Tachyon-II time-of-flight PET scanner", venue: "Nucl Instrum Methods A", doi: "10.1016/j.nima.2019.03.083", url: "https://doi.org/10.1016/j.nima.2019.03.083", firstAuthor: false, coFirst: true },
  { year: 2019, authors: "Zhang X, Xie S, Yang J, et al.", title: "A depth encoding PET detector using four-crystals-to-one-SiPM coupling and light-sharing window method", venue: "Med Phys", doi: "10.1002/mp.13603", url: "https://doi.org/10.1002/mp.13603", firstAuthor: true, coFirst: false },
  // 2018
  { year: 2018, authors: "Ye B, Zhang X, Xie Y, et al.", title: "Experimental studies of the decoding performances of a semi-monolithic scintillator detector", venue: "IEEE NSS/MIC", doi: "10.1109/NSSMIC.2018.8824487", url: "https://doi.org/10.1109/NSSMIC.2018.8824487", firstAuthor: false, coFirst: false },
  { year: 2018, authors: "Yang J, Xie Y, Xie S, Zhang X, et al.", title: "Experimental studies of the performance of different methods in the inter-crystal Compton scatter correction on one-to-one coupled PET detectors", venue: "IEEE NSS/MIC", doi: "10.1109/NSSMIC.2018.8824396", url: "https://doi.org/10.1109/NSSMIC.2018.8824396", firstAuthor: false, coFirst: false },
];
```

- [ ] **Step 2: Verify entry count**

Open `data/publications.js` in a browser console (or run a quick Node check) and confirm `window.PUBLICATIONS.length === 30`.

Run (PowerShell):
```powershell
node -e "global.window={}; require('./data/publications.js'); console.log('Count:', window.PUBLICATIONS.length); console.log('First-author:', window.PUBLICATIONS.filter(p=>p.firstAuthor).length); console.log('Co-first:', window.PUBLICATIONS.filter(p=>p.coFirst).length);"
```

Expected output:
```
Count: 30
First-author: 11
Co-first: 1
```

If Node isn't installed, defer this check until index.html is wired up and verify in the browser console.

- [ ] **Step 3: Commit**

```powershell
git add data/publications.js
git commit -m "data: add 30 publications extracted from CV"
```

---

## Task 3: HTML skeleton

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write `index.html`**

Write the complete semantic structure (no inline styles beyond meta). All sections present with placeholder content that will be styled in later tasks. Publications list is rendered by JS into the `<ol id="pub-list">` element.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xi Zhang, PhD — Postdoctoral Research Fellow, MGH / Harvard</title>
  <meta name="description" content="Xi Zhang, PhD — Postdoctoral Research Fellow at Sabet Lab, Massachusetts General Hospital / Harvard Medical School. Research in PET and SPECT detector engineering, scintillator laser processing, and FPGA-based readout systems." />
  <meta property="og:title" content="Xi Zhang, PhD — Postdoctoral Research Fellow" />
  <meta property="og:description" content="Molecular Imaging · PET / SPECT Detector Engineering" />
  <meta property="og:image" content="assets/profile.jpg" />
  <meta property="og:type" content="website" />
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/styles.css" />
</head>
<body>
  <header id="site-header">
    <div class="container nav-row">
      <a href="#home" class="brand"><span class="brand-dot"></span> Xi Zhang</a>
      <nav id="site-nav" aria-label="Primary">
        <button class="nav-toggle" aria-expanded="false" aria-controls="nav-list" aria-label="Toggle navigation">
          <span></span><span></span><span></span>
        </button>
        <ul id="nav-list">
          <li><a href="#home" class="nav-link active" data-section="home">Home</a></li>
          <li><a href="#research" class="nav-link" data-section="research">Research</a></li>
          <li><a href="#publications" class="nav-link" data-section="publications">Publications</a></li>
          <li><a href="#cv" class="nav-link" data-section="cv">CV</a></li>
          <li><a href="#contact" class="nav-link" data-section="contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <!-- HOME / HERO -->
    <section id="home" class="section hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="container hero-grid">
        <div class="hero-left" data-animate>
          <span class="eyebrow">POSTDOCTORAL RESEARCH FELLOW</span>
          <h1>Xi Zhang, <span class="accent">PhD</span></h1>
          <p class="hero-subtitle">Molecular Imaging · PET / SPECT Detector Engineering</p>
          <p class="hero-bio">
            I am a Postdoctoral Research Fellow at the Athinoula A. Martinos Center for Biomedical Imaging, MGH / Harvard Medical School. My research focuses on the simulation, design, assembly, and electronic readout of detectors for positron emission tomography (PET) and single-photon emission computed tomography (SPECT), including high-precision systems with special geometric configurations for cardiac and brain imaging. I also work on femtosecond-laser processing of scintillator crystals to improve detector performance.
          </p>
          <div class="hero-cta">
            <a href="#research" class="btn btn-primary">Research →</a>
            <a href="#publications" class="btn btn-ghost">Publications →</a>
            <a href="assets/CV-XiZhang.pdf" class="btn btn-ghost" download>Download CV ↓</a>
          </div>
        </div>
        <div class="hero-right" data-animate>
          <div class="avatar-wrap">
            <img src="assets/profile.jpg" alt="Portrait of Xi Zhang" class="avatar" />
          </div>
          <ul class="hero-meta">
            <li><span class="meta-icon">📍</span> Charlestown, MA</li>
            <li><span class="meta-icon">✉</span> <a href="mailto:xzhang84@mgh.harvard.edu">xzhang84@mgh.harvard.edu</a></li>
            <li><span class="meta-icon">🏛</span> MGH / Harvard Medical School</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- RESEARCH -->
    <section id="research" class="section">
      <div class="container">
        <header class="section-head" data-animate>
          <span class="section-label">01 — Research</span>
          <h2>Research Themes</h2>
          <p class="section-lede">Four interlocking threads in molecular imaging instrumentation.</p>
        </header>
        <div class="research-grid">
          <article class="card research-card" data-animate>
            <div class="card-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="7"/><circle cx="16" cy="16" r="2.5" fill="currentColor"/></svg>
            </div>
            <h3>PET Detector Design</h3>
            <p>Time-of-flight (TOF) and depth-of-interaction (DOI) detectors; high-resolution arrays down to 0.35 mm crystal pitch; light-sharing window methods for compact preclinical and clinical scanners.</p>
            <a href="#publications" class="card-link">Related publications →</a>
          </article>
          <article class="card research-card" data-animate>
            <div class="card-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 4 L20 12 L28 14 L22 20 L24 28 L16 24 L8 28 L10 20 L4 14 L12 12 Z"/></svg>
            </div>
            <h3>SPECT Systems</h3>
            <p>Special-geometry single-photon emission computed tomography systems for cardiac and brain imaging; detector assembly, characterization, and clinical translation at MGH.</p>
            <a href="#publications" class="card-link">Related publications →</a>
          </article>
          <article class="card research-card" data-animate>
            <div class="card-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 16 L28 16"/><path d="M22 10 L28 16 L22 22"/><rect x="4" y="10" width="10" height="12" rx="1.5"/></svg>
            </div>
            <h3>Laser Processing of Crystals</h3>
            <p>Femtosecond-laser micro-structuring of LYSO and CsI:Tl scintillator crystals; engineering optical reflectance to enhance light transport and suppress inter-crystal cross-talk.</p>
            <a href="#publications" class="card-link">Related publications →</a>
          </article>
          <article class="card research-card" data-animate>
            <div class="card-icon">
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="22" height="22" rx="2"/><path d="M5 12 L27 12 M5 20 L27 20 M12 5 L12 27 M20 5 L20 27"/></svg>
            </div>
            <h3>Electronic Readout</h3>
            <p>FPGA-based high-channel-count readout (100+ channels); time-to-digital converters with picosecond resolution; modular and robust platforms for evaluating detector configurations.</p>
            <a href="#publications" class="card-link">Related publications →</a>
          </article>
        </div>
      </div>
    </section>

    <!-- PUBLICATIONS -->
    <section id="publications" class="section">
      <div class="container">
        <header class="section-head" data-animate>
          <span class="section-label">02 — Publications</span>
          <h2>Publications</h2>
          <p class="section-lede">Peer-reviewed journal articles and conference papers in molecular imaging.</p>
        </header>
        <div class="pub-stats" data-animate>
          <div class="stat"><strong id="stat-total">30</strong><span>publications</span></div>
          <div class="stat"><strong id="stat-first">11</strong><span>first-author</span></div>
          <!-- TODO: replace href with your Google Scholar profile URL -->
          <a href="#" class="stat-link" target="_blank" rel="noopener">See on Google Scholar →</a>
        </div>
        <ol id="pub-list" class="pub-list" aria-live="polite"></ol>
      </div>
    </section>

    <!-- CV -->
    <section id="cv" class="section">
      <div class="container">
        <header class="section-head" data-animate>
          <span class="section-label">03 — CV</span>
          <h2>Curriculum Vitae</h2>
          <p class="section-lede">Education, research positions, skills, and honors.</p>
          <a href="assets/CV-XiZhang.pdf" class="btn btn-primary" download>Download Full CV (PDF) ↓</a>
        </header>

        <div class="cv-grid">
          <div data-animate>
            <h3 class="cv-col-title">Education</h3>
            <ol class="timeline">
              <li><span class="t-date">09/2016 – 12/2022</span><div class="t-body"><strong>Ph.D. in Mechanical Electronics</strong><br/>Huazhong University of Science and Technology, China<br/><em>Advisor: Prof. Jianfeng Xu</em></div></li>
              <li><span class="t-date">09/2012 – 06/2016</span><div class="t-body"><strong>B.S. in Mechanical Engineering</strong><br/>Huazhong University of Science and Technology, China</div></li>
            </ol>
          </div>

          <div data-animate>
            <h3 class="cv-col-title">Research Experience</h3>
            <ol class="timeline">
              <li><span class="t-date">09/2023 – present</span><div class="t-body"><strong>Research Fellow</strong><br/>Massachusetts General Hospital / Harvard Medical School</div></li>
              <li><span class="t-date">09/2020 – 09/2021</span><div class="t-body"><strong>Visiting Scholar</strong><br/>Institute of Biomedical Engineering, Shenzhen Bay Laboratory, China<br/><em>Supervisors: Dr. Qiyu Peng, Prof. Qiushi Ren</em></div></li>
              <li><span class="t-date">09/2017 – 03/2018</span><div class="t-body"><strong>Visiting Scholar</strong><br/>Molecular Biophysics and Integrated Bioimaging, Lawrence Berkeley National Laboratory, USA<br/><em>Supervisors: Dr. Qiyu Peng, Prof. Thomas F. Budinger</em></div></li>
            </ol>
          </div>
        </div>

        <div class="cv-block" data-animate>
          <h3 class="cv-col-title">Skills</h3>
          <div class="skills-grid">
            <div><h4>Languages</h4><p>C++ · Python · Verilog HDL</p></div>
            <div><h4>Software</h4><p>MATLAB · Quartus · GEANT4 · Altium Designer · Cadence Allegro · SolidWorks · AutoCAD</p></div>
            <div><h4>Domain Expertise</h4><p>PET detector design (TOF, DOI) · SPECT systems · scintillator laser processing · FPGA readout</p></div>
          </div>
        </div>

        <div class="cv-block" data-animate>
          <h3 class="cv-col-title">Honors &amp; Awards</h3>
          <ul class="awards">
            <li><span class="t-date">2021</span> Merit Postgraduate of HUST</li>
            <li><span class="t-date">2017</span> National Scholarship</li>
            <li><span class="t-date">2016</span> Outstanding Graduates of HUST</li>
            <li><span class="t-date">2014</span> First Prize, "Challenge Cup" National College Student Business Plan Competition</li>
            <li><span class="t-date">2014</span> National Encouragement Scholarship</li>
            <li><span class="t-date">2013</span> Merit Student of HUST</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- CONTACT -->
    <section id="contact" class="section">
      <div class="container">
        <header class="section-head" data-animate>
          <span class="section-label">04 — Contact</span>
          <h2>Get in Touch</h2>
          <p class="section-lede">Open to collaboration on detector engineering, molecular imaging, and laser-processed scintillators.</p>
        </header>
        <div class="contact-grid">
          <a href="mailto:xzhang84@mgh.harvard.edu" class="card contact-card" data-animate>
            <span class="contact-label">Email</span>
            <strong>xzhang84@mgh.harvard.edu</strong>
          </a>
          <div class="card contact-card" data-animate>
            <span class="contact-label">Office</span>
            <strong>149 13th St, Rm 5410<br/>Charlestown, MA 02129</strong>
          </div>
          <a href="https://sabetlab.mgh.harvard.edu/" target="_blank" rel="noopener" class="card contact-card" data-animate>
            <span class="contact-label">Lab</span>
            <strong>Sabet Lab @ Athinoula A. Martinos Center →</strong>
          </a>
        </div>
        <ul class="social-row" data-animate>
          <!-- TODO: replace href="#" with your real profile URLs -->
          <li><a href="#" target="_blank" rel="noopener">Google Scholar</a></li>
          <li><a href="#" target="_blank" rel="noopener">ORCID</a></li>
          <li><a href="#" target="_blank" rel="noopener">LinkedIn</a></li>
        </ul>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>© <span id="year"></span> Xi Zhang · Built with HTML &amp; CSS · Hosted on GitHub Pages</p>
    </div>
  </footer>

  <script src="data/publications.js"></script>
  <script src="assets/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open in browser to verify structure**

Open `index.html` in any browser (double-click). Expected: unstyled but readable content, all sections present, headshot loads, CV download link works. JS console may show a "PUBLICATIONS undefined" error briefly until Task 6 — that's expected.

- [ ] **Step 3: Commit**

```powershell
git add index.html
git commit -m "feat: add semantic HTML skeleton for all 5 sections"
```

---

## Task 4: Base styles — design tokens, typography, layout primitives

**Files:**
- Create: `assets/styles.css`

- [ ] **Step 1: Write base styles**

This task lays down the foundation. Sections-specific styling comes in Task 5.

```css
/* ============ Tokens ============ */
:root {
  --bg: #0a0e1a;
  --bg-elev: #0f1424;
  --card: rgba(20, 26, 45, 0.6);
  --card-border: rgba(110, 168, 255, 0.12);
  --text: #e6ebf5;
  --text-dim: #8b95b0;
  --text-faint: #5b6480;
  --accent: #6ea8ff;
  --accent-2: #a78bfa;
  --accent-cy: #22d3ee;
  --gradient: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
  --radius-card: 12px;
  --radius-btn: 6px;
  --maxw: 1120px;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-5: 3rem;
  --space-6: 5rem;
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-head: 'Space Grotesk', var(--font-body);
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace;
}

/* ============ Reset ============ */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}
img { max-width: 100%; display: block; }
a { color: var(--accent); text-decoration: none; transition: color .2s ease; }
a:hover { color: var(--accent-2); }
ul, ol { list-style: none; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }

/* ============ Typography ============ */
h1, h2, h3, h4 { font-family: var(--font-head); font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; color: var(--text); }
h1 { font-size: clamp(2.5rem, 5vw, 3.75rem); font-weight: 700; }
h2 { font-size: clamp(2rem, 3.5vw, 2.75rem); }
h3 { font-size: 1.25rem; }
h4 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
p { color: var(--text-dim); }
.accent { background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

/* ============ Layout ============ */
.container { width: 100%; max-width: var(--maxw); margin: 0 auto; padding: 0 var(--space-3); }
.section { padding: var(--space-6) 0; position: relative; }
.section-head { margin-bottom: var(--space-5); max-width: 720px; }
.section-label { display: inline-block; font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); letter-spacing: 0.15em; margin-bottom: var(--space-1); }
.section-lede { margin-top: var(--space-2); font-size: 1.05rem; }
.eyebrow { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.18em; color: var(--accent); }

/* ============ Card primitive ============ */
.card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  padding: var(--space-3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(110, 168, 255, 0.3);
  box-shadow: 0 12px 32px -8px rgba(110, 168, 255, 0.25), 0 0 0 1px rgba(167, 139, 250, 0.15);
}

/* ============ Buttons ============ */
.btn { display: inline-flex; align-items: center; gap: .5rem; padding: .75rem 1.25rem; border-radius: var(--radius-btn); font-weight: 500; font-size: .95rem; transition: transform .15s ease, background .2s ease, box-shadow .2s ease; }
.btn-primary { background: var(--gradient); color: #0a0e1a; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px -6px rgba(110, 168, 255, .45); color: #0a0e1a; }
.btn-ghost { background: rgba(110, 168, 255, 0.08); color: var(--text); border: 1px solid var(--card-border); }
.btn-ghost:hover { background: rgba(110, 168, 255, 0.16); color: var(--text); }

/* ============ Animations ============ */
[data-animate] { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
[data-animate].visible { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  [data-animate] { opacity: 1; transform: none; }
  html { scroll-behavior: auto; }
}

/* ============ Footer ============ */
.site-footer { padding: var(--space-4) 0; border-top: 1px solid var(--card-border); text-align: center; }
.site-footer p { font-size: .85rem; color: var(--text-faint); }
```

- [ ] **Step 2: Verify in browser**

Reload `index.html`. Expected: dark background, light text, sections spaced apart, headings use Space Grotesk, body uses Inter. No section-specific styling yet — those land in Task 5.

- [ ] **Step 3: Commit**

```powershell
git add assets/styles.css
git commit -m "feat: add base styles (tokens, typography, primitives)"
```

---

## Task 5: Section styles — header, hero, research, publications, CV, contact

**Files:**
- Modify: `assets/styles.css` (append)

- [ ] **Step 1: Append the following block to `assets/styles.css`**

```css
/* ============ Header / Nav ============ */
#site-header {
  position: fixed; inset: 0 0 auto 0; z-index: 100;
  background: rgba(10, 14, 26, 0.6);
  backdrop-filter: blur(8px) saturate(1.2);
  -webkit-backdrop-filter: blur(8px) saturate(1.2);
  border-bottom: 1px solid transparent;
  transition: background .25s ease, border-color .25s ease, box-shadow .25s ease;
}
#site-header.scrolled {
  background: rgba(10, 14, 26, 0.85);
  border-bottom-color: var(--card-border);
  box-shadow: 0 8px 24px -12px rgba(0,0,0,0.6);
}
.nav-row { display: flex; align-items: center; justify-content: space-between; padding: .85rem var(--space-3); }
.brand { display: inline-flex; align-items: center; gap: .6rem; font-family: var(--font-head); font-weight: 600; font-size: 1.05rem; color: var(--text); letter-spacing: -.01em; }
.brand-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--gradient); box-shadow: 0 0 12px rgba(110,168,255,.6); }
#nav-list { display: flex; gap: .25rem; }
.nav-link { display: inline-block; padding: .45rem .85rem; border-radius: 6px; color: var(--text-dim); font-size: .95rem; font-weight: 500; transition: color .2s ease, background .2s ease; }
.nav-link:hover { color: var(--text); background: rgba(110,168,255,.06); }
.nav-link.active { color: var(--accent); background: rgba(110,168,255,.10); }
.nav-toggle { display: none; width: 38px; height: 38px; flex-direction: column; justify-content: center; align-items: center; gap: 4px; border-radius: 6px; }
.nav-toggle span { width: 20px; height: 2px; background: var(--text); border-radius: 2px; transition: transform .2s ease, opacity .2s ease; }
.nav-toggle[aria-expanded="true"] span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.nav-toggle[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
.nav-toggle[aria-expanded="true"] span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

/* ============ Hero ============ */
.hero { padding-top: 8rem; padding-bottom: var(--space-6); overflow: hidden; }
.hero-bg {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(60% 50% at 20% 30%, rgba(110, 168, 255, 0.18), transparent 70%),
    radial-gradient(45% 45% at 80% 70%, rgba(167, 139, 250, 0.18), transparent 70%),
    radial-gradient(40% 40% at 50% 100%, rgba(34, 211, 238, 0.12), transparent 70%);
  animation: halo-drift 20s ease-in-out infinite alternate;
}
@keyframes halo-drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-3%, 2%) scale(1.05); }
}
.hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--space-5); align-items: center; }
.hero-left h1 { margin-top: .5rem; }
.hero-subtitle { font-family: var(--font-mono); font-size: 1rem; color: var(--accent-cy); margin-top: .75rem; letter-spacing: .02em; }
.hero-bio { margin-top: var(--space-3); font-size: 1.05rem; max-width: 56ch; }
.hero-cta { margin-top: var(--space-4); display: flex; flex-wrap: wrap; gap: .75rem; }
.hero-right { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.avatar-wrap {
  position: relative; padding: 4px; border-radius: 50%;
  background: var(--gradient);
  box-shadow: 0 0 60px -10px rgba(110, 168, 255, 0.5), 0 0 100px -20px rgba(167, 139, 250, 0.35);
}
.avatar { width: 240px; height: 240px; border-radius: 50%; object-fit: cover; background: var(--bg-elev); }
.hero-meta { font-size: .95rem; color: var(--text-dim); display: grid; gap: .5rem; text-align: center; }
.hero-meta a { color: var(--text-dim); }
.hero-meta a:hover { color: var(--accent); }
.meta-icon { margin-right: .35rem; }

/* ============ Research ============ */
.research-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.research-card { display: flex; flex-direction: column; gap: var(--space-2); }
.card-icon { width: 48px; height: 48px; border-radius: 10px; background: rgba(110, 168, 255, 0.08); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.card-icon svg { width: 24px; height: 24px; }
.research-card h3 { color: var(--text); }
.research-card p { font-size: .95rem; }
.card-link { font-family: var(--font-mono); font-size: .8rem; color: var(--accent-cy); margin-top: auto; }

/* ============ Publications ============ */
.pub-stats { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-2) var(--space-3); border: 1px solid var(--card-border); border-radius: var(--radius-card); background: var(--card); margin-bottom: var(--space-4); flex-wrap: wrap; }
.stat { display: flex; flex-direction: column; align-items: flex-start; }
.stat strong { font-family: var(--font-mono); font-size: 1.5rem; color: var(--text); }
.stat span { font-size: .75rem; letter-spacing: .1em; color: var(--text-faint); text-transform: uppercase; }
.stat-link { margin-left: auto; font-family: var(--font-mono); font-size: .85rem; }

.pub-list { display: grid; gap: var(--space-3); }
.pub-year { font-family: var(--font-mono); font-size: 1.5rem; color: var(--text-faint); margin: var(--space-3) 0 var(--space-2); border-top: 1px solid var(--card-border); padding-top: var(--space-3); }
.pub-year:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
.pub-item { padding: var(--space-2) var(--space-3); border-left: 3px solid transparent; transition: background .2s ease, border-color .2s ease; }
.pub-item:hover { background: rgba(110, 168, 255, 0.04); }
.pub-item.first-author { border-left-color: var(--accent-cy); }
.pub-item.co-first { border-left-color: var(--accent-cy); border-left-style: dashed; }
.pub-title { font-style: italic; color: var(--text); font-size: 1rem; line-height: 1.4; }
.pub-title a { color: var(--text); }
.pub-title a:hover { color: var(--accent); }
.pub-authors { font-size: .9rem; color: var(--text-dim); margin-top: .25rem; }
.pub-authors .me { color: var(--text); font-weight: 600; }
.pub-meta { font-family: var(--font-mono); font-size: .8rem; color: var(--text-faint); margin-top: .35rem; }
.pub-meta a { color: var(--text-faint); }
.pub-meta a:hover { color: var(--accent); }
.pub-cofirst-note { display: inline-block; margin-left: .5rem; font-family: var(--font-mono); font-size: .7rem; color: var(--accent-cy); letter-spacing: .08em; }

/* ============ CV ============ */
.cv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-5); }
.cv-col-title { font-family: var(--font-head); font-size: 1.15rem; color: var(--text); margin-bottom: var(--space-3); padding-bottom: .5rem; border-bottom: 1px solid var(--card-border); }
.timeline { display: grid; gap: var(--space-3); }
.timeline li { display: grid; grid-template-columns: 140px 1fr; gap: var(--space-2); align-items: start; }
.t-date { font-family: var(--font-mono); font-size: .8rem; color: var(--accent-cy); padding-top: .15rem; }
.t-body { color: var(--text-dim); font-size: .95rem; }
.t-body strong { color: var(--text); font-weight: 600; }
.t-body em { color: var(--text-faint); font-style: italic; font-size: .85rem; }
.cv-block { margin-top: var(--space-4); }
.skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.skills-grid h4 { margin-bottom: .35rem; }
.skills-grid p { font-size: .95rem; color: var(--text-dim); }
.awards { display: grid; gap: .5rem; }
.awards li { display: grid; grid-template-columns: 60px 1fr; gap: var(--space-2); align-items: baseline; color: var(--text-dim); font-size: .95rem; }

/* ============ Contact ============ */
.contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.contact-card { display: flex; flex-direction: column; gap: .5rem; text-align: left; }
.contact-card .contact-label { font-family: var(--font-mono); font-size: .75rem; color: var(--accent); letter-spacing: .12em; text-transform: uppercase; }
.contact-card strong { color: var(--text); font-weight: 500; font-size: 1rem; line-height: 1.4; }
a.contact-card { cursor: pointer; }
a.contact-card:hover strong { color: var(--accent); }
.social-row { display: flex; gap: var(--space-3); justify-content: center; margin-top: var(--space-4); flex-wrap: wrap; }
.social-row a { font-family: var(--font-mono); font-size: .85rem; padding: .5rem 1rem; border: 1px solid var(--card-border); border-radius: 6px; }
.social-row a:hover { border-color: var(--accent); }

/* ============ Responsive ============ */
@media (max-width: 900px) {
  .hero { padding-top: 7rem; }
  .hero-grid { grid-template-columns: 1fr; gap: var(--space-4); }
  .hero-right { order: -1; }
  .avatar { width: 180px; height: 180px; }
  .research-grid, .cv-grid, .skills-grid, .contact-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .section { padding: var(--space-5) 0; }
  .nav-toggle { display: flex; }
  #nav-list {
    position: absolute; top: 100%; right: var(--space-3); left: var(--space-3);
    background: rgba(15, 20, 36, 0.96);
    backdrop-filter: blur(12px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-card);
    flex-direction: column;
    padding: var(--space-2);
    gap: 0;
    display: none;
  }
  #nav-list.open { display: flex; }
  .nav-link { padding: .65rem .85rem; }
  .timeline li { grid-template-columns: 1fr; gap: .25rem; }
  .awards li { grid-template-columns: 50px 1fr; }
  .pub-stats { gap: var(--space-2); }
  .stat-link { margin-left: 0; }
}
```

- [ ] **Step 2: Reload `index.html` and verify**

Expected:
- Fixed top nav with brand on left and links on right
- Hero: two columns at desktop (text + headshot), drifting colored halos in background
- Research section: 2×2 card grid, cards lift on hover
- Publications: empty list area (filled in Task 6) but stats bar visible
- CV: education / experience timeline, skills 3-column, awards
- Contact: 3 cards in a row
- At narrow widths, layouts collapse to single column and the hamburger appears
- All sections animate in as you scroll — wait, animation needs JS (Task 6). For now `data-animate` items will appear invisible. **Temporarily test by removing `data-animate` attributes** OR simply trust that Task 6 will activate them.

- [ ] **Step 3: Commit**

```powershell
git add assets/styles.css
git commit -m "feat: add section styles for header, hero, research, publications, CV, contact"
```

---

## Task 6: JavaScript — navigation, animations, publication renderer

**Files:**
- Create: `assets/main.js`

- [ ] **Step 1: Write the full script**

```js
(function () {
  'use strict';

  // ===== 1. Scroll-spy + sticky header tint =====
  const header = document.getElementById('site-header');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = navLinks
    .map(link => document.getElementById(link.dataset.section))
    .filter(Boolean);

  const setActiveNav = (id) => {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === id);
    });
  };

  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        setActiveNav(entry.target.id);
      }
    });
  }, { threshold: [0.5] });
  sections.forEach(s => spy.observe(s));

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

  // ===== 3. Entrance animations =====
  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        animateObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('[data-animate]').forEach(el => animateObserver.observe(el));

  // ===== 4. Footer year =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== 5. Publications renderer =====
  const pubList = document.getElementById('pub-list');
  const statTotal = document.getElementById('stat-total');
  const statFirst = document.getElementById('stat-first');
  const pubs = window.PUBLICATIONS || [];

  if (statTotal) statTotal.textContent = String(pubs.length);
  if (statFirst) statFirst.textContent = String(pubs.filter(p => p.firstAuthor || p.coFirst).length);

  if (pubList && pubs.length) {
    // group by year (desc)
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
        li.className = 'pub-item' + (p.firstAuthor ? ' first-author' : '') + (p.coFirst ? ' co-first' : '');

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
        // bold "Zhang X" (and "Zhang X*") wherever it appears
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
```

- [ ] **Step 2: Reload `index.html` and verify**

Expected:
- Top nav: clicking a link smooth-scrolls to that section; scrolling updates the active link highlight
- Header: gains darker background + shadow after scrolling > 20px
- Hero, research cards, CV blocks, contact cards: fade in as they enter viewport
- Publications section: 30 entries rendered, grouped by year (2025 → 2018 descending), first-author entries have cyan left border, the Xie S*/Zhang X* paper has a dashed cyan border + "(CO-FIRST AUTHOR)" label
- Stats bar reads: `30 publications · 12 first-author` (11 first + 1 co-first)
- Footer year reads current year (2026)
- At width ≤ 640px: hamburger button appears, click toggles menu

- [ ] **Step 3: Quick DOI spot-check**

Click DOI link on any 3 publication entries. Expected: each opens the correct paper on doi.org / publisher site.

- [ ] **Step 4: Commit**

```powershell
git add assets/main.js
git commit -m "feat: add nav scroll-spy, entrance animations, mobile menu, publications renderer"
```

---

## Task 7: README and deployment instructions

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Personal Website — Xi Zhang

Single-page academic site built with plain HTML, CSS, and JavaScript. Deployed to GitHub Pages at https://xizhang84.github.io/.

## Local preview

Open `index.html` in any modern browser. No build step required.

## Deploy to GitHub Pages

1. Create a new public repository on GitHub named **exactly** `xizhang84.github.io` (root-domain Pages site).
2. From this folder, run:

   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/xizhang84/xizhang84.github.io.git
   git push -u origin main
   ```

3. Wait ~1 minute. The site goes live at https://xizhang84.github.io/.

## Updating content

| Want to change... | Edit this file |
|---|---|
| Bio, headlines, section copy | `index.html` |
| Visual styling, colors, layout | `assets/styles.css` |
| Publications list | `data/publications.js` |
| CV PDF download | replace `assets/CV-XiZhang.pdf` |
| Headshot | replace `assets/profile.jpg` (square crop recommended, 600×600) |

## TODO placeholders to fill in

Search for `<!-- TODO -->` in `index.html` to find the spots that need real URLs:
- Google Scholar profile URL (top of Publications section, and in Contact social row)
- ORCID iD URL (Contact social row)
- LinkedIn URL (Contact social row)
```

- [ ] **Step 2: Commit**

```powershell
git add README.md
git commit -m "docs: add README with deployment and update instructions"
```

---

## Task 8: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Open `index.html` in a fresh browser tab (Chrome or Edge recommended)**

Walk through and check:
- [ ] Page loads without console errors (open DevTools → Console)
- [ ] All 30 publication entries render
- [ ] First-author publications have cyan left border (count visually: should be 11)
- [ ] Co-first paper (Xie S*, Zhang X*) has dashed border + label
- [ ] Headshot loads (not broken image)
- [ ] CV download button: clicking triggers PDF download with filename `CV-XiZhang.pdf`
- [ ] All 5 nav links smooth-scroll to their sections
- [ ] Active nav link updates as you scroll
- [ ] Header darkens after first scroll
- [ ] Cards lift on hover

- [ ] **Step 2: Responsive check**

Open DevTools → device toolbar → switch to iPhone SE (375×667).
- [ ] Hamburger menu appears
- [ ] Click hamburger → menu opens; click a link → menu closes
- [ ] Hero stacks vertically (avatar above text)
- [ ] Research / Contact cards stack to one column
- [ ] Timeline dates stack above body text

- [ ] **Step 3: Link spot-check**

Click these and confirm they go to the right place:
- [ ] `xzhang84@mgh.harvard.edu` → opens mail client with prefilled To
- [ ] Sabet Lab card → opens https://sabetlab.mgh.harvard.edu/
- [ ] 3 different DOI links from Publications section → resolve to the correct papers

- [ ] **Step 4: Accessibility quick check**

In DevTools → Lighthouse → run Accessibility audit only.
- [ ] Score ≥ 95
- [ ] No critical contrast warnings

- [ ] **Step 5: Final commit (only if any small fixes were needed)**

```powershell
git add -u
git commit -m "fix: address verification findings"
```

If nothing changed, skip this step.

---

## Self-Review Checklist (already performed by plan author)

- ✅ Spec coverage: every section in `2026-05-28-personal-website-design.md` maps to a task above (Tasks 1–6 build the artifacts, Task 7 covers deployment, Task 8 covers verification).
- ✅ Placeholder scan: no "TBD" or "implement later" — `<!-- TODO -->` comments in HTML are deliberate user-provided URLs documented in the README and Task 1's plan.
- ✅ Type consistency: publication object shape `{ year, authors, title, venue, doi, url, firstAuthor, coFirst }` is identical across `data/publications.js` (Task 2) and `assets/main.js` (Task 6 renderer). Stats bar uses `firstAuthor || coFirst` count = 12, matching the verified data.
- ✅ Counts verified against actual CV: 30 total publications, 11 first-author, 1 co-first.

---

## Deferred (not part of this plan)

These need user input and are wired up as `<!-- TODO -->` placeholders in the HTML, ready to be swapped in later:
- Google Scholar profile URL → `#pub-stats .stat-link` + `.social-row` first link
- ORCID iD URL → `.social-row` second link
- LinkedIn URL → `.social-row` third link
- Citation count / h-index → optional addition to `#pub-stats` (purely manual edit)
