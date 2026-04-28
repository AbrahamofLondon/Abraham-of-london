import "server-only";

import { createEncryptedStateToken, decryptEncryptedStateToken } from "@/lib/security/secure-client-state";

export function createDecisionSessionToken(reportId: string): string {
  return createEncryptedStateToken({
    kind: "constitutional_handoff",
    reportId,
    issuedAt: new Date().toISOString(),
    version: 1,
  });
}

export function readDecisionSessionToken(token: string): string | null {
  return decryptEncryptedStateToken(token)?.reportId ?? null;
}
