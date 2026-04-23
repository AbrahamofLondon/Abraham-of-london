export type DecisionSurfacePayload = {
  decisionId: string;
  contradictions: Array<{
    id: string;
    label: string;
    summary: string;
    severity: number;
    confidence: number;
    sourceStage: string;
  }>;
  enforcementState: "PENDING" | "ACTIVE" | "ESCALATED" | "RESOLVED";
  consequenceScore?: number;
};

type RawContradiction = {
  id?: string | null;
  label?: string | null;
  summary?: string | null;
  severity?: string | number | null;
  confidence?: number | null;
  sourceStage?: string | null;
};

export function normalizeContradictionSeverity(value: string | number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  switch (String(value || "").toLowerCase()) {
    case "critical": return 95;
    case "high": return 75;
    case "medium": return 50;
    case "low": return 25;
    default: return 50;
  }
}

export function toDecisionSurfaceContradictions(
  contradictions: RawContradiction[],
): DecisionSurfacePayload["contradictions"] {
  return contradictions
    .map((item, index) => {
      const label = String(item.label || "").trim();
      const summary = String(item.summary || "").trim();
      const sourceStage = String(item.sourceStage || "").trim();
      if (!label || !summary || !sourceStage) return null;
      return {
        id: String(item.id || `${sourceStage}:${label}:${index}`),
        label,
        summary,
        severity: normalizeContradictionSeverity(item.severity),
        confidence: Math.max(0, Math.min(1, typeof item.confidence === "number" ? item.confidence : 0.5)),
        sourceStage,
      };
    })
    .filter((item): item is DecisionSurfacePayload["contradictions"][number] => Boolean(item));
}

export function buildDecisionSurfacePayload(input: {
  decisionId?: string | null;
  contradictions: RawContradiction[];
  enforcementState: DecisionSurfacePayload["enforcementState"];
  consequenceScore?: number | null;
}): DecisionSurfacePayload {
  const decisionId = String(input.decisionId || "").trim();
  if (!decisionId) throw new Error("Decision surface requires decisionId.");

  const contradictions = toDecisionSurfaceContradictions(input.contradictions);
  if (!contradictions.length) {
    throw new Error("Decision surface requires at least one contradiction.");
  }

  return {
    decisionId,
    contradictions,
    enforcementState: input.enforcementState,
    ...(typeof input.consequenceScore === "number" && Number.isFinite(input.consequenceScore)
      ? { consequenceScore: Math.max(0, Math.min(100, Math.round(input.consequenceScore))) }
      : {}),
  };
}

export function insufficientEvidenceContradiction(input: {
  id: string;
  sourceStage: string;
  summary?: string;
}): DecisionSurfacePayload["contradictions"][number] {
  return {
    id: input.id,
    label: "Insufficient contradiction evidence",
    summary: input.summary || "The endpoint cannot yet resolve a durable contradiction from persisted evidence.",
    severity: 50,
    confidence: 0.35,
    sourceStage: input.sourceStage,
  };
}
