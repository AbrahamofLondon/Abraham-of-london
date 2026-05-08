# Constitutional Question Cleanup Audit

> Date: 2026-05-08
> File: `lib/diagnostics/constitutional-diagnostic-derivation.ts`
> Scope: All 10 dual-axis questions (q1-q10)

---

## Current Question Set

| ID | Current Wording | Domain | Reverse | Classification |
|----|----------------|--------|---------|---------------|
| q1 | "The stated strategy and actual resource allocation are meaningfully aligned." | coherence | No | PROTECT |
| q2 | "Decision authority is clear and exercised without chronic diffusion or bottleneck." | authority | No | PROTECT |
| q3 | "The operating environment has changed faster than the organisation's ability to adapt." | environment | Yes | PROTECT |
| q4 | "There is a pattern of strategic drift -- direction stated but not executed with discipline." | execution | Yes | PROTECT |
| q5 | "When someone raises a serious objection here, the objection is tested against the decision -- not against the person." | trust | No | PROTECT (rewritten this pass) |
| q6 | "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict." | friction | Yes | PROTECT |
| q7 | "There is a clear decision-maker who can authorise strategic intervention." | authority | No | PROTECT |
| q8 | "The cost of getting this wrong would be material -- financial, reputational, or structural." | stakes | No | PROTECT |
| q9 | "The same problems keep resurfacing despite repeated attempts to fix them." | pattern | Yes | PROTECT (rewritten this pass) |
| q10 | "External market or stakeholder pressure is actively forcing attention to this issue." | pressure | No | PROTECT |

---

## q5 Rewrite Analysis

**Previous (committed):** "Trust between leadership and execution layers is materially intact."
**Current (working tree):** "When someone raises a serious objection here, the objection is tested against the decision -- not against the person."

### Why it was rewritten
- "Materially intact" is academic language that users cannot reliably self-assess on a 0-10 scale
- The original tested an abstract concept (trust) rather than a specific observable behaviour
- The rewrite asks about a concrete institutional mechanism: how objections are processed

### Diagnostic signal
- Domain: `trust` (unchanged)
- Reverse: `false` (unchanged)
- High resonance = objections are processed safely, trust exists
- Low resonance = objections are punished politically, trust is compromised
- The rewrite names the failure mode precisely: "against the person"

### Why the rewrite earns PROTECT status
- Tests specific, observable institutional behaviour
- Cannot be answered performatively -- the user must recall a real event
- Produces evidence directly useful for Strategy Room routing and counsel escalation
- No competitor diagnostic asks this question
- Confrontational without being aggressive -- challenges the institution, not the respondent

### Scoring compatibility
- Feeds `trustScore` via `byDomain.trust` then `percentFromLikert(average(...))`
- `trustScore` feeds: `governanceDiscipline`, `narrativeCoherence`, `interventionReadiness`, `failureModeCount`, posture classification, readiness tier, key findings
- No scoring logic references question text -- only domain and ID
- **Fully compatible. Zero risk.**

---

## q9 Rewrite Analysis

**Previous (committed):** "Past attempts to correct the issue have failed due to structural, not motivational, causes."
**Current (working tree):** "The same problems keep resurfacing despite repeated attempts to fix them."

### Why it was rewritten
- The original required expert-level causal reasoning ("structural, not motivational")
- Users are asked to diagnose causality -- this is what the system should do, not the respondent
- The rewrite tests the same signal (pattern recurrence) without requiring causal theory

### Diagnostic signal
- Domain: `pattern` (unchanged)
- Reverse: `true` (unchanged -- high resonance = problems recur = bad)
- High resonance = structural pattern persists despite intervention
- Low resonance = past corrections have held

### Why the rewrite earns PROTECT status
- Asks about observable reality: "do the same problems come back?"
- Does not require causal diagnosis from the user
- Produces pattern recurrence evidence critical for retainer qualification
- Clear, answerable, and the same diagnostic intent
- Simpler language produces higher-quality responses

### Scoring compatibility
- Feeds `frictionScore` via `byDomain.pattern` aggregated with `execution` and `friction` domains
- Reverse scoring inverts resonance (10 - resonance) before certainty weighting
- No scoring logic references question text
- **Fully compatible. Zero risk.**

---

## Protected Questions Confirmation

| ID | Wording Fragment Verified | Status |
|----|--------------------------|--------|
| q1 | "strategy and actual resource allocation" | UNCHANGED |
| q2 | "Decision authority is clear and exercised" | UNCHANGED |
| q3 | "operating environment has changed faster" | UNCHANGED |
| q4 | "pattern of strategic drift" | UNCHANGED |
| q5 | "objection is tested against the decision" | REWRITTEN (verified) |
| q6 | "visible friction: coordination failures" | UNCHANGED |
| q7 | "clear decision-maker who can authorise" | UNCHANGED |
| q8 | "cost of getting this wrong would be material" | UNCHANGED |
| q9 | "same problems keep resurfacing" | REWRITTEN (verified) |
| q10 | "External market or stakeholder pressure" | UNCHANGED |

---

## Downstream Dependency Map

| Consumer | Depends On | Impact |
|----------|-----------|--------|
| `deriveConstitutionalMicroReport()` | Domain scores via `buildDomainMap()` | None -- uses question.domain, not text |
| `classifyPosture()` | trustScore, coherenceScore, frictionScore, governanceDiscipline | None |
| `classifyReadinessTier()` | authorityScore, coherenceScore, trustScore, interventionReadiness, governanceDiscipline | None |
| `buildFindings()` | trustScore threshold < 45 | None -- threshold logic unchanged |
| `evaluateConstitutionalRoute()` | ConstitutionInput from micro report | None -- input structure unchanged |
| `ConstitutionalDiagnostic.tsx` | DEFAULT_DIAGNOSTIC_QUESTIONS array | Auto-reflects new text |
| Strategy Room admission | Constitutional decision.route | None -- route from scores, not text |
| Executive Reporting inherited posture | ConstitutionalMicroReport fields | None -- fields unchanged |
| constitutional-bridge.ts | ConstitutionalMicroReport | None -- no text references |
