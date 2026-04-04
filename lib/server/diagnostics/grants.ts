// lib/server/diagnostics/grants.ts
import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import { writeLineageEvent } from "./lineage";

function entitlementKey() {
  return crypto.randomBytes(24).toString("hex");
}

export async function issueArtifactGrant(input: {
  diagnosticRef: string;
  artifactId: string;
  granteeEmail: string;
  expiresAt?: Date | null;
  createdBy?: string | null;
}) {
  const grant = await prisma.diagnosticArtifactAccessGrant.create({
    data: {
      diagnosticRef: input.diagnosticRef,
      artifactId: input.artifactId,
      granteeEmail: input.granteeEmail.trim().toLowerCase(),
      entitlementKey: entitlementKey(),
      expiresAt: input.expiresAt || null,
      createdBy: input.createdBy || null,
    },
  });

  await writeLineageEvent({
    diagnosticRef: input.diagnosticRef,
    artifactId: input.artifactId,
    eventType: "grant_issued",
    actor: input.createdBy || "system",
    metadata: {
      granteeEmail: grant.granteeEmail,
      grantId: grant.id,
    },
  });

  return grant;
}

export async function validateArtifactGrant(input: {
  diagnosticRef: string;
  artifactId: string;
  entitlementKey: string;
  granteeEmail?: string | null;
}) {
  const now = new Date();

  const grant = await prisma.diagnosticArtifactAccessGrant.findFirst({
    where: {
      diagnosticRef: input.diagnosticRef,
      artifactId: input.artifactId,
      entitlementKey: input.entitlementKey,
      status: "active",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
  });

  if (!grant) return null;

  if (input.granteeEmail && grant.granteeEmail !== input.granteeEmail.trim().toLowerCase()) {
    return null;
  }

  return grant;
}