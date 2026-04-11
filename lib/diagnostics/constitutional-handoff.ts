/* ============================================================================
   FILE: lib/diagnostics/constitutional-handoff.ts
   PURPOSE:
   - Carry inherited constitutional signal into downstream pages
   - Session-scoped, browser-only, safe for navigation handoff
============================================================================ */

import type { ConstitutionalBridgeBundle } from "@/lib/diagnostics/constitutional-bridge";

export type ConstitutionalHandoffStage =
  | "team-assessment"
  | "executive-reporting"
  | "strategy-room";

export type ConstitutionalHandoffPayload = {
  source: "constitutional-intake";
  reportId: string | null;
  createdAt: string;
  bridge: ConstitutionalBridgeBundle;
};

const STORAGE_PREFIX = "aol_constitutional_handoff_v1";

function getStorageKey(stage: ConstitutionalHandoffStage): string {
  return `${STORAGE_PREFIX}:${stage}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function writeConstitutionalHandoff(
  stage: ConstitutionalHandoffStage,
  payload: ConstitutionalHandoffPayload,
): void {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(getStorageKey(stage), JSON.stringify(payload));
  } catch {
    // ignore storage failure
  }
}

export function readConstitutionalHandoff(
  stage: ConstitutionalHandoffStage,
): ConstitutionalHandoffPayload | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(stage));
    if (!raw) return null;
    return JSON.parse(raw) as ConstitutionalHandoffPayload;
  } catch {
    return null;
  }
}

export function clearConstitutionalHandoff(
  stage: ConstitutionalHandoffStage,
): void {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(getStorageKey(stage));
  } catch {
    // ignore
  }
}

export function clearAllConstitutionalHandoffs(): void {
  if (!isBrowser()) return;

  try {
    const stages: ConstitutionalHandoffStage[] = [
      "team-assessment",
      "executive-reporting",
      "strategy-room",
    ];

    for (const stage of stages) {
      window.sessionStorage.removeItem(getStorageKey(stage));
    }
  } catch {
    // ignore
  }
}