// lib/server/diagnostics/artifact-access.ts
import "server-only";
import { prisma } from "@/lib/prisma.server";
import { validateArtifactGrant } from "./grants";
import { getDiagnosticObjectBuffer } from "./storage";
import { writeLineageEvent } from "./lineage";
import type { ArtifactAccessDecision } from "./types";

export async function authorizeArtifactRead(input: {
  diagnosticRef: string;
  artifactId: string;
  entitlementKey?: string | null;
  viewerEmail?: string | null;
}): Promise<ArtifactAccessDecision> {
  const artifact = await prisma.diagnosticArtifact.findUnique({
    where: { id: input.artifactId },
  });

  if (!artifact) return { ok: false, reason: "ARTIFACT_NOT_FOUND" };
  if (artifact.isRevoked) return { ok: false, reason: "ARTIFACT_REVOKED" };
  if (artifact.diagnosticRef !== input.diagnosticRef) return { ok: false, reason: "REF_MISMATCH" };

  if (!input.entitlementKey) return { ok: false, reason: "GRANT_REQUIRED" };

  const grant = await validateArtifactGrant({
    diagnosticRef: input.diagnosticRef,
    artifactId: input.artifactId,
    entitlementKey: input.entitlementKey,
    granteeEmail: input.viewerEmail || null,
  });

  if (!grant) return { ok: false, reason: "GRANT_INVALID" };

  return { ok: true, artifactId: artifact.id, grantId: grant.id };
}

export async function readAuthorizedArtifact(input: {
  diagnosticRef: string;
  artifactId: string;
  entitlementKey: string;
  viewerEmail?: string | null;
}) {
  const access = await authorizeArtifactRead(input);
  if (!access.ok) {
    return { access, buffer: null as Buffer | null, mimeType: null as string | null };
  }

  const artifact = await prisma.diagnosticArtifact.findUniqueOrThrow({
    where: { id: input.artifactId },
  });

  const buffer = await getDiagnosticObjectBuffer(artifact.objectKey);

  await writeLineageEvent({
    diagnosticRef: input.diagnosticRef,
    artifactId: artifact.id,
    eventType: "downloaded",
    actor: input.viewerEmail || "licensed-viewer",
    version: artifact.version,
    metadata: {
      grantId: access.grantId,
    },
  });

  return {
    access,
    buffer,
    mimeType: artifact.mimeType,
    fileName: artifact.fileName,
  };
}