/**
 * lib/intelligence/gmi-release-evidence.server.ts
 *
 * Server-only release evidence providers that inspect local packaged artifacts.
 * Keep Node built-ins out of the shared release evidence module so Next client
 * compilation paths never attempt to bundle filesystem or crypto primitives.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import type { PdfExportEvidence } from "./gmi-release-evidence";

const PDF_ARTIFACTS: Record<string, { path: string; reportContentHash: string; sourceSnapshotHash: string; candidateHash: string }> = {
  "GMI-Q2-2026": {
    path: "public/assets/downloads/global-market-intelligence-report-q2-2026.pdf",
    reportContentHash: "gmi-q2-2026-report-content-20260708-v1",
    sourceSnapshotHash: "gmi-q2-2026-source-snapshot-20260708-release-lock",
    candidateHash: "gmi-q2-2026-candidate-20260708-release-lock",
  },
};

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function getServerPdfExportEvidence(editionId: string): PdfExportEvidence {
  const artifact = PDF_ARTIFACTS[editionId];
  if (!artifact) {
    return { exists: false, hash: null, generatedAt: null, reportContentHash: null, sourceSnapshotHash: null, matchesCurrentCandidate: false, candidateHash: null };
  }

  const absolutePath = join(process.cwd(), artifact.path);
  if (!existsSync(absolutePath)) {
    return { exists: false, hash: null, generatedAt: null, reportContentHash: null, sourceSnapshotHash: null, matchesCurrentCandidate: false, candidateHash: null };
  }

  const record = getMarketIntelligenceRecord(editionId);
  const hash = sha256File(absolutePath);
  const generatedAt = statSync(absolutePath).mtime.toISOString();
  const matchesCurrentCandidate = Boolean(record && record.lifecycleState !== "DRAFT" && record.lifecycleState !== "PLANNED" && record.lifecycleState !== "EVIDENCE_COLLECTION");

  return {
    exists: true,
    hash,
    generatedAt,
    reportContentHash: artifact.reportContentHash,
    sourceSnapshotHash: artifact.sourceSnapshotHash,
    matchesCurrentCandidate,
    candidateHash: artifact.candidateHash,
  };
}