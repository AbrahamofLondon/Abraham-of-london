import "server-only";
import { prisma } from "@/lib/prisma.server";
import { DiagnosticStorageProvider } from "@prisma/client";

export async function upsertArtifactDB(record: {
  diagnosticRef: string;
  diagnosticId?: string | null;
  reportId: string;
  version: string;
  fileName: string;
  mimeType: string;
  byteLength: number;
  sha256: string;
  storageProvider: string;
  objectKey: string;
  bucket?: string | null;
  etag?: string | null;
  createdBy?: string | null;
}) {
  const resolvedDiagnosticId = record.diagnosticId || record.reportId;
  const provider = record.storageProvider as DiagnosticStorageProvider;

  const sharedData = {
    reportId: record.reportId,
    version: record.version,
    fileName: record.fileName,
    mimeType: record.mimeType,
    byteLength: record.byteLength,
    sha256: record.sha256,
    storageProvider: provider,
    objectKey: record.objectKey,
    bucket: record.bucket ?? null,
    etag: record.etag ?? null,
    createdBy: record.createdBy ?? null,
  };

  return prisma.diagnosticArtifact.upsert({
    where: {
      diagnosticRef_version_kind: {
        diagnosticRef: record.diagnosticRef,
        version: record.version,
        kind: "pdf",
      },
    },
    update: sharedData,
    create: {
      ...sharedData,
      diagnosticRef: record.diagnosticRef,
      diagnosticId: resolvedDiagnosticId,
      kind: "pdf",
    },
  });
}

export async function getLatestArtifactDB(diagnosticRef: string) {
  return prisma.diagnosticArtifact.findFirst({
    where: {
      diagnosticRef,
      isRevoked: false,
    },
    orderBy: [
      { version: "desc" },
      { createdAt: "desc" },
    ],
  });
}