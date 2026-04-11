// lib/constitution/drift-tribunal.ts
import crypto from "crypto";
import { listDriftFlags, saveTribunalCase, getTribunalCase } from "./observability-store";
import { logConstitutionalEvent } from "./event-log";
import { applyOperatorPenalty } from "./operator-score";
import type { DriftTribunalCase, TribunalCaseStatus, TribunalFinding } from "./observability-types";

export function openTribunalsForDrift(): DriftTribunalCase[] {
  const flags = listDriftFlags();
  const opened: DriftTribunalCase[] = [];

  for (const flag of flags) {
    if (flag.severity !== "BREACH" && flag.severity !== "CRITICAL") continue;

    const existing = getTribunalCase(flag.id);
    if (existing) continue;

    const item: DriftTribunalCase = {
      id: flag.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      driftFlagId: flag.id,
      title: `Tribunal — ${flag.title}`,
      status: "OPEN",
      assignedReviewers: [],
      findings: [],
    };

    saveTribunalCase(item);
    opened.push(item);

    logConstitutionalEvent({
      type: "TRIBUNAL_OPENED",
      severity: flag.severity,
      title: "Drift tribunal opened",
      detail: `A constitutional tribunal has been opened for drift flag: ${flag.title}`,
      metadata: { driftFlagId: flag.id, category: flag.category },
    });
  }

  return opened;
}

export function resolveTribunal(input: {
  tribunalId: string;
  status: Extract<TribunalCaseStatus, "UPHELD" | "OVERTURNED" | "DISMISSED">;
  findings: TribunalFinding[];
  resolutionNotes?: string;
  assignedReviewers?: string[];
}): DriftTribunalCase | null {
  const existing = getTribunalCase(input.tribunalId);
  if (!existing) return null;

  // Find the associated drift flag to check severity and operator key
  const flags = listDriftFlags();
  const associatedFlag = flags.find(f => f.id === existing.driftFlagId);

  const updated: DriftTribunalCase = {
    ...existing,
    updatedAt: new Date().toISOString(),
    status: input.status,
    findings: input.findings,
    resolutionNotes: input.resolutionNotes,
    assignedReviewers: input.assignedReviewers ?? existing.assignedReviewers,
  };

  saveTribunalCase(updated);

  // 🔥 Apply operator penalty if tribunal upholds a breach
  if (input.status === "UPHELD" && associatedFlag && associatedFlag.severity === "BREACH" && associatedFlag.operatorKey) {
    applyOperatorPenalty(associatedFlag.operatorKey, 3);
    logConstitutionalEvent({
      type: "OPERATOR_PENALTY_APPLIED",
      severity: "BREACH",
      title: "Operator penalty applied",
      detail: `Operator ${associatedFlag.operatorKey} penalised for upheld breach.`,
      metadata: { operatorKey: associatedFlag.operatorKey, tribunalId: input.tribunalId, penalty: 3 },
    });
  }

  logConstitutionalEvent({
    type: "TRIBUNAL_RESOLVED",
    severity:
      input.status === "UPHELD"
        ? "BREACH"
        : input.status === "OVERTURNED"
          ? "NOTICE"
          : "INFO",
    title: "Drift tribunal resolved",
    detail: `Tribunal ${input.tribunalId} resolved with status ${input.status}.`,
    metadata: {
      tribunalId: input.tribunalId,
      findings: input.findings,
    },
  });

  return updated;
}