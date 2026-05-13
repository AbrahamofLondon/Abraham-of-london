import { parseObservedAt } from "@/utils/dates";

export type EnterpriseSignalCategory =
  | "headcount_movement"
  | "attrition"
  | "absenteeism"
  | "delivery_variance"
  | "financial_stress"
  | "decision_cycle_delay"
  | "incident_rate"
  | "stakeholder_churn";

export type EnterpriseSignalInput = {
  source: string;
  category: EnterpriseSignalCategory;
  label: string;
  value: number;
  unit?: string;
  observedAt?: string;
  metadata?: Record<string, unknown>;
};

export type EnterpriseDataAdapter = {
  source: string;
  parse(input: unknown): EnterpriseSignalInput[];
};

export function parseCsvEnterpriseSignals(csv: string, source = "csv_upload"): EnterpriseSignalInput[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, cols[index] || ""]));
    return {
      source,
      category: normalizeCategory(row.category),
      label: row.label || row.category || "Enterprise signal",
      value: Number(row.value) || 0,
      unit: row.unit || undefined,
      observedAt: parseObservedAt(row.observedAt),
      metadata: row,
    };
  });
}

export function normalizeCategory(value: unknown): EnterpriseSignalCategory {
  const key = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const allowed: EnterpriseSignalCategory[] = [
    "headcount_movement",
    "attrition",
    "absenteeism",
    "delivery_variance",
    "financial_stress",
    "decision_cycle_delay",
    "incident_rate",
    "stakeholder_churn",
  ];
  return allowed.includes(key as EnterpriseSignalCategory)
    ? (key as EnterpriseSignalCategory)
    : "delivery_variance";
}

export function parseManualKpiImport(
  input: Array<Partial<EnterpriseSignalInput>>,
  source = "manual_kpi_import",
): EnterpriseSignalInput[] {
  return input.map((item) => ({
    source: item.source || source,
    category: normalizeCategory(item.category),
    label: String(item.label || item.category || "Manual KPI"),
    value: Number(item.value) || 0,
    unit: item.unit,
    observedAt: parseObservedAt(item.observedAt),
    metadata: item.metadata || {},
  }));
}

export function translateSignalsToConstitution(signals: EnterpriseSignalInput[]) {
  const riskPostureModifiers: string[] = [];
  const evidenceReinforcement: string[] = [];
  let severityModifier = 0;
  let governanceModifier = 0;

  for (const signal of signals) {
    if (signal.category === "financial_stress" && signal.value > 0) {
      severityModifier += Math.min(20, signal.value);
      riskPostureModifiers.push("financial stress reinforces consequence risk");
    }
    if (signal.category === "decision_cycle_delay" && signal.value > 0) {
      governanceModifier -= Math.min(15, signal.value);
      evidenceReinforcement.push("decision cycle delay reinforces governance strain");
    }
    if (signal.category === "attrition" || signal.category === "absenteeism") {
      severityModifier += Math.min(12, signal.value);
      evidenceReinforcement.push(`${signal.label} reinforces organisational strain`);
    }
  }

  return {
    constitutionalMetrics: {
      severityModifier,
      governanceModifier,
    },
    riskPostureModifiers,
    evidenceReinforcement,
    benchmarkEnrichment: signals.map((signal) => ({
      metric: signal.category,
      value: signal.value,
    })),
    trajectorySupport: {
      importedSignalCount: signals.length,
      risingPressureSignals: signals.filter((signal) => signal.value > 0).length,
    },
  };
}

export function buildEnterpriseSignalBlock(signals: EnterpriseSignalInput[]) {
  const translated = translateSignalsToConstitution(signals);
  return {
    integrated: signals.length > 0,
    sources: [...new Set(signals.map((signal) => signal.source))],
    signals: signals.map((signal) => ({
      category: signal.category,
      label: signal.label,
      value: signal.value,
      unit: signal.unit,
      direction: signal.value > 0 ? "negative" as const : "neutral" as const,
      evidenceWeight: Math.min(100, Math.max(10, Math.round(Math.abs(signal.value) * 5))),
    })),
    riskPostureModifiers: translated.riskPostureModifiers,
    evidenceReinforcement: translated.evidenceReinforcement,
  };
}
