# Executive Reporting Public Payload Audit

## Scope

- [app/api/executive-reporting/run/route.ts](/C:/aol-check-visual/app/api/executive-reporting/run/route.ts)
- [pages/diagnostics/executive-reporting/run.tsx](/C:/aol-check-visual/pages/diagnostics/executive-reporting/run.tsx)
- [lib/product/executive-reporting-public-dto.ts](/C:/aol-check-visual/lib/product/executive-reporting-public-dto.ts)

## Route contract after closure

Public response shape:

```ts
{
  ok: true,
  runKey: string,
  checkpointId: string | null,
  result: ExecutiveReportingPublicResult
}
```

The route still builds the full canonical report server-side for persistence, boardroom generation, and diagnostic stage storage, but that canonical object no longer crosses the public API boundary.

## Top-level response field classification

| Field | Classification | Reason |
|---|---|---|
| `ok` | `PUBLIC_REQUIRED_RENDERED` | Required by the client success/failure branch. |
| `runKey` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Used for session persistence and boardroom export handoff. |
| `checkpointId` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Needed for checkpoint challenge submission. |
| `result` | `PUBLIC_REQUIRED_RENDERED` | Narrow public DTO consumed by the run page. |
| `canonical` | `SERVER_ONLY_SHOULD_NOT_RETURN` | Removed from the public response. |
| `viewModel` | `SERVER_ONLY_SHOULD_NOT_RETURN` | Removed from the public response. |
| `diagnostics` | `INTERNAL_LEGACY_REMOVE` | Removed from the public response. |
| `entitlements` | `INTERNAL_LEGACY_REMOVE` | Removed from the public response. |
| `aiAdjustedConsequence` | `INTERNAL_LEGACY_REMOVE` | Replaced with a public summary object in `result.aiConsequenceSummary`. |
| `intake` | `SERVER_ONLY_SHOULD_NOT_RETURN` | Removed from the public response. |
| `boardroom.dossier` raw canonical object | `INTERNAL_OPERATOR_ONLY` | Replaced by a sanitised boardroom dossier subsection in the DTO. |

## `ExecutiveReportingPublicResult` field classification

| Field | Classification | Notes |
|---|---|---|
| `caseId` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Needed for user-safe intelligence scope linkage. |
| `executiveRunId` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Needed for scope continuity and handoff. |
| `route` | `PUBLIC_REQUIRED_RENDERED` | Rendered throughout the result surface and progression gate. |
| `checkpointId` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Duplicated inside `result` for safe client-local use. |
| `meta.generatedAt` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Retained for provenance and timing integrity. |
| `meta.dataQuality` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Public DTO quality indicator. |
| `meta.evidencePosture` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Public DTO posture indicator. |
| `meta.provenance` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Shared canonical provenance object array. |
| `meta.provenanceLine` | `PUBLIC_REQUIRED_RENDERED` | Used for displayed source/date/posture language. |
| `meta.emptyState` | `SAFE_EMPTY_OR_SUMMARY_ONLY` | Used only when the evidence base is thin. |
| `intelligenceScope` | `PUBLIC_REQUIRED_NOT_RENDERED_BUT_NEEDED` | Required by `ClientIntelligenceStack`. |
| `header` | `PUBLIC_REQUIRED_RENDERED` | Direct page render fields. |
| `summary` | `PUBLIC_REQUIRED_RENDERED` | Direct page render fields. |
| `constitution` | `PUBLIC_REQUIRED_RENDERED` | Safe constitutional summary only. No raw kernel values. |
| `financialExposure` | `PUBLIC_REQUIRED_RENDERED` | Estimated, labelled, provenance-backed, and caveated. |
| `observedOutcomes` | `SAFE_EMPTY_OR_SUMMARY_ONLY` | Summary evidence only. No raw respondent data. |
| `decision` | `PUBLIC_REQUIRED_RENDERED` | Safe decision text, constraint, and cost-of-delay summary. |
| `boardActions` | `PUBLIC_REQUIRED_RENDERED` | Safe ordered priority text only. |
| `nextAction` | `PUBLIC_REQUIRED_RENDERED` | Needed for the result page and thread handoff. |
| `boardSnapshot` | `PUBLIC_REQUIRED_RENDERED` | Rendered summary block only. |
| `governanceEvidenceCarryForward` | `PUBLIC_REQUIRED_RENDERED` | Uses governed memory items with canonical provenance. |
| `aiTerrain` | `PUBLIC_REQUIRED_RENDERED` | Case summary only; no thresholds, weights, or kernel trace. |
| `consequenceProjection` | `PUBLIC_REQUIRED_RENDERED` | Rendered estimate only; no hidden formula returned. |
| `advantagePath` | `PUBLIC_REQUIRED_RENDERED` | Safe forward-looking narrative only. |
| `aiConsequenceSummary` | `SAFE_EMPTY_OR_SUMMARY_ONLY` | Replaces raw score objects with labels and caveats. |
| `boardroom` | `PUBLIC_REQUIRED_RENDERED` | Sanitised boardroom access state and boardroom dossier text only. |

## Explicitly removed or withheld internals

- Raw scores: withheld.
- Scoring dimensions: withheld.
- Threshold values: withheld.
- Internal route decisions beyond public `route`: withheld.
- Graph/kernel/synthesis/arbiter traces: withheld.
- Evidence nodes: withheld.
- Raw user text intake payload: withheld.
- Boardroom dossier internals beyond rendered sections/objections/decision paths: withheld.
- Entitlement and checkout internals: withheld.
- Operator/counsel/internal review notes: withheld.

## Public-safe substitutions

- Raw AI consequence scores were replaced by `aiConsequenceSummary` labels and caveat text.
- Raw financial internals were replaced by estimated formatted values plus provenance and caveat text.
- Raw governance memory assembly was replaced by `governanceEvidenceCarryForward`.
- Broad canonical scope was replaced by `intelligenceScope`, `meta`, and safe render sections only.

## Verdict

`app/api/executive-reporting/run/route.ts` now satisfies the ER public DTO closure requirement.
