import "server-only";

/* ============================================================================
   FILE: lib/server/diagnostics/revocation.ts
   PURPOSE:
   - Revoke diagnostic artifacts using schema-aligned fields
   - Supports optional version targeting
   - Idempotent (safe to call multiple times)
============================================================================ */

import { prisma } from "@/lib/prisma";

export type RevokeArtifactInput = {
  diagnosticRef: string;
  version?: string | null;
  reason?: string | null;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

/**
 * Revoke diagnostic artifacts.
 *
 * Schema-aligned:
 * - Uses `isRevoked`, not `status`
 * - Uses `version` as string
 */
export async function revokeArtifact(
  input: RevokeArtifactInput,
): Promise<number> {
  const diagnosticRef = clean(input?.diagnosticRef);
  const version = input?.version ? clean(input.version) : null;
  const reason = clean(input?.reason) || "manual_revoke";

  if (!diagnosticRef) {
    throw new Error("DIAGNOSTIC_REF_REQUIRED");
  }

  const where: any = {
    diagnosticRef,
    isRevoked: false, // IMPORTANT: prevents double-revocation
  };

  if (version) {
    where.version = version;
  }

  const result = await prisma.diagnosticArtifact.updateMany({
    where,
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return result.count;
}
