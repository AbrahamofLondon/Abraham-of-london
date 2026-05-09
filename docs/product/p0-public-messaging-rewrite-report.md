# P0 Public Messaging Rewrite Report

**Date:** 2026-05-09
**Scope:** Persistent public-facing identity surfaces
**Standard:** Decision Infrastructure, earned progression, evidence memory, refusal authority

---

## Files Changed

| File | Changes |
|------|---------|
| `components/Navbar.tsx` | "Institutional Platform" → "Decision Infrastructure"; CTA "Counsel" → "Test a Decision" → `/diagnostics/fast` (desktop + mobile) |
| `components/EnhancedFooter.tsx` | Tagline "Governance · Architecture · Execution" → "Decision Infrastructure"; body text rewritten from content-brand to Decision Infrastructure description; "Score-based routing" → "Evidence-based routing"; "solution" → "intervention"; CTA "Enter Strategy Room" → "Test a Decision" → `/diagnostics/fast` |
| `pages/diagnostics/index.tsx` | "Decisions evaluated against an AI-accelerated market baseline" → removed; "The system extracts the decision" → "The system requires you to name the decision" |
| `pages/diagnostics/executive-reporting/run.tsx` | "Decisions evaluated against an AI-accelerated market baseline" → removed |
| `pages/strategy-room/index.tsx` | "In an AI-accelerated environment" → "Stagnation is negative movement"; "AI-accelerated market baseline" → "cost, consequence, and execution evidence"; "Private advisory" + "Contact" links → "Evidence standards" link |
| `components/diagnostics/results/AITerrainExposure.tsx` | "AI-accelerated market baseline" → "competitive position and execution evidence" |
| `components/strategy-room/RetainerEntryGate.tsx` | "AI-accelerated market baseline" → "cost, consequence, and execution evidence" |
| `lib/diagnostics/ai-terrain.ts` | "AI-accelerated baseline" → "competitive baseline" (risk factor); "AI-accelerated competitors" → "Faster-moving competitors" (directive) |
| `components/proof/PublicProofBlocks.tsx` | `VERIFIED_CASE_EVIDENCE` → `SOURCE_LABELLED_EVIDENCE` (all instances); "Verified case evidence" → "Source-labelled case evidence"; sample threshold 5 → 15 |
| `lib/product/evidence-classification.ts` | Type `VERIFIED_CASE_EVIDENCE` → `SOURCE_LABELLED_EVIDENCE` with updated documentation |
| `components/trust/ArbiterBadge.tsx` | Code comment stripped of architecture specifics ("five arbiter rules, tournament mechanics, or scoring logic" → "internal validation system architecture") |
| `pages/evidence/standards.tsx` | "What we do not publish" list generalized: removed "Scoring formulas or engine weights", "Arbitration logic or prompt structures", "Contradiction graph mechanics" — replaced with generic descriptions |

---

## Phrases Removed

| Phrase | Occurrences removed | Replacement |
|--------|-------------------|-------------|
| "AI-accelerated market baseline" | 6 (all user-facing instances) | "competitive position and execution evidence" / "cost, consequence, and execution evidence" / removed entirely |
| "Institutional Platform" | 1 (Navbar) | "Decision Infrastructure" |
| "A platform for disciplined thinking" | 1 (Footer) | Decision Infrastructure description |
| "Governance · Architecture · Execution" | 1 (Footer tagline) | "Decision Infrastructure" |
| "Score-based routing" | 1 (Footer) | "Evidence-based routing" |
| "solution" | 1 (Footer diagnostics card) | "intervention" |
| "Private advisory" | 1 (Strategy Room gate) | Removed |
| "Contact" link | 1 (Strategy Room gate) | Replaced with "Evidence standards" |
| "VERIFIED_CASE_EVIDENCE" | 5 (PublicProofBlocks + type) | "SOURCE_LABELLED_EVIDENCE" |
| "Scoring formulas or engine weights" | 1 (Evidence standards) | "Internal classification methods or computational structures" |
| "Arbitration logic or prompt structures" | 1 (Evidence standards) | "Routing logic or decision-engine internals" |
| "Contradiction graph mechanics" | 1 (Evidence standards) | "Proprietary operating mechanics" |
| "five arbiter rules, tournament mechanics" | 1 (ArbiterBadge comment) | "internal validation system architecture" |

---

## Phrases Preserved

| Phrase | Location | Reason |
|--------|----------|--------|
| "The decision system that can refuse to proceed." | Homepage hero | Category-defining |
| "Durable proof, not performance theatre." | Proof Pack | Strongest framing |
| "You are not starting again. The system remembers this case." | Return Brief | Governance promise |
| "This is an irreversibility estimate, not a verified external fact." | Strategy Room session | Gold standard trust disclosure |
| "It does not claim a verified outcome unless evidence is actually provided." | OV Panel | Must be propagated |
| "Counsel Review is not a starting point." | Counsel Index | Earned escalation |
| "No sale if the case is not ready." | Homepage, do-not-sell-gate | Commercial discipline |

---

## Identity Standard Applied

**Before:**
- Homepage: "Decision Infrastructure" 
- Navbar: "Institutional Platform"
- Footer: "A platform for disciplined thinking" / "Governance · Architecture · Execution"

**After:**
- Homepage: "Decision Infrastructure"
- Navbar: "Decision Infrastructure"
- Footer: "Decision Infrastructure"

All three persistent surfaces now use the same canonical identity.

---

## CTA Standard Applied

**Before:**
- Homepage: "Test a decision" → `/diagnostics/fast`
- Navbar: "Counsel" → `/counsel` (bypassed earned progression)
- Footer: "Enter Strategy Room" → `/strategy-room` (bypassed earned progression)

**After:**
- Homepage: "Test a decision" → `/diagnostics/fast`
- Navbar: "Test a Decision" → `/diagnostics/fast`
- Footer: "Test a Decision" → `/diagnostics/fast`

All persistent CTAs now respect earned progression.

---

## Remaining Risks

| Risk | Severity | Location | Note |
|------|----------|----------|------|
| ~30 stale `/consulting` links in older homepage components | MEDIUM | Various homepage/* components | Caught by permanent redirect but labels still say "Consulting" |
| "advisory" used in trust components (DiagnosticStandardPanel, EvidenceTierBadge, GovernanceDisclosure) | MEDIUM | components/trust/* | P1 item — "professional advisory support" should be "independent professional review" |
| Constitutional Diagnostic full scoring dimensions in client-side types | MEDIUM | ConstitutionalDiagnostic.tsx | P2 item — needs server-side migration |
| "AI-accelerated" remains in code comments and internal lib type definitions | LOW | lib/diagnostics/ai-terrain.ts | Comments only, not user-facing strings |
| "unlock" / "Upgrade Now" across Inner Circle surfaces | MEDIUM | inner-circle/* components | P2 item |
| Homepage ~1,500 lines dead code | LOW | pages/index.tsx | Cleanup item — contains flagged terms but is not rendered |
| "dashboard" references in pages/dashboard/* and counsel pages | LOW | Various | P2 item |
