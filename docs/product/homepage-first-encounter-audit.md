# Homepage First-Encounter Audit

**Date:** 2026-05-07
**Scope:** pages/index.tsx render order and CategoryFrontDoor.tsx
**Standard:** First-encounter proof — user must experience evidence testing, contradiction detection, restriction, consequence, or memory within 5 seconds of landing.

---

## What the user understands in 5 seconds

**Current state:** The user sees "Governed Decision Intelligence" and "The decision system that can refuse to proceed." This communicates the refusal mechanism clearly. However:

- The product name **Decision Infrastructure by Abraham of London** does not appear.
- Abraham of London is not distinguished as the authority house vs. the product.
- The category label "Governed Decision Intelligence" describes the discipline, not the commercial system.

**Recommendation:** Update the hero eyebrow to "Decision Infrastructure by Abraham of London" and retain the category claim in supporting copy.

---

## Section-by-section audit

### CategoryFrontDoor (first rendered)

| Section | First-encounter proof | Verdict |
|---------|----------------------|---------|
| Hero | Category claim + CTAs | STRONG — refusal is the headline |
| Refusal Engine Demo | Deterministic governed sequence | STRONG — visible restriction moment |
| Category Differentiation | Contrasts with assessments, consultants, BI, copilots | STRONG — positions the category |
| Product Ladder | 8-stage accumulated intelligence | STRONG — no-reset model is clear |
| Proof of Governance | 6 mechanisms in plain English | ADEQUATE — adds depth |
| Buyer Pathways | 3 entry lanes | STRONG — routes by seriousness |
| Trust Section | 6 sober trust statements | ADEQUATE — institutional credibility |
| Final CTA | "Bring one decision..." | STRONG — consequential ask |

**CategoryFrontDoor is the strongest section of the homepage. It should not be diluted.**

### Legacy sections (rendered after CategoryFrontDoor)

| Section | What it shows | Duplicates CategoryFrontDoor? | Verdict |
|---------|--------------|-------------------------------|---------|
| HomeEvidenceSection | 3 case study cards | No — adds applied proof | **KEEP** |
| HowItWorksLadder | 8-stage evidence ladder with pricing | Yes — identical to section 4 | **COLLAPSE** |
| ProductClarity | 4-step post-diagnostic flow | Partial — overlaps section 4 | **REWRITE into post-evidence clarifier** |
| HomeDecisionSection | ER + Strategy Room flagship panels | Partial — overlaps sections 4+6 | **KEEP — refocused on deliverables** |
| WhoThisIsFor | Trigger conditions + outputs + poor fit | Partial — overlaps section 6 | **KEEP — adds consequence depth** |
| HomeFinalCta | Third CTA section | Yes — CategoryFrontDoor has 2 CTAs | **COLLAPSE** |

---

## Redundancy map

1. **Product ladder rendered twice:** CategoryFrontDoor section 4 (stages 01-08) and HowItWorksLadder (4-stage grouped version). Remove HowItWorksLadder.
2. **CTA rendered three times:** CategoryFrontDoor hero, CategoryFrontDoor final, HomeFinalCta. Remove HomeFinalCta; the page already closes with CategoryFrontDoor's final CTA before legacy sections.
3. **Buyer pathways + WhoThisIsFor overlap:** CategoryFrontDoor section 6 shows three buyer lanes. WhoThisIsFor adds trigger conditions and deliverables. Keep WhoThisIsFor but retitle as "When to use this" (already its eyebrow) to avoid persona duplication.

---

## Recommended homepage render order

```
1. CategoryFrontDoor          — category claim, refusal demo, differentiation,
                                 product ladder, governance proof, buyer pathways,
                                 trust, final CTA
2. HomeEvidenceSection         — applied proof (3 cases)
3. HomeDecisionSection         — flagship output detail (ER + Strategy Room)
4. WhoThisIsFor                — trigger conditions + deliverables + poor fit
5. Engagement lanes strip      — secondary routes (institutional, private, education, media)
6. Trust strip                 — verify founder, trust boundaries, evidence, foundations
```

**Removed:** HowItWorksLadder, ProductClarity, HomeFinalCta.

These sections are not deleted from the codebase — they are removed from the render path only. The component definitions remain for potential reuse on sub-pages.

---

## Product naming gap

The phrase "Decision Infrastructure by Abraham of London" does not appear on the homepage. The current hero uses "Governed Decision Intelligence" as the category label.

**Action:** Update CategoryFrontDoor hero eyebrow to "Decision Infrastructure by Abraham of London" and add "Governed Decision Intelligence" as a descriptor in supporting copy or the category differentiation section.

---

## Remaining first-encounter weaknesses

1. **No live proof on first scroll.** The refusal engine demo requires scrolling to the second section. Consider surfacing a micro-proof element in the hero itself (e.g., a single-line restriction signal).
2. **No personalisation signal.** First encounter does not hint at what the system will do with *your* decision. The demo is observational. The CTAs bridge this gap but the page could benefit from a "what you will receive" micro-statement near the hero.
3. **Evidence cases are anonymous.** The three case study titles are strong but link to /evidence/ routes — verify these routes exist and contain substantive content.
4. **No explicit "Decision Infrastructure" naming.** Covered above.
