# Homepage Total Real-Estate Audit

Date: 2026-05-09
Scope: `pages/index.tsx`, `components/homepage/CategoryFrontDoor.tsx`, `components/Header.tsx`, `components/EnhancedFooter.tsx`, `components/proof/PublicProofBlocks.tsx`, `lib/commercial/catalog.ts`, `lib/commercial/recommendation-engine.ts`
Method: static code audit of the rendered homepage tree and linked trust/commercial surfaces. This is evidence-led, but not a live browser/video capture pass.

## Final Verdict

`HOMEPAGE_NOT_READY`

Why:

- The first view is distinctive but not yet clear enough about what the product actually is in operational terms.
- The page claims earned progression, then repeatedly bypasses it by linking directly into paid or later-stage routes.
- A full-width final CTA appears inside `CategoryFrontDoor` before applied proof and flagship output detail arrive.
- Trust language is stronger than the proof scaffolding that is visible on the homepage.
- Mobile authority is weakened by small type, long sequencing, and a dense fixed header.

## Part 1: Section Inventory

| Order | Section | File | Intended Job | Actual Job | Verdict | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Persistent header | `components/Header.tsx` | Orientation, authority, route to system surfaces | Mixes product, content, member, and strategy routes before homepage has earned the distinction | `KEEP_BUT_REWRITE` | Strong visual authority, but the wordmark subtitle still says `Diagnostics · Intelligence · Advisory`, which muddies the category claim |
| 1 | Hero | `components/homepage/CategoryFrontDoor.tsx` | Declare category, show refusal capability, give the correct first action | Distinctive category claim with a strong refusal angle, but still abstract and asks for understanding before proof | `KEEP_BUT_REWRITE` | Best conceptual asset on the page, but the user still has to decode what happens after clicking |
| 2 | Refusal engine demonstration | `components/homepage/CategoryFrontDoor.tsx` | Prove governed review and visible restriction | Strong proof-of-posture block | `KEEP` | One of the few sections doing real differentiating work |
| 3 | Category differentiation | `components/homepage/CategoryFrontDoor.tsx` | Make substitutes irrational | Mainly says what others fail to do | `KEEP_BUT_REWRITE` | Useful, but too negative and still product-internal |
| 4 | Product ladder | `components/homepage/CategoryFrontDoor.tsx` | Explain earned progression and continuity | Shows too many stages too early and exposes the whole ladder before the user understands the entry logic | `KEEP_BUT_REORDER` | Ladder belongs later, after proof and trust |
| 5 | Governance proof grid | `components/homepage/CategoryFrontDoor.tsx` | Explain why the system is serious and bounded | Adds trust posture, but mostly as assertions | `KEEP_BUT_REWRITE` | Good themes, thin proof |
| 6 | Buyer pathways | `components/homepage/CategoryFrontDoor.tsx` | Route audiences to correct entry | Pushes direct entry to `Enterprise Assessment` and `Executive Reporting` before progression is earned | `REBUILD` | Violates the page's own earned-progression doctrine |
| 7 | Trust section | `components/homepage/CategoryFrontDoor.tsx` | Explain trust, labels, suppression, refusal, challenge | Strong trust language block, but long and still unsupported in situ | `KEEP_BUT_REWRITE` | Keep the structure, tighten the claims |
| 8 | Final CTA inside front door | `components/homepage/CategoryFrontDoor.tsx` | Close the front-door narrative with earned action | Premature close before proof, flagship output, and use-case qualification | `REMOVE` | This CTA fires too early in the full page order |
| 9 | Observed in practice | `pages/index.tsx` `HomeEvidenceSection` | Show concrete case evidence | Late proof strip with good direction but weak placement and low depth | `KEEP_BUT_REORDER` | Should arrive before any final close and before paid-route signals |
| 10 | Flagship output / escalation | `pages/index.tsx` `HomeDecisionSection` | Explain Executive Reporting and Strategy Room | Useful product clarity, but appears after an earlier final CTA | `KEEP_BUT_REORDER` | Content is needed, order is wrong |
| 11 | When to use this | `pages/index.tsx` `WhoThisIsFor` | Qualify fit and seriousness | Good fit filter, but arrives too late | `KEEP_BUT_REORDER` | This belongs much earlier |
| 12 | Engagement lanes strip | `pages/index.tsx` | Route non-diagnostic visitors elsewhere | Thin lane strip | `COMPRESS` | Functionally fine, but generic and low-value in this position |
| 13 | Trust strip | `pages/index.tsx` | Give proof/trust exits before exit | Duplicates trust pathways already established above | `MERGE` | Repetition without new evidence |
| 14 | Footer gateway grids + directory | `components/EnhancedFooter.tsx` | Deep navigation and institutional atmosphere | Visually premium, but extremely busy and route-heavy | `KEEP_BUT_REWRITE` | Good footer, weak as a conversion-adjacent surface because it reopens too many paths |

## Part 2: Above-The-Fold Audit

Primary classification: `FIRST_VIEW_INTERESTING_BUT_UNCLEAR`

Additional failures present:

- `FIRST_VIEW_WRONG_CTA`
- `FIRST_VIEW_MOBILE_WEAK`

Assessment:

- What is this within 5 seconds: partly. The user gets "decision system" and "can refuse to proceed", but not a clean mental model of what they submit, what comes back, and why it is an institution rather than a diagnostic brand.
- Is `Decision Infrastructure` clear: not yet. It sounds expensive and serious, but still leans category-theatre rather than plain comprehension.
- Is refusal capability visible early enough: yes. This is the best part of the hero.
- Is the first CTA correct: partly. `Test a decision` is directionally right, but the hero still describes a governed institution while routing to a diagnostic action that has not been fully framed.
- Does the first CTA respect earned progression: yes more than later CTAs do, but the page then undermines itself downstream.
- Is there a clear start-here path: yes, but it competes with too many adjacent system claims and later alternate paths.
- Is the page asking for too much trust too early: yes. The hero asks the user to believe in refusal, evidence posture, and no-sale discipline before showing enough concrete return.
- Does the hero sound like software, consulting, AI, governance, or institution: a hybrid of governance and institutional AI product. The ambiguity is part of the problem.
- Is the visual hierarchy calm or noisy: mostly calm on desktop, but the fixed header and multiple micro-lines create density on mobile.
- Does the mobile hero preserve the same authority: not fully. Small mono text and a tall header reduce composure.

## Part 3: Message Architecture Audit

Expected sequence:

1. Category declaration
2. Pain / market defect
3. Refusal and earned progression
4. How evidence becomes decision memory
5. What the system does
6. Proof / trust / evidence posture
7. Product ladder / entry path
8. Operator / institutional use cases
9. Final earned CTA

Current sequence:

1. Category declaration
2. Refusal demo
3. Competitor contrast
4. Full ladder
5. Governance claims
6. Buyer pathways
7. Trust claims
8. Final CTA
9. Applied evidence
10. Flagship output
11. Fit / seriousness
12. Misc lanes and duplicate trust links

Verdict: the current sequence is strategically wrong. It closes and routes before it has earned the close.

Message block classifications:

| Message Block | Classification | Note |
| --- | --- | --- |
| `Decision Infrastructure by Abraham of London` | `STRONG_BUT_TOO_INTERNAL` | Strong label, weak plain-language unpacking |
| `The decision system that can refuse to proceed` | `CLEAR` | Strongest category line on the page |
| `Submit one decision under pressure` | `CLEAR` | Good action framing |
| Hero micro-proof | `STRONG_BUT_TOO_INTERNAL` | Reads like system theatre without concrete outcome |
| Refusal demo | `CLEAR` | Best explanatory block |
| Category differentiation grid | `TRUE_BUT_NOT_MARKET_READY` | Uses negation more than superiority |
| `Each stage adds evidence. Nothing resets.` | `CLEAR` | Strong and valuable |
| Product ladder details | `DUPLICATE` | Too much ladder detail before proof |
| Governance feature grid | `TRUE_BUT_NOT_MARKET_READY` | Mostly internal capability language |
| Buyer pathways | `SAAS_LANGUAGE` | Audience segmentation block behaves like a funnel |
| Trust section | `CLEAR` | Strong conceptually |
| Trust section claim density | `OVERCLAIM` | Homepage visibility does not support every claim |
| Applied evidence cards | `UNDERCLAIM` | Real proof is underpowered and under-placed |
| Executive Reporting / Strategy Room block | `CLEAR` | Good product framing, misplaced |
| `Board-grade. Derived from your specific evidence.` | `TRUE_BUT_NEEDS_CAVEAT` | Needs visible evidence standards or sample basis nearby |
| Evidence / trust strips near the end | `DUPLICATE` | Repeats links rather than strengthening conviction |
| What happens after evidence submission | `MISSING` | Not explained clearly enough on-page |
| Decision memory continuity proof | `MISSING` | Claimed repeatedly, barely shown |

## Part 4: Positioning Audit

| Category | Does homepage distinguish clearly? | Current weakness | Required improvement |
| --- | --- | --- | --- |
| AI copilots | Partly | Strong refusal angle, weak product proof | Show a concrete governed output artifact and checkpoint memory |
| Decision-support dashboards | Partly | Says "not dashboard", but visual proof is mostly text | Show decision artifact, not just category language |
| BI / reporting tools | Partly | Differentiation is verbal | Show consequence pricing tied to decision governance |
| Coaching / personality assessments | Mostly | Hero is better than the rest | Remove or rename surfaces that still feel like assessments |
| Consulting / advisory firms | Partly | Header subtitle still includes `Advisory`; Executive Reporting can read like consulting | Make the institution/system distinction more concrete |
| Project management tools | Weakly | Execution cadence is mentioned, not shown | Show checkpoints, follow-up logic, and what gets remembered |
| OKR tools | Weakly | Governance framing helps, but no direct proof | Show that the system judges the decision before execution tracking begins |
| Governance / compliance platforms | Weakly | Serious tone overlaps with governance software | Clarify this governs decision validity, not policy administration |
| Survey tools | Partly | `diagnostics`, `assessment`, and multi-stage ladder still risk survey framing | Replace menu-like feel with case progression logic |
| Strategy templates | Partly | Refusal angle helps; still too much abstract prose | Show outputs that cannot be mistaken for templates |

## Part 5: Trust, Evidence, and Method Audit

Major trust claims:

| Claim | Classification | Note |
| --- | --- | --- |
| `can refuse to proceed` | `SAFE_AND_STRONG` | Demonstrated early and consistently |
| `No generic output` | `SAFE_BUT_WEAK` | Plausible, but not visibly proved on homepage |
| `No sale if the case is not ready` | `TRUE_BUT_NEEDS_CAVEAT` | Homepage later links directly to later-stage paid routes |
| `Each stage adds evidence. Nothing resets.` | `SAFE_BUT_WEAK` | Valuable claim, but continuity is asserted rather than shown |
| `Source-labelled evidence` | `SAFE_AND_STRONG` | Supported by `/evidence/standards` posture |
| `No fabricated verification` | `SAFE_AND_STRONG` | Consistent with proof block fallback labeling and standards page |
| `Commitment memory` | `SAFE_BUT_WEAK` | Claimed, not shown on homepage |
| `Protected internals` | `SAFE_AND_STRONG` | Correct posture |
| `Challenge route` | `SAFE_BUT_WEAK` | Mentioned, not operationally shown |
| `Earned progression` | `OVERCLAIM` | Violated by direct buyer-path CTAs |
| `verified executive memory` in layout description | `OVERCLAIM` | Too compressed and not defended on homepage |

Trust verdict:

- The trust doctrine is better than the page execution.
- The evidence standards surface is materially stronger than the homepage summary of it.
- The homepage needs fewer trust claims and one or two harder proof surfaces.

## Part 6: CTA / Earned Progression Audit

See `docs/product/homepage-cta-earned-progression-audit.md` for the full register.

Headline result:

- Correct CTAs: hero `Test a decision`, refusal demo `Run yours`, trust link to `/evidence/standards`
- Wrong CTAs: buyer-path `Run Enterprise Assessment`, buyer-path `Enter Executive Reporting`, flagship `Open Executive Reporting`
- Structural failure: the page contains a final CTA before the proof and flagship blocks that are supposed to earn it

## Part 7: Product Ladder Clarity Audit

| Product Layer | Current Homepage Visibility | Should Visibility Increase/Decrease? | Reason |
| --- | --- | --- | --- |
| Fast Diagnostic | High | Keep | Correct start point |
| Personal Decision Audit / Purpose Alignment | Medium, but under old name | Increase clarity, not prominence | Naming inconsistency weakens coherence |
| Constitutional Diagnostic | Medium | Keep | Important ladder stage |
| Executive Reporting | High | Keep but delay | Too early and too accessible |
| Strategy Room | High | Keep but delay | Seriousness is signalled, but still too reachable from homepage |
| Return Brief | Low | Increase slightly | Important proof of continuity |
| Decision Centre | None | Increase later | Needed if memory and continuity are core claims |
| Counsel Review | None on live homepage body | Increase slightly | Good serious-signal surface if framed as qualified |
| Boardroom | None | Increase slightly | Useful proof of institutional seriousness |
| Oversight / Retainer | None | Do not increase on homepage yet | Too advanced for first encounter without strong proof spine |

## Part 8: Graphic / Visual System Audit

Verdict: `TOO_TEXT_HEAVY`

Secondary tags:

- `VISUALLY_INSTITUTIONAL`
- `NEEDS_PRODUCT_PROOF`
- `MOBILE_DENSE`

Assessment:

- Expensive look: yes, especially the dark/gold palette and serif/mono pair.
- Too template-like: no. The visual direction is distinctive.
- Actual product shown enough: no. Most visuals are text panels, not artifacts.
- Abstract graphics doing real work: partly. The refusal demo does real work; much else is decorative text treatment.
- Refusal engine demo strong enough: yes, relative to the rest.
- Visual proof of memory / continuity: no.
- Too many text blocks: yes.
- Replaceable visuals: buyer pathways, trust grid, and some category-diff cards should eventually become product artifacts, case excerpts, or memory views.

## Part 9: Mobile Audit

Overall classification: `MOBILE_ACCEPTABLE_WITH_FIXES`

| Mobile Area | Status | Issue | Fix |
| --- | --- | --- | --- |
| Header | Weak | Fixed header consumes authority and vertical space | Reduce stacked brand copy and mobile chrome height |
| Hero readability | Mixed | Strong headline, but too many small micro-lines below it | Collapse support lines and increase supporting text size |
| Primary CTA visibility | Good | Visible early | Keep |
| Section length | Weak | Too many sequential text-heavy sections before relief | Remove one trust block and move proof up |
| Card stacking | Mixed | Buyer pathways and trust cards stack into long scrolls | Compress and reduce card count |
| Tap targets | Good | CTA heights mostly acceptable | Keep |
| Footer usability | Mixed | Premium, but overloaded with routes and small metadata text | Simplify gateway count on mobile |
| Animation performance | Acceptable | Demo reveal is limited | Keep |
| Horizontal overflow | Acceptable | Layout uses `overflow-x-clip` and sensible grids | Keep |
| Refusal demo | Good | Still lands on mobile | Keep |
| Trust block | Weak | Too long and claim-dense | Reduce to 4 strongest trust signals |
| Product ladder | Weak | Menu-like and overwhelming on mobile | Collapse to start, escalate, verify |

## Part 10: Performance / Technical Architecture

See `docs/product/homepage-technical-architecture-audit.md`.

Top issues:

- Homepage is split conceptually across `CategoryFrontDoor` and a large `pages/index.tsx`, but `pages/index.tsx` still contains many dead homepage section definitions.
- `CategoryFrontDoor` is a client component for the whole front-door experience even though most of it is static.
- Proof blocks fetch after paint, so trust surfaces can appear incomplete or empty on first load.
- Fonts are loaded from Google Fonts in `_document.tsx` and also imported in `styles/fonts.css`, creating avoidable duplication risk.

## Part 11: Copy Density Audit

| Section | Word Burden | Verdict | Note |
| --- | --- | --- | --- |
| Hero | Medium | `CUT_30_PERCENT` | Keep idea, reduce support lines |
| Refusal demo | Medium | `COPY_EARNS_SPACE` | Best explanatory prose on page |
| Category differentiation | Medium | `CUT_30_PERCENT` | Convert from negation to superiority |
| Product ladder | High | `CUT_50_PERCENT` | Too much too early |
| Governance proof grid | High | `CUT_30_PERCENT` | Fewer, harder claims |
| Buyer pathways | Medium | `MERGE_WITH_ADJACENT_SECTION` | Collapse into earned entry logic |
| Trust section | High | `CUT_30_PERCENT` | Keep only strongest trust disclosures |
| Observed in practice | Low | `REPLACE_WITH_PRODUCT_PROOF` | Needs stronger evidence format |
| Executive Reporting / Strategy Room | Medium | `COPY_EARNS_SPACE` | Useful, but should follow proof |
| Who this is for | Medium | `COPY_EARNS_SPACE` | Needs earlier placement |
| Engagement lanes | Low | `MERGE_WITH_ADJACENT_SECTION` | Generic routing strip |
| End trust strip | Low | `REMOVE` | Duplicate |

## Part 12: Homepage Claim Register

See `docs/product/homepage-trust-evidence-method-audit.md` for the detailed register.

Highest-risk homepage claims:

- `earned progression`
- `verified executive memory`
- `board-grade`
- `nothing resets`

These are not false in principle, but the homepage does not yet earn them with visible proof.

## Part 13: Homepage Rebuild Recommendation

See `docs/product/homepage-rebuild-recommendation.md`.

Short version:

1. Hero: category + refusal
2. Refusal demo: visible governed review
3. What comes back: concrete output artifact
4. How memory carries forward: continuity proof
5. Start with evidence: Fast Diagnostic path
6. Flagship outputs: Executive Reporting and Strategy Room
7. Trust architecture: standards, suppression, challenge
8. Use cases and qualification
9. Final CTA

## Part 14: Prioritised Fix Register

See `docs/product/homepage-fix-register.md`.

## Bottom Line

The homepage has a real category insight and a real differentiator: refusal. That is enough to build around. The current page fails because it does not discipline itself around that advantage. It expands into ladder, audience segmentation, trust doctrine, and final CTA too early, then places some of its best proof after the first close. The result feels serious, but not yet governed by its own logic.

## Implementation Update

Status after rebuild pass on 2026-05-09:

- `pages/index.tsx` was reduced to a thin route wrapper around `CategoryFrontDoor`.
- `CategoryFrontDoor` now orchestrates eight focused sections instead of containing the whole homepage message stack itself.
- Direct homepage routes into `Executive Reporting`, `Strategy Room`, `Enterprise Assessment`, `Counsel`, and `Boardroom` were removed from the live homepage body.
- The homepage now behaves as an evidence-entry surface with one dominant CTA: `Test a Decision`.
