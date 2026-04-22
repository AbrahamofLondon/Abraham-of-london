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

/** Intelligence layer — structured cross-stage pattern accumulation */
export type ThreadIntelligence = {
  /** Patterns that persist across 2+ stages */
  persistentPatterns: string[];
  /** Risks that escalated from one stage to the next */
  escalatingRisks: string[];
  /** Contradictions between user claims and measured evidence */
  confirmedContradictions: string[];
  /** Tensions identified but not yet resolved or classified */
  unresolvedTensions: string[];
  /** LLM-enriched cross-stage narrative (null if not yet interpreted) */
  enrichedNarrative?: string | null;
};

export type TensionThread = {
  id: string;
  createdAt: string;
  updatedAt: string;
  stagesCompleted: string[];
  tensions: TensionSignal[];
  dominantPatterns: string[];
  escalationLevel: EscalationLevel;
  narrativeSummary?: string;
  /** Structured intelligence layer — populated after 2+ stages */
  intelligence?: ThreadIntelligence;
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
    intelligence: {
      persistentPatterns: [],
      escalatingRisks: [],
      confirmedContradictions: [],
      unresolvedTensions: [],
    },
  };
}

/**
 * Derive structured intelligence from accumulated tension signals.
 * Pure deterministic analysis — no LLM. Runs after each stage completion.
 */
export function deriveThreadIntelligence(thread: TensionThread): ThreadIntelligence {
  const tensions = thread.tensions;
  const stages = new Set(tensions.map((t) => t.source));

  // Persistent patterns: domains that appear in 2+ stages
  const domainStages: Record<string, Set<string>> = {};
  for (const t of tensions) {
    (domainStages[t.domain] ??= new Set()).add(t.source);
  }
  const persistentPatterns = Object.entries(domainStages)
    .filter(([, sources]) => sources.size >= 2)
    .map(([domain, sources]) => `${domain} (confirmed across ${[...sources].join(", ")})`);

  // Escalating risks: signals that increased in severity across stages
  const domainSeverity: Record<string, Array<{ source: string; severity: string }>> = {};
  for (const t of tensions) {
    (domainSeverity[t.domain] ??= []).push({ source: t.source, severity: t.severity });
  }
  const severityRank = { low: 1, medium: 2, high: 3 };
  const escalatingRisks = Object.entries(domainSeverity)
    .filter(([, entries]) => {
      if (entries.length < 2) return false;
      const ranked = entries.map((e) => severityRank[e.severity as keyof typeof severityRank] ?? 0);
      return (ranked[ranked.length - 1] ?? 0) > (ranked[0] ?? 0);
    })
    .map(([domain]) => `${domain}: severity escalated across stages`);

  // Confirmed contradictions: high severity tensions with conflicting evidence
  const contradictions: string[] = [];
  const highTensions = tensions.filter((t) => t.severity === "high");
  for (const t of highTensions) {
    const sameDomainDifferentStage = tensions.filter(
      (other) => other.domain === t.domain && other.source !== t.source && other.severity !== t.severity,
    );
    if (sameDomainDifferentStage.length > 0) {
      contradictions.push(
        `${t.domain}: ${t.severity} in ${t.source} vs ${sameDomainDifferentStage[0]!.severity} in ${sameDomainDifferentStage[0]!.source}`,
      );
    }
  }

  // Unresolved tensions: high-severity signals from the most recent stage only
  const latestStage = thread.stagesCompleted[thread.stagesCompleted.length - 1];
  const unresolvedTensions = tensions
    .filter((t) => t.source === latestStage && t.severity === "high")
    .map((t) => `${t.domain}: ${t.signal}`);

  return {
    persistentPatterns,
    escalatingRisks,
    confirmedContradictions: [...new Set(contradictions)],
    unresolvedTensions,
    enrichedNarrative: thread.intelligence?.enrichedNarrative ?? null,
  };
}

/**
 * Update thread intelligence after a new stage is completed.
 * Call this after adding new tensions to the thread.
 */
export function updateThreadIntelligence(thread: TensionThread): TensionThread {
  return {
    ...thread,
    updatedAt: new Date().toISOString(),
    intelligence: deriveThreadIntelligence(thread),
  };
}
