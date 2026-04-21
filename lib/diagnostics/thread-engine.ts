/**
 * lib/diagnostics/thread-engine.ts — Tension thread merge + escalation logic
 *
 * Merges incoming tension signals into the persistent thread.
 * Deduplicates by signal type, escalates severity on repeat detection,
 * and recalculates escalation level.
 */

import type { TensionSignal, TensionThread, EscalationLevel } from "./tension-thread";
import { readTensionThread, saveTensionThread, createEmptyThread } from "./tension-thread";

const SEVERITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3 };

/**
 * Merge incoming signals into the thread. Deduplicates by signal name.
 * If a signal is seen again from a different stage, severity escalates.
 */
export function mergeThread(
  existing: TensionThread | null,
  incoming: TensionSignal[],
  stage: string,
): TensionThread {
  const thread = existing ?? createEmptyThread();
  const now = new Date().toISOString();

  // Deduplicate: if signal already exists, escalate severity
  const merged = [...thread.tensions];
  for (const signal of incoming) {
    const existingIdx = merged.findIndex(s => s.signal === signal.signal);
    if (existingIdx >= 0) {
      const prev = merged[existingIdx]!;
      // Escalate: if seen again from a different source, bump severity
      if (prev.source !== signal.source) {
        const newSeverity = Math.min(
          (SEVERITY_RANK[prev.severity] ?? 1) + 1,
          3,
        );
        merged[existingIdx] = {
          ...prev,
          severity: newSeverity === 3 ? "high" : newSeverity === 2 ? "medium" : "low",
          evidence: `${prev.evidence} → confirmed by ${signal.source}: ${signal.evidence}`,
        };
      }
    } else {
      merged.push(signal);
    }
  }

  // Recalculate dominant patterns (signals with medium+ severity)
  const dominantPatterns = merged
    .filter(s => s.severity === "medium" || s.severity === "high")
    .map(s => s.signal);

  // Mark stage as completed
  const stagesCompleted = thread.stagesCompleted.includes(stage)
    ? thread.stagesCompleted
    : [...thread.stagesCompleted, stage];

  return {
    ...thread,
    updatedAt: now,
    stagesCompleted,
    tensions: merged,
    dominantPatterns: [...new Set(dominantPatterns)],
    escalationLevel: determineEscalation(merged),
  };
}

/**
 * Escalation logic based on signal count and severity.
 */
function determineEscalation(tensions: TensionSignal[]): EscalationLevel {
  const highCount = tensions.filter(t => t.severity === "high").length;
  const mediumCount = tensions.filter(t => t.severity === "medium").length;
  const total = tensions.length;

  if (highCount > 0 || total >= 4) return "intervention_required";
  if (mediumCount >= 2 || total >= 3) return "structural_risk";
  if (total >= 1) return "pattern_detected";
  return "none";
}

/**
 * Convenience: merge signals into the stored thread and persist.
 */
export function mergeAndSaveTensions(
  incoming: TensionSignal[],
  stage: string,
): TensionThread {
  const existing = readTensionThread();
  const updated = mergeThread(existing, incoming, stage);
  saveTensionThread(updated);
  return updated;
}
