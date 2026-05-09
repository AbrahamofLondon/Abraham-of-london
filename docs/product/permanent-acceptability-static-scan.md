# Permanent Acceptability Static Scan

**Date:** 2026-05-09
**Scope:** All .tsx files in pages/ and components/ directories

---

## Scan Results

| Pattern | Matches | Classification | Action |
|---------|---------|---------------|--------|
| AI-accelerated market baseline | 0 | — | CLEAN |
| AI baseline | 0 user-facing | — | CLEAN |
| machine learning | 0 | — | CLEAN |
| neural network | 0 | — | CLEAN |
| proprietary model | 0 | — | CLEAN |
| kernel (rendered text) | 0 after fix | — | CLEAN (was 1: "V2.2 sovereign routing kernel" → fixed) |
| raw graph / graph mechanics / graph edges | 0 | — | CLEAN |
| arbiter rules | 0 | — | CLEAN |
| scoring formula | 0 | — | CLEAN |
| proprietary (vague claims) | 0 after fix | — | CLEAN (was 3: trust.tsx, method.tsx ×2 → fixed) |
| algorithm | 1 | SAFE_PUBLIC_BOUNDARY | "Not the algorithm. The clarity." — anti-positioning |
| verified (overclaim) | 0 after fix | — | CLEAN (was 2: OGR components → fixed to "measured") |
| guaranteed (positive claim) | 0 | — | All uses are in negation ("does not guarantee") |
| proved / proven (truth claim) | 0 | — | All uses are prompts ("What would prove...") or editorial content |
| unlock (SaaS) | 0 | — | CLEAN (guard script confirms) |
| Upgrade Now | 0 | — | CLEAN (guard script confirms) |
| premium (user-facing text) | 2 | SAFE_INTERNAL | Inner Circle tier identifiers (CSS/sort), not rendered labels |
| consulting (href) | 0 | — | CLEAN (guard script confirms) |
| advisory (trust components) | 0 | — | CLEAN |
| advisory (homepage rendered) | 2 | COMMENT_ONLY / DEPRECATED | CinematicHero (deprecated), EngagementLanes (secondary) |
| book a call | 0 | — | CLEAN |
| contact us | 1 | SAFE_PUBLIC_BOUNDARY | Legal/refund policy context |
| threshold (rendered text) | 4 | SAFE_PUBLIC_BOUNDARY | All describe governance policy ("evidence threshold"), not internal values |

---

## REWRITE_REQUIRED Items — All Fixed

| Item | File | Before | After |
|------|------|--------|-------|
| 1 | `pages/diagnostics/constitutional-diagnostic.tsx:315` | "V2.2 sovereign routing kernel" | "Constitutional routing system" |
| 2 | `pages/trust.tsx:79` | "proprietary validation" | "internal validation" |
| 3 | `pages/method.tsx:71` | "proprietary contradiction engine" | "governed contradiction detection system" |
| 4 | `pages/method.tsx:87` | "proprietary dimensions" | "structural dimensions" |
| 5 | `components/alignment/OGRHandoverDocument.tsx:84` | "verified Resonance Fidelity" | "measured Resonance Fidelity" |
| 6 | `components/alignment/OGRCoherenceLock.tsx:120` | "verified against" | "measured against" |

**Zero REWRITE_REQUIRED items remain.**

---

## Guard Script Results

| Script | Files Scanned | Violations | Status |
|--------|--------------|------------|--------|
| `scripts/public-copy-guard.mjs` | 1,019 | 0 | PASS |
| `scripts/evidence-posture-guard.mjs` | 2,600 | 0 | PASS |
| `scripts/earned-progression-guard.mjs` | 1,019 | 0 | PASS |
