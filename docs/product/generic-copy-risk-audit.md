# Generic Copy Risk Audit

**Date:** 2026-05-07
**Purpose:** Identify user-facing copy that could apply to any user and flag for bespoke replacement.

---

## Flagged generic phrases

| File | Current Phrase | Why Generic | Replacement Pattern | Data Source |
|------|---------------|-------------|-------------------|-------------|
| `pages/diagnostics/fast.tsx` (commitment gate) | "This only works if the decision is real." | Applies to any user. No reference to their specific decision. | "This only works if the decision you described — '{answers.decision}' — is real and ready to move." | `answers.decision` |
| `pages/diagnostics/fast.tsx` (result CTA) | "Your evidence justifies a governed brief." | Generic encouragement. | Already improved — previously said "This is now structural, not situational." The dynamic `an?.cta` provides bespoke CTA when synthesis succeeds. | `anchorNarrative.cta` |
| `pages/diagnostics/purpose-alignment.tsx` (post-result) | "This analysis reads you personally." | Could apply to any user. | "This analysis reads the tension between your stated direction and the competing obligation you named." | Context answers (decision, competing priority) |
| `components/diagnostics/ExecutiveReportingPaywall.tsx` (micro-commitment) | "Are you prepared to act on what this will show?" | Generic — no reference to what "this" contains for this user. | "Are you prepared to act on what the evidence about '{decisionText}' will show?" | Decision text from spine/sessionStorage |
| `pages/diagnostics/constitutional-diagnostic.tsx` (hero) | "Tests whether the decision problem is structural" | Generic framing. | Already acceptable — the hero describes the instrument, not the user's result. Bespoke output comes from results, not entry. | N/A |
| `app/briefing/return/[sessionId]/page.tsx` (no-brief state) | "No return brief is warranted at this time." | Generic. | "No return brief is warranted for session {sessionId} at this time. Insufficient time has passed since the last intervention." | sessionId, timing |

---

## Surfaces with NO generic risk

| Surface | Reason |
|---------|--------|
| Fast Diagnostic result | Every section anchored to user's CaseObject and GovernedSynthesis. Quotes user language. |
| Purpose Alignment result | Pattern derived from user's dual-axis answers with cited evidence. |
| Constitutional Diagnostic result | Route, posture, readiness all derived from user's 10 answers. |
| Return Brief | Quotes prior commitment, names contradiction, shows trajectory, uses ContinuityStatement. |

---

## Surfaces with acceptable generic entry copy

| Surface | Why acceptable |
|---------|---------------|
| Homepage | Entry surface — describes the system, not the user's case. Bespoke output comes from diagnostics. |
| Diagnostics hub | Describes what each entry point tests. Bespoke output comes from assessment results. |
| Evidence pages | Static proof assets — clearly labelled. |

---

## Priority replacements

1. **ExecutiveReportingPaywall micro-commitment** — highest impact because it's the last gate before payment. Should reference the user's actual decision.
2. **Fast Diagnostic commitment gate** — should reference their decision statement.
3. **Purpose Alignment post-result bridge** — should reference their specific tension.

These are copy-level changes that can be made when the relevant data is already available in the component's state. No new data fetching required.
