# Controlled Surface Audit

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London
**Audit type:** Surface-control audit — self-sabotage prevention pass

---

## Audit Standard

Every surface classified by:
- Route/path
- Audience (PUBLIC / AUTHENTICATED / PAID / OPERATOR / ADMIN / INTERNAL_ONLY / RETAINER_CLIENT / SPONSOR_SAFE / BOARD_SAFE)
- Commercial purpose
- Current tone
- Data exposed
- Engine/internal terms exposed
- Generic copy risk (HIGH / MEDIUM / LOW)
- IP leakage risk (HIGH / MEDIUM / LOW)
- Claim risk (HIGH / MEDIUM / LOW)
- UX weakness
- Mobile risk (HIGH / MEDIUM / LOW)
- Trust risk (HIGH / MEDIUM / LOW)
- Recommended action

---

## PUBLIC SURFACES

### 1. Homepage — `/` (pages/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Category establishment, lead generation, authority positioning |
| **Current tone** | Institutional — serif + monospace, dark gold, formal language |
| **Data exposed** | Platform features, product names, diagnostic pathway, executive profiles, content counts |
| **Engine terms exposed** | "Decision exposure", "mandate clarity", "intervention path", "escalation of consequence", "contradiction" — all acceptable product-level language. No internal engine names. |
| **Generic copy risk** | MEDIUM — Some marketing-adjacent phrasing ("threshold, not pitch deck") |
| **IP leakage risk** | LOW — Product names disclosed but not mechanics |
| **Claim risk** | MEDIUM — Claims system "identifies contradictions" and "prices consequence" without public methodology |
| **UX weakness** | Very long page (141k), heavy animation may impact load time |
| **Mobile risk** | MEDIUM — Grid-dependent layouts risk reflow issues |
| **Trust risk** | LOW — Strong credential pathway (/verification, /trust, /foundations) |
| **Recommended action** | Audit mobile breakpoints; lazy-load non-critical sections |

### 2. About — `/about` (pages/about.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Founder positioning, system authority legitimation |
| **Current tone** | Institutional — formal, bespoke |
| **Data exposed** | Founder: Abraham Adaramola, 15+ years. Company: Alomarada Ltd. Core thesis: Contradiction → Consequence → Enforcement → Verification |
| **Engine terms exposed** | "Contradiction", "Consequence", "Enforcement", "Verification" (the 4-pillar model) — acceptable |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM — "Outcomes are verified, not assumed" requires evidence standard clarity |
| **UX weakness** | None significant |
| **Mobile risk** | LOW |
| **Trust risk** | LOW |
| **Recommended action** | Strong page; minimal changes needed |

### 3. Method — `/method` (pages/method.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | System explanation, competitive differentiation |
| **Current tone** | Institutional, polemical |
| **Data exposed** | Escalation ladder (6 stages), three core mechanisms, five secondary mechanics, illustrative anonymised output |
| **Engine terms exposed** | "Proprietary contradiction engine", "Structural pattern engine", "Evidence graph" — **Evidence graph is a VIOLATION** (internal architecture term on public surface) |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | MEDIUM — "Multi-dimensional scoring" and "evidence graph" disclosed as components |
| **Claim risk** | MEDIUM-HIGH — "Scores your condition against a proprietary contradiction engine" with no public methodology |
| **UX weakness** | Long text-dense page; 6-row escalation table may confuse |
| **Mobile risk** | MEDIUM — Table layout may not reflow cleanly |
| **Trust risk** | MEDIUM — Relies on assertion rather than demonstration |
| **Recommended action** | Remove "evidence graph" label; replace with "decision evidence basis". Add anonymised proof walkthrough. |

### 4. Trust — `/trust` (pages/trust.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Expectation-setting, audience segmentation |
| **Current tone** | Institutional, explicit guardrails |
| **Data exposed** | For/not-for audience, will-do/won't-do commitments |
| **Engine terms exposed** | None |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | LOW |
| **UX weakness** | None |
| **Mobile risk** | LOW |
| **Trust risk** | LOW-NEGATIVE (trust raised by candour) |
| **Recommended action** | Excellent page; maintain as-is |

### 5. Verification — `/verification` (pages/verification.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Credentialing, risk mitigation |
| **Current tone** | Institutional, formal |
| **Data exposed** | Legal entity (Alomarada Ltd, UK 11549053), founder credentials (ISO 27001, CMI Level 7, MBA, BSc), LinkedIn |
| **Engine terms exposed** | None |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | LOW — Credentials are verifiable |
| **UX weakness** | None |
| **Mobile risk** | LOW |
| **Trust risk** | LOW-NEGATIVE (trust raised by verification) |
| **Recommended action** | Excellent page; maintain as-is |

### 6. Security — `/security` (pages/security.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Compliance signalling |
| **Current tone** | Institutional, precise |
| **Data exposed** | Six control areas, reCAPTCHA, Stripe (PCI-DSS), encryption practices |
| **Engine terms exposed** | None |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | LOW — Honest about gaps ("not every legacy surface migrated") |
| **UX weakness** | None |
| **Mobile risk** | LOW |
| **Trust risk** | LOW-NEGATIVE (candour increases trust) |
| **Recommended action** | Add incident response timeline |

### 7. Diagnostic (CSS) — `/diagnostic` (pages/diagnostic.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC (SHOULD BE INTERNAL_ONLY) |
| **Commercial purpose** | None — dev tool |
| **Current tone** | Technical/debug |
| **Data exposed** | CSS variable loading, Tailwind compilation check |
| **Engine terms exposed** | None |
| **Generic copy risk** | LOW |
| **IP leakage risk** | NONE |
| **Claim risk** | LOW |
| **UX weakness** | Emoji in title breaks institutional tone |
| **Mobile risk** | LOW |
| **Trust risk** | NEUTRAL |
| **Recommended action** | **Remove from public site or gate behind /admin/** |

### 8. Evidence — `/evidence` (pages/evidence/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Social proof, case study preview |
| **Current tone** | Institutional, proof-oriented |
| **Data exposed** | Proof standard, 3 anonymised case slugs, "14-60 day enforcement windows" |
| **Engine terms exposed** | None |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM — "Outcome-verified cases" but only slugs shown, no full dossier |
| **UX weakness** | No full case dossier accessible |
| **Mobile risk** | LOW |
| **Trust risk** | MEDIUM — Sets expectations but doesn't deliver evidence |
| **Recommended action** | **Publish at least 1 full anonymised case dossier** |

### 9. Diagnostics Hub — `/diagnostics` (pages/diagnostics/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Product staging funnel |
| **Current tone** | Institutional, capability map |
| **Data exposed** | Four-rung diagnostic pathway, routing labels (STRATEGY, DIAGNOSTIC, WATCH, REJECT), starting signals |
| **Engine terms exposed** | "Constitutional diagnostic", "evidence layer", "contradiction hierarchy" — hierarchy term borderline |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM — "Routes with constitutional confidence" undefined |
| **UX weakness** | All four steps visible at once; no progressive disclosure |
| **Mobile risk** | MEDIUM — 4-column grid |
| **Trust risk** | MEDIUM — REJECT outcome may raise scepticism |
| **Recommended action** | Add visual progress indicator; explain REJECT routing positively |

### 10. Decision Paths — `/decision-paths` (pages/decision-paths/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Product tier explanation, upsell funnel |
| **Current tone** | Institutional, pricing-forward |
| **Data exposed** | Three decision paths, pricing (Instruments £40-95), progression model |
| **Engine terms exposed** | "Evidence convergence", "contradiction hierarchy", "execution blocker", "escalation triggers" |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM — "Controlled execution environment" undefined |
| **UX weakness** | Pricing not transparent for Executive Reporting and Strategy Room |
| **Mobile risk** | MEDIUM |
| **Trust risk** | MEDIUM — Hidden pricing reduces transparency |
| **Recommended action** | Add pricing or "Custom pricing — contact" label |

### 11. Decision Instruments — `/decision-instruments` (pages/decision-instruments/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Product detail, purchase gateway |
| **Current tone** | Institutional, product-focused |
| **Data exposed** | Three instruments with descriptions and pricing, Operator Pack bundle |
| **Engine terms exposed** | Product names only — acceptable |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM — "Quantifies the cost of being wrong" without methodology |
| **UX weakness** | No "which one do I need?" guidance |
| **Mobile risk** | MEDIUM |
| **Trust risk** | MEDIUM — No sample output |
| **Recommended action** | Add sample output for each instrument |

### 12. Lexicon — `/lexicon` (pages/lexicon/)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Authority/SEO, content marketing |
| **Current tone** | Institutional, archival |
| **Data exposed** | Lexicon entries (title, slug, description) |
| **Engine terms exposed** | Depends on content — needs content review |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | LOW |
| **UX weakness** | No search function |
| **Mobile risk** | LOW |
| **Trust risk** | LOW |
| **Recommended action** | Add search bar |

### 13. Contact — `/contact` (pages/contact.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Lead capture |
| **Current tone** | Institutional |
| **Data exposed** | Form fields, enquiry types |
| **Engine terms exposed** | None |
| **Generic copy risk** | LOW |
| **IP leakage risk** | NONE |
| **Claim risk** | LOW |
| **UX weakness** | No SLA for response |
| **Mobile risk** | MEDIUM |
| **Trust risk** | LOW |
| **Recommended action** | Add response SLA ("We typically respond within 2 business days") |

### 14. Foundations — `/foundations` (pages/foundations.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Intellectual authority |
| **Current tone** | Institutional, scholarly |
| **Data exposed** | Seven intellectual traditions, proprietary system names |
| **Engine terms exposed** | "Structured synthesis", "Alignment Index" — acceptable product-level |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | LOW |
| **UX weakness** | None |
| **Mobile risk** | LOW |
| **Trust risk** | LOW-NEGATIVE (trust raised) |
| **Recommended action** | Excellent page; maintain as-is |

### 15. Why Not AI — `/why-not-ai` (pages/why-not-ai.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Competitive positioning |
| **Current tone** | Polemical, defensive |
| **Data exposed** | AI vs Decision Authority comparison matrix |
| **Engine terms exposed** | "Governed analysis", "authority classification", "institutional memory", "proprietary cost modelling" |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM-HIGH — Strawman comparison; claims "full traceability" without proof |
| **UX weakness** | None |
| **Mobile risk** | LOW |
| **Trust risk** | MEDIUM — Slightly dismissive of AI |
| **Recommended action** | Soften comparison; acknowledge complementarity |

### 16. Retainer (public landing) — `/retainer` (pages/retainer.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED (access-controlled) |
| **Commercial purpose** | Retained decision enforcement, case tracking |
| **Current tone** | Institutional, operational |
| **Data exposed** | Organisation name, tier, decision capacity, active decisions, enforcement cycles, stakeholders, playbooks |
| **Engine terms exposed** | "Decision Authority as a Service", "enforcement cycles", "decision velocity score", "acceleration risk score", "outcome delta" |
| **Generic copy risk** | MEDIUM-HIGH |
| **IP leakage risk** | CRITICAL — Exposes velocity scoring (0-100), acceleration risk, enforcement playbook trigger patterns, outcome delta, dependency chains |
| **Claim risk** | HIGH — "Applied enforcement playbooks" implies autonomous intervention |
| **UX weakness** | Cost of delay shown raw; no date range or basis |
| **Mobile risk** | HIGH — Tabular layout |
| **Trust risk** | CRITICAL — Enforcement transparency deficit |
| **Recommended action** | Disclose enforcement playbook conditions; define outcome delta; show cost basis |

### 17. Institutional — `/institutional` (pages/institutional/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Segment targeting (institutional buyers) |
| **Current tone** | Institutional monumentalism |
| **Data exposed** | Capability descriptions |
| **Engine terms exposed** | Product-level only — acceptable |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | LOW |
| **UX weakness** | None significant |
| **Mobile risk** | MEDIUM — Card grid |
| **Trust risk** | LOW |
| **Recommended action** | Test mobile card hover/touch states |

### 18. Leadership — `/leadership` (pages/leadership/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC (with inner-circle gated content) |
| **Commercial purpose** | Leadership development positioning |
| **Current tone** | Institutional, developmental |
| **Data exposed** | Leadership progression stages, tools, mixed access content |
| **Engine terms exposed** | Product names only — acceptable |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM |
| **UX weakness** | Mixed access levels not visually distinct |
| **Mobile risk** | MEDIUM |
| **Trust risk** | MEDIUM |
| **Recommended action** | Add visual "Members only" badges to gated items |

### 19. Education/Research — `/education-research` (pages/education-research/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Academic positioning |
| **Current tone** | Institutional, scholarly |
| **Data exposed** | Research modes, partnership types |
| **Engine terms exposed** | None |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | LOW |
| **UX weakness** | None |
| **Mobile risk** | LOW |
| **Trust risk** | LOW |
| **Recommended action** | Add example research project |

### 20. Pricing — `/pricing` (app/(dashboard)/pricing/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC |
| **Commercial purpose** | Product pricing, conversion |
| **Current tone** | Institutional |
| **Data exposed** | Product tiers and pricing |
| **Engine terms exposed** | Product names only |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM |
| **UX weakness** | Needs review for completeness |
| **Mobile risk** | MEDIUM |
| **Trust risk** | MEDIUM |
| **Recommended action** | Ensure all product prices are transparent |

---

## AUTHENTICATED / PRODUCT SURFACES

### 21. Decision Centre — `/decision-centre` (pages/decision-centre.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | Active case management, Living Case console |
| **Current tone** | Bespoke + institutional |
| **Data exposed** | Case IDs, decision texts, cognitive state labels, evidence tiers, cost-of-delay (£), boardroom eligibility, decision credit scores, pattern recurrence |
| **Engine terms exposed** | **VIOLATION:** "Cognitive state" labels (SIGNAL_DISCOVERY, STRUCTURAL_RECOGNITION, etc.) exposed directly. "Evidence tier" classification. "Pattern recurrence: verified" |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | MEDIUM-HIGH — Exposes internal intelligence lifecycle stage names |
| **Claim risk** | HIGH — Claims system "remembers" and "tracks" without methodology disclosure |
| **UX weakness** | No empty state guidance; cognitive state labels unexplained |
| **Mobile risk** | HIGH — Heavy grid layout |
| **Trust risk** | HIGH — Opaque decision credit scoring |
| **Recommended action** | Abstract cognitive state labels to user-friendly names; add explainer tooltips; mobile-responsive redesign |

### 22. Return Brief — `/briefing/return/[sessionId]` (app/briefing/return/[sessionId]/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | Post-intervention follow-up document |
| **Current tone** | Bespoke + documentary |
| **Data exposed** | Original decision, trajectory (DETERIORATING/FRAGILE/STABLE), outcome evidence (case count, % improved, failure rate), cost of inaction (£), commitment verification (14/30/60-day checkpoints), recurrence indicators, delta metrics |
| **Engine terms exposed** | **VIOLATION:** "Signal continuity" (component term). Verification checkpoint cadence exposed (14/30/60 days). Outcome confidence tiers |
| **Generic copy risk** | HIGH — Abstract language without grounding |
| **IP leakage risk** | HIGH — Checkpoint cadence, confidence tiers, retainer trigger logic exposed |
| **Claim risk** | CRITICAL — Outcome statistics without confidence intervals; "pattern is persistent" without evidence; "immediate structural correction required" without authority |
| **UX weakness** | Fixed 680px max-width breaks mobile; outcome evidence methodology opaque |
| **Mobile risk** | HIGH — Fixed-width layout |
| **Trust risk** | CRITICAL — Statistics without methodology; urgency language without justification |
| **Recommended action** | Add methodology disclosure; add automated-analysis disclaimer; mobile-responsive breakpoints; soften prescriptive language |

### 23. Strategy Room Session — `/strategy-room/session/[id]` (pages/strategy-room/session/[id].tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | Real-time execution surface for decision implementation |
| **Current tone** | Bespoke + high-stakes operational |
| **Data exposed** | Session state, directive (allow/block/restrict), escalation level, intervention stack, evidence graph, contradiction evidence, consequence score (0-100), avoidance pattern detection, decision log |
| **Engine terms exposed** | **VIOLATION:** "Evidence graph" (internal architecture), "consequence score" (numeric), "avoidance pattern" (detection logic), "micro-tension" (critical — internal engine term in ExecutionFlow) |
| **Generic copy risk** | HIGH — Consequence score without scale explanation |
| **IP leakage risk** | CRITICAL — Consequence scoring algorithm, avoidance detection, escalation triggers, intervention sequencing, evidence graph structure, state machine |
| **Claim risk** | CRITICAL — System directive as authoritative without disclosure; avoidance pattern detection without threshold; consequence trend as fact |
| **UX weakness** | No visual consequence scale; no explanation of exposure level; binary decision states |
| **Mobile risk** | HIGH — 3-column grid collapses poorly |
| **Trust risk** | CRITICAL — Algorithmic governance without transparency |
| **Recommended action** | Add automated-analysis disclaimer; disclose consequence methodology; define avoidance pattern threshold; visual consequence scale; mobile stacking |

### 24. Purpose Alignment — `/purpose-alignment` (app/purpose-alignment/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | Decision alignment assessment |
| **Current tone** | Bespoke |
| **Data exposed** | Delegates to PurposeAlignmentAssessment component |
| **Engine terms exposed** | **VIOLATION:** "Anchor narrative" exposed through diagnostic result DTOs |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | MEDIUM — Anchor narrative architecture exposed |
| **Claim risk** | MEDIUM |
| **UX weakness** | Needs component-level audit |
| **Mobile risk** | MEDIUM |
| **Trust risk** | MEDIUM |
| **Recommended action** | Abstract "anchor narrative" to "decision narrative" or "core finding" in client-facing output |

### 25. Constitutional Diagnostic — `/diagnostics/directional-integrity` (pages/diagnostics/directional-integrity.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | Routing engine — STRATEGY/DIAGNOSTIC/REJECT |
| **Current tone** | Bespoke |
| **Data exposed** | Route explanation, confidence score, authority scoring |
| **Engine terms exposed** | Product-level only — acceptable |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM |
| **UX weakness** | REJECT explanation could be more positive |
| **Mobile risk** | MEDIUM |
| **Trust risk** | LOW |
| **Recommended action** | Acceptable; minor copy improvements |

### 26. Team Assessment — `/diagnostics/team-alignment` (pages/diagnostics/team-alignment.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | Perception gap analysis, fragility detection |
| **Current tone** | Mostly bespoke |
| **Data exposed** | Domain scores, perception gaps, fragility index, escalation triggers |
| **Engine terms exposed** | Product-level — acceptable |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM |
| **UX weakness** | PARTIAL continuity |
| **Mobile risk** | MEDIUM |
| **Trust risk** | MEDIUM |
| **Recommended action** | Acceptable |

### 27. Enterprise Assessment — `/diagnostics/enterprise` (pages/diagnostics/enterprise.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | Institutional stress test |
| **Current tone** | Mostly bespoke |
| **Data exposed** | Domain scores, compound severity, risk formula, WATCH classification |
| **Engine terms exposed** | Product-level — acceptable |
| **Generic copy risk** | LOW |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM |
| **UX weakness** | PARTIAL continuity |
| **Mobile risk** | MEDIUM |
| **Trust risk** | MEDIUM |
| **Recommended action** | Acceptable |

### 28. Audit (Campaign Survey) — `/audit/[id]` (app/audit/[id]/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | PUBLIC (token-based, no auth) |
| **Commercial purpose** | Anonymous institutional alignment audit |
| **Current tone** | Institutional + opaque |
| **Data exposed** | Campaign ID, title, objective, participant ID |
| **Engine terms exposed** | "Sovereign Telemetry", "Anonymous_Protocol" — security theatre terminology |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | LOW |
| **Claim risk** | HIGH — "End-to-End Encryption Active" without technical verification; "Anonymous" while collecting campaign context |
| **UX weakness** | Campaign objective shown raw; no consent flow |
| **Mobile risk** | LOW |
| **Trust risk** | HIGH — Encryption claim unverified; anonymity claim questionable |
| **Recommended action** | Replace "Sovereign Telemetry" with plain language; disclose encryption specifics; add consent flow; add privacy statement |

### 29. Assessment — `/assessment/[token]` (app/assessment/[token]/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED (token-gated) |
| **Commercial purpose** | Institutional/team alignment assessment |
| **Current tone** | Bespoke + institutional |
| **Data exposed** | Campaign metadata, assessment statements, Likert responses |
| **Engine terms exposed** | Team domain labels: direction_priority, execution_integrity, trust_communication, authority_escalation |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | MEDIUM — 4 core assessment dimensions exposed |
| **Claim risk** | MEDIUM — No validation study cited |
| **UX weakness** | Numeric Likert (20/40/60/80/100) instead of semantic labels |
| **Mobile risk** | MEDIUM — 5-button Likert cramped |
| **Trust risk** | MEDIUM |
| **Recommended action** | Add semantic Likert labels; disclose aggregation method; add consent |

### 30. Oversight Brief — `/oversight/brief/[cycleId]` (pages/oversight/brief/[cycleId].tsx)

| Field | Finding |
|-------|---------|
| **Audience** | RETAINER_CLIENT / BOARD_SAFE |
| **Commercial purpose** | Monthly governance brief for retainer clients |
| **Current tone** | Bespoke + documentary |
| **Data exposed** | Cycle data, deltas, cadence, pattern recurrence, cost of inaction, irreversibility, strategic options, organisation divergence, boardroom memory, counsel status, structured actions, value protected, cancellation loss |
| **Engine terms exposed** | Acceptable for retainer audience — institutional terms are the product at this tier |
| **Generic copy risk** | MEDIUM-HIGH — "Deltas" unexplained |
| **IP leakage risk** | CRITICAL — Full cycle-based reporting model, evidence boundary filtering, option-decay model, suppression criteria exposed |
| **Claim risk** | CRITICAL — Deltas without methodology; irreversibility score without methodology; organisation divergence with opaque confidence |
| **UX weakness** | Suppression notice generic; cost of inaction raw with no timeframe |
| **Mobile risk** | HIGH — 2-column grids collapse |
| **Trust risk** | CRITICAL — Evidence boundary filtering opaque |
| **Recommended action** | Add glossary for all terms; disclose filtering criteria; add cost basis; explain irreversibility scale |

### 31. Outcome Verification — `/outcome/check` (pages/outcome/check.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED |
| **Commercial purpose** | 30-day follow-up verification |
| **Current tone** | Bespoke + follow-up |
| **Data exposed** | Original contradiction, recommended action, default path forecast, outcome status |
| **Engine terms exposed** | **VIOLATION:** "Intelligence spine" (internal data model) referenced |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | MEDIUM — Verification cadence (30 days), spine model |
| **Claim risk** | HIGH — "Default path forecast" without methodology; "avoidance pattern" after single inaction |
| **UX weakness** | No explanation of forecast; no character limit guidance |
| **Mobile risk** | LOW |
| **Trust risk** | MEDIUM |
| **Recommended action** | Explain prediction basis; define pattern threshold; add outcome confirmation |

### 32. Restricted — `/restricted` (app/restricted/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | INTERNAL_ONLY (password-gated) |
| **Commercial purpose** | Sovereign access gate |
| **Current tone** | Institutional + security theatre |
| **Data exposed** | Access key input, return URL |
| **Engine terms exposed** | "Sovereign Access Key", "AES-256 Encrypted", "Directorate Terminal" |
| **Generic copy risk** | HIGH — "Sovereign Access Key" and "AES-256" are marketing without technical grounding |
| **IP leakage risk** | LOW |
| **Claim risk** | MEDIUM — Encryption claim without verification |
| **UX weakness** | No instruction on where to obtain key; no rate limiting feedback |
| **Mobile risk** | LOW |
| **Trust risk** | MEDIUM — Custom, non-standard authentication |
| **Recommended action** | Replace with plain language; add rate limiting feedback; explain purpose |

### 33. Board Dashboard — `/board/dashboard` (pages/board/dashboard.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | BOARD_SAFE |
| **Commercial purpose** | Board-level decision visibility |
| **Current tone** | Institutional |
| **Data exposed** | Board-relevant metrics and decisions |
| **Engine terms exposed** | Needs component-level audit |
| **Generic copy risk** | MEDIUM |
| **IP leakage risk** | MEDIUM |
| **Claim risk** | MEDIUM |
| **UX weakness** | Needs audit |
| **Mobile risk** | HIGH |
| **Trust risk** | MEDIUM |
| **Recommended action** | Full component audit required |

---

## ADMIN / OPERATOR / INTERNAL SURFACES

### 34. Admin Command Centre — `/admin` (pages/admin/index.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | `requireAdminPage()` — ✅ SECURED |
| **Commercial purpose** | Operational dashboard |
| **Data exposed** | Deal flow stats, proof queue counts, system status |
| **Engine terms exposed** | Internal API endpoint names — acceptable for admin |
| **IP leakage risk** | MEDIUM — Internal categorisation system visible |
| **Recommended action** | Acceptable |

### 35. Redis Diagnostic — `/admin/redis` (pages/admin/redis.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | 🚨 **NONE — UNGUARDED** |
| **Data exposed** | Redis connection status, cached key count, memory usage, disk asset count, sync state |
| **Engine terms exposed** | "VAULT" storage layer, Redis/disk architecture |
| **IP leakage risk** | HIGH — Infrastructure topology exposed |
| **Security risk** | CRITICAL — Anyone can visit `/admin/redis` |
| **Recommended action** | **IMMEDIATE FIX: Add requireAdminPage() guard** |

### 36. PDF Status — `/admin/pdf-status` (pages/admin/pdf-status.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | 🚨 **NONE — UNGUARDED** |
| **Data exposed** | All PDF filenames in /public/pdfs/, file sizes, modification dates, total count (75) |
| **Engine terms exposed** | "Intelligence briefs" naming, filesystem paths |
| **IP leakage risk** | MEDIUM — Product enumeration |
| **Security risk** | HIGH — Asset listing publicly accessible |
| **Recommended action** | **IMMEDIATE FIX: Add requireAdminPage() guard** |

### 37. Testing Lab — `/testing/lab` (app/testing/lab/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | INTERNAL_ONLY |
| **Auth guard** | 🚨 **NONE — UNGUARDED** (no layout.tsx exists for /testing/) |
| **Data exposed** | Strategic Stress Workbench (component-dependent) |
| **IP leakage risk** | HIGH — Internal analysis tool exposed |
| **Recommended action** | **IMMEDIATE FIX: Create app/testing/layout.tsx with requireAdminServer()** |

### 38. Downloads Vault — `/downloads/vault` (app/downloads/vault/page.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | AUTHENTICATED (SHOULD BE) |
| **Auth guard** | 🚨 **NONE — UNGUARDED** |
| **Data exposed** | Proprietary artifact titles, categories, descriptions, ID scheme |
| **IP leakage risk** | CRITICAL — Intellectual property listing publicly accessible |
| **Recommended action** | **IMMEDIATE FIX: Create app/downloads/layout.tsx with auth guard** |

### 39. Inner Circle Admin Dashboard — `/inner-circle/admin/dashboard` (pages/inner-circle/admin/dashboard.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | 🚨 **NO page-level guard** — relies on API-level auth only |
| **Data exposed** | Member directory (emails, tiers), audit logs, diagnostic submissions, system health, dead letter queue, denylist |
| **IP leakage risk** | CRITICAL — Entire backend topology exposed |
| **Security risk** | MEDIUM — API guards protect data but page renders loading state to any visitor |
| **Recommended action** | **Add getServerSideProps with requireAdminPage()** |

### 40. Premium Downloads Admin — `/private/admin/premium-downloads` (pages/private/admin/premium-downloads.tsx)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | 🚨 **NO page-level guard** — relies on API auth |
| **Data exposed** | Download tokens, attempt ledger, watermark system, anomaly thresholds |
| **IP leakage risk** | HIGH — Watermark/DRM system exposed |
| **Recommended action** | **Add getServerSideProps with auth** |

### 41. Admin Campaigns — `/admin/campaigns` (app/admin/campaigns/)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | ✅ SECURED via app/admin/layout.tsx |
| **Recommended action** | Acceptable |

### 42. Admin Organisations — `/admin/organisations` (app/admin/organisations/)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | ✅ SECURED via app/admin/layout.tsx |
| **Recommended action** | Acceptable |

### 43. Admin Decision Intelligence — `/admin/decision-intelligence` (app/admin/decision-intelligence/)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | ✅ SECURED via app/admin/layout.tsx |
| **Recommended action** | Acceptable |

### 44. Admin Decision/* — `/admin/decision/*` (app/admin/decision/)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | ✅ SECURED via app/admin/layout.tsx |
| **Data exposed** | Contextual efficacy, ranking, governance, performance, metadata audit |
| **IP leakage risk** | HIGH — Route naming reveals decision optimisation system |
| **Recommended action** | Acceptable — admin territory |

### 45. Admin Reporting — `/admin/reporting/executive/*` (app/admin/reporting/)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | ✅ SECURED via app/admin/layout.tsx |
| **Data exposed** | Mock data reveals complete analytical framework (4 domains, banding, variance, fragility) |
| **IP leakage risk** | CRITICAL — Mock data schema fully reveals scoring methodology |
| **Recommended action** | Replace specific domain names and thresholds in mock data |

### 46. Admin Snapshot — `/admin/snapshot` (app/admin/snapshot/)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Auth guard** | ✅ SECURED via app/admin/layout.tsx |
| **IP leakage risk** | CRITICAL — Same mock data exposure as #45 |
| **Recommended action** | Same as #45 |

### 47. Directorate Dossier — `/directorate/dossier/[id]` (pages/directorate/dossier/[id].tsx)

| Field | Finding |
|-------|---------|
| **Audience** | ADMIN |
| **Commercial purpose** | Intake detail view |
| **Data exposed** | Gravity score (0-25), raw JSON payload, decision logic, risk appetite, background task status |
| **Engine terms exposed** | "Gravity Score", "LLM_Summarization", background processing architecture |
| **IP leakage risk** | CRITICAL — Full raw payload unencrypted |
| **Recommended action** | Hide raw JSON behind toggle; explain gravity score scale |

---

## IP DISCLOSURE VIOLATIONS SUMMARY

| Term | Severity | Where Found | Surface Type | Action |
|------|----------|-------------|-------------|--------|
| **micro-tension** | CRITICAL | components/strategy-room/ExecutionFlow.tsx | AUTHENTICATED | Rename to generic feedback mechanism |
| **anchor narrative** | HIGH | PurposeAlignmentAssessment, fast.tsx, executive-reporting | AUTHENTICATED | Rename to "decision narrative" in client output |
| **cognitive state** (labels) | HIGH | pages/decision-centre.tsx | AUTHENTICATED | Abstract to user-friendly stage names |
| **evidence graph** | HIGH | pages/method.tsx (PUBLIC), strategy-room session | PUBLIC + AUTH | Remove from method.tsx; rename to "decision evidence basis" |
| **consequence score** (numeric) | MEDIUM | strategy-room session | AUTHENTICATED | Add visual scale, remove raw number |
| **intelligence spine** | MEDIUM | pages/outcome/check.tsx | AUTHENTICATED | Remove from client-facing code |
| **governed synthesis** | MEDIUM | tournament-engine.ts (user-visible text) | INTERNAL | Suppress from client output |
| **gravity score** | LOW-MEDIUM | strategy-room Form, directorate dossier | AUTHENTICATED + ADMIN | Acceptable in admin; review form exposure |

### Terms NOT found (good):
- contradiction kernel ✅
- action simulation (internal only) ✅
- signal continuity algorithm ✅
- pattern recurrence algorithm ✅
- constitutional orchestration (internal only) ✅

---

## SECURITY FINDINGS — UNGUARDED ROUTES

| Route | Guard Status | Risk | Fix |
|-------|-------------|------|-----|
| `/admin/redis` | 🚨 NONE | HIGH | Add requireAdminPage() |
| `/admin/pdf-status` | 🚨 NONE | HIGH | Add requireAdminPage() |
| `/testing/lab` | 🚨 NONE | HIGH | Create layout.tsx with requireAdminServer() |
| `/downloads/vault` | 🚨 NONE | CRITICAL | Create layout.tsx with auth |
| `/inner-circle/admin/dashboard` | ⚠ API only | MEDIUM | Add getServerSideProps with requireAdminPage() |
| `/private/admin/premium-downloads` | ⚠ API only | MEDIUM | Add getServerSideProps with auth |

---

## LAUNCH CLASSIFICATION

| Surface | Classification |
|---------|---------------|
| Homepage | SAFE_FOR_PUBLIC |
| About | SAFE_FOR_PUBLIC |
| Method | SAFE_FOR_PUBLIC (after "evidence graph" removal) |
| Trust | SAFE_FOR_PUBLIC |
| Verification | SAFE_FOR_PUBLIC |
| Security | SAFE_FOR_PUBLIC |
| Foundations | SAFE_FOR_PUBLIC |
| Evidence | SAFE_FOR_PUBLIC (needs full case dossier) |
| Diagnostics Hub | SAFE_FOR_PUBLIC |
| Decision Paths | SAFE_FOR_PUBLIC |
| Decision Instruments | SAFE_FOR_PUBLIC |
| Lexicon | SAFE_FOR_PUBLIC |
| Contact | SAFE_FOR_PUBLIC |
| Institutional | SAFE_FOR_PUBLIC |
| Leadership | SAFE_FOR_PUBLIC |
| Education/Research | SAFE_FOR_PUBLIC |
| Why Not AI | CONTROLLED_ENTRY_ONLY (claim risk) |
| Pricing | SAFE_FOR_PUBLIC |
| CSS Diagnostic | DO_NOT_EXPOSE |
| Fast Diagnostic | CONTROLLED_ENTRY_ONLY |
| Purpose Alignment | CONTROLLED_ENTRY_ONLY |
| Constitutional Diagnostic | CONTROLLED_ENTRY_ONLY |
| Team Assessment | CONTROLLED_ENTRY_ONLY |
| Enterprise Assessment | CONTROLLED_ENTRY_ONLY |
| Decision Centre | CONTROLLED_ENTRY_ONLY |
| Return Brief | CONTROLLED_ENTRY_ONLY |
| Strategy Room | CONTROLLED_ENTRY_ONLY |
| Audit (survey) | CONTROLLED_ENTRY_ONLY (needs consent fix) |
| Assessment | CONTROLLED_ENTRY_ONLY |
| Outcome Check | CONTROLLED_ENTRY_ONLY |
| Retainer | RETAINER_READY (after IP fix) |
| Oversight Brief | RETAINER_READY (after IP fix) |
| Board Dashboard | NEEDS_REWRITE |
| Restricted | INTERNAL_ONLY |
| Admin index | INTERNAL_ONLY |
| Admin Redis | NEEDS_SECURITY_REVIEW |
| Admin PDF Status | NEEDS_SECURITY_REVIEW |
| Testing Lab | NEEDS_SECURITY_REVIEW |
| Downloads Vault | NEEDS_SECURITY_REVIEW |
| Inner Circle Admin | NEEDS_SECURITY_REVIEW |
| Premium Downloads | NEEDS_SECURITY_REVIEW |
| Admin Decision/* | INTERNAL_ONLY |
| Admin Reporting | INTERNAL_ONLY |
| Admin Campaigns | INTERNAL_ONLY |
| Admin Organisations | INTERNAL_ONLY |
| Admin Snapshot | INTERNAL_ONLY |
| Directorate Dossier | INTERNAL_ONLY |
