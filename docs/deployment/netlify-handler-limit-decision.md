# Netlify Handler Size — Autopsy and Decision Record

**Date:** 2026-05-26  
**Status:** Active investigation — handler size not yet measured post-fix  
**Limit:** Netlify Lambda unzipped upload limit = 250 MB (hard), 240 MB (gate fail), 220 MB (gate warn)

---

## Root Cause Summary

The `___netlify-server-handler` Lambda function is packaged by `@netlify/plugin-nextjs` from
`.next/standalone/`. The handler exceeded the 250 MB Netlify limit for the following reasons,
in order of impact:

### 1. `.next/standalone/` was absent (highest impact)

The last local build (`pnpm build:fast`) completed page generation (543 pages) but the standalone
directory copy phase was interrupted or failed before completion. `required-server-files.json`
correctly records `output: "standalone"` but `.next/standalone/` was never written.

Without `.next/standalone/`, `@netlify/plugin-nextjs` v5 falls back to packaging the full
project tree. The `.next/` directory is 3.2 GB on this project.

**Fix:** Run `pnpm build:fast` to completion. Verify `.next/standalone/` exists before deploying.

### 2. Build-only packages contaminating the NFT trace (medium impact)

Analysis of `.next/next-server.js.nft.json` (3042 files) showed these build-only packages
traced as runtime dependencies:

| Package | Files in trace | Est. size | Classification |
|---|---|---|---|
| `webpack` | 642 | ~15 MB | BUILD_ONLY |
| `caniuse-lite` | 597 | ~3 MB | BUILD_ONLY |
| `@webassemblyjs` | 49 | ~2 MB | BUILD_ONLY |
| `enhanced-resolve` | 48 | ~1 MB | BUILD_ONLY |
| `postcss` | 29 | ~2 MB | BUILD_ONLY |
| `webpack-sources` | 25 | ~1 MB | BUILD_ONLY |
| `critters` | 20 | ~0.5 MB | BUILD_ONLY |
| `terser-webpack-plugin` | 20 | ~1 MB | BUILD_ONLY |
| `uglify-js` | 15 | ~0.5 MB | BUILD_ONLY |
| `eslint-scope` | 11 | ~0.2 MB | BUILD_ONLY |

Estimated bloat from build tools: **~26 MB** (conservative).

**Fix:** Added to three exclusion layers (see below).

### 3. `external_node_modules` misconfiguration (no impact — was a documentation error)

`netlify.toml` `[functions]` block had a misleading comment claiming `external_node_modules`
reduces the handler size. This config applies only to custom functions in
`netlify/functions_src/functions`, NOT to `___netlify-server-handler`. The comment has been
corrected. The `[functions."___netlify-server-handler"]` `excluded_files` block is the correct
mechanism for the plugin handler.

---

## Fixes Applied

Three exclusion layers now strip build-only packages:

### Layer 1 — `next.config.mjs` `outputFileTracingExcludes`
Prevents build-only packages from entering the NFT trace during `next build`.
Added: `webpack/**`, `webpack-sources/**`, `enhanced-resolve/**`, `@webassemblyjs/**`,
`acorn/**`, `eslint-scope/**`, `postcss/**`, `critters/**`, `beasties/**`, `terser/**`,
`terser-webpack-plugin/**`, `uglify-js/**`, `caniuse-lite/**`, `browserslist/**`,
`electron-to-chromium/**`.

### Layer 2 — `scripts/clean-standalone.mjs` `REMOVE_DIRS`
Physically removes build-only packages from `.next/standalone/` after `next build`.
Runs as part of `pnpm build:fast`. Same package list as Layer 1.
This is the most reliable layer — it acts on the filesystem directly.

### Layer 3 — `netlify.toml` `[functions."___netlify-server-handler"]` `excluded_files`
Netlify strips matching files from the handler zip at upload time.
Applied even if Layers 1 and 2 do not fully exclude a package.
Same package list as Layers 1 and 2.

---

## Dependency Classification (from NFT trace audit)

| Package | Files | Classification | Notes |
|---|---|---|---|
| `next` | 1191 | EXPECTED_RUNTIME | Next.js server core |
| `webpack` | 642 | BUILD_ONLY — fixed | Removed by 3-layer exclusion |
| `caniuse-lite` | 597 | BUILD_ONLY — fixed | Browser compat data, build time only |
| `@webassemblyjs` | 49 | BUILD_ONLY — fixed | webpack wasm parser |
| `@opentelemetry` | 48 | EXPECTED_RUNTIME | Next.js request tracing |
| `enhanced-resolve` | 48 | BUILD_ONLY — fixed | webpack module resolution |
| `ajv` | 43 | EXPECTED_RUNTIME | Schema validation used at runtime |
| `postcss` | 29 | BUILD_ONLY — fixed | CSS processing, build time only |
| `webpack-sources` | 25 | BUILD_ONLY — fixed | webpack dependency |
| `semver` | 21 | EXPECTED_RUNTIME | Package version resolution |
| `critters` | 20 | BUILD_ONLY — fixed | Critical CSS extraction |
| `terser-webpack-plugin` | 20 | BUILD_ONLY — fixed | Minification |
| `sharp` | 14 | EXPECTED_RUNTIME | Image processing (traced despite `unoptimized: true`) |
| `react-dom` | 14 | EXPECTED_RUNTIME | SSR rendering |
| `eslint-scope` | 11 | BUILD_ONLY — fixed | webpack/acorn parse scope |

---

## Import Graph Audit (Part 4)

Scanned `lib/research/engines/**`, `lib/research/engine-registry.ts`,
`lib/research/module-registry.ts`, `lib/research/fixture-registry.ts`,
`app/api/admin/**`, `app/api/**` for top-level heavy SDK imports.

**Result: 0 violations.**

- All engine adapters: `import type` only for heavy deps, `server-only` guard, no top-level SDK imports
- `app/api/search/route.ts`: `import OpenAI from "openai"` — EXPECTED_RUNTIME (search functionality)
- `@react-pdf/renderer` imports: all `import type` — no runtime trace impact

---

## Options if Handler Remains Oversized Post-Fix

If after a clean `pnpm build:netlify` + `netlify build` the handler still exceeds 240 MB:

### Option A — Add `openai` to `serverExternalPackages` (low risk, ~1 MB saving)
Move `openai` to `serverExternalPackages` in `next.config.mjs`. Reduces bundle size but
requires the package to be available as an external module in the Lambda environment.

### Option B — Migrate heavy admin routes to a separate Netlify Function (medium effort)
Move admin-only routes (`/admin/**`) to a dedicated function that is NOT the main handler.
This separates the Foundry runtime from the public-facing server. Complex — requires routing
changes and possibly a second Next.js app or standalone API server.

### Option C — Switch to Netlify Edge Functions for SSG/ISR pages (high effort)
Netlify Edge Functions have no bundle size limit (they run on V8 isolates, not Lambdas).
Suitable for statically-rendered pages. Dynamic routes (admin, API) would stay on the Lambda.
Requires configuration changes and potentially partial migration.

### Option D — Switch hosting to Vercel (low effort, cost consideration)
Vercel (Next.js's original host) has a larger Lambda limit (250 MB unzipped), uses native
Next.js standalone mode, and is the reference deployment target for Next.js 16. Migration
involves updating DNS, environment variables, and removing `@netlify/plugin-nextjs`.

---

## Verification After Fix

Run this sequence after a clean build:

```bash
Remove-Item -Recurse -Force .next,.netlify
pnpm prisma generate
pnpm contentlayer2 build
pnpm typecheck
pnpm vitest run tests/series tests/research tests/platform tests/outbound tests/intelligence tests/research/canary
pnpm build:netlify
# Then trigger netlify build to package the handler:
netlify build --dry
node scripts/check-netlify-handler-size.mjs
node scripts/market-readiness-gate.mjs
git diff --check
```

Expected outcomes:
- `.next/standalone/` exists after `pnpm build:fast`
- `clean-standalone.mjs` reports build-only packages removed
- Handler size gate: PASS (< 220 MB) or WARN (220–240 MB) or FAIL (> 240 MB)
- `market-readiness-gate.mjs` Gate 9 passes

---

## What Was NOT Changed

Per brief constraints:
- Stripe, MDX, series resolver, product logic — not touched
- Foundry engine implementations — not touched
- No new features, no refactoring, no Foundry expansion
- No destructive actions — running node processes were not killed
