# Intelligence Foundry — Agent 1 Code Audit
**Produced by:** Agent 1R pre-remediation pass  
**Date:** 2026-05-24  
**Standard:** v4.0 Audit-Proof Implementation Brief

---

## Audit Questions — Answers from Live Code

| Question | Answer | Evidence |
|---|---|---|
| Is ResearchRunRepository the only code path writing ResearchRun? | **NO** | `ci-gate`, `health`, `trash-day` routes import `prisma` directly and query `researchRun.*` |
| Is HonestyEnforcer called inside repository methods, not only imported? | **NO** | Only `validateArchive` is called (in `archive()`). `enforceHonestyOnCreate` is never called from `create()`. `update()` has zero enforcer calls. |
| Can PATCH mutate status, severity, archivedAt, implementedAt, or owner fields? | **YES — CRITICAL** | `UpdateResearchRunSchema` is `CreateResearchRunSchema.partial()` which includes `severity` and `status`. The PATCH route accepts them without guards. |
| Are status transitions controlled by dedicated methods? | **NO** | No state machine exists. Status is a free-text field. PATCH can set any value. |
| Are module statuses hardcoded anywhere in UI? | **YES — CRITICAL** | `module-registry.ts` has 9 hardcoded `"WIRED"` declarations. `hasRealLogicQualification()` is a hardcoded `Set`. `classifyModule()` is never called on registry entries. |
| Can a DEMO module create a non-demo run? | **YES** | `create()` does not call `enforceHonestyOnCreate()`. `validateDemoFlag()` is never reached on write. |
| Can a finding be created without source? | **YES** | `findingsJson` is a raw string column. No validation runs on write. `validateFindings()` is never called from `create()`. |
| Can HIGH/CRITICAL be archived without implementedAt, decisionOutcome, or deferredReason? | **NO** | `validateArchive()` IS called inside `archive()` — this is the one protection that works. |
| Do all mutation endpoints write audit events? | **NO** | `update()` (PATCH) emits zero audit events. `markActionRequired()` emits one. Others emit one each. Audit events are fire-and-forget with silent catch. |
| Do all Foundry API routes enforce admin auth? | **YES** | `requireAdminAppRoute()` is present on all routes. |
| Do owner-only routes actually require OWNER, not merely ADMIN? | **PARTIAL** | `archive` and `resurrect` check `isOwner`. Other mutation routes do not. The PATCH route accepts any admin. |
| Are canary tests present and meaningful? | **NO** | No canary tests exist. No test verifies enforcer is called at runtime. |

---

## Critical Gaps

### GAP-1 (CRITICAL): enforceHonestyOnCreate never called
`lib/research/research-run-repository.ts:49-53` — `create()` calls `prisma.researchRun.create()` with `data: input as any`. No honesty check runs. Laws 2 and 3 are unenforceable at write time.

### GAP-2 (CRITICAL): PATCH mutates lifecycle fields
`lib/research/research-run-validation.ts:72` — `UpdateResearchRunSchema = CreateResearchRunSchema.partial()`. Includes `severity`, `status`, `implementedAt`, `archivedAt`. Any admin can: lower severity from CRITICAL to INFO, then archive. Or reset `implementedAt: null` to reopen an implemented run.

### GAP-3 (CRITICAL): Module statuses are hardcoded declarations
`lib/research/module-registry.ts` — 9 entries with `status: "WIRED"`. The real-logic-classifier's `classifyModule()` is never invoked for any registry entry. `hasRealLogicQualification()` is a manually maintained `Set`. Six of the eight declared WIRED modules have no route page on disk.

### GAP-4 (HIGH): No status state machine
No `STATUS_TRANSITIONS` map. No transition guard. `ARCHIVED` runs can be re-opened by PATCH. `IMPLEMENTED` can be reset to `PENDING`. Status is a label, not a lifecycle.

### GAP-5 (HIGH): Findings are opaque JSON blobs
`findingsJson`, `inputJson`, `outputJson` are `String` columns. Cannot query by severity. Cannot track actioned vs unactioned. Cannot detect recurrence. Silent data corruption on invalid JSON.

### GAP-6 (HIGH): Direct Prisma in API routes
`ci-gate/route.ts`, `health/route.ts`, `trash-day/route.ts` import and call `prisma.*` directly. Breaks the "repository is the only write path" rule and would fail the planned canary test.

### GAP-7 (HIGH): Audit events fire-and-forget with silent failure
```ts
await writeSecurityAudit({...}).catch(() => { /* silent */ });
```
If audit fails, the state change succeeds silently. No log. No alert. The audit trail has invisible holes.

### GAP-8 (HIGH): checkLinkedRoute always returns true
```ts
return { exists: true }; // placeholder
```
Stores false positive `linkedRouteExists: true` for every run. Corrupts the integrity check data.

### GAP-9 (MEDIUM): update() emits no audit event
`update()` is the most-called mutation method. Zero audit events. Field changes to recommendation, severity, status, findings are invisible in the audit trail.

### GAP-10 (MEDIUM): ActionBrief is ephemeral
`exportBrief()` computes and returns JSON. Nothing stored. No hash. No version. Not immutable. Cannot verify integrity between export and action.

### GAP-11 (MEDIUM): No rate limiting on any route
14 API routes. Zero rate limiting. Spec required it. Not present.

### GAP-12 (MEDIUM): CI gate auth fallthrough
If `FOUNDRY_API_KEY` is configured and an incorrect bearer is presented, the gate falls through to admin session auth. Should hard-reject on key mismatch.

### GAP-13 (LOW): reviewedAt can never be populated
Field exists in schema. `FOUNDRY_RUN_REVIEWED` audit event is defined. No API endpoint sets either.

### GAP-14 (LOW): No count in findMany response
Vault fetches with `limit=100`. No total, no hasMore. Runs beyond 100 are invisible.

---

## Remediation Plan (Agent 1R)

1. Add Prisma models: `FoundryFinding`, `FoundryAuditEvent` (model), `ActionBrief`, `CiGateBlock`, `FoundryPattern`
2. Build `StatusStateMachine` — `ARCHIVED` is terminal, transitions are exhaustive
3. Wire `HonestyEnforcer` inside `create()`, `archive()`, `defer()`, `all transition methods()`
4. Restrict `updateMetadata()` to non-lifecycle fields only — remove generic `update()`
5. Make `FoundryAuditEvent` writes atomic with state changes (Prisma `$transaction`)
6. Build `FindingRepository` — `createFinding()` rejects missing source
7. Build `ActionBriefRepository` — immutable export with SHA-256 hash
8. Build `module-status-computer.ts` — computed from route existence + engine + self-test
9. Harden CI gate — no auth fallthrough
10. Move health/trash-day/ci-gate routes off direct Prisma onto repository
11. Add canary tests for every gap above

---

*This audit was produced before any remediation. Every finding is verifiable from the referenced file and line numbers.*
