# Memory Reliability Audit

## Scope

Audited memory labels and surfaces:

1. `Evidence carried forward` — Executive Reporting
2. `Execution memory` — Strategy Room entry
3. `Unresolved execution memory` — Strategy Room session
4. `Against your prior standard` — Return Brief
5. `Continuity source` — Oversight Brief structured actions
6. `Governance Evidence Coverage` — Control Room / enterprise loader
7. `Case memory` — Decision Centre

## Strategic Verdict

The current memory layer is **good enough for controlled market entry**, but **not yet strong enough to support aggressive £15k / £50k claims without qualification**.

The strongest paths are:

- Return Brief
- Oversight Brief structured actions
- Control Room aggregate coverage

The weakest paths are:

- Decision Centre case memory
- Executive Reporting memory framing
- Strategy Room memory blocks as currently undated and only lightly source-labelled

The main institutional risk is not raw privacy leakage. The main risk is **memory overclaim**: users may reasonably infer that the system knows, verified, or dated more than it actually does.

## Fully Reliable Memory Paths

### Return Brief

Classification:

- `GOVERNED_MEMORY`
- `SAFE_SELF_REPORTED_MEMORY`

Why:

- Uses server-side `canonicalSnapshot` from the Strategy Room execution session
- Retrieves prior carried evidence from persisted snapshot, not from browser storage
- Uses proportionate language: `The original evidence suggested...`, `The system cannot yet verify...`
- Clearly distinguishes prior declared standards from current verification

Limitations:

- The carried evidence itself may still be self-reported
- The UI does not visibly date the original evidence source

### Oversight Brief Structured Actions

Classification:

- `GOVERNED_MEMORY`
- `SAFE_SELF_REPORTED_MEMORY`

Why:

- Built from server-side journey stages, evidence nodes, decision objects, and oversight signal assembly
- Client-safe suppression remains in place
- `Continuity source` makes the source of the action legible without exposing raw respondent detail

Limitations:

- Signal strength is mixed; not all continuity sources are equally strong
- Some structured actions still derive from summarised self-report rather than verified operator evidence

### Control Room Evidence Coverage

Classification:

- `AGGREGATE_ONLY_MEMORY`

Why:

- Derived from server-side journey stage payloads
- Only aggregate counts are exposed
- Suppression remains active when aggregation safety is insufficient

Limitations:

- Coverage is reliable as coverage, not as condition truth
- Safe consumer exposure is still partial and not yet broadly legible in sponsor-facing product flow

## Partially Reliable Memory Paths

### Executive Reporting

Classification:

- `SAFE_SELF_REPORTED_MEMORY`
- `DISPLAY_ONLY_MEMORY`
- `OVERCLAIM_RISK`

Why:

- Reads evidence from server-returned canonical payload and intake context
- Upstream evidence can originate from sessionStorage ladder context before becoming server-persisted
- UI is restrained, but the title `Evidence carried forward` can imply stronger institutional continuity than is actually visible

Reliability gaps:

- Not visibly source-labelled beyond implication
- Not visibly dated
- Not clearly separated into self-reported vs verified

### Strategy Room Entry

Classification:

- `SAFE_SELF_REPORTED_MEMORY`
- `DISPLAY_ONLY_MEMORY`
- `OVERCLAIM_RISK`

Why:

- Built from merged thread evidence, executive result, and canonical payload
- Canonical payload becomes persisted once session/execution records are created
- Appropriate execution framing, but still not visibly dated or source-labelled

Reliability gaps:

- “Execution memory” is meaningful, but audience is not shown whether this is inherited from self-report, contradiction graph, or verified follow-up
- Merged evidence across sources can flatten provenance

### Strategy Room Session

Classification:

- `SAFE_SELF_REPORTED_MEMORY`
- `STALE_OR_UNDATED_MEMORY`
- `OVERCLAIM_RISK`

Why:

- Uses persisted execution `canonicalSnapshot`
- Suppresses if no fields exist
- Shows only compressed unresolved items

Reliability gaps:

- “Unresolved” is inferred from field presence, not always from explicit downstream state resolution
- No visible dating, source, or supersession logic
- Could crowd execution if stale items remain attached with no freshness marker

### Decision Centre

Classification:

- `DISPLAY_ONLY_MEMORY`
- `STALE_OR_UNDATED_MEMORY`
- `MISSING_TRACE`
- `OVERCLAIM_RISK`

Why:

- UI is compact and restrained
- However, API derives case memory by reloading journey scope using `email` and `organisation`, then merging all stage payloads found in that journey

Reliability gaps:

- No visible source label
- No visible date
- No visible distinction between current vs superseded evidence
- Not clearly tied to a case-specific moment
- User could infer stronger case continuity than is actually guaranteed

## Memory Theatre Risks

### Decision Centre Case Memory

Risk:

- The label suggests durable case memory, but the pathway is not yet strongly case-scoped, dated, or source-labelled enough to defend that claim at premium price points.

### Strategy Room Session Unresolved Memory

Risk:

- “Unresolved” sounds stronger than “still present in carried evidence.”
- Without resolution timestamps or explicit state checks, this can drift into memory theatre.

### Executive Reporting Evidence Carried Forward

Risk:

- The report is correct to inherit prior evidence, but the visible continuity framing does not yet show enough provenance to support a strong institutional-memory interpretation.

## Unsafe Memory Exposure Risks

Current privacy posture is materially strong.

Low exposure risk surfaces:

- Return Brief
- Oversight Brief client-safe output
- Control Room aggregate coverage

Main residual risks:

- Summarised self-report can still carry sensitive accusation language if the unsafe matcher misses it
- Merged evidence pathways may lose enough provenance that an operator could overread confidence

## Missing Source Labels

Missing or too light:

- Executive Reporting
- Strategy Room entry
- Strategy Room session
- Decision Centre

Adequate:

- Return Brief, because the language explicitly says `The original evidence suggested...`
- Oversight Brief structured actions, because `Continuity source` now signals origin even if not with exact date
- Control Room, because aggregate coverage does not pretend to be raw source memory

## Direct Answers To Required Questions

### 1. Is Decision Centre case memory reliable enough to be called memory?

Not fully. It is **not yet governed enough** to support strong market claims without softening. It is best classified as **partial case memory** rather than robust governed memory.

### 2. Is Return Brief using prior standards correctly, or merely displaying prior text?

Correctly enough. It does more than display prior text because it compares prior declared standards against current outcome and recurrence posture. It is the strongest current implementation.

### 3. Does Strategy Room session show only active unresolved memory, or does it crowd execution?

It is improved, but still not fully reliable. The session version is compressed, yet “unresolved” is not always backed by explicit freshness or resolution state.

### 4. Does Oversight Brief distinguish strong signals from weak signals?

Partially. It distinguishes them better than the other surfaces, but continuity-source evidence is still mixed between self-reported, derived, and stronger operational evidence.

### 5. Does Control Room expose evidence coverage safely enough for sponsors?

Yes. It is safe enough because it remains aggregate-only and suppressed when unsafe.

### 6. Are any memory items undated, unsourced, or client-side only?

Yes.

- Executive Reporting: unsourced and undated in UI
- Strategy Room entry: unsourced and undated in UI
- Strategy Room session: unsourced and undated in UI
- Decision Centre: unsourced, undated, and weakly traced at case level
- Constitutional thread continuity remains partly client-side in some ladder handoffs

### 7. Are any labels too confident for self-reported evidence?

Yes.

- `Unresolved execution memory`
- `Evidence carried forward`
- `Case memory`

These are usable, but each would benefit from stronger visible source or date context before premium escalation.

### 8. What memory items should be suppressed, softened, or source-labelled?

Soften:

- Decision Centre `Case memory`
- Strategy Room session `Unresolved execution memory`

Source-label:

- Executive Reporting
- Strategy Room entry
- Strategy Room session
- Decision Centre

Suppress only when unsafe:

- Any raw or lightly summarised self-report that escapes the unsafe-content matcher

### 9. What must be persisted better before market use?

- Case-specific carried evidence lineage for Decision Centre
- Resolution/supersession state for Strategy Room session memory items
- Source timestamps for surfaced carry-forward blocks

### 10. What must be surfaced better before £15k/£50k positioning?

- Source labels
- Memory dates
- Self-reported vs verified distinction
- Explicit statement of when memory is inherited from earlier user-reported evidence rather than operator-verified evidence

## Recommended Low-Risk Fixes

- Add source labels to Executive Reporting, Strategy Room, and Decision Centre memory blocks.
- Add a visible `captured earlier` or `inherited from prior assessment` timestamp where available.
- Add case-specific evidence lineage to Decision Centre instead of broad journey-scope merge.
- Add supersession logic so Strategy Room session shows only memory that has not been contradicted by later verification.
- Add audience-safe strength markers such as `reported`, `declared`, `tracked`, `verified`.

## Market Entry Judgement

For controlled market entry:

- Yes, with disciplined claims.

For strong premium claims:

- Not yet fully. The current layer supports **institutional continuity** but not yet **fully defendable governed memory** across every premium surface.

Recommended public positioning standard:

- Treat Return Brief, Oversight, and aggregate Control Room coverage as credible premium memory.
- Treat Executive Reporting and Strategy Room memory as inherited governance context.
- Treat Decision Centre memory as provisional until case-specific lineage and dating are hardened.
