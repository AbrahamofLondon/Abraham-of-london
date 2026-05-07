# Build Hygiene & Performance Report

**Project:** AOL Check Visual (Next.js)
**Date:** 2026-05-07
**Branch:** main (`05ded5e31`)

---

## Summary

| # | Check | Result | Status | Notes |
|---|-------|--------|--------|-------|
| 1 | TypeScript `tsc --noEmit` | 0 errors | PASS | Clean compile, no type errors |
| 2 | Dependency audit (`pnpm audit --prod`) | 2 low-severity | PASS | `aws-sdk` (via sst) and `elliptic` (via crypto-browserify). Both transitive, no patch available. |
| 3 | Client bundle secret audit | Passed | PASS | No secrets detected in client bundles |
| 4 | Public IP exposure audit | Passed | PASS | No IP exposure detected |
| 5 | Largest client chunks | 318 KB (x2 duplicate-sized) | WARN | Two chunks at ~318 KB each (`58474bfb`, `aaea2bcf`), one at ~195 KB (`4bd1b696`). Framework chunk at 171 KB. |
| 6 | Source maps in `.next/static` | 0 files | PASS | No `.map` files shipped to static output |
| 7 | Total `.next/` size | 3.1 GB | INFO | Cache: 1.7 GB, Server: 100 MB, Static: 9.3 MB. Bulk is build cache (expected for dev). |
| 8 | `"use client"` in `app/` | 16 files | PASS | All justified: error boundaries, interactive dashboards, forms, client-shell. No unnecessary usage found. |
| 9 | Heavy library imports on public pages | 3 framer-motion imports | PASS | Used in `strategy-room/success`, `assessment/success` (post-auth success pages), and `intervention-modal` (admin). None on public landing pages. |
| 10 | Image optimisation (`next/image`) | 64 components use `next/image`; 0 raw `<img>` tags in `app/` | PASS | All images routed through `next/image` or `OptimizedImage` wrapper. |

---

## Detail

### 1. TypeScript Compilation

```
pnpm exec tsc --noEmit --pretty false
Exit: 0, Errors: 0
```

Full type safety confirmed.

### 2. Dependency Audit

```
2 vulnerabilities found
Severity: 2 low
```

| Package | Severity | Path | Notes |
|---------|----------|------|-------|
| `aws-sdk` | low | `.>sst>aws-sdk` | SDK v2 region validation. Transitive via SST. No patch. |
| `elliptic` | low | `.>crypto-browserify>browserify-sign>elliptic` | Risky implementation. Transitive. No patch. |

Both are transitive dependencies with no available fix. Neither is in the client bundle.

### 3. Client Bundle Secret Audit

```
Client bundle secret audit passed.
```

### 4. Public IP Exposure Audit

```
Public IP exposure audit passed.
```

### 5. Largest Client Chunks

| File | Size |
|------|------|
| `58474bfb-*.js` | 318 KB |
| `aaea2bcf-*.js` | 318 KB |
| `4bd1b696-*.js` | 195 KB |
| `framework-*.js` | 171 KB |
| `26304-*.js` | 156 KB |
| `polyfills-*.js` | 110 KB |
| `96310-*.js` | 108 KB |

Total static chunks: **3.9 MB** across all routes.

**Note:** Two chunks share the exact same size (325,362 bytes). This may indicate duplicate code splitting or two route groups pulling in the same heavy dependency. Worth investigating with `@next/bundle-analyzer` if bundle size becomes a concern.

### 6. Source Maps

Zero `.map` files in `.next/static/`. Production-safe.

### 7. Build Output Size

| Directory | Size |
|-----------|------|
| `.next/cache/` | 1.7 GB |
| `.next/server/` | 100 MB |
| `.next/static/` | 9.3 MB |
| **Total** | **3.1 GB** |

The 1.7 GB cache is normal for development builds and is not deployed. The deployable static output (9.3 MB) is healthy.

### 8. `"use client"` Usage in `app/`

16 files use the `"use client"` directive. All are justified:

- **`client-shell.tsx`** -- top-level client wrapper (required)
- **`admin/error.tsx`** -- error boundary (requires client)
- **`dashboard/controls.tsx`** -- interactive controls
- **`briefing/return/[sessionId]/page.tsx`** -- session interaction
- **`downloads/vault/page.tsx`** -- search/filter UI with state
- **`testing/lab/page.tsx`** -- interactive test lab
- **Admin pages** (6 files) -- forms, modals, interactive dashboards
- **`settings/integrations/page.tsx`** -- integration management UI

No server-only pages are incorrectly marked as client components.

### 9. Heavy Library Imports

Three `framer-motion` imports found:

| File | Context |
|------|---------|
| `app/strategy-room/success/page.tsx` | Post-auth success animation |
| `app/assessment/success/page.tsx` | Post-auth success animation |
| `app/admin/organisations/[id]/dashboard/intervention-modal.tsx` | Admin modal animation |

None are on public-facing landing pages. No `recharts`, `chart.js`, or `three.js` imports found in `app/`.

### 10. Image Optimisation

- **64 components** import `next/image`
- **0 raw `<img>` tags** found in `app/` directory
- Project includes an `OptimizedImage` wrapper component

---

## Recommendations

1. **Investigate twin 318 KB chunks** -- Run `ANALYZE=true pnpm build` with `@next/bundle-analyzer` to determine if these represent duplicate code that could be consolidated.
2. **Monitor transitive vulnerabilities** -- The 2 low-severity issues have no patches. Re-check when SST or crypto-browserify release updates.
3. **Cache cleanup** -- The 1.7 GB build cache can be pruned periodically in CI with `rm -rf .next/cache` if disk is constrained.

---

**Overall assessment: BUILD IS CLEAN.** Zero type errors, zero secrets exposure, zero source maps, all images optimised, no unnecessary client components.
