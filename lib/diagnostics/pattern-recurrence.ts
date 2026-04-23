import type {
  CanonicalDecisionObject,
  DiagnosticEvidenceNodeInput,
  EvidenceSeverity,
} from "@/lib/diagnostics/evidence-graph";

export type RecurrenceInput = {
  baseline?: {
    evidenceNodes?: DiagnosticEvidenceNodeInput[];
    decisionObjects?: CanonicalDecisionObject[];
  } | null;
  current?: {
    evidenceNodes?: DiagnosticEvidenceNodeInput[];
    decisionObjects?: CanonicalDecisionObject[];
  } | null;
};

export type PatternRecurrenceResult = {
  recurringContradictions: string[];
  recurringDecisionKeys: string[];
  recurringAuthorityFailures: string[];
  resolvedPatternReappeared: boolean;
  recurrenceScore: number;
  severity: EvidenceSeverity;
  evidenceNodes: DiagnosticEvidenceNodeInput[];
};

function norm(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function labelsByKind(nodes: DiagnosticEvidenceNodeInput[] | undefined, kind: string): string[] {
  return unique((nodes || [])
    .filter((node) => node.kind === kind)
    .map((node) => node.label || node.summary));
}

function intersect(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map(norm));
  return a.filter((item) => bSet.has(norm(item)));
}

function severityFromScore(score: number): EvidenceSeverity {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function authorityFailures(nodes: DiagnosticEvidenceNodeInput[] | undefined): string[] {
  return unique((nodes || [])
    .filter((node) => {
      const text = `${node.label} ${node.summary} ${node.evidenceText || ""}`.toLowerCase();
      return text.includes("authority") || text.includes("mandate") || text.includes("decision right");
    })
    .map((node) => node.label || node.summary));
}

export function detectPatternRecurrence(input: RecurrenceInput): PatternRecurrenceResult {
  const baselineNodes = input.baseline?.evidenceNodes || [];
  const currentNodes = input.current?.evidenceNodes || [];
  const baselineDecisions = input.baseline?.decisionObjects || [];
  const currentDecisions = input.current?.decisionObjects || [];

  const recurringContradictions = intersect(
    labelsByKind(baselineNodes, "contradiction"),
    labelsByKind(currentNodes, "contradiction"),
  );

  const recurringDecisionKeys = intersect(
    unique(baselineDecisions.map((decision) => decision.decisionKey)),
    unique(currentDecisions.map((decision) => decision.decisionKey)),
  );

  const recurringAuthorityFailures = intersect(
    authorityFailures(baselineNodes),
    authorityFailures(currentNodes),
  );

  const previouslyResolved = baselineNodes.some((node) =>
    node.kind === "resolved_condition" || node.kind === "partial_resolution",
  );
  const resolvedPatternReappeared =
    previouslyResolved &&
    (recurringContradictions.length > 0 ||
      recurringDecisionKeys.length > 0 ||
      recurringAuthorityFailures.length > 0);

  const recurrenceScore = Math.min(
    100,
    recurringContradictions.length * 24 +
      recurringDecisionKeys.length * 28 +
      recurringAuthorityFailures.length * 32 +
      (resolvedPatternReappeared ? 16 : 0),
  );
  const severity = severityFromScore(recurrenceScore);

  const evidenceNodes: DiagnosticEvidenceNodeInput[] = [];
  if (recurrenceScore > 0) {
    evidenceNodes.push({
      sourceStage: "monitoring",
      kind: "pattern_recurrence",
      label: resolvedPatternReappeared
        ? "Resolved pattern reappeared"
        : "Recurring diagnostic pattern",
      summary:
        recurringContradictions[0] ||
        recurringAuthorityFailures[0] ||
        recurringDecisionKeys[0] ||
        "Previously observed pattern has recurred.",
      evidenceText: [
        recurringContradictions.length
          ? `Recurring contradictions: ${recurringContradictions.join("; ")}.`
          : "",
        recurringDecisionKeys.length
          ? `Recurring decision objects: ${recurringDecisionKeys.join("; ")}.`
          : "",
        recurringAuthorityFailures.length
          ? `Authority failures resurfaced: ${recurringAuthorityFailures.join("; ")}.`
          : "",
      ].filter(Boolean).join(" "),
      confidence: Math.min(0.95, 0.45 + recurrenceScore / 140),
      severity,
      payload: {
        recurringContradictions,
        recurringDecisionKeys,
        recurringAuthorityFailures,
        resolvedPatternReappeared,
        recurrenceScore,
      },
    });
  }

  return {
    recurringContradictions,
    recurringDecisionKeys,
    recurringAuthorityFailures,
    resolvedPatternReappeared,
    recurrenceScore,
    severity,
    evidenceNodes,
  };
}
