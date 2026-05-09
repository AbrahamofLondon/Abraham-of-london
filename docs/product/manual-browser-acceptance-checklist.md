# Manual Browser Acceptance Checklist

**Date:** 2026-05-09
**Status:** BROWSER_ACCEPTANCE_PENDING
**Note:** This checklist was NOT verified by an agent. It must be walked by a human in a browser.

---

## Instructions

1. Run `npm run dev`
2. Open each URL in a browser
3. For each journey, verify every checkbox
4. Note any defects in the "Defect notes" column
5. Mark PASS or FAIL per journey

---

## Journey 1: Homepage → Fast Diagnostic

**URL:** `/` → `/diagnostics/fast`

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| Homepage hero says "Decision Infrastructure by Abraham of London" | Yes | — | [ ] | |
| Primary CTA says "Test a decision" | Yes | `homepage_cta_clicked` | [ ] | |
| No counsel/paid bypass visible in hero | Yes | — | [ ] | |
| Navbar CTA says "Test a Decision" (not "Counsel") | Yes | — | [ ] | |
| Footer CTA says "Test a Decision" (not "Enter Strategy Room") | Yes | — | [ ] | |
| Trust section shows 8 cards under "How trust is protected" | Yes | — | [ ] | |
| Fast Diagnostic loads at `/diagnostics/fast` | Yes | `fast_started` | [ ] | |
| 3-question flow completes | Yes | — | [ ] | |
| Result shows finding, contradiction, required move | Yes | `fast_completed` | [ ] | |
| Checkpoint is created | Yes | `checkpoint_created` | [ ] | |
| Earned next step card appears | Yes | `earned_step_shown` | [ ] | |
| No "Upgrade"/"Unlock" language on result | Yes | — | [ ] | |

---

## Journey 2: Fast Diagnostic → Decision Centre

**URL:** `/decision-centre`

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| Decision Centre loads for authenticated user | Yes | `decision_centre_opened` | [ ] | |
| Checkpoint appears in checkpoint section | Yes | — | [ ] | |
| Due/responded state renders correctly | Yes | — | [ ] | |
| Decision velocity appears only with data | Yes | — | [ ] | |
| Empty state says "No active cases under governance" | Yes | — | [ ] | |
| Cost of inaction labelled "estimated" | Yes | — | [ ] | |

---

## Journey 3: Fast Diagnostic → Return Brief

**URL:** `/briefing/return/[sessionId]`

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| Return Brief loads the correct case | Yes | `return_brief_opened` | [ ] | |
| "You are not starting again. The system remembers this case." visible | Yes | — | [ ] | |
| Consequence evidence says "not independently verified" | Yes | — | [ ] | |
| Checkpoint response form offers 5 options | Yes | — | [ ] | |
| Response posts successfully | Yes | `return_brief_response_submitted` | [ ] | |
| No false "recorded" message if API rejects | Yes | — | [ ] | |

---

## Journey 4: Purpose Alignment / Personal Decision Audit

**URL:** `/diagnostics/purpose-alignment` (or equivalent)

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| No personality-test framing | Yes | `purpose_alignment_started` | [ ] | |
| Competing obligation and consequence captured | Yes | — | [ ] | |
| Result shows contradiction, correction, checkpoint | Yes | `purpose_alignment_completed` | [ ] | |
| Earned progression does not feel like upsell | Yes | `earned_step_shown` | [ ] | |

---

## Journey 5: Executive Reporting

**URL:** `/diagnostics/executive-reporting` → `/diagnostics/executive-reporting/run`

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| Gate says "The evidence suggests a decision structure problem" | Yes | `executive_reporting_gate_viewed` | [ ] | |
| No "AI-accelerated market baseline" anywhere | Yes | — | [ ] | |
| Trust panel visible in "How this was determined" | Yes | — | [ ] | |
| Paywall says "governed priority stack" (not "board-grade clarity") | Yes | — | [ ] | |
| Result page shows ArbiterBadge | Yes | `executive_reporting_started` | [ ] | |
| No duplicate contradiction/intelligence blocks | Yes | — | [ ] | |

---

## Journey 6: Strategy Room Entry + Session

**URL:** `/strategy-room` → `/strategy-room/session/[id]`

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| Entry page renders gate state correctly | Yes | `strategy_room_entered` | [ ] | |
| First required action is obvious | Yes | — | [ ] | |
| No "Private advisory" or "Contact" links | Yes | — | [ ] | |
| Session: checkpoint is durable/reused | Yes | — | [ ] | |
| Session: decision timeline renders real decisions only | Yes | — | [ ] | |
| Session: irreversibility says "estimate, not a verified external fact" | Yes | — | [ ] | |
| Decision recorded successfully | Yes | `strategy_room_decision_recorded` | [ ] | |

---

## Journey 7: Counsel Room

**URL:** `/counsel` → `/counsel/intake` → `/counsel/status`

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| /counsel is evidence-gated (shows "not a starting point" if no evidence) | Yes | `counsel_room_viewed` | [ ] | |
| No generic contact form behaviour | Yes | — | [ ] | |
| Intake asks only what the system cannot know | Yes | `counsel_intake_started` | [ ] | |
| Permission checkbox present | Yes | — | [ ] | |
| Intake submits successfully | Yes | `counsel_intake_submitted` | [ ] | |
| Status page shows real lifecycle state | Yes | — | [ ] | |

---

## Journey 8: Boardroom + Proof Pack

**URL:** `/boardroom/[sessionId]` + `/account/proof-pack`

| Check | Expected | Instrumented Event | Pass/Fail | Defect Notes |
|-------|----------|-------------------|-----------|--------------|
| Boardroom page is gated ("Not qualified yet" if no evidence) | Yes | — | [ ] | |
| PDF/download CTA only appears when qualified | Yes | — | [ ] | |
| Proof Pack loads with four-part provenance chain | Yes | — | [ ] | |
| Proof Pack does not label inferred evidence as verified | Yes | — | [ ] | |
| Proof Pack says "Durable proof, not performance theatre" | Yes | — | [ ] | |

---

## Summary

| Journey | Pass/Fail | Defect Count |
|---------|-----------|-------------|
| 1. Homepage → Fast Diagnostic | [ ] | |
| 2. Fast Diagnostic → Decision Centre | [ ] | |
| 3. Fast Diagnostic → Return Brief | [ ] | |
| 4. Purpose Alignment | [ ] | |
| 5. Executive Reporting | [ ] | |
| 6. Strategy Room | [ ] | |
| 7. Counsel Room | [ ] | |
| 8. Boardroom + Proof Pack | [ ] | |

**Final Verdict:** ________________________
