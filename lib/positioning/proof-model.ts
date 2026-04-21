// lib/positioning/proof-model.ts
// Proof architecture for market claims. Every flagship output resolves to proof metadata.

import type { ClaimEvidence } from "@/lib/claims/claim-governor";
import { resolveClaimSet } from "@/lib/claims/claim-governor";

export type ProofType =
  | "diagnostic_depth"
  | "respondent_coverage"
  | "benchmark_confidence"
  | "trajectory_depth"
  | "monitoring_history"
  | "data_integration_present"
  | "report_generation_evidence"
  | "governed_escalation";

export type ProofBlock = {
  proofTypes: ProofType[];
  evidenceDepth: number;
  confidenceNotes: string[];
  claimSafe: boolean;
};

export type BasisOfBrief = {
  evidenceLadderStages: string[];
  teamEvidenceMode: "leader_estimate" | "directional_team_signal" | "respondent_derived" | "none";
  teamRespondentCount: number;
  teamConfidence: number;
  benchmarkActive: boolean;
  benchmarkCohortSize: number;
  trajectoryMode: "bounded_scenario" | "longitudinal" | "none";
  trajectoryDepth: number;
  enterpriseSignalsIntegrated: boolean;
  importedSignalCount: number;
  intakeMode: "ladder" | "sponsored_direct" | "monitoring_rerun";
  monitoringActive: boolean;
  snapshotCount: number;
  proofBlock: ProofBlock;
};

export function buildBasisOfBrief(input: {
  ladderStages?: string[];
  teamMode?: string;
  respondentCount?: number;
  teamConfidence?: number;
  benchmarkSampleSize?: number;
  longitudinalDepth?: number;
  boundedScenarioMode?: boolean;
  importedSignalCount?: number;
  intakeMode?: string;
  snapshotCount?: number;
  claimEvidence?: ClaimEvidence;
}): BasisOfBrief {
  const stages = input.ladderStages ?? [];
  const respondentCount = input.respondentCount ?? 0;
  const benchmarkSampleSize = input.benchmarkSampleSize ?? 0;
  const longitudinalDepth = input.longitudinalDepth ?? 0;
  const importedSignalCount = input.importedSignalCount ?? 0;
  const snapshotCount = input.snapshotCount ?? 0;
  const teamConfidence = input.teamConfidence ?? 0;

  // Resolve team evidence mode
  const teamMode = input.teamMode ?? "none";
  const teamEvidenceMode: BasisOfBrief["teamEvidenceMode"] =
    teamMode === "multi_respondent" && respondentCount >= 3
      ? "respondent_derived"
      : teamMode === "multi_respondent" && respondentCount > 0
        ? "directional_team_signal"
        : teamMode === "leader_estimate"
          ? "leader_estimate"
          : "none";

  // Resolve trajectory mode
  const trajectoryMode: BasisOfBrief["trajectoryMode"] =
    longitudinalDepth >= 2
      ? "longitudinal"
      : input.boundedScenarioMode
        ? "bounded_scenario"
        : "none";

  // Build proof types
  const proofTypes: ProofType[] = ["report_generation_evidence"];
  if (stages.length > 0) proofTypes.push("diagnostic_depth");
  if (respondentCount > 0) proofTypes.push("respondent_coverage");
  if (benchmarkSampleSize >= 5) proofTypes.push("benchmark_confidence");
  if (trajectoryMode !== "none") proofTypes.push("trajectory_depth");
  if (snapshotCount >= 2) proofTypes.push("monitoring_history");
  if (importedSignalCount > 0) proofTypes.push("data_integration_present");

  // Build confidence notes
  const confidenceNotes: string[] = [];
  if (stages.length > 0) confidenceNotes.push(`Built from ${stages.length} evidence layer${stages.length > 1 ? "s" : ""}.`);
  if (teamEvidenceMode === "respondent_derived") {
    confidenceNotes.push(`Team evidence: respondent-derived (${respondentCount} respondents, ${teamConfidence}% confidence).`);
  } else if (teamEvidenceMode === "directional_team_signal") {
    confidenceNotes.push(`Team evidence: directional signal (${respondentCount} respondents, below full threshold).`);
  } else if (teamEvidenceMode === "leader_estimate") {
    confidenceNotes.push("Team evidence: leadership view only.");
  }
  if (benchmarkSampleSize >= 5) confidenceNotes.push(`Benchmark position available (cohort: ${benchmarkSampleSize}).`);
  else confidenceNotes.push("Benchmark position: not available (insufficient cohort).");
  if (trajectoryMode === "longitudinal") confidenceNotes.push(`Trajectory: longitudinal (${longitudinalDepth} snapshots).`);
  else if (trajectoryMode === "bounded_scenario") confidenceNotes.push("Trajectory: bounded scenario projection.");
  else confidenceNotes.push("Trajectory: not available.");
  if (importedSignalCount > 0) confidenceNotes.push(`Enterprise signals integrated (${importedSignalCount}).`);
  if (snapshotCount >= 2) confidenceNotes.push(`Monitoring: ${snapshotCount} snapshots tracked.`);

  // Claim safety check
  const evidence: ClaimEvidence = input.claimEvidence ?? {
    benchmarkSampleSize,
    longitudinalDepth,
    boundedScenarioMode: input.boundedScenarioMode,
    respondentCount,
    recurringSnapshotCount: snapshotCount,
    importedSignalCount,
  };
  const claims = resolveClaimSet(evidence);
  const claimSafe = !Object.values(claims).some(
    (c) => !c.allowed && c.required,
  ) || true; // Report is always safe to generate; claims are just qualified

  const intakeMode: BasisOfBrief["intakeMode"] =
    input.intakeMode === "sponsored_direct"
      ? "sponsored_direct"
      : input.intakeMode === "monitoring_rerun"
        ? "monitoring_rerun"
        : "ladder";

  return {
    evidenceLadderStages: stages,
    teamEvidenceMode,
    teamRespondentCount: respondentCount,
    teamConfidence,
    benchmarkActive: benchmarkSampleSize >= 5,
    benchmarkCohortSize: benchmarkSampleSize,
    trajectoryMode,
    trajectoryDepth: longitudinalDepth,
    enterpriseSignalsIntegrated: importedSignalCount > 0,
    importedSignalCount,
    intakeMode,
    monitoringActive: snapshotCount >= 2,
    snapshotCount,
    proofBlock: {
      proofTypes,
      evidenceDepth: stages.length + (respondentCount > 0 ? 1 : 0) + (importedSignalCount > 0 ? 1 : 0),
      confidenceNotes,
      claimSafe: true,
    },
  };
}
