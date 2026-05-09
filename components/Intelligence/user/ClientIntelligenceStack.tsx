"use client";

import * as React from "react";
import type { DecisionCentreCase, DecisionCentreResponse } from "@/lib/product/decision-centre-contract";
import type { DecisionVelocitySummary } from "@/lib/analytics/decision-velocity";
import type { IntelligenceScope } from "@/lib/product/intelligence-contract";
import DecisionVelocityCard from "@/components/Intelligence/public/DecisionVelocityCard";
import WhatChangedPanel from "@/components/Intelligence/public/WhatChangedPanel";
import CrossAssessmentInsight from "@/components/Intelligence/public/CrossAssessmentInsight";
import ContradictionMapPreview from "@/components/Intelligence/public/ContradictionMapPreview";

type Props = {
  scope: IntelligenceScope;
  showVelocity?: boolean;
  showWhatChanged?: boolean;
  showCrossAssessment?: boolean;
  showContradictions?: boolean;
  fallbackVelocitySummary?: DecisionVelocitySummary | null;
  className?: string;
  emptyTitle?: string;
  thinTitle?: string;
};

export default function ClientIntelligenceStack({
  scope,
  showVelocity = false,
  showWhatChanged = false,
  showCrossAssessment = false,
  showContradictions = false,
  fallbackVelocitySummary = null,
  className = "",
  emptyTitle = "No intelligence available yet.",
  thinTitle = "Intelligence is still forming.",
}: Props) {
  const [caseCard, setCaseCard] = React.useState<DecisionCentreCase | null>(null);
  const [responseData, setResponseData] = React.useState<DecisionCentreResponse | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (scope.caseId) params.set("caseId", scope.caseId);
    if (scope.journeyId) params.set("journeyId", scope.journeyId);
    if (scope.strategyRoomSessionId) params.set("strategyRoomSessionId", scope.strategyRoomSessionId);
    if (scope.executiveRunId) params.set("executiveRunId", scope.executiveRunId);
    if (scope.scopeType === "ACCOUNT") params.set("accountWide", "true");
    fetch(`/api/decision-centre/cases${params.toString() ? `?${params.toString()}` : ""}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: DecisionCentreResponse | null) => {
        if (cancelled || !json?.ok) return;
        setResponseData(json);
        const matched = scope.caseId
          ? json.cases.find((item) => item.caseId === scope.caseId) ?? null
          : json.cases[0] ?? null;
        setCaseCard(matched);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [scope.caseId, scope.executiveRunId, scope.journeyId, scope.scopeType, scope.strategyRoomSessionId]);

  const velocitySummary = caseCard?.decisionVelocitySummary ?? fallbackVelocitySummary;
  const cardsShown = Number(Boolean(showVelocity && velocitySummary))
    + Number(Boolean(showWhatChanged && caseCard?.whatChanged && caseCard.whatChanged.changes.length > 0))
    + Number(Boolean(showCrossAssessment && caseCard?.crossAssessmentIntelligence && (caseCard.crossAssessmentIntelligence.conflicts.length > 0 || caseCard.crossAssessmentIntelligence.reinforcingSignals.length > 0)))
    + Number(Boolean(showContradictions && caseCard?.contradictionMap && caseCard.contradictionMap.activeContradictions.length > 0));
  const thinState =
    (showWhatChanged && caseCard?.whatChanged && caseCard.whatChanged.meta.dataQuality === "THIN")
    || (showVelocity && velocitySummary && velocitySummary.meta.dataQuality === "THIN")
    || (showContradictions && caseCard?.contradictionMap && caseCard.contradictionMap.meta.dataQuality === "THIN");
  if (!loaded && !fallbackVelocitySummary) return null;
  if (!caseCard && !velocitySummary) {
    return (
      <div className={className} style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "16px 18px" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.78)" }}>
          {emptyTitle}
        </p>
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)", marginTop: "8px" }}>
          {responseData?.emptyState?.reason ?? "No case-bound intelligence could be matched to this scope."}
          {responseData?.emptyState?.nextAction ? ` ${responseData.emptyState.nextAction}` : ""}
        </p>
      </div>
    );
  }
  if (cardsShown === 0) {
    return (
      <div className={className} style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "16px 18px" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.78)" }}>
          {thinState ? thinTitle : emptyTitle}
        </p>
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)", marginTop: "8px" }}>
          {thinState
            ? "The record is forming. Complete another checkpoint, diagnostic, or outcome verification to make this surface useful."
            : "No case-bound intelligence is ready for this surface yet."}
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: "grid", gap: "16px" }}>
      {showVelocity && velocitySummary && <DecisionVelocityCard summary={velocitySummary} />}
      {showWhatChanged && caseCard?.whatChanged && <WhatChangedPanel summary={caseCard.whatChanged} title="What changed since your last assessment" />}
      {showCrossAssessment && caseCard?.crossAssessmentIntelligence && <CrossAssessmentInsight intelligence={caseCard.crossAssessmentIntelligence} />}
      {showContradictions && caseCard?.contradictionMap && <ContradictionMapPreview view={caseCard.contradictionMap} />}
    </div>
  );
}
