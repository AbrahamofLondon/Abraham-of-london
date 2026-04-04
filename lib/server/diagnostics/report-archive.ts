/* lib/server/diagnostics/report-archive.ts */
import "server-only";

import crypto from "crypto";

import type { StoredDiagnosticRecord } from "@/lib/server/diagnostics/store";
import { resolveDiagnosticReport } from "@/lib/server/diagnostics/report-resolver";
import { buildDiagnosticReportPdfBuffer } from "@/lib/server/diagnostics/report-pdf";
import { getDiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage";
import {
  buildArtifactRecord,
  createArtifactObjectKey,
  getArtifactByVersion,
  getLatestArtifact,
  listArtifactsByDiagnosticRef,
  upsertArtifactRecord,
  type DiagnosticArtifactRecord,
} from "@/lib/server/diagnostics/artifact-registry";

export async function archiveDiagnosticPdf(args: {
  item: StoredDiagnosticRecord;
  createdBy?: string | null;
}): Promise<DiagnosticArtifactRecord> {
  const { item, createdBy = null } = args;

  const report = resolveDiagnosticReport({
    item,
    unlocked: true,
  });

  const pdfBuffer = await buildDiagnosticReportPdfBuffer({
    item,
    report,
  });

  const sha256 = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
  const storage = getDiagnosticStorageAdapter();

  const { objectKey, fileName } = createArtifactObjectKey({
    diagnosticRef: item.diagnosticRef,
    version: report.version,
    extension: "pdf",
  });

  const stored = await storage.putObject({
    objectKey,
    contentType: "application/pdf",
    body: pdfBuffer,
    fileName,
    sha256,
  });

  const record = buildArtifactRecord({
    diagnosticRef: item.diagnosticRef,
    reportId: report.reportId,
    version: report.version,
    mimeType: "application/pdf",
    byteLength: stored.byteLength,
    sha256,
    storageProvider: stored.provider,
    objectKey: stored.objectKey,
    fileName,
    createdBy,
    publicPath: null,
    bucket: stored.bucket ?? null,
    etag: stored.etag ?? null,
  });

  return upsertArtifactRecord(record);
}

export async function getArchivedDiagnosticPdf(args: {
  diagnosticRef: string;
  version?: string | null;
}): Promise<{
  artifact: DiagnosticArtifactRecord;
  bytes: Buffer;
} | null> {
  const { diagnosticRef, version } = args;

  const artifact = version
    ? getArtifactByVersion({ diagnosticRef, version, kind: "pdf" })
    : getLatestArtifact({ diagnosticRef, kind: "pdf" });

  if (!artifact) return null;

  const storage = getDiagnosticStorageAdapter();
  const bytes = await storage.getObjectBuffer(artifact.objectKey);
  if (!bytes) return null;

  return { artifact, bytes };
}

export async function getArchivedDiagnosticPdfSignedUrl(args: {
  diagnosticRef: string;
  version?: string | null;
}): Promise<{
  artifact: DiagnosticArtifactRecord;
  url: string;
  expiresInSeconds: number;
} | null> {
  const { diagnosticRef, version } = args;

  const artifact = version
    ? getArtifactByVersion({ diagnosticRef, version, kind: "pdf" })
    : getLatestArtifact({ diagnosticRef, kind: "pdf" });

  if (!artifact) return null;

  const storage = getDiagnosticStorageAdapter();
  const signed = await storage.getSignedReadUrl(artifact.objectKey, artifact.fileName);
  if (!signed) return null;

  return {
    artifact,
    url: signed.url,
    expiresInSeconds: signed.expiresInSeconds,
  };
}

export function listDiagnosticPdfArtifacts(diagnosticRef: string): DiagnosticArtifactRecord[] {
  return listArtifactsByDiagnosticRef(diagnosticRef).filter((item) => item.kind === "pdf");
}