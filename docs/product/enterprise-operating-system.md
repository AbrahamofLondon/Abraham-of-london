# Enterprise Operating System

> Goal: Enterprise becomes a first-class product lane, not a hidden admin sidecar.

## The Enterprise Journey (8 stages)

### 1. Enterprise Diagnostic
**Entry:** `/diagnostics/enterprise-assessment`
**Engine:** `lib/alignment/enterprise-score.ts`, `lib/diagnostics/decision-engine.ts` → `buildEnterpriseDecisionResult()`
**Output:** Band classification (ALIGNED/DRIFTING/MISALIGNED/DISORDERED), governance block scores, fragility signal, dissonance area

### 2. Organisation Setup
**Entry:** `/app/admin/organisations/new`
**Engine:** `app/api/admin/organisations/route.ts`
**Output:** Organisation record with metadata, ready for campaign deployment

### 3. Campaign Deployment
**Entry:** `/app/admin/campaigns/new` or `/app/admin/organisations/[id]/campaigns/new`
**Engine:** `app/api/admin/campaigns/route.ts`, `app/api/team-assessment/campaign/create/route.ts`
**Output:** Campaign with participant invitations, assessment tokens, tracking

### 4. Participant Evidence Collection
**Entry:** `/app/assessment/[token]` (team or enterprise assessment via invite link)
**Engine:** `lib/diagnostics/cross-respondent-engine.ts` → `aggregateCrossRespondentDiagnostics()`
**Output:** Multi-source evidence from multiple respondents, divergence analysis

### 5. Enterprise Report
**Entry:** `/app/admin/campaigns/[id]/report`, `/app/admin/organisations/[id]/report`
**Engine:** `lib/decision/canonical-sections.ts`, `lib/alignment/governance-logic.ts` → `generateIntelligenceBrief()`
**Output:** Board-grade report with cross-respondent divergence, governance metrics, contagion analysis

### 6. Intervention Stack
**Engine:** `lib/constitution/intervention-store.ts`, `lib/diagnostics/ai-interventions.ts`
**Output:** Ranked interventions per governance domain, with timeframes and risk-if-ignored

### 7. Outcome Tracking
**Engine:** `lib/outcomes/outcome-verification.ts`, `lib/decision-ledger/ledger-service.ts`
**Output:** Outcome classification per intervention, decision credit profile, trajectory delta

### 8. Retainer / Ongoing Governance
**Entry:** `/retainer`, Strategy Room for enterprise clients
**Engine:** `lib/follow-up/pressure-loop.ts`, `lib/execution/decision-state-engine.ts`
**Output:** Continuous governance with pattern-breaker contracts, calibration, and outcome verification

## Existing Infrastructure (already built)

| Capability | Status | Files |
|-----------|--------|-------|
| Organisation management | Active | app/admin/organisations/* |
| Campaign management | Active | app/admin/campaigns/* |
| Multi-respondent assessment | Active | app/assessment/[token], cross-respondent-engine.ts |
| Campaign aggregation | Active | app/api/diagnostics/campaigns/[id]/aggregate |
| Enterprise scoring | Active | lib/alignment/enterprise-score.ts |
| Governance logic | Active (admin-only) | lib/alignment/governance-logic.ts |
| HCD metrics | Active (calculations) | lib/alignment/hcd-engine-calculations.ts |
| Pattern-Breaker Contracts | Active | components/alignment/PatternBreakerContract.tsx |
| Pattern Observatory | Active | components/alignment/PatternObservatory.tsx |
| Intelligence briefs | Active | governance-logic.ts → generateIntelligenceBrief() |
| Google Calendar sync | Built | lib/integrations/google-calendar-sync.ts |
| Predictive deal engine | Active | lib/ai/predictive-deal-engine.ts |

## What's Missing

1. **Public enterprise product page** — No page at `/enterprise` or similar explaining the enterprise lane
2. **Enterprise dashboard for clients** — Admin dashboards exist but clients see nothing
3. **Enterprise outcome loop** — Outcome verification exists but no enterprise-specific flow
4. **Enterprise onboarding flow** — Organisation setup exists but no guided experience
5. **Google Calendar verification** — Built but not wired into enterprise contracts

## First Implementation

Create a public-facing enterprise route or clear CTA from `/institutional` that explains:
- What the enterprise lane offers
- How assessment → campaign → evidence → report → intervention works
- Entry point: run enterprise assessment or contact for advisory engagement
