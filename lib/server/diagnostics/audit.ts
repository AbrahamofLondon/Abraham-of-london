// lib/server/diagnostics/audit.ts
import "server-only";
import { prisma } from "@/lib/prisma.server";

export async function writeDiagnosticAudit(input: {
  diagnosticRef?: string | null;
  action: string;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.diagnosticAuditEvent.create({
    data: {
      diagnosticRef: input.diagnosticRef || null,
      action: input.action,
      actor: input.actor || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}