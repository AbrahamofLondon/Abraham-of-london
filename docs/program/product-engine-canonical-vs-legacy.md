# Product Engine Canonical vs Legacy Matrix

Purpose: mark which files and routes are part of the live engine versus compatibility, alternate, or dead-weight surfaces.

| Surface | Canonical | Legacy | Why |
| --- | --- | --- | --- |
| `/diagnostics/constitutional-diagnostic` | Yes | No | Main constitutional entry page |
| `components/assessments/ConstitutionalDiagnosticSuite.tsx` | Yes | No | Real constitutional scoring/UI engine |
| `lib/constitution/rules.ts` | Yes | No | Real constitutional decision kernel |
| `/diagnostics/team-assessment` | Yes | No | Canonical team ladder route |
| `components/assessments/TeamAssessmentSuite.tsx` | No | Yes | Separate alternate run path, not the main ladder page |
| `/api/assessments/team/run` | No | Yes | Simple alternate scoring endpoint; bypasses diagnostics persistence |
| `/diagnostics/team-alignment` | No | Yes | Redirect only |
| `/diagnostics/enterprise-assessment` | Yes | No | Canonical enterprise ladder route |
| `components/assessments/EnterpriseAssessmentSuite.tsx` | No | Yes | Alternate slider surface; not the canonical page flow |
| `/api/assessments/enterprise/run` | No | Yes | Simple alternate scoring endpoint; bypasses diagnostics persistence |
| `/diagnostics/enterprise` | No | Yes | Redirect only |
| `/api/diagnostics/submit` | Yes | No | Shared persistence endpoint for canonical team/enterprise page ladder |
| `lib/server/diagnostics/store.ts` | Yes | No | Shared stored diagnostic truth |
| `/diagnostics/executive-reporting` | Partial | No | Live page, but orientation only |
| `/diagnostics/executive-reporting/run` | Yes | No | Real intake + output engine |
| `/api/executive-reporting/run` | Yes | No | Real executive reporting compute path |
| `lib/decision/constitutional-guidance-assembler.ts` | Yes | No | Central constitution/guidance/asset assembly |
| `lib/admin/reporting/canonical-report-contract.ts` | Yes | No | Canonical output envelope builder |
| `lib/admin/reporting/executive-report-view-model.ts` | Yes | No | Canonical report-to-UI mapper |
| `/strategy-room` | Yes | No | Canonical strategy-room route |
| `/api/strategy-room/session/init` | Yes | No | Real session bootstrap for current strategy-room page |
| `/api/decision/guidance` | Yes | No | Real canonical guidance fetch for current strategy-room page |
| `/api/strategy-room/enrol` | Yes | Partial | Canonical enrolment endpoint, but not the main `/strategy-room` page path today |
| `lib/strategy-room/enrol-core.ts` | Yes | Partial | Real canonical enrolment pipeline, but currently separate from the page verdict flow |
| `/api/strategy-room/intake` | No | Yes | Legacy adapter into enrol-core |
| `/api/strategy-room/submit` | No | Yes | Older raw intake writer into `strategyIntake` |
| `/api/strategy-room/results` | No | Yes | Reads old `strategyIntake` rows |
| `/strategy-room/success` | No | Yes | Depends on old `strategyIntake` result shape |
| `/consulting/strategy-room` | No | Yes | Redirect only |
| `lib/strategy-room/session-service.ts` | Partial | Partial | Minimal helper, not the main persisted session implementation |
| `/api/diagnostics/report/generate` | Yes | No | Current report issuance path for stored diagnostics |
| `/api/diagnostics/report/pdf` | Yes | No | Current PDF retrieval/build path |
| `/api/diagnostics/report` | No | Yes | Redirect stub to Netlify function |
| `/diagnostics/index` | Partial | No | Canonical navigation/index surface, not a compute engine |
| `/diagnostic` | No | Yes | CSS/environment tool, unrelated to product ladder |

## Implementation Truth Notes

### 1. The team and enterprise ladder pages are more canonical than their matching suite components

The page routes:
- `/diagnostics/team-assessment`
- `/diagnostics/enterprise-assessment`

are the live ladder path that writes into the shared diagnostics store.

The suite components:
- `TeamAssessmentSuite.tsx`
- `EnterpriseAssessmentSuite.tsx`

look substantial, but they use separate run endpoints and do not enter the same persistence/reporting chain.

### 2. The strategy-room page and the strategy-room enrolment API are not the same lane

`/strategy-room` currently:
- initializes a constitutional session
- requests canonical guidance
- renders a verdict
- tracks impressions/conversions/followups

`/api/strategy-room/enrol` currently:
- normalizes canonical input
- runs recaptcha + vetting + consulting evaluation
- archives / audits / notifies

Both are real, but they are different paths.

### 3. Shared diagnostic submit is persistence-oriented, not interpretation-oriented

`/api/diagnostics/submit`:
- validates
- rate-limits
- attaches actor context
- forwards to CRM
- persists the record

It does not recompute the richer local readings from the canonical team and enterprise pages.

### 4. Executive Reporting is the clearest server-computed output path

`/diagnostics/executive-reporting/run`
plus
`/api/executive-reporting/run`

is the most explicit end-to-end intake → computed output → recommendation path currently visible in the repo.
