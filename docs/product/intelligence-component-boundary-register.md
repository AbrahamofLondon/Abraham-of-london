# Intelligence Component Boundary Register

## Public Safe

- [components/Intelligence/public/DecisionVelocityCard.tsx](/C:/aol-check-visual/components/Intelligence/public/DecisionVelocityCard.tsx)
- [components/Intelligence/public/WhatChangedPanel.tsx](/C:/aol-check-visual/components/Intelligence/public/WhatChangedPanel.tsx)
- [components/Intelligence/public/CrossAssessmentInsight.tsx](/C:/aol-check-visual/components/Intelligence/public/CrossAssessmentInsight.tsx)
- [components/Intelligence/public/ContradictionMapPreview.tsx](/C:/aol-check-visual/components/Intelligence/public/ContradictionMapPreview.tsx)

Reason: DTO-only, user-safe wording, no graph/kernel/scoring detail.

## User Private Safe

- [components/Intelligence/user/ClientIntelligenceStack.tsx](/C:/aol-check-visual/components/Intelligence/user/ClientIntelligenceStack.tsx)

Reason: authenticated case fetch + safe DTO renderers only.

## Operator Only

- [components/Intelligence/operator/KnowledgeGraph.tsx](/C:/aol-check-visual/components/Intelligence/operator/KnowledgeGraph.tsx)
- [components/Intelligence/operator/DiscoveryOverlay.tsx](/C:/aol-check-visual/components/Intelligence/operator/DiscoveryOverlay.tsx)

Reason: richer topology/search/admin context, not safe for public import.

## Internal Only

- [components/Intelligence/internal/DeterminismProof.tsx](/C:/aol-check-visual/components/Intelligence/internal/DeterminismProof.tsx)
- [components/Intelligence/internal/DecisionTracePanel.tsx](/C:/aol-check-visual/components/Intelligence/internal/DecisionTracePanel.tsx)
- [components/Intelligence/internal/SpineRenderer.tsx](/C:/aol-check-visual/components/Intelligence/internal/SpineRenderer.tsx)

Reason: method-heavy trace/proof/render infrastructure.

## Guard status

- Generic `components/Intelligence/<file>` imports were removed from live call sites.
- Boundary guard: `PASS` via [scripts/intelligence-boundary-guard.mjs](/C:/aol-check-visual/scripts/intelligence-boundary-guard.mjs).
