# Memory Source Trace Matrix

| Memory label | Surface | Captured where | Sent to API | Persisted server-side | Retrieved from | Source-labelled in UI | Dated in UI | Evidence type | Current status | Audience safety | Classification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Evidence carried forward | Executive Reporting | Team/Enterprise evidence bridge | Yes | Yes, via diagnostic submission and executive canonical snapshot | Executive result canonical + intake | Weak | No | Self-reported inherited evidence | Current but merged | Safe | SAFE_SELF_REPORTED_MEMORY / OVERCLAIM_RISK |
| Execution memory | Strategy Room entry | Team/Enterprise bridge, thread, executive result | Yes | Partly. Canonical snapshot persisted once session/execution writes occur | Client thread + executive result + canonical | Weak | No | Self-reported inherited evidence | Current but merged | Safe | SAFE_SELF_REPORTED_MEMORY / DISPLAY_ONLY_MEMORY |
| Unresolved execution memory | Strategy Room session | Inherited into execution canonical snapshot | Yes | Yes, in persisted execution `canonicalSnapshot` | Session API `canonicalSnapshot` | Weak | No | Self-reported inherited evidence | Possibly stale | Safe | STALE_OR_UNDATED_MEMORY / OVERCLAIM_RISK |
| Against your prior standard | Return Brief | Earlier carried evidence in execution canonical snapshot | Yes | Yes | Server-side execution session canonical snapshot | Moderate | No | Self-reported prior standard compared against current evidence | Current | Safe | GOVERNED_MEMORY / SAFE_SELF_REPORTED_MEMORY |
| Continuity source | Oversight Brief structured actions | Team/Enterprise evidence bridge, journey stage payloads | Yes | Yes | Oversight account loader -> signal builder -> structured actions | Yes | No | Mixed: self-reported + derived + some behavioural | Current | Safe after client-safe suppression | GOVERNED_MEMORY |
| Governance Evidence Coverage | Control Room / enterprise loader | Journey stage payload evidenceCapture | No user-facing API in ladder, but loaded server-side | Yes | Control Room state loader -> enterprise control-room loader | Yes | No | Aggregate-only | Current | Safe | AGGREGATE_ONLY_MEMORY |
| Case memory | Decision Centre | Team/Enterprise bridge via stage payloads | Yes | Yes | Decision Centre API via `getDiagnosticJourney` merge | Weak | No | Self-reported inherited evidence | Weakly case-scoped, possibly stale | Safe | DISPLAY_ONLY_MEMORY / MISSING_TRACE / OVERCLAIM_RISK |

## Source Notes

### Capture layer

- `components/diagnostics/GovernanceEvidenceBridge.tsx`
- `pages/diagnostics/team-assessment.tsx`
- `pages/diagnostics/enterprise-assessment.tsx`

### Submission/persistence layer

- `pages/api/diagnostics/submit.ts`
- `lib/diagnostics/journey-store.ts`
- `app/api/executive-reporting/run/route.ts`
- `app/api/strategy-room/session/init/route.ts`
- Strategy Room execution session persistence

### Retrieval layer

- Executive Reporting result UI from returned canonical/intake
- Strategy Room entry from session thread and executive result
- Strategy Room session from persisted `canonicalSnapshot`
- Return Brief server from execution session `canonicalSnapshot`
- Oversight from journey stages, evidence nodes, decision objects, and client-safe suppression
- Control Room from aggregate stage payload merges
- Decision Centre from Living Case + journey stage merges

## Trace Reliability Notes

- The strongest trace is where the memory item travels from assessment capture to server persistence to later server retrieval.
- The weakest trace is where the UI merges inherited fields from multiple earlier payload shapes without explicit source or timestamp.
- Decision Centre is currently the least case-specific trace in the audited set.
