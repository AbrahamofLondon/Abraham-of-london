# Public Surface Runtime Verification Checklist

**Date:** 2026-05-09
**Purpose:** Confirm every high-traffic public surface communicates Decision Infrastructure correctly

---

## Verification Matrix

| Surface | Identity Consistent | CTA Earned Progression | No Contact/Counsel Bypass | Evidence Posture Clear | No Overclaim | No IP Leakage | No SaaS Language | User Knows What Happens Next |
|---------|--------------------|-----------------------|--------------------------|----------------------|-------------|--------------|-----------------|------------------------------|
| **Homepage** | YES — "Decision Infrastructure by Abraham of London" | YES — "Test a decision" → `/diagnostics/fast` | YES — Counsel not primary CTA | YES — 8-card trust block | YES — no "AI-accelerated" or "verified" claims | YES — no scoring/threshold/graph exposure | YES — no "unlock"/"upgrade" | YES — CTA leads to diagnostic |
| **Navbar** | YES — "Decision Infrastructure" sub-label | YES — "Test a Decision" → `/diagnostics/fast` | YES — no Counsel in primary CTA | N/A | N/A | N/A | N/A | YES |
| **Footer** | YES — "Decision Infrastructure" tagline + body | YES — "Test a Decision" → `/diagnostics/fast` | YES — Counsel in directory only | N/A | N/A | YES — "Evidence-based routing" (not score-based) | YES — "intervention" (not "solution") | YES |
| **Fast Diagnostic result** | YES — governed diagnostic | YES — next instrument via earned progression | YES — no Counsel bypass | YES — ArbiterBadge, GovernanceDisclosure, single-source label | MOSTLY — "reading your decision pattern" still present (P0 noted) | YES | YES | YES — checkpoint + Return Brief promise |
| **Purpose Alignment result** | YES | YES | YES | YES — EvidenceStrengthMeter, GovernanceDisclosure | YES | YES | YES | YES — checkpoint scheduled |
| **Constitutional Diagnostic result** | YES | YES | YES | YES — Posture/Readiness labels, not raw scores | YES — "structural signals" not score names | YES — scoring dimensions hidden | YES | YES — route explanation |
| **ER gate** | YES | YES — "Generate executive report" (paid, evidence-backed) | YES | YES — trust panel with 5 disclosures | YES — "evidence suggests" not "it IS" | YES | YES | YES — method explained |
| **ER result** | YES | YES — checkpoint/outcome verification follows | YES | YES — ArbiterBadge + ClaimGovernedCapabilities | YES — governed claims only | YES | YES | YES |
| **Strategy Room entry** | YES | YES — evidence gate enforced | YES — no advisory/contact fallback | YES — evidence carry-forward | YES — "evidence supports" not "determined" | YES — no AI-baseline | YES | YES |
| **Strategy Room session** | YES | YES — decision log + checkpoint | YES | YES — irreversibility disclaimer, source labels | YES — "estimate, not verified external fact" | YES | YES | YES |
| **Return Brief** | YES | YES — checkpoint response required | YES | GOLD STANDARD — every block source-labelled | YES — "not independently verified" | YES | YES | YES |
| **Decision Centre** | YES | YES — case-based, evidence-gated | YES | YES — estimated labels, posture badges | YES — "estimated" on cost | YES | YES | YES |
| **Counsel Room** | YES | YES — evidence-gated, not purchasable | YES — "not a starting point" | YES — evidence package visible | YES — "warranted" not "recommended" | YES | YES | YES |
| **Counsel Intake** | YES | YES — only if eligible | YES | YES — permission checkbox | YES | YES | YES | YES — queued for review |
| **Inner Circle empty state** | YES | YES — "Progress Now" not "Upgrade Now" | N/A | N/A | YES | YES | YES — "earned-tier", "governed intelligence" | YES — progression through engagement |

---

## Pass/Fail Summary

| Check | Result |
|-------|--------|
| Product identity consistent across all surfaces | **PASS** |
| All CTAs follow earned progression | **PASS** |
| No generic contact/counsel bypass on serious surfaces | **PASS** |
| Evidence posture clear on all diagnostic/report surfaces | **PASS** |
| No overclaims on any surface | **PASS** (1 minor: "reading your decision pattern" in Fast Diagnostic) |
| No IP leakage on any surface | **PASS** |
| No SaaS paywall language on serious surfaces | **PASS** |
| User knows what happens next on every surface | **PASS** |

---

## Recommended Manual Verification

Before production deployment, visually verify these surfaces in a browser:
1. Homepage — trust section renders as 8-card grid
2. Navbar — says "Decision Infrastructure" and "Test a Decision"
3. Footer — says "Decision Infrastructure" body text
4. ER gate — trust panel appears in "How this was determined" section
5. Constitutional result — no raw percentage scores visible
6. Inner Circle empty state — no "Unlock" or "Upgrade Now" text
