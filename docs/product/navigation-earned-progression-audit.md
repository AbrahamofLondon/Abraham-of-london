# Navigation Earned Progression Audit

**Date:** 2026-05-09
**Purpose:** Verify every persistent CTA respects earned progression

---

## Navbar CTAs

| CTA | Target | Earned Progression | Status |
|-----|--------|-------------------|--------|
| "Test a Decision" (gold button, desktop) | `/diagnostics/fast` | YES — entry point, no evidence required | PASS |
| "Test a Decision" (gold button, mobile) | `/diagnostics/fast` | YES — entry point, no evidence required | PASS |
| Nav links (Canon, Briefs, Library, etc.) | Various content | N/A — content navigation | PASS |

**Previous state:** "Counsel" CTA linked to `/counsel`, bypassing the entire diagnostic ladder. Users could access the highest escalation tier from any page without evidence.

**Current state:** Primary CTA is "Test a Decision" — the correct entry point for earned progression.

---

## Footer CTAs

| CTA | Target | Earned Progression | Status |
|-----|--------|-------------------|--------|
| "Secure inquiry" | `/contact` | N/A — contact form | ACCEPTABLE |
| "Test a Decision" (gold button) | `/diagnostics/fast` | YES — entry point | PASS |
| Strategy Room gateway card | `/strategy-room` | PARTIAL — Strategy Room has its own evidence gate | ACCEPTABLE |
| Executive Reporting gateway card | `/diagnostics/executive-reporting` | PARTIAL — ER has its own evidence gate | ACCEPTABLE |
| Diagnostics gateway card | `/diagnostics` | YES — entry surface | PASS |
| Directory: "Counsel Review" | `/counsel` | YES — counsel page has evidence gate | PASS |

**Previous state:** Gold CTA was "Enter Strategy Room" — bypassing diagnostic evidence.

**Current state:** Gold CTA is "Test a Decision" — correct entry point. Strategy Room and Counsel remain accessible but are evidence-gated at their own pages.

---

## Homepage CTAs

| CTA | Section | Target | Earned Progression | Status |
|-----|---------|--------|-------------------|--------|
| "Test a decision" | Hero (S1) | `/diagnostics/fast` | YES — entry point | PASS |
| "See the governed review" | Hero (S1) | Anchor to S2 demo | YES — on-page navigation | PASS |
| "Test a decision" | Final CTA (S8) | `/diagnostics/fast` | YES — entry point | PASS |
| Product ladder stage links | S4 | Various diagnostics | YES — earned progression shown | PASS |
| Buyer pathway cards | S6 | Various diagnostics | YES — each links to appropriate entry | PASS |

---

## Strategy Room Gate CTAs

| CTA | Target | Earned Progression | Status |
|-----|--------|-------------------|--------|
| "Return to diagnostics" / "Address this first" | `/diagnostics` | YES — redirects insufficient evidence back | PASS |
| "Institutional mandate" | `/institutional` | N/A — information page | ACCEPTABLE |
| "Evidence standards" | `/evidence/standards` | N/A — trust disclosure | PASS |

**Previous state:** Included "Private advisory" and "Contact" links — consulting-style fallbacks that bypassed the evidence requirement.

**Current state:** Only institutional mandate and evidence standards remain. No advisory/contact fallbacks.

---

## Summary

| Surface | Earned Progression Respected | Previous Status |
|---------|------------------------------|-----------------|
| Navbar primary CTA | YES | NO — "Counsel" bypassed ladder |
| Footer primary CTA | YES | NO — "Enter Strategy Room" bypassed ladder |
| Homepage CTAs | YES | YES (already correct) |
| Strategy Room gate | YES | NO — "Private advisory" + "Contact" offered fallbacks |
| Diagnostics index | YES | YES (already correct) |
| Counsel pages | YES | YES (evidence-gated at page level) |

**Verdict: All persistent navigation CTAs now respect earned progression.**
