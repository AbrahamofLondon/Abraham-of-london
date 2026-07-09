/**
 * lib/intelligence/gmi-release-evidence.server.ts
 *
 * Server-only release evidence providers that inspect local packaged artifacts.
 * Evidence hash values are DERIVED from durable receipt (immutable source truth),
 * not hardcoded. Keep Node built-ins out of the shared release evidence module
 * so Next client compilation paths never attempt to bundle filesystem or crypto.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { getDurableReceipt } from "./gmi-release-store.server";
import type { PdfExportEvidence } from "./gmi-release-evidence";

// Artifact metadata: file path only. Hash values are fetched from durable receipt.
const PDF_ARTIFACTS: Record<string, { path: string }> = {
  "GMI-Q2-2026": {
    path: "public/assets/downloads/global-market-intelligence-report-q2-2026.pdf",
  },
};

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export async function getServerPdfExportEvidence(editionId: string): Promise<PdfExportEvidence> {
  const artifact = PDF_ARTIFACTS[editionId];
  if (!artifact) {
    return { exists: false, hash: null, generatedAt: null, reportContentHash: null, sourceSnapshotHash: null, matchesCurrentCandidate: false, candidateHash: null };
  }

  const absolutePath = join(process.cwd(), artifact.path);
  if (!existsSync(absolutePath)) {
    return { exists: false, hash: null, generatedAt: null, reportContentHash: null, sourceSnapshotHash: null, matchesCurrentCandidate: false, candidateHash: null };
  }

  const record = getMarketIntelligenceRecord(editionId);
  // Receipt is immutable source truth for released editions.
  const receipt = await getDurableReceipt(editionId);
  const hash = sha256File(absolutePath);
  const generatedAt = statSync(absolutePath).mtime.toISOString();
  const matchesCurrentCandidate = Boolean(record && record.lifecycleState !== "DRAFT" && record.lifecycleState !== "PLANNED" && record.lifecycleState !== "EVIDENCE_COLLECTION");

  return {
    exists: true,
    hash,
    generatedAt,
    // Receipt-derived values are authoritative for released editions.
    reportContentHash: receipt?.reportContentHash ?? null,
    sourceSnapshotHash: receipt?.sourceSnapshotHash ?? null,
    matchesCurrentCandidate,
    candidateHash: receipt?.candidateHash ?? null,
  };
}
