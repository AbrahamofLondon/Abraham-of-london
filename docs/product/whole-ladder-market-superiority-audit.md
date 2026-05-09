# Whole-Ladder Market Superiority Audit

**Date:** 2026-05-09
**Standard:** Beyond demo readiness. Would a serious operator believe this is materially beyond a diagnostic, consultancy funnel, AI wrapper, assessment suite, or dashboard?

---

## PART 1 -- SURFACE-BY-SURFACE CLASSIFICATION

| # | Surface | Classification | Why |
|---|---------|---------------|-----|
| 1 | Homepage | CATEGORY_DEFINING | Demonstrates refusal, memory continuity, earned progression, and evidence discipline in the first scroll. No competitor homepage operates this way. |
| 2 | Diagnostics Index | ABOVE_EXPECTATION | Evidence-gated progression. Surfaces locked until prior evidence exists. Not a menu -- a governed ladder. |
| 3 | Fast Diagnostic | CATEGORY_DEFINING | Live input validation challenges vague language mid-flow. Commitment gating records whether user will act. Checkpoint scheduled. Governed memory created. |
| 4 | Purpose Alignment | CATEGORY_DEFINING | Dual-axis (truth vs certainty) catches people who say something is true but are uncertain. Competing-obligation analysis converts personality quiz into structural reading. |
| 5 | Constitutional Diagnostic | CATEGORY_DEFINING | Downstream handoff architecture generates hypotheses for team/enterprise/ER/strategy room. Integrity challenge and disqualifier logic enforce evidence quality. |
| 6 | Team Assessment | ABOVE_EXPECTATION | Perception gap methodology with Bessel-corrected fragility classification. Adaptive questions from intelligence spine. |
| 7 | Enterprise Assessment | ABOVE_EXPECTATION | Solid institutional assessment integrated with constitutional thread. Inherits context from prior surfaces. |
| 8 | ER Gate | ABOVE_EXPECTATION | Uses user's own evidence to prove value before asking for payment. Explicit estimate labelling. |
| 9 | ER Run + Result | ACQUISITION_SIGNAL | DB persistence, contagion analysis, intervention simulation, boardroom qualification, provenance tracking. 12-18 months to replicate. |
| 10 | Boardroom | CATEGORY_DEFINING | Qualification gate refuses weak cases. Objection-handling with evidence-backed responses. Pre-built board objections. |
| 11 | Strategy Room Gate | CATEGORY_DEFINING | Evidence-gated entry that refuses access and explains why. Reads diagnostic thread, issues allow/restrict/block directives. |
| 12 | Strategy Room Session | CATEGORY_DEFINING | Anti-gaming scoring (text quality over slider values). Live execution governance with avoidance detection. Irreversibility index. |
| 13 | Return Brief | ACQUISITION_SIGNAL | Confrontation-as-product. Remembers commitments, checks verification, shows compounding cost. Checkpoint governance. |
| 14 | Decision Centre | CATEGORY_DEFINING | Living Cases with 6-stage cognitive lifecycle. Evidence-tier admission. Not a dashboard -- a case console. |
| 15 | Intelligence Memory | ABOVE_EXPECTATION | Thin shell around intelligence stack. Value lives in the engine, not this surface. |
| 16 | Intelligence Contradictions | ABOVE_EXPECTATION | Contradiction concept is novel but page is minimal read-only projection. |
| 17 | Evidence Standards | CATEGORY_DEFINING | Publishing verification methodology, seal levels, and publication thresholds before outcomes. Institutional trust infrastructure. |
| 18 | Counsel Room | CATEGORY_DEFINING | Evidence-gated human escalation with explicit access states. Not a contact form. |
| 19 | Counsel Intake | ABOVE_EXPECTATION | Prefilled evidence + user-only questions + access gating. Superior to standard intake but pattern is known. |
| 20 | Counsel Status | ABOVE_EXPECTATION | Governed status tracking with non-sales-funnel framing. |
| 21 | Oversight Command | CATEGORY_DEFINING | Sponsor-safe governance dashboard with suppression boundaries and cancellation-loss. No market equivalent. |
| 22 | Oversight Brief | CATEGORY_DEFINING | Governed monthly intelligence brief with institutional memory, cross-cycle comparison, irreversibility scoring, option-decay. |
| 23 | Retainer Readiness Admin | ABOVE_EXPECTATION | Self-imposed constraint mechanism. Static but operationally honest. |
| 24 | Proof Pack | ABOVE_EXPECTATION | Evidence-classified social proof with honest fallback disclosure. Minimum sample-size threshold. |
| 25 | Outcome Verification | CATEGORY_DEFINING | Closed-loop: asks "were we right?", records answer with provenance. Most products never close the loop. |
| 26 | Launch Dashboard | MARKET_EXPECTED | Standard conversion funnel dashboard. Honest labelling but functionally table stakes. |
| 27 | Footer | ABOVE_EXPECTATION | Premium institutional footer with evidence-posture language. Better than market standard but still a footer. |
| 28 | Navbar/Header | ABOVE_EXPECTATION | Header.tsx is a statement piece. Auth-aware routing. Two competing implementations is minor debt. |
| 29 | Checkpoint System | CATEGORY_DEFINING | Command fingerprinting, multi-response history, explicit "whatShouldSystemRemember" capture, cross-surface correlation. |
| 30 | Evidence Capture Contract | CATEGORY_DEFINING | Field-level provenance with evidence posture, confidence labels, comparison basis, merge tracking, suppression reasoning. |

**Summary:**
- ACQUISITION_SIGNAL: 2 (ER Run, Return Brief)
- CATEGORY_DEFINING: 16
- ABOVE_EXPECTATION: 11
- MARKET_EXPECTED: 1 (Launch Dashboard)
- BELOW_EXPECTATION: 0

---

## PART 2 -- TRANSITION COHERENCE MAP

| # | Transition | Classification | Notes |
|---|-----------|---------------|-------|
| 1 | Homepage -> Fast Diagnostic | WORKS | Clean link, right expectation set. |
| 2 | Fast Diagnostic -> earned next step | FEELS_INEVITABLE | Recommendation engine selects path from diagnostic signal. Not generic upsell. |
| 3 | Fast Diagnostic -> Decision Centre | WORKS | Data passes through API, not client state. Auth fallback points back to entry. |
| 4 | Constitutional -> route decision | CREATES_SWITCHING_COST | Three handoff tokens written. Bridge context (hypotheses, headline, mandate draft) would be lost on abandon. |
| 5 | ER -> Strategy Room | TECHNICALLY_WORKS_BUT_FEELS_PATCHED | StrategyRoomConversionBridge imported but never rendered. Link is plain `<a>` not `<Link>`. Thread system carries data but unused bridge import suggests incomplete wiring. |
| 6 | Strategy Room -> Return Brief | WORKS | Session key in URL. Return brief API pulls full evidence server-side. |
| 7 | Return Brief -> Decision Centre | WORKS | Link present but secondary to "Return to Strategy Room." Evidence continuity via case system. |
| 8 | Decision Centre -> Intelligence | CREATES_SWITCHING_COST | Intelligence rendered inline per case. Governed memory with provenance. Centre of gravity. |
| 9 | Counsel Intake -> Status | TECHNICALLY_WORKS_BUT_FEELS_PATCHED | Post-submission routes to `/counsel` not `/counsel/status`. No queue visibility or ETA. |
| 10 | Oversight -> Boardroom/Proof Pack | WORKS | Three explicit links. Server-side data. Role-safe visibility. |

**2 transitions feel patched.** Both are P1 fixes.

---

## PART 3 -- USER VALUE TEST

| Surface | Understand 20s | Not from ChatGPT | Remembers | Know next step | Discomfort/clarity | Return | Pay | Show others |
|---------|---------------|------------------|-----------|---------------|-------------------|--------|-----|------------|
| Homepage | YES | YES | N/A | YES | PARTIAL | PARTIAL | N/A | YES |
| Fast Diagnostic | YES | YES | YES | YES | YES | YES | PARTIAL | YES |
| Purpose Alignment | PARTIAL | YES | YES | YES | YES | YES | PARTIAL | PARTIAL |
| Constitutional | PARTIAL | YES | YES | YES | YES | YES | PARTIAL | PARTIAL |
| ER Result | YES | YES | YES | YES | YES | YES | YES | YES |
| Strategy Room | PARTIAL | YES | YES | YES | YES | YES | YES | YES |
| Return Brief | YES | YES | YES | YES | YES | YES | YES | YES |
| Decision Centre | PARTIAL | YES | YES | YES | YES | YES | YES | YES |
| Counsel Room | YES | YES | YES | YES | YES | YES | YES | PARTIAL |
| Oversight Command | YES | YES | YES | YES | YES | YES | YES | YES |
| Proof Pack | YES | PARTIAL | YES | NO | PARTIAL | PARTIAL | NO | PARTIAL |

**Key NO answers:**
- Proof Pack: "know what to do next" -- NO (read-only display, no action path)
- Proof Pack: "would they pay" -- NO (public-facing component, not a paid surface)

---

## PART 4 -- COMPETITIVE COPYCAT TEST

| Surface | 30-day copy | 6-month copy | Requires accumulated data | Requires workflow dependency | Classification |
|---------|------------|-------------|--------------------------|------------------------------|---------------|
| Homepage | UI only | -- | No | No | COPYABLE_UI |
| Fast Diagnostic | UI + basic logic | Challenge system, commitment gate | Checkpoint history | Downstream handoffs | HARD_TO_COPY_WORKFLOW |
| Constitutional | UI | Routing + bridge architecture | Handoff tokens | Full ladder dependency | HARD_TO_COPY_WORKFLOW |
| ER Result | UI | Contagion, simulation, boardroom qual | Case history, benchmarks | Constitutional thread | HARD_TO_COPY_DATA |
| Return Brief | Concept | Confrontation engine, cost clock | Prior commitments, checkpoints | Full case memory | HARD_TO_COPY_INSTITUTIONAL_DEPENDENCY |
| Decision Centre | UI | Living case lifecycle | Accumulated cases, governed memory | Evidence-tier admission | HARD_TO_COPY_INSTITUTIONAL_DEPENDENCY |
| Strategy Room | UI | Anti-gaming, avoidance detection | Session history, execution state | Evidence carry-forward | HARD_TO_COPY_DATA |
| Checkpoint System | Concept | Fingerprinting, multi-response | Response history | Cross-surface correlation | HARD_TO_COPY_INSTITUTIONAL_DEPENDENCY |
| Oversight Command | UI | Suppression, role-safe delivery | Retained cycle memory | Cancellation loss | HARD_TO_COPY_INSTITUTIONAL_DEPENDENCY |
| Evidence Contract | -- | Full provenance system | Field-level history | System-wide dependency | HARD_TO_COPY_INSTITUTIONAL_DEPENDENCY |

**Moat distribution:**
- COPYABLE_UI: 1 (Homepage)
- HARD_TO_COPY_WORKFLOW: 2
- HARD_TO_COPY_DATA: 2
- HARD_TO_COPY_INSTITUTIONAL_DEPENDENCY: 5

---

## PART 5 -- EVIDENCE / MEMORY / CONSEQUENCE TEST

| Surface | Captures | Classifies | Carries fwd | Shows memory | Challenges contradiction | Schedules checkpoint | Records response | Verifies outcome | Escalates | Refuses | Suppresses | Creates retained memory |
|---------|---------|-----------|------------|-------------|------------------------|---------------------|-----------------|-----------------|----------|---------|-----------|----------------------|
| Homepage | - | - | - | - | - | - | - | - | - | - | - | - |
| Fast Diagnostic | Y | Y | Y | - | Y | Y | Y | - | Y | Y | - | Y |
| Purpose Alignment | Y | Y | Y | Y | Y | Y | - | - | Y | Y | - | Y |
| Constitutional | Y | Y | Y | Y | Y | - | - | - | Y | Y | - | Y |
| Team Assessment | Y | Y | Y | Y | - | - | - | - | Y | - | - | Y |
| Enterprise Assessment | Y | Y | Y | Y | - | - | - | - | Y | - | - | Y |
| ER Result | Y | Y | Y | Y | Y | Y | - | Y | Y | - | Y | Y |
| Strategy Room | Y | Y | Y | Y | Y | Y | Y | - | Y | Y | - | Y |
| Return Brief | - | - | Y | Y | Y | Y | Y | Y | Y | Y | - | Y |
| Decision Centre | - | Y | Y | Y | Y | - | Y | Y | Y | Y | Y | Y |
| Intelligence Memory | - | - | - | Y | - | - | - | - | - | - | - | - |
| Intelligence Contradictions | - | - | - | Y | Y | - | - | - | - | - | - | - |
| Evidence Standards | - | - | - | - | - | - | - | - | - | - | - | - |
| Counsel Room | - | Y | Y | Y | - | - | - | - | Y | Y | - | - |
| Counsel Intake | Y | Y | Y | Y | - | - | - | - | Y | Y | - | Y |
| Counsel Status | - | - | - | Y | - | - | - | - | - | - | - | - |
| Oversight Command | - | Y | Y | Y | - | - | - | - | - | - | Y | Y |
| Oversight Brief | - | Y | Y | Y | Y | Y | - | - | Y | - | Y | Y |
| Proof Pack | - | Y | - | Y | - | - | - | - | - | - | - | - |
| Outcome Verification | Y | Y | Y | Y | - | - | Y | Y | - | - | - | Y |
| Checkpoint System | Y | Y | Y | Y | - | Y | Y | - | Y | - | - | Y |

**Surfaces doing none:** Homepage (expected), Evidence Standards (transparency doc, acceptable), Launch Dashboard (internal analytics, acceptable).

**Recommendation:** Intelligence Memory and Intelligence Contradictions do too little independently. They should be absorbed into Decision Centre as expanded panels rather than standalone pages.

---

## PART 6 -- OPERATOR IMPRESSION TEST (HIGH-VALUE SURFACES)

### Homepage
- **Impress:** Refusal concept. "The system can refuse to proceed."
- **Suspicious:** No live demo inline. Requires click-through to prove the claim.
- **Toy risk:** None if typography and density hold.
- **Consulting wrapper risk:** Low. Language is institutional, not advisory.
- **Pilot trigger:** Unlikely from homepage alone. Needs Fast Diagnostic.
- **Internal question:** How does refusal work? (Good -- creates curiosity without exposing IP.)

### Fast Diagnostic
- **Impress:** Live challenge cards. "You said 'improve culture' -- that is not a decision."
- **Suspicious:** Only 3 inputs. Serious operators may question depth.
- **Toy risk:** MEDIUM if the finding feels generic for different inputs.
- **Pilot trigger:** YES if the finding names something the operator recognises but hasn't articulated.
- **Must show without exposing IP:** The contradiction between stated decision and observed pattern.

### ER Result
- **Impress:** Financial exposure model, contagion map, board snapshot.
- **Suspicious:** Where does the financial model come from? (Need clear "scenario estimate" labelling.)
- **Pilot trigger:** YES. The depth of the report makes hand-assembly feel irrational.
- **Internal question:** What is the constitutional scoring model? (Must not be answered publicly.)

### Return Brief
- **Impress:** "You committed to X. You haven't. Here is the accumulating cost."
- **Suspicious:** Nothing. This is the hardest surface to dismiss.
- **Pilot trigger:** STRONG. No competitor product confronts you with your own commitments.
- **Must show:** The cost clock and checkpoint verification status.

### Decision Centre
- **Impress:** Living Cases with cognitive lifecycle. Evidence-tier admission.
- **Suspicious:** Complexity. Operators may need walkthrough.
- **Consulting wrapper risk:** LOW. No consulting firm tracks cognitive state per case.
- **Must show:** The "next required action" specificity and the governed memory with provenance.

### Oversight Command
- **Impress:** Cancellation loss panel. "If you leave, you lose X cycles, Y checkpoints, Z dossiers."
- **Suspicious:** Is the system actually tracking all this or just counting records?
- **Pilot trigger:** YES for retained oversight conversations.
- **Must show:** The suppression notice. "What we withhold and why."

---

## PART 7 -- RETAINER READINESS TEST

| # | Area | Rating | Key gap |
|---|------|--------|---------|
| 1 | Sponsor-safe command surface | SELECTIVELY_DEFENSIBLE | No sponsor-role entitlement check. No PDF export. |
| 2 | Cadence enforcement | FOUNDATION_READY | System tracks cadence state but does not enforce it. No scheduler. |
| 3 | Retained review cycle memory | NEAR_DEFENSIBLE | No client-facing cycle history timeline. Only aggregate counts. |
| 4 | Boardroom archive | SELECTIVELY_DEFENSIBLE | No independent browsing surface. No export. No retention lifecycle. |
| 5 | Counsel case memory | SELECTIVELY_DEFENSIBLE | No resolution workflow. No sponsor-safe outcome summary. No SLA. |
| 6 | Retained outcome history | NEAR_DEFENSIBLE | No longitudinal outcome trend surface. Fragmented across surfaces. |
| 7 | Decision credit governance | SELECTIVELY_DEFENSIBLE | No visible credit history or trend. No audit trail for band transitions. |
| 8 | Cancellation/continuity loss | DEFENSIBLE | Strongest area. Explicit, itemised, honest. |
| 9 | Role separation | FOUNDATION_READY | Single `isAuthenticated` check. No role enum on data layer. |
| 10 | Portfolio memory | FOUNDATION_READY | No dedicated surface. Internal only. |
| 11 | Organisation divergence | SELECTIVELY_DEFENSIBLE | Computed but no sponsor-facing surface. No trend tracking. |
| 12 | Suppression discipline | NEAR_DEFENSIBLE | No suppression audit log. Static rules, not dynamic. |
| 13 | Operator review workflow | SELECTIVELY_DEFENSIBLE | No multi-operator review. Env-driven auth, not role-based. |
| 14 | Proof pack | NEAR_DEFENSIBLE | No PDF export. No tamper-evidence. No operator attestation. |
| 15 | Client-safe delivery | FOUNDATION_READY | Contract exists but no implementation. No email, no PDF, no portal delivery. |

**Overall: SELECTIVELY_DEFENSIBLE at 15k. Not ready for 50k. Four areas at FOUNDATION_READY block credible claims above 5k without heavy operator involvement.**

---

## PART 8 -- PRODUCT SURFACE RANKING

### A. MARKET_WEAPON (show confidently)
1. Fast Diagnostic (with commitment gating and challenge cards)
2. ER Result (depth, financial model, board snapshot)
3. Return Brief (confrontation-as-product, cost clock)
4. Decision Centre (living cases, cognitive lifecycle)
5. Strategy Room Session (anti-gaming, avoidance detection, irreversibility)
6. Oversight Command (cancellation loss, sponsor-safe summary)
7. Evidence Standards (institutional trust, verification methodology)
8. Constitutional Diagnostic (routing + downstream handoff architecture)

### B. SOLID_SUPPORTING_SURFACE
1. Homepage
2. Diagnostics Index
3. ER Gate
4. Strategy Room Gate
5. Boardroom
6. Counsel Room
7. Purpose Alignment
8. Team Assessment
9. Enterprise Assessment
10. Oversight Brief
11. Checkpoint System
12. Outcome Verification
13. Footer/Header

### C. NEEDS_HARDENING
1. Proof Pack -- no action path, no next step, read-only
2. Intelligence Memory -- thin shell, should be absorbed into Decision Centre
3. Intelligence Contradictions -- thin shell, should be absorbed into Decision Centre
4. Counsel Status -- functional but no queue position or ETA visibility
5. Counsel Intake -> Status transition -- routes to wrong page post-submission

**Build paths for C surfaces:**
- Proof Pack: Add "request operator attestation" action and link to next diagnostic/oversight surface
- Intelligence Memory/Contradictions: Absorb as expanded tabs within Decision Centre
- Counsel Status: Add queue position indicator and expected response timeframe
- Counsel Intake: Route post-submission to `/counsel/status` with confirmation state

### D. HIDE_OR_REBUILD
1. Launch Dashboard -- standard SaaS funnel dashboard, adds nothing to operator demo. Keep admin-only, do not show.

---

## PART 9 -- MIRACLE VS READINESS TEST

| Surface | Classification | Notes |
|---------|---------------|-------|
| Homepage | VALUE_VISIBLE | Refusal demo and memory preview show the thesis. |
| Fast Diagnostic | VALUE_VISIBLE | Challenge cards and commitment gate demonstrate value in-flow. |
| Purpose Alignment | VALUE_REQUIRES_EXPLANATION | Dual-axis concept needs brief framing for operators. |
| Constitutional | VALUE_REQUIRES_EXPLANATION | Bridge architecture value is invisible to user. |
| Team Assessment | VALUE_VISIBLE | Gap analysis is immediately recognisable. |
| Enterprise Assessment | VALUE_VISIBLE | Band classification is clear. |
| ER Gate | VALUE_VISIBLE | Uses your own words to preview report value. |
| ER Result | VALUE_VISIBLE | Depth speaks for itself. |
| Strategy Room Gate | VALUE_VISIBLE | Refusal with reason is immediately understood. |
| Strategy Room Session | VALUE_REQUIRES_EXPLANATION | Avoidance detection and irreversibility need framing. |
| Return Brief | VALUE_VISIBLE | Confrontation is self-evident. |
| Decision Centre | VALUE_REQUIRES_EXPLANATION | Cognitive lifecycle and admission tiers need walkthrough. |
| Intelligence Memory | VALUE_REQUIRES_EXPLANATION | Thin surface requires context. |
| Intelligence Contradictions | VALUE_REQUIRES_EXPLANATION | Same as Memory. |
| Counsel Room | VALUE_VISIBLE | Evidence gate is self-explanatory. |
| Oversight Command | VALUE_VISIBLE | Cancellation loss is immediately understood. |
| Oversight Brief | VALUE_REQUIRES_EXPLANATION | Depth requires guided reading. |
| Proof Pack | VALUE_REQUIRES_FAITH | No clear action. Needs explanation to see purpose. |

**No surface is VALUE_NOT_PRESENT.**
**One surface (Proof Pack) is VALUE_REQUIRES_FAITH** -- needs rebuild or repositioning.

---

## PART 10 -- BUILD PLAN

### P0 -- Before Serious Operator Outreach

| # | Surface | Problem | Required Build | Files Likely Involved | Acceptance Criteria | Verification | Risk if Skipped |
|---|---------|---------|---------------|----------------------|--------------------|--------------|-|
| P0.1 | ER -> Strategy Room | StrategyRoomConversionBridge imported but never rendered. Link is `<a>` not `<Link>`. | Wire up conversion bridge or remove dead import. Use `<Link>` for navigation. Pass evidence context in URL/session. | `pages/diagnostics/executive-reporting/run.tsx` | Strategy Room opens with ER evidence pre-loaded. No dead imports. | Manual flow test + grep for unused imports. | Operator sees disconnected surface during demo. |
| P0.2 | Counsel Intake -> Status | Post-submission routes to `/counsel` not `/counsel/status`. No queue visibility. | Route to `/counsel/status?submitted=true` with confirmation banner. | `pages/counsel/intake.tsx`, `pages/counsel/status.tsx` | After intake submission, user lands on status page with confirmation. | Manual flow test. | Operator submits counsel request, gets lost. |
| P0.3 | Proof Pack | Read-only, no action path, no next step. VALUE_REQUIRES_FAITH. | Add "Request operator attestation" action. Link to next diagnostic or oversight surface. | `components/proof/PublicProofBlocks.tsx`, `pages/account/proof-pack.tsx` | Proof pack has at least one forward action. | Manual inspection. | Dead-end surface during demo. |
| P0.4 | Fast Diagnostic depth | Only 3 inputs. Serious operators may question depth. | Add optional "evidence strengthener" -- 2-3 additional structured inputs that deepen the finding without making the fast path slower. | `pages/diagnostics/fast.tsx` | Optional inputs visible. Finding quality improves when used. | Compare output quality with/without optional inputs. | "Is that it?" reaction from serious operators. |
| P0.5 | Decision Centre walkthrough | Cognitive lifecycle needs explanation for first-time users. | Add a first-visit onboarding strip (dismissable) that explains the 3 key concepts: Living Cases, evidence tiers, and admission. | `pages/decision-centre.tsx` | First visit shows brief orientation. Dismissed permanently. | Manual test. | Operator confusion at the most important surface. |

### P1 -- Before First Paid Pilots

| # | Surface | Problem | Required Build | Acceptance Criteria | Risk if Skipped |
|---|---------|---------|---------------|--------------------|-|
| P1.1 | Role separation | Single `isAuthenticated` check. No role model. | Implement role enum (OPERATOR, CLIENT, SPONSOR) on session. Gate surfaces by role. | Role-based access visible in oversight, counsel, admin. | Sponsor sees operator-grade data in pilot. |
| P1.2 | Cadence enforcement | System tracks but does not enforce review cadence. | Implement scheduler-triggered cycle creation. Surface overdue state visibly. | Missed cadence creates visible consequence. | "Do you actually enforce the schedule?" answer is no. |
| P1.3 | Client-safe delivery | Delivery contract exists but no implementation. | Implement PDF export for oversight brief and proof pack. | Operator can generate and deliver PDF to sponsor. | Cannot deliver retainer artifacts outside the portal. |
| P1.4 | Proof pack export | No PDF, no tamper-evidence, no attestation. | PDF generation with operator attestation stamp and evidence posture labels. | Exportable proof pack with audit trail. | Cannot prove outcomes outside the system. |
| P1.5 | Outcome trend surface | Outcome history fragmented across surfaces. | Unified longitudinal outcome timeline per case/organisation. | Single view of all verified outcomes with trend. | "Show me the track record" has no single answer. |

### P2 -- Before High-Ticket Retainer Push (15k-50k)

| # | Surface | Problem | Required Build | Acceptance Criteria | Risk if Skipped |
|---|---------|---------|---------------|--------------------|-|
| P2.1 | Portfolio memory surface | Internal only. No sponsor visibility. | Dedicated portfolio memory page: cross-case patterns, organisation-wide intelligence, divergence trends. | Sponsor can see portfolio-level institutional memory. | Cannot justify 50k without portfolio-level visibility. |
| P2.2 | Organisation divergence surface | Computed but no sponsor-facing view. | Sponsor-safe divergence dashboard with trend tracking and privacy-safe aggregation. | Divergence visible to sponsors with sample-safety suppression. | Cannot demonstrate institutional intelligence at scale. |
| P2.3 | Multi-operator review | No approval chain. Env-driven auth. | Implement operator review queue with multi-approver workflow. | Multiple operators can review and approve before client delivery. | Single-operator bottleneck in high-value accounts. |
| P2.4 | Suppression audit log | No record of what was suppressed and why. | Persistent suppression log per cycle. Surfaced in admin. | Operator can audit suppression decisions. | Cannot defend suppression choices under scrutiny. |
| P2.5 | Counsel SLA tracking | No response time tracking. No sponsor visibility. | Implement SLA clock on counsel cases. Surface expected/actual response time. | Sponsors see counsel responsiveness metrics. | Cannot defend counsel pricing without SLA. |

---

## PART 11 -- FINAL VERDICT

### 1. Overall Ladder Classification

**SELECTIVE_PILOT_READY**

The product is beyond demo-ready and market-credible. It is operator-impressive at the surface level. It is not yet high-ticket-ready due to four FOUNDATION_READY gaps in retainer infrastructure (cadence enforcement, role separation, portfolio memory, client-safe delivery). Selective pilots with sophisticated operators who understand the category are defensible now.

### 2. Top 5 Market Weapons
1. **Return Brief** -- Confrontation-as-product. No market equivalent.
2. **ER Result** -- Depth that makes hand-assembly feel irrational.
3. **Decision Centre** -- Living Cases with cognitive lifecycle. Not a dashboard.
4. **Strategy Room Session** -- Anti-gaming, avoidance detection, irreversibility index.
5. **Oversight Command** -- Cancellation loss + sponsor-safe suppression.

### 3. Top 5 Weak Links
1. **Proof Pack** -- Read-only dead end. VALUE_REQUIRES_FAITH.
2. **Intelligence Memory / Contradictions** -- Thin shells that don't justify standalone pages.
3. **Counsel Intake -> Status transition** -- Routes to wrong page. No queue visibility.
4. **ER -> Strategy Room bridge** -- Dead import. Plain `<a>` tag. Feels patched.
5. **Client-safe delivery** -- Contract exists, no implementation. Cannot deliver artifacts outside portal.

### 4. Top 10 Improvements for Market Defensibility
1. Wire ER -> Strategy Room conversion bridge with evidence carry-forward
2. Implement role-based access (operator/client/sponsor)
3. Build cadence enforcement with scheduler-triggered cycles
4. Implement PDF export for oversight brief and proof pack
5. Add unified outcome trend surface
6. Build portfolio memory surface for sponsors
7. Add organisation divergence sponsor-facing view
8. Absorb Intelligence Memory/Contradictions into Decision Centre
9. Add first-visit Decision Centre orientation
10. Fix Counsel Intake -> Status routing

### 5. Top 5 Improvements for Willingness to Pay
1. PDF export of oversight brief and proof pack (makes artifacts deliverable)
2. Unified outcome trend surface (proves track record)
3. Portfolio memory surface (justifies 50k price point)
4. Cancellation loss with longitudinal data (makes leaving feel costly)
5. Fast Diagnostic evidence strengthener (deepens first-touch value)

### 6. Top 5 Improvements for Switching Cost
1. Cadence enforcement (scheduled review cycles create operational dependency)
2. Portfolio memory (accumulated cross-case intelligence is non-portable)
3. Organisation divergence tracking (longitudinal divergence data is unique to the system)
4. Counsel case memory (cumulative counsel history creates continuity risk on exit)
5. Decision credit governance with visible history (reputation inside the system)

### 7. Top 5 Things to Hide from Public Surfaces
1. Constitutional scoring model internals
2. Contagion risk analysis methodology
3. Intervention impact simulation parameters
4. Bridge architecture and handoff token mechanics
5. Evidence graph kernel and arbiter logic

### 8. Top 5 Things to Show More Boldly
1. Return Brief confrontation (the cost clock and commitment verification)
2. Cancellation loss (what you lose when you leave)
3. Checkpoint system (scheduled verification with memory)
4. Evidence Standards (publish methodology before outcomes)
5. Refusal logic (show refusal happening, not just described)

### 9. Outreach Timing

**BEGIN SELECTIVELY NOW.**

P0.1 (ER-Strategy Room bridge) and P0.2 (Counsel routing) are the only two that could cause embarrassment during a demo. P0.3-P0.5 are improvements, not blockers. The core ladder (Fast Diagnostic -> ER -> Return Brief -> Decision Centre -> Oversight) is strong enough for selective outreach to operators who already understand governance, institutional risk, or transformation infrastructure.

Do not wait for P1. Pilots validate P1 priorities.

### 10. Recommended Demo Sequence

**Use this exact sequence for serious operator demos:**

1. **Homepage** (30 seconds) -- "The system can refuse to proceed." Memory continuity preview. Earned progression concept.
2. **Fast Diagnostic** (live) -- Use a real decision. Show challenge cards correcting vague input. Show commitment gate.
3. **Fast Result** -- Finding, contradiction, required move, 30/60/90-day cost, checkpoint scheduled, earned next step.
4. **Decision Centre** -- Show the case as a Living Case. Point to cognitive state, evidence tier, governed memory with provenance.
5. **Return Brief** -- "You committed to X. You haven't verified. Here is the accumulating cost." Show checkpoint response mechanism.
6. **ER Result** (pre-loaded example) -- Financial exposure, contagion map, board snapshot, boardroom qualification.
7. **Strategy Room** -- Show the gate refusing entry for weak evidence. Then show an active session with avoidance detection.
8. **Oversight Command** -- Show cancellation loss. "If you leave, you lose N cycles, N checkpoints, N dossiers."
9. **Evidence Standards** -- "We publish our verification methodology before we publish outcomes."

**Drop Counsel Room from the demo sequence.** It is a supporting surface, not a sales weapon. Show it only if the operator asks about human escalation.

**Drop Proof Pack from the demo sequence** until P0.3 is completed. Currently a dead-end.

---

## BUILD GATES PASSED

| Gate | Status |
|------|--------|
| `npx tsc --noEmit` | PASS |
| `npx next build` | PASS (355/355 static pages) |
| `public-dto-guard.mjs` | PASS |
| `intelligence-boundary-guard.mjs` | PASS |
| `public-copy-guard.mjs` | PASS (1035 files, 0 violations) |
| `evidence-posture-guard.mjs` | PASS (2623 files, 0 violations) |
| `earned-progression-guard.mjs` | PASS (1035 files, 0 violations) |
