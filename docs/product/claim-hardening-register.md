# Claim Hardening Register

**Date:** 8 May 2026  
**Doctrine:** Do not dilute the claim. Build the evidence, enforcement, and delivery layer until the claim is justified.

---

## Classification Categories

| Category | Meaning | Action |
|----------|---------|--------|
| **TRUE_NOW** | Already defensible in product and UX | Keep and sharpen |
| **TRUE_BUT_HIDDEN** | System does it, UX does not show it well | Surface it properly |
| **NOT_TRUE_YET_BUT_STRATEGIC** | Required for market dominance | Build toward it |
| **WRONG_OR_DISTRACTING** | Not core, not worth building | Suppress or retire |

---

## Claim 1: Decision Infrastructure

**Claim:** "Abraham of London is Decision Authority Infrastructure."

**Current state:** The system diagnoses decisions, scores conditions, detects contradictions, and produces governed synthesis. This is real. The Fast Diagnostic, Purpose Alignment, Constitutional, and Executive Reporting surfaces all deliver on this claim.

**Classification: `TRUE_NOW`**

**What's needed to sharpen:**
- The term "infrastructure" implies persistence, memory, and repeatability — which the evidence spine now delivers
- The Strategy Room execution layer makes this real — decisions are not just diagnosed but tracked
- **Action:** Keep current language. Ensure every surface reinforces "this is infrastructure, not advice."

---

## Claim 2: Institutional Intelligence

**Claim:** "The platform accumulates institutional intelligence across sessions, users, and cycles."

**Current state:** The evidence spine persists every diagnostic stage to the DiagnosticJourney. The governed memory system renders carried-forward evidence with source labels and dates. Pattern recurrence detection exists. Cross-cycle comparison exists in the Oversight Brief.

**Classification: `TRUE_NOW`** (with gaps)

**Gaps to close:**
1. **Cross-session pattern aggregation** — Pattern recurrence works per-case but there's no aggregate view across all cases for a user/organisation
2. **Institutional memory UI** — There's no "institutional memory" page that shows what the system has learned over time
3. **Trend visualisation** — The Decision Memory trend is computed but only shown inline in Fast Diagnostic results

**Hardening plan:**
- [ ] Build `/intelligence/memory` page showing aggregated patterns across all user sessions
- [ ] Add trend visualisation (coherence band over time, contradiction frequency, escalation trajectory)
- [ ] Surface pattern recurrence in Decision Centre case cards
- [ ] Add "what the system has learned about this organisation" block to Executive Reporting

---

## Claim 3: Persistent Executive Memory

**Claim:** "The system remembers every decision, every contradiction, every consequence."

**Current state:** Evidence is persisted to DiagnosticJourney. Governed memory items are rendered with source labels and dates across ER, SR, Return Brief, Decision Centre, and Oversight Brief. Financial exposure and costOfInaction projections are persisted.

**Classification: `TRUE_NOW`**

**What's needed to sharpen:**
- Memory is persistent but there's no "full memory timeline" view
- **Action:** Add a `/memory` or `/case/[id]/timeline` page that shows every evidence node, decision object, and stage transition in chronological order

---

## Claim 4: Cost of Inaction

**Claim:** "The system prices the cost of not deciding."

**Current state:** Fast Diagnostic computes costOfInaction with horizon projections. Financial exposure is persisted. Return Brief shows a running cost clock. Decision Centre shows cost per case. Oversight Brief aggregates cost across cases.

**Classification: `TRUE_NOW`**

**What's needed to sharpen:**
- The cost clock in Return Brief and Decision Centre is based on user-provided estimates, not verified financial data
- The Fast Diagnostic costOfInaction is qualitative narrative, not numeric
- **Action:** Add a "cost basis" input to the intake flow so users can provide a verified monthly/daily cost. Label clearly: "estimated from your inputs — not independently verified."

---

## Claim 5: Pattern Recurrence

**Claim:** "The system detects when patterns repeat."

**Current state:** `detectPatternRecurrenceV0()` exists and is used in Return Brief generation. The Oversight Brief shows pattern recurrence status. The Decision Centre builds pattern recurrence memory.

**Classification: `TRUE_NOW`**

**What's needed to sharpen:**
- Pattern recurrence is V0 — it checks for similar contradiction/decision text across cases
- No cross-organisation pattern detection
- No pattern frequency visualisation
- **Action:** Add pattern recurrence display to Decision Centre case cards. Build a pattern frequency dashboard.

---

## Claim 6: Verified Outcome Movement

**Claim:** "The system verifies whether outcomes improve or deteriorate."

**Current state:** `buildObservedOutcomeEvidenceFromDB()` exists. Outcome verification records exist in the schema. The Return Brief shows outcome evidence. The ER result page includes outcome verification.

**Classification: `NOT_TRUE_YET_BUT_STRATEGIC`**

**Gaps:**
1. Outcome verification requires follow-up data that most users never provide
2. The verification loop (diagnose → act → verify → learn) is not closed in the UX
3. No automated outcome data collection

**Hardening plan:**
- [ ] Build an outcome check-in flow (email or in-app) that prompts users at 14/30/60/90 day intervals
- [ ] Add a "verified outcome" badge to cases that have completed the verification loop
- [ ] Surface outcome improvement/deterioration trends in Decision Centre and Oversight Brief
- [ ] **Acceptance test:** A user can see "Your last 3 decisions improved by X%" with a clear evidence trail

---

## Claim 7: Boardroom-Grade Decision Dossier

**Claim:** "The system produces boardroom-grade decision dossiers."

**Current state:** Boardroom qualification logic exists. Dossier generation exists. The ER result page renders dossiers in an expandable section. PDF export endpoint exists.

**Classification: `NOT_TRUE_YET_BUT_STRATEGIC`**

**Gaps:**
1. No standalone boardroom page — the dossier is embedded in the ER result
2. PDF export is an API call with no clean download flow
3. No slide deck format
4. No boardroom archive
5. No "send to board" workflow

**Hardening plan:**
- [ ] Build `/boardroom/[sessionId]` standalone page with clean, print-optimised layout
- [ ] Add one-click PDF download with branded template
- [ ] Add slide deck export (PPTX or PDF slide format)
- [ ] Build boardroom archive (`/boardroom/archive`) showing all generated dossiers
- [ ] Add "deliver to board" workflow with email + access token
- [ ] **Acceptance test:** A founder can generate a boardroom dossier, download it as PDF, and send it to their board in under 3 minutes

---

## Claim 8: Retainer-Grade Oversight

**Claim:** "The platform provides retainer-grade oversight for ongoing decision governance."

**Current state:** Retainer intake page exists. Oversight Brief composer exists. Oversight Brief UI renders cycle data. Retainer qualification logic exists.

**Classification: `NOT_TRUE_YET_BUT_STRATEGIC`**

**Gaps:**
1. No retainer dashboard showing active retainers, next cycle dates, billing status
2. No automated cadence enforcement — cycles are manually triggered
3. No client-safe delivery mechanism for Oversight Briefs
4. No retainer renewal/upgrade flow

**Hardening plan:**
- [ ] Build `/retainer/dashboard` showing active retainers, next review date, cycle history
- [ ] Add automated cycle scheduling (cron or time-based trigger)
- [ ] Add email delivery of Oversight Briefs to retainer clients
- [ ] Build retainer renewal flow with Stripe integration
- [ ] **Acceptance test:** A retainer client receives an automated Oversight Brief every 30 days without manual intervention

---

## Claim 9: Governed Counsel Escalation

**Claim:** "The system governs counsel-level escalation when thresholds are crossed."

**Current state:** Counsel review is triggered as a signal type in the Oversight Brief. No dedicated counsel review surface exists.

**Classification: `NOT_TRUE_YET_BUT_STRATEGIC`**

**Hardening plan:**
- [ ] Build `/counsel/review/[caseId]` page showing escalation trigger, evidence summary, and recommended action
- [ ] Add counsel review workflow (accept/reject/escalate further)
- [ ] Add counsel review history to case timeline
- [ ] Add notification to counsel when escalation is triggered
- [ ] **Acceptance test:** A counsel trigger in Oversight Brief generates a reviewable counsel case with complete evidence trail

---

## Claim 10: Control Room / Institutional Command

**Claim:** "The Control Room provides institutional command over organisational decision health."

**Current state:** Control Room loader exists. PA evidence is loaded. No visible user-facing surface.

**Classification: `NOT_TRUE_YET_BUT_STRATEGIC`**

**Hardening plan:**
- [ ] Build `/control-room` page showing organisational decision health overview
- [ ] Show active campaigns, evidence tier, aggregation safety, divergence signals
- [ ] Show PA evidence aggregate (profile, weakest domain, contradiction count)
- [ ] Add drill-down to specific campaigns and cases
- [ ] **Acceptance test:** An organisation admin can see their organisation's decision health at a glance and drill into specific issues

---

## Claim 11: Irreversibility / Harder-to-Reverse Decisions

**Claim:** "The system tracks when decisions become harder to reverse."

**Current state:** Irreversibility index exists in the Oversight Brief composer. It's computed from cost signals, commitment breaches, and deterioration signals.

**Classification: `TRUE_BUT_HIDDEN`**

**What's needed to surface:**
- Irreversibility is only shown in the Oversight Brief (retainer-only surface)
- Should be surfaced in Decision Centre case cards and Executive Reporting
- **Action:** Add irreversibility score to Decision Centre case cards. Add irreversibility trend to Executive Reporting.

---

## Claim 12: Strategic Option Decay

**Claim:** "The system tracks when strategic options are closing."

**Current state:** Strategic options exist in the Oversight Brief composer. They're derived from cases with overdue commitments and accumulating cost.

**Classification: `TRUE_BUT_HIDDEN`**

**What's needed to surface:**
- Strategic option decay is only shown in the Oversight Brief
- Should be surfaced in Decision Centre and Strategy Room
- **Action:** Add "options closing" alert to Decision Centre. Add option decay timeline to Strategy Room session.

---

## Claim 13: Cancellation-Loss Visibility

**Claim:** "The system shows what would be lost if oversight is cancelled."

**Current state:** Cancellation loss section exists in the Oversight Brief composer and UI. It shows what visibility would be lost without continued oversight.

**Classification: `TRUE_NOW`** (retainer-only)

**What's needed to sharpen:**
- Currently only visible in Oversight Brief
- **Action:** Add cancellation-loss summary to retainer dashboard and renewal flow

---

## Claim 14: Cross-Cycle Learning

**Claim:** "The system learns across oversight cycles."

**Current state:** Cycle comparison exists in the Oversight Brief. Previous cycle data is loaded and compared. Pattern recurrence is detected across cycles.

**Classification: `TRUE_NOW`** (retainer-only)

**What's needed to sharpen:**
- Cross-cycle learning is only visible in Oversight Brief
- **Action:** Add cycle-over-cycle trend visualisation to retainer dashboard

---

## Claim 15: Organisation Divergence Memory

**Claim:** "The system remembers how organisations diverge across perception, priority, and execution."

**Current state:** Organisation divergence summary exists in the Control Room loader. Divergence signals are computed from multi-user campaign data.

**Classification: `NOT_TRUE_YET_BUT_STRATEGIC`**

**Hardening plan:**
- [ ] Surface organisation divergence in Executive Reporting when multi-user data exists
- [ ] Add divergence timeline showing how gaps have changed over time
- [ ] Build divergence alerting when gaps widen beyond threshold
- [ ] **Acceptance test:** An organisation admin can see how leadership-team perception gaps have changed over the last 3 campaign cycles

---

## Summary

| Claim | Classification | Priority |
|-------|---------------|----------|
| Decision Infrastructure | `TRUE_NOW` | Maintain |
| Institutional Intelligence | `TRUE_NOW` | Surface institutional memory UI |
| Persistent Executive Memory | `TRUE_NOW` | Add memory timeline view |
| Cost of Inaction | `TRUE_NOW` | Add cost basis input |
| Pattern Recurrence | `TRUE_NOW` | Add pattern frequency dashboard |
| Verified Outcome Movement | `NOT_TRUE_YET_BUT_STRATEGIC` | **Build outcome check-in flow** |
| Boardroom-Grade Decision Dossier | `NOT_TRUE_YET_BUT_STRATEGIC` | **Build standalone boardroom page** |
| Retainer-Grade Oversight | `NOT_TRUE_YET_BUT_STRATEGIC` | **Build retainer dashboard + automation** |
| Governed Counsel Escalation | `NOT_TRUE_YET_BUT_STRATEGIC` | **Build counsel review surface** |
| Control Room / Institutional Command | `NOT_TRUE_YET_BUT_STRATEGIC` | **Build Control Room UI** |
| Irreversibility | `TRUE_BUT_HIDDEN` | Surface in Decision Centre |
| Strategic Option Decay | `TRUE_BUT_HIDDEN` | Surface in Decision Centre |
| Cancellation-Loss Visibility | `TRUE_NOW` | Surface in retainer dashboard |
| Cross-Cycle Learning | `TRUE_NOW` | Add cycle trend visualisation |
| Organisation Divergence Memory | `NOT_TRUE_YET_BUT_STRATEGIC` | Surface in Executive Reporting |
