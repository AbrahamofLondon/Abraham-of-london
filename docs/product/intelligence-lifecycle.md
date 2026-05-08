# Canonical Intelligence Lifecycle

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Doctrine:** The ladder maps to cognitive states, not merely pages.

---

## The Six Cognitive States

Every Case progresses through cognitive states. Each state has qualifying evidence, allowed surfaces, possible directives, and conditions for progression or restriction.

---

### 1. Signal Discovery

**User condition:** The user suspects a decision problem exists but has not named it, or has named it vaguely.

**System responsibility:** Extract the decision. Test specificity. Flag vague input. Provide first useful signal.

**Qualifying evidence:** User has entered any diagnostic surface and submitted at least one response.

**Evidence tier:** `insufficient` or `single_source`

**Allowed product surfaces:**
- Fast Diagnostic
- Purpose Alignment
- Diagnostics hub

**Possible directives:**
- ALLOW — proceed to structural recognition
- FLAG — input is vague, prompt for specificity
- CLASSIFY — mark as unresolved if commitment is declined

**Progression conditions:**
- Decision statement exists with minimum specificity
- At least one consequence named
- Commitment gate passed (or bypass accepted with unresolved classification)

**Refusal/restriction conditions:**
- Input too vague for any governed output → prompt for specificity
- Commitment declined → classify as unresolved, allow view but track

**Memory updates:**
- Create or update Case
- Store initial Decision object
- Record evidence node (kind: signal)

---

### 2. Structural Recognition

**User condition:** The decision problem has been named. The system has identified whether it is personal, constitutional, team-level, or institutional.

**System responsibility:** Classify the structure. Detect contradictions. Route the assessment forward. Distinguish personal from systemic.

**Qualifying evidence:** At least one completed diagnostic with scored output and route decision.

**Evidence tier:** `single_source` or `multi_source`

**Allowed product surfaces:**
- Purpose Alignment (result)
- Constitutional Diagnostic
- Team Assessment
- Enterprise Assessment

**Possible directives:**
- STRATEGY — evidence supports escalation
- DIAGNOSTIC — continue evidence gathering
- REJECT — evidence does not support escalation at this time
- WATCH — monitor, do not escalate

**Progression conditions:**
- Route decision issued (STRATEGY/DIAGNOSTIC/REJECT/WATCH)
- Contradiction(s) detected and classified
- Authority type identified
- Posture and readiness scored

**Refusal/restriction conditions:**
- REJECT route → other pathways remain open, current path restricted
- WATCH route → governed observation, not escalation
- Evidence tier still `insufficient` → prompt for additional layer

**Memory updates:**
- Update Case with stage completion
- Store route decision
- Store contradiction evidence nodes
- Update tension thread

---

### 3. Consequence Realisation

**User condition:** The user understands that the decision problem has measurable cost — financial, operational, reputational, or governance.

**System responsibility:** Price the consequence. Translate structural strain into exposure. Make the cost of inaction visible.

**Qualifying evidence:** Multi-source evidence from at least two diagnostic stages. Exposure model populated.

**Evidence tier:** `multi_source`

**Allowed product surfaces:**
- Executive Reporting (entry/paywall)
- Enterprise Assessment (result with exposure routing)
- Any diagnostic result that surfaces cost-of-inaction

**Possible directives:**
- ADMIT — evidence tier sufficient for Executive Reporting
- RESTRICT — evidence tier insufficient, provide repair path
- ESCALATE — consequence warrants Strategy Room

**Progression conditions:**
- Evidence tier is `multi_source` or higher
- At least one exposure estimate exists
- Decision object has constraint and cost-of-delay fields populated
- Admission check passes (server-validated)

**Refusal/restriction conditions:**
- Evidence tier below `multi_source` → "Strengthen the evidence first"
- No exposure anchor → "Consequence must be priced before the system can generate a governed brief"

**Memory updates:**
- Store exposure estimates
- Update evidence tier
- Record admission decision (governance event)

---

### 4. Intervention Readiness

**User condition:** The user is prepared to act. Evidence is established. Consequence is priced. Authority is confirmed.

**System responsibility:** Validate readiness. Confirm authority. Issue admission directive. Open the governed intervention surface.

**Qualifying evidence:** Executive Report generated or Strategy Room admission verified. Decision has owner, authority, and timeline.

**Evidence tier:** `multi_source` or `outcome_verified`

**Allowed product surfaces:**
- Executive Reporting (run/generation)
- Strategy Room (admission + execution)

**Possible directives:**
- ADMITTED — readiness confirmed, intervention surface opens
- RESTRICTED — readiness gaps identified, repair actions issued
- BLOCKED — authority enforcement prevents entry

**Progression conditions:**
- Server-side admission check passes
- Evidence payload validated
- Authority signal present
- Decision specificity threshold met
- Pre-commitment confirmed

**Refusal/restriction conditions:**
- Missing evidence → specific missing items listed
- Authority gap → "Confirm authority in writing"
- Decision too vague → "Name the decision, the owner, and the consequence"
- Block directive from authority enforcement → recommended path issued

**Memory updates:**
- Record admission governance event
- Create execution state
- Lock intervention stack

---

### 5. Execution Governance

**User condition:** Intervention is underway. The system tracks whether directed actions are being executed, stalled, or contradicted.

**System responsibility:** Track execution state. Detect stalls. Detect contradiction between directed action and actual behaviour. Surface compounding consequence.

**Qualifying evidence:** Strategy Room session active. Execution records being created.

**Evidence tier:** `multi_source` progressing toward `outcome_verified`

**Allowed product surfaces:**
- Strategy Room (execution chamber)
- Monitoring dashboard (if active)

**Possible directives:**
- CONTINUE — execution on track
- WARN — stall detected or deadline approaching
- ESCALATE — execution diverging from intervention plan
- RESTRICT — pattern of non-execution triggers restriction

**Progression conditions:**
- At least one execution action recorded
- First verification checkpoint approaching (14 days)

**Refusal/restriction conditions:**
- Persistent non-execution → retainer recommendation
- Contradiction between stated action and observed behaviour → escalation trigger

**Memory updates:**
- Update execution state (actions executed, pending, stalled)
- Update consequence score and trend
- Record execution governance events

---

### 6. Institutional Intelligence

**User condition:** The intervention has been verified. Outcomes are classified. The system has learned from this Case and can improve future governance.

**System responsibility:** Verify outcomes. Classify resolution. Calibrate accuracy. Update institutional memory. Improve future scoring.

**Qualifying evidence:** Return Brief generated. Outcome classification complete. Delta measured.

**Evidence tier:** `outcome_verified` or `human_reviewed`

**Allowed product surfaces:**
- Return Brief
- Retainer governance (if pattern is persistent)
- Calibration dashboard (internal)

**Possible directives:**
- RESOLVED — condition resolved, Case can be closed
- IMPROVED — condition improved but not fully resolved
- STABILISED — condition stable, monitoring continues
- PERSISTENT — pattern persists, retainer recommended
- WORSENED — escalation required

**Progression conditions:**
- Outcome verification at 14 or 30 days complete
- Classification issued
- Calibration record created

**Refusal/restriction conditions:**
- Too early for verification → "Insufficient time has passed"
- No execution records → "No intervention was executed"

**Memory updates:**
- Update Case with outcome classification
- Update Decision Credit (trust score)
- Create Calibration Record
- Record pattern status (resolved/persistent)
- Update institutional learning corpus

---

## State Transition Map

```
Signal Discovery
  ↓ (decision named, consequence identified)
Structural Recognition
  ↓ (contradictions detected, route issued)
Consequence Realisation
  ↓ (exposure priced, admission validated)
Intervention Readiness
  ↓ (authority confirmed, execution begins)
Execution Governance
  ↓ (outcomes verified, learning captured)
Institutional Intelligence
```

Each transition requires qualifying evidence. No transition is automatic. The system may restrict, refuse, or redirect at any boundary.

---

## Mapping to Product Surfaces

| Cognitive State | Primary Surfaces | Evidence Tier |
|----------------|-----------------|---------------|
| Signal Discovery | Fast Diagnostic, Purpose Alignment | insufficient → single_source |
| Structural Recognition | Constitutional, Team, Enterprise | single_source → multi_source |
| Consequence Realisation | Executive Reporting entry | multi_source |
| Intervention Readiness | Executive Reporting run, Strategy Room admission | multi_source |
| Execution Governance | Strategy Room execution | multi_source → outcome_verified |
| Institutional Intelligence | Return Brief, Retainer | outcome_verified → human_reviewed |
