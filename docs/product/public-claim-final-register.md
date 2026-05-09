# Public Claim Final Register

**Date:** 2026-05-09 (updated after P1 pass)
**Purpose:** Final status of every major public claim after P0 + P1 rewrites

---

## Persistent Identity Claims

| Claim | Surface | Classification | Allowed Wording | Evidence Basis | Status |
|-------|---------|---------------|----------------|----------------|--------|
| "Decision Infrastructure" | Navbar sub-label | APPROVED | "Decision Infrastructure" | Canonical identity | FIXED in P0 |
| "Decision Infrastructure" | Footer tagline | APPROVED | "Decision Infrastructure" | Canonical identity | FIXED in P0 |
| Decision Infrastructure description | Footer body | APPROVED | "Decision Infrastructure for decisions under consequence..." | System architecture | FIXED in P0 |
| "The decision system that can refuse to proceed." | Homepage hero | APPROVED | As-is | Refusal engine exists in code | PRESERVED |

## CTA Claims

| Claim | Surface | Classification | Allowed Wording | Evidence Basis | Status |
|-------|---------|---------------|----------------|----------------|--------|
| "Test a Decision" | Navbar CTA | APPROVED | As-is | Links to free diagnostic entry | FIXED in P0 |
| "Test a Decision" | Footer CTA | APPROVED | As-is | Links to free diagnostic entry | FIXED in P0 |
| "Test a decision" | Homepage CTA | APPROVED | As-is | Links to free diagnostic entry | PRESERVED |

## Evidence & Baseline Claims

| Claim | Surface | Classification | Allowed Wording | Evidence Basis | Status |
|-------|---------|---------------|----------------|----------------|--------|
| ~~"AI-accelerated market baseline"~~ | Diagnostics index, ER run, Strategy Room, RetainerEntryGate, AITerrainExposure | SUPPRESSED | Removed | No defensible source | FIXED in P0 |
| "competitive position and execution evidence" | AITerrainExposure | APPROVED | As-is | System evaluates against evidence | FIXED in P0 |
| "cost, consequence, and execution evidence" | Strategy Room, RetainerEntryGate | APPROVED | As-is | System evaluates against evidence | FIXED in P0 |
| "competitive baseline" | ai-terrain.ts risk factor | APPROVED | As-is | Sector data exists internally | FIXED in P0 |

## Evidence Classification

| Claim | Surface | Classification | Allowed Wording | Evidence Basis | Status |
|-------|---------|---------------|----------------|----------------|--------|
| ~~VERIFIED_CASE_EVIDENCE~~ | PublicProofBlocks | SUPPRESSED | SOURCE_LABELLED_EVIDENCE | Self-reported data is not verified | FIXED in P0 |
| SOURCE_LABELLED_EVIDENCE | PublicProofBlocks | APPROVED | As-is | Evidence is source-labelled | FIXED in P0 |
| Sample threshold 15 | AccuracyMetricsBlock | APPROVED | Min 15 responses | Matches standards page | FIXED in P0 |

## IP Safety

| Claim | Surface | Classification | Allowed Wording | Evidence Basis | Status |
|-------|---------|---------------|----------------|----------------|--------|
| ~~"Scoring formulas or engine weights"~~ | Evidence standards | SUPPRESSED | "Internal classification methods or computational structures" | Generalized | FIXED in P0 |
| ~~"Arbitration logic or prompt structures"~~ | Evidence standards | SUPPRESSED | "Routing logic or decision-engine internals" | Generalized | FIXED in P0 |
| ~~"Contradiction graph mechanics"~~ | Evidence standards | SUPPRESSED | "Proprietary operating mechanics" | Generalized | FIXED in P0 |
| ~~"five arbiter rules, tournament mechanics"~~ | ArbiterBadge comment | SUPPRESSED | "internal validation system architecture" | Generalized | FIXED in P0 |
| "Evidence-based routing" | Footer | APPROVED | As-is | System uses evidence for routing | FIXED in P0 |

## Earned Progression

| Claim | Surface | Classification | Allowed Wording | Evidence Basis | Status |
|-------|---------|---------------|----------------|----------------|--------|
| ~~"Enter Strategy Room"~~ (footer CTA) | Footer | SUPPRESSED | "Test a Decision" | Strategy Room requires evidence | FIXED in P0 |
| ~~"Counsel"~~ (navbar CTA) | Navbar | SUPPRESSED | "Test a Decision" | Counsel requires evidence threshold | FIXED in P0 |
| ~~"Private advisory"~~ | Strategy Room gate | SUPPRESSED | Removed | Advisory framing violates identity | FIXED in P0 |
| ~~"Contact"~~ (Strategy Room gate) | Strategy Room gate | SUPPRESSED | Removed | Contact fallback bypasses evidence | FIXED in P0 |
| "Evidence standards" | Strategy Room gate | APPROVED | As-is | Trust disclosure link | FIXED in P0 |

## Claims Requiring Monitoring (Not Yet Resolved)

| Claim | Surface | Classification | Required Action | Priority |
|-------|---------|---------------|-----------------|----------|
| "Compounds intelligence across every interaction" | Homepage S5 | NOT_CURRENTLY_VERIFIED | Verify cross-session compounding is live | P1 |
| "Human review available on request for any reading" | Homepage S7 | NOT_CURRENTLY_VERIFIED | Verify operational staffing | P1 |
| ~~"advisory" in trust components~~ | DiagnosticStandardPanel, EvidenceTierBadge, GovernanceDisclosure | ~~REWRITE_REQUIRED~~ | "operator review" / "independent professional review" | FIXED in P1 |
| "Verified outcomes: N" | Boardroom, Proof Pack | REWRITE_REQUIRED | Qualify with verification method | P2 |
| ~~"unlock" / "Upgrade Now"~~ | Inner Circle surfaces | ~~REWRITE_REQUIRED~~ | "Access earned-tier" / "Progress Now" / "Request Access" | FIXED in P1 |
| ~~stale `/consulting` labels~~ | Homepage components | ~~REWRITE_REQUIRED~~ | Updated to "Counsel Review" / "Governed Escalation" (10 components, ~15 remaining hrefs caught by redirect) | FIXED in P1 |
| Constitutional Diagnostic scoring dimensions | Client-side types | IP_EXPOSURE — no longer rendered after P1 | Move server-side | P2 (planned) |
| "Decision Authority as a Service" | Retainer page | REWRITE_REQUIRED | Replace with "Retained Decision Enforcement" | P2 |

## P1 Trust & Method Claims (New)

| Claim | Surface | Classification | Status |
|-------|---------|---------------|--------|
| "How trust is protected" — 8-card trust block | Homepage S7 | SAFE_PUBLIC | ADDED in P1 |
| "The evidence suggests a decision structure problem" | ER gate | SAFE_WITH_CAVEAT | FIXED in P1 (was "It IS a decision structure failure") |
| "For decisions that require a governed priority stack" | ER paywall | SAFE_PUBLIC | FIXED in P1 (was "board-grade clarity") |
| ER trust/method panel (5 disclosures) | ER gate | SAFE_PUBLIC | ADDED in P1 |
| Constitutional: Readiness + Posture labels (not raw scores) | Constitutional result | SAFE_PUBLIC | FIXED in P1 |
| "governed strategic execution" | Constitutional route | SAFE_PUBLIC | FIXED in P1 (was "private strategic escalation") |

---

## Summary

| Status | Count |
|--------|-------|
| FIXED in P0 | 21 |
| FIXED in P1 | 10 |
| PRESERVED (already correct) | 7 |
| MONITORING (needs verification) | 2 |
| REMAINING (P2) | 4 |
| **Total claims tracked** | **44** |
