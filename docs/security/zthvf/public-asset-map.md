# ZTHVF Phase 1 -- Public Asset Surface Map

> Generated: 2026-05-07
> Scope: `public/` directory, `.next/static/`, sensitive file patterns

---

## Summary

| Metric | Value |
|---|---|
| Total files in `public/` | 760 |
| Directories with files | 44 |
| Sensitive flags raised | 7 |

---

## File Inventory by Directory

### Root (`public/`)
**24 files**

| File | Type | Flag |
|---|---|---|
| `410.html` | HTML | -- |
| `_redirects` | Netlify config | LOW -- exposes redirect rules |
| `browserconfig.xml` | MS config | -- |
| `contact.html` | HTML | -- |
| `fathering-without-fear-cover.jpg` | Image | -- |
| `favicon.ico` | Favicon | -- |
| `file.svg` | SVG | -- |
| `forms.html` | HTML | -- |
| `globe.svg` | SVG | -- |
| `grid.txt` | Text | -- |
| `humans.txt` | Text | -- |
| `manifest.json` | PWA manifest | -- |
| `memoir.html` | HTML | -- |
| `next.svg` | SVG | -- |
| `robots.txt` | SEO config | -- |
| `search-index.json` | JSON | MEDIUM -- full-text search index publicly exposed |
| `site.webmanifest` | PWA manifest | -- |
| `sitemap-0.xml` | Sitemap | -- |
| `sitemap-static.xml` | Sitemap | -- |
| `sitemap.xml` | Sitemap | -- |
| `style.css` | CSS | -- |
| `sw.js` | Service Worker | LOW -- review for cached route leaks |
| `vercel.svg` | SVG | -- |
| `window.svg` | SVG | -- |

### `public/system/` (3 files) -- ELEVATED CONCERN
| File | Flag |
|---|---|
| `content-registry.json` | HIGH -- exposes full content graph/registry publicly |
| `intel-audit-log.json` | HIGH -- exposes audit/intelligence log publicly |
| `manifest.txt` | MEDIUM -- system manifest |

### `public/pdfs/` (1 file)
| File | Flag |
|---|---|
| `registry.json` | MEDIUM -- PDF registry metadata exposed publicly |

### `public/postcss/` (1 file)
| File | Flag |
|---|---|
| `no-slash-opacity.js` | LOW -- build tooling in public directory |

### `public/blog/` (1 file)
- `fathering-without-fear.json` -- blog data

### `public/content/` (1 file)
- `fathering-principles.mdx.txt` -- MDX content as text

### `public/images/` (1 file)
- `logo.txt` -- text placeholder

### `public/epubs/` (5 files)
- 4 `.epub` files (downloadable books)
- `epub-manifest.json` -- MEDIUM: manifest of epub assets

### `public/assets/downloads/` (83 files, incl. 1 subdirectory)
- 82 `.pdf.fingerprint` files in main directory
- 1 `.pdf.fingerprint` file in `content-downloads/` subdirectory
- These are fingerprint/hash files, not actual PDFs. No direct PDF content exposed.

### `public/assets/fonts/` (6 files)
- Font files (`.ttf`, `.woff2`): AoLSerif, EditorialNew, GeistMono, JetBrainsMono, PPEditorialNew, geist-black

### `public/assets/images/` (16 files in root + subdirectories)
Total across all image subdirectories: ~275 image files

| Subdirectory | Count | Types |
|---|---|---|
| `assets/images/` (root) | 16 | `.jpg`, `.webp`, `.svg` |
| `assets/images/blog/` | 32 | `.jpg`, `.svg`, `.webp` |
| `assets/images/books/` | 5 | `.jpg` |
| `assets/images/canon/` | 20 | `.jpg` |
| `assets/images/cta/` | 2 | `.jpg`, `.webp` |
| `assets/images/downloads/` | 127 | `.jpg` |
| `assets/images/events/` | 4 | `.jpg` |
| `assets/images/logo/` | 4 | `.svg`, `.jpg` |
| `assets/images/logos/` | 8 | `.svg`, `.jpeg` |
| `assets/images/playbooks/` | 3 | `.jpg` |
| `assets/images/prints/` | 7 | `.jpg` |
| `assets/images/resources/` | 5 | `.jpg` |
| `assets/images/shorts/` | 7 + 8 themes | `.jpg` |
| `assets/images/signature/` | 1 | `.svg` |
| `assets/images/social/mono/` | 8 | `.svg` |
| `assets/images/social/svg/` | 15 | `.svg`, `.jpg`, `.webp` |
| `assets/images/strategy/` | 1 | `.jpg` |
| `assets/images/artifacts/` | 2 | `.jpg` |

### `public/assets/vault/` (2 files) -- ELEVATED CONCERN
| File | Flag |
|---|---|
| `board-decision-log-template.xlsx` | MEDIUM -- downloadable Excel template |
| `operating-cadence-pack.pptx` | MEDIUM -- downloadable PowerPoint |

### `public/assets/video/` (4 files)
- `brand-reel-1080p.mp4`, `brand-reel-1080p.webm`, `brand-reel.mp4`, `brand-reel.webm`

### `public/assets/videos/shorts/` (10 files)
- 10 `.mp4` short-form video files

### `public/fonts/` (57 files)
- Inter font family (18pt, 24pt, 28pt variants), GeistMono, PPEditorialNew, geist-black
- All `.ttf` or `.woff2`

### `public/favicon/` (5 files)
- `favicon.ico`, `icon0.svg`, `manifest.json`, PWA icons (192x192, 512x512)

### `public/icons/` (4 files)
- `apple-icon.png`, `icon-192.png`, `icon-512.png`, `icon1.png`

### `public/downloads/` (29 `.pdf.fingerprint` files)
- Fingerprint/hash files only, not actual PDFs

### `public/lexicon/` (17 `.pdf.fingerprint` files)
- Fingerprint/hash files only

### `public/prints/` (6 `.pdf.fingerprint` files)
- Fingerprint/hash files only

### `public/resources/` (99 `.pdf.fingerprint` files)
- Fingerprint/hash files only -- covers frontier-resilience, institutional-alpha, sovereign-intelligence series

### `public/strategy/` (2 `.pdf.fingerprint` files)
- `institutional-governance.pdf.fingerprint`, `sample-strategy.pdf.fingerprint`

### `public/vault/briefs/` (96 `.pdf.fingerprint` files)
- Fingerprint/hash files for vault brief series (fr-*, ia-*, si-*)

### `public/vault/general/` (16 `.pdf.fingerprint` files)
- Fingerprint/hash files for general vault content

### `public/vault/intelligence/` (12 `.pdf.fingerprint` files)
- Strategic autonomy series fingerprints

---

## .next/static/ Assessment

The `.next/` build directory **does not exist** in the working tree. This project appears to deploy via Netlify (presence of `_redirects`, `netlify/` directory) rather than serving `.next/` directly.

- **Source maps (.map files):** None found
- **Build manifests:** None found (no `.next/` directory)

In production (Netlify), the `.next/static/` directory is served under `/_next/static/` with hashed filenames. Source map generation should be verified in `next.config.js` (`productionBrowserSourceMaps` setting).

---

## Sensitive File Scan

### Pattern: `*.env*`
| File | Risk |
|---|---|
| `.env` | CRITICAL if committed -- should be in `.gitignore` |
| `.env.local` | CRITICAL if committed -- should be in `.gitignore` |
| `.env.example` | LOW -- template only |
| `.env.local.example` | LOW -- template only |
| `scripts/environment/templates/development.env` | MEDIUM -- review for hardcoded secrets |
| `scripts/environment/templates/production.env` | MEDIUM -- review for hardcoded secrets |
| `scripts/environment/templates/staging.env` | MEDIUM -- review for hardcoded secrets |
| `scripts/environment/templates/validate.env` | MEDIUM -- review for hardcoded secrets |

### Pattern: `*key*`
| File | Risk |
|---|---|
| `lib/auth/key-generator.ts` | LOW -- code, not secrets |
| `lib/inner-circle/keys.client.ts` | MEDIUM -- review for embedded keys |
| `lib/inner-circle/keys.server.ts` | MEDIUM -- review for embedded keys |
| `lib/inner-circle/keys.ts` | MEDIUM -- review for embedded keys |
| `lib/keys.ts` | MEDIUM -- review for embedded keys |
| `lib/server/inner-circle/keys.ts` | MEDIUM -- review for embedded keys |
| `pages/api/admin/members/keys.ts` | LOW -- API route |

### Pattern: `*secret*`
| File | Risk |
|---|---|
| `lib/server/secrets-db.ts` | LOW -- code, reads from env |
| `lib/server/secrets.ts` | LOW -- code, reads from env |

### Pattern: `*credentials*`
- No files found matching this pattern outside node_modules.

---

## High-Priority Findings

1. **`public/system/intel-audit-log.json`** -- Audit/intelligence log data publicly accessible. Should be behind auth or removed from `public/`.
2. **`public/system/content-registry.json`** -- Full content registry exposed. Reveals internal content structure.
3. **`public/search-index.json`** -- Full-text search index. May contain content summaries that should be gated.
4. **`public/pdfs/registry.json`** -- PDF metadata registry exposed.
5. **`public/epubs/epub-manifest.json`** -- Epub manifest exposed.
6. **`public/assets/vault/`** -- Contains downloadable `.xlsx` and `.pptx` files with no auth gate (served statically).
7. **`public/sw.js`** -- Service worker should be reviewed for cached route patterns that could leak protected content paths.
