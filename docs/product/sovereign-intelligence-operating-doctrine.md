# Sovereign Intelligence — Operating Doctrine

**Classification:** INTERNAL_OPERATOR_ONLY  
**Version:** 1.0  
**Authority:** Abraham of London Engineering and Product

This document is the single source of truth for what Sovereign Intelligence is, how it operates, what it may and may not claim, and how it affects the governed decision corridor. All product copy, operator communications, and system behaviour must conform to this doctrine. Deviations require explicit product authority sign-off.

---

## 1. What Sovereign Intelligence Is

Sovereign Intelligence is the pattern-intelligence layer of Abraham of London's Governed Decision Intelligence corridor.

It identifies recurring institutional decision patterns across six structural dimensions:
- **Authority** — who holds effective decision authority; whether that authority is clear, delegated, contested, or absent
- **Execution** — whether the organisation can execute decisions once made; what blocks or fragments execution
- **Narrative coherence** — whether the stated operating truth matches the observable evidence
- **Intervention capacity** — whether the organisation has the structural ability to receive and absorb intervention
- **Retained memory** — whether prior patterns, failures, and decisions compound into institutional learning
- **Evidence posture** — the basis and strength of the available evidence for any signal

Each signal is a named, pattern-matched institutional observation. It is drawn from the diagnostic dataset, calibrated against observable case variables, and mapped to prevalence bands derived from comparable cases in the Intelligence Commons.

Signals are not scores. They are not ratings. They are named patterns that have documented trajectories — and they are surfaced only when evidence meets the applicable posture threshold.

---

## 2. What Sovereign Intelligence Is Not

**It is not a replacement for the decision corridor.**  
Sovereign Intelligence supports escalation, board exposure, strategy-room posture, and retained oversight. It does not short-circuit the corridor or substitute for its stages.

**It does not create autonomous conclusions.**  
No signal constitutes a determination about a specific person, organisation, or outcome. Signals represent observed institutional tendencies, not verdicts.

**It does not expose raw detection logic.**  
Detection predicates, scoring weights, formula components, and internal thresholds are classified SERVER_ONLY_ENGINE. They are never serialised to a client surface, API response, or operator-visible field.

**It does not claim benchmark authority without sample basis.**  
Prevalence bands are derived from the Intelligence Commons dataset. Where the dataset is thin, signals are suppressed or marked as theoretically grounded. No benchmark claim is valid without explicit sample posture disclosure.

**It does not guarantee outcomes.**  
Signal patterns represent observed tendencies, not determinate predictions. Individual organisations may differ materially from dataset patterns.

**It does not support "autonomous oversight," "continuous monitoring," or "predictive certainty."**  
These phrases are specifically prohibited. The system provides governed, evidence-based signal surfacing — not automated surveillance.

---

## 3. How Signals Are Generated

Signals are generated server-side only by `detectIntelligenceSignals()` in `lib/sovereign/intelligence-signals.ts`.

Input variables accepted:
- `posture` — current institutional posture (SOVEREIGN / ALIGNED / DRIFTING / MISALIGNED / DISORDERED)
- `authorityType` — DIRECT / DELEGATED / CONTESTED / UNCLEAR
- `readinessTier` — SOVEREIGN / ADVISORY / EXECUTION / FRAGILE
- `trajectory` — IMPROVING / STABLE / DETERIORATING / COLLAPSING
- `failureModeCount` — number of active failure modes (0–n)
- `narrativeCoherence` — 0–100 score (internal, not surfaced)
- `interventionReadiness` — 0–100 score (internal, not surfaced)
- `orgState` — STABLE / SCALING / STRESS / CRISIS
- `sessionCount` — number of sessions in this case
- `founderLed` — boolean, optional
- `teamSize` — SOLO / SMALL / MID / LARGE

Output: `IntelligenceSignal[]` — raw engine format. **This type must never cross the API boundary.**

Before any signal reaches a client surface, it must be mapped through `toSovereignSignalPublicSummary()` or `buildSovereignSignalAssessment()` in `lib/sovereign/sovereign-signal-public-dto.ts`.

The public-safe DTO (`SovereignSignalPublicSummary`) exposes:
- Signal ID and display name
- Severity band (CRITICAL / ALERT / CONCERN / WATCH)
- Confidence band (CONFIRMED / INDICATED / POSSIBLE / INSUFFICIENT)
- Evidence posture
- Prevalence label (qualitative — no raw percentage)
- Narrative summary
- Outcome distribution summary (qualitative prose — no raw percentages)
- Differentiator summary
- Admissible next move (tied to corridor)
- Suppression notice (if applicable)
- Sample caveat (always present)
- Brief slug (link to supporting content)

The assessment container (`SovereignSignalAssessment`) enforces a maximum of 3 signals per surface. Signals are sorted by severity. Withheld count is reported but withheld signals are never listed.

---

## 4. What Is Suppressed

The following are always withheld from public surfaces:

| Suppressed Item | Reason |
|---|---|
| Detection predicates | IP boundary — never exposed |
| Score weights and formula components | IP boundary — never exposed |
| Raw prevalence percentages | IP protection — exposed as qualitative label only |
| Raw outcome percentages | IP protection — exposed as qualitative prose only |
| Signals beyond the top 3 | Surface discipline — `withheldCount` reported only |
| Signals with THIN_EVIDENCE posture | Evidence standard — surfaces show suppression notice |
| Internal scoring thresholds | IP boundary — never exposed |
| Signal detection conditions | IP boundary — never exposed |

In addition, when evidence is insufficient (fewer than one completed diagnostic stage), `buildInsufficientEvidenceAssessment()` is returned and no signals are surfaced.

---

## 5. How Signals Affect the Corridor

Sovereign signals are not decorative. Each active signal must affect at least one corridor surface:

### Strategy Room
Signals alter intervention posture. Rules:

| Signal | Posture Effect |
|---|---|
| Authority Collapse Under Pressure | Require authority clarification before execution path is confirmed |
| Authority Diffusion Under Revenue Pressure | Require named decision owner and escalation owner |
| Execution Fragility Cascade | Require checkpoint and dependency confirmation |
| Intervention Capacity Blocked | Restrict intervention plan until capacity blocker is named |
| Narrative Coherence Collapse | Require evidence clarification before board/counsel escalation |
| Second-Line Drift Under Scaling | Flag for sponsor/operator attention |
| Intelligence Debt in Scaling Organisation | Require retained memory or oversight recommendation |
| Multi-Session Plateau | Trigger return brief / checkpoint challenge |
| Founder Identity Operational Lock | Flag boardroom/counsel sensitivity — do not overstate |

When a CRITICAL signal is active, the Strategy Room must surface "Signal Pressure Affecting This Intervention" with explicit posture consequence. The intervention path should not be confirmed without the clarification the signal requires.

### Boardroom
Top 1–3 signals appear in the "Institutional Signal Exposure" section. Each signal is presented in board-readable language:
- What the board should understand
- Evidence posture
- Anticipated objection
- What evidence would strengthen the signal
- What evidence would weaken the signal
- Recommended board posture

Signals support board questions — they do not replace board judgement.

### Oversight
Signals feed the `SOVEREIGN_SIGNAL_CRITICAL_ACTIVE` and `SOVEREIGN_SIGNAL_PATTERN_RECURRING` oversight signal types. Recurrence across cycles is tracked with: first observed, last observed, current posture, movement (increasing / stable / reducing / unresolved), retained implication, next review obligation.

### Portfolio Memory
Sovereign signals feed portfolio pattern recurrence when sample posture is met. Below threshold, recurrence claims are suppressed.

---

## 6. Sample Posture Rules

These rules govern what language may be used at each evidence level. They are enforced by guard scripts and must not be overridden in product copy.

| Record Count | Permitted Language |
|---|---|
| 0–2 | "Insufficient retained evidence." No recurrence claim. |
| 3–4 | "Emerging pattern — internal tracking only." No sponsor-level recurrence claim. |
| 5–9 | "Retained cohort signal" with caveat. No "benchmark" language. |
| 10+ | "Cross-scope pattern" language permitted. Still not "benchmark." |
| Any | "Benchmark" language requires explicit product authority approval. |

For sector or industry-level claims: minimum 3 organisations in the same sector cluster required. Sector claims must always carry a sample caveat.

Sample posture labels used in UI:
- `Insufficient sample`
- `Emerging recurrence`
- `Retained cohort signal`
- `Cross-scope pattern`
- `Sector sample not yet mature`

---

## 7. Operator-Use Rules

Operators (product team, advisors, customer-facing staff) may:
- Reference signal names and severity bands
- Reference evidence posture labels
- Share sponsor-safe signal summaries with clients
- Reference the Intelligence Commons as a dataset with theoretical grounding
- Discuss signal prevalence using the qualitative label (e.g., "common — observed in more than a third of comparable cases")

Operators must not:
- Share raw detection predicates, thresholds, or formula weights with anyone
- Claim "verified benchmark" authority for any signal
- Represent signals as determinate predictions or guaranteed outcomes
- Use phrases: "Sovereign AI," "secret intelligence," "quantum signal," "automated oversight," "continuous monitoring," "predictive certainty," "market-wide proof," "algorithmic truth"
- Surface more than 3 signals per engagement without product authority review
- Suppress signal caveats or evidence posture disclosures

---

## 8. Sponsor-Safe Language

These phrases are approved for sponsor-facing communication:

**Approved:**
- "Institutional signal"
- "Signal pressure"
- "Observed pattern"
- "Evidence posture"
- "Pattern recurrence"
- "Intervention implication"
- "Board relevance"
- "Retained memory implication"
- "Sample caveat"
- "Suppressed detail"
- "Intelligence Commons"
- "Comparable cases"
- "Governed diagnostic corridor"

**Forbidden in sponsor-facing copy:**
- "Sovereign AI" — implies AI mystique not warranted by the system
- "Verified benchmark" — implies external validation not present
- "Automated oversight" — implies autonomous monitoring not present
- "Predictive certainty" — implies deterministic forecasting not present
- "Market-wide proof" — implies population-level evidence not established
- "Continuous monitoring" — implies live surveillance not present

---

## 9. Forbidden Claims

The following claims must never appear in any system output, product copy, operator material, or client communication:

1. "We benchmark organisations." — Benchmarking implies comparative authority against external standards. The system provides percentile bands from the Intelligence Commons dataset with explicit sample posture. It does not benchmark.
2. "We predict outcomes." — Signals represent tendencies, not predictions. Outcome language must be qualitative and caveated.
3. "We automate governance." — Governance is governed by humans through the corridor. The system supports it, does not automate it.
4. "We have Sovereign AI." — The term implies a level of autonomous intelligence the system does not possess and that this product does not claim.
5. "We verify institutional improvement." — Improvement is observed and reported. It is not verified by the system independent of human confirmation.

---

## 10. Commercial Leverage

When the sovereign signal layer is operating correctly across Strategy Room, Boardroom, Oversight, and Portfolio Memory, the defensible commercial statement is:

> Abraham of London does not merely assess decisions. It detects recurring institutional decision patterns across authority, execution, intervention capacity, narrative coherence, and retained memory. Those signals do not sit in a report. They affect escalation, board posture, strategy-room intervention, and oversight cadence.

Five conditions make the product hard to compete with:
1. Every user action creates memory.
2. Every memory can affect future progression.
3. Every signal can change governance posture.
4. Every escalation is evidence-earned.
5. Every retained cycle compounds intelligence that leaving would destroy.

That is the moat. The moat is compound governed memory under evidence discipline.

The product becomes commercially invincible when the prospect understands that their intelligence history — the patterns, the recurrences, the signals, the governed memory — exists inside the corridor and nowhere else. Leaving means losing the institutional memory that was built with them.

Say:
> We preserve governed decision memory. We surface recurring institutional signals. We restrict escalation when evidence is weak. We support board, counsel, and oversight posture with source-labelled intelligence.

Do not say what we cannot prove. Say exactly what we can.
