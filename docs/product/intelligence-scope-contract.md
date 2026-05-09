# Intelligence Scope Contract

Date: 2026-05-09
Status: Implemented for shared runtime intelligence surfaces

## Core Rule

If it is not scoped, it is not intelligence.
If it is not dated, it is not memory.
If it is not sourced, it is not evidence.

## Scope Types

### Case-scoped

Use when the intelligence belongs to one governed case, journey, report, or execution session.

Required:

- `caseId` when available
- one of:
  - `journeyId`
  - `strategyRoomSessionId`
  - `executiveRunId`
- `sourceSurface`
- `scopeLabel`
- `scopeType: "CASE"`

### Account-scoped

Use only for explicit account-wide memory surfaces such as `/intelligence/memory` and `/intelligence/contradictions`.

Required:

- `sourceSurface`
- `scopeLabel`
- `scopeType: "ACCOUNT"`

Rule:

- The UI must visibly say `Account-wide view`.
- The UI must render disciplined empty/thin states instead of pretending a single-case reading.

### Organisation-scoped

Reserved for future aggregate intelligence where multiple cases are grouped under one institution.

Required:

- `organisationId`
- `sourceSurface`
- `scopeLabel`
- `scopeType: "ORGANISATION"`

### Operator-scoped

Reserved for internal/admin/operator tooling.

Required:

- `sourceSurface`
- `scopeLabel`
- `scopeType: "OPERATOR"`

Rule:

- Operator-scoped surfaces must not be imported into public or authenticated-user routes.

## Runtime Type

Implemented shared type:

```ts
type IntelligenceScope = {
  userId?: string | null;
  userEmail?: string | null;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
  organisationId?: string | null;
  sourceSurface: string;
  scopeLabel: string;
  scopeType: "CASE" | "ACCOUNT" | "ORGANISATION" | "OPERATOR";
};
```

## Data Quality States

Implemented:

- `EMPTY`
- `THIN`
- `CASE_SCOPED`
- `ACCOUNT_SCOPED`
- `MATURE`

### Empty

Definition:

- No matched case-bound intelligence exists for the current scope.

Required UI behavior:

- Explain why nothing is shown.
- Give the next action.

### Thin

Definition:

- Some data exists, but not enough to support a mature intelligence claim.

Examples:

- first checkpoint exists but no response
- only one comparable record exists
- one contradiction exists without enough relationship depth

Required UI behavior:

- Render a restrained “forming” state.
- Do not show faux comparisons or mature trend language.

### Mature

Definition:

- The record is sufficient for a real intelligence claim tied to dated, sourced evidence.

Required UI behavior:

- show scope
- show source
- show date
- show evidence posture
- show meaning
- show limitation
- show next action where relevant

## Shared Card Requirements

Every shared intelligence card now depends on scoped metadata via `meta`.

Required visible or accessible fields:

- `scope.scopeLabel`
- `sourceLabel`
- `capturedAt` or dated comparison fields
- `evidencePosture`
- `dataQuality`
- `nextAction` or explicit limitation

## Surface Rules

### Decision Centre

- Allowed to show one or more case cards.
- Each intelligence block is case-scoped.

### Fast Diagnostic

- May show a fallback baseline only if it is clearly labelled as thin and not measured.

### Return Brief

- Must resolve by the active Return Brief session / Strategy Room session.

### Executive Reporting

- Must resolve by report-linked case scope, not account-wide state.

### Strategy Room Entry

- Must resolve by the entering Strategy Room scope.

### Strategy Room Session

- Must resolve by the active session.

### Standalone Intelligence Pages

- Must declare account-wide view.
- Must support empty / thin / mature states explicitly.

## Remaining Contract Gap

Still partial:

- field-level provenance on merged `evidenceCapture`
- richer organisation-scoped aggregate contract
- full return-brief block metadata normalization

