/**
 * useInstitutionalLayers — shared hook for the 3 institutional capability layers.
 *
 * Fetches longitudinal, multi-stakeholder, and outcome data when conditions are met.
 * Each layer degrades gracefully: if data is insufficient, the component receives null.
 */

import { useEffect, useState } from "react";
import type { LongitudinalData } from "@/components/diagnostics/results/LongitudinalIntelligence";
import type { MultiStakeholderData } from "@/components/diagnostics/results/MultiStakeholderDivergence";
import type { OutcomeData } from "@/components/diagnostics/results/OutcomeVerification";

export type InstitutionalLayerData = {
  longitudinal: LongitudinalData | null;
  multiStakeholder: MultiStakeholderData | null;
  outcome: OutcomeData | null;
  loading: boolean;
};

export function useInstitutionalLayers({
  email,
  stage,
  campaignId,
  sessionId,
  enabled = true,
}: {
  email?: string | null;
  stage?: string;
  campaignId?: string | null;
  sessionId?: string | null;
  enabled?: boolean;
}): InstitutionalLayerData {
  const [longitudinal, setLongitudinal] = useState<LongitudinalData | null>(null);
  const [multiStakeholder, setMultiStakeholder] = useState<MultiStakeholderData | null>(null);
  const [outcome, setOutcome] = useState<OutcomeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const fetches: Promise<void>[] = [];
    setLoading(true);

    // Longitudinal — needs email
    if (email) {
      const params = new URLSearchParams({ email });
      if (stage) params.set("stage", stage);
      fetches.push(
        fetch(`/api/diagnostics/longitudinal?${params}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.ok && d.hasBaseline) {
              setLongitudinal({
                classification: d.classification,
                metricChanges: d.metricChanges ?? [],
                tensionPersistence: d.tensionPersistence ?? [],
                escalationMovement: d.escalationMovement ?? "stable",
                interventionEffect: d.interventionEffect ?? "unknown",
                baselineDate: d.baselineDate,
                currentDate: d.currentDate,
                contradictions: d.contradictions ?? [],
                persistingContradictions: d.persistingContradictions ?? [],
              });
            }
          })
          .catch(() => {}),
      );
    }

    // Multi-stakeholder — needs campaignId
    if (campaignId) {
      fetches.push(
        fetch(`/api/diagnostics/multi-stakeholder?campaignId=${campaignId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.ok && d.hasData) {
              setMultiStakeholder({
                respondentCount: d.respondentCount,
                sharedAgreement: d.sharedAgreement ?? [],
                criticalDivergences: d.criticalDivergences ?? [],
                highestCostDisagreement: d.highestCostDisagreement ?? null,
                structuralContradictions: d.structuralContradictions ?? [],
                organisationalCondition: d.organisationalCondition ?? "",
                divergenceWorsensCondition: d.divergenceWorsensCondition ?? "",
              });
            }
          })
          .catch(() => {}),
      );
    }

    // Outcome — needs email or sessionId
    if (email || sessionId) {
      const params = new URLSearchParams();
      if (email) params.set("email", email);
      if (sessionId) params.set("sessionId", sessionId);
      fetches.push(
        fetch(`/api/diagnostics/outcome?${params}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.ok && d.hasOutcome) {
              setOutcome({
                classification: d.classification,
                baselineCondition: d.baselineCondition ?? "",
                currentCondition: d.currentCondition ?? "",
                netMovement: d.netMovement ?? "",
                unresolvedContradictions: d.unresolvedContradictions ?? [],
                contradictionEvidence: d.contradictionEvidence ?? [],
                interventionEffectiveness: d.interventionEffectiveness ?? {
                  whatImproved: [],
                  whatDidNot: [],
                  whatRemainsUncorrected: "",
                },
                strategyRoomHeld: d.strategyRoomHeld ?? null,
                baselineDate: d.baselineDate,
                currentDate: d.currentDate,
              });
            }
          })
          .catch(() => {}),
      );
    }

    Promise.allSettled(fetches).finally(() => setLoading(false));
  }, [email, stage, campaignId, sessionId, enabled]);

  return { longitudinal, multiStakeholder, outcome, loading };
}
