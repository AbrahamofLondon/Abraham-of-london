# Missed Assessment Rehabilitation Register

> Date: 2026-05-08
> Purpose: Identify every surface not yet rehabilitated and classify the gap

---

## Register

| Surface | Rehabilitation Status | Gap | Buyer Risk | Evidence Risk | UX Risk | Required Action | Priority |
|---------|----------------------|-----|-----------|--------------|---------|----------------|----------|
| Fast Diagnostic | COMPLETE | Downstream bridge — answers not durably persisted beyond session | Low | Medium — avoidedDecision captured but cost/consequence not carried to Return Brief | Low | Bridge Fast Diagnostic decision/consequence to Return Brief server | P2 |
| Purpose Alignment (signals) | COMPLETE | Downstream bridge — competingObligation never persisted to DB | Low | Medium — rich context captured but lost after session | Low | Persist PA reflections to journey store; bridge to downstream | P2 |
| Constitutional Diagnostic | MOSTLY COMPLETE | Evidence bridge created but upstream context not populated by callers | Low | Medium — bridge exists but upstream fields are empty | Low | Wire upstream context from journey store into orchestrator call | P1 |
| Team Assessment (leader) | PARTIAL | 1 weak statement ("produces visible progress"). No consequence pricing question. | Low | Low | Low | Rewrite 1 statement. Consider adding consequence prompt. | P3 |
| Team Assessment (respondent) | COMPLETE | — | — | — | — | — | — |
| Enterprise Assessment (leader boolean) | PARTIAL | 4 weak statements (mc_3, di_1, eco_2) + 3 redundant (od_2, od_3, lco_1) | Medium | Low — boolean produces limited evidence anyway | Low | Remove 3 redundant, rewrite 3 weak | P2 |
| Enterprise Assessment (Likert) | NOT TOUCHED | 12 questions untouched, no evidence bridge | Medium | Medium — scores computed but not carried to downstream surfaces | Medium | Audit questions against quality bar, create evidence bridge | P2 |
| Executive Reporting intake | MOSTLY COMPLETE | Identity fields before core questions weakens opening | Low | Low — verification criteria added | Medium — form starts with admin, not decision pressure | Reorder: core questions first, identity after | P2 |
| **Strategy Room Stage 2 sliders** | **NOT TOUCHED** | **4 sliders allow default evasion (default=5). No text evidence required.** | **Medium** | **High — consequence dimensions scored without evidence** | **Medium — emotional dead zone** | **Add required text evidence field per slider** | **P1** |
| **Strategy Room execution** | **NOT TOUCHED** | **Status controls ("completed", "monitoring") unexplained. Decision input lacks format guidance.** | **Low** | **Medium — actions recorded without structure** | **Medium** | **Add status guidance copy. Structure decision input.** | **P2** |
| **Outcome Verification** | **NOT TOUCHED** | **Display-only. Does not consume user-defined verification criteria. No user input.** | **Low** | **High — no user-confirmed outcome question** | **Low** | **Consume verificationCriteria from ER. Add optional user reflection.** | **P1** |
| **Commitment Verification** | **NOT TOUCHED** | **Display-only in Return Brief. No actual input surface for recording verification. committed flag missing from persistence.** | **Medium** | **High — prompts say "record" but no recording mechanism** | **High — broken UX promise** | **Create verification recording endpoint or link to action surface. Persist committed flag.** | **P1** |
| Access Redemption | ALREADY STRONG | — | — | — | — | — | — |
| **Retainer / Oversight intake** | **NOT TOUCHED** | **No dedicated intake question set. Retainer qualification is computed, not experiential.** | **HIGH** | **HIGH — highest-value product has least bespoke questioning** | **HIGH — retainer transition feels algorithmic** | **Create retainer intake question set (3-5 questions)** | **P1** |
| **Counsel Review Workflow** | **NOT TOUCHED** | **Auto-generated CRUD form. Bare field names as prompts. No validation, no guidance, no evidence structure.** | **Medium** | **HIGH — counsel evidence is unstructured free text** | **HIGH — weakest surface in the product** | **Full redesign with structured evidence questions** | **P1** |
| Organisation Setup | ADEQUATE | Sector field weak, no guidance on naming or classification | Low | Low | Low | Add sector guidance, naming convention | P3 |
| Campaign Creation | ADEQUATE | Cadence and close-date fields unexplained | Low | Low | Low | Add field-level help text | P3 |
| **Oversight Review Bench** | **NOT TOUCHED** | **Operator decisions lack guidance. No explanation of when to choose each review decision.** | **Medium** | **Medium — operator decisions affect client delivery without structured reasoning** | **Medium** | **Add decision guidance copy. Require reasoning for escalation/withhold.** | **P2** |

---

## Priority Summary

| Priority | Count | Surfaces |
|----------|-------|----------|
| P1 | 5 | Strategy Room Stage 2, Outcome Verification, Commitment Verification, Retainer/Oversight intake, Counsel Review |
| P2 | 7 | Fast Diagnostic bridge, PA bridge, Enterprise leader boolean, Enterprise Likert, ER sequence, Strategy Room execution, Oversight Review Bench |
| P3 | 3 | Team leader statement, Organisation Setup, Campaign Creation |
| Complete | 6 | Fast Diagnostic, PA signals, Constitutional, Team respondent, Enterprise respondent, Access Redemption |

---

## The Five Most Dangerous Gaps

1. **Retainer/Oversight has no intake questioning** — the highest-value product has the least bespoke experience. A paying retainer client sees no intake interrogation at all. The transition from Strategy Room to retainer is algorithmic, not experiential.

2. **Counsel Review is a CRUD form** — the most consequential human escalation surface in the product looks like a database admin page. Auto-generated field names as prompts. No validation. No guidance. No structure.

3. **Commitment Verification says "record" but has no recording mechanism** — the prompts tell the user to "record whether the action was executed or blocked" but there is no input field, no endpoint, and no persistence. The promise is broken.

4. **Strategy Room Stage 2 allows evasion** — four consequence sliders default to 5, meaning a user can pass through the consequence mapping stage in 10 seconds without engaging. This is the emotional dead zone in the highest-stakes intake surface.

5. **competingObligation is captured but never persisted** — the user tells Purpose Alignment what they are protecting at the expense of the decision. This is one of the most valuable signals in the product. It vanishes after the session.
