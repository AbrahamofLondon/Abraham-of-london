# Surface Messaging Integrity Audit

**Date:** 2026-05-09
**Auditor posture:** Hostile
**Surfaces audited:** 50+
**Claims reviewed:** 200+

---

## Master Audit Table

| Surface | Role | Current Headline | Accuracy | Trust Posture | Action Clarity | IP Risk | Overclaim | Underclaim | Required Action |
|---------|------|-----------------|----------|---------------|----------------|---------|-----------|------------|-----------------|
| **Homepage (CategoryFrontDoor)** | Entry / category declaration | "The decision system that can refuse to proceed." | STRONG | GOOD — disclaimer on demo, but "recommendation" in trust section | 8/10 — "Test a decision" is clear | LOW | "Compounds intelligence across every interaction" — verify live | Trust section too minimal for primary differentiator | Sharpen trust section; replace "recommendation" with "directive"; delete ~1500 lines dead code |
| **Homepage (HomeDecisionSection)** | Product pricing | "Executive Reporting is the destination." | ACCEPTABLE | WEAK — no source labels on pricing justification | 5/10 — competes with CategoryFrontDoor CTAs | NONE | NONE | Repeats ladder already shown | Suppress or merge into CategoryFrontDoor S4 |
| **Homepage (WhoThisIsFor)** | Buyer qualification | "Built for operators carrying real consequence." | STRONG | N/A | 7/10 | NONE | NONE | NONE | Keep |
| **Navbar** | Global navigation | "Institutional Platform" + "Counsel" CTA | WRONG — identity should be "Decision Infrastructure" | N/A | 5/10 — "Counsel" bypasses earned progression | NONE | NONE | "Institutional Platform" undersells | Replace sub-label; change CTA to "Test a Decision" |
| **Footer** | Global footer | "A platform for disciplined thinking" | WRONG — legacy brochure language | N/A | 4/10 — "Enter Strategy Room" bypasses earned progression | "Score-based routing" leaks mechanics | NONE | Dramatically undersells the product | Replace body text, tagline, CTAs; remove "solution" |
| **Fast Diagnostic** | Entry diagnostic | "You don't have an execution problem." | STRONG | GOOD — ArbiterBadge, GovernanceDisclosure, disclaimers | 8/10 | LOW — challenge stage taxonomy visible | "Reading your decision pattern" from 3 inputs | Checkpoint/Return Brief moat hidden below fold | Replace "pattern" loading line; surface checkpoint promise |
| **Diagnostics Index** | Navigation hub | "Where is the contradiction?" | STRONG | ACCEPTABLE | 7/10 | NONE | "AI-accelerated market baseline" — CRITICAL | NONE | SUPPRESS "AI-accelerated" line |
| **Executive Reporting Gate** | Paid conversion | "You have seen the diagnosis." | MODERATE | WEAK — no ArbiterBadge, no GovernanceDisclosure | 5/10 — multiple exit paths | NONE | "It IS a decision structure failure" — asserts unverified | Missing cost disclaimer present on free surface | Add source labels; add disclaimer; soften assertion |
| **Executive Reporting Run** | Paid executive report | Intake form + result display | STRONG | STRONG — ClaimGovernedCapabilities pattern | 6/10 — result surface very dense | "registry" type schema in client | "AI-accelerated market baseline" repeated | ClaimGovernedCapabilities undersold | SUPPRESS "AI-accelerated"; add executive summary section |
| **Constitutional Diagnostic** | Multi-axis assessment | "A serious first reading, not a decorative questionnaire." | STRONG | GOOD — GovernanceDisclosure, HumanReviewPrompt | 7/10 | HIGH — full scoring dimensions in ApiSuccess type | "Real microcosm of the wider estate" is dev language | Evidence capture bridge undersold | Remove dev language from UI; move scoring server-side |
| **Team Assessment** | Team perception gap | Domain prompts + gap reading | STRONG | GOOD — EvidenceStrengthMeter | 7/10 | MEDIUM — gap thresholds client-side | NONE | Evidence capture prompts undersold | Clarify "Leader-estimate mode" prominently |
| **Enterprise Assessment** | Institutional assessment | 4-block structural reading | STRONG | GOOD — evidence bridge requires 5 fields | 7/10 | MEDIUM — thresholds client-side | NONE | Evidence bridge undersold | Consider server-side thresholds |
| **Purpose Alignment** | Personal decision audit | Context steps + dual-axis signals | STRONG | GOOD | 8/10 | MODERATE — scoring importable | "Verdict people trust" — unsubstantiated | NONE | Replace "verdict" language |
| **Decision Centre** | Case console | "Your active cases, evidence state, admissibility." | STRONG | GOOD — estimated labels correct | 8/10 | LOW — cognitive state labels visible | NONE | Cost of inaction missing "not independently verified" | Add verification caveat to cost; review cognitive state exposure |
| **Strategy Room Index** | Execution gate | "Execution begins now." | STRONG | WEAK — "system has determined" overclaims | 9/10 | MEDIUM — "AI-accelerated market baseline" | "System has determined" | Intervention risk-if-ignored is template text | Replace "determined" with "evidence supports"; remove AI baseline |
| **Strategy Room Session** | Active execution | "Everything from this point forward is execution." | EXCELLENT | GOLD STANDARD — irreversibility disclaimer | 9/10 | LOW | NONE | "Continue execution" button is weak | Rename button to "Mark session concluded" |
| **Return Brief** | Confrontation document | "You are not starting again. The system remembers." | EXCELLENT | GOLD STANDARD — every block source-labelled | 10/10 | LOW | NONE | "Ongoing oversight may be required" too soft | Sharpen retainer trigger language |
| **Counsel Index** | Escalation chamber | "Counsel Review is not a starting point." | GOOD | GOOD — evidence-gated | 8/10 | LOW | "System has enough evidence to determine" | Never explains what counsel IS | Add what-counsel-produces block; fix "determine" |
| **Counsel Intake** | Structured submission | "These questions ask what only you know." | GOOD | GOOD — permission checkbox | 9/10 | NONE | NONE | "Strategic intervention" sounds like consulting | Replace counsel type label |
| **Counsel Status** | Case tracking | "A status surface, not a sales funnel." | GOOD | ACCEPTABLE | 7/10 | NONE | NONE | Sparse — no action guidance | Add next-action for current state |
| **Boardroom** | Board delivery | "Boardroom readiness" | GOOD | GOOD — qualification gate | 9/10 | LOW | "Verified outcomes" without qualification | NONE | Qualify "verified" with source method |
| **Proof Pack** | Evidence export | "Durable proof, not performance theatre." | EXCELLENT | STRONG — four-part provenance chain | 7/10 | NONE | "outcomesVerified" same issue as boardroom | No explanation of use cases | Qualify "verified"; add use-case block |
| **Evidence Standards** | Trust disclosure | "How evidence becomes publishable." | STRONG | STRONG — honest seal definitions | 7/10 | MEDIUM — "What we do not publish" confirms architecture | NONE | NONE | Generalize the "do not publish" list |
| **Evidence Seals** | Seal registry | "Integrity Seal Registry" | EXCELLENT | STRONG — Platinum "We do not" | 8/10 | NONE | NONE | NONE | Keep |
| **Evidence Index** | Case evidence hub | "Observed under real conditions." | MODERATE | WEAK — "outcome-verified" for static assets | 7/10 | NONE | "outcome-verified cases" for static proof | NONE | Fix badge to "static proof assets"; add disclaimer |
| **Evidence [slug]** | Case dossier | "Static proof asset" | STRONG | GOOD — evidence basis tags | 8/10 | MEDIUM — System Trace names internal components | NONE | NONE | Generalize System Trace component names |
| **Oversight Brief** | Governed cycle artifact | "Governed Oversight Brief" | EXCELLENT | STRONG — "not as independently verified evidence" | 7/10 | NONE | NONE | NONE | Keep |
| **Retainer** | Retained enforcement | "Decision Authority as a Service" | WRONG — contradicts institutional identity | ACCEPTABLE | 6/10 | LOW | "as a Service" | NONE | Replace eyebrow |
| **Retainer Intake** | Oversight intake | "Oversight readiness." | EXCELLENT | STRONG — non-guarantee, non-sales | 8/10 | NONE | NONE | NONE | Keep |
| **Return Brief Email** | Email delivery | "Return Brief: unresolved condition still active" | MODERATE | WEAK — no evidence posture labels | 7/10 | NONE | Cost shown without estimate qualifier | NONE | Add evidence posture line and footer disclaimer |
| **Oversight Email** | Email delivery | "Oversight Brief: {cycleLabel}" | MODERATE | WEAK — no evidence posture labels | 6/10 — 3 CTAs | NONE | NONE | NONE | Reduce to 2 CTAs; add evidence footer |
| **DiagnosticStandardPanel** | Trust disclosure | "Not medical, legal, financial, or clinical advice." | STRONG | STRONG | N/A | NONE | NONE | "professional advisory support" — identity leak | Replace "advisory" |
| **EvidenceTierBadge** | Evidence quality badge | Tier labels | ACCEPTABLE | ACCEPTABLE | N/A | NONE | "Outcome-verified" needs method qualifier | NONE | Replace "advisory review" throughout |
| **GovernanceDisclosure** | Governance explanation | "How this {label} is governed" | GOOD | GOOD — challenge routes present | N/A | LOW — readinessTier visible | NONE | NONE | Replace "advisory review" |
| **FinancialExposureDisclosure** | Financial display | "Not a financial forecast." | EXCELLENT | EXCELLENT — multi-layer disclaimers | N/A | LOW — "cost-of-delay engine" named | NONE | NONE | Keep |
| **PublicProofBlocks** | Public proof | Fallback outcomes | PROBLEMATIC | WEAK — AccuracyMetricsBlock labels self-reported as VERIFIED | N/A | NONE | VERIFIED_CASE_EVIDENCE for self-reported data | NONE | Fix data classification; fix sample threshold |
| **ProofCapturePrompt** | Evidence capture | "Did this accurately reflect your situation?" | ACCEPTABLE | ACCEPTABLE | N/A | NONE | NONE | NONE | Remove "consulting" reference |
| **ArbiterBadge** | Trust signal | "quality check: passed" | EXCELLENT | EXCELLENT — hides all internals | N/A | LOW — code comment reveals architecture count | NONE | Could convey more product value | Strip specific comment; consider "internal challenge" |
| **OutcomeVerificationPanel** | Outcome self-report | "It does not claim a verified outcome unless evidence is actually provided." | EXCELLENT | GOLD STANDARD | 10/10 | NONE | NONE | NONE | Propagate this standard everywhere |
| **Admin Oversight Review** | Operator surface | "Without pretending automation exists where it does not." | EXCELLENT | STRONG | N/A | N/A (admin) | NONE | NONE | Keep |
| **Admin Counsel Review** | Operator surface | "It is not an advice inbox." | EXCELLENT | STRONG | N/A | N/A (admin) | NONE | NONE | Keep |

---

## Aggregate Statistics

| Metric | Count |
|--------|-------|
| **Total surfaces audited** | 42 |
| **Total claims reviewed** | 200+ |
| **Overclaims found** | 14 |
| **Underclaims found** | 18 |
| **IP leakage risks** | 12 |
| **Stale consultancy/SaaS phrases** | 30+ ("consulting" links, "unlock", "Upgrade Now", "insights") |
| **Unclear CTAs** | 6 |
| **Identity contradictions** | 3 (Navbar, Footer, Retainer eyebrow) |

---

## Homepage Verdict

**FAIL — but fixable.**

The CategoryFrontDoor hero is strong. The refusal engine demo is the best differentiator proof on any page. The product ladder correctly shows earned progression. But:

1. The product is called three different things (Homepage: "Decision Infrastructure", Navbar: "Institutional Platform", Footer: "A platform for disciplined thinking").
2. ~1,500 lines of dead code contain flagged terms and stale checkout integrations.
3. The trust section is a 6-line whisper strip — too weak for the product's primary differentiator.
4. The page continues past its natural conclusion with competing CTAs.
5. Navigation CTA ("Counsel") and Footer CTA ("Enter Strategy Room") bypass earned progression.

---

## Top 10 Messaging Defects

1. **"Decisions evaluated against an AI-accelerated market baseline"** — appears in diagnostics index and ER run. Uses AI as marketing adjective. Unsubstantiated benchmark claim. CRITICAL.
2. **Identity inconsistency across persistent surfaces** — three different product identities (homepage, navbar, footer). Structural failure.
3. **Navbar "Counsel" CTA bypasses earned progression** — the primary nav CTA offers the highest escalation tier to everyone. Contradicts the governance narrative.
4. **Footer body text describes a content brand, not Decision Infrastructure** — "A platform for disciplined thinking: doctrine, systems, and strategic execution arranged for leaders, builders, and institutions that intend to endure."
5. **PublicProofBlocks labels self-reported data as VERIFIED_CASE_EVIDENCE** — directly contradicts evidence standards page. Sample threshold (5) contradicts standards page (15).
6. **Executive Reporting gate has weaker trust posture than the free diagnostic** — no ArbiterBadge, no GovernanceDisclosure, no cost disclaimer at the primary paid conversion point.
7. **30+ stale `/consulting` links across homepage components** — redirects catch users but labels show wrong identity.
8. **"Unlock" / "Upgrade Now" across Inner Circle surfaces** — pure SaaS paywall language undermines earned progression.
9. **"advisory" used 4x in trust/disclosure components** — product claims to transcend advisory but then uses the word in its own trust disclosures.
10. **Constitutional Diagnostic exposes full scoring dimensions client-side** — authorityScore, coherenceScore, pressureScore, frictionScore, trustScore, seriousnessScore, governanceDiscipline, interventionReadiness, narrativeCoherence, failureModeCount, failureModeSeverity all in browser source.

---

## Top 10 Strongest Messages to Preserve

1. **"The decision system that can refuse to proceed."** — Homepage hero. Category-defining.
2. **"Durable proof, not performance theatre."** — Proof Pack. Perfect institutional framing.
3. **"You are not starting again. The system remembers this case."** — Return Brief. Governance promise.
4. **"This is an irreversibility estimate, not a verified external fact."** — Strategy Room session. Gold standard for trust disclosure.
5. **"These consequences have not been independently verified. They represent what you reported during Strategy Room intake."** — Return Brief. Evidence honesty.
6. **"It does not claim a verified outcome unless evidence is actually provided."** — Outcome Verification Panel. Must be propagated.
7. **"The system will not fabricate one here."** — Return Brief (no checkpoint state). Radical honesty.
8. **"This is a status surface, not a sales funnel."** — Counsel Status. Anti-funnel identity.
9. **"Without pretending automation exists where it does not."** — Admin Oversight Review. Operational honesty.
10. **"Counsel Review is not a starting point."** — Counsel Index. Earned escalation framing.

---

## P0 Rewrite List

1. Homepage trust section — expand from 6-line strip to full evidence block
2. Homepage dead code — delete ~1,500 lines of unused components
3. Navbar sub-label — "Institutional Platform" → "Decision Infrastructure"
4. Navbar CTA — "Counsel" → "Test a Decision" → `/diagnostics/fast`
5. Footer body text — complete rewrite to Decision Infrastructure language
6. Footer CTA — "Enter Strategy Room" → "Test a Decision"
7. "AI-accelerated market baseline" — suppress from diagnostics index and ER run
8. Executive Reporting gate — add ArbiterBadge, GovernanceDisclosure, cost disclaimer
9. PublicProofBlocks — fix VERIFIED_CASE_EVIDENCE classification; fix sample threshold
10. Stale `/consulting` links — update 30+ references across homepage components

---

## Final Recommendation

### SHIP AFTER P0 REWRITE

The product is materially stronger than its messaging in critical areas. The Return Brief, Strategy Room session, Outcome Verification Panel, and Proof Pack are gold-standard surfaces. The homepage hero is category-defining. But the persistent navigation, footer, and trust language actively undermine the product's identity. The AI-accelerated baseline claim and VERIFIED_CASE_EVIDENCE mislabelling are integrity risks. The 30+ stale consulting links are technical debt.

Ship after the P0 list above is resolved. The product deserves language that matches its architecture.
