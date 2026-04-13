// lib/server/diagnostics/lineage.ts
import "server-only";
import { prisma } from "@/lib/prisma.server";

export async function writeLineageEvent(input: {
  diagnosticRef: string;
  diagnosticId?: string | null;
  artifactId?: string | null;
  parentArtifactId?: string | null;
  eventType: string;
  version?: string | null;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  // diagnosticId is required by the Prisma relation; derive from artifactId lookup or use a sentinel
  const diagnosticId = input.diagnosticId || input.artifactId || input.diagnosticRef;
  return prisma.diagnosticLineageEvent.create({
    data: {
      diagnosticRef: input.diagnosticRef,
      diagnosticId,
      artifactId: input.artifactId || null,
      parentArtifactId: input.parentArtifactId || null,
      eventType: input.eventType,
      version: input.version || null,
      actor: input.actor || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}