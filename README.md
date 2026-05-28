# Personal Website — Xi Zhang

Single-page academic site built with plain HTML, CSS, and JavaScript. Deploys to GitHub Pages at https://xizhang84.github.io/.

## Local preview

Open `index.html` in any modern browser. No build step required.

If you need a local server (e.g. to test the IntersectionObserver behavior more reliably than `file://`), run any of:

```powershell
# Python 3
python -m http.server 8000

# Node (if installed)
npx serve .
```

Then open http://localhost:8000.

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
| Headshot | replace `assets/profile.jpg` (square crop, 600×600 recommended) |

## TODO placeholders to fill in

Search for `<!-- TODO -->` in `index.html` to find the spots that need real URLs:

- **Google Scholar** profile URL (top of Publications section, and in Contact social row)
- **ORCID iD** URL (Contact social row)
- **LinkedIn** URL (Contact social row)

## File structure

```
.
├── index.html              # Single page, all 5 sections
├── assets/
│   ├── styles.css          # All styles
│   ├── main.js             # Navigation, animations, publications render
│   ├── profile.jpg         # Headshot
│   ├── CV-XiZhang.pdf      # Downloadable CV
│   └── favicon.svg
├── data/
│   └── publications.js     # 30 publications data
├── README.md
└── .nojekyll               # Skip Jekyll processing on GitHub Pages
```
