# Homepage Final Message Map

**Date:** 2026-05-09
**File:** `pages/index.tsx` (rendered via CategoryFrontDoor + supporting sections)

---

## Rendered Section Architecture

| # | Section | Purpose | Main Claim | Evidence Basis | CTA | IP Risk |
|---|---------|---------|------------|----------------|-----|---------|
| S1 | Hero | Category declaration | "The decision system that can refuse to proceed." | System-demonstrated (refusal engine exists) | "Test a decision" → `/diagnostics/fast` | NONE |
| S2 | Refusal Engine Demo | Differentiator proof | "A sample decision enters the system. Watch it get restricted." | Deterministic demonstration, correctly disclaimed | "See the governed review" (anchor) | LOW — shows governance pipeline steps but not scoring |
| S3 | Differentiation | Competitive contrast | "Not another assessment. Not another dashboard. Decision infrastructure." | Factual comparison against 4 competitor categories | None (informational) | NONE |
| S4 | Product Ladder | Earned progression | "Each stage adds evidence. Nothing resets." | Factual — 8 stages with correct free/paid tags | Stage links to respective surfaces | NONE |
| S5 | Proof of Governance | Capability display | 6 governance capabilities (Contradiction Memory, Evidence Quality, etc.) | System capabilities exist in code | None (informational) | LOW — reveals capability names, not mechanics |
| S6 | Buyer Pathways | Audience routing | 3 pathway cards (Individual / Operators / Boards) | Factual routing | Pathway-specific entry points | NONE |
| S7 | Trust | Trust disclosure | 6 trust statements including refusal, auditability, confidence limits | System-verified capabilities | None (informational) | NONE |
| S8 | Final CTA | Conversion | "Bring one decision the organisation cannot afford to get wrong." | N/A | "Test a decision" → `/diagnostics/fast` | NONE |
| Post | HomeEvidenceSection | Social proof | "Observed in practice" — 3 case cards | Static proof assets | None | LOW |
| Post | WhoThisIsFor | Buyer qualification | "Built for operators carrying real consequence." | Factual trigger conditions | Links to diagnostics | NONE |

---

## Identity Alignment Check

| Element | Current Text | Aligned? |
|---------|-------------|----------|
| Eyebrow | "Decision Infrastructure by Abraham of London" | YES |
| H1 | "The decision system that can refuse to proceed." | YES |
| Sub-copy | Tests decisions against evidence, authority, consequence, execution reality | YES |
| Footer line | "An earned-access decision institution" | YES |
| Meta description | "Decision Infrastructure by Abraham of London" | YES |

---

## Claims Requiring Monitoring

| Claim | Section | Risk | Status |
|-------|---------|------|--------|
| "Compounds intelligence across every interaction" | S5 gold box | NOT_CURRENTLY_VERIFIED — needs confirmation that cross-session compounding is live | MONITOR |
| "Human review available on request for any reading" | S7 trust | NOT_CURRENTLY_VERIFIED — needs operational staffing confirmation | MONITOR |
| "Confidence bands are always visible" | S7 trust | NEEDS VERIFICATION on every output surface | MONITOR |

---

## Dead Code Status

~1,500 lines of dead component definitions remain in `pages/index.tsx`. These are not rendered but contain flagged terms. Cleanup is a P2 item. No live rendering path is affected.
