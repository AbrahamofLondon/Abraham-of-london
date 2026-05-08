# Question Layer — Protected Set (No-Touch)

> Established: 2026-05-08
> Status: These question sets are confirmed strong, evidence-producing, and category-defining. They must not be edited during any correction pass.

---

## 1. Fast Diagnostic — All 4 Questions

**File:** `pages/diagnostics/fast.tsx` (lines 42–70, 388–390)

| Question | Evidence Produced |
|----------|------------------|
| "What decision has been sitting unresolved longer than it should?" | Decision anchor, case object root |
| "Who can actually make this decision binding?" | Authority signal, ownership mapping |
| "What becomes more expensive if this stays unresolved?" | Cost of inaction, consequence timeline |
| "If this identifies the real blocker, will you act on it within 48 hours?" | Commitment signal, synthesis gate |

**Why it stays:** Strongest question set in the product. Perfect sequencing. Commitment gate before results is unique in market.
**No-touch instruction:** Do not modify question text, placeholder text, microcopy, live hints, or challenge cards.

---

## 2. Fast Diagnostic Live Hints & Challenge Cards

**File:** `pages/diagnostics/fast.tsx` (inline pattern matching, challenge API)

**Why it stays:** The live hint system (pattern-matched feedback on input content) is the primary bespoke mechanism in the Fast Diagnostic. Removing or weakening hints degrades evidence quality.
**No-touch instruction:** Do not modify hint trigger patterns, hint text, or challenge severity levels.

---

## 3. Adaptive Question Bank — All 28 Templates

**File:** `lib/decision/adaptive-question-engine.ts`

**Why it stays:** Highest evidence yield in the product (avg 34.2/55). Fully bespoke. Engine-selected based on spine state, C3 gaps, contradictions, and memory signals.
**No-touch instruction:** Do not modify any template text. Do not remove templates. Adding new templates is permitted but requires doctrine compliance check.

---

## 4. Executive Reporting — All 4 Core Questions

**File:** `pages/diagnostics/executive-reporting/run.tsx` (lines 1909–1944)

| Question | Field |
|----------|-------|
| "What decision is actually on the table?" | `decisionQuestion` |
| "What becomes more expensive if this is delayed?" | `whatHappensIfNothingChanges` |
| "What is the real constraint?" | `currentConstraint` |
| "What has already been tried, and what specifically went wrong?" | `priorAttemptOutcome` |

**Why it stays:** Each question has a direct downstream consumer. Framing text ("Not the topic. The decision." / "Not symptoms." / "If nothing: say nothing.") is premium.
**No-touch instruction:** Do not modify question labels, placeholder text, or field names. Adding a new question after Q4 is permitted (see verification anchor).

---

## 5. Return Brief — All 5 Challenge Prompts

**File:** `lib/server/strategy-room/return-brief.server.ts` (lines 312–332)
**File:** `app/briefing/return/[sessionId]/page.tsx`

| Trigger | Prompt |
|---------|--------|
| no_activity_after_commitment | "You committed to act. No action has been recorded..." |
| deteriorating_trajectory | "The condition is worsening..." |
| fragile_trajectory | "The decision remains open..." |
| recurrence_detected | "This pattern has returned..." |
| contradiction_persistence | "This is no longer a single decision issue..." |

**Why it stays:** The emotional peak of the product. Uses the user's own commitments against them. Category-defining.
**No-touch instruction:** Do not modify trigger conditions, prompt text, or display logic.

---

## 6. Commitment Gate (Fast Diagnostic Q4)

**File:** `pages/diagnostics/fast.tsx` (line 388–390)

**Why it stays:** No competitor demands commitment before showing results. This is the single most differentiating UX moment.
**No-touch instruction:** Do not modify the binary choice, the text, or the downstream `committed` flag.

---

## 7. Admission Hard Gates

**File:** `lib/strategy-room/enrol-core.ts` (lines 208–233)

| Gate | Behaviour |
|------|-----------|
| `hasAuthority === "No"` | Automatic decline |
| `willingAccountability === "No"` | Automatic decline |
| `readyForUnpleasantDecision === "No"` | Decline |

**Why it stays:** The product refuses access if the user won't commit. This is the opposite of every SaaS product and defines the category.
**No-touch instruction:** Do not weaken or remove any hard gate. Do not add soft fallbacks.

---

## 8. Strategy Room — Problem Statement & Authority Scope

**File:** `components/strategy-room/Form.tsx` (lines 653–656, 685–692)

| Field | Text |
|-------|------|
| Problem Statement | "State the actual structural problem requiring strategic intervention. Not symptoms — the condition." |
| Authority Scope | DIRECT (90pts) / PROXY (65pts) / ADVISORY (40pts) / UNCLEAR (25pts) |

**Why it stays:** Problem Statement opens the Strategy Room with maximum seriousness. Authority Scope is the strongest authority classification in the product.
**No-touch instruction:** Do not modify question text, placeholder text, help text, or scoring weights.
