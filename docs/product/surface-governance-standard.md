# Surface Governance Standard

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London
**Status:** Canonical — all surfaces must comply

---

## 1. Disclosure Levels

### PUBLIC
Surfaces visible without authentication.
**Purpose:** Establish authority and category position. Generate leads. Never explain how the system works internally.

### AUTHENTICATED
Surfaces behind login.
**Purpose:** Deliver diagnostic results, case management, assessment outcomes. May reveal findings, evidence tiers, and admission status.

### PAID
Surfaces behind payment gate.
**Purpose:** Deliver premium output. May reveal deeper evidence, contradiction analysis, consequence pricing. Must feel earned.

### RETAINER_CLIENT
Surfaces for monthly retainer clients.
**Purpose:** Deliver oversight briefs, cost-of-inaction tracking, pattern recurrence, commitment verification. May reveal cycle-to-cycle comparison, organisation divergence, value-at-risk.

### SPONSOR_SAFE
Surfaces shareable with organisational sponsors who commissioned the work.
**Purpose:** Show governed findings without exposing individual respondent data, raw contradictions, or operator decisions.

### BOARD_SAFE
Surfaces shareable at board level.
**Purpose:** Show institutional risk, unresolved exposure, governance gaps. Stripped of individual attribution, anonymous detail, and operational mechanics.

### OPERATOR
Surfaces for Abraham of London operators managing client accounts.
**Purpose:** Full operational visibility. May reveal machinery, processing status, delivery state, operator notes.

### ADMIN
Surfaces for system administrators.
**Purpose:** System health, access management, audit logs, processing queues. May reveal architecture.

### INTERNAL_ONLY
Surfaces never shown to any external party.
**Purpose:** Development tools, debugging, infrastructure diagnostics.

---

## 2. Language Rules

### What can be said publicly
- The system tests decisions
- Contradiction is detected
- Consequences are priced
- Execution is verified
- The system can refuse to proceed
- Evidence quality is assessed
- Decision memory persists
- Outcome tracking occurs
- Governed review is available
- Admission is earned, not purchased

### What can be said after authentication
- Evidence tier labels (single_source, multi_source, outcome_verified)
- Admission status with reasons
- Signal continuity labels (NEW, REPEATED, WORSENING, IMPROVING, RESOLVED, VERIFIED_PATTERN)
- Structured action details with evidence basis
- Cost-of-inaction with specific amounts
- Decision credit score and trend

### What can be shown only to operators
- Internal module names (C3 fidelity scorer, synthesis engine, arbiter tournament)
- Scoring algorithm thresholds
- Processing queue status
- Delivery state and operator notes
- Raw payload data
- System health metrics

### What must NEVER be exposed
- C3 fidelity engine / C3 score — on any non-operator surface
- Contradiction kernel — on any non-operator surface
- Arbiter tournament — on any non-operator surface
- Action simulation engine — on any non-operator surface
- Synthesis engine / governed synthesis — on any non-operator surface
- Signal continuity algorithm (the algorithm, not the labels) — on any non-operator surface
- Pattern recurrence algorithm details — on any non-operator surface
- Anchor narrative engine — on any non-operator surface
- Micro-tension validation — on any non-operator surface
- Constitutional orchestration engine — on any non-operator surface
- Intelligence spine (as a named data model) — on any non-operator surface
- Any named internal function or module — on any public surface
- Raw API endpoint names — on any non-admin surface
- Processing pipeline architecture — on any non-admin surface
- Dead letter queue, job queue, retention policy — on any non-admin surface

---

## 3. Evidence Rules

### No unsupported claim
Every claim on a public surface must be either:
- Demonstrable through the product itself (e.g., "the system can refuse" → shown in refusal demo)
- Backed by a verifiable credential (e.g., ISO 27001 → certificate referenced)
- Scoped with honest limitation (e.g., "based on anonymised cases" not "proven")

### No fake proof
- Canned outcomes must be classified as DEMONSTRATION_FALLBACK with visible label
- Static proof assets must be labelled "Static proof asset"
- Mock data in admin surfaces must not pretend to be live operational data

### No unlabelled fallback
- If a surface falls back to demonstration data, the user must know
- `data-proof-status` attribute required on all proof blocks
- "Demonstration patterns" label when in fallback mode

### No public technical internals
- No engine names on public surfaces
- No scoring thresholds on public surfaces
- No algorithm descriptions on public surfaces
- No internal function names on public surfaces

---

## 4. UX Rules

### No generic dashboards
Every dashboard surface must show user-specific or case-specific data. If no data exists, show an honest empty state, not generic widgets.

### No empty widgets
If a metric has no data, hide the widget or show "Insufficient data" — never show zero or placeholder.

### No hidden primary action
Every surface must have a clear primary action visible without scrolling on desktop.

### No mobile collision
- No fixed-width layouts wider than 375px
- All grids must stack vertically on mobile
- No horizontal scrolling required for core content
- Touch targets minimum 44x44px

### No CTA without admissibility logic
If a call-to-action leads to a gated surface, the CTA must communicate the gate:
- "Begin assessment" (not "Unlock")
- "Request access" (not "Upgrade")
- "View your brief" (not "Subscribe")

---

## 5. Commercial Rules

### Admission before payment
No payment surface without evidence validation. The system must confirm the user qualifies before accepting money.

### Restriction before upsell
If a user doesn't qualify, show restriction with repair path — not an upsell. Progression is earned.

### Evidence before escalation
No escalation to a higher product tier without evidence that the current tier has been meaningfully used.

### Counsel as governed escalation, not sales
Counsel recommendations must be triggered by case evidence, not by engagement metrics or time-based upsell logic.

### Retainer as oversight, not subscription
Retainer language must convey:
- Ongoing governed intelligence
- Accumulated decision memory
- Value-at-risk if terminated
Never:
- Monthly access
- Subscription benefits
- Membership perks

---

## 6. IP Protection Rules

### Expose findings, not mechanisms
Users see: "Three contradictions detected between stated authority and observed behaviour."
Users never see: "C3 fidelity scorer identified contradiction kernel at threshold 0.73."

### Expose consequences, not algorithms
Users see: "Delay is accumulating £4,200/day in estimated exposure."
Users never see: "Cost clock algorithm derives from cost_basis × days_elapsed × acceleration_factor."

### Expose governance, not code architecture
Users see: "This decision is now under governance."
Users never see: "Constitutional orchestration engine invoked via runConstitutionalOrchestration()."

### Expose proof classification, not implementation internals
Users see: "Evidence strength: multi-source, outcome-verified."
Users never see: "evidence_graph.nodes.filter(n => n.kind === 'contradiction')."

---

## Enforcement

- Every new surface must be classified before deployment
- Every surface classification must be documented in `docs/product/controlled-surface-audit.md`
- IP terms listed in section 2 must be grep-checked before any public deployment
- Unguarded admin routes must be caught by pre-deployment review
- Mock data must never contain real scoring thresholds or domain names that reveal methodology
- All public surfaces must pass mobile audit at 375px width before launch
