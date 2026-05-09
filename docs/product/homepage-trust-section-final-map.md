# Homepage Trust Section Final Map

**Date:** 2026-05-09
**File:** `components/homepage/CategoryFrontDoor.tsx` — Section 7

---

## Section Architecture

### Header
- **Eyebrow:** "How trust is protected"
- **Lead-in:** "The system carries evidence forward instead of starting each surface from zero. It distinguishes what was stated, what was inferred, what was estimated, and what was later confirmed."

### Trust Cards (8)

| Card | Title | Content | Answers |
|------|-------|---------|---------|
| 1 | Source-labelled evidence | Every piece of evidence is labelled by source, date, and how it was captured. User-reported, system-inferred, estimated, and operator-reviewed evidence are never conflated. | "Why should I trust it?" |
| 2 | No fabricated verification | The system does not call an outcome verified unless evidence has been provided. Self-reported claims are never represented as independently confirmed. | "What does it not pretend to know?" |
| 3 | Refusal authority | The system can refuse escalation, restrict progression, and withhold output when the evidence does not support it. No sale if the case is not ready. | "What does this system do?" |
| 4 | Commitment memory | The system remembers what was committed and checks whether action was later recorded. Checkpoints are scheduled, not optional. | "What happens after I give it evidence?" |
| 5 | Evidence suppression | Unsafe, insufficient, or private evidence is suppressed rather than displayed. The system does not invent certainty where none exists. | "What does it not pretend to know?" |
| 6 | Protected internals | Internal scoring, routing logic, and proprietary operating mechanics are never exposed. The user sees what the system found, not how it found it. | "Why should I trust it?" |
| 7 | Challenge route | Every governed output can be challenged. Challenges enter the case record and can change the reading, the route, or the required action. | "What does this system do?" |
| 8 | Earned progression | Progression is earned by evidence, not pushed by the site. No product appears unless the evidence threshold has been met. | "What happens after I give it evidence?" |

### Footer
- Link: "View evidence standards →" → `/evidence/standards`

---

## IP Safety Check

| Term | Present? | Status |
|------|----------|--------|
| algorithm | NO | CLEAN |
| kernel | NO | CLEAN |
| graph mechanics | NO | CLEAN |
| proprietary model | NO | CLEAN |
| AI determined | NO | CLEAN |
| machine learning | NO | CLEAN |
| advisory | NO | CLEAN |
| consulting | NO | CLEAN |
| coaching | NO | CLEAN |
| unlock | NO | CLEAN |
| upgrade | NO | CLEAN |
| scoring | YES — "Internal scoring...never exposed" | SAFE (explicitly withholding) |
| routing logic | YES — "routing logic...never exposed" | SAFE (explicitly withholding) |

---

## Acceptance Check

| Question | Answered? | Where |
|----------|-----------|-------|
| "What does this system do?" | YES | Cards 3, 7 |
| "Why should I trust it?" | YES | Cards 1, 6 |
| "What does it not pretend to know?" | YES | Cards 2, 5 |
| "What happens after I give it evidence?" | YES | Cards 4, 8 |
