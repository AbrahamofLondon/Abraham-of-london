/* lib/server/diagnostics/report-issuer.ts */
import "server-only";

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import crypto from "crypto";
import { pdf } from "@react-pdf/renderer";

import { prisma } from "@/lib/prisma.server";
import type {
  DiagnosticRecordDTO,
  IssueDiagnosticReportResult,
} from "@/lib/diagnostics/types";
import { getDiagnosticRecordById } from "@/lib/diagnostics/store";
import DiagnosticReportDocument from "@/lib/diagnostics/pdf/DiagnosticReportDocument";
import { getDiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage";

export type IssueDiagnosticReportInput = {
  diagnosticId: string;
  requestedBy?: string | null;
  forceRegenerate?: boolean;
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function cleanFilePart(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeDiagnosticReference(type: string, id: string): string {
  const prefix =
    String(type || "diag")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
      .slice(0, 16) || "DIAG";

  return `${prefix}-${id}`;
}

function buildVersion(nextOrdinal: number): string {
  return `v${nextOrdinal}`;
}

function makeFileName(record: DiagnosticRecordDTO, version: string): string {
  const typePart = cleanFilePart(record.diagnosticType || "diagnostic");
  const idPart = cleanFilePart(record.id || "record");
  return `${typePart}-${idPart}-${version}.pdf`;
}

function makeObjectKey(record: DiagnosticRecordDTO, version: string): string {
  const typePart = cleanFilePart(record.diagnosticType || "diagnostic");
  const idPart = cleanFilePart(record.id || "record");
  return `diagnostics/${typePart}/${idPart}/${version}.pdf`;
}

async function renderDiagnosticPdf(record: DiagnosticRecordDTO): Promise<Buffer> {
  const instance = pdf(
    React.createElement(DiagnosticReportDocument, { record }),
  );

  const raw = await instance.toBuffer();
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw as any);
}

function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function getNextVersion(diagnosticRef: string): Promise<string> {
  const existing = await prisma.diagnosticArtifact.findMany({
    where: {
      diagnosticRef,
      kind: "pdf",
    },
    select: {
      version: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const ordinals = existing
    .map((x) => {
      const m = String(x.version || "").match(/^v(\d+)$/i);
      return m ? Number(m[1]) : 0;
    })
    .filter((n) => Number.isFinite(n) && n > 0);

  const next = ordinals.length ? Math.max(...ordinals) + 1 : 1;
  return buildVersion(next);
}

async function writeAuditEvent(input: {
  diagnosticRef: string;
  diagnosticId: string;
  action: string;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.diagnosticAuditEvent.create({
    data: {
      diagnosticRef: input.diagnosticRef,
      diagnosticId: input.diagnosticId,
      action: input.action,
      actor: input.actor || null,
      metadata: input.metadata || {},
    },
  });
}

async function writeLineageEvent(input: {
  diagnosticRef: string;
  diagnosticId: string;
  artifactId?: string | null;
  parentArtifactId?: string | null;
  eventType: string;
  version?: string | null;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.diagnosticLineageEvent.create({
    data: {
      diagnosticRef: input.diagnosticRef,
      diagnosticId: input.diagnosticId,
      artifactId: input.artifactId || null,
      parentArtifactId: input.parentArtifactId || null,
      eventType: input.eventType,
      version: input.version || null,
      actor: input.actor || null,
      metadata: input.metadata || {},
    },
  });
}

export async function issueDiagnosticReportFromRecord(
  input: IssueDiagnosticReportInput,
): Promise<IssueDiagnosticReportResult> {
  const diagnosticId = safeString(input?.diagnosticId).trim();
  const requestedBy = input?.requestedBy ?? null;
  const forceRegenerate = Boolean(input?.forceRegenerate);

  if (!diagnosticId) {
    throw new Error("DIAGNOSTIC_ID_REQUIRED");
  }

  const record = await getDiagnosticRecordById(diagnosticId);
  if (!record) {
    throw new Error("DIAGNOSTIC_NOT_FOUND");
  }

  const diagnosticRef = record.reference || makeDiagnosticReference(record.diagnosticType, record.id);

  if (!forceRegenerate) {
    const existing = await prisma.diagnosticArtifact.findFirst({
      where: {
        diagnosticId: record.id,
        kind: "pdf",
        isRevoked: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existing) {
      return {
        ok: true,
        diagnosticId: record.id,
        diagnosticRef,
        artifactId: existing.id,
        version: existing.version,
        objectKey: existing.objectKey,
        fileName: existing.fileName,
        sha256: existing.sha256,
        byteLength: existing.byteLength,
        storageProvider: existing.storageProvider,
        bucket: existing.bucket || null,
        publicPath: existing.publicPath || null,
      };
    }
  }

  await prisma.diagnosticRecord.update({
    where: { id: record.id },
    data: {
      reportStatus: "pending",
    },
  });

  const previousArtifact = await prisma.diagnosticArtifact.findFirst({
    where: {
      diagnosticId: record.id,
      kind: "pdf",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  try {
    const version = await getNextVersion(diagnosticRef);
    const fileName = makeFileName(record, version);
    const objectKey = makeObjectKey(record, version);

    const buffer = await renderDiagnosticPdf(record);
    const digest = sha256(buffer);

    const adapter = getDiagnosticStorageAdapter();
    const stored = await adapter.putObject({
      objectKey,
      contentType: "application/pdf",
      body: buffer,
      fileName,
      sha256: digest,
    });

    const artifact = await prisma.diagnosticArtifact.create({
      data: {
        diagnosticRef,
        diagnosticId: record.id,
        reportId: record.id,
        version,
        kind: "pdf",
        fileName,
        mimeType: "application/pdf",
        byteLength: buffer.length,
        sha256: digest,
        storageProvider: stored.provider,
        objectKey: stored.objectKey,
        bucket: stored.bucket || null,
        etag: stored.etag || null,
        publicPath: null,
        retentionClass: "standard",
        createdBy: requestedBy,
      },
    });

    await prisma.diagnosticRecord.update({
      where: { id: record.id },
      data: {
        reportStatus: "generated",
        notes: requestedBy
          ? record.notes
            ? `${record.notes}\n[REPORT_GENERATED_BY] ${requestedBy}`
            : `[REPORT_GENERATED_BY] ${requestedBy}`
          : record.notes,
      },
    });

    await writeAuditEvent({
      diagnosticRef,
      diagnosticId: record.id,
      action: "diagnostic.report.generated",
      actor: requestedBy,
      metadata: {
        artifactId: artifact.id,
        version,
        objectKey,
        storageProvider: stored.provider,
        byteLength: buffer.length,
        sha256: digest,
      },
    });

    await writeLineageEvent({
      diagnosticRef,
      diagnosticId: record.id,
      artifactId: artifact.id,
      parentArtifactId: previousArtifact?.id || null,
      eventType: previousArtifact ? "regenerated" : "generated",
      version,
      actor: requestedBy,
      metadata: {
        objectKey,
        sha256: digest,
      },
    });

    return {
      ok: true,
      diagnosticId: record.id,
      diagnosticRef,
      artifactId: artifact.id,
      version,
      objectKey,
      fileName,
      sha256: digest,
      byteLength: buffer.length,
      storageProvider: stored.provider,
      bucket: stored.bucket || null,
      publicPath: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    await prisma.diagnosticRecord.update({
      where: { id: record.id },
      data: {
        reportStatus: "failed",
        notes: record.notes
          ? `${record.notes}\n[REPORT_ERROR] ${message}`
          : `[REPORT_ERROR] ${message}`,
      },
    });

    await writeAuditEvent({
      diagnosticRef,
      diagnosticId: record.id,
      action: "diagnostic.report.failed",
      actor: requestedBy,
      metadata: {
        error: message,
      },
    });

    throw error;
  }
}