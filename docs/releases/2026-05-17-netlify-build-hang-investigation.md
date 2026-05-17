# Netlify build hang investigation — 2026-05-17

## Scope

Build-forensics pass only. No product behaviour was intentionally changed.

## Executive finding

`pnpm build:netlify` is **not hanging in Netlify packaging**. The same failure reproduces in plain `pnpm build`, before Netlify-specific work begins.

The primary reproducible blocker is the custom **server-side webpack `splitChunks`** block in `next.config.mjs`.

- With that block present, both `pnpm build:netlify` and plain `pnpm build` stalled in Next/Webpack `compile`.
- The partial server webpack cache produced a single pack file of approximately **1.2 GB**:
  - `.next/cache/webpack/server-production/3.pack` = `1,205,681,114` bytes
- Removing only the server-side `splitChunks` block allowed one clean diagnostic build to advance past compile:
  - `Compiled successfully in 15.1min`
  - `Finished TypeScript in 2.2min`
  - then reached `Collecting page data using 7 workers ...`

This isolates the original reported hang to a **compile-stage build configuration problem**, not a page-data route, stale lock, Contentlayer generation, or Netlify plugin.

## Last successful stage / hang stage

### Original state

- Last stable emitted line:
  - `Creating an optimized production build ...`
- Next diagnostics:
  - `.next/diagnostics/build-diagnostics.json`
  - `buildStage: "compile"`
- Netlify-specific packaging had **not** begun.

### Diagnostic run with server-side `splitChunks` removed

- Last confirmed successful stages:
  - `Compiled successfully in 15.1min`
  - `Finished TypeScript in 2.2min`
- Next observed stage:
  - `Collecting page data using 7 workers ...`

That later diagnostic run also exposed a second issue: build-time Redis initialization during page-data collection.

## Build command chain

`package.json` / `netlify.toml` / `next.config.mjs` inspection produced this call graph:

```text
build:netlify
  -> pnpm mdx:gate
  -> pnpm contentlayer:clean
  -> pnpm contentlayer2 build
  -> node scripts/ensure-contentlayer-index.mjs
  -> node scripts/generate-briefs-registry.mjs
  -> pnpm mdx:integrity
  -> pnpm build:fast
       -> tsx scripts/build-pdf-registry-json.ts
       -> next build --webpack
       -> node scripts/clean-standalone.mjs
```

`netlify.toml` uses `@netlify/plugin-nextjs`, but no run reached plugin packaging before the initial hang.

## Concrete evidence

### 1. Plain Next build reproduces the same failure

Both commands stalled at the same compile stage:

```text
pnpm build:netlify
pnpm build
```

Therefore the hang is not specific to Netlify packaging.

### 2. Contentlayer is not the original hang

Standalone commands completed:

```text
pnpm contentlayer2 build
node scripts/ensure-contentlayer-index.mjs
```

Both exited cleanly. The repair script does not watch or spawn long-running children.

### 3. The server webpack cache explodes with the custom splitChunks config

Observed while stalled in compile:

```text
.next/cache/webpack/server-production/3.pack      1,205,681,114 bytes
.next/cache/webpack/server-production/0.pack        194,641,864 bytes
.next/cache/webpack/server-production/index.pack    180,884,176 bytes
```

The trace also showed hundreds of long-lived `add-entry` events while remaining in `compile`.

### 4. Removing only server-side splitChunks changes the build state

With the server-side `splitChunks` block temporarily removed from `next.config.mjs`, a diagnostic run advanced beyond compile and TypeScript into page-data collection. That is the strongest isolation result from this pass.

### 5. Secondary build hazards found after compile was unblocked

These were not the original root cause, but they are genuine build hazards worth fixing in the next pass:

#### Unsafe browser graph imports

Trace evidence showed `lib/prisma.ts` being compiled into browser layers through:

- `pages/consulting/index.tsx`
  - `lib/alignment/evidence-loader.ts`
  - `lib/product/financial-exposure-persistence.ts`
- `app/settings/integrations/page.tsx`
  - broad `lib/integrations` barrel
  - `lib/integrations/token-store.ts`

#### Server-action browser graph bloat

Trace evidence showed `action-browser` pulling server-heavy dependencies through:

- `app/actions/request-access.ts`
  - `lib/mail.ts`
  - `lib/mail/enterprise-mail-service.ts`
  - `lib/email/core/sendEmail.ts`
  - `emails/ContactEmail.tsx`
  - `@react-email/*`
- `app/actions/briefing.ts`
- `app/actions/governance.ts`
  - both transitively pull Prisma-backed governance code

#### Import-time Redis side effect

When compile was bypassed experimentally, page-data collection emitted:

```text
[Redis] Initializing Script-Mode connection
```

`lib/redis.ts` currently creates a client at module import time via:

```ts
export const redis = getRedis();
export const redisClient = redis;
```

That means merely importing the module can open Redis during build evaluation.

## Route / import audit summary

### Confirmed clean

- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files under `pages/`
- No `__tests__` directory under `pages/`
- `pnpm typecheck` passes
- `pnpm doctrine:audit` passes
- `pnpm surfaces:audit` passes
- `pnpm vitest run` previously passed: `118 files / 1,354 tests`
- `git diff --check` passes

### Classification

| Class | Finding |
| --- | --- |
| Safe in API / SSR-only code | Most top-level Prisma imports in API routes and explicit server pages |
| Unsafe top-level page import | `pages/consulting/index.tsx` importing server-backed helpers used only to render already-loaded data |
| Unsafe client bundle import | `app/settings/integrations/page.tsx` importing the broad integrations barrel |
| Needs lazy import / server boundary tightening | `app/actions/request-access.ts`, `app/actions/briefing.ts`, `app/actions/governance.ts` |

## Recommended fix order

1. **Remove or redesign the server-side `splitChunks` override in `next.config.mjs`.**
   - This is the primary root cause isolated in this pass.
2. **Move client-safe helper functions out of server-backed modules.**
   - Keep browser pages from importing Prisma-adjacent modules.
3. **Lazy-load server-only dependencies inside client-imported server actions.**
   - Especially mail and governance dependencies.
4. **Make Redis compatibility exports import-safe.**
   - Preserve runtime behaviour but do not instantiate a client merely by importing `lib/redis.ts`.
5. Re-run the full clean verification sequence.

## Verification commands run

```text
pnpm contentlayer2 build
node scripts/ensure-contentlayer-index.mjs
pnpm build
pnpm build:netlify
pnpm typecheck
```

Additional forensics performed:

```text
DEBUG=next:* timed build captures
plain next build comparison
route/import scans with rg
test-file exclusion scan under pages/
webpack cache size inspection
.next/trace parent-chain analysis
```

## Deployment safety

**Not safe to deploy yet.**

Reason: `pnpm build:netlify` still does not complete cleanly in the local environment, and the production deployment path should not be considered green until the primary compile-stage issue is fixed and the full verification sequence completes.

## Outcome

**B. Concrete root cause identified; fix should be taken in a focused build-remediation pass.**

This pass proves:

- the original blocker is **Next/Webpack compile**, not Netlify packaging;
- the most direct root cause is the **custom server-side splitChunks config**;
- additional import-boundary and Redis issues become visible once compile is allowed to advance.
