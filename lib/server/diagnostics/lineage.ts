// lib/server/diagnostics/lineage.ts
import "server-only";
import { prisma } from "@/lib/prisma.server";

export async function writeLineageEvent(input: {
  diagnosticRef: string;
  artifactId?: string | null;
  parentArtifactId?: string | null;
  eventType: string;
  version?: string | null;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.diagnosticLineageEvent.create({
    data: {
      diagnosticRef: input.diagnosticRef,
      artifactId: input.artifactId || null,
      parentArtifactId: input.parentArtifactId || null,
      eventType: input.eventType,
      version: input.version || null,
      actor: input.actor || null,
      metadata: input.metadata || undefined,
    },
  });
}