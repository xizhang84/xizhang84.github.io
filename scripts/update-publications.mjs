#!/usr/bin/env node
/* ============================================================
   Sync publications from Google Scholar into data/publications.js

   1. Fetch the public Scholar profile list (one request, sorted by date).
   2. Compare against the entries already in data/publications.js
      (matched by normalised title). Existing entries are never changed
      or removed, so manual corrections (co-first flags, venues) persist.
   3. For each new paper, look up Crossref by title to get the DOI,
      the full author list and the journal name.
   4. Rewrite data/publications.js, newest year first.

   Usage:  node scripts/update-publications.mjs [--dry-run] [--include-preprints]
   Exit codes: 0 ok, 2 Scholar blocked / unparseable (nothing written).
   No dependencies; needs Node 18+ (global fetch).
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHOLAR_USER = 'dt6RATUAAAAJ';
const SCHOLAR_URL = `https://scholar.google.com/citations?user=${SCHOLAR_USER}&hl=en&view_op=list_works&sortby=pubdate&cstart=0&pagesize=100`;
const CONTACT = 'xzhang84@mgh.harvard.edu';          // for Crossref's polite pool
const ME = { family: 'zhang', initial: 'x' };        // first-author detection

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'data', 'publications.js');
const DRY_RUN = process.argv.includes('--dry-run');
const INCLUDE_PREPRINTS = process.argv.includes('--include-preprints');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

// ---------- helpers ----------
const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
  .replace(/&hellip;/g, '…').replace(/\s+/g, ' ').trim();
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, ''));
const normTitle = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

// Dice similarity on character bigrams, tolerant to small title edits
function similarity(a, b) {
  a = normTitle(a); b = normTitle(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const grams = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const A = grams(a), B = grams(b); let hit = 0;
  for (const [g, n] of A) if (B.has(g)) hit += Math.min(n, B.get(g));
  return (2 * hit) / (a.length - 1 + b.length - 1);
}

// "X Zhang" -> "Zhang X", "MP Ottensmeyer" -> "Ottensmeyer MP", "G El Fakhri" -> "El Fakhri G"
function scholarAuthorToSite(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  const initials = parts[0].replace(/\./g, '');
  return parts.slice(1).join(' ') + ' ' + initials;
}
function crossrefAuthorToSite(a) {
  const family = (a.family || a.name || '').trim();
  const initials = (a.given || '').split(/[\s.-]+/).filter(Boolean).map(p => p[0].toUpperCase()).join('');
  return initials ? `${family} ${initials}` : family;
}
function formatAuthors(list) {
  // site convention: list up to six, otherwise first three + et al.
  if (list.length > 6) return list.slice(0, 3).join(', ') + ', et al.';
  return list.join(', ');
}
function isMe(siteName) {
  const m = siteName.toLowerCase().match(/^([a-z' -]+)\s+([a-z]+)$/);
  return !!m && m[1].trim() === ME.family && m[2].startsWith(ME.initial);
}

const VENUE_MAP = [
  [/nuclear science symposium|medical imaging conference|NSS\/MIC/i, 'IEEE NSS/MIC'],
  [/^medical physics$/i, 'Med Phys'],
  [/^physics in medicine (and|&) biology$/i, 'Phys Med Biol'],
  [/radiation and plasma medical sciences/i, 'IEEE Trans Radiat Plasma Med Sci'],
  [/transactions on nuclear science/i, 'IEEE Trans Nucl Sci'],
  [/transactions on instrumentation and measurement/i, 'IEEE Trans Instrum Meas'],
  [/^journal of nuclear medicine/i, 'J Nucl Med'],
  [/nuclear instruments and methods.*section a/i, 'Nucl Instrum Methods A'],
  [/^arxiv/i, 'arXiv preprint'],
];
function normaliseVenue(raw) {
  const v = raw.replace(/\s*\(.*?\)\s*$/, '').replace(/[.,;:\s…]+$/, '').trim();
  for (const [re, name] of VENUE_MAP) if (re.test(v)) return name;
  return v.replace(/\./g, '');
}

// ---------- 1. Scholar ----------
async function fetchScholar() {
  const res = await fetch(SCHOLAR_URL, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
  const html = await res.text();
  if (res.status !== 200 || /unusual traffic|not a robot|recaptcha/i.test(html)) {
    throw Object.assign(new Error(`Google Scholar refused the request (HTTP ${res.status}). Nothing was changed.`), { code: 2 });
  }
  const rows = [...html.matchAll(/<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g)].map(m => m[1]);
  if (!rows.length) throw Object.assign(new Error('Scholar page had no publication rows; layout may have changed.'), { code: 2 });

  return rows.map(row => {
    const title = stripTags((row.match(/class="gsc_a_at">([\s\S]*?)<\/a>/) || [])[1] || '');
    const grays = [...row.matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/g)].map(m => m[1]);
    const authorsRaw = stripTags(grays[0] || '');
    const venueRaw = stripTags((grays[1] || '').replace(/<span class="gs_oph">[\s\S]*?<\/span>/, ''));
    const year = Number((row.match(/class="gsc_a_h[^"]*">(\d{4})</) || [])[1]) || null;
    const cid = (row.match(/citation_for_view=([^&"]+)/) || [])[1] || '';
    const truncated = /…|\.\.\.$/.test(authorsRaw);
    const authors = authorsRaw.replace(/[…]|\.\.\.$/g, '').split(',').map(s => s.trim()).filter(Boolean).map(scholarAuthorToSite);
    return {
      title, year, venueRaw, cid,
      authors: formatAuthors(authors) + (truncated && authors.length <= 6 ? ', et al.' : ''),
      isPreprint: /^arxiv|preprint|biorxiv|medrxiv|ssrn/i.test(venueRaw),
      url: `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${SCHOLAR_USER}&citation_for_view=${cid}`,
    };
  }).filter(p => p.title && p.year);
}

// ---------- 2. Crossref ----------
async function lookupCrossref(title) {
  const url = `https://api.crossref.org/works?rows=3&select=DOI,title,author,container-title,short-container-title,issued&query.bibliographic=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': `xizhang84.github.io publication sync (mailto:${CONTACT})` } });
    if (!res.ok) return null;
    const items = (await res.json()).message?.items || [];
    for (const it of items) {
      const t = (it.title || [])[0] || '';
      if (similarity(t, title) >= 0.88) {
        const year = it.issued?.['date-parts']?.[0]?.[0] || null;
        const venue = (it['short-container-title'] || [])[0] || (it['container-title'] || [])[0] || '';
        return { doi: it.DOI, year, venue, authors: (it.author || []).map(crossrefAuthorToSite).filter(Boolean) };
      }
    }
  } catch (e) { /* offline or rate limited: fall back to Scholar data */ }
  return null;
}

// ---------- 3. existing data ----------
function loadExisting() {
  const src = fs.readFileSync(DATA_FILE, 'utf8');
  const body = src.replace(/^[\s\S]*?window\.PUBLICATIONS\s*=\s*/, '').replace(/;\s*(window\.PUBLICATIONS_UPDATED[\s\S]*)?$/, '');
  return new Function(`return (${body});`)();
}

function serialise(pubs, updatedOn) {
  const years = [...new Set(pubs.map(p => p.year))].sort((a, b) => b - a);
  const q = (s) => JSON.stringify(String(s ?? ''));
  let out = 'window.PUBLICATIONS = [\n';
  years.forEach((y, i) => {
    out += `  // ${y}\n`;
    for (const p of pubs.filter(p => p.year === y)) {
      out += `  { year: ${p.year}, authors: ${q(p.authors)}, title: ${q(p.title)}, venue: ${q(p.venue)}, doi: ${q(p.doi)}, url: ${q(p.url)}, firstAuthor: ${!!p.firstAuthor}, coFirst: ${!!p.coFirst} },\n`;
    }
    if (i < years.length - 1) out += '\n';
  });
  out += '];\n';
  out += `window.PUBLICATIONS_UPDATED = ${q(updatedOn)};\n`;
  return out;
}

// ---------- main ----------
(async () => {
  const existing = loadExisting();
  console.log(`Existing publications: ${existing.length}`);

  const scholar = await fetchScholar();
  console.log(`Scholar lists ${scholar.length} items`);

  const fresh = scholar.filter(s => !existing.some(e => similarity(e.title, s.title) >= 0.9));
  const skippedPreprints = fresh.filter(s => s.isPreprint && !INCLUDE_PREPRINTS);
  const toAdd = fresh.filter(s => !(s.isPreprint && !INCLUDE_PREPRINTS));
  for (const s of skippedPreprints) console.log(`  skip preprint: ${s.title}`);
  if (!toAdd.length) { console.log('No new publications.'); return; }

  const added = [];
  for (const s of toAdd) {
    const cr = await lookupCrossref(s.title);
    const authors = cr && cr.authors.length ? formatAuthors(cr.authors) : s.authors;
    const first = authors.split(',')[0].trim();
    const entry = {
      year: cr?.year || s.year,
      authors,
      title: s.title,
      venue: normaliseVenue(cr?.venue || s.venueRaw),
      doi: cr?.doi || '',
      url: cr?.doi ? `https://doi.org/${cr.doi}` : s.url,
      firstAuthor: isMe(first),
      coFirst: false,
    };
    added.push(entry);
    console.log(`  + ${entry.year} ${entry.title}${entry.doi ? ` (doi:${entry.doi})` : ' (no DOI found, linking to Scholar)'}`);
  }

  // new entries go to the top of their year; existing order is kept
  const merged = [...added, ...existing];
  const today = new Date().toISOString().slice(0, 10);
  if (DRY_RUN) { console.log('\n--dry-run: not writing. Would add', added.length, 'entries.'); return; }
  fs.writeFileSync(DATA_FILE, serialise(merged, today));
  console.log(`Wrote ${merged.length} publications to ${path.relative(ROOT, DATA_FILE)}`);
})().catch(err => {
  console.error(err.message);
  process.exit(err.code || 1);
});
