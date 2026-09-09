# Personal Website — Xi Zhang

Single-page academic site built with plain HTML, CSS, and JavaScript. Deploys to GitHub Pages at https://xizhang84.github.io/.

Design notes:

- **Warm light / dark themes.** All colors are CSS variables in `assets/styles.css` (`:root` for light, `:root[data-theme="dark"]` for dark). The site opens in dark; the sun/moon button in the nav toggles, and the choice is remembered in `localStorage`.
- **Animated PET ring.** `assets/pet-ring.js` draws a ring of scintillator crystals around the portrait on a `<canvas>`. Annihilation events emit back-to-back photons that light up the crystals they hit and draw the line of response. Hovering moves the annihilation point to the cursor. Tunable constants are at the top of the file.
- **3D scanner room.** "Explore the Scanner" opens with an orbitable three.js model of a PET/CT suite (`assets/pet-scene.js`): a semi-transparent gantry with the detector ring inside, patient table, electronics cabinet with cable, and a workstation whose screen accumulates counts into an image. Annihilation events in the patient's head fire photon pairs that flash the crystals they hit, draw the line of response and send a pulse down the cable. Each part of the room is a station for one section: hovering it (or its pulsing dot) lifts and glows the part and shows a tooltip; clicking opens that section. three.js is loaded from jsDelivr through the import map in `index.html`; without WebGL or the CDN the model hides itself and the flat station list below still works. Geometry and colors follow the site theme.
- **Views.** The landing page is only the hero and the scanner. Research, Publications, CV and Contact are separate views (`.view` elements in `index.html`) switched by the hash router at the top of `assets/main.js`, so `#research` etc. still deep-link and the browser back button works.
- **PET signal-chain map (fallback).** Hidden unless the 3D scene cannot load; the flat chain lays the site out as one PET event: Subject → Annihilation → Detector → Readout → Image, mapped in order to Home → Research → Publications → CV → Contact. Each station is a link; the current section lights up as you scroll (shared scroll-spy in `assets/main.js`), and a photon pulse travels the chain. The icons are inline SVG in `index.html`, the layout and animation live under "PET signal-chain map" in `assets/styles.css` (switches to a vertical chain under 760px).
- **Restrained motion.** Cards tilt toward the cursor, buttons and the avatar use a short overshoot spring, publication counts count up on scroll, grid cards reveal with a small stagger. Everything is disabled under `prefers-reduced-motion`.

## Local preview

Open `index.html` in any modern browser. No build step required.

If you need a local server (e.g. to test the IntersectionObserver behavior more reliably than `file://`), run any of:

```powershell
# Node
npx serve .

# or Python 3
python -m http.server 8000
```

Then open the URL it prints (http://localhost:3000 for `serve`, http://localhost:8000 for Python).

## Publications sync from Google Scholar

`scripts/update-publications.mjs` keeps `data/publications.js` in step with the Google Scholar profile (`dt6RATUAAAAJ`):

1. Fetches the public profile list once (sorted by date, up to 100 items).
2. Compares titles with the entries already in `data/publications.js`. **Existing entries are never edited or removed**, so manual fixes (co-first flags, venue abbreviations) survive every sync.
3. For each new paper, asks Crossref for the DOI, full author list and journal name. If Crossref has no match, the entry links to the Scholar record instead.
4. Rewrites `data/publications.js` newest-year first and stamps `window.PUBLICATIONS_UPDATED`, which the Publications page shows as "Synced from Google Scholar · date".

arXiv / bioRxiv preprints are skipped by default (pass `--include-preprints` to keep them). Run it locally with:

```powershell
node scripts/update-publications.mjs --dry-run   # show what would be added
node scripts/update-publications.mjs             # write data/publications.js
```

The GitHub Actions workflow `.github/workflows/update-publications.yml` runs the same script every Monday 09:00 UTC (and on demand from the **Actions** tab → *Sync publications from Google Scholar* → *Run workflow*). If it finds new papers it commits `data/publications.js` and GitHub Pages redeploys. Google Scholar has no official API and sometimes blocks automated requests; when that happens the job fails without touching the data, and the next run tries again.

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
| Map stations (names, blurbs, which section each links to) | `index.html` → `<section id="map">` |
| Visual styling, layout | `assets/styles.css` |
| Light / dark color palettes | `assets/styles.css` → `:root` and `:root[data-theme="dark"]` |
| PET ring animation (speed, event rate, crystal count) | `assets/pet-ring.js` → constants at the top |
| Publications list | `data/publications.js` |
| CV PDF download | replace `assets/CV-XiZhang.pdf` |
| Headshot | replace `assets/profile.jpg` (square crop, 600×600 recommended) |

## File structure

```
.
├── index.html              # Single page: hero, PET map index, 5 sections
├── assets/
│   ├── styles.css          # All styles
│   ├── main.js             # Navigation, theme toggle, animations, publications render
│   ├── pet-ring.js         # Canvas PET detector ring around the portrait
│   ├── pet-scene.js        # three.js 3D scanner room (site map)
│   ├── profile.jpg         # Headshot
│   ├── CV-XiZhang.pdf      # Downloadable CV
│   └── favicon.svg
├── data/
│   └── publications.js     # 30 publications data
├── README.md
└── .nojekyll               # Skip Jekyll processing on GitHub Pages
```
