# Controlled £50k Browser Acceptance Checklist

Classification: `CONTROLLED_50K_RUNTIME_PROOF_READY`

Manual browser verification checklist for the institutional corridor demo route.

---

## Route Integrity

- [ ] `/` — Homepage loads without error
- [ ] `/diagnostics/fast` — Fast diagnostic loads, form renders, submit works
- [ ] `/diagnostics/executive-reporting` — Executive reporting entry loads
- [ ] `/diagnostics/executive-reporting/run` — Report generation completes (with test data or prior submission)
- [ ] `/strategy-room` — Strategy room gate/entry loads, checkout flow accessible
- [ ] `/strategy-room/session/[id]` — Session page loads with execution state (requires valid session)
- [ ] `/boardroom` — Boardroom archive loads, institutional case section renders when authenticated
- [ ] `/oversight` — Oversight command loads, constitutional health strip renders or shows thin state
- [ ] `/oversight/brief/[cycleId]` — Oversight brief loads (requires valid cycle)
- [ ] `/oversight/portfolio` — Portfolio memory loads, all sections render or show thin state
- [ ] `/counsel/status` — Counsel status loads, stakeholder pressure renders when available
- [ ] `/account/proof-pack` — Proof pack loads or shows honest unavailable state

## No Dead CTAs

- [ ] Every "Enter Strategy Room" link resolves
- [ ] Every "View Oversight Brief" link resolves
- [ ] Every "Download Dossier" link resolves or shows "Not yet available"
- [ ] Every "Request Counsel Review" button leads to a valid intake flow
- [ ] Every PDF download button either delivers a PDF or shows honest unavailable state

## No Unearned Escalation

- [ ] Counsel room does not show "Request Review" unless escalation triggers are met
- [ ] Boardroom does not show "Qualified" unless qualification state supports it
- [ ] Oversight does not show "Active" unless retained oversight conditions are met
- [ ] Strategy Room does not show execution chamber unless paid access is confirmed

## No Unsupported Sector Claims

- [ ] Portfolio memory does not show "Sector recurrence" without minimum 3 organisations
- [ ] Industry recurrence does not appear without minimum 3 organisations
- [ ] Role-dynamic patterns show "system-inferred" label, not "verified"
- [ ] Thin-state portfolio says "based on limited observations"

## No Fake Automation Claims

- [ ] No surface shows "continuous monitoring"
- [ ] No surface shows "always-on governance"
- [ ] No surface shows "automated oversight is active"
- [ ] No surface shows "fully autonomous"
- [ ] Cadence is described as "scheduled" not "automated"

## No Raw Mechanics Exposure

- [ ] No surface shows "kernel" in buyer-visible text
- [ ] No surface shows "graph node" or "graph edge"
- [ ] No surface shows "simulation engine" or "formula"
- [ ] No surface shows "threshold" in buyer-visible context
- [ ] No surface shows "scoring weight"

## No Verified Outcome Claims Without Evidence

- [ ] "Verified outcome" only appears where outcomeClassification = "OUTCOME_IMPROVED" or "ACTION_CONFIRMED"
- [ ] Irreversibility is labelled "estimate"
- [ ] Cost-of-inaction is labelled "estimate"
- [ ] Scenario pressure includes "not independently verified" caveat
- [ ] Stakeholder pressure includes evidence posture label

## PDF / Delivery

- [ ] Oversight brief PDF link works or shows honest unavailable state
- [ ] Proof pack PDF link works or shows honest unavailable state
- [ ] No PDF contains forbidden public language (kernel, graph, threshold, formula)

## Suppression

- [ ] Suppression summary appears on oversight brief when data is withheld
- [ ] Suppression notice appears on portfolio memory
- [ ] Strategy room shows suppression notice when details are withheld
- [ ] Suppressed content is never leaked through any surface

## Guard Results (automated)

- [ ] `npx tsc --noEmit` passes
- [ ] `node scripts/institutional-corridor-guard.mjs` passes
- [ ] `node scripts/public-dto-guard.mjs` passes
- [ ] `node scripts/intelligence-boundary-guard.mjs` passes
- [ ] `node scripts/public-copy-guard.mjs` passes
- [ ] `node scripts/evidence-posture-guard.mjs` passes
- [ ] `node scripts/earned-progression-guard.mjs` passes
- [ ] `node scripts/retainer-claim-guard.mjs` passes
- [ ] `npx next build` passes
