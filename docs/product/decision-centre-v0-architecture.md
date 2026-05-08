# Decision Centre v0 Architecture

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London
**Route:** `/decision-centre`
**API:** `/api/decision-centre/cases`

---

## Purpose

The Decision Centre replaces the diagnostic record archive with a governed operating console for individual paying users.

The core object is the **Living Case**, not the diagnostic record.

The user sees governed state, not generic activity.

---

## Recommended Route

**`/decision-centre`** — not `/dashboard`

"Dashboard" implies passive monitoring. "Decision Centre" implies governed operating authority.

---

## Sections

### 1. Active Living Cases
Show all Living Cases for the authenticated user, ordered by last activity.

Each case card shows:
- Decision statement (from canonical decision object)
- Cognitive state (Signal Discovery → Structural Recognition → Consequence → Intervention → Execution → Intelligence)
- Evidence tier badge
- Completed stage checklist (bespoke contributions)
- Admission status per deep surface (ER: Admitted/Restricted, SR: Admitted/Restricted)
- Retainer-readiness signal (Low / Medium / High) with evidence-based reason
- Latest directive
- Unresolved contradictions count
- Last updated

### 2. Admission & Repair
For each case, show current admissibility:
- Executive Reporting: ADMITTED / RESTRICTED / PAY_REQUIRED
- Strategy Room: ADMITTED / RESTRICTED / PAY_REQUIRED
If restricted: show missing evidence and repair actions inline.

### 3. Paid Products
Show owned products and eligible products:
- Owned: Executive Reporting (purchased), Strategy Room (purchased), etc.
- Eligible: products the user's evidence tier qualifies for
- Restricted: products where admission fails — with repair path

### 4. Return Briefs & Outcomes
List available Return Briefs with trajectory status:
- Session reference
- Trajectory: DETERIORATING / FRAGILE / STABLE
- Outcome classification if verified
- Link to brief

### 5. Decision Credit
- Current score
- Trend (30-day)
- Fulfilled / breached / disputed counts
- No gamification — institutional credit report tone

### 6. Next Required Action
The single most important thing the user should do next, derived from:
- Highest-severity unresolved contradiction
- Pending outcome verification
- Incomplete stage in active case
- Repair action for restricted surface

### 7. Retainer Readiness

Decision Centre may show restrained retainer oversight potential where evidence already supports it.

Allowed reasons:

- repeated pattern
- boardroom threshold
- counsel trigger
- unresolved execution

Not allowed:

- generic subscription language
- generic “upgrade” language
- price-led prompts

---

## API Shape

```
GET /api/decision-centre/cases
Authorization: Bearer (session token)

Response:
{
  ok: true,
  cases: DecisionCentreCase[],
  commercial: {
    ownedProducts: string[],
    eligibleProducts: string[],
    restrictedProducts: string[]
  },
  credit: {
    score: number,
    trend: string,
    fulfilled: number,
    breached: number
  }
}
```

---

## Data Source

Server-authoritative. Uses `deriveLivingCase()` from `lib/product/living-case-store.ts`.

No sessionStorage. No client-derived state.

The API calls `getLatestLivingCaseForActor(email)` and enriches with entitlement lookups from `ClientEntitlement` and admission evaluations from the admission modules.

Retainer readiness is additive and evidence-based. It must not create a commercial bypass around admission or privacy rules.
