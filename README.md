# Personal Website — Xi Zhang

Single-page academic site built with plain HTML, CSS, and JavaScript. Deploys to GitHub Pages at https://xizhang84.github.io/.

Design notes:

- **Warm light / dark themes.** All colors are CSS variables in `assets/styles.css` (`:root` for light, `:root[data-theme="dark"]` for dark). The site opens in dark; the sun/moon button in the nav toggles, and the choice is remembered in `localStorage`.
- **Hero figure.** `assets/figure.js` is a second small three.js scene around an illustration of Xi as a bird swordsman (a nod to Kez from Dota 2 and to keV): `assets/figure.webp` (PNG fallback), cut out of the generated image with `scripts/cutout.py`-style processing. It stands as a card that breathes, sways, leans toward the pointer and casts a contact shadow; behind it a spiral galaxy turns, crescent slashes flare, feathers fall, and a pair of 511 keV photons orbit. `assets/portrait.jpg` is the head crop (Contact page reconstruction, `window.PORTRAIT_URL`) and `assets/avatar.jpg` the social card. The inline SVG avatar stays as the no-WebGL fallback.
- **Hero animation.** `assets/hero.js` keeps the figure's surroundings clean (a breathing glow, a slow float, a few degrees of pointer tilt) and puts the physics behind it: a full-width canvas where every few seconds an annihilation sends two photons apart, the hits flash and the line of response fades, with a little pointer parallax. A pointer that rests for half a second becomes the source: annihilations then happen under it. On the first load of a session the name is "reconstructed": counts accumulate inside the letter shapes until the heading resolves. A dashed guide line with a running pulse leads from under the portrait to the scanner.
- **Station cards.** Every section header carries a thumbnail of its part of the 3D room (rendered by `pet-scene.js` from the same close-up pose the click flight ends on, refreshed on theme change; click it to go back) and a 01→05 signal-chain nav with the current stage lit. Built by `main.js` from `<aside class="station-card" data-station="…">` placeholders.
- **Contact.** Copy-address button, Boston local time, map link, lab blurb, reasons to write, profile links, and the "image" station: `assets/contact.js` reconstructs the portrait from randomly accumulated counts, replaying each time the page opens.
- **3D scanner room.** "Explore the Scanner" opens with an orbitable three.js model of a PET/CT suite (`assets/pet-scene.js`): a semi-transparent gantry with the detector ring inside, patient table, electronics cabinet with cable, and a workstation whose screen accumulates counts into an image. Annihilation events in the patient's head fire photon pairs that flash the crystals they hit, draw the line of response and send a pulse down the cable. Each part of the room is a station for one section: hovering it (or its pulsing dot) lifts and glows the part and shows a tooltip; clicking opens that section. three.js is loaded from jsDelivr through the import map in `index.html`; without WebGL or the CDN the model hides itself and the flat station list below still works. Geometry and colors follow the site theme. The bright parts (crystal flashes, LED rings, tracer) glow through an UnrealBloomPass; the bloom's blend material is switched to colour-only blending so the canvas stays transparent over the page. The camera flies in from far away on load, flies to a part when it is clicked before that section opens, and flies back to the home framing when the visitor returns. The hero is compact enough that the whole scanner fits in the first screen on a desktop (`.pet-scene` height follows `100vh`).
- **Views.** The landing page is only the hero and the scanner. Research, Publications, CV and Contact are separate views (`.view` elements in `index.html`) switched by the hash router at the top of `assets/main.js`, so `#research` etc. still deep-link and the browser back button works. Where the browser has the View Transitions API the switch cross-fades and the scanner box morphs into the section's station thumbnail (both carry `view-transition-name: scanner` for the duration; the frame the camera flight ended on is copied into the thumbnail first, so there is no cut); going back, the thumbnail grows into the scanner and the camera then pulls back. Otherwise the view slides in.
- **Research demos.** Each research card opens on a small canvas simulation of its theme (`assets/research-demos.js`: laser-written converging pixels, the DC-SPECT collimated arc, the monolithic ring, and a sigma-delta 1-bit readout with a forming energy spectrum). They react to the pointer, run only while on screen, and a Demo / Figure toggle on the card swaps in the paper figure.
- **Publications tools.** Filter chips (all / first author / journal / conference), a per-year bar "spectrum" with the first-author share in terracotta (click a year to jump to it), and a BibTeX button on every paper: it asks Crossref for the publisher's record by DOI and falls back to an entry built from `data/publications.js`.
- **PET signal-chain map (fallback).** Hidden unless the 3D scene cannot load; the flat chain lays the site out as one PET event: Subject → Annihilation → Detector → Readout → Image, mapped in order to Home → Research → Publications → CV → Contact. Each station is a link; the current section lights up as you scroll (shared scroll-spy in `assets/main.js`), and a photon pulse travels the chain. The icons are inline SVG in `index.html`, the layout and animation live under "PET signal-chain map" in `assets/styles.css` (switches to a vertical chain under 760px).
- **Restrained motion.** Cards tilt toward the cursor, buttons and the avatar use a short overshoot spring, publication counts count up on scroll, grid cards reveal with a small stagger. Everything is disabled under `prefers-reduced-motion`.

## Local preview

Open `index.html` in any modern browser. No build step required.

If you need a local server (e.g. to test the IntersectionObserver behavior more reliably than `file://`), run any of:

```powershell
# Python 3
python -m http.server 8000

# or Node
npx serve .
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
| Hero background events, title reveal, guide line | `assets/hero.js` → constants at the top |
| Contact page (local time zone, image reconstruction) | `assets/contact.js` |
| Publications list | `data/publications.js` |
| Research demos (physics, colors, rates) | `assets/research-demos.js` |
| CV PDF download | replace `assets/CV-XiZhang.pdf` |
| Portrait | replace `assets/figure.webp` / `figure.png` (transparent cutout, ~660×1100) and `assets/portrait.jpg` (square head crop); the SVG fallback is `.avatar-svg` in `index.html`; `assets/avatar.jpg` is the social card |

## File structure

```
.
├── index.html              # Single page: hero, PET map index, 5 sections
├── assets/
│   ├── styles.css          # All styles
│   ├── main.js             # Navigation, theme toggle, animations, publications render
│   ├── figure.js           # three.js scene: illustrated figure card + galaxy, photons, feathers
│   ├── figure.webp         # the cut-out illustration (figure.png = fallback)
│   ├── portrait.jpg        # head crop for the Contact page
│   ├── hero.js             # Hero background events, title reveal, guide line
│   ├── contact.js          # Contact helpers + portrait reconstruction
│   ├── pet-scene.js        # three.js 3D scanner room (site map)
│   ├── research-demos.js   # canvas demos on the research cards
│   ├── avatar.jpg          # Social-card render of the illustrated portrait
│   ├── CV-XiZhang.pdf      # Downloadable CV
│   └── favicon.svg
├── data/
│   └── publications.js     # 30 publications data
├── README.md
└── .nojekyll               # Skip Jekyll processing on GitHub Pages
```
