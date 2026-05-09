# Public Claim Hardening Register

**Date:** 2026-05-09
**Purpose:** Every public claim classified for approval, evidence requirements, or suppression.

---

## Classification Key

| Status | Meaning |
|--------|---------|
| **APPROVED** | Claim is accurate and safe to publish as-is |
| **APPROVED_WITH_LABEL** | Claim is accurate but requires evidence posture label |
| **REWRITE_REQUIRED** | Claim is true but badly expressed or misleading |
| **SUPPRESS** | Claim should not appear on public surfaces |
| **OPERATOR_ONLY** | Claim is acceptable on operator/admin surfaces only |
| **NOT_CURRENTLY_SUPPORTED** | Claim describes a capability not yet live or verified |

---

## Product Identity Claims

| Claim | Source | Classification | Note |
|-------|--------|---------------|------|
| "The decision system that can refuse to proceed." | Homepage hero | **APPROVED** | Consider removing "can" — the system does refuse |
| "Decision Infrastructure by Abraham of London" | Homepage eyebrow | **APPROVED** | Canonical identity |
| "Institutional Platform" | Navbar | **REWRITE_REQUIRED** | Must be "Decision Infrastructure" |
| "A platform for disciplined thinking" | Footer | **REWRITE_REQUIRED** | Must describe Decision Infrastructure |
| "Governance — Architecture — Execution" | Footer tagline | **REWRITE_REQUIRED** | Generic. Must be "Decision Infrastructure" |
| "Decision Authority as a Service" | Retainer page | **REWRITE_REQUIRED** | Contradicts institution identity. Must be "Retained Decision Enforcement" |
| "An earned-access decision institution" | Homepage footer | **APPROVED** | Strong identity claim |

## System Capability Claims

| Claim | Source | Classification | Note |
|-------|--------|---------------|------|
| "The system records, remembers, and follows up." | Various | **APPROVED** | Checkpoint and Return Brief verify this |
| "The system does not fabricate checkpoints, evidence, or outcomes." | Return Brief | **APPROVED** | Verified in code |
| "The system does not invent certainty." | Homepage trust | **APPROVED** | Confidence limits in code |
| "Compounds intelligence across every interaction." | Homepage S5 | **NOT_CURRENTLY_SUPPORTED** | Verify cross-session compounding is live |
| "Human review available on request for any reading." | Homepage trust | **NOT_CURRENTLY_SUPPORTED** | Must verify operational staffing |
| "Confidence bands are always visible." | Homepage trust | **APPROVED_WITH_LABEL** | Verify this is true on every output surface |
| "Every governed recommendation is auditable and challengeable." | Homepage trust | **REWRITE_REQUIRED** | Replace "recommendation" with "directive" |
| "Decisions evaluated against an AI-accelerated market baseline." | Diagnostics index, ER run, Strategy Room | **SUPPRESS** | Unsubstantiated. Uses AI as marketing adjective |
| "The system extracts the decision." | Diagnostics index | **REWRITE_REQUIRED** | System prompts, not extracts. Replace with "The system requires you to name the decision" |
| "The system has determined that action is required." | Strategy Room | **REWRITE_REQUIRED** | Systems infer, not determine. Replace with "The evidence supports execution" |
| "Score-based routing." | Footer | **SUPPRESS** | Leaks scoring mechanic. Replace with "Evidence-based routing" |

## Evidence & Trust Claims

| Claim | Source | Classification | Note |
|-------|--------|---------------|------|
| "These consequences have not been independently verified." | Return Brief | **APPROVED** | Gold standard |
| "It does not claim a verified outcome unless evidence is actually provided." | OV Panel | **APPROVED** | Must propagate everywhere |
| "This is an irreversibility estimate, not a verified external fact." | Strategy Room session | **APPROVED** | Gold standard |
| "The system will not fabricate one here." | Return Brief | **APPROVED** | Radical honesty |
| "Based on your stated decision context and declared consequence. Scenario only." | Fast Diagnostic | **APPROVED** | Must be on all cost projections |
| "Self-reported evidence is never represented as independently verified." | Evidence standards | **APPROVED** | Core trust claim |
| "verified executive memory" | Homepage meta | **REWRITE_REQUIRED** | "Verified" is too strong without evidence chain |
| "outcome-verified cases" | Evidence index badge | **REWRITE_REQUIRED** | Overclaim for static proof assets. Must be "case dossiers" |
| "Verified outcomes: N" | Boardroom, Proof Pack | **REWRITE_REQUIRED** | Must specify verification method |
| VERIFIED_CASE_EVIDENCE (data attribute) | PublicProofBlocks | **REWRITE_REQUIRED** | Self-reported data must not be classified as verified |
| "Institutional guarantee" | Books PurchaseOptions | **SUPPRESS** | Unsubstantiated |
| "Trusted by" | LogoWall aria-label | **APPROVED_WITH_LABEL** | Must verify each logo represents a real relationship |
| "Not a financial forecast." | FinancialExposureDisclosure | **APPROVED** | Exemplary |
| "Not independently validated as a psychometric tool." | DiagnosticStandardPanel | **APPROVED** | Honest disclaimer |

## Diagnostic & Assessment Claims

| Claim | Source | Classification | Note |
|-------|--------|---------------|------|
| "You don't have an execution problem. You have a decision structure problem." | Fast Diagnostic hero | **APPROVED** | Strong entry reframe |
| "This will show you where yours is breaking." | Fast Diagnostic | **APPROVED_WITH_LABEL** | Shows where user says it is breaking. Consider adding "based on what you tell us" |
| "Reading your decision pattern." | Fast Diagnostic loading | **REWRITE_REQUIRED** | 3 inputs do not constitute a pattern. Replace with "Processing your stated inputs" |
| "You already know this. You've been circling it." | Fast Diagnostic | **REWRITE_REQUIRED** | Theatrical assertion, not evidence. Replace with sourced statement |
| "It IS a decision structure failure." | ER gate | **REWRITE_REQUIRED** | Asserts unverified. Replace with "The evidence suggests" |
| "Prices the cost of delay." | ER gate | **REWRITE_REQUIRED** | "Prices" implies precision. Replace with "Estimates the cost of delay" |
| "Board-grade clarity." | ER gate | **REWRITE_REQUIRED** | "Clarity" is flagged. Replace with "Board-grade decision object" |
| "A serious first reading, not a decorative questionnaire." | Constitutional Diagnostic | **APPROVED** | Strong framing |
| "High-resolution input produces a verdict people trust." | Purpose Alignment | **REWRITE_REQUIRED** | "Verdict" is overclaim. "People trust" is unsubstantiated |
| "This gate is now a real microcosm of the wider estate." | Constitutional Diagnostic sidebar | **SUPPRESS** | Developer language in user-facing copy |
| "Persisted constitutional micro-report." | Constitutional Diagnostic sidebar | **REWRITE_REQUIRED** | Replace with "A structural report that the system remembers" |

## Counsel & Escalation Claims

| Claim | Source | Classification | Note |
|-------|--------|---------------|------|
| "Counsel Review is not a starting point." | Counsel index | **APPROVED** | Core escalation framing |
| "The cases the system should not pretend to resolve alone." | Counsel index | **APPROVED** | Strong honesty |
| "Counsel Review is recommended." | Counsel contract | **REWRITE_REQUIRED** | Replace with "Counsel Review is warranted by the evidence" |
| "The system has enough evidence to determine." | Counsel index | **REWRITE_REQUIRED** | Replace with "The evidence crosses the threshold" |
| "This is a status surface, not a sales funnel." | Counsel status | **APPROVED** | Excellent anti-funnel |
| "Ongoing oversight may be required." | Return Brief | **REWRITE_REQUIRED** | Too soft. Replace with "Ongoing oversight is warranted by this evidence pattern" |
| "Strategic intervention" | Counsel intake type | **REWRITE_REQUIRED** | Sounds like McKinsey. Replace with "Structural correction review" |
| "Recommended board actions" | Boardroom | **REWRITE_REQUIRED** | Replace with "Board actions surfaced by governance" |

## Commercial & Progression Claims

| Claim | Source | Classification | Note |
|-------|--------|---------------|------|
| "No sale if the case is not ready." | Homepage, do-not-sell-gate | **APPROVED** | Genuine commercial discipline |
| "Earned next step." | ProductAdmissionCard | **APPROVED** | Correct framing |
| "Your current finding and checkpoint remain active." | ProductAdmissionCard | **APPROVED** | Stopping is valid |
| "Unlock" / "Unlock Access" | AccessGate, DownloadCard | **REWRITE_REQUIRED** | SaaS paywall language. Replace with "Access" or "Enter" |
| "Upgrade Now" / "Upgrade to Premium" | Inner Circle surfaces | **REWRITE_REQUIRED** | Replace with earned progression language |
| "Not a sales funnel." | Recommendation engine header | **APPROVED** | Good self-declaration |
| "Not yet available" | ProductAdmissionCard | **APPROVED** | Honest |

## IP-Sensitive Claims (Public Surface)

| Claim | Source | Classification | Note |
|-------|--------|---------------|------|
| "Contradiction Memory" | Homepage S5 | **APPROVED** | Name is safe; description reveals compounding. Sharpen description |
| "Evidence Quality" grading | Homepage S5 | **APPROVED_WITH_LABEL** | Remove threshold language |
| "Consequence Projection" | Homepage S5 | **APPROVED** | Reveals projection capability but not mechanics |
| "Cross-Assessment Review" | Homepage S5 | **APPROVED** | Reveals capability, not mechanics |
| "V2.2 sovereign routing kernel" | Constitutional Diagnostic | **SUPPRESS** | Internal architecture name |
| "Scenario weights" | Artifacts page | **SUPPRESS** | Reveals scoring methodology |
| "Evidence graph" | Method page | **SUPPRESS** | Internal data structure name |
| "Scoring formulas or engine weights" | Evidence standards | **REWRITE_REQUIRED** | Confirms architecture. Generalize |
| "Arbitration logic or prompt structures" | Evidence standards | **REWRITE_REQUIRED** | Confirms architecture. Generalize |
| "Contradiction graph mechanics" | Evidence standards | **REWRITE_REQUIRED** | Confirms architecture. Generalize |
| "Five arbiter rules, tournament mechanics" | ArbiterBadge comment | **OPERATOR_ONLY** | Strip from production comments |
| "cost-of-delay engine" | FinancialExposureDisclosure | **APPROVED_WITH_LABEL** | Describes capability, not mechanics. Minor risk |

---

## Summary Statistics

| Classification | Count |
|---------------|-------|
| APPROVED | 25 |
| APPROVED_WITH_LABEL | 5 |
| REWRITE_REQUIRED | 27 |
| SUPPRESS | 7 |
| OPERATOR_ONLY | 1 |
| NOT_CURRENTLY_SUPPORTED | 2 |
| **Total claims reviewed** | **67** |
