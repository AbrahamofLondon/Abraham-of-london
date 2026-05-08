# Evidence Carry-Forward UX Integrity Audit

## Scope

Audited surfaces:

- Executive Reporting
- Strategy Room entry
- Strategy Room session
- Return Brief
- Oversight Brief
- Control Room loader and sponsor-safe consumers
- Decision Centre

## Verdict

The carry-forward pass is now visible in the right high-consequence journey moments, but the UX integrity is uneven.

- Strongest surface: Return Brief
- Most operationally useful surface: Strategy Room
- Best restraint on unverified claims: Executive Reporting
- Most underused surface: Control Room sponsor-safe consumers
- Most materially missing surface: Decision Centre
- Primary UX risk: the same carry-forward block is reused across Executive Reporting, Strategy Room entry, and Strategy Room session without enough role-specific hierarchy

## Surface Audit

### Executive Reporting

1. Is the evidence visible where it matters?
   Yes. It appears immediately after the board snapshot, which is the correct consequence layer.
2. Is it labelled as captured/reported/declared rather than verified?
   Mostly yes. `The user reports prior correction attempts` and `The pattern is reported as recurring` are safe.
3. Is unsafe or respondent-sensitive text suppressed?
   Yes. Unsafe text is replaced with `Evidence captured but withheld from display.`
4. Does the user understand why this evidence matters?
   Partially. The block title is strong, but the causal link to recommendation quality is implied rather than stated.
5. Does the surface show how the evidence affects the next action?
   Partially. `Decision dependency` and `Escalation condition` do this well; `Failure cause` and `Prior attempts` need a clearer action implication.
6. Is the same evidence repeated too many times?
   Not on this page.
7. Does the evidence improve the journey or clutter it?
   It improves the journey. The placement is restrained.
8. Does the language protect IP?
   Yes. It avoids exposing engine mechanics.
9. Does it feel like institutional memory, not form recap?
   Mostly yes, though the generic row structure still feels slightly recap-like.
10. Does the surface use the evidence according to its role?
   Yes. This surface should frame consequence and continuity, not re-argue diagnosis.

### Strategy Room Entry

1. Is the evidence visible where it matters?
   Yes. It appears just before `FirstActionPrompt`, which is the correct handoff point.
2. Is it labelled as captured/reported/declared rather than verified?
   Mixed. `Known failure cause` is acceptable, but stronger than `reported failure cause`.
3. Is unsafe or respondent-sensitive text suppressed?
   Yes.
4. Does the user understand why this evidence matters?
   Yes. `Execution is constrained by what has already failed, repeated, or remained unverified` is effective.
5. Does the surface show how the evidence affects the next action?
   Yes. The Strategy Room labels are operational.
6. Is the same evidence repeated too many times?
   Yes, once the user later reaches the session page. The same block appears twice in the Strategy Room flow.
7. Does the evidence improve the journey or clutter it?
   It improves the entry stage, but duplication weakens the later session.
8. Does the language protect IP?
   Yes.
9. Does it feel like institutional memory, not form recap?
   Yes, more than Executive Reporting.
10. Does the surface use the evidence according to its role?
   Yes. This is the best role fit after Return Brief.

### Strategy Room Session

1. Is the evidence visible where it matters?
   Yes, but it sits very close to the later `Evidence Case` block.
2. Is it labelled as captured/reported/declared rather than verified?
   Mixed. Same issue as entry page.
3. Is unsafe or respondent-sensitive text suppressed?
   Yes.
4. Does the user understand why this evidence matters?
   Yes, but less clearly than in entry because the session already contains several other execution panels.
5. Does the surface show how the evidence affects the next action?
   Yes, though some of that effect is duplicated by `Constraint Map`, `Execution Intelligence`, and `Decision Frame`.
6. Is the same evidence repeated too many times?
   Yes. This is the clearest repetition problem in the flow.
7. Does the evidence improve the journey or clutter it?
   Mixed. It still helps, but it risks becoming another panel among many.
8. Does the language protect IP?
   Yes.
9. Does it feel like institutional memory, not form recap?
   Borderline. The repeated shared component starts to feel like recap rather than memory.
10. Does the surface use the evidence according to its role?
   Partially. Session should likely show a shorter memory reminder, not the full entry-grade block again.

### Return Brief

1. Is the evidence visible where it matters?
   Yes. It appears before contradiction re-exposure, which is exactly right.
2. Is it labelled as captured/reported/declared rather than verified?
   Yes. `The original evidence suggested...` and `The system cannot yet verify...` are the correct standard.
3. Is unsafe or respondent-sensitive text suppressed?
   Yes.
4. Does the user understand why this evidence matters?
   Yes. This is the strongest surface in the pass.
5. Does the surface show how the evidence affects the next action?
   Yes. It ties prior claims to current unresolved status.
6. Is the same evidence repeated too many times?
   No. It is transformed, not repeated.
7. Does the evidence improve the journey or clutter it?
   It materially improves the journey.
8. Does the language protect IP?
   Yes. It uses disciplined institutional phrasing without exposing mechanics.
9. Does it feel like institutional memory, not form recap?
   Yes. This is the clearest example of memory becoming felt.
10. Does the surface use the evidence according to its role?
   Yes. This is the best role-aligned use in the audited set.

### Oversight Brief

1. Is the evidence visible where it matters?
   Indirectly. It influences signals, but the evidence continuity is not explicitly legible as carried assessment memory.
2. Is it labelled as captured/reported/declared rather than verified?
   Mostly yes, but some signal phrasing is stronger than ideal.
3. Is unsafe or respondent-sensitive text suppressed?
   Mostly yes. It uses summaries and signals rather than raw text in the sponsor-facing page.
4. Does the user understand why this evidence matters?
   Partially. The signals are useful, but the origin in captured governance history is not obvious.
5. Does the surface show how the evidence affects the next action?
   Yes. Recommended actions are clear.
6. Is the same evidence repeated too many times?
   No.
7. Does the evidence improve the journey or clutter it?
   It improves the logic, but the UX does not yet fully reveal that improvement.
8. Does the language protect IP?
   Yes overall.
9. Does it feel like institutional memory, not form recap?
   Partially. It feels like signals, not yet memory.
10. Does the surface use the evidence according to its role?
   Partially. Correct as internal oversight logic; under-expressed as sponsor-safe continuity.

### Control Room Loader / Sponsor-Safe Consumers

1. Is the evidence visible where it matters?
   Not yet in any clear sponsor-safe consumer found in this audit.
2. Is it labelled as captured/reported/declared rather than verified?
   The loader is safe, but no visible consumer means the UX question is still open.
3. Is unsafe or respondent-sensitive text suppressed?
   Yes. Only aggregate counts are stored.
4. Does the user understand why this evidence matters?
   No, because it is not yet surfaced.
5. Does the surface show how the evidence affects the next action?
   Not yet.
6. Is the same evidence repeated too many times?
   No.
7. Does the evidence improve the journey or clutter it?
   Currently neutral because it remains hidden.
8. Does the language protect IP?
   Yes.
9. Does it feel like institutional memory, not form recap?
   At loader level yes, but no consumer proves it.
10. Does the surface use the evidence according to its role?
   No. It is prepared but not surfaced.

### Decision Centre

1. Is the evidence visible where it matters?
   No evidence of the new carry-forward fields being consumed was found.
2. Is it labelled as captured/reported/declared rather than verified?
   Not applicable.
3. Is unsafe or respondent-sensitive text suppressed?
   Not applicable for the new fields because they are absent.
4. Does the user understand why this evidence matters?
   No.
5. Does the surface show how the evidence affects the next action?
   No.
6. Is the same evidence repeated too many times?
   No.
7. Does the evidence improve the journey or clutter it?
   It currently does neither because it is missing.
8. Does the language protect IP?
   Existing page has its own IP-exposure considerations, but not from this carry-forward pass.
9. Does it feel like institutional memory, not form recap?
   Not for the new evidence fields.
10. Does the surface use the evidence according to its role?
   No. Decision Centre is the clearest downstream omission.

## Surfaces Where Evidence Is Underused

- Control Room sponsor-safe consumers: aggregate evidence counts are prepared in the loader but not surfaced anywhere found in this audit.
- Oversight Brief: evidence affects signals, but the sponsor-facing surface does not make the continuity source legible enough.
- Decision Centre: no evidence of the new carry-forward fields being consumed.
- Strategy Room session: the evidence is visible, but not sufficiently transformed from entry-stage carry-forward into session-specific memory.

## Surfaces Where Evidence Is Overexposed

- Strategy Room overall flow: the same shared block appears in both entry and session states with only minimal adaptation.
- Strategy Room session specifically: the carry-forward panel sits close to `Evidence Case`, `Decision Frame`, and `Constraint Map`, which risks panel inflation.

## Copy That Overclaims Or Leans Too Hard

### Current

- `Known failure cause`
- `Escalation condition appears active`
- `Intervention failure risk remains active`

### Replacement

- `Known failure cause`
  Replace with: `Reported failure cause`
- `Escalation condition appears active`
  Replace with: `Captured escalation threshold may now be engaged`
- `Intervention failure risk remains active`
  Replace with: `Earlier failure logic may still be unresolved`

## Copy That Is Strong And Should Be Preserved

- `The reading is complete. The next step is evidence discipline.`
- `Execution is constrained by what has already failed, repeated, or remained unverified.`
- `The original evidence suggested...`
- `The system cannot yet verify...`
- `Evidence captured but withheld from display.`

## Recommended Hierarchy For Each Evidence Block

### Executive Reporting

1. Title: `Evidence carried forward`
2. One-line meaning: why the report should not recommend what has already failed
3. Only the two or three most decision-relevant rows
4. Action consequence: what this changes about the recommendation

### Strategy Room Entry

1. Title: `Execution readiness`
2. One-line constraint framing
3. Blocking items first:
   dependency, stop signal, failure cause
4. Verification standard second
5. Escalation threshold last

### Strategy Room Session

1. Shorter title, ideally session-specific
2. Only unresolved memory items, not the full carry-forward set
3. One explicit line linking memory to current execution discipline
4. Avoid duplicating what the later `Evidence Case` block already covers

### Return Brief

1. Title: `Evidence carried forward`
2. Verification continuity first
3. Failure-pattern continuity second
4. Recurrence continuity third
5. Stop-condition continuity fourth

### Oversight Brief

1. Signal title
2. Sponsor-safe explanation
3. Why the earlier evidence still matters
4. Required action

### Control Room Sponsor-Safe Consumer

1. Aggregate-only title such as `Governance evidence history`
2. Count summary only
3. Small-sample suppression notice
4. Action implication for sponsor/operator review

### Decision Centre

1. Short continuity block on the case card or case detail
2. One sentence: what has already been tried
3. One sentence: what remains unresolved
4. One sentence: what would count as proof of improvement

## Role-Fit Assessment

- Executive Reporting: good role fit
- Strategy Room entry: strong role fit
- Strategy Room session: only partial role fit due to duplication
- Return Brief: excellent role fit
- Oversight Brief: strong logic fit, incomplete UX fit
- Control Room: prepared in logic, not yet proven in UX
- Decision Centre: not yet using the feature according to role

## Recommended Next Non-Code Actions

- Decide whether Strategy Room session should show a compressed memory reminder rather than the full carry-forward block.
- Decide whether Oversight Brief should expose a sponsor-safe `carried evidence history` line beneath selected signals.
- Decide whether Control Room should surface the new aggregate counts in sponsor-safe form.
- Decide whether Decision Centre should admit a restrained continuity block before any further spread of the pattern recurrence UI.
