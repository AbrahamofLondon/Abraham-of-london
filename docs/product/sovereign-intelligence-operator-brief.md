# Sovereign Intelligence — Operator Brief

**Classification:** INTERNAL_OPERATOR_ONLY  
**Audience:** Product team, advisors, implementation operators  
**Prerequisite:** Sovereign Intelligence Operating Doctrine (read first)

This brief is for operators who need to understand the full signal catalogue, detection posture, and corridor implications. It is not for sponsors or clients.

---

## 1. Signal Catalogue

Eleven named institutional signals are currently active in the detection engine. Each represents a recurring decision pattern with documented trajectory and dataset-grounded prevalence.

### CRITICAL Severity

**Authority Collapse Under Pressure** (`authority-collapse-under-pressure`)  
Prevalence: Occasional — observed in fewer than one in five comparable cases  
Pattern: Authority structure collapses when confronted with external pressure (commercial, regulatory, investor). Decisions revert to founder/informal authority regardless of stated mandate design.  
Corridor effect: Strategy Room requires authority clarification before execution path is confirmed. Boardroom escalation is warranted.

**Execution Fragility Cascade** (`execution-fragility-cascade`)  
Prevalence: Common — observed in more than a third of comparable cases  
Pattern: Multiple execution failure modes are active simultaneously. Symptomatic fixes attempted on individual failures accelerate overall fragility.  
Corridor effect: Strategy Room requires checkpoint and dependency confirmation. Immediate structured review warranted.

### ALERT Severity

**Authority Diffusion Under Revenue Pressure** (`authority-diffusion-revenue-pressure`)  
Prevalence: Notable — observed in roughly a quarter of comparable cases  
Pattern: Commercial pressure diffuses authority clarity. Multiple stakeholders claim execution mandate without clear accountability boundary.  
Corridor effect: Strategy Room requires named decision owner and escalation owner. Boardroom attention recommended.

**Narrative Coherence Collapse** (`narrative-coherence-collapse`)  
Prevalence: Occasional — observed in fewer than one in five comparable cases  
Pattern: The organisation's stated operating narrative diverges from observable evidence. Strategy and execution are built on incompatible assumptions.  
Corridor effect: Strategy Room requires evidence clarification before board/counsel escalation.

**Second-Line Drift Under Scaling Conditions** (`second-line-drift-scaling`)  
Prevalence: Notable — observed in roughly a quarter of comparable cases  
Pattern: As organisation scales, second-line authority structures fail to keep pace. Decision quality degrades as first-line authority attempts to absorb second-line gaps.  
Corridor effect: Flag for sponsor/operator attention. Retained oversight recommendation.

**Founder Identity Operational Lock** (`founder-identity-operational-lock`)  
Prevalence: Notable — observed in roughly a quarter of comparable cases  
Pattern: Founder's identity is operationally embedded in day-to-day function. Delegation fails because the founder is structurally irreplaceable in execution, not just leadership.  
Corridor effect: Boardroom/counsel sensitivity. Written mandate design required. Do not overstate.

**Stable Drift False Floor** (`stable-drift-false-floor`)  
Prevalence: Common — observed in more than a third of comparable cases  
Pattern: Organisation appears stable on surface metrics while structural fragility compounds below. Stability creates false confidence that accelerates risk when disruption arrives.  
Corridor effect: Structural stability assessment recommended, separate from performance review.

### CONCERN Severity

**Intelligence Debt in Scaling Organisation** (`intelligence-debt-scaling`)  
Prevalence: Occasional — observed in fewer than one in five comparable cases  
Pattern: Organisation scaling without corresponding intelligence infrastructure. Decision velocity increases while evidence quality decreases.  
Corridor effect: Retained memory or oversight recommendation required.

**Sovereign Trajectory Signal** (`sovereign-trajectory-signal`)  
Prevalence: Rare — observed in fewer than one in ten comparable cases  
Pattern: Organisation exhibits structural alignment across authority, execution, and narrative. Overextension risk during growth phase is the primary monitoring concern.  
Corridor effect: Maintain diagnostic rigour during growth phase.

**Multi-Session Plateau** (`multi-session-plateau`)  
Prevalence: Notable — observed in roughly a quarter of comparable cases  
Pattern: Repeated engagement without structural progress. Pattern detected across multiple diagnostic sessions.  
Corridor effect: Trigger return brief and checkpoint challenge.

### WATCH Severity

**Intervention Capacity Blocked** (`intervention-blocked`)  
Prevalence: Occasional — observed in fewer than one in five comparable cases  
Pattern: Organisation recognises the intervention required but lacks the structural or operational capacity to receive it. Capacity is the binding constraint, not decision clarity.  
Corridor effect: Restrict intervention plan until capacity blocker is named. Capacity restoration before structural intervention.

---

## 2. Detection Posture Summary

The detection engine accepts the following input variables. These are never surfaced to clients:

| Variable | Range | Notes |
|---|---|---|
| `posture` | SOVEREIGN / ALIGNED / DRIFTING / MISALIGNED / DISORDERED | Derived from prior ER run |
| `authorityType` | DIRECT / DELEGATED / CONTESTED / UNCLEAR | From intake / delta data |
| `readinessTier` | SOVEREIGN / ADVISORY / EXECUTION / FRAGILE | From prior ER run |
| `trajectory` | IMPROVING / STABLE / DETERIORATING / COLLAPSING | From longitudinal engine |
| `failureModeCount` | 0–n integer | From recurrence + ER data |
| `narrativeCoherence` | 0–100 | Internal only, derived score |
| `interventionReadiness` | 0–100 | Internal only, derived score |
| `orgState` | STABLE / SCALING / STRESS / CRISIS | From trajectory + recurrence |
| `sessionCount` | 1–n integer | From recurrence prior count |
| `founderLed` | boolean, optional | From intake if captured |
| `teamSize` | SOLO / SMALL / MID / LARGE | From intake if captured |

Evidence posture for signals:
- `MULTI_SOURCE_CORROBORATED` — multiple diagnostic sessions confirm the pattern
- `SINGLE_SOURCE_INDICATED` — single session with signal-consistent evidence (most common)
- `THEORETICAL_GROUNDED` — pattern is theoretically sound but empirical data is thin
- `THIN_EVIDENCE` — evidence base insufficient to surface to sponsor; signal suppressed

---

## 3. Intervention Implications by Signal

| Signal | Minimum Required Action | Maximum Admissible Claim |
|---|---|---|
| Authority Collapse Under Pressure | Authority resolution process within 21 days | Boardroom-eligible escalation |
| Authority Diffusion Under Revenue Pressure | Authority mapping session with mandate design | Pre-next-revenue-phase decision |
| Execution Fragility Cascade | Immediate Strategy Room intervention | Sequence root causes across failure modes |
| Intervention Capacity Blocked | Capacity restoration before structural intervention | Strategy Room sequencing |
| Narrative Coherence Collapse | Operating-truth audit within 90 days | Strategy Room entry point |
| Second-Line Drift | Mandate redesign before next scaling event | Governance task, not management task |
| Intelligence Debt | Map intelligence flows vs decisions at scale | Three most consequential gaps |
| Sovereign Trajectory | Maintain rigour during growth | Return for structural review at 6 months |
| Founder Identity Lock | Written mandate design | Counsel engagement recommended |
| Multi-Session Plateau | Identify barrier: capacity, mandate, or sequencing | Each requires different intervention |

---

## 4. Escalation Implications

Signal severity maps to escalation tier:

| Severity | Escalation Implication |
|---|---|
| CRITICAL | Boardroom-eligible. Strategy Room posture altered. Operator attention required. |
| ALERT | Oversight signal generated. Strategy Room notified. Sponsor-safe summary available. |
| CONCERN | Oversight cycle flag. Return brief candidate. No automatic escalation. |
| WATCH | Monitoring only. No escalation unless combined with other signals. |

CRITICAL + DETERIORATING trajectory = DISORDERED posture → immediate structured review.  
CRITICAL alone = MISALIGNED posture → Strategy Room blocked pending authority clarification.  
2+ ALERT = MISALIGNED posture → escalation to oversight flagged.  
1 ALERT or DETERIORATING = DRIFTING posture → intervention recommended.

---

## 5. Oversight Implications

Signals feed the oversight layer via `buildOversightSignals()`. Active signal types generated:
- `SOVEREIGN_SIGNAL_CRITICAL_ACTIVE` — CRITICAL signals present; admissible next move included
- `SOVEREIGN_SIGNAL_PATTERN_RECURRING` — 2+ ALERT signals, or withheld patterns in assessment

Recurrence tracking (when present across oversight cycles):
- **First observed** — when the signal pattern was first detected in this case
- **Last observed** — most recent detection
- **Movement** — increasing / stable / reducing / unresolved
- **Retained implication** — what this means for the retained relationship
- **Next review obligation** — what the next oversight cycle must address

---

## 6. Suppression Rules

An operator may review suppressed signals only through the raw engine output on the server side. Suppressed signals are never surfaced to the sponsor layer. Suppression occurs when:

1. Evidence posture is `THIN_EVIDENCE`
2. Signal count exceeds 3 (only top 3 by severity are surfaced; remainder counted as `withheldCount`)
3. Sample posture falls below applicable threshold
4. Operator has applied a `suppressionNotice` via `toSovereignSignalPublicSummary()`

When suppression occurs, a `suppressionNotice: string` field is present in the DTO (not null). The sponsor-visible surface shows the notice without disclosing the reason.

---

## 7. Sample Posture Rules

(Full rules in Operating Doctrine §6. Summary for operator reference:)

- **0–2 records**: "Insufficient retained evidence." No recurrence claim.
- **3–4 records**: Emerging pattern only. No sponsor recurrence claim.
- **5–9 records**: "Retained cohort signal" with caveat.
- **10+ records**: "Cross-scope pattern" allowed. Not "benchmark."
- **Sector claims**: Minimum 3 organisations in the same sector cluster.
- **Benchmark**: Blocked unless explicitly approved.

---

## 8. What Operators Must Not Claim

Regardless of context, operators must never state:

1. The system "predicts" outcomes for any specific organisation.
2. Signals constitute a "diagnosis" of people or teams.
3. Any outcome is "guaranteed" or "likely" based on signal presence alone.
4. The system "automatically" monitors, escalates, or governs.
5. Benchmark data represents verified external standards.
6. Signal detection is exhaustive — signals are based on available evidence and will miss patterns when evidence is thin.
7. The system provides "continuous" intelligence — signals are generated at diagnostic touchpoints, not on a live basis.
