# Question Layer Surface Verdicts

> Audit date: 2026-05-08

---

## Rebuild Severity Scale

| Code | Meaning |
|------|---------|
| NO_REBUILD | Question set is strong. Minor tuning only. |
| LIGHT_REWRITE | 1–3 questions need rewording. Structure is sound. |
| STRUCTURAL_REWRITE | Multiple questions need replacement. Sequence may need adjustment. |
| SEQUENCE_REBUILD | Questions may be fine but order, timing, or progression needs restructuring. |
| FULL_QUESTION_SET_REBUILD | Entire question set must be replaced. Current set damages product trust. |

---

## 1. FAST DIAGNOSTIC

- **Current question strength:** 9/10
- **Weakest question:** None — all 4 are strong. If forced: Q3 slightly overlaps with Purpose Alignment context Q3.
- **Strongest question:** Q4 (commitment gate) — no competitor demands commitment before showing results.
- **Biggest sequencing flaw:** None.
- **Biggest missing question:** A follow-up after results: "Now that you've seen the blocker, has the decision changed?"
- **Biggest emotional flaw:** None.
- **Biggest evidence flaw:** No verification — "How will you know you acted correctly?"
- **Buyer-facing risk:** None. This surface creates the strongest first impression.
- **Required action:** Protect as-is.
- **Rebuild severity:** NO_REBUILD

---

## 2. PURPOSE ALIGNMENT

- **Current question strength:** 7/10
- **Weakest question:** environment_3 ("media chosen deliberately") — self-help register, zero evidence yield.
- **Strongest question:** identity_1 ("actual job in under ten seconds") — iconic, confrontational, memorable.
- **Biggest sequencing flaw:** 7 weak statements dilute the strong ones in the signal phase. Sawtooth emotional pattern.
- **Biggest missing question:** A commitment question after the signal phase: "What will you do about your weakest domain?"
- **Biggest emotional flaw:** behaviour_2 immediately follows behaviour_1 — creates boredom.
- **Biggest evidence flaw:** 39% of signal statements produce evidence scores ≤ 14/55.
- **Buyer-facing risk:** Users who complete this and encounter weak statements may question whether the system is genuinely sophisticated.
- **Required action:** Remove/rewrite 7 weak statements. Add commitment question. Consider reducing to 12–14 statements (2 per domain).
- **Rebuild severity:** STRUCTURAL_REWRITE

---

## 3. CONSTITUTIONAL DIAGNOSTIC

- **Current question strength:** 8.5/10
- **Weakest question:** q9 ("structural, not motivational, causes") — too hard to self-assess.
- **Strongest question:** q1 ("strategy and resource allocation aligned") — foundational institutional test.
- **Biggest sequencing flaw:** None significant.
- **Biggest missing question:** A direct verification question: "What evidence would you present to a board that this is not just perception?"
- **Biggest emotional flaw:** q5 ("materially intact") is too clinical.
- **Biggest evidence flaw:** No direct cost/consequence question — only q8 addresses stakes.
- **Buyer-facing risk:** Low. This surface feels serious and institutional.
- **Required action:** Rewrite q5 and q9. Consider adding one consequence pricing question.
- **Rebuild severity:** LIGHT_REWRITE

---

## 4. TEAM ASSESSMENT

- **Current question strength:** 7.5/10 (leader), 4/10 (respondent)
- **Weakest question (leader):** "produces visible progress, not just activity" — productivity truism.
- **Weakest question (respondent):** "Direction and priority are clear in day-to-day work" — too compressed.
- **Strongest question:** "surfaces important tensions without avoidance or political calculation" — trust diagnostic.
- **Biggest sequencing flaw:** Respondent assessment is too short (4 questions, 90 seconds). Leader spends 20+ minutes. Asymmetry weakens gap analysis.
- **Biggest missing question:** Post-gap consequence: "If this gap is real, what does your team lose by end of quarter?"
- **Biggest emotional flaw:** Respondent experience creates no discomfort.
- **Biggest evidence flaw:** No consequence pricing in either view.
- **Buyer-facing risk:** Respondents may feel the assessment is a generic survey, not a premium diagnostic.
- **Required action:** Expand respondent view to 8–12 questions matching leader domains. Rewrite 2 leader statements. Add consequence pricing.
- **Rebuild severity:** STRUCTURAL_REWRITE (respondent), LIGHT_REWRITE (leader)

---

## 5. ENTERPRISE ASSESSMENT

- **Current question strength:** 7/10 (leader boolean), 6.5/10 (leader Likert), 2/10 (respondent)
- **Weakest question:** All 5 respondent boolean questions — corporate compliance language.
- **Strongest question:** lco_3 ("holds together even if current leaders leave") — structural, confrontational.
- **Biggest sequencing flaw:** od_2 and od_3 create redundancy in leader boolean set.
- **Biggest missing question:** "What is the one thing this organisation avoids discussing at the leadership table?"
- **Biggest emotional flaw:** Respondent questions feel like an HR compliance form.
- **Biggest evidence flaw:** Respondent questions produce no contradiction, authority, cost, or execution signal.
- **Buyer-facing risk:** HIGH. Enterprise buyers who see the respondent assessment may question the product's sophistication. This is the highest buyer-facing risk in the product.
- **Required action:** Full rebuild of respondent set. Remove od_2, od_3, lco_1 from leader boolean set. Rewrite mc_3, di_1, ec_3, eco_2.
- **Rebuild severity:** FULL_QUESTION_SET_REBUILD (respondent), STRUCTURAL_REWRITE (leader boolean), LIGHT_REWRITE (leader Likert)

---

## 6. EXECUTIVE REPORTING

- **Current question strength:** 8.5/10
- **Weakest question:** "Headcount affected" — too generic.
- **Strongest question:** "What decision is actually on the table?" — perfect framing.
- **Biggest sequencing flaw:** Identity fields and context selects come before core questions. Weakens the opening.
- **Biggest missing question:** Commitment: "Will you implement the first action this report recommends?"
- **Biggest emotional flaw:** None in core questions. The framing paragraph is excellent.
- **Biggest evidence flaw:** No verification question.
- **Buyer-facing risk:** Low. The core questions feel executive-grade.
- **Required action:** Reorder — core questions first, then identity/context. Add commitment question. Rewrite "headcount affected."
- **Rebuild severity:** SEQUENCE_REBUILD (ordering only)

---

## 7. STRATEGY ROOM

- **Current question strength:** 7.5/10
- **Weakest question:** Consequence mapping sliders (Stage 2) — default evasion, no text evidence.
- **Strongest question:** Problem Statement — "Not symptoms — the condition" is premium.
- **Biggest sequencing flaw:** Stage 2 (sliders) creates emotional dead zone between intense Stage 0 and honest Stage 3.
- **Biggest missing question:** An explicit contradiction question: "What two things are you trying to protect that cannot both survive this decision?"
- **Biggest emotional flaw:** Stage 2 sliders allow the user to pass through without engaging.
- **Biggest evidence flaw:** Prior Correction Attempts placeholder should be sharper.
- **Buyer-facing risk:** Moderate. Stage 2 feels like a form, not a strategic intake.
- **Required action:** Add text evidence requirement to each slider. Rewrite Capacity Note placeholder. Sharpen Prior Corrections placeholder.
- **Rebuild severity:** STRUCTURAL_REWRITE (Stage 2 only)

---

## 8. RETURN BRIEF

- **Current question strength:** 9/10
- **Weakest question:** N/A — display-only prompts, all trigger-driven.
- **Strongest question:** "You committed to act. No action has been recorded."
- **Biggest sequencing flaw:** None.
- **Biggest missing question:** None — the system delivers confrontation, not questions.
- **Biggest emotional flaw:** None.
- **Biggest evidence flaw:** None.
- **Buyer-facing risk:** None. This is the most premium moment in the product.
- **Required action:** Protect as-is.
- **Rebuild severity:** NO_REBUILD

---

## 9. OUTCOME VERIFICATION

- **Current question strength:** 8.5/10
- **Weakest question:** N/A — classification-driven display.
- **Strongest question:** The verdict system itself.
- **Biggest sequencing flaw:** None.
- **Biggest missing question:** An input question: "What did you learn that changes how you would approach this next time?"
- **Biggest emotional flaw:** None.
- **Biggest evidence flaw:** Relies entirely on system-computed metrics. No user-confirmed outcome question.
- **Buyer-facing risk:** None.
- **Required action:** Consider adding one user-input verification question.
- **Rebuild severity:** NO_REBUILD

---

## 10. OVERSIGHT BRIEF / RETAINER

- **Current question strength:** 7/10
- **Weakest question:** No direct user-facing retainer intake questions exist. Qualification is computed.
- **Strongest question:** N/A — the strength is in the oversight brief structure, not questions.
- **Biggest sequencing flaw:** There is no "retainer intake" questioning moment. The user transitions from Strategy Room to retainer without a dedicated interrogation.
- **Biggest missing question:** "What would you miss if oversight stopped tomorrow?" — this should be asked at retainer onboarding.
- **Biggest emotional flaw:** The retainer transition feels algorithmic, not experiential.
- **Biggest evidence flaw:** No retainer-specific evidence collection.
- **Buyer-facing risk:** Moderate — the retainer is the highest-value product but has the least bespoke questioning.
- **Required action:** Create a retainer intake question set (3–5 questions).
- **Rebuild severity:** STRUCTURAL_REWRITE (missing surface)

---

## 11. COUNSEL WORKFLOW

- **Current question strength:** 6/10
- **Weakest question:** Operator-facing free-text fields with no structured question flow.
- **Strongest question:** "What must counsel review?" — direct and purposeful.
- **Biggest sequencing flaw:** Counsel workflow is procedural, not diagnostic.
- **Biggest missing question:** A structured counsel intake: "What is the specific governance question that cannot be resolved by the operator alone?"
- **Biggest emotional flaw:** N/A — operator-facing.
- **Biggest evidence flaw:** Evidence basis is free-text array. Should be structured evidence nodes.
- **Buyer-facing risk:** Low — operator-only surface.
- **Required action:** Structure the counsel intake with defined question types.
- **Rebuild severity:** LIGHT_REWRITE

---

## Summary

| Surface | Strength | Rebuild Severity | Priority |
|---------|----------|-----------------|----------|
| Fast Diagnostic | 9/10 | NO_REBUILD | — |
| Return Brief | 9/10 | NO_REBUILD | — |
| Constitutional | 8.5/10 | LIGHT_REWRITE | P2 |
| Outcome Verification | 8.5/10 | NO_REBUILD | — |
| Executive Reporting | 8.5/10 | SEQUENCE_REBUILD | P2 |
| Strategy Room | 7.5/10 | STRUCTURAL_REWRITE (Stage 2) | P1 |
| Team (Leader) | 7.5/10 | LIGHT_REWRITE | P2 |
| Purpose Alignment | 7/10 | STRUCTURAL_REWRITE | P1 |
| Enterprise (Leader) | 7/10 | STRUCTURAL_REWRITE | P1 |
| Oversight/Retainer | 7/10 | STRUCTURAL_REWRITE | P1 |
| Counsel | 6/10 | LIGHT_REWRITE | P3 |
| Team (Respondent) | 4/10 | STRUCTURAL_REWRITE | P1 |
| Enterprise (Respondent) | 2/10 | FULL_QUESTION_SET_REBUILD | **P0** |
