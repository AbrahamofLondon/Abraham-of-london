/* ============================================================================
   FILE: lib/diagnostics/constitutional-handoff.ts
   PURPOSE:
   - Carry only opaque constitutional handoff references into downstream pages
   - Prevent the browser from storing the real inherited bridge payload
============================================================================ */

import {
  clearAllSecureStateReferences,
  clearSecureStateReference,
  readSecureStateReference,
  writeSecureStateReference,
} from "@/lib/security/secure-client-state";

export type ConstitutionalHandoffStage =
  | "team-assessment"
  | "executive-reporting"
  | "strategy-room";

export type ConstitutionalHandoffPayload = {
  token: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function writeConstitutionalHandoff(
  stage: ConstitutionalHandoffStage,
  payload: ConstitutionalHandoffPayload,
): void {
  if (!isBrowser()) return;
  writeSecureStateReference(stage, payload.token);
}

export function readConstitutionalHandoff(
  stage: ConstitutionalHandoffStage,
): ConstitutionalHandoffPayload | null {
  if (!isBrowser()) return null;
  const token = readSecureStateReference(stage);
  return token ? { token } : null;
}

export function clearConstitutionalHandoff(
  stage: ConstitutionalHandoffStage,
): void {
  if (!isBrowser()) return;
  clearSecureStateReference(stage);
}

export function clearAllConstitutionalHandoffs(): void {
  if (!isBrowser()) return;
  clearAllSecureStateReferences([
    "team-assessment",
    "executive-reporting",
    "strategy-room",
  ]);
}
