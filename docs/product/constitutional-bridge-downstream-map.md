# Constitutional Bridge Downstream Map

> Date: 2026-05-08

---

## Bridge Field Reference

| Bridge Field | Source | Meaning | Downstream Surface | How It Should Be Used | What It Must Not Claim |
|-------------|--------|---------|-------------------|----------------------|----------------------|
| evidenceSignals.authority | q2 + q7 domain scores | Whether decision authority is explicit, imperfect, or absent | Executive Reporting, Strategy Room, Oversight Brief | Display authority polarity. Flag weakness in mandate draft. | Must not claim specific person has/lacks authority. |
| evidenceSignals.coherence | q1 domain score | Whether strategy and resource allocation are aligned | Executive Reporting, Strategy Room, Return Brief | Flag coherence gap. Inform headline. | Must not claim specific strategy details. |
| evidenceSignals.trust | q5 domain score | Whether objections are processed safely or politically | Executive Reporting, Strategy Room, Oversight Brief, Control Room | Flag trust condition. Adjust intervention approach. | Must not claim specific trust incidents. |
| evidenceSignals.execution | q4 + q6 + q9 scores (friction composite) | Whether execution is disciplined or drifting | Executive Reporting, Strategy Room, Return Brief, Oversight Brief | Flag execution drag. Inform intervention urgency. | Must not claim specific execution failures. |
| evidenceSignals.externalPressure | q3 + q8 + q10 scores (pressure composite) | Whether external pressure is forcing attention | Executive Reporting, Strategy Room | Context for urgency. Inform timeline recommendations. | Must not claim specific market conditions. |
| contradictionSignals[] | Cross-question analysis | Structural contradictions between answers (e.g., authority without trust) | All downstream | Display dominant contradiction. Inform route rationale. | Must not present as accusation. Must present as structural observation. |
| priorAttemptSignal | Upstream CanonicalDecisionObject.priorAttemptText | Whether prior corrections were attempted and what happened | Executive Reporting, Strategy Room, Return Brief, Oversight Brief | "Previous correction attempts did not hold." Prevent repeating failed interventions. | Must not fabricate prior attempts. If absent, say "Not established." |
| costOfInactionSignal | Upstream CanonicalDecisionObject.costOfDelayText | What deteriorates if nothing changes | Executive Reporting, Oversight Brief | Inform consequence pricing. Display cost context alongside q8 stakes signal. | Must not claim exact financial loss unless parsed and evidence-supported. If absent, say "Not established." |
| avoidanceSignal | Upstream avoidedDecision + q9 recurrence inference | Whether an avoidance pattern is present | Return Brief, Strategy Room, Oversight Brief | "Possible avoidance pattern detected." Inform recurrence warnings. | Must say "Possible" not "Confirmed" unless explicit upstream evidence exists. Must not use accusatory language. |
| recurrenceSignal | q9 answer + upstream pattern recurrence data | Whether the same problems keep returning | All downstream | "Recurrence signal detected." Inform retainer qualification. | Must not claim specific recurrence count unless upstream data provides it. |
| verificationGap | Static marker | The Constitutional Diagnostic does not ask the user to define success evidence | Executive Reporting | "Verification criteria not yet established. Executive Reporting must extract them." | Must not present as a failure. Present as a known system boundary. |
| immediateDecisionGap | Static marker | The Constitutional Diagnostic identifies posture/route but not the specific decision | Strategy Room | "The specific decision has not yet been named. Strategy Room intake must extract it." | Must not present as a failure. Present as a handoff. |
| domainScores | All 9 domain/composite scores | Numeric domain health | All downstream (for metrics, not display) | Internal reference. Not for user-facing display of raw numbers. | Must not expose scoring formulas or thresholds to users. |

---

## Contradiction Signal Reference

| Type | Trigger | Use In... | Language |
|------|---------|-----------|---------|
| AUTHORITY_WITHOUT_TRUST | authority >= 60, trust < 40 | SR mandate draft, ER risk section | "Authority exists but trust is insufficient. Compliance without alignment." |
| URGENCY_WITHOUT_CAPACITY | pressure >= 65, readiness < 40 | ER risk section, Oversight | "Pressure demands action but structure cannot absorb intervention safely." |
| OBJECTION_POLITICISED | q5 resonance <= 3, certainty >= 7 | SR escalation rationale, Counsel | "Objections are punished rather than processed. Structural trust failure." |
| RECURRING_FAILURE | q9 resonance >= 7, certainty >= 6 | Retainer qualification, Return Brief | "Same problems resurfacing despite correction. Pattern is structural." |
| EXTERNAL_PRESSURE | q10 resonance >= 7, coherence < 50 | ER risk section | "External pressure is high while coherence is low. Reactive decisions likely." |
| EXECUTION_DRIFT | q4 resonance >= 7, q1 resonance >= 6 | ER headline, SR mandate | "Strategy appears aligned but execution is drifting. Behavioural gap." |
