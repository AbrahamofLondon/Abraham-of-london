# Proof Layer Calibration Audit

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## PROOF FILE INVENTORY

### Engine Files

| File | Classification | Live/Static | Sample Threshold | Seal | IP Risk | Publish? |
|------|---------------|-------------|-----------------|------|---------|----------|
| `lib/proof/social-proof-engine.ts` | AGGREGATE_EVIDENCE | Framework (empty) | N=25 enforced | None | Moderate — cohort segmentation reveals internal categorisation | INTERNAL_ONLY |
| `lib/proof/evidence.ts` | LIVE_EVIDENCE | Live/empty DB | N=5 (too low) | None | High — anonymisation regex weak | GATE — raise to N=15 |
| `lib/evidence/evidence-integrity-seal.ts` | STANDARD_DISCLOSURE | Framework | N/A | Central | None | PUBLISH methodology |
| `lib/evidence/case-study-generator.ts` | LIVE_EVIDENCE | Framework | N/A per case | Yes (seal) | High — classification taxonomy visible in output | GATE code, publish outputs |
| `lib/evidence/case-draft-builder.ts` | LIVE_EVIDENCE | Live builder | N/A | Partial | High — regex anonymisation insufficient | REWRITE anonymisation |
| `lib/product/commitment-verification.ts` | INTERNAL_ONLY | Framework | N/A | None | None | SUPPRESS |

### UI Components

| File | Classification | Live/Static | Data Source | IP Risk | Publish? |
|------|---------------|-------------|-------------|---------|----------|
| `components/product/FirstEncounterProof.tsx` | DEMONSTRATION_PATTERN | Static/Demo | Hardcoded steps | Moderate — "C3 fidelity score" in step detail text | REWRITE — remove engine term |
| `components/product/ValueProtectedSummary.tsx` | LIVE_EVIDENCE | Dynamic (props) | Parent component | Depends on data | KEEP — enforce evidenceBasis mandatory |
| `components/proof/ProofCapturePrompt.tsx` | NOT_WIRED (as proof) | Live feedback | User self-report | Low | SUPPRESS from public view |
| `components/proof/PublicProofBlocks.tsx` | LIVE_EVIDENCE / DEMONSTRATION_FALLBACK | Hybrid | `/api/proof/public` | Moderate — fallback patterns visible | PUBLISH with clear labelling |
| `components/diagnostics/AnonymisedCaseProof.tsx` | OVERCLAIM | Static/Demo | Hardcoded 3 cases | None | REWRITE — label as DEMONSTRATION_PATTERN |

### Surfaces

| Surface | Classification | Proof Type | Evidence Status | Action |
|---------|---------------|------------|-----------------|--------|
| `pages/evidence/index.tsx` | STATIC_PROOF_ASSET | Case summaries | 3 hardcoded cases, correctly labelled | KEEP |
| `pages/evidence/[slug].tsx` | STATIC_PROOF_ASSET | Case dossiers | Hardcoded, correctly labelled | KEEP |
| Homepage ProofLayer | DEMONSTRATION_PATTERN / LIVE_EVIDENCE | Process + outcomes | Hybrid with fallback | KEEP with labelling |
| Decision Centre | INTERNAL_ONLY | User case data | Live API | NOT a proof surface |
| Return Brief | INTERNAL_ONLY | Outcome evidence | Live per-case | NOT a proof surface |
| Oversight Brief | AGGREGATE_EVIDENCE | Cycle proof | Live per-client | GATE — retainer only |
| Strategy Room | INTERNAL_ONLY | Session evidence | Live per-session | NOT a proof surface |
| Fast Diagnostic | NOT_WIRED | No proof shown | Results only | ADD proof capture |

### API & Admin

| File | Classification | Data | Action |
|------|---------------|------|--------|
| `pages/api/proof/public.ts` | LIVE_EVIDENCE | Approved proof only | KEEP — returns only approved |
| `pages/api/proof/evidence.ts` | INTERNAL_ONLY | Raw evidence capture | KEEP — internal |
| `pages/api/admin/proof/evidence/index.ts` | INTERNAL_ONLY | Admin evidence list | KEEP |
| `pages/api/admin/proof/evidence/[id].ts` | INTERNAL_ONLY | Admin evidence detail | KEEP |
| `pages/admin/proof.tsx` | INTERNAL_ONLY | Admin review panel | STRENGTHEN — require documentation for admin-created proof |

---

## CRITICAL FINDINGS

### 1. PLATINUM seal is unreachable
`multipleCasesConfirmed` is always passed from outside — no mechanism exists to automatically confirm repeated patterns across multiple cases. PLATINUM should be marked "reserved" on all public surfaces until the mechanism is built.

### 2. FirstEncounterProof exposes "C3 fidelity score"
Line 27: `"C3 fidelity score applied. Clarity, context, and consequence measured."` — This is a direct IP term violation on a public-facing component. Must be rewritten.

### 3. Social proof minimum N=5 is too low
`evidence.ts` shows public metrics when sample >= 5. For enterprise trust, this should be at least N=15 with confidence intervals.

### 4. Anonymisation is regex-based and insufficient
`case-draft-builder.ts` uses regex patterns for PII stripping. Will miss: uncommon company names, written-out financial figures, industry-specific jargon, project codenames.

### 5. AnonymisedCaseProof overclaims
Uses "Prevented" language without evidence method or seal. Should be labelled DEMONSTRATION_PATTERN.

### 6. No DEMONSTRATION_FALLBACK label on fallback outcomes in all contexts
`PublicProofBlocks.tsx` correctly labels fallback vs live, but not all consumers check this classification.

---

## PROOF CLAIM CLASSIFICATION

| Claim | Where | Classification | Data Backing | Action |
|-------|-------|---------------|-------------|--------|
| "Evidence graded" | FirstEncounterProof | DEMONSTRATION_PATTERN | Hardcoded | KEEP (remove C3 term) |
| "Contradiction detected" | FirstEncounterProof | DEMONSTRATION_PATTERN | Hardcoded | KEEP |
| "X% said result reflected situation" | PublicProofBlocks | LIVE_EVIDENCE (when N>=5) | User self-report | RAISE threshold to N=15 |
| "Leadership misalignment identified" | PublicProofBlocks fallback | DEMONSTRATION_FALLBACK | Hardcoded | LABEL clearly |
| "Prevented premature capital deployment" | AnonymisedCaseProof | OVERCLAIM | Hardcoded | REWRITE to "observed" |
| "Verified outcomes" | Homepage ProofLayer | LIVE_EVIDENCE / DEMONSTRATION_FALLBACK | API or fallback | KEEP with clear distinction |
| "Organisations typically stall within 30 days" | Homepage line ~2485 | OVERCLAIM | No sourcing | ADD evidence basis or REMOVE |
| "PLATINUM" seal exists | Seal system | NOT_WIRED | No mechanism to reach | MARK as reserved |
