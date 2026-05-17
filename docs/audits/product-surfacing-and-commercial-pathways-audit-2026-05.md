# Product Surfacing & Commercial Pathways Audit — May 2026

**Date:** 17 May 2026
**Scope:** commercial/product surfacing only. This audit does **not** re-audit the Library as a content estate.
**Primary sources inspected:** `lib/commercial/catalog.ts`, `lib/product/feature-entitlements.ts`, `lib/product/action-entitlement.ts`, `lib/commercial/recommendation-engine.ts`, `lib/admin/product-surface-registry.ts`, `pages/pricing.tsx`, `pages/api/billing/checkout.ts`, the public/product routes named in the brief, homepage modules, navigation/footer, Decision Centre case surfaces, Trust/Provenance surfaces, and developer/design-partner pages.

---

## Executive verdict

Abraham of London now has a real product ladder, not merely a set of pages:

1. **Free evidence entry**
2. **Governed diagnostic interpretation**
3. **Paid governed instruments**
4. **Executive Reporting**
5. **Strategy Room**
6. **Professional continuity**
7. **Retained / enterprise governance**
8. **Proof, provenance, and API trust surfaces**

The estate is materially stronger than a typical early-stage product site. The weak point is no longer product absence. It is **commercial coherence**:

- several products are built but undersignalled;
- a few products are visible in ways that imply a purchase path that is not actually live;
- some catalogue truth, entitlement truth, and UI truth have drifted apart;
- proof assets are strong, but not always used as conversion assets;
- the ladder is clear in fragments, but not yet governed by one public-facing architecture.

The product is closest to being commercially whole where it behaves like a governed system: Fast Diagnostic → evidence accumulation → Executive Reporting → Strategy Room → Decision Centre / retained continuity. It is weakest where it behaves like a shop: mixed CTA semantics, inactive products still being sold, and governed playbooks shown as if self-serve when checkout is not available.

### Headline finding

The estate is **not underbuilt**. It is **under-reconciled**.

The next work should not be broad redesign. It should be a focused reconciliation pass:

1. make every visible product commercially truthful;
2. make every high-value product discoverable at the right moment;
3. make every CTA describe the action it actually performs;
4. make the public ladder legible from homepage, pricing, result pages, and Decision Centre.

---

## Product surfacing architecture recommended

The clearest enduring taxonomy is:

| Family | Role in ladder | Should live primarily on |
| --- | --- | --- |
| A. Free Entry | begin with evidence | homepage, diagnostics hub, pricing |
| B. Professional Continuity | keep governed cases active over time | pricing, Decision Centre, upgrade prompts |
| C. Governed Instruments | paid problem-specific next steps | `/decision-instruments`, earned result modules, pricing |
| D. Executive Reporting | first paid governed intelligence layer | diagnostics, homepage, pricing, post-result pathways |
| E. Strategy Room | evidence-gated intervention | homepage, diagnostics, Decision Centre, pricing |
| F. Proof / Provenance / Trust | conversion proof and boundary-setting | homepage, trust/provenance routes, result pages, pricing support |
| G. Intelligence Reports | market / board intelligence | intelligence estate, not mixed into the core ladder unless current and active |
| H. Enterprise & Retained Oversight | contracted continuity and governance | pricing, retained-oversight route, enterprise CTA path |
| I. Developer / API | technical integration layer | enterprise/dev surfaces, not generic self-serve upgrade language |
| J. Library / Intellectual Estate | reading room and canon | Library, frameworks, playbooks, content cross-links |

This architecture is already latent in the codebase. The work is to make it explicit and consistent.

---

## Commercial truth matrix

### Legend

- **Checkout:** `live`, `manual`, `contracted`, `none`, `inactive`
- **Framing:** `correct`, `undersold`, `oversold`, `incoherent`
- **Appearances:** `H` homepage, `P` pricing, `L` library/content estate, `DC` Decision Centre, `U` upgrade prompts, `C` checkout path

### A. Catalogue products

| Product / surface | Category | Active / commercial status | Route / price | Checkout | Entitlement | Public appearances | After-result / DC presence | Framing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fast_diagnostic` | free entry | active / free-controlled | `/diagnostics/fast` / free | none | free | H, P, diagnostics hub | strong save-to-case path | correct |
| `personal_decision_audit` | diagnostic | active / paid | paid audit route / £49 | live | product entitlement | P | appears through earned recommendation logic | correct but low-signal |
| `decision_exposure_instrument` | governed instrument | active / paid | `/decision-instruments/decision-exposure-instrument` / £29 | live | product entitlement | H via named card, P, instruments hub | earned recommendation | correctly framed, modestly undersold |
| `mandate_clarity_framework` | governed instrument | active / paid | instrument route / £49 | live | product entitlement | P, instruments hub | earned recommendation | correct |
| `intervention_path_selector` | governed instrument | active / paid | instrument route / £79 | live | product entitlement | P, instruments hub | earned recommendation | correct |
| `escalation_readiness_scorecard` | governed instrument | active / paid | instrument route / £19 | live | product entitlement | P, instruments hub | run-level next step | correct |
| `structural_failure_diagnostic_canvas` | governed instrument | active / paid | instrument route / £19 | live | product entitlement | P, instruments hub | run-level next step | correct |
| `execution_risk_index` | governed instrument | active / paid | instrument route / £49 | live | product entitlement | P, instruments hub | run-level next step | correct |
| `team_alignment_gap_map` | governed instrument | active / paid | instrument route / £29 | live | product entitlement | P, instruments hub | run-level next step | correct |
| `governance_drift_detector` | governed instrument | active / paid | instrument route / £49 | live | product entitlement | P, instruments hub | next step can point to oversight | correct |
| `strategic_priority_stack_builder` | governed instrument | active / paid | instrument route / £79 | live | product entitlement | P, instruments hub | run-level next step | correct |
| `board_brief_builder` | governed instrument | active / paid | instrument route / £129 | live | product entitlement | P, instruments hub | run-level next step | correct |
| `operator_decision_pack` | governed instrument bundle | active / paid | instrument route / £129 | live | product entitlement | P, instruments hub | recommendation engine can promote bundle | correct |
| `execution_integrity_protocol` | governed playbook | active / paid | playbook run route / £49 | **not live** (`requiresCheckout:false`) | playbook entitlement | P, playbooks estate | next admissible move described | **visible but not checkout-ready** |
| `alignment_audit_playbook` | governed playbook | active / paid | playbook run route / £49 | **not live** | playbook entitlement | P, playbooks estate | next admissible move described | **visible but not checkout-ready** |
| `drift_detection_framework` | governed playbook | active / paid | playbook run route / £39 | **not live** | playbook entitlement | P, playbooks estate | next admissible move described | **visible but not checkout-ready** |
| `gmi_q1_2026` | intelligence report | **inactive / inactive** | public intelligence routes / display price still used | inactive | inactive entitlement | public intelligence routes | not part of current ladder | **visible but inactive** |
| `executive_reporting` | reporting | active / paid | `/diagnostics/executive-reporting` / £295 | live | assessment entitlement | H, P, diagnostics hub | strong earned path | correct |
| `strategy_room` | intervention | active / paid | `/strategy-room` / £750 | live | product entitlement | H, P, footer | strong after-report path | correct |
| `strategy_room_extended` | intervention | active / paid | `/strategy-room` / £1,250 | live | product entitlement | P | accessible after core room | correct but quiet |
| `professional` | membership | active / paid | `/pricing` → currently `/decision-centre` CTA / £59 monthly | live in catalogue | `tier.professional` | P, upgrade prompts | DC denial moments | **undersold on homepage; CTA semantics need repair** |
| `professional_annual` | membership | active / manual billing | pricing only / £590 yearly | manual | `tier.professional` | P | none | **CTA implies action that does not exist** |
| `additional_collaborator` | membership add-on | active / manual billing | pricing note / £15 monthly | manual | `seat.additional` | P only | organisation workspace | honest copy, not action-ready |
| `enterprise` | membership | active / contracted | pricing only / custom | contracted | `tier.enterprise` | P | enterprise/dev pages | **CTA points to wrong destination** |
| `retainer_core` | retainer | inactive / contracted | retained oversight path / enquire | contracted | retainer entitlement | P, H, retained oversight | oversight command | correct as contracted |
| `retainer_operational` | retainer | inactive / contracted | retained oversight path / enquire | contracted | retainer entitlement | P | oversight command | correct as contracted |
| `retainer_institutional` | retainer | inactive / contracted | retained oversight path / enquire | contracted | retainer entitlement | P | oversight command | correct as contracted |

### B. Governed and proof surfaces

| Surface | Category | Route | Appears publicly | Appears after completion / in product | CTA health | Next-step pathway | Framing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Decision Centre | system of record | `/decision-centre` | H, footer, many result flows | central post-save destination | good | diagnostics → DC → case detail | correct, but should be named more clearly as continuity layer |
| Return Brief explainer | continuity explainer | `/return-brief` | H progression, Strategy Room continuation | case detail generation path | good | create case / open DC / provenance sample | explainer correct; entitlement truth drift exists elsewhere |
| Case sharing | Professional action | case detail + `/case/shared/[token]` | not materially public before use | visible in case detail | good once user reaches it | share from owned case | feature true, but low pre-purchase signalling |
| Proof Pack | proof output | `/account/proof-pack` | footer, oversight | gated account route | good | Fast Diagnostic / DC / evidence standards | strong product, weak pre-signup discoverability |
| Provenance demo | proof | `/provenance/demo` | trust routes, H proof family | public | good | create governed case | correct |
| Provenance explained | proof education | `/provenance/explained` | trust routes | public | good | demo / sample / Fast Diagnostic | correct |
| Provenance sample export | proof conversion | `/provenance/sample-export` | H, multiple public CTAs | public | strong | create governed case / anchor log | excellent |
| Public Anchor Log | proof | `/provenance/anchor-log` | trust/provenance routes | public | good | sample / Fast Diagnostic | correct |
| Trust Center | trust | `/trust` | public | public | weakly commercial | provenance/security cross-links | trustworthy, but underused as conversion support |
| Design Partners | programme | `/design-partners` | discoverable mainly by direct route / related surfaces | public | good | contact / developers / pricing | correct but not prominent |
| Developers / API | enterprise technical | `/developers` | weak discoverability | public | good and honest | contact / design partners / pricing | route framing correct; inconsistent with upgrade prompt language |

---

## Pricing-page completeness matrix

| Question | Verdict | Evidence / issue |
| --- | --- | --- |
| Are all active paid products shown or deliberately hidden? | **Mostly** | Core paid estate is shown. Governed playbooks are shown despite no live checkout. `gmi_q1_2026` is hidden from pricing, appropriately if inactive, but still monetised elsewhere. |
| Are Professional Monthly / Annual shown correctly? | **Partially** | Monthly, annual, and collaborator seat appear. Monthly is real. Annual is manual billing but styled like an immediate action. |
| Is Additional Collaborator honest? | **Yes** | Pricing copy says contact us to add seats and catalogue marks it `manual_billing`. |
| Are Executive Reporting options simplified correctly? | **Yes** | ER is presented as the first paid governed intelligence layer, with route and price intact. |
| Are Strategy Room options correctly exposed? | **Yes** | Core and extended products are visible; core path is clearer than extended. |
| Are governed instruments grouped properly? | **Yes** | Strong grouping on pricing and `/decision-instruments`. |
| Are playbooks/frameworks grouped properly? | **Partially** | Public playbooks and paid governed playbooks are conceptually close enough to confuse buyers. Pricing copy should distinguish “public playbooks” from “governed playbook runs.” |
| Is GMI current enough to show? | **No** | Catalogue marks it inactive, so it should not still carry live unlock language on public intelligence pages without an explicit archival posture. |
| Are retainers presented as contracted rather than checkout products? | **Yes** | Pricing and retained-oversight copy are appropriately contract-led. |
| Does pricing tell a ladder story rather than become a shop? | **Mostly** | The section architecture is good. It weakens where non-live playbooks and actionless annual/enterprise CTAs enter the same visual grammar as live checkout products. |

### Pricing-specific gaps

1. **Professional Annual and Enterprise CTA semantics are wrong.**
   In `pages/pricing.tsx`, both use `successPath`, which resolves to `/decision-centre` from `lib/commercial/catalog.ts`. A buyer clicking **Go Annual** or **Contact for Enterprise pricing** should not be silently dropped into a product surface.

2. **Governed playbooks are priced as visible products but are not commercially executable.**
   In `catalog.ts`, all three have `commercialStatus:"paid"` and prices, but `requiresCheckout:false`; in `pricing.tsx` they are rendered with the same `ProductCard` family as live products.

3. **Inactive GMI still behaves like a live paid report outside pricing.**
   `gmi_q1_2026` is `active:false` / `commercialStatus:"inactive"` in the catalogue, but `pages/intelligence/global-market-intelligence-q1-2026.tsx` still renders live unlock copy using `getProductDisplayPrice("gmi_q1_2026")`.

---

## Homepage surfacing findings

### What is already strong

- The homepage correctly communicates an **earned ladder**, not a generic SaaS funnel.
- `ExecutiveReportingSection`, `StrategyRoomSection`, `RetainedOversightSection`, `EarnedProgressionBlock`, and `ProvenanceThesisSection` make the upper ladder legible.
- Proof appears before signup through provenance sample CTAs.
- First-time users can begin cleanly through Fast Diagnostic.

### What is under-signalled

1. **Professional is not visible enough as the continuity layer.**
   It is commercially important but mostly appears only when the user hits a gate or visits pricing.

2. **Governed instruments are active and checkout-ready but homepage-light.**
   The homepage names the Decision Delay Exposure Instrument, yet the broader governed-instrument family is much more visible on `/decision-instruments` and `/pricing` than on `/`.

3. **Decision Centre is visible, but not yet unmistakably framed as the system of record.**
   The homepage does describe progression into it, but the commercial doctrine would benefit from a clearer line: free surfaces create evidence; Decision Centre keeps the governed record alive; Professional preserves continuity.

4. **Proof Pack is commercially valuable but absent from top-of-funnel storytelling.**
   It appears in footer / retained surfaces, not as a serious buyer-facing proof output before login.

---

## Assessment and result-pathway findings

### Strong patterns

- `/diagnostics` behaves like a ladder, not a menu.
- Fast Diagnostic result flow is the best exemplar:
  - it invites case save;
  - it routes into Decision Centre;
  - it surfaces the next earned product;
  - it explains Strategy Room gates rather than merely selling around them.
- Executive Reporting appropriately states that it is not a starting point and requires evidence.
- Team and enterprise surfaces generally preserve the “earn the next step” posture.

### Gaps

1. **CTA density sometimes becomes too flat.**
   Several result surfaces show multiple viable actions at equal visual weight. The user can continue, buy, inspect, save, or read without a single dominant “what now.”

2. **“Where the decision lives now” is not always stated with the same force.**
   Fast Diagnostic is strongest here. Other result surfaces should converge on the same doctrine: once saved, the case lives in Decision Centre.

3. **One obvious asset hole remains:**
   `components/diagnostics/ExecutiveReportSampleDownload.tsx` still contains `href="#"` with a TODO for the sample PDF. That is not conversion-breaking, but it weakens a paid-report pathway.

---

## Decision Centre surfacing findings

### What works

- Case detail pages already surface:
  - next required action;
  - Return Brief generation;
  - provenance verification;
  - chain of custody;
  - case sharing;
  - selective escalation / counsel language.
- Professional-gated actions use contextual prompts instead of raw errors.
- The centre is correctly described in product copy as **not a report viewer** but the live state of governed decisions.

### Gaps

1. **Proof Pack is not prominent enough as a next governed output.**
   It exists and works, but Decision Centre does not make it feel like a natural proof artifact unlocked by case maturity.

2. **Evidence export and sharing are clearer reactively than proactively.**
   The user understands them at the moment of click. They are not yet visible enough as part of the Professional continuity proposition before denial.

3. **The centre surfaces interventions, but not yet a concise “commercial pathway by case state” model.**
   The ingredients are present; the orchestration is still local and case-by-case.

4. **Entitlement coherence drift:**
   `feature-entitlements.ts` still marks `return_brief` and `benchmark_context` as free while `action-entitlement.ts` and the UI gate Return Brief generation and advanced benchmark access behind Professional.

---

## Library / product overlap findings

This audit deliberately does not duplicate the Library architecture review. The commercially relevant conclusion is:

- **Library should remain the intellectual estate.**
- **Pricing / product surfaces should remain the commercial estate.**
- **The bridge between them should be explicit, not accidental.**

### Should appear in Library

- public playbooks;
- frameworks;
- evidence standards;
- canon / essays / briefs that explain product doctrine;
- related reading from a product page.

### Should remain primarily commercial

- governed instrument runs;
- paid governed playbook runs;
- Executive Reporting;
- Strategy Room;
- Professional;
- retained oversight;
- Proof Pack as a governed output, not merely a “resource.”

### Current overlap problem

“Playbooks” currently means two different things:

1. public intellectual materials in the Library estate;
2. paid governed methodology runs in pricing/catalogue.

That overlap is manageable, but only if the copy deliberately distinguishes them. Otherwise paid products risk being mistaken for content resources, and public resources risk being mistaken for checkout inventory.

---

## Trust / provenance conversion findings

### Strong

- `provenance/demo`, `provenance/explained`, `provenance/sample-export`, and `provenance/anchor-log` are unusually disciplined public proof surfaces.
- Sample/live boundaries are explicit.
- The provenance sample is conversion-capable: it routes visitors toward creating a governed case without pretending the sample is theirs.

### Underused

1. **Trust Center is mostly a destination, not a bridge.**
   It cross-links to provenance/security surfaces, but less clearly to the commercial ladder.

2. **Proof Pack is commercially meaningful but hidden too late.**
   It should support pre-signup seriousness for board, sponsor, reviewer, and auditor buyers.

3. **Proof family should be visible as a coherent cluster.**
   Right now the individual assets are strong; the product story between them is less explicit.

---

## Enterprise / developer surfacing findings

### What is correct

- `/developers` is honest: enterprise API access is not self-serve, and keys are issued by agreement.
- `/design-partners` is honest about early access and calibration, not scarcity theatre.
- Retained oversight copy is admirably careful about what is and is not claimed.

### Gaps

1. **Developer/API discoverability is weak.**
   It exists, but top-level navigation does not surface it, and it is not a clear branch in the public ladder for technical buyers.

2. **API framing is inconsistent across surfaces.**
   `/developers` says enterprise-by-agreement. `ContextualUpgradePrompt` calls API access “Professional / Enterprise API pilot access.” Those are not the same commercial promise.

3. **Enterprise CTA path is commercially wrong.**
   Pricing presents Enterprise as custom / contracted but routes the CTA to `/decision-centre`, not a sales or enterprise path.

---

## Products by inconsistency class

| Class | Products / surfaces |
| --- | --- |
| Active but hidden or undersurfaced | Professional on homepage; Proof Pack before signup; broad governed-instrument family on homepage; Developers/API |
| Visible but inactive | `gmi_q1_2026` |
| Visible but not checkout-ready | governed playbooks; `professional_annual`; `additional_collaborator` |
| Checkout-ready but not visible enough | several governed instruments beyond the flagship example |
| Gated but not explained consistently | Return Brief / benchmark access due entitlement-map drift |
| Priced but commercially incoherent | governed playbooks; inactive GMI monetisation |
| Duplicated / semantically overlapping | public playbooks vs governed playbook runs |
| Stale or archived but still public | `gmi_q1_2026` |
| Productised in catalogue but not fully surfaced | annual plan, collaborator seat, some developer/API posture |

---

## Severity-ranked gap list

### P0 — revenue-blocking or trust-breaking

1. **Pricing CTAs for Professional Annual and Enterprise do not perform the commercial action they promise.**
   `pages/pricing.tsx`, `lib/commercial/catalog.ts`

2. **Catalogue / entitlement / UI truth are inconsistent for Professional-gated features.**
   Return Brief and benchmark context are free in `feature-entitlements.ts` but Professional-gated in `action-entitlement.ts` and the UI.

3. **Inactive GMI is still publicly monetised.**
   `catalog.ts` says inactive; public intelligence pages still render unlock pricing.

### P1 — major ladder or conversion gaps

1. **Governed playbooks are visibly priced but not commercially executable.**
2. **Professional continuity is undersold before the user reaches a gate.**
3. **Enterprise/API language is inconsistent between upgrade prompts and `/developers`.**
4. **Proof Pack is an important commercial proof output but not sufficiently surfaced before signup.**

### P2 — discoverability / clarity improvements

1. Broader governed-instrument family is underrepresented on homepage.
2. Decision Centre should surface Proof Pack / export / sharing as cleaner case-state pathways.
3. Trust Center should route more deliberately into case creation / Professional / enterprise journeys.
4. Product surface registry is operationally useful but not a complete commercial registry.
5. Executive Report sample download still points to `#`.

### P3 — polish

1. Tighten terminology between public playbooks and governed playbook runs.
2. Add stronger related-reading loops from products back into canon/framework/library content.
3. Harmonise CTA labels where many surfaces currently say the right thing in different words.

---

## Recommended route-level CTA standards

| Stage | Primary CTA | Secondary CTA | Proof / trust CTA | Upgrade CTA | Fallback CTA |
| --- | --- | --- | --- | --- | --- |
| Homepage | Test a decision | Explore instruments | View provenance sample | View pricing | Library |
| Diagnostic hub | Start Fast Diagnostic | Review ladder | Evidence standards | Executive Reporting gate only when contextualised | Library / frameworks |
| Free result | Save this case | Continue in Decision Centre | View board summary / provenance sample | Relevant earned product only | Return to diagnostics |
| Instrument landing | Use instrument | View free signal | Evidence standards | Purchase / access if live | Back to instrument family |
| Executive Reporting gate | Generate report | Return to diagnostic ladder | Sample / standards | Checkout only if evidence threshold met | Create more evidence |
| Strategy Room | Begin intervention | Return to Decision Centre | View provenance sample | Purchase if admitted | Understand Return Brief |
| Decision Centre case | Complete next required action | Verify integrity / view record | Proof Pack / provenance | Contextual Professional CTA | Continue free |
| Pricing | Start correct product action | Compare ladder | Trust / provenance sample | Trial / checkout / contact based on real status | Return to Fast Diagnostic |
| Trust / provenance | Create a governed case | Understand proof boundary | Current page | Professional where continuity matters | Back to homepage |
| Enterprise / developers | Contact / request review | Design partner programme | Trust Center | none unless operationally true | Pricing |

---

## Recommended implementation batches

### Batch 1 — Reconcile commercial truth

**Goal:** every visible product says what it actually is and routes to the action it actually supports.

- Fix Annual / Enterprise CTA destinations and semantics.
- Reconcile `feature-entitlements.ts` with actual Professional gating.
- Decide whether governed playbooks become self-serve checkout products or are relabelled as unavailable / manually facilitated until live.
- Remove or explicitly archive stale GMI monetisation if the product remains inactive.

**Likely files:**
`pages/pricing.tsx`
`lib/commercial/catalog.ts`
`lib/product/feature-entitlements.ts`
`components/product/ContextualUpgradePrompt.tsx`
`pages/intelligence/global-market-intelligence-q1-2026.tsx`

### Batch 2 — Make the public ladder legible

**Goal:** show the right products earlier without turning the homepage into a catalogue.

- Add Professional as the continuity layer on homepage.
- Surface the governed-instrument family more explicitly.
- Clarify Decision Centre as system of record.
- Add Proof Pack to pre-signup proof storytelling.

**Likely files:**
`components/homepage/*`
`components/EnhancedFooter.tsx`
`pages/pricing.tsx`
`pages/account/proof-pack.tsx`

### Batch 3 — Standardise result and case pathways

**Goal:** every evidence-producing route points to one earned next action.

- Apply CTA hierarchy to diagnostic result surfaces.
- Add stronger “where this decision lives now” language outside Fast Diagnostic.
- Surface Proof Pack / export / sharing more coherently by case state inside Decision Centre.

**Likely files:**
`pages/diagnostics/*`
`components/diagnostics/*`
`pages/decision-centre.tsx`
`pages/decision-centre/case/[caseId].tsx`

### Batch 4 — Clarify enterprise and technical buyer paths

**Goal:** serious buyers and technical evaluators should not have to infer the route.

- Reconcile API wording across upgrade prompts and developer page.
- Improve discoverability of `/developers` and `/design-partners`.
- Route enterprise CTA to the real contracted pathway.

**Likely files:**
`pages/developers.tsx`
`pages/design-partners.tsx`
`components/product/ContextualUpgradePrompt.tsx`
`pages/pricing.tsx`
navigation/footer components as needed

### Batch 5 — Small conversion polish

- Replace the dead Executive Report sample CTA once the asset exists.
- Clarify public playbooks vs governed playbook runs in copy.
- Add selective product ↔ library cross-links where they create genuine comprehension.

---

## Exact files most likely to need changes later

### Commercial truth

- `lib/commercial/catalog.ts`
- `lib/product/feature-entitlements.ts`
- `lib/product/action-entitlement.ts`
- `pages/pricing.tsx`
- `components/product/ContextualUpgradePrompt.tsx`
- `pages/intelligence/global-market-intelligence-q1-2026.tsx`

### Homepage and public ladder

- `components/homepage/WhatYouCanUseTodaySection.tsx`
- `components/homepage/EarnedProgressionBlock.tsx`
- `components/homepage/ExecutiveReportingSection.tsx`
- `components/homepage/RetainedOversightSection.tsx`
- `components/homepage/ProvenanceThesisSection.tsx`
- `components/homepage/HomepageHero.tsx`
- `components/EnhancedFooter.tsx`

### Result and continuation pathways

- `pages/diagnostics/fast.tsx`
- `pages/diagnostics/index.tsx`
- `pages/diagnostics/executive-reporting.tsx`
- `pages/diagnostics/executive-reporting/run.tsx`
- `pages/diagnostics/team-assessment.tsx`
- `pages/diagnostics/enterprise-assessment.tsx`
- `pages/decision-centre.tsx`
- `pages/decision-centre/case/[caseId].tsx`
- `components/diagnostics/ExecutiveReportSampleDownload.tsx`

### Proof / enterprise / developer

- `pages/account/proof-pack.tsx`
- `pages/trust.tsx`
- `pages/provenance/*`
- `pages/developers.tsx`
- `pages/design-partners.tsx`

---

## Final assessment

The product estate is commercially promising because the ladder is real and the proof surfaces are unusually credible. The site does **not** need more random products. It needs firmer public doctrine:

- **Free creates trust.**
- **Professional preserves continuity.**
- **Governed instruments solve named decision conditions.**
- **Executive Reporting is the first paid intelligence layer.**
- **Strategy Room is earned intervention.**
- **Retained Oversight governs continuity at institutional scale.**
- **Proof surfaces make the system believable before purchase.**

Once the few truth-breaks are reconciled, Abraham of London will read less like an impressive collection of surfaces and more like one inevitable commercial system.
