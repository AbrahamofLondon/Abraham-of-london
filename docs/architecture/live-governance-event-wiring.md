# Live Governance Event Wiring

**Date:** 2026-05-25
**Pass:** 3B — Governance Event Bus Wiring

## Overview

The GovernanceEvent bus is now wired into real platform flows. The governed operating architecture stops being declarative and starts behaving live.

## Wired Flows

### 1. ResearchRun Lifecycle (Foundry)

**Status:** LIVE
**Events:** RESEARCH_RUN_CREATED, FINDING_CREATED, ACTION_BRIEF_EXPORTED, FOUNDRY_ACTION_REQUIRED, IMPLEMENTED, ARCHIVED
**Files:** `lib/research/research-run-repository.ts` (via `emitGovernanceEvent`)

Creating, actioning, implementing, and archiving a ResearchRun emits standard GovernanceEvents. Existing FoundryAuditEvent is preserved — GovernanceEvent complements it.

### 2. ER → Boardroom Bridge Simulation

**Status:** LIVE (simulation-only)
**Events:** EXECUTIVE_REPORT_GENERATED, ER_MAPPED_TO_INTELLIGENCE_SPINE, BOARDROOM_QUALIFICATION_EVALUATED, BOARDROOM_DOSSIER_PREVIEWED, BOARDROOM_DOSSIER_EXPORTED_SIMULATED
**Files:** `lib/research/engines/executive-report-boardroom-bridge-adapter.ts`

All bridge simulation events carry `payload.simulation = true` and `payload.noPdfRendered = true`. No real PDF export. No client-facing artefact.

### 3. Outbound Publishing

**Status:** LIVE
**Events:** OUTBOUND_DRAFT_CREATED, OUTBOUND_POLICY_CHECKED, OUTBOUND_APPROVED, OUTBOUND_PUBLISHED, OUTBOUND_SYNCED, OUTBOUND_FAILED
**Files:** `lib/outbound/core/outbound-audit.ts`, `pages/api/admin/outbound/*/publish.ts`

Provider-specific audit is preserved. GovernanceEvent is the shared event spine on top. Dry-run does not emit OUTBOUND_PUBLISHED. Policy blocks are captured as governance events.

### 4. Content / Editorial Checks

**Status:** LIVE (service layer)
**Events:** CONTENT_STYLE_CHECKED, CONTENT_METADATA_VALIDATED, CONTENT_OUTBOUND_ELIGIBLE
**Files:** `lib/platform/content-governance-events.ts`

Content warnings can enter the governance spine instead of living only in console output. Passing style check is audit-light. Failure creates FoundryFinding only when strict mode is used or content is release-bound.

### 5. GMI Release Events

**Status:** LIVE
**Events:** GMI_PRIOR_CALLS_REVIEWED, GMI_QUALITY_GATE_RUN, GMI_RELEASE_APPROVED, GMI_RELEASE_PUBLISHED, GMI_CALL_CARRIED_FORWARD
**Files:** `lib/intelligence/gmi-release-event-recorder.ts`

Existing GMI event recorder is preserved. Shared GovernanceEvent is emitted alongside it. Canonical phrasing is preserved: "Every quarterly report reviews the material calls from the previous quarter before issuing the next one."

## Event Routing Behaviour

| Flag | Behaviour |
|---|---|
| `shouldWriteAudit = true` | Writes audit event |
| `shouldWriteLineage = true` | Writes lineage event |
| `shouldCreateResearchRun = true` | Creates ResearchRun + FoundryFinding |

## Result Types

| Status | Meaning |
|---|---|
| RECORDED | All routing completed successfully |
| PARTIAL | Some routing succeeded, some failed |
| FAILED | Event validation failed or all routing failed |

## Failure Behaviour

- No silent event drops
- No raw stack traces in responses
- Structured `errors[]` array with failure reasons
- Audit failure returns PARTIAL, not silent success
- Invalid event type returns FAILED with explanation

## Simulation-Only Events

These events are clearly marked as simulation-only and must never be mistaken for real exports:

- `BOARDROOM_DOSSIER_PREVIEWED` — payload includes `simulation: true`, `noPdfRendered: true`
- `BOARDROOM_DOSSIER_EXPORTED_SIMULATED` — event type contains `SIMULATED`, payload includes `noClientArtifactCreated: true`

## Remaining Unwired Flows

| Flow | Status | Reason |
|---|---|---|
| Strategy Room case lifecycle | Not yet wired | Requires Strategy Room service integration |
| Enterprise campaign lifecycle | Not yet wired | Requires Enterprise service integration |
| Access grant/revocation | Not yet wired | Requires access service integration |
| Contentlayer metadata validation | Not yet wired | Script-level, no runtime DB access |

## Governance Event Bus API

```typescript
// Emit a fully-specified event
emitGovernanceEvent(event: GovernanceEvent): Promise<GovernanceEventResult>

// Create and emit from params
routeGovernanceEvent(params): Promise<GovernanceEventResult>

// Create event with defaults from registry
createGovernanceEvent(params): GovernanceEvent

// Validate without emitting
validateGovernanceEvent(event): string[]
```
