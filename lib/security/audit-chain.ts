/* lib/security/audit-chain.ts */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function writeChainedAudit(entry: {
  action: string;
  subjectEmail?: string;
  metadata?: any;
}) {
  const last = await prisma.systemAuditLog.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const prevHash = last?.hash || "GENESIS";

  const payload = JSON.stringify({
    action: entry.action,
    subjectEmail: entry.subjectEmail,
    metadata: entry.metadata,
    prevHash,
  });

  const hash = crypto.createHash("sha256").update(payload).digest("hex");

  return prisma.systemAuditLog.create({
    data: {
      action: entry.action,
      actorEmail: entry.subjectEmail,
      metadata: entry.metadata != null ? JSON.stringify(entry.metadata) : undefined,
      hash,
      prevHash,
    },
  });
}