# Personal Website — Xi Zhang

Single-page academic site built with plain HTML, CSS, and JavaScript. Deploys to GitHub Pages at https://xizhang84.github.io/.

Design notes:

- **Warm light / dark themes.** All colors are CSS variables in `assets/styles.css` (`:root` for light, `:root[data-theme="dark"]` for dark). The sun/moon button in the nav toggles them; the choice is remembered in `localStorage` and the OS preference is used until the visitor picks one.
- **Animated PET ring.** `assets/pet-ring.js` draws a ring of scintillator crystals around the portrait on a `<canvas>`. Annihilation events emit back-to-back photons that light up the crystals they hit and draw the line of response. Hovering moves the annihilation point to the cursor. Tunable constants are at the top of the file.
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
| Visual styling, layout | `assets/styles.css` |
| Light / dark color palettes | `assets/styles.css` → `:root` and `:root[data-theme="dark"]` |
| PET ring animation (speed, event rate, crystal count) | `assets/pet-ring.js` → constants at the top |
| Publications list | `data/publications.js` |
| CV PDF download | replace `assets/CV-XiZhang.pdf` |
| Headshot | replace `assets/profile.jpg` (square crop, 600×600 recommended) |

## File structure

```
.
├── index.html              # Single page, all 5 sections
├── assets/
│   ├── styles.css          # All styles
│   ├── main.js             # Navigation, theme toggle, animations, publications render
│   ├── pet-ring.js         # Canvas PET detector ring around the portrait
│   ├── profile.jpg         # Headshot
│   ├── CV-XiZhang.pdf      # Downloadable CV
│   └── favicon.svg
├── data/
│   └── publications.js     # 30 publications data
├── README.md
└── .nojekyll               # Skip Jekyll processing on GitHub Pages
```
