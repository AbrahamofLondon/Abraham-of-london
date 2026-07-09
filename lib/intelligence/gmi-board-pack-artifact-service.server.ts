import crypto from "node:crypto";
import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import { prisma } from "@/lib/prisma";

import {
  canonicalHash,
  getGmiBoardPulseData,
  getGmiCallLedger,
  getGmiFalsificationRules,
  getGmiPerformanceMetrics,
  getGmiProvenanceState,
  getGmiReleaseSnapshots,
  getGmiSourceAppendix,
} from "./gmi-data-service.server";
import { GMI_METHODOLOGY } from "./gmi-methodology";

export type GmiBoardPackArtifactType = "board_pack_pdf" | "board_pulse_pdf";
export type GmiBoardPackArtifactStatus = "generated" | "failed" | "superseded";

export type GmiBoardPackArtifact = {
  id: string;
  editionId: string;
  snapshotId: string | null;
  artifactType: GmiBoardPackArtifactType;
  fileName: string;
  storagePath: string | null;
  publicUrl: string | null;
  contentHash: string;
  generatedFromStateHash: string;
  generatedAt: string;
  generatedBy: string | null;
  status: GmiBoardPackArtifactStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GmiBoardPackArtifactValidation = {
  ok: boolean;
  artifact: GmiBoardPackArtifact | null;
  currentStateHash: string;
  latestMaterialMutationAt: string | null;
  reason: string | null;
};

function artifactId(): string {
  return `gmibpa_${crypto.randomUUID().replace(/-/g, "")}`;
}

function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function iso(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function array(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function latestIso(values: Array<string | null>): string | null {
  const times = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a);
  return times[0] === undefined ? null : new Date(times[0]).toISOString();
}

function mapArtifact(row: {
  id: string;
  editionId: string;
  snapshotId: string | null;
  artifactType: string;
  fileName: string;
  storagePath: string | null;
  publicUrl: string | null;
  contentHash: string;
  generatedFromStateHash: string;
  generatedAt: Date;
  generatedBy: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GmiBoardPackArtifact {
  return {
    id: row.id,
    editionId: row.editionId,
    snapshotId: row.snapshotId,
    artifactType: row.artifactType as GmiBoardPackArtifactType,
    fileName: row.fileName,
    storagePath: row.storagePath,
    publicUrl: row.publicUrl,
    contentHash: row.contentHash,
    generatedFromStateHash: row.generatedFromStateHash,
    generatedAt: row.generatedAt.toISOString(),
    generatedBy: row.generatedBy,
    status: row.status as GmiBoardPackArtifactStatus,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getGmiMaterialStateFingerprint(editionId: string) {
  const [calls, sources, falsification, board, performance] = await Promise.all([
    getGmiCallLedger(editionId),
    getGmiSourceAppendix(editionId),
    getGmiFalsificationRules(editionId),
    getGmiBoardPulseData(editionId),
    getGmiPerformanceMetrics(editionId),
  ]);
  const material = {
    calls: calls.data.map((call) => ({
      callId: call.callId,
      currentStatus: call.currentStatus,
      currentScore: call.currentScore,
      evidenceSourceRows: call.evidenceSourceRows,
      justification: call.justification,
      carryForwardJustification: call.carryForwardJustification,
      nextReviewDue: call.nextReviewDue,
      updatedAt: call.updatedAt,
    })),
    sources: sources.data.map((source) => ({
      sourceRowId: source.sourceRowId,
      status: source.status,
      releaseBlocker: source.releaseBlocker,
      methodNote: source.methodNote,
      adminJustification: source.adminJustification,
      updatedAt: source.updatedAt,
    })),
    falsification: falsification.data.map((rule) => ({
      id: rule.id,
      thesisId: rule.thesisId,
      currentStatus: rule.currentStatus,
      observableIndicator: rule.observableIndicator,
      thresholdType: rule.thresholdType,
      thresholdValue: rule.thresholdValue,
      evidenceSourceRows: rule.evidenceSourceRows,
      nextReviewDue: rule.nextReviewDue,
      updatedAt: rule.updatedAt,
    })),
    board: board.data,
    performance: {
      totalCallsIssued: performance.data.totalCallsIssued,
      totalCallsReviewed: performance.data.totalCallsReviewed,
      averageScore: performance.data.averageScore,
      scoreDistribution: performance.data.scoreDistribution,
    },
  };
  return {
    stateHash: canonicalHash(material),
    latestMaterialMutationAt: latestIso([
      calls.provenance.lastUpdatedAt,
      sources.provenance.lastUpdatedAt,
      falsification.provenance.lastUpdatedAt,
      board.provenance.lastUpdatedAt,
      performance.provenance.lastUpdatedAt,
    ]),
  };
}

export function releaseSnapshotStateHash(snapshot: {
  callLedgerHash: string;
  sourceAppendixHash: string;
  falsificationHash: string;
  boardPulseHash: string;
  performanceMetricsJson: Record<string, unknown>;
}): string {
  return canonicalHash({
    callLedgerHash: snapshot.callLedgerHash,
    sourceAppendixHash: snapshot.sourceAppendixHash,
    falsificationHash: snapshot.falsificationHash,
    boardPulseHash: snapshot.boardPulseHash,
    performanceMetricsJson: snapshot.performanceMetricsJson,
  });
}

export async function buildDbDerivedGmiBoardPack(editionId: string) {
  const [calls, sources, falsification, boardPulse, performance, provenance, snapshots] = await Promise.all([
    getGmiCallLedger(editionId),
    getGmiSourceAppendix(editionId),
    getGmiFalsificationRules(editionId),
    getGmiBoardPulseData(editionId),
    getGmiPerformanceMetrics(editionId),
    getGmiProvenanceState(editionId),
    getGmiReleaseSnapshots(editionId),
  ]);
  const publishedSnapshot = snapshots.data.find((snapshot) => snapshot.releaseStatus === "PUBLISHED" && snapshot.publishedAt);
  const snapshotState = publishedSnapshot?.stateJson as any;
  const callRows = array(snapshotState?.calls).length > 0 ? array(snapshotState.calls) : calls.data;
  const sourceRows = array(snapshotState?.sources).length > 0 ? array(snapshotState.sources) : sources.data;
  const falsificationRows = array(snapshotState?.falsificationRules).length > 0 ? array(snapshotState.falsificationRules) : falsification.data;
  const boardData = snapshotState?.boardPulse ?? boardPulse.data;
  const performanceData = snapshotState?.performance ?? performance.data;
  const decisionsToMakeIn30Days = array(boardData?.decisionsToMakeIn30Days);
  return {
    editionId,
    generatedAt: new Date().toISOString(),
    title: `${editionId} Board Pack Snapshot`,
    legalBoundary: GMI_METHODOLOGY.legalBoundary,
    watchSignals: sourceRows.slice(0, 3).map((source) => ({
      signal: source.claim,
      currentStatus: source.status,
      triggerThreshold: source.methodNote ?? source.observationWindow,
      evidencePosture: source.confidence,
      actionIfTriggered: source.adminJustification ?? "Review in Board Pulse.",
    })),
    boardDecisions: decisionsToMakeIn30Days.map((decision) => ({
      decision: String(decision.decision ?? decision),
      timingCondition: String(decision.whyNow ?? "30-day decision window"),
      riskIfDelayed: String(decision.riskIfDelayed ?? "Decision delay compounds exposure."),
      ownerFunction: String(decision.suggestedOwner ?? "Board / Executive"),
      route: String(decision.route ?? "prepare"),
    })),
    scenarioSummary: sourceRows
      .filter((source) => source.evidenceClass === "SCENARIO_ASSUMPTION")
      .map((source) => ({
        label: source.claim,
        probability: 0,
        methodNote: source.methodNote ?? source.confidenceBasis ?? "Scenario assumption.",
      })),
    falsificationThresholds: falsificationRows.map((rule) => ({
      threshold: rule.thresholdValue,
      observableSignal: rule.observableIndicator,
      reviewTiming: rule.nextReviewDue ?? "Not scheduled",
    })),
    operatorConsequenceIndex: array(boardData?.operatorConsequenceIndex),
    decisionsToMakeIn30Days,
    decisionsToPrepareIn90Days: array(boardData?.decisionsToPrepareIn90Days),
    decisionsToDefer: array(boardData?.decisionsToDefer),
    priorCallSummary: {
      totalCalls: performanceData.totalCallsIssued,
      reviewed: performanceData.totalCallsReviewed,
      pending: array(performanceData.callsDueForReview).length,
      averageScore: performanceData.averageScore,
      confirmed: performanceData.confirmedCount,
      partiallyConfirmed: performanceData.partialCount,
      notConfirmed: performanceData.weakDisconfirmedCount,
      tooEarly: performanceData.pendingCarryForwardCount,
    },
    nextActions: [
      { label: "Board-level exposure", href: "/boardroom-brief" },
      { label: "Severe strategic decision", href: "/strategy-room" },
    ],
    provenance: provenance.data,
    sourceRows: sourceRows.length,
    callRows: callRows.length,
    latestSnapshotId: publishedSnapshot?.id ?? snapshots.data[0]?.id ?? null,
  };
}

export async function renderGmiBoardPackPdfBuffer(editionId: string): Promise<Buffer> {
  const [{ renderToBuffer }, { GmiBoardPackPDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/intelligence/gmi-board-pack-pdf"),
  ]);
  const pack = await buildDbDerivedGmiBoardPack(editionId);
  const pdfElement = React.createElement(GmiBoardPackPDF, { pack: pack as any }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(pdfElement);
}

export async function getLatestGmiBoardPackArtifact(
  editionId: string,
  artifactType: GmiBoardPackArtifactType = "board_pack_pdf",
): Promise<GmiBoardPackArtifact | null> {
  const rows = await prisma.$queryRaw<Array<Parameters<typeof mapArtifact>[0]>>`
    SELECT
      "id",
      "edition_id" AS "editionId",
      "snapshot_id" AS "snapshotId",
      "artifact_type" AS "artifactType",
      "file_name" AS "fileName",
      "storage_path" AS "storagePath",
      "public_url" AS "publicUrl",
      "content_hash" AS "contentHash",
      "generated_from_state_hash" AS "generatedFromStateHash",
      "generated_at" AS "generatedAt",
      "generated_by" AS "generatedBy",
      "status",
      "error_message" AS "errorMessage",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt"
    FROM "gmi_board_pack_artifacts"
    WHERE "edition_id" = ${editionId} AND "artifact_type" = ${artifactType}
    ORDER BY "generated_at" DESC
    LIMIT 1
  `;
  return rows[0] ? mapArtifact(rows[0]) : null;
}

export async function validateGmiBoardPackArtifact(
  editionId: string,
  artifactType: GmiBoardPackArtifactType = "board_pack_pdf",
): Promise<GmiBoardPackArtifactValidation> {
  const [artifact, fingerprint, snapshots] = await Promise.all([
    getLatestGmiBoardPackArtifact(editionId, artifactType),
    getGmiMaterialStateFingerprint(editionId),
    getGmiReleaseSnapshots(editionId),
  ]);

  if (!artifact) {
    return { ok: false, artifact, currentStateHash: fingerprint.stateHash, latestMaterialMutationAt: fingerprint.latestMaterialMutationAt, reason: "NO_ARTIFACT" };
  }
  if (artifact.status !== "generated") {
    return { ok: false, artifact, currentStateHash: fingerprint.stateHash, latestMaterialMutationAt: fingerprint.latestMaterialMutationAt, reason: `ARTIFACT_${artifact.status.toUpperCase()}` };
  }
  if (!artifact.contentHash || !artifact.generatedAt) {
    return { ok: false, artifact, currentStateHash: fingerprint.stateHash, latestMaterialMutationAt: fingerprint.latestMaterialMutationAt, reason: "ARTIFACT_INCOMPLETE" };
  }
  const publishedSnapshotHashes = snapshots.data
    .filter((snapshot) => snapshot.releaseStatus === "PUBLISHED" && snapshot.publishedAt)
    .map(releaseSnapshotStateHash);
  const matchesCurrentState = artifact.generatedFromStateHash === fingerprint.stateHash;
  const matchesPublishedSnapshot = publishedSnapshotHashes.includes(artifact.generatedFromStateHash);
  if (!matchesCurrentState && !matchesPublishedSnapshot) {
    return { ok: false, artifact, currentStateHash: fingerprint.stateHash, latestMaterialMutationAt: fingerprint.latestMaterialMutationAt, reason: "STATE_HASH_MISMATCH" };
  }
  if (
    matchesCurrentState &&
    fingerprint.latestMaterialMutationAt &&
    new Date(artifact.generatedAt).getTime() < new Date(fingerprint.latestMaterialMutationAt).getTime()
  ) {
    return { ok: false, artifact, currentStateHash: fingerprint.stateHash, latestMaterialMutationAt: fingerprint.latestMaterialMutationAt, reason: "ARTIFACT_STALE" };
  }
  return { ok: true, artifact, currentStateHash: fingerprint.stateHash, latestMaterialMutationAt: fingerprint.latestMaterialMutationAt, reason: null };
}

export async function createGmiBoardPackArtifact(input: {
  editionId: string;
  snapshotId?: string | null;
  artifactType?: GmiBoardPackArtifactType;
  generatedBy?: string | null;
  generatedFromStateHash?: string | null;
}): Promise<GmiBoardPackArtifact> {
  const artifactType = input.artifactType ?? "board_pack_pdf";
  const buffer = await renderGmiBoardPackPdfBuffer(input.editionId);
  const fingerprint = await getGmiMaterialStateFingerprint(input.editionId);
  const generatedFromStateHash = input.generatedFromStateHash ?? fingerprint.stateHash;
  const generatedAt = new Date();
  const fileName = `${input.editionId.toLowerCase()}-${artifactType.replace(/_/g, "-")}.pdf`;
  const artifact = {
    id: artifactId(),
    editionId: input.editionId,
    snapshotId: input.snapshotId ?? null,
    artifactType,
    fileName,
    storagePath: null,
    publicUrl: `/api/gmi/board-pack?edition=${encodeURIComponent(input.editionId)}&format=pdf`,
    contentHash: sha256(buffer),
    generatedFromStateHash,
    generatedAt,
    generatedBy: input.generatedBy ?? null,
    status: "generated" as const,
    errorMessage: null,
  };

  await prisma.$executeRaw`
    INSERT INTO "gmi_board_pack_artifacts" (
      "id",
      "edition_id",
      "snapshot_id",
      "artifact_type",
      "file_name",
      "storage_path",
      "public_url",
      "content_hash",
      "generated_from_state_hash",
      "generated_at",
      "generated_by",
      "status",
      "error_message",
      "updated_at"
    )
    VALUES (
      ${artifact.id},
      ${artifact.editionId},
      ${artifact.snapshotId},
      ${artifact.artifactType},
      ${artifact.fileName},
      ${artifact.storagePath},
      ${artifact.publicUrl},
      ${artifact.contentHash},
      ${artifact.generatedFromStateHash},
      ${artifact.generatedAt},
      ${artifact.generatedBy},
      ${artifact.status},
      ${artifact.errorMessage},
      ${artifact.generatedAt}
    )
  `;

  return {
    ...artifact,
    generatedAt: artifact.generatedAt.toISOString(),
    createdAt: generatedAt.toISOString(),
    updatedAt: generatedAt.toISOString(),
  };
}
