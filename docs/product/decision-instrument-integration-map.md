# Decision Instrument Integration Map

> Goal: Each instrument writes to the canonical case record, updates the intelligence spine, and recommends the next stage.

## Current Instruments

| Instrument | Route | Purpose | Spine integration |
|-----------|-------|---------|-------------------|
| Decision Exposure | `/decision-instruments/decision-exposure-instrument/run` | Quantify exposure from unresolved decisions | Should write exposure data to spine |
| Mandate Clarity | `/decision-instruments/mandate-clarity-framework/run` | Clarify mandate and authority | Should write authority data to spine |
| Intervention Path Selector | `/decision-instruments/intervention-path-selector/run` | Select intervention approach | Should write to intervention stack |
| Operator Decision Pack | `/decision-instruments/operator-decision-pack/run` | Comprehensive operator toolkit | Should write to case object |

## Canonical Integration Pattern

Each instrument MUST:

1. **Declare position in journey**: Where does this instrument fit in the diagnostic ladder?
2. **Read from spine**: Load existing intelligence if available (via `loadSpineFromSession()`)
3. **Write to case record**: Output should update the case object or create evidence nodes
4. **Update intelligence spine**: Call `advanceSpine()` or `enrichSpine()` with findings
5. **Create ledger entry**: Optionally record to decision ledger via `recordLedgerEntry()`
6. **Recommend next stage**: Output should include `recommendedNextStage` field
7. **Feed Executive Reporting**: Output should be consumable by canonical sections assembly

## Integration per Instrument

### Decision Exposure Instrument
- **Position**: After Fast Diagnostic, before Executive Reporting
- **Spine write**: `exposureScore`, `exposureBand`, financial data (if declared)
- **Ledger entry**: `source: "instrument"`, `decision: exposure assessment`
- **Recommends**: Executive Reporting (if exposure HIGH/CRITICAL) or Strategy Room (if CRITICAL)

### Mandate Clarity Framework
- **Position**: After Constitutional Diagnostic, before Team Assessment
- **Spine write**: `authorityType`, `mandateClarity`, `delegationGaps`
- **Ledger entry**: `source: "instrument"`, `decision: mandate assessment`
- **Recommends**: Team Assessment (if mandate unclear) or Strategy Room (if mandate DIRECT and urgent)

### Intervention Path Selector
- **Position**: After Enterprise Assessment, before Strategy Room
- **Spine write**: `selectedIntervention`, `interventionPriority`, `riskIfIgnored`
- **Ledger entry**: `source: "instrument"`, `decision: intervention selection`
- **Recommends**: Strategy Room (with selected intervention pre-loaded)

### Operator Decision Pack
- **Position**: Standalone entry or after Fast Diagnostic
- **Spine write**: Full case object update with operator-level detail
- **Ledger entry**: `source: "instrument"`, comprehensive
- **Recommends**: Constitutional Diagnostic (for structural assessment) or Executive Reporting (for consequence pricing)

## Implementation Priority

1. **P1**: Add `loadSpineFromSession()` and `enrichSpine()` calls to each instrument's result handler
2. **P2**: Add `recommendedNextStage` to each instrument's output type
3. **P3**: Wire ledger entry creation into instrument completion flow
