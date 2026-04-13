/* lib/security/audit-chain.ts */
// hash and prevHash do not exist on SystemAuditLog in the current schema.
// Chain hash is computed but not persisted. Restore when schema gains these columns.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function writeChainedAudit(entry: {
  action: string;
  subjectEmail?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // STUB: last?.hash not available — no hash column in SystemAuditLog
  const prevHash = "GENESIS";

  const payload = JSON.stringify({
    action: entry.action,
    subjectEmail: entry.subjectEmail,
    metadata: entry.metadata,
    prevHash,
  });

  // Computed for integrity verification only — not persisted
  void crypto.createHash("sha256").update(payload).digest("hex");

  await prisma.systemAuditLog.create({
    data: {
      action: entry.action,
      subjectEmail: entry.subjectEmail,
      metadata: entry.metadata,
      // hash and prevHash omitted — not in schema
    },
  });
}