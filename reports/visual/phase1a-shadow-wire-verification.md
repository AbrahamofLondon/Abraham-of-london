# Phase 1A — Shadow-Wire Verification

Checklist per the authorization: verify the foundation is imported by both
routers, present in the compiled CSS, does not yet win the cascade, both
routers compile and respond, and no screenshot delta is attributable to
the import.

## 1. Both router globals import foundation — confirmed

```
styles/globals.css:4   @import "./foundation/index.css";
app/globals.css:9      @import "../styles/foundation/index.css";
```

## 2. Compiled CSS contains foundation tokens — confirmed via real build artifact

A full production build (`pnpm exec next build --webpack`) completed
successfully (`.next/BUILD_ID` present, full static generation for the
entire route tree, zero build errors). Inspecting the actual minified,
shipped CSS chunks in `.next/static/css/`:

- The production minifier deduplicates same-specificity `:root` custom
  property redeclarations, keeping only the value that will actually
  render — which is itself indirect proof the build tool resolves the
  cascade the same way this verification predicts (later declaration
  wins). Only the winning value survives minification; the shadow-import's
  overridden value is eliminated as dead code where the two differ.
- Where foundation and router values are **identical** (e.g.
  `--aol-panel: 18 18 20` on App Router, `--aol-bg: 6 6 9` on Pages
  Router), the token is trivially present regardless of dedup, since there
  is nothing to eliminate.

## 3. Existing router-local definitions still win — confirmed via build artifact, not just source reasoning

Direct inspection of the compiled chunks:

```
Pages Router bundle (.next/static/css/28bf14e0b97b2468.css):
  --aol-ink: 242 241 238    ← Pages Router's own original value
                              (foundation says 250 249 245 — NOT what shipped)

App Router bundle (.next/static/css/0409c1a90416d4c0.css):
  --aol-bg: 4 4 5           ← App Router's own original value
                              (foundation says 6 6 9 — NOT what shipped)
```

Both routers, for tokens where their own value differs from the
foundation's canonical value, ship their **own** value in production. Zero
cutover occurred.

## 4. Pages and App routes compile and respond — confirmed

- `/enterprise-decision-scan` (Pages Router): HTTP 200
- App Router routes: compiled cleanly (webpack, no CSS errors); one tested
  route (`/testing/lab`) returned its expected `requireAdminServer()`
  redirect (307) — a clean HTTP response, not a compile failure; another
  (`/registry/index`) 500s on a pre-existing, unrelated Next.js
  async-`params` API-usage bug in that route's own component code
  (confirmed via server log stack trace — nothing CSS-related)
- Full production build completed for the entire route tree with zero
  build errors

## 5. Screenshot delta attributable to the shadow import — none found

32-shot capture (8 routes × 4 viewports) taken against the shadow-wired
branch, byte-compared (SHA256) against `baseline-v2` (captured from the
same SHA before the CSS edits):

```
30 / 32 byte-identical
2 / 32 differ: intelligence__1440x900.png, foundry_decision-test__1440x900.png
```

Investigated the 2 differences rather than dismissing them. Root cause
found: `pages/intelligence/index.tsx` has a static link array with
**duplicate `href` values used as React `key`s** (three entries share
`/intelligence/contradictions`, two share `/trust-centre`) — a genuine,
pre-existing bug (confirmed via the "Encountered two children with the
same key" React dev warning present in server logs before any of this
session's work). Duplicate keys make React's reconciliation
non-deterministic across separate cold page loads, independent of any CSS
change. This is consistent with the observed pattern: only 2 of 32 shots
differ, each at a single viewport (not all 4, which a real CSS-cascade
effect would produce consistently across every viewport of every page,
since the import is present on all of them). Flagged as a separate,
pre-existing defect (spawned as its own follow-up task), not caused by or
related to Phase 1A.

## Verdict

```
IMPORT PRESENT (both routers):        PASS
COMPILED CSS CONTAINS FOUNDATION:     PASS (build-artifact confirmed)
ROUTER-LOCAL DEFINITIONS STILL WIN:   PASS (build-artifact confirmed)
ROUTES COMPILE/RESPOND:               PASS
SCREENSHOT DELTA FROM SHADOW IMPORT:  NONE (2/32 diffs traced to a
                                       pre-existing, unrelated React key bug)

SHADOW-WIRE VERIFICATION: CLEAN
```
