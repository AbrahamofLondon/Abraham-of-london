/**
 * lib/diagnostics/tension-thread.ts — Cross-stage tension memory
 *
 * Tracks structured diagnostic signals that persist across assessment stages.
 * Stored in sessionStorage alongside the existing ConstitutionalThread.
 * Read by Strategy Room and Executive Reporting for narrative continuity.
 */

export type TensionSignal = {
  domain: string;
  signal: string;
  severity: "low" | "medium" | "high";
  source: "purpose_alignment" | "constitutional" | "team" | "enterprise";
  evidence: string;
};

export type EscalationLevel =
  | "none"
  | "pattern_detected"
  | "structural_risk"
  | "intervention_required";

export type TensionThread = {
  id: string;
  createdAt: string;
  updatedAt: string;
  stagesCompleted: string[];
  tensions: TensionSignal[];
  dominantPatterns: string[];
  escalationLevel: EscalationLevel;
  narrativeSummary?: string;
};

const STORAGE_KEY = "aol:tension-thread";

function makeId(): string {
  return `tt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readTensionThread(): TensionThread | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TensionThread;
  } catch {
    return null;
  }
}

export function saveTensionThread(thread: TensionThread): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(thread));
  } catch {}
}

export function createEmptyThread(): TensionThread {
  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stagesCompleted: [],
    tensions: [],
    dominantPatterns: [],
    escalationLevel: "none",
  };
}
