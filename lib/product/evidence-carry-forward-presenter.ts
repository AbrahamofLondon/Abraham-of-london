import {
  type AssessmentEvidenceCapture,
  isUnsafeAssessmentEvidenceText,
  summarizeAssessmentEvidenceText,
} from "@/lib/product/evidence-capture-contract";
import type { DiagnosticJourneyRecord } from "@/lib/product/diagnostic-journey-record";
import type { RecommendationOutcomeLedgerEntry } from "@/lib/product/recommendation-outcome-ledger";

export type EvidenceCarryForwardRow = {
  key: keyof AssessmentEvidenceCapture;
  label: string;
  value: string;
  accent: string;
};

export type EvidenceCarryForwardDisplay = {
  title: string;
  intro: string;
  impact?: string;
  rows: EvidenceCarryForwardRow[];
};

export type ExecutiveEvidenceSource =
  | "constitutional_diagnostic"
  | "team_assessment"
  | "enterprise_assessment"
  | "recommendation_ledger"
  | "executive_intake"
  | "purpose_alignment";

export type ExecutiveEvidenceCarryForwardItem = {
  id: string;
  source: ExecutiveEvidenceSource;
  label: string;
  summary: string;
  evidencePosture: "CARRIED_FORWARD" | "AGGREGATE_ONLY" | "HISTORY" | "INTAKE";
};

export type ExecutiveEvidenceCarryForwardModel = {
  items: ExecutiveEvidenceCarryForwardItem[];
  gaps: string[];
  sourceSurfaces: ExecutiveEvidenceSource[];
};

function safeValue(value: string | undefined, max = 220): string | null {
  if (!value) return null;
  if (isUnsafeAssessmentEvidenceText(value)) {
    return "Evidence captured but withheld from display.";
  }
  return summarizeAssessmentEvidenceText(value, max);
}

function publicSummary(value: unknown, max = 220): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!text) return null;
  return safeValue(text, max);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pushExecutiveItem(
  items: ExecutiveEvidenceCarryForwardItem[],
  item: Omit<ExecutiveEvidenceCarryForwardItem, "id"> & { id?: string },
) {
  const summary = publicSummary(item.summary);
  if (!summary) return;
  const duplicate = items.some(
    (existing) => existing.source === item.source && existing.label === item.label && existing.summary === summary,
  );
  if (duplicate) return;
  items.push({
    id: item.id ?? `${item.source}-${items.length + 1}`,
    source: item.source,
    label: item.label,
    summary,
    evidencePosture: item.evidencePosture,
  });
}

function sourceFromStage(value: unknown): ExecutiveEvidenceSource | null {
  const stage = String(value || "").toLowerCase();
  if (stage.includes("constitutional")) return "constitutional_diagnostic";
  if (stage.includes("team")) return "team_assessment";
  if (stage.includes("enterprise")) return "enterprise_assessment";
  if (stage.includes("purpose")) return "purpose_alignment";
  if (stage.includes("executive")) return "executive_intake";
  return null;
}

function collectFromLadderContext(
  items: ExecutiveEvidenceCarryForwardItem[],
  canonical: Record<string, unknown>,
) {
  const ladderContext = objectValue(canonical.ladderContext);
  const constitutional = objectValue(ladderContext.constitutional);
  const team = objectValue(ladderContext.team);
  const enterprise = objectValue(ladderContext.enterprise);

  if (Object.keys(constitutional).length) {
    const route = publicSummary(constitutional.route);
    const severity = publicSummary(constitutional.severity);
    pushExecutiveItem(items, {
      source: "constitutional_diagnostic",
      label: "Constitutional authority posture",
      summary: [route ? `Route: ${route}` : null, severity ? `severity: ${severity}` : null]
        .filter(Boolean)
        .join("; ") || "Prior constitutional evidence is present.",
      evidencePosture: "CARRIED_FORWARD",
    });
  }

  if (Object.keys(team).length) {
    const respondentCount = numberValue(team.respondentCount) ?? numberValue(objectValue(team.aggregate).respondentCount);
    const band = publicSummary(team.band);
    const gaps = Array.isArray(team.gaps)
      ? team.gaps.map((item) => publicSummary(item, 80)).filter(Boolean).slice(0, 2).join("; ")
      : null;
    pushExecutiveItem(items, {
      source: "team_assessment",
      label: respondentCount && respondentCount >= 2 ? "Team aggregate divergence" : "Team assessment signal",
      summary: [
        respondentCount ? `${respondentCount} respondent aggregate` : null,
        band ? `band: ${band}` : null,
        gaps ? `gaps: ${gaps}` : null,
      ].filter(Boolean).join("; ") || "Team assessment evidence is present at aggregate level.",
      evidencePosture: respondentCount && respondentCount >= 2 ? "AGGREGATE_ONLY" : "CARRIED_FORWARD",
    });
  }

  if (Object.keys(enterprise).length) {
    const score = numberValue(enterprise.score);
    const reading = publicSummary(enterprise.reading);
    const route = publicSummary(enterprise.route);
    pushExecutiveItem(items, {
      source: "enterprise_assessment",
      label: "Enterprise stress evidence",
      summary: [
        score !== null ? `score: ${Math.round(score)}` : null,
        reading ? `reading: ${reading}` : null,
        route ? `route: ${route}` : null,
      ].filter(Boolean).join("; ") || "Enterprise assessment evidence is present.",
      evidencePosture: "CARRIED_FORWARD",
    });
  }
}

function collectFromEvidenceGraph(
  items: ExecutiveEvidenceCarryForwardItem[],
  canonical: Record<string, unknown>,
) {
  const graph = objectValue(canonical.evidenceGraph);
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  for (const node of nodes) {
    const record = objectValue(node);
    const source = sourceFromStage(record.sourceStage) ?? sourceFromStage(record.surface);
    if (!source || !["constitutional_diagnostic", "team_assessment", "enterprise_assessment"].includes(source)) continue;
    pushExecutiveItem(items, {
      source,
      label:
        source === "enterprise_assessment"
          ? "Enterprise evidence carried forward"
          : source === "team_assessment"
            ? "Team aggregate evidence carried forward"
            : "Constitutional evidence carried forward",
      summary: publicSummary(record.summary, 180) ?? publicSummary(record.label, 180) ?? "",
      evidencePosture: source === "team_assessment" ? "AGGREGATE_ONLY" : "CARRIED_FORWARD",
    });
  }
}

function collectFromJourneyEvents(
  items: ExecutiveEvidenceCarryForwardItem[],
  journey: DiagnosticJourneyRecord | null | undefined,
) {
  if (!journey) return;
  const events = journey.events.filter((event) => event.audienceSafe);
  for (const event of events) {
    const source = sourceFromStage(event.surface);
    if (!source || !["constitutional_diagnostic", "team_assessment", "enterprise_assessment"].includes(source)) continue;
    pushExecutiveItem(items, {
      source,
      label:
        source === "enterprise_assessment"
          ? "Enterprise case event"
          : source === "team_assessment"
            ? "Team aggregate case event"
            : "Constitutional case event",
      summary: event.summary,
      evidencePosture: source === "team_assessment" ? "AGGREGATE_ONLY" : "CARRIED_FORWARD",
    });
  }
}

function collectFromRecommendationLedger(
  items: ExecutiveEvidenceCarryForwardItem[],
  ledger: RecommendationOutcomeLedgerEntry[] | null | undefined,
) {
  for (const entry of (ledger ?? []).slice(-3)) {
    const basis = entry.evidenceBasis
      .map((item) => publicSummary(item, 80))
      .filter(Boolean)
      .slice(0, 2)
      .join("; ");
    pushExecutiveItem(items, {
      source: "recommendation_ledger",
      label: `Prior recommendation ${entry.status.toLowerCase().replace(/_/g, " ")}`,
      summary: [entry.recommendedAction, basis ? `basis: ${basis}` : null].filter(Boolean).join("; "),
      evidencePosture: "HISTORY",
    });
  }
}

function collectFromIntake(
  items: ExecutiveEvidenceCarryForwardItem[],
  intake: Record<string, unknown> | null | undefined,
) {
  const decisionNeed = objectValue(intake?.decisionNeed);
  const governance = objectValue(intake?.governance);
  const history = objectValue(intake?.history);
  pushExecutiveItem(items, {
    source: "executive_intake",
    label: "Executive decision need",
    summary: publicSummary(decisionNeed.decisionQuestion, 180) ?? "",
    evidencePosture: "INTAKE",
  });
  pushExecutiveItem(items, {
    source: "executive_intake",
    label: "Owner or sponsor context",
    summary: publicSummary(governance.sponsorNameOrSeat, 120) ?? publicSummary(governance.authorityScope, 120) ?? "",
    evidencePosture: "INTAKE",
  });
  pushExecutiveItem(items, {
    source: "executive_intake",
    label: "Prior recommendation history",
    summary: publicSummary(history.priorAttemptOutcome, 160) ?? "",
    evidencePosture: "INTAKE",
  });
}

function buildGaps(items: ExecutiveEvidenceCarryForwardItem[]): string[] {
  const sources = new Set(items.map((item) => item.source));
  const gaps: string[] = [];
  if (!sources.has("constitutional_diagnostic")) {
    gaps.push("Constitutional authority or mandate evidence has not been carried forward.");
  }
  if (!sources.has("team_assessment")) {
    gaps.push("Team aggregate divergence evidence is not yet available for this report.");
  }
  if (!sources.has("enterprise_assessment")) {
    gaps.push("Enterprise stress, dependency, or exposure evidence is not yet available for this report.");
  }
  if (!sources.has("recommendation_ledger")) {
    gaps.push("Prior recommendation and outcome history is not yet durable for this case.");
  }
  return gaps;
}

export function buildExecutiveCaseEvidenceCarryForward(input: {
  canonical?: Record<string, unknown> | null;
  intake?: Record<string, unknown> | null;
  journey?: DiagnosticJourneyRecord | null;
  recommendationLedger?: RecommendationOutcomeLedgerEntry[] | null;
  includeIntake?: boolean;
}): ExecutiveEvidenceCarryForwardModel {
  const items: ExecutiveEvidenceCarryForwardItem[] = [];
  const canonical = objectValue(input.canonical);

  collectFromLadderContext(items, canonical);
  collectFromEvidenceGraph(items, canonical);
  collectFromJourneyEvents(items, input.journey);
  collectFromRecommendationLedger(items, input.recommendationLedger);
  if (input.includeIntake !== false) {
    collectFromIntake(items, input.intake);
  }

  const sourceSurfaces = [...new Set(items.map((item) => item.source))];
  return {
    items: items.slice(0, 8),
    gaps: buildGaps(items),
    sourceSurfaces,
  };
}

function pushRow(
  rows: EvidenceCarryForwardRow[],
  evidence: AssessmentEvidenceCapture,
  config: {
    key: keyof AssessmentEvidenceCapture;
    label: string;
    accent: string;
    fallback?: string;
    max?: number;
  },
) {
  const raw = evidence[config.key];
  if (!raw) return;
  const nextValue = safeValue(raw, config.max ?? 220);
  if (!nextValue) return;
  rows.push({
    key: config.key,
    label: config.label,
    value: config.fallback ?? nextValue,
    accent: config.accent,
  });
}

export function buildExecutiveEvidenceCarryForward(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "decisionDependency",
    label: "Decision dependency",
    accent: "rgba(201,169,110,0.75)",
  });
  pushRow(rows, evidence, {
    key: "failureCause",
    label: "Reported failure cause",
    accent: "rgba(252,165,165,0.72)",
  });
  pushRow(rows, evidence, {
    key: "priorAttempts",
    label: "Prior attempts",
    accent: "rgba(201,169,110,0.75)",
    fallback: "Earlier correction attempts were reported.",
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "Declared verification standard",
    accent: "rgba(110,231,183,0.72)",
  });
  pushRow(rows, evidence, {
    key: "escalationTrigger",
    label: "Captured escalation threshold",
    accent: "rgba(252,165,165,0.75)",
  });

  if (!rows.length) return null;

  let impact = "The recommendation stays governed against prior failure history rather than treating this as a new condition.";
  if (evidence.decisionDependency) {
    impact = "The recommendation is being shaped around the unresolved dependency rather than assuming execution authority already exists.";
  } else if (evidence.failureCause || evidence.priorAttempts) {
    impact = "The recommendation has been narrowed to avoid repeating earlier correction logic that was reported to fail or fail to hold.";
  } else if (evidence.verificationCriteria) {
    impact = "The recommendation is being shaped against the declared verification standard rather than generic progress language.";
  }

  return {
    title: "Evidence carried forward",
    intro: "This report has inherited prior governance evidence. It affects the recommendation because earlier failure logic, dependency, or proof standards remain relevant.",
    impact,
    rows: rows.slice(0, 3),
  };
}

export function buildStrategyEntryEvidenceMemory(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "failureCause",
    label: "Reported failure cause",
    accent: "rgba(252,165,165,0.72)",
  });
  pushRow(rows, evidence, {
    key: "priorAttempts",
    label: "Prior attempts",
    accent: "rgba(201,169,110,0.75)",
    fallback: "Earlier correction attempts were reported.",
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "Declared verification standard",
    accent: "rgba(110,231,183,0.72)",
  });
  pushRow(rows, evidence, {
    key: "decisionDependency",
    label: "Dependency to resolve",
    accent: "rgba(201,169,110,0.75)",
  });
  pushRow(rows, evidence, {
    key: "escalationTrigger",
    label: "Captured escalation threshold",
    accent: "rgba(252,165,165,0.75)",
  });

  if (!rows.length) return null;

  return {
    title: "Execution memory",
    intro: "Before execution begins, the system is carrying forward the following unresolved constraints.",
    rows,
  };
}

export function buildStrategySessionEvidenceMemory(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "failureCause",
    label: "Reported failure cause",
    accent: "rgba(252,165,165,0.72)",
    max: 180,
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "Declared verification standard",
    accent: "rgba(110,231,183,0.72)",
    max: 180,
  });
  pushRow(rows, evidence, {
    key: "stopSignal",
    label: "Stop condition",
    accent: "rgba(253,186,116,0.72)",
    max: 180,
  });
  pushRow(rows, evidence, {
    key: "escalationTrigger",
    label: "Captured escalation threshold",
    accent: "rgba(252,165,165,0.75)",
    max: 180,
  });

  if (!rows.length) return null;

  return {
    title: "Unresolved execution memory",
    intro: "These items remain active in this session. They should shape what is committed, stopped, or escalated.",
    rows: rows.slice(0, 4),
  };
}

export function buildDecisionCentreCaseMemory(
  evidence: AssessmentEvidenceCapture | null | undefined,
): EvidenceCarryForwardDisplay | null {
  if (!evidence) return null;
  const rows: EvidenceCarryForwardRow[] = [];

  pushRow(rows, evidence, {
    key: "priorAttempts",
    label: "What has already been tried",
    accent: "rgba(201,169,110,0.75)",
  });
  pushRow(rows, evidence, {
    key: evidence.failureCause ? "failureCause" : evidence.decisionDependency ? "decisionDependency" : "stopSignal",
    label: "What remains unresolved",
    accent: "rgba(252,165,165,0.72)",
  });
  pushRow(rows, evidence, {
    key: "verificationCriteria",
    label: "What would count as proof",
    accent: "rgba(110,231,183,0.72)",
  });

  if (!rows.length) return null;

  return {
    title: "Case memory",
    intro: "This case is carrying forward prior evidence. The next step should not ignore it.",
    rows: rows.slice(0, 3),
  };
}
