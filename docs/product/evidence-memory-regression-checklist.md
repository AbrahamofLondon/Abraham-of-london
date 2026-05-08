# Evidence Memory Regression Checklist

> Use this checklist before any release that touches evidence memory surfaces.
> If any check fails, do not claim the evidence link is closed.

---

## Client-Facing Render Safety

- [ ] No raw respondent text in Return Brief UI
- [ ] No raw respondent text in Oversight Brief UI
- [ ] No raw respondent text in Decision Centre
- [ ] No counsel recommendation text on any client-safe surface
- [ ] No "verified/confirmed/proven" near USER_REPORTED or SYSTEM_INFERRED evidence
- [ ] No evidence rendered without source label
- [ ] No evidence rendered without evidence posture label
- [ ] No consequence evidence presented as "known" — must use "you previously identified" or "reported"
- [ ] No team evidence presented as "team reality" — must use "team aggregate signal" or "reported divergence"
- [ ] No enterprise evidence presented as "institutional truth" — must use "enterprise strain signal"

## Source Join Quality

- [ ] Team aggregate loader uses deterministic join (campaignId, organisationId, or journeyId) — NOT email-only heuristic
- [ ] Enterprise strain loader uses deterministic join (organisationId) — NOT email-only heuristic
- [ ] Retainer intake loader uses email + userId fallback, never session-only
- [ ] Multiple-campaign disambiguation handled or suppressed

## Suppression

- [ ] `isUnsafeAssessmentEvidenceText()` applied to all client-facing evidence text
- [ ] Team evidence suppressed when respondentCount < 3
- [ ] Empty/null evidence fields produce no render (not placeholder text)
- [ ] Retainer intake refusalBoundary suppressed from client-safe when unsafe

## Oversight Brief Composer

- [ ] `buildOversightSignals()` receives teamAggregate parameter (not just type acceptance)
- [ ] `buildOversightSignals()` receives enterpriseStrain parameter (not just type acceptance)
- [ ] Retainer intake context loaded and included in OversightBrief.retainerIntake

## Operator Surfaces

- [ ] Admin oversight review renders retainer intake context when present
- [ ] Admin oversight review warns when retainer intake is missing
- [ ] Operator note required for first-cycle approval when intake absent

## Lifecycle Classification

- [ ] No doc claims "closed" for a field that is only persisted
- [ ] No doc claims "consumed" for a field that is only type-accepted
- [ ] No doc claims "rendered" for a field that only exists in a server response
- [ ] Evidence lifecycle taxonomy (`lib/product/evidence-memory-lifecycle-contract.ts`) used for all classifications

## Build

- [ ] `npx tsc --noEmit --pretty false` passes
- [ ] `npx next build` passes
