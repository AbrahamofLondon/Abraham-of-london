// lib/server/diagnostics/artifact-service.ts
import "server-only";
import { sha256Hex } from "./signing";
import { renderDiagnosticPdf } from "./export-pdf";
import { writeArtifactObject } from "./storage";
import { saveArtifactUnified } from "./artifact-unified";
import { writeLineageEvent } from "./lineage";
import { computeExpiry } from "./retention";

export async function createDiagnosticPdfArtifact(input: {
  diagnosticRef: string;
  reportId: string;
  version: string;
  title: string;
  subjectName?: string | null;
  narrative: string;
  sections: Array<{ heading: string; body: string }>;
  score?: number | null;
  viewerEmail?: string | null;
  entitlementKey?: string | null;
  createdBy?: string | null;
  retentionClass?: string;
}) {
  const pdf = await renderDiagnosticPdf({
    title: input.title,
    diagnosticRef: input.diagnosticRef,
    reportId: input.reportId,
    version: input.version,
    subjectName: input.subjectName,
    narrative: input.narrative,
    sections: input.sections,
    score: input.score ?? null,
    viewerEmail: input.viewerEmail || null,
    entitlementKey: input.entitlementKey || null,
  });

  const fileName = `${input.diagnosticRef}-${input.version}.pdf`;
  const objectKey = `${input.diagnosticRef}/${input.version}/${fileName}`;
  const sha256 = sha256Hex(pdf);

  await writeArtifactObject({ objectKey, buffer: pdf });

  const artifact = await saveArtifactUnified({
    diagnosticRef: input.diagnosticRef,
    reportId: input.reportId,
    version: input.version,
    fileName,
    mimeType: "application/pdf",
    byteLength: pdf.length,
    sha256,
    storageProvider: "local",
    objectKey,
    bucket: null,
    etag: sha256,
    createdBy: input.createdBy || null,
    retentionClass: input.retentionClass || "standard",
    expiresAt: computeExpiry(input.retentionClass || "standard"),
  });

  await writeLineageEvent({
    diagnosticRef: input.diagnosticRef,
    artifactId: artifact.id || null,
    eventType: "created",
    version: input.version,
    actor: input.createdBy || "system",
    metadata: {
      objectKey,
      sha256,
      size: pdf.length,
      storageProvider: "local",
    },
  });

  return artifact;
}