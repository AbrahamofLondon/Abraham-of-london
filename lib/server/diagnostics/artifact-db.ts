import "server-only";
import { prisma } from "@/lib/prisma.server";

export async function upsertArtifactDB(record: {
  diagnosticRef: string;
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
  return prisma.diagnosticArtifact.upsert({
    where: {
      diagnosticRef_version_kind: {
        diagnosticRef: record.diagnosticRef,
        version: record.version,
        kind: "pdf",
      },
    },
    update: {
      ...record,
    },
    create: {
      ...record,
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