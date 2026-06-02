# Product Directory UX and Revenue Flow Audit

Date: 2026-06-02

Scope: current public revenue pathway across `/`, `/products`, `/pricing`, footer links, and the decision pathway. This audit is source-based and did not modify product code.

Primary files reviewed:

- `pages/index.tsx`
- `components/homepage/CategoryFrontDoor.tsx`
- `components/homepage/HomepageHero.tsx`
- `components/homepage/FoundryEntrySection.tsx`
- `components/homepage/WhatYouCanUseTodaySection.tsx`
- `components/homepage/HomepageFinalCTA.tsx`
- `pages/products.tsx`
- `pages/pricing.tsx`
- `pages/decision-pathway.tsx`
- `pages/test-your-decision.tsx`
- `components/EnhancedFooter.tsx`
- `lib/commercial/catalog.ts`

## Executive Finding

The revenue flow has the right assets, but it is split across too many naming systems. A buyer can find the main path if they land on `/products`, but the homepage and pricing page route through different labels: `Test your decision`, `Fast Diagnostic`, `Decision Pressure Signal`, `Free Decision Signal`, `Decision Delay Exposure Instrument`, `Boardroom Brief`, `Executive Reporting`, and `Strategy Room`. This creates avoidable revenue leakage because the commercial ladder is not consistently presented as one path.

The strongest monetisation route is:

`/products` -> Free Decision Pressure Signal -> Boardroom Brief -> Executive Reporting -> Strategy Room -> Retainer Review Queue / Retained Oversight

The homepage does not yet make that route explicit enough above the fold. `/pricing` contains useful transaction detail, but it does not feature Boardroom Brief as the obvious first paid step and sends free entry toward Fast Diagnostic rather than the product-directory route.

## Page Audit

### Homepage `/`

| Field | Audit |
| --- | --- |
| firstScreenActionClear | Partial. The hero primary CTA is clear: `Test your decision`. Secondary CTAs point to `View the decision pathway` and `Run an organisational scan`. However, the first screen does not show the revenue ladder or first paid step. |
| paidOfferVisible | Weak above the fold. Paid products appear later through `Executive Reporting`, `Professional`, and final engagement links, but Boardroom Brief, Strategy Room pricing, and retained options are not first-screen commercial anchors. |
| freeEntryVisible | Clear. `Test your decision`, Foundry public tests, Fast Diagnostic, and no-signup language are visible across homepage sections. |
| proofProductVisible | Partial. `Executive Reporting`, Provenance Sample, and proof/trust sections are visible. Boardroom Brief, the clearest proof-of-value paid product, is not surfaced on the homepage. |
| nextStepObvious | Partial. The page asks users to test a decision, but the relationship between `/test-your-decision`, `/decision-pressure`, `/diagnostics/fast`, `/products`, and `/pricing` is not obvious. |
| pricingContextVisible | Weak. No first-screen pricing. Pricing is not a meaningful homepage CTA; `/products` appears in a CTA strip but not as the main commercial route. |
| trustBoundaryClear | Good. The homepage states the system may refuse escalation and that weak inputs create false confidence. |
| hiddenProducts | Boardroom Brief, Retainer Review Queue, Retained Oversight, Global Market Intelligence, Instrument Packs, Individual Instruments, Purpose Alignment, Consulting/Counsel are not prominent from the first screen. |
| duplicateProducts | `Test your decision`, `Test a Decision`, `Fast pressure reading`, `Fast Diagnostic`, and `Decision Pressure Signal` overlap as entry labels. |
| confusingLabels | `Foundry` routes and product-directory routes feel parallel rather than unified. `Run an organisational scan` points to Enterprise Scan while `/products` also says `Enterprise pathway` and `Enterprise Assessment`. |
| recommendedFixes | Add a compact first-screen or immediate second-screen ladder: Free Pressure Signal -> Boardroom Brief GBP 99 -> Executive Reporting GBP 295 -> Strategy Room GBP 750/GBP 1,250 -> Retained Oversight by review. Add Boardroom Brief to homepage available-now surfaces. Make `/products` the secondary commercial CTA beside `Test your decision`. |

### Product Directory `/products`

| Field | Audit |
| --- | --- |
| firstScreenActionClear | Strong. The hero gives `Start with a free pressure signal`, `Generate Boardroom Brief`, and `View pricing and access`. |
| paidOfferVisible | Strong. Boardroom Brief is presented as the first paid step, Executive Reporting shows `From GBP 295`, and Strategy Room appears in the paid corridor. |
| freeEntryVisible | Strong. Free Decision Pressure Signal has its own band with no-account language. |
| proofProductVisible | Strong for Boardroom Brief. Also references Executive Reporting, Boardroom Mode, and samples. |
| nextStepObvious | Strong for first actions, moderate for later corridor actions. Retainer Review Queue is visible but non-clickable; Retainer Oversight correctly has no public activation. |
| pricingContextVisible | Good. Prices/statuses are visible for Boardroom Brief, Executive Reporting, Strategy Room, and gated products. Some corridor stages use generic `Paid`, which is less useful than a price or enquiry rule. |
| trustBoundaryClear | Strong. The directory explicitly distinguishes available, planned, gated, and review-gated products and says progression is earned by evidence, not payment alone. |
| hiddenProducts | Global Market Intelligence is not visible. Instrument Packs are effectively hidden or planned/inactive. Consulting/Counsel is not in the page. |
| duplicateProducts | `Decision Pressure Signal` and `Decision Signal`; `Boardroom Brief`, `Board Brief Builder`, `Boardroom Mode`; `Enterprise Assessment`, `Enterprise pathway`, and `Enterprise Decision Scan`; `Retainer Oversight` vs footer `Retainer Readiness`. |
| confusingLabels | The route calls the free product `Free Decision Pressure Signal`, market activation calls it `Decision Pressure Signal`, footer calls it `Free Decision Signal`, pricing calls the free entry `Fast Diagnostic`. Purpose Alignment appears as `Purpose Alignment Diagnostic`, but catalog canonical name is `Personal Decision Audit`. |
| recommendedFixes | Keep `/products` as the canonical buyer router. Add Global Market Intelligence and Counsel/Consulting under secondary sections. Rename the free entry consistently. Add a short `What happens after this?` line under every paid CTA. Replace generic `Paid` labels with price ranges or `By enquiry`. |

### Pricing `/pricing`

| Field | Audit |
| --- | --- |
| firstScreenActionClear | Moderate. The page explains access tiers, but the first actionable link is not a purchase CTA; it is a trust/provenance/library set and a tier guide. |
| paidOfferVisible | Strong below the first screen. Professional, Enterprise, Executive Reporting, Strategy Room, individual instruments, playbooks, and retained oversight are listed. |
| freeEntryVisible | Clear, but it is `Fast Diagnostic`, not `Free Decision Pressure Signal`. |
| proofProductVisible | Weak for Boardroom Brief. Although `ONE_TIME_PRODUCTS` includes `CATALOG.boardroom_brief`, the page foregrounds Reporting & Execution and Decision Instruments; it does not present Boardroom Brief as the recommended first paid proof product. |
| nextStepObvious | Moderate. The tier guide helps, but buyer intent routes differ from `/products`. `Run the Fast Diagnostic` is offered as the uncertainty resolver, while `/products` pushes Pressure Signal/Boardroom Brief. |
| pricingContextVisible | Strong. Catalog-derived prices and active checkout actions are visible for the listed products. |
| trustBoundaryClear | Strong. It includes access-fee and regulated-advice disclaimers, no-outcome-guarantee language, and retained oversight by enquiry. |
| hiddenProducts | Free Decision Pressure Signal is not named. Boardroom Brief is not prominently featured. Global Market Intelligence appears absent from public pricing despite being active and not hidden in catalog. Retainer Review Queue is absent. Consulting/Counsel is absent. |
| duplicateProducts | `Fast Diagnostic` vs `Decision Pressure Signal`; `Professional` vs `Professionals` route; `Retainer` products vs `Oversight` nav; Boardroom Brief may be buried among instruments while Board Brief Builder is another instrument. |
| confusingLabels | `Tier 1B - Professional subscription` appears before first paid proof products, which can make the subscription feel like the next commercial step even when `/products` says Boardroom Brief is the recommended first paid step. |
| recommendedFixes | Add a top `Most buyers start here` strip: Free Pressure Signal, Boardroom Brief GBP 99, Executive Reporting GBP 295, Strategy Room GBP 750/GBP 1,250. Promote Boardroom Brief above subscriptions. Add Global Market Intelligence if it is meant to remain purchasable. Add Retainer Review Queue as a non-checkout readiness boundary. |

### Footer Links

| Field | Audit |
| --- | --- |
| firstScreenActionClear | Not applicable, but footer gives multiple commercial exits. |
| paidOfferVisible | Partial. Footer links to Product Directory, Decision Instruments, Executive Reporting, Strategy Room, Enterprise, Professionals, Engagements, Counsel Review, and Retainer Readiness. It does not link Pricing in the main product footer. |
| freeEntryVisible | Partial. Footer links `Free Decision Signal`, but this label differs from `/products` `Free Decision Pressure Signal` and routes to `/decision-instruments/signal`, not `/decision-pressure`. |
| proofProductVisible | Partial. Executive Reporting and Strategy Room are visible. Boardroom Brief is absent. |
| nextStepObvious | Weak. Footer has many routes but no ordered path. It is a directory, not a guided flow. |
| pricingContextVisible | Weak. No price context and no prominent `/pricing` link in product directory columns. |
| trustBoundaryClear | Good for legal/company verification and trust/evidence links. |
| hiddenProducts | Boardroom Brief, Global Market Intelligence report, Instrument Packs, Retainer Review Queue, and explicit Pricing are hidden from footer commercial discovery. |
| duplicateProducts | `Free Decision Signal` vs `Decision Pressure Signal`; `Retainer Readiness` vs `Retainer Review Queue` vs `Retained Oversight`; `Counsel Review` vs `/counsel` and engagement/counsel concepts. |
| confusingLabels | `Frameworks & Playbooks`, `Decision Instruments`, `Free Decision Signal`, and `Foundry decision test` create several entry points without hierarchy. |
| recommendedFixes | Add `Boardroom Brief`, `Pricing`, `Global Market Intelligence`, and `Retained Oversight` to appropriate footer columns. Standardise the free-entry route label and target. Add a small ordered commercial path in the Products column. |

### Decision Pathway `/decision-pathway`

| Field | Audit |
| --- | --- |
| firstScreenActionClear | Good as an explanatory pathway. It shows an ordered ladder and open/locked states. |
| paidOfferVisible | Good. Purpose Alignment GBP 49, Executive Reporting GBP 295, Strategy Room GBP 750/GBP 1,250, Boardroom Mode, and Retainer Oversight are visible. |
| freeEntryVisible | Strong. Decision Pressure Signal and Fast Diagnostic are open and free. |
| proofProductVisible | Partial. It does not include Boardroom Brief, despite Boardroom Brief being the product directory's recommended first paid proof step. |
| nextStepObvious | Strong conceptually, but potentially over-gated. Many products are shown as locked, while `/products` and `/pricing` expose some as available or open entry. |
| pricingContextVisible | Good for the canonical ladder, but not for Boardroom Brief, Professional, Instrument Packs, Individual Instruments, or Global Market Intelligence. |
| trustBoundaryClear | Strong. Locked products explain why they are locked. |
| hiddenProducts | Boardroom Brief, Global Market Intelligence, Instrument Packs, Individual Instruments, Operator Pilot, Consulting/Counsel are not part of the pathway. |
| duplicateProducts | `Decision Pressure Signal` plus `Fast Diagnostic`; `Enterprise Assessment` vs Enterprise Scan; `Boardroom Mode` without Boardroom Brief. |
| confusingLabels | The page says Purpose Alignment unlocks later products, while `/products` says Purpose Alignment is separate and not a prerequisite for Operational Decision Intelligence. |
| recommendedFixes | Insert Boardroom Brief between Pressure Signal and Executive Reporting as an open paid proof product. Clarify whether Purpose Alignment is optional/separate or part of the ladder. Link `/products` as the product directory and `/pricing` as payment access. |

## Required Product Findability

| Product / Offer | Can User Find It? | Where Found | Revenue-Flow Issue |
| --- | --- | --- | --- |
| Free Decision Pressure Signal | Yes, but inconsistent | `/products`, `/decision-pathway`, `/test-your-decision`; footer uses `Free Decision Signal` to another route | Naming and route mismatch between `/decision-pressure`, `/decision-instruments/signal`, and `/diagnostics/fast`. |
| Boardroom Brief | Yes on `/products`; weak elsewhere | `/products`, catalog, `/boardroom-brief` route | Missing from homepage, footer, decision pathway, and prominent pricing flow. |
| Enterprise Scan | Yes | Homepage CTA, `/products`, `/test-your-decision`, `/enterprise-decision-scan` | Labels vary between Enterprise Scan, organisational scan, Enterprise pathway, Enterprise Assessment. |
| Executive Reporting | Yes | Homepage available-now section, `/products`, `/pricing`, `/decision-pathway`, footer | Strong visibility, but route alternates between info, run, checkout/action states. |
| Strategy Room | Yes | `/products`, `/pricing`, `/decision-pathway`, footer | Visible and priced; trust boundary is clear, but CTAs can imply public entry despite earned-access language. |
| Retainer Review Queue | Partial | `/products` paid corridor only | Visible but no clear public route or explanation of how to request review. |
| Retained Oversight | Partial | `/pricing` retained tier, `/decision-pathway`, footer retained/readiness links, `/engagements/retained-oversight` route exists | Names vary: Retainer Oversight, Retained Oversight, Retainer Readiness, Oversight. |
| Global Market Intelligence | Weak | Footer gateway to `/intelligence/market`; catalog has active `Global Market Intelligence Report - Q1 2026` | Active paid report is not discoverable from `/products` or `/pricing` as a product. |
| Instrument Packs | Weak | Catalog inactive packs; `/products` mentions `Operator Decision Pack` as planned; pricing excludes inactive packs | Packs exist in catalog but are not purchasable or clearly explained. |
| Individual Instruments | Yes | `/pricing`, `/products` secondary collapsible section, `/decision-instruments` footer | Many are active in catalog, but `/products` marks several as planned, creating contradiction. |
| Purpose Alignment | Yes, but conflicted | `/products`, `/decision-pathway`, catalog legacy name, app route | Catalog canonical name is `Personal Decision Audit`; public pages still call it Purpose Alignment. Its role is separate on `/products` but laddered on `/decision-pathway`. |
| Operator Pilot | Partial | Homepage final CTA, footer `Governed Pilot Review`, `/engagements/operator-pilot` | Not visible on `/products` or `/pricing`; commercial role unclear. |
| Consulting/Counsel | Partial | Footer `Counsel Review`, `/counsel` route, internal APIs | Not represented in `/products`, `/pricing`, or decision pathway as a clear buyer option or boundary. |

## Revenue-Flow Blockers

1. The first paid product is not consistently promoted. `/products` correctly positions Boardroom Brief as the recommended first paid step, but homepage, footer, pricing, and decision pathway do not reinforce that path.
2. The free entry product has multiple names and routes. This dilutes attribution and makes it unclear whether the buyer should choose `Test your decision`, `Decision Pressure Signal`, `Decision Signal`, `Fast Diagnostic`, or a Foundry test.
3. `/pricing` is commercially complete but not buyer-path complete. It lists prices, but it does not mirror the recommended path in `/products`.
4. Purpose Alignment has a canonical naming conflict. Catalog uses `Personal Decision Audit` with `Purpose Alignment` as legacy names, while public surfaces still mostly use Purpose Alignment.
5. Active catalog products are not always visible where buyers expect them. Global Market Intelligence and several individual instruments are discoverability gaps; inactive packs are partly surfaced as planned without clear status.
6. Retained revenue is visible but not operationally clear. Retainer Review Queue, Retained Oversight, Retainer Oversight, Retainer Readiness, and Oversight are related but not unified for buyer comprehension.
7. Counsel/Consulting exists as a route and workflow but is not represented as a clear public product, boundary, or escalation path.

## Recommended Priority Fixes

1. Standardise the public ladder everywhere: Free Decision Pressure Signal -> Boardroom Brief -> Executive Reporting -> Strategy Room -> Retainer Review Queue -> Retained Oversight.
2. Make Boardroom Brief visible on the homepage, footer, pricing top strip, and decision pathway.
3. Pick one free-entry label and map all public CTAs to it, or explain the difference between Pressure Signal, Decision Signal, Fast Diagnostic, and Foundry tests.
4. Update `/pricing` to start with the same buyer path as `/products`, then list subscriptions and instrument catalogue below it.
5. Resolve Purpose Alignment naming: either restore it as the public product name or use `Personal Decision Audit` consistently with a clear subtitle.
6. Add a visible product status legend for `open`, `paid`, `evidence-gated`, `review-gated`, `contracted`, and `inactive/planned`.
7. Add hidden-but-real offers to `/products` secondary sections: Global Market Intelligence, Operator Pilot, Counsel Review, Retained Oversight.
