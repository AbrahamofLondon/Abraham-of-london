# Constitutional Question Downstream Map

> Date: 2026-05-08
> Purpose: Trace every Constitutional question's signal through the system to its final consumer

---

## Signal Flow Diagram

```
Question (text + dual-axis input)
  → scoreQuestion() [per-question weighted score]
    → buildDomainMap() [group by domain]
      → deriveConstitutionalMicroReport() [5 primary scores + 6 composite scores + 3 classifications]
        → deriveConstitutionInputFromMicroReport() [routing input]
          → evaluateConstitutionalRoute() [REJECT / DIAGNOSTIC / STRATEGY]
            → deriveRouteSummary() [user-facing route card]
        → constitutional-bridge.ts [team/executive/strategy seeds]
        → orchestrator.ts [hidden signal extraction + weighting]
          → narrative-variants.ts [result narrative selection]
        → API persistence [DB columns]
        → tension-thread.ts [cross-stage continuity]
```

---

## Per-Question Trace

### q1 → coherenceScore → clarityScore → ROUTING GATE

```
q1 resonance + certainty
  → scoreQuestion(q1, answer) [forward-scored, certainty-weighted]
    → byDomain.coherence = [q1_score]
      → coherenceScore = percentFromLikert(average([q1_score]))
        → governanceDiscipline = average(authority, COHERENCE, trust)
        → narrativeCoherence = average(COHERENCE, trust, authority)
        → interventionReadiness = average(authority, COHERENCE, trust, 100-friction)
        → classifyPosture(): coherence < 45 → MISALIGNED, < 65 → DRIFTING
        → classifyReadinessTier(): coherence contributes to composite
        → deriveConstitutionInput(): clarityScore = coherenceScore
          → rules.ts Gate 2: clarity < 20 → REJECT
          → rules.ts Gate 6: clarity >= 65 → can go STRATEGY
        → bridge.ts: coherenceScore < 55 → generates team prompt
```

**Final consumers:** Route decision, posture classification, team assessment prompt, executive headline

### q2 + q7 → authorityScore → HARD ROUTING GATE

```
q2 + q7 resonance + certainty
  → scoreQuestion(q2, answer) + scoreQuestion(q7, answer)
    → byDomain.authority = [q2_score, q7_score]
      → authorityScore = percentFromLikert(average([q2_score, q7_score]))
        → classifyAuthorityType(): >= 70 DIRECT, >= 45 PROXY, else UNCLEAR
        → governanceDiscipline = average(AUTHORITY, coherence, trust)
        → interventionReadiness = average(AUTHORITY, coherence, trust, 100-friction)
        → classifyReadinessTier(): authority contributes to composite
        → rules.ts: authorityType gates Strategy promotion
        → bridge.ts: authorityType = "UNCLEAR" → generates risk signal
        → strategy-room seed: mandateDraft constructed from authority reading
```

**Final consumers:** Route decision (HARD GATE), authority type classification, strategy room mandate draft

### q3 + q8 + q10 → pressureScore

```
q3 [reverse] + q8 [forward] + q10 [forward]
  → byDomain.environment = [q3_score], byDomain.stakes = [q8_score], byDomain.pressure = [q10_score]
    → pressureScore = percentFromLikert(average([q3_score, q8_score, q10_score]))
      → seriousnessScore = 0.9 * average(authority, PRESSURE, friction)
      → failureModeCount: pressure >= 70 adds 1
      → bridge.ts: pressureScore >= 70 → "External pressure forcing premature choices"
      → strategy-room seed: severity language keyed to pressureScore
```

**Final consumers:** Seriousness score, failure mode count, bridge risk signal, strategy room severity

### q4 + q6 + q9 → frictionScore

```
q4 [reverse] + q6 [reverse] + q9 [reverse]
  → byDomain.execution = [q4_score], byDomain.friction = [q6_score], byDomain.pattern = [q9_score]
    → frictionScore = percentFromLikert(average([q4_score, q6_score, q9_score]))
      → seriousnessScore = 0.9 * average(authority, pressure, FRICTION)
      → interventionReadiness = average(authority, coherence, trust, 100-FRICTION)
      → failureModeCount: friction >= 60 adds 1
      → classifyPosture(): friction >= 60 → MISALIGNED, >= 70 → disorder signal
      → bridge.ts: frictionScore >= 60 → "Which recurring coordination failures consume leadership energy?"
```

**Final consumers:** Posture classification, intervention readiness, bridge prompt generation

### q5 → trustScore

```
q5 resonance + certainty
  → scoreQuestion(q5, answer) [forward-scored]
    → byDomain.trust = [q5_score]
      → trustScore = percentFromLikert(average([q5_score]))
        → governanceDiscipline = average(authority, coherence, TRUST)
        → narrativeCoherence = average(coherence, TRUST, authority)
        → interventionReadiness = average(authority, coherence, TRUST, 100-friction)
        → classifyPosture(): trust < 35 → disorder signal
        → classifyReadinessTier(): trust contributes to composite
        → failureModeCount: trust < 50 adds 1
        → bridge.ts: trustScore < 50 → "Where has trust between leadership and execution weakened?"
        → bridge.ts: trustScore < 45 → key finding "Trust condition is compromised"
        → deriveConstitutionInput(): trustCondition = trustScore
        → weighting.service.ts: trustScore adjusted by hidden signal composite
```

**Final consumers:** Governance discipline, posture (disorder detection), bridge prompt, trust key finding

---

## Downstream Stage Inheritance

### Team Assessment receives:
- authorityScore, coherenceScore, pressureScore, frictionScore, trustScore
- posture, readinessTier, authorityType, seriousnessScore
- Conditional prompts (score-triggered)
- Hypotheses: authority divergence, strategic misalignment, operational drag, trust erosion

### Executive Reporting receives:
- Headline (posture-keyed)
- Principal risks (score-triggered)
- Governance discipline score
- Seriousness score

### Strategy Room receives:
- Route decision + confidence
- Posture, readiness, authority
- Mandate draft (authority-keyed)
- Severity language (pressure/friction-keyed)

---

## What SAFE changes look like

| Change | Safe? | Why |
|--------|-------|-----|
| Reword q1-q10 text (keep ID + domain) | YES | No code references text. Auto-reflects in UI. |
| Change q5 from forward to reverse | NO | Inverts trustScore. All downstream breaks. |
| Add q11 to coherence domain | MEDIUM | Stabilises coherenceScore. Requires completion % adjustment. |
| Remove q10 | NO | pressureScore loses external signal. Falls to q3+q8 only. |
| Bridge priorAttemptText to output | YES | Pure addition to bridge output. No existing logic affected. |
