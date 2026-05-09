# IP-Safe Method Disclosure Map

**Date:** 2026-05-09
**Purpose:** For each proprietary advantage, define what can be said publicly, what can be said to authenticated users, what operators see, and what is suppressed.

---

## 1. Contradiction Detection & Memory

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | "The system detects when evidence from different stages points in conflicting directions. Contradictions accumulate. The system does not forget." |
| **Authenticated user** | "Contradictions detected: N. Active contradictions are currently shaping this case." + plain-English description of each contradiction. |
| **Operator** | Full contradiction detail with severity bands, source stages, and resolution status. |
| **Suppressed** | Graph data structure, node/edge mechanics, decay algorithms, compounding severity formula, kernel graph architecture. |

### Current violations
- `pages/evidence/standards.tsx:157` — "Contradiction graph mechanics" in "do not publish" list confirms the architecture exists.
- `pages/method.tsx:105` — "Evidence graph" names the internal data structure.

### Required fix
- Generalize the "do not publish" list to avoid confirming component names.
- Replace "Evidence graph" with "Typed evidence across the journey."

---

## 2. Arbiter System (Internal Quality Challenge)

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | "Every governed output passes an internal quality review before display." |
| **Authenticated user** | "{Context} quality check: passed / corrected before display / incomplete" |
| **Operator** | Arbiter pass/fail detail, correction log, challenge transcript. |
| **Suppressed** | Number of arbiter rules, tournament mechanics, scoring logic, challenge prompts, correction algorithms. |

### Current violations
- `components/trust/ArbiterBadge.tsx:5` — Code comment: "Does NOT expose the five arbiter rules, tournament mechanics, or scoring logic." This confirms count and mechanism names.

### Required fix
- Replace comment with: "Does not expose internal validation system architecture."
- Consider renaming component to `QualityBadge` or `IntegrityBadge` to avoid "arbiter" in production bundles.

---

## 3. Evidence Quality Grading & Gating

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | "If evidence is insufficient, the system restricts progression." |
| **Authenticated user** | Evidence tier badge (Single-source / Multi-source / Outcome-verified / Human-reviewed) with tier description. Evidence strength meter showing stage contributions. |
| **Operator** | Full evidence tier breakdown with score components and restriction triggers. |
| **Suppressed** | Threshold values, scoring formulas, gate conditions, stage weights, minimum sample sizes, confidence calculations. |

### Current violations
- `components/diagnostics/ConstitutionalDiagnostic.tsx` — Full scoring dimensions (authorityScore, coherenceScore, pressureScore, frictionScore, trustScore, seriousnessScore, governanceDiscipline, interventionReadiness, narrativeCoherence, failureModeCount, failureModeSeverity) in client-side `ApiSuccess` type.
- `pages/diagnostics/team-assessment.tsx` — Gap thresholds (30+, 20+, 10+) in client-side `deriveGapReading`.
- `pages/diagnostics/enterprise-assessment.tsx` — Band thresholds in client-side `deriveReading`.

### Required fix
- Move scoring dimensions and threshold logic server-side. Return only the computed result (band/tier/route) to the client.

---

## 4. Decision Velocity & Execution Tracking

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | "The system tracks whether decisions move from stated to executed." |
| **Authenticated user** | Velocity band (FAST / STEADY / SLOWING / STALLED / INSUFFICIENT_DATA) with explanation. Decision timeline with status labels. |
| **Operator** | Full velocity metrics, checkpoint-to-action intervals, avoidance pattern counts. |
| **Suppressed** | Velocity formula, interval thresholds, band boundaries, avoidance detection algorithm. |

### Current status: CLEAN — no violations found.

---

## 5. Cross-Assessment Intelligence

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | Not disclosed. This capability is only visible to users with multi-stage evidence. |
| **Authenticated user** | Plain-English explanation of where different stages conflict. Caution when insufficient stages. |
| **Operator** | Full cross-stage comparison matrix with conflict severity. |
| **Suppressed** | Comparison algorithm, signal matching logic, conflict severity formula. |

### Current status: CLEAN — `userSafeExplanation` fields are well-written.

---

## 6. Consequence Projection & Cost-of-Delay

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | "The system estimates what delay costs based on your stated inputs." |
| **Authenticated user** | Cost-of-inaction figure with mandatory disclaimer: "Estimated over N days. Scenario only — not a financial forecast." Derivation disclosed when available. |
| **Operator** | Full cost model, projection parameters, sensitivity analysis. |
| **Suppressed** | Cost-of-delay engine internals, exposure scoring formula, projection intervals, weighting factors. |

### Current violations
- `components/trust/FinancialExposureDisclosure.tsx` — Names "cost-of-delay engine." Minor — describes capability rather than exposing mechanics.

### Required fix
- Consider replacing "cost-of-delay engine" with "cost-of-delay method" or removing the component name.

---

## 7. Irreversibility Estimation

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | Not disclosed publicly. |
| **Authenticated user** | Irreversibility level (LOW / MODERATE / HIGH / CRITICAL) with explicit disclaimer: "This is an irreversibility estimate, not a verified external fact." |
| **Operator** | Full irreversibility index with signal components. |
| **Suppressed** | `computeIrreversibilityIndex` formula, signal weights, minimum signal count (currently ≥2). |

### Current status: CLEAN — the disclaimer is the gold standard for the product.

---

## 8. Earned Progression & Commercial Gating

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | "No sale if the case is not ready. The system can refuse." |
| **Authenticated user** | "Evidence threshold met because: [specific reasons]." / "Not yet earned by evidence." / "Your current finding and checkpoint remain active." |
| **Operator** | Full entitlement matrix, do-not-sell gate conditions, admission criteria. |
| **Suppressed** | Recommendation engine logic, scoring thresholds, conversion trigger conditions, admission formulas. |

### Current violations
- `pages/diagnostics/constitutional-diagnostic.tsx:315` — "V2.2 sovereign routing kernel" displayed in user-facing data label.

### Required fix
- Remove "V2.2 sovereign routing kernel" from any user-facing display.

---

## 9. Cognitive State Model

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | Not disclosed. |
| **Authenticated user** | Consider suppressing. Currently the 6-stage model (SIGNAL_DISCOVERY through INSTITUTIONAL_INTELLIGENCE) is visible in Decision Centre. |
| **Operator** | Full cognitive state with transition triggers. |
| **Suppressed** | State transition logic, stage definitions, advancement criteria. |

### Current concern
- Decision Centre displays cognitive state labels to users. These expose the internal progression architecture. Consider showing a simplified label or moving below fold.

---

## 10. Return Brief Confrontation Engine

| Audience | Permitted disclosure |
|----------|---------------------|
| **Public** | Not disclosed publicly. |
| **Authenticated user** | The confrontation itself: trajectory, prior standard, consequence evidence, cost of inaction, challenge text. All source-labelled. |
| **Operator** | Full brief with all evidence sources, challenge generation parameters, trajectory calculation. |
| **Suppressed** | Challenge generation logic, trajectory computation, threshold for brief generation, evidence threshold crossing criteria. |

### Current status: CLEAN — the Return Brief is the gold standard surface.

---

## Global Safety Controls

### Already in place (exemplary)
- `lib/product/enterprise-control-room-safety.ts` — UNSAFE_PATTERNS regex blocks "algorithm", "kernel", "arbiter" from enterprise-facing output.
- `components/trust/ArbiterBadge.tsx` — User sees "quality check" not "arbiter."
- `pages/evidence/standards.tsx` — "What we do not publish" list (though it confirms architecture names).
- `components/trust/FinancialExposureDisclosure.tsx` — Multi-layer financial disclaimers.

### Needed
- Server-side scoring for Constitutional Diagnostic, Team Assessment, Enterprise Assessment.
- Production source-map stripping for code comments containing architecture names.
- Generalization of "do not publish" enumeration on evidence standards page.
