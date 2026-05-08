# Proof and Outcome System

> Goal: Evidence stops being ornamental. Wire outcome verification, decision ledger, proof surfaces, and calibration into user-facing and admin-facing intelligence.

## Existing Infrastructure

| System | File | Status |
|--------|------|--------|
| Outcome model | lib/outcomes/outcome-model.ts | Production-ready. resolved/improved/stable/deteriorated |
| Outcome verification | lib/outcomes/outcome-verification.ts | Production-ready. Effectiveness scoring with contradiction penalty |
| Outcome evidence | lib/outcomes/evidence.ts | **Upgraded** — now DB-persisted via OutcomeVerificationRecord |
| Decision ledger | lib/decision-ledger/ledger-service.ts | **Bug fixed** — trend calculation now filters by date |
| Decision credit | lib/follow-up/decision-credit-score.ts | Production-ready. Follow-through, breach, impact, consistency |
| Calibration | lib/calibration/calibration-engine.ts | Production-ready. EMA dampening, prediction vs outcome |
| Evidence page | pages/evidence/index.tsx | **Fixed** — dynamic case count |
| Outcome check | pages/outcome/check.tsx | Exists but lightly integrated |
| Admin proof | pages/admin/proof.tsx | Active — proof queue |
| Admin outcome-ledger | pages/admin/outcome-ledger.tsx | Active — outcome tracking |
| OutcomeVerification component | components/diagnostics/results/OutcomeVerification.tsx | Production-ready |
| GovernanceLedger component | components/admin/GovernanceLedger.tsx | Active — immutable audit view |

## User-Facing Evidence (what users should see)

### On every result screen:
- **What evidence supports this?** → Show evidence tier badge + evidence chain
- **What confidence level applies?** → Show C3 score + calibration confidence where available
- **What would strengthen the evidence?** → Show missing dimensions from C3 + recommended next stage

### On Return Brief:
- **What outcomes have been verified?** → Show OutcomeVerification component with classification
- **What changed?** → Show longitudinal delta
- **What remained unresolved?** → Show persistent contradictions

### On Strategy Room:
- **Decision credit score** → Show follow-through pattern, reliability, trajectory
- **Execution ledger** → Show decisions tracked with states
- **Outcome evidence** → Show verified outcomes feeding calibration

## Admin-Facing Evidence

### Outcome ledger (existing /admin/outcome-ledger):
- Outcome classification distribution
- Intervention success rate
- Average time to improvement
- Recurring failure modes

### Calibration quality (existing /admin/calibration):
- Prediction accuracy over time
- Bias detection and correction
- Confidence calibration curve

### Route correction candidates:
- Cases where route was corrected
- Cases where correction improved outcomes
- Drift tribunal results

## Activation Actions

| Action | Priority | Files |
|--------|----------|-------|
| Surface outcome evidence on return brief | P1 | app/briefing/return/[sessionId]/page.tsx |
| Surface decision credit on Strategy Room | P1 | pages/strategy-room/session/[id].tsx |
| Surface evidence tier on all result screens | P2 | components/trust/EvidenceTierBadge.tsx |
| Surface calibration confidence where relevant | P2 | Via LivingIntelligenceSpine.calibrationConfidence |
| Connect /evidence page to OutcomeVerificationRecord | P2 | pages/evidence/index.tsx |
| Wire proof admin to outcome verification loop | P3 | pages/admin/proof.tsx |
