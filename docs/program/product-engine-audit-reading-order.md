# Product Engine Audit Reading Order

Purpose: give Claude the shortest high-signal reading order for a forensic audit.

## Start Here

1. `lib/constitution/rules.ts`
Reason: this is the clearest deterministic routing kernel in the repo. It establishes what a real constitutional decision looks like.

2. `components/assessments/ConstitutionalDiagnosticSuite.tsx`
Reason: shows how constitutional inputs are actually captured and transformed before the route is produced.

3. `pages/api/diagnostics/submit.ts`
Reason: this is the shared persistence edge for the canonical page-based ladder. It answers what gets validated, stored, and returned.

4. `lib/server/diagnostics/store.ts`
Reason: this is where page-based ladder submissions become durable records.

## Then Trace the Canonical Ladder

5. `pages/diagnostics/team-assessment.tsx`
Reason: canonical team page with real local interpretation, submit payload construction, and session handoff.

6. `lib/alignment/fragility-logic.ts`
Reason: team volatility/fragility classification.

7. `pages/diagnostics/enterprise-assessment.tsx`
Reason: canonical enterprise page with real local interpretation, submit payload construction, and session handoff.

8. `lib/diagnostics/client.ts`
Reason: shared scoring helpers and submit bridge used by the canonical page ladder.

9. `lib/diagnostics/types.ts`
Reason: confirms the stable contract across UI, API, store, and report paths.

## Then Trace the Executive Output Engine

10. `pages/diagnostics/executive-reporting/run.tsx`
Reason: real intake and result surface for the flagship computed output.

11. `app/api/executive-reporting/run/route.ts`
Reason: best end-to-end server-side assembly path in the repo.

12. `lib/decision/constitutional-guidance-assembler.ts`
Reason: central constitution + recommendation + asset matching layer.

13. `lib/decision/system-constitution.ts`
Reason: strategy-room constitutional intake spec and derivation logic.

14. `lib/admin/reporting/canonical-report-contract.ts`
Reason: canonical output envelope builder.

15. `lib/admin/reporting/executive-report-view-model.ts`
Reason: distinguishes computed output from UI projection.

16. `lib/diagnostics/ladder-context-resolver.ts`
Reason: shows how prior ladder state is actually stitched into executive reporting.

## Then Trace the Strategy-Room Branch

17. `pages/strategy-room/index.tsx`
Reason: current live strategy-room page path.

18. `app/api/strategy-room/session/init/route.ts`
Reason: current live session bootstrap and canonical snapshot persistence.

19. `app/api/decision/guidance/route.ts`
Reason: current live guidance fetch path used by the strategy-room page.

20. `lib/strategy-room/canonical-snapshot.ts`
Reason: snapshot format persisted on strategy-room session records.

21. `lib/strategy-room/client-trackers.ts`
Reason: shows which post-verdict events are really captured.

22. `pages/api/strategy-room/enrol.ts`
Reason: canonical enrolment endpoint, but not the same lane as the current page.

23. `lib/strategy-room/enrol-core.ts`
Reason: if Claude is checking the advisory/intake pipeline, this is the real backend core.

## Compare Against Legacy / Alternate Paths Last

24. `components/assessments/TeamAssessmentSuite.tsx`
25. `app/api/assessments/team/run/route.ts`
26. `components/assessments/EnterpriseAssessmentSuite.tsx`
27. `app/api/assessments/enterprise/run/route.ts`
28. `pages/api/strategy-room/submit.ts`
29. `pages/api/strategy-room/intake.ts`
30. `app/api/strategy-room/results/route.ts`
31. `app/strategy-room/success/page.tsx`

Reason: these files look active enough to confuse an audit, but they are not the cleanest representation of current canonical product truth.

## Read With These Cautions

- Do not assume the page that looks canonical is the file doing the real computation.
- Do not assume the endpoint named most cleanly is the one the live page is using.
- Do not assume the shared diagnostics submit API computes ladder interpretation; for team and enterprise it mainly persists submitted client-side interpretation.
- Do not merge the strategy-room page flow and the enrolment API flow without checking call sites first.
- Treat redirects and route aliases as compatibility surfaces, not product engines.
