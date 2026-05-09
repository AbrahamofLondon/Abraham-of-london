# Homepage Message Rebuild Brief

**Date:** 2026-05-09
**Surface:** `pages/index.tsx`
**Current state:** CategoryFrontDoor hero is strong; everything after it dilutes

---

## Current Diagnosis

The homepage is ~3,100 lines. Of those, ~1,500 are dead component definitions never rendered. The rendered path is:

1. CategoryFrontDoor (8 internal sections) — STRONG
2. HomeEvidenceSection — ACCEPTABLE but misplaced
3. HomeDecisionSection — REPETITIVE (overlaps with S4 ladder)
4. WhoThisIsFor — GOOD
5. Engagement lanes strip — UNVERIFIED (do linked pages exist?)
6. Trust strip — TOO WEAK (should be a major block)

The CategoryFrontDoor sections are the real homepage. Everything after Section 8 feels appended.

---

## What the Homepage Gets Right

- **Hero claim:** "The decision system that can refuse to proceed." — Category-defining.
- **Refusal engine demo:** The strongest differentiator proof on any surface. Shows the governance pipeline in action.
- **Anti-positioning:** "Not another assessment. Not another dashboard. Decision infrastructure." — Clear competitive contrast.
- **Product ladder:** Shows 8 stages as earned progression with free tags. Not a funnel.
- **Final CTA:** "Bring one decision the organisation cannot afford to get wrong." — Consequential, not checkout.

## What the Homepage Gets Wrong

1. **Identity fracture:** Homepage says "Decision Infrastructure" but Navbar says "Institutional Platform" and Footer says "A platform for disciplined thinking." Three identities.
2. **Trust section is a whisper:** 6 bullet points in small text. For a product whose primary differentiator is governance, trust should be a major block.
3. **"recommendation" in trust section:** "Every governed recommendation is auditable." Should be "directive" or "governed output."
4. **Post-CategoryFrontDoor sections compete:** After the natural conclusion at Section 8, the page adds 4+ more sections with competing CTAs.
5. **Dead code hazard:** ~1,500 lines of unused components containing "consulting," "advisory," "confidence score," live checkout integrations.
6. **Meta description:** "verified executive memory" — strong claim without evidence posture.
7. **Proof of Governance section:** Reveals compounding severity mechanic and threshold-based gating. Borderline IP.

---

## Proposed Section Architecture

### Section 1 — Hero (KEEP, SHARPEN)

**Current:** "The decision system that can refuse to proceed."
**Proposed:** Same headline. Remove "can" — make it "The decision system that refuses to proceed."

Sub-copy: Keep "Decision Infrastructure by Abraham of London tests serious decisions against evidence, authority, consequence, and execution reality."

CTA: "Test a decision" → `/diagnostics/fast` (keep)
Secondary: "See the governed review" → anchor (keep)

Micro-proof strip: Keep.

Footer line: "An earned-access decision institution. No generic output. No sale if the case is not ready." — Keep.

### Section 2 — Refusal Engine Demo (KEEP)

No changes. This is the strongest section on the site.

Add: Brief footer — "Live decisions are governed by the same pipeline. The system records, remembers, and follows up."

### Section 3 — Differentiation (KEEP)

No changes. Clean competitive contrast.

### Section 4 — Product Ladder (KEEP, EXTEND)

Keep the 8-stage earned progression display.

Add after ladder: One line — "Nothing resets. Evidence carries forward. The system does not start over."

### Section 5 — Trust Block (REPLACE — EXPAND)

**Current:** 6 bullet points in small text.

**Proposed structure:**

**"Why the system can be trusted"**

| Trust dimension | Statement |
|----------------|-----------|
| Source labels | "Every piece of evidence is labelled: who stated it, when, and how it was captured." |
| Confidence limits | "The system does not invent certainty. Where confidence is partial, it says so." |
| No fabrication | "The system does not fabricate checkpoints, evidence, or outcomes. If data is absent, it says so." |
| Challenge route | "Every governed output can be challenged. Challenges enter the case record." |
| Outcome verification | "The system does not claim a verified outcome unless evidence is actually provided." |
| Evidence standards | "Published proof must pass governed confidence thresholds. Self-reported evidence is never represented as independently verified." |
| Refusal | "No sale if the case is not ready. The system can refuse." |

Link: "View evidence standards" → `/evidence/standards`

### Section 6 — Proof of Governance (SHARPEN)

Replace: "Contradictions accumulate in severity over time" → "Contradictions accumulate. The system does not forget."

Replace: "Below threshold: the system restricts progression" → "If evidence is insufficient, the system restricts."

Remove threshold language from Evidence Quality description.

### Section 7 — Buyer Pathways (SHARPEN)

Middle card (enterprise) currently says: "Expose where stated strategy and operating reality disagree." This undersells. Replace with: "Test whether the organisation's stated strategy survives contact with its own evidence."

### Section 8 — Final CTA (KEEP)

No changes. Clean and correct.

### Section 9 — Who This Is For (MOVE UP from current position)

Move above the final CTA. The trigger conditions ("You are sitting on a decision that has been circling for more than 90 days") are good qualification signals that should appear before the final commitment ask.

### REMOVE from rendered page:

- HomeDecisionSection — repeats ladder content
- Engagement lanes strip — unless all 4 linked pages are verified live
- Trust strip at bottom — content merged into Section 5

### DELETE from file:

- HomeHero (~200 lines)
- PlatformArchitecture (~210 lines)
- FlagshipIntelligence (~140 lines)
- FlagshipAdvisory (~140 lines)
- FlagshipPublication, FlagshipBlogStrip, DiagnosticLadder, EscalationClose
- HowItWorksLadder, ProductClarity
- ContentLibrarySection (~230 lines)
- ProofLayer (~150 lines) — contains VERIFIED_CASE_EVIDENCE mislabelling
- HomeDecisionLayer (~150 lines) — contains live checkout integrations

Total dead code to delete: ~1,500 lines.

---

## CTA Hierarchy

| Priority | CTA | Target | Context |
|----------|-----|--------|---------|
| Primary | "Test a decision" | `/diagnostics/fast` | Hero + Final |
| Secondary | "See the governed review" | Anchor to S2 demo | Hero |
| Tertiary | "View evidence standards" | `/evidence/standards` | Trust block |
| Quaternary | "Enter Decision Centre" | `/decision-centre` | Buyer pathways (authenticated users only) |
| NOT on homepage | "Request Counsel Review" | — | Only when evidence warrants |
| NOT on homepage | "Enter Strategy Room" | — | Only when evidence warrants |

---

## Language Rules for Homepage

### Use
- "Decision Infrastructure"
- "governed"
- "evidence"
- "checkpoint"
- "directive"
- "confrontation"
- "the system refuses"
- "earned access"
- "consequence"
- "the system remembers"

### Do not use
- "insight" / "insights"
- "AI-powered"
- "consulting" / "advisory"
- "recommendation"
- "solution"
- "clarity" (as marketing adjective)
- "unlock"
- "dashboard"
- "tool"
- "transform"
- "smarter"
- "data-driven"
- "strategy services"

---

## What Must Be Removed

| Item | Line range (approx) | Reason |
|------|---------------------|--------|
| "recommendation" in trust section | S7 | Replace with "directive" |
| "verified executive memory" in meta description | Layout | Qualify or replace |
| "Compounds intelligence across every interaction" | S5 | Verify or qualify |
| "Consulting and Strategy Room" in PlatformArchitecture | Dead code | Delete entire component |
| "confidence score" in DiagnosticLadder | Dead code | Delete entire component |
| All dead component definitions | ~1,500 lines | Maintenance and security hazard |
