# Bespoke Questioning Audit

> Audit date: 2026-05-08
> True bespoke questioning means the next question is shaped by what the user has revealed.

---

## Classification Key

| Code | Meaning |
|------|---------|
| FULLY_BESPOKE | Questions adapt based on prior answers, reference user's own language, trigger conditional follow-ups |
| PARTIALLY_BESPOKE | Some adaptation exists but most questions remain static |
| STATIC_BUT_ACCEPTABLE | Questions are fixed but consistency matters more than personalisation |
| TOO_GENERIC | Questions are static and read like a standard survey |
| FALSELY_PERSONALISED | System inserts user's name or decision text but does not shape the next question |
| NEEDS_DYNAMIC_FOLLOWUP_ENGINE | Surface would materially improve with engine-selected follow-ups |

---

## Surface-by-Surface Classification

### Fast Diagnostic
**Classification: PARTIALLY_BESPOKE**

| Bespoke Feature | Present? | Details |
|-----------------|----------|---------|
| Adapts based on prior answers | Partial | Live hints trigger based on input content patterns |
| Static regardless of context | Partial | The 3 core questions are always the same |
| References user's prior language | No | — |
| Uses prior stage data | No | First stage — no prior data |
| Triggers follow-ups on contradiction/vagueness | Yes | Challenge engine fires for vague_decision, missing_owner, shared_authority, weak_consequence, avoidance_language |
| Should become more dynamic | Yes | Q2 could reference Q1's decision text: "You said the decision is [X]. Who can make [X] binding?" |

**What makes it feel bespoke:** The live hints create an illusion of the system listening. When a user types "improve" and sees "This does not yet read as a decision," it feels responsive. The challenge engine that fires between questions adds a layer of confrontation that adapts to the user's actual input.

**What keeps it from being fully bespoke:** The 3 questions never change. A user who completes this twice sees the same questions. The follow-up questions from the challenge engine are good but the core sequence is static.

---

### Purpose Alignment
**Classification: PARTIALLY_BESPOKE**

| Bespoke Feature | Present? | Details |
|-----------------|----------|---------|
| Adapts based on prior answers | Partial | Challenge API fires based on context answers. Dual-axis integrity detection adapts to response patterns. |
| Static regardless of context | Yes | All 18 signal statements are always the same, in the same order |
| References user's prior language | No | The signal phase never references what the user wrote in the context phase |
| Uses prior stage data | No | Does not incorporate Fast Diagnostic answers |
| Triggers follow-ups | Yes | Challenge API detects vague-decision, weak-consequence, avoidance-language |
| Should become more dynamic | Yes | The weakest domain should trigger additional probing questions |

**Critical gap:** The user writes deeply personal context (avoided decision, competing obligation, consequence). Then they are given 18 static statements that do not reference anything they wrote. The system knows what the user is avoiding — but the statements act as if they don't. This is a missed opportunity.

**Example of what bespoke would look like:** If the user's avoided decision is "Leave my current role," the identity domain could include: "Your avoided decision suggests a mandate question. Is your current role your actual mandate, or something you inherited?"

---

### Constitutional Diagnostic
**Classification: STATIC_BUT_ACCEPTABLE**

| Bespoke Feature | Present? | Details |
|-----------------|----------|---------|
| Adapts based on prior answers | No | 10 fixed statements |
| Static regardless of context | Yes | Same for every respondent |
| References user's prior language | No | — |
| Uses prior stage data | No | Does not reference Purpose Alignment results |
| Triggers follow-ups | Yes | Dual-axis integrity challenge fires on anomalous patterns |
| Should become more dynamic | Partially | Consistency matters for institutional benchmarking. But a single adaptive follow-up question based on the most anomalous response would improve evidence quality without breaking comparability. |

**Why static is acceptable here:** The Constitutional Diagnostic needs to produce comparable scores across organisations. Static questions enable benchmarking. However, one dynamic follow-up after submission (not during) would not break comparability.

---

### Team Assessment (Leader View)
**Classification: PARTIALLY_BESPOKE**

| Bespoke Feature | Present? | Details |
|-----------------|----------|---------|
| Adapts based on prior answers | Yes | The dual-phase structure adapts — Phase 2 forces the leader to re-answer from the team's perspective |
| Static regardless of context | Partial | The 12 statements are fixed, but the two-phase structure creates bespoke confrontation |
| References user's prior language | No | Phase 2 does not show Phase 1 scores |
| Uses prior stage data | No | Does not reference Constitutional or Purpose Alignment data |
| Triggers follow-ups | Yes | Integrity challenge on group advance |
| Should become more dynamic | Yes | Post-assessment reflections should reference the largest gap domain |

**What makes the dual-phase structure powerful:** The leader cannot unsee their Phase 1 answers when completing Phase 2. The implicit question is: "You just said X about your team. Now, would your team agree?" This creates bespoke discomfort from a static structure.

**What's missing:** The system knows which domain has the largest leader/reality gap but does not ask a targeted follow-up question about that specific gap.

---

### Team Assessment (Respondent View)
**Classification: TOO_GENERIC**

| Bespoke Feature | Present? | Details |
|-----------------|----------|---------|
| Adapts based on prior answers | No | 4 fixed statements on a fixed scale |
| Static regardless of context | Yes | Same for every respondent |
| References user's prior language | No | — |
| Uses prior stage data | No | — |
| Triggers follow-ups | No | — |
| Should become more dynamic | Yes | Should become NEEDS_DYNAMIC_FOLLOWUP_ENGINE |

**Problem:** Every respondent in every organisation sees the same 4 questions. There is no adaptation based on what the leader's assessment revealed, what the organisation's Constitutional profile looks like, or what domain is under most strain. The respondent experience is generic.

---

### Enterprise Assessment (Leader View — Boolean)
**Classification: STATIC_BUT_ACCEPTABLE**

Same rationale as Constitutional. Static for comparability. But 18 boolean questions with no follow-up feels like a checklist. The system should fire at least one adaptive question after submission based on the domain with the most "false" responses.

---

### Enterprise Assessment (Respondent View — Boolean)
**Classification: TOO_GENERIC**

5 static boolean questions that do not reference anything about the organisation, the leader's assessment, or any prior stage. Worst bespoke score in the product.

---

### Enterprise Assessment (Likert View)
**Classification: STATIC_BUT_ACCEPTABLE**

12 questions on a 5-point scale. Static for institutional benchmarking. Acceptable because the questions themselves are stronger than the respondent boolean set.

---

### Executive Reporting
**Classification: PARTIALLY_BESPOKE**

| Bespoke Feature | Present? | Details |
|-----------------|----------|---------|
| Adapts based on prior answers | No | 4 fixed core questions |
| Static regardless of context | Yes | Same for every user |
| References user's prior language | No | Does not reference diagnostic journey |
| Uses prior stage data | No | Does not pull in Constitutional, Team, or Enterprise data |
| Triggers follow-ups | No | No challenge engine on this surface |
| Should become more dynamic | Yes | Should reference the user's diagnostic history: "Your Constitutional assessment showed authority fragmentation. Is that the constraint you mean?" |

**Critical gap:** The Executive Reporting intake exists after the user has potentially completed 3+ diagnostic stages. The system has substantial evidence about their situation. But the 4 core questions act as if the system knows nothing. This is false naivety.

---

### Strategy Room
**Classification: PARTIALLY_BESPOKE**

| Bespoke Feature | Present? | Details |
|-----------------|----------|---------|
| Adapts based on prior answers | Partial | Text quality scoring adapts the composite score. Route thresholds create adaptive outcomes. |
| Static regardless of context | Yes | All form fields are the same for every user |
| References user's prior language | No | Does not quote the user's diagnostic answers |
| Uses prior stage data | Partial | Admission gates check for completed stages and evidence tier |
| Triggers follow-ups | No | No challenge engine within the form itself |
| Should become more dynamic | Yes | Problem Statement should pre-populate with the user's Constitutional diagnostic findings: "Your assessment indicated [X]. Describe the structural problem in more detail." |

**The admission gates are the bespoke layer.** The form itself is static, but whether you can submit it depends on your diagnostic history. "readyForUnpleasantDecision" and "willingAccountability" as hard gates make the qualification process feel bespoke even though the questions are fixed.

---

### Adaptive Question Bank
**Classification: FULLY_BESPOKE**

This is the only fully bespoke questioning system in the product. Templates are selected based on:
- Decision spine state
- C3 gaps (clarity, context, consequence)
- Detected contradictions
- Memory signals from prior assessments
- Current stage in journey

**This is what the rest of the product should aspire to.** The adaptive question bank proves the team can build dynamic questioning. The question is why this capability is not deployed more broadly.

---

### Return Brief
**Classification: FULLY_BESPOKE**

Prompts are entirely driven by the user's prior commitments and trajectory. The system uses the user's own behaviour (or lack of it) to generate the confrontation. No two return briefs show the same prompt unless the user's situation is identical.

---

### Outcome Verification
**Classification: FULLY_BESPOKE**

Display is entirely driven by outcome classification. Contradiction persistence, root cause, and before/after evidence are all computed from the user's specific data.

---

## Summary Table

| Surface | Classification | Key Gap |
|---------|---------------|---------|
| Fast Diagnostic | PARTIALLY_BESPOKE | Q2 could reference Q1's decision text |
| Purpose Alignment (context) | PARTIALLY_BESPOKE | Challenge API fires, but no follow-up shaped by revealed avoidance |
| Purpose Alignment (signals) | STATIC_BUT_ACCEPTABLE | 18 statements never reference context answers |
| Constitutional | STATIC_BUT_ACCEPTABLE | Acceptable for benchmarking |
| Team (Leader) | PARTIALLY_BESPOKE | Dual-phase is structurally bespoke; follow-up questions missing |
| Team (Respondent) | TOO_GENERIC | 4 fixed questions, no adaptation |
| Enterprise (Leader Boolean) | STATIC_BUT_ACCEPTABLE | No follow-up on weakest domain |
| Enterprise (Respondent) | TOO_GENERIC | 5 fixed questions, no adaptation |
| Enterprise (Likert) | STATIC_BUT_ACCEPTABLE | — |
| Executive Reporting | PARTIALLY_BESPOKE | Does not reference diagnostic history |
| Strategy Room | PARTIALLY_BESPOKE | Form is static, admission is adaptive |
| Adaptive Question Bank | FULLY_BESPOKE | Should be deployed more broadly |
| Return Brief | FULLY_BESPOKE | — |
| Outcome Verification | FULLY_BESPOKE | — |

---

## Which Questions Should Become Dynamic But Are Currently Static

1. **Purpose Alignment signal statements** — The weakest domain should trigger 1–2 additional probing questions from the adaptive bank.
2. **Team Assessment post-reflection** — Should reference the specific domain with the largest gap.
3. **Executive Reporting core questions** — Should pre-populate or reference diagnostic journey data.
4. **Strategy Room Problem Statement** — Should quote the user's Constitutional findings as a starting point.
5. **Enterprise respondent questions** — Should be replaced with domain-specific questions drawn from the leader's weakest domain.

## Which Questions Should NOT Become Dynamic

1. **Constitutional Diagnostic** — Benchmarking requires static comparability.
2. **Enterprise Leader Boolean** — Same rationale.
3. **Fast Diagnostic core 3** — The simplicity and consistency of 3 fixed questions is the product's signature. Making these dynamic would dilute the iconic opening.
