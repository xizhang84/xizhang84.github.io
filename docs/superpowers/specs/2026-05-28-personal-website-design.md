# Personal Website — Xi Zhang

**Date:** 2026-05-28
**Owner:** Xi Zhang (xizhang84@gmail.com)
**Status:** Approved for implementation

## 1. Purpose

A personal academic website for Xi Zhang, PhD — Postdoctoral Research Fellow at Sabet Lab (Massachusetts General Hospital / Harvard Medical School). Primary audience: academic peers, hiring committees, and collaborators in the molecular imaging / PET-SPECT detector engineering community.

The site serves as a single canonical place to find Xi's bio, research themes, publication list (with DOIs), CV (HTML + downloadable PDF), and contact information.

## 2. Goals

- Establish a professional online presence under a stable URL.
- Highlight first-author publications and key research themes.
- Make the CV easily downloadable as PDF.
- Load fast, work without JavaScript for core content, and be maintainable by editing a single data file.

## 3. Non-Goals (YAGNI)

- No internationalization (English only).
- No News / Blog section.
- No backend, contact form, or database.
- No React / Vue / build pipeline — plain HTML/CSS/JS only.
- No dark/light theme switcher (dark-only for consistency).
- No publication search / filter (32 entries is small enough to skim).

## 4. Visual System

| Property | Value |
|----------|-------|
| Theme | Dark "Lab" |
| Background | `#0a0e1a` (deep blue-black) |
| Card surface | `rgba(20, 26, 45, 0.6)` with `backdrop-filter: blur(16px)` |
| Primary text | `#e6ebf5` |
| Secondary text | `#8b95b0` |
| Accent (primary) | `#6ea8ff` (tech blue) |
| Accent (gradient pair) | `#a78bfa` (violet) |
| First-author marker | `#22d3ee` (cyan) |
| Heading font | Space Grotesk (Google Fonts) |
| Body font | Inter (Google Fonts) |
| Mono / labels | JetBrains Mono |
| Card radius | 12px |
| Button radius | 6px |

**Motion:**
- Hero background: slowly drifting radial-gradient halos (CSS keyframes).
- Cards: `hover` → `translateY(-4px)` + cyan/violet glow shadow.
- Section entrance: IntersectionObserver toggles `.visible` class → fade-in-up 0.6s ease-out.

## 5. File Layout

```
Personal Website/
├── index.html              # Single page, all 5 sections
├── assets/
│   ├── styles.css          # Main stylesheet
│   ├── main.js             # Nav, scroll-spy, intersection animations
│   ├── profile.jpg         # Headshot (downloaded from Sabet Lab)
│   ├── CV-XiZhang.pdf      # Copied from Personal Doc/CV-XiZhang_02182026.pdf
│   └── favicon.svg         # Simple geometric icon
├── data/
│   └── publications.js     # Publications array (window.PUBLICATIONS = [...])
├── README.md               # How to deploy to xizhang84.github.io
└── .nojekyll               # Skip Jekyll processing on GitHub Pages
```

**Deployment target:** Push to GitHub repo `xizhang84/xizhang84.github.io` → live at `https://xizhang84.github.io/`.

## 6. Sections

### 6.1 Home / About (hero)

Two-column layout (stacks vertically on mobile):

**Left column:**
- Eyebrow tag (mono, small): `POSTDOCTORAL RESEARCH FELLOW`
- H1: `Xi Zhang, PhD`
- Subtitle: `Molecular Imaging · PET / SPECT Detector Engineering`
- Intro paragraph (~80 words), adapted from Sabet Lab bio:
  > I am a Postdoctoral Research Fellow at the Athinoula A. Martinos Center for Biomedical Imaging, MGH / Harvard Medical School. My research focuses on the simulation, design, assembly, and electronic readout of detectors for positron emission tomography (PET) and single-photon emission computed tomography (SPECT), including high-precision systems with special geometric configurations for cardiac and brain imaging. I also work on femtosecond-laser processing of scintillator crystals to improve detector performance.
- Three CTAs side-by-side: `Research →` · `Publications →` · `Download CV ↓`

**Right column:**
- Circular headshot with gradient ring (`#6ea8ff` → `#a78bfa`) and outer glow.
- Stacked info block:
  - 📍 Charlestown, MA
  - ✉ xzhang84@mgh.harvard.edu
  - 🏛 MGH / Harvard Medical School

### 6.2 Research (2×2 grid of 4 cards)

Each card: SVG icon + title + 2–3 sentence description + "Related publications →" anchor.

| Card | Icon hint | Description |
|------|-----------|-------------|
| PET Detector Design | concentric rings | TOF and DOI detectors; high-resolution arrays down to 0.35 mm crystal pitch; light-sharing window methods. |
| SPECT Systems | gamma-ray burst | Special-geometry cardiac and brain SPECT systems; detector assembly and characterization. |
| Laser Processing of Crystals | laser beam | Femtosecond-laser micro-structuring of LYSO and CsI:Tl crystals to enhance light transport and reduce inter-crystal cross-talk. |
| Electronic Readout | circuit pattern | FPGA-based high-channel-count readout (100+ channels); time-to-digital converters with picosecond resolution. |

### 6.3 Publications

Top stats bar (single row):
```
30 PUBLICATIONS  ·  11 FIRST-AUTHOR  ·  See on Google Scholar →
```
(11 first-author + 1 co-first listed in the CV; counts are computed at build/edit time, not hardcoded narratively. Citation count / h-index can be added later when the user provides Scholar profile URL.)

Grouped by year (descending). Year heading in large JetBrains Mono. Each entry:

```
[left cyan bar if first-author]
Title (italic, link to DOI)
Authors (Zhang X bold)
Venue · Year · DOI ↗
```

All 30 publications from CV are included in `data/publications.js` and rendered at page load.

### 6.4 CV

Two-column timeline:

**Left — Education**
- 09/2016 – 12/2022 · Ph.D. in Mechanical Electronics · Huazhong University of Science and Technology (HUST) · Advisor: Prof. Jianfeng Xu
- 09/2012 – 06/2016 · B.S. in Mechanical Engineering · HUST

**Right — Research Experience**
- 09/2023 – present · Research Fellow · Massachusetts General Hospital / Harvard Medical School
- 09/2020 – 09/2021 · Visiting Scholar · Institute of Biomedical Engineering, Shenzhen Bay Laboratory · Supervisors: Dr. Qiyu Peng, Prof. Qiushi Ren
- 09/2017 – 03/2018 · Visiting Scholar · Molecular Biophysics and Integrated Bioimaging, Lawrence Berkeley National Laboratory · Supervisors: Dr. Qiyu Peng, Prof. Thomas F. Budinger

**Skills (3-column block):**
- Languages: C++, Python, Verilog HDL
- Software: MATLAB, Quartus, GEANT4, Altium Designer, Cadence Allegro, SolidWorks, AutoCAD
- Domain: PET detector design (TOF, DOI), SPECT systems, scintillator laser processing, FPGA readout

**Honors & Awards (year + label cards):**
- 2021 · Merit Postgraduate of HUST
- 2017 · National Scholarship
- 2016 · Outstanding Graduates of HUST
- 2014 · First Prize, "Challenge Cup" National College Student Business Plan Competition
- 2014 · National Encouragement Scholarship
- 2013 · Merit Student of HUST

Prominent `[ Download Full CV (PDF) ↓ ]` button at the top of the section.

### 6.5 Contact

Three cards in a row:
- **Email** — `xzhang84@mgh.harvard.edu` (mailto link)
- **Office** — 149 13th St, Rm 5410, Charlestown, MA 02129
- **Lab** — Sabet Lab @ Athinoula A. Martinos Center → links to https://sabetlab.mgh.harvard.edu/

Below cards: a row of external profile icons — Google Scholar · ORCID · LinkedIn. URLs left as `#` placeholders, with an HTML comment instructing the user where to fill them in.

## 7. Interaction Logic (`main.js`)

- Top nav: 5 buttons (Home, Research, Publications, CV, Contact) → smooth-scroll to anchor.
- Scroll-spy: IntersectionObserver watches each `<section>`; on intersection ≥ 0.5, mark the corresponding nav button as active.
- Entrance animations: IntersectionObserver adds `.visible` class to elements with `[data-animate]` when 20% in viewport.
- Mobile: nav collapses to hamburger at `max-width: 768px`.
- Header backdrop: blur intensifies after scroll > 20px (toggle `.scrolled` class).

## 8. Publications Data Format

`data/publications.js`:
```js
window.PUBLICATIONS = [
  {
    year: 2025,
    authors: "Zhang X, Sitek A, Blackberg L, Kupinski M, Furenlid L, Sabet H",
    title: "Development and Performance Evaluation of a Laser Processed CsI:Tl Detector with Converging Pixels",
    venue: "IEEE NSS/MIC/RTSD",
    doi: "10.1109/NSS/MIC/RTSD57106.2025.11286546",
    firstAuthor: true
  },
  // ... 31 more entries from CV
];
```

`firstAuthor: true` when "Zhang X" is the first-listed author. Co-first authorship (marked with `*` in the source CV, e.g. `Xie S*, Zhang X*`) is represented with a separate `coFirst: true` flag so the rendered entry can show the cyan accent plus a small "co-first author" annotation.

## 9. Accessibility & SEO

- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`.
- All images have `alt` text.
- Color contrast verified ≥ WCAG AA (`#e6ebf5` on `#0a0e1a` = 15.4:1).
- `<title>` = `Xi Zhang, PhD — Postdoctoral Research Fellow, MGH / Harvard`.
- Meta description set.
- Open Graph tags (title, description, image, url) for link previews.
- `prefers-reduced-motion: reduce` disables non-essential animations.

## 10. Open Items (deferred, not blocking)

- Google Scholar URL — user to provide later; placeholder href until then.
- ORCID iD — user to provide later.
- LinkedIn URL — user to provide later.
- Citation count + h-index numbers — user to update the stats bar manually.

These are isolated to a small set of `<!-- TODO -->` comments in `index.html` and a single block at the top of `data/publications.js`.

## 11. Testing / Verification

Manual checks before declaring done:
- Open `index.html` directly in a browser (no server needed) — all sections render, animations play, nav works.
- Click "Download CV" — PDF downloads with correct filename.
- Resize to 375px wide (iPhone SE) — layout reflows, hamburger menu works.
- All 30 publication DOI links open the correct paper (spot-check 3).
- Lighthouse score targets: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

## 12. Deployment

`README.md` instructs the user to:
1. Create GitHub repo named exactly `xizhang84.github.io`.
2. `git init` in the project folder, push to that repo's `main` branch.
3. GitHub Pages auto-publishes within ~1 minute at `https://xizhang84.github.io/`.

No custom domain configured (option left open for the future via a `CNAME` file).
