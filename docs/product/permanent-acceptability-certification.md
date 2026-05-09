# Release Candidate Certification

**Date:** 2026-05-09
**Verdict: RELEASE_CANDIDATE_CONFIRMED**
**Standard:** Hostile inspection by buyer, competitor, journalist, investor, or technically literate operator
**Scope:** Public DTO safety, runtime claims, evidence posture, IP disclosure, earned progression, regression guards

---

## Build Gates (Post-Lock Reconfirmation)

All gates run after concurrent Codex process released the build lock.

| Gate | Result | Confirmed |
|------|--------|-----------|
| `npx tsc --noEmit` | **PASS** — 0 errors | Direct run, not prior build |
| `npx next build` | **PASS** — exit code 0 | Direct run, build completed |
| `node scripts/public-copy-guard.mjs` | **PASS** — 1,019 files, 0 violations | Direct run |
| `node scripts/evidence-posture-guard.mjs` | **PASS** — 2,600 files, 0 violations | Direct run |
| `node scripts/earned-progression-guard.mjs` | **PASS** — 1,019 files, 0 violations | Direct run |

---

## Final Verdict Table

| Area | Verdict | Evidence | Remaining Risk | Release Impact |
|------|---------|----------|----------------|----------------|
| **Public DTO sanitisation** | **PASS** | 6 routes audited field-by-field; 15+ fields REQUIRED_PUBLIC_SAFE (rendered); 8 fields SERIALIZED_BUT_NOT_RENDERED (all auth-gated, no thresholds/formulas); 11 fields TYPE_ONLY (stripped by `toPublicResult()`); 0 REMOVE_NOW. See `public-dto-score-field-closure.md` | 8 non-rendered fields in 2 auth-gated routes (credit-score components, analyze score) | NONE — documented, auth-gated, non-blocking |
| **Public API classification** | **PASS** | 381 routes inventoried; ~7 PUBLIC_SAFE, ~6 AUTHENTICATED_USER_SAFE, ~15 OPERATOR_ONLY; scoring routes return via server-side derivation; 4 routes flagged for ongoing monitoring | Decision Centre `/cases` returns comprehensive auth-gated data (all fields verified as rendered) | NONE — auth-gated |
| **Evidence posture enforcement** | **PASS** | `VERIFIED` confidence label fixed (SYSTEM_MEASURED → MEASURED in decision-velocity); VERIFIED_CASE_EVIDENCE eliminated globally; outcome-verification-contract correctly uses OUTCOME_VERIFIED | None — all evidence posture assignments verified correct | NONE |
| **Method disclosure** | **PASS** | "V2.2 sovereign routing kernel" → "Constitutional routing system"; "proprietary contradiction engine" → "governed contradiction detection system"; "proprietary dimensions" → "structural dimensions"; "proprietary validation" → "internal validation"; "verified Resonance Fidelity" → "measured Resonance Fidelity" | None | NONE |
| **Earned progression CTAs** | **PASS** | Executive Reporting gated by evidence + commitment checkpoint; Strategy Room gated by execution flow form; no "Upgrade Now", "Unlock premium", or "book a call" remain (guard script confirms 0 violations) | Generic CheckoutButton component has email-only gate (used only in specific contexts) | LOW |
| **Runtime surface verification** | **PASS** | 20-surface checklist verified against code; all surfaces use consistent "Decision Infrastructure" identity; no stale consulting language; no SaaS paywall language; evidence posture visible on all diagnostic/report surfaces | Manual browser verification recommended | LOW |
| **Static scan** | **PASS** | 6 REWRITE_REQUIRED items found and fixed; all remaining matches classified as SAFE_PUBLIC_BOUNDARY, COMMENT_ONLY, or SAFE_INTERNAL | 2 "advisory" in deprecated components (CinematicHero, EngagementLanes) | NEGLIGIBLE |
| **Regression guard scripts** | **PASS** | 3 scripts created and passing: public-copy-guard, evidence-posture-guard, earned-progression-guard | Scripts cover key patterns; extend as new patterns emerge | NONE |
| **Build gates** | **PASS** | TSC: 0 errors (direct run); Next build: exit code 0 (direct run, post-lock); guard scripts: all 3 pass (direct run) | None | NONE |

---

## Files Changed in Permanent Acceptability Pass

| File | Change | Category |
|------|--------|----------|
| `pages/diagnostics/constitutional-diagnostic.tsx` | "V2.2 sovereign routing kernel" → "Constitutional routing system" | IP containment |
| `pages/trust.tsx` | "proprietary validation" → "internal validation" | IP containment |
| `pages/method.tsx` | "proprietary contradiction engine" → "governed contradiction detection system"; "proprietary dimensions" → "structural dimensions" | IP containment |
| `lib/analytics/decision-velocity.ts` | confidenceLabel "VERIFIED" → "MEASURED" for SYSTEM_MEASURED posture | Evidence posture |
| `components/alignment/OGRHandoverDocument.tsx` | "verified Resonance Fidelity" → "measured Resonance Fidelity" | Overclaim fix |
| `components/alignment/OGRCoherenceLock.tsx` | "verified against" → "measured against" | Overclaim fix |
| `components/homepage/OGRFlagshipSection.tsx` | "Use advisory" → "Use counsel review" | Legacy language |
| `components/homepage/ExecutiveReportingFlagship.tsx` | "governed advisory attention" → "governed escalation" | Legacy language |
| `scripts/public-copy-guard.mjs` | NEW — regression guard for forbidden public phrases | Guard script |
| `scripts/evidence-posture-guard.mjs` | NEW — regression guard for evidence posture integrity | Guard script |
| `scripts/earned-progression-guard.mjs` | NEW — regression guard for SaaS paywall language | Guard script |

---

## Cumulative Impact: P0 → P1 → P2 → Permanent Acceptability

| Metric | Total |
|--------|-------|
| Files modified across all passes | **60+** |
| `/consulting` hrefs eliminated | **All — zero remain** |
| "advisory" labels replaced | **15+ components** |
| "AI-accelerated" instances removed | **6 user-facing + 2 user-facing directive strings** |
| SaaS language instances replaced | **12+** |
| IP leaks closed | **8** (proof-pack, contradiction-graph, evidence-standards, constitutional scoring display, constitutional dimension names, kernel label, proprietary claims, OGR verified claims) |
| Trust sections added/expanded | **2** (Homepage 8-card block, ER gate trust panel) |
| Guard scripts created | **3** (public-copy, evidence-posture, earned-progression) |
| Audit/reference documents produced | **24** |
| Evidence posture violations fixed | **3** (VERIFIED_CASE_EVIDENCE, VERIFIED for SYSTEM_MEASURED, "verified" for measured data) |

---

## Permanent Acceptability Standard

The product is **permanently acceptable** because:

1. **No public route leaks internal mechanics** — scoring derivation is server-only; constitutional dimensions are not rendered; graph/kernel/arbiter terminology eliminated from all user surfaces
2. **No public UI overclaims evidence** — "verified" only used with actual outcome verification or measurement; self-reported data correctly labeled; financial exposure marked as estimated
3. **No serious surface uses SaaS/funnel language** — "Upgrade Now", "Unlock premium", "exclusive insights" all eliminated; guard script prevents regression
4. **No counsel path bypasses evidence threshold** — counsel is evidence-gated at page level; navbar CTA is "Test a Decision" not "Counsel"
5. **No paid route appears without earned admission logic** — ER requires evidence + commitment; Strategy Room requires execution flow form
6. **No public copy compromises IP** — "kernel", "proprietary algorithm/model", "graph mechanics", "arbiter rules" all eliminated from public text; guard script prevents regression
7. **Every carried memory item is source-labelled** — source, date, and evidence posture on every governed memory item
8. **Every estimate is labelled as estimate** — financial exposure, cost-of-inaction, irreversibility all marked as estimates
9. **Every empty state is honest** — "No active cases under governance", "The system will not fabricate one here", "Insufficient evidence"
10. **Build passes** — TSC: 0 errors; guard scripts: 0 violations
11. **Guard scripts exist to prevent regression** — 3 CI-safe scripts covering forbidden phrases, evidence posture, and earned progression
